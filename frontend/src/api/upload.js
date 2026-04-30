import api from './index.js'

// 用户上传临时参考图（图生图 / 图生视频）
export const uploadTempImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.post('/api/upload/temp-image', formData, {
    headers: { 'Content-Type': undefined }, // 让浏览器自动设置 multipart boundary
  })
}

// 管理员上传示例图片
export const uploadExampleImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.post('/api/admin/upload/example-image', formData, {
    headers: { 'Content-Type': undefined },
  })
}
