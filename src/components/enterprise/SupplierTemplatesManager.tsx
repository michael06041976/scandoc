import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  RefreshCw, 
  Play, 
  Hash, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Check, 
  Terminal,
  ExternalLink,
  Info,
  Clock,
  Zap,
  Sliders,
  Database,
  Code
} from 'lucide-react';
import { supplierTemplateEngine, initialSupplierTemplates } from '../../services/supplierTemplateEngine';
import { SupplierInvoiceTemplate, AgentExecutionStep, InboundEmailMessage } from '../../types';

export const SupplierTemplatesManager: React.FC = () => {
  const [templates, setTemplates] = useState<SupplierInvoiceTemplate[]>(() => supplierTemplateEngine.getTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<SupplierInvoiceTemplate | null>(templates[0] || null);

  // Agent execution runner state
  const [selectedPresetEmail, setSelectedPresetEmail] = useState<string>('partner');
  const [forceFullScan, setForceFullScan] = useState<boolean>(false);
  const [isRunningAgent, setIsRunningAgent] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [executionSteps, setExecutionSteps] = useState<AgentExecutionStep[]>([]);
  const [agentResult, setAgentResult] = useState<any | null>(null);

  // Email presets for testing
  const emailPresets: Record<string, InboundEmailMessage> = {
    partner: {
      id: 'msg-gmail-partner-22242192',
      from: 'partner@partner.co.il',
      fromName: 'פרטנר תקשורת בע״מ',
      to: 'ambatline.reshbon@gmail.com',
      subject: 'חשבונית חודשית אוגוסט 2026 - קווי תקשורת ואינטרנט (4 עמודים)',
      receivedDate: '17/09/2026 14:15',
      htmlBody: '<p>שלום רב, מצורפת חשבונית מספר 22242192 לחודש אוגוסט 2026 הכוללת פירוט עבור 5 קווים ושירותי ענן.</p>',
      attachments: [
        {
          filename: 'partner_invoice_22242192.pdf',
          contentType: 'application/pdf',
          sizeBytes: 328000
        }
      ]
    },
    sonol: {
      id: 'msg-gmail-sonol-3299586',
      from: 'billing@sonol-evi.co.il',
      fromName: 'סונול EVI בע״מ',
      to: 'ambatline.reshbon@gmail.com',
      subject: 'Your new billing invoice (3299586) - סונול EVI בע״מ',
      receivedDate: '18/09/2026 13:50',
      htmlBody: '<p>תודה שהטענת ברשת Sonol EVI. מצורפת חשבונית מס / קבלה מקורית מספר 3299586.</p>',
      attachments: [
        {
          filename: 'sonol_evi_3299586.pdf',
          contentType: 'application/pdf',
          sizeBytes: 142000
        }
      ]
    },
    iec: {
      id: 'msg-gmail-iec-491506083',
      from: 'invoices@iec.co.il',
      fromName: 'חברת החשמל לישראל בע"מ',
      to: 'ambatline.reshbon@gmail.com',
      subject: 'חשבון חשמל חד-חודשי מקור 2026-491506083 (3 עמודים)',
      receivedDate: '16/09/2026 08:30',
      htmlBody: '<p>מצורף בזאת חשבון החשמל החד-חודשי שלך 2026-491506083 לתקופה 14/08/2026 - 15/09/2026.</p>',
      attachments: [
        {
          filename: 'iec_electric_2026_491506083.pdf',
          contentType: 'application/pdf',
          sizeBytes: 485000
        }
      ]
    },
    amiti: {
      id: 'msg-gmail-amiti-002467',
      from: 'billing@amiti-group.co.il',
      fromName: 'ח.י אמיתי בע"מ',
      to: 'ambatline.reshbon@gmail.com',
      subject: 'חשבונית מס מקור מספר 01/002467 עבור דמי שכירות מגדלי בסר C',
      receivedDate: '17/09/2026 10:20',
      htmlBody: '<p>מצורפת חשבונית מס מקור 01/002467 בגין דמי שכירות תקופה 08/26-10/26.</p>',
      attachments: [
        {
          filename: 'amiti_rent_01_002467.pdf',
          contentType: 'application/pdf',
          sizeBytes: 184000
        }
      ]
    },
    new_vendor: {
      id: 'msg-gmail-technova-9941',
      from: 'invoicing@technova-solutions.com',
      fromName: 'TechNova Cloud & AI Solutions SAS',
      to: 'ambatline.reshbon@gmail.com',
      subject: 'Invoice #TN-2026-9941 - Monthly Kubernetes Cluster Hosting',
      receivedDate: '18/09/2026 16:40',
      htmlBody: '<p>Dear Customer, your invoice TN-2026-9941 for managed container infrastructure is attached.</p>',
      attachments: [
        {
          filename: 'invoice_TN-2026-9941.pdf',
          contentType: 'application/pdf',
          sizeBytes: 215000
        }
      ]
    },
    mismatch_bug: {
      id: 'msg-gmail-buggy-case',
      from: 'vendor-anomaly@telecom-sample.com',
      fromName: 'Fournisseur Anomaly Multi-abonnés',
      to: 'ambatline.reshbon@gmail.com',
      subject: 'Facture Test Bug : 1 ligne extraite (162.31) vs Total réel (348.73)',
      receivedDate: '18/09/2026 17:00',
      htmlBody: '<p>Simulation de l\'ancien bug : extraction partielle d\'une seule ligne.</p>',
      attachments: [
        {
          filename: 'telecom_multi_pages_sample.pdf',
          contentType: 'application/pdf',
          sizeBytes: 310000
        }
      ]
    }
  };

  const currentEmail = emailPresets[selectedPresetEmail] || emailPresets.partner;

  // Run the agent execution with live steps animation
  const handleRunAgent = async () => {
    setIsRunningAgent(true);
    setExecutionSteps([]);
    setAgentResult(null);
    setCurrentStepIndex(1);

    // If simulating the historical bug, demonstrate the strict MISMATCH detection
    if (selectedPresetEmail === 'mismatch_bug') {
      const bugExtraction = {
        vendor_name: 'Fournisseur Anomaly Multi-abonnés',
        invoice_number: 'BUG-44-1074',
        invoice_date: '2026-09-18',
        line_items: [
          { description: 'Ligne unique extraite par erreur (קו 054-1111111)', amount: 162.31 }
        ],
        subtotal: 162.31,
        tax_amount: 29.22,
        total_amount: 348.73, // Le vrai total du document !
        total_source: 'explicit_label'
      };

      const validation = supplierTemplateEngine.validateTotals(bugExtraction);

      const fakeSteps: AgentExecutionStep[] = [
        {
          step: 1,
          toolName: 'list_attachments',
          description: 'Recherche des pièces jointes application/pdf',
          input: { email_id: currentEmail.id },
          output: { attachments_found: 1, filename: 'telecom_multi_pages_sample.pdf' },
          status: 'success',
          timestamp: new Date().toLocaleTimeString(),
          durationMs: 35
        },
        {
          step: 2,
          toolName: 'download_attachment',
          description: 'Téléchargement du PDF brut et calcul SHA256 (avant tout scan)',
          input: { attachment: 'telecom_multi_pages_sample.pdf' },
          output: { file_path: '/storage/invoices/raw/telecom_multi_pages_sample.pdf', sha256: 'sha256_telecom_multi_pages_sample_310000_verified' },
          status: 'success',
          timestamp: new Date().toLocaleTimeString(),
          durationMs: 70
        },
        {
          step: 3,
          toolName: 'match_template',
          description: 'Recherche תבנית pour telecom-sample.com',
          input: { sender: currentEmail.from },
          output: { template_found: false, rule_applied: 'Aucun template -> scan complet obligatoire' },
          status: 'warning',
          timestamp: new Date().toLocaleTimeString(),
          durationMs: 25
        },
        {
          step: 4,
          toolName: 'extract_full_scan',
          description: 'Extraction complète multi-pages (simulation anomalie ligne isolée)',
          input: { pdf_path: '/storage/invoices/raw/telecom_multi_pages_sample.pdf' },
          output: bugExtraction,
          status: 'success',
          timestamp: new Date().toLocaleTimeString(),
          durationMs: 180
        },
        {
          step: 5,
          toolName: 'validate_totals',
          description: 'Vérification stricte : subtotal + taxe == total ET sum(lines) == subtotal',
          input: { extraction: bugExtraction },
          output: {
            status: 'MISMATCH',
            checks: validation.checks,
            items_sum: 162.31,
            discrepancy: 'Sous-total (162.31) + Taxe (29.22) = 191.53 ≠ Total (348.73) [Écart: 157.20]'
          },
          status: 'error',
          timestamp: new Date().toLocaleTimeString(),
          durationMs: 15
        },
        {
          step: 6,
          toolName: 'save_invoice',
          description: 'Enregistrement de la facture avec alerte de rejet (statut MISMATCH)',
          input: { validation_status: 'MISMATCH' },
          output: { action: 'Facture bloquée pour révision manuelle. Aucun template appris.' },
          status: 'warning',
          timestamp: new Date().toLocaleTimeString(),
          durationMs: 20
        }
      ];

      setExecutionSteps(fakeSteps);
      setAgentResult({
        status: 'MISMATCH',
        extraction: bugExtraction,
        validation,
        message: 'Écart de cohérence détecté avec succès ! Le bug a été intercepté par validate_totals.'
      });
      setIsRunningAgent(false);
      return;
    }

    try {
      const res = await supplierTemplateEngine.executeAgentPipeline(currentEmail, {
        forceFullScan
      });

      setExecutionSteps(res.steps);
      setAgentResult(res);
      setTemplates(supplierTemplateEngine.getTemplates());
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningAgent(false);
    }
  };

  const handleResetTemplates = () => {
    supplierTemplateEngine.resetToDefaultTemplates();
    setTemplates(supplierTemplateEngine.getTemplates());
    setSelectedTemplate(supplierTemplateEngine.getTemplates()[0] || null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Architecture & Règle des 3 Succès */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
              <Bot className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold tracking-wide">
                  סוכן סריקת חשבוניות Gmail + Gemini Function Calling + תבניות ספקים
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  8 Tools Déclarés
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                Téléchargement du PDF brut en premier lieu (source de vérité immuable) ➔ Recherche תבנית (modèle appris) ➔ 
                Règle d'apprentissage stricte : <strong>success_count &ge; 3</strong> requis avant utilisation en mode guidé ➔ Validation mathématique au centime près.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetTemplates}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/20 transition shrink-0 flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>איפוס תבניות ברירת מחדל</span>
          </button>
        </div>

        {/* 6 Steps Sequential Flow Diagram (§5) */}
        <div className="mt-5 pt-4 border-t border-indigo-900/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-1">
            <span className="text-[10px] text-indigo-300 font-bold">1. LIST</span>
            <span className="font-semibold text-slate-200">list_attachments</span>
            <span className="text-[10px] text-slate-400">Repère le PDF</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold">2. DOWNLOAD</span>
            <span className="font-semibold text-slate-200">download_attachment</span>
            <span className="text-[10px] text-slate-400">PDF brut + SHA256</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-1">
            <span className="text-[10px] text-blue-400 font-bold">3. MATCH</span>
            <span className="font-semibold text-slate-200">match_template</span>
            <span className="text-[10px] text-slate-400">Cherche תבנית ספק</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-1">
            <span className="text-[10px] text-amber-400 font-bold">4. EXTRACT</span>
            <span className="font-semibold text-slate-200">template / full_scan</span>
            <span className="text-[10px] text-slate-400">Toutes les pages</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-1">
            <span className="text-[10px] text-rose-400 font-bold">5. VALIDATE</span>
            <span className="font-semibold text-slate-200">validate_totals</span>
            <span className="text-[10px] text-slate-400">Anti-bug 162≠348</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-1">
            <span className="text-[10px] text-teal-400 font-bold">6. LEARN</span>
            <span className="font-semibold text-slate-200">save_new_template</span>
            <span className="text-[10px] text-slate-400">success_count &ge; 3</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout : Live Simulator + Templates Library */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Interactive Agent Execution Simulator */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  סימולטור הרצת סוכן בזמן אמת (Live Agent Execution)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Gemini 3.8 Flash • Strict Sequential
              </span>
            </div>

            {/* Email Preset Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                בחר תרחיש אימייל נכנס לבדיקה :
              </label>
              <select
                value={selectedPresetEmail}
                onChange={(e) => setSelectedPresetEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="partner">📱 פרטנר תקשורת (Partner 5G) - חשבונית 4 עמודים, 5 קווים (תבנית פעילה, 4 הצלחות)</option>
                <option value="sonol">⚡ סונול EVI בע״מ - טעינת רכב חשמלי 6.66 ₪ (תבנית פעילה, 5 הצלחות)</option>
                <option value="iec">💡 חברת החשמל לישראל - 3 עמודים, תעו״ז (תבנית פעילה, 3 הצלחות)</option>
                <option value="amiti">🏢 ח.י אמיתי בע"מ - דמי שכירות מגדלי בסר C (תבנית בלימוד, 2/3 הצלחות ➔ דורש סריקה מלאה)</option>
                <option value="new_vendor">🆕 ספק חדש לא מוכר (TechNova SAS) - הפקת תבנית חדשה אוטומטית (success_count = 1)</option>
                <option value="mismatch_bug">⚠️ בדיקת יירוט הבאג : חילוץ שגוי של שורה בודדת (162.31 ₪ מול 348.73 ₪ ➔ יירוט MISMATCH)</option>
              </select>
            </div>

            {/* Email Metadata Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{currentEmail.fromName}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500">{currentEmail.from}</span>
              </div>
              <div className="text-slate-700 dark:text-slate-300 font-medium">
                נושא: <span className="font-normal">{currentEmail.subject}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>קובץ מצורף: <strong>{currentEmail.attachments[0]?.filename}</strong></span>
                <span>גודל: {Math.round((currentEmail.attachments[0]?.sizeBytes || 0) / 1024)} KB</span>
              </div>
            </div>

            {/* Execution Options & Launch Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceFullScan}
                  onChange={(e) => setForceFullScan(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>אלץ סריקה מלאה ללא שימוש בתבנית (Force extract_full_scan)</span>
              </label>

              <button
                type="button"
                onClick={handleRunAgent}
                disabled={isRunningAgent}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer ml-auto"
              >
                {isRunningAgent ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>
                  {isRunningAgent ? 'מריץ סוכן Function Calling...' : 'הפעל סוכן אוטומטי (Execute Pipeline)'}
                </span>
              </button>
            </div>

            {/* Execution Steps Log Output */}
            {executionSteps.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-indigo-600" />
                    <span>יומן קריאות כלים (Tool Calls Log) :</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                    agentResult?.status === 'OK' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    סטטוס סופי : {agentResult?.status || 'RUNNING'}
                  </span>
                </div>

                <div className="space-y-2">
                  {executionSteps.map((step) => {
                    const isSuccess = step.status === 'success';
                    const isError = step.status === 'error';
                    const isWarning = step.status === 'warning';

                    return (
                      <div
                        key={step.step}
                        className={`p-3 rounded-xl border text-xs transition space-y-1.5 ${
                          isError
                            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                            : isWarning
                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-[10px]">
                              {step.step}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-[12px]">
                              {step.toolName}()
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {step.durationMs}ms
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-sans">
                          {step.description}
                        </div>

                        {/* Output summary */}
                        <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 font-mono text-[10.5px] text-slate-700 dark:text-slate-300 overflow-x-auto">
                          {JSON.stringify(step.output, null, 2)}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Right Column (5 cols): תבניות ספקים (Supplier Templates Store) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  ספריית תבניות ספקים (Supplier Templates)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {templates.length} תבניות
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              תבניות שנלמדו מאימיילים קודמים. תבנית מאושרת לשימוש אוטומטי רק עם <strong>success_count &ge; 3</strong> למניעת הפצת שגיאות.
            </p>

            {/* Templates List */}
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {templates.map((tpl) => {
                const isActive = tpl.successCount >= 3;
                const isSelected = selectedTemplate?.templateId === tpl.templateId;

                return (
                  <div
                    key={tpl.templateId}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`p-3.5 rounded-xl border text-start cursor-pointer transition space-y-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {tpl.vendorName}
                        </div>
                        <div className="text-[10.5px] font-mono text-slate-500">
                          {tpl.senderDomain}
                        </div>
                      </div>

                      {/* Success Count Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      }`}>
                        {isActive ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{tpl.successCount}/3 {isActive ? 'פעיל (מודרך)' : 'בלימוד'}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                      {tpl.notes}
                    </div>

                    {/* Expected sections */}
                    <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      {tpl.expectedSections.map((sec) => (
                        <span key={sec.field} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9.5px] font-mono">
                          {sec.labelHebrew || sec.field}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Template Details Card */}
            {selectedTemplate && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>מבנה תבנית: {selectedTemplate.templateId}</span>
                  <span className="text-[10.5px] font-mono text-indigo-600 dark:text-indigo-400">
                    אימות אחרון: {selectedTemplate.lastValidatedAt || 'טרם אומת'}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  {selectedTemplate.expectedSections.map((sec, idx) => (
                    <div key={idx} className="flex justify-between p-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                      <span>{sec.field}:</span>
                      <strong className="text-slate-900 dark:text-white font-sans">{sec.labelHebrew} ({sec.pageHint || 'all'})</strong>
                    </div>
                  ))}
                </div>

                <p className="text-[10.5px] text-slate-500 italic">
                  * כלל זהב: סוכן Gemini משתמש בתבנית לזירוז, אך <strong>validate_totals</strong> מבצע אימות מתמטי מלא בכל חשבונית מחדש.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
