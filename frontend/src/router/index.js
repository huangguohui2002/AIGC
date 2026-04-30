import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/userStore.js'

const routes = [
  // ======================== Auth Routes ========================
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('../views/auth/ResetPasswordView.vue'),
    meta: { requiresGuest: true },
  },

  // ======================== Main User Routes ========================
  {
    path: '/',
    component: () => import('../components/layout/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
      },
      {
        path: 'video',
        name: 'video',
        component: () => import('../views/VideoGenerateView.vue'),
      },
      {
        path: 'records',
        name: 'records',
        component: () => import('../views/RecordsView.vue'),
      },
      {
        path: 'points',
        name: 'points',
        component: () => import('../views/PointsView.vue'),
      },
      {
        path: 'invite',
        name: 'invite',
        component: () => import('../views/InviteView.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('../views/ProfileView.vue'),
      },
      {
        path: 'examples',
        name: 'examples',
        component: () => import('../views/ExamplesView.vue'),
      },
    ],
  },

  // ======================== Admin Routes ========================
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/admin/AdminLoginView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/admin',
    component: () => import('../components/layout/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: { name: 'admin-users' },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../views/admin/UsersView.vue'),
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('../views/admin/OrdersView.vue'),
      },
      {
        path: 'announcements',
        name: 'admin-announcements',
        component: () => import('../views/admin/AnnouncementsView.vue'),
      },
      {
        path: 'configs',
        name: 'admin-configs',
        component: () => import('../views/admin/ConfigsView.vue'),
      },
      {
        path: 'generations',
        name: 'admin-generations',
        component: () => import('../views/admin/GenerationsView.vue'),
      },
      {
        path: 'packages',
        name: 'admin-packages',
        component: () => import('../views/admin/PackagesView.vue'),
      },
      {
        path: 'ai-models',
        name: 'admin-ai-models',
        component: () => import('../views/admin/AiModelsView.vue'),
      },
      {
        path: 'examples',
        name: 'admin-examples',
        component: () => import('../views/admin/ExamplesView.vue'),
      },
    ],
  },

  // ======================== Fallback ========================
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// Navigation guard
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  let role = 'user'

  if (userStr) {
    try {
      role = JSON.parse(userStr).role || 'user'
    } catch {}
  }

  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }
  if (to.meta.requiresAdmin && (!token || role !== 'admin')) {
    return { name: 'admin-login' }
  }
  if (to.meta.requiresGuest && token) {
    return role === 'admin' ? { name: 'admin-users' } : { name: 'home' }
  }
})

export default router
