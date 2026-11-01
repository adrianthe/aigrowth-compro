-- Funnel hub: course sales pages + freebies on aigrowth.id, checkout on Mayar.
-- Leads and payments are written only by the Vercel functions (service role);
-- admins read them from the dashboard.

-- 1. Sales page data on courses, plus a new 'freebie' content type
alter table public.content_items drop constraint if exists content_items_type_check;
alter table public.content_items
  add constraint content_items_type_check check (type in ('video', 'event', 'course', 'tool', 'freebie'));

alter table public.content_items
  add column if not exists slug text,
  add column if not exists price integer check (price is null or price >= 0),
  add column if not exists compare_price integer check (compare_price is null or compare_price >= 0),
  add column if not exists checkout_url text,
  add column if not exists sales jsonb not null default '{}'::jsonb;

alter table public.content_items drop constraint if exists content_items_slug_format;
alter table public.content_items
  add constraint content_items_slug_format check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

create unique index if not exists idx_content_items_slug on public.content_items(slug) where slug is not null;

-- 2. Freebie download links stay private until someone fills the form
create table if not exists public.offer_deliveries (
  content_id text primary key references public.content_items(id) on delete cascade,
  delivery_url text not null check (char_length(delivery_url) between 1 and 1500),
  updated_at timestamptz not null default now()
);

drop trigger if exists offer_deliveries_set_updated_at on public.offer_deliveries;
create trigger offer_deliveries_set_updated_at
before update on public.offer_deliveries
for each row execute function public.set_updated_at();

-- 3. Everyone who fills a checkout or freebie form
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  content_id text references public.content_items(id) on delete set null,
  kind text not null check (kind in ('checkout', 'freebie')),
  name text not null check (char_length(name) between 1 and 120),
  email text check (email is null or (char_length(email) <= 200 and email = lower(email))),
  whatsapp text not null check (whatsapp ~ '^62[0-9]{7,14}$'),
  status text not null default 'new' check (status in ('new', 'paid')),
  utm jsonb not null default '{}'::jsonb,
  client jsonb not null default '{}'::jsonb,
  landing_path text check (landing_path is null or char_length(landing_path) <= 500),
  referrer text check (referrer is null or char_length(referrer) <= 1500),
  amount integer,
  mayar_transaction_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_content on public.leads(content_id, created_at desc);

-- 4. Verified Mayar payments (one row per transaction, so webhook retries are harmless)
create table if not exists public.mayar_payments (
  transaction_id text primary key,
  content_id text references public.content_items(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  email text,
  name text,
  mobile text,
  amount integer,
  payment_link text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mayar_payments_created_at on public.mayar_payments(created_at desc);

alter table public.offer_deliveries enable row level security;
alter table public.leads enable row level security;
alter table public.mayar_payments enable row level security;

grant select, insert, update, delete on public.offer_deliveries to authenticated;
grant select, update, delete on public.leads to authenticated;
grant select on public.mayar_payments to authenticated;

drop policy if exists "Admins manage deliveries" on public.offer_deliveries;
create policy "Admins manage deliveries"
on public.offer_deliveries for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins read leads" on public.leads;
create policy "Admins read leads"
on public.leads for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins update leads" on public.leads;
create policy "Admins update leads"
on public.leads for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins delete leads" on public.leads;
create policy "Admins delete leads"
on public.leads for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins read payments" on public.mayar_payments;
create policy "Admins read payments"
on public.mayar_payments for select
to authenticated
using (public.is_admin());
