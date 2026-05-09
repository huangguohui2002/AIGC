<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur-sm md:px-8">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Task Board
          </div>
          <h2 class="mt-1 text-xl font-semibold text-slate-900">
            创作队列
          </h2>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            共 {{ tasks.length }} 个产出物
          </span>
          <span class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
            进行中 {{ pendingCount }} 个
          </span>
          <span class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
            已完成 {{ successCount }} 个
          </span>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0 px-6 pb-6 pt-5 md:px-8 md:pb-8">
      <div
        v-if="tasks.length === 0"
        class="flex min-h-[360px] flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-white/65 px-8 text-center md:min-h-[420px]"
      >
        <div
          class="flex h-20 w-20 items-center justify-center rounded-[20px] border border-slate-200 bg-slate-50 shadow-sm"
        >
          <PhotoIcon
            v-if="type === 'image'"
            class="h-9 w-9 text-slate-400"
          />
          <FilmIcon
            v-else
            class="h-9 w-9 text-slate-400"
          />
        </div>
        <p class="mt-5 text-lg font-medium text-slate-900">
          {{ emptyTitle }}
        </p>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
          {{ emptyDescription }}
        </p>
      </div>

      <div
        v-else
        class="flex h-full min-h-0 flex-col"
      >
        <div
          class="h-full min-h-0"
          :class="boardBodyClass"
        >
          <div
            class="grid min-h-0 auto-rows-fr gap-4"
            :class="gridColumnClass"
          >
            <div
              v-for="task in tasks"
              :key="task.id"
              :class="itemWrapperClass"
            >
              <GenerationTaskCard
                :task="task"
                @preview="$emit('preview', $event)"
                @retry="$emit('retry', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { FilmIcon, PhotoIcon } from "@heroicons/vue/24/outline";
import GenerationTaskCard from "./GenerationTaskCard.vue";

const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
  type: {
    type: String,
    required: true,
  },
  emptyTitle: {
    type: String,
    required: true,
  },
  emptyDescription: {
    type: String,
    required: true,
  },
});

defineEmits(["preview", "retry"]);

const pendingCount = computed(
  () =>
    props.tasks.filter(
      (task) => task.status === "submitting" || task.status === "pending",
    ).length,
);
const successCount = computed(
  () => props.tasks.filter((task) => task.status === "success").length,
);

// 根据当前产出物数量动态控制列数，让少量结果占据更大的展示区域。
const gridColumnClass = computed(() => {
  const count = props.tasks.length;
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 lg:grid-cols-2";
  if (count === 3) return "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3";
  return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
});

const itemWrapperClass = computed(() =>
  props.tasks.length === 1 ? "mx-auto w-full max-w-[760px]" : "w-full",
);

const boardBodyClass = computed(() => "overflow-y-auto pr-1");
</script>
