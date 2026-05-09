<template>
  <article
    class="group flex h-full flex-col overflow-hidden rounded-[20px] border bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.12)]"
    :class="cardBorderClass"
  >
    <div
      class="relative flex-1 overflow-hidden bg-slate-50"
      :class="mediaAspectClass"
    >
      <button
        v-if="canPreview"
        type="button"
        class="absolute inset-0 z-10"
        aria-label="预览生成图片"
        @click="$emit('preview', task)"
      />

      <video
        v-if="isVideo && task.resultUrl"
        :src="task.resultUrl"
        controls
        class="relative z-[1] h-full w-full bg-slate-950 object-cover transition duration-300"
        :class="assetLoaded ? 'opacity-100' : 'opacity-0'"
        @loadeddata="assetLoaded = true"
      />
      <img
        v-else-if="isImage && task.resultUrl"
        :src="task.resultUrl"
        :alt="task.prompt || typeLabel"
        class="relative z-[1] h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        :class="assetLoaded ? 'opacity-100' : 'opacity-0'"
        @load="assetLoaded = true"
      />

      <div
        v-if="task.resultUrl && !assetLoaded"
        class="absolute inset-0 bg-gradient-to-r from-slate-100 via-white to-slate-100 animate-pulse"
      />

      <template v-if="!task.resultUrl">
        <div
          class="absolute inset-0"
          :class="placeholderBgClass"
        />
        <div
          v-if="task.status !== 'failed'"
          class="absolute inset-0 bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.78),transparent)] animate-pulse"
        />
        <div class="relative z-[1] flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-[16px] border border-white/60 bg-white/75 shadow-sm backdrop-blur-md"
          >
            <PhotoIcon
              v-if="isImage"
              class="h-7 w-7 text-blue-600"
            />
            <FilmIcon
              v-else
              class="h-7 w-7 text-violet-600"
            />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-slate-800">
              {{ statusHeadline }}
            </p>
            <p class="text-xs leading-5 text-slate-500">
              {{ placeholderHint }}
            </p>
          </div>
        </div>
      </template>

      <div
        v-if="task.status === 'failed'"
        class="absolute inset-0 z-[2] flex items-center justify-center bg-white/86 backdrop-blur-sm"
      >
        <div class="px-6 text-center">
          <XCircleIcon class="mx-auto h-9 w-9 text-rose-500" />
          <p class="mt-2 text-sm font-medium text-rose-600">本次生成失败</p>
        </div>
      </div>

      <div class="absolute left-3 top-3 z-[3] flex items-center gap-2">
        <span
          class="rounded-xl px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
          :class="typeBadgeClass"
        >
          {{ typeLabel }}
        </span>
        <span
          v-if="showProgressBadge"
          class="rounded-xl border border-white/20 bg-black/35 px-2.5 py-1 font-mono text-[11px] text-white backdrop-blur-sm"
        >
          {{ displayProgress }}%
        </span>
      </div>

      <div class="absolute right-3 top-3 z-[4] flex items-center gap-2">
        <button
          v-if="showDownloadAction"
          type="button"
          class="inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-white/70 bg-white/92 px-2.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          @click.stop="downloadAsset"
        >
          <ArrowDownTrayIcon class="h-3.5 w-3.5" />
          下载
        </button>
        <button
          v-if="showRetryAction"
          type="button"
          class="inline-flex h-8 items-center justify-center gap-1 rounded-xl border px-2.5 text-xs font-medium shadow-sm transition-colors"
          :class="retryButtonClass"
          @click.stop="$emit('retry', task)"
        >
          <ArrowPathIcon class="h-3.5 w-3.5" />
          重试
        </button>
      </div>
    </div>

    <div
      v-if="showInfoPanel"
      class="flex flex-1 flex-col gap-3 border-t border-slate-100 px-4 py-4"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="line-clamp-2 text-sm font-medium leading-6 text-slate-900">
            {{ task.prompt || defaultPromptText }}
          </p>
          <p class="mt-1 line-clamp-1 text-xs text-slate-500">
            {{ detailText }}
          </p>
        </div>
        <span
          v-if="createdAtText"
          class="shrink-0 text-[11px] text-slate-400"
        >
          {{ createdAtText }}
        </span>
      </div>

      <div class="mt-auto rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-3">
        <div class="mb-2 flex items-center justify-between gap-3 text-xs">
          <span :class="statusTextClass">
            {{ statusText }}
          </span>
          <span class="font-mono text-slate-600">
            {{ displayProgress }}%
          </span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-white">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="progressBarClass"
            :style="{ width: `${displayProgress}%` }"
          />
        </div>
        <p
          v-if="task.status === 'failed' && task.errorMessage"
          class="mt-2 line-clamp-2 text-xs leading-5 text-rose-600"
          :title="task.errorMessage"
        >
          {{ task.errorMessage }}
        </p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  FilmIcon,
  PhotoIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
});

defineEmits(["preview", "retry"]);

const assetLoaded = ref(false);

watch(
  () => props.task.resultUrl,
  () => {
    assetLoaded.value = false;
  },
);

const isImage = computed(() => props.task.type === "image");
const isVideo = computed(() => props.task.type === "video");
const typeLabel = computed(() => (isImage.value ? "图片" : "视频"));
const defaultPromptText = computed(() =>
  isImage.value ? "等待新的图片提示词" : "等待新的视频提示词",
);
const mediaAspectClass = computed(() =>
  isImage.value ? "aspect-square" : "aspect-video",
);
const placeholderBgClass = computed(() =>
  isImage.value
    ? "bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.24),_transparent_48%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)]"
    : "bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.24),_transparent_48%),linear-gradient(180deg,#fbf9ff_0%,#f3efff_100%)]",
);
const typeBadgeClass = computed(() =>
  isImage.value ? "bg-blue-600/85" : "bg-violet-600/85",
);
const retryButtonClass = computed(() =>
  isImage.value
    ? "border-blue-200 bg-blue-50/95 text-blue-700 hover:bg-blue-100"
    : "border-violet-200 bg-violet-50/95 text-violet-700 hover:bg-violet-100",
);

const displayProgress = computed(() => {
  if (props.task.status === "success" || props.task.status === "failed") {
    return 100;
  }
  return Math.max(0, Math.min(Math.floor(props.task.progress || 0), 99));
});

const statusText = computed(() => {
  if (props.task.status === "success") return "已完成";
  if (props.task.status === "failed") return "生成失败";
  if (props.task.status === "pending") return "生成中";
  return "提交中";
});

const statusHeadline = computed(() => {
  if (props.task.status === "pending") return "AI 正在创作中";
  if (props.task.status === "failed") return "生成未完成";
  return "正在加入创作队列";
});

const placeholderHint = computed(() =>
  isImage.value
    ? "生成完成后，图片会自动出现在这里。"
    : "生成完成后，视频会自动出现在这里。",
);

const statusTextClass = computed(() => {
  if (props.task.status === "success") return "text-emerald-600";
  if (props.task.status === "failed") return "text-rose-600";
  if (props.task.status === "pending") {
    return isImage.value ? "text-blue-600" : "text-violet-600";
  }
  return "text-slate-500";
});

const progressBarClass = computed(() => {
  if (props.task.status === "success") return "bg-emerald-500";
  if (props.task.status === "failed") return "bg-rose-500";
  return isImage.value ? "bg-blue-600" : "bg-violet-600";
});

const cardBorderClass = computed(() => {
  if (props.task.status === "success") return "border-slate-200";
  if (props.task.status === "failed") return "border-rose-200";
  return isImage.value ? "border-blue-100" : "border-violet-100";
});

const detailText = computed(() => {
  const details = [props.task.model];
  if (props.task.aspectRatio) details.push(props.task.aspectRatio);
  if (props.task.imageSize) details.push(props.task.imageSize);
  if (props.task.duration) details.push(`${props.task.duration}s`);
  return details.filter(Boolean).join(" · ") || "等待参数写入";
});

const createdAtText = computed(() => {
  if (!props.task.createdAt) return "";
  return new Date(props.task.createdAt).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
});

const canPreview = computed(
  () => isImage.value && props.task.status === "success" && !!props.task.resultUrl,
);
const showProgressBadge = computed(
  () => props.task.status === "submitting" || props.task.status === "pending",
);
const showDownloadAction = computed(
  () => props.task.status === "success" && !!props.task.resultUrl,
);
const showRetryAction = computed(() => props.task.status === "failed");
// 成功态只保留产出物主视觉，避免文字区继续压缩展示空间。
const showInfoPanel = computed(() => props.task.status !== "success");

const downloadAsset = () => {
  if (!props.task.resultUrl) return;
  const link = document.createElement("a");
  link.href = props.task.resultUrl;
  link.download = `aigc-${props.task.type}-${props.task.id}`;
  link.target = "_blank";
  link.click();
};
</script>
