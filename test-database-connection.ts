#!/usr/bin/env bun
import { DatabaseManager } from './src/services/DatabaseManager';
import { Logger } from './src/utils/logger';
import * as path from 'path';

async function testDatabaseConnection() {
    console.log('🔍 Testing Database Connection...\n');
    
    try {
        // Initialize database with configuration
        const dbManager = DatabaseManager.getInstance({
            filename: path.join(process.cwd(), 'data', 'pukibot.db'),
            options: {
                verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
            }
        });
        
        await dbManager.initialize();
        console.log('✅ Database initialized successfully');
        
        // Test health check
        const isHealthy = await dbManager.healthCheck();
        console.log(`✅ Database health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
        
        // Test query execution
        const result = await dbManager.query('SELECT 1 as test');
        console.log('✅ Test query executed successfully:', result);
        
    } catch (error) {
        console.error('💥 Database test failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testDatabaseConnection().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
});