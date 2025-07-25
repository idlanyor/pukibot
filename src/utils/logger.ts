import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

export const Logger = pino({
    level: logLevel
});

export default Logger;