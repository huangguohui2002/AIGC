<template>
  <div class="p-4 sm:p-6 w-full space-y-5">
    <div>
      <h2 class="text-base font-semibold text-slate-900 mb-1">系统配置</h2>
      <p class="text-sm text-slate-500">调整平台核心参数</p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 6" :key="i" class="h-16 bg-slate-100 rounded-xl animate-pulse" />
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="cfg in configList"
        :key="cfg.key"
        class="flex items-center justify-between px-4 sm:px-5 py-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-card transition-shadow"
      >
        <div class="flex-1 min-w-0 pr-4">
          <p class="text-sm font-semibold text-slate-800">{{ cfg.label }}</p>
          <p class="text-xs text-slate-500 mt-0.5">{{ cfg.desc }}</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <input
            v-model.number="configs[cfg.key]"
            type="number"
            :min="cfg.min || 0"
            class="w-24 bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 text-right rounded-lg px-3 py-2 outline-none text-sm font-mono transition-all"
          />
          <span class="text-xs text-slate-500 w-8 flex-shrink-0">{{ cfg.unit }}</span>
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button
          @click="saveConfigs"
          :disabled="saving"
          class="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 shadow-sm"
        >
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
        <button
          @click="fetchConfigs"
          class="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm rounded-lg transition-colors shadow-sm"
        >
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getConfigs, updateConfigs } from '../../api/admin.js'
import { useToast } from '../../composables/useToast.js'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const configs = reactive({})

const configList = [
  { key: 'user.register_reward_points', label: '新用户注册送积分', desc: '新用户完成注册后立即获得的积分', unit: '积分', min: 0 },
  { key: 'invite.reward_points', label: '邀请奖励积分', desc: '邀请人成功邀请新用户注册后获得的积分', unit: '积分', min: 0 },
  { key: 'invite.invitee_reward_points', label: '\u53d7\u9080\u65b9\u5956\u52b1\u79ef\u5206', desc: '\u65b0\u7528\u6237\u586b\u5199\u9080\u8bf7\u7801\u5b8c\u6210\u6ce8\u518c\u540e\u989d\u5916\u83b7\u5f97\u7684\u79ef\u5206', unit: '\u79ef\u5206', min: 0 },
  { key: 'order.expire_minutes', label: '订单有效时间', desc: '充值订单的有效时长', unit: '分钟', min: 5 },
  { key: 'sms.send_interval_seconds', label: '短信发送间隔', desc: '两次短信之间的最短间隔', unit: '秒', min: 30 },
  { key: 'sms.code_expire_minutes', label: '验证码有效期', desc: '短信验证码的有效时长', unit: '分钟', min: 1 },
]

const parseConfigNumber = (value) => {
  const num = Number(String(value).replace(/"/g, ''))
  return Number.isNaN(num) ? 0 : num
}

const fetchConfigs = async () => {
  loading.value = true
  try {
    const res = await getConfigs()
    if (res.success) {
      const raw = res.data.configs || {}
      configList.forEach((cfg) => {
        configs[cfg.key] = raw[cfg.key] !== undefined ? parseConfigNumber(raw[cfg.key]) : 0
      })
    }
  } catch (e) {
    toast.error(e?.message || '获取配置失败')
  } finally {
    loading.value = false
  }
}

const saveConfigs = async () => {
  saving.value = true
  try {
    const payload = {}
    configList.forEach((cfg) => {
      payload[cfg.key] = parseConfigNumber(configs[cfg.key])
    })
    const res = await updateConfigs(payload)
    if (res.success) toast.success('配置已保存')
    else toast.error(res.message)
  } catch (e) {
    toast.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(fetchConfigs)
</script>
