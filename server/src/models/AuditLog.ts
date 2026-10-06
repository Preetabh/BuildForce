import mongoose, { Document, Schema, Types } from 'mongoose';

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

export interface IAuditFieldDiff {
  field: string;
  label?: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface IAuditUserSnapshot {
  name: string;
  email: string;
  role: string;
}

export interface IAuditDevice {
  browser: string;
  os: string;
  deviceType: string;
}

export interface IAuditLog extends Document {
  companyId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  userSnapshot?: IAuditUserSnapshot;
  action: AuditAction;
  module: string;
  entity: string;
  entityId: string;
  entityName?: string;
  summary?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  diff?: IAuditFieldDiff[];
  ipAddress?: string;
  userAgent?: string;
  device?: IAuditDevice;
  session?: string;
  severity: AuditSeverity;
  status: AuditStatus;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const auditFieldDiffSchema = new Schema<IAuditFieldDiff>(
  {
    field: { type: String, required: true },
    label: { type: String, default: '' },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const auditUserSnapshotSchema = new Schema<IAuditUserSnapshot>(
  {
    name: { type: String, default: 'System' },
    email: { type: String, default: 'system@buildforce360.internal' },
    role: { type: String, default: 'SYSTEM' },
  },
  { _id: false }
);

const auditDeviceSchema = new Schema<IAuditDevice>(
  {
    browser: { type: String, default: 'Unknown Browser' },
    os: { type: String, default: 'Unknown OS' },
    deviceType: { type: String, default: 'Desktop' },
  },
  { _id: false }
);

const auditLogSchema = new Schema<IAuditLog>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    userSnapshot: {
      type: auditUserSnapshotSchema,
      default: () => ({ name: 'System User', email: 'system@buildforce360.internal', role: 'SYSTEM' }),
    },
    action: {
      type: String,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'STATUS_CHANGE',
        'ASSIGNMENT',
        'ROLE_CHANGE',
        'PERMISSION_CHANGE',
        'RESTORE',
        'ARCHIVE',
        'EXPORT',
      ],
      required: true,
      index: true,
    },
    module: {
      type: String,
      required: true,
      default: 'GENERAL',
      index: true,
    },
    entity: {
      type: String,
      required: true,
      default: 'System',
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    entityName: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    oldValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    diff: {
      type: [auditFieldDiffSchema],
      default: [],
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    device: {
      type: auditDeviceSchema,
      default: () => ({ browser: 'Chrome', os: 'Windows', deviceType: 'Desktop' }),
    },
    session: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARN', 'CRITICAL', 'SECURITY'],
      default: 'INFO',
      index: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS',
      index: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// High-performance compound indexes for multi-faceted enterprise queries
auditLogSchema.index({ companyId: 1, timestamp: -1 });
auditLogSchema.index({ companyId: 1, userId: 1, timestamp: -1 });
auditLogSchema.index({ companyId: 1, module: 1, timestamp: -1 });
auditLogSchema.index({ companyId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ companyId: 1, entity: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ companyId: 1, severity: 1, timestamp: -1 });
auditLogSchema.index({ companyId: 1, status: 1, timestamp: -1 });
auditLogSchema.index({ companyId: 1, ipAddress: 1, timestamp: -1 });

// Immutability enforcement: audit logs must NEVER be modified or erased in place
auditLogSchema.pre('updateOne', function (next) {
  next(new Error('AuditLog documents are strictly immutable and cannot be updated.'));
});

auditLogSchema.pre('updateMany', function (next) {
  next(new Error('AuditLog documents are strictly immutable and cannot be updated.'));
});

auditLogSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('AuditLog documents are strictly immutable and cannot be updated.'));
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
