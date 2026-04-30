<template>
  <div class="flex h-full bg-transparent">
    <!-- ============ Left Panel: Form (mobile: hidden when showing result) ============ -->
    <div
      class="relative flex-col bg-white border-slate-200 md:w-[640px] md:flex-shrink-0 md:border-r"
      :class="mobileView === 'result' ? 'hidden md:flex' : 'flex w-full'"
    >
      <div class="px-6 py-5 border-b border-slate-200 surface-brand">
        <div class="flex items-center gap-2.5">
          <div
            class="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center"
          >
            <PhotoIcon class="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <div class="text-base font-semibold text-slate-900">图片生成</div>
            <!-- <div class="text-sm text-slate-600">每次消耗 <span class="text-amber-600 font-mono">{{ imageCost }}</span> 积分</div> -->
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 md:p-7 space-y-6">
        <!-- Reference images (multi) -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >参考图 <span class="text-slate-500">(选填，最多 4 张)</span></label
          >
          <!-- Upload zone (only show when < 4 images) -->
          <div
            v-if="form.reference_images.length < 4"
            @click="refImageInput.click()"
            @dragover.prevent
            @drop.prevent="onImageDrop"
            class="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 group mb-2 bg-slate-50"
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
              支持 JPG / PNG / WebP，最大 10MB / 张
            </p>
          </div>
          <!-- Preview grid -->
          <div
            v-if="form.reference_images.length > 0"
            class="grid grid-cols-4 gap-2"
          >
            <div
              v-for="(img, i) in form.reference_images"
              :key="i"
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
                @click="removeRefImage(i)"
                class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-500/80 flex items-center justify-center hover:bg-rose-500 transition-colors"
              >
                <XMarkIcon class="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
          <!-- Expiry warning -->
          <div
            v-if="form.reference_images.length > 0"
            class="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200"
          >
            <ClockIcon class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <p class="text-xs text-amber-700">
              上传的图片将在
              <span class="font-medium">30 分钟</span>后失效，请及时生成
            </p>
          </div>
        </div>

        <!-- Prompt -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >提示词 <span class="text-rose-500">*</span></label
          >
          <textarea
            v-model="form.prompt"
            rows="5"
            placeholder="描述你想要生成的图片内容，越详细效果越好...&#10;&#10;例如：a futuristic city at night, neon lights, high quality, 8K"
            class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 rounded-2xl px-4 py-3.5 outline-none transition-all duration-200 text-base resize-none leading-relaxed"
          />
          <div class="mt-1.5 flex items-center justify-between">
            <span class="text-sm text-slate-500"
              >{{ form.prompt.length }} 字符</span
            >
            <!-- <button @click="translatePrompt" class="text-sm text-blue-600 hover:text-blue-700 transition-colors">AI 翻译优化 →</button> -->
          </div>
        </div>

        <!-- Model -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >AI 模型</label
          >
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
              >{{ selectedImageModel.pointsCost }} 积分/次</span
            >
          </div>
        </div>

        <!-- Aspect Ratio -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >画面比例</label
          >
          <AdminSelect
            v-model="form.aspectRatio"
            :options="aspectRatioSelectOptions"
            color="blue"
            fullWidth
          />
        </div>

        <!-- Image Size -->
        <div v-if="imageSizeOptions !== null">
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >图片大小</label
          >
          <div class="flex gap-2">
            <button
              v-for="size in imageSizeOptions"
              :key="size"
              @click="form.imageSize = size"
              class="flex-1 py-2.5 rounded-full border font-medium transition-all duration-200"
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

        <!-- Count -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >生成数量</label
          >
          <div class="flex gap-2">
            <button
              v-for="n in [1, 2, 4]"
              :key="n"
              @click="form.count = n"
              class="flex-1 py-2.5 rounded-full border font-medium transition-all duration-200"
              :class="
                form.count === n
                  ? 'bg-blue-50 border-blue-500 text-blue-700 text-base'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 text-base'
              "
            >
              {{ n }} 张
            </button>
          </div>
        </div>
      </div>

      <!-- Generate button -->
      <div class="p-6 border-t border-slate-200 bg-slate-50/70">
        <div class="flex items-center justify-between mb-3 text-sm">
          <span class="text-slate-600">预计消耗</span>
          <span class="text-amber-600 font-mono font-medium"
            >{{ imageCost * form.count }} 积分</span
          >
        </div>
        <button
          @click="handleGenerate"
          :disabled="generating || !form.prompt.trim()"
          class="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-base transition-all duration-200 disabled:cursor-not-allowed"
          :class="
            generating || !form.prompt.trim()
              ? 'bg-slate-200 text-slate-400 border border-slate-300'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
          "
        >
          <span
            v-if="generating"
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
          <SparklesIcon v-else class="w-5 h-5" />
          {{ generating ? `生成中 ${genProgress}%...` : "开始生成" }}
        </button>
        <p class="text-center text-sm text-slate-500 mt-2">
          当前余额 {{ userStore.points.toLocaleString() }} 积分
        </p>
      </div>

      <div
        v-if="generating"
        class="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-[2px] p-6"
      >
        <div
          class="w-full max-w-sm rounded-3xl border border-blue-100 bg-white px-6 py-7 text-center shadow-xl"
        >
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50"
          >
            <span
              class="h-5 w-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin"
            />
          </div>
          <p class="text-base font-semibold text-slate-900">正在生成图片</p>
          <p class="mt-3 text-sm font-medium text-blue-600">
            当前进度
            <span class="inline-flex min-w-[3.75rem] justify-center tabular-nums">
              <span
                class="inline-block"
                :class="genProgressRolling ? 'progress-roll-bump' : ''"
              >
                {{ genProgress }}%
              </span>
            </span>
          </p>
          <button
            @click="sendGenerationToBackground"
            class="mt-5 w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            后台处理
          </button>
        </div>
      </div>
    </div>

    <!-- ============ Right Panel: Results (mobile: hidden when showing form) ============ -->
    <div
      class="flex-1 flex-col overflow-hidden"
      :class="mobileView === 'form' ? 'hidden md:flex' : 'flex'"
    >
      <!-- Mobile: header with back button -->
      <div
        class="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0"
      >
        <button
          @click="mobileView = 'form'"
          class="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ChevronLeftIcon class="w-5 h-5" />
          <span class="text-sm font-medium whitespace-nowrap">重新设置</span>
        </button>
        <span class="text-sm font-semibold text-slate-900 whitespace-nowrap"
          >生成结果</span
        >
        <div class="w-16" />
      </div>
      <!-- Generation progress -->
      <Transition name="slide-up">
        <div
          v-if="generating"
          class="px-6 py-3 border-b border-slate-200 bg-blue-50"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0"
            />
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-blue-700">AI 正在创作中...</span>
                <span class="text-sm text-slate-600 font-mono"
                  >{{ genProgress }}%</span
                >
              </div>
              <div class="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-blue-600 rounded-full transition-all duration-1000"
                  :style="{ width: genProgress + '%' }"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Result content -->
      <div class="flex-1 overflow-y-auto p-6 md:p-8">
        <!-- Empty state -->
        <div
          v-if="results.length === 0 && !generating"
          class="h-full flex flex-col items-center justify-center text-center"
        >
          <div
            class="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4"
          >
            <PhotoIcon class="w-9 h-9 text-slate-400" />
          </div>
          <p class="text-base font-medium text-slate-900 mb-1">
            还没有生成结果
          </p>
          <p class="text-sm text-slate-600 max-w-xs">
            填写左侧提示词，点击「开始生成」即可创作你的 AI 图片
          </p>
        </div>

        <!-- Skeletons when generating -->
        <div
          v-if="generating && results.length === 0"
          class="grid gap-4"
          :class="gridCols"
        >
          <div
            v-for="i in form.count"
            :key="i"
            class="aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative"
          >
            <div
              class="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse"
            />
          </div>
        </div>

        <!-- Result images grid -->
        <div v-if="results.length > 0" class="space-y-6">
          <!-- Prompt display -->
          <div
            class="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200"
          >
            <SparklesIcon class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p class="text-base text-slate-700 leading-relaxed">
              {{ lastPrompt }}
            </p>
          </div>

          <div class="grid gap-4" :class="gridCols">
            <div
              v-for="(item, idx) in results"
              :key="idx"
              class="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-blue-400 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
              @click="openLightbox(item)"
            >
              <!-- Image with loading skeleton -->
              <div class="relative aspect-square bg-slate-100">
                <img
                  v-if="item.result_url"
                  :src="item.result_url"
                  :alt="`生成图片 ${idx + 1}`"
                  class="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  :class="resultImageStates[idx] ? 'opacity-100' : 'opacity-0'"
                  @load="resultImageStates[idx] = true"
                />
                <div
                  v-if="!resultImageStates[idx] && item.status !== 'failed'"
                  class="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse"
                />
              </div>
              <!-- Overlay -->
              <div
                class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3"
              >
                <div class="flex items-center gap-2">
                  <button
                    v-if="item.result_url && item.status !== 'failed'"
                    @click.stop="downloadImage(item.result_url, idx)"
                    class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 text-sm backdrop-blur-sm transition-colors"
                  >
                    <ArrowDownTrayIcon class="w-4 h-4" />
                    下载
                  </button>
                  <button
                    @click.stop="regenerate"
                    class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm backdrop-blur-sm transition-colors"
                  >
                    <ArrowPathIcon class="w-4 h-4" />
                    重新生成
                  </button>
                </div>
              </div>

              <!-- Status badge -->
              <div
                v-if="item.status === 'failed'"
                class="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm"
              >
                <div class="text-center">
                  <XCircleIcon class="w-8 h-8 text-rose-500 mx-auto mb-1" />
                  <p class="text-sm text-rose-600">生成失败</p>
                </div>
              </div>
            </div>
            <!-- close image loading wrapper -->
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import {
  PhotoIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
} from "@heroicons/vue/24/outline";
import { useUserStore } from "../stores/userStore.js";
import { generateImage, getGenerationResult } from "../api/generate.js";
import { useToast } from "../composables/useToast.js";
import { useGenerationProgress } from "../composables/useGenerationProgress.js";
import { getPublicAiModels } from "../api/config.js";
import { uploadTempImage } from "../api/upload.js";
import AdminSelect from "../components/admin/AdminSelect.vue";

const userStore = useUserStore();
const toast = useToast();
const {
  progress: genProgress,
  isRolling: genProgressRolling,
  start: startGenerationProgress,
  sync: syncGenerationProgress,
  complete: completeGenerationProgress,
  reset: resetGenerationProgress,
} = useGenerationProgress();

let pollingTimer = null;
let finishTimer = null;
let activeRunToken = 0;

onUnmounted(() => {
  activeRunToken += 1;
  clearInterval(pollingTimer);
  clearTimeout(finishTimer);
  resetGenerationProgress();
});

const selectedImageModel = computed(() =>
  imageModels.value.find((m) => m.value === form.model),
);
const imageCost = computed(() => selectedImageModel.value?.pointsCost ?? 0);
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
  aspectRatioOptions.value.map((r) => ({ value: r, label: r })),
);
const imageSizeOptions = computed(
  () => currentModelCapabilities.value?.imageSizeOptions ?? null,
);
const generating = ref(false);
const results = ref([]);
const resultImageStates = reactive({});
const lastPrompt = ref("");
const lightboxImage = ref(null);
const refImageInput = ref(null);
const mobileView = ref("form"); // 'form' | 'result'

const imageModels = ref([]);

const form = reactive({
  prompt: "",
  model: "",
  aspectRatio: "auto",
  imageSize: "1K",
  count: 1,
  reference_images: [], // [{ file, preview }]
});

onMounted(async () => {
  try {
    const res = await getPublicAiModels("image");
    if (res.success && res.data?.models?.length) {
      imageModels.value = res.data.models.map((m) => ({
        value: m.model_name,
        label: m.name,
        desc: m.subtitle || "",
        pointsCost: m.points_cost ?? 0,
        capabilities: m.capabilities || null,
      }));
      form.model = imageModels.value[0].value;
      form.aspectRatio = aspectRatioOptions.value[0] || "auto";
      form.imageSize = imageSizeOptions.value
        ? imageSizeOptions.value[0]
        : null;
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

const gridCols = computed(() => {
  const displayCount = generating.value
    ? form.count
    : Math.max(form.count, results.value.length || 0);
  if (displayCount === 1) return "grid-cols-1 max-w-lg mx-auto";
  if (displayCount <= 2) return "grid-cols-2";
  return "grid-cols-2 lg:grid-cols-4";
});

const onImageSelect = (e) => {
  const files = Array.from(e.target.files || []);
  files.forEach(processImageFile);
  if (refImageInput.value) refImageInput.value.value = "";
};

const onImageDrop = (e) => {
  const files = Array.from(e.dataTransfer.files || []);
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
  const idx = form.reference_images.length;
  form.reference_images.push({ url: null, preview: null, uploading: true });
  try {
    const res = await uploadTempImage(file);
    if (res.success && res.data?.url) {
      form.reference_images[idx] = {
        url: res.data.url,
        preview: res.data.url,
        uploading: false,
      };
    } else {
      form.reference_images.splice(idx, 1);
      toast.error(res.message || "上传失败");
    }
  } catch (e) {
    form.reference_images.splice(idx, 1);
    toast.error(e?.message || "上传失败");
  }
};

const removeRefImage = (index) => {
  form.reference_images.splice(index, 1);
};

const clearPollingTimer = () => {
  clearInterval(pollingTimer);
  pollingTimer = null;
};

const clearFinishTimer = () => {
  clearTimeout(finishTimer);
  finishTimer = null;
};

const clearGenerationTimers = () => {
  clearPollingTimer();
  clearFinishTimer();
};

const isRunActive = (runToken) => runToken === activeRunToken;

const resetOperationForm = () => {
  form.prompt = "";
  form.aspectRatio = aspectRatioOptions.value[0] || "auto";
  form.imageSize = imageSizeOptions.value ? imageSizeOptions.value[0] : null;
  form.count = 1;
  form.reference_images.splice(0, form.reference_images.length);
  if (refImageInput.value) refImageInput.value.value = "";
};

const stopForegroundGeneration = () => {
  generating.value = false;
  resetGenerationProgress();
};

const scheduleForegroundRelease = (runToken, { clearForm = false } = {}) => {
  clearFinishTimer();
  finishTimer = setTimeout(() => {
    if (!isRunActive(runToken)) return;
    stopForegroundGeneration();
    if (clearForm) resetOperationForm();
  }, 1000);
};

const sendGenerationToBackground = () => {
  activeRunToken += 1;
  clearGenerationTimers();
  stopForegroundGeneration();
  resetOperationForm();
  mobileView.value = "form";
  toast.info("已切换到后台处理，可继续发起新的图片生成");
};

const refreshPointsBalance = async () => {
  await userStore.fetchBalance();
};

const extractGenerationIds = (data) => {
  if (Array.isArray(data))
    return data.map((item) => item?.generation_id).filter(Boolean);
  if (Array.isArray(data?.generation_ids))
    return data.generation_ids.filter(Boolean);
  if (Array.isArray(data?.generations))
    return data.generations.map((item) => item?.generation_id).filter(Boolean);
  if (data?.generation_id) return [data.generation_id];
  return [];
};

const normalizeResultItems = (data) => {
  const items = Array.isArray(data?.results)
    ? data.results
        .map((item) => {
          const resultUrl =
            (typeof item?.result_url === "string" && item.result_url) ||
            (typeof item?.url === "string" && item.url) ||
            "";
          return resultUrl
            ? { status: item?.status || "success", result_url: resultUrl }
            : null;
        })
        .filter(Boolean)
    : [];

  if (items.length > 0) return items;
  if (typeof data?.result_url === "string" && data.result_url) {
    return [{ status: data?.status || "success", result_url: data.result_url }];
  }
  return [];
};

const handleGenerate = async () => {
  if (!form.prompt.trim()) {
    toast.error("请输入提示词");
    return;
  }
  // Pre-check for points. The final check is on the backend.
  if (userStore.points < imageCost.value * form.count) {
    toast.error("积分不足，请充值后再试");
    return;
  }

  const runToken = activeRunToken + 1;
  activeRunToken = runToken;
  mobileView.value = "result";
  generating.value = true;
  results.value = []; // Clear previous results for a new generation
  startGenerationProgress();
  lastPrompt.value = form.prompt;
  clearGenerationTimers(); // Ensure no old timers are running

  try {
    // Step 1: Submit task to the backend
    const payload = {
      prompt: form.prompt,
      model: form.model,
      aspectRatio: form.aspectRatio,
      count: form.count,
    };
    if (form.imageSize !== null) payload.imageSize = form.imageSize;
    if (form.reference_images.length > 0) {
      payload.reference_images = form.reference_images
        .filter((img) => img.url)
        .map((img) => img.url);
    }

    const submitRes = await generateImage(payload);
    if (!isRunActive(runToken)) return;

    // Handle submission failure
    if (!submitRes.success) {
      toast.error(submitRes.message || "任务提交失败");
      stopForegroundGeneration();
      await refreshPointsBalance();
      return;
    }

    const generationIds = extractGenerationIds(submitRes.data);
    if (generationIds.length === 0) {
      toast.error(submitRes.message || "任务提交失败");
      stopForegroundGeneration();
      await refreshPointsBalance();
      return;
    }

    // Handle submission success
    toast.success(submitRes.message || "任务已提交，开始生成...");
    const taskState = new Map(
      generationIds.map((id) => [
        id,
        { status: "pending", progress: 0, items: [] },
      ]),
    );
    let pollingInFlight = false;

    // Step 2: Poll for results
    const poll = async () => {
      if (!isRunActive(runToken) || pollingInFlight) return;

      pollingInFlight = true;
      try {
        const responses = await Promise.all(
          generationIds.map(async (id) => {
            const resultRes = await getGenerationResult({ id });
            return { id, resultRes };
          }),
        );
        if (!isRunActive(runToken)) return;

        for (const { id, resultRes } of responses) {
          if (!resultRes.success) {
            if (resultRes.code === "GENERATION_FAILED") {
              taskState.set(id, { status: "failed", progress: 100, items: [] });
              continue;
            }
            throw new Error(resultRes.message || "获取结果失败");
          }
          const data = resultRes.data || {};
          const status = data.status || "pending";
          const progress =
            typeof data.progress === "number"
              ? data.progress
              : status === "success"
                ? 100
                : 0;
          const items = status === "success" ? normalizeResultItems(data) : [];
          taskState.set(id, { status, progress, items });
        }

        const states = generationIds.map((id) => taskState.get(id));
        const progressValues = states.map((s) => {
          if (s.status === "success" || s.status === "failed") return 100;
          return Math.max(0, Math.min(s.progress || 0, 99));
        });
        const avgProgress =
          progressValues.length > 0
            ? Math.floor(
                progressValues.reduce((sum, p) => sum + p, 0) /
                  progressValues.length,
              )
            : 0;
        const allSettled = states.every(
          (s) => s.status === "success" || s.status === "failed",
        );

        if (!allSettled) {
          syncGenerationProgress(avgProgress);
          return;
        }

        clearPollingTimer();
        completeGenerationProgress();

        const mergedItems = [];
        states.forEach((s) => {
          if (s.status === "success") {
            const validItems = Array.isArray(s.items)
              ? s.items.filter((item) => item?.result_url)
              : [];
            if (validItems.length > 0) mergedItems.push(...validItems);
            else mergedItems.push({ status: "failed", result_url: "" });
          } else {
            mergedItems.push({ status: "failed", result_url: "" });
          }
        });

        if (mergedItems.length === 0) {
          throw new Error("生成成功，但未返回图片数据");
        }

        results.value = mergedItems;
        Object.keys(resultImageStates).forEach(
          (k) => delete resultImageStates[k],
        );
        await refreshPointsBalance();

        const successCount = mergedItems.filter(
          (item) => item.status !== "failed" && item.result_url,
        ).length;
        const failedCount = mergedItems.length - successCount;
        if (successCount > 0 && failedCount === 0) {
          toast.success("图片生成成功！");
        } else if (successCount > 0) {
          toast.warning(`已生成 ${successCount} 张，${failedCount} 张失败`);
        } else {
          toast.error("图片生成失败");
        }

        scheduleForegroundRelease(runToken, {
          clearForm: successCount > 0,
        });
      } catch (e) {
        if (!isRunActive(runToken)) return;
        clearPollingTimer();
        toast.error(e.message || "生成过程出错");
        stopForegroundGeneration();
        await refreshPointsBalance();
      } finally {
        pollingInFlight = false;
      }
    };

    pollingTimer = setInterval(poll, 3000);
    poll(); // Initial call
  } catch (e) {
    if (!isRunActive(runToken)) return;
    clearPollingTimer();
    toast.error(e?.message || "操作失败，请重试");
    stopForegroundGeneration();
    await refreshPointsBalance();
  }
};

const regenerate = () => handleGenerate();

const openLightbox = (item) => {
  if (item.status !== "failed" && item.result_url)
    lightboxImage.value = item.result_url;
};

const downloadImage = async (url, idx) => {
  try {
    if (!url) {
      toast.error("下载失败");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `aigc-image-${idx + 1}.jpg`;
    a.target = "_blank";
    a.click();
  } catch {
    toast.error("下载失败");
  }
};

const translatePrompt = () => {
  toast.info("AI 优化功能即将上线");
};
</script>

<style scoped>
.progress-roll-bump {
  animation: progress-roll-bump 0.18s ease-out;
  transform-origin: center bottom;
}

@keyframes progress-roll-bump {
  0% {
    transform: translateY(8px) scale(0.96);
    opacity: 0.65;
  }

  60% {
    transform: translateY(-2px) scale(1.06);
    opacity: 1;
  }

  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
</style>
