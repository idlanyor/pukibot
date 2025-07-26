import { DatabaseManager } from './DatabaseManager';
import { Logger } from '../utils/logger';
import { PackageType, PackageInfo, PACKAGE_CATALOG } from '../plugins/store/models/Order';

export interface PackageRecord {
    id?: number;
    type: string;
    name: string;
    ram: string;
    cpu: string;
    storage: string;
    bandwidth: string;
    price: number;
    emoji: string;
    description?: string;
    category: string;
    egg_id?: number;
    docker_image?: string;
    startup_command?: string;
    environment?: string; // JSON string
    limits?: string; // JSON string
    feature_limits?: string; // JSON string
    node_id?: number;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface PackageFilter {
    category?: string;
    active?: boolean;
    priceMin?: number;
    priceMax?: number;
    search?: string;
}

export class PackageService {
    private static instance: PackageService;
    private db: DatabaseManager;

    private constructor() {
        this.db = DatabaseManager.getInstance();
    }

    public static getInstance(): PackageService {
        if (!PackageService.instance) {
            PackageService.instance = new PackageService();
        }
        return PackageService.instance;
    }

    public async initializePackages(): Promise<void> {
        try {
            Logger.info('🔄 Initializing package catalog in database...');
            
            const database = this.db.getDatabase();
            
            // Check if packages already exist
            const existingCount = database.prepare('SELECT COUNT(*) as count FROM packages').get() as { count: number };
            
            if (existingCount.count > 0) {
                Logger.info(`📦 Found ${existingCount.count} existing packages in database`);
                return;
            }

            // Insert all packages from PACKAGE_CATALOG
            const insertStmt = database.prepare(`
                INSERT INTO packages (
                    type, name, ram, cpu, storage, bandwidth, price, emoji, 
                    description, category, active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const insertMany = database.transaction((packages: PackageRecord[]) => {
                for (const pkg of packages) {
                    insertStmt.run(
                        pkg.type, pkg.name, pkg.ram, pkg.cpu, pkg.storage, 
                        pkg.bandwidth, pkg.price, pkg.emoji, pkg.description, 
                        pkg.category, pkg.active
                    );
                }
            });

            // Convert PACKAGE_CATALOG to PackageRecord array
            const packages: PackageRecord[] = Object.values(PACKAGE_CATALOG).map(pkg => ({
                type: pkg.type,
                name: pkg.name,
                ram: pkg.ram,
                cpu: pkg.cpu,
                storage: pkg.storage,
                bandwidth: pkg.bandwidth,
                price: pkg.price,
                emoji: pkg.emoji,
                description: `${pkg.name} package with ${pkg.ram} RAM, ${pkg.cpu}, ${pkg.storage} storage`,
                category: this.getCategoryFromType(pkg.type),
                active: true
            }));

            insertMany(packages);
            
            Logger.info(`✅ Successfully initialized ${packages.length} packages in database`);
        } catch (error) {
            Logger.error('❌ Failed to initialize packages:', error);
            throw error;
        }
    }

    private getCategoryFromType(type: string): string {
        if (type.startsWith('a') || type.includes('nodejs')) return 'nodejs';
        if (type.startsWith('b') || type.includes('vps')) return 'vps';
        if (type.startsWith('c') || type.includes('python')) return 'python';
        return 'other';
    }

    public async getAllPackages(filter?: PackageFilter): Promise<PackageRecord[]> {
        try {
            const database = this.db.getDatabase();
            let query = 'SELECT * FROM packages WHERE 1=1';
            const params: any[] = [];

            if (filter?.category) {
                query += ' AND category = ?';
                params.push(filter.category);
            }

            if (filter?.active !== undefined) {
                query += ' AND active = ?';
                params.push(filter.active ? 1 : 0);
            }

            if (filter?.priceMin !== undefined) {
                query += ' AND price >= ?';
                params.push(filter.priceMin);
            }

            if (filter?.priceMax !== undefined) {
                query += ' AND price <= ?';
                params.push(filter.priceMax);
            }

            if (filter?.search) {
                query += ' AND (name LIKE ? OR description LIKE ?)';
                params.push(`%${filter.search}%`, `%${filter.search}%`);
            }

            query += ' ORDER BY category, price';

            const stmt = database.prepare(query);
            return stmt.all(...params) as PackageRecord[];
        } catch (error) {
            Logger.error('❌ Failed to get packages:', error);
            throw error;
        }
    }

    public async getPackageByType(type: string): Promise<PackageRecord | null> {
        try {
            const database = this.db.getDatabase();
            const stmt = database.prepare('SELECT * FROM packages WHERE type = ?');
            return stmt.get(type) as PackageRecord || null;
        } catch (error) {
            Logger.error(`❌ Failed to get package ${type}:`, error);
            throw error;
        }
    }

    public async createPackage(packageData: Omit<PackageRecord, 'id' | 'created_at' | 'updated_at'>): Promise<PackageRecord> {
        try {
            const database = this.db.getDatabase();
            const stmt = database.prepare(`
                INSERT INTO packages (
                    type, name, ram, cpu, storage, bandwidth, price, emoji, 
                    description, category, egg_id, docker_image, startup_command, 
                    environment, limits, feature_limits, node_id, active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                packageData.type, packageData.name, packageData.ram, packageData.cpu,
                packageData.storage, packageData.bandwidth, packageData.price, packageData.emoji,
                packageData.description, packageData.category, packageData.egg_id,
                packageData.docker_image, packageData.startup_command, packageData.environment,
                packageData.limits, packageData.feature_limits, packageData.node_id,
                packageData.active ? 1 : 0
            );

            const createdPackage = await this.getPackageByType(packageData.type);
            if (!createdPackage) {
                throw new Error('Failed to retrieve created package');
            }

            Logger.info(`✅ Package created: ${packageData.name} (${packageData.type})`);
            return createdPackage;
        } catch (error) {
            Logger.error('❌ Failed to create package:', error);
            throw error;
        }
    }

    public async updatePackage(type: string, updates: Partial<PackageRecord>): Promise<PackageRecord | null> {
        try {
            const database = this.db.getDatabase();
            
            const fields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(updates)) {
                if (key !== 'id' && key !== 'type' && key !== 'created_at') {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            }
            
            if (fields.length === 0) {
                throw new Error('No valid fields to update');
            }
            
            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(type);
            
            const query = `UPDATE packages SET ${fields.join(', ')} WHERE type = ?`;
            const stmt = database.prepare(query);
            
            const result = stmt.run(...values);
            
            if (result.changes === 0) {
                return null;
            }
            
            const updatedPackage = await this.getPackageByType(type);
            Logger.info(`✅ Package updated: ${type}`);
            return updatedPackage;
        } catch (error) {
            Logger.error(`❌ Failed to update package ${type}:`, error);
            throw error;
        }
    }

    public async deletePackage(type: string): Promise<boolean> {
        try {
            const database = this.db.getDatabase();
            
            // Check if package has any orders
            const orderCount = database.prepare('SELECT COUNT(*) as count FROM orders WHERE package_type = ?').get(type) as { count: number };
            
            if (orderCount.count > 0) {
                throw new Error(`Cannot delete package ${type}: has ${orderCount.count} associated orders`);
            }
            
            const stmt = database.prepare('DELETE FROM packages WHERE type = ?');
            const result = stmt.run(type);
            
            if (result.changes > 0) {
                Logger.info(`✅ Package deleted: ${type}`);
                return true;
            }
            
            return false;
        } catch (error) {
            Logger.error(`❌ Failed to delete package ${type}:`, error);
            throw error;
        }
    }

    public async togglePackageStatus(type: string): Promise<PackageRecord | null> {
        try {
            const database = this.db.getDatabase();
            const currentPackage = await this.getPackageByType(type);
            
            if (!currentPackage) {
                throw new Error(`Package ${type} not found`);
            }
            
            const newStatus = !currentPackage.active;
            return await this.updatePackage(type, { active: newStatus });
        } catch (error) {
            Logger.error(`❌ Failed to toggle package status ${type}:`, error);
            throw error;
        }
    }

    public async getPackageStats(): Promise<any> {
        try {
            const database = this.db.getDatabase();
            
            const totalPackages = database.prepare('SELECT COUNT(*) as count FROM packages').get() as { count: number };
            const activePackages = database.prepare('SELECT COUNT(*) as count FROM packages WHERE active = 1').get() as { count: number };
            const packagesByCategory = database.prepare(`
                SELECT category, COUNT(*) as count 
                FROM packages 
                GROUP BY category
            `).all() as { category: string; count: number }[];
            
            const priceStats = database.prepare(`
                SELECT 
                    MIN(price) as min_price,
                    MAX(price) as max_price,
                    AVG(price) as avg_price
                FROM packages 
                WHERE active = 1
            `).get() as { min_price: number; max_price: number; avg_price: number };
            
            return {
                total: totalPackages.count,
                active: activePackages.count,
                inactive: totalPackages.count - activePackages.count,
                byCategory: packagesByCategory,
                pricing: priceStats
            };
        } catch (error) {
            Logger.error('❌ Failed to get package stats:', error);
            throw error;
        }
    }

    public async searchPackages(searchTerm: string): Promise<PackageRecord[]> {
        return this.getAllPackages({
            search: searchTerm,
            active: true
        });
    }

    public async getPackagesByCategory(category: string): Promise<PackageRecord[]> {
        return this.getAllPackages({
            category,
            active: true
        });
    }

    public async getPackagesByPriceRange(minPrice: number, maxPrice: number): Promise<PackageRecord[]> {
        return this.getAllPackages({
            priceMin: minPrice,
            priceMax: maxPrice,
            active: true
        });
    }

    // Compatibility method for existing code
    public async getPackageInfo(type: string): Promise<PackageInfo | null> {
        const packageRecord = await this.getPackageByType(type);
        if (!packageRecord) return null;

        return {
            type: packageRecord.type as PackageType,
            name: packageRecord.name,
            ram: packageRecord.ram,
            cpu: packageRecord.cpu,
            price: packageRecord.price,
            storage: packageRecord.storage,
            bandwidth: packageRecord.bandwidth,
            emoji: packageRecord.emoji
        };
    }
}