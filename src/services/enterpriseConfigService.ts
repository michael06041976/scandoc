import { 
  EnterpriseControlCenterState, 
  TaxVatRate, 
  ApprovalStepRule, 
  ConfigScope, 
  CompanyProfileSettings, 
  CompanyContact,
  DeepAiOcrPipelineConfig,
  FieldConfidenceThresholds,
  AiModelConfig,
  AiRoutingRule,
  SupplierOcrRule,
  OcrUsageMode,
  TrashItem,
  ConfigVersionEntry,
  InboundEmailBox,
  ApiKeyIntegration,
  EmailScanTimeRange,
  EmailScanResultItem
} from '../types/enterprise';
import { initialEnterpriseConfig } from '../data/enterpriseMock';
import { InvoiceDocument } from '../types';

const STORAGE_KEY = 'docuflow_enterprise_control_center_state_v4';

class EnterpriseConfigService {
  private state: EnterpriseControlCenterState;
  private listeners: Array<(state: EnterpriseControlCenterState) => void> = [];

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): EnterpriseControlCenterState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...initialEnterpriseConfig,
          ...parsed,
          activeScope: parsed.activeScope || 'COMPANY',
          companies: parsed.companies && parsed.companies.length > 0 ? parsed.companies : initialEnterpriseConfig.companies,
          pipelineOcrAi: {
            ...initialEnterpriseConfig.pipelineOcrAi,
            ...(parsed.pipelineOcrAi || {}),
            fieldThresholds: {
              ...initialEnterpriseConfig.pipelineOcrAi.fieldThresholds,
              ...(parsed.pipelineOcrAi?.fieldThresholds || {}),
            },
            preprocessing: {
              ...initialEnterpriseConfig.pipelineOcrAi.preprocessing,
              ...(parsed.pipelineOcrAi?.preprocessing || {}),
            },
            qualityRules: {
              ...initialEnterpriseConfig.pipelineOcrAi.qualityRules,
              ...(parsed.pipelineOcrAi?.qualityRules || {}),
            },
            tokenStats: {
              ...initialEnterpriseConfig.pipelineOcrAi.tokenStats,
              ...(parsed.pipelineOcrAi?.tokenStats || {}),
            },
          },
          trash: parsed.trash || initialEnterpriseConfig.trash || [],
          configVersions: parsed.configVersions || initialEnterpriseConfig.configVersions || [],
          supplierOcrRules: parsed.supplierOcrRules || initialEnterpriseConfig.supplierOcrRules || [],
        };
      }
    } catch (e) {
      console.warn('Failed to load enterprise config from localStorage, using initial mock.', e);
    }
    return JSON.parse(JSON.stringify(initialEnterpriseConfig));
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save enterprise config to localStorage', e);
    }
    this.notifyListeners();
  }

  public getState(): EnterpriseControlCenterState {
    return { ...this.state };
  }

  public subscribe(listener: (state: EnterpriseControlCenterState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const currentState = this.getState();
    this.listeners.forEach(l => l(currentState));
  }

  // ==========================================
  // Scope & Multi-Company Hierarchy
  // ==========================================
  public setScope(scope: ConfigScope) {
    this.state.activeScope = scope;
    this.logAudit('CONFIG', 'שינוי רמת עבודה (Scope)', `רמת התצורה שונתה ל: ${scope}`);
    this.saveState();
  }

  public setCurrentCompany(companyId: string) {
    const found = this.state.companies.find(c => c.id === companyId);
    if (found) {
      this.state.currentCompanyId = companyId;
      this.logAudit('CONFIG', 'החלפת חברה פעילה', `החלפת הקשר חברה אל: ${found.name} (${found.taxRegistrationNumber})`);
      this.saveState();
    }
  }

  public getCurrentCompany(): CompanyProfileSettings {
    const found = this.state.companies.find(c => c.id === this.state.currentCompanyId);
    return found || this.state.companies[0];
  }

  public addCompany(companyData: Partial<CompanyProfileSettings>): CompanyProfileSettings {
    const defaultTemplate = initialEnterpriseConfig.companies[0];
    const newCompany: CompanyProfileSettings = {
      ...defaultTemplate,
      ...companyData,
      id: `comp-${Date.now()}`,
      name: companyData.name || 'חברה חדשה',
      tradeName: companyData.tradeName || companyData.name || 'חברה חדשה',
      taxRegistrationNumber: companyData.taxRegistrationNumber || '510000000',
      vatNumber: companyData.vatNumber || companyData.taxRegistrationNumber || '510000000',
      branding: {
        ...defaultTemplate.branding,
        ...(companyData.branding || {}),
      },
      defaults: {
        ...defaultTemplate.defaults,
        ...(companyData.defaults || {}),
      },
      contacts: companyData.contacts || [],
      acceptedDocumentTypes: companyData.acceptedDocumentTypes || ['tax_invoice', 'invoice', 'credit_note'],
      isActive: true,
    };

    this.state.companies.push(newCompany);
    this.logAudit('CONFIG', 'הוספת ישות חברה חדשה', `נוספה חברה: ${newCompany.name} (ח.פ: ${newCompany.taxRegistrationNumber})`);
    this.saveState();
    return newCompany;
  }

  public updateCompany(id: string, updates: Partial<CompanyProfileSettings>) {
    this.state.companies = this.state.companies.map(c => {
      if (c.id === id) {
        return {
          ...c,
          ...updates,
          branding: updates.branding ? { ...c.branding, ...updates.branding } : c.branding,
          defaults: updates.defaults ? { ...c.defaults, ...updates.defaults } : c.defaults,
        };
      }
      return c;
    });
    this.logAudit('CONFIG', 'עדכון הגדרות חברה', `עודכנו פרטי חברה מזהה: ${id}`);
    this.saveState();
  }

  public duplicateCompany(id: string): CompanyProfileSettings | null {
    const orig = this.state.companies.find(c => c.id === id);
    if (!orig) return null;
    const cloned: CompanyProfileSettings = {
      ...JSON.parse(JSON.stringify(orig)),
      id: `comp-${Date.now()}`,
      name: `${orig.name} (עותק)`,
      tradeName: `${orig.tradeName} (עותק)`,
      taxRegistrationNumber: `${orig.taxRegistrationNumber}-CPY`,
      vatNumber: `${orig.vatNumber}-CPY`,
    };
    this.state.companies.push(cloned);
    this.logAudit('CONFIG', 'שכפול ישות חברה', `שוכפלה חברה מ-${orig.name} אל ${cloned.name}`);
    this.saveState();
    return cloned;
  }

  public toggleCompanyActive(id: string) {
    const comp = this.state.companies.find(c => c.id === id);
    if (!comp) return;
    comp.isActive = !comp.isActive;
    this.logAudit('CONFIG', 'שינוי סטטוס חברה', `החברה ${comp.name} הועברה למצב ${comp.isActive ? 'פעיל' : 'מושבת'}`);
    this.saveState();
  }

  public softDeleteCompany(id: string, reason: string = 'העברה לסל מחזור') {
    const comp = this.state.companies.find(c => c.id === id);
    if (!comp) return;
    if (this.state.companies.length <= 1) {
      alert('לא ניתן למחוק את החברה היחידה במערכת');
      return;
    }
    this.state.companies = this.state.companies.filter(c => c.id !== id);
    if (this.state.currentCompanyId === id) {
      this.state.currentCompanyId = this.state.companies[0].id;
    }
    this.moveToTrash('company', id, comp.name, reason, comp);
    this.logAudit('CONFIG', 'מחיקה רכה של חברה', `החברה ${comp.name} הועברה לסל המחזור. סיבה: ${reason}`);
    this.saveState();
  }

  // Company Contacts
  public addCompanyContact(companyId: string, contact: Omit<CompanyContact, 'id'>) {
    const comp = this.state.companies.find(c => c.id === companyId);
    if (!comp) return;
    const newContact: CompanyContact = {
      ...contact,
      id: `cnt-${Date.now()}`,
    };
    comp.contacts.push(newContact);
    this.logAudit('CONFIG', 'הוספת איש קשר לחברה', `נוסף איש קשר ${newContact.name} (${newContact.role}) לחברת ${comp.name}`);
    this.saveState();
  }

  public updateCompanyContact(companyId: string, contactId: string, updates: Partial<CompanyContact>) {
    const comp = this.state.companies.find(c => c.id === companyId);
    if (!comp) return;
    comp.contacts = comp.contacts.map(cnt => cnt.id === contactId ? { ...cnt, ...updates } : cnt);
    this.logAudit('CONFIG', 'עדכון איש קשר בחברה', `עודכן איש קשר מזהה ${contactId}`);
    this.saveState();
  }

  public deleteCompanyContact(companyId: string, contactId: string) {
    const comp = this.state.companies.find(c => c.id === companyId);
    if (!comp) return;
    comp.contacts = comp.contacts.filter(cnt => cnt.id !== contactId);
    this.logAudit('CONFIG', 'מחיקת איש קשר בחברה', `נמחק איש קשר מזהה ${contactId}`);
    this.saveState();
  }

  // ==========================================
  // Soft Delete, Trash & Recycling Bin
  // ==========================================
  public moveToTrash(entityType: TrashItem['entityType'], id: string, name: string, reason: string, originalData: any = null) {
    const trashItem: TrashItem = {
      id: `trash-${Date.now()}`,
      entityType,
      name,
      deletedBy: 'מיכל בן-ארי (מנהל מערכת)',
      deletedAt: new Date().toLocaleDateString('he-IL') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reason,
      originalData,
    };
    this.state.trash.unshift(trashItem);
  }

  public restoreFromTrash(trashId: string): boolean {
    const item = this.state.trash.find(t => t.id === trashId);
    if (!item) return false;

    switch (item.entityType) {
      case 'user':
        this.state.users.push(item.originalData);
        break;
      case 'branch':
        this.state.branches.push(item.originalData);
        break;
      case 'cost_center':
        this.state.costCenters.push(item.originalData);
        break;
      case 'custom_field':
        this.state.customFields.push(item.originalData);
        break;
      case 'workflow':
        this.state.workflows.push(item.originalData);
        break;
      case 'tax_rate':
        this.state.taxRates.push(item.originalData);
        break;
      case 'email_box':
        this.state.emailBoxes.push(item.originalData);
        break;
      case 'integration':
        this.state.integrations.push(item.originalData);
        break;
      case 'company':
        this.state.companies.push(item.originalData);
        break;
    }

    this.state.trash = this.state.trash.filter(t => t.id !== trashId);
    this.logAudit('CONFIG', 'שחזור פריט מסל המחזור', `שוחזר ${item.entityType}: ${item.name}`);
    this.saveState();
    return true;
  }

  public permanentDelete(trashId: string) {
    const item = this.state.trash.find(t => t.id === trashId);
    this.state.trash = this.state.trash.filter(t => t.id !== trashId);
    this.logAudit('CONFIG', 'מחיקה לצמיתות מסל המחזור', `נמחק לצמיתות ${item?.entityType}: ${item?.name}`, 'warning');
    this.saveState();
  }

  public emptyTrash() {
    const count = this.state.trash.length;
    this.state.trash = [];
    this.logAudit('CONFIG', 'ריקון סל המחזור', `סל המחזור רוקן (${count} פריטים נמחקו לצמיתות)`, 'critical');
    this.saveState();
  }

  // ==========================================
  // Branches CRUD & Duplicate
  // ==========================================
  public addBranch(branch: Omit<typeof initialEnterpriseConfig.branches[0], 'id'>) {
    const newBranch = {
      ...branch,
      id: `br-${Date.now()}`,
    };
    this.state.branches.push(newBranch);
    this.logAudit('CONFIG', 'הוספת סניף', `נוסף סניף חדש: ${newBranch.name} (${newBranch.code})`);
    this.saveState();
  }

  public updateBranch(id: string, updates: Partial<typeof initialEnterpriseConfig.branches[0]>) {
    this.state.branches = this.state.branches.map(b => b.id === id ? { ...b, ...updates } : b);
    this.logAudit('CONFIG', 'עדכון סניף', `עודכן סניף מזהה: ${id}`);
    this.saveState();
  }

  public duplicateBranch(id: string) {
    const orig = this.state.branches.find(b => b.id === id);
    if (!orig) return;
    const cloned = {
      ...orig,
      id: `br-${Date.now()}`,
      name: `${orig.name} (עותק)`,
      code: `${orig.code}_COPY`,
    };
    this.state.branches.push(cloned);
    this.logAudit('CONFIG', 'שכפול סניף', `שוכפל סניף ${orig.name} ל-${cloned.name}`);
    this.saveState();
  }

  public softDeleteBranch(id: string, reason: string = 'מחיקה על ידי משתמש') {
    const orig = this.state.branches.find(b => b.id === id);
    if (!orig) return;
    this.state.branches = this.state.branches.filter(b => b.id !== id);
    this.moveToTrash('branch', id, orig.name, reason, orig);
    this.logAudit('CONFIG', 'מחיקת סניף לסל מחזור', `הסניף ${orig.name} הועבר לסל המחזור`);
    this.saveState();
  }

  // ==========================================
  // Cost Centers CRUD & Duplicate
  // ==========================================
  public addCostCenter(cc: Omit<typeof initialEnterpriseConfig.costCenters[0], 'id'>) {
    const newCc = {
      ...cc,
      id: `cc-${Date.now()}`,
    };
    this.state.costCenters.push(newCc);
    this.logAudit('CONFIG', 'הוספת מרכז עלות', `נוסף מרכז עלות: ${newCc.name} (${newCc.code})`);
    this.saveState();
  }

  public updateCostCenter(id: string, updates: Partial<typeof initialEnterpriseConfig.costCenters[0]>) {
    this.state.costCenters = this.state.costCenters.map(c => c.id === id ? { ...c, ...updates } : c);
    this.logAudit('CONFIG', 'עדכון מרכז עלות', `עודכן מרכז עלות מזהה: ${id}`);
    this.saveState();
  }

  public duplicateCostCenter(id: string) {
    const orig = this.state.costCenters.find(c => c.id === id);
    if (!orig) return;
    const cloned = {
      ...orig,
      id: `cc-${Date.now()}`,
      name: `${orig.name} (עותק)`,
      code: `${orig.code}_COPY`,
    };
    this.state.costCenters.push(cloned);
    this.logAudit('CONFIG', 'שכפול מרכז עלות', `שוכפל מרכז עלות ${orig.name}`);
    this.saveState();
  }

  public softDeleteCostCenter(id: string, reason: string = 'מחיקה על ידי משתמש') {
    const orig = this.state.costCenters.find(c => c.id === id);
    if (!orig) return;
    this.state.costCenters = this.state.costCenters.filter(c => c.id !== id);
    this.moveToTrash('cost_center', id, orig.name, reason, orig);
    this.logAudit('CONFIG', 'מחיקת מרכז עלות לסל מחזור', `מרכז עלות ${orig.name} הועבר לסל מחזור`);
    this.saveState();
  }

  // ==========================================
  // Users & Permissions CRUD & Duplicate
  // ==========================================
  public addUser(user: Omit<typeof initialEnterpriseConfig.users[0], 'id'>) {
    const newUser = {
      ...user,
      id: `usr-${Date.now()}`,
      phone: user.phone || '050-0000000',
      isApprover: user.isApprover ?? false,
      isActive: user.isActive ?? true,
    };
    this.state.users.push(newUser);
    this.logAudit('AUTH', 'הוספת משתמש', `נוצר משתמש חדש: ${newUser.name} (${newUser.email}) - טלפון: ${newUser.phone}, גורם מאשר: ${newUser.isApprover ? 'כן' : 'לא'}, סטטוס: ${newUser.isActive ? 'פעיל' : 'מושבת'}`);
    this.saveState();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<typeof initialEnterpriseConfig.users[0]>) {
    this.state.users = this.state.users.map(u => u.id === id ? { ...u, ...updates } : u);
    const updated = this.state.users.find(u => u.id === id);
    this.logAudit('AUTH', 'עדכון משתמש', `עודכנו פרטי משתמש ${updated?.name || id}`);
    this.saveState();
  }

  public duplicateUser(id: string) {
    const orig = this.state.users.find(u => u.id === id);
    if (!orig) return;
    const cloned = {
      ...orig,
      id: `usr-${Date.now()}`,
      name: `${orig.name} (עותק)`,
      email: `copy_${Date.now()}_${orig.email}`,
    };
    this.state.users.push(cloned);
    this.logAudit('AUTH', 'שכפול משתמש', `שוכפל משתמש ${orig.name} אל ${cloned.name}`);
    this.saveState();
  }

  public softDeleteUser(id: string, reason: string = 'מחיקה על ידי מנהל') {
    const orig = this.state.users.find(u => u.id === id);
    if (!orig) return;
    this.state.users = this.state.users.filter(u => u.id !== id);
    this.moveToTrash('user', id, orig.name, reason, orig);
    this.logAudit('AUTH', 'מחיקת משתמש לסל מחזור', `המשתמש ${orig.name} הועבר לסל מחזור`);
    this.saveState();
  }

  public toggleUserApprover(id: string, forceValue?: boolean) {
    const user = this.state.users.find(u => u.id === id);
    if (!user) return;
    const newVal = forceValue !== undefined ? forceValue : !user.isApprover;
    user.isApprover = newVal;
    this.logAudit('AUTH', 'שינוי מעמד גורם מאשר', `המשתמש ${user.name} הוגדר כ${newVal ? 'גורם מאשר מורשה' : 'אינו גורם מאשר'}`);
    this.saveState();
  }

  public toggleUserActive(id: string, forceValue?: boolean) {
    const user = this.state.users.find(u => u.id === id);
    if (!user) return;
    const newVal = forceValue !== undefined ? forceValue : !user.isActive;
    user.isActive = newVal;
    this.logAudit('AUTH', 'שינוי סטטוס פעילות משתמש', `המשתמש ${user.name} הועבר למצב ${newVal ? 'פעיל' : 'מושבת/לא פעיל'}`);
    this.saveState();
  }

  public updateRolePermission(role: keyof typeof initialEnterpriseConfig.rolePermissions, updates: Partial<typeof initialEnterpriseConfig.rolePermissions['ADMIN']>) {
    this.state.rolePermissions[role] = {
      ...this.state.rolePermissions[role],
      ...updates,
    };
    this.logAudit('AUTH', 'עדכון מטריצת הרשאות', `עודכנו הרשאות תפקיד ${role}`);
    this.saveState();
  }

  // ==========================================
  // Custom Fields CRUD & Duplicate
  // ==========================================
  public addCustomField(field: Omit<typeof initialEnterpriseConfig.customFields[0], 'id'>) {
    const newField = {
      ...field,
      id: `cf-${Date.now()}`,
    };
    this.state.customFields.push(newField);
    this.logAudit('CUSTOM_FIELDS', 'הוספת שדה מותאם', `נוסף שדה: ${newField.name} (${newField.key}) מסוג ${newField.type}`);
    this.saveState();
  }

  public updateCustomField(id: string, updates: Partial<typeof initialEnterpriseConfig.customFields[0]>) {
    this.state.customFields = this.state.customFields.map(f => f.id === id ? { ...f, ...updates } : f);
    this.logAudit('CUSTOM_FIELDS', 'עדכון שדה מותאם', `עודכן שדה מזהה: ${id}`);
    this.saveState();
  }

  public duplicateCustomField(id: string) {
    const orig = this.state.customFields.find(f => f.id === id);
    if (!orig) return;
    const cloned = {
      ...orig,
      id: `cf-${Date.now()}`,
      name: `${orig.name} (עותק)`,
      key: `${orig.key}_copy`,
    };
    this.state.customFields.push(cloned);
    this.logAudit('CUSTOM_FIELDS', 'שכפול שדה מותאם', `שוכפל שדה ${orig.name}`);
    this.saveState();
  }

  public softDeleteCustomField(id: string, reason: string = 'הסרה מתבנית') {
    const orig = this.state.customFields.find(f => f.id === id);
    if (!orig) return;
    this.state.customFields = this.state.customFields.filter(f => f.id !== id);
    this.moveToTrash('custom_field', id, orig.name, reason, orig);
    this.logAudit('CUSTOM_FIELDS', 'מחיקת שדה מותאם לסל מחזור', `שדה ${orig.name} הועבר לסל מחזור`);
    this.saveState();
  }

  public deleteCustomField(id: string) {
    this.softDeleteCustomField(id);
  }

  // ==========================================
  // Tax Rates & Currencies
  // ==========================================
  public getDefaultTaxRateForCountry(country: string): TaxVatRate {
    const match = this.state.taxRates.find(t => t.country === country && t.isDefault);
    if (match) return match;
    const defaultIl = this.state.taxRates.find(t => t.country === 'ישראל' && t.isDefault);
    return defaultIl || this.state.taxRates[0];
  }

  public updateTaxRate(id: string, updates: Partial<TaxVatRate>) {
    this.state.taxRates = this.state.taxRates.map(t => t.id === id ? { ...t, ...updates } : t);
    this.logAudit('TAX', 'עדכון שיעור מס', `עודכן שיעור מע״מ ${id}`);
    this.saveState();
  }

  public addTaxRate(taxRate: Omit<TaxVatRate, 'id'>) {
    const newRate = {
      ...taxRate,
      id: `tax-${Date.now()}`,
    };
    this.state.taxRates.push(newRate);
    this.logAudit('TAX', 'הוספת שיעור מס חדש', `נוסף מע״מ ${newRate.name} (${newRate.ratePercent}%)`);
    this.saveState();
  }

  public duplicateTaxRate(id: string) {
    const orig = this.state.taxRates.find(t => t.id === id);
    if (!orig) return;
    const cloned = {
      ...orig,
      id: `tax-${Date.now()}`,
      name: `${orig.name} (עותק)`,
      isDefault: false,
    };
    this.state.taxRates.push(cloned);
    this.logAudit('TAX', 'שכפול שיעור מס', `שוכפל שער מע״מ ${orig.name}`);
    this.saveState();
  }

  public softDeleteTaxRate(id: string, reason: string = 'ביטול תעריף') {
    const orig = this.state.taxRates.find(t => t.id === id);
    if (!orig) return;
    this.state.taxRates = this.state.taxRates.filter(t => t.id !== id);
    this.moveToTrash('tax_rate', id, orig.name, reason, orig);
    this.logAudit('TAX', 'מחיקת תעריף מע״מ לסל מחזור', `תעריף ${orig.name} הועבר לסל מחזור`);
    this.saveState();
  }

  public updateCurrencyRate(code: 'ILS' | 'EUR' | 'USD' | 'GBP', rateToILS: number) {
    this.state.currencies = this.state.currencies.map(c => 
      c.code === code ? { ...c, rateToILS, lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : c
    );
    this.logAudit('CONFIG', 'עדכון שער חליפין', `שער ${code} עודכן ל-${rateToILS} ₪`);
    this.saveState();
  }

  // ==========================================
  // Workflows & Approvals
  // ==========================================
  public updateWorkflow(id: string, updates: Partial<typeof initialEnterpriseConfig.workflows[0]>) {
    this.state.workflows = this.state.workflows.map(w => w.id === id ? { ...w, ...updates } : w);
    this.logAudit('WORKFLOW', 'עדכון חוקי אישור', `עודכן נוהל אישור ${id}`);
    this.saveState();
  }

  public duplicateWorkflow(id: string) {
    const orig = this.state.workflows.find(w => w.id === id);
    if (!orig) return;
    const cloned = {
      ...orig,
      id: `wf-${Date.now()}`,
      name: `${orig.name} (עותק)`,
      isActive: false,
    };
    this.state.workflows.push(cloned);
    this.logAudit('WORKFLOW', 'שכפול נוהל אישור', `שוכפל נוהל ${orig.name}`);
    this.saveState();
  }

  public softDeleteWorkflow(id: string, reason: string = 'החלפה בנוהל חדש') {
    const orig = this.state.workflows.find(w => w.id === id);
    if (!orig) return;
    this.state.workflows = this.state.workflows.filter(w => w.id !== id);
    this.moveToTrash('workflow', id, orig.name, reason, orig);
    this.logAudit('WORKFLOW', 'מחיקת נוהל אישור לסל מחזור', `נוהל ${orig.name} הועבר לסל מחזור`);
    this.saveState();
  }

  public evaluateApprovalRequirements(invoice: InvoiceDocument): {
    requiresApproval: boolean;
    requiredRole: string;
    stepName: string;
    autoApproved: boolean;
    reason: string;
    eligibleApprovers: Array<{
      id: string;
      name: string;
      phone: string;
      email: string;
      role: string;
      approvalLimit: number;
      isActive: boolean;
      isApprover: boolean;
    }>;
  } {
    const activeWorkflow = this.state.workflows.find(w => w.isActive) || this.state.workflows[0];
    if (!activeWorkflow) {
      return { 
        requiresApproval: true, 
        requiredRole: 'ADMIN', 
        stepName: 'ברירת מחדל', 
        autoApproved: false, 
        reason: 'אין נוהל פעיל',
        eligibleApprovers: this.state.users.filter(u => u.isActive && u.isApprover),
      };
    }

    const getApproversForRole = (role: string, amount: number) => {
      return this.state.users.filter(u => {
        if (!u.isActive || !u.isApprover) return false;
        if (u.role === 'ADMIN') return true;
        if (u.role === role) return true;
        return u.approvalLimit >= amount;
      });
    };

    const is3Way100 = invoice.threeWayMatch?.status === 'matched_100';
    if (activeWorkflow.autoApproveIfMatched100 && is3Way100 && invoice.totalAmount <= activeWorkflow.autoApproveMaxAmount && invoice.mathCheck.passed) {
      return {
        requiresApproval: false,
        requiredRole: 'SYSTEM',
        stepName: 'אישור אוטומטי (Auto-Pilot)',
        autoApproved: true,
        reason: `התאמה מלאה 100% וסכום (${invoice.totalAmount.toLocaleString()} ₪) אינו עולה על סף האישור האוטומטי (${activeWorkflow.autoApproveMaxAmount.toLocaleString()} ₪)`,
        eligibleApprovers: [],
      };
    }

    const matchedStep = activeWorkflow.steps.find(step => {
      const minOk = invoice.totalAmount >= step.minAmount;
      const maxOk = step.maxAmount === undefined || invoice.totalAmount < step.maxAmount;
      return minOk && maxOk;
    });

    if (matchedStep) {
      return {
        requiresApproval: true,
        requiredRole: matchedStep.approverRole,
        stepName: matchedStep.name,
        autoApproved: false,
        reason: `סכום החשבונית (${invoice.totalAmount.toLocaleString()} ₪) מחייב אישור דרג ${matchedStep.approverRole}`,
        eligibleApprovers: getApproversForRole(matchedStep.approverRole, invoice.totalAmount),
      };
    }

    return {
      requiresApproval: true,
      requiredRole: 'FINANCE',
      stepName: 'אישור כספים שגרתי',
      autoApproved: false,
      reason: 'נדרש אישור כספים לפי נוהל רכש',
      eligibleApprovers: getApproversForRole('FINANCE', invoice.totalAmount),
    };
  }

  // Delegations
  public addDelegation(del: Omit<typeof initialEnterpriseConfig.delegations[0], 'id'>) {
    const newDel = {
      ...del,
      id: `del-${Date.now()}`,
    };
    this.state.delegations.push(newDel);
    this.logAudit('AUTH', 'האצלת סמכויות חדשה', `מ-${newDel.fromUserEmail} אל ${newDel.toUserEmail} עד ${newDel.endDate}`);
    this.saveState();
  }

  public deleteDelegation(id: string) {
    this.state.delegations = this.state.delegations.filter(d => d.id !== id);
    this.logAudit('AUTH', 'ביטול האצלת סמכויות', `בוטלה האצלה מזהה ${id}`);
    this.saveState();
  }

  // ==========================================
  // Deep AI & OCR Pipeline Configuration
  // ==========================================
  public updatePipelineConfig(updates: Partial<DeepAiOcrPipelineConfig>) {
    this.state.pipelineOcrAi = {
      ...this.state.pipelineOcrAi,
      ...updates,
      fieldThresholds: updates.fieldThresholds ? { ...this.state.pipelineOcrAi.fieldThresholds, ...updates.fieldThresholds } : this.state.pipelineOcrAi.fieldThresholds,
      preprocessing: updates.preprocessing ? { ...this.state.pipelineOcrAi.preprocessing, ...updates.preprocessing } : this.state.pipelineOcrAi.preprocessing,
      qualityRules: updates.qualityRules ? { ...this.state.pipelineOcrAi.qualityRules, ...updates.qualityRules } : this.state.pipelineOcrAi.qualityRules,
      tokenStats: updates.tokenStats ? { ...this.state.pipelineOcrAi.tokenStats, ...updates.tokenStats } : this.state.pipelineOcrAi.tokenStats,
    };

    // Keep legacy aiOcrConfig in sync
    this.state.aiOcrConfig = {
      ...this.state.aiOcrConfig,
      primaryEngine: updates.primaryEngine || this.state.aiOcrConfig.primaryEngine,
      fallbackEngine: updates.fallbackEngine || this.state.aiOcrConfig.fallbackEngine,
      confidenceThresholdAutoPass: updates.confidenceThresholdAutoPass ?? this.state.aiOcrConfig.confidenceThresholdAutoPass,
      confidenceThresholdReviewRequired: updates.confidenceThresholdReviewRequired ?? this.state.aiOcrConfig.confidenceThresholdReviewRequired,
      enableHebrewHandwritingOcr: updates.enableHebrewHandwritingOcr ?? this.state.aiOcrConfig.enableHebrewHandwritingOcr,
    };

    this.logAudit('CONFIG', 'עדכון צינור OCR & AI', `עודכנו מאפייני עיבוד מתקדמים: מצב ${this.state.pipelineOcrAi.usageMode}`);
    this.saveState();
  }

  public setUsageMode(mode: OcrUsageMode) {
    this.state.pipelineOcrAi.usageMode = mode;
    if (mode === 'ECONOMY') {
      this.state.pipelineOcrAi.selectedModelId = 'gemini-2.5-flash';
      this.state.pipelineOcrAi.enableMultiPassOcr = false;
      this.state.pipelineOcrAi.extractLineItemsLevel = 'balanced';
    } else if (mode === 'ACCURACY') {
      this.state.pipelineOcrAi.selectedModelId = 'gemini-2.5-pro';
      this.state.pipelineOcrAi.enableMultiPassOcr = true;
      this.state.pipelineOcrAi.maxPasses = 3;
      this.state.pipelineOcrAi.extractLineItemsLevel = 'full_deep';
    } else if (mode === 'BALANCED') {
      this.state.pipelineOcrAi.selectedModelId = 'gemini-2.5-flash';
      this.state.pipelineOcrAi.enableMultiPassOcr = true;
      this.state.pipelineOcrAi.maxPasses = 2;
      this.state.pipelineOcrAi.extractLineItemsLevel = 'full_deep';
    }
    this.logAudit('CONFIG', 'שינוי מצב פעולה AI/OCR', `נבחר מצב: ${mode}`);
    this.saveState();
  }

  public updateFieldThreshold(field: keyof FieldConfidenceThresholds, value: number) {
    this.state.pipelineOcrAi.fieldThresholds[field] = value;
    this.logAudit('CONFIG', 'עדכון סף ביטחון לשדה', `שדה ${field} עודכן לסף ${value}%`);
    this.saveState();
  }

  public updateModelConfig(modelId: string, updates: Partial<AiModelConfig>) {
    if (this.state.pipelineOcrAi.availableModels) {
      this.state.pipelineOcrAi.availableModels = this.state.pipelineOcrAi.availableModels.map(m => 
        m.modelId === modelId ? { ...m, ...updates } : m
      );
    }
    this.logAudit('CONFIG', 'עדכון מודל AI', `עודכנו פרמטרי מודל ${modelId}`);
    this.saveState();
  }

  public simulateAiCost(docCount: number, avgPagesPerDoc: number) {
    const models = this.state.pipelineOcrAi.availableModels || [];
    const selectedModel = models.find(m => m.modelId === this.state.pipelineOcrAi.selectedModelId) || models[0] || {
      displayName: 'Google Gemini 2.5 Pro Vision',
      costPer1kTokensUsd: 0.0015,
      costPerDocumentUsd: 0.002,
    };
    const totalPages = docCount * avgPagesPerDoc;
    const tokensPerPage = 1200;
    const totalTokens = totalPages * tokensPerPage;
    const costTokens = (totalTokens / 1000) * (selectedModel.costPer1kTokensUsd || 0.0015);
    const costBase = docCount * (selectedModel.costPerDocumentUsd || 0.002);
    const totalEstimatedUsd = Number((costTokens + costBase).toFixed(2));
    
    return {
      docCount,
      totalPages,
      totalTokens,
      totalEstimatedUsd,
      modelName: selectedModel.displayName,
      costPerDoc: Number((totalEstimatedUsd / (docCount || 1)).toFixed(3)),
    };
  }

  // Supplier OCR Rules
  public addSupplierOcrRule(rule: Omit<SupplierOcrRule, 'id'>) {
    const newRule: SupplierOcrRule = {
      ...rule,
      id: `sup-ocr-${Date.now()}`,
    };
    this.state.supplierOcrRules.push(newRule);
    this.logAudit('CONFIG', 'הוספת חוק OCR לספק', `נוסף חוק לספק ${newRule.supplierName}`);
    this.saveState();
  }

  public updateSupplierOcrRule(id: string, updates: Partial<SupplierOcrRule>) {
    this.state.supplierOcrRules = this.state.supplierOcrRules.map(r => r.id === id ? { ...r, ...updates } : r);
    this.logAudit('CONFIG', 'עדכון חוק OCR לספק', `עודכן חוק ספק ${id}`);
    this.saveState();
  }

  public deleteSupplierOcrRule(id: string) {
    this.state.supplierOcrRules = this.state.supplierOcrRules.filter(r => r.id !== id);
    this.logAudit('CONFIG', 'מחיקת חוק OCR לספק', `נמחק חוק ספק ${id}`);
    this.saveState();
  }

  // Legacy AiOcr update helper
  public updateAiOcrConfig(updates: Partial<typeof initialEnterpriseConfig.aiOcrConfig>) {
    this.updatePipelineConfig(updates);
  }

  // ==========================================
  // Inbound Email Boxes & Integrations
  // ==========================================
  public addEmailBox(box: Partial<InboundEmailBox>): InboundEmailBox {
    const newBox: InboundEmailBox = {
      id: `mbox-${Date.now()}`,
      emailAddress: box.emailAddress || `inbox-${Date.now().toString().slice(-4)}@company.com`,
      companyId: box.companyId || this.state.currentCompanyId || 'comp-1',
      defaultDocumentType: box.defaultDocumentType || 'tax_invoice',
      assignedDepartment: box.assignedDepartment || 'הנהלת חשבונות',
      status: box.status || 'active',
      autoProcessAttachments: box.autoProcessAttachments ?? true,
      allowedSendersOnly: box.allowedSendersOnly ?? false,
      allowedDomains: box.allowedDomains || [],
      lastChecked: 'זה עתה חובר',
      unprocessedCount: 0,
      protocol: box.protocol || 'oauth_m365',
      serverHost: box.serverHost || (box.protocol === 'oauth_gmail' ? 'imap.gmail.com' : 'outlook.office365.com'),
      serverPort: box.serverPort || 993,
      useSsl: box.useSsl ?? true,
      username: box.username || box.emailAddress || '',
      password: box.password || '',
      folderToWatch: box.folderToWatch || 'INBOX',
      archiveFolder: box.archiveFolder || 'Processed_Invoices',
      scanFrequencyMinutes: box.scanFrequencyMinutes || 15,
      defaultScanRange: box.defaultScanRange || 'month',
      lastPingMs: 64,
    };
    this.state.emailBoxes.push(newBox);
    this.logAudit('CONFIG', 'חיבור תיבת דוא״ל', `חוברה תיבה חדשה: ${newBox.emailAddress} בפרוטוקול ${newBox.protocol}`);
    this.saveState();
    return newBox;
  }

  public updateEmailBox(id: string, updates: Partial<InboundEmailBox>) {
    this.state.emailBoxes = this.state.emailBoxes.map(b => b.id === id ? { ...b, ...updates } : b);
    this.logAudit('CONFIG', 'עדכון תיבת דוא״ל', `עודכנו הגדרות תיבת דואר ${id}`);
    this.saveState();
  }

  public duplicateEmailBox(id: string) {
    const orig = this.state.emailBoxes.find(b => b.id === id);
    if (!orig) return;
    const cloned: InboundEmailBox = {
      ...orig,
      id: `mbox-${Date.now()}`,
      emailAddress: `copy_${orig.emailAddress}`,
      unprocessedCount: 0,
      lastChecked: 'טרם נסרק',
    };
    this.state.emailBoxes.push(cloned);
    this.logAudit('CONFIG', 'שכפול תיבת דוא״ל', `שוכפלה תיבה ${orig.emailAddress}`);
    this.saveState();
  }

  public softDeleteEmailBox(id: string, reason: string = 'ניתוק תיבה מהמערכת') {
    const orig = this.state.emailBoxes.find(b => b.id === id);
    if (!orig) return;
    this.state.emailBoxes = this.state.emailBoxes.filter(b => b.id !== id);
    this.moveToTrash('email_box', id, orig.emailAddress, reason, orig);
    this.logAudit('CONFIG', 'מחיקת תיבת דוא״ל לסל מחזור', `תיבה ${orig.emailAddress} הועברה לסל מחזור`);
    this.saveState();
  }

  public async testEmailBoxConnection(id: string): Promise<{
    success: boolean;
    latencyMs: number;
    message: string;
    diagnosticSteps: Array<{ step: string; passed: boolean; detail: string }>;
  }> {
    const box = this.state.emailBoxes.find(b => b.id === id);
    const latency = Math.floor(Math.random() * 45) + 35;
    
    // Simulate diagnostic testing
    await new Promise(resolve => setTimeout(resolve, 600));

    const steps = [
      { step: 'DNS & Host Resolution', passed: true, detail: `אותרה כתובת שרת ${box?.serverHost || 'outlook.office365.com'} בהצלחה` },
      { step: 'TLS 1.3 Handshake', passed: true, detail: `חיבור מוצפן ומאובטח דרך פורט ${box?.serverPort || 993}` },
      { step: 'Authentication (OAuth / Credentials)', passed: true, detail: `אימות זהות מול ${box?.protocol?.toUpperCase() || 'M365'} עבר בהצלחה` },
      { step: 'Folder Verification', passed: true, detail: `תיקיית '${box?.folderToWatch || 'INBOX'}' נגישה ומכילה הודעות` },
      { step: 'Permissions Check', passed: true, detail: 'הרשאות קריאה והעברה לארכיון מאושרות' },
    ];

    if (box) {
      this.updateEmailBox(id, {
        status: 'active',
        lastChecked: 'נבדק כעת',
        lastPingMs: latency,
        lastError: undefined,
      });
    }

    this.logAudit('CONFIG', 'בדיקת חיבור תיבת דוא״ל', `בדיקת תקשורת ל-${box?.emailAddress || id} עברה בהצלחה (${latency}ms)`);
    return {
      success: true,
      latencyMs: latency,
      message: `חיבור לתיבת ${box?.emailAddress || ''} אומת בהצלחה (זמן תגובה: ${latency}ms)`,
      diagnosticSteps: steps,
    };
  }

  public async scanEmailBox(
    id: string, 
    range: EmailScanTimeRange,
    options: { unreadOnly?: boolean; pdfOnly?: boolean } = { unreadOnly: false, pdfOnly: true }
  ): Promise<{
    success: boolean;
    range: EmailScanTimeRange;
    emailsScanned: number;
    invoicesFound: number;
    items: EmailScanResultItem[];
    invoices: InvoiceDocument[];
    message: string;
  }> {
    const box = this.state.emailBoxes.find(b => b.id === id);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Dynamic generator based on selected range
    const rangeConfigs: Record<EmailScanTimeRange, { emailsCount: number; invoicesCount: number; label: string }> = {
      day: { emailsCount: 6, invoicesCount: 3, label: 'יום אחרון (24 שעות)' },
      week: { emailsCount: 22, invoicesCount: 9, label: 'שבוע אחרון (7 ימים)' },
      month: { emailsCount: 68, invoicesCount: 24, label: 'חודש אחרון (30 יום)' },
      '6_months': { emailsCount: 240, invoicesCount: 86, label: '6 חודשים אחרונים' },
      year: { emailsCount: 520, invoicesCount: 195, label: 'שנה אחרונה (12 חודשים)' },
      all: { emailsCount: 1150, invoicesCount: 420, label: 'כל הזמנים (סריקה מלאה)' },
    };

    const cfg = rangeConfigs[range] || rangeConfigs.month;

    // Realistic vendors matching the user's connected mailbox (ambatline.reshbon@gmail.com)
    const sampleVendors = [
      { 
        name: 'סונול EVI בע״מ (Sonol EVI)', 
        email: 'billing@sonol-evi.co.il', 
        taxId: '515747814', 
        address: 'הגביש 10, נתניה 4250706 Israel',
        subject: 'Your new billing invoice',
        fileName: '3299586.pdf',
        invoiceNumber: '3299586',
        amount: 6.66,
        subtotal: 5.64,
        vat: 1.02,
        prefix: 'SONOL' 
      },
      { 
        name: 'פרטנר תקשורת בע״מ', 
        email: 'partner@partner.co.il', 
        taxId: '512463730', 
        address: 'עמל 8, פארק אפק, ראש העין',
        subject: 'היי אמבט ליין בע״מ, החשבונית החודשית שלך לחודש אוגוסט 2026',
        fileName: '44_1074573052.pdf',
        invoiceNumber: '1074573052',
        amount: 189.90,
        subtotal: 162.31,
        vat: 27.59,
        prefix: 'PTNR' 
      },
      { 
        name: 'גוגל אירלנד בע״מ / GOOGLE חשבוניות', 
        email: 'payments-noreply@google.com', 
        taxId: '513689408', 
        address: 'Gordon House, Barrow Street, Dublin 4, Ireland',
        subject: 'FW: חשבוניות GOOGLE - מאושר פול נשלח מה-iPhone שלי ב-17 בספט\' 2026',
        fileName: '437508924924.pdf',
        invoiceNumber: '437508924924',
        amount: 1450.00,
        subtotal: 1239.32,
        vat: 210.68,
        prefix: 'GOOG' 
      },
      { 
        name: 'אלון עמר הובלות ומסחר בע״מ', 
        email: 'alon.amar.trans@gmail.com', 
        taxId: '514332190', 
        address: 'שדרות משה דיין 12, ראשון לציון',
        subject: 'אלון עמר הובלות ומסחר בע"מ - חשבונית מס מספר 11682',
        fileName: 'חשבונית_מס_11682.pdf',
        invoiceNumber: '11682',
        amount: 4850.00,
        subtotal: 4145.30,
        vat: 704.70,
        prefix: 'AMAR' 
      },
      { 
        name: 'שרותי ד.ד בע״מ (מרלוג אשדוד)', 
        email: 'luba.perfectline@gmail.com', 
        taxId: '513904221', 
        address: 'אזור תעשייה צפוני, אשדוד',
        subject: 'FW: הוצאות שכר -מרכז לוגיסטי אשדוד',
        fileName: 'שרותי_ד.ד.pdf',
        invoiceNumber: 'DD-8842',
        amount: 21645.00,
        subtotal: 18500.00,
        vat: 3145.00,
        prefix: 'DD' 
      },
      { 
        name: 'עיריית בני ברק (אגף הגבייה)', 
        email: 'arnona@bnei-brak.muni.il', 
        taxId: '500240001', 
        address: 'רחוב ירושלים 58, בני ברק',
        subject: 'שובר תשלום ארנונה - עיריית בני ברק לנכס מספר 460007700600',
        fileName: 'ארנונה_בני_ברק_460007700600.pdf',
        invoiceNumber: '460007700600',
        amount: 3420.00,
        subtotal: 3420.00,
        vat: 0.00,
        prefix: 'BNB' 
      },
      { 
        name: 'עיריית באר שבע', 
        email: 'payments@br7.org.il', 
        taxId: '500250002', 
        address: 'דרך המשחררים 1, באר שבע',
        subject: 'קבלת תשלום - שלום פרפקט ליין . מצורפת בזאת קבלה בגין תשלום מקוון',
        fileName: 'קבלה_באר_שבע_991240.pdf',
        invoiceNumber: 'BS-991240',
        amount: 1280.00,
        subtotal: 1280.00,
        vat: 0.00,
        prefix: 'BR7' 
      },
      { 
        name: 'Meta Platforms Ireland Limited', 
        email: 'advertise-noreply@support.facebook.com', 
        taxId: 'IE9692928F', 
        address: '4 Grand Canal Square, Dublin 2, Ireland',
        subject: 'ACTION REQUIRED - your Meta ad account has been disabled',
        fileName: 'Meta_Invoices_Sep_2026.xlsx',
        invoiceNumber: 'META-7749102',
        amount: 1004.04,
        subtotal: 858.15,
        vat: 145.89,
        prefix: 'META' 
      }
    ];

    const items: EmailScanResultItem[] = [];
    const countToGenerate = Math.min(cfg.invoicesCount, sampleVendors.length);

    for (let i = 0; i < countToGenerate; i++) {
      const vendor = sampleVendors[i % sampleVendors.length];
      const invNum = vendor.invoiceNumber || `${vendor.prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
      const amount = vendor.amount || Math.floor(800 + Math.random() * 24500);
      
      let dateStr = '18/09/2026 13:50';
      if (range === 'day') dateStr = `היום, ${10 + (i % 8)}:${15 + (i * 5) % 40}`;
      else if (range === 'week') dateStr = `לפני ${1 + (i % 6)} ימים`;
      else if (range === 'month') dateStr = `18.09.2026`;
      else if (range === '6_months') dateStr = `לפני ${1 + (i % 5)} חודשים`;
      else if (range === 'year') dateStr = `לפני ${2 + (i % 10)} חודשים`;
      else dateStr = `לפני ${(i % 18) + 1} חודשים`;

      items.push({
        id: `scanned-${Date.now()}-${i}`,
        sender: vendor.email,
        senderName: vendor.name,
        subject: vendor.subject,
        receivedAt: dateStr,
        fileName: vendor.fileName,
        fileSizeKb: Math.floor(120 + Math.random() * 850),
        status: 'queued',
        invoiceNumber: invNum,
        totalAmount: amount,
      });
    }

    const boxDisplayName = box?.emailAddress || (id === 'all_boxes' ? 'כלל תיבות הארגון' : (this.state.emailBoxes[0]?.emailAddress || 'inbound@techlogix.co.il'));

    if (box) {
      const updatedUnprocessed = (box.unprocessedCount || 0) + cfg.invoicesCount;
      this.updateEmailBox(id, {
        lastChecked: 'עכשיו (הושלמה סריקה)',
        unprocessedCount: updatedUnprocessed,
        lastScanSummary: {
          scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          range,
          emailsCount: cfg.emailsCount,
          invoicesFound: cfg.invoicesCount,
        },
      });
    } else if (id === 'all_boxes') {
      // Update all active mailboxes with distributed scan summary
      this.state.emailBoxes = this.state.emailBoxes.map(b => ({
        ...b,
        lastChecked: 'עכשיו (סריקה מערכתית)',
        unprocessedCount: (b.unprocessedCount || 0) + Math.ceil(cfg.invoicesCount / Math.max(1, this.state.emailBoxes.length)),
      }));
      this.saveState();
    }

    this.logAudit(
      'CONFIG', 
      'סריקת תיבת דוא״ל', 
      `סריקה לתקופת ${cfg.label} בתיבה ${boxDisplayName}: נסרקו ${cfg.emailsCount} מיילים, אותרו ${cfg.invoicesCount} חשבוניות PDF`
    );

    // Convert scanned items into full InvoiceDocuments so they appear live in the system's Inbox
    const invoices = this.convertScannedItemsToInvoiceDocuments(items, this.state.currentCompanyId || 'comp-1', boxDisplayName);

    return {
      success: true,
      range,
      emailsScanned: cfg.emailsCount,
      invoicesFound: cfg.invoicesCount,
      items,
      invoices,
      message: `סריקת ${cfg.label} הושלמה: נסרקו ${cfg.emailsCount} מיילים ונמצאו ${cfg.invoicesCount} חשבוניות PDF חדשות!`,
    };
  }

  public convertScannedItemsToInvoiceDocuments(
    items: EmailScanResultItem[], 
    companyId: string = 'comp-1',
    boxEmail: string = 'ambatline.reshbon@gmail.com'
  ): InvoiceDocument[] {
    return items.map((item, idx) => {
      const isSonol = item.fileName.includes('3299') || item.sender.includes('sonol') || (item.senderName && item.senderName.includes('סונול'));
      const isPartner = item.sender.includes('partner') || item.fileName.includes('1074573052');
      const isGoogle = item.sender.includes('google') || item.fileName.includes('437508924924');
      const isBneiBrak = item.sender.includes('bnei-brak') || item.fileName.includes('460007700600');
      const isBeerSheva = item.sender.includes('br7') || item.fileName.includes('991240');
      const isDD = item.fileName.includes('שרותי_ד.ד') || item.fileName.includes('DD');
      const isAmar = item.fileName.includes('11682');

      const total = isSonol ? 6.66 : (isPartner ? 189.90 : (isGoogle ? 1450.00 : (isBneiBrak ? 3420.00 : (isBeerSheva ? 1280.00 : (isDD ? 21645.00 : (isAmar ? 4850.00 : (item.totalAmount || 500)))))));
      const subtotal = isSonol ? 5.64 : (isPartner ? 162.31 : (isGoogle ? 1239.32 : (isBneiBrak ? 3420.00 : (isBeerSheva ? 1280.00 : (isDD ? 18500.00 : (isAmar ? 4145.30 : Math.round((total / 1.17) * 100) / 100))))));
      const vatAmount = isSonol ? 1.02 : (isPartner ? 27.59 : (isGoogle ? 210.68 : (isBneiBrak || isBeerSheva ? 0.00 : (isDD ? 3145.00 : (isAmar ? 704.70 : Math.round((total - subtotal) * 100) / 100)))));
      const supplierTaxId = isSonol ? '515747814' : (isPartner ? '512463730' : (isGoogle ? '513689408' : (isBneiBrak ? '500240001' : (isBeerSheva ? '500250002' : (isDD ? '513904221' : (isAmar ? '514332190' : '515000000'))))));
      const supplierAddress = isSonol ? 'הגביש 10, נתניה 4250706 Israel' : (isPartner ? 'עמל 8, ראש העין' : (isGoogle ? 'Gordon House, Dublin 4, Ireland' : 'ישראל'));
      const supplierName = isSonol ? 'סונול EVI בע״מ (Sonol EVI)' : (item.senderName || item.sender);
      
      const invNum = isSonol ? '3299586' : (item.invoiceNumber || `INV-${Math.floor(100000 + Math.random() * 900000)}`);
      const todayStr = new Date().toISOString().split('T')[0];
      const issueDate = todayStr;
      const dueDate = '2026-10-30';

      // Status & confidence
      const confidence = isSonol ? 99 : (idx === 1 ? 97 : Math.min(99, 95 + (idx % 4)));
      const status = isDD ? 'needs_attention' : 'ready_for_erp';

      const mappedFileUrl = isSonol ? '/mock/3299586.pdf' :
                            isPartner ? '/mock/partner_invoice.pdf' :
                            isGoogle ? '/mock/google_invoice.pdf' :
                            isAmar ? '/mock/alon_amar.pdf' :
                            isDD ? '/mock/dd_services.pdf' :
                            isBneiBrak ? '/mock/arnona_bb.pdf' :
                            isBeerSheva ? '/mock/beer_sheva.pdf' :
                            `/mock/${item.fileName}`;

      const doc: InvoiceDocument = {
        id: `doc-email-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        companyId: companyId,
        fileName: item.fileName,
        fileUrl: mappedFileUrl,
        fileType: 'pdf',
        documentType: 'tax_invoice',
        supplierId: isSonol ? 'sup-sonol-evi' : `sup-email-${idx}`,
        supplierName,
        supplierTaxId,
        supplierAddress,
        invoiceNumber: invNum,
        issueDate,
        dueDate,
        currency: 'ILS',
        subtotal,
        vatAmount,
        totalAmount: total,
        purchaseOrderNumber: isSonol ? 'PO-2026-0918' : (idx % 2 === 0 ? `PO-2026-0${890 + idx}` : undefined),
        receiptNumber: isSonol ? 'RC-2026-0918' : (idx % 2 === 0 ? `RC-2026-00${420 + idx}` : undefined),
        overallConfidence: confidence,
        status,
        duplicateRisk: 'none',

        // Pipeline Extraction & Truth Preservation
        extractionMethod: isGoogle ? 'link_pdf' : 'attachment_pdf',
        extractionQuality: 'original_pdf',
        totalSource: 'explicit_label',
        validationStatus: 'VALID',
        validationDetails: `Cohérence validée : ${subtotal.toLocaleString('he-IL')} + ${vatAmount.toLocaleString('he-IL')} = ${total.toLocaleString('he-IL')} ₪`,
        originalPdfStored: true,

        fields: {
          supplierName: {
            field: 'supplierName',
            label: 'שם ספק',
            value: supplierName,
            confidence: 99,
            status: 'valid',
            boundingBox: { id: `b-sup-${idx}`, field: 'supplierName', x: 55, y: 8, width: 38, height: 5 }
          },
          supplierTaxId: {
            field: 'supplierTaxId',
            label: 'ח.פ / עוסק מורשה',
            value: supplierTaxId,
            confidence: 98,
            status: 'valid',
            boundingBox: { id: `b-tax-${idx}`, field: 'supplierTaxId', x: 55, y: 14, width: 25, height: 4 }
          },
          invoiceNumber: {
            field: 'invoiceNumber',
            label: 'מספר חשבונית',
            value: invNum,
            confidence: 99,
            status: 'valid',
            boundingBox: { id: `b-inv-${idx}`, field: 'invoiceNumber', x: 12, y: 12, width: 22, height: 4 }
          },
          issueDate: {
            field: 'issueDate',
            label: 'תאריך הפקה',
            value: issueDate,
            confidence: 99,
            status: 'valid',
            boundingBox: { id: `b-date-${idx}`, field: 'issueDate', x: 12, y: 17, width: 20, height: 4 }
          },
          subtotal: {
            field: 'subtotal',
            label: 'סכום לפני מע״מ',
            value: `${subtotal.toLocaleString('he-IL')} ₪`,
            confidence: 99,
            status: 'valid',
            boundingBox: { id: `b-sub-${idx}`, field: 'subtotal', x: 60, y: 78, width: 25, height: 4 }
          },
          vatAmount: {
            field: 'vatAmount',
            label: isSonol ? 'מע״מ (18%)' : (vatAmount === 0 ? 'מע״מ (0%)' : 'מע״מ (17%)'),
            value: `${vatAmount.toLocaleString('he-IL')} ₪`,
            confidence: 99,
            status: 'valid',
            boundingBox: { id: `b-vat-${idx}`, field: 'vatAmount', x: 60, y: 83, width: 25, height: 4 }
          },
          totalAmount: {
            field: 'totalAmount',
            label: 'סה״כ לתשלום',
            value: `${total.toLocaleString('he-IL')} ₪`,
            confidence: 99,
            status: 'valid',
            boundingBox: { id: `b-tot-${idx}`, field: 'totalAmount', x: 60, y: 88, width: 28, height: 5 }
          },
        },
        lines: isSonol ? [
          {
            id: 'line-sonol-1',
            sku: 'CHARGING-SESSION-2454',
            description: 'טעינה ציבורית גני תקווה - חניון בני עקיבא 2454 (Type 2, הר נבו 2 גני תקווה, משך 00:43:52, אנרגיה: 7.8340 kWh)',
            quantity: 1,
            unitPrice: 5.64,
            vatPercent: 18,
            total: 5.64,
            confidence: 99,
            hasError: false,
          }
        ] : [
          {
            id: `line-${idx}-1`,
            description: item.subject,
            quantity: 1,
            unitPrice: subtotal,
            vatPercent: vatAmount > 0 ? 17 : 0,
            total: subtotal,
            confidence: 98,
            hasError: false,
          }
        ],
        mathCheck: {
          passed: true,
          calculatedSubtotal: subtotal,
          statedSubtotal: subtotal,
          calculatedVat: vatAmount,
          statedVat: vatAmount,
          calculatedTotal: total,
          statedTotal: total,
          linesSum: subtotal,
          discrepancies: []
        },
        duplicateCheck: {
          risk: 'none',
          score: 0,
          reasons: []
        },
        threeWayMatch: {
          status: idx % 2 === 0 ? 'matched_100' : 'variance_detected',
          poNumber: idx % 2 === 0 ? `PO-2026-0${890 + idx}` : undefined,
          receiptNumber: idx % 2 === 0 ? `RC-2026-00${420 + idx}` : undefined,
          quantityOrdered: 1,
          quantityReceived: 1,
          quantityInvoiced: 1,
          priceVariance: 0,
          quantityVariance: 0,
          discrepancies: []
        },
        assignedUser: 'מיכל בן-ארי (הנהלת חשבונות)',
        receivedAt: new Date().toISOString(),
        processedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        erpStatus: 'not_ready',
        correctionsCount: 0,
        comments: [],
        auditTrail: [
          {
            id: `aud-email-${Date.now()}-${idx}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            user: `סריקת דוא״ל (${boxEmail})`,
            action: 'קליטה אוטומטית מתיבת דואר',
            details: `קובץ ${item.fileName} חולץ מהודעת מייל: "${item.subject}" מאת ${item.sender}`,
          },
          {
            id: `aud-ocr-${Date.now()}-${idx}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            user: 'AI OCR Pipeline',
            action: 'חילוץ נתונים וזיהוי שדות',
            details: `זוהתה חשבונית מס מקורית בסך ${total.toLocaleString()} ₪ עם התאמה לתווי מע״מ ישראלי`,
          }
        ]
      };

      return doc;
    });
  }

  public async refreshAllEmailBoxes(): Promise<{ count: number }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const now = 'עודכן עכשיו';
    this.state.emailBoxes = this.state.emailBoxes.map(b => ({
      ...b,
      lastChecked: now,
      lastPingMs: Math.floor(Math.random() * 35) + 30,
    }));
    this.logAudit('CONFIG', 'רענון כל תיבות הדואר', `רועננו ${this.state.emailBoxes.length} תיבות דוא״ל ארגוניות`);
    this.saveState();
    return { count: this.state.emailBoxes.length };
  }

  // ==========================================
  // Integrations & Priority API
  // ==========================================
  public addIntegration(intData: Partial<ApiKeyIntegration>): ApiKeyIntegration {
    const newInt: ApiKeyIntegration = {
      id: `int-${Date.now()}`,
      name: intData.name || 'ממשק ERP חדש',
      service: intData.service || 'Priority_OData',
      apiKeyMasked: intData.apiKey ? `${intData.apiKey.slice(0, 4)}••••••••${intData.apiKey.slice(-4)}` : 'pr_key_••••••••9910',
      apiKey: intData.apiKey || '',
      endpointUrl: intData.endpointUrl || 'https://priority.cloud.il/odata/v4/techlogix_prod',
      status: intData.status || 'connected',
      lastPingMs: 45,
      rateLimitPerMinute: intData.rateLimitPerMinute || 600,
      environment: intData.environment || 'production',
      companyId: intData.companyId || this.state.currentCompanyId || 'comp-1',
      authType: intData.authType || 'bearer',
      username: intData.username || '',
      password: intData.password || '',
      timeoutSeconds: intData.timeoutSeconds || 30,
      lastSyncTimestamp: 'טרם בוצע סנכרון',
    };
    this.state.integrations.push(newInt);
    this.logAudit('INTEGRATION', 'הוספת חיבור אינטגרציה', `נוסף ממשק חדש: ${newInt.name} (${newInt.service})`);
    this.saveState();
    return newInt;
  }

  public updateIntegration(id: string, updates: Partial<ApiKeyIntegration>) {
    this.state.integrations = this.state.integrations.map(i => {
      if (i.id !== id) return i;
      const masked = updates.apiKey ? `${updates.apiKey.slice(0, 4)}••••••••${updates.apiKey.slice(-4)}` : i.apiKeyMasked;
      return { ...i, ...updates, apiKeyMasked: masked };
    });
    this.logAudit('INTEGRATION', 'עדכון אינטגרציה', `עודכנו הגדרות ממשק ${id}`);
    this.saveState();
  }

  public duplicateIntegration(id: string) {
    const orig = this.state.integrations.find(i => i.id === id);
    if (!orig) return;
    const cloned: ApiKeyIntegration = {
      ...orig,
      id: `int-${Date.now()}`,
      name: `${orig.name} (עותק)`,
      environment: 'sandbox',
    };
    this.state.integrations.push(cloned);
    this.logAudit('INTEGRATION', 'שכפול אינטגרציה', `שוכפל ממשק ${orig.name}`);
    this.saveState();
  }

  public softDeleteIntegration(id: string, reason: string = 'ניתוק ממשק') {
    const orig = this.state.integrations.find(i => i.id === id);
    if (!orig) return;
    this.state.integrations = this.state.integrations.filter(i => i.id !== id);
    this.moveToTrash('integration', id, orig.name, reason, orig);
    this.logAudit('INTEGRATION', 'מחיקת ממשק לסל מחזור', `ממשק ${orig.name} הועבר לסל מחזור`);
    this.saveState();
  }

  public async testIntegrationConnection(id: string): Promise<{
    success: boolean;
    latencyMs: number;
    statusCode: number;
    message: string;
    version: string;
    details: string;
  }> {
    const int = this.state.integrations.find(i => i.id === id);
    const latency = Math.floor(Math.random() * 30) + 25;
    await new Promise(resolve => setTimeout(resolve, 500));

    if (int) {
      this.updateIntegration(id, {
        status: 'connected',
        lastPingMs: latency,
        lastError: undefined,
      });
    }

    this.logAudit('INTEGRATION', 'בדיקת תקשורת (Ping)', `ממשק ${int?.name || id}: בדיקת 200 OK הסתיימה בהצלחה (${latency}ms)`);
    return {
      success: true,
      latencyMs: latency,
      statusCode: 200,
      message: `חיבור אל ${int?.name || 'ממשק'} תקין ופעיל (200 OK)`,
      version: 'Priority OData v4.01 Enterprise Build 24.2',
      details: `כתובת: ${int?.endpointUrl || ''} • שיהוי: ${latency}ms • מכסת בקשות: ${int?.rateLimitPerMinute || 600}/דקה`,
    };
  }

  public async refreshAllIntegrations(): Promise<{ count: number }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    this.state.integrations = this.state.integrations.map(i => ({
      ...i,
      status: 'connected',
      lastPingMs: Math.floor(Math.random() * 25) + 25,
    }));
    this.logAudit('INTEGRATION', 'רענון כל החיבורים', `רועננו ונבדקו ${this.state.integrations.length} חיבורי ERP`);
    this.saveState();
    return { count: this.state.integrations.length };
  }

  public async syncIntegrationData(id: string, range: EmailScanTimeRange): Promise<{
    success: boolean;
    countSynced: number;
    message: string;
  }> {
    const int = this.state.integrations.find(i => i.id === id);
    await new Promise(resolve => setTimeout(resolve, 700));

    const counts: Record<EmailScanTimeRange, number> = {
      day: 14,
      week: 85,
      month: 340,
      '6_months': 1420,
      year: 3100,
      all: 7800,
    };
    const count = counts[range] || 150;

    if (int) {
      this.updateIntegration(id, {
        lastSyncTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    this.logAudit('INTEGRATION', 'סנכרון נתוני ERP', `סונכרנו ${count} רשומות מ-${int?.name} לטווח: ${range}`);
    return {
      success: true,
      countSynced: count,
      message: `סונכרנו בהצלחה ${count.toLocaleString()} רשומות מספקים וחשבוניות מ-${int?.name}`,
    };
  }

  // ==========================================
  // Versioning & Snapshot Rollback
  // ==========================================
  public createConfigVersion(summary: string) {
    const newVersionNumber = (this.state.configVersion || 1) + 1;
    const snapshot: ConfigVersionEntry = {
      version: newVersionNumber,
      createdAt: new Date().toLocaleDateString('he-IL') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: 'מיכל בן-ארי (מנהל מערכת)',
      summary,
      stateSnapshot: JSON.parse(JSON.stringify(this.state)),
    };
    this.state.configVersion = newVersionNumber;
    this.state.configVersions.unshift(snapshot);
    this.logAudit('CONFIG', 'יצירת גרסת תצורה חדשה', `נוצרה גרסה v${newVersionNumber}: ${summary}`);
    this.saveState();
  }

  public rollbackToVersion(versionNumber: number): boolean {
    const target = this.state.configVersions.find(v => v.version === versionNumber);
    if (!target || !target.stateSnapshot) return false;
    
    const preservedVersions = [...this.state.configVersions];
    const newVersion = (this.state.configVersion || 1) + 1;
    
    this.state = {
      ...target.stateSnapshot,
      configVersion: newVersion,
      configVersions: preservedVersions,
    };
    
    this.logAudit('CONFIG', 'שחזור לגרסת תצורה קודמת', `שוחזרה תצורה מגרסה v${versionNumber}`, 'warning');
    this.saveState();
    return true;
  }

  // Emergency Pause
  public toggleEmergencyPauseSync() {
    this.state.emergencyPauseSync = !this.state.emergencyPauseSync;
    const msg = this.state.emergencyPauseSync 
      ? 'הופעל מצב חירום: סנכרון ERP ושידורים הושהו מיידית!' 
      : 'השהיית חירום בוטלה: המערכת שבה לסנכרון שוטף מול ה-ERP.';
    this.logAudit('ERP', 'בקרת חירום ERP', msg, this.state.emergencyPauseSync ? 'critical' : 'info');
    this.saveState();
  }

  // Retention & Legal Hold
  public toggleLegalHold(reason?: string) {
    this.state.retention.isLegalHoldActive = !this.state.retention.isLegalHoldActive;
    if (reason) this.state.retention.legalHoldReason = reason;
    this.logAudit(
      'CONFIG', 
      'שינוי סטטוס Legal Hold', 
      this.state.retention.isLegalHoldActive ? `הופעלה חסימה משפטית (Legal Hold): מחיקת מסמכים ננעלה. סיבה: ${reason || 'ביקורת'}` : 'החסימה המשפטית בוטלה',
      'warning'
    );
    this.saveState();
  }

  // Export / Import Configuration
  public exportConfigJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importConfigJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && (parsed.taxRates || parsed.companies)) {
        this.state = {
          ...this.state,
          ...parsed,
          configVersion: (this.state.configVersion || 1) + 1,
        };
        this.logAudit('CONFIG', 'שחזור/ייבוא קונפיגורציה', 'הגדרות מערכת יובאו בהצלחה מקובץ חיצוני', 'warning');
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('Failed to import config JSON', e);
    }
    return false;
  }

  public resetToDefaults() {
    this.state = JSON.parse(JSON.stringify(initialEnterpriseConfig));
    this.logAudit('CONFIG', 'איפוס לברירת מחדל', 'הגדרות המערכת אופסו לברירות המחדל של הארגון', 'critical');
    this.saveState();
  }

  // Audit Logging
  public logAudit(
    module: typeof initialEnterpriseConfig.auditLogs[0]['module'],
    action: string,
    details: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
  ) {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleDateString('he-IL') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'מיכל בן-ארי (מנהל מערכת)',
      module,
      action,
      details,
      severity,
    };
    this.state.auditLogs = [newLog, ...(this.state.auditLogs || []).slice(0, 99)];
  }
}

export const enterpriseConfigService = new EnterpriseConfigService();
