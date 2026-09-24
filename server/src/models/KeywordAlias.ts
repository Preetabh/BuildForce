import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IKeywordAlias extends Document {
  companyId: Types.ObjectId;
  sorId?: Types.ObjectId | null;
  keyword: string;
  clause: string;
  subclause?: string;
  extra?: string;
  workCategory?: string;
  stage?: string;
  rate?: number;
  unit?: string;
  clauseDesc?: string;
  subclauseDesc?: string;
  isSaved?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const keywordAliasSchema = new Schema<IKeywordAlias>(
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
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    clause: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subclause: {
      type: String,
      default: '',
      trim: true,
    },
    extra: {
      type: String,
      default: '',
      trim: true,
    },
    workCategory: {
      type: String,
      default: '',
      trim: true,
    },
    stage: {
      type: String,
      default: '',
      trim: true,
    },
    rate: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: 'SQM',
      trim: true,
    },
    clauseDesc: {
      type: String,
      default: '',
      trim: true,
    },
    subclauseDesc: {
      type: String,
      default: '',
      trim: true,
    },
    isSaved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

keywordAliasSchema.index({ companyId: 1, keyword: 1 });
keywordAliasSchema.index({ companyId: 1, clause: 1, subclause: 1 });

export const KeywordAlias = mongoose.model<IKeywordAlias>('KeywordAlias', keywordAliasSchema);
