'use client';

import { CircleAlert, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 lg:px-10">
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
          <CircleAlert className="size-6" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          Cette page n’a pas pu être chargée
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Vérifiez que l’API Factumation est disponible, puis réessayez.
        </p>
        <button
          onClick={reset}
          className="focus-ring mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--primary-900)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-800)]"
        >
          <RotateCcw className="size-4" />
          Réessayer
        </button>
      </div>
    </main>
  );
}
