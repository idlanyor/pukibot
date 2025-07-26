import { DatabaseManager } from './DatabaseManager';
import { Logger } from '../utils/logger';
import { Order, OrderStatus, OrderStatusHistory, OrderFilter, OrderStats } from '../plugins/store/models/Order';

export interface OrderRecord {
    id: string;
    customer_phone: string;
    customer_name?: string;
    customer_chat_id: string;
    package_type: string;
    package_duration: number;
    package_price: number;
    package_specs: string; // JSON string
    status: string;
    total_amount: number;
    currency: string;
    notes?: string;
    admin_notes?: string;
    payment_proof?: string;
    server_id?: string;
    created_at: string;
    updated_at: string;
}

export interface OrderStatusHistoryRecord {
    id?: number;
    order_id: string;
    status: string;
    updated_by: string;
    notes?: string;
    timestamp: string;
}

export class OrderService {
    private static instance: OrderService;
    private db: DatabaseManager;

    private constructor() {
        this.db = DatabaseManager.getInstance();
    }

    public static getInstance(): OrderService {
        if (!OrderService.instance) {
            OrderService.instance = new OrderService();
        }
        return OrderService.instance;
    }

    public async createOrder(order: Order): Promise<Order> {
        try {
            const database = this.db.getDatabase();
            
            const insertOrder = database.prepare(`
                INSERT INTO orders (
                    id, customer_phone, customer_name, customer_chat_id,
                    package_type, package_duration, package_price, package_specs,
                    status, total_amount, currency, notes, admin_notes, payment_proof, server_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const insertHistory = database.prepare(`
                INSERT INTO order_status_history (order_id, status, updated_by, notes)
                VALUES (?, ?, ?, ?)
            `);

            const transaction = database.transaction(() => {
                insertOrder.run(
                    order.id,
                    order.customer.phoneNumber,
                    order.customer.displayName,
                    order.customer.chatId,
                    order.item.packageType,
                    order.item.duration,
                    order.item.price,
                    JSON.stringify(order.item.specifications),
                    order.status,
                    order.totalAmount,
                    order.currency,
                    order.notes,
                    order.adminNotes,
                    order.paymentProof,
                    order.serverId
                );

                // Add initial status history
                insertHistory.run(order.id, order.status, 'system', 'Order created');
            });

            transaction();
            
            Logger.info(`✅ Order created in database: ${order.id}`);
            return order;
        } catch (error) {
            Logger.error('❌ Failed to create order:', error);
            throw error;
        }
    }

    public async getOrder(orderId: string): Promise<Order | null> {
        try {
            const database = this.db.getDatabase();
            const stmt = database.prepare('SELECT * FROM orders WHERE id = ?');
            const record = stmt.get(orderId) as OrderRecord;
            
            if (!record) return null;

            // Get status history
            const historyStmt = database.prepare(`
                SELECT * FROM order_status_history 
                WHERE order_id = ? 
                ORDER BY timestamp ASC
            `);
            const historyRecords = historyStmt.all(orderId) as OrderStatusHistoryRecord[];

            return this.recordToOrder(record, historyRecords);
        } catch (error) {
            Logger.error(`❌ Failed to get order ${orderId}:`, error);
            throw error;
        }
    }

    public async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
        try {
            const database = this.db.getDatabase();
            
            const fields = [];
            const values = [];
            
            if (updates.customer?.phoneNumber) {
                fields.push('customer_phone = ?');
                values.push(updates.customer.phoneNumber);
            }
            if (updates.customer?.displayName) {
                fields.push('customer_name = ?');
                values.push(updates.customer.displayName);
            }
            if (updates.customer?.chatId) {
                fields.push('customer_chat_id = ?');
                values.push(updates.customer.chatId);
            }
            if (updates.item?.packageType) {
                fields.push('package_type = ?');
                values.push(updates.item.packageType);
            }
            if (updates.item?.duration) {
                fields.push('package_duration = ?');
                values.push(updates.item.duration);
            }
            if (updates.item?.price) {
                fields.push('package_price = ?');
                values.push(updates.item.price);
            }
            if (updates.item?.specifications) {
                fields.push('package_specs = ?');
                values.push(JSON.stringify(updates.item.specifications));
            }
            if (updates.status) {
                fields.push('status = ?');
                values.push(updates.status);
            }
            if (updates.totalAmount) {
                fields.push('total_amount = ?');
                values.push(updates.totalAmount);
            }
            if (updates.currency) {
                fields.push('currency = ?');
                values.push(updates.currency);
            }
            if (updates.notes !== undefined) {
                fields.push('notes = ?');
                values.push(updates.notes);
            }
            if (updates.adminNotes !== undefined) {
                fields.push('admin_notes = ?');
                values.push(updates.adminNotes);
            }
            if (updates.paymentProof !== undefined) {
                fields.push('payment_proof = ?');
                values.push(updates.paymentProof);
            }
            if (updates.serverId !== undefined) {
                fields.push('server_id = ?');
                values.push(updates.serverId);
            }
            
            if (fields.length === 0) {
                return await this.getOrder(orderId);
            }
            
            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(orderId);
            
            const query = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
            const stmt = database.prepare(query);
            
            const result = stmt.run(...values);
            
            if (result.changes === 0) {
                return null;
            }
            
            Logger.info(`✅ Order updated: ${orderId}`);
            return await this.getOrder(orderId);
        } catch (error) {
            Logger.error(`❌ Failed to update order ${orderId}:`, error);
            throw error;
        }
    }

    public async updateOrderStatus(orderId: string, newStatus: OrderStatus, updatedBy: string, notes?: string): Promise<Order | null> {
        try {
            const database = this.db.getDatabase();
            
            const updateOrder = database.prepare(`
                UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `);
            
            const insertHistory = database.prepare(`
                INSERT INTO order_status_history (order_id, status, updated_by, notes)
                VALUES (?, ?, ?, ?)
            `);
            
            const transaction = database.transaction(() => {
                updateOrder.run(newStatus, orderId);
                insertHistory.run(orderId, newStatus, updatedBy, notes);
            });
            
            transaction();
            
            Logger.info(`✅ Order status updated: ${orderId} -> ${newStatus}`);
            return await this.getOrder(orderId);
        } catch (error) {
            Logger.error(`❌ Failed to update order status ${orderId}:`, error);
            throw error;
        }
    }

    public async deleteOrder(orderId: string): Promise<boolean> {
        try {
            const database = this.db.getDatabase();
            
            const deleteHistory = database.prepare('DELETE FROM order_status_history WHERE order_id = ?');
            const deleteOrder = database.prepare('DELETE FROM orders WHERE id = ?');
            
            const transaction = database.transaction(() => {
                deleteHistory.run(orderId);
                deleteOrder.run(orderId);
            });
            
            const result = transaction();
            
            if (result) {
                Logger.info(`✅ Order deleted: ${orderId}`);
                return true;
            }
            
            return false;
        } catch (error) {
            Logger.error(`❌ Failed to delete order ${orderId}:`, error);
            throw error;
        }
    }

    public async getOrders(filter?: OrderFilter): Promise<Order[]> {
        try {
            const database = this.db.getDatabase();
            let query = 'SELECT * FROM orders WHERE 1=1';
            const params: any[] = [];

            if (filter?.status) {
                query += ' AND status = ?';
                params.push(filter.status);
            }

            if (filter?.packageType) {
                query += ' AND package_type = ?';
                params.push(filter.packageType);
            }

            if (filter?.customerPhone) {
                query += ' AND customer_phone = ?';
                params.push(filter.customerPhone);
            }

            if (filter?.dateFrom) {
                query += ' AND created_at >= ?';
                params.push(filter.dateFrom.toISOString());
            }

            if (filter?.dateTo) {
                query += ' AND created_at <= ?';
                params.push(filter.dateTo.toISOString());
            }

            query += ' ORDER BY created_at DESC';

            if (filter?.limit) {
                query += ' LIMIT ?';
                params.push(filter.limit);
            }

            if (filter?.offset) {
                query += ' OFFSET ?';
                params.push(filter.offset);
            }

            const stmt = database.prepare(query);
            const records = stmt.all(...params) as OrderRecord[];

            const orders = [];
            for (const record of records) {
                const historyStmt = database.prepare(`
                    SELECT * FROM order_status_history 
                    WHERE order_id = ? 
                    ORDER BY timestamp ASC
                `);
                const historyRecords = historyStmt.all(record.id) as OrderStatusHistoryRecord[];
                orders.push(this.recordToOrder(record, historyRecords));
            }

            return orders;
        } catch (error) {
            Logger.error('❌ Failed to get orders:', error);
            throw error;
        }
    }

    public async getOrderStats(): Promise<OrderStats> {
        try {
            const database = this.db.getDatabase();
            
            const totalOrders = database.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
            
            const ordersByStatus = database.prepare(`
                SELECT status, COUNT(*) as count 
                FROM orders 
                GROUP BY status
            `).all() as { status: string; count: number }[];
            
            const ordersByPackage = database.prepare(`
                SELECT package_type, COUNT(*) as count 
                FROM orders 
                GROUP BY package_type
            `).all() as { package_type: string; count: number }[];
            
            const totalRevenue = database.prepare('SELECT SUM(total_amount) as total FROM orders WHERE status = ?').get('completed') as { total: number };
            
            const avgOrderValue = database.prepare('SELECT AVG(total_amount) as avg FROM orders').get() as { avg: number };
            
            const ordersToday = database.prepare(`
                SELECT COUNT(*) as count 
                FROM orders 
                WHERE DATE(created_at) = DATE('now')
            `).get() as { count: number };
            
            const ordersThisMonth = database.prepare(`
                SELECT COUNT(*) as count 
                FROM orders 
                WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
            `).get() as { count: number };
            
            const statusRecord: Record<OrderStatus, number> = {
                [OrderStatus.PENDING]: 0,
                [OrderStatus.CONFIRMED]: 0,
                [OrderStatus.PROCESSING]: 0,
                [OrderStatus.COMPLETED]: 0,
                [OrderStatus.CANCELLED]: 0,
                [OrderStatus.REFUNDED]: 0
            };
            
            ordersByStatus.forEach(item => {
                statusRecord[item.status as OrderStatus] = item.count;
            });
            
            const packageRecord: Record<string, number> = {};
            ordersByPackage.forEach(item => {
                packageRecord[item.package_type] = item.count;
            });
            
            return {
                totalOrders: totalOrders.count,
                ordersByStatus: statusRecord,
                ordersByPackage: packageRecord,
                totalRevenue: totalRevenue.total || 0,
                averageOrderValue: avgOrderValue.avg || 0,
                ordersToday: ordersToday.count,
                ordersThisMonth: ordersThisMonth.count
            };
        } catch (error) {
            Logger.error('❌ Failed to get order stats:', error);
            throw error;
        }
    }

    private recordToOrder(record: OrderRecord, historyRecords: OrderStatusHistoryRecord[]): Order {
        const statusHistory: OrderStatusHistory[] = historyRecords.map(h => ({
            status: h.status as OrderStatus,
            timestamp: new Date(h.timestamp),
            updatedBy: h.updated_by,
            notes: h.notes
        }));

        return {
            id: record.id,
            customer: {
                phoneNumber: record.customer_phone,
                displayName: record.customer_name,
                chatId: record.customer_chat_id
            },
            item: {
                packageType: record.package_type as any,
                duration: record.package_duration,
                price: record.package_price,
                specifications: JSON.parse(record.package_specs)
            },
            status: record.status as OrderStatus,
            totalAmount: record.total_amount,
            currency: record.currency,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            statusHistory,
            notes: record.notes,
            adminNotes: record.admin_notes,
            paymentProof: record.payment_proof,
            serverId: record.server_id
        };
    }

    public async generateOrderId(): Promise<string> {
        // Use shorter timestamp format (last 6 characters)
        const timestamp = Date.now().toString(36).slice(-6);
        const random = Math.random().toString(36).substring(2, 4);
        return `ORD-${timestamp}-${random}`.toUpperCase();
    }
}