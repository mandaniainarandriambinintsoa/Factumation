-- External application credentials. Raw keys are never stored.

CREATE TABLE IF NOT EXISTS public.api_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  allowed_company_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id)
);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.api_clients(id) ON DELETE CASCADE,
  prefix text NOT NULL UNIQUE CHECK (prefix ~ '^[A-Za-z0-9]{12}$'),
  secret_hash text NOT NULL UNIQUE CHECK (secret_hash ~ '^[a-f0-9]{64}$'),
  scopes text[] NOT NULL,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(scopes) > 0),
  CHECK (scopes <@ ARRAY['invoices:read', 'quotes:read', 'clients:read', 'companies:read']::text[])
);

CREATE INDEX IF NOT EXISTS api_clients_owner_idx ON public.api_clients(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS api_keys_client_idx ON public.api_keys(client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.api_key_rate_limits (
  key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  requests integer NOT NULL CHECK (requests > 0),
  PRIMARY KEY (key_id, window_start)
);
ALTER TABLE public.api_key_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.api_key_audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.api_clients(id) ON DELETE CASCADE,
  key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created', 'rotated', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_key_audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_key_audit_owner_select" ON public.api_key_audit_events
FOR SELECT TO authenticated USING (owner_id = auth.uid());

ALTER TABLE public.api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_clients_owner_all" ON public.api_clients
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "api_keys_owner_select" ON public.api_keys
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.api_clients c
    WHERE c.id = api_keys.client_id AND c.owner_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.create_api_credential(
  p_name text,
  p_allowed_company_ids uuid[],
  p_prefix text,
  p_secret_hash text,
  p_scopes text[],
  p_expires_at timestamptz
) RETURNS TABLE(client_id uuid, key_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner_id uuid := auth.uid(); v_client_id uuid; v_key_id uuid;
BEGIN
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN
    RAISE EXCEPTION 'Expiration must be in the future' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(coalesce(p_allowed_company_ids, '{}')) company_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.user_id = v_owner_id
    )
  ) THEN
    RAISE EXCEPTION 'A company is not owned by the caller' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.api_clients(owner_id, name, allowed_company_ids)
  VALUES (v_owner_id, p_name, coalesce(p_allowed_company_ids, '{}')) RETURNING id INTO v_client_id;
  INSERT INTO public.api_keys(client_id, prefix, secret_hash, scopes, expires_at)
  VALUES (v_client_id, p_prefix, p_secret_hash, p_scopes, p_expires_at) RETURNING id INTO v_key_id;
  INSERT INTO public.api_key_audit_events(owner_id, client_id, key_id, event_type)
  VALUES (v_owner_id, v_client_id, v_key_id, 'created');
  RETURN QUERY SELECT v_client_id, v_key_id;
END; $$;

CREATE OR REPLACE FUNCTION public.rotate_api_credential(
  p_client_id uuid,
  p_prefix text,
  p_secret_hash text,
  p_scopes text[],
  p_expires_at timestamptz
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner_id uuid := auth.uid(); v_key_id uuid;
BEGIN
  IF v_owner_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.api_clients WHERE id = p_client_id AND owner_id = v_owner_id
  ) THEN RAISE EXCEPTION 'API client not found' USING ERRCODE = 'P0002'; END IF;
  IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN
    RAISE EXCEPTION 'Expiration must be in the future' USING ERRCODE = '22023';
  END IF;
  IF (SELECT count(*) FROM public.api_keys WHERE client_id = p_client_id AND revoked_at IS NULL) >= 2 THEN
    RAISE EXCEPTION 'Revoke an old credential before rotating again' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.api_keys(client_id, prefix, secret_hash, scopes, expires_at)
  VALUES (p_client_id, p_prefix, p_secret_hash, p_scopes, p_expires_at) RETURNING id INTO v_key_id;
  INSERT INTO public.api_key_audit_events(owner_id, client_id, key_id, event_type)
  VALUES (v_owner_id, p_client_id, v_key_id, 'rotated');
  RETURN v_key_id;
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_api_credential(p_key_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner_id uuid := auth.uid(); v_key_id uuid;
BEGIN
  UPDATE public.api_keys k SET revoked_at = coalesce(k.revoked_at, now())
  FROM public.api_clients c
  WHERE k.id = p_key_id AND c.id = k.client_id AND c.owner_id = v_owner_id
  RETURNING k.id INTO v_key_id;
  IF v_key_id IS NULL THEN RAISE EXCEPTION 'API key not found' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO public.api_key_audit_events(owner_id, client_id, key_id, event_type)
  SELECT v_owner_id, k.client_id, k.id, 'revoked' FROM public.api_keys k WHERE k.id = v_key_id;
  RETURN v_key_id;
END; $$;

CREATE OR REPLACE FUNCTION public.authenticate_api_key(p_prefix text, p_secret_hash text)
RETURNS TABLE(
  key_id uuid,
  owner_id uuid,
  scopes text[],
  allowed_company_ids uuid[],
  rate_limited boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_key_id uuid; v_owner_id uuid; v_scopes text[]; v_company_ids uuid[];
  v_window timestamptz := date_trunc('minute', now()); v_requests integer;
BEGIN
  UPDATE public.api_keys k
  SET last_used_at = now()
  FROM public.api_clients c
  WHERE k.client_id = c.id
    AND k.prefix = p_prefix
    AND k.secret_hash = p_secret_hash
    AND k.revoked_at IS NULL
    AND (k.expires_at IS NULL OR k.expires_at > now())
  RETURNING k.id, c.owner_id, k.scopes, c.allowed_company_ids
  INTO v_key_id, v_owner_id, v_scopes, v_company_ids;
  IF v_key_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.api_key_rate_limits(key_id, window_start, requests)
  VALUES (v_key_id, v_window, 1)
  ON CONFLICT ON CONSTRAINT api_key_rate_limits_pkey DO UPDATE
  SET requests = api_key_rate_limits.requests + 1
  RETURNING requests INTO v_requests;
  DELETE FROM public.api_key_rate_limits
  WHERE api_key_rate_limits.key_id = v_key_id
    AND window_start < now() - interval '2 days';

  RETURN QUERY SELECT v_key_id, v_owner_id, v_scopes, v_company_ids, v_requests > 300;
END; $$;

CREATE OR REPLACE FUNCTION public.list_api_credentials()
RETURNS TABLE(
  client_id uuid,
  client_name text,
  allowed_company_ids uuid[],
  key_id uuid,
  prefix text,
  scopes text[],
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT c.id, c.name, c.allowed_company_ids, k.id, k.prefix, k.scopes,
         k.expires_at, k.revoked_at, k.last_used_at, k.created_at
  FROM public.api_clients c
  JOIN public.api_keys k ON k.client_id = c.id
  WHERE c.owner_id = auth.uid()
  ORDER BY c.created_at DESC, k.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.create_api_credential(text, uuid[], text, text, text[], timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rotate_api_credential(uuid, text, text, text[], timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_api_credential(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.authenticate_api_key(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_api_credentials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_api_credential(text, uuid[], text, text, text[], timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_api_credential(uuid, text, text, text[], timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_api_credential(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_api_key(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_api_credentials() TO authenticated;
