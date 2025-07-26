import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { WhatsAppBot } from '../index';

export interface BotStatus {
    isRunning: boolean;
    isConnected: boolean;
    connectionState: string;
    uptime: number;
    lastActivity: string;
    messageCount: number;
    errorCount: number;
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
}

export interface BotStats {
    totalMessages: number;
    commandsProcessed: number;
    ordersCreated: number;
    ordersCompleted: number;
    serversManaged: number;
    uptime: number;
    startTime: string;
}

export class BotStateManager extends EventEmitter {
    private botInstance: WhatsAppBot | null = null;
    private isRunning: boolean = false;
    private isConnected: boolean = false;
    private connectionState: string = 'disconnected';
    private messageCount: number = 0;
    private errorCount: number = 0;
    private startTime: Date = new Date();
    private lastActivity: Date = new Date();
    private stats: BotStats;

    constructor() {
        super();
        this.stats = {
            totalMessages: 0,
            commandsProcessed: 0,
            ordersCreated: 0,
            ordersCompleted: 0,
            serversManaged: 0,
            uptime: 0,
            startTime: this.startTime.toISOString()
        };
    }

    async initialize() {
        Logger.info('🔧 Initializing Bot State Manager...');
        
        // Check if bot is already running by checking for existing process
        await this.checkBotStatus();
        
        // Setup periodic status updates
        setInterval(() => {
            this.updateStats();
            this.emit('statusChange', this.getStatus());
        }, 5000); // Update every 5 seconds

        Logger.success('✅ Bot State Manager initialized');
    }

    async startBot(): Promise<void> {
        if (this.isRunning) {
            throw new Error('Bot is already running');
        }

        try {
            Logger.info('🚀 Starting WhatsApp Bot...');
            
            // Import and start the bot
            const { WhatsAppBot } = await import('../index');
            this.botInstance = new WhatsAppBot();
            
            // Setup bot event listeners
            this.setupBotEventListeners();
            
            // Start the bot
            await this.botInstance.start();
            
            this.isRunning = true;
            this.connectionState = 'connecting';
            this.startTime = new Date();
            
            Logger.success('✅ Bot started successfully');
            this.emit('statusChange', this.getStatus());
            
        } catch (error) {
            this.errorCount++;
            Logger.error('❌ Failed to start bot:', error);
            throw error;
        }
    }

    async stopBot(): Promise<void> {
        if (!this.isRunning) {
            throw new Error('Bot is not running');
        }

        try {
            Logger.info('🛑 Stopping WhatsApp Bot...');
            
            if (this.botInstance) {
                await this.botInstance.stop();
                this.botInstance = null;
            }
            
            this.isRunning = false;
            this.isConnected = false;
            this.connectionState = 'disconnected';
            
            Logger.success('✅ Bot stopped successfully');
            this.emit('statusChange', this.getStatus());
            
        } catch (error) {
            this.errorCount++;
            Logger.error('❌ Failed to stop bot:', error);
            throw error;
        }
    }

    async restartBot(): Promise<void> {
        Logger.info('🔄 Restarting WhatsApp Bot...');
        
        if (this.isRunning) {
            await this.stopBot();
            // Wait a bit before restarting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        await this.startBot();
        Logger.success('✅ Bot restarted successfully');
    }

    getStatus(): BotStatus {
        const memUsage = process.memoryUsage();
        
        return {
            isRunning: this.isRunning,
            isConnected: this.isConnected,
            connectionState: this.connectionState,
            uptime: this.isRunning ? Date.now() - this.startTime.getTime() : 0,
            lastActivity: this.lastActivity.toISOString(),
            messageCount: this.messageCount,
            errorCount: this.errorCount,
            memory: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                total: Math.round(memUsage.heapTotal / 1024 / 1024),
                percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
            }
        };
    }

    getStats(): BotStats {
        this.updateStats();
        return { ...this.stats };
    }

    // Method to be called when messages are received
    onMessageReceived(message: any) {
        this.messageCount++;
        this.lastActivity = new Date();
        this.stats.totalMessages++;
        this.emit('messageReceived', {
            timestamp: new Date().toISOString(),
            from: message.key?.remoteJid,
            message: message.message?.conversation || '[Media/Other]'
        });
    }

    // Method to be called when commands are processed
    onCommandProcessed(command: string) {
        this.stats.commandsProcessed++;
        this.lastActivity = new Date();
        this.emit('commandProcessed', {
            timestamp: new Date().toISOString(),
            command
        });
    }

    // Method to be called when orders are created
    onOrderCreated(order: any) {
        this.stats.ordersCreated++;
        this.emit('orderUpdate', {
            type: 'created',
            order,
            timestamp: new Date().toISOString()
        });
    }

    // Method to be called when orders are completed
    onOrderCompleted(order: any) {
        this.stats.ordersCompleted++;
        this.emit('orderUpdate', {
            type: 'completed',
            order,
            timestamp: new Date().toISOString()
        });
    }

    // Method to be called when servers are managed
    onServerManaged(action: string, serverId: string) {
        this.stats.serversManaged++;
        this.emit('serverAction', {
            action,
            serverId,
            timestamp: new Date().toISOString()
        });
    }

    private async checkBotStatus() {
        // This is a placeholder - in a real implementation, you might check
        // for existing bot processes or state files
        this.isRunning = false;
        this.isConnected = false;
        this.connectionState = 'disconnected';
    }

    private setupBotEventListeners() {
        if (!this.botInstance) return;

        // Note: These would need to be implemented in the actual WhatsApp bot
        // For now, we'll simulate the connection state changes
        
        // Simulate connection events
        setTimeout(() => {
            this.isConnected = true;
            this.connectionState = 'connected';
            this.emit('statusChange', this.getStatus());
        }, 5000);
    }

    private updateStats() {
        this.stats.uptime = this.isRunning ? Date.now() - this.startTime.getTime() : 0;
    }

    async cleanup() {
        if (this.isRunning) {
            await this.stopBot();
        }
        this.removeAllListeners();
        Logger.info('🧹 Bot State Manager cleaned up');
    }

    // Method to send messages through the bot
    async sendMessage(to: string, message: string): Promise<boolean> {
        if (!this.isRunning || !this.isConnected) {
            throw new Error('Bot is not connected');
        }

        try {
            // This would integrate with the actual bot's message sending
            // For now, we'll just log and return success
            Logger.info(`📤 Sending message to ${to}: ${message}`);
            
            // Simulate message sending
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return true;
        } catch (error) {
            this.errorCount++;
            Logger.error('❌ Failed to send message:', error);
            throw error;
        }
    }

    // Method to get recent messages (placeholder)
    async getRecentMessages(limit: number = 50): Promise<any[]> {
        // This would integrate with the actual message storage
        // For now, return empty array
        return [];
    }

    // Method to get bot logs
    async getLogs(limit: number = 100): Promise<any[]> {
        // This would integrate with the actual logging system
        // For now, return empty array
        return [];
    }
}