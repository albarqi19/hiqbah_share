import type { ApiResponse, Setting } from '@/types';
import client from './client';

export const settingsApi = {
  list: (group?: string) =>
    client.get<ApiResponse<Setting[]>>('/settings', { params: group ? { group } : {} }),

  update: (settings: Array<{ key: string; value: unknown; group?: string; type?: string }>) =>
    client.put<ApiResponse<Setting[]>>('/settings', { settings }),
};
