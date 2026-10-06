import api from './api';
import { AuditLog, AuditPagination, AuditQueryParams, AuditStats } from '../types/audit';

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: AuditPagination;
}

export class AuditService {
  /**
   * Search and filter enterprise audit logs
   */
  public static async getLogs(params: AuditQueryParams = {}): Promise<AuditLogsResponse> {
    const queryParams: Record<string, any> = { ...params };

    if (params.actions && params.actions.length > 0) {
      queryParams.actions = params.actions.join(',');
    }
    if (params.modules && params.modules.length > 0) {
      queryParams.modules = params.modules.join(',');
    }
    if (params.entities && params.entities.length > 0) {
      queryParams.entities = params.entities.join(',');
    }
    if (Array.isArray(params.severity) && params.severity.length > 0) {
      queryParams.severity = params.severity.join(',');
    }

    const res = await api.get('/audit', { params: queryParams });
    return {
      logs: res.data?.data || [],
      pagination: res.data?.pagination || {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 1,
        hasMore: false,
      },
    };
  }

  /**
   * Get audit statistics and timeline analytics
   */
  public static async getStats(range?: { startDate?: string; endDate?: string }): Promise<AuditStats> {
    const res = await api.get('/audit/stats', { params: range });
    return res.data?.data;
  }

  /**
   * Get audit log history for a specific user (profile activity)
   */
  public static async getUserLogs(userId: string = 'me', limit: number = 50): Promise<AuditLog[]> {
    const res = await api.get(`/audit/user/${userId}`, { params: { limit } });
    return res.data?.data || [];
  }

  /**
   * Get audit history for a specific entity (Vendor, Project, Role, Worker, etc.)
   */
  public static async getEntityLogs(entity: string, entityId: string, limit: number = 50): Promise<AuditLog[]> {
    const res = await api.get(`/audit/entity/${entity}/${entityId}`, { params: { limit } });
    return res.data?.data || [];
  }

  /**
   * Get single audit log details with related context
   */
  public static async getLogById(id: string): Promise<{ log: AuditLog; related: AuditLog[] }> {
    const res = await api.get(`/audit/${id}`);
    return {
      log: res.data?.data,
      related: res.data?.related || [],
    };
  }

  /**
   * Download exported audit logs in CSV or JSON format
   */
  public static async exportLogs(format: 'csv' | 'json' = 'csv', params: AuditQueryParams = {}): Promise<void> {
    const queryParams: Record<string, any> = { ...params, format };
    if (params.actions && params.actions.length > 0) {
      queryParams.actions = params.actions.join(',');
    }
    if (params.modules && params.modules.length > 0) {
      queryParams.modules = params.modules.join(',');
    }

    const res = await api.get('/audit/export', {
      params: queryParams,
      responseType: 'blob',
    });

    const blob = new Blob([res.data], {
      type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `buildforce360-audit-logs-${new Date().toISOString().slice(0, 10)}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default AuditService;
