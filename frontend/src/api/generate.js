import api from './index.js'

export const generateImage = (data) => api.post('/api/generate/image', data)

export const generateVideo = (data) => api.post('/api/generate/video', data)

export const getRecords = (params) => api.get('/api/generate/records', { params })

export const getGenerationResult = (data) => api.post('/api/generate/result', data)
