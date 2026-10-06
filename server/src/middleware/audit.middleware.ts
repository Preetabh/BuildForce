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
