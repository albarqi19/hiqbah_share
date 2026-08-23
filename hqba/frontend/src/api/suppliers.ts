import type { ApiResponse, Supplier, SupplierFormData, PaginatedResponse } from '@/types';
import client from './client';

export const supplierApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Supplier>>('/suppliers', { params }),

  get: (id: number) =>
    client.get<ApiResponse<Supplier>>(`/suppliers/${id}`),

  create: (data: SupplierFormData) =>
    client.post<ApiResponse<Supplier>>('/suppliers', data),

  update: (id: number, data: Partial<SupplierFormData>) =>
    client.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data),

  delete: (id: number) =>
    client.delete<ApiResponse<null>>(`/suppliers/${id}`),
};
