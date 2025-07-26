import { WhatsAppCatalogService } from '../services/WhatsAppCatalogService';
import { PrismaOrderService } from '../services/PrismaOrderService';
import { Logger } from '../utils/logger';
import { GlobalRateLimiter } from '../utils/rateLimiter';

export class WhatsAppMessageHandler {
    private catalogService: WhatsAppCatalogService;
    private orderService: PrismaOrderService;

    constructor() {
        this.catalogService = WhatsAppCatalogService.getInstance();
        this.orderService = PrismaOrderService.getInstance();
    }

    /**
     * Handle incoming WhatsApp messages
     * All responses are database-driven
     */
    public async handleMessage(message: string, from: string): Promise<string> {
        try {
            // Check rate limit first
            if (!GlobalRateLimiter.isAllowed(from, message)) {
                const status = GlobalRateLimiter.getStatus(from);
                
                if (status.isBlocked) {
                    const remainingTime = Math.ceil(status.blockTimeRemaining / 1000);
                    Logger.warn(`🚫 Blocked user ${from} tried to send message: "${message}"`);
                    return `🚫 *SPAM DETECTED*\n\n` +
                           `Anda telah mengirim terlalu banyak pesan.\n` +
                           `Silakan tunggu ${remainingTime} detik sebelum mengirim pesan lagi.\n\n` +
                           `⚠️ Jika Anda terus melakukan spam, akses Anda akan diblokir lebih lama.`;
                }
                
                // Duplicate message
                Logger.warn(`🔄 Duplicate/rapid message from ${from}: "${message}"`);
                return ''; // Return empty to not send any response for duplicates
            }

            const command = message.trim().toLowerCase();
            
            // Remove common prefixes
            const cleanCommand = command.replace(/^[.!\/]/, '');
            
            // Split command and arguments
            const parts = cleanCommand.split(' ');
            const mainCommand = parts[0];
            const args = parts.slice(1);

            Logger.info(`📱 Processing command: ${mainCommand} from ${from}`);

            switch (mainCommand) {
                case 'katalog':
                case 'catalog':
                case 'menu':
                case 'list':
                    return await this.handleCatalogCommand(args);

                case 'paket':
                case 'package':
                    return await this.handlePackageCommand(args);

                case 'order':
                case 'pesan':
                case 'beli':
                    return await this.handleOrderCommand(args, from);

                case 'cari':
                case 'search':
                case 'find':
                    return await this.handleSearchCommand(args);

                case 'help':
                case 'bantuan':
                case 'commands':
                    return await this.handleHelpCommand();

                case 'status':
                    return await this.handleStatusCommand(args, from);

                case 'nodejs':
                case 'vps':
                case 'python':
                    return await this.catalogService.generateCategoryCatalogMessage(mainCommand);

                default:
                    // Check if it's a package type (A1, B2, C3, etc.)
                    if (/^[A-Z]\d+$/i.test(mainCommand)) {
                        return await this.catalogService.generatePackageDetailMessage(mainCommand);
                    }
                    
                    return await this.handleUnknownCommand(cleanCommand);
            }

        } catch (error) {
            Logger.error('❌ Error handling WhatsApp message:', error);
            return '❌ Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti atau hubungi admin.';
        }
    }

    /**
     * Handle catalog command
     */
    private async handleCatalogCommand(args: string[]): Promise<string> {
        if (args.length === 0) {
            // Show full catalog
            return await this.catalogService.generateCatalogMessage();
        }

        const category = args[0].toLowerCase();
        const availableCategories = await this.catalogService.getAvailableCategories();
        
        if (availableCategories.includes(category)) {
            return await this.catalogService.generateCategoryCatalogMessage(category);
        }

        return `❌ Kategori "${category}" tidak ditemukan.\n\n` +
               `📋 Kategori tersedia: ${availableCategories.join(', ')}\n\n` +
               `💡 Gunakan: \`katalog [kategori]\` atau \`katalog\` untuk semua paket`;
    }

    /**
     * Handle package detail command
     */
    private async handlePackageCommand(args: string[]): Promise<string> {
        if (args.length === 0) {
            const availableTypes = await this.catalogService.getAvailablePackageTypes();
            return `❌ Silakan sebutkan kode paket.\n\n` +
                   `📋 Paket tersedia: ${availableTypes.join(', ')}\n\n` +
                   `💡 Gunakan: \`paket [kode]\` - Contoh: \`paket A1\``;
        }

        const packageType = args[0].toUpperCase();
        return await this.catalogService.generatePackageDetailMessage(packageType);
    }

    /**
     * Handle order command
     */
    private async handleOrderCommand(args: string[], from: string): Promise<string> {
        if (args.length === 0) {
            const availableTypes = await this.catalogService.getAvailablePackageTypes();
            return '❌ Silakan sebutkan kode paket yang ingin dipesan.\n\n' +
                   `📋 Paket tersedia: ${availableTypes.join(', ')}\n\n` +
                   '💡 Gunakan: `order [kode] [username_kustom]` - Contoh: `order A1 myuser`';
        }

        const packageType = args[0].toUpperCase();
        const username = args[1]; // Optional username
        
        try {
            const packageInfo = await this.catalogService.getPackageInfo(packageType);
            if (!packageInfo) {
                return `❌ Paket "${packageType}" tidak ditemukan.`;
            }

            const packageDuration = 1; // Default to 1 month
            const packagePrice = packageInfo.price;
            const totalAmount = packagePrice * packageDuration;
            const currency = process.env.STORE_CURRENCY || 'IDR';

            // Create order through PrismaOrderService
            const orderResult = await this.orderService.createOrder({
                id: 'temp_id_' + Date.now(), // Temporary ID
                customerChatId: from,
                packageType,
                customerPhone: from,
                customerName: from.split('@')[0], // Use phone number as temporary name
                packageDuration,
                packagePrice,
                status: 'pending',
                totalAmount,
                currency,
                username
            });

            if (orderResult.success && orderResult.order) {
                const order = orderResult.order;
                
                let message = `✅ *ORDER BERHASIL DIBUAT*\n\n`;
                message += `📋 *Detail Order:*\n`;
                message += `• Order ID: #${order.id}\n`;
                message += `• Paket: ${order.packageType}\n`;
                message += `• Total: Rp ${order.totalAmount.toLocaleString('id-ID')}\n`;
                message += `• Status: ${order.status}\n`;
                message += `• Tanggal: ${order.createdAt.toLocaleDateString('id-ID')}\n\n`;
                
                message += `💳 *Pembayaran:*\n`;
                message += `• Transfer ke: BCA 1234567890\n`;
                message += `• A.n: ANTIDONASI\n`;
                message += `• Jumlah: Rp ${order.totalAmount.toLocaleString('id-ID')}\n`;
                message += `• Kode Unik: ${order.id}\n\n`;
                
                message += `📱 *Konfirmasi:*\n`;
                message += `Setelah transfer, kirim bukti pembayaran ke admin:\n`;
                message += `wa.me/${process.env.STORE_ADMIN || 'admin'}\n\n`;
                
                message += `🔍 *Cek Status:*\n`;
                message += `Ketik: \`status ${order.id}\``;

                return message;
            } else {
                return `❌ ${orderResult.error || 'Gagal membuat order. Silakan coba lagi.'}`;
            }

        } catch (error) {
            Logger.error('❌ Error creating order:', error);
            return `❌ Gagal membuat order. Silakan coba lagi atau hubungi admin.`;
        }
    }

    /**
     * Handle search command
     */
    private async handleSearchCommand(args: string[]): Promise<string> {
        if (args.length === 0) {
            return `❌ Silakan masukkan kata kunci pencarian.\n\n` +
                   `💡 Gunakan: \`cari [kata kunci]\`\n` +
                   `📝 Contoh: \`cari nodejs\`, \`cari 8gb\`, \`cari murah\``;
        }

        const query = args.join(' ');
        return await this.catalogService.searchPackages(query);
    }

    /**
     * Handle help command
     */
    private async handleHelpCommand(): Promise<string> {
        let helpMessage = `🤖 *BOT HOSTING ANTIDONASI*\n\n`;
        helpMessage += `📋 *Perintah Tersedia:*\n`;
        helpMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        helpMessage += `📦 *Katalog & Paket:*\n`;
        helpMessage += `• \`katalog\` - Lihat semua paket\n`;
        helpMessage += `• \`katalog nodejs\` - Paket NodeJS saja\n`;
        helpMessage += `• \`paket A1\` - Detail paket A1\n`;
        helpMessage += `• \`A1\` - Shortcut detail paket A1\n\n`;
        
        helpMessage += `🛒 *Pemesanan:*\n`;
        helpMessage += `• \`order A1\` - Pesan paket A1\n`;
        helpMessage += `• \`status 123\` - Cek status order #123\n\n`;
        
        helpMessage += `🔍 *Pencarian:*\n`;
        helpMessage += `• \`cari nodejs\` - Cari paket NodeJS\n`;
        helpMessage += `• \`cari 8gb\` - Cari paket dengan 8GB RAM\n\n`;
        
        helpMessage += `ℹ️ *Informasi:*\n`;
        helpMessage += `• \`help\` - Tampilkan bantuan ini\n`;
        helpMessage += `• \`nodejs\` - Kategori NodeJS\n`;
        helpMessage += `• \`vps\` - Kategori VPS\n`;
        helpMessage += `• \`python\` - Kategori Python\n\n`;
        
        helpMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        helpMessage += `📱 *Admin:* wa.me/${process.env.STORE_ADMIN || 'admin'}\n`;
        helpMessage += `🌐 *Website:* https://antidonasi.com\n\n`;
        helpMessage += `💡 *Tips:* Semua perintah tidak case-sensitive`;

        return helpMessage;
    }

    /**
     * Handle status command
     */
    private async handleStatusCommand(args: string[], from: string): Promise<string> {
        if (args.length === 0) {
            return `❌ Silakan masukkan ID order.\n\n` +
                   `💡 Gunakan: \`status [order_id]\`\n` +
                   `📝 Contoh: \`status 123\``;
        }

        const orderId = parseInt(args[0]);
        if (isNaN(orderId)) {
            return `❌ ID order harus berupa angka.\n\n` +
                   `💡 Contoh: \`status 123\``;
        }

        try {
            const orderStatus = await this.orderService.getOrderStatus(orderId);
            
            if (!orderStatus.success || !orderStatus.order) {
                return `❌ Order #${orderId} tidak ditemukan.`;
            }

            const order = orderStatus.order;
            
            let message = `📋 *STATUS ORDER #${order.id}*\n\n`;
            message += `📦 *Detail Order:*\n`;
            message += `• Paket: ${order.packageType}\n`;
            message += `• Total: Rp ${order.totalAmount.toLocaleString('id-ID')}\n`;
            message += `• Status: ${this.getStatusEmoji(order.status)} ${order.status}\n`;
            message += `• Tanggal: ${order.createdAt.toLocaleDateString('id-ID')}\n\n`;

            if (order.status === 'pending') {
                message += `💳 *Menunggu Pembayaran:*\n`;
                message += `• Transfer ke: BCA 1234567890\n`;
                message += `• A.n: ANTIDONASI\n`;
                message += `• Jumlah: Rp ${order.totalAmount.toLocaleString('id-ID')}\n`;
                message += `• Kode Unik: ${order.id}\n\n`;
                message += `📱 Kirim bukti ke: wa.me/${process.env.STORE_ADMIN || 'admin'}`;
            } else if (order.status === 'completed') {
                message += `✅ *Order Selesai*\n`;
                message += `Server Anda sudah aktif dan siap digunakan!`;
            }

            return message;

        } catch (error) {
            Logger.error('❌ Error getting order status:', error);
            return `❌ Gagal mengecek status order. Silakan coba lagi.`;
        }
    }

    /**
     * Handle unknown commands with suggestions
     */
    private async handleUnknownCommand(command: string): Promise<string> {
        // Try to find similar package types
        const availableTypes = await this.catalogService.getAvailablePackageTypes();
        const similarPackages = availableTypes.filter(type => 
            type.toLowerCase().includes(command.toLowerCase()) ||
            command.toLowerCase().includes(type.toLowerCase())
        );

        let message = `❓ Perintah "${command}" tidak dikenali.\n\n`;
        
        if (similarPackages.length > 0) {
            message += `🔍 Mungkin yang Anda maksud:\n`;
            for (const pkg of similarPackages.slice(0, 3)) {
                message += `• \`${pkg}\` - Detail paket ${pkg}\n`;
            }
            message += '\n';
        }

        message += `💡 *Perintah Populer:*\n`;
        message += `• \`katalog\` - Lihat semua paket\n`;
        message += `• \`help\` - Bantuan lengkap\n`;
        message += `• \`order A1\` - Pesan paket A1\n\n`;
        message += `📱 Butuh bantuan? Hubungi admin: wa.me/${process.env.STORE_ADMIN || 'admin'}`;

        return message;
    }

    /**
     * Get emoji for order status
     */
    private getStatusEmoji(status: string): string {
        const statusEmojis: { [key: string]: string } = {
            'pending': '⏳',
            'paid': '💳',
            'processing': '⚙️',
            'completed': '✅',
            'cancelled': '❌',
            'refunded': '↩️'
        };

        return statusEmojis[status.toLowerCase()] || '❓';
    }
}