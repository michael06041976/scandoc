import React from 'react';
import { InvoiceDocument } from '../../types';

interface AmitiInvoiceReplicaViewerProps {
  invoice: InvoiceDocument;
  highlightedField?: string | null;
  onSelectField?: (fieldKey: string) => void;
  interactive?: boolean;
}

export const AmitiInvoiceReplicaViewer: React.FC<AmitiInvoiceReplicaViewerProps> = ({
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

  const invNumber = invoice.invoiceNumber || '01/002467';
  const issueDate = invoice.issueDate ? invoice.issueDate.split('-').reverse().join('/') : '17/09/26';
  const allocationNum = invoice.allocationNumber || '260097749';

  const subtotalStr = invoice.subtotal ? invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '435,258.47';
  const vatAmountStr = invoice.vatAmount ? invoice.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '78,346.53';
  const totalAmountStr = invoice.totalAmount ? invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '513,605.00';

  return (
    <div 
      id={`amiti-doc-${invoice.id}`}
      dir="rtl"
      className="w-full bg-white text-black shadow-2xl rounded-sm border-2 border-slate-300 font-sans select-text text-xs leading-normal p-6 sm:p-8 relative"
    >
      {/* 1. TOP ENCLOSED RECTANGLE BORDER */}
      <div 
        className={`border-2 border-black p-3.5 flex justify-between items-start cursor-pointer transition ${
          highlightedField === 'supplierName' || highlightedField === 'supplierTaxId' ? 'ring-2 ring-indigo-600 bg-indigo-50/50' : ''
        }`}
        onClick={() => triggerClick('supplierName')}
      >
        {/* Right side: Company name & address */}
        <div className="text-right space-y-0.5">
          <div className="font-black text-base tracking-tight text-black">
            ח.י אמיתי בע"מ
          </div>
          <div className="text-xs font-semibold text-black">
            גיבורי ישראל 5 נתניה
          </div>
          <div className="text-[11px] font-mono text-black">
            טלפון: 09-8650044 פקס: 09-8654880
          </div>
        </div>

        {/* Left side: Tax ID */}
        <div className="text-left font-mono font-bold text-xs" dir="rtl">
          עוסק מורשה: <span className="font-extrabold text-black">511080327</span>
        </div>
      </div>

      {/* 2. DOUBLE HORIZONTAL SEPARATION LINES */}
      <div className="border-t-2 border-b-2 border-black h-1.5 my-3.5"></div>

      {/* 3. DOCUMENT TITLE */}
      <div className="text-center my-3">
        <h1 
          className={`text-xl sm:text-2xl font-black text-black tracking-wide inline-block cursor-pointer p-1 rounded ${
            highlightedField === 'invoiceNumber' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
          }`}
          onClick={() => triggerClick('invoiceNumber')}
        >
          חשבונית מס מקור : {invNumber}
        </h1>
      </div>

      {/* 4. METADATA HEADER GRID */}
      <div className="grid grid-cols-2 gap-4 text-xs font-mono my-2.5">
        {/* Right: Allocation number and reference */}
        <div className="space-y-1 text-right">
          <div>מספרכם: <strong className="text-black">00074</strong></div>
          <div 
            className={`cursor-pointer p-0.5 rounded transition ${
              highlightedField === 'allocationNumber' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
            }`}
            onClick={() => triggerClick('allocationNumber')}
          >
            הקצאה מספר: <strong className="font-black text-black">{allocationNum}</strong>
          </div>
        </div>

        {/* Left: Date, time and page */}
        <div className="space-y-1 text-left" dir="rtl">
          <div 
            className={`cursor-pointer p-0.5 rounded ${
              highlightedField === 'issueDate' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
            }`}
            onClick={() => triggerClick('issueDate')}
          >
            תאריך: <strong className="text-black">{issueDate}</strong>
          </div>
          <div>שעה : <strong className="text-black">10:18</strong></div>
          <div>דף 1 מתוך 1</div>
        </div>
      </div>

      {/* 5. RECIPIENT BLOCK (לכבוד אמבט ליין) */}
      <div className="border-t-2 border-black pt-3 pb-2 text-xs space-y-0.5 text-right">
        <div className="font-bold text-black">לכבוד :</div>
        <div 
          className={`font-black text-sm text-black cursor-pointer p-0.5 rounded ${
            highlightedField === 'customerName' ? 'ring-2 ring-indigo-600 bg-indigo-50' : ''
          }`}
          onClick={() => triggerClick('customerName')}
        >
          אמבט ליין בע"מ
        </div>
        <div className="text-black font-medium">
          מגדלי בסר, ת.ד 11101 C שחם 1 &nbsp;&nbsp;&nbsp; טלפון: 03-7585055
        </div>
        <div className="text-black font-medium">
          פ"ת, מיקוד 4951701 &nbsp;&nbsp;&nbsp; פקס:
        </div>
        <div className="font-mono font-bold text-black">
          ע.מ./ת.ז: 51210154-4
        </div>
      </div>

      {/* 6. THICK DIVIDER LINE */}
      <div className="border-t-2 border-black my-2"></div>

      {/* 7. ITEMS TABLE */}
      <div className="my-3">
        <div className="flex justify-between items-center font-black text-xs border-b-2 border-black pb-1 mb-2">
          <span className="w-4/5 text-right">תאור</span>
          <span className="w-1/5 text-left font-mono">ש"ח</span>
        </div>

        <div className="flex justify-between items-start py-2 text-xs">
          <span className="w-4/5 text-right font-medium text-black">
            שכירות 08/26-10/26. צ'ק על חודש 09/26 שולם בנפרד
          </span>
          <span className="w-1/5 text-left font-mono font-bold text-black" dir="ltr">
            435,258.475
          </span>
        </div>
      </div>

      {/* 8. THICK DIVIDER LINE */}
      <div className="border-t-2 border-black my-3"></div>

      {/* 9. TOTALS BREAKDOWN BOX (Crisp black grid box on the left) */}
      <div className="flex justify-end my-4">
        <div className="w-full sm:w-80 border-2 border-black divide-y-2 divide-black text-xs font-mono">
          
          <div 
            className={`flex justify-between p-2 cursor-pointer transition ${
              highlightedField === 'subtotal' ? 'bg-indigo-100 ring-2 ring-indigo-600' : ''
            }`}
            onClick={() => triggerClick('subtotal')}
          >
            <span className="font-bold text-black">סה"כ ללא מע"מ:</span>
            <span className="font-bold text-black" dir="ltr">435,258.48</span>
          </div>

          <div className="flex justify-between p-2 text-slate-800">
            <span>הנחה:  0.00 %</span>
            <span dir="ltr">(0.01)</span>
          </div>

          <div className="flex justify-between p-2 font-bold text-black">
            <span>סה"כ לאחר הנחה:</span>
            <span dir="ltr">{subtotalStr}</span>
          </div>

          <div 
            className={`flex justify-between p-2 cursor-pointer transition ${
              highlightedField === 'vatAmount' ? 'bg-indigo-100 ring-2 ring-indigo-600' : ''
            }`}
            onClick={() => triggerClick('vatAmount')}
          >
            <span className="font-bold text-black">מע"מ 18.00%:</span>
            <span className="font-bold text-black" dir="ltr">{vatAmountStr}</span>
          </div>

          <div 
            className={`flex justify-between p-2.5 bg-slate-100 text-sm font-black text-black cursor-pointer transition ${
              highlightedField === 'totalAmount' ? 'bg-indigo-200 ring-2 ring-indigo-600' : ''
            }`}
            onClick={() => triggerClick('totalAmount')}
          >
            <span className="text-black">סה"כ לתשלום:</span>
            <span className="text-base text-black" dir="ltr">{totalAmountStr}</span>
          </div>

        </div>
      </div>

      {/* 10. SIGNATURE FOOTER */}
      <div className="border-t border-slate-400 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-start gap-4 text-xs">
        <div className="space-y-1 text-right text-slate-700 font-mono">
          <div>שם המקבל: ____________________</div>
          <div>חתימה: ____________________</div>
          <div>תאריך: ____________________</div>
        </div>

        <div className="text-left font-mono space-y-1" dir="rtl">
          <div className="text-slate-500 font-bold">מפיק המסמך:</div>
          <div className="font-black text-black text-sm">ח.י אמיתי בע"מ</div>
        </div>
      </div>

      {/* PDF View Bar at Bottom */}
      <div className="flex items-center justify-center gap-4 bg-slate-800 text-white text-[11px] font-mono py-1.5 px-4 rounded-full mt-8 mx-auto w-fit shadow-md select-none">
        <button type="button" className="hover:text-amber-300 font-bold px-1">+</button>
        <span className="text-slate-400">|</span>
        <button type="button" className="hover:text-amber-300 font-bold px-1">-</button>
        <span className="text-slate-400">|</span>
        <span className="font-sans font-bold">דף 1 / 1</span>
      </div>

    </div>
  );
};
