import api from './api'

export interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierPayload {
  name: string
  email: string
  phone: string
  address: string
}

export interface UpdateSupplierPayload extends Partial<CreateSupplierPayload> {}

export const suppliersService = {
  getAll() {
    return api.get<Supplier[]>('/suppliers')
  },
  getOne(id: string) {
    return api.get<Supplier>(`/suppliers/${id}`)
  },
  create(data: CreateSupplierPayload) {
    return api.post<Supplier>('/suppliers', data)
  },
  update(id: string, data: UpdateSupplierPayload) {
    return api.put<Supplier>(`/suppliers/${id}`, data)
  },
  remove(id: string) {
    return api.delete(`/suppliers/${id}`)
  },
}
