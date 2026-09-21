import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICalculationTrace {
  sorItemCode?: string;
  boqItemCode?: string;
  formulaText?: string;
  lastMeasurementId?: Types.ObjectId | null;
}

export interface IBomItem extends Document {
  companyId: Types.ObjectId;
  projectId: Types.ObjectId;
  boqId: Types.ObjectId;
  boqItemId: Types.ObjectId;
  materialId?: Types.ObjectId | null;
  materialName: string;
  unit: string;
  coefficient: number;
  boqQuantity: number;
  plannedQuantity: number;
  executedQuantity: number;
  balanceQuantity: number;
  requiredQuantity: number;
  unitRate: number;
  amount: number;
  executedAmount: number;
  source: 'RATE_ANALYSIS' | 'MANUAL';
  calculationTrace?: ICalculationTrace;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bomItemSchema = new Schema<IBomItem>(
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
    materialId: {
      type: Schema.Types.ObjectId,
      ref: 'Material',
      default: null,
    },
    materialName: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
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
    plannedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    executedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceQuantity: {
      type: Number,
      default: 0,
    },
    requiredQuantity: {
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

bomItemSchema.index({ companyId: 1, projectId: 1, boqItemId: 1, materialName: 1 });

export const BomItem = mongoose.model<IBomItem>('BomItem', bomItemSchema);
