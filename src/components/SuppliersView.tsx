import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Sparkles, 
  Pencil, 
  Building2, 
  Phone, 
  Mail, 
  CheckCircle2, 
  FileText,
  MapPin,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Supplier, Language } from '../types';
import { translations } from '../i18n/translations';
import { SupplierEditModal } from './SupplierEditModal';

interface SuppliersViewProps {
  suppliers: Supplier[];
  language: Language;
  onSelectSupplier?: (supplier: Supplier) => void;
  onUpdateSupplier?: (supplier: Supplier) => void;
  onAddSupplier?: (supplier: Supplier) => void;
  onDeleteSupplier?: (supplierId: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  language,
  onSelectSupplier,
  onUpdateSupplier,
  onAddSupplier,
  onDeleteSupplier,
}) => {
  const t = translations[language];
  const isHebrew = language === 'he';

  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.registrationNumber.includes(searchTerm) ||
    (s.city && s.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.expenseAccount && s.expenseAccount.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.costCenter && s.costCenter.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsEditModalOpen(true);
    if (onSelectSupplier) onSelectSupplier(supplier);
  };

  const handleOpenAdd = () => {
    setSelectedSupplier(null);
    setIsEditModalOpen(true);
  };

  const handleSaveSupplier = (savedSupplier: Supplier) => {
    if (selectedSupplier) {
      if (onUpdateSupplier) onUpdateSupplier(savedSupplier);
      showToast(isHebrew ? `פרטי הספק "${savedSupplier.name}" עודכנו בהצלחה` : `Supplier "${savedSupplier.name}" updated successfully`);
    } else {
      if (onAddSupplier) onAddSupplier(savedSupplier);
      showToast(isHebrew ? `הספק "${savedSupplier.name}" נוסף בהצלחה לספר הספקים` : `Supplier "${savedSupplier.name}" added successfully`);
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (onDeleteSupplier) {
      onDeleteSupplier(supplierId);
      showToast(isHebrew ? 'הספק נמחק בהצלחה' : 'Supplier deleted successfully');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div id="suppliers-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 end-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.suppliers.title}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
              {suppliers.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.suppliers.subtitle}
          </p>
        </div>

        <button 
          id="btn-add-supplier"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.suppliers.addSupplier}</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-suppliers"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.suppliers.searchSupplier}
            className="w-full text-xs ps-9 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span>{isHebrew ? 'טיפ: לחץ על כרטיס ספק או על כפתור "עריכה" כדי לעדכן נתונים, חשבון הוצאה ותנאי תשלום' : 'Tip: Click on a supplier card or "Edit" to modify expense account, VAT & terms'}</span>
        </div>
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {isHebrew ? 'לא נמצאו ספקים תואמים לחיפוש' : 'No matching suppliers found'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isHebrew ? 'נסה לחפש לפי שם, ח.פ, או הוסף ספק חדש' : 'Try searching by name or Tax ID, or add a new supplier'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.suppliers.addSupplier}</span>
          </button>
        </div>
      )}

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(sup => (
          <div
            key={sup.id}
            id={`supplier-card-${sup.id}`}
            onClick={() => handleOpenEdit(sup)}
            className="group relative p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer space-y-3"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {sup.name}
                  </h3>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  ח.פ / VAT : {sup.registrationNumber}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Confidence Badge */}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {sup.confidenceScore}% Précision
                </span>

                {/* Direct Edit Button */}
                <button
                  id={`btn-edit-supplier-${sup.id}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(sup);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/80 transition flex items-center gap-1 text-[11px] font-medium border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                  title={isHebrew ? 'עריכת פרטי ספק' : 'Edit Supplier'}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">{isHebrew ? 'עריכה' : 'Edit'}</span>
                </button>
              </div>
            </div>

            {/* Info Items */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">{t.suppliers.colAccount}:</span>
                <span className="font-medium truncate max-w-[190px] text-slate-800 dark:text-slate-200" title={sup.expenseAccount}>
                  {sup.expenseAccount || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">{t.suppliers.colCostCenter}:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{sup.costCenter || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">{t.suppliers.colTerms}:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{sup.paymentTerms || '-'}</span>
              </div>
            </div>

            {/* Contact / Location Meta (if available) */}
            {(sup.city || sup.phone || sup.email) && (
              <div className="flex items-center gap-3 text-[10.5px] text-slate-500 dark:text-slate-400 truncate pt-0.5">
                {sup.city && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{sup.city}</span>
                  </span>
                )}
                {sup.phone && (
                  <span className="flex items-center gap-1 truncate">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-mono">{sup.phone}</span>
                  </span>
                )}
                {sup.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </span>
                )}
              </div>
            )}

            {/* Machine Learning Rules Pill */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{sup.learnedCorrectionsCount} {isHebrew ? 'כללים שנלמדו' : 'règles apprises'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Volume: {sup.totalSpend ? sup.totalSpend.toLocaleString() : '0'} {sup.defaultCurrency || 'ILS'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit & Add Supplier Modal */}
      <SupplierEditModal
        isOpen={isEditModalOpen}
        supplier={selectedSupplier}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSupplier(null);
        }}
        onSave={handleSaveSupplier}
        onDelete={handleDeleteSupplier}
        language={language}
      />
    </div>
  );
};
