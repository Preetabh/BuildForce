import mongoose, { Document, Schema, Types } from 'mongoose';

export type BillStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Paid';

export interface IBillItem {
  _id?: Types.ObjectId;
  boqItemId: Types.ObjectId;
  itemCode: string;
  description: string;
  unit: string;
  rate: number;
  boqQuantity: number;
  previouslyBilledQuantity: number;
  currentQuantity: number;
  cumulativeQuantity: number;
  balanceQuantity: number;
  currentAmount: number;
  cumulativeAmount: number;
  remarks?: string;
}

export interface IRunningBill extends Document {
  companyId: Types.ObjectId;
  projectId: Types.ObjectId;
  billNumber: string;
  billDate: Date;
  periodFrom?: Date | null;
  periodTo?: Date | null;
  status: BillStatus;
  totalPreviousAmount: number;
  totalCurrentAmount: number;
  totalCumulativeAmount: number;
  items: IBillItem[];
  remarks?: string;
  submittedBy?: Types.ObjectId | null;
  submittedAt?: Date | null;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const billItemSchema = new Schema<IBillItem>(
  {
    boqItemId: {
      type: Schema.Types.ObjectId,
      ref: 'BoqItem',
      required: true,
    },
    itemCode: { type: String, required: true },
    description: { type: String, required: true },
    unit: { type: String, required: true },
    rate: { type: Number, required: true },
    boqQuantity: { type: Number, required: true },
    previouslyBilledQuantity: { type: Number, default: 0 },
    currentQuantity: { type: Number, required: true },
    cumulativeQuantity: { type: Number, required: true },
    balanceQuantity: { type: Number, required: true },
    currentAmount: { type: Number, required: true },
    cumulativeAmount: { type: Number, required: true },
    remarks: { type: String, default: '' },
  },
  { _id: true }
);

const runningBillSchema = new Schema<IRunningBill>(
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
    billNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    billDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    periodFrom: {
      type: Date,
      default: null,
    },
    periodTo: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Paid'],
      default: 'Draft',
      index: true,
    },
    totalPreviousAmount: {
      type: Number,
      default: 0,
    },
    totalCurrentAmount: {
      type: Number,
      default: 0,
    },
    totalCumulativeAmount: {
      type: Number,
      default: 0,
    },
    items: [billItemSchema],
    remarks: {
      type: String,
      default: '',
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
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

runningBillSchema.index({ companyId: 1, projectId: 1, billNumber: 1 }, { unique: true });
runningBillSchema.index({ companyId: 1, projectId: 1, billDate: -1 });

export const RunningBill = mongoose.model<IRunningBill>('RunningBill', runningBillSchema);
