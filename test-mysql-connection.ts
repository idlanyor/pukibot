#!/usr/bin/env bun

import { config } from 'dotenv';
import { PrismaDatabaseManager } from './src/services/PrismaDatabaseManager';
import { Logger } from './src/utils/logger';

// Load environment variables
config();

async function testMySQLConnection() {
    console.log('🔍 Testing MySQL Connection with Prisma...\n');

    try {
        // Initialize database manager
        const dbManager = PrismaDatabaseManager.getInstance({
            logQueries: true
        });

        console.log('🔄 Initializing Prisma client...');
        await dbManager.initialize();
        console.log('✅ Prisma client initialized successfully');

        // Test health check
        console.log('🔄 Running health check...');
        const isHealthy = await dbManager.healthCheck();
        console.log(`✅ Database health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);

        // Test basic query
        console.log('🔄 Testing basic query...');
        const prisma = dbManager.getPrisma();
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Basic query result:', result);

        // Get database stats
        console.log('🔄 Getting database stats...');
        const stats = await dbManager.getStats();
        console.log('📊 Database stats:', stats);

        // Test transaction
        console.log('🔄 Testing transaction...');
        const transactionResult = await dbManager.transaction(async (prisma) => {
            const count = await prisma.package.count();
            return { packageCount: count };
        });
        console.log('✅ Transaction result:', transactionResult);

        console.log('\n🎉 MySQL connection test completed successfully!');
        console.log('✅ Prisma is working correctly with MySQL');

        // Close connection
        await dbManager.close();

    } catch (error) {
        console.error('💥 MySQL connection test failed:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('ECONNREFUSED')) {
                console.log('\n💡 Troubleshooting tips:');
                console.log('1. Make sure MySQL server is running');
                console.log('2. Check if Docker Compose is up: docker-compose up -d database');
                console.log('3. Verify DATABASE_URL in .env file');
                console.log('4. Check MySQL credentials and database name');
            } else if (error.message.includes('Unknown database')) {
                console.log('\n💡 Database does not exist. Create it with:');
                console.log('1. Connect to MySQL: mysql -u root -p');
                console.log('2. Create database: CREATE DATABASE pterodactyl_bot;');
                console.log('3. Run migrations: bun run db:migrate');
            }
        }
        
        process.exit(1);
    }
}

// Run test
testMySQLConnection().catch(error => {
    console.error('💥 Unexpected error during MySQL test:', error);
    process.exit(1);
});