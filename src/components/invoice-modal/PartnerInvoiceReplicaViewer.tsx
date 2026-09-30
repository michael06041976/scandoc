import React from 'react';
import { InvoiceDocument } from '../../types';

interface PartnerInvoiceReplicaViewerProps {
  invoice: InvoiceDocument;
  highlightedField?: string | null;
  onSelectField?: (fieldKey: string) => void;
  interactive?: boolean;
}

export const PartnerInvoiceReplicaViewer: React.FC<PartnerInvoiceReplicaViewerProps> = ({
  invoice,
  highlightedField,
  onSelectField,
  interactive = true,
}) => {
  const triggerClick = (field: string) => {
    if (interactive && onSelectField) {
      onSelectField(field);
    }
  };

  // Values from invoice or authentic defaults from the Gmail source invoice
  const invNumber = invoice.invoiceNumber || '1074573052';
  const issueDate = invoice.issueDate ? invoice.issueDate.split('-').reverse().join('/') : '18/09/2026';
  const allocationNum = invoice.allocationNumber || '259062769';
  const supplierTaxId = invoice.supplierTaxId || '512463730';
  
  // Dynamic exact amounts from invoice
  const totalAmount = (invoice.totalAmount ?? 189.90).toFixed(2);
  const subtotalBeforeVat = (invoice.subtotal ?? 162.31).toFixed(2);
  const vatAmount = (invoice.vatAmount ?? 27.59).toFixed(2);
  const vatRate = invoice.subtotal && invoice.vatAmount 
    ? Math.round((invoice.vatAmount / invoice.subtotal) * 100) 
    : 17;

  return (
    <div 
      id={`partner-doc-${invoice.id}`}
      dir="rtl"
      className="w-full bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 font-sans select-text text-xs leading-normal p-6 sm:p-8 relative"
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0 select-none">
        <span className="text-9xl font-black text-slate-900 tracking-widest rotate-[-30deg]">
          PARTNER
        </span>
      </div>

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200 relative z-10">
        
        {/* Right Column: Customer Info (לכבוד אמבט ליין בע"מ) */}
        <div className="w-full sm:w-1/2 space-y-1 text-right text-[11px] leading-tight">
          <div className="text-slate-600 font-semibold">לכבוד</div>
          <div 
            className={`font-black text-sm text-slate-900 cursor-pointer p-0.5 rounded transition ${
              highlightedField === 'customerName' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
            }`}
            onClick={() => triggerClick('customerName')}
          >
            אמבט ליין בע"מ
          </div>
          <div className="text-slate-700">ת.ד 11101</div>
          <div className="text-slate-700">פתח תקווה 4951701</div>
          <div className="text-slate-700">בניין C מגדלי בסר קומה , 24יחידה 166</div>
          <div 
            className={`text-slate-800 font-mono cursor-pointer p-0.5 rounded ${
              highlightedField === 'customerTaxId' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
            }`}
            onClick={() => triggerClick('customerTaxId')}
          >
            מס' עוסק מורשה/ת.ז. (לקוח) <strong>512101544</strong>
          </div>
          <div className="text-slate-600 font-mono text-[10px]">
            ambatline.reshbon@gmail.com
          </div>

          <div className="pt-2 border-t border-slate-200 text-[10.5px] text-slate-600 font-medium">
            חשבון תקופתי זה מתייחס ל <strong>4 מנויים</strong> שברשותך אשר פירוט עבורם מופיע בתוך החשבון תקופתי.
          </div>
        </div>

        {/* Center: "מסמך ממוחשב" */}
        <div className="hidden md:flex flex-col items-center justify-start pt-2">
          <div className="text-[#009ca6] font-extrabold text-2xl tracking-wide select-none drop-shadow-xs">
            מסמך ממוחשב
          </div>
        </div>

        {/* Left Column: Partner Corporate Details & Legal Disclaimer */}
        <div className="w-full sm:w-1/2 flex flex-col items-end space-y-2 text-left" dir="rtl">
          
          {/* Partner 5G Logo & Address */}
          <div className="flex items-start gap-3 w-full justify-start sm:justify-end">
            <div 
              className={`space-y-0.5 text-right text-[10px] text-slate-700 leading-tight cursor-pointer p-1 rounded transition ${
                highlightedField === 'supplierName' || highlightedField === 'supplierTaxId' 
                  ? 'ring-2 ring-indigo-600 bg-indigo-50' 
                  : ''
              }`}
              onClick={() => triggerClick('supplierName')}
            >
              <div className="font-bold text-slate-900 text-[11px]">חברת פרטנר תקשורת בע"מ</div>
              <div>רחוב עמל 8, פארק תעשיות אפק</div>
              <div>ראש-העין 4810302 | שירות: *054</div>
              <div>עוסק מורשה / ח.פ: <strong>{supplierTaxId}</strong></div>
              <div>חברה ציבורית 520044314 | www.Partner.co.il</div>
              <div className="text-emerald-700 font-bold font-mono text-[9.5px] pt-0.5">
                מס' הקצאה ברשות המסים: {allocationNum}
              </div>
            </div>

            {/* Official Partner 5G Badge */}
            <div 
              className="bg-[#38bdae] text-black font-black text-sm px-3 py-2 rounded-xl flex items-center justify-center shadow-xs shrink-0 select-none cursor-pointer"
              onClick={() => triggerClick('supplierName')}
              title="Partner 5G"
            >
              <span className="tracking-tight text-base font-extrabold">Partner 5G</span>
            </div>
          </div>

          {/* Legal Notice Box */}
          <div className="bg-slate-50 border border-slate-300 rounded p-1.5 text-[9px] text-slate-600 leading-tight text-right w-full max-w-sm">
            מסמך זה הינו מסמך ממוחשב - חשבונית מס / קבלה מקור כהגדרתה בחוק. נחתם דיגיטלית ונשלח כקובץ מצורף מתוך מערכות פרטנר תקשורת אל ambatline.reshbon@gmail.com.
          </div>

          {/* Account Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10.5px] text-right w-full max-w-sm pt-1">
            <span className="text-slate-500">מס' חשבון תקופתי / חשבונית:</span>
            <span 
              className={`font-mono font-bold text-slate-900 cursor-pointer p-0.5 rounded ${
                highlightedField === 'invoiceNumber' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
              }`}
              onClick={() => triggerClick('invoiceNumber')}
            >
              {invNumber}
            </span>

            <span className="text-slate-500">תאריך הפקת החשבון:</span>
            <span 
              className={`font-mono font-semibold text-slate-800 cursor-pointer p-0.5 rounded ${
                highlightedField === 'issueDate' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
              }`}
              onClick={() => triggerClick('issueDate')}
            >
              {issueDate}
            </span>

            <span className="text-slate-500">מספר מנוי / לקוח:</span>
            <span className="font-mono text-slate-800">88219401 / 1074573052</span>

            <span className="text-slate-500">מספר הקצאה:</span>
            <span className="font-mono text-emerald-800 font-bold">{allocationNum}</span>
          </div>

        </div>

      </div>

      {/* BANNER: חשבון תקופתי - מקור + תקופת החשבון */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-900 pb-1 mt-6 mb-4 relative z-10">
        <h1 className="text-base sm:text-lg font-black text-slate-900">
          חשבון תקופתי וחשבונית מס - מקור
        </h1>
        <div className="text-sm font-bold text-[#009ca6]">
          תקופת החשבון מה-01.08.26 עד ה-31.08.26
        </div>
      </div>

      {/* CHARGES BREAKDOWN TABLE */}
      <div className="relative z-10 mb-6 text-xs">
        {/* Table Header */}
        <div className="flex justify-between items-center font-bold border-b border-slate-900 pb-1 mb-2 text-slate-800">
          <span className="w-2/3 text-right">תיאור ופירוט שירותי תקשורת</span>
          <span className="w-1/3 text-left">סכום בש"ח</span>
        </div>

        {/* Regular Charges / Lines from Invoice */}
        <div className="space-y-2 py-1">
          {invoice.lines && invoice.lines.length > 0 ? (
            invoice.lines.map((l, idx) => (
              <div key={l.id || idx} className="flex justify-between items-center text-slate-800">
                <span className="font-medium">{l.description}</span>
                <span className="font-mono font-medium" dir="ltr">{l.total.toFixed(2)} ₪</span>
              </div>
            ))
          ) : (
            <>
              <div className="flex justify-between items-center text-slate-800">
                <span className="font-medium">שירותי תקשורת ואינטרנט עסקי - קווי 5G אמבט ליין בע"מ</span>
                <span className="font-mono font-medium" dir="ltr">{subtotalBeforeVat} ₪</span>
              </div>
            </>
          )}
        </div>

        <div className="w-full border-t border-slate-300 my-2"></div>

        {/* Totals Breakdown */}
        <div className="space-y-1.5 text-[11.5px]">
          <div 
            className={`flex justify-between items-center text-slate-800 cursor-pointer p-0.5 rounded transition ${
              highlightedField === 'subtotal' ? 'ring-2 ring-indigo-600 bg-indigo-50 font-bold' : ''
            }`}
            onClick={() => triggerClick('subtotal')}
          >
            <span className="font-semibold">סה"כ סכום לפני מע"מ</span>
            <span className="font-mono font-bold" dir="ltr">{subtotalBeforeVat} ₪</span>
          </div>

          <div 
            className={`flex justify-between items-center text-slate-800 cursor-pointer p-0.5 rounded transition ${
              highlightedField === 'vatAmount' ? 'ring-2 ring-indigo-600 bg-indigo-50 font-bold' : ''
            }`}
            onClick={() => triggerClick('vatAmount')}
          >
            <span className="font-semibold">מע"מ {vatRate}%</span>
            <span className="font-mono font-bold" dir="ltr">{vatAmount} ₪</span>
          </div>

          <div 
            className={`flex justify-between items-center font-bold text-slate-900 border-t border-slate-800 pt-1 cursor-pointer p-0.5 rounded transition ${
              highlightedField === 'totalAmount' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
            }`}
            onClick={() => triggerClick('totalAmount')}
          >
            <span>סה"כ כולל מע"מ לתשלום</span>
            <span className="font-mono font-black text-sm" dir="ltr">{totalAmount} ₪</span>
          </div>
        </div>
      </div>

      {/* BOTTOM SUMMARY & PAYMENT HIGHLIGHT */}
      <div className="border-t-2 border-slate-900 pt-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        
        {/* Payment Terms & Bank Notification */}
        <div className="w-full md:w-3/5 text-[10.5px] text-slate-700 space-y-1.5 leading-relaxed text-right">
          <div>
            תשלום החשבון יבוצע באמצעות חיוב חשבון הבנק המסתיים בספרות <strong>7400</strong> לא לפני <strong>27/09/26</strong>.
            במידה ושולם החשבון ראה הודעה תשלום זו כמבוטלת.
          </div>
          <div className="flex flex-col gap-0.5 font-medium text-slate-800 pt-1">
            <div>■ תשלום שהתקבל לתקופה הקודמת 272.27 ₪</div>
            <div>■ פטור מלא מניכוי מס במקור</div>
          </div>
        </div>

        {/* Big Teal Pill / Capsule for סה"כ לתשלום */}
        <div 
          className={`flex items-center gap-3 cursor-pointer p-1 rounded-2xl transition shrink-0 ${
            highlightedField === 'totalAmount' ? 'ring-4 ring-indigo-500' : ''
          }`}
          onClick={() => triggerClick('totalAmount')}
        >
          <span className="text-xl sm:text-2xl font-black text-black select-none">
            סה"כ לתשלום
          </span>
          <div className="bg-[#42c5b7] text-black font-extrabold text-xl sm:text-2xl px-6 py-2.5 rounded-full shadow-md select-none tracking-tight" dir="ltr">
            ₪ {totalAmount}
          </div>
        </div>

      </div>

      {/* Gmail PDF-Style Page Toolbar at Bottom */}
      <div className="flex items-center justify-center gap-4 bg-slate-800 text-white text-[11px] font-mono py-1.5 px-4 rounded-full mt-8 mx-auto w-fit shadow-md select-none">
        <button type="button" className="hover:text-amber-300 font-bold px-1">+</button>
        <span className="text-slate-400">|</span>
        <button type="button" className="hover:text-amber-300 font-bold px-1">-</button>
        <span className="text-slate-400">|</span>
        <span className="font-sans font-bold">דף 2 / 9</span>
      </div>

    </div>
  );
};
