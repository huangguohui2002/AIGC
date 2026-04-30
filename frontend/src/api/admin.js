import api from './index.js'

export const adminLogin = (data) => api.post('/api/admin/login', data)

export const getUserProfile = () => api.get('/api/user/profile')
export const updateProfile = (data) => api.put('/api/user/profile', data)

export const getAdminStats = () => api.get('/api/admin/stats')

export const getUsers = (params) => api.get('/api/admin/users', { params })
export const getUserDetail = (id) => api.get(`/api/admin/users/${id}`)
export const createUser = (data) => api.post('/api/admin/users', data)
export const adjustPoints = (id, data) => api.put(`/api/admin/users/${id}/points`, data)
export const updateUserStatus = (id, status) => api.put(`/api/admin/users/${id}/status`, { status })
export const updateUser = (id, data) => api.put(`/api/admin/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/api/admin/users/${id}`)

export const getOrders = (params) => api.get('/api/admin/orders', { params })
export const getAdminGenerations = (params) => api.get('/api/admin/generations', { params })

export const getAdminAnnouncements = (params) => api.get('/api/admin/announcements', { params })
export const createAnnouncement = (data) => api.post('/api/admin/announcements', data)
export const updateAnnouncement = (id, data) => api.put(`/api/admin/announcements/${id}`, data)
export const deleteAnnouncement = (id) => api.delete(`/api/admin/announcements/${id}`)

export const getAdminPackages = (params) => api.get('/api/admin/points-packages', { params })
export const createAdminPackage = (data) => api.post('/api/admin/points-packages', data)
export const updateAdminPackage = (id, data) => api.put(`/api/admin/points-packages/${id}`, data)
export const deleteAdminPackage = (id) => api.delete(`/api/admin/points-packages/${id}`)
export const permanentDeleteAdminPackage = (id) => api.delete(`/api/admin/points-packages/${id}/permanent`)

export const getConfigs = () => api.get('/api/admin/configs')
export const updateConfigs = (configs) => api.put('/api/admin/configs', { configs })

export const getAdminAiProviders = () => api.get('/api/admin/ai-providers')
export const getAdminAiModels = () => api.get('/api/admin/ai-models')
export const createAiModel = (data) => api.post('/api/admin/ai-models', data)
export const updateAiModel = (id, data) => api.put(`/api/admin/ai-models/${id}`, data)
export const deleteAiModel = (id) => api.delete(`/api/admin/ai-models/${id}`)
