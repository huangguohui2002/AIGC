<template>
  <AuthLayout>
    <div class="space-y-6 animate-slide-up">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center">
          <ShieldCheckIcon class="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-900">管理员登录</h1>
          <p class="text-xs text-slate-500">AIGC 后台管理系统</p>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">管理员账号</label>
          <div class="relative">
            <UserIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input v-model="form.username" type="text" placeholder="请输入管理员账号"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-rose-500 text-slate-900 placeholder-slate-400 rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all text-sm" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
          <div class="relative">
            <LockClosedIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input v-model="form.password" type="password" placeholder="请输入密码"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-rose-500 text-slate-900 placeholder-slate-400 rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all text-sm" />
          </div>
        </div>

        <div v-if="errorMsg" class="flex items-center gap-2 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" /> {{ errorMsg }}
        </div>

        <button type="submit" :disabled="loading"
          class="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-medium rounded-lg transition-all disabled:opacity-60 text-sm shadow-md hover:shadow-lg">
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {{ loading ? '登录中...' : '管理员登录' }}
        </button>
      </form>

      <div class="text-center">
        <RouterLink to="/login" class="text-sm text-slate-500 hover:text-slate-700 transition-colors">← 返回用户登录</RouterLink>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ShieldCheckIcon, UserIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AuthLayout from '../../components/layout/AuthLayout.vue'
import { adminLogin } from '../../api/admin.js'
import { useUserStore } from '../../stores/userStore.js'

const router = useRouter()
const userStore = useUserStore()
const form = reactive({ username: '', password: '' })
const errorMsg = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await adminLogin(form)
    if (res.success) {
      userStore.setAuth({ ...res.data.admin, role: 'admin' }, res.data.token)
      router.push({ name: 'admin-users' })
    } else {
      errorMsg.value = res.message || '登录失败'
    }
  } catch (e) {
    errorMsg.value = e?.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
