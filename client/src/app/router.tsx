import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-blue-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-blue-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
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
          <Route path="/rate-master" element={<RateMaster />} />
          <Route path="/projects/:projectId" element={<ProjectWorkspace />} />
          <Route path="/recycle-bin" element={<RecycleBin />} />

          {/* PLANNING */}
          <Route path="/planning" element={<ComingSoonModule />} />
          <Route path="/planning/quantity-master" element={<QuantityMaster />} />
          <Route path="/quantity-master" element={<QuantityMaster />} />
          <Route path="/planning/qc-master" element={<ComingSoonModule />} />

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

          {/* Utilities */}
          <Route path="/help" element={<Help />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
