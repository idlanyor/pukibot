import { DatabaseManager } from './DatabaseManager';
import { PrismaDatabaseManager } from './PrismaDatabaseManager';
import { Logger } from '../utils/logger';
import * as path from 'path';

export class DatabaseMigrationService {
    private sqliteDb: DatabaseManager;
    private prismaDb: PrismaDatabaseManager;

    constructor() {
        // Initialize SQLite database (old)
        this.sqliteDb = DatabaseManager.getInstance({
            filename: path.join(process.cwd(), 'data', 'pukibot.db'),
            options: {
                readonly: true // Read-only to prevent accidental writes
            }
        });

        // Initialize Prisma database (new)
        this.prismaDb = PrismaDatabaseManager.getInstance({
            logQueries: process.env.NODE_ENV === 'development'
        });
    }

    public async migrateData(): Promise<void> {
        try {
            Logger.info('🔄 Starting database migration from SQLite to MySQL...');

            // Initialize both databases
            await this.sqliteDb.initialize();
            await this.prismaDb.initialize();

            const prisma = this.prismaDb.getPrisma();
            const sqlite = this.sqliteDb.getDatabase();

            // Migrate packages
            Logger.info('📦 Migrating packages...');
            const packages = sqlite.prepare('SELECT * FROM packages').all() as any[];
            
            for (const pkg of packages) {
                await prisma.package.upsert({
                    where: { type: pkg.type },
                    update: {
                        name: pkg.name,
                        ram: pkg.ram,
                        cpu: pkg.cpu,
                        storage: pkg.storage,
                        bandwidth: pkg.bandwidth,
                        price: pkg.price,
                        emoji: pkg.emoji,
                        description: pkg.description,
                        category: pkg.category,
                        eggId: pkg.egg_id,
                        dockerImage: pkg.docker_image,
                        startupCommand: pkg.startup_command,
                        environment: pkg.environment,
                        limits: pkg.limits,
                        featureLimits: pkg.feature_limits,
                        nodeId: pkg.node_id,
                        active: Boolean(pkg.active),
                        updatedAt: pkg.updated_at ? new Date(pkg.updated_at) : new Date()
                    },
                    create: {
                        type: pkg.type,
                        name: pkg.name,
                        ram: pkg.ram,
                        cpu: pkg.cpu,
                        storage: pkg.storage,
                        bandwidth: pkg.bandwidth,
                        price: pkg.price,
                        emoji: pkg.emoji,
                        description: pkg.description,
                        category: pkg.category,
                        eggId: pkg.egg_id,
                        dockerImage: pkg.docker_image,
                        startupCommand: pkg.startup_command,
                        environment: pkg.environment,
                        limits: pkg.limits,
                        featureLimits: pkg.feature_limits,
                        nodeId: pkg.node_id,
                        active: Boolean(pkg.active),
                        createdAt: pkg.created_at ? new Date(pkg.created_at) : new Date(),
                        updatedAt: pkg.updated_at ? new Date(pkg.updated_at) : new Date()
                    }
                });
            }
            Logger.info(`✅ Migrated ${packages.length} packages`);

            // Migrate orders
            Logger.info('📋 Migrating orders...');
            const orders = sqlite.prepare('SELECT * FROM orders').all() as any[];
            
            for (const order of orders) {
                await prisma.order.upsert({
                    where: { id: order.id },
                    update: {
                        customerPhone: order.customer_phone,
                        customerName: order.customer_name,
                        customerChatId: order.customer_chat_id,
                        packageType: order.package_type,
                        packageDuration: order.package_duration,
                        packagePrice: order.package_price,
                        packageSpecs: order.package_specs,
                        status: order.status,
                        totalAmount: order.total_amount,
                        currency: order.currency,
                        notes: order.notes,
                        adminNotes: order.admin_notes,
                        paymentProof: order.payment_proof,
                        serverId: order.server_id,
                        updatedAt: order.updated_at ? new Date(order.updated_at) : new Date()
                    },
                    create: {
                        id: order.id,
                        customerPhone: order.customer_phone,
                        customerName: order.customer_name,
                        customerChatId: order.customer_chat_id,
                        packageType: order.package_type,
                        packageDuration: order.package_duration,
                        packagePrice: order.package_price,
                        packageSpecs: order.package_specs,
                        status: order.status,
                        totalAmount: order.total_amount,
                        currency: order.currency,
                        notes: order.notes,
                        adminNotes: order.admin_notes,
                        paymentProof: order.payment_proof,
                        serverId: order.server_id,
                        createdAt: order.created_at ? new Date(order.created_at) : new Date(),
                        updatedAt: order.updated_at ? new Date(order.updated_at) : new Date()
                    }
                });
            }
            Logger.info(`✅ Migrated ${orders.length} orders`);

            // Migrate order status history
            Logger.info('📜 Migrating order status history...');
            const statusHistory = sqlite.prepare('SELECT * FROM order_status_history').all() as any[];
            
            for (const history of statusHistory) {
                await prisma.orderStatusHistory.upsert({
                    where: { id: history.id },
                    update: {
                        orderId: history.order_id,
                        status: history.status,
                        updatedBy: history.updated_by,
                        notes: history.notes,
                        timestamp: history.timestamp ? new Date(history.timestamp) : new Date()
                    },
                    create: {
                        id: history.id,
                        orderId: history.order_id,
                        status: history.status,
                        updatedBy: history.updated_by,
                        notes: history.notes,
                        timestamp: history.timestamp ? new Date(history.timestamp) : new Date()
                    }
                });
            }
            Logger.info(`✅ Migrated ${statusHistory.length} status history records`);

            // Migrate subscriptions
            Logger.info('🔄 Migrating subscriptions...');
            const subscriptions = sqlite.prepare('SELECT * FROM subscriptions').all() as any[];
            
            for (const subscription of subscriptions) {
                await prisma.subscription.upsert({
                    where: { id: subscription.id },
                    update: {
                        orderId: subscription.order_id,
                        serverId: subscription.server_id,
                        customerPhone: subscription.customer_phone,
                        packageType: subscription.package_type,
                        status: subscription.status,
                        expiresAt: new Date(subscription.expires_at),
                        updatedAt: subscription.updated_at ? new Date(subscription.updated_at) : new Date()
                    },
                    create: {
                        id: subscription.id,
                        orderId: subscription.order_id,
                        serverId: subscription.server_id,
                        customerPhone: subscription.customer_phone,
                        packageType: subscription.package_type,
                        status: subscription.status,
                        expiresAt: new Date(subscription.expires_at),
                        createdAt: subscription.created_at ? new Date(subscription.created_at) : new Date(),
                        updatedAt: subscription.updated_at ? new Date(subscription.updated_at) : new Date()
                    }
                });
            }
            Logger.info(`✅ Migrated ${subscriptions.length} subscriptions`);

            // Migrate server monitoring
            Logger.info('🖥️ Migrating server monitoring...');
            const serverMonitoring = sqlite.prepare('SELECT * FROM server_monitoring').all() as any[];
            
            for (const server of serverMonitoring) {
                await prisma.serverMonitoring.upsert({
                    where: { id: server.id },
                    update: {
                        serverId: server.server_id,
                        orderId: server.order_id,
                        name: server.name,
                        status: server.status,
                        resources: server.resources,
                        limits: server.limits,
                        lastCheck: server.last_check ? new Date(server.last_check) : new Date(),
                        updatedAt: server.updated_at ? new Date(server.updated_at) : new Date()
                    },
                    create: {
                        id: server.id,
                        serverId: server.server_id,
                        orderId: server.order_id,
                        name: server.name,
                        status: server.status,
                        resources: server.resources,
                        limits: server.limits,
                        lastCheck: server.last_check ? new Date(server.last_check) : new Date(),
                        createdAt: server.created_at ? new Date(server.created_at) : new Date(),
                        updatedAt: server.updated_at ? new Date(server.updated_at) : new Date()
                    }
                });
            }
            Logger.info(`✅ Migrated ${serverMonitoring.length} server monitoring records`);

            Logger.info('🎉 Database migration completed successfully!');

            // Display migration summary
            const stats = await this.prismaDb.getStats();
            Logger.info('📊 Migration Summary:', stats);

        } catch (error) {
            Logger.error('❌ Database migration failed:', error);
            throw error;
        } finally {
            // Close connections
            await this.sqliteDb.close();
            await this.prismaDb.close();
        }
    }

    public async verifyMigration(): Promise<boolean> {
        try {
            Logger.info('🔍 Verifying migration...');

            await this.sqliteDb.initialize();
            await this.prismaDb.initialize();

            const sqlite = this.sqliteDb.getDatabase();
            const prisma = this.prismaDb.getPrisma();

            // Compare record counts
            const sqliteStats = {
                packages: sqlite.prepare('SELECT COUNT(*) as count FROM packages').get() as { count: number },
                orders: sqlite.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number },
                subscriptions: sqlite.prepare('SELECT COUNT(*) as count FROM subscriptions').get() as { count: number },
                serverMonitoring: sqlite.prepare('SELECT COUNT(*) as count FROM server_monitoring').get() as { count: number },
                statusHistory: sqlite.prepare('SELECT COUNT(*) as count FROM order_status_history').get() as { count: number }
            };

            const prismaStats = {
                packages: { count: await prisma.package.count() },
                orders: { count: await prisma.order.count() },
                subscriptions: { count: await prisma.subscription.count() },
                serverMonitoring: { count: await prisma.serverMonitoring.count() },
                statusHistory: { count: await prisma.orderStatusHistory.count() }
            };

            Logger.info('📊 SQLite Stats:', sqliteStats);
            Logger.info('📊 MySQL Stats:', prismaStats);

            const isValid = (
                sqliteStats.packages.count === prismaStats.packages.count &&
                sqliteStats.orders.count === prismaStats.orders.count &&
                sqliteStats.subscriptions.count === prismaStats.subscriptions.count &&
                sqliteStats.serverMonitoring.count === prismaStats.serverMonitoring.count &&
                sqliteStats.statusHistory.count === prismaStats.statusHistory.count
            );

            if (isValid) {
                Logger.info('✅ Migration verification successful!');
            } else {
                Logger.error('❌ Migration verification failed - record counts do not match');
            }

            return isValid;

        } catch (error) {
            Logger.error('❌ Migration verification failed:', error);
            return false;
        } finally {
            await this.sqliteDb.close();
            await this.prismaDb.close();
        }
    }
}