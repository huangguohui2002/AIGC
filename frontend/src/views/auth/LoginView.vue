<template>
  <AuthLayout>
    <div class="space-y-8 animate-slide-up">
      <div>
        <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-3">Welcome Back</div>
        <h1 class="font-serif text-4xl leading-tight text-slate-900 mb-3">欢迎回来</h1>
        <p class="text-base text-slate-600">登录你的账号，继续完成今天的创作。</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">手机号</label>
          <div class="relative">
            <PhoneIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="form.phone"
              type="tel"
              maxlength="11"
              placeholder="请输入手机号"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-11 pr-4 py-3 outline-none transition-all duration-200 text-base"
              :class="{ 'border-rose-500': errors.phone }"
            />
          </div>
          <p v-if="errors.phone" class="mt-1.5 text-sm text-rose-600">{{ errors.phone }}</p>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-slate-700">密码</label>
            <RouterLink to="/reset-password" class="text-sm text-blue-600 hover:text-blue-700">忘记密码？</RouterLink>
          </div>
          <div class="relative">
            <LockClosedIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-11 pr-12 py-3 outline-none transition-all duration-200 text-base"
              :class="{ 'border-rose-500': errors.password }"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <EyeIcon v-if="!showPassword" class="w-5 h-5" />
              <EyeSlashIcon v-else class="w-5 h-5" />
            </button>
          </div>
          <p v-if="errors.password" class="mt-1.5 text-sm text-rose-600">{{ errors.password }}</p>
        </div>

        <div
          v-if="errorMsg"
          class="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"
        >
          <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0" />
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-full transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-base shadow-md hover:shadow-lg"
        >
          <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {{ loading ? "登录中..." : "立即登录" }}
        </button>
      </form>

      <div class="text-center text-base text-slate-600">
        还没有账号？
        <RouterLink to="/register" class="text-blue-600 hover:text-blue-700 font-medium ml-1">立即注册</RouterLink>
      </div>
    </div>

    <SliderCaptcha
      :visible="showCaptcha"
      @success="onCaptchaSuccess"
      @close="showCaptcha = false"
    />
  </AuthLayout>
</template>

<script setup>
import { ref, reactive } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { PhoneIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from "@heroicons/vue/24/outline";
import AuthLayout from "../../components/layout/AuthLayout.vue";
import SliderCaptcha from "../../components/SliderCaptcha.vue";
import { login } from "../../api/auth.js";
import { useUserStore } from "../../stores/userStore.js";

const router = useRouter();
const userStore = useUserStore();

const form = reactive({ phone: "", password: "" });
const errors = reactive({ phone: "", password: "" });
const errorMsg = ref("");
const loading = ref(false);
const showPassword = ref(false);
const showCaptcha = ref(false);

const validate = () => {
  errors.phone = "";
  errors.password = "";
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errors.phone = "请输入正确的手机号";
    return false;
  }
  if (form.password.length < 6) {
    errors.password = "密码不能少于 6 位";
    return false;
  }
  return true;
};

const handleLogin = () => {
  if (!validate()) return;
  errorMsg.value = "";
  showCaptcha.value = true;
};

const onCaptchaSuccess = async () => {
  showCaptcha.value = false;
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await login(form.phone, form.password);
    if (res.success) {
      userStore.setAuth(res.data.user, res.data.token);
      const isAdmin = res.data.user?.role === "admin";
      router.push(isAdmin ? { name: "admin-users" } : { name: "home" });
    } else {
      errorMsg.value = res.message || "登录失败";
    }
  } catch (e) {
    errorMsg.value = e?.message || "登录失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
input::-ms-reveal,
input::-ms-clear {
  display: none;
}

input::-webkit-credentials-auto-fill-button,
input::-webkit-strong-password-auto-fill-button {
  display: none !important;
}
</style>
