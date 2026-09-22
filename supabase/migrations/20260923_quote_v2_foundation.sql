-- Prepared for staging validation. Requires 20260922_invoice_v2_foundation.sql.

BEGIN;

ALTER TABLE public.quotes
  ALTER COLUMN quote_number DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS draft_reference text,
  ADD COLUMN IF NOT EXISTS tax_mode text,
  ADD COLUMN IF NOT EXISTS subtotal numeric(18, 2),
  ADD COLUMN IF NOT EXISTS tax_amount numeric(18, 2),
  ADD COLUMN IF NOT EXISTS withholding_amount numeric(18, 2),
  ADD COLUMN IF NOT EXISTS amount_due numeric(18, 2),
  ADD COLUMN IF NOT EXISTS calculation_version text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS request_fingerprint text,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS quotes_v2_official_number_idx
  ON public.quotes (company_id, quote_number)
  WHERE calculation_version = 'v2' AND quote_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS quotes_owner_idempotency_idx
  ON public.quotes (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS quotes_owner_created_v2_idx
  ON public.quotes (user_id, created_at DESC, id DESC);

ALTER TABLE public.quotes
  DROP CONSTRAINT IF EXISTS quotes_tax_mode_check,
  ADD CONSTRAINT quotes_tax_mode_check
    CHECK (tax_mode IN ('none', 'vat', 'withholding')) NOT VALID,
  DROP CONSTRAINT IF EXISTS quotes_calculation_version_check,
  ADD CONSTRAINT quotes_calculation_version_check
    CHECK (calculation_version IN ('legacy-v1', 'v2')) NOT VALID,
  DROP CONSTRAINT IF EXISTS quotes_v2_amounts_check,
  ADD CONSTRAINT quotes_v2_amounts_check CHECK (
    calculation_version <> 'v2'
    OR (
      subtotal >= 0
      AND tax_amount >= 0
      AND withholding_amount >= 0
      AND amount_due >= 0
      AND total >= 0
    )
  ) NOT VALID;

ALTER TABLE public.quotes VALIDATE CONSTRAINT quotes_tax_mode_check;
ALTER TABLE public.quotes VALIDATE CONSTRAINT quotes_calculation_version_check;
ALTER TABLE public.quotes VALIDATE CONSTRAINT quotes_v2_amounts_check;

CREATE OR REPLACE FUNCTION public.create_quote_draft(
  p_company_id uuid,
  p_client_id uuid,
  p_client jsonb,
  p_items jsonb,
  p_currency text,
  p_quote_date date,
  p_validity_date date,
  p_tax_mode text,
  p_tax_rate numeric,
  p_subtotal numeric,
  p_tax_amount numeric,
  p_withholding_amount numeric,
  p_total numeric,
  p_amount_due numeric,
  p_payment_method text,
  p_notes text,
  p_idempotency_key text,
  p_request_fingerprint text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  company_record public.companies%ROWTYPE;
  client_record public.clients%ROWTYPE;
  existing_id uuid;
  existing_fingerprint text;
  created_id uuid;
  line_item jsonb;
  line_quantity numeric;
  line_unit_price numeric;
  line_total numeric;
  computed_subtotal numeric := 0;
  computed_adjustment numeric;
  effective_plan text := 'free';
  monthly_count bigint;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_idempotency_key IS NULL OR p_idempotency_key !~ '^[A-Za-z0-9._:-]{8,128}$' THEN
    RAISE EXCEPTION 'Invalid idempotency key' USING ERRCODE = '22023';
  END IF;
  IF p_request_fingerprint IS NULL OR p_request_fingerprint !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid request fingerprint' USING ERRCODE = '22023';
  END IF;
  IF p_currency IS NULL OR upper(p_currency) NOT IN ('EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA') THEN
    RAISE EXCEPTION 'Unsupported currency' USING ERRCODE = '22023';
  END IF;
  IF p_tax_mode IS NULL OR p_tax_rate IS NULL
     OR p_tax_mode NOT IN ('none', 'vat', 'withholding')
     OR p_tax_rate < 0 OR p_tax_rate > 100
     OR (p_tax_mode = 'none' AND p_tax_rate <> 0) THEN
    RAISE EXCEPTION 'Invalid tax configuration' USING ERRCODE = '22023';
  END IF;
  IF p_quote_date IS NULL OR p_validity_date IS NULL OR p_validity_date < p_quote_date THEN
    RAISE EXCEPTION 'Invalid quote dates' USING ERRCODE = '22023';
  END IF;
  IF (p_client_id IS NULL) = (p_client IS NULL) THEN
    RAISE EXCEPTION 'Provide exactly one of client id or inline client' USING ERRCODE = '22023';
  END IF;
  IF p_client IS NOT NULL AND (
    jsonb_typeof(p_client) <> 'object'
    OR length(trim(COALESCE(p_client ->> 'name', ''))) NOT BETWEEN 1 AND 200
    OR length(COALESCE(p_client ->> 'email', '')) NOT BETWEEN 3 AND 320
    OR COALESCE(p_client ->> 'email', '') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ) THEN
    RAISE EXCEPTION 'Invalid inline client' USING ERRCODE = '22023';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Quote must contain between 1 and 100 items' USING ERRCODE = '22023';
  END IF;
  IF p_subtotal IS NULL OR p_tax_amount IS NULL OR p_withholding_amount IS NULL
     OR p_total IS NULL OR p_amount_due IS NULL THEN
    RAISE EXCEPTION 'Quote amounts are required' USING ERRCODE = '22023';
  END IF;

  FOR line_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF jsonb_typeof(line_item) <> 'object'
       OR length(trim(COALESCE(line_item ->> 'description', ''))) NOT BETWEEN 1 AND 500
       OR COALESCE(line_item ->> 'quantity', '') !~ '^(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,4})?$'
       OR COALESCE(line_item ->> 'unitPrice', '') !~ '^(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,4})?$'
       OR COALESCE(line_item ->> 'total', '') !~ '^(?:0|[1-9][0-9]{0,13})(?:\.[0-9]{1,2})?$' THEN
      RAISE EXCEPTION 'Invalid quote item' USING ERRCODE = '22023';
    END IF;
    line_quantity := (line_item ->> 'quantity')::numeric;
    line_unit_price := (line_item ->> 'unitPrice')::numeric;
    line_total := (line_item ->> 'total')::numeric;
    IF line_quantity <= 0 OR line_total <> round(line_quantity * line_unit_price, 2) THEN
      RAISE EXCEPTION 'Invalid quote item amount' USING ERRCODE = '22023';
    END IF;
    computed_subtotal := computed_subtotal + line_total;
  END LOOP;

  computed_subtotal := round(computed_subtotal, 2);
  computed_adjustment := round(computed_subtotal * p_tax_rate / 100, 2);
  IF p_subtotal <> computed_subtotal
     OR p_tax_amount <> (CASE WHEN p_tax_mode = 'vat' THEN computed_adjustment ELSE 0 END)
     OR p_withholding_amount <> (CASE WHEN p_tax_mode = 'withholding' THEN computed_adjustment ELSE 0 END)
     OR p_total <> computed_subtotal + (CASE WHEN p_tax_mode = 'vat' THEN computed_adjustment ELSE 0 END)
     OR p_amount_due <> p_total - (CASE WHEN p_tax_mode = 'withholding' THEN computed_adjustment ELSE 0 END) THEN
    RAISE EXCEPTION 'Quote totals do not match quote items' USING ERRCODE = '22023';
  END IF;
  IF length(COALESCE(p_payment_method, '')) > 100 OR length(COALESCE(p_notes, '')) > 2000 THEN
    RAISE EXCEPTION 'Quote text field is too long' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(current_user_id::text || ':' || p_idempotency_key, 0));
  SELECT id, request_fingerprint INTO existing_id, existing_fingerprint
  FROM public.quotes
  WHERE user_id = current_user_id AND idempotency_key = p_idempotency_key;
  IF existing_id IS NOT NULL THEN
    IF existing_fingerprint IS DISTINCT FROM p_request_fingerprint THEN
      RAISE EXCEPTION 'Idempotency key reused with a different request' USING ERRCODE = '22023';
    END IF;
    RETURN existing_id;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(current_user_id::text || ':quote-usage:' || date_trunc('month', now())::text, 0)
  );
  SELECT CASE
    WHEN subscription.plan IN ('pro', 'business')
      AND subscription.status = 'active'
      AND (subscription.manual_expires_at IS NULL OR subscription.manual_expires_at > now())
      AND (subscription.current_period_end IS NULL OR subscription.current_period_end > now())
    THEN subscription.plan
    ELSE 'free'
  END
  INTO effective_plan
  FROM public.subscriptions AS subscription
  WHERE subscription.user_id = current_user_id;
  effective_plan := COALESCE(effective_plan, 'free');
  IF effective_plan = 'free' THEN
    SELECT count(*) INTO monthly_count
    FROM public.quotes
    WHERE user_id = current_user_id
      AND created_at >= date_trunc('month', now())
      AND created_at < date_trunc('month', now()) + interval '1 month';
    IF monthly_count >= 2 THEN
      RAISE EXCEPTION 'Monthly quote limit reached' USING ERRCODE = 'P0004';
    END IF;
  END IF;

  SELECT * INTO company_record
  FROM public.companies
  WHERE id = p_company_id AND user_id = current_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_client_id IS NOT NULL THEN
    SELECT * INTO client_record
    FROM public.clients
    WHERE id = p_client_id AND user_id = current_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Client not found' USING ERRCODE = 'P0002';
    END IF;
  ELSE
    INSERT INTO public.clients (
      user_id, name, email, address, phone, company_name, fiscal_region,
      siret, vat_number, nif, stat, notes
    ) VALUES (
      current_user_id, trim(p_client ->> 'name'), lower(p_client ->> 'email'),
      NULLIF(trim(p_client ->> 'address'), ''), NULLIF(trim(p_client ->> 'phone'), ''),
      NULLIF(trim(p_client ->> 'companyName'), ''),
      COALESCE(NULLIF(trim(p_client ->> 'fiscalRegion'), ''), 'NONE'),
      NULLIF(trim(p_client ->> 'siret'), ''), NULLIF(upper(trim(p_client ->> 'vatNumber')), ''),
      NULLIF(trim(p_client ->> 'nif'), ''), NULLIF(trim(p_client ->> 'stat'), ''),
      NULLIF(trim(p_client ->> 'notes'), '')
    ) RETURNING * INTO client_record;
  END IF;

  INSERT INTO public.quotes (
    user_id, company_id, client_id, draft_reference, quote_number, quote_date, validity_date,
    company_name, company_address, company_email, company_phone, logo_url,
    client_name, client_address, client_email, client_phone, items,
    currency, tax_mode, tax_rate, subtotal, tax_amount, withholding_amount, total, amount_due,
    payment_method, notes, status, calculation_version, idempotency_key, request_fingerprint
  ) VALUES (
    current_user_id, p_company_id, client_record.id,
    'DRQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    NULL, p_quote_date, p_validity_date,
    company_record.name, company_record.address, COALESCE(company_record.email, ''),
    company_record.phone, company_record.logo_url,
    client_record.name, client_record.address, client_record.email, client_record.phone, p_items,
    upper(p_currency), p_tax_mode, p_tax_rate, p_subtotal, p_tax_amount,
    p_withholding_amount, p_total, p_amount_due,
    p_payment_method, p_notes, 'draft', 'v2', p_idempotency_key, p_request_fingerprint
  ) RETURNING id INTO created_id;

  INSERT INTO public.document_audit_events (
    user_id, document_type, document_id, event_type, metadata
  ) VALUES (
    current_user_id, 'quote', created_id, 'created', jsonb_build_object('calculationVersion', 'v2')
  );
  RETURN created_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.issue_quote(p_quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  quote_record public.quotes%ROWTYPE;
  selected_prefix text;
  sequence_value bigint;
  official_number text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO quote_record
  FROM public.quotes
  WHERE id = p_quote_id AND user_id = current_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found' USING ERRCODE = 'P0002';
  END IF;
  IF quote_record.quote_number IS NOT NULL AND quote_record.issued_at IS NOT NULL THEN
    RETURN quote_record.id;
  END IF;
  IF quote_record.status <> 'draft' OR quote_record.calculation_version <> 'v2' THEN
    RAISE EXCEPTION 'Only v2 drafts can be issued' USING ERRCODE = 'P0001';
  END IF;

  SELECT upper(COALESCE(NULLIF(company.quote_prefix, ''), 'DEV')) INTO selected_prefix
  FROM public.companies AS company
  WHERE company.id = quote_record.company_id AND company.user_id = current_user_id;
  IF selected_prefix IS NULL THEN
    RAISE EXCEPTION 'Quote company not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.document_counters (
    company_id, user_id, document_type, period_year, prefix, last_value
  ) VALUES (
    quote_record.company_id, current_user_id, 'quote',
    extract(year FROM quote_record.quote_date)::integer, selected_prefix, 1
  )
  ON CONFLICT (company_id, document_type, period_year, prefix)
  DO UPDATE SET last_value = public.document_counters.last_value + 1, updated_at = now()
  RETURNING last_value INTO sequence_value;

  official_number := selected_prefix || '-' ||
    extract(year FROM quote_record.quote_date)::integer::text || '-' ||
    lpad(sequence_value::text, 6, '0');

  UPDATE public.quotes
  SET quote_number = official_number, issued_at = now(), status = 'issued'
  WHERE id = quote_record.id;

  INSERT INTO public.document_audit_events (
    user_id, document_type, document_id, event_type, metadata
  ) VALUES (
    current_user_id, 'quote', quote_record.id, 'issued', jsonb_build_object('number', official_number)
  );
  RETURN quote_record.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_quote(
  p_quote_id uuid,
  p_target_status text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  quote_record public.quotes%ROWTYPE;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_target_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Unsupported quote transition' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO quote_record
  FROM public.quotes
  WHERE id = p_quote_id AND user_id = current_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found' USING ERRCODE = 'P0002';
  END IF;
  IF quote_record.status = p_target_status THEN
    RETURN quote_record.id;
  END IF;
  IF quote_record.status NOT IN ('issued', 'sent') OR quote_record.calculation_version <> 'v2' THEN
    RAISE EXCEPTION 'Quote cannot perform this transition' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.quotes SET status = p_target_status WHERE id = quote_record.id;
  INSERT INTO public.document_audit_events (
    user_id, document_type, document_id, event_type
  ) VALUES (
    current_user_id, 'quote', quote_record.id, p_target_status
  );
  RETURN quote_record.id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_quote_draft(
  uuid, uuid, jsonb, jsonb, text, date, date, text, numeric, numeric, numeric, numeric, numeric,
  numeric, text, text, text, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_quote_draft(
  uuid, uuid, jsonb, jsonb, text, date, date, text, numeric, numeric, numeric, numeric, numeric,
  numeric, text, text, text, text
) TO authenticated;
REVOKE ALL ON FUNCTION public.issue_quote(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_quote(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.transition_quote(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_quote(uuid, text) TO authenticated;

COMMIT;
