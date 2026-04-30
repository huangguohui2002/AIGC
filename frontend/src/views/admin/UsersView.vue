<template>
  <div class="p-4 sm:p-6 space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
      <div class="flex items-center gap-3">
        <div class="relative flex-1 sm:flex-none">
          <MagnifyingGlassIcon
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
          <input
            v-model="search.phone"
            type="tel"
            placeholder="搜索手机号"
            maxlength="11"
            class="bg-white border border-slate-200 hover:border-slate-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg pl-9 pr-4 py-2 outline-none transition-all text-sm w-full sm:w-52"
          />
        </div>
        <AdminSelect
          v-model="search.status"
          :options="statusOptions"
          placeholder="全部状态"
        />
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <button
          @click="doSearch"
          class="flex-1 sm:flex-none px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          搜索
        </button>
        <button
          @click="openCreateModal"
          class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <PlusIcon class="w-4 h-4" />
          新增用户
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="h-24 sm:h-14 bg-slate-100 rounded-xl animate-pulse"
      />
    </div>

    <template v-else>
      <!-- Mobile cards -->
      <div class="sm:hidden space-y-3">
        <div
          v-if="users.length === 0"
          class="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm"
        >
          暂无用户数据
        </div>
        <div
          v-for="u in users"
          :key="u.id"
          class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="font-semibold text-slate-900">{{ u.phone }}</div>
              <div class="text-xs text-slate-400 mt-0.5">ID: {{ u.id }}</div>
            </div>
            <span
              class="px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0"
              :class="
                u.status === 'normal'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              "
            >
              {{ u.status === "normal" ? "正常" : "已封禁" }}
            </span>
          </div>
          <div
            class="grid grid-cols-3 gap-2 mb-3 bg-slate-50 rounded-lg px-3 py-2.5"
          >
            <div>
              <div class="text-xs text-slate-400 mb-0.5">当前积分</div>
              <div class="font-mono font-bold text-slate-900 text-sm">
                {{ u.points.toLocaleString() }}
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-400 mb-0.5">累计充值</div>
              <div class="font-mono font-bold text-emerald-600 text-sm">
                {{ u.total_recharged.toLocaleString() }}
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-400 mb-0.5">累计消费</div>
              <div class="font-mono font-bold text-amber-600 text-sm">
                {{ u.total_consumed.toLocaleString() }}
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs text-slate-400 whitespace-nowrap"
              >注册: {{ formatDate(u.createdAt) }}</span
            >
            <div class="flex flex-wrap justify-end gap-2">
              <button
                @click="openEditModal(u)"
                class="px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                编辑
              </button>
              <button
                @click="openPointsModal(u)"
                class="px-2.5 py-1 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap"
              >
                调整积分
              </button>
              <button
                @click="openToggleStatus(u)"
                class="px-2.5 py-1 text-xs rounded-lg border transition-colors whitespace-nowrap"
                :class="
                  u.status === 'normal'
                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                "
              >
                {{ u.status === "normal" ? "封禁" : "解禁" }}
              </button>
              <button
                @click="openDeleteConfirm(u)"
                class="px-2.5 py-1 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors whitespace-nowrap"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <div
        class="admin-table-shell hidden sm:block bg-white border border-slate-200 rounded-xl shadow-sm"
      >
        <div
          v-if="users.length === 0"
          class="py-16 text-center text-slate-400 text-sm"
        >
          暂无用户数据
        </div>
        <table v-else class="admin-table">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                用户
              </th>
              <th
                class="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                当前积分
              </th>
              <th
                class="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                累计充值
              </th>
              <th
                class="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                累计消费
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                状态
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                注册时间
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="u in users"
              :key="u.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-5 py-3.5">
                <div class="font-semibold text-sm text-slate-900">
                  {{ u.phone }}
                </div>
                <div class="text-xs text-slate-400 mt-0.5">ID: {{ u.id }}</div>
              </td>
              <td
                class="px-5 py-3.5 text-right font-mono text-sm font-bold text-slate-900"
              >
                {{ u.points.toLocaleString() }}
              </td>
              <td
                class="px-5 py-3.5 text-right font-mono text-sm font-semibold text-emerald-600"
              >
                {{ u.total_recharged.toLocaleString() }}
              </td>
              <td
                class="px-5 py-3.5 text-right font-mono text-sm font-semibold text-amber-600"
              >
                {{ u.total_consumed.toLocaleString() }}
              </td>
              <td class="px-5 py-3.5">
                <span
                  class="px-2.5 py-1 rounded-lg text-xs font-medium"
                  :class="
                    u.status === 'normal'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  "
                >
                  {{ u.status === "normal" ? "正常" : "已封禁" }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-xs text-slate-400">
                {{ formatDate(u.createdAt) }}
              </td>
              <td class="px-5 py-3.5">
                <div class="admin-actions">
                  <button
                    @click="openEditModal(u)"
                    class="px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap"
                  >
                    编辑
                  </button>
                  <button
                    @click="openPointsModal(u)"
                    class="px-2.5 py-1 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap"
                  >
                    调整积分
                  </button>
                  <button
                    @click="openToggleStatus(u)"
                    class="px-2.5 py-1 text-xs rounded-lg border transition-colors whitespace-nowrap"
                    :class="
                      u.status === 'normal'
                        ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    "
                  >
                    {{ u.status === "normal" ? "封禁" : "解禁" }}
                  </button>
                  <button
                    @click="openDeleteConfirm(u)"
                    class="px-2.5 py-1 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors whitespace-nowrap"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm"
      >
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <span class="whitespace-nowrap">每页</span>
          <AdminSelect
            v-model="pageSize"
            :options="pageSizeOptions"
            size="sm"
          />
          <span class="whitespace-nowrap"
            >共 <strong class="text-slate-900">{{ total }}</strong> 名用户</span
          >
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="prevPage"
            :disabled="page === 1"
            class="px-3 py-1.5 text-sm rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <span
            class="px-3 py-1.5 text-sm text-slate-600 bg-slate-50 rounded-lg border border-slate-200 min-w-[80px] text-center"
          >
            {{ page }} / {{ totalPages || 1 }}
          </span>
          <button
            @click="nextPage"
            :disabled="page >= totalPages"
            class="px-3 py-1.5 text-sm rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      </div>
    </template>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      :visible="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      :type="confirmState.type"
      :loading="confirmState.loading"
      @confirm="confirmState.onConfirm"
      @cancel="confirmState.show = false"
      @update:visible="confirmState.show = $event"
    />

    <!-- Create User Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="createModal.show"
          @click.self="createModal.show = false"
          class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            class="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl"
          >
            <h3 class="text-base font-bold text-slate-900">新增用户</h3>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5"
                >手机号 <span class="text-rose-500">*</span></label
              >
              <input
                v-model="createModal.phone"
                type="tel"
                maxlength="11"
                placeholder="11位手机号"
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5"
                >密码 <span class="text-rose-500">*</span></label
              >
              <input
                v-model="createModal.password"
                type="password"
                placeholder="至少6位密码"
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5"
                >昵称 <span class="text-slate-400">(选填)</span></label
              >
              <input
                v-model="createModal.nickname"
                type="text"
                placeholder="用户昵称"
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5"
                >初始积分 <span class="text-slate-400">(选填)</span></label
              >
              <input
                v-model.number="createModal.initial_points"
                type="number"
                min="0"
                placeholder="0"
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
              />
            </div>
            <div class="flex gap-3">
              <button
                @click="submitCreate"
                :disabled="createModal.saving"
                class="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {{ createModal.saving ? "创建中..." : "确认创建" }}
              </button>
              <button
                @click="createModal.show = false"
                class="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit User Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="editModal.show"
          @click.self="editModal.show = false"
          class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            class="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl"
          >
            <h3 class="text-base font-bold text-slate-900">编辑用户</h3>
            <p class="text-sm text-slate-500">
              手机号:
              <span class="font-semibold text-slate-900">{{
                editModal.user?.phone
              }}</span>
            </p>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5"
                >昵称 <span class="text-slate-400">(留空则清除)</span></label
              >
              <input
                v-model="editModal.nickname"
                type="text"
                placeholder="用户昵称"
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5"
                >新密码
                <span class="text-slate-400">(不修改请留空)</span></label
              >
              <input
                v-model="editModal.password"
                type="password"
                placeholder="至少6位，不填则不修改"
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
              />
            </div>
            <div class="flex gap-3">
              <button
                @click="submitEdit"
                :disabled="editModal.saving"
                class="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {{ editModal.saving ? "保存中..." : "保存修改" }}
              </button>
              <button
                @click="editModal.show = false"
                class="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Adjust Points Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="pointsModal.show"
          @click.self="pointsModal.show = false"
          class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            class="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl"
          >
            <h3 class="text-base font-bold text-slate-900">调整积分</h3>
            <p class="text-sm text-slate-600">
              用户:
              <span class="font-semibold text-slate-900">{{
                pointsModal.user?.phone
              }}</span>
            </p>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5"
                >积分变动（正数增加，负数扣除）</label
              >
              <input
                v-model.number="pointsModal.amount"
                type="number"
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5"
                >原因</label
              >
              <input
                v-model="pointsModal.description"
                type="text"
                placeholder="请输入调整原因"
                class="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 outline-none text-sm transition-all"
              />
            </div>
            <div class="flex gap-3">
              <button
                @click="submitAdjust"
                :disabled="pointsModal.saving"
                class="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {{ pointsModal.saving ? "提交中..." : "确认调整" }}
              </button>
              <button
                @click="pointsModal.show = false"
                class="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/vue/24/outline";
import {
  getUsers,
  createUser,
  adjustPoints,
  updateUserStatus,
  updateUser,
  deleteUser,
} from "../../api/admin.js";
import { useToast } from "../../composables/useToast.js";
import AdminSelect from "../../components/admin/AdminSelect.vue";
import ConfirmDialog from "../../components/ConfirmDialog.vue";

const toast = useToast();
const users = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const search = reactive({ phone: "", status: "" });

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "normal", label: "正常" },
  { value: "banned", label: "已封禁" },
];

const pageSizeOptions = [
  { value: 10, label: "10 条" },
  { value: 20, label: "20 条" },
  { value: 30, label: "30 条" },
  { value: 50, label: "50 条" },
];

const createModal = reactive({
  show: false,
  phone: "",
  password: "",
  nickname: "",
  initial_points: 0,
  saving: false,
});
const editModal = reactive({
  show: false,
  user: null,
  nickname: "",
  password: "",
  saving: false,
});
const pointsModal = reactive({
  show: false,
  user: null,
  amount: 0,
  description: "",
  saving: false,
});
const confirmState = reactive({
  show: false,
  title: "",
  message: "",
  confirmText: "确认",
  type: "danger",
  loading: false,
  onConfirm: () => {},
});

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1);

const formatDate = (d) => {
 return d ? new Date(d).toLocaleDateString("zh-CN") : "-";
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const params = { page: page.value, limit: pageSize.value };
    if (search.phone) params.phone = search.phone;
    if (search.status) params.status = search.status;
    const res = await getUsers(params);
    if (res.success) {
      users.value = res.data.list || [];
      total.value = res.data.total || 0;
    }
  } catch {
  } finally {
    loading.value = false;
  }
};

const doSearch = () => {
  page.value = 1;
  fetchUsers();
};

const openCreateModal = () => {
  Object.assign(createModal, {
    show: true,
    phone: "",
    password: "",
    nickname: "",
    initial_points: 0,
    saving: false,
  });
};

const submitCreate = async () => {
  if (!createModal.phone || createModal.phone.length !== 11) {
    toast.error("请输入11位手机号");
    return;
  }
  if (!createModal.password || createModal.password.length < 6) {
    toast.error("密码不少于6位");
    return;
  }
  createModal.saving = true;
  try {
    const payload = {
      phone: createModal.phone,
      password: createModal.password,
    };
    if (createModal.nickname) payload.nickname = createModal.nickname;
    if (createModal.initial_points > 0)
      payload.initial_points = createModal.initial_points;
    const res = await createUser(payload);
    if (res.success) {
      toast.success("用户创建成功");
      createModal.show = false;
      fetchUsers();
    } else toast.error(res.message || "创建失败");
  } catch (e) {
    toast.error(e?.message || "创建失败");
  } finally {
    createModal.saving = false;
  }
};

const openToggleStatus = (u) => {
  const isBan = u.status === "normal";
  Object.assign(confirmState, {
    show: true,
    title: isBan ? "确认封禁" : "确认解禁",
    message: isBan
      ? `确认封禁用户「${u.phone}」？封禁后该用户将无法登录和使用。`
      : `确认解禁用户「${u.phone}」？解禁后该用户可正常使用。`,
    confirmText: isBan ? "封禁" : "解禁",
    type: isBan ? "danger" : "info",
    loading: false,
    onConfirm: () => doToggleStatus(u),
  });
};

const doToggleStatus = async (u) => {
  const newStatus = u.status === "normal" ? "banned" : "normal";
  confirmState.loading = true;
  try {
    const res = await updateUserStatus(u.id, newStatus);
    if (res.success) {
      u.status = newStatus;
      toast.success("状态已更新");
      confirmState.show = false;
    } else toast.error(res.message);
  } catch (e) {
    toast.error(e?.message || "操作失败");
  } finally {
    confirmState.loading = false;
  }
};

const openDeleteConfirm = (u) => {
  Object.assign(confirmState, {
    show: true,
    title: "确认删除用户",
    message: `确认删除用户「${u.phone}」？该操作会同时删除该用户的订单、积分流水、生成记录、邀请记录等关联数据，且不可恢复。`,
    confirmText: "删除",
    type: "danger",
    loading: false,
    onConfirm: () => doDeleteUser(u),
  });
};

const doDeleteUser = async (u) => {
  confirmState.loading = true;
  try {
    const res = await deleteUser(u.id);
    if (res.success) {
      toast.success("用户已删除");
      confirmState.show = false;
      if (users.value.length === 1 && page.value > 1) page.value--;
      await fetchUsers();
    } else {
      toast.error(res.message || "删除失败");
    }
  } catch (e) {
    toast.error(e?.message || "删除失败");
  } finally {
    confirmState.loading = false;
  }
};

const openEditModal = (u) => {
  Object.assign(editModal, {
    show: true,
    user: u,
    nickname: u.nickname || "",
    password: "",
    saving: false,
  });
};

const submitEdit = async () => {
  if (!editModal.nickname && editModal.nickname !== "" && !editModal.password) {
    toast.error("请至少填写一项修改内容");
    return;
  }
  if (editModal.password && editModal.password.length < 6) {
    toast.error("密码不少于6位");
    return;
  }
  editModal.saving = true;
  try {
    const payload = { nickname: editModal.nickname || null };
    if (editModal.password) payload.password = editModal.password;
    const res = await updateUser(editModal.user.id, payload);
    if (res.success || res.code === 0) {
      toast.success("用户信息已更新");
      editModal.show = false;
      fetchUsers();
    } else toast.error(res.message || res.msg || "更新失败");
  } catch (e) {
    toast.error(e?.message || "更新失败");
  } finally {
    editModal.saving = false;
  }
};

const openPointsModal = (u) => {
  Object.assign(pointsModal, {
    show: true,
    user: u,
    amount: 0,
    description: "",
    saving: false,
  });
};

const submitAdjust = async () => {
  if (!pointsModal.amount || !pointsModal.description) {
    toast.error("请填写完整信息");
    return;
  }
  pointsModal.saving = true;
  try {
    const res = await adjustPoints(pointsModal.user.id, {
      amount: pointsModal.amount,
      description: pointsModal.description,
    });
    if (res.success) {
      toast.success("积分调整成功");
      pointsModal.show = false;
      fetchUsers();
    } else toast.error(res.message);
  } catch (e) {
    toast.error(e?.message || "调整失败");
  } finally {
    pointsModal.saving = false;
  }
};

const prevPage = () => {
  if (page.value > 1) {
    page.value--;
    fetchUsers();
  }
};
const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++;
    fetchUsers();
  }
};

watch(pageSize, () => {
  page.value = 1;
  fetchUsers();
});
onMounted(fetchUsers);
</script>
