// import axios from 'axios'

export const login = async (credentials) => {
  // Mocked login: always succeed for any email/password
  return {
    token: 'fake-token',
    user: {
      id: '1',
      name: 'Demo Admin',
      email: credentials.email,
      role: 'ADMIN'
    }
  }
}

export const verifyToken = async () => {
  // Always succeed for mock
  return { valid: true }
}

export const logout = () => {
  localStorage.removeItem('token')
  // No axios headers to remove in mock
} 