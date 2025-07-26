import { PrismaDatabaseManager } from '../services/PrismaDatabaseManager';
import { Logger } from '../utils/logger';
import { Package } from '@prisma/client';

export class WhatsAppCatalogService {
    private static instance: WhatsAppCatalogService;
    private databaseManager: PrismaDatabaseManager;

    private constructor() {
        this.databaseManager = PrismaDatabaseManager.getInstance();
    }
    public static getInstance(): WhatsAppCatalogService {
        if (!WhatsAppCatalogService.instance) {
            WhatsAppCatalogService.instance = new WhatsAppCatalogService();
        }
        return WhatsAppCatalogService.instance;
    }

    /**
     * Generate catalog message for WhatsApp
     * Fully dynamic from database, no hardcoded values
     */
    public async generateCatalogMessage(): Promise<string> {
        try {
            const prisma = this.databaseManager.getPrisma();
            
            // Get all active packages grouped by category
            const categories = await prisma.package.groupBy({
                by: ['category'],
                where: { active: true },
                _count: { category: true }
            });

            let catalogMessage = '🏪 *KATALOG HOSTING ANTIDONASI*\n\n';
            catalogMessage += '📋 *Paket Hosting Tersedia:*\n';
            catalogMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

            // Process each category
            for (const categoryInfo of categories) {
                const packages = await prisma.package.findMany({
                    where: { 
                        category: categoryInfo.category,
                        active: true 
                    },
                    orderBy: [
                        { type: 'asc' }
                    ]
                });

                if (packages.length === 0) continue;

                // Category header
                const categoryName = this.getCategoryDisplayName(categoryInfo.category);
                const categoryEmoji = this.getCategoryEmoji(categoryInfo.category);
                
                catalogMessage += `${categoryEmoji} *${categoryName}*\n`;
                catalogMessage += `${'-'.repeat(25)}\n`;

                // Add packages for this category
                for (const pkg of packages) {
                    catalogMessage += this.formatPackageForWhatsApp(pkg);
                }

                catalogMessage += '\n';
            }

            // Add footer with instructions
            catalogMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            catalogMessage += '📞 *Cara Order:*\n';
            catalogMessage += '• Ketik: `order [kode_paket]`\n';
            catalogMessage += '• Contoh: `order A1` atau `order B3`\n\n';
            catalogMessage += '💡 *Info Tambahan:*\n';
            catalogMessage += '• Semua paket include bandwidth unlimited\n';
            catalogMessage += '• Support 24/7 via WhatsApp\n';
            catalogMessage += '• Garansi uptime 99.9%\n\n';
            catalogMessage += `📱 *Admin:* wa.me/${process.env.STORE_ADMIN || 'admin'}\n`;
            catalogMessage += '🌐 *Website:* https://antidonasi.com';

            return catalogMessage;

        } catch (error) {
            Logger.error('❌ Failed to generate catalog message:', error);
            return '❌ Maaf, terjadi kesalahan saat memuat katalog. Silakan coba lagi nanti.';
        }
    }

    /**
     * Generate category-specific catalog message
     */
    public async generateCategoryCatalogMessage(category: string): Promise<string> {
        try {
            const prisma = this.databaseManager.getPrisma();
            
            const packages = await prisma.package.findMany({
                where: { 
                    category: category.toLowerCase(),
                    active: true 
                },
                orderBy: [
                    { type: 'asc' }
                ]
            });

            if (packages.length === 0) {
                return `❌ Tidak ada paket ${category} yang tersedia saat ini.`;
            }

            const categoryName = this.getCategoryDisplayName(category);
            const categoryEmoji = this.getCategoryEmoji(category);
            
            let message = `${categoryEmoji} *PAKET ${categoryName.toUpperCase()}*\n\n`;
            message += '📋 *Paket Tersedia:*\n';
            message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

            for (const pkg of packages) {
                message += this.formatPackageForWhatsApp(pkg);
            }

            message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            message += '📞 *Cara Order:*\n';
            message += '• Ketik: `order [kode_paket]`\n';
            message += `• Contoh: \`order ${packages[0].type}\`\n\n`;
            message += `📱 *Admin:* wa.me/${process.env.STORE_ADMIN || 'admin'}`;

            return message;

        } catch (error) {
            Logger.error('❌ Failed to generate category catalog message:', error);
            return '❌ Maaf, terjadi kesalahan saat memuat katalog. Silakan coba lagi nanti.';
        }
    }

    /**
     * Generate package detail message
     */
    public async getPackageInfo(packageType: string): Promise<Package | null> {
        try {
            const prisma = this.databaseManager.getPrisma();
            return await prisma.package.findUnique({
                where: { type: packageType.toUpperCase() }
            });
        } catch (error) {
            Logger.error('❌ Failed to get package info:', error);
            return null;
        }
    }

    /**
     * Generate package detail message
     */
    public async generatePackageDetailMessage(packageType: string): Promise<string> {
        try {
            const prisma = this.databaseManager.getPrisma();
            
            const pkg = await prisma.package.findUnique({
                where: { type: packageType.toUpperCase() }
            });

            if (!pkg) {
                return `❌ Paket ${packageType.toUpperCase()} tidak ditemukan.`;
            }

            if (!pkg.active) {
                return `❌ Paket ${packageType.toUpperCase()} sedang tidak tersedia.`;
            }

            let message = `${pkg.emoji} *DETAIL PAKET ${pkg.type}*\n\n`;
            message += `📦 *Nama:* ${pkg.name}\n`;
            message += `💰 *Harga:* Rp ${pkg.price.toLocaleString('id-ID')}/bulan\n`;
            message += `📝 *Deskripsi:* ${pkg.description || 'Tidak ada deskripsi'}\n\n`;
            
            message += '🖥️ *Spesifikasi:*\n';
            message += `• RAM: ${pkg.ram}\n`;
            message += `• CPU: ${pkg.cpu}\n`;
            message += `• Storage: ${pkg.storage}\n`;
            message += `• Bandwidth: ${pkg.bandwidth}\n\n`;

            // Parse and display feature limits
            if (pkg.featureLimits) {
                try {
                    const features = JSON.parse(pkg.featureLimits);
                    message += '✨ *Fitur Tambahan:*\n';
                    message += `• Database: ${features.databases || 0}\n`;
                    message += `• Allocations: ${features.allocations || 0}\n`;
                    message += `• Backups: ${features.backups || 0}\n\n`;
                } catch (e) {
                    // Skip if JSON parsing fails
                }
            }

            // Technical details
            message += '🔧 *Detail Teknis:*\n';
            message += `• Kategori: ${this.getCategoryDisplayName(pkg.category)}\n`;
            message += `• Egg ID: ${pkg.eggId || 'N/A'}\n`;
            if (pkg.dockerImage) {
                message += `• Docker: ${pkg.dockerImage}\n`;
            }
            message += `• Node ID: ${pkg.nodeId || 1}\n\n`;

            message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            message += '📞 *Cara Order:*\n';
            message += `• Ketik: \`order ${pkg.type}\`\n`;
            message += `• Harga: Rp ${pkg.price.toLocaleString('id-ID')}/bulan\n\n`;
            message += `📱 *Admin:* wa.me/${process.env.STORE_ADMIN || 'admin'}`;

            return message;

        } catch (error) {
            Logger.error('❌ Failed to generate package detail message:', error);
            return '❌ Maaf, terjadi kesalahan saat memuat detail paket. Silakan coba lagi nanti.';
        }
    }

    /**
     * Get available package types for autocomplete/suggestions
     */
    public async getAvailablePackageTypes(): Promise<string[]> {
        try {
            const prisma = this.databaseManager.getPrisma();
            
            const packages = await prisma.package.findMany({
                where: { active: true },
                select: { type: true },
                orderBy: { type: 'asc' }
            });

            return packages.map(pkg => pkg.type);

        } catch (error) {
            Logger.error('❌ Failed to get available package types:', error);
            return [];
        }
    }

    /**
     * Get available categories
     */
    public async getAvailableCategories(): Promise<string[]> {
        try {
            const prisma = this.databaseManager.getPrisma();
            
            const categories = await prisma.package.groupBy({
                by: ['category'],
                where: { active: true }
            });

            return categories.map(cat => cat.category);

        } catch (error) {
            Logger.error('❌ Failed to get available categories:', error);
            return [];
        }
    }

    /**
     * Search packages by name or description
     */
    public async searchPackages(query: string): Promise<string> {
        try {
            const prisma = this.databaseManager.getPrisma();
            
            const packages = await prisma.package.findMany({
                where: {
                    AND: [
                        { active: true },
                        {
                            OR: [
                                { name: { contains: query } },
                                { description: { contains: query } },
                                { type: { contains: query } },
                                { category: { contains: query } }
                            ]
                        }
                    ]
                },
                orderBy: { type: 'asc' }
            });

            if (packages.length === 0) {
                return `❌ Tidak ditemukan paket dengan kata kunci "${query}".`;
            }

            let message = `🔍 *HASIL PENCARIAN: "${query}"*\n\n`;
            message += `📋 Ditemukan ${packages.length} paket:\n`;
            message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

            for (const pkg of packages) {
                message += this.formatPackageForWhatsApp(pkg);
            }

            message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            message += '📞 *Cara Order:*\n';
            message += '• Ketik: `order [kode_paket]`\n';
            message += `• Contoh: \`order ${packages[0].type}\`\n\n`;
            message += `📱 *Admin:* wa.me/${process.env.STORE_ADMIN || 'admin'}`;

            return message;

        } catch (error) {
            Logger.error('❌ Failed to search packages:', error);
            return '❌ Maaf, terjadi kesalahan saat mencari paket. Silakan coba lagi nanti.';
        }
    }

    /**
     * Format single package for WhatsApp display
     */
    private formatPackageForWhatsApp(pkg: Package): string {
        let packageText = `${pkg.emoji} *${pkg.type}* - ${pkg.name}\n`;
        packageText += `   💰 Rp ${pkg.price.toLocaleString('id-ID')}/bulan\n`;
        packageText += `   🖥️ ${pkg.ram} RAM • ${pkg.cpu} CPU • ${pkg.storage} Storage\n`;
        
        if (pkg.description) {
            packageText += `   📝 ${pkg.description}\n`;
        }

        // Add feature limits if available
        if (pkg.featureLimits) {
            try {
                const features = JSON.parse(pkg.featureLimits);
                packageText += `   ✨ ${features.databases || 0} DB • ${features.allocations || 0} Alloc • ${features.backups || 0} Backup\n`;
            } catch (e) {
                // Skip if JSON parsing fails
            }
        }

        packageText += '\n';
        return packageText;
    }

    /**
     * Get display name for category
     */
    private getCategoryDisplayName(category: string): string {
        const categoryMap: { [key: string]: string } = {
            'nodejs': 'NodeJS Hosting',
            'vps': 'VPS Hosting',
            'python': 'Python Hosting',
            'php': 'PHP Hosting',
            'java': 'Java Hosting',
            'golang': 'Golang Hosting'
        };

        return categoryMap[category.toLowerCase()] || category.toUpperCase();
    }

    /**
     * Get emoji for category
     */
    private getCategoryEmoji(category: string): string {
        const emojiMap: { [key: string]: string } = {
            'nodejs': '🟢',
            'vps': '🔵',
            'python': '🟡',
            'php': '🟣',
            'java': '🟠',
            'golang': '🔴'
        };

        return emojiMap[category.toLowerCase()] || '⚪';
    }
}