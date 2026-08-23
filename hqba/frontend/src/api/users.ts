import type { ApiResponse, PaginatedResponse, User, UserFormData } from '@/types';
import client from './client';

export const userApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<User>>('/users', { params }),

  get: (id: number) =>
    client.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: UserFormData) =>
    client.post<ApiResponse<User>>('/users', data),

  update: (id: number, data: Partial<UserFormData>) =>
    client.put<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: number) =>
    client.delete<ApiResponse<null>>(`/users/${id}`),

  toggleActive: (id: number) =>
    client.patch<ApiResponse<User>>(`/users/${id}/toggle-active`),
};
