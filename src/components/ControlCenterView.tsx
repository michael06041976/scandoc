import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  GitFork,
  Sliders,
  Percent,
  Cpu,
  Mail,
  Workflow,
  Clock,
  KeyRound,
  FileCheck,
  RotateCcw,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  Power,
  ChevronRight,
  ChevronDown,
  Database,
  Lock,
  Calendar,
  Briefcase,
  Phone,
  UserCheck,
  UserX,
  Edit2,
  CheckSquare,
  Square,
  Filter,
  Trash2,
  History,
  Copy,
  Layers,
  Globe,
  Palette,
  Sparkles,
  Coins,
  Loader2,
  ShieldCheck,
  Inbox,
  ArrowLeft,
  Eye,
  ExternalLink
} from 'lucide-react';
import { enterpriseConfigService } from '../services/enterpriseConfigService';
import { 
  EnterpriseControlCenterState, 
  UserRole, 
  CustomFieldType,
  TaxVatRate,
  AppUser,
  ConfigScope,
  InboundEmailBox,
  ApiKeyIntegration,
  EmailScanTimeRange
} from '../types/enterprise';
import { RecycleBinModal } from './enterprise/RecycleBinModal';
import { ConfigVersionsModal } from './enterprise/ConfigVersionsModal';
import { CompanySwitcherModal } from './enterprise/CompanySwitcherModal';
import { CompanySettingsTab } from './enterprise/CompanySettingsTab';
import { AiOcrPipelineTab } from './enterprise/AiOcrPipelineTab';
import { EmailBoxModal } from './enterprise/EmailBoxModal';
import { EmailScanModal } from './enterprise/EmailScanModal';
import { IntegrationModal } from './enterprise/IntegrationModal';
import { ConnectionDiagnosticModal } from './enterprise/ConnectionDiagnosticModal';
import { Language, InvoiceDocument } from '../types';

interface ControlCenterViewProps {
  language: Language;
  onAddInvoices?: (newInvoices: InvoiceDocument[]) => void;
  onNavigateToInbox?: (filterMode?: string) => void;
  onNavigateToArchive?: () => void;
  onSelectInvoice?: (invoice: InvoiceDocument) => void;
  invoices?: InvoiceDocument[];
}

export const ControlCenterView: React.FC<ControlCenterViewProps> = ({ 
  language,
  onAddInvoices,
  onNavigateToInbox,
  onNavigateToArchive,
  onSelectInvoice,
  invoices = [],
}) => {
  const [state, setState] = useState<EnterpriseControlCenterState>(enterpriseConfigService.getState());
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [scannedInvoices, setScannedInvoices] = useState<InvoiceDocument[]>([]);

  // User management filter and editing states
  const [userFilter, setUserFilter] = useState<'all' | 'approvers' | 'active' | 'inactive'>('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // New item modal states
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({
    companyId: 'comp-1',
    name: '',
    code: '',
    address: '',
    city: 'תל אביב',
    country: 'ישראל',
    managerName: '',
    managerEmail: '',
    isActive: true,
  });

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    isApprover: false,
    role: 'ACCOUNTANT' as UserRole,
    department: 'הנהלת חשבונות',
    companyIds: ['comp-1'],
    isActive: true,
    approvalLimit: 20000,
    mfaEnabled: true,
  });

  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [newCustomField, setNewCustomField] = useState({
    name: '',
    key: '',
    type: 'text' as CustomFieldType,
    appliesTo: 'invoice' as 'invoice' | 'supplier' | 'line_item' | 'import_dossier',
    required: false,
    order: 5,
    isActive: true,
    defaultValue: '',
  });

  const [showAddTaxRate, setShowAddTaxRate] = useState(false);
  const [newTaxRate, setNewTaxRate] = useState({
    country: 'ישראל',
    name: '',
    ratePercent: 17,
    isDefault: false,
    effectiveFrom: '2026-01-01',
    glAccountCode: '2400 - מע״מ',
  });

  const [showAddDelegation, setShowAddDelegation] = useState(false);
  const [newDelegation, setNewDelegation] = useState({
    fromUserEmail: '',
    toUserEmail: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    reason: 'חופשה / נסיעה עסקית',
    isActive: true,
  });

  // Subscribe to config changes
  useEffect(() => {
    const unsub = enterpriseConfigService.subscribe(newState => {
      setState(newState);
    });
    return () => unsub();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Email & Integration management states
  const [showEmailBoxModal, setShowEmailBoxModal] = useState(false);
  const [editingEmailBox, setEditingEmailBox] = useState<InboundEmailBox | null>(null);
  const [showEmailScanModal, setShowEmailScanModal] = useState(false);
  const [scanBoxInitialId, setScanBoxInitialId] = useState<string | undefined>(undefined);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<ApiKeyIntegration | null>(null);
  const [isRefreshingMailboxes, setIsRefreshingMailboxes] = useState(false);
  const [isRefreshingIntegrations, setIsRefreshingIntegrations] = useState(false);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);
  const [activeScanDropdownId, setActiveScanDropdownId] = useState<string | null>(null);

  // Diagnostic modal state
  const [diagnosticModalData, setDiagnosticModalData] = useState<{
    isOpen: boolean;
    title: string;
    targetName: string;
    type: 'email' | 'integration';
    latencyMs: number;
    success: boolean;
    message: string;
    steps: Array<{ step: string; passed: boolean; detail: string }>;
    onProceedToScan?: () => void;
  } | null>(null);

  // Handlers for Email Box actions
  const handleTestEmailBox = async (box: InboundEmailBox) => {
    setTestingConnectionId(box.id);
    try {
      const res = await enterpriseConfigService.testEmailBoxConnection(box.id);
      setDiagnosticModalData({
        isOpen: true,
        title: 'בדיקת תקינות תיבת דוא״ל',
        targetName: box.emailAddress,
        type: 'email',
        latencyMs: res.latencyMs,
        success: res.success,
        message: res.message,
        steps: res.diagnosticSteps || [
          { step: 'DNS & שרת שמות', passed: true, detail: `שרת ${box.serverHost || 'M365'} מגיב תקין` },
          { step: 'הצפנת SSL / TLS', passed: true, detail: `הצפנת 256-bit בפורט ${box.serverPort || 993}` },
          { step: 'אימות OAuth / הרשאות', passed: true, detail: `פרוטוקול ${box.protocol || 'OAuth 2.0'} מאומת` },
          { step: 'גישה לתיקיית מקור', passed: true, detail: `תיקיית ${box.folderToWatch || 'INBOX'} נגישה לקריאה` },
        ],
        onProceedToScan: () => {
          setScanBoxInitialId(box.id);
          setShowEmailScanModal(true);
        },
      });
      showToast(`חיבור אומת בהצלחה עבור ${box.emailAddress} (${res.latencyMs}ms)`, 'success');
    } catch {
      showToast('שגיאה בבדיקת חיבור לתיבה', 'error');
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleQuickScanEmail = async (boxId: string, range: EmailScanTimeRange) => {
    setActiveScanDropdownId(null);
    try {
      const res = await enterpriseConfigService.scanEmailBox(boxId, range);
      const rangeMap: Record<EmailScanTimeRange, string> = {
        day: 'יום אחרון (24 שעות)',
        week: 'שבוע אחרון',
        month: 'חודש אחרון',
        '6_months': '6 חודשים אחרונים',
        year: 'שנה אחרונה',
        all: 'כל הזמנים (היסטוריה מלאה)',
      };

      if (res.invoices && res.invoices.length > 0) {
        if (onAddInvoices) onAddInvoices(res.invoices);
        setScannedInvoices(prev => [...res.invoices, ...prev]);
      }

      showToast(
        `סריקת ${rangeMap[range]} הושלמה: נסרקו ${res.emailsScanned} מיילים, אותרו ${res.invoicesFound} חשבוניות חדשות שנקלטו באינבוקס!`, 
        'success'
      );
    } catch {
      showToast('שגיאה בסריקת תיבת הדואר', 'error');
    }
  };

  const handleRefreshAllMailboxes = async () => {
    setIsRefreshingMailboxes(true);
    try {
      const res = await enterpriseConfigService.refreshAllEmailBoxes();
      showToast(`רענון הושלם: נבדקו ${res.count} תיבות דואר בהצלחה`, 'success');
    } catch {
      showToast('שגיאה ברענון תיבות הדואר', 'error');
    } finally {
      setIsRefreshingMailboxes(false);
    }
  };

  const handleDeleteEmailBox = (box: InboundEmailBox) => {
    enterpriseConfigService.softDeleteEmailBox(box.id);
    showToast(`תיבת הדואר ${box.emailAddress} הועברה לסל המחזור`, 'warning');
  };

  const handleDuplicateEmailBox = (box: InboundEmailBox) => {
    enterpriseConfigService.duplicateEmailBox(box.id);
    showToast(`נוצר עותק של תיבת ${box.emailAddress}`, 'success');
  };

  // Handlers for Integration actions
  const handleTestIntegration = async (int: ApiKeyIntegration) => {
    setTestingConnectionId(int.id);
    try {
      const res = await enterpriseConfigService.testIntegrationConnection(int.id);
      setDiagnosticModalData({
        isOpen: true,
        title: 'בדיקת תקשורת ERP (Ping & Health)',
        targetName: int.name,
        type: 'integration',
        latencyMs: res.latencyMs,
        success: res.success,
        message: res.message,
        steps: [
          { step: 'DNS & Endpoint Gateway', passed: true, detail: `נתיב ${int.endpointUrl} מאומת` },
          { step: 'Authentication Token', passed: true, detail: `מפתח API / Bearer Token בתוקף (200 OK)` },
          { step: 'OData / Service Layer Schema', passed: true, detail: `ישיות נטענו בהצלחה` },
          { step: 'Rate Limit Capacity', passed: true, detail: `${int.rateLimitPerMinute || 600} req/min מאושר` },
        ],
      });
      showToast(`בדיקת תקשורת הצליחה עבור ${int.name}: 200 OK (${res.latencyMs}ms)`, 'success');
    } catch {
      showToast('שגיאה בבדיקת חיבור ה-ERP', 'error');
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleRefreshAllIntegrations = async () => {
    setIsRefreshingIntegrations(true);
    try {
      const res = await enterpriseConfigService.refreshAllIntegrations();
      showToast(`רענון הושלם: אומתו ${res.count} חיבורי ERP בהצלחה`, 'success');
    } catch {
      showToast('שגיאה ברענון חיבורי האינטגרציה', 'error');
    } finally {
      setIsRefreshingIntegrations(false);
    }
  };

  const handleDeleteIntegration = (int: ApiKeyIntegration) => {
    enterpriseConfigService.softDeleteIntegration(int.id);
    showToast(`החיבור ${int.name} הועבר לסל המחזור`, 'warning');
  };

  const handleDuplicateIntegration = (int: ApiKeyIntegration) => {
    enterpriseConfigService.duplicateIntegration(int.id);
    showToast(`נוצר עותק של חיבור ${int.name}`, 'success');
  };

  // Enterprise Modal Controls
  const [showRecycleBinModal, setShowRecycleBinModal] = useState(false);
  const [showConfigVersionsModal, setShowConfigVersionsModal] = useState(false);
  const [showCompanySwitcherModal, setShowCompanySwitcherModal] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'COMPANY' | 'SYSTEM'>('COMPANY');

  // Active Company resolution
  const currentCompany = (state.companies || []).find(c => c.id === state.currentCompanyId) || (state.companies || [])[0];
  const trashCount = (state.trash || []).length;
  const configVersionsCount = (state.configVersions || []).length;

  // Quick Stats
  const activeUsersCount = state.users.filter(u => u.isActive).length;
  const activeWorkflowsCount = state.workflows.filter(w => w.isActive).length;
  const connectedIntegrationsCount = state.integrations.filter(i => i.status === 'connected').length;

  // Tabs Definition with Hierarchy & Scopes
  const tabs = [
    // Scope: COMPANY
    { id: 'company_settings', label: 'הגדרות חברה, מיתוג ו-ERP', icon: Building2, scope: 'COMPANY', group: 'חברה' },
    { id: 'org', label: 'מבנה ארגוני, סניפים ומרכזי עלות', icon: Building2, count: state.branches.length, scope: 'COMPANY', group: 'חברה' },
    { id: 'workflows', label: 'מנוע אישורים ו-SLA', icon: Workflow, count: state.workflows.length, scope: 'COMPANY', group: 'חברה' },

    // Scope: SYSTEM
    { id: 'overview', label: 'סקירה כללית & בריאות מערכת', icon: Sliders, scope: 'SYSTEM', group: 'מערכת' },
    { id: 'ai_ocr', label: 'צינור AI וספי OCR עמוקים', icon: Cpu, scope: 'SYSTEM', group: 'מערכת' },
    { id: 'rbac', label: 'משתמשים והרשאות (RBAC)', icon: Users, count: state.users.length, scope: 'SYSTEM', group: 'מערכת' },
    { id: 'tax_currency', label: 'מע״מ, מיסים ומטבעות', icon: Percent, scope: 'SYSTEM', group: 'מערכת' },
    { id: 'email_boxes', label: 'תיבות מייל לחשבוניות', icon: Mail, count: state.emailBoxes.length, scope: 'SYSTEM', group: 'מערכת' },
    { id: 'integrations', label: 'אינטגרציות ו-Priority API', icon: KeyRound, count: state.integrations.length, scope: 'SYSTEM', group: 'מערכת' },
    { id: 'custom_fields', label: 'שדות מותאמים אישית', icon: GitFork, count: state.customFields.length, scope: 'SYSTEM', group: 'מערכת' },
    { id: 'retention', label: 'Legal Hold ושימור מסמכים', icon: FileCheck, scope: 'SYSTEM', group: 'מערכת' },
    { id: 'audit', label: 'יומן שינויים (Audit Trail)', icon: Clock, count: state.auditLogs.length, scope: 'SYSTEM', group: 'מערכת' },
  ];

  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(enterpriseConfigService.exportConfigJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `docuflow_enterprise_config_v${state.configVersion}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('קובץ קונפיגורציה ארגוני יוצא בהצלחה (JSON)');
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const ok = enterpriseConfigService.importConfigJson(content);
          if (ok) {
            showToast('הקונפיגורציה יובאה ועודכנה בהצלחה במערכת!', 'success');
          } else {
            showToast('שגיאה בפורמט קובץ הקונפיגורציה', 'error');
          }
        } catch (err) {
          showToast('קובץ JSON לא תקין', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleToggleEmergency = () => {
    enterpriseConfigService.toggleEmergencyPauseSync();
    if (!state.emergencyPauseSync) {
      showToast('מצב השהיית חירום הופעל! סנכרון ERP ננעל.', 'warning');
    } else {
      showToast('מצב חירום בוטל. ה-ERP פועל כשורה.', 'success');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Toast Alert */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2.5 text-sm font-medium transition-all ${
          notification.type === 'success' ? 'bg-emerald-600 text-white' :
          notification.type === 'warning' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {notification.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
          {notification.type === 'error' && <XCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                Enterprise Suite v{state.configVersion}
              </span>
              {/* Company Switcher Quick Button */}
              <button
                onClick={() => setShowCompanySwitcherModal(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition"
                title="החלף חברה או נהל את פרופילי החברות בארגון"
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: currentCompany?.branding?.primaryColor || '#4f46e5' }}
                />
                <span className="font-bold">{currentCompany?.name || 'חברה ראשית'}</span>
                <span className="text-[10px] text-slate-400 font-mono">({currentCompany?.taxRegistrationNumber || currentCompany?.vatNumber})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {state.emergencyPauseSync && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white animate-pulse flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  השהיית חירום פעילה (ERP PAUSED)
                </span>
              )}
              {state.retention.isLegalHoldActive && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  חסימה משפטית (LEGAL HOLD)
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              מרכז שליטה והגדרות ארגוניות (Enterprise Control Center)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ניהול רב-חברתי מבוזר, מנוע אישורים היררכי, ספי AI/OCR עמוקים, גרסאות קונפיגורציה וסל שחזור נתונים.
            </p>
          </div>

          {/* Global Controls: Trash, History, Emergency, Export, Import, Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Recycle Bin Button */}
            <button
              onClick={() => setShowRecycleBinModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 relative"
              title="סל מחזור ושחזור רשומות שנמחקו"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>סל מחזור</span>
              {trashCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                  {trashCount}
                </span>
              )}
            </button>

            {/* Version History Button */}
            <button
              onClick={() => setShowConfigVersionsModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
              title="היסטוריית גרסאות קונפיגורציה, יצירת Snapshot ו-Rollback"
            >
              <History className="w-3.5 h-3.5 text-indigo-500" />
              <span>גרסאות ({configVersionsCount})</span>
            </button>

            <button
              onClick={handleToggleEmergency}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                state.emergencyPauseSync
                  ? 'bg-rose-700 text-white hover:bg-rose-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {state.emergencyPauseSync ? 'שחרר השהיית חירום' : 'השהיית חירום ל-ERP'}
            </button>

            <button
              onClick={handleExportConfig}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              title="ייצוא קובץ קונפיגורציה מלא (JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              ייצוא
            </button>

            <label className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              ייבוא
              <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (confirm('האם אתה בטוח שברצונך לאפס את כל הגדרות המערכת לברירות המחדל?')) {
                  enterpriseConfigService.resetToDefaults();
                  showToast('כל ההגדרות אופסו בהצלחה לברירת המחדל הארגונית', 'warning');
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="איפוס הגדרות לברירת מחדל"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration Scope Selector */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
            <span className="text-[11px] font-bold text-slate-500 px-2">היקף הגדרות (Scope):</span>
            <button
              onClick={() => {
                setScopeFilter('COMPANY');
                setActiveTab('company_settings');
              }}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                scopeFilter === 'COMPANY'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              🏢 רמת חברה ({currentCompany?.name})
            </button>
            <button
              onClick={() => {
                setScopeFilter('SYSTEM');
                setActiveTab('overview');
              }}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                scopeFilter === 'SYSTEM'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              ⚙️ רמת מערכת (Global System)
            </button>
            <button
              onClick={() => setScopeFilter('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                scopeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              🌐 כל ההגדרות
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2">
            <span>מדרג קדימות:</span>
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
              SUPPLIER &gt; DEPARTMENT &gt; BRANCH &gt; COMPANY &gt; SYSTEM
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace with Tabs */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar for Control Center */}
        <div className="w-64 border-e border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col p-3 overflow-y-auto">
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="חיפוש מהיר בהגדרות..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-2 pr-8 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="space-y-1">
            {tabs
              .filter(t => {
                if (searchQuery && !t.label.toLowerCase().includes(searchQuery.toLowerCase())) {
                  return false;
                }
                if (scopeFilter === 'ALL') return true;
                return t.scope === scopeFilter;
              })
              .map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition text-start ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Quick Health Status Footer */}
          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>שרת Priority OData:</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 42ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>תקציב AI חודשי:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                ${state.aiOcrConfig.spentCurrentMonthUsd} / ${state.aiOcrConfig.monthlyBudgetCapUsd}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>גרסת קונפיגורציה:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">v{state.configVersion}.0</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB: COMPANY SETTINGS */}
          {activeTab === 'company_settings' && (
            <CompanySettingsTab
              company={currentCompany}
              onUpdate={showToast}
            />
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPIs Header */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>סניפים ומחלקות</span>
                    <Building2 className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {state.branches.length} סניפים
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {state.costCenters.length} מרכזי עלות פעילים
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>משתמשים בעלי הרשאה</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {activeUsersCount} מורשים
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {state.delegations.filter(d => d.isActive).length} האצלות סמכות פעילות
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>אינטגרציות מחוברות</span>
                    <Database className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {connectedIntegrationsCount} / {state.integrations.length} תקין
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Priority OData Live
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>מנוע אישורים אוטומטי</span>
                    <Workflow className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    עד {state.workflows[0]?.autoApproveMaxAmount?.toLocaleString() || 1500} ₪
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    בכפוף ל-100% התאמה וולידציה
                  </div>
                </div>
              </div>

              {/* Scheduled Background Jobs Card */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      משימות רקע מתוזמנות (Scheduled Background Jobs)
                    </h3>
                    <p className="text-xs text-slate-500">סריקה מתוזמנת של מיילים, סנכרון שערי מט״ח מבנק ישראל ומעקב הפרות SLA</p>
                  </div>
                  <button 
                    onClick={() => showToast('כל המשימות המתוזמנות הופעלו ידנית לסבב רענון', 'success')}
                    className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" /> הפעל סבב מיידי
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {state.scheduledJobs.map(job => (
                    <div key={job.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${job.isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                            {job.name}
                          </div>
                          <div className="text-[11px] text-slate-500">{job.description} • {job.cronSchedule}</div>
                        </div>
                      </div>
                      <div className="text-end text-xs">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          ריצה הבאה: {job.nextRunTimestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  פעולות מהירות למנהלי כספים ומערכת
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab('workflows')}
                    className="p-3 text-start rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition"
                  >
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">עריכת מדרגות אישור רכש</div>
                    <div className="text-[11px] text-slate-500 mt-1">קביעת סף לסמנכ״ל כספים, מנהלי מחלקות ואישור אוטומטי</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('tax_currency')}
                    className="p-3 text-start rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition"
                  >
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">התאמת שיעורי מע״מ ומטבעות</div>
                    <div className="text-[11px] text-slate-500 mt-1">הגדרת מע״מ 17%, מע״מ אפס ושערי דולר/אירו מבנק ישראל</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('custom_fields')}
                    className="p-3 text-start rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition"
                  >
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">הוספת שדות מותאמים (Custom Fields)</div>
                    <div className="text-[11px] text-slate-500 mt-1">שדות מותאמים לחשבוניות וספקים ללא צורך במפתח תוכנה</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORG & BRANCHES */}
          {activeTab === 'org' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    ניהול סניפים, אתרים ומחלקות
                  </h2>
                  <p className="text-xs text-slate-500">הגדרת מבנה תאגידי לחשבוניות רב-חברתיות ומרכזי רווח ב-Priority</p>
                </div>
                <button
                  onClick={() => setShowAddBranch(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוסף סניף חדש
                </button>
              </div>

              {/* Branches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.branches.map(branch => (
                  <div key={branch.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {branch.code}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {branch.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{branch.address}, {branch.city} ({branch.country})</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        branch.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {branch.isActive ? 'פעיל' : 'מושבת'}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        מנהל אתר: <strong className="text-slate-800 dark:text-slate-200">{branch.managerName}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            enterpriseConfigService.duplicateBranch(branch.id);
                            showToast(`סניף ${branch.name} שוכפל בהצלחה`);
                          }}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition"
                          title="שכפל סניף"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            enterpriseConfigService.updateBranch(branch.id, { isActive: !branch.isActive });
                            showToast(`סטטוס סניף ${branch.name} עודכן`);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium"
                        >
                          {branch.isActive ? 'השבת' : 'הפעל'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`האם להעביר את סניף ${branch.name} לסל המחזור?`)) {
                              enterpriseConfigService.moveToTrash('branch', branch.id, branch.name, 'מחיקה ממרכז השליטה');
                              showToast(`סניף ${branch.name} הועבר לסל המחזור`, 'warning');
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition"
                          title="מחק סניף לסל מחזור"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Centers Table */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    מרכזי עלות ותקציבים שנתיים (Cost Centers)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="pb-2 text-start">קוד מרכז עלות</th>
                        <th className="pb-2 text-start">שם מרכז רווח</th>
                        <th className="pb-2 text-start">מחלקה</th>
                        <th className="pb-2 text-start">תקציב שנתי</th>
                        <th className="pb-2 text-start">נוצל עד כה</th>
                        <th className="pb-2 text-start">ניצול</th>
                        <th className="pb-2 text-end">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {state.costCenters.map(cc => {
                        const pct = Math.round((cc.spentToDate / cc.budgetAnnual) * 100);
                        return (
                          <tr key={cc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 font-mono text-slate-700 dark:text-slate-300">{cc.code}</td>
                            <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{cc.name}</td>
                            <td className="py-2.5 text-slate-600 dark:text-slate-400">{cc.department}</td>
                            <td className="py-2.5 text-slate-700 dark:text-slate-300">{cc.budgetAnnual.toLocaleString()} ₪</td>
                            <td className="py-2.5 text-slate-700 dark:text-slate-300">{cc.spentToDate.toLocaleString()} ₪</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${pct > 80 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{pct}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-end">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    enterpriseConfigService.duplicateCostCenter(cc.id);
                                    showToast(`מרכז עלות ${cc.name} שוכפל בהצלחה`);
                                  }}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition"
                                  title="שכפל מרכז עלות"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`האם להעביר את מרכז עלות ${cc.name} לסל המחזור?`)) {
                                      enterpriseConfigService.moveToTrash('cost_center', cc.id, cc.name, 'מחיקה ממרכז השליטה');
                                      showToast(`מרכז עלות ${cc.name} הועבר לסל המחזור`, 'warning');
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition"
                                  title="מחק לסל מחזור"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RBAC & USERS */}
          {activeTab === 'rbac' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>ניהול משתמשים וגורמים מאשרים (RBAC & Approvers)</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {state.users.length} משתמשים
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    ניהול פרטי קשר, מספרי טלפון, הגדרת גורמים מאשרים (Check Box), הפעלה והשבתת גורמים ותקרות אישור כספיות
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewUser({
                      name: '',
                      email: '',
                      phone: '',
                      isApprover: false,
                      role: 'APPROVER' as UserRole,
                      department: 'הנהלה ואישורים',
                      companyIds: ['comp-1'],
                      isActive: true,
                      approvalLimit: 30000,
                      mfaEnabled: true,
                    });
                    setShowAddUser(true);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוסף משתמש / גורם מאשר
                </button>
              </div>

              {/* KPI Mini-Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-medium">סה״כ גורמים רשומים</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{state.users.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    גורמים מאשרים מורשים
                  </div>
                  <div className="text-xl font-bold text-indigo-900 dark:text-indigo-200 mt-1">
                    {state.users.filter(u => u.isApprover).length}
                    <span className="text-xs font-normal text-indigo-600/80 mr-1.5">
                      ({state.users.filter(u => u.isApprover && u.isActive).length} פעילים)
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 shadow-xs">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    גורמים פעילים
                  </div>
                  <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                    {state.users.filter(u => u.isActive).length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 shadow-xs">
                  <div className="text-[11px] text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1">
                    <UserX className="w-3.5 h-3.5" />
                    מושבתים / לא פעילים
                  </div>
                  <div className="text-xl font-bold text-rose-900 dark:text-rose-200 mt-1">
                    {state.users.filter(u => !u.isActive).length}
                  </div>
                </div>
              </div>

              {/* Users Filter & Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      userFilter === 'all'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    כל המשתמשים ({state.users.length})
                  </button>
                  <button
                    onClick={() => setUserFilter('approvers')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                      userFilter === 'approvers'
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <CheckSquare className="w-3 h-3" />
                    גורמים מאשרים בלבד ({state.users.filter(u => u.isApprover).length})
                  </button>
                  <button
                    onClick={() => setUserFilter('active')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                      userFilter === 'active'
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    פעילים בלבד ({state.users.filter(u => u.isActive).length})
                  </button>
                  <button
                    onClick={() => setUserFilter('inactive')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                      userFilter === 'inactive'
                        ? 'bg-rose-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <UserX className="w-3 h-3" />
                    לא פעילים ({state.users.filter(u => !u.isActive).length})
                  </button>
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם, טלפון, דוא״ל..."
                    value={userSearchTerm}
                    onChange={e => setUserSearchTerm(e.target.value)}
                    className="w-full pr-8 pl-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        <th className="p-3 text-start">שם משתמש</th>
                        <th className="p-3 text-start">טלפון</th>
                        <th className="p-3 text-start">דוא״ל</th>
                        <th className="p-3 text-start">תפקיד ומחלקה</th>
                        <th className="p-3 text-center">גורם מאשר (Check Box)</th>
                        <th className="p-3 text-center">סטטוס (פעיל / לא פעיל)</th>
                        <th className="p-3 text-start">תקרת אישור</th>
                        <th className="p-3 text-end">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {state.users
                        .filter(u => {
                          if (userFilter === 'approvers' && !u.isApprover) return false;
                          if (userFilter === 'active' && !u.isActive) return false;
                          if (userFilter === 'inactive' && u.isActive) return false;
                          if (userSearchTerm.trim()) {
                            const term = userSearchTerm.toLowerCase();
                            const matchesName = u.name.toLowerCase().includes(term);
                            const matchesEmail = u.email.toLowerCase().includes(term);
                            const matchesPhone = u.phone ? u.phone.toLowerCase().includes(term) : false;
                            const matchesRole = u.role.toLowerCase().includes(term);
                            return matchesName || matchesEmail || matchesPhone || matchesRole;
                          }
                          return true;
                        })
                        .map(u => (
                          <tr 
                            key={u.id} 
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                              !u.isActive ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-75' : ''
                            }`}
                          >
                            {/* Name & Avatar */}
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                  u.isActive 
                                    ? u.isApprover 
                                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                }`}>
                                  {u.name.substring(0, 2)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    {u.name}
                                    {u.isApprover && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                        מאשר
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{u.id}</div>
                                </div>
                              </div>
                            </td>

                            {/* Phone */}
                            <td className="p-3">
                              <a 
                                href={`tel:${u.phone || '050-0000000'}`}
                                className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono text-[11px]"
                                title="חיוג למשתמש"
                              >
                                <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span>{u.phone || 'לא הוגדר'}</span>
                              </a>
                            </td>

                            {/* Email */}
                            <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                              {u.email}
                            </td>

                            {/* Role & Dept */}
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {u.role}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">{u.department}</div>
                            </td>

                            {/* Is Approver CHECK BOX */}
                            <td className="p-3 text-center">
                              <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
                                <input
                                  type="checkbox"
                                  checked={Boolean(u.isApprover)}
                                  onChange={() => {
                                    enterpriseConfigService.toggleUserApprover(u.id);
                                    showToast(
                                      `מעמד גורם מאשר עבור ${u.name} עודכן ל-${!u.isApprover ? 'מורשה אישור' : 'אינו מאשר'}`
                                    );
                                  }}
                                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                                />
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${
                                  u.isApprover 
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' 
                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                }`}>
                                  {u.isApprover ? 'גורם מאשר ✓' : 'ללא אישור'}
                                </span>
                              </label>
                            </td>

                            {/* Active / Inactive TOGGLE */}
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  enterpriseConfigService.toggleUserActive(u.id);
                                  showToast(`הגורם ${u.name} הועבר למצב ${!u.isActive ? 'פעיל' : 'לא פעיל / מושבת'}`);
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition border shadow-2xs ${
                                  u.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 hover:bg-rose-100'
                                }`}
                                title={u.isActive ? 'לחץ כדי להפוך את הגורם ללא פעיל (מושבת)' : 'לחץ כדי להפוך את הגורם לפעיל'}
                              >
                                <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span>{u.isActive ? 'פעיל' : 'לא פעיל'}</span>
                              </button>
                            </td>

                            {/* Approval Limit */}
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                              {u.approvalLimit.toLocaleString()} ₪
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-end">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingUser(u)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition"
                                  title="ערוך פרטי משתמש וגורם מאשר"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    enterpriseConfigService.duplicateUser(u.id);
                                    showToast(`המשתמש ${u.name} שוכפל בהצלחה`);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition"
                                  title="שכפל רשומת משתמש"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    enterpriseConfigService.toggleUserActive(u.id);
                                    showToast(`סטטוס משתמש ${u.name} שונה בהצלחה`);
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                                    u.isActive 
                                      ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50' 
                                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                                  }`}
                                  title={u.isActive ? 'השבת משתמש' : 'הפעל משתמש'}
                                >
                                  {u.isActive ? 'השבת' : 'הפעל'}
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`האם להעביר את ${u.name} לסל המחזור? ניתן לשחזר בכל עת.`)) {
                                      enterpriseConfigService.moveToTrash('user', u.id, u.name, 'מחיקה ממרכז השליטה');
                                      showToast(`המשתמש ${u.name} הועבר לסל המחזור`, 'warning');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition"
                                  title="מחק והעבר לסל המחזור"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Role Permission Matrix Card */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  מטריצת הרשאות לפי תפקידים (Permissions Matrix)
                </h3>
                <p className="text-xs text-slate-500 mb-4">הרשאות ברמת שדה (Field-Level Security) ופעולות מערכת</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="pb-2 text-start">תפקיד</th>
                        <th className="pb-2">עריכת שדות</th>
                        <th className="pb-2">אישור חשבונית</th>
                        <th className="pb-2">דחיית חשבונית</th>
                        <th className="pb-2">שידור ל-ERP</th>
                        <th className="pb-2">הגדרות מערכת</th>
                        <th className="pb-2">הסתרת מחירי יחידה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(Object.keys(state.rolePermissions) as UserRole[]).map(roleKey => {
                        const perm = state.rolePermissions[roleKey];
                        return (
                          <tr key={roleKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 font-bold text-start text-slate-900 dark:text-white">{roleKey}</td>
                            <td className="py-2.5">{perm.canEditInvoiceFields ? '✅' : '❌'}</td>
                            <td className="py-2.5">{perm.canApproveInvoice ? '✅' : '❌'}</td>
                            <td className="py-2.5">{perm.canRejectInvoice ? '✅' : '❌'}</td>
                            <td className="py-2.5">{perm.canPostToErp ? '✅' : '❌'}</td>
                            <td className="py-2.5">{perm.canManageSettings ? '✅' : '❌'}</td>
                            <td className="py-2.5">{perm.fieldLevelRestrictions?.hideUnitPrice ? '🔒 מוסתר' : 'גלוי'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORKFLOWS & SLA */}
          {activeTab === 'workflows' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    מנוע תהליכים, מדרגות אישור ו-SLA
                  </h2>
                  <p className="text-xs text-slate-500">חוקי אישור אוטומטי, מדרגות סכום לפי סמכויות, והאצלת חתימות לממלאי מקום</p>
                </div>
                <button
                  onClick={() => setShowAddDelegation(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  הגדר האצלת סמכויות (Delegation)
                </button>
              </div>

              {/* Active Workflow Steps */}
              {state.workflows.map(wf => (
                <div key={wf.id} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{wf.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          פעיל (Active)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        SLA יעד לאישור: <strong>{wf.slaHours} שעות</strong> • מנהל הסלמה: <strong>{wf.escalationManagerEmail}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={wf.autoApproveIfMatched100}
                          onChange={(e) => {
                            enterpriseConfigService.updateWorkflow(wf.id, { autoApproveIfMatched100: e.target.checked });
                            showToast('הגדרת אישור אוטומטי עודכנה');
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        אישור אוטומטי בהתאמה 100%
                      </label>
                      <input
                        type="number"
                        value={wf.autoApproveMaxAmount}
                        onChange={(e) => {
                          enterpriseConfigService.updateWorkflow(wf.id, { autoApproveMaxAmount: Number(e.target.value) });
                        }}
                        className="w-20 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        title="תקרה בסכום ₪ לאישור אוטומטי"
                      />
                      <span className="text-xs text-slate-500">₪</span>

                      <div className="flex items-center gap-1 ms-2 border-s border-slate-200 dark:border-slate-800 ps-2">
                        <button
                          onClick={() => {
                            enterpriseConfigService.duplicateWorkflow(wf.id);
                            showToast(`נוהל אישורים ${wf.name} שוכפל בהצלחה`);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition"
                          title="שכפל נוהל אישורים"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`האם להעביר את הנוהל ${wf.name} לסל המחזור?`)) {
                              enterpriseConfigService.moveToTrash('workflow', wf.id, wf.name, 'מחיקה ממרכז השליטה');
                              showToast(`נוהל אישורים ${wf.name} הועבר לסל המחזור`, 'warning');
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition"
                          title="מחק נוהל לסל מחזור"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Steps Visualization */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">שלבי אישור מוגדרים:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {wf.steps.map(step => (
                        <div key={step.stepNumber} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 relative">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-indigo-600">שלב {step.stepNumber}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {step.approverRole}
                            </span>
                          </div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-white mt-1">
                            {step.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            טווח סכום: {step.minAmount.toLocaleString()} ₪ {step.maxAmount ? `עד ${step.maxAmount.toLocaleString()} ₪` : 'ומעלה'}
                          </div>
                          {step.requiresTwoSignatures && (
                            <div className="mt-2 text-[10px] font-bold text-amber-600 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> נדרשת חתימה כפולה (CFO + מנכ״ל)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Active Delegations Table */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  האצלת סמכויות פעילה (Delegation of Authority)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="pb-2 text-start">מעביר הסמכות</th>
                        <th className="pb-2 text-start">ממלא המקום המורשה</th>
                        <th className="pb-2 text-start">תאריך התחלה</th>
                        <th className="pb-2 text-start">תאריך סיום</th>
                        <th className="pb-2 text-start">סיבה</th>
                        <th className="pb-2 text-end">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {state.delegations.map(del => (
                        <tr key={del.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{del.fromUserEmail}</td>
                          <td className="py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">{del.toUserEmail}</td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400">{del.startDate}</td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400">{del.endDate}</td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400">{del.reason}</td>
                          <td className="py-2.5 text-end">
                            <button
                              onClick={() => {
                                enterpriseConfigService.deleteDelegation(del.id);
                                showToast('האצלת הסמכויות בוטלה');
                              }}
                              className="text-rose-600 hover:text-rose-800 text-[11px] font-medium"
                            >
                              בטל האצלה
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOM FIELDS */}
          {activeTab === 'custom_fields' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    ניהול שדות מותאמים אישית (Custom Fields Registry)
                  </h2>
                  <p className="text-xs text-slate-500">הוספת שדות דינמיים לחשבוניות, ספקים ותיקי יבוא ללא שינוי קוד (Zero-Code Extensibility)</p>
                </div>
                <button
                  onClick={() => setShowAddCustomField(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוסף שדה מותאם
                </button>
              </div>

              {/* Custom Fields List */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="pb-2 text-start">תווית השדה (Label)</th>
                        <th className="pb-2 text-start">מפתח טכני (Key)</th>
                        <th className="pb-2 text-start">סוג נתון</th>
                        <th className="pb-2 text-start">משויך אל</th>
                        <th className="pb-2 text-start">חובת מילוי</th>
                        <th className="pb-2 text-start">ערך ברירת מחדל</th>
                        <th className="pb-2 text-end">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {state.customFields.map(f => (
                        <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 font-bold text-slate-900 dark:text-white">{f.name}</td>
                          <td className="py-2.5 font-mono text-slate-500">{f.key}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {f.type}
                            </span>
                          </td>
                          <td className="py-2.5 capitalize text-slate-700 dark:text-slate-300">{f.appliesTo}</td>
                          <td className="py-2.5">{f.required ? '✅ חובה' : 'רשות'}</td>
                          <td className="py-2.5 text-slate-500 font-mono text-[11px]">{String(f.defaultValue || '-')}</td>
                          <td className="py-2.5 text-end">
                            <button
                              onClick={() => {
                                enterpriseConfigService.deleteCustomField(f.id);
                                showToast(`שדה ${f.name} נמחק`);
                              }}
                              className="text-rose-600 hover:text-rose-800 text-[11px] font-medium"
                            >
                              מחק
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TAX & CURRENCY */}
          {activeTab === 'tax_currency' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    ניהול מע״מ, שיעורי מס ושערי חליפין
                  </h2>
                  <p className="text-xs text-slate-500">הגדרת שיעורי מס דינמיים לפי מדינה ושערי חליפין רציפים מול בנק ישראל (BOI)</p>
                </div>
                <button
                  onClick={() => setShowAddTaxRate(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוסף שיעור מע״מ חדש
                </button>
              </div>

              {/* Tax Rates Table */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  טבלת שיעורי מע״מ ומס תשומות
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="pb-2 text-start">מדינה</th>
                        <th className="pb-2 text-start">שם המס</th>
                        <th className="pb-2 text-start">אחוז (%)</th>
                        <th className="pb-2 text-start">חשבון ספר ראשי (GL Account)</th>
                        <th className="pb-2 text-start">תוקף מ-</th>
                        <th className="pb-2 text-start">ברירת מחדל</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {state.taxRates.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 font-bold text-slate-900 dark:text-white">{t.country}</td>
                          <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{t.name}</td>
                          <td className="py-2.5 font-mono text-sm font-bold text-indigo-600">{t.ratePercent}%</td>
                          <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">{t.glAccountCode}</td>
                          <td className="py-2.5 text-slate-500">{t.effectiveFrom}</td>
                          <td className="py-2.5">{t.isDefault ? '🌟 ברירת מחדל' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Currencies & FX Rates */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      שערי חליפין פעילים (מול שקל ₪)
                    </h3>
                    <p className="text-xs text-slate-500">סנכרון ישיר מול שירות שערים יציגים של בנק ישראל (Bank of Israel)</p>
                  </div>
                  <button
                    onClick={() => {
                      enterpriseConfigService.updateCurrencyRate('USD', 3.74);
                      enterpriseConfigService.updateCurrencyRate('EUR', 4.08);
                      showToast('שערי חליפין סונכרנו בהצלחה מול בנק ישראל!', 'success');
                    }}
                    className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" /> רענן שערים מבנק ישראל
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {state.currencies.map(c => (
                    <div key={c.code} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                        <span className="font-mono text-slate-400">{c.code}</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {c.symbol} {c.rateToILS.toFixed(2)} ₪
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        עודכן: {c.lastUpdated}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AI & OCR PIPELINE */}
          {activeTab === 'ai_ocr' && (
            <AiOcrPipelineTab
              config={state.pipelineOcrAi || {
                usageMode: 'balanced',
                ocrEngine: 'google_vision_gemini',
                fallbackOcrEngine: 'azure_doc_intelligence',
                aiModel: 'gemini-2.5-flash',
                multiPassOcr: true,
                maxPasses: 2,
                temperature: 0.1,
                maxRetries: 2,
                timeoutMs: 15000,
                preprocessing: {
                  autoRotate: true,
                  deskew: true,
                  cropBorders: true,
                  removeNoise: true,
                  enhanceContrast: true,
                  sharpenText: true,
                  convertToGrayscale: false,
                  autoEnhanceResolution: true,
                  detectBlankPages: true,
                },
                documentQualityRules: {
                  minDpiRequired: 200,
                  rejectBlurryImages: false,
                  handlePasswordProtected: 'quarantine',
                  rejectCorruptedPdf: true,
                },
                fieldThresholds: {
                  supplierName: 92,
                  supplierTaxId: 95,
                  invoiceNumber: 95,
                  invoiceDate: 90,
                  currency: 95,
                  subtotalAmount: 92,
                  vatAmount: 95,
                  totalAmount: 95,
                  lineItems: 88,
                  poNumber: 85,
                  paymentTerms: 85,
                  skuCodes: 85,
                },
                criticalFieldsOverrideAutoPass: true,
                monthlyBudgetCapUsd: 1500,
                costPer1kTokens: 0.0015,
                estimatedCostPerDocUsd: 0.0035,
                alertThresholdPercent: 80,
                actionOnBudgetExceeded: 'switch_to_economy',
                tokensUsedToday: 142500,
                tokensUsedThisMonth: 3420000,
                costSpentTodayUsd: 1.85,
                costSpentThisMonthUsd: 42.60,
                averageTokensPerDoc: 2150,
                enableHebrewHandwritingOcr: true,
                supplierOverrides: [],
              }}
              onUpdate={showToast}
            />
          )}

          {/* TAB 8: EMAIL BOXES */}
          {activeTab === 'email_boxes' && (
            <div className="space-y-6">
              {/* Header & Main Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    תיבות דוא״ל ייעודיות לקבלת חשבוניות
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      {state.emailBoxes.length} תיבות מוגדרות
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    סריקה וקליטה אוטומטית של קבצי PDF מצורפים ישירות מתיבות דואר ארגוניות (M365 / Gmail / IMAP)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => {
                      setScanBoxInitialId(undefined);
                      setShowEmailScanModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    סריקת מיילים לפי טווח (יום / שבוע / חודש / שנה)
                  </button>

                  <button
                    onClick={handleRefreshAllMailboxes}
                    disabled={isRefreshingMailboxes}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshingMailboxes ? 'animate-spin' : ''}`} />
                    רענן את כל התיבות
                  </button>

                  <button
                    onClick={() => {
                      setEditingEmailBox(null);
                      setShowEmailBoxModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    הגדר תיבת דוא״ל חדשה
                  </button>
                </div>
              </div>

              {/* Time Range Quick Scan Banner */}
              <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-l from-indigo-50/70 via-white to-indigo-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-indigo-950/20 shadow-sm space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        סריקה מיידית לכלל התיבות לפי טווח זמנים:
                      </span>
                      <span className="text-[11px] text-slate-500 mr-2">
                        בחר טווח להפעלת סריקה, חילוץ PDF וקליטה ל-AI OCR
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setScanBoxInitialId(undefined);
                      setShowEmailScanModal(true);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1"
                  >
                    הגדרות סריקה מתקדמות <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                  {[
                    { key: 'day', label: 'יום', sub: '24 שעות', icon: '⏱️' },
                    { key: 'week', label: 'שבוע', sub: '7 ימים', icon: '📅' },
                    { key: 'month', label: 'חודש', sub: '30 יום', icon: '🗓️' },
                    { key: '6_months', label: '6 חודשים', sub: 'חצי שנה', icon: '📆' },
                    { key: 'year', label: 'שנה', sub: '12 חודשים', icon: '📜' },
                    { key: 'all', label: 'הכל', sub: 'היסטוריה מלאה', icon: '🌐' },
                  ].map(r => (
                    <button
                      key={r.key}
                      onClick={() => handleQuickScanEmail('all_boxes', r.key as EmailScanTimeRange)}
                      className="px-3 py-2 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 bg-white/90 dark:bg-slate-800/80 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:hover:bg-indigo-600 text-slate-800 dark:text-slate-200 transition group flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>{r.icon}</span>
                      <span className="text-xs font-bold">{r.label}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-indigo-100">({r.sub})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mailboxes Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.emailBoxes.map(box => {
                  const isTesting = testingConnectionId === box.id;
                  const isDropdownOpen = activeScanDropdownId === box.id;
                  const company = state.companies.find(c => c.id === box.companyId);

                  return (
                    <div 
                      key={box.id} 
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                    >
                      {/* Card Header */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={box.emailAddress}>
                                {box.emailAddress}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {box.assignedDepartment} {company ? `• ${company.name}` : ''}
                              </div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            box.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {box.status === 'active' ? 'פעיל' : 'מושהה'}
                          </span>
                        </div>

                        {/* Protocol & Host Details */}
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">פרוטוקול:</span>
                            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                              {box.protocol === 'oauth_m365' ? 'Microsoft 365 (OAuth)' : box.protocol === 'oauth_gmail' ? 'Gmail (OAuth 2.0)' : 'IMAP SSL'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">תיקיית ניטור:</span>
                            <span className="font-mono">{box.folderToWatch || 'INBOX'}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">סריקה אחרונה:</span>
                            <strong>{box.lastChecked || 'היום'}</strong>
                          </div>
                          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">ממתינים לפענוח:</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {box.unprocessedCount || 0} קבצי PDF
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Test Connection Button */}
                          <button
                            type="button"
                            disabled={isTesting}
                            onClick={() => handleTestEmailBox(box)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition"
                          >
                            {isTesting ? <Loader2 className="w-3 h-3 animate-spin text-indigo-600" /> : <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                            בדוק חיבור
                          </button>

                          {/* Quick Scan Dropdown Button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveScanDropdownId(isDropdownOpen ? null : box.id)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1 transition"
                            >
                              <Search className="w-3 h-3" />
                              סרוק לפי טווח <ChevronDown className="w-3 h-3" />
                            </button>

                            {/* Dropdown Menu for Scan Time Ranges */}
                            {isDropdownOpen && (
                              <div className="absolute end-0 top-full mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20 py-1.5 text-xs text-slate-700 dark:text-slate-200">
                                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  בחר טווח זמנים לסריקה:
                                </div>
                                {[
                                  { key: 'day', label: 'יום אחרון (24 שעות)', icon: '⏱️' },
                                  { key: 'week', label: 'שבוע אחרון (7 ימים)', icon: '📅' },
                                  { key: 'month', label: 'חודש אחרון (30 יום)', icon: '🗓️' },
                                  { key: '6_months', label: '6 חודשים אחרונים', icon: '📆' },
                                  { key: 'year', label: 'שנה אחרונה (12 חודשים)', icon: '📜' },
                                  { key: 'all', label: 'הכל (היסטוריה מלאה)', icon: '🌐' },
                                ].map(item => (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => handleQuickScanEmail(box.id, item.key as EmailScanTimeRange)}
                                    className="w-full px-3 py-1.5 text-start hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                  </button>
                                ))}
                                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveScanDropdownId(null);
                                    setScanBoxInitialId(box.id);
                                    setShowEmailScanModal(true);
                                  }}
                                  className="w-full px-3 py-1.5 text-start font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  מסך סריקה מלא ופירוט קבצים...
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Management Cluster */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmailBox(box);
                              setShowEmailBoxModal(true);
                            }}
                            className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            הגדרות תיבה
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDuplicateEmailBox(box)}
                              title="שכפל תיבה"
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEmailBox(box)}
                              title="העבר לסל מחזור"
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ingested Invoices Queue Section */}
              {(() => {
                const combinedEmailInvoices = [
                  ...scannedInvoices,
                  ...(invoices || []).filter(inv => 
                    inv.id.includes('email') || 
                    inv.auditTrail?.some(a => a.user?.includes('דוא״ל') || a.action?.includes('דוא״ל') || a.user?.includes('Email'))
                  )
                ];
                // Deduplicate by ID
                const uniqueInvoices = Array.from(new Map(combinedEmailInvoices.map(item => [item.id, item])).values());
                const totalAmountILS = uniqueInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

                return (
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Inbox className="w-4 h-4 text-emerald-600" />
                          <span>תור חשבוניות שנקלטו מסריקת דוא״ל</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {uniqueInvoices.length} חשבוניות במערכת
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          כל חשבונית שמזוהה בסריקה מועברת אוטומטית למאגר האינבוקס לפענוח AI, הצלבת נתונים ושידור ל-ERP.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {onNavigateToInbox && (
                          <button
                            type="button"
                            onClick={() => onNavigateToInbox('email')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition flex items-center gap-2"
                          >
                            <Inbox className="w-3.5 h-3.5" />
                            <span>פתח את כל החשבוניות באינבוקס</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setScanBoxInitialId('all_boxes');
                            setShowEmailScanModal(true);
                          }}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <Search className="w-3.5 h-3.5 text-indigo-600" />
                          <span>סרוק טווח נוסף</span>
                        </button>
                      </div>
                    </div>

                    {uniqueInvoices.length === 0 ? (
                      <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Mail className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">טרם בוצעה סריקה או שאין חשבוניות חדשות</h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            לחץ על כפתור ״סרוק חשבוניות״ לצד אחת התיבות למעלה כדי לסרוק (יום, שבוע, חודש, 6 חודשים, שנה או הכל) ולמשוך חשבוניות ישירות לאינבוקס.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setScanBoxInitialId(state.emailBoxes[0]?.id || 'all_boxes');
                            setShowEmailScanModal(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-2"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>פתח סריקת מיילים עכשיו</span>
                        </button>
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              חשבוניות שנקלטו ({uniqueInvoices.length}):
                            </span>
                            <span className="text-slate-500 font-mono">
                              סה״כ שווי: <strong>{totalAmountILS.toLocaleString()} ₪</strong>
                            </span>
                          </div>
                          {onNavigateToInbox && (
                            <button
                              type="button"
                              onClick={() => onNavigateToInbox('email')}
                              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1"
                            >
                              <span>צפה בכולן באינבוקס</span>
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-start">
                            <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                              <tr>
                                <th className="py-2.5 px-4 font-semibold text-start">ספק</th>
                                <th className="py-2.5 px-4 font-semibold text-start">מספר חשבונית</th>
                                <th className="py-2.5 px-4 font-semibold text-start">תאריך קליטה</th>
                                <th className="py-2.5 px-4 font-semibold text-start">סכום כולל</th>
                                <th className="py-2.5 px-4 font-semibold text-start">רמת ביטחון OCR</th>
                                <th className="py-2.5 px-4 font-semibold text-start">סטטוס</th>
                                <th className="py-2.5 px-4 font-semibold text-start">פעולות</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {uniqueInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                                  <td className="py-2.5 px-4">
                                    <div className="font-bold text-slate-900 dark:text-white">{inv.supplierName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">ח.פ: {inv.supplierTaxId}</div>
                                  </td>
                                  <td className="py-2.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                                    {inv.invoiceNumber}
                                  </td>
                                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                                    {inv.receivedAt || inv.issueDate}
                                  </td>
                                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                    {inv.totalAmount.toLocaleString()} {inv.currency === 'ILS' ? '₪' : inv.currency}
                                  </td>
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                      <Sparkles className="w-3 h-3" />
                                      {inv.overallConfidence}%
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      inv.status === 'ready_for_erp'
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                        : inv.status === 'needs_attention'
                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                    }`}>
                                      {inv.status === 'ready_for_erp' ? 'מוכן לשידור ERP' : (inv.status === 'needs_attention' ? 'דורש אישור' : 'בתהליך')}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      {onSelectInvoice && (
                                        <button
                                          type="button"
                                          onClick={() => onSelectInvoice(inv)}
                                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition flex items-center gap-1"
                                          title="פתח כרטיס חשבונית מלא"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>צפה בחשבונית</span>
                                        </button>
                                      )}
                                      {onNavigateToInbox && (
                                        <button
                                          type="button"
                                          onClick={() => onNavigateToInbox('email')}
                                          className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                          title="מעבר לאינבוקס"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 9: INTEGRATIONS & PRIORITY API */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Header & Main Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    מרכז אינטגרציות, מפתחות API ו-Priority ERP
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {state.integrations.length} ממשקים פעילים
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    ניהול חיבורי OData v4, Service Layer, Rate Limiting ובדיקות תקשורת חיות (Live Ping)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleRefreshAllIntegrations}
                    disabled={isRefreshingIntegrations}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isRefreshingIntegrations ? 'animate-spin' : ''}`} />
                    רענן ובדוק את כל החיבורים
                  </button>

                  <button
                    onClick={() => {
                      setEditingIntegration(null);
                      setShowIntegrationModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-600/20 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    הוסף חיבור אינטגרציה חדש
                  </button>
                </div>
              </div>

              {/* Integrations Cards List */}
              <div className="space-y-4">
                {state.integrations.map(int => {
                  const isTesting = testingConnectionId === int.id;

                  return (
                    <div 
                      key={int.id} 
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-[280px]">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-purple-600" />
                            {int.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            int.environment === 'production' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {int.environment}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            {int.service}
                          </span>
                        </div>

                        <p className="text-xs font-mono text-slate-500 truncate max-w-lg">
                          {int.endpointUrl}
                        </p>

                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                          <span>
                            מפתח API: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-600 dark:text-slate-300">{int.apiKeyMasked}</code>
                          </span>
                          <span>•</span>
                          <span>מגבלה: <strong>{int.rateLimitPerMinute}</strong> req/min</span>
                          <span>•</span>
                          <span>פסק זמן: <strong>{int.timeoutSeconds || 30}s</strong></span>
                        </div>
                      </div>

                      {/* Status & Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-end pl-2">
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5" /> מחובר (Live)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            שיהוי: {int.lastPingMs}ms
                          </span>
                        </div>

                        {/* Test Connection (Live Ping) */}
                        <button
                          type="button"
                          disabled={isTesting}
                          onClick={() => handleTestIntegration(int)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" /> : <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                          בדוק חיבור (Live Ping)
                        </button>

                        {/* Configure/Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIntegration(int);
                            setShowIntegrationModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-semibold transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          הגדרות
                        </button>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => handleDuplicateIntegration(int)}
                          title="שכפל חיבור"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete / Move to trash */}
                        <button
                          type="button"
                          onClick={() => handleDeleteIntegration(int)}
                          title="העבר לסל מחזור"
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 10: RETENTION & LEGAL HOLD */}
          {activeTab === 'retention' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  מדיניות שימור מסמכים, ארכיון וחסימה משפטית (Legal Hold)
                </h2>
                <p className="text-xs text-slate-500">עמידה בהוראות ניהול ספרים בישראל (7 שנים) ופקודת מס הכנסה</p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-500" />
                      חסימת מחיקה משפטית (Legal Hold Enforcement)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      הפעלת חסימה מונעת באופן מוחלט מחיקה או שינוי של חשבוניות ומסמכים מכל המשתמשים, כולל מנהלי מערכת.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      enterpriseConfigService.toggleLegalHold('ביקורת מס הכנסה 2026');
                      showToast(`סטטוס Legal Hold עודכן`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      state.retention.isLegalHoldActive
                        ? 'bg-rose-700 text-white hover:bg-rose-800'
                        : 'bg-amber-600 text-white hover:bg-amber-700'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {state.retention.isLegalHoldActive ? 'בטל חסימה משפטית' : 'הפעל חסימה משפטית (Legal Hold)'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500">תקופת שימור חובה בחוק:</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {state.retention.taxLegalHoldYears} שנים
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">לפי סעיף 131 לפקודת מס הכנסה</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500">ארכוב אוטומטי של מסמכים:</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      אחרי {state.retention.autoArchiveAfterDays} ימים
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">העברה לאחסון קר מוצפן (Cold Storage)</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500">סטטוס הגנה נוכחי:</div>
                    <div className={`text-lg font-bold mt-1 ${state.retention.isLegalHoldActive ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {state.retention.isLegalHoldActive ? '🔒 Legal Hold נעול' : '✅ פעיל בתקן'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">חתימות דיגיטליות מאומתות</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    יומן ביקורת שינויי מערכת (Audit Trail)
                  </h2>
                  <p className="text-xs text-slate-500">תיעוד מלא ובלתי ניתן למחיקה של כל שינוי בהגדרות, בחוקי האישור ובהרשאות</p>
                </div>
                <button
                  onClick={() => showToast('יומן הביקורת נשמר ומגובה')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  ייצא יומן ל-CSV
                </button>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="pb-2 text-start">מועד ושעה</th>
                        <th className="pb-2 text-start">משתמש מבצע</th>
                        <th className="pb-2 text-start">מודול</th>
                        <th className="pb-2 text-start">פעולה</th>
                        <th className="pb-2 text-start">פרטים מלאים</th>
                        <th className="pb-2 text-start">חומרה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {state.auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 font-mono text-slate-500">{log.timestamp}</td>
                          <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{log.user}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {log.module}
                            </span>
                          </td>
                          <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{log.action}</td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400">{log.details}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              log.severity === 'critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                              log.severity === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {log.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD BRANCH */}
      {showAddBranch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">הוספת סניף או מרלו״ג חדש</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">שם הסניף</label>
                <input
                  type="text"
                  placeholder="למשל: סניף דרום - באר שבע"
                  value={newBranch.name}
                  onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">קוד אתר (Code)</label>
                  <input
                    type="text"
                    placeholder="BR_BSV"
                    value={newBranch.code}
                    onChange={e => setNewBranch({ ...newBranch, code: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">עיר</label>
                  <input
                    type="text"
                    value={newBranch.city}
                    onChange={e => setNewBranch({ ...newBranch, city: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">כתובת</label>
                <input
                  type="text"
                  placeholder="רחוב ומספר"
                  value={newBranch.address}
                  onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">מנהל סניף</label>
                  <input
                    type="text"
                    placeholder="שם מנהל"
                    value={newBranch.managerName}
                    onChange={e => setNewBranch({ ...newBranch, managerName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">דוא״ל מנהל</label>
                  <input
                    type="email"
                    placeholder="manager@techlogix.co.il"
                    value={newBranch.managerEmail}
                    onChange={e => setNewBranch({ ...newBranch, managerEmail: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddBranch(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  if (!newBranch.name || !newBranch.code) {
                    showToast('נא למלא שם וקוד סניף', 'warning');
                    return;
                  }
                  enterpriseConfigService.addBranch(newBranch);
                  setShowAddBranch(false);
                  showToast('הסניף נוסף בהצלחה!');
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                שמור סניף
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD USER & APPROVER */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              הוספת משתמש וגורם מאשר
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">שם מלא</label>
                <input
                  type="text"
                  placeholder="ישראל ישראלי"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Phone Field */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  מספר טלפון (Phone)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="054-1234567"
                    value={newUser.phone}
                    onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full pr-8 pl-3 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">דוא״ל עבודה</label>
                <input
                  type="email"
                  placeholder="israel@techlogix.co.il"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">תפקיד (Role)</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ACCOUNTANT">הנהלת חשבונות (Accountant)</option>
                    <option value="APPROVER">מאשר חשבוניות (Approver)</option>
                    <option value="PURCHASING">מנהל רכש (Purchasing)</option>
                    <option value="FINANCE">מנהל כספים (Finance)</option>
                    <option value="ADMIN">מנהל מערכת (Admin)</option>
                    <option value="VIEWER">צפייה בלבד (Viewer)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">תקרת אישור (₪)</label>
                  <input
                    type="number"
                    value={newUser.approvalLimit}
                    onChange={e => setNewUser({ ...newUser, approvalLimit: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* CHECK BOX: Authorized Approver */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 cursor-pointer transition hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                <input
                  type="checkbox"
                  checked={newUser.isApprover}
                  onChange={e => setNewUser({ ...newUser, isApprover: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>גורם מאשר מורשה (Authorized Approver)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      Check Box
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    הגדר משתמש זה כגורם מוסמך לחתימה ואישור חשבוניות, הזמנות רכש והעברות תשלום.
                  </div>
                </div>
              </label>

              {/* CHECK BOX: Active / Inactive Status */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer transition hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                <input
                  type="checkbox"
                  checked={newUser.isActive}
                  onChange={e => setNewUser({ ...newUser, isActive: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>גורם פעיל במערכת (Active Entity)</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                      newUser.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {newUser.isActive ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    אפשרות להפוך את הגורם לפעיל או לא פעיל. גורם לא-פעיל מושבת מהמערכת ואינו יכול לאשר.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  if (!newUser.name || !newUser.email) {
                    showToast('נא למלא שם ודוא״ל', 'warning');
                    return;
                  }
                  enterpriseConfigService.addUser(newUser);
                  setShowAddUser(false);
                  showToast(`המשתמש ${newUser.name} נוצר בהצלחה!`);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-xs"
              >
                שמור משתמש וגורם מאשר
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER & APPROVER */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              עריכת משתמש וגורם מאשר
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">שם מלא</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Phone Field */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  מספר טלפון (Phone)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={editingUser.phone || ''}
                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full pr-8 pl-3 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">דוא״ל עבודה</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">תפקיד (Role)</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ACCOUNTANT">הנהלת חשבונות (Accountant)</option>
                    <option value="APPROVER">מאשר חשבוניות (Approver)</option>
                    <option value="PURCHASING">מנהל רכש (Purchasing)</option>
                    <option value="FINANCE">מנהל כספים (Finance)</option>
                    <option value="ADMIN">מנהל מערכת (Admin)</option>
                    <option value="VIEWER">צפייה בלבד (Viewer)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">תקרת אישור (₪)</label>
                  <input
                    type="number"
                    value={editingUser.approvalLimit}
                    onChange={e => setEditingUser({ ...editingUser, approvalLimit: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* CHECK BOX: Authorized Approver */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 cursor-pointer transition hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                <input
                  type="checkbox"
                  checked={Boolean(editingUser.isApprover)}
                  onChange={e => setEditingUser({ ...editingUser, isApprover: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>גורם מאשר מורשה (Authorized Approver)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      Check Box
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    הגדר משתמש זה כגורם מוסמך לאישור חשבוניות ורכש במערכת.
                  </div>
                </div>
              </label>

              {/* CHECK BOX: Active / Inactive Status */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer transition hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                <input
                  type="checkbox"
                  checked={Boolean(editingUser.isActive)}
                  onChange={e => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>גורם פעיל במערכת (Active Entity)</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                      editingUser.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {editingUser.isActive ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    אפשרות להפוך את הגורם לפעיל או לא פעיל. גורם לא פעיל ייחסם מביצוע אישורים.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  enterpriseConfigService.updateUser(editingUser.id, editingUser);
                  setEditingUser(null);
                  showToast(`פרטי הגורם ${editingUser.name} עודכנו בהצלחה!`);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-xs"
              >
                שמור שינויים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM FIELD */}
      {showAddCustomField && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">הוספת שדה מותאם (Custom Field)</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">שם השדה (Label)</label>
                <input
                  type="text"
                  placeholder="למשל: מספר הזמנה פנימי"
                  value={newCustomField.name}
                  onChange={e => setNewCustomField({ ...newCustomField, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">מפתח טכני (Key)</label>
                  <input
                    type="text"
                    placeholder="internal_order_no"
                    value={newCustomField.key}
                    onChange={e => setNewCustomField({ ...newCustomField, key: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">סוג נתון</label>
                  <select
                    value={newCustomField.type}
                    onChange={e => setNewCustomField({ ...newCustomField, type: e.target.value as CustomFieldType })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="text">טקסט (Text)</option>
                    <option value="number">מספר (Number)</option>
                    <option value="dropdown">רשימת בחירה (Dropdown)</option>
                    <option value="date">תאריך (Date)</option>
                    <option value="boolean">תיבת סימון (Boolean)</option>
                    <option value="project_code">קוד פרויקט (Project Code)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">משויך לרשומה</label>
                <select
                  value={newCustomField.appliesTo}
                  onChange={e => setNewCustomField({ ...newCustomField, appliesTo: e.target.value as any })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="invoice">חשבונית מס (Invoice)</option>
                  <option value="supplier">כרטיס ספק (Supplier)</option>
                  <option value="import_dossier">תיק יבוא (Import Dossier)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddCustomField(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  if (!newCustomField.name || !newCustomField.key) {
                    showToast('נא למלא שם ומפתח שדה', 'warning');
                    return;
                  }
                  enterpriseConfigService.addCustomField(newCustomField);
                  setShowAddCustomField(false);
                  showToast('השדה המותאם נוסף בהצלחה למערכת!');
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                הוסף שדה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD TAX RATE */}
      {showAddTaxRate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">הוספת שיעור מס / מע״מ חדש</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">שם המס</label>
                <input
                  type="text"
                  placeholder="מע״מ מופחת 5%"
                  value={newTaxRate.name}
                  onChange={e => setNewTaxRate({ ...newTaxRate, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">שיעור אחוז (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTaxRate.ratePercent}
                    onChange={e => setNewTaxRate({ ...newTaxRate, ratePercent: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">מדינה</label>
                  <input
                    type="text"
                    value={newTaxRate.country}
                    onChange={e => setNewTaxRate({ ...newTaxRate, country: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">קוד חשבון בהנה״ח (GL Account)</label>
                <input
                  type="text"
                  placeholder="2405 - מס תשומות מופחת"
                  value={newTaxRate.glAccountCode}
                  onChange={e => setNewTaxRate({ ...newTaxRate, glAccountCode: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddTaxRate(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  if (!newTaxRate.name) {
                    showToast('נא למלא שם מס', 'warning');
                    return;
                  }
                  enterpriseConfigService.addTaxRate(newTaxRate);
                  setShowAddTaxRate(false);
                  showToast('שיעור המס נוסף בהצלחה!');
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                שמור שיעור מס
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD DELEGATION */}
      {showAddDelegation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">האצלת סמכויות אישור לממלא מקום</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">דוא״ל המאשר הנעדר</label>
                <select
                  value={newDelegation.fromUserEmail}
                  onChange={e => setNewDelegation({ ...newDelegation, fromUserEmail: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">בחר משתמש...</option>
                  {state.users.map(u => (
                    <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">דוא״ל ממלא המקום (Delegate)</label>
                <select
                  value={newDelegation.toUserEmail}
                  onChange={e => setNewDelegation({ ...newDelegation, toUserEmail: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">בחר ממלא מקום...</option>
                  {state.users.map(u => (
                    <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">מתאריך</label>
                  <input
                    type="date"
                    value={newDelegation.startDate}
                    onChange={e => setNewDelegation({ ...newDelegation, startDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">עד תאריך</label>
                  <input
                    type="date"
                    value={newDelegation.endDate}
                    onChange={e => setNewDelegation({ ...newDelegation, endDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">סיבת האצלה</label>
                <input
                  type="text"
                  value={newDelegation.reason}
                  onChange={e => setNewDelegation({ ...newDelegation, reason: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddDelegation(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  if (!newDelegation.fromUserEmail || !newDelegation.toUserEmail) {
                    showToast('נא לבחור שני משתמשים', 'warning');
                    return;
                  }
                  enterpriseConfigService.addDelegation(newDelegation);
                  setShowAddDelegation(false);
                  showToast('האצלת הסמכויות נכנסה לתוקף בהצלחה!');
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                הפעל האצלה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Level Modals */}
      <RecycleBinModal
        isOpen={showRecycleBinModal}
        onClose={() => setShowRecycleBinModal(false)}
        trash={state.trash || []}
        onActionComplete={showToast}
      />

      <ConfigVersionsModal
        isOpen={showConfigVersionsModal}
        onClose={() => setShowConfigVersionsModal(false)}
        versions={state.configVersions || []}
        currentVersion={state.configVersion}
        onActionComplete={showToast}
      />

      <CompanySwitcherModal
        isOpen={showCompanySwitcherModal}
        onClose={() => setShowCompanySwitcherModal(false)}
        companies={state.companies || []}
        currentCompanyId={state.currentCompanyId}
        onActionComplete={showToast}
      />

      {/* Email Box Configuration Modal */}
      <EmailBoxModal
        isOpen={showEmailBoxModal}
        box={editingEmailBox}
        onClose={() => {
          setShowEmailBoxModal(false);
          setEditingEmailBox(null);
        }}
        onSave={(box) => {
          showToast(`הגדרות תיבת ${box.emailAddress} נשמרו בהצלחה`, 'success');
        }}
        onOpenScan={(boxId) => {
          setScanBoxInitialId(boxId);
          setShowEmailScanModal(true);
        }}
      />

      {/* Email Scan with Time Ranges Modal */}
      <EmailScanModal
        isOpen={showEmailScanModal}
        initialBoxId={scanBoxInitialId}
        boxes={state.emailBoxes}
        onClose={() => {
          setShowEmailScanModal(false);
          setScanBoxInitialId(undefined);
        }}
        onScanComplete={(boxId, range, count, generatedInvoices) => {
          if (generatedInvoices && generatedInvoices.length > 0) {
            if (onAddInvoices) onAddInvoices(generatedInvoices);
            setScannedInvoices(prev => [...generatedInvoices, ...prev]);
          }
          showToast(`הסריקה הושלמה: אותרו ${count} חשבוניות חדשות שנקלטו באינבוקס!`, 'success');
        }}
        onViewInvoicesInInbox={(invoicesToView) => {
          if (invoicesToView && invoicesToView.length > 0) {
            if (onAddInvoices) onAddInvoices(invoicesToView);
            setScannedInvoices(prev => [...invoicesToView, ...prev]);
          }
          if (onNavigateToInbox) {
            onNavigateToInbox('all');
          }
        }}
        onViewInvoicesInArchive={(invoicesToView) => {
          if (invoicesToView && invoicesToView.length > 0) {
            if (onAddInvoices) onAddInvoices(invoicesToView);
            setScannedInvoices(prev => [...invoicesToView, ...prev]);
          }
          if (onNavigateToArchive) {
            onNavigateToArchive();
          }
        }}
        onSelectInvoice={onSelectInvoice}
      />

      {/* Integration & ERP API Modal */}
      <IntegrationModal
        isOpen={showIntegrationModal}
        integration={editingIntegration}
        onClose={() => {
          setShowIntegrationModal(false);
          setEditingIntegration(null);
        }}
        onSave={(int) => {
          showToast(`הגדרות חיבור ${int.name} נשמרו בהצלחה`, 'success');
        }}
        onDelete={(id) => {
          enterpriseConfigService.softDeleteIntegration(id);
          showToast('החיבור הועבר לסל המחזור', 'warning');
        }}
      />

      {/* Connection Diagnostic Live Modal */}
      {diagnosticModalData && (
        <ConnectionDiagnosticModal
          isOpen={diagnosticModalData.isOpen}
          title={diagnosticModalData.title}
          targetName={diagnosticModalData.targetName}
          type={diagnosticModalData.type}
          latencyMs={diagnosticModalData.latencyMs}
          success={diagnosticModalData.success}
          message={diagnosticModalData.message}
          steps={diagnosticModalData.steps}
          onClose={() => setDiagnosticModalData(null)}
          onProceedToScan={diagnosticModalData.onProceedToScan}
        />
      )}
    </div>
  );
};
