<template>
  <div class="relative" ref="containerRef">
    <button
      type="button"
      @click.stop="isOpen = !isOpen"
      class="inline-flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 transition-all shadow-sm"
      :class="[sizeClass, widthClass, colorClasses.ring]"
    >
      <span :class="(modelValue === '' || modelValue == null) ? 'text-slate-400' : 'text-slate-700'">
        {{ selectedLabel }}
      </span>
      <ChevronDownIcon
        class="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-150"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition
      :enter-active-class="transitionClasses.enterActive"
      :enter-from-class="transitionClasses.enterFrom"
      :enter-to-class="transitionClasses.enterTo"
      :leave-active-class="transitionClasses.leaveActive"
      :leave-from-class="transitionClasses.leaveFrom"
      :leave-to-class="transitionClasses.leaveTo"
    >
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="absolute left-0 bg-white border border-slate-200 rounded-2xl shadow-lg z-[9999] py-1.5 overflow-hidden"
        :class="[dropdownWidth, dropdownPositionClass]"
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          @click.stop="select(opt)"
          class="w-full text-left px-3.5 py-2.5 text-sm transition-colors whitespace-nowrap"
          :class="String(opt.value) === String(modelValue)
            ? colorClasses.active
            : 'text-slate-700 hover:bg-slate-50'"
        >
          {{ opt.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const COLOR_MAP = {
  rose:   { ring: 'focus:ring-rose-400/20 focus:border-rose-400',     active: 'text-rose-700 bg-rose-50 font-medium' },
  blue:   { ring: 'focus:ring-blue-400/20 focus:border-blue-400',     active: 'text-blue-700 bg-blue-50 font-medium' },
  violet: { ring: 'focus:ring-violet-400/20 focus:border-violet-400', active: 'text-slate-900 bg-violet-50 font-medium' },
}

const props = defineProps({
  /** v-model 绑定值 */
  modelValue: { type: [String, Number], default: '' },
  /** 选项列表 [{ value, label }] */
  options: { type: Array, default: () => [] },
  /** 无选中时的占位文字 */
  placeholder: { type: String, default: '请选择' },
  /** 尺寸：sm | md */
  size: { type: String, default: 'md' },
  /** 是否撑满父容器宽度 */
  fullWidth: { type: Boolean, default: false },
  /** 主题色：rose | blue | violet */
  color: { type: String, default: 'rose' },
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const dropdownRef = ref(null)
const isOpen = ref(false)
const openUpward = ref(false)

const sizeClass = computed(() => props.size === 'sm' ? 'text-xs py-1.5' : 'text-sm py-2')
const widthClass = computed(() => props.fullWidth ? 'w-full' : 'min-w-[120px]')
const dropdownWidth = computed(() => props.fullWidth ? 'w-full' : 'min-w-[140px]')
const colorClasses = computed(() => COLOR_MAP[props.color] ?? COLOR_MAP.rose)
const dropdownPositionClass = computed(() => openUpward.value ? 'bottom-full mb-1' : 'top-full mt-1')
const transitionClasses = computed(() => (
  openUpward.value
    ? {
        enterActive: 'transition-all duration-150 ease-out origin-bottom',
        enterFrom: 'opacity-0 scale-y-95 translate-y-[4px]',
        enterTo: 'opacity-100 scale-y-100 translate-y-0',
        leaveActive: 'transition-all duration-100 ease-in origin-bottom',
        leaveFrom: 'opacity-100 scale-y-100 translate-y-0',
        leaveTo: 'opacity-0 scale-y-95 translate-y-[4px]',
      }
    : {
        enterActive: 'transition-all duration-150 ease-out origin-top',
        enterFrom: 'opacity-0 scale-y-95 translate-y-[-4px]',
        enterTo: 'opacity-100 scale-y-100 translate-y-0',
        leaveActive: 'transition-all duration-100 ease-in origin-top',
        leaveFrom: 'opacity-100 scale-y-100 translate-y-0',
        leaveTo: 'opacity-0 scale-y-95 translate-y-[-4px]',
      }
))

const selectedLabel = computed(() => {
  const found = props.options.find(o => String(o.value) === String(props.modelValue))
  return found ? found.label : props.placeholder
})

const select = (opt) => {
  emit('update:modelValue', opt.value)
  isOpen.value = false
}

const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

const updateDropdownPosition = () => {
  if (!containerRef.value) return

  const containerRect = containerRef.value.getBoundingClientRect()
  const dropdownHeight = dropdownRef.value?.offsetHeight ?? 0
  const spacing = 8
  const spaceBelow = window.innerHeight - containerRect.bottom
  const spaceAbove = containerRect.top

  openUpward.value = spaceBelow < dropdownHeight + spacing && spaceAbove > spaceBelow
}

const handleViewportChange = () => {
  if (isOpen.value) updateDropdownPosition()
}

watch(isOpen, async (open) => {
  if (!open) return
  openUpward.value = false
  await nextTick()
  updateDropdownPosition()
})

onMounted(() => document.addEventListener('click', handleClickOutside, true))
onMounted(() => {
  window.addEventListener('resize', handleViewportChange)
  window.addEventListener('scroll', handleViewportChange, true)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('scroll', handleViewportChange, true)
})
</script>
