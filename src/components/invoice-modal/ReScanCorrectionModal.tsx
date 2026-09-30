import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  RotateCcw, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Calculator, 
  ArrowLeft, 
  Layers, 
  FileSearch,
  Scan,
  Zap,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { InvoiceDocument, Language } from '../../types';
import { runDoubleValidation } from '../../services/validationEngine';

interface ReScanCorrectionModalProps {
  invoice: InvoiceDocument;
  language: Language;
  onClose: () => void;
  onApplyReScan: (updatedInvoice: InvoiceDocument) => void;
  onStartScanningSimulation?: (progressText: string) => void;
}

export const ReScanCorrectionModal: React.FC<ReScanCorrectionModalProps> = ({
  invoice,
  language,
  onClose,
  onApplyReScan,
  onStartScanningSimulation,
}) => {
  const [scanProfile, setScanProfile] = useState<'deep_vision' | 'deskew_filter' | 'vat_focus' | 'lines_focus'>('deep_vision');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(1);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [proposedInvoice, setProposedInvoice] = useState<InvoiceDocument | null>(null);

  // Quick preset tags to insert into custom prompt
  const presetTags = [
    'חלץ מע״מ 17% מדויק ובדוק סה״כ',
    'אתר מספר הזמנת רכש PO',
    'קרא את כל שורות הפריטים בטבלה',
    'חלץ מספר הקצאה ברשות המסים',
    'זהה ח.פ תקין של הספק'
  ];

  // Perform re-scan simulation
  const handleRunReScan = () => {
    setIsScanning(true);
    setScanStep(1);

    const steps = [
      'טוען מסמך מקור ברזולוציה מקסימלית (300 DPI)...',
      'מפעיל פילטר חידוד ניגודיות, יישור זווית (Deskew) וניקוי רעשים...',
      'סריקת Vision AI רב-מודאלית לזיהוי עברית, לועזית ומספרים...',
      'הצלבת תחשיב מע״מ ובדיקת שלמות חשבונאית...',
    ];

    if (onStartScanningSimulation) {
      onStartScanningSimulation(steps[0]);
    }

    // Step progression
    setTimeout(() => {
      setScanStep(2);
      if (onStartScanningSimulation) onStartScanningSimulation(steps[1]);
    }, 600);

    setTimeout(() => {
      setScanStep(3);
      if (onStartScanningSimulation) onStartScanningSimulation(steps[2]);
    }, 1300);

    setTimeout(() => {
      setScanStep(4);
      if (onStartScanningSimulation) onStartScanningSimulation(steps[3]);
    }, 1900);

    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);

      // Generate the enhanced / re-scanned invoice result with corrected values:
      const rate = 0.17;
      const subtotal = invoice.subtotal || 4646.15;
      const correctVat = Number((subtotal * rate).toFixed(2));
      const correctTotal = Number((subtotal + correctVat).toFixed(2));

      // Enhanced lines if lines focus or deep vision
      const enhancedLines = invoice.lines.map((l, idx) => ({
        ...l,
        confidence: 99,
        sku: l.sku || `TNV-${8000 + idx}`,
        vatPercent: 17,
      }));

      const newAudit = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: 'AI Re-Scan Engine (Vision 2.5)',
        action: 'סריקה חוזרת ופענוח ראיית מכונה הושלמו',
        details: `סריקה חוזרת בפרופיל "${
          scanProfile === 'deep_vision' ? 'סריקה עמוקה Multi-Modal Vision' :
          scanProfile === 'vat_focus' ? 'מיקוד מע״מ וחישובים' :
          scanProfile === 'lines_focus' ? 'מיקוד שורות פריטים' : 'חידוד ויישור מסמך'
        }". מהימנות עלתה ל-99.4%. נתונים אומתו מול מסמך המקור.`,
      };

      const rescanned: InvoiceDocument = {
        ...invoice,
        subtotal: subtotal,
        vatAmount: correctVat,
        totalAmount: correctTotal,
        overallConfidence: 99.4,
        lines: enhancedLines,
        status: 'ready_for_erp',
        auditTrail: [newAudit, ...invoice.auditTrail],
        correctionsCount: invoice.correctionsCount + 1,
      };

      // Re-run double validation
      rescanned.mathCheck = runDoubleValidation(rescanned);
      setProposedInvoice(rescanned);
    }, 2500);
  };

  // Apply re-scan
  const handleApply = () => {
    if (proposedInvoice) {
      onApplyReScan(proposedInvoice);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>מצב תיקון עם סריקה חוזרת (AI OCR Re-Scan)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Vision AI 2.5
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                פענוח מחדש של מסמך המקור תוך חידוד פיקסלים, בדיקת חישובים וקריאת נתונים מונחית AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {!hasScanned ? (
            /* STEP 1: CONFIGURATION & PROMPT SELECTION */
            <div className="space-y-5">
              
              {/* Profile Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  1. בחר פרופיל סריקה חוזרת:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  
                  {/* Option 1 */}
                  <div
                    onClick={() => setScanProfile('deep_vision')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      scanProfile === 'deep_vision'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        סריקה עמוקה Multi-Modal Vision
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        סריקה מקיפה של כל הפיקסלים, כותרות, פרטי לקוח/ספק, שורות פריטים וסכומים בדיוק מרבי.
                      </div>
                    </div>
                  </div>

                  {/* Option 2 */}
                  <div
                    onClick={() => setScanProfile('vat_focus')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      scanProfile === 'vat_focus'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        סריקת מיקוד מע״מ וחישובים מתמטיים
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        מתמקד בסכומי הביניים (HT), מע״מ 17% וסה״כ (TTC) לפתרון דגלים אדומים וסתירות.
                      </div>
                    </div>
                  </div>

                  {/* Option 3 */}
                  <div
                    onClick={() => setScanProfile('lines_focus')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      scanProfile === 'lines_focus'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        סריקת טבלת שורות פריטים ומק״טים
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        מפענח טבלאות מורכבות, פירוטי מוצרים, כמויות ומחירי יחידה לצורך התאמת 3-Way Match.
                      </div>
                    </div>
                  </div>

                  {/* Option 4 */}
                  <div
                    onClick={() => setScanProfile('deskew_filter')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      scanProfile === 'deskew_filter'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        חידוד ניגודיות ויישור זווית (Deskew)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        מנקה רעשים ממסמכים שנסרקו עקום, פקסים כהים או צילומים באיכות ירודה.
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Custom Guidance / Prompt */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. הנחיות מותאמות לסורק ה-AI (אופציונלי):
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="לדוגמה: ודא חישוב מע״מ 17% בדיוק, חלץ מספר תעודת משלוח ומספר הקצאה..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Quick preset chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400">תגיות מהירות:</span>
                  {presetTags.map((tag, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCustomPrompt(prev => prev ? `${prev}, ${tag}` : tag)}
                      className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-700 transition"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live progress indicator when active */}
              {isScanning && (
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <span className="flex items-center gap-2">
                      <Scan className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>מבצע סריקה חוזרת ופענוח AI...</span>
                    </span>
                    <span className="font-mono">שלב {scanStep} מתוך 4</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${(scanStep / 4) * 100}%` }}
                    ></div>
                  </div>

                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    {scanStep === 1 && 'טוען מסמך מקור ברזולוציה מקסימלית (300 DPI)...'}
                    {scanStep === 2 && 'מפעיל פילטר חידוד ניגודיות, יישור זווית (Deskew) וניקוי רעשים...'}
                    {scanStep === 3 && 'סריקת Vision AI רב-מודאלית לזיהוי עברית, לועזית ומספרים...'}
                    {scanStep === 4 && 'הצלבת תחשיב מע״מ ובדיקת שלמות חשבונאית...'}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* STEP 2: DIFF COMPARISON (BEFORE VS AFTER RE-SCAN) */
            proposedInvoice && (
              <div className="space-y-4">
                
                {/* Success Banner */}
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        סריקה חוזרת הושלמה בהצלחה! אותרו ערכים מתוקנים ומאומתים
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        רמת המהימנות שופרה מ-<strong>{invoice.overallConfidence}%</strong> ל-<strong>{proposedInvoice.overallConfidence}%</strong>. התקינות המתמטית אושרה.
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      מוכן לשידור ERP
                    </span>
                  </div>
                </div>

                {/* Diff Comparison Table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span>השוואת נתונים: מקור vs תוצאות סריקה חוזרת</span>
                    <span className="text-[10px] text-slate-400">שדות שעודכנו מסומנים בירוק</span>
                  </div>

                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3 text-start">שדה</th>
                        <th className="py-2 px-3 text-start">לפני סריקה חוזרת</th>
                        <th className="py-2 px-3 text-start">אחרי סריקה חוזרת (מתוקן)</th>
                        <th className="py-2 px-3 text-start">סטטוס בדיקה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      
                      {/* Subtotal */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">סכום לפני מע״מ</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{invoice.subtotal.toLocaleString()} ₪</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white bg-emerald-50/40 dark:bg-emerald-950/20">
                          {proposedInvoice.subtotal.toLocaleString()} ₪
                        </td>
                        <td className="py-2 px-3 text-emerald-600 font-bold text-[11px]">מאומת ✓</td>
                      </tr>

                      {/* VAT */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">מע״מ (17%)</td>
                        <td className="py-2 px-3 font-mono text-rose-600 font-medium line-through">
                          {invoice.vatAmount.toLocaleString()} ₪
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30">
                          {proposedInvoice.vatAmount.toLocaleString()} ₪
                        </td>
                        <td className="py-2 px-3 text-emerald-600 font-bold text-[11px]">תוקן לפי שיעור חוקי 17% ✓</td>
                      </tr>

                      {/* Total */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">סה״כ לתשלום</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{invoice.totalAmount.toLocaleString()} ₪</td>
                        <td className="py-2 px-3 font-mono font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20">
                          {proposedInvoice.totalAmount.toLocaleString()} ₪
                        </td>
                        <td className="py-2 px-3 text-emerald-600 font-bold text-[11px]">תואם 100% לחשבונאות ✓</td>
                      </tr>

                      {/* Confidence */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">מהימנות זיהוי AI</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{invoice.overallConfidence}%</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20">
                          {proposedInvoice.overallConfidence}%
                        </td>
                        <td className="py-2 px-3 text-emerald-600 font-bold text-[11px]">+{(proposedInvoice.overallConfidence - invoice.overallConfidence).toFixed(1)}% שיפור</td>
                      </tr>

                    </tbody>
                  </table>
                </div>

                {/* Math validation explanation */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    תחשיב מעודכן: סכום לפני מע״מ ({proposedInvoice.subtotal.toLocaleString()} ₪) + מע״מ ({proposedInvoice.vatAmount.toLocaleString()} ₪) = סה״כ לתשלום ({proposedInvoice.totalAmount.toLocaleString()} ₪).
                  </span>
                </div>

              </div>
            )
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            ביטול
          </button>

          {!hasScanned ? (
            <button
              type="button"
              disabled={isScanning}
              onClick={handleRunReScan}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isScanning ? 'סורק ומפענח...' : 'הפעל סריקה חוזרת עכשיו'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHasScanned(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                סרוק שוב עם פרופיל אחר
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>אשר ואמץ תוצאות סריקה חוזרת</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
