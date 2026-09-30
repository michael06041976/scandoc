import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InboxView } from './components/InboxView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { SuppliersView } from './components/SuppliersView';
import { MatchingView } from './components/MatchingView';
import { ImportDossiersView } from './components/ImportDossiersView';
import { ERPView } from './components/ERPView';
import { ControlCenterView } from './components/ControlCenterView';
import { ArchiveView } from './components/ArchiveView';
import { GeminiChatbot } from './components/GeminiChatbot';
import { InvoiceScanModal } from './components/InvoiceScanModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  saveInvoiceToFirestore, 
  loadUserInvoicesFromFirestore,
  saveSupplierToFirestore,
  loadUserSuppliersFromFirestore,
  deleteSupplierFromFirestore
} from './services/firestoreService';
import { Sparkles } from 'lucide-react';

import { 
  InvoiceDocument, 
  Supplier,
  Language, 
  ThemeMode, 
  Company 
} from './types';
import { 
  mockInvoices, 
  mockSuppliers, 
  mockPurchaseOrders, 
  mockReceipts, 
  mockImportDossiers, 
  mockCompanies 
} from './data/mockData';
import { defaultERPAdapter } from './services/erpAdapter';

function AppContent() {
  const { user, firestoreConnected } = useAuth();
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('docuflow_lang');
      if (saved === 'he' || saved === 'en' || saved === 'fr') return saved as Language;
    } catch (e) {
      // ignore
    }
    return 'he';
  });
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [currentView, setCurrentView] = useState<string>('dashboard');
  
  const [companies] = useState<Company[]>(mockCompanies);
  const [selectedCompany, setSelectedCompany] = useState<Company>(mockCompanies[0]);

  const [invoices, setInvoices] = useState<InvoiceDocument[]>(mockInvoices);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [purchaseOrders] = useState(mockPurchaseOrders);
  const [receipts] = useState(mockReceipts);
  const [importDossiers, setImportDossiers] = useState(mockImportDossiers);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [inboxFilterMode, setInboxFilterMode] = useState<string>('all');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isGlobalScanModalOpen, setIsGlobalScanModalOpen] = useState(false);

  // Sync user invoices and suppliers with Firestore on login
  useEffect(() => {
    if (user) {
      // Invoices
      loadUserInvoicesFromFirestore(user.uid)
        .then(persistedMap => {
          const keys = Object.keys(persistedMap);
          if (keys.length > 0) {
            setInvoices(prev => {
              const updated = prev.map(inv => {
                const persisted = persistedMap[inv.id];
                return persisted ? { ...inv, ...persisted } : inv;
              });
              keys.forEach(id => {
                if (!updated.some(inv => inv.id === id)) {
                  const persisted = persistedMap[id] as InvoiceDocument;
                  if (persisted && persisted.id && persisted.invoiceNumber) {
                    updated.unshift(persisted);
                  }
                }
              });
              return updated;
            });
          } else {
            // Seed user's Firestore with initial mock invoices for instant persistence
            mockInvoices.forEach(inv => {
              saveInvoiceToFirestore(user.uid, inv).catch(() => {});
            });
          }
        })
        .catch(err => {
          console.error('Failed to load user invoices from Firestore:', err);
        });

      // Suppliers
      loadUserSuppliersFromFirestore(user.uid)
        .then(persistedMap => {
          const keys = Object.keys(persistedMap);
          if (keys.length > 0) {
            setSuppliers(prev => {
              const updated = prev.map(s => persistedMap[s.id] || s);
              keys.forEach(id => {
                if (!prev.some(s => s.id === id)) {
                  updated.unshift(persistedMap[id]);
                }
              });
              return updated;
            });
          } else {
            // Seed initial suppliers into user Firestore
            mockSuppliers.forEach(sup => {
              saveSupplierToFirestore(user.uid, sup).catch(() => {});
            });
          }
        })
        .catch(err => {
          console.error('Failed to load user suppliers from Firestore:', err);
        });
    }
  }, [user]);

  const handleUpdateSupplier = (updated: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
    if (user) {
      saveSupplierToFirestore(user.uid, updated).catch(() => {});
    }
  };

  const handleAddSupplier = (newSup: Supplier) => {
    setSuppliers(prev => [newSup, ...prev]);
    if (user) {
      saveSupplierToFirestore(user.uid, newSup).catch(() => {});
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    if (user) {
      deleteSupplierFromFirestore(user.uid, supplierId).catch(() => {});
    }
  };

  const handleAddInvoices = (newInvoices: InvoiceDocument[]) => {
    setInvoices(prev => {
      const newMap = new Map(newInvoices.map(i => [i.id, i]));
      // Update existing ones if matching id
      const updated = prev.map(i => newMap.has(i.id) ? { ...i, ...newMap.get(i.id)! } : i);
      // Add any completely new ones to the top
      const existingIds = new Set(prev.map(i => i.id));
      const toAdd = newInvoices.filter(i => !existingIds.has(i.id));
      const combined = [...toAdd, ...updated];
      if (user) {
        newInvoices.forEach(inv => saveInvoiceToFirestore(user.uid, inv).catch(() => {}));
      }
      return combined;
    });
  };

  const handleNavigateToInbox = (filterMode = 'all') => {
    setInboxFilterMode(filterMode);
    setCurrentView('invoices');
  };

  // Sync RTL / LTR dynamically with language & persist
  useEffect(() => {
    try {
      localStorage.setItem('docuflow_lang', language);
    } catch (e) {
      // ignore
    }
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Sync dark class on document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Derived counts
  const needsAttentionCount = invoices.filter(
    inv => inv.status === 'needs_attention' || inv.duplicateRisk === 'high' || !inv.mathCheck.passed
  ).length;

  const inboxCount = invoices.length;

  // Handle invoice update from modal
  const handleUpdateInvoice = (updated: InvoiceDocument) => {
    setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
    setSelectedInvoice(updated);
    if (user) {
      saveInvoiceToFirestore(user.uid, updated).catch(() => {});
    }
  };

  // Handle post to Priority ERP
  const handlePostToPriority = async (invoice: InvoiceDocument) => {
    const res = await defaultERPAdapter.createInvoice(invoice);
    if (res.success && res.erpDocId) {
      const updated: InvoiceDocument = {
        ...invoice,
        erpDocumentId: res.erpDocId,
        erpStatus: 'synced',
        status: 'posted_to_erp',
        erpSyncedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        auditTrail: [
          {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            user: user?.displayName || 'Priority ERP Connector',
            action: 'Posted to Priority ERP',
            details: `Écriture comptable enregistrée avec succès. ID Document : ${res.erpDocId}`,
          },
          ...invoice.auditTrail,
        ],
      };
      handleUpdateInvoice(updated);
    }
  };

  // Handle Sync All
  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setInvoices(prev => {
        const synced = prev.map(inv => {
          if (inv.status === 'ready_for_erp' || inv.status === 'approved') {
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const updated: InvoiceDocument = {
              ...inv,
              status: 'posted_to_erp',
              erpStatus: 'synced',
              erpDocumentId: `PRI-INV-2026-${randomSuffix}`,
              erpSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            if (user) {
              saveInvoiceToFirestore(user.uid, updated).catch(() => {});
            }
            return updated;
          }
          return inv;
        });
        return synced;
      });
      setIsSyncing(false);
    }, 1200);
  };

  // Upload a mock document dynamically or receive scanned document
  const handleUploadMockDocument = (customDoc?: InvoiceDocument) => {
    if (customDoc) {
      handleAddInvoices([customDoc]);
      setSelectedInvoice(customDoc);
      return;
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newDoc: InvoiceDocument = {
      id: `doc-new-${randomId}`,
      companyId: selectedCompany.id,
      fileName: `חשבונית_ספק_חדשה_INV-${randomId}.pdf`,
      fileUrl: '/mock/new_invoice.pdf',
      fileType: 'pdf',
      documentType: 'tax_invoice',
      supplierId: 'sup-1',
      supplierName: 'תנובה מרכז שיווק בע״מ',
      supplierTaxId: '520034567',
      invoiceNumber: `TN-${randomId}`,
      issueDate: '2026-09-18',
      dueDate: '2026-11-18',
      currency: 'ILS',
      subtotal: 5000,
      vatAmount: 850,
      totalAmount: 5850,
      purchaseOrderNumber: 'PO-2026-0881',
      receiptNumber: 'RC-2026-00412',
      overallConfidence: 97,
      status: 'ready_for_erp',
      duplicateRisk: 'none',
      fields: {
        supplierName: { field: 'supplierName', label: 'ספק', value: 'תנובה מרכז שיווק בע״מ', confidence: 98, status: 'valid' },
        invoiceNumber: { field: 'invoiceNumber', label: 'מספר חשבונית', value: `TN-${randomId}`, confidence: 97, status: 'valid' },
        totalAmount: { field: 'totalAmount', label: 'סה״כ לתשלום', value: '5,850.00 ₪', confidence: 98, status: 'valid' },
      },
      lines: [
        {
          id: `line-${randomId}`,
          description: 'חומרי גלם טריים מובחרים',
          quantity: 50,
          unitPrice: 100,
          vatPercent: 17,
          total: 5000,
          confidence: 96,
        }
      ],
      mathCheck: {
        passed: true,
        calculatedSubtotal: 5000,
        statedSubtotal: 5000,
        calculatedVat: 850,
        statedVat: 850,
        calculatedTotal: 5850,
        statedTotal: 5850,
        linesSum: 5000,
        discrepancies: []
      },
      duplicateCheck: {
        risk: 'none',
        score: 0,
        reasons: [],
      },
      threeWayMatch: {
        status: 'matched_100',
        poNumber: 'PO-2026-0881',
        receiptNumber: 'RC-2026-00412',
        priceVariance: 0,
        quantityVariance: 0,
        discrepancies: [],
      },
      assignedUser: user?.displayName || 'Michal Ben-Ari',
      receivedAt: new Date().toISOString(),
      correctionsCount: 0,
      comments: [],
      auditTrail: [
        {
          id: `audit-${randomId}-1`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: user?.displayName || 'Finance Automation Engine',
          action: 'Document Uploaded & Parsed',
          details: 'Extracted OCR data with 97% confidence',
        },
      ],
    };

    handleAddInvoices([newDoc]);
    setSelectedInvoice(newDoc);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        companies={companies}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        needsAttentionCount={needsAttentionCount}
        inboxCount={inboxCount}
        onOpenChatbot={() => setIsChatbotOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          currentView={currentView}
          language={language}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenUpload={() => setIsGlobalScanModalOpen(true)}
          unreadAlertsCount={needsAttentionCount}
          onToggleChatbot={() => setIsChatbotOpen(prev => !prev)}
          isChatbotOpen={isChatbotOpen}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
          {currentView === 'dashboard' && (
            <DashboardView
              invoices={invoices}
              language={language}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onGoToInbox={handleNavigateToInbox}
            />
          )}

          {(currentView === 'inbox' || currentView === 'invoices' || currentView === 'needs_attention' || currentView === 'approvals') && (
            <InboxView
              invoices={invoices}
              language={language}
              filterMode={
                currentView === 'needs_attention' 
                  ? 'needs_attention' 
                  : currentView === 'approvals' 
                    ? 'pending_approval' 
                    : inboxFilterMode
              }
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onUploadMockDocument={handleUploadMockDocument}
              onAddInvoices={handleAddInvoices}
              onNavigateToArchive={() => setCurrentView('archive')}
            />
          )}

          {currentView === 'archive' && (
            <ArchiveView
              invoices={invoices}
              language={language}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            />
          )}

          {currentView === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              language={language}
              onUpdateSupplier={handleUpdateSupplier}
              onAddSupplier={handleAddSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}

          {currentView === 'matching' && (
            <MatchingView
              invoices={invoices}
              purchaseOrders={purchaseOrders}
              receipts={receipts}
              language={language}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            />
          )}

          {currentView === 'purchase_orders' && (
            <MatchingView
              invoices={invoices}
              purchaseOrders={purchaseOrders}
              receipts={receipts}
              language={language}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            />
          )}

          {currentView === 'receipts' && (
            <MatchingView
              invoices={invoices}
              purchaseOrders={purchaseOrders}
              receipts={receipts}
              language={language}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            />
          )}

          {currentView === 'imports' && (
            <ImportDossiersView
              dossiers={importDossiers}
              onAddDossier={(newDossier) => setImportDossiers(prev => [newDossier, ...prev])}
              language={language}
            />
          )}

          {currentView === 'erp_priority' && (
            <ERPView
              invoices={invoices}
              language={language}
              onSyncAll={handleSyncAll}
              isSyncing={isSyncing}
            />
          )}

          {currentView === 'control_center' && (
            <ControlCenterView
              language={language}
              invoices={invoices}
              onAddInvoices={handleAddInvoices}
              onNavigateToInbox={handleNavigateToInbox}
              onNavigateToArchive={() => setCurrentView('archive')}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            />
          )}
        </main>
      </div>

      {/* Flagship Split-Screen Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          language={language}
          onClose={() => setSelectedInvoice(null)}
          onUpdateInvoice={handleUpdateInvoice}
          onPostToPriority={handlePostToPriority}
        />
      )}

      {/* Floating Gemini Copilot Trigger Button (When Chatbot is closed) */}
      {!isChatbotOpen && (
        <button
          id="btn-floating-gemini-trigger"
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-6 end-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group"
          title="Open Gemini AI Copilot"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </div>
          <div className="flex flex-col text-start">
            <span className="text-xs font-bold leading-tight flex items-center gap-1">
              DocuFlow AI Copilot
              <span className="text-[9px] px-1 py-0.2 bg-white/20 rounded font-mono">Gemini</span>
            </span>
            <span className="text-[10px] text-indigo-100">
              {language === 'he' ? 'שאל על חשבוניות ומע״מ' : 'Ask about invoices & VAT'}
            </span>
          </div>
        </button>
      )}

      {/* Gemini Chatbot Window */}
      <GeminiChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        language={language}
        invoices={invoices}
        currentInvoice={selectedInvoice}
      />

      {/* Global Invoice Scan & OCR Modal */}
      <InvoiceScanModal
        isOpen={isGlobalScanModalOpen}
        onClose={() => setIsGlobalScanModalOpen(false)}
        language={language}
        onScanComplete={(scannedInvoice, autoOpenPreview) => {
          handleUploadMockDocument(scannedInvoice);
          if (autoOpenPreview) {
            setSelectedInvoice(scannedInvoice);
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
