import type { ApiErrorShape } from '@/types/api';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = 'ApiError';
    this.status = shape.status;
    this.code = shape.code;
  }
}

// Normalizes an unknown thrown value into an ApiError. Real backend error-shape
// parsing arrives with the real API integration in a later phase.
export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  return new ApiError({ status: 0, code: 'UNKNOWN', message: 'Unexpected error' });
}
