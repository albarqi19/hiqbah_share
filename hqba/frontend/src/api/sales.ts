import client from './client';
import type { ApiResponse, PaginatedResponse, Lead, Commission, CommissionRule, SalesRepDashboard, SalesManagerDashboard, Customer } from '@/types';

export const salesApi = {
  // Leads
  listLeads: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Lead>>('/leads', { params }),
  getLead: (id: number) =>
    client.get<ApiResponse<Lead>>(`/leads/${id}`),
  createLead: (data: Record<string, unknown>) =>
    client.post<ApiResponse<Lead>>('/leads', data),
  updateLead: (id: number, data: Record<string, unknown>) =>
    client.put<ApiResponse<Lead>>(`/leads/${id}`, data),
  transitionLead: (id: number, stage: string, notes?: string) =>
    client.put<ApiResponse<Lead>>(`/leads/${id}/transition`, { stage, notes }),
  convertLead: (id: number, customerData: Record<string, unknown>) =>
    client.post<ApiResponse<{ customer: Customer; lead: Lead }>>(`/leads/${id}/convert`, customerData),
  markLeadLost: (id: number, reason: string) =>
    client.put<ApiResponse<Lead>>(`/leads/${id}/mark-lost`, { reason }),
  getLeadFunnel: (salesRepId?: number) =>
    client.get<ApiResponse<Record<string, number>>>('/leads-funnel', { params: salesRepId ? { sales_rep_id: salesRepId } : {} }),

  // Customer Assignment
  assignRep: (customerId: number, repId: number) =>
    client.put<ApiResponse<Customer>>(`/customers/${customerId}/assign-rep`, { sales_rep_id: repId }),
  bulkAssignRep: (customerIds: number[], repId: number) =>
    client.post<ApiResponse<Customer[]>>('/customers/bulk-assign-rep', { customer_ids: customerIds, sales_rep_id: repId }),
  getRepCustomers: (repId: number, params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Customer>>(`/sales-reps/${repId}/customers`, { params }),

  // Commissions
  listCommissions: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Commission>>('/commissions', { params }),
  getCommission: (id: number) =>
    client.get<ApiResponse<Commission>>(`/commissions/${id}`),
  approveCommission: (id: number) =>
    client.put<ApiResponse<Commission>>(`/commissions/${id}/approve`),
  rejectCommission: (id: number, reason: string) =>
    client.put<ApiResponse<Commission>>(`/commissions/${id}/reject`, { reason }),
  markCommissionPaid: (id: number, paymentReference?: string) =>
    client.put<ApiResponse<Commission>>(`/commissions/${id}/mark-paid`, { payment_reference: paymentReference }),
  bulkApprove: (ids: number[]) =>
    client.post<ApiResponse<Commission[]>>('/commissions/bulk-approve', { commission_ids: ids }),
  bulkMarkPaid: (ids: number[], paymentReference?: string) =>
    client.post<ApiResponse<Commission[]>>('/commissions/bulk-mark-paid', { commission_ids: ids, payment_reference: paymentReference }),

  // Commission Rules
  listRules: () =>
    client.get<ApiResponse<CommissionRule[]>>('/commission-rules'),
  createRule: (data: Record<string, unknown>) =>
    client.post<ApiResponse<CommissionRule>>('/commission-rules', data),
  updateRule: (id: number, data: Record<string, unknown>) =>
    client.put<ApiResponse<CommissionRule>>(`/commission-rules/${id}`, data),

  // Dashboards
  getRepDashboard: () =>
    client.get<ApiResponse<SalesRepDashboard>>('/sales/my-dashboard'),
  getManagerDashboard: () =>
    client.get<ApiResponse<SalesManagerDashboard>>('/sales/manager-dashboard'),
  getRepPerformance: (repId: number, params?: Record<string, unknown>) =>
    client.get<ApiResponse<SalesRepDashboard>>(`/sales/rep-performance/${repId}`, { params }),
};
