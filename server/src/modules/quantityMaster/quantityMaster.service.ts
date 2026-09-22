import { Types } from 'mongoose';
import { Material } from '../../models/Material';
import { LabourType } from '../../models/Labour';
import { MachineryType } from '../../models/Machinery';
import { Formula, IFormula } from '../../models/Formula';
import { RateList, IRateList } from '../../models/RateList';
import { SorImport } from '../../models/SorImport';
import { BomItem } from '../../models/Bom';
import { ManpowerItem } from '../../models/Manpower';
import { MachineryItem } from '../../models/Machinery';
import { AppError } from '../../middleware/error.middleware';

export class QuantityMasterService {
  // ==========================================
  // 1. MATERIALS
  // ==========================================
  public static async getMaterials(
    companyId: string,
    query: {
      search?: string;
      category?: string;
      status?: string;
      rateListId?: string;
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    const filter: Record<string, unknown> = { companyId: compObjectId };

    if (query.status && query.status !== 'all' && query.status !== 'All Status') {
      filter.status = query.status.toUpperCase();
    }

    if (query.category && query.category !== 'all' && query.category !== 'All Categories') {
      filter.category = new RegExp(`^${query.category.trim()}$`, 'i');
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { category: searchRegex },
        { subcategory: searchRegex },
        { specification: searchRegex },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const [items, total, categories] = await Promise.all([
      Material.find(filter)
        .populate('rateListId', 'name code')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Material.countDocuments(filter),
      Material.distinct('category', { companyId: compObjectId }),
    ]);

    // If rateListId is passed in filter, check rate overrides
    let rateOverrides: Map<string, number> = new Map();
    if (query.rateListId && Types.ObjectId.isValid(query.rateListId)) {
      const rateList = await RateList.findOne({
        _id: new Types.ObjectId(query.rateListId),
        companyId: compObjectId,
      }).lean();
      if (rateList && rateList.materialRates) {
        rateList.materialRates.forEach((r) => {
          rateOverrides.set(r.itemId.toString(), r.rate);
        });
      }
    }

    const formattedItems = items.map((item) => ({
      ...item,
      effectiveRate: rateOverrides.has(item._id.toString())
        ? rateOverrides.get(item._id.toString())
        : item.standardRate,
      hasOverride: rateOverrides.has(item._id.toString()),
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      categories: categories.filter(Boolean),
    };
  }

  public static async createMaterial(
    companyId: string,
    data: {
      name: string;
      code?: string;
      category: string;
      subcategory?: string;
      unit: string;
      standardRate: number;
      rateListId?: string | null;
      rateVersion?: string;
      source?: string;
      effectiveFrom?: string | null;
      effectiveTo?: string | null;
      status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
      specification?: string;
      notes?: string;
      supplier?: string;
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    let code = data.code ? data.code.trim().toUpperCase() : '';

    if (!code) {
      code = data.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase();
    }

    if (data.standardRate < 0) {
      throw new AppError('Material rate cannot be negative', 400);
    }

    const existing = await Material.findOne({ companyId: compObjectId, code });
    if (existing) {
      throw new AppError(`A material with code "${code}" already exists in your company master.`, 400);
    }

    const material = await Material.create({
      companyId: compObjectId,
      name: data.name.trim(),
      code,
      category: data.category?.trim() || 'General',
      subcategory: data.subcategory?.trim() || '',
      unit: data.unit?.trim() || 'cum',
      standardRate: Math.max(0, Number(data.standardRate) || 0),
      rateListId: data.rateListId && Types.ObjectId.isValid(data.rateListId) ? new Types.ObjectId(data.rateListId) : null,
      rateVersion: data.rateVersion?.trim() || '1.0',
      source: data.source?.trim() || 'MARKET',
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      status: data.status || 'ACTIVE',
      specification: data.specification || '',
      notes: data.notes || '',
      supplier: data.supplier || '',
    });

    return material;
  }

  public static async updateMaterial(
    companyId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      category?: string;
      subcategory?: string;
      unit?: string;
      standardRate?: number;
      rateListId?: string | null;
      rateVersion?: string;
      source?: string;
      effectiveFrom?: string | null;
      effectiveTo?: string | null;
      status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
      specification?: string;
      notes?: string;
      supplier?: string;
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    const material = await Material.findOne({
      _id: new Types.ObjectId(id),
      companyId: compObjectId,
    });

    if (!material) throw new AppError('Material not found', 404);

    if (data.code && data.code.trim().toUpperCase() !== material.code) {
      const newCode = data.code.trim().toUpperCase();
      const codeCollision = await Material.findOne({
        companyId: compObjectId,
        code: newCode,
        _id: { $ne: material._id },
      });
      if (codeCollision) {
        throw new AppError(`A material with code "${newCode}" already exists`, 400);
      }
      material.code = newCode;
    }

    if (data.name) material.name = data.name.trim();
    if (data.category) material.category = data.category.trim();
    if (data.subcategory !== undefined) material.subcategory = data.subcategory.trim();
    if (data.unit) material.unit = data.unit.trim();
    if (data.standardRate !== undefined) {
      if (Number(data.standardRate) < 0) throw new AppError('Rate cannot be negative', 400);
      material.standardRate = Number(data.standardRate);
    }
    if (data.rateListId !== undefined) {
      material.rateListId = data.rateListId && Types.ObjectId.isValid(data.rateListId) ? new Types.ObjectId(data.rateListId) : null;
    }
    if (data.rateVersion) material.rateVersion = data.rateVersion.trim();
    if (data.source) material.source = data.source.trim();
    if (data.effectiveFrom !== undefined) material.effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : null;
    if (data.effectiveTo !== undefined) material.effectiveTo = data.effectiveTo ? new Date(data.effectiveTo) : null;
    if (data.status) material.status = data.status;
    if (data.specification !== undefined) material.specification = data.specification;
    if (data.notes !== undefined) material.notes = data.notes;
    if (data.supplier !== undefined) material.supplier = data.supplier;

    await material.save();
    return material;
  }

  public static async toggleMaterialArchive(companyId: string, id: string) {
    const material = await Material.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!material) throw new AppError('Material not found', 404);

    material.status = material.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    await material.save();
    return material;
  }

  public static async deleteMaterial(companyId: string, id: string) {
    const matObjectId = new Types.ObjectId(id);
    const compObjectId = new Types.ObjectId(companyId);

    // Reference Integrity Check
    const [bomRefCount, formulaRefCount] = await Promise.all([
      BomItem.countDocuments({ companyId: compObjectId, materialName: new RegExp(`^${id}$`, 'i') }),
      Formula.countDocuments({ companyId: compObjectId, 'materialFactors.materialId': matObjectId }),
    ]);

    if (bomRefCount > 0 || formulaRefCount > 0) {
      // Archive instead of hard delete to preserve historical project calculations
      await Material.updateOne(
        { _id: matObjectId, companyId: compObjectId },
        { $set: { status: 'ARCHIVED' } }
      );
      return {
        success: true,
        archived: true,
        message: 'Material is referenced in active project BOQ/Formulas. It has been archived instead of deleted to protect project historical rates.',
      };
    }

    const res = await Material.deleteOne({ _id: matObjectId, companyId: compObjectId });
    if (res.deletedCount === 0) throw new AppError('Material not found', 404);
    return { success: true, message: 'Material deleted successfully' };
  }

  // ==========================================
  // 2. MANPOWER
  // ==========================================
  public static async getManpower(
    companyId: string,
    query: {
      search?: string;
      category?: string;
      skillType?: string;
      status?: string;
      rateListId?: string;
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    const filter: Record<string, unknown> = { companyId: compObjectId };

    if (query.status && query.status !== 'all' && query.status !== 'All Status') {
      filter.status = query.status.toUpperCase();
    }

    if (query.skillType && query.skillType !== 'all' && query.skillType !== 'All Skill Types') {
      filter.skillType = query.skillType;
    }

    if (query.category && query.category !== 'all' && query.category !== 'All Categories') {
      filter.category = new RegExp(`^${query.category.trim()}$`, 'i');
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { code: searchRegex }, { category: searchRegex }];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const [items, total, categories] = await Promise.all([
      LabourType.find(filter)
        .populate('rateListId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LabourType.countDocuments(filter),
      LabourType.distinct('category', { companyId: compObjectId }),
    ]);

    let rateOverrides: Map<string, number> = new Map();
    if (query.rateListId && Types.ObjectId.isValid(query.rateListId)) {
      const rateList = await RateList.findOne({
        _id: new Types.ObjectId(query.rateListId),
        companyId: compObjectId,
      }).lean();
      if (rateList && rateList.labourRates) {
        rateList.labourRates.forEach((r) => {
          rateOverrides.set(r.itemId.toString(), r.rate);
        });
      }
    }

    const formatted = items.map((item) => ({
      ...item,
      effectiveRate: rateOverrides.has(item._id.toString())
        ? rateOverrides.get(item._id.toString())
        : item.standardDailyRate,
      hasOverride: rateOverrides.has(item._id.toString()),
    }));

    return {
      items: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      categories: categories.filter(Boolean),
    };
  }

  public static async createManpower(
    companyId: string,
    data: {
      name: string;
      code?: string;
      category?: string;
      skillType?: 'Skilled' | 'Semi-Skilled' | 'Unskilled' | 'Supervisory' | 'Specialist';
      standardDailyRate: number;
      unit?: string;
      rateListId?: string | null;
      rateVersion?: string;
      source?: string;
      effectiveDate?: string | null;
      status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
      notes?: string;
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    let code = data.code ? data.code.trim().toUpperCase() : '';

    if (!code) {
      code = `L-${data.name
        .trim()
        .replace(/[^A-Za-z0-9]+/g, '')
        .toUpperCase()}`;
    }

    if (data.standardDailyRate < 0) {
      throw new AppError('Daily wage rate cannot be negative', 400);
    }

    const existing = await LabourType.findOne({ companyId: compObjectId, code });
    if (existing) {
      throw new AppError(`A manpower trade with code "${code}" already exists in your company master.`, 400);
    }

    const manpower = await LabourType.create({
      companyId: compObjectId,
      name: data.name.trim(),
      code,
      category: data.category?.trim() || 'Civil Work',
      skillType: data.skillType || 'Skilled',
      standardDailyRate: Math.max(0, Number(data.standardDailyRate) || 0),
      unit: data.unit?.trim() || 'Day',
      rateListId: data.rateListId && Types.ObjectId.isValid(data.rateListId) ? new Types.ObjectId(data.rateListId) : null,
      rateVersion: data.rateVersion?.trim() || '1.0',
      source: data.source?.trim() || 'MARKET',
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
      status: data.status || 'ACTIVE',
      notes: data.notes || '',
    });

    return manpower;
  }

  public static async updateManpower(
    companyId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      category?: string;
      skillType?: 'Skilled' | 'Semi-Skilled' | 'Unskilled' | 'Supervisory' | 'Specialist';
      standardDailyRate?: number;
      unit?: string;
      rateListId?: string | null;
      rateVersion?: string;
      source?: string;
      effectiveDate?: string | null;
      status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
      notes?: string;
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    const item = await LabourType.findOne({
      _id: new Types.ObjectId(id),
      companyId: compObjectId,
    });
    if (!item) throw new AppError('Manpower trade not found', 404);

    if (data.code && data.code.trim().toUpperCase() !== item.code) {
      const newCode = data.code.trim().toUpperCase();
      const codeCollision = await LabourType.findOne({
        companyId: compObjectId,
        code: newCode,
        _id: { $ne: item._id },
      });
      if (codeCollision) {
        throw new AppError(`A manpower trade with code "${newCode}" already exists`, 400);
      }
      item.code = newCode;
    }

    if (data.name) item.name = data.name.trim();
    if (data.category) item.category = data.category.trim();
    if (data.skillType) item.skillType = data.skillType;
    if (data.standardDailyRate !== undefined) {
      if (Number(data.standardDailyRate) < 0) throw new AppError('Rate cannot be negative', 400);
      item.standardDailyRate = Number(data.standardDailyRate);
    }
    if (data.unit) item.unit = data.unit.trim();
    if (data.rateListId !== undefined) {
      item.rateListId = data.rateListId && Types.ObjectId.isValid(data.rateListId) ? new Types.ObjectId(data.rateListId) : null;
    }
    if (data.rateVersion) item.rateVersion = data.rateVersion.trim();
    if (data.source) item.source = data.source.trim();
    if (data.effectiveDate !== undefined) item.effectiveDate = data.effectiveDate ? new Date(data.effectiveDate) : null;
    if (data.status) item.status = data.status;
    if (data.notes !== undefined) item.notes = data.notes;

    await item.save();
    return item;
  }

  public static async toggleManpowerArchive(companyId: string, id: string) {
    const item = await LabourType.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!item) throw new AppError('Manpower trade not found', 404);

    item.status = item.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    await item.save();
    return item;
  }

  public static async deleteManpower(companyId: string, id: string) {
    const labourObjectId = new Types.ObjectId(id);
    const compObjectId = new Types.ObjectId(companyId);

    const [manpowerRefCount, formulaRefCount] = await Promise.all([
      ManpowerItem.countDocuments({ companyId: compObjectId, labourType: new RegExp(`^${id}$`, 'i') }),
      Formula.countDocuments({ companyId: compObjectId, 'labourFactors.labourId': labourObjectId }),
    ]);

    if (manpowerRefCount > 0 || formulaRefCount > 0) {
      await LabourType.updateOne(
        { _id: labourObjectId, companyId: compObjectId },
        { $set: { status: 'ARCHIVED' } }
      );
      return {
        success: true,
        archived: true,
        message: 'Manpower trade is referenced in active projects/formulas. It has been archived instead of deleted.',
      };
    }

    const res = await LabourType.deleteOne({ _id: labourObjectId, companyId: compObjectId });
    if (res.deletedCount === 0) throw new AppError('Manpower trade not found', 404);
    return { success: true, message: 'Manpower trade deleted successfully' };
  }

  // ==========================================
  // 3. MACHINERY
  // ==========================================
  public static async getMachinery(
    companyId: string,
    query: {
      search?: string;
      category?: string;
      rateType?: string;
      status?: string;
      rateListId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    const filter: Record<string, unknown> = { companyId: compObjectId };

    if (query.status && query.status !== 'all' && query.status !== 'All Status') {
      filter.status = query.status.toUpperCase();
    }

    if (query.rateType && query.rateType !== 'all' && query.rateType !== 'All Rate Types') {
      filter.rateType = query.rateType;
    }

    if (query.category && query.category !== 'all' && query.category !== 'All Categories') {
      filter.category = new RegExp(`^${query.category.trim()}$`, 'i');
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { code: searchRegex }, { category: searchRegex }];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const [items, total, categories] = await Promise.all([
      MachineryType.find(filter)
        .populate('rateListId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MachineryType.countDocuments(filter),
      MachineryType.distinct('category', { companyId: compObjectId }),
    ]);

    let rateOverrides: Map<string, number> = new Map();
    if (query.rateListId && Types.ObjectId.isValid(query.rateListId)) {
      const rateList = await RateList.findOne({
        _id: new Types.ObjectId(query.rateListId),
        companyId: compObjectId,
      }).lean();
      if (rateList && rateList.machineryRates) {
        rateList.machineryRates.forEach((r) => {
          rateOverrides.set(r.itemId.toString(), r.rate);
        });
      }
    }

    const formatted = items.map((item) => ({
      ...item,
      effectiveRate: rateOverrides.has(item._id.toString())
        ? rateOverrides.get(item._id.toString())
        : item.standardHourlyRate,
      hasOverride: rateOverrides.has(item._id.toString()),
    }));

    return {
      items: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      categories: categories.filter(Boolean),
    };
  }

  public static async createMachinery(
    companyId: string,
    data: {
      name: string;
      code?: string;
      category?: string;
      standardHourlyRate: number;
      rateType?: 'Hourly' | 'Daily' | 'Shift' | 'Trip';
      unit?: string;
      rateListId?: string | null;
      rateVersion?: string;
      source?: string;
      effectiveDate?: string | null;
      status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
      notes?: string;
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    let code = data.code ? data.code.trim().toUpperCase() : '';

    if (!code) {
      code = `T-${data.name
        .trim()
        .replace(/[^A-Za-z0-9]+/g, '')
        .toUpperCase()}`;
    }

    if (data.standardHourlyRate < 0) {
      throw new AppError('Machinery hire rate cannot be negative', 400);
    }

    const existing = await MachineryType.findOne({ companyId: compObjectId, code });
    if (existing) {
      throw new AppError(`A machinery type with code "${code}" already exists in your company master.`, 400);
    }

    const machinery = await MachineryType.create({
      companyId: compObjectId,
      name: data.name.trim(),
      code,
      category: data.category?.trim() || 'Concreting',
      standardHourlyRate: Math.max(0, Number(data.standardHourlyRate) || 0),
      rateType: data.rateType || 'Hourly',
      unit: data.unit?.trim() || 'Hour',
      rateListId: data.rateListId && Types.ObjectId.isValid(data.rateListId) ? new Types.ObjectId(data.rateListId) : null,
      rateVersion: data.rateVersion?.trim() || '1.0',
      source: data.source?.trim() || 'MARKET',
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
      status: data.status || 'ACTIVE',
      notes: data.notes || '',
    });

    return machinery;
  }

  public static async updateMachinery(
    companyId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      category?: string;
      standardHourlyRate?: number;
      rateType?: 'Hourly' | 'Daily' | 'Shift' | 'Trip';
      unit?: string;
      rateListId?: string | null;
      rateVersion?: string;
      source?: string;
      effectiveDate?: string | null;
      status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
      notes?: string;
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    const item = await MachineryType.findOne({
      _id: new Types.ObjectId(id),
      companyId: compObjectId,
    });
    if (!item) throw new AppError('Machinery type not found', 404);

    if (data.code && data.code.trim().toUpperCase() !== item.code) {
      const newCode = data.code.trim().toUpperCase();
      const codeCollision = await MachineryType.findOne({
        companyId: compObjectId,
        code: newCode,
        _id: { $ne: item._id },
      });
      if (codeCollision) {
        throw new AppError(`A machinery type with code "${newCode}" already exists`, 400);
      }
      item.code = newCode;
    }

    if (data.name) item.name = data.name.trim();
    if (data.category) item.category = data.category.trim();
    if (data.rateType) item.rateType = data.rateType;
    if (data.standardHourlyRate !== undefined) {
      if (Number(data.standardHourlyRate) < 0) throw new AppError('Rate cannot be negative', 400);
      item.standardHourlyRate = Number(data.standardHourlyRate);
    }
    if (data.unit) item.unit = data.unit.trim();
    if (data.rateListId !== undefined) {
      item.rateListId = data.rateListId && Types.ObjectId.isValid(data.rateListId) ? new Types.ObjectId(data.rateListId) : null;
    }
    if (data.rateVersion) item.rateVersion = data.rateVersion.trim();
    if (data.source) item.source = data.source.trim();
    if (data.effectiveDate !== undefined) item.effectiveDate = data.effectiveDate ? new Date(data.effectiveDate) : null;
    if (data.status) item.status = data.status;
    if (data.notes !== undefined) item.notes = data.notes;

    await item.save();
    return item;
  }

  public static async toggleMachineryArchive(companyId: string, id: string) {
    const item = await MachineryType.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!item) throw new AppError('Machinery type not found', 404);

    item.status = item.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    await item.save();
    return item;
  }

  public static async deleteMachinery(companyId: string, id: string) {
    const macObjectId = new Types.ObjectId(id);
    const compObjectId = new Types.ObjectId(companyId);

    const [machineryRefCount, formulaRefCount] = await Promise.all([
      MachineryItem.countDocuments({ companyId: compObjectId, machineryType: new RegExp(`^${id}$`, 'i') }),
      Formula.countDocuments({ companyId: compObjectId, 'machineryFactors.machineryId': macObjectId }),
    ]);

    if (machineryRefCount > 0 || formulaRefCount > 0) {
      await MachineryType.updateOne(
        { _id: macObjectId, companyId: compObjectId },
        { $set: { status: 'ARCHIVED' } }
      );
      return {
        success: true,
        archived: true,
        message: 'Machinery type is referenced in active projects/formulas. It has been archived instead of deleted.',
      };
    }

    const res = await MachineryType.deleteOne({ _id: macObjectId, companyId: compObjectId });
    if (res.deletedCount === 0) throw new AppError('Machinery type not found', 404);
    return { success: true, message: 'Machinery type deleted successfully' };
  }

  // ==========================================
  // 4. FORMULAS
  // ==========================================
  public static async getFormulas(
    companyId: string,
    query: {
      search?: string;
      category?: string;
      typeFilter?: 'all' | 'materials' | 'manpower' | 'machinery';
      page?: number;
      limit?: number;
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    const filter: Record<string, unknown> = { companyId: compObjectId };

    if (query.category && query.category !== 'all' && query.category !== 'All Categories') {
      filter.category = new RegExp(`^${query.category.trim()}$`, 'i');
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
      ];
    }

    if (query.typeFilter === 'materials') {
      filter['materialFactors.0'] = { $exists: true };
    } else if (query.typeFilter === 'manpower') {
      filter['labourFactors.0'] = { $exists: true };
    } else if (query.typeFilter === 'machinery') {
      filter['machineryFactors.0'] = { $exists: true };
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const [items, total, categories] = await Promise.all([
      Formula.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Formula.countDocuments(filter),
      Formula.distinct('category', { companyId: compObjectId }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      categories: categories.filter(Boolean),
    };
  }

  public static async createFormula(
    companyId: string,
    data: {
      name: string;
      code?: string;
      category: string;
      unit: string;
      description?: string;
      referenceStandard?: string;
      materialFactors?: Array<{ materialId?: string; materialCode: string; name: string; unit: string; factor: number; wastePercent?: number }>;
      labourFactors?: Array<{ labourId?: string; labourCode: string; name: string; unit: string; factor: number }>;
      machineryFactors?: Array<{ machineryId?: string; machineryCode: string; name: string; unit: string; factor: number }>;
    }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    let code = data.code ? data.code.trim().toUpperCase() : '';

    if (!code) {
      code = data.name
        .trim()
        .replace(/[^A-Za-z0-9]+/g, '_')
        .toUpperCase();
    }

    const existing = await Formula.findOne({ companyId: compObjectId, code });
    if (existing) {
      code = `${code}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const formula = await Formula.create({
      companyId: compObjectId,
      name: data.name.trim(),
      code,
      category: data.category?.trim() || 'Concrete Work',
      unit: data.unit?.trim() || 'Cum',
      description: data.description || '',
      referenceStandard: data.referenceStandard || '',
      materialFactors: data.materialFactors || [],
      labourFactors: data.labourFactors || [],
      machineryFactors: data.machineryFactors || [],
    });

    return formula;
  }

  public static async updateFormula(companyId: string, id: string, data: Partial<IFormula>) {
    const item = await Formula.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!item) throw new AppError('Formula not found', 404);

    Object.assign(item, data);
    await item.save();
    return item;
  }

  public static async copyFormula(companyId: string, id: string) {
    const item = await Formula.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    }).lean();
    if (!item) throw new AppError('Source formula not found', 404);

    const newCode = `${item.code}_COPY_${Math.floor(100 + Math.random() * 900)}`;
    const copy = await Formula.create({
      ...item,
      _id: new Types.ObjectId(),
      name: `${item.name} (Copy)`,
      code: newCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return copy;
  }

  public static async deleteFormula(companyId: string, id: string) {
    const res = await Formula.deleteOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (res.deletedCount === 0) throw new AppError('Formula not found', 404);
    return { success: true, message: 'Formula deleted successfully' };
  }

  // ==========================================
  // 5. RATE LISTS
  // ==========================================
  public static async getRateLists(companyId: string) {
    const compObjectId = new Types.ObjectId(companyId);

    const [rateLists, totalMaterials, totalLabour, totalMachinery] = await Promise.all([
      RateList.find({ companyId: compObjectId }).sort({ createdAt: -1 }).lean(),
      Material.countDocuments({ companyId: compObjectId }),
      LabourType.countDocuments({ companyId: compObjectId }),
      MachineryType.countDocuments({ companyId: compObjectId }),
    ]);

    const formatted = rateLists.map((rl) => ({
      ...rl,
      coverage: {
        materials: `${rl.materialRates?.length || 0}/${totalMaterials}`,
        labour: `${rl.labourRates?.length || 0}/${totalLabour}`,
        machinery: `${rl.machineryRates?.length || 0}/${totalMachinery}`,
      },
    }));

    return formatted;
  }

  public static async createRateList(
    companyId: string,
    data: { name: string; code?: string; description?: string; isDefault?: boolean }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    let code = data.code ? data.code.trim().toUpperCase() : '';

    if (!code) {
      code = data.name
        .trim()
        .replace(/[^A-Za-z0-9]+/g, '_')
        .toUpperCase();
    }

    const rateList = await RateList.create({
      companyId: compObjectId,
      name: data.name.trim(),
      code,
      description: data.description || '',
      isDefault: data.isDefault || false,
      materialRates: [],
      labourRates: [],
      machineryRates: [],
    });

    return rateList;
  }

  public static async getRateListById(companyId: string, id: string) {
    const rateList = await RateList.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    }).lean();

    if (!rateList) throw new AppError('Rate list not found', 404);
    return rateList;
  }

  public static async updateRateListOverrides(
    companyId: string,
    id: string,
    data: {
      materialRates?: Array<{ itemId: string; itemCode: string; itemName: string; unit: string; rate: number }>;
      labourRates?: Array<{ itemId: string; itemCode: string; itemName: string; unit: string; rate: number }>;
      machineryRates?: Array<{ itemId: string; itemCode: string; itemName: string; unit: string; rate: number }>;
    }
  ) {
    const rateList = await RateList.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });

    if (!rateList) throw new AppError('Rate list not found', 404);

    if (data.materialRates) rateList.materialRates = data.materialRates as any;
    if (data.labourRates) rateList.labourRates = data.labourRates as any;
    if (data.machineryRates) rateList.machineryRates = data.machineryRates as any;

    await rateList.save();
    return rateList;
  }

  public static async deleteRateList(companyId: string, id: string) {
    const res = await RateList.deleteOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (res.deletedCount === 0) throw new AppError('Rate list not found', 404);
    return { success: true, message: 'Rate list deleted successfully' };
  }

  // ==========================================
  // 6. IMPORT HISTORY
  // ==========================================
  public static async getImportHistory(companyId: string) {
    const compObjectId = new Types.ObjectId(companyId);
    return SorImport.find({ companyId: compObjectId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
  }
}
