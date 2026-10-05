import mongoose, { Document, Schema, Types } from 'mongoose';

export type WorkerTrade =
  | 'Carpenter'
  | 'Mason'
  | 'Plumber'
  | 'Electrician'
  | 'Painter'
  | 'Welder'
  | 'Helper'
  | 'Bar Bender'
  | 'Tile Fitter'
  | 'Other';

export type WorkerStatus = 'Active' | 'Inactive';

export interface IWorker extends Document {
  companyId: Types.ObjectId;
  name: string;
  trade: WorkerTrade;
  specialSkills?: string;
  dailyRate: number;
  contactPhone: string;
  alternatePhone?: string;
  contactEmail?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location: string;
  status: WorkerStatus;
  joinedDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workerSchema = new Schema<IWorker>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Worker name is required'],
      trim: true,
    },
    trade: {
      type: String,
      default: 'Carpenter',
    },
    specialSkills: {
      type: String,
      default: '-',
      trim: true,
    },
    dailyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      default: '',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    permanentAddress: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
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

workerSchema.index({ companyId: 1, name: 1 });
workerSchema.index({ companyId: 1, trade: 1 });
workerSchema.index({ companyId: 1, status: 1 });

export const Worker = mongoose.model<IWorker>('Worker', workerSchema);
