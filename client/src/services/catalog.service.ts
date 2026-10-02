import api from './api';

export interface ServiceCatalogItem {
  _id: string;
  companyId: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const catalogService = {
  getServices: async (activeOnly = false): Promise<ServiceCatalogItem[]> => {
    const res = await api.get('/services', { params: { activeOnly } });
    return res.data.data || [];
  },

  getActiveServices: async (): Promise<ServiceCatalogItem[]> => {
    const res = await api.get('/services', { params: { activeOnly: true } });
    const list: ServiceCatalogItem[] = res.data.data || [];
    return list.filter((s) => s.isActive === true);
  },

  createService: async (data: { name: string; description?: string; isActive?: boolean }): Promise<ServiceCatalogItem> => {
    const res = await api.post('/services', data);
    return res.data.data;
  },

  updateService: async (id: string, data: Partial<ServiceCatalogItem>): Promise<ServiceCatalogItem> => {
    const res = await api.put(`/services/${id}`, data);
    return res.data.data;
  },

  toggleService: async (id: string): Promise<ServiceCatalogItem> => {
    const res = await api.patch(`/services/${id}/toggle`);
    return res.data.data;
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};

export default catalogService;
