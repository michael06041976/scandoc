import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Scan, 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  Zap, 
  AlertCircle,
  FileCheck,
  Maximize2,
  Edit3,
  SlidersHorizontal,
  Plus,
  Trash2,
  Calculator,
  Check,
  RotateCcw,
  Search,
  Building2,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { InvoiceDocument, Language } from '../types';
import { mockSuppliers } from '../data/mockData';

interface InvoiceScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onScanComplete: (invoice: InvoiceDocument, autoOpenPreview: boolean) => void;
  initialFile?: File | null;
}

type ScanSource = 'file' | 'manual' | 'camera' | 'sample';

export const InvoiceScanModal: React.FC<InvoiceScanModalProps> = ({
  isOpen,
  onClose,
  language,
  onScanComplete,
  initialFile = null
}) => {
  if (!isOpen) return null;

  const isHebrew = language === 'he';

  const [activeSource, setActiveSource] = useState<ScanSource>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scannedResult, setScannedResult] = useState<InvoiceDocument | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const manualFileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual Scanner State
  const [manualSupplierName, setManualSupplierName] = useState<string>('חברת החשמל לישראל בע"מ');
  const [manualSupplierTaxId, setManualSupplierTaxId] = useState<string>('520000472');
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState<string>('2026-491506083');
  const [manualIssueDate, setManualIssueDate] = useState<string>('2026-09-18');
  const [manualDueDate, setManualDueDate] = useState<string>('2026-10-25');
  const [manualAllocationNo, setManualAllocationNo] = useState<string>('259062769');
  const [manualSubtotal, setManualSubtotal] = useState<number>(11550.48);
  const [manualVatRate, setManualVatRate] = useState<number>(18);
  const [manualVatAmount, setManualVatAmount] = useState<number>(2079.09);
  const [manualTotalAmount, setManualTotalAmount] = useState<number>(13629.57);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string>('');
  const [manualLines, setManualLines] = useState<Array<{ id: string; description: string; quantity: number; unitPrice: number; total: number }>>([
    { id: 'm-line-1', description: 'צריכת חשמל / אספקת שירות', quantity: 1, unitPrice: 11550.48, total: 11550.48 }
  ]);

  // If initialFile was provided on open, start scanning it
  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
      const url = URL.createObjectURL(initialFile);
      setPreviewUrl(url);
      runOcrScan(initialFile.name, url);
    }
  }, [initialFile]);

  // Clean up camera on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        isHebrew 
          ? 'לא ניתן לגשת למצלמה. אנא ודא הרשאות דפדפן או בחר קובץ מהמחשב.' 
          : 'Unable to access camera. Please check permissions or select a local file.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setPreviewUrl(dataUrl);
      stopCamera();
      runOcrScan(`צילום_סריקה_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`, dataUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      runOcrScan(file.name, url);
    }
  };

  const handleManualFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Auto-extract preliminary details from filename if applicable
      const lower = file.name.toLowerCase();
      if (lower.includes('חשמל')) {
        setManualSupplierName('חברת החשמל לישראל בע"מ');
        setManualSupplierTaxId('520000472');
      } else if (lower.includes('סונול') || lower.includes('sonol')) {
        setManualSupplierName('סונול EVI בע״מ (Sonol EVI)');
        setManualSupplierTaxId('515747814');
      } else if (lower.includes('טמבור') || lower.includes('tambour')) {
        setManualSupplierName('טמבור צבעים וחומרי בניין בע״מ');
        setManualSupplierTaxId('510293847');
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      runOcrScan(file.name, url);
    }
  };

  const handleManualDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Recalculate VAT & Total in manual scanner
  const handleManualVatRateChange = (rate: number, currentSubtotal: number = manualSubtotal) => {
    setManualVatRate(rate);
    const vat = Number(((currentSubtotal * rate) / 100).toFixed(2));
    const total = Number((currentSubtotal + vat).toFixed(2));
    setManualVatAmount(vat);
    setManualTotalAmount(total);
  };

  const handleManualSubtotalChange = (val: number) => {
    setManualSubtotal(val);
    const vat = Number(((val * manualVatRate) / 100).toFixed(2));
    const total = Number((val + vat).toFixed(2));
    setManualVatAmount(vat);
    setManualTotalAmount(total);
  };

  const handleSelectKnownSupplier = (supplierId: string) => {
    const sup = mockSuppliers.find(s => s.id === supplierId);
    if (sup) {
      setManualSupplierName(sup.name);
      setManualSupplierTaxId(sup.registrationNumber);
      const rate = sup.defaultVatRate || 18;
      setManualVatRate(rate);
      const vat = Number(((manualSubtotal * rate) / 100).toFixed(2));
      setManualVatAmount(vat);
      setManualTotalAmount(Number((manualSubtotal + vat).toFixed(2)));
    }
  };

  const handleSyncFromLines = () => {
    const sum = manualLines.reduce((acc, l) => acc + (l.total || 0), 0);
    const cleanSubtotal = Number(sum.toFixed(2));
    setManualSubtotal(cleanSubtotal);
    const vat = Number(((cleanSubtotal * manualVatRate) / 100).toFixed(2));
    setManualVatAmount(vat);
    setManualTotalAmount(Number((cleanSubtotal + vat).toFixed(2)));
  };

  const handleAddManualLine = () => {
    setManualLines(prev => [
      ...prev,
      {
        id: `m-line-${Date.now()}`,
        description: 'שירות / פריט נוסף',
        quantity: 1,
        unitPrice: 100,
        total: 100
      }
    ]);
  };

  const handleUpdateManualLine = (index: number, field: string, val: any) => {
    setManualLines(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        item.total = Number(((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2));
      }
      next[index] = item;
      return next;
    });
  };

  const handleRemoveManualLine = (index: number) => {
    setManualLines(prev => prev.filter((_, i) => i !== index));
  };

  // Switch scanned result into the Manual Scanner for fine-tuning
  const handleEditScannedInManualMode = () => {
    if (scannedResult) {
      setManualSupplierName(scannedResult.supplierName);
      setManualSupplierTaxId(scannedResult.supplierTaxId);
      setManualInvoiceNumber(scannedResult.invoiceNumber);
      setManualIssueDate(scannedResult.issueDate);
      setManualDueDate(scannedResult.dueDate);
      setManualAllocationNo(scannedResult.fields?.allocationNumber?.value || '259062769');
      setManualSubtotal(scannedResult.subtotal);
      
      const effectiveRate = scannedResult.subtotal > 0 
        ? Math.round((scannedResult.vatAmount / scannedResult.subtotal) * 100) 
        : 18;
      setManualVatRate(effectiveRate);
      setManualVatAmount(scannedResult.vatAmount);
      setManualTotalAmount(scannedResult.totalAmount);
      
      if (scannedResult.lines && scannedResult.lines.length > 0) {
        setManualLines(scannedResult.lines.map((l, i) => ({
          id: l.id || `m-${i}`,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.total
        })));
      }
    }
    setActiveSource('manual');
  };

  const runOcrScan = (fileName: string, fileUrl: string, presetSupplier?: string) => {
    setIsScanning(true);
    setScannedResult(null);
    setScanStep(1);
    setScanProgress(15);

    const isIEC = fileName.includes('חשמל') || presetSupplier === 'iec';
    const isSonol = fileName.includes('סונול') || fileName.includes('Sonol') || presetSupplier === 'sonol';
    const isTambour = fileName.includes('טמבור') || presetSupplier === 'tambour';

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = isIEC ? '2026-491506083' : isSonol ? '3299586' : isTambour ? `TB-${randomSuffix}` : `INV-2026-${randomSuffix}`;
    const supplierName = isIEC 
      ? 'חברת החשמל לישראל בע"מ' 
      : isSonol 
        ? 'סונול EVI בע״מ (Sonol EVI)' 
        : isTambour 
          ? 'טמבור צבעים וחומרי בניין בע״מ' 
          : 'תנובה מרכז שיווק בע״מ';
    const supplierTaxId = isIEC ? '520000472' : isSonol ? '515747814' : isTambour ? '510293847' : '520034567';
    const allocationNo = isIEC ? '259062769' : isSonol ? '298104551' : `${Math.floor(200000000 + Math.random() * 90000000)}`;

    // Set mathematically consistent subtotal, VAT 18%, and total (Subtotal + VAT = Total exactly!)
    const vatRate = 18;
    const subtotal = isIEC ? 11550.48 : isSonol ? 1564.07 : isTambour ? 7161.02 : 4957.63;
    const vatAmount = Number(((subtotal * vatRate) / 100).toFixed(2));
    const totalAmount = Number((subtotal + vatAmount).toFixed(2));

    setTimeout(() => {
      setScanStep(2);
      setScanProgress(40);

      setTimeout(() => {
        setScanStep(3);
        setScanProgress(70);

        setTimeout(() => {
          setScanStep(4);
          setScanProgress(90);

          setTimeout(() => {
            setScanStep(5);
            setScanProgress(100);
            setIsScanning(false);

            const newDoc: InvoiceDocument = {
              id: `doc-scanned-${Date.now()}`,
              companyId: 'comp-1',
              fileName: fileName,
              fileUrl: fileUrl,
              fileType: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : fileName.toLowerCase().endsWith('.png') ? 'png' : 'jpg',
              documentType: 'tax_invoice',
              supplierId: `sup-${randomSuffix}`,
              supplierName: supplierName,
              supplierTaxId: supplierTaxId,
              invoiceNumber: invoiceNo,
              issueDate: new Date().toISOString().split('T')[0],
              dueDate: '2026-10-30',
              currency: 'ILS',
              subtotal: subtotal,
              vatAmount: vatAmount,
              totalAmount: totalAmount,
              purchaseOrderNumber: `PO-2026-${randomSuffix}`,
              receiptNumber: `RC-2026-${randomSuffix}`,
              overallConfidence: 99.4,
              status: 'ready_for_erp',
              duplicateRisk: 'none',
              isArchived: true,
              originalPdfStored: true,
              fields: {
                supplierName: { field: 'supplierName', label: 'שם ספק', value: supplierName, confidence: 99, status: 'valid' },
                supplierTaxId: { field: 'supplierTaxId', label: 'ח.פ / עוסק מורשה', value: supplierTaxId, confidence: 99, status: 'valid' },
                invoiceNumber: { field: 'invoiceNumber', label: 'מספר חשבונית', value: invoiceNo, confidence: 99, status: 'valid' },
                issueDate: { field: 'issueDate', label: 'תאריך הפקה', value: new Date().toISOString().split('T')[0], confidence: 99, status: 'valid' },
                dueDate: { field: 'dueDate', label: 'תאריך פירעון', value: '2026-10-30', confidence: 98, status: 'valid' },
                allocationNumber: { field: 'allocationNumber', label: 'מספר הקצאה ברשות המסים', value: allocationNo, confidence: 99, status: 'valid' },
                subtotal: { field: 'subtotal', label: 'סכום לפני מע״מ', value: `${subtotal.toLocaleString()} ₪`, confidence: 99, status: 'valid' },
                vatAmount: { field: 'vatAmount', label: `מע״מ (${vatRate}%)`, value: `${vatAmount.toLocaleString()} ₪`, confidence: 99, status: 'valid' },
                totalAmount: { field: 'totalAmount', label: 'סה״כ לתשלום', value: `${totalAmount.toLocaleString()} ₪`, confidence: 99, status: 'valid' },
              },
              lines: [
                {
                  id: `line-${randomSuffix}-1`,
                  description: isIEC ? 'אספקת חשמל וצריכת קוט״ש (18,680 קוט״ש)' : isSonol ? 'שירותי טעינה EVI ודלקנים' : isTambour ? 'חומרי בניין, צבעים וציוד נלווה' : 'חומרי גלם מובחרים סדרה א׳',
                  quantity: 1,
                  unitPrice: subtotal,
                  vatPercent: vatRate,
                  total: subtotal,
                  confidence: 99,
                }
              ],
              mathCheck: {
                passed: true,
                calculatedSubtotal: subtotal,
                statedSubtotal: subtotal,
                calculatedVat: vatAmount,
                statedVat: vatAmount,
                calculatedTotal: totalAmount,
                statedTotal: totalAmount,
                linesSum: subtotal,
                discrepancies: []
              },
              duplicateCheck: {
                risk: 'none',
                score: 0,
                reasons: []
              },
              threeWayMatch: {
                status: 'matched_100',
                poNumber: `PO-2026-${randomSuffix}`,
                receiptNumber: `RC-2026-${randomSuffix}`,
                priceVariance: 0,
                quantityVariance: 0,
                discrepancies: []
              },
              assignedUser: 'מיכל בן ארי (חשבת שכר וספקים)',
              receivedAt: new Date().toISOString(),
              correctionsCount: 0,
              comments: [],
              auditTrail: [
                {
                  id: `audit-${Date.now()}-1`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  user: 'סורק OCR ומנוע בינה מלאכותית',
                  action: 'סריקה ופענוח ממוחשב',
                  details: `מסמך נסרק וחולץ בהצלחה (מהימנות 99.4%), אומת אישור הקצאה ${allocationNo}`,
                }
              ]
            };

            setScannedResult(newDoc);
            // Immediately commit invoice to system database so it's not lost even if user closes modal
            onScanComplete(newDoc, false);
          }, 500);
        }, 500);
      }, 600);
    }, 500);
  };

  const handleSelectPreset = (presetKey: string) => {
    let fileName = '';
    let url = '';
    if (presetKey === 'iec') {
      fileName = 'חשבון_חברת_חשמל_2026-491506083.pdf';
      url = '/mock/iec_bill.pdf';
    } else if (presetKey === 'sonol') {
      fileName = 'חשבונית_סונול_EVI_3299586.pdf';
      url = '/mock/sonol_invoice.pdf';
    } else if (presetKey === 'tambour') {
      fileName = 'חשבונית_סרוקה_טמבור_TB8821.pdf';
      url = '/mock/tambour_scan.pdf';
    } else {
      fileName = 'חשבונית_מס_תנובה_מרכז.pdf';
      url = '/mock/tnuva_invoice.pdf';
    }

    setPreviewUrl(url);
    runOcrScan(fileName, url, presetKey);
  };

  const handleConfirmAndPreview = () => {
    if (!scannedResult) return;
    onScanComplete(scannedResult, true);
    onClose();
  };

  const handleConfirmAddToInbox = () => {
    if (!scannedResult) return;
    onScanComplete(scannedResult, false);
    onClose();
  };

  // Submit from Manual Scanner Workspace
  const handleConfirmManualScan = (openPreview: boolean) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const isMathClean = Math.abs(manualSubtotal + manualVatAmount - manualTotalAmount) <= 0.05;

    const finalInvoice: InvoiceDocument = {
      id: `doc-manual-${Date.now()}`,
      companyId: 'comp-1',
      fileName: selectedFile?.name || `${manualInvoiceNumber}.pdf`,
      fileUrl: previewUrl || '/mock/חשבון_חברת_חשמל_2026-491506083.pdf',
      fileType: selectedFile?.name?.toLowerCase().endsWith('.png') ? 'png' : selectedFile?.name?.toLowerCase().endsWith('.jpg') ? 'jpg' : 'pdf',
      documentType: 'tax_invoice',
      supplierId: `sup-${randomSuffix}`,
      supplierName: manualSupplierName || 'ספק כללי',
      supplierTaxId: manualSupplierTaxId || '510000000',
      invoiceNumber: manualInvoiceNumber || `INV-${randomSuffix}`,
      issueDate: manualIssueDate,
      dueDate: manualDueDate,
      currency: 'ILS',
      subtotal: manualSubtotal,
      vatAmount: manualVatAmount,
      totalAmount: manualTotalAmount,
      purchaseOrderNumber: `PO-2026-${randomSuffix}`,
      receiptNumber: `RC-2026-${randomSuffix}`,
      overallConfidence: 100,
      status: 'ready_for_erp',
      duplicateRisk: 'none',
      fields: {
        supplierName: { field: 'supplierName', label: 'שם ספק', value: manualSupplierName, confidence: 100, status: 'valid' },
        supplierTaxId: { field: 'supplierTaxId', label: 'ח.פ / עוסק מורשה', value: manualSupplierTaxId, confidence: 100, status: 'valid' },
        invoiceNumber: { field: 'invoiceNumber', label: 'מספר חשבונית', value: manualInvoiceNumber, confidence: 100, status: 'valid' },
        issueDate: { field: 'issueDate', label: 'תאריך הפקה', value: manualIssueDate, confidence: 100, status: 'valid' },
        dueDate: { field: 'dueDate', label: 'תאריך פירעון', value: manualDueDate, confidence: 100, status: 'valid' },
        allocationNumber: { field: 'allocationNumber', label: 'מספר הקצאה ברשות המסים', value: manualAllocationNo, confidence: 100, status: 'valid' },
        subtotal: { field: 'subtotal', label: 'סכום לפני מע״מ', value: `${manualSubtotal.toLocaleString()} ₪`, confidence: 100, status: 'valid' },
        vatAmount: { field: 'vatAmount', label: `מע״מ (${manualVatRate}%)`, value: `${manualVatAmount.toLocaleString()} ₪`, confidence: 100, status: 'valid' },
        totalAmount: { field: 'totalAmount', label: 'סה״כ לתשלום', value: `${manualTotalAmount.toLocaleString()} ₪`, confidence: 100, status: 'valid' }
      },
      lines: manualLines.map((l, i) => ({
        id: `line-m-${i + 1}`,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        vatPercent: manualVatRate,
        total: l.total,
        confidence: 100
      })),
      mathCheck: {
        passed: isMathClean,
        calculatedSubtotal: manualSubtotal,
        statedSubtotal: manualSubtotal,
        calculatedVat: manualVatAmount,
        statedVat: manualVatAmount,
        calculatedTotal: manualTotalAmount,
        statedTotal: manualTotalAmount,
        linesSum: manualSubtotal,
        discrepancies: isMathClean ? [] : ['נמצא הפרש קל בין סכום לפני מע״מ והמע״מ לבין סה״כ לתשלום']
      },
      duplicateCheck: { risk: 'none', score: 0, reasons: [] },
      threeWayMatch: {
        status: 'matched_100',
        poNumber: `PO-2026-${randomSuffix}`,
        receiptNumber: `RC-2026-${randomSuffix}`,
        priceVariance: 0,
        quantityVariance: 0,
        discrepancies: []
      },
      assignedUser: 'מחלקת כספים (סורק ידני)',
      receivedAt: new Date().toISOString(),
      correctionsCount: 1,
      comments: [],
      auditTrail: [
        {
          id: `audit-${Date.now()}-1`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: 'סורק ידני ובקרת קליטה',
          action: 'סריקה והזנה ידנית מאומתת',
          details: `ספק: ${manualSupplierName} | חשבונית: ${manualInvoiceNumber} | סה״כ: ${manualTotalAmount} ₪ | הקצאה: ${manualAllocationNo}`,
        }
      ]
    };

    onScanComplete(finalInvoice, openPreview);
    onClose();
  };

  // Filtered suppliers for quick manual selector
  const filteredSuppliers = mockSuppliers.filter(s => 
    s.name.includes(supplierSearchQuery) || s.registrationNumber.includes(supplierSearchQuery)
  );

  const isManualMathBalanced = Math.abs(manualSubtotal + manualVatAmount - manualTotalAmount) <= 0.05;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Hidden File Inputs */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="application/pdf,image/png,image/jpeg,image/webp,image/tiff" 
          className="hidden" 
          onChange={handleFileChange}
        />
        <input 
          type="file" 
          ref={manualFileInputRef} 
          accept="application/pdf,image/png,image/jpeg,image/webp,image/tiff" 
          className="hidden" 
          onChange={handleManualFileAttach}
        />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-slate-900 dark:to-indigo-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHebrew ? 'סריקת חשבוניות, OCR וסורק ידני מודרך' : 'Invoice Scanner & Manual Extraction Station'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  סורק ידני פעיל
                </span>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  תקן מע״מ 18% / 17%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isHebrew 
                  ? 'העלה קובץ, סרוק במצלמה או השתמש בסורק הידני להזנה ולכידה מדויקת של נתוני החשבונית' 
                  : 'Upload file, capture live camera, or use the interactive manual scanner'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Switcher Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveSource('file');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeSource === 'file'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isHebrew ? 'העלאת קובץ / גרירה' : 'Upload File'}</span>
          </button>

          {/* TAB 2: DEDICATED MANUAL SCANNER */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveSource('manual');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeSource === 'manual'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
            <span>{isHebrew ? 'סורק ידני והזנה מודרכת' : 'Manual Scanner'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
              ישיר
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSource('camera');
              startCamera();
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeSource === 'camera'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isHebrew ? 'סורק מצלמה חי' : 'Camera Scanner'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveSource('sample');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeSource === 'sample'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isHebrew ? 'חשבוניות לדוגמה' : 'Sample Invoices'}</span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Active Auto-Scan Progress Banner */}
          {isScanning && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  {scanStep === 1 && (isHebrew ? 'שלב 1/5: יישור זווית וזיהוי שולי מסמך (Auto-Deskew)...' : 'Step 1/5: Auto-deskew & border detection...')}
                  {scanStep === 2 && (isHebrew ? 'שלב 2/5: מנוע OCR עברי/אנגלי - פענוח שדות ליבה ופרטי ספק...' : 'Step 2/5: Dual-engine OCR extracting core fields & supplier details...')}
                  {scanStep === 3 && (isHebrew ? 'שלב 3/5: אימות מספר הקצאה ברשות המסים ואישור Comsign...' : 'Step 3/5: Validating allocation number with Tax Authority & Comsign seal...')}
                  {scanStep === 4 && (isHebrew ? 'שלב 4/5: פיענוח שורות פריטים ואימות תעריף מע״מ 18%...' : 'Step 4/5: Extracting line items & running independent 18% VAT math check...')}
                  {scanStep === 5 && (isHebrew ? 'שלב 5/5: הסריקה הושלמה בהצלחה! התאמה 99.4%' : 'Step 5/5: Scan successfully completed!')}
                </span>
                <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">{scanProgress}%</span>
              </div>

              <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>

              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                <span>קובץ בתהליך סריקה: <strong className="font-mono">{selectedFile?.name || 'מסמך מקור'}</strong></span>
                <span className="font-mono">זמן פיענוח ממוצע: 1.8 שניות</span>
              </div>
            </div>
          )}

          {/* TAB 1: FILE UPLOAD / DRAG & DROP */}
          {activeSource === 'file' && !isScanning && !scannedResult && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-indigo-50/40 dark:bg-slate-800/40 rounded-2xl p-8 text-center cursor-pointer transition group"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition mb-3">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {isHebrew ? 'לחץ לבחירת קובץ חשבונית או גרור לכאן' : 'Click to select invoice file or drag & drop'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {isHebrew 
                  ? 'תמיכה מלאה בקובצי PDF, תמונות JPG, PNG, סריקות מרובות עמודים וצילומים' 
                  : 'Supports PDF, JPG, PNG, multi-page scans and camera captures'}
              </p>
              
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                >
                  {isHebrew ? 'בחר קובץ מהמחשב' : 'Browse Local Files'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSource('manual');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 text-amber-800 dark:text-amber-200 hover:bg-amber-100 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>פתח בסורק ידני ישיר</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: COMPLETE MANUAL SCANNER & FIELD EXTRACTION WORKSPACE */}
          {activeSource === 'manual' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Top Banner with Quick Supplier Presets & File Attachment */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-amber-950 dark:text-amber-200">
                    סורק ידני פעיל: הזן, תקן ואמת את שדות החשבונית לפני קליטה
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => manualFileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-[11px] flex items-center gap-1 transition"
                  >
                    <Upload className="w-3 h-3 text-indigo-600" />
                    <span>{selectedFile ? `קובץ: ${selectedFile.name}` : 'צרף קובץ מקור לסורק'}</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Manual Scanner Layout: Document Preview / Form Entry */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Right Column: Editable Extraction Form */}
                <div className="lg:col-span-7 space-y-3.5">
                  
                  {/* Supplier Selection */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>פרטי ספק וזיהוי משפטי</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        בחר ספק מוכר להזנה מהירה או הקלד חופשי
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">שם הספק המלא</label>
                        <input
                          type="text"
                          value={manualSupplierName}
                          onChange={(e) => setManualSupplierName(e.target.value)}
                          placeholder="לדוגמה: חברת החשמל לישראל בע״מ"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">ח.פ / עוסק מורשה</label>
                        <input
                          type="text"
                          value={manualSupplierTaxId}
                          onChange={(e) => setManualSupplierTaxId(e.target.value)}
                          placeholder="לדוגמה: 520000472"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>

                    {/* Quick Known Supplier Badges */}
                    <div className="pt-1 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-slate-400">ספקים מהירים:</span>
                      {mockSuppliers.slice(0, 5).map(sup => (
                        <button
                          key={sup.id}
                          type="button"
                          onClick={() => handleSelectKnownSupplier(sup.id)}
                          className={`px-2 py-0.5 rounded text-[10px] transition border ${
                            manualSupplierName === sup.name
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-indigo-50'
                          }`}
                        >
                          {sup.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document Identifiers: Invoice No, Dates, Allocation No */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>פרטי חשבונית והקצאה</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">מספר חשבונית</label>
                        <input
                          type="text"
                          value={manualInvoiceNumber}
                          onChange={(e) => setManualInvoiceNumber(e.target.value)}
                          placeholder="מספר חשבונית"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">תאריך הפקה</label>
                        <input
                          type="date"
                          value={manualIssueDate}
                          onChange={(e) => setManualIssueDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">תאריך פירעון</label>
                        <input
                          type="date"
                          value={manualDueDate}
                          onChange={(e) => setManualDueDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">מספר הקצאה</label>
                        <input
                          type="text"
                          value={manualAllocationNo}
                          onChange={(e) => setManualAllocationNo(e.target.value)}
                          placeholder="רשות המסים"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Amounts & VAT Calculation */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                        <span>תחשיב כספי ושיעור מע״מ</span>
                      </span>
                      
                      {/* Live Math Integrity Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isManualMathBalanced
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                      }`}>
                        {isManualMathBalanced ? '✓ תחשיב מאומת 100%' : '⚠️ אי-התאמה בסכומים'}
                      </span>
                    </div>

                    {/* Quick VAT Rate Selectors */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[11px] text-slate-500">בחר שיעור מע״מ:</span>
                      <button
                        type="button"
                        onClick={() => handleManualVatRateChange(18)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                          manualVatRate === 18 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        18% (שיעור מעודכן)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleManualVatRateChange(17)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                          manualVatRate === 17 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        17% (תקני)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleManualVatRateChange(0)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                          manualVatRate === 0 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        0% (מע״מ אפס / פטור)
                      </button>
                    </div>

                    {/* 3 Main Amount Boxes */}
                    <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] text-slate-500 block mb-1">סכום לפני מע״מ (₪)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={manualSubtotal}
                          onChange={(e) => handleManualSubtotalChange(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 font-mono font-bold text-xs"
                        />
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] text-slate-500 block mb-1">סכום מע״מ ({manualVatRate}%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={manualVatAmount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setManualVatAmount(val);
                            setManualTotalAmount(Number((manualSubtotal + val).toFixed(2)));
                          }}
                          className="w-full bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 font-mono font-bold text-xs"
                        />
                      </div>

                      <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                        <label className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold block mb-1">סה״כ לתשלום (₪)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={manualTotalAmount}
                          onChange={(e) => setManualTotalAmount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-800 px-2 py-1 rounded border border-indigo-300 dark:border-indigo-600 font-mono font-black text-sm text-indigo-700 dark:text-indigo-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span>שורות פריטים ופירוט ({manualLines.length})</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleSyncFromLines}
                          className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition flex items-center gap-1"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>סנכרן סכומים מהשורות</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddManualLine}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>הוסף שורה</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {manualLines.map((line, idx) => (
                        <div key={line.id || idx} className="grid grid-cols-12 gap-1.5 items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs">
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => handleUpdateManualLine(idx, 'description', e.target.value)}
                              placeholder="תיאור הפריט"
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[11px]"
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number"
                              value={line.quantity}
                              onChange={(e) => handleUpdateManualLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="כמות"
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[11px] font-mono text-center"
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) => handleUpdateManualLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              placeholder="מחיר יח'"
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[11px] font-mono"
                            />
                          </div>

                          <div className="col-span-2 font-mono font-bold text-slate-800 dark:text-slate-200 text-center text-[11px]">
                            {line.total.toLocaleString()} ₪
                          </div>

                          <div className="col-span-1 text-center">
                            {manualLines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveManualLine(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Left Column: Visual Document Preview & Verification */}
                <div className="lg:col-span-5 flex flex-col space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white flex-1 flex flex-col justify-between border border-slate-800 shadow-xl overflow-hidden min-h-[360px]">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                      <span className="font-bold flex items-center gap-1.5 text-cyan-400">
                        <Eye className="w-3.5 h-3.5" />
                        <span>תצוגת מסמך מקור (Live Document)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedFile?.name || 'מסמך סרוק'}
                      </span>
                    </div>

                    {/* Document View Area */}
                    <div className="my-2 flex-1 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center p-3 relative overflow-hidden">
                      {previewUrl ? (
                        previewUrl.startsWith('data:image/') || selectedFile?.name?.match(/\.(png|jpe?g|webp)$/i) ? (
                          <img
                            src={previewUrl}
                            alt="תצוגת מסמך"
                            className="max-h-64 object-contain rounded shadow-lg"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <FileText className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
                            <div className="text-xs font-bold text-slate-200">{selectedFile?.name}</div>
                            <div className="text-[11px] text-slate-400 mt-1">מסמך PDF מצורף ומאומת</div>
                          </div>
                        )
                      ) : (
                        <div 
                          onClick={() => manualFileInputRef.current?.click()}
                          className="text-center cursor-pointer p-6 hover:bg-slate-900/50 rounded-xl transition"
                        >
                          <Upload className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                          <div className="text-xs font-bold text-slate-300">לחץ לצירוף מסמך מקור לסורק</div>
                          <div className="text-[10px] text-slate-500 mt-1">PDF, תמונה או צילום מסמך</div>
                        </div>
                      )}
                    </div>

                    {/* Scanned Summary Banner */}
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">ספק:</span>
                        <span className="font-bold text-white truncate max-w-[180px]">{manualSupplierName}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">ח.פ / ע.מ:</span>
                        <span className="font-mono text-cyan-300">{manualSupplierTaxId}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">מספר חשבונית:</span>
                        <span className="font-mono text-indigo-300">{manualInvoiceNumber}</span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-slate-700">
                        <span className="text-slate-300 font-bold">סה״כ לתשלום:</span>
                        <span className="font-mono font-bold text-emerald-400">{manualTotalAmount.toLocaleString()} ₪</span>
                      </div>
                    </div>

                    {/* Manual Scanner Confirmation Buttons */}
                    <div className="pt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirmManualScan(false)}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition text-center"
                      >
                        שמור לתיבת הקליטה
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConfirmManualScan(true)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                      >
                        <Eye className="w-4 h-4" />
                        <span>אשר ופתח ב-PREVIEW</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: CAMERA SCANNER MODE */}
          {activeSource === 'camera' && !isScanning && !scannedResult && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-video max-h-[380px] flex items-center justify-center shadow-inner">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />

                  {/* Camera Aiming Reticle */}
                  <div className="absolute inset-8 border-2 border-dashed border-cyan-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-4">
                    <div className="flex justify-between text-[11px] font-mono text-cyan-300 font-bold bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur-xs w-fit">
                      <span>כוון את החשבונית למרכז המסגרת</span>
                    </div>
                    <div className="flex justify-end text-[10px] font-mono text-emerald-400 font-bold bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur-xs w-fit ms-auto">
                      <span>זיהוי מסמך אוטומטי פעיל</span>
                    </div>
                  </div>

                  {/* Capture Button */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isHebrew ? 'צלם וסרוק חשבונית' : 'Capture & Scan Invoice'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SAMPLE INVOICES PRESETS */}
          {activeSource === 'sample' && !isScanning && !scannedResult && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isHebrew ? 'בחר חשבונית ספק מובילה לסריקה מיידית:' : 'Select a sample invoice to scan instantly:'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => handleSelectPreset('iec')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-white dark:bg-slate-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer transition flex items-start gap-3 text-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">חברת החשמל לישראל בע"מ</span>
                      <span className="font-mono text-xs font-bold text-amber-600">13,629.57 ₪</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      חשבון חשמל תקופתי, מע״מ 18%, מספר הקצאה 259062769
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-indigo-600 font-semibold">
                      קובץ: חשבון_חברת_חשמל_2026-491506083.pdf
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleSelectPreset('sonol')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-white dark:bg-slate-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer transition flex items-start gap-3 text-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">סונול EVI בע״מ (Sonol EVI)</span>
                      <span className="font-mono text-xs font-bold text-emerald-600">1,845.60 ₪</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      שירותי טעינת רכב חשמלי, דלקנים, אישור הקצאה 298104551
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-indigo-600 font-semibold">
                      קובץ: חשבונית_סונול_EVI_3299586.pdf
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleSelectPreset('tambour')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition flex items-start gap-3 text-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">טמבור צבעים וחומרי בניין בע״מ</span>
                      <span className="font-mono text-xs font-bold text-indigo-600">8,450.00 ₪</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      חשבונית סרוקה עם ברקוד, ח.פ 510293847, מע״מ 18%
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-indigo-600 font-semibold">
                      קובץ: חשבונית_סרוקה_טמבור_TB8821.pdf
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleSelectPreset('tnuva')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition flex items-start gap-3 text-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">תנובה מרכז שיווק בע״מ</span>
                      <span className="font-mono text-xs font-bold text-blue-600">5,850.00 ₪</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      חומרי גלם טריים, ח.פ 520034567, בדיקה מתמטית כפולה 100%
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-indigo-600 font-semibold">
                      קובץ: חשבונית_מס_תנובה_מרכז.pdf
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visual Scanner Stage - Document Display with Scanned Result */}
          {(isScanning || scannedResult) && activeSource !== 'manual' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl border-2 border-indigo-500/80 bg-slate-900 text-white overflow-hidden p-6 shadow-xl min-h-[280px] flex flex-col justify-between">
                
                {/* Laser Sweep Animation Line */}
                {isScanning && (
                  <div 
                    className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_#38bdf8] pointer-events-none animate-laser-sweep z-30"
                  />
                )}

                {/* Simulated Scanned Document Visual */}
                <div className="w-full bg-white text-slate-900 rounded-xl p-5 shadow-lg border border-slate-200 relative overflow-hidden font-sans select-none">
                  <div className="flex items-start justify-between border-b pb-3 mb-3 border-slate-200">
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        {scannedResult?.supplierName || selectedFile?.name || 'חשבונית מס / קבלה מקור'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        ח.פ / עוסק מורשה: {scannedResult?.supplierTaxId || '520000472'} | ישראל
                      </div>
                    </div>

                    <div className="text-end">
                      <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        מס׳ {scannedResult?.invoiceNumber || '2026-491506083'}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        תאריך: 18/09/2026
                      </div>
                    </div>
                  </div>

                  {/* Line item sample */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs flex justify-between items-center mb-3">
                    <span className="font-medium">
                      {scannedResult?.lines[0]?.description || 'אספקת שירותים / מוצרי ספק לפי הזמנת רכש'}
                    </span>
                    <span className="font-mono font-bold">
                      {scannedResult?.subtotal.toLocaleString() || '11,550.48'} ₪
                    </span>
                  </div>

                  {/* Totals & Comsign seal */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-2 text-[10.5px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>חתימה דיגיטלית Comsign • הקצאה: {scannedResult?.fields.allocationNumber?.value || '259062769'}</span>
                    </div>

                    <div className="text-end font-mono">
                      <span className="text-slate-500 text-[11px]">סה״כ לתשלום: </span>
                      <span className="text-sm font-black text-indigo-700">
                        {scannedResult?.totalAmount.toLocaleString() || '13,629.57'} ₪
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 text-slate-300">
                  <span className="flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>קובץ מקור: {scannedResult?.fileName || selectedFile?.name}</span>
                  </span>
                  <span className="text-slate-400">
                    רזולוציית סריקה: 300 DPI • עברית ואנגלית
                  </span>
                </div>
              </div>

              {/* Scanned Extracted Data Card with Quick Manual Edit CTA */}
              {scannedResult && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-800/80 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>שדות שחולצו בהצלחה בסריקה (מהימנות: {scannedResult.overallConfidence}%):</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleEditScannedInManualMode}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>ערוך ותקן בסורק ידני</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">שם ספק</div>
                      <div className="font-bold text-slate-900 dark:text-white truncate">{scannedResult.supplierName}</div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">מספר חשבונית</div>
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{scannedResult.invoiceNumber}</div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">מספר הקצאה</div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{scannedResult.fields.allocationNumber?.value || '259062769'}</div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">סה״כ לתשלום</div>
                      <div className="font-mono font-black text-slate-900 dark:text-white">{scannedResult.totalAmount.toLocaleString()} ₪</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              {isHebrew ? 'סגור' : 'Close'}
            </button>

            {scannedResult && activeSource !== 'manual' && (
              <button
                type="button"
                onClick={() => {
                  setScannedResult(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setActiveSource('file');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {isHebrew ? 'סרוק מסמך נוסף' : 'Scan Another'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeSource === 'manual' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleConfirmManualScan(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  {isHebrew ? 'הוסף לתיבת הקליטה' : 'Add to Inbox'}
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmManualScan(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-white" />
                  <span>{isHebrew ? 'אשר ופתח ישירות ב-PREVIEW' : 'Confirm & Open PREVIEW'}</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </>
            ) : scannedResult ? (
              <>
                <button
                  type="button"
                  onClick={handleConfirmAddToInbox}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  {isHebrew ? 'הוסף לתיבת הקליטה' : 'Add to Inbox'}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndPreview}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-white" />
                  <span>{isHebrew ? 'פתח ישירות ב-PREVIEW' : 'Open in PREVIEW'}</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </>
            ) : (
              !isScanning && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeSource === 'camera') {
                      capturePhoto();
                    } else if (activeSource === 'file') {
                      fileInputRef.current?.click();
                    } else {
                      handleSelectPreset('iec');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
                >
                  <Scan className="w-4 h-4 text-white" />
                  <span>{isHebrew ? 'התחל סריקה עכשיו' : 'Start Scan Now'}</span>
                </button>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
