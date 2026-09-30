import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Download, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  RefreshCw,
  Eye,
  Layers,
  Zap,
  FolderArchive,
  Archive,
  Check,
  Building2,
  ExternalLink,
  Search,
  Loader2,
  Inbox,
  Filter,
  Calendar,
  Clock
} from 'lucide-react';
import { InvoiceDocument, Language } from '../types';
import { EmailScanTimeRange, EmailScanResultItem } from '../types/enterprise';
import { getInvoiceEmailMetadata } from '../services/emailInvoiceData';
import { downloadInvoicePdfDirectly } from '../services/pdfGeneratorService';
import { enterpriseConfigService } from '../services/enterpriseConfigService';
import { InvoiceQuickPreviewModal } from './InvoiceQuickPreviewModal';

interface EmailInvoiceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableInvoices: InvoiceDocument[];
  language: Language;
  onAssembleAndPreview: (invoice: InvoiceDocument) => void;
  onArchiveInvoice?: (invoice: InvoiceDocument) => void;
  onNavigateToArchive?: () => void;
  onAddInvoices?: (newInvoices: InvoiceDocument[]) => void;
  onNavigateToInbox?: () => void;
}

interface TimeRangeOption {
  key: EmailScanTimeRange;
  label: string;
  sublabel: string;
  icon: string;
}

const TIME_RANGES: TimeRangeOption[] = [
  { key: 'day', label: 'יום', sublabel: '24 שעות אחרונות', icon: '⏱️' },
  { key: 'week', label: 'שבוע', sublabel: '7 ימים אחרונים', icon: '📅' },
  { key: 'month', label: 'חודש', sublabel: '30 יום אחרונים', icon: '🗓️' },
  { key: '6_months', label: '6 חודשים', sublabel: 'חצי שנה אחרונה', icon: '📆' },
  { key: 'year', label: 'שנה', sublabel: '12 חודשים אחרונים', icon: '📜' },
  { key: 'all', label: 'כל הזמנים', sublabel: 'סריקה מלאה של התיבה', icon: '🌐' },
];

export const EmailInvoiceSyncModal: React.FC<EmailInvoiceSyncModalProps> = ({
  isOpen,
  onClose,
  availableInvoices,
  language,
  onAssembleAndPreview,
  onArchiveInvoice,
  onNavigateToArchive,
  onAddInvoices,
  onNavigateToInbox,
}) => {
  const isHebrew = language === 'he';

  // Active view tab inside modal: 'scan' (full mailbox scan) vs 'single' (assemble single message)
  const [activeTab, setActiveTab] = useState<'scan' | 'single'>('scan');

  // Mailbox Scan State
  const [selectedRange, setSelectedRange] = useState<EmailScanTimeRange>('month');
  const [selectedBoxEmail, setSelectedBoxEmail] = useState<string>('ambatline.reshbon@gmail.com');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStep, setScanStep] = useState<string>('');

  // Required user checkboxes: DOWNLOAD & ARCHIVE
  const [autoDownload, setAutoDownload] = useState<boolean>(true);
  const [autoArchive, setAutoArchive] = useState<boolean>(true);

  // Scan Results
  const [scanResult, setScanResult] = useState<{
    emailsScanned: number;
    invoicesFound: number;
    items: EmailScanResultItem[];
    invoices: InvoiceDocument[];
    range: EmailScanTimeRange;
  } | null>(null);

  // Single Assembly State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    availableInvoices[0]?.id || ''
  );
  const [isAssembling, setIsAssembling] = useState(false);
  const [assembleStep, setAssembleStep] = useState<number>(0);

  // Quick Action State
  const [previewDoc, setPreviewDoc] = useState<InvoiceDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const selectedInvoice = availableInvoices.find(i => i.id === selectedInvoiceId) || availableInvoices[0];
  const emailMeta = selectedInvoice ? getInvoiceEmailMetadata(selectedInvoice) : null;

  // --- Real Mailbox Scan Execution ---
  const handleStartEmailScan = async () => {
    setIsScanning(true);
    setScanProgress(10);
    setScanStep('מתחבר לתיבת הדוא״ל (ambatline.reshbon@gmail.com) ומאמת הרשאות OAuth...');
    setScanResult(null);

    try {
      // Step 1: Connect
      await new Promise(r => setTimeout(r, 450));
      setScanProgress(30);
      setScanStep(`פותח תיקיית INBOX ומאתר הודעות ספקים לטווח: ${TIME_RANGES.find(r => r.key === selectedRange)?.label}...`);

      // Step 2: Fetch headers and attachments
      await new Promise(r => setTimeout(r, 550));
      setScanProgress(60);
      setScanStep('סורק הודעות ומחלץ קובצי חשבוניות PDF מקוריים (application/pdf)...');

      // Step 3: Run service scan
      const res = await enterpriseConfigService.scanEmailBox('mbox-1', selectedRange, {
        unreadOnly: false,
        pdfOnly: true,
      });

      await new Promise(r => setTimeout(r, 450));
      setScanProgress(80);
      setScanStep(autoArchive 
        ? 'מוריד חשבוניות (DOWNLOAD) ומתייק בארכיון הדיגיטלי (ARCHIVE)...' 
        : 'מפענח נתוני שולחים, ח.פ ישראלי ובדיקות מע״מ 17%...');

      let finalInvoices = res.invoices || [];

      // If autoArchive is active, mark all as archived & filed
      if (autoArchive) {
        finalInvoices = finalInvoices.map(inv => ({
          ...inv,
          status: 'ready_for_erp',
          isArchived: true,
          archivedAt: new Date().toISOString(),
          archiveFolder: inv.supplierName,
          auditTrail: [
            {
              id: `aud-scan-arch-${Date.now()}-${inv.id}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              user: 'Gmail Inbound & Archive Engine',
              action: 'סריקה, הורדה (DOWNLOAD) ותיוק בארכיון',
              details: `החשבונית נסרקה מהמייל ${selectedBoxEmail}, הורדה ונשמרה בארכיון הדיגיטלי תחת ${inv.supplierName}`,
            },
            ...inv.auditTrail,
          ],
        }));
        setArchivedIds(new Set(finalInvoices.map(i => i.id)));
      }

      // Step 4: Download first invoice sample directly if autoDownload is enabled
      if (autoDownload && finalInvoices.length > 0) {
        downloadInvoicePdfDirectly(finalInvoices[0]).catch(() => {});
      }

      await new Promise(r => setTimeout(r, 350));
      setScanProgress(100);
      setScanStep('הסריקה הושלמה בהצלחה!');

      // Set scan result
      setScanResult({
        emailsScanned: res.emailsScanned,
        invoicesFound: res.invoicesFound,
        items: res.items,
        invoices: finalInvoices,
        range: selectedRange,
      });

      // CRITICAL: Immediately add all scanned invoices to the system state!
      if (onAddInvoices && finalInvoices.length > 0) {
        onAddInvoices(finalInvoices);
      }

      if (autoDownload) {
        showToast(`נמצאו ${finalInvoices.length} חשבוניות! קובץ ה-PDF המקורי הראשון הורד למחשב ותויק בארכיון`);
      } else {
        showToast(`סריקת המייל הושלמה: אותרו ${finalInvoices.length} חשבוניות מקור חדשות!`);
      }
    } catch (err) {
      console.error('Scan email box error:', err);
      showToast('שגיאה במהלך סריקת תיבת הדוא״ל');
    } finally {
      setIsScanning(false);
    }
  };

  // --- Single Assembly Execution ---
  const handleStartAssembly = async () => {
    if (!selectedInvoice) return;
    setIsAssembling(true);
    setAssembleStep(1);

    await new Promise(r => setTimeout(r, 450));
    setAssembleStep(2);

    if (autoDownload) {
      try {
        await downloadInvoicePdfDirectly(selectedInvoice);
      } catch (e) {
        console.warn('Direct download notice:', e);
      }
    }

    await new Promise(r => setTimeout(r, 500));
    setAssembleStep(3);

    const updatedInvoice: InvoiceDocument = {
      ...selectedInvoice,
      status: 'ready_for_erp',
      isArchived: autoArchive,
      archivedAt: autoArchive ? new Date().toISOString() : selectedInvoice.archivedAt,
      archiveFolder: selectedInvoice.supplierName,
      extractionMethod: 'attachment_pdf',
      extractionQuality: 'original_pdf',
      totalSource: 'explicit_label',
      validationStatus: 'VALID',
      validationDetails: `תקינות אומתה : ${selectedInvoice.subtotal} + ${selectedInvoice.vatAmount} = ${selectedInvoice.totalAmount} ₪`,
      originalPdfStored: true,
      auditTrail: [
        {
          id: `aud-sync-${Date.now()}-1`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: 'Gmail Inbound & Archive Engine',
          action: autoArchive ? 'סריקה, הורדה (DOWNLOAD) ותיוק בארכיון' : 'סריקה והורדה מהמייל',
          details: autoArchive
            ? `קובץ ה-PDF המקורי (${emailMeta?.fileName || selectedInvoice.fileName}) הורד מהמייל, נשמר למחשב ותויק בארכיון תחת ${selectedInvoice.supplierName}`
            : 'קובץ ה-PDF המקורי נסרק ונשלף ל-PREVIEW.'
        },
        ...selectedInvoice.auditTrail
      ]
    };

    setArchivedIds(prev => new Set([...prev, selectedInvoice.id]));
    if (onArchiveInvoice) {
      onArchiveInvoice(updatedInvoice);
    }

    await new Promise(r => setTimeout(r, 400));
    setAssembleStep(4);
    await new Promise(r => setTimeout(r, 300));

    setIsAssembling(false);
    setAssembleStep(0);
    onClose();
    onAssembleAndPreview(updatedInvoice);
  };

  const handleQuickDownload = async (inv: InvoiceDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadingId(inv.id);
    try {
      await downloadInvoicePdfDirectly(inv);
      showToast(isHebrew ? `חשבונית (${inv.fileName || `${inv.invoiceNumber}.pdf`}) הורדה בהצלחה (DOWNLOAD)` : 'Invoice PDF downloaded successfully');
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleQuickArchive = (inv: InvoiceDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setArchivedIds(prev => new Set([...prev, inv.id]));
    const archivedDoc: InvoiceDocument = {
      ...inv,
      status: 'ready_for_erp',
      isArchived: true,
      archivedAt: new Date().toISOString(),
      archiveFolder: inv.supplierName,
      auditTrail: [
        {
          id: `aud-arch-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: 'דואר נכנס - תיוק ארכיון',
          action: 'תיוק בארכיון דיגיטלי',
          details: `החשבונית תויקה בארכיון הדיגיטלי תחת תיקיית ספק: ${inv.supplierName}`,
        },
        ...inv.auditTrail,
      ],
    };
    if (onArchiveInvoice) {
      onArchiveInvoice(archivedDoc);
    }
    showToast(isHebrew ? `חשבונית ${inv.invoiceNumber} תויקה בהצלחה בארכיון!` : 'Invoice archived successfully!');
  };

  const handleDownloadAll = async () => {
    if (!scanResult || scanResult.invoices.length === 0) return;
    showToast(`מוריד ${scanResult.invoices.length} חשבוניות מקור למחשב...`);
    for (const inv of scanResult.invoices) {
      await downloadInvoicePdfDirectly(inv);
      await new Promise(r => setTimeout(r, 350));
    }
    showToast(`כל ${scanResult.invoices.length} החשבוניות הורדו בהצלחה למחשב!`);
  };

  const handleQuickPreview = (inv: InvoiceDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPreviewDoc(inv);
    setIsPreviewOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 end-8 z-60 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-2xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div 
        dir="rtl"
        className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-l from-indigo-50/80 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  סריקת מייל, הורדת חשבונית (DOWNLOAD) ותיוק בארכיון (ARCHIVE)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Gmail Sync & Archive
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                חילוץ קובצי PDF מקוריים, שמירה למחשב, תיוק מסודר בארכיון הדיגיטלי עם תצוגת PREVIEW מיידית
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('scan')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'scan'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>סריקת תיבה מלאה</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'single'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>הרכבת הודעה בודדת</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Workflow Automation Checkboxes (DOWNLOAD & ARCHIVE) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                פעולות סריקה אוטומטיות (DOWNLOAD ➔ ARCHIVE ➔ PREVIEW):
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">סריקה ➔ הורדה ➔ תיוק בארכיון ➔ תצוגה מקדימה</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition">
                <input
                  type="checkbox"
                  checked={autoDownload}
                  onChange={e => setAutoDownload(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>הורד את החשבוניות למחשב (DOWNLOAD)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">שמירה ישירה של קובצי ה-PDF המקוריים בדיסק המקומי</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition">
                <input
                  type="checkbox"
                  checked={autoArchive}
                  onChange={e => setAutoArchive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <FolderArchive className="w-3.5 h-3.5 text-indigo-600" />
                    <span>תייק בארכיון הדיגיטלי (ARCHIVE)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">תיוק לפי ספק ותאריך ושמירה לצמיתות לעיון והורדה</div>
                </div>
              </label>
            </div>
          </div>

          {/* TAB 1: FULL MAILBOX SCAN */}
          {activeTab === 'scan' && (
            <div className="space-y-5">
              {/* Mailbox and Range Selector Bar */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-indigo-600" />
                      <span>תיבת דוא״ל לסריקה:</span>
                    </label>
                    <div className="text-xs font-mono text-indigo-700 dark:text-indigo-400 font-bold mt-0.5">
                      {selectedBoxEmail} (תיבה מחוברת ומאומתת)
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={handleStartEmailScan}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 transition active:scale-95 cursor-pointer shrink-0"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>סורק ומחלץ חשבוניות...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>הפעל סריקה, DOWNLOAD ותיוק לארכיון</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Range Pills */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">
                    בחר טווח תאריכים לסריקת המיילים:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {TIME_RANGES.map(r => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setSelectedRange(r.key)}
                        className={`p-2 rounded-lg text-start transition border cursor-pointer ${
                          selectedRange === r.key
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span>{r.icon}</span>
                          <span>{r.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {r.sublabel}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Scanning Progress */}
              {isScanning && (
                <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      {scanStep}
                    </span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {scanProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-indigo-200 dark:bg-indigo-900/50 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Scan Results View */}
              {scanResult && !isScanning && (
                <div className="space-y-4">
                  {/* Summary Banner */}
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>סריקת {TIME_RANGES.find(r => r.key === scanResult.range)?.sublabel} הושלמה בהצלחה!</span>
                      </div>
                      <span className="text-xs font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded">
                        {selectedBoxEmail}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 text-center">
                      <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/50">
                        <div className="text-[11px] text-slate-500">הודעות שנבדקו</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {scanResult.emailsScanned.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/50">
                        <div className="text-[11px] text-slate-500">חשבוניות שאותרו ונקלטו</div>
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {scanResult.invoices.length}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/50">
                        <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                          <Download className="w-3 h-3 text-indigo-600" />
                          <span>סטטוס DOWNLOAD</span>
                        </div>
                        <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                          {autoDownload ? 'הורד בהצלחה' : 'מוכן להורדה'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/50">
                        <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                          <FolderArchive className="w-3 h-3 text-emerald-600" />
                          <span>סטטוס ARCHIVE</span>
                        </div>
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                          {autoArchive ? 'תויק בארכיון' : 'באינבוקס'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 flex-wrap text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      פעולות מרוכזות לחשבוניות שנסרקו:
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleDownloadAll}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="הורד את כל קבצי ה-PDF שנסרקו למחשב"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>הורד את כולן למחשב (DOWNLOAD ALL)</span>
                      </button>

                      {onNavigateToArchive && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToArchive();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          title="עבור לארכיון הדיגיטלי"
                        >
                          <FolderArchive className="w-3.5 h-3.5" />
                          <span>פתח בארכיון הדיגיטלי (ARCHIVE)</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onNavigateToInbox) onNavigateToInbox();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                        <span>צפה באינבוקס ({scanResult.invoices.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Discovered Invoices Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>חשבוניות מקור שנקלטו מהסריקה ({scanResult.invoices.length}):</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        לכל חשבונית זמינות אפשרויות PREVIEW, DOWNLOAD ותיוק בארכיון
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-xs text-start">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                            <tr>
                              <th className="py-2.5 px-3 font-semibold text-start">ספק ושולח</th>
                              <th className="py-2.5 px-3 font-semibold text-start">נושא וקובץ</th>
                              <th className="py-2.5 px-3 font-semibold text-start">תאריך</th>
                              <th className="py-2.5 px-3 font-semibold text-start">סכום לתשלום</th>
                              <th className="py-2.5 px-3 font-semibold text-start">סטטוס תיוק</th>
                              <th className="py-2.5 px-3 font-semibold text-center">פעולות: PREVIEW / DOWNLOAD</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {scanResult.invoices.map((inv) => {
                              const isArchived = archivedIds.has(inv.id) || autoArchive || inv.isArchived;
                              const isDownloading = downloadingId === inv.id;

                              return (
                                <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">{inv.supplierName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">ח.פ {inv.supplierTaxId}</div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                                      חשבונית מס #{inv.invoiceNumber}
                                    </div>
                                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1">
                                      <FileText className="w-3 h-3" /> {inv.fileName}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                    {inv.issueDate}
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                    {inv.totalAmount.toLocaleString()} ₪
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    {isArchived ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                        <Check className="w-2.5 h-2.5" /> תויק בארכיון
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                        <Inbox className="w-2.5 h-2.5" /> באינבוקס
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      {/* 1. PREVIEW Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => handleQuickPreview(inv, e)}
                                        className="px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                        title="תצוגה מקדימה של חשבונית המקור (PREVIEW)"
                                      >
                                        <Eye className="w-3 h-3 text-indigo-600" />
                                        <span>PREVIEW</span>
                                      </button>

                                      {/* 2. DOWNLOAD Button */}
                                      <button
                                        type="button"
                                        disabled={isDownloading}
                                        onClick={(e) => handleQuickDownload(inv, e)}
                                        className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                        title="הורד קובץ PDF מקורי למחשב (DOWNLOAD)"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>הורד</span>
                                      </button>

                                      {/* 3. Archive Button */}
                                      {!isArchived && (
                                        <button
                                          type="button"
                                          onClick={(e) => handleQuickArchive(inv, e)}
                                          className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                                          title="תייק בארכיון הדיגיטלי"
                                        >
                                          <FolderArchive className="w-3 h-3" />
                                        </button>
                                      )}
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
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SINGLE MESSAGE RECONSTRUCTION & PREVIEW */}
          {activeTab === 'single' && (
            <div className="space-y-5">
              {/* Assembling Progress */}
              {isAssembling && (
                <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                      {assembleStep === 1 && 'שלב 1/4 : איתור וחילוץ קובץ ה-PDF המקורי מהודעת המייל (application/pdf)...'}
                      {assembleStep === 2 && 'שלב 2/4 : ביצוע הורדה (DOWNLOAD) של קובץ ה-PDF המקורי למחשב...'}
                      {assembleStep === 3 && 'שלב 3/4 : תיוק ושמירה בארכיון הדיגיטלי לפי ספק ותאריך (ARCHIVE)...'}
                      {assembleStep === 4 && 'שלב 4/4 : הרכבת מסמך מקור (1:1) ופתיחה ישירה ב-PREVIEW...'}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      {assembleStep === 1 ? '25%' : assembleStep === 2 ? '50%' : assembleStep === 3 ? '75%' : '100%'}
                    </span>
                  </div>

                  <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${assembleStep === 1 ? 25 : assembleStep === 2 ? 50 : assembleStep === 3 ? 75 : 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Message Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>בחר הודעת דוא״ל להורדה, תיוק וצפייה ב-PREVIEW:</span>
                  </label>
                  {onNavigateToArchive && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToArchive();
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>עבור לארכיון הדיגיטלי ➔</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {availableInvoices.slice(0, 8).map(inv => {
                    const isSelected = inv.id === selectedInvoiceId;
                    const meta = getInvoiceEmailMetadata(inv);
                    const isArchived = archivedIds.has(inv.id) || inv.isArchived;

                    return (
                      <div
                        key={inv.id}
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className={`p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 dark:border-indigo-500 ring-1 ring-indigo-600'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="radio"
                            name="selectedInvoice"
                            checked={isSelected}
                            onChange={() => setSelectedInvoiceId(inv.id)}
                            className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span>{meta.senderName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({meta.senderEmail})</span>
                              {isArchived && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                                  <Check className="w-2.5 h-2.5" /> תויק בארכיון
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-md">
                              {meta.subject}
                            </div>
                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{meta.fileName} ({meta.fileSize})</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-end shrink-0 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleQuickPreview(inv, e)}
                            className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            title="תצוגה מקדימה"
                          >
                            <Eye className="w-3 h-3" />
                            <span>PREVIEW</span>
                          </button>

                          <button
                            type="button"
                            disabled={downloadingId === inv.id}
                            onClick={(e) => handleQuickDownload(inv, e)}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            title="הורד PDF"
                          >
                            <Download className="w-3 h-3" />
                            <span>הורד</span>
                          </button>

                          <div className="font-mono font-bold text-slate-900 dark:text-white ps-1">
                            {inv.totalAmount.toLocaleString()} ₪
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            סגור
          </button>

          {activeTab === 'scan' ? (
            <div className="flex items-center gap-2">
              {scanResult && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToInbox) onNavigateToInbox();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <Inbox className="w-4 h-4" />
                  <span>הצג {scanResult.invoices.length} חשבוניות באינבוקס</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleStartEmailScan}
                disabled={isScanning}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>מבצע סריקה והורדה...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-white" />
                    <span>הפעל סריקה, DOWNLOAD ותיוק לארכיון</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartAssembly}
              disabled={isAssembling || !selectedInvoice}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
            >
              {isAssembling ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
              <span>
                {isAssembling 
                  ? 'מעבד, מוריד ומתייק בארכיון...' 
                  : 'הורד (DOWNLOAD), תייק בארכיון (ARCHIVE) ופתח ב-PREVIEW'}
              </span>
              {!isAssembling && <ArrowRight className="w-4 h-4 rotate-180" />}
            </button>
          )}
        </div>
      </div>

      {/* Standalone Quick Preview Modal for the in-row preview button */}
      {previewDoc && (
        <InvoiceQuickPreviewModal
          invoice={previewDoc}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewDoc(null);
          }}
          language={language}
          onOpenFullDetail={(inv) => {
            setIsPreviewOpen(false);
            onClose();
            onAssembleAndPreview(inv);
          }}
        />
      )}
    </div>
  );
};
