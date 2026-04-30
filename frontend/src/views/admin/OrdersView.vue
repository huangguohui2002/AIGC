<template>
  <div class="p-4 sm:p-6 space-y-4">
    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <AdminSelect
        v-model="search.status"
        :options="statusOptions"
        placeholder="全部状态"
      />
      <button
        @click="doSearch"
        class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        搜索
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 6" :key="i" class="h-20 sm:h-12 bg-slate-100 rounded-xl animate-pulse" />
    </div>

    <template v-else>
      <!-- Mobile cards -->
      <div class="sm:hidden space-y-3">
        <div
          v-if="orders.length === 0"
          class="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm"
        >
          暂无订单数据
        </div>
        <div
          v-for="o in orders"
          :key="o.id"
          class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="font-mono text-xs text-slate-500 truncate max-w-[180px]">{{ o.order_no }}</div>
            <span class="px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0 ml-2" :class="statusStyle(getOrderDisplayStatus(o)).class">
              {{ statusStyle(getOrderDisplayStatus(o)).label }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-sm font-semibold text-slate-900">{{ o.user_phone }}</div>
            <div class="text-right">
              <div class="text-sm font-mono font-bold text-slate-900">¥{{ Number(o.amount).toFixed(2) }}</div>
              <div class="text-xs font-mono text-amber-600">+{{ o.points.toLocaleString() }} 积分</div>
            </div>
          </div>
          <div class="text-xs text-slate-400 mt-2">{{ formatDate(o.created_at) }}</div>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="admin-table-shell hidden sm:block bg-white border border-slate-200 rounded-xl shadow-sm">
        <div v-if="orders.length === 0" class="py-16 text-center text-slate-400 text-sm">
          暂无订单数据
        </div>
        <table v-else class="admin-table">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">订单号</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">用户</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">金额</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">积分</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">状态</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="o in orders" :key="o.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5 font-mono text-xs text-slate-500">{{ o.order_no }}</td>
              <td class="px-5 py-3.5 text-sm font-medium text-slate-900">{{ o.user_phone }}</td>
              <td class="px-5 py-3.5 text-right font-mono text-sm font-semibold text-slate-900">¥{{ Number(o.amount).toFixed(2) }}</td>
              <td class="px-5 py-3.5 text-right font-mono text-sm text-amber-600 font-semibold">+{{ o.points.toLocaleString() }}</td>
              <td class="px-5 py-3.5">
                <span class="px-2.5 py-1 rounded-lg text-xs font-medium" :class="statusStyle(getOrderDisplayStatus(o)).class">
                  {{ statusStyle(getOrderDisplayStatus(o)).label }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-xs text-slate-400">{{ formatDate(o.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <span class="whitespace-nowrap">每页</span>
          <AdminSelect
            v-model="pageSize"
            :options="pageSizeOptions"
            size="sm"
          />
          <span class="whitespace-nowrap">共 <strong class="text-slate-900">{{ total }}</strong> 条</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="prevPage"
            :disabled="page === 1"
            class="px-3 py-1.5 text-sm rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <span class="px-3 py-1.5 text-sm text-slate-600 bg-slate-50 rounded-lg border border-slate-200 min-w-[80px] text-center">
            {{ page }} / {{ totalPages || 1 }}
          </span>
          <button
            @click="nextPage"
            :disabled="page >= totalPages"
            class="px-3 py-1.5 text-sm rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { getOrders } from '../../api/admin.js'
import AdminSelect from '../../components/admin/AdminSelect.vue'

const orders = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const search = reactive({ status: '' })

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'cancelled', label: '已取消' },
  { value: 'expired', label: '已过期' },
]

const pageSizeOptions = [
  { value: 10, label: '10 条' },
  { value: 20, label: '20 条' },
  { value: 30, label: '30 条' },
  { value: 50, label: '50 条' },
]

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const ORDER_EXPIRE_MS = 60 * 60 * 1000

const isOrderExpired = (order) => {
  if (!order || order.status !== 'pending' || !order.created_at) return false
  const createdAt = new Date(order.created_at).getTime()
  if (Number.isNaN(createdAt)) return false
  return Date.now() - createdAt > ORDER_EXPIRE_MS
}

const getOrderDisplayStatus = (order) => (isOrderExpired(order) ? 'expired' : order.status)

const statusStyle = (s) => ({
  pending:   { label: '待支付', class: 'bg-amber-50 text-amber-700 border border-amber-200' },
  paid:      { label: '已支付', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  cancelled: { label: '已取消', class: 'bg-slate-100 text-slate-600' },
  expired:   { label: '已过期', class: 'bg-red-50 text-red-600 border border-red-200' },
}[s] || { label: s, class: 'bg-slate-100 text-slate-600' })

const formatDate = (d) => d ? new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = { page: page.value, limit: pageSize.value }
    if (search.status) params.status = search.status
    const res = await getOrders(params)
    if (res.success) { orders.value = res.data.list || []; total.value = res.data.total || 0 }
  } catch {} finally { loading.value = false }
}

const doSearch = () => { page.value = 1; fetchOrders() }
const prevPage = () => { if (page.value > 1) { page.value--; fetchOrders() } }
const nextPage = () => { if (page.value < totalPages.value) { page.value++; fetchOrders() } }

watch(pageSize, () => { page.value = 1; fetchOrders() })
onMounted(fetchOrders)
</script>
