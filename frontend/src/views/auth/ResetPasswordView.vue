<template>
  <AuthLayout>
    <div class="space-y-8 animate-slide-up">
      <div>
        <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-3">Reset Password</div>
        <h1 class="font-serif text-4xl leading-tight text-slate-900 mb-3">重置密码</h1>
        <p class="text-base text-slate-600">验证身份后，为你的账号设置一个新的登录密码。</p>
      </div>

      <div v-if="resetSuccess" class="flex flex-col items-center gap-4 py-8 text-center">
        <div class="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <CheckCircleIcon class="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <p class="font-semibold text-slate-900">密码重置成功</p>
          <p class="text-sm text-slate-600 mt-1">请使用新密码重新登录。</p>
        </div>
        <RouterLink
          to="/login"
          class="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          前往登录
        </RouterLink>
      </div>

      <form v-else @submit.prevent="handleReset" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">手机号</label>
          <div class="relative">
            <PhoneIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="form.phone"
              type="tel"
              maxlength="11"
              placeholder="请输入手机号"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-10 pr-4 py-3 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">验证码</label>
          <div class="flex gap-2">
            <input
              v-model="form.code"
              type="text"
              maxlength="6"
              placeholder="输入 6 位验证码"
              class="flex-1 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-2xl px-4 py-3 outline-none transition-all text-sm"
            />
            <button
              type="button"
              @click="sendCode"
              :disabled="smsCountdown > 0 || smsSending"
              class="flex-shrink-0 px-4 py-3 rounded-full border text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              :class="smsCountdown > 0 ? 'bg-slate-100 border-slate-300 text-slate-400' : 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100'"
            >
              {{ smsSending ? "发送中..." : smsCountdown > 0 ? `${smsCountdown}s` : "获取验证码" }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">新密码</label>
          <div class="relative">
            <LockClosedIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="form.new_password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="至少 6 位新密码"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-10 pr-10 py-3 outline-none transition-all text-sm"
            />
            <button type="button" @click="showPwd = !showPwd" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
              <EyeIcon v-if="!showPwd" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" /> {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-all disabled:opacity-60 text-sm shadow-md hover:shadow-lg"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {{ loading ? "提交中..." : "重置密码" }}
        </button>
      </form>

      <div class="text-center text-sm text-slate-600">
        <RouterLink to="/login" class="text-blue-600 hover:text-blue-700 font-medium">返回登录</RouterLink>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref, reactive } from "vue";
import { RouterLink } from "vue-router";
import { PhoneIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/vue/24/outline";
import AuthLayout from "../../components/layout/AuthLayout.vue";
import { sendSms, resetPassword } from "../../api/auth.js";
import { useToast } from "../../composables/useToast.js";

const form = reactive({ phone: "", code: "", new_password: "" });
const errorMsg = ref("");
const loading = ref(false);
const showPwd = ref(false);
const smsSending = ref(false);
const smsCountdown = ref(0);
const resetSuccess = ref(false);
const toast = useToast();

const startCountdown = () => {
  smsCountdown.value = 60;
  const t = setInterval(() => {
    if (--smsCountdown.value <= 0) clearInterval(t);
  }, 1000);
};

const errorMap = {
  INVALID_PHONE: "手机号格式错误",
  SMS_SEND_TOO_FREQUENT: "发送过于频繁，请 60 秒后再试",
  INVALID_CODE: "验证码错误或已过期，请重新获取",
  USER_NOT_FOUND: "该手机号未注册",
};

const resolveError = (e) => errorMap[e?.error] || e?.message || "操作失败，请稍后重试";

const sendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errorMsg.value = "请先输入正确的手机号";
    return;
  }
  smsSending.value = true;
  errorMsg.value = "";
  try {
    const res = await sendSms(form.phone, "reset_password");
    if (res.success) {
      startCountdown();
      toast.success("验证码已发送，请注意查收");
    } else {
      errorMsg.value = resolveError(res);
    }
  } catch (e) {
    errorMsg.value = resolveError(e);
  } finally {
    smsSending.value = false;
  }
};

const handleReset = async () => {
  if (!form.phone || !form.code || form.new_password.length < 6) {
    errorMsg.value = "请填写完整信息，密码不能少于 6 位";
    return;
  }
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await resetPassword(form);
    if (res.success) resetSuccess.value = true;
    else errorMsg.value = resolveError(res);
  } catch (e) {
    errorMsg.value = resolveError(e);
  } finally {
    loading.value = false;
  }
};
</script>
