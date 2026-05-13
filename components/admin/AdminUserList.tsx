import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, Loader2, Mail, Shield, Pencil, Crown, CreditCard, AlertTriangle,
  CheckCircle2, XCircle, Send,
} from 'lucide-react';
import {
  getUsersWithSubs,
  updateUserSubscription,
  broadcastEmail,
  AdminUserWithSub,
  SubscriptionPlan,
  SubscriptionStatus,
  BroadcastResult,
} from '../../services/adminService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../ui/dialog';

const PLAN_BADGE: Record<SubscriptionPlan, string> = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-blue-100 text-blue-700',
  business: 'bg-purple-100 text-purple-700',
};

const STATUS_BADGE: Record<SubscriptionStatus, string> = {
  active: 'bg-green-100 text-green-700',
  canceled: 'bg-red-100 text-red-700',
  past_due: 'bg-orange-100 text-orange-700',
  trialing: 'bg-blue-50 text-blue-600',
  incomplete: 'bg-slate-100 text-slate-500',
};

const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  free: 'Gratuit',
  pro: 'Pro',
  business: 'Business',
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Actif',
  canceled: 'Annulé',
  past_due: 'Impayé',
  trialing: 'Essai',
  incomplete: 'Incomplet',
};

const formatDate = (d: string | null): string => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<AdminUserWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<AdminUserWithSub | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsersWithSubs(page, perPage);
      setUsers(data.users);
    } catch (err) {
      setError((err as Error).message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    setSelected(new Set());
  }, [page]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  };

  const selectedUsers = useMemo(
    () => users.filter((u) => selected.has(u.id)),
    [users, selected]
  );

  const paidCount = useMemo(
    () => users.filter((u) => u.plan !== 'free' && u.status === 'active').length,
    [users]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Utilisateurs</h2>
          <p className="text-sm text-slate-500 mt-1">
            {users.length} affichés · <span className="text-green-700 font-medium">{paidCount} payants</span> ·{' '}
            <span className="text-slate-500">{users.length - paidCount} gratuits</span>
          </p>
        </div>
        {selected.size > 0 && (
          <Button onClick={() => setBroadcastOpen(true)} size="sm">
            <Mail className="w-4 h-4" />
            Envoyer un email ({selected.size})
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <p className="mt-1 text-red-500">Vérifiez que l'edge function <code>admin</code> est déployée et que la migration <code>20260513_subscription_admin_overrides.sql</code> est appliquée.</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      checked={users.length > 0 && selected.size === users.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Expire le</th>
                  <th className="px-4 py-3">Inscrit le</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const expireDate = user.source === 'manual'
                    ? user.manualExpiresAt
                    : user.currentPeriodEnd;
                  return (
                    <tr key={user.id} className={`hover:bg-slate-50 ${selected.has(user.id) ? 'bg-primary-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner ${user.email}`}
                          checked={selected.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{user.name || '—'}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE[user.plan]}`}>
                          {user.plan !== 'free' && <Crown className="w-3 h-3" />}
                          {PLAN_LABEL[user.plan]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[user.status]}`}>
                          {STATUS_LABEL[user.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.source === 'manual' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <Shield className="w-3 h-3" /> Manuel
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                            <CreditCard className="w-3 h-3" /> Stripe
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(expireDate)}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingUser(user)}
                          className="text-slate-400 hover:text-primary-600"
                          aria-label="Modifier l'abonnement"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className={`p-4 ${selected.has(user.id) ? 'bg-primary-50/50' : ''}`}>
                <div className="flex items-start gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={selected.has(user.id)}
                    onChange={() => toggleSelect(user.id)}
                    className="mt-1 rounded border-slate-300"
                  />
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{user.name || '—'}</p>
                    <p className="text-sm text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE[user.plan]}`}>
                    {user.plan !== 'free' && <Crown className="w-3 h-3" />}
                    {PLAN_LABEL[user.plan]}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[user.status]}`}>
                    {STATUS_LABEL[user.status]}
                  </span>
                  {user.source === 'manual' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Shield className="w-3 h-3" /> Manuel
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && !error && (
            <div className="p-12 text-center text-slate-500">Aucun utilisateur trouvé</div>
          )}
        </div>
      )}

      {users.length >= perPage && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-sm text-slate-600">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Suivant
          </button>
        </div>
      )}

      <EditSubscriptionModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={() => {
          setEditingUser(null);
          loadUsers();
        }}
      />

      <BroadcastEmailModal
        open={broadcastOpen}
        recipients={selectedUsers}
        onClose={() => setBroadcastOpen(false)}
      />
    </div>
  );
};

// ---------- Edit Subscription Modal ----------
interface EditModalProps {
  user: AdminUserWithSub | null;
  onClose: () => void;
  onSaved: () => void;
}

const EditSubscriptionModal: React.FC<EditModalProps> = ({ user, onClose, onSaved }) => {
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPlan(user.plan);
      setStatus(user.status);
      setExpiresAt(user.manualExpiresAt ? user.manualExpiresAt.split('T')[0] : '');
      setNotes(user.adminNotes || '');
      setErr(null);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setErr(null);
    try {
      await updateUserSubscription(user.id, {
        plan,
        status,
        manualExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        adminNotes: notes.trim() || null,
      });
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'abonnement</DialogTitle>
          <DialogDescription>
            {user?.email} — l'override sera marqué <code className="text-amber-700">source = manual</code>
          </DialogDescription>
        </DialogHeader>

        {user?.hasStripeCustomer && (
          <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Cet utilisateur a un client Stripe actif. L'override manuel empêchera les webhooks Stripe de réécrire ces valeurs.</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="free">Gratuit</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Statut</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="active">Actif</option>
              <option value="trialing">Essai</option>
              <option value="past_due">Impayé</option>
              <option value="canceled">Annulé</option>
              <option value="incomplete">Incomplet</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Expire le (optionnel)</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-slate-400">Date de fin d'abonnement manuel. Ignoré si vide.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Note interne</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex : payé par virement bancaire le 12/05/2026, ref TX-4521"
            />
            <p className="text-xs text-slate-400">Visible uniquement par l'admin. Jamais exposé au client.</p>
          </div>

          {err && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{err}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement</> : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Broadcast Email Modal ----------
interface BroadcastModalProps {
  open: boolean;
  recipients: AdminUserWithSub[];
  onClose: () => void;
}

const BroadcastEmailModal: React.FC<BroadcastModalProps> = ({ open, recipients, onClose }) => {
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [fromName, setFromName] = useState('Factumation');
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setResult(null);
      setErr(null);
    }
  }, [open]);

  const handleSend = async () => {
    if (!subject.trim() || !html.trim()) {
      setErr('Sujet et corps sont requis.');
      return;
    }
    setSending(true);
    setErr(null);
    try {
      const res = await broadcastEmail(
        recipients.map((r) => r.id),
        subject,
        html,
        {
          fromName: fromName.trim() || undefined,
          replyTo: replyTo.trim() || undefined,
        }
      );
      setResult(res);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Envoyer un email à {recipients.length} utilisateur(s)</DialogTitle>
          <DialogDescription>
            1 envoi individuel par destinataire via Resend (aucun BCC, anonymat préservé).
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Rappel RGPD</p>
            <p className="mt-1">Cet outil est réservé aux communications liées au service (mises à jour produit, support, facturation). Ne pas utiliser pour de la prospection commerciale non sollicitée.</p>
          </div>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                {result.sent} envoyé(s) sur {result.total}
              </div>
              {result.failed > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                    <XCircle className="w-4 h-4" />
                    {result.failed} échec(s)
                  </div>
                  <ul className="text-xs text-red-700 space-y-1">
                    {result.failures.map((f, i) => (
                      <li key={i}><span className="font-medium">{f.email}</span> — {f.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={onClose}>Fermer</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nom expéditeur</Label>
                  <Input
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Factumation"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Reply-to (optionnel)</Label>
                  <Input
                    type="email"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    placeholder="contact@factumation.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Sujet *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Nouveautés produit Factumation — mai 2026"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Corps (HTML) *</Label>
                <Textarea
                  rows={10}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<p>Bonjour,</p><p>Nous venons de déployer...</p>"
                  className="font-mono text-xs"
                />
                <p className="text-xs text-slate-400">HTML simple supporté. Tu peux coller du texte brut, les sauts de ligne ne seront pas préservés sans balises.</p>
              </div>

              {html.trim() && (
                <div className="space-y-1.5">
                  <Label>Aperçu</Label>
                  <div
                    className="border border-slate-200 rounded-lg p-4 bg-white text-sm max-h-48 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              )}

              {err && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{err}</div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={sending}>Annuler</Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><Send className="w-4 h-4" /> Envoyer à {recipients.length}</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserList;
