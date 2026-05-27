<script setup lang="ts">
import { ref, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = inject<any>('toast')

const form = ref({ username: '', password: '' })
const errors = ref<Record<string, string>>({})

function validate() {
  errors.value = {}
  if (!form.value.username.trim()) errors.value.username = 'Username is required'
  if (!form.value.password)        errors.value.password = 'Password is required'
  return Object.keys(errors.value).length === 0
}

async function handleLogin() {
  if (!validate()) return
  const ok = await auth.login(form.value.username, form.value.password)
  if (ok) {
    toast?.value?.addToast('success', 'Welcome back!')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card" data-cy="login-form">
      <!-- Brand -->
      <div class="auth-brand">
        <div class="auth-logo">📦</div>
        <h1 class="auth-title">StockVault</h1>
        <p class="auth-subtitle">Sign in to your account</p>
      </div>

      <!-- Error -->
      <Transition name="slide-up">
        <div v-if="auth.error" class="alert alert-error mb-2" data-cy="login-error" role="alert">
          <span>⚠</span> {{ auth.error }}
        </div>
      </Transition>

      <!-- Form -->
      <form @submit.prevent="handleLogin" novalidate>
        <div class="form-group mb-2">
          <label class="form-label" for="login-username">Username</label>
          <input
            id="login-username"
            v-model="form.username"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': errors.username }"
            placeholder="Enter your username"
            autocomplete="username"
            data-cy="input-username"
            @input="auth.clearError()"
          />
          <p v-if="errors.username" class="form-error" data-cy="error-username">{{ errors.username }}</p>
        </div>

        <div class="form-group mb-3">
          <label class="form-label" for="login-password">Password</label>
          <input
            id="login-password"
            v-model="form.password"
            type="password"
            class="form-control"
            :class="{ 'is-invalid': errors.password }"
            placeholder="Enter your password"
            autocomplete="current-password"
            data-cy="input-password"
            @input="auth.clearError()"
          />
          <p v-if="errors.password" class="form-error" data-cy="error-password">{{ errors.password }}</p>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block btn-lg"
          :disabled="auth.loading"
          data-cy="btn-login"
        >
          <span v-if="auth.loading" class="btn-spinner" />
          {{ auth.loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <p class="auth-footer">
        Don't have an account?
        <RouterLink to="/register" data-cy="link-register">Create one</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: radial-gradient(ellipse at 60% 0%, rgba(99,102,241,.15) 0%, transparent 60%),
              radial-gradient(ellipse at 0% 80%, rgba(139,92,246,.1) 0%, transparent 50%),
              var(--bg);
}

.auth-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow);
}

.auth-brand { text-align: center; margin-bottom: 2rem; }
.auth-logo  { font-size: 3rem; margin-bottom: .5rem; }
.auth-title { font-size: 1.6rem; font-weight: 800; background: linear-gradient(135deg, var(--text), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.auth-subtitle { color: var(--muted-2); font-size: .9rem; margin-top: .25rem; }

.auth-footer { text-align: center; margin-top: 1.5rem; font-size: .875rem; color: var(--muted-2); }

.btn-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .6s linear infinite;
  display: inline-block;
}
</style>
