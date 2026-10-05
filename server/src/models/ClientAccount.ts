import mongoose, { Document, Schema } from 'mongoose';

export interface IClientFollowUp {
  _id?: mongoose.Types.ObjectId;
  date: Date;
  remarks: string;
  status?: string;
  createdAt: Date;
  createdByName?: string;
}

export interface ILedgerStage {
  _id?: mongoose.Types.ObjectId;
  stageName: string;
  percentage: number;
  amount: number;
  targetDate?: string;
  paid: number;
  due: number;
  status: 'Pending' | 'Paid' | 'Partial';
}

export interface IDailyProgressReport {
  _id?: mongoose.Types.ObjectId;
  reportDate: Date;
  workCompletedToday: string;
  materialsUsed: string;
  nextDayPlan: string;
  siteKharcha: {
    labourCost: number;
    materialCost: number;
  };
  sitePhotos?: string[];
  reportedBy?: string;
  createdAt: Date;
}

export interface IClientAccount extends Document {
  companyId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  partnerId?: mongoose.Types.ObjectId;
  partnerName?: string;
  clientCode: string; // e.g. "000018"
  name: string;
  businessName?: string;
  contactPerson?: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  siteLocation: string;
  companyName: string;
  projectType: string;
  propertyType?: string;
  propertySubtype?: string;
  buildupArea?: string;
  dimensional?: string;
  facing?: string;
  level?: string;
  requirementType?: string;
  projectDuration?: string;
  meetingDate?: string;
  gender?: string;
  priority?: string;
  referenceSource?: string;
  handlerName?: string; // e.g. "ER. Ankit Kumar Verma"
  subBadge?: string; // e.g. "OLD INFRA", "LB"
  associate?: string; // e.g. "Social Media: Facebook", "Google", "Direct", "PI ADS"
  associateType?: string; // e.g. "SocialMedia", "Direct"
  area?: string; // e.g. "2,000", "2,475", "330"
  services?: string; // e.g. "Renovation", "Construction Structure", "Floor Plan Design"
  servicesList?: Array<{ name: string; total: number; paid: number }>;
  agreedAmount: number;
  paidAmount: number;
  balanceAmount: number;
  registrationDate: Date;
  
  // Cost Estimator & Payment Ledger
  projectEstimator?: {
    areaSqft: number;
    ratePerSqft: number;
    discountPerSqft: number;
    finalRate: number;
    totalAmount: number;
  };
  ledgerStages: ILedgerStage[];

  // Daily Progress Reports
  dailyProgressReports: IDailyProgressReport[];

  // Follow-ups
  followUps: IClientFollowUp[];
  latestFollowUp?: {
    date?: Date;
    remarks?: string;
  };

  isDead: boolean;
  deadReason?: string;
  deadAt?: Date;
  status: 'Active' | 'Under Construction' | 'Handover' | 'Archived' | 'Dead';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const clientFollowUpSchema = new Schema<IClientFollowUp>(
  {
    date: { type: Date, required: true },
    remarks: { type: String, required: true, trim: true },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now },
    createdByName: { type: String, default: 'Admin' },
  },
  { _id: true }
);

const clientAccountSchema = new Schema<IClientAccount>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      index: true,
    },
    partnerName: {
      type: String,
      default: '',
    },
    clientCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    secondaryPhone: {
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
    address: {
      type: String,
      trim: true,
      default: '',
    },
    siteLocation: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: 'Lucknow Builders',
    },
    projectType: {
      type: String,
      default: 'Residential',
    },
    handlerName: {
      type: String,
      trim: true,
      default: '',
    },
    subBadge: {
      type: String,
      trim: true,
      default: '',
    },
    associate: {
      type: String,
      trim: true,
      default: 'Direct',
    },
    associateType: {
      type: String,
      trim: true,
      default: 'Direct',
    },
    area: {
      type: String,
      trim: true,
      default: '-',
    },
    services: {
      type: String,
      trim: true,
      default: 'Construction Structure',
    },
    agreedAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    followUps: {
      type: [clientFollowUpSchema],
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
    status: {
      type: String,
      enum: ['Active', 'Under Construction', 'Handover', 'Archived', 'Dead'],
      default: 'Active',
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    propertyType: {
      type: String,
      default: 'Residential',
    },
    propertySubtype: {
      type: String,
      default: 'House',
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
      default: 'East',
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
    meetingDate: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      default: 'Male',
    },
    priority: {
      type: String,
      default: 'High',
    },
    referenceSource: {
      type: String,
      default: 'Social Media: Facebook',
    },
    servicesList: [
      {
        name: { type: String, required: true },
        total: { type: Number, default: 0 },
        paid: { type: Number, default: 0 },
      },
    ],
    projectEstimator: {
      areaSqft: { type: Number, default: 0 },
      ratePerSqft: { type: Number, default: 0 },
      discountPerSqft: { type: Number, default: 0 },
      finalRate: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
    },
    ledgerStages: [
      {
        stageName: { type: String, required: true },
        percentage: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
        targetDate: { type: String, default: '' },
        paid: { type: Number, default: 0 },
        due: { type: Number, default: 0 },
        status: { type: String, enum: ['Pending', 'Paid', 'Partial'], default: 'Pending' },
      },
    ],
    dailyProgressReports: [
      {
        reportDate: { type: Date, default: Date.now },
        workCompletedToday: { type: String, default: '' },
        materialsUsed: { type: String, default: '' },
        nextDayPlan: { type: String, default: '' },
        siteKharcha: {
          labourCost: { type: Number, default: 0 },
          materialCost: { type: Number, default: 0 },
        },
        sitePhotos: { type: [String], default: [] },
        reportedBy: { type: String, default: 'Admin' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

clientAccountSchema.index({ companyId: 1, clientCode: 1 });
clientAccountSchema.index({ companyId: 1, isDead: 1 });

export const ClientAccount = mongoose.model<IClientAccount>('ClientAccount', clientAccountSchema);
