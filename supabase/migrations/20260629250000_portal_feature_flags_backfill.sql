create table if not exists public.portal_feature_flags (
  id uuid primary key default gen_random_uuid()
);

alter table public.portal_feature_flags add column if not exists tenant_id uuid null;
alter table public.portal_feature_flags add column if not exists module_key text null;
alter table public.portal_feature_flags add column if not exists feature_key text null;
alter table public.portal_feature_flags add column if not exists is_enabled boolean default false;
alter table public.portal_feature_flags add column if not exists created_at timestamptz default now();
alter table public.portal_feature_flags add column if not exists updated_at timestamptz default now();

create unique index if not exists portal_feature_flags_tenant_feature_idx
  on public.portal_feature_flags (tenant_id, module_key, feature_key);

create index if not exists portal_feature_flags_tenant_id_idx
  on public.portal_feature_flags (tenant_id);

create index if not exists portal_feature_flags_module_key_idx
  on public.portal_feature_flags (module_key);

alter table public.saas_tenants add column if not exists allowed_features jsonb default '[]'::jsonb;
