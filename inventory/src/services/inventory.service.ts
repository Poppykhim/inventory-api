import api from './api'

export interface InventoryItem {
  id: string
  name: string
  sku: string
  description?: string
  quantity: number
  minStockLevel: number
  price: number
  supplierId: string
  category: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateItemPayload {
  name: string
  sku: string
  description?: string
  quantity: number
  minStockLevel: number
  price: number
  supplierId: string
  category: string
}

export interface UpdateItemPayload extends Partial<CreateItemPayload> {}

export interface AdjustStockPayload {
  adjustment: number
  reason?: string
}

export interface Availability {
  id: string
  name: string
  quantity: number
  minStockLevel: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export const inventoryService = {
  getAll(category?: string, lowStockOnly?: boolean) {
    const params: Record<string, string> = {}
    if (category) params.category = category
    if (lowStockOnly) params.lowStockOnly = 'true'
    return api.get<InventoryItem[]>('/inventory', { params })
  },
  getOne(id: string) {
    return api.get<InventoryItem>(`/inventory/${id}`)
  },
  create(data: CreateItemPayload) {
    return api.post<InventoryItem>('/inventory', data)
  },
  update(id: string, data: UpdateItemPayload) {
    return api.put<InventoryItem>(`/inventory/${id}`, data)
  },
  remove(id: string) {
    return api.delete(`/inventory/${id}`)
  },
  adjustStock(id: string, data: AdjustStockPayload) {
    return api.patch<InventoryItem>(`/inventory/${id}/stock`, data)
  },
  getAvailability(id: string) {
    return api.get<Availability>(`/inventory/${id}/availability`)
  },
}
