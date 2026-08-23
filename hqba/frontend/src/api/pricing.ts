import client from './client';
import type { ApiResponse, PaginatedResponse, PriceList, PriceListItem, PriceChangeLog, Discount, MarginSimulation } from '@/types';

export const pricingApi = {
  // Price Lists
  listPriceLists: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<PriceList>>('/price-lists', { params }),
  getPriceList: (id: number) =>
    client.get<ApiResponse<PriceList>>(`/price-lists/${id}`),
  createPriceList: (data: Record<string, unknown>) =>
    client.post<ApiResponse<PriceList>>('/price-lists', data),
  updatePriceList: (id: number, data: Record<string, unknown>) =>
    client.put<ApiResponse<PriceList>>(`/price-lists/${id}`, data),
  approvePriceList: (id: number) =>
    client.put<ApiResponse<PriceList>>(`/price-lists/${id}/approve`),
  archivePriceList: (id: number) =>
    client.put<ApiResponse<PriceList>>(`/price-lists/${id}/archive`),

  // Price List Items
  listItems: (priceListId: number, params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<PriceListItem>>(`/price-lists/${priceListId}/items`, { params }),
  setItem: (priceListId: number, data: Record<string, unknown>) =>
    client.post<ApiResponse<PriceListItem>>(`/price-lists/${priceListId}/items`, data),
  updateItem: (priceListId: number, itemId: number, data: Record<string, unknown>) =>
    client.put<ApiResponse<PriceListItem>>(`/price-lists/${priceListId}/items/${itemId}`, data),
  removeItem: (priceListId: number, itemId: number) =>
    client.delete<ApiResponse<null>>(`/price-lists/${priceListId}/items/${itemId}`),
  bulkSetItems: (priceListId: number, items: Record<string, unknown>[]) =>
    client.post<ApiResponse<PriceListItem[]>>(`/price-lists/${priceListId}/items/bulk`, { items }),

  // Price Resolution
  resolvePrice: (params: { customer_id: number; crop_id: number; item_type: string }) =>
    client.get<ApiResponse<{ customer_id: number; crop_id: number; item_type: string; unit_price: number | null }>>('/pricing/resolve', { params }),
  resolveBatch: (data: { customer_id: number; items: Array<{ crop_id: number; item_type: string }> }) =>
    client.post<ApiResponse<Array<{ crop_id: number; item_type: string; unit_price: number | null }>>>('/pricing/resolve-batch', data),

  // Profit Simulator
  simulateMargin: (data: { crop_id: number; item_type: string; new_price: number }) =>
    client.post<ApiResponse<MarginSimulation>>('/pricing/simulate-margin', data),

  // Price Change Logs
  listChangeLogs: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<PriceChangeLog>>('/price-change-logs', { params }),

  // Discounts
  listDiscounts: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Discount>>('/discounts', { params }),
  getDiscount: (id: number) =>
    client.get<ApiResponse<Discount>>(`/discounts/${id}`),
  createDiscount: (data: Record<string, unknown>) =>
    client.post<ApiResponse<Discount>>('/discounts', data),
  updateDiscount: (id: number, data: Record<string, unknown>) =>
    client.put<ApiResponse<Discount>>(`/discounts/${id}`, data),
  deactivateDiscount: (id: number) =>
    client.put<ApiResponse<Discount>>(`/discounts/${id}/deactivate`),
  validateCode: (code: string, customerId?: number) =>
    client.post<ApiResponse<Discount>>('/discounts/validate-code', { code, customer_id: customerId }),
};
