import { InvoiceDocument, Supplier, PurchaseOrder, GoodsReceipt } from '../types';
import { enterpriseConfigService } from './enterpriseConfigService';

export interface ERPAdapter {
  name: string;
  getSupplier(taxId: string): Promise<Supplier | null>;
  getPurchaseOrder(poNumber: string): Promise<PurchaseOrder | null>;
  getReceipt(receiptNumber: string): Promise<GoodsReceipt | null>;
  createInvoice(invoice: InvoiceDocument): Promise<{ success: boolean; erpDocId?: string; error?: string }>;
  updateInvoiceStatus(invoiceId: string, status: string): Promise<{ success: boolean }>;
  syncAll(companyId: string): Promise<{ syncedCount: number; errors: string[] }>;
}

export class PriorityERPAdapter implements ERPAdapter {
  name = 'Priority ERP (OData v4 Connector)';
  private apiEndpoint: string;
  private companyCode: string;

  constructor(apiEndpoint = 'https://priority.cloud/odata/v4', companyCode = 'DEMO_IL') {
    this.apiEndpoint = apiEndpoint;
    this.companyCode = companyCode;
  }

  async getSupplier(taxId: string): Promise<Supplier | null> {
    return null;
  }

  async getPurchaseOrder(poNumber: string): Promise<PurchaseOrder | null> {
    return null;
  }

  async getReceipt(receiptNumber: string): Promise<GoodsReceipt | null> {
    return null;
  }

  async createInvoice(invoice: InvoiceDocument): Promise<{ success: boolean; erpDocId?: string; error?: string }> {
    const config = enterpriseConfigService.getState();

    // 1. Emergency Pause check
    if (config.emergencyPauseSync) {
      return { 
        success: false, 
        error: 'שידור נחסם: מצב השהיית חירום פעיל במרכז השליטה הארגוני (Emergency Pause Mode)' 
      };
    }

    // 2. Validation pre-checks
    if (invoice.status === 'rejected') {
      return { success: false, error: 'לא ניתן לשדר חשבונית שנדחתה על ידי המאשרים' };
    }
    if (invoice.duplicateRisk === 'high') {
      return { success: false, error: 'חסימת אבטחה: זוהתה חשבונית כפולה בוודאות גבוהה' };
    }
    if (!invoice.mathCheck.passed) {
      return { success: false, error: 'נכשלה ולידציה כפולה: קיימת אי-התאמה מתמטית בסכומים או בשורות' };
    }

    // 3. Workflow requirement check
    const workflowCheck = enterpriseConfigService.evaluateApprovalRequirements(invoice);
    if (workflowCheck.requiresApproval && invoice.status !== 'approved' && invoice.status !== 'ready_for_erp') {
      return {
        success: false,
        error: `נדרש אישור לפני שידור ל-ERP: ${workflowCheck.reason} (דרג מאשר: ${workflowCheck.requiredRole})`,
      };
    }

    // Generate Priority PINVOICE Number format: PINV-YYYYMM-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const erpDocId = `PRI-INV-2026-${randomSuffix}`;

    return {
      success: true,
      erpDocId,
    };
  }

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async syncAll(companyId: string): Promise<{ syncedCount: number; errors: string[] }> {
    const config = enterpriseConfigService.getState();
    if (config.emergencyPauseSync) {
      return { syncedCount: 0, errors: ['המערכת שרויה במצב השהיית חירום - כל פעולות הסנכרון מושבתות'] };
    }
    return {
      syncedCount: 5,
      errors: [],
    };
  }
}

export const defaultERPAdapter = new PriorityERPAdapter();
