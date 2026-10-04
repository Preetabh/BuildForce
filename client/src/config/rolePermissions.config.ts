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
  {
    id: 'dashboard',
    name: 'DASHBOARD',
    iconName: 'LayoutDashboard',
    entryPoint: {
      key: 'Admin/Dashboard',
      title: 'Dashboard Access',
      route: 'Admin/Dashboard',
      description: 'Module Entry Point',
    },
    items: [
      { key: 'Admin/GetPaymentNotificationsAjax', title: 'GetPaymentNotificationsAjax', route: 'Admin/GetPaymentNotificationsAjax' },
      { key: 'Admin/DismissNotificationAjax', title: 'DismissNotificationAjax', route: 'Admin/DismissNotificationAjax' },
      { key: 'Admin/MarkReportAsReadAjax', title: 'MarkReportAsReadAjax', route: 'Admin/MarkReportAsReadAjax' },
      { key: 'Admin/Dash_TotalLeads', title: 'Dash: Total Leads', route: 'Admin/Dash_TotalLeads' },
      { key: 'Admin/Dash_TotalClients', title: 'Dash: Total Clients', route: 'Admin/Dash_TotalClients' },
      { key: 'Admin/Dash_TotalCollection', title: 'Dash: Total Collection', route: 'Admin/Dash_TotalCollection' },
      { key: 'Admin/Dash_TotalPending', title: 'Dash: Pending Payment', route: 'Admin/Dash_TotalPending' },
      { key: 'Admin/Dash_TodayLeads', title: 'Dash: Today\'s Leads', route: 'Admin/Dash_TodayLeads' },
      { key: 'Admin/Dash_TodayClients', title: 'Dash: Today\'s Clients', route: 'Admin/Dash_TodayClients' },
      { key: 'Admin/Dash_TodayCollection', title: 'Dash: Today\'s Collection', route: 'Admin/Dash_TodayCollection' },
      { key: 'Admin/Dash_ActiveEmployees', title: 'Dash: Active Employees', route: 'Admin/Dash_ActiveEmployees' },
    ],
  },
  {
    id: 'site_engineer_dashboard',
    name: 'SITE ENGINEER DASHBOARD',
    iconName: 'HardHat',
    entryPoint: {
      key: 'Admin/SiteEngineerDashboard',
      title: 'Site Engineer Dashboard Access',
      route: 'Admin/SiteEngineerDashboard',
      description: 'Module Entry Point',
    },
    items: [],
  },
  {
    id: 'management',
    name: 'MANAGEMENT',
    iconName: 'Users',
    entryPoint: {
      key: 'Admin/Management',
      title: 'Management Access',
      route: 'Admin/Management',
      description: 'Module Entry Point',
    },
    items: [
      { key: 'Admin/Enquiry', title: 'Leads', route: 'Admin/Enquiry' },
      { key: 'Admin/Clients', title: 'Client', route: 'Admin/Clients' },
      { key: 'Admin/PaymentHistory', title: 'Payment', route: 'Admin/PaymentHistory' },
      { key: 'Admin/CollectPayment', title: 'Pay Amount', route: 'Admin/CollectPayment' },
      { key: 'Admin/ReferencePartners', title: 'Reference Partners', route: 'Admin/ReferencePartners' },
      { key: 'Admin/CommissionReport', title: 'Commission Report', route: 'Admin/CommissionReport' },
    ],
  },
  {
    id: 'service',
    name: 'SERVICE',
    iconName: 'Layers',
    entryPoint: {
      key: 'Admin/Service',
      title: 'Service Access',
      route: 'Admin/Service',
      description: 'Module Entry Point',
    },
    items: [
      { key: 'Admin/ManageServices_Main', title: 'Main Services', route: 'Admin/ManageServices' },
      { key: 'Admin/ManageServices_List', title: 'Services', route: 'Admin/ManageServices' },
      { key: 'Admin/Modules', title: 'Sub Services', route: 'Admin/Modules' },
    ],
  },
  {
    id: 'my_wallet',
    name: 'MY WALLET',
    iconName: 'Wallet',
    entryPoint: {
      key: 'Admin/MyWallet',
      title: 'My Wallet Access',
      route: 'Admin/MyWallet',
      description: 'Module Entry Point',
    },
    items: [],
  },
  {
    id: 'site_enginner',
    name: 'SITE ENGINNER',
    iconName: 'HardHat',
    entryPoint: {
      key: 'Admin/SiteEngineersSection',
      title: 'Site Enginner Access',
      route: 'Admin/SiteEngineersSection',
      description: 'Module Entry Point',
    },
    items: [
      { key: 'Admin/ManageSiteEngineers', title: 'AddSiteEnginner', route: 'Admin/ManageSiteEngineers' },
    ],
  },
  {
    id: 'myteams',
    name: 'MYTEAMS',
    iconName: 'CreditCard',
    entryPoint: {
      key: 'Admin/MyTeamsAccess',
      title: 'MyTeams Access',
      route: 'Admin/MyTeamsAccess',
      description: 'Module Entry Point',
    },
    items: [
      { key: 'Admin/MyTeams', title: 'User', route: 'Admin/MyTeams' },
    ],
  },
  {
    id: 'services_description_name',
    name: 'SERVICES DESCRIPTION NAME',
    iconName: 'Wrench',
    entryPoint: {
      key: 'Admin/ServicesDescription',
      title: 'Services Description Name Access',
      route: 'Admin/ServicesDescription',
      description: 'Module Entry Point',
    },
    items: [
      { key: 'Admin/ManageServices_Desc', title: 'Services', route: 'Admin/ManageServices' },
    ],
  },
  {
    id: 'report_analytic',
    name: 'REPORT ANALYTIC',
    iconName: 'FileSpreadsheet',
    entryPoint: {
      key: 'Admin/ReportAnalytic',
      title: 'Report Analytic Access',
      route: 'Admin/ReportAnalytic',
      description: 'Module Entry Point',
    },
    items: [
      { key: 'Admin/DailyReportList', title: 'Projects', route: 'Admin/DailyReportList' },
    ],
  },
  {
    id: 'venders',
    name: 'VENDERS',
    iconName: 'Truck',
    entryPoint: {
      key: 'Admin/Venders',
      title: 'Venders Access',
      route: 'Admin/Venders',
      description: 'Module Entry Point',
    },
    items: [],
  },
  {
    id: 'reports_and_history',
    name: 'REPORTS & HISTORY',
    iconName: 'Clock',
    entryPoint: {
      key: 'Admin/ReportsAndHistory',
      title: 'Reports & History Access',
      route: 'Admin/ReportsAndHistory',
      description: 'Module Entry Point',
    },
    items: [
      { key: 'Admin/ActivityLogs', title: 'Activity Logs', route: 'Admin/ActivityLogs' },
      { key: 'Admin/UserSessions', title: 'User Sessions', route: 'Admin/UserSessions' },
    ],
  },
  {
    id: 'library_mgmt',
    name: 'LIBRARY MGMT',
    iconName: 'BookOpen',
    entryPoint: {
      key: 'Admin/LibraryMgmt',
      title: 'Library Mgmt Access',
      route: 'Admin/LibraryMgmt',
      description: 'Module Entry Point',
    },
    items: [
      { key: 'Library/Party', title: 'Library Setup', route: 'Library/Party' },
      { key: 'Procurement/Dashboard', title: 'PO', route: 'Procurement/Dashboard' },
      { key: 'Boq/Projects', title: 'Projects', route: 'Boq/Projects' },
    ],
  },
  {
    id: 'settings',
    name: 'SETTINGS',
    iconName: 'Settings',
    entryPoint: {
      key: 'Admin/Settings',
      title: 'Settings Access',
      route: 'Admin/Settings',
      description: 'Module Entry Point',
    },
    items: [
      { key: 'RBAC/ManageMenus', title: 'Manage Menus', route: 'RBAC/ManageMenus' },
      { key: 'RBAC/ManageRoles', title: 'Manage Roles', route: 'RBAC/ManageRoles' },
      { key: 'RBAC/UserOverrides', title: 'Role Vs User', route: 'RBAC/UserOverrides' },
      { key: 'Home/ManageEmployees', title: 'User', route: 'Home/ManageEmployees' },
    ],
  },
];
