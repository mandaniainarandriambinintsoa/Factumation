'use client';

import { Check, Copy, KeyRound, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { browserApiRequest } from '@/lib/api/browser-api';

type Credential = {
  clientId: string;
  clientName: string;
  keyId: string;
  prefix: string;
  scopes: string[];
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

const scopes = ['invoices:read', 'quotes:read', 'clients:read', 'companies:read'] as const;

export function ApiKeyManager() {
  const [credentials, setCredentials] = useState<Credential[] | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setPending(true);
    setError(null);
    try {
      setCredentials(await browserApiRequest<Credential[]>('/api-keys'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Les clés API sont indisponibles.');
    } finally {
      setPending(false);
    }
  }

  async function create(formData: FormData) {
    setPending(true);
    setError(null);
    setCreatedKey(null);
    try {
      const result = await browserApiRequest<{ apiKey: string }>('/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          name: String(formData.get('name') ?? ''),
          scopes: formData.getAll('scopes'),
          expiresAt: formData.get('expiresAt')
            ? new Date(`${String(formData.get('expiresAt'))}T23:59:59.999Z`).toISOString()
            : undefined,
          allowedCompanyIds: [],
        }),
      });
      setCreatedKey(result.apiKey);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La clé n’a pas pu être créée.');
      setPending(false);
    }
  }

  async function revoke(keyId: string) {
    setPending(true);
    setError(null);
    try {
      await browserApiRequest<void>(`/api-keys/${keyId}`, { method: 'DELETE' });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La clé n’a pas pu être révoquée.');
      setPending(false);
    }
  }

  async function copyKey() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
  }

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <KeyRound className="size-5 text-blue-600" /> Clés API
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Accès externe en lecture seule, avec scopes et révocation immédiate.
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={load}
          className="focus-ring inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Charger
        </button>
      </div>
      {createdKey ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Copiez cette clé maintenant.</p>
          <p className="mt-1 text-xs text-amber-800">Elle ne sera plus affichée ensuite.</p>
          <code className="mt-3 block overflow-x-auto rounded bg-white p-3 text-xs text-slate-800">
            {createdKey}
          </code>
          <button
            type="button"
            onClick={copyKey}
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-800"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copiée' : 'Copier'}
          </button>
        </div>
      ) : null}
      <form action={create} className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Nom de l’intégration
            <input
              name="name"
              required
              minLength={2}
              maxLength={120}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Expiration optionnelle
            <input
              name="expiresAt"
              type="date"
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium text-slate-700">Scopes</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {scopes.map((scope) => (
                <label key={scope} className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" name="scopes" value={scope} /> {scope}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <button
          disabled={pending}
          className="focus-ring self-end rounded-lg bg-[var(--primary-900)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Créer une clé
        </button>
      </form>
      {credentials ? (
        <div className="mt-5 space-y-2">
          {credentials.map((credential) => (
            <div
              key={credential.keyId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm"
            >
              <div>
                <strong className="text-slate-900">{credential.clientName}</strong>
                <span className="ml-2 font-mono text-xs text-slate-500">
                  fak_live_{credential.prefix}…
                </span>
                <p className="mt-1 text-xs text-slate-500">{credential.scopes.join(' · ')}</p>
              </div>
              {credential.revokedAt ? (
                <span className="text-xs font-semibold text-slate-400">Révoquée</span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => revoke(credential.keyId)}
                  className="focus-ring inline-flex items-center gap-1 rounded-md text-xs font-semibold text-red-700"
                >
                  <Trash2 className="size-4" /> Révoquer
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
