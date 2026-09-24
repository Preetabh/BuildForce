import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISorMaster extends Document {
  companyId: Types.ObjectId;
  authority: string; // e.g. CPWD, State PWD, CGPWD, Maharashtra PWD, MES, Railways
  department: string; // e.g. Civil, Electrical, Horticulture
  scheduleType: string; // e.g. DSR, SOR, DAR
  sorName: string; // e.g. CPWD DSR 2023 Civil
  version: string; // e.g. 2023.1
  category?: string; // e.g. Buildings & Roads, Infrastructure
  country?: string; // e.g. India
  state?: string; // e.g. Chhattisgarh, Maharashtra, All-India
  owningBody?: string; // e.g. CPWD, NHAI, MES, CG PWD, MH PWD
  year?: string; // e.g. 2023, 2026
  notes?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  sourceDocument?: string;
  status: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const sorMasterSchema = new Schema<ISorMaster>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    authority: {
      type: String,
      required: true,
      trim: true,
      default: 'CPWD',
    },
    department: {
      type: String,
      default: 'Civil',
      trim: true,
    },
    scheduleType: {
      type: String,
      default: 'Central Govt',
      trim: true,
    },
    sorName: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
      default: '2023',
    },
    category: {
      type: String,
      default: 'Civil Works',
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    state: {
      type: String,
      default: 'All-India',
      trim: true,
    },
    owningBody: {
      type: String,
      default: '',
      trim: true,
    },
    year: {
      type: String,
      default: '2023',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    sourceDocument: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

sorMasterSchema.index({ companyId: 1, authority: 1, version: 1 });
sorMasterSchema.index({ companyId: 1, department: 1, scheduleType: 1, version: 1 });

export const SorMaster = mongoose.model<ISorMaster>('SorMaster', sorMasterSchema);

export interface ISorItem extends Document {
  sorId: Types.ObjectId;
  srNo?: number;
  itemCode: string;
  subclauseCode?: string;
  descriptionEnglish: string;
  descriptionHindi?: string;
  unit: string;
  rate: number;
  chapter?: string;
  subChapter?: string;
  workCategory?: string; // e.g. Earthwork, Concrete, RCC, Brickwork, Plastering, Flooring, Steel
  projectStage?: string; // e.g. Substructure, Superstructure, Finishing
  measurementFormula?: string; // e.g. LxWxD, LxWxH, LxW, Weight, Count, Custom
  applicableDimensions?: string[]; // e.g. ['length', 'width', 'depth', 'nos']
  formulaExpression?: string; // e.g. 'Length × Width × Depth × Nos'
  qcChecklist?: string;
  remarks?: string;
  sourcePage?: number;
  sourceReference?: string;
  status: string;
}

const sorItemSchema = new Schema<ISorItem>(
  {
    sorId: {
      type: Schema.Types.ObjectId,
      ref: 'SorMaster',
      required: true,
      index: true,
    },
    srNo: {
      type: Number,
      default: null,
      index: true,
    },
    itemCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subclauseCode: {
      type: String,
      default: '',
      trim: true,
    },
    descriptionEnglish: {
      type: String,
      required: true,
    },
    descriptionHindi: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
    rate: {
      type: Number,
      default: 0,
    },
    chapter: {
      type: String,
      default: '',
    },
    subChapter: {
      type: String,
      default: '',
    },
    workCategory: {
      type: String,
      default: '',
      index: true,
    },
    projectStage: {
      type: String,
      default: '',
      index: true,
    },
    measurementFormula: {
      type: String,
      default: '',
    },
    applicableDimensions: {
      type: [String],
      default: [],
    },
    formulaExpression: {
      type: String,
      default: '',
    },
    qcChecklist: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
    sourcePage: {
      type: Number,
      default: null,
    },
    sourceReference: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

sorItemSchema.index({ sorId: 1, itemCode: 1 }, { unique: true });
sorItemSchema.index({ descriptionEnglish: 'text', itemCode: 'text', chapter: 'text' });

export const SorItem = mongoose.model<ISorItem>('SorItem', sorItemSchema);

