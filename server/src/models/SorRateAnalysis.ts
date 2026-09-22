import mongoose, { Document, Schema, Types } from 'mongoose';

export type ResourceType = 'MATERIAL' | 'LABOUR' | 'MACHINERY';

export interface IRateAnalysisComponent {
  resourceType: ResourceType;
  resourceCode?: string;       // e.g. '0367' (OPC Cement) or '0114' (Beldar)
  name: string;               // e.g. 'OPC 43 Grade Cement'
  unit: string;               // e.g. 'Bag', 'cum', 'kg', 'Day', 'Hour'
  coefficient: number;        // Consumption per 1 unit of work item
  unitRate: number;           // Unit rate in currency
  wastePercentage?: number;   // E.g. 5% for steel overlap/cut waste
  sourceRef?: string;         // e.g. 'CPWD DAR 2023 4.1.3'
}

export interface ISorRateAnalysis extends Document {
  companyId: Types.ObjectId;
  sorId?: Types.ObjectId | null;      // Optional ref to SorMaster
  sorItemId?: Types.ObjectId | null;  // Optional ref to SorItem
  itemCode: string;                   // Work item code e.g. '4.1.3'
  scheduleName: string;               // e.g. 'CPWD DAR 2023'
  version: string;                    // e.g. '2023.1'
  unit: string;                       // Work item unit e.g. 'cum'
  description?: string;
  materials: IRateAnalysisComponent[];
  labour: IRateAnalysisComponent[];
  machinery: IRateAnalysisComponent[];
  waterChargesPercent: number;        // e.g. 1%
  contractorProfitPercent: number;    // e.g. 15%
  baseCost: number;
  analyzedRate: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const componentSchema = new Schema<IRateAnalysisComponent>(
  {
    resourceType: {
      type: String,
      enum: ['MATERIAL', 'LABOUR', 'MACHINERY'],
      required: true,
    },
    resourceCode: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    coefficient: { type: Number, required: true, min: 0 },
    unitRate: { type: Number, required: true, min: 0, default: 0 },
    wastePercentage: { type: Number, default: 0, min: 0 },
    sourceRef: { type: String, default: '' },
  },
  { _id: false }
);

const sorRateAnalysisSchema = new Schema<ISorRateAnalysis>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    sorId: {
      type: Schema.Types.ObjectId,
      ref: 'SorMaster',
      default: null,
      index: true,
    },
    sorItemId: {
      type: Schema.Types.ObjectId,
      ref: 'SorItem',
      default: null,
      index: true,
    },
    itemCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    scheduleName: {
      type: String,
      required: true,
      trim: true,
      default: 'CPWD DAR 2023',
    },
    version: {
      type: String,
      default: '2023.1',
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    materials: [componentSchema],
    labour: [componentSchema],
    machinery: [componentSchema],
    waterChargesPercent: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    contractorProfitPercent: {
      type: Number,
      default: 15.0,
      min: 0,
    },
    baseCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    analyzedRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

sorRateAnalysisSchema.index({ companyId: 1, itemCode: 1, status: 1 });
sorRateAnalysisSchema.index({ companyId: 1, sorItemId: 1, status: 1 });

export const SorRateAnalysis = mongoose.model<ISorRateAnalysis>('SorRateAnalysis', sorRateAnalysisSchema);
