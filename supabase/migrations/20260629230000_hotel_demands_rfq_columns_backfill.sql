create table if not exists public.hotel_demands (
  id uuid primary key default gen_random_uuid()
);

alter table public.hotel_demands add column if not exists agent_id uuid null;
alter table public.hotel_demands add column if not exists agent_name text null;
alter table public.hotel_demands add column if not exists guest_name text null;
alter table public.hotel_demands add column if not exists city text null;
alter table public.hotel_demands add column if not exists hotel text null;
alter table public.hotel_demands add column if not exists check_in date null;
alter table public.hotel_demands add column if not exists check_out date null;
alter table public.hotel_demands add column if not exists nights int null;
alter table public.hotel_demands add column if not exists room_type text null;
alter table public.hotel_demands add column if not exists room_capacity int null;
alter table public.hotel_demands add column if not exists rooms int null;
alter table public.hotel_demands add column if not exists pax int null;
alter table public.hotel_demands add column if not exists meal_plan text null;
alter table public.hotel_demands add column if not exists budget numeric null;
alter table public.hotel_demands add column if not exists urgency text null;
alter table public.hotel_demands add column if not exists notes text null;
alter table public.hotel_demands add column if not exists status text default 'rfq_pending';
alter table public.hotel_demands add column if not exists quote_status text default 'awaiting_supplier';
alter table public.hotel_demands add column if not exists duplicate_score numeric null;
alter table public.hotel_demands add column if not exists expected_market_price numeric null;
alter table public.hotel_demands add column if not exists risk_level text null;
alter table public.hotel_demands add column if not exists crowd_pressure text null;
alter table public.hotel_demands add column if not exists hcn text null;
alter table public.hotel_demands add column if not exists hcn_status text default 'pending';
alter table public.hotel_demands add column if not exists hcn_reference text null;
alter table public.hotel_demands add column if not exists final_selling_rate numeric null;
alter table public.hotel_demands add column if not exists final_offer_sar numeric null;
alter table public.hotel_demands add column if not exists supplier_rate numeric null;
alter table public.hotel_demands add column if not exists profit_amount numeric null;
alter table public.hotel_demands add column if not exists public_note text null;
alter table public.hotel_demands add column if not exists internal_note text null;
alter table public.hotel_demands add column if not exists quoted_supplier text null;
alter table public.hotel_demands add column if not exists quoted_room_type text null;
alter table public.hotel_demands add column if not exists quoted_meal_plan text null;
alter table public.hotel_demands add column if not exists voucher_status text null;
alter table public.hotel_demands add column if not exists last_reminder_at timestamptz null;
alter table public.hotel_demands add column if not exists created_at timestamptz default now();
alter table public.hotel_demands add column if not exists updated_at timestamptz default now();

create index if not exists hotel_demands_status_idx on public.hotel_demands (status);
create index if not exists hotel_demands_quote_status_idx on public.hotel_demands (quote_status);
create index if not exists hotel_demands_agent_id_idx on public.hotel_demands (agent_id);
create index if not exists hotel_demands_check_in_idx on public.hotel_demands (check_in);
