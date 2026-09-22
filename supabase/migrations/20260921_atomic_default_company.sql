-- Prepared for staging validation. Do not apply to production before the schema snapshot runbook.

BEGIN;

-- Deterministically keep the oldest default if historical data contains duplicates.
WITH ranked_defaults AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS position
  FROM public.companies
  WHERE is_default IS TRUE
)
UPDATE public.companies AS company
SET is_default = FALSE
FROM ranked_defaults
WHERE company.id = ranked_defaults.id
  AND ranked_defaults.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS companies_one_default_per_user_idx
  ON public.companies (user_id)
  WHERE is_default IS TRUE;

CREATE OR REPLACE FUNCTION public.set_default_company(p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  updated_company_id uuid;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- Serialize competing changes for one owner without blocking other tenants.
  PERFORM pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  IF NOT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = p_company_id
      AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Company not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.companies
  SET is_default = FALSE
  WHERE user_id = current_user_id
    AND is_default IS TRUE
    AND id <> p_company_id;

  UPDATE public.companies
  SET is_default = TRUE
  WHERE id = p_company_id
    AND user_id = current_user_id
  RETURNING id INTO updated_company_id;

  RETURN updated_company_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_default_company(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_default_company(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_default_company(uuid) TO authenticated;

COMMIT;
