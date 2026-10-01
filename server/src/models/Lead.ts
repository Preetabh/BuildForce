import mongoose, { Document, Schema } from 'mongoose';

export interface IFollowUp {
  _id?: mongoose.Types.ObjectId;
  date: Date;
  remarks: string;
  status?: string;
  createdAt: Date;
  createdByName?: string;
}

export interface ILead extends Document {
  companyId: mongoose.Types.ObjectId;
  leadCode: string; // e.g. "001261"
  leadDate: Date;
  clientName: string;
  targetCompanyCode: string; // 'LB' | 'LD' | 'APEX' etc.
  targetCompanyName?: string;
  occupation?: string;
  businessName?: string;
  gender?: string;
  mobile1: string;
  mobile2?: string;
  email?: string;
  permanentAddress?: string;
  
  // Project & Site Details
  siteLocation: string;
  requirements: string[];
  serviceItems?: Array<{ service: string; specificItems?: string[] }>;
  propertyType: 'Resi.' | 'Comm.' | 'Residential' | 'Commercial' | string;
  propertyTypeDetail?: string;
  landArea?: string;
  buildupArea?: string;
  dimensional?: string;
  facing?: string;
  level?: string;
  requirementType?: string;
  projectDuration?: string;
  meetingDateTime?: Date;
  finances: {
    budget?: number;
    estimatedCost?: number;
  };
  sitePictures?: string[];

  // Reference Source
  referenceType: 'Associate' | 'Social Media' | 'Employee' | 'Direct';
  referenceDetails?: {
    partnerId?: mongoose.Types.ObjectId;
    partnerName?: string;
    channel?: string; // Facebook, Instagram, Google Ads, etc.
    employeeName?: string;
    notes?: string;
  };

  // Pipeline Status & Follow Ups
  stage: 'Lead' | 'Meeting' | 'Site Visit' | 'Quotation' | 'Negotiation' | 'Client' | 'Dead';
  priority: 'Normal' | 'High' | 'Urgent' | 'Low';
  followUps: IFollowUp[];
  latestFollowUp?: {
    date?: Date;
    remarks?: string;
  };

  isDead: boolean;
  deadReason?: string;
  deadAt?: Date;

  isRegisteredClient: boolean;
  convertedClientId?: mongoose.Types.ObjectId;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const followUpSchema = new Schema<IFollowUp>(
  {
    date: { type: Date, required: true },
    remarks: { type: String, required: true, trim: true },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now },
    createdByName: { type: String, default: 'Admin' },
  },
  { _id: true }
);

const leadSchema = new Schema<ILead>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    leadCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    leadDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    clientName: {
      type: String,
      required: [true, 'Owner/Client name is required'],
      trim: true,
    },
    targetCompanyCode: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      default: 'LB',
    },
    targetCompanyName: {
      type: String,
      trim: true,
      default: 'Lucknow Builders',
    },
    occupation: {
      type: String,
      trim: true,
      default: '',
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      default: 'Male',
    },
    mobile1: {
      type: String,
      required: [true, 'Primary mobile number is required'],
      trim: true,
    },
    mobile2: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    permanentAddress: {
      type: String,
      trim: true,
      default: '',
    },
    siteLocation: {
      type: String,
      required: [true, 'Site location is required'],
      trim: true,
    },
    requirements: {
      type: [String],
      default: ['Construction Furnished'],
    },
    serviceItems: {
      type: [
        {
          service: { type: String, default: '' },
          specificItems: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    propertyType: {
      type: String,
      default: 'Residential',
    },
    propertyTypeDetail: {
      type: String,
      default: '',
    },
    landArea: {
      type: String,
      default: '',
    },
    buildupArea: {
      type: String,
      default: '',
    },
    dimensional: {
      type: String,
      default: '',
    },
    facing: {
      type: String,
      default: '',
    },
    level: {
      type: String,
      default: '',
    },
    requirementType: {
      type: String,
      default: '',
    },
    projectDuration: {
      type: String,
      default: '',
    },
    meetingDateTime: {
      type: Date,
    },
    finances: {
      budget: { type: Number, default: 0 },
      estimatedCost: { type: Number, default: 0 },
    },
    sitePictures: {
      type: [String],
      default: [],
    },
    referenceType: {
      type: String,
      enum: ['Associate', 'Social Media', 'Employee', 'Direct'],
      default: 'Direct',
    },
    referenceDetails: {
      partnerId: { type: Schema.Types.ObjectId, ref: 'Partner' },
      partnerName: { type: String, default: '' },
      channel: { type: String, default: '' },
      employeeName: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    stage: {
      type: String,
      enum: ['Lead', 'Meeting', 'Site Visit', 'Quotation', 'Negotiation', 'Client', 'Dead'],
      default: 'Lead',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Normal', 'High', 'Urgent', 'Low'],
      default: 'Normal',
      index: true,
    },
    followUps: {
      type: [followUpSchema],
      default: [],
    },
    latestFollowUp: {
      date: { type: Date },
      remarks: { type: String, default: '' },
    },
    isDead: {
      type: Boolean,
      default: false,
      index: true,
    },
    deadReason: {
      type: String,
      default: '',
    },
    deadAt: {
      type: Date,
    },
    isRegisteredClient: {
      type: Boolean,
      default: false,
      index: true,
    },
    convertedClientId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientAccount',
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ companyId: 1, leadCode: 1 }, { unique: true });
leadSchema.index({ companyId: 1, isDead: 1, stage: 1 });
leadSchema.index({ companyId: 1, 'latestFollowUp.date': 1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
