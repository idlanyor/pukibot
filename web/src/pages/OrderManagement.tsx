import { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Clock,
  AlertCircle,
  RefreshCw,
  Server
} from 'lucide-react'

interface Order {
  id: string
  customer: {
    phoneNumber: string
    displayName?: string
    chatId: string
  }
  item: {
    packageType: string
    duration: number
    price: number
    specifications: {
      ram: string
      cpu: string
      storage: string
      bandwidth: string
    }
  }
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'refunded'
  totalAmount: number
  currency: string
  createdAt: string
  updatedAt: string
  notes?: string
  adminNotes?: string
  serverId?: string
}

interface OrderStats {
  total: number
  pending: number
  confirmed: number
  processing: number
  completed: number
  cancelled: number
  totalRevenue: number
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
  }

  const statusIcons = {
    pending: Clock,
    confirmed: Check,
    processing: RefreshCw,
    completed: Check,
    cancelled: X,
    refunded: AlertCircle
  }

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [page, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : ''
      const response = await fetch(`/api/orders?page=${page}&limit=20${statusParam}`)
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.data.orders)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/orders/stats/summary')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      const data = await response.json()
      if (data.success) {
        fetchOrders()
        fetchStats()
        setSelectedOrder(data.data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to update order status')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        fetchOrders()
        fetchStats()
        setShowDetailsModal(false)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to delete order')
    }
  }

  const handleProvisionServer = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/provision`, {
        method: 'POST'
      })
      
      const data = await response.json()
      if (data.success) {
        fetchOrders()
        fetchStats()
        alert('Server provisioned successfully!')
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to provision server')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customer.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    return matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Orders</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-500">Confirmed</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-purple-600">{stats.processing}</div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-primary-600">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-sm text-gray-500">Revenue</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.status]
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customer.displayName || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{order.customer.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.item.packageType}</div>
                      <div className="text-sm text-gray-500">{order.item.duration} months</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowDetailsModal(true)
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleProvisionServer(order.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Provision Server"
                          >
                            <Server className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'cancelled' && (
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteOrder}
        />
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchOrders()
            fetchStats()
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onUpdateStatus, onDelete }: {
  order: Order
  onClose: () => void
  onUpdateStatus: (orderId: string, status: string) => void
  onDelete: (orderId: string) => void
}) => {
  const [newStatus, setNewStatus] = useState(order.status)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                <div className="text-sm text-gray-900">{order.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="text-sm text-gray-900">{order.customer.phoneNumber}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <div className="text-sm text-gray-900">{order.customer.displayName || 'Not provided'}</div>
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Package Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
                  <div className="text-sm text-gray-900">{order.item.packageType}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <div className="text-sm text-gray-900">{order.item.duration} months</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RAM</label>
                  <div className="text-sm text-gray-900">{order.item.specifications.ram}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPU</label>
                  <div className="text-sm text-gray-900">{order.item.specifications.cpu}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage</label>
                  <div className="text-sm text-gray-900">{order.item.specifications.storage}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bandwidth</label>
                  <div className="text-sm text-gray-900">{order.item.specifications.bandwidth}</div>
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Month</label>
                  <div className="text-sm text-gray-900">{formatCurrency(order.item.price)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                  <div className="text-sm text-gray-900">{formatCurrency(order.totalAmount)}</div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Timestamps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                  <div className="text-sm text-gray-900">{formatDate(order.updatedAt)}</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(order.notes || order.adminNotes) && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
                {order.notes && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Notes</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{order.notes}</div>
                  </div>
                )}
                {order.adminNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{order.adminNotes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Server Info */}
            {order.serverId && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Server Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Server ID</label>
                  <div className="text-sm text-gray-900">{order.serverId}</div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            {order.status === 'cancelled' && (
              <button
                onClick={() => onDelete(order.id)}
                className="btn btn-danger"
              >
                Delete Order
              </button>
            )}
            {newStatus !== order.status && (
              <button
                onClick={() => onUpdateStatus(order.id, newStatus)}
                className="btn btn-primary"
              >
                Update Status
              </button>
            )}
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Create Order Modal Component
const CreateOrderModal = ({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: () => void
}) => {
  const [formData, setFormData] = useState({
    customerPhone: '',
    packageType: '',
    duration: 1,
    customerName: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const packageTypes = [
    { value: 'a1', label: 'A1 - NodeJS Kroco' },
    { value: 'a2', label: 'A2 - NodeJS Karbit' },
    { value: 'a3', label: 'A3 - NodeJS Standar' },
    { value: 'a4', label: 'A4 - NodeJS Sepuh' },
    { value: 'a5', label: 'A5 - NodeJS Suhu' },
    { value: 'a6', label: 'A6 - NodeJS Pro Max' },
    { value: 'b1', label: 'B1 - VPS Kroco' },
    { value: 'b2', label: 'B2 - VPS Karbit' },
    { value: 'b3', label: 'B3 - VPS Standar' },
    { value: 'b4', label: 'B4 - VPS Sepuh' },
    { value: 'b5', label: 'B5 - VPS Suhu' },
    { value: 'b6', label: 'B6 - VPS Pro Max' },
    { value: 'c1', label: 'C1 - Python Kroco' },
    { value: 'c2', label: 'C2 - Python Karbit' },
    { value: 'c3', label: 'C3 - Python Standar' },
    { value: 'c4', label: 'C4 - Python Sepuh' },
    { value: 'c5', label: 'C5 - Python Suhu' },
    { value: 'c6', label: 'C6 - Python Pro Max' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create New Order</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Phone Number *
              </label>
              <input
                type="tel"
                required
                className="input"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="e.g., 628123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                className="input"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Customer display name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Type *
              </label>
              <select
                required
                className="input"
                value={formData.packageType}
                onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
              >
                <option value="">Select package type</option>
                {packageTypes.map((pkg) => (
                  <option key={pkg.value} value={pkg.value}>
                    {pkg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (months) *
              </label>
              <select
                required
                className="input"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                  <option key={month} value={month}>
                    {month} month{month > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="input"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OrderManagement