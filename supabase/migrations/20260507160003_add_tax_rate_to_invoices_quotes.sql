ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (tax_rate >= 0 AND tax_rate <= 100);

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (tax_rate >= 0 AND tax_rate <= 100);

COMMENT ON COLUMN public.invoices.tax_rate IS 'Tax/withholding rate in percent (0-100), subtracted from subtotal to get net amount';
COMMENT ON COLUMN public.quotes.tax_rate IS 'Tax/withholding rate in percent (0-100), subtracted from subtotal to get net amount';;
