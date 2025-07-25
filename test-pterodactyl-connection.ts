#!/usr/bin/env bun
import { PterodactylAPI } from './src/services/pterodactylAPI';
import { PterodactylAdminAPI } from './src/services/PterodactylAdminAPI';
import { Logger } from './src/utils/logger';

// Set environment variables for testing
process.env.PTERODACTYL_URL = 'https://panel.roidev.my.id';
process.env.PTERODACTYL_API_KEY = 'ptlc_dcJSBqaeCSKDAv1BnMyCGUnUzsYnq5YYziIc2l5R1ba';
process.env.PTERODACTYL_ADMIN_API_KEY = 'ptla_suW1wqLztnQUv7IRUnr9B395MQ7YFTcTmeHI4ThqiXv';

async function testPterodactylConnection() {
    console.log('🔍 Testing Pterodactyl Panel Connection...\n');
    
    // Test configuration
    console.log('📋 Configuration:');
    console.log(`   Panel URL: ${process.env.PTERODACTYL_URL}`);
    console.log(`   Client API Key: ${process.env.PTERODACTYL_API_KEY?.substring(0, 10)}...`);
    console.log(`   Admin API Key: ${process.env.PTERODACTYL_ADMIN_API_KEY?.substring(0, 10)}...`);
    console.log('');

    let clientApiStatus = false;
    let adminApiStatus = false;
    
    // Test Client API
    console.log('🔧 Testing Client API Connection...');
    try {
        const clientAPI = new PterodactylAPI();
        
        if (!clientAPI.isConfigured()) {
            console.log('❌ Client API not configured properly');
        } else {
            clientApiStatus = await clientAPI.healthCheck();
            if (clientApiStatus) {
                console.log('✅ Client API connection successful');
                
                // Try to list servers
                try {
                    const servers = await clientAPI.listServers();
                    console.log(`📊 Found ${servers.length} servers accessible with client API`);
                    
                    if (servers.length > 0) {
                        console.log('📋 Available servers:');
                        servers.forEach(server => {
                            console.log(`   - ${server.attributes.name} (${server.attributes.identifier}) - Status: ${server.attributes.status}`);
                        });
                    }
                } catch (error) {
                    console.log('⚠️ Could not list servers (this might be normal if no servers are accessible)');
                }
            } else {
                console.log('❌ Client API connection failed');
            }
        }
    } catch (error) {
        console.log('❌ Client API test failed:', error.message);
    }
    
    console.log('');
    
    // Test Admin API
    console.log('🔧 Testing Admin API Connection...');
    try {
        const adminAPI = new PterodactylAdminAPI();
        
        if (!adminAPI.isConfigured()) {
            console.log('❌ Admin API not configured properly');
        } else {
            adminApiStatus = await adminAPI.healthCheck();
            if (adminApiStatus) {
                console.log('✅ Admin API connection successful');
                
                // Try to get server stats
                try {
                    const stats = await adminAPI.getServerStats();
                    console.log('📊 Server Statistics:');
                    console.log(`   - Total servers: ${stats.total_servers}`);
                    console.log(`   - Active servers: ${stats.active_servers}`);
                    console.log(`   - Suspended servers: ${stats.suspended_servers}`);
                } catch (error) {
                    console.log('⚠️ Could not retrieve server statistics');
                }
                
                // Try to get nodes
                try {
                    const nodes = await adminAPI.getNodes();
                    console.log(`🖥️ Found ${nodes.length} nodes:`);
                    nodes.forEach(node => {
                        console.log(`   - ${node.name} (${node.fqdn}) - Memory: ${node.memory}MB, Disk: ${node.disk}MB`);
                    });
                } catch (error) {
                    console.log('⚠️ Could not retrieve nodes information');
                }
            } else {
                console.log('❌ Admin API connection failed');
            }
        }
    } catch (error) {
        console.log('❌ Admin API test failed:', error.message);
    }
    
    console.log('');
    
    // Summary
    console.log('📋 Connection Test Summary:');
    console.log(`   Client API: ${clientApiStatus ? '✅ Connected' : '❌ Failed'}`);
    console.log(`   Admin API: ${adminApiStatus ? '✅ Connected' : '❌ Failed'}`);
    
    if (clientApiStatus && adminApiStatus) {
        console.log('\n🎉 All connections successful! Panel is ready for use.');
    } else if (clientApiStatus || adminApiStatus) {
        console.log('\n⚠️ Partial connection success. Check the failed API configuration.');
    } else {
        console.log('\n❌ All connections failed. Please check:');
        console.log('   1. Panel URL is correct and accessible');
        console.log('   2. API keys are valid and have proper permissions');
        console.log('   3. Network connectivity to the panel');
    }
}

// Run the test
testPterodactylConnection().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
});