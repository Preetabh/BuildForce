import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBoq extends Document {
  companyId: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  version: string;
  status: 'Draft' | 'Approved' | 'Archived';
  totalItems: number;
  totalQuantity: number;
  totalBoqValue: number;
  remarks?: string;
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const boqSchema = new Schema<IBoq>(
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
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Main Bill of Quantities',
    },
    version: {
      type: String,
      default: '1.0',
    },
    status: {
      type: String,
      enum: ['Draft', 'Approved', 'Archived'],
      default: 'Draft',
      index: true,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    totalBoqValue: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

boqSchema.index({ companyId: 1, projectId: 1, status: 1 });

export const Boq = mongoose.model<IBoq>('Boq', boqSchema);

export interface ISorSnapshot {
  sorId?: Types.ObjectId;
  sorItemId?: Types.ObjectId;
  itemCode?: string;
  scheduleName?: string;
  version?: string;
  snapshotRate?: number;
}

export interface IBoqItem extends Document {
  companyId: Types.ObjectId;
  projectId: Types.ObjectId;
  boqId: Types.ObjectId;
  itemNumber: number;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  sorReference?: ISorSnapshot;
  formulaId?: Types.ObjectId | null;
  formulaCode?: string;
  workCategory?: string;
  stage?: string;
  subClause?: string;
  chapter?: string;
  subChapter?: string;
  remarks?: string;
  executedQuantity: number;
  balanceQuantity: number;
  progressPercent: number;
  previousQuantity?: number;
  currentQuantity?: number;
  cumulativeQuantity?: number;
  rateAnalysisStatus?: 'AVAILABLE' | 'NOT_AVAILABLE' | 'CUSTOM';
  rateAnalysisId?: Types.ObjectId | null;
  customRateAnalysis?: {
    materials: Array<{
      name: string;
      unit: string;
      coefficient: number;
      unitRate: number;
      resourceCode?: string;
    }>;
    labour: Array<{
      name: string;
      unit: string;
      coefficient: number;
      unitRate: number;
      resourceCode?: string;
    }>;
    machinery: Array<{
      name: string;
      unit: string;
      coefficient: number;
      unitRate: number;
      resourceCode?: string;
    }>;
  };
  isDerivedFromMeasurement?: boolean;
  sourceMeasurementIds?: Types.ObjectId[];
  allowExcessQuantity: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const boqItemSchema = new Schema<IBoqItem>(
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
    itemNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    itemCode: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sorReference: {
      sorId: { type: Schema.Types.ObjectId, ref: 'SorMaster' },
      sorItemId: { type: Schema.Types.ObjectId, ref: 'SorItem' },
      scheduleName: String,
      version: String,
      snapshotRate: Number,
    },
    formulaId: { type: Schema.Types.ObjectId, ref: 'Formula', default: null },
    formulaCode: { type: String, default: '' },
    workCategory: { type: String, default: '' },
    stage: { type: String, default: '' },
    subClause: { type: String, default: '' },
    chapter: { type: String, default: '' },
    subChapter: { type: String, default: '' },
    remarks: { type: String, default: '' },
    executedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    previousQuantity: {
      type: Number,
      default: 0,
    },
    currentQuantity: {
      type: Number,
      default: 0,
    },
    cumulativeQuantity: {
      type: Number,
      default: 0,
    },
    balanceQuantity: {
      type: Number,
      default: 0,
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    rateAnalysisStatus: {
      type: String,
      enum: ['AVAILABLE', 'NOT_AVAILABLE', 'CUSTOM'],
      default: 'NOT_AVAILABLE',
      index: true,
    },
    rateAnalysisId: {
      type: Schema.Types.ObjectId,
      ref: 'SorRateAnalysis',
      default: null,
    },
    customRateAnalysis: {
      materials: [
        {
          name: String,
          unit: String,
          coefficient: Number,
          unitRate: Number,
          resourceCode: String,
        },
      ],
      labour: [
        {
          name: String,
          unit: String,
          coefficient: Number,
          unitRate: Number,
          resourceCode: String,
        },
      ],
      machinery: [
        {
          name: String,
          unit: String,
          coefficient: Number,
          unitRate: Number,
          resourceCode: String,
        },
      ],
    },
    isDerivedFromMeasurement: {
      type: Boolean,
      default: true,
      index: true,
    },
    sourceMeasurementIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Measurement',
      },
    ],
    allowExcessQuantity: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

boqItemSchema.index({ companyId: 1, projectId: 1, boqId: 1, itemNumber: 1 });
boqItemSchema.index({ description: 'text', itemCode: 'text' });

export const BoqItem = mongoose.model<IBoqItem>('BoqItem', boqItemSchema);
