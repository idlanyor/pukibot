import axios, { AxiosInstance } from 'axios';
import { Logger } from '../utils/logger.js';

export interface ServerInfo {
    attributes: {
        id: number;
        external_id: string | null;
        uuid: string;
        identifier: string;
        name: string;
        description: string;
        status: string;
        suspended: boolean;
        limits: {
            memory: number;
            swap: number;
            disk: number;
            io: number;
            cpu: number;
        };
        feature_limits: {
            databases: number;
            allocations: number;
            backups: number;
        };
        user: number;
        node: number;
        allocation: number;
        nest: number;
        egg: number;
        container: {
            startup_command: string;
            image: string;
            environment: Record<string, any>;
        };
        updated_at: string;
        created_at: string;
    };
}

export interface ServerStats {
    current_state: string;
    is_suspended: boolean;
    resources: {
        memory_bytes: number;
        cpu_absolute: number;
        disk_bytes: number;
        network_rx_bytes: number;
        network_tx_bytes: number;
        uptime: number;
    };
}

export class PterodactylAPI {
    private client: AxiosInstance;
    private baseURL: string;
    private apiKey: string;

    constructor() {
        this.baseURL = process.env.PTERODACTYL_URL || '';
        this.apiKey = process.env.PTERODACTYL_API_KEY || '';

        if (!this.baseURL || !this.apiKey) {
            Logger.warn('⚠️ Pterodactyl API credentials not configured');
        }

        this.client = axios.create({
            baseURL: `${this.baseURL}/api/client`,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                Logger.error('Pterodactyl API Error:', error.response?.data || error.message);
                throw error;
            }
        );
    }

    async getServerInfo(serverId: string): Promise<ServerInfo> {
        try {
            const response = await this.client.get(`/servers/${serverId}`);
            return response.data.data;
        } catch (error) {
            Logger.error(`Failed to get server info for ${serverId}:`, error);
            throw new Error('Failed to retrieve server information');
        }
    }

    async getServerStats(serverId: string): Promise<ServerStats> {
        try {
            const response = await this.client.get(`/servers/${serverId}/resources`);
            return response.data.attributes;
        } catch (error) {
            Logger.error(`Failed to get server stats for ${serverId}:`, error);
            throw new Error('Failed to retrieve server statistics');
        }
    }

    async startServer(serverId: string): Promise<void> {
        try {
            await this.client.post(`/servers/${serverId}/power`, {
                signal: 'start'
            });
            Logger.info(`✅ Server ${serverId} start command sent`);
        } catch (error) {
            Logger.error(`Failed to start server ${serverId}:`, error);
            throw new Error('Failed to start server');
        }
    }

    async stopServer(serverId: string): Promise<void> {
        try {
            await this.client.post(`/servers/${serverId}/power`, {
                signal: 'stop'
            });
            Logger.info(`⏹️ Server ${serverId} stop command sent`);
        } catch (error) {
            Logger.error(`Failed to stop server ${serverId}:`, error);
            throw new Error('Failed to stop server');
        }
    }

    async restartServer(serverId: string): Promise<void> {
        try {
            await this.client.post(`/servers/${serverId}/power`, {
                signal: 'restart'
            });
            Logger.info(`🔄 Server ${serverId} restart command sent`);
        } catch (error) {
            Logger.error(`Failed to restart server ${serverId}:`, error);
            throw new Error('Failed to restart server');
        }
    }

    async killServer(serverId: string): Promise<void> {
        try {
            await this.client.post(`/servers/${serverId}/power`, {
                signal: 'kill'
            });
            Logger.info(`💀 Server ${serverId} kill command sent`);
        } catch (error) {
            Logger.error(`Failed to kill server ${serverId}:`, error);
            throw new Error('Failed to kill server');
        }
    }

    async sendCommand(serverId: string, command: string): Promise<void> {
        try {
            await this.client.post(`/servers/${serverId}/command`, {
                command: command
            });
            Logger.info(`📝 Command sent to server ${serverId}: ${command}`);
        } catch (error) {
            Logger.error(`Failed to send command to server ${serverId}:`, error);
            throw new Error('Failed to send command to server');
        }
    }

    async getServerConsole(serverId: string): Promise<any> {
        try {
            const response = await this.client.get(`/servers/${serverId}/logs`);
            return response.data;
        } catch (error) {
            Logger.error(`Failed to get console logs for server ${serverId}:`, error);
            throw new Error('Failed to retrieve console logs');
        }
    }

    async listServers(): Promise<ServerInfo[]> {
        try {
            const response = await this.client.get('/servers');
            return response.data.data;
        } catch (error) {
            Logger.error('Failed to list servers:', error);
            throw new Error('Failed to retrieve server list');
        }
    }

    async getServerFiles(serverId: string, directory: string = '/'): Promise<any> {
        try {
            const response = await this.client.get(`/servers/${serverId}/files/list`, {
                params: { directory }
            });
            return response.data.data;
        } catch (error) {
            Logger.error(`Failed to get files for server ${serverId}:`, error);
            throw new Error('Failed to retrieve server files');
        }
    }

    async createBackup(serverId: string, name?: string): Promise<void> {
        try {
            await this.client.post(`/servers/${serverId}/backups`, {
                name: name || `Backup_${new Date().toISOString().split('T')[0]}`
            });
            Logger.info(`💾 Backup created for server ${serverId}`);
        } catch (error) {
            Logger.error(`Failed to create backup for server ${serverId}:`, error);
            throw new Error('Failed to create backup');
        }
    }

    async getBackups(serverId: string): Promise<any> {
        try {
            const response = await this.client.get(`/servers/${serverId}/backups`);
            return response.data.data;
        } catch (error) {
            Logger.error(`Failed to get backups for server ${serverId}:`, error);
            throw new Error('Failed to retrieve backups');
        }
    }

    // Utility method to check if API is configured
    isConfigured(): boolean {
        return !!(this.baseURL && this.apiKey);
    }

    // Health check method
    async healthCheck(): Promise<boolean> {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            await this.client.get('/');
            return true;
        } catch (error) {
            Logger.error('Pterodactyl API health check failed:', error);
            return false;
        }
    }
}