-- =================================================================
-- The Complete Roofing Lexicon — Supabase setup
-- Run this once against your self-hosted Supabase project on Zeabur.
-- =================================================================
--
-- The app posts with the project's anon (public) key, configured per-device
-- by the manager in the in-app Sync Settings panel. Keys are NEVER bundled.
--
-- Default table prefix in the app is `roofing_training_`. If you change the
-- prefix here, change it in the in-app Sync Settings to match.
--
-- Recommended RLS pattern after running this file:
--   1. Enable RLS on all three tables.
--   2. Add an INSERT policy for role `anon` on `roofing_training_progress`
--      and `roofing_training_certifications` (the app's only writes).
--   3. Restrict SELECT to authenticated users (your analytics queries).
-- =================================================================

create table if not exists roofing_training_staff (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  staff_name text,
  role text,
  company_location text,
  active boolean default true
);

create table if not exists roofing_training_progress (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  staff_name text,
  role text,
  company_location text,
  event_type text,         -- 'roll_up' | 'cert_attempt' | future event types
  module text,             -- 'overview' | 'hail' | 'report' | etc.
  score numeric,
  payload jsonb            -- arbitrary event detail
);

create table if not exists roofing_training_certifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  staff_name text,
  role text,
  company_location text,
  level text,              -- 'L1' | 'L2' | 'L3'
  level_name text,         -- 'Apprentice' | 'Field Roofing Professional' | 'Claims & Forensics Specialist'
  score numeric,           -- percent, 0–100
  passed boolean,
  weak_modules jsonb,      -- optional list of low-mastery group ids at time of attempt
  payload jsonb            -- full cert detail (date, reference number, etc.)
);

-- Helpful indexes for the dashboards
create index if not exists idx_rtprog_staff on roofing_training_progress (staff_name);
create index if not exists idx_rtprog_created on roofing_training_progress (created_at desc);
create index if not exists idx_rtcert_staff on roofing_training_certifications (staff_name);
create index if not exists idx_rtcert_created on roofing_training_certifications (created_at desc);
create index if not exists idx_rtcert_level on roofing_training_certifications (level);

-- Optional: enable RLS (recommended for shared instances)
-- alter table roofing_training_staff enable row level security;
-- alter table roofing_training_progress enable row level security;
-- alter table roofing_training_certifications enable row level security;

-- Optional: allow anon inserts (matches the app's anon-key writes)
-- create policy "anon can insert progress" on roofing_training_progress
--   for insert to anon with check (true);
-- create policy "anon can insert certs" on roofing_training_certifications
--   for insert to anon with check (true);
