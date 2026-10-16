import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IServiceItem extends Document {
  companyId: Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const serviceItemSchema = new Schema<IServiceItem>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

serviceItemSchema.index({ companyId: 1, name: 1, isDeleted: 1 });
serviceItemSchema.index({ companyId: 1, isActive: 1, sortOrder: 1 });

export const ServiceCatalog = mongoose.model<IServiceItem>('ServiceCatalog', serviceItemSchema);
