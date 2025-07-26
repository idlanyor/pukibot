import { PrismaDatabaseManager } from './PrismaDatabaseManager';
import { Logger } from '../utils/logger';
import { PrismaClient, Order, OrderStatusHistory } from '@prisma/client';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'expired';

export interface CreateOrderData {
    id: string;
    customerPhone: string;
    customerName?: string;
    customerChatId: string;
    packageType: string;
    packageDuration: number;
    packagePrice: number;
    packageSpecs?: string;
    status: OrderStatus;
    totalAmount: number;
    currency: string;
    notes?: string;
    username?: string;
}

export interface OrderFilter {
    status?: OrderStatus;
    customerPhone?: string;
    packageType?: string;
    dateRange?: {
        start?: Date;
        end?: Date;
    };
}

export interface OrderWithHistory extends Order {
    statusHistory: OrderStatusHistory[];
}

export class PrismaOrderService {
    private static instance: PrismaOrderService;
    private db: PrismaDatabaseManager;
    private prisma: PrismaClient;

    private constructor() {
        this.db = PrismaDatabaseManager.getInstance();
        this.prisma = this.db.getPrisma();
    }

    public static getInstance(): PrismaOrderService {
        if (!PrismaOrderService.instance) {
            PrismaOrderService.instance = new PrismaOrderService();
        }
        return PrismaOrderService.instance;
    }

    public async createOrder(orderData: CreateOrderData): Promise<{ success: boolean; order?: Order; error?: string }> {
        try {
            const order = await this.prisma.$transaction(async (prisma) => {
                // Create order
                const newOrder = await prisma.order.create({
                    data: {
                        ...orderData,
                        package: undefined, // Exclude package data from direct creation
                    }
                });

                // Create initial status history
                await prisma.orderStatusHistory.create({
                    data: {
                        orderId: newOrder.id,
                        status: orderData.status,
                        updatedBy: 'system',
                        notes: 'Order created'
                    }
                });

                return newOrder;
            });

            Logger.info(`✅ Order created: ${order.id}`);
            return { success: true, order };
        } catch (error) {
            Logger.error('❌ Failed to create order:', error);
            return { success: false, error: (error as Error).message };
        }
    }

    public async getOrderStatus(orderId: number): Promise<{ success: boolean; order?: OrderWithHistory; error?: string }> {
        try {
            const order = await this.getOrderById(orderId.toString());
            if (order) {
                return { success: true, order };
            } else {
                return { success: false, error: `Order ${orderId} not found.` };
            }
        } catch (error) {
            Logger.error(`❌ Failed to get order status for ${orderId}:`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    public async getOrderById(orderId: string): Promise<OrderWithHistory | null> {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    statusHistory: {
                        orderBy: { timestamp: 'desc' }
                    },
                    package: true
                }
            });

            return order as OrderWithHistory | null;
        } catch (error) {
            Logger.error('❌ Failed to get order by ID:', error);
            throw error;
        }
    }

    public async getOrders(filter?: OrderFilter, limit?: number, offset?: number): Promise<OrderWithHistory[]> {
        try {
            const where: any = {};

            if (filter?.status) {
                where.status = filter.status;
            }

            if (filter?.customerPhone) {
                where.customerPhone = filter.customerPhone;
            }

            if (filter?.packageType) {
                where.packageType = filter.packageType;
            }

            if (filter?.dateRange) {
                where.createdAt = {};
                if (filter.dateRange.start) {
                    where.createdAt.gte = filter.dateRange.start;
                }
                if (filter.dateRange.end) {
                    where.createdAt.lte = filter.dateRange.end;
                }
            }

            const orders = await this.prisma.order.findMany({
                where,
                include: {
                    statusHistory: {
                        orderBy: { timestamp: 'desc' }
                    },
                    package: true
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            });

            return orders as OrderWithHistory[];
        } catch (error) {
            Logger.error('❌ Failed to get orders:', error);
            throw error;
        }
    }

    public async updateOrderStatus(
        orderId: string, 
        newStatus: OrderStatus, 
        updatedBy: string, 
        notes?: string
    ): Promise<Order | null> {
        try {
            const order = await this.prisma.$transaction(async (prisma) => {
                // Update order status
                const updatedOrder = await prisma.order.update({
                    where: { id: orderId },
                    data: { 
                        status: newStatus,
                        updatedAt: new Date()
                    }
                });

                // Add status history
                await prisma.orderStatusHistory.create({
                    data: {
                        orderId,
                        status: newStatus,
                        updatedBy,
                        notes
                    }
                });

                return updatedOrder;
            });

            Logger.info(`✅ Order status updated: ${orderId} -> ${newStatus} by ${updatedBy}`);
            return order;
        } catch (error) {
            Logger.error('❌ Failed to update order status:', error);
            throw error;
        }
    }

    public async deleteOrder(orderId: string): Promise<boolean> {
        try {
            await this.prisma.$transaction(async (prisma) => {
                // Delete status history first (due to foreign key constraint)
                await prisma.orderStatusHistory.deleteMany({
                    where: { orderId }
                });

                // Delete subscriptions
                await prisma.subscription.deleteMany({
                    where: { orderId }
                });

                // Delete server monitoring
                await prisma.serverMonitoring.deleteMany({
                    where: { orderId }
                });

                // Delete order
                await prisma.order.delete({
                    where: { id: orderId }
                });
            });

            Logger.info(`✅ Order deleted: ${orderId}`);
            return true;
        } catch (error) {
            Logger.error('❌ Failed to delete order:', error);
            throw error;
        }
    }

    public async getOrdersByCustomer(customerPhone: string, limit?: number): Promise<OrderWithHistory[]> {
        try {
            const orders = await this.prisma.order.findMany({
                where: { customerPhone },
                include: {
                    statusHistory: {
                        orderBy: { timestamp: 'desc' }
                    },
                    package: true
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            });

            return orders as OrderWithHistory[];
        } catch (error) {
            Logger.error('❌ Failed to get orders by customer:', error);
            throw error;
        }
    }

    public async getOrderStats(): Promise<any> {
        try {
            const totalOrders = await this.prisma.order.count();

            const ordersByStatus = await this.prisma.order.groupBy({
                by: ['status'],
                _count: { status: true }
            });

            const ordersByPackage = await this.prisma.order.groupBy({
                by: ['packageType'],
                _count: { packageType: true }
            });

            const totalRevenue = await this.prisma.order.aggregate({
                where: { status: 'completed' },
                _sum: { totalAmount: true }
            });

            const avgOrderValue = await this.prisma.order.aggregate({
                _avg: { totalAmount: true }
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const ordersToday = await this.prisma.order.count({
                where: {
                    createdAt: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            });

            const thisMonth = new Date();
            thisMonth.setDate(1);
            thisMonth.setHours(0, 0, 0, 0);

            const ordersThisMonth = await this.prisma.order.count({
                where: {
                    createdAt: {
                        gte: thisMonth
                    }
                }
            });

            return {
                total: totalOrders,
                byStatus: ordersByStatus.reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {} as Record<string, number>),
                byPackage: ordersByPackage.reduce((acc, item) => {
                    acc[item.packageType] = item._count.packageType;
                    return acc;
                }, {} as Record<string, number>),
                revenue: {
                    total: totalRevenue._sum.totalAmount || 0,
                    average: avgOrderValue._avg.totalAmount || 0
                },
                counts: {
                    today: ordersToday,
                    thisMonth: ordersThisMonth
                }
            };
        } catch (error) {
            Logger.error('❌ Failed to get order stats:', error);
            throw error;
        }
    }

    public async searchOrders(query: string): Promise<OrderWithHistory[]> {
        try {
            const orders = await this.prisma.order.findMany({
                where: {
                    OR: [
                        { id: { contains: query, mode: 'insensitive' } },
                        { customerPhone: { contains: query } },
                        { customerName: { contains: query, mode: 'insensitive' } },
                        { packageType: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    statusHistory: {
                        orderBy: { timestamp: 'desc' }
                    },
                    package: true
                },
                orderBy: { createdAt: 'desc' }
            });

            return orders as OrderWithHistory[];
        } catch (error) {
            Logger.error('❌ Failed to search orders:', error);
            throw error;
        }
    }

    public async updateOrder(orderId: string, updateData: Partial<Order>): Promise<Order | null> {
        try {
            const order = await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });

            Logger.info(`✅ Order updated: ${orderId}`);
            return order;
        } catch (error) {
            Logger.error('❌ Failed to update order:', error);
            throw error;
        }
    }
}