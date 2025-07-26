import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface User {
  userId: string
  username: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get('/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (response.data.success) {
            setUser(response.data.data.user)
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          } else {
            localStorage.removeItem('token')
            setToken(null)
          }
        } catch (error) {
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setIsLoading(false)
    }

    verifyToken()
  }, [token])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('/auth/login', { username, password })
      
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('token', newToken)
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}