import pino from 'pino';
import { createWriteStream } from 'fs';
import { join } from 'path';

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Text colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
};

// Emoji mappings for different log levels and contexts
const emojis = {
    info: '📝',
    warn: '⚠️',
    error: '❌',
    debug: '🔍',
    success: '✅',
    start: '🚀',
    stop: '🛑',
    network: '🌐',
    database: '💾',
    auth: '🔐',
    user: '👤',
    system: '⚙️',
    plugin: '🔌',
    command: '🎯',
    order: '📦',
    payment: '💰',
    server: '🖥️',
    message: '📨',
    notification: '📢',
    retry: '🔄',
    timeout: '⏰',
    connection: '🔗',
    bot: '🤖',
    store: '🛒',
    admin: '👑',
};

// Enhanced log formatting
const formatLogMessage = (level: string, message: string, emoji?: string): string => {
    const timestamp = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    let coloredLevel: string;
    let defaultEmoji: string;

    switch (level.toLowerCase()) {
        case 'info':
            coloredLevel = `${colors.cyan}${colors.bright}INFO${colors.reset}`;
            defaultEmoji = emojis.info;
            break;
        case 'warn':
            coloredLevel = `${colors.yellow}${colors.bright}WARN${colors.reset}`;
            defaultEmoji = emojis.warn;
            break;
        case 'error':
            coloredLevel = `${colors.red}${colors.bright}ERROR${colors.reset}`;
            defaultEmoji = emojis.error;
            break;
        case 'debug':
            coloredLevel = `${colors.magenta}${colors.bright}DEBUG${colors.reset}`;
            defaultEmoji = emojis.debug;
            break;
        default:
            coloredLevel = `${colors.white}${level.toUpperCase()}${colors.reset}`;
            defaultEmoji = '📝';
    }

    const logEmoji = emoji || defaultEmoji;
    const coloredTimestamp = `${colors.dim}${timestamp}${colors.reset}`;
    
    return `${coloredTimestamp} ${coloredLevel} ${logEmoji} ${message}`;
};

// Create enhanced Pino logger
const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Create log streams
const streams: any[] = [];

// Console stream with pretty formatting
if (isDevelopment) {
    streams.push({
        level: logLevel,
        stream: {
            write: (chunk: string) => {
                try {
                    const logObj = JSON.parse(chunk);
                    const formattedMessage = formatLogMessage(
                        logObj.level >= 50 ? 'error' :
                        logObj.level >= 40 ? 'warn' :
                        logObj.level >= 30 ? 'info' : 'debug',
                        logObj.msg,
                        logObj.emoji
                    );
                    console.log(formattedMessage);
                } catch {
                    // Fallback for non-JSON logs
                    console.log(chunk.trim());
                }
            }
        }
    });
} else {
    // Production: simple console output
    streams.push({
        level: logLevel,
        stream: process.stdout
    });
}

// File stream for persistent logging
if (process.env.LOG_FILE !== 'false') {
    const logDir = process.env.LOG_DIR || './logs';
    const logFile = join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    
    streams.push({
        level: 'debug',
        stream: createWriteStream(logFile, { flags: 'a' })
    });
}

const logger = pino({
    level: logLevel,
    base: {
        pid: process.pid,
        hostname: process.env.HOSTNAME || 'pukibot'
    },
    timestamp: pino.stdTimeFunctions.isoTime,
}, pino.multistream(streams));

// Enhanced logger interface
export class Logger {
    // Basic log methods
    static info(message: string, emoji?: string, ...args: any[]) {
        logger.info({ emoji, ...args }, message);
    }

    static warn(message: string, emoji?: string, ...args: any[]): void {
        logger.warn({ emoji, ...args }, message);
    }

    static error(message: string, emoji?: string, ...args: any[]) {
        logger.error({ emoji, ...args }, message);
    }

    static debug(message: string, emoji?: string, ...args: any[]) {
        logger.debug({ emoji, ...args }, message);
    }

    // Contextual log methods
    static success(message: string, ...args: any[]) {
        this.info(message, emojis.success, ...args);
    }

    static start(message: string, ...args: any[]) {
        this.info(message, emojis.start, ...args);
    }

    static stop(message: string, ...args: any[]) {
        this.info(message, emojis.stop, ...args);
    }

    static network(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.network, ...args);
    }

    static database(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.database, ...args);
    }

    static auth(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.auth, ...args);
    }

    static user(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.user, ...args);
    }

    static system(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.system, ...args);
    }

    static plugin(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.plugin, ...args);
    }

    static command(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.command, ...args);
    }

    static order(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.order, ...args);
    }

    static payment(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.payment, ...args);
    }

    static server(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.server, ...args);
    }

    static message(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.message, ...args);
    }

    static notification(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.notification, ...args);
    }

    static retry(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.retry, ...args);
    }

    static timeout(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.timeout, ...args);
    }

    static connection(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.connection, ...args);
    }

    static bot(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.bot, ...args);
    }

    static store(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.store, ...args);
    }

    static admin(message: string, level: 'info' | 'warn' | 'error' = 'info', ...args: any[]) {
        this[level](message, emojis.admin, ...args);
    }

    // Utility methods
    static separator(title?: string) {
        const line = '═'.repeat(60);
        if (title) {
            const paddedTitle = ` ${title} `;
            const padding = Math.max(0, line.length - paddedTitle.length);
            const leftPad = '═'.repeat(Math.floor(padding / 2));
            const rightPad = '═'.repeat(Math.ceil(padding / 2));
            this.info(`${leftPad}${paddedTitle}${rightPad}`, '📋');
        } else {
            this.info(line, '📋');
        }
    }

    static banner(title: string, subtitle?: string) {
        this.separator();
        this.info(`🎯 ${title}`, emojis.start);
        if (subtitle) {
            this.info(`   ${subtitle}`, '📝');
        }
        this.separator();
    }

    static performance(operation: string, duration: number) {
        const emoji = duration < 1000 ? '⚡' : duration < 5000 ? '⏱️' : '🐌';
        this.info(`${operation} completed in ${duration}ms`, emoji);
    }

    static memory() {
        const usage = process.memoryUsage();
        const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);
        
        this.info(
            `Memory Usage - RSS: ${formatBytes(usage.rss)}MB, Heap: ${formatBytes(usage.heapUsed)}/${formatBytes(usage.heapTotal)}MB`,
            '💾'
        );
    }

    // Create child logger with context
    static child(context: Record<string, any>) {
        return logger.child(context);
    }

    // Raw pino logger access
    static get raw() {
        return logger;
    }
}

// Backward compatibility
export default Logger;

// Export the raw logger for cases where pino methods are needed directly
export { logger as pinoLogger };