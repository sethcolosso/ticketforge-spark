create table if not exists public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_code text not null unique,
  event_id text not null,
  event_slug text not null,
  event_title text not null,
  event_date date not null,
  event_venue text not null,
  event_location text not null,
  event_image text,
  ticket_items jsonb not null,
  ticket_count integer not null check (ticket_count > 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  service_fee numeric(10, 2) not null check (service_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ticket_orders_user_id_created_at_idx
  on public.ticket_orders (user_id, created_at desc);

create or replace function public.set_ticket_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ticket_orders_updated_at on public.ticket_orders;
create trigger trg_ticket_orders_updated_at
before update on public.ticket_orders
for each row
execute function public.set_ticket_orders_updated_at();

alter table public.ticket_orders enable row level security;

drop policy if exists "Users can view their own ticket orders" on public.ticket_orders;
create policy "Users can view their own ticket orders"
on public.ticket_orders
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own ticket orders" on public.ticket_orders;
create policy "Users can create their own ticket orders"
on public.ticket_orders
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own ticket orders" on public.ticket_orders;
create policy "Users can update their own ticket orders"
on public.ticket_orders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
