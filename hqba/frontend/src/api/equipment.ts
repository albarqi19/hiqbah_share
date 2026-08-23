import type { ApiResponse, Equipment, EquipmentFormData, PaginatedResponse } from '@/types';
import client from './client';

export const equipmentApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Equipment>>('/equipment', { params }),

  get: (id: number) =>
    client.get<ApiResponse<Equipment>>(`/equipment/${id}`),

  create: (data: EquipmentFormData) =>
    client.post<ApiResponse<Equipment>>('/equipment', data),

  update: (id: number, data: Partial<EquipmentFormData>) =>
    client.put<ApiResponse<Equipment>>(`/equipment/${id}`, data),

  delete: (id: number) =>
    client.delete<ApiResponse<null>>(`/equipment/${id}`),
};
