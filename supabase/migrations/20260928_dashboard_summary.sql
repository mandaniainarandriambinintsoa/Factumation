CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'invoices', (
      SELECT jsonb_build_object(
        'total', count(*),
        'draft', count(*) FILTER (WHERE status = 'draft'),
        'issued', count(*) FILTER (WHERE status = 'issued'),
        'sent', count(*) FILTER (WHERE status = 'sent'),
        'paid', count(*) FILTER (WHERE status = 'paid'),
        'cancelled', count(*) FILTER (WHERE status = 'cancelled')
      )
      FROM public.invoices
      WHERE user_id = auth.uid()
    ),
    'quotes', (
      SELECT jsonb_build_object(
        'total', count(*),
        'draft', count(*) FILTER (WHERE status = 'draft'),
        'issued', count(*) FILTER (WHERE status = 'issued'),
        'sent', count(*) FILTER (WHERE status = 'sent'),
        'accepted', count(*) FILTER (WHERE status = 'accepted'),
        'rejected', count(*) FILTER (WHERE status = 'rejected'),
        'expired', count(*) FILTER (WHERE status = 'expired')
      )
      FROM public.quotes
      WHERE user_id = auth.uid()
    ),
    'clients', (
      SELECT count(*)
      FROM public.clients
      WHERE user_id = auth.uid()
    ),
    'revenueByCurrency', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('currency', currency, 'amount', amount::text, 'count', document_count)
        ORDER BY currency
      )
      FROM (
        SELECT currency, sum(total) AS amount, count(*) AS document_count
        FROM public.invoices
        WHERE user_id = auth.uid() AND status = 'paid'
        GROUP BY currency
      ) AS revenue
    ), '[]'::jsonb),
    'pendingByCurrency', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('currency', currency, 'amount', amount::text, 'count', document_count)
        ORDER BY currency
      )
      FROM (
        SELECT
          currency,
          sum(COALESCE(amount_due, total)) AS amount,
          count(*) AS document_count
        FROM public.invoices
        WHERE user_id = auth.uid() AND status IN ('issued', 'sent')
        GROUP BY currency
      ) AS pending
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO authenticated;
