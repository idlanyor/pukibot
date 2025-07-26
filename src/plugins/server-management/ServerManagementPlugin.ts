import { BasePlugin } from '../BasePlugin';
import { Command, PluginMetadata } from '../types';
import { Logger } from '../../utils/logger';
import { ServerMonitoringService } from '../../services/ServerMonitoringService';
import { SubscriptionManager } from '../../services/SubscriptionManager';
import { PterodactylAdminAPI } from '../../services/PterodactylAdminAPI';

export class ServerManagementPlugin extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'ServerManagementPlugin',
        version: '1.0.0',
        description: 'Comprehensive server management with monitoring, subscriptions, and WhatsApp commands',
        category: 'any',
        author: 'PukiBot Team',
        commands: ['serverstatus', 'serverlist', 'serverinfo', 'serversuspend', 'serverresume', 'serverrestart', 'myservers', 'serverusage']
    };

    private serverMonitoring: ServerMonitoringService;
    private subscriptionManager: SubscriptionManager;
    private pterodactylAPI: PterodactylAdminAPI;

    constructor(dependencies: any = {}) {
        super(dependencies);

        // Initialize services
        this.pterodactylAPI = new PterodactylAdminAPI();
        this.serverMonitoring = ServerMonitoringService.getInstance();
        this.subscriptionManager = SubscriptionManager.getInstance();
    }

    protected async onInitialize(): Promise<void> {
        Logger.info('🖥️ Initializing ServerManagementPlugin...');
        
        // Start monitoring services
        await this.serverMonitoring.startMonitoring();
        await this.subscriptionManager.startAutomatedTasks();
        
        Logger.info('✅ ServerManagementPlugin initialized successfully');
    }

    protected async onShutdown(): Promise<void> {
        Logger.info('🖥️ Shutting down ServerManagementPlugin...');
        
        // Stop monitoring services
        await this.serverMonitoring.stopMonitoring();
        await this.subscriptionManager.stopAutomatedTasks();
        
        Logger.info('✅ ServerManagementPlugin shut down successfully');
    }

    protected registerCommands(): void {
        // Admin Commands
        this.commands.set('serverstatus', {
            name: 'serverstatus',
            description: 'Get detailed server status and metrics',
            usage: '!serverstatus <server_id>',
            category: 'admin',
            adminOnly: true,
            execute: this.handleServerStatus.bind(this)
        });

        this.commands.set('serverlist', {
            name: 'serverlist',
            description: 'List all servers with status overview',
            usage: '!serverlist [filter]',
            category: 'admin',
            adminOnly: true,
            execute: this.handleServerList.bind(this)
        });

        this.commands.set('serverinfo', {
            name: 'serverinfo',
            description: 'Get comprehensive server information',
            usage: '!serverinfo <server_id>',
            category: 'admin',
            adminOnly: true,
            execute: this.handleServerInfo.bind(this)
        });

        this.commands.set('serversuspend', {
            name: 'serversuspend',
            description: 'Suspend a server',
            usage: '!serversuspend <server_id> [reason]',
            category: 'admin',
            adminOnly: true,
            execute: this.handleServerSuspend.bind(this)
        });

        this.commands.set('serverresume', {
            name: 'serverresume',
            description: 'Resume a suspended server',
            usage: '!serverresume <server_id>',
            category: 'admin',
            adminOnly: true,
            execute: this.handleServerResume.bind(this)
        });

        this.commands.set('serverrestart', {
            name: 'serverrestart',
            description: 'Restart a server',
            usage: '!serverrestart <server_id>',
            category: 'admin',
            adminOnly: true,
            execute: this.handleServerRestart.bind(this)
        });

        // Customer Commands
        this.commands.set('myservers', {
            name: 'myservers',
            description: 'View your servers and their status',
            usage: '!myservers',
            category: 'customer',
            adminOnly: false,
            execute: this.handleMyServers.bind(this)
        });

        this.commands.set('serverusage', {
            name: 'serverusage',
            description: 'Check your server resource usage',
            usage: '!serverusage <server_id>',
            category: 'customer',
            adminOnly: false,
            handler: this.handleServerUsage.bind(this)
        });
    }

    // Admin Command Handlers
    private async handleServerStatus(message: any, args: string[]): Promise<void> {
        try {
            if (args.length < 1) {
                await message.reply('❌ Please provide server ID\nUsage: !serverstatus <server_id>');
                return;
            }

            const serverId = args[0];
            const status = await this.serverMonitoring.getServerStatus(serverId);
            
            if (!status) {
                await message.reply('❌ Server not found or not accessible');
                return;
            }

            const statusText = "\n🖥️ *Server Status Report*\n\n" +
                         "📊 *Basic Info:*\n" +
                         `• Server ID: ${status.serverId}\n` +
                         `• Name: ${status.name}\n` +
                         `• Status: ${status.status}\n` +
                         "• Node: N/A\n\n" +
                         "⚡ *Resources:*\n" +
                         `• CPU: ${status.resources?.cpu_absolute || 0}%\n` +
                         `• Memory: ${Math.round((status.resources?.memory_bytes || 0) / 1024 / 1024)}MB / ${status.limits.memory}MB\n` +
                         `• Disk: ${Math.round((status.resources?.disk_bytes || 0) / 1024 / 1024)}MB / ${status.limits.disk}MB\n\n` +
                         "🔄 *Activity:*\n" +
                         `• Last Updated: ${new Date().toLocaleString()}\n` +
                         `• Uptime: ${status.resources?.uptime ? Math.round(status.resources.uptime / 1000) + 's' : 'N/A'}\n\n` +
                         "💰 *Subscription:*\n" +
                         `• Status: ${status.suspended ? 'Suspended' : 'Active'}\n` +
                         `• Expires: ${status.expiryDate ? status.expiryDate.toLocaleDateString() : 'N/A'}`.trim();

            await message.reply(statusText);
            
        } catch (error) {
            Logger.error('Error in handleServerStatus:', error);
            await message.reply('❌ Failed to get server status. Please try again.');
        }
    }

    private async handleServerList(message: any, args: string[]): Promise<void> {
        try {
            const filter = args[0] || 'all';
            const servers = await this.serverMonitoring.getAllServers();
            
            if (servers.length === 0) {
                await message.reply('📋 No servers found');
                return;
            }

            let filteredServers = servers;
            if (filter !== 'all') {
                filteredServers = servers.filter(server => 
                    server.status.toLowerCase().includes(filter.toLowerCase())
                );
            }

            const serverList = filteredServers.map((server, index) => 
                `${index + 1}. ${server.name} (${server.serverId}) - ${server.status}`
            ).join('\n');

            const listText = `
🖥️ *Server List* (${filteredServers.length} servers)

${serverList}

💡 Use !serverinfo <server_id> for detailed information
            `.trim();

            await message.reply(listText);
            
        } catch (error) {
            Logger.error('Error in handleServerList:', error);
            await message.reply('❌ Failed to get server list. Please try again.');
        }
    }

    private async handleServerInfo(message: any, args: string[]): Promise<void> {
        try {
            if (args.length < 1) {
                await message.reply('❌ Please provide server ID\nUsage: !serverinfo <server_id>');
                return;
            }

            const serverId = args[0];
            const serverInfo = await this.pterodactylAPI.getServerStats(serverId);
            
            if (!serverInfo) {
                await message.reply('❌ Server not found');
                return;
            }

            const infoText = "\n🖥️ *Server Information*\n\n" +
                         "📊 *Details:*\n" +
                         `• ID: ${serverInfo.id}\n` +
                         `• Name: ${serverInfo.name}\n` +
                         `• Description: ${serverInfo.description || 'N/A'}\n` +
                         `• Node: ${serverInfo.node}\n` +
                         `• Status: ${serverInfo.status}\n\n` +
                         "⚙️ *Configuration:*\n" +
                         `• CPU: ${serverInfo.limits.cpu}%\n` +
                         `• Memory: ${serverInfo.limits.memory}MB\n` +
                         `• Disk: ${serverInfo.limits.disk}MB\n` +
                         `• Swap: ${serverInfo.limits.swap}MB\n\n` +
                         "🌐 *Network:*\n" +
                         `• IP: ${serverInfo.allocation?.ip || 'N/A'}\n` +
                         `• Port: ${serverInfo.allocation?.port || 'N/A'}\n\n` +
                         "👤 *Owner:*\n" +
                         `• User ID: ${serverInfo.user}\n` +
                         `• Created: ${new Date(serverInfo.created_at).toLocaleDateString()}`.trim();

            await message.reply(infoText);
            
        } catch (error) {
            Logger.error('Error in handleServerInfo:', error);
            await message.reply('❌ Failed to get server information. Please try again.');
        }
    }

    private async handleServerSuspend(message: any, args: string[]): Promise<void> {
        try {
            if (args.length < 1) {
                await message.reply('❌ Please provide server ID\nUsage: !serversuspend <server_id> [reason]');
                return;
            }

            const serverId = args[0];
            const reason = args.slice(1).join(' ') || 'Administrative action';
            
            const result = await this.pterodactylAPI.suspendServer(serverId);
            
            if (result) {
                await message.reply(`✅ Server ${serverId} has been suspended\nReason: ${reason}`);
                Logger.info(`Server ${serverId} suspended by admin. Reason: ${reason}`);
            } else {
                await message.reply('❌ Failed to suspend server. Please check the server ID.');
            }
            
        } catch (error) {
            Logger.error('Error in handleServerSuspend:', error);
            await message.reply('❌ Failed to suspend server. Please try again.');
        }
    }

    private async handleServerResume(message: any, args: string[]): Promise<void> {
        try {
            if (args.length < 1) {
                await message.reply('❌ Please provide server ID\nUsage: !serverresume <server_id>');
                return;
            }

            const serverId = args[0];
            const result = await this.pterodactylAPI.unsuspendServer(serverId);
            
            if (result) {
                await message.reply(`✅ Server ${serverId} has been resumed`);
                Logger.info(`Server ${serverId} resumed by admin`);
            } else {
                await message.reply('❌ Failed to resume server. Please check the server ID.');
            }
            
        } catch (error) {
            Logger.error('Error in handleServerResume:', error);
            await message.reply('❌ Failed to resume server. Please try again.');
        }
    }

    private async handleServerRestart(message: any, args: string[]): Promise<void> {
        try {
            if (args.length < 1) {
                await message.reply('❌ Please provide server ID\nUsage: !serverrestart <server_id>');
                return;
            }

            const serverId = args[0];
            const result = await this.pterodactylAPI.createServer(serverId);
            
            if (result as boolean) {
                await message.reply(`🔄 Server ${serverId} is being restarted...`);
                Logger.info(`Server ${serverId} restarted by admin`);
            } else {
                await message.reply('❌ Failed to restart server. Please check the server ID.');
            }
            
        } catch (error) {
            Logger.error('Error in handleServerRestart:', error);
            await message.reply('❌ Failed to restart server. Please try again.');
        }
    }

    // Customer Command Handlers
    private async handleMyServers(message: any, args: string[]): Promise<void> {
        try {
            // Get user phone number (assuming it's available in message)
            const userPhone = message.from || message.author;
            
            // Get user's servers from subscription manager
            const userServers = await this.subscriptionManager.getUserServers(userPhone);
            
            if (userServers.length === 0) {
                await message.reply('📋 You don\'t have any servers yet.\n\n💡 Use !order to purchase a server package.');
                return;
            }

            const serverList = await Promise.all(
                userServers.map(async (server, index) => {
                    const status = await this.serverMonitoring.getServerStatus(serverId);
                    return `${index + 1}. ${server.name}
   ID: ${server.serverId}
   Status: ${status?.status || 'Unknown'}
   Expires: ${new Date(server.expiresAt).toLocaleDateString()}`;
                })
            );

            const myServersText = `
🖥️ *Your Servers* (${userServers.length} servers)

${serverList.join('\n\n')}

💡 Use !serverusage <server_id> to check resource usage
            `.trim();

            await message.reply(myServersText);
            
        } catch (error) {
            Logger.error('Error in handleMyServers:', error);
            await message.reply('❌ Failed to get your servers. Please try again.');
        }
    }

    private async handleServerUsage(message: any, args: string[]): Promise<void> {
        try {
            if (args.length < 1) {
                await message.reply('❌ Please provide server ID
Usage: !serverusage <server_id>');
                return;
            }

            const serverId = args[0];
            const userPhone = message.from || message.author;
            
            // Verify user owns this server
            const userServers = await this.subscriptionManager.getUserServers(userPhone);
            const ownsServer = userServers.some(server => server.serverId === serverId);
            
            if (!ownsServer) {
                await message.reply('❌ You don\'t have access to this server');
                return;
            }

            const status = await this.serverMonitoring.getServerStatus(serverId);
            
            if (!status) {
                await message.reply('❌ Server not found or not accessible');
                return;
            }

                        const usageText = `
                        const usageText = `
📊 *Server Usage Report*

🖥️ *Server:* ${status.name} (${serverId})

⚡ *Current Usage:*
• CPU: ${status.resources?.cpu_absolute || 0}%
• Memory: ${Math.round((status.resources?.memory_bytes || 0) / 1024 / 1024)}MB / ${status.limits.memory}MB (${Math.round(((status.resources?.memory_bytes || 0) / 1024 / 1024) / (status.limits.memory as number) * 100)}%)
• Disk: ${Math.round((status.resources?.disk_bytes || 0) / 1024 / 1024)}MB / ${status.limits.disk}MB (${Math.round(((status.resources?.disk_bytes || 0) / 1024 / 1024) / (status.limits.disk as number) * 100)}%)

🔄 *Status:* ${status.status}
📅 *Last Updated:* ${new Date().toLocaleString()}

💰 *Subscription:*
• Status: ${status.suspended ? 'Suspended' : 'Active'}
• Expires: ${status.expiryDate ? status.expiryDate.toLocaleDateString() : 'N/A'}
            `.trim();
            `.trim();

            await message.reply(usageText);
            
        } catch (error) {
            Logger.error('Error in handleServerUsage:', error);
            await message.reply('❌ Failed to get server usage. Please try again.');
        }
    }
}
}