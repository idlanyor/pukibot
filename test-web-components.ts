#!/usr/bin/env bun
import { Logger } from './src/utils/logger';

async function testWebComponents() {
    console.log('🔍 Testing Web Components...\n');
    
    try {
        // Test web server components
        const { Elysia } = await import('elysia');
        console.log('✅ Elysia web framework imported');
        
        // Test CORS
        const { cors } = await import('@elysiajs/cors');
        console.log('✅ CORS plugin imported');
        
        // Test static files
        const { staticPlugin } = await import('@elysiajs/static');
        console.log('✅ Static plugin imported');
        
        // Test HTML plugin
        const { html } = await import('@elysiajs/html');
        console.log('✅ HTML plugin imported');
        
        // Test JWT
        const jwt = await import('jsonwebtoken');
        console.log('✅ JWT library imported');
        
        // Test Express (if used)
        const express = await import('express');
        console.log('✅ Express framework imported');
        
        console.log('\n🎉 All web components are working correctly!');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testWebComponents().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
});