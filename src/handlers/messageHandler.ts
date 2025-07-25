import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { CommandManager } from '../commands/commandManager';
import { Logger } from '../utils/logger';
import { ConnectionManager } from '../utils/connectionManager';

export class MessageHandler {
    private commandManager: CommandManager;
    private prefix: string;

    constructor(commandManager: CommandManager) {
        this.commandManager = commandManager;
        this.prefix = process.env.BOT_PREFIX || '.';
    }

    async handle(message: WAMessage, socket: WASocket) {
        if (!message.message || !message.key.remoteJid) return;

        // Extract message info
        const messageText = this.extractMessageText(message);
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = message.key.remoteJid.endsWith('@g.us');
        const chatId = message.key.remoteJid;

        if (!messageText) return;

        Logger.debug(`📨 Pesan dari ${sender}: ${messageText}`);

        // Check if message starts with prefix
        if (!messageText.startsWith(this.prefix)) {
            // Handle non-command messages if needed
            return;
        }

        // Parse command
        const args = messageText.slice(this.prefix.length).trim().split(' ');
        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return;

        try {
            await ConnectionManager.safeCommandExecution(
                async () => {
                    await this.commandManager.execute(commandName, args, {
                        message,
                        socket,
                        sender,
                        chatId,
                        isGroup,
                        messageText
                    });
                },
                `execute command: ${commandName}`
            );
        } catch (error) {
            Logger.error('❌ Error executing command:', error);
            
            try {
                await ConnectionManager.safeMessageSend(
                    async () => {
                        await socket.sendMessage(chatId, {
                            text: '❌ Terjadi kesalahan saat menjalankan perintah. Silakan coba lagi.'
                        });
                    },
                    'send command error message'
                );
            } catch (sendError) {
                Logger.error('❌ Gagal mengirim pesan error command:', sendError);
            }
        }
    }

    private extractMessageText(message: WAMessage): string | null {
        const messageContent = message.message;
        
        if (!messageContent) return null;

        if (messageContent.conversation) {
            return messageContent.conversation;
        } else if (messageContent.extendedTextMessage?.text) {
            return messageContent.extendedTextMessage.text;
        } else if (messageContent.imageMessage?.caption) {
            return messageContent.imageMessage.caption;
        } else if (messageContent.videoMessage?.caption) {
            return messageContent.videoMessage.caption;
        }

        return null;
    }
}