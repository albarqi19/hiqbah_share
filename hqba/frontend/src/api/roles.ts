import type { ApiResponse, PermissionGroup, Role, UserPermissionsPayload } from '@/types';
import client from './client';

export const roleApi = {
  list: () => client.get<ApiResponse<Role[]>>('/roles'),

  get: (id: number) => client.get<ApiResponse<Role>>(`/roles/${id}`),

  create: (data: { name: string; permissions?: string[] }) =>
    client.post<ApiResponse<Role>>('/roles', data),

  update: (id: number, data: { name?: string }) =>
    client.put<ApiResponse<Role>>(`/roles/${id}`, data),

  delete: (id: number) => client.delete<ApiResponse<null>>(`/roles/${id}`),

  syncPermissions: (id: number, permissions: string[]) =>
    client.put<ApiResponse<Role>>(`/roles/${id}/permissions`, { permissions }),
};

export const permissionApi = {
  catalog: () => client.get<ApiResponse<PermissionGroup[]>>('/permissions'),

  forUser: (userId: number) =>
    client.get<ApiResponse<UserPermissionsPayload>>(`/users/${userId}/permissions`),

  syncForUser: (userId: number, permissions: string[]) =>
    client.put<ApiResponse<unknown>>(`/users/${userId}/permissions`, { permissions }),

  syncRolesForUser: (userId: number, roles: string[]) =>
    client.put<ApiResponse<unknown>>(`/users/${userId}/roles`, { roles }),
};
