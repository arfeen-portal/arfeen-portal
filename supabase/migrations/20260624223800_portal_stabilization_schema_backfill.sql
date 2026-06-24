create extension if not exists pgcrypto;

create table if not exists public.accounting_operations (
  id uuid primary key default gen_random_uuid()
);

alter table public.accounting_operations add column if not exists tenant_id uuid null;
alter table public.accounting_operations add column if not exists op_no text null;
alter table public.accounting_operations add column if not exists op_type text default 'roznamcha_posting';
alter table public.accounting_operations add column if not exists title text null;
alter table public.accounting_operations add column if not exists reference_no text null;
alter table public.accounting_operations add column if not exists consultant_name text null;
alter table public.accounting_operations add column if not exists supplier_name text null;
alter table public.accounting_operations add column if not exists amount numeric default 0;
alter table public.accounting_operations add column if not exists currency text default 'PKR';
alter table public.accounting_operations add column if not exists debit_account text null;
alter table public.accounting_operations add column if not exists credit_account text null;
alter table public.accounting_operations add column if not exists priority text default 'normal';
alter table public.accounting_operations add column if not exists issue_reason text null;
alter table public.accounting_operations add column if not exists action_note text null;
alter table public.accounting_operations add column if not exists status text default 'pending';
alter table public.accounting_operations add column if not exists created_by uuid null;
alter table public.accounting_operations add column if not exists approved_by uuid null;
alter table public.accounting_operations add column if not exists approved_at timestamptz null;
alter table public.accounting_operations add column if not exists posted_by uuid null;
alter table public.accounting_operations add column if not exists posted_at timestamptz null;
alter table public.accounting_operations add column if not exists locked_by uuid null;
alter table public.accounting_operations add column if not exists locked_at timestamptz null;
alter table public.accounting_operations add column if not exists created_at timestamptz default now();
alter table public.accounting_operations add column if not exists updated_at timestamptz default now();

create index if not exists accounting_operations_tenant_id_idx on public.accounting_operations (tenant_id);
create index if not exists accounting_operations_op_type_idx on public.accounting_operations (op_type);
create index if not exists accounting_operations_status_idx on public.accounting_operations (status);
create index if not exists accounting_operations_priority_idx on public.accounting_operations (priority);
create index if not exists accounting_operations_created_at_idx on public.accounting_operations (created_at);

create table if not exists public.system_activity_logs (
  id uuid primary key default gen_random_uuid()
);

alter table public.system_activity_logs add column if not exists tenant_id uuid null;
alter table public.system_activity_logs add column if not exists log_type text null;
alter table public.system_activity_logs add column if not exists module text null;
alter table public.system_activity_logs add column if not exists module_name text null;
alter table public.system_activity_logs add column if not exists action text null;
alter table public.system_activity_logs add column if not exists title text null;
alter table public.system_activity_logs add column if not exists detail text null;
alter table public.system_activity_logs add column if not exists actor text null;
alter table public.system_activity_logs add column if not exists reference_no text null;
alter table public.system_activity_logs add column if not exists old_status text null;
alter table public.system_activity_logs add column if not exists new_status text null;
alter table public.system_activity_logs add column if not exists note text null;
alter table public.system_activity_logs add column if not exists created_at timestamptz default now();

create index if not exists system_activity_logs_tenant_id_idx on public.system_activity_logs (tenant_id);
create index if not exists system_activity_logs_log_type_idx on public.system_activity_logs (log_type);
create index if not exists system_activity_logs_module_idx on public.system_activity_logs (module);
create index if not exists system_activity_logs_created_at_idx on public.system_activity_logs (created_at);

create table if not exists public.system_reliability_center (
  id uuid primary key default gen_random_uuid()
);

alter table public.system_reliability_center add column if not exists tenant_id uuid null;
alter table public.system_reliability_center add column if not exists title text null;
alter table public.system_reliability_center add column if not exists job_type text default 'background_job';
alter table public.system_reliability_center add column if not exists status text default 'pending';
alter table public.system_reliability_center add column if not exists payload jsonb default '{}'::jsonb;
alter table public.system_reliability_center add column if not exists max_retries integer default 3;
alter table public.system_reliability_center add column if not exists retry_count integer default 0;
alter table public.system_reliability_center add column if not exists created_at timestamptz default now();
alter table public.system_reliability_center add column if not exists updated_at timestamptz default now();

create index if not exists system_reliability_center_tenant_id_idx on public.system_reliability_center (tenant_id);
create index if not exists system_reliability_center_job_type_idx on public.system_reliability_center (job_type);
create index if not exists system_reliability_center_status_idx on public.system_reliability_center (status);
create index if not exists system_reliability_center_created_at_idx on public.system_reliability_center (created_at);

create table if not exists public.acc_accounts (
  id uuid primary key default gen_random_uuid()
);

alter table public.acc_accounts add column if not exists code text null;
alter table public.acc_accounts add column if not exists name text null;
alter table public.acc_accounts add column if not exists group_id uuid null;
alter table public.acc_accounts add column if not exists currency_code text default 'PKR';
alter table public.acc_accounts add column if not exists is_active boolean default true;
alter table public.acc_accounts add column if not exists type text null;
alter table public.acc_accounts add column if not exists account_type text null;
alter table public.acc_accounts add column if not exists created_at timestamptz default now();
alter table public.acc_accounts add column if not exists updated_at timestamptz default now();

create index if not exists acc_accounts_code_idx on public.acc_accounts (code);
create index if not exists acc_accounts_group_id_idx on public.acc_accounts (group_id);
create index if not exists acc_accounts_is_active_idx on public.acc_accounts (is_active);
create index if not exists acc_accounts_created_at_idx on public.acc_accounts (created_at);

create table if not exists public.acc_journal_entries (
  id uuid primary key default gen_random_uuid()
);

alter table public.acc_journal_entries add column if not exists tenant_id uuid null;
alter table public.acc_journal_entries add column if not exists entry_no text null;
alter table public.acc_journal_entries add column if not exists entry_date date default current_date;
alter table public.acc_journal_entries add column if not exists posting_date date null;
alter table public.acc_journal_entries add column if not exists description text null;
alter table public.acc_journal_entries add column if not exists reference text null;
alter table public.acc_journal_entries add column if not exists reference_no text null;
alter table public.acc_journal_entries add column if not exists source_module text null;
alter table public.acc_journal_entries add column if not exists status text default 'posted';
alter table public.acc_journal_entries add column if not exists created_at timestamptz default now();
alter table public.acc_journal_entries add column if not exists updated_at timestamptz default now();

create index if not exists acc_journal_entries_tenant_id_idx on public.acc_journal_entries (tenant_id);
create index if not exists acc_journal_entries_entry_date_idx on public.acc_journal_entries (entry_date);
create index if not exists acc_journal_entries_source_module_idx on public.acc_journal_entries (source_module);
create index if not exists acc_journal_entries_status_idx on public.acc_journal_entries (status);
create index if not exists acc_journal_entries_created_at_idx on public.acc_journal_entries (created_at);

create table if not exists public.acc_journal_entry_lines (
  id uuid primary key default gen_random_uuid()
);

alter table public.acc_journal_entry_lines add column if not exists journal_entry_id uuid null;
alter table public.acc_journal_entry_lines add column if not exists line_no integer default 1;
alter table public.acc_journal_entry_lines add column if not exists account_id uuid null;
alter table public.acc_journal_entry_lines add column if not exists description text null;
alter table public.acc_journal_entry_lines add column if not exists line_description text null;
alter table public.acc_journal_entry_lines add column if not exists debit numeric default 0;
alter table public.acc_journal_entry_lines add column if not exists credit numeric default 0;
alter table public.acc_journal_entry_lines add column if not exists currency_code text default 'PKR';
alter table public.acc_journal_entry_lines add column if not exists fx_rate numeric default 1;
alter table public.acc_journal_entry_lines add column if not exists party_id uuid null;
alter table public.acc_journal_entry_lines add column if not exists party_type text null;
alter table public.acc_journal_entry_lines add column if not exists created_at timestamptz default now();

create index if not exists acc_journal_entry_lines_journal_entry_id_idx on public.acc_journal_entry_lines (journal_entry_id);
create index if not exists acc_journal_entry_lines_account_id_idx on public.acc_journal_entry_lines (account_id);
create index if not exists acc_journal_entry_lines_created_at_idx on public.acc_journal_entry_lines (created_at);

alter table public.hotel_khuraki_contracts add column if not exists tenant_id uuid;
alter table public.hotel_khuraki_contracts add column if not exists hotel_id uuid null;
alter table public.hotel_khuraki_contracts add column if not exists supplier_id uuid null;
alter table public.hotel_khuraki_contracts add column if not exists title text;
alter table public.hotel_khuraki_contracts add column if not exists city text;
alter table public.hotel_khuraki_contracts add column if not exists meal_type text;
alter table public.hotel_khuraki_contracts add column if not exists start_date date;
alter table public.hotel_khuraki_contracts add column if not exists end_date date;
alter table public.hotel_khuraki_contracts add column if not exists rate_per_person numeric default 0;
alter table public.hotel_khuraki_contracts add column if not exists currency text default 'SAR';
alter table public.hotel_khuraki_contracts add column if not exists total_pax integer default 0;
alter table public.hotel_khuraki_contracts add column if not exists status text default 'active';
alter table public.hotel_khuraki_contracts add column if not exists notes text null;
alter table public.hotel_khuraki_contracts add column if not exists created_by uuid null;
alter table public.hotel_khuraki_contracts add column if not exists ai_quality_score integer default 0;
alter table public.hotel_khuraki_contracts add column if not exists ai_waste_risk integer default 0;
alter table public.hotel_khuraki_contracts add column if not exists ai_shortage_risk integer default 0;
alter table public.hotel_khuraki_contracts add column if not exists created_at timestamptz default now();
alter table public.hotel_khuraki_contracts add column if not exists updated_at timestamptz default now();

alter table public.hotel_khuraki_daily_runs add column if not exists tenant_id uuid;
alter table public.hotel_khuraki_daily_runs add column if not exists contract_id uuid null;
alter table public.hotel_khuraki_daily_runs add column if not exists run_date date;
alter table public.hotel_khuraki_daily_runs add column if not exists meal_type text;
alter table public.hotel_khuraki_daily_runs add column if not exists planned_pax integer default 0;
alter table public.hotel_khuraki_daily_runs add column if not exists actual_pax integer default 0;
alter table public.hotel_khuraki_daily_runs add column if not exists meals_served integer default 0;
alter table public.hotel_khuraki_daily_runs add column if not exists shortage_count integer default 0;
alter table public.hotel_khuraki_daily_runs add column if not exists waste_count integer default 0;
alter table public.hotel_khuraki_daily_runs add column if not exists quality_note text null;
alter table public.hotel_khuraki_daily_runs add column if not exists supplier_status text default 'pending';
alter table public.hotel_khuraki_daily_runs add column if not exists staff_id uuid null;
alter table public.hotel_khuraki_daily_runs add column if not exists status text default 'pending';
alter table public.hotel_khuraki_daily_runs add column if not exists created_at timestamptz default now();
alter table public.hotel_khuraki_daily_runs add column if not exists updated_at timestamptz default now();

alter table public.hotel_khuraki_voucher_stays add column if not exists tenant_id uuid;
alter table public.hotel_khuraki_voucher_stays add column if not exists contract_id uuid null;
alter table public.hotel_khuraki_voucher_stays add column if not exists booking_id uuid null;
alter table public.hotel_khuraki_voucher_stays add column if not exists voucher_no text;
alter table public.hotel_khuraki_voucher_stays add column if not exists customer_name text;
alter table public.hotel_khuraki_voucher_stays add column if not exists customer_phone text null;
alter table public.hotel_khuraki_voucher_stays add column if not exists whatsapp_phone text null;
alter table public.hotel_khuraki_voucher_stays add column if not exists hotel_name text;
alter table public.hotel_khuraki_voucher_stays add column if not exists city text default 'makkah';
alter table public.hotel_khuraki_voucher_stays add column if not exists room_no text null;
alter table public.hotel_khuraki_voucher_stays add column if not exists pax integer default 1;
alter table public.hotel_khuraki_voucher_stays add column if not exists check_in_date date;
alter table public.hotel_khuraki_voucher_stays add column if not exists check_out_date date;
alter table public.hotel_khuraki_voucher_stays add column if not exists meal_plan text default 'full_board';
alter table public.hotel_khuraki_voucher_stays add column if not exists special_notes text null;
alter table public.hotel_khuraki_voucher_stays add column if not exists status text default 'expected';
alter table public.hotel_khuraki_voucher_stays add column if not exists checkout_call_status text default 'pending';
alter table public.hotel_khuraki_voucher_stays add column if not exists checkout_call_notes text null;
alter table public.hotel_khuraki_voucher_stays add column if not exists last_called_at timestamptz null;
alter table public.hotel_khuraki_voucher_stays add column if not exists check_in_time timestamptz null;
alter table public.hotel_khuraki_voucher_stays add column if not exists check_out_time timestamptz null;
alter table public.hotel_khuraki_voucher_stays add column if not exists ai_checkout_risk integer default 0;
alter table public.hotel_khuraki_voucher_stays add column if not exists ai_khuraki_risk integer default 0;
alter table public.hotel_khuraki_voucher_stays add column if not exists created_at timestamptz default now();
alter table public.hotel_khuraki_voucher_stays add column if not exists updated_at timestamptz default now();

alter table public.hotel_khuraki_staff add column if not exists tenant_id uuid;
alter table public.hotel_khuraki_staff add column if not exists full_name text;
alter table public.hotel_khuraki_staff add column if not exists phone text null;
alter table public.hotel_khuraki_staff add column if not exists role text default 'checker';
alter table public.hotel_khuraki_staff add column if not exists city text default 'makkah';
alter table public.hotel_khuraki_staff add column if not exists is_active boolean default true;
alter table public.hotel_khuraki_staff add column if not exists created_at timestamptz default now();
alter table public.hotel_khuraki_staff add column if not exists updated_at timestamptz default now();

alter table public.hotel_khuraki_incidents add column if not exists tenant_id uuid;
alter table public.hotel_khuraki_incidents add column if not exists contract_id uuid null;
alter table public.hotel_khuraki_incidents add column if not exists incident_type text default 'other';
alter table public.hotel_khuraki_incidents add column if not exists severity text default 'medium';
alter table public.hotel_khuraki_incidents add column if not exists title text;
alter table public.hotel_khuraki_incidents add column if not exists description text null;
alter table public.hotel_khuraki_incidents add column if not exists ai_recommendation text null;
alter table public.hotel_khuraki_incidents add column if not exists status text default 'open';
alter table public.hotel_khuraki_incidents add column if not exists created_at timestamptz default now();
alter table public.hotel_khuraki_incidents add column if not exists updated_at timestamptz default now();

alter table public.hotel_khuraki_supplier_bills add column if not exists tenant_id uuid;
alter table public.hotel_khuraki_supplier_bills add column if not exists contract_id uuid null;
alter table public.hotel_khuraki_supplier_bills add column if not exists supplier_name text;
alter table public.hotel_khuraki_supplier_bills add column if not exists bill_no text null;
alter table public.hotel_khuraki_supplier_bills add column if not exists bill_date date default current_date;
alter table public.hotel_khuraki_supplier_bills add column if not exists from_date date null;
alter table public.hotel_khuraki_supplier_bills add column if not exists to_date date null;
alter table public.hotel_khuraki_supplier_bills add column if not exists claimed_pax integer default 0;
alter table public.hotel_khuraki_supplier_bills add column if not exists verified_pax integer default 0;
alter table public.hotel_khuraki_supplier_bills add column if not exists rate_per_person numeric default 0;
alter table public.hotel_khuraki_supplier_bills add column if not exists difference_amount numeric generated always as ((claimed_pax - verified_pax) * rate_per_person) stored;
alter table public.hotel_khuraki_supplier_bills add column if not exists status text default 'pending';
alter table public.hotel_khuraki_supplier_bills add column if not exists ai_overbilling_risk integer default 0;
alter table public.hotel_khuraki_supplier_bills add column if not exists notes text null;
alter table public.hotel_khuraki_supplier_bills add column if not exists created_at timestamptz default now();
alter table public.hotel_khuraki_supplier_bills add column if not exists updated_at timestamptz default now();

alter table public.hotel_khuraki_ai_logs add column if not exists tenant_id uuid;
alter table public.hotel_khuraki_ai_logs add column if not exists contract_id uuid null;
alter table public.hotel_khuraki_ai_logs add column if not exists log_type text;
alter table public.hotel_khuraki_ai_logs add column if not exists score integer default 0;
alter table public.hotel_khuraki_ai_logs add column if not exists title text;
alter table public.hotel_khuraki_ai_logs add column if not exists detail text null;
alter table public.hotel_khuraki_ai_logs add column if not exists action_required boolean default false;
alter table public.hotel_khuraki_ai_logs add column if not exists created_at timestamptz default now();
