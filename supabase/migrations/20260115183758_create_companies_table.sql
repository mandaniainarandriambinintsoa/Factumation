-- Table des sociétés émettrices (pour facturer au nom de plusieurs entreprises)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  siret TEXT,
  vat_number TEXT,
  iban TEXT,
  bic TEXT,
  default_currency TEXT DEFAULT 'EUR',
  default_payment_method TEXT DEFAULT 'Virement Bancaire',
  invoice_prefix TEXT DEFAULT 'INV',
  quote_prefix TEXT DEFAULT 'DEV',
  is_default BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les recherches
CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_companies_is_default ON public.companies(user_id, is_default);

-- Trigger pour updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON public.companies FOR DELETE
  USING (auth.uid() = user_id);

-- Fonction pour s'assurer qu'une seule société est par défaut
CREATE OR REPLACE FUNCTION ensure_single_default_company()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.companies
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER ensure_single_default_company_trigger
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_company();;
