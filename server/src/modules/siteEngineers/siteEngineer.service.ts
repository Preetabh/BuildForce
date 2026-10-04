import { Types } from 'mongoose';
import { SiteEngineer, ISiteEngineer } from '../../models/SiteEngineer';
import { User } from '../../models/User';
import { AppError } from '../../middleware/error.middleware';
import bcrypt from 'bcryptjs';

export class SiteEngineerService {
  private static toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return typeof id === 'string' ? new Types.ObjectId(id) : id;
  }

  public static async getSiteEngineers(companyIdInput: string | Types.ObjectId) {
    const companyId = this.toObjectId(companyIdInput);
    // Fetch only user-created site engineers, no hardcoded auto-seeding
    const engineers = await SiteEngineer.find({ companyId })
      .sort({ createdAt: -1 })
      .lean();
    return engineers;
  }

  public static async createSiteEngineer(companyIdInput: string | Types.ObjectId, data: any) {
    const companyId = this.toObjectId(companyIdInput);
    const existing = await SiteEngineer.findOne({
      companyId,
      loginId: data.loginId.toLowerCase().trim(),
    });
    if (existing) {
      throw new AppError(`Site engineer with login ID '${data.loginId}' already exists`, 400);
    }

    const engineer = await SiteEngineer.create({
      ...data,
      companyId,
      loginId: data.loginId.toLowerCase().trim(),
    });

    // Also automatically create/update corresponding User account for seamless portal login & impersonation
    const existingUser = await User.findOne({ email: data.loginId.toLowerCase().trim() });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);
      await User.create({
        name: data.name,
        email: data.loginId.toLowerCase().trim(),
        passwordHash,
        role: 'SITE_ENGINEER',
        mobile: data.mobile || '-',
        expertise: data.expertise || 'Common',
        projectsCount: data.projectsCount || 0,
        walletBalance: data.walletBalance || 0,
        companyId,
        isActive: data.status === 'Active',
      });
    }

    return engineer;
  }

  public static async updateSiteEngineer(
    companyIdInput: string | Types.ObjectId,
    id: string,
    data: Partial<ISiteEngineer>
  ) {
    const companyId = this.toObjectId(companyIdInput);
    const engineer = await SiteEngineer.findOneAndUpdate(
      { _id: id, companyId },
      { $set: data },
      { new: true }
    );
    if (!engineer) throw new AppError('Site engineer not found', 404);

    // Sync status and details with user account if exists
    if (data.status || data.name || data.mobile || data.expertise) {
      await User.findOneAndUpdate(
        { email: engineer.loginId.toLowerCase() },
        {
          $set: {
            name: engineer.name,
            mobile: engineer.mobile,
            expertise: engineer.expertise,
            isActive: engineer.status === 'Active',
          },
        }
      );
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

    // Sync user wallet balance
    await User.findOneAndUpdate(
      { email: engineer.loginId.toLowerCase() },
      { $set: { walletBalance: engineer.walletBalance } }
    );

    return engineer;
  }

  public static async deleteSiteEngineer(companyIdInput: string | Types.ObjectId, id: string) {
    const companyId = this.toObjectId(companyIdInput);
    const res = await SiteEngineer.findOneAndDelete({ _id: id, companyId });
    if (!res) throw new AppError('Site engineer not found', 404);

    // Also delete any associated user account created for this site engineer
    if (res.loginId) {
      await User.deleteOne({
        email: res.loginId.toLowerCase().trim(),
        role: 'SITE_ENGINEER',
      });
    }

    return { success: true };
  }
}
