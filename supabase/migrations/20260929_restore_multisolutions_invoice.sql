DO $$
DECLARE
  restored_invoice_id uuid;
  invoice_owner_id constant uuid := 'cdd45cb6-cb30-4452-bc44-bc6d975f244a';
  invoice_company_id constant uuid := '9a2316af-a1e9-40b6-ba57-f716c7c0fe62';
  invoice_client_id constant uuid := 'a7a7d0cc-0fc0-49b3-9091-90e09aadb68a';
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.invoices
    WHERE user_id = invoice_owner_id
      AND invoice_number = 'INV-2026-01-multisolution'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = invoice_company_id AND user_id = invoice_owner_id
  ) OR NOT EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = invoice_client_id AND user_id = invoice_owner_id
  ) THEN
    RAISE EXCEPTION 'Cannot restore invoice: owner, company, or client is missing';
  END IF;

  INSERT INTO public.invoices (
    user_id,
    company_id,
    client_id,
    invoice_number,
    invoice_date,
    due_date,
    company_name,
    company_address,
    company_email,
    company_phone,
    logo_url,
    client_name,
    client_address,
    client_email,
    client_phone,
    items,
    subtotal,
    tax_mode,
    tax_rate,
    tax_amount,
    withholding_amount,
    total,
    amount_due,
    currency,
    payment_method,
    status,
    calculation_version,
    issued_at,
    notes,
    created_at,
    updated_at
  ) VALUES (
    invoice_owner_id,
    invoice_company_id,
    invoice_client_id,
    'INV-2026-01-multisolution',
    DATE '2026-08-26',
    NULL,
    'RANDRIAMBININTSOA Mandaniaina',
    'Analamanga Antananarivo',
    'mandaniaina.randriambinintsoa@gmail.com',
    '+261346518695',
    'https://cdn.prod.website-files.com/651293c4adf37662a6f40412/6512999c3031a6889a3ed45e_logo-p-500.webp',
    'SAS MULTISOLUTIONS',
    E'39 Rue Marcel Proust, La Convenance\n97438 Sainte-Marie\nLa Réunion, France',
    'contact@multisolutions.fr',
    '0693 31 04 66',
    '[{"id":"restored-multisolutions-1","description":"Service de migration de EBP vers interFast","quantity":"1","unitPrice":"500.00","total":"500.00"}]'::jsonb,
    500.00,
    'none',
    0,
    0,
    0,
    500.00,
    500.00,
    'EUR',
    NULL,
    'sent',
    'v2',
    TIMESTAMPTZ '2026-08-26 00:00:00+00',
    'Facture restaurée depuis le PDF historique fourni par le propriétaire.',
    TIMESTAMPTZ '2026-08-26 00:00:00+00',
    TIMESTAMPTZ '2026-08-26 00:00:00+00'
  )
  RETURNING id INTO restored_invoice_id;

  INSERT INTO public.document_audit_events (
    user_id,
    document_type,
    document_id,
    event_type,
    metadata,
    created_at
  ) VALUES (
    invoice_owner_id,
    'invoice',
    restored_invoice_id,
    'sent',
    jsonb_build_object('source', 'historical-pdf-restoration'),
    TIMESTAMPTZ '2026-08-26 00:00:00+00'
  );
END;
$$;
