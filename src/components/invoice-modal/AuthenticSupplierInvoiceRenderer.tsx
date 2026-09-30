import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Lock,
  Building2,
  Calendar,
  Zap,
  Car
} from 'lucide-react';
import { InvoiceDocument } from '../../types';
import { PartnerInvoiceReplicaViewer } from './PartnerInvoiceReplicaViewer';
import { AmitiInvoiceReplicaViewer } from './AmitiInvoiceReplicaViewer';
import { SonolEviPaymentSummaryViewer } from './SonolEviPaymentSummaryViewer';

interface AuthenticSupplierInvoiceRendererProps {
  invoice: InvoiceDocument;
  onSelectField?: (fieldKey: string) => void;
  highlightedField?: string | null;
  interactive?: boolean;
}

export const AuthenticSupplierInvoiceRenderer: React.FC<AuthenticSupplierInvoiceRendererProps> = ({
  invoice,
  onSelectField,
  highlightedField,
  interactive = true,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Check if invoice belongs to Israel Electric Corporation (IEC / חברת החשמל)
  const isIEC = 
    invoice.supplierName.includes('חשמל') || 
    invoice.supplierTaxId === '520000472' || 
    invoice.invoiceNumber.includes('491506083');

  // Check if invoice belongs to Sonol EVI
  const isSonolEVI = 
    invoice.supplierName.includes('סונול') || 
    invoice.supplierName.toLowerCase().includes('sonol') || 
    invoice.supplierTaxId === '515747814' ||
    invoice.invoiceNumber === '3299586';

  // Check if invoice belongs to Partner 5G (פרטנר תקשורת בע"מ)
  const isPartner = 
    invoice.supplierName.includes('פרטנר') || 
    invoice.supplierName.toLowerCase().includes('partner') || 
    invoice.supplierTaxId === '557604147' || 
    invoice.supplierTaxId === '520044314' ||
    invoice.supplierTaxId === '512463730' ||
    invoice.invoiceNumber.includes('1074573052') ||
    invoice.invoiceNumber.includes('22242192');

  // Check if invoice belongs to ח.י אמיתי בע"מ
  const isAmiti = 
    invoice.supplierName.includes('אמיתי') || 
    invoice.supplierTaxId === '511080327' ||
    invoice.invoiceNumber.includes('002467');

  const triggerFieldClick = (fieldKey: string) => {
    if (interactive && onSelectField) {
      onSelectField(fieldKey);
    }
  };

  /* =========================================================================
     0. חברת פרטנר תקשורת בע"מ (PARTNER 5G)
     ========================================================================= */
  if (isPartner) {
    return (
      <PartnerInvoiceReplicaViewer
        invoice={invoice}
        highlightedField={highlightedField}
        onSelectField={onSelectField}
        interactive={interactive}
      />
    );
  }

  /* =========================================================================
     0.1 ח.י אמיתי בע"מ (AMITI REAL ESTATE / BESER TOWERS RENT)
     ========================================================================= */
  if (isAmiti) {
    return (
      <AmitiInvoiceReplicaViewer
        invoice={invoice}
        highlightedField={highlightedField}
        onSelectField={onSelectField}
        interactive={interactive}
      />
    );
  }

  /* =========================================================================
     1. חברת החשמל לישראל בע"מ (ISRAEL ELECTRIC CORPORATION)
     ========================================================================= */
  if (isIEC) {
    return (
      <div className="w-full text-slate-900 font-sans select-text relative" dir="rtl">
        {/* Multi-Page Navigation Header */}
        <div className="mb-4 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl px-4 py-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>מסמך מקור מרובה עמודים: חברת החשמל לישראל בע״מ (4 עמודים)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-600 dark:text-slate-300">
              עמוד {currentPage} מתוך 3
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
                title="עמוד קודם"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(3, p + 1))}
                disabled={currentPage === 3}
                className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
                title="עמוד הבא"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* PAGE 1: ריכוז חשבון, גרף צריכה, ושובר לתשלום */}
        {currentPage === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-sm border border-slate-300 shadow-xl space-y-5 text-[11px] leading-snug">
            {/* Top Bar with Logos and Comsign Seal */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              {/* Comsign Digital Signature Stamp */}
              <div className="border border-red-400 bg-red-50/70 p-2 rounded text-center max-w-[155px] text-[9.5px] text-red-900 leading-tight space-y-0.5">
                <div className="flex justify-center text-red-600 mb-0.5">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold">מסמך ממוחשב חתום דיגיטלית</div>
                <div className="text-[8.5px] text-red-800">מאושר על ידי גורם מאשר</div>
                <div className="font-bold tracking-wider text-red-700">comsign</div>
              </div>

              {/* Title & IEC Header */}
              <div className="text-center space-y-0.5">
                <div className="text-[10px] text-slate-600">חברת החשמל לישראל בע"מ</div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004b87] tracking-tight flex items-center justify-center gap-1.5">
                  <span>חשבון</span>
                  <span className="text-[#e26d00]">חד חודשי</span>
                </h1>
              </div>

              {/* IEC Orange Logo */}
              <div className="text-left space-y-1">
                <div className="flex items-center justify-end gap-1">
                  <div className="w-10 h-7 bg-[#e26d00] rounded-xs flex items-center justify-center text-white font-bold text-xs tracking-tighter">
                    NN
                  </div>
                </div>
                <div className="text-[9.5px] font-bold text-[#004b87] text-end">
                  חברת החשמל לישראל
                </div>
              </div>
            </div>

            {/* Recipient & Document Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Right Column: Customer Info */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-bold">לכבוד:</div>
                <div className="font-bold text-slate-900 text-sm">אמבט ליין בע"מ</div>
                <div className="text-slate-700">שחם 1 ד 166</div>
                <div className="text-slate-700">פתח תקווה 4951701</div>

                <div className="pt-2 text-[10.5px] text-slate-600">
                  <span className="font-semibold text-slate-800">להחזרה:</span> נתיב האור 1, חיפה
                </div>
                <div className="text-[10.5px] text-slate-600">
                  <span className="font-semibold text-slate-800">שם הלקוח וכתובת האספקה:</span>
                  <div>אמבט ליין בע"מ, עורף הנמל 3X198/138XG, אשדוד</div>
                </div>
              </div>

              {/* Left Column: Account & Legal Identifiers */}
              <div className="space-y-1 sm:text-start bg-slate-50/70 p-3 rounded border border-slate-200">
                <div 
                  className={`font-bold text-slate-900 text-xs cursor-pointer p-0.5 rounded transition ${
                    highlightedField === 'invoiceNumber' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
                  }`}
                  onClick={() => triggerFieldClick('invoiceNumber')}
                >
                  חשבונית מס/קבלה - מקור <span className="font-mono text-blue-900">2026-491506083</span>
                </div>
                <div className="text-emerald-700 font-mono font-bold text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>הקצאה מספר: 259062769</span>
                </div>
                <div className="text-[10.5px] text-slate-600">
                  מספר חברה: <span className="font-mono font-semibold">520000472</span>
                </div>
                <div className="text-[10.5px] text-slate-600">
                  מדווח באיחוד עוסקים מס': <span className="font-mono font-semibold">558418570</span>
                </div>
                <div className="text-[10.5px] text-slate-600">
                  עוסק מורשה: <span className="font-mono font-semibold">512101544</span>
                </div>
                <div className="text-[11px] text-slate-900 font-bold pt-1 border-t border-slate-200">
                  מספר חשבון חוזה: <span className="font-mono text-[#004b87] text-xs">342389945</span>
                </div>
                <div className="text-[10.5px] text-slate-600">
                  חשבון לתקופה - 33 ימים: <span className="font-mono">14/08/2026 עד 15/09/2026</span>
                </div>
                <div 
                  className={`text-[10.5px] text-slate-800 font-semibold cursor-pointer p-0.5 rounded ${
                    highlightedField === 'issueDate' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
                  }`}
                  onClick={() => triggerFieldClick('issueDate')}
                >
                  תאריך עריכת החשבון: <span className="font-mono font-bold">16/09/2026</span>
                </div>
              </div>
            </div>

            {/* Middle Section: Service Info & Account Summary Table */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-2">
              {/* Contact & Payment Instruction */}
              <div className="sm:col-span-5 space-y-2 text-[10.5px] text-slate-600">
                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <div className="font-bold text-slate-800 mb-0.5">לשירותך, 24 שעות ביממה:</div>
                  <div className="text-[#004b87] font-semibold">www.iec.co.il</div>
                  <div className="text-[9.5px] text-slate-500">בו ניתן לשלם, למסור מצב מונה ולקבל מידע.</div>
                </div>

                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <div className="font-bold text-slate-800">שירות 103</div>
                  <div className="text-[9.5px]">טלפון קווי וסלולרי - 103 (השיחה חינם)</div>
                </div>

                {/* Red Due/Direct Debit Box */}
                <div className="border border-red-300 bg-red-50 p-2.5 rounded text-red-900 space-y-1">
                  <div className="font-bold text-xs text-red-700">אין לשלם חשבון זה</div>
                  <div className="text-[10px] leading-tight">
                    חשבונך יישלח לחיוב ב- <strong>06/10/2026</strong> בכרטיס אשראי המסתיים בספרות <strong>3710</strong>.
                  </div>
                </div>

                {/* Barcode */}
                <div className="pt-1 text-center font-mono text-[9px] text-slate-500">
                  <div className="tracking-[3px] font-bold text-slate-800">||| | ||||| |||| | |||||| |||</div>
                  <div>534-100-000</div>
                </div>
              </div>

              {/* ריכוז החשבון (Summary Table) */}
              <div className="sm:col-span-7 border-2 border-slate-700 rounded-sm overflow-hidden">
                <div className="bg-slate-800 text-white font-bold px-3 py-1.5 text-center text-xs">
                  ריכוז החשבון
                </div>
                <div className="divide-y divide-slate-200 text-xs">
                  <div className="flex justify-between p-2 hover:bg-slate-50">
                    <span>חיוב בגין צריכה - סה"כ 18680 קוט"ש</span>
                    <span className="font-mono font-semibold">11,120.16 ₪</span>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-slate-50">
                    <span>תשלום בגין הספק (121.94 KVA)</span>
                    <span className="font-mono font-semibold">121.94 ₪</span>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-slate-50">
                    <span>תשלום קבוע</span>
                    <span className="font-mono font-semibold">277.29 ₪</span>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-slate-50">
                    <span>חיובים וזיכויים שונים</span>
                    <span className="font-mono font-semibold">31.09 ₪</span>
                  </div>
                  <div 
                    className={`flex justify-between p-2 bg-slate-50 font-semibold cursor-pointer ${
                      highlightedField === 'subtotal' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
                    }`}
                    onClick={() => triggerFieldClick('subtotal')}
                  >
                    <span>סה"כ ללא מע"מ:</span>
                    <span className="font-mono font-bold">11,550.48 ₪</span>
                  </div>
                  <div 
                    className={`flex justify-between p-2 bg-slate-50 text-slate-700 cursor-pointer ${
                      highlightedField === 'vatAmount' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
                    }`}
                    onClick={() => triggerFieldClick('vatAmount')}
                  >
                    <span>מע"מ % 18.00:</span>
                    <span className="font-mono font-bold">2,079.09 ₪</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-700">
                    <span>סה"כ כולל מע"מ לתקופת חשבון:</span>
                    <span className="font-mono font-bold text-sm">13,629.57 ₪</span>
                  </div>
                  <div 
                    className={`flex justify-between p-2.5 bg-amber-100/80 font-black text-slate-900 text-sm cursor-pointer ${
                      highlightedField === 'totalAmount' ? 'ring-2 ring-indigo-600 bg-indigo-100' : ''
                    }`}
                    onClick={() => triggerFieldClick('totalAmount')}
                  >
                    <span>סה"כ לתשלום (ש"ח):</span>
                    <span className="font-mono text-base text-[#e26d00]">13,629.57 ₪</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Consumption Chart (צריכת החשמל שלך) */}
            <div className="border border-slate-200 rounded p-3 bg-[#fffefb]">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-xs text-[#004b87]">
                  צריכת החשמל שלך (קוט״ש)
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-[#f59e0b] rounded-xs inline-block" />
                    <span>שפל</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-[#ea580c] rounded-xs inline-block" />
                    <span>גבע</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-[#b45309] rounded-xs inline-block" />
                    <span>פסגה</span>
                  </div>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="h-28 flex items-end justify-between gap-1 pt-4 border-b border-slate-300 pb-1 px-1">
                {[
                  { m: 'יול 25', h1: 18, h2: 24, h3: 35 },
                  { m: 'אוג 25', h1: 22, h2: 30, h3: 45 },
                  { m: 'ספט 25', h1: 15, h2: 20, h3: 28 },
                  { m: 'אוק 25', h1: 14, h2: 18, h3: 25 },
                  { m: 'נוב 25', h1: 12, h2: 15, h3: 20 },
                  { m: 'דצמ 25', h1: 16, h2: 22, h3: 32 },
                  { m: 'ינו 26', h1: 19, h2: 26, h3: 38 },
                  { m: 'פבר 26', h1: 15, h2: 20, h3: 29 },
                  { m: 'מרץ 26', h1: 14, h2: 18, h3: 25 },
                  { m: 'אפר 26', h1: 16, h2: 22, h3: 30 },
                  { m: 'מאי 26', h1: 18, h2: 25, h3: 36 },
                  { m: 'יונ 26', h1: 21, h2: 28, h3: 42 },
                  { m: 'יול 26', h1: 25, h2: 34, h3: 48 },
                  { m: 'אוג 26', h1: 26, h2: 36, h3: 50 },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full max-w-[14px] flex flex-col justify-end gap-0.5 rounded-t overflow-hidden">
                      <div style={{ height: `${bar.h3}px` }} className="w-full bg-[#b45309]" />
                      <div style={{ height: `${bar.h2}px` }} className="w-full bg-[#ea580c]" />
                      <div style={{ height: `${bar.h1}px` }} className="w-full bg-[#f59e0b]" />
                    </div>
                    <span className="text-[8px] font-mono text-slate-500 tracking-tighter truncate w-full text-center">
                      {bar.m.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Note */}
              <div className="mt-2 text-[9.5px] text-slate-500">
                ■ הודעות: לתשומת לבכם !!! כעת ניתן לשלם בכרטיס אשראי גם סכומים מעל 10,000 ₪.
              </div>
            </div>

            {/* Bottom Stub / שובר לתשלום (Perforated) */}
            <div className="border-t-2 border-dashed border-slate-400 pt-3 space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-xs font-bold text-slate-800">
                  שובר / הודעת זיכוי 2026-491506083
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  חשבון חוזה: 342389945
                </div>
                <div className="flex items-center gap-1 text-[#e26d00] font-bold text-xs">
                  <span>NN חברת החשמל לישראל</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-2 rounded text-[10.5px]">
                <div>
                  <span className="text-slate-500">שם הצרכן:</span>
                  <div className="font-bold text-slate-800">אמבט ליין בע"מ</div>
                </div>
                <div>
                  <span className="text-slate-500">תקופה:</span>
                  <div className="font-mono">14/08/26 - 15/09/26</div>
                </div>
                <div>
                  <span className="text-slate-500">מצב תשלום:</span>
                  <div className="font-bold text-emerald-700">לא לתשלום (הוראת קבע)</div>
                </div>
                <div>
                  <span className="text-slate-500">כרטיס לחיוב:</span>
                  <div className="font-mono font-bold">אשראי ****3710</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                <span>184919-00001_20260916_0001XB</span>
                <span>עמוד 1 מתוך 4</span>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: פירוט קריאות מונה, תעו"ז ותשלומים קבועים */}
        {currentPage === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-sm border border-slate-300 shadow-xl space-y-5 text-[11px] leading-snug">
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-2">
              <div>
                <div className="text-sm font-bold text-slate-900">אמבט ליין בע"מ</div>
                <div className="text-[10.5px] text-slate-600">מספר חשבון חוזה: 342389945 | תקופה: 14/08/2026 עד 15/09/2026</div>
              </div>
              <div className="text-end">
                <div className="text-lg font-black text-[#004b87]">פירוט החיובים / הזיכויים</div>
                <div className="text-[10px] text-slate-500 font-mono">עמוד 2/4</div>
              </div>
            </div>

            {/* Meter readings table */}
            <div>
              <div className="font-bold text-xs text-slate-800 mb-1">
                חיוב בגין צריכה מחח"י (לא כולל מע"מ) - קריאות מונה 9074016
              </div>
              <table className="w-full text-right border border-slate-300 text-[10.5px]">
                <thead className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-700">
                  <tr>
                    <th className="p-1.5">תעריף</th>
                    <th className="p-1.5">קריאה קודמת</th>
                    <th className="p-1.5">קריאה נוכחית</th>
                    <th className="p-1.5 text-center">צריכה (קוט"ש)</th>
                    <th className="p-1.5 text-left">מחיר אג'</th>
                    <th className="p-1.5 text-left">סה"כ ₪</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-1.5">מ"נ-פסגה-קיץ (31/08 - 13/08)</td>
                    <td className="p-1.5 font-mono">358939</td>
                    <td className="p-1.5 font-mono">359365</td>
                    <td className="p-1.5 font-mono text-center">1,704</td>
                    <td className="p-1.5 font-mono text-left">145.96</td>
                    <td className="p-1.5 font-mono text-left font-bold">2,487.16</td>
                  </tr>
                  <tr>
                    <td className="p-1.5">מ"נ-פסגה-קיץ (15/09 - 01/09)</td>
                    <td className="p-1.5 font-mono">359365</td>
                    <td className="p-1.5 font-mono">359699</td>
                    <td className="p-1.5 font-mono text-center">1,336</td>
                    <td className="p-1.5 font-mono text-left">145.96</td>
                    <td className="p-1.5 font-mono text-left font-bold">1,950.03</td>
                  </tr>
                  <tr>
                    <td className="p-1.5">מ"נ-שפל-קיץ (31/08 - 13/08)</td>
                    <td className="p-1.5 font-mono">528908</td>
                    <td className="p-1.5 font-mono">531243</td>
                    <td className="p-1.5 font-mono text-center">9,340</td>
                    <td className="p-1.5 font-mono text-left">42.73</td>
                    <td className="p-1.5 font-mono text-left font-bold">3,990.98</td>
                  </tr>
                  <tr>
                    <td className="p-1.5">מ"נ-שפל-קיץ (15/09 - 01/09)</td>
                    <td className="p-1.5 font-mono">531243</td>
                    <td className="p-1.5 font-mono">532818</td>
                    <td className="p-1.5 font-mono text-center">6,300</td>
                    <td className="p-1.5 font-mono text-left">42.73</td>
                    <td className="p-1.5 font-mono text-left font-bold">2,691.99</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="p-1.5">סה"כ בגין צריכה (קוט"ש):</td>
                    <td className="p-1.5 font-mono text-center">18,680</td>
                    <td className="p-1.5"></td>
                    <td className="p-1.5 font-mono text-left text-blue-900">11,120.16 ₪</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Capacity & Fixed Charges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 p-3 rounded bg-slate-50/50 space-y-1">
                <div className="font-bold text-xs text-slate-800">תשלום בגין הספק (KVA)</div>
                <div className="text-slate-600">הספק: 218.24 KVA (חיבור 3x315A)</div>
                <div className="text-slate-600">33 ימים לפי 6.18 ש"ח לשנה לכל 1 KVA</div>
                <div className="font-mono font-bold text-slate-900 pt-1 border-t border-slate-200">
                  סה"כ: 121.94 ₪
                </div>
              </div>

              <div className="border border-slate-200 p-3 rounded bg-slate-50/50 space-y-1">
                <div className="font-bold text-xs text-slate-800">תשלום קבוע (לא כולל מע"מ)</div>
                <div className="flex justify-between text-slate-600">
                  <span>תשלום קבוע חלוקה (33 ימים):</span>
                  <span className="font-mono">160.44 ₪</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>תשלום קבוע אספקה (33 ימים):</span>
                  <span className="font-mono">116.85 ₪</span>
                </div>
                <div className="flex justify-between font-mono font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>סה"כ:</span>
                  <span>277.29 ₪</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: חיובים וזיכויים שונים, קריאות ראקטיביות */}
        {currentPage === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-sm border border-slate-300 shadow-xl space-y-5 text-[11px] leading-snug">
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-2">
              <div>
                <div className="text-sm font-bold text-slate-900">אמבט ליין בע"מ</div>
                <div className="text-[10.5px] text-slate-600">מספר חשבון חוזה: 342389945</div>
              </div>
              <div className="text-end">
                <div className="text-lg font-black text-[#004b87]">חיובים וזיכויים שונים / שיא ביקוש</div>
                <div className="text-[10px] text-slate-500 font-mono">עמוד 3/4</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-2">
                <div className="font-bold text-xs text-slate-800">חיובים וזיכויים שונים (לא כולל מע"מ)</div>
                <div className="flex justify-between text-slate-700 py-1 border-b border-slate-200">
                  <span>חיוב בגין תשלום בכ"א מעל המגבלה:</span>
                  <span className="font-mono font-bold">32.00 ₪</span>
                </div>
                <div className="flex justify-between text-slate-700 py-1 border-b border-slate-200">
                  <span>זיכוי בגין קבלת החשבון בדואר אלקטרוני:</span>
                  <span className="font-mono font-bold text-emerald-700">-0.91 ₪</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-xs pt-1">
                  <span>סה"כ חיובים וזיכויים שונים:</span>
                  <span className="font-mono">31.09 ₪</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-2">
                <div className="font-bold text-xs text-slate-800">שיא ביקוש - מונה 9074016</div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="text-slate-500 text-[10px]">ש.ב פסגה</div>
                    <div className="font-mono font-bold text-sm">55.8 קו"ט</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="text-slate-500 text-[10px]">ש.ב גבע</div>
                    <div className="font-mono font-bold text-sm">0.0 קו"ט</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="text-slate-500 text-[10px]">ש.ב שפל</div>
                    <div className="font-mono font-bold text-sm">69.4 קו"ט</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-xs">
                ■ ח-ן 08/2026 בסך 13,436.63 ₪ נשלח לגבייה בחברת האשראי ב-03/09/2026.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================================
     2. סונול EVI בע"מ (SONOL EVI)
     ========================================================================= */
  if (isSonolEVI) {
    return (
      <SonolEviPaymentSummaryViewer
        invoice={invoice}
        highlightedField={highlightedField}
        onSelectField={(field) => triggerFieldClick(field)}
      />
    );
  }

  if (false && isSonolEVI) {
    return (
      <div 
        id={`sonol-evi-doc-${invoice.id}`}
        className="w-full bg-white text-slate-900 p-8 shadow-xl rounded-sm border border-slate-300 font-sans select-text text-xs leading-normal"
        dir="ltr"
      >
        {/* Top Header: Sonol EVI Logo & Black Scalloped Stamp */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-5">
          {/* Black Scalloped Digital Signature Badge */}
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black text-white flex flex-col items-center justify-center text-center p-1 shadow-md border-2 border-dashed border-white ring-2 ring-black">
              <span className="text-[10px] font-bold tracking-tight leading-tight">
                חתום דיגיטלית
              </span>
            </div>
          </div>

          {/* Sonol EVI Header Logo */}
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-[#002f6c]">EVI</span>
              <span className="text-2xl font-black text-[#e4002b]">סונול</span>
            </div>
            <div className="text-[9.5px] text-slate-500 font-semibold tracking-wide">
              טכנולוגיות מתקדמות לטעינה חשמלית
            </div>
          </div>
        </div>

        {/* Big Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payment summary
          </h1>
        </div>

        {/* 2-Column Parties Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200 text-xs">
          {/* Left: Sonol EVI */}
          <div className="space-y-1">
            <div 
              className={`font-bold text-slate-900 cursor-pointer p-0.5 rounded transition ${
                highlightedField === 'supplierName' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
              }`}
              onClick={() => triggerFieldClick('supplierName')}
            >
              Sonol EVI
            </div>
            <div 
              className={`text-slate-600 font-mono cursor-pointer p-0.5 rounded ${
                highlightedField === 'supplierTaxId' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
              }`}
              onClick={() => triggerFieldClick('supplierTaxId')}
            >
              Company registration #: <strong>515747814</strong>
            </div>
            <div className="text-slate-600">הגביש 10</div>
            <div className="text-slate-600">נתניה</div>
            <div className="text-slate-600 font-mono">4250706</div>
            <div className="text-slate-600">Israel</div>
          </div>

          {/* Right: Recipient (Ambat Line) */}
          <div className="space-y-1 sm:text-right" dir="rtl">
            <div className="font-bold text-slate-900">אמבט ליין</div>
            <div className="text-slate-600 font-mono">
              Tax ID #: <strong>512101544</strong>
            </div>
            <div className="text-slate-600 font-mono">
              Account #: <strong>1198671</strong>
            </div>
            <div className="text-slate-600">המצפה 11 גני תקווה 11</div>
            <div className="text-slate-600">גני תקווה</div>
            <div className="text-slate-600 font-mono">5591755</div>
            <div className="text-slate-600">Israel</div>
            <div className="text-slate-500 text-[11px] pt-1">
              User type: <strong className="text-slate-800">Registered</strong>
            </div>
            <div className="text-slate-500 text-[11px]">
              Plan(s): <strong className="text-slate-800">IM - טעינה ציבורית ברחבי גני תקוה</strong>
            </div>
          </div>
        </div>

        {/* Invoice details block */}
        <div className="py-5 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            Invoice details
          </h2>
          <div className="grid grid-cols-2 max-w-sm text-xs gap-y-1">
            <span className="text-slate-500">Invoice #</span>
            <span 
              className={`font-mono font-bold text-slate-900 cursor-pointer p-0.5 rounded ${
                highlightedField === 'invoiceNumber' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
              }`}
              onClick={() => triggerFieldClick('invoiceNumber')}
            >
              3299586
            </span>

            <span className="text-slate-500">Issue date:</span>
            <span 
              className={`font-mono text-slate-800 cursor-pointer p-0.5 rounded ${
                highlightedField === 'issueDate' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
              }`}
              onClick={() => triggerFieldClick('issueDate')}
            >
              18.09.2026
            </span>

            <span className="text-slate-500">Due date:</span>
            <span className="font-mono text-slate-800">18.09.2026</span>

            <span className="text-slate-500">Payment status:</span>
            <span className="font-bold text-emerald-700">Paid</span>

            <span className="text-slate-500">Payment status date:</span>
            <span className="font-mono text-slate-800">18.09.2026</span>
          </div>
        </div>

        {/* Charging activity section */}
        <div className="py-5 border-b border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Charging activity
            </h2>
            <div className="text-[11px] text-slate-500">
              Post date: <strong className="font-mono text-slate-800">09/18/2026</strong> | Plan(s): <strong>IM - טעינה ציבורית ברחבי גני תקוה</strong>
            </div>
          </div>

          <div className="border border-slate-200 rounded-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="p-2.5">1 Session info</th>
                  <th className="p-2.5">Station info</th>
                  <th className="p-2.5 text-right">Amount before tax</th>
                  <th className="p-2.5 text-right">Tax</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/60">
                  <td className="p-2.5 font-sans space-y-0.5">
                    <div className="font-semibold text-slate-900">Charging session</div>
                    <div className="text-slate-500 font-mono text-[10.5px]">Start 18.09.2026 13:02</div>
                    <div className="text-slate-500 font-mono text-[10.5px]">End 18.09.2026 13:46</div>
                    <div className="text-slate-500 font-mono text-[10.5px]">Duration: 00:43:52</div>
                    <div className="text-slate-500 font-mono text-[10.5px]">Energy: 7.8340 kWh</div>
                  </td>
                  <td className="p-2.5 space-y-0.5" dir="rtl">
                    <div className="font-semibold text-slate-900">2454 - חניון בני עקיבא</div>
                    <div className="text-slate-500 font-mono text-[10.5px]">Type 2</div>
                    <div className="text-slate-500 text-[10.5px]">הר נבו 2</div>
                    <div className="text-slate-500 text-[10.5px]">גני תקווה</div>
                  </td>
                  <td 
                    className={`p-2.5 text-right font-mono font-bold text-slate-900 cursor-pointer ${
                      highlightedField === 'subtotal' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
                    }`}
                    onClick={() => triggerFieldClick('subtotal')}
                  >
                    ₪5.64
                  </td>
                  <td 
                    className={`p-2.5 text-right font-mono text-slate-700 cursor-pointer ${
                      highlightedField === 'vatAmount' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
                    }`}
                    onClick={() => triggerFieldClick('vatAmount')}
                  >
                    ₪1.02
                  </td>
                  <td 
                    className={`p-2.5 text-right font-mono font-black text-slate-900 cursor-pointer ${
                      highlightedField === 'totalAmount' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
                    }`}
                    onClick={() => triggerFieldClick('totalAmount')}
                  >
                    ₪6.66
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Total calculation */}
        <div className="py-5 border-b border-slate-200 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 font-bold">Amount before tax</span>
              <span className="font-mono font-bold">₪5.64</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-bold">TAX total</span>
              <span className="font-mono font-bold">₪1.02</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
              <span>Grand total</span>
              <span className="font-mono text-base">₪6.66</span>
            </div>
          </div>
        </div>

        {/* Payment details */}
        <div className="py-5 space-y-2">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            Payment details
          </h2>
          <div className="grid grid-cols-2 max-w-sm text-xs gap-y-1.5">
            <span className="text-slate-500">Confirmation #</span>
            <span className="font-mono font-bold text-slate-900">4763724</span>

            <span className="text-slate-500">Payment method</span>
            <span className="font-bold text-slate-800">MASTERCARD</span>

            <span className="text-slate-500">Card #</span>
            <span className="font-mono text-slate-800">************9057</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-400">
          *Minor discrepancies may occur due to rounding
        </div>
      </div>
    );
  }

  /* =========================================================================
     3. STANDARD ISRAELI TAX INVOICE REPLICA (ESO, Partner, Tnuva, etc.)
     ========================================================================= */
  const allocationNumber = `2026-${(invoice.supplierTaxId || '510000000').slice(0, 5)}-${invoice.invoiceNumber.replace(/\D/g, '') || '748'}-01`;

  return (
    <div 
      id={`standard-doc-${invoice.id}`}
      className="w-full bg-white text-slate-900 p-8 shadow-xl rounded-sm border border-slate-300 font-sans select-text text-xs leading-normal relative"
      dir="rtl"
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-4 z-0">
        <span className="text-8xl font-black text-slate-900 tracking-widest rotate-[-35deg]">
          ORIGINAL
        </span>
      </div>

      {/* Header Bar */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5 flex justify-between items-start relative z-10">
        <div>
          <div className="flex items-center gap-3">
            {invoice.supplierName.includes('ESO') || invoice.supplierName.includes('אי.אס.או') ? (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-cyan-700 to-blue-700 text-white font-black text-sm flex flex-col items-center justify-center shadow-md">
                <span>ESO</span>
                <span className="text-[7px] font-mono opacity-90">SYSTEMS</span>
              </div>
            ) : invoice.supplierName.includes('פרטנר') || invoice.supplierName.includes('Partner') ? (
              <div className="w-12 h-12 rounded-lg bg-[#00a9e0] text-white font-black text-lg flex items-center justify-center shadow-md">
                P
              </div>
            ) : (
              <div className="w-11 h-11 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {invoice.supplierName.slice(0, 2)}
              </div>
            )}
            <div>
              <h2 
                className={`text-lg font-bold text-slate-900 tracking-tight cursor-pointer p-0.5 rounded transition ${
                  highlightedField === 'supplierName' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
                }`}
                onClick={() => triggerFieldClick('supplierName')}
              >
                {invoice.supplierName}
              </h2>
              <div 
                className={`text-xs text-slate-600 font-mono cursor-pointer p-0.5 rounded ${
                  highlightedField === 'supplierTaxId' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
                }`}
                onClick={() => triggerFieldClick('supplierTaxId')}
              >
                עוסק מורשה / ח.פ: <strong>{invoice.supplierTaxId}</strong>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {invoice.supplierAddress || 'ישראל'}
          </div>
        </div>

        <div className="text-left" dir="ltr">
          <div className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold inline-block mb-1">
            חשבונית מס / קבלה מקור
          </div>
          <div 
            className={`text-sm font-mono font-bold text-slate-900 cursor-pointer p-0.5 rounded ${
              highlightedField === 'invoiceNumber' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
            }`}
            onClick={() => triggerFieldClick('invoiceNumber')}
          >
            מס' : {invoice.invoiceNumber}
          </div>
          <div 
            className={`text-xs text-slate-600 font-mono cursor-pointer p-0.5 rounded ${
              highlightedField === 'issueDate' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
            }`}
            onClick={() => triggerFieldClick('issueDate')}
          >
            תאריך: {invoice.issueDate}
          </div>
          <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-semibold">
            🛡️ הקצאה: {allocationNumber}
          </div>
        </div>
      </div>

      {/* Recipient */}
      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-5 relative z-10 text-xs">
        <div className="text-[11px] text-slate-500 font-semibold mb-0.5">
          לכבוד (הלקוח):
        </div>
        <div className="font-bold text-sm text-slate-900">
          אמבט ליין בע״מ (רשת פרפקט ליין)
        </div>
        <div className="flex justify-between items-center text-slate-600 mt-1 font-mono text-[11px]">
          <span>ח.פ: 512101544 | המצפה 11, גני תקווה</span>
          <span>חשבון לקוח: 1198671 | שוטף + 30</span>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="relative z-10 mb-6 border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-xs text-right">
          <thead>
            <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-700 font-bold">
              <th className="p-2.5 w-16">מק״ט</th>
              <th className="p-2.5">תיאור השירות / פריט</th>
              <th className="p-2.5 text-center w-14">כמות</th>
              <th className="p-2.5 text-left w-24">מחיר יח'</th>
              <th className="p-2.5 text-left w-24">סה״כ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80">
                <td className="p-2.5 font-mono text-slate-500 text-[11px]">
                  {line.sku || `00${idx + 1}`}
                </td>
                <td className="p-2.5 font-medium text-slate-800">
                  {line.description}
                </td>
                <td className="p-2.5 text-center font-mono">
                  {line.quantity}
                </td>
                <td className="p-2.5 text-left font-mono" dir="ltr">
                  {line.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}
                </td>
                <td className="p-2.5 text-left font-mono font-bold" dir="ltr">
                  {line.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="border-t-2 border-slate-800 pt-4 flex justify-between items-start relative z-10">
        <div className="text-xs text-slate-500 max-w-xs space-y-1">
          <p className="font-semibold text-slate-700">תנאי תשלום: שוטף + 30 מיום הוצאת החשבונית</p>
          <p className="text-[10px]">מסמך זה הופק באופן ממוחשב ומאושר לפי הוראות מס הכנסה תשל״ג-1973.</p>
        </div>

        <div className="w-64 space-y-1.5 text-xs text-slate-700">
          <div 
            className={`flex justify-between py-1 border-b border-slate-200 cursor-pointer ${
              highlightedField === 'subtotal' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
            }`}
            onClick={() => triggerFieldClick('subtotal')}
          >
            <span>סכום חייב במע״מ:</span>
            <span className="font-mono font-bold" dir="ltr">{invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}</span>
          </div>
          <div 
            className={`flex justify-between py-1 border-b border-slate-200 cursor-pointer ${
              highlightedField === 'vatAmount' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
            }`}
            onClick={() => triggerFieldClick('vatAmount')}
          >
            <span>מע״מ (18%):</span>
            <span className="font-mono font-bold" dir="ltr">{invoice.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}</span>
          </div>
          <div 
            className={`flex justify-between py-2 bg-slate-100 px-2 rounded-lg text-sm font-bold text-slate-900 cursor-pointer ${
              highlightedField === 'totalAmount' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
            }`}
            onClick={() => triggerFieldClick('totalAmount')}
          >
            <span>סה״כ לתשלום:</span>
            <span className="font-mono text-base text-indigo-700" dir="ltr">{invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}</span>
          </div>
        </div>
      </div>

      {/* Tax Authority Stamp Box */}
      <div className="mt-8 p-3 rounded-lg border-2 border-dashed border-emerald-600 bg-emerald-50/60 text-emerald-900 text-xs flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <div className="font-bold text-[11px]">
              מסמך ממוחשב מאומת - רשות המסים בישראל
            </div>
            <div className="text-[10.5px] text-emerald-800 font-mono mt-0.5">
              מספר הקצאה חוקי: {allocationNumber} | חתימה דיגיטלית מאושרת
            </div>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
          חוקי לניכוי מע״מ
        </span>
      </div>
    </div>
  );
};
