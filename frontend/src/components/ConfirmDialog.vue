<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        @click.self="onCancel"
        class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-xs p-6 shadow-xl">
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="iconBgClass"
            >
              <ExclamationTriangleIcon v-if="type === 'danger'" class="w-6 h-6 text-red-500" />
              <ExclamationTriangleIcon v-else-if="type === 'warning'" class="w-6 h-6 text-amber-500" />
              <InformationCircleIcon v-else class="w-6 h-6 text-blue-500" />
            </div>
          </div>

          <!-- Title -->
          <h3 class="text-base font-bold text-slate-900 text-center mb-1.5">{{ title }}</h3>

          <!-- Message -->
          <p class="text-sm text-slate-500 text-center mb-5 leading-relaxed">{{ message }}</p>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="onConfirm"
              :disabled="loading"
              class="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              :class="confirmBtnClass"
            >
              {{ loading ? '处理中...' : confirmText }}
            </button>
            <button
              @click="onCancel"
              :disabled="loading"
              class="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm rounded-lg transition-colors disabled:opacity-60"
            >
              {{ cancelText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '确认操作' },
  message: { type: String, default: '确认执行此操作？' },
  confirmText: { type: String, default: '确认' },
  cancelText: { type: String, default: '取消' },
  type: { type: String, default: 'danger', validator: (v) => ['danger', 'warning', 'info'].includes(v) },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel', 'update:visible'])

const iconBgClass = computed(() => ({
  danger: 'bg-red-50',
  warning: 'bg-amber-50',
  info: 'bg-blue-50',
}[props.type]))

const confirmBtnClass = computed(() => ({
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  info: 'bg-blue-500 hover:bg-blue-600 text-white',
}[props.type]))

const onConfirm = () => emit('confirm')
const onCancel = () => {
  emit('update:visible', false)
  emit('cancel')
}
</script>
