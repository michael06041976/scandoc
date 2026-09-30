import React, { useState } from 'react';
import { History, RotateCcw, Plus, X, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { enterpriseConfigService } from '../../services/enterpriseConfigService';
import { ConfigVersionEntry } from '../../types/enterprise';

interface ConfigVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ConfigVersionEntry[];
  currentVersion: number;
  onActionComplete: (msg: string) => void;
}

export const ConfigVersionsModal: React.FC<ConfigVersionsModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onActionComplete,
}) => {
  const [newVersionSummary, setNewVersionSummary] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [selectedVersionForRollback, setSelectedVersionForRollback] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionSummary.trim()) return;
    enterpriseConfigService.createConfigVersion(newVersionSummary.trim());
    setNewVersionSummary('');
    setIsCreatingSnapshot(false);
    onActionComplete(`נקודת שחזור חדשה (גרסה v${currentVersion + 1}) נוצרה בהצלחה`);
  };

  const handleRollback = (verNum: number) => {
    const success = enterpriseConfigService.rollbackToVersion(verNum);
    setSelectedVersionForRollback(null);
    if (success) {
      onActionComplete(`המערכת שוחזרה בהצלחה להגדרות גרסה v${verNum}`);
      onClose();
    } else {
      alert('שגיאה בשחזור הגרסה');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center border border-indigo-200 dark:border-indigo-900/50">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                היסטוריית גרסאות תצורה (Configuration Versioning)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                  גרסה נוכחית: v{currentVersion}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                מעקב אחר שינויי קונפיגורציה, יצירת נקודות שחזור (Snapshots) ושחזור מהיר (Rollback)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot creator */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {isCreatingSnapshot ? (
            <form onSubmit={handleCreateSnapshot} className="space-y-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40">
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">יצירת נקודת שחזור חדשה</h4>
              <input
                type="text"
                required
                placeholder="תאר את השינויים שבוצעו (למשל: עדכון ספי OCR ואישור תעריף מע״מ 2026)..."
                value={newVersionSummary}
                onChange={(e) => setNewVersionSummary(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingSnapshot(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  שמור נקודת שחזור
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                ניתן ליצור גיבוי של מצב ההגדרות הנוכחי לפני ביצוע שינויים נרחבים
              </span>
              <button
                onClick={() => setIsCreatingSnapshot(true)}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                צור נקודת שחזור (Snapshot)
              </button>
            </div>
          )}
        </div>

        {/* Versions Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              אין היסטוריית גרסאות מתועדת
            </div>
          ) : (
            versions.map((ver) => {
              const isCurrent = ver.version === currentVersion;
              return (
                <div
                  key={ver.version}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        v{ver.version}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            גרסה {ver.version}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              פעילה כעת
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {ver.summary}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                          <span>📅 {ver.createdAt}</span>
                          <span>👤 {ver.author}</span>
                        </div>
                      </div>
                    </div>

                    {!isCurrent && (
                      <div>
                        {selectedVersionForRollback === ver.version ? (
                          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-300 dark:border-amber-800">
                            <span className="text-[11px] text-amber-800 dark:text-amber-200 font-semibold">בטוח לשחזר?</span>
                            <button
                              onClick={() => handleRollback(ver.version)}
                              className="px-2 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded"
                            >
                              כן, שחזר
                            </button>
                            <button
                              onClick={() => setSelectedVersionForRollback(null)}
                              className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                            >
                              ביטול
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedVersionForRollback(ver.version)}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-900 transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            שחזר לגרסה זו (Rollback)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
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
