import mongoose, { Document, Schema, Types } from 'mongoose';

export type MasterOptionType =
  | 'COUNTRY'
  | 'STATE'
  | 'DEPARTMENT'
  | 'WORK_CATEGORY'
  | 'PROJECT_STAGE'
  | 'UNIT'
  | 'SCHEDULE_TYPE'
  | 'QC_CHECKLIST';

export interface IMasterOption extends Document {
  companyId: Types.ObjectId;
  type: MasterOptionType;
  label: string;
  value: string;
  description?: string;
  sortOrder: number;
  isSystem: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const masterOptionSchema = new Schema<IMasterOption>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'COUNTRY',
        'STATE',
        'DEPARTMENT',
        'WORK_CATEGORY',
        'PROJECT_STAGE',
        'UNIT',
        'SCHEDULE_TYPE',
        'QC_CHECKLIST',
      ],
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

masterOptionSchema.index({ companyId: 1, type: 1, value: 1 }, { unique: true });
masterOptionSchema.index({ companyId: 1, type: 1, status: 1, sortOrder: 1 });

export const MasterOption = mongoose.model<IMasterOption>('MasterOption', masterOptionSchema);
