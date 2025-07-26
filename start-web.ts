import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { html } from '@elysiajs/html';
import { WebSocketManager } from './src/api/websocket/WebSocketManager';
import { BotStateManager } from './src/services/BotStateManager';
import { DatabaseManager } from './src/services/DatabaseManager';
import { PackageService } from './src/services/PackageService';
import { OrderService } from './src/services/OrderService';
import { createBotRoutes } from './src/api/routes/bot';
import { createOrderRoutes } from './src/api/routes/orders';
import { createPterodactylRoutes } from './src/api/routes/pterodactyl';
import { createAuthRoutes, authMiddleware } from './src/api/routes/auth';
import { createPackageRoutes } from './src/api/routes/packages';
import { OrderManager } from './src/plugins/store/OrderManager';
import { PterodactylAPI } from './src/services/pterodactylAPI';
import { Logger } from './src/utils/logger';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

class WebServer {
    private app: Elysia;
    private wsManager: WebSocketManager;
    private botStateManager: BotStateManager;
    private orderManager: OrderManager;
    private pterodactylAPI: PterodactylAPI;
    private dbManager: DatabaseManager;
    private packageService: PackageService;
    private orderService: OrderService;
    private port: number;

    constructor() {
        this.port = parseInt(process.env.WEB_PORT || '3000');
        this.pterodactylAPI = new PterodactylAPI();
        this.orderManager = new OrderManager();
        this.botStateManager = new BotStateManager();
        
        // Initialize database services
        this.dbManager = DatabaseManager.getInstance({
            filename: path.join(process.cwd(), 'data', 'pukibot.db'),
            options: {
                verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
            }
        });
        
        this.packageService = PackageService.getInstance();
        this.orderService = OrderService.getInstance();
        this.wsManager = new WebSocketManager(this.botStateManager);
        this.app = new Elysia();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        this.app
            .use(cors({
                origin: process.env.CORS_ORIGIN || true,
                credentials: true
            }))
            .use(html())
            .use(staticPlugin({
                assets: 'public',
                prefix: '/'
            }));
    }

    private setupRoutes() {
        // Health check endpoint
        this.app.get('/health', () => ({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'Pterodactyl Bot Web Server'
        }));

        // Public routes (no authentication required)
        this.app.use(createAuthRoutes());

        // Protected API routes (authentication required)
        this.app.group('/api', (app) => app
            .use(authMiddleware())
            .get('/info', () => ({
                name: process.env.BOT_NAME || 'Pterodactyl Bot',
                version: process.env.npm_package_version || '1.0.0',
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            }))
            .use(createBotRoutes(this.botStateManager))
            .use(createOrderRoutes(this.orderManager))
            .use(createPterodactylRoutes(this.pterodactylAPI))
            .use(createPackageRoutes)
        );

        // WebSocket endpoint
        this.app.ws('/ws', {
            message: (ws, message) => this.wsManager.handleMessage(ws, message),
            open: (ws) => this.wsManager.handleConnection(ws),
            close: (ws) => this.wsManager.handleDisconnection(ws),
            error: (ws, error) => this.wsManager.handleError(ws, error)
        });

        // Serve frontend
        this.app.get('/', () => Bun.file('public/index.html'));
        
        // Handle static assets explicitly before SPA fallback
        this.app.get('/assets/*', (ctx) => {
            const path = ctx.params['*'];
            return Bun.file(`public/assets/${path}`);
        });
        this.app.get('/index.js', () => Bun.file('public/index.js'));
        this.app.get('/static/*', () => Bun.file('public/index.js')); // Handle /static/index.js requests
        
        this.app.get('/*', () => Bun.file('public/index.html')); // SPA fallback
    }

    async start() {
        try {
            Logger.banner(
                'PTERODACTYL WEB SERVER',
                `v${process.env.npm_package_version || '1.0.0'} - Port ${this.port}`
            );

            // Initialize database
            await this.dbManager.initialize();
            
            // Initialize package service with database data
            await this.packageService.initializePackages();

            // Initialize bot state manager
            await this.botStateManager.initialize();

            // Start the server
            this.app.listen(this.port, () => {
                Logger.connection(`🌐 Web server started on http://localhost:${this.port}`, 'info');
                Logger.system(`📡 WebSocket server ready on ws://localhost:${this.port}/ws`);
                Logger.success('✅ Web management interface is ready!');
            });

        } catch (error) {
            Logger.error('❌ Failed to start web server:', error);
            process.exit(1);
        }
    }

    async stop() {
        try {
            Logger.stop('🛑 Stopping web server...');
            await this.wsManager.cleanup();
            await this.botStateManager.cleanup();
            await this.dbManager.close();
            Logger.success('✅ Web server stopped gracefully');
        } catch (error) {
            Logger.error('❌ Error stopping web server:', error);
        }
    }
}

// Graceful shutdown handlers
const webServer = new WebServer();

process.on('SIGINT', async () => {
    Logger.stop('Received SIGINT, stopping web server...');
    await webServer.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    Logger.stop('Received SIGTERM, stopping web server...');
    await webServer.stop();
    process.exit(0);
});

// Start the web server
webServer.start().catch((error) => {
    Logger.error('Fatal error starting web server:', error);
    process.exit(1);
});

export { WebServer };