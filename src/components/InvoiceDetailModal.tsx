import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Send, 
  RotateCcw, 
  FileCheck, 
  Edit3, 
  Save, 
  Calculator,
  MessageSquare,
  Clock,
  ExternalLink,
  GitCompare,
  Layers,
  Sparkles,
  Phone,
  Plus,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Paperclip
} from 'lucide-react';
import { 
  InvoiceDocument, 
  Language, 
  BoundingBox, 
  DocumentAuditEntry,
  InvoiceLineItem
} from '../types';
import { translations } from '../i18n/translations';
import { runDoubleValidation } from '../services/validationEngine';
import { enterpriseConfigService } from '../services/enterpriseConfigService';
import { HighFidelityPdfViewer } from './invoice-modal/HighFidelityPdfViewer';
import { OriginalSupplierPdfViewer } from './invoice-modal/OriginalSupplierPdfViewer';
import { ReScanCorrectionModal } from './invoice-modal/ReScanCorrectionModal';

interface InvoiceDetailModalProps {
  invoice: InvoiceDocument;
  language: Language;
  onClose: () => void;
  onUpdateInvoice: (updated: InvoiceDocument) => void;
  onPostToPriority: (invoice: InvoiceDocument) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  language,
  onClose,
  onUpdateInvoice,
  onPostToPriority,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'extraction' | 'matching' | 'audit'>('extraction');
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [editableInvoice, setEditableInvoice] = useState<InvoiceDocument>({ ...invoice });
  const [isEditing, setIsEditing] = useState(false);
  const [isManualEditMode, setIsManualEditMode] = useState(false);
  const [selectedVatRate, setSelectedVatRate] = useState<number>(17);
  const [commentText, setCommentText] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Re-scan simulation & modal state
  const [showReScanModal, setShowReScanModal] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('');

  // Re-run validation on editable copy
  const mathValidation = runDoubleValidation(editableInvoice);

  // Handle field change and track in audit trail (Section 16: Correction Intelligente)
  const handleFieldChange = (field: string, newValue: any) => {
    const oldValue = (editableInvoice as any)[field];
    if (oldValue === newValue) return;

    const newAuditEntry: DocumentAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'Michal Ben-Ari (Finance)',
      action: 'Field manually corrected',
      details: `Correction: "${field}" changé de "${oldValue}" à "${newValue}" (Règle d'apprentissage mémorisée)`,
      fieldChanged: field,
      oldValue: String(oldValue),
      newValue: String(newValue),
    };

    const updated = {
      ...editableInvoice,
      [field]: newValue,
      correctionsCount: editableInvoice.correctionsCount + 1,
      auditTrail: [newAuditEntry, ...editableInvoice.auditTrail],
    };

    // Recompute math check
    updated.mathCheck = runDoubleValidation(updated);
    if (updated.mathCheck.passed && updated.duplicateRisk !== 'high') {
      updated.status = 'ready_for_erp';
    }

    setEditableInvoice(updated);
  };

  // Line Items editing handlers
  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newLines = [...editableInvoice.lines];
    const currentLine = { ...newLines[index], [field]: value };

    // Auto-calculate line total if quantity or unitPrice change
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) || 0 : currentLine.quantity;
      const p = field === 'unitPrice' ? Number(value) || 0 : currentLine.unitPrice;
      currentLine.total = Number((q * p).toFixed(2));
    }

    newLines[index] = currentLine;

    const updated = {
      ...editableInvoice,
      lines: newLines,
    };
    setEditableInvoice(updated);
  };

  const handleAddLineItem = () => {
    const newLine: InvoiceLineItem = {
      id: `line-${Date.now()}`,
      description: 'פריט שירות / מוצר חדש',
      quantity: 1,
      unitPrice: 100,
      total: 100,
      confidence: 100,
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      vatPercent: selectedVatRate,
    };

    const updated = {
      ...editableInvoice,
      lines: [...editableInvoice.lines, newLine],
      correctionsCount: editableInvoice.correctionsCount + 1,
    };
    setEditableInvoice(updated);
    setNotification('שורת פריט חדשה נוספה לחשבונית');
    setTimeout(() => setNotification(null), 2500);
  };

  const handleRemoveLineItem = (index: number) => {
    if (editableInvoice.lines.length <= 1) {
      setNotification('לא ניתן למחוק את כל השורות, נדרשת לפחות שורת פריט אחת');
      setTimeout(() => setNotification(null), 2500);
      return;
    }

    const newLines = editableInvoice.lines.filter((_, i) => i !== index);
    const updated = {
      ...editableInvoice,
      lines: newLines,
      correctionsCount: editableInvoice.correctionsCount + 1,
    };
    setEditableInvoice(updated);
    setNotification('שורת הפריט הוסרה');
    setTimeout(() => setNotification(null), 2500);
  };

  // Sync subtotal from sum of line items
  const handleRecalculateFromLines = () => {
    const linesSum = editableInvoice.lines.reduce((sum, item) => sum + item.total, 0);
    const roundedSum = Number(linesSum.toFixed(2));
    const rateMultiplier = selectedVatRate / 100;
    const vat = Number((roundedSum * rateMultiplier).toFixed(2));
    const total = Number((roundedSum + vat).toFixed(2));

    const updated = {
      ...editableInvoice,
      subtotal: roundedSum,
      vatAmount: vat,
      totalAmount: total,
      correctionsCount: editableInvoice.correctionsCount + 1,
    };
    updated.mathCheck = runDoubleValidation(updated);
    if (updated.mathCheck.passed) updated.status = 'ready_for_erp';

    setEditableInvoice(updated);
    setNotification(`סכומים עודכנו מסך שורות הפריטים: ${roundedSum} ₪ לפני מע״מ, סה״כ לתשלום ${total} ₪`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Calculate VAT & Total with selected rate
  const handleCalculateVatAndTotal = (rate: number = selectedVatRate) => {
    setSelectedVatRate(rate);
    const rateMultiplier = rate / 100;
    const correctVat = Number((editableInvoice.subtotal * rateMultiplier).toFixed(2));
    const correctTotal = Number((editableInvoice.subtotal + correctVat).toFixed(2));

    const updated = {
      ...editableInvoice,
      vatAmount: correctVat,
      totalAmount: correctTotal,
      correctionsCount: editableInvoice.correctionsCount + 1,
    };
    updated.mathCheck = runDoubleValidation(updated);
    if (updated.mathCheck.passed && updated.duplicateRisk !== 'high') {
      updated.status = 'ready_for_erp';
    }

    setEditableInvoice(updated);
    setNotification(`חישוב בוצע: מע״מ ${rate}% בסך ${correctVat} ₪, סה״כ לתשלום ${correctTotal} ₪`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Reset to initial original invoice
  const handleResetToOriginal = () => {
    setEditableInvoice({ ...invoice });
    setNotification('הנתונים שוחזרו לערכי הסריקה המקוריים');
    setTimeout(() => setNotification(null), 2500);
  };

  // Save changes
  const handleSave = () => {
    onUpdateInvoice(editableInvoice);
    setIsEditing(false);
    setIsManualEditMode(false);
    setNotification('תיקונים ידניים נשמרו בהצלחה והוזנו במערכת.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Apply re-scan result from ReScanCorrectionModal
  const handleApplyReScan = (rescanned: InvoiceDocument) => {
    setEditableInvoice(rescanned);
    onUpdateInvoice(rescanned);
    setNotification('סריקה חוזרת הוחלה בהצלחה! השדות והחישובים אומתו.');
    setTimeout(() => setNotification(null), 3500);
  };

  // Quick fix for VAT math error using dynamic enterprise tax rate
  const handleAutoFixVat = () => {
    const defaultTaxRate = enterpriseConfigService.getDefaultTaxRateForCountry('ישראל');
    handleCalculateVatAndTotal(defaultTaxRate.ratePercent);
  };

  // Add Comment
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: `comm-${Date.now()}`,
      user: 'Michal Ben-Ari',
      text: commentText.trim(),
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = {
      ...editableInvoice,
      comments: [...editableInvoice.comments, newComment],
    };
    setEditableInvoice(updated);
    onUpdateInvoice(updated);
    setCommentText('');
  };

  // Approve invoice
  const handleApprove = () => {
    const updated: InvoiceDocument = {
      ...editableInvoice,
      status: 'approved',
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          user: 'Michal Ben-Ari (Approver)',
          action: 'Invoice approved',
          details: 'Facture validée pour mise en paiement et synchronisation Priority ERP',
        },
        ...editableInvoice.auditTrail,
      ],
    };
    setEditableInvoice(updated);
    onUpdateInvoice(updated);
    setNotification('Facture approuvée avec succès.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Attach real original invoice file
  const handleAttachOriginalFile = (file: File, dataUrl: string) => {
    const newAuditEntry: DocumentAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'מחלקת כספים (אמבט ליין בע״מ)',
      action: 'צירוף חשבונית מקור',
      details: `קובץ מקור מקורי "${file.name}" (${(file.size / 1024).toFixed(1)} KB) צורף ונשמר במערכת`,
    };

    const updated: InvoiceDocument = {
      ...editableInvoice,
      fileName: file.name,
      fileUrl: dataUrl,
      fileType: file.type.includes('png') ? 'png' : (file.type.includes('jpg') || file.type.includes('jpeg') ? 'jpg' : 'pdf'),
      correctionsCount: editableInvoice.correctionsCount + 1,
      auditTrail: [newAuditEntry, ...editableInvoice.auditTrail],
    };

    setEditableInvoice(updated);
    onUpdateInvoice(updated);
    setNotification(`חשבונית מקור "${file.name}" צורפה ונשמרה בהצלחה!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Reject invoice
  const handleReject = () => {
    const updated: InvoiceDocument = {
      ...editableInvoice,
      status: 'rejected',
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          user: 'Michal Ben-Ari (Approver)',
          action: 'Invoice rejected',
          details: 'Facture rejetée. Notification envoyée au service achats/fournisseur.',
        },
        ...editableInvoice.auditTrail,
      ],
    };
    setEditableInvoice(updated);
    onUpdateInvoice(updated);
    setNotification('Facture rejetée.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div 
      id="invoice-split-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-hidden"
    >
      <div className="w-full max-w-7xl h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {editableInvoice.supplierName}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              N° {editableInvoice.invoiceNumber}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
              editableInvoice.status === 'posted_to_erp' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
              editableInvoice.status === 'ready_for_erp' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
              editableInvoice.status === 'needs_attention' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {t.status[editableInvoice.status]}
            </span>
          </div>

          {/* Action Modes Requested by User: Manual Correction & Re-Scan */}
          <div className="flex items-center gap-2">
            
            {/* BUTTON 1: Manual Correction Mode */}
            <button
              onClick={() => {
                const nextState = !isManualEditMode;
                setIsManualEditMode(nextState);
                setIsEditing(nextState);
                if (nextState) setActiveTab('extraction');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                isManualEditMode 
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/50' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="מצב תיקון ידני: שדות חשבונית, שורות פריטים וסכומי מע״מ"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isManualEditMode ? 'מצב תיקון ידני פעיל' : 'מצב תיקון ידני'}</span>
              {isManualEditMode && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              )}
            </button>

            {/* BUTTON 2: Re-Scan Mode */}
            <button
              onClick={() => setShowReScanModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition shadow-xs"
              title="סריקה חוזרת ופענוח AI מחודש של מסמך המקור"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>תיקון עם סריקה חוזרת</span>
            </button>

          </div>

          <div className="flex items-center gap-3">
            {notification && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                {notification}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Panel Split Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT PANEL: High-Fidelity PDF Viewer rendering original invoice files directly from URLs */}
          <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-e border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 p-2 sm:p-3 overflow-hidden flex flex-col">
            <HighFidelityPdfViewer
              invoice={editableInvoice}
              language={language}
              highlightedField={highlightedField}
              onSelectField={(field) => {
                setHighlightedField(field);
                setIsManualEditMode(true);
                setIsEditing(true);
                setActiveTab('extraction');
              }}
              isScanning={isScanningActive}
              scanProgressText={scanProgressText}
              isManualEditMode={isManualEditMode}
              onAttachOriginalFile={handleAttachOriginalFile}
            />
          </div>

          {/* RIGHT PANEL: Extracted Data & Double Validation Engine */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-white dark:bg-slate-900 overflow-y-auto">
            
            <div className="p-6 space-y-5">
              
              {/* Tab Selector */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('extraction')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'extraction'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.viewer.tabExtraction}
                </button>

                <button
                  onClick={() => setActiveTab('matching')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'matching'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  {t.viewer.tabMatching}
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'audit'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {t.viewer.tabAudit}
                </button>
              </div>

              {/* TAB 1: EXTRACTION & DUAL VALIDATION */}
              {activeTab === 'extraction' && (
                <div className="space-y-4">
                  
                  {/* LEVEL 2 DUAL VALIDATION STATUS CARD */}
                  <div className={`p-4 rounded-xl border ${
                    mathValidation.passed
                      ? 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800/60'
                      : 'border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-800/60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className={`w-4 h-4 ${mathValidation.passed ? 'text-emerald-600' : 'text-rose-600'}`} />
                        <span className={`text-xs font-bold ${mathValidation.passed ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'}`}>
                          {t.viewer.mathEngineTitle}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mathValidation.passed
                          ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                      }`}>
                        {mathValidation.passed ? 'Cohérence Validée' : 'RED FLAG : Anomalie'}
                      </span>
                    </div>

                    {/* Discrepancies if any */}
                    {!mathValidation.passed ? (
                      <div className="mt-2 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                        {mathValidation.discrepancies.map((disc, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 font-medium">
                            <span>⚠️</span>
                            <span>{disc}</span>
                          </div>
                        ))}
                        <button
                          onClick={handleAutoFixVat}
                          className="mt-2 text-xs font-semibold px-2.5 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition"
                        >
                          Appliquer la correction mathématique automatique
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                        Sous-total ({editableInvoice.subtotal}) + TVA ({editableInvoice.vatAmount}) = Total ({editableInvoice.totalAmount}) vérifiés avec succès.
                      </div>
                    )}
                  </div>

                  {/* DUPLICATE CHECK WARNING IF HIGH */}
                  {editableInvoice.duplicateRisk !== 'none' && (
                    <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-xs">
                      <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        Alerte Moteur Anti-Doublon : {t.duplicates[editableInvoice.duplicateRisk]}
                      </div>
                      <div className="mt-1 text-rose-700 dark:text-rose-300">
                        {editableInvoice.duplicateCheck.reasons.join(', ')}
                      </div>
                    </div>
                  )}

                  {/* EXTRACTED FIELDS FORM & MANUAL CORRECTION TOOLBAR */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        {language === 'he' ? 'שדות שחולצו על ידי Vision AI' : 'Données Extraites par Vision IA'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const next = !isManualEditMode;
                            setIsManualEditMode(next);
                            setIsEditing(next);
                          }}
                          className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-semibold transition ${
                            isManualEditMode || isEditing
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
                              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{isManualEditMode || isEditing ? (language === 'he' ? 'מצב עריכה ידנית פעיל' : 'Mode Édition Manuel') : (language === 'he' ? 'עריכה ותיקון ידני' : 'Corriger les champs')}</span>
                        </button>
                      </div>
                    </div>

                    {/* DEDICATED MANUAL CORRECTION WORKSPACE BANNER */}
                    {(isManualEditMode || isEditing) && (
                      <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-gradient-to-r from-amber-50 to-orange-50/40 dark:from-amber-950/40 dark:to-slate-900 space-y-2.5 text-xs shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                            {language === 'he' ? 'לוח בקרה לתיקון ידני מהיר' : 'Barre d\'outils de correction manuelle'}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold">
                            {editableInvoice.correctionsCount} תיקונים
                          </span>
                        </div>

                        {/* Quick VAT Rates and Calculation */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            חישוב מע״מ מהיר:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCalculateVatAndTotal(17)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border ${
                              selectedVatRate === 17 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            17% (ישראל תקני)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCalculateVatAndTotal(18)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border ${
                              selectedVatRate === 18 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            18% (שיעור מעודכן)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCalculateVatAndTotal(0)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border ${
                              selectedVatRate === 0 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            0% (מע״מ אפס)
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleResetToOriginal}
                            className="ms-auto flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                            title="שחזר את שדות החשבונית לסריקה הראשונית"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-400" />
                            <span>שחזר למקור</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Supplier */}
                      <div 
                        className={`p-2.5 rounded-lg border transition ${
                          highlightedField === 'supplierName' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => setHighlightedField('supplierName')}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{t.viewer.supplierName}</span>
                          <span className="text-emerald-600 font-bold">99%</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableInvoice.supplierName}
                            onChange={(e) => handleFieldChange('supplierName', e.target.value)}
                            className="w-full mt-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                          />
                        ) : (
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                            {editableInvoice.supplierName}
                          </div>
                        )}
                      </div>

                      {/* Tax ID */}
                      <div 
                        className={`p-2.5 rounded-lg border transition ${
                          highlightedField === 'supplierTaxId' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => setHighlightedField('supplierTaxId')}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{t.viewer.registrationNo}</span>
                          <span className="text-emerald-600 font-bold">99%</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableInvoice.supplierTaxId}
                            onChange={(e) => handleFieldChange('supplierTaxId', e.target.value)}
                            placeholder="ח.פ / עוסק מורשה"
                            className="w-full mt-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                        ) : (
                          <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                            {editableInvoice.supplierTaxId}
                          </div>
                        )}
                      </div>

                      {/* Invoice No */}
                      <div 
                        className={`p-2.5 rounded-lg border transition ${
                          highlightedField === 'invoiceNumber' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => setHighlightedField('invoiceNumber')}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{t.viewer.invoiceNumber}</span>
                          <span className="text-emerald-600 font-bold">99%</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableInvoice.invoiceNumber}
                            onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                            className="w-full mt-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                        ) : (
                          <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                            {editableInvoice.invoiceNumber}
                          </div>
                        )}
                      </div>

                      {/* Issue Date */}
                      <div 
                        className={`p-2.5 rounded-lg border transition ${
                          highlightedField === 'issueDate' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => setHighlightedField('issueDate')}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{t.viewer.issueDate}</span>
                          <span className="text-emerald-600 font-bold">97%</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editableInvoice.issueDate}
                            onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                            className="w-full mt-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                          />
                        ) : (
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                            {editableInvoice.issueDate}
                          </div>
                        )}
                      </div>

                      {/* Allocation Number */}
                      <div 
                        className={`p-2.5 rounded-lg border transition ${
                          highlightedField === 'allocationNumber' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => setHighlightedField('allocationNumber')}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>מספר הקצאה ברשות המסים</span>
                          <span className="text-emerald-600 font-bold">99%</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableInvoice.fields?.allocationNumber?.value || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = {
                                ...editableInvoice,
                                fields: {
                                  ...editableInvoice.fields,
                                  allocationNumber: {
                                    field: 'allocationNumber',
                                    label: 'מספר הקצאה ברשות המסים',
                                    value: val,
                                    confidence: 99,
                                    status: 'valid' as const
                                  }
                                }
                              };
                              setEditableInvoice(updated);
                              onUpdateInvoice(updated);
                            }}
                            placeholder="לדוגמה: 259062769"
                            className="w-full mt-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold"
                          />
                        ) : (
                          <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {editableInvoice.fields?.allocationNumber?.value || '259062769'}
                          </div>
                        )}
                      </div>

                      {/* Subtotal */}
                      <div 
                        className={`p-2.5 rounded-lg border transition ${
                          highlightedField === 'subtotal' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => setHighlightedField('subtotal')}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{t.viewer.subtotal}</span>
                          <span className="text-emerald-600 font-bold">98%</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editableInvoice.subtotal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleFieldChange('subtotal', val);
                            }}
                            className="w-full mt-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                        ) : (
                          <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                            {editableInvoice.subtotal.toLocaleString()} {editableInvoice.currency}
                          </div>
                        )}
                      </div>

                      {/* VAT Amount with Rate Buttons */}
                      <div 
                        className={`p-2.5 rounded-lg border transition ${
                          highlightedField === 'vatAmount' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => setHighlightedField('vatAmount')}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{t.viewer.vat}</span>
                          {(() => {
                            const sub = editableInvoice.subtotal;
                            const vat = editableInvoice.vatAmount;
                            const tot = editableInvoice.totalAmount;
                            const isTotalMatch = Math.abs(sub + vat - tot) <= 0.05;
                            const effRate = sub > 0 ? (vat / sub) * 100 : 0;
                            const isRecognizedRate = Math.abs(effRate - 18) <= 0.6 || Math.abs(effRate - 17) <= 0.6 || Math.abs(effRate - 0) <= 0.6;
                            if (isTotalMatch && isRecognizedRate) {
                              return <span className="text-emerald-600 font-bold">99%</span>;
                            }
                            if (!isTotalMatch) {
                              return <span className="text-rose-600 font-bold">אי-התאמה בסה״כ</span>;
                            }
                            return <span className="text-amber-600 font-bold">{effRate.toFixed(1)}%</span>;
                          })()}
                        </div>
                        {isEditing ? (
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={editableInvoice.vatAmount}
                              onChange={(e) => handleFieldChange('vatAmount', parseFloat(e.target.value) || 0)}
                              className="w-full mt-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                            />
                            {/* Quick VAT auto-calc pills */}
                            <div className="flex items-center gap-1 mt-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newVat = Number((editableInvoice.subtotal * 0.18).toFixed(2));
                                  const newTot = Number((editableInvoice.subtotal + newVat).toFixed(2));
                                  handleFieldChange('vatAmount', newVat);
                                  handleFieldChange('totalAmount', newTot);
                                }}
                                className="px-1.5 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] font-bold"
                              >
                                חשב 18%
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newVat = Number((editableInvoice.subtotal * 0.17).toFixed(2));
                                  const newTot = Number((editableInvoice.subtotal + newVat).toFixed(2));
                                  handleFieldChange('vatAmount', newVat);
                                  handleFieldChange('totalAmount', newTot);
                                }}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold"
                              >
                                חשב 17%
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFieldChange('vatAmount', 0);
                                  handleFieldChange('totalAmount', editableInvoice.subtotal);
                                }}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px]"
                              >
                                0%
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                            {editableInvoice.vatAmount.toLocaleString()} {editableInvoice.currency}
                          </div>
                        )}
                      </div>

                      {/* Total Amount */}
                      <div 
                        className={`col-span-2 p-3 rounded-lg border transition ${
                          highlightedField === 'totalAmount' ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => setHighlightedField('totalAmount')}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{t.viewer.totalAmount}</span>
                          <span className="text-emerald-600 font-bold">99%</span>
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="number"
                              step="0.01"
                              value={editableInvoice.totalAmount}
                              onChange={(e) => handleFieldChange('totalAmount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono font-bold"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const expectedTotal = Number((editableInvoice.subtotal + editableInvoice.vatAmount).toFixed(2));
                                handleFieldChange('totalAmount', expectedTotal);
                              }}
                              className="shrink-0 px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold"
                              title="סנכרן סה״כ לסכום לפני מע״מ + מע״מ"
                            >
                              אזן לסכום + מע״מ
                            </button>
                          </div>
                        ) : (
                          <div className="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {editableInvoice.totalAmount.toLocaleString()} {editableInvoice.currency}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* INTERACTIVE LINE ITEMS TABLE (MANUAL CORRECTION & INSPECTION) */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {language === 'he' ? 'שורות פריט בחשבונית' : 'Lignes de Facture (Items)'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                            {editableInvoice.lines.length} {language === 'he' ? 'פריטים' : 'lignes'}
                          </span>
                        </div>

                        {(isManualEditMode || isEditing) && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleRecalculateFromLines}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 transition"
                              title="חשב אוטומטית סכום לפני מע״מ וסה״כ לתשלום לפי סכום שורות הפריטים"
                            >
                              <Calculator className="w-3 h-3" />
                              <span>סנכרן סכומים מהשורות</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleAddLineItem}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition"
                            >
                              <Plus className="w-3 h-3" />
                              <span>הוסף שורה</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Items Listing / Editable Rows */}
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {editableInvoice.lines.map((line, idx) => (
                          <div 
                            key={line.id || idx}
                            className={`p-2.5 rounded-xl border transition text-xs ${
                              isManualEditMode || isEditing
                                ? 'bg-amber-50/20 border-amber-200/80 dark:bg-slate-800/60 dark:border-amber-900/40'
                                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {(isManualEditMode || isEditing) ? (
                              /* Editable Item Row */
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">
                                    #{idx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={line.description}
                                    onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                                    placeholder="תיאור הפריט / שירות..."
                                    className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLineItem(idx)}
                                    className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                                    title="מחק שורה זו"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">כמות (Qty)</label>
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="any"
                                      value={line.quantity}
                                      onChange={(e) => handleLineItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">מחיר יח׳ (Price)</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={line.unitPrice}
                                      onChange={(e) => handleLineItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">סה״כ שורה</label>
                                    <div className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 text-end">
                                      {line.total.toLocaleString()} {editableInvoice.currency}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Read-only Item Display */
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                                    {line.description}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                    <span>כמות: {line.quantity}</span>
                                    <span>•</span>
                                    <span>מחיר יח׳: {line.unitPrice.toLocaleString()} {editableInvoice.currency}</span>
                                    {line.sku && (
                                      <>
                                        <span>•</span>
                                        <span>מק״ט: {line.sku}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="font-mono font-bold text-slate-900 dark:text-white text-xs shrink-0">
                                  {line.total.toLocaleString()} {editableInvoice.currency}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Items Sum summary bar */}
                      <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300">
                        <span>סך שורות פריט מצטבר:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {editableInvoice.lines.reduce((s, i) => s + i.total, 0).toLocaleString()} {editableInvoice.currency}
                        </span>
                      </div>
                    </div>

                    {/* DYNAMIC CUSTOM FIELDS (From Enterprise Control Center) */}
                    {enterpriseConfigService.getState().customFields.filter(f => f.appliesTo === 'invoice' && f.isActive).length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                          <span>שדות מותאמים (Custom Fields)</span>
                          <span className="text-[10px] text-indigo-600 font-mono">Control Center</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {enterpriseConfigService.getState().customFields
                            .filter(f => f.appliesTo === 'invoice' && f.isActive)
                            .map(field => (
                              <div key={field.id} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="text-[10px] text-slate-400 font-medium">{field.name}</div>
                                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                                  {String(field.defaultValue || 'מוגדר לפי נוהל')}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* WORKFLOW APPROVAL EVALUATION */}
                    {(() => {
                      const wfCheck = enterpriseConfigService.evaluateApprovalRequirements(editableInvoice);
                      return (
                        <div className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs space-y-2">
                          <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                            <span>נוהל אישור ארגוני (Workflow Engine)</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900 font-mono font-semibold">
                              דרג: {wfCheck.requiredRole}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400">
                            {wfCheck.reason}
                          </div>

                          {/* Eligible Active Approvers */}
                          {wfCheck.eligibleApprovers && wfCheck.eligibleApprovers.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                גורמים מאשרים מורשים ופעילים:
                              </div>
                              <div className="space-y-1">
                                {wfCheck.eligibleApprovers.map(approver => (
                                  <div
                                    key={approver.id}
                                    className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                                        {approver.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 shrink-0">
                                        ({approver.role})
                                      </span>
                                    </div>
                                    <a
                                      href={`tel:${approver.phone}`}
                                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded shrink-0"
                                      title="חיוג מהיר לגורם המאשר"
                                    >
                                      <Phone className="w-3 h-3" />
                                      <span>{approver.phone}</span>
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {isEditing && (
                      <button
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{t.viewer.saveCorrection}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: THREE-WAY MATCHING */}
              {activeTab === 'matching' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {t.matching.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        editableInvoice.threeWayMatch.status === 'matched_100'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                      }`}>
                        {editableInvoice.threeWayMatch.status === 'matched_100' ? t.matching.statusMatch : t.matching.statusVariance}
                      </span>
                    </div>

                    {/* 3 Columns Comparison */}
                    <div className="grid grid-cols-3 gap-2 pt-2 text-[11px]">
                      <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="font-semibold text-slate-500">{t.matching.invoiceTitle}</div>
                        <div className="font-mono font-bold text-xs mt-1 text-slate-900 dark:text-white">
                          Qté : {editableInvoice.threeWayMatch.quantityInvoiced || 0}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Total : {editableInvoice.totalAmount.toLocaleString()} {editableInvoice.currency}
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="font-semibold text-slate-500">{t.matching.poTitle}</div>
                        <div className="font-mono font-bold text-xs mt-1 text-slate-900 dark:text-white">
                          Qté : {editableInvoice.threeWayMatch.quantityOrdered || 0}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {editableInvoice.purchaseOrderNumber || 'N/A'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="font-semibold text-slate-500">{t.matching.receiptTitle}</div>
                        <div className={`font-mono font-bold text-xs mt-1 ${
                          (editableInvoice.threeWayMatch.quantityReceived || 0) < (editableInvoice.threeWayMatch.quantityInvoiced || 0)
                            ? 'text-rose-600'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          Qté : {editableInvoice.threeWayMatch.quantityReceived || 0}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {editableInvoice.receiptNumber || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Discrepancies details */}
                    {editableInvoice.threeWayMatch.discrepancies.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          {t.matching.varianceExplanation}
                        </div>
                        {editableInvoice.threeWayMatch.discrepancies.map((d, i) => (
                          <div key={i}>• {d}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Piste d'Audit Inaltérable (Section 26)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {editableInvoice.auditTrail.length} événements enregistrés
                    </span>
                  </div>

                  <div className="space-y-2 border-s-2 border-indigo-200 dark:border-indigo-900 ms-2 ps-3 max-h-72 overflow-y-auto">
                    {editableInvoice.auditTrail.map((entry) => (
                      <div key={entry.id} className="relative pb-2">
                        <div className="absolute -start-[19px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900"></div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {entry.timestamp} • <span className="font-semibold text-slate-700 dark:text-slate-300">{entry.user}</span>
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                          {entry.action}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {entry.details}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comments section */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" />
                      Commentaires Internes
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Ajouter une note ou une instruction..."
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                      <button
                        onClick={handleAddComment}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                      >
                        Publier
                      </button>
                    </div>
                    {editableInvoice.comments.map(c => (
                      <div key={c.id} className="mt-2 p-2 rounded bg-slate-50 dark:bg-slate-800 text-[11px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{c.user}</span>
                        <span className="text-[10px] text-slate-400 ms-2 font-mono">{c.timestamp}</span>
                        <div className="text-slate-600 dark:text-slate-300 mt-0.5">{c.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReject}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-medium transition"
                >
                  {t.viewer.btnReject}
                </button>
                <button
                  onClick={handleApprove}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  {t.viewer.btnApprove}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPostToPriority(editableInvoice)}
                  disabled={!mathValidation.passed || editableInvoice.duplicateRisk === 'high'}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition ${
                    mathValidation.passed && editableInvoice.duplicateRisk !== 'high'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.viewer.btnSendToErp}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* RE-SCAN & VISION AI RE-PROCESSING MODAL */}
      {showReScanModal && (
        <ReScanCorrectionModal
          invoice={editableInvoice}
          language={language}
          onClose={() => setShowReScanModal(false)}
          onApplyReScan={(rescannedInvoice: InvoiceDocument) => {
            handleApplyReScan(rescannedInvoice);
            setShowReScanModal(false);
          }}
        />
      )}

    </div>
  );
};
