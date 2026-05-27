<script setup lang="ts">
import './assets/main.css'
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NavBar from '@/components/NavBar.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const auth = useAuthStore()
const toast = ref<InstanceType<typeof ToastNotification> | null>(null)

// Expose toast globally via provide
import { provide } from 'vue'
provide('toast', toast)
</script>

<template>
  <ToastNotification ref="toast" />
  <NavBar v-if="auth.isAuthenticated" />
  <RouterView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" :toast="toast" />
    </Transition>
  </RouterView>
</template>
