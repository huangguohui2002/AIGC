import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPackages } from '../api/points.js'
import { getAnnouncements } from '../api/announce.js'
import { getPublicConfigs } from '../api/config.js'

// 解析后端可能返回的 JSON 编码字符串值，如 "\"100\"" → 100
function parseConfigValue(v) {
  const num = Number(String(v).replace(/"/g, ''))
  return isNaN(num) ? 0 : num
}

export const useConfigStore = defineStore('config', () => {
  const packages = ref([])
  const announcements = ref([])
  const packagesLoaded = ref(false)

  // 系统配置，带默认值（后端不可用时使用）
  const configs = ref({
    'generation.image.cost': 100,
    'generation.video.cost': 500,
    'user.register_reward_points': 0,
    'invite.reward_points': 1000,
    'order.expire_minutes': 30,
    'sms.send_interval_seconds': 60,
    'sms.code_expire_minutes': 10,
  })
  const configsLoaded = ref(false)

  async function fetchPackages() {
    if (packagesLoaded.value) return
    try {
      const res = await getPackages()
      if (res.success) {
        packages.value = res.data.packages || []
        packagesLoaded.value = true
      }
    } catch {}
  }

  async function fetchConfigs() {
    if (configsLoaded.value) return
    try {
      const res = await getPublicConfigs()
      if ((res.success || res.code === 0) && res.data?.configs) {
        const raw = res.data.configs
        Object.keys(raw).forEach(key => {
          configs.value[key] = parseConfigValue(raw[key])
        })
        configsLoaded.value = true
      }
    } catch {}
  }

  async function fetchAnnouncements() {
    try {
      const res = await getAnnouncements({ page: 1, limit: 20 })
      if (res.success) {
        announcements.value = res.data.list || []
      }
    } catch {}
  }

  return { packages, announcements, configs, fetchPackages, fetchConfigs, fetchAnnouncements }
})
