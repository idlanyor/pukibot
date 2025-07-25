import axios, { AxiosInstance } from 'axios';
import { Logger } from '../utils/logger';

// Admin API interfaces for user and server creation
export interface PterodactylUser {
    id: number;
    external_id: string | null;
    uuid: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    language: string;
    root_admin: boolean;
    two_fa: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateUserRequest {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    password?: string;
    root_admin?: boolean;
    language?: string;
}

export interface PterodactylServer {
    id: number;
    external_id: string | null;
    uuid: string;
    identifier: string;
    name: string;
    description: string;
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
    created_at: string;
    updated_at: string;
}

export interface CreateServerRequest {
    name: string;
    description?: string;
    user: number;
    egg: number;
    docker_image: string;
    startup: string;
    environment: Record<string, any>;
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
    allocation: {
        default: number;
        additional?: number[];
    };
}

export interface PterodactylNode {
    id: number;
    uuid: string;
    public: boolean;
    name: string;
    description: string;
    location_id: number;
    fqdn: string;
    scheme: string;
    behind_proxy: boolean;
    maintenance_mode: boolean;
    memory: number;
    memory_overallocate: number;
    disk: number;
    disk_overallocate: number;
    upload_size: number;
    daemon_listen: number;
    daemon_sftp: number;
    daemon_base: string;
    created_at: string;
    updated_at: string;
}

export interface PterodactylAllocation {
    id: number;
    ip: string;
    ip_alias: string | null;
    port: number;
    notes: string | null;
    assigned: boolean;
}

export class PterodactylAdminAPI {
    private client: AxiosInstance;
    private baseURL: string;
    private adminApiKey: string;

    constructor() {
        this.baseURL = process.env.PTERODACTYL_URL || '';
        this.adminApiKey = process.env.PTERODACTYL_ADMIN_API_KEY || '';

        if (!this.baseURL || !this.adminApiKey) {
            Logger.warn('⚠️ Pterodactyl Admin API credentials not configured');
        }

        this.client = axios.create({
            baseURL: `${this.baseURL}/api/application`,
            headers: {
                'Authorization': `Bearer ${this.adminApiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000 // Longer timeout for admin operations
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                Logger.error('Pterodactyl Admin API Error:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
                throw error;
            }
        );
    }

    // User Management Methods
    async createUser(userData: CreateUserRequest): Promise<PterodactylUser> {
        try {
            Logger.info(`🔧 Creating Pterodactyl user: ${userData.username}`);
            
            const response = await this.client.post('/users', userData);
            const user = response.data.attributes;
            
            Logger.info(`✅ User created successfully: ${user.username} (ID: ${user.id})`);
            return user;
        } catch (error) {
            Logger.error(`❌ Failed to create user ${userData.username}:`, error);
            throw new Error(`Failed to create user: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
        }
    }

    async getUser(userId: number): Promise<PterodactylUser> {
        try {
            const response = await this.client.get(`/users/${userId}`);
            return response.data.attributes;
        } catch (error) {
            Logger.error(`❌ Failed to get user ${userId}:`, error);
            throw new Error('Failed to retrieve user information');
        }
    }

    async getUserByEmail(email: string): Promise<PterodactylUser | null> {
        try {
            const response = await this.client.get(`/users?filter[email]=${email}`);
            const users = response.data.data;
            return users.length > 0 ? users[0].attributes : null;
        } catch (error) {
            Logger.error(`❌ Failed to find user by email ${email}:`, error);
            return null;
        }
    }

    async updateUser(userId: number, userData: Partial<CreateUserRequest>): Promise<PterodactylUser> {
        try {
            const response = await this.client.patch(`/users/${userId}`, userData);
            return response.data.attributes;
        } catch (error) {
            Logger.error(`❌ Failed to update user ${userId}:`, error);
            throw new Error('Failed to update user');
        }
    }

    async deleteUser(userId: number): Promise<void> {
        try {
            await this.client.delete(`/users/${userId}`);
            Logger.info(`🗑️ User ${userId} deleted successfully`);
        } catch (error) {
            Logger.error(`❌ Failed to delete user ${userId}:`, error);
            throw new Error('Failed to delete user');
        }
    }

    // Server Management Methods
    async createServer(serverData: CreateServerRequest): Promise<PterodactylServer> {
        try {
            Logger.info(`🔧 Creating Pterodactyl server: ${serverData.name}`);
            
            const response = await this.client.post('/servers', serverData);
            const server = response.data.attributes;
            
            Logger.info(`✅ Server created successfully: ${server.name} (ID: ${server.id}, UUID: ${server.uuid})`);
            return server;
        } catch (error) {
            Logger.error(`❌ Failed to create server ${serverData.name}:`, error);
            throw new Error(`Failed to create server: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
        }
    }

    async getServer(serverId: number): Promise<PterodactylServer> {
        try {
            const response = await this.client.get(`/servers/${serverId}`);
            return response.data.attributes;
        } catch (error) {
            Logger.error(`❌ Failed to get server ${serverId}:`, error);
            throw new Error('Failed to retrieve server information');
        }
    }

    async updateServer(serverId: number, serverData: Partial<CreateServerRequest>): Promise<PterodactylServer> {
        try {
            const response = await this.client.patch(`/servers/${serverId}/details`, serverData);
            return response.data.attributes;
        } catch (error) {
            Logger.error(`❌ Failed to update server ${serverId}:`, error);
            throw new Error('Failed to update server');
        }
    }

    async deleteServer(serverId: number): Promise<void> {
        try {
            await this.client.delete(`/servers/${serverId}`);
            Logger.info(`🗑️ Server ${serverId} deleted successfully`);
        } catch (error) {
            Logger.error(`❌ Failed to delete server ${serverId}:`, error);
            throw new Error('Failed to delete server');
        }
    }

    async suspendServer(serverId: number): Promise<void> {
        try {
            await this.client.post(`/servers/${serverId}/suspend`);
            Logger.info(`⏸️ Server ${serverId} suspended`);
        } catch (error) {
            Logger.error(`❌ Failed to suspend server ${serverId}:`, error);
            throw new Error('Failed to suspend server');
        }
    }

    async unsuspendServer(serverId: number): Promise<void> {
        try {
            await this.client.post(`/servers/${serverId}/unsuspend`);
            Logger.info(`▶️ Server ${serverId} unsuspended`);
        } catch (error) {
            Logger.error(`❌ Failed to unsuspend server ${serverId}:`, error);
            throw new Error('Failed to unsuspend server');
        }
    }

    // Node and Resource Management
    async getNodes(): Promise<PterodactylNode[]> {
        try {
            const response = await this.client.get('/nodes');
            return response.data.data.map((node: any) => node.attributes);
        } catch (error) {
            Logger.error('❌ Failed to get nodes:', error);
            throw new Error('Failed to retrieve nodes');
        }
    }

    async getNode(nodeId: number): Promise<PterodactylNode> {
        try {
            const response = await this.client.get(`/nodes/${nodeId}`);
            return response.data.attributes;
        } catch (error) {
            Logger.error(`❌ Failed to get node ${nodeId}:`, error);
            throw new Error('Failed to retrieve node information');
        }
    }

    async getNodeAllocations(nodeId: number): Promise<PterodactylAllocation[]> {
        try {
            const response = await this.client.get(`/nodes/${nodeId}/allocations`);
            return response.data.data.map((allocation: any) => allocation.attributes);
        } catch (error) {
            Logger.error(`❌ Failed to get allocations for node ${nodeId}:`, error);
            throw new Error('Failed to retrieve node allocations');
        }
    }

    async createAllocation(nodeId: number, ip: string, ports: string[]): Promise<void> {
        try {
            await this.client.post(`/nodes/${nodeId}/allocations`, {
                ip: ip,
                ports: ports
            });
            Logger.info(`✅ Created allocations for node ${nodeId}: ${ports.join(', ')}`);
        } catch (error) {
            Logger.error(`❌ Failed to create allocations for node ${nodeId}:`, error);
            throw new Error('Failed to create allocations');
        }
    }

    // Utility Methods
    isConfigured(): boolean {
        return !!(this.baseURL && this.adminApiKey);
    }

    async healthCheck(): Promise<boolean> {
        if (!this.isConfigured()) {
            Logger.warn('⚠️ Admin API not configured');
            return false;
        }

        try {
            await this.client.get('/users?per_page=1');
            Logger.info('✅ Admin API health check passed');
            return true;
        } catch (error) {
            Logger.error('❌ Admin API health check failed:', error);
            return false;
        }
    }

    async getServerStats(): Promise<any> {
        try {
            const response = await this.client.get('/servers');
            const servers = response.data.data;
            
            return {
                total_servers: servers.length,
                suspended_servers: servers.filter((s: any) => s.attributes.suspended).length,
                active_servers: servers.filter((s: any) => !s.attributes.suspended).length
            };
        } catch (error) {
            Logger.error('❌ Failed to get server stats:', error);
            throw new Error('Failed to retrieve server statistics');
        }
    }
}