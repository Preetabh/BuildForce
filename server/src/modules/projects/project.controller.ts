import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './project.service';
import { ProjectQueryInput } from './project.validation';

export class ProjectController {
  public static async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = req.query as unknown as ProjectQueryInput;
      const result = await ProjectService.getProjects(companyId, query);
      res.status(200).json({
        success: true,
        data: result.projects,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProjectStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const stats = await ProjectService.getProjectStats(companyId);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const project = await ProjectService.getProjectById(companyId, id);
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = req.user!;
      const ip = req.ip || req.socket.remoteAddress;
      const project = await ProjectService.createProject(companyId, userId, req.body, ip);
      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getSubProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const subProjects = await ProjectService.getSubProjects(companyId, id);
      res.status(200).json({
        success: true,
        data: subProjects,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createSubProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const subProject = await ProjectService.createSubProject(companyId, userId, id, req.body, ip);
      res.status(201).json({
        success: true,
        message: 'Sub-project created successfully',
        data: subProject,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const updated = await ProjectService.updateProject(companyId, userId, id, req.body, ip);
      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async softDeleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const result = await ProjectService.softDeleteProject(companyId, userId, id, ip);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async restoreProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const result = await ProjectService.restoreProject(companyId, userId, id, ip);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async toggleArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const project = await ProjectService.toggleArchive(companyId, userId, id, ip);
      res.status(200).json({
        success: true,
        message: project.isArchived ? 'Project archived' : 'Project unarchived',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getRecycleBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const projects = await ProjectService.getRecycleBinProjects(companyId);
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async permanentDeleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const result = await ProjectService.permanentDeleteProject(companyId, userId, id, ip);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
