import React, { useState, useMemo } from 'react';
import { 
  FolderArchive, 
  Folder, 
  FolderOpen, 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Calendar, 
  Building2, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  ArrowUpDown, 
  FileCheck, 
  Layers, 
  SlidersHorizontal,
  ExternalLink,
  Sparkles,
  Archive,
  RefreshCw,
  FolderTree
} from 'lucide-react';
import { InvoiceDocument, Language } from '../types';
import { translations } from '../i18n/translations';
import { downloadInvoicePdfDirectly } from '../services/pdfGeneratorService';
import { InvoiceQuickPreviewModal } from './InvoiceQuickPreviewModal';

interface ArchiveViewProps {
  invoices: InvoiceDocument[];
  language: Language;
  onSelectInvoice: (invoice: InvoiceDocument) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  invoices,
  language,
  onSelectInvoice,
}) => {
  const isHebrew = language === 'he';
  const t = translations[language];

  // Navigation & Hierarchy State
  const [hierarchyMode, setHierarchyMode] = useState<'supplier_first' | 'date_first'>('supplier_first');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Quick Preview State
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleFolder = (key: string) => {
    setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Build supplier & date hierarchy
  const archiveTree = useMemo(() => {
    const suppliersMap: Record<string, {
      name: string;
      taxId: string;
      years: Record<string, {
        months: Record<string, InvoiceDocument[]>;
      }>;
      totalSpend: number;
      totalCount: number;
    }> = {};

    invoices.forEach(inv => {
      const supKey = inv.supplierName || 'ללא ספק';
      if (!suppliersMap[supKey]) {
        suppliersMap[supKey] = {
          name: supKey,
          taxId: inv.supplierTaxId || '',
          years: {},
          totalSpend: 0,
          totalCount: 0,
        };
      }
      suppliersMap[supKey].totalSpend += inv.totalAmount;
      suppliersMap[supKey].totalCount += 1;

      // Extract Year and Month from issueDate (YYYY-MM-DD or DD/MM/YYYY)
      let year = '2026';
      let month = '09';
      if (inv.issueDate) {
        if (inv.issueDate.includes('-')) {
          const parts = inv.issueDate.split('-');
          year = parts[0] || '2026';
          month = parts[1] || '09';
        } else if (inv.issueDate.includes('/')) {
          const parts = inv.issueDate.split('/');
          year = parts[2] || '2026';
          month = parts[1] || '09';
        }
      }

      if (!suppliersMap[supKey].years[year]) {
        suppliersMap[supKey].years[year] = { months: {} };
      }
      if (!suppliersMap[supKey].years[year].months[month]) {
        suppliersMap[supKey].years[year].months[month] = [];
      }
      suppliersMap[supKey].years[year].months[month].push(inv);
    });

    return suppliersMap;
  }, [invoices]);

  // Filtered Invoices based on search or folder selection
  const displayedInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Folder selections
      if (selectedSupplier && inv.supplierName !== selectedSupplier) {
        return false;
      }

      let year = '2026';
      let month = '09';
      if (inv.issueDate) {
        if (inv.issueDate.includes('-')) {
          const parts = inv.issueDate.split('-');
          year = parts[0] || '2026';
          month = parts[1] || '09';
        } else if (inv.issueDate.includes('/')) {
          const parts = inv.issueDate.split('/');
          year = parts[2] || '2026';
          month = parts[1] || '09';
        }
      }

      if (selectedYear && year !== selectedYear) return false;
      if (selectedMonth && month !== selectedMonth) return false;

      // 2. Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'archived') {
          if (!inv.isArchived && inv.status !== 'archived') return false;
        } else if (inv.status !== statusFilter) {
          return false;
        }
      }

      // 3. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchSupplier = inv.supplierName.toLowerCase().includes(q);
        const matchNumber = inv.invoiceNumber.toLowerCase().includes(q);
        const matchTaxId = inv.supplierTaxId.includes(q);
        const matchFileName = (inv.fileName || '').toLowerCase().includes(q);
        const matchAmount = inv.totalAmount.toString().includes(q);
        if (!matchSupplier && !matchNumber && !matchTaxId && !matchFileName && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, selectedSupplier, selectedYear, selectedMonth, statusFilter, searchTerm]);

  // Total summary of current view
  const currentTotalAmount = useMemo(() => {
    return displayedInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  }, [displayedInvoices]);

  const handleOpenPreview = (inv: InvoiceDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPreviewInvoice(inv);
    setIsPreviewOpen(true);
  };

  const handleDownloadInvoice = async (inv: InvoiceDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadingId(inv.id);
    try {
      await downloadInvoicePdfDirectly(inv);
      showToast(isHebrew ? `חשבונית מקור (${inv.fileName || `${inv.invoiceNumber}.pdf`}) הורדה בהצלחה` : 'Invoice PDF downloaded successfully');
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAllInCurrentFolder = async () => {
    showToast(isHebrew ? `מתחיל בהורדת ${displayedInvoices.length} חשבוניות מקור...` : `Downloading ${displayedInvoices.length} invoices...`);
    for (const inv of displayedInvoices) {
      await downloadInvoicePdfDirectly(inv);
      await new Promise(r => setTimeout(r, 400));
    }
    showToast(isHebrew ? `כל ${displayedInvoices.length} החשבוניות הורדו בהצלחה!` : 'All invoices downloaded successfully!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getMonthName = (m: string) => {
    const monthsHebrew: Record<string, string> = {
      '01': '01 - ינואר',
      '02': '02 - פברואר',
      '03': '03 - מרץ',
      '04': '04 - אפריל',
      '05': '05 - מאי',
      '06': '06 - יוני',
      '07': '07 - יולי',
      '08': '08 - אוגוסט',
      '09': '09 - ספטמבר',
      '10': '10 - אוקטובר',
      '11': '11 - נובמבר',
      '12': '12 - דצמבר',
    };
    return monthsHebrew[m] || m;
  };

  const resetHierarchy = () => {
    setSelectedSupplier(null);
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  return (
    <div id="archive-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 end-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isHebrew ? 'ארכיון דיגיטלי - חשבוניות מקור' : 'Digital Document Archive'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
                  {invoices.length} {isHebrew ? 'מסמכי מקור' : 'original files'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isHebrew ? 'ארכיון מאובטח ומסודר בתיקיות לפי ספקים ותאריכים לשמירה, תצוגה מקדימה והורדת קבצי PDF מקוריים' : 'Secure archive organized by suppliers and dates for original invoice PDFs'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Archive Actions */}
        <div className="flex items-center gap-2">
          {displayedInvoices.length > 0 && (
            <button
              onClick={handleDownloadAllInCurrentFolder}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs active:scale-95 transition cursor-pointer"
              title="הורד את כל קבצי ה-PDF בתיקייה זו למחשב"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isHebrew ? `הורד ${displayedInvoices.length} קבצים בתיקייה` : `Download ${displayedInvoices.length} Files`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isHebrew ? 'חיפוש בארכיון לפי ספק, מספר חשבונית, ח.פ, או שם קובץ...' : 'Search archive by supplier, invoice #, tax ID...'}
              className="w-full text-xs ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Hierarchy Mode & Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">{isHebrew ? 'כל הסטטוסים' : 'All Statuses'}</option>
              <option value="archived">{isHebrew ? 'תויק בארכיון (Archived)' : 'Archived'}</option>
              <option value="posted_to_erp">{isHebrew ? 'נרשם בפריוריטי' : 'Posted to Priority'}</option>
              <option value="ready_for_erp">{isHebrew ? 'מוכן לשידור' : 'Ready for ERP'}</option>
              <option value="pending_approval">{isHebrew ? 'ממתין לאישור' : 'Pending Approval'}</option>
              <option value="needs_attention">{isHebrew ? 'דורש בדיקה' : 'Needs Attention'}</option>
            </select>
          </div>
        </div>

        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={resetHierarchy}
            className={`font-semibold hover:text-indigo-600 transition flex items-center gap-1 ${
              !selectedSupplier && !selectedYear && !selectedMonth ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isHebrew ? 'ארכיון ראשי' : 'Root Archive'}</span>
          </button>

          {selectedSupplier && (
            <>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-400 ${isHebrew ? 'rotate-180' : ''}`} />
              <button
                onClick={() => { setSelectedYear(null); setSelectedMonth(null); }}
                className={`font-medium hover:text-indigo-600 transition flex items-center gap-1 ${
                  !selectedYear && !selectedMonth ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{selectedSupplier}</span>
              </button>
            </>
          )}

          {selectedYear && (
            <>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-400 ${isHebrew ? 'rotate-180' : ''}`} />
              <button
                onClick={() => setSelectedMonth(null)}
                className={`font-medium hover:text-indigo-600 transition flex items-center gap-1 ${
                  !selectedMonth ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>שנת {selectedYear}</span>
              </button>
            </>
          )}

          {selectedMonth && (
            <>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-400 ${isHebrew ? 'rotate-180' : ''}`} />
              <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{getMonthName(selectedMonth)}</span>
              </span>
            </>
          )}

          <div className="ms-auto text-[11px] text-slate-400 font-mono">
            {displayedInvoices.length} {isHebrew ? 'מסמכים' : 'docs'} • {currentTotalAmount.toLocaleString()} ILS
          </div>
        </div>
      </div>

      {/* Main Layout: Split Tree + Files Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Explorer Folder Tree (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-indigo-600" />
              <span>{isHebrew ? 'עץ תיקיות ספקים ותאריכים' : 'Folder Tree'}</span>
            </h3>
            <button
              onClick={resetHierarchy}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isHebrew ? 'הצג הכל' : 'Show All'}
            </button>
          </div>

          {/* Folder Hierarchy List */}
          <div className="space-y-1 text-xs">
            {Object.entries(archiveTree).map(([supName, supData]) => {
              const isSupSelected = selectedSupplier === supName;
              const isExpanded = expandedFolders[supName] ?? isSupSelected;

              return (
                <div key={supName} className="rounded-xl overflow-hidden">
                  {/* Supplier Folder Header */}
                  <div
                    onClick={() => {
                      toggleFolder(supName);
                      setSelectedSupplier(supName);
                      setSelectedYear(null);
                      setSelectedMonth(null);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition select-none ${
                      isSupSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="truncate">{supName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
                        {supData.totalCount}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                    </div>
                  </div>

                  {/* Years & Months Sub-folders */}
                  {isExpanded && (
                    <div className="ms-4 my-1 ps-2 border-s-2 border-slate-200 dark:border-slate-800 space-y-1">
                      {Object.entries(supData.years).map(([year, yearData]) => {
                        const yearKey = `${supName}-${year}`;
                        const isYearSelected = isSupSelected && selectedYear === year;
                        const isYearExpanded = expandedFolders[yearKey] ?? true;

                        return (
                          <div key={year}>
                            {/* Year Folder */}
                            <div
                              onClick={() => {
                                toggleFolder(yearKey);
                                setSelectedSupplier(supName);
                                setSelectedYear(year);
                                setSelectedMonth(null);
                              }}
                              className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition text-[11px] ${
                                isYearSelected && !selectedMonth
                                  ? 'bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>שנת {year}</span>
                              </div>
                              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isYearExpanded ? '' : '-rotate-90'}`} />
                            </div>

                            {/* Month Folders */}
                            {isYearExpanded && (
                              <div className="ms-4 my-0.5 ps-2 border-s border-slate-200 dark:border-slate-800 space-y-0.5">
                                {Object.entries(yearData.months).map(([month, monthInvoices]) => {
                                  const isMonthSelected = isSupSelected && selectedYear === year && selectedMonth === month;

                                  return (
                                    <div
                                      key={month}
                                      onClick={() => {
                                        setSelectedSupplier(supName);
                                        setSelectedYear(year);
                                        setSelectedMonth(month);
                                      }}
                                      className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition text-[11px] ${
                                        isMonthSelected
                                          ? 'bg-indigo-600 text-white font-bold'
                                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Folder className={`w-3 h-3 ${isMonthSelected ? 'text-white' : 'text-indigo-400'}`} />
                                        <span>{getMonthName(month)}</span>
                                      </div>
                                      <span className="font-mono text-[10px]">
                                        {monthInvoices.length}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Files Grid & Detail Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Folder Header Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider">
                {selectedSupplier ? `${selectedSupplier} ${selectedYear ? `(${selectedYear})` : ''}` : 'כל המסמכים בארכיון'}
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{selectedMonth ? `תיקיית ${getMonthName(selectedMonth)}` : (selectedSupplier ? `תיקיית ספק: ${selectedSupplier}` : 'כל תיקיות הספקים')}</span>
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                <span className="text-indigo-200 text-[10px] block">{isHebrew ? 'קבצים בתיקייה' : 'Files'}</span>
                <span className="font-mono font-bold text-white">{displayedInvoices.length} מסמכי PDF</span>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                <span className="text-indigo-200 text-[10px] block">{isHebrew ? 'סה״כ כספי' : 'Total'}</span>
                <span className="font-mono font-bold text-white">{currentTotalAmount.toLocaleString()} ₪</span>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {displayedInvoices.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <FolderArchive className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isHebrew ? 'אין מסמכים בתיקייה שנבחרה' : 'No documents in selected folder'}
              </p>
              <button
                onClick={resetHierarchy}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                <span>{isHebrew ? 'חזור לארכיון הראשי' : 'Return to Root Archive'}</span>
              </button>
            </div>
          )}

          {/* Invoices List / Cards */}
          <div className="space-y-3">
            {displayedInvoices.map(inv => {
              const allocationNum = `2026-${(inv.supplierTaxId || '510000000').slice(0, 5)}-${inv.invoiceNumber.replace(/\D/g, '') || '748'}-01`;
              const isDownloading = downloadingId === inv.id;

              return (
                <div
                  key={inv.id}
                  id={`archive-item-${inv.id}`}
                  className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* File Icon & Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {inv.fileName || `${inv.supplierName}_${inv.invoiceNumber}.pdf`}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                            PDF (ISO 32000)
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{inv.supplierName}</span>
                          <span>•</span>
                          <span>ח.פ: {inv.supplierTaxId}</span>
                          <span>•</span>
                          <span>חשבונית מס': <strong className="font-mono text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</strong></span>
                          <span>•</span>
                          <span>תאריך: {inv.issueDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Status */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                      <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
                        {inv.totalAmount.toLocaleString()} {inv.currency}
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        inv.status === 'archived' || inv.isArchived ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        inv.status === 'posted_to_erp' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        inv.status === 'ready_for_erp' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {inv.status === 'archived' || inv.isArchived ? (isHebrew ? 'תויק בארכיון מקור' : 'Archived') : (t.status[inv.status] || inv.status)}
                      </span>
                    </div>
                  </div>

                  {/* Subline Meta & Action Buttons */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>הקצאה: {allocationNum}</span>
                      </span>
                      <span>•</span>
                      <span>מע״מ: {inv.vatAmount.toLocaleString()} ₪</span>
                    </div>

                    {/* Dedicated Action Buttons */}
                    <div className="flex items-center gap-2 ms-auto">
                      {/* PREVIEW BUTTON (User Explicit Request) */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenPreview(inv, e)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        title="צפה בחשבונית המקור"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isHebrew ? 'תצוגה מקדימה (PREVIEW)' : 'Preview'}</span>
                      </button>

                      {/* DOWNLOAD BUTTON (User Explicit Request) */}
                      <button
                        type="button"
                        onClick={(e) => handleDownloadInvoice(inv, e)}
                        disabled={isDownloading}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="הורד קובץ PDF מקורי למחשב"
                      >
                        {isDownloading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600" />
                        )}
                        <span>{isDownloading ? (isHebrew ? 'מוריד...' : 'Downloading...') : (isHebrew ? 'הורד PDF' : 'Download PDF')}</span>
                      </button>

                      {/* Full Inspect Modal */}
                      <button
                        type="button"
                        onClick={() => onSelectInvoice(inv)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                        title="פתח ביומן הנהלת חשבונות מלא"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
    </div>
  );
};
