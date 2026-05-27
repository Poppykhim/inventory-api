import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, type UserProfile } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<UserProfile | null>(
    (() => {
      try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
    })()
  )
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('token', t)
  }

  function setUser(u: UserProfile) {
    user.value = u
    localStorage.setItem('user', JSON.stringify(u))
  }

  async function login(username: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await authService.login({ username, password })
      setToken(data.access_token)
      await fetchProfile()
      return true
    } catch (e: any) {
      error.value = e.message || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(username: string, email: string, password: string, role: 'admin' | 'user' = 'user') {
    loading.value = true
    error.value = null
    try {
      const { data } = await authService.register({ username, email, password, role })
      setToken(data.access_token)
      await fetchProfile()
      return true
    } catch (e: any) {
      error.value = e.message || 'Registration failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    try {
      const { data } = await authService.getProfile()
      setUser(data)
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function clearError() { error.value = null }

  return { token, user, loading, error, isAuthenticated, isAdmin, login, register, fetchProfile, logout, clearError }
})
