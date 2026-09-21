import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectType = 'Residential' | 'Commercial' | 'Infrastructure' | 'Industrial' | 'Institutional' | 'Other';

export interface IProject extends Document {
  companyId: Types.ObjectId;
  name: string;
  code: string;
  clientName?: string;
  location?: string;
  department?: string;
  preparedBy?: string;
  parentId?: Types.ObjectId | null;
  measurementUnit?: string;
  defaultQcLevel?: string;
  description?: string;
  projectType: ProjectType;
  status: ProjectStatus;
  progress: number;
  estimatedValue: number;
  contractValue: number;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  phases: number;
  isArchived: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 250,
    },
    code: {
      type: String,
      required: [true, 'Project code is required'],
      trim: true,
      uppercase: true,
      maxlength: 50,
    },
    clientName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    location: {
      type: String,
      trim: true,
      default: '',
      maxlength: 250,
    },
    department: {
      type: String,
      trim: true,
      default: '',
      maxlength: 150,
    },
    preparedBy: {
      type: String,
      trim: true,
      default: '',
      maxlength: 150,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    measurementUnit: {
      type: String,
      trim: true,
      default: 'Metres (m)',
      maxlength: 50,
    },
    defaultQcLevel: {
      type: String,
      trim: true,
      default: 'Standard — recommended site checks',
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    projectType: {
      type: String,
      default: 'Residential',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'on_hold', 'completed', 'archived'],
      default: 'draft',
      index: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    estimatedValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    contractValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    phases: {
      type: Number,
      min: 1,
      default: 1,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ companyId: 1, code: 1 }, { unique: true });
projectSchema.index({ companyId: 1, deletedAt: 1, createdAt: -1 });
projectSchema.index({ companyId: 1, status: 1 });
projectSchema.index({ companyId: 1, name: 1 });
projectSchema.index({ companyId: 1, clientName: 1 });
projectSchema.index({ name: 'text', code: 'text', clientName: 'text', location: 'text' });

export const Project = mongoose.model<IProject>('Project', projectSchema);
