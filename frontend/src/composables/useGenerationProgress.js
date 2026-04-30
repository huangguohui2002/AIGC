import { ref } from "vue";

export function useGenerationProgress(options = {}) {
  const startAt = options.startAt ?? 58;
  const maxPending = options.maxPending ?? 96;
  const pendingIntervalMs = options.pendingIntervalMs ?? 1600;
  const displayIntervalMs = options.displayIntervalMs ?? 40;
  const rollPulseMs = options.rollPulseMs ?? 180;

  const progress = ref(0);
  const isRolling = ref(false);

  let pendingTimer = null;
  let displayTimer = null;
  let rollTimer = null;
  let tickCount = 0;
  let targetProgress = 0;

  const clearPendingTimer = () => {
    clearInterval(pendingTimer);
    pendingTimer = null;
  };

  const clearDisplayTimer = () => {
    clearInterval(displayTimer);
    displayTimer = null;
  };

  const clearRollTimer = () => {
    clearTimeout(rollTimer);
    rollTimer = null;
  };

  const triggerRoll = () => {
    isRolling.value = false;
    clearRollTimer();

    requestAnimationFrame(() => {
      isRolling.value = true;
      rollTimer = setTimeout(() => {
        isRolling.value = false;
        rollTimer = null;
      }, rollPulseMs);
    });
  };

  const animateDisplayToTarget = () => {
    if (progress.value >= targetProgress) {
      clearDisplayTimer();
      return;
    }

    clearDisplayTimer();
    displayTimer = setInterval(() => {
      const diff = targetProgress - progress.value;
      if (diff <= 0) {
        clearDisplayTimer();
        return;
      }

      const step = diff >= 24 ? 4 : diff >= 12 ? 3 : diff >= 5 ? 2 : 1;
      progress.value = Math.min(targetProgress, progress.value + step);
      triggerRoll();

      if (progress.value >= targetProgress) {
        clearDisplayTimer();
      }
    }, displayIntervalMs);
  };

  const setTargetProgress = (nextProgress) => {
    const normalizedProgress = Math.max(0, Math.min(nextProgress, 100));
    if (normalizedProgress <= targetProgress) return;

    targetProgress = normalizedProgress;
    animateDisplayToTarget();
  };

  const tick = () => {
    if (targetProgress >= maxPending) return;

    tickCount += 1;

    let step = 1;
    if (targetProgress < 72) {
      step = 3;
    } else if (targetProgress < 84) {
      step = 2;
    } else if (targetProgress >= 92 && tickCount % 2 === 1) {
      step = 0;
    }

    if (step <= 0) return;
    setTargetProgress(Math.min(maxPending, targetProgress + step));
  };

  const start = () => {
    clearPendingTimer();
    clearDisplayTimer();
    clearRollTimer();
    tickCount = 0;
    targetProgress = 0;
    progress.value = 0;
    isRolling.value = false;
    setTargetProgress(startAt);
    pendingTimer = setInterval(tick, pendingIntervalMs);
  };

  const sync = (reportedProgress) => {
    if (!Number.isFinite(reportedProgress)) return;
    if (reportedProgress >= 100) {
      complete();
      return;
    }

    setTargetProgress(Math.min(maxPending, Math.floor(reportedProgress)));
  };

  const complete = () => {
    clearPendingTimer();
    tickCount = 0;
    setTargetProgress(100);
  };

  const reset = () => {
    clearPendingTimer();
    clearDisplayTimer();
    clearRollTimer();
    tickCount = 0;
    targetProgress = 0;
    progress.value = 0;
    isRolling.value = false;
  };

  return {
    progress,
    isRolling,
    start,
    sync,
    complete,
    reset,
  };
}
