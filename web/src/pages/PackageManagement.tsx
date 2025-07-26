import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';

interface Package {
    id?: number;
    type: string;
    name: string;
    ram: string;
    cpu: string;
    storage: string;
    bandwidth: string;
    price: number;
    emoji: string;
    description?: string;
    category: string;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

interface PackageStats {
    total: number;
    active: number;
    inactive: number;
    byCategory: { category: string; count: number }[];
    pricing: {
        min_price: number;
        max_price: number;
        avg_price: number;
    };
}

export const PackageManagement: React.FC = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [stats, setStats] = useState<PackageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        fetchPackages();
        fetchStats();
    }, [selectedCategory, searchTerm]);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            if (searchTerm) params.append('search', searchTerm);

            const response = await fetch(`/api/packages?${params}`);
            const data = await response.json();
            
            if (data.success) {
                setPackages(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch packages:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/packages/stats');
            const data = await response.json();
            
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleToggleStatus = async (packageType: string) => {
        try {
            const response = await fetch(`/api/packages/${packageType}/toggle`, {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.success) {
                fetchPackages();
                fetchStats();
            }
        } catch (error) {
            console.error('Failed to toggle package status:', error);
        }
    };

    const handleDeletePackage = async (packageType: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;

        try {
            const response = await fetch(`/api/packages/${packageType}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            
            if (data.success) {
                fetchPackages();
                fetchStats();
            }
        } catch (error) {
            console.error('Failed to delete package:', error);
        }
    };

    const handleSavePackage = async (packageData: Partial<Package>) => {
        try {
            const url = editingPackage 
                ? `/api/packages/${editingPackage.type}`
                : '/api/packages';
            
            const method = editingPackage ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(packageData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                setEditingPackage(null);
                setShowAddForm(false);
                fetchPackages();
                fetchStats();
            }
        } catch (error) {
            console.error('Failed to save package:', error);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(price);
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'nodejs': return 'bg-green-100 text-green-800';
            case 'vps': return 'bg-blue-100 text-blue-800';
            case 'python': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Add New Package
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm text-gray-600">Total Packages</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                            <div className="text-sm text-gray-600">Active Packages</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                            <div className="text-sm text-gray-600">Inactive Packages</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="text-2xl font-bold text-purple-600">
                                {formatPrice(stats.pricing.avg_price)}
                            </div>
                            <div className="text-sm text-gray-600">Average Price</div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search packages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                <option value="nodejs">NodeJS</option>
                                <option value="vps">VPS</option>
                                <option value="python">Python</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Packages Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Package
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Specifications
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : packages.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            No packages found
                                        </td>
                                    </tr>
                                ) : (
                                    packages.map((pkg) => (
                                        <tr key={pkg.type} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-3">{pkg.emoji}</span>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {pkg.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {pkg.type}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {pkg.ram} RAM, {pkg.cpu}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {pkg.storage} Storage
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatPrice(pkg.price)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    per month
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(pkg.category)}`}>
                                                    {pkg.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    pkg.active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {pkg.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => setEditingPackage(pkg)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(pkg.type)}
                                                        className={`${
                                                            pkg.active 
                                                                ? 'text-red-600 hover:text-red-900' 
                                                                : 'text-green-600 hover:text-green-900'
                                                        }`}
                                                    >
                                                        {pkg.active ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePackage(pkg.type)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Package Modal */}
                {(showAddForm || editingPackage) && (
                    <PackageForm
                        package={editingPackage}
                        onSave={handleSavePackage}
                        onCancel={() => {
                            setShowAddForm(false);
                            setEditingPackage(null);
                        }}
                    />
                )}
            </div>
        </Layout>
    );
};

// Package Form Component
interface PackageFormProps {
    package?: Package | null;
    onSave: (packageData: Partial<Package>) => void;
    onCancel: () => void;
}

const PackageForm: React.FC<PackageFormProps> = ({ package: pkg, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        type: pkg?.type || '',
        name: pkg?.name || '',
        ram: pkg?.ram || '',
        cpu: pkg?.cpu || '',
        storage: pkg?.storage || '',
        bandwidth: pkg?.bandwidth || 'Unlimited',
        price: pkg?.price || 0,
        emoji: pkg?.emoji || '📦',
        description: pkg?.description || '',
        category: pkg?.category || 'nodejs',
        active: pkg?.active ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {pkg ? 'Edit Package' : 'Add New Package'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Package Type
                        </label>
                        <input
                            type="text"
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={!!pkg}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Package Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                RAM
                            </label>
                            <input
                                type="text"
                                value={formData.ram}
                                onChange={(e) => setFormData({...formData, ram: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CPU
                            </label>
                            <input
                                type="text"
                                value={formData.cpu}
                                onChange={(e) => setFormData({...formData, cpu: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Storage
                        </label>
                        <input
                            type="text"
                            value={formData.storage}
                            onChange={(e) => setFormData({...formData, storage: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price (IDR)
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Emoji
                            </label>
                            <input
                                type="text"
                                value={formData.emoji}
                                onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="nodejs">NodeJS</option>
                            <option value="vps">VPS</option>
                            <option value="python">Python</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => setFormData({...formData, active: e.target.checked})}
                            className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">
                            Active
                        </label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            {pkg ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};