import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// Components
import Login from './components/auth/Login'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import Metrics from './components/metrics/Metrics'
import Users from './components/users/Users'
import Wards from './components/wards/Wards'
import Conflicts from './components/conflicts/Conflicts'
import Houses from './components/homes/Homes'
import Uploads from './components/uploads/Uploads'

// Context
import { AuthContext } from './context/AuthContext'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // For demo purposes, set a mock user
      setUser({
        id: '1',
        name: 'Demo Admin',
        email: 'admin@example.com',
        role: 'ADMIN'
      })
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Routes>
        {/* Default route - redirect to login if not authenticated, dashboard if authenticated */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
        
        {/* Login route */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        
        {/* Protected routes - require authentication */}
        <Route 
          path="/dashboard" 
          element={user ? <Layout /> : <Navigate to="/login" replace />} 
        >
          <Route index element={<Dashboard />} />
          <Route path="metrics" element={<Metrics />} />
          <Route path="users" element={<Users />} />
          <Route path="wards" element={<Wards />} />
          <Route path="homes" element={<Houses />} />
          <Route path="uploads" element={<Uploads />} />
          <Route path="conflicts" element={<Conflicts />} />
        </Route>
        
        {/* Catch all other routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  )
}

export default App 