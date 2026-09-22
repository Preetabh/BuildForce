import mongoose, { Document, Schema, Types } from 'mongoose';

export type MasterStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface IMaterial extends Document {
  companyId: Types.ObjectId;
  code: string;
  name: string;
  category: string;
  subcategory?: string;
  unit: string;
  standardRate: number;
  rateListId?: Types.ObjectId | null;
  rateVersion?: string;
  source?: string;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  status: MasterStatus;
  specification?: string;
  notes?: string;
  supplier?: string;
  hsnCode?: string;
  taxPercent?: number;
  createdAt: Date;
  updatedAt: Date;
}

const materialSchema = new Schema<IMaterial>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'General',
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      default: 'cum',
    },
    standardRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    rateListId: {
      type: Schema.Types.ObjectId,
      ref: 'RateList',
      default: null,
    },
    rateVersion: {
      type: String,
      trim: true,
      default: '1.0',
    },
    source: {
      type: String,
      trim: true,
      default: 'MARKET',
    },
    effectiveFrom: {
      type: Date,
      default: null,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    specification: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    supplier: {
      type: String,
      default: '',
    },
    hsnCode: {
      type: String,
      default: '',
    },
    taxPercent: {
      type: Number,
      default: 18,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

materialSchema.index({ companyId: 1, code: 1 }, { unique: true });
materialSchema.index({ companyId: 1, category: 1 });
materialSchema.index({ companyId: 1, status: 1 });

export const Material = mongoose.model<IMaterial>('Material', materialSchema);
