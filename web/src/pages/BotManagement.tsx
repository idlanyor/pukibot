import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from '../contexts/WebSocketContext'
import { 
  Play, 
  Square, 
  RotateCcw, 
  Activity, 
  Wifi, 
  WifiOff,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import axios from 'axios'

const BotManagement = () => {
  const queryClient = useQueryClient()
  const { sendMessage, isConnected } = useWebSocket()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data: botStatus, isLoading } = useQuery({
    queryKey: ['bot-status'],
    queryFn: async () => {
      const response = await axios.get('/api/bot/status')
      return response.data.data
    },
    refetchInterval: 3000
  })

  const { data: botStats } = useQuery({
    queryKey: ['bot-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/bot/stats')
      return response.data.data
    },
    refetchInterval: 10000
  })

  const botControlMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await axios.post(`/api/bot/${action}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-status'] })
      queryClient.invalidateQueries({ queryKey: ['bot-stats'] })
    }
  })

  const handleBotAction = async (action: string) => {
    setActionLoading(action)
    try {
      await botControlMutation.mutateAsync(action)
      
      // Also send WebSocket message for real-time updates
      if (isConnected) {
        sendMessage({
          type: 'bot_control',
          payload: { action }
        })
      }
    } catch (error) {
      console.error(`Error ${action} bot:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60))
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000)
    return `${hours}h ${minutes}m ${seconds}s`
  }

  const formatMemory = (bytes: number) => {
    return `${bytes} MB`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bot Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Bot Status</h2>
          <div className="flex items-center space-x-2">
            {botStatus?.isConnected ? (
              <div className="flex items-center text-green-600">
                <Wifi className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Disconnected</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
              botStatus?.isRunning ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {botStatus?.isRunning ? (
                <CheckCircle className={`h-8 w-8 ${botStatus?.isRunning ? 'text-green-600' : 'text-red-600'}`} />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-600">Status</p>
            <p className={`text-lg font-bold ${botStatus?.isRunning ? 'text-green-600' : 'text-red-600'}`}>
              {botStatus?.isRunning ? 'Running' : 'Stopped'}
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Uptime</p>
            <p className="text-lg font-bold text-gray-900">
              {botStatus?.uptime ? formatUptime(botStatus.uptime) : '0h 0m 0s'}
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Messages</p>
            <p className="text-lg font-bold text-gray-900">
              {botStatus?.messageCount || 0}
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => handleBotAction('start')}
            disabled={botStatus?.isRunning || actionLoading === 'start'}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {actionLoading === 'start' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Bot
          </button>

          <button
            onClick={() => handleBotAction('stop')}
            disabled={!botStatus?.isRunning || actionLoading === 'stop'}
            className="btn btn-danger disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {actionLoading === 'stop' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            Stop Bot
          </button>

          <button
            onClick={() => handleBotAction('restart')}
            disabled={!botStatus?.isRunning || actionLoading === 'restart'}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {actionLoading === 'restart' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Restart Bot
          </button>
        </div>
      </div>

      {/* Bot Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Memory Usage</span>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  {formatMemory(botStatus?.memory?.used || 0)} / {formatMemory(botStatus?.memory?.total || 0)}
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${botStatus?.memory?.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Connection State</span>
              <span className="text-sm font-medium text-gray-900">
                {botStatus?.connectionState || 'Unknown'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Error Count</span>
              <span className="text-sm font-medium text-gray-900">
                {botStatus?.errorCount || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Activity</span>
              <span className="text-sm font-medium text-gray-900">
                {botStatus?.lastActivity ? new Date(botStatus.lastActivity).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Messages</span>
              <span className="text-sm font-medium text-gray-900">
                {botStats?.totalMessages || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Commands Processed</span>
              <span className="text-sm font-medium text-gray-900">
                {botStats?.commandsProcessed || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Orders Created</span>
              <span className="text-sm font-medium text-gray-900">
                {botStats?.ordersCreated || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Servers Managed</span>
              <span className="text-sm font-medium text-gray-900">
                {botStats?.serversManaged || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Start Time</span>
              <span className="text-sm font-medium text-gray-900">
                {botStats?.startTime ? new Date(botStats.startTime).toLocaleString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BotManagement