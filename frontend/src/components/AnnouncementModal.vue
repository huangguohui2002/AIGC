<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        @click.self="$emit('close')"
        class="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
      >
        <div class="paper-panel rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col overflow-hidden announcement-modal-enter">
          <div class="px-6 pt-6 pb-5 border-b border-slate-200 flex-shrink-0 surface-brand">
            <div class="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-300 sm:hidden" />
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl icon-surface flex items-center justify-center flex-shrink-0">
                  <MegaphoneIcon class="w-5 h-5" />
                </div>
                <div>
                  <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Announcements</div>
                  <h2 class="font-serif text-2xl leading-tight text-slate-900">平台公告</h2>
                  <p class="text-xs text-slate-500 mt-1">共 {{ sortedAnnouncements.length }} 条更新</p>
                </div>
              </div>
              <button
                @click="$emit('close')"
                class="flex-shrink-0 w-9 h-9 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-slate-500 transition-colors duration-150 border border-slate-200"
                aria-label="关闭公告"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 max-h-[60dvh] sm:max-h-[60vh]">
            <div v-if="loading" class="space-y-3">
              <div v-for="i in 3" :key="i" class="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            </div>

            <div v-else-if="sortedAnnouncements.length === 0" class="flex flex-col items-center py-14">
              <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <MegaphoneIcon class="w-8 h-8 text-slate-400" />
              </div>
              <p class="text-sm text-slate-500">暂无公告</p>
            </div>

            <div
              v-for="a in sortedAnnouncements"
              :key="a.id"
              class="rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-sm"
              :class="a.level === 'important'
                ? 'border-rose-200 bg-rose-50'
                : 'border-slate-200 bg-white hover:border-slate-300'"
              @click="expandedId = expandedId === a.id ? null : a.id"
            >
              <div class="flex items-start gap-3 px-4 py-4">
                <div v-if="a.level === 'important'" class="flex-shrink-0 mt-0.5">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm">
                    重要
                  </span>
                </div>
                <p
                  class="flex-1 text-sm font-semibold leading-snug break-words"
                  :class="a.level === 'important' ? 'text-rose-700' : 'text-slate-900'"
                >
                  {{ a.title }}
                </p>
                <div class="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  <span class="text-xs text-slate-400 tabular-nums">{{ formatDate(a.published_at) }}</span>
                  <ChevronDownIcon
                    class="w-4 h-4 transition-transform duration-250 flex-shrink-0"
                    :class="[expandedId === a.id ? 'rotate-180' : '', a.level === 'important' ? 'text-rose-400' : 'text-slate-400']"
                  />
                </div>
              </div>

              <div
                v-if="expandedId === a.id"
                class="px-4 pb-4 content-expand"
                :class="a.level === 'important' ? 'border-t border-rose-200/70' : 'border-t border-slate-100'"
              >
                <p class="pt-3 text-sm leading-relaxed" :class="a.level === 'important' ? 'text-rose-700' : 'text-slate-600'">
                  {{ a.content }}
                </p>
              </div>
            </div>
          </div>

          <div class="h-4 flex-shrink-0 sm:hidden" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { XMarkIcon, MegaphoneIcon, ChevronDownIcon } from "@heroicons/vue/24/outline";
import { useConfigStore } from "../stores/configStore.js";

defineEmits(["close"]);
const configStore = useConfigStore();
const announcements = ref([]);
const loading = ref(false);
const expandedId = ref(null);

const sortedAnnouncements = computed(() => {
  const important = announcements.value.filter((a) => a.level === "important");
  const normal = announcements.value.filter((a) => a.level !== "important");
  return [...important, ...normal];
});

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) : "";

onMounted(async () => {
  loading.value = true;
  await configStore.fetchAnnouncements();
  announcements.value = configStore.announcements;
  loading.value = false;
  if (sortedAnnouncements.value.length > 0) {
    expandedId.value = sortedAnnouncements.value[0].id;
  }
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.announcement-modal-enter {
  animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.97);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.content-expand {
  animation: contentFadeIn 0.2s ease both;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
