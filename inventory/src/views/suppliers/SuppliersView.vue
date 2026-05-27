<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import { useSuppliersStore } from '@/stores/suppliers'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/AppModal.vue'
import type { CreateSupplierPayload } from '@/services/suppliers.service'

const sup  = useSuppliersStore()
const auth = useAuthStore()
const toast = inject<any>('toast')

const showCreate = ref(false)
const showEdit   = ref(false)
const showDelete = ref(false)
const editTarget = ref<any>(null)

const emptyForm = (): CreateSupplierPayload => ({ name:'', email:'', phone:'', address:'' })
const form = ref(emptyForm())
const formErrors = ref<Record<string,string>>({})

function validateForm() {
  formErrors.value = {}
  if (!form.value.name.trim())    formErrors.value.name = 'Name is required'
  if (!form.value.email.trim())   formErrors.value.email = 'Email is required'
  else if (!/\S+@\S+\.\S+/.test(form.value.email)) formErrors.value.email = 'Invalid email'
  if (!form.value.phone.trim())   formErrors.value.phone = 'Phone is required'
  if (!form.value.address.trim()) formErrors.value.address = 'Address is required'
  return Object.keys(formErrors.value).length === 0
}

// CREATE
function openCreate() { form.value = emptyForm(); formErrors.value = {}; showCreate.value = true }
async function submitCreate() {
  if (!validateForm()) return
  const s = await sup.create(form.value)
  if (s) { showCreate.value = false; toast?.value?.addToast('success', `"${s.name}" created`) }
  else toast?.value?.addToast('error', sup.error || 'Failed to create')
}

// EDIT
function openEdit(s: any) { editTarget.value = s; form.value = { ...s }; formErrors.value = {}; showEdit.value = true }
async function submitEdit() {
  if (!validateForm()) return
  const s = await sup.update(editTarget.value.id, form.value)
  if (s) { showEdit.value = false; toast?.value?.addToast('success', `"${s.name}" updated`) }
  else toast?.value?.addToast('error', sup.error || 'Failed to update')
}

// DELETE
function openDelete(s: any) { editTarget.value = s; showDelete.value = true }
async function confirmDelete() {
  const ok = await sup.remove(editTarget.value.id)
  if (ok) { showDelete.value = false; toast?.value?.addToast('success', 'Supplier deleted') }
  else toast?.value?.addToast('error', sup.error || 'Failed to delete')
}

onMounted(() => sup.fetchAll())
</script>

<template>
  <div class="page-wrapper" data-cy="suppliers-page">
    <div class="page-header">
      <h1 class="page-title">Suppliers</h1>
      <button v-if="auth.isAdmin" class="btn btn-primary" @click="openCreate" data-cy="btn-create-supplier">+ New Supplier</button>
    </div>

    <!-- Error -->
    <div v-if="sup.error" class="alert alert-error mb-2" data-cy="suppliers-error" role="alert">
      <span>⚠</span> {{ sup.error }}
    </div>

    <!-- Loading -->
    <div v-if="sup.loading" class="loading-state">
      <div class="spinner" /><span>Loading suppliers…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="sup.suppliers.length === 0" class="empty-state">
      <div class="icon">🏭</div>
      <p>No suppliers yet</p>
      <button v-if="auth.isAdmin" class="btn btn-primary btn-sm mt-1" @click="openCreate">Add First Supplier</button>
    </div>

    <!-- Grid -->
    <div v-else class="suppliers-grid" data-cy="suppliers-grid">
      <div v-for="s in sup.suppliers" :key="s.id" class="supplier-card" :data-cy="`supplier-card-${s.id}`">
        <div class="supplier-avatar">{{ s.name[0]?.toUpperCase() || '' }}</div>
        <div class="supplier-info">
          <h3 class="supplier-name" :data-cy="`supplier-name-${s.id}`">{{ s.name }}</h3>
          <div class="supplier-detail"><span class="detail-icon">✉</span> {{ s.email }}</div>
          <div class="supplier-detail"><span class="detail-icon">📞</span> {{ s.phone }}</div>
          <div class="supplier-detail"><span class="detail-icon">📍</span> {{ s.address }}</div>
        </div>
        <div v-if="auth.isAdmin" class="supplier-actions">
          <button class="btn btn-ghost btn-sm" @click="openEdit(s)" :data-cy="`btn-edit-supplier-${s.id}`">✎ Edit</button>
          <button class="btn btn-danger btn-sm" @click="openDelete(s)" :data-cy="`btn-delete-supplier-${s.id}`">✕ Delete</button>
        </div>
      </div>
    </div>

    <!-- CREATE Modal -->
    <AppModal v-model="showCreate" title="Add Supplier" size="md" data-cy="modal-create-supplier">
      <form @submit.prevent="submitCreate" novalidate>
        <div class="form-group mb-2">
          <label class="form-label">Company Name *</label>
          <input v-model="form.name" class="form-control" :class="{'is-invalid':formErrors.name}" placeholder="Tech Supplies Co." data-cy="supplier-name" />
          <p v-if="formErrors.name" class="form-error" data-cy="error-supplier-name">{{ formErrors.name }}</p>
        </div>
        <div class="form-group mb-2">
          <label class="form-label">Email *</label>
          <input v-model="form.email" type="email" class="form-control" :class="{'is-invalid':formErrors.email}" placeholder="contact@supplier.com" data-cy="supplier-email" />
          <p v-if="formErrors.email" class="form-error" data-cy="error-supplier-email">{{ formErrors.email }}</p>
        </div>
        <div class="form-group mb-2">
          <label class="form-label">Phone *</label>
          <input v-model="form.phone" class="form-control" :class="{'is-invalid':formErrors.phone}" placeholder="+1-555-0100" data-cy="supplier-phone" />
          <p v-if="formErrors.phone" class="form-error" data-cy="error-supplier-phone">{{ formErrors.phone }}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Address *</label>
          <textarea v-model="form.address" class="form-control" :class="{'is-invalid':formErrors.address}" rows="2" placeholder="123 Supplier Ave, NY" data-cy="supplier-address" />
          <p v-if="formErrors.address" class="form-error" data-cy="error-supplier-address">{{ formErrors.address }}</p>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-ghost" @click="showCreate=false">Cancel</button>
        <button class="btn btn-primary" :disabled="sup.loading" @click="submitCreate" data-cy="btn-submit-supplier">
          {{ sup.loading ? 'Creating…' : 'Create Supplier' }}
        </button>
      </template>
    </AppModal>

    <!-- EDIT Modal -->
    <AppModal v-model="showEdit" title="Edit Supplier" size="md">
      <form @submit.prevent="submitEdit" novalidate>
        <div class="form-group mb-2">
          <label class="form-label">Company Name *</label>
          <input v-model="form.name" class="form-control" :class="{'is-invalid':formErrors.name}" data-cy="edit-supplier-name" />
          <p v-if="formErrors.name" class="form-error">{{ formErrors.name }}</p>
        </div>
        <div class="form-group mb-2">
          <label class="form-label">Email *</label>
          <input v-model="form.email" type="email" class="form-control" :class="{'is-invalid':formErrors.email}" data-cy="edit-supplier-email" />
          <p v-if="formErrors.email" class="form-error">{{ formErrors.email }}</p>
        </div>
        <div class="form-group mb-2">
          <label class="form-label">Phone *</label>
          <input v-model="form.phone" class="form-control" :class="{'is-invalid':formErrors.phone}" data-cy="edit-supplier-phone" />
          <p v-if="formErrors.phone" class="form-error">{{ formErrors.phone }}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Address *</label>
          <textarea v-model="form.address" class="form-control" rows="2" data-cy="edit-supplier-address" />
        </div>
      </form>
      <template #footer>
        <button class="btn btn-ghost" @click="showEdit=false">Cancel</button>
        <button class="btn btn-primary" :disabled="sup.loading" @click="submitEdit" data-cy="btn-submit-edit-supplier">
          {{ sup.loading ? 'Saving…' : 'Save Changes' }}
        </button>
      </template>
    </AppModal>

    <!-- DELETE Modal -->
    <AppModal v-model="showDelete" title="Delete Supplier" size="sm" data-cy="modal-delete-supplier">
      <p class="text-center">Delete supplier <strong>{{ editTarget?.name }}</strong>? This will fail if they have active items.</p>
      <template #footer>
        <button class="btn btn-ghost" @click="showDelete=false" data-cy="btn-cancel-delete-supplier">Cancel</button>
        <button class="btn btn-danger" :disabled="sup.loading" @click="confirmDelete" data-cy="btn-confirm-delete-supplier">
          {{ sup.loading ? 'Deleting…' : 'Delete' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.suppliers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
.supplier-card {
  background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 1.5rem; display: flex; flex-direction: column; gap: .75rem;
  transition: border-color var(--transition), transform var(--transition);
}
.supplier-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.supplier-avatar {
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.supplier-name { font-size: 1rem; font-weight: 700; }
.supplier-detail { font-size: .83rem; color: var(--muted-2); display: flex; align-items: center; gap: .4rem; }
.detail-icon { font-size: .9rem; }
.supplier-actions { display: flex; gap: .5rem; margin-top: auto; padding-top: .5rem; border-top: 1px solid var(--border); }
</style>
