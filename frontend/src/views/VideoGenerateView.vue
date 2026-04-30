<template>
  <div class="flex h-full bg-transparent">
    <!-- Left Form Panel (mobile: hidden when showing result) -->
    <div
      class="relative flex-col bg-white border-slate-200 md:w-[640px] md:flex-shrink-0 md:border-r"
      :class="mobileView === 'result' ? 'hidden md:flex' : 'flex w-full'"
    >
      <div class="px-6 py-5 border-b border-slate-200 surface-brand">
        <div class="flex items-center gap-2.5">
          <div
            class="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center"
          >
            <FilmIcon class="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div>
            <div class="text-base font-semibold text-slate-900">视频生成</div>
            <!-- <div class="text-sm text-slate-600">每次消耗 <span class="text-amber-600 font-mono">{{ videoCost }}</span> 积分</div> -->
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 md:p-7 space-y-6">
        <!-- Reference images (multi) -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >参考图
            <span class="text-slate-500">(图生视频，最多 4 张)</span></label
          >
          <div
            v-if="previews.length < 4"
            @click="refImageInput.click()"
            @dragover.prevent
            @drop.prevent="onDrop"
            class="border-2 border-dashed border-slate-300 hover:border-violet-400 rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 group mb-2 bg-slate-50"
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
              支持 JPG / PNG / WebP，最大 10MB / 张
            </p>
          </div>
          <!-- Preview grid -->
          <div v-if="previews.length > 0" class="grid grid-cols-4 gap-2">
            <div
              v-for="(item, i) in previews"
              :key="i"
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
              <img v-else :src="item.url" class="w-full h-full object-cover" />
              <button
                v-if="!item.uploading"
                @click="removeImage(i)"
                class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-500/80 flex items-center justify-center hover:bg-rose-500 transition-colors"
              >
                <XMarkIcon class="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
          <!-- Expiry warning -->
          <div
            v-if="previews.length > 0"
            class="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200"
          >
            <ClockIcon class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <p class="text-xs text-amber-700">
              上传的图片将在
              <span class="font-medium">30 分钟</span>后失效，请及时生成
            </p>
          </div>
          <p class="text-xs text-slate-500 mt-1.5">
            上传参考图可生成「图生视频」效果，否则为「文生视频」
          </p>
        </div>

        <!-- Prompt -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >提示词 <span class="text-rose-500">*</span></label
          >
          <textarea
            v-model="form.prompt"
            rows="5"
            placeholder="描述视频内容，包括场景、动作、风格...&#10;&#10;例如：a cat playing with a ball of yarn, 4K, cinematic"
            class="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-violet-500 text-slate-900 placeholder-slate-400 rounded-2xl px-4 py-3.5 outline-none transition-all text-base resize-none leading-relaxed"
          />
        </div>
        <!-- Model -->
        <div v-if="videoModels.length > 0">
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >AI 模型</label
          >
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
              >{{ selectedVideoModel.pointsCost }} 积分/次</span
            >
          </div>
        </div>

        <!-- Aspect Ratio -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >视频比例</label
          >
          <AdminSelect
            v-model="form.aspectRatio"
            :options="aspectRatioSelectOptions"
            color="violet"
            fullWidth
          />
        </div>

        <!-- Duration -->
        <div v-if="durationOptions !== null">
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >视频时长</label
          >
          <div class="flex gap-2">
            <button
              v-for="d in durationOptions"
              :key="d"
              @click="form.duration = d"
              class="flex-1 py-2.5 rounded-full border text-sm font-medium transition-all duration-200"
              :class="
                form.duration === d
                  ? 'bg-violet-50 border-violet-500 text-violet-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
              "
            >
              {{ d }}s
            </button>
          </div>
        </div>

        <!-- Duration hint -->
        <div class="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <div class="flex items-center gap-2 mb-1.5">
            <ClockIcon class="w-4 h-4 text-amber-600" />
            <span class="text-sm font-medium text-amber-700">生成时间较长</span>
          </div>
          <p class="text-sm text-amber-700/80 leading-relaxed">
            视频生成通常需要 60-90 秒，请耐心等待。生成完成前请勿关闭页面。
          </p>
        </div>
      </div>

      <div class="p-6 border-t border-slate-200 bg-slate-50/70">
        <div class="flex items-center justify-between mb-3 text-sm">
          <span class="text-slate-600">消耗积分</span>
          <span class="text-amber-600 font-mono font-medium"
            >{{ videoCost }} 积分</span
          >
        </div>
        <button
          @click="handleGenerate"
          :disabled="generating || !form.prompt.trim()"
          class="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-base transition-all duration-200 disabled:cursor-not-allowed"
          :class="
            generating || !form.prompt.trim()
              ? 'bg-slate-200 text-slate-400 border border-slate-300'
              : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-xl'
          "
        >
          <span
            v-if="generating"
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
          <FilmIcon v-else class="w-4 h-4" />
          {{ generating ? `生成中 ${progress}%...` : "开始生成视频" }}
        </button>
      </div>

      <div
        v-if="generating"
        class="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-[2px] p-6"
      >
        <div
          class="w-full max-w-sm rounded-3xl border border-violet-100 bg-white px-6 py-7 text-center shadow-xl"
        >
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50"
          >
            <span
              class="h-5 w-5 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin"
            />
          </div>
          <p class="text-base font-semibold text-slate-900">正在生成视频</p>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">
            当前操作区域已锁定，避免重复提交或修改参数。
          </p>
          <p class="mt-3 text-sm font-medium text-violet-600">
            当前进度 {{ progress }}%
          </p>
          <button
            @click="sendGenerationToBackground"
            class="mt-5 w-full rounded-full bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            后台处理
          </button>
          <p class="mt-2 text-xs leading-relaxed text-slate-400">
            切换后会停止当前页面轮询并清空操作区，你可以继续新的视频生成。
          </p>
        </div>
      </div>
    </div>

    <!-- Right: Result (mobile: hidden when showing form) -->
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
          class="flex items-center gap-1.5 text-violet-600 hover:text-violet-700 transition-colors"
        >
          <ChevronLeftIcon class="w-5 h-5" />
          <span class="text-sm font-medium whitespace-nowrap">重新设置</span>
        </button>
        <span class="text-sm font-semibold text-slate-900 whitespace-nowrap"
          >生成结果</span
        >
        <div class="w-16" />
      </div>
      <!-- Progress bar -->
      <Transition name="slide-up">
        <div
          v-if="generating"
          class="px-6 py-3 border-b border-slate-200 bg-violet-50"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin flex-shrink-0"
            />
            <div class="flex-1">
              <div class="flex justify-between mb-1">
                <span class="text-sm text-violet-700">AI 正在生成视频...</span>
                <span class="text-sm text-slate-600 font-mono"
                  >{{ progress }}%</span
                >
              </div>
              <div class="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-violet-600 rounded-full transition-all duration-1000"
                  :style="{ width: progress + '%' }"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <div class="flex-1 overflow-y-auto p-6 md:p-8">
        <!-- Empty -->
        <div
          v-if="!result && !generating"
          class="h-full flex flex-col items-center justify-center text-center"
        >
          <div
            class="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4"
          >
            <FilmIcon class="w-9 h-9 text-slate-400" />
          </div>
          <p class="text-base font-medium text-slate-900 mb-1">
            还没有生成视频
          </p>
          <p class="text-sm text-slate-500 max-w-xs">
            填写提示词，点击「开始生成视频」等待 AI 创作
          </p>
        </div>

        <!-- Video result -->
        <div v-if="result" class="max-w-2xl mx-auto space-y-4">
          <div
            class="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200"
          >
            <FilmIcon class="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
            <p class="text-sm text-slate-700">{{ lastPrompt }}</p>
          </div>

          <div
            class="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative min-h-[200px]"
          >
            <div
              v-if="!videoLoaded"
              class="absolute inset-0 flex items-center justify-center bg-slate-100"
            >
              <span
                class="w-8 h-8 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin"
              />
            </div>
            <video
              v-if="result.result_url"
              :src="result.result_url"
              controls
              class="w-full transition-opacity duration-300"
              :class="videoLoaded ? 'opacity-100' : 'opacity-0'"
              @loadeddata="videoLoaded = true"
            />
          </div>

          <div class="flex gap-3">
            <a
              :href="result.result_url"
              download
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 text-sm font-medium transition-colors"
            >
              <ArrowDownTrayIcon class="w-4 h-4" />
              下载视频
            </a>
            <button
              @click="handleGenerate"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-sm font-medium transition-colors"
            >
              <ArrowPathIcon class="w-4 h-4" />
              重新生成
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import {
  FilmIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClockIcon,
  ChevronLeftIcon,
} from "@heroicons/vue/24/outline";
import { generateVideo, getGenerationResult } from "../api/generate.js";
import { useUserStore } from "../stores/userStore.js";
import { useToast } from "../composables/useToast.js";
import { useGenerationProgress } from "../composables/useGenerationProgress.js";
import { getPublicAiModels } from "../api/config.js";
import { uploadTempImage } from "../api/upload.js";
import AdminSelect from "../components/admin/AdminSelect.vue";

const userStore = useUserStore();
const toast = useToast();
const {
  progress,
  start: startGenerationProgress,
  sync: syncGenerationProgress,
  complete: completeGenerationProgress,
  reset: resetGenerationProgress,
} = useGenerationProgress();

const selectedVideoModel = computed(() =>
  videoModels.value.find((m) => m.value === form.model),
);
const videoCost = computed(() => selectedVideoModel.value?.pointsCost ?? 0);
const currentModelCapabilities = computed(
  () => selectedVideoModel.value?.capabilities || null,
);
const aspectRatioOptions = computed(
  () => currentModelCapabilities.value?.aspectRatioOptions || ["16:9", "9:16"],
);
const aspectRatioSelectOptions = computed(() =>
  aspectRatioOptions.value.map((r) => ({ value: r, label: r })),
);
const durationOptions = computed(
  () => currentModelCapabilities.value?.durationOptions ?? null,
);
const generating = ref(false);
const result = ref(null);
const videoLoaded = ref(false);
const lastPrompt = ref("");
const previews = ref([]); // { url: string|null, uploading: boolean }[]
const refImageInput = ref(null);
const mobileView = ref("form"); // 'form' | 'result'
const videoModels = ref([]);
const form = reactive({
  prompt: "",
  model: "",
  aspectRatio: "16:9",
  duration: null,
});

onMounted(async () => {
  try {
    const res = await getPublicAiModels("video");
    if (res.success && res.data?.models?.length) {
      videoModels.value = res.data.models.map((m) => ({
        value: m.model_name,
        label: m.name,
        desc: m.subtitle || "",
        pointsCost: m.points_cost ?? 0,
        capabilities: m.capabilities || null,
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

const onSelect = (e) => {
  const files = Array.from(e.target.files || []);
  files.forEach(addImage);
  if (refImageInput.value) refImageInput.value.value = "";
};

const onDrop = (e) => {
  const files = Array.from(e.dataTransfer.files || []);
  files.forEach(addImage);
};

const addImage = async (file) => {
  if (previews.value.length >= 4) {
    toast.error("最多上传 4 张参考图");
    return;
  }
  const idx = previews.value.length;
  previews.value.push({ url: null, uploading: true });
  try {
    const res = await uploadTempImage(file);
    if (res.success && res.data?.url) {
      previews.value[idx] = { url: res.data.url, uploading: false };
    } else {
      previews.value.splice(idx, 1);
      toast.error(res.message || "上传失败");
    }
  } catch (e) {
    previews.value.splice(idx, 1);
    toast.error(e?.message || "上传失败");
  }
};

const removeImage = (index) => {
  previews.value.splice(index, 1);
};

let pollingTimer = null;
let finishTimer = null;
let activeRunToken = 0;

const clearPollingTimer = () => {
  clearInterval(pollingTimer);
  pollingTimer = null;
};

const clearFinishTimer = () => {
  clearTimeout(finishTimer);
  finishTimer = null;
};

const clearTimers = () => {
  clearPollingTimer();
  clearFinishTimer();
};

onUnmounted(() => {
  activeRunToken += 1;
  clearTimers();
  resetGenerationProgress();
});

const isRunActive = (runToken) => runToken === activeRunToken;

const resetOperationForm = () => {
  form.prompt = "";
  form.aspectRatio = aspectRatioOptions.value[0] || "16:9";
  form.duration = durationOptions.value ? durationOptions.value[0] : null;
  previews.value = [];
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
  clearTimers();
  stopForegroundGeneration();
  videoLoaded.value = false;
  resetOperationForm();
  mobileView.value = "form";
  toast.info("已切换到后台处理，可继续发起新的视频生成");
};

const refreshPointsBalance = async () => {
  await userStore.fetchBalance();
};

const handleGenerate = async () => {
  if (!form.prompt.trim()) {
    toast.error("请输入提示词");
    return;
  }
  if (userStore.points < videoCost.value) {
    toast.error("积分不足，请充值后再试");
    return;
  }

  const runToken = activeRunToken + 1;
  activeRunToken = runToken;
  mobileView.value = "result";
  generating.value = true;
  startGenerationProgress();
  result.value = null;
  videoLoaded.value = false;
  lastPrompt.value = form.prompt;
  clearTimers();

  try {
    const payload = { prompt: form.prompt };
    if (form.model) payload.model = form.model;
    if (form.aspectRatio) payload.aspectRatio = form.aspectRatio;
    if (form.duration !== null) payload.duration = form.duration;
    if (previews.value.length > 0)
      payload.reference_images = previews.value
        .filter((p) => p.url)
        .map((p) => p.url);

    const submitRes = await generateVideo(payload);
    if (!isRunActive(runToken)) return;
    if (!submitRes.success) {
      throw new Error(submitRes.message || "任务提交失败");
    }

    if (submitRes.data?.result_url && !submitRes.data?.generation_id) {
      clearPollingTimer();
      completeGenerationProgress();
      result.value = submitRes.data;
      await refreshPointsBalance();
      toast.success(submitRes.message || "视频生成成功！");
      scheduleForegroundRelease(runToken, { clearForm: true });
      return;
    }

    const generationId = submitRes.data?.generation_id;
    if (!generationId) {
      throw new Error(submitRes.message || "任务提交失败");
    }

    toast.success(submitRes.message || "任务已提交，开始生成...");

    const poll = async () => {
      try {
        const resultRes = await getGenerationResult({ id: generationId });
        if (!isRunActive(runToken)) return;
        if (!resultRes.success) {
          throw new Error(resultRes.message || "获取生成结果失败");
        }

        const {
          status,
          progress: taskProgress,
          result_url,
          results,
        } = resultRes.data || {};
        if (typeof taskProgress === "number") {
          syncGenerationProgress(taskProgress);
        }

        if (status === "success") {
          clearPollingTimer();
          completeGenerationProgress();

          const finalResult = resultRes.data?.result_url
            ? resultRes.data
            : Array.isArray(results) && results[0]?.result_url
              ? results[0]
              : result_url
                ? { result_url, status: "success" }
                : null;

          if (!finalResult?.result_url) {
            throw new Error("生成成功，但未返回视频地址");
          }

          result.value = finalResult;
          await refreshPointsBalance();
          toast.success("视频生成成功！");
          scheduleForegroundRelease(runToken, { clearForm: true });
        } else if (status === "failed") {
          clearPollingTimer();
          await refreshPointsBalance();
          throw new Error(resultRes.message || "任务生成失败");
        }
      } catch (e) {
        if (!isRunActive(runToken)) return;
        clearTimers();
        toast.error(e?.message || "生成过程失败");
        stopForegroundGeneration();
        await refreshPointsBalance();
      }
    };

    pollingTimer = setInterval(poll, 3000);
    poll();
  } catch (e) {
    if (!isRunActive(runToken)) return;
    clearTimers();
    toast.error(e?.message || "生成失败，请稍后重试");
    stopForegroundGeneration();
    await refreshPointsBalance();
  }
};
</script>
