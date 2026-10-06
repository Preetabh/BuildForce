import { AuditLog, AuditAction, AuditSeverity, AuditStatus, IAuditFieldDiff, IAuditDevice, IAuditUserSnapshot } from '../../models/AuditLog';
import { Types } from 'mongoose';
import { logger } from '../../config/logger';
import { User } from '../../models/User';
import {
  calculateDiff,
  extractClientIp,
  parseUserAgent,
  sanitizeAuditData,
} from '../../utils/auditSanitizer';

export interface CreateAuditLogParams {
  companyId: string | Types.ObjectId;
  userId?: string | Types.ObjectId | null;
  userSnapshot?: IAuditUserSnapshot;
  action: AuditAction;
  module?: string;
  entity: string;
  entityId: string;
  entityName?: string;
  summary?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  diff?: IAuditFieldDiff[];
  ipAddress?: string;
  userAgent?: string;
  device?: IAuditDevice;
  session?: string;
  severity?: AuditSeverity;
  status?: AuditStatus;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  req?: any;
}

export interface QueryAuditLogsParams {
  companyId: string;
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  userIds?: string[];
  actions?: AuditAction[];
  modules?: string[];
  entities?: string[];
  entityId?: string;
  severity?: AuditSeverity | AuditSeverity[];
  status?: AuditStatus;
  ip?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AuditService {
  /**
   * Automatically records an immutable audit log entry
   */
  public static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      const companyId = new Types.ObjectId(params.companyId.toString());
      let userId: Types.ObjectId | null = null;
      let userSnapshot: IAuditUserSnapshot = params.userSnapshot || {
        name: 'System User',
        email: 'system@buildforce360.internal',
        role: 'SYSTEM',
      };

      // Extract user info from express req if available
      if (params.req?.user) {
        const u = params.req.user;
        userId = new Types.ObjectId(u.userId || u.id || u._id);
        userSnapshot = {
          name: u.name || userSnapshot.name,
          email: u.email || userSnapshot.email,
          role: u.role || userSnapshot.role,
        };
      } else if (params.userId) {
        userId = new Types.ObjectId(params.userId.toString());
        // If snapshot is default and we have a userId, fetch snapshot asynchronously
        if (!params.userSnapshot) {
          try {
            const fetched = await User.findById(userId).select('name email role').lean();
            if (fetched) {
              userSnapshot = {
                name: fetched.name || 'User',
                email: fetched.email || '',
                role: fetched.role || 'USER',
              };
            }
          } catch {
            // fallback
          }
        }
      }

      // Auto-extract request network & client details
      let ipAddress = params.ipAddress || '';
      let userAgent = params.userAgent || '';
      let device = params.device;
      let session = params.session || '';

      if (params.req) {
        if (!ipAddress) ipAddress = extractClientIp(params.req);
        if (!userAgent) userAgent = params.req.headers['user-agent'] || '';
        if (!session) {
          session = (params.req.headers['x-session-id'] as string) || (params.req.headers['authorization'] ? 'Bearer-Active' : '');
        }
      }

      if (!device) {
        device = parseUserAgent(userAgent);
      }

      // Sanitize old and new values
      const cleanOld = sanitizeAuditData(params.oldValue);
      const cleanNew = sanitizeAuditData(params.newValue);

      // Compute field-level diff if not provided
      const diff =
        params.diff && params.diff.length > 0
          ? params.diff
          : calculateDiff(cleanOld, cleanNew);

      // Generate readable summary if omitted
      let summary = params.summary || '';
      if (!summary) {
        const target = params.entityName ? `"${params.entityName}"` : `#${params.entityId}`;
        const actLabel = params.action.replace('_', ' ');
        summary = `${actLabel} ${params.entity} ${target}`;
        if (diff.length > 0) {
          summary += ` (${diff.length} field${diff.length > 1 ? 's' : ''} modified)`;
        }
      }

      // Determine severity if not explicitly set
      let severity: AuditSeverity = params.severity || 'INFO';
      if (!params.severity) {
        if (params.action === 'DELETE') severity = 'WARN';
        if (params.action === 'ROLE_CHANGE' || params.action === 'PERMISSION_CHANGE') severity = 'SECURITY';
        if (params.status === 'FAILURE') severity = 'CRITICAL';
      }

      await AuditLog.create({
        companyId,
        userId,
        userSnapshot,
        action: params.action,
        module: (params.module || params.entity || 'GENERAL').toUpperCase(),
        entity: params.entity,
        entityId: params.entityId.toString(),
        entityName: params.entityName || '',
        summary,
        oldValue: cleanOld || null,
        newValue: cleanNew || null,
        diff,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent,
        device,
        session,
        severity,
        status: params.status || 'SUCCESS',
        failureReason: params.failureReason || '',
        metadata: sanitizeAuditData(params.metadata) || {},
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error('Failed to create audit log entry:', err);
    }
  }

  /**
   * Enterprise-grade querying with filtering, text search, sorting, and server-side pagination
   */
  public static async queryLogs(params: QueryAuditLogsParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {
      companyId: new Types.ObjectId(params.companyId),
    };

    // User filter
    if (params.userId) {
      query.userId = new Types.ObjectId(params.userId);
    } else if (params.userIds && params.userIds.length > 0) {
      query.userId = { $in: params.userIds.map((id) => new Types.ObjectId(id)) };
    }

    // Action filter
    if (params.actions && params.actions.length > 0) {
      query.action = { $in: params.actions };
    }

    // Module filter
    if (params.modules && params.modules.length > 0) {
      query.module = { $in: params.modules.map((m) => m.toUpperCase()) };
    }

    // Entity filter
    if (params.entities && params.entities.length > 0) {
      query.entity = { $in: params.entities };
    }

    if (params.entityId) {
      query.entityId = params.entityId;
    }

    // Severity filter
    if (params.severity) {
      if (Array.isArray(params.severity) && params.severity.length > 0) {
        query.severity = { $in: params.severity };
      } else if (typeof params.severity === 'string') {
        query.severity = params.severity;
      }
    }

    // Status filter
    if (params.status) {
      query.status = params.status;
    }

    // IP filter
    if (params.ip) {
      query.ipAddress = { $regex: params.ip.trim(), $options: 'i' };
    }

    // Date range filter
    if (params.startDate || params.endDate) {
      query.timestamp = {};
      if (params.startDate) {
        query.timestamp.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        // Include full day if only date is passed
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    // Keyword search across entityName, summary, userSnapshot, ip
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { entityName: regex },
        { summary: regex },
        { 'userSnapshot.name': regex },
        { 'userSnapshot.email': regex },
        { ipAddress: regex },
        { entityId: regex },
      ];
    }

    const sortField = params.sortBy || 'timestamp';
    const sortDir = params.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDir };

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role')
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      logs,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Aggregated audit & security analytics metrics
   */
  public static async getStats(companyId: string, range?: { startDate?: Date; endDate?: Date }) {
    const cId = new Types.ObjectId(companyId);
    const matchQuery: Record<string, any> = { companyId: cId };

    if (range?.startDate || range?.endDate) {
      matchQuery.timestamp = {};
      if (range.startDate) matchQuery.timestamp.$gte = new Date(range.startDate);
      if (range.endDate) matchQuery.timestamp.$lte = new Date(range.endDate);
    } else {
      // Default to last 30 days for rich analytics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchQuery.timestamp = { $gte: thirtyDaysAgo };
    }

    const [
      totalCount,
      criticalCount,
      securityCount,
      failureCount,
      byModule,
      byAction,
      bySeverity,
      timeline,
      topUsers,
    ] = await Promise.all([
      AuditLog.countDocuments(matchQuery),
      AuditLog.countDocuments({ ...matchQuery, severity: 'CRITICAL' }),
      AuditLog.countDocuments({ ...matchQuery, severity: 'SECURITY' }),
      AuditLog.countDocuments({ ...matchQuery, status: 'FAILURE' }),

      AuditLog.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      AuditLog.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      AuditLog.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),

      AuditLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
            critical: {
              $sum: {
                $cond: [{ $in: ['$severity', ['CRITICAL', 'SECURITY']] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),

      AuditLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$userSnapshot.email',
            name: { $first: '$userSnapshot.name' },
            role: { $first: '$userSnapshot.role' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    return {
      totalCount,
      criticalCount,
      securityCount,
      failureCount,
      successCount: totalCount - failureCount,
      byModule: byModule.map((item) => ({ module: item._id, count: item.count })),
      byAction: byAction.map((item) => ({ action: item._id, count: item.count })),
      bySeverity: bySeverity.reduce(
        (acc: Record<string, number>, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        { INFO: 0, WARN: 0, CRITICAL: 0, SECURITY: 0 }
      ),
      timeline: timeline.map((item) => ({
        date: item._id,
        count: item.count,
        critical: item.critical,
      })),
      topUsers: topUsers.map((item) => ({
        email: item._id,
        name: item.name || 'User',
        role: item.role || 'MEMBER',
        count: item.count,
      })),
    };
  }

  /**
   * Retrieves audit logs for a single entity
   */
  public static async getLogsForEntity(
    companyId: string,
    entity: string,
    entityId: string,
    limit = 50
  ) {
    return AuditLog.find({
      companyId: new Types.ObjectId(companyId),
      entity,
      entityId,
    })
      .sort({ timestamp: -1 })
      .populate('userId', 'name email role')
      .limit(limit)
      .lean();
  }

  /**
   * Retrieves audit logs for a specific user's activity
   */
  public static async getLogsForUser(companyId: string, userId: string, limit = 50) {
    return AuditLog.find({
      companyId: new Types.ObjectId(companyId),
      userId: new Types.ObjectId(userId),
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Retrieves a single audit log with related context
   */
  public static async getLogById(companyId: string, logId: string) {
    const log = await AuditLog.findOne({
      _id: new Types.ObjectId(logId),
      companyId: new Types.ObjectId(companyId),
    })
      .populate('userId', 'name email role')
      .lean();

    if (!log) return null;

    // Fetch related activities on the same entity or by the same user
    const related = await AuditLog.find({
      companyId: new Types.ObjectId(companyId),
      _id: { $ne: log._id },
      $or: [
        { entity: log.entity, entityId: log.entityId },
        { userId: log.userId },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(6)
      .select('action module entity entityName summary severity timestamp userSnapshot')
      .lean();

    return {
      log,
      related,
    };
  }
}
