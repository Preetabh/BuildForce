import { Types } from 'mongoose';
import { RbacMenu, IRbacMenu } from '../../models/RbacMenu';
import { RbacRole, IRbacRole } from '../../models/RbacRole';
import { User, IUser } from '../../models/User';
import { SiteEngineer } from '../../models/SiteEngineer';
import { AppError } from '../../middleware/error.middleware';
import bcrypt from 'bcryptjs';

export class RbacService {
  private static toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return typeof id === 'string' ? new Types.ObjectId(id) : id;
  }

  // Default system menus structure matching the enterprise portal
  public static async ensureDefaultMenus(companyIdInput: string | Types.ObjectId) {
    const companyId = this.toObjectId(companyIdInput);
    const count = await RbacMenu.countDocuments({ companyId });
    if (count > 0) return;

    const defaultMenus = [
      {
        title: 'Dashboard',
        route: 'Admin/AdminDashboard',
        icon: 'Home',
        sort: 1,
        isVisible: true,
        moduleGroup: 'Core',
        children: [
          { title: 'GetPaymentNotificationsAjax', route: 'Admin/GetPaymentNotificationsAjax', icon: 'Link', sort: 1, isVisible: false },
          { title: 'DismissNotificationAjax', route: 'Admin/DismissNotificationAjax', icon: 'Link', sort: 2, isVisible: false },
          { title: 'MarkReportAsReadAjax', route: 'Admin/MarkReportAsReadAjax', icon: 'Link', sort: 3, isVisible: false },
          { title: 'Dash: Total Leads', route: 'Admin/Dash_TotalLeads', icon: 'PieChart', sort: 100, isVisible: false },
          { title: 'Dash: Total Clients', route: 'Admin/Dash_TotalClients', icon: 'PieChart', sort: 100, isVisible: false },
          { title: 'Dash: Total Collection', route: 'Admin/Dash_TotalCollection', icon: 'PieChart', sort: 100, isVisible: false },
          { title: 'Dash: Pending Payment', route: 'Admin/Dash_TotalPending', icon: 'PieChart', sort: 100, isVisible: false },
          { title: "Dash: Today's Leads", route: 'Admin/Dash_TodayLeads', icon: 'PieChart', sort: 100, isVisible: false },
          { title: "Dash: Today's Clients", route: 'Admin/Dash_TodayClients', icon: 'PieChart', sort: 100, isVisible: false },
          { title: "Dash: Today's Collection", route: 'Admin/Dash_TodayCollection', icon: 'PieChart', sort: 100, isVisible: false },
          { title: 'Dash: Active Employees', route: 'Admin/Dash_ActiveEmployees', icon: 'PieChart', sort: 100, isVisible: false },
        ],
      },
      {
        title: 'Lead Management',
        route: '/leads',
        icon: 'Users',
        sort: 2,
        isVisible: true,
        moduleGroup: 'Leads',
        children: [
          { title: 'Leads Directory', route: '/leads', icon: 'UserPlus', sort: 1, isVisible: true },
          { title: 'Client Management', route: '/leads/clients', icon: 'Contact', sort: 2, isVisible: true },
          { title: 'Payment Management', route: '/leads/payments', icon: 'CreditCard', sort: 3, isVisible: true },
          { title: 'Pay Amount', route: '/leads/pay-amount', icon: 'Coins', sort: 4, isVisible: true },
          { title: 'Reference Partners', route: '/leads/partners', icon: 'Handshake', sort: 5, isVisible: true },
          { title: 'Commission Report', route: '/leads/commission-reports', icon: 'FileSpreadsheet', sort: 6, isVisible: true },
        ],
      },
      {
        title: 'Site Engineer',
        route: '/admin/site-engineers',
        icon: 'HardHat',
        sort: 3,
        isVisible: true,
        moduleGroup: 'Field Operations',
        children: [
          { title: 'Detailed Site Engineers', route: '/admin/site-engineers', icon: 'Users', sort: 1, isVisible: true },
          { title: 'Add Site Engineer', route: '/admin/add-site-engineer', icon: 'UserPlus', sort: 2, isVisible: true },
        ],
      },
      {
        title: 'Plannings',
        route: '/planning',
        icon: 'CalendarRange',
        sort: 4,
        isVisible: true,
        moduleGroup: 'Engineering',
        children: [
          { title: 'Schedule of Rates (SOR)', route: '/sor', icon: 'BookOpen', sort: 1, isVisible: true },
          { title: 'Quantity Master', route: '/planning/quantity-master', icon: 'Calculator', sort: 2, isVisible: true },
          { title: 'QC Master & Checklists', route: '/planning/qc-master', icon: 'ClipboardCheck', sort: 3, isVisible: true },
        ],
      },
      {
        title: 'Services',
        route: '/services',
        icon: 'Briefcase',
        sort: 5,
        isVisible: true,
        moduleGroup: 'Services',
        children: [
          { title: 'Service Catalog', route: '/services', icon: 'Layers', sort: 1, isVisible: true },
          { title: 'Modules', route: '/services/modules', icon: 'Box', sort: 2, isVisible: true },
        ],
      },
      {
        title: 'Settings',
        route: '/settings',
        icon: 'Settings',
        sort: 6,
        isVisible: true,
        moduleGroup: 'Administration',
        children: [
          { title: 'Manage Menus', route: '/settings/manage-menus', icon: 'ListChecks', sort: 1, isVisible: true },
          { title: 'Manage Roles', route: '/settings/manage-roles', icon: 'ShieldCheck', sort: 2, isVisible: true },
          { title: 'Role Vs User', route: '/settings/role-vs-user', icon: 'UserCheck', sort: 3, isVisible: true },
          { title: 'User Management', route: '/settings/users', icon: 'Users', sort: 4, isVisible: true },
        ],
      },
    ];

    for (const item of defaultMenus) {
      const parent = await RbacMenu.create({
        companyId,
        title: item.title,
        route: item.route,
        icon: item.icon,
        sort: item.sort,
        isVisible: item.isVisible,
        moduleGroup: item.moduleGroup,
        isSystem: true,
      });

      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          await RbacMenu.create({
            companyId,
            title: child.title,
            route: child.route,
            icon: child.icon,
            sort: child.sort,
            isVisible: child.isVisible,
            parentId: parent._id,
            moduleGroup: item.moduleGroup,
            isSystem: true,
          });
        }
      }
    }
  }

  // Get all menus with hierarchical tree structure
  public static async getMenus(companyIdInput: string | Types.ObjectId) {
    const companyId = this.toObjectId(companyIdInput);
    await this.ensureDefaultMenus(companyId);
    const menus = await RbacMenu.find({ companyId }).sort({ sort: 1, createdAt: 1 }).lean();
    return menus;
  }

  public static async createMenu(companyIdInput: string | Types.ObjectId, data: Partial<IRbacMenu>) {
    const companyId = this.toObjectId(companyIdInput);
    const menu = await RbacMenu.create({
      ...data,
      companyId,
    });
    return menu;
  }

  public static async updateMenu(companyIdInput: string | Types.ObjectId, menuId: string, data: Partial<IRbacMenu>) {
    const companyId = this.toObjectId(companyIdInput);
    const menu = await RbacMenu.findOneAndUpdate(
      { _id: menuId, companyId },
      { $set: data },
      { new: true }
    );
    if (!menu) throw new AppError('Menu item not found', 404);
    return menu;
  }

  public static async deleteMenu(companyIdInput: string | Types.ObjectId, menuId: string) {
    const companyId = this.toObjectId(companyIdInput);
    await RbacMenu.deleteMany({ parentId: menuId, companyId });
    const res = await RbacMenu.findOneAndDelete({ _id: menuId, companyId });
    if (!res) throw new AppError('Menu item not found', 404);
    return { success: true };
  }

  // Ensure default roles exist with Allow and Decline permissions
  public static async ensureDefaultRoles(companyIdInput: string | Types.ObjectId) {
    const companyId = this.toObjectId(companyIdInput);
    const count = await RbacRole.countDocuments({ companyId });
    if (count > 0) return;

    const menus = await this.getMenus(companyId);
    const allMenuRoutes = menus.map((m) => ({
      menuRoute: m.route,
      menuTitle: m.title,
      allow: true,
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
    }));

    const defaultRoles = [
      { name: 'Master Admin', code: 'MASTER_ADMIN', color: '#F59E0B', isSystem: true, desc: 'Full unrestricted governance across all portal modules and security settings', allAllowed: true },
      { name: 'Counsellor', code: 'COUNSELLOR', color: '#3B82F6', isSystem: false, desc: 'Lead counselling, client engagement and admission/inquiry followups', allAllowed: false },
      { name: 'Accountant', code: 'ACCOUNTANT', color: '#10B981', isSystem: false, desc: 'Financial records, fee collections, payroll and payment accounting', allAllowed: false },
      { name: 'Employee', code: 'EMPLOYEE', color: '#6366F1', isSystem: false, desc: 'Standard staff employee with access to task assignments and self portal', allAllowed: false },
      { name: 'Developer', code: 'DEVELOPER', color: '#EC4899', isSystem: false, desc: 'Software engineering, portal integrations, APIs and system maintenance', allAllowed: false },
      { name: 'Site Engineer', code: 'SITE_ENGINEER', color: '#F97316', isSystem: false, desc: 'Field operations, e-MB measurements, DPR logs, and daily execution reporting', allAllowed: false },
      { name: 'Interior Designer', code: 'INTERIOR_DESIGNER', color: '#8B5CF6', isSystem: false, desc: 'Architectural finishes, material specification, 3D modelling and layouts', allAllowed: false },
      { name: 'Project Manager', code: 'PROJECT_MANAGER', color: '#14B8A6', isSystem: false, desc: 'Planning, schedule adherence, budgets, BOQ execution, and site governance', allAllowed: false },
      { name: 'Architect', code: 'ARCHITECT', color: '#EAB308', isSystem: false, desc: 'Structural and spatial blueprint planning, compliance and aesthetic designs', allAllowed: false },
      { name: 'Estimate Engineer', code: 'ESTIMATE_ENGINEER', color: '#06B6D4', isSystem: false, desc: 'Rate analysis, SOR masters, quantity estimations, and BOQ costing', allAllowed: false },
      { name: 'BDM', code: 'BDM', color: '#A855F7', isSystem: false, desc: 'Business development, client acquisitions, partnerships, and revenue expansion', allAllowed: false },
    ];

    for (const r of defaultRoles) {
      await RbacRole.create({
        companyId,
        name: r.name,
        code: r.code,
        description: r.desc,
        color: r.color,
        isSystem: r.isSystem,
        permissions: allMenuRoutes.map((p) => ({
          ...p,
          allow: r.allAllowed ? true : false,
        })),
      });
    }
  }

  public static async getRoles(companyIdInput: string | Types.ObjectId) {
    const companyId = this.toObjectId(companyIdInput);
    await this.ensureDefaultRoles(companyId);
    const roles = await RbacRole.find({ companyId }).sort({ createdAt: 1 }).lean();
    
    // Attach count of users with each role
    const users = await User.find({ companyId }).select('role').lean();
    const roleCounts: Record<string, number> = {};
    users.forEach((u) => {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    });

    return roles.map((r) => ({
      ...r,
      userCount: roleCounts[r.code] || 0,
    }));
  }

  public static async createRole(companyIdInput: string | Types.ObjectId, data: any) {
    const companyId = this.toObjectId(companyIdInput);
    const existing = await RbacRole.findOne({ companyId, code: data.code.toUpperCase() });
    if (existing) {
      throw new AppError(`Role with code '${data.code}' already exists`, 400);
    }

    const role = await RbacRole.create({
      ...data,
      companyId,
      code: data.code.toUpperCase(),
    });
    return role;
  }

  public static async updateRole(companyIdInput: string | Types.ObjectId, roleId: string, data: any) {
    const companyId = this.toObjectId(companyIdInput);
    const role = await RbacRole.findOneAndUpdate(
      { _id: roleId, companyId },
      { $set: data },
      { new: true }
    );
    if (!role) throw new AppError('Role not found', 404);
    return role;
  }

  // Toggle or set Allow / Decline for a specific permission in a role
  public static async updateRolePermission(
    companyIdInput: string | Types.ObjectId,
    roleId: string,
    menuRoute: string,
    allow: boolean
  ) {
    const companyId = this.toObjectId(companyIdInput);
    const role = await RbacRole.findOne({ _id: roleId, companyId });
    if (!role) throw new AppError('Role not found', 404);

    const permIndex = role.permissions.findIndex((p) => p.menuRoute === menuRoute);
    if (permIndex >= 0) {
      role.permissions[permIndex].allow = allow;
    } else {
      role.permissions.push({
        menuRoute,
        menuTitle: menuRoute,
        allow,
        canCreate: allow,
        canRead: allow,
        canUpdate: allow,
        canDelete: false,
      });
    }

    await role.save();
    return role;
  }

  // Batch update permissions (or allowAll / declineAll) for a role
  public static async batchUpdateRolePermissions(
    companyIdInput: string | Types.ObjectId,
    roleId: string,
    payload: { allowAll?: boolean; permissions?: Record<string, boolean> } | boolean
  ) {
    const companyId = this.toObjectId(companyIdInput);
    const role = await RbacRole.findOne({ _id: roleId, companyId });
    if (!role) throw new AppError('Role not found', 404);

    if (typeof payload === 'boolean') {
      role.permissions = role.permissions.map((p) => ({
        ...p,
        allow: payload,
      }));
    } else {
      if (payload.allowAll !== undefined) {
        role.permissions = role.permissions.map((p) => ({
          ...p,
          allow: payload.allowAll!,
        }));
      }

      if (payload.permissions) {
        const permMap = payload.permissions;
        for (const p of role.permissions) {
          if (permMap[p.menuRoute] !== undefined) {
            p.allow = permMap[p.menuRoute];
          }
        }
        for (const [route, isAllowed] of Object.entries(permMap)) {
          const exists = role.permissions.some((p) => p.menuRoute === route);
          if (!exists) {
            role.permissions.push({
              menuRoute: route,
              menuTitle: route,
              allow: isAllowed,
              canCreate: isAllowed,
              canRead: isAllowed,
              canUpdate: isAllowed,
              canDelete: false,
            });
          }
        }
      }
    }

    await role.save();

    // Propagate updated permissions to all users assigned to this role
    const rolePermMap: Record<string, boolean> = {};
    for (const p of role.permissions) {
      rolePermMap[p.menuRoute] = p.allow;
    }
    await User.updateMany(
      { companyId, $or: [{ role: role.code }, { role: role.name }] },
      { $set: { permissions: rolePermMap } }
    );

    return role;
  }

  public static async deleteRole(companyIdInput: string | Types.ObjectId, roleId: string) {
    const companyId = this.toObjectId(companyIdInput);
    const role = await RbacRole.findOne({ _id: roleId, companyId });
    if (!role) throw new AppError('Role not found', 404);
    if (role.isSystem) throw new AppError('System default roles cannot be deleted', 400);

    await RbacRole.deleteOne({ _id: roleId, companyId });
    return { success: true };
  }

  // User & Role Vs User Management
  public static async getUsers(companyIdInput: string | Types.ObjectId) {
    const companyId = this.toObjectId(companyIdInput);
    const users = await User.find({ companyId })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();
    return users;
  }

  public static async updateUserRoleAndPermissions(
    companyIdInput: string | Types.ObjectId,
    userId: string,
    data: { role?: string; permissions?: Record<string, boolean>; isActive?: boolean }
  ) {
    const companyId = this.toObjectId(companyIdInput);

    // If role changed and explicit permissions override not provided, sync from new role
    if (data.role && !data.permissions) {
      const roleDoc = await RbacRole.findOne({
        companyId,
        $or: [{ code: data.role }, { name: data.role }],
      });
      if (roleDoc && roleDoc.permissions) {
        const rolePerms: Record<string, boolean> = {};
        for (const p of roleDoc.permissions) {
          rolePerms[p.menuRoute] = p.allow;
        }
        data.permissions = rolePerms;
      }
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, companyId },
      { $set: data },
      { new: true }
    ).select('-passwordHash');

    if (!user) throw new AppError('User not found', 404);

    // If updated to SITE_ENGINEER, ensure SiteEngineer record exists
    if (data.role === 'SITE_ENGINEER' || data.role === 'Site Engineer') {
      const existingSe = await SiteEngineer.findOne({ loginId: user.email.toLowerCase().trim(), companyId });
      if (!existingSe) {
        await SiteEngineer.create({
          name: user.name,
          loginId: user.email,
          mobile: user.mobile || '-',
          expertise: 'Common',
          projectsCount: 0,
          walletBalance: 0,
          status: user.isActive ? 'Active' : 'Inactive',
          companyId,
        });
      }
    }

    return user;
  }

  // Allow (Activate) / Decline (Deactivate) user access
  public static async toggleUserStatus(companyIdInput: string | Types.ObjectId, userId: string) {
    const companyId = this.toObjectId(companyIdInput);
    const user = await User.findOne({ _id: userId, companyId });
    if (!user) throw new AppError('User not found', 404);

    user.isActive = !user.isActive;
    await user.save();
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
    };
  }

  public static async createUser(companyIdInput: string | Types.ObjectId, data: any) {
    const companyId = this.toObjectId(companyIdInput);
    const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) {
      throw new AppError(`User with email '${data.email}' already exists`, 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password || 'password123', salt);

    const targetRole = data.role || 'MASTER_ADMIN';

    // Fetch the role's current permissions so the new user receives them immediately
    const roleDoc = await RbacRole.findOne({
      companyId,
      $or: [{ code: targetRole }, { name: targetRole }],
    });

    const initialPermissions: Record<string, boolean> = {};
    if (roleDoc && roleDoc.permissions) {
      for (const p of roleDoc.permissions) {
        initialPermissions[p.menuRoute] = p.allow;
      }
    }

    const user = await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: targetRole,
      mobile: data.mobile || '',
      companyId,
      permissions: initialPermissions,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    if (targetRole === 'SITE_ENGINEER' || targetRole === 'Site Engineer') {
      await SiteEngineer.create({
        name: user.name,
        loginId: user.email,
        mobile: user.mobile || '-',
        expertise: data.expertise || 'Common',
        projectsCount: 0,
        walletBalance: 0,
        status: user.isActive ? 'Active' : 'Inactive',
        companyId,
      });
    }

    const { passwordHash: _, ...userObj } = user.toObject();
    return userObj;
  }

  public static async deleteUser(companyIdInput: string | Types.ObjectId, userId: string) {
    const companyId = this.toObjectId(companyIdInput);
    const user = await User.findOneAndDelete({ _id: userId, companyId });
    if (!user) throw new AppError('User not found', 404);

    if (user.role === 'SITE_ENGINEER') {
      await SiteEngineer.deleteOne({ loginId: user.email.toLowerCase().trim(), companyId });
    }

    return { success: true };
  }
}
