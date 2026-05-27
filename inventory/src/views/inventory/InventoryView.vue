<script setup lang="ts">
import { ref, inject, onMounted, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useSuppliersStore } from '@/stores/suppliers'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/AppModal.vue'
import type { CreateItemPayload } from '@/services/inventory.service'

const inv  = useInventoryStore()
const sup  = useSuppliersStore()
const auth = useAuthStore()
const toast = inject<any>('toast')

// Filters
const filterCategory = ref('')
const filterLow = ref(false)
const search = ref('')

const categories = computed(() => [...new Set(inv.items.map(i => i.category))].sort())
const filteredItems = computed(() => {
  let list = inv.items
  if (search.value) list = list.filter(i => i.name.toLowerCase().includes(search.value.toLowerCase()) || i.sku.toLowerCase().includes(search.value.toLowerCase()))
  return list
})

// Modals
const showCreate = ref(false)
const showEdit   = ref(false)
const showDelete = ref(false)
const showStock  = ref(false)
const editTarget = ref<any>(null)

// Forms
const emptyForm = (): CreateItemPayload => ({ name:'', sku:'', description:'', quantity:0, minStockLevel:5, price:0, supplierId:'', category:'' })
const form = ref(emptyForm())
const stockForm = ref({ adjustment: 0, reason: '' })
const formErrors = ref<Record<string,string>>({})

function validateForm() {
  formErrors.value = {}
  if (!form.value.name.trim())       formErrors.value.name = 'Name is required'
  if (!form.value.sku.trim())        formErrors.value.sku = 'SKU is required'
  if (form.value.quantity < 0)       formErrors.value.quantity = 'Must be ≥ 0'
  if (form.value.price <= 0)         formErrors.value.price = 'Must be > 0'
  if (!form.value.supplierId)        formErrors.value.supplierId = 'Supplier is required'
  if (!form.value.category.trim())   formErrors.value.category = 'Category is required'
  return Object.keys(formErrors.value).length === 0
}

async function applyFilter() {
  await inv.fetchAll(filterCategory.value || undefined, filterLow.value)
}

// CREATE
function openCreate() { form.value = emptyForm(); formErrors.value = {}; showCreate.value = true }
async function submitCreate() {
  if (!validateForm()) return
  const item = await inv.create(form.value)
  if (item) { showCreate.value = false; toast?.value?.addToast('success', `"${item.name}" created`) }
  else toast?.value?.addToast('error', inv.error || 'Failed to create')
}

// EDIT
function openEdit(item: any) { editTarget.value = item; form.value = { ...item }; formErrors.value = {}; showEdit.value = true }
async function submitEdit() {
  if (!validateForm()) return
  const item = await inv.update(editTarget.value.id, form.value)
  if (item) { showEdit.value = false; toast?.value?.addToast('success', `"${item.name}" updated`) }
  else toast?.value?.addToast('error', inv.error || 'Failed to update')
}

// DELETE
function openDelete(item: any) { editTarget.value = item; showDelete.value = true }
async function confirmDelete() {
  const ok = await inv.remove(editTarget.value.id)
  if (ok) { showDelete.value = false; toast?.value?.addToast('success', 'Item deleted') }
  else toast?.value?.addToast('error', inv.error || 'Failed to delete')
}

// STOCK
function openStock(item: any) { editTarget.value = item; stockForm.value = { adjustment: 0, reason: '' }; showStock.value = true }
async function submitStock() {
  if (stockForm.value.adjustment === 0) { toast?.value?.addToast('warning', 'Adjustment cannot be 0'); return }
  const item = await inv.adjustStock(editTarget.value.id, stockForm.value)
  if (item) { showStock.value = false; toast?.value?.addToast('success', `Stock adjusted to ${item.quantity}`) }
  else toast?.value?.addToast('error', inv.error || 'Failed to adjust stock')
}

function stockBadge(item: any) {
  if (item.quantity === 0) return { cls: 'badge-danger', label: 'Out of Stock' }
  if (item.quantity <= item.minStockLevel) return { cls: 'badge-warning', label: 'Low Stock' }
  return { cls: 'badge-success', label: 'In Stock' }
}
function fmtCurrency(n: number) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n) }

onMounted(async () => {
  await Promise.all([inv.fetchAll(), sup.fetchAll()])
})
</script>

<template>
  <div class="page-wrapper" data-cy="inventory-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Inventory</h1>
      <button v-if="auth.isAdmin" class="btn btn-primary" @click="openCreate" data-cy="btn-create-item">+ New Item</button>
    </div>

    <!-- Filters -->
    <div class="card mb-2 filters-bar">
      <input v-model="search" class="form-control" placeholder="🔍 Search name or SKU…" style="max-width:240px" data-cy="input-search" />
      <select v-model="filterCategory" class="form-control" style="max-width:180px" data-cy="select-category" @change="applyFilter">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <label class="check-label" data-cy="check-low-stock">
        <input type="checkbox" v-model="filterLow" @change="applyFilter" /> Low stock only
      </label>
      <button class="btn btn-ghost btn-sm" @click="filterCategory='';filterLow=false;inv.fetchAll()" data-cy="btn-reset-filter">Reset</button>
    </div>

    <!-- Error -->
    <div v-if="inv.error" class="alert alert-error mb-2" data-cy="inventory-error" role="alert">
      <span>⚠</span> {{ inv.error }}
    </div>

    <!-- Loading -->
    <div v-if="inv.loading" class="loading-state">
      <div class="spinner" /><span>Loading inventory…</span>
    </div>

    <!-- Table -->
    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <div class="icon">📦</div>
      <p>No items found</p>
      <button v-if="auth.isAdmin" class="btn btn-primary btn-sm mt-1" @click="openCreate">Add First Item</button>
    </div>

    <div v-else class="table-wrap" data-cy="inventory-table">
      <table>
        <thead>
          <tr>
            <th>Name</th><th>SKU</th><th>Category</th><th>Qty</th><th>Min</th><th>Price</th><th>Status</th>
            <th v-if="auth.isAdmin">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.id" :data-cy="`item-row-${item.id}`">
            <td><strong>{{ item.name }}</strong><br/><small class="text-muted">{{ item.description }}</small></td>
            <td><code style="font-size:.8rem;color:var(--muted-2)">{{ item.sku }}</code></td>
            <td>{{ item.category }}</td>
            <td><strong :class="item.quantity <= item.minStockLevel ? 'text-danger' : ''">{{ item.quantity }}</strong></td>
            <td>{{ item.minStockLevel }}</td>
            <td>{{ fmtCurrency(item.price) }}</td>
            <td><span :class="['badge', stockBadge(item).cls]" :data-cy="`status-${item.id}`">{{ stockBadge(item).label }}</span></td>
            <td v-if="auth.isAdmin">
              <div class="flex gap-1">
                <button class="btn btn-ghost btn-sm btn-icon" title="Edit" @click="openEdit(item)" :data-cy="`btn-edit-${item.id}`">✎</button>
                <button class="btn btn-success btn-sm btn-icon" title="Adjust Stock" @click="openStock(item)" :data-cy="`btn-stock-${item.id}`">⇅</button>
                <button class="btn btn-danger btn-sm btn-icon" title="Delete" @click="openDelete(item)" :data-cy="`btn-delete-${item.id}`">✕</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CREATE Modal -->
    <AppModal v-model="showCreate" title="Create Inventory Item" size="lg" data-cy="modal-create">
      <form @submit.prevent="submitCreate" novalidate>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input v-model="form.name" class="form-control" :class="{'is-invalid':formErrors.name}" data-cy="create-name" />
            <p v-if="formErrors.name" class="form-error">{{ formErrors.name }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">SKU *</label>
            <input v-model="form.sku" class="form-control" :class="{'is-invalid':formErrors.sku}" data-cy="create-sku" />
            <p v-if="formErrors.sku" class="form-error">{{ formErrors.sku }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <input v-model="form.category" class="form-control" :class="{'is-invalid':formErrors.category}" data-cy="create-category" />
            <p v-if="formErrors.category" class="form-error">{{ formErrors.category }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <select v-model="form.supplierId" class="form-control" :class="{'is-invalid':formErrors.supplierId}" data-cy="create-supplier">
              <option value="">-- Select Supplier --</option>
              <option v-for="s in sup.suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <p v-if="formErrors.supplierId" class="form-error">{{ formErrors.supplierId }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input v-model.number="form.quantity" type="number" min="0" class="form-control" :class="{'is-invalid':formErrors.quantity}" data-cy="create-quantity" />
            <p v-if="formErrors.quantity" class="form-error">{{ formErrors.quantity }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Min Stock Level</label>
            <input v-model.number="form.minStockLevel" type="number" min="0" class="form-control" data-cy="create-min-stock" />
          </div>
          <div class="form-group">
            <label class="form-label">Price *</label>
            <input v-model.number="form.price" type="number" min="0" step="0.01" class="form-control" :class="{'is-invalid':formErrors.price}" data-cy="create-price" />
            <p v-if="formErrors.price" class="form-error">{{ formErrors.price }}</p>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Description</label>
            <textarea v-model="form.description" class="form-control" rows="2" data-cy="create-description" />
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-ghost" @click="showCreate=false">Cancel</button>
        <button class="btn btn-primary" :disabled="inv.loading" @click="submitCreate" data-cy="btn-submit-create">
          {{ inv.loading ? 'Creating…' : 'Create Item' }}
        </button>
      </template>
    </AppModal>

    <!-- EDIT Modal -->
    <AppModal v-model="showEdit" title="Edit Inventory Item" size="lg">
      <form @submit.prevent="submitEdit" novalidate>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input v-model="form.name" class="form-control" :class="{'is-invalid':formErrors.name}" data-cy="edit-name" />
            <p v-if="formErrors.name" class="form-error">{{ formErrors.name }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">SKU *</label>
            <input v-model="form.sku" class="form-control" :class="{'is-invalid':formErrors.sku}" data-cy="edit-sku" />
            <p v-if="formErrors.sku" class="form-error">{{ formErrors.sku }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <input v-model="form.category" class="form-control" :class="{'is-invalid':formErrors.category}" data-cy="edit-category" />
          </div>
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <select v-model="form.supplierId" class="form-control" data-cy="edit-supplier">
              <option v-for="s in sup.suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input v-model.number="form.quantity" type="number" min="0" class="form-control" data-cy="edit-quantity" />
          </div>
          <div class="form-group">
            <label class="form-label">Min Stock Level</label>
            <input v-model.number="form.minStockLevel" type="number" min="0" class="form-control" data-cy="edit-min-stock" />
          </div>
          <div class="form-group">
            <label class="form-label">Price *</label>
            <input v-model.number="form.price" type="number" min="0" step="0.01" class="form-control" :class="{'is-invalid':formErrors.price}" data-cy="edit-price" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Description</label>
            <textarea v-model="form.description" class="form-control" rows="2" data-cy="edit-description" />
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-ghost" @click="showEdit=false">Cancel</button>
        <button class="btn btn-primary" :disabled="inv.loading" @click="submitEdit" data-cy="btn-submit-edit">
          {{ inv.loading ? 'Saving…' : 'Save Changes' }}
        </button>
      </template>
    </AppModal>

    <!-- DELETE Modal -->
    <AppModal v-model="showDelete" title="Delete Item" size="sm" data-cy="modal-delete">
      <p class="text-center">Are you sure you want to delete <strong>{{ editTarget?.name }}</strong>? This action cannot be undone.</p>
      <template #footer>
        <button class="btn btn-ghost" @click="showDelete=false" data-cy="btn-cancel-delete">Cancel</button>
        <button class="btn btn-danger" :disabled="inv.loading" @click="confirmDelete" data-cy="btn-confirm-delete">
          {{ inv.loading ? 'Deleting…' : 'Delete' }}
        </button>
      </template>
    </AppModal>

    <!-- STOCK Modal -->
    <AppModal v-model="showStock" title="Adjust Stock" size="sm" data-cy="modal-stock">
      <p class="mb-2 text-muted" style="font-size:.875rem">Current: <strong style="color:var(--text)">{{ editTarget?.quantity }}</strong> units of <strong style="color:var(--text)">{{ editTarget?.name }}</strong></p>
      <div class="form-group mb-2">
        <label class="form-label">Adjustment (+ add, − deduct)</label>
        <input v-model.number="stockForm.adjustment" type="number" class="form-control" data-cy="stock-adjustment" />
      </div>
      <div class="form-group">
        <label class="form-label">Reason (optional)</label>
        <input v-model="stockForm.reason" type="text" class="form-control" placeholder="e.g. Restocked from supplier" data-cy="stock-reason" />
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="showStock=false">Cancel</button>
        <button class="btn btn-success" :disabled="inv.loading" @click="submitStock" data-cy="btn-submit-stock">
          {{ inv.loading ? 'Adjusting…' : 'Apply Adjustment' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.filters-bar { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; padding: 1rem 1.25rem; }
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
@media (max-width: 560px) { .form-grid-2 { grid-template-columns: 1fr; } }
.check-label { display: flex; align-items: center; gap: .4rem; font-size: .875rem; color: var(--muted-2); cursor: pointer; white-space: nowrap; }
</style>
