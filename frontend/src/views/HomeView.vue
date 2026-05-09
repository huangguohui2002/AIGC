<template>
  <div class="h-full bg-transparent md:grid md:grid-cols-[minmax(320px,2fr)_minmax(0,3fr)]">
    <div
      class="relative flex-col bg-white md:flex md:min-w-0 md:border-r md:border-slate-200"
      :class="mobileView === 'result' ? 'hidden md:flex' : 'flex w-full'"
    >
      <div class="px-6 py-5 border-b border-slate-200 surface-brand">
        <div class="flex items-center gap-2.5">
          <div
            class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center"
          >
            <PhotoIcon class="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <div class="text-base font-semibold text-slate-900">图片生成</div>
            <p class="mt-1 text-sm text-slate-500">
              每次提交都会在右侧追加新的图片任务卡片
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
                <span class="text-slate-500">(选填，最多 4 张)</span>
              </label>
              <div
                v-if="form.reference_images.length < 4"
                @click="openRefImageInput"
                @dragover.prevent
                @drop.prevent="onImageDrop"
                class="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer transition-all duration-200 group mb-2 bg-slate-50"
              >
                <input
                  ref="refImageInput"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="onImageSelect"
                />
                <ArrowUpTrayIcon
                  class="w-7 h-7 text-slate-400 mx-auto mb-2 group-hover:text-blue-600 transition-colors"
                />
                <p class="text-sm text-slate-600 group-hover:text-slate-700">
                  点击或拖拽上传参考图
                </p>
                <p class="text-xs text-slate-500 mt-1">
                  支持 JPG / PNG / WebP，单张最大 10MB
                </p>
              </div>

              <div
                v-if="form.reference_images.length > 0"
                class="grid grid-cols-4 gap-2"
              >
                <div
                  v-for="(img, index) in form.reference_images"
                  :key="index"
                  class="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                >
                  <div
                    v-if="img.uploading"
                    class="absolute inset-0 flex items-center justify-center bg-slate-100"
                  >
                    <span
                      class="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"
                    />
                  </div>
                  <img
                    v-else
                    :src="img.preview"
                    class="w-full h-full object-cover"
                  />
                  <button
                    v-if="!img.uploading"
                    @click="removeRefImage(index)"
                    class="absolute top-1 right-1 w-5 h-5 rounded-md bg-rose-500/80 flex items-center justify-center hover:bg-rose-500 transition-colors"
                  >
                    <XMarkIcon class="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>

              <div
                v-if="form.reference_images.length > 0"
                class="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200"
              >
                <ClockIcon class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <p class="text-xs text-amber-700">
                  上传的参考图将在
                  <span class="font-medium">30 分钟</span>
                  后失效，请尽快发起生成。
                </p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                提示词
                <span class="text-rose-500">*</span>
              </label>
              <textarea
                v-model="form.prompt"
                rows="5"
                placeholder="描述你想要生成的图片内容，越详细效果越好..."
                class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3.5 outline-none transition-all duration-200 text-base resize-none leading-relaxed"
              />
              <div class="mt-1.5 flex items-center justify-between">
                <span class="text-sm text-slate-500">{{ form.prompt.length }} 字符</span>
                <span
                  v-if="hasUploadingReferenceImages"
                  class="text-xs text-amber-600"
                >
                  参考图上传中，请稍候提交
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                AI 模型
              </label>
              <AdminSelect
                v-model="form.model"
                :options="imageModels"
                color="blue"
                fullWidth
              />
              <div
                v-if="selectedImageModel"
                class="mt-1.5 flex items-center justify-between text-xs text-slate-500"
              >
                <span>{{ selectedImageModel.desc }}</span>
                <span
                  v-if="selectedImageModel.pointsCost > 0"
                  class="text-amber-600 font-medium"
                >
                  {{ selectedImageModel.pointsCost }} 积分/次
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                画面比例
              </label>
              <AdminSelect
                v-model="form.aspectRatio"
                :options="aspectRatioSelectOptions"
                color="blue"
                fullWidth
              />
            </div>

            <div v-if="imageSizeOptions !== null">
              <label class="block text-sm font-medium text-slate-700 mb-2">
                图片大小
              </label>
              <div class="flex gap-2">
                <button
                  v-for="size in imageSizeOptions"
                  :key="size"
                  @click="form.imageSize = size"
                  class="flex-1 py-2.5 rounded-xl border font-medium transition-all duration-200"
                  :class="
                    form.imageSize === size
                      ? 'bg-blue-50 border-blue-500 text-blue-700 text-base'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 text-base'
                  "
                >
                  {{ size }}
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
                      ? 'bg-blue-50 border-blue-500 text-blue-700 text-base'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 text-base'
                  "
                >
                  {{ count }} 张
                </button>
              </div>
            </div>
          </div>

          <div class="p-5 md:p-6 border-t border-slate-200 bg-slate-50/70">
            <div class="flex items-center justify-between mb-3 text-sm">
              <span class="text-slate-600">预计消耗</span>
              <span class="text-amber-600 font-mono font-medium">
                {{ imageCost * form.count }} 积分
              </span>
            </div>
            <button
              @click="handleGenerate"
              :disabled="!canSubmitImage"
              class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-base transition-all duration-200 disabled:cursor-not-allowed"
              :class="
                canSubmitImage
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-200 text-slate-400 border border-slate-300'
              "
            >
              <span
                v-if="isSubmittingBatch"
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
              <SparklesIcon v-else class="w-5 h-5" />
              {{ isSubmittingBatch ? "正在提交图片任务..." : "生成新图片" }}
            </button>
            <p class="text-center text-sm text-slate-500 mt-2">
              当前余额 {{ userStore.points.toLocaleString() }} 积分
            </p>
          </div>
        </div>

        <Transition name="fade">
          <div
            v-if="showImageOperationOverlay"
            class="absolute inset-0 z-20 flex items-center justify-center bg-white/82 px-6 backdrop-blur-sm"
          >
            <div class="w-full max-w-sm rounded-[20px] border border-slate-200 bg-white/96 p-6 text-center shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-blue-50 text-blue-600">
                <SparklesIcon class="h-6 w-6" />
              </div>
              <p class="mt-4 text-lg font-semibold text-slate-900">
                当前还有 {{ imagePendingCount }} 个图片任务在生成
              </p>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                点击下方按钮后会重置左侧操作区，你可以继续填写新的提示词并追加下一批图片任务。
              </p>
              <button
                type="button"
                class="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                @click="prepareNextImageTask"
              >
                生成新图片
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
          class="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors"
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
        type="image"
        :tasks="imageTasks"
        empty-title="还没有生成内容"
        empty-description="填写左侧提示词并点击“生成新图片”，新的图片任务会持续追加到这里。"
        @preview="openLightbox"
        @retry="retryImageTask"
      />
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="lightboxImage"
          @click="lightboxImage = null"
          class="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div @click.stop class="relative max-w-4xl max-h-full">
            <img
              :src="lightboxImage"
              class="max-w-full max-h-[90vh] rounded-2xl object-contain"
            />
            <button
              @click="lightboxImage = null"
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  ArrowUpTrayIcon,
  ChevronLeftIcon,
  ClockIcon,
  PhotoIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import { generateImage, getGenerationResult } from "../api/generate.js";
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
  tasks: imageTasks,
  pendingCount: imagePendingCount,
  createTaskBatch,
  markTaskFailed,
  markTasksFailed,
  resolveTaskSuccess,
  startTaskPolling,
} = useGenerationTaskBoard({ getGenerationResult });

const refImageInput = ref(null);
const mobileView = ref("form");
const imageModels = ref([]);
const lightboxImage = ref(null);
const isSubmittingBatch = ref(false);
const isPreparingNextImageTask = ref(true);

const form = reactive({
  prompt: "",
  model: "",
  aspectRatio: "auto",
  imageSize: "1K",
  count: 1,
  reference_images: [],
});

const selectedImageModel = computed(() =>
  imageModels.value.find((model) => model.value === form.model),
);
const imageCost = computed(() => selectedImageModel.value?.pointsCost ?? 0);
const getImageModelCost = (modelName) =>
  imageModels.value.find((model) => model.value === modelName)?.pointsCost ??
  imageCost.value;
const currentModelCapabilities = computed(
  () => selectedImageModel.value?.capabilities || null,
);
const aspectRatioOptions = computed(
  () =>
    currentModelCapabilities.value?.aspectRatioOptions || [
      "auto",
      "1:1",
      "3:2",
      "2:3",
    ],
);
const aspectRatioSelectOptions = computed(() =>
  aspectRatioOptions.value.map((ratio) => ({ value: ratio, label: ratio })),
);
const imageSizeOptions = computed(
  () => currentModelCapabilities.value?.imageSizeOptions ?? null,
);
const hasUploadingReferenceImages = computed(() =>
  form.reference_images.some((image) => image.uploading),
);
const canSubmitImage = computed(
  () =>
    !!form.prompt.trim() &&
    !!form.model &&
    !isSubmittingBatch.value &&
    !hasUploadingReferenceImages.value &&
    userStore.points >= imageCost.value * form.count,
);
// 右侧仍在生成时，默认用蒙版收起左侧操作区，用户点击后再开启下一轮编辑。
const showImageOperationOverlay = computed(
  () => imagePendingCount.value > 0 && !isPreparingNextImageTask.value,
);

const resetImageOperationForm = () => {
  form.prompt = "";
  form.reference_images.splice(0, form.reference_images.length);
  if (refImageInput.value) refImageInput.value.value = "";
};

const prepareNextImageTask = () => {
  resetImageOperationForm();
  isPreparingNextImageTask.value = true;
  mobileView.value = "form";
};

const refreshPointsBalance = async () => {
  await userStore.fetchBalance();
};

const buildImagePayload = ({ count = form.count } = {}) => {
  const payload = {
    prompt: form.prompt.trim(),
    model: form.model,
    aspectRatio: form.aspectRatio,
    count,
  };
  if (form.imageSize !== null) payload.imageSize = form.imageSize;
  if (form.reference_images.length > 0) {
    payload.reference_images = form.reference_images
      .filter((image) => image.url)
      .map((image) => image.url);
  }
  return payload;
};

const buildRetryPayload = (task) => ({
  prompt: task.prompt,
  model: task.model,
  aspectRatio: task.aspectRatio,
  count: 1,
  imageSize: task.imageSize,
  reference_images: task.retryPayload?.reference_images || [],
});

const extractGenerationIds = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => item?.generation_id).filter(Boolean);
  }
  if (Array.isArray(data?.generation_ids)) return data.generation_ids.filter(Boolean);
  if (Array.isArray(data?.generations)) {
    return data.generations.map((item) => item?.generation_id).filter(Boolean);
  }
  if (data?.generation_id) return [data.generation_id];
  return [];
};

const normalizeImageItems = (data) => {
  if (Array.isArray(data?.results)) {
    return data.results
      .map((item) => ({
        resultUrl:
          (typeof item?.result_url === "string" && item.result_url) ||
          (typeof item?.url === "string" && item.url) ||
          "",
      }))
      .filter((item) => item.resultUrl);
  }

  if (typeof data?.result_url === "string" && data.result_url) {
    return [{ resultUrl: data.result_url }];
  }

  if (typeof data?.url === "string" && data.url) {
    return [{ resultUrl: data.url }];
  }

  return [];
};

const normalizeSingleImageResult = (data) => {
  const firstItem = normalizeImageItems(data)[0];
  if (!firstItem?.resultUrl) return null;
  return {
    resultUrl: firstItem.resultUrl,
    resultUrls: [firstItem.resultUrl],
  };
};

const openRefImageInput = () => {
  refImageInput.value?.click?.();
};

const onImageSelect = (event) => {
  const files = Array.from(event.target.files || []);
  files.forEach(processImageFile);
  if (refImageInput.value) refImageInput.value.value = "";
};

const onImageDrop = (event) => {
  const files = Array.from(event.dataTransfer.files || []);
  files.forEach(processImageFile);
};

const processImageFile = async (file) => {
  if (form.reference_images.length >= 4) {
    toast.error("最多上传 4 张参考图");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.error("图片不能超过 10MB");
    return;
  }

  const index = form.reference_images.length;
  form.reference_images.push({ url: null, preview: null, uploading: true });

  try {
    const result = await uploadTempImage(file);
    if (result.success && result.data?.url) {
      form.reference_images[index] = {
        url: result.data.url,
        preview: result.data.url,
        uploading: false,
      };
      return;
    }

    form.reference_images.splice(index, 1);
    toast.error(result.message || "上传失败");
  } catch (error) {
    form.reference_images.splice(index, 1);
    toast.error(error?.message || "上传失败");
  }
};

const removeRefImage = (index) => {
  form.reference_images.splice(index, 1);
};

const queueImageTasks = ({ payload, count }) =>
  createTaskBatch({
    type: "image",
    count,
    shared: {
      prompt: payload.prompt,
      model: payload.model,
      aspectRatio: payload.aspectRatio,
      imageSize: payload.imageSize ?? null,
      retryPayload: {
        ...payload,
        count: 1,
      },
    },
  });

const connectImageTasksToResponse = (createdTasks, submitData) => {
  const generationIds = extractGenerationIds(submitData);
  const immediateItems = normalizeImageItems(submitData);

  if (immediateItems.length > 0 && generationIds.length === 0) {
    createdTasks.forEach((task, index) => {
      const item = immediateItems[index];
      if (item?.resultUrl) {
        resolveTaskSuccess(
          task.id,
          { result_url: item.resultUrl },
          normalizeSingleImageResult,
        );
      } else {
        markTaskFailed(task.id, "本次未返回图片结果");
      }
    });
    return;
  }

  createdTasks.forEach((task, index) => {
    const generationId = generationIds[index];
    if (!generationId) {
      markTaskFailed(task.id, "任务回执不完整，请重试");
      return;
    }

    startTaskPolling(task.id, generationId, normalizeSingleImageResult, {
      onFailed: () => {
        refreshPointsBalance();
      },
    });
  });
};

const submitImageBatch = async (
  payload,
  count,
  successText = "图片任务已加入创作队列",
) => {
  const createdTasks = queueImageTasks({ payload, count });

  try {
    const submitResult = await generateImage(payload);
    if (!submitResult.success) {
      markTasksFailed(
        createdTasks.map((task) => task.id),
        submitResult.message || "任务提交失败",
      );
      toast.error(submitResult.message || "任务提交失败");
      await refreshPointsBalance();
      return false;
    }

    connectImageTasksToResponse(createdTasks, submitResult.data || {});
    toast.success(submitResult.message || successText);
    await refreshPointsBalance();
    return true;
  } catch (error) {
    markTasksFailed(
      createdTasks.map((task) => task.id),
      error?.message || "任务提交失败，请重试",
    );
    toast.error(error?.message || "任务提交失败，请重试");
    await refreshPointsBalance();
    return false;
  }
};

const handleGenerate = async () => {
  if (!form.prompt.trim()) {
    toast.error("请输入提示词");
    return;
  }
  if (hasUploadingReferenceImages.value) {
    toast.error("参考图上传中，请稍后再试");
    return;
  }
  if (userStore.points < imageCost.value * form.count) {
    toast.error("积分不足，请充值后再试");
    return;
  }

  const payload = buildImagePayload();
  isSubmittingBatch.value = true;
  isPreparingNextImageTask.value = false;
  mobileView.value = "result";

  try {
    await submitImageBatch(payload, form.count);
  } finally {
    isSubmittingBatch.value = false;
  }
};

const retryImageTask = async (task) => {
  const payload = buildRetryPayload(task);
  if (!payload.prompt || !payload.model) {
    toast.error("缺少重试所需的生成参数");
    return;
  }
  if (userStore.points < getImageModelCost(payload.model)) {
    toast.error("积分不足，请充值后再试");
    return;
  }

  mobileView.value = "result";
  await submitImageBatch(payload, 1, "已重新加入图片创作队列");
};

const openLightbox = (task) => {
  if (!task?.resultUrl) return;
  lightboxImage.value = task.resultUrl;
};

onMounted(async () => {
  try {
    const result = await getPublicAiModels("image");
    if (result.success && result.data?.models?.length) {
      imageModels.value = result.data.models.map((model) => ({
        value: model.model_name,
        label: model.name,
        desc: model.subtitle || "",
        pointsCost: model.points_cost ?? 0,
        capabilities: model.capabilities || null,
      }));
      form.model = imageModels.value[0].value;
      form.aspectRatio = aspectRatioOptions.value[0] || "auto";
      form.imageSize = imageSizeOptions.value ? imageSizeOptions.value[0] : null;
    }
  } catch {}
});

watch(
  () => form.model,
  () => {
    form.aspectRatio = aspectRatioOptions.value[0] || "auto";
    form.imageSize = imageSizeOptions.value ? imageSizeOptions.value[0] : null;
  },
);
</script>
