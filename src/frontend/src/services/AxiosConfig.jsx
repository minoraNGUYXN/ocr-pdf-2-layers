import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// Auto-attach token to requests
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle unauthorized responses
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance