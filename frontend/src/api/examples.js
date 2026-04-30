import api from './index.js'

// ── 公开接口 ───────────────────────────────────────────────────
// GET /api/examples/categories  → { success, data: { categories: [] } }
export const getExampleCategories = () =>
  api.get('/api/examples/categories')

// GET /api/examples  → { success, data: { list: [], total } }
// params: { categoryId?, page?, pageSize?, q?, sort? }
export const getExamples = (params) =>
  api.get('/api/examples', { params })

// GET /api/examples/:id  → { success, data: { id, ... } }
export const getExample = (id) =>
  api.get(`/api/examples/${id}`)

// ── 管理员接口 ─────────────────────────────────────────────────
// GET /api/admin/examples/categories → { success, data: { categories: [] } }
export const getAdminExampleCategories = () =>
  api.get('/api/admin/examples/categories')

// POST /api/examples/categories → { success, data: { id } }
export const createExampleCategory = (data) =>
  api.post('/api/examples/categories', data)

// PUT /api/examples/categories/:id → { success }
export const updateExampleCategory = (id, data) =>
  api.put(`/api/examples/categories/${id}`, data)

// DELETE /api/examples/categories/:id → { success }
export const deleteExampleCategory = (id) =>
  api.delete(`/api/examples/categories/${id}`)

// GET /api/admin/examples → { success, data: { list: [], total } }
// params: { page?, pageSize?, q?, is_active?, categoryId? }
export const getAdminExamples = (params) =>
  api.get('/api/admin/examples', { params })

// POST /api/examples → { success, data: { id } }
export const createExample = (data) =>
  api.post('/api/examples', data)

// PUT /api/examples/:id → { success }
export const updateExample = (id, data) =>
  api.put(`/api/examples/${id}`, data)

// DELETE /api/examples/:id          → 软删除（下架）
// DELETE /api/examples/:id?permanent=true → 硬删除
export const deleteExample = (id, permanent = false) =>
  api.delete(`/api/examples/${id}${permanent ? '?permanent=true' : ''}`)
