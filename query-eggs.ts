#!/usr/bin/env bun
import { PterodactylAdminAPI } from './src/services/PterodactylAdminAPI';
import { Logger } from './src/utils/logger';

// Set environment variables
process.env.PTERODACTYL_URL = 'https://panel.roidev.my.id';
process.env.PTERODACTYL_ADMIN_API_KEY = 'ptla_suW1wqLztnQUv7IRUnr9B395MQ7YFTcTmeHI4ThqiXv';

interface PterodactylEgg {
    id: number;
    uuid: string;
    name: string;
    description: string;
    docker_image: string;
    startup: string;
    nest: number;
    script: {
        privileged: boolean;
        install: string;
        entry: string;
        container: string;
        extends: string | null;
    };
    config: {
        files: Record<string, any>;
        startup: Record<string, any>;
        stop: string;
        logs: Record<string, any>;
        file_denylist: string[];
    };
    created_at: string;
    updated_at: string;
}

async function queryAvailableEggs() {
    console.log('🔍 Querying Available Eggs from Pterodactyl Panel...\n');
    
    try {
        const adminAPI = new PterodactylAdminAPI();
        
        // Check connection first
        const isHealthy = await adminAPI.healthCheck();
        if (!isHealthy) {
            console.log('❌ Cannot connect to Pterodactyl Admin API');
            return;
        }
        
        console.log('✅ Connected to Pterodactyl Admin API\n');
        
        // Get all nests first
        console.log('📋 Fetching available nests...');
        const nestsResponse = await adminAPI.client.get('/nests');
        const nests = nestsResponse.data.data;
        
        console.log(`Found ${nests.length} nests:\n`);
        
        for (const nestData of nests) {
            const nest = nestData.attributes;
            console.log(`🗂️  Nest: ${nest.name} (ID: ${nest.id})`);
            console.log(`   Description: ${nest.description}`);
            
            // Get eggs for this nest
            try {
                const eggsResponse = await adminAPI.client.get(`/nests/${nest.id}/eggs`);
                const eggs = eggsResponse.data.data;
                
                console.log(`   📦 Found ${eggs.length} eggs:`);
                
                for (const eggData of eggs) {
                    const egg: PterodactylEgg = eggData.attributes;
                    console.log(`      • ${egg.name} (ID: ${egg.id})`);
                    console.log(`        Description: ${egg.description}`);
                    console.log(`        Docker Image: ${egg.docker_image}`);
                    console.log(`        Startup: ${egg.startup}`);
                    console.log('');
                }
            } catch (error) {
                console.log(`   ❌ Failed to get eggs for nest ${nest.name}`);
            }
            
            console.log('');
        }
        
        // Look for specific eggs we need
        console.log('🔍 Searching for specific eggs...\n');
        
        const targetEggs = [
            { search: ['nodejs', 'node.js', 'node', 'vip'], type: 'Node.js VIP' },
            { search: ['vps', 'ubuntu', 'debian', 'linux'], type: 'VPS' },
            { search: ['python', 'py'], type: 'Python' }
        ];
        
        for (const target of targetEggs) {
            console.log(`🔍 Looking for ${target.type} eggs...`);
            
            for (const nestData of nests) {
                const nest = nestData.attributes;
                
                try {
                    const eggsResponse = await adminAPI.client.get(`/nests/${nest.id}/eggs`);
                    const eggs = eggsResponse.data.data;
                    
                    for (const eggData of eggs) {
                        const egg: PterodactylEgg = eggData.attributes;
                        const eggNameLower = egg.name.toLowerCase();
                        const eggDescLower = egg.description.toLowerCase();
                        
                        const matches = target.search.some(keyword => 
                            eggNameLower.includes(keyword) || eggDescLower.includes(keyword)
                        );
                        
                        if (matches) {
                            console.log(`   ✅ Found: ${egg.name} (ID: ${egg.id})`);
                            console.log(`      Nest: ${nest.name}`);
                            console.log(`      Docker Image: ${egg.docker_image}`);
                            console.log(`      Description: ${egg.description}`);
                            console.log('');
                        }
                    }
                } catch (error) {
                    // Skip if can't access eggs
                }
            }
        }
        
        // Generate configuration recommendations
        console.log('📝 Configuration Recommendations:\n');
        console.log('Based on the available eggs, update your .env file with:');
        console.log('');
        console.log('# Replace these egg IDs with the actual IDs from above');
        console.log('# Example configuration:');
        console.log('DEFAULT_NODEJS_VIP_EGG_ID=1  # Replace with actual Node.js VIP egg ID');
        console.log('DEFAULT_VPS_EGG_ID=2         # Replace with actual VPS egg ID');
        console.log('DEFAULT_PYTHON_EGG_ID=3      # Replace with actual Python egg ID');
        console.log('');
        console.log('# Package-specific egg assignments:');
        console.log('BRONZE_EGG_ID=1              # Assign appropriate egg for Bronze package');
        console.log('SILVER_EGG_ID=2              # Assign appropriate egg for Silver package');
        console.log('GOLD_EGG_ID=3                # Assign appropriate egg for Gold package');
        console.log('PLATINUM_EGG_ID=1            # Assign appropriate egg for Platinum package');
        console.log('DIAMOND_EGG_ID=2             # Assign appropriate egg for Diamond package');
        
    } catch (error) {
        console.error('💥 Failed to query eggs:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the query
queryAvailableEggs().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
});