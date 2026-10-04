import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRbacMenu extends Document {
  companyId: Types.ObjectId;
  title: string;
  route: string;
  icon: string;
  sort: number;
  isVisible: boolean; // true = Visible, false = Draft
  parentId?: Types.ObjectId | null;
  moduleGroup?: string;
  isSystem?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rbacMenuSchema = new Schema<IRbacMenu>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Navigation title is required'],
      trim: true,
    },
    route: {
      type: String,
      required: [true, 'Destination route is required'],
      trim: true,
    },
    icon: {
      type: String,
      default: 'Layers',
      trim: true,
    },
    sort: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'RbacMenu',
      default: null,
      index: true,
    },
    moduleGroup: {
      type: String,
      default: 'Main',
      trim: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

rbacMenuSchema.index({ companyId: 1, sort: 1 });

export const RbacMenu = mongoose.model<IRbacMenu>('RbacMenu', rbacMenuSchema);
