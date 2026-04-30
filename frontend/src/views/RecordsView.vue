<template>
  <div class="p-6 md:p-8 space-y-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-900">生成记录</h2>
        <p class="text-sm text-slate-500 mt-0.5">查看所有 AI 生成历史</p>
      </div>
      <div class="flex gap-1 p-1 bg-slate-100 rounded-full border border-slate-200 self-start sm:self-auto flex-shrink-0">
        <button
          v-for="t in tabs"
          :key="t.value"
          @click="activeTab = t.value"
          class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
          :class="activeTab === t.value ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
      <ExclamationTriangleIcon class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div class="text-sm text-amber-800 leading-6">
        <p class="font-medium">生成图片仅保留 {{ retentionDays }} 天</p>
        <p class="text-amber-700">到期后系统会自动清理图片文件，记录会继续保留，请及时下载保存。</p>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div v-for="i in 10" :key="i" class="aspect-square rounded-xl bg-slate-200 animate-pulse" />
    </div>

    <div v-else-if="records.length === 0" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
        <ClockIcon class="w-7 h-7 text-slate-400" />
      </div>
      <p class="text-base font-medium text-slate-900 mb-1">暂无生成记录</p>
      <p class="text-sm text-slate-500">快去创作你的第一条 AI 内容</p>
      <RouterLink
        to="/"
        class="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        开始创作
      </RouterLink>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div
        v-for="item in records"
        :key="item.id"
        class="group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer"
        @click="openDetail(item)"
      >
        <div class="aspect-square bg-slate-200 relative overflow-hidden">
          <template v-if="item.type === 'image' && !isExpired(item) && getResultUrls(item).length > 1">
            <div class="grid grid-cols-2 grid-rows-2 w-full h-full">
              <div
                v-for="(url, idx) in getResultUrls(item).slice(0, 4)"
                :key="`${item.id}-${idx}`"
                class="relative border border-white/30"
              >
                <img :src="url" class="w-full h-full object-cover" />
              </div>
            </div>
          </template>

          <template v-else-if="item.type === 'image' && !isExpired(item) && getFirstUrl(item)">
            <img
              :src="getFirstUrl(item)"
              class="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              :class="imageLoadStates[item.id] ? 'opacity-100' : 'opacity-0'"
              @load="imageLoadStates[item.id] = true"
            />
            <div
              v-if="!imageLoadStates[item.id]"
              class="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse"
            />
          </template>

          <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
            <ExclamationTriangleIcon v-if="isExpired(item)" class="w-8 h-8 text-amber-500" />
            <FilmIcon v-else-if="item.type === 'video'" class="w-8 h-8 text-slate-400" />
            <PhotoIcon v-else class="w-8 h-8 text-slate-400" />
            <span class="text-xs text-slate-600">
              {{ getCardText(item) }}
            </span>
          </div>
        </div>

        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3">
          <p class="text-xs text-white line-clamp-2 leading-tight mb-1.5">{{ item.prompt }}</p>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-white/80">{{ item.model }}</span>
            <span class="text-[10px] text-amber-300 font-mono">-{{ item.cost_points }}</span>
          </div>
        </div>

        <div class="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[90%]">
          <span
            class="px-1.5 py-0.5 rounded text-[10px] font-medium"
            :class="item.type === 'video' ? 'bg-violet-600/80 text-white' : 'bg-blue-600/80 text-white'"
          >
            {{ item.type === 'video' ? '视频' : '图片' }}
          </span>
          <span
            v-if="item.status === 'failed'"
            class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/80 text-white"
          >
            失败
          </span>
          <span
            v-else-if="isExpired(item)"
            class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/90 text-white"
          >
            已过期
          </span>
          <span
            v-if="item.type === 'image' && getResultUrls(item).length > 1"
            class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-900/70 text-white"
          >
            {{ getResultUrls(item).length }} 张
          </span>
        </div>
      </div>
    </div>

    <div v-if="total > pageSize" class="flex items-center justify-center gap-3 pt-4">
      <button
        @click="prevPage"
        :disabled="page === 1"
        class="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-600 hover:text-slate-900 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        上一页
      </button>
      <span class="text-sm text-slate-600">第 {{ page }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span>
      <button
        @click="nextPage"
        :disabled="page >= Math.ceil(total / pageSize)"
        class="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-600 hover:text-slate-900 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        下一页
      </button>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selected"
          @click.self="selected = null"
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div class="paper-panel max-h-[95vh] max-w-2xl w-full overflow-hidden shadow-2xl">
            <div
              v-if="selected.type === 'image' && isExpired(selected)"
              class="min-h-[180px] bg-amber-50 border-b border-amber-100 flex items-center justify-center"
            >
              <div class="text-center px-6">
                <ExclamationTriangleIcon class="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p class="text-amber-700 font-medium">图片资源已过期</p>
                <p class="text-sm text-amber-600 mt-1">{{ getAssetNotice(selected) }}</p>
              </div>
            </div>

            <template v-else-if="selected.type === 'image' && selectedUrls.length > 0">
              <div v-if="selectedUrls.length === 1" class="relative bg-slate-100 min-h-[160px]">
                <div v-if="!modalImageLoaded" class="absolute inset-0 flex items-center justify-center bg-slate-100">
                  <span class="w-7 h-7 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                </div>
                <img
                  :src="selectedUrls[0]"
                  class="w-full max-h-80 object-cover transition-opacity duration-300"
                  :class="modalImageLoaded ? 'opacity-100' : 'opacity-0'"
                  @load="modalImageLoaded = true"
                />
              </div>
              <div v-else class="grid grid-cols-2 gap-2 p-3 bg-slate-50 border-b border-slate-200">
                <a
                  v-for="(url, idx) in selectedUrls"
                  :key="`${selected.id}-${idx}`"
                  :href="url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block rounded-lg overflow-hidden border border-slate-200 bg-white"
                >
                  <img :src="url" class="w-full aspect-square object-cover" />
                </a>
              </div>
            </template>

            <div v-else-if="selected.type === 'video' && getFirstUrl(selected)" class="relative bg-slate-900 min-h-[160px] flex items-center justify-center">
              <div v-if="!modalVideoLoaded" class="absolute inset-0 flex items-center justify-center bg-slate-900">
                <span class="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <video
                :src="getFirstUrl(selected)"
                controls
                class="w-full max-h-80 transition-opacity duration-300"
                :class="modalVideoLoaded ? 'opacity-100' : 'opacity-0'"
                @loadeddata="modalVideoLoaded = true"
              />
            </div>

            <div v-else class="min-h-[180px] bg-slate-50 border-b border-slate-200 flex items-center justify-center">
              <div class="text-center px-6">
                <ExclamationTriangleIcon
                  v-if="selected.type === 'image' && isExpired(selected)"
                  class="w-10 h-10 text-amber-500 mx-auto mb-2"
                />
                <XCircleIcon v-else class="w-10 h-10 text-rose-400 mx-auto mb-2" />
                <p class="text-slate-700 font-medium">
                  {{ selected.status === 'failed' ? '生成失败' : '暂无可展示内容' }}
                </p>
                <p v-if="selected.error_message" class="text-xs text-slate-500 mt-1">{{ selected.error_message }}</p>
              </div>
            </div>

            <div class="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="px-2 py-0.5 rounded-lg text-xs font-medium"
                  :class="selected.type === 'video' ? 'bg-violet-50 text-violet-700 border border-violet-200' : 'bg-blue-50 text-blue-700 border border-blue-200'"
                >
                  {{ selected.type === 'video' ? '视频生成' : '图片生成' }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-lg text-xs font-medium"
                  :class="selected.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                >
                  {{ selected.status === 'success' ? '成功' : selected.status === 'pending' ? '处理中' : '失败' }}
                </span>
                <span
                  v-if="selected.type === 'image' && isExpired(selected)"
                  class="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                >
                  已过期
                </span>
              </div>

              <div
                v-if="selected.type === 'image'"
                class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 leading-5"
              >
                <p>{{ getAssetNotice(selected) }}</p>
                <p v-if="getExpiryDate(selected)" class="mt-1">
                  到期时间：{{ formatDate(getExpiryDate(selected)) }}
                </p>
              </div>

              <div>
                <p class="text-xs text-slate-500 mb-1">提示词</p>
                <p class="text-sm text-slate-900 leading-relaxed">{{ selected.prompt }}</p>
              </div>

              <div class="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <p class="text-[10px] text-slate-500">模型</p>
                  <p class="text-xs text-slate-900 mt-0.5">{{ selected.model }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-500">消耗积分</p>
                  <p class="text-xs text-amber-600 font-mono mt-0.5">{{ selected.cost_points }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-500">时间</p>
                  <p class="text-xs text-slate-900 mt-0.5">{{ formatDate(selected.createdAt ?? selected.created_at) }}</p>
                </div>
              </div>

              <div class="flex gap-2 pt-1">
                <a
                  v-if="canDownload(selected)"
                  :href="getFirstUrl(selected)"
                  :download="`aigc-${selected.id}`"
                  class="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm transition-colors"
                >
                  <ArrowDownTrayIcon class="w-4 h-4" />
                  下载
                </a>
                <button
                  @click="selected = null"
                  class="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 text-sm transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ClockIcon,
  PhotoIcon,
  FilmIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'
import { getRecords } from '../api/generate.js'

const DEFAULT_RETENTION_DAYS = 30

const tabs = [
  { label: '全部', value: '' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '失败', value: 'failed' },
]

const activeTab = ref('')
const records = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const selected = ref(null)
const retentionDays = ref(DEFAULT_RETENTION_DAYS)
const imageLoadStates = reactive({})
const modalImageLoaded = ref(false)
const modalVideoLoaded = ref(false)

const selectedUrls = computed(() => (selected.value ? getResultUrls(selected.value) : []))

watch(selected, () => {
  modalImageLoaded.value = false
  modalVideoLoaded.value = false
})

const toDate = (value) => {
  if (!value) return null
  const dt = new Date(value)
  return Number.isNaN(dt.getTime()) ? null : dt
}

const getResultUrls = (item) => {
  if (!item) return []
  if (Array.isArray(item.result_items)) {
    return item.result_items
      .map((it) => (typeof it?.result_url === 'string' ? it.result_url : ''))
      .filter(Boolean)
  }
  if (typeof item.result_url === 'string' && item.result_url) return [item.result_url]
  return []
}

const getFirstUrl = (item) => getResultUrls(item)[0] || ''

const getExpiryDate = (item) => {
  if (!item || item.type !== 'image' || item.status !== 'success') return null
  const apiDate = toDate(item.asset_expires_at)
  if (apiDate) return apiDate

  const created = toDate(item.createdAt ?? item.created_at)
  if (!created) return null
  return new Date(created.getTime() + retentionDays.value * 24 * 60 * 60 * 1000)
}

const isExpired = (item) => {
  if (!item || item.type !== 'image' || item.status !== 'success') return false
  if (typeof item.expired === 'boolean') return item.expired
  const expiresAt = getExpiryDate(item)
  return Boolean(expiresAt && expiresAt.getTime() <= Date.now())
}

const getAssetNotice = (item) => {
  if (!item || item.type !== 'image') return ''
  if (typeof item.asset_notice === 'string' && item.asset_notice) return item.asset_notice
  if (isExpired(item)) return `生成图片已超过 ${retentionDays.value} 天，资源已自动清理，仅保留生成记录。`
  return `生成图片将保留 ${retentionDays.value} 天，到期后会自动清理，请及时下载保存。`
}

const getCardText = (item) => {
  if (isExpired(item)) return '图片已过期'
  if (item.status === 'failed') return '生成失败'
  if (item.status === 'pending') return '处理中'
  if (item.type === 'video') return '点击查看视频'
  return '暂无可预览内容'
}

const canDownload = (item) => {
  if (!item || item.status !== 'success') return false
  if (item.type === 'image' && isExpired(item)) return false
  return Boolean(getFirstUrl(item))
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const params = { page: page.value, limit: pageSize }
    if (activeTab.value === 'failed') {
      params.status = 'failed'
    } else if (activeTab.value) {
      params.type = activeTab.value
      params.exclude_failed = 1
    }

    const res = await getRecords(params)
    if (res.success) {
      records.value = res.data.list || []
      total.value = res.data.total || 0
      retentionDays.value = res.data.image_retention_days || DEFAULT_RETENTION_DAYS
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

const openDetail = (item) => {
  selected.value = item
}

const formatDate = (value) => {
  const dt = toDate(value)
  return dt ? dt.toLocaleString('zh-CN') : '-'
}

watch(activeTab, () => {
  page.value = 1
})
watch([activeTab, page], fetchRecords)
onMounted(fetchRecords)
</script>
