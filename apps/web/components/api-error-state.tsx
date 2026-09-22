import { CircleAlert } from 'lucide-react';

export function ApiErrorState({ message }: { message?: string | undefined }) {
  return (
    <div
      role="alert"
      className="mt-8 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <CircleAlert className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">Impossible de charger les données</p>
        <p className="mt-1">{message ?? 'Vérifiez que l’API est disponible puis réessayez.'}</p>
      </div>
    </div>
  );
}
