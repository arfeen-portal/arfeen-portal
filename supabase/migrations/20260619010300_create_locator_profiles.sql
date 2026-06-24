create table if not exists public.locator_profiles (
  id text primary key,
  tenant_id uuid not null,
  label text null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists locator_profiles_tenant_id_idx
  on public.locator_profiles (tenant_id);

create index if not exists locator_profiles_is_active_idx
  on public.locator_profiles (is_active);
