import mongoose, { Document, Schema } from 'mongoose';

export interface ICommissionRecord extends Document {
  companyId: mongoose.Types.ObjectId;
  partnerId: mongoose.Types.ObjectId;
  partnerName: string;
  leadId?: mongoose.Types.ObjectId;
  leadCode?: string;
  clientId?: mongoose.Types.ObjectId;
  clientName: string;
  paymentId?: mongoose.Types.ObjectId; // exact PaymentRecord that triggered this commission
  paymentAmount: number; // installment received from client
  projectValue: number; // total agreed amount of project
  commissionPercent: number;
  commissionAmount: number;
  paidAmount: number; // amount paid out to partner
  balanceAmount: number; // remaining commission to pay out
  status: 'Pending' | 'Approved' | 'Paid';
  payoutId?: mongoose.Types.ObjectId;
  paymentDate?: Date;
  paymentRef?: string;
  approvedBy?: string;
  approvedAt?: Date;
  paidBy?: string;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const commissionRecordSchema = new Schema<ICommissionRecord>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      index: true,
    },
    partnerName: {
      type: String,
      required: true,
      trim: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },
    leadCode: {
      type: String,
      default: '',
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientAccount',
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentRecord',
      index: true,
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    projectValue: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionPercent: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Paid'],
      default: 'Pending',
    },
    payoutId: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerPayout',
    },
    paymentDate: {
      type: Date,
    },
    paymentRef: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: String,
      default: '',
    },
    approvedAt: {
      type: Date,
    },
    paidBy: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
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

commissionRecordSchema.index({ companyId: 1, partnerId: 1, status: 1 });
commissionRecordSchema.index({ companyId: 1, paymentId: 1 });

export const CommissionRecord = mongoose.model<ICommissionRecord>('CommissionRecord', commissionRecordSchema);

