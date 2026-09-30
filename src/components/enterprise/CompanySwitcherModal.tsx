import React, { useState } from 'react';
import { Building2, Plus, Copy, Trash2, Check, Edit, X, Globe, Phone, Mail } from 'lucide-react';
import { enterpriseConfigService } from '../../services/enterpriseConfigService';
import { CompanyProfileSettings } from '../../types/enterprise';

interface CompanySwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: CompanyProfileSettings[];
  currentCompanyId: string;
  onActionComplete: (msg: string) => void;
}

export const CompanySwitcherModal: React.FC<CompanySwitcherModalProps> = ({
  isOpen,
  onClose,
  companies,
  currentCompanyId,
  onActionComplete,
}) => {
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyProfileSettings | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    tradeName: '',
    taxRegistrationNumber: '',
    vatNumber: '',
    country: 'ישראל',
    city: 'תל אביב',
    street: 'דרך מנחם בגין',
    streetNumber: '132',
    phonePrimary: '03-0000000',
    emailAccounting: '',
    defaultCurrency: 'ILS' as 'ILS' | 'EUR' | 'USD' | 'GBP',
    erpType: 'Priority' as 'Priority' | 'SAP' | 'NetSuite' | 'Generic_REST',
    erpCompanyCode: '',
  });

  if (!isOpen) return null;

  const handleSelectCompany = (id: string) => {
    enterpriseConfigService.setCurrentCompany(id);
    onActionComplete(`הקשר החברה הפעילה שונה בהצלחה`);
    onClose();
  };

  const handleDuplicate = (id: string, name: string) => {
    const cloned = enterpriseConfigService.duplicateCompany(id);
    if (cloned) {
      onActionComplete(`החברה "${name}" שוכפלה בהצלחה`);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`האם אתה בטוח שברצונך להעביר את חברת "${name}" לסל המחזור?`)) {
      enterpriseConfigService.softDeleteCompany(id, 'מחיקה על ידי מנהל מערכת');
      onActionComplete(`החברה "${name}" הועברה לסל המחזור`);
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.taxRegistrationNumber) return;

    if (editingCompany) {
      enterpriseConfigService.updateCompany(editingCompany.id, {
        ...formData,
      });
      onActionComplete(`פרטי חברת "${formData.name}" עודכנו בהצלחה`);
      setEditingCompany(null);
    } else {
      const created = enterpriseConfigService.addCompany({
        ...formData,
      });
      onActionComplete(`חברת "${created.name}" נוספה בהצלחה`);
      setIsAddingCompany(false);
    }

    // Reset form
    setFormData({
      name: '',
      tradeName: '',
      taxRegistrationNumber: '',
      vatNumber: '',
      country: 'ישראל',
      city: 'תל אביב',
      street: 'דרך מנחם בגין',
      streetNumber: '132',
      phonePrimary: '03-0000000',
      emailAccounting: '',
      defaultCurrency: 'ILS',
      erpType: 'Priority',
      erpCompanyCode: '',
    });
  };

  const openEditModal = (comp: CompanyProfileSettings) => {
    setEditingCompany(comp);
    setFormData({
      name: comp.name,
      tradeName: comp.tradeName,
      taxRegistrationNumber: comp.taxRegistrationNumber,
      vatNumber: comp.vatNumber,
      country: comp.country,
      city: comp.city,
      street: comp.street,
      streetNumber: comp.streetNumber,
      phonePrimary: comp.phonePrimary,
      emailAccounting: comp.emailAccounting,
      defaultCurrency: comp.defaultCurrency,
      erpType: comp.erpType,
      erpCompanyCode: comp.erpCompanyCode,
    });
    setIsAddingCompany(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-900/50">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                ניהול חברות וישויות ארגוניות (Multi-Company Hub)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                מעבר מהיר בין חברות, הגדרת ח.פ / מע״מ, שנת מס וממשקי ERP עצמאיים לכל חברה
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingCompany && (
              <button
                onClick={() => {
                  setEditingCompany(null);
                  setIsAddingCompany(true);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                הוסף חברה חדשה
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isAddingCompany ? (
            <form onSubmit={handleSaveCompany} className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingCompany ? `עריכת חברה: ${editingCompany.name}` : 'הוספת חברה חדשה בארגון'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingCompany(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  חזור לרשימת חברות
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    שם החברה הרשמי (Legal Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="למשל: טקלוג׳יקס ישראל בע״מ"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    שם מסחרי / כינוי (Trade Name)
                  </label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="TechLogix Solutions"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    מספר חברה / ח.פ (Registration No.) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.taxRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="514987654"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    מספר עוסק מורשה / מע״מ (VAT ID)
                  </label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="514987654"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    מדינה
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    עיר
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    מטבע ראשי לחברה
                  </label>
                  <select
                    value={formData.defaultCurrency}
                    onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ILS">שקל חדש (₪ ILS)</option>
                    <option value="EUR">אירו (€ EUR)</option>
                    <option value="USD">דולר ארה״ב ($ USD)</option>
                    <option value="GBP">פאונד (£ GBP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    מערכת ERP מקושרת
                  </label>
                  <select
                    value={formData.erpType}
                    onChange={(e) => setFormData({ ...formData, erpType: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Priority">Priority ERP (OData API)</option>
                    <option value="SAP">SAP Business One (Service Layer)</option>
                    <option value="NetSuite">Oracle NetSuite (REST Web Services)</option>
                    <option value="Generic_REST">Custom Webhook / REST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    קוד חברה ב-ERP
                  </label>
                  <input
                    type="text"
                    value={formData.erpCompanyCode}
                    onChange={(e) => setFormData({ ...formData, erpCompanyCode: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="למשל: comp_il_prod"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    אימייל מחלקת חשבונות (AP)
                  </label>
                  <input
                    type="email"
                    value={formData.emailAccounting}
                    onChange={(e) => setFormData({ ...formData, emailAccounting: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="invoices@company.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddingCompany(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  {editingCompany ? 'שמור שינויים' : 'צור חברה'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((comp) => {
                const isSelected = comp.id === currentCompanyId;
                return (
                  <div
                    key={comp.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-500 dark:border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                            {comp.name.substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                              {comp.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ח.פ: {comp.taxRegistrationNumber}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3" />
                            נבחרה
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectCompany(comp.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-md transition-colors"
                          >
                            בחר
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-slate-400">מדינה ועיר:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{comp.country}, {comp.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">מטבע בסיס:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{comp.defaultCurrency} ({comp.defaults?.vatRatePercent || 17}% מע״מ)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">ממשק ERP:</span>
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{comp.erpType} ({comp.erpCompanyCode})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">מספר אנשי קשר:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{comp.contacts?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-xs">
                      <button
                        onClick={() => openEditModal(comp)}
                        className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        ערוך
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicate(comp.id, comp.name)}
                          title="שכפל חברה"
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {companies.length > 1 && (
                          <button
                            onClick={() => handleDelete(comp.id, comp.name)}
                            title="מחק לסל מחזור"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
