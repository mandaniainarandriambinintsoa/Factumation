import { Download, FileCheck2, Loader2, Mail, Save } from 'lucide-react';

export type SubmissionAction = 'draft' | 'issue' | 'pdf' | 'send';

export function DocumentActionStep({
  active,
  invoice,
  editing,
  pendingAction,
  onAction,
}: {
  active: boolean;
  invoice: boolean;
  editing: boolean;
  pendingAction: SubmissionAction | null;
  onAction: (action: SubmissionAction) => void;
}) {
  const disabled = pendingAction !== null;
  const button =
    'focus-ring flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50';
  return (
    <section
      aria-labelledby="action-step-title"
      className={`${active ? 'block' : 'hidden'} rounded-xl border border-slate-200 bg-white p-5 sm:hidden`}
    >
      <h2 id="action-step-title" className="font-semibold text-slate-900">
        Action
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {editing
          ? 'Enregistrez les modifications du document.'
          : `Choisissez ce que vous voulez faire avec ${invoice ? 'la facture' : 'le devis'}.`}
      </p>
      <div className="mt-5 space-y-3">
        <ActionButton
          action="draft"
          label={editing ? 'Enregistrer les modifications' : 'Enregistrer le brouillon'}
          icon={Save}
          primary={editing}
          disabled={disabled}
          pendingAction={pendingAction}
          buttonClass={button}
          onAction={onAction}
        />
        {!editing ? (
          <>
            <ActionButton
              action="issue"
              label={invoice ? 'Créer la facture' : 'Créer le devis'}
              icon={FileCheck2}
              primary
              disabled={disabled}
              pendingAction={pendingAction}
              buttonClass={button}
              onAction={onAction}
            />
            <ActionButton
              action="pdf"
              label="Créer et télécharger le PDF"
              icon={Download}
              disabled={disabled}
              pendingAction={pendingAction}
              buttonClass={button}
              onAction={onAction}
            />
            <ActionButton
              action="send"
              label="Créer et envoyer par e-mail"
              icon={Mail}
              disabled={disabled}
              pendingAction={pendingAction}
              buttonClass={button}
              onAction={onAction}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

function ActionButton({
  action,
  label,
  icon: Icon,
  primary = false,
  disabled,
  pendingAction,
  buttonClass,
  onAction,
}: {
  action: SubmissionAction;
  label: string;
  icon: typeof Save;
  primary?: boolean;
  disabled: boolean;
  pendingAction: SubmissionAction | null;
  buttonClass: string;
  onAction: (action: SubmissionAction) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      disabled={disabled}
      className={`${buttonClass} ${primary ? 'bg-[var(--primary-900)] text-white hover:bg-[var(--primary-800)]' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
    >
      {pendingAction === action ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4" />
      )}
      {label}
    </button>
  );
}
