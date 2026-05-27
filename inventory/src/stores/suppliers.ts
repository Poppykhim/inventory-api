import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  suppliersService,
  type Supplier,
  type CreateSupplierPayload,
  type UpdateSupplierPayload,
} from '@/services/suppliers.service'

export const useSuppliersStore = defineStore('suppliers', () => {
  const suppliers = ref<Supplier[]>([])
  const current = ref<Supplier | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await suppliersService.getAll()
      suppliers.value = data.suppliers
    } catch (e: any) {
      error.value = e.message || 'Failed to load suppliers'
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await suppliersService.getOne(id)
      current.value = data
    } catch (e: any) {
      error.value = e.message || 'Supplier not found'
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateSupplierPayload) {
    loading.value = true
    error.value = null
    try {
      const { data } = await suppliersService.create(payload)
      suppliers.value.unshift(data)
      return data
    } catch (e: any) {
      error.value = e.message || 'Failed to create supplier'
      return null
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: UpdateSupplierPayload) {
    loading.value = true
    error.value = null
    try {
      const { data } = await suppliersService.update(id, payload)
      const idx = suppliers.value.findIndex((s) => s.id === id)
      if (idx !== -1) suppliers.value[idx] = data
      current.value = data
      return data
    } catch (e: any) {
      error.value = e.message || 'Failed to update supplier'
      return null
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    loading.value = true
    error.value = null
    try {
      await suppliersService.remove(id)
      suppliers.value = suppliers.value.filter((s) => s.id !== id)
      return true
    } catch (e: any) {
      error.value = e.message || 'Failed to delete supplier'
      return false
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    suppliers,
    current,
    loading,
    error,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    clearError,
  }
})
