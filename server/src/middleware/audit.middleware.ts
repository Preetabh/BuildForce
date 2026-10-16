import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../modules/audit/audit.service';
import { AuditAction, AuditSeverity } from '../models/AuditLog';

export interface AuditRouteOptions {
  module: string;
  entity: string;
  action?: AuditAction;
  getEntityId?: (req: Request, res: Response) => string;
  getEntityName?: (req: Request, res: Response) => string;
  getSummary?: (req: Request, res: Response) => string;
  getOldValue?: (req: Request) => Promise<Record<string, unknown> | null> | Record<string, unknown> | null;
  severity?: AuditSeverity;
}

/**
 * Express middleware to automatically log route operations upon successful response
 */
export function auditRoute(options: AuditRouteOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Determine action from HTTP method if not provided
    let defaultAction: AuditAction = 'UPDATE';
    if (req.method === 'POST') defaultAction = 'CREATE';
    else if (req.method === 'DELETE') defaultAction = 'DELETE';
    else if (req.method === 'PATCH' || req.method === 'PUT') defaultAction = 'UPDATE';

    const action = options.action || defaultAction;

    // Capture pre-mutation state if resolver provided
    let oldValue: Record<string, unknown> | null = null;
    if (options.getOldValue) {
      try {
        oldValue = await options.getOldValue(req);
      } catch {
        oldValue = null;
      }
    }

    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Execute original json response first
      const result = originalJson(body);

      // Perform non-blocking async audit log in background
      setImmediate(async () => {
        try {
          const companyId = req.user?.companyId;
          if (!companyId) return;

          const entityId = options.getEntityId
            ? options.getEntityId(req, res)
            : req.params.id || req.params.userId || req.params.projectId || req.params.vendorId || body?.data?._id || 'N/A';

          const entityName = options.getEntityName
            ? options.getEntityName(req, res)
            : body?.data?.name || body?.data?.title || '';

          const isSuccess = res.statusCode >= 200 && res.statusCode < 400 && body?.success !== false;

          await AuditService.log({
            companyId,
            userId: req.user?.userId,
            action,
            module: options.module,
            entity: options.entity,
            entityId: entityId.toString(),
            entityName,
            summary: options.getSummary ? options.getSummary(req, res) : undefined,
            oldValue,
            newValue: req.body,
            status: isSuccess ? 'SUCCESS' : 'FAILURE',
            failureReason: !isSuccess ? body?.message || 'Request returned an error' : undefined,
            severity: options.severity,
            req,
          });
        } catch {
          // Swallow any logging error so response is unaffected
        }
      });

      return result;
    };

    next();
  };
}

/**
 * Universal Action Audit Middleware:
 * Automatically captures ANY website action across all routes if not already logged explicitly.
 */
export function universalActionAuditMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only capture state-mutating HTTP methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const url = req.originalUrl || req.url;
    // Skip internal auth/token refresh/health/audit querying
    if (
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/logout') ||
      url.includes('/api/audit') ||
      url.includes('/api/health')
    ) {
      return next();
    }

    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      const result = originalJson(body);

      setImmediate(async () => {
        try {
          // If already explicitly logged by controller, skip duplicate
          if ((req as any)._auditLogged) {
            return;
          }

          const companyId = req.user?.companyId;
          if (!companyId) return;

          // Infer clean module name from URL
          const pathClean = url.replace(/^\/api\//, '').split('?')[0];
          const parts = pathClean.split('/').filter(Boolean);
          const rawModule = parts[0] || 'GENERAL';
          const module = rawModule.toUpperCase().replace(/-/g, '_');

          // Action type
          let action: AuditAction = 'UPDATE';
          if (req.method === 'POST') action = 'CREATE';
          else if (req.method === 'DELETE') action = 'DELETE';
          else if (req.method === 'PATCH' || req.method === 'PUT') action = 'UPDATE';

          const entityId =
            req.params?.id ||
            req.params?.projectId ||
            req.params?.userId ||
            req.params?.engineerId ||
            body?.data?._id ||
            'N/A';

          const entityName =
            body?.data?.name ||
            body?.data?.title ||
            body?.data?.clientName ||
            req.body?.name ||
            req.body?.clientName ||
            '';

          const isSuccess = res.statusCode >= 200 && res.statusCode < 400 && body?.success !== false;

          let summary = '';
          if (body?.message && typeof body.message === 'string') {
            summary = body.message;
          } else {
            summary = `${action} in ${module}${entityName ? ` "${entityName}"` : ''}`;
          }

          let severity: AuditSeverity = 'INFO';
          if (action === 'DELETE') severity = 'WARN';
          if (!isSuccess) severity = 'CRITICAL';

          await AuditService.log({
            companyId,
            userId: req.user?.userId,
            action,
            module,
            entity: module,
            entityId: entityId.toString(),
            entityName: entityName ? entityName.toString() : undefined,
            summary,
            newValue: req.body || undefined,
            status: isSuccess ? 'SUCCESS' : 'FAILURE',
            failureReason: !isSuccess ? body?.message || 'Action failed' : undefined,
            severity,
            req,
          });
        } catch {
          // Silent non-blocking fail
        }
      });

      return result;
    };

    next();
  };
}
