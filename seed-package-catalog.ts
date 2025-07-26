#!/usr/bin/env bun

import { config } from 'dotenv';
import { PrismaDatabaseManager } from './src/services/PrismaDatabaseManager';
import { Logger } from './src/utils/logger';

// Load environment variables
config();

// Package catalog data
const packageCatalog = [
    // A-tier packages (NodeJS)
    {
        type: 'A1',
        name: 'NodeJS A1 - Starter',
        ram: '1GB',
        cpu: '50%',
        storage: '5GB',
        bandwidth: 'Unlimited',
        price: 5000,
        emoji: '🟢',
        description: 'Perfect for small Node.js applications and learning',
        category: 'nodejs',
        eggId: 15,
        dockerImage: 'ghcr.io/shirokamiryzen/yolks:nodejs_22',
        startupCommand: 'if [[ -d .git ]] && [[ "{{AUTO_UPDATE}}" == "1" ]]; then git remote set-url origin https://${USERNAME}:${ACCESS_TOKEN}@${GIT_ADDRESS} && git pull; fi; /usr/local/bin/npm install && /usr/local/bin/node --max-old-space-size=${SERVER_MEMORY} "/home/container/${MAIN_FILE}"',
        environment: JSON.stringify({
            MAIN_FILE: 'index.js',
            AUTO_UPDATE: '0',
            GIT_ADDRESS: '',
            USERNAME: '',
            ACCESS_TOKEN: '',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 1024,
            swap: 0,
            disk: 5120,
            io: 500,
            cpu: 50
        }),
        featureLimits: JSON.stringify({
            databases: 1,
            allocations: 1,
            backups: 1
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'A2',
        name: 'NodeJS A2 - Basic',
        ram: '2GB',
        cpu: '75%',
        storage: '10GB',
        bandwidth: 'Unlimited',
        price: 8000,
        emoji: '🟢',
        description: 'Ideal for medium Node.js projects',
        category: 'nodejs',
        eggId: 15,
        dockerImage: 'ghcr.io/shirokamiryzen/yolks:nodejs_22',
        startupCommand: 'if [[ -d .git ]] && [[ "{{AUTO_UPDATE}}" == "1" ]]; then git remote set-url origin https://${USERNAME}:${ACCESS_TOKEN}@${GIT_ADDRESS} && git pull; fi; /usr/local/bin/npm install && /usr/local/bin/node --max-old-space-size=${SERVER_MEMORY} "/home/container/${MAIN_FILE}"',
        environment: JSON.stringify({
            MAIN_FILE: 'index.js',
            AUTO_UPDATE: '0',
            GIT_ADDRESS: '',
            USERNAME: '',
            ACCESS_TOKEN: '',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 2048,
            swap: 0,
            disk: 10240,
            io: 500,
            cpu: 75
        }),
        featureLimits: JSON.stringify({
            databases: 2,
            allocations: 2,
            backups: 2
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'A3',
        name: 'NodeJS A3 - Standard',
        ram: '3GB',
        cpu: '100%',
        storage: '15GB',
        bandwidth: 'Unlimited',
        price: 12000,
        emoji: '🟢',
        description: 'Great for production Node.js applications',
        category: 'nodejs',
        eggId: 15,
        dockerImage: 'ghcr.io/shirokamiryzen/yolks:nodejs_22',
        startupCommand: 'if [[ -d .git ]] && [[ "{{AUTO_UPDATE}}" == "1" ]]; then git remote set-url origin https://${USERNAME}:${ACCESS_TOKEN}@${GIT_ADDRESS} && git pull; fi; /usr/local/bin/npm install && /usr/local/bin/node --max-old-space-size=${SERVER_MEMORY} "/home/container/${MAIN_FILE}"',
        environment: JSON.stringify({
            MAIN_FILE: 'index.js',
            AUTO_UPDATE: '0',
            GIT_ADDRESS: '',
            USERNAME: '',
            ACCESS_TOKEN: '',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 3072,
            swap: 0,
            disk: 15360,
            io: 500,
            cpu: 100
        }),
        featureLimits: JSON.stringify({
            databases: 3,
            allocations: 3,
            backups: 3
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'A4',
        name: 'NodeJS A4 - Professional',
        ram: '4GB',
        cpu: '125%',
        storage: '20GB',
        bandwidth: 'Unlimited',
        price: 16000,
        emoji: '🟢',
        description: 'Professional Node.js hosting solution',
        category: 'nodejs',
        eggId: 15,
        dockerImage: 'ghcr.io/shirokamiryzen/yolks:nodejs_22',
        startupCommand: 'if [[ -d .git ]] && [[ "{{AUTO_UPDATE}}" == "1" ]]; then git remote set-url origin https://${USERNAME}:${ACCESS_TOKEN}@${GIT_ADDRESS} && git pull; fi; /usr/local/bin/npm install && /usr/local/bin/node --max-old-space-size=${SERVER_MEMORY} "/home/container/${MAIN_FILE}"',
        environment: JSON.stringify({
            MAIN_FILE: 'index.js',
            AUTO_UPDATE: '0',
            GIT_ADDRESS: '',
            USERNAME: '',
            ACCESS_TOKEN: '',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 4096,
            swap: 0,
            disk: 20480,
            io: 500,
            cpu: 125
        }),
        featureLimits: JSON.stringify({
            databases: 4,
            allocations: 4,
            backups: 4
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'A5',
        name: 'NodeJS A5 - Premium',
        ram: '6GB',
        cpu: '150%',
        storage: '30GB',
        bandwidth: 'Unlimited',
        price: 22000,
        emoji: '🟢',
        description: 'Premium Node.js hosting with high performance',
        category: 'nodejs',
        eggId: 15,
        dockerImage: 'ghcr.io/shirokamiryzen/yolks:nodejs_22',
        startupCommand: 'if [[ -d .git ]] && [[ "{{AUTO_UPDATE}}" == "1" ]]; then git remote set-url origin https://${USERNAME}:${ACCESS_TOKEN}@${GIT_ADDRESS} && git pull; fi; /usr/local/bin/npm install && /usr/local/bin/node --max-old-space-size=${SERVER_MEMORY} "/home/container/${MAIN_FILE}"',
        environment: JSON.stringify({
            MAIN_FILE: 'index.js',
            AUTO_UPDATE: '0',
            GIT_ADDRESS: '',
            USERNAME: '',
            ACCESS_TOKEN: '',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 6144,
            swap: 0,
            disk: 30720,
            io: 500,
            cpu: 150
        }),
        featureLimits: JSON.stringify({
            databases: 5,
            allocations: 5,
            backups: 5
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'A6',
        name: 'NodeJS A6 - Enterprise',
        ram: '8GB',
        cpu: '200%',
        storage: '40GB',
        bandwidth: 'Unlimited',
        price: 30000,
        emoji: '🟢',
        description: 'Enterprise-grade Node.js hosting solution',
        category: 'nodejs',
        eggId: 15,
        dockerImage: 'ghcr.io/shirokamiryzen/yolks:nodejs_22',
        startupCommand: 'if [[ -d .git ]] && [[ "{{AUTO_UPDATE}}" == "1" ]]; then git remote set-url origin https://${USERNAME}:${ACCESS_TOKEN}@${GIT_ADDRESS} && git pull; fi; /usr/local/bin/npm install && /usr/local/bin/node --max-old-space-size=${SERVER_MEMORY} "/home/container/${MAIN_FILE}"',
        environment: JSON.stringify({
            MAIN_FILE: 'index.js',
            AUTO_UPDATE: '0',
            GIT_ADDRESS: '',
            USERNAME: '',
            ACCESS_TOKEN: '',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 8192,
            swap: 0,
            disk: 40960,
            io: 500,
            cpu: 200
        }),
        featureLimits: JSON.stringify({
            databases: 6,
            allocations: 6,
            backups: 6
        }),
        nodeId: 1,
        active: true
    },

    // B-tier packages (VPS)
    {
        type: 'B1',
        name: 'VPS B1 - Starter',
        ram: '1GB',
        cpu: '50%',
        storage: '10GB',
        bandwidth: 'Unlimited',
        price: 8000,
        emoji: '🔵',
        description: 'Basic VPS hosting for small projects',
        category: 'vps',
        eggId: 16,
        dockerImage: 'quay.io/ydrag0n/pterodactyl-vps-egg',
        startupCommand: 'bash /run.sh',
        environment: JSON.stringify({
            VPS_USER: 'container',
            VPS_PASSWORD: 'password123',
            VPS_SSH_PORT: '22',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 1024,
            swap: 0,
            disk: 10240,
            io: 500,
            cpu: 50
        }),
        featureLimits: JSON.stringify({
            databases: 2,
            allocations: 2,
            backups: 2
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'B2',
        name: 'VPS B2 - Basic',
        ram: '2GB',
        cpu: '75%',
        storage: '20GB',
        bandwidth: 'Unlimited',
        price: 15000,
        emoji: '🔵',
        description: 'Standard VPS hosting with more resources',
        category: 'vps',
        eggId: 16,
        dockerImage: 'quay.io/ydrag0n/pterodactyl-vps-egg',
        startupCommand: 'bash /run.sh',
        environment: JSON.stringify({
            VPS_USER: 'container',
            VPS_PASSWORD: 'password123',
            VPS_SSH_PORT: '22',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 2048,
            swap: 0,
            disk: 20480,
            io: 500,
            cpu: 75
        }),
        featureLimits: JSON.stringify({
            databases: 3,
            allocations: 3,
            backups: 3
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'B3',
        name: 'VPS B3 - Standard',
        ram: '4GB',
        cpu: '100%',
        storage: '30GB',
        bandwidth: 'Unlimited',
        price: 25000,
        emoji: '🔵',
        description: 'Professional VPS hosting solution',
        category: 'vps',
        eggId: 16,
        dockerImage: 'quay.io/ydrag0n/pterodactyl-vps-egg',
        startupCommand: 'bash /run.sh',
        environment: JSON.stringify({
            VPS_USER: 'container',
            VPS_PASSWORD: 'password123',
            VPS_SSH_PORT: '22',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 4096,
            swap: 0,
            disk: 30720,
            io: 500,
            cpu: 100
        }),
        featureLimits: JSON.stringify({
            databases: 4,
            allocations: 4,
            backups: 4
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'B4',
        name: 'VPS B4 - Professional',
        ram: '6GB',
        cpu: '150%',
        storage: '50GB',
        bandwidth: 'Unlimited',
        price: 35000,
        emoji: '🔵',
        description: 'High-performance VPS hosting',
        category: 'vps',
        eggId: 16,
        dockerImage: 'quay.io/ydrag0n/pterodactyl-vps-egg',
        startupCommand: 'bash /run.sh',
        environment: JSON.stringify({
            VPS_USER: 'container',
            VPS_PASSWORD: 'password123',
            VPS_SSH_PORT: '22',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 6144,
            swap: 0,
            disk: 51200,
            io: 500,
            cpu: 150
        }),
        featureLimits: JSON.stringify({
            databases: 5,
            allocations: 5,
            backups: 5
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'B5',
        name: 'VPS B5 - Premium',
        ram: '8GB',
        cpu: '200%',
        storage: '80GB',
        bandwidth: 'Unlimited',
        price: 50000,
        emoji: '🔵',
        description: 'Premium VPS hosting with maximum performance',
        category: 'vps',
        eggId: 16,
        dockerImage: 'quay.io/ydrag0n/pterodactyl-vps-egg',
        startupCommand: 'bash /run.sh',
        environment: JSON.stringify({
            VPS_USER: 'container',
            VPS_PASSWORD: 'password123',
            VPS_SSH_PORT: '22',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 8192,
            swap: 0,
            disk: 81920,
            io: 500,
            cpu: 200
        }),
        featureLimits: JSON.stringify({
            databases: 6,
            allocations: 6,
            backups: 6
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'B6',
        name: 'VPS B6 - Enterprise',
        ram: '12GB',
        cpu: '300%',
        storage: '120GB',
        bandwidth: 'Unlimited',
        price: 75000,
        emoji: '🔵',
        description: 'Enterprise VPS hosting for demanding applications',
        category: 'vps',
        eggId: 16,
        dockerImage: 'quay.io/ydrag0n/pterodactyl-vps-egg',
        startupCommand: 'bash /run.sh',
        environment: JSON.stringify({
            VPS_USER: 'container',
            VPS_PASSWORD: 'password123',
            VPS_SSH_PORT: '22',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 12288,
            swap: 0,
            disk: 122880,
            io: 500,
            cpu: 300
        }),
        featureLimits: JSON.stringify({
            databases: 8,
            allocations: 8,
            backups: 8
        }),
        nodeId: 1,
        active: true
    },

    // C-tier packages (Python)
    {
        type: 'C1',
        name: 'Python C1 - Starter',
        ram: '1GB',
        cpu: '50%',
        storage: '5GB',
        bandwidth: 'Unlimited',
        price: 6000,
        emoji: '🟡',
        description: 'Perfect for Python learning and small projects',
        category: 'python',
        eggId: 17,
        dockerImage: 'ghcr.io/parkervcp/yolks:python_3.12',
        startupCommand: 'if [[ -f /home/container/${PY_FILE} ]]; then python /home/container/${PY_FILE}; else echo "Python file not found!"; fi',
        environment: JSON.stringify({
            PY_FILE: 'main.py',
            AUTO_UPDATE: '0',
            PY_PACKAGES: '',
            REQUIREMENTS_FILE: 'requirements.txt',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 1024,
            swap: 0,
            disk: 5120,
            io: 500,
            cpu: 50
        }),
        featureLimits: JSON.stringify({
            databases: 1,
            allocations: 1,
            backups: 1
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'C2',
        name: 'Python C2 - Basic',
        ram: '2GB',
        cpu: '75%',
        storage: '10GB',
        bandwidth: 'Unlimited',
        price: 10000,
        emoji: '🟡',
        description: 'Great for Python web applications and APIs',
        category: 'python',
        eggId: 17,
        dockerImage: 'ghcr.io/parkervcp/yolks:python_3.12',
        startupCommand: 'if [[ -f /home/container/${PY_FILE} ]]; then python /home/container/${PY_FILE}; else echo "Python file not found!"; fi',
        environment: JSON.stringify({
            PY_FILE: 'main.py',
            AUTO_UPDATE: '0',
            PY_PACKAGES: '',
            REQUIREMENTS_FILE: 'requirements.txt',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 2048,
            swap: 0,
            disk: 10240,
            io: 500,
            cpu: 75
        }),
        featureLimits: JSON.stringify({
            databases: 2,
            allocations: 2,
            backups: 2
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'C3',
        name: 'Python C3 - Standard',
        ram: '3GB',
        cpu: '100%',
        storage: '15GB',
        bandwidth: 'Unlimited',
        price: 14000,
        emoji: '🟡',
        description: 'Standard Python hosting for production apps',
        category: 'python',
        eggId: 17,
        dockerImage: 'ghcr.io/parkervcp/yolks:python_3.12',
        startupCommand: 'if [[ -f /home/container/${PY_FILE} ]]; then python /home/container/${PY_FILE}; else echo "Python file not found!"; fi',
        environment: JSON.stringify({
            PY_FILE: 'main.py',
            AUTO_UPDATE: '0',
            PY_PACKAGES: '',
            REQUIREMENTS_FILE: 'requirements.txt',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 3072,
            swap: 0,
            disk: 15360,
            io: 500,
            cpu: 100
        }),
        featureLimits: JSON.stringify({
            databases: 3,
            allocations: 3,
            backups: 3
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'C4',
        name: 'Python C4 - Professional',
        ram: '4GB',
        cpu: '125%',
        storage: '20GB',
        bandwidth: 'Unlimited',
        price: 18000,
        emoji: '🟡',
        description: 'Professional Python hosting solution',
        category: 'python',
        eggId: 17,
        dockerImage: 'ghcr.io/parkervcp/yolks:python_3.12',
        startupCommand: 'if [[ -f /home/container/${PY_FILE} ]]; then python /home/container/${PY_FILE}; else echo "Python file not found!"; fi',
        environment: JSON.stringify({
            PY_FILE: 'main.py',
            AUTO_UPDATE: '0',
            PY_PACKAGES: '',
            REQUIREMENTS_FILE: 'requirements.txt',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 4096,
            swap: 0,
            disk: 20480,
            io: 500,
            cpu: 125
        }),
        featureLimits: JSON.stringify({
            databases: 4,
            allocations: 4,
            backups: 4
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'C5',
        name: 'Python C5 - Premium',
        ram: '6GB',
        cpu: '150%',
        storage: '30GB',
        bandwidth: 'Unlimited',
        price: 25000,
        emoji: '🟡',
        description: 'Premium Python hosting with high performance',
        category: 'python',
        eggId: 17,
        dockerImage: 'ghcr.io/parkervcp/yolks:python_3.12',
        startupCommand: 'if [[ -f /home/container/${PY_FILE} ]]; then python /home/container/${PY_FILE}; else echo "Python file not found!"; fi',
        environment: JSON.stringify({
            PY_FILE: 'main.py',
            AUTO_UPDATE: '0',
            PY_PACKAGES: '',
            REQUIREMENTS_FILE: 'requirements.txt',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 6144,
            swap: 0,
            disk: 30720,
            io: 500,
            cpu: 150
        }),
        featureLimits: JSON.stringify({
            databases: 5,
            allocations: 5,
            backups: 5
        }),
        nodeId: 1,
        active: true
    },
    {
        type: 'C6',
        name: 'Python C6 - Enterprise',
        ram: '8GB',
        cpu: '200%',
        storage: '40GB',
        bandwidth: 'Unlimited',
        price: 35000,
        emoji: '🟡',
        description: 'Enterprise Python hosting for complex applications',
        category: 'python',
        eggId: 17,
        dockerImage: 'ghcr.io/parkervcp/yolks:python_3.12',
        startupCommand: 'if [[ -f /home/container/${PY_FILE} ]]; then python /home/container/${PY_FILE}; else echo "Python file not found!"; fi',
        environment: JSON.stringify({
            PY_FILE: 'main.py',
            AUTO_UPDATE: '0',
            PY_PACKAGES: '',
            REQUIREMENTS_FILE: 'requirements.txt',
            USER_UPLOADED_FILES: '1'
        }),
        limits: JSON.stringify({
            memory: 8192,
            swap: 0,
            disk: 40960,
            io: 500,
            cpu: 200
        }),
        featureLimits: JSON.stringify({
            databases: 6,
            allocations: 6,
            backups: 6
        }),
        nodeId: 1,
        active: true
    }
];

async function seedPackageCatalog() {
    console.log('🌱 Seeding package catalog to MySQL database...\n');

    try {
        // Initialize database manager
        const dbManager = PrismaDatabaseManager.getInstance({
            logQueries: false
        });

        await dbManager.initialize();
        console.log('✅ Database connection established');

        const prisma = dbManager.getPrisma();

        // Clear existing packages
        console.log('🔄 Clearing existing packages...');
        await prisma.package.deleteMany({});
        console.log('✅ Existing packages cleared');

        // Insert new packages
        console.log('🔄 Inserting package catalog...');
        let insertedCount = 0;

        for (const pkg of packageCatalog) {
            try {
                await prisma.package.create({
                    data: pkg
                });
                insertedCount++;
                console.log(`✅ Inserted: ${pkg.type} - ${pkg.name}`);
            } catch (error) {
                console.error(`❌ Failed to insert ${pkg.type}:`, error);
            }
        }

        console.log(`\n🎉 Package catalog seeding completed!`);
        console.log(`📊 Summary:`);
        console.log(`   Total packages: ${packageCatalog.length}`);
        console.log(`   Successfully inserted: ${insertedCount}`);
        console.log(`   Failed: ${packageCatalog.length - insertedCount}`);

        // Display statistics
        const stats = await prisma.package.groupBy({
            by: ['category'],
            _count: { category: true }
        });

        console.log(`\n📈 Package distribution:`);
        stats.forEach(stat => {
            console.log(`   ${stat.category}: ${stat._count.category} packages`);
        });

        // Display price range
        const priceStats = await prisma.package.aggregate({
            _min: { price: true },
            _max: { price: true },
            _avg: { price: true }
        });

        console.log(`\n💰 Price range:`);
        console.log(`   Min: Rp ${priceStats._min.price?.toLocaleString('id-ID')}`);
        console.log(`   Max: Rp ${priceStats._max.price?.toLocaleString('id-ID')}`);
        console.log(`   Average: Rp ${Math.round(priceStats._avg.price || 0).toLocaleString('id-ID')}`);

        // Close connection
        await dbManager.close();

    } catch (error) {
        console.error('💥 Package catalog seeding failed:', error);
        process.exit(1);
    }
}

// Run seeding
seedPackageCatalog().catch(error => {
    console.error('💥 Unexpected error during seeding:', error);
    process.exit(1);
});