<template>
  <div class="flex h-screen overflow-hidden paper-shell text-slate-900">
    <aside
      class="hidden md:flex md:flex-shrink-0 md:flex-col m-4 mr-0 paper-panel overflow-hidden transition-all duration-300"
      :class="sidebarCollapsed ? 'w-20' : 'w-72'"
    >
      <div class="px-5 py-5 border-b border-slate-200">
        <div class="flex items-center gap-3">
          <div
            class="w-11 h-11 rounded-2xl surface-brand border border-blue-200 flex items-center justify-center overflow-hidden"
          >
            <img :src="logo" alt="logo" class="w-full h-full object-cover" />
          </div>
          <Transition name="fade">
            <div v-if="!sidebarCollapsed" class="min-w-0">
              <div
                class="text-[11px] uppercase tracking-[0.22em] text-slate-500"
              >
                Creative Studio
              </div>
              <div class="font-serif text-xl leading-tight text-slate-900">
                {{ APP_NAME }}
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div class="px-4 py-4 space-y-5 overflow-y-auto flex-1">
        <template
          v-for="item in navItems"
          :key="item.label + (item.to || 'action')"
        >
          <div
            v-if="item.type === 'label'"
            class="px-3 text-[11px] uppercase tracking-[0.18em] text-slate-500"
            :class="
              sidebarCollapsed ? 'pt-2 border-t border-slate-200' : 'pt-2'
            "
          >
            <span v-if="!sidebarCollapsed">{{ item.label }}</span>
          </div>

          <button
            v-else-if="item.action"
            type="button"
            @click="item.action"
            class="w-full flex items-center rounded-2xl text-left transition-all duration-200 border border-transparent hover:bg-slate-50 hover:border-slate-200"
            :class="
              sidebarCollapsed
                ? 'justify-center h-12 px-0 py-0'
                : 'gap-3 px-3.5 py-3'
            "
            :title="sidebarCollapsed ? item.label : ''"
          >
            <component
              :is="item.icon"
              class="w-5 h-5 text-slate-500 flex-shrink-0"
            />
            <Transition name="fade">
              <span
                v-if="!sidebarCollapsed"
                class="text-[15px] text-slate-700"
                >{{ item.label }}</span
              >
            </Transition>
          </button>

          <RouterLink
            v-else
            :to="item.to"
            class="w-full flex items-center rounded-2xl border transition-all duration-200"
            :class="[
              sidebarCollapsed
                ? 'justify-center h-12 px-0 py-0'
                : 'gap-3 px-3.5 py-3',
              isActiveRoute(item.to)
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                : 'border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200',
            ]"
            :title="sidebarCollapsed ? item.label : ''"
          >
            <component
              :is="item.icon"
              class="w-5 h-5 flex-shrink-0"
              :class="
                isActiveRoute(item.to) ? 'text-blue-700' : 'text-slate-500'
              "
            />
            <Transition name="fade">
              <span v-if="!sidebarCollapsed" class="text-[15px]">{{
                item.label
              }}</span>
            </Transition>
          </RouterLink>
        </template>
      </div>

      <div class="p-4 border-t border-slate-200 space-y-3">
        <div
          v-if="!sidebarCollapsed"
          class="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5"
        >
          <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Balance
          </div>
          <div class="mt-2 flex items-end justify-between gap-3">
            <div class="font-mono text-2xl text-slate-900">
              {{ userStore.points.toLocaleString() }}
            </div>
            <button
              type="button"
              @click="showPointsModal = true"
              class="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              充值
            </button>
          </div>
        </div>

        <button
          type="button"
          @click="sidebarCollapsed = !sidebarCollapsed"
          class="w-full flex items-center rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          :class="
            sidebarCollapsed
              ? 'justify-center h-12 px-0 py-0'
              : 'gap-3 px-3.5 py-3'
          "
          :title="sidebarCollapsed ? '切换侧边栏' : ''"
        >
          <ChevronDoubleLeftIcon v-if="!sidebarCollapsed" class="w-5 h-5" />
          <ChevronDoubleRightIcon v-else class="w-5 h-5" />
          <span v-if="!sidebarCollapsed" class="text-sm">收起侧边栏</span>
        </button>
      </div>
    </aside>

    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <header class="m-4 mb-0 paper-panel px-4 md:px-6 py-4">
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0 flex items-center gap-3">
            <div
              class="md:hidden w-10 h-10 rounded-2xl surface-brand border border-blue-200 overflow-hidden"
            >
              <img :src="logo" alt="logo" class="w-full h-full object-cover" />
            </div>
            <div class="min-w-0">
              <div
                class="text-[11px] uppercase tracking-[0.18em] text-slate-500"
              >
                Workspace
              </div>
              <h1
                class="hidden md:block font-serif text-2xl md:text-[2rem] leading-tight truncate"
              >
                {{ currentPageTitle }}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-2 md:gap-3">
            <div
              class="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-slate-50 border border-slate-200"
            >
              <BoltIcon class="w-4 h-4 text-amber-600" />
              <span class="font-mono text-sm text-slate-900">{{
                userStore.points.toLocaleString()
              }}</span>
              <span class="text-xs text-slate-500">积分</span>
            </div>

            <button
              type="button"
              @click="showPointsModal = true"
              class="flex items-center gap-1.5 px-3.5 md:px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <PlusIcon class="w-4 h-4" />
              <span class="hidden sm:block">购买积分</span>
            </button>

            <button
              type="button"
              @click="showAnnouncementModal = true"
              class="relative w-10 h-10 rounded-full border border-slate-200 bg-slate-50 hover:bg-white transition-colors flex items-center justify-center"
            >
              <BellIcon class="w-5 h-5 text-slate-600" />
              <span
                v-if="hasUnreadAnnounce"
                class="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600"
              />
            </button>

            <div class="relative" ref="userMenuRef">
              <button
                type="button"
                @click="toggleUserMenu"
                class="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1.5 bg-white hover:bg-slate-50 transition-colors"
              >
                <div
                  class="w-8 h-8 rounded-full bg-slate-900 text-[#faf9f5] flex items-center justify-center text-sm font-semibold"
                >
                  {{ userInitial }}
                </div>
                <span
                  class="hidden sm:block max-w-[100px] truncate text-sm text-slate-700"
                >
                  {{ userStore.user?.nickname || userStore.user?.phone }}
                </span>
                <ChevronDownIcon
                  class="w-4 h-4 text-slate-500 transition-transform duration-200"
                  :class="{ 'rotate-180': userMenuOpen }"
                />
              </button>

              <Teleport to="body">
                <Transition name="slide-down">
                  <div
                    v-if="userMenuOpen"
                    :style="dropdownStyle"
                    class="fixed w-52 paper-panel z-[9999] overflow-hidden"
                  >
                    <RouterLink
                      to="/profile"
                      @click="userMenuOpen = false"
                      class="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <UserCircleIcon class="w-5 h-5 text-slate-500" />
                      个人中心
                    </RouterLink>
                    <div class="border-t border-slate-200" />
                    <button
                      type="button"
                      @click="handleLogout"
                      class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon class="w-5 h-5" />
                      退出登录
                    </button>
                  </div>
                </Transition>
              </Teleport>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-hidden">
        <div class="h-full mx-4 my-4 paper-panel overflow-hidden">
          <div
            class="h-full overflow-y-auto bg-dot-grid pb-28 md:pb-0"
            @scroll="handleMainScroll"
          >
            <RouterView />
          </div>
        </div>
      </main>
    </div>

    <nav
      class="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-transparent px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pointer-events-none"
    >
      <div class="flex items-stretch paper-panel px-2 py-2 pointer-events-auto">
        <RouterLink
          v-for="item in mobileNavItems"
          :key="item.to"
          :to="item.to"
          class="flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-colors"
          :class="
            isActiveRoute(item.to)
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600'
          "
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span class="text-[11px]">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <PointsPackageModal
      v-if="showPointsModal"
      @close="showPointsModal = false"
    />
    <AnnouncementModal
      v-if="showAnnouncementModal"
      @close="showAnnouncementModal = false"
    />

    <div
      v-if="showContactModal"
      class="fixed inset-0 z-[10000] bg-black/45 backdrop-blur-sm p-4 flex items-center justify-center"
      @click.self="closeContactModal"
    >
      <div class="paper-panel w-full max-w-sm md:max-w-lg p-6">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Contact
            </div>
            <h3 class="font-serif text-2xl leading-tight">联系我们</h3>
          </div>
          <button
            type="button"
            class="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center text-[0]"
            @click="closeContactModal"
            aria-label="关闭联系弹窗"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
        <p class="text-sm text-slate-600 leading-7">{{ contactDescription }}</p>
        <div
          class="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex justify-center"
        >
          <div
            class="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200"
          >
            <div>
              <a
                href="https://github.com/huangguohui2002/AIGC"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  block
                  max-w-full
                  text-sm
                  font-bold
                  font-mono
                  text-slate-900
                  break-all
                  leading-relaxed
                  hover:text-blue-600
                  hover:underline
                  transition-colors
                "
              >
                https://github.com/huangguohui2002/AIGC
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { RouterLink, RouterView, useRouter, useRoute } from "vue-router";
import {
  PhotoIcon,
  FilmIcon,
  GiftIcon,
  CreditCardIcon,
  UserCircleIcon,
  BellIcon,
  BoltIcon,
  PlusIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ClockIcon,
  PhoneIcon,
  BookOpenIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import contactQr from "@/assets/lx.png";
import logo from "@/assets/logo.jpg";
import { APP_NAME } from "@/config/app";
import { useUserStore } from "../../stores/userStore.js";
import { useConfigStore } from "../../stores/configStore.js";
import PointsPackageModal from "../PointsPackageModal.vue";
import AnnouncementModal from "../AnnouncementModal.vue";
import ToastNotification from "../ToastNotification.vue";

const userStore = useUserStore();
const configStore = useConfigStore();
const router = useRouter();
const route = useRoute();

const sidebarCollapsed = ref(false);
const showPointsModal = ref(false);
const showAnnouncementModal = ref(false);
const showContactModal = ref(false);
const userMenuOpen = ref(false);
const userMenuRef = ref(null);
const dropdownStyle = ref({});
const contactDescription =
  "请通过GitHub仓库联系我们，欢迎提交issue或pull request，我们会第一时间回复你！";

const openContactModal = () => {
  showContactModal.value = true;
};

const closeContactModal = () => {
  showContactModal.value = false;
};

const handleOpenContactModalEvent = () => {
  openContactModal();
};

const toggleUserMenu = () => {
  if (!userMenuOpen.value) {
    const rect = userMenuRef.value?.getBoundingClientRect();
    if (rect) {
      dropdownStyle.value = {
        top: `${rect.bottom + 8}px`,
        right: `${window.innerWidth - rect.right}px`,
      };
    }
  }
  userMenuOpen.value = !userMenuOpen.value;
};
const hasUnreadAnnounce = ref(true);

const navItems = [
  { type: "label", label: "创作中心" },
  { to: "/", label: "图片生成", icon: PhotoIcon },
  { to: "/video", label: "视频生成", icon: FilmIcon },
  { to: "/examples", label: "示例参考", icon: BookOpenIcon },
  { type: "label", label: "我的" },
  { to: "/records", label: "生成记录", icon: ClockIcon },
  { to: "/points", label: "积分明细", icon: CreditCardIcon },
  { to: "/invite", label: "邀请返利", icon: GiftIcon },
  { to: "/profile", label: "个人中心", icon: UserCircleIcon },
  { label: "联系我们", icon: PhoneIcon, action: openContactModal },
];

const mobileNavItems = [
  { to: "/", label: "生成", icon: PhotoIcon },
  { to: "/video", label: "视频", icon: FilmIcon },
  { to: "/examples", label: "示例", icon: BookOpenIcon },
  { to: "/records", label: "记录", icon: ClockIcon },
  { to: "/profile", label: "我的", icon: UserCircleIcon },
];

const pageTitleMap = {
  home: "图片生成",
  video: "视频生成",
  examples: "示例参考",
  records: "生成记录",
  points: "积分明细",
  invite: "邀请返利",
  profile: "个人中心",
};

const currentPageTitle = computed(() => pageTitleMap[route.name] || APP_NAME);

const userInitial = computed(() => {
  const u = userStore.user;
  if (!u) return "U";
  return (u.nickname || u.phone || "U").charAt(0).toUpperCase();
});

const isActiveRoute = (to) => {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
};

const handleMainScroll = () => {};

const handleClickOutside = (e) => {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    userMenuOpen.value = false;
  }
};

const handleLogout = () => {
  userStore.logout();
  router.push({ name: "login" });
};

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("open-contact-modal", handleOpenContactModalEvent);
  await Promise.all([
    userStore.fetchProfile(),
    userStore.fetchBalance(),
    configStore.fetchPackages(),
    configStore.fetchAnnouncements(),
    configStore.fetchConfigs(),
  ]);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("open-contact-modal", handleOpenContactModalEvent);
});
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
</style>
