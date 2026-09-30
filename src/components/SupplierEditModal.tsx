import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Save, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertCircle,
  Hash,
  CreditCard,
  Layers,
  MapPin,
  Phone,
  Mail,
  Percent
} from 'lucide-react';
import { Supplier, Language } from '../types';

interface SupplierEditModalProps {
  isOpen: boolean;
  supplier: Supplier | null; // null means adding a new supplier
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  onDelete?: (supplierId: string) => void;
  language: Language;
}

export const SupplierEditModal: React.FC<SupplierEditModalProps> = ({
  isOpen,
  supplier,
  onClose,
  onSave,
  onDelete,
  language,
}) => {
  const isHebrew = language === 'he';
  const isFrench = language === 'fr';

  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('ישראל');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState<'ILS' | 'EUR' | 'USD' | 'GBP'>('ILS');
  const [defaultVatRate, setDefaultVatRate] = useState<number>(17);
  const [expenseAccount, setExpenseAccount] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [confidenceScore, setConfidenceScore] = useState<number>(98);
  const [learnedCorrectionsCount, setLearnedCorrectionsCount] = useState<number>(0);
  const [invoiceFormatRegex, setInvoiceFormatRegex] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  // Common expense account suggestions for quick selection
  const commonExpenseAccounts = [
    { label: isHebrew ? '6100 - חומרי גלם ומזון' : '6100 - Raw Materials & Food', value: '6100 - חומרי גלם ומזון' },
    { label: isHebrew ? '6240 - דלק ואנרגיה' : '6240 - Fuel & Energy', value: '6240 - דלק ואנרגיה' },
    { label: isHebrew ? '6400 - רישיונות תוכנה ושירותי IT' : '6400 - Software & IT Services', value: '6400 - רישיונות תוכנה ושירותי IT' },
    { label: isHebrew ? '6250 - ציוד משרדי ומיזוג' : '6250 - Office Equipment & HVAC', value: '6250 - ציוד משרדי ומיזוג' },
    { label: isHebrew ? '6242 - הובלה ושילוח בינלאומי' : '6242 - Shipping & Freight', value: '6242 - הובלה ושילוח בינלאומי' },
  ];

  // Common cost centers
  const commonCostCenters = [
    'CC-IL-OPERATIONS',
    'CC-IL-IT',
    'CC-OPS',
    'CC-IL-FACILITIES',
    'CC-FR-PARIS',
    'CC-MANAGEMENT'
  ];

  // Common payment terms
  const commonPaymentTerms = [
    isHebrew ? 'שוטף + 30' : 'EOM + 30',
    isHebrew ? 'שוטף + 45' : 'EOM + 45',
    isHebrew ? 'שוטף + 60' : 'EOM + 60',
    isHebrew ? 'שוטף + 90' : 'EOM + 90',
    isHebrew ? 'מיידי - שולם' : 'Immediate - Paid',
  ];

  useEffect(() => {
    if (supplier) {
      setName(supplier.name || '');
      setRegistrationNumber(supplier.registrationNumber || '');
      setAddress(supplier.address || '');
      setCity(supplier.city || '');
      setCountry(supplier.country || (isHebrew ? 'ישראל' : 'Israel'));
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setDefaultCurrency(supplier.defaultCurrency || 'ILS');
      setDefaultVatRate(supplier.defaultVatRate ?? 17);
      setExpenseAccount(supplier.expenseAccount || '');
      setCostCenter(supplier.costCenter || 'CC-IL-OPERATIONS');
      setPaymentTerms(supplier.paymentTerms || (isHebrew ? 'שוטף + 30' : 'EOM + 30'));
      setConfidenceScore(supplier.confidenceScore ?? 98);
      setLearnedCorrectionsCount(supplier.learnedCorrectionsCount ?? 0);
      setInvoiceFormatRegex(supplier.invoiceFormatRegex || '');
    } else {
      // Adding new supplier defaults
      setName('');
      setRegistrationNumber('');
      setAddress('');
      setCity('');
      setCountry(isHebrew ? 'ישראל' : 'Israel');
      setPhone('');
      setEmail('');
      setDefaultCurrency('ILS');
      setDefaultVatRate(17);
      setExpenseAccount('6100 - חומרי גלם ומזון');
      setCostCenter('CC-IL-OPERATIONS');
      setPaymentTerms(isHebrew ? 'שוטף + 30' : 'EOM + 30');
      setConfidenceScore(95);
      setLearnedCorrectionsCount(0);
      setInvoiceFormatRegex('');
    }
    setError(null);
    setIsSavedSuccessfully(false);
  }, [supplier, isOpen, isHebrew]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isHebrew ? 'נא להזין שם ספק' : 'Please provide supplier name');
      return;
    }
    if (!registrationNumber.trim()) {
      setError(isHebrew ? 'נא להזין ח.פ / מספר עוסק מורשה' : 'Please provide registration / Tax ID');
      return;
    }

    const updatedSupplier: Supplier = {
      id: supplier?.id || `sup-${Date.now()}`,
      companyId: supplier?.companyId || 'comp-1',
      name: name.trim(),
      registrationNumber: registrationNumber.trim(),
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
      phone: phone.trim(),
      email: email.trim(),
      defaultCurrency,
      defaultVatRate: Number(defaultVatRate),
      expenseAccount: expenseAccount.trim(),
      costCenter: costCenter.trim(),
      paymentTerms: paymentTerms.trim(),
      confidenceScore: Number(confidenceScore),
      learnedCorrectionsCount: Number(learnedCorrectionsCount),
      activeOrdersCount: supplier?.activeOrdersCount || 0,
      totalSpend: supplier?.totalSpend || 0,
      invoiceFormatRegex: invoiceFormatRegex.trim() || undefined,
    };

    setIsSavedSuccessfully(true);
    setTimeout(() => {
      onSave(updatedSupplier);
      onClose();
    }, 400);
  };

  const handleDelete = () => {
    if (!supplier || !onDelete) return;
    const confirmMessage = isHebrew 
      ? `האם אתה בטוח שברצונך למחוק את הספק "${supplier.name}"?` 
      : `Are you sure you want to delete supplier "${supplier.name}"?`;

    if (window.confirm(confirmMessage)) {
      onDelete(supplier.id);
      onClose();
    }
  };

  return (
    <div 
      id="supplier-edit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      style={{ direction: isHebrew ? 'rtl' : 'ltr' }}
    >
      <div 
        id="supplier-edit-modal"
        className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 transition-all"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
              <Building2 className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{supplier ? (isHebrew ? 'עריכת פרטי ספק' : isFrench ? 'Modifier le Fournisseur' : 'Edit Supplier Details') : (isHebrew ? 'הוספת ספק חדש' : isFrench ? 'Nouveau Fournisseur' : 'Add New Supplier')}</span>
                {supplier && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white font-normal">
                    {supplier.registrationNumber}
                  </span>
                )}
              </h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                {supplier 
                  ? (isHebrew ? `עדכון הגדרות חשבונאיות, חשבון הוצאה ומרכזי רווח ב-Priority ERP` : `Update ERP expense mapping, VAT rates, and payment conditions`) 
                  : (isHebrew ? `הזנת ספק חדש לספר הספקים ומערכת ה-ERP` : `Register a new vendor in the directory and ERP engine`)}
              </p>
            </div>
          </div>

          <button
            id="btn-close-supplier-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Section 1: General Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {isHebrew ? 'פרטי זיהוי וספק' : 'General & Identification'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHebrew ? 'שם ספק מלא *' : 'Supplier Full Name *'}
                </label>
                <input
                  id="input-supplier-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isHebrew ? 'לדוגמה: סונול EVI בע״מ' : 'e.g. Sonol EVI Ltd'}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHebrew ? 'מספר עוסק / ח.פ / VAT ID *' : 'Registration No. / VAT ID *'}
                </label>
                <input
                  id="input-supplier-vat"
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="515747814"
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isHebrew ? 'עיר ומדינה' : 'City & Country'}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={isHebrew ? 'נתניה' : 'City'}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={isHebrew ? 'ישראל' : 'Country'}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isHebrew ? 'כתובת מלאה' : 'Full Street Address'}</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isHebrew ? 'הגביש 10, נתניה 4250706' : '10 HaGvish St, Netanya'}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isHebrew ? 'טלפון' : 'Phone'}</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="*2340 / 09-8922222"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isHebrew ? 'אימייל להנה״ח' : 'Accounting Email'}</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@supplier.co.il"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Priority ERP & Accounting Mapping */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {isHebrew ? 'הגדרות חשבונאיות ו-Priority ERP' : 'Accounting & ERP Mapping'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Expense Account */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isHebrew ? 'חשבון הוצאה ב-Priority (Expense Account) *' : 'ERP Expense Account *'}
                  </label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    {isHebrew ? 'קביעת סיווג אוטומטי' : 'Auto-GL Posting'}
                  </span>
                </div>
                <input
                  id="input-supplier-expense-account"
                  type="text"
                  required
                  value={expenseAccount}
                  onChange={(e) => setExpenseAccount(e.target.value)}
                  placeholder={isHebrew ? '6100 - חומרי גלם ומזון' : '6100 - Raw materials'}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                />
                {/* Quick suggestions pills */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 self-center me-1">
                    {isHebrew ? 'נפוצים:' : 'Presets:'}
                  </span>
                  {commonExpenseAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setExpenseAccount(acc.value)}
                      className="text-[10.5px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition border border-slate-200/60 dark:border-slate-700"
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost Center */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isHebrew ? 'מרכז רווח / מחלקה (Cost Center)' : 'Cost Center / Profit Center'}</span>
                </label>
                <input
                  id="input-supplier-cost-center"
                  type="text"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  placeholder="CC-IL-OPERATIONS"
                  className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {commonCostCenters.slice(0, 4).map((cc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCostCenter(cc)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 font-mono"
                    >
                      {cc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHebrew ? 'תנאי תשלום (Payment Terms)' : 'Payment Terms'}
                </label>
                <input
                  id="input-supplier-payment-terms"
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder={isHebrew ? 'שוטף + 30' : 'EOM + 30'}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {commonPaymentTerms.map((pt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPaymentTerms(pt)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHebrew ? 'מטבע ברירת מחדל' : 'Default Currency'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['ILS', 'EUR', 'USD', 'GBP'] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setDefaultCurrency(curr)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        defaultCurrency === curr
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {curr === 'ILS' ? '₪ ILS' : curr === 'EUR' ? '€ EUR' : curr === 'USD' ? '$ USD' : '£ GBP'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default VAT Rate */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isHebrew ? 'שיעור מע״מ ברירת מחדל' : 'Default VAT Rate'}</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[17, 0, 18].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setDefaultVatRate(rate)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        defaultVatRate === rate
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {rate === 17 ? '17% (ישראל)' : rate === 0 ? '0% / פטור' : `${rate}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Machine Learning & Automation Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {isHebrew ? 'מנוע למידה ואוטומציה' : 'Machine Learning & Automation'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHebrew ? 'ציון דיוק במערכת (%)' : 'Confidence Score (%)'}
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={confidenceScore}
                  onChange={(e) => setConfidenceScore(Number(e.target.value))}
                  className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHebrew ? 'כללים שנלמדו מתיקונים' : 'Learned Rules Count'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={learnedCorrectionsCount}
                  onChange={(e) => setLearnedCorrectionsCount(Number(e.target.value))}
                  className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHebrew ? 'תבנית מספר חשבונית (Regex)' : 'Invoice Number Regex'}
                </label>
                <input
                  type="text"
                  value={invoiceFormatRegex}
                  onChange={(e) => setInvoiceFormatRegex(e.target.value)}
                  placeholder="^[0-9]{7,8}$"
                  className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            {supplier && onDelete ? (
              <button
                id="btn-delete-supplier"
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isHebrew ? 'מחק ספק' : 'Delete'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                id="btn-cancel-supplier-edit"
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isHebrew ? 'ביטול' : 'Cancel'}
              </button>
              <button
                id="btn-save-supplier"
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/20 active:scale-95 transition"
              >
                {isSavedSuccessfully ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isHebrew ? 'נשמר בהצלחה!' : 'Saved!'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isHebrew ? 'שמור שינויים' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
