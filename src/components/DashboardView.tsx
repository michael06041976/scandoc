import React from 'react';
import { 
  FileText, 
  FileCheck,
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  Cpu, 
  Database,
  ArrowRight,
  Sparkles,
  Zap,
  Timer
} from 'lucide-react';
import { InvoiceDocument, Language } from '../types';
import { translations } from '../i18n/translations';

interface DashboardViewProps {
  invoices: InvoiceDocument[];
  language: Language;
  onSelectInvoice: (invoice: InvoiceDocument) => void;
  onGoToInbox: (filter?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  language,
  onSelectInvoice,
  onGoToInbox,
}) => {
  const t = translations[language];

  // Calculated metrics
  const totalVolumeILS = invoices.reduce((acc, inv) => {
    if (inv.currency === 'ILS') return acc + inv.totalAmount;
    if (inv.currency === 'USD') return acc + inv.totalAmount * 3.7;
    if (inv.currency === 'EUR') return acc + inv.totalAmount * 4.0;
    return acc + inv.totalAmount;
  }, 0);

  const needsAttentionList = invoices.filter(inv => inv.status === 'needs_attention' || inv.duplicateRisk === 'high' || !inv.mathCheck.passed);
  const pendingApprovalsList = invoices.filter(inv => inv.status === 'pending_approval');
  const pendingApprovalsCount = pendingApprovalsList.length > 0 
    ? pendingApprovalsList.length 
    : invoices.filter(inv => inv.status === 'needs_attention').length;

  const readyForErpList = invoices.filter(inv => inv.status === 'ready_for_erp');
  const postedToErpList = invoices.filter(inv => inv.status === 'posted_to_erp');
  const duplicateAlerts = invoices.filter(inv => inv.duplicateRisk === 'high' || inv.duplicateRisk === 'possible');

  const averageConfidence = Math.round(
    invoices.reduce((acc, inv) => acc + inv.overallConfidence, 0) / (invoices.length || 1)
  );

  return (
    <div id="dashboard-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.dashboard.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.dashboard.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-goto-inbox"
            onClick={() => onGoToInbox('all')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-2xs"
          >
            <span>{t.nav.inbox}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of KPI Summary Cards */}
      <div 
        id="kpi-summary-grid" 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* KPI 1: Total Invoices Processed */}
        <div 
          id="kpi-total-invoices-processed"
          onClick={() => onGoToInbox('all')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                Total Invoices Processed
              </span>
              {language !== 'en' && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {language === 'he' ? 'סה״כ חשבוניות שעובדו' : 'Total factures traitées'}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {invoices.length}
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium">
              (₪{Math.round(totalVolumeILS).toLocaleString()})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
            <TrendingUp className="w-3 h-3" />
            <span>+18.4% vs mois dernier • 100% numérisées</span>
          </div>
        </div>

        {/* KPI 2: Pending Approvals Count */}
        <div 
          id="kpi-pending-approvals-count"
          onClick={() => onGoToInbox(pendingApprovalsList.length > 0 ? 'pending_approval' : 'needs_attention')}
          className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs hover:border-amber-300 dark:hover:border-amber-800 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 group-hover:text-amber-900 transition">
                Pending Approvals Count
              </span>
              {language !== 'en' && (
                <span className="text-[10px] text-amber-600/80 dark:text-amber-400/70">
                  {language === 'he' ? 'אישורים ממתינים לחתימה' : 'Approbations en attente'}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-300 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono">
              {pendingApprovalsCount}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              en attente de visa
            </span>
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>{needsAttentionList.length} exceptions requièrent attention</span>
          </div>
        </div>

        {/* KPI 3: Average Processing Time */}
        <div 
          id="kpi-average-processing-time"
          className="p-4 rounded-xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/30 dark:bg-violet-950/20 shadow-2xs hover:border-violet-300 dark:hover:border-violet-800 transition cursor-default"
        >
          <div className="flex items-center justify-between text-violet-700 dark:text-violet-400">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-violet-800 dark:text-violet-300">
                Average Processing Time
              </span>
              {language !== 'en' && (
                <span className="text-[10px] text-violet-600/80 dark:text-violet-400/70">
                  {language === 'he' ? 'זמן עיבוד ממוצע למסמך' : 'Temps moyen de traitement'}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/60 flex items-center justify-center text-violet-600 dark:text-violet-300 flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-violet-700 dark:text-violet-300 font-mono">
              1.8s
            </span>
            <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">
              / document
            </span>
          </div>
          <div className="text-[11px] text-violet-600 dark:text-violet-400 font-medium mt-1.5 flex items-center gap-1">
            <Timer className="w-3 h-3" />
            <span>⚡ 84% plus rapide que la saisie manuelle</span>
          </div>
        </div>

        {/* KPI 4: ERP Sync Success Rate */}
        <div 
          id="kpi-erp-sync-success-rate"
          onClick={() => onGoToInbox('ready_erp')}
          className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-800 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 group-hover:text-emerald-900 transition">
                ERP Sync Success Rate
              </span>
              {language !== 'en' && (
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70">
                  {language === 'he' ? 'שיעור הצלחת סנכרון ERP' : 'Taux de réussite synchro ERP'}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
              99.4%
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Priority OData
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
            <Database className="w-3 h-3 text-emerald-500" />
            <span>{postedToErpList.length + readyForErpList.length} prêtes/postées • 0 échecs</span>
          </div>
        </div>
      </div>

      {/* AI Performance & Confidence Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="absolute end-0 top-0 bottom-0 opacity-10 flex items-center pe-6 pointer-events-none">
          <Cpu className="w-48 h-48" />
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-1 border-b md:border-b-0 md:border-e border-indigo-800/80 pb-4 md:pb-0 pe-4">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Moteur IA & Double Contrôle
            </div>
            <div className="text-3xl font-extrabold mt-2 tracking-tight">
              {averageConfidence}%
            </div>
            <div className="text-xs text-indigo-200/80 mt-1">
              Score moyen de précision OCR & Vision multilingue
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-indigo-300 font-medium">{t.dashboard.autoValidationRate}</div>
            <div className="text-xl font-bold">84%</div>
            <div className="w-full bg-indigo-950 rounded-full h-1.5 mt-1 border border-indigo-700/50">
              <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: '84%' }}></div>
            </div>
            <div className="text-[10px] text-indigo-300/70">Zéro intervention humaine requise</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-indigo-300 font-medium">{t.dashboard.threeWayMatchRate}</div>
            <div className="text-xl font-bold">92.5%</div>
            <div className="w-full bg-indigo-950 rounded-full h-1.5 mt-1 border border-indigo-700/50">
              <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '92.5%' }}></div>
            </div>
            <div className="text-[10px] text-indigo-300/70">Facture = Commande (PO) = Réception (BL)</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-indigo-300 font-medium">{t.dashboard.duplicateAlerts}</div>
            <div className="text-xl font-bold text-amber-300">{duplicateAlerts.length} Détectés</div>
            <div className="w-full bg-indigo-950 rounded-full h-1.5 mt-1 border border-indigo-700/50">
              <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="text-[10px] text-indigo-300/70">Blocage préventif des paiements en double</div>
          </div>
        </div>
      </div>

      {/* Two columns: Needs Attention Focus & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Exceptions to address immediately */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Boîte d'Exceptions : "Needs Attention"
              </h3>
            </div>
            <button
              onClick={() => onGoToInbox('needs_attention')}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Tout voir ({needsAttentionList.length})
            </button>
          </div>

          <div className="space-y-2">
            {needsAttentionList.map(invoice => (
              <div
                key={invoice.id}
                onClick={() => onSelectInvoice(invoice)}
                className="p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-white dark:bg-slate-900 hover:shadow-sm cursor-pointer transition flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {invoice.supplierName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {invoice.invoiceNumber}
                    </span>
                  </div>

                  {/* Discrepancy highlights */}
                  {!invoice.mathCheck.passed && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      ⚠️ Incohérence calcul : TVA/Total ne correspondent pas
                    </div>
                  )}
                  {invoice.duplicateRisk === 'high' && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      🛑 Doublon très probable avec facture existante
                    </div>
                  )}
                  {invoice.threeWayMatch.status === 'variance_detected' && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      📦 Écart 3-Way : Quantité facturée ≠ Quantité reçue
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400">
                    Reçu le {invoice.receivedAt} • Assigné à {invoice.assignedUser}
                  </div>
                </div>

                <div className="text-end flex-shrink-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {invoice.totalAmount.toLocaleString()} {invoice.currency}
                  </div>
                  <button className="mt-2 text-[10px] font-semibold px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition">
                    Résoudre
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Ingestion Stream */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.dashboard.recentDocuments}
              </h3>
            </div>
            <button
              onClick={() => onGoToInbox('all')}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ouvrir Inbox
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map(invoice => (
                <div
                  key={invoice.id}
                  onClick={() => onSelectInvoice(invoice)}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {invoice.supplierName}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {invoice.issueDate} • Réf PO: {invoice.purchaseOrderNumber || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Confidence Pill */}
                    <div className="hidden sm:block text-end">
                      <div className="text-[10px] text-slate-400 font-medium">Confiance IA</div>
                      <div className={`text-xs font-semibold ${
                        invoice.overallConfidence >= 95 ? 'text-emerald-600' :
                        invoice.overallConfidence >= 80 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {invoice.overallConfidence}%
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="text-end min-w-[90px]">
                      <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {invoice.totalAmount.toLocaleString()} {invoice.currency}
                      </div>
                      <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded-full uppercase ${
                        invoice.status === 'posted_to_erp' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        invoice.status === 'ready_for_erp' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                        invoice.status === 'needs_attention' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {t.status[invoice.status]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
