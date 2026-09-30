export type Language = 'fr' | 'en' | 'he';
export type ThemeMode = 'light' | 'dark';

export type UserRole = 
  | 'ADMIN'
  | 'FINANCE'
  | 'ACCOUNTANT'
  | 'APPROVER'
  | 'PURCHASING'
  | 'MANAGER'
  | 'VIEWER';

export type DocumentType = 
  | 'invoice'
  | 'tax_invoice'
  | 'deposit_invoice'
  | 'credit_note'
  | 'receipt'
  | 'delivery_note'
  | 'purchase_order'
  | 'quote'
  | 'supplier_statement'
  | 'customs_document'
  | 'packing_list'
  | 'certificate'
  | 'import_document'
  | 'other';

export type ProcessingStatus = 
  | 'new'
  | 'processing'
  | 'needs_attention'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'ready_for_erp'
  | 'posted_to_erp'
  | 'archived';

export type DuplicateRisk = 'none' | 'possible' | 'high';

export type ExtractionMethod = 'attachment_pdf' | 'link_pdf' | 'screenshot_fallback';
export type TotalSourceType = 'explicit_label' | 'calculated';
export type CoherenceValidationStatus = 'VALID' | 'MISMATCH';

export interface InboundEmailAttachment {
  filename: string;
  contentType: string;
  sizeBytes?: number;
  dataBase64?: string;
  blobUrl?: string;
}

export interface InboundEmailMessage {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  receivedDate: string;
  htmlBody: string;
  textBody?: string;
  attachments: InboundEmailAttachment[];
}

export interface ExtractionAuditLog {
  method: ExtractionMethod;
  sourceDescription: string;
  detectedAt: string;
  rawFileSize?: string;
  pagesCount?: number;
  downloadUrl?: string;
  screenshotNotice?: string;
  validationStatus: CoherenceValidationStatus;
  validationDetails?: string;
  totalSource: TotalSourceType;
  usedTemplateId?: string;
  sha256?: string;
}

export interface SupplierInvoiceTemplate {
  templateId: string;
  senderDomain: string;
  vendorName: string;
  layoutSignature?: string;
  expectedSections: Array<{
    field: string;
    labelHebrew?: string;
    labelFrench?: string;
    pageHint?: 'first' | 'last' | 'summary' | 'all';
    totalSourceSeen?: 'explicit_label' | 'calculated';
  }>;
  notes?: string;
  successCount: number; // Exigé >= 3 avant d'autoriser l'extraction sans re-scan complet
  isActive: boolean;
  createdAt: string;
  lastValidatedAt?: string;
}

export interface AgentExecutionStep {
  step: number;
  toolName: string;
  description: string;
  input: any;
  output: any;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  timestamp: string;
  durationMs?: number;
}

export interface BoundingBox {
  id: string;
  field: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number;
  height: number;
  page?: number;
}

export interface InvoiceLineItem {
  id: string;
  sku?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  vatPercent: number;
  total: number;
  expectedTotal?: number;
  confidence: number; // 0 - 100
  hasError?: boolean;
  matchedPoLineId?: string;
  matchedReceiptLineId?: string;
}

export interface FieldValidation {
  field: string;
  label: string;
  value: any;
  confidence: number; // 0 - 100
  status: 'valid' | 'warning' | 'error';
  message?: string;
  boundingBox?: BoundingBox;
}

export interface MathCheckResult {
  passed: boolean;
  calculatedSubtotal: number;
  statedSubtotal: number;
  calculatedVat: number;
  statedVat: number;
  calculatedTotal: number;
  statedTotal: number;
  linesSum: number;
  discrepancies: string[];
}

export interface DuplicateCheckResult {
  risk: DuplicateRisk;
  score: number; // 0 - 100
  matchedDocumentId?: string;
  matchedInvoiceNumber?: string;
  matchedSupplierName?: string;
  matchedAmount?: number;
  reasons: string[];
}

export interface ThreeWayMatchResult {
  status: 'matched_100' | 'variance_detected' | 'po_missing' | 'receipt_missing';
  poNumber?: string;
  receiptNumber?: string;
  quantityOrdered?: number;
  quantityReceived?: number;
  quantityInvoiced?: number;
  priceVariance?: number;
  quantityVariance?: number;
  discrepancies: string[];
}

export interface DocumentAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
}

export interface InvoiceDocument {
  id: string;
  companyId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'pdf' | 'jpg' | 'png';
  documentType: DocumentType;
  supplierId: string;
  supplierName: string;
  supplierTaxId: string; // ח.פ or VAT number
  supplierAddress?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: 'ILS' | 'EUR' | 'USD' | 'GBP';
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  purchaseOrderNumber?: string;
  receiptNumber?: string;
  allocationNumber?: string;
  importDossierId?: string;
  
  overallConfidence: number;
  status: ProcessingStatus;
  duplicateRisk: DuplicateRisk;
  
  // Pipeline Extraction & Truth Preservation
  extractionMethod?: ExtractionMethod;
  extractionQuality?: 'original_pdf' | 'approximate_fallback';
  approximateFallbackNotice?: string;
  totalSource?: TotalSourceType;
  validationStatus?: CoherenceValidationStatus;
  validationDetails?: string;
  originalPdfData?: string; // Raw base64 or blob URL of genuine original PDF
  originalPdfStored?: boolean;
  pagesCount?: number;
  extractionAuditLog?: ExtractionAuditLog;
  
  fields: Record<string, FieldValidation>;
  lines: InvoiceLineItem[];
  
  mathCheck: MathCheckResult;
  duplicateCheck: DuplicateCheckResult;
  threeWayMatch: ThreeWayMatchResult;
  
  assignedUser: string;
  receivedAt: string;
  processedAt?: string;
  
  erpDocumentId?: string;
  erpStatus?: 'synced' | 'pending' | 'failed' | 'not_ready';
  erpSyncedAt?: string;
  
  isArchived?: boolean;
  archivedAt?: string;
  archiveFolder?: string;
  
  auditTrail: DocumentAuditEntry[];
  correctionsCount: number;
  comments: { id: string; user: string; text: string; timestamp: string }[];
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  registrationNumber: string; // ח.פ / SIREN / Tax ID
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  defaultCurrency: 'ILS' | 'EUR' | 'USD' | 'GBP';
  defaultVatRate: number;
  expenseAccount: string;
  costCenter: string;
  paymentTerms: string;
  invoiceFormatRegex?: string;
  learnedCorrectionsCount: number;
  activeOrdersCount: number;
  totalSpend: number;
  confidenceScore: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  companyId: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDeliveryDate: string;
  currency: 'ILS' | 'EUR' | 'USD' | 'GBP';
  totalAmount: number;
  status: 'open' | 'partially_received' | 'fully_received' | 'closed';
  lines: {
    id: string;
    sku: string;
    description: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receivedDate: string;
  receivedBy: string;
  lines: {
    id: string;
    sku: string;
    description: string;
    quantityReceived: number;
    warehouseLocation: string;
  }[];
}

export interface ImportDossier {
  id: string;
  companyId: string;
  dossierNumber: string; // e.g. IMPORT 2026-00452
  title: string;
  supplierName: string;
  originCountry: string;
  portOfEntry: string;
  status: 'draft' | 'in_transit' | 'customs_cleared' | 'received' | 'closed';
  eta: string;
  billOfLadingNumber: string;
  vesselFlight: string;
  currency: 'USD' | 'EUR' | 'ILS';
  customsDuty: number;
  freightCost: number;
  insuranceCost: number;
  totalGoodsValue: number;
  documentsCount: number;
  documentIds: string[];
}

export interface Company {
  id: string;
  name: string;
  code: string;
  taxNumber: string;
  defaultCurrency: 'ILS' | 'EUR' | 'USD';
  erpType: 'Priority' | 'SAP' | 'NetSuite' | 'Generic_REST';
}

export interface BulkUploadProgress {
  total: number;
  processed: number;
  needsAttention: number;
  errors: number;
  duplicates: number;
  isCompleted: boolean;
}
