import { Elysia } from 'elysia';
import { PterodactylAPI } from '../../services/pterodactylAPI';
import { Logger } from '../../utils/logger';

export const createPterodactylRoutes = (pterodactylAPI: PterodactylAPI) => {
    return new Elysia({ prefix: '/pterodactyl' })
        .get('/servers', async ({ query }) => {
            try {
                // This would need to be implemented in PterodactylAPI
                // For now, return a placeholder response
                return {
                    success: true,
                    data: {
                        servers: [],
                        message: 'Server list endpoint needs implementation in PterodactylAPI'
                    }
                };
            } catch (error) {
                Logger.error('❌ Error getting servers:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .get('/servers/:id', async ({ params }) => {
            try {
                const serverInfo = await pterodactylAPI.getServerInfo(params.id);
                return {
                    success: true,
                    data: serverInfo
                };
            } catch (error) {
                Logger.error('❌ Error getting server info:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/servers/:id/start', async ({ params }) => {
            try {
                await pterodactylAPI.startServer(params.id);
                return {
                    success: true,
                    message: `Server ${params.id} start command sent`
                };
            } catch (error) {
                Logger.error('❌ Error starting server:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/servers/:id/stop', async ({ params }) => {
            try {
                await pterodactylAPI.stopServer(params.id);
                return {
                    success: true,
                    message: `Server ${params.id} stop command sent`
                };
            } catch (error) {
                Logger.error('❌ Error stopping server:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/servers/:id/restart', async ({ params }) => {
            try {
                await pterodactylAPI.restartServer(params.id);
                return {
                    success: true,
                    message: `Server ${params.id} restart command sent`
                };
            } catch (error) {
                Logger.error('❌ Error restarting server:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .get('/servers/:id/status', async ({ params }) => {
            try {
                const serverInfo = await pterodactylAPI.getServerInfo(params.id);
                return {
                    success: true,
                    data: {
                        id: params.id,
                        status: serverInfo.attributes?.status || 'unknown',
                        name: serverInfo.attributes?.name || 'Unknown',
                        node: serverInfo.attributes?.node || 'Unknown'
                    }
                };
            } catch (error) {
                Logger.error('❌ Error getting server status:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .get('/servers/:id/resources', async ({ params }) => {
            try {
                const serverInfo = await pterodactylAPI.getServerInfo(params.id);
                const limits: any = serverInfo.attributes?.limits || {};
                
                return {
                    success: true,
                    data: {
                        memory: limits.memory || 0,
                        cpu: limits.cpu || 0,
                        disk: limits.disk || 0,
                        swap: limits.swap || 0,
                        io: limits.io || 0
                    }
                };
            } catch (error) {
                Logger.error('❌ Error getting server resources:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .post('/servers/:id/command', async ({ params, body }) => {
            try {
                const { command } = body as { command: string };
                
                if (!command) {
                    return {
                        success: false,
                        error: 'Missing required field: command'
                    };
                }
                
                // This would need to be implemented in PterodactylAPI
                return {
                    success: false,
                    error: 'Command execution not implemented in PterodactylAPI'
                };
            } catch (error) {
                Logger.error('❌ Error executing server command:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .get('/nodes', async () => {
            try {
                // This would need to be implemented in PterodactylAPI
                return {
                    success: true,
                    data: {
                        nodes: [],
                        message: 'Nodes endpoint needs implementation in PterodactylAPI'
                    }
                };
            } catch (error) {
                Logger.error('❌ Error getting nodes:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        })
        
        .get('/health', async () => {
            try {
                // Test connection to Pterodactyl panel
                // This is a simple test - in production you might want a dedicated health check endpoint
                const testResponse = await fetch(`${process.env.PTERODACTYL_URL}/api/client`, {
                    headers: {
                        'Authorization': `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                return {
                    success: testResponse.ok,
                    data: {
                        status: testResponse.ok ? 'connected' : 'disconnected',
                        statusCode: testResponse.status,
                        url: process.env.PTERODACTYL_URL
                    }
                };
            } catch (error) {
                Logger.error('❌ Error checking Pterodactyl health:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });
};