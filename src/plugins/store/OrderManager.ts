import { Order, OrderStatus, PackageType, PACKAGE_CATALOG, ORDER_STATUS_FLOW, Customer, OrderItem } from './models/Order';
import { OrderStorage } from './OrderStorage';
import { Logger } from '../../utils/logger';
import { AutoProvisioningService } from '../../services/AutoProvisioningService';

export class OrderManager {
    private static instance: OrderManager;
    private storage: OrderStorage;
    private autoProvisioningService: AutoProvisioningService;

    private constructor() {
        this.storage = OrderStorage.getInstance();
        this.autoProvisioningService = AutoProvisioningService.getInstance();
    }

    public static getInstance(): OrderManager {
        if (!OrderManager.instance) {
            OrderManager.instance = new OrderManager();
        }
        return OrderManager.instance;
    }

    async initialize(): Promise<void> {
        await this.storage.initialize();
        Logger.info('🛒 Order Manager initialized');
    }

    async createOrder(
        customerPhone: string,
        customerChatId: string,
        packageType: PackageType,
        duration: number,
        customerDisplayName?: string
    ): Promise<Order> {
        // Validate package type
        if (!Object.values(PackageType).includes(packageType)) {
            throw new Error(`Invalid package type: ${packageType}`);
        }

        // Validate duration
        if (duration < 1 || duration > 12) {
            throw new Error('Duration must be between 1 and 12 months');
        }

        const packageInfo = PACKAGE_CATALOG[packageType];
        const orderId = await this.storage.generateOrderId();

        const customer: Customer = {
            phoneNumber: customerPhone,
            displayName: customerDisplayName,
            chatId: customerChatId
        };

        const item: OrderItem = {
            packageType,
            duration,
            price: packageInfo.price,
            specifications: {
                ram: packageInfo.ram,
                cpu: packageInfo.cpu,
                storage: packageInfo.storage,
                bandwidth: packageInfo.bandwidth
            }
        };

        const totalAmount = packageInfo.price * duration;
        const currency = process.env.STORE_CURRENCY || 'IDR';

        const order: Order = {
            id: orderId,
            customer,
            item,
            status: OrderStatus.PENDING,
            totalAmount,
            currency,
            createdAt: new Date(),
            updatedAt: new Date(),
            statusHistory: [{
                status: OrderStatus.PENDING,
                timestamp: new Date(),
                updatedBy: 'system',
                notes: 'Order created'
            }]
        };

        return await this.storage.createOrder(order);
    }

    async getOrder(orderId: string): Promise<Order | null> {
        return await this.storage.getOrder(orderId);
    }

    async updateOrderStatus(
        orderId: string,
        newStatus: OrderStatus,
        updatedBy: string,
        notes?: string
    ): Promise<Order | null> {
        const order = await this.storage.getOrder(orderId);
        if (!order) {
            throw new Error(`Order not found: ${orderId}`);
        }

        // Validate status transition
        const allowedStatuses = ORDER_STATUS_FLOW[order.status];
        if (!allowedStatuses.includes(newStatus)) {
            throw new Error(
                `Invalid status transition from ${order.status} to ${newStatus}. ` +
                `Allowed transitions: ${allowedStatuses.join(', ')}`
            );
        }

        return await this.storage.updateOrderStatus(orderId, newStatus, updatedBy, notes);
    }

    async getOrdersByCustomer(customerPhone: string): Promise<Order[]> {
        return await this.storage.getOrdersByCustomer(customerPhone);
    }

    async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
        return await this.storage.getOrdersByStatus(status);
    }

    async getAllOrders(limit?: number, offset?: number): Promise<Order[]> {
        return await this.storage.getOrders({ limit, offset });
    }

    async searchOrders(query: {
        status?: OrderStatus;
        packageType?: PackageType;
        customerPhone?: string;
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
        offset?: number;
    }): Promise<Order[]> {
        return await this.storage.getOrders(query);
    }

    async addOrderNote(orderId: string, note: string, isAdminNote: boolean = false): Promise<Order | null> {
        const order = await this.storage.getOrder(orderId);
        if (!order) {
            return null;
        }

        const updates: Partial<Order> = isAdminNote 
            ? { adminNotes: note }
            : { notes: note };

        return await this.storage.updateOrder(orderId, updates);
    }

    async setPaymentProof(orderId: string, paymentProof: string): Promise<Order | null> {
        return await this.storage.updateOrder(orderId, { paymentProof });
    }

    async setServerId(orderId: string, serverId: string): Promise<Order | null> {
        return await this.storage.updateOrder(orderId, { serverId });
    }

    async getOrderStats(): Promise<any> {
        return await this.storage.getOrderStats();
    }

    async deleteOrder(orderId: string): Promise<boolean> {
        const order = await this.storage.getOrder(orderId);
        if (!order) {
            return false;
        }

        // Only allow deletion of cancelled orders
        if (order.status !== OrderStatus.CANCELLED) {
            throw new Error('Only cancelled orders can be deleted');
        }

        return await this.storage.deleteOrder(orderId);
    }

    async cancelOrder(orderId: string, cancelledBy: string, reason?: string): Promise<Order | null> {
        const order = await this.storage.getOrder(orderId);
        if (!order) {
            throw new Error(`Order not found: ${orderId}`);
        }

        // Check if order can be cancelled
        if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
            throw new Error(`Cannot cancel order with status: ${order.status}`);
        }

        return await this.storage.updateOrderStatus(
            orderId, 
            OrderStatus.CANCELLED, 
            cancelledBy, 
            reason || 'Order cancelled'
        );
    }

    async getOrderHistory(orderId: string): Promise<Order | null> {
        return await this.storage.getOrder(orderId);
    }

    async getPendingOrders(): Promise<Order[]> {
        return await this.getOrdersByStatus(OrderStatus.PENDING);
    }

    async getProcessingOrders(): Promise<Order[]> {
        return await this.getOrdersByStatus(OrderStatus.PROCESSING);
    }

    async getCompletedOrders(): Promise<Order[]> {
        return await this.getOrdersByStatus(OrderStatus.COMPLETED);
    }

    async validatePackageType(packageType: string): Promise<PackageType | null> {
        const normalizedType = packageType.toLowerCase() as PackageType;
        return Object.values(PackageType).includes(normalizedType) ? normalizedType : null;
    }

    async getPackageInfo(packageType: PackageType) {
        return PACKAGE_CATALOG[packageType];
    }

    async getAllPackages() {
        return PACKAGE_CATALOG;
    }

    async backup(): Promise<string> {
        return await this.storage.backup();
    }

    formatOrderForDisplay(order: Order): string {
        const packageInfo = PACKAGE_CATALOG[order.item.packageType];
        const statusIcon = this.getStatusIcon(order.status);
        
        return `📋 *Order ${order.id}*\n\n` +
               `👤 Customer: ${order.customer.phoneNumber}\n` +
               `📦 Package: ${packageInfo.emoji} ${packageInfo.name}\n` +
               `⏰ Duration: ${order.item.duration} bulan\n` +
               `💰 Total: ${order.currency} ${order.totalAmount.toLocaleString('id-ID')}\n` +
               `${statusIcon} Status: ${order.status.toUpperCase()}\n` +
               `📅 Created: ${order.createdAt.toLocaleString('id-ID')}\n` +
               `🔄 Updated: ${order.updatedAt.toLocaleString('id-ID')}` +
               (order.notes ? `\n📝 Notes: ${order.notes}` : '') +
               (order.adminNotes ? `\n🔒 Admin Notes: ${order.adminNotes}` : '') +
               (order.serverId ? `\n🖥️ Server ID: ${order.serverId}` : '');
    }

    formatOrderSummary(order: Order): string {
        const packageInfo = PACKAGE_CATALOG[order.item.packageType];
        const statusIcon = this.getStatusIcon(order.status);
        
        return `${order.id} | ${packageInfo.emoji} ${packageInfo.name} | ${statusIcon} ${order.status}`;
    }

    private getStatusIcon(status: OrderStatus): string {
        const icons = {
            [OrderStatus.PENDING]: '⏳',
            [OrderStatus.CONFIRMED]: '✅',
            [OrderStatus.PROCESSING]: '🔄',
            [OrderStatus.COMPLETED]: '🎉',
            [OrderStatus.CANCELLED]: '❌',
            [OrderStatus.REFUNDED]: '💰'
        };
        return icons[status] || '❓';
    }

    // Auto-provisioning methods
    async provisionServer(orderId: string): Promise<{ success: boolean; error?: string; credentials?: any }> {
        try {
            const order = await this.storage.getOrder(orderId);
            if (!order) {
                throw new Error(`Order not found: ${orderId}`);
            }

            // Check if order is in correct status for provisioning
            if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PROCESSING) {
                throw new Error(`Order ${orderId} is not in correct status for provisioning (current: ${order.status})`);
            }

            // Check if auto-provisioning is configured
            if (!this.autoProvisioningService.isConfigured()) {
                throw new Error('Auto-provisioning is not configured');
            }

            Logger.info(`🚀 Starting auto-provisioning for order ${orderId}`);

            // Update order status to processing
            await this.storage.updateOrderStatus(
                orderId,
                OrderStatus.PROCESSING,
                'system',
                'Auto-provisioning started'
            );

            // Perform provisioning
            const result = await this.autoProvisioningService.provisionServer(order);

            if (result.success && result.server && result.credentials) {
                // Update order with server information
                await this.storage.updateOrder(orderId, {
                    serverId: result.server.uuid,
                    adminNotes: `Auto-provisioned: Server ID ${result.server.id}, User ID ${result.user?.id}`
                });

                // Update order status to completed
                await this.storage.updateOrderStatus(
                    orderId,
                    OrderStatus.COMPLETED,
                    'system',
                    'Auto-provisioning completed successfully'
                );

                Logger.info(`✅ Auto-provisioning completed successfully for order ${orderId}`);
                return {
                    success: true,
                    credentials: result.credentials
                };
            } else {
                // Update order status back to confirmed if provisioning failed
                await this.storage.updateOrderStatus(
                    orderId,
                    OrderStatus.CONFIRMED,
                    'system',
                    `Auto-provisioning failed: ${result.error}`
                );

                Logger.error(`❌ Auto-provisioning failed for order ${orderId}: ${result.error}`);
                return {
                    success: false,
                    error: result.error
                };
            }

        } catch (error) {
            Logger.error(`❌ Auto-provisioning error for order ${orderId}:`, error);
            
            // Update order status back to confirmed
            try {
                await this.storage.updateOrderStatus(
                    orderId,
                    OrderStatus.CONFIRMED,
                    'system',
                    `Auto-provisioning error: ${error.message}`
                );
            } catch (statusError) {
                Logger.error(`❌ Failed to update order status after provisioning error:`, statusError);
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    async retryProvisioning(orderId: string): Promise<{ success: boolean; error?: string; credentials?: any }> {
        Logger.info(`🔄 Retrying provisioning for order ${orderId}`);
        return await this.provisionServer(orderId);
    }

    async isAutoProvisioningEnabled(): Promise<boolean> {
        return this.autoProvisioningService.isConfigured();
    }

    async testAutoProvisioningConnection(): Promise<boolean> {
        return await this.autoProvisioningService.testConnection();
    }

    async getAutoProvisioningStatus(): Promise<{
        enabled: boolean;
        configured: boolean;
        healthy: boolean;
        resourceMappings: any;
    }> {
        const configured = this.autoProvisioningService.isConfigured();
        const healthy = configured ? await this.autoProvisioningService.testConnection() : false;
        
        return {
            enabled: configured,
            configured: configured,
            healthy: healthy,
            resourceMappings: configured ? this.autoProvisioningService.getResourceMappings() : {}
        };
    }
}