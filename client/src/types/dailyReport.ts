export type DailyReportStatus =
  | 'Draft'
  | 'Submitted'
  | 'Reviewed'
  | 'Needs Correction'
  | 'Approved';

export interface IMaterialReceived {
  materialName: string;
  quantity: number;
  unit: string;
  supplier?: string;
  invoiceNo?: string;
}

export interface IMaterialConsumed {
  materialName: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface IEquipmentUsed {
  equipmentName: string;
  count: number;
  hoursOperated: number;
  status: 'Operational' | 'Breakdown' | 'Idle';
}

export interface IReportPhoto {
  url: string;
  caption?: string;
  originalName?: string;
  timestamp?: string;
}

export interface IReportDocument {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface IReportHistoryEntry {
  action: string;
  performedBy?: string;
  performerName: string;
  performerRole: string;
  timestamp: string;
  previousStatus?: string;
  newStatus?: string;
  comments?: string;
  changesSummary?: string;
}

export interface DailySiteReportItem {
  _id: string;
  companyId: string;
  projectId?: {
    _id: string;
    name: string;
    code: string;
    location?: string;
    clientName?: string;
    status?: string;
    progress?: number;
    startDate?: string;
    endDate?: string;
  };
  clientId?: {
    _id: string;
    name: string;
    clientCode: string;
    siteLocation?: string;
    phone?: string;
    services?: string;
    agreedAmount?: number;
    paidAmount?: number;
  };
  clientCode?: string;
  siteEngineerId: {
    _id: string;
    name: string;
    loginId: string;
    mobile?: string;
    expertise?: string;
  };
  engineerUserId?: string;
  engineerName: string;
  reportNumber: string;
  reportDate: string;
  weather: string;
  workingConditions: string;
  workersCount: number;
  workersBreakdown?: {
    skilled?: number;
    unskilled?: number;
    masons?: number;
    carpenters?: number;
    helpers?: number;
    others?: number;
    notes?: string;
  };
  workCompletedToday: string;
  workPlannedTomorrow: string;
  materialsReceived: IMaterialReceived[];
  materialsConsumed: IMaterialConsumed[];
  equipmentUsed: IEquipmentUsed[];
  progressPercentage: number;
  safetyInspection: {
    safetyGearCompliance: boolean;
    incidentsCount: number;
    incidentDetails?: string;
    notes?: string;
  };
  issuesAndDelays: string;
  remarks: string;
  photos: IReportPhoto[];
  documents: IReportDocument[];
  status: DailyReportStatus;
  submissionTimestamp?: string;
  adminReview?: {
    reviewedBy?: {
      _id: string;
      name: string;
      email: string;
    };
    reviewerName?: string;
    reviewedAt?: string;
    status: DailyReportStatus;
    comments?: string;
    correctionRequested?: boolean;
    correctionDetails?: string;
  };
  history: IReportHistoryEntry[];
  version: number;
  previousReport?: {
    reportNumber: string;
    reportDate: string;
    progressPercentage: number;
    workCompletedToday: string;
    workersCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportFilterParams {
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

export interface MissingSiteReportItem {
  _id: string;
  name: string;
  code: string;
  location?: string;
  clientName?: string;
  status: string;
  progress: number;
  assignedEngineers?: Array<{
    _id: string;
    name: string;
    loginId: string;
    mobile?: string;
  }>;
  deadline: string;
  isOverdue: boolean;
}
