<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInventoryStore } from '@/stores/inventory'
import { useSuppliersStore } from '@/stores/suppliers'

const auth = useAuthStore()
const inv  = useInventoryStore()
const sup  = useSuppliersStore()

onMounted(async () => {
  await Promise.all([inv.fetchAll(), sup.fetchAll()])
})

const totalItems    = computed(() => inv.items.length)
const totalValue    = computed(() => inv.items.reduce((s, i) => s + i.price * i.quantity, 0))
const lowStockCount = computed(() => inv.items.filter(i => i.quantity <= i.minStockLevel).length)
const totalSuppliers = computed(() => sup.suppliers.length)
const recentItems   = computed(() => [...inv.items].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0,5))

function fmtCurrency(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) }
function stockBadge(item: any) {
  if (item.quantity === 0) return { cls: 'badge-danger',  label: 'Out of Stock' }
  if (item.quantity <= item.minStockLevel) return { cls: 'badge-warning', label: 'Low Stock' }
  return { cls: 'badge-success', label: 'In Stock' }
}
</script>

<template>
  <div class="page-wrapper" data-cy="dashboard-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="text-muted" style="font-size:.9rem">Welcome back, <strong style="color:var(--text)">{{ auth.user?.username }}</strong></p>
      </div>
      <div class="flex gap-1" v-if="auth.isAdmin">
        <RouterLink to="/inventory" class="btn btn-primary btn-sm" data-cy="btn-add-inventory">+ Add Inventory</RouterLink>
        <RouterLink to="/suppliers" class="btn btn-ghost btn-sm" data-cy="btn-add-supplier">+ Add Supplier</RouterLink>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid mb-3">
      <div class="stat-card accent" data-cy="stat-total-items">
        <div class="stat-icon">📦</div>
        <div class="stat-label">Total Items</div>
        <div class="stat-value">{{ totalItems }}</div>
      </div>
      <div class="stat-card success" data-cy="stat-total-value">
        <div class="stat-icon">💰</div>
        <div class="stat-label">Portfolio Value</div>
        <div class="stat-value" style="font-size:1.4rem">{{ fmtCurrency(totalValue) }}</div>
      </div>
      <div class="stat-card warning" data-cy="stat-low-stock">
        <div class="stat-icon">⚠️</div>
        <div class="stat-label">Low Stock Alerts</div>
        <div class="stat-value" :style="lowStockCount > 0 ? 'color:var(--warning)' : ''">{{ lowStockCount }}</div>
      </div>
      <div class="stat-card danger" data-cy="stat-suppliers">
        <div class="stat-icon">🏭</div>
        <div class="stat-label">Suppliers</div>
        <div class="stat-value">{{ totalSuppliers }}</div>
      </div>
    </div>

    <!-- Recent Items Table -->
    <div class="card">
      <div class="flex items-center justify-between mb-2">
        <h2 style="font-size:1.1rem;font-weight:700">Recent Activity</h2>
        <RouterLink to="/inventory" class="btn btn-ghost btn-sm">View All →</RouterLink>
      </div>

      <div v-if="inv.loading" class="loading-state">
        <div class="spinner" />
        <span>Loading inventory…</span>
      </div>

      <div v-else-if="inv.items.length === 0" class="empty-state">
        <div class="icon">📦</div>
        <p>No inventory items yet</p>
        <RouterLink to="/inventory" class="btn btn-primary btn-sm mt-1">Add First Item</RouterLink>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in recentItems" :key="item.id" data-cy="dashboard-item-row">
              <td><strong>{{ item.name }}</strong></td>
              <td><code style="color:var(--muted-2);font-size:.8rem">{{ item.sku }}</code></td>
              <td>{{ item.category }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ fmtCurrency(item.price) }}</td>
              <td><span :class="['badge', stockBadge(item).cls]">{{ stockBadge(item).label }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
</style>
