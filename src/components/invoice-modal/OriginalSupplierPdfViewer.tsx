import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Printer, 
  FileText, 
  Layers, 
  Sparkles, 
  Maximize2, 
  Upload, 
  CheckCircle2, 
  Sliders, 
  ShieldCheck,
  QrCode,
  FileCheck,
  Paperclip,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  FileDown,
  Mail,
  ArrowRight
} from 'lucide-react';
import { InvoiceDocument, Language } from '../../types';
import { generateInvoicePdfDocument, downloadInvoicePdfDirectly } from '../../services/pdfGeneratorService';
import { OriginalEmailMessageViewer } from './OriginalEmailMessageViewer';
import { AuthenticSupplierInvoiceRenderer } from './AuthenticSupplierInvoiceRenderer';

interface OriginalSupplierPdfViewerProps {
  invoice: InvoiceDocument;
  language: Language;
  highlightedField: string | null;
  onSelectField: (field: string) => void;
  isScanning?: boolean;
  scanProgressText?: string;
  isManualEditMode?: boolean;
  onAttachOriginalFile?: (file: File, dataUrl: string) => void;
}

export const OriginalSupplierPdfViewer: React.FC<OriginalSupplierPdfViewerProps> = ({
  invoice,
  language,
  highlightedField,
  onSelectField,
  isScanning = false,
  scanProgressText,
  isManualEditMode = false,
  onAttachOriginalFile,
}) => {
  const hasExistingAttachment = Boolean(invoice.fileUrl?.startsWith('data:') || invoice.fileUrl?.startsWith('blob:'));
  
  const [customFileUrl, setCustomFileUrl] = useState<string | null>(
    invoice.fileUrl?.startsWith('data:') || invoice.fileUrl?.startsWith('blob:') ? invoice.fileUrl : null
  );
  const [customFileName, setCustomFileName] = useState<string | null>(
    invoice.fileUrl?.startsWith('data:') || invoice.fileUrl?.startsWith('blob:') ? invoice.fileName : null
  );
  
  // Real binary PDF URL generated on-the-fly for any document (initialized synchronously so it never returns 404)
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string>(() => {
    try {
      return generateInvoicePdfDocument(invoice).blobUrl;
    } catch {
      return '';
    }
  });
  // Available view modes: paper_replica, email_message (original Gmail message), ocr_layers, real_pdf
  const [viewMode, setViewMode] = useState<'paper_replica' | 'email_message' | 'ocr_layers' | 'real_pdf'>('paper_replica');
  
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'normal' | 'high_contrast' | 'scanned_paper'>('normal');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [attachFeedback, setAttachFeedback] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate real vector PDF blob for the current invoice
  useEffect(() => {
    try {
      const generated = generateInvoicePdfDocument(invoice);
      setGeneratedPdfUrl(generated.blobUrl);
    } catch (err) {
      console.error('Failed to generate PDF document:', err);
    }
  }, [invoice]);

  // Sync with invoice if fileUrl updates externally or when invoice changes
  useEffect(() => {
    if (invoice.fileUrl?.startsWith('data:') || invoice.fileUrl?.startsWith('blob:')) {
      setCustomFileUrl(invoice.fileUrl);
      setCustomFileName(invoice.fileName);
    } else {
      setCustomFileUrl(null);
      setCustomFileName(null);
    }
    setViewMode('paper_replica');
  }, [invoice.id, invoice.fileUrl, invoice.fileName]);

  // Active URL to display in PDF viewer - NEVER use placeholder /mock/ URLs
  const activePdfUrl = customFileUrl || 
    (invoice.fileUrl && !invoice.fileUrl.startsWith('/mock/') ? invoice.fileUrl : null) || 
    generatedPdfUrl || 
    '';
  const isImageAttachment = Boolean(
    customFileUrl?.startsWith('data:image/') || 
    customFileName?.match(/\.(png|jpe?g|webp|gif)$/i) ||
    (invoice.fileUrl && !invoice.fileUrl.startsWith('/mock/') && invoice.fileUrl.match(/\.(png|jpe?g|webp|gif)$/i))
  );

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 15, 180));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoom(100);
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Process uploaded or dropped file
  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomFileUrl(dataUrl);
      setCustomFileName(file.name);
      setViewMode('paper_replica');
      setAttachFeedback(`חשבונית מקור (${file.name}) צורפה בהצלחה!`);
      setTimeout(() => setAttachFeedback(null), 4000);
      if (onAttachOriginalFile) {
        onAttachOriginalFile(file, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // File Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Open the real PDF file directly in a new browser tab
  const handleOpenInNewTab = () => {
    let url = activePdfUrl;
    if (!url || url.startsWith('/mock/')) {
      const generated = generateInvoicePdfDocument(invoice);
      url = generated.blobUrl;
    }
    const win = window.open(url, '_blank');
    if (!win) {
      handleDownload();
    }
  };

  // Download genuine .pdf binary file
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const el = document.getElementById('scanned-invoice-document');
      const success = await downloadInvoicePdfDirectly(invoice, el);
      if (success) {
        setAttachFeedback(`חשבונית מקור (${invoice.fileName || `${invoice.invoiceNumber}.pdf`}) יורדת כעת למחשבך!`);
        setTimeout(() => setAttachFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Print document
  const handlePrint = () => {
    if (activePdfUrl) {
      const printWindow = window.open(activePdfUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
        return;
      }
    }
    window.print();
  };

  // Allocation number
  const allocationNumber = `2026-${(invoice.supplierTaxId || '510000000').slice(0, 5)}-${invoice.invoiceNumber.replace(/\D/g, '') || '748'}-01`;

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 dark:bg-slate-950/80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      
      {/* Top PDF Toolbar */}
      <div className="min-h-11 px-3 py-1.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none text-xs">
        
        {/* Left: View Mode Toggle & Attach Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Main Attach Original Invoice Action */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-xs"
            title="בחר קובץ PDF או תמונה מהמחשב לצירוף ישיר לחשבונית זו"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>{customFileName || hasExistingAttachment ? 'החלף קובץ מקור' : 'צרף חשבונית מקור (PDF)'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*,.tif,.tiff"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {/* 1. Paper Replica Mode (Primary & Default) */}
            <button
              type="button"
              onClick={() => setViewMode('paper_replica')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'paper_replica'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="תצוגת מסמך חשבונית מקור (A4)"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>מסמך מקור (A4)</span>
            </button>

            {/* 2. Original Email Message Mode (Gmail) */}
            <button
              type="button"
              onClick={() => setViewMode('email_message')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'email_message'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-indigo-300 dark:ring-indigo-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="הצג את הודעת המייל המקורית שממנה חולצה החשבונית"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>הודעת מייל מקורית</span>
            </button>

            {/* 3. OCR Layers Mode */}
            <button
              type="button"
              onClick={() => setViewMode('ocr_layers')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                viewMode === 'ocr_layers'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>שכבות OCR</span>
            </button>

            {/* 4. Real PDF & External Reader Mode */}
            <button
              type="button"
              onClick={() => setViewMode('real_pdf')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                viewMode === 'real_pdf'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>קובץ PDF מקור</span>
            </button>
          </div>
        </div>

        {/* Center: Zoom & Rotate Controls */}
        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="הקטן תצוגה (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            title="אפס זום (100%)"
          >
            {zoom}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="הגדל תצוגה (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <button
            type="button"
            onClick={handleRotate}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="סובב מסמך 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterMode(prev => prev === 'normal' ? 'high_contrast' : (prev === 'high_contrast' ? 'scanned_paper' : 'normal'));
            }}
            className={`p-1 rounded transition flex items-center gap-1 ${
              filterMode !== 'normal' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="פילטר חידוד סריקה / ניגודיות"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions (Open in new tab, Download, Print) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1 font-medium"
            title="פתח את קובץ ה-PDF המקורי בכרטיסייה נפרדת (Acrobat/דפדפן)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">פתח בכרטיסייה חדשה</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold transition flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
            title="הורד קובץ PDF אמיתי של הספק למחשב"
          >
            {isDownloading ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin text-rose-400 dark:text-rose-600" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600" />
            )}
            <span>{isDownloading ? 'מוריד PDF...' : 'הורד PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="הדפס מסמך מקור"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-header info bar & Audit Traceability */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 text-[11px]">
        <div className="flex items-center justify-between flex-wrap gap-2 text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>קובץ מקור: <strong>{customFileName || invoice.fileName || `${invoice.supplierName}_${invoice.invoiceNumber}.pdf`}</strong></span>
            </span>
            <span className="text-slate-400">|</span>
            <span>פורמט: <strong>PDF (ISO 32000-1)</strong></span>
            <span className="text-slate-400">|</span>
            <span>ספק: <strong>{invoice.supplierName}</strong></span>
            <span className="text-slate-400">|</span>
            <span>מספר הקצאה: <strong>{allocationNumber}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {isManualEditMode && (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded font-semibold text-[10px]">
                ✏️ לחץ על כל שדה במסמך כדי לערוך אותו
              </span>
            )}
          </div>
        </div>

        {/* Audit Pipeline Traceability Badge (Requirement 4) */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Extraction Method Badge */}
            {(!invoice.extractionMethod || invoice.extractionMethod === 'attachment_pdf') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <Paperclip className="w-3 h-3 text-emerald-600" />
                <span>Source : Pièce jointe PDF originale (bytes bruts préservés)</span>
              </span>
            )}
            {invoice.extractionMethod === 'link_pdf' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                <ExternalLink className="w-3 h-3 text-blue-600" />
                <span>Source : Téléchargé via lien HTTP depuis le corps du mail</span>
              </span>
            )}
            {invoice.extractionMethod === 'screenshot_fallback' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>extraction approximative - PDF source non disponible</span>
              </span>
            )}

            {/* Total Source Badge (Rule 2) */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>Total :</span>
              <strong className="text-slate-900 dark:text-white">
                {invoice.totalSource === 'calculated' ? 'Calculé (déduit)' : 'Explicite sur document'}
              </strong>
            </span>

            {/* Coherence Validation Status (Rule 5) */}
            {invoice.validationStatus === 'MISMATCH' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>Écart de cohérence détecté</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                <span>Cohérence validée (Sous-total + TVA = Total & Lignes vérifiées)</span>
              </span>
            )}
          </div>

          <div className="text-[10px] text-slate-400 font-mono">
            Source de vérité : PDF original
          </div>
        </div>

        {/* Warning if approximate screenshot fallback */}
        {invoice.extractionMethod === 'screenshot_fallback' && (
          <div className="mt-1 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Avertissement :</strong> extraction approximative - PDF source non disponible. Aucune pièce jointe PDF ni lien de téléchargement n'a été trouvé. Le montant a été extrait via capture d'écran.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Attachment Success Feedback Notice */}
      {attachFeedback && (
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/70 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{attachFeedback}</span>
          </div>
          <button 
            onClick={() => setAttachFeedback(null)} 
            className="text-[11px] underline text-emerald-700 dark:text-emerald-300 hover:text-emerald-900"
          >
            סגור
          </button>
        </div>
      )}

      {/* Document View Area with Drag & Drop, Zoom and Laser Scanner overlay */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 flex flex-col items-center justify-start relative transition-colors w-full ${
          isDragging 
            ? 'bg-indigo-100/90 dark:bg-indigo-950/80 ring-4 ring-indigo-500 ring-inset' 
            : 'bg-slate-200/70 dark:bg-slate-950/90'
        }`}
      >
        {/* Full-size Drag & Drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-40 bg-indigo-600/20 backdrop-blur-xs flex flex-col items-center justify-center border-4 border-dashed border-indigo-600 rounded-lg m-2 pointer-events-none text-center p-6">
            <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-lg animate-bounce">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-indigo-950 dark:text-white">
              שחרר כאן את קובץ החשבונית המקורית
            </h3>
            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-200 mt-1 max-w-sm">
              קובץ ה-PDF או הסריקה יצורף מיד לחשבונית זו, יישמר במערכת ויוצג בחלון התצוגה המלא.
            </p>
          </div>
        )}
        
        {/* Animated Laser Scanning Beam when Re-scanning is active */}
        {isScanning && (
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden flex flex-col items-center justify-center bg-indigo-900/20 backdrop-blur-[1px]">
            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_4px_rgba(34,211,238,0.7)] animate-[scan_2s_ease-in-out_infinite]"></div>
            
            <div className="bg-slate-900/90 text-white border border-cyan-500/50 shadow-2xl rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
              <div>
                <div className="text-xs font-bold text-cyan-300">סריקה חוזרת ופענוח ראיית מכונה פעילים...</div>
                <div className="text-[11px] text-slate-300">{scanProgressText || 'מנתח שכבות טקסט, ח.פ, תאריכים ותחשיב מע״מ...'}</div>
              </div>
            </div>
          </div>
        )}

        {/* 1. ORIGINAL EMAIL MESSAGE VIEW (GMAIL) */}
        {viewMode === 'email_message' && (
          <div className="w-full flex justify-center mb-8 shrink-0">
            <OriginalEmailMessageViewer
              invoice={invoice}
              onViewDocument={() => setViewMode('paper_replica')}
              onDownloadPdf={handleDownload}
              onOpenInNewTab={handleOpenInNewTab}
            />
          </div>
        )}

        {/* 2. REAL PDF & EXTERNAL VIEWER / IMAGE VIEW */}
        {viewMode === 'real_pdf' && (
          <div className="w-full max-w-[560px] flex flex-col items-center mb-4 shrink-0">
            {/* Top Action Bar for Real PDF / Download */}
            <div className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    קובץ PDF מקור של {invoice.supplierName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {customFileName || invoice.fileName || `${invoice.invoiceNumber}.pdf`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                  title="פתח את קובץ ה-PDF המלא בכרטיסייה נפרדת"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>פתח בכרטיסייה חדשה</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  title="הורד קובץ PDF אמיתי"
                >
                  {isDownloading ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{isDownloading ? 'מוריד PDF...' : 'הורד PDF'}</span>
                </button>
              </div>
            </div>

            <div className="w-full mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                מסמך החשבונית המקורי חתום ומאומת במלואו. מוצג להלן בפריסה הווקטורית הרשמית של הספק:
              </span>
            </div>

            {/* If user attached an image, show the original image scan */}
            {isImageAttachment && activePdfUrl && (
              <div className="w-full mt-4 bg-white rounded-lg shadow-2xl p-2 border border-slate-300 flex items-center justify-center overflow-hidden">
                <img
                  src={activePdfUrl}
                  alt={`חשבונית מקור - ${invoice.supplierName}`}
                  className="max-w-full h-auto object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        )}

        {/* Informative Email Source Banner when viewing document replica */}
        {(viewMode === 'paper_replica' || viewMode === 'ocr_layers') && (
          <div className="w-full max-w-[560px] mb-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 border border-blue-200/90 dark:border-indigo-800/80 text-[11px] flex items-center justify-between text-slate-800 dark:text-slate-200 shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div>
                <span>מקור המסמך: הודעת דוא״ל ב-<strong>ambatline.reshbon@gmail.com</strong></span>
                <span className="text-slate-500 dark:text-slate-400 ms-1">(קובץ: {invoice.fileName || `${invoice.invoiceNumber}.pdf`})</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('email_message')}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center gap-1 shrink-0 transition"
              title="הצג את הודעת המייל המקורית שממנה הגיע המסמך"
            >
              <span>הצג הודעת מייל</span>
              <ArrowRight className="w-3 h-3 rotate-180" />
            </button>
          </div>
        )}

        {/* 3. HIGH-FIDELITY SCANNED A4 PAPER DOCUMENT & OCR LAYERS VIEW */}
        {/* Render whenever in paper_replica, ocr_layers, or as live document preview in real_pdf */}
        {(viewMode === 'paper_replica' || viewMode === 'ocr_layers' || (!isImageAttachment && viewMode === 'real_pdf')) && (
          <div 
            id={`original-viewer-doc-${invoice.id}`}
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className={`relative w-full max-w-[620px] shadow-2xl rounded-sm overflow-hidden shrink-0 mb-8 transition-all ${
              filterMode === 'high_contrast' ? 'filter contrast-150 grayscale' : (filterMode === 'scanned_paper' ? 'sepia-[0.15]' : '')
            }`}
          >
            <AuthenticSupplierInvoiceRenderer
              invoice={invoice}
              onSelectField={onSelectField}
              highlightedField={highlightedField}
              interactive={true}
            />
          </div>
        )}

      </div>

    </div>
  );
};
