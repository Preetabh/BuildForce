export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectType = 'Residential' | 'Commercial' | 'Infrastructure' | 'Industrial' | 'Institutional' | 'Other';
export type UserRole = string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  permissions?: Record<string, boolean>;
}

export interface Company {
  id: string;
  name: string;
  code: string;
}

export interface AuthState {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Project {
  _id: string;
  companyId: string;
  name: string;
  code: string;
  clientName?: string;
  location?: string;
  department?: string;
  preparedBy?: string;
  parentId?: string | {
    _id: string;
    name: string;
    code: string;
    projectType?: string;
    status?: string;
  } | null;
  subProjectsCount?: number;
  measurementUnit?: string;
  buildupArea?: number;
  defaultQcLevel?: string;
  description?: string;
  projectType: ProjectType | string;
  status: ProjectStatus;
  progress: number;
  estimatedValue: number;
  contractValue: number;
  currency: string;
  startDate?: string | null;
  endDate?: string | null;
  phases: number;
  isArchived: boolean;
  deletedAt?: string | null;
  deletedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  draftProjects: number;
  onHoldProjects: number;
  archivedProjects: number;
  totalProjectValue: number;
  currency: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore?: boolean;
}

/* ======================================================================
   Schedule of Rates (SOR) Types
   ====================================================================== */
export interface SorMaster {
  _id: string;
  authority: string;
  department?: string;
  scheduleType?: string;
  sorName: string;
  version: string;
  category?: string;
  country?: string;
  state?: string;
  owningBody?: string;
  year?: string;
  notes?: string;
  effectiveFrom: string;
  sourceDocument?: string;
  status: string;
  itemCount?: number;
}


export interface SorItem {
  _id: string;
  sorId: SorMaster | string;
  srNo?: number;
  itemCode: string;
  descriptionEnglish: string;
  descriptionHindi?: string;
  unit: string;
  rate: number;
  chapter?: string;
  subChapter?: string;
  workCategory?: string;
  measurementFormula?: string;
  applicableDimensions?: string[];
  formulaExpression?: string;
  rateAnalysisStatus?: 'AVAILABLE' | 'NOT_AVAILABLE' | 'CUSTOM';
  rateAnalysis?: {
    materials: RateAnalysisComponent[];
    labour: RateAnalysisComponent[];
    machinery: RateAnalysisComponent[];
    waterChargesPercent?: number;
    contractorProfitPercent?: number;
    analyzedRate?: number;
  } | null;
  pageNumber?: number;
  status: string;
}

export interface ScheduleHierarchyItem {
  _id: string;
  authority: string;
  department: string;
  scheduleType: string;
  sorName: string;
  version: string;
  category?: string;
  country?: string;
  state?: string;
  owningBody?: string;
  type?: string;
  effectiveFrom?: string;
  itemCount: number;
  rateAnalysisCount: number;
  rateAnalysisStatus: 'Available' | 'Partial' | 'Not Available';
  documentName?: string;
  volume?: string;
}

export type SorImportStatus =
  | 'Draft'
  | 'Uploading'
  | 'Uploaded'
  | 'Processing'
  | 'Review Required'
  | 'Approved'
  | 'Published'
  | 'Failed'
  | 'OCR_REQUIRED';

export interface BatchLog {
  batchNumber: number;
  startPage: number;
  endPage: number;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  error?: string;
  rowsCount: number;
  startedAt?: string;
  completedAt?: string;
}

export type StagedItemStatus = 'Extracted' | 'Review Required' | 'Approved' | 'Rejected';

export interface ExtractedRow {
  _id?: string;
  srNo?: number;
  itemCode: string;
  descriptionEnglish: string;
  descriptionHindi?: string;
  unit: string;
  rate: number;
  chapter?: string;
  subChapter?: string;
  workCategory?: string;
  pageNumber?: number;
  confidence: number;
  status: StagedItemStatus;
  reviewNotes?: string;
}

export interface SorStagedItem extends ExtractedRow {
  companyId: string;
  importId: string;
  batchNumber: number;
}

export interface SorConfig {
  maxFileSizeMB: number;
  maxFileSizeBytes: number;
  batchSize: number;
  allowedExtensions: string[];
}

export interface SorImportProgress {
  percent?: number;
  processingPercent?: number;
  rowsExtracted?: number;
  rowsRequiringReview?: number;
  rowsFailed?: number;
  pagesProcessed?: number;
  totalPages?: number;
  currentBatch?: number;
  totalBatches?: number;
}

export interface SorImport {
  _id: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'xlsx' | 'xls' | 'csv';
  authority: string;
  scheduleName: string;
  version: string;
  status: SorImportStatus;
  progress: any;
  currentPage: number;
  totalPages: number;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  isOcrRequired: boolean;
  ocrEngine?: string;
  importErrors: { message: string; code?: string; page?: number }[];
  batches: BatchLog[];
  sourceDocument?: string;
  rowsExtracted?: number;
  rowsRequiringReview?: number;
  rowsFailed?: number;
  pagesProcessed?: number;
  processingPercent?: number;
  currentBatch?: number;
  totalBatches?: number;
  createdAt: string;
  updatedAt: string;
}

/* ======================================================================
   BOQ Types
   ====================================================================== */
export interface Boq {
  _id: string;
  projectId: string;
  title: string;
  version: string;
  status: 'Draft' | 'Approved' | 'Archived';
  totalItems: number;
  totalQuantity: number;
  totalBoqValue: number;
  remarks?: string;
  approvedBy?: { name: string; email: string } | null;
  approvedAt?: string | null;
}

export interface BoqItem {
  _id: string;
  projectId: string;
  boqId: string;
  itemNumber: number;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  sorReference?: {
    sorId?: string;
    sorItemId?: string;
    scheduleName?: string;
    version?: string;
    snapshotRate?: number;
  };
  chapter?: string;
  subChapter?: string;
  remarks?: string;
  executedQuantity: number;
  balanceQuantity: number;
  progressPercent: number;
  previousQuantity?: number;
  currentQuantity?: number;
  cumulativeQuantity?: number;
  rateAnalysisStatus?: 'AVAILABLE' | 'NOT_AVAILABLE' | 'CUSTOM';
  rateAnalysisId?: string | null;
  isDerivedFromMeasurement?: boolean;
  sourceMeasurementIds?: string[];
  allowExcessQuantity: boolean;
}

export interface CalculationTrace {
  sorItemCode?: string;
  boqItemCode?: string;
  formulaText?: string;
  lastMeasurementId?: string;
}

export interface RateAnalysisComponent {
  resourceType: 'MATERIAL' | 'LABOUR' | 'MACHINERY';
  resourceCode?: string;
  name: string;
  unit: string;
  coefficient: number;
  unitRate: number;
  wastePercentage?: number;
  sourceRef?: string;
}

export interface RateAnalysisDetail {
  boqItemId: string;
  itemCode: string;
  description: string;
  unit: string;
  executedQuantity: number;
  rateAnalysisStatus: 'AVAILABLE' | 'NOT_AVAILABLE' | 'CUSTOM';
  analysis: {
    status: 'AVAILABLE' | 'NOT_AVAILABLE';
    source: 'SOR_DAR' | 'CUSTOM' | 'NONE';
    analysisId?: string;
    itemCode: string;
    unit: string;
    materials: RateAnalysisComponent[];
    labour: RateAnalysisComponent[];
    machinery: RateAnalysisComponent[];
  };
}

/* ======================================================================
   Measurement Types
   ====================================================================== */
export type MeasurementFormula =
  | 'LxWxH'
  | 'LxWxD'
  | 'LxW'
  | 'LxH'
  | 'NosxQty'
  | 'Count'
  | 'Weight'
  | 'Length'
  | 'Custom';

export interface MeasurementDimensions {
  nos?: number;
  length?: number;
  width?: number;
  breadth?: number;
  height?: number;
  depth?: number;
  heightDepth?: number;
  thickness?: number;
  weight?: number;
  unitWeight?: number;
  area?: number;
  volume?: number;
  quantity?: number;
}

export interface MeasurementEntry {
  _id?: string;
  description: string;
  location?: string;
  levelFloor?: string;
  nos: number;
  length: number;
  width: number;
  breadth?: number;
  heightDepth: number;
  height?: number;
  depth?: number;
  thickness?: number;
  weight?: number;
  unitWeight?: number;
  unit: string;
  formula: MeasurementFormula | string;
  formulaExpression?: string;
  calculatedQuantity: number;
  remarks?: string;
}

export interface MeasurementSummary {
  totalMeasurements: number;
  totalBoqAmount: number;
  totalMaterialCost: number;
  totalManpowerCost: number;
  totalMachineryCost: number;
  totalProjectCost: number;
}

export interface Measurement {
  _id: string;
  projectId: string;
  boqId: string;
  boqItemId: BoqItem;
  sorId?: SorMaster | string | null;
  sorItemId?: SorItem | string | null;
  scheduleName?: string;
  scheduleVersion?: string;
  sourceItemCode?: string;
  unitRate?: number;
  amount?: number;
  measurementDate: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Reversed';
  entries: MeasurementEntry[];
  totalQuantity: number;
  previousQuantity?: number;
  currentQuantity?: number;
  cumulativeQuantity?: number;
  isReversed?: boolean;
  reversedBy?: { name: string; email: string } | null;
  reversedAt?: string | null;
  reversalReason?: string;
  remarks?: string;
  approvedBy?: { name: string; email: string } | null;
  approvedAt?: string | null;
  createdAt: string;
}

/* ======================================================================
   Resources (BOM, Manpower, Machinery) Types
   ====================================================================== */
export interface BomItem {
  _id: string;
  projectId: string;
  boqItemId: BoqItem;
  materialName: string;
  unit: string;
  coefficient: number;
  boqQuantity: number;
  plannedQuantity?: number;
  executedQuantity?: number;
  balanceQuantity?: number;
  requiredQuantity: number;
  unitRate: number;
  amount: number;
  executedAmount?: number;
  source: 'RATE_ANALYSIS' | 'MANUAL';
  calculationTrace?: CalculationTrace;
  remarks?: string;
}

export interface ManpowerItem {
  _id: string;
  projectId: string;
  boqItemId: BoqItem;
  labourType: string;
  coefficient: number;
  boqQuantity: number;
  plannedManpower?: number;
  executedManpower?: number;
  balanceManpower?: number;
  requiredManpower: number;
  unitRate: number;
  amount: number;
  executedAmount?: number;
  source: 'RATE_ANALYSIS' | 'MANUAL';
  calculationTrace?: CalculationTrace;
  remarks?: string;
}

export interface MachineryItem {
  _id: string;
  projectId: string;
  boqItemId: BoqItem;
  machineryType: string;
  coefficient: number;
  boqQuantity: number;
  plannedHours?: number;
  executedHours?: number;
  balanceHours?: number;
  requiredHours: number;
  unitRate: number;
  amount: number;
  executedAmount?: number;
  source: 'RATE_ANALYSIS' | 'MANUAL';
  calculationTrace?: CalculationTrace;
  remarks?: string;
}

/* ======================================================================
   Billing & Cost Control Types
   ====================================================================== */
export interface BillItem {
  _id?: string;
  boqItemId: string;
  itemCode: string;
  description: string;
  unit: string;
  rate: number;
  boqQuantity: number;
  previouslyBilledQuantity: number;
  currentQuantity: number;
  cumulativeQuantity: number;
  balanceQuantity: number;
  currentAmount: number;
  cumulativeAmount: number;
  remarks?: string;
}

export interface RunningBill {
  _id: string;
  projectId: string;
  billNumber: string;
  billDate: string;
  periodFrom?: string | null;
  periodTo?: string | null;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Paid';
  totalPreviousAmount: number;
  totalCurrentAmount: number;
  totalCumulativeAmount: number;
  items: BillItem[];
  remarks?: string;
  submittedBy?: { name: string; email: string } | null;
  submittedAt?: string | null;
  approvedBy?: { name: string; email: string } | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface ProjectCostControl {
  contractValue: number;
  boqValue: number;
  executedValue: number;
  materialCost: number;
  manpowerCost: number;
  machineryCost: number;
  directCostTotal: number;
  billedTotal: number;
  remainingContractValue: number;
  remainingBoqValue: number;
  currency: string;
}

/* ======================================================================
   Quantity Master Catalog Types
   ====================================================================== */
export interface MasterMaterial {
  _id: string;
  companyId: string;
  code: string;
  name: string;
  category: string;
  subcategory?: string;
  unit: string;
  standardRate: number;
  effectiveRate?: number;
  hasOverride?: boolean;
  rateListId?: { _id: string; name: string; code: string } | string | null;
  rateVersion?: string;
  source?: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  specification?: string;
  notes?: string;
  supplier?: string;
  hsnCode?: string;
  taxPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MasterLabour {
  _id: string;
  companyId: string;
  code: string;
  name: string;
  category: string;
  skillType: 'Skilled' | 'Semi-Skilled' | 'Unskilled' | 'Supervisory' | 'Specialist';
  standardDailyRate: number;
  effectiveRate?: number;
  hasOverride?: boolean;
  unit: string;
  rateListId?: { _id: string; name: string; code: string } | string | null;
  rateVersion?: string;
  source?: string;
  effectiveDate?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterMachinery {
  _id: string;
  companyId: string;
  code: string;
  name: string;
  category: string;
  standardHourlyRate: number;
  effectiveRate?: number;
  hasOverride?: boolean;
  unit: string;
  rateType?: 'Hourly' | 'Daily' | 'Shift' | 'Trip';
  rateListId?: { _id: string; name: string; code: string } | string | null;
  rateVersion?: string;
  source?: string;
  effectiveDate?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormulaFactor {
  materialId?: string | null;
  labourId?: string | null;
  machineryId?: string | null;
  materialCode?: string;
  labourCode?: string;
  machineryCode?: string;
  name: string;
  unit: string;
  factor: number;
  wastePercent?: number;
}

export interface MasterFormula {
  _id: string;
  companyId: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  description?: string;
  referenceStandard?: string;
  materialFactors: FormulaFactor[];
  labourFactors: FormulaFactor[];
  machineryFactors: FormulaFactor[];
  isStandard: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RateOverrideItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  rate: number;
}

export interface MasterRateList {
  _id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  coverage?: {
    materials: string;
    labour: string;
    machinery: string;
  };
  materialRates: RateOverrideItem[];
  labourRates: RateOverrideItem[];
  machineryRates: RateOverrideItem[];
  createdAt: string;
  updatedAt: string;
}

/* ======================================================================
   Lead Management Types
   ====================================================================== */
export type LeadStage = 'Lead' | 'Meeting' | 'Site Visit' | 'Quotation' | 'Negotiation' | 'Client' | 'Dead';
export type LeadPriority = 'Normal' | 'High' | 'Urgent' | 'Low';
export type ReferenceType = 'Associate' | 'Social Media' | 'Employee' | 'Direct';

export interface FollowUpItem {
  _id?: string;
  date: string;
  remarks: string;
  status?: string;
  createdAt?: string;
  createdByName?: string;
}

export interface LeadItem {
  _id: string;
  companyId: string;
  leadCode: string;
  leadDate: string;
  clientName: string;
  targetCompanyCode: string; // 'LB' | 'LD' etc.
  targetCompanyName?: string;
  occupation?: string;
  businessName?: string;
  gender?: string;
  mobile1: string;
  mobile2?: string;
  email?: string;
  permanentAddress?: string;
  siteLocation: string;
  requirements: string[];
  serviceItems?: Array<{ service: string; specificItems?: string[] }>;
  propertyType: 'Resi.' | 'Comm.' | 'Residential' | 'Commercial' | string;
  propertyTypeDetail?: string;
  landArea?: string;
  buildupArea?: string;
  dimensional?: string;
  facing?: string;
  level?: string;
  requirementType?: string;
  projectDuration?: string;
  meetingDateTime?: string;
  finances?: {
    budget?: number;
    estimatedCost?: number;
  };
  sitePictures?: string[];
  referenceType: ReferenceType;
  referenceDetails?: {
    partnerId?: string;
    partnerName?: string;
    channel?: string;
    employeeName?: string;
    notes?: string;
  };
  stage: LeadStage;
  priority: LeadPriority;
  followUps?: FollowUpItem[];
  latestFollowUp?: {
    date?: string;
    remarks?: string;
  };
  isDead: boolean;
  deadReason?: string;
  deadAt?: string;
  isRegisteredClient?: boolean;
  convertedClientId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStats {
  totalActive: number;
  totalDead: number;
  totalClients: number;
  todayDueCount: number;
  totalAll: number;
}

export interface PartnerItem {
  _id: string;
  companyId: string;
  name: string;
  phone: string;
  email?: string;
  partnerType: string;
  interestLevel?: string;
  priority?: string;
  dueDate?: string;
  city?: string;
  lastRemark?: string;
  commissionRatePercent: number;
  totalLeadsReferred: number;
  totalConverted: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  status: 'ACTIVE' | 'INACTIVE' | 'Active' | 'Dead' | string;
  followUps?: Array<{
    _id?: string;
    date: string;
    remarks: string;
    status?: string;
    createdAt?: string;
    createdByName?: string;
  }>;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFollowUp {
  _id?: string;
  date: string;
  remarks: string;
  status?: string;
  createdAt?: string;
  createdByName?: string;
}

export interface ClientLedgerStage {
  _id?: string;
  stageName: string;
  percentage: number;
  amount: number;
  targetDate?: string;
  paid: number;
  due: number;
  status: 'Pending' | 'Paid' | 'Partial';
}

export interface ClientDprReport {
  _id?: string;
  reportDate: string;
  workCompletedToday: string;
  materialsUsed?: string;
  nextDayPlan?: string;
  siteKharcha?: {
    labourCost: number;
    materialCost: number;
  };
  sitePhotos?: string[];
  reportedBy?: string;
  createdAt?: string;
}

export interface ClientRecord {
  _id: string;
  companyId: string;
  leadId?: string;
  partnerId?: string;
  partnerName?: string;
  clientCode: string;
  name: string;
  businessName?: string;
  contactPerson?: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  siteLocation: string;
  companyName: string;
  projectType: string;
  propertyType?: string;
  propertySubtype?: string;
  buildupArea?: string;
  dimensional?: string;
  facing?: string;
  level?: string;
  requirementType?: string;
  projectDuration?: string;
  meetingDate?: string;
  gender?: string;
  priority?: string;
  referenceSource?: string;
  handlerName?: string;
  subBadge?: string;
  associate?: string;
  associateType?: string;
  area?: string;
  services?: string;
  servicesList?: Array<{ name: string; total: number; paid: number }>;
  agreedAmount: number;
  paidAmount: number;
  balanceAmount: number;
  registrationDate: string;
  projectEstimator?: {
    areaSqft: number;
    ratePerSqft: number;
    discountPerSqft: number;
    finalRate: number;
    totalAmount: number;
  };
  ledgerStages?: ClientLedgerStage[];
  dailyProgressReports?: ClientDprReport[];
  followUps?: ClientFollowUp[];
  latestFollowUp?: {
    date?: string;
    remarks?: string;
  };
  isDead?: boolean;
  deadReason?: string;
  deadAt?: string;
  status: 'Active' | 'Under Construction' | 'Handover' | 'Archived' | 'Dead';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentItem {
  _id: string;
  companyId: string;
  clientId?: string;
  leadId?: string;
  clientName: string;
  receiptNo: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'Cheque' | 'UPI' | 'NEFT/RTGS' | 'Bank Transfer' | string;
  modeBadge?: string; // 'Online' | 'Cash' | 'Cheque'
  serviceName?: string; // 'Interior Full Design', 'Construction Furnished'
  servicePlan?: string; // 'Construction'
  referenceType?: string; // 'UPI'
  transactionRef?: string;
  purpose?: string;
  commissionGenerated?: boolean;
  commissionId?: string;
  remarks?: string;
  notes?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionItem {
  _id: string;
  companyId: string;
  partnerId: any;
  partnerName: string;
  leadId?: string;
  leadCode?: string;
  clientId?: any;
  clientName: string;
  paymentId?: any;
  paymentAmount?: number;
  projectValue: number;
  commissionPercent: number;
  commissionAmount: number;
  paidAmount?: number;
  balanceAmount?: number;
  status: 'Pending' | 'Approved' | 'Paid';
  payoutId?: any;
  paymentDate?: string;
  paymentRef?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidBy?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerPayoutItem {
  _id: string;
  companyId: string;
  payoutNo: string;
  partnerId: any;
  partnerName: string;
  commissionId?: any;
  paymentId?: any;
  clientId?: any;
  clientName?: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'Cheque' | 'UPI' | 'NEFT/RTGS' | 'Bank Transfer' | string;
  transactionRef?: string;
  notes?: string;
  status: 'Paid' | 'Processing';
  paidBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDossier {
  client: ClientRecord;
  lead: LeadItem | null;
  payments: PaymentItem[];
  partner: PartnerItem | null;
  commissions: CommissionItem[];
  payouts: PartnerPayoutItem[];
}

export * from './rbac';



