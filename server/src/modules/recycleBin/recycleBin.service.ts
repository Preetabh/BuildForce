import mongoose, { Types } from 'mongoose';
import { RecycleBinItem, IRecycleBinItem, RecycleBinEntityType } from '../../models/RecycleBinItem';
import { Project } from '../../models/Project';
import { SiteEngineer } from '../../models/SiteEngineer';
import { Lead } from '../../models/Lead';
import { ClientAccount } from '../../models/ClientAccount';
import { Partner } from '../../models/Partner';
import { User } from '../../models/User';
import { ServiceCatalog } from '../../models/ServiceCatalog';
import { AppError } from '../../middleware/error.middleware';
import { AuditService } from '../audit/audit.service';

export interface MoveToRecycleBinOptions {
  companyId: string | Types.ObjectId;
  entityType: RecycleBinEntityType;
  originalId: string | Types.ObjectId;
  title: string;
  code?: string;
  subtitle?: string;
  data: any;
  deletedBy?: string | Types.ObjectId;
  deletedByName?: string;
}

export class RecycleBinService {
  private static toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return typeof id === 'string' ? new Types.ObjectId(id) : id;
  }

  /**
   * Save deleted item to Recycle Bin with guaranteed 60-day retention
   */
  public static async moveToRecycleBin(options: MoveToRecycleBinOptions) {
    const companyId = this.toObjectId(options.companyId);
    const originalId = this.toObjectId(options.originalId);
    const deletedBy = options.deletedBy && Types.ObjectId.isValid(options.deletedBy.toString())
      ? new Types.ObjectId(options.deletedBy.toString())
      : undefined;

    const now = new Date();
    // 60-day retention guarantee
    const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const existing = await RecycleBinItem.findOne({
      companyId,
      entityType: options.entityType,
      originalId,
    });

    if (existing) {
      existing.title = options.title;
      existing.code = options.code || existing.code;
      existing.subtitle = options.subtitle || existing.subtitle;
      existing.data = options.data;
      existing.deletedBy = deletedBy || existing.deletedBy;
      existing.deletedByName = options.deletedByName || existing.deletedByName || 'Admin';
      existing.deletedAt = now;
      existing.retentionDays = 60;
      existing.expiresAt = expiresAt;
      existing.status = 'active';
      existing.restoredAt = undefined;
      await existing.save();
      return existing;
    }

    const item = await RecycleBinItem.create({
      companyId,
      entityType: options.entityType,
      originalId,
      title: options.title,
      code: options.code || '',
      subtitle: options.subtitle || '',
      data: options.data,
      deletedBy,
      deletedByName: options.deletedByName || 'Admin',
      deletedAt: now,
      retentionDays: 60,
      expiresAt,
      status: 'active',
    });

    return item;
  }

  /**
   * Get all items in Recycle Bin (Enforcing 60-day safe retention)
   */
  public static async getRecycleBinItems(companyIdInput: string | Types.ObjectId, entityType?: string) {
    const companyId = this.toObjectId(companyIdInput);

    // 1. Sync any soft-deleted Projects that were deleted previously
    try {
      const softDeletedProjects = await Project.find({
        companyId,
        deletedAt: { $ne: null },
      }).lean();

      for (const p of softDeletedProjects) {
        const exists = await RecycleBinItem.findOne({
          companyId,
          entityType: 'Project',
          originalId: p._id,
        });
        if (!exists) {
          const delDate = p.deletedAt ? new Date(p.deletedAt) : new Date();
          const expiresAt = new Date(delDate.getTime() + 60 * 24 * 60 * 60 * 1000);
          await RecycleBinItem.create({
            companyId,
            entityType: 'Project',
            originalId: p._id,
            title: p.name,
            code: p.code || '',
            subtitle: `Client: ${p.clientName || '-'} • Value: ₹${(p.contractValue || p.estimatedValue || 0).toLocaleString()}`,
            data: p,
            deletedBy: p.deletedBy,
            deletedByName: 'Admin',
            deletedAt: delDate,
            retentionDays: 60,
            expiresAt,
            status: 'active',
          });
        }
      }
    } catch (syncErr) {
      console.error('Recycle bin project sync warning:', syncErr);
    }

    // 2. Query all active recycle bin items within 60 days
    const query: any = {
      companyId,
      status: 'active',
    };

    if (entityType && entityType !== 'all') {
      query.entityType = entityType;
    }

    const items = await RecycleBinItem.find(query)
      .populate('deletedBy', 'name email')
      .sort({ deletedAt: -1 })
      .lean();

    const now = Date.now();

    // Map items with computed daysRemaining
    return items.map((item) => {
      const expTime = item.expiresAt ? new Date(item.expiresAt).getTime() : now + 60 * 24 * 3600 * 1000;
      const daysRemaining = Math.max(0, Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)));

      return {
        ...item,
        daysRemaining: Math.min(60, daysRemaining),
      };
    });
  }

  /**
   * Restore any deleted item back to its active directory
   */
  public static async restoreItem(
    companyIdInput: string | Types.ObjectId,
    recycleBinItemId: string,
    userId?: string
  ) {
    const companyId = this.toObjectId(companyIdInput);
    const item = await RecycleBinItem.findOne({
      _id: new Types.ObjectId(recycleBinItemId),
      companyId,
    });

    if (!item) {
      throw new AppError('Item not found in Recycle Bin', 404);
    }

    const originalId = item.originalId;

    // Restore depending on entity type
    switch (item.entityType) {
      case 'SiteEngineer': {
        const engineer = await SiteEngineer.findOne({ _id: originalId, companyId });
        if (engineer) {
          engineer.isDeleted = false;
          engineer.deletedAt = undefined;
          engineer.deletedBy = undefined;
          await engineer.save();
        } else if (item.data) {
          // Re-create engineer from snapshot
          const snapshot = { ...item.data };
          delete snapshot._id;
          delete snapshot.createdAt;
          delete snapshot.updatedAt;
          snapshot.isDeleted = false;
          snapshot.deletedAt = undefined;
          await SiteEngineer.create({
            ...snapshot,
            _id: originalId,
            companyId,
          });
        }

        // Reactivate corresponding user account
        if (item.code || item.data?.loginId) {
          await User.findOneAndUpdate(
            { email: (item.code || item.data?.loginId).toLowerCase() },
            { $set: { isActive: true } }
          );
        }
        break;
      }

      case 'Lead': {
        const lead = await Lead.findOne({ _id: originalId, companyId });
        if (lead) {
          lead.isDeleted = false;
          lead.isDead = false;
          lead.deletedAt = undefined;
          lead.deletedBy = undefined;
          await lead.save();
        } else if (item.data) {
          const snapshot = { ...item.data };
          delete snapshot._id;
          delete snapshot.createdAt;
          delete snapshot.updatedAt;
          snapshot.isDeleted = false;
          snapshot.isDead = false;
          snapshot.deletedAt = undefined;
          await Lead.create({
            ...snapshot,
            _id: originalId,
            companyId,
          });
        }
        break;
      }

      case 'Client': {
        const client = await ClientAccount.findOne({ _id: originalId, companyId });
        if (client) {
          client.isDeleted = false;
          client.isDead = false;
          client.deletedAt = undefined;
          client.deletedBy = undefined;
          await client.save();
        } else if (item.data) {
          const snapshot = { ...item.data };
          delete snapshot._id;
          delete snapshot.createdAt;
          delete snapshot.updatedAt;
          snapshot.isDeleted = false;
          snapshot.isDead = false;
          snapshot.deletedAt = undefined;
          await ClientAccount.create({
            ...snapshot,
            _id: originalId,
            companyId,
          });
        }
        break;
      }

      case 'Partner': {
        const partner = await Partner.findOne({ _id: originalId, companyId });
        if (partner) {
          partner.isDeleted = false;
          partner.status = 'Active';
          partner.deletedAt = undefined;
          partner.deletedBy = undefined;
          await partner.save();
        } else if (item.data) {
          const snapshot = { ...item.data };
          delete snapshot._id;
          delete snapshot.createdAt;
          delete snapshot.updatedAt;
          snapshot.isDeleted = false;
          snapshot.status = 'Active';
          snapshot.deletedAt = undefined;
          await Partner.create({
            ...snapshot,
            _id: originalId,
            companyId,
          });
        }
        break;
      }

      case 'Project': {
        await Project.updateOne(
          { _id: originalId, companyId },
          { $set: { deletedAt: null, deletedBy: null } }
        );
        break;
      }

      case 'User': {
        const user = await User.findOne({ _id: originalId, companyId });
        if (user) {
          user.isDeleted = false;
          user.isActive = true;
          user.deletedAt = undefined;
          user.deletedBy = undefined;
          await user.save();
        } else if (item.data) {
          const snapshot = { ...item.data };
          delete snapshot._id;
          delete snapshot.createdAt;
          delete snapshot.updatedAt;
          snapshot.isDeleted = false;
          snapshot.isActive = true;
          snapshot.deletedAt = undefined;
          await User.create({
            ...snapshot,
            _id: originalId,
            companyId,
          });
        }

        // If site engineer, also reactivate site engineer
        if (item.data?.role === 'SITE_ENGINEER' || item.data?.role === 'Site Engineer') {
          await SiteEngineer.updateOne(
            { loginId: (item.code || item.data?.email).toLowerCase().trim(), companyId },
            { $set: { isDeleted: false, status: 'Active', deletedAt: undefined } }
          );
        }
        break;
      }

      case 'Service': {
        const service = await ServiceCatalog.findOne({ _id: originalId, companyId });
        if (service) {
          service.isDeleted = false;
          service.isActive = true;
          service.deletedAt = undefined;
          service.deletedBy = undefined;
          await service.save();
        } else if (item.data) {
          const snapshot = { ...item.data };
          delete snapshot._id;
          delete snapshot.createdAt;
          delete snapshot.updatedAt;
          snapshot.isDeleted = false;
          snapshot.isActive = true;
          snapshot.deletedAt = undefined;
          await ServiceCatalog.create({
            ...snapshot,
            _id: originalId,
            companyId,
          });
        }
        break;
      }

      default: {
        // Generic fallback: check if item has a model
        break;
      }
    }

    // Mark as restored in RecycleBinItem
    item.status = 'restored';
    item.restoredAt = new Date();
    await item.save();

    // Audit log
    if (userId) {
      await AuditService.log({
        companyId: companyId.toString(),
        userId,
        action: 'RESTORE',
        entity: item.entityType,
        entityId: originalId.toString(),
        newValue: { title: item.title, restoredAt: item.restoredAt },
      });
    }

    return {
      success: true,
      message: `"${item.title}" restored successfully to active records.`,
      item,
    };
  }

  /**
   * Permanent Delete (Purge) - Irrevocable
   */
  public static async permanentDelete(
    companyIdInput: string | Types.ObjectId,
    recycleBinItemId: string,
    userId?: string
  ) {
    const companyId = this.toObjectId(companyIdInput);
    const item = await RecycleBinItem.findOne({
      _id: new Types.ObjectId(recycleBinItemId),
      companyId,
    });

    if (!item) {
      throw new AppError('Item not found in Recycle Bin', 404);
    }

    const originalId = item.originalId;

    // Remove from original collection permanently
    switch (item.entityType) {
      case 'SiteEngineer':
        await SiteEngineer.deleteOne({ _id: originalId, companyId });
        break;
      case 'Lead':
        await Lead.deleteOne({ _id: originalId, companyId });
        break;
      case 'Client':
        await ClientAccount.deleteOne({ _id: originalId, companyId });
        break;
      case 'Partner':
        await Partner.deleteOne({ _id: originalId, companyId });
        break;
      case 'Project':
        await Project.deleteOne({ _id: originalId, companyId });
        break;
      case 'User':
        await User.deleteOne({ _id: originalId, companyId });
        break;
      case 'Service':
        await ServiceCatalog.deleteOne({ _id: originalId, companyId });
        break;
    }

    // Delete from RecycleBinItem
    await RecycleBinItem.deleteOne({ _id: item._id });

    // Audit log
    if (userId) {
      await AuditService.log({
        companyId: companyId.toString(),
        userId,
        action: 'DELETE',
        entity: item.entityType,
        entityId: originalId.toString(),
        oldValue: { title: item.title, permanentlyPurged: true },
      });
    }

    return {
      success: true,
      message: `"${item.title}" permanently removed from system.`,
    };
  }

  /**
   * Automated 60-day cleanup enforcement:
   * Only items older than 60 days can be purged!
   */
  public static async purgeExpiredItems() {
    const cutoffDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const res = await RecycleBinItem.deleteMany({
      deletedAt: { $lt: cutoffDate },
      status: { $in: ['active', 'purged'] },
    });
    return res.deletedCount;
  }
}
