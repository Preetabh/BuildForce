export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'STATUS_CHANGE'
  | 'ASSIGNMENT'
  | 'ROLE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'RESTORE'
  | 'ARCHIVE'
  | 'EXPORT';

export type AuditSeverity = 'INFO' | 'WARN' | 'CRITICAL' | 'SECURITY';
export type AuditStatus = 'SUCCESS' | 'FAILURE';

export interface AuditFieldDiff {
  field: string;
  label?: string;
  oldValue: any;
  newValue: any;
}

export interface AuditUserSnapshot {
  name: string;
  email: string;
  role: string;
}

export interface AuditDevice {
  browser: string;
  os: string;
  deviceType: string;
}

export interface AuditLog {
  _id: string;
  companyId: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | string | null;
  userSnapshot?: AuditUserSnapshot;
  action: AuditAction;
  module: string;
  entity: string;
  entityId: string;
  entityName?: string;
  summary?: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  diff?: AuditFieldDiff[];
  ipAddress?: string;
  userAgent?: string;
  device?: AuditDevice;
  session?: string;
  severity: AuditSeverity;
  status: AuditStatus;
  failureReason?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AuditQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  userIds?: string[];
  actions?: AuditAction[];
  modules?: string[];
  entities?: string[];
  entityId?: string;
  severity?: AuditSeverity | AuditSeverity[];
  status?: AuditStatus;
  ip?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface AuditStats {
  totalCount: number;
  criticalCount: number;
  securityCount: number;
  failureCount: number;
  successCount: number;
  byModule: Array<{ module: string; count: number }>;
  byAction: Array<{ action: string; count: number }>;
  bySeverity: Record<AuditSeverity, number>;
  timeline: Array<{ date: string; count: number; critical: number }>;
  topUsers: Array<{
    email: string;
    name: string;
    role: string;
    count: number;
  }>;
}
