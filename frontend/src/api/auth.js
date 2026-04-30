import api from './index.js'

export const sendSms = (phone, type) => api.post('/api/auth/send-sms', { phone, type })

export const register = (data) => api.post('/api/auth/register', data)

export const login = (phone, password) => api.post('/api/auth/login', { phone, password })

export const resetPassword = (data) => api.post('/api/auth/reset-password', data)

export const changePassword = (data) => api.post('/api/auth/change-password', data)
