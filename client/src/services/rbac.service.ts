import api from './api';
import { RbacMenuItem, RbacRole, SiteEngineerItem, RbacUserItem } from '../types/rbac';

export const rbacService = {
  // Menus / Navigation Architecture
  getMenus: async (): Promise<RbacMenuItem[]> => {
    const res = await api.get('/rbac/menus');
    return res.data?.data || [];
  },

  createMenu: async (data: Partial<RbacMenuItem>): Promise<RbacMenuItem> => {
    const res = await api.post('/rbac/menus', data);
    return res.data?.data;
  },

  updateMenu: async (id: string, data: Partial<RbacMenuItem>): Promise<RbacMenuItem> => {
    const res = await api.put(`/rbac/menus/${id}`, data);
    return res.data?.data;
  },

  deleteMenu: async (id: string): Promise<void> => {
    await api.delete(`/rbac/menus/${id}`);
  },

  // Roles & Permissions (Allow / Decline)
  getRoles: async (): Promise<RbacRole[]> => {
    const res = await api.get('/rbac/roles');
    return res.data?.data || [];
  },

  createRole: async (data: Partial<RbacRole>): Promise<RbacRole> => {
    const res = await api.post('/rbac/roles', data);
    return res.data?.data;
  },

  updateRole: async (id: string, data: Partial<RbacRole>): Promise<RbacRole> => {
    const res = await api.put(`/rbac/roles/${id}`, data);
    return res.data?.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await api.delete(`/rbac/roles/${id}`);
  },

  updateRolePermission: async (
    roleId: string,
    menuRoute: string,
    allow: boolean
  ): Promise<RbacRole> => {
    const res = await api.patch(`/rbac/roles/${roleId}/permission`, { menuRoute, allow });
    return res.data?.data;
  },

  batchUpdateRolePermissions: async (
    roleId: string,
    data: { allowAll?: boolean; permissions?: Record<string, boolean> } | boolean
  ): Promise<RbacRole> => {
    const payload = typeof data === 'boolean' ? { allowAll: data } : data;
    const res = await api.patch(`/rbac/roles/${roleId}/batch-permissions`, payload);
    return res.data?.data;
  },

  // Users & Role Vs User
  getUsers: async (): Promise<RbacUserItem[]> => {
    const res = await api.get('/rbac/users');
    return res.data?.data || [];
  },

  updateUserRoleAndPermissions: async (
    userId: string,
    data: { role?: string; permissions?: Record<string, boolean>; isActive?: boolean }
  ): Promise<RbacUserItem> => {
    const res = await api.put(`/rbac/users/${userId}`, data);
    return res.data?.data;
  },

  toggleUserStatus: async (userId: string): Promise<{ isActive: boolean }> => {
    const res = await api.patch(`/rbac/users/${userId}/toggle-status`);
    return res.data?.data;
  },

  createUser: async (data: Partial<RbacUserItem>): Promise<RbacUserItem> => {
    const res = await api.post('/rbac/users', data);
    return res.data?.data;
  },

  deleteUser: async (userId: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/rbac/users/${userId}`);
    return res.data?.data;
  },

  // Site Engineers
  getSiteEngineers: async (): Promise<SiteEngineerItem[]> => {
    const res = await api.get('/site-engineers');
    return res.data?.data || [];
  },

  createSiteEngineer: async (data: Partial<SiteEngineerItem>): Promise<SiteEngineerItem> => {
    const res = await api.post('/site-engineers', data);
    return res.data?.data;
  },

  updateSiteEngineer: async (
    id: string,
    data: Partial<SiteEngineerItem>
  ): Promise<SiteEngineerItem> => {
    const res = await api.put(`/site-engineers/${id}`, data);
    return res.data?.data;
  },

  toggleEngineerStatus: async (id: string): Promise<SiteEngineerItem> => {
    const res = await api.patch(`/site-engineers/${id}/toggle-status`);
    return res.data?.data;
  },

  updateEngineerWallet: async (
    id: string,
    amount: number,
    operation: 'add' | 'deduct' | 'set',
    notes?: string
  ): Promise<SiteEngineerItem> => {
    const res = await api.patch(`/site-engineers/${id}/wallet`, { amount, operation, notes });
    return res.data?.data;
  },

  deleteSiteEngineer: async (id: string): Promise<void> => {
    await api.delete(`/site-engineers/${id}`);
  },
};
