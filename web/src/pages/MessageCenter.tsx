import { MessageSquare, Send } from 'lucide-react'

const MessageCenter = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Message Center</h1>
        <button className="btn btn-primary flex items-center">
          <Send className="h-4 w-4 mr-2" />
          Send Message
        </button>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">WhatsApp Message Center</h3>
          <p className="text-gray-500 mb-4">
            This page will show WhatsApp message management functionality including:
          </p>
          <ul className="text-left text-sm text-gray-600 max-w-md mx-auto space-y-1">
            <li>• Real-time message monitoring</li>
            <li>• Send messages to customers</li>
            <li>• View message history</li>
            <li>• Filter messages by contact</li>
            <li>• Automated message templates</li>
            <li>• Message statistics and analytics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MessageCenter