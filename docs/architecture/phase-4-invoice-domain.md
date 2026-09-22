# Phase 4 — Invoice domain

Status: first API slice complete locally; database migration and traffic cutover not yet validated.

## Scope delivered

- Server-authoritative decimal calculations from `@factumation/domain` using half-up rounding.
- Explicit `none`, `vat`, and `withholding` tax modes.
- Owner-scoped invoice list and detail endpoints.
- Idempotent draft creation with a request fingerprint.
- Draft-only updates with a compare-at-write filter.
- Atomic invoice issuance and official numbering in PostgreSQL.
- Read compatibility for legacy line items (`name`) and v2 line items (`description`).
- No `pdf_base64`, owner identifier, idempotency key, or request fingerprint in API responses.

## HTTP contract

All routes require a valid Supabase bearer token.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/invoices` | Paginated owner-scoped list, optionally filtered by status |
| `GET` | `/api/v1/invoices/:id` | Owner-scoped detail |
| `POST` | `/api/v1/invoices` | Create a draft; requires `Idempotency-Key` |
| `PATCH` | `/api/v1/invoices/:id` | Recalculate and update a v2 draft |
| `POST` | `/api/v1/invoices/:id/issue` | Atomically allocate the official number and issue |

Draft references are not legal invoice numbers. The official number is allocated only by
`issue_invoice`, while the target invoice row is locked. Counter updates use PostgreSQL upsert
locking, so concurrent issuance cannot allocate the same number.

## Prepared database migration

`supabase/migrations/20260922_invoice_v2_foundation.sql`:

- adds v2 ownership references, calculation fields, issuance metadata, and idempotency metadata;
- leaves legacy rows untouched and maps their null v2 fields to `legacy-v1` at the API boundary,
  preserving the observed withholding behavior without a large blocking backfill;
- creates partial uniqueness constraints for official numbers and creation idempotency;
- validates item arithmetic and all totals inside the draft RPC, because authenticated clients
  can call Supabase RPCs without traversing Nest;
- verifies company and client ownership under RLS;
- creates the locked per-company/per-year document counter;
- exposes only the two required functions to `authenticated` and revokes anonymous access.

## Staging gate

Do not apply this migration to production until all of the following are available:

1. A fresh schema snapshot produced with `docs/runbooks/supabase-schema-snapshot.md`.
2. A staging Supabase project or isolated branch with representative legacy records.
3. An authenticated test account owning at least one company and client.
4. A database backup and confirmed point-in-time recovery window.

On staging, apply the migration in one transaction, then test duplicate-key/same-payload replay,
duplicate-key/different-payload rejection, cross-owner access, concurrent issuance, legacy reads,
and draft-update/issue races. Compare record counts and monetary aggregates before and after.

## Rollback strategy

Before application traffic writes v2 invoices, rollback can restore the pre-migration database
backup. After v2 writes begin, do not drop columns or counters: roll the API back, disable v2 draft
creation, retain the additive schema, and deploy a reviewed forward fix. Removing v2 structures
would destroy issuance and idempotency history.

## Remaining dependency

The SQL has not been executed against a real Supabase schema because this workspace currently has
only the public anonymous key. The legacy frontend adapter, traffic cutover, concurrency tests on
PostgreSQL, and staging validation remain phase-exit requirements.
