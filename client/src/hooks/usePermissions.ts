import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';
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
  const { viewingUser, isViewing } = useImpersonation();

  const { data: roles = [] } = useQuery<RbacRole[]>({
    queryKey: ['rbacRoles'],
    queryFn: rbacService.getRoles,
    staleTime: 30 * 1000,
  });

  // Effective user is viewingUser when impersonating, else the logged in user
  const effectiveUser = isViewing && viewingUser ? viewingUser : user;
  const userRoleCode = (effectiveUser?.role || 'MASTER_ADMIN').trim();

  // Master Admin has full unrestricted access by default unless explicitly overridden
  const isMasterAdmin =
    userRoleCode === 'ADMIN' ||
    userRoleCode === 'MASTER_ADMIN' ||
    userRoleCode.toLowerCase() === 'master admin' ||
    userRoleCode === 'SUPER_ADMIN';

  // Find the matching role definition
  const activeRoleDoc = useMemo(() => {
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
    const userOverrides = (effectiveUser as any)?.permissions;
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

    // For any other standard role, default to false if not granted
    return false;
  };

  /**
   * Helper to check top-level module access for navigation accordions
   */
  const isModuleAllowed = (moduleId: string): boolean => {
    if (isMasterAdmin) return true;

    const moduleMapping: Record<string, string> = {
      plannings: 'Admin/LibraryMgmt',
      lead_management: 'Admin/Management',
      service_catalog: 'Admin/Service',
      all_teams: 'Admin/MyTeamsAccess',
      site_enginner: 'Admin/SiteEngineersSection',
      vendor_management: 'Admin/Venders',
      project_management: 'Admin/ReportAnalytic',
      settings: 'Admin/Settings',
    };

    const entryPoint = moduleMapping[moduleId];
    if (entryPoint) {
      return canAccess(entryPoint);
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
