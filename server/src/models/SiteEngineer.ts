import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISiteEngineer extends Document {
  companyId: Types.ObjectId;
  userId?: Types.ObjectId;
  name: string;
  loginId: string; // Email / login ID
  mobile: string;
  expertise: string; // e.g. "Common", "Civil Structure", "2"
  projectsCount: number;
  assignedProjectIds: Types.ObjectId[];
  status: 'Active' | 'Inactive'; // Active = Allowed, Inactive = Declined
  walletBalance: number;
  joinedDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const siteEngineerSchema = new Schema<ISiteEngineer>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Engineer name is required'],
      trim: true,
    },
    loginId: {
      type: String,
      required: [true, 'Login ID or Email is required'],
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      default: '-',
      trim: true,
    },
    expertise: {
      type: String,
      default: 'Common',
      trim: true,
    },
    projectsCount: {
      type: Number,
      default: 0,
    },
    assignedProjectIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    joinedDate: {
      type: Date,
      default: Date.now,
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

siteEngineerSchema.index({ companyId: 1, loginId: 1 });

export const SiteEngineer = mongoose.model<ISiteEngineer>('SiteEngineer', siteEngineerSchema);
