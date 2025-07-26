import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface WebSocketMessage {
  type: string
  payload?: any
}

interface WebSocketContextType {
  isConnected: boolean
  sendMessage: (message: WebSocketMessage) => void
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
  lastMessage: WebSocketMessage | null
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { token, user } = useAuth()
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  useEffect(() => {
    if (token && user) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws`
      
      const websocket = new WebSocket(wsUrl)

      websocket.onopen = () => {
        setIsConnected(true)
        setWs(websocket)
        
        // Authenticate
        websocket.send(JSON.stringify({
          type: 'authenticate',
          payload: { token }
        }))
      }

      websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          
          if (message.type === 'authenticated') {
            console.log('WebSocket authenticated successfully')
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      websocket.onclose = () => {
        setIsConnected(false)
        setWs(null)
      }

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      return () => {
        websocket.close()
      }
    }
  }, [token, user])

  const sendMessage = (message: WebSocketMessage) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify(message))
    }
  }

  const subscribe = (channel: string) => {
    sendMessage({
      type: 'subscribe',
      payload: { channel }
    })
  }

  const unsubscribe = (channel: string) => {
    sendMessage({
      type: 'unsubscribe',
      payload: { channel }
    })
  }

  const value: WebSocketContextType = {
    isConnected,
    sendMessage,
    subscribe,
    unsubscribe,
    lastMessage
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}