import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICalculationTrace {
  sorItemCode?: string;
  boqItemCode?: string;
  formulaText?: string;
  lastMeasurementId?: Types.ObjectId | null;
}

export interface IManpowerItem extends Document {
  companyId: Types.ObjectId;
  projectId: Types.ObjectId;
  boqId: Types.ObjectId;
  boqItemId: Types.ObjectId;
  labourTypeId?: Types.ObjectId | null;
  labourType: string;
  coefficient: number;
  boqQuantity: number;
  plannedManpower: number;
  executedManpower: number;
  balanceManpower: number;
  requiredManpower: number;
  unitRate: number;
  amount: number;
  executedAmount: number;
  source: 'RATE_ANALYSIS' | 'MANUAL';
  calculationTrace?: ICalculationTrace;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const manpowerItemSchema = new Schema<IManpowerItem>(
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
    labourTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'LabourType',
      default: null,
    },
    labourType: {
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
    plannedManpower: {
      type: Number,
      default: 0,
      min: 0,
    },
    executedManpower: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceManpower: {
      type: Number,
      default: 0,
    },
    requiredManpower: {
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

manpowerItemSchema.index({ companyId: 1, projectId: 1, boqItemId: 1, labourType: 1 });

export const ManpowerItem = mongoose.model<IManpowerItem>('ManpowerItem', manpowerItemSchema);

