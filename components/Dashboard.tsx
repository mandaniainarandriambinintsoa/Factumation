import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileCheck, Trash2, Download, Loader2, AlertCircle, Calendar, Building2, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import SEOHead from './SEOHead';
import { getInvoices, getQuotes, deleteInvoice, deleteQuote } from '../services/historyService';
import { SavedInvoice, SavedQuote } from '../types';
import { CURRENCIES } from '../constants';

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEOHead title={t('seo.dashboardTitle')} description={t('seo.dashboardDescription')} path="/dashboard" />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.title')}</h1>
        <p className="mt-2 text-slate-600">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Error Message */}
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

      {/* Content */}
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
            {invoices.map((invoice) => (
              <DocumentCard
                key={invoice.id}
                type="invoice"
                number={invoice.invoiceNumber}
                date={formatDate(invoice.invoiceDate)}
                clientName={invoice.clientName}
                companyName={invoice.companyName}
                total={invoice.total}
                currency={getCurrencySymbol(invoice.currency)}
                hasPdf={!!invoice.pdfBase64}
                isDeleting={deletingId === invoice.id}
                onDownload={() =>
                  invoice.pdfBase64 &&
                  downloadPdf(invoice.pdfBase64, `Facture-${invoice.invoiceNumber}.pdf`)
                }
                onDelete={() => handleDeleteInvoice(invoice.id)}
              />
            ))}
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
          {quotes.map((quote) => (
            <DocumentCard
              key={quote.id}
              type="quote"
              number={quote.quoteNumber}
              date={formatDate(quote.quoteDate)}
              clientName={quote.clientName}
              companyName={quote.companyName}
              total={quote.total}
              currency={getCurrencySymbol(quote.currency)}
              hasPdf={!!quote.pdfBase64}
              isDeleting={deletingId === quote.id}
              onDownload={() =>
                quote.pdfBase64 &&
                downloadPdf(quote.pdfBase64, `Devis-${quote.quoteNumber}.pdf`)
              }
              onDelete={() => handleDeleteQuote(quote.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Document Card Component
interface DocumentCardProps {
  type: 'invoice' | 'quote';
  number: string;
  date: string;
  clientName: string;
  companyName: string;
  total: number;
  currency: string;
  hasPdf: boolean;
  isDeleting: boolean;
  onDownload: () => void;
  onDelete: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  type,
  number,
  date,
  clientName,
  companyName,
  total,
  currency,
  hasPdf,
  isDeleting,
  onDownload,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg ${
              type === 'invoice' ? 'bg-primary-50' : 'bg-green-50'
            }`}
          >
            {type === 'invoice' ? (
              <FileText className="w-6 h-6 text-primary-600" />
            ) : (
              <FileCheck className="w-6 h-6 text-green-600" />
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">{number}</h3>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {date}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {clientName}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {companyName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">
              {total.toFixed(2)} {currency}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasPdf && (
              <button
                onClick={onDownload}
                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Télécharger le PDF"
              >
                <Download size={20} />
              </button>
            )}
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Supprimer"
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Trash2 size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
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
      <button
        onClick={onAction}
        className="inline-flex items-center px-6 py-3 bg-primary-900 text-white font-medium rounded-full hover:bg-primary-800 transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  );
};

export default Dashboard;
