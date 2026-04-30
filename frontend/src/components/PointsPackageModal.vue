<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        @click.self="$emit('close')"
        class="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      >
        <div class="paper-panel w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl animate-slide-up flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
            <div class="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-300 sm:hidden" />
            <div class="pt-2 sm:pt-0">
              <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Balance</div>
              <h2 class="font-serif text-2xl leading-tight text-slate-900">购买积分</h2>
              <p class="text-sm text-slate-500 mt-1">选择合适套餐并完成支付。</p>
            </div>
            <button
              @click="$emit('close')"
              class="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors flex-shrink-0"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-5 space-y-5">
            <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div v-for="i in 6" :key="i" class="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            </div>

            <div v-else-if="packages.length === 0" class="text-center py-8 text-slate-500 text-sm">
              暂无积分套餐
            </div>

            <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                v-for="pkg in packages"
                :key="pkg.id"
                @click="selectedPkg = pkg"
                class="relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 min-h-[116px] justify-center"
                :class="selectedPkg?.id === pkg.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'"
              >
                <div
                  v-if="pkg.bonus_rate > 0"
                  class="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm"
                >
                  +{{ pkg.bonus_rate }}%
                </div>

                <p class="text-xs text-slate-500 mb-1.5 truncate w-full text-center px-1">{{ pkg.name }}</p>
                <p
                  class="text-2xl font-bold font-mono leading-none"
                  :class="selectedPkg?.id === pkg.id ? 'text-blue-600' : 'text-slate-900'"
                >
                  {{ (pkg.points + pkg.bonus_points).toLocaleString() }}
                </p>
                <p class="text-[10px] text-slate-400 mt-0.5">积分</p>
                <p
                  class="mt-2.5 text-sm font-semibold"
                  :class="selectedPkg?.id === pkg.id ? 'text-blue-700' : 'text-slate-700'"
                >
                  ￥{{ Number(pkg.price).toFixed(2) }}
                </p>
              </button>
            </div>

            <div
              v-if="selectedPkg"
              class="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <div>
                <p class="text-xs text-slate-500">已选套餐</p>
                <p class="text-sm font-medium text-slate-900 mt-0.5">
                  {{ selectedPkg.name }} · {{ (selectedPkg.points + selectedPkg.bonus_points).toLocaleString() }} 积分
                </p>
              </div>
              <p class="text-lg font-bold text-slate-900">￥{{ Number(selectedPkg.price).toFixed(2) }}</p>
            </div>

            <div>
              <p class="text-sm font-medium text-slate-700 mb-2">支付方式</p>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="method in paymentMethods"
                  :key="method.value"
                  @click="selectedPayType = method.value"
                  type="button"
                  class="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-colors"
                  :class="selectedPayType === method.value
                    ? method.activeClass
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'"
                >
                  <img :src="method.icon" class="w-5 h-5" :alt="method.label" />
                  {{ method.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="flex-shrink-0 px-5 pb-6 pt-3 border-t border-slate-100">
            <button
              @click="handlePay"
              :disabled="!selectedPkg || paying"
              class="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-sm transition-all duration-200 disabled:cursor-not-allowed"
              :class="!selectedPkg || paying
                ? 'bg-slate-200 text-slate-400 border border-slate-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'"
            >
              <span v-if="paying" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {{ paying ? '创建订单中...' : `立即使用${selectedPayLabel}支付` }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import api from "../api/index.js";
import { useConfigStore } from "../stores/configStore.js";
import { useToast } from "../composables/useToast.js";
import alipay from "@/assets/alipay.png";
import wechat from "@/assets/wechat.png";

const emit = defineEmits(["close"]);
const configStore = useConfigStore();
const toast = useToast();

const packages = ref([]);
const selectedPkg = ref(null);
const selectedPayType = ref("alipay");
const paying = ref(false);
const loading = ref(false);

const paymentMethods = [
  {
    value: "alipay",
    label: "支付宝",
    icon: alipay,
    activeClass: "border-blue-500 bg-blue-50 text-slate-900",
  },
  {
    value: "wechat",
    label: "微信支付",
    icon: wechat,
    activeClass: "border-emerald-500 bg-emerald-50 text-slate-900",
  },
];

const selectedPayLabel = computed(() => {
  return paymentMethods.find((item) => item.value === selectedPayType.value)?.label || "支付宝";
});

const handlePay = async () => {
  if (!selectedPkg.value) return;

  paying.value = true;
  try {
    const res = await api.post("/api/pay/create-order", {
      package_id: selectedPkg.value.id,
      pay_type: selectedPayType.value,
    });

    if (res.success && res.data?.pay_url) {
      const openedWindow = window.open(res.data.pay_url, "_blank");
      if (!openedWindow) {
        window.location.href = res.data.pay_url;
      }
      emit("close");
      toast.success(`已跳转${selectedPayLabel.value}支付页面，完成支付后积分会自动到账。`);
      return;
    }

    toast.error(res.message || "创建订单失败");
  } catch (e) {
    toast.error(e?.message || "创建订单失败");
  } finally {
    paying.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await configStore.fetchPackages();
    packages.value = Array.isArray(configStore.packages) ? configStore.packages : [];
    if (packages.value.length > 0) {
      selectedPkg.value = packages.value[0];
    }
  } finally {
    loading.value = false;
  }
});
</script>
