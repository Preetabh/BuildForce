import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User';
import { Company, ICompany } from '../../models/Company';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import { RegisterInput, LoginInput } from './auth.validation';
import { AuditService } from '../audit/audit.service';

export class AuthService {
  public static async register(input: RegisterInput) {
    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 400);
    }

    // Auto-generate company code if not provided
    const compCode = input.companyCode
      ? input.companyCode.toUpperCase().replace(/\s+/g, '')
      : input.companyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'COMP';

    // Check if company code exists, append random if collision
    let finalCode = compCode;
    const existingCompany = await Company.findOne({ code: finalCode });
    if (existingCompany) {
      finalCode = `${compCode}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const company = await Company.create({
      name: input.companyName,
      code: finalCode,
      contactEmail: input.email.toLowerCase(),
    });

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
      },
      company: {
        id: company._id,
        name: company.name,
        code: company.code,
      },
    };
  }

  public static async login(input: LoginInput) {
    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('This account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const company = await Company.findById(user.companyId);
    if (!company) {
      throw new AppError('Associated company organization not found', 404);
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company._id,
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
