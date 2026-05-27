<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => auth.fetchProfile())

function roleColor(role?: string) {
  return role === 'admin' ? 'badge-accent' : 'badge-success'
}
</script>

<template>
  <div class="page-wrapper" data-cy="profile-page">
    <div class="page-header">
      <h1 class="page-title">My Profile</h1>
    </div>

    <div v-if="auth.loading" class="loading-state">
      <div class="spinner" />
      <span>Loading profile…</span>
    </div>

    <div v-else class="profile-layout">
      <!-- Avatar card -->
      <div class="card profile-avatar-card">
        <div class="big-avatar">{{ auth.user?.username?.[0]?.toUpperCase() || '?' }}</div>
        <h2 style="margin-top:1rem;font-size:1.2rem">{{ auth.user?.username }}</h2>
        <span :class="['badge', roleColor(auth.user?.role)]" style="margin-top:.5rem">{{ auth.user?.role }}</span>
      </div>

      <!-- Info card -->
      <div class="card profile-info-card">
        <h3 class="mb-2">Account Details</h3>
        <div class="info-row" data-cy="profile-username">
          <span class="info-label">Username</span>
          <span class="info-value">{{ auth.user?.username }}</span>
        </div>
        <div class="info-row" data-cy="profile-email">
          <span class="info-label">Email</span>
          <span class="info-value">{{ auth.user?.email }}</span>
        </div>
        <div class="info-row" data-cy="profile-role">
          <span class="info-label">Role</span>
          <span :class="['badge', roleColor(auth.user?.role)]">{{ auth.user?.role }}</span>
        </div>
        <div class="info-row" data-cy="profile-id">
          <span class="info-label">User ID</span>
          <code class="info-value" style="font-size:.78rem;color:var(--muted-2)">{{ auth.user?.id }}</code>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-layout { display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; }
@media (max-width: 640px) { .profile-layout { grid-template-columns: 1fr; } }

.profile-avatar-card { text-align: center; }
.big-avatar {
  width: 80px; height: 80px; margin: 0 auto;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 700; color: #fff;
}

.info-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: .85rem 0; border-bottom: 1px solid var(--border);
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: .8rem; font-weight: 600; color: var(--muted-2); text-transform: uppercase; letter-spacing: .04em; }
.info-value { color: var(--text); }
</style>
