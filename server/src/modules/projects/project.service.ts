import { Types } from 'mongoose';
import { Project, IProject } from '../../models/Project';
import { SiteEngineer } from '../../models/SiteEngineer';
import { Notification } from '../../models/Notification';
import { AuthUser } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';
import { CreateProjectInput, UpdateProjectInput, ProjectQueryInput } from './project.validation';
import { ProjectStats } from './project.types';
import { AuditService } from '../audit/audit.service';
import { RecycleBinService } from '../recycleBin/recycleBin.service';
import { RecycleBinItem } from '../../models/RecycleBinItem';

export class ProjectService {
  public static async getProjects(companyId: string, query: ProjectQueryInput, authUser?: AuthUser) {
    const filter: Record<string, unknown> = {
      companyId: new Types.ObjectId(companyId),
      deletedAt: null,
    };

    // If request is made by a Site Engineer, strictly restrict to their assigned sites
    if (authUser?.role === 'SITE_ENGINEER') {
      const engineer = await SiteEngineer.findOne({
        companyId: new Types.ObjectId(companyId),
        $or: [
          { userId: new Types.ObjectId(authUser.userId) },
          { loginId: authUser.email.toLowerCase() },
        ],
      });

      if (!engineer) {
        return {
          projects: [],
          pagination: { total: 0, page: 1, limit: query.limit || 12, totalPages: 0, hasMore: false },
        };
      }

      filter.$or = [
        { assignedEngineers: engineer._id },
        { _id: { $in: engineer.assignedProjectIds || [] } },
      ];
    }

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.projectType && query.projectType !== 'all') {
      filter.projectType = query.projectType;
    }

    if (query.isArchived !== undefined) {
      filter.isArchived = query.isArchived;
    }

    if (!query.includeSubProjects) {
      const parentCondition = [
        { $or: [{ parentId: null }, { parentId: { $exists: false } }] },
        { code: { $not: /-SP\d+/i } },
      ];
      if (filter.$and && Array.isArray(filter.$and)) {
        filter.$and.push(...parentCondition);
      } else {
        filter.$and = parentCondition;
      }
    }

    if (query.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      const searchCondition = [
        { name: searchRegex },
        { code: searchRegex },
        { clientName: searchRegex },
        { location: searchRegex },
      ];
      if (filter.$or && Array.isArray(filter.$or)) {
        // Intersect with existing $or
        filter.$and = filter.$and || [];
        (filter.$and as any[]).push({ $or: searchCondition });
      } else {
        filter.$or = searchCondition;
      }
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
        .populate('assignedEngineers', 'name loginId mobile expertise status')
        .lean(),
      Project.countDocuments(filter),
    ]);

    const enhancedProjects = await Promise.all(
      projects.map(async (p) => {
        const subProjectsCount = await Project.countDocuments({
          parentId: p._id,
          deletedAt: null,
        });
        return {
          ...p,
          subProjectsCount,
        };
      })
    );

    return {
      projects: enhancedProjects,
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
          $or: [{ parentId: null }, { parentId: { $exists: false } }],
          code: { $not: /-SP\d+/i },
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

  public static async getProjectById(companyId: string, projectId: string, authUser?: AuthUser) {
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
      .populate('assignedEngineers', 'name loginId mobile expertise status')
      .lean();

    if (!project) {
      throw new AppError('Project not found or may have been deleted', 404);
    }

    // Role-based authorization for Site Engineer
    if (authUser?.role === 'SITE_ENGINEER') {
      const engineer = await SiteEngineer.findOne({
        companyId: new Types.ObjectId(companyId),
        $or: [
          { userId: new Types.ObjectId(authUser.userId) },
          { loginId: authUser.email.toLowerCase() },
        ],
      });

      const isAssigned =
        engineer &&
        ((project.assignedEngineers as any[])?.some(
          (e: any) => (e._id || e).toString() === engineer._id.toString()
        ) ||
          engineer.assignedProjectIds?.some((pId: any) => pId.toString() === projectId));

      if (!isAssigned) {
        throw new AppError('Forbidden: You are not authorized to access this site', 403);
      }
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
      .populate('assignedEngineers', 'name loginId mobile expertise status')
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

    const assignedEngineers = Array.isArray(input.assignedEngineers)
      ? input.assignedEngineers.map((id) => new Types.ObjectId(id))
      : [];

    const project = await Project.create({
      ...input,
      code: normalizedCode,
      companyId: compObjectId,
      assignedEngineers,
      createdBy: new Types.ObjectId(userId),
    });

    // Synchronize SiteEngineer.assignedProjectIds and send notifications
    if (assignedEngineers.length > 0) {
      await SiteEngineer.updateMany(
        { _id: { $in: assignedEngineers }, companyId: compObjectId },
        { $addToSet: { assignedProjectIds: project._id }, $inc: { projectsCount: 1 } }
      );

      const engineers = await SiteEngineer.find({
        _id: { $in: assignedEngineers },
        companyId: compObjectId,
      }).select('userId name');

      for (const eng of engineers) {
        if (eng.userId) {
          await Notification.create({
            companyId: compObjectId,
            recipientId: eng.userId,
            recipientRole: 'SITE_ENGINEER',
            title: 'New Site Assigned',
            message: `You have been assigned to project: ${project.name} (${project.code}).`,
            type: 'SITE_ASSIGNED',
            entityId: project._id,
            entityType: 'Project',
            link: '/engineer-dashboard',
          });
        }
      }
    }

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
    const oldEngineers = (existing.assignedEngineers || []).map((e) => e.toString());

    let newEngineers: Types.ObjectId[] | undefined;
    if (input.assignedEngineers !== undefined) {
      newEngineers = input.assignedEngineers.map((id) => new Types.ObjectId(id));
      (input as any).assignedEngineers = newEngineers;
    }

    Object.assign(existing, input);
    await existing.save();

    // Synchronize SiteEngineer assignments if assignedEngineers was modified
    if (newEngineers) {
      const newIdsStr = newEngineers.map((id) => id.toString());
      const addedEngineers = newIdsStr.filter((id) => !oldEngineers.includes(id));
      const removedEngineers = oldEngineers.filter((id) => !newIdsStr.includes(id));

      if (addedEngineers.length > 0) {
        await SiteEngineer.updateMany(
          { _id: { $in: addedEngineers }, companyId: compObjectId },
          { $addToSet: { assignedProjectIds: existing._id }, $inc: { projectsCount: 1 } }
        );

        const engineers = await SiteEngineer.find({
          _id: { $in: addedEngineers },
          companyId: compObjectId,
        }).select('userId name');

        for (const eng of engineers) {
          if (eng.userId) {
            await Notification.create({
              companyId: compObjectId,
              recipientId: eng.userId,
              recipientRole: 'SITE_ENGINEER',
              title: 'New Site Assigned',
              message: `You have been assigned to project: ${existing.name} (${existing.code}).`,
              type: 'SITE_ASSIGNED',
              entityId: existing._id,
              entityType: 'Project',
              link: '/engineer-dashboard',
            });
          }
        }
      }

      if (removedEngineers.length > 0) {
        await SiteEngineer.updateMany(
          { _id: { $in: removedEngineers }, companyId: compObjectId },
          { $pull: { assignedProjectIds: existing._id }, $inc: { projectsCount: -1 } }
        );
      }
    }

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

    // Sync with centralized 60-day Recycle Bin
    await RecycleBinService.moveToRecycleBin({
      companyId,
      entityType: 'Project',
      originalId: project._id,
      title: project.name,
      code: project.code,
      subtitle: `Client: ${project.clientName || '-'} • Value: ₹${(project.contractValue || project.estimatedValue || 0).toLocaleString()}`,
      data: project.toObject(),
      deletedBy: userId,
      deletedByName: 'Admin',
    });

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

    // Mark as restored in RecycleBinItem
    await RecycleBinItem.updateOne(
      { originalId: project._id, companyId: new Types.ObjectId(companyId) },
      { $set: { status: 'restored', restoredAt: new Date() } }
    );

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
