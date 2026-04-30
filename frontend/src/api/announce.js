import api from './index.js'

export const getAnnouncements = (params) => api.get('/api/announcements', { params })
