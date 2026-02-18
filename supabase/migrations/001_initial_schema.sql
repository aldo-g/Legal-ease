-- ============================================================================
-- LegalEase: Initial Schema Migration
-- ============================================================================
-- Run this in Supabase SQL Editor or via supabase db push
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------

create type public.case_status as enum (
  'created',
  'complaint_submitted',
  'awaiting_response',
  'escalated',
  'resolved',
  'closed'
);

create type public.document_type as enum (
  'complaint_letter',
  'escalation_letter',
  'regulator_submission',
  'airline_response',
  'other'
);

create type public.step_status as enum (
  'pending',
  'active',
  'completed',
  'skipped'
);

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- profiles: extends auth.users with app-specific data
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  email         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- cases: core case entity
create table public.cases (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  case_ref        text not null unique,
  status          public.case_status not null default 'created',
  complaint_text  text,
  form_data       jsonb not null default '{}'::jsonb,
  research        jsonb not null default '{}'::jsonb,
  case_data       jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- documents: generated letters and uploaded files
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  doc_type      public.document_type not null,
  title         text not null,
  content       text,
  storage_path  text,
  version       integer not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- action_steps: individually tracked enforcement steps
create table public.action_steps (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  step_order    integer not null,
  title         text not null,
  description   text,
  status        public.step_status not null default 'pending',
  due_at        timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (case_id, step_order)
);

-- status_logs: immutable append-only timeline
create table public.status_logs (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.documents enable row level security;
alter table public.action_steps enable row level security;
alter table public.status_logs enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- cases
create policy "Users can view own cases"
  on public.cases for select
  using (user_id = auth.uid());

create policy "Users can create own cases"
  on public.cases for insert
  with check (user_id = auth.uid());

create policy "Users can update own cases"
  on public.cases for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own cases"
  on public.cases for delete
  using (user_id = auth.uid());

-- documents
create policy "Users can view own documents"
  on public.documents for select
  using (user_id = auth.uid());

create policy "Users can create own documents"
  on public.documents for insert
  with check (user_id = auth.uid());

create policy "Users can update own documents"
  on public.documents for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own documents"
  on public.documents for delete
  using (user_id = auth.uid());

-- action_steps
create policy "Users can view own action steps"
  on public.action_steps for select
  using (user_id = auth.uid());

create policy "Users can create own action steps"
  on public.action_steps for insert
  with check (user_id = auth.uid());

create policy "Users can update own action steps"
  on public.action_steps for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own action steps"
  on public.action_steps for delete
  using (user_id = auth.uid());

-- status_logs (append-only: select + insert only)
create policy "Users can view own status logs"
  on public.status_logs for select
  using (user_id = auth.uid());

create policy "Users can create own status logs"
  on public.status_logs for insert
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. INDEXES
-- ----------------------------------------------------------------------------

create index idx_cases_user_id on public.cases(user_id);
create index idx_cases_case_ref on public.cases(case_ref);
create index idx_cases_user_status on public.cases(user_id, status);

create index idx_documents_case_id on public.documents(case_id);
create index idx_documents_user_id on public.documents(user_id);

create index idx_action_steps_case_order on public.action_steps(case_id, step_order);
create index idx_action_steps_user_id on public.action_steps(user_id);
create index idx_action_steps_due on public.action_steps(due_at)
  where status = 'pending';

create index idx_status_logs_case_created on public.status_logs(case_id, created_at desc);
create index idx_status_logs_user_id on public.status_logs(user_id);

-- ----------------------------------------------------------------------------
-- 5. TRIGGERS
-- ----------------------------------------------------------------------------

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_cases_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

create trigger set_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

create trigger set_action_steps_updated_at
  before update on public.action_steps
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. STORAGE BUCKET
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false);

create policy "Users can upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own documents"
  on storage.objects for select
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
