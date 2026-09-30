import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  AlertTriangle, 
  FileText, 
  Users, 
  ShoppingCart, 
  PackageCheck, 
  Ship, 
  GitCompare, 
  CheckSquare, 
  Database, 
  Sun, 
  Moon, 
  Languages, 
  Building2,
  ChevronDown,
  Sliders,
  Sparkles,
  FolderArchive
} from 'lucide-react';
import { Language, ThemeMode, Company } from '../types';
import { translations } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  companies: Company[];
  selectedCompany: Company;
  setSelectedCompany: (company: Company) => void;
  needsAttentionCount: number;
  inboxCount: number;
  onOpenChatbot?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  language,
  setLanguage,
  theme,
  setTheme,
  companies,
  selectedCompany,
  setSelectedCompany,
  needsAttentionCount,
  inboxCount,
  onOpenChatbot
}) => {
  const t = translations[language];
  const { user } = useAuth();
  const [showCompanyMenu, setShowCompanyMenu] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'inbox', label: t.nav.inbox, icon: Inbox, badge: inboxCount },
    { id: 'archive', label: (t.nav as any).archive || (language === 'he' ? 'ארכיון דיגיטלי' : 'Archive'), icon: FolderArchive },
    { id: 'needs_attention', label: t.nav.needsAttention, icon: AlertTriangle, badge: needsAttentionCount, isAlert: true },
    { id: 'invoices', label: t.nav.invoices, icon: FileText },
    { id: 'suppliers', label: t.nav.suppliers, icon: Users },
    { id: 'purchase_orders', label: t.nav.purchaseOrders, icon: ShoppingCart },
    { id: 'receipts', label: t.nav.receipts, icon: PackageCheck },
    { id: 'imports', label: t.nav.imports, icon: Ship },
    { id: 'matching', label: t.nav.matching, icon: GitCompare },
    { id: 'approvals', label: t.nav.approvals, icon: CheckSquare },
    { id: 'erp_priority', label: t.nav.erpPriority, icon: Database },
    { id: 'control_center', label: t.nav.controlCenter || 'Control Center', icon: Sliders },
  ];

  return (
    <aside 
      id="main-sidebar"
      className="w-68 flex-shrink-0 flex flex-col justify-between border-e border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors select-none"
    >
      <div>
        {/* Logo & Brand */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
              D
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                {t.appName}
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  AI
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {t.tagline}
              </div>
            </div>
          </div>
        </div>

        {/* Company Switcher */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 relative">
          <button
            id="company-selector-btn"
            onClick={() => setShowCompanyMenu(!showCompanyMenu)}
            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 text-start text-xs transition"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="truncate">
                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {selectedCompany.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {selectedCompany.erpType} • {selectedCompany.defaultCurrency}
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>

          {showCompanyMenu && (
            <div className="absolute top-full start-3 end-3 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Multi-Entreprise / חברות
              </div>
              {companies.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompany(comp);
                    setShowCompanyMenu(false);
                  }}
                  className={`w-full text-start px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/70 transition ${
                    comp.id === selectedCompany.id ? 'bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="truncate">{comp.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono ms-2">{comp.erpType}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAlert ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.isAlert
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom controls: Language toggle, Dark mode, User */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {/* Language & Theme switcher */}
        <div className="flex items-center justify-between gap-1 bg-white dark:bg-slate-800/60 p-1 rounded-md border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-0.5">
            <Languages className="w-3.5 h-3.5 text-slate-400 ms-1 me-0.5" />
            <button
              onClick={() => setLanguage('fr')}
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                language === 'fr' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                language === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('he')}
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                language === 'he' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              עב
            </button>
          </div>

          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Gemini Copilot Launch Card */}
        {onOpenChatbot && (
          <button
            id="btn-sidebar-gemini-copilot"
            onClick={onOpenChatbot}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 text-start text-xs transition group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Gemini Copilot</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-mono">
                    AI
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {language === 'he' ? 'עוזר פיננסי חכם' : 'Smart AP Assistant'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition">
              {language === 'he' ? 'שאל ←' : 'Ask →'}
            </span>
          </button>
        )}

        {/* User Card */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="w-7 h-7 rounded-full object-cover border border-indigo-300 dark:border-indigo-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white">
              {user ? (user.displayName || user.email || 'U')[0].toUpperCase() : 'MB'}
            </div>
          )}
          <div className="overflow-hidden">
            <div className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate">
              {user ? (user.displayName || user.email?.split('@')[0]) : 'Michal Ben-Ari'}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {user ? (user.email || 'FINANCE & AUDIT') : 'FINANCE & AUDIT (Admin)'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
