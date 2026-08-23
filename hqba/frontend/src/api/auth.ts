import type { ApiResponse, LoginFormData, LoginResponse, PinLoginFormData, User } from '@/types';
import client from './client';

export const authApi = {
  login: (data: LoginFormData) =>
    client.post<ApiResponse<LoginResponse>>('/auth/login', data),

  pinLogin: (data: PinLoginFormData) =>
    client.post<ApiResponse<LoginResponse>>('/auth/pin-login', data),

  getUser: () =>
    client.get<ApiResponse<User>>('/auth/user'),

  logout: () =>
    client.post<ApiResponse<null>>('/auth/logout'),
};
