import api from './index.js'

export const getBalance = () => api.get('/api/points/balance')

export const getPackages = () => api.get('/api/points/packages')

export const getPublicConfigs = () => api.get('/api/configs')

export const getTransactions = (params) => api.get('/api/points/transactions', { params })

export const postDailyCheckin = () => api.post('/api/user/daily-checkin')
