import api from './api';
import {
  LeadItem,
  LeadStats,
  PartnerItem,
  ClientRecord,
  PaymentItem,
  CommissionItem,
  PaginationMeta,
} from '../types';

export interface LeadFilterQuery {
  search?: string;
  statusMode?: 'NonDead' | 'Dead' | 'All';
  companyCode?: string;
  service?: string;
  startDate?: string;
  endDate?: string;
  stage?: string;
  priority?: string;
  view?: 'list' | 'today-due' | 'process';
  page?: number;
  limit?: number;
}

export interface LeadsResponse {
  success: boolean;
  leads: LeadItem[];
  pagination: PaginationMeta;
  stats: LeadStats;
}

export const leadService = {
  // Get leads
  getLeads: async (params: LeadFilterQuery = {}): Promise<LeadsResponse> => {
    const res = await api.get('/leads', { params });
    return res.data;
  },

  // Get lead stats
  getStats: async (): Promise<LeadStats> => {
    const res = await api.get('/leads/stats');
    return res.data.data;
  },

  // Get single lead
  getLeadById: async (id: string): Promise<LeadItem> => {
    const res = await api.get(`/leads/${id}`);
    return res.data.data;
  },

  // Create lead
  createLead: async (leadData: Partial<LeadItem>): Promise<LeadItem> => {
    const res = await api.post('/leads', leadData);
    return res.data.data;
  },

  // Update lead
  updateLead: async (id: string, updateData: Partial<LeadItem>): Promise<LeadItem> => {
    const res = await api.put(`/leads/${id}`, updateData);
    return res.data.data;
  },

  // Delete single lead
  deleteLead: async (id: string): Promise<void> => {
    await api.delete(`/leads/${id}`);
  },

  // Delete all leads
  deleteAllLeads: async (): Promise<void> => {
    await api.delete('/leads/all');
  },

  // Add follow-up
  addFollowUp: async (
    id: string,
    data: {
      date: string;
      remarks: string;
      status?: string;
      stage?: string;
      isDead?: boolean;
    }
  ): Promise<LeadItem> => {
    const res = await api.post(`/leads/${id}/follow-up`, data);
    return res.data.data;
  },

  // Mark lead dead
  markDead: async (id: string, reason: string): Promise<LeadItem> => {
    const res = await api.post(`/leads/${id}/mark-dead`, { reason });
    return res.data.data;
  },

  // Restore lead from dead
  restoreDead: async (id: string): Promise<LeadItem> => {
    const res = await api.post(`/leads/${id}/restore`);
    return res.data.data;
  },

  // Convert to registered client
  convertToClient: async (
    id: string,
    clientData: any
  ): Promise<{ lead: LeadItem; client: ClientRecord }> => {
    const res = await api.post(`/leads/${id}/convert-client`, clientData);
    return res.data.data;
  },

  // Clients
  getClients: async (search?: string): Promise<ClientRecord[]> => {
    const res = await api.get('/leads/clients/all', { params: { search } });
    return res.data.data;
  },

  // Payments
  getPayments: async (search?: string): Promise<PaymentItem[]> => {
    const res = await api.get('/leads/payments/all', { params: { search } });
    return res.data.data;
  },

  recordPayment: async (paymentData: Partial<PaymentItem>): Promise<PaymentItem> => {
    const res = await api.post('/leads/payments/pay', paymentData);
    return res.data.data;
  },

  // Partners
  getPartners: async (): Promise<PartnerItem[]> => {
    const res = await api.get('/leads/partners/all');
    return res.data.data;
  },

  createPartner: async (partnerData: Partial<PartnerItem>): Promise<PartnerItem> => {
    const res = await api.post('/leads/partners/create', partnerData);
    return res.data.data;
  },

  deletePartner: async (partnerId: string): Promise<void> => {
    await api.delete(`/leads/partners/${partnerId}`);
  },

  deleteAllPartners: async (): Promise<void> => {
    await api.delete('/leads/partners/all');
  },

  // Commission Reports
  getCommissionReports: async (partnerId?: string): Promise<{ reports: CommissionItem[]; summary: any }> => {
    const res = await api.get('/leads/commissions/report', { params: { partnerId } });
    return res.data.data;
  },

  // Seed / Reset real data
  seedRealData: async (): Promise<void> => {
    await api.post('/leads/seed');
  },
};

export default leadService;
