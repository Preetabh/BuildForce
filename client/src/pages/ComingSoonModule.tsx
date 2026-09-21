import React, { useState } from 'react';
import { useLocation, useOutletContext, useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  HardHat,
  LineChart,
  Receipt,
  BadgePercent,
  Boxes,
  Truck,
  Users,
  ShieldCheck,
  Calculator,
  ClipboardCheck,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  Layers,
  Wrench,
  Clock,
  ArrowLeft,
  CheckCircle2,
  BellRing,
  Check,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';

interface OutletContextType {
  setSidebarOpen: (open: boolean) => void;
}

interface FeatureConfig {
  title: string;
  category: string;
  icon: React.ElementType;
  description: string;
  phase: string;
  keyMetrics: Array<{ label: string; value: string; change?: string }>;
  features: string[];
  workflowSteps: string[];
}

export const ComingSoonModule: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext<OutletContextType>();
  const [subscribed, setSubscribed] = useState(false);

  const moduleConfigs: Record<string, FeatureConfig> = {
    // PLANNING
    '/planning': {
      title: 'Planning & Scheduling Master',
      category: 'PLANNING',
      icon: CalendarRange,
      description: 'Comprehensive construction work breakdown structure (WBS), Gantt chart scheduling, and CPM milestones.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Planned Tasks', value: '142 Activities' },
        { label: 'Critical Path', value: '18 Milestones' },
        { label: 'Schedule Variance', value: '+3.2 Days' },
      ],
      features: [
        'Interactive Gantt charts with drag-and-drop task dependencies',
        'Critical Path Method (CPM) and float time calculations',
        'Work Breakdown Structure (WBS) up to Level 5 hierarchy',
        'Resource-constrained leveling across multiple site sectors',
        'Baseline vs Actual milestone tracking with auto-alerts',
      ],
      workflowSteps: ['Scope Definition', 'WBS Breakdown', 'Dependency Linkage', 'Resource Leveling', 'Baseline Approval'],
    },
    '/planning/quantity-master': {
      title: 'Quantity Master & Take-Off',
      category: 'PLANNING',
      icon: Calculator,
      description: 'Automated CAD/BIM drawing quantity take-off, standard thumb rules, and structural steel reinforcement BBS generator.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Auto Take-off', value: '99.4% Accuracy' },
        { label: 'Standard Formulas', value: '350+ Rules' },
        { label: 'BBS Generator', value: 'IS:2502 Compliant' },
      ],
      features: [
        'Automated Bar Bending Schedule (BBS) for Footings, Columns, Beams & Slabs',
        'Thumb-rule estimation for preliminary project feasibility',
        'Structural steel weight calculator per meter based on IS standards',
        'Brickwork and Mortar dry volume conversion coefficients',
        'Integration with Measurement Book deduction rules (IS:1200)',
      ],
      workflowSteps: ['Drawing Import', 'Dimension Extraction', 'IS:1200 Deductions', 'BBS Calculation', 'BOQ Sync'],
    },
    '/planning/qc-master': {
      title: 'QC Master & Inspection Standards',
      category: 'PLANNING',
      icon: ClipboardCheck,
      description: 'Pre-configured CPWD, MoRTH, and IS code standard inspection checklists for every civil work stage.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'QC Checklists', value: '120+ Standards' },
        { label: 'IS/CPWD Specs', value: 'Fully Mapped' },
        { label: 'Tolerance Checks', value: 'Automated' },
      ],
      features: [
        'Slump test, cube test, and core-cutting compliance benchmarks',
        'Shuttering alignment and reinforcement cover block tolerance checks',
        'Brickwork plumb, mortar ratio, and curing duration verification',
        'Pass/Fail thresholds mapped directly to contract specification clauses',
        'Digital sign-off workflows for Site In-Charge and Quality Auditor',
      ],
      workflowSteps: ['Select Work Stage', 'Load IS Checklist', 'Conduct Site Check', 'Record Test Values', 'Issue Clearance'],
    },

    // EXECUTION
    '/execution': {
      title: 'Site Execution & Supervision',
      category: 'EXECUTION',
      icon: HardHat,
      description: 'Real-time site management suite for daily work execution, hindrances, and subcontractor task assignment.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Active Sites', value: '12 Zones' },
        { label: 'Today Progress', value: '88% Target' },
        { label: 'Open Hindrances', value: '2 Pending' },
      ],
      features: [
        'Site supervisor mobile-first execution dashboard',
        'Shift-wise target allocation and labor crew distribution',
        'Weather delays and site hindrance logging with geo-stamped photos',
        'Subcontractor daily task authorization and safety briefings',
        'Live synchronization with Project Workspace and Measurement Book',
      ],
      workflowSteps: ['Shift Handover', 'Crew Allocation', 'Execution Tracking', 'Quality Inspection', 'Daily Sign-off'],
    },
    '/execution/measurement-book': {
      title: 'Measurement Book (e-MB)',
      category: 'EXECUTION',
      icon: Layers,
      description: 'Government standard digital Measurement Book with auto-abstracting and multi-level engineer sign-offs.',
      phase: 'Phase 2.0 (Active Workspace Integration)',
      keyMetrics: [
        { label: 'CPWD Standards', value: 'IS:1200 Code' },
        { label: 'Approval Tiers', value: 'JE → AE → EE' },
        { label: 'Export Formats', value: 'PDF & Excel' },
      ],
      features: [
        'Hierarchical measurement recording (Main Item → Sub-items → Dimensions)',
        'Built-in deduction rules for openings in masonry, plastering, and RCC',
        'Digital signature and audit trail for Junior Engineer & Executive Engineer',
        'Direct synchronization into BOQ, Abstract, and RA Bill line items',
        'Real-time rate extraction from dynamic CPWD / State SOR rate masters',
      ],
      workflowSteps: ['Site Dimension Take-Off', 'Deduction Application', 'Engineer Verification', 'Abstract Generation', 'Billing Approval'],
    },
    '/execution/dpr': {
      title: 'Daily Progress Report (DPR)',
      category: 'EXECUTION',
      icon: FileSpreadsheet,
      description: 'Automated 1-click DPR generation summarizing daily manpower, machinery, material consumption, and physical output.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Automated DPR', value: '1-Click PDF' },
        { label: 'Photo Geo-tag', value: 'Included' },
        { label: 'Client Auto-email', value: 'Supported' },
      ],
      features: [
        'Auto-compilation of daily measurement book entries into progress percentages',
        'Manpower deployment breakdown (Skilled, Semi-skilled, Unskilled)',
        'Machinery operating hours, idle hours, and diesel consumption logging',
        'Site site photos with GPS timestamp and weather watermarks',
        'Export to standardized executive PDF report for client stakeholders',
      ],
      workflowSteps: ['Daily Log Entry', 'Auto-aggregate Consumption', 'Attach Site Photos', 'Generate PDF Report', 'Client Distribution'],
    },
    '/execution/inspections': {
      title: 'Site Inspection & Defect Tracker',
      category: 'EXECUTION',
      icon: ClipboardCheck,
      description: 'Digital punch lists, Non-Conformance Reports (NCR), and snagging workflows with photo annotations.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Snag Resolution', value: '48h SLA' },
        { label: 'Photo Annotations', value: 'Enabled' },
        { label: 'NCR Workflow', value: 'ISO 9001' },
      ],
      features: [
        'Mobile-friendly punch list creation with tap-to-pin blueprint snags',
        'Defect categorization: Minor, Major, Structural Hazard',
        'Non-Conformance Report (NCR) issuance with corrective action deadlines',
        'Before / After photo verification before closing snag items',
        'Contractor penalty linkage for recurring quality non-compliance',
      ],
      workflowSteps: ['Site Walkthrough', 'Pin Snag on Drawing', 'Assign Responsible Party', 'Rectification Work', 'Re-inspect & Close'],
    },
    '/execution/subcontractor-logs': {
      title: 'Subcontractor Task & Work Logs',
      category: 'EXECUTION',
      icon: Wrench,
      description: 'Piece-rate task tracking, subcontractor daily output verification, and back-to-back billing reconciliation.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Active Vendors', value: '24 Gangs' },
        { label: 'Rate Contracts', value: 'Itemized' },
        { label: 'Output Tracking', value: 'Daily SQM/CUM' },
      ],
      features: [
        'Contractor gang-wise daily output recording against work orders',
        'Piece-rate wage calculations (e.g. Brickwork per sq.ft, Steel tying per MT)',
        'Material issue vs theoretical consumption reconciliation to detect theft/waste',
        'Advance deduction and retention money tracking per payment cycle',
        'Subcontractor performance rating and on-time completion scorecards',
      ],
      workflowSteps: ['Work Order Allocation', 'Daily Output Measurement', 'Material Reconciliation', 'Wage Computation', 'Approval & Payment'],
    },

    // PROJECT CONTROL
    '/project-control': {
      title: 'Project Control & Cost Governance',
      category: 'PROJECT CONTROL',
      icon: LineChart,
      description: 'Executive project management dashboard with Earned Value Management (EVM) metrics, cost variances, and S-Curves.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Cost Index (CPI)', value: '1.04 (Under Budget)' },
        { label: 'Schedule Index (SPI)', value: '0.98 (On Track)' },
        { label: 'Estimate at Comp.', value: '₹4.82 Cr' },
      ],
      features: [
        'Earned Value Analysis: Planned Value (PV), Earned Value (EV), Actual Cost (AC)',
        'Cost Variance (CV) and Schedule Variance (SV) dynamic analytics',
        'Forecast Estimate at Completion (EAC) and Estimate to Complete (ETC)',
        'Interactive S-Curve financial curves with baseline overlays',
        'Executive project health RAG (Red/Amber/Green) matrix',
      ],
      workflowSteps: ['Baseline Budget Freeze', 'Actual Cost Aggregation', 'EVM Computation', 'Variance Investigation', 'Corrective Steering'],
    },
    '/project-control/evm': {
      title: 'Earned Value Management (EVM)',
      category: 'PROJECT CONTROL',
      icon: TrendingUp,
      description: 'Deep mathematical cost/schedule performance analysis complying with PMI and AACE International standards.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'CPI Metric', value: '1.04' },
        { label: 'SPI Metric', value: '0.98' },
        { label: 'TCPI', value: '1.01 Target' },
      ],
      features: [
        'Calculation of Cost Performance Index (CPI) and Schedule Performance Index (SPI)',
        'To-Complete Performance Index (TCPI) target optimization',
        'Variance at Completion (VAC) forecasting and risk alerts',
        'Drilldown from project-level EVM to individual WBS work packages',
        'Automated monthly cost audit report generation for board meetings',
      ],
      workflowSteps: ['Data Gathering', 'Metric Calculation', 'Curve Modeling', 'Risk Assessment', 'Executive Export'],
    },
    '/project-control/budget': {
      title: 'Budget & Variance Analysis',
      category: 'PROJECT CONTROL',
      icon: LineChart,
      description: 'Zero-based budgeting, contingency reserves, and head-wise cost overrun monitoring.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Total Budget', value: '₹5.20 Cr' },
        { label: 'Committed Cost', value: '₹3.40 Cr' },
        { label: 'Contingency Left', value: '₹18.5 Lakhs' },
      ],
      features: [
        'Itemized baseline budgeting for Materials, Labor, Plant, and Overheads',
        'Committed cost tracking via pending Purchase Orders and Subcontract Work Orders',
        'Over-budget warnings triggered prior to Purchase Order approvals',
        'Contingency reserve drawdown logs and change management tracking',
        'Multi-currency and price escalation index adjustments',
      ],
      workflowSteps: ['Budget Formulation', 'Commitment Locking', 'Actual Expense Incurrence', 'Variance Threshold Alerts', 'Management Rebalancing'],
    },
    '/project-control/cashflow': {
      title: 'S-Curve & Cash Flow Forecasting',
      category: 'PROJECT CONTROL',
      icon: Sparkles,
      description: 'Predictive cash in-flow vs out-flow modeling, milestone payments, and working capital optimization.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Peak Fund Need', value: 'Month 6 (₹85L)' },
        { label: 'Billing Inflow', value: '₹45L / Month' },
        { label: 'Working Capital', value: 'Healthy' },
      ],
      features: [
        'Monthly cash outflow curves mapped directly to Gantt schedule activities',
        'Client milestone billing inflow projections with retention lag modeling',
        'Working capital requirement peaks and deficit warning triggers',
        'Dynamic what-if scenario simulations for site delays or scope additions',
        'Bank overdraft and mobilization advance repayment schedule planner',
      ],
      workflowSteps: ['Schedule Activity Link', 'Cost Cash-Out Curve', 'Milestone In-flow Map', 'Deficit Optimization', 'Treasury Plan'],
    },

    // BILLING
    '/billing': {
      title: 'Client & Subcontractor Billing Hub',
      category: 'BILLING',
      icon: Receipt,
      description: 'Government standard Running Account (RA) bills, abstract generation, tax invoices, and price escalation claims.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Unbilled Work', value: '₹28.40 Lakhs' },
        { label: 'Certified Bills', value: 'RA Bill #04' },
        { label: 'GST Invoices', value: '18% GST Compliant' },
      ],
      features: [
        'Automatic compilation of Measurement Book entries into First & Final or RA Bills',
        'Standard CPWD / PWD deduction schedules: Retention Money, Mobilization, TDS, Cess',
        'Secured Advance on non-perishable materials brought to site (Form 26A)',
        'Subcontractor back-to-back billing with measurement validation',
        'Automated GST e-Invoice generation and payment certificate PDF exports',
      ],
      workflowSteps: ['Measurement Extraction', 'Abstract Generation', 'Deduction Schedule', 'Certification Signatures', 'Invoice Issuance'],
    },
    '/billing/ra-bills': {
      title: 'Client Running Account (RA) Billing',
      category: 'BILLING',
      icon: Receipt,
      description: 'Complete CPWD / PWD Form 26 / 27 RA Bill engine with cumulative previous vs current quantity calculations.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Current Bill', value: 'RA Bill #05' },
        { label: 'Cumulative Gross', value: '₹1.84 Cr' },
        { label: 'Net Payable', value: '₹34.80 Lakhs' },
      ],
      features: [
        'Automatic previous bill quantity deductions to prevent double billing',
        'Clause 10CA / 10CC price index escalation automated claims',
        'Retention money release milestones and bank guarantee tracking',
        'Mobilization advance recovery amortized across certified bill values',
        'Print-ready government format PDF export with executive signature sheets',
      ],
      workflowSteps: ['Import e-MB Measurements', 'Compute Cumulative Totals', 'Apply Statutory Deductions', 'Client Verification', 'Payment Collection'],
    },
    '/billing/subcontractor-bills': {
      title: 'Subcontractor Invoices & Certification',
      category: 'BILLING',
      icon: FileSpreadsheet,
      description: 'Subcontractor rate-contract billing, labor cess deductions, and verified site dimension certification.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Pending Bills', value: '4 Invoices' },
        { label: 'Certified Total', value: '₹14.2 Lakhs' },
        { label: 'Hold Retention', value: '5% Standard' },
      ],
      features: [
        'Validation of subcontractor claimed quantities against site supervisor DPRs',
        'Material recovery deductions for cement, steel, or diesel over-consumption',
        'TDS (194C) and Labor Welfare Cess (1%) automated deductions',
        'Direct bank NEFT/RTGS payment advice batch generation',
        'Subcontractor ledger statement with debit/credit balance breakdown',
      ],
      workflowSteps: ['Subcontractor Invoice Entry', 'Quantity Audit vs e-MB', 'Material Recovery Check', 'TDS Deduction', 'Payment Release'],
    },
    '/billing/escalation': {
      title: 'Price Escalation & GST Engine',
      category: 'BILLING',
      icon: Calculator,
      description: 'Government Clause 10CA, 10CC, and RBI wholesale price index (WPI) escalation formula calculator.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Index Linkage', value: 'RBI & Labour Bureau' },
        { label: 'Clause 10CA', value: 'Cement & Steel' },
        { label: 'Escalation Claim', value: '₹6.85 Lakhs' },
      ],
      features: [
        'Dynamic integration with RBI monthly Wholesale Price Index (WPI) tables',
        'CPWD Clause 10CA cement, steel, POL, and bitumen escalation calculators',
        'Clause 10CC labor minimum wage and general material indexation',
        'Detailed statutory proof sheets for submission to government departments',
        'GST input tax credit (ITC) reconciliation with supplier GSTR-2B',
      ],
      workflowSteps: ['Fetch Monthly RBI Indices', 'Base vs Current Period Delta', 'Calculate Component Escalation', 'Generate Audit Annexure', 'Bill Attachment'],
    },

    // SALES
    '/sales': {
      title: 'Sales, Tendering & Bid Management',
      category: 'SALES & TENDERING',
      icon: BadgePercent,
      description: 'End-to-end tender lifecycle: discovery, pre-qualification criteria, rate estimation, EMD tracking, and proposal generation.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Active Tenders', value: '6 Opportunities' },
        { label: 'Bid Pipeline', value: '₹18.40 Cr' },
        { label: 'Win Rate', value: '34% Historical' },
      ],
      features: [
        'GeM, CPP Portal, and State e-Procurement tender tracking',
        'Technical & Financial bid document preparation with dynamic BOQ pricing',
        'Pre-Qualification (PQ) matrix scoring and similar work experience matching',
        'Earnest Money Deposit (EMD) and Tender Fee bank guarantee lifecycle',
        'Client proposal generation with interactive cost breakdowns',
      ],
      workflowSteps: ['Tender Discovery', 'Feasibility & PQ Check', 'Rate Estimation & Margin', 'Management Bid Review', 'Proposal Submission'],
    },
    '/sales/tenders': {
      title: 'Tender Discovery & Estimation',
      category: 'SALES & TENDERING',
      icon: BadgePercent,
      description: 'Strategic tender pricing, contractor profit margin simulation, and competition analysis.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Target Margin', value: '14.5%' },
        { label: 'SOR Comparison', value: '+8.2% vs DSR' },
        { label: 'EMD Under Track', value: '₹12.5 Lakhs' },
      ],
      features: [
        'Direct rate master clause matching for rapid tender BOQ estimation',
        'Material cost sensitivity modeling (Steel price volatility impact)',
        'Equipment ownership vs hire rate analysis for bid pricing',
        'Competitor historical bid intelligence and L1 pricing trends',
        'Tender checklist to prevent technical rejection on technical bids',
      ],
      workflowSteps: ['Tender Document Intake', 'Clause Mapping to SOR', 'Cost Modeling', 'Risk Margin Surcharge', 'Final Bid Freeze'],
    },
    '/sales/bids': {
      title: 'Client Quotations & Commercial Bids',
      category: 'SALES & TENDERING',
      icon: FileSpreadsheet,
      description: 'Branded client estimation proposals, payment terms, and interactive client quotation builder.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Open Quotes', value: '8 Proposals' },
        { label: 'Avg Turnaround', value: '24 Hours' },
        { label: 'Closing Ratio', value: '42%' },
      ],
      features: [
        'Instant conversion of Project Workspace BOQ into client quotation PDF',
        'Customizable milestone payment schedules (e.g. Plinth, Slab, Finishing)',
        'Exclusions, inclusions, and standard contractual clauses boilerplate',
        'Digital client approval link with real-time view tracking',
        '1-click conversion from approved quotation to active ERP project',
      ],
      workflowSteps: ['Create Client Proposal', 'Add BOQ & Milestone Terms', 'Apply Corporate Branding', 'Send Digital Link', 'Client e-Signature'],
    },
    '/sales/work-orders': {
      title: 'Work Orders & Client Contracts',
      category: 'SALES & TENDERING',
      icon: ClipboardCheck,
      description: 'Formal contract execution, scope of work definitions, penalty clauses, and milestone deliverables.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Active Contracts', value: '14 Work Orders' },
        { label: 'Contract Value', value: '₹12.8 Cr' },
        { label: 'Penalty Clauses', value: 'Liquidated Damages' },
      ],
      features: [
        'Standardized construction contract templates (FIDIC, CPWD, Custom)',
        'Defect Liability Period (DLP) and Performance Guarantee logging',
        'Scope change management and variation order (VO) logs',
        'Client communication repository and formal delay notification letters',
        'Milestone sign-off certificates with digital seal',
      ],
      workflowSteps: ['Draft Work Order', 'Legal & Scope Review', 'Client Signature', 'Activate Project Milestones', 'Contract Archive'],
    },

    // MATERIALS
    '/materials': {
      title: 'Materials Management & Store Control',
      category: 'MATERIALS & INVENTORY',
      icon: Boxes,
      description: 'Central store and site inventory, purchase orders, material requisition notes (MRN), and Goods Receipt Notes (GRN).',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Stock Valuation', value: '₹42.80 Lakhs' },
        { label: 'Open Requisitions', value: '8 Pending MRNs' },
        { label: 'Low Stock Alerts', value: 'Cement (240 Bags)' },
      ],
      features: [
        'Real-time site inventory balances (Cement, Rebar, Sand, Bricks, Tiles)',
        'Material Requisition Note (MRN) workflow from site engineer to procurement team',
        'Purchase Order (PO) creation with three-way matching (PO vs GRN vs Vendor Invoice)',
        'Digital Goods Receipt Note (GRN) with vehicle weighbridge slips and test certificates',
        'BOM theoretical vs actual consumption reconciliation to eliminate pilferage',
      ],
      workflowSteps: ['Site MRN Request', 'Procurement Review & PO', 'Store GRN Inward', 'Quality Test Slips', 'Site Issue & Consumption'],
    },
    '/materials/inventory': {
      title: 'Stock & Central Store Ledger',
      category: 'MATERIALS & INVENTORY',
      icon: Boxes,
      description: 'Multi-location store management, bin cards, re-order levels, and stock transfer notes (STN).',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'SKU Items', value: '450+ Materials' },
        { label: 'Store Locations', value: '4 Site Stores' },
        { label: 'Safety Stock', value: 'Automated Alerts' },
      ],
      features: [
        'FIFO / Weighted Average material stock valuation methods',
        'Digital bin cards with batch numbers and manufacturing dates',
        'Inter-site material transfer notes (STN) with in-transit tracking',
        'Minimum threshold and lead-time safety stock notifications',
        'Physical store stock audit and reconciliation logs',
      ],
      workflowSteps: ['Store Categorization', 'Barcode / QR Tagging', 'Inward Stock Ledger', 'Outward Store Issue', 'Periodic Stock Audit'],
    },
    '/materials/purchase-orders': {
      title: 'Purchase Orders & Vendor Quotations',
      category: 'MATERIALS & INVENTORY',
      icon: FileSpreadsheet,
      description: 'Vendor comparison statements, purchase order approvals, and delivery schedule tracking.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Active POs', value: '18 Orders' },
        { label: 'Committed Total', value: '₹68.4 Lakhs' },
        { label: 'On-time Delivery', value: '94%' },
      ],
      features: [
        'Comparative quotation matrix (L1, L2, L3 supplier evaluation)',
        'Multi-level approval hierarchy based on PO monetary thresholds',
        'Payment terms, freight, unloading, and GST rate configuration',
        'Partial delivery tracking with automated reminder triggers to vendors',
        'Export to branded PDF Purchase Order with digital company seal',
      ],
      workflowSteps: ['MRN Approval', 'Request for Quotation (RFQ)', 'Comparative Statement', 'PO Issuance', 'Vendor Confirmation'],
    },
    '/materials/mrn': {
      title: 'Material Requisitions (MRN)',
      category: 'MATERIALS & INVENTORY',
      icon: Layers,
      description: 'Site engineer material indent requests mapped to Bill of Materials (BOM) limits.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Daily Indents', value: '6 Requests' },
        { label: 'BOM Validation', value: 'Strict Check' },
        { label: 'Approval Speed', value: '< 2 Hours' },
      ],
      features: [
        'Indent creation by Site Engineer with required delivery date and location',
        'Automated validation against BOQ/BOM planned quantities to prevent excess orders',
        'Priority tagging: Normal, Urgent, Site Stoppage Hazard',
        'Project Manager mobile approval push notifications',
        'Store issue tracking against authorized MRN numbers',
      ],
      workflowSteps: ['Indent Creation', 'BOM Ceiling Verification', 'Manager Approval', 'Store Issue / PO Trigger', 'Delivery to Gang'],
    },
    '/materials/grn': {
      title: 'Goods Receipt Note (GRN) & QC Inward',
      category: 'MATERIALS & INVENTORY',
      icon: ClipboardCheck,
      description: 'Weighbridge slip verification, material inspection on delivery, and store inward ledgers.',
      phase: 'Phase 2.1 (Q4 2026)',
      keyMetrics: [
        { label: 'Inward Receipts', value: '12 Deliveries' },
        { label: 'Rejection Rate', value: '1.2% (Quality Fail)' },
        { label: '3-Way Match', value: 'Automated' },
      ],
      features: [
        'Verification of delivery challan against original Purchase Order items and rates',
        'Weighbridge gross/tare slip recording for sand, aggregate, and steel',
        'Material test certificate (MTC) upload for cement and steel rebars',
        'Damaged / substandard material rejection recording with supplier debit notes',
        'Instant stock update across central store ledger',
      ],
      workflowSteps: ['Vehicle Arrival', 'Challan Inspection', 'Weighbridge Verification', 'Quality Test Slips', 'GRN Generation'],
    },

    // MACHINERY
    '/machinery': {
      title: 'Plant, Equipment & Machinery',
      category: 'MACHINERY & ASSETS',
      icon: Truck,
      description: 'Comprehensive equipment tracker, daily log sheets, diesel consumption, and maintenance schedules.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Heavy Equipment', value: '16 Machines' },
        { label: 'Utilization Rate', value: '82%' },
        { label: 'Fuel Consumed', value: '420 Litres/Day' },
      ],
      features: [
        'Fleet tracking for Excavators, Transit Mixers, Cranes, DG Sets, and Compactors',
        'Owned vs Rented machinery rate calculations and breakdown tracking',
        'Daily machine log sheets: Engine Hours, Idle Hours, Work Executed',
        'Diesel issue vs operating hours fuel efficiency benchmarking (Ltr/Hour)',
        'Preventive maintenance, service reminders, and insurance renewal alerts',
      ],
      workflowSteps: ['Machine Deployment', 'Daily Log Sheet', 'Fuel Issue Tracking', 'Efficiency Analysis', 'Maintenance Service'],
    },
    '/machinery/equipment': {
      title: 'Plant & Equipment Fleet Tracker',
      category: 'MACHINERY & ASSETS',
      icon: Truck,
      description: 'Asset register, fitness certificates, operator assignments, and mobilization logistics.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Fleet Assets', value: '28 Units' },
        { label: 'Operating Cost', value: '₹1,250/hr Avg' },
        { label: 'Fitness Status', value: '100% Valid' },
      ],
      features: [
        'Machine asset registry with purchase date, depreciation, and salvage value',
        'Hire contract tracking with monthly minimum rental commitment terms',
        'Operator and helper wage allocation per machine shift',
        'Inter-site equipment mobilization and demobilization planning',
        'Breakdown history and downtime penalty calculation for hired plant',
      ],
      workflowSteps: ['Asset Registry', 'Operator Assignment', 'Deployment to Zone', 'Downtime Tracking', 'Monthly Cost Audit'],
    },
    '/machinery/fuel-log': {
      title: 'Fuel & Daily Log Sheets',
      category: 'MACHINERY & ASSETS',
      icon: FileSpreadsheet,
      description: 'Diesel tank bowser issues, hour meter reading, and fuel theft detection.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Diesel Stock', value: '4,200 Litres' },
        { label: 'Avg Consumption', value: '14.2 L/hr (JCB)' },
        { label: 'Abnormal Fuel Alerts', value: 'Zero Detected' },
      ],
      features: [
        'Daily start and end Hour Meter (HMR) and Odometer readings',
        'Diesel issuance logs with bowser meter readings and operator signatures',
        'Machine-specific standard fuel consumption benchmark comparison',
        'Automatic variance flags for excessive fuel consumption or idle run',
        'Direct link to Project Workspace machinery cost ledger',
      ],
      workflowSteps: ['Meter Reading Take', 'Fuel Dispense Entry', 'Efficiency Benchmark Check', 'Variance Detection', 'Project Cost Post'],
    },
    '/machinery/maintenance': {
      title: 'Maintenance Schedule & Breakdowns',
      category: 'MACHINERY & ASSETS',
      icon: Wrench,
      description: 'Service hour milestones, spare parts inventory, and breakdown repair work orders.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Due for Service', value: '2 Machines' },
        { label: 'Mean Time to Repair', value: '4.5 Hours' },
        { label: 'Spare Parts Stock', value: 'Healthy' },
      ],
      features: [
        '250h, 500h, and 1000h service milestone automated countdown triggers',
        'Spare parts requisition (Filters, Engine Oil, Hydraulic Hoses)',
        'Breakdown incident reporting with emergency technician dispatch',
        'Maintenance cost history per equipment to calculate replacement viability',
        'Statutory third-party safety inspection certificates (Cranes & Slings)',
      ],
      workflowSteps: ['Service Hour Trigger', 'Spare Parts Issue', 'Mechanic Work Order', 'Quality Inspection', 'Return to Service'],
    },

    // MANPOWER
    '/manpower': {
      title: 'Manpower & Labor Management',
      category: 'MANPOWER & HR',
      icon: Users,
      description: 'Muster roll, daily labor attendance, gang-wise productivity, wage disbursement, and statutory compliance.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Labor on Site', value: '184 Workers' },
        { label: 'Attendance Rate', value: '96%' },
        { label: 'Weekly Wage Bill', value: '₹4.60 Lakhs' },
      ],
      features: [
        'Daily labor muster roll for Mason, Carpenter, Fitter, Helper, and Painter',
        'Biometric / Face Recognition integration for site entry gates',
        'Gang leader (Mukadam) piece-rate vs daily-wage calculations',
        'Productivity measurement (e.g. CUM of concrete poured per mason-hour)',
        'Weekly wage sheet generation with cash / bank transfer payout lists',
      ],
      workflowSteps: ['Morning Muster Check', 'Trade Allocation', 'Productivity Logging', 'Overtime Computation', 'Wage Disbursement'],
    },
    '/manpower/attendance': {
      title: 'Muster Roll & Attendance Tracking',
      category: 'MANPOWER & HR',
      icon: Users,
      description: 'Digital muster roll, shift management, overtime recording, and labor identification cards.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Skilled Trades', value: '64 Workers' },
        { label: 'Unskilled Helpers', value: '120 Workers' },
        { label: 'Overtime Hours', value: '42 Hours' },
      ],
      features: [
        'Trade-wise worker enrollment with Aadhaar and emergency contact details',
        'Morning & evening shift muster marking with geo-fencing verification',
        'Half-day, full-day, and overtime (OT) automated calculation',
        'Labor contractor headcount verification against gate passes',
        'Compliance tracking for Minimum Wages Act and BOCW cess',
      ],
      workflowSteps: ['Worker Enrollment', 'Gate Attendance Scan', 'Shift Allocation', 'Overtime Approval', 'Muster Roll Lock'],
    },
    '/manpower/productivity': {
      title: 'Labor Productivity & Wage Analysis',
      category: 'MANPOWER & HR',
      icon: TrendingUp,
      description: 'Work study productivity analysis against CPWD DAR labor constants and output benchmarks.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Productivity Index', value: '102% of Norm' },
        { label: 'Labor Cost / SQM', value: '₹48.50' },
        { label: 'Overtime Cost', value: 'Within Budget' },
      ],
      features: [
        'Comparison of site labor output with CPWD Delhi Analysis of Rates (DAR) norms',
        'Identification of low-productivity gangs and bottlenecks',
        'Incentive and bonus calculation for ahead-of-schedule milestone completion',
        'Cost impact analysis of labor turnover and absenteeism',
        'Direct synchronization into Project Workspace Manpower cost reports',
      ],
      workflowSteps: ['Log Output per Gang', 'Compare with DAR Norms', 'Compute Efficiency %', 'Wage Slip Generation', 'Export Analytics'],
    },

    // HSE
    '/hse': {
      title: 'Quality Assurance & HSE Safety',
      category: 'QUALITY & SAFETY',
      icon: ShieldCheck,
      description: 'Health, Safety & Environment (HSE) audits, incident logs, tool-box talks (TBT), and ISO quality documentation.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Safe Man-Hours', value: '142,500 Hours' },
        { label: 'TBT Conducted', value: 'Daily 100%' },
        { label: 'Safety Index', value: 'Zero LTI' },
      ],
      features: [
        'Daily Tool Box Talk (TBT) topics and worker attendance sign-off',
        'Personal Protective Equipment (PPE) compliance inspection checklists',
        'Near-miss and incident reporting with root-cause analysis (RCA)',
        'Scaffolding fitness, excavation shoring, and electrical safety audits',
        'Environmental compliance: dust suppression, noise logs, waste management',
      ],
      workflowSteps: ['Morning TBT', 'Site PPE Audit', 'Work Permit Clearance', 'Incident Logging', 'Monthly HSE Report'],
    },
    '/hse/qc': {
      title: 'Quality Control & Non-Conformance (NCR)',
      category: 'QUALITY & SAFETY',
      icon: ShieldCheck,
      description: 'Concrete cube test registers, soil compaction reports, and formal Non-Conformance Records.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Cube Tests Done', value: '48 Sets (7 & 28 Days)' },
        { label: 'Compaction Test', value: '98.5% Proctor' },
        { label: 'Open NCRs', value: '1 Under Rectification' },
      ],
      features: [
        '7-day and 28-day concrete compressive strength testing registers',
        'Proctor density and core-cutter dry density compaction logs',
        'Formal NCR workflow with root cause analysis and preventive actions',
        'Material test certificate (MTC) repository for Third-Party Quality Audits',
        'Client quality sign-off dossiers for stage completion milestones',
      ],
      workflowSteps: ['Sample Casting on Site', 'Lab Testing at 7/28 Days', 'Result Entry vs IS Benchmark', 'NCR Issuance if Failed', 'Quality Certificate'],
    },
    '/hse/safety': {
      title: 'Safety Audits & Incident Registers',
      category: 'QUALITY & SAFETY',
      icon: ClipboardCheck,
      description: 'Permit to Work (PTW) for Height, Hot Work, and Confined Space, plus incident investigation registers.',
      phase: 'Phase 2.2 (Q1 2027)',
      keyMetrics: [
        { label: 'Active PTW Permits', value: '3 Confined / Height' },
        { label: 'Lost Time Injury (LTI)', value: '0 Days' },
        { label: 'First Aid Cases', value: '2 Resolved' },
      ],
      features: [
        'Permit to Work (PTW) issuance for Height Work (>2m), Hot Work, and Excavation',
        'Scaffolding green-tag / red-tag inspection certification',
        'First-aid register and emergency response drill tracking',
        'Fire extinguisher and electrical distribution board (DB) safety checks',
        'Regulatory safety compliance dashboard for government labor inspections',
      ],
      workflowSteps: ['PTW Application', 'Safety Officer Site Check', 'Permit Issuance', 'Work Execution Supervision', 'Permit Closure'],
    },
  };

  const current = moduleConfigs[location.pathname] || {
    title: 'Advanced Construction Module',
    category: 'COMING SOON',
    icon: Sparkles,
    description: 'This high-performance construction management feature is currently in design and integration.',
    phase: 'Phase 2 Planned Release',
    keyMetrics: [
      { label: 'Status', value: 'In Design' },
      { label: 'API Architecture', value: 'Ready' },
      { label: 'DB Schema', value: 'Prepared' },
    ],
    features: [
      'Seamless multi-tenant enterprise data isolation',
      'Direct synchronization with Project Workspace and Measurement Book',
      'Exportable to government and private format PDF/Excel reports',
      'Real-time rate extraction and automated cost calculations',
    ],
    workflowSteps: ['Scope Definition', 'API Integration', 'UI Refinement', 'Security Audit', 'Live Release'],
  };

  const IconComponent = current.icon;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      <Header
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: current.category }, { label: current.title }]}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-200">
        {/* Hero Banner Card */}
        <div className="relative rounded-2xl p-6 sm:p-10 bg-gradient-to-br from-[#121829] via-[#0E1424] to-[#0A0D18] border border-slate-800 shadow-2xl overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] shrink-0">
                <IconComponent className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 uppercase tracking-wider">
                    {current.category}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{current.phase}</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {current.title}
                </h1>
                <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                  {current.description}
                </p>
              </div>
            </div>

            {/* Quick Action Notification Button */}
            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={() => setSubscribed(!subscribed)}
                className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg ${
                  subscribed
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                }`}
              >
                {subscribed ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Subscribed for Early Access</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4" />
                    <span>Notify Me On Release</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Key Metrics Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            {current.keyMetrics.map((km, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <p className="text-xs text-slate-400 font-medium">{km.label}</p>
                <p className="text-lg font-bold text-white mt-1">{km.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Specifications & Blueprint Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Included Capabilities */}
          <div className="lg:col-span-2 rounded-2xl p-6 bg-slate-900/60 border border-slate-800/80 space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-white tracking-wide">
                Engineered Capabilities & Industry Features
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {current.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0F1422] border border-slate-800 flex items-start gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-snug">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Workflow Pipeline */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800/80 space-y-5 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-purple-400" />
                <span>Execution Workflow</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Standardized 5-step engineering operational pipeline.
              </p>

              <div className="mt-5 space-y-3">
                {current.workflowSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Dashboard
              </Button>
              <span className="text-[11px] text-slate-500 font-mono">Civil Limitless ERP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
