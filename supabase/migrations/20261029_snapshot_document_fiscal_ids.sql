alter table public.invoices
  add column if not exists company_nif text,
  add column if not exists company_stat text,
  add column if not exists client_nif text,
  add column if not exists client_stat text;

alter table public.quotes
  add column if not exists company_nif text,
  add column if not exists company_stat text,
  add column if not exists client_nif text,
  add column if not exists client_stat text;

update public.invoices as document
set company_nif = company.nif,
    company_stat = company.stat
from public.companies as company
where document.company_id = company.id
  and document.user_id = company.user_id
  and (document.company_nif is null or document.company_stat is null);

update public.invoices as document
set client_nif = client.nif,
    client_stat = client.stat
from public.clients as client
where document.client_id = client.id
  and document.user_id = client.user_id
  and (document.client_nif is null or document.client_stat is null);

update public.quotes as document
set company_nif = company.nif,
    company_stat = company.stat
from public.companies as company
where document.company_id = company.id
  and document.user_id = company.user_id
  and (document.company_nif is null or document.company_stat is null);

update public.quotes as document
set client_nif = client.nif,
    client_stat = client.stat
from public.clients as client
where document.client_id = client.id
  and document.user_id = client.user_id
  and (document.client_nif is null or document.client_stat is null);

create or replace function public.snapshot_document_fiscal_ids()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select company.nif, company.stat
  into new.company_nif, new.company_stat
  from public.companies as company
  where company.id = new.company_id
    and company.user_id = new.user_id;

  select client.nif, client.stat
  into new.client_nif, new.client_stat
  from public.clients as client
  where client.id = new.client_id
    and client.user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists snapshot_invoice_fiscal_ids on public.invoices;
create trigger snapshot_invoice_fiscal_ids
before insert on public.invoices
for each row execute function public.snapshot_document_fiscal_ids();

drop trigger if exists snapshot_quote_fiscal_ids on public.quotes;
create trigger snapshot_quote_fiscal_ids
before insert on public.quotes
for each row execute function public.snapshot_document_fiscal_ids();
