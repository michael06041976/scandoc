import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  Search, 
  Filter, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ShieldAlert,
  GitCompare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Mail,
  Download,
  RefreshCw,
  Scan,
  Camera,
  FolderArchive,
  X
} from 'lucide-react';
import { InvoiceDocument, Language, BulkUploadProgress } from '../types';
import { translations } from '../i18n/translations';
import { InvoiceQuickPreviewModal } from './InvoiceQuickPreviewModal';
import { EmailInvoiceSyncModal } from './EmailInvoiceSyncModal';
import { EmailScanModal } from './enterprise/EmailScanModal';
import { InvoiceScanModal } from './InvoiceScanModal';
import { downloadInvoicePdfDirectly } from '../services/pdfGeneratorService';
import { enterpriseConfigService } from '../services/enterpriseConfigService';

interface InboxViewProps {
  invoices: InvoiceDocument[];
  language: Language;
  onSelectInvoice: (invoice: InvoiceDocument) => void;
  filterMode?: string;
  onUploadMockDocument: (customDoc?: InvoiceDocument) => void;
  onNavigateToArchive?: () => void;
  onAddInvoices?: (newInvoices: InvoiceDocument[]) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  invoices,
  language,
  onSelectInvoice,
  filterMode = 'all',
  onUploadMockDocument,
  onNavigateToArchive,
  onAddInvoices,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<string>(filterMode);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkUploadProgress | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailSyncModalOpen, setIsEmailSyncModalOpen] = useState(false);
  const [isEmailScanModalOpen, setIsEmailScanModalOpen] = useState(false);
  const [recentlyScannedInvoice, setRecentlyScannedInvoice] = useState<InvoiceDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannedInitialFile, setScannedInitialFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sorting state
  type InboxSortField = 
    | 'fileName' 
    | 'supplierName' 
    | 'documentType' 
    | 'invoiceNumber' 
    | 'issueDate' 
    | 'totalAmount' 
    | 'overallConfidence' 
    | 'duplicateRisk' 
    | 'threeWayMatch' 
    | 'status';

  type InboxSortDirection = 'asc' | 'desc';

  const [sortField, setSortField] = useState<InboxSortField>('issueDate');
  const [sortDirection, setSortDirection] = useState<InboxSortDirection>('desc');

  const isHebrew = language === 'he';

  const handleSort = (field: InboxSortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      if (field === 'totalAmount' || field === 'overallConfidence' || field === 'issueDate') {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  const getSortFieldLabel = (field: InboxSortField) => {
    switch (field) {
      case 'fileName': return t.inbox.colDocument;
      case 'supplierName': return t.inbox.colSupplier;
      case 'documentType': return t.inbox.colType;
      case 'invoiceNumber': return t.inbox.colInvoiceNo;
      case 'issueDate': return t.inbox.colDate;
      case 'totalAmount': return t.inbox.colAmount;
      case 'overallConfidence': return t.inbox.colConfidence;
      case 'duplicateRisk': return t.inbox.colDuplicate;
      case 'threeWayMatch': return t.inbox.colMatch;
      case 'status': return t.inbox.colStatus;
      default: return '';
    }
  };

  const handleScanCompleted = (newInvoice: InvoiceDocument, autoOpenPreview: boolean) => {
    onUploadMockDocument(newInvoice);
    setActiveTab('all');
    setDownloadToast(
      isHebrew 
        ? `חשבונית ${newInvoice.invoiceNumber} נסרקה בהצלחה ונוספה לתיבת הקליטה!` 
        : 'Invoice scanned successfully and added to inbox!'
    );
    setTimeout(() => setDownloadToast(null), 4500);

    if (autoOpenPreview) {
      setPreviewInvoice(newInvoice);
      setIsPreviewOpen(true);
    }
  };

  const handleOpenPreview = (inv: InvoiceDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPreviewInvoice(inv);
    setIsPreviewOpen(true);
  };

  const handleDirectDownload = async (inv: InvoiceDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadingId(inv.id);
    try {
      await downloadInvoicePdfDirectly(inv);
      setDownloadToast(isHebrew ? `חשבונית מקור (${inv.fileName || `${inv.invoiceNumber}.pdf`}) הורדה בהצלחה!` : 'Invoice PDF downloaded successfully!');
      setTimeout(() => setDownloadToast(null), 4000);
    } catch (err) {
      console.error('Failed to download invoice:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    if (filterMode) {
      setActiveTab(filterMode);
    }
  }, [filterMode]);

  const emailInvoicesCount = invoices.filter(inv => 
    inv.id.includes('email') || 
    inv.auditTrail?.some(a => a.user?.includes('דוא״ל') || a.action?.includes('דוא״ל') || a.user?.includes('Email'))
  ).length;

  // Filter invoices based on active tab & search
  const filteredInvoices = invoices.filter(inv => {
    // Tab filtering
    if (activeTab === 'needs_attention') {
      const hasProblem = inv.status === 'needs_attention' || inv.duplicateRisk === 'high' || !inv.mathCheck.passed;
      if (!hasProblem) return false;
    } else if (activeTab === 'ready_erp') {
      if (inv.status !== 'ready_for_erp' && inv.status !== 'posted_to_erp') return false;
    } else if (activeTab === 'duplicates') {
      if (inv.duplicateRisk === 'none') return false;
    } else if (activeTab === 'pending_approval') {
      if (inv.status !== 'pending_approval') return false;
    } else if (activeTab === 'email') {
      const isEmail = inv.id.includes('email') || 
                      inv.auditTrail?.some(a => a.user?.includes('דוא״ל') || a.action?.includes('דוא״ל') || a.user?.includes('Email'));
      if (!isEmail) return false;
    }

    // Type filter
    if (selectedType !== 'all' && inv.documentType !== selectedType) {
      return false;
    }

    // Search query
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchSupplier = inv.supplierName.toLowerCase().includes(q);
      const matchInvNo = inv.invoiceNumber.toLowerCase().includes(q);
      const matchPO = inv.purchaseOrderNumber?.toLowerCase().includes(q);
      const matchTaxId = inv.supplierTaxId.toLowerCase().includes(q);
      const matchAmount = inv.totalAmount.toString().includes(q);
      if (!matchSupplier && !matchInvNo && !matchPO && !matchTaxId && !matchAmount) {
        return false;
      }
    }

    return true;
  });

  // Sort the filtered invoices according to active column header
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'fileName':
        cmp = (a.fileName || '').localeCompare(b.fileName || '', 'he', { sensitivity: 'base' });
        break;
      case 'supplierName':
        cmp = (a.supplierName || '').localeCompare(b.supplierName || '', 'he', { sensitivity: 'base' });
        break;
      case 'documentType':
        cmp = (a.documentType || '').localeCompare(b.documentType || '');
        break;
      case 'invoiceNumber':
        cmp = (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '', undefined, { numeric: true });
        break;
      case 'issueDate':
        cmp = new Date(a.issueDate || '1970-01-01').getTime() - new Date(b.issueDate || '1970-01-01').getTime();
        break;
      case 'totalAmount':
        cmp = (a.totalAmount || 0) - (b.totalAmount || 0);
        break;
      case 'overallConfidence':
        cmp = (a.overallConfidence || 0) - (b.overallConfidence || 0);
        break;
      case 'duplicateRisk': {
        const riskOrder = { high: 3, possible: 2, none: 1 };
        cmp = (riskOrder[a.duplicateRisk] || 0) - (riskOrder[b.duplicateRisk] || 0);
        break;
      }
      case 'threeWayMatch': {
        const matchOrder = { matched_100: 4, variance_detected: 3, po_missing: 2, receipt_missing: 1 };
        cmp = (matchOrder[a.threeWayMatch?.status] || 0) - (matchOrder[b.threeWayMatch?.status] || 0);
        break;
      }
      case 'status': {
        const statusOrder: Record<string, number> = {
          posted_to_erp: 8,
          ready_for_erp: 7,
          approved: 6,
          pending_approval: 5,
          new: 4,
          needs_attention: 3,
          rejected: 2,
          archived: 1
        };
        cmp = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        break;
      }
      default:
        cmp = 0;
    }
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  // Handle Drag & Drop simulation or file selection for scanner
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setScannedInitialFile(file);
    } else {
      setScannedInitialFile(null);
    }
    setIsScanModalOpen(true);
  };

  // Simulate Bulk Ingestion (100 documents progress as requested in section 23)
  const handleSimulateBulk = () => {
    setBulkProgress({
      total: 100,
      processed: 12,
      needsAttention: 1,
      errors: 0,
      duplicates: 0,
      isCompleted: false,
    });

    const interval = setInterval(() => {
      setBulkProgress(prev => {
        if (!prev) return null;
        const nextProcessed = Math.min(100, prev.processed + 18);
        const isDone = nextProcessed >= 100;
        if (isDone) {
          clearInterval(interval);
          return {
            total: 100,
            processed: 87,
            needsAttention: 8,
            errors: 3,
            duplicates: 2,
            isCompleted: true,
          };
        }
        return {
          ...prev,
          processed: nextProcessed,
          needsAttention: Math.round(nextProcessed * 0.08),
          duplicates: Math.round(nextProcessed * 0.02),
        };
      });
    }, 400);
  };

  return (
    <div id="inbox-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.inbox.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.inbox.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="open-invoice-scanner-btn"
            onClick={() => {
              setScannedInitialFile(null);
              setIsScanModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
            title={isHebrew ? 'סרוק חשבונית חדשה' : 'Scan New Invoice'}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>{isHebrew ? 'סרוק חשבונית' : 'Scan Invoice'}</span>
          </button>

          <button
            id="download-email-sync-preview-btn"
            onClick={() => setIsEmailSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
            title={isHebrew ? 'סרוק מייל, הורד (DOWNLOAD), תייק בארכיון ופתח ב-PREVIEW' : 'Scan Email, Download, Archive & PREVIEW'}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isHebrew ? 'סרוק מייל, הורד, תייק ו-PREVIEW' : 'Download from Email, Archive & PREVIEW'}</span>
          </button>

          {onNavigateToArchive && (
            <button
              onClick={onNavigateToArchive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 transition shadow-2xs cursor-pointer"
              title="עבור לארכיון הדיגיטלי של מסמכי המקור"
            >
              <FolderArchive className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isHebrew ? 'ארכיון דיגיטלי' : 'Archive'}</span>
            </button>
          )}

          <button
            id="bulk-simulation-btn"
            onClick={handleSimulateBulk}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.inbox.dropzoneBulkBtn}</span>
          </button>
        </div>
      </div>

      {/* Bulk Progress Notification Banner if active */}
      {bulkProgress && (
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              Traitement par lot en cours : {bulkProgress.processed} / {bulkProgress.total} documents analysés
            </span>
            <span>{Math.round((bulkProgress.processed / bulkProgress.total) * 100)}%</span>
          </div>

          <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(bulkProgress.processed / bulkProgress.total) * 100}%` }}
            ></div>
          </div>

          {bulkProgress.isCompleted && (
            <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-300 font-medium pt-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ 87 traités automatiquement
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                ⚠️ 8 en vérification
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                🛑 3 erreurs OCR
              </span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                🔁 2 doublons interceptés
              </span>
              <button 
                onClick={() => setBulkProgress(null)}
                className="ms-auto text-[10px] text-indigo-600 underline font-semibold"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden native file input triggered by dropzone click */}
      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf,image/png,image/jpeg,image/webp,image/tiff"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setScannedInitialFile(file);
            setIsScanModalOpen(true);
          }
        }}
      />

      {/* Ingestion Dropzone */}
      <div
        id="inbox-dropzone-scanner-box"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => {
          setScannedInitialFile(null);
          setIsScanModalOpen(true);
        }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer group ${
          isUploading
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-gradient-to-b from-white to-indigo-50/20 dark:from-slate-900/90 dark:to-indigo-950/20 shadow-xs'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-md group-hover:scale-105 transition">
            <Scan className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <span>{t.inbox.dropzoneTitle}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                סורק OCR פעיל
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.inbox.dropzoneSub}
            </div>
          </div>

          {/* Direct Action Buttons inside Dropzone */}
          <div className="flex items-center gap-2.5 pt-1 flex-wrap justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              id="dropzone-start-scan-btn"
              onClick={() => {
                setScannedInitialFile(null);
                setIsScanModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>{isHebrew ? 'פתח סורק חשבוניות' : 'Open Invoice Scanner'}</span>
            </button>

            <button
              type="button"
              id="dropzone-browse-file-btn"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isHebrew ? 'בחר קובץ מהמחשב' : 'Browse Local Files'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {isHebrew 
              ? 'לחץ כאן לפתיחת סורק ה-OCR בזמן אמת, הפעלת מצלמה או בחירת קובץ' 
              : 'Click to open AI OCR scanner, camera capture or browse files'}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {t.inbox.filterAll} ({invoices.length})
          </button>

          <button
            onClick={() => setActiveTab('needs_attention')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'needs_attention'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {t.inbox.filterNeedsAttention}
          </button>

          <button
            onClick={() => setActiveTab('ready_erp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'ready_erp'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.inbox.filterReadyErp}
          </button>

          <button
            onClick={() => setActiveTab('duplicates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'duplicates'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 hover:bg-purple-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {t.inbox.filterDuplicates}
          </button>

          {(emailInvoicesCount > 0 || activeTab === 'email') && (
            <button
              onClick={() => setActiveTab('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === 'email'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{language === 'he' ? 'נסרק מדוא״ל' : (language === 'fr' ? 'Scanné d\'emails' : 'Email Scanned')} ({emailInvoicesCount})</span>
            </button>
          )}
        </div>

        {/* Quick Filter by Document Type & Sorting Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Sort Indicator Pill */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span>{isHebrew ? 'מיון:' : 'Sort:'}</span>
            <button
              type="button"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
              title={isHebrew ? 'לחץ להפיכת כיוון המיון' : 'Click to reverse sort direction'}
            >
              <span>{getSortFieldLabel(sortField)}</span>
              {sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            </button>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">
              {language === 'he' ? 'כל סוגי המסמכים' : (language === 'fr' ? 'Tous les types de pièces' : 'All document types')}
            </option>
            <option value="tax_invoice">
              {language === 'he' ? 'חשבונית מס / קבלה' : (language === 'fr' ? 'Facture fiscale' : 'Tax invoice')}
            </option>
            <option value="invoice">
              {language === 'he' ? 'חשבונית רגילה' : (language === 'fr' ? 'Facture standard' : 'Standard invoice')}
            </option>
            <option value="credit_note">
              {language === 'he' ? 'הודעת זיכוי (Credit Note)' : (language === 'fr' ? 'Avoir (Crédit)' : 'Credit note')}
            </option>
            <option value="delivery_note">
              {language === 'he' ? 'תעודת משלוח' : (language === 'fr' ? 'Bon de livraison' : 'Delivery note')}
            </option>
            <option value="import_document">
              {language === 'he' ? 'תיק יבוא / שילוח ימי' : (language === 'fr' ? 'Dossier import / Fret' : 'Import / Freight')}
            </option>
          </select>

          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={language === 'he' ? 'חיפוש ספק, ח.פ, מספר חשבונית...' : (language === 'fr' ? 'Filtrer la liste...' : 'Filter list...')}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none w-48"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold select-none">
                {/* 1. Document Name */}
                <th
                  onClick={() => handleSort('fileName')}
                  className={`p-3 text-start cursor-pointer transition group hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    sortField === 'fileName' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                  }`}
                  title={isHebrew ? `לחץ למיון לפי ${t.inbox.colDocument}` : `Sort by ${t.inbox.colDocument}`}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>{t.inbox.colDocument}</span>
                    <span className="shrink-0">
                      {sortField === 'fileName' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 2. Supplier */}
                <th
                  onClick={() => handleSort('supplierName')}
                  className={`p-3 text-start cursor-pointer transition group hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    sortField === 'supplierName' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                  }`}
                  title={isHebrew ? `לחץ למיון לפי ${t.inbox.colSupplier}` : `Sort by ${t.inbox.colSupplier}`}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>{t.inbox.colSupplier}</span>
                    <span className="shrink-0">
                      {sortField === 'supplierName' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 3. Document Type */}
                <th
                  onClick={() => handleSort('documentType')}
                  className={`p-3 text-start cursor-pointer transition group hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    sortField === 'documentType' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                  }`}
                  title={isHebrew ? `לחץ למיון לפי ${t.inbox.colType}` : `Sort by ${t.inbox.colType}`}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>{t.inbox.colType}</span>
                    <span className="shrink-0">
                      {sortField === 'documentType' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 4. Invoice Number */}
                <th
                  onClick={() => handleSort('invoiceNumber')}
                  className={`p-3 text-start cursor-pointer transition group hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    sortField === 'invoiceNumber' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                  }`}
                  title={isHebrew ? `לחץ למיון לפי ${t.inbox.colInvoiceNo}` : `Sort by ${t.inbox.colInvoiceNo}`}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>{t.inbox.colInvoiceNo}</span>
                    <span className="shrink-0">
                      {sortField === 'invoiceNumber' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 5. Date */}
                <th
                  onClick={() => handleSort('issueDate')}
                  className={`p-3 text-start cursor-pointer transition group hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    sortField === 'issueDate' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                  }`}
                  title={isHebrew ? `לחץ למיון לפי ${t.inbox.colDate}` : `Sort by ${t.inbox.colDate}`}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>{t.inbox.colDate}</span>
                    <span className="shrink-0">
                      {sortField === 'issueDate' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 6. Amount */}
                <th
                  onClick={() => handleSort('totalAmount')}
                  className={`p-3 text-end cursor-pointer transition group hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    sortField === 'totalAmount' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                  }`}
                  title={isHebrew ? `לחץ למיון לפי ${t.inbox.colAmount}` : `Sort by ${t.inbox.colAmount}`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5 w-full">
                    <span>{t.inbox.colAmount}</span>
                    <span className="shrink-0">
                      {sortField === 'totalAmount' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 7. Confidence */}
                <th
                  onClick={() => handleSort('overallConfidence')}
                  className={`p-3 text-center cursor-pointer transition group hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    sortField === 'overallConfidence' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                  }`}
                  title={isHebrew ? `לחץ למיון לפי ${t.inbox.colConfidence}` : `Sort by ${t.inbox.colConfidence}`}
                >
                  <div className="inline-flex items-center justify-center gap-1.5 w-full">
                    <span>{t.inbox.colConfidence}</span>
                    <span className="shrink-0">
                      {sortField === 'overallConfidence' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 8. Duplicate */}
                <th
                  onClick={() => handleSort('duplicateRisk')}
                  className={`p-3 text-center cursor-pointer transition group hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    sortField === 'duplicateRisk' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                  }`}
                  title={isHebrew ? `לחץ למיון לפי ${t.inbox.colDuplicate}` : `Sort by ${t.inbox.colDuplicate}`}
                >
                  <div className="inline-flex items-center justify-center gap-1.5 w-full">
                    <span>{t.inbox.colDuplicate}</span>
                    <span className="shrink-0">
                      {sortField === 'duplicateRisk' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 9. Match */}
                <th
                  onClick={() => handleSort('threeWayMatch')}
                  className={`p-3 text-center cursor-pointer transition group hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    sortField === 'threeWayMatch' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                  }`}
                  title={isHebrew ? `לחץ למיון לפי ${t.inbox.colMatch}` : `Sort by ${t.inbox.colMatch}`}
                >
                  <div className="inline-flex items-center justify-center gap-1.5 w-full">
                    <span>{t.inbox.colMatch}</span>
                    <span className="shrink-0">
                      {sortField === 'threeWayMatch' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 10. Status */}
                <th
                  onClick={() => handleSort('status')}
                  className={`p-3 text-center cursor-pointer transition group hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    sortField === 'status' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                  }`}
                  title={isHebrew ? `לחץ למיון לפי ${t.inbox.colStatus}` : `Sort by ${t.inbox.colStatus}`}
                >
                  <div className="inline-flex items-center justify-center gap-1.5 w-full">
                    <span>{t.inbox.colStatus}</span>
                    <span className="shrink-0">
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 11. Actions */}
                <th className="p-3 text-end">{t.inbox.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    {language === 'he' ? 'אין מסמכים התואמים את המסננים שהוגדרו.' : 'Aucun document ne correspond aux filtres appliqués.'}
                  </td>
                </tr>
              ) : (
                sortedInvoices.map(invoice => {
                  const hasDiscrepancy = !invoice.mathCheck.passed || invoice.threeWayMatch.status === 'variance_detected';
                  const isHighDuplicate = invoice.duplicateRisk === 'high';

                  return (
                    <tr
                      key={invoice.id}
                      onClick={() => onSelectInvoice(invoice)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition ${
                        isHighDuplicate || !invoice.mathCheck.passed ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Document icon & filename */}
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-200" title={invoice.fileName}>
                            {invoice.fileName}
                          </span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {invoice.supplierName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {invoice.supplierTaxId}
                        </div>
                      </td>

                      {/* Doc Type */}
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium">
                          {t.docTypes[invoice.documentType] || invoice.documentType}
                        </span>
                      </td>

                      {/* Invoice No */}
                      <td className="p-3">
                        <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {invoice.invoiceNumber}
                        </div>
                        {invoice.fileName && (
                          <div 
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-mono truncate max-w-[160px] mt-0.5" 
                            title={`קובץ מקור שהורד מהמייל: ${invoice.fileName}`}
                          >
                            <Mail className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{invoice.fileName}</span>
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {invoice.issueDate}
                      </td>

                      {/* Total Amount */}
                      <td className="p-3 text-end font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {invoice.totalAmount.toLocaleString()} {invoice.currency}
                      </td>

                      {/* AI Confidence */}
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          invoice.overallConfidence >= 95 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          invoice.overallConfidence >= 80 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {invoice.overallConfidence}%
                        </span>
                      </td>

                      {/* Duplicate Pill */}
                      <td className="p-3 text-center">
                        {invoice.duplicateRisk === 'high' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <AlertTriangle className="w-3 h-3" />
                            {t.duplicates.high}
                          </span>
                        ) : invoice.duplicateRisk === 'possible' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {t.duplicates.possible}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            ✓ {t.duplicates.none}
                          </span>
                        )}
                      </td>

                      {/* 3-Way Match Pill */}
                      <td className="p-3 text-center">
                        {invoice.threeWayMatch.status === 'matched_100' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            ✓ 100% Match
                          </span>
                        ) : invoice.threeWayMatch.status === 'variance_detected' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            ⚠️ Écart Qté/Prix
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Sans PO
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          invoice.status === 'posted_to_erp' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          invoice.status === 'ready_for_erp' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                          invoice.status === 'needs_attention' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {t.status[invoice.status]}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-3 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* PREVIEW BUTTON */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenPreview(invoice, e)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/60 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
                            title={isHebrew ? 'תצוגה מקדימה של חשבונית מקור (PREVIEW)' : 'Preview original invoice'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">PREVIEW</span>
                          </button>

                          {/* DIRECT DOWNLOAD PDF BUTTON */}
                          <button
                            type="button"
                            onClick={(e) => handleDirectDownload(invoice, e)}
                            disabled={downloadingId === invoice.id}
                            className="p-1.5 rounded-md text-xs bg-slate-100 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:hover:bg-white dark:hover:text-slate-900 text-slate-700 dark:text-slate-200 transition disabled:opacity-50 cursor-pointer"
                            title={isHebrew ? 'הורד חשבונית מקור (PDF)' : 'Download invoice PDF'}
                          >
                            {downloadingId === invoice.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-rose-500" />
                            )}
                          </button>

                          {/* INSPECT & EDIT INVOICE */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectInvoice(invoice);
                            }}
                            className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                            title={t.inbox.inspectBtn}
                          >
                            {t.inbox.inspectBtn}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download Toast Notification */}
      {downloadToast && (
        <div className="fixed top-20 end-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Quick Preview Modal */}
      <InvoiceQuickPreviewModal
        invoice={previewInvoice}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewInvoice(null);
        }}
        language={language}
        onOpenFullDetail={(inv) => onSelectInvoice(inv)}
      />

      {/* Email Invoice Sync & Assemble Modal */}
      <EmailInvoiceSyncModal
        isOpen={isEmailSyncModalOpen}
        onClose={() => setIsEmailSyncModalOpen(false)}
        availableInvoices={invoices}
        language={language}
        onAddInvoices={(newInvoices) => {
          if (onAddInvoices) {
            onAddInvoices(newInvoices);
          } else {
            newInvoices.forEach(inv => onUploadMockDocument(inv));
          }
          setActiveTab('all');
          setDownloadToast(
            isHebrew 
              ? `הסריקה הושלמה: אותרו ${newInvoices.length} חשבוניות חדשות שהורדו (DOWNLOAD), תויקו בארכיון ומוצגות כעת באינבוקס!`
              : `Scan complete: ${newInvoices.length} invoices downloaded, archived and available in inbox!`
          );
          setTimeout(() => setDownloadToast(null), 5000);
        }}
        onNavigateToInbox={() => {
          setActiveTab('all');
        }}
        onArchiveInvoice={(archivedInv) => {
          onUploadMockDocument(archivedInv);
          setDownloadToast(isHebrew ? `חשבונית ${archivedInv.invoiceNumber} תויקה בארכיון הדיגיטלי!` : 'Invoice archived!');
          setTimeout(() => setDownloadToast(null), 3500);
        }}
        onNavigateToArchive={onNavigateToArchive}
        onAssembleAndPreview={(inv) => {
          onUploadMockDocument(inv);
          setPreviewInvoice(inv);
          setIsPreviewOpen(true);
        }}
      />

      {/* Real-time Invoice & Document Scanner Modal */}
      <InvoiceScanModal
        isOpen={isScanModalOpen}
        onClose={() => {
          setIsScanModalOpen(false);
          setScannedInitialFile(null);
        }}
        language={language}
        initialFile={scannedInitialFile}
        onScanComplete={handleScanCompleted}
      />
    </div>
  );
};
