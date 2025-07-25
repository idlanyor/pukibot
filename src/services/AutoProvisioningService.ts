import { PterodactylAdminAPI, CreateUserRequest, CreateServerRequest, PterodactylUser, PterodactylServer } from './PterodactylAdminAPI';
import { Order, PackageType, OrderStatus } from '../plugins/store/models/Order';
import { Logger } from '../utils/logger';

export interface ProvisioningResult {
    success: boolean;
    user?: PterodactylUser;
    server?: PterodactylServer;
    credentials?: {
        username: string;
        password: string;
        email: string;
        panelUrl: string;
        serverId: string;
        serverName: string;
    };
    error?: string;
    rollbackActions?: string[];
}

export interface ResourceMapping {
    egg: number;
    dockerImage: string;
    startup: string;
    environment: Record<string, any>;
    limits: {
        memory: number;
        swap: number;
        disk: number;
        io: number;
        cpu: number;
    };
    featureLimits: {
        databases: number;
        allocations: number;
        backups: number;
    };
    node: number;
}

export class AutoProvisioningService {
    private static instance: AutoProvisioningService;
    private adminAPI: PterodactylAdminAPI;
    private resourceMappings: Record<PackageType, ResourceMapping>;

    private constructor() {
        this.adminAPI = new PterodactylAdminAPI();
        this.initializeResourceMappings();
    }

    public static getInstance(): AutoProvisioningService {
        if (!AutoProvisioningService.instance) {
            AutoProvisioningService.instance = new AutoProvisioningService();
        }
        return AutoProvisioningService.instance;
    }

    private initializeResourceMappings(): void {
        // Helper function to create resource configuration for each tier
        const createNodeJSConfig = (tier: string, memory: number, disk: number, cpu: number, features: { databases: number, allocations: number, backups: number }) => ({
            egg: parseInt(process.env[`NODEJS_${tier.toUpperCase()}_EGG_ID`] || '15'), // NodeJS VIP
            dockerImage: process.env[`NODEJS_${tier.toUpperCase()}_DOCKER_IMAGE`] || 'ghcr.io/shirokamiryzen/yolks:nodejs_22',
            startup: process.env[`NODEJS_${tier.toUpperCase()}_STARTUP`] || 'if [[ -d .git ]] && [[ "{{AUTO_UPDATE}}" == "1" ]]; then git remote set-url origin https://${USERNAME}:${ACCESS_TOKEN}@${GIT_ADDRESS} && git pull; fi; /usr/local/bin/npm install && /usr/local/bin/node --max-old-space-size=${SERVER_MEMORY} "/home/container/${MAIN_FILE}"',
            environment: {
                MAIN_FILE: 'index.js',
                AUTO_UPDATE: '0',
                GIT_ADDRESS: '',
                USERNAME: '',
                ACCESS_TOKEN: ''
            },
            limits: { memory, swap: 0, disk, io: 500, cpu },
            featureLimits: features,
            node: parseInt(process.env.DEFAULT_NODE_ID || '1')
        });

        const createVPSConfig = (tier: string, memory: number, disk: number, cpu: number, features: { databases: number, allocations: number, backups: number }) => ({
            egg: parseInt(process.env[`VPS_${tier.toUpperCase()}_EGG_ID`] || '16'), // VPS Egg
            dockerImage: process.env[`VPS_${tier.toUpperCase()}_DOCKER_IMAGE`] || 'quay.io/ydrag0n/pterodactyl-vps-egg',
            startup: process.env[`VPS_${tier.toUpperCase()}_STARTUP`] || 'bash /run.sh',
            environment: {
                VPS_USER: 'root',
                VPS_PASSWORD: 'changeme123',
                VPS_SSH_PORT: '22'
            },
            limits: { memory, swap: 0, disk, io: 500, cpu },
            featureLimits: features,
            node: parseInt(process.env.DEFAULT_NODE_ID || '1')
        });

        const createPythonConfig = (tier: string, memory: number, disk: number, cpu: number, features: { databases: number, allocations: number, backups: number }) => ({
            egg: parseInt(process.env[`PYTHON_${tier.toUpperCase()}_EGG_ID`] || '17'), // Python Generic
            dockerImage: process.env[`PYTHON_${tier.toUpperCase()}_DOCKER_IMAGE`] || 'ghcr.io/parkervcp/yolks:python_3.12',
            startup: process.env[`PYTHON_${tier.toUpperCase()}_STARTUP`] || 'if [[ -d .git ]] && [[ "{{AUTO_UPDATE}}" == "1" ]]; then git pull; fi; if [[ ! -z "{{PY_PACKAGES}}" ]]; then pip install -U --prefix .local {{PY_PACKAGES}}; fi; if [[ -f /home/container/${REQUIREMENTS_FILE} ]]; then pip install -U --prefix .local -r ${REQUIREMENTS_FILE}; fi; /usr/local/bin/python /home/container/{{PY_FILE}}',
            environment: {
                PY_FILE: 'main.py',
                AUTO_UPDATE: '0',
                PY_PACKAGES: '',
                REQUIREMENTS_FILE: 'requirements.txt'
            },
            limits: { memory, swap: 0, disk, io: 500, cpu },
            featureLimits: features,
            node: parseInt(process.env.DEFAULT_NODE_ID || '1')
        });

        // Default resource mappings - 18 packages total (3 eggs × 6 tiers)
        this.resourceMappings = {
            // NodeJS VIP Packages (A1-A6)
            [PackageType.A1]: createNodeJSConfig('a1', 512, 2048, 50, { databases: 1, allocations: 1, backups: 1 }),
            [PackageType.A2]: createNodeJSConfig('a2', 1024, 4096, 100, { databases: 1, allocations: 1, backups: 2 }),
            [PackageType.A3]: createNodeJSConfig('a3', 2048, 8192, 150, { databases: 2, allocations: 2, backups: 3 }),
            [PackageType.A4]: createNodeJSConfig('a4', 4096, 16384, 200, { databases: 3, allocations: 3, backups: 5 }),
            [PackageType.A5]: createNodeJSConfig('a5', 8192, 32768, 300, { databases: 5, allocations: 5, backups: 7 }),
            [PackageType.A6]: createNodeJSConfig('a6', 16384, 65536, 500, { databases: 10, allocations: 10, backups: 10 }),

            // VPS Packages (B1-B6)
            [PackageType.B1]: createVPSConfig('b1', 1024, 5120, 100, { databases: 1, allocations: 1, backups: 1 }),
            [PackageType.B2]: createVPSConfig('b2', 2048, 10240, 150, { databases: 2, allocations: 2, backups: 2 }),
            [PackageType.B3]: createVPSConfig('b3', 4096, 20480, 200, { databases: 3, allocations: 3, backups: 3 }),
            [PackageType.B4]: createVPSConfig('b4', 8192, 40960, 300, { databases: 5, allocations: 5, backups: 5 }),
            [PackageType.B5]: createVPSConfig('b5', 16384, 81920, 500, { databases: 7, allocations: 7, backups: 7 }),
            [PackageType.B6]: createVPSConfig('b6', 32768, 163840, 800, { databases: 10, allocations: 10, backups: 10 }),

            // Python Packages (C1-C6)
            [PackageType.C1]: createPythonConfig('c1', 512, 2048, 50, { databases: 1, allocations: 1, backups: 1 }),
            [PackageType.C2]: createPythonConfig('c2', 1024, 4096, 100, { databases: 1, allocations: 1, backups: 2 }),
            [PackageType.C3]: createPythonConfig('c3', 2048, 8192, 150, { databases: 2, allocations: 2, backups: 3 }),
            [PackageType.C4]: createPythonConfig('c4', 4096, 16384, 200, { databases: 3, allocations: 3, backups: 5 }),
            [PackageType.C5]: createPythonConfig('c5', 8192, 32768, 300, { databases: 5, allocations: 5, backups: 7 }),
            [PackageType.C6]: createPythonConfig('c6', 16384, 65536, 500, { databases: 10, allocations: 10, backups: 10 }),

            // Legacy packages (for backward compatibility)
            [PackageType.NODEJS_KROCO]: createNodeJSConfig('nodejs_kroco', 512, 2048, 50, { databases: 1, allocations: 1, backups: 1 }),
            [PackageType.NODEJS_KARBIT]: createNodeJSConfig('nodejs_karbit', 1024, 4096, 100, { databases: 1, allocations: 1, backups: 2 }),
            [PackageType.NODEJS_STANDAR]: createNodeJSConfig('nodejs_standar', 2048, 8192, 150, { databases: 2, allocations: 2, backups: 3 }),
            [PackageType.NODEJS_SEPUH]: createNodeJSConfig('nodejs_sepuh', 4096, 16384, 200, { databases: 3, allocations: 3, backups: 5 }),
            [PackageType.NODEJS_SUHU]: createNodeJSConfig('nodejs_suhu', 8192, 32768, 300, { databases: 5, allocations: 5, backups: 7 }),
            [PackageType.NODEJS_PRO_MAX]: createNodeJSConfig('nodejs_pro_max', 16384, 65536, 500, { databases: 10, allocations: 10, backups: 10 }),
            [PackageType.VPS_KROCO]: createVPSConfig('vps_kroco', 1024, 5120, 100, { databases: 1, allocations: 1, backups: 1 }),
            [PackageType.VPS_KARBIT]: createVPSConfig('vps_karbit', 2048, 10240, 150, { databases: 2, allocations: 2, backups: 2 }),
            [PackageType.VPS_STANDAR]: createVPSConfig('vps_standar', 4096, 20480, 200, { databases: 3, allocations: 3, backups: 3 }),
            [PackageType.VPS_SEPUH]: createVPSConfig('vps_sepuh', 8192, 40960, 300, { databases: 5, allocations: 5, backups: 5 }),
            [PackageType.VPS_SUHU]: createVPSConfig('vps_suhu', 16384, 81920, 500, { databases: 7, allocations: 7, backups: 7 }),
            [PackageType.VPS_PRO_MAX]: createVPSConfig('vps_pro_max', 32768, 163840, 800, { databases: 10, allocations: 10, backups: 10 }),
            [PackageType.PYTHON_KROCO]: createPythonConfig('python_kroco', 512, 2048, 50, { databases: 1, allocations: 1, backups: 1 }),
            [PackageType.PYTHON_KARBIT]: createPythonConfig('python_karbit', 1024, 4096, 100, { databases: 1, allocations: 1, backups: 2 }),
            [PackageType.PYTHON_STANDAR]: createPythonConfig('python_standar', 2048, 8192, 150, { databases: 2, allocations: 2, backups: 3 }),
            [PackageType.PYTHON_SEPUH]: createPythonConfig('python_sepuh', 4096, 16384, 200, { databases: 3, allocations: 3, backups: 5 }),
            [PackageType.PYTHON_SUHU]: createPythonConfig('python_suhu', 8192, 32768, 300, { databases: 5, allocations: 5, backups: 7 }),
            [PackageType.PYTHON_PRO_MAX]: createPythonConfig('python_pro_max', 16384, 65536, 500, { databases: 10, allocations: 10, backups: 10 }),
            [PackageType.BRONZE]: createNodeJSConfig('bronze', 1024, 5120, 100, { databases: 1, allocations: 1, backups: 1 }),
            [PackageType.SILVER]: createVPSConfig('silver', 2048, 10240, 200, { databases: 2, allocations: 2, backups: 2 }),
            [PackageType.GOLD]: createPythonConfig('gold', 4096, 20480, 400, { databases: 3, allocations: 3, backups: 3 }),
            [PackageType.PLATINUM]: createNodeJSConfig('platinum', 8192, 40960, 800, { databases: 5, allocations: 5, backups: 5 }),
            [PackageType.DIAMOND]: createVPSConfig('diamond', 16384, 81920, 1600, { databases: 10, allocations: 10, backups: 10 })
        };
    }

    async provisionServer(order: Order): Promise<ProvisioningResult> {
        const result: ProvisioningResult = {
            success: false,
            rollbackActions: []
        };

        try {
            Logger.info(`🔧 Starting auto-provisioning for order ${order.id}`);

            // Check if admin API is configured
            if (!this.adminAPI.isConfigured()) {
                throw new Error('Pterodactyl Admin API is not configured');
            }

            // Health check
            const healthCheck = await this.adminAPI.healthCheck();
            if (!healthCheck) {
                throw new Error('Pterodactyl Admin API health check failed');
            }

            // Step 1: Generate user credentials
            const password = this.generateSecurePassword();
            const username = this.generateUsername(order.customer.phoneNumber);
            const email = this.generateEmail(order.customer.phoneNumber);

            // Step 2: Create user
            Logger.info(`👤 Creating user for order ${order.id}: ${username}`);
            const userData: CreateUserRequest = {
                email: email,
                username: username,
                first_name: order.customer.name || 'Customer',
                last_name: `#${order.id}`,
                password: password,
                root_admin: false,
                language: 'en'
            };

            const user = await this.adminAPI.createUser(userData);
            result.user = user;
            result.rollbackActions!.push(`Delete user ${user.id}`);

            Logger.info(`✅ User created successfully: ${user.username} (ID: ${user.id})`);

            // Step 3: Get resource mapping
            const resourceMapping = this.getResourceMapping(order.item.packageType);
            if (!resourceMapping) {
                throw new Error(`No resource mapping found for package type: ${order.item.packageType}`);
            }

            // Step 4: Find available allocation
            const allocation = await this.findAvailableAllocation(resourceMapping.node);
            if (!allocation) {
                throw new Error(`No available allocations found for node ${resourceMapping.node}`);
            }

            // Step 5: Create server
            Logger.info(`🖥️ Creating server for order ${order.id}`);
            const serverName = `${order.item.packageType.toUpperCase()}-${order.id}`;
            const serverData: CreateServerRequest = {
                name: serverName,
                description: `Auto-provisioned server for order ${order.id}`,
                user: user.id,
                egg: resourceMapping.egg,
                docker_image: resourceMapping.dockerImage,
                startup: resourceMapping.startup,
                environment: resourceMapping.environment,
                limits: resourceMapping.limits,
                feature_limits: resourceMapping.featureLimits,
                allocation: {
                    default: allocation.id
                }
            };

            const server = await this.adminAPI.createServer(serverData);
            result.server = server;
            result.rollbackActions!.push(`Delete server ${server.id}`);

            Logger.info(`✅ Server created successfully: ${server.name} (ID: ${server.id})`);

            // Step 6: Prepare credentials
            result.credentials = {
                username: username,
                password: password,
                email: email,
                panelUrl: process.env.PTERODACTYL_URL || '',
                serverId: server.uuid,
                serverName: server.name
            };

            result.success = true;
            Logger.info(`🎉 Auto-provisioning completed successfully for order ${order.id}`);

            return result;

        } catch (error) {
            Logger.error(`❌ Auto-provisioning failed for order ${order.id}:`, error);
            result.error = error.message;

            // Attempt rollback
            if (result.rollbackActions && result.rollbackActions.length > 0) {
                Logger.info(`🔄 Attempting rollback for order ${order.id}`);
                await this.performRollback(result.rollbackActions);
            }

            return result;
        }
    }

    private async performRollback(actions: string[]): Promise<void> {
        for (const action of actions.reverse()) {
            try {
                Logger.info(`🔄 Rollback action: ${action}`);
                
                if (action.includes('Delete user')) {
                    const userId = parseInt(action.split(' ')[2]);
                    await this.adminAPI.deleteUser(userId);
                } else if (action.includes('Delete server')) {
                    const serverId = parseInt(action.split(' ')[2]);
                    await this.adminAPI.deleteServer(serverId);
                }
            } catch (error) {
                Logger.error(`❌ Rollback action failed: ${action}`, error);
            }
        }
    }

    private generateSecurePassword(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    private generateUsername(phoneNumber: string): string {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const timestamp = Date.now().toString().slice(-6);
        return `user_${cleanPhone.slice(-8)}_${timestamp}`;
    }

    private generateEmail(phoneNumber: string): string {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const domain = process.env.PTERODACTYL_EMAIL_DOMAIN || 'example.com';
        return `${cleanPhone}@${domain}`;
    }

    private getResourceMapping(packageType: PackageType): ResourceMapping | null {
        return this.resourceMappings[packageType] || null;
    }

    private async findAvailableAllocation(nodeId: number): Promise<any> {
        try {
            const allocations = await this.adminAPI.getNodeAllocations(nodeId);
            const availableAllocation = allocations.find(allocation => !allocation.assigned);
            
            if (!availableAllocation) {
                // Try to create new allocations if none available
                const node = await this.adminAPI.getNode(nodeId);
                const basePort = parseInt(process.env.BASE_PORT || '25565');
                const portsToCreate = [];
                
                for (let i = 0; i < 10; i++) {
                    portsToCreate.push((basePort + i).toString());
                }
                
                await this.adminAPI.createAllocation(nodeId, node.fqdn, portsToCreate);
                
                // Try again after creating allocations
                const newAllocations = await this.adminAPI.getNodeAllocations(nodeId);
                return newAllocations.find(allocation => !allocation.assigned);
            }
            
            return availableAllocation;
        } catch (error) {
            Logger.error(`❌ Failed to find available allocation for node ${nodeId}:`, error);
            return null;
        }
    }

    async retryProvisioning(order: Order): Promise<ProvisioningResult> {
        Logger.info(`🔄 Retrying provisioning for order ${order.id}`);
        return await this.provisionServer(order);
    }

    async testConnection(): Promise<boolean> {
        try {
            if (!this.adminAPI.isConfigured()) {
                Logger.warn('⚠️ Auto-provisioning not configured');
                return false;
            }

            const healthCheck = await this.adminAPI.healthCheck();
            if (healthCheck) {
                Logger.info('✅ Auto-provisioning service is ready');
                return true;
            } else {
                Logger.error('❌ Auto-provisioning service connection failed');
                return false;
            }
        } catch (error) {
            Logger.error('❌ Auto-provisioning service test failed:', error);
            return false;
        }
    }

    isConfigured(): boolean {
        return this.adminAPI.isConfigured();
    }

    getResourceMappings(): Record<PackageType, ResourceMapping> {
        return { ...this.resourceMappings };
    }

    updateResourceMapping(packageType: PackageType, mapping: Partial<ResourceMapping>): void {
        this.resourceMappings[packageType] = {
            ...this.resourceMappings[packageType],
            ...mapping
        };
        Logger.info(`📝 Updated resource mapping for ${packageType}`);
    }
}