import type {
  ApiResponse,
  PaginatedResponse,
  InventoryItem,
  InventoryMovement,
  InventorySummary,
  InventoryValuation,
} from '@/types';
import client from './client';

export const inventoryApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<InventoryItem>>('/inventory', { params }),

  get: (id: number) =>
    client.get<ApiResponse<{ item: InventoryItem; recent_movements: InventoryMovement[] }>>(`/inventory/${id}`),

  movements: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<InventoryMovement>>('/inventory/movements', { params }),

  alerts: (params?: Record<string, unknown>) =>
    client.get<ApiResponse<InventoryItem[]>>('/inventory/alerts', { params }),

  summary: (params?: Record<string, unknown>) =>
    client.get<ApiResponse<InventorySummary>>('/inventory/summary', { params }),

  valuation: (params?: Record<string, unknown>) =>
    client.get<ApiResponse<InventoryValuation>>('/inventory/valuation', { params }),

  adjust: (data: Record<string, unknown>) =>
    client.post<ApiResponse<InventoryMovement>>('/inventory/adjust', data),

  reconcile: (data: Record<string, unknown>) =>
    client.post<ApiResponse<InventoryMovement>>('/inventory/reconcile', data),

  setThreshold: (id: number, data: { min_threshold: number }) =>
    client.put<ApiResponse<InventoryItem>>(`/inventory/${id}/threshold`, data),
};
