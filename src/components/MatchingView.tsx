import React, { useState } from 'react';
import { GitCompare, AlertTriangle, CheckCircle2, ShoppingCart, PackageCheck, FileText, ArrowRight } from 'lucide-react';
import { InvoiceDocument, PurchaseOrder, GoodsReceipt, Language } from '../types';
import { translations } from '../i18n/translations';

interface MatchingViewProps {
  invoices: InvoiceDocument[];
  purchaseOrders: PurchaseOrder[];
  receipts: GoodsReceipt[];
  language: Language;
  onSelectInvoice: (invoice: InvoiceDocument) => void;
}

export const MatchingView: React.FC<MatchingViewProps> = ({
  invoices,
  purchaseOrders,
  receipts,
  language,
  onSelectInvoice,
}) => {
  const t = translations[language];
  const [filter, setFilter] = useState<'all' | 'matched' | 'variance' | 'missing'>('all');

  const matchedInvoices = invoices.filter(inv => {
    if (filter === 'matched') return inv.threeWayMatch.status === 'matched_100';
    if (filter === 'variance') return inv.threeWayMatch.status === 'variance_detected';
    if (filter === 'missing') return inv.threeWayMatch.status === 'po_missing' || inv.threeWayMatch.status === 'receipt_missing';
    return true;
  });

  return (
    <div id="matching-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t.matching.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.matching.subtitle}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Tous les Rapprochements ({invoices.length})
        </button>
        <button
          onClick={() => setFilter('variance')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            filter === 'variance' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Écarts Détectés
        </button>
        <button
          onClick={() => setFilter('matched')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
            filter === 'matched' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Concordance 100%
        </button>
      </div>

      {/* Matching Cards */}
      <div className="space-y-4">
        {matchedInvoices.map(invoice => {
          const po = purchaseOrders.find(p => p.poNumber === invoice.purchaseOrderNumber);
          const rc = receipts.find(r => r.poNumber === invoice.purchaseOrderNumber);

          return (
            <div
              key={invoice.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4"
            >
              {/* Top Bar of Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {invoice.supplierName}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Facture N° {invoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Émise le {invoice.issueDate} • Montant : {invoice.totalAmount.toLocaleString()} {invoice.currency}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    invoice.threeWayMatch.status === 'matched_100'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      : invoice.threeWayMatch.status === 'variance_detected'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {invoice.threeWayMatch.status === 'matched_100' ? t.matching.statusMatch :
                     invoice.threeWayMatch.status === 'variance_detected' ? t.matching.statusVariance :
                     t.matching.statusMissingPo}
                  </span>

                  <button
                    onClick={() => onSelectInvoice(invoice)}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition"
                  >
                    <span>Examiner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3 Pillars Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Pillar 1: Invoice */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>{t.matching.invoiceTitle}</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white pt-1">
                    {invoice.lines.reduce((acc, l) => acc + l.quantity, 0)} Unités facturées
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    TTC: {invoice.totalAmount.toLocaleString()} {invoice.currency}
                  </div>
                </div>

                {/* Pillar 2: Purchase Order */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <ShoppingCart className="w-4 h-4 text-blue-500" />
                    <span>{t.matching.poTitle}</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white pt-1">
                    {po ? po.lines.reduce((acc, l) => acc + l.orderedQuantity, 0) : 0} Unités commandées
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    Réf PO: {invoice.purchaseOrderNumber || 'Non renseigné'}
                  </div>
                </div>

                {/* Pillar 3: Goods Receipt */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <PackageCheck className="w-4 h-4 text-emerald-500" />
                    <span>{t.matching.receiptTitle}</span>
                  </div>
                  <div className={`text-sm font-bold font-mono pt-1 ${
                    invoice.threeWayMatch.quantityVariance && invoice.threeWayMatch.quantityVariance > 0
                      ? 'text-rose-600'
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {rc ? rc.lines.reduce((acc, l) => acc + l.quantityReceived, 0) : 0} Unités reçues
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    N° BL: {invoice.receiptNumber || 'En attente réception'}
                  </div>
                </div>
              </div>

              {/* Anomaly notice if any */}
              {invoice.threeWayMatch.discrepancies.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Écarts constatés à régulariser :
                  </div>
                  {invoice.threeWayMatch.discrepancies.map((d, i) => (
                    <div key={i} className="ms-5">• {d}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
