<template>
  <div class="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
    <h2 class="md:hidden text-lg font-bold text-slate-900">个人中心</h2>

    <section>
      <div
        class="md:hidden relative overflow-hidden rounded-[1.75rem] border border-amber-100 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(255,247,237,0.96)_58%,_rgba(255,255,255,0.94)_100%)] p-5 shadow-[0_18px_45px_rgba(245,158,11,0.12)]"
      >
        <div class="pointer-events-none absolute inset-x-[-10%] top-[-30%] h-40 rounded-full bg-amber-200/25 blur-3xl"></div>
        <div class="pointer-events-none absolute right-3 top-8 h-24 w-24 rounded-full bg-white/60 blur-2xl"></div>

        <div class="relative">
          <div class="flex items-start gap-3.5 min-w-0">
            <div
              class="w-20 h-20 rounded-[1.35rem] bg-white/85 border border-amber-200 shadow-[0_12px_32px_rgba(249,115,22,0.16)] flex items-center justify-center text-[2rem] font-black text-orange-600 flex-shrink-0"
            >
              {{ userInitial }}
            </div>

            <div class="min-w-0 flex-1 pt-0.5">
              <EditableField
                v-if="editingNickname"
                v-model="nickname"
                @save="saveNickname"
                @cancel="cancelEditNickname"
                placeholder="输入昵称"
              />

              <template v-else>
                <h3 class="text-xl leading-tight font-bold text-slate-950 truncate">
                  {{ displayName }}
                </h3>
                <p class="mt-1.5 text-sm leading-5 text-slate-500 truncate">{{ maskedPhone || '加载中...' }}</p>
                <span
                  class="mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap"
                  :class="roleBadgeClass"
                >
                  {{ roleLabel }}
                </span>
              </template>
            </div>
          </div>

          <div
            class="mt-6 overflow-hidden rounded-[1.9rem] border border-amber-200/80 bg-white/75 shadow-[0_14px_36px_rgba(245,158,11,0.08)] backdrop-blur-sm"
          >
            <div class="grid grid-cols-2 divide-x divide-amber-100">
              <div class="px-4 py-5 text-center">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-white shadow-[0_10px_22px_rgba(245,158,11,0.10)]">
                  <BoltIcon class="w-6 h-6 text-amber-500" />
                </div>
                <div class="mt-3 text-xs text-slate-500">当前积分</div>
                <div class="mt-2 text-[1.85rem] leading-none font-bold font-mono text-orange-600">
                  {{ pointBalance }}
                </div>
              </div>

              <div class="px-4 py-5 text-center">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-white shadow-[0_10px_22px_rgba(245,158,11,0.10)]">
                  <GiftTopIcon class="w-6 h-6 text-orange-500" />
                </div>
                <div class="mt-3 text-xs text-slate-500">最近签到奖励</div>
                <div class="mt-2 text-[1.85rem] leading-none font-bold font-mono text-orange-600">
                  {{ latestCheckinRewardText }}
                </div>
                <div class="mt-3 text-xs font-medium text-slate-500">
                  {{ latestCheckinTimeText }}
                </div>
              </div>
            </div>

            <div class="mx-5 h-px bg-amber-100"></div>

            <div class="flex items-center justify-center gap-2 px-5 py-3.5 text-xs text-slate-500">
              <InformationCircleIcon class="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>积分可用于图片与视频生成消耗</span>
            </div>
          </div>
        </div>
      </div>

      <div class="hidden md:block bg-white border border-slate-200 rounded-[1.75rem] p-5 sm:p-6 md:p-8 shadow-sm">
        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex items-start gap-4 sm:gap-4 min-w-0">
              <div class="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl icon-surface flex items-center justify-center text-2xl sm:text-[2rem] font-bold flex-shrink-0">
                {{ userInitial }}
              </div>

              <div class="min-w-0 flex-1">
                <EditableField
                  v-if="editingNickname"
                  v-model="nickname"
                  @save="saveNickname"
                  @cancel="cancelEditNickname"
                  placeholder="输入昵称"
                />

                <div v-else class="flex items-center gap-2 min-w-0">
                  <h3 class="text-xl sm:text-[1.6rem] font-bold text-slate-900 truncate">
                    {{ displayName }}
                  </h3>
                </div>

                <p class="text-sm text-slate-500 mt-1">{{ maskedPhone || '加载中...' }}</p>
              </div>
            </div>

            <span
              class="self-start px-3 py-1 rounded-xl text-xs font-medium border whitespace-nowrap"
              :class="roleBadgeClass"
            >
              {{ roleLabel }}
            </span>
          </div>

          <div class="rounded-[1.5rem] bg-amber-50 border border-amber-200 p-5 sm:p-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-white/70 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <BoltIcon class="w-5 h-5 text-amber-600" />
                </div>
                <div class="min-w-0">
                  <div class="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
                    {{ pointBalance }}
                  </div>
                  <div class="text-xs text-amber-700 mt-1">当前积分余额</div>
                  <p class="text-sm text-amber-700/80 mt-3 leading-relaxed max-w-2xl">
                    积分可用于图片与视频生成消耗，签到成功后奖励会立即到账。
                  </p>
                </div>
              </div>

              <div class="self-start sm:self-stretch sm:min-w-[220px] rounded-2xl bg-white/70 border border-amber-200 px-4 py-3 flex flex-col justify-center">
                <div class="flex items-center gap-2 text-xs text-amber-700 mb-1">
                  <span class="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-white">
                    <GiftTopIcon class="w-4 h-4 text-orange-500" />
                  </span>
                  <span>最近签到奖励</span>
                </div>
                <div class="text-xl font-bold font-mono text-amber-700">
                  {{ latestCheckinRewardText }}
                </div>
                <div class="text-xs text-slate-500 mt-2">{{ latestCheckinTimeText }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div
        class="md:hidden relative overflow-hidden rounded-[1.6rem] border border-amber-100 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(255,247,237,0.96)_60%,_rgba(255,255,255,0.95)_100%)] shadow-[0_18px_40px_rgba(148,163,184,0.12)]"
      >
        <div class="pointer-events-none absolute inset-x-[-20%] top-[-20%] h-28 rounded-full bg-amber-100/50 blur-3xl"></div>

        <div class="relative border-b border-amber-100/90 px-5 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 shadow-[0_8px_18px_rgba(249,115,22,0.12)]">
              <CalendarDaysIcon class="w-5 h-5 text-orange-500" />
            </div>
            <h3 class="text-lg font-bold text-slate-950">每日签到</h3>
          </div>

          <ChevronRightIcon class="w-5 h-5 text-slate-300" />
        </div>

        <div class="relative p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h4 class="text-lg leading-snug font-bold text-slate-950">每日首次签到可领取奖励</h4>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                每日首次签到可随机获得
                <span class="font-bold text-orange-500">{{ dailyCheckinState.reward_range.min }} - {{ dailyCheckinState.reward_range.max }}</span>
                积分
              </p>
            </div>

            <span
              class="mt-1 inline-flex h-11 w-[84px] shrink-0 items-center justify-center rounded-2xl border px-2 text-center text-xs font-semibold leading-tight whitespace-nowrap break-words"
              :class="dailyCheckinState.checked_in_today ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'"
            >
              {{ dailyCheckinBadgeLabel }}
            </span>
          </div>

          <button
            type="button"
            class="mt-5 w-full rounded-[1.2rem] border px-5 py-3.5 text-base font-semibold transition-all disabled:opacity-80"
            :class="dailyCheckinState.can_check_in ? 'border-orange-500 bg-[linear-gradient(180deg,#fb923c_0%,#f97316_100%)] text-white shadow-[0_14px_30px_rgba(249,115,22,0.24)]' : 'border-slate-200 bg-white/85 text-slate-400 cursor-not-allowed'"
            :disabled="signingIn || !dailyCheckinState.can_check_in"
            @click="handleDailyCheckin"
          >
            {{ dailyCheckinButtonLabel }}
          </button>

          <div class="mt-4 grid grid-cols-3 gap-3">
            <div class="rounded-[1.15rem] border border-emerald-100 bg-emerald-50/60 px-2.5 py-3 text-center">
              <div class="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white">
                <ShieldCheckIcon class="w-4 h-4 text-emerald-600" />
              </div>
              <div class="mt-2 text-xs text-slate-500">签到状态</div>
              <div class="mt-1.5 text-sm leading-5 font-semibold text-slate-950 break-words">
                {{ dailyCheckinStatusText }}
              </div>
            </div>

            <div class="rounded-[1.15rem] border border-orange-100 bg-orange-50/60 px-2.5 py-3 text-center">
              <div class="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 bg-white">
                <GiftTopIcon class="w-4 h-4 text-orange-500" />
              </div>
              <div class="mt-2 text-xs text-slate-500">最近奖励</div>
              <div class="mt-1.5 text-lg leading-none font-semibold font-mono text-orange-600 break-words">
                {{ latestCheckinRewardText }}
              </div>
            </div>

            <div class="rounded-[1.15rem] border border-blue-100 bg-blue-50/65 px-2.5 py-3 text-center">
              <div class="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white">
                <ClockIcon class="w-4 h-4 text-blue-500" />
              </div>
              <div class="mt-2 text-xs text-slate-500">签到时间</div>
              <div class="mt-1.5 text-sm leading-5 font-semibold text-slate-950 break-words">
                {{ latestCheckinTimeText }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="hidden md:block bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
        <div class="px-5 py-4 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200 bg-orange-50">
              <CalendarDaysIcon class="w-5 h-5 text-orange-500" />
            </div>
            <h3 class="text-base font-semibold text-slate-900">每日签到</h3>
          </div>
        </div>

        <div class="p-5">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-start gap-4 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
                <CalendarDaysIcon class="w-5 h-5 text-orange-500" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="text-base font-semibold text-slate-900">每日首次签到可领取奖励</h4>
                  <span
                    class="inline-flex h-10 w-[84px] items-center justify-center rounded-2xl border px-2 text-center text-xs font-semibold leading-tight whitespace-nowrap break-words"
                    :class="dailyCheckinState.checked_in_today ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'"
                  >
                    {{ dailyCheckinBadgeLabel }}
                  </span>
                </div>
                <p class="text-sm text-slate-600 mt-2 leading-6">
                  每日首次签到可随机获得
                  <span class="font-semibold text-orange-500">{{ dailyCheckinState.reward_range.min }} - {{ dailyCheckinState.reward_range.max }}</span>
                  积分，系统按整数随机发放。
                </p>
              </div>
            </div>

            <button
              type="button"
              class="w-full lg:w-auto lg:min-w-[144px] px-5 py-3 rounded-[1.2rem] text-sm font-semibold transition-all border"
              :class="dailyCheckinState.can_check_in ? 'border-orange-500 bg-[linear-gradient(180deg,#fb923c_0%,#f97316_100%)] text-white shadow-[0_14px_30px_rgba(249,115,22,0.20)]' : 'bg-slate-50 text-slate-500 border-slate-300 cursor-not-allowed'"
              :disabled="signingIn || !dailyCheckinState.can_check_in"
              @click="handleDailyCheckin"
            >
              {{ dailyCheckinButtonLabel }}
            </button>
          </div>

          <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="rounded-[1.15rem] border border-emerald-100 bg-emerald-50/60 px-4 py-4 text-center">
              <div class="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white">
                <ShieldCheckIcon class="w-4 h-4 text-emerald-600" />
              </div>
              <div class="mt-2 text-xs text-slate-500">签到状态</div>
              <div class="mt-1.5 text-sm leading-5 font-semibold text-slate-950 break-words">
                {{ dailyCheckinStatusText }}
              </div>
            </div>

            <div class="rounded-[1.15rem] border border-orange-100 bg-orange-50/60 px-4 py-4 text-center">
              <div class="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 bg-white">
                <GiftTopIcon class="w-4 h-4 text-orange-500" />
              </div>
              <div class="mt-2 text-xs text-slate-500">最近奖励</div>
              <div class="mt-1.5 text-lg leading-none font-semibold font-mono text-orange-600 break-words">
                {{ latestCheckinRewardText }}
              </div>
            </div>

            <div class="rounded-[1.15rem] border border-blue-100 bg-blue-50/65 px-4 py-4 text-center">
              <div class="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white">
                <ClockIcon class="w-4 h-4 text-blue-500" />
              </div>
              <div class="mt-2 text-xs text-slate-500">签到时间</div>
              <div class="mt-1.5 text-sm leading-5 font-semibold text-slate-950 break-words">
                {{ latestCheckinTimeText }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
      <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="text-sm font-semibold text-slate-900">账号安全</h3>
      </div>

      <div class="p-5 space-y-4">
        <div v-if="changingPassword" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">当前密码</label>
            <input
              v-model="pwdForm.old_password"
              type="password"
              placeholder="请输入当前密码"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">新密码</label>
            <input
              v-model="pwdForm.new_password"
              type="password"
              placeholder="新密码至少 6 位"
              class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none transition-all text-sm"
            />
          </div>
          <div v-if="pwdError" class="text-sm text-rose-600">{{ pwdError }}</div>
          <div class="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              :disabled="saving"
              @click="savePassword"
            >
              {{ saving ? '保存中...' : '保存' }}
            </button>
            <button
              type="button"
              class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 hover:text-slate-900 text-sm rounded-lg transition-colors"
              @click="changingPassword = false"
            >
              取消
            </button>
          </div>
        </div>

        <div v-else class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-1">
          <div>
            <p class="text-sm font-medium text-slate-900">登录密码</p>
            <p class="text-xs text-slate-500 mt-0.5">建议定期修改密码，提升账号安全性</p>
          </div>
          <button
            type="button"
            class="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 text-sm rounded-lg transition-colors whitespace-nowrap"
            @click="changingPassword = true"
          >
            修改密码
          </button>
        </div>
      </div>
    </section>

    <section class="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
      <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="text-sm font-semibold text-slate-900">邀请好友</h3>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <p class="text-xs text-slate-600 font-medium mb-2">邀请链接</p>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl bg-white border border-slate-300">
            <span class="flex-1 text-xs text-slate-700 break-all font-mono">{{ info.invite_url || '加载中...' }}</span>
            <button
              type="button"
              class="flex-shrink-0 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs hover:bg-blue-100 transition-colors"
              @click="copyLink"
            >
              复制链接
            </button>
          </div>
        </div>

        <div class="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <div class="flex items-center gap-2 mb-2">
            <SparklesIcon class="w-3.5 h-3.5 text-amber-600" />
            <span class="text-xs font-medium text-amber-700">邀请规则</span>
          </div>
          <p class="text-xs text-amber-700/80 leading-relaxed">
            每成功邀请 1 位新用户注册，双方各可获得
            <span class="text-amber-600 font-medium">{{ rewardPoints.toLocaleString() }}</span>
            积分奖励。
          </p>
        </div>
      </div>
    </section>

    <button
      type="button"
      class="md:hidden w-full bg-white border border-slate-200 rounded-[1.5rem] p-5 flex items-center justify-between text-left shadow-sm hover:bg-slate-50 transition-colors"
      @click="openContactModal"
    >
      <div>
        <p class="text-sm font-semibold text-slate-900">联系我们</p>
        <p class="text-xs text-slate-500 mt-1">点击查看 GitHub 仓库地址</p>
      </div>
      <PhoneIcon class="w-5 h-5 text-blue-600" />
    </button>

    <section class="bg-rose-50 border border-rose-200 rounded-[1.5rem] p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-medium text-slate-900">退出登录</p>
        <p class="text-xs text-slate-500 mt-0.5">退出当前账号的登录状态</p>
      </div>
      <button
        type="button"
        class="px-4 py-2.5 bg-white hover:bg-rose-100 border border-rose-300 text-rose-600 hover:text-rose-700 text-sm rounded-lg transition-colors"
        @click="handleLogout"
      >
        退出登录
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  BoltIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ClockIcon,
  GiftTopIcon,
  InformationCircleIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'
import { useUserStore } from '../stores/userStore.js'
import { useConfigStore } from '../stores/configStore.js'
import { changePassword } from '../api/auth.js'
import { getInviteInfo } from '../api/invite.js'
import { postDailyCheckin } from '../api/points.js'
import { updateProfile } from '../api/admin.js'
import { useToast } from '../composables/useToast.js'

const EditableField = {
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue', 'save', 'cancel'],
  template: `<div class="flex flex-wrap items-center gap-2">
    <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"
      @keyup.enter="$emit('save')" @keyup.escape="$emit('cancel')"
      class="flex-1 min-w-[180px] bg-white border border-blue-400 text-slate-900 rounded-lg px-3 py-1.5 text-sm outline-none"
      :placeholder="placeholder" autofocus />
    <button @click="$emit('save')" class="text-emerald-600 hover:text-emerald-700 text-xs font-medium">保存</button>
    <button @click="$emit('cancel')" class="text-slate-400 hover:text-slate-600 text-xs">取消</button>
  </div>`,
}

const router = useRouter()
const toast = useToast()
const userStore = useUserStore()
const configStore = useConfigStore()

const editingNickname = ref(false)
const nickname = ref('')
const changingPassword = ref(false)
const saving = ref(false)
const signingIn = ref(false)
const pwdError = ref('')
const pwdForm = reactive({ old_password: '', new_password: '' })
const info = reactive({ invite_url: '' })

const emptyDailyCheckinState = {
  checked_in_today: false,
  can_check_in: true,
  last_checkin_at: null,
  last_checkin_reward: 0,
  reward_range: {
    min: 10,
    max: 50,
  },
}

const userInitial = computed(() => {
  const base = userStore.user?.nickname || userStore.user?.phone || 'U'
  return String(base).charAt(0).toUpperCase()
})

const displayName = computed(() => userStore.user?.nickname || '未设置昵称')

const maskedPhone = computed(() => userStore.user?.phone || '')

const pointBalance = computed(() => Number(userStore.points || 0).toLocaleString())

const rewardPoints = computed(() => configStore.configs['invite.reward_points'] || 0)

const dailyCheckinState = computed(() => ({
  ...emptyDailyCheckinState,
  ...(userStore.user?.daily_checkin || {}),
  reward_range: {
    ...emptyDailyCheckinState.reward_range,
    ...(userStore.user?.daily_checkin?.reward_range || {}),
  },
}))

const roleLabel = computed(() => (userStore.user?.role === 'admin' ? '管理员' : '普通用户'))

const roleBadgeClass = computed(() =>
  userStore.user?.role === 'admin'
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : 'bg-blue-50 text-blue-700 border-blue-200'
)

const latestCheckinRewardText = computed(() =>
  dailyCheckinState.value.last_checkin_reward ? `+${dailyCheckinState.value.last_checkin_reward}` : '--'
)

const latestCheckinTimeText = computed(() => formatCheckinTime(dailyCheckinState.value.last_checkin_at))

const dailyCheckinBadgeLabel = computed(() =>
  dailyCheckinState.value.checked_in_today ? '今日已签到' : '今日可签到'
)

const dailyCheckinStatusText = computed(() =>
  dailyCheckinState.value.checked_in_today ? '今天已完成' : '等待领取'
)

const dailyCheckinButtonLabel = computed(() => {
  if (signingIn.value) {
    return '签到中...'
  }

  return dailyCheckinState.value.can_check_in ? '立即签到' : '今日已领取'
})

const startEditNickname = () => {
  nickname.value = userStore.user?.nickname || ''
  editingNickname.value = true
}

const cancelEditNickname = () => {
  editingNickname.value = false
  nickname.value = userStore.user?.nickname || ''
}

const saveNickname = async () => {
  const trimmed = nickname.value.trim()
  if (!trimmed) {
    cancelEditNickname()
    return
  }

  try {
    const res = await updateProfile({ nickname: trimmed })
    if (!res.success) {
      toast.error(res.message || '昵称更新失败')
      return
    }

    await userStore.fetchProfile()
    toast.success('昵称已更新')
  } catch (error) {
    toast.error(error?.message || '昵称更新失败')
  } finally {
    editingNickname.value = false
  }
}

const savePassword = async () => {
  pwdError.value = ''

  if (!pwdForm.old_password || pwdForm.new_password.length < 6) {
    pwdError.value = '请填写完整信息，新密码至少 6 位'
    return
  }

  saving.value = true
  try {
    const res = await changePassword(pwdForm)
    if (res.success) {
      toast.success('密码修改成功')
      changingPassword.value = false
      Object.assign(pwdForm, { old_password: '', new_password: '' })
      return
    }

    pwdError.value = res.message || '密码修改失败'
  } catch (error) {
    pwdError.value = error?.message || '密码修改失败'
  } finally {
    saving.value = false
  }
}

const handleDailyCheckin = async () => {
  if (signingIn.value || !dailyCheckinState.value.can_check_in) {
    return
  }

  signingIn.value = true
  try {
    const res = await postDailyCheckin()
    if (!res.success) {
      toast.error(res.message || '签到失败，请稍后重试')
      return
    }

    userStore.points = Number(res.data?.points) || userStore.points
    await userStore.fetchProfile()

    toast.success(`签到成功，获得 ${res.data?.reward || 0} 积分`)
  } catch (error) {
    toast.error(error?.message || '签到失败，请稍后重试')
  } finally {
    signingIn.value = false
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push({ name: 'login' })
}

const openContactModal = () => {
  window.dispatchEvent(new CustomEvent('open-contact-modal'))
}

const copyLink = async () => {
  if (!info.invite_url) {
    toast.error('暂无邀请链接')
    return
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(info.invite_url)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = info.invite_url
      textarea.style.cssText = 'position:fixed;left:-9999px;opacity:0;z-index:-1'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    toast.success('邀请链接已复制')
  } catch (error) {
    console.error('copy invite link failed', error)
    toast.error('复制失败，请手动复制')
  }
}

const formatCheckinTime = (value) => {
  if (!value) {
    return '暂无记录'
  }

  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  const tasks = [
    userStore.fetchProfile(),
    getInviteInfo().then((res) => {
      if (res.success) {
        info.invite_url = res.data.invite_url
      }
    }),
  ]

  if (!Object.keys(configStore.configs).length) {
    tasks.push(configStore.fetchConfigs())
  }

  try {
    await Promise.all(tasks)
  } catch (error) {
    console.error('profile init failed', error)
  }
})
</script>
