import { AuditLog, AuditAction } from '../../models/AuditLog';
import { Types } from 'mongoose';
import { logger } from '../../config/logger';

export interface CreateAuditLogParams {
  companyId: string | Types.ObjectId;
  userId?: string | Types.ObjectId | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  public static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      // Sanitize potential sensitive fields before saving
      const sanitize = (data?: Record<string, unknown> | null) => {
        if (!data) return null;
        const cloned = { ...data };
        delete cloned.password;
        delete cloned.passwordHash;
        delete cloned.token;
        return cloned;
      };

      await AuditLog.create({
        companyId: new Types.ObjectId(params.companyId.toString()),
        userId: params.userId ? new Types.ObjectId(params.userId.toString()) : null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: sanitize(params.oldValue),
        newValue: sanitize(params.newValue),
        ipAddress: params.ipAddress || '',
        userAgent: params.userAgent || '',
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error('Failed to create audit log entry:', err);
    }
  }

  public static async getLogsForEntity(companyId: string, entity: string, entityId: string) {
    return AuditLog.find({
      companyId: new Types.ObjectId(companyId),
      entity,
      entityId,
    })
      .sort({ timestamp: -1 })
      .populate('userId', 'name email role')
      .limit(50)
      .lean();
  }
}
