import mongoose, { Document, Schema, Types } from 'mongoose';

export type DailyReportStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Needs Correction' | 'Approved';

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
  timestamp?: Date;
}

export interface IReportDocument {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface IReportHistoryEntry {
  action: string; // 'Created', 'Submitted', 'Corrected', 'Reviewed', 'Correction Requested', 'Approved'
  performedBy: Types.ObjectId;
  performerName: string;
  performerRole: string;
  timestamp: Date;
  previousStatus?: string;
  newStatus?: string;
  comments?: string;
  changesSummary?: string;
}

export interface IDailySiteReport extends Document {
  companyId: Types.ObjectId;
  projectId?: Types.ObjectId;
  clientId?: Types.ObjectId;
  clientCode?: string;
  siteEngineerId: Types.ObjectId;
  engineerUserId?: Types.ObjectId;
  engineerName: string;
  reportNumber: string;
  reportDate: Date; // Normalized to YYYY-MM-DD
  weather: string; // e.g. Sunny, Clear, Rainy, Cloudy, Extreme Heat
  workingConditions: string; // Normal Operations, Partial Delay, Halted
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
  submissionTimestamp?: Date;
  adminReview?: {
    reviewedBy?: Types.ObjectId;
    reviewerName?: string;
    reviewedAt?: Date;
    status: DailyReportStatus;
    comments?: string;
    correctionRequested?: boolean;
    correctionDetails?: string;
  };
  history: IReportHistoryEntry[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const dailySiteReportSchema = new Schema<IDailySiteReport>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientAccount',
      default: null,
      index: true,
    },
    clientCode: {
      type: String,
      default: '',
      trim: true,
    },
    siteEngineerId: {
      type: Schema.Types.ObjectId,
      ref: 'SiteEngineer',
      required: [true, 'Site Engineer is required'],
      index: true,
    },
    engineerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    engineerName: {
      type: String,
      required: true,
      trim: true,
    },
    reportNumber: {
      type: String,
      required: true,
      trim: true,
    },
    reportDate: {
      type: Date,
      required: [true, 'Report date is required'],
      index: true,
    },
    weather: {
      type: String,
      default: 'Sunny / Clear',
      trim: true,
    },
    workingConditions: {
      type: String,
      default: 'Normal Operations',
      trim: true,
    },
    workersCount: {
      type: Number,
      required: [true, 'Number of workers present is required'],
      min: 0,
      default: 0,
    },
    workersBreakdown: {
      skilled: { type: Number, default: 0 },
      unskilled: { type: Number, default: 0 },
      masons: { type: Number, default: 0 },
      carpenters: { type: Number, default: 0 },
      helpers: { type: Number, default: 0 },
      others: { type: Number, default: 0 },
      notes: { type: String, default: '' },
    },
    workCompletedToday: {
      type: String,
      required: [true, 'Work completed today is required'],
      trim: true,
    },
    workPlannedTomorrow: {
      type: String,
      required: [true, 'Work planned for next day is required'],
      trim: true,
    },
    materialsReceived: [
      {
        materialName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        supplier: { type: String, default: '' },
        invoiceNo: { type: String, default: '' },
      },
    ],
    materialsConsumed: [
      {
        materialName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        notes: { type: String, default: '' },
      },
    ],
    equipmentUsed: [
      {
        equipmentName: { type: String, required: true },
        count: { type: Number, default: 1 },
        hoursOperated: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['Operational', 'Breakdown', 'Idle', 'Standby', 'operational', 'breakdown', 'idle', 'standby'],
          default: 'Operational',
        },
      },
    ],
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    safetyInspection: {
      safetyGearCompliance: { type: Boolean, default: true },
      incidentsCount: { type: Number, default: 0 },
      incidentDetails: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    issuesAndDelays: {
      type: String,
      default: '',
      trim: true,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    photos: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        originalName: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    documents: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        size: { type: Number, default: 0 },
        type: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Reviewed', 'Needs Correction', 'Approved'],
      default: 'Submitted',
      index: true,
    },
    submissionTimestamp: {
      type: Date,
      default: null,
    },
    adminReview: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reviewerName: { type: String, default: '' },
      reviewedAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Reviewed', 'Needs Correction', 'Approved'],
        default: 'Submitted',
      },
      comments: { type: String, default: '' },
      correctionRequested: { type: Boolean, default: false },
      correctionDetails: { type: String, default: '' },
    },
    history: [
      {
        action: { type: String, required: true },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        performerName: { type: String, default: 'Authorized User' },
        performerRole: { type: String, default: 'USER' },
        timestamp: { type: Date, default: Date.now },
        previousStatus: { type: String },
        newStatus: { type: String },
        comments: { type: String },
        changesSummary: { type: String },
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
dailySiteReportSchema.index({ companyId: 1, projectId: 1, reportDate: 1 });
dailySiteReportSchema.index({ companyId: 1, clientId: 1, reportDate: 1 });
dailySiteReportSchema.index({ companyId: 1, siteEngineerId: 1, reportDate: -1 });
dailySiteReportSchema.index({ companyId: 1, status: 1 });
dailySiteReportSchema.index({ companyId: 1, createdAt: -1 });

export const DailySiteReport = mongoose.model<IDailySiteReport>('DailySiteReport', dailySiteReportSchema);
