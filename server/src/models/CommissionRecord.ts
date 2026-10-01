import mongoose, { Document, Schema } from 'mongoose';

export interface ICommissionRecord extends Document {
  companyId: mongoose.Types.ObjectId;
  partnerId: mongoose.Types.ObjectId;
  partnerName: string;
  leadId?: mongoose.Types.ObjectId;
  leadCode?: string;
  clientName: string;
  projectValue: number;
  commissionPercent: number;
  commissionAmount: number;
  status: 'Pending' | 'Approved' | 'Paid';
  paymentDate?: Date;
  paymentRef?: string;
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
    clientName: {
      type: String,
      required: true,
      trim: true,
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
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Paid'],
      default: 'Pending',
    },
    paymentDate: {
      type: Date,
    },
    paymentRef: {
      type: String,
      default: '',
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

export const CommissionRecord = mongoose.model<ICommissionRecord>('CommissionRecord', commissionRecordSchema);
