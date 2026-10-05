export interface PermissionItemConfig {
  key: string;
  title: string;
  route: string;
}

export interface PermissionModuleConfig {
  id: string;
  name: string;
  iconName: string;
  entryPoint: {
    key: string;
    title: string;
    route: string;
    description: string;
  };
  items: PermissionItemConfig[];
}

export const ROLE_PERMISSION_MODULES: PermissionModuleConfig[] = [
  // 1. Dashboard (Home)
  {
    id: 'dashboard',
    name: 'DASHBOARD (HOME)',
    iconName: 'LayoutDashboard',
    entryPoint: {
      key: 'Admin/Dashboard',
      title: 'Dashboard / Home Access',
      route: 'Admin/Dashboard',
      description: 'Module Entry Point for Portal Home Dashboard & Analytics Overview',
    },
    items: [
      { key: 'Admin/Dash_TotalLeads', title: 'Total Leads Metric Card', route: 'Admin/Dash_TotalLeads' },
      { key: 'Admin/Dash_TotalClients', title: 'Total Clients Metric Card', route: 'Admin/Dash_TotalClients' },
      { key: 'Admin/Dash_TotalCollection', title: 'Total Collection Metric Card', route: 'Admin/Dash_TotalCollection' },
      { key: 'Admin/Dash_TotalPending', title: 'Pending Payment Metric Card', route: 'Admin/Dash_TotalPending' },
      { key: 'Admin/Dash_TodayLeads', title: "Today's Leads Metric Card", route: 'Admin/Dash_TodayLeads' },
      { key: 'Admin/Dash_TodayClients', title: "Today's Clients Metric Card", route: 'Admin/Dash_TodayClients' },
      { key: 'Admin/Dash_TodayCollection', title: "Today's Collection Metric Card", route: 'Admin/Dash_TodayCollection' },
      { key: 'Admin/Dash_ActiveEmployees', title: 'Active Employees Metric Card', route: 'Admin/Dash_ActiveEmployees' },
    ],
  },

  // 2. Plannings
  {
    id: 'plannings',
    name: 'PLANNINGS',
    iconName: 'CalendarRange',
    entryPoint: {
      key: 'Admin/LibraryMgmt',
      title: 'Plannings Access',
      route: 'Admin/LibraryMgmt',
      description: 'Module Entry Point for Plannings, Schedule of Rates, and Masters',
    },
    items: [
      { key: '/sor', title: 'Schedule of Rates (SOR)', route: '/sor' },
      { key: '/planning/quantity-master', title: 'Quantity Master', route: '/planning/quantity-master' },
      { key: '/planning/qc-master', title: 'QC Master & Checklists', route: '/planning/qc-master' },
      { key: '/planning', title: 'Project Schedule & WBS', route: '/planning' },
      { key: 'Library/Party', title: 'Library Setup (Optional)', route: 'Library/Party' },
      { key: 'Procurement/Dashboard', title: 'Purchase Orders (PO)', route: 'Procurement/Dashboard' },
      { key: 'Boq/Projects', title: 'BOQ Projects', route: 'Boq/Projects' },
    ],
  },

  // 3. Lead Management
  {
    id: 'lead_management',
    name: 'LEAD MANAGEMENT',
    iconName: 'Users',
    entryPoint: {
      key: 'Admin/Management',
      title: 'Lead Management Access',
      route: 'Admin/Management',
      description: 'Module Entry Point for Leads, Clients, Payments, and Partners',
    },
    items: [
      { key: 'Admin/Enquiry', title: 'Leads Directory', route: '/leads' },
      { key: 'Admin/Clients', title: 'Client Management', route: '/leads/clients' },
      { key: 'Admin/ViewAllLeads', title: 'View All Organization Leads & Clients (Admin Oversight)', route: 'Admin/ViewAllLeads' },
      { key: 'Admin/PaymentHistory', title: 'Payment History', route: '/leads/payments' },
      { key: 'Admin/CollectPayment', title: 'Pay Amount (Collection)', route: '/leads/pay-amount' },
      { key: 'Admin/ReferencePartners', title: 'Reference Partners', route: '/leads/partners' },
      { key: 'Admin/CommissionReport', title: 'Commission Report', route: '/leads/commission-reports' },
    ],
  },

  // 4. Service
  {
    id: 'service_catalog',
    name: 'SERVICE',
    iconName: 'Layers',
    entryPoint: {
      key: 'Admin/Service',
      title: 'Service Catalog Access',
      route: 'Admin/Service',
      description: 'Module Entry Point for Service Offerings and Construction Modules',
    },
    items: [
      { key: 'Admin/ManageServices', title: 'Services Catalog', route: '/services' },
      { key: 'Admin/Modules', title: 'Service Modules', route: '/services/modules' },
    ],
  },

  // 5. All Teams
  {
    id: 'all_teams',
    name: 'ALL TEAMS',
    iconName: 'CreditCard',
    entryPoint: {
      key: 'Admin/MyTeamsAccess',
      title: 'All Teams Access',
      route: 'Admin/MyTeamsAccess',
      description: 'Module Entry Point for Viewing and Filtering by Team Members',
    },
    items: [
      { key: 'Admin/MyTeams', title: 'Team Members Directory', route: 'Admin/MyTeams' },
    ],
  },

  // 6. Site Engineer
  {
    id: 'site_engineer',
    name: 'SITE ENGINEER',
    iconName: 'HardHat',
    entryPoint: {
      key: 'Admin/SiteEngineersSection',
      title: 'Site Engineer Section Access',
      route: 'Admin/SiteEngineersSection',
      description: 'Module Entry Point for Field Engineers and Site Operations',
    },
    items: [
      { key: 'Admin/SiteEngineers_List', title: 'Detailed Site Engineers', route: '/admin/site-engineers' },
      { key: 'Admin/ManageSiteEngineers', title: 'Add Site Engineer', route: '/admin/add-site-engineer' },
    ],
  },

  // 7. Vendor Management
  {
    id: 'vendor_management',
    name: 'VENDOR MANAGEMENT',
    iconName: 'Truck',
    entryPoint: {
      key: 'Admin/Venders',
      title: 'Vendor Management Access',
      route: 'Admin/Venders',
      description: 'Module Entry Point for Material Suppliers, Subcontractors, and Site Workers',
    },
    items: [
      { key: 'Admin/Vendors_Suppliers', title: 'Suppliers Directory', route: '/vendors/suppliers' },
      { key: 'Admin/Vendors_Workers', title: 'Workers Master', route: '/vendors/workers' },
    ],
  },

  // 8. Project Management
  {
    id: 'project_management',
    name: 'PROJECT MANAGEMENT',
    iconName: 'FolderKanban',
    entryPoint: {
      key: 'Admin/ReportAnalytic',
      title: 'Project Management Access',
      route: 'Admin/ReportAnalytic',
      description: 'Module Entry Point for Projects Workspace, e-MB, DPR, EVM, and Inspections',
    },
    items: [
      { key: 'Admin/DailyReportList', title: 'Projects Workspace', route: '/' },
      { key: 'Admin/MeasurementBook', title: 'Measurement Book (e-MB)', route: '/execution/measurement-book' },
      { key: 'Admin/DPR', title: 'Daily Progress Report (DPR)', route: '/execution/dpr' },
      { key: 'Admin/EVM', title: 'Cost Control & EVM', route: '/project-control/evm' },
      { key: 'Admin/Inspections', title: 'Site Inspection Checklist', route: '/execution/inspections' },
    ],
  },

  // 9. Settings
  {
    id: 'settings',
    name: 'SETTINGS & RBAC',
    iconName: 'Settings',
    entryPoint: {
      key: 'Admin/Settings',
      title: 'Settings Access',
      route: 'Admin/Settings',
      description: 'Module Entry Point for Menus, Roles, Permissions, and User Administration',
    },
    items: [
      { key: 'RBAC/ManageMenus', title: 'Manage Menus', route: '/settings/manage-menus' },
      { key: 'RBAC/ManageRoles', title: 'Manage Roles', route: '/settings/manage-roles' },
      { key: 'RBAC/UserOverrides', title: 'Role Vs User (Overrides)', route: '/settings/role-vs-user' },
      { key: 'Home/ManageEmployees', title: 'User Management', route: '/settings/users' },
    ],
  },
];
