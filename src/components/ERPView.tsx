import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Send, ExternalLink, ShieldCheck } from 'lucide-react';
import { InvoiceDocument, Language } from '../types';
import { translations } from '../i18n/translations';

interface ERPViewProps {
  invoices: InvoiceDocument[];
  language: Language;
  onSyncAll: () => void;
  isSyncing: boolean;
}

export const ERPView: React.FC<ERPViewProps> = ({
  invoices,
  language,
  onSyncAll,
  isSyncing,
}) => {
  const t = translations[language];
  const [priorityEndpoint, setPriorityEndpoint] = useState('https://priority.cloud/odata/v4/ambat_line');
  const [priorityCompany, setPriorityCompany] = useState('AMBAT_LINE_LTD');

  const syncedInvoices = invoices.filter(inv => inv.erpStatus === 'synced');
  const readyInvoices = invoices.filter(inv => inv.status === 'ready_for_erp' || inv.status === 'approved');

  return (
    <div id="erp-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>{t.erp.title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.erp.subtitle}
          </p>
        </div>

        <button
          onClick={onSyncAll}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>
            {isSyncing 
              ? (language === 'he' ? 'סנכרון OData בעיצומו...' : 'Synchronisation en cours...') 
              : t.erp.syncAll}
          </span>
        </button>
      </div>

      {/* Gateway Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">{t.erp.connectorStatus}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            Priority OData v4 REST API
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate">
            {priorityEndpoint}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="text-xs text-slate-500 font-semibold">{t.erp.postedInvoicesTitle}</div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {syncedInvoices.length}
          </div>
          <div className="text-[11px] text-slate-400">{t.erp.postedInvoicesSubtitle}</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="text-xs text-slate-500 font-semibold">{t.erp.readyToPostTitle}</div>
          <div className="text-2xl font-bold font-mono text-indigo-600">
            {readyInvoices.length}
          </div>
          <div className="text-[11px] text-slate-400">{t.erp.readyToPostSubtitle}</div>
        </div>
      </div>

      {/* Live Synchronization Log Table */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {t.erp.auditJournal}
        </h3>

        <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold">
                <th className="p-3 text-start">{t.erp.colSupplier}</th>
                <th className="p-3 text-start">{t.erp.colDocNum}</th>
                <th className="p-3 text-start">{t.erp.colPriorityId}</th>
                <th className="p-3 text-end">{t.erp.colAmount}</th>
                <th className="p-3 text-center">{t.erp.colStatus}</th>
                <th className="p-3 text-end">{t.erp.colTimestamp}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    {inv.supplierName}
                  </td>
                  <td className="p-3 font-mono">{inv.invoiceNumber}</td>
                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {inv.erpDocumentId || '—'}
                  </td>
                  <td className="p-3 text-end font-mono">
                    {inv.totalAmount.toLocaleString()} {inv.currency}
                  </td>
                  <td className="p-3 text-center">
                    {inv.erpStatus === 'synced' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        {language === 'he' ? 'נקלט בפריוריטי' : 'Publié dans Priority'}
                      </span>
                    ) : inv.erpStatus === 'failed' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        <AlertCircle className="w-3 h-3" />
                        {language === 'he' ? 'נחסם (חשד כפילות)' : 'Bloqué (Doublon)'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {language === 'he' ? 'ממתין לשידור' : 'En attente publication'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-end text-slate-400 font-mono">
                    {inv.erpSyncedAt || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
