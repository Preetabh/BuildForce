import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  code: string;
  address?: string;
  contactEmail?: string;
  taxId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 200,
    },
    code: {
      type: String,
      required: [true, 'Company code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    taxId: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Company = mongoose.model<ICompany>('Company', companySchema);
