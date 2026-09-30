import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Coins, 
  Sliders, 
  ShieldCheck, 
  Layers, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Play, 
  Calculator, 
  ArrowRight, 
  Settings, 
  TrendingUp,
  FileSearch,
  Check,
  Eye,
  Plus,
  Trash2,
  Bot
} from 'lucide-react';
import { enterpriseConfigService } from '../../services/enterpriseConfigService';
import { DeepAiOcrPipelineConfig, SupplierOcrOverride } from '../../types/enterprise';
import { SupplierTemplatesManager } from './SupplierTemplatesManager';

interface AiOcrPipelineTabProps {
  config: DeepAiOcrPipelineConfig;
  onUpdate: (msg: string) => void;
}

export const AiOcrPipelineTab: React.FC<AiOcrPipelineTabProps> = ({
  config,
  onUpdate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'agent_templates' | 'pipeline' | 'tokens_cost' | 'confidence' | 'preprocessing' | 'simulator' | 'supplier_overrides'>('agent_templates');
  
  // Local state for configuration
  const [pipelineState, setPipelineState] = useState<DeepAiOcrPipelineConfig>(config);
  
  // Simulator state
  const [simDocVolume, setSimDocVolume] = useState<number>(2500);
  const [simPagesPerDoc, setSimPagesPerDoc] = useState<number>(2);
  const [isSimulatingTest, setIsSimulatingTest] = useState(false);
  const [simTestResult, setSimTestResult] = useState<any | null>(null);

  // Supplier override state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierOverride, setNewSupplierOverride] = useState<SupplierOcrOverride>({
    supplierTaxId: '',
    supplierName: '',
    customEngine: 'google_vision_gemini',
    customModel: 'gemini-2.5-flash',
    fieldThresholdOverrides: {
      totalAmount: 99,
      invoiceNumber: 99,
    },
    bypassAutoMatch: false,
    zeroVatReasonOverride: 'ייצוא טובין לפי סעיף 30',
  });

  // Handle Preset Selection
  const applyPreset = (mode: 'economy' | 'balanced' | 'accuracy') => {
    let updated = { ...pipelineState, usageMode: mode };
    if (mode === 'economy') {
      updated.aiModel = 'gemini-2.5-flash';
      updated.ocrEngine = 'google_vision_gemini';
      updated.multiPassOcr = false;
      updated.maxRetries = 1;
      updated.preprocessing.autoEnhanceResolution = false;
      updated.fieldThresholds.totalAmount = 90;
      updated.fieldThresholds.supplierName = 85;
    } else if (mode === 'balanced') {
      updated.aiModel = 'gemini-2.5-flash';
      updated.ocrEngine = 'google_vision_gemini';
      updated.fallbackOcrEngine = 'azure_doc_intelligence';
      updated.multiPassOcr = true;
      updated.maxPasses = 2;
      updated.maxRetries = 2;
      updated.fieldThresholds.totalAmount = 95;
      updated.fieldThresholds.supplierName = 92;
    } else if (mode === 'accuracy') {
      updated.aiModel = 'gemini-2.5-pro';
      updated.ocrEngine = 'google_vision_gemini';
      updated.fallbackOcrEngine = 'azure_doc_intelligence';
      updated.multiPassOcr = true;
      updated.maxPasses = 3;
      updated.maxRetries = 3;
      updated.fieldThresholds.totalAmount = 98;
      updated.fieldThresholds.supplierName = 96;
      updated.fieldThresholds.invoiceNumber = 96;
      updated.criticalFieldsOverrideAutoPass = true;
    }
    setPipelineState(updated);
    enterpriseConfigService.updatePipelineConfig(updated);
    onUpdate(`הוגדר מצב עבודה: ${mode === 'economy' ? 'חיסכון (Economy)' : mode === 'balanced' ? 'מאוזן (Balanced)' : 'דיוק עילאי (Accuracy)'}`);
  };

  const handleSave = () => {
    enterpriseConfigService.updatePipelineConfig(pipelineState);
    onUpdate('הגדרות צינור ה-AI ו-OCR נשמרו בהצלחה');
  };

  // Run a test document extraction simulation
  const runSimulationTest = () => {
    setIsSimulatingTest(true);
    setTimeout(() => {
      setIsSimulatingTest(false);
      setSimTestResult({
        docName: 'Sample_Tax_Invoice_2026_481.pdf',
        pages: 2,
        tokensIn: 1840,
        tokensOut: 420,
        totalTokens: 2260,
        latencyMs: 1140,
        costEstimateUsd: 0.0034,
        overallConfidence: 96.8,
        fields: [
          { name: 'שם ספק', value: 'אורקל ישראל בע״מ', confidence: 99.2, status: 'pass' },
          { name: 'ח.פ ספק', value: '512398471', confidence: 99.5, status: 'pass' },
          { name: 'מספר חשבונית', value: 'INV-99824', confidence: 98.4, status: 'pass' },
          { name: 'תאריך חשבונית', value: '2026-04-12', confidence: 97.1, status: 'pass' },
          { name: 'סכום לפני מע״מ', value: '14,200.00 ₪', confidence: 98.9, status: 'pass' },
          { name: 'מע״מ (17%)', value: '2,414.00 ₪', confidence: 98.2, status: 'pass' },
          { name: 'סה״כ לתשלום', value: '16,614.00 ₪', confidence: 99.8, status: 'pass' },
          { name: 'מספר הזמנה מקושר (PO)', value: 'PO-2026-081', confidence: 91.5, status: 'review_warning' },
        ],
        audit: 'Multi-Pass Pass 1 succeeded with confidence > 95%. Primary Engine: Gemini 2.5 Flash. Validation Rule: Cross-Math Passed (14,200 + 2,414 = 16,614).'
      });
    }, 1200);
  };

  // Cost calculations
  const totalTokensForecast = simDocVolume * simPagesPerDoc * 1100;
  const costFlash = (totalTokensForecast / 1000) * (pipelineState.costPer1kTokens || 0.0015);
  const costPro = (totalTokensForecast / 1000) * 0.0075;
  const savings = Math.max(0, costPro - costFlash);

  return (
    <div className="space-y-6">
      {/* Visual Pipeline Architecture Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-5 text-white shadow-lg overflow-x-auto">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">צינור עיבוד AI ו-OCR ארגוני (Enterprise Processing Pipeline)</h3>
              <p className="text-[11px] text-slate-400">
                תהליך סריקה, פענוח חכם, בקרת טוקנים, אימות חשבוניות ולימוד מכונה מתמשך
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">מצב נבחר:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              {pipelineState.usageMode.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Pipeline Visual Diagram */}
        <div className="flex items-center justify-between min-w-[760px] text-xs pt-2 pb-1 font-mono">
          {[
            { step: '1. OCR Scan', icon: '📄' },
            { step: '2. AI Engine', icon: '🤖' },
            { step: '3. Token Count', icon: '🪙' },
            { step: '4. Cost Check', icon: '💲' },
            { step: '5. Confidence', icon: '🎯' },
            { step: '6. Validation', icon: '⚖️' },
            { step: '7. Auto-Retry', icon: '🔄' },
            { step: '8. ERP Pass', icon: '✅' },
          ].map((item, idx) => (
            <React.Fragment key={item.step}>
              <div className="flex flex-col items-center gap-1 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-indigo-400/50 transition-colors">
                <span className="text-sm">{item.icon}</span>
                <span className="text-[11px] font-semibold text-slate-200">{item.step}</span>
              </div>
              {idx < 7 && <ArrowRight className="w-3.5 h-3.5 text-indigo-400/60 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Agent Gmail + Function Calling + Templates Subtab */}
          <button
            onClick={() => setActiveSubTab('agent_templates')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'agent_templates'
                ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-300" />
            <span>סוכן Gmail & תבניות ספקים (Function Calling)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 text-white font-mono">NEW</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pipeline')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'pipeline'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            מנועים וארכיטקטורה
          </button>

          <button
            onClick={() => setActiveSubTab('tokens_cost')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'tokens_cost'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            בקרת טוקנים ותקציב חודשי
          </button>

          <button
            onClick={() => setActiveSubTab('confidence')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'confidence'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            ספי ביטחון ואימות שדות
          </button>

          <button
            onClick={() => setActiveSubTab('preprocessing')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'preprocessing'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            עיבוד תמונה מקדים ו-DPI
          </button>

          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            סימולטור בדיקה ומחשבון עלויות
          </button>

          <button
            onClick={() => setActiveSubTab('supplier_overrides')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'supplier_overrides'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            חוקי OCR ייעודיים לפי ספק ({pipelineState.supplierOverrides?.length || 0})
          </button>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Check className="w-3.5 h-3.5" />
          שמור את כל שינויי ה-AI
        </button>
      </div>

      {/* 0. Agent Gmail & Supplier Templates (Function Calling) */}
      {activeSubTab === 'agent_templates' && (
        <SupplierTemplatesManager />
      )}

      {/* 1. Engines & Architecture */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Preset Buttons */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              פרופיל עבודה מהיר (Preset Selection):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => applyPreset('economy')}
                className={`p-3 rounded-xl border text-right transition-all ${
                  pipelineState.usageMode === 'economy'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300">🌱 חיסכון (Economy)</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-mono">~$0.0015 / מסמך</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  מודל Gemini 2.5 Flash, סריקה בסיסית, ריטריי אחד. מומלץ לחשבוניות פשוטות ולנפחי מסמכים גבוהים.
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('balanced')}
                className={`p-3 rounded-xl border text-right transition-all ${
                  pipelineState.usageMode === 'balanced'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300">⚖️ מאוזן (Balanced - ברירת מחדל)</span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded font-mono">~$0.0035 / מסמך</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  סריקה רב-שלבית (2 Passes), מנוע גיבוי Azure, ספי דיוק של 95% על סכומים וספקים.
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('accuracy')}
                className={`p-3 rounded-xl border text-right transition-all ${
                  pipelineState.usageMode === 'accuracy'
                    ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 ring-1 ring-purple-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-purple-700 dark:text-purple-300">🎯 דיוק עילאי (Accuracy)</span>
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded font-mono">~$0.0080 / מסמך</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  מודל Gemini 2.5 Pro Vision, סריקה 3 שלבים, בדיקת צולבת של שורות פריטים ומכס.
                </p>
              </button>
            </div>
          </div>

          {/* Engine configurations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              מנועי פענוח ו-OCR ראשיים
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מנוע OCR ראשי (Primary Engine)
                </label>
                <select
                  value={pipelineState.ocrEngine}
                  onChange={(e) => setPipelineState({ ...pipelineState, ocrEngine: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="google_vision_gemini">Google Cloud Vision + Gemini 2.5 (מומלץ)</option>
                  <option value="azure_doc_intelligence">Azure Document Intelligence (Form Recognizer)</option>
                  <option value="aws_textract">AWS Textract</option>
                  <option value="hybrid_ensemble">Hybrid Ensemble (סריקה כפולה והשוואה)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מנוע גיבוי במקרה כשל (Fallback Engine)
                </label>
                <select
                  value={pipelineState.fallbackOcrEngine}
                  onChange={(e) => setPipelineState({ ...pipelineState, fallbackOcrEngine: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="azure_doc_intelligence">Azure Document Intelligence</option>
                  <option value="google_vision_gemini">Google Cloud Vision + Gemini</option>
                  <option value="aws_textract">AWS Textract</option>
                  <option value="none">ללא מנוע גיבוי (עצירה לכשל)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מודל AI חכם (Language & Vision Model)
                </label>
                <select
                  value={pipelineState.aiModel}
                  onChange={(e) => setPipelineState({ ...pipelineState, aiModel: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (מהיר, מדויק, עלות מינימלית)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (חשיבה עמוקה, מסמכים מורכבים)</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  טמפרטורת מודל (Temperature)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={pipelineState.temperature}
                    onChange={(e) => setPipelineState({ ...pipelineState, temperature: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono font-bold w-10 text-center">{pipelineState.temperature}</span>
                </div>
                <span className="text-[10px] text-slate-400">0.0 מבטיח דטרמיניזם ודיוק עובדתי מלא</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מספר ניסיונות חוזרים בכשל (Max Retries)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={pipelineState.maxRetries}
                  onChange={(e) => setPipelineState({ ...pipelineState, maxRetries: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  זמן קטיעת פעולה במיל׳ שניות (Timeout ms)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={pipelineState.timeoutMs}
                  onChange={(e) => setPipelineState({ ...pipelineState, timeoutMs: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            {/* Multi pass */}
            <div className="border-t pt-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pipelineState.multiPassOcr}
                  onChange={(e) => setPipelineState({ ...pipelineState, multiPassOcr: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  הפעל סריקה רב-שלבית (Multi-Pass OCR Pipeline)
                </span>
              </label>
              <p className="text-[11px] text-slate-400 ms-6">
                אם שלב ראשון מניב ציון ביטחון נמוך, המערכת מריצה שלב שני עם שיפור ניגודיות מקומי וחיתוך חכם של אזורי שדות קריטיים (כגון טבלת שורות וסכומים).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Token & Cost Dashboard */}
      {activeSubTab === 'tokens_cost' && (
        <div className="space-y-6">
          {/* Live Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>טוקנים שנוצלו החודש</span>
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {(pipelineState.tokensUsedThisMonth || 3420000).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                היום: {(pipelineState.tokensUsedToday || 142500).toLocaleString()} טוקנים
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>עלות בפועל החודש</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ${(pipelineState.costSpentThisMonthUsd || 42.60).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                היום: ${(pipelineState.costSpentTodayUsd || 1.85).toFixed(2)} USD
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>תקציב חודשי מוגדר</span>
                <Zap className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                ${(pipelineState.monthlyBudgetCapUsd || 1500).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                יתרה פנויה: ${((pipelineState.monthlyBudgetCapUsd || 1500) - (pipelineState.costSpentThisMonthUsd || 42.6)).toFixed(2)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>ממוצע טוקנים למסמך</span>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {(pipelineState.averageTokensPerDoc || 2150).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                עלות למסמך: ~${(pipelineState.estimatedCostPerDocUsd || 0.0032).toFixed(4)}
              </div>
            </div>
          </div>

          {/* Budget progress bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                ניצול תקציב AI חודשי (Monthly Token Budget Usage)
              </span>
              <span className="font-mono font-bold text-indigo-600">
                2.84% נוצלו מתוך התקציב
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: '2.84%' }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>$0.00</span>
              <span>התראה ב-80% ($1,200)</span>
              <span>התראה ב-90% ($1,350)</span>
              <span>תקרה: $1,500.00</span>
            </div>
          </div>

          {/* Budget Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
              <Coins className="w-4 h-4 text-amber-500" />
              מגבלות תקציב והתנהגות בחריגה
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  תקציב חודשי מקסימלי (USD)
                </label>
                <input
                  type="number"
                  value={pipelineState.monthlyBudgetCapUsd}
                  onChange={(e) => setPipelineState({ ...pipelineState, monthlyBudgetCapUsd: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  עלות משוערת ל-1,000 טוקנים (USD)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={pipelineState.costPer1kTokens}
                  onChange={(e) => setPipelineState({ ...pipelineState, costPer1kTokens: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  סף התראה ראשונה (% מהתקציב)
                </label>
                <input
                  type="number"
                  value={pipelineState.alertThresholdPercent}
                  onChange={(e) => setPipelineState({ ...pipelineState, alertThresholdPercent: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  פעולה אוטומטית בהגעה לתקרת התקציב
                </label>
                <select
                  value={pipelineState.actionOnBudgetExceeded}
                  onChange={(e) => setPipelineState({ ...pipelineState, actionOnBudgetExceeded: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="switch_to_economy">מעבר אוטומטי למודל מוזל (Economy Fallback)</option>
                  <option value="stop_ai_pipeline">עצירת שירותי ה-AI ומעבר לקליטה ידנית</option>
                  <option value="require_admin_approval">המשך פעילות בכפוף לאישור מנהל כספים</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Field Confidence & Verification */}
      {activeSubTab === 'confidence' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ספי ביטחון מינימליים ברמת שדה (Field Confidence Thresholds %)
                </h4>
                <p className="text-[11px] text-slate-500">
                  כל שדה שציון הביטחון שלו נמוך מהסף יישלח לבדיקה ידנית (Human-in-the-Loop Review).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'totalAmount', label: 'סה״כ לתשלום (Total Amount)', critical: true },
                { key: 'vatAmount', label: 'סכום מע״מ (VAT Amount)', critical: true },
                { key: 'supplierTaxId', label: 'ח.פ / עוסק מורשה ספק', critical: true },
                { key: 'supplierName', label: 'שם הספק (Supplier Name)', critical: false },
                { key: 'invoiceNumber', label: 'מספר חשבונית / אסמכתא', critical: true },
                { key: 'invoiceDate', label: 'תאריך החשבונית', critical: false },
                { key: 'currency', label: 'מטבע החשבונית', critical: true },
                { key: 'lineItems', label: 'שורות פריטים ופירוט', critical: false },
                { key: 'poNumber', label: 'מספר הזמנת רכש (PO)', critical: false },
              ].map((item) => (
                <div key={item.key} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      {item.label}
                      {item.critical && <span className="text-rose-500 font-bold">*</span>}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {(pipelineState.fieldThresholds as any)[item.key] || 90}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="99"
                    value={(pipelineState.fieldThresholds as any)[item.key] || 90}
                    onChange={(e) => {
                      const updated = {
                        ...pipelineState.fieldThresholds,
                        [item.key]: Number(e.target.value),
                      };
                      setPipelineState({ ...pipelineState, fieldThresholds: updated });
                    }}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            {/* Critical Field Override */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pipelineState.criticalFieldsOverrideAutoPass}
                  onChange={(e) => setPipelineState({ ...pipelineState, criticalFieldsOverrideAutoPass: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  עצירה מוחלטת לאישור אנושי אם שדה קריטי נכשל (Critical Fields Override)
                </span>
              </label>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 ms-6">
                אם סכום החשבונית, המע״מ או מספר הספק נמצאים מתחת לסף הנדרש, החשבונית לעולם לא תאושר אוטומטית (גם אם ממוצע הביטחון הכללי של המסמך עומד על 98%).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Preprocessing & Quality Checks */}
      {activeSubTab === 'preprocessing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              עיבוד תמונה מקדים ויישור מסמכים (Image Enhancement & Preprocessing)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'autoRotate', label: 'סיבוב אוטומטי למנח נכון (Auto-Rotate 90°/180°)' },
                { key: 'deskew', label: 'יישור נטייה וקווים עקומים (Deskew Alignment)' },
                { key: 'cropBorders', label: 'חיתוך שוליים עודפים ומסגרות סריקה (Border Crop)' },
                { key: 'removeNoise', label: 'ניקוי רעשים דיגיטליים ונקודות (Denoising)' },
                { key: 'enhanceContrast', label: 'חידוד ניגודיות טקסט (Contrast Enhancement)' },
                { key: 'sharpenText', label: 'חידוד אותיות וספרות זעירות (Text Sharpening)' },
                { key: 'convertToGrayscale', label: 'המרה לגווני אפור לחסכון ברוחב פס (Grayscale)' },
                { key: 'autoEnhanceResolution', label: 'העלאת רזולוציה ל-300 DPI במסמכים ירודים' },
                { key: 'detectBlankPages', label: 'זיהוי דפים ריקים והסרתם אוטומטית' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={(pipelineState.preprocessing as any)[item.key]}
                    onChange={(e) => {
                      const updated = {
                        ...pipelineState.preprocessing,
                        [item.key]: e.target.checked,
                      };
                      setPipelineState({ ...pipelineState, preprocessing: updated });
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              בקרת איכות קובץ מקדים (Document Quality Gates)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מינימום רזולוציה נדרשת (DPI)
                </label>
                <input
                  type="number"
                  value={pipelineState.documentQualityRules?.minDpiRequired ?? 200}
                  onChange={(e) => {
                    const currentRules = pipelineState.documentQualityRules || {
                      minDpiRequired: 200,
                      rejectBlurryImages: true,
                      handlePasswordProtected: 'quarantine',
                      rejectCorruptedPdf: true,
                    };
                    setPipelineState({
                      ...pipelineState,
                      documentQualityRules: {
                        ...currentRules,
                        minDpiRequired: Number(e.target.value),
                      },
                    });
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  זיהוי טשטוש (Blur Detection)
                </label>
                <select
                  value={pipelineState.documentQualityRules?.rejectBlurryImages ? 'true' : 'false'}
                  onChange={(e) => {
                    const currentRules = pipelineState.documentQualityRules || {
                      minDpiRequired: 200,
                      rejectBlurryImages: true,
                      handlePasswordProtected: 'quarantine',
                      rejectCorruptedPdf: true,
                    };
                    setPipelineState({
                      ...pipelineState,
                      documentQualityRules: {
                        ...currentRules,
                        rejectBlurryImages: e.target.value === 'true',
                      },
                    });
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="true">דחה ודרוש סריקה חוזרת</option>
                  <option value="false">העבר לשיפור תמונה ונסה לפענח</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  קבצים מוגנים בסיסמה (Encrypted PDF)
                </label>
                <select
                  value={pipelineState.documentQualityRules?.handlePasswordProtected || 'quarantine'}
                  onChange={(e) => {
                    const currentRules = pipelineState.documentQualityRules || {
                      minDpiRequired: 200,
                      rejectBlurryImages: true,
                      handlePasswordProtected: 'quarantine',
                      rejectCorruptedPdf: true,
                    };
                    setPipelineState({
                      ...pipelineState,
                      documentQualityRules: {
                        ...currentRules,
                        handlePasswordProtected: e.target.value as any,
                      },
                    });
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="reject">דחה מידית ושלח הודעת שגיאה</option>
                  <option value="quarantine">העבר להסגר (Quarantine) לבדיקת אבטחה</option>
                  <option value="request_pwd">בקש סיסמה מהמשתמש</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  בדיקת תקינות מבנה PDF
                </label>
                <select
                  value={pipelineState.documentQualityRules?.rejectCorruptedPdf ? 'true' : 'false'}
                  onChange={(e) => {
                    const currentRules = pipelineState.documentQualityRules || {
                      minDpiRequired: 200,
                      rejectBlurryImages: true,
                      handlePasswordProtected: 'quarantine',
                      rejectCorruptedPdf: true,
                    };
                    setPipelineState({
                      ...pipelineState,
                      documentQualityRules: {
                        ...currentRules,
                        rejectCorruptedPdf: e.target.value === 'true',
                      },
                    });
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="true">אכוף תקינות מחמירה</option>
                  <option value="false">נסה חילוץ טקסט חלקי</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Interactive Simulator & Playground */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Document Test Run */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-indigo-600" />
                  הדמיית סריקת מסמך ופענוח AI בזמן אמת
                </h4>
                <button
                  onClick={runSimulationTest}
                  disabled={isSimulatingTest}
                  className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSimulatingTest ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  {isSimulatingTest ? 'מעבד במסלול AI...' : 'הרץ בדיקה חיה'}
                </button>
              </div>

              {simTestResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        תוצאת פענוח: {simTestResult.overallConfidence}% ביטחון כללי
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                        זמן עיבוד: {simTestResult.latencyMs}ms | טוקנים: {simTestResult.totalTokens} | עלות: ${simTestResult.costEstimateUsd}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                      SUCCESS
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-right">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="p-2">שדה</th>
                          <th className="p-2">ערך שחולץ</th>
                          <th className="p-2 text-center">ביטחון</th>
                          <th className="p-2 text-center">סטטוס</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {simTestResult.fields.map((f: any, idx: number) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium">{f.name}</td>
                            <td className="p-2 font-mono">{f.value}</td>
                            <td className="p-2 text-center font-mono font-bold text-indigo-600">{f.confidence}%</td>
                            <td className="p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                f.status === 'pass'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              }`}>
                                {f.status === 'pass' ? 'אושר' : 'לבדיקה'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    {simTestResult.audit}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  לחץ על ״הרץ בדיקה חיה״ כדי לבחון חשבונית לדוגמה מול צינור ה-AI הנוכחי
                </div>
              )}
            </div>
          </div>

          {/* Cost Forecaster & Volume Slider */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                מחשבון תחזית עלויות וטוקנים חודשיים
              </h4>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold">נפח חשבוניות חודשי צפוי:</span>
                    <span className="font-mono font-bold text-indigo-600 text-sm">{simDocVolume.toLocaleString()} מסמכים</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="20000"
                    step="100"
                    value={simDocVolume}
                    onChange={(e) => setSimDocVolume(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold">ממוצע דפים לחשבונית:</span>
                    <span className="font-mono font-bold text-indigo-600 text-sm">{simPagesPerDoc} דפים</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={simPagesPerDoc}
                    onChange={(e) => setSimPagesPerDoc(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">סך טוקנים חודשי משוער:</span>
                    <span className="font-mono font-bold">{totalTokensForecast.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">עלות חודשית במודל Gemini 2.5 Flash:</span>
                    <span className="font-mono font-bold text-emerald-600">${costFlash.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">עלות חודשית במודל Gemini 2.5 Pro:</span>
                    <span className="font-mono font-bold text-purple-600">${costPro.toFixed(2)} USD</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span className="text-emerald-700 dark:text-emerald-300">חיסכון חודשי ממוצע בשימוש במודל Flash:</span>
                    <span className="font-mono text-emerald-600">${savings.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Supplier Custom Overrides */}
      {activeSubTab === 'supplier_overrides' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                התאמות אישיות וחוקי OCR ייעודיים לפי ספק (Supplier Overrides)
              </h4>
              <p className="text-[11px] text-slate-500">
                ספקים בעלי מבנה חשבונית מיוחד יכולים להשתמש במנוע ייעודי, ספי דיוק מחמירים או פטור ממע״מ
              </p>
            </div>

            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              הוסף חוק ספק
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">ח.פ / מס׳ ספק</th>
                  <th className="p-3">שם הספק</th>
                  <th className="p-3">מנוע ייעודי</th>
                  <th className="p-3">מודל AI</th>
                  <th className="p-3">סף סכום מחמיר</th>
                  <th className="p-3">החרגת מע״מ 0%</th>
                  <th className="p-3 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {pipelineState.supplierOverrides?.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {rule.supplierTaxId}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {rule.supplierName}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {rule.customEngine || 'ברירת מחדל'}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {rule.customModel || 'ברירת מחדל'}
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-600">
                      {rule.fieldThresholdOverrides?.totalAmount ? `${rule.fieldThresholdOverrides.totalAmount}%` : 'ברירת מחדל'}
                    </td>
                    <td className="p-3 text-slate-500 italic text-[11px]">
                      {rule.zeroVatReasonOverride || '—'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          const current = pipelineState.supplierOverrides || [];
                          const updated = current.filter((_, i) => i !== idx);
                          setPipelineState({ ...pipelineState, supplierOverrides: updated });
                          enterpriseConfigService.updatePipelineConfig({ ...pipelineState, supplierOverrides: updated });
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Supplier Modal */}
          {showAddSupplierModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  הוספת חוק OCR ייעודי לספק
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ח.פ / מס׳ עוסק מורשה של הספק *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSupplierOverride.supplierTaxId}
                      onChange={(e) => setNewSupplierOverride({ ...newSupplierOverride, supplierTaxId: e.target.value })}
                      placeholder="512398471"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      שם הספק *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSupplierOverride.supplierName}
                      onChange={(e) => setNewSupplierOverride({ ...newSupplierOverride, supplierName: e.target.value })}
                      placeholder="אורקל ישראל בע״מ"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      מנוע ייעודי לספק זה
                    </label>
                    <select
                      value={newSupplierOverride.customEngine}
                      onChange={(e) => setNewSupplierOverride({ ...newSupplierOverride, customEngine: e.target.value as any })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="google_vision_gemini">Google Cloud Vision + Gemini</option>
                      <option value="azure_doc_intelligence">Azure Document Intelligence</option>
                      <option value="aws_textract">AWS Textract</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      סף ביטחון מחמיר לסכום (%)
                    </label>
                    <input
                      type="number"
                      min="70"
                      max="99"
                      value={newSupplierOverride.fieldThresholdOverrides?.totalAmount || 99}
                      onChange={(e) => setNewSupplierOverride({
                        ...newSupplierOverride,
                        fieldThresholdOverrides: {
                          ...newSupplierOverride.fieldThresholdOverrides,
                          totalAmount: Number(e.target.value),
                        }
                      })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      סיבת מע״מ אפס אוטומטית (אם קיים)
                    </label>
                    <input
                      type="text"
                      value={newSupplierOverride.zeroVatReasonOverride || ''}
                      onChange={(e) => setNewSupplierOverride({ ...newSupplierOverride, zeroVatReasonOverride: e.target.value })}
                      placeholder="שירותים בחו״ל / מע״מ בשיעור אפס סעיף 30"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSupplierOverride.supplierTaxId || !newSupplierOverride.supplierName) return;
                      const updated = [...(pipelineState.supplierOverrides || []), newSupplierOverride];
                      setPipelineState({ ...pipelineState, supplierOverrides: updated });
                      enterpriseConfigService.updatePipelineConfig({ ...pipelineState, supplierOverrides: updated });
                      setShowAddSupplierModal(false);
                      onUpdate(`חוק OCR ייעודי נוסף עבור ${newSupplierOverride.supplierName}`);
                    }}
                    className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    הוסף חוק
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
