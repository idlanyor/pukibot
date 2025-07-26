import { PrismaDatabaseManager } from './PrismaDatabaseManager';
import { Logger } from '../utils/logger';
import { PrismaClient, Package } from '@prisma/client';

export interface PackageRecord {
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
    eggId?: number;
    dockerImage?: string;
    startupCommand?: string;
    environment?: string;
    limits?: string;
    featureLimits?: string;
    nodeId?: number;
    active?: boolean;
}

export interface PackageFilter {
    category?: string;
    active?: boolean;
    priceRange?: {
        min?: number;
        max?: number;
    };
}

export class PrismaPackageService {
    private static instance: PrismaPackageService;
    private db: PrismaDatabaseManager;
    private prisma: PrismaClient;

    private constructor() {
        this.db = PrismaDatabaseManager.getInstance();
        this.prisma = this.db.getPrisma();
    }

    public static getInstance(): PrismaPackageService {
        if (!PrismaPackageService.instance) {
            PrismaPackageService.instance = new PrismaPackageService();
        }
        return PrismaPackageService.instance;
    }

    public async initializePackages(): Promise<void> {
        try {
            Logger.info('🔄 Initializing package catalog in database...');

            const existingCount = await this.prisma.package.count();

            if (existingCount > 0) {
                Logger.info(`📦 Found ${existingCount} existing packages in database`);
                return;
            }

            // Initialize with default packages
            const packages = this.getDefaultPackages();

            await this.prisma.package.createMany({
                data: packages,
                skipDuplicates: true
            });

            Logger.info(`✅ Successfully initialized ${packages.length} packages in database`);
        } catch (error) {
            Logger.error('❌ Failed to initialize packages:', error);
            throw error;
        }
    }

    public async getAllPackages(filter?: PackageFilter): Promise<Package[]> {
        try {
            const where: any = {};

            if (filter?.category) {
                where.category = filter.category;
            }

            if (filter?.active !== undefined) {
                where.active = filter.active;
            }

            if (filter?.priceRange) {
                where.price = {};
                if (filter.priceRange.min !== undefined) {
                    where.price.gte = filter.priceRange.min;
                }
                if (filter.priceRange.max !== undefined) {
                    where.price.lte = filter.priceRange.max;
                }
            }

            const packages = await this.prisma.package.findMany({
                where,
                orderBy: [
                    { category: 'asc' },
                    { price: 'asc' }
                ]
            });

            return packages;
        } catch (error) {
            Logger.error('❌ Failed to get packages:', error);
            throw error;
        }
    }

    public async getPackagesByCategory(category: string): Promise<Package[]> {
        try {
            const packages = await this.prisma.package.findMany({
                where: {
                    category: category,
                    active: true
                },
                orderBy: { price: 'asc' }
            });

            return packages;
        } catch (error) {
            Logger.error('❌ Failed to get packages by category:', error);
            throw error;
        }
    }

    public async getPackageByType(type: string): Promise<Package | null> {
        try {
            const pkg = await this.prisma.package.findUnique({
                where: { type }
            });

            return pkg;
        } catch (error) {
            Logger.error('❌ Failed to get package by type:', error);
            throw error;
        }
    }

    public async createPackage(packageData: PackageRecord): Promise<Package> {
        try {
            const pkg = await this.prisma.package.create({
                data: packageData
            });

            Logger.info(`✅ Package created: ${pkg.type}`);
            return pkg;
        } catch (error) {
            Logger.error('❌ Failed to create package:', error);
            throw error;
        }
    }

    public async updatePackage(type: string, packageData: Partial<PackageRecord>): Promise<Package | null> {
        try {
            const pkg = await this.prisma.package.update({
                where: { type },
                data: packageData
            });

            Logger.info(`✅ Package updated: ${pkg.type}`);
            return pkg;
        } catch (error) {
            Logger.error('❌ Failed to update package:', error);
            throw error;
        }
    }

    public async deletePackage(type: string): Promise<boolean> {
        try {
            // Check if package has orders
            const orderCount = await this.prisma.order.count({
                where: { packageType: type }
            });

            if (orderCount > 0) {
                Logger.warn(`⚠️ Cannot delete package ${type}: has ${orderCount} associated orders`);
                return false;
            }

            await this.prisma.package.delete({
                where: { type }
            });

            Logger.info(`✅ Package deleted: ${type}`);
            return true;
        } catch (error) {
            Logger.error('❌ Failed to delete package:', error);
            throw error;
        }
    }

    public async searchPackages(query: string): Promise<Package[]> {
        try {
            const pkgs = await this.prisma.package.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { category: { contains: query, mode: 'insensitive' } }
                    ],
                    active: true
                },
                orderBy: { price: 'asc' }
            });

            return pkgs;
        } catch (error) {
            Logger.error('❌ Failed to search packages:', error);
            throw error;
        }
    }

    public async getPackageStats(): Promise<any> {
        try {
            const totalPackages = await this.prisma.package.count();
            const activePackages = await this.prisma.package.count({
                where: { active: true }
            });

            const packagesByCategory = await this.prisma.package.groupBy({
                by: ['category'],
                _count: { category: true },
                where: { active: true }
            });

            const priceStats = await this.prisma.package.aggregate({
                _min: { price: true },
                _max: { price: true },
                _avg: { price: true }
            });

            return {
                total: totalPackages,
                active: activePackages,
                inactive: totalPackages - activePackages,
                byCategory: packagesByCategory,
                priceRange: {
                    min: priceStats._min.price,
                    max: priceStats._max.price,
                    average: priceStats._avg.price
                }
            };
        } catch (error) {
            Logger.error('❌ Failed to get package stats:', error);
            throw error;
        }
    }

    private getDefaultPackages(): PackageRecord[] {
        // Return default packages configuration
        // This should match your existing package configuration
        return [
            // A-tier packages (NodeJS)
            {
                type: 'A1',
                name: 'NodeJS A1',
                ram: '1GB',
                cpu: '50%',
                storage: '5GB',
                bandwidth: 'Unlimited',
                price: 5000,
                emoji: '🟢',
                category: 'nodejs',
                active: true
            },
            {
                type: 'A2',
                name: 'NodeJS A2',
                ram: '2GB',
                cpu: '75%',
                storage: '10GB',
                bandwidth: 'Unlimited',
                price: 8000,
                emoji: '🟢',
                category: 'nodejs',
                active: true
            },
            // Add more packages as needed...
        ];
    }
}