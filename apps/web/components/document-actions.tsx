'use client';

import {
  Check,
  CheckCircle2,
  Download,
  Loader2,
  Mail,
  Pencil,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { browserApiDownload, browserApiRequest, BrowserApiError } from '@/lib/api/browser-api';

export function DocumentActions({
  kind,
  id,
  status,
  calculationVersion,
  locale,
}: {
  kind: 'invoice' | 'quote';
  id: string;
  status: string;
  calculationVersion: 'legacy-v1' | 'v2';
  locale: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const collection = kind === 'invoice' ? 'invoices' : 'quotes';
  const act = async (action: 'issue' | 'send' | 'mark-paid' | 'accept' | 'reject') => {
    setPending(action);
    setError(null);
    try {
      await browserApiRequest(`/${collection}/${id}/${action}`, { method: 'POST' });
      router.refresh();
    } catch (cause) {
      setError(cause instanceof BrowserApiError ? cause.message : 'Action impossible.');
    } finally {
      setPending(null);
    }
  };
  const download = async () => {
    setPending('pdf');
    setError(null);
    try {
      const blob = await browserApiDownload(`/${collection}/${id}/pdf`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${kind === 'invoice' ? 'Facture' : 'Devis'}-${id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof BrowserApiError ? cause.message : 'Le PDF n’a pas pu être généré.');
    } finally {
      setPending(null);
    }
  };
  const duplicateForEditing = async () => {
    setPending('duplicate');
    setError(null);
    try {
      const copy = await browserApiRequest<{ id: string }>(`/invoices/${id}/duplicate`, {
        method: 'POST',
      });
      router.push(`/${locale}/invoices/${copy.id}/edit`);
    } catch (cause) {
      setError(
        cause instanceof BrowserApiError
          ? cause.message
          : 'La copie modifiable n’a pas pu être créée.',
      );
      setPending(null);
    }
  };
  const deleteDraft = async () => {
    setPending('delete');
    setError(null);
    try {
      await browserApiRequest<void>(`/invoices/${id}`, { method: 'DELETE' });
      router.push(`/${locale}/invoices`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof BrowserApiError ? cause.message : 'La facture n’a pas pu être supprimée.',
      );
      setPending(null);
      setConfirmDelete(false);
    }
  };
  const button =
    'focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50';
  return (
    <div>
      <div className="flex flex-wrap justify-end gap-2">
        {kind === 'invoice' && status !== 'draft' ? (
          <button
            type="button"
            onClick={() => void duplicateForEditing()}
            disabled={pending !== null}
            className={`${button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
          >
            {pending === 'duplicate' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Pencil className="size-4" />
            )}
            Modifier
          </button>
        ) : null}
        <button
          onClick={download}
          disabled={pending !== null}
          className={`${button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
        >
          {pending === 'pdf' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          PDF
        </button>
        {status === 'draft' && calculationVersion === 'v2' ? (
          <button
            onClick={() => act('issue')}
            disabled={pending !== null}
            className={`${button} bg-[var(--primary-900)] text-white hover:bg-[var(--primary-800)]`}
          >
            {pending === 'issue' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Émettre
          </button>
        ) : null}
        {status === 'issued' ? (
          <button
            onClick={() => act('send')}
            disabled={pending !== null}
            className={`${button} bg-[var(--primary-900)] text-white hover:bg-[var(--primary-800)]`}
          >
            {pending === 'send' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Envoyer
          </button>
        ) : null}
        {kind === 'invoice' && (status === 'issued' || status === 'sent') ? (
          <button
            onClick={() => act('mark-paid')}
            disabled={pending !== null}
            className={`${button} bg-emerald-600 text-white hover:bg-emerald-700`}
          >
            {pending === 'mark-paid' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Marquer payée
          </button>
        ) : null}
        {kind === 'quote' && (status === 'issued' || status === 'sent') ? (
          <>
            <button
              onClick={() => act('accept')}
              disabled={pending !== null}
              className={`${button} bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              {pending === 'accept' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Accepter
            </button>
            <button
              onClick={() => act('reject')}
              disabled={pending !== null}
              className={`${button} border border-red-200 bg-white text-red-700 hover:bg-red-50`}
            >
              {pending === 'reject' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <X className="size-4" />
              )}
              Refuser
            </button>
          </>
        ) : null}
        {kind === 'invoice' && status === 'draft' && calculationVersion === 'v2' ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={pending !== null}
            className={`${button} border border-red-200 bg-white text-red-700 hover:bg-red-50`}
          >
            <Trash2 className="size-4" />
            Supprimer
          </button>
        ) : null}
      </div>
      {confirmDelete ? (
        <div
          role="alert"
          aria-labelledby="delete-invoice-title"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-left"
        >
          <p id="delete-invoice-title" className="text-sm font-semibold text-red-900">
            Supprimer définitivement ce brouillon ?
          </p>
          <p className="mt-1 text-xs leading-5 text-red-700">Cette action est irréversible.</p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={pending !== null}
              className={`${button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void deleteDraft()}
              disabled={pending !== null}
              className={`${button} bg-red-700 text-white hover:bg-red-800`}
            >
              {pending === 'delete' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Confirmer la suppression
            </button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-right text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
