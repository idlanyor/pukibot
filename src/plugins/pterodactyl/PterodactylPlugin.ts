import { BasePlugin } from '../BasePlugin';
import { Command, CommandContext, PluginMetadata, PluginDependencies } from '../types';

export class PterodactylPlugin extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'PterodactylPlugin',
        version: '1.0.0',
        description: 'Pterodactyl server management commands',
        author: 'Pterodactyl Store',
        category: 'pterodactyl'
    };

    constructor(dependencies: PluginDependencies = {}) {
        super(dependencies);
    }

    protected async onInitialize(): Promise<void> {
        // Initialize pterodactyl-specific resources
        if (!this.dependencies.pterodactylAPI) {
            throw new Error('PterodactylAPI dependency is required for PterodactylPlugin');
        }
    }

    protected async onShutdown(): Promise<void> {
        // Cleanup pterodactyl-specific resources
    }

    protected registerCommands(): void {
        this.registerCommand({
            name: 'server',
            description: 'Info server pterodactyl',
            usage: '!server [server_id]',
            category: 'pterodactyl',
            execute: this.serverCommand.bind(this)
        });

        this.registerCommand({
            name: 'start',
            description: 'Menjalankan server',
            usage: '!start [server_id]',
            category: 'pterodactyl',
            execute: this.startServerCommand.bind(this)
        });

        this.registerCommand({
            name: 'stop',
            description: 'Menghentikan server',
            usage: '!stop [server_id]',
            category: 'pterodactyl',
            execute: this.stopServerCommand.bind(this)
        });

        this.registerCommand({
            name: 'restart',
            description: 'Restart server',
            usage: '!restart [server_id]',
            category: 'pterodactyl',
            execute: this.restartServerCommand.bind(this)
        });
    }

    private async serverCommand(args: string[], context: CommandContext) {
        this.logCommand('server', context.sender);
        
        const serverId = args[0];
        
        if (!serverId) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: !server [server_id]'
            );
            return;
        }

        try {
            const serverInfo = await this.dependencies.pterodactylAPI.getServerInfo(serverId);
            
            const serverText = `🖥️ *Informasi Server*\n\n` +
                              `📋 ID: ${serverInfo.attributes.id}\n` +
                              `🏷️ Nama: ${serverInfo.attributes.name}\n` +
                              `🔘 Status: ${serverInfo.attributes.status}\n` +
                              `💾 RAM: ${serverInfo.attributes.limits.memory}MB\n` +
                              `⚡ CPU: ${serverInfo.attributes.limits.cpu}%\n` +
                              `💿 Disk: ${serverInfo.attributes.limits.disk}MB\n` +
                              `🌐 Node: ${serverInfo.attributes.node}`;

            await this.sendMessage(context.socket, context.chatId, serverText);
        } catch (error) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Server tidak ditemukan atau terjadi kesalahan.'
            );
        }
    }

    private async startServerCommand(args: string[], context: CommandContext) {
        this.logCommand('start', context.sender);
        
        const serverId = args[0];
        
        if (!serverId) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: !start [server_id]'
            );
            return;
        }

        try {
            await this.dependencies.pterodactylAPI.startServer(serverId);
            await this.sendMessage(context.socket, context.chatId,
                `✅ Server ${serverId} sedang dimulai...`
            );
        } catch (error) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Gagal memulai server. Periksa server ID atau hubungi admin.'
            );
        }
    }

    private async stopServerCommand(args: string[], context: CommandContext) {
        this.logCommand('stop', context.sender);
        
        const serverId = args[0];
        
        if (!serverId) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: !stop [server_id]'
            );
            return;
        }

        try {
            await this.dependencies.pterodactylAPI.stopServer(serverId);
            await this.sendMessage(context.socket, context.chatId,
                `⏹️ Server ${serverId} sedang dihentikan...`
            );
        } catch (error) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Gagal menghentikan server. Periksa server ID atau hubungi admin.'
            );
        }
    }

    private async restartServerCommand(args: string[], context: CommandContext) {
        this.logCommand('restart', context.sender);
        
        const serverId = args[0];
        
        if (!serverId) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: !restart [server_id]'
            );
            return;
        }

        try {
            await this.dependencies.pterodactylAPI.restartServer(serverId);
            await this.sendMessage(context.socket, context.chatId,
                `🔄 Server ${serverId} sedang direstart...`
            );
        } catch (error) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Gagal merestart server. Periksa server ID atau hubungi admin.'
            );
        }
    }
}