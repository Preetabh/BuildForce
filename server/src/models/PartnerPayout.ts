import mongoose, { Document, Schema } from 'mongoose';

export interface IPartnerPayout extends Document {
  companyId: mongoose.Types.ObjectId;
  payoutNo: string; // e.g. "PAY-2026-0001"
  partnerId: mongoose.Types.ObjectId;
  partnerName: string;
  commissionId?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  clientName?: string;
  amount: number;
  paymentDate: Date;
  paymentMode: 'Cash' | 'Cheque' | 'UPI' | 'NEFT/RTGS' | 'Bank Transfer' | string;
  transactionRef?: string;
  notes?: string;
  status: 'Paid' | 'Processing';
  paidBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const partnerPayoutSchema = new Schema<IPartnerPayout>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    payoutNo: {
      type: String,
      required: true,
      trim: true,
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
    commissionId: {
      type: Schema.Types.ObjectId,
      ref: 'CommissionRecord',
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentRecord',
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientAccount',
    },
    clientName: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMode: {
      type: String,
      default: 'UPI',
    },
    transactionRef: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Paid', 'Processing'],
      default: 'Paid',
    },
    paidBy: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

partnerPayoutSchema.index({ companyId: 1, partnerId: 1, createdAt: -1 });

export const PartnerPayout = mongoose.model<IPartnerPayout>('PartnerPayout', partnerPayoutSchema);
