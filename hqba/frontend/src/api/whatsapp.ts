import type {
  ApiResponse,
  PaginatedResponse,
  WhatsappInstance,
  WhatsappMessage,
} from '@/types';
import client from './client';

export const whatsappApi = {
  listInstances: () =>
    client.get<ApiResponse<WhatsappInstance[]>>('/whatsapp/instances'),

  createInstance: (data: { name?: string; display_name?: string; is_default?: boolean }) =>
    client.post<ApiResponse<WhatsappInstance>>('/whatsapp/instances', data),

  getInstance: (id: number) =>
    client.get<ApiResponse<WhatsappInstance>>(`/whatsapp/instances/${id}`),

  getQr: (id: number) =>
    client.get<ApiResponse<{ qr_code: string | null; status: string; last_qr_at: string | null }>>(
      `/whatsapp/instances/${id}/qr`,
    ),

  status: (id: number) =>
    client.get<ApiResponse<WhatsappInstance>>(`/whatsapp/instances/${id}/status`),

  deleteInstance: (id: number) =>
    client.post<ApiResponse<null>>(`/whatsapp/instances/${id}/delete`),

  send: (data: { phone: string; message: string; instance_id?: number }) =>
    client.post<ApiResponse<WhatsappMessage>>('/whatsapp/send', data),

  messages: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<WhatsappMessage>>('/whatsapp/messages', { params }),
};
