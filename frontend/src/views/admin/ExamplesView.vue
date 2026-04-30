<template>
  <div class="p-4 sm:p-6 space-y-4">
    <!-- Tab切换 -->
    <div class="flex items-center gap-2 border-b border-slate-200 pb-3">
      <button
        @click="activeTab = 'categories'"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="activeTab === 'categories' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-100'"
      >
        分类管理
      </button>
      <button
        @click="activeTab = 'examples'"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="activeTab === 'examples' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-100'"
      >
        示例管理
      </button>
    </div>

    <!-- 分类管理 -->
    <div v-if="activeTab === 'categories'" class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-slate-500">共 <strong class="text-slate-900">{{ categories.length }}</strong> 个分类</p>
        <button
          @click="openCreateCategory"
          class="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <PlusIcon class="w-4 h-4" />
          新增分类
        </button>
      </div>

      <div v-if="loadingCategories" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-16 bg-slate-100 rounded-xl animate-pulse" />
      </div>

      <template v-else>
        <div v-if="categories.length === 0" class="bg-white border border-slate-200 rounded-xl py-16 flex flex-col items-center shadow-sm">
          <FolderIcon class="w-10 h-10 text-slate-300 mb-3" />
          <p class="text-sm text-slate-400">暂无分类</p>
        </div>

        <div v-else class="admin-table-shell bg-white border border-slate-200 rounded-xl shadow-sm">
          <table class="admin-table min-w-[560px]">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50">
                <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">名称</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">描述</th>
                <th class="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">排序</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">状态</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="cat in categories" :key="cat.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3.5 text-sm font-semibold text-slate-900">{{ cat.name }}</td>
                <td class="px-5 py-3.5 text-sm text-slate-600 max-w-xs truncate">{{ cat.description || '—' }}</td>
                <td class="px-5 py-3.5 text-center text-sm text-slate-500">{{ cat.sort ?? 0 }}</td>
                <td class="px-5 py-3.5">
                  <span
                    class="px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
                    :class="cat.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ cat.is_active ? '启用' : '停用' }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <div class="admin-actions">
                    <button @click="openEditCategory(cat)" class="px-2.5 py-1 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap">编辑</button>
                    <button @click="openDeleteCategory(cat)" class="px-2.5 py-1 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- 示例管理 -->
    <div v-if="activeTab === 'examples'" class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <AdminSelect v-model="filterCategory" :options="categoryFilterOptions" placeholder="全部分类" />
        <AdminSelect v-model="filterStatus" :options="statusOptions" placeholder="全部状态" />
        <AdminSelect v-model="filterType" :options="typeOptions" placeholder="全部类型" />
        <button
          @click="fetchExamples"
          class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          搜索
        </button>
        <button
          @click="openCreateExample"
          class="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm ml-auto"
        >
          <PlusIcon class="w-4 h-4" />
          新增示例
        </button>
      </div>

      <div v-if="loadingExamples" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-20 bg-slate-100 rounded-xl animate-pulse" />
      </div>

      <template v-else>
        <div v-if="examples.length === 0" class="bg-white border border-slate-200 rounded-xl py-16 flex flex-col items-center shadow-sm">
          <PhotoIcon class="w-10 h-10 text-slate-300 mb-3" />
          <p class="text-sm text-slate-400">暂无示例</p>
        </div>

        <div v-else class="space-y-3">
          <div v-for="ex in examples" :key="ex.id" class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div class="flex items-start gap-4">
              <div v-if="ex.images && ex.images.length > 0" class="flex-shrink-0">
                <img :src="ex.images[0].url" :alt="ex.title" class="w-20 h-20 rounded-lg object-cover border border-slate-200" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="flex-1">
                    <h3 class="font-semibold text-slate-900 text-sm">{{ ex.title }}</h3>
                    <p class="text-xs text-slate-400 mt-0.5">分类: {{ getCategoryName(ex.category_id) }}</p>
                  </div>
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      class="px-2 py-0.5 rounded-lg text-xs font-medium"
                      :class="ex.display_type === 'single' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-purple-50 text-purple-600 border border-purple-200'"
                    >
                      {{ ex.display_type === 'single' ? '单图' : '对比' }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded-lg text-xs font-medium"
                      :class="ex.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'"
                    >
                      {{ ex.is_active ? '启用' : '停用' }}
                    </span>
                  </div>
                </div>
                <p class="text-sm text-slate-600 line-clamp-2 mb-2">{{ ex.prompt }}</p>
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs text-slate-400 whitespace-nowrap">排序: {{ ex.sort ?? 0 }}</span>
                  <div class="flex flex-wrap justify-end gap-2">
                    <button @click="openEditExample(ex)" class="px-2.5 py-1 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap">编辑</button>
                    <button @click="openDeleteExample(ex, false)" class="px-2.5 py-1 text-xs rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors whitespace-nowrap">下架</button>
                    <button @click="openDeleteExample(ex, true)" class="px-2.5 py-1 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <span class="text-sm text-slate-500">共 <strong class="text-slate-900">{{ total }}</strong> 条</span>
          <div class="flex items-center gap-2">
            <button
              @click="prevPage"
              :disabled="page === 1"
              class="px-3 py-1.5 text-sm rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              上一页
            </button>
            <span class="px-3 py-1.5 text-sm text-slate-600">{{ page }} / {{ totalPages || 1 }}</span>
            <button
              @click="nextPage"
              :disabled="page >= totalPages"
              class="px-3 py-1.5 text-sm rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      :visible="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      :type="confirmState.type"
      :loading="confirmState.loading"
      @confirm="confirmState.onConfirm"
      @cancel="confirmState.show = false"
      @update:visible="confirmState.show = $event"
    />

    <!-- 分类模态框 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="categoryModal.show" @click.self="categoryModal.show = false" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 class="text-base font-bold text-slate-900 mb-5">{{ categoryModal.isEdit ? '编辑分类' : '新增分类' }}</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">分类名称 <span class="text-rose-500">*</span></label>
                <input v-model="categoryModal.form.name" type="text" placeholder="例: 人物肖像" class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">描述</label>
                <textarea v-model="categoryModal.form.description" rows="3" placeholder="分类描述..." class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm resize-none transition-all" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1.5">排序</label>
                  <input v-model.number="categoryModal.form.sort" type="number" min="0" placeholder="0" class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 text-slate-900 rounded-lg px-4 py-2.5 text-sm outline-none" />
                </div>
                <div class="flex items-end">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="categoryModal.form.is_active" type="checkbox" class="w-4 h-4 text-rose-500 rounded" />
                    <span class="text-sm text-slate-600">启用</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="submitCategory" :disabled="categoryModal.saving" class="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                {{ categoryModal.saving ? '保存中...' : (categoryModal.isEdit ? '保存修改' : '创建分类') }}
              </button>
              <button @click="categoryModal.show = false" class="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm rounded-lg transition-colors">取消</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 示例模态框 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="exampleModal.show" @click.self="exampleModal.show = false" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 class="text-base font-bold text-slate-900 mb-5">{{ exampleModal.isEdit ? '编辑示例' : '新增示例' }}</h3>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1.5">分类 <span class="text-rose-500">*</span></label>
                  <AdminSelect v-model="exampleModal.form.category_id" :options="categoryOptions" :full-width="true" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1.5">展示类型 <span class="text-rose-500">*</span></label>
                  <AdminSelect v-model="exampleModal.form.display_type" :options="displayTypeOptions" :full-width="true" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">标题 <span class="text-rose-500">*</span></label>
                <input v-model="exampleModal.form.title" type="text" placeholder="示例标题" class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 text-slate-900 rounded-lg px-4 py-2.5 text-sm outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">提示词 <span class="text-rose-500">*</span></label>
                <textarea v-model="exampleModal.form.prompt" rows="4" maxlength="1000" placeholder="输入提示词（最多1000字）" class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 text-slate-900 rounded-lg px-4 py-2.5 text-sm resize-none outline-none" />
                <p class="text-xs text-slate-400 mt-1">{{ exampleModal.form.prompt.length }}/1000</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">图片列表</label>
                <div class="space-y-2">
                  <div v-for="(img, idx) in exampleModal.form.images" :key="idx" class="flex items-center gap-2">
                    <input v-model="img.url" type="text" placeholder="图片URL" class="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-sm outline-none" />
                    <input v-model="img.label" type="text" placeholder="标签" class="w-24 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-sm outline-none" />
                    <label class="px-2 py-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer" :class="img.uploading ? 'opacity-50 pointer-events-none' : ''">
                      <span v-if="img.uploading" class="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin inline-block" />
                      <ArrowUpTrayIcon v-else class="w-4 h-4" />
                      <input type="file" accept="image/*" class="hidden" @change="e => { const f = e.target.files?.[0]; if (f) uploadExampleImg(idx, f); e.target.value = '' }" />
                    </label>
                    <button @click="exampleModal.form.images.splice(idx, 1)" class="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <XMarkIcon class="w-4 h-4" />
                    </button>
                  </div>
                  <button @click="exampleModal.form.images.push({ url: '', label: '', order: exampleModal.form.images.length, uploading: false })" class="text-sm text-rose-500 hover:text-rose-600">+ 添加图片</button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1.5">排序</label>
                  <input v-model.number="exampleModal.form.sort" type="number" min="0" placeholder="0" class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 text-sm outline-none" />
                </div>
                <div class="flex items-end">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="exampleModal.form.is_active" type="checkbox" class="w-4 h-4 text-rose-500 rounded" />
                    <span class="text-sm text-slate-600">启用</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="submitExample" :disabled="exampleModal.saving" class="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                {{ exampleModal.saving ? '保存中...' : (exampleModal.isEdit ? '保存修改' : '创建示例') }}
              </button>
              <button @click="exampleModal.show = false" class="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm rounded-lg transition-colors">取消</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { PlusIcon, FolderIcon, PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline'
import {
  getAdminExampleCategories,
  createExampleCategory,
  updateExampleCategory,
  deleteExampleCategory,
  getAdminExamples,
  createExample,
  updateExample,
  deleteExample
} from '../../api/examples.js'
import { uploadExampleImage } from '../../api/upload.js'
import { useToast } from '../../composables/useToast.js'
import AdminSelect from '../../components/admin/AdminSelect.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const toast = useToast()
const activeTab = ref('categories')

// 分类相关
const categories = ref([])
const loadingCategories = ref(false)

const categoryModal = reactive({
  show: false,
  isEdit: false,
  editId: null,
  saving: false,
  form: { name: '', description: '', sort: 0, is_active: true }
})

// 示例相关
const examples = ref([])
const loadingExamples = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterCategory = ref('')
const filterStatus = ref('')
const filterType = ref('')

const exampleModal = reactive({
  show: false,
  isEdit: false,
  editId: null,
  saving: false,
  form: {
    category_id: null,
    title: '',
    display_type: 'single',
    prompt: '',
    images: [],
    sort: 0,
    is_active: true
  }
})

const confirmState = reactive({
  show: false,
  title: '',
  message: '',
  confirmText: '确认',
  type: 'danger',
  loading: false,
  onConfirm: () => {}
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const categoryFilterOptions = computed(() => [
  { value: '', label: '全部分类' },
  ...categories.value.map(c => ({ value: c.id, label: c.name }))
])

const categoryOptions = computed(() =>
  categories.value.filter(c => c.is_active).map(c => ({ value: c.id, label: c.name }))
)

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: '1', label: '启用' },
  { value: '0', label: '停用' }
]

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'single', label: '单图' },
  { value: 'comparison', label: '对比' }
]

const displayTypeOptions = [
  { value: 'single', label: '单图展示' },
  { value: 'comparison', label: '对比展示' }
]

const getCategoryName = (id) => {
  const cat = categories.value.find(c => c.id === id)
  return cat ? cat.name : '未知分类'
}

const uploadExampleImg = async (idx, file) => {
  if (file.size > 10 * 1024 * 1024) { toast.error('图片不能超过 10MB'); return }
  exampleModal.form.images[idx].uploading = true
  try {
    const res = await uploadExampleImage(file)
    if (res.success && res.data?.url) {
      exampleModal.form.images[idx].url = res.data.url
    } else {
      toast.error(res.message || '上传失败')
    }
  } catch (e) {
    toast.error(e?.message || '上传失败')
  } finally {
    exampleModal.form.images[idx].uploading = false
  }
}

// 分类管理方法
const fetchCategories = async () => {
  loadingCategories.value = true
  try {
    const res = await getAdminExampleCategories()
    if (res.success) categories.value = res.data?.categories || []
  } catch (e) {
    toast.error(e?.message || '加载分类失败')
  } finally {
    loadingCategories.value = false
  }
}

const openCreateCategory = () => {
  Object.assign(categoryModal, {
    show: true,
    isEdit: false,
    editId: null,
    saving: false,
    form: { name: '', description: '', sort: 0, is_active: true }
  })
}

const openEditCategory = (cat) => {
  Object.assign(categoryModal, {
    show: true,
    isEdit: true,
    editId: cat.id,
    saving: false,
    form: {
      name: cat.name,
      description: cat.description || '',
      sort: cat.sort ?? 0,
      is_active: !!cat.is_active
    }
  })
}

const submitCategory = async () => {
  if (!categoryModal.form.name.trim()) {
    toast.error('请填写分类名称')
    return
  }
  categoryModal.saving = true
  try {
    const payload = {
      name: categoryModal.form.name.trim(),
      description: categoryModal.form.description || '',
      sort: categoryModal.form.sort || 0,
      is_active: categoryModal.form.is_active
    }
    const res = categoryModal.isEdit
      ? await updateExampleCategory(categoryModal.editId, payload)
      : await createExampleCategory(payload)
    if (res.success) {
      toast.success(categoryModal.isEdit ? '分类已更新' : '分类已创建')
      categoryModal.show = false
      fetchCategories()
    } else {
      toast.error(res.message || '操作失败')
    }
  } catch (e) {
    toast.error(e?.message || '操作失败')
  } finally {
    categoryModal.saving = false
  }
}

const openDeleteCategory = (cat) => {
  Object.assign(confirmState, {
    show: true,
    title: '确认删除',
    message: `确认删除分类「${cat.name}」？若该分类下有示例将无法删除。`,
    confirmText: '删除',
    type: 'danger',
    loading: false,
    onConfirm: () => doDeleteCategory(cat.id)
  })
}

const doDeleteCategory = async (id) => {
  confirmState.loading = true
  try {
    const res = await deleteExampleCategory(id)
    if (res.success) {
      toast.success('分类已删除')
      categories.value = categories.value.filter(c => c.id !== id)
      confirmState.show = false
    } else {
      toast.error(res.message || '删除失败')
    }
  } catch (e) {
    toast.error(e?.message || '删除失败')
  } finally {
    confirmState.loading = false
  }
}

// 示例管理方法
const fetchExamples = async () => {
  loadingExamples.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterCategory.value) params.categoryId = filterCategory.value
    if (filterStatus.value) params.is_active = filterStatus.value
    if (filterType.value) params.sort = filterType.value
    const res = await getAdminExamples(params)
    if (res.success) {
      examples.value = res.data?.list || []
      total.value = res.data?.total || 0
    }
  } catch (e) {
    toast.error(e?.message || '加载示例失败')
  } finally {
    loadingExamples.value = false
  }
}

const openCreateExample = () => {
  Object.assign(exampleModal, {
    show: true,
    isEdit: false,
    editId: null,
    saving: false,
    form: {
      category_id: null,
      title: '',
      display_type: 'single',
      prompt: '',
      images: [],
      sort: 0,
      is_active: true
    }
  })
}

const openEditExample = (ex) => {
  Object.assign(exampleModal, {
    show: true,
    isEdit: true,
    editId: ex.id,
    saving: false,
    form: {
      category_id: ex.category_id,
      title: ex.title,
      display_type: ex.display_type,
      prompt: ex.prompt,
      images: ex.images ? JSON.parse(JSON.stringify(ex.images)) : [],
      sort: ex.sort ?? 0,
      is_active: !!ex.is_active
    }
  })
}

const submitExample = async () => {
  if (!exampleModal.form.category_id) {
    toast.error('请选择分类')
    return
  }
  if (!exampleModal.form.title.trim()) {
    toast.error('请填写标题')
    return
  }
  if (!exampleModal.form.prompt.trim()) {
    toast.error('请填写提示词')
    return
  }
  if (exampleModal.form.prompt.length > 1000) {
    toast.error('提示词不能超过1000字')
    return
  }
  exampleModal.saving = true
  try {
    const payload = {
      category_id: exampleModal.form.category_id,
      title: exampleModal.form.title.trim(),
      display_type: exampleModal.form.display_type,
      prompt: exampleModal.form.prompt.trim(),
      images: exampleModal.form.images.filter(img => img.url).map((img, idx) => ({
        url: img.url,
        label: img.label || '',
        order: idx
      })),
      sort: exampleModal.form.sort || 0,
      is_active: exampleModal.form.is_active
    }
    const res = exampleModal.isEdit
      ? await updateExample(exampleModal.editId, payload)
      : await createExample(payload)
    if (res.success) {
      toast.success(exampleModal.isEdit ? '示例已更新' : '示例已创建')
      exampleModal.show = false
      fetchExamples()
    } else {
      toast.error(res.message || '操作失败')
    }
  } catch (e) {
    toast.error(e?.message || '操作失败')
  } finally {
    exampleModal.saving = false
  }
}

const openDeleteExample = (ex, permanent) => {
  Object.assign(confirmState, {
    show: true,
    title: permanent ? '确认删除' : '确认下架',
    message: permanent
      ? `确认永久删除示例「${ex.title}」？此操作不可恢复。`
      : `确认下架示例「${ex.title}」？下架后前台用户将无法看到。`,
    confirmText: permanent ? '删除' : '下架',
    type: 'danger',
    loading: false,
    onConfirm: () => doDeleteExample(ex.id, permanent)
  })
}

const doDeleteExample = async (id, permanent) => {
  confirmState.loading = true
  try {
    const res = await deleteExample(id, permanent)
    if (res.success) {
      toast.success(permanent ? '示例已删除' : '示例已下架')
      fetchExamples()
      confirmState.show = false
    } else {
      toast.error(res.message || '操作失败')
    }
  } catch (e) {
    toast.error(e?.message || '操作失败')
  } finally {
    confirmState.loading = false
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchExamples()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    fetchExamples()
  }
}

onMounted(() => {
  fetchCategories()
  fetchExamples()
})
</script>
