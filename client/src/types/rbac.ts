export interface RbacMenuItem {
  _id: string;
  title: string;
  route: string;
  icon: string;
  sort: number;
  isVisible: boolean; // true = Visible, false = Draft
  parentId?: string | null;
  moduleGroup?: string;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermission {
  menuRoute: string;
  menuTitle: string;
  allow: boolean; // Allow vs Decline
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface RbacRole {
  _id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  isSystem: boolean;
  userCount?: number;
  permissions: RolePermission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteEngineerItem {
  _id: string;
  name: string;
  loginId: string;
  mobile: string;
  expertise: string;
  projectsCount: number;
  status: 'Active' | 'Inactive'; // Active = Allowed, Inactive = Declined
  walletBalance: number;
  joinedDate: string;
  notes?: string;
}

export interface RbacUserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  mobile?: string;
  expertise?: string;
  projectsCount?: number;
  walletBalance?: number;
  isActive: boolean; // Allow vs Decline access
  permissions?: Record<string, boolean>;
  createdAt?: string;
}
