import axios from 'axios'
import router from '../router/index.js'

const envBaseURL = (import.meta.env.VITE_API_BASE_URL || '').trim()
const runtimeBaseURL = typeof window === 'undefined' ? '/' : window.location.origin

const api = axios.create({
  baseURL: envBaseURL || runtimeBaseURL,
  timeout: 90000, // 90s for generation tasks
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push({ name: 'login' })
    }
    return Promise.reject(error.response?.data || { message: '网络错误，请稍后重试' })
  }
)

export default api
