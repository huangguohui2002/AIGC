<template>
  <div class="p-4 sm:p-6 space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-slate-500">共 <strong class="text-slate-900">{{ packages.length }}</strong> 个套餐</p>
      <button
        @click="openCreate"
        class="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        <PlusIcon class="w-4 h-4" />
        新增套餐
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 sm:h-14 bg-slate-100 rounded-xl animate-pulse" />
    </div>

    <template v-else>
      <!-- Empty state -->
      <div
        v-if="packages.length === 0"
        class="bg-white border border-slate-200 rounded-xl py-16 flex flex-col items-center shadow-sm"
      >
        <CubeIcon class="w-10 h-10 text-slate-300 mb-3" />
        <p class="text-sm text-slate-400">暂无积分套餐</p>
      </div>

      <!-- Mobile cards -->
      <div v-else class="sm:hidden space-y-3">
        <div
          v-for="pkg in packages"
          :key="pkg.id"
          class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <div class="font-semibold text-slate-900 text-sm">{{ pkg.name }}</div>
              <div class="flex items-center gap-2 mt-1">
                <span class="font-mono text-amber-600 text-sm font-bold">{{ pkg.points.toLocaleString() }} 积分</span>
                <span v-if="pkg.bonus_points" class="text-xs text-emerald-600 font-medium">+{{ pkg.bonus_points }} 赠</span>
              </div>
            </div>
            <div class="text-right">
              <div class="font-mono font-bold text-slate-900 text-base">¥{{ Number(pkg.price).toFixed(2) }}</div>
              <span
                class="px-2 py-0.5 rounded-lg text-xs font-medium mt-1 inline-block"
                :class="pkg.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'"
              >
                {{ pkg.is_active ? '上架' : '下架' }}
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400">排序: {{ pkg.sort_order ?? 0 }}</span>
            <div class="flex gap-2">
              <button @click="openEdit(pkg)" class="px-2.5 py-1 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors">编辑</button>
              <button @click="toggleActive(pkg)" class="px-2.5 py-1 text-xs rounded-lg border transition-colors"
                :class="pkg.is_active ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'">
                {{ pkg.is_active ? '下架' : '上架' }}
              </button>
              <button @click="openPermanentDelete(pkg)" class="px-2.5 py-1 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="admin-table-shell hidden sm:block bg-white border border-slate-200 rounded-xl shadow-sm">
        <table class="admin-table min-w-[700px]">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">套餐名称</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">积分</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">赠送积分</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">价格</th>
              <th class="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">排序</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">状态</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="pkg in packages" :key="pkg.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5 text-sm font-semibold text-slate-900 whitespace-nowrap">{{ pkg.name }}</td>
              <td class="px-5 py-3.5 text-right font-mono text-sm font-bold text-amber-600 whitespace-nowrap">{{ pkg.points.toLocaleString() }}</td>
              <td class="px-5 py-3.5 text-right font-mono text-sm text-emerald-600 whitespace-nowrap">{{ pkg.bonus_points ? '+' + pkg.bonus_points.toLocaleString() : '—' }}</td>
              <td class="px-5 py-3.5 text-right font-mono text-sm font-semibold text-slate-900 whitespace-nowrap">¥{{ Number(pkg.price).toFixed(2) }}</td>
              <td class="px-5 py-3.5 text-center text-sm text-slate-500">{{ pkg.sort_order ?? 0 }}</td>
              <td class="px-5 py-3.5">
                <span
                  class="px-2.5 py-1 rounded-lg text-xs font-medium"
                  :class="pkg.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'"
                >
                  {{ pkg.is_active ? '上架' : '下架' }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="admin-actions">
                  <button @click="openEdit(pkg)" class="px-2.5 py-1 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors">编辑</button>
                  <button @click="toggleActive(pkg)" class="px-2.5 py-1 text-xs rounded-lg border transition-colors"
                    :class="pkg.is_active ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'">
                    {{ pkg.is_active ? '下架' : '上架' }}
                  </button>
                  <button @click="openPermanentDelete(pkg)" class="px-2.5 py-1 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
          v-if="formModal.show"
          @click.self="formModal.show = false"
          class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h3 class="text-base font-bold text-slate-900">{{ formModal.isEdit ? '编辑套餐' : '新增套餐' }}</h3>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">套餐名称 <span class="text-rose-500">*</span></label>
              <input v-model="formModal.name" type="text" placeholder="例如：基础包 100 积分"
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">积分数量 <span class="text-rose-500">*</span></label>
                <input v-model.number="formModal.points" type="number" min="1" placeholder="100"
                  class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">赠送积分</label>
                <input v-model.number="formModal.bonus_points" type="number" min="0" placeholder="0"
                  class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">价格（元） <span class="text-rose-500">*</span></label>
                <input v-model.number="formModal.price" type="number" min="0.01" step="0.01" placeholder="9.90"
                  class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">排序</label>
                <input v-model.number="formModal.sort_order" type="number" min="0" placeholder="0"
                  class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all" />
              </div>
            </div>

            <div v-if="formModal.isEdit" class="flex items-center gap-3">
              <label class="text-xs font-medium text-slate-600">上架状态</label>
              <button
                @click="formModal.is_active = !formModal.is_active"
                class="relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 overflow-hidden"
                :class="formModal.is_active ? 'bg-emerald-500' : 'bg-slate-300'"
              >
                <span
                  class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                  :class="formModal.is_active ? 'translate-x-4' : 'translate-x-0'"
                />
              </button>
              <span class="text-xs" :class="formModal.is_active ? 'text-emerald-600' : 'text-slate-400'">
                {{ formModal.is_active ? '上架中' : '已下架' }}
              </span>
            </div>

            <div class="flex gap-3">
              <button
                @click="submitForm"
                :disabled="formModal.saving"
                class="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {{ formModal.saving ? '保存中...' : (formModal.isEdit ? '保存修改' : '确认创建') }}
              </button>
              <button
                @click="formModal.show = false"
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
import { ref, reactive, onMounted } from 'vue'
import { PlusIcon, CubeIcon } from '@heroicons/vue/24/outline'
import { getAdminPackages, createAdminPackage, updateAdminPackage, deleteAdminPackage, permanentDeleteAdminPackage } from '../../api/admin.js'
import { useToast } from '../../composables/useToast.js'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const toast = useToast()
const packages = ref([])
const loading = ref(false)

const formModal = reactive({
  show: false, isEdit: false, id: null, saving: false,
  name: '', points: null, bonus_points: 0, price: null, sort_order: 0, is_active: true,
})

const confirmState = reactive({
  show: false, title: '', message: '', confirmText: '确认', type: 'danger', loading: false, onConfirm: () => {},
})

const fetchPackages = async () => {
  loading.value = true
  try {
    const res = await getAdminPackages()
    if (res.success) packages.value = res.data?.packages || res.data?.list || []
  } catch {} finally { loading.value = false }
}

const openCreate = () => {
  Object.assign(formModal, { show: true, isEdit: false, id: null, saving: false, name: '', points: null, bonus_points: 0, price: null, sort_order: 0, is_active: true })
}

const openEdit = (pkg) => {
  Object.assign(formModal, {
    show: true, isEdit: true, id: pkg.id, saving: false,
    name: pkg.name, points: pkg.points, bonus_points: pkg.bonus_points || 0,
    price: pkg.price, sort_order: pkg.sort_order ?? 0, is_active: !!pkg.is_active,
  })
}

const submitForm = async () => {
  if (!formModal.name?.trim()) { toast.error('请填写套餐名称'); return }
  if (!formModal.points || formModal.points < 1) { toast.error('积分数量至少为1'); return }
  if (!formModal.price || formModal.price <= 0) { toast.error('请填写有效价格'); return }
  formModal.saving = true
  try {
    const payload = {
      name: formModal.name.trim(),
      points: formModal.points,
      bonus_points: formModal.bonus_points || 0,
      price: formModal.price,
      sort_order: formModal.sort_order || 0,
    }
    if (formModal.isEdit) payload.is_active = formModal.is_active
    const res = formModal.isEdit
      ? await updateAdminPackage(formModal.id, payload)
      : await createAdminPackage(payload)
    if (res.success) {
      toast.success(formModal.isEdit ? '套餐已更新' : '套餐已创建')
      formModal.show = false
      fetchPackages()
    } else toast.error(res.message || '操作失败')
  } catch (e) { toast.error(e?.message || '操作失败') }
  finally { formModal.saving = false }
}

const toggleActive = (pkg) => {
  const willDeactivate = !!pkg.is_active
  Object.assign(confirmState, {
    show: true,
    title: willDeactivate ? '确认下架' : '确认上架',
    message: willDeactivate
      ? `确认下架套餐「${pkg.name}」？下架后用户将无法购买。`
      : `确认上架套餐「${pkg.name}」？上架后用户可购买此套餐。`,
    confirmText: willDeactivate ? '下架' : '上架',
    type: willDeactivate ? 'warning' : 'info',
    loading: false,
    onConfirm: () => doToggleActive(pkg, willDeactivate),
  })
}

const doToggleActive = async (pkg, willDeactivate) => {
  confirmState.loading = true
  try {
    let res
    if (willDeactivate) {
      // 软删除接口：将 is_active 置 0
      res = await deleteAdminPackage(pkg.id)
    } else {
      res = await updateAdminPackage(pkg.id, { is_active: true })
    }
    if (res.success) {
      pkg.is_active = !willDeactivate
      toast.success(willDeactivate ? '已下架' : '已上架')
      confirmState.show = false
    } else toast.error(res.message || '操作失败')
  } catch (e) { toast.error(e?.message || '操作失败') }
  finally { confirmState.loading = false }
}

const openPermanentDelete = (pkg) => {
  Object.assign(confirmState, {
    show: true,
    title: '永久删除',
    message: `确认永久删除套餐「${pkg.name}」？此操作不可恢复！`,
    confirmText: '永久删除',
    type: 'danger',
    loading: false,
    onConfirm: () => doPermanentDelete(pkg),
  })
}

const doPermanentDelete = async (pkg) => {
  confirmState.loading = true
  try {
    const res = await permanentDeleteAdminPackage(pkg.id)
    if (res.success) {
      toast.success('套餐已永久删除')
      packages.value = packages.value.filter(p => p.id !== pkg.id)
      confirmState.show = false
    } else toast.error(res.message || '删除失败')
  } catch (e) { toast.error(e?.message || '删除失败') }
  finally { confirmState.loading = false }
}

onMounted(fetchPackages)
</script>
