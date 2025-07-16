import axiosInstance from './AxiosConfig'

class AuthService {
  // Sign up user
  async signUp(userData) {
    try {
      const response = await axiosInstance.post('/auth/signup', userData)
      const { access_token, user } = response.data

      // Store token and user info
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('user', JSON.stringify(user))

      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Sign up failed')
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await axiosInstance.post('/auth/login', credentials)
      const { access_token, user } = response.data

      // Store token and user info
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('user', JSON.stringify(user))

      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await axiosInstance.get('/auth/me')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get user info')
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('access_token')
    return !!token
  }

  // Get stored user info
  getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  // Get token
  getToken() {
    return localStorage.getItem('access_token')
  }
}

export default new AuthService()