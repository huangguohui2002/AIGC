import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getBalance } from '../api/points.js'
import { getUserProfile } from '../api/admin.js'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || '')
  const points = ref(0)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const persistCachedUser = (nextUser) => {
    if (!nextUser) {
      localStorage.removeItem('user')
      return
    }
    const cached = {
      id: nextUser.id,
      nickname: nextUser.nickname ?? '',
      avatar: nextUser.avatar ?? null,
      // keep role for route guard permissions; display data still uses realtime profile API
      role: nextUser.role ?? 'user',
    }
    localStorage.setItem('user', JSON.stringify(cached))
  }

  function setAuth(userData, tokenStr) {
    user.value = userData
    token.value = tokenStr
    points.value = Number(userData?.points) || 0
    persistCachedUser(userData)
    localStorage.setItem('token', tokenStr)
  }

  function logout() {
    user.value = null
    token.value = ''
    points.value = 0
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function fetchBalance() {
    if (!isLoggedIn.value) return
    try {
      const res = await getBalance()
      if (res.success) {
        points.value = res.data.points
      }
    } catch {}
  }

  async function fetchProfile() {
    if (!isLoggedIn.value) return
    try {
      const res = await getUserProfile()
      if (res.success) {
        user.value = { ...(user.value || {}), ...res.data }
        persistCachedUser(user.value)
        points.value = res.data.points || 0
      }
    } catch {}
  }

  return { user, token, points, isLoggedIn, isAdmin, setAuth, logout, fetchBalance, fetchProfile }
})
