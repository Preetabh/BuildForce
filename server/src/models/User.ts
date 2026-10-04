import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'SITE_ENGINEER';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  companyId: Types.ObjectId;
  mobile?: string;
  expertise?: string;
  walletBalance?: number;
  projectsCount?: number;
  permissions?: Record<string, boolean>; // Granular menu/feature allow/decline flags
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      default: 'ADMIN',
    },
    mobile: {
      type: String,
      default: '',
      trim: true,
    },
    expertise: {
      type: String,
      default: 'Common',
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    projectsCount: {
      type: Number,
      default: 0,
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: {},
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ companyId: 1, role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
