import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Palette, 
  Clock, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Eye, 
  Layers,
  Hash,
  Briefcase
} from 'lucide-react';
import { enterpriseConfigService } from '../../services/enterpriseConfigService';
import { CompanyProfileSettings, CompanyContact } from '../../types/enterprise';

interface CompanySettingsTabProps {
  company: CompanyProfileSettings;
  onUpdate: (msg: string) => void;
}

export const CompanySettingsTab: React.FC<CompanySettingsTabProps> = ({
  company,
  onUpdate,
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'profile' | 'defaults' | 'branding' | 'contacts' | 'numbering'>('profile');
  
  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: company.name,
    tradeName: company.tradeName,
    taxRegistrationNumber: company.taxRegistrationNumber,
    vatNumber: company.vatNumber,
    country: company.country,
    city: company.city,
    street: company.street,
    streetNumber: company.streetNumber,
    postalCode: company.postalCode,
    phonePrimary: company.phonePrimary,
    phoneSecondary: company.phoneSecondary,
    emailPrimary: company.emailPrimary,
    emailAccounting: company.emailAccounting,
    emailPurchasing: company.emailPurchasing,
    emailImport: company.emailImport,
    website: company.website,
    dateFormat: company.dateFormat,
    numberFormat: company.numberFormat,
    fiscalYearStart: company.fiscalYearStart,
    erpType: company.erpType,
    erpCompanyCode: company.erpCompanyCode,
    erpEndpointUrl: company.erpEndpointUrl,
    erpEnvironment: company.erpEnvironment,
  });

  // Defaults state
  const [defaultsForm, setDefaultsForm] = useState({
    currency: company.defaults.currency,
    language: company.defaults.language,
    vatRatePercent: company.defaults.vatRatePercent,
    paymentTerms: company.defaults.paymentTerms,
    defaultDepartment: company.defaults.defaultDepartment,
    defaultApproverEmail: company.defaults.defaultApproverEmail,
    defaultDocumentType: company.defaults.defaultDocumentType,
    workingHoursStart: company.defaults.workingHoursStart,
    workingHoursEnd: company.defaults.workingHoursEnd,
    workingDays: company.defaults.workingDays,
  });

  // Branding state
  const [brandingForm, setBrandingForm] = useState({
    logoUrl: company.branding.logoUrl,
    faviconUrl: company.branding.faviconUrl,
    primaryColor: company.branding.primaryColor,
    secondaryColor: company.branding.secondaryColor,
    documentHeaderHtml: company.branding.documentHeaderHtml,
    documentFooterHtml: company.branding.documentFooterHtml,
    emailSignatureText: company.branding.emailSignatureText,
  });

  // Numbering & Doc rules state
  const [numberingForm, setNumberingForm] = useState({
    invoiceNumberingPattern: company.invoiceNumberingPattern,
    importNumberingPattern: company.importNumberingPattern,
    workflowNumberingPattern: company.workflowNumberingPattern,
    acceptedDocumentTypes: company.acceptedDocumentTypes || [],
  });

  // Contact modal state
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<CompanyContact | null>(null);
  const [contactForm, setContactForm] = useState<Omit<CompanyContact, 'id'>>({
    name: '',
    role: '',
    email: '',
    phone: '',
    department: 'הנהלת חשבונות',
    isActive: true,
  });

  // Branding preview tab
  const [previewTab, setPreviewTab] = useState<'document' | 'email'>('document');

  // Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    enterpriseConfigService.updateCompany(company.id, profileForm);
    onUpdate('פרטי החברה והגדרות ה-ERP עודכנו בהצלחה');
  };

  // Save Defaults
  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    enterpriseConfigService.updateCompany(company.id, {
      defaults: {
        ...company.defaults,
        ...defaultsForm,
      },
    });
    onUpdate('ברירות המחדל של החברה נשמרו בהצלחה');
  };

  // Save Branding
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    enterpriseConfigService.updateCompany(company.id, {
      branding: {
        ...company.branding,
        ...brandingForm,
      },
    });
    onUpdate('מיתוג החברה ותבניות המסמכים עודכנו בהצלחה');
  };

  // Save Numbering
  const handleSaveNumbering = (e: React.FormEvent) => {
    e.preventDefault();
    enterpriseConfigService.updateCompany(company.id, numberingForm);
    onUpdate('תבניות המספור וסוגי המסמכים המורשים עודכנו');
  };

  // Contact Actions
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) return;

    if (editingContact) {
      enterpriseConfigService.updateCompanyContact(company.id, editingContact.id, contactForm);
      onUpdate(`איש הקשר ${contactForm.name} עודכן`);
      setEditingContact(null);
    } else {
      enterpriseConfigService.addCompanyContact(company.id, contactForm);
      onUpdate(`איש הקשר ${contactForm.name} נוסף לחברה`);
    }

    setContactForm({
      name: '',
      role: '',
      email: '',
      phone: '',
      department: 'הנהלת חשבונות',
      isActive: true,
    });
    setShowAddContact(false);
  };

  const handleDeleteContact = (contactId: string, name: string) => {
    if (window.confirm(`האם למחוק את איש הקשר ${name}?`)) {
      enterpriseConfigService.deleteCompanyContact(company.id, contactId);
      onUpdate(`איש הקשר ${name} נמחק`);
    }
  };

  const handleToggleContactActive = (contact: CompanyContact) => {
    enterpriseConfigService.updateCompanyContact(company.id, contact.id, {
      isActive: !contact.isActive,
    });
    onUpdate(`סטטוס איש הקשר ${contact.name} עודכן`);
  };

  const toggleDocType = (docType: string) => {
    const current = numberingForm.acceptedDocumentTypes;
    const next = current.includes(docType)
      ? current.filter(t => t !== docType)
      : [...current, docType];
    setNumberingForm({ ...numberingForm, acceptedDocumentTypes: next });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubSection('profile')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubSection === 'profile'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          פרטי חברה ו-ERP
        </button>

        <button
          onClick={() => setActiveSubSection('defaults')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubSection === 'defaults'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          ברירות מחדל ושעות עבודה
        </button>

        <button
          onClick={() => setActiveSubSection('branding')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubSection === 'branding'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          מיתוג ותצוגה מקדימה
        </button>

        <button
          onClick={() => setActiveSubSection('contacts')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubSection === 'contacts'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          אנשי קשר בחברה ({company.contacts?.length || 0})
        </button>

        <button
          onClick={() => setActiveSubSection('numbering')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubSection === 'numbering'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          תבניות מספור וסוגי מסמכים
        </button>
      </div>

      {/* 1. Profile Section */}
      {activeSubSection === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-indigo-600" />
              פרטים מזהים וכתובות (Company Identification & Address)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  שם רשמי של החברה *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  שם מסחרי (Trade Name)
                </label>
                <input
                  type="text"
                  value={profileForm.tradeName}
                  onChange={(e) => setProfileForm({ ...profileForm, tradeName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מספר ח.פ / רישום חברה *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.taxRegistrationNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, taxRegistrationNumber: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מספר עוסק מורשה / מע״מ
                </label>
                <input
                  type="text"
                  value={profileForm.vatNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, vatNumber: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מדינה
                </label>
                <input
                  type="text"
                  value={profileForm.country}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  עיר
                </label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  רחוב ומספר בית
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={profileForm.street}
                    placeholder="שם הרחוב"
                    onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                    className="col-span-2 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={profileForm.streetNumber}
                    placeholder="מספר"
                    onChange={(e) => setProfileForm({ ...profileForm, streetNumber: e.target.value })}
                    className="col-span-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מיקוד
                </label>
                <input
                  type="text"
                  value={profileForm.postalCode}
                  onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Communications */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Phone className="w-4 h-4 text-emerald-600" />
              ערוצי קשר ותקשורת (Phones & Email Inboxes)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  טלפון ראשי
                </label>
                <input
                  type="text"
                  value={profileForm.phonePrimary}
                  onChange={(e) => setProfileForm({ ...profileForm, phonePrimary: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  טלפון משני
                </label>
                <input
                  type="text"
                  value={profileForm.phoneSecondary}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneSecondary: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  אתר אינטרנט
                </label>
                <input
                  type="text"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  אימייל הנהלת חשבונות (AP Invoices)
                </label>
                <input
                  type="email"
                  value={profileForm.emailAccounting}
                  onChange={(e) => setProfileForm({ ...profileForm, emailAccounting: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  אימייל מחלקת רכש
                </label>
                <input
                  type="email"
                  value={profileForm.emailPurchasing}
                  onChange={(e) => setProfileForm({ ...profileForm, emailPurchasing: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  אימייל תיקי יבוא ועמילות מכס
                </label>
                <input
                  type="email"
                  value={profileForm.emailImport}
                  onChange={(e) => setProfileForm({ ...profileForm, emailImport: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* ERP Integration details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              ממשק ה-ERP של החברה (ERP Connection & Environment)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מערכת ERP
                </label>
                <select
                  value={profileForm.erpType}
                  onChange={(e) => setProfileForm({ ...profileForm, erpType: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="Priority">Priority ERP (OData)</option>
                  <option value="SAP">SAP Business One</option>
                  <option value="NetSuite">Oracle NetSuite</option>
                  <option value="Generic_REST">Custom Webhook / REST</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  קוד החברה ב-ERP
                </label>
                <input
                  type="text"
                  value={profileForm.erpCompanyCode}
                  onChange={(e) => setProfileForm({ ...profileForm, erpCompanyCode: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  סביבת עבודה
                </label>
                <select
                  value={profileForm.erpEnvironment}
                  onChange={(e) => setProfileForm({ ...profileForm, erpEnvironment: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="production">Production (סביבה חיה)</option>
                  <option value="test">Sandbox / Test (טסטים)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  תחילת שנת מס (Fiscal Year)
                </label>
                <input
                  type="text"
                  value={profileForm.fiscalYearStart}
                  onChange={(e) => setProfileForm({ ...profileForm, fiscalYearStart: e.target.value })}
                  placeholder="01/01"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  כתובת שרת ה-API של ה-ERP (Endpoint URL)
                </label>
                <input
                  type="text"
                  value={profileForm.erpEndpointUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, erpEndpointUrl: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              שמור פרטי חברה ו-ERP
            </button>
          </div>
        </form>
      )}

      {/* 2. Defaults & Business Hours */}
      {activeSubSection === 'defaults' && (
        <form onSubmit={handleSaveDefaults} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-indigo-600" />
              ברירות מחדל פיננסיות וקביעת תנאים
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מטבע ברירת מחדל
                </label>
                <select
                  value={defaultsForm.currency}
                  onChange={(e) => setDefaultsForm({ ...defaultsForm, currency: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="ILS">שקל חדש (₪ ILS)</option>
                  <option value="EUR">אירו (€ EUR)</option>
                  <option value="USD">דולר ארה״ב ($ USD)</option>
                  <option value="GBP">פאונד (£ GBP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  שיעור מע״מ ברירת מחדל (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={defaultsForm.vatRatePercent}
                  onChange={(e) => setDefaultsForm({ ...defaultsForm, vatRatePercent: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  תנאי תשלום ברירת מחדל
                </label>
                <select
                  value={defaultsForm.paymentTerms}
                  onChange={(e) => setDefaultsForm({ ...defaultsForm, paymentTerms: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="מיידי">מיידי (Due on Receipt)</option>
                  <option value="שוטף + 30">שוטף + 30</option>
                  <option value="שוטף + 45">שוטף + 45</option>
                  <option value="שוטף + 60">שוטף + 60</option>
                  <option value="שוטף + 90">שוטף + 90</option>
                  <option value="30 jours fin de mois">30 jours fin de mois (France)</option>
                  <option value="Net 30">Net 30 (US)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  מחלקה ברירת מחדל
                </label>
                <input
                  type="text"
                  value={defaultsForm.defaultDepartment}
                  onChange={(e) => setDefaultsForm({ ...defaultsForm, defaultDepartment: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  גורם מאשר ראשי (אימייל)
                </label>
                <input
                  type="email"
                  value={defaultsForm.defaultApproverEmail}
                  onChange={(e) => setDefaultsForm({ ...defaultsForm, defaultApproverEmail: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  סוג מסמך ראשי בקליטה
                </label>
                <select
                  value={defaultsForm.defaultDocumentType}
                  onChange={(e) => setDefaultsForm({ ...defaultsForm, defaultDocumentType: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="tax_invoice">חשבונית מס</option>
                  <option value="invoice">חשבונית כללית</option>
                  <option value="delivery_note">תעודת משלוח</option>
                  <option value="purchase_order">הזמנת רכש</option>
                  <option value="customs_document">מסמך מכס ויבוא</option>
                </select>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-amber-600" />
              שעות פעילות וימי עבודה (SLA & Working Hours)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  שעת תחילת פעילות יומית
                </label>
                <input
                  type="time"
                  value={defaultsForm.workingHoursStart}
                  onChange={(e) => setDefaultsForm({ ...defaultsForm, workingHoursStart: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  שעת סיום פעילות יומית
                </label>
                <input
                  type="time"
                  value={defaultsForm.workingHoursEnd}
                  onChange={(e) => setDefaultsForm({ ...defaultsForm, workingHoursEnd: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              זמני SLA וספירת שעות לאישורי תשלום יחושבו רק בתוך חלון שעות הפעילות שנקבע כאן.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              שמור ברירות מחדל
            </button>
          </div>
        </form>
      )}

      {/* 3. Branding & Live Preview */}
      {activeSubSection === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSaveBranding} className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Palette className="w-4 h-4 text-indigo-600" />
                זהות מותג וצבעים (Branding Settings)
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    כתובת תמונת לוגו החברה (Logo URL)
                  </label>
                  <input
                    type="text"
                    value={brandingForm.logoUrl}
                    onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      צבע ראשי (Primary Color)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingForm.primaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                        className="w-9 h-9 p-0.5 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-white"
                      />
                      <input
                        type="text"
                        value={brandingForm.primaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                        className="flex-1 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      צבע משני (Secondary Color)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingForm.secondaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                        className="w-9 h-9 p-0.5 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-white"
                      />
                      <input
                        type="text"
                        value={brandingForm.secondaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                        className="flex-1 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    כותרת עליונה במסמכים ממוחשבים (Header HTML)
                  </label>
                  <textarea
                    rows={2}
                    value={brandingForm.documentHeaderHtml}
                    onChange={(e) => setBrandingForm({ ...brandingForm, documentHeaderHtml: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    כותרת תחתונה במסמכים ממוחשבים (Footer HTML)
                  </label>
                  <textarea
                    rows={2}
                    value={brandingForm.documentFooterHtml}
                    onChange={(e) => setBrandingForm({ ...brandingForm, documentFooterHtml: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    חתימת אימייל בהודעות אישור רכש (Email Signature)
                  </label>
                  <textarea
                    rows={3}
                    value={brandingForm.emailSignatureText}
                    onChange={(e) => setBrandingForm({ ...brandingForm, emailSignatureText: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  שמור הגדרות מיתוג
                </button>
              </div>
            </div>
          </form>

          {/* Live Preview Panel */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-600" />
                תצוגה מקדימה חיה (Live Interactive Preview)
              </span>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('document')}
                  className={`px-3 py-1 ${previewTab === 'document' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}
                >
                  מסמך ממוחשב
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('email')}
                  className={`px-3 py-1 ${previewTab === 'email' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}
                >
                  אימייל אישור
                </button>
              </div>
            </div>

            {previewTab === 'document' ? (
              <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 shadow-md min-h-[420px] flex flex-col justify-between font-sans">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      {brandingForm.logoUrl ? (
                        <img src={brandingForm.logoUrl} alt="Logo" className="h-10 w-auto object-contain rounded" />
                      ) : (
                        <div className="h-10 w-24 bg-slate-100 rounded flex items-center justify-center font-bold text-xs text-slate-500">
                          לוגו
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm" style={{ color: brandingForm.primaryColor }}>
                          {company.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ח.פ: {company.taxRegistrationNumber} | עוסק מורשה: {company.vatNumber}
                        </div>
                      </div>
                    </div>
                    <div className="text-end text-xs">
                      <div className="font-bold text-indigo-900">פקודת הוצאה / קליטת חשבונית</div>
                      <div className="text-slate-400 font-mono">מס׳ אסמכתא: INV-2026-004821</div>
                    </div>
                  </div>

                  <div
                    className="text-xs mb-4 text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200"
                    dangerouslySetInnerHTML={{ __html: brandingForm.documentHeaderHtml || '<div>כותרת עליונה ריקה</div>' }}
                  />

                  {/* Dummy Table */}
                  <table className="w-full text-xs text-right mb-4">
                    <thead>
                      <tr className="border-b text-slate-500" style={{ borderBottomColor: brandingForm.secondaryColor }}>
                        <th className="py-1">תיאור טובין / שירות</th>
                        <th className="py-1 text-center">כמות</th>
                        <th className="py-1">מחיר יח׳</th>
                        <th className="py-1 text-left">סה״כ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-1.5 font-medium">שרתי ענן ושירותי אחסון חודשיים</td>
                        <td className="py-1.5 text-center">1</td>
                        <td className="py-1.5">3,200.00 ₪</td>
                        <td className="py-1.5 text-left font-bold">3,200.00 ₪</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-medium">רישיונות תוכנת OCR & AI לשנת 2026</td>
                        <td className="py-1.5 text-center">5</td>
                        <td className="py-1.5">450.00 ₪</td>
                        <td className="py-1.5 text-left font-bold">2,250.00 ₪</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold">סה״כ כולל מע״מ ({company.defaults.vatRatePercent}%):</span>
                    <span className="text-base font-bold" style={{ color: brandingForm.primaryColor }}>
                      6,376.50 ₪
                    </span>
                  </div>
                  <div
                    className="text-[10px] text-slate-500"
                    dangerouslySetInnerHTML={{ __html: brandingForm.documentFooterHtml || '<div>כותרת תחתונה</div>' }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 border-b pb-2 text-slate-500 text-[11px]">
                    <span>נמען: <strong>michal.benari@techlogix.co.il</strong></span>
                    <span>•</span>
                    <span>נושא: חשבונית לתשלום 6,376.50 ₪ ממתינה לאישורך</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">
                    שלום מיכל,<br />
                    חשבונית מס מספק <strong>מיקרוסופט ישראל בע״מ</strong> על סך <strong>6,376.50 ₪</strong> נקלטה במערכת בהצלחה ועברה בדיקת התאמה (3-Way Match).
                  </p>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-900 dark:text-indigo-200 font-medium">
                    לחץ כאן לאישור התשלום והעברה לשידור ב-Priority ERP
                  </div>
                  <div className="border-t pt-2 text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-line font-mono">
                    {brandingForm.emailSignatureText || 'בברכה,\nצוות הכספים'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Company Contacts */}
      {activeSubSection === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                אנשי קשר ורפרנטים בחברה (Company Contacts Directory)
              </h3>
              <p className="text-xs text-slate-500">
                אנשי קשר לטיפול בחשבוניות, בירורים, תשלומים ועמילות מכס לפי מחלקה
              </p>
            </div>

            <button
              onClick={() => {
                setEditingContact(null);
                setContactForm({
                  name: '',
                  role: '',
                  email: '',
                  phone: '',
                  department: 'הנהלת חשבונות',
                  isActive: true,
                });
                setShowAddContact(true);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              הוסף איש קשר
            </button>
          </div>

          {/* Contacts Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">מחלקה</th>
                  <th className="p-3">שם מלא</th>
                  <th className="p-3">תפקיד</th>
                  <th className="p-3">דוא״ל</th>
                  <th className="p-3">טלפון ישיר</th>
                  <th className="p-3 text-center">סטטוס</th>
                  <th className="p-3 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {company.contacts?.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {contact.department}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {contact.name}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {contact.role}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {contact.email}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {contact.phone}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleContactActive(contact)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          contact.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {contact.isActive ? 'פעיל' : 'מושבת'}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingContact(contact);
                            setContactForm({
                              name: contact.name,
                              role: contact.role,
                              email: contact.email,
                              phone: contact.phone,
                              department: contact.department,
                              isActive: contact.isActive,
                            });
                            setShowAddContact(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id, contact.name)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add / Edit Contact Modal */}
          {showAddContact && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingContact ? 'עריכת איש קשר' : 'הוספת איש קשר חדש לחברה'}
                </h4>

                <form onSubmit={handleSaveContact} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      שם מלא *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      מחלקה
                    </label>
                    <select
                      value={contactForm.department}
                      onChange={(e) => setContactForm({ ...contactForm, department: e.target.value as any })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="הנהלת חשבונות">הנהלת חשבונות</option>
                      <option value="כספים">כספים</option>
                      <option value="רכש">רכש</option>
                      <option value="יבוא">יבוא ועמילות מכס</option>
                      <option value="לוגיסטיקה">לוגיסטיקה ומרלוג</option>
                      <option value="IT">IT ומערכות מידע</option>
                      <option value="הנהלה">הנהלה כללית</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      תפקיד
                    </label>
                    <input
                      type="text"
                      value={contactForm.role}
                      onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      דוא״ל *
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      טלפון נייד / ישיר
                    </label>
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      ביטול
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                    >
                      שמור
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Numbering & Accepted Doc Types */}
      {activeSubSection === 'numbering' && (
        <form onSubmit={handleSaveNumbering} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Hash className="w-4 h-4 text-indigo-600" />
              תבניות מספור אוטומטיות (Document Numbering Patterns)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  תבנית מספור חשבוניות ופקודות
                </label>
                <input
                  type="text"
                  value={numberingForm.invoiceNumberingPattern}
                  onChange={(e) => setNumberingForm({ ...numberingForm, invoiceNumberingPattern: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  placeholder="INV-{YYYY}-{NUM:6}"
                />
                <span className="text-[11px] text-slate-400">לדוגמה: INV-2026-000124</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  תבנית מספור תיקי יבוא ומכס
                </label>
                <input
                  type="text"
                  value={numberingForm.importNumberingPattern}
                  onChange={(e) => setNumberingForm({ ...numberingForm, importNumberingPattern: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  placeholder="IMP-{YYYY}-{NUM:5}"
                />
                <span className="text-[11px] text-slate-400">לדוגמה: IMP-2026-00042</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  תבנית מספור תהליכי אישור (Workflow)
                </label>
                <input
                  type="text"
                  value={numberingForm.workflowNumberingPattern}
                  onChange={(e) => setNumberingForm({ ...numberingForm, workflowNumberingPattern: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  placeholder="WF-{YYYY}-{NUM:4}"
                />
                <span className="text-[11px] text-slate-400">לדוגמה: WF-2026-0182</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-emerald-600" />
              סוגי מסמכים מורשים לקליטה בחברה זו
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { id: 'tax_invoice', label: 'חשבונית מס' },
                { id: 'invoice', label: 'חשבונית עסקה / רגילה' },
                { id: 'credit_note', label: 'חשבונית זיכוי' },
                { id: 'purchase_order', label: 'הזמנת רכש (PO)' },
                { id: 'delivery_note', label: 'תעודת משלוח' },
                { id: 'customs_document', label: 'הצהרת יבוא / רשימון מכס' },
                { id: 'receipt', label: 'קבלה על תשלום' },
                { id: 'proforma', label: 'חשבונית פרופורמה (Proforma)' },
              ].map((doc) => (
                <label
                  key={doc.id}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    numberingForm.acceptedDocumentTypes.includes(doc.id)
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 font-bold text-indigo-900 dark:text-indigo-200'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={numberingForm.acceptedDocumentTypes.includes(doc.id)}
                    onChange={() => toggleDocType(doc.id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{doc.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              שמור תבניות מספור
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
