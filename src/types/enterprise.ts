// Enterprise Configuration Types

export type UserRole = 
  | 'ADMIN'
  | 'FINANCE'
  | 'ACCOUNTANT'
  | 'APPROVER'
  | 'PURCHASING'
  | 'MANAGER'
  | 'VIEWER';

export interface OrgBranch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  managerName: string;
  managerEmail: string;
  isActive: boolean;
}

export interface CostCenter {
  id: string;
  companyId: string;
  code: string;
  name: string;
  department: string;
  budgetAnnual: number;
  spentToDate: number;
  managerEmail: string;
  isActive: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string; // מספר טלפון ליצירת קשר והתראות
  isApprover: boolean; // האם מוגדר כגורם מאשר מורשה (Check Box)
  role: UserRole;
  department: string;
  companyIds: string[];
  branchId?: string;
  isActive: boolean; // אפשרות להפוך את הגורם לפעיל או לא פעיל
  avatar?: string;
  approvalLimit: number; // max ILS amount they can approve without escalation
  lastLogin?: string;
  mfaEnabled: boolean;
}

export interface RolePermissionRule {
  role: UserRole;
  canViewDashboard: boolean;
  canViewInvoices: boolean;
  canEditInvoiceFields: boolean;
  canApproveInvoice: boolean;
  canRejectInvoice: boolean;
  canDeleteInvoice: boolean;
  canPostToErp: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  canViewAuditTrail: boolean;
  canExportData: boolean;
  fieldLevelRestrictions: {
    hideSupplierBankDetails?: boolean;
    hideUnitPrice?: boolean;
    readOnlyAccountingAccounts?: boolean;
  };
}

export type CustomFieldType = 'text' | 'number' | 'dropdown' | 'date' | 'boolean' | 'project_code' | 'department';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  key: string;
  type: CustomFieldType;
  options?: string[]; // for dropdown
  appliesTo: 'invoice' | 'supplier' | 'line_item' | 'import_dossier';
  required: boolean;
  defaultValue?: string | number | boolean;
  companyId?: string; // empty means all companies
  order: number;
  isActive: boolean;
}

export interface ApprovalStepRule {
  stepNumber: number;
  name: string;
  approverRole: UserRole;
  specificUserEmail?: string;
  minAmount: number;
  maxAmount?: number;
  requireThreeWayMatch: boolean;
  requireValidMath: boolean;
  departmentFilter?: string;
  requiresTwoSignatures?: boolean;
}

export interface WorkflowConfig {
  id: string;
  companyId: string;
  name: string;
  isActive: boolean;
  autoApproveIfMatched100: boolean;
  autoApproveMaxAmount: number; // e.g. up to 1000 ILS auto-approved if 100% matched
  steps: ApprovalStepRule[];
  slaHours: number; // default SLA for approval (e.g. 48 hours)
  escalationManagerEmail?: string;
}

export interface DelegationRule {
  id: string;
  fromUserEmail: string;
  toUserEmail: string;
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
}

export interface TaxVatRate {
  id: string;
  country: string;
  name: string; // e.g. "מע״מ תקני", "מע״מ 0%", "TVA Standard"
  ratePercent: number;
  isDefault: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  glAccountCode: string;
}

export interface CurrencyConfig {
  code: 'ILS' | 'EUR' | 'USD' | 'GBP';
  symbol: string;
  name: string;
  rateToILS: number; // Exchange rate to base currency
  lastUpdated: string;
  autoFetchBankOfIsrael: boolean;
}

export interface AiOcrEngineConfig {
  primaryEngine: 'Google_Gemini_Vision' | 'Azure_Document_Intelligence' | 'AWS_Textract';
  fallbackEngine: 'Google_Gemini_Vision' | 'Azure_Document_Intelligence' | 'AWS_Textract' | 'Tesseract_Local' | 'None';
  confidenceThresholdAutoPass: number; // e.g. 95%
  confidenceThresholdReviewRequired: number; // e.g. 80%
  enableHebrewHandwritingOcr: boolean;
  extractLineItemsLevel: 'full_deep' | 'headers_only' | 'balanced';
  monthlyBudgetCapUsd: number;
  spentCurrentMonthUsd: number;
}

export type EmailScanTimeRange = 'day' | 'week' | 'month' | '6_months' | 'year' | 'all';

export interface EmailScanResultItem {
  id: string;
  sender: string;
  senderName?: string;
  subject: string;
  receivedAt: string;
  fileName: string;
  fileSizeKb: number;
  status: 'queued' | 'processing' | 'imported' | 'skipped';
  invoiceNumber?: string;
  totalAmount?: number;
}

export interface InboundEmailBox {
  id: string;
  emailAddress: string;
  companyId: string;
  defaultDocumentType: string;
  assignedDepartment: string;
  status: 'active' | 'paused' | 'error';
  autoProcessAttachments: boolean;
  allowedSendersOnly: boolean;
  allowedDomains: string[];
  lastChecked?: string;
  unprocessedCount: number;

  // Connection & protocol settings
  protocol?: 'oauth_m365' | 'oauth_gmail' | 'imap_ssl' | 'exchange_ews';
  serverHost?: string;
  serverPort?: number;
  useSsl?: boolean;
  username?: string;
  password?: string;
  clientId?: string;
  tenantId?: string;
  folderToWatch?: string;
  archiveFolder?: string;
  scanFrequencyMinutes?: number;
  defaultScanRange?: EmailScanTimeRange;
  lastPingMs?: number;
  lastError?: string;
  lastScanSummary?: {
    scannedAt: string;
    range: EmailScanTimeRange;
    emailsCount: number;
    invoicesFound: number;
  };
}

export interface ApiKeyIntegration {
  id: string;
  name: string;
  service: 'Priority_OData' | 'SAP_B1_ServiceLayer' | 'NetSuite_REST' | 'Custom_Webhook' | 'Bank_Of_Israel_API' | 'Hashavshevet_API' | 'Rivhit_API';
  apiKeyMasked: string;
  apiKey?: string;
  endpointUrl: string;
  status: 'connected' | 'error' | 'testing' | 'disconnected';
  lastPingMs: number;
  rateLimitPerMinute: number;
  environment: 'production' | 'sandbox';
  companyId?: string;
  authType?: 'bearer' | 'basic' | 'apikey_header' | 'oauth2';
  username?: string;
  password?: string;
  timeoutSeconds?: number;
  lastSyncTimestamp?: string;
  lastError?: string;
}

export interface RetentionPolicy {
  taxLegalHoldYears: number; // e.g. 7 years in Israel, 10 years in France
  autoArchiveAfterDays: number;
  purgeSoftDeletedDays: number;
  isLegalHoldActive: boolean;
  legalHoldReason?: string;
  retentionNoticeHebrew: string;
}

export interface ScheduledBackgroundJob {
  id: string;
  name: string;
  cronSchedule: string; // e.g. '0 */2 * * *'
  description: string;
  lastRunStatus: 'success' | 'failed' | 'running';
  lastRunTimestamp: string;
  nextRunTimestamp: string;
  isEnabled: boolean;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  user: string;
  module: 'AUTH' | 'CONFIG' | 'WORKFLOW' | 'TAX' | 'ERP' | 'INTEGRATION' | 'CUSTOM_FIELDS';
  action: string;
  details: string;
  ipAddress?: string;
  severity: 'info' | 'warning' | 'critical';
}

export type ConfigScope = 'SYSTEM' | 'COMPANY' | 'BRANCH' | 'DEPARTMENT';

export interface CompanyContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  department: 'הנהלה' | 'כספים' | 'הנהלת חשבונות' | 'רכש' | 'IT' | 'יבוא' | 'לוגיסטיקה';
  isActive: boolean;
}

export interface CompanyBranding {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  documentLogoUrl: string;
  emailLogoUrl: string;
  loginLogoUrl: string;
  documentHeaderHtml: string;
  documentFooterHtml: string;
  emailSignatureText: string;
}

export interface CompanyDefaults {
  currency: 'ILS' | 'EUR' | 'USD' | 'GBP';
  language: 'he' | 'en' | 'fr';
  vatRatePercent: number;
  paymentTerms: string;
  defaultDepartment: string;
  defaultBranchId: string;
  defaultCostCenterId: string;
  defaultApproverEmail: string;
  defaultDocumentType: string;
  defaultWorkflowId: string;
  defaultSupplierId?: string;
  timezone: string;
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
}

export interface CompanyProfileSettings {
  id: string;
  name: string;
  tradeName: string;
  taxRegistrationNumber: string; // ח.פ
  vatNumber: string; // מספר עוסק מורשה / מע״מ
  street: string;
  streetNumber: string;
  city: string;
  postalCode: string;
  country: string;
  phonePrimary: string;
  phoneSecondary: string;
  emailPrimary: string;
  emailAccounting: string;
  emailPurchasing: string;
  emailImport: string;
  website: string;
  logoUrl: string;
  signatureUrl: string;
  defaultCurrency: 'ILS' | 'EUR' | 'USD' | 'GBP';
  language: 'he' | 'en' | 'fr';
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  numberFormat: '1,234.56' | '1.234,56' | '1 234,56';
  fiscalYearStart: string; // e.g. "01/01"
  erpType: 'Priority' | 'SAP' | 'NetSuite' | 'Generic_REST';
  erpCompanyCode: string;
  erpEndpointUrl: string;
  erpEnvironment: 'production' | 'test';
  
  branding: CompanyBranding;
  defaults: CompanyDefaults;
  contacts: CompanyContact[];
  acceptedDocumentTypes: string[];
  
  invoiceNumberingPattern: string; // e.g. "INV-{YYYY}-{NUM}"
  importNumberingPattern: string; // e.g. "IMP-{YYYY}-{NUM}"
  workflowNumberingPattern: string;
  
  // OCR & AI Overrides at company level
  ocrConfidenceOverride?: number;
  autoPassOverride?: number;
  aiModelOverride?: string;
  
  isActive: boolean;
}

export type OcrUsageMode = 'ECONOMY' | 'BALANCED' | 'ACCURACY' | 'CUSTOM';

export interface FieldConfidenceThresholds {
  supplier: number; // e.g. 95
  invoiceNumber: number; // e.g. 95
  date: number; // e.g. 92
  currency: number; // e.g. 98
  subtotal: number; // e.g. 95
  vat: number; // e.g. 95
  total: number; // e.g. 98
  sku: number; // e.g. 88
  quantity: number; // e.g. 90
  unitPrice: number; // e.g. 90
}

export interface ImagePreprocessingConfig {
  deskew: boolean;
  rotateAuto: boolean;
  cropBorders: boolean;
  noiseRemoval: boolean;
  contrastEnhance: boolean;
  sharpen: boolean;
  grayscaleConvert: boolean;
  resolutionEnhancement: boolean;
  blankPageDetection: boolean;
  mode: 'AUTO' | 'MANUAL';
}

export interface DocumentQualityRules {
  checkResolutionDpi: boolean;
  minDpi: number;
  checkBlur: boolean;
  checkContrast: boolean;
  checkCorruptedPdf: boolean;
  checkPasswordProtected: boolean;
  warnOnEmptyPages: boolean;
}

export interface AiModelConfig {
  modelId: string;
  displayName: string;
  provider: 'Google_Gemini' | 'Azure' | 'AWS' | 'OpenAI';
  temperature: number;
  maxTokens: number;
  timeoutSeconds: number;
  maxRetries: number;
  retryStrategy: 'exponential_backoff' | 'fixed_interval';
  costPer1kTokensUsd: number;
  costPerDocumentUsd: number;
  contextWindow: string;
  isAvailable: boolean;
}

export interface TokenUsageStatistics {
  tokensUsedToday: number;
  tokensUsedThisMonth: number;
  estimatedCostTodayUsd: number;
  estimatedCostThisMonthUsd: number;
  averageTokensPerDocument: number;
  averageCostPerDocumentUsd: number;
  tokensRemainingMonth: number;
  monthlyLimitTokens: number;
  dailyLimitTokens: number;
  maxTokensPerDocument: number;
  maxTokensPerPage: number;
  maxCostPerDocumentUsd: number;
  monthlyBudgetUsd: number;
  budgetAlertThresholdPercent: number; // e.g. 80
  budgetCriticalThresholdPercent: number; // e.g. 90
  actionOnBudgetExceeded: 'stop_ai' | 'use_cheaper_model' | 'fallback_provider' | 'require_admin_approval';
}

export interface AiRoutingRule {
  id: string;
  name: string;
  condition: 'simple_pdf' | 'complex_scan' | 'hebrew_handwriting' | 'confidence_low' | 'large_doc_over_10_pages';
  assignedEngine: string;
  assignedModel: string;
  description: string;
  isActive: boolean;
}

export interface SupplierOcrRule {
  id: string;
  supplierId: string;
  supplierName: string;
  companyId: string;
  preferredEngine?: string;
  preferredModel?: string;
  confidenceThresholdOverride?: number;
  templateCode?: string;
  expectedFieldCoordinates?: {
    invoiceNumberBox?: { x: number; y: number; w: number; h: number };
    totalBox?: { x: number; y: number; w: number; h: number };
    dateBox?: { x: number; y: number; w: number; h: number };
  };
  customLanguage?: string;
  zeroVatOverride?: boolean;
  isActive: boolean;
}

export interface SupplierOcrOverride {
  supplierTaxId: string;
  supplierName: string;
  customEngine?: string;
  customModel?: string;
  fieldThresholdOverrides?: Record<string, number>;
  bypassAutoMatch?: boolean;
  zeroVatReasonOverride?: string;
}

export interface DeepAiOcrPipelineConfig extends AiOcrEngineConfig {
  usageMode: any;
  supportedLanguages?: string[];
  enableMultiPassOcr?: boolean;
  maxPasses?: number;
  
  ocrEngine?: string;
  fallbackOcrEngine?: string;
  aiModel?: string;
  multiPassOcr?: boolean;
  temperature?: number;
  maxRetries?: number;
  timeoutMs?: number;

  fieldThresholds: any;
  criticalFieldsOverrideAutoPass?: boolean;
  
  preprocessing: any;
  qualityRules?: DocumentQualityRules;
  documentQualityRules?: {
    minDpiRequired: number;
    rejectBlurryImages: boolean;
    handlePasswordProtected: 'quarantine' | 'reject' | 'ask_user' | string;
    rejectCorruptedPdf: boolean;
  };
  
  availableModels?: AiModelConfig[];
  selectedModelId?: string;
  
  tokenStats?: TokenUsageStatistics;
  routingRules?: AiRoutingRule[];
  
  ocrTimeoutSeconds?: number;
  aiTimeoutSeconds?: number;
  maxFileSizeMb?: number;
  maxPagesPerDoc?: number;

  tokensUsedToday?: number;
  tokensUsedThisMonth?: number;
  costSpentTodayUsd?: number;
  costSpentThisMonthUsd?: number;
  averageTokensPerDoc?: number;
  estimatedCostPerDocUsd?: number;
  costPer1kTokens?: number;
  alertThresholdPercent?: number;
  actionOnBudgetExceeded?: string;
  supplierOverrides?: SupplierOcrOverride[];
}

export interface TrashItem {
  id: string;
  entityType: 'user' | 'branch' | 'cost_center' | 'custom_field' | 'workflow' | 'tax_rate' | 'email_box' | 'integration' | 'company';
  name: string;
  deletedBy: string;
  deletedAt: string;
  reason: string;
  originalData: any;
}

export interface ConfigVersionEntry {
  version: number;
  createdAt: string;
  author: string;
  summary: string;
  stateSnapshot: any;
}

export interface EnterpriseControlCenterState {
  currentCompanyId: string;
  activeScope: ConfigScope;
  companies: CompanyProfileSettings[];
  branches: OrgBranch[];
  costCenters: CostCenter[];
  users: AppUser[];
  rolePermissions: Record<UserRole, RolePermissionRule>;
  customFields: CustomFieldDefinition[];
  workflows: WorkflowConfig[];
  delegations: DelegationRule[];
  taxRates: TaxVatRate[];
  currencies: CurrencyConfig[];
  aiOcrConfig: AiOcrEngineConfig;
  pipelineOcrAi: DeepAiOcrPipelineConfig;
  supplierOcrRules: SupplierOcrRule[];
  emailBoxes: InboundEmailBox[];
  integrations: ApiKeyIntegration[];
  retention: RetentionPolicy;
  scheduledJobs: ScheduledBackgroundJob[];
  auditLogs: SystemAuditLog[];
  trash: TrashItem[];
  configVersions: ConfigVersionEntry[];
  emergencyPauseSync: boolean;
  configVersion: number;
}
