import React from 'react';
import { Search, Plus, Bell, CheckCircle2, AlertCircle, X, Sparkles, LogIn, LogOut, User as UserIcon, Database } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentView: string;
  language: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenUpload: () => void;
  unreadAlertsCount: number;
  onToggleChatbot?: () => void;
  isChatbotOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  language,
  searchQuery,
  setSearchQuery,
  onOpenUpload,
  unreadAlertsCount,
  onToggleChatbot,
  isChatbotOpen,
}) => {
  const t = translations[language];
  const { user, loading, firestoreConnected, signInWithGoogle, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setAuthError(err?.message || 'Sign in failed');
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return t.nav.dashboard;
      case 'inbox': return t.nav.inbox;
      case 'needs_attention': return t.nav.needsAttention;
      case 'invoices': return t.nav.invoices;
      case 'suppliers': return t.nav.suppliers;
      case 'purchase_orders': return t.nav.purchaseOrders;
      case 'receipts': return t.nav.receipts;
      case 'imports': return t.nav.imports;
      case 'matching': return t.nav.matching;
      case 'approvals': return t.nav.approvals;
      case 'erp_priority': return t.nav.erpPriority;
      case 'control_center': return t.nav.controlCenter || 'Enterprise Control Center';
      default: return t.nav.dashboard;
    }
  };

  return (
    <header 
      id="main-header"
      className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between z-10"
    >
      {/* View Title & ERP status */}
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
          {getPageTitle()}
        </h1>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Priority ERP : {t.dashboard.statusHealthy}
        </div>

        {/* Firestore Database Indicator */}
        <div 
          title={firestoreConnected ? "Firestore Database Connected & Live" : "Connecting to Firestore..."}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50"
        >
          <Database className="w-3 h-3 text-blue-500" />
          <span>Firestore : {firestoreConnected ? "Online" : "Connecting"}</span>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Global Search */}
        <div className="relative w-44 md:w-64">
          <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.inbox.searchPlaceholder}
            className="w-full text-xs ps-8 pe-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Gemini Chatbot Trigger Button */}
        {onToggleChatbot && (
          <button
            id="btn-header-gemini-copilot"
            onClick={onToggleChatbot}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
              isChatbotOpen
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white ring-2 ring-indigo-400'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
            }`}
            title="Open Gemini AI Financial Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Gemini AI</span>
          </button>
        )}

        {/* Notifications Icon with popover */}
        <div className="relative">
          <button
            id="notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            title="Notifications & Anomalies"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute end-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Anomalies & Alertes Récentes
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {unreadAlertsCount} non résolues
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-[11px] text-rose-800 dark:text-rose-200">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Doublon Critique Détecté (TN-884920)
                  </div>
                  <div className="text-[10px] text-rose-600 dark:text-rose-300 mt-0.5">
                    Facture תנובה 23,400 ₪ déjà enregistrée. Blocage ERP activé.
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-200">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Écart de réception 3-Way (EL-4910283)
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-300 mt-0.5">
                    Facturé: 10 unités • Réceptionné en stock: 8 unités.
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[11px] text-emerald-800 dark:text-emerald-200">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Synchronisation Priority Réussie
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-300 mt-0.5">
                    Facture Maersk (MSK-982341902) enregistrée avec ID PRI-INV-2026-8812.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Upload Button */}
        <button
          id="header-upload-btn"
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.dashboard.uploadInvoices}</span>
        </button>

        {/* Google Authentication with Firebase */}
        <div className="relative ms-1">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                id="btn-user-profile-menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-7 h-7 rounded-full border border-indigo-200 dark:border-indigo-800 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute end-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-3 text-xs">
                  <div className="pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {user.displayName || 'Finance User'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user.email}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Firebase Auth Verified</span>
                    </div>
                  </div>

                  <button
                    id="btn-sign-out"
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition font-medium"
                  >
                    <span>{language === 'he' ? 'התנתק' : 'Sign Out'}</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="btn-google-signin"
              onClick={handleSignIn}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{language === 'he' ? 'התחבר עם Google' : 'Sign in'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
