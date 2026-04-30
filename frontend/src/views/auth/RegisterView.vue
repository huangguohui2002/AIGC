<template>
  <AuthLayout>
    <div class="space-y-8 animate-slide-up">
      <div>
        <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-3">Create Account</div>
        <h1 class="font-serif text-4xl leading-tight text-slate-900 mb-3">创建账号</h1>
        <p class="text-base text-slate-600">加入 {{ APP_NAME }}，开始你的图像与视频创作。</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">手机号</label>
          <div class="relative">
            <PhoneIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="form.phone"
              type="tel"
              maxlength="11"
              placeholder="请输入手机号"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-10 pr-4 py-3 outline-none transition-all duration-200 text-sm"
              :class="{ 'border-rose-500': errors.phone }"
            />
          </div>
          <p v-if="errors.phone" class="mt-1 text-xs text-rose-600">{{ errors.phone }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">验证码</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <ShieldCheckIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="form.code"
                type="text"
                maxlength="6"
                placeholder="输入 6 位验证码"
                class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-10 pr-4 py-3 outline-none transition-all duration-200 text-sm"
                :class="{ 'border-rose-500': errors.code }"
              />
            </div>
            <button
              type="button"
              @click="sendCode"
              :disabled="smsCountdown > 0 || smsSending"
              class="flex-shrink-0 px-4 py-3 rounded-full border text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              :class="smsCountdown > 0 ? 'bg-slate-100 border-slate-300 text-slate-400' : 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100'"
            >
              {{ smsSending ? "发送中" : smsCountdown > 0 ? `${smsCountdown}s` : "获取验证码" }}
            </button>
          </div>
          <p v-if="errors.code" class="mt-1 text-xs text-rose-600">{{ errors.code }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">密码</label>
          <div class="relative">
            <LockClosedIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="至少 6 位密码"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-10 pr-10 py-3 outline-none transition-all duration-200 text-sm"
              :class="{ 'border-rose-500': errors.password }"
            />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
              <EyeIcon v-if="!showPassword" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
          <p v-if="errors.password" class="mt-1 text-xs text-rose-600">{{ errors.password }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            邀请码 <span class="text-slate-500">(选填)</span>
          </label>
          <div class="relative">
            <LinkIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="form.invite_code"
              type="text"
              placeholder="输入邀请码可获得奖励"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-10 pr-4 py-3 outline-none transition-all duration-200 text-sm"
            />
          </div>
        </div>

        <div
          v-if="errorMsg"
          class="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"
        >
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-md hover:shadow-lg"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {{ loading ? "注册中..." : "立即注册" }}
        </button>
      </form>

      <div class="text-center text-sm text-slate-600">
        已有账号？
        <RouterLink to="/login" class="text-blue-600 hover:text-blue-700 font-medium ml-1">立即登录</RouterLink>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { RouterLink, useRouter, useRoute } from "vue-router";
import { PhoneIcon, LockClosedIcon, ShieldCheckIcon, EyeIcon, EyeSlashIcon, ExclamationCircleIcon, LinkIcon } from "@heroicons/vue/24/outline";
import AuthLayout from "../../components/layout/AuthLayout.vue";
import { sendSms, register } from "../../api/auth.js";
import { useUserStore } from "../../stores/userStore.js";
import { useToast } from "../../composables/useToast.js";
import { APP_NAME } from "@/config/app";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const toast = useToast();

const form = reactive({ phone: "", code: "", password: "", invite_code: "" });
const errors = reactive({ phone: "", code: "", password: "" });
const errorMsg = ref("");
const loading = ref(false);
const showPassword = ref(false);
const smsSending = ref(false);
const smsCountdown = ref(0);

onMounted(() => {
  if (route.query.code) {
    form.invite_code = route.query.code;
  }
});

const startCountdown = () => {
  smsCountdown.value = 60;
  const timer = setInterval(() => {
    smsCountdown.value--;
    if (smsCountdown.value <= 0) clearInterval(timer);
  }, 1000);
};

const sendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errors.phone = "请先输入正确的手机号";
    return;
  }
  smsSending.value = true;
  try {
    const res = await sendSms(form.phone, "register");
    if (res.success) {
      startCountdown();
      toast.success("验证码已发送，请注意查收");
    } else {
      errorMsg.value = res.message || "发送失败";
    }
  } catch (e) {
    errorMsg.value = e?.message || "发送失败，请稍后重试";
  } finally {
    smsSending.value = false;
  }
};

const validate = () => {
  Object.assign(errors, { phone: "", code: "", password: "" });
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errors.phone = "请输入正确的手机号";
    return false;
  }
  if (!/^\d{6}$/.test(form.code)) {
    errors.code = "请输入 6 位验证码";
    return false;
  }
  if (form.password.length < 6) {
    errors.password = "密码不能少于 6 位";
    return false;
  }
  return true;
};

const handleRegister = async () => {
  if (!validate()) return;
  loading.value = true;
  errorMsg.value = "";
  try {
    const payload = { phone: form.phone, code: form.code, password: form.password };
    if (form.invite_code) payload.invite_code = form.invite_code;
    const res = await register(payload);
    if (res.success) {
      userStore.setAuth(res.data.user, res.data.token);
      router.push({ name: "home" });
    } else {
      errorMsg.value = res.message || "注册失败";
    }
  } catch (e) {
    errorMsg.value = e?.message || "注册失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};
</script>
