import api from './index.js'

export const createOrder = (packageId) => api.post('/api/pay/create-order', { package_id: packageId })

export const getOrders = (params) => api.get('/api/pay/orders', { params })
