import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  X, 
  Minimize2, 
  Maximize2, 
  Loader2, 
  User as UserIcon, 
  Zap, 
  Brain, 
  Flame, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  saveChatMessageToFirestore, 
  loadChatMessagesFromFirestore, 
  clearChatMessagesInFirestore,
  ChatHistoryMessage 
} from '../services/firestoreService';
import { InvoiceDocument, Language } from '../types';

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  invoices: InvoiceDocument[];
  currentInvoice?: InvoiceDocument | null;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  isOpen,
  onClose,
  language,
  invoices,
  currentInvoice
}) => {
  const { user, firestoreConnected } = useAuth();
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'
  >('gemini-3.5-flash');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load chat history from Firestore or set default welcome message
  useEffect(() => {
    async function initChat() {
      if (user) {
        try {
          const history = await loadChatMessagesFromFirestore(user.uid);
          if (history.length > 0) {
            setMessages(history);
            return;
          }
        } catch (err) {
          console.error('Failed to load history from Firestore:', err);
        }
      }

      // Default welcome message
      setMessages([
        {
          role: 'model',
          content: language === 'he'
            ? `שלום! אני **DocuFlow AI Copilot**, מופעל באמצעות Gemini. אני כאן לסייע לך בבדיקת חשבוניות, אימות מע״מ 17%, הצלבת 3-Way Match מול הזמנות רכש, וסנכרון לפריוריטי (Priority ERP).\n\nבחר מודל מתאים (Flash למענה כללי, Lite למענה מהיר, Pro למשימות מורכבות) ושאל כל שאלה!`
            : `Hello! I am **DocuFlow AI Copilot**, powered by Google Gemini. I can assist you with supplier invoice verification, Israeli VAT 17% compliance, 3-Way matching, and Priority ERP synchronization.\n\nHow can I help your accounts payable workflow today?`,
          timestamp: new Date().toISOString(),
          model: selectedModel
        }
      ]);
    }

    if (isOpen) {
      initChat();
    }
  }, [isOpen, user, language]);

  // Quick suggestion prompts
  const suggestions = [
    {
      label: language === 'he' ? 'בדיקת חשבונית סונול EVI #3299845' : 'Audit Sonol EVI invoice #3299845',
      prompt: language === 'he' 
        ? 'נתח את חשבונית סונול EVI #3299845: האם המע״מ 1.64 ₪ תואם 17% על סכום לפני מע״מ 9.08 ₪, ומהם פרטי עמדת הטעינה?'
        : 'Analyze Sonol EVI invoice #3299845: does VAT ₪1.64 match 17% on subtotal ₪9.08, and what are the charging station details?'
    },
    {
      label: language === 'he' ? 'חריגת מחיר אלקטרה PO-2026-0945' : 'Electra PO price variance resolution',
      prompt: language === 'he'
        ? 'איך לטפל בחריגת המחיר של 300 ₪ בחשבונית אלקטרה מול הזמנת רכש PO-2026-0945?'
        : 'How should we resolve the ₪300 price variance on Electra invoice versus purchase order PO-2026-0945?'
    },
    {
      label: language === 'he' ? 'סטטוס חשבוניות ממתינות לאישור' : 'Pending approvals summary',
      prompt: language === 'he'
        ? 'סכם את סטטוס החשבוניות שממתינות לאישור במערכת, ואילו מהן מכילות התראות כפולות או חריגות מתמטיות?'
        : 'Summarize the invoices pending approval in the system, noting any duplicates or math discrepancies.'
    }
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isLoading) return;

    setInput('');

    const userMessage: ChatHistoryMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
      model: selectedModel
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Save to Firestore if user logged in
    if (user) {
      saveChatMessageToFirestore(user.uid, userMessage);
    }

    try {
      // Build lightweight context from current invoice or dashboard invoices
      const contextData = {
        totalInvoices: invoices.length,
        currentViewInvoice: currentInvoice ? {
          invoiceNumber: currentInvoice.invoiceNumber,
          supplierName: currentInvoice.supplierName,
          totalAmount: currentInvoice.totalAmount,
          currency: currentInvoice.currency,
          status: currentInvoice.status,
          mathCheck: currentInvoice.mathCheck
        } : null,
        pendingCount: invoices.filter(i => i.status === 'pending_approval' || i.status === 'needs_attention').length
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          model: selectedModel,
          context: contextData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const botMessage: ChatHistoryMessage = {
        role: 'model',
        content: data.content || 'Received response',
        timestamp: data.timestamp || new Date().toISOString(),
        model: selectedModel
      };

      setMessages(prev => [...prev, botMessage]);

      if (user) {
        saveChatMessageToFirestore(user.uid, botMessage);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatHistoryMessage = {
        role: 'model',
        content: language === 'he'
          ? `⚠️ שגיאה בקבלת מענה מ-Gemini: ${err.message || 'אנא ודא שהגדרת את GEMINI_API_KEY בהגדרות המערכת.'}`
          : `⚠️ Error communicating with Gemini: ${err.message || 'Please check your GEMINI_API_KEY in platform settings.'}`,
        timestamp: new Date().toISOString(),
        model: selectedModel
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm(language === 'he' ? 'האם למחוק את היסטוריית השיחה?' : 'Clear conversation history?')) {
      if (user) {
        await clearChatMessagesInFirestore(user.uid);
      }
      setMessages([
        {
          role: 'model',
          content: language === 'he' ? 'השיחה אופסה. כיצד אוכל לסייע?' : 'Conversation cleared. How can I help you?',
          timestamp: new Date().toISOString(),
          model: selectedModel
        }
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="gemini-chatbot-window"
      className={`fixed z-50 transition-all duration-300 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden ${
        isMinimized 
          ? 'bottom-6 right-6 w-80 h-14' 
          : 'bottom-6 right-6 w-[94vw] sm:w-[460px] h-[640px] max-h-[88vh]'
      }`}
      style={{ direction: language === 'he' ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm leading-tight">
              <span>DocuFlow AI Copilot</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-mono">
                Gemini
              </span>
            </div>
            <div className="text-[10px] text-indigo-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{user ? (language === 'he' ? `מחובר: ${user.displayName || user.email}` : `Active: ${user.displayName || user.email}`) : (language === 'he' ? 'עוזר פיננסי חכם' : 'Smart AP Copilot')}</span>
              {firestoreConnected && (
                <span title="Firestore Sync Active" className="ms-1 flex items-center gap-0.5 text-emerald-300">
                  <Database className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1 text-white/80">
          <button
            id="btn-chatbot-minimize"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          {!isMinimized && (
            <button
              id="btn-chatbot-clear"
              onClick={handleClearHistory}
              className="p-1.5 hover:bg-white/10 rounded-lg transition"
              title={language === 'he' ? "נקה שיחה" : "Clear chat"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            id="btn-chatbot-close"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Model Selector Bar */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
              {language === 'he' ? 'מודל AI פעיל:' : 'Gemini Model:'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.5-flash')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                  selectedModel === 'gemini-3.5-flash'
                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="General tasks (Default balanced model)"
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>3.5 Flash</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Fast tasks (Ultra low latency)"
              >
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Flash-Lite</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                  selectedModel === 'gemini-3.1-pro-preview'
                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Particularly complex reasoning and audit tasks"
              >
                <Brain className="w-3 h-3 text-purple-300" />
                <span>3.1 Pro</span>
              </button>
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div 
            id="chat-messages-thread"
            className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40 text-xs"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                  <div className={`text-[9px] mt-1.5 flex items-center justify-between gap-2 ${
                    msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.model && (
                      <span className="font-mono text-[8.5px] opacity-75">{msg.model}</span>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-2xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-slate-500 dark:text-slate-400 text-xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-2xl flex items-center gap-2 shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>{language === 'he' ? 'Gemini מנתח ומנסח תשובה...' : 'Gemini is thinking...'}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-1.5 no-scrollbar">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-[11px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition shadow-2xs disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              id="chatbot-input-field"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'he'
                  ? 'שאל על מע״מ, התאמת הזמנות, חשבוניות סונול...'
                  : 'Ask about VAT, 3-way matching, Sonol invoices...'
              }
              disabled={isLoading}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50"
            />
            <button
              id="btn-chatbot-send"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
