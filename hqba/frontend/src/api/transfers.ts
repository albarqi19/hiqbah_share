import type { ApiResponse, PaginatedResponse, TransferOrder } from '@/types';
import client from './client';

export const transferApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<TransferOrder>>('/transfers', { params }),
  get: (id: number) =>
    client.get<ApiResponse<TransferOrder>>(`/transfers/${id}`),
  create: (data: Record<string, unknown>) =>
    client.post<ApiResponse<TransferOrder>>('/transfers', data),
  approve: (id: number) =>
    client.put<ApiResponse<TransferOrder>>(`/transfers/${id}/approve`),
  ship: (id: number) =>
    client.put<ApiResponse<TransferOrder>>(`/transfers/${id}/ship`),
  receive: (id: number, receivedQuantities: Record<number, number>) =>
    client.put<ApiResponse<TransferOrder>>(`/transfers/${id}/receive`, { received_quantities: receivedQuantities }),
  confirm: (id: number) =>
    client.put<ApiResponse<TransferOrder>>(`/transfers/${id}/confirm`),
};
