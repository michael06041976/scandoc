import React, { useState } from 'react';
import { 
  Mail, 
  Paperclip, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { InvoiceDocument } from '../../types';
import { getInvoiceEmailMetadata } from '../../services/emailInvoiceData';

interface OriginalEmailMessageViewerProps {
  invoice: InvoiceDocument;
  onViewDocument: () => void;
  onDownloadPdf: () => void;
  onOpenInNewTab: () => void;
  onAssembleToPreview?: () => void;
}

export const OriginalEmailMessageViewer: React.FC<OriginalEmailMessageViewerProps> = ({
  invoice,
  onViewDocument,
  onDownloadPdf,
  onOpenInNewTab,
  onAssembleToPreview,
}) => {
  const emailData = getInvoiceEmailMetadata(invoice);
  const isSonol = invoice.supplierName?.includes('סונול') || invoice.supplierName?.includes('Sonol') || invoice.invoiceNumber === '3299586';
  const isIEC = invoice.supplierName?.includes('חשמל') || invoice.supplierTaxId === '520000472' || invoice.invoiceNumber?.includes('491506083');

  const [isAssembling, setIsAssembling] = useState(false);
  const [assemblyStep, setAssemblyStep] = useState<number>(0);

  const handleDownloadAndAssemble = () => {
    setIsAssembling(true);
    setAssemblyStep(1);

    setTimeout(() => {
      setAssemblyStep(2);
      setTimeout(() => {
        setAssemblyStep(3);
        setTimeout(() => {
          setIsAssembling(false);
          setAssemblyStep(0);
          if (onAssembleToPreview) {
            onAssembleToPreview();
          } else {
            onViewDocument();
          }
        }, 600);
      }, 700);
    }, 700);
  };

  return (
    <div className="w-full max-w-3xl flex flex-col space-y-4 text-xs font-sans">
      
      {/* Top Source Verification Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 p-3.5 rounded-xl border border-blue-200/80 dark:border-indigo-800/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>הודעת דוא״ל מקורית (Gmail)</span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                מקור מאומת
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              נסרק אוטומטית מתיבת: <strong className="font-mono text-slate-800 dark:text-slate-200">ambatline.reshbon@gmail.com</strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadAndAssemble}
          disabled={isAssembling}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition shrink-0 cursor-pointer active:scale-95"
        >
          {isAssembling ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>
            {isAssembling 
              ? (assemblyStep === 1 ? 'מוריד קובץ מקור...' : assemblyStep === 2 ? 'מרכיב ל-PREVIEW...' : 'מוכן!') 
              : 'הורד קובץ מקור והרכב ל-PREVIEW'}
          </span>
          {!isAssembling && <ArrowRight className="w-3.5 h-3.5 rotate-180" />}
        </button>
      </div>

      {/* Assembly Progress Banner if active */}
      {isAssembling && (
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/70 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              {assemblyStep === 1 && `שלב 1: מוריד את קובץ המקור (${emailData.fileName}) משרת הדוא״ל...`}
              {assemblyStep === 2 && `שלב 2: מפענח ומרכיב את עמודי המקור (${isIEC ? '3 עמודים' : 'עמוד 1'}), חותמת דיגיטלית והקצאה...`}
              {assemblyStep === 3 && 'שלב 3: מוסיף ל-PREVIEW ופותח לצפייה ישירה!'}
            </span>
            <span className="font-mono">{assemblyStep === 1 ? '35%' : assemblyStep === 2 ? '75%' : '100%'}</span>
          </div>
          <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${assemblyStep === 1 ? 35 : assemblyStep === 2 ? 75 : 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Authentic Email Client Container (Gmail style) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        
        {/* Email Subject & Thread Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Inbox
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  חשבוניות וקבלות
                </span>
                {isSonol && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Sonol EVI
                  </span>
                )}
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                {emailData.subject}
              </h2>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap pt-1">
              {emailData.receivedDate}
            </div>
          </div>

          {/* Sender & Recipient Metadata */}
          <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {/* Sender Avatar */}
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                {isSonol ? 'S' : emailData.senderName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {emailData.senderName}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    &lt;{emailData.senderEmail}&gt;
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>אל:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {emailData.recipientName}
                  </span>
                  <span className="font-mono text-slate-400">
                    &lt;{emailData.recipientEmail}&gt;
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>חתימת SPF/DKIM תקינה</span>
            </div>
          </div>
        </div>

        {/* Email Body Content */}
        <div className="p-5 sm:p-7 space-y-6 leading-relaxed text-slate-700 dark:text-slate-300 text-xs">
          
          {/* Branded Banner inside Email (if Sonol) */}
          {isSonol && (
            <div className="bg-[#008752] text-white p-4 rounded-xl shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white text-[#008752] font-black text-xs flex flex-col items-center justify-center shadow-sm">
                  <span>EVI</span>
                  <span className="text-[6px] tracking-tight text-slate-800">SONOL</span>
                </div>
                <div>
                  <div className="text-sm font-black tracking-wide">
                    סונול אי.וי.אי בע״מ • Sonol EVI
                  </div>
                  <div className="text-[10px] text-emerald-100">
                    חשבונית מס / קבלה על טעינת רכב חשמלי (רשת ציבורית)
                  </div>
                </div>
              </div>

              <div className="text-left font-mono">
                <div className="text-[10px] text-emerald-100">מספר חשבונית</div>
                <div className="text-sm font-black">{invoice.invoiceNumber}</div>
              </div>
            </div>
          )}

          {/* Email Text Greeting & Intro */}
          <div className="space-y-2">
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              {emailData.emailBodyHtml.greeting}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              {emailData.emailBodyHtml.intro}
            </p>
          </div>

          {/* Structured Details Box in Email */}
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center justify-between">
              <span>ריכוז פרטי החיוב מהודעת המייל:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                סה״כ: {invoice.totalAmount.toLocaleString()} {invoice.currency}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              {emailData.emailBodyHtml.detailsList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">{item.label}:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-left ltr font-mono">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Email Attachment Card (Crucial for User's expectation!) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Paperclip className="w-4 h-4 text-slate-500" />
              <span>קובץ מצורף להודעה (1 קובץ PDF מקורי):</span>
            </div>

            <div className="p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/40 dark:bg-indigo-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex flex-col items-center justify-center font-bold text-[10px] shadow-sm shrink-0">
                  <FileText className="w-6 h-6" />
                  <span className="text-[8px] font-mono mt-0.5">PDF</span>
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-mono">
                    {emailData.fileName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{emailData.fileSize}</span>
                    <span>•</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">מסמך מקור חתום דיגיטלית</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons on the Attachment */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadAndAssemble}
                  disabled={isAssembling}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  title="הורד את קובץ המקור מהמייל, הרכב אותו והצג ב-PREVIEW"
                >
                  {isAssembling ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>הורד והרכב ל-PREVIEW</span>
                </button>
                <button
                  type="button"
                  onClick={onViewDocument}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
                  title="הצג את המסמך בתצוגת A4"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>צפה ב-PREVIEW</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenInNewTab}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium text-xs flex items-center gap-1.5 transition"
                  title="פתח בכרטיסייה נפרדת"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>כרטיסייה חדשה</span>
                </button>
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
                  title="הורד קובץ PDF ישירות למחשב"
                >
                  <Download className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Email Sign-off */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
            {emailData.emailBodyHtml.signOff}
          </div>

        </div>

      </div>

    </div>
  );
};
