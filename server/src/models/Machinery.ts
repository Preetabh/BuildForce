import mongoose, { Document, Schema, Types } from 'mongoose';
import { MasterStatus } from './Material';

export interface IMachineryType extends Document {
  companyId: Types.ObjectId;
  code: string;
  name: string;
  category: string;
  unit: string;
  standardHourlyRate: number;
  rateType: 'Hourly' | 'Daily' | 'Shift' | 'Trip';
  rateListId?: Types.ObjectId | null;
  rateVersion?: string;
  source?: string;
  effectiveDate?: Date | null;
  status: MasterStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const machineryTypeSchema = new Schema<IMachineryType>(
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
      default: 'Concreting',
      trim: true,
      index: true,
    },
    unit: {
      type: String,
      default: 'Hour',
      trim: true,
    },
    standardHourlyRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    rateType: {
      type: String,
      enum: ['Hourly', 'Daily', 'Shift', 'Trip'],
      default: 'Hourly',
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

machineryTypeSchema.index({ companyId: 1, code: 1 }, { unique: true });
machineryTypeSchema.index({ companyId: 1, category: 1 });
machineryTypeSchema.index({ companyId: 1, status: 1 });

export const MachineryType = mongoose.model<IMachineryType>('MachineryType', machineryTypeSchema);

export interface ICalculationTrace {
  sorItemCode?: string;
  boqItemCode?: string;
  formulaText?: string;
  lastMeasurementId?: Types.ObjectId | null;
}

export interface IMachineryItem extends Document {
  companyId: Types.ObjectId;
  projectId: Types.ObjectId;
  boqId: Types.ObjectId;
  boqItemId: Types.ObjectId;
  machineryTypeId?: Types.ObjectId | null;
  machineryType: string;
  coefficient: number;
  boqQuantity: number;
  plannedHours: number;
  executedHours: number;
  balanceHours: number;
  requiredHours: number;
  unitRate: number;
  amount: number;
  executedAmount: number;
  source: 'RATE_ANALYSIS' | 'MANUAL';
  calculationTrace?: ICalculationTrace;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const machineryItemSchema = new Schema<IMachineryItem>(
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
      required: true,
      index: true,
    },
    boqId: {
      type: Schema.Types.ObjectId,
      ref: 'Boq',
      required: true,
      index: true,
    },
    boqItemId: {
      type: Schema.Types.ObjectId,
      ref: 'BoqItem',
      required: true,
      index: true,
    },
    machineryTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'MachineryType',
      default: null,
    },
    machineryType: {
      type: String,
      required: true,
      trim: true,
    },
    coefficient: {
      type: Number,
      required: true,
      min: 0,
    },
    boqQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    plannedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    executedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceHours: {
      type: Number,
      default: 0,
    },
    requiredHours: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unitRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    executedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    source: {
      type: String,
      enum: ['RATE_ANALYSIS', 'MANUAL'],
      default: 'RATE_ANALYSIS',
    },
    calculationTrace: {
      sorItemCode: String,
      boqItemCode: String,
      formulaText: String,
      lastMeasurementId: { type: Schema.Types.ObjectId, ref: 'Measurement' },
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

machineryItemSchema.index({ companyId: 1, projectId: 1, boqItemId: 1, machineryType: 1 });

export const MachineryItem = mongoose.model<IMachineryItem>('MachineryItem', machineryItemSchema);
