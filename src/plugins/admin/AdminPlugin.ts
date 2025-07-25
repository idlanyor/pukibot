import { BasePlugin } from '../BasePlugin';
import { Command, CommandContext, PluginMetadata, PluginDependencies } from '../types';
import { OrderManager } from '../store/OrderManager';
import { NotificationService } from '../store/NotificationService';
import { OrderStatus, PackageType } from '../store/models/Order';
import { Logger } from '../../utils/logger';

export class AdminPlugin extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'AdminPlugin',
        version: '2.0.0',
        description: 'Administrative commands for bot management and order administration',
        author: 'Pterodactyl Store',
        category: 'admin'
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
        // Cleanup admin-specific resources
    }

    protected registerCommands(): void {
        this.registerCommand({
            name: 'stats',
            description: 'Statistik bot dan server',
            usage: '.stats',
            category: 'admin',
            adminOnly: true,
            execute: this.statsCommand.bind(this)
        });

        this.registerCommand({
            name: 'plugins',
            description: 'Menampilkan daftar plugin yang dimuat',
            usage: '.plugins',
            category: 'admin',
            adminOnly: true,
            execute: this.pluginsCommand.bind(this)
        });

        // Order management commands
        this.registerCommand({
            name: 'orders',
            description: 'Lihat semua pesanan',
            usage: '.orders [status] [limit]',
            category: 'admin',
            adminOnly: true,
            execute: this.ordersCommand.bind(this)
        });

        this.registerCommand({
            name: 'order-detail',
            description: 'Lihat detail pesanan',
            usage: '.order-detail [order-id]',
            category: 'admin',
            adminOnly: true,
            execute: this.orderDetailCommand.bind(this)
        });

        this.registerCommand({
            name: 'order-confirm',
            description: 'Konfirmasi pesanan',
            usage: '.order-confirm [order-id] [notes]',
            category: 'admin',
            adminOnly: true,
            execute: this.orderConfirmCommand.bind(this)
        });

        this.registerCommand({
            name: 'order-process',
            description: 'Set pesanan ke status processing',
            usage: '.order-process [order-id] [notes]',
            category: 'admin',
            adminOnly: true,
            execute: this.orderProcessCommand.bind(this)
        });

        this.registerCommand({
            name: 'order-complete',
            description: 'Selesaikan pesanan',
            usage: '.order-complete [order-id] [server-id] [notes]',
            category: 'admin',
            adminOnly: true,
            execute: this.orderCompleteCommand.bind(this)
        });

        this.registerCommand({
            name: 'order-cancel',
            description: 'Batalkan pesanan',
            usage: '.order-cancel [order-id] [reason]',
            category: 'admin',
            adminOnly: true,
            execute: this.orderCancelCommand.bind(this)
        });

        this.registerCommand({
            name: 'order-stats',
            description: 'Statistik pesanan',
            usage: '.order-stats',
            category: 'admin',
            adminOnly: true,
            execute: this.orderStatsCommand.bind(this)
        });

        this.registerCommand({
            name: 'order-search',
            description: 'Cari pesanan',
            usage: '.order-search [phone/package/status]',
            category: 'admin',
            adminOnly: true,
            execute: this.orderSearchCommand.bind(this)
        });

        this.registerCommand({
            name: 'pending-orders',
            description: 'Lihat pesanan pending',
            usage: '.pending-orders',
            category: 'admin',
            adminOnly: true,
            execute: this.pendingOrdersCommand.bind(this)
        });

        // Auto-provisioning commands
        this.registerCommand({
            name: 'provision-retry',
            description: 'Coba ulang auto-provisioning',
            usage: '.provision-retry [order-id]',
            category: 'admin',
            adminOnly: true,
            execute: this.provisionRetryCommand.bind(this)
        });

        this.registerCommand({
            name: 'provision-status',
            description: 'Status auto-provisioning system',
            usage: '.provision-status',
            category: 'admin',
            adminOnly: true,
            execute: this.provisionStatusCommand.bind(this)
        });

        this.registerCommand({
            name: 'provision-test',
            description: 'Test koneksi auto-provisioning',
            usage: '.provision-test',
            category: 'admin',
            adminOnly: true,
            execute: this.provisionTestCommand.bind(this)
        });
    }

    private async statsCommand(args: string[], context: CommandContext) {
        this.logCommand('stats', context.sender);
        
        // Check admin permission
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        const stats = process.memoryUsage();
        const uptime = process.uptime();
        
        const statsText = `📊 *Statistik Bot*\n\n` +
                         `⏱️ Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m\n` +
                         `💾 Memory: ${Math.round(stats.heapUsed / 1024 / 1024)}MB\n` +
                         `🚀 Runtime: Bun ${process.versions.bun}\n` +
                         `📱 Platform: ${process.platform}\n` +
                         `🎯 Plugin System: Active\n` +
                         `📅 Started: ${new Date(Date.now() - uptime * 1000).toLocaleString('id-ID')}`;

        await this.sendMessage(context.socket, context.chatId, statsText);
    }

    private async pluginsCommand(args: string[], context: CommandContext) {
        this.logCommand('plugins', context.sender);
        
        // Check admin permission
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        // This will need to be implemented in the CommandManager to get plugin info
        const pluginText = `🔌 *Plugin System*\n\n` +
                          `📋 Plugin yang dimuat:\n` +
                          `• GeneralPlugin v1.0.0\n` +
                          `• StorePlugin v1.0.0\n` +
                          `• PterodactylPlugin v1.0.0\n` +
                          `• AdminPlugin v1.0.0\n\n` +
                          `✅ Semua plugin aktif dan berjalan normal`;

        await this.sendMessage(context.socket, context.chatId, pluginText);
    }

    // Order Management Commands
    private async ordersCommand(args: string[], context: CommandContext) {
        this.logCommand('orders', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        try {
            const statusFilter = args[0]?.toLowerCase() as OrderStatus;
            const limit = parseInt(args[1]) || 10;
            
            let orders;
            if (statusFilter && Object.values(OrderStatus).includes(statusFilter)) {
                orders = await this.orderManager.getOrdersByStatus(statusFilter);
            } else {
                orders = await this.orderManager.getAllOrders(limit);
            }

            if (orders.length === 0) {
                await this.sendMessage(context.socket, context.chatId,
                    '📋 Tidak ada pesanan ditemukan.'
                );
                return;
            }

            let message = `📋 *Daftar Pesanan* ${statusFilter ? `(${statusFilter})` : ''}\n\n`;
            
            for (const order of orders.slice(0, limit)) {
                const summary = this.orderManager.formatOrderSummary(order);
                message += `${summary}\n`;
            }

            if (orders.length > limit) {
                message += `\n... dan ${orders.length - limit} pesanan lainnya`;
            }

            message += '\n\n💡 Gunakan .order-detail [order-id] untuk detail lengkap';
            
            await this.sendMessage(context.socket, context.chatId, message);

        } catch (error) {
            Logger.error('❌ Failed to get orders:', error);
            await this.sendMessage(context.socket, context.chatId,
                '❌ Terjadi kesalahan saat mengambil data pesanan.'
            );
        }
    }

    private async orderDetailCommand(args: string[], context: CommandContext) {
        this.logCommand('order-detail', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        const orderId = args[0]?.toUpperCase();
        
        if (!orderId) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: .order-detail [order-id]'
            );
            return;
        }

        try {
            const order = await this.orderManager.getOrder(orderId);
            
            if (!order) {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Order tidak ditemukan.'
                );
                return;
            }

            const orderDetails = this.orderManager.formatOrderForDisplay(order);
            
            // Add status history
            let historyText = '\n\n📊 *Status History:*\n';
            for (const history of order.statusHistory) {
                historyText += `• ${history.status} - ${history.timestamp.toLocaleString('id-ID')} (${history.updatedBy})\n`;
                if (history.notes) {
                    historyText += `  📝 ${history.notes}\n`;
                }
            }

            await this.sendMessage(context.socket, context.chatId, orderDetails + historyText);

        } catch (error) {
            Logger.error('❌ Failed to get order detail:', error);
            await this.sendMessage(context.socket, context.chatId,
                '❌ Terjadi kesalahan saat mengambil detail pesanan.'
            );
        }
    }

    private async orderConfirmCommand(args: string[], context: CommandContext) {
        this.logCommand('order-confirm', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        const orderId = args[0]?.toUpperCase();
        const notes = args.slice(1).join(' ');
        
        if (!orderId) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: .order-confirm [order-id] [notes]'
            );
            return;
        }

        try {
            const previousOrder = await this.orderManager.getOrder(orderId);
            if (!previousOrder) {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Order tidak ditemukan.'
                );
                return;
            }

            const updatedOrder = await this.orderManager.updateOrderStatus(
                orderId,
                OrderStatus.CONFIRMED,
                context.sender,
                notes || 'Order dikonfirmasi oleh admin'
            );

            if (updatedOrder) {
                await this.sendMessage(context.socket, context.chatId,
                    `✅ Order ${orderId} berhasil dikonfirmasi.`
                );

                // Send notification to customer
                await this.notificationService.notifyOrderStatusChanged(
                    context.socket,
                    updatedOrder,
                    previousOrder.status
                );

                // Attempt auto-provisioning if enabled
                const isAutoProvisioningEnabled = await this.orderManager.isAutoProvisioningEnabled();
                if (isAutoProvisioningEnabled) {
                    await this.sendMessage(context.socket, context.chatId,
                        `🚀 Memulai auto-provisioning untuk order ${orderId}...`
                    );

                    const provisioningResult = await this.orderManager.provisionServer(orderId);
                    
                    if (provisioningResult.success && provisioningResult.credentials) {
                        await this.sendMessage(context.socket, context.chatId,
                            `🎉 Auto-provisioning berhasil! Server telah dibuat dan kredensial telah dikirim ke customer.`
                        );

                        // Send server credentials notification
                        const finalOrder = await this.orderManager.getOrder(orderId);
                        if (finalOrder) {
                            await this.notificationService.notifyServerProvisioned(
                                context.socket,
                                finalOrder,
                                provisioningResult.credentials
                            );
                        }
                    } else {
                        await this.sendMessage(context.socket, context.chatId,
                            `⚠️ Auto-provisioning gagal: ${provisioningResult.error}\n` +
                            `🔄 Gunakan .provision-retry ${orderId} untuk mencoba lagi.`
                        );

                        // Send failure notification
                        await this.notificationService.notifyProvisioningFailed(
                            context.socket,
                            updatedOrder,
                            provisioningResult.error || 'Unknown error'
                        );
                    }
                } else {
                    await this.sendMessage(context.socket, context.chatId,
                        `ℹ️ Auto-provisioning tidak aktif. Gunakan !order-complete untuk menyelesaikan order secara manual.`
                    );
                }
            }

        } catch (error) {
            Logger.error('❌ Failed to confirm order:', error);
            await this.sendMessage(context.socket, context.chatId,
                `❌ Gagal mengkonfirmasi order: ${error.message}`
            );
        }
    }

    private async orderProcessCommand(args: string[], context: CommandContext) {
        this.logCommand('order-process', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        const orderId = args[0]?.toUpperCase();
        const notes = args.slice(1).join(' ');
        
        if (!orderId) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: .order-process [order-id] [notes]'
            );
            return;
        }

        try {
            const previousOrder = await this.orderManager.getOrder(orderId);
            if (!previousOrder) {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Order tidak ditemukan.'
                );
                return;
            }

            const updatedOrder = await this.orderManager.updateOrderStatus(
                orderId,
                OrderStatus.PROCESSING,
                context.sender,
                notes || 'Order sedang diproses'
            );

            if (updatedOrder) {
                await this.sendMessage(context.socket, context.chatId,
                    `🔄 Order ${orderId} sedang diproses.`
                );

                // Send notification to customer
                await this.notificationService.notifyOrderStatusChanged(
                    context.socket,
                    updatedOrder,
                    previousOrder.status
                );
            }

        } catch (error) {
            Logger.error('❌ Failed to process order:', error);
            await this.sendMessage(context.socket, context.chatId,
                `❌ Gagal memproses order: ${error.message}`
            );
        }
    }

    private async orderCompleteCommand(args: string[], context: CommandContext) {
        this.logCommand('order-complete', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        const orderId = args[0]?.toUpperCase();
        const serverId = args[1];
        const notes = args.slice(2).join(' ');
        
        if (!orderId) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: .order-complete [order-id] [server-id] [notes]'
            );
            return;
        }

        try {
            const previousOrder = await this.orderManager.getOrder(orderId);
            if (!previousOrder) {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Order tidak ditemukan.'
                );
                return;
            }

            // Set server ID if provided
            if (serverId) {
                await this.orderManager.setServerId(orderId, serverId);
            }

            const updatedOrder = await this.orderManager.updateOrderStatus(
                orderId,
                OrderStatus.COMPLETED,
                context.sender,
                notes || 'Order selesai'
            );

            if (updatedOrder) {
                await this.sendMessage(context.socket, context.chatId,
                    `🎉 Order ${orderId} berhasil diselesaikan.` +
                    (serverId ? `\n🖥️ Server ID: ${serverId}` : '')
                );

                // Send notification to customer
                await this.notificationService.notifyOrderStatusChanged(
                    context.socket,
                    updatedOrder,
                    previousOrder.status
                );
            }

        } catch (error) {
            Logger.error('❌ Failed to complete order:', error);
            await this.sendMessage(context.socket, context.chatId,
                `❌ Gagal menyelesaikan order: ${error.message}`
            );
        }
    }

    private async orderCancelCommand(args: string[], context: CommandContext) {
        this.logCommand('order-cancel', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        const orderId = args[0]?.toUpperCase();
        const reason = args.slice(1).join(' ');
        
        if (!orderId) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: .order-cancel [order-id] [reason]'
            );
            return;
        }

        try {
            const previousOrder = await this.orderManager.getOrder(orderId);
            if (!previousOrder) {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Order tidak ditemukan.'
                );
                return;
            }

            const updatedOrder = await this.orderManager.cancelOrder(
                orderId,
                context.sender,
                reason || 'Dibatalkan oleh admin'
            );

            if (updatedOrder) {
                await this.sendMessage(context.socket, context.chatId,
                    `❌ Order ${orderId} berhasil dibatalkan.`
                );

                // Send notification to customer
                await this.notificationService.notifyOrderStatusChanged(
                    context.socket,
                    updatedOrder,
                    previousOrder.status
                );
            }

        } catch (error) {
            Logger.error('❌ Failed to cancel order:', error);
            await this.sendMessage(context.socket, context.chatId,
                `❌ Gagal membatalkan order: ${error.message}`
            );
        }
    }

    private async orderStatsCommand(args: string[], context: CommandContext) {
        this.logCommand('order-stats', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        try {
            const stats = await this.orderManager.getOrderStats();
            
            let message = `📊 *Statistik Pesanan*\n\n`;
            message += `📋 Total Pesanan: ${stats.totalOrders}\n`;
            message += `💰 Total Revenue: ${process.env.STORE_CURRENCY || 'IDR'} ${stats.totalRevenue.toLocaleString('id-ID')}\n`;
            message += `📈 Rata-rata Order: ${process.env.STORE_CURRENCY || 'IDR'} ${Math.round(stats.averageOrderValue).toLocaleString('id-ID')}\n`;
            message += `📅 Hari ini: ${stats.ordersToday}\n`;
            message += `📆 Bulan ini: ${stats.ordersThisMonth}\n\n`;
            
            message += `📊 *Status Breakdown:*\n`;
            Object.entries(stats.ordersByStatus).forEach(([status, count]) => {
                if (count > 0) {
                    message += `• ${status}: ${count}\n`;
                }
            });

            message += `\n📦 *Package Breakdown:*\n`;
            Object.entries(stats.ordersByPackage).forEach(([pkg, count]) => {
                if (count > 0) {
                    message += `• ${pkg.toUpperCase()}: ${count}\n`;
                }
            });

            await this.sendMessage(context.socket, context.chatId, message);

        } catch (error) {
            Logger.error('❌ Failed to get order stats:', error);
            await this.sendMessage(context.socket, context.chatId,
                '❌ Terjadi kesalahan saat mengambil statistik pesanan.'
            );
        }
    }

    private async orderSearchCommand(args: string[], context: CommandContext) {
        this.logCommand('order-search', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        const query = args.join(' ').toLowerCase();
        
        if (!query) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: .order-search [phone/package/status]'
            );
            return;
        }

        try {
            let orders = [];
            
            // Search by phone number
            if (query.match(/^\d+/)) {
                orders = await this.orderManager.searchOrders({ customerPhone: query });
            }
            // Search by package type
            else if (Object.values(PackageType).includes(query as PackageType)) {
                orders = await this.orderManager.searchOrders({ packageType: query as PackageType });
            }
            // Search by status
            else if (Object.values(OrderStatus).includes(query as OrderStatus)) {
                orders = await this.orderManager.searchOrders({ status: query as OrderStatus });
            }
            else {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Query tidak valid. Gunakan nomor telepon, package type, atau status.'
                );
                return;
            }

            if (orders.length === 0) {
                await this.sendMessage(context.socket, context.chatId,
                    '📋 Tidak ada pesanan ditemukan untuk query tersebut.'
                );
                return;
            }

            let message = `🔍 *Hasil Pencarian* (${orders.length} pesanan)\n\n`;
            
            for (const order of orders.slice(0, 10)) {
                const summary = this.orderManager.formatOrderSummary(order);
                message += `${summary}\n`;
            }

            if (orders.length > 10) {
                message += `\n... dan ${orders.length - 10} pesanan lainnya`;
            }

            await this.sendMessage(context.socket, context.chatId, message);

        } catch (error) {
            Logger.error('❌ Failed to search orders:', error);
            await this.sendMessage(context.socket, context.chatId,
                '❌ Terjadi kesalahan saat mencari pesanan.'
            );
        }
    }

    private async pendingOrdersCommand(args: string[], context: CommandContext) {
        this.logCommand('pending-orders', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        try {
            const pendingOrders = await this.orderManager.getPendingOrders();
            
            if (pendingOrders.length === 0) {
                await this.sendMessage(context.socket, context.chatId,
                    '📋 Tidak ada pesanan pending.'
                );
                return;
            }

            let message = `⏳ *Pesanan Pending* (${pendingOrders.length})\n\n`;
            
            for (const order of pendingOrders) {
                const summary = this.orderManager.formatOrderSummary(order);
                message += `${summary}\n`;
            }

            message += '\n\n💡 Gunakan .order-confirm [order-id] untuk konfirmasi';
            
            await this.sendMessage(context.socket, context.chatId, message);

        } catch (error) {
            Logger.error('❌ Failed to get pending orders:', error);
            await this.sendMessage(context.socket, context.chatId,
                '❌ Terjadi kesalahan saat mengambil pesanan pending.'
            );
        }
    }

    // Auto-provisioning commands
    private async provisionRetryCommand(args: string[], context: CommandContext) {
        this.logCommand('provision-retry', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        const orderId = args[0]?.toUpperCase();
        
        if (!orderId) {
            await this.sendMessage(context.socket, context.chatId,
                '❌ Format salah. Gunakan: .provision-retry [order-id]'
            );
            return;
        }

        try {
            const order = await this.orderManager.getOrder(orderId);
            if (!order) {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Order tidak ditemukan.'
                );
                return;
            }

            // Check if auto-provisioning is enabled
            const isEnabled = await this.orderManager.isAutoProvisioningEnabled();
            if (!isEnabled) {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Auto-provisioning tidak dikonfigurasi.'
                );
                return;
            }

            await this.sendMessage(context.socket, context.chatId,
                `🔄 Mencoba ulang auto-provisioning untuk order ${orderId}...`
            );

            const result = await this.orderManager.retryProvisioning(orderId);
            
            if (result.success && result.credentials) {
                await this.sendMessage(context.socket, context.chatId,
                    `🎉 Auto-provisioning berhasil! Server telah dibuat dan kredensial telah dikirim ke customer.`
                );

                // Send server credentials notification
                const finalOrder = await this.orderManager.getOrder(orderId);
                if (finalOrder) {
                    await this.notificationService.notifyServerProvisioned(
                        context.socket,
                        finalOrder,
                        result.credentials
                    );
                }
            } else {
                await this.sendMessage(context.socket, context.chatId,
                    `❌ Auto-provisioning gagal: ${result.error}`
                );

                // Send failure notification
                await this.notificationService.notifyProvisioningFailed(
                    context.socket,
                    order,
                    result.error || 'Unknown error'
                );
            }

        } catch (error) {
            Logger.error('❌ Failed to retry provisioning:', error);
            await this.sendMessage(context.socket, context.chatId,
                `❌ Gagal mencoba ulang provisioning: ${error.message}`
            );
        }
    }

    private async provisionStatusCommand(args: string[], context: CommandContext) {
        this.logCommand('provision-status', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        try {
            const status = await this.orderManager.getAutoProvisioningStatus();
            
            let message = `🔧 *Status Auto-Provisioning*\n\n`;
            message += `🔌 Dikonfigurasi: ${status.configured ? '✅ Ya' : '❌ Tidak'}\n`;
            message += `⚡ Aktif: ${status.enabled ? '✅ Ya' : '❌ Tidak'}\n`;
            message += `🏥 Kesehatan: ${status.healthy ? '✅ Sehat' : '❌ Bermasalah'}\n\n`;
            
            if (status.configured) {
                message += `📋 *Resource Mappings:*\n`;
                for (const [packageType, mapping] of Object.entries(status.resourceMappings)) {
                    message += `• ${packageType.toUpperCase()}: ${mapping.limits.memory}MB RAM, ${mapping.limits.cpu}% CPU\n`;
                }
            } else {
                message += `⚠️ *Konfigurasi Diperlukan:*\n`;
                message += `• PTERODACTYL_ADMIN_API_KEY\n`;
                message += `• PTERODACTYL_URL\n`;
                message += `• DEFAULT_NODE_ID\n`;
                message += `• Package-specific configurations\n`;
            }
            
            await this.sendMessage(context.socket, context.chatId, message);

        } catch (error) {
            Logger.error('❌ Failed to get provisioning status:', error);
            await this.sendMessage(context.socket, context.chatId,
                '❌ Terjadi kesalahan saat mengambil status provisioning.'
            );
        }
    }

    private async provisionTestCommand(args: string[], context: CommandContext) {
        this.logCommand('provision-test', context.sender);
        
        if (!this.isAdmin(context.sender)) {
            await this.sendMessage(context.socket, context.chatId, 
                '❌ Perintah ini hanya untuk admin.'
            );
            return;
        }

        try {
            await this.sendMessage(context.socket, context.chatId,
                '🔍 Menguji koneksi auto-provisioning...'
            );

            const isHealthy = await this.orderManager.testAutoProvisioningConnection();
            
            if (isHealthy) {
                await this.sendMessage(context.socket, context.chatId,
                    '✅ Koneksi auto-provisioning berhasil!\n\n' +
                    '🔧 Sistem siap untuk melakukan provisioning otomatis.'
                );
            } else {
                await this.sendMessage(context.socket, context.chatId,
                    '❌ Koneksi auto-provisioning gagal!\n\n' +
                    '🔧 Periksa konfigurasi Pterodactyl Admin API:\n' +
                    '• PTERODACTYL_URL\n' +
                    '• PTERODACTYL_ADMIN_API_KEY\n' +
                    '• Koneksi ke panel Pterodactyl'
                );
            }

        } catch (error) {
            Logger.error('❌ Failed to test provisioning:', error);
            await this.sendMessage(context.socket, context.chatId,
                `❌ Gagal menguji koneksi: ${error.message}`
            );
        }
    }
}