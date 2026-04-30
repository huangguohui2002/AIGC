<template>
  <Teleport to="body">
    <Transition name="captcha-fade">
      <div v-if="visible" class="captcha-overlay" @click.self="handleClose">
        <div class="captcha-modal" :class="{ 'captcha-modal--mobile': isMobile }">
          <!-- Header -->
          <div class="captcha-header">
            <span class="captcha-title">请完成安全验证</span>
            <button class="captcha-close" @click="handleClose" type="button">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Canvas area -->
          <div class="captcha-body">
            <div class="captcha-canvas-wrap" ref="canvasWrapRef">
              <canvas ref="bgCanvasRef" class="captcha-canvas" />
              <canvas ref="sliderCanvasRef" class="captcha-slider-piece" :style="sliderPieceStyle" />
              <!-- Loading indicator -->
              <div v-if="isLoading" class="captcha-loading">
                <span class="captcha-loading-spinner" />
              </div>
              <!-- Refresh button -->
              <button class="captcha-refresh" @click="refresh" type="button" title="刷新">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
              <!-- Status tip -->
              <Transition name="captcha-tip">
                <div v-if="tipState" class="captcha-tip" :class="`captcha-tip--${tipState}`">
                  {{ tipState === 'success' ? '验证成功' : '验证失败，请重试' }}
                </div>
              </Transition>
            </div>
          </div>

          <!-- Slider track -->
          <div class="captcha-slider-track" ref="trackRef">
            <div class="captcha-slider-fill" :style="{ width: sliderLeft + 'px' }" />
            <div
              class="captcha-slider-thumb"
              :style="{ left: sliderLeft + 'px' }"
              @mousedown.prevent="onDragStart"
              @touchstart.prevent="onDragStart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
            <span v-if="sliderLeft === 0 && !isLoading" class="captcha-slider-hint">向右拖动滑块完成拼图</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  tolerance: { type: Number, default: 5 },
})

const emit = defineEmits(['success', 'close'])

// Puzzle piece dimensions
const PIECE_W = 50
const PIECE_H = 50
const PIECE_R = 9
const CANVAS_W = 320
const CANVAS_H = 160

const bgCanvasRef = ref(null)
const sliderCanvasRef = ref(null)
const canvasWrapRef = ref(null)
const trackRef = ref(null)

const sliderLeft = ref(0)
const tipState = ref('') // '' | 'success' | 'fail'
const targetX = ref(0)
const pieceY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const isLoading = ref(false)

const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 640
})

// The slider piece canvas is positioned to align with the track thumb.
// We map sliderLeft (px on screen) to a canvas-space X offset for the piece.
const sliderPieceStyle = computed(() => {
  const wrap = canvasWrapRef.value
  if (!wrap) return { transform: 'translateX(0px)' }
  const displayW = wrap.clientWidth
  const scale = displayW / CANVAS_W
  // Map sliderLeft from track-space to canvas-display-space
  const track = trackRef.value
  if (!track) return { transform: 'translateX(0px)' }
  const trackUsable = track.clientWidth - 44
  const ratio = trackUsable > 0 ? sliderLeft.value / trackUsable : 0
  // The max canvas offset the piece can travel: from 0 to targetX
  const maxCanvasX = CANVAS_W - PIECE_W - PIECE_R * 2
  const canvasX = ratio * maxCanvasX
  const displayOffset = canvasX * scale
  return { transform: `translateX(${displayOffset}px)` }
})

// Draw puzzle piece path
function drawPiecePath(ctx, x, y) {
  const w = PIECE_W
  const h = PIECE_H
  const r = PIECE_R

  ctx.beginPath()
  ctx.moveTo(x, y)
  // Top side with tab
  ctx.lineTo(x + (w - 2 * r) / 2, y)
  ctx.arc(x + w / 2, y, r, Math.PI, 0, false)
  ctx.lineTo(x + w, y)
  // Right side with tab
  ctx.lineTo(x + w, y + (h - 2 * r) / 2)
  ctx.arc(x + w, y + h / 2, r, -Math.PI / 2, Math.PI / 2, false)
  ctx.lineTo(x + w, y + h)
  // Bottom side
  ctx.lineTo(x, y + h)
  // Left side
  ctx.lineTo(x, y)
  ctx.closePath()
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Generate a random background on canvas using gradients and shapes
function drawRandomBackground(ctx) {
  // Random gradient background
  const colors = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
    ['#fccb90', '#d57eeb'],
    ['#e0c3fc', '#8ec5fc'],
  ]
  const pair = colors[getRandomInt(0, colors.length - 1)]
  const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H)
  grad.addColorStop(0, pair[0])
  grad.addColorStop(1, pair[1])
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // Draw random shapes for texture
  for (let i = 0; i < 12; i++) {
    ctx.save()
    ctx.globalAlpha = 0.1 + Math.random() * 0.15
    ctx.fillStyle = `hsl(${getRandomInt(0, 360)}, 70%, 70%)`
    const cx = getRandomInt(0, CANVAS_W)
    const cy = getRandomInt(0, CANVAS_H)
    const size = getRandomInt(15, 60)
    if (Math.random() > 0.5) {
      ctx.beginPath()
      ctx.arc(cx, cy, size, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillRect(cx - size / 2, cy - size / 2, size, size)
    }
    ctx.restore()
  }

  // Add some lines
  for (let i = 0; i < 5; i++) {
    ctx.save()
    ctx.globalAlpha = 0.08
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = getRandomInt(1, 3)
    ctx.beginPath()
    ctx.moveTo(getRandomInt(0, CANVAS_W), getRandomInt(0, CANVAS_H))
    ctx.lineTo(getRandomInt(0, CANVAS_W), getRandomInt(0, CANVAS_H))
    ctx.stroke()
    ctx.restore()
  }
}

async function initCaptcha() {
  const bgCanvas = bgCanvasRef.value
  const sliderCanvas = sliderCanvasRef.value
  if (!bgCanvas || !sliderCanvas) return

  isLoading.value = true

  bgCanvas.width = CANVAS_W
  bgCanvas.height = CANVAS_H
  sliderCanvas.width = CANVAS_W
  sliderCanvas.height = CANVAS_H

  const bgCtx = bgCanvas.getContext('2d')
  const sliderCtx = sliderCanvas.getContext('2d')

  bgCtx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  sliderCtx.clearRect(0, 0, CANVAS_W, CANVAS_H)

  // Random target position for puzzle piece
  const x = getRandomInt(CANVAS_W * 0.35, CANVAS_W - PIECE_W - PIECE_R * 2 - 5)
  const y = getRandomInt(PIECE_R + 15, CANVAS_H - PIECE_H - 15)
  targetX.value = x
  pieceY.value = y

  // Draw generated background (no external images needed)
  drawRandomBackground(bgCtx)

  // Get image data for the piece area before we overlay the hole
  const pieceImageData = bgCtx.getImageData(0, 0, CANVAS_W, CANVAS_H)

  // Draw the hollow (darker area where the piece was)
  bgCtx.save()
  drawPiecePath(bgCtx, x, y)
  bgCtx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  bgCtx.fill()
  bgCtx.restore()

  // Draw border around the hole
  bgCtx.save()
  bgCtx.lineWidth = 1.5
  bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  drawPiecePath(bgCtx, x, y)
  bgCtx.stroke()
  bgCtx.restore()

  // Draw the slider piece: extract piece from original image
  // Create temp canvas with original image data
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = CANVAS_W
  tmpCanvas.height = CANVAS_H
  const tmpCtx = tmpCanvas.getContext('2d')
  tmpCtx.putImageData(pieceImageData, 0, 0)

  // Clip and draw the piece at position (0, y) on slider canvas
  // We draw the piece starting at x=0 so it aligns with the left
  sliderCtx.save()
  drawPiecePath(sliderCtx, 0, y)
  sliderCtx.clip()
  // Draw the source image shifted so that the puzzle area at (x,y) maps to (0,y)
  sliderCtx.drawImage(tmpCanvas, -x, 0)
  sliderCtx.restore()

  // Draw piece border
  sliderCtx.save()
  sliderCtx.lineWidth = 2
  sliderCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  sliderCtx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  sliderCtx.shadowBlur = 4
  drawPiecePath(sliderCtx, 0, y)
  sliderCtx.stroke()
  sliderCtx.restore()

  isLoading.value = false
}

function refresh() {
  sliderLeft.value = 0
  tipState.value = ''
  initCaptcha()
}

function getClientX(e) {
  return e.touches ? e.touches[0].clientX : e.clientX
}

function onDragStart(e) {
  if (tipState.value === 'success' || isLoading.value) return
  isDragging.value = true
  startX.value = getClientX(e) - sliderLeft.value
  tipState.value = ''

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDragMove, { passive: false })
  document.addEventListener('touchend', onDragEnd)
}

function onDragMove(e) {
  if (!isDragging.value) return
  e.preventDefault()
  const track = trackRef.value
  if (!track) return
  const trackWidth = track.clientWidth
  const maxLeft = trackWidth - 44
  let x = getClientX(e) - startX.value
  x = Math.max(0, Math.min(x, maxLeft))
  sliderLeft.value = x
}

function onDragEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
  verify()
}

function verify() {
  const track = trackRef.value
  const wrap = canvasWrapRef.value
  if (!track || !wrap) return
  const trackUsable = track.clientWidth - 44
  const ratio = trackUsable > 0 ? sliderLeft.value / trackUsable : 0
  const maxCanvasX = CANVAS_W - PIECE_W - PIECE_R * 2
  const canvasX = ratio * maxCanvasX

  if (Math.abs(canvasX - targetX.value) < props.tolerance) {
    tipState.value = 'success'
    setTimeout(() => {
      emit('success')
    }, 600)
  } else {
    tipState.value = 'fail'
    setTimeout(() => {
      sliderLeft.value = 0
      tipState.value = ''
      initCaptcha()
    }, 800)
  }
}

function handleClose() {
  emit('close')
}

function cleanup() {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(() => {
        sliderLeft.value = 0
        tipState.value = ''
        initCaptcha()
      })
    } else {
      cleanup()
    }
  }
)

onBeforeUnmount(cleanup)
</script>

<style scoped>
/* Overlay */
.captcha-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* Modal */
.captcha-modal {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  width: 360px;
  max-width: calc(100vw - 32px);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.captcha-modal--mobile {
  width: 100%;
  max-width: 340px;
}

/* Header */
.captcha-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.captcha-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.captcha-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.15s;
}
.captcha-close:hover {
  background: #f1f5f9;
  color: #475569;
}

/* Canvas body */
.captcha-body {
  padding: 12px 16px 8px;
}

.captcha-canvas-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
}

.captcha-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.captcha-slider-piece {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  will-change: transform;
}

/* Loading state */
.captcha-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
}
.captcha-loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Refresh button */
.captcha-refresh {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.captcha-refresh:hover {
  background: #fff;
  color: #1e293b;
  transform: rotate(90deg);
}

/* Status tip */
.captcha-tip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
}
.captcha-tip--success {
  background: rgba(16, 185, 129, 0.9);
}
.captcha-tip--fail {
  background: rgba(239, 68, 68, 0.9);
}

/* Slider track */
.captcha-slider-track {
  position: relative;
  height: 44px;
  margin: 8px 16px 16px;
  background: #f1f5f9;
  border-radius: 22px;
  border: 1px solid #e2e8f0;
}

.captcha-slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 22px;
  background: linear-gradient(90deg, #dbeafe, #bfdbfe);
  transition: none;
}

.captcha-slider-thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 40px;
  border-radius: 20px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: box-shadow 0.15s;
  touch-action: none;
}
.captcha-slider-thumb:hover {
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
}
.captcha-slider-thumb:active {
  cursor: grabbing;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.6);
}

.captcha-slider-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #94a3b8;
  pointer-events: none;
  letter-spacing: 1px;
}

/* Transitions */
.captcha-fade-enter-active {
  transition: opacity 0.2s ease;
}
.captcha-fade-leave-active {
  transition: opacity 0.15s ease;
}
.captcha-fade-enter-from,
.captcha-fade-leave-to {
  opacity: 0;
}

.captcha-tip-enter-active {
  transition: all 0.2s ease;
}
.captcha-tip-leave-active {
  transition: all 0.15s ease;
}
.captcha-tip-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.captcha-tip-leave-to {
  opacity: 0;
}
</style>
