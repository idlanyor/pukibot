import { PterodactylAdminAPI, PterodactylServer } from './PterodactylAdminAPI';
import { PterodactylAPI, ServerInfo, ServerStats } from './pterodactylAPI';
import { OrderManager } from '../plugins/store/OrderManager';
import { Order, OrderStatus } from '../plugins/store/models/Order';
import { Logger } from '../utils/logger';

export interface ServerStatus {
    serverId: string;
    serverUuid: string;
    name: string;
    status: string;
    suspended: boolean;
    orderId?: string;
    customer?: string;
    packageType?: string;
    createdAt: Date;
    expiryDate?: Date;
    daysUntilExpiry?: number;
    resources?: {
        memory_bytes: number;
        cpu_absolute: number;
        disk_bytes: number;
        uptime: number;
    };
    limits: {
        memory: number;
        disk: number;
        cpu: number;
    };
}

export interface MonitoringStats {
    totalServers: number;
    activeServers: number;
    suspendedServers: number;
    expiringSoon: number; // expires in 7 days
    expiredServers: number;
    serversByStatus: Record<string, number>;
    resourceUsage: {
        totalMemoryMB: number;
        usedMemoryMB: number;
        totalDiskMB: number;
        usedDiskMB: number;
        averageCpuUsage: number;
    };
}

export class ServerMonitoringService {
    private static instance: ServerMonitoringService;
    private adminAPI: PterodactylAdminAPI;
    private clientAPI: PterodactylAPI;
    private orderManager: OrderManager;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private serverCache: Map<string, ServerStatus> = new Map();
    private lastUpdate: Date = new Date();

    private constructor() {
        this.adminAPI = new PterodactylAdminAPI();
        this.clientAPI = new PterodactylAPI();
        this.orderManager = new OrderManager();
    }

    public static getInstance(): ServerMonitoringService {
        if (!ServerMonitoringService.instance) {
            ServerMonitoringService.instance = new ServerMonitoringService();
        }
        return ServerMonitoringService.instance;
    }

    /**
     * Start monitoring service with specified interval
     */
    async startMonitoring(intervalMinutes: number = 5): Promise<void> {
        if (this.monitoringInterval) {
            Logger.info('📊 Server monitoring is already running');
            return;
        }

        Logger.info(`🔍 Starting server monitoring with ${intervalMinutes} minute intervals`);
        
        // Initial scan
        await this.scanAllServers();
        
        // Set up periodic monitoring
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.scanAllServers();
            } catch (error) {
                Logger.error('❌ Error during periodic server scan:', error);
            }
        }, intervalMinutes * 60 * 1000);

        Logger.info('✅ Server monitoring started successfully');
    }

    /**
     * Stop monitoring service
     */
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            Logger.info('⏹️ Server monitoring stopped');
        }
    }

    /**
     * Scan all servers from Pterodactyl and sync with orders
     */
    async scanAllServers(): Promise<ServerStatus[]> {
        try {
            Logger.info('🔍 Scanning all servers from Pterodactyl...');
            
            if (!this.adminAPI.isConfigured()) {
                throw new Error('Pterodactyl Admin API is not configured');
            }

            // Get all servers from Pterodactyl
            const response = await this.adminAPI['client'].get('/servers');
            const pterodactylServers = response.data.data.map((server: any) => server.attributes);

            const serverStatuses: ServerStatus[] = [];
            
            for (const server of pterodactylServers) {
                try {
                    const serverStatus = await this.buildServerStatus(server);
                    serverStatuses.push(serverStatus);
                    this.serverCache.set(server.uuid, serverStatus);
                } catch (error) {
                    Logger.error(`❌ Error processing server ${server.name}:`, error);
                }
            }

            this.lastUpdate = new Date();
            Logger.info(`✅ Scanned ${serverStatuses.length} servers successfully`);
            
            return serverStatuses;
        } catch (error) {
            Logger.error('❌ Failed to scan servers:', error);
            throw error;
        }
    }

    /**
     * Get real-time server list with current status
     */
    async getServerList(forceRefresh: boolean = false): Promise<ServerStatus[]> {
        if (forceRefresh || this.serverCache.size === 0) {
            return await this.scanAllServers();
        }
        
        return Array.from(this.serverCache.values());
    }

    /**
     * Get server by UUID
     */
    async getServer(serverUuid: string, forceRefresh: boolean = false): Promise<ServerStatus | null> {
        if (forceRefresh || !this.serverCache.has(serverUuid)) {
            await this.scanAllServers();
        }
        
        return this.serverCache.get(serverUuid) || null;
    }

    /**
     * Get servers by customer phone number
     */
    async getServersByCustomer(customerPhone: string): Promise<ServerStatus[]> {
        const allServers = await this.getServerList();
        return allServers.filter(server => server.customer === customerPhone);
    }

    /**
     * Get servers that are expiring soon (within 7 days)
     */
    async getExpiringSoonServers(daysThreshold: number = 7): Promise<ServerStatus[]> {
        const allServers = await this.getServerList();
        return allServers.filter(server => 
            server.daysUntilExpiry !== undefined && 
            server.daysUntilExpiry <= daysThreshold && 
            server.daysUntilExpiry > 0
        );
    }

    /**
     * Get expired servers that should be suspended
     */
    async getExpiredServers(): Promise<ServerStatus[]> {
        const allServers = await this.getServerList();
        return allServers.filter(server => 
            server.daysUntilExpiry !== undefined && 
            server.daysUntilExpiry <= 0 &&
            !server.suspended
        );
    }

    /**
     * Get monitoring statistics
     */
    async getMonitoringStats(): Promise<MonitoringStats> {
        const allServers = await this.getServerList();
        
        const stats: MonitoringStats = {
            totalServers: allServers.length,
            activeServers: allServers.filter(s => !s.suspended).length,
            suspendedServers: allServers.filter(s => s.suspended).length,
            expiringSoon: allServers.filter(s => s.daysUntilExpiry !== undefined && s.daysUntilExpiry <= 7 && s.daysUntilExpiry > 0).length,
            expiredServers: allServers.filter(s => s.daysUntilExpiry !== undefined && s.daysUntilExpiry <= 0).length,
            serversByStatus: {},
            resourceUsage: {
                totalMemoryMB: 0,
                usedMemoryMB: 0,
                totalDiskMB: 0,
                usedDiskMB: 0,
                averageCpuUsage: 0
            }
        };

        // Count servers by status
        allServers.forEach(server => {
            const status = server.suspended ? 'suspended' : server.status;
            stats.serversByStatus[status] = (stats.serversByStatus[status] || 0) + 1;
        });

        // Calculate resource usage
        let totalCpuUsage = 0;
        let serversWithResources = 0;

        allServers.forEach(server => {
            stats.resourceUsage.totalMemoryMB += server.limits.memory;
            stats.resourceUsage.totalDiskMB += server.limits.disk;
            
            if (server.resources) {
                stats.resourceUsage.usedMemoryMB += Math.round(server.resources.memory_bytes / 1024 / 1024);
                stats.resourceUsage.usedDiskMB += Math.round(server.resources.disk_bytes / 1024 / 1024);
                totalCpuUsage += server.resources.cpu_absolute;
                serversWithResources++;
            }
        });

        if (serversWithResources > 0) {
            stats.resourceUsage.averageCpuUsage = totalCpuUsage / serversWithResources;
        }

        return stats;
    }

    /**
     * Build server status from Pterodactyl server data
     */
    private async buildServerStatus(pterodactylServer: PterodactylServer): Promise<ServerStatus> {
        const serverStatus: ServerStatus = {
            serverId: pterodactylServer.id.toString(),
            serverUuid: pterodactylServer.uuid,
            name: pterodactylServer.name,
            status: 'unknown',
            suspended: pterodactylServer.suspended,
            createdAt: new Date(pterodactylServer.created_at),
            limits: {
                memory: pterodactylServer.limits.memory,
                disk: pterodactylServer.limits.disk,
                cpu: pterodactylServer.limits.cpu
            }
        };

        try {
            // Try to get real-time server stats
            if (this.clientAPI.isConfigured()) {
                try {
                    const stats = await this.clientAPI.getServerStats(pterodactylServer.uuid);
                    serverStatus.status = stats.current_state;
                    serverStatus.resources = stats.resources;
                } catch (error) {
                    // If client API fails, use basic status
                    serverStatus.status = pterodactylServer.suspended ? 'suspended' : 'offline';
                }
            }

            // Try to match with order data
            const orderId = this.extractOrderIdFromServerName(pterodactylServer.name);
            if (orderId) {
                const order = await this.orderManager.getOrder(orderId);
                if (order) {
                    serverStatus.orderId = order.id;
                    serverStatus.customer = order.customer.phoneNumber;
                    serverStatus.packageType = order.item.packageType;
                    
                    // Calculate expiry date based on order
                    const expiryDate = new Date(order.createdAt);
                    expiryDate.setMonth(expiryDate.getMonth() + order.item.duration);
                    serverStatus.expiryDate = expiryDate;
                    
                    const now = new Date();
                    const timeDiff = expiryDate.getTime() - now.getTime();
                    serverStatus.daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
                }
            }
        } catch (error) {
            Logger.error(`❌ Error building server status for ${pterodactylServer.name}:`, error);
        }

        return serverStatus;
    }

    /**
     * Extract order ID from server name (assuming format like "PACKAGE-ORDERID")
     */
    private extractOrderIdFromServerName(serverName: string): string | null {
        const match = serverName.match(/^[A-Z0-9_]+-(.+)$/);
        return match ? match[1] : null;
    }

    /**
     * Get cache status
     */
    getCacheInfo(): { lastUpdate: Date; cachedServers: number } {
        return {
            lastUpdate: this.lastUpdate,
            cachedServers: this.serverCache.size
        };
    }

    /**
     * Clear cache and force refresh
     */
    clearCache(): void {
        this.serverCache.clear();
        Logger.info('🗑️ Server cache cleared');
    }

    /**
     * Check if monitoring is active
     */
    isMonitoring(): boolean {
        return this.monitoringInterval !== null;
    }

    /**
     * Get servers filtered by various criteria
     */
    async getServersFiltered(filters: {
        status?: string;
        suspended?: boolean;
        packageType?: string;
        customer?: string;
        expiring?: boolean;
        expired?: boolean;
    }): Promise<ServerStatus[]> {
        let servers = await this.getServerList();

        if (filters.status) {
            servers = servers.filter(s => s.status === filters.status);
        }

        if (filters.suspended !== undefined) {
            servers = servers.filter(s => s.suspended === filters.suspended);
        }

        if (filters.packageType) {
            servers = servers.filter(s => s.packageType === filters.packageType);
        }

        if (filters.customer) {
            servers = servers.filter(s => s.customer === filters.customer);
        }

        if (filters.expiring) {
            servers = servers.filter(s => s.daysUntilExpiry !== undefined && s.daysUntilExpiry <= 7 && s.daysUntilExpiry > 0);
        }

        if (filters.expired) {
            servers = servers.filter(s => s.daysUntilExpiry !== undefined && s.daysUntilExpiry <= 0);
        }

        return servers;
    }

    /**
     * Get server status by server ID (alias for getServer)
     */
    async getServerStatus(serverId: string): Promise<ServerStatus | null> {
        // Try to find by server ID first
        const allServers = await this.getServerList();
        const serverByServerId = allServers.find(s => s.serverId === serverId);
        
        if (serverByServerId) {
            return serverByServerId;
        }
        
        // If not found by server ID, try by UUID
        return await this.getServer(serverId);
    }

    /**
     * Get all servers (alias for getServerList)
     */
    async getAllServers(): Promise<ServerStatus[]> {
        return await this.getServerList();
    }
}