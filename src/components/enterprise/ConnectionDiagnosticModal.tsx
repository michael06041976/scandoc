import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Activity, 
  Server, 
  Clock, 
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface DiagnosticStep {
  step: string;
  passed: boolean;
  detail: string;
}

interface ConnectionDiagnosticModalProps {
  isOpen: boolean;
  title: string;
  targetName: string;
  type: 'email' | 'integration';
  latencyMs: number;
  success: boolean;
  message: string;
  steps: DiagnosticStep[];
  onClose: () => void;
  onProceedToScan?: () => void;
}

export const ConnectionDiagnosticModal: React.FC<ConnectionDiagnosticModalProps> = ({
  isOpen,
  title,
  targetName,
  type,
  latencyMs,
  success,
  message,
  steps,
  onClose,
  onProceedToScan,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        dir="rtl"
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              success 
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
            }`}>
              {success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs font-mono text-slate-500 truncate max-w-[280px]">
                {targetName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Latency & Status Pill */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                זמן תגובה (Latency):
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {latencyMs}ms
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                מהיר במיוחד (Optimal)
              </span>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {message}
          </div>

          {/* Diagnostic Steps */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              שלבי אימות ותקינות תקשורת
            </span>
            <div className="space-y-2">
              {steps.map(step => (
                <div 
                  key={step.step}
                  className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{step.step}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[200px]">
                    {step.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            סגור
          </button>

          {onProceedToScan && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToScan();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {type === 'email' ? 'פתח סריקת מיילים לפי טווח' : 'פתח סנכרון נתונים'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
