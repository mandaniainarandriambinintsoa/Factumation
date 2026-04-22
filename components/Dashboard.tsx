import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, FileCheck, Trash2, Download, Loader2, AlertCircle,
  Calendar, Building2, User, CheckCircle2, Clock, Send, Ban,
  XCircle, Timer, CreditCard, RefreshCw, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import SEOHead from './SEOHead';
import { getInvoices, getQuotes, deleteInvoice, deleteQuote, updateInvoiceStatus } from '../services/historyService';
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

type TabType = 'invoices' | 'quotes';

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useI18n();
  const { path } = useLocalizedPath();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('invoices');
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [modal, setModal] = useState<{ type: 'markPaid' | 'markSent' | 'reminder'; invoice: SavedInvoice } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(path('/'));
    }
  }, [user, authLoading, navigate, path]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const [invoicesResult, quotesResult] = await Promise.all([
      getInvoices(),
      getQuotes(),
    ]);

    if (invoicesResult.error) {
      setError(invoicesResult.error);
    } else {
      setInvoices(invoicesResult.data);
    }

    if (quotesResult.error && !error) {
      setError(quotesResult.error);
    } else {
      setQuotes(quotesResult.data);
    }

    setLoading(false);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm(t('dashboard.confirmDeleteInvoice'))) return;

    setDeletingId(id);
    const result = await deleteInvoice(id);

    if (result.error) {
      setError(result.error);
    } else {
      setInvoices(invoices.filter((inv) => inv.id !== id));
    }

    setDeletingId(null);
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm(t('dashboard.confirmDeleteQuote'))) return;

    setDeletingId(id);
    const result = await deleteQuote(id);

    if (result.error) {
      setError(result.error);
    } else {
      setQuotes(quotes.filter((q) => q.id !== id));
    }

    setDeletingId(null);
  };

  const handleMarkPaid = async () => {
    if (!modal || modal.type !== 'markPaid') return;
    setActionLoading(true);
    setActionError(null);

    const result = await updateInvoiceStatus(modal.invoice.id, 'paid');
    if (result.error) {
      setActionError(result.error);
      setActionLoading(false);
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === modal.invoice.id ? { ...inv, status: 'paid' } : inv))
    );
    setActionLoading(false);
    setModal(null);
    setActionSuccess(t('homeDashboard.markedPaidSuccess'));
  };

  const handleMarkSent = async () => {
    if (!modal || modal.type !== 'markSent') return;
    setActionLoading(true);
    setActionError(null);

    const result = await updateInvoiceStatus(modal.invoice.id, 'sent');
    if (result.error) {
      setActionError(result.error);
      setActionLoading(false);
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === modal.invoice.id ? { ...inv, status: 'sent' as const } : inv))
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
      const inv = modal.invoice;
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'reminder',
          data: {
            companyName: inv.companyName,
            companyEmail: inv.companyEmail,
            companyPhone: inv.companyPhone,
            clientName: inv.clientName,
            clientEmail: inv.clientEmail,
            documentNumber: inv.invoiceNumber,
            documentDate: inv.invoiceDate,
            dueDate: inv.dueDate,
            currency: inv.currency,
            items: inv.items,
          },
          pdfBase64: inv.pdfBase64 || '',
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
    } catch {
      setActionError(t('homeDashboard.reminderError'));
      setActionLoading(false);
    }
  };

  const downloadPdf = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find((c) => c.code === code)?.symbol || code;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusConfig: Record<string, { color: string; icon: React.ElementType; labelKey: string }> = {
    draft: { color: 'text-slate-500 bg-slate-100', icon: Clock, labelKey: 'homeDashboard.statusDraft' },
    sent: { color: 'text-blue-600 bg-blue-50', icon: Send, labelKey: 'homeDashboard.statusSent' },
    paid: { color: 'text-green-600 bg-green-50', icon: CheckCircle2, labelKey: 'homeDashboard.statusPaid' },
    cancelled: { color: 'text-red-600 bg-red-50', icon: Ban, labelKey: 'homeDashboard.statusCancelled' },
    accepted: { color: 'text-green-600 bg-green-50', icon: CheckCircle2, labelKey: 'homeDashboard.statusAccepted' },
    rejected: { color: 'text-red-600 bg-red-50', icon: XCircle, labelKey: 'homeDashboard.statusRejected' },
    expired: { color: 'text-amber-600 bg-amber-50', icon: Timer, labelKey: 'homeDashboard.statusExpired' },
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const closeModal = () => {
    setModal(null);
    setActionError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEOHead title={t('seo.dashboardTitle')} description={t('seo.dashboardDescription')} path="/dashboard" />

      {/* Success toast */}
      {actionSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.title')}</h1>
        <p className="mt-2 text-slate-600">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileText size={18} />
            {t('dashboard.invoicesTab')} ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quotes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'quotes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileCheck size={18} />
            {t('dashboard.quotesTab')} ({quotes.length})
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin w-8 h-8 text-primary-600" />
        </div>
      ) : activeTab === 'invoices' ? (
        invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('dashboard.noInvoices')}
            description={t('dashboard.noInvoicesDesc')}
            actionLabel={t('dashboard.createInvoice')}
            onAction={() => navigate(path('/create'))}
          />
        ) : (
          <div className="grid gap-4">
            {invoices.map((invoice) => {
              const sc = statusConfig[invoice.status] || statusConfig.draft;
              const StatusIcon = sc.icon;
              return (
                <div key={invoice.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary-50">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900">{invoice.invoiceNumber}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {t(sc.labelKey)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(invoice.invoiceDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {invoice.clientName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {invoice.companyName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {invoice.total.toFixed(2)} {getCurrencySymbol(invoice.currency)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {invoice.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setModal({ type: 'markSent', invoice })}
                            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            title={t('homeDashboard.markAsSent')}
                          >
                            <Send size={20} />
                          </Button>
                        )}
                        {invoice.status === 'sent' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setModal({ type: 'markPaid', invoice })}
                              className="text-green-600 hover:bg-green-50 hover:text-green-700"
                              title={t('homeDashboard.markAsPaid')}
                            >
                              <CreditCard size={20} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setModal({ type: 'reminder', invoice })}
                              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              title={t('homeDashboard.sendReminder')}
                            >
                              <RefreshCw size={20} />
                            </Button>
                          </>
                        )}
                        {invoice.pdfBase64 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadPdf(invoice.pdfBase64!, `Facture-${invoice.invoiceNumber}.pdf`)}
                            className="text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                            title="Télécharger le PDF"
                          >
                            <Download size={20} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          disabled={deletingId === invoice.id}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Supprimer"
                        >
                          {deletingId === invoice.id ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : (
                            <Trash2 size={20} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title={t('dashboard.noQuotes')}
          description={t('dashboard.noQuotesDesc')}
          actionLabel={t('dashboard.createQuote')}
          onAction={() => navigate(path('/quote'))}
        />
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => {
            const sc = statusConfig[quote.status] || statusConfig.draft;
            const StatusIcon = sc.icon;
            return (
              <div key={quote.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-50">
                      <FileCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{quote.quoteNumber}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {t(sc.labelKey)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(quote.quoteDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {quote.clientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {quote.companyName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {quote.total.toFixed(2)} {getCurrencySymbol(quote.currency)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {quote.pdfBase64 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadPdf(quote.pdfBase64!, `Devis-${quote.quoteNumber}.pdf`)}
                          className="text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                          title="Télécharger le PDF"
                        >
                          <Download size={20} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuote(quote.id)}
                        disabled={deletingId === quote.id}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Supprimer"
                      >
                        {deletingId === quote.id ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <Trash2 size={20} />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                    <DialogDescription>{modal.invoice.invoiceNumber}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('homeDashboard.client')}</span>
                  <span className="font-medium text-slate-900">{modal.invoice.clientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('homeDashboard.amount')}</span>
                  <span className="font-bold text-blue-600">
                    {modal.invoice.total.toFixed(2)} {getCurrencySymbol(modal.invoice.currency)}
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
                    <DialogDescription>{modal.invoice.invoiceNumber}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('homeDashboard.client')}</span>
                  <span className="font-medium text-slate-900">{modal.invoice.clientName}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('homeDashboard.amount')}</span>
                  <span className="font-bold text-green-600">
                    {modal.invoice.total.toFixed(2)} {getCurrencySymbol(modal.invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('homeDashboard.date')}</span>
                  <span className="text-slate-700">{formatDate(modal.invoice.invoiceDate)}</span>
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
                    <DialogDescription>{modal.invoice.invoiceNumber}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('homeDashboard.client')}</span>
                  <span className="font-medium text-slate-900">{modal.invoice.clientName}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-700">{modal.invoice.clientEmail}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{t('homeDashboard.amount')}</span>
                  <span className="font-bold text-blue-600">
                    {modal.invoice.total.toFixed(2)} {getCurrencySymbol(modal.invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('homeDashboard.date')}</span>
                  <span className="text-slate-700">{formatDate(modal.invoice.invoiceDate)}</span>
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

interface EmptyStateProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">{description}</p>
      <Button size="pill" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
};

export default Dashboard;
