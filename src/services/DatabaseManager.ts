import Database from 'better-sqlite3';
import { Logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

export interface DatabaseConfig {
    filename: string;
    options?: {
        readonly?: boolean;
        fileMustExist?: boolean;
        timeout?: number;
        verbose?: boolean;
    };
}

export class DatabaseManager {
    private static instance: DatabaseManager;
    private db: Database.Database | null = null;
    private config: DatabaseConfig;

    private constructor(config: DatabaseConfig) {
        this.config = config;
    }

    public static getInstance(config?: DatabaseConfig): DatabaseManager {
        if (!DatabaseManager.instance) {
            if (!config) {
                throw new Error('Database configuration is required for first initialization');
            }
            DatabaseManager.instance = new DatabaseManager(config);
        }
        return DatabaseManager.instance;
    }

    public async initialize(): Promise<void> {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.config.filename);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Initialize database
            this.db = new Database(this.config.filename, this.config.options);
            
            // Enable WAL mode for better performance
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('cache_size = 1000');
            this.db.pragma('temp_store = memory');
            
            // Create tables
            await this.createTables();
            
            Logger.info(`✅ Database initialized: ${this.config.filename}`);
        } catch (error) {
            Logger.error('❌ Failed to initialize database:', error);
            throw error;
        }
    }

    private async createTables(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // Create packages table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS packages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                ram TEXT NOT NULL,
                cpu TEXT NOT NULL,
                storage TEXT NOT NULL,
                bandwidth TEXT NOT NULL,
                price INTEGER NOT NULL,
                emoji TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL,
                egg_id INTEGER,
                docker_image TEXT,
                startup_command TEXT,
                environment TEXT, -- JSON string
                limits TEXT, -- JSON string
                feature_limits TEXT, -- JSON string
                node_id INTEGER,
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create orders table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                customer_phone TEXT NOT NULL,
                customer_name TEXT,
                customer_chat_id TEXT NOT NULL,
                package_type TEXT NOT NULL,
                package_duration INTEGER NOT NULL,
                package_price INTEGER NOT NULL,
                package_specs TEXT, -- JSON string
                status TEXT NOT NULL,
                total_amount INTEGER NOT NULL,
                currency TEXT NOT NULL,
                notes TEXT,
                admin_notes TEXT,
                payment_proof TEXT,
                server_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (package_type) REFERENCES packages(type)
            )
        `);

        // Create order_status_history table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS order_status_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL,
                status TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                notes TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
        `);

        // Create subscriptions table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL,
                server_id TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                package_type TEXT NOT NULL,
                status TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (package_type) REFERENCES packages(type)
            )
        `);

        // Create server_monitoring table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS server_monitoring (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_id TEXT NOT NULL,
                order_id TEXT,
                name TEXT NOT NULL,
                status TEXT NOT NULL,
                resources TEXT, -- JSON string
                limits TEXT, -- JSON string
                last_check DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
        `);

        // Create indexes for better performance
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
            CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
            CREATE INDEX IF NOT EXISTS idx_orders_package_type ON orders(package_type);
            CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
            CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_phone ON subscriptions(customer_phone);
            CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);
            CREATE INDEX IF NOT EXISTS idx_server_monitoring_server_id ON server_monitoring(server_id);
            CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
        `);

        Logger.info('✅ Database tables created successfully');
    }

    public getDatabase(): Database.Database {
        if (!this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }

    public async close(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
            Logger.info('✅ Database connection closed');
        }
    }

    public async backup(backupPath: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            await this.db.backup(backupPath);
            Logger.info(`✅ Database backup created: ${backupPath}`);
        } catch (error) {
            Logger.error('❌ Failed to create database backup:', error);
            throw error;
        }
    }

    public async vacuum(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            this.db.exec('VACUUM');
            Logger.info('✅ Database vacuum completed');
        } catch (error) {
            Logger.error('❌ Failed to vacuum database:', error);
            throw error;
        }
    }

    public async getStats(): Promise<any> {
        if (!this.db) throw new Error('Database not initialized');

        const stats = {
            packages: this.db.prepare('SELECT COUNT(*) as count FROM packages').get(),
            orders: this.db.prepare('SELECT COUNT(*) as count FROM orders').get(),
            subscriptions: this.db.prepare('SELECT COUNT(*) as count FROM subscriptions').get(),
            serverMonitoring: this.db.prepare('SELECT COUNT(*) as count FROM server_monitoring').get(),
            databaseSize: fs.statSync(this.config.filename).size
        };

        return stats;
    }

    public async healthCheck(): Promise<boolean> {
        try {
            if (!this.db) return false;
            
            // Simple query to check database health
            this.db.prepare('SELECT 1').get();
            return true;
        } catch (error) {
            Logger.error('❌ Database health check failed:', error);
            return false;
        }
    }

    // Transaction helpers
    public transaction<T>(fn: (db: Database.Database) => T): T {
        if (!this.db) throw new Error('Database not initialized');
        
        const transaction = this.db.transaction(fn);
        return transaction(this.db);
    }

    public async asyncTransaction<T>(fn: (db: Database.Database) => Promise<T>): Promise<T> {
        if (!this.db) throw new Error('Database not initialized');
        
        const transaction = this.db.transaction(async (db: Database.Database) => {
            return await fn(db);
        });
        
        return transaction(this.db);
    }
}