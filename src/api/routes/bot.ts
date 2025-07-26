import { Elysia } from 'elysia';
import { BotStateManager } from '../../services/BotStateManager';
import { Logger } from '../../utils/logger';

export const createBotRoutes = (botStateManager: BotStateManager) => {
    return new Elysia({ prefix: '/bot' })
        .get('/status', () => {
            try {
                const status = botStateManager.getStatus();
                return {
                    success: true,
                    data: status
                };
            } catch (error) {
                Logger.error('❌ Error getting bot status:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .get('/stats', () => {
            try {
                const stats = botStateManager.getStats();
                return {
                    success: true,
                    data: stats
                };
            } catch (error) {
                Logger.error('❌ Error getting bot stats:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/start', async () => {
            try {
                await botStateManager.startBot();
                return {
                    success: true,
                    message: 'Bot started successfully'
                };
            } catch (error) {
                Logger.error('❌ Error starting bot:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/stop', async () => {
            try {
                await botStateManager.stopBot();
                return {
                    success: true,
                    message: 'Bot stopped successfully'
                };
            } catch (error) {
                Logger.error('❌ Error stopping bot:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/restart', async () => {
            try {
                await botStateManager.restartBot();
                return {
                    success: true,
                    message: 'Bot restarted successfully'
                };
            } catch (error) {
                Logger.error('❌ Error restarting bot:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .get('/logs', async ({ query }) => {
            try {
                const limit = parseInt(query.limit as string) || 100;
                const logs = await botStateManager.getLogs(limit);
                return {
                    success: true,
                    data: logs
                };
            } catch (error) {
                Logger.error('❌ Error getting bot logs:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .get('/messages', async ({ query }) => {
            try {
                const limit = parseInt(query.limit as string) || 50;
                const messages = await botStateManager.getRecentMessages(limit);
                return {
                    success: true,
                    data: messages
                };
            } catch (error) {
                Logger.error('❌ Error getting recent messages:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/send-message', async ({ body }) => {
            try {
                const { to, message } = body as { to: string; message: string };
                
                if (!to || !message) {
                    return {
                        success: false,
                        error: 'Missing required fields: to, message'
                    };
                }
                
                const result = await botStateManager.sendMessage(to, message);
                return {
                    success: true,
                    data: { sent: result }
                };
            } catch (error) {
                Logger.error('❌ Error sending message:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });
};