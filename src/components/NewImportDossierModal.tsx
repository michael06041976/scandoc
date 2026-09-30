import React, { useState } from 'react';
import { 
  X, 
  Ship, 
  Anchor, 
  FileText, 
  Calendar, 
  DollarSign, 
  Globe, 
  Building2, 
  Check, 
  Upload, 
  Paperclip,
  Navigation,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { ImportDossier, Language } from '../types';
import { translations } from '../i18n/translations';

interface NewImportDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dossier: ImportDossier) => void;
  language: Language;
}

export const NewImportDossierModal: React.FC<NewImportDossierModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  language,
}) => {
  const t = translations[language];

  // Auto-generated dossier number
  const initialDossierNumber = `IMPORT 2026-${Math.floor(490 + Math.random() * 50).toString().padStart(5, '0')}`;

  const [dossierNumber, setDossierNumber] = useState(initialDossierNumber);
  const [title, setTitle] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [originCountry, setOriginCountry] = useState('איטליה (Italy)');
  const [portOfEntry, setPortOfEntry] = useState('נמל חיפה (Haifa Port)');
  const [status, setStatus] = useState<'in_transit' | 'customs_cleared' | 'draft' | 'received'>('in_transit');
  const [eta, setEta] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    return d.toISOString().split('T')[0];
  });
  const [billOfLadingNumber, setBillOfLadingNumber] = useState(`MSK-${Math.floor(100000000 + Math.random() * 900000000)}`);
  const [vesselFlight, setVesselFlight] = useState('CMA CGM BIANCA v.118E');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'ILS'>('EUR');
  const [totalGoodsValue, setTotalGoodsValue] = useState<number>(65000);
  const [freightCost, setFreightCost] = useState<number>(6800);
  const [customsDuty, setCustomsDuty] = useState<number>(5400);
  const [insuranceCost, setInsuranceCost] = useState<number>(650);
  const [attachedFiles, setAttachedFiles] = useState<string[]>(['Commercial_Invoice_Proforma.pdf', 'Packing_List_Orig.pdf']);

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError(language === 'he' ? 'נא להזין כותרת / תיאור למשלוח היבוא' : 'Please enter a shipment title / description');
      return;
    }
    if (!supplierName.trim()) {
      setError(language === 'he' ? 'נא להזין שם ספק בינלאומי' : 'Please enter international supplier name');
      return;
    }

    const newDossier: ImportDossier = {
      id: `dossier-${Date.now()}`,
      companyId: 'comp-1',
      dossierNumber: dossierNumber.trim() || initialDossierNumber,
      title: title.trim(),
      supplierName: supplierName.trim(),
      originCountry: originCountry.trim(),
      portOfEntry: portOfEntry.trim(),
      status,
      eta,
      billOfLadingNumber: billOfLadingNumber.trim() || 'BL-PENDING',
      vesselFlight: vesselFlight.trim() || 'ZIM / MAERSK VESSEL',
      currency,
      totalGoodsValue: Number(totalGoodsValue) || 0,
      freightCost: Number(freightCost) || 0,
      customsDuty: Number(customsDuty) || 0,
      insuranceCost: Number(insuranceCost) || 0,
      documentsCount: attachedFiles.length || 2,
      documentIds: [],
    };

    onSubmit(newDossier);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const names: string[] = [];
      for (let i = 0; i < files.length; i++) {
        names.push(files[i].name);
      }
      setAttachedFiles(prev => [...prev, ...names]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'he' ? 'פתיחת תיק יבוא חדש' : t.imports.newDossier}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'he' 
                  ? 'הזנת משלוח ימי/אווירי, שטר מטען (B/L), ספק מחו״ל ועלויות פריקה ומכס' 
                  : 'Register a new import shipment, B/L, foreign supplier and landed costs'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            aria-label="סגור חלון"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2 font-medium">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Row 1: Dossier Number & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'מספר תיק יבוא (Dossier #)' : 'Dossier #'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={dossierNumber}
                onChange={e => setDossierNumber(e.target.value)}
                placeholder="IMPORT 2026-00495"
                required
                className="w-full font-mono font-bold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'סטטוס משלוח נוכחי' : 'Shipment Status'}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="in_transit">{language === 'he' ? 'בהפלגה / במעבר ימי (In Transit)' : 'In Maritime Transit'}</option>
                <option value="customs_cleared">{language === 'he' ? 'שוחרר מהמכס בנמל (Customs Cleared)' : 'Customs Cleared (Port)'}</option>
                <option value="draft">{language === 'he' ? 'טיוטת תיק בהכנה (Draft)' : 'Draft'}</option>
                <option value="received">{language === 'he' ? 'נקלט במחסן ארצי (Received)' : 'Received at Warehouse'}</option>
              </select>
            </div>
          </div>

          {/* Row 2: Title / Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'he' ? 'תיאור וכותרת המשלוח' : 'Shipment Title / Description'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={language === 'he' ? 'לדוגמה: יבוא ארונות אמבטיה, כיורים וברזים מאיטליה' : 'e.g. Bathroom Cabinets & Sanitaryware from Italy'}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Row 3: Supplier & Origin Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'ספק בינלאומי (Foreign Supplier)' : 'Supplier Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="למשל: Milano Industrial Chillers SpA / Villeroy & Boch"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'ארץ מקור' : 'Origin Country'}
              </label>
              <select
                value={originCountry}
                onChange={e => setOriginCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="איטליה (Italy)">איטליה (Italy)</option>
                <option value="סין (China)">סין (China)</option>
                <option value="ספרד (Spain)">ספרד (Spain)</option>
                <option value="גרמניה (Germany)">גרמניה (Germany)</option>
                <option value="טורקיה (Turkey)">טורקיה (Turkey)</option>
                <option value="ארה״ב (USA)">ארה״ב (USA)</option>
                <option value="הודו (India)">הודו (India)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Port of Entry & ETA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'נמל פריקה / כניסה' : 'Port of Entry'}
              </label>
              <select
                value={portOfEntry}
                onChange={e => setPortOfEntry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Haifa Port (נמל חיפה)">Haifa Port (נמל חיפה)</option>
                <option value="Ashdod Port (נמל אשדוד)">Ashdod Port (נמל אשדוד)</option>
                <option value="Bay Port Haifa (נמל המפרץ חיפה)">Bay Port Haifa (נמל המפרץ חיפה)</option>
                <option value="South Port Ashdod (נמל הדרום אשדוד)">South Port Ashdod (נמל הדרום אשדוד)</option>
                <option value="TLV Airport Cargo (מסוף מטענים נתב״ג)">TLV Airport Cargo (מסוף מטענים נתב״ג)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'מועד הגעה משוער (ETA)' : 'Estimated Arrival Date (ETA)'}
              </label>
              <input
                type="date"
                value={eta}
                onChange={e => setEta(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Row 5: Bill of Lading & Vessel/Flight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'שטר מטען (Bill of Lading - B/L)' : 'Bill of Lading #'}
              </label>
              <input
                type="text"
                value={billOfLadingNumber}
                onChange={e => setBillOfLadingNumber(e.target.value)}
                placeholder="לדוגמה: MSK-98410294"
                className="w-full font-mono px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'אונייה / קו ספנות / טיסה' : 'Vessel / Carrier / Flight'}
              </label>
              <input
                type="text"
                value={vesselFlight}
                onChange={e => setVesselFlight(e.target.value)}
                placeholder="למשל: CMA CGM BIANCA v.118E / ZIM LUANDA"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Financial Breakdown Section (Landed Costs) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                {language === 'he' ? 'ערך סחורה ועלויות נלוות (Landed Costs)' : 'Goods Value & Shipping Breakdown'}
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                {(['EUR', 'USD', 'ILS'] as const).map(curr => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] transition ${
                      currency === curr 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'he' ? 'ערך סחורה (FOB/CIF)' : 'Goods Value'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={totalGoodsValue}
                    onChange={e => setTotalGoodsValue(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute left-2 top-2 text-[10px] font-mono text-slate-400">
                    {currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'he' ? 'דמי הובלה (Freight)' : 'Freight Cost'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={freightCost}
                    onChange={e => setFreightCost(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute left-2 top-2 text-[10px] font-mono text-slate-400">
                    {currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'he' ? 'מכס ואגרות נמל' : 'Customs & Duties'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={customsDuty}
                    onChange={e => setCustomsDuty(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute left-2 top-2 text-[10px] font-mono text-slate-400">
                    {currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'he' ? 'ביטוח ימי' : 'Insurance'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={insuranceCost}
                    onChange={e => setInsuranceCost(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute left-2 top-2 text-[10px] font-mono text-slate-400">
                    {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Attachment Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'מסמכים מצורפים לתיק (חשבונית ספק, רשימת אריזה, שטר מטען)' : 'Attached Documents (Invoice, Packing List, B/L)'}
              </label>
              <label className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'he' ? 'צרף קובץ נוסף' : 'Attach file'}</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((f, i) => (
                <div 
                  key={i} 
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
                >
                  <Paperclip className="w-3 h-3 text-indigo-500" />
                  <span>{f}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-rose-500 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {language === 'he' ? 'ביטול' : t.imports.cancelButton}
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'he' ? 'פתח תיק יבוא חדש' : t.imports.createButton}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
