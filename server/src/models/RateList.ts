import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRateOverride {
  itemId: Types.ObjectId;
  itemCode: string;
  itemName: string;
  unit: string;
  rate: number;
}

export interface IRateList extends Document {
  companyId: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  materialRates: IRateOverride[];
  labourRates: IRateOverride[];
  machineryRates: IRateOverride[];
  createdAt: Date;
  updatedAt: Date;
}

const rateOverrideSchema = new Schema<IRateOverride>(
  {
    itemId: { type: Schema.Types.ObjectId, required: true },
    itemCode: { type: String, required: true, trim: true },
    itemName: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const rateListSchema = new Schema<IRateList>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    materialRates: [rateOverrideSchema],
    labourRates: [rateOverrideSchema],
    machineryRates: [rateOverrideSchema],
  },
  {
    timestamps: true,
  }
);

rateListSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const RateList = mongoose.model<IRateList>('RateList', rateListSchema);
