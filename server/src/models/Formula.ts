import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMaterialFactor {
  materialId?: Types.ObjectId | null;
  materialCode: string;
  name: string;
  unit: string;
  factor: number;
  wastePercent?: number;
}

export interface ILabourFactor {
  labourId?: Types.ObjectId | null;
  labourCode: string;
  name: string;
  unit: string;
  factor: number;
}

export interface IMachineryFactor {
  machineryId?: Types.ObjectId | null;
  machineryCode: string;
  name: string;
  unit: string;
  factor: number;
}

export interface IFormula extends Document {
  companyId: Types.ObjectId;
  name: string;
  code: string;
  category: string;
  unit: string;
  description?: string;
  referenceStandard?: string;
  materialFactors: IMaterialFactor[];
  labourFactors: ILabourFactor[];
  machineryFactors: IMachineryFactor[];
  isStandard: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const materialFactorSchema = new Schema<IMaterialFactor>(
  {
    materialId: { type: Schema.Types.ObjectId, ref: 'Material', default: null },
    materialCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    factor: { type: Number, required: true, min: 0 },
    wastePercent: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const labourFactorSchema = new Schema<ILabourFactor>(
  {
    labourId: { type: Schema.Types.ObjectId, ref: 'LabourType', default: null },
    labourCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true, default: 'day' },
    factor: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const machineryFactorSchema = new Schema<IMachineryFactor>(
  {
    machineryId: { type: Schema.Types.ObjectId, ref: 'MachineryType', default: null },
    machineryCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true, default: 'hour' },
    factor: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const formulaSchema = new Schema<IFormula>(
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
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'Concrete Work',
      index: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      default: 'Cum',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    referenceStandard: {
      type: String,
      default: '',
      trim: true,
    },
    materialFactors: [materialFactorSchema],
    labourFactors: [labourFactorSchema],
    machineryFactors: [machineryFactorSchema],
    isStandard: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

formulaSchema.index({ companyId: 1, code: 1 }, { unique: true });
formulaSchema.index({ companyId: 1, category: 1 });

export const Formula = mongoose.model<IFormula>('Formula', formulaSchema);
