import { WhatsAppMessageHandler } from './src/handlers/WhatsAppMessageHandler';
import { Logger } from './src/utils/logger';
import { PrismaDatabaseManager } from './src/services/PrismaDatabaseManager';

async function testWhatsAppHandler() {
    try {
        console.log('🧪 Testing WhatsApp Message Handler...\n');
        
        // Initialize database manager first
        console.log('🔧 Initializing database manager...');
        const dbManager = PrismaDatabaseManager.getInstance();
        await dbManager.initialize();
        console.log('✅ Database manager initialized\n');
        
        const handler = new WhatsAppMessageHandler();
        
        // Test catalog command
        console.log('📋 Testing catalog command...');
        const catalogResponse = await handler.handleMessage('katalog', '628123456789@s.whatsapp.net');
        console.log('✅ Catalog response:', catalogResponse.substring(0, 200) + '...\n');
        
        // Test package detail command
        console.log('📦 Testing package detail command...');
        const packageResponse = await handler.handleMessage('paket A1', '628123456789@s.whatsapp.net');
        console.log('✅ Package detail response:', packageResponse.substring(0, 200) + '...\n');
        
        // Test help command
        console.log('❓ Testing help command...');
        const helpResponse = await handler.handleMessage('help', '628123456789@s.whatsapp.net');
        console.log('✅ Help response:', helpResponse.substring(0, 200) + '...\n');
        
        // Test search command
        console.log('🔍 Testing search command...');
        const searchResponse = await handler.handleMessage('cari nodejs', '628123456789@s.whatsapp.net');
        console.log('✅ Search response:', searchResponse.substring(0, 200) + '...\n');
        
        // Test category command
        console.log('🟢 Testing category command...');
        const categoryResponse = await handler.handleMessage('nodejs', '628123456789@s.whatsapp.net');
        console.log('✅ Category response:', categoryResponse.substring(0, 200) + '...\n');
        
        // Test unknown command
        console.log('❓ Testing unknown command...');
        const unknownResponse = await handler.handleMessage('unknown', '628123456789@s.whatsapp.net');
        console.log('✅ Unknown command response:', unknownResponse.substring(0, 200) + '...\n');
        
        console.log('🎉 All tests completed successfully!');
        
    } catch (error) {
        Logger.error('❌ Test failed:', error);
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testWhatsAppHandler().catch(console.error);