import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  ExternalLink, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Mail, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  FileCheck,
  Share2
} from 'lucide-react';
import { InvoiceDocument, Language } from '../types';
import { downloadInvoicePdfDirectly } from '../services/pdfGeneratorService';
import { OriginalEmailMessageViewer } from './invoice-modal/OriginalEmailMessageViewer';
import { AuthenticSupplierInvoiceRenderer } from './invoice-modal/AuthenticSupplierInvoiceRenderer';

interface InvoiceQuickPreviewModalProps {
  invoice: InvoiceDocument | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onOpenFullDetail?: (invoice: InvoiceDocument) => void;
}

export const InvoiceQuickPreviewModal: React.FC<InvoiceQuickPreviewModalProps> = ({
  invoice,
  isOpen,
  onClose,
  language,
  onOpenFullDetail,
}) => {
  if (!isOpen || !invoice) return null;

  const isHebrew = language === 'he';
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewTab, setViewTab] = useState<'document' | 'email'>('document');
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const allocationNumber = `2026-${(invoice.supplierTaxId || '510000000').slice(0, 5)}-${invoice.invoiceNumber.replace(/\D/g, '') || '748'}-01`;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const el = document.getElementById(`quick-preview-doc-${invoice.id}`);
      await downloadInvoicePdfDirectly(invoice, el);
      setToastMessage(isHebrew ? `חשבונית מקור (${invoice.fileName || `${invoice.invoiceNumber}.pdf`}) הורדה בהצלחה!` : 'Invoice PDF downloaded successfully!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-8 end-8 z-60 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-2xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div 
        id="quick-preview-container"
        className="w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isHebrew ? 'תצוגה מקדימה של חשבונית מקור' : 'Original Invoice Preview'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{invoice.supplierName}</span>
                <span>•</span>
                <span>ח.פ: {invoice.supplierTaxId}</span>
                <span>•</span>
                <span>תאריך: {invoice.issueDate}</span>
                <span>•</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{invoice.totalAmount.toLocaleString()} {invoice.currency}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewTab('document')}
                className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  viewTab === 'document'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isHebrew ? 'מסמך מקור (A4)' : 'Original PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('email')}
                className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  viewTab === 'email'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isHebrew ? 'מקור המייל' : 'Original Email'}</span>
              </button>
            </div>

            {/* Zoom Controls */}
            {viewTab === 'document' && (
              <div className="hidden sm:flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(prev - 15, 60))}
                  className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded transition"
                  title="הקטן"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1">{zoom}%</span>
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(prev + 15, 180))}
                  className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded transition"
                  title="הגדל"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded transition"
                  title="סובב"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Re-Assemble from Email button */}
            <button
              type="button"
              onClick={() => {
                setToastMessage(isHebrew ? 'קובץ המקור נמשך מחדש משרת הדוא״ל והורכב ל-PREVIEW!' : 'Original invoice re-fetched from email and assembled to PREVIEW!');
                setTimeout(() => setToastMessage(null), 4000);
              }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-blue-800 transition"
              title="שלוף מחדש את קובץ המקור מהודעת הדוא״ל והרכב לתצוגה"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>{isHebrew ? 'הרכב מחדש מהמייל' : 'Sync from Email'}</span>
            </button>

            {/* Direct Download PDF Button */}
            <button
              id="quick-preview-download-pdf-btn"
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="הורד קובץ PDF אמיתי למחשב"
            >
              {isDownloading ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600" />
              )}
              <span>{isDownloading ? (isHebrew ? 'מוריד...' : 'Downloading...') : (isHebrew ? 'הורד PDF' : 'Download PDF')}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="הדפס"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Open in full edit modal */}
            {onOpenFullDetail && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullDetail(invoice);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1 transition"
                title="עבור למסך עריכה מלא"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isHebrew ? 'עריכה ואישור ב-Priority' : 'Edit & Post'}</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 flex justify-center items-start">
          {viewTab === 'email' ? (
            <div className="w-full max-w-3xl">
              <OriginalEmailMessageViewer
                invoice={invoice}
                onViewDocument={() => setViewTab('document')}
                onAssembleToPreview={() => {
                  setViewTab('document');
                  setToastMessage(isHebrew ? 'חשבונית המקור הורדה מהמייל והורכבה בהצלחה ל-PREVIEW!' : 'Original invoice downloaded from email and assembled to PREVIEW!');
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                onDownloadPdf={handleDownload}
                onOpenInNewTab={() => window.open(invoice.fileUrl || '', '_blank')}
              />
            </div>
          ) : (
            <div 
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full max-w-[620px] flex flex-col items-center"
            >
              {/* Assembled From Email Badge */}
              <div className="w-full mb-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] flex items-center gap-1.5">
                      <span>מסמך מקור שהורכב מהקובץ המצורף במייל</span>
                      <span className="font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded text-[10px]">
                        {invoice.fileName || `${invoice.invoiceNumber}.pdf`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      סנכרון Gmail מאומת (ambatline.reshbon@gmail.com) • מודל חשבוניות ישראל
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewTab('email')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1 transition shrink-0 cursor-pointer"
                  title="צפה בהודעת המייל שממנה הגיע המסמך"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>הודעת מייל מקור</span>
                </button>
              </div>

              {/* High-Fidelity Israeli Tax Invoice Replica */}
              <div
                id={`quick-preview-doc-${invoice.id}`}
                className="w-full"
              >
                <AuthenticSupplierInvoiceRenderer
                  invoice={invoice}
                  interactive={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
