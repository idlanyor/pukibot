export class Utils {
    /**
     * Format bytes to human readable string
     */
    static formatBytes(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Format uptime to human readable string
     */
    static formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

        return parts.join(' ') || '0s';
    }

    /**
     * Format number to Indonesian locale
     */
    static formatCurrency(amount: number, currency: string = 'IDR'): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Clean phone number
     */
    static cleanPhoneNumber(phone: string): string {
        // Remove all non-digits
        const cleaned = phone.replace(/\D/g, '');
        
        // Convert 08xx to 628xx
        if (cleaned.startsWith('08')) {
            return '62' + cleaned.substring(1);
        }
        
        // Add 62 if not present
        if (!cleaned.startsWith('62')) {
            return '62' + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Generate random string
     */
    static generateRandomString(length: number = 8): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }

    /**
     * Validate email
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Escape markdown characters
     */
    static escapeMarkdown(text: string): string {
        return text.replace(/[*_`\[\]()~>#+=|{}.!-]/g, '\\$&');
    }

    /**
     * Get time greeting in Indonesian
     */
    static getTimeGreeting(): string {
        const hour = new Date().getHours();
        
        if (hour >= 5 && hour < 12) {
            return 'Selamat pagi';
        } else if (hour >= 12 && hour < 15) {
            return 'Selamat siang';
        } else if (hour >= 15 && hour < 18) {
            return 'Selamat sore';
        } else {
            return 'Selamat malam';
        }
    }

    /**
     * Parse command arguments with quotes support
     */
    static parseArgs(text: string): string[] {
        const args: string[] = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current.trim()) {
                    args.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            args.push(current.trim());
        }

        return args;
    }

    /**
     * Sleep/delay function
     */
    static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry function with exponential backoff
     */
    static async retry<T>(
        fn: () => Promise<T>,
        retries: number = 3,
        delay: number = 1000
    ): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries <= 0) {
                throw error;
            }
            
            await this.sleep(delay);
            return this.retry(fn, retries - 1, delay * 2);
        }
    }

    /**
     * Check if string is URL
     */
    static isURL(str: string): boolean {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Truncate text with ellipsis
     */
    static truncate(text: string, length: number = 100): string {
        if (text.length <= length) {
            return text;
        }
        
        return text.substring(0, length - 3) + '...';
    }

    /**
     * Convert object to pretty JSON string
     */
    static prettyJSON(obj: any): string {
        return JSON.stringify(obj, null, 2);
    }

    /**
     * Get file extension from filename
     */
    static getFileExtension(filename: string): string {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    /**
     * Check if running in development mode
     */
    static isDevelopment(): boolean {
        return process.env.NODE_ENV === 'development';
    }

    /**
     * Get current timestamp in ISO format
     */
    static getCurrentTimestamp(): string {
        return new Date().toISOString();
    }

    /**
     * Calculate percentage
     */
    static calculatePercentage(part: number, total: number): number {
        if (total === 0) return 0;
        return Math.round((part / total) * 100);
    }
}