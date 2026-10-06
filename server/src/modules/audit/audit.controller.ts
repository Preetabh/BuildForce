import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { AuditAction, AuditSeverity, AuditStatus } from '../../models/AuditLog';

export class AuditController {
  /**
   * Search and filter enterprise audit logs with server-side pagination
   */
  public static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const {
        page = '1',
        limit = '25',
        search = '',
        userId,
        userIds,
        actions,
        action,
        modules,
        module: modParam,
        entities,
        entity,
        entityId,
        severity,
        status,
        ip,
        startDate,
        endDate,
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = req.query;

      // Parse array parameters if provided as comma-separated or array
      const parseArray = (val: unknown): string[] | undefined => {
        if (!val) return undefined;
        if (Array.isArray(val)) return val.map(String);
        return String(val).split(',').map((s) => s.trim()).filter(Boolean);
      };

      const result = await AuditService.queryLogs({
        companyId,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        search: (search as string) || undefined,
        userId: (userId as string) || undefined,
        userIds: parseArray(userIds),
        actions: parseArray(actions || action) as AuditAction[] | undefined,
        modules: parseArray(modules || modParam),
        entities: parseArray(entities || entity),
        entityId: (entityId as string) || undefined,
        severity: parseArray(severity) as AuditSeverity[] | undefined,
        status: (status as AuditStatus) || undefined,
        ip: (ip as string) || undefined,
        startDate: (startDate as string) || undefined,
        endDate: (endDate as string) || undefined,
        sortBy: (sortBy as string) || 'timestamp',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      });

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit log statistics and analytics breakdown
   */
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { startDate, endDate } = req.query;

      const range = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const stats = await AuditService.getStats(companyId, range);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activity logs for a specific user (profile history)
   */
  public static async getUserLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      let targetUserId = req.params.userId;
      if (targetUserId === 'me') {
        targetUserId = req.user!.userId;
      }

      const limit = parseInt(req.query.limit as string, 10) || 50;
      const logs = await AuditService.getLogsForUser(companyId, targetUserId, limit);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activity logs for a specific entity (Vendor, Project, Role, Lead, etc.)
   */
  public static async getEntityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { entity, entityId } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const logs = await AuditService.getLogsForEntity(companyId, entity, entityId, limit);
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single audit log details with before/after diff and related context
   */
  public static async getLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;

      const result = await AuditService.getLogById(companyId, id);
      if (!result) {
        res.status(404).json({ success: false, message: 'Audit log not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.log,
        related: result.related,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export audit logs to CSV or JSON
   */
  public static async exportLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const format = (req.query.format as string)?.toLowerCase() || 'csv';

      // Query top matching logs (up to 2000 for export)
      const result = await AuditService.queryLogs({
        companyId,
        page: 1,
        limit: 2000,
        search: (req.query.search as string) || undefined,
        actions: req.query.actions ? (req.query.actions as string).split(',') as any : undefined,
        modules: req.query.modules ? (req.query.modules as string).split(',') : undefined,
        severity: req.query.severity ? (req.query.severity as string).split(',') as any : undefined,
        status: (req.query.status as any) || undefined,
        startDate: (req.query.startDate as string) || undefined,
        endDate: (req.query.endDate as string) || undefined,
      });

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.json"`);
        res.status(200).send(JSON.stringify(result.logs, null, 2));
        return;
      }

      // Default CSV export
      const rows = [
        [
          'Timestamp',
          'User Name',
          'User Email',
          'Role',
          'Action',
          'Module',
          'Entity',
          'Entity ID',
          'Entity Name',
          'Summary',
          'Severity',
          'Status',
          'IP Address',
          'Device',
          'Changed Fields',
        ].join(','),
      ];

      for (const log of result.logs as any[]) {
        const changedFields = (log.diff || []).map((d: any) => d.field).join('; ');
        const row = [
          `"${new Date(log.timestamp).toISOString()}"`,
          `"${log.userSnapshot?.name || ''}"`,
          `"${log.userSnapshot?.email || ''}"`,
          `"${log.userSnapshot?.role || ''}"`,
          `"${log.action}"`,
          `"${log.module}"`,
          `"${log.entity}"`,
          `"${log.entityId}"`,
          `"${(log.entityName || '').replace(/"/g, '""')}"`,
          `"${(log.summary || '').replace(/"/g, '""')}"`,
          `"${log.severity}"`,
          `"${log.status}"`,
          `"${log.ipAddress || ''}"`,
          `"${log.device?.browser || ''} on ${log.device?.os || ''}"`,
          `"${changedFields}"`,
        ];
        rows.push(row.join(','));
      }

      const csvContent = rows.join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}
