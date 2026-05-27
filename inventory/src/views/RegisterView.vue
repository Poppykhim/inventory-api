<script setup lang="ts">
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const toast = inject<any>('toast')

const form = ref({ username: '', email: '', password: '', confirmPassword: '', role: 'user' as 'admin'|'user' })
const errors = ref<Record<string, string>>({})

function validate() {
  errors.value = {}
  if (!form.value.username.trim())      errors.value.username = 'Username is required'
  else if (form.value.username.length < 3) errors.value.username = 'Minimum 3 characters'
  if (!form.value.email.trim())         errors.value.email = 'Email is required'
  else if (!/\S+@\S+\.\S+/.test(form.value.email)) errors.value.email = 'Invalid email address'
  if (!form.value.password)             errors.value.password = 'Password is required'
  else if (form.value.password.length < 6) errors.value.password = 'Minimum 6 characters'
  if (form.value.confirmPassword !== form.value.password) errors.value.confirmPassword = 'Passwords do not match'
  return Object.keys(errors.value).length === 0
}

async function handleRegister() {
  if (!validate()) return
  const ok = await auth.register(form.value.username, form.value.email, form.value.password, form.value.role)
  if (ok) {
    toast?.value?.addToast('success', 'Account created! Welcome.')
    router.push('/')
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card" data-cy="register-form">
      <div class="auth-brand">
        <div class="auth-logo">📦</div>
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Join StockVault today</p>
      </div>

      <Transition name="slide-up">
        <div v-if="auth.error" class="alert alert-error mb-2" data-cy="register-error" role="alert">
          <span>⚠</span> {{ auth.error }}
        </div>
      </Transition>

      <form @submit.prevent="handleRegister" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="reg-username">Username</label>
            <input id="reg-username" v-model="form.username" type="text" class="form-control" :class="{'is-invalid':errors.username}" placeholder="johndoe" data-cy="input-username" @input="auth.clearError()" />
            <p v-if="errors.username" class="form-error" data-cy="error-username">{{ errors.username }}</p>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-role">Role</label>
            <select id="reg-role" v-model="form.role" class="form-control" data-cy="select-role">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div class="form-group mb-2">
          <label class="form-label" for="reg-email">Email</label>
          <input id="reg-email" v-model="form.email" type="email" class="form-control" :class="{'is-invalid':errors.email}" placeholder="john@example.com" data-cy="input-email" @input="auth.clearError()" />
          <p v-if="errors.email" class="form-error" data-cy="error-email">{{ errors.email }}</p>
        </div>

        <div class="form-group mb-2">
          <label class="form-label" for="reg-password">Password</label>
          <input id="reg-password" v-model="form.password" type="password" class="form-control" :class="{'is-invalid':errors.password}" placeholder="Min. 6 characters" data-cy="input-password" @input="auth.clearError()" />
          <p v-if="errors.password" class="form-error" data-cy="error-password">{{ errors.password }}</p>
        </div>

        <div class="form-group mb-3">
          <label class="form-label" for="reg-confirm">Confirm Password</label>
          <input id="reg-confirm" v-model="form.confirmPassword" type="password" class="form-control" :class="{'is-invalid':errors.confirmPassword}" placeholder="Repeat password" data-cy="input-confirm-password" />
          <p v-if="errors.confirmPassword" class="form-error" data-cy="error-confirm-password">{{ errors.confirmPassword }}</p>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="auth.loading" data-cy="btn-register">
          <span v-if="auth.loading" class="btn-spinner" />
          {{ auth.loading ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <p class="auth-footer">
        Already have an account?
        <RouterLink to="/login" data-cy="link-login">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 2rem;
  background: radial-gradient(ellipse at 40% 0%, rgba(139,92,246,.15) 0%, transparent 60%),
              radial-gradient(ellipse at 100% 80%, rgba(99,102,241,.1) 0%, transparent 50%), var(--bg);
}
.auth-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 20px; padding: 2.5rem; width: 100%; max-width: 460px; box-shadow: var(--shadow);
}
.auth-brand { text-align: center; margin-bottom: 2rem; }
.auth-logo  { font-size: 2.5rem; margin-bottom: .5rem; }
.auth-title { font-size: 1.5rem; font-weight: 800; background: linear-gradient(135deg, var(--text), var(--accent-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.auth-subtitle { color: var(--muted-2); font-size: .9rem; margin-top: .25rem; }
.auth-footer { text-align: center; margin-top: 1.5rem; font-size: .875rem; color: var(--muted-2); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: .75rem; }
.btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; display: inline-block; }
</style>
