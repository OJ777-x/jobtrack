-- JobTrack database schema
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
-- Safe to re-run: it drops and recreates everything, so only run it on a fresh/demo project.

-- ============================================================================
-- CLEAN SLATE (demo project only — do not run this against real data)
-- ============================================================================
drop table if exists ai_action_log cascade;
drop table if exists customer_updates cascade;
drop table if exists parts_awaited cascade;
drop table if exists job_photos cascade;
drop table if exists job_notes cascade;
drop table if exists job_tasks cascade;
drop table if exists job_stage_history cascade;
drop table if exists jobs cascade;
drop table if exists quotes cascade;
drop table if exists enquiries cascade;
drop table if exists contacts cascade;
drop table if exists sites cascade;
drop table if exists customers cascade;
drop table if exists profiles cascade;
drop table if exists organisations cascade;
drop table if exists industry_templates cascade;

-- ============================================================================
-- TEMPLATE SYSTEM
-- industry_templates is the single place that defines a niche: its wording,
-- job types, stages, custom fields, default checklists and AI tone. The app
-- never hard-codes any of this — it always reads the active template's config.
-- ============================================================================
create table industry_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,              -- e.g. 'engineering', 'plumbing_heating'
  name text not null,                    -- e.g. 'Engineering'
  config jsonb not null,                 -- labels, job_types, stages, custom_fields, default_tasks, ai_tone (see TEMPLATES.md)
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ORGANISATIONS (tenants)
-- Every other table belongs to one organisation. Each organisation has
-- exactly one active industry template at a time.
-- ============================================================================
create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  primary_color text not null default '#2563eb',
  secondary_color text not null default '#1e293b',
  active_template_id uuid references industry_templates(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- PROFILES
-- One row per logged-in person, linked 1:1 to Supabase's built-in auth.users.
-- role is one of: manager, worker, customer.
-- customer_id is only set for role = customer, and restricts what they see.
-- ============================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organisations(id) on delete cascade,
  role text not null check (role in ('manager', 'worker', 'customer')),
  display_name text not null,
  customer_id uuid, -- FK added after customers table exists, below
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CUSTOMERS, SITES & CONTACTS
-- ============================================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_customer_id_fkey foreign key (customer_id) references customers(id) on delete set null;

create table sites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  address_line1 text not null,
  address_line2 text,
  city text,
  postcode text,
  created_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role_title text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ENQUIRIES & QUOTES
-- ============================================================================
create table enquiries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  job_type text not null,
  description text,
  status text not null default 'new' check (status in ('new', 'quoted', 'approved', 'rejected', 'converted')),
  created_at timestamptz not null default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  enquiry_id uuid not null references enquiries(id) on delete cascade,
  amount numeric(12, 2),
  status text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'rejected')),
  customer_po_number text,
  sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- JOBS (the core record) & related detail tables
-- ============================================================================
create table jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  reference_number text not null,
  job_type text not null,
  description text,
  stage text not null,
  owner_id uuid references profiles(id) on delete set null,
  due_date date,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  value numeric(12, 2),
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table job_stage_history (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  changed_by uuid references profiles(id) on delete set null,
  note text,
  changed_at timestamptz not null default now()
);

create table job_tasks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  stage text not null,
  title text not null,
  is_done boolean not null default false,
  done_by uuid references profiles(id) on delete set null,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create table job_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  visible_to_customer boolean not null default false,
  created_at timestamptz not null default now()
);

create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  uploaded_by uuid references profiles(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  kind text not null default 'photo' check (kind in ('photo', 'document')),
  created_at timestamptz not null default now()
);

create table parts_awaited (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  description text not null,
  expected_date date,
  received boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CUSTOMER UPDATES (AI-assisted, human-approved) & AI ACTION LOG
-- ============================================================================
create table customer_updates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  created_by uuid references profiles(id) on delete set null,
  approved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table ai_action_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  action_type text not null,
  input_summary text,
  output_summary text,
  performed_by uuid references profiles(id) on delete set null,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- HELPER FUNCTIONS (used by RLS policies below)
-- security definer = runs with elevated rights so it can read `profiles`
-- even though RLS on `profiles` would normally block it.
-- ============================================================================
create or replace function profile_org_id() returns uuid
  language sql security definer stable as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function profile_role() returns text
  language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function profile_customer_id() returns uuid
  language sql security definer stable as $$
  select customer_id from profiles where id = auth.uid();
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Rule of thumb: managers & workers ("staff") see everything in their own
-- organisation; a customer-role user only sees rows tied to their own
-- customer_id, and can never write anything (read-only portal).
-- ============================================================================
alter table industry_templates enable row level security;
alter table organisations enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table sites enable row level security;
alter table contacts enable row level security;
alter table enquiries enable row level security;
alter table quotes enable row level security;
alter table jobs enable row level security;
alter table job_stage_history enable row level security;
alter table job_tasks enable row level security;
alter table job_notes enable row level security;
alter table job_photos enable row level security;
alter table parts_awaited enable row level security;
alter table customer_updates enable row level security;
alter table ai_action_log enable row level security;

-- Templates: everyone signed in can read the template library (needed to
-- render labels/stages); only this app's admin tooling writes to it via the
-- service role key, so no insert/update/delete policy is defined for normal users.
create policy "templates readable by any signed-in user" on industry_templates
  for select using (auth.role() = 'authenticated');

create policy "own organisation readable" on organisations
  for select using (id = profile_org_id());

create policy "own organisation updatable by staff" on organisations
  for update using (id = profile_org_id() and profile_role() in ('manager', 'worker'))
  with check (id = profile_org_id() and profile_role() in ('manager', 'worker'));

create policy "own profile readable" on profiles
  for select using (id = auth.uid() or org_id = profile_org_id());

create policy "own profile updatable" on profiles
  for update using (id = auth.uid());

-- Staff (manager/worker) see all rows in their org; customers see only rows
-- linked to their own customer_id. Writes are staff-only everywhere.
create policy "customers: staff full read" on customers
  for select using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));
create policy "customers: customer reads own record" on customers
  for select using (id = profile_customer_id());
create policy "customers: staff write" on customers
  for all using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'))
  with check (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));

create policy "sites: staff full read" on sites
  for select using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));
create policy "sites: customer reads own" on sites
  for select using (customer_id = profile_customer_id());
create policy "sites: staff write" on sites
  for all using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'))
  with check (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));

create policy "contacts: staff full read" on contacts
  for select using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));
create policy "contacts: customer reads own" on contacts
  for select using (customer_id = profile_customer_id());
create policy "contacts: staff write" on contacts
  for all using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'))
  with check (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));

create policy "enquiries: staff full read" on enquiries
  for select using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));
create policy "enquiries: staff write" on enquiries
  for all using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'))
  with check (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));

create policy "quotes: staff full read" on quotes
  for select using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));
create policy "quotes: customer reads own" on quotes
  for select using (exists (
    select 1 from enquiries e where e.id = quotes.enquiry_id and e.customer_id = profile_customer_id()
  ));
create policy "quotes: staff write" on quotes
  for all using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'))
  with check (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));

create policy "jobs: staff full read" on jobs
  for select using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));
create policy "jobs: customer reads own" on jobs
  for select using (customer_id = profile_customer_id());
create policy "jobs: staff write" on jobs
  for all using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'))
  with check (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));

create policy "job_stage_history: staff full read" on job_stage_history
  for select using (exists (select 1 from jobs j where j.id = job_stage_history.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'));
create policy "job_stage_history: customer reads own" on job_stage_history
  for select using (exists (select 1 from jobs j where j.id = job_stage_history.job_id and j.customer_id = profile_customer_id()));
create policy "job_stage_history: staff write" on job_stage_history
  for all using (exists (select 1 from jobs j where j.id = job_stage_history.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'))
  with check (exists (select 1 from jobs j where j.id = job_stage_history.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'));

create policy "job_tasks: staff full read" on job_tasks
  for select using (exists (select 1 from jobs j where j.id = job_tasks.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'));
create policy "job_tasks: customer reads own" on job_tasks
  for select using (exists (select 1 from jobs j where j.id = job_tasks.job_id and j.customer_id = profile_customer_id()));
create policy "job_tasks: staff write" on job_tasks
  for all using (exists (select 1 from jobs j where j.id = job_tasks.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'))
  with check (exists (select 1 from jobs j where j.id = job_tasks.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'));

create policy "job_notes: staff full read" on job_notes
  for select using (exists (select 1 from jobs j where j.id = job_notes.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'));
create policy "job_notes: customer reads visible notes on own jobs" on job_notes
  for select using (visible_to_customer = true and exists (select 1 from jobs j where j.id = job_notes.job_id and j.customer_id = profile_customer_id()));
create policy "job_notes: staff write" on job_notes
  for all using (exists (select 1 from jobs j where j.id = job_notes.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'))
  with check (exists (select 1 from jobs j where j.id = job_notes.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'));

create policy "job_photos: staff full read" on job_photos
  for select using (exists (select 1 from jobs j where j.id = job_photos.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'));
create policy "job_photos: customer reads own job photos" on job_photos
  for select using (exists (select 1 from jobs j where j.id = job_photos.job_id and j.customer_id = profile_customer_id()));
create policy "job_photos: staff write" on job_photos
  for all using (exists (select 1 from jobs j where j.id = job_photos.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'))
  with check (exists (select 1 from jobs j where j.id = job_photos.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'));

create policy "parts_awaited: staff full read" on parts_awaited
  for select using (exists (select 1 from jobs j where j.id = parts_awaited.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'));
create policy "parts_awaited: staff write" on parts_awaited
  for all using (exists (select 1 from jobs j where j.id = parts_awaited.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'))
  with check (exists (select 1 from jobs j where j.id = parts_awaited.job_id and j.org_id = profile_org_id()) and profile_role() in ('manager', 'worker'));

create policy "customer_updates: staff full read" on customer_updates
  for select using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));
create policy "customer_updates: customer reads own published updates" on customer_updates
  for select using (status = 'published' and customer_id = profile_customer_id());
create policy "customer_updates: staff write" on customer_updates
  for all using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'))
  with check (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));

create policy "ai_action_log: staff full read" on ai_action_log
  for select using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));
create policy "ai_action_log: staff write" on ai_action_log
  for all using (org_id = profile_org_id() and profile_role() in ('manager', 'worker'))
  with check (org_id = profile_org_id() and profile_role() in ('manager', 'worker'));
