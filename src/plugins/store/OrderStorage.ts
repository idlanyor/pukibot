import { promises as fs } from 'fs';
import { join } from 'path';
import { Order, OrderFilter, OrderStatus, OrderStatusHistory } from './models/Order';
import { Logger } from '../../utils/logger';

export class OrderStorage {
    private static instance: OrderStorage;
    private ordersFilePath: string;
    private orders: Map<string, Order> = new Map();
    private initialized: boolean = false;

    private constructor() {
        this.ordersFilePath = join(process.cwd(), 'data', 'orders.json');
    }

    public static getInstance(): OrderStorage {
        if (!OrderStorage.instance) {
            OrderStorage.instance = new OrderStorage();
        }
        return OrderStorage.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Ensure data directory exists
            const dataDir = join(process.cwd(), 'data');
            await fs.mkdir(dataDir, { recursive: true });

            // Load existing orders
            await this.loadOrders();
            this.initialized = true;
            Logger.info(`📦 Order storage initialized with ${this.orders.size} orders`);
        } catch (error) {
            Logger.error('❌ Failed to initialize order storage:', error);
            throw error;
        }
    }

    private async loadOrders(): Promise<void> {
        try {
            const data = await fs.readFile(this.ordersFilePath, 'utf-8');
            const ordersArray: Order[] = JSON.parse(data);
            
            this.orders.clear();
            for (const order of ordersArray) {
                // Convert date strings back to Date objects
                order.createdAt = new Date(order.createdAt);
                order.updatedAt = new Date(order.updatedAt);
                order.statusHistory = order.statusHistory.map(history => ({
                    ...history,
                    timestamp: new Date(history.timestamp)
                }));
                
                this.orders.set(order.id, order);
            }
            
            Logger.info(`📁 Loaded ${this.orders.size} orders from storage`);
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                Logger.info('📁 No existing orders file found, starting with empty storage');
                this.orders.clear();
            } else {
                Logger.error('❌ Error loading orders:', error);
                throw error;
            }
        }
    }

    private async saveOrders(): Promise<void> {
        try {
            const ordersArray = Array.from(this.orders.values());
            await fs.writeFile(this.ordersFilePath, JSON.stringify(ordersArray, null, 2), 'utf-8');
            Logger.debug(`💾 Saved ${ordersArray.length} orders to storage`);
        } catch (error) {
            Logger.error('❌ Error saving orders:', error);
            throw error;
        }
    }

    async createOrder(order: Order): Promise<Order> {
        if (!this.initialized) {
            throw new Error('Order storage not initialized');
        }

        if (this.orders.has(order.id)) {
            throw new Error(`Order with ID ${order.id} already exists`);
        }

        this.orders.set(order.id, { ...order });
        await this.saveOrders();
        
        Logger.info(`📝 Created new order: ${order.id} for customer ${order.customer.phoneNumber}`);
        return order;
    }

    async getOrder(orderId: string): Promise<Order | null> {
        if (!this.initialized) {
            throw new Error('Order storage not initialized');
        }

        const order = this.orders.get(orderId);
        return order ? { ...order } : null;
    }

    async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
        if (!this.initialized) {
            throw new Error('Order storage not initialized');
        }

        const existingOrder = this.orders.get(orderId);
        if (!existingOrder) {
            return null;
        }

        const updatedOrder = {
            ...existingOrder,
            ...updates,
            id: orderId, // Ensure ID cannot be changed
            updatedAt: new Date()
        };

        this.orders.set(orderId, updatedOrder);
        await this.saveOrders();
        
        Logger.info(`📝 Updated order: ${orderId}`);
        return updatedOrder;
    }

    async updateOrderStatus(
        orderId: string, 
        newStatus: OrderStatus, 
        updatedBy: string, 
        notes?: string
    ): Promise<Order | null> {
        if (!this.initialized) {
            throw new Error('Order storage not initialized');
        }

        const existingOrder = this.orders.get(orderId);
        if (!existingOrder) {
            return null;
        }

        const statusHistory: OrderStatusHistory = {
            status: newStatus,
            timestamp: new Date(),
            updatedBy,
            notes
        };

        const updatedOrder = {
            ...existingOrder,
            status: newStatus,
            updatedAt: new Date(),
            statusHistory: [...existingOrder.statusHistory, statusHistory]
        };

        this.orders.set(orderId, updatedOrder);
        await this.saveOrders();
        
        Logger.info(`📝 Updated order status: ${orderId} -> ${newStatus} by ${updatedBy}`);
        return updatedOrder;
    }

    async deleteOrder(orderId: string): Promise<boolean> {
        if (!this.initialized) {
            throw new Error('Order storage not initialized');
        }

        const deleted = this.orders.delete(orderId);
        if (deleted) {
            await this.saveOrders();
            Logger.info(`🗑️ Deleted order: ${orderId}`);
        }
        return deleted;
    }

    async getOrders(filter?: OrderFilter): Promise<Order[]> {
        if (!this.initialized) {
            throw new Error('Order storage not initialized');
        }

        let orders = Array.from(this.orders.values());

        // Apply filters
        if (filter) {
            if (filter.status) {
                orders = orders.filter(order => order.status === filter.status);
            }
            if (filter.packageType) {
                orders = orders.filter(order => order.item.packageType === filter.packageType);
            }
            if (filter.customerPhone) {
                orders = orders.filter(order => 
                    order.customer.phoneNumber.includes(filter.customerPhone!)
                );
            }
            if (filter.dateFrom) {
                orders = orders.filter(order => order.createdAt >= filter.dateFrom!);
            }
            if (filter.dateTo) {
                orders = orders.filter(order => order.createdAt <= filter.dateTo!);
            }
        }

        // Sort by creation date (newest first)
        orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Apply pagination
        if (filter?.offset) {
            orders = orders.slice(filter.offset);
        }
        if (filter?.limit) {
            orders = orders.slice(0, filter.limit);
        }

        return orders.map(order => ({ ...order })); // Return copies
    }

    async getOrdersByCustomer(customerPhone: string): Promise<Order[]> {
        return this.getOrders({ customerPhone });
    }

    async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
        return this.getOrders({ status });
    }

    async getOrderCount(): Promise<number> {
        if (!this.initialized) {
            throw new Error('Order storage not initialized');
        }
        return this.orders.size;
    }

    async generateOrderId(): Promise<string> {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `ORD-${timestamp}-${random}`.toUpperCase();
    }

    async backup(): Promise<string> {
        if (!this.initialized) {
            throw new Error('Order storage not initialized');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = join(process.cwd(), 'data', `orders-backup-${timestamp}.json`);
        
        const ordersArray = Array.from(this.orders.values());
        await fs.writeFile(backupPath, JSON.stringify(ordersArray, null, 2), 'utf-8');
        
        Logger.info(`💾 Created order backup: ${backupPath}`);
        return backupPath;
    }

    async getOrderStats(): Promise<any> {
        if (!this.initialized) {
            throw new Error('Order storage not initialized');
        }

        const orders = Array.from(this.orders.values());
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats = {
            totalOrders: orders.length,
            ordersByStatus: {} as Record<OrderStatus, number>,
            ordersByPackage: {} as Record<string, number>,
            totalRevenue: 0,
            averageOrderValue: 0,
            ordersToday: 0,
            ordersThisMonth: 0
        };

        // Initialize counters
        Object.values(OrderStatus).forEach(status => {
            stats.ordersByStatus[status] = 0;
        });

        for (const order of orders) {
            // Count by status
            stats.ordersByStatus[order.status]++;

            // Count by package
            const packageType = order.item.packageType;
            stats.ordersByPackage[packageType] = (stats.ordersByPackage[packageType] || 0) + 1;

            // Calculate revenue (only for completed orders)
            if (order.status === OrderStatus.COMPLETED) {
                stats.totalRevenue += order.totalAmount;
            }

            // Count today's orders
            if (order.createdAt >= today) {
                stats.ordersToday++;
            }

            // Count this month's orders
            if (order.createdAt >= thisMonth) {
                stats.ordersThisMonth++;
            }
        }

        // Calculate average order value
        const completedOrders = stats.ordersByStatus[OrderStatus.COMPLETED];
        stats.averageOrderValue = completedOrders > 0 ? stats.totalRevenue / completedOrders : 0;

        return stats;
    }
}