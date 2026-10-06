import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User';
import { Company, ICompany } from '../../models/Company';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import { RegisterInput, LoginInput, RegisterAdminInput } from './auth.validation';
import { AuditService } from '../audit/audit.service';

export class AuthService {
  /**
   * Check if any administrator already exists in the database.
   * Public registration is ONLY permitted if there is no Admin in the DB.
   */
  public static async getSetupStatus() {
    const adminExists = Boolean(
      await User.exists({
        role: { $in: ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'] },
      })
    );
    const company = (await Company.findById('6ab4b3c1129e946cfbaccb5c')) || (await Company.findOne());
    return {
      adminExists,
      canRegister: !adminExists,
      companyName: company?.name || 'Lucknow Builders',
    };
  }

  /**
   * Dedicated Admin Account Provisioning with Security Key verification.
   * Guarantees the account role is strictly 'ADMIN'.
   */
  public static async registerAdmin(input: RegisterAdminInput, req?: any) {
    const expectedKey = env.ADMIN_REGISTRATION_KEY || 'Z5K9N2';
    if (!input.adminKey || input.adminKey.trim() !== expectedKey.trim()) {
      throw new AppError('Invalid Admin Verification Key. Authorization denied.', 401);
    }

    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 400);
    }

    // Unify under the primary workspace so all admins and staff share the same schema/workspace
    let company = (await Company.findById('6ab4b3c1129e946cfbaccb5c')) || (await Company.findOne());
    if (!company) {
      const compName = input.companyName?.trim() || 'Lucknow Builders';
      const compCode = input.companyCode
        ? input.companyCode.toUpperCase().replace(/\s+/g, '')
        : compName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'LB';

      company = await Company.create({
        name: compName,
        code: compCode,
        contactEmail: input.email.toLowerCase(),
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: 'ADMIN', // Guaranteed Admin post
      companyId: company._id,
      isActive: true,
    });

    const token = this.generateToken(user);

    await AuditService.log({
      companyId: company._id,
      userId: user._id,
      userSnapshot: { name: user.name, email: user.email, role: 'ADMIN' },
      action: 'CREATE',
      module: 'AUTH',
      entity: 'User',
      entityId: user._id.toString(),
      entityName: user.name,
      summary: `Administrator account registered via Security Key verification: ${user.name} (${user.email})`,
      severity: 'SECURITY',
      status: 'SUCCESS',
      newValue: { name: user.name, email: user.email, role: 'ADMIN' },
      req,
    });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company._id,
        permissions: user.permissions || {},
      },
      company: {
        id: company._id,
        name: company.name,
        code: company.code,
      },
    };
  }

  public static async register(input: RegisterInput) {
    // Guard: Only allow registration if no Admin currently exists in the DB
    const adminExists = Boolean(
      await User.exists({
        role: { $in: ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'] },
      })
    );
    if (adminExists) {
      throw new AppError(
        'Registration is closed. An Administrator already exists in this database. New user accounts must be created by the Administrator.',
        403
      );
    }

    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 400);
    }

    // Auto-generate company code if not provided
    let company = (await Company.findById('6ab4b3c1129e946cfbaccb5c')) || (await Company.findOne());
    if (!company) {
      const compName = input.companyName?.trim() || 'Lucknow Builders';
      const compCode = input.companyCode
        ? input.companyCode.toUpperCase().replace(/\s+/g, '')
        : compName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'LB';

      company = await Company.create({
        name: compName,
        code: compCode,
        contactEmail: input.email.toLowerCase(),
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
      companyId: company._id,
      isActive: true,
    });

    const token = this.generateToken(user);

    await AuditService.log({
      companyId: company._id,
      userId: user._id,
      action: 'CREATE',
      entity: 'User',
      entityId: user._id.toString(),
      newValue: { name: user.name, email: user.email, role: user.role },
    });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company._id,
        permissions: user.permissions || {},
      },
      company: {
        id: company._id,
        name: company.name,
        code: company.code,
      },
    };
  }

  public static async login(input: LoginInput, req?: any) {
    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      if (user.companyId) {
        await AuditService.log({
          companyId: user.companyId,
          userId: user._id,
          userSnapshot: { name: user.name, email: user.email, role: user.role },
          action: 'LOGIN',
          module: 'AUTH',
          entity: 'User',
          entityId: user._id.toString(),
          entityName: user.name,
          summary: `Deactivated user ${user.email} attempted login`,
          severity: 'SECURITY',
          status: 'FAILURE',
          failureReason: 'Account deactivated',
          req,
        });
      }
      throw new AppError('This account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      if (user.companyId) {
        await AuditService.log({
          companyId: user.companyId,
          userId: user._id,
          userSnapshot: { name: user.name, email: user.email, role: user.role },
          action: 'LOGIN',
          module: 'AUTH',
          entity: 'User',
          entityId: user._id.toString(),
          entityName: user.name,
          summary: `Failed login attempt for ${user.email} (incorrect credentials)`,
          severity: 'SECURITY',
          status: 'FAILURE',
          failureReason: 'Invalid password',
          req,
        });
      }
      throw new AppError('Invalid email or password', 401);
    }

    const company = await Company.findById(user.companyId);
    if (!company) {
      throw new AppError('Associated company organization not found', 404);
    }

    const token = this.generateToken(user);

    // Record successful login in audit trail
    await AuditService.log({
      companyId: company._id,
      userId: user._id,
      userSnapshot: { name: user.name, email: user.email, role: user.role },
      action: 'LOGIN',
      module: 'AUTH',
      entity: 'User',
      entityId: user._id.toString(),
      entityName: user.name,
      summary: `User ${user.name} (${user.email}) logged in successfully`,
      severity: 'INFO',
      status: 'SUCCESS',
      req,
    });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company._id,
        permissions: user.permissions || {},
      },
      company: {
        id: company._id,
        name: company.name,
        code: company.code,
      },
    };
  }

  public static async getCurrentUser(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const company = await Company.findById(user.companyId);
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        permissions: user.permissions || {},
      },
      company: company
        ? {
            id: company._id,
            name: company.name,
            code: company.code,
          }
        : null,
    };
  }

  public static async updateProfile(
    userId: string,
    data: { name?: string; mobile?: string; expertise?: string; currentPassword?: string; newPassword?: string },
    req?: any
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const oldSnapshot = {
      name: user.name,
      mobile: user.mobile,
      expertise: user.expertise,
    };

    if (data.name && data.name.trim()) {
      user.name = data.name.trim();
    }
    if (data.mobile !== undefined) {
      user.mobile = data.mobile.trim();
    }
    if (data.expertise !== undefined) {
      user.expertise = data.expertise.trim();
    }

    const hasPasswordChange = !!(data.currentPassword && data.newPassword);
    if (hasPasswordChange) {
      const isMatch = await bcrypt.compare(data.currentPassword!, user.passwordHash);
      if (!isMatch) {
        throw new AppError('Incorrect current password', 400);
      }
      if (data.newPassword!.length < 6) {
        throw new AppError('New password must be at least 6 characters', 400);
      }
      user.passwordHash = await bcrypt.hash(data.newPassword!, 10);
    }

    await user.save();

    await AuditService.log({
      companyId: user.companyId,
      userId: user._id,
      userSnapshot: { name: user.name, email: user.email, role: user.role },
      action: hasPasswordChange ? 'PERMISSION_CHANGE' : 'UPDATE',
      module: 'USERS',
      entity: 'User',
      entityId: user._id.toString(),
      entityName: user.name,
      oldValue: oldSnapshot,
      newValue: {
        name: user.name,
        mobile: user.mobile,
        expertise: user.expertise,
        securityPasswordUpdated: hasPasswordChange,
      },
      severity: hasPasswordChange ? 'SECURITY' : 'INFO',
      summary: hasPasswordChange
        ? `User ${user.email} updated profile and changed password`
        : `User ${user.email} updated profile details`,
      req,
    });

    const company = await Company.findById(user.companyId);
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        mobile: user.mobile,
        expertise: user.expertise,
        permissions: user.permissions || {},
      },
      company: company
        ? {
            id: company._id,
            name: company.name,
            code: company.code,
          }
        : null,
    };
  }

  private static generateToken(user: IUser): string {
    return jwt.sign(
      {
        userId: user._id.toString(),
        companyId: user.companyId.toString(),
        role: user.role,
        email: user.email,
        name: user.name,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}
