import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import BotManagement from './pages/BotManagement'
import OrderManagement from './pages/OrderManagement'
import ServerManagement from './pages/ServerManagement'
import MessageCenter from './pages/MessageCenter'
import Analytics from './pages/Analytics'
import { PackageManagement } from './pages/PackageManagement'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="bot" element={<BotManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="servers" element={<ServerManagement />} />
              <Route path="packages" element={<PackageManagement />} />
              <Route path="messages" element={<MessageCenter />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Routes>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  )
}

export default App