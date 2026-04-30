<template>
  <Teleport to="body">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border min-w-[280px] max-w-sm shadow-card backdrop-blur-sm"
          :class="toastClass(toast.type)"
        >
          <component :is="toastIcon(toast.type)" class="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span class="text-sm font-medium leading-snug">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/solid'
import { useToast } from '../composables/useToast.js'

const { toasts } = useToast()

const toastClass = (type) => ({
  'success': 'bg-emerald-50 border-emerald-200 text-emerald-700',
  'error':   'bg-rose-50 border-rose-200 text-rose-700',
  'warning': 'bg-amber-50 border-amber-200 text-amber-700',
  'info':    'bg-blue-50 border-blue-200 text-blue-700',
}[type] || 'bg-white border-slate-200 text-slate-700')

const toastIcon = (type) => ({
  'success': CheckCircleIcon,
  'error':   XCircleIcon,
  'warning': ExclamationTriangleIcon,
  'info':    InformationCircleIcon,
}[type] || InformationCircleIcon)
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-12px) scale(0.95); }
.toast-leave-to   { opacity: 0; transform: translateY(-8px) scale(0.95); }
</style>
