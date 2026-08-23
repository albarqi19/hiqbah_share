import type { ApiResponse, WasteRecord, PaginatedResponse } from '@/types';
import client from './client';

export const wasteRecordApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<WasteRecord>>('/waste-records', { params }),

  summary: () =>
    client.get<ApiResponse<Record<string, unknown>>>('/waste-records/summary'),

  byCrop: (cropId: number) =>
    client.get<ApiResponse<WasteRecord[]>>(`/waste-records/crop/${cropId}`),
};
