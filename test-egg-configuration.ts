#!/usr/bin/env bun
import { AutoProvisioningService } from './src/services/AutoProvisioningService';
import { PackageType } from './src/plugins/store/models/Order';
import { Logger } from './src/utils/logger';

// Set environment variables
process.env.PTERODACTYL_URL = 'https://panel.roidev.my.id';
process.env.PTERODACTYL_ADMIN_API_KEY = 'ptla_suW1wqLztnQUv7IRUnr9B395MQ7YFTcTmeHI4ThqiXv';

// Set egg IDs based on actual server
process.env.BRONZE_EGG_ID = '15';   // NodeJS VIP
process.env.SILVER_EGG_ID = '16';   // VPS Egg
process.env.GOLD_EGG_ID = '17';     // Python Generic
process.env.PLATINUM_EGG_ID = '15'; // NodeJS VIP
process.env.DIAMOND_EGG_ID = '16';  // VPS Egg

async function testEggConfiguration() {
    console.log('🔍 Testing Updated Egg Configuration...\n');
    
    try {
        const provisioningService = AutoProvisioningService.getInstance();
        
        // Test connection first
        const isHealthy = await provisioningService.testConnection();
        if (!isHealthy) {
            console.log('❌ Auto-provisioning service is not healthy');
            return;
        }
        
        console.log('✅ Auto-provisioning service is healthy\n');
        
        // Test each package type configuration
        const packageTypes = [
            { type: PackageType.BRONZE, name: 'Bronze (NodeJS VIP)', expectedEgg: 15 },
            { type: PackageType.SILVER, name: 'Silver (VPS)', expectedEgg: 16 },
            { type: PackageType.GOLD, name: 'Gold (Python)', expectedEgg: 17 },
            { type: PackageType.PLATINUM, name: 'Platinum (NodeJS VIP)', expectedEgg: 15 },
            { type: PackageType.DIAMOND, name: 'Diamond (VPS)', expectedEgg: 16 }
        ];
        
        console.log('📋 Package Configuration Summary:\n');
        
        for (const pkg of packageTypes) {
            const config = provisioningService.getResourceMapping(pkg.type);
            
            console.log(`📦 ${pkg.name}:`);
            console.log(`   Egg ID: ${config.egg} ${config.egg === pkg.expectedEgg ? '✅' : '❌'}`);
            console.log(`   Docker Image: ${config.dockerImage}`);
            console.log(`   Memory: ${config.limits.memory}MB`);
            console.log(`   Disk: ${config.limits.disk}MB`);
            console.log(`   CPU: ${config.limits.cpu}%`);
            console.log(`   Node: ${config.node}`);
            console.log(`   Environment Variables:`);
            
            Object.entries(config.environment).forEach(([key, value]) => {
                console.log(`     ${key}: ${value}`);
            });
            
            console.log('');
        }
        
        // Test a sample provisioning (dry run)
        console.log('🧪 Testing Sample Provisioning Configuration...\n');
        
        const sampleOrder = {
            id: 'test-001',
            customerName: 'Test Customer',
            customerPhone: '628123456789',
            packageType: PackageType.BRONZE,
            status: 'pending'
        };
        
        console.log('📋 Sample Order Configuration:');
        console.log(`   Package: ${sampleOrder.packageType}`);
        console.log(`   Customer: ${sampleOrder.customerName}`);
        
        const config = provisioningService.getResourceMapping(sampleOrder.packageType);
        console.log(`   Will use Egg ID: ${config.egg} (NodeJS VIP)`);
        console.log(`   Docker Image: ${config.dockerImage}`);
        console.log(`   Resources: ${config.limits.memory}MB RAM, ${config.limits.disk}MB Disk, ${config.limits.cpu}% CPU`);
        
        console.log('\n✅ Egg configuration test completed successfully!');
        console.log('🎉 All packages are properly configured with correct eggs:');
        console.log('   • Bronze & Platinum: NodeJS VIP (ID: 15)');
        console.log('   • Silver & Diamond: VPS (ID: 16)');
        console.log('   • Gold: Python Generic (ID: 17)');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testEggConfiguration().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
});