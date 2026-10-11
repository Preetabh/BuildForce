import { DailyReportStatus } from '../../models/DailySiteReport';

export interface DailyReportFilterQuery {
  projectId?: string;
  clientId?: string;
  siteEngineerId?: string;
  status?: DailyReportStatus | 'All';
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DailyReportSummaryStats {
  totalSites: number;
  activeEngineers: number;
  reportsSubmittedToday: number;
  pendingReviews: number;
  missingReportsToday: number;
  sitesWithReportedIssues: number;
}
