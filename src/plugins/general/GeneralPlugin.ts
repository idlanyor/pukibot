import { BasePlugin } from '../BasePlugin';
import { Command, CommandContext, PluginMetadata, PluginDependencies } from '../types';

export class GeneralPlugin extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'GeneralPlugin',
        version: '1.0.0',
        description: 'General purpose commands for the bot',
        author: 'Pterodactyl Store',
        category: 'general'
    };

    constructor(dependencies: PluginDependencies = {}) {
        super(dependencies);
    }

    protected async onInitialize(): Promise<void> {
        // Initialize any plugin-specific resources
    }

    protected async onShutdown(): Promise<void> {
        // Cleanup any plugin-specific resources
    }

    protected registerCommands(): void {
        this.registerCommand({
            name: 'allmenu',
            description: 'Menampilkan semua menu yang tersedia',
            usage: '.allmenu',
            category: 'general',
            execute: this.allmenuCommand.bind(this)
        });

        this.registerCommand({
            name: 'ping',
            description: 'Cek status bot',
            usage: '.ping',
            category: 'general',
            execute: this.pingCommand.bind(this)
        });
    }

    private async allmenuCommand(args: string[], context: CommandContext) {
        this.logCommand('allmenu', context.sender);
        
        const botName = process.env.BOT_NAME || 'Pterodactyl Store Bot';
        const storeAdmin = process.env.STORE_ADMIN;
        
        let menuText = `🤖 *${botName}*\n`;
        menuText += `📋 *DAFTAR SEMUA MENU*\n\n`;
        
        // General Commands
        menuText += `🔧 *PERINTAH UMUM*\n`;
        menuText += `• *.allmenu* - Menampilkan semua menu\n`;
        menuText += `• *.ping* - Cek status bot\n\n`;
        
        // Store Commands
        menuText += `🛒 *PERINTAH TOKO*\n`;
        menuText += `• *.katalog* - Menampilkan katalog produk\n`;
        menuText += `• *.harga [paket]* - Cek harga paket server\n`;
        menuText += `• *.order [paket] [durasi]* - Membuat pesanan baru\n`;
        menuText += `• *.order-status [order-id]* - Cek status pesanan\n`;
        menuText += `• *.my-orders* - Lihat semua pesanan saya\n\n`;
        
        // Pterodactyl Commands
        menuText += `🎮 *MANAJEMEN SERVER*\n`;
        menuText += `• *.server [server_id]* - Info server pterodactyl\n`;
        menuText += `• *.start [server_id]* - Menjalankan server\n`;
        menuText += `• *.stop [server_id]* - Menghentikan server\n`;
        menuText += `• *.restart [server_id]* - Restart server\n\n`;
        
        // Admin Commands (only show to admins)
        if (this.isAdmin(context.sender)) {
            menuText += `👨‍💼 *PERINTAH ADMIN*\n`;
            menuText += `• *.stats* - Statistik bot dan server\n`;
            menuText += `• *.plugins* - Daftar plugin yang dimuat\n`;
            menuText += `• *.orders [status] [limit]* - Lihat semua pesanan\n`;
            menuText += `• *.order-detail [order-id]* - Lihat detail pesanan\n`;
            menuText += `• *.order-confirm [order-id] [notes]* - Konfirmasi pesanan\n`;
            menuText += `• *.order-process [order-id] [notes]* - Set pesanan ke processing\n`;
            menuText += `• *.order-complete [order-id] [server-id] [notes]* - Selesaikan pesanan\n`;
            menuText += `• *.order-cancel [order-id] [reason]* - Batalkan pesanan\n`;
            menuText += `• *.order-stats* - Statistik pesanan\n`;
            menuText += `• *.order-search [query]* - Cari pesanan\n`;
            menuText += `• *.pending-orders* - Lihat pesanan pending\n`;
            menuText += `• *.provision-retry [order-id]* - Coba ulang auto-provisioning\n`;
            menuText += `• *.provision-status* - Status auto-provisioning system\n`;
            menuText += `• *.provision-test* - Test koneksi auto-provisioning\n\n`;
        }
        
        // Footer
        menuText += `💡 *INFORMASI*\n`;
        menuText += `• Prefix: . (titik)\n`;
        menuText += `• Runtime: Bun ${process.versions.bun}\n`;
        if (storeAdmin) {
            menuText += `• Admin: wa.me/${storeAdmin}\n`;
        }
        menuText += `\n🚀 *Selamat menggunakan bot!*`;

        await this.sendMessage(context.socket, context.chatId, menuText);
    }

    private async pingCommand(args: string[], context: CommandContext) {
        this.logCommand('ping', context.sender);
        
        const startTime = Date.now();
        const responseTime = Date.now() - startTime;
        
        const pingText = `🏓 *Pong!*\n\n` +
                        `⚡ Response Time: ${responseTime}ms\n` +
                        `🕐 Server Time: ${new Date().toLocaleString('id-ID')}\n` +
                        `🚀 Runtime: Bun ${process.versions.bun}\n` +
                        `💾 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`;

        await this.sendMessage(context.socket, context.chatId, pingText);
    }
}