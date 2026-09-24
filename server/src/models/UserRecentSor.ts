import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserRecentSor extends Document {
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  sorId: Types.ObjectId;
  lastAccessedAt: Date;
}

const userRecentSorSchema = new Schema<IUserRecentSor>(
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
      required: true,
      index: true,
    },
    sorId: {
      type: Schema.Types.ObjectId,
      ref: 'SorMaster',
      required: true,
      index: true,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

userRecentSorSchema.index({ companyId: 1, userId: 1, sorId: 1 }, { unique: true });
userRecentSorSchema.index({ userId: 1, lastAccessedAt: -1 });

export const UserRecentSor = mongoose.model<IUserRecentSor>('UserRecentSor', userRecentSorSchema);
