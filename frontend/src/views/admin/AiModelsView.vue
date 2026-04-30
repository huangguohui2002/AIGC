<template>
  <div class="p-4 sm:p-6 space-y-4">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <AdminSelect v-model="filterType" :options="typeFilterOptions" placeholder="全部类型" />
        <p class="text-sm text-slate-500">共 <strong class="text-slate-900">{{ filteredModels.length }}</strong> 个模型</p>
      </div>
      <button
        @click="openCreate"
        class="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        <PlusIcon class="w-4 h-4" />
        新增模型
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 sm:h-14 bg-slate-100 rounded-xl animate-pulse" />
    </div>

    <template v-else>
      <div
        v-if="filteredModels.length === 0"
        class="bg-white border border-slate-200 rounded-xl py-16 flex flex-col items-center shadow-sm"
      >
        <CircleStackIcon class="w-10 h-10 text-slate-300 mb-3" />
        <p class="text-sm text-slate-400">暂无 AI 模型，点击右上角新增</p>
      </div>

      <div v-else class="sm:hidden space-y-3">
        <div
          v-for="model in filteredModels"
          :key="model.id"
          class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-900 text-sm">{{ model.name }}</div>
              <div v-if="model.subtitle" class="text-xs text-slate-400 mt-0.5">{{ model.subtitle }}</div>
              <div class="text-xs text-slate-400 mt-0.5 font-mono truncate">{{ model.model_name }}</div>
              <div class="text-xs text-slate-400 mt-1 truncate">Provider: {{ providerDisplayName(model) }}</div>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span class="px-2 py-0.5 rounded-lg text-xs font-medium" :class="typeClass(model.type)">
                {{ typeLabel(model.type) }}
              </span>
              <span
                class="px-2 py-0.5 rounded-lg text-xs font-medium"
                :class="model.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'"
              >
                {{ model.is_active ? '启用' : '停用' }}
              </span>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 whitespace-nowrap">
              <span class="text-xs text-slate-400 whitespace-nowrap">排序: {{ model.sort_order ?? 0 }}</span>
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                {{ model.points_cost ?? 0 }} 积分/次
              </span>
            </div>
            <div class="flex flex-wrap justify-end gap-2">
              <button @click="openEdit(model)" class="px-2.5 py-1 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap">编辑</button>
              <button
                @click="openToggleActive(model)"
                class="px-2.5 py-1 text-xs rounded-lg border transition-colors whitespace-nowrap"
                :class="model.is_active ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'"
              >
                {{ model.is_active ? '停用' : '启用' }}
              </button>
              <button @click="openDeleteConfirm(model)" class="px-2.5 py-1 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap">删除</button>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-table-shell hidden sm:block bg-white border border-slate-200 rounded-xl shadow-sm">
        <table class="admin-table min-w-[900px]">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">名称 / 副标题</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Model ID</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">类型</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Provider</th>
              <th class="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">积分消耗</th>
              <th class="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">排序</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">状态</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="model in filteredModels" :key="model.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5">
                <div class="font-semibold text-sm text-slate-900">{{ model.name }}</div>
                <div v-if="model.subtitle" class="text-xs text-slate-400 mt-0.5">{{ model.subtitle }}</div>
              </td>
              <td class="px-5 py-3.5 font-mono text-xs text-slate-500 max-w-[160px] truncate">{{ model.model_name }}</td>
              <td class="px-5 py-3.5">
                <span class="px-2 py-0.5 rounded-lg text-xs font-medium" :class="typeClass(model.type)">
                  {{ typeLabel(model.type) }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-xs text-slate-500 max-w-[260px]">
                <div class="font-medium text-slate-700 truncate">{{ providerDisplayName(model) }}</div>
                <div class="text-slate-400 font-mono truncate">{{ providerBaseUrl(model) }}</div>
              </td>
              <td class="px-5 py-3.5 text-center text-sm text-slate-500">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  {{ model.points_cost ?? 0 }} 积分
                </span>
              </td>
              <td class="px-5 py-3.5 text-center text-sm text-slate-500">{{ model.sort_order ?? 0 }}</td>
              <td class="px-5 py-3.5">
                <span
                  class="px-2.5 py-1 rounded-lg text-xs font-medium"
                  :class="model.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'"
                >
                  {{ model.is_active ? '启用' : '停用' }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="admin-actions">
                  <button @click="openEdit(model)" class="px-2.5 py-1 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap">编辑</button>
                  <button
                    @click="openToggleActive(model)"
                    class="px-2.5 py-1 text-xs rounded-lg border transition-colors whitespace-nowrap"
                    :class="model.is_active ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'"
                  >
                    {{ model.is_active ? '停用' : '启用' }}
                  </button>
                  <button @click="openDeleteConfirm(model)" class="px-2.5 py-1 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

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

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modal.show"
          @click.self="modal.show = false"
          class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-xl overflow-y-auto max-h-[90vh]">
            <h3 class="text-base font-bold text-slate-900 mb-5">{{ modal.isEdit ? '编辑 AI 模型' : '新增 AI 模型' }}</h3>

            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1.5">显示名称 <span class="text-rose-500">*</span></label>
                  <input
                    v-model="modal.form.name"
                    type="text"
                    placeholder="例：GPT Image 1"
                    class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1.5">副标题 <span class="text-slate-400">(选填)</span></label>
                  <input
                    v-model="modal.form.subtitle"
                    type="text"
                    placeholder="例：高质量图像"
                    class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1.5">类型 <span class="text-rose-500">*</span></label>
                  <AdminSelect v-model="modal.form.type" :options="typeOptions" :full-width="true" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1.5">排序权重</label>
                  <input
                    v-model.number="modal.form.sort_order"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">单次消耗积分 <span class="text-slate-400">(选填，默认 0)</span></label>
                <input
                  v-model.number="modal.form.points_cost"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
                />
                <p class="mt-1 text-xs text-slate-400">用户每次调用该模型生成时扣除的积分数，0 表示免费</p>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">模型标识 (model_name) <span class="text-rose-500">*</span></label>
                <input
                  v-model="modal.form.model_name"
                  type="text"
                  placeholder="例：gpt-image-2 / sora-2"
                  class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm font-mono transition-all"
                />
              </div>

              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1.5">选择已有 Provider <span class="text-slate-400">(推荐)</span></label>
                  <AdminSelect
                    v-model="modal.form.provider_id"
                    :options="providerOptions"
                    :full-width="true"
                    placeholder="请选择已配置的 Provider"
                  />
                  <p class="mt-1 text-xs text-slate-400">优先复用已创建的 OpenAI-compatible Provider。</p>
                </div>

                <div class="border-t border-slate-200 pt-4 space-y-4">
                  <div>
                    <div class="text-sm font-medium text-slate-700">如果不选 Provider，可直接填写下面信息</div>
                    <p class="text-xs text-slate-400">系统会按 Endpoint + API Key 自动创建或复用对应 Provider。</p>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-slate-600 mb-1.5">Provider 名称 <span class="text-slate-400">(选填)</span></label>
                      <input
                        v-model="modal.form.provider_name"
                        type="text"
                        placeholder="例：OpenAI 官方"
                        class="w-full bg-white border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-600 mb-1.5">Provider Code <span class="text-slate-400">(选填)</span></label>
                      <input
                        v-model="modal.form.provider_code"
                        type="text"
                        placeholder="例：openai-main"
                        class="w-full bg-white border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm font-mono transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1.5">API Endpoint <span class="text-slate-400">(选填)</span></label>
                    <input
                      v-model="modal.form.api_endpoint"
                      type="text"
                      placeholder="例：https://api.openai.com/v1 或 https://gateway.example.com/v1/chat/completions"
                      class="w-full bg-white border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm font-mono transition-all"
                    />
                    <p class="mt-1 text-xs text-slate-400">支持直接填兼容根地址，或填带 `/chat/completions` 的完整地址，后端会自动规整。</p>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1.5">
                      API Key
                      <span class="text-slate-400 font-normal">{{ modal.isEdit ? '（留空则不修改现有 Provider Key）' : '（当未选择 Provider 时必填）' }}</span>
                    </label>
                    <input
                      v-model="modal.form.api_key"
                      type="text"
                      :placeholder="modal.isEdit ? '留空则保持原有 API Key 不变' : 'sk-xxxx'"
                      class="w-full bg-white border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm font-mono transition-all"
                    />
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between py-2.5 px-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span class="text-sm font-medium text-slate-700">启用状态</span>
                  <p class="text-xs text-slate-400 mt-0.5">启用后前台用户可选择此模型</p>
                </div>
                <button
                  @click="modal.form.is_active = modal.form.is_active ? 0 : 1"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 overflow-hidden"
                  :class="modal.form.is_active ? 'bg-emerald-500' : 'bg-slate-300'"
                >
                  <span
                    class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                    :class="modal.form.is_active ? 'translate-x-5' : 'translate-x-0'"
                  />
                </button>
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                @click="submitModal"
                :disabled="modal.saving"
                class="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {{ modal.saving ? '保存中...' : (modal.isEdit ? '保存修改' : '创建模型') }}
              </button>
              <button
                @click="modal.show = false"
                class="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { PlusIcon, CircleStackIcon } from '@heroicons/vue/24/outline'
import { getAdminAiModels, createAiModel, updateAiModel, deleteAiModel, getAdminAiProviders } from '../../api/admin.js'
import { useToast } from '../../composables/useToast.js'
import AdminSelect from '../../components/admin/AdminSelect.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const toast = useToast()
const models = ref([])
const providers = ref([])
const loading = ref(false)
const filterType = ref('')

const typeFilterOptions = [
  { value: '', label: '全部类型' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'both', label: '两者' },
]

const typeOptions = [
  { value: 'image', label: '图片 (image)' },
  { value: 'video', label: '视频 (video)' },
  { value: 'both', label: '两者 (image+video)' },
]

const providerOptions = computed(() => [
  { value: '', label: '不选择，使用下方 Endpoint/Key 自动创建' },
  ...providers.value.map((provider) => ({
    value: provider.id,
    label: `${provider.name} (${provider.code})`
  }))
])

const typeLabel = (type) => ({ image: '图片', video: '视频', both: '两者' }[type] || type)
const typeClass = (type) => ({
  image: 'bg-blue-50 text-blue-700 border border-blue-200',
  video: 'bg-violet-50 text-violet-700 border border-violet-200',
  both: 'bg-rose-50 text-rose-700 border border-rose-200',
}[type] || 'bg-slate-100 text-slate-600')

const providerDisplayName = (model) => model?.provider?.name || model?.provider?.code || '未绑定'
const providerBaseUrl = (model) => model?.provider?.base_url || '—'

const filteredModels = computed(() =>
  filterType.value
    ? models.value.filter((model) => model.type === filterType.value)
    : models.value
)

const emptyForm = () => ({
  name: '',
  subtitle: '',
  type: 'image',
  model_name: '',
  provider_id: '',
  provider_name: '',
  provider_code: '',
  api_key: '',
  api_endpoint: '',
  sort_order: 0,
  is_active: 1,
  points_cost: 0,
})

const modal = reactive({
  show: false,
  isEdit: false,
  editId: null,
  saving: false,
  form: emptyForm(),
})

const confirmState = reactive({
  show: false,
  title: '',
  message: '',
  confirmText: '确认',
  type: 'danger',
  loading: false,
  onConfirm: () => {},
})

const fetchModels = async () => {
  const res = await getAdminAiModels()
  if (res.success) {
    models.value = res.data?.models || []
  }
}

const fetchProviders = async () => {
  const res = await getAdminAiProviders()
  if (res.success) {
    providers.value = (res.data?.providers || []).filter((provider) => provider.enabled)
  }
}

const fetchPageData = async () => {
  loading.value = true
  try {
    await Promise.all([fetchModels(), fetchProviders()])
  } catch (error) {
    toast.error(error?.msg || error?.message || '加载模型配置失败')
  } finally {
    loading.value = false
  }
}

const openCreate = () => Object.assign(modal, {
  show: true,
  isEdit: false,
  editId: null,
  saving: false,
  form: emptyForm(),
})

const openEdit = (model) => Object.assign(modal, {
  show: true,
  isEdit: true,
  editId: model.id,
  saving: false,
  form: {
    name: model.name,
    subtitle: model.subtitle || '',
    type: model.type,
    model_name: model.model_name,
    provider_id: model.provider?.id || '',
    provider_name: model.provider?.name || '',
    provider_code: model.provider?.code || '',
    api_key: '',
    api_endpoint: model.provider?.base_url || '',
    sort_order: model.sort_order ?? 0,
    is_active: model.is_active ? 1 : 0,
    points_cost: model.points_cost ?? 0,
  },
})

const submitModal = async () => {
  if (!modal.form.name.trim()) {
    toast.error('请填写显示名称')
    return
  }
  if (!modal.form.model_name.trim()) {
    toast.error('请填写模型标识')
    return
  }
  if (!modal.form.type) {
    toast.error('请选择模型类型')
    return
  }
  if (!Number.isInteger(modal.form.points_cost) || modal.form.points_cost < 0) {
    toast.error('积分消耗必须为非负整数')
    return
  }
  if (!modal.form.provider_id && !(String(modal.form.api_endpoint || '').trim() && String(modal.form.api_key || '').trim())) {
    toast.error('请选择已有 Provider，或填写 Endpoint 和 API Key')
    return
  }

  modal.saving = true
  try {
    const payload = {
      name: modal.form.name.trim(),
      subtitle: modal.form.subtitle?.trim() || '',
      type: modal.form.type,
      model_name: modal.form.model_name.trim(),
      provider_id: modal.form.provider_id || undefined,
      provider_name: modal.form.provider_name?.trim() || undefined,
      provider_code: modal.form.provider_code?.trim() || undefined,
      api_endpoint: modal.form.api_endpoint?.trim() || undefined,
      api_key: modal.form.api_key?.trim() || undefined,
      sort_order: modal.form.sort_order ?? 0,
      is_active: modal.form.is_active ? 1 : 0,
      points_cost: modal.form.points_cost ?? 0,
    }

    if (payload.provider_id) {
      delete payload.api_endpoint
      if (!payload.api_key) delete payload.api_key
    }

    if (modal.isEdit && !payload.api_key) {
      delete payload.api_key
    }

    const res = modal.isEdit
      ? await updateAiModel(modal.editId, payload)
      : await createAiModel(payload)

    if (res.success) {
      toast.success(modal.isEdit ? '模型已更新' : '模型已创建')
      modal.show = false
      await fetchPageData()
    } else {
      toast.error(res.message || '操作失败')
    }
  } catch (error) {
    toast.error(error?.msg || error?.message || '操作失败')
  } finally {
    modal.saving = false
  }
}

const openToggleActive = (model) => {
  const willDisable = !!model.is_active
  Object.assign(confirmState, {
    show: true,
    title: willDisable ? '确认停用' : '确认启用',
    message: willDisable
      ? `确认停用模型「${model.name}」？停用后前台用户将无法选择此模型。`
      : `确认启用模型「${model.name}」？启用后前台用户可选择此模型。`,
    confirmText: willDisable ? '停用' : '启用',
    type: willDisable ? 'warning' : 'info',
    loading: false,
    onConfirm: () => doToggleActive(model),
  })
}

const doToggleActive = async (model) => {
  const newVal = model.is_active ? 0 : 1
  confirmState.loading = true
  try {
    const res = await updateAiModel(model.id, { is_active: newVal })
    if (res.success) {
      model.is_active = newVal
      toast.success(newVal ? '已启用' : '已停用')
      confirmState.show = false
    } else {
      toast.error(res.message || '操作失败')
    }
  } catch (error) {
    toast.error(error?.msg || '操作失败')
  } finally {
    confirmState.loading = false
  }
}

const openDeleteConfirm = (model) => {
  Object.assign(confirmState, {
    show: true,
    title: '确认删除',
    message: `确认删除模型「${model.name}」？此操作不可恢复，建议优先改为停用。`,
    confirmText: '删除',
    type: 'danger',
    loading: false,
    onConfirm: () => doDeleteModel(model),
  })
}

const doDeleteModel = async (model) => {
  confirmState.loading = true
  try {
    const res = await deleteAiModel(model.id)
    if (res.success) {
      models.value = models.value.filter((item) => item.id !== model.id)
      toast.success('模型已删除')
      confirmState.show = false
    } else {
      toast.error(res.message || '删除失败')
    }
  } catch (error) {
    toast.error(error?.msg || '删除失败')
  } finally {
    confirmState.loading = false
  }
}

onMounted(fetchPageData)
</script>
