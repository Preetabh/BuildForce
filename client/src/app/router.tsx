import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { AppLayout } from '../components/layout/AppLayout';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Home } from '../pages/Home';
import { ProjectWorkspace } from '../pages/ProjectWorkspace';
import { RateMaster } from '../pages/RateMaster';
import { QuantityMaster } from '../pages/QuantityMaster';
import { RecycleBin } from '../pages/RecycleBin';
import { ComingSoonModule } from '../pages/ComingSoonModule';
import { Help } from '../pages/Help';
import { Settings } from '../pages/Settings';
import { ClassyAppLoader } from '../components/common/ClassyAppLoader';
import { ForbiddenAccessPage } from '../pages/ForbiddenAccessPage';
import { LeadManagement } from '../pages/leads/LeadManagement';
import { ClientManagement } from '../pages/leads/ClientManagement';
import { PaymentManagement } from '../pages/leads/PaymentManagement';
import { PayAmountPage } from '../pages/leads/PayAmountPage';
import { ReferencePartners } from '../pages/leads/ReferencePartners';
import { CommissionReport } from '../pages/leads/CommissionReport';
import { ServiceCatalogPage } from '../pages/services/ServiceCatalogPage';
import { ManageMenus } from '../pages/rbac/ManageMenus';
import { ManageRoles } from '../pages/rbac/ManageRoles';
import { RoleVsUser } from '../pages/rbac/RoleVsUser';
import { UserManagement } from '../pages/rbac/UserManagement';
import { DetailedSiteEngineers } from '../pages/siteEngineers/DetailedSiteEngineers';
import { VendorManagement } from '../pages/vendors/VendorManagement';
import { WorkerManagement } from '../pages/vendors/WorkerManagement';
import { AuditLogsPage } from '../pages/audit/AuditLogsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <ClassyAppLoader message="Authenticating Secure Session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

interface PermissionRouteProps {
  permission: string | string[];
  children: React.ReactNode;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission, children }) => {
  const { canAccess, isMasterAdmin } = usePermissions();

  const perms = Array.isArray(permission) ? permission : [permission];
  const hasAccess = isMasterAdmin || perms.some((p) => canAccess(p));

  if (!hasAccess) {
    return <ForbiddenAccessPage permissionRequired={perms.join(' or ')} />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <ClassyAppLoader message="Loading Portal..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected ERP Shell Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Functional Core */}
          <Route path="/" element={<Home />} />
          <Route
            path="/sor"
            element={
              <PermissionRoute permission={['Admin/LibraryMgmt', '/sor', 'Schedule of Rates (SOR)']}>
                <RateMaster />
              </PermissionRoute>
            }
          />
          <Route path="/rate-master" element={<Navigate to="/sor" replace />} />
          <Route path="/projects/:projectId" element={<ProjectWorkspace />} />
          <Route path="/recycle-bin" element={<RecycleBin />} />

          {/* PLANNING */}
          <Route
            path="/planning"
            element={
              <PermissionRoute permission={['Admin/LibraryMgmt', '/planning', 'Project Schedule & WBS', 'Plannings']}>
                <ComingSoonModule />
              </PermissionRoute>
            }
          />
          <Route
            path="/planning/quantity-master"
            element={
              <PermissionRoute permission={['Admin/LibraryMgmt', '/planning/quantity-master', 'Quantity Master']}>
                <QuantityMaster />
              </PermissionRoute>
            }
          />
          <Route
            path="/quantity-master"
            element={
              <PermissionRoute permission={['Admin/LibraryMgmt', '/planning/quantity-master', 'Quantity Master']}>
                <QuantityMaster />
              </PermissionRoute>
            }
          />
          <Route
            path="/planning/qc-master"
            element={
              <PermissionRoute permission={['Admin/LibraryMgmt', '/planning/qc-master', 'QC Master & Checklists']}>
                <ComingSoonModule />
              </PermissionRoute>
            }
          />

          {/* EXECUTION */}
          <Route path="/execution" element={<ComingSoonModule />} />
          <Route path="/execution/measurement-book" element={<ComingSoonModule />} />
          <Route path="/execution/dpr" element={<ComingSoonModule />} />
          <Route path="/execution/inspections" element={<ComingSoonModule />} />
          <Route path="/execution/subcontractor-logs" element={<ComingSoonModule />} />

          {/* PROJECT CONTROL */}
          <Route path="/project-control" element={<ComingSoonModule />} />
          <Route path="/project-control/evm" element={<ComingSoonModule />} />
          <Route path="/project-control/budget" element={<ComingSoonModule />} />
          <Route path="/project-control/cashflow" element={<ComingSoonModule />} />

          {/* BILLING */}
          <Route path="/billing" element={<ComingSoonModule />} />
          <Route path="/billing/ra-bills" element={<ComingSoonModule />} />
          <Route path="/billing/subcontractor-bills" element={<ComingSoonModule />} />
          <Route path="/billing/escalation" element={<ComingSoonModule />} />

          {/* LEAD MANAGEMENT & CLIENT PORTAL */}
          <Route
            path="/leads"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/Enquiry']}>
                <LeadManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/lead-management"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/Enquiry']}>
                <LeadManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/leads/clients"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/Clients']}>
                <ClientManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/Clients']}>
                <ClientManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/Admin/Clients"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/Clients']}>
                <ClientManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/leads/payments"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/PaymentHistory']}>
                <PaymentManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/leads/pay-amount"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/CollectPayment']}>
                <PayAmountPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/leads/partners"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/ReferencePartners']}>
                <ReferencePartners />
              </PermissionRoute>
            }
          />
          <Route
            path="/leads/associate-partners"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/ReferencePartners']}>
                <ReferencePartners />
              </PermissionRoute>
            }
          />
          <Route
            path="/admin/associate-partners"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/ReferencePartners']}>
                <ReferencePartners />
              </PermissionRoute>
            }
          />
          <Route
            path="/Admin/AssociatePartners"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/ReferencePartners']}>
                <ReferencePartners />
              </PermissionRoute>
            }
          />
          <Route
            path="/leads/commission-reports"
            element={
              <PermissionRoute permission={['Admin/Management', 'Admin/CommissionReport']}>
                <CommissionReport />
              </PermissionRoute>
            }
          />

          {/* SERVICE CATALOG & MAIN SERVICES */}
          <Route
            path="/services"
            element={
              <PermissionRoute permission={['Admin/Service', 'Admin/ManageServices']}>
                <ServiceCatalogPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/service/services"
            element={
              <PermissionRoute permission={['Admin/Service', 'Admin/ManageServices']}>
                <ServiceCatalogPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/admin/service-catalog"
            element={
              <PermissionRoute permission={['Admin/Service', 'Admin/ManageServices']}>
                <ServiceCatalogPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <PermissionRoute permission={['Admin/Service', 'Admin/ManageServices']}>
                <ServiceCatalogPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/services/modules"
            element={
              <PermissionRoute permission={['Admin/Service', 'Admin/Modules']}>
                <ComingSoonModule />
              </PermissionRoute>
            }
          />
          <Route
            path="/service/modules"
            element={
              <PermissionRoute permission={['Admin/Service', 'Admin/Modules']}>
                <ComingSoonModule />
              </PermissionRoute>
            }
          />

          {/* VENDOR MANAGEMENT */}
          <Route
            path="/vendors"
            element={
              <PermissionRoute permission={['Admin/Venders', 'Admin/Vendors_Suppliers', 'vendor_management']}>
                <VendorManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/vendor-management"
            element={<Navigate to="/vendors/suppliers" replace />}
          />
          <Route
            path="/vendors/suppliers"
            element={
              <PermissionRoute permission={['Admin/Venders', 'Admin/Vendors_Suppliers', 'vendor_management']}>
                <VendorManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/Admin/Suppliers"
            element={<Navigate to="/vendors/suppliers" replace />}
          />
          <Route
            path="/vendors/workers"
            element={
              <PermissionRoute permission={['Admin/Venders', 'Admin/Vendors_Workers', 'vendor_management']}>
                <WorkerManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/Admin/Workers"
            element={<Navigate to="/vendors/workers" replace />}
          />

          {/* SALES & TENDERING */}
          <Route path="/sales" element={<ComingSoonModule />} />
          <Route path="/sales/tenders" element={<ComingSoonModule />} />
          <Route path="/sales/bids" element={<ComingSoonModule />} />
          <Route path="/sales/work-orders" element={<ComingSoonModule />} />

          {/* MATERIALS & INVENTORY */}
          <Route path="/materials" element={<ComingSoonModule />} />
          <Route path="/materials/inventory" element={<ComingSoonModule />} />
          <Route path="/materials/purchase-orders" element={<ComingSoonModule />} />
          <Route path="/materials/mrn" element={<ComingSoonModule />} />
          <Route path="/materials/grn" element={<ComingSoonModule />} />

          {/* MACHINERY & ASSETS */}
          <Route path="/machinery" element={<ComingSoonModule />} />
          <Route path="/machinery/equipment" element={<ComingSoonModule />} />
          <Route path="/machinery/fuel-log" element={<ComingSoonModule />} />
          <Route path="/machinery/maintenance" element={<ComingSoonModule />} />

          {/* MANPOWER & HR */}
          <Route path="/manpower" element={<ComingSoonModule />} />
          <Route path="/manpower/attendance" element={<ComingSoonModule />} />
          <Route path="/manpower/productivity" element={<ComingSoonModule />} />

          {/* QUALITY & SAFETY (HSE) */}
          <Route path="/hse" element={<ComingSoonModule />} />
          <Route path="/hse/qc" element={<ComingSoonModule />} />
          <Route path="/hse/safety" element={<ComingSoonModule />} />

          {/* SITE ENGINEERS & FIELD OPERATIONS */}
          <Route
            path="/admin/site-engineers"
            element={
              <PermissionRoute permission={['Admin/SiteEngineersSection', 'Admin/ManageSiteEngineers']}>
                <DetailedSiteEngineers />
              </PermissionRoute>
            }
          />
          <Route
            path="/Admin/ManageSiteEngineers"
            element={
              <PermissionRoute permission={['Admin/SiteEngineersSection', 'Admin/ManageSiteEngineers']}>
                <DetailedSiteEngineers />
              </PermissionRoute>
            }
          />
          <Route
            path="/admin/add-site-engineer"
            element={
              <PermissionRoute permission={['Admin/SiteEngineersSection', 'Admin/ManageSiteEngineers']}>
                <DetailedSiteEngineers />
              </PermissionRoute>
            }
          />
          <Route
            path="/Admin/AddSiteEngineer"
            element={
              <PermissionRoute permission={['Admin/SiteEngineersSection', 'Admin/ManageSiteEngineers']}>
                <DetailedSiteEngineers />
              </PermissionRoute>
            }
          />

          {/* RBAC ROLE ADMIN SECTION */}
          <Route
            path="/settings/manage-menus"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/ManageMenus']}>
                <ManageMenus />
              </PermissionRoute>
            }
          />
          <Route
            path="/RBAC/ManageMenus"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/ManageMenus']}>
                <ManageMenus />
              </PermissionRoute>
            }
          />
          <Route
            path="/Admin/ManageMenus"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/ManageMenus']}>
                <ManageMenus />
              </PermissionRoute>
            }
          />
          <Route
            path="/admin/manage-menus"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/ManageMenus']}>
                <ManageMenus />
              </PermissionRoute>
            }
          />

          <Route
            path="/settings/manage-roles"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/ManageRoles']}>
                <ManageRoles />
              </PermissionRoute>
            }
          />
          <Route
            path="/RBAC/ManageRoles"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/ManageRoles']}>
                <ManageRoles />
              </PermissionRoute>
            }
          />
          <Route
            path="/Admin/ManageRoles"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/ManageRoles']}>
                <ManageRoles />
              </PermissionRoute>
            }
          />
          <Route
            path="/admin/manage-roles"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/ManageRoles']}>
                <ManageRoles />
              </PermissionRoute>
            }
          />

          <Route
            path="/settings/role-vs-user"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/UserOverrides']}>
                <RoleVsUser />
              </PermissionRoute>
            }
          />
          <Route
            path="/RBAC/RoleVsUser"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/UserOverrides']}>
                <RoleVsUser />
              </PermissionRoute>
            }
          />
          <Route
            path="/Admin/RoleVsUser"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/UserOverrides']}>
                <RoleVsUser />
              </PermissionRoute>
            }
          />
          <Route
            path="/admin/role-vs-user"
            element={
              <PermissionRoute permission={['Admin/Settings', 'RBAC/UserOverrides']}>
                <RoleVsUser />
              </PermissionRoute>
            }
          />

          <Route
            path="/settings/users"
            element={
              <PermissionRoute permission={['Admin/Settings', 'Home/ManageEmployees']}>
                <UserManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/Admin/Users"
            element={
              <PermissionRoute permission={['Admin/Settings', 'Home/ManageEmployees']}>
                <UserManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PermissionRoute permission={['Admin/Settings', 'Home/ManageEmployees']}>
                <UserManagement />
              </PermissionRoute>
            }
          />

          {/* Enterprise Audit & Security Logs */}
          <Route
            path="/settings/audit-logs"
            element={
              <PermissionRoute permission={['Admin/Settings', 'AuditLogs', 'audit_logs']}>
                <AuditLogsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <PermissionRoute permission={['Admin/Settings', 'AuditLogs', 'audit_logs']}>
                <AuditLogsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/audit"
            element={<Navigate to="/settings/audit-logs" replace />}
          />

          {/* Utilities */}
          <Route path="/help" element={<Help />} />
          <Route
            path="/settings"
            element={
              <PermissionRoute permission="Admin/Settings">
                <Settings />
              </PermissionRoute>
            }
          />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
