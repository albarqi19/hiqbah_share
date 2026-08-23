export interface ApiErrorShape {
  status: number;
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiErrorShape;
}
