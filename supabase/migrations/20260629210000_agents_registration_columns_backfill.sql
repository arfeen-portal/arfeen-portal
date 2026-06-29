create extension if not exists pgcrypto;

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid()
);

alter table public.agents add column if not exists user_id uuid null;
alter table public.agents add column if not exists company_name text null;
alter table public.agents add column if not exists name text null;
alter table public.agents add column if not exists country text null;
alter table public.agents add column if not exists city text null;
alter table public.agents add column if not exists admin_name text null;
alter table public.agents add column if not exists phone text null;
alter table public.agents add column if not exists email text null;
alter table public.agents add column if not exists website text null;
alter table public.agents add column if not exists address text null;
alter table public.agents add column if not exists currency text default 'SAR';
alter table public.agents add column if not exists billing_currency text null;
alter table public.agents add column if not exists volume numeric null;
alter table public.agents add column if not exists services jsonb default '{}'::jsonb;
alter table public.agents add column if not exists status text default 'pending';
alter table public.agents add column if not exists agent_code text null;
alter table public.agents add column if not exists commission_pct numeric null;
alter table public.agents add column if not exists credit_limit numeric null;
alter table public.agents add column if not exists is_active boolean default true;
alter table public.agents add column if not exists is_credit_blocked boolean default false;
alter table public.agents add column if not exists login_enabled boolean default false;
alter table public.agents add column if not exists password_set boolean default false;
alter table public.agents add column if not exists portal_access jsonb null;
alter table public.agents add column if not exists last_login_at timestamptz null;
alter table public.agents add column if not exists created_at timestamptz default now();
alter table public.agents add column if not exists updated_at timestamptz default now();

create index if not exists agents_status_idx on public.agents (status);
create index if not exists agents_email_idx on public.agents (email);
create index if not exists agents_user_id_idx on public.agents (user_id);
create index if not exists agents_created_at_idx on public.agents (created_at);
