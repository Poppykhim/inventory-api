<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="not-found-page" data-cy="not-found-page">
    <div class="nf-content">
      <div class="nf-code">404</div>
      <h1 class="nf-title">Page Not Found</h1>
      <p class="nf-desc">The page you're looking for doesn't exist or has been moved.</p>
      <div class="flex gap-1" style="justify-content:center;margin-top:2rem">
        <button class="btn btn-primary" @click="router.push('/')" data-cy="btn-go-home">Go to Dashboard</button>
        <button class="btn btn-ghost" @click="router.back()" data-cy="btn-go-back">Go Back</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 30%, rgba(99,102,241,.1) 0%, transparent 60%), var(--bg);
  padding: 2rem;
}
.nf-content { text-align: center; }
.nf-code {
  font-size: 8rem; font-weight: 900; line-height: 1;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.nf-title { font-size: 2rem; font-weight: 700; margin-top: .5rem; }
.nf-desc  { color: var(--muted-2); margin-top: .75rem; font-size: 1rem; }
</style>
