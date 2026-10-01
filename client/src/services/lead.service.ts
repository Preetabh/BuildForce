import api from './api';
import {
  LeadItem,
  LeadStats,
  PartnerItem,
  ClientRecord,
  PaymentItem,
  CommissionItem,
  PartnerPayoutItem,
  ClientDossier,
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

export interface ClientFilterQuery {
  search?: string;
  statusMode?: 'NonDead' | 'Dead' | 'All';
  feeStatus?: 'All' | 'Paid' | 'Pending';
  company?: string;
  service?: string;
  startDate?: string;
  endDate?: string;
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
  getClients: async (params: ClientFilterQuery = {}): Promise<ClientRecord[]> => {
    const res = await api.get('/leads/clients/all', { params });
    return res.data.data;
  },

  getClientById: async (id: string): Promise<ClientRecord> => {
    const res = await api.get(`/leads/clients/${id}`);
    return res.data.data;
  },

  updateClient: async (id: string, updateData: Partial<ClientRecord>): Promise<ClientRecord> => {
    const res = await api.put(`/leads/clients/${id}`, updateData);
    return res.data.data;
  },

  addClientFollowUp: async (
    id: string,
    data: { date: string; remarks: string; status?: string }
  ): Promise<ClientRecord> => {
    const res = await api.post(`/leads/clients/${id}/follow-up`, data);
    return res.data.data;
  },

  markClientDead: async (id: string, reason?: string): Promise<ClientRecord> => {
    const res = await api.post(`/leads/clients/${id}/mark-dead`, { reason });
    return res.data.data;
  },

  restoreClientDead: async (id: string): Promise<ClientRecord> => {
    const res = await api.post(`/leads/clients/${id}/restore`);
    return res.data.data;
  },

  deleteClient: async (id: string): Promise<void> => {
    await api.delete(`/leads/clients/${id}`);
  },

  seedClients: async (): Promise<ClientRecord[]> => {
    const res = await api.post('/leads/clients/seed');
    return res.data.data;
  },

  saveLedgerSchedule: async (
    id: string,
    estimator: any,
    stages?: any[]
  ): Promise<ClientRecord> => {
    const res = await api.post(`/leads/clients/${id}/ledger`, { estimator, stages });
    return res.data.data;
  },

  payLedgerStage: async (
    id: string,
    stageId: string,
    amount?: number,
    paymentMode?: string,
    referenceNo?: string
  ): Promise<ClientRecord> => {
    const res = await api.post(`/leads/clients/${id}/pay-stage`, {
      stageId,
      amount,
      paymentMode,
      referenceNo,
    });
    return res.data.data;
  },

  submitDpr: async (
    id: string,
    dprData: {
      workCompletedToday: string;
      materialsUsed?: string;
      nextDayPlan?: string;
      siteKharcha?: { labourCost: number; materialCost: number };
      sitePhotos?: string[];
    }
  ): Promise<ClientRecord> => {
    const res = await api.post(`/leads/clients/${id}/dpr`, dprData);
    return res.data.data;
  },

  // Payments
  getPayments: async (params?: { search?: string; startDate?: string; endDate?: string; limit?: number } | string): Promise<PaymentItem[]> => {
    const queryParams = typeof params === 'string' ? { search: params } : params;
    const res = await api.get('/leads/payments/all', { params: queryParams });
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

  // Commission Reports & Approval
  getCommissionReports: async (partnerId?: string): Promise<{ reports: CommissionItem[]; summary: any }> => {
    const res = await api.get('/leads/commissions/report', { params: { partnerId } });
    return res.data.data;
  },

  approveCommission: async (commissionId: string): Promise<CommissionItem> => {
    const res = await api.post(`/leads/commissions/${commissionId}/approve`);
    return res.data.data;
  },

  // Partner Payouts (Pay Amount to Partner)
  processPayout: async (payoutData: {
    partnerId: string;
    commissionId?: string;
    amount: number;
    paymentMode?: string;
    transactionRef?: string;
    notes?: string;
  }): Promise<{ payout: PartnerPayoutItem; commission?: CommissionItem }> => {
    const res = await api.post('/leads/payouts/pay', payoutData);
    return res.data.data;
  },

  getPayouts: async (params?: { partnerId?: string; search?: string }): Promise<PartnerPayoutItem[]> => {
    const res = await api.get('/leads/payouts/all', { params });
    return res.data.data;
  },

  // Client Dossier (Client → Lead → Payments → Partner → Commission → Payouts)
  getClientDossier: async (clientId: string): Promise<ClientDossier> => {
    const res = await api.get(`/leads/clients/${clientId}/dossier`);
    return res.data.data;
  },

  // Clear / Reset data
  deleteAllClients: async (): Promise<void> => {
    await api.delete('/leads/clients/all');
  },

  removeAllData: async (): Promise<any> => {
    const res = await api.post('/leads/clear-all');
    return res.data;
  },

  // Seed / Reset real data
  seedRealData: async (): Promise<void> => {
    await api.post('/leads/seed');
  },
};

export default leadService;
