import { FileText } from 'lucide-react';
import Link from 'next/link';

import type { Invoice, Quote } from '@/lib/api/types';
import { formatDate, formatMoney } from '@/lib/format';
import { EmptyState } from './empty-state';
import { StatusBadge } from './status-badge';

export function DocumentList({
  items,
  locale,
  kind,
}: {
  items: Array<Invoice | Quote>;
  locale: string;
  kind: 'invoices' | 'quotes';
}) {
  if (!items.length) {
    const invoice = kind === 'invoices';
    return (
      <EmptyState
        icon={FileText}
        title={invoice ? 'Aucune facture' : 'Aucun devis'}
        description={
          invoice
            ? 'Créez votre première facture pour commencer à suivre votre activité.'
            : 'Créez votre premier devis et retrouvez-le ici.'
        }
        action={{
          href: `/${locale}/${kind}/new`,
          label: invoice ? 'Créer une facture' : 'Créer un devis',
        }}
      />
    );
  }
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => {
        const date = 'invoiceDate' in item ? item.invoiceDate : item.quoteDate;
        return (
          <Link
            key={item.id}
            href={`/${locale}/${kind}/${item.id}`}
            className="focus-ring grid gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_9rem] sm:items-center sm:px-6"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">
                {item.number ?? item.draftReference ?? 'Brouillon'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Créé le {formatDate(date, locale)}</p>
            </div>
            <div>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-sm text-slate-500 sm:text-right">{formatDate(date, locale)}</p>
            <p className="font-semibold text-slate-900 sm:text-right">
              {formatMoney(item.total, item.currency, locale)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
