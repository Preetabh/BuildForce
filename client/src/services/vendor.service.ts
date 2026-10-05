import api from './api';
import { VendorItem, WorkerItem } from '../types/vendor';

export interface VendorFilterQuery {
  search?: string;
  type?: string;
  status?: string;
}

export interface WorkerFilterQuery {
  search?: string;
  trade?: string;
  status?: string;
}

export const vendorService = {
  // Vendors
  getVendors: async (params?: VendorFilterQuery): Promise<VendorItem[]> => {
    const res = await api.get('/vendors', { params });
    return res.data?.data || [];
  },

  createVendor: async (data: Partial<VendorItem>): Promise<VendorItem> => {
    const res = await api.post('/vendors', data);
    return res.data?.data;
  },

  updateVendor: async (id: string, data: Partial<VendorItem>): Promise<VendorItem> => {
    const res = await api.put(`/vendors/${id}`, data);
    return res.data?.data;
  },

  toggleVendorStatus: async (id: string): Promise<VendorItem> => {
    const res = await api.patch(`/vendors/${id}/status`);
    return res.data?.data;
  },

  deleteVendor: async (id: string): Promise<void> => {
    await api.delete(`/vendors/${id}`);
  },

  // Workers
  getWorkers: async (params?: WorkerFilterQuery): Promise<WorkerItem[]> => {
    const res = await api.get('/workers', { params });
    return res.data?.data || [];
  },

  createWorker: async (data: Partial<WorkerItem>): Promise<WorkerItem> => {
    const res = await api.post('/workers', data);
    return res.data?.data;
  },

  updateWorker: async (id: string, data: Partial<WorkerItem>): Promise<WorkerItem> => {
    const res = await api.put(`/workers/${id}`, data);
    return res.data?.data;
  },

  toggleWorkerStatus: async (id: string): Promise<WorkerItem> => {
    const res = await api.patch(`/workers/${id}/status`);
    return res.data?.data;
  },

  deleteWorker: async (id: string): Promise<void> => {
    await api.delete(`/workers/${id}`);
  },
};

export default vendorService;
