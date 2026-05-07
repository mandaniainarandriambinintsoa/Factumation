import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Loader2, CheckCircle2, FileText, Download, Pencil, Mail, Save, Lock, Crown } from 'lucide-react';
import { QuoteData, LineItem, FiscalInfo } from '../types';

const loadHtml2Pdf = () => import('html2pdf.js').then(m => m.default);
import { CURRENCIES, PAYMENT_METHODS, FISCAL_REGIONS } from '../constants';
import { sendQuoteEmail, isEmailConfigured } from '../services/emailService';
import { sendQuoteWithPdfToWebhook } from '../services/quoteService';
import { saveQuote } from '../services/historyService';
import { getDefaultCompany } from '../services/companyService';
import { DEFAULT_QUOTE_WEBHOOK_URL } from '../constants';

const ADMIN_EMAIL = 'mandaniaina.randriambinintsoa@gmail.com';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import SEOHead from './SEOHead';
import AuthModal from './AuthModal';
import ClientSelector from './ClientSelector';
import CompanySelector from './CompanySelector';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const getInitialFormData = (): QuoteData => {
  const today = new Date();
  const validityDate = new Date(today);
  validityDate.setDate(validityDate.getDate() + 30);

  return {
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    logoUrl: '',
    fiscalInfo: {
      region: 'NONE',
      nif: '',
      stat: '',
      siret: '',
      tvaNumber: ''
    },
    clientName: '',
    clientAddress: '',
    clientEmail: '',
    clientPhone: '',
    clientFiscalInfo: {
      region: 'NONE',
      nif: '',
      stat: '',
      siret: '',
      tvaNumber: ''
    },
    quoteNumber: `DEV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    quoteDate: today.toISOString().split('T')[0],
    validityDate: validityDate.toISOString().split('T')[0],
    currency: 'EUR',
    paymentMethod: 'bank_transfer',
    items: [
      { id: Date.now().toString(), name: '', quantity: 1, unitPrice: 0 }
    ]
  };
};

const QuoteForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successAction, setSuccessAction] = useState<'pdf' | 'email' | 'saved' | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<'save' | 'email' | null>(null);
  const [savingToHistory, setSavingToHistory] = useState(false);
  const [lastGeneratedPdfBase64, setLastGeneratedPdfBase64] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);

  const [formData, setFormData] = useState<QuoteData>(getInitialFormData());

  const { user } = useAuth();
  const { t, locale } = useI18n();
  const { canCreateQuote, isPro, plan, usage, refresh: refreshSubscription } = useSubscription();

  const isAdmin = user?.email === ADMIN_EMAIL;

  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDefaultCompany = async () => {
      if (user) {
        const { data } = await getDefaultCompany();
        if (data) {
          const today = new Date();
          const validityDate = new Date(today);
          validityDate.setDate(validityDate.getDate() + 30);

          setFormData(prev => ({
            ...prev,
            companyName: prev.companyName || data.name || '',
            companyAddress: prev.companyAddress || data.address || '',
            companyEmail: prev.companyEmail || data.email || '',
            companyPhone: prev.companyPhone || data.phone || '',
            logoUrl: prev.logoUrl || data.logoUrl || '',
            currency: data.defaultCurrency || prev.currency,
            paymentMethod: data.defaultPaymentMethod || prev.paymentMethod,
            quoteNumber: `${data.quotePrefix || 'DEV'}-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            fiscalInfo: {
              region: data.fiscalRegion || 'NONE',
              siret: data.siret || '',
              tvaNumber: data.vatNumber || '',
              nif: data.nif || '',
              stat: data.stat || '',
            },
          }));
        }
      }
    };
    loadDefaultCompany();
  }, [user]);

  useEffect(() => {
    if (user && pendingAction && !isAuthModalOpen) {
      if (pendingAction === 'email') {
        setTimeout(() => {
          handleSendEmail();
        }, 100);
      } else if (pendingAction === 'save') {
        setTimeout(() => {
          handleSaveToHistory();
        }, 100);
      }
      setPendingAction(null);
    }
  }, [user, isAuthModalOpen]);

  const handleSelectClient = (client: {
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    clientPhone: string;
    fiscalRegion?: string;
    siret?: string;
    vatNumber?: string;
    nif?: string;
    stat?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.clientName,
      clientEmail: client.clientEmail,
      clientAddress: client.clientAddress,
      clientPhone: client.clientPhone,
      clientFiscalInfo: {
        region: client.fiscalRegion || 'NONE',
        siret: client.siret || '',
        tvaNumber: client.vatNumber || '',
        nif: client.nif || '',
        stat: client.stat || '',
      },
    }));
  };

  const handleSelectCompany = (company: {
    companyName: string;
    companyEmail: string;
    companyAddress: string;
    companyPhone: string;
    logoUrl?: string;
    currency?: string;
    paymentMethod?: string;
    quotePrefix?: string;
    fiscalRegion?: string;
    siret?: string;
    vatNumber?: string;
    nif?: string;
    stat?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      companyName: company.companyName,
      companyEmail: company.companyEmail,
      companyAddress: company.companyAddress,
      companyPhone: company.companyPhone,
      logoUrl: company.logoUrl || prev.logoUrl,
      currency: company.currency || prev.currency,
      paymentMethod: company.paymentMethod || prev.paymentMethod,
      quoteNumber: `${company.quotePrefix || 'DEV'}-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      fiscalInfo: {
        region: company.fiscalRegion || 'NONE',
        siret: company.siret || '',
        tvaNumber: company.vatNumber || '',
        nif: company.nif || '',
        stat: company.stat || '',
      },
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFiscalInfoChange = (field: keyof FiscalInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      fiscalInfo: {
        ...prev.fiscalInfo!,
        [field]: value
      }
    }));
  };

  const handleClientFiscalInfoChange = (field: keyof FiscalInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      clientFiscalInfo: {
        ...prev.clientFiscalInfo!,
        [field]: value
      }
    }));
  };

  const selectedFiscalRegion = FISCAL_REGIONS.find(r => r.code === formData.fiscalInfo?.region);
  const selectedClientFiscalRegion = FISCAL_REGIONS.find(r => r.code === formData.clientFiscalInfo?.region);

  const handleItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    const newItems = formData.items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unitPrice: 0
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  const formatNumber = (num: number): string => {
    const formatted = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
    return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const formatNif = (nif: string): string => {
    const digits = nif.replace(/\s/g, '');
    if (digits.length >= 10) {
      return `${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5,7)} ${digits.slice(7,10)}`;
    }
    return digits;
  };

  const formatStat = (stat: string): string => {
    const digits = stat.replace(/\s/g, '');
    if (digits.length >= 16) {
      return `${digits.slice(0,5)} ${digits.slice(5,7)} ${digits.slice(7,11)} ${digits.slice(11,12)} ${digits.slice(12)}`;
    }
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPreviewMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGeneratePdf = async () => {
    if (!quoteRef.current) return;

    if (user && !canCreateQuote) {
      setEmailError(t('pricing.quoteLimitMsg'));
      return;
    }

    setLoading(true);

    try {
      const element = quoteRef.current;
      const originalPadding = element.style.padding;
      element.style.padding = '24px';

      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Devis-${formData.quoteNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          windowWidth: 1400,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await (await loadHtml2Pdf())().set(opt).from(element).save();

      element.style.padding = originalPadding;

      setSuccessAction('pdf');
      setSuccess(true);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!quoteRef.current) return;

    if (!user) {
      setAuthModalMessage(t('quote.loginToEmailMsg'));
      setPendingAction('email');
      setIsAuthModalOpen(true);
      return;
    }

    if (!isPro) {
      setEmailError(t('pricing.emailProOnly'));
      return;
    }

    if (!isEmailConfigured()) {
      setEmailError('Service email non configuré. Contactez l\'administrateur.');
      return;
    }

    setLoading(true);
    setEmailError(null);

    try {
      const element = quoteRef.current;
      const originalPadding = element.style.padding;
      element.style.padding = '24px';

      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Devis-${formData.quoteNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 1400 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      const pdfBlob = await (await loadHtml2Pdf())().set(opt).from(element).outputPdf('blob');

      element.style.padding = originalPadding;

      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      const result = await sendQuoteEmail(formData, pdfBase64);

      if (!result.success) {
        setEmailError(result.error || 'Erreur lors de l\'envoi de l\'email');
        return;
      }

      await saveQuote(formData, pdfBase64, 'sent');

      setSuccessAction('email');
      setSuccess(true);

      setFormData(getInitialFormData());
      setIsPreviewMode(false);
      setTimeout(() => {
        setSuccess(false);
        setSuccessAction(null);
      }, 5000);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF ou de l'envoi:", error);
      setEmailError('Erreur inattendue lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const handleSendViaWebhook = async () => {
    if (!quoteRef.current || !isAdmin) return;

    setWebhookLoading(true);
    setEmailError(null);

    try {
      const element = quoteRef.current;
      const originalPadding = element.style.padding;
      element.style.padding = '24px';

      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Devis-${formData.quoteNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 1400 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      const pdfBlob = await (await loadHtml2Pdf())().set(opt).from(element).outputPdf('blob');

      element.style.padding = originalPadding;

      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      await sendQuoteWithPdfToWebhook(formData, pdfBase64, DEFAULT_QUOTE_WEBHOOK_URL);

      setSuccessAction('email');
      setSuccess(true);

      setFormData(getInitialFormData());
      setIsPreviewMode(false);
      setTimeout(() => {
        setSuccess(false);
        setSuccessAction(null);
      }, 5000);
    } catch (error) {
      console.error("Erreur lors de l'envoi via webhook:", error);
      setEmailError('Erreur lors de l\'envoi via n8n');
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleEdit = () => {
    setIsPreviewMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveToHistory = async () => {
    if (!user) {
      setAuthModalMessage(t('quote.loginToSaveMsg'));
      setPendingAction('save');
      setIsAuthModalOpen(true);
      return;
    }

    if (!quoteRef.current) return;

    setSavingToHistory(true);

    try {
      const element = quoteRef.current;
      const originalPadding = element.style.padding;
      element.style.padding = '24px';

      const filename = `Devis-${formData.quoteNumber}.pdf`;
      const opt = {
        margin: [5, 5, 5, 5],
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 1400 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      const pdfBlob = await (await loadHtml2Pdf())().set(opt).from(element).outputPdf('blob');

      element.style.padding = originalPadding;

      const downloadUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      setLastGeneratedPdfBase64(pdfBase64);

      const result = await saveQuote(formData, pdfBase64);

      if (result.error) {
        console.error('Erreur lors de la sauvegarde:', result.error);
        alert('Erreur lors de la sauvegarde: ' + result.error);
      } else {
        setSuccessAction('saved');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessAction(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSavingToHistory(false);
    }
  };

  const selectClass = "block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2.5 px-3 bg-white border";
  const sectionTitleClass = "text-lg font-semibold text-primary-900 border-b border-slate-200 pb-2 mb-6";
  const currencySymbol = CURRENCIES.find(c => c.code === formData.currency)?.symbol || '';

  if (success) {
    const getSuccessMessage = () => {
      switch (successAction) {
        case 'email':
          return {
            title: t('quote.successSentTitle'),
            description: t('quote.successSentDesc'),
            buttonText: t('quote.newQuote')
          };
        case 'saved':
          return {
            title: t('quote.successSavedTitle'),
            description: t('quote.successSavedDesc'),
            buttonText: t('invoice.back')
          };
        default:
          return {
            title: t('quote.successPdfTitle'),
            description: t('quote.successPdfDesc'),
            buttonText: t('invoice.back')
          };
      }
    };

    const successMsg = getSuccessMessage();

    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-xl text-center border border-green-100 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          {successMsg.title}
        </h2>
        <p className="text-slate-600 mb-8 text-lg">
          {successMsg.description}
        </p>
        <Button
          onClick={() => {
            setSuccess(false);
            setSuccessAction(null);
          }}
          size="pill"
        >
          {successMsg.buttonText}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEOHead title={t('seo.quoteTitle')} description={t('seo.quoteDescription')} path="/quote" />

      <div className="mb-8 md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold leading-tight text-primary-950">
            {isPreviewMode ? t('invoice.preview') : t('quote.title')}
          </h2>
          {!isPreviewMode && (
            <p className="mt-2 text-sm text-slate-500">{t('quote.subtitle')}</p>
          )}
          {isPreviewMode && (
             <p className="mt-2 text-sm text-slate-500">{t('quote.previewSubtitle')}</p>
          )}
        </div>
      </div>

      {user && !canCreateQuote && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <Crown className="text-amber-500 shrink-0" size={20} />
          <div className="flex-grow">
            <p className="text-sm font-semibold text-amber-800">{t('pricing.quoteLimitMsg')}</p>
            <p className="text-xs text-amber-600 mt-0.5">{t('pricing.limitReached')}</p>
          </div>
          <a href={`/${locale}/pricing`} className="shrink-0 inline-flex items-center gap-1 bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-amber-600 transition-colors">
            <Crown size={14} /> {t('pricing.upgradeNow')}
          </a>
        </div>
      )}

      {user && canCreateQuote && plan.id === 'free' && (
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <FileText size={14} />
          <span>{usage.quotes}/{plan.features.quotesPerMonth} {t('pricing.quotesUsed')}</span>
        </div>
      )}

      {isPreviewMode ? (
        <div className="animate-fade-in">
          <div className="bg-white shadow-2xl rounded-lg border border-slate-200 overflow-hidden mb-8">
            <div ref={quoteRef} className="bg-white p-8 md:p-12 text-slate-800">

              <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b border-slate-100 pb-8">
                <div className="mb-6 md:mb-0">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo Entreprise" className="h-16 w-auto object-contain mb-4" />
                  ) : (
                    <div className="h-16 w-16 bg-slate-100 rounded flex items-center justify-center mb-4 text-slate-400">
                      <FileText size={32} />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900">{formData.companyName || t('invoice.yourCompany')}</h3>
                  <div className="text-slate-500 text-sm mt-2 whitespace-pre-line leading-relaxed">
                    {formData.companyAddress}<br/>
                    {formData.companyEmail}<br/>
                    {formData.companyPhone}
                  </div>
                  {formData.fiscalInfo && formData.fiscalInfo.region !== 'NONE' && (
                    <div className="mt-3 text-sm text-slate-600">
                      {formData.fiscalInfo.region === 'MG' && (
                        <>
                          {formData.fiscalInfo.nif && <p><span className="font-medium">NIF :</span> {formatNif(formData.fiscalInfo.nif)}</p>}
                          {formData.fiscalInfo.stat && <p><span className="font-medium">STAT :</span> {formatStat(formData.fiscalInfo.stat)}</p>}
                        </>
                      )}
                      {formData.fiscalInfo.region === 'EU' && (
                        <>
                          {formData.fiscalInfo.siret && <p><span className="font-medium">SIRET :</span> {formData.fiscalInfo.siret}</p>}
                          {formData.fiscalInfo.tvaNumber && <p><span className="font-medium">TVA :</span> {formData.fiscalInfo.tvaNumber}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-3">
                    <h1 className="text-3xl font-light text-slate-900">{t('quote.quoteLabel')}</h1>
                    <p className="text-lg font-semibold text-primary-900">{formData.quoteNumber}</p>
                  </div>
                  <div className="mt-1 text-sm text-slate-600 whitespace-nowrap">
                    <span className="font-medium">{t('invoice.dateLabel')}</span> {new Date(formData.quoteDate).toLocaleDateString()}
                    <span className="ml-4"><span className="font-medium">{t('quote.validUntil')}</span> {new Date(formData.validityDate).toLocaleDateString()}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('quote.recipient')}</h4>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{formData.clientName || t('invoice.clientNameDefault')}</h3>
                      <div className="text-slate-500 text-sm mt-2 whitespace-pre-line leading-relaxed">
                        {formData.clientAddress}<br/>
                        {formData.clientEmail}<br/>
                        {formData.clientPhone}
                      </div>
                      {formData.clientFiscalInfo && formData.clientFiscalInfo.region !== 'NONE' && (
                        <div className="mt-3 text-sm text-slate-600">
                          {formData.clientFiscalInfo.region === 'MG' && (
                            <>
                              {formData.clientFiscalInfo.nif && <p><span className="font-medium">NIF :</span> {formatNif(formData.clientFiscalInfo.nif)}</p>}
                              {formData.clientFiscalInfo.stat && <p><span className="font-medium">STAT :</span> {formatStat(formData.clientFiscalInfo.stat)}</p>}
                            </>
                          )}
                          {formData.clientFiscalInfo.region === 'EU' && (
                            <>
                              {formData.clientFiscalInfo.siret && <p><span className="font-medium">SIRET :</span> {formData.clientFiscalInfo.siret}</p>}
                              {formData.clientFiscalInfo.tvaNumber && <p><span className="font-medium">TVA :</span> {formData.clientFiscalInfo.tvaNumber}</p>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider w-[35%] text-left">{t('invoice.itemName')}</th>
                      <th className="py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider w-[10%] text-right">{t('invoice.quantity')}</th>
                      <th className="py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider w-[25%] text-right">{t('invoice.unitPrice')}</th>
                      <th className="py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider w-[30%] text-right">{t('invoice.total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 text-slate-800 font-medium">{item.name}</td>
                        <td className="py-4 text-slate-600 text-right">{item.quantity}</td>
                        <td className="py-4 text-slate-600 text-right whitespace-nowrap">{formatNumber(item.unitPrice)} {currencySymbol}</td>
                        <td className="py-4 text-slate-900 font-bold text-right whitespace-nowrap">{formatNumber(item.quantity * item.unitPrice)} {currencySymbol}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start border-t border-slate-200 pt-8">
                <div className="mb-8 md:mb-0 md:w-1/2">
                   <h4 className="text-sm font-bold text-slate-900 mb-2">{t('quote.conditions')}</h4>
                   <p className="text-sm text-slate-600">
                     {t('invoice.methodLabel')} <span className="font-medium text-slate-800">{t(PAYMENT_METHODS.find(m => m.code === formData.paymentMethod)?.labelKey || '')}</span><br/>
                     {t('invoice.currencyLabel')} {formData.currency}
                   </p>
                </div>

                <div className="w-full md:w-2/5">
                  <div className="flex justify-between gap-1 py-2 text-slate-600 whitespace-nowrap">
                    <span>{t('invoice.subtotal')}</span>
                    <span>{formatNumber(calculateTotal())} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between gap-1 py-2 text-slate-600 border-b border-slate-100 pb-4 mb-4 whitespace-nowrap">
                    <span>{t('invoice.vat')}</span>
                    <span>0.00 {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between gap-1 items-center text-xl font-bold text-primary-900 whitespace-nowrap">
                    <span>{t('invoice.total')}</span>
                    <span>{formatNumber(calculateTotal())} {currencySymbol}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-center items-center gap-4 mb-12 flex-wrap">

            <Button
              variant="outline"
              size="pill"
              onClick={handleEdit}
              disabled={loading || savingToHistory}
              className="min-w-[160px] shadow-sm"
            >
              <Pencil className="h-5 w-5" />
              {t('invoice.edit')}
            </Button>

            {user ? (
              <div className="flex flex-col items-center">
                <Button
                  size="pill"
                  onClick={handleSaveToHistory}
                  disabled={loading || savingToHistory}
                  className="min-w-[220px] font-bold border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:shadow-md shadow-sm"
                >
                  {savingToHistory ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      {t('invoice.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {t('invoice.save')}
                    </>
                  )}
                </Button>
                <span className="text-xs text-slate-400 mt-2 font-medium italic text-center max-w-[260px]">
                  {t('invoice.saveHint')}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Button
                  variant="outline"
                  size="pill"
                  onClick={handleGeneratePdf}
                  disabled={loading || savingToHistory}
                  className="min-w-[220px] font-bold shadow-sm hover:shadow-md"
                >
                  <Download className="h-5 w-5" />
                  {t('invoice.generatePdf')}
                </Button>
                <span className="text-xs text-amber-600 mt-2 font-medium text-center max-w-[260px]">
                  {t('invoice.downloadOnlyHint')}
                </span>
              </div>
            )}

            <div className="flex flex-col items-center">
              <div className="relative">
                <Button
                  size="pill"
                  onClick={handleSendEmail}
                  disabled={loading || savingToHistory || webhookLoading || !isPro}
                  className={`min-w-[200px] font-bold transition-all duration-300 ${
                    isPro
                      ? 'shadow-lg hover:shadow-xl hover:-translate-y-1'
                      : 'bg-slate-200 text-slate-400 hover:bg-slate-200 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      {t('invoice.sending')}
                    </>
                  ) : !isPro ? (
                    <>
                      <Lock className="h-5 w-5" />
                      {t('quote.sendQuote')}
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      {t('quote.sendQuote')}
                    </>
                  )}
                </Button>
                {!isPro && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    <Crown size={12} /> PRO
                  </span>
                )}
              </div>
              {isPro && (
                <span className="text-xs text-slate-400 mt-2 font-medium italic">({t('invoice.sendEmail')} → {formData.clientEmail})</span>
              )}
              {!isPro && (
                <span className="text-xs text-slate-400 mt-2">{t('pricing.emailProOnly')}</span>
              )}
              {emailError && (
                <span className="text-xs text-red-500 mt-2 font-medium bg-red-50 px-3 py-1 rounded-full">{emailError}</span>
              )}
            </div>

            {isAdmin && (
              <div className="flex flex-col items-center">
                <Button
                  size="pill"
                  onClick={handleSendViaWebhook}
                  disabled={loading || savingToHistory || webhookLoading}
                  className="min-w-[200px] font-bold border-2 border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:shadow-xl hover:-translate-y-1 shadow-lg transition-all duration-300"
                >
                  {webhookLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      {t('invoice.sendingN8n')}
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      {t('invoice.sendViaGmail')}
                    </>
                  )}
                </Button>
                <span className="text-xs text-amber-600 mt-2 font-medium italic">{t('invoice.webhookN8n')}</span>
              </div>
            )}

          </div>
        </div>
      ) : (
        <form onSubmit={handlePreviewSubmit} className="animate-fade-in space-y-8 bg-white shadow-xl rounded-2xl p-6 md:p-10 border border-slate-100">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className={sectionTitleClass + " !mb-0"}>{t('quote.clientSection')}</h3>
                <ClientSelector
                  onSelectClient={handleSelectClient}
                  currentClientEmail={formData.clientEmail}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t('invoice.clientName')} *</Label>
                  <Input required type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} placeholder={t('invoice.placeholderClientName')} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('invoice.clientAddress')} *</Label>
                  <Textarea required rows={2} name="clientAddress" value={formData.clientAddress} onChange={handleInputChange} placeholder={t('invoice.placeholderClientAddress')} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t('invoice.clientEmail')} *</Label>
                    <Input required type="email" name="clientEmail" value={formData.clientEmail} onChange={handleInputChange} placeholder="email@client.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('invoice.clientPhone')}</Label>
                    <Input type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleInputChange} placeholder="06 98 76 54 32" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-1.5">
                  <Label>{t('invoice.fiscalType')}</Label>
                  <select
                    value={formData.clientFiscalInfo?.region || 'NONE'}
                    onChange={(e) => handleClientFiscalInfoChange('region', e.target.value)}
                    className={selectClass}
                  >
                    {FISCAL_REGIONS.map(region => (
                      <option key={region.code} value={region.code}>{t(region.nameKey)}</option>
                    ))}
                  </select>
                </div>

                {selectedClientFiscalRegion && selectedClientFiscalRegion.fields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    {selectedClientFiscalRegion.fields.map(field => (
                      <div key={field.key} className="space-y-1.5">
                        <Label>{t(field.labelKey)}</Label>
                        <Input
                          type="text"
                          value={(formData.clientFiscalInfo as any)?.[field.key] || ''}
                          onChange={(e) => handleClientFiscalInfoChange(field.key as keyof FiscalInfo, e.target.value)}
                          placeholder={t(field.placeholderKey)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className={sectionTitleClass + " !mb-0"}>{t('quote.companySection')}</h3>
                  <span className="text-xs text-slate-500 italic">{t('quote.issuer')}</span>
                </div>
                <CompanySelector
                  onSelectCompany={handleSelectCompany}
                  currentCompanyName={formData.companyName}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t('invoice.companyName')} *</Label>
                  <Input required type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder={t('invoice.placeholderCompanyName')} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('invoice.companyAddress')} *</Label>
                  <Textarea required rows={2} name="companyAddress" value={formData.companyAddress} onChange={handleInputChange} placeholder={t('invoice.placeholderCompanyAddress')} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t('invoice.companyEmail')} *</Label>
                    <Input required type="email" name="companyEmail" value={formData.companyEmail} onChange={handleInputChange} placeholder="contact@masociete.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('invoice.companyPhone')}</Label>
                    <Input type="tel" name="companyPhone" value={formData.companyPhone} onChange={handleInputChange} placeholder="01 23 45 67 89" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('invoice.logoUrl')}</Label>
                  <Input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleInputChange} placeholder="https://example.com/logo.png" />
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-1.5">
                  <Label>{t('invoice.fiscalType')}</Label>
                  <select
                    value={formData.fiscalInfo?.region || 'NONE'}
                    onChange={(e) => handleFiscalInfoChange('region', e.target.value)}
                    className={selectClass}
                  >
                    {FISCAL_REGIONS.map(region => (
                      <option key={region.code} value={region.code}>{t(region.nameKey)}</option>
                    ))}
                  </select>
                </div>

                {selectedFiscalRegion && selectedFiscalRegion.fields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    {selectedFiscalRegion.fields.map(field => (
                      <div key={field.key} className="space-y-1.5">
                        <Label>{t(field.labelKey)}</Label>
                        <Input
                          type="text"
                          value={(formData.fiscalInfo as any)?.[field.key] || ''}
                          onChange={(e) => handleFiscalInfoChange(field.key as keyof FiscalInfo, e.target.value)}
                          placeholder={t(field.placeholderKey)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <h3 className={sectionTitleClass}>{t('quote.detailsSection')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <Label>{t('quote.quoteNumber')} *</Label>
                <Input required type="text" name="quoteNumber" value={formData.quoteNumber} onChange={handleInputChange} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('invoice.invoiceDate')} *</Label>
                <Input required type="date" name="quoteDate" value={formData.quoteDate} onChange={handleInputChange} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('quote.validityDate')} *</Label>
                <Input required type="date" name="validityDate" value={formData.validityDate} onChange={handleInputChange} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('invoice.currency')}</Label>
                <select name="currency" value={formData.currency} onChange={handleInputChange} className={selectClass}>
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} - {c.symbol}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('invoice.paymentMethod')}</Label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className={selectClass}>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.code} value={m.code}>{t(m.labelKey)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <h3 className={sectionTitleClass}>{t('quote.itemsSection')}</h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/2">{t('invoice.itemName')}</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">{t('invoice.quantity')}</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">{t('invoice.unitPrice')}</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">{t('invoice.total')}</th>
                    <th scope="col" className="relative px-3 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {formData.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          placeholder={t('invoice.itemPlaceholder')}
                          className="border-transparent hover:bg-slate-50"
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="border-transparent hover:bg-slate-50"
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="border-transparent hover:bg-slate-50"
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                        {formatNumber(item.quantity * item.unitPrice)} {currencySymbol}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={formData.items.length === 1}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="mt-4 shadow-sm"
            >
              <Plus size={16} />
              {t('invoice.addItem')}
            </Button>
          </div>

          <div className="border-t border-slate-200 pt-6 flex justify-end">
            <div className="w-full md:w-1/3 space-y-3">
               <div className="flex justify-between items-center text-lg font-bold text-primary-900">
                 <span>{t('invoice.total')}</span>
                 <span>{formatNumber(calculateTotal())} {currencySymbol}</span>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <Button
              type="submit"
              size="pill"
              className="py-4 h-auto shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <FileText className="h-5 w-5" />
              {t('quote.previewBtn')}
            </Button>
          </div>

        </form>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalMessage(undefined);
        }}
        initialMode="login"
        customMessage={authModalMessage}
      />
    </div>
  );
};

export default QuoteForm;
