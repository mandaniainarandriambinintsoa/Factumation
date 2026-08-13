import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, FileCheck, Plus, TrendingUp, Clock, CheckCircle2,
  Loader2, ArrowRight, Calendar, User, X,
  Send, Ban, XCircle, Timer, RefreshCw, CreditCard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { getInvoices, getQuotes, updateInvoiceStatus } from '../services/historyService';
import { getDefaultCompany } from '../services/companyService';
import { convertCurrency, ExchangeRateTable, getExchangeRates } from '../services/exchangeRateService';
import { SavedInvoice, SavedQuote } from '../types';
import { CURRENCIES } from '../constants';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

type RecentDoc = {
  type: 'invoice' | 'quote';
  id: string;
  number: string;
  date: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
  dueDate?: string;
  items: { id: string; name: string; quantity: number; unitPrice: number }[];
  pdfBase64?: string;
};

const HomeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const { path } = useLocalizedPath();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [reportingCurrency, setReportingCurrency] = useState('EUR');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateTable | null>(null);
  const [exchangeRateError, setExchangeRateError] = useState(false);
  const [currencyChanging, setCurrencyChanging] = useState(false);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{ type: 'markPaid' | 'markSent' | 'reminder'; doc: RecentDoc } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  const loadData = async () => {
    setLoading(true);
    setExchangeRateError(false);
    const [inv, qt, company] = await Promise.all([getInvoices(), getQuotes(), getDefaultCompany()]);
    if (inv.data) setInvoices(inv.data);
    if (qt.data) setQuotes(qt.data);

    const loadedInvoices = inv.data || [];
    const currencyCounts: Record<string, number> = {};
    loadedInvoices.forEach((invoice) => {
      currencyCounts[invoice.currency] = (currencyCounts[invoice.currency] || 0) + 1;
    });
    const fallbackCurrency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'EUR';
    const savedCurrency = user
      ? window.localStorage.getItem(`factumation-dashboard-currency:${user.id}`)?.toUpperCase()
      : null;
    const preferredCurrency = savedCurrency
      && CURRENCIES.some((currency) => currency.code === savedCurrency)
      ? savedCurrency
      : company.data?.defaultCurrency || fallbackCurrency;
    const targetCurrency = preferredCurrency.toUpperCase();
    setReportingCurrency(targetCurrency);

    const currencies = [...new Set([...loadedInvoices.map((invoice) => invoice.currency.toUpperCase()), targetCurrency])];
    const requiresConversion = currencies.some((currency) => currency !== targetCurrency);
    if (!requiresConversion) {
      setExchangeRates({
        baseCurrency: 'EUR',
        rates: { EUR: 1 },
        date: new Date().toISOString().slice(0, 10),
        fetchedAt: Date.now(),
      });
    } else {
      try {
        setExchangeRates(await getExchangeRates(currencies));
      } catch (error) {
        console.error('Unable to load exchange rates:', error);
        setExchangeRates(null);
        setExchangeRateError(true);
      }
    }
    setLoading(false);
  };

  const selectReportingCurrency = async (targetCurrency: string) => {
    const normalizedTarget = targetCurrency.toUpperCase();
    if (normalizedTarget === reportingCurrency) return;

    setCurrencyChanging(true);
    setExchangeRateError(false);

    const requiredCurrencies = [
      ...new Set([...invoices.map((invoice) => invoice.currency.toUpperCase()), normalizedTarget]),
    ];
    const requiresConversion = requiredCurrencies.some((currency) => currency !== normalizedTarget);
    const currentRatesAreEnough = exchangeRates
      && requiredCurrencies.every(
        (currency) => currency === 'EUR' || Number.isFinite(exchangeRates.rates[currency]),
      );

    try {
      if (requiresConversion && !currentRatesAreEnough) {
        setExchangeRates(await getExchangeRates(requiredCurrencies));
      } else if (!exchangeRates) {
        setExchangeRates({
          baseCurrency: 'EUR',
          rates: { EUR: 1 },
          date: new Date().toISOString().slice(0, 10),
          fetchedAt: Date.now(),
        });
      }

      setReportingCurrency(normalizedTarget);
      if (user) {
        window.localStorage.setItem(`factumation-dashboard-currency:${user.id}`, normalizedTarget);
      }
    } catch (error) {
      console.error('Unable to change reporting currency:', error);
      setExchangeRateError(true);
    } finally {
      setCurrencyChanging(false);
    }
  };

  const getCurrencySymbol = (code: string) =>
    CURRENCIES.find((c) => c.code === code)?.symbol || code;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (amount: number, currency: string) =>
    amount.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'MGA' ? 0 : 2,
    });

  const handleMarkPaid = async () => {
    if (!modal || modal.type !== 'markPaid') return;
    setActionLoading(true);
    setActionError(null);

    const result = await updateInvoiceStatus(modal.doc.id, 'paid');
    if (result.error) {
      setActionError(result.error);
      setActionLoading(false);
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === modal.doc.id ? { ...inv, status: 'paid' } : inv))
    );
    setActionLoading(false);
    setModal(null);
    setActionSuccess(t('homeDashboard.markedPaidSuccess'));
  };

  const handleMarkSent = async () => {
    if (!modal || modal.type !== 'markSent') return;
    setActionLoading(true);
    setActionError(null);

    const result = await updateInvoiceStatus(modal.doc.id, 'sent');
    if (result.error) {
      setActionError(result.error);
      setActionLoading(false);
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === modal.doc.id ? { ...inv, status: 'sent' as const } : inv))
    );
    setActionLoading(false);
    setModal(null);
    setActionSuccess(t('homeDashboard.markedSentSuccess'));
  };

  const handleSendReminder = async () => {
    if (!modal || modal.type !== 'reminder' || !supabase) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'reminder',
          data: {
            companyName: modal.doc.companyName,
            companyEmail: modal.doc.companyEmail,
            companyPhone: modal.doc.companyPhone,
            clientName: modal.doc.clientName,
            clientEmail: modal.doc.clientEmail,
            documentNumber: modal.doc.number,
            documentDate: modal.doc.date,
            dueDate: modal.doc.dueDate,
            currency: modal.doc.currency,
            items: modal.doc.items,
          },
          pdfBase64: modal.doc.pdfBase64 || '',
        },
      });

      if (error || result?.error) {
        setActionError(error?.message || result?.error || t('homeDashboard.reminderError'));
        setActionLoading(false);
        return;
      }

      setActionLoading(false);
      setModal(null);
      setActionSuccess(t('homeDashboard.reminderSentSuccess'));
    } catch (err) {
      setActionError(t('homeDashboard.reminderError'));
      setActionLoading(false);
    }
  };

  const kpis = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const pendingInvoices = invoices.filter((i) => i.status === 'sent');
    const draftInvoices = invoices.filter((i) => i.status === 'draft');

    const canCalculateAmounts = exchangeRates !== null;
    const totalRevenue = canCalculateAmounts
      ? paidInvoices.reduce(
          (sum, invoice) => sum + convertCurrency(invoice.total, invoice.currency, reportingCurrency, exchangeRates),
          0,
        )
      : null;
    const pendingAmount = canCalculateAmounts
      ? pendingInvoices.reduce(
          (sum, invoice) => sum + convertCurrency(invoice.total, invoice.currency, reportingCurrency, exchangeRates),
          0,
        )
      : null;

    const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');

    return {
      totalRevenue,
      pendingAmount,
      totalInvoices: invoices.length,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      draftCount: draftInvoices.length,
      totalQuotes: quotes.length,
      acceptedCount: acceptedQuotes.length,
      reportingCurrency,
    };
  }, [invoices, quotes, exchangeRates, reportingCurrency]);

  const recentDocs = useMemo<RecentDoc[]>(() => {
    const all: RecentDoc[] = [
      ...invoices.map((i) => ({
        type: 'invoice' as const,
        id: i.id,
        number: i.invoiceNumber,
        date: i.invoiceDate,
        clientName: i.clientName,
        clientEmail: i.clientEmail,
        companyName: i.companyName,
        companyEmail: i.companyEmail,
        companyPhone: i.companyPhone,
        total: i.total,
        currency: i.currency,
        status: i.status,
        createdAt: i.createdAt,
        dueDate: i.dueDate,
        items: i.items,
        pdfBase64: i.pdfBase64,
      })),
      ...quotes.map((q) => ({
        type: 'quote' as const,
        id: q.id,
        number: q.quoteNumber,
        date: q.quoteDate,
        clientName: q.clientName,
        clientEmail: q.clientEmail,
        companyName: q.companyName,
        companyEmail: q.companyEmail,
        companyPhone: q.companyPhone,
        total: q.total,
        currency: q.currency,
        status: q.status,
        createdAt: q.createdAt,
        items: q.items,
        pdfBase64: q.pdfBase64,
      })),
    ];
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  }, [invoices, quotes]);

  const statusConfig: Record<string, { color: string; icon: React.ElementType; labelKey: string }> = {
    draft: { color: 'text-slate-500 bg-slate-100', icon: Clock, labelKey: 'homeDashboard.statusDraft' },
    sent: { color: 'text-blue-600 bg-blue-50', icon: Send, labelKey: 'homeDashboard.statusSent' },
    paid: { color: 'text-green-600 bg-green-50', icon: CheckCircle2, labelKey: 'homeDashboard.statusPaid' },
    cancelled: { color: 'text-red-600 bg-red-50', icon: Ban, labelKey: 'homeDashboard.statusCancelled' },
    accepted: { color: 'text-green-600 bg-green-50', icon: CheckCircle2, labelKey: 'homeDashboard.statusAccepted' },
    rejected: { color: 'text-red-600 bg-red-50', icon: XCircle, labelKey: 'homeDashboard.statusRejected' },
    expired: { color: 'text-amber-600 bg-amber-50', icon: Timer, labelKey: 'homeDashboard.statusExpired' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-primary-600" />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  const closeModal = () => {
    setModal(null);
    setActionError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success toast */}
      {actionSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-[slideIn_0.3s_ease]">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {t('homeDashboard.welcome')}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-slate-500">{t('homeDashboard.subtitle')}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          onClick={() => navigate(path('/create'))}
          className="flex items-center gap-4 p-5 bg-primary-900 text-white rounded-2xl hover:bg-primary-800 transition-colors group"
        >
          <div className="p-3 bg-white/20 rounded-xl">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-lg">{t('homeDashboard.newInvoice')}</p>
            <p className="text-sm text-white/70">{t('homeDashboard.newInvoiceDesc')}</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button
          type="button"
          onClick={() => navigate(path('/quote'))}
          className="flex items-center gap-4 p-5 bg-white border-2 border-slate-200 rounded-2xl hover:border-primary-300 hover:bg-primary-50/30 transition-colors group"
        >
          <div className="p-3 bg-green-100 rounded-xl">
            <Plus className="w-6 h-6 text-green-700" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-lg text-slate-900">{t('homeDashboard.newQuote')}</p>
            <p className="text-sm text-slate-500">{t('homeDashboard.newQuoteDesc')}</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {t('homeDashboard.reportingCurrencyDescription')}
        </p>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>{t('homeDashboard.reportingCurrency')}</span>
          <span className="relative">
            <select
              value={reportingCurrency}
              onChange={(event) => void selectReportingCurrency(event.target.value)}
              disabled={currencyChanging}
              aria-label={t('homeDashboard.reportingCurrency')}
              className="min-w-32 appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 font-semibold text-slate-900 shadow-sm outline-none transition hover:border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-wait disabled:opacity-60"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} · {currency.symbol}
                </option>
              ))}
            </select>
            {currencyChanging ? (
              <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary-600" />
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        </label>
      </div>
      {exchangeRateError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t('homeDashboard.exchangeRateError')}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label={t('homeDashboard.kpiRevenue')}
          value={kpis.totalRevenue === null
            ? '—'
            : `${formatCurrency(kpis.totalRevenue, kpis.reportingCurrency)} ${getCurrencySymbol(kpis.reportingCurrency)}`}
          icon={TrendingUp}
          color="text-green-600 bg-green-50"
          sub={`${t('homeDashboard.kpiPaid').replace('{count}', String(kpis.paidCount))} · ${t('homeDashboard.convertedTo').replace('{currency}', kpis.reportingCurrency)}`}
        />
        <KpiCard
          label={t('homeDashboard.kpiPending')}
          value={kpis.pendingAmount === null
            ? '—'
            : `${formatCurrency(kpis.pendingAmount, kpis.reportingCurrency)} ${getCurrencySymbol(kpis.reportingCurrency)}`}
          icon={Clock}
          color="text-blue-600 bg-blue-50"
          sub={`${t('homeDashboard.kpiAwaitingPayment').replace('{count}', String(kpis.pendingCount))} · ${t('homeDashboard.convertedTo').replace('{currency}', kpis.reportingCurrency)}`}
        />
        <KpiCard
          label={t('homeDashboard.kpiInvoices')}
          value={String(kpis.totalInvoices)}
          icon={FileText}
          color="text-primary-600 bg-primary-50"
          sub={t('homeDashboard.kpiDrafts').replace('{count}', String(kpis.draftCount))}
        />
        <KpiCard
          label={t('homeDashboard.kpiQuotes')}
          value={String(kpis.totalQuotes)}
          icon={FileCheck}
          color="text-amber-600 bg-amber-50"
          sub={t('homeDashboard.kpiAccepted').replace('{count}', String(kpis.acceptedCount))}
        />
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{t('homeDashboard.recentDocuments')}</h2>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate(path('/dashboard'))}
            className="text-primary-600 hover:text-primary-700"
          >
            {t('homeDashboard.viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {recentDocs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="mx-auto w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">{t('homeDashboard.noDocuments')}</p>
            <p className="text-sm text-slate-400 mt-1">{t('homeDashboard.noDocumentsDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentDocs.map((doc) => {
              const sc = statusConfig[doc.status] || statusConfig.draft;
              const StatusIcon = sc.icon;
              const isInvoiceDraft = doc.type === 'invoice' && doc.status === 'draft';
              const isInvoiceSent = doc.type === 'invoice' && doc.status === 'sent';
              return (
                <div
                  key={`${doc.type}-${doc.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${doc.type === 'invoice' ? 'bg-primary-50' : 'bg-green-50'}`}>
                    {doc.type === 'invoice' ? (
                      <FileText className="w-5 h-5 text-primary-600" />
                    ) : (
                      <FileCheck className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900 truncate">{doc.number}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {t(sc.labelKey)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{doc.clientName}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(doc.date)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900">
                      {doc.total.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 2 })} {getCurrencySymbol(doc.currency)}
                    </p>
                  </div>

                  {isInvoiceDraft && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setModal({ type: 'markSent', doc }); }}
                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        title={t('homeDashboard.markAsSent')}
                      >
                        <Send className="w-[18px] h-[18px]" />
                      </Button>
                    </div>
                  )}

                  {isInvoiceSent && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setModal({ type: 'markPaid', doc }); }}
                        className="text-green-600 hover:bg-green-50 hover:text-green-700"
                        title={t('homeDashboard.markAsPaid')}
                      >
                        <CreditCard className="w-[18px] h-[18px]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setModal({ type: 'reminder', doc }); }}
                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        title={t('homeDashboard.sendReminder')}
                      >
                        <RefreshCw className="w-[18px] h-[18px]" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal via Radix Dialog */}
      <Dialog open={!!modal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md">
          {modal?.type === 'markSent' && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Send className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle>{t('homeDashboard.markAsSentTitle')}</DialogTitle>
                    <DialogDescription>{modal.doc.number}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('homeDashboard.client')}</span>
                  <span className="font-medium text-slate-900">{modal.doc.clientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('homeDashboard.amount')}</span>
                  <span className="font-bold text-blue-600">
                    {modal.doc.total.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 2 })} {getCurrencySymbol(modal.doc.currency)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600">{t('homeDashboard.markAsSentConfirm')}</p>

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{actionError}</div>
              )}

              <DialogFooter className="gap-3 sm:gap-3">
                <Button variant="outline" onClick={closeModal} className="flex-1">
                  {t('homeDashboard.cancel')}
                </Button>
                <Button onClick={handleMarkSent} disabled={actionLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('homeDashboard.confirmSent')}
                </Button>
              </DialogFooter>
            </>
          )}

          {modal?.type === 'markPaid' && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <DialogTitle>{t('homeDashboard.markAsPaidTitle')}</DialogTitle>
                    <DialogDescription>{modal.doc.number}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('homeDashboard.client')}</span>
                  <span className="font-medium text-slate-900">{modal.doc.clientName}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('homeDashboard.amount')}</span>
                  <span className="font-bold text-green-600">
                    {modal.doc.total.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 2 })} {getCurrencySymbol(modal.doc.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('homeDashboard.date')}</span>
                  <span className="text-slate-700">{formatDate(modal.doc.date)}</span>
                </div>
              </div>

              <p className="text-sm text-slate-600">{t('homeDashboard.markAsPaidConfirm')}</p>

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{actionError}</div>
              )}

              <DialogFooter className="gap-3 sm:gap-3">
                <Button variant="outline" onClick={closeModal} className="flex-1">
                  {t('homeDashboard.cancel')}
                </Button>
                <Button onClick={handleMarkPaid} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {t('homeDashboard.confirmPaid')}
                </Button>
              </DialogFooter>
            </>
          )}

          {modal?.type === 'reminder' && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <RefreshCw className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle>{t('homeDashboard.sendReminderTitle')}</DialogTitle>
                    <DialogDescription>{modal.doc.number}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('homeDashboard.client')}</span>
                  <span className="font-medium text-slate-900">{modal.doc.clientName}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-700">{modal.doc.clientEmail}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('homeDashboard.amount')}</span>
                  <span className="font-bold text-blue-600">
                    {modal.doc.total.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 2 })} {getCurrencySymbol(modal.doc.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('homeDashboard.date')}</span>
                  <span className="text-slate-700">{formatDate(modal.doc.date)}</span>
                </div>
              </div>

              <p className="text-sm text-slate-600">{t('homeDashboard.reminderConfirm')}</p>

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{actionError}</div>
              )}

              <DialogFooter className="gap-3 sm:gap-3">
                <Button variant="outline" onClick={closeModal} className="flex-1">
                  {t('homeDashboard.cancel')}
                </Button>
                <Button onClick={handleSendReminder} disabled={actionLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('homeDashboard.confirmReminder')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

export default HomeDashboard;
