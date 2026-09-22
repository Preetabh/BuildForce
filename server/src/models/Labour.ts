import mongoose, { Document, Schema, Types } from 'mongoose';
import { MasterStatus } from './Material';

export interface ILabourType extends Document {
  companyId: Types.ObjectId;
  code: string;
  name: string;
  category: string;
  skillType: 'Skilled' | 'Semi-Skilled' | 'Unskilled' | 'Supervisory' | 'Specialist';
  standardDailyRate: number;
  unit: string;
  rateListId?: Types.ObjectId | null;
  rateVersion?: string;
  source?: string;
  effectiveDate?: Date | null;
  status: MasterStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const labourTypeSchema = new Schema<ILabourType>(
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
      trim: true,
      default: 'Civil Work',
      index: true,
    },
    skillType: {
      type: String,
      enum: ['Skilled', 'Semi-Skilled', 'Unskilled', 'Supervisory', 'Specialist'],
      default: 'Skilled',
      index: true,
    },
    standardDailyRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: 'Day',
      trim: true,
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
    effectiveDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

labourTypeSchema.index({ companyId: 1, code: 1 }, { unique: true });
labourTypeSchema.index({ companyId: 1, skillType: 1 });
labourTypeSchema.index({ companyId: 1, status: 1 });

export const LabourType = mongoose.model<ILabourType>('LabourType', labourTypeSchema);
