import mongoose, { Document, Schema, Types } from 'mongoose';

export type StagedItemStatus = 'Extracted' | 'Review Required' | 'Approved' | 'Rejected';

export interface ISorStagedItem extends Document {
  companyId: Types.ObjectId;
  importId: Types.ObjectId;
  sorId?: Types.ObjectId | null;
  batchNumber: number;
  pageNumber: number;
  srNo?: number;
  itemCode: string;
  descriptionEnglish: string;
  descriptionHindi?: string;
  unit: string;
  rate: number;
  chapter?: string;
  subChapter?: string;
  workCategory?: string;
  confidence: number;
  status: StagedItemStatus;
  reviewNotes?: string;
  sourceText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sorStagedItemSchema = new Schema<ISorStagedItem>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    importId: {
      type: Schema.Types.ObjectId,
      ref: 'SorImport',
      required: true,
      index: true,
    },
    sorId: {
      type: Schema.Types.ObjectId,
      ref: 'SorMaster',
      default: null,
    },
    batchNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    pageNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    srNo: {
      type: Number,
      default: null,
    },
    itemCode: {
      type: String,
      required: true,
      trim: true,
    },
    descriptionEnglish: {
      type: String,
      required: true,
      trim: true,
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
      min: 0,
    },
    chapter: {
      type: String,
      default: '',
      trim: true,
    },
    subChapter: {
      type: String,
      default: '',
      trim: true,
    },
    workCategory: {
      type: String,
      default: '',
      trim: true,
    },
    confidence: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['Extracted', 'Review Required', 'Approved', 'Rejected'],
      default: 'Extracted',
      index: true,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    sourceText: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for paginated querying and review filtering
sorStagedItemSchema.index({ companyId: 1, importId: 1, status: 1 });
sorStagedItemSchema.index({ companyId: 1, importId: 1, itemCode: 1 });
sorStagedItemSchema.index({ companyId: 1, importId: 1, pageNumber: 1 });
sorStagedItemSchema.index({ companyId: 1, importId: 1, batchNumber: 1 });

export const SorStagedItem = mongoose.model<ISorStagedItem>('SorStagedItem', sorStagedItemSchema);
