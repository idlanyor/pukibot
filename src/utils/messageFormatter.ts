/**
 * WhatsApp Message Formatter
 * Utility untuk memformat pesan WhatsApp agar lebih menarik dan konsisten
 */

export interface MessageSection {
    title?: string;
    content: string;
    emoji?: string;
}

export interface MessageOptions {
    title?: string;
    subtitle?: string;
    sections?: MessageSection[];
    footer?: string;
    timestamp?: boolean;
    divider?: boolean;
}

export class MessageFormatter {
    // Emoji library untuk berbagai konteks
    static readonly EMOJIS = {
        // Status
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳',
        
        // Actions
        start: '🚀',
        stop: '🛑',
        restart: '🔄',
        check: '🔍',
        edit: '✏️',
        delete: '🗑️',
        save: '💾',
        send: '📤',
        receive: '📥',
        
        // Business
        store: '🛒',
        order: '📦',
        payment: '💰',
        invoice: '🧾',
        receipt: '🧾',
        money: '💵',
        credit: '💳',
        
        // Server/Tech
        server: '🖥️',
        database: '💾',
        network: '🌐',
        api: '🔌',
        code: '💻',
        bug: '🐛',
        
        // Communication
        message: '📨',
        notification: '📢',
        bell: '🔔',
        phone: '📞',
        email: '📧',
        
        // Navigation
        menu: '📋',
        list: '📝',
        search: '🔎',
        filter: '🔽',
        sort: '🔀',
        
        // Time
        clock: '🕐',
        calendar: '📅',
        timer: '⏱️',
        
        // People
        user: '👤',
        admin: '👑',
        customer: '👥',
        
        // Misc
        star: '⭐',
        fire: '🔥',
        rocket: '🚀',
        gem: '💎',
        crown: '👑',
        trophy: '🏆',
        target: '🎯',
        key: '🔑',
        lock: '🔒',
        unlock: '🔓',
    };

    // Format pesan dengan header yang menarik
    static formatMessage(options: MessageOptions): string {
        let message = '';

        // Header dengan title dan subtitle
        if (options.title) {
            message += `*${options.title}*\n`;
            if (options.subtitle) {
                message += `_${options.subtitle}_\n`;
            }
            message += '\n';
        }

        // Divider setelah header
        if (options.divider && options.title) {
            message += this.createDivider() + '\n';
        }

        // Sections
        if (options.sections && options.sections.length > 0) {
            options.sections.forEach((section, index) => {
                if (section.title) {
                    const emoji = section.emoji || this.EMOJIS.info;
                    message += `${emoji} *${section.title}*\n`;
                }
                message += section.content;
                
                // Add spacing between sections
                if (index < options.sections!.length - 1) {
                    message += '\n\n';
                }
            });
        }

        // Footer
        if (options.footer) {
            message += '\n\n' + this.createDivider() + '\n';
            message += options.footer;
        }

        // Timestamp
        if (options.timestamp) {
            const now = new Date().toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            message += `\n\n${this.EMOJIS.clock} _${now} WIB_`;
        }

        return message.trim();
    }

    // Format pesan error yang konsisten
    static formatError(title: string, description?: string, suggestion?: string): string {
        const sections: MessageSection[] = [
            {
                title: 'Error',
                content: description || title,
                emoji: this.EMOJIS.error
            }
        ];

        if (suggestion) {
            sections.push({
                title: 'Solusi',
                content: suggestion,
                emoji: this.EMOJIS.info
            });
        }

        return this.formatMessage({
            sections,
            footer: `${this.EMOJIS.message} Hubungi admin jika masalah berlanjut`
        });
    }

    // Format pesan sukses
    static formatSuccess(title: string, description?: string, nextSteps?: string): string {
        const sections: MessageSection[] = [
            {
                title: 'Berhasil',
                content: description || title,
                emoji: this.EMOJIS.success
            }
        ];

        if (nextSteps) {
            sections.push({
                title: 'Langkah Selanjutnya',
                content: nextSteps,
                emoji: this.EMOJIS.target
            });
        }

        return this.formatMessage({ sections });
    }

    // Format daftar dengan bullet points yang menarik
    static formatList(items: string[], title?: string, emoji?: string): string {
        const listEmoji = emoji || this.EMOJIS.list;
        let content = '';
        
        items.forEach((item, index) => {
            const bullet = index % 2 === 0 ? '•' : '◦';
            content += `${bullet} ${item}\n`;
        });

        if (title) {
            return this.formatMessage({
                sections: [{
                    title,
                    content: content.trim(),
                    emoji: listEmoji
                }]
            });
        }

        return content.trim();
    }

    // Format informasi dalam bentuk key-value
    static formatInfo(data: Record<string, string>, title?: string): string {
        let content = '';
        
        Object.entries(data).forEach(([key, value]) => {
            content += `*${key}:* ${value}\n`;
        });

        if (title) {
            return this.formatMessage({
                sections: [{
                    title,
                    content: content.trim(),
                    emoji: this.EMOJIS.info
                }]
            });
        }

        return content.trim();
    }

    // Format menu dengan opsi
    static formatMenu(title: string, options: Array<{command: string, description: string}>, footer?: string): string {
        let content = '';
        
        options.forEach(option => {
            content += `${this.EMOJIS.target} *${option.command}*\n`;
            content += `   ${option.description}\n\n`;
        });

        return this.formatMessage({
            title: `${this.EMOJIS.menu} ${title}`,
            sections: [{
                content: content.trim()
            }],
            footer: footer || `${this.EMOJIS.info} Ketik perintah untuk menggunakan fitur`
        });
    }

    // Format status order/server
    static formatStatus(title: string, status: string, details: Record<string, string>, actions?: string[]): string {
        const sections: MessageSection[] = [
            {
                title: 'Status',
                content: `*${status}*`,
                emoji: this.getStatusEmoji(status)
            },
            {
                title: 'Detail',
                content: this.formatInfo(details),
                emoji: this.EMOJIS.info
            }
        ];

        if (actions && actions.length > 0) {
            sections.push({
                title: 'Aksi Tersedia',
                content: this.formatList(actions),
                emoji: this.EMOJIS.target
            });
        }

        return this.formatMessage({
            title,
            sections,
            timestamp: true
        });
    }

    // Format katalog produk
    static formatCatalog(storeName: string, categories: Array<{name: string, items: Array<{name: string, price: string, specs: string}>}>): string {
        const sections: MessageSection[] = [];

        categories.forEach(category => {
            let content = '';
            category.items.forEach(item => {
                content += `${this.EMOJIS.gem} *${item.name}*\n`;
                content += `   ${item.specs}\n`;
                content += `   ${this.EMOJIS.money} ${item.price}\n\n`;
            });

            sections.push({
                title: category.name,
                content: content.trim(),
                emoji: this.getCategoryEmoji(category.name)
            });
        });

        return this.formatMessage({
            title: `${this.EMOJIS.store} ${storeName}`,
            sections,
            footer: `${this.EMOJIS.message} Hubungi admin untuk informasi lebih lanjut`,
            divider: true
        });
    }

    // Helper methods
    private static createDivider(): string {
        return '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    }

    private static getStatusEmoji(status: string): string {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('aktif') || statusLower.includes('online') || statusLower.includes('running')) {
            return this.EMOJIS.success;
        } else if (statusLower.includes('error') || statusLower.includes('gagal') || statusLower.includes('failed')) {
            return this.EMOJIS.error;
        } else if (statusLower.includes('pending') || statusLower.includes('waiting') || statusLower.includes('loading')) {
            return this.EMOJIS.loading;
        } else if (statusLower.includes('stop') || statusLower.includes('offline')) {
            return this.EMOJIS.stop;
        }
        return this.EMOJIS.info;
    }

    private static getCategoryEmoji(categoryName: string): string {
        const name = categoryName.toLowerCase();
        if (name.includes('nodejs') || name.includes('javascript')) {
            return '🟢';
        } else if (name.includes('vps') || name.includes('server')) {
            return '🔧';
        } else if (name.includes('python')) {
            return '🐍';
        } else if (name.includes('java')) {
            return '☕';
        } else if (name.includes('php')) {
            return '🐘';
        }
        return this.EMOJIS.server;
    }

    // Format command help
    static formatCommandHelp(command: string, description: string, usage: string, examples?: string[]): string {
        const sections: MessageSection[] = [
            {
                title: 'Deskripsi',
                content: description,
                emoji: this.EMOJIS.info
            },
            {
                title: 'Penggunaan',
                content: `\`${usage}\``,
                emoji: this.EMOJIS.code
            }
        ];

        if (examples && examples.length > 0) {
            sections.push({
                title: 'Contoh',
                content: examples.map(ex => `\`${ex}\``).join('\n'),
                emoji: this.EMOJIS.target
            });
        }

        return this.formatMessage({
            title: `${this.EMOJIS.menu} Command: ${command}`,
            sections
        });
    }
}

export default MessageFormatter;