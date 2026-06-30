create extension if not exists pgcrypto;

create table if not exists public.saas_tenants (
  id uuid primary key default gen_random_uuid()
);

alter table public.saas_tenants add column if not exists tenant_name text null;
alter table public.saas_tenants add column if not exists slug text null;
alter table public.saas_tenants add column if not exists subdomain text null;
alter table public.saas_tenants add column if not exists custom_domain text null;
alter table public.saas_tenants add column if not exists logo_url text null;
alter table public.saas_tenants add column if not exists primary_color text default '#0f766e';
alter table public.saas_tenants add column if not exists secondary_color text default '#111827';
alter table public.saas_tenants add column if not exists contact_email text null;
alter table public.saas_tenants add column if not exists contact_phone text null;
alter table public.saas_tenants add column if not exists bio text null;
alter table public.saas_tenants add column if not exists plan_name text default 'starter';
alter table public.saas_tenants add column if not exists allowed_modules jsonb default '[]'::jsonb;
alter table public.saas_tenants add column if not exists status text default 'pending_approval';
alter table public.saas_tenants add column if not exists approval_status text default 'pending';
alter table public.saas_tenants add column if not exists domain_verified boolean default false;
alter table public.saas_tenants add column if not exists approved_by text null;
alter table public.saas_tenants add column if not exists approved_at timestamptz null;
alter table public.saas_tenants add column if not exists go_live_at timestamptz null;
alter table public.saas_tenants add column if not exists rejection_reason text null;
alter table public.saas_tenants add column if not exists ai_setup_score numeric null;
alter table public.saas_tenants add column if not exists ai_risk_score numeric null;
alter table public.saas_tenants add column if not exists ai_summary text null;
alter table public.saas_tenants add column if not exists created_at timestamptz default now();
alter table public.saas_tenants add column if not exists updated_at timestamptz default now();

create unique index if not exists saas_tenants_slug_idx on public.saas_tenants (slug);
create unique index if not exists saas_tenants_custom_domain_idx on public.saas_tenants (custom_domain);
create index if not exists saas_tenants_status_idx on public.saas_tenants (status);

create table if not exists public.portal_domains (
  id uuid primary key default gen_random_uuid()
);

alter table public.portal_domains add column if not exists tenant_id uuid null;
alter table public.portal_domains add column if not exists domain text null;
alter table public.portal_domains add column if not exists is_primary boolean default false;
alter table public.portal_domains add column if not exists is_verified boolean default false;
alter table public.portal_domains add column if not exists ssl_status text default 'pending';
alter table public.portal_domains add column if not exists created_at timestamptz default now();
alter table public.portal_domains add column if not exists updated_at timestamptz default now();

create unique index if not exists portal_domains_domain_idx on public.portal_domains (domain);
create index if not exists portal_domains_tenant_id_idx on public.portal_domains (tenant_id);

create table if not exists public.portal_module_flags (
  id uuid primary key default gen_random_uuid()
);

alter table public.portal_module_flags add column if not exists tenant_id uuid null;
alter table public.portal_module_flags add column if not exists module_key text null;
alter table public.portal_module_flags add column if not exists is_enabled boolean default false;
alter table public.portal_module_flags add column if not exists created_at timestamptz default now();
alter table public.portal_module_flags add column if not exists updated_at timestamptz default now();

create unique index if not exists portal_module_flags_tenant_module_idx
  on public.portal_module_flags (tenant_id, module_key);
create index if not exists portal_module_flags_tenant_id_idx on public.portal_module_flags (tenant_id);

create table if not exists public.portal_settings (
  id uuid primary key default gen_random_uuid()
);

alter table public.portal_settings add column if not exists tenant_id uuid null;
alter table public.portal_settings add column if not exists brand_name text null;
alter table public.portal_settings add column if not exists tagline text null;
alter table public.portal_settings add column if not exists logo_url text null;
alter table public.portal_settings add column if not exists created_at timestamptz default now();
alter table public.portal_settings add column if not exists updated_at timestamptz default now();

create unique index if not exists portal_settings_tenant_id_idx on public.portal_settings (tenant_id);
