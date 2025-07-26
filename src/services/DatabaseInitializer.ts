import { DatabaseManager } from '../services/DatabaseManager';
import { PackageService } from '../services/PackageService';
import { OrderService } from '../services/OrderService';
import { Logger } from '../utils/logger';
import * as path from 'path';

export class DatabaseInitializer {
    private static instance: DatabaseInitializer;
    private dbManager: DatabaseManager;
    private packageService: PackageService;
    private orderService: OrderService;

    private constructor() {
        this.dbManager = DatabaseManager.getInstance({
            filename: path.join(process.cwd(), 'data', 'pukibot.db'),
            options: {
                verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
            }
        });
        this.packageService = PackageService.getInstance();
        this.orderService = OrderService.getInstance();
    }

    public static getInstance(): DatabaseInitializer {
        if (!DatabaseInitializer.instance) {
            DatabaseInitializer.instance = new DatabaseInitializer();
        }
        return DatabaseInitializer.instance;
    }

    public async initialize(): Promise<void> {
        try {
            Logger.info('🔄 Initializing database system...');
            
            // Initialize database
            await this.dbManager.initialize();
            
            // Initialize package service with database data
            await this.packageService.initializePackages();
            
            Logger.info('✅ Database system initialized successfully');
        } catch (error) {
            Logger.error('❌ Failed to initialize database system:', error);
            throw error;
        }
    }

    public async healthCheck(): Promise<boolean> {
        try {
            const dbHealth = await this.dbManager.healthCheck();
            const stats = await this.dbManager.getStats();
            
            Logger.info('📊 Database health check:', {
                healthy: dbHealth,
                stats
            });
            
            return dbHealth;
        } catch (error) {
            Logger.error('❌ Database health check failed:', error);
            return false;
        }
    }

    public async close(): Promise<void> {
        try {
            await this.dbManager.close();
            Logger.info('✅ Database connections closed');
        } catch (error) {
            Logger.error('❌ Error closing database connections:', error);
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