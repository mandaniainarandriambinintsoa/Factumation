BEGIN;

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'issued', 'sent', 'paid', 'cancelled'));

ALTER TABLE public.quotes
  DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft', 'issued', 'sent', 'accepted', 'rejected', 'expired'));

COMMIT;
