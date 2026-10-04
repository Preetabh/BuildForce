import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRolePermission {
  menuRoute: string;
  menuTitle: string;
  allow: boolean; // Allow vs Decline
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface IRbacRole extends Document {
  companyId: Types.ObjectId;
  name: string;
  code: string;
  description: string;
  isSystem: boolean;
  color: string;
  permissions: IRolePermission[];
  createdAt: Date;
  updatedAt: Date;
}

const rolePermissionSchema = new Schema<IRolePermission>(
  {
    menuRoute: { type: String, required: true },
    menuTitle: { type: String, required: true },
    allow: { type: Boolean, default: true },
    canCreate: { type: Boolean, default: true },
    canRead: { type: Boolean, default: true },
    canUpdate: { type: Boolean, default: true },
    canDelete: { type: Boolean, default: false },
  },
  { _id: false }
);

const rbacRoleSchema = new Schema<IRbacRole>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Role code is required'],
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    color: {
      type: String,
      default: '#F59E0B',
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    permissions: [rolePermissionSchema],
  },
  {
    timestamps: true,
  }
);

rbacRoleSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const RbacRole = mongoose.model<IRbacRole>('RbacRole', rbacRoleSchema);
