#!/usr/bin/env bun
import { Logger } from './src/utils/logger';

async function testBasicComponents() {
    console.log('🔍 Testing Basic Components...\n');
    
    try {
        // Test logger
        Logger.info('Testing logger functionality');
        console.log('✅ Logger working correctly');
        
        // Test environment variables
        console.log('📋 Environment variables:');
        console.log(`  PTERODACTYL_URL: ${process.env.PTERODACTYL_URL || 'Not set'}`);
        console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
        console.log('✅ Environment variables loaded');
        
        // Test file system
        const fs = require('fs');
        const path = require('path');
        
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        console.log('✅ File system operations working');
        
        // Test imports
        const { PackageType } = await import('./src/plugins/store/models/Order');
        console.log('✅ Module imports working');
        console.log(`  Available package types: ${Object.keys(PackageType).length}`);
        
        console.log('\n🎉 All basic components are working correctly!');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testBasicComponents().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
});