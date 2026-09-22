import mongoose, { Document, Schema, Types } from 'mongoose';

export type SorImportStatus =
  | 'Draft'
  | 'Uploading'
  | 'Uploaded'
  | 'Processing'
  | 'Review Required'
  | 'Approved'
  | 'Published'
  | 'Failed'
  | 'OCR_REQUIRED';

export interface IBatchLog {
  batchNumber: number;
  startPage: number;
  endPage: number;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  error?: string;
  rowsCount: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IExtractedRow {
  _id?: Types.ObjectId;
  itemCode: string;
  descriptionEnglish: string;
  descriptionHindi?: string;
  unit: string;
  rate: number;
  chapter?: string;
  subChapter?: string;
  pageNumber?: number;
  confidence: number;
  status: 'Extracted' | 'Review Required' | 'Approved' | 'Rejected';
  reviewNotes?: string;
}

export interface ISorImport extends Document {
  companyId: Types.ObjectId;
  sorId?: Types.ObjectId | null;
  fileName: string;
  fileUrl?: string;
  fileType: 'pdf' | 'xlsx' | 'csv';
  fileSize: number;
  fileHash?: string;
  tempFilePath?: string;
  isOcrRequired?: boolean;
  authority: string;
  scheduleName: string;
  version: string;
  effectiveDate: Date;
  status: SorImportStatus;
  progress: {
    uploadPercent: number;
    processingPercent: number;
    pagesProcessed: number;
    totalPages: number;
    currentBatch: number;
    totalBatches: number;
    rowsExtracted: number;
    rowsRequiringReview: number;
    rowsImported: number;
    rowsFailed: number;
  };
  batches: IBatchLog[];
  extractedRows: IExtractedRow[];
  importErrors: { page?: number; row?: number; message: string }[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const batchLogSchema = new Schema<IBatchLog>(
  {
    batchNumber: { type: Number, required: true },
    startPage: { type: Number, required: true },
    endPage: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed'],
      default: 'Pending',
    },
    error: { type: String, default: '' },
    rowsCount: { type: Number, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { _id: false }
);

const extractedRowSchema = new Schema<IExtractedRow>(
  {
    itemCode: { type: String, required: true, trim: true },
    descriptionEnglish: { type: String, required: true, trim: true },
    descriptionHindi: { type: String, default: '' },
    unit: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    chapter: { type: String, default: '' },
    subChapter: { type: String, default: '' },
    pageNumber: { type: Number, default: 1 },
    confidence: { type: Number, default: 100, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['Extracted', 'Review Required', 'Approved', 'Rejected'],
      default: 'Extracted',
    },
    reviewNotes: { type: String, default: '' },
  },
  { _id: true }
);

const sorImportSchema = new Schema<ISorImport>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    sorId: {
      type: Schema.Types.ObjectId,
      ref: 'SorMaster',
      default: null,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      enum: ['pdf', 'xlsx', 'csv'],
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileHash: {
      type: String,
      default: '',
      index: true,
    },
    tempFilePath: {
      type: String,
      default: '',
    },
    isOcrRequired: {
      type: Boolean,
      default: false,
    },
    authority: {
      type: String,
      required: true,
      trim: true,
    },
    scheduleName: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        'Draft',
        'Uploading',
        'Uploaded',
        'Processing',
        'Review Required',
        'Approved',
        'Published',
        'Failed',
        'OCR_REQUIRED',
      ],
      default: 'Draft',
      index: true,
    },
    progress: {
      uploadPercent: { type: Number, default: 100 },
      processingPercent: { type: Number, default: 0 },
      pagesProcessed: { type: Number, default: 0 },
      totalPages: { type: Number, default: 1 },
      currentBatch: { type: Number, default: 0 },
      totalBatches: { type: Number, default: 0 },
      rowsExtracted: { type: Number, default: 0 },
      rowsRequiringReview: { type: Number, default: 0 },
      rowsImported: { type: Number, default: 0 },
      rowsFailed: { type: Number, default: 0 },
    },
    batches: [batchLogSchema],
    extractedRows: [extractedRowSchema],
    importErrors: [
      {
        page: Number,
        row: Number,
        message: String,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

sorImportSchema.index({ companyId: 1, createdAt: -1 });
sorImportSchema.index({ companyId: 1, fileHash: 1 });
sorImportSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export const SorImport = mongoose.model<ISorImport>('SorImport', sorImportSchema);
