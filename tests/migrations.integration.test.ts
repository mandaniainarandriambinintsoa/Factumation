import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const migrationFiles = [
  '20260719_create_blog_posts.sql',
  '20260720_create_papi_payments.sql',
  '20260721_harden_legacy_functions.sql',
  '20260921_atomic_default_company.sql',
  '20260922_invoice_v2_foundation.sql',
  '20260923_quote_v2_foundation.sql',
  '20260924_document_delivery.sql',
  '20260925_private_document_storage.sql',
  '20260926_external_api_keys.sql',
  '20260927_fix_document_status_constraints.sql',
];

const baseline = `
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE SCHEMA auth;
CREATE SCHEMA storage;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  'SELECT nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
  'SELECT ''{}''::jsonb';
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
  'SELECT ''authenticated''::text';
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE FUNCTION public.ensure_single_default_company() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
  'BEGIN RETURN NEW; END';

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL, address text, email text, phone text, logo_url text, fiscal_region text,
  siret text, vat_number text, nif text, stat text, iban text, bic text,
  default_currency text, default_payment_method text, invoice_prefix text, quote_prefix text,
  is_default boolean DEFAULT false, notes text, created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL, email text NOT NULL, address text, phone text, company_name text,
  fiscal_region text, siret text, vat_number text, nif text, stat text, notes text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  plan text NOT NULL DEFAULT 'free', status text NOT NULL DEFAULT 'active', source text DEFAULT 'stripe',
  current_period_start timestamptz, current_period_end timestamptz, manual_expires_at timestamptz,
  cancel_at_period_end boolean DEFAULT false, created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE FUNCTION public.handle_new_user_subscription() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS 'BEGIN RETURN NEW; END';
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE,
  lang text NOT NULL DEFAULT 'fr', title text NOT NULL, excerpt text NOT NULL,
  content text NOT NULL, keywords text[] DEFAULT '{}', author text NOT NULL DEFAULT 'Factumation',
  published boolean DEFAULT false, published_at timestamptz, read_time integer DEFAULT 5,
  image text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_blog_posts_published_lang ON public.blog_posts(published, lang);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published posts" ON public.blog_posts FOR SELECT
  USING (published = true);
CREATE POLICY "Admin full access" ON public.blog_posts FOR ALL USING (true) WITH CHECK (true);
CREATE TABLE public.papi_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
  plan text NOT NULL, amount integer NOT NULL, currency text NOT NULL DEFAULT 'MGA', provider text,
  reference text NOT NULL UNIQUE, payment_link text, notification_token text, status text NOT NULL,
  papi_payload jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_papi_payments_user_id ON public.papi_payments(user_id);
CREATE INDEX idx_papi_payments_reference ON public.papi_payments(reference);
CREATE INDEX idx_papi_payments_status ON public.papi_payments(status);
ALTER TABLE public.papi_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own papi payments" ON public.papi_payments FOR SELECT USING (true);
CREATE POLICY "Service role full access on papi payments" ON public.papi_payments FOR ALL USING (true);
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
  invoice_number text NOT NULL, invoice_date date NOT NULL, due_date date,
  company_name text NOT NULL, company_address text, company_email text NOT NULL,
  company_phone text, logo_url text, client_name text NOT NULL, client_address text,
  client_email text NOT NULL, client_phone text, items jsonb NOT NULL,
  tax_rate numeric NOT NULL DEFAULT 0, total numeric NOT NULL, currency text NOT NULL,
  payment_method text, status text DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  notes text, pdf_base64 text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
  quote_number text NOT NULL, quote_date date NOT NULL, validity_date date NOT NULL,
  company_name text NOT NULL, company_address text, company_email text NOT NULL,
  company_phone text, logo_url text, client_name text NOT NULL, client_address text,
  client_email text NOT NULL, client_phone text, items jsonb NOT NULL,
  tax_rate numeric NOT NULL DEFAULT 0, total numeric NOT NULL, currency text NOT NULL,
  payment_method text, status text DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  notes text, pdf_base64 text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE storage.buckets (
  id text PRIMARY KEY, name text NOT NULL, public boolean NOT NULL DEFAULT false,
  file_size_limit bigint, allowed_mime_types text[]
);
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
  'SELECT string_to_array($1, ''/'')';
CREATE FUNCTION storage.extension(text) RETURNS text LANGUAGE sql IMMUTABLE AS
  'SELECT lower(split_part($1, ''.'', 2))';
`;

describe('staged Supabase migrations', () => {
  let database: PGlite;

  beforeAll(async () => {
    database = new PGlite();
    await database.exec(baseline);

    for (const file of migrationFiles) {
      const sql = await readFile(resolve('supabase/migrations', file), 'utf8');
      await database.exec(sql);
    }
  });

  afterAll(async () => {
    await database.close();
  });

  it('applies the complete migration chain against the legacy boundary', async () => {
    const buckets = await database.query<{ id: string; public: boolean }>(
      "SELECT id, public FROM storage.buckets WHERE id = 'document-pdfs'",
    );
    expect(buckets.rows).toEqual([{ id: 'document-pdfs', public: false }]);

    const functions = await database.query<{ name: string }>(`
      SELECT proname AS name FROM pg_proc
      WHERE proname IN ('create_invoice_draft', 'create_quote_draft', 'authenticate_api_key')
      ORDER BY proname
    `);
    expect(functions.rows.map((row) => row.name)).toEqual([
      'authenticate_api_key',
      'create_invoice_draft',
      'create_quote_draft',
    ]);
  }, 30_000);

  it('keeps draft creation and official numbering idempotent', async () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    const companyId = '00000000-0000-4000-8000-000000000002';
    const clientId = '00000000-0000-4000-8000-000000000003';
    await database.exec(`
      INSERT INTO auth.users(id) VALUES ('${userId}');
      INSERT INTO public.companies(
        id, user_id, name, email, invoice_prefix, quote_prefix, is_default
      ) VALUES ('${companyId}', '${userId}', 'Factumation Test', 'test@example.com', 'INV', 'DEV', true);
      INSERT INTO public.clients(id, user_id, name, email)
      VALUES ('${clientId}', '${userId}', 'Client Test', 'client@example.com');
      INSERT INTO public.subscriptions(user_id, plan, status)
      VALUES ('${userId}', 'pro', 'active');
      SELECT set_config('request.jwt.claim.sub', '${userId}', false);
    `);

    const createInvoice = () =>
      database.query<{ create_invoice_draft: string }>(
        `SELECT public.create_invoice_draft(
          $1::uuid, $2::uuid, NULL, $3::jsonb, 'EUR', '2026-09-22'::date,
          '2026-10-22'::date, 'vat', 20, 100, 20, 0, 120, 120,
          'Virement', 'Test', 'invoice-key-0001', $4
        )`,
        [
          companyId,
          clientId,
          JSON.stringify([
            { description: 'Service', quantity: '2', unitPrice: '50', total: '100' },
          ]),
          'a'.repeat(64),
        ],
      );
    const first = await createInvoice();
    const second = await createInvoice();
    expect(second.rows[0]?.create_invoice_draft).toBe(first.rows[0]?.create_invoice_draft);

    const invoiceId = first.rows[0]!.create_invoice_draft;
    await database.query('SELECT public.issue_invoice($1::uuid)', [invoiceId]);
    await database.query('SELECT public.issue_invoice($1::uuid)', [invoiceId]);
    const invoice = await database.query<{ invoice_number: string; status: string }>(
      'SELECT invoice_number, status FROM public.invoices WHERE id = $1::uuid',
      [invoiceId],
    );
    expect(invoice.rows[0]).toEqual({ invoice_number: 'INV-2026-000001', status: 'issued' });

    const counter = await database.query<{ last_value: string }>(
      "SELECT last_value::text FROM public.document_counters WHERE document_type = 'invoice'",
    );
    expect(counter.rows[0]?.last_value).toBe('1');
  });

  it('creates, authenticates, rate-counts, rotates and revokes an API credential', async () => {
    const created = await database.query<{ client_id: string; key_id: string }>(
      `SELECT * FROM public.create_api_credential(
        'Accounting', '{}'::uuid[], 'AbCdEf123456', $1,
        ARRAY['invoices:read']::text[], now() + interval '1 year'
      )`,
      ['b'.repeat(64)],
    );
    const firstKeyId = created.rows[0]!.key_id;
    const clientId = created.rows[0]!.client_id;

    const authenticated = await database.query<{
      key_id: string;
      rate_limited: boolean;
    }>('SELECT key_id, rate_limited FROM public.authenticate_api_key($1, $2)', [
      'AbCdEf123456',
      'b'.repeat(64),
    ]);
    expect(authenticated.rows[0]).toEqual({ key_id: firstKeyId, rate_limited: false });

    const rotated = await database.query<{ rotate_api_credential: string }>(
      `SELECT public.rotate_api_credential(
        $1::uuid, 'ZyXwVu654321', $2, ARRAY['invoices:read']::text[], NULL
      )`,
      [clientId, 'c'.repeat(64)],
    );
    expect(rotated.rows[0]?.rotate_api_credential).not.toBe(firstKeyId);

    await database.query('SELECT public.revoke_api_credential($1::uuid)', [firstKeyId]);
    const rejected = await database.query('SELECT * FROM public.authenticate_api_key($1, $2)', [
      'AbCdEf123456',
      'b'.repeat(64),
    ]);
    expect(rejected.rows).toHaveLength(0);
  });
});
