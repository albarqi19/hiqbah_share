import type { ApiResponse, PurchaseOrder, PurchaseOrderFormData, PaginatedResponse } from '@/types';
import client from './client';

export const purchaseOrderApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', { params }),

  get: (id: number, params?: Record<string, unknown>) =>
    client.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, { params }),

  create: (data: PurchaseOrderFormData) =>
    client.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data),

  update: (id: number, data: Partial<PurchaseOrderFormData>) =>
    client.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, data),

  delete: (id: number) =>
    client.delete<ApiResponse<null>>(`/purchase-orders/${id}`),

  approve: (id: number) =>
    client.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/approve`),

  updateStatus: (id: number, status: string) =>
    client.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/status`, { status }),
};
