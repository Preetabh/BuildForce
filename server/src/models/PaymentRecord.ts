import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentRecord extends Document {
  companyId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  clientName: string;
  receiptNo: string;
  amount: number;
  paymentDate: Date;
  paymentMode: 'Cash' | 'Cheque' | 'UPI' | 'NEFT/RTGS' | 'Bank Transfer' | string;
  modeBadge?: string; // 'Online' | 'Cash' | 'Cheque'
  serviceName?: string; // e.g. 'Interior Full Design', 'Construction Furnished'
  servicePlan?: string; // e.g. 'Construction'
  referenceType?: string; // e.g. 'UPI'
  transactionRef?: string;
  purpose: string;
  commissionGenerated?: boolean;
  commissionId?: mongoose.Types.ObjectId;
  remarks?: string;
  notes?: string;
  receivedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentRecordSchema = new Schema<IPaymentRecord>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientAccount',
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    receiptNo: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
    modeBadge: {
      type: String,
      default: 'Online',
    },
    serviceName: {
      type: String,
      default: 'Construction Structure',
    },
    servicePlan: {
      type: String,
      default: 'Construction',
    },
    referenceType: {
      type: String,
      default: 'UPI',
    },
    transactionRef: {
      type: String,
      trim: true,
      default: '',
    },
    purpose: {
      type: String,
      default: 'Advance Booking',
    },
    commissionGenerated: {
      type: Boolean,
      default: false,
    },
    commissionId: {
      type: Schema.Types.ObjectId,
      ref: 'CommissionRecord',
    },
    remarks: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    receivedBy: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentRecord = mongoose.model<IPaymentRecord>('PaymentRecord', paymentRecordSchema);
