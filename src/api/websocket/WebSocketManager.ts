import { ServerWebSocket } from 'bun';
import { Logger } from '../../utils/logger';
import { BotStateManager } from '../../services/BotStateManager';

export interface WebSocketMessage {
    type: string;
    payload?: any;
    id?: string;
}

export interface WebSocketClient {
    id: string;
    socket: ServerWebSocket<any>;
    authenticated: boolean;
    subscriptions: Set<string>;
    lastHeartbeat: number;
}

export class WebSocketManager {
    private clients: Map<string, WebSocketClient> = new Map();
    private botStateManager: BotStateManager;
    private heartbeatInterval: Timer | null = null;

    constructor(botStateManager: BotStateManager) {
        this.botStateManager = botStateManager;
        this.startHeartbeat();
        this.setupBotStateListeners();
    }

    handleConnection(ws: ServerWebSocket<any>) {
        const clientId = this.generateClientId();
        const client: WebSocketClient = {
            id: clientId,
            socket: ws,
            authenticated: false,
            subscriptions: new Set(),
            lastHeartbeat: Date.now()
        };

        this.clients.set(clientId, client);
        Logger.info(`🔌 WebSocket client connected: ${clientId}`);

        // Send welcome message
        this.sendToClient(clientId, {
            type: 'connected',
            payload: {
                clientId,
                timestamp: new Date().toISOString(),
                requiresAuth: true
            }
        });
    }

    handleDisconnection(ws: ServerWebSocket<any>) {
        const client = this.findClientBySocket(ws);
        if (client) {
            this.clients.delete(client.id);
            Logger.info(`🔌 WebSocket client disconnected: ${client.id}`);
        }
    }

    handleMessage(ws: ServerWebSocket<any>, message: string | Buffer) {
        const client = this.findClientBySocket(ws);
        if (!client) return;

        try {
            const data: WebSocketMessage = JSON.parse(message.toString());
            this.processMessage(client, data);
        } catch (error) {
            Logger.error('❌ WebSocket error:', String(error));
            this.sendToClient(client.id, {
                type: 'error',
                payload: { message: 'Invalid message format' }
            });
        }
    }

    handleError(ws: ServerWebSocket<any>, error: Error) {
        const client = this.findClientBySocket(ws);
        Logger.error(`❌ WebSocket error for client ${client?.id}:`, error);
    }

    private processMessage(client: WebSocketClient, message: WebSocketMessage) {
        switch (message.type) {
            case 'ping':
                client.lastHeartbeat = Date.now();
                this.sendToClient(client.id, { type: 'pong' });
                break;

            case 'authenticate':
                this.handleAuthentication(client, message.payload);
                break;

            case 'subscribe':
                this.handleSubscription(client, message.payload);
                break;

            case 'unsubscribe':
                this.handleUnsubscription(client, message.payload);
                break;

            case 'bot_control':
                this.handleBotControl(client, message.payload);
                break;

            case 'get_status':
                this.sendBotStatus(client.id);
                break;

            default:
                Logger.warn(`⚠️ Unknown message type: ${message.type}`);
                this.sendToClient(client.id, {
                    type: 'error',
                    payload: { message: `Unknown message type: ${message.type}` }
                });
        }
    }

    private handleAuthentication(client: WebSocketClient, payload: any) {
        // TODO: Implement proper JWT authentication
        // For now, simple token check
        const token = payload?.token;
        const validToken = process.env.WEB_AUTH_TOKEN || 'admin123';

        if (token === validToken) {
            client.authenticated = true;
            this.sendToClient(client.id, {
                type: 'authenticated',
                payload: { success: true }
            });
            Logger.info(`🔐 Client authenticated: ${client.id}`);
        } else {
            this.sendToClient(client.id, {
                type: 'authentication_failed',
                payload: { message: 'Invalid token' }
            });
        }
    }

    private handleSubscription(client: WebSocketClient, payload: any) {
        if (!client.authenticated) {
            this.sendToClient(client.id, {
                type: 'error',
                payload: { message: 'Authentication required' }
            });
            return;
        }

        const channel = payload?.channel;
        if (channel) {
            client.subscriptions.add(channel);
            this.sendToClient(client.id, {
                type: 'subscribed',
                payload: { channel }
            });
            Logger.debug(`📡 Client ${client.id} subscribed to ${channel}`);
        }
    }

    private handleUnsubscription(client: WebSocketClient, payload: any) {
        const channel = payload?.channel;
        if (channel) {
            client.subscriptions.delete(channel);
            this.sendToClient(client.id, {
                type: 'unsubscribed',
                payload: { channel }
            });
        }
    }

    private async handleBotControl(client: WebSocketClient, payload: any) {
        if (!client.authenticated) {
            this.sendToClient(client.id, {
                type: 'error',
                payload: { message: 'Authentication required' }
            });
            return;
        }

        const action = payload?.action;
        try {
            switch (action) {
                case 'start':
                    await this.botStateManager.startBot();
                    break;
                case 'stop':
                    await this.botStateManager.stopBot();
                    break;
                case 'restart':
                    await this.botStateManager.restartBot();
                    break;
                default:
                    throw new Error(`Unknown bot action: ${action}`);
            }

            this.sendToClient(client.id, {
                type: 'bot_control_result',
                payload: { action, success: true }
            });
        } catch (error) {
            this.sendToClient(client.id, {
                type: 'bot_control_result',
                payload: { action, success: false, error: error.message }
            });
        }
    }

    private sendBotStatus(clientId: string) {
        const status = this.botStateManager.getStatus();
        this.sendToClient(clientId, {
            type: 'bot_status',
            payload: status
        });
    }

    private setupBotStateListeners() {
        // Listen to bot state changes and broadcast to subscribed clients
        this.botStateManager.on('statusChange', (status) => {
            this.broadcast('bot_status', { channel: 'bot_status' }, status);
        });

        this.botStateManager.on('messageReceived', (message) => {
            this.broadcast('message_received', { channel: 'messages' }, message);
        });

        this.botStateManager.on('orderUpdate', (order) => {
            this.broadcast('order_update', { channel: 'orders' }, order);
        });
    }

    private sendToClient(clientId: string, message: WebSocketMessage) {
        const client = this.clients.get(clientId);
        if (client && client.socket.readyState === 1) {
            try {
                client.socket.send(JSON.stringify(message));
            } catch (error) {
                Logger.error(`❌ Failed to send message to client ${clientId}:`, error);
                this.clients.delete(clientId);
            }
        }
    }

    private broadcast(type: string, subscription: { channel: string }, payload: any) {
        const message: WebSocketMessage = { type, payload };
        
        for (const client of this.clients.values()) {
            if (client.authenticated && client.subscriptions.has(subscription.channel)) {
                this.sendToClient(client.id, message);
            }
        }
    }

    private findClientBySocket(ws: ServerWebSocket<any>): WebSocketClient | undefined {
        for (const client of this.clients.values()) {
            if (client.socket === ws) {
                return client;
            }
        }
        return undefined;
    }

    private generateClientId(): string {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            const timeout = 60000; // 60 seconds

            for (const [clientId, client] of this.clients.entries()) {
                if (now - client.lastHeartbeat > timeout) {
                    Logger.info(`💔 Client ${clientId} heartbeat timeout, disconnecting`);
                    client.socket.close();
                    this.clients.delete(clientId);
                }
            }
        }, 30000); // Check every 30 seconds
    }

    async cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Close all client connections
        for (const client of this.clients.values()) {
            try {
                client.socket.close();
            } catch (error) {
                Logger.error('Error closing WebSocket connection:', error);
            }
        }

        this.clients.clear();
        Logger.info('🧹 WebSocket manager cleaned up');
    }
}