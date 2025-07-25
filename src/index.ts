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

config();

class WhatsAppBot {
    private socket: ReturnType<typeof makeWASocket> | null = null;
    private messageHandler: MessageHandler;
    private commandManager: CommandManager;
    private pterodactylAPI: PterodactylAPI;
    private logger: typeof Logger;

    constructor() {
        this.logger = Logger;
        this.pterodactylAPI = new PterodactylAPI();
        this.commandManager = new CommandManager(this.pterodactylAPI);
        this.messageHandler = new MessageHandler(this.commandManager);
    }

    async start() {
        try {
            this.logger.info('🚀 Memulai Pterodactyl WhatsApp Bot...');
            
            const { state, saveCreds } = await useMultiFileAuthState('./sessions');
            
            this.socket = makeWASocket({
                auth: state,
                printQRInTerminal: true,
                logger: pino({ level: 'silent' }),
                browser: ['Pterodactyl Bot', 'Desktop', '1.0.0'],
                generateHighQualityLinkPreview: true,
            });

            this.setupEventHandlers(saveCreds);
            
        } catch (error) {
            this.logger.error('❌ Error saat memulai bot:', error);
            process.exit(1);
        }
    }

    private setupEventHandlers(saveCreds: () => Promise<void>) {
        if (!this.socket) return;

        this.socket.ev.on('connection.update', this.handleConnectionUpdate.bind(this));
        this.socket.ev.on('creds.update', saveCreds);
        this.socket.ev.on('messages.upsert', this.handleMessages.bind(this));
        
        // Handler untuk status online
        this.socket.ev.on('presence.update', (presence) => {
            this.logger.debug('Presence update:', presence);
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
            
            this.logger.info('❌ Koneksi tertutup. Reconnecting:', shouldReconnect);
            
            if (shouldReconnect) {
                setTimeout(() => this.start(), 5000);
            }
        } else if (connection === 'open') {
            this.logger.info('✅ Bot berhasil terhubung ke WhatsApp!');
            this.logger.info(`📱 Bot Name: ${process.env.BOT_NAME || 'Pterodactyl Store Bot'}`);
            this.logger.info(`🛠️ Prefix: ${process.env.BOT_PREFIX || '!'}`);
            
            // Send notification to owner
            const ownerNumber = process.env.OWNER_NUMBER;
            if (ownerNumber && this.socket) {
                await this.socket.sendMessage(`${ownerNumber}@s.whatsapp.net`, {
                    text: `🤖 *${process.env.BOT_NAME || 'Pterodactyl Store Bot'}* telah online!\n\n` +
                          `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n` +
                          `🔧 Runtime: Bun ${process.versions.bun}\n` +
                          `📦 Baileys: ${await import('@whiskeysockets/baileys/package.json').then(m => m.default.version)}`
                });
            }
        }
    }

    private async handleMessages(messageUpdate: { messages: WAMessage[]; type: keyof BaileysEventMap }) {
        const message = messageUpdate.messages[0];
        
        if (!message || !this.socket) return;

        try {
            await this.messageHandler.handle(message, this.socket);
        } catch (error) {
            this.logger.error('❌ Error handling message:', error);
        }
    }

    async stop() {
        if (this.socket) {
            this.logger.info('🛑 Menghentikan bot...');
            this.socket.end();
            this.socket = null;
        }
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Menerima sinyal SIGINT, menghentikan bot...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Menerima sinyal SIGTERM, menghentikan bot...');
    process.exit(0);
});

// Start the bot
const bot = new WhatsAppBot();
bot.start().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

export { WhatsAppBot };