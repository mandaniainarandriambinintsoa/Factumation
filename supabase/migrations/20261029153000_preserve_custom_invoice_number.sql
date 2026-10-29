create or replace function public.issue_invoice(p_invoice_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  invoice_record public.invoices%rowtype;
  selected_prefix text;
  sequence_value bigint;
  official_number text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into invoice_record
  from public.invoices
  where id = p_invoice_id and user_id = current_user_id
  for update;
  if not found then
    raise exception 'Invoice not found' using errcode = 'P0002';
  end if;

  if invoice_record.invoice_number is not null and invoice_record.issued_at is not null then
    return invoice_record.id;
  end if;
  if invoice_record.status <> 'draft' or invoice_record.calculation_version <> 'v2' then
    raise exception 'Only v2 drafts can be issued' using errcode = 'P0001';
  end if;
  if invoice_record.company_id is null then
    raise exception 'Invoice company is required' using errcode = '23514';
  end if;

  official_number := nullif(btrim(invoice_record.invoice_number), '');
  if official_number is null then
    select upper(coalesce(nullif(company.invoice_prefix, ''), 'INV')) into selected_prefix
    from public.companies as company
    where company.id = invoice_record.company_id and company.user_id = current_user_id;

    insert into public.document_counters (
      company_id, user_id, document_type, period_year, prefix, last_value
    ) values (
      invoice_record.company_id,
      current_user_id,
      'invoice',
      extract(year from invoice_record.invoice_date)::integer,
      selected_prefix,
      1
    )
    on conflict (company_id, document_type, period_year, prefix)
    do update set last_value = public.document_counters.last_value + 1, updated_at = now()
    returning last_value into sequence_value;

    official_number := selected_prefix || '-' ||
      extract(year from invoice_record.invoice_date)::integer::text || '-' ||
      lpad(sequence_value::text, 6, '0');
  end if;

  update public.invoices
  set invoice_number = official_number, issued_at = now(), status = 'issued'
  where id = invoice_record.id;

  insert into public.document_audit_events (
    user_id, document_type, document_id, event_type, metadata
  ) values (
    current_user_id, 'invoice', invoice_record.id, 'issued',
    jsonb_build_object('number', official_number)
  );

  return invoice_record.id;
end;
$$;
