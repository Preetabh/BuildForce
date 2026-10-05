import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { rbacService } from '../services/rbac.service';
import { RbacRole } from '../types/rbac';

export const SYSTEM_ROLE_FALLBACKS: Array<{ name: string; code: string }> = [
  { name: 'Master Admin', code: 'MASTER_ADMIN' },
  { name: 'Counsellor', code: 'COUNSELLOR' },
  { name: 'Accountant', code: 'ACCOUNTANT' },
  { name: 'Employee', code: 'EMPLOYEE' },
  { name: 'Developer', code: 'DEVELOPER' },
  { name: 'Site Engineer', code: 'SITE_ENGINEER' },
  { name: 'Interior Designer', code: 'INTERIOR_DESIGNER' },
  { name: 'Project Manager', code: 'PROJECT_MANAGER' },
  { name: 'Architect', code: 'ARCHITECT' },
  { name: 'Estimate Engineer', code: 'ESTIMATE_ENGINEER' },
  { name: 'BDM', code: 'BDM' },
];

export function usePermissions() {
  const { user } = useAuth();
  // CRITICAL ARCHITECTURE RULE:
  // Viewing another user profile is strictly for DATA FILTERING/CONTEXT (e.g., scoping leads).
  // It must NEVER switch the session role, permissions, sidebar, or UI.
  // The authenticated logged-in user (Admin) retains their own role and permissions.

  const { data: roles = [] } = useQuery<RbacRole[]>({
    queryKey: ['rbacRoles'],
    queryFn: rbacService.getRoles,
    staleTime: 30 * 1000,
  });

  // Always use the authenticated logged-in user's role
  const userRoleCode = (user?.role || '').trim();

  // Master Admin has full unrestricted access by default unless explicitly overridden
  const isMasterAdmin =
    Boolean(userRoleCode) &&
    (userRoleCode === 'ADMIN' ||
      userRoleCode === 'MASTER_ADMIN' ||
      userRoleCode.toLowerCase() === 'master admin' ||
      userRoleCode === 'SUPER_ADMIN');

  // Find the matching role definition for the logged-in user
  const activeRoleDoc = useMemo(() => {
    if (!userRoleCode) return null;
    return (
      roles.find(
        (r) =>
          r.code.toUpperCase() === userRoleCode.toUpperCase() ||
          r.name.toLowerCase() === userRoleCode.toLowerCase() ||
          (isMasterAdmin && (r.code === 'MASTER_ADMIN' || r.code === 'ADMIN'))
      ) || null
    );
  }, [roles, userRoleCode, isMasterAdmin]);

  // Unified lookup function for permissions
  const canAccess = (keyOrRoute: string): boolean => {
    // 1. Check user-level granular override first
    const userOverrides = (user as any)?.permissions;
    if (userOverrides && typeof userOverrides === 'object') {
      if (userOverrides[keyOrRoute] !== undefined) {
        return Boolean(userOverrides[keyOrRoute]);
      }
    }

    // 2. Check role-level permission
    if (activeRoleDoc && Array.isArray(activeRoleDoc.permissions)) {
      const match = (activeRoleDoc.permissions as any[]).find(
        (p: any) => p.menuRoute === keyOrRoute || p.menuTitle === keyOrRoute
      );
      if (match) {
        return Boolean(match.allow);
      }
    }

    // 3. Fallback for Master Admin
    if (isMasterAdmin) {
      return true;
    }

    // 4. Module entry point fallback: if user has general access to the module, allow sub-items
    const parentFallbackMap: Record<string, string[]> = {
      // Plannings
      '/planning/quantity-master': ['Admin/LibraryMgmt', 'Plannings / Library Access', '/planning', 'Plannings'],
      'Quantity Master': ['Admin/LibraryMgmt', 'Plannings / Library Access', '/planning', 'Plannings'],
      '/sor': ['Admin/LibraryMgmt', 'Plannings / Library Access', '/planning', 'Plannings'],
      'Schedule of Rates (SOR)': ['Admin/LibraryMgmt', 'Plannings / Library Access', '/planning', 'Plannings'],
      '/planning/qc-master': ['Admin/LibraryMgmt', 'Plannings / Library Access', '/planning', 'Plannings'],
      'QC Master & Checklists': ['Admin/LibraryMgmt', 'Plannings / Library Access', '/planning', 'Plannings'],
      '/planning': ['Admin/LibraryMgmt', 'Plannings / Library Access', 'Plannings'],
      'Project Schedule & WBS': ['Admin/LibraryMgmt', 'Plannings / Library Access', '/planning', 'Plannings'],

      // Lead Management
      'Admin/Enquiry': ['Admin/Management'],
      'Admin/Clients': ['Admin/Management'],
      'Admin/PaymentHistory': ['Admin/Management'],
      'Admin/CollectPayment': ['Admin/Management'],
      'Admin/ReferencePartners': ['Admin/Management'],
      'Admin/CommissionReport': ['Admin/Management'],

      // Service
      'Admin/ManageServices': ['Admin/Service'],
      'Admin/Modules': ['Admin/Service'],

      // All Teams
      'Admin/MyTeams': ['Admin/MyTeamsAccess'],

      // Site Engineer
      'Admin/SiteEngineers_List': ['Admin/SiteEngineersSection'],
      'Admin/ManageSiteEngineers': ['Admin/SiteEngineersSection'],

      // Vendor Management
      'Admin/Vendors_Suppliers': ['Admin/Venders'],
      'Admin/Vendors_Workers': ['Admin/Venders'],

      // Project Management
      'Admin/DailyReportList': ['Admin/ReportAnalytic'],
      'Admin/MeasurementBook': ['Admin/ReportAnalytic'],
      'Admin/DPR': ['Admin/ReportAnalytic'],
      'Admin/EVM': ['Admin/ReportAnalytic'],
      'Admin/Inspections': ['Admin/ReportAnalytic'],

      // Settings
      'RBAC/ManageMenus': ['Admin/Settings'],
      'RBAC/ManageRoles': ['Admin/Settings'],
      'RBAC/UserOverrides': ['Admin/Settings'],
      'Home/ManageEmployees': ['Admin/Settings'],
    };

    const parentKeys = parentFallbackMap[keyOrRoute];
    if (parentKeys) {
      // Check user overrides for parent keys
      if (userOverrides && typeof userOverrides === 'object') {
        for (const pk of parentKeys) {
          if (typeof userOverrides[pk] === 'boolean') {
            return userOverrides[pk];
          }
        }
      }

      // Check role permissions for parent keys
      if (activeRoleDoc && Array.isArray(activeRoleDoc.permissions)) {
        const parentMatch = (activeRoleDoc.permissions as any[]).find(
          (p: any) => parentKeys.includes(p.menuRoute) || parentKeys.includes(p.menuTitle)
        );
        if (parentMatch) {
          return Boolean(parentMatch.allow);
        }
      }
    }

    // For any other standard role, default to false if not granted
    return false;
  };

  /**
   * Helper to check top-level module access for navigation accordions
   */
  const isModuleAllowed = (moduleId: string): boolean => {
    if (isMasterAdmin) return true;

    const moduleMapping: Record<string, string[]> = {
      plannings: [
        'Admin/LibraryMgmt',
        'Plannings / Library Access',
        'Library Mgmt Access',
        '/planning',
        'Plannings',
        '/sor',
        'Schedule of Rates (SOR)',
        '/planning/quantity-master',
        'Quantity Master',
        '/planning/qc-master',
        'QC Master & Checklists',
      ],
      lead_management: ['Admin/Management'],
      service_catalog: ['Admin/Service'],
      all_teams: ['Admin/MyTeamsAccess'],
      site_enginner: ['Admin/SiteEngineersSection'],
      vendor_management: ['Admin/Venders'],
      project_management: ['Admin/ReportAnalytic'],
      settings: ['Admin/Settings'],
    };

    const entryPoints = moduleMapping[moduleId];
    if (entryPoints) {
      return entryPoints.some((ep) => canAccess(ep));
    }

    return true;
  };

  return {
    canAccess,
    isModuleAllowed,
    isMasterAdmin,
    activeRole: activeRoleDoc,
    roleDisplayName: activeRoleDoc?.name || (isMasterAdmin ? 'Master Admin' : userRoleCode),
    roles,
  };
}
