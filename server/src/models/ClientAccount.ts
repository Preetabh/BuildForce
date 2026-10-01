import mongoose, { Document, Schema } from 'mongoose';

export interface IClientAccount extends Document {
  companyId: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  clientCode: string; // e.g. "CL-001261"
  name: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  siteLocation: string;
  companyName: string;
  projectType: string;
  agreedAmount: number;
  paidAmount: number;
  balanceAmount: number;
  registrationDate: Date;
  status: 'Active' | 'Under Construction' | 'Handover' | 'Archived';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const clientAccountSchema = new Schema<IClientAccount>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },
    clientCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    secondaryPhone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    siteLocation: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: 'Lucknow Builders',
    },
    projectType: {
      type: String,
      default: 'Residential',
    },
    agreedAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Active', 'Under Construction', 'Handover', 'Archived'],
      default: 'Active',
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

clientAccountSchema.index({ companyId: 1, clientCode: 1 });

export const ClientAccount = mongoose.model<IClientAccount>('ClientAccount', clientAccountSchema);
