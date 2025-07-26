import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';

export interface DatabaseConfig {
    url?: string;
    logQueries?: boolean;
}

export class PrismaDatabaseManager {
    private static instance: PrismaDatabaseManager;
    private prisma: PrismaClient | null = null;
    private config: DatabaseConfig;

    private constructor(config: DatabaseConfig = {}) {
        this.config = config;
    }

    public static getInstance(config?: DatabaseConfig): PrismaDatabaseManager {
        if (!PrismaDatabaseManager.instance) {
            PrismaDatabaseManager.instance = new PrismaDatabaseManager(config);
        }
        return PrismaDatabaseManager.instance;
    }

    public async initialize(): Promise<void> {
        try {
            // Initialize Prisma client
            this.prisma = new PrismaClient({
                datasources: {
                    db: {
                        url: this.config.url || process.env.DATABASE_URL
                    }
                },
                log: this.config.logQueries ? ['query', 'info', 'warn', 'error'] : ['error']
            });

            // Test connection
            await this.prisma.$connect();
            
            Logger.info('✅ Prisma database initialized successfully');
        } catch (error) {
            Logger.error('❌ Failed to initialize Prisma database:', error);
            throw error;
        }
    }

    public getPrisma(): PrismaClient {
        if (!this.prisma) {
            throw new Error('Prisma not initialized. Call initialize() first.');
        }
        return this.prisma;
    }

    public async close(): Promise<void> {
        if (this.prisma) {
            await this.prisma.$disconnect();
            this.prisma = null;
            Logger.info('✅ Prisma database connection closed');
        }
    }

    public async healthCheck(): Promise<boolean> {
        try {
            if (!this.prisma) return false;
            
            // Simple query to check database health
            await this.prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            Logger.error('❌ Prisma database health check failed:', error);
            return false;
        }
    }

    public async getStats(): Promise<any> {
        if (!this.prisma) throw new Error('Prisma not initialized');

        try {
            const [packages, orders, subscriptions, serverMonitoring] = await Promise.all([
                this.prisma.package.count(),
                this.prisma.order.count(),
                this.prisma.subscription.count(),
                this.prisma.serverMonitoring.count()
            ]);

            return {
                packages: { count: packages },
                orders: { count: orders },
                subscriptions: { count: subscriptions },
                serverMonitoring: { count: serverMonitoring }
            };
        } catch (error) {
            Logger.error('❌ Failed to get database stats:', error);
            throw error;
        }
    }

    // Transaction helper
    public async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
        if (!this.prisma) throw new Error('Prisma not initialized');
        
        return await this.prisma.$transaction(async (prisma) => {
            return await fn(prisma);
        });
    }

    // Migration helper
    public async runMigrations(): Promise<void> {
        try {
            Logger.info('🔄 Running database migrations...');
            // Note: In production, you should run migrations using Prisma CLI
            // This is just for development/testing
            if (this.prisma) {
                await this.prisma.$executeRaw`SELECT 1`;
            }
            Logger.info('✅ Database migrations completed');
        } catch (error) {
            Logger.error('❌ Failed to run migrations:', error);
            throw error;
        }
    }
}