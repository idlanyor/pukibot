#!/usr/bin/env ts-node

import { OrderManager } from './src/plugins/store/OrderManager';

async function testKatalogDisplay() {
    console.log('🧪 Testing Katalog Display with New Naming System...\n');
    
    const orderManager = new OrderManager();
    
    try {
        const packages = await orderManager.getAllPackages();
        console.log(`📦 Total packages loaded: ${Object.keys(packages).length}\n`);
        
        // Group packages by egg type using new naming
        const nodeJSPackages = Object.values(packages).filter(pkg => 
            pkg.type.toString().startsWith('a') && pkg.type.toString().length === 2
        );
        const vpsPackages = Object.values(packages).filter(pkg => 
            pkg.type.toString().startsWith('b') && pkg.type.toString().length === 2
        );
        const pythonPackages = Object.values(packages).filter(pkg => 
            pkg.type.toString().startsWith('c') && pkg.type.toString().length === 2
        );
        
        console.log('📋 Package Distribution:');
        console.log(`   NodeJS VIP (A1-A6): ${nodeJSPackages.length} packages`);
        console.log(`   VPS (B1-B6): ${vpsPackages.length} packages`);
        console.log(`   Python (C1-C6): ${pythonPackages.length} packages\n`);
        
        // Simulate katalog display
        let katalogText = `🛒 *Pterodactyl Store*\n\n`;
        
        // NodeJS VIP Packages (A1-A6)
        katalogText += `🟢 *NodeJS VIP (A1-A6)*\n`;
        nodeJSPackages.forEach(pkg => {
            katalogText += `${pkg.emoji} *${pkg.name}* - ${pkg.ram}, ${pkg.cpu}\n` +
                          `   IDR ${pkg.price.toLocaleString('id-ID')}/bulan\n\n`;
        });
        
        // VPS Packages (B1-B6)
        katalogText += `🔧 *VPS (B1-B6)*\n`;
        vpsPackages.forEach(pkg => {
            katalogText += `${pkg.emoji} *${pkg.name}* - ${pkg.ram}, ${pkg.cpu}\n` +
                          `   IDR ${pkg.price.toLocaleString('id-ID')}/bulan\n\n`;
        });
        
        // Python Packages (C1-C6)
        katalogText += `🐍 *Python (C1-C6)*\n`;
        pythonPackages.forEach(pkg => {
            katalogText += `${pkg.emoji} *${pkg.name}* - ${pkg.ram}, ${pkg.cpu}\n` +
                          `   IDR ${pkg.price.toLocaleString('id-ID')}/bulan\n\n`;
        });
        
        katalogText += `📝 *Cara Order:*\n` +
                      `• .order [kode] [durasi]\n` +
                      `• Contoh: .order a1 1 (NodeJS Kroco 1 bulan)\n` +
                      `• Contoh: .order b3 3 (VPS Standar 3 bulan)\n` +
                      `• Contoh: .order c6 12 (Python Pro Max 12 bulan)\n\n` +
                      `📊 *Cek Status:*\n` +
                      `• .order-status [order-id]\n` +
                      `• .my-orders\n\n` +
                      `💬 *Info:* wa.me/admin`;
        
        console.log('📱 Katalog Display Preview:');
        console.log('=' .repeat(50));
        console.log(katalogText);
        console.log('=' .repeat(50));
        
        // Test specific package lookups
        console.log('\n🔍 Testing Package Lookups:');
        const testCodes = ['a1', 'b3', 'c6'];
        
        for (const code of testCodes) {
            const pkg = packages[code];
            if (pkg) {
                console.log(`✅ ${code.toUpperCase()}: ${pkg.name} - ${pkg.ram}, ${pkg.cpu} - IDR ${pkg.price.toLocaleString('id-ID')}/bulan`);
            } else {
                console.log(`❌ ${code.toUpperCase()}: Package not found`);
            }
        }
        
        console.log('\n✅ Katalog display test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing katalog display:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    testKatalogDisplay();
}