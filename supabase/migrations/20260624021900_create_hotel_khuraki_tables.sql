create extension if not exists pgcrypto;

create table if not exists public.hotel_khuraki_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  hotel_id uuid null,
  supplier_id uuid null,
  title text not null,
  city text not null,
  meal_type text not null,
  start_date date not null,
  end_date date not null,
  rate_per_person numeric default 0,
  currency text default 'SAR',
  total_pax integer default 0,
  status text default 'active',
  notes text null,
  created_by uuid null,
  ai_quality_score integer default 0,
  ai_waste_risk integer default 0,
  ai_shortage_risk integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hotel_khuraki_daily_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  contract_id uuid null,
  run_date date not null,
  meal_type text not null,
  planned_pax integer default 0,
  actual_pax integer default 0,
  meals_served integer default 0,
  shortage_count integer default 0,
  waste_count integer default 0,
  quality_note text null,
  supplier_status text default 'pending',
  staff_id uuid null,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hotel_khuraki_voucher_stays (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  contract_id uuid null,
  booking_id uuid null,
  voucher_no text not null,
  customer_name text not null,
  customer_phone text null,
  whatsapp_phone text null,
  hotel_name text not null,
  city text default 'makkah',
  room_no text null,
  pax integer default 1,
  check_in_date date not null,
  check_out_date date not null,
  meal_plan text default 'full_board',
  special_notes text null,
  status text default 'expected',
  checkout_call_status text default 'pending',
  checkout_call_notes text null,
  last_called_at timestamptz null,
  check_in_time timestamptz null,
  check_out_time timestamptz null,
  ai_checkout_risk integer default 0,
  ai_khuraki_risk integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hotel_khuraki_staff (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  full_name text not null,
  phone text null,
  role text default 'checker',
  city text default 'makkah',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hotel_khuraki_incidents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  contract_id uuid null,
  incident_type text default 'other',
  severity text default 'medium',
  title text not null,
  description text null,
  ai_recommendation text null,
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hotel_khuraki_supplier_bills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  contract_id uuid null,
  supplier_name text not null,
  bill_no text null,
  bill_date date default current_date,
  from_date date null,
  to_date date null,
  claimed_pax integer default 0,
  verified_pax integer default 0,
  rate_per_person numeric default 0,
  difference_amount numeric generated always as ((claimed_pax - verified_pax) * rate_per_person) stored,
  status text default 'pending',
  ai_overbilling_risk integer default 0,
  notes text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hotel_khuraki_ai_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  contract_id uuid null,
  log_type text not null,
  score integer default 0,
  title text not null,
  detail text null,
  action_required boolean default false,
  created_at timestamptz default now()
);

create index if not exists hotel_khuraki_contracts_tenant_id_idx on public.hotel_khuraki_contracts (tenant_id);
create index if not exists hotel_khuraki_contracts_status_idx on public.hotel_khuraki_contracts (status);
create index if not exists hotel_khuraki_contracts_city_idx on public.hotel_khuraki_contracts (city);
create index if not exists hotel_khuraki_contracts_created_at_idx on public.hotel_khuraki_contracts (created_at);

create index if not exists hotel_khuraki_daily_runs_tenant_id_idx on public.hotel_khuraki_daily_runs (tenant_id);
create index if not exists hotel_khuraki_daily_runs_contract_id_idx on public.hotel_khuraki_daily_runs (contract_id);
create index if not exists hotel_khuraki_daily_runs_status_idx on public.hotel_khuraki_daily_runs (status);
create index if not exists hotel_khuraki_daily_runs_run_date_idx on public.hotel_khuraki_daily_runs (run_date);
create index if not exists hotel_khuraki_daily_runs_created_at_idx on public.hotel_khuraki_daily_runs (created_at);

create index if not exists hotel_khuraki_voucher_stays_tenant_id_idx on public.hotel_khuraki_voucher_stays (tenant_id);
create index if not exists hotel_khuraki_voucher_stays_contract_id_idx on public.hotel_khuraki_voucher_stays (contract_id);
create index if not exists hotel_khuraki_voucher_stays_status_idx on public.hotel_khuraki_voucher_stays (status);
create index if not exists hotel_khuraki_voucher_stays_city_idx on public.hotel_khuraki_voucher_stays (city);
create index if not exists hotel_khuraki_voucher_stays_check_out_date_idx on public.hotel_khuraki_voucher_stays (check_out_date);
create index if not exists hotel_khuraki_voucher_stays_created_at_idx on public.hotel_khuraki_voucher_stays (created_at);

create index if not exists hotel_khuraki_staff_tenant_id_idx on public.hotel_khuraki_staff (tenant_id);
create index if not exists hotel_khuraki_staff_city_idx on public.hotel_khuraki_staff (city);
create index if not exists hotel_khuraki_staff_created_at_idx on public.hotel_khuraki_staff (created_at);

create index if not exists hotel_khuraki_incidents_tenant_id_idx on public.hotel_khuraki_incidents (tenant_id);
create index if not exists hotel_khuraki_incidents_contract_id_idx on public.hotel_khuraki_incidents (contract_id);
create index if not exists hotel_khuraki_incidents_status_idx on public.hotel_khuraki_incidents (status);
create index if not exists hotel_khuraki_incidents_created_at_idx on public.hotel_khuraki_incidents (created_at);

create index if not exists hotel_khuraki_supplier_bills_tenant_id_idx on public.hotel_khuraki_supplier_bills (tenant_id);
create index if not exists hotel_khuraki_supplier_bills_contract_id_idx on public.hotel_khuraki_supplier_bills (contract_id);
create index if not exists hotel_khuraki_supplier_bills_status_idx on public.hotel_khuraki_supplier_bills (status);
create index if not exists hotel_khuraki_supplier_bills_created_at_idx on public.hotel_khuraki_supplier_bills (created_at);

create index if not exists hotel_khuraki_ai_logs_tenant_id_idx on public.hotel_khuraki_ai_logs (tenant_id);
create index if not exists hotel_khuraki_ai_logs_contract_id_idx on public.hotel_khuraki_ai_logs (contract_id);
create index if not exists hotel_khuraki_ai_logs_created_at_idx on public.hotel_khuraki_ai_logs (created_at);
