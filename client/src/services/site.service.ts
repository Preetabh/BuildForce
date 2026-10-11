import api from './api';
import { Project } from '../types';

export const siteService = {
  getSites: async (params: Record<string, any> = {}): Promise<{
    projects: Project[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> => {
    const res = await api.get('/projects', { params });
    return {
      projects: res.data.data || [],
      pagination: res.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 0, hasMore: false },
    };
  },

  getSiteById: async (id: string): Promise<Project> => {
    const res = await api.get(`/projects/${id}`);
    return res.data.data;
  },

  createSite: async (data: Partial<Project> & { assignedEngineers?: string[] }): Promise<Project> => {
    const res = await api.post('/projects', data);
    return res.data.data;
  },

  updateSite: async (
    id: string,
    data: Partial<Project> & { assignedEngineers?: string[] }
  ): Promise<Project> => {
    const res = await api.patch(`/projects/${id}`, data);
    return res.data.data;
  },

  deleteSite: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};
