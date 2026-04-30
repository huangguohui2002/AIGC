<template>
  <div class="flex h-screen overflow-hidden paper-shell">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        @click="sidebarOpen = false"
        class="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
      />
    </Transition>

    <aside
      class="fixed md:static z-40 md:z-auto h-[calc(100%-2rem)] md:h-auto m-4 mr-0 w-72 md:w-64 paper-panel overflow-hidden flex flex-col transition-transform duration-300 ease-in-out"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'"
    >
      <div class="px-5 py-5 border-b border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl icon-surface flex items-center justify-center">
            <ShieldCheckIcon class="w-5 h-5" />
          </div>
          <div>
            <div class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Admin Console</div>
            <div class="font-serif text-xl text-slate-900">后台管理</div>
          </div>
        </div>
      </div>

      <nav class="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          @click="sidebarOpen = false"
          class="flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all duration-200"
          :class="
            route.path === item.to
              ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
              : 'border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200'
          "
        >
          <component
            :is="item.icon"
            class="w-5 h-5"
            :class="route.path === item.to ? 'text-blue-700' : 'text-slate-500'"
          />
          <span class="text-sm">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-slate-200">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border border-slate-200 text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
          退出登录
        </button>
      </div>
    </aside>

    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <header class="m-4 mb-0 paper-panel px-4 sm:px-6 py-4 flex-shrink-0">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <button
              @click="sidebarOpen = !sidebarOpen"
              class="md:hidden w-10 h-10 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600"
              aria-label="打开菜单"
            >
              <Bars3Icon class="w-5 h-5" />
            </button>
            <div class="min-w-0">
              <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Operations</div>
              <h1 class="font-serif text-2xl leading-tight truncate">{{ currentPageTitle }}</h1>
            </div>
          </div>
          <div class="text-sm text-slate-600">
            <span class="hidden sm:inline">管理员 </span>{{ adminUser }}
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-hidden">
        <div class="h-full m-4 paper-panel overflow-hidden">
          <div class="h-full overflow-y-auto bg-dot-grid">
            <RouterView />
          </div>
        </div>
      </main>
    </div>

    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import {
  ShieldCheckIcon,
  UsersIcon,
  ShoppingBagIcon,
  MegaphoneIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  FilmIcon,
  CubeTransparentIcon,
  CircleStackIcon,
  PhotoIcon,
} from "@heroicons/vue/24/outline";
import { useUserStore } from "../../stores/userStore.js";
import ToastNotification from "../ToastNotification.vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const sidebarOpen = ref(false);

const navItems = [
  { to: "/admin/users", label: "用户管理", icon: UsersIcon },
  { to: "/admin/orders", label: "订单管理", icon: ShoppingBagIcon },
  { to: "/admin/generations", label: "生成记录", icon: FilmIcon },
  { to: "/admin/packages", label: "套餐管理", icon: CubeTransparentIcon },
  { to: "/admin/ai-models", label: "AI 模型", icon: CircleStackIcon },
  { to: "/admin/examples", label: "示例管理", icon: PhotoIcon },
  { to: "/admin/announcements", label: "公告管理", icon: MegaphoneIcon },
  { to: "/admin/configs", label: "系统配置", icon: CogIcon },
];

const pageTitleMap = {
  "/admin/users": "用户管理",
  "/admin/orders": "订单管理",
  "/admin/generations": "生成记录",
  "/admin/packages": "套餐管理",
  "/admin/ai-models": "AI 模型管理",
  "/admin/examples": "示例管理",
  "/admin/announcements": "公告管理",
  "/admin/configs": "系统配置",
};

const currentPageTitle = computed(() => pageTitleMap[route.path] || "后台管理");
const adminUser = computed(() => userStore.user?.phone || "admin");

const handleLogout = () => {
  userStore.logout();
  router.push({ name: "admin-login" });
};
</script>
