<script setup lang="ts">
import { ref, watch } from 'vue'

interface Toast {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

const toasts = ref<Toast[]>([])
let counter = 0

function addToast(type: Toast['type'], message: string) {
  const id = ++counter
  toasts.value.push({ id, type, message })
  setTimeout(() => removeToast(id), 4000)
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

defineExpose({ addToast })
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :data-cy="`toast-${toast.type}`"
          :class="['toast', `toast-${toast.type}`]"
        >
          <span class="toast-icon">
            {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ' }}
          </span>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close" @click="removeToast(toast.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: .6rem;
  max-width: 360px;
}

.toast {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .85rem 1rem;
  border-radius: 10px;
  font-size: .875rem;
  font-weight: 500;
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
  backdrop-filter: blur(8px);
}

.toast-success { background: rgba(16,185,129,.9); color: #fff; }
.toast-error   { background: rgba(239,68,68,.9);  color: #fff; }
.toast-info    { background: rgba(59,130,246,.9);  color: #fff; }
.toast-warning { background: rgba(245,158,11,.9);  color: #000; }

.toast-icon { font-size: 1rem; flex-shrink: 0; font-weight: 700; }
.toast-msg  { flex: 1; }
.toast-close {
  background: none; border: none; color: inherit; cursor: pointer;
  font-size: 1.2rem; opacity: .75; padding: 0; line-height: 1;
}
.toast-close:hover { opacity: 1; }

.toast-enter-active { animation: slide-in .3s cubic-bezier(.16,1,.3,1); }
.toast-leave-active { animation: slide-out .25s ease forwards; }
.toast-move { transition: transform .3s ease; }

@keyframes slide-in  { from { opacity:0; transform: translateX(120%); } }
@keyframes slide-out { to   { opacity:0; transform: translateX(120%); } }
</style>
