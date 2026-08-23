import type { ApiResponse, PaginatedResponse } from '@/types';
import client from './client';

export const calibrationApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<any>>('/calibration/sessions', { params }),
  get: (id: number) =>
    client.get<ApiResponse<any>>(`/calibration/sessions/${id}`),
  start: (data: Record<string, unknown>) =>
    client.post<ApiResponse<any>>('/calibration/sessions', data),
  addShot: (sessionId: number, data: Record<string, unknown>) =>
    client.post<ApiResponse<any>>(`/calibration/sessions/${sessionId}/shots`, data),
  finish: (sessionId: number) =>
    client.put<ApiResponse<any>>(`/calibration/sessions/${sessionId}/finish`),
  approve: (sessionId: number) =>
    client.put<ApiResponse<any>>(`/calibration/sessions/${sessionId}/approve`),
};
