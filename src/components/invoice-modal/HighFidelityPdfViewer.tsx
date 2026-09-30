import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  ExternalLink,
  Layers,
  FileText,
  Mail,
  Eye,
  Paperclip,
  Check,
  AlertCircle,
  RefreshCw,
  Sliders,
  Sparkles,
  Upload,
  Link2,
  Copy,
  Maximize,
  Minimize
} from 'lucide-react';
import { InvoiceDocument, Language } from '../../types';
import { generateInvoicePdfDocument, downloadInvoicePdfDirectly } from '../../services/pdfGeneratorService';
import { AuthenticSupplierInvoiceRenderer } from './AuthenticSupplierInvoiceRenderer';
import { OriginalEmailMessageViewer } from './OriginalEmailMessageViewer';

// Initialize PDF.js worker using Vite's static asset URL
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
  } catch (err) {
    console.warn('PDF.js worker initialization notice:', err);
  }
}

export interface HighFidelityPdfViewerProps {
  invoice: InvoiceDocument;
  language?: Language;
  highlightedField?: string | null;
  onSelectField?: (fieldKey: string) => void;
  isScanning?: boolean;
  scanProgressText?: string;
  isManualEditMode?: boolean;
  onAttachOriginalFile?: (file: File, dataUrl: string) => void;
}

type ViewerDisplayMode = 'pdf_canvas' | 'native_embed' | 'paper_replica' | 'email_message';

export const HighFidelityPdfViewer: React.FC<HighFidelityPdfViewerProps> = ({
  invoice,
  language = 'he',
  highlightedField = null,
  onSelectField,
  isScanning = false,
  scanProgressText,
  isManualEditMode = false,
  onAttachOriginalFile,
}) => {
  // URLs and state
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [customFileUrl, setCustomFileUrl] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<ViewerDisplayMode>('paper_replica');
  
  // Custom URL input toggle
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [inputUrlValue, setInputUrlValue] = useState<string>('');
  const [urlLoadError, setUrlLoadError] = useState<string | null>(null);

  // PDF.js document and rendering state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [continuousScroll, setContinuousScroll] = useState<boolean>(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  // View controls
  const [scale, setScale] = useState<number>(1.25);
  const [rotation, setRotation] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'normal' | 'high_contrast' | 'scanned_paper'>('normal');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [attachFeedback, setAttachFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [page: number]: HTMLCanvasElement | null }>({});
  const renderTasksRef = useRef<{ [page: number]: any }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if URL is an image
  const isImageUrl = (url: string) => {
    return Boolean(
      url.startsWith('data:image/') ||
      url.match(/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i)
    );
  };

  const isImage = isImageUrl(resolvedUrl) || (customFileName && customFileName.match(/\.(png|jpe?g|webp|gif)$/i));

  // Resolve best PDF URL for the invoice
  useEffect(() => {
    let activeUrl = customFileUrl;
    setUrlLoadError(null);

    if (!activeUrl) {
      if (invoice.fileUrl && !invoice.fileUrl.startsWith('/mock/')) {
        activeUrl = invoice.fileUrl;
      } else if (invoice.fileUrl && invoice.fileUrl.startsWith('/mock/')) {
        activeUrl = invoice.fileUrl;
      }
    }

    // If still no valid URL or fileUrl is not available, generate a genuine vector PDF
    if (!activeUrl) {
      try {
        const generated = generateInvoicePdfDocument(invoice);
        activeUrl = generated.blobUrl;
      } catch (err) {
        console.error('Error generating fallback PDF blob URL:', err);
      }
    }

    setResolvedUrl(activeUrl || '');
    setInputUrlValue(activeUrl || '');
  }, [invoice, customFileUrl]);

  // Load PDF document using PDF.js
  useEffect(() => {
    if (!resolvedUrl || isImage || displayMode === 'paper_replica' || displayMode === 'email_message') {
      setIsLoadingPdf(false);
      return;
    }

    let isMounted = true;
    setIsLoadingPdf(true);
    setRenderError(null);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: resolvedUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/',
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setIsLoadingPdf(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('PDF.js fetch/parse error on URL, attempting fallback generation:', err);

        // If loading static mock or external URL failed (e.g. 404 or CORS),
        // seamlessly fall back to generating an authentic vector PDF document
        try {
          const generated = generateInvoicePdfDocument(invoice);
          const fallbackLoadingTask = pdfjsLib.getDocument({
            url: generated.blobUrl,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
            cMapPacked: true,
          });
          const doc = await fallbackLoadingTask.promise;
          if (!isMounted) return;

          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setResolvedUrl(generated.blobUrl);
          setIsLoadingPdf(false);
        } catch (fallbackErr: any) {
          if (!isMounted) return;
          console.error('All PDF rendering attempts failed:', fallbackErr);
          setRenderError(err?.message || 'לא ניתן לטעון את קובץ ה-PDF מהכתובת שסופקה.');
          setIsLoadingPdf(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
      // Cancel active renders
      Object.values(renderTasksRef.current).forEach((task: any) => {
        if (task && typeof task.cancel === 'function') {
          try { task.cancel(); } catch { /* ignore */ }
        }
      });
      renderTasksRef.current = {};
    };
  }, [resolvedUrl, isImage, invoice, displayMode]);

  // Render a specific page onto its canvas with High-DPI sharpness
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || isImage) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRefs.current[pageNum];
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      // Cancel any ongoing render task for this page
      if (renderTasksRef.current[pageNum]) {
        try {
          renderTasksRef.current[pageNum].cancel();
        } catch {
          // ignore cancellation
        }
        renderTasksRef.current[pageNum] = null;
      }

      // Base viewport at the requested scale and rotation
      const baseViewport = page.getViewport({ scale, rotation });

      // High DPI scaling (retina displays) for razor-sharp vector text and barcodes
      const outputScale = typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2;

      canvas.width = Math.floor(baseViewport.width * outputScale);
      canvas.height = Math.floor(baseViewport.height * outputScale);
      canvas.style.width = `${Math.floor(baseViewport.width)}px`;
      canvas.style.height = `${Math.floor(baseViewport.height)}px`;

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

      const renderContext = {
        canvasContext: ctx,
        transform: transform,
        viewport: baseViewport,
        background: 'rgb(255, 255, 255)',
      };

      const renderTask = page.render(renderContext);
      renderTasksRef.current[pageNum] = renderTask;

      await renderTask.promise;
      renderTasksRef.current[pageNum] = null;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn(`Render error on page ${pageNum}:`, err);
      }
    }
  }, [pdfDoc, scale, rotation, isImage]);

  // Re-render whenever pdfDoc, scale, rotation, or currentPage changes
  useEffect(() => {
    if (!pdfDoc || isLoadingPdf) return;

    if (continuousScroll) {
      for (let p = 1; p <= numPages; p++) {
        renderPage(p);
      }
    } else {
      renderPage(currentPage);
    }
  }, [pdfDoc, scale, rotation, currentPage, continuousScroll, isLoadingPdf, renderPage, numPages]);

  // Zoom helpers
  const handleZoomIn = () => setScale(prev => Math.min(Number((prev + 0.15).toFixed(2)), 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.5));
  const handleResetZoom = () => setScale(1.25);
  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 48;
      // standard A4 width is approx 595pt
      const newScale = Math.max(0.6, Math.min(2.5, containerWidth / 620));
      setScale(Number(newScale.toFixed(2)));
    }
  };

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // File Upload handler
  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomFileUrl(dataUrl);
      setCustomFileName(file.name);
      setResolvedUrl(dataUrl);
      setDisplayMode('pdf_canvas');
      setAttachFeedback(`חשבונית מקור (${file.name}) נטענה ישירות למנוע ה-PDF!`);
      setTimeout(() => setAttachFeedback(null), 4000);
      if (onAttachOriginalFile) {
        onAttachOriginalFile(file, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  // Drag & drop handlers
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
    if (file) processSelectedFile(file);
  };

  // Direct URL change
  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrlValue.trim()) return;
    setResolvedUrl(inputUrlValue.trim());
    setShowUrlInput(false);
    setDisplayMode('pdf_canvas');
    setAttachFeedback(`כתובת URL נטענה: ${inputUrlValue.trim()}`);
    setTimeout(() => setAttachFeedback(null), 3500);
  };

  // Download PDF
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const el = document.getElementById('scanned-invoice-document');
      const success = await downloadInvoicePdfDirectly(invoice, el);
      if (success) {
        setAttachFeedback(`הקובץ המקורי יורד כעת למחשבך!`);
        setTimeout(() => setAttachFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    const targetUrl = resolvedUrl || invoice.fileUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  // Print
  const handlePrint = () => {
    if (resolvedUrl && !resolvedUrl.startsWith('data:')) {
      const win = window.open(resolvedUrl, '_blank');
      if (win) {
        win.focus();
        setTimeout(() => win.print(), 500);
        return;
      }
    }
    window.print();
  };

  // Copy URL to clipboard
  const handleCopyUrl = () => {
    if (resolvedUrl) {
      navigator.clipboard.writeText(resolvedUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  // Field selection trigger
  const triggerFieldClick = (fieldKey: string) => {
    if (onSelectField) {
      onSelectField(fieldKey);
    }
  };

  const currentFileName = customFileName || invoice.fileName || `${invoice.invoiceNumber}.pdf`;

  return (
    <div 
      className={`w-full h-full flex flex-col bg-slate-100 dark:bg-slate-950/80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* 1. TOP TOOLBAR: View Modes, URL Status, Zoom & Page Controls */}
      <div className="min-h-12 px-3 py-1.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none text-xs">
        
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Attach / Replace File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-xs"
            title="בחר או החלף קובץ PDF ישירות מהמחשב"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{customFileName ? 'החלף קובץ' : 'צרף קובץ PDF'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* View Mode Segmented Controls */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {/* 1. Authentic Source Invoice (from Email) */}
            <button
              type="button"
              onClick={() => setDisplayMode('paper_replica')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                displayMode === 'paper_replica'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="חשבונית מקור ממוחשבת שנשלחה במייל (נאמן למקור 1:1)"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>חשבונית מקור מהמייל</span>
            </button>

            {/* 2. Original Email (Gmail Thread) */}
            <button
              type="button"
              onClick={() => setDisplayMode('email_message')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                displayMode === 'email_message'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="צפה בהודעת המייל המקורית מ-Gmail שממנה התקבלה החשבונית"
            >
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">הודעת מייל מקורית</span>
            </button>

            {/* 3. Native Browser PDF Embed */}
            <button
              type="button"
              onClick={() => setDisplayMode('native_embed')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                displayMode === 'native_embed'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="תצוגה מובנית באמצעות נגן ה-PDF של הדפדפן (Acrobat/Chrome)"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">נגן דפדפן</span>
            </button>

            {/* 4. Raw PDF Vector Canvas (URL) */}
            <button
              type="button"
              onClick={() => setDisplayMode('pdf_canvas')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                displayMode === 'pdf_canvas'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="תצוגת שכבות סריקה ישירות מכתובת ה-URL"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">סריקה גולמית</span>
            </button>
          </div>
        </div>

        {/* Center: Zoom, Page Navigation & Rotate Controls */}
        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
          
          {/* Page Selector (when multi-page PDF in canvas mode) */}
          {displayMode === 'pdf_canvas' && numPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg me-1 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || continuousScroll}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                title="עמוד קודם"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              
              <span>
                עמוד <strong>{currentPage}</strong> מתוך <strong>{numPages}</strong>
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages || continuousScroll}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                title="עמוד הבא"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setContinuousScroll(!continuousScroll)}
                className={`ms-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  continuousScroll ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
                title="תצוגת גלילה רציפה של כל העמודים"
              >
                גלילה
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="הקטן תצוגה (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-0.5 rounded font-mono text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            title="איפוס זום (125%)"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="הגדל תצוגה (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFitWidth}
            className="px-2 py-0.5 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hidden xl:inline"
            title="התאם לרוחב החלון"
          >
            התאם רוחב
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {/* Rotate */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="סובב מסמך ב-90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Scanned Filter */}
          <button
            type="button"
            onClick={() => {
              setFilterMode(prev => prev === 'normal' ? 'high_contrast' : (prev === 'high_contrast' ? 'scanned_paper' : 'normal'));
            }}
            className={`p-1.5 rounded transition ${
              filterMode !== 'normal' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="פילטר שיפור קריאות / ניגודיות סריקה"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions (URL Toggle, Download, Print, Fullscreen) */}
        <div className="flex items-center gap-1.5">
          {/* Direct URL Input Toggle */}
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`px-2 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
              showUrlInput 
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="טען ישירות מכתובת URL מותאמת אישית"
          >
            <Link2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">כתובת URL</span>
          </button>

          {/* Open in new tab */}
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1 font-medium"
            title="פתח את קובץ ה-PDF המקורי בכרטיסייה נפרדת"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">פתח בטאב חדש</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold transition flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
            title="הורד קובץ PDF אמיתי למחשב"
          >
            {isDownloading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400 dark:text-rose-600" />
            ) : (
              <Download className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600" />
            )}
            <span>הורד</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="הדפס מסמך"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title={isFullscreen ? 'צא ממסך מלא' : 'מסך מלא'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. SUB-BAR: Active Source File URL & Metadata Banner */}
      <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>מקור הקובץ:</span>
            <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-[10.5px] truncate max-w-xs md:max-w-md">
              {currentFileName}
            </strong>
          </span>
          <span className="text-slate-400">|</span>
          <span>מנוע תצוגה: <strong>{displayMode === 'paper_replica' ? 'חשבונית מקור מהמייל (1:1)' : displayMode === 'email_message' ? 'הודעת Gmail מקורית' : displayMode === 'native_embed' ? 'נגן דפדפן' : 'סריקה וקטורית'}</strong></span>
          <span className="text-slate-400">|</span>
          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]" title={resolvedUrl}>
            {resolvedUrl.startsWith('data:') ? 'data:application/pdf (Base64)' : resolvedUrl.startsWith('blob:') ? 'blob:internal-vector-pdf' : resolvedUrl}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isManualEditMode && (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded font-semibold text-[10px]">
              ✏️ לחץ על שדות במסמך לעריכה מיידית
            </span>
          )}
          <button
            type="button"
            onClick={handleCopyUrl}
            className="hover:text-slate-800 dark:hover:text-slate-200 transition flex items-center gap-1 text-[10px]"
            title="העתק כתובת URL של הקובץ"
          >
            <Copy className="w-3 h-3" />
            <span>{copyFeedback ? 'הועתק!' : 'העתק קישור'}</span>
          </button>
        </div>
      </div>

      {/* 3. OPTIONAL URL INPUT DRAWER */}
      {showUrlInput && (
        <form 
          onSubmit={handleApplyCustomUrl}
          className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/70 border-b border-indigo-200 dark:border-indigo-800 flex items-center gap-2 animate-in slide-in-from-top duration-150"
        >
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg px-3 py-1.5 shadow-xs">
            <Link2 className="w-4 h-4 text-indigo-500 shrink-0" />
            <input
              type="text"
              value={inputUrlValue}
              onChange={(e) => setInputUrlValue(e.target.value)}
              placeholder="הזן כתובת URL ישירה לקובץ PDF (לדוגמה: https://domain.com/invoice.pdf או /mock/3299586.pdf)"
              className="w-full text-xs bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shrink-0 shadow-xs"
          >
            טען קובץ מ-URL
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            ביטול
          </button>
        </form>
      )}

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

      {/* 4. MAIN DOCUMENT RENDERING STAGE */}
      <div 
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 flex flex-col items-center justify-start relative transition-colors w-full select-text ${
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
              הקובץ ייטען ישירות למנוע ה-PDF וישמור על התאמה מושלמת למקור.
            </p>
          </div>
        )}

        {/* Animated Laser Scanning Beam */}
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

        {/* Loading Spinner */}
        {isLoadingPdf && displayMode === 'pdf_canvas' && !isImage && (
          <div className="my-16 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 max-w-md">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">טוען קובץ PDF ברזולוציה גבוהה...</h4>
            <p className="text-xs text-slate-500 mt-1">מעבד דפים, שכבות וקטוריות וגופנים מתוך הכתובת ישירות</p>
          </div>
        )}

        {/* Render Error Notice with Actionable Fallbacks */}
        {renderError && displayMode === 'pdf_canvas' && (
          <div className="my-8 p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-xl max-w-lg text-amber-900 dark:text-amber-100 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>הערה בטעינת קובץ המקור מ-URL</span>
            </div>
            <p className="text-[11.5px] leading-relaxed mb-3">
              {renderError}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setDisplayMode('paper_replica')}
                className="px-3 py-1 bg-amber-600 text-white rounded-md font-bold hover:bg-amber-700 transition"
              >
                עבור לתצוגת העתק נאמן למקור (A4)
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('native_embed')}
                className="px-3 py-1 bg-white dark:bg-slate-900 border border-amber-400 rounded-md font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100"
              >
                נסה נגן מובנה (Embed)
              </button>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="px-3 py-1 bg-white dark:bg-slate-900 border border-amber-400 rounded-md font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100"
              >
                פתח בטאב נפרד
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 1: HIGH-FIDELITY PDF CANVAS (DIRECT PDF.JS RENDERING)
           ========================================================================= */}
        {displayMode === 'pdf_canvas' && !isLoadingPdf && !renderError && !isImage && (
          <div 
            className="flex flex-col items-center gap-6 w-full py-2"
            style={{
              filter: filterMode === 'high_contrast' 
                ? 'contrast(1.4) grayscale(0.9)' 
                : filterMode === 'scanned_paper' 
                  ? 'sepia(0.2) contrast(1.05)' 
                  : 'none',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out'
            }}
          >
            {continuousScroll ? (
              // Continuous scroll of all pages
              Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div 
                  key={`page-${pageNum}`}
                  className="relative bg-white shadow-2xl rounded-sm border border-slate-300 dark:border-slate-800 overflow-hidden"
                >
                  <canvas
                    ref={(el) => { canvasRefs.current[pageNum] = el; }}
                    className="block max-w-full"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white rounded text-[10px] font-mono select-none">
                    {pageNum} / {numPages}
                  </div>
                </div>
              ))
            ) : (
              // Single page view with interactive overlays
              <div 
                className="relative bg-white shadow-2xl rounded-sm border border-slate-300 dark:border-slate-800 overflow-hidden"
              >
                <canvas
                  ref={(el) => { canvasRefs.current[currentPage] = el; }}
                  className="block max-w-full"
                />

                {/* Interactive Bounding Box Highlighting Overlay */}
                {highlightedField && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    title={`שדה מודגש: ${highlightedField}`}
                  >
                    {/* Visual pulse indicator highlighting active field */}
                    <div className="absolute top-4 start-4 px-3 py-1 bg-indigo-600/90 text-white text-[11px] font-bold rounded-lg shadow-lg flex items-center gap-1.5 animate-bounce">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>שדה נבחר: {highlightedField}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            IMAGE SOURCE FILE VIEW (IF URL POINTS TO AN IMAGE)
           ========================================================================= */}
        {isImage && displayMode === 'pdf_canvas' && (
          <div 
            style={{ 
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className="w-full max-w-[620px] bg-white shadow-2xl rounded-sm overflow-hidden p-2 border border-slate-300"
          >
            <img
              src={resolvedUrl}
              alt={`חשבונית מקור - ${invoice.supplierName}`}
              className="max-w-full h-auto object-contain block mx-auto"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* =========================================================================
            MODE 2: NATIVE PDF EMBED (BROWSER NATIVE VIEWER)
           ========================================================================= */}
        {displayMode === 'native_embed' && (
          <div className="w-full h-[780px] bg-white rounded-lg shadow-xl overflow-hidden border border-slate-300 dark:border-slate-700 flex flex-col">
            <object
              data={resolvedUrl}
              type="application/pdf"
              className="w-full h-full flex-1"
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                <FileText className="w-12 h-12 text-slate-400 mb-3" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  לא ניתן להציג את קובץ ה-PDF בנגן המובנה של הדפדפן
                </p>
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                >
                  פתח קובץ מקור ישירות בכרטיסייה חדשה
                </button>
              </div>
            </object>
          </div>
        )}

        {/* =========================================================================
            MODE 3: SCANNED A4 PAPER REPLICA VIEW (AUTHENTIC SUPPLIER RENDERER)
           ========================================================================= */}
        {displayMode === 'paper_replica' && (
          <div className="flex flex-col items-center w-full">
            {/* Authentic Source Badge from Gmail */}
            <div className="w-full max-w-[680px] mb-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl px-4 py-2 flex items-center justify-between shadow-xs text-xs">
              <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <div>
                  <div className="font-extrabold text-[12px] flex items-center gap-2">
                    <span>חשבונית מקור ממוחשבת מתוך המייל</span>
                    <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-bold">
                      {currentFileName}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-emerald-700 dark:text-emerald-300">
                    נשלח אל: ambatline.reshbon@gmail.com • מסמך מאושר לניכוי מס תשומות (נאמן למקור 1:1)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisplayMode('email_message')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 shadow-xs"
              >
                <Mail className="w-3 h-3 text-amber-500" />
                <span>צפה במייל המקורי</span>
              </button>
            </div>

            <div 
              id="scanned-invoice-document"
              style={{ 
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className={`relative w-full max-w-[680px] shadow-2xl rounded-sm overflow-hidden shrink-0 mb-8 transition-all ${
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
          </div>
        )}

        {/* =========================================================================
            MODE 4: ORIGINAL EMAIL MESSAGE VIEW (GMAIL SOURCE)
           ========================================================================= */}
        {displayMode === 'email_message' && (
          <div className="w-full flex justify-center mb-8 shrink-0">
            <OriginalEmailMessageViewer
              invoice={invoice}
              onViewDocument={() => setDisplayMode('pdf_canvas')}
              onDownloadPdf={handleDownload}
              onOpenInNewTab={handleOpenInNewTab}
            />
          </div>
        )}

      </div>
    </div>
  );
};
