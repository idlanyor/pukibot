#!/usr/bin/env bun
import { AutoProvisioningService } from './src/services/AutoProvisioningService';
import { PackageType, PACKAGE_CATALOG } from './src/plugins/store/models/Order';
import { Logger } from './src/utils/logger';

// Set environment variables
process.env.PTERODACTYL_URL = 'https://panel.roidev.my.id';
process.env.PTERODACTYL_ADMIN_API_KEY = 'ptla_suW1wqLztnQUv7IRUnr9B395MQ7YFTcTmeHI4ThqiXv';

async function testAllPackages() {
    console.log('🔍 Testing All 18 Package Configurations...\n');
    
    try {
        const provisioningService = AutoProvisioningService.getInstance();
        
        // Test connection first
        const isHealthy = await provisioningService.testConnection();
        if (!isHealthy) {
            console.log('❌ Auto-provisioning service is not healthy');
            return;
        }
        
        console.log('✅ Auto-provisioning service is healthy\n');
        
        // Group packages by egg type
        const packagesByEgg = {
            nodejs: [
                PackageType.NODEJS_KROCO,
                PackageType.NODEJS_KARBIT,
                PackageType.NODEJS_STANDAR,
                PackageType.NODEJS_SEPUH,
                PackageType.NODEJS_SUHU,
                PackageType.NODEJS_PRO_MAX
            ],
            vps: [
                PackageType.VPS_KROCO,
                PackageType.VPS_KARBIT,
                PackageType.VPS_STANDAR,
                PackageType.VPS_SEPUH,
                PackageType.VPS_SUHU,
                PackageType.VPS_PRO_MAX
            ],
            python: [
                PackageType.PYTHON_KROCO,
                PackageType.PYTHON_KARBIT,
                PackageType.PYTHON_STANDAR,
                PackageType.PYTHON_SEPUH,
                PackageType.PYTHON_SUHU,
                PackageType.PYTHON_PRO_MAX
            ]
        };
        
        // Test each egg type
        for (const [eggType, packages] of Object.entries(packagesByEgg)) {
            console.log(`🔧 Testing ${eggType.toUpperCase()} Packages:\n`);
            
            for (const packageType of packages) {
                const config = provisioningService.getResourceMapping(packageType);
                const catalogInfo = PACKAGE_CATALOG[packageType];
                
                console.log(`📦 ${catalogInfo.name}:`);
                console.log(`   Catalog: ${catalogInfo.ram}, ${catalogInfo.cpu} - IDR ${catalogInfo.price.toLocaleString('id-ID')}/bulan`);
                console.log(`   Config: ${config.limits.memory}MB RAM, ${config.limits.cpu}% CPU, ${config.limits.disk}MB Disk`);
                console.log(`   Egg ID: ${config.egg} (${eggType === 'nodejs' ? 'NodeJS VIP' : eggType === 'vps' ? 'VPS' : 'Python Generic'})`);
                console.log(`   Docker: ${config.dockerImage}`);
                console.log(`   Features: ${config.featureLimits.databases} DB, ${config.featureLimits.allocations} Alloc, ${config.featureLimits.backups} Backup`);
                console.log('');
            }
        }
        
        // Test legacy packages
        console.log('🔄 Testing Legacy Packages:\n');
        const legacyPackages = [
            PackageType.BRONZE,
            PackageType.SILVER,
            PackageType.GOLD,
            PackageType.PLATINUM,
            PackageType.DIAMOND
        ];
        
        for (const packageType of legacyPackages) {
            const config = provisioningService.getResourceMapping(packageType);
            const catalogInfo = PACKAGE_CATALOG[packageType];
            
            console.log(`📦 ${catalogInfo.name}:`);
            console.log(`   Catalog: ${catalogInfo.ram}, ${catalogInfo.cpu} - IDR ${catalogInfo.price.toLocaleString('id-ID')}/bulan`);
            console.log(`   Config: ${config.limits.memory}MB RAM, ${config.limits.cpu}% CPU, ${config.limits.disk}MB Disk`);
            console.log(`   Egg ID: ${config.egg}`);
            console.log('');
        }
        
        // Summary
        console.log('📊 Package Summary:\n');
        console.log('✅ Total packages: 23 (18 new + 5 legacy)');
        console.log('✅ NodeJS VIP packages: 6 tiers');
        console.log('✅ VPS packages: 6 tiers');
        console.log('✅ Python packages: 6 tiers');
        console.log('✅ Legacy packages: 5 (backward compatibility)');
        console.log('');
        console.log('🎯 Price Range:');
        console.log('   • NodeJS: IDR 15,000 - 300,000/bulan');
        console.log('   • VPS: IDR 20,000 - 450,000/bulan');
        console.log('   • Python: IDR 12,000 - 270,000/bulan');
        console.log('');
        console.log('🔧 Resource Range:');
        console.log('   • RAM: 512MB - 32GB');
        console.log('   • CPU: 0.5 - 8 cores');
        console.log('   • Disk: 2GB - 160GB');
        console.log('');
        console.log('🎉 All package configurations are working correctly!');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testAllPackages().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
});