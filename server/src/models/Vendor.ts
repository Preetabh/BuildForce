import mongoose, { Document, Schema, Types } from 'mongoose';

export type VendorType = 'Material' | 'Service' | 'Equipment' | 'Other';
export type VendorStatus = 'Active' | 'Inactive';

export interface IVendor extends Document {
  companyId: Types.ObjectId;
  name: string;
  type: VendorType;
  supplies: string;
  contactPhone: string;
  alternatePhone?: string;
  contactEmail?: string;
  fullAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location: string;
  deliveryAvailable: boolean;
  gstNumber?: string;
  status: VendorStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Material', 'Service', 'Equipment', 'Other'],
      default: 'Material',
    },
    supplies: {
      type: String,
      default: '',
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      default: '',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    fullAddress: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    deliveryAvailable: {
      type: Boolean,
      default: true,
    },
    gstNumber: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
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

vendorSchema.index({ companyId: 1, name: 1 });
vendorSchema.index({ companyId: 1, type: 1 });
vendorSchema.index({ companyId: 1, status: 1 });

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);
