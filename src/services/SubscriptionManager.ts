import { PterodactylAdminAPI } from './PterodactylAdminAPI';
import { ServerMonitoringService, ServerStatus } from './ServerMonitoringService';
import { OrderManager } from '../plugins/store/OrderManager';
import { Order, OrderStatus } from '../plugins/store/models/Order';
import { NotificationService } from '../plugins/store/NotificationService';
import { Logger } from '../utils/logger';

export interface SubscriptionInfo {
    orderId: string;
    serverId: string;
    serverUuid: string;
    customerPhone: string;
    packageType: string;
    createdAt: Date;
    expiryDate: Date;
    daysUntilExpiry: number;
    status: 'active' | 'expiring' | 'expired' | 'suspended' | 'cancelled';
    autoRenewal: boolean;
    notificationsSent: string[]; // ['7days', '3days', '1day', 'expired']
}

export interface SuspensionResult {
    success: boolean;
    serverId: string;
    serverName: string;
    reason: string;
    error?: string;
}

export interface RenewalOptions {
    duration: number; // months
    paymentReceived: boolean;
    notes?: string;
}

export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private adminAPI: PterodactylAdminAPI;
    private monitoringService: ServerMonitoringService;
    private orderManager: OrderManager;
    private notificationService: NotificationService;
    private schedulerInterval: NodeJS.Timeout | null = null;
    private suspensionQueue: Set<string> = new Set();

    private constructor() {
        this.adminAPI = new PterodactylAdminAPI();
        this.monitoringService = ServerMonitoringService.getInstance();
        this.orderManager = new OrderManager();
        this.notificationService = NotificationService.getInstance();
    }

    public static getInstance(): SubscriptionManager {
        if (!SubscriptionManager.instance) {
            SubscriptionManager.instance = new SubscriptionManager();
        }
        return SubscriptionManager.instance;
    }

    /**
     * Start subscription management scheduler
     */
    async startScheduler(intervalHours: number = 6): Promise<void> {
        if (this.schedulerInterval) {
            Logger.info('⏰ Subscription scheduler is already running');
            return;
        }

        Logger.info(`🔄 Starting subscription scheduler with ${intervalHours} hour intervals`);
        
        // Initial run
        await this.processSubscriptions();
        
        // Set up periodic processing
        this.schedulerInterval = setInterval(async () => {
            try {
                await this.processSubscriptions();
            } catch (error) {
                Logger.error('❌ Error during subscription processing:', error);
            }
        }, intervalHours * 60 * 60 * 1000);

        Logger.info('✅ Subscription scheduler started successfully');
    }

    /**
     * Stop subscription scheduler
     */
    stopScheduler(): void {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
            Logger.info('⏹️ Subscription scheduler stopped');
        }
    }

    /**
     * Process all subscriptions (notifications and suspensions)
     */
    async processSubscriptions(): Promise<void> {
        try {
            Logger.info('🔄 Processing subscriptions...');
            
            const servers = await this.monitoringService.getServerList(true);
            const subscriptions = await this.buildSubscriptionList(servers);
            
            // Send expiration notifications
            await this.sendExpirationNotifications(subscriptions);
            
            // Process auto suspensions
            await this.processAutoSuspensions(subscriptions);
            
            Logger.info(`✅ Processed ${subscriptions.length} subscriptions`);
        } catch (error) {
            Logger.error('❌ Failed to process subscriptions:', error);
            throw error;
        }
    }

    /**
     * Get all active subscriptions
     */
    async getSubscriptions(): Promise<SubscriptionInfo[]> {
        const servers = await this.monitoringService.getServerList();
        return await this.buildSubscriptionList(servers);
    }

    /**
     * Get subscription by order ID
     */
    async getSubscription(orderId: string): Promise<SubscriptionInfo | null> {
        const subscriptions = await this.getSubscriptions();
        return subscriptions.find(sub => sub.orderId === orderId) || null;
    }

    /**
     * Get subscriptions by customer
     */
    async getSubscriptionsByCustomer(customerPhone: string): Promise<SubscriptionInfo[]> {
        const subscriptions = await this.getSubscriptions();
        return subscriptions.filter(sub => sub.customerPhone === customerPhone);
    }

    /**
     * Get expiring subscriptions
     */
    async getExpiringSubscriptions(daysThreshold: number = 7): Promise<SubscriptionInfo[]> {
        const subscriptions = await this.getSubscriptions();
        return subscriptions.filter(sub => 
            sub.daysUntilExpiry <= daysThreshold && 
            sub.daysUntilExpiry > 0 &&
            sub.status === 'expiring'
        );
    }

    /**
     * Get expired subscriptions
     */
    async getExpiredSubscriptions(): Promise<SubscriptionInfo[]> {
        const subscriptions = await this.getSubscriptions();
        return subscriptions.filter(sub => 
            sub.daysUntilExpiry <= 0 && 
            sub.status === 'expired'
        );
    }

    /**
     * Suspend server manually
     */
    async suspendServer(serverId: string, reason: string = 'Manual suspension'): Promise<SuspensionResult> {
        try {
            Logger.info(`⏸️ Suspending server ${serverId}: ${reason}`);
            
            const serverInfo = await this.adminAPI.getServer(parseInt(serverId));
            
            if (serverInfo.suspended) {
                return {
                    success: true,
                    serverId,
                    serverName: serverInfo.name,
                    reason: 'Server already suspended'
                };
            }

            await this.adminAPI.suspendServer(parseInt(serverId));
            
            // Update order notes if linked
            const orderId = this.extractOrderIdFromServerName(serverInfo.name);
            if (orderId) {
                await this.orderManager.addOrderNote(orderId, `Server suspended: ${reason}`, true);
            }

            Logger.info(`✅ Server ${serverId} suspended successfully`);
            
            return {
                success: true,
                serverId,
                serverName: serverInfo.name,
                reason
            };
        } catch (error) {
            Logger.error(`❌ Failed to suspend server ${serverId}:`, error);
            return {
                success: false,
                serverId,
                serverName: 'Unknown',
                reason,
                error: error.message
            };
        }
    }

    /**
     * Resume server (unsuspend)
     */
    async resumeServer(serverId: string, reason: string = 'Manual resume'): Promise<SuspensionResult> {
        try {
            Logger.info(`▶️ Resuming server ${serverId}: ${reason}`);
            
            const serverInfo = await this.adminAPI.getServer(parseInt(serverId));
            
            if (!serverInfo.suspended) {
                return {
                    success: true,
                    serverId,
                    serverName: serverInfo.name,
                    reason: 'Server already active'
                };
            }

            await this.adminAPI.unsuspendServer(parseInt(serverId));
            
            // Update order notes if linked
            const orderId = this.extractOrderIdFromServerName(serverInfo.name);
            if (orderId) {
                await this.orderManager.addOrderNote(orderId, `Server resumed: ${reason}`, true);
            }

            Logger.info(`✅ Server ${serverId} resumed successfully`);
            
            return {
                success: true,
                serverId,
                serverName: serverInfo.name,
                reason
            };
        } catch (error) {
            Logger.error(`❌ Failed to resume server ${serverId}:`, error);
            return {
                success: false,
                serverId,
                serverName: 'Unknown',
                reason,
                error: error.message
            };
        }
    }

    /**
     * Renew subscription
     */
    async renewSubscription(orderId: string, options: RenewalOptions): Promise<boolean> {
        try {
            Logger.info(`🔄 Renewing subscription for order ${orderId}`);
            
            const order = await this.orderManager.getOrder(orderId);
            if (!order) {
                throw new Error(`Order not found: ${orderId}`);
            }

            if (!options.paymentReceived) {
                throw new Error('Payment must be received before renewal');
            }

            // Create new order for renewal
            const renewalOrder = await this.orderManager.createOrder(
                order.customer.phoneNumber,
                order.customer.chatId,
                order.item.packageType,
                options.duration,
                order.customer.displayName
            );

            // Update original order with renewal info
            await this.orderManager.addOrderNote(
                orderId, 
                `Renewed with order ${renewalOrder.id} for ${options.duration} months. ${options.notes || ''}`,
                true
            );

            // If server is suspended, resume it
            const subscription = await this.getSubscription(orderId);
            if (subscription && subscription.status === 'suspended') {
                await this.resumeServer(subscription.serverId, `Subscription renewed: ${renewalOrder.id}`);
            }

            Logger.info(`✅ Subscription renewed successfully: ${orderId} -> ${renewalOrder.id}`);
            return true;
        } catch (error) {
            Logger.error(`❌ Failed to renew subscription ${orderId}:`, error);
            return false;
        }
    }

    /**
     * Build subscription list from server data
     */
    private async buildSubscriptionList(servers: ServerStatus[]): Promise<SubscriptionInfo[]> {
        const subscriptions: SubscriptionInfo[] = [];
        
        for (const server of servers) {
            if (server.orderId && server.expiryDate && server.customer) {
                const subscription: SubscriptionInfo = {
                    orderId: server.orderId,
                    serverId: server.serverId,
                    serverUuid: server.serverUuid,
                    customerPhone: server.customer,
                    packageType: server.packageType || 'unknown',
                    createdAt: server.createdAt,
                    expiryDate: server.expiryDate,
                    daysUntilExpiry: server.daysUntilExpiry || 0,
                    status: this.determineSubscriptionStatus(server),
                    autoRenewal: false, // TODO: Implement auto-renewal preferences
                    notificationsSent: [] // TODO: Track notification history
                };
                
                subscriptions.push(subscription);
            }
        }
        
        return subscriptions;
    }

    /**
     * Determine subscription status based on server data
     */
    private determineSubscriptionStatus(server: ServerStatus): SubscriptionInfo['status'] {
        if (server.suspended) return 'suspended';
        if (server.daysUntilExpiry === undefined) return 'active';
        if (server.daysUntilExpiry <= 0) return 'expired';
        if (server.daysUntilExpiry <= 7) return 'expiring';
        return 'active';
    }

    /**
     * Send expiration notifications
     */
    private async sendExpirationNotifications(subscriptions: SubscriptionInfo[]): Promise<void> {
        const notificationThresholds = [7, 3, 1]; // days before expiry
        
        for (const subscription of subscriptions) {
            if (subscription.status === 'cancelled' || subscription.status === 'suspended') {
                continue;
            }
            
            for (const threshold of notificationThresholds) {
                if (subscription.daysUntilExpiry === threshold) {
                    const notificationKey = `${threshold}days`;
                    
                    if (!subscription.notificationsSent.includes(notificationKey)) {
                        await this.sendExpirationNotification(subscription, threshold);
                        subscription.notificationsSent.push(notificationKey);
                    }
                }
            }
            
            // Send expired notification
            if (subscription.daysUntilExpiry <= 0 && subscription.status === 'expired') {
                const notificationKey = 'expired';
                
                if (!subscription.notificationsSent.includes(notificationKey)) {
                    await this.sendExpiredNotification(subscription);
                    subscription.notificationsSent.push(notificationKey);
                }
            }
        }
    }

    /**
     * Send expiration warning notification
     */
    private async sendExpirationNotification(subscription: SubscriptionInfo, daysLeft: number): Promise<void> {
        try {
            const message = `⚠️ *Peringatan Masa Berlaku Server*\n\n` +
                `🖥️ Server: ${subscription.packageType}\n` +
                `📅 Akan berakhir dalam: *${daysLeft} hari*\n` +
                `📆 Tanggal berakhir: ${subscription.expiryDate.toLocaleDateString('id-ID')}\n\n` +
                `💡 Silakan perpanjang langganan Anda sebelum server disuspend otomatis.\n` +
                `📞 Hubungi admin untuk perpanjangan.`;
            
            await this.notificationService.sendNotification(subscription.customerPhone, message);
            
            Logger.info(`📧 Expiration notification sent to ${subscription.customerPhone} (${daysLeft} days)`);
        } catch (error) {
            Logger.error(`❌ Failed to send expiration notification:`, error);
        }
    }

    /**
     * Send expired notification
     */
    private async sendExpiredNotification(subscription: SubscriptionInfo): Promise<void> {
        try {
            const message = `❌ *Server Anda Telah Berakhir*\n\n` +
                `🖥️ Server: ${subscription.packageType}\n` +
                `📅 Berakhir pada: ${subscription.expiryDate.toLocaleDateString('id-ID')}\n` +
                `⏸️ Server akan disuspend dalam 24 jam jika tidak diperpanjang.\n\n` +
                `💡 Segera hubungi admin untuk perpanjangan langganan.`;
            
            await this.notificationService.sendNotification(subscription.customerPhone, message);
            
            Logger.info(`📧 Expired notification sent to ${subscription.customerPhone}`);
        } catch (error) {
            Logger.error(`❌ Failed to send expired notification:`, error);
        }
    }

    /**
     * Process auto suspensions for expired subscriptions
     */
    private async processAutoSuspensions(subscriptions: SubscriptionInfo[]): Promise<void> {
        const expiredSubscriptions = subscriptions.filter(sub => 
            sub.status === 'expired' && 
            sub.daysUntilExpiry <= -1 && // Grace period of 1 day
            !this.suspensionQueue.has(sub.serverId)
        );

        Logger.info(`🔍 Found ${expiredSubscriptions.length} subscriptions for auto-suspension`);

        for (const subscription of expiredSubscriptions) {
            this.suspensionQueue.add(subscription.serverId);
            
            try {
                const result = await this.suspendServer(
                    subscription.serverId, 
                    `Auto-suspended: Subscription expired on ${subscription.expiryDate.toLocaleDateString('id-ID')}`
                );

                if (result.success) {
                    // Send suspension notification
                    const message = `⏸️ *Server Disuspend Otomatis*\n\n` +
                        `🖥️ Server: ${subscription.packageType}\n` +
                        `📅 Disuspend pada: ${new Date().toLocaleDateString('id-ID')}\n` +
                        `💡 Hubungi admin untuk mengaktifkan kembali server Anda.`;
                    
                    await this.notificationService.sendNotification(subscription.customerPhone, message);
                    
                    Logger.info(`✅ Auto-suspended server ${subscription.serverId} for expired subscription`);
                } else {
                    Logger.error(`❌ Failed to auto-suspend server ${subscription.serverId}: ${result.error}`);
                }
            } catch (error) {
                Logger.error(`❌ Error during auto-suspension of server ${subscription.serverId}:`, error);
            } finally {
                this.suspensionQueue.delete(subscription.serverId);
            }
        }
    }

    /**
     * Extract order ID from server name
     */
    private extractOrderIdFromServerName(serverName: string): string | null {
        const match = serverName.match(/^[A-Z0-9_]+-(.+)$/);
        return match ? match[1] : null;
    }

    /**
     * Get scheduler status
     */
    getSchedulerStatus(): { running: boolean; queueSize: number } {
        return {
            running: this.schedulerInterval !== null,
            queueSize: this.suspensionQueue.size
        };
    }

    /**
     * Force process specific subscription
     */
    async processSubscription(orderId: string): Promise<boolean> {
        try {
            const subscription = await this.getSubscription(orderId);
            if (!subscription) {
                throw new Error(`Subscription not found: ${orderId}`);
            }

            await this.sendExpirationNotifications([subscription]);
            
            if (subscription.status === 'expired' && subscription.daysUntilExpiry <= -1) {
                await this.processAutoSuspensions([subscription]);
            }

            return true;
        } catch (error) {
            Logger.error(`❌ Failed to process subscription ${orderId}:`, error);
            return false;
        }
    }

    /**
     * Start automated tasks (alias for startScheduler)
     */
    async startAutomatedTasks(intervalHours: number = 6): Promise<void> {
        return this.startScheduler(intervalHours);
    }

    /**
     * Stop automated tasks (alias for stopScheduler)
     */
    stopAutomatedTasks(): void {
        this.stopScheduler();
    }

    /**
     * Get all servers for a specific user
     */
    async getUserServers(userPhone: string): Promise<Array<{serverId: string, name: string, expiresAt: Date}>> {
        try {
            // Get orders for this user
            const orders = await this.orderManager.getOrdersByPhone(userPhone);
            const activeOrders = orders.filter(order => 
                order.status === OrderStatus.COMPLETED && 
                order.serverInfo?.serverId
            );

            const userServers = [];
            
            for (const order of activeOrders) {
                if (order.serverInfo?.serverId) {
                    // Get server details
                    const serverDetails = await this.adminAPI.getServerDetails(order.serverInfo.serverId);
                    if (serverDetails) {
                        userServers.push({
                            serverId: order.serverInfo.serverId,
                            name: serverDetails.name || `Server-${order.serverInfo.serverId}`,
                            expiresAt: order.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
                        });
                    }
                }
            }

            return userServers;
        } catch (error) {
            Logger.error(`❌ Error getting user servers for ${userPhone}:`, error);
            return [];
        }
    }
}