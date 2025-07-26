#!/usr/bin/env bun

import { config } from 'dotenv';
import { PrismaDatabaseManager } from './src/services/PrismaDatabaseManager';
import { Logger } from './src/utils/logger';

// Load environment variables
config();

async function viewPackageCatalog() {
    console.log('📦 Viewing Package Catalog from MySQL Database...\n');

    try {
        // Initialize database manager
        const dbManager = PrismaDatabaseManager.getInstance({
            logQueries: false
        });

        await dbManager.initialize();
        const prisma = dbManager.getPrisma();

        // Get all packages grouped by category
        const categories = ['nodejs', 'vps', 'python'];
        
        for (const category of categories) {
            console.log(`\n🔹 ${category.toUpperCase()} PACKAGES:`);
            console.log('=' .repeat(50));
            
            const packages = await prisma.package.findMany({
                where: { category },
                orderBy: { type: 'asc' }
            });

            packages.forEach(pkg => {
                console.log(`${pkg.emoji} ${pkg.type} - ${pkg.name}`);
                console.log(`   💰 Price: Rp ${pkg.price.toLocaleString('id-ID')}`);
                console.log(`   🖥️  Resources: ${pkg.ram} RAM, ${pkg.cpu} CPU, ${pkg.storage} Storage`);
                console.log(`   📝 Description: ${pkg.description}`);
                console.log(`   🥚 Egg ID: ${pkg.eggId}`);
                console.log(`   🐳 Docker: ${pkg.dockerImage}`);
                
                if (pkg.environment) {
                    const env = JSON.parse(pkg.environment);
                    console.log(`   🔧 Environment: ${Object.keys(env).join(', ')}`);
                }
                
                if (pkg.featureLimits) {
                    const features = JSON.parse(pkg.featureLimits);
                    console.log(`   ✨ Features: ${features.databases} DB, ${features.allocations} Alloc, ${features.backups} Backup`);
                }
                
                console.log(`   ✅ Active: ${pkg.active ? 'Yes' : 'No'}`);
                console.log('');
            });
        }

        // Display summary statistics
        console.log('\n📊 CATALOG STATISTICS:');
        console.log('=' .repeat(50));
        
        const stats = await prisma.package.groupBy({
            by: ['category'],
            _count: { category: true },
            _min: { price: true },
            _max: { price: true },
            _avg: { price: true }
        });

        stats.forEach(stat => {
            console.log(`${stat.category.toUpperCase()}:`);
            console.log(`   📦 Count: ${stat._count.category} packages`);
            console.log(`   💰 Price Range: Rp ${stat._min.price?.toLocaleString('id-ID')} - Rp ${stat._max.price?.toLocaleString('id-ID')}`);
            console.log(`   📈 Average: Rp ${Math.round(stat._avg.price || 0).toLocaleString('id-ID')}`);
            console.log('');
        });

        // Total statistics
        const totalStats = await prisma.package.aggregate({
            _count: { id: true },
            _min: { price: true },
            _max: { price: true },
            _avg: { price: true }
        });

        console.log('OVERALL STATISTICS:');
        console.log(`   📦 Total Packages: ${totalStats._count.id}`);
        console.log(`   💰 Price Range: Rp ${totalStats._min.price?.toLocaleString('id-ID')} - Rp ${totalStats._max.price?.toLocaleString('id-ID')}`);
        console.log(`   📈 Average Price: Rp ${Math.round(totalStats._avg.price || 0).toLocaleString('id-ID')}`);

        // Close connection
        await dbManager.close();

        console.log('\n✅ Package catalog viewing completed!');

    } catch (error) {
        console.error('💥 Failed to view package catalog:', error);
        process.exit(1);
    }
}

// Run viewing
viewPackageCatalog().catch(error => {
    console.error('💥 Unexpected error during viewing:', error);
    process.exit(1);
});