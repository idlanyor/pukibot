import { Logger } from './logger';
import { ErrorHandler, ErrorConfig } from './errorHandler';

export interface RetryOptions {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
}

export class ConnectionManager {
    private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2
    };

    static async withRetry<T>(
        operation: () => Promise<T>,
        options: Partial<RetryOptions> = {},
        operationName: string = 'operation'
    ): Promise<T> {
        const config = { ...this.DEFAULT_RETRY_OPTIONS, ...options };
        let lastError: Error;

        for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
            try {
                Logger.retry(`Attempting ${operationName} (attempt ${attempt}/${config.maxRetries})`);
                return await operation();
            } catch (error) {
                lastError = error as Error;
                
                ErrorHandler.logError(error, operationName, attempt);

                if (attempt === config.maxRetries || !ErrorHandler.shouldRetry(error, attempt, config.maxRetries)) {
                    break;
                }

                const errorType = ErrorHandler.getErrorType(error);
                const delay = ErrorHandler.getRetryDelay(errorType, attempt, config.baseDelay, config.backoffFactor, config.maxDelay);

                Logger.timeout(`Waiting ${delay}ms before retry...`);
                await this.sleep(delay);
            }
        }

        Logger.error(`❌ ${operationName} failed after ${config.maxRetries} attempts`);
        throw lastError!;
    }

    static async withTimeout<T>(
        operation: () => Promise<T>,
        timeoutMs: number,
        operationName: string = 'operation'
    ): Promise<T> {
        return Promise.race([
            operation(),
            new Promise<never>((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            })
        ]);
    }

    static async safeOperation<T>(
        operation: () => Promise<T>,
        options: {
            timeout?: number;
            retryOptions?: Partial<RetryOptions>;
            operationName?: string;
            fallback?: () => Promise<T> | T;
        } = {}
    ): Promise<T> {
        const {
            timeout = 30000,
            retryOptions = {},
            operationName = 'operation',
            fallback
        } = options;

        try {
            return await this.withRetry(
                () => this.withTimeout(operation, timeout, operationName),
                retryOptions,
                operationName
            );
        } catch (error) {
            if (fallback) {
                Logger.warn(`🔄 Using fallback for ${operationName}`);
                return await fallback();
            }
            throw error;
        }
    }

    private static isTimeoutError(error: any): boolean {
        if (!error) return false;
        
        const message = error.message?.toLowerCase() || '';
        const isBoomTimeout = error.isBoom && error.output?.statusCode === 408;
        const isTimeoutMessage = message.includes('timeout') || message.includes('timed out');
        
        return isBoomTimeout || isTimeoutMessage;
    }

    private static isNetworkError(error: any): boolean {
        if (!error) return false;
        
        const message = error.message?.toLowerCase() || '';
        const networkErrors = [
            'network',
            'connection',
            'econnreset',
            'econnrefused',
            'enotfound',
            'etimedout'
        ];
        
        return networkErrors.some(errorType => message.includes(errorType));
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static createTimeoutWrapper(defaultTimeout: number = 30000) {
        return <T>(operation: () => Promise<T>, timeout?: number, operationName?: string): Promise<T> => {
            return this.withTimeout(operation, timeout || defaultTimeout, operationName || 'wrapped operation');
        };
    }

    static createRetryWrapper(defaultOptions: Partial<RetryOptions> = {}) {
        return <T>(operation: () => Promise<T>, options?: Partial<RetryOptions>, operationName?: string): Promise<T> => {
            return this.withRetry(operation, { ...defaultOptions, ...options }, operationName || 'wrapped operation');
        };
    }

    static async safeMessageSend<T>(
        operation: () => Promise<T>,
        operationName: string = 'send message'
    ): Promise<T> {
        const config = ErrorHandler.getConfig('message_send');
        return this.safeOperation(operation, {
            timeout: config.timeout,
            retryOptions: {
                maxRetries: config.maxRetries,
                baseDelay: config.baseDelay,
                maxDelay: config.maxDelay,
                backoffFactor: config.backoffFactor
            },
            operationName
        });
    }

    static async safeCommandExecution<T>(
        operation: () => Promise<T>,
        operationName: string = 'execute command'
    ): Promise<T> {
        const config = ErrorHandler.getConfig('command_execution');
        return this.safeOperation(operation, {
            timeout: config.timeout,
            retryOptions: {
                maxRetries: config.maxRetries,
                baseDelay: config.baseDelay,
                maxDelay: config.maxDelay,
                backoffFactor: config.backoffFactor
            },
            operationName
        });
    }

    static async safeApiCall<T>(
        operation: () => Promise<T>,
        operationName: string = 'api call'
    ): Promise<T> {
        const config = ErrorHandler.getConfig('api_call');
        return this.safeOperation(operation, {
            timeout: config.timeout,
            retryOptions: {
                maxRetries: config.maxRetries,
                baseDelay: config.baseDelay,
                maxDelay: config.maxDelay,
                backoffFactor: config.backoffFactor
            },
            operationName
        });
    }
}