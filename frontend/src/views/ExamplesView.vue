<template>
  <div class="p-5 md:p-8 space-y-8">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-bold text-slate-900">示例参考</h2>
      <p class="text-sm text-slate-500 mt-0.5">AI 生成效果示例与提示词参考，助你快速上手</p>
    </div>

    <!-- Category Tabs -->
    <div class="flex flex-wrap gap-2">
      <button
        @click="activeCategory = null"
        class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
        :class="activeCategory === null
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'"
      >
        全部
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="activeCategory = cat.id"
        class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
        :class="activeCategory === cat.id
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="rounded-2xl bg-slate-200 animate-pulse h-72" />
    </div>

    <!-- Empty -->
    <div v-else-if="examples.length === 0 && !loading"
      class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
        <BookOpenIcon class="w-7 h-7 text-slate-400" />
      </div>
      <p class="text-base font-medium text-slate-900 mb-1">暂无示例</p>
      <p class="text-sm text-slate-500">该分类下还没有示例内容</p>
    </div>

    <!-- Cards Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="item in examples"
        :key="item.id"
        class="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col"
      >
        <!-- Card title label -->
        <div class="px-4 pt-4 pb-2">
          <div class="inline-flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
              :style="{ background: categoryColor(item.category_id) }" />
            <span class="text-sm font-semibold text-slate-800">{{ item.title }}</span>
          </div>
        </div>

        <!-- Image area -->
        <div class="px-4 pb-3">
          <!-- comparison: 原图 vs 精修对比 (两张图并排) -->
          <div v-if="item.display_type === 'comparison' && item.images.length >= 2"
            class="grid grid-cols-2 gap-2">
            <div
              v-for="img in item.images.slice(0, 2)"
              :key="img.url"
              class="relative rounded-xl overflow-hidden bg-slate-100 aspect-square"
            >
              <img
                :src="img.url"
                :alt="img.label || '示例图'"
                class="w-full h-full object-cover"
                loading="lazy"
                @error="onImgError($event)"
              />
              <!-- Image label badge -->
              <span
                v-if="img.label"
                class="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                :class="img.label === '原图'
                  ? 'bg-slate-700/80 text-white'
                  : 'bg-orange-500/90 text-white'"
              >
                {{ img.label }}
              </span>
            </div>
          </div>

          <!-- single: 单图或多图横排 -->
          <div v-else class="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
            <img
              v-if="item.images.length > 0"
              :src="item.images[0].url"
              :alt="item.title"
              class="w-full h-full object-cover"
              loading="lazy"
              @error="onImgError($event)"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <PhotoIcon class="w-8 h-8 text-slate-300" />
            </div>
          </div>
        </div>

        <!-- Prompt text -->
        <div class="mx-4 mb-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex-1">
          <p class="text-xs leading-relaxed text-slate-600 line-clamp-5">{{ item.prompt }}</p>
        </div>

        <!-- Copy button -->
        <div class="px-4 pb-4 -mt-1">
          <button
            @click="copyPrompt(item)"
            class="w-full flex items-center justify-center gap-1.5 h-10 rounded-full text-xs font-medium border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <ClipboardDocumentIcon class="w-3.5 h-3.5" />
            {{ copiedId === item.id ? '已复制！' : '复制提示词' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Load more -->
    <div v-if="hasMore && !loading" class="flex justify-center pt-2">
      <button
        @click="loadMore"
        :disabled="loadingMore"
        class="px-6 py-2.5 rounded-full text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
      >
        <span v-if="loadingMore" class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          加载中...
        </span>
        <span v-else>加载更多</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { BookOpenIcon, PhotoIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { getExampleCategories, getExamples } from '../api/examples.js'

// ── State ─────────────────────────────────────────────────────
const categories = ref([])
const examples = ref([])
const activeCategory = ref(null)
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const hasMore = ref(false)
const copiedId = ref(null)
const PAGE_SIZE = 12

// ── Category color map (循环取色) ─────────────────────────────
const COLOR_POOL = [
  '#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#ec4899', '#06b6d4',
]
const categoryColorCache = {}
const categoryColor = (categoryId) => {
  if (!categoryColorCache[categoryId]) {
    const idx = Object.keys(categoryColorCache).length % COLOR_POOL.length
    categoryColorCache[categoryId] = COLOR_POOL[idx]
  }
  return categoryColorCache[categoryId]
}

// ── Fetch ──────────────────────────────────────────────────────
const fetchCategories = async () => {
  try {
    const res = await getExampleCategories()
    categories.value = res.data?.categories || []
  } catch {
    // 接口未就绪时静默降级
    categories.value = []
  }
}

const fetchExamples = async (reset = true) => {
  if (reset) {
    loading.value = true
    page.value = 1
  } else {
    loadingMore.value = true
  }

  try {
    const params = {
      page: page.value,
      pageSize: PAGE_SIZE,
    }
    if (activeCategory.value !== null) {
      params.categoryId = activeCategory.value
    }

    const res = await getExamples(params)
    const { list = [], total = 0 } = res.data ?? {}

    if (reset) {
      examples.value = list
    } else {
      examples.value.push(...list)
    }

    hasMore.value = examples.value.length < total
  } catch {
    if (reset) examples.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  fetchExamples(false)
}

// ── Copy prompt ───────────────────────────────────────────────
const copyPrompt = async (item) => {
  try {
    await navigator.clipboard.writeText(item.prompt)
    copiedId.value = item.id
    setTimeout(() => { copiedId.value = null }, 1500)
  } catch {
    // fallback for older browsers
    const el = document.createElement('textarea')
    el.value = item.prompt
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copiedId.value = item.id
    setTimeout(() => { copiedId.value = null }, 1500)
  }
}

// ── Image fallback ────────────────────────────────────────────
const onImgError = (e) => {
  e.target.style.display = 'none'
}

// ── Watchers ──────────────────────────────────────────────────
watch(activeCategory, () => fetchExamples(true))

onMounted(() => {
  fetchCategories()
  fetchExamples(true)
})
</script>
