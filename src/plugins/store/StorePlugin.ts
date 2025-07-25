import { BasePlugin } from '../BasePlugin';
import { Command, CommandContext, PluginMetadata, PluginDependencies } from '../types';
import { OrderManager } from './OrderManager';
import { NotificationService } from './NotificationService';
import { PackageType, PACKAGE_CATALOG } from './models/Order';
import { Logger } from '../../utils/logger';
import { MessageFormatter } from '../../utils/messageFormatter';

export class StorePlugin extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'StorePlugin',
        version: '2.0.0',
        description: 'Store management commands for product catalog and orders with persistent order management',
        author: 'Pterodactyl Store',
        category: 'store'
    };

    private orderManager: OrderManager;
    private notificationService: NotificationService;

    constructor(dependencies: PluginDependencies = {}) {
        super(dependencies);
        this.orderManager = OrderManager.getInstance();
        this.notificationService = NotificationService.getInstance();
    }

    protected async onInitialize(): Promise<void> {
        // Initialize order management system
        await this.orderManager.initialize();
    }

    protected async onShutdown(): Promise<void> {
        // Cleanup store-specific resources
    }

    protected registerCommands(): void {
        this.registerCommand({
            name: 'katalog',
            description: 'Menampilkan katalog produk',
            usage: '.katalog',
            category: 'store',
            execute: this.katalogCommand.bind(this)
        });

        this.registerCommand({
            name: 'harga',
            description: 'Cek harga paket server',
            usage: '.harga [paket]',
            category: 'store',
            execute: this.hargaCommand.bind(this)
        });

        this.registerCommand({
            name: 'order',
            description: 'Membuat pesanan baru',
            usage: '.order [paket] [durasi]',
            category: 'store',
            execute: this.orderCommand.bind(this)
        });

        this.registerCommand({
            name: 'order-status',
            description: 'Cek status pesanan',
            usage: '.order-status [order-id]',
            category: 'store',
            execute: this.orderStatusCommand.bind(this)
        });

        this.registerCommand({
            name: 'my-orders',
            description: 'Lihat semua pesanan saya',
            usage: '.my-orders',
            category: 'store',
            execute: this.myOrdersCommand.bind(this)
        });
    }

    private async katalogCommand(args: string[], context: CommandContext) {
        this.logCommand('katalog', context.sender);
        
        const packages = await this.orderManager.getAllPackages();
        const storeName = process.env.STORE_NAME || 'Pterodactyl Store';
        
        // Group packages by egg type using new naming
        const nodeJSPackages = Object.values(packages).filter(pkg => 
            pkg.type.toString().startsWith('a') && pkg.type.toString().length === 2
        );
        const vpsPackages = Object.values(packages).filter(pkg => 
            pkg.type.toString().startsWith('b') && pkg.type.toString().length === 2
        );
        const pythonPackages = Object.values(packages).filter(pkg => 
            pkg.type.toString().startsWith('c') && pkg.type.toString().length === 2
        );
        
        // Prepare categories for the new formatter
        const categories = [];
        
        if (nodeJSPackages.length > 0) {
            categories.push({
                name: 'NodeJS VIP (A1-A6)',
                items: nodeJSPackages.map(pkg => ({
                    name: pkg.name,
                    price: `${process.env.STORE_CURRENCY || 'IDR'} ${pkg.price.toLocaleString('id-ID')}/bulan`,
                    specs: `${pkg.ram}, ${pkg.cpu}`
                }))
            });
        }
        
        if (vpsPackages.length > 0) {
            categories.push({
                name: 'VPS (B1-B6)',
                items: vpsPackages.map(pkg => ({
                    name: pkg.name,
                    price: `${process.env.STORE_CURRENCY || 'IDR'} ${pkg.price.toLocaleString('id-ID')}/bulan`,
                    specs: `${pkg.ram}, ${pkg.cpu}`
                }))
            });
        }
        
        if (pythonPackages.length > 0) {
            categories.push({
                name: 'Python (C1-C6)',
                items: pythonPackages.map(pkg => ({
                    name: pkg.name,
                    price: `${process.env.STORE_CURRENCY || 'IDR'} ${pkg.price.toLocaleString('id-ID')}/bulan`,
                    specs: `${pkg.ram}, ${pkg.cpu}`
                }))
            });
        }

        // Create formatted catalog message
        const catalogMessage = MessageFormatter.formatCatalog(storeName, categories);
        
        // Add additional info sections
        const orderInstructions = [
            '.order [kode] [durasi]',
            'Contoh: .order a1 1 (NodeJS Kroco 1 bulan)',
            'Contoh: .order b3 3 (VPS Standar 3 bulan)',
            'Contoh: .order c6 12 (Python Pro Max 12 bulan)'
        ];
        
        const statusCommands = [
            '.order-status [order-id]',
            '.my-orders'
        ];
        
        const additionalSections = [
            {
                title: 'Cara Order',
                content: MessageFormatter.formatList(orderInstructions),
                emoji: MessageFormatter.EMOJIS.target
            },
            {
                title: 'Cek Status',
                content: MessageFormatter.formatList(statusCommands),
                emoji: MessageFormatter.EMOJIS.search
            }
        ];
        
        const finalMessage = MessageFormatter.formatMessage({
            title: `${MessageFormatter.EMOJIS.store} ${storeName}`,
            sections: [
                ...categories.map(cat => ({
                    title: cat.name,
                    content: cat.items.map(item => 
                        `${MessageFormatter.EMOJIS.gem} *${item.name}*\n   ${item.specs}\n   ${MessageFormatter.EMOJIS.money} ${item.price}`
                    ).join('\n\n'),
                    emoji: MessageFormatter.getCategoryEmoji ? MessageFormatter.getCategoryEmoji(cat.name) : '🔧'
                })),
                ...additionalSections
            ],
            footer: `${MessageFormatter.EMOJIS.phone} wa.me/${process.env.STORE_ADMIN}`,
            divider: true
        });

        await this.sendMessage(context.socket, context.chatId, finalMessage);
    }

    private async hargaCommand(args: string[], context: CommandContext) {
        this.logCommand('harga', context.sender);
        
        const paketInput = args[0]?.toLowerCase();
        
        if (!paketInput) {
            await this.sendError(context.socket, context.chatId,
                'Format salah',
                'Parameter paket tidak ditemukan',
                'Gunakan: .harga [paket]\n\nPaket tersedia: bronze, silver, gold, platinum, diamond'
            );
            return;
        }

        const packageType = await this.orderManager.validatePackageType(paketInput);
        if (!packageType) {
            await this.sendError(context.socket, context.chatId,
                'Paket tidak ditemukan',
                `Paket "${paketInput}" tidak tersedia`,
                'Paket tersedia: bronze, silver, gold, platinum, diamond'
            );
            return;
        }

        const packageInfo = await this.orderManager.getPackageInfo(packageType);
        
        const priceMessage = MessageFormatter.formatMessage({
            title: `${MessageFormatter.EMOJIS.money} Harga Paket ${packageInfo.name}`,
            sections: [
                {
                    title: 'Spesifikasi',
                    content: MessageFormatter.formatInfo({
                        'RAM': packageInfo.ram,
                        'CPU': packageInfo.cpu,
                        'Storage': packageInfo.storage,
                        'Bandwidth': packageInfo.bandwidth
                    }),
                    emoji: MessageFormatter.EMOJIS.server
                },
                {
                    title: 'Harga',
                    content: `*${process.env.STORE_CURRENCY || 'IDR'} ${packageInfo.price.toLocaleString('id-ID')}/bulan*`,
                    emoji: MessageFormatter.EMOJIS.money
                },
                {
                    title: 'Order Sekarang',
                    content: `\`!order ${paketInput} 1\``,
                    emoji: MessageFormatter.EMOJIS.target
                }
            ],
            footer: `${MessageFormatter.EMOJIS.phone} wa.me/${process.env.STORE_ADMIN}`,
            timestamp: true
        });

        await this.sendMessage(context.socket, context.chatId, priceMessage);
    }

    private async orderCommand(args: string[], context: CommandContext) {
        this.logCommand('order', context.sender);
        
        const paketInput = args[0]?.toLowerCase();
        const durasi = parseInt(args[1]) || 1;

        if (!paketInput) {
            await this.sendError(context.socket, context.chatId,
                'Format salah',
                'Parameter paket tidak ditemukan',
                'Gunakan: .order [paket] [durasi bulan]\n\nContoh: .order bronze 1\nPaket tersedia: bronze, silver, gold, platinum, diamond'
            );
            return;
        }

        // Validate package type
        const packageType = await this.orderManager.validatePackageType(paketInput);
        if (!packageType) {
            await this.sendError(context.socket, context.chatId,
                'Paket tidak ditemukan',
                `Paket "${paketInput}" tidak tersedia`,
                'Paket tersedia: bronze, silver, gold, platinum, diamond'
            );
            return;
        }

        // Validate duration
        if (durasi < 1 || durasi > 12) {
            await this.sendError(context.socket, context.chatId,
                'Durasi tidak valid',
                `Durasi ${durasi} bulan tidak diperbolehkan`,
                'Durasi harus antara 1-12 bulan'
            );
            return;
        }

        try {
            // Create order
            const order = await this.orderManager.createOrder(
                context.sender,
                context.chatId,
                packageType,
                durasi
            );

            // Send notifications
            await this.notificationService.notifyOrderCreated(context.socket, order);

            Logger.order(`Order created: ${order.id} by ${context.sender}`);
        } catch (error) {
            Logger.error('❌ Failed to create order:', error);
            await this.sendError(context.socket, context.chatId,
                'Gagal membuat pesanan',
                'Terjadi kesalahan sistem saat memproses pesanan',
                'Silakan coba lagi dalam beberapa saat atau hubungi admin'
            );
        }
    }

    private async orderStatusCommand(args: string[], context: CommandContext) {
        this.logCommand('order-status', context.sender);
        
        const orderId = args[0]?.toUpperCase();
        
        if (!orderId) {
            await this.sendError(context.socket, context.chatId,
                'Format salah',
                'Order ID tidak ditemukan',
                'Gunakan: .order-status [order-id]\n\nContoh: .order-status ORD-123ABC'
            );
            return;
        }

        try {
            const order = await this.orderManager.getOrder(orderId);
            
            if (!order) {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Order tidak ditemukan. Periksa kembali Order ID Anda.'
                );
                return;
            }

            // Check if user owns this order
            if (order.customer.phoneNumber !== context.sender) {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Anda tidak memiliki akses ke order ini.'
                );
                return;
            }

            const orderDetails = this.orderManager.formatOrderForDisplay(order);
            await this.sendMessage(context.socket, context.chatId, orderDetails);

        } catch (error) {
            Logger.error('❌ Failed to get order status:', error);
            await this.sendMessage(context.socket, context.chatId,
                '❌ Terjadi kesalahan saat mengambil status order. Silakan coba lagi.'
            );
        }
    }

    private async myOrdersCommand(args: string[], context: CommandContext) {
        this.logCommand('my-orders', context.sender);
        
        try {
            const orders = await this.orderManager.getOrdersByCustomer(context.sender);
            
            if (orders.length === 0) {
                await this.sendMessage(context.socket, context.chatId,
                    '📋 Anda belum memiliki pesanan.\n\n' +
                    'Untuk membuat pesanan baru, gunakan: .order [paket] [durasi]'
                );
                return;
            }

            let message = `📋 *Pesanan Saya* (${orders.length} pesanan)\n\n`;
            
            // Show only recent orders (max 10)
            const recentOrders = orders.slice(0, 10);
            
            for (const order of recentOrders) {
                const summary = this.orderManager.formatOrderSummary(order);
                message += `${summary}\n`;
            }

            if (orders.length > 10) {
                message += `\n... dan ${orders.length - 10} pesanan lainnya`;
            }

            message += '\n\n💡 Gunakan !order-status [order-id] untuk detail lengkap';
            
            await this.sendMessage(context.socket, context.chatId, message);

        } catch (error) {
            Logger.error('❌ Failed to get customer orders:', error);
            await this.sendMessage(context.socket, context.chatId,
                '❌ Terjadi kesalahan saat mengambil data pesanan. Silakan coba lagi.'
            );
        }
    }
}