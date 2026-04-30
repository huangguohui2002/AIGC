import { ref } from 'vue'

const toasts = ref([])
let idCounter = 0

export function useToast() {
  function show(message, type = 'info', duration = 3500) {
    const id = ++idCounter
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return {
    toasts,
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    warning: (msg) => show(msg, 'warning'),
    info: (msg) => show(msg, 'info'),
  }
}
