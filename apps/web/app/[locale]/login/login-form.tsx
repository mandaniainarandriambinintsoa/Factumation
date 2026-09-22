'use client';

import { useActionState, useState } from 'react';
import { ArrowRight, Chrome } from 'lucide-react';

import { authenticate, signInWithGoogle } from './actions';

export function LoginForm({
  locale,
  initialIntent = 'login',
}: {
  locale: string;
  initialIntent?: 'login' | 'signup';
}) {
  const [intent, setIntent] = useState<'login' | 'signup'>(initialIntent);
  const [state, action, pending] = useActionState(authenticate, { error: null });
  return (
    <div>
      <div className="mb-8 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
        {(['login', 'signup'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setIntent(value)}
            className={`focus-ring rounded-md px-4 py-2.5 transition ${intent === value ? 'bg-white font-medium text-[var(--primary-900)] shadow-sm' : 'text-slate-500'}`}
          >
            {value === 'login' ? 'Connexion' : 'Créer un compte'}
          </button>
        ))}
      </div>
      <form action={action} className="space-y-5">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="intent" value={intent} />
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Email</span>
          <input
            className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Mot de passe</span>
          <input
            className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
            name="password"
            type="password"
            minLength={6}
            autoComplete={intent === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </label>
        {state.error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {state.error}
          </p>
        )}
        <button
          disabled={pending}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary-900)] px-5 py-3 font-semibold text-white shadow-md transition enabled:hover:bg-[var(--primary-800)] disabled:opacity-60"
        >
          {pending
            ? 'Un instant…'
            : intent === 'login'
              ? 'Entrer dans mon espace'
              : 'Ouvrir mon espace'}
          <ArrowRight className="size-4" />
        </button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        ou
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <form action={signInWithGoogle}>
        <input type="hidden" name="locale" value={locale} />
        <button className="focus-ring flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-50">
          <Chrome className="size-4" />
          Continuer avec Google
        </button>
      </form>
    </div>
  );
}
