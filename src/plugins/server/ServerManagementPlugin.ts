import { BasePlugin } from '../BasePlugin';
import { PluginMetadata, PluginDependencies, Command } from '../types';
import { ServerMonitoringService } from '../../services/ServerMonitoringService';
import { SubscriptionManager } from '../../services/SubscriptionManager';
import { PterodactylAdminAPI } from '../../services/PterodactylAdminAPI';
import { OrderManager } from '../store/OrderManager';
import { Logger } from '../../utils/logger';
import { WASocket } from '@whiskeysockets/baileys';

export class ServerManagementPlugin extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'Server Management',
        version: '1.0.0',
        description: 'Comprehensive server monitoring and subscription management',
        category: 'admin',
        author: 'System',
        dependencies: []
    };

    private monitoringService: ServerMonitoringService;
    private subscriptionManager: SubscriptionManager;
    private adminAPI: PterodactylAdminAPI;
    private orderManager: OrderManager;

    constructor(dependencies: PluginDependencies = {}) {
        super(dependencies);
        this.monitoringService = ServerMonitoringService.getInstance();
        this.subscriptionManager = SubscriptionManager.getInstance();
        this.adminAPI = new PterodactylAdminAPI();
        this.orderManager = OrderManager.getInstance();
    }

    protected async onInitialize(): Promise<void> {
        Logger.info('🖥️ Initializing Server Management Plugin...');
        
        // Start monitoring service
        await this.monitoringService.startMonitoring(5); // 5 minute intervals
        
        // Start subscription scheduler
        await this.subscriptionManager.startScheduler(6); // 6 hour intervals
        
        Logger.info('✅ Server Management Plugin initialized');
    }

    protected registerCommands(): void {
        // Server list and monitoring commands
        this.registerCommand({
            name: '.servers',
            description: 'List all servers with status',
            category: 'admin',
            usage: '.servers [status]',
            adminOnly: true,
            handler: this.handleServerList.bind(this)
        });

        this.registerCommand({
            name: '.server-info',
            description: 'Get detailed server information',
            category: 'admin',
            usage: '.server-info <server-uuid>',
            adminOnly: true,
            handler: this.handleServerInfo.bind(this)
        });

        this.registerCommand({
            name: '.server-stats',
            description: 'Get server monitoring statistics',
            category: 'admin',
            usage: '.server-stats',
            adminOnly: true,
            handler: this.handleServerStats.bind(this)
        });

        // Subscription management commands
        this.registerCommand({
            name: '.subscriptions',
            description: 'List all active subscriptions',
            category: 'admin',
            usage: '.subscriptions',
            adminOnly: true,
            handler: this.handleSubscriptionList.bind(this)
        });

        this.registerCommand({
            name: '.expiring-soon',
            description: 'List subscriptions expiring soon',
            category: 'admin',
            usage: '.expiring-soon [days]',
            adminOnly: true,
            handler: this.handleExpiringSoon.bind(this)
        });

        this.registerCommand({
            name: '.expired-servers',
            description: 'List expired servers',
            category: 'admin',
            usage: '.expired-servers',
            adminOnly: true,
            handler: this.handleExpiredServers.bind(this)
        });

        // Server suspension commands
        this.registerCommand({
            name: '.suspend-server',
            description: 'Suspend a server',
            category: 'admin',
            usage: '.suspend-server <server-id> [reason]',
            adminOnly: true,
            handler: this.handleSuspendServer.bind(this)
        });

        this.registerCommand({
            name: '.resume-server',
            description: 'Resume a suspended server',
            category: 'admin',
            usage: '.resume-server <server-id> [reason]',
            adminOnly: true,
            handler: this.handleResumeServer.bind(this)
        });

        // Subscription renewal commands
        this.registerCommand({
            name: '.renew-subscription',
            description: 'Renew a subscription',
            category: 'admin',
            usage: '.renew-subscription <order-id> <duration-months>',
            adminOnly: true,
            handler: this.handleRenewSubscription.bind(this)
        });

        // Monitoring control commands
        this.registerCommand({
            name: '.monitoring-status',
            description: 'Get monitoring service status',
            category: 'admin',
            usage: '.monitoring-status',
            adminOnly: true,
            handler: this.handleMonitoringStatus.bind(this)
        });

        this.registerCommand({
            name: '.refresh-servers',
            description: 'Force refresh server list from Pterodactyl',
            category: 'admin',
            usage: '.refresh-servers',
            adminOnly: true,
            handler: this.handleRefreshServers.bind(this)
        });

        // Customer server commands
        this.registerCommand({
            name: '.my-servers',
            description: 'List your servers',
            category: 'customer',
            usage: '.my-servers',
            adminOnly: false,
            handler: this.handleMyServers.bind(this)
        });

        this.registerCommand({
            name: '.server-status',
            description: 'Check your server status',
            category: 'customer',
            usage: '.server-status <order-id>',
            adminOnly: false,
            handler: this.handleServerStatus.bind(this)
        });
    }

    private async handleServerList(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            const args = message.split(' ');
            const status = args[1]; // Optional status filter
            
            let servers = await this.monitoringService.getServerList();
            
            if (status) {
                servers = servers.filter(s => s.status === status || (status === 'suspended' && s.suspended));
            }

            if (servers.length === 0) {
                await this.sendMessage(socket, chatId, '📋 Tidak ada server ditemukan.');
                return;
            }

            let response = `🖥️ *Daftar Server* (${servers.length})\n\n`;
            
            servers.slice(0, 20).forEach(server => {
                const statusIcon = server.suspended ? '⏸️' : (server.status === 'running' ? '🟢' : '🔴');
                const expiryInfo = server.daysUntilExpiry !== undefined 
                    ? `(${server.daysUntilExpiry > 0 ? server.daysUntilExpiry + ' hari' : 'EXPIRED'})` 
                    : '';
                
                response += `${statusIcon} *${server.name}*\n`;
                response += `📦 ${server.packageType || 'Unknown'} ${expiryInfo}\n`;
                response += `👤 ${server.customer || 'Unknown'}\n`;
                response += `🆔 ${server.serverUuid}\n\n`;
            });

            if (servers.length > 20) {
                response += `\n... dan ${servers.length - 20} server lainnya`;
            }

            await this.sendMessage(socket, chatId, response);
        } catch (error) {
            Logger.error('Error handling server list:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal mengambil daftar server.');
        }
    }

    private async handleServerInfo(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            const args = message.split(' ');
            if (args.length < 2) {
                await this.sendError(socket, chatId, 'Format Salah', 'Format: .server-info <server-uuid>');
                return;
            }

            const serverUuid = args[1];
            const server = await this.monitoringService.getServer(serverUuid, true);
            
            if (!server) {
                await this.sendError(socket, chatId, 'Server Tidak Ditemukan', 'Server dengan UUID tersebut tidak ditemukan.');
                return;
            }

            const statusIcon = server.suspended ? '⏸️' : (server.status === 'running' ? '🟢' : '🔴');
            const expiryInfo = server.daysUntilExpiry !== undefined 
                ? (server.daysUntilExpiry > 0 
                    ? `${server.daysUntilExpiry} hari lagi` 
                    : `EXPIRED (${Math.abs(server.daysUntilExpiry)} hari yang lalu)`)
                : 'Tidak diketahui';

            let response = `🖥️ *Detail Server*\n\n`;
            response += `📛 Nama: ${server.name}\n`;
            response += `${statusIcon} Status: ${server.status.toUpperCase()}\n`;
            response += `🆔 UUID: ${server.serverUuid}\n`;
            response += `📦 Package: ${server.packageType || 'Unknown'}\n`;
            response += `👤 Customer: ${server.customer || 'Unknown'}\n`;
            response += `📅 Dibuat: ${server.createdAt.toLocaleDateString('id-ID')}\n`;
            response += `⏰ Expired: ${expiryInfo}\n\n`;

            response += `💾 *Resource Limits:*\n`;
            response += `🧠 Memory: ${server.limits.memory} MB\n`;
            response += `💽 Disk: ${server.limits.disk} MB\n`;
            response += `⚡ CPU: ${server.limits.cpu}%\n\n`;

            if (server.resources) {
                const memoryUsage = Math.round(server.resources.memory_bytes / 1024 / 1024);
                const diskUsage = Math.round(server.resources.disk_bytes / 1024 / 1024);
                const uptime = Math.floor(server.resources.uptime / 3600); // hours

                response += `📊 *Resource Usage:*\n`;
                response += `🧠 Memory: ${memoryUsage}/${server.limits.memory} MB\n`;
                response += `💽 Disk: ${diskUsage}/${server.limits.disk} MB\n`;
                response += `⚡ CPU: ${server.resources.cpu_absolute.toFixed(1)}%\n`;
                response += `⏱️ Uptime: ${uptime} jam\n`;
            }

            await this.sendMessage(socket, chatId, response);
        } catch (error) {
            Logger.error('Error handling server info:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal mengambil informasi server.');
        }
    }

    private async handleServerStats(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            const stats = await this.monitoringService.getMonitoringStats();
            
            let response = `📊 *Statistik Server*\n\n`;
            response += `🖥️ Total Server: ${stats.totalServers}\n`;
            response += `🟢 Aktif: ${stats.activeServers}\n`;
            response += `⏸️ Suspended: ${stats.suspendedServers}\n`;
            response += `⚠️ Akan Expired: ${stats.expiringSoon}\n`;
            response += `❌ Sudah Expired: ${stats.expiredServers}\n\n`;

            response += `📈 *Status Breakdown:*\n`;
            Object.entries(stats.serversByStatus).forEach(([status, count]) => {
                const icon = status === 'running' ? '🟢' : status === 'suspended' ? '⏸️' : '🔴';
                response += `${icon} ${status}: ${count}\n`;
            });

            response += `\n💾 *Resource Usage:*\n`;
            response += `🧠 Memory: ${Math.round(stats.resourceUsage.usedMemoryMB)}/${Math.round(stats.resourceUsage.totalMemoryMB)} MB\n`;
            response += `💽 Disk: ${Math.round(stats.resourceUsage.usedDiskMB)}/${Math.round(stats.resourceUsage.totalDiskMB)} MB\n`;
            response += `⚡ Avg CPU: ${stats.resourceUsage.averageCpuUsage.toFixed(1)}%\n`;

            await this.sendMessage(socket, chatId, response);
        } catch (error) {
            Logger.error('Error handling server stats:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal mengambil statistik server.');
        }
    }

    private async handleSubscriptionList(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            const subscriptions = await this.subscriptionManager.getSubscriptions();
            
            if (subscriptions.length === 0) {
                await this.sendMessage(socket, chatId, '📋 Tidak ada subscription aktif.');
                return;
            }

            let response = `📋 *Daftar Subscription* (${subscriptions.length})\n\n`;
            
            subscriptions.slice(0, 15).forEach(sub => {
                const statusIcon = sub.status === 'active' ? '🟢' : 
                                 sub.status === 'expiring' ? '⚠️' : 
                                 sub.status === 'expired' ? '❌' : '⏸️';
                
                response += `${statusIcon} *${sub.packageType}*\n`;
                response += `👤 ${sub.customerPhone}\n`;
                response += `⏰ ${sub.daysUntilExpiry > 0 ? sub.daysUntilExpiry + ' hari' : 'EXPIRED'}\n`;
                response += `🆔 ${sub.orderId}\n\n`;
            });

            if (subscriptions.length > 15) {
                response += `\n... dan ${subscriptions.length - 15} subscription lainnya`;
            }

            await this.sendMessage(socket, chatId, response);
        } catch (error) {
            Logger.error('Error handling subscription list:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal mengambil daftar subscription.');
        }
    }

    private async handleExpiringSoon(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            const args = message.split(' ');
            const days = parseInt(args[1]) || 7;
            
            const subscriptions = await this.subscriptionManager.getExpiringSubscriptions(days);
            
            if (subscriptions.length === 0) {
                await this.sendMessage(socket, chatId, `📋 Tidak ada subscription yang akan expired dalam ${days} hari.`);
                return;
            }

            let response = `⚠️ *Subscription Akan Expired* (${days} hari)\n\n`;
            
            subscriptions.forEach(sub => {
                response += `📦 *${sub.packageType}*\n`;
                response += `👤 ${sub.customerPhone}\n`;
                response += `⏰ ${sub.daysUntilExpiry} hari lagi\n`;
                response += `📅 ${sub.expiryDate.toLocaleDateString('id-ID')}\n`;
                response += `🆔 ${sub.orderId}\n\n`;
            });

            await this.sendMessage(socket, chatId, response);
        } catch (error) {
            Logger.error('Error handling expiring soon:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal mengambil daftar subscription yang akan expired.');
        }
    }

    private async handleExpiredServers(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            const expiredSubscriptions = await this.subscriptionManager.getExpiredSubscriptions();
            
            if (expiredSubscriptions.length === 0) {
                await this.sendMessage(socket, chatId, '📋 Tidak ada server yang expired.');
                return;
            }

            let response = `❌ *Server Expired* (${expiredSubscriptions.length})\n\n`;
            
            expiredSubscriptions.forEach(sub => {
                response += `📦 *${sub.packageType}*\n`;
                response += `👤 ${sub.customerPhone}\n`;
                response += `📅 Expired: ${Math.abs(sub.daysUntilExpiry)} hari lalu\n`;
                response += `🆔 ${sub.orderId}\n\n`;
            });

            await this.sendMessage(socket, chatId, response);
        } catch (error) {
            Logger.error('Error handling expired servers:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal mengambil daftar server expired.');
        }
    }

    private async handleSuspendServer(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            const args = message.split(' ');
            if (args.length < 2) {
                await this.sendError(socket, chatId, 'Format Salah', 'Format: .suspend-server <server-id> [reason]');
                return;
            }

            const serverId = args[1];
            const reason = args.slice(2).join(' ') || 'Suspended by admin';
            
            const result = await this.subscriptionManager.suspendServer(serverId, reason);
            
            if (result.success) {
                await this.sendSuccess(socket, chatId, 'Server Suspended', `Server ${result.serverName} berhasil disuspend.\nAlasan: ${result.reason}`);
            } else {
                await this.sendError(socket, chatId, 'Gagal Suspend Server', result.error || 'Unknown error');
            }
        } catch (error) {
            Logger.error('Error handling suspend server:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal suspend server.');
        }
    }

    private async handleResumeServer(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            const args = message.split(' ');
            if (args.length < 2) {
                await this.sendError(socket, chatId, 'Format Salah', 'Format: .resume-server <server-id> [reason]');
                return;
            }

            const serverId = args[1];
            const reason = args.slice(2).join(' ') || 'Resumed by admin';
            
            const result = await this.subscriptionManager.resumeServer(serverId, reason);
            
            if (result.success) {
                await this.sendSuccess(socket, chatId, 'Server Resumed', `Server ${result.serverName} berhasil diaktifkan kembali.\nAlasan: ${result.reason}`);
            } else {
                await this.sendError(socket, chatId, 'Gagal Resume Server', result.error || 'Unknown error');
            }
        } catch (error) {
            Logger.error('Error handling resume server:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal aktifkan server.');
        }
    }

    private async handleRenewSubscription(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            const args = message.split(' ');
            if (args.length < 3) {
                await this.sendError(socket, chatId, 'Format Salah', 'Format: .renew-subscription <order-id> <duration-months>');
                return;
            }

            const orderId = args[1];
            const duration = parseInt(args[2]);

            if (isNaN(duration) || duration <= 0) {
                await this.sendError(socket, chatId, 'Durasi Tidak Valid', 'Durasi harus berupa angka positif.');
                return;
            }

            const success = await this.subscriptionManager.renewSubscription(orderId, {
                duration,
                paymentReceived: true, // Assume payment is verified by admin
                notes: `Renewed by admin via WhatsApp command`
            });

            if (success) {
                await this.sendSuccess(socket, chatId, 'Subscription Renewed', `Subscription ${orderId} berhasil diperpanjang ${duration} bulan.`);
            } else {
                await this.sendError(socket, chatId, 'Gagal Perpanjang', `Gagal memperpanjang subscription ${orderId}.`);
            }
        } catch (error) {
            Logger.error('Error handling renew subscription:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal memperpanjang subscription.');
        }
    }

    private async handleMonitoringStatus(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            const monitoringStatus = this.monitoringService.isMonitoring();
            const schedulerStatus = this.subscriptionManager.getSchedulerStatus();
            const cacheInfo = this.monitoringService.getCacheInfo();
            
            let response = `📊 *Status Monitoring System*\n\n`;
            response += `🔍 Server Monitoring: ${monitoringStatus ? '✅ Aktif' : '❌ Tidak Aktif'}\n`;
            response += `⏰ Subscription Scheduler: ${schedulerStatus.running ? '✅ Aktif' : '❌ Tidak Aktif'}\n`;
            response += `📋 Queue Size: ${schedulerStatus.queueSize}\n`;
            response += `💾 Cached Servers: ${cacheInfo.cachedServers}\n`;
            response += `🕐 Last Update: ${cacheInfo.lastUpdate.toLocaleString('id-ID')}\n`;

            await this.sendMessage(socket, chatId, response);
        } catch (error) {
            Logger.error('Error handling monitoring status:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal mengambil status monitoring.');
        }
    }

    private async handleRefreshServers(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            if (!this.isAdmin(sender)) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Hanya admin yang dapat menggunakan command ini.');
                return;
            }

            await this.sendMessage(socket, chatId, '🔄 Memperbarui daftar server...');
            
            const servers = await this.monitoringService.scanAllServers();
            
            await this.sendSuccess(socket, chatId, 'Server List Updated', `Berhasil memperbarui ${servers.length} server dari Pterodactyl.`);
        } catch (error) {
            Logger.error('Error handling refresh servers:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal memperbarui daftar server.');
        }
    }

    private async handleMyServers(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            const phoneNumber = sender.replace('@s.whatsapp.net', '');
            const servers = await this.monitoringService.getServersByCustomer(phoneNumber);
            
            if (servers.length === 0) {
                await this.sendMessage(socket, chatId, '📋 Anda tidak memiliki server aktif.');
                return;
            }

            let response = `🖥️ *Server Anda* (${servers.length})\n\n`;
            
            servers.forEach(server => {
                const statusIcon = server.suspended ? '⏸️' : (server.status === 'running' ? '🟢' : '🔴');
                const expiryInfo = server.daysUntilExpiry !== undefined 
                    ? (server.daysUntilExpiry > 0 ? `${server.daysUntilExpiry} hari` : 'EXPIRED')
                    : '';
                
                response += `${statusIcon} *${server.name}*\n`;
                response += `📦 ${server.packageType || 'Unknown'}\n`;
                response += `⏰ ${expiryInfo}\n`;
                response += `🆔 Order: ${server.orderId}\n\n`;
            });

            await this.sendMessage(socket, chatId, response);
        } catch (error) {
            Logger.error('Error handling my servers:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal mengambil daftar server Anda.');
        }
    }

    private async handleServerStatus(socket: WASocket, chatId: string, sender: string, message: string): Promise<void> {
        try {
            const args = message.split(' ');
            if (args.length < 2) {
                await this.sendError(socket, chatId, 'Format Salah', 'Format: .server-status <order-id>');
                return;
            }

            const orderId = args[1];
            const phoneNumber = sender.replace('@s.whatsapp.net', '');
            const subscription = await this.subscriptionManager.getSubscription(orderId);
            
            if (!subscription) {
                await this.sendError(socket, chatId, 'Order Tidak Ditemukan', 'Order tidak ditemukan atau tidak memiliki server.');
                return;
            }

            if (subscription.customerPhone !== phoneNumber) {
                await this.sendError(socket, chatId, 'Akses Ditolak', 'Anda tidak memiliki akses ke server ini.');
                return;
            }

            const server = await this.monitoringService.getServer(subscription.serverUuid);
            if (!server) {
                await this.sendError(socket, chatId, 'Server Tidak Ditemukan', 'Server tidak ditemukan di sistem monitoring.');
                return;
            }

            const statusIcon = server.suspended ? '⏸️' : (server.status === 'running' ? '🟢' : '🔴');
            const expiryInfo = server.daysUntilExpiry !== undefined 
                ? (server.daysUntilExpiry > 0 
                    ? `${server.daysUntilExpiry} hari lagi` 
                    : `EXPIRED (${Math.abs(server.daysUntilExpiry)} hari yang lalu)`)
                : 'Tidak diketahui';

            let response = `🖥️ *Status Server Anda*\n\n`;
            response += `📛 Nama: ${server.name}\n`;
            response += `${statusIcon} Status: ${server.status.toUpperCase()}\n`;
            response += `📦 Package: ${server.packageType}\n`;
            response += `⏰ Expired: ${expiryInfo}\n`;
            response += `🆔 Order: ${orderId}\n`;

            if (server.suspended) {
                response += `\n⚠️ Server Anda sedang disuspend. Hubungi admin untuk informasi lebih lanjut.`;
            }

            await this.sendMessage(socket, chatId, response);
        } catch (error) {
            Logger.error('Error handling server status:', error);
            await this.sendError(socket, chatId, 'Error', 'Gagal mengambil status server.');
        }
    }

    protected async onShutdown(): Promise<void> {
        Logger.info('🧹 Cleaning up Server Management Plugin...');
        
        this.monitoringService.stopMonitoring();
        this.subscriptionManager.stopScheduler();
        
        Logger.info('✅ Server Management Plugin cleanup completed');
    }
}