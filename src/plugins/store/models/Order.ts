export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded'
}

export enum PackageType {
    // NodeJS VIP Packages (A1-A6)
    A1 = 'a1', // NodeJS Kroco
    A2 = 'a2', // NodeJS Karbit
    A3 = 'a3', // NodeJS Standar
    A4 = 'a4', // NodeJS Sepuh
    A5 = 'a5', // NodeJS Suhu
    A6 = 'a6', // NodeJS Pro Max

    // VPS Packages (B1-B6)
    B1 = 'b1', // VPS Kroco
    B2 = 'b2', // VPS Karbit
    B3 = 'b3', // VPS Standar
    B4 = 'b4', // VPS Sepuh
    B5 = 'b5', // VPS Suhu
    B6 = 'b6', // VPS Pro Max

    // Python Packages (C1-C6)
    C1 = 'c1', // Python Kroco
    C2 = 'c2', // Python Karbit
    C3 = 'c3', // Python Standar
    C4 = 'c4', // Python Sepuh
    C5 = 'c5', // Python Suhu
    C6 = 'c6', // Python Pro Max

    // Legacy packages (for backward compatibility)
    NODEJS_KROCO = 'nodejs_kroco',
    NODEJS_KARBIT = 'nodejs_karbit',
    NODEJS_STANDAR = 'nodejs_standar',
    NODEJS_SEPUH = 'nodejs_sepuh',
    NODEJS_SUHU = 'nodejs_suhu',
    NODEJS_PRO_MAX = 'nodejs_pro_max',
    VPS_KROCO = 'vps_kroco',
    VPS_KARBIT = 'vps_karbit',
    VPS_STANDAR = 'vps_standar',
    VPS_SEPUH = 'vps_sepuh',
    VPS_SUHU = 'vps_suhu',
    VPS_PRO_MAX = 'vps_pro_max',
    PYTHON_KROCO = 'python_kroco',
    PYTHON_KARBIT = 'python_karbit',
    PYTHON_STANDAR = 'python_standar',
    PYTHON_SEPUH = 'python_sepuh',
    PYTHON_SUHU = 'python_suhu',
    PYTHON_PRO_MAX = 'python_pro_max',
    BRONZE = 'bronze',
    SILVER = 'silver',
    GOLD = 'gold',
    PLATINUM = 'platinum',
    DIAMOND = 'diamond'
}

export interface OrderItem {
    packageType: PackageType;
    duration: number; // in months
    price: number;
    specifications: {
        ram: string;
        cpu: string;
        storage: string;
        bandwidth: string;
    };
}

export interface Customer {
    phoneNumber: string;
    displayName?: string;
    name?: string;
    chatId: string;
}

export interface Order {
    id: string;
    customer: Customer;
    item: OrderItem;
    status: OrderStatus;
    totalAmount: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
    statusHistory: OrderStatusHistory[];
    notes?: string;
    adminNotes?: string;
    paymentProof?: string;
    serverId?: string; // Pterodactyl server ID when created
    username?: string; // Custom username for Pterodactyl
}

export interface OrderStatusHistory {
    status: OrderStatus;
    timestamp: Date;
    updatedBy: string; // admin phone number or 'system'
    notes?: string;
}

export interface OrderFilter {
    status?: OrderStatus;
    packageType?: PackageType;
    customerPhone?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
}

export interface OrderStats {
    totalOrders: number;
    ordersByStatus: Record<OrderStatus, number>;
    ordersByPackage: Record<PackageType, number>;
    totalRevenue: number;
    averageOrderValue: number;
    ordersToday: number;
    ordersThisMonth: number;
}

export interface PackageInfo {
    type: PackageType;
    name: string;
    ram: string;
    cpu: string;
    price: number;
    storage: string;
    bandwidth: string;
    emoji: string;
}

export const PACKAGE_CATALOG: Record<PackageType, PackageInfo> = {
    // NodeJS VIP Packages (A1-A6)
    [PackageType.A1]: {
        type: PackageType.A1,
        name: 'A1 - NodeJS Kroco',
        ram: '1GB',
        cpu: '100% CPU',
        price: 5000,
        storage: '2GB',
        bandwidth: 'Unlimited',
        emoji: '🟢'
    },
    [PackageType.A2]: {
        type: PackageType.A2,
        name: 'A2 - NodeJS Karbit',
        ram: '2GB',
        cpu: '150% CPU',
        price: 7500,
        storage: '4GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟡'
    },
    [PackageType.A3]: {
        type: PackageType.A3,
        name: 'A3 - NodeJS Standar',
        ram: '4GB',
        cpu: '200% CPU',
        price: 10000,
        storage: '10GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟠'
    },
    [PackageType.A4]: {
        type: PackageType.A4,
        name: 'A4 - NodeJS Sepuh',
        ram: '5GB',
        cpu: '250% CPU',
        price: 12500,
        storage: '10GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🔴'
    },
    [PackageType.A5]: {
        type: PackageType.A5,
        name: 'A5 - NodeJS Suhu',
        ram: '8GB',
        cpu: '300% CPU',
        price: 15000,
        storage: '15GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟣'
    },
    [PackageType.A6]: {
        type: PackageType.A6,
        name: 'A6 - NodeJS Pro Max',
        ram: '16GB',
        cpu: '400% CPU',
        price: 20000,
        storage: '20GB SSD',
        bandwidth: 'Unlimited',
        emoji: '💎'
    },

    // VPS Packages (B1-B6)
    [PackageType.B1]: {
        type: PackageType.B1,
        name: 'B1 - VPS Kroco',
        ram: '1GB',
        cpu: '100% CPU',
        price: 7500,
        storage: '5GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟢'
    },
    [PackageType.B2]: {
        type: PackageType.B2,
        name: 'B2 - VPS Karbit',
        ram: '2GB',
        cpu: '150% CPU',
        price: 10000,
        storage: '10GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟡'
    },
    [PackageType.B3]: {
        type: PackageType.B3,
        name: 'B3 - VPS Standar',
        ram: '4GB',
        cpu: '200% CPU',
        price: 15000,
        storage: '20GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟠'
    },
    [PackageType.B4]: {
        type: PackageType.B4,
        name: 'B4 - VPS Sepuh',
        ram: '6GB',
        cpu: '250% CPU',
        price: 20000,
        storage: '30GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🔴'
    },
    [PackageType.B5]: {
        type: PackageType.B5,
        name: 'B5 - VPS Suhu',
        ram: '8GB',
        cpu: '300% CPU',
        price: 25000,
        storage: '40GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟣'
    },
    [PackageType.B6]: {
        type: PackageType.B6,
        name: 'B6 - VPS Pro Max',
        ram: '16GB',
        cpu: '400% CPU',
        price: 35000,
        storage: '80GB SSD',
        bandwidth: 'Unlimited',
        emoji: '💎'
    },

    // Python Packages (C1-C6)
    [PackageType.C1]: {
        type: PackageType.C1,
        name: 'C1 - Python Kroco',
        ram: '1GB',
        cpu: '100% CPU',
        price: 3000,
        storage: '2GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟢'
    },
    [PackageType.C2]: {
        type: PackageType.C2,
        name: 'C2 - Python Karbit',
        ram: '1GB',
        cpu: '150% CPU',
        price: 5000,
        storage: '4GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟡'
    },
    [PackageType.C3]: {
        type: PackageType.C3,
        name: 'C3 - Python Standar',
        ram: '2GB',
        cpu: '150% CPU',
        price: 7500,
        storage: '8GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟠'
    },
    [PackageType.C4]: {
        type: PackageType.C4,
        name: 'C4 - Python Sepuh',
        ram: '4GB',
        cpu: '200% CPU',
        price: 10000,
        storage: '16GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🔴'
    },
    [PackageType.C5]: {
        type: PackageType.C5,
        name: 'C5 - Python Suhu',
        ram: '6GB',
        cpu: '250% CPU',
        price: 12500,
        storage: '24GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟣'
    },
    [PackageType.C6]: {
        type: PackageType.C6,
        name: 'C6 - Python Pro Max',
        ram: '8GB',
        cpu: '300% CPU',
        price: 17500,
        storage: '32GB SSD',
        bandwidth: 'Unlimited',
        emoji: '💎'
    },

    // Legacy packages (for backward compatibility)
    [PackageType.NODEJS_KROCO]: {
        type: PackageType.NODEJS_KROCO,
        name: 'NodeJS Kroco',
        ram: '512MB',
        cpu: '0.5 CPU',
        price: 15000,
        storage: '2GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟢'
    },
    [PackageType.NODEJS_KARBIT]: {
        type: PackageType.NODEJS_KARBIT,
        name: 'NodeJS Karbit',
        ram: '1GB',
        cpu: '1 CPU',
        price: 5000,
        storage: '4GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟡'
    },
    [PackageType.NODEJS_STANDAR]: {
        type: PackageType.NODEJS_STANDAR,
        name: 'NodeJS Standar',
        ram: '2GB',
        cpu: '1.5 CPU',
        price: 7500,
        storage: '8GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟠'
    },
    [PackageType.NODEJS_SEPUH]: {
        type: PackageType.NODEJS_SEPUH,
        name: 'NodeJS Sepuh',
        ram: '4GB',
        cpu: '2 CPU',
        price: 10000,
        storage: '16GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🔴'
    },
    [PackageType.NODEJS_SUHU]: {
        type: PackageType.NODEJS_SUHU,
        name: 'NodeJS Suhu',
        ram: '8GB',
        cpu: '3 CPU',
        price: 15000,
        storage: '32GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟣'
    },
    [PackageType.NODEJS_PRO_MAX]: {
        type: PackageType.NODEJS_PRO_MAX,
        name: 'NodeJS Pro Max',
        ram: '16GB',
        cpu: '5 CPU',
        price: 20000,
        storage: '64GB SSD',
        bandwidth: 'Unlimited',
        emoji: '💎'
    },
    [PackageType.VPS_KROCO]: {
        type: PackageType.VPS_KROCO,
        name: 'VPS Kroco',
        ram: '1GB',
        cpu: '1 CPU',
        price: 20000,
        storage: '5GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟢'
    },
    [PackageType.VPS_KARBIT]: {
        type: PackageType.VPS_KARBIT,
        name: 'VPS Karbit',
        ram: '2GB',
        cpu: '1.5 CPU',
        price: 35000,
        storage: '10GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟡'
    },
    [PackageType.VPS_STANDAR]: {
        type: PackageType.VPS_STANDAR,
        name: 'VPS Standar',
        ram: '4GB',
        cpu: '2 CPU',
        price: 65000,
        storage: '20GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟠'
    },
    [PackageType.VPS_SEPUH]: {
        type: PackageType.VPS_SEPUH,
        name: 'VPS Sepuh',
        ram: '8GB',
        cpu: '3 CPU',
        price: 125000,
        storage: '40GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🔴'
    },
    [PackageType.VPS_SUHU]: {
        type: PackageType.VPS_SUHU,
        name: 'VPS Suhu',
        ram: '16GB',
        cpu: '5 CPU',
        price: 240000,
        storage: '80GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟣'
    },
    [PackageType.VPS_PRO_MAX]: {
        type: PackageType.VPS_PRO_MAX,
        name: 'VPS Pro Max',
        ram: '32GB',
        cpu: '8 CPU',
        price: 450000,
        storage: '160GB SSD',
        bandwidth: 'Unlimited',
        emoji: '💎'
    },
    [PackageType.PYTHON_KROCO]: {
        type: PackageType.PYTHON_KROCO,
        name: 'Python Kroco',
        ram: '512MB',
        cpu: '0.5 CPU',
        price: 12000,
        storage: '2GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟢'
    },
    [PackageType.PYTHON_KARBIT]: {
        type: PackageType.PYTHON_KARBIT,
        name: 'Python Karbit',
        ram: '1GB',
        cpu: '1 CPU',
        price: 22000,
        storage: '4GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟡'
    },
    [PackageType.PYTHON_STANDAR]: {
        type: PackageType.PYTHON_STANDAR,
        name: 'Python Standar',
        ram: '2GB',
        cpu: '1.5 CPU',
        price: 40000,
        storage: '8GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟠'
    },
    [PackageType.PYTHON_SEPUH]: {
        type: PackageType.PYTHON_SEPUH,
        name: 'Python Sepuh',
        ram: '4GB',
        cpu: '2 CPU',
        price: 75000,
        storage: '16GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🔴'
    },
    [PackageType.PYTHON_SUHU]: {
        type: PackageType.PYTHON_SUHU,
        name: 'Python Suhu',
        ram: '8GB',
        cpu: '3 CPU',
        price: 140000,
        storage: '32GB SSD',
        bandwidth: 'Unlimited',
        emoji: '🟣'
    },
    [PackageType.PYTHON_PRO_MAX]: {
        type: PackageType.PYTHON_PRO_MAX,
        name: 'Python Pro Max',
        ram: '16GB',
        cpu: '5 CPU',
        price: 270000,
        storage: '64GB SSD',
        bandwidth: 'Unlimited',
        emoji: '💎'
    },
    [PackageType.BRONZE]: {
        type: PackageType.BRONZE,
        name: 'BRONZE',
        ram: '1GB',
        cpu: '1 CPU',
        price: 25000,
        storage: 'Unlimited SSD',
        bandwidth: 'Unlimited',
        emoji: '🟢'
    },
    [PackageType.SILVER]: {
        type: PackageType.SILVER,
        name: 'SILVER',
        ram: '2GB',
        cpu: '2 CPU',
        price: 45000,
        storage: 'Unlimited SSD',
        bandwidth: 'Unlimited',
        emoji: '🟡'
    },
    [PackageType.GOLD]: {
        type: PackageType.GOLD,
        name: 'GOLD',
        ram: '4GB',
        cpu: '4 CPU',
        price: 85000,
        storage: 'Unlimited SSD',
        bandwidth: 'Unlimited',
        emoji: '🟠'
    },
    [PackageType.PLATINUM]: {
        type: PackageType.PLATINUM,
        name: 'PLATINUM',
        ram: '8GB',
        cpu: '8 CPU',
        price: 160000,
        storage: 'Unlimited SSD',
        bandwidth: 'Unlimited',
        emoji: '🔴'
    },
    [PackageType.DIAMOND]: {
        type: PackageType.DIAMOND,
        name: 'DIAMOND',
        ram: '16GB',
        cpu: '16 CPU',
        price: 300000,
        storage: 'Unlimited SSD',
        bandwidth: 'Unlimited',
        emoji: '💎'
    }
};

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: []
};

export const ORDER_STATUS_MESSAGES = {
    [OrderStatus.PENDING]: '⏳ Menunggu konfirmasi',
    [OrderStatus.CONFIRMED]: '✅ Dikonfirmasi',
    [OrderStatus.PROCESSING]: '🔄 Sedang diproses',
    [OrderStatus.COMPLETED]: '🎉 Selesai',
    [OrderStatus.CANCELLED]: '❌ Dibatalkan',
    [OrderStatus.REFUNDED]: '💰 Dikembalikan'
};