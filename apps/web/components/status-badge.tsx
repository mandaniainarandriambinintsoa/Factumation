const labels: Record<string, string> = {
  draft: 'Brouillon',
  issued: 'Émis',
  sent: 'Envoyé',
  paid: 'Payé',
  cancelled: 'Annulé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
};

const colors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  issued: 'bg-blue-50 text-blue-700',
  sent: 'bg-indigo-50 text-indigo-700',
  paid: 'bg-emerald-50 text-emerald-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
  rejected: 'bg-red-50 text-red-700',
  expired: 'bg-amber-50 text-amber-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] ?? colors.draft}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
