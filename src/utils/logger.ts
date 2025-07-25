import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

export const Logger = pino({
    level: logLevel,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    },
    formatters: {
        level: (label: string) => {
            return { level: label.toUpperCase() };
        }
    }
});

// Add console methods for compatibility
Logger.log = Logger.info;
Logger.error = (message: any, ...args: any[]) => {
    if (typeof message === 'string') {
        Logger.error({ message, args }, message);
    } else {
        Logger.error(message, ...args);
    }
};

export default Logger;