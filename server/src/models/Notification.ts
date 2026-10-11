import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'SITE_ASSIGNED'
  | 'REPORT_SUBMITTED'
  | 'CORRECTION_REQUESTED'
  | 'REPORT_APPROVED'
  | 'REPORT_REVIEWED'
  | 'MISSING_REPORT'
  | 'SYSTEM';

export interface INotification extends Document {
  companyId: Types.ObjectId;
  recipientId?: Types.ObjectId; // null for broadcast to role
  recipientRole?: string; // 'ADMIN', 'SITE_ENGINEER', 'ALL'
  title: string;
  message: string;
  type: NotificationType;
  entityId?: Types.ObjectId;
  entityType?: 'DailyReport' | 'Project' | 'SiteEngineer' | 'ClientAccount' | 'System';
  link?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    recipientRole: {
      type: String,
      default: 'ALL',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'SITE_ASSIGNED',
        'REPORT_SUBMITTED',
        'CORRECTION_REQUESTED',
        'REPORT_APPROVED',
        'REPORT_REVIEWED',
        'MISSING_REPORT',
        'SYSTEM',
      ],
      default: 'SYSTEM',
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    entityType: {
      type: String,
      enum: ['DailyReport', 'Project', 'SiteEngineer', 'ClientAccount', 'System'],
      default: 'System',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ companyId: 1, recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
