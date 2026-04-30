<template>
  <div class="p-6 md:p-8 space-y-8">
    <!-- 移动端页面标题 -->
    <h2 class="md:hidden text-lg font-bold text-slate-900">邀请返利</h2>

    <!-- Top: Invite card -->
    <div class="relative overflow-hidden rounded-[1.75rem] surface-brand border border-blue-200 p-6 md:p-8 shadow-sm">
      <!-- Decorative circles -->
      <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-blue-200/40 blur-xl pointer-events-none" />
      <div class="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-slate-200/60 blur-xl pointer-events-none" />

      <div class="relative grid md:grid-cols-2 gap-6">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <GiftIcon class="w-5 h-5 text-blue-600" />
            <span class="text-sm font-semibold text-slate-900">我的邀请</span>
          </div>
          <div class="grid grid-cols-3 gap-4 mb-5">
            <div>
              <p class="text-2xl font-bold font-mono text-slate-900">{{ info.invite_count }}</p>
              <p class="text-xs text-slate-500 mt-0.5">邀请人数</p>
            </div>
            <div>
              <p class="text-2xl font-bold font-mono text-emerald-600">{{ info.completed_count }}</p>
              <p class="text-xs text-slate-500 mt-0.5">已完成</p>
            </div>
            <div>
              <p class="text-2xl font-bold font-mono text-amber-600">{{ info.total_reward.toLocaleString() }}</p>
              <p class="text-xs text-slate-500 mt-0.5">获得积分</p>
            </div>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm">
            <span class="text-slate-500 flex-shrink-0">邀请码</span>
            <span class="flex-1 font-mono font-semibold text-slate-900">{{ info.invite_code }}</span>
            <button @click="copyCode" class="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors">复制</button>
          </div>
        </div>

        <div>
          <p class="text-xs text-slate-600 font-medium mb-2">邀请链接</p>
          <div class="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-300 mb-3">
            <span class="flex-1 text-xs text-slate-700 truncate font-mono">{{ info.invite_url }}</span>
            <button @click="copyLink" class="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs hover:bg-blue-100 transition-colors">
              复制链接
            </button>
          </div>

          <!-- Rule card -->
          <div class="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <div class="flex items-center gap-2 mb-2">
              <SparklesIcon class="w-3.5 h-3.5 text-amber-600" />
              <span class="text-xs font-medium text-amber-700">邀请规则</span>
            </div>
            <p class="text-xs text-amber-700/80 leading-relaxed">
              每成功邀请 1 名新用户注册，双方各获得 <span class="text-amber-600 font-medium">{{ rewardPoints.toLocaleString() }}</span> 积分奖励
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Records list -->
    <div class="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
      <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="text-sm font-semibold text-slate-900">邀请记录</h3>
      </div>

      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 4" :key="i" class="h-12 bg-slate-100 rounded animate-pulse" />
      </div>

      <div v-else-if="records.length === 0" class="flex flex-col items-center py-10">
        <UserGroupIcon class="w-10 h-10 text-slate-300 mb-3" />
        <p class="text-sm text-slate-600">暂无邀请记录</p>
        <p class="text-xs text-slate-500 mt-1">分享你的邀请链接，邀请好友注册</p>
      </div>

      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50">
            <th class="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">被邀请人</th>
            <th class="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">状态</th>
            <th class="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase">奖励积分</th>
            <th class="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase">时间</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="r in records" :key="r.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-5 py-3.5 text-sm text-slate-900">{{ r.invitee_phone }}</td>
            <td class="px-5 py-3.5">
              <span class="px-2.5 py-1 rounded-lg text-xs font-medium"
                :class="r.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
                {{ r.status === 'completed' ? '已完成' : '进行中' }}
              </span>
            </td>
            <td class="px-5 py-3.5 text-right font-mono text-sm text-amber-600">+{{ r.reward_points.toLocaleString() }}</td>
            <td class="px-5 py-3.5 text-right text-xs text-slate-500">{{ formatDate(r.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { GiftIcon, SparklesIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import { getInviteInfo, getInviteRecords } from '../api/invite.js'
import { useConfigStore } from '../stores/configStore.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()
const configStore = useConfigStore()
const loading = ref(false)
const rewardPoints = computed(() => configStore.configs['invite.reward_points'])

const info = reactive({
  invite_code: '',
  invite_url: '',
  invite_count: 0,
  completed_count: 0,
  total_reward: 0,
})

const records = ref([])

const copyCode = () => {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = info.invite_code;
    textarea.style.cssText = 'position:fixed;left:-9999px;opacity:0;z-index:-1';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast.success('邀请码已复制');
  } catch (err) {
    console.error('复制失败', err);
    toast.error('复制失败，请手动复制');
  }
};

const copyLink = () => {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = info.invite_url;
    textarea.style.cssText = 'position:fixed;left:-9999px;opacity:0;z-index:-1';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast.success('邀请链接已复制');
  } catch (err) {
    console.error('复制失败', err);
    toast.error('复制失败，请手动复制');
  }
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '-'

onMounted(async () => {
  loading.value = true
  try {
    const [infoRes, recordsRes] = await Promise.all([getInviteInfo(), getInviteRecords({ page: 1, limit: 50 })])
    if (infoRes.success) Object.assign(info, infoRes.data)
    if (recordsRes.success) records.value = recordsRes.data.list || []
  } catch {} finally { loading.value = false }
})
</script>
