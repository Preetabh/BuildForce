import mongoose, { Document, Schema, Types } from 'mongoose';

export type MeasurementFormula =
  | 'LxWxH'
  | 'LxWxD'
  | 'LxW'
  | 'LxH'
  | 'NosxQty'
  | 'Count'
  | 'Weight'
  | 'Custom';
export type MeasurementStatus = 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Reversed';

export interface IMeasurementEntry {
  _id?: Types.ObjectId;
  description: string;
  location?: string;
  levelFloor?: string;
  nos: number;
  length: number;
  width: number;
  breadth?: number;
  heightDepth: number;
  height?: number;
  depth?: number;
  thickness?: number;
  weight?: number;
  unitWeight?: number;
  unit: string;
  formula: MeasurementFormula | string;
  formulaExpression?: string;
  calculatedQuantity: number;
  remarks?: string;
  attachments?: { name: string; url: string; fileType: string }[];
}

export interface IMeasurement extends Document {
  companyId: Types.ObjectId;
  projectId: Types.ObjectId;
  boqId: Types.ObjectId;
  boqItemId: Types.ObjectId;
  sorId?: Types.ObjectId | null;
  sorItemId?: Types.ObjectId | null;
  scheduleName?: string;
  scheduleVersion?: string;
  sourceItemCode?: string;
  unitRate?: number;
  amount?: number;
  measurementDate: Date;
  status: MeasurementStatus;
  entries: IMeasurementEntry[];
  totalQuantity: number;
  previousQuantity?: number;
  currentQuantity?: number;
  cumulativeQuantity?: number;
  isReversed: boolean;
  reversedBy?: Types.ObjectId | null;
  reversedAt?: Date | null;
  reversalReason?: string;
  remarks?: string;
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const measurementEntrySchema = new Schema<IMeasurementEntry>(
  {
    description: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    levelFloor: { type: String, default: '' },
    nos: { type: Number, default: 1, min: 0 },
    length: { type: Number, default: 0, min: 0 },
    width: { type: Number, default: 0, min: 0 },
    breadth: { type: Number, default: 0, min: 0 },
    heightDepth: { type: Number, default: 0, min: 0 },
    height: { type: Number, default: 0, min: 0 },
    depth: { type: Number, default: 0, min: 0 },
    thickness: { type: Number, default: 0, min: 0 },
    weight: { type: Number, default: 0, min: 0 },
    unitWeight: { type: Number, default: 0, min: 0 },
    unit: { type: String, required: true, trim: true },
    formula: {
      type: String,
      default: 'LxWxH',
    },
    formulaExpression: {
      type: String,
      default: '',
    },
    calculatedQuantity: { type: Number, required: true, default: 0 },
    remarks: { type: String, default: '' },
    attachments: [
      {
        name: String,
        url: String,
        fileType: String,
      },
    ],
  },
  { _id: true }
);

const measurementSchema = new Schema<IMeasurement>(
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
    scheduleName: {
      type: String,
      default: '',
    },
    scheduleVersion: {
      type: String,
      default: '',
    },
    sourceItemCode: {
      type: String,
      default: '',
      index: true,
    },
    unitRate: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      default: 0,
    },
    measurementDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Under Review', 'Approved', 'Rejected', 'Reversed'],
      default: 'Approved',
      index: true,
    },
    entries: [measurementEntrySchema],
    totalQuantity: {
      type: Number,
      default: 0,
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
    isReversed: {
      type: Boolean,
      default: false,
      index: true,
    },
    reversedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reversedAt: {
      type: Date,
      default: null,
    },
    reversalReason: {
      type: String,
      default: '',
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

measurementSchema.index({ companyId: 1, projectId: 1, boqItemId: 1, measurementDate: -1 });
measurementSchema.index({ companyId: 1, projectId: 1, sourceItemCode: 1 });

export const Measurement = mongoose.model<IMeasurement>('Measurement', measurementSchema);
