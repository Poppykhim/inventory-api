<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg'
}>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; close: [] }>()

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="close" role="dialog" aria-modal="true">
        <div :class="['modal-box', `modal-${size || 'md'}`]">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="modal-close" @click="close" aria-label="Close" data-cy="modal-close">×</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.65);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

.modal-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,.6);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-sm { max-width: 400px; }
.modal-md { max-width: 560px; }
.modal-lg { max-width: 780px; }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
}
.modal-title { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.modal-close {
  background: none; border: none; color: var(--muted-2);
  font-size: 1.5rem; cursor: pointer; line-height: 1; padding: .1rem .4rem;
  border-radius: 4px; transition: background .15s, color .15s;
}
.modal-close:hover { background: var(--border); color: var(--text); }

.modal-body   { padding: 1.5rem; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: .75rem; }

/* Transition */
.modal-enter-active, .modal-leave-active { transition: opacity .25s; }
.modal-enter-active .modal-box, .modal-leave-active .modal-box { transition: transform .25s cubic-bezier(.16,1,.3,1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(.95) translateY(10px); }
</style>
