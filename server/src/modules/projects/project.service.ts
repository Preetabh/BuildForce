import { Types } from 'mongoose';
import { Project, IProject } from '../../models/Project';
import { AppError } from '../../middleware/error.middleware';
import { CreateProjectInput, UpdateProjectInput, ProjectQueryInput } from './project.validation';
import { ProjectStats } from './project.types';
import { AuditService } from '../audit/audit.service';

export class ProjectService {
  public static async getProjects(companyId: string, query: ProjectQueryInput) {
    const filter: Record<string, unknown> = {
      companyId: new Types.ObjectId(companyId),
      deletedAt: null,
    };

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.projectType && query.projectType !== 'all') {
      filter.projectType = query.projectType;
    }

    if (query.isArchived !== undefined) {
      filter.isArchived = query.isArchived;
    }

    if (query.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { clientName: searchRegex },
        { location: searchRegex },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      Project.countDocuments(filter),
    ]);

    return {
      projects,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + projects.length < total,
      },
    };
  }

  public static async getProjectStats(companyId: string): Promise<ProjectStats> {
    const compObjectId = new Types.ObjectId(companyId);

    const stats = await Project.aggregate([
      {
        $match: {
          companyId: compObjectId,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          completedProjects: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          draftProjects: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
          },
          onHoldProjects: {
            $sum: { $cond: [{ $eq: ['$status', 'on_hold'] }, 1, 0] },
          },
          archivedProjects: {
            $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] },
          },
          totalProjectValue: {
            $sum: {
              $cond: [
                { $gt: ['$contractValue', 0] },
                '$contractValue',
                '$estimatedValue',
              ],
            },
          },
        },
      },
    ]);

    if (!stats || stats.length === 0) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        draftProjects: 0,
        onHoldProjects: 0,
        archivedProjects: 0,
        totalProjectValue: 0,
        currency: 'INR',
      };
    }

    const row = stats[0];
    return {
      totalProjects: row.totalProjects || 0,
      activeProjects: row.activeProjects || 0,
      completedProjects: row.completedProjects || 0,
      draftProjects: row.draftProjects || 0,
      onHoldProjects: row.onHoldProjects || 0,
      archivedProjects: row.archivedProjects || 0,
      totalProjectValue: row.totalProjectValue || 0,
      currency: 'INR',
    };
  }

  public static async getProjectById(companyId: string, projectId: string) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new AppError('Invalid project ID format', 400);
    }

    const project = await Project.findOne({
      _id: new Types.ObjectId(projectId),
      companyId: new Types.ObjectId(companyId),
      deletedAt: null,
    })
      .populate('createdBy', 'name email')
      .populate('parentId', 'name code projectType status')
      .lean();

    if (!project) {
      throw new AppError('Project not found or may have been deleted', 404);
    }

    const subProjectsCount = await Project.countDocuments({
      companyId: new Types.ObjectId(companyId),
      parentId: project._id,
      deletedAt: null,
    });

    return {
      ...project,
      subProjectsCount,
    };
  }

  public static async getSubProjects(companyId: string, parentId: string) {
    if (!Types.ObjectId.isValid(parentId)) {
      throw new AppError('Invalid parent project ID format', 400);
    }

    const compObjectId = new Types.ObjectId(companyId);
    const parentObjectId = new Types.ObjectId(parentId);

    const subProjects = await Project.find({
      companyId: compObjectId,
      parentId: parentObjectId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean();

    return subProjects;
  }

  public static async createSubProject(
    companyId: string,
    userId: string,
    parentId: string,
    input: CreateProjectInput,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(parentId)) {
      throw new AppError('Invalid parent project ID format', 400);
    }

    const compObjectId = new Types.ObjectId(companyId);
    const parentObjectId = new Types.ObjectId(parentId);

    const parentProject = await Project.findOne({
      _id: parentObjectId,
      companyId: compObjectId,
      deletedAt: null,
    });

    if (!parentProject) {
      throw new AppError('Parent project not found', 404);
    }

    // Auto-generate code prefixed with parent code if not explicitly provided
    let normalizedCode = input.code ? input.code.trim().toUpperCase() : '';
    if (!normalizedCode) {
      const existingCount = await Project.countDocuments({
        companyId: compObjectId,
        parentId: parentObjectId,
      });
      normalizedCode = `${parentProject.code}-SP${String(existingCount + 1).padStart(2, '0')}`;
    }

    const subProject = await this.createProject(
      companyId,
      userId,
      {
        ...input,
        code: normalizedCode,
        parentId: parentObjectId.toString(),
        clientName: input.clientName || parentProject.clientName || '',
        location: input.location || parentProject.location || '',
        projectType: input.projectType || parentProject.projectType || 'Residential Building',
      },
      ipAddress
    );

    return subProject;
  }

  public static async createProject(
    companyId: string,
    userId: string,
    input: CreateProjectInput,
    ipAddress?: string
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    let normalizedCode = input.code ? input.code.trim().toUpperCase() : '';

    if (!normalizedCode) {
      const cleanPrefix = input.name
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase() || 'PRJ';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      normalizedCode = `${cleanPrefix}-${randomSuffix}`;
    }

    const existingCode = await Project.findOne({
      companyId: compObjectId,
      code: normalizedCode,
    });

    if (existingCode) {
      normalizedCode = `${normalizedCode}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
    }

    const project = await Project.create({
      ...input,
      code: normalizedCode,
      companyId: compObjectId,
      createdBy: new Types.ObjectId(userId),
    });

    await AuditService.log({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Project',
      entityId: project._id.toString(),
      newValue: {
        name: project.name,
        code: project.code,
        status: project.status,
        contractValue: project.contractValue,
      },
      ipAddress,
    });

    return project;
  }

  public static async updateProject(
    companyId: string,
    userId: string,
    projectId: string,
    input: UpdateProjectInput,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new AppError('Invalid project ID format', 400);
    }

    const compObjectId = new Types.ObjectId(companyId);
    const existing = await Project.findOne({
      _id: new Types.ObjectId(projectId),
      companyId: compObjectId,
      deletedAt: null,
    });

    if (!existing) {
      throw new AppError('Project not found or may have been deleted', 404);
    }

    if (input.code && input.code.trim().toUpperCase() !== existing.code) {
      const normalizedCode = input.code.trim().toUpperCase();
      const codeCollision = await Project.findOne({
        companyId: compObjectId,
        code: normalizedCode,
        _id: { $ne: existing._id },
      });

      if (codeCollision) {
        throw new AppError(
          `A project with code "${normalizedCode}" already exists in your company`,
          400
        );
      }
      input.code = normalizedCode;
    }

    const oldSnapshot = existing.toObject();

    Object.assign(existing, input);
    await existing.save();

    await AuditService.log({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Project',
      entityId: existing._id.toString(),
      oldValue: {
        name: oldSnapshot.name,
        status: oldSnapshot.status,
        contractValue: oldSnapshot.contractValue,
        progress: oldSnapshot.progress,
      },
      newValue: {
        name: existing.name,
        status: existing.status,
        contractValue: existing.contractValue,
        progress: existing.progress,
      },
      ipAddress,
    });

    return existing;
  }

  public static async softDeleteProject(
    companyId: string,
    userId: string,
    projectId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new AppError('Invalid project ID format', 400);
    }

    const project = await Project.findOne({
      _id: new Types.ObjectId(projectId),
      companyId: new Types.ObjectId(companyId),
      deletedAt: null,
    });

    if (!project) {
      throw new AppError('Project not found or already deleted', 404);
    }

    project.deletedAt = new Date();
    project.deletedBy = new Types.ObjectId(userId);
    await project.save();

    await AuditService.log({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'Project',
      entityId: project._id.toString(),
      oldValue: { name: project.name, code: project.code },
      newValue: { deletedAt: project.deletedAt },
      ipAddress,
    });

    return { success: true, message: `Project "${project.name}" moved to Recycle Bin` };
  }

  public static async restoreProject(
    companyId: string,
    userId: string,
    projectId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new AppError('Invalid project ID format', 400);
    }

    const project = await Project.findOne({
      _id: new Types.ObjectId(projectId),
      companyId: new Types.ObjectId(companyId),
      deletedAt: { $ne: null },
    });

    
    if (!project) {
      throw new AppError('Project not found in Recycle Bin', 404);
    }

    project.deletedAt = null;
    project.deletedBy = null;
    await project.save();

    await AuditService.log({
      companyId,
      userId,
      action: 'RESTORE',
      entity: 'Project',
      entityId: project._id.toString(),
      newValue: { name: project.name, code: project.code, restoredAt: new Date() },
      ipAddress,
    });

    return { success: true, message: `Project "${project.name}" restored successfully`, project };
  }

  public static async toggleArchive(
    companyId: string,
    userId: string,
    projectId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new AppError('Invalid project ID format', 400);
    }

    const project = await Project.findOne({
      _id: new Types.ObjectId(projectId),
      companyId: new Types.ObjectId(companyId),
      deletedAt: null,
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    project.isArchived = !project.isArchived;
    if (project.isArchived && project.status !== 'completed') {
      project.status = 'archived';
    } else if (!project.isArchived && project.status === 'archived') {
      project.status = 'active';
    }

    await project.save();

    await AuditService.log({
      companyId,
      userId,
      action: 'ARCHIVE',
      entity: 'Project',
      entityId: project._id.toString(),
      newValue: { isArchived: project.isArchived, status: project.status },
      ipAddress,
    });

    return project;
  }

  public static async getRecycleBinProjects(companyId: string) {
    return Project.find({
      companyId: new Types.ObjectId(companyId),
      deletedAt: { $ne: null },
    })
      .sort({ deletedAt: -1 })
      .populate('deletedBy', 'name email')
      .lean();
  }

  public static async permanentDeleteProject(
    companyId: string,
    userId: string,
    projectId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new AppError('Invalid project ID format', 400);
    }

    const project = await Project.findOne({
      _id: new Types.ObjectId(projectId),
      companyId: new Types.ObjectId(companyId),
      deletedAt: { $ne: null },
    });

    if (!project) {
      throw new AppError('Project not found in Recycle Bin', 404);
    }

    await Project.deleteOne({ _id: project._id });

    await AuditService.log({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'Project',
      entityId: project._id.toString(),
      oldValue: { name: project.name, code: project.code, permanentlyDeleted: true },
      ipAddress,
    });

    return {
      success: true,
      message: `Project "${project.name}" permanently deleted from database`,
    };
  }
}
