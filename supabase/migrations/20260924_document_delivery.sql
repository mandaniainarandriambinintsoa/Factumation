-- Additive delivery transitions. Apply only after the 20260922 and 20260923 foundations.

CREATE OR REPLACE FUNCTION public.mark_invoice_sent(p_invoice_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := auth.uid(); current_status text;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  SELECT status INTO current_status FROM public.invoices WHERE id = p_invoice_id AND user_id = current_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found' USING ERRCODE = 'P0002'; END IF;
  IF current_status NOT IN ('issued', 'sent') THEN RAISE EXCEPTION 'Invoice must be issued before sending' USING ERRCODE = 'P0001'; END IF;
  IF current_status = 'issued' THEN
    UPDATE public.invoices SET status = 'sent', updated_at = now() WHERE id = p_invoice_id;
    INSERT INTO public.document_audit_events (user_id, document_type, document_id, event_type) VALUES (current_user_id, 'invoice', p_invoice_id, 'sent');
  END IF;
  RETURN p_invoice_id;
END; $$;

CREATE OR REPLACE FUNCTION public.mark_invoice_paid(p_invoice_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := auth.uid(); current_status text;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  SELECT status INTO current_status FROM public.invoices WHERE id = p_invoice_id AND user_id = current_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found' USING ERRCODE = 'P0002'; END IF;
  IF current_status NOT IN ('issued', 'sent', 'paid') THEN RAISE EXCEPTION 'Invoice cannot be marked paid' USING ERRCODE = 'P0001'; END IF;
  IF current_status <> 'paid' THEN
    UPDATE public.invoices SET status = 'paid', updated_at = now() WHERE id = p_invoice_id;
    INSERT INTO public.document_audit_events (user_id, document_type, document_id, event_type) VALUES (current_user_id, 'invoice', p_invoice_id, 'paid');
  END IF;
  RETURN p_invoice_id;
END; $$;

CREATE OR REPLACE FUNCTION public.mark_quote_sent(p_quote_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := auth.uid(); current_status text;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  SELECT status INTO current_status FROM public.quotes WHERE id = p_quote_id AND user_id = current_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found' USING ERRCODE = 'P0002'; END IF;
  IF current_status NOT IN ('issued', 'sent') THEN RAISE EXCEPTION 'Quote must be issued before sending' USING ERRCODE = 'P0001'; END IF;
  IF current_status = 'issued' THEN
    UPDATE public.quotes SET status = 'sent', updated_at = now() WHERE id = p_quote_id;
    INSERT INTO public.document_audit_events (user_id, document_type, document_id, event_type) VALUES (current_user_id, 'quote', p_quote_id, 'sent');
  END IF;
  RETURN p_quote_id;
END; $$;

REVOKE ALL ON FUNCTION public.mark_invoice_sent(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_invoice_paid(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_quote_sent(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_invoice_sent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_invoice_paid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_quote_sent(uuid) TO authenticated;
