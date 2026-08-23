import { Env } from '@/config/env';
import { parseApiError } from '@/api/errors';
import type { ApiResponse } from '@/types/api';

// Skeleton only. Real request/response handling, auth header injection, and
// retry logic are implemented when real backend integration is approved.
export async function apiRequest<T>(_path: string): Promise<ApiResponse<T>> {
  try {
    throw parseApiError(new Error('API client not yet implemented (Phase M0 skeleton)'));
  } catch (error) {
    throw parseApiError(error);
  }
}

export function getApiBaseUrl(): string {
  return Env.apiBaseUrl;
}
