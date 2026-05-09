<template>
  <div class="h-full bg-transparent md:grid md:grid-cols-[minmax(320px,2fr)_minmax(0,3fr)]">
    <div
      class="relative flex-col bg-white md:flex md:min-w-0 md:border-r md:border-slate-200"
      :class="mobileView === 'result' ? 'hidden md:flex' : 'flex w-full'"
    >
      <div class="px-6 py-5 border-b border-slate-200 surface-brand">
        <div class="flex items-center gap-2.5">
          <div
            class="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center"
          >
            <FilmIcon class="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div>
            <div class="text-base font-semibold text-slate-900">视频生成</div>
            <p class="mt-1 text-sm text-slate-500">
              每次提交都会在右侧追加新的视频任务卡片
            </p>
          </div>
        </div>
      </div>

      <div class="relative flex-1 min-h-0 overflow-hidden">
        <div class="flex h-full flex-col">
          <div class="flex-1 min-h-0 overflow-y-auto p-5 md:max-h-[calc(100vh-26rem)] md:p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                参考图
                <span class="text-slate-500">(图生视频，最多 4 张)</span>
              </label>
              <div
                v-if="previews.length < 4"
                @click="openRefImageInput"
                @dragover.prevent
                @drop.prevent="onDrop"
                class="border-2 border-dashed border-slate-300 hover:border-violet-400 rounded-xl p-5 text-center cursor-pointer transition-all duration-200 group mb-2 bg-slate-50"
              >
                <input
                  ref="refImageInput"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="onSelect"
                />
                <FilmIcon
                  class="w-7 h-7 text-slate-400 mx-auto mb-2 group-hover:text-violet-600 transition-colors"
                />
                <p class="text-sm text-slate-500">
                  点击或拖拽上传参考图生成图生视频
                </p>
                <p class="text-xs text-slate-400 mt-1">
                  支持 JPG / PNG / WebP，单张最大 10MB
                </p>
              </div>

              <div v-if="previews.length > 0" class="grid grid-cols-4 gap-2">
                <div
                  v-for="(item, index) in previews"
                  :key="index"
                  class="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                >
                  <div
                    v-if="item.uploading"
                    class="absolute inset-0 flex items-center justify-center bg-slate-100"
                  >
                    <span
                      class="w-5 h-5 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin"
                    />
                  </div>
                  <img
                    v-else
                    :src="item.url"
                    class="w-full h-full object-cover"
                  />
                  <button
                    v-if="!item.uploading"
                    @click="removeImage(index)"
                    class="absolute top-1 right-1 w-5 h-5 rounded-md bg-rose-500/80 flex items-center justify-center hover:bg-rose-500 transition-colors"
                  >
                    <XMarkIcon class="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>

              <div
                v-if="previews.length > 0"
                class="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200"
              >
                <ClockIcon class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <p class="text-xs text-amber-700">
                  上传的参考图将在
                  <span class="font-medium">30 分钟</span>
                  后失效，请尽快发起生成。
                </p>
              </div>
              <p class="text-xs text-slate-500 mt-1.5">
                上传参考图可生成图生视频，不上传则默认进行文生视频。
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                提示词
                <span class="text-rose-500">*</span>
              </label>
              <textarea
                v-model="form.prompt"
                rows="5"
                placeholder="描述你想要生成的视频内容、动作、镜头和风格..."
                class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-violet-500 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3.5 outline-none transition-all text-base resize-none leading-relaxed"
              />
              <div class="mt-1.5 flex items-center justify-between">
                <span class="text-sm text-slate-500">{{ form.prompt.length }} 字符</span>
                <span
                  v-if="hasUploadingPreviews"
                  class="text-xs text-amber-600"
                >
                  参考图上传中，请稍后提交
                </span>
              </div>
            </div>

            <div v-if="videoModels.length > 0">
              <label class="block text-sm font-medium text-slate-700 mb-2">
                AI 模型
              </label>
              <AdminSelect
                v-model="form.model"
                :options="videoModels"
                color="violet"
                fullWidth
              />
              <div
                v-if="selectedVideoModel"
                class="mt-1.5 flex items-center justify-between text-xs text-slate-500"
              >
                <span>{{ selectedVideoModel.desc }}</span>
                <span
                  v-if="selectedVideoModel.pointsCost > 0"
                  class="text-amber-600 font-medium"
                >
                  {{ selectedVideoModel.pointsCost }} 积分/次
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                视频比例
              </label>
              <AdminSelect
                v-model="form.aspectRatio"
                :options="aspectRatioSelectOptions"
                color="violet"
                fullWidth
              />
            </div>

            <div v-if="durationOptions !== null">
              <label class="block text-sm font-medium text-slate-700 mb-2">
                视频时长
              </label>
              <div class="flex gap-2">
                <button
                  v-for="duration in durationOptions"
                  :key="duration"
                  @click="form.duration = duration"
                  class="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200"
                  :class="
                    form.duration === duration
                      ? 'bg-violet-50 border-violet-500 text-violet-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                  "
                >
                  {{ duration }}s
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                生成数量
              </label>
              <div class="flex gap-2">
                <button
                  v-for="count in [1, 2, 4]"
                  :key="count"
                  @click="form.count = count"
                  class="flex-1 py-2.5 rounded-xl border font-medium transition-all duration-200"
                  :class="
                    form.count === count
                      ? 'bg-violet-50 border-violet-500 text-violet-700 text-base'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 text-base'
                  "
                >
                  {{ count }} 个
                </button>
              </div>
            </div>

            <div class="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
              <div class="flex items-center gap-2 mb-1.5">
                <ClockIcon class="w-4 h-4 text-amber-600" />
                <span class="text-sm font-medium text-amber-700">生成时间较长</span>
              </div>
              <p class="text-sm text-amber-700/80 leading-relaxed">
                视频生成通常需要 60-90 秒，提交后你可以继续填写新的提示词并创建下一批任务。
              </p>
            </div>
          </div>

          <div class="p-5 md:p-6 border-t border-slate-200 bg-slate-50/70">
            <div class="flex items-center justify-between mb-3 text-sm">
              <span class="text-slate-600">预计消耗</span>
              <span class="text-amber-600 font-mono font-medium">
                {{ videoCost * form.count }} 积分
              </span>
            </div>
            <button
              @click="handleGenerate"
              :disabled="!canSubmitVideo"
              class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-base transition-all duration-200 disabled:cursor-not-allowed"
              :class="
                canSubmitVideo
                  ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-200 text-slate-400 border border-slate-300'
              "
            >
              <span
                v-if="isSubmittingBatch"
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
              <FilmIcon v-else class="w-4 h-4" />
              {{ isSubmittingBatch ? "正在提交视频任务..." : "生成新视频" }}
            </button>
            <p class="text-center text-sm text-slate-500 mt-2">
              当前余额 {{ userStore.points.toLocaleString() }} 积分
            </p>
          </div>
        </div>

        <Transition name="fade">
          <div
            v-if="showVideoOperationOverlay"
            class="absolute inset-0 z-20 flex items-center justify-center bg-white/82 px-6 backdrop-blur-sm"
          >
            <div class="w-full max-w-sm rounded-[20px] border border-slate-200 bg-white/96 p-6 text-center shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-violet-50 text-violet-600">
                <FilmIcon class="h-6 w-6" />
              </div>
              <p class="mt-4 text-lg font-semibold text-slate-900">
                当前还有 {{ videoPendingCount }} 个视频任务在生成
              </p>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                点击下方按钮后会重置左侧操作区，你可以继续填写新的提示词并追加下一批视频任务。
              </p>
              <button
                type="button"
                class="mt-5 inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                @click="prepareNextVideoTask"
              >
                生成新视频
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div
      class="min-h-0 flex-col overflow-hidden"
      :class="mobileView === 'form' ? 'hidden md:flex' : 'flex'"
    >
      <div
        class="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0"
      >
        <button
          @click="mobileView = 'form'"
          class="flex items-center gap-1.5 text-violet-600 hover:text-violet-700 transition-colors"
        >
          <ChevronLeftIcon class="w-5 h-5" />
          <span class="text-sm font-medium whitespace-nowrap">继续编辑</span>
        </button>
        <span class="text-sm font-semibold text-slate-900 whitespace-nowrap">
          创作队列
        </span>
        <div class="w-16" />
      </div>

      <GenerationTaskGrid
        type="video"
        :tasks="videoTasks"
        empty-title="还没有生成视频"
        empty-description="填写左侧提示词并点击“生成新视频”，新的视频任务会持续追加到这里。"
        @retry="retryVideoTask"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  ChevronLeftIcon,
  ClockIcon,
  FilmIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import { generateVideo, getGenerationResult } from "../api/generate.js";
import { getPublicAiModels } from "../api/config.js";
import { uploadTempImage } from "../api/upload.js";
import AdminSelect from "../components/admin/AdminSelect.vue";
import GenerationTaskGrid from "../components/generation/GenerationTaskGrid.vue";
import { useGenerationTaskBoard } from "../composables/useGenerationTaskBoard.js";
import { useToast } from "../composables/useToast.js";
import { useUserStore } from "../stores/userStore.js";

const userStore = useUserStore();
const toast = useToast();
const {
  tasks: videoTasks,
  pendingCount: videoPendingCount,
  createTaskBatch,
  markTaskFailed,
  resolveTaskSuccess,
  startTaskPolling,
} = useGenerationTaskBoard({ getGenerationResult });

const refImageInput = ref(null);
const mobileView = ref("form");
const videoModels = ref([]);
const previews = ref([]);
const isSubmittingBatch = ref(false);
const isPreparingNextVideoTask = ref(true);

const form = reactive({
  prompt: "",
  model: "",
  aspectRatio: "16:9",
  duration: null,
  count: 1,
});

const selectedVideoModel = computed(() =>
  videoModels.value.find((model) => model.value === form.model),
);
const videoCost = computed(() => selectedVideoModel.value?.pointsCost ?? 0);
const getVideoModelCost = (modelName) =>
  videoModels.value.find((model) => model.value === modelName)?.pointsCost ??
  videoCost.value;
const currentModelCapabilities = computed(
  () => selectedVideoModel.value?.capabilities || null,
);
const aspectRatioOptions = computed(
  () => currentModelCapabilities.value?.aspectRatioOptions || ["16:9", "9:16"],
);
const aspectRatioSelectOptions = computed(() =>
  aspectRatioOptions.value.map((ratio) => ({ value: ratio, label: ratio })),
);
const durationOptions = computed(
  () => currentModelCapabilities.value?.durationOptions ?? null,
);
const hasUploadingPreviews = computed(() =>
  previews.value.some((item) => item.uploading),
);
const canSubmitVideo = computed(
  () =>
    !!form.prompt.trim() &&
    !!form.model &&
    !isSubmittingBatch.value &&
    !hasUploadingPreviews.value &&
    userStore.points >= videoCost.value * form.count,
);
// 视频仍在生成时，先用蒙版保护左侧区域，点按钮后再开始下一轮填写。
const showVideoOperationOverlay = computed(
  () => videoPendingCount.value > 0 && !isPreparingNextVideoTask.value,
);

const refreshPointsBalance = async () => {
  await userStore.fetchBalance();
};

const resetVideoOperationForm = () => {
  form.prompt = "";
  previews.value = [];
  if (refImageInput.value) refImageInput.value.value = "";
};

const prepareNextVideoTask = () => {
  resetVideoOperationForm();
  isPreparingNextVideoTask.value = true;
  mobileView.value = "form";
};

const buildVideoPayload = () => {
  const payload = {
    prompt: form.prompt.trim(),
    model: form.model,
    aspectRatio: form.aspectRatio,
  };
  if (form.duration !== null) payload.duration = form.duration;
  if (previews.value.length > 0) {
    payload.reference_images = previews.value
      .filter((item) => item.url)
      .map((item) => item.url);
  }
  return payload;
};

const normalizeVideoResult = (data) => {
  if (typeof data?.result_url === "string" && data.result_url) {
    return { resultUrl: data.result_url, resultUrls: [data.result_url] };
  }

  if (Array.isArray(data?.results)) {
    const firstItem = data.results.find(
      (item) => typeof item?.result_url === "string" && item.result_url,
    );
    if (firstItem?.result_url) {
      return {
        resultUrl: firstItem.result_url,
        resultUrls: [firstItem.result_url],
      };
    }
  }

  return null;
};

const openRefImageInput = () => {
  refImageInput.value?.click?.();
};

const onSelect = (event) => {
  const files = Array.from(event.target.files || []);
  files.forEach(addImage);
  if (refImageInput.value) refImageInput.value.value = "";
};

const onDrop = (event) => {
  const files = Array.from(event.dataTransfer.files || []);
  files.forEach(addImage);
};

const addImage = async (file) => {
  if (previews.value.length >= 4) {
    toast.error("最多上传 4 张参考图");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.error("图片不能超过 10MB");
    return;
  }

  const index = previews.value.length;
  previews.value.push({ url: null, uploading: true });

  try {
    const result = await uploadTempImage(file);
    if (result.success && result.data?.url) {
      previews.value[index] = { url: result.data.url, uploading: false };
      return;
    }
    previews.value.splice(index, 1);
    toast.error(result.message || "上传失败");
  } catch (error) {
    previews.value.splice(index, 1);
    toast.error(error?.message || "上传失败");
  }
};

const removeImage = (index) => {
  previews.value.splice(index, 1);
};

const queueVideoTasks = ({ payload, count }) =>
  createTaskBatch({
    type: "video",
    count,
    shared: {
      prompt: payload.prompt,
      model: payload.model,
      aspectRatio: payload.aspectRatio,
      duration: payload.duration ?? null,
      retryPayload: { ...payload },
    },
  });

const submitSingleVideoTask = async (taskId, payload) => {
  try {
    const submitResult = await generateVideo(payload);
    if (!submitResult.success) {
      markTaskFailed(taskId, submitResult.message || "任务提交失败");
      return false;
    }

    const immediateResult = normalizeVideoResult(submitResult.data || {});
    if (immediateResult?.resultUrl && !submitResult.data?.generation_id) {
      resolveTaskSuccess(taskId, submitResult.data, normalizeVideoResult);
      return true;
    }

    const generationId = submitResult.data?.generation_id;
    if (!generationId) {
      markTaskFailed(taskId, submitResult.message || "任务提交失败");
      return false;
    }

    startTaskPolling(taskId, generationId, normalizeVideoResult, {
      onFailed: () => {
        refreshPointsBalance();
      },
    });
    return true;
  } catch (error) {
    markTaskFailed(taskId, error?.message || "任务提交失败，请重试");
    return false;
  }
};

const submitVideoBatch = async (
  payload,
  count,
  successText = "视频任务已加入创作队列",
) => {
  const createdTasks = queueVideoTasks({ payload, count });
  const results = await Promise.all(
    createdTasks.map((task) => submitSingleVideoTask(task.id, payload)),
  );

  const successCount = results.filter(Boolean).length;
  await refreshPointsBalance();

  if (successCount === 0) {
    toast.error("视频任务提交失败，请重试");
    return false;
  }

  if (successCount < createdTasks.length) {
    toast.warning(`已提交 ${successCount} 个视频任务，其余任务提交失败`);
  } else {
    toast.success(successText);
  }
  return true;
};

const handleGenerate = async () => {
  if (!form.prompt.trim()) {
    toast.error("请输入提示词");
    return;
  }
  if (hasUploadingPreviews.value) {
    toast.error("参考图上传中，请稍后再试");
    return;
  }
  if (userStore.points < videoCost.value * form.count) {
    toast.error("积分不足，请充值后再试");
    return;
  }

  const payload = buildVideoPayload();
  isSubmittingBatch.value = true;
  isPreparingNextVideoTask.value = false;
  mobileView.value = "result";

  try {
    await submitVideoBatch(payload, form.count);
  } finally {
    isSubmittingBatch.value = false;
  }
};

const retryVideoTask = async (task) => {
  const payload = task.retryPayload || null;
  if (!payload?.prompt || !payload?.model) {
    toast.error("缺少重试所需的生成参数");
    return;
  }
  if (userStore.points < getVideoModelCost(payload.model)) {
    toast.error("积分不足，请充值后再试");
    return;
  }

  mobileView.value = "result";
  await submitVideoBatch(payload, 1, "已重新加入视频创作队列");
};

onMounted(async () => {
  try {
    const result = await getPublicAiModels("video");
    if (result.success && result.data?.models?.length) {
      videoModels.value = result.data.models.map((model) => ({
        value: model.model_name,
        label: model.name,
        desc: model.subtitle || "",
        pointsCost: model.points_cost ?? 0,
        capabilities: model.capabilities || null,
      }));
      form.model = videoModels.value[0].value;
      form.aspectRatio = aspectRatioOptions.value[0] || "16:9";
      form.duration = durationOptions.value ? durationOptions.value[0] : null;
    }
  } catch {}
});

watch(
  () => form.model,
  () => {
    form.aspectRatio = aspectRatioOptions.value[0] || "16:9";
    form.duration = durationOptions.value ? durationOptions.value[0] : null;
  },
);
</script>
