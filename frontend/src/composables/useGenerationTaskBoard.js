import { computed, onUnmounted, ref } from "vue";

const clampProgress = (value) => {
  const normalized = Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.max(0, Math.min(normalized, 100));
};

const buildTaskId = (seed) => `task-${Date.now()}-${seed}`;
const buildBatchId = (seed) => `batch-${Date.now()}-${seed}`;

export function useGenerationTaskBoard({
  getGenerationResult,
  pollInterval = 3000,
} = {}) {
  const tasks = ref([]);
  const taskTimers = new Map();
  let taskSeed = 0;
  let batchSeed = 0;

  const hasTasks = computed(() => tasks.value.length > 0);
  const pendingCount = computed(
    () =>
      tasks.value.filter(
        (task) => task.status === "submitting" || task.status === "pending",
      ).length,
  );

  const getTaskIndex = (taskId) =>
    tasks.value.findIndex((task) => task.id === taskId);

  const getTask = (taskId) =>
    tasks.value.find((task) => task.id === taskId) || null;

  const updateTask = (taskId, patch) => {
    const index = getTaskIndex(taskId);
    if (index < 0) return null;

    const currentTask = tasks.value[index];
    const nextPatch = typeof patch === "function" ? patch(currentTask) : patch;
    if (!nextPatch) return currentTask;

    const nextTask = { ...currentTask, ...nextPatch };
    tasks.value.splice(index, 1, nextTask);
    return nextTask;
  };

  const clearTaskTimer = (taskId) => {
    const timer = taskTimers.get(taskId);
    if (timer) {
      clearInterval(timer);
      taskTimers.delete(taskId);
    }
  };

  const clearAllTaskTimers = () => {
    taskTimers.forEach((timer) => clearInterval(timer));
    taskTimers.clear();
  };

  const createTaskBatch = ({ type, count, shared = {} }) => {
    const batchId = buildBatchId(++batchSeed);
    const createdAt = Date.now();
    const nextTasks = Array.from({ length: count }, (_, index) => ({
      id: buildTaskId(++taskSeed),
      batchId,
      batchIndex: index,
      type,
      submitStatus: "submitting",
      status: "submitting",
      progress: 6,
      prompt: shared.prompt || "",
      model: shared.model || "",
      aspectRatio: shared.aspectRatio || "",
      imageSize: shared.imageSize ?? null,
      duration: shared.duration ?? null,
      generationId: null,
      resultUrl: "",
      resultUrls: [],
      errorMessage: "",
      createdAt,
      retryPayload: shared.retryPayload || null,
    }));

    tasks.value = [...nextTasks, ...tasks.value];
    return nextTasks;
  };

  const markTaskFailed = (taskId, message = "生成失败", hooks = {}, data) => {
    clearTaskTimer(taskId);
    const nextTask = updateTask(taskId, {
      submitStatus: "submitted",
      status: "failed",
      progress: 100,
      errorMessage: message,
    });
    hooks.onFailed?.(nextTask, message, data);
    return nextTask;
  };

  const markTasksFailed = (taskIds, message, hooks = {}) => {
    taskIds.forEach((taskId) => markTaskFailed(taskId, message, hooks));
  };

  const resolveTaskSuccess = (
    taskId,
    data,
    normalizeResult,
    hooks = {},
  ) => {
    const normalized = normalizeResult?.(data) || null;
    if (!normalized?.resultUrl) {
      return markTaskFailed(
        taskId,
        normalized?.errorMessage || "生成成功，但未返回可展示内容",
        hooks,
        data,
      );
    }

    clearTaskTimer(taskId);
    const nextTask = updateTask(taskId, {
      submitStatus: "submitted",
      status: "success",
      progress: 100,
      resultUrl: normalized.resultUrl,
      resultUrls: normalized.resultUrls || [normalized.resultUrl],
      errorMessage: "",
    });
    hooks.onSuccess?.(nextTask, data, normalized);
    return nextTask;
  };

  const startTaskPolling = (
    taskId,
    generationId,
    normalizeResult,
    hooks = {},
  ) => {
    clearTaskTimer(taskId);
    updateTask(taskId, {
      submitStatus: "submitted",
      status: "pending",
      generationId,
      progress: 12,
      errorMessage: "",
    });

    let pollingInFlight = false;

    const poll = async () => {
      if (pollingInFlight) return;
      if (!getTask(taskId)) {
        clearTaskTimer(taskId);
        return;
      }

      pollingInFlight = true;
      try {
        const resultRes = await getGenerationResult({ id: generationId });
        const currentTask = getTask(taskId);
        if (!currentTask) {
          clearTaskTimer(taskId);
          return;
        }

        if (!resultRes.success) {
          if (resultRes.code === "GENERATION_FAILED") {
            markTaskFailed(
              taskId,
              resultRes.message || "生成失败",
              hooks,
              resultRes.data,
            );
            return;
          }
          throw new Error(resultRes.message || "获取生成结果失败");
        }

        const data = resultRes.data || {};
        const inferredStatus =
          data.status ||
          (data.result_url || data.url || data.results ? "success" : "pending");

        if (inferredStatus === "success") {
          resolveTaskSuccess(taskId, data, normalizeResult, hooks);
          return;
        }

        if (inferredStatus === "failed") {
          markTaskFailed(
            taskId,
            data.error_message || resultRes.message || "生成失败",
            hooks,
            data,
          );
          return;
        }

        updateTask(taskId, {
          submitStatus: "submitted",
          status: "pending",
          progress: Math.min(clampProgress(data.progress), 99),
          errorMessage: "",
        });
      } catch (error) {
        markTaskFailed(
          taskId,
          error?.message || "生成过程出错",
          hooks,
          null,
        );
      } finally {
        pollingInFlight = false;
      }
    };

    taskTimers.set(taskId, setInterval(poll, pollInterval));
    poll();
  };

  onUnmounted(() => {
    clearAllTaskTimers();
  });

  return {
    tasks,
    hasTasks,
    pendingCount,
    getTask,
    createTaskBatch,
    updateTask,
    markTaskFailed,
    markTasksFailed,
    resolveTaskSuccess,
    startTaskPolling,
    clearAllTaskTimers,
  };
}
