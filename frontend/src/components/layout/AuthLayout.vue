<template>
  <div class="min-h-screen paper-shell relative overflow-hidden">
    <div
      class="pointer-events-none absolute inset-0"
      style="
        background:
          radial-gradient(circle at 12% 14%, rgba(201, 100, 66, 0.12), transparent 28%),
          radial-gradient(circle at 88% 82%, rgba(94, 93, 89, 0.08), transparent 24%);
      "
    />

    <div class="relative min-h-screen grid lg:grid-cols-[1.1fr_0.9fr]">
      <section class="hidden lg:flex flex-col justify-between px-14 py-12">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-[1.2rem] surface-brand border border-blue-200 overflow-hidden">
            <img :src="logo" alt="logo" class="w-full h-full object-cover" />
          </div>
          <div>
            <div class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Creative Platform</div>
            <div class="font-serif text-2xl text-slate-900">{{ APP_NAME }}</div>
          </div>
        </div>

        <div class="max-w-xl space-y-8">
          <span class="section-eyebrow">AIGC Creative Studio</span>
          <div class="space-y-5">
            <h2 class="section-title">
              用更温暖的工作台，
              <br />
              让灵感更快落地。
            </h2>
            <p class="section-copy max-w-lg">
              面向图像与视频创作的 AI 平台，保留高效率的创作流程，同时让每一次输入、
              预览与结果呈现都更像一次经过编辑的创作体验。
            </p>
          </div>

          <div class="grid sm:grid-cols-3 gap-3">
            <div
              v-for="f in features"
              :key="f.label"
              class="paper-card px-4 py-4"
            >
              <component :is="f.icon" class="w-5 h-5 text-blue-600 mb-3" />
              <div class="text-sm text-slate-900">{{ f.label }}</div>
            </div>
          </div>
        </div>

        <div class="text-sm text-slate-500">© 2026 {{ APP_NAME }}. All rights reserved.</div>
      </section>

      <section class="flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div class="w-full max-w-[30rem] paper-panel p-6 sm:p-8 lg:p-10">
          <div class="lg:hidden flex items-center gap-3 mb-8">
            <div class="w-11 h-11 rounded-[1.1rem] surface-brand border border-blue-200 overflow-hidden">
              <img :src="logo" alt="logo" class="w-full h-full object-cover" />
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Creative Platform</div>
              <div class="font-serif text-xl text-slate-900">{{ APP_NAME }}</div>
            </div>
          </div>

          <slot />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { PhotoIcon, FilmIcon, BoltIcon } from "@heroicons/vue/24/outline";
import logo from "@/assets/logo.jpg";
import { APP_NAME } from "@/config/app";

const features = [
  { label: "极速生成图像", icon: BoltIcon },
  { label: "高质量图片创作", icon: PhotoIcon },
  { label: "流畅的视频生成", icon: FilmIcon },
];
</script>
