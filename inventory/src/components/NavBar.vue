<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const navLinks = computed(() => [
  { name: 'dashboard',  label: 'Dashboard',  icon: '⊞', to: '/' },
  { name: 'inventory',  label: 'Inventory',  icon: '📦', to: '/inventory' },
  { name: 'suppliers',  label: 'Suppliers',  icon: '🏭', to: '/suppliers' },
])

function logout() {
  auth.logout()
  router.push('/login')
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="navbar" data-cy="navbar">
    <!-- Logo -->
    <div class="nav-brand">
      <div class="brand-icon">📦</div>
      <span class="brand-name">StockVault</span>
    </div>

    <!-- Links -->
    <div class="nav-links">
      <RouterLink
        v-for="link in navLinks"
        :key="link.name"
        :to="link.to"
        :class="['nav-link', { active: isActive(link.to) }]"
        :data-cy="`nav-${link.name}`"
      >
        <span class="nav-icon">{{ link.icon }}</span>
        <span>{{ link.label }}</span>
      </RouterLink>
    </div>

    <!-- User area -->
    <div class="nav-user">
      <RouterLink to="/profile" class="user-chip" data-cy="nav-profile">
        <div class="avatar">{{ auth.user?.username?.[0]?.toUpperCase() || '?' }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.user?.username || 'User' }}</div>
          <div class="user-role">{{ auth.user?.role || '' }}</div>
        </div>
      </RouterLink>
      <button class="btn btn-ghost btn-sm logout-btn" @click="logout" data-cy="btn-logout">
        ⏏ Logout
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0 2rem;
  height: 64px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: .6rem;
  flex-shrink: 0;
}
.brand-icon { font-size: 1.4rem; }
.brand-name { font-size: 1.1rem; font-weight: 800; background: linear-gradient(135deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

.nav-links {
  display: flex;
  align-items: center;
  gap: .25rem;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .45rem .9rem;
  border-radius: var(--radius-sm);
  font-size: .875rem;
  font-weight: 500;
  color: var(--muted-2);
  text-decoration: none;
  transition: all var(--transition);
}
.nav-link:hover { background: var(--card); color: var(--text); }
.nav-link.active { background: rgba(99,102,241,.15); color: var(--accent); }
.nav-icon { font-size: 1rem; }

.nav-user {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-shrink: 0;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: .6rem;
  text-decoration: none;
  padding: .4rem .6rem;
  border-radius: var(--radius-sm);
  transition: background var(--transition);
}
.user-chip:hover { background: var(--card); }

.avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .85rem; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.user-info { line-height: 1.2; }
.user-name { font-size: .8rem; font-weight: 600; color: var(--text); }
.user-role { font-size: .7rem; color: var(--muted-2); text-transform: capitalize; }

.logout-btn { color: var(--muted-2); }
</style>
