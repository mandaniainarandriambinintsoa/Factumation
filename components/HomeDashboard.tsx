import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, FileCheck, Plus, TrendingUp, Clock, CheckCircle2,
  Loader2, ArrowRight, Calendar, User,
  Send, Ban, XCircle, Timer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { getInvoices, getQuotes } from '../services/historyService';
import { SavedInvoice, SavedQuote, InvoiceStatus, QuoteStatus } from '../types';
import { CURRENCIES } from '../constants';

const HomeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const { path } = useLocalizedPath();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

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

  // KPI calculations
  const kpis = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const pendingInvoices = invoices.filter((i) => i.status === 'sent');
    const draftInvoices = invoices.filter((i) => i.status === 'draft');

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0);
    const draftAmount = draftInvoices.reduce((sum, i) => sum + i.total, 0);

    const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');
    const pendingQuotes = quotes.filter((q) => q.status === 'sent');

    // Determine primary currency (most used)
    const currencyCounts: Record<string, number> = {};
    invoices.forEach((i) => {
      currencyCounts[i.currency] = (currencyCounts[i.currency] || 0) + 1;
    });
    const primaryCurrency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'EUR';

    return {
      totalRevenue,
      pendingAmount,
      draftAmount,
      totalInvoices: invoices.length,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      draftCount: draftInvoices.length,
      totalQuotes: quotes.length,
      acceptedCount: acceptedQuotes.length,
      pendingQuotesCount: pendingQuotes.length,
      primaryCurrency: getCurrencySymbol(primaryCurrency),
    };
  }, [invoices, quotes]);

  // Recent documents (last 5, mixed invoices + quotes, sorted by date)
  const recentDocs = useMemo(() => {
    const all = [
      ...invoices.map((i) => ({
        type: 'invoice' as const,
        id: i.id,
        number: i.invoiceNumber,
        date: i.invoiceDate,
        clientName: i.clientName,
        total: i.total,
        currency: i.currency,
        status: i.status,
        createdAt: i.createdAt,
      })),
      ...quotes.map((q) => ({
        type: 'quote' as const,
        id: q.id,
        number: q.quoteNumber,
        date: q.quoteDate,
        clientName: q.clientName,
        total: q.total,
        currency: q.currency,
        status: q.status,
        createdAt: q.createdAt,
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
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {t('homeDashboard.welcome')}{firstName ? `, ${firstName}` : ''} 👋
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
          value={`${kpis.totalRevenue.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${kpis.primaryCurrency}`}
          icon={TrendingUp}
          color="text-green-600 bg-green-50"
          sub={t('homeDashboard.kpiPaid').replace('{count}', String(kpis.paidCount))}
        />
        <KpiCard
          label={t('homeDashboard.kpiPending')}
          value={`${kpis.pendingAmount.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${kpis.primaryCurrency}`}
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
              return (
                <div
                  key={`${doc.type}-${doc.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(path('/dashboard'))}
                >
                  <div className={`p-2.5 rounded-lg ${doc.type === 'invoice' ? 'bg-primary-50' : 'bg-green-50'}`}>
                    {doc.type === 'invoice' ? (
                      <FileText className="w-5 h-5 text-primary-600" />
                    ) : (
                      <FileCheck className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
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
