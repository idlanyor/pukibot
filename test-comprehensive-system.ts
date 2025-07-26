#!/usr/bin/env bun
import { Logger } from './src/utils/logger';

async function testComprehensiveSystem() {
    console.log('🔍 Running Comprehensive System Test...\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    const runTest = async (testName: string, testFn: () => Promise<void>) => {
        totalTests++;
        try {
            await testFn();
            console.log(`✅ ${testName}`);
            passedTests++;
        } catch (error) {
            console.log(`❌ ${testName}: ${error.message}`);
        }
    };
    
    // Test 1: Basic Components
    await runTest('Basic Components', async () => {
        const { PackageType } = await import('./src/plugins/store/models/Order');
        if (Object.keys(PackageType).length === 0) throw new Error('No package types found');
    });
    
    // Test 2: WhatsApp Components
    await runTest('WhatsApp Components', async () => {
        const baileys = await import('@whiskeysockets/baileys');
        if (!baileys.makeWASocket) throw new Error('Baileys not properly imported');
    });
    
    // Test 3: Web Components
    await runTest('Web Components', async () => {
        const { Elysia } = await import('elysia');
        if (!Elysia) throw new Error('Elysia not properly imported');
    });
    
    // Test 4: Auto-Provisioning Service
    await runTest('Auto-Provisioning Service', async () => {
        const { AutoProvisioningService } = await import('./src/services/AutoProvisioningService');
        const service = AutoProvisioningService.getInstance();
        if (!service) throw new Error('Auto-provisioning service not available');
    });
    
    // Test 5: Package Catalog
    await runTest('Package Catalog', async () => {
        const { PACKAGE_CATALOG } = await import('./src/plugins/store/models/Order');
        if (Object.keys(PACKAGE_CATALOG).length === 0) throw new Error('No packages in catalog');
    });
    
    // Test 6: Build System
    await runTest('Build System', async () => {
        const fs = require('fs');
        const path = require('path');
        const distPath = path.join(process.cwd(), 'dist', 'index.js');
        if (!fs.existsSync(distPath)) throw new Error('Build output not found');
    });
    
    // Test 7: Environment Configuration
    await runTest('Environment Configuration', async () => {
        if (!process.env.PTERODACTYL_URL) throw new Error('PTERODACTYL_URL not configured');
        if (!process.env.PTERODACTYL_ADMIN_API_KEY) throw new Error('PTERODACTYL_ADMIN_API_KEY not configured');
    });
    
    // Test 8: File System Operations
    await runTest('File System Operations', async () => {
        const fs = require('fs');
        const path = require('path');
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(dataDir)) throw new Error('Cannot create data directory');
    });
    
    // Test 9: Package Services
    await runTest('Package Services', async () => {
        const { PackageService } = await import('./src/services/PackageService');
        const service = PackageService.getInstance();
        if (!service) throw new Error('Package service not available');
    });
    
    // Test 10: Order Services
    await runTest('Order Services', async () => {
        const { OrderService } = await import('./src/services/OrderService');
        const service = OrderService.getInstance();
        if (!service) throw new Error('Order service not available');
    });
    
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All tests passed! System is fully functional.');
    } else {
        console.log('\n⚠️  Some tests failed. System may have issues.');
    }
    
    const successRate = (passedTests / totalTests) * 100;
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
}

// Run the test
testComprehensiveSystem().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
});