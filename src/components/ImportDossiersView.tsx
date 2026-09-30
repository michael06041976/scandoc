import React, { useState } from 'react';
import { 
  Ship, 
  Anchor, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Globe, 
  ArrowRight, 
  ShieldCheck,
  Check,
  Upload,
  Calendar,
  Layers,
  ArrowUpRight,
  Send,
  Package
} from 'lucide-react';
import { ImportDossier, Language } from '../types';
import { translations } from '../i18n/translations';
import { NewImportDossierModal } from './NewImportDossierModal';

interface ImportDossiersViewProps {
  dossiers: ImportDossier[];
  language: Language;
  onAddDossier?: (dossier: ImportDossier) => void;
}

export const ImportDossiersView: React.FC<ImportDossiersViewProps> = ({
  dossiers: initialDossiers,
  language,
  onAddDossier,
}) => {
  const t = translations[language];
  const [dossiersList, setDossiersList] = useState<ImportDossier[]>(initialDossiers);
  const [selectedDossier, setSelectedDossier] = useState<ImportDossier | null>(initialDossiers[0] || null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLandedCostsSyncing, setIsLandedCostsSyncing] = useState(false);

  // Status labels mapping
  const getStatusLabel = (status: ImportDossier['status']) => {
    switch (status) {
      case 'customs_cleared':
        return t.imports.statusCustomsCleared;
      case 'in_transit':
        return t.imports.statusInTransit;
      case 'draft':
        return t.imports.statusDraft;
      case 'received':
        return t.imports.statusReceived;
      case 'closed':
        return t.imports.statusClosed;
      default:
        return status;
    }
  };

  const getStatusColor = (status: ImportDossier['status']) => {
    switch (status) {
      case 'customs_cleared':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'received':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
      case 'draft':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const handleCreateDossier = (newDossier: ImportDossier) => {
    setDossiersList(prev => [newDossier, ...prev]);
    setSelectedDossier(newDossier);
    if (onAddDossier) {
      onAddDossier(newDossier);
    }
    setNotification(
      language === 'he' 
        ? `תיק יבוא ${newDossier.dossierNumber} נפתח בהצלחה ונוסף לרשימה!` 
        : `Import dossier ${newDossier.dossierNumber} created successfully!`
    );
    setTimeout(() => setNotification(null), 4500);
  };

  const handleSyncLandedCosts = () => {
    setIsLandedCostsSyncing(true);
    setTimeout(() => {
      setIsLandedCostsSyncing(false);
      setNotification(
        language === 'he'
          ? `תחשיב עלויות נלוות (Landed Costs) שודר לפריוריטי עבור תיק ${selectedDossier?.dossierNumber}!`
          : `Landed costs calculation posted to Priority ERP!`
      );
      setTimeout(() => setNotification(null), 4500);
    }, 1200);
  };

  return (
    <div id="import-dossiers-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button 
            type="button"
            onClick={() => setNotification(null)}
            className="text-[11px] text-emerald-600 hover:underline"
          >
            סגור
          </button>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Ship className="w-5 h-5 text-indigo-600" />
            <span>{t.imports.title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.imports.subtitle}
          </p>
        </div>

        {/* Action button: opens the New Import Dossier Modal */}
        <button 
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer active:scale-95"
          id="btn-new-import-dossier"
        >
          <Plus className="w-4 h-4" />
          <span>{t.imports.newDossier}</span>
        </button>
      </div>

      {/* Grid of Dossiers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: List of Dossiers */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>{language === 'he' ? 'רשימת תיקי יבוא פעילים' : 'Active Import Dossiers'}</span>
            <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {dossiersList.length}
            </span>
          </div>

          {dossiersList.map(dossier => {
            const isSelected = selectedDossier?.id === dossier.id;
            return (
              <div
                key={dossier.id}
                onClick={() => setSelectedDossier(dossier)}
                className={`p-4 rounded-2xl border cursor-pointer transition space-y-2.5 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    {dossier.dossierNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(dossier.status)}`}>
                    {getStatusLabel(dossier.status)}
                  </span>
                </div>

                <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                  {dossier.title}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[200px]">
                    {t.imports.port}: {dossier.portOfEntry}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {dossier.totalGoodsValue.toLocaleString()} {dossier.currency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Dossier Document Bundle (Liasse Documentaire) */}
        {selectedDossier && (
          <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-5">
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t.imports.dossierNo}: {selectedDossier.dossierNumber}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(selectedDossier.status)}`}>
                      {getStatusLabel(selectedDossier.status)}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                    {selectedDossier.title}
                  </div>
                </div>

                <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                  {t.imports.eta}: {selectedDossier.eta}
                </span>
              </div>

              <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-2">
                <span>{t.imports.supplier}: <strong className="text-slate-700 dark:text-slate-200">{selectedDossier.supplierName}</strong></span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>{t.imports.originCountry}: <strong>{selectedDossier.originCountry}</strong></span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>{t.imports.port}: <strong>{selectedDossier.portOfEntry}</strong></span>
              </div>
            </div>

            {/* Maritime & Cost Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">{t.imports.blNumber}</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 truncate">{selectedDossier.billOfLadingNumber}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">{t.imports.vessel}</div>
                <div className="font-medium text-slate-900 dark:text-white mt-0.5 truncate">{selectedDossier.vesselFlight}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">{t.imports.freight}</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedDossier.freightCost.toLocaleString()} {selectedDossier.currency}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">{t.imports.customs}</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedDossier.customsDuty.toLocaleString()} {selectedDossier.currency}
                </div>
              </div>
            </div>

            {/* Document Bundle Checklist (Liasse Documentaire) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t.imports.bundleTitle}
                </h4>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'he' ? '5 מתוך 5 מסמכים מאומתים' : '5 of 5 documents verified'}</span>
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                
                {/* 1. Commercial Invoice */}
                <div className="p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {t.imports.commercialInvoice}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {t.imports.validatedOcr}
                  </span>
                </div>

                {/* 2. Bill of Lading */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {t.imports.billOfLadingDoc} ({selectedDossier.billOfLadingNumber})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {t.imports.indexed}
                  </span>
                </div>

                {/* 3. Packing List */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {t.imports.packingList}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {t.imports.conforme}
                  </span>
                </div>

                {/* 4. Freight Invoice */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {t.imports.freightInvoice} ({selectedDossier.vesselFlight})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {t.imports.linkedErp}
                  </span>
                </div>

                {/* 5. Customs Clearance */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {t.imports.customsClearance}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {t.imports.paid}
                  </span>
                </div>

              </div>
            </div>

            {/* Bottom Actions for Selected Dossier */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="text-slate-500 text-[11px]">
                {language === 'he' ? 'ערך סחורה כולל עלויות נלוות (CIF):' : 'Total Landed Value (CIF):'}{' '}
                <strong className="font-mono text-slate-900 dark:text-white text-xs">
                  {(selectedDossier.totalGoodsValue + selectedDossier.freightCost + selectedDossier.customsDuty + selectedDossier.insuranceCost).toLocaleString()} {selectedDossier.currency}
                </strong>
              </div>

              <button
                type="button"
                onClick={handleSyncLandedCosts}
                disabled={isLandedCostsSyncing}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isLandedCostsSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isLandedCostsSyncing 
                    ? (language === 'he' ? 'משדר לפריוריטי...' : 'Posting...') 
                    : (language === 'he' ? 'שדר עלויות יבוא (Landed Costs) לפריוריטי' : 'Post Landed Costs to Priority')}
                </span>
              </button>
            </div>

          </div>
        )}
      </div>

      {/* New Import Dossier Modal */}
      <NewImportDossierModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateDossier}
        language={language}
      />

    </div>
  );
};
