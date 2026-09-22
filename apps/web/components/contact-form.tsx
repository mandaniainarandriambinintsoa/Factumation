'use client';

import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useState } from 'react';

import { getPublicEnvironment } from '@/lib/env';

const translations = {
  fr: {
    sent: 'Message envoyé',
    thanks: 'Merci. Nous reviendrons vers vous dès que possible.',
    again: 'Envoyer un autre message',
    name: 'Nom',
    subject: 'Sujet',
    message: 'Message',
    website: 'Site web',
    sending: 'Envoi…',
    submit: 'Envoyer le message',
    failure: 'Le message n’a pas pu être envoyé.',
  },
  en: {
    sent: 'Message sent',
    thanks: 'Thank you. We will get back to you as soon as possible.',
    again: 'Send another message',
    name: 'Name',
    subject: 'Subject',
    message: 'Message',
    website: 'Website',
    sending: 'Sending…',
    submit: 'Send message',
    failure: 'The message could not be sent.',
  },
} as const;

export function ContactForm({ locale }: { locale: 'fr' | 'en' }) {
  const t = translations[locale];
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setStatus('sending');
    setError(null);
    const payload = Object.fromEntries(
      ['name', 'email', 'subject', 'message', 'website'].map((key) => [
        key,
        String(formData.get(key) ?? ''),
      ]),
    );
    try {
      const response = await fetch(`${getPublicEnvironment().apiUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? t.failure);
      }
      setStatus('success');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : t.failure);
    }
  }

  if (status === 'success')
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="mt-5 text-xl font-bold text-slate-900">{t.sent}</h2>
        <p className="mt-2 text-sm text-slate-600">{t.thanks}</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 text-sm font-semibold text-blue-700 underline"
        >
          {t.again}
        </button>
      </div>
    );

  const field =
    'focus-ring mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm';
  return (
    <form action={submit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          {t.name}
          <input name="name" required minLength={2} maxLength={160} className={field} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          E-mail
          <input name="email" type="email" required maxLength={254} className={field} />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          {t.subject}
          <input name="subject" required minLength={2} maxLength={200} className={field} />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          {t.message}
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm"
          />
        </label>
        <label className="hidden" aria-hidden="true">
          {t.website}
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {status === 'error' ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <button
        disabled={status === 'sending'}
        className="focus-ring mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--primary-900)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-800)] disabled:opacity-50"
      >
        {status === 'sending' ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {status === 'sending' ? t.sending : t.submit}
      </button>
    </form>
  );
}
