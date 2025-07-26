import { useQuery } from '@tanstack/react-query'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useEffect } from 'react'
import { 
  Bot, 
  Users, 
  ShoppingCart, 
  Server, 
  MessageSquare,
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react'
import axios from 'axios'

interface DashboardStats {
  botStatus: {
    isRunning: boolean
    isConnected: boolean
    uptime: number
    messageCount: number
  }
  orderStats: {
    total: number
    pending: number
    completed: number
    totalRevenue: number
  }
  systemInfo: {
    memory: {
      used: number
      total: number
      percentage: number
    }
  }
}

const Dashboard = () => {
  const { subscribe, lastMessage } = useWebSocket()

  const { data: botStatus, refetch: refetchBotStatus } = useQuery({
    queryKey: ['bot-status'],
    queryFn: async () => {
      const response = await axios.get('/api/bot/status')
      return response.data.data
    },
    refetchInterval: 5000
  })

  const { data: orderStats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/orders/stats/summary')
      return response.data.data
    },
    refetchInterval: 30000
  })

  useEffect(() => {
    subscribe('bot_status')
    subscribe('orders')
  }, [subscribe])

  useEffect(() => {
    if (lastMessage?.type === 'bot_status') {
      refetchBotStatus()
    }
  }, [lastMessage, refetchBotStatus])

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60))
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string
    value: string | number
    icon: any
    color: string
    subtitle?: string
  }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Pterodactyl Bot Management
        </h1>
        <p className="text-gray-600">
          Monitor and control your WhatsApp bot, manage orders, and oversee server operations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Bot Status"
          value={botStatus?.isRunning ? 'Running' : 'Stopped'}
          icon={Bot}
          color={botStatus?.isRunning ? 'bg-green-500' : 'bg-red-500'}
          subtitle={botStatus?.isConnected ? 'Connected' : 'Disconnected'}
        />
        
        <StatCard
          title="Total Orders"
          value={orderStats?.total || 0}
          icon={ShoppingCart}
          color="bg-blue-500"
          subtitle={`${orderStats?.pending || 0} pending`}
        />
        
        <StatCard
          title="Messages Today"
          value={botStatus?.messageCount || 0}
          icon={MessageSquare}
          color="bg-purple-500"
        />
        
        <StatCard
          title="Revenue"
          value={`$${orderStats?.totalRevenue || 0}`}
          icon={TrendingUp}
          color="bg-green-500"
          subtitle={`${orderStats?.completed || 0} completed`}
        />
      </div>

      {/* Bot Status Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Bot Performance
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                botStatus?.isRunning 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {botStatus?.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Connection</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                botStatus?.isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {botStatus?.isConnected ? 'Connected' : 'Connecting'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-gray-900">
                {botStatus?.uptime ? formatUptime(botStatus.uptime) : '0h 0m'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Memory Usage</span>
              <span className="text-sm font-medium text-gray-900">
                {botStatus?.memory?.percentage || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Activity
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-600">Bot started successfully</span>
              <span className="ml-auto text-gray-400">2 min ago</span>
            </div>
            
            <div className="flex items-center text-sm">
              <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-gray-600">New order received</span>
              <span className="ml-auto text-gray-400">5 min ago</span>
            </div>
            
            <div className="flex items-center text-sm">
              <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
              <span className="text-gray-600">Server provisioned</span>
              <span className="ml-auto text-gray-400">10 min ago</span>
            </div>
            
            <div className="flex items-center text-sm">
              <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-gray-600">WebSocket connected</span>
              <span className="ml-auto text-gray-400">15 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard