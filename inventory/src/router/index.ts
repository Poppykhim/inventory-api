import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    { path: '/login',    name: 'login',    component: () => import('@/views/LoginView.vue'),    meta: { public: true } },
    { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },

    // Protected routes
    { path: '/',          name: 'dashboard',  component: () => import('@/views/DashboardView.vue'),           meta: { requiresAuth: true } },
    { path: '/profile',   name: 'profile',    component: () => import('@/views/ProfileView.vue'),             meta: { requiresAuth: true } },
    { path: '/inventory', name: 'inventory',  component: () => import('@/views/inventory/InventoryView.vue'), meta: { requiresAuth: true } },
    { path: '/suppliers', name: 'suppliers',  component: () => import('@/views/suppliers/SuppliersView.vue'), meta: { requiresAuth: true } },

    // 404
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.public && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
