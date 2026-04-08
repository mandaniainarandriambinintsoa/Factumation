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
import { SavedInvoice, SavedQuote } from '../types';
import { CURRENCIES } from '../constants';
import { supabase } from '../lib/supabase';

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
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState<{ type: 'markPaid' | 'reminder'; doc: RecentDoc } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Auto-dismiss success message
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  const loadData = async () => {
    setLoading(true);
    const [inv, qt] = await Promise.all([getInvoices(), getQuotes()]);
    if (inv.data) setInvoices(inv.data);
    if (qt.data) setQuotes(qt.data);
    setLoading(false);
  };

  const getCurrencySymbol = (code: string) =>
    CURRENCIES.find((c) => c.code === code)?.symbol || code;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    amount.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Mark invoice as paid
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

    // Update local state
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === modal.doc.id ? { ...inv, status: 'paid' } : inv))
    );
    setActionLoading(false);
    setModal(null);
    setActionSuccess(t('homeDashboard.markedPaidSuccess'));
  };

  // Send reminder email
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

  // KPI calculations
  const kpis = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const pendingInvoices = invoices.filter((i) => i.status === 'sent');
    const draftInvoices = invoices.filter((i) => i.status === 'draft');

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0);

    const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');

    const currencyCounts: Record<string, number> = {};
    invoices.forEach((i) => {
      currencyCounts[i.currency] = (currencyCounts[i.currency] || 0) + 1;
    });
    const primaryCurrency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'EUR';

    return {
      totalRevenue,
      pendingAmount,
      totalInvoices: invoices.length,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      draftCount: draftInvoices.length,
      totalQuotes: quotes.length,
      acceptedCount: acceptedQuotes.length,
      primaryCurrency: getCurrencySymbol(primaryCurrency),
    };
  }, [invoices, quotes]);

  // Recent documents
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success toast */}
      {actionSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-[slideIn_0.3s_ease]">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {t('homeDashboard.welcome')}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-slate-500">{t('homeDashboard.subtitle')}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label={t('homeDashboard.kpiRevenue')}
          value={`${formatCurrency(kpis.totalRevenue)} ${kpis.primaryCurrency}`}
          icon={TrendingUp}
          color="text-green-600 bg-green-50"
          sub={t('homeDashboard.kpiPaid').replace('{count}', String(kpis.paidCount))}
        />
        <KpiCard
          label={t('homeDashboard.kpiPending')}
          value={`${formatCurrency(kpis.pendingAmount)} ${kpis.primaryCurrency}`}
          icon={Clock}
          color="text-blue-600 bg-blue-50"
          sub={t('homeDashboard.kpiAwaitingPayment').replace('{count}', String(kpis.pendingCount))}
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
          <button
            onClick={() => navigate(path('/dashboard'))}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            {t('homeDashboard.viewAll')}
            <ArrowRight className="w-4 h-4" />
          </button>
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

                  {/* Action buttons for sent invoices */}
                  {isInvoiceSent && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setModal({ type: 'markPaid', doc }); }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title={t('homeDashboard.markAsPaid')}
                      >
                        <CreditCard className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setModal({ type: 'reminder', doc }); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('homeDashboard.sendReminder')}
                      >
                        <RefreshCw className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setModal(null); setActionError(null); }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-[scaleIn_0.2s_ease]">
            <button
              onClick={() => { setModal(null); setActionError(null); }}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {modal.type === 'markPaid' ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{t('homeDashboard.markAsPaidTitle')}</h3>
                    <p className="text-sm text-slate-500">{modal.doc.number}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-5">
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

                <p className="text-sm text-slate-600 mb-5">{t('homeDashboard.markAsPaidConfirm')}</p>

                {actionError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{actionError}</div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setModal(null); setActionError(null); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                  >
                    {t('homeDashboard.cancel')}
                  </button>
                  <button
                    onClick={handleMarkPaid}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {t('homeDashboard.confirmPaid')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <RefreshCw className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{t('homeDashboard.sendReminderTitle')}</h3>
                    <p className="text-sm text-slate-500">{modal.doc.number}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-5">
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

                <p className="text-sm text-slate-600 mb-5">{t('homeDashboard.reminderConfirm')}</p>

                {actionError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{actionError}</div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setModal(null); setActionError(null); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                  >
                    {t('homeDashboard.cancel')}
                  </button>
                  <button
                    onClick={handleSendReminder}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {t('homeDashboard.confirmReminder')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// KPI Card
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
