#!/usr/bin/env bun

import { config } from 'dotenv';
import { DatabaseMigrationService } from './src/services/DatabaseMigrationService';
import { Logger } from './src/utils/logger';

// Load environment variables
config();

async function runMigration() {
    console.log('🔄 Starting database migration from SQLite to MySQL...\n');

    try {
        const migrationService = new DatabaseMigrationService();

        // Run the migration
        await migrationService.migrateData();

        console.log('\n🔍 Verifying migration...');
        const isValid = await migrationService.verifyMigration();

        if (isValid) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('✅ All data has been migrated from SQLite to MySQL');
            console.log('\n📝 Next steps:');
            console.log('1. Update your application to use PrismaDatabaseManager');
            console.log('2. Remove SQLite dependencies if no longer needed');
            console.log('3. Test all application features with MySQL');
        } else {
            console.log('\n❌ Migration verification failed!');
            console.log('Please check the logs for details');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
runMigration().catch(error => {
    console.error('💥 Unexpected error during migration:', error);
    process.exit(1);
});