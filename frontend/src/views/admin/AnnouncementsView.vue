<template>
  <div class="p-4 sm:p-6 space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <AdminSelect
        v-model="filterStatus"
        :options="statusOptions"
        placeholder="全部状态"
      />
      <button
        @click="openCreate"
        class="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        <PlusIcon class="w-4 h-4" />
        发布公告
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 sm:h-14 bg-slate-100 rounded-xl animate-pulse" />
    </div>

    <template v-else>
      <!-- Empty state -->
      <div
        v-if="announcements.length === 0"
        class="bg-white border border-slate-200 rounded-xl py-16 flex flex-col items-center shadow-sm"
      >
        <MegaphoneIcon class="w-10 h-10 text-slate-300 mb-3" />
        <p class="text-sm text-slate-400">暂无公告数据</p>
      </div>

      <template v-else>
        <!-- Mobile cards -->
        <div class="sm:hidden space-y-3">
          <div
            v-for="a in announcements"
            :key="a.id"
            class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="font-semibold text-slate-900 text-sm leading-snug flex-1">{{ a.title }}</div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <span
                  class="px-2 py-0.5 rounded-lg text-xs font-medium"
                  :class="a.level === 'important' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600'"
                >
                  {{ a.level === 'important' ? '重要' : '普通' }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-lg text-xs font-medium"
                  :class="annStatusStyle(a.status)"
                >
                  {{ annStatusLabel(a.status) }}
                </span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400">{{ formatDate(a.published_at || a.created_at) }}</span>
              <div class="flex items-center gap-1.5">
                <button @click="openEdit(a)" class="px-2.5 py-1 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors">编辑</button>
                <button v-if="a.status === 'draft'" @click="publishAnnounce(a)" class="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors">发布</button>
                <button @click="openDeleteConfirm(a)" class="px-2.5 py-1 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">删除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop table -->
        <div class="admin-table-shell hidden sm:block bg-white border border-slate-200 rounded-xl shadow-sm">
          <table class="admin-table">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50">
                <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">标题</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">级别</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">状态</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">发布时间</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="a in announcements" :key="a.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3.5 text-sm font-medium text-slate-900 max-w-xs truncate">{{ a.title }}</td>
                <td class="px-5 py-3.5">
                  <span
                    class="px-2 py-0.5 rounded-lg text-xs font-medium"
                    :class="a.level === 'important' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600'"
                  >
                    {{ a.level === 'important' ? '重要' : '普通' }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="px-2 py-0.5 rounded-lg text-xs font-medium" :class="annStatusStyle(a.status)">
                    {{ annStatusLabel(a.status) }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-xs text-slate-400">{{ formatDate(a.published_at || a.created_at) }}</td>
                <td class="px-5 py-3.5">
                  <div class="admin-actions">
                    <button @click="openEdit(a)" class="px-2.5 py-1 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors">编辑</button>
                    <button v-if="a.status === 'draft'" @click="publishAnnounce(a)" class="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors">发布</button>
                    <button @click="openDeleteConfirm(a)" class="px-2.5 py-1 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <!-- Confirm Dialog -->
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

    <!-- Create / Edit Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modal.show"
          @click.self="modal.show = false"
          class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h3 class="text-base font-bold text-slate-900">{{ modal.isEdit ? '编辑公告' : '发布公告' }}</h3>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">标题</label>
              <input
                v-model="modal.form.title"
                type="text"
                placeholder="公告标题"
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">内容</label>
              <textarea
                v-model="modal.form.content"
                rows="5"
                placeholder="公告内容..."
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-3 outline-none text-sm resize-none transition-all"
              />
            </div>
            <div class="flex gap-4">
              <div class="flex-1">
                <label class="block text-xs font-medium text-slate-600 mb-1.5">级别</label>
                <AdminSelect v-model="modal.form.level" :options="levelOptions" :full-width="true" />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-slate-600 mb-1.5">状态</label>
                <AdminSelect v-model="modal.form.status" :options="modalStatusOptions" :full-width="true" />
              </div>
            </div>

            <div class="flex gap-3 pt-1">
              <button
                @click="submitModal"
                :disabled="modal.saving"
                class="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {{ modal.saving ? '保存中...' : (modal.isEdit ? '保存修改' : '发布公告') }}
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
import { ref, reactive, onMounted, watch } from 'vue'
import { PlusIcon, MegaphoneIcon } from '@heroicons/vue/24/outline'
import { getAdminAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api/admin.js'
import { useToast } from '../../composables/useToast.js'
import AdminSelect from '../../components/admin/AdminSelect.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const toast = useToast()
const announcements = ref([])
const loading = ref(false)
const filterStatus = ref('')

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'archived', label: '已归档' },
]

const levelOptions = [
  { value: 'normal', label: '普通' },
  { value: 'important', label: '重要' },
]

const modalStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '立即发布' },
]

const modal = reactive({
  show: false, isEdit: false, editId: null, saving: false,
  form: { title: '', content: '', level: 'normal', status: 'draft' },
})

const confirmState = reactive({
  show: false, title: '', message: '', confirmText: '确认', type: 'danger', loading: false, onConfirm: () => {},
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '-'

const annStatusLabel = (s) => ({ draft: '草稿', published: '已发布', archived: '已归档' }[s] || s)
const annStatusStyle = (s) => ({
  draft:     'bg-amber-50 text-amber-700 border border-amber-200',
  published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  archived:  'bg-slate-100 text-slate-600',
}[s] || 'bg-slate-100 text-slate-600')

const fetchAnnouncements = async () => {
  loading.value = true
  try {
    const params = { page: 1, limit: 50 }
    if (filterStatus.value) params.status = filterStatus.value
    const res = await getAdminAnnouncements(params)
    if (res.success) announcements.value = res.data.list || []
  } catch {} finally { loading.value = false }
}

const openCreate = () => Object.assign(modal, {
  show: true, isEdit: false, editId: null, saving: false,
  form: { title: '', content: '', level: 'normal', status: 'draft' },
})
const openEdit = (a) => Object.assign(modal, {
  show: true, isEdit: true, editId: a.id, saving: false,
  form: { title: a.title, content: a.content, level: a.level, status: a.status },
})

const submitModal = async () => {
  if (!modal.form.title || !modal.form.content) { toast.error('请填写标题和内容'); return }
  modal.saving = true
  try {
    const res = modal.isEdit
      ? await updateAnnouncement(modal.editId, modal.form)
      : await createAnnouncement(modal.form)
    if (res.success) {
      toast.success(modal.isEdit ? '公告已更新' : '公告已发布')
      modal.show = false
      fetchAnnouncements()
    } else toast.error(res.message)
  } catch (e) { toast.error(e?.message || '操作失败') }
  finally { modal.saving = false }
}

const publishAnnounce = async (a) => {
  try {
    const res = await updateAnnouncement(a.id, { ...a, status: 'published' })
    if (res.success) { a.status = 'published'; toast.success('已发布') }
  } catch {}
}

const openDeleteConfirm = (a) => {
  Object.assign(confirmState, {
    show: true,
    title: '确认删除',
    message: `确认删除公告「${a.title}」？此操作不可恢复。`,
    confirmText: '删除',
    type: 'danger',
    loading: false,
    onConfirm: () => doDeleteAnnounce(a.id),
  })
}

const doDeleteAnnounce = async (id) => {
  confirmState.loading = true
  try {
    const res = await deleteAnnouncement(id)
    if (res.success) {
      announcements.value = announcements.value.filter(a => a.id !== id)
      toast.success('已删除')
      confirmState.show = false
    }
  } catch (e) { toast.error(e?.message) }
  finally { confirmState.loading = false }
}

watch(filterStatus, fetchAnnouncements)
onMounted(fetchAnnouncements)
</script>
