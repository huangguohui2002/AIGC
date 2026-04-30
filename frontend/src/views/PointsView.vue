<template>
  <div class="p-6 md:p-8 space-y-8">
    <h2 class="md:hidden text-lg font-bold text-slate-900">积分明细</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="px-5 py-5 rounded-2xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm"
      >
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="stat.iconBg">
          <component :is="stat.icon" class="w-5 h-5" :class="stat.iconColor" />
        </div>
        <div>
          <p class="text-xs text-slate-500 mb-0.5">{{ stat.label }}</p>
          <p class="text-xl font-bold font-mono" :class="stat.valueColor">{{ stat.value.toLocaleString() }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-slate-200">
        <h3 class="text-sm font-semibold text-slate-900">积分流水明细</h3>
        <div class="flex gap-1 p-1 bg-slate-100 rounded-full border border-slate-200 self-start sm:self-auto overflow-x-auto">
          <button
            v-for="t in typeFilters"
            :key="t.value"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
            :class="activeFilter === t.value ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            @click="activeFilter = t.value"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 6" :key="i" class="h-12 bg-slate-100 rounded-lg animate-pulse" />
      </div>

      <div v-else-if="transactions.length === 0" class="flex flex-col items-center py-12">
        <CreditCardIcon class="w-10 h-10 text-slate-300 mb-3" />
        <p class="text-sm text-slate-500">暂无流水记录</p>
      </div>

      <template v-else>
        <div class="sm:hidden divide-y divide-slate-100">
          <div v-for="tx in transactions" :key="tx.id" class="flex items-center gap-3 px-4 py-3.5">
            <span class="px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0 whitespace-nowrap" :class="typeStyle(tx).class">
              {{ typeStyle(tx).label }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-slate-700 truncate">{{ tx.description || '-' }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(tx.created_at) }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-sm font-mono font-semibold" :class="tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'">
                {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount.toLocaleString() }}
              </p>
              <p class="text-xs text-slate-500 font-mono">余 {{ tx.balance_after.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full min-w-[520px]">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50">
                <th class="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">类型</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">描述</th>
                <th class="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">变动</th>
                <th class="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">余额</th>
                <th class="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">时间</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3.5">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-medium" :class="typeStyle(tx).class">
                    {{ typeStyle(tx).label }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-sm text-slate-600">{{ tx.description }}</td>
                <td
                  class="px-5 py-3.5 text-right font-mono text-sm font-semibold"
                  :class="tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount.toLocaleString() }}
                </td>
                <td class="px-5 py-3.5 text-right font-mono text-sm text-slate-600">{{ tx.balance_after.toLocaleString() }}</td>
                <td class="px-5 py-3.5 text-right text-xs text-slate-500">{{ formatDate(tx.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between px-5 py-3 border-t border-slate-200">
          <span class="text-xs text-slate-500">共 {{ total }} 条记录</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 disabled:opacity-40 transition-colors"
              :disabled="page === 1"
              @click="prevPage"
            >
              上一页
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 disabled:opacity-40 transition-colors"
              :disabled="page >= Math.ceil(total / pageSize)"
              @click="nextPage"
            >
              下一页
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { CreditCardIcon, BoltIcon, ArrowUpCircleIcon } from '@heroicons/vue/24/outline'
import { getBalance, getTransactions } from '../api/points.js'
import { useUserStore } from '../stores/userStore.js'

const userStore = useUserStore()
const loading = ref(false)
const transactions = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const activeFilter = ref('')

const balanceData = reactive({ points: 0, total_recharged: 0, total_consumed: 0 })

const stats = computed(() => [
  { label: '当前余额', value: balanceData.points, icon: BoltIcon, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', valueColor: 'text-slate-900' },
  { label: '累计充值', value: balanceData.total_recharged, icon: ArrowUpCircleIcon, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', valueColor: 'text-emerald-600' },
  { label: '累计消费', value: balanceData.total_consumed, icon: CreditCardIcon, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', valueColor: 'text-amber-600' },
])

const typeFilters = [
  { label: '全部', value: '' },
  { label: '充值', value: 'recharge' },
  { label: '消费', value: 'consume' },
  { label: '邀请', value: 'invite_reward' },
  { label: '签到', value: 'daily_checkin' },
]

const typeStyle = (tx) => {
  if (tx.related_type === 'daily_checkin') {
    return { label: '每日签到', class: 'bg-blue-50 text-blue-700 border border-blue-200' }
  }

  return {
    recharge: { label: '充值', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    consume: { label: '消费', class: 'bg-amber-50 text-amber-700 border border-amber-200' },
    invite_reward: { label: '邀请奖励', class: 'bg-blue-50 text-blue-700 border border-blue-200' },
    refund: { label: '退款', class: 'bg-rose-50 text-rose-700 border border-rose-200' },
    admin_adjust: { label: '管理调整', class: 'bg-slate-100 text-slate-600 border border-slate-200' },
  }[tx.type] || { label: tx.type, class: 'bg-slate-100 text-slate-600 border border-slate-200' }
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchBalance = async () => {
  const res = await getBalance()
  if (res.success) {
    Object.assign(balanceData, res.data)
    userStore.points = res.data.points
  }
}

const fetchTx = async () => {
  loading.value = true
  try {
    const params = { page: page.value, limit: pageSize }
    if (activeFilter.value) params.type = activeFilter.value
    const res = await getTransactions(params)
    if (res.success) {
      transactions.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch {
  } finally {
    loading.value = false
  }
}

const prevPage = () => {
  if (page.value > 1) page.value--
}

const nextPage = () => {
  if (page.value < Math.ceil(total.value / pageSize)) page.value++
}

watch(activeFilter, () => {
  page.value = 1
})

watch([activeFilter, page], fetchTx)

onMounted(() => {
  fetchBalance()
  fetchTx()
})
</script>
