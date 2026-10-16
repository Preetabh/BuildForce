import mongoose, { Document, Schema, Types } from 'mongoose';

export type RecycleBinEntityType =
  | 'Project'
  | 'SiteEngineer'
  | 'Lead'
  | 'Client'
  | 'Partner'
  | 'User'
  | 'Service'
  | 'Vendor'
  | 'Worker'
  | string;

export interface IRecycleBinItem extends Document {
  companyId: Types.ObjectId;
  entityType: RecycleBinEntityType;
  originalId: Types.ObjectId;
  title: string;
  code?: string;
  subtitle?: string;
  data: any; // Full JSON snapshot of deleted entity
  deletedBy?: Types.ObjectId;
  deletedByName?: string;
  deletedAt: Date;
  retentionDays: number;
  expiresAt: Date;
  status: 'active' | 'restored' | 'purged';
  restoredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const recycleBinItemSchema = new Schema<IRecycleBinItem>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    originalId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      default: '',
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedByName: {
      type: String,
      default: 'Admin',
    },
    deletedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    retentionDays: {
      type: Number,
      default: 60, // Exactly 60-day safety retention
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from deletion
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'restored', 'purged'],
      default: 'active',
      index: true,
    },
    restoredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

recycleBinItemSchema.index({ companyId: 1, status: 1, deletedAt: -1 });

export const RecycleBinItem = mongoose.model<IRecycleBinItem>(
  'RecycleBinItem',
  recycleBinItemSchema
);
