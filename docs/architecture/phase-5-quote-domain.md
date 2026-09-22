# Phase 5 — Quote domain

Status: API slice complete locally; database migration, email sending, and traffic cutover remain.

The quote module exposes owner-scoped list/detail, idempotent draft creation, draft-only updates,
atomic issuance, and guarded accept/reject transitions. It uses the shared decimal calculation
package but retains quote-specific dates and lifecycle rules.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/quotes` | Paginated list with optional status filter |
| `GET` | `/api/v1/quotes/:id` | Quote detail |
| `POST` | `/api/v1/quotes` | Create a draft; requires `Idempotency-Key` |
| `PATCH` | `/api/v1/quotes/:id` | Recalculate and update a v2 draft |
| `POST` | `/api/v1/quotes/:id/issue` | Allocate an official quote number atomically |
| `POST` | `/api/v1/quotes/:id/accept` | Transition an issued/sent quote to accepted |
| `POST` | `/api/v1/quotes/:id/reject` | Transition an issued/sent quote to rejected |

`supabase/migrations/20260923_quote_v2_foundation.sql` is additive and depends on the invoice v2
migration for `document_counters` and `document_audit_events`. It leaves legacy rows untouched,
enforces calculations inside the database RPC, applies the monthly plan quota under an advisory
lock, snapshots owned company/client data, and records lifecycle audit events.

The `send` action is deliberately deferred to the backend email phase: changing the state without
durable delivery would falsely claim that a quote was sent. Quote-to-invoice conversion also remains
deferred until its immutable copy and idempotency contract is documented.

Before production, run both migrations against an isolated Supabase branch, test concurrent
numbering and quotas, verify legacy reads, validate RLS/grants, and switch exactly one frontend write
path at a time. Rollback follows the additive/forward-fix policy described for invoices.
