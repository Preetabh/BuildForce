import { Types } from 'mongoose';
import { SiteEngineer, ISiteEngineer } from '../../models/SiteEngineer';
import { User } from '../../models/User';
import { Project } from '../../models/Project';
import { DailySiteReport } from '../../models/DailySiteReport';
import { Notification } from '../../models/Notification';
import { AppError } from '../../middleware/error.middleware';
import { RecycleBinService } from '../recycleBin/recycleBin.service';
import bcrypt from 'bcryptjs';

export class SiteEngineerService {
  private static toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return typeof id === 'string' ? new Types.ObjectId(id) : id;
  }

  public static async getSiteEngineers(companyIdInput: string | Types.ObjectId) {
    const companyId = this.toObjectId(companyIdInput);
    const engineers = await SiteEngineer.find({ companyId, isDeleted: { $ne: true } })
      .populate('assignedProjectIds', 'name code location status progress clientName')
      .sort({ createdAt: -1 })
      .lean();

    // Attach latest report date for each engineer dynamically
    const enrichedEngineers = await Promise.all(
      engineers.map(async (eng) => {
        let lastReportDate = eng.lastReportDate;
        if (!lastReportDate) {
          const latestReport = await DailySiteReport.findOne({
            companyId,
            siteEngineerId: eng._id,
            status: { $ne: 'Draft' },
          })
            .sort({ reportDate: -1 })
            .select('reportDate')
            .lean();
          if (latestReport) {
            lastReportDate = latestReport.reportDate;
          }
        }
        return {
          ...eng,
          lastReportDate,
        };
      })
    );

    return enrichedEngineers;
  }

  public static async getMyEngineerProfile(
    companyIdInput: string | Types.ObjectId,
    userId: string,
    userName?: string,
    userEmail?: string
  ) {
    const companyId = this.toObjectId(companyIdInput);
    const userObjId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;

    const orConditions: any[] = [];
    if (userObjId) orConditions.push({ userId: userObjId });
    if (userName && userName.trim()) {
      const safeName = userName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orConditions.push({ name: new RegExp(`^${safeName}$`, 'i') });
    }
    if (userEmail && userEmail.trim()) {
      orConditions.push({ loginId: userEmail.toLowerCase().trim() });
    }

    if (orConditions.length === 0) return null;

    const engineer = await SiteEngineer.findOne({
      companyId,
      isDeleted: { $ne: true },
      $or: orConditions,
    })
      .populate('assignedProjectIds', 'name code location status progress clientName')
      .populate('assignedClientIds', 'name clientCode phone siteLocation status')
      .lean();

    return engineer;
  }

  public static async getSiteEngineerById(companyIdInput: string | Types.ObjectId, id: string) {
    const companyId = this.toObjectId(companyIdInput);
    const engineer = await SiteEngineer.findOne({ _id: id, companyId, isDeleted: { $ne: true } })
      .populate('assignedProjectIds', 'name code location status progress clientName')
      .lean();
    if (!engineer) throw new AppError('Site engineer not found', 404);
    return engineer;
  }

  public static async createSiteEngineer(companyIdInput: string | Types.ObjectId, data: any) {
    const companyId = this.toObjectId(companyIdInput);
    const normalizedEmail = data.loginId.toLowerCase().trim();

    const existing = await SiteEngineer.findOne({
      companyId,
      loginId: normalizedEmail,
    });
    if (existing) {
      throw new AppError(`Site engineer with login ID '${data.loginId}' already exists`, 400);
    }

    // Convert assigned project ids to ObjectIds
    const assignedProjectIds = Array.isArray(data.assignedProjectIds)
      ? data.assignedProjectIds.map((pId: string) => this.toObjectId(pId))
      : [];

    const engineer = await SiteEngineer.create({
      ...data,
      companyId,
      loginId: normalizedEmail,
      assignedProjectIds,
      projectsCount: assignedProjectIds.length,
    });

    // Create or update corresponding User account for secure portal login
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password || 'password123', salt);

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        name: data.name,
        email: normalizedEmail,
        passwordHash,
        role: 'SITE_ENGINEER',
        mobile: data.mobile || '-',
        expertise: data.expertise || 'Common',
        projectsCount: assignedProjectIds.length,
        walletBalance: data.walletBalance || 0,
        companyId,
        isActive: data.status === 'Active',
      });
    } else {
      user.role = 'SITE_ENGINEER';
      user.name = data.name;
      user.mobile = data.mobile || '-';
      user.expertise = data.expertise || 'Common';
      user.isActive = data.status === 'Active';
      if (data.password) {
        user.passwordHash = passwordHash;
      }
      await user.save();
    }

    engineer.userId = user._id as Types.ObjectId;
    await engineer.save();

    // Bidirectional sync: Add engineer to Project.assignedEngineers
    if (assignedProjectIds.length > 0) {
      await Project.updateMany(
        { _id: { $in: assignedProjectIds }, companyId },
        { $addToSet: { assignedEngineers: engineer._id } }
      );

      // Create Notification for engineer
      await Notification.create({
        companyId,
        recipientId: user._id,
        recipientRole: 'SITE_ENGINEER',
        title: 'New Sites Assigned',
        message: `You have been assigned to ${assignedProjectIds.length} site(s). You can now view and report on these sites.`,
        type: 'SITE_ASSIGNED',
        entityId: engineer._id,
        entityType: 'SiteEngineer',
        link: '/engineer-dashboard',
      });
    }

    return engineer;
  }

  public static async updateSiteEngineer(
    companyIdInput: string | Types.ObjectId,
    id: string,
    data: Partial<ISiteEngineer> & { password?: string; assignedProjectIds?: string[] }
  ) {
    const companyId = this.toObjectId(companyIdInput);
    const existingEngineer = await SiteEngineer.findOne({ _id: id, companyId });
    if (!existingEngineer) throw new AppError('Site engineer not found', 404);

    const oldProjectIds = (existingEngineer.assignedProjectIds || []).map((p) => p.toString());

    let newProjectIds: Types.ObjectId[] | undefined;
    if (data.assignedProjectIds) {
      newProjectIds = data.assignedProjectIds.map((pId: string) => this.toObjectId(pId));
      data.projectsCount = newProjectIds.length;
    }

    const updatePayload: any = { ...data };
    if (newProjectIds) {
      updatePayload.assignedProjectIds = newProjectIds;
    }

    const engineer = await SiteEngineer.findOneAndUpdate(
      { _id: id, companyId },
      { $set: updatePayload },
      { new: true }
    ).populate('assignedProjectIds', 'name code location status progress clientName');

    if (!engineer) throw new AppError('Site engineer not found', 404);

    // Sync User account details & password
    const userUpdate: any = {
      name: engineer.name,
      mobile: engineer.mobile,
      expertise: engineer.expertise,
      isActive: engineer.status === 'Active',
      projectsCount: engineer.projectsCount,
    };

    if (data.password && data.password.trim()) {
      const salt = await bcrypt.genSalt(10);
      userUpdate.passwordHash = await bcrypt.hash(data.password.trim(), salt);
    }

    const userDoc = await User.findOneAndUpdate(
      { email: engineer.loginId.toLowerCase() },
      { $set: userUpdate },
      { new: true }
    );

    // Sync Projects assignedEngineers bidirectional
    if (newProjectIds) {
      const newIdsStr = newProjectIds.map((p) => p.toString());
      const addedProjects = newIdsStr.filter((p) => !oldProjectIds.includes(p));
      const removedProjects = oldProjectIds.filter((p) => !newIdsStr.includes(p));

      if (addedProjects.length > 0) {
        await Project.updateMany(
          { _id: { $in: addedProjects }, companyId },
          { $addToSet: { assignedEngineers: engineer._id } }
        );

        if (userDoc) {
          await Notification.create({
            companyId,
            recipientId: userDoc._id,
            recipientRole: 'SITE_ENGINEER',
            title: 'Project Assignment Updated',
            message: `You have been assigned to new site(s). Check your assigned sites list.`,
            type: 'SITE_ASSIGNED',
            entityId: engineer._id,
            entityType: 'SiteEngineer',
            link: '/engineer-dashboard',
          });
        }
      }

      if (removedProjects.length > 0) {
        await Project.updateMany(
          { _id: { $in: removedProjects }, companyId },
          { $pull: { assignedEngineers: engineer._id } }
        );
      }
    }

    return engineer;
  }

  // Toggle status: Active (Allow) / Inactive (Decline)
  public static async toggleStatus(companyIdInput: string | Types.ObjectId, id: string) {
    const companyId = this.toObjectId(companyIdInput);
    const engineer = await SiteEngineer.findOne({ _id: id, companyId });
    if (!engineer) throw new AppError('Site engineer not found', 404);

    engineer.status = engineer.status === 'Active' ? 'Inactive' : 'Active';
    await engineer.save();

    // Sync with User
    await User.findOneAndUpdate(
      { email: engineer.loginId.toLowerCase() },
      { $set: { isActive: engineer.status === 'Active' } }
    );

    return engineer;
  }

  // Update wallet with audit note
  public static async updateWallet(
    companyIdInput: string | Types.ObjectId,
    id: string,
    amount: number,
    operation: 'add' | 'deduct' | 'set',
    notes?: string
  ) {
    const companyId = this.toObjectId(companyIdInput);
    const engineer = await SiteEngineer.findOne({ _id: id, companyId });
    if (!engineer) throw new AppError('Site engineer not found', 404);

    if (operation === 'add') {
      engineer.walletBalance += amount;
    } else if (operation === 'deduct') {
      engineer.walletBalance = Math.max(0, engineer.walletBalance - amount);
    } else {
      engineer.walletBalance = amount;
    }

    if (notes) {
      engineer.notes = `${engineer.notes ? engineer.notes + '\n' : ''}[${new Date().toLocaleDateString()}] Wallet updated: ${engineer.walletBalance} (${notes})`;
    }

    await engineer.save();

    await User.findOneAndUpdate(
      { email: engineer.loginId.toLowerCase() },
      { $set: { walletBalance: engineer.walletBalance } }
    );

    return engineer;
  }

  public static async deleteSiteEngineer(
    companyIdInput: string | Types.ObjectId,
    id: string,
    deletedBy?: string,
    deletedByName?: string
  ) {
    const companyId = this.toObjectId(companyIdInput);
    const engineer = await SiteEngineer.findOne({ _id: id, companyId, isDeleted: { $ne: true } });
    if (!engineer) throw new AppError('Site engineer not found', 404);

    engineer.isDeleted = true;
    engineer.deletedAt = new Date();
    if (deletedBy && Types.ObjectId.isValid(deletedBy)) {
      engineer.deletedBy = new Types.ObjectId(deletedBy);
    }
    engineer.status = 'Inactive';
    await engineer.save();

    // Deactivate associated User account (do NOT delete so it can be restored)
    if (engineer.loginId) {
      await User.updateOne(
        { email: engineer.loginId.toLowerCase().trim() },
        { $set: { isActive: false } }
      );
    }

    // Move to Recycle Bin (60-day safe retention)
    await RecycleBinService.moveToRecycleBin({
      companyId,
      entityType: 'SiteEngineer',
      originalId: engineer._id,
      title: engineer.name,
      code: engineer.loginId,
      subtitle: `Mobile: ${engineer.mobile || '-'} • Assigned Sites: ${engineer.projectsCount || 0}`,
      data: engineer.toObject(),
      deletedBy,
      deletedByName: deletedByName || 'Admin',
    });

    return { success: true, message: `Engineer "${engineer.name}" moved to Recycle Bin` };
  }
}
