import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  inventoryService,
  type InventoryItem,
  type CreateItemPayload,
  type UpdateItemPayload,
  type AdjustStockPayload,
} from '@/services/inventory.service'

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<InventoryItem[]>([])
  const current = ref<InventoryItem | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(category?: string, lowStockOnly?: boolean) {
    loading.value = true
    error.value = null
    try {
      const { data } = await inventoryService.getAll(category, lowStockOnly)
      items.value = data.items
    } catch (e: any) {
      error.value = e.message || 'Failed to load inventory'
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await inventoryService.getOne(id)
      current.value = data
    } catch (e: any) {
      error.value = e.message || 'Item not found'
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateItemPayload) {
    loading.value = true
    error.value = null
    try {
      const { data } = await inventoryService.create(payload)
      items.value.unshift(data)
      return data
    } catch (e: any) {
      error.value = e.message || 'Failed to create item'
      return null
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: UpdateItemPayload) {
    loading.value = true
    error.value = null
    try {
      const { data } = await inventoryService.update(id, payload)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = data
      current.value = data
      return data
    } catch (e: any) {
      error.value = e.message || 'Failed to update item'
      return null
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    loading.value = true
    error.value = null
    try {
      await inventoryService.remove(id)
      items.value = items.value.filter((i) => i.id !== id)
      return true
    } catch (e: any) {
      error.value = e.message || 'Failed to delete item'
      return false
    } finally {
      loading.value = false
    }
  }

  async function adjustStock(id: string, payload: AdjustStockPayload) {
    loading.value = true
    error.value = null
    try {
      const { data } = await inventoryService.adjustStock(id, payload)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = data
      current.value = data
      return data
    } catch (e: any) {
      error.value = e.message || 'Failed to adjust stock'
      return null
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }
  function clearCurrent() {
    current.value = null
  }

  return {
    items,
    current,
    loading,
    error,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    adjustStock,
    clearError,
    clearCurrent,
  }
})
