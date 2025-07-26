import { Elysia } from 'elysia';
import { OrderManager } from '../../plugins/store/OrderManager';
import { Logger } from '../../utils/logger';

export const createOrderRoutes = (orderManager: OrderManager) => {
    return new Elysia({ prefix: '/orders' })
        .get('/', async ({ query }) => {
            try {
                const page = parseInt(query.page as string) || 1;
                const limit = parseInt(query.limit as string) || 20;
                const status = query.status as string;
                
                // Get orders with pagination
                const orders = await orderManager.getAllOrders();
                
                // Filter by status if provided
                let filteredOrders = orders;
                if (status) {
                    filteredOrders = orders.filter(order => order.status === status);
                }
                
                // Apply pagination
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
                
                return {
                    success: true,
                    data: {
                        orders: paginatedOrders,
                        pagination: {
                            page,
                            limit,
                            total: filteredOrders.length,
                            totalPages: Math.ceil(filteredOrders.length / limit)
                        }
                    }
                };
            } catch (error) {
                Logger.error('❌ Error getting orders:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .get('/:id', async ({ params }) => {
            try {
                const order = await orderManager.getOrder(params.id);
                if (!order) {
                    return {
                        success: false,
                        error: 'Order not found'
                    };
                }
                
                return {
                    success: true,
                    data: order
                };
            } catch (error) {
                Logger.error('❌ Error getting order:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/', async ({ body }) => {
            try {
                const orderData = body as {
                    customerPhone: string;
                    packageType: string;
                    duration: number;
                    customerName?: string;
                    notes?: string;
                };
                
                if (!orderData.customerPhone || !orderData.packageType) {
                    return {
                        success: false,
                        error: 'Missing required fields: customerPhone, packageType'
                    };
                }
                
                const order = await orderManager.createOrder(
                    orderData.customerPhone,
                    orderData.customerPhone + '@c.us', // Generate chat ID
                    orderData.packageType as any,
                    orderData.duration || 1,
                    orderData.customerName
                );
                
                if (orderData.notes) {
                    await orderManager.addOrderNote(order.id, orderData.notes);
                }
                
                return {
                    success: true,
                    data: order
                };
            } catch (error) {
                Logger.error('❌ Error creating order:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .put('/:id/status', async ({ params, body }) => {
            try {
                const { status, notes } = body as { status: string; notes?: string };
                
                if (!status) {
                    return {
                        success: false,
                        error: 'Missing required field: status'
                    };
                }
                
                const order = await orderManager.updateOrderStatus(
                    params.id, 
                    status as any, 
                    'admin',
                    notes
                );
                
                if (!order) {
                    return {
                        success: false,
                        error: 'Order not found'
                    };
                }
                
                return {
                    success: true,
                    data: order
                };
            } catch (error) {
                Logger.error('❌ Error updating order status:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .put('/:id/server', async ({ params, body }) => {
            try {
                const { serverId } = body as { serverId: string };
                
                if (!serverId) {
                    return {
                        success: false,
                        error: 'Missing required field: serverId'
                    };
                }
                
                const order = await orderManager.setServerId(params.id, serverId);
                if (!order) {
                    return {
                        success: false,
                        error: 'Order not found'
                    };
                }
                
                return {
                    success: true,
                    data: order
                };
            } catch (error) {
                Logger.error('❌ Error setting server ID:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/:id/complete', async ({ params, body }) => {
            try {
                const { serverId, notes } = body as { serverId?: string; notes?: string };

                if (!serverId) {
                    return {
                        success: false,
                        error: 'Missing required field: serverId'
                    };
                }
                
                const result = await orderManager.completeOrder(params.id, serverId, notes);
                
                return {
                    success: true,
                    data: result
                };
            } catch (error) {
                Logger.error('❌ Error completing order:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/:id/provision', async ({ params }) => {
            try {
                const result = await orderManager.provisionServer(params.id);
                
                return {
                    success: result.success,
                    data: result.success ? result.credentials : null,
                    error: result.error
                };
            } catch (error) {
                Logger.error('❌ Error provisioning server:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .delete('/:id', async ({ params }) => {
            try {
                const success = await orderManager.deleteOrder(params.id);
                
                if (!success) {
                    return {
                        success: false,
                        error: 'Order not found or could not be deleted'
                    };
                }
                
                return {
                    success: true,
                    message: 'Order deleted successfully'
                };
            } catch (error) {
                Logger.error('❌ Error deleting order:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .get('/stats/summary', async () => {
            try {
                const stats = await orderManager.getOrderStats();
                
                return {
                    success: true,
                    data: stats
                };
            } catch (error) {
                Logger.error('❌ Error getting order stats:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });
};