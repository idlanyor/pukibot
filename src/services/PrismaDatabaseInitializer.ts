import { PrismaDatabaseManager } from '../services/PrismaDatabaseManager';
import { PrismaPackageService } from '../services/PrismaPackageService';
import { PrismaOrderService } from '../services/PrismaOrderService';
import { Logger } from '../utils/logger';

export class PrismaDatabaseInitializer {
    private static instance: PrismaDatabaseInitializer;
    private dbManager: PrismaDatabaseManager;
    private packageService: PrismaPackageService;
    private orderService: PrismaOrderService;

    private constructor() {
        this.dbManager = PrismaDatabaseManager.getInstance({
            logQueries: process.env.NODE_ENV === 'development'
        });
        this.packageService = PrismaPackageService.getInstance();
        this.orderService = PrismaOrderService.getInstance();
    }

    public static getInstance(): PrismaDatabaseInitializer {
        if (!PrismaDatabaseInitializer.instance) {
            PrismaDatabaseInitializer.instance = new PrismaDatabaseInitializer();
        }
        return PrismaDatabaseInitializer.instance;
    }

    public async initialize(): Promise<void> {
        try {
            Logger.info('🔄 Initializing Prisma database system...');
            
            // Initialize database
            await this.dbManager.initialize();
            
            // Run migrations if needed
            await this.dbManager.runMigrations();
            
            // Initialize package service with database data
            await this.packageService.initializePackages();
            
            Logger.info('✅ Prisma database system initialized successfully');
        } catch (error) {
            Logger.error('❌ Failed to initialize Prisma database system:', error);
            throw error;
        }
    }

    public async healthCheck(): Promise<boolean> {
        try {
            const dbHealth = await this.dbManager.healthCheck();
            const stats = await this.dbManager.getStats();
            
            Logger.info('📊 Prisma database health check:', {
                healthy: dbHealth,
                stats
            });
            
            return dbHealth;
        } catch (error) {
            Logger.error('❌ Prisma database health check failed:', error);
            return false;
        }
    }

    public async close(): Promise<void> {
        try {
            await this.dbManager.close();
            Logger.info('✅ Prisma database connections closed');
        } catch (error) {
            Logger.error('❌ Error closing Prisma database connections:', error);
        }
    }

    public getServices() {
        return {
            dbManager: this.dbManager,
            packageService: this.packageService,
            orderService: this.orderService
        };
    }
}