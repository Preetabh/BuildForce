import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { HelpCircle, BookOpen, MessageSquare, Shield, HardHat, FileText } from 'lucide-react';
import { Header } from '../components/layout/Header';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

export const Help: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<OutletContextType>();

  const faqs = [
    {
      q: 'How does Project soft deletion and the Recycle Bin work?',
      a: 'When you delete a project from the Home dashboard, it is not permanently erased. Its deletedAt timestamp and deletedBy user ID are set, moving it into the Recycle Bin. You can restore it at any time, or permanently purge it from the database.',
    },
    {
      q: 'Are project metrics and totals calculated dynamically?',
      a: 'Yes. All statistics (Total Projects, Active Projects, Completed Projects, Drafts, and Portfolio Value) are calculated in real time using MongoDB aggregations on non-deleted records for your company.',
    },
    {
      q: 'How is multi-tenant isolation enforced?',
      a: 'Every project, user, and audit log is indexed by companyId. Users can only read, update, or delete records associated with their authenticated organization.',
    },
    {
      q: 'When will the estimation, BOQ and SOR modules be active?',
      a: 'The architectural schema for Schedule of Rates (SOR) and work breakdown items is established. Business logic and calculation engines are scheduled for Phase 2 expansion.',
    },
  ];

  return (
    <div>
      <Header
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Help & Info' }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-erp-text tracking-tight">
            Help & Documentation
          </h1>
          <p className="text-sm text-erp-text-muted mt-1">
            BudgetPilot Construction ERP user guides and architectural reference.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-erp-border">
            <BookOpen className="w-6 h-6 text-blue-400 mb-3" />
            <h3 className="font-semibold text-sm text-erp-text">User Manual</h3>
            <p className="text-xs text-erp-text-muted mt-1">
              Step-by-step documentation on project setup, timeline scheduling, and budget tracking.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-erp-border">
            <Shield className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-sm text-erp-text">Audit & Security</h3>
            <p className="text-xs text-erp-text-muted mt-1">
              Every project mutation is automatically written to MongoDB audit logs with timestamps and user details.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-erp-border">
            <HardHat className="w-6 h-6 text-amber-400 mb-3" />
            <h3 className="font-semibold text-sm text-erp-text">Engineering Standards</h3>
            <p className="text-xs text-erp-text-muted mt-1">
              Designed for CPWD specifications, IS codes, and standard Indian construction methodology.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="glass-panel rounded-xl p-6 border border-erp-border space-y-5">
          <h2 className="text-lg font-bold text-erp-text">Frequently Asked Questions</h2>
          <div className="divide-y divide-erp-border/80">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                <h4 className="text-sm font-semibold text-erp-text">{faq.q}</h4>
                <p className="text-xs text-erp-text-muted mt-1 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
