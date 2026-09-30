import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, X, Check, Search } from 'lucide-react';
import { enterpriseConfigService } from '../../services/enterpriseConfigService';
import { TrashItem } from '../../types/enterprise';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  trash: TrashItem[];
  onActionComplete: (msg: string) => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  trash,
  onActionComplete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTrash = trash.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deletedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.entityType === filterType;
    return matchesSearch && matchesType;
  });

  const getEntityLabel = (type: TrashItem['entityType']) => {
    switch (type) {
      case 'user': return 'משתמש';
      case 'branch': return 'סניף';
      case 'cost_center': return 'מרכז עלות';
      case 'custom_field': return 'שדה מותאם';
      case 'workflow': return 'נוהל אישור';
      case 'tax_rate': return 'שיעור מס';
      case 'email_box': return 'תיבת מייל';
      case 'integration': return 'ממשק ERP';
      case 'company': return 'חברה';
      default: return type;
    }
  };

  const handleRestore = (id: string, name: string) => {
    const success = enterpriseConfigService.restoreFromTrash(id);
    if (success) {
      onActionComplete(`הפריט "${name}" שוחזר בהצלחה לפעילות`);
    }
  };

  const handlePermanentDelete = (id: string, name: string) => {
    enterpriseConfigService.permanentDelete(id);
    setConfirmDeleteId(null);
    onActionComplete(`הפריט "${name}" נמחק לצמיתות`);
  };

  const handleEmptyTrash = () => {
    if (window.confirm('האם אתה בטוח שברצונך לרוקן את כל סל המחזור? פעולה זו הינה בלתי הפיכה!')) {
      enterpriseConfigService.emptyTrash();
      onActionComplete('סל המחזור רוקן לחלוטין');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                סל מחזור ארגוני (Recycle Bin)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold">
                  {trash.length} פריטים
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                פריטים שנמחקו במחיקה רכה (Soft Delete). ניתן לשחזרם או לרוקן לצמיתות.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trash.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                רוקן סל מחזור
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

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, סיבה או שם מוחק..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-9 pe-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">סנן לפי סוג:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">כל הסוגים</option>
              <option value="user">משתמשים</option>
              <option value="branch">סניפים</option>
              <option value="cost_center">מרכזי עלות</option>
              <option value="custom_field">שדות מותאמים</option>
              <option value="workflow">נהלי אישור</option>
              <option value="tax_rate">שיעורי מס</option>
              <option value="email_box">תיבות מייל</option>
              <option value="company">חברות</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTrash.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">סל המחזור ריק</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                אין פריטים שנמחקו ברמת חיפוש זו. כל הישויות הארגוניות פעילות.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">סוג ישות</th>
                    <th className="p-3">שם הפריט</th>
                    <th className="p-3">נמחק על ידי</th>
                    <th className="p-3">תאריך מחיקה</th>
                    <th className="p-3">סיבת מחיקה</th>
                    <th className="p-3 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredTrash.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                          {getEntityLabel(item.entityType)}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {item.deletedBy}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {item.deletedAt}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 italic">
                        {item.reason}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleRestore(item.id, item.name)}
                            title="שחזר לפעילות"
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            שחזר
                          </button>

                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-300 dark:border-rose-800">
                              <button
                                onClick={() => handlePermanentDelete(item.id, item.name)}
                                title="אישור מחיקה לצמיתות"
                                className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                title="ביטול"
                                className="p-1 rounded hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(item.id)}
                              title="מחק לצמיתות"
                              className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              לצמיתות
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>מחיקה לצמיתות מסירה את המידע ללא אפשרות שחזור.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
