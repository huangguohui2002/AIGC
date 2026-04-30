import api from './index.js'

// 公共接口，无需 token
export const getPublicConfigs = () => api.get('/api/configs')
export const getPublicAiModels = (type) => {
  const params = type ? { type } : undefined
  return api.get('/api/ai-models', { params })
}
