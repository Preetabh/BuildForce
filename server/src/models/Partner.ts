import mongoose, { Document, Schema } from 'mongoose';

export interface IPartner extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  partnerType: 'Associate' | 'Channel Partner' | 'Broker' | 'Social Media Influencer';
  commissionRatePercent: number; // e.g. 2, 3, 5%
  totalLeadsReferred: number;
  totalConverted: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  status: 'ACTIVE' | 'INACTIVE';
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
      enum: ['Associate', 'Channel Partner', 'Broker', 'Social Media Influencer'],
      default: 'Associate',
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
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
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
