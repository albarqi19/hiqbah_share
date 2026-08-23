import type { ApiResponse, Recipe, EspressoRecipeTrial, PourOverRecipeData, PaginatedResponse } from '@/types';
import client from './client';

export const recipeApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Recipe>>('/recipes', { params }),

  get: (id: number) =>
    client.get<ApiResponse<Recipe>>(`/recipes/${id}`),

  create: (data: Record<string, unknown>) =>
    client.post<ApiResponse<Recipe>>('/recipes', data),

  update: (id: number, data: Record<string, unknown>) =>
    client.put<ApiResponse<Recipe>>(`/recipes/${id}`, data),

  delete: (id: number) =>
    client.delete<ApiResponse<null>>(`/recipes/${id}`),

  addTrial: (recipeId: number, data: Record<string, unknown>) =>
    client.post<ApiResponse<EspressoRecipeTrial>>(`/recipes/${recipeId}/espresso-trials`, data),

  selectBestShot: (recipeId: number, trialId: number) =>
    client.post<ApiResponse<Recipe>>(`/recipes/${recipeId}/select-best-shot`, { trial_id: trialId }),

  savePourOver: (recipeId: number, data: Record<string, unknown>) =>
    client.post<ApiResponse<PourOverRecipeData>>(`/recipes/${recipeId}/pour-over`, data),

  createVersion: (recipeId: number) =>
    client.post<ApiResponse<Recipe>>(`/recipes/${recipeId}/create-version`),

  approve: (recipeId: number) =>
    client.post<ApiResponse<Recipe>>(`/recipes/${recipeId}/approve`),

  publish: (recipeId: number) =>
    client.post<ApiResponse<Recipe>>(`/recipes/${recipeId}/publish`),
};
