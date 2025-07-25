#!/usr/bin/env bun
import { OrderManager } from './src/plugins/store/OrderManager';
import { Logger } from './src/utils/logger';

// Set environment variables for testing
process.env.PTERODACTYL_URL = 'https://panel.roidev.my.id';
process.env.PTERODACTYL_API_KEY = 'ptlc_dcJSBqaeCSKDAv1BnMyCGUnUzsYnq5YYziIc2l5R1ba';
process.env.PTERODACTYL_ADMIN_API_KEY = 'ptla_suW1wqLztnQUv7IRUnr9B395MQ7YFTcTmeHI4ThqiXv';

async function testOrderManagerConnection() {
    console.log('🔍 Testing OrderManager Auto-Provisioning Connection...\n');
    
    try {
        const orderManager = new OrderManager();
        
        console.log('📋 Testing auto-provisioning connection...');
        const isHealthy = await orderManager.testAutoProvisioningConnection();
        
        if (isHealthy) {
            console.log('✅ OrderManager auto-provisioning connection successful!');
            console.log('🔧 System is ready for automatic provisioning.');
        } else {
            console.log('❌ OrderManager auto-provisioning connection failed!');
            console.log('🔧 Check Pterodactyl Admin API configuration.');
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

// Run the test
testOrderManagerConnection().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
});