-- Trigger-only functions must not be callable through PostgREST.
ALTER FUNCTION public.handle_new_user_subscription() SET search_path = public;
ALTER FUNCTION public.ensure_single_default_company() SET search_path = public;

REVOKE ALL ON FUNCTION public.handle_new_user_subscription() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_single_default_company() FROM PUBLIC, anon, authenticated;
