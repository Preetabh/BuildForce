import api from './api';
import {
  DailySiteReportItem,
  DailyReportFilterParams,
  DailyReportSummaryStats,
  MissingSiteReportItem,
} from '../types/dailyReport';

export const dailyReportService = {
  getReports: async (
    params: DailyReportFilterParams = {}
  ): Promise<{
    reports: DailySiteReportItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
    stats: DailyReportSummaryStats;
  }> => {
    const res = await api.get('/daily-reports', { params });
    return {
      reports: res.data.data || [],
      pagination: res.data.pagination || { total: 0, page: 1, limit: 15, totalPages: 0, hasMore: false },
      stats: res.data.stats || {
        totalSites: 0,
        activeEngineers: 0,
        reportsSubmittedToday: 0,
        pendingReviews: 0,
        missingReportsToday: 0,
        sitesWithReportedIssues: 0,
      },
    };
  },

  getReportById: async (id: string): Promise<DailySiteReportItem> => {
    const res = await api.get(`/daily-reports/${id}`);
    return res.data.data;
  },

  createReport: async (data: any): Promise<DailySiteReportItem> => {
    const res = await api.post('/daily-reports', data);
    return res.data.data;
  },

  updateReport: async (id: string, data: any): Promise<DailySiteReportItem> => {
    const res = await api.patch(`/daily-reports/${id}`, data);
    return res.data.data;
  },

  reviewReport: async (
    id: string,
    reviewData: {
      status: 'Reviewed' | 'Needs Correction' | 'Approved';
      comments?: string;
      correctionRequested?: boolean;
      correctionDetails?: string;
    }
  ): Promise<DailySiteReportItem> => {
    const res = await api.post(`/daily-reports/${id}/review`, reviewData);
    return res.data.data;
  },

  getMissingReports: async (): Promise<MissingSiteReportItem[]> => {
    const res = await api.get('/daily-reports/missing');
    return res.data.data || [];
  },

  uploadFiles: async (
    files: File[]
  ): Promise<Array<{ url: string; name: string; size: number; type: string }>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const res = await api.post('/daily-reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data || [];
  },
};
