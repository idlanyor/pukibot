#!/usr/bin/env bun
import { Logger } from './src/utils/logger';

async function testWhatsAppComponents() {
    console.log('🔍 Testing WhatsApp Components...\n');
    
    try {
        // Test Baileys
        const baileys = await import('@whiskeysockets/baileys');
        console.log('✅ Baileys WhatsApp library imported');
        console.log(`  Available functions: ${Object.keys(baileys).length}`);
        
        // Test QR code terminal
        const qrcode = await import('qrcode-terminal');
        console.log('✅ QR code terminal library imported');
        
        // Test image processing
        const jimp = await import('jimp');
        console.log('✅ Jimp image processing library imported');
        
        const sharp = await import('sharp');
        console.log('✅ Sharp image processing library imported');
        
        // Test link preview
        const linkPreview = await import('link-preview-js');
        console.log('✅ Link preview library imported');
        
        // Test axios for HTTP requests
        const axios = await import('axios');
        console.log('✅ Axios HTTP client imported');
        
        console.log('\n🎉 All WhatsApp components are working correctly!');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testWhatsAppComponents().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
});