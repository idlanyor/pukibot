import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { PterodactylAPI } from '../services/pterodactylAPI.js';
import { Logger } from '../utils/logger.js';

// Command interfaces
export interface CommandContext {
    message: WAMessage;
    socket: WASocket;
    sender: string;
    chatId: string;
    isGroup: boolean;
    messageText: string;
}

export interface Command {
    name: string;
    description: string;
    usage: string;
    category: 'general' | 'store' | 'admin' | 'pterodactyl';
    adminOnly?: boolean;
    execute: (args: string[], context: CommandContext) => Promise<void>;
}

export class CommandManager {
    private commands: Map<string, Command> = new Map();
    private pterodactylAPI: PterodactylAPI;

    constructor(pterodactylAPI: PterodactylAPI) {
        this.pterodactylAPI = pterodactylAPI;
        this.registerCommands();
    }

    private registerCommands() {
        // General Commands
        this.registerCommand({
            name: 'help',
            description: 'Menampilkan daftar perintah',
            usage: '!help [kategori]',
            category: 'general',
            execute: this.helpCommand.bind(this)
        });

        this.registerCommand({
            name: 'ping',
            description: 'Cek status bot',
            usage: '!ping',
            category: 'general',
            execute: this.pingCommand.bind(this)
        });

        // Store Commands
        this.registerCommand({
            name: 'katalog',
            description: 'Menampilkan katalog produk',
            usage: '!katalog',
            category: 'store',
            execute: this.katalogCommand.bind(this)
        });

        this.registerCommand({
            name: 'harga',
            description: 'Cek harga paket server',
            usage: '!harga [paket]',
            category: 'store',
            execute: this.hargaCommand.bind(this)
        });

        this.registerCommand({
            name: 'order',
            description: 'Membuat pesanan baru',
            usage: '!order [paket] [durasi]',
            category: 'store',
            execute: this.orderCommand.bind(this)
        });

        // Pterodactyl Commands
        this.registerCommand({
            name: 'server',
            description: 'Info server pterodactyl',
            usage: '!server [server_id]',
            category: 'pterodactyl',
            execute: this.serverCommand.bind(this)
        });

        this.registerCommand({
            name: 'start',
            description: 'Menjalankan server',
            usage: '!start [server_id]',
            category: 'pterodactyl',
            execute: this.startServerCommand.bind(this)
        });

        this.registerCommand({
            name: 'stop',
            description: 'Menghentikan server',
            usage: '!stop [server_id]',
            category: 'pterodactyl',
            execute: this.stopServerCommand.bind(this)
        });

        this.registerCommand({
            name: 'restart',
            description: 'Restart server',
            usage: '!restart [server_id]',
            category: 'pterodactyl',
            execute: this.restartServerCommand.bind(this)
        });

        // Admin Commands
        this.registerCommand({
            name: 'stats',
            description: 'Statistik bot dan server',
            usage: '!stats',
            category: 'admin',
            adminOnly: true,
            execute: this.statsCommand.bind(this)
        });
    }

    registerCommand(command: Command) {
        this.commands.set(command.name, command);
    }

    async execute(commandName: string, args: string[], context: CommandContext) {
        const command = this.commands.get(commandName);
        
        if (!command) {
            await context.socket.sendMessage(context.chatId, {
                text: `❌ Perintah "${commandName}" tidak ditemukan. Ketik !help untuk melihat daftar perintah.`
            });
            return;
        }

        // Check admin permissions
        if (command.adminOnly && !this.isAdmin(context.sender)) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Perintah ini hanya untuk admin.'
            });
            return;
        }

        Logger.info(`🔧 Executing command: ${commandName} by ${context.sender}`);
        await command.execute(args, context);
    }

    private isAdmin(sender: string): boolean {
        const ownerNumber = process.env.OWNER_NUMBER;
        const adminNumber = process.env.STORE_ADMIN;
        
        const senderNumber = sender.replace('@s.whatsapp.net', '');
        
        return senderNumber === ownerNumber || senderNumber === adminNumber;
    }

    // Command implementations
    private async helpCommand(args: string[], context: CommandContext) {
        const category = args[0]?.toLowerCase();
        let helpText = `🤖 *${process.env.BOT_NAME || 'Pterodactyl Store Bot'}*\n\n`;

        if (category) {
            const filteredCommands = Array.from(this.commands.values())
                .filter(cmd => cmd.category === category);

            if (filteredCommands.length === 0) {
                helpText += `❌ Kategori "${category}" tidak ditemukan.\n\n`;
            } else {
                helpText += `📋 *Perintah kategori ${category.toUpperCase()}:*\n\n`;
                filteredCommands.forEach(cmd => {
                    helpText += `• *${cmd.usage}*\n  ${cmd.description}\n\n`;
                });
            }
        } else {
            helpText += `📋 *Kategori Perintah:*\n\n`;
            helpText += `• *general* - Perintah umum\n`;
            helpText += `• *store* - Perintah toko\n`;
            helpText += `• *pterodactyl* - Manajemen server\n`;
            helpText += `• *admin* - Perintah admin\n\n`;
            helpText += `💡 Gunakan !help [kategori] untuk melihat perintah spesifik\n`;
            helpText += `📞 Hubungi admin: wa.me/${process.env.STORE_ADMIN}`;
        }

        await context.socket.sendMessage(context.chatId, { text: helpText });
    }

    private async pingCommand(args: string[], context: CommandContext) {
        const startTime = Date.now();
        const pingMessage = await context.socket.sendMessage(context.chatId, {
            text: '🏓 Pong!'
        });
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        
        setTimeout(async () => {
            await context.socket.sendMessage(context.chatId, {
                text: `🏓 *Pong!*\n\n` +
                      `⚡ Response Time: ${responseTime}ms\n` +
                      `🕐 Server Time: ${new Date().toLocaleString('id-ID')}\n` +
                      `🚀 Runtime: Bun ${process.versions.bun}\n` +
                      `💾 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
            });
        }, 1000);
    }

    private async katalogCommand(args: string[], context: CommandContext) {
        const katalogText = `🛒 *${process.env.STORE_NAME || 'Pterodactyl Store'}*\n\n` +
                           `📦 *Paket Server Game:*\n\n` +
                           `🟢 *BRONZE* - 1GB RAM, 1 CPU\n` +
                           `   ${process.env.STORE_CURRENCY || 'IDR'} 25,000/bulan\n\n` +
                           `🟡 *SILVER* - 2GB RAM, 2 CPU\n` +
                           `   ${process.env.STORE_CURRENCY || 'IDR'} 45,000/bulan\n\n` +
                           `🟠 *GOLD* - 4GB RAM, 4 CPU\n` +
                           `   ${process.env.STORE_CURRENCY || 'IDR'} 85,000/bulan\n\n` +
                           `🔴 *PLATINUM* - 8GB RAM, 8 CPU\n` +
                           `   ${process.env.STORE_CURRENCY || 'IDR'} 160,000/bulan\n\n` +
                           `💎 *DIAMOND* - 16GB RAM, 16 CPU\n` +
                           `   ${process.env.STORE_CURRENCY || 'IDR'} 300,000/bulan\n\n` +
                           `🎮 Game Support: Minecraft, FiveM, CS:GO, Rust, dll\n\n` +
                           `📝 Untuk order: !order [paket] [durasi]\n` +
                           `💬 Info lebih lanjut: wa.me/${process.env.STORE_ADMIN}`;

        await context.socket.sendMessage(context.chatId, { text: katalogText });
    }

    private async hargaCommand(args: string[], context: CommandContext) {
        const paket = args[0]?.toLowerCase();
        
        const hargaPaket: Record<string, any> = {
            bronze: { ram: '1GB', cpu: '1 CPU', harga: 25000 },
            silver: { ram: '2GB', cpu: '2 CPU', harga: 45000 },
            gold: { ram: '4GB', cpu: '4 CPU', harga: 85000 },
            platinum: { ram: '8GB', cpu: '8 CPU', harga: 160000 },
            diamond: { ram: '16GB', cpu: '16 CPU', harga: 300000 }
        };

        if (!paket || !hargaPaket[paket]) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Paket tidak ditemukan. Paket tersedia: bronze, silver, gold, platinum, diamond'
            });
            return;
        }

        const info = hargaPaket[paket];
        const hargaText = `💰 *Harga Paket ${paket.toUpperCase()}*\n\n` +
                         `📊 Spesifikasi:\n` +
                         `• RAM: ${info.ram}\n` +
                         `• CPU: ${info.cpu}\n` +
                         `• Storage: Unlimited SSD\n` +
                         `• Bandwidth: Unlimited\n\n` +
                         `💵 Harga: ${process.env.STORE_CURRENCY || 'IDR'} ${info.harga.toLocaleString('id-ID')}/bulan\n\n` +
                         `📝 Order sekarang: !order ${paket} 1\n` +
                         `💬 Hubungi admin: wa.me/${process.env.STORE_ADMIN}`;

        await context.socket.sendMessage(context.chatId, { text: hargaText });
    }

    private async orderCommand(args: string[], context: CommandContext) {
        const paket = args[0]?.toLowerCase();
        const durasi = parseInt(args[1]) || 1;

        if (!paket) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Format salah. Gunakan: !order [paket] [durasi bulan]'
            });
            return;
        }

        const orderText = `📝 *Pesanan Baru*\n\n` +
                         `👤 Customer: @${context.sender.replace('@s.whatsapp.net', '')}\n` +
                         `📦 Paket: ${paket.toUpperCase()}\n` +
                         `⏰ Durasi: ${durasi} bulan\n` +
                         `📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n` +
                         `✅ Pesanan telah diterima!\n` +
                         `💬 Admin akan segera menghubungi Anda untuk konfirmasi pembayaran.\n\n` +
                         `📞 Admin: wa.me/${process.env.STORE_ADMIN}`;

        await context.socket.sendMessage(context.chatId, { text: orderText });

        // Notify admin
        if (process.env.STORE_ADMIN) {
            const adminNotif = `🔔 *Pesanan Baru Masuk!*\n\n` +
                              `👤 Customer: @${context.sender.replace('@s.whatsapp.net', '')}\n` +
                              `📦 Paket: ${paket.toUpperCase()}\n` +
                              `⏰ Durasi: ${durasi} bulan\n` +
                              `📱 Nomor: ${context.sender}\n` +
                              `📅 Waktu: ${new Date().toLocaleString('id-ID')}`;

            await context.socket.sendMessage(`${process.env.STORE_ADMIN}@s.whatsapp.net`, {
                text: adminNotif
            });
        }
    }

    private async serverCommand(args: string[], context: CommandContext) {
        const serverId = args[0];
        
        if (!serverId) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Format salah. Gunakan: !server [server_id]'
            });
            return;
        }

        try {
            const serverInfo = await this.pterodactylAPI.getServerInfo(serverId);
            
            const serverText = `🖥️ *Informasi Server*\n\n` +
                              `📋 ID: ${serverInfo.attributes.id}\n` +
                              `🏷️ Nama: ${serverInfo.attributes.name}\n` +
                              `🔘 Status: ${serverInfo.attributes.status}\n` +
                              `💾 RAM: ${serverInfo.attributes.limits.memory}MB\n` +
                              `⚡ CPU: ${serverInfo.attributes.limits.cpu}%\n` +
                              `💿 Disk: ${serverInfo.attributes.limits.disk}MB\n` +
                              `🌐 Node: ${serverInfo.attributes.node}`;

            await context.socket.sendMessage(context.chatId, { text: serverText });
        } catch (error) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Server tidak ditemukan atau terjadi kesalahan.'
            });
        }
    }

    private async startServerCommand(args: string[], context: CommandContext) {
        const serverId = args[0];
        
        if (!serverId) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Format salah. Gunakan: !start [server_id]'
            });
            return;
        }

        try {
            await this.pterodactylAPI.startServer(serverId);
            await context.socket.sendMessage(context.chatId, {
                text: `✅ Server ${serverId} sedang dimulai...`
            });
        } catch (error) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Gagal memulai server. Periksa server ID atau hubungi admin.'
            });
        }
    }

    private async stopServerCommand(args: string[], context: CommandContext) {
        const serverId = args[0];
        
        if (!serverId) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Format salah. Gunakan: !stop [server_id]'
            });
            return;
        }

        try {
            await this.pterodactylAPI.stopServer(serverId);
            await context.socket.sendMessage(context.chatId, {
                text: `⏹️ Server ${serverId} sedang dihentikan...`
            });
        } catch (error) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Gagal menghentikan server. Periksa server ID atau hubungi admin.'
            });
        }
    }

    private async restartServerCommand(args: string[], context: CommandContext) {
        const serverId = args[0];
        
        if (!serverId) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Format salah. Gunakan: !restart [server_id]'
            });
            return;
        }

        try {
            await this.pterodactylAPI.restartServer(serverId);
            await context.socket.sendMessage(context.chatId, {
                text: `🔄 Server ${serverId} sedang direstart...`
            });
        } catch (error) {
            await context.socket.sendMessage(context.chatId, {
                text: '❌ Gagal merestart server. Periksa server ID atau hubungi admin.'
            });
        }
    }

    private async statsCommand(args: string[], context: CommandContext) {
        const stats = process.memoryUsage();
        const uptime = process.uptime();
        
        const statsText = `📊 *Statistik Bot*\n\n` +
                         `⏱️ Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m\n` +
                         `💾 Memory: ${Math.round(stats.heapUsed / 1024 / 1024)}MB\n` +
                         `🚀 Runtime: Bun ${process.versions.bun}\n` +
                         `📱 Platform: ${process.platform}\n` +
                         `🎯 Commands: ${this.commands.size}\n` +
                         `📅 Started: ${new Date(Date.now() - uptime * 1000).toLocaleString('id-ID')}`;

        await context.socket.sendMessage(context.chatId, { text: statsText });
    }
}