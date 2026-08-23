import type { ApiResponse, PaginatedResponse, PackagingLot } from '@/types';
import client from './client';

export const packagingApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<PackagingLot>>('/packaging/lots', { params }),
  get: (id: number) =>
    client.get<ApiResponse<PackagingLot>>(`/packaging/lots/${id}`),
  create: (data: Record<string, unknown>) =>
    client.post<ApiResponse<PackagingLot>>('/packaging/lots', data),
  complete: (id: number) =>
    client.put<ApiResponse<PackagingLot>>(`/packaging/lots/${id}/complete`),
};
