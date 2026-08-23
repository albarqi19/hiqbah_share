import type {
  ApiResponse,
  Crop,
  GreenCoffeeLot,
  GreenCoffeeInspection,
  TrialRoast,
  CuppingSession,
  CropPricing,
  CropMarketing,
  TimelineEvent,
  PaginatedResponse,
} from '@/types';
import client from './client';

export const cropApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Crop>>('/crops', { params }),

  get: (id: number) =>
    client.get<ApiResponse<Crop>>(`/crops/${id}`),

  create: (data: Record<string, unknown>) =>
    client.post<ApiResponse<Crop>>('/crops', data),

  update: (id: number, data: Record<string, unknown>) =>
    client.put<ApiResponse<Crop>>(`/crops/${id}`, data),

  delete: (id: number) =>
    client.delete<ApiResponse<null>>(`/crops/${id}`),

  getTimeline: (id: number) =>
    client.get<ApiResponse<TimelineEvent[]>>(`/crops/${id}/timeline`),

  getTraceability: (id: number) =>
    client.get<ApiResponse<any>>(`/crops/${id}/traceability`),

  getQrCode: (id: number) =>
    client.get<ApiResponse<{ url: string; svg: string; serial_number: string }>>(`/crops/${id}/qr-code`),

  greenCoffee: {
    receive: (data: Record<string, unknown>) =>
      client.post<ApiResponse<GreenCoffeeLot>>('/green-coffee/receive', data),

    listLots: (params?: Record<string, unknown>) =>
      client.get<PaginatedResponse<GreenCoffeeLot>>('/green-coffee/lots', { params }),

    inspect: (lotId: number, data: Record<string, unknown>) =>
      client.post<ApiResponse<GreenCoffeeInspection>>(`/green-coffee/${lotId}/inspect`, data),

    decide: (inspectionId: number, data: Record<string, unknown>) =>
      client.put<ApiResponse<GreenCoffeeInspection>>(`/green-coffee/inspections/${inspectionId}/decide`, data),
  },

  trialRoasts: {
    list: (cropId: number) =>
      client.get<ApiResponse<TrialRoast[]>>(`/crops/${cropId}/trial-roasts`),

    create: (cropId: number, data: Record<string, unknown>) =>
      client.post<ApiResponse<TrialRoast>>(`/crops/${cropId}/trial-roasts`, data),

    complete: (trialId: number, data: Record<string, unknown>) =>
      client.post<ApiResponse<TrialRoast>>(`/trial-roasts/${trialId}/complete`, data),

    select: (trialId: number) =>
      client.post<ApiResponse<TrialRoast>>(`/trial-roasts/${trialId}/select`),
  },

  cupping: {
    list: (cropId: number) =>
      client.get<ApiResponse<CuppingSession[]>>(`/crops/${cropId}/cupping-sessions`),

    create: (cropId: number, data: Record<string, unknown>) =>
      client.post<ApiResponse<CuppingSession>>(`/crops/${cropId}/cupping-sessions`, data),

    complete: (sessionId: number, data: Record<string, unknown>) =>
      client.post<ApiResponse<CuppingSession>>(`/cupping-sessions/${sessionId}/complete`, data),

    decide: (sessionId: number, data: Record<string, unknown>) =>
      client.post<ApiResponse<CuppingSession>>(`/cupping-sessions/${sessionId}/decide`, data),
  },

  pricing: {
    get: (cropId: number) =>
      client.get<ApiResponse<CropPricing>>(`/crops/${cropId}/pricing`),

    create: (cropId: number, data: Record<string, unknown>) =>
      client.post<ApiResponse<CropPricing>>(`/crops/${cropId}/pricing`, data),

    update: (cropId: number, data: Record<string, unknown>) =>
      client.put<ApiResponse<CropPricing>>(`/crops/${cropId}/pricing`, data),

    approve: (cropId: number) =>
      client.post<ApiResponse<CropPricing>>(`/crops/${cropId}/pricing/approve`),
  },

  marketing: {
    get: (cropId: number) =>
      client.get<ApiResponse<CropMarketing>>(`/crops/${cropId}/marketing`),

    create: (cropId: number, data: Record<string, unknown>) =>
      client.post<ApiResponse<CropMarketing>>(`/crops/${cropId}/marketing`, data),

    update: (cropId: number, data: Record<string, unknown>) =>
      client.put<ApiResponse<CropMarketing>>(`/crops/${cropId}/marketing`, data),

    approve: (cropId: number) =>
      client.post<ApiResponse<CropMarketing>>(`/crops/${cropId}/marketing/approve`),

    generateLabel: (cropId: number) =>
      client.post<ApiResponse<{ label_url: string }>>(`/crops/${cropId}/marketing/generate-label`),

    exportText: (cropId: number) =>
      client.get<ApiResponse<{ text: string; filename: string }>>(`/crops/${cropId}/marketing/export`),
  },
};
