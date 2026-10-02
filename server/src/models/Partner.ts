import mongoose, { Document, Schema } from 'mongoose';

export interface IPartner extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  partnerType: string;
  interestLevel?: string;
  priority?: string;
  dueDate?: string;
  city?: string;
  lastRemark?: string;
  commissionRatePercent: number; // e.g. 2, 3, 5%
  totalLeadsReferred: number;
  totalConverted: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  status: 'ACTIVE' | 'INACTIVE' | 'Active' | 'Dead';
  followUps?: Array<{
    date: string;
    remarks: string;
    status?: string;
    createdAt?: Date;
    createdByName?: string;
  }>;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const partnerSchema = new Schema<IPartner>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Partner name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Partner phone is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    partnerType: {
      type: String,
      default: 'Associate',
    },
    interestLevel: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      default: 'High',
    },
    dueDate: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    lastRemark: {
      type: String,
      default: '',
    },
    commissionRatePercent: {
      type: Number,
      default: 2.0,
      min: 0,
      max: 100,
    },
    totalLeadsReferred: {
      type: Number,
      default: 0,
    },
    totalConverted: {
      type: Number,
      default: 0,
    },
    totalCommissionEarned: {
      type: Number,
      default: 0,
    },
    totalCommissionPaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'Active', 'Dead'],
      default: 'Active',
    },
    followUps: [
      {
        date: { type: String, default: '' },
        remarks: { type: String, default: '' },
        status: { type: String, default: 'Scheduled' },
        createdAt: { type: Date, default: Date.now },
        createdByName: { type: String, default: 'System' },
      },
    ],
    bankDetails: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

partnerSchema.index({ companyId: 1, phone: 1 });

export const Partner = mongoose.model<IPartner>('Partner', partnerSchema);
