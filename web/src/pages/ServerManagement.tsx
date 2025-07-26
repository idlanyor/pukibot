import { Server, Play, Square, RotateCcw } from 'lucide-react'

const ServerManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Server Management</h1>
        <div className="flex space-x-2">
          <button className="btn btn-secondary">Refresh</button>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pterodactyl Server Management</h3>
          <p className="text-gray-500 mb-4">
            This page will show Pterodactyl server management functionality including:
          </p>
          <ul className="text-left text-sm text-gray-600 max-w-md mx-auto space-y-1">
            <li>• List all servers from Pterodactyl panel</li>
            <li>• Start, stop, restart servers</li>
            <li>• View server status and resources</li>
            <li>• Execute server commands</li>
            <li>• Monitor server performance</li>
            <li>• Real-time server status updates</li>
          </ul>
          
          <div className="mt-6 flex justify-center space-x-4">
            <button className="btn btn-primary flex items-center">
              <Play className="h-4 w-4 mr-2" />
              Start
            </button>
            <button className="btn btn-danger flex items-center">
              <Square className="h-4 w-4 mr-2" />
              Stop
            </button>
            <button className="btn btn-secondary flex items-center">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerManagement