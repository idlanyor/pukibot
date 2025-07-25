import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { PterodactylAPI } from '../services/pterodactylAPI';
import { Logger } from '../utils/logger';
import { ConnectionManager } from '../utils/connectionManager';
import { MessageFormatter } from '../utils/messageFormatter';
import { PluginLoader } from '../plugins/PluginLoader';
import { CommandContext, Command } from '../plugins/types';

export class CommandManager {
    private pluginLoader: PluginLoader;
    private commands: Map<string, any> = new Map();
    private pterodactylAPI: PterodactylAPI;

    constructor(pterodactylAPI: PterodactylAPI) {
        this.pterodactylAPI = pterodactylAPI;
        this.pluginLoader = new PluginLoader({
            pterodactylAPI: this.pterodactylAPI,
            logger: Logger,
            connectionManager: ConnectionManager
        });
        this.initializePlugins();
    }

    private async initializePlugins() {
        try {
            await this.pluginLoader.loadAllPlugins();
            this.commands = this.pluginLoader.getAllCommands();
            Logger.info(`🎯 CommandManager initialized with ${this.commands.size} commands from plugins`);
        } catch (error) {
            Logger.error('❌ Failed to initialize plugins:', error);
            throw error;
        }
    }

    async execute(commandName: string, args: string[], context: CommandContext) {
        const command = this.commands.get(commandName);
        
        if (!command) {
            const errorMessage = MessageFormatter.formatError(
                'Perintah tidak ditemukan',
                `Perintah "${commandName}" tidak tersedia`,
                'Ketik .allmenu untuk melihat daftar perintah yang tersedia'
            );
            await this.sendMessage(context.socket, context.chatId, errorMessage);
            return;
        }

        // Check admin permissions
        if (command.adminOnly && !this.isAdmin(context.sender)) {
            const errorMessage = MessageFormatter.formatError(
                'Akses ditolak',
                'Perintah ini hanya dapat digunakan oleh admin',
                'Hubungi admin jika Anda memerlukan akses khusus'
            );
            await this.sendMessage(context.socket, context.chatId, errorMessage);
            return;
        }

        Logger.info(`🔧 Executing command: ${commandName} by ${context.sender} (plugin: ${command.plugin})`);
        
        try {
            await command.execute(args, context);
        } catch (error) {
            Logger.error(`❌ Error executing command ${commandName}:`, error);
            const errorMessage = MessageFormatter.formatError(
                'Kesalahan sistem',
                'Terjadi kesalahan saat menjalankan perintah',
                'Silakan coba lagi dalam beberapa saat'
            );
            await this.sendMessage(context.socket, context.chatId, errorMessage);
        }
    }

    private async sendMessage(socket: WASocket, chatId: string, text: string): Promise<void> {
        await ConnectionManager.safeMessageSend(
            async () => {
                await socket.sendMessage(chatId, { text });
            },
            'send message'
        );
    }

    private isAdmin(sender: string): boolean {
        const ownerNumber = process.env.OWNER_NUMBER;
        const adminNumber = process.env.STORE_ADMIN;
        
        const senderNumber = sender.replace('@s.whatsapp.net', '');
        
        return senderNumber === ownerNumber || senderNumber === adminNumber;
    }

    // Get commands by category for help command
    getCommandsByCategory(category: string): Map<string, any> {
        return this.pluginLoader.getCommandsByCategory(category);
    }

    // Get all commands
    getAllCommands(): Map<string, any> {
        return new Map(this.commands);
    }

    // Get plugin statistics
    getPluginStats(): any {
        return this.pluginLoader.getPluginStats();
    }

    // Shutdown all plugins
    async shutdown(): Promise<void> {
        await this.pluginLoader.shutdown();
    }
}