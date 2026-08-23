import type { ApiResponse, PaginatedResponse, Order, Shipment, StockAllocation } from '@/types';
import client from './client';

export const orderApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Order>>('/orders', { params }),
  get: (id: number) =>
    client.get<ApiResponse<Order>>(`/orders/${id}`),
  create: (data: Record<string, unknown>) =>
    client.post<ApiResponse<Order>>('/orders', data),
  transition: (id: number, status: string, notes?: string) =>
    client.put<ApiResponse<Order>>(`/orders/${id}/transition`, { status, notes }),
  inventoryCheck: (id: number) =>
    client.get<ApiResponse<Array<{ item_id: number; product_name: string; requested: number; available: boolean }>>>(`/orders/${id}/inventory-check`),
  confirmPayment: (id: number, paymentMethod: string) =>
    client.put<ApiResponse<Order>>(`/orders/${id}/payment`, { payment_method: paymentMethod }),
  cancel: (id: number, reason: string) =>
    client.put<ApiResponse<Order>>(`/orders/${id}/cancel`, { reason }),

  // Quote
  generateQuote: (id: number) =>
    client.post<ApiResponse<Order>>(`/orders/${id}/generate-quote`),
  getQuotePdf: (id: number) =>
    client.get(`/orders/${id}/quote-pdf`, { responseType: 'blob' }),

  // Stock Allocation
  allocateStock: (id: number) =>
    client.post<ApiResponse<Order>>(`/orders/${id}/allocate-stock`),
  releaseAllocations: (id: number) =>
    client.post<ApiResponse<null>>(`/orders/${id}/release-allocations`),
  getAllocations: (id: number) =>
    client.get<ApiResponse<StockAllocation[]>>(`/orders/${id}/allocations`),

  // Shipments
  getShipments: (id: number) =>
    client.get<ApiResponse<Shipment[]>>(`/orders/${id}/shipments`),
  createShipment: (id: number, data: { items: Array<{ order_item_id: number; quantity_shipped: number }>; carrier?: string; tracking_number?: string; notes?: string }) =>
    client.post<ApiResponse<Shipment>>(`/orders/${id}/shipments`, data),
  confirmDelivery: (shipmentId: number, confirmation?: string) =>
    client.put<ApiResponse<Shipment>>(`/shipments/${shipmentId}/confirm-delivery`, { delivery_confirmation: confirmation }),

  // Discount
  applyDiscount: (id: number, data: { discount_id?: number; code?: string }) =>
    client.post<ApiResponse<Order>>(`/orders/${id}/apply-discount`, data),

  // Overdue
  overduePayments: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Order>>('/orders/overdue-payments', { params }),
};
