import { config } from 'dotenv';
import makeWASocket, {
    ConnectionState,
    DisconnectReason,
    useMultiFileAuthState,
    WAMessage,
    BaileysEventMap
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { MessageHandler } from './handlers/messageHandler';
import { CommandManager } from './commands/commandManager';
import { PterodactylAPI } from './services/pterodactylAPI';
import { Logger } from './utils/logger';
import { ConnectionManager } from './utils/connectionManager';
import * as fs from 'fs';
import * as path from 'path';

config();

class WhatsAppBot {
    private socket: ReturnType<typeof makeWASocket> | null = null;
    private messageHandler: MessageHandler;
    private commandManager: CommandManager;
    private pterodactylAPI: PterodactylAPI;
    private logger: typeof Logger;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private isReconnecting: boolean = false;
    private sessionPath: string = './sessions';

    constructor() {
        this.logger = Logger;
        this.pterodactylAPI = new PterodactylAPI();
        this.commandManager = new CommandManager(this.pterodactylAPI);
        this.messageHandler = new MessageHandler(this.commandManager);
    }

    private async cleanupSession(): Promise<void> {
        try {
            if (fs.existsSync(this.sessionPath)) {
                this.logger.info('🧹 Membersihkan session folder...');
                
                // Remove all files in session directory
                const files = fs.readdirSync(this.sessionPath);
                for (const file of files) {
                    const filePath = path.join(this.sessionPath, file);
                    
                    try {
                        const stat = fs.statSync(filePath);
                        
                        if (stat.isDirectory()) {
                            fs.rmSync(filePath, { recursive: true, force: true });
                            this.logger.debug(`📁 Removed directory: ${file}`);
                        } else {
                            fs.unlinkSync(filePath);
                            this.logger.debug(`📄 Removed file: ${file}`);
                        }
                    } catch (fileError) {
                        this.logger.warn(`⚠️ Gagal menghapus ${file}:`, fileError);
                    }
                }
                
                this.logger.success('✅ Session folder berhasil dibersihkan');
            } else {
                this.logger.info('📂 Session folder tidak ditemukan, tidak perlu dibersihkan');
            }
        } catch (error) {
            this.logger.error('❌ Error saat membersihkan session:', error);
            throw error;
        }
    }

    // Public method for manual session cleanup
    async forceCleanupSession(): Promise<void> {
        this.logger.info('🔧 Manual session cleanup diminta...');
        await this.cleanupSession();
    }

    async start() {
        try {
            // Display startup banner
            Logger.banner(
                'PTERODACTYL WHATSAPP BOT',
                `v${process.env.npm_package_version || '1.0.0'} - ${process.env.NODE_ENV || 'development'}`
            );
            
            this.logger.start('Memulai Pterodactyl WhatsApp Bot...');

            const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

            this.socket = makeWASocket({
                auth: state,
                logger: pino({ level: 'silent' }),
                browser: ['Pterodactyl Bot', 'Desktop', '1.0.0'],
                generateHighQualityLinkPreview: true,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                qrTimeout: 45000,
                retryRequestDelayMs: 250,
                maxMsgRetryCount: 5,
                getMessage: async () => ({ conversation: 'Message not available' })
            });

            this.setupEventHandlers(saveCreds);

        } catch (error) {
            this.logger.error('❌ Error saat memulai bot:', error);
            await this.handleStartupError();
        }
    }

    private async handleStartupError() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(5000 * this.reconnectAttempts, 30000);
            this.logger.info(`🔄 Mencoba restart bot dalam ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.start(), delay);
        } else {
            this.logger.error('❌ Maksimal attempt restart tercapai, bot berhenti');
            process.exit(1);
        }
    }

    private setupEventHandlers(saveCreds: () => Promise<void>) {
        if (!this.socket) return;

        this.socket.ev.on('connection.update', this.handleConnectionUpdate.bind(this));
        this.socket.ev.on('creds.update', saveCreds);
        this.socket.ev.on('messages.upsert', this.handleMessages.bind(this));

        // Handler untuk status online
        this.socket.ev.on('presence.update', (presence: any) => {
            this.logger.debug('Presence update:', String(presence));
        });

        // Handler untuk error socket
        this.socket.ev.on("call", (call: any) => {
            this.logger.debug('Incoming call:', String(call));
        });
    }

    private async handleConnectionUpdate(update: Partial<ConnectionState>) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            this.logger.info('📱 Scan QR Code untuk login:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;

            this.logger.info(`❌ Koneksi tertutup. Reason: ${reason}, Reconnecting: ${shouldReconnect}`);

            // Check if this is a logout and cleanup session
            if (reason === DisconnectReason.loggedOut) {
                this.logger.warn('🚪 Terdeteksi logout dari WhatsApp');
                await this.cleanupSession();
                this.logger.info('💡 Session telah dibersihkan. Silakan restart bot untuk memulai session baru.');
            }

            if (shouldReconnect && !this.isReconnecting) {
                this.isReconnecting = true;
                const delay = Math.min(5000 * (this.reconnectAttempts + 1), 30000);
                setTimeout(() => {
                    this.isReconnecting = false;
                    this.start();
                }, delay);
            }
        } else if (connection === 'open') {
            this.logger.connection('Bot berhasil terhubung ke WhatsApp!', 'info');
            this.logger.bot(`Bot Name: ${process.env.BOT_NAME || 'Pterodactyl Store Bot'}`);
            this.logger.system(`Prefix: ${process.env.BOT_PREFIX || '.'}`);
            
            // Log system information
            Logger.memory();
            Logger.system(`Node.js: ${process.version}`);
            Logger.system(`Platform: ${process.platform} ${process.arch}`);

            // Reset reconnect attempts on successful connection
            this.reconnectAttempts = 0;
            this.isReconnecting = false;

            // Send notification to owner with timeout handling
            await this.sendOwnerNotification();
        }
    }

    private async sendOwnerNotification() {
        const ownerNumber = process.env.OWNER_NUMBER;
        if (ownerNumber && this.socket) {
            try {
                await ConnectionManager.safeMessageSend(
                    async () => {
                        const baileysVersion = await import('@whiskeysockets/baileys/package.json').then(m => m.default.version);
                        return this.socket!.sendMessage(`${ownerNumber}@s.whatsapp.net`, {
                            text: `🤖 *${process.env.BOT_NAME || 'Pterodactyl Store Bot'}* telah online!\n\n` +
                                `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n` +
                                `🔧 Runtime: Bun ${process.versions.bun}\n` +
                                `📦 Baileys: ${baileysVersion}`
                        });
                    },
                    'send owner notification'
                );
            } catch (error) {
                this.logger.warn('⚠️ Gagal mengirim notifikasi ke owner:', error);
            }
        }
    }

    private async handleMessages(messageUpdate: { messages: WAMessage[]; type: keyof BaileysEventMap }) {
        const message = messageUpdate.messages[0];

        if (!message || !this.socket) return;

        try {
            await ConnectionManager.safeCommandExecution(
                async () => {
                    await this.messageHandler.handle(message, this.socket!);
                },
                'handle message'
            );
        } catch (error) {
            this.logger.error('❌ Error handling message:', error);

            // Try to send error message to user if possible
            try {
                if (message.key.remoteJid) {
                    await ConnectionManager.safeMessageSend(
                        async () => {
                            return this.socket!.sendMessage(message.key.remoteJid!, {
                                text: '❌ Terjadi kesalahan sementara. Silakan coba lagi dalam beberapa saat.'
                            });
                        },
                        'send error message'
                    );
                }
            } catch (sendError) {
                this.logger.error('❌ Gagal mengirim pesan error:', sendError);
            }
        }
    }

    async stop() {
        if (this.socket) {
            this.logger.stop('Menghentikan bot...');
            try {
                await ConnectionManager.withTimeout(
                    async () => {
                        this.socket!.end(new Error('Bot Dihentikan'));
                    },
                    5000,
                    'stop bot'
                );
            } catch (error) {
                this.logger.warn('⚠️ Error saat menghentikan bot:', error);
            } finally {
                this.socket = null;
            }
        }
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    Logger.stop('Menerima sinyal SIGINT, menghentikan bot...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    Logger.stop('Menerima sinyal SIGTERM, menghentikan bot...');
    process.exit(0);
});

// Start the bot
const bot = new WhatsAppBot();
bot.start().catch((error) => {
    Logger.error('Fatal error:', '❌', error);
    process.exit(1);
});

export { WhatsAppBot };