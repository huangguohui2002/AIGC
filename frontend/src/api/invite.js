import api from './index.js'

export const getInviteInfo = () => api.get('/api/invite/info')

export const getInviteRecords = (params) => api.get('/api/invite/records', { params })
