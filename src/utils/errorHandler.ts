import { Logger } from './logger';

export interface ErrorConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
    timeout: number;
}

export class ErrorHandler {
    private static readonly ERROR_CONFIGS: Record<string, ErrorConfig> = {
        message_send: {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 15000,
            backoffFactor: 2,
            timeout: 15000
        },
        command_execution: {
            maxRetries: 2,
            baseDelay: 2000,
            maxDelay: 30000,
            backoffFactor: 2,
            timeout: 45000
        },
        api_call: {
            maxRetries: 3,
            baseDelay: 500,
            maxDelay: 10000,
            backoffFactor: 1.5,
            timeout: 20000
        },
        connection: {
            maxRetries: 5,
            baseDelay: 5000,
            maxDelay: 60000,
            backoffFactor: 2,
            timeout: 60000
        }
    };

    static getConfig(operation: string): ErrorConfig {
        return this.ERROR_CONFIGS[operation] || this.ERROR_CONFIGS.message_send;
    }

    static isCriticalError(error: any): boolean {
        if (!error) return false;

        const message = error.message?.toLowerCase() || '';
        const criticalErrors = [
            'loggedout',
            'unauthorized',
            'forbidden',
            'rate limit',
            'banned',
            'invalid session'
        ];

        return criticalErrors.some(critical => message.includes(critical));
    }

    static isRetryableError(error: any): boolean {
        if (!error) return false;

        const message = error.message?.toLowerCase() || '';
        const retryableErrors = [
            'timeout',
            'timed out',
            'network',
            'connection',
            'econnreset',
            'econnrefused',
            'etimedout',
            'temporary failure',
            'service unavailable',
            'internal server error'
        ];

        return retryableErrors.some(retryable => message.includes(retryable));
    }

    static getErrorType(error: any): 'timeout' | 'network' | 'auth' | 'rate_limit' | 'critical' | 'unknown' {
        if (!error) return 'unknown';

        const message = error.message?.toLowerCase() || '';
        const statusCode = error.output?.statusCode || error.status || error.statusCode;

        // Check for timeout errors
        if (message.includes('timeout') || message.includes('timed out') || statusCode === 408) {
            return 'timeout';
        }

        // Check for network errors
        if (message.includes('network') || message.includes('connection') || 
            message.includes('econnreset') || message.includes('econnrefused')) {
            return 'network';
        }

        // Check for authentication errors
        if (statusCode === 401 || statusCode === 403 || message.includes('unauthorized') || 
            message.includes('forbidden') || message.includes('invalid session')) {
            return 'auth';
        }

        // Check for rate limit errors
        if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
            return 'rate_limit';
        }

        // Check for critical errors
        if (this.isCriticalError(error)) {
            return 'critical';
        }

        return 'unknown';
    }

    static logError(error: any, operation: string, attempt: number = 1): void {
        const errorType = this.getErrorType(error);
        const isRetryable = this.isRetryableError(error);
        
        const logMessage = `${operation} failed (attempt ${attempt})`;
        const errorDetails = {
            type: errorType,
            message: error.message,
            retryable: isRetryable,
            statusCode: error.output?.statusCode || error.status || error.statusCode,
            stack: error.stack
        };

        switch (errorType) {
            case 'timeout':
                Logger.warn(`⏰ ${logMessage}: Timeout`, errorDetails);
                break;
            case 'network':
                Logger.warn(`🌐 ${logMessage}: Network issue`, errorDetails);
                break;
            case 'auth':
                Logger.error(`🔒 ${logMessage}: Authentication issue`, errorDetails);
                break;
            case 'rate_limit':
                Logger.warn(`🚦 ${logMessage}: Rate limited`, errorDetails);
                break;
            case 'critical':
                Logger.error(`💥 ${logMessage}: Critical error`, errorDetails);
                break;
            default:
                Logger.error(`❌ ${logMessage}: Unknown error`, errorDetails);
        }
    }

    static getRetryDelay(errorType: string, attempt: number, baseDelay: number, backoffFactor: number, maxDelay: number): number {
        let delay = baseDelay * Math.pow(backoffFactor, attempt - 1);

        // Add jitter to prevent thundering herd
        delay += Math.random() * 1000;

        // Special handling for rate limits
        if (errorType === 'rate_limit') {
            delay = Math.max(delay, 60000); // Minimum 1 minute for rate limits
        }

        return Math.min(delay, maxDelay);
    }

    static shouldRetry(error: any, attempt: number, maxRetries: number): boolean {
        if (attempt >= maxRetries) return false;
        if (this.isCriticalError(error)) return false;
        return this.isRetryableError(error);
    }
}