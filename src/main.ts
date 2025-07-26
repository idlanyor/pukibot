import { PrismaDatabaseManager } from './services/PrismaDatabaseManager';
import { Logger } from './utils/logger';
import { config } from 'dotenv';

config();

class MainApplication {
    private dbManager: PrismaDatabaseManager;

    constructor() {
        this.dbManager = PrismaDatabaseManager.getInstance();
    }

    async initialize() {
        try {
            Logger.info('🚀 Initializing PukiBot application...');
            
            // Initialize database system
            Logger.info('🔄 Initializing database system...');
            await this.dbManager.initialize();
            
            // Health check
            const isHealthy = await this.dbManager.healthCheck();
            if (!isHealthy) {
                throw new Error('Database health check failed');
            }
            
            Logger.info('✅ PukiBot application initialized successfully');
        } catch (error) {
            Logger.error('❌ Failed to initialize application:', error);
            throw error;
        }
    }

    async shutdown() {
        try {
            Logger.info('🛑 Shutting down PukiBot application...');
            await this.dbManager.close();
            Logger.info('✅ Application shutdown completed');
        } catch (error) {
            Logger.error('❌ Error during shutdown:', error);
        }
    }
}

export { MainApplication };