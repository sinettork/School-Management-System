-- Phases/Terms/Semesters Management Schema
-- Add this to your existing Supabase database

--------------------------------------------------
-- academic_years
--------------------------------------------------
create table if not exists academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g., "2024-2025", "2025-2026"
  start_date date not null,
  end_date date not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

--------------------------------------------------
-- phases (Terms/Semesters)
--------------------------------------------------
create table if not exists phases (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid references academic_years(id) on delete cascade,
  name text not null, -- e.g., "First Term", "Second Term", "Summer Semester"
  phase_type text not null check (phase_type in ('term', 'semester', 'quarter')),
  sequence_number int not null, -- 1, 2, 3, etc. for ordering
  start_date date not null,
  end_date date not null,
  is_active boolean default false,
  status text default 'upcoming' check (status in ('upcoming', 'active', 'completed')),
  created_at timestamptz default now()
);

--------------------------------------------------
-- Update existing tables to include phase references
--------------------------------------------------

-- Add phase_id to exams table
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'exams' and column_name = 'phase_id'
  ) then
    alter table exams add column phase_id uuid references phases(id);
  end if;
end $$;

-- Add phase_id to attendance table
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'attendance' and column_name = 'phase_id'
  ) then
    alter table attendance add column phase_id uuid references phases(id);
  end if;
end $$;

-- Add phase_id to fee_payments table
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'fee_payments' and column_name = 'phase_id'
  ) then
    alter table fee_payments add column phase_id uuid references phases(id);
  end if;
end $$;

-- Add phase_id to exam_results table
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'exam_results' and column_name = 'phase_id'
  ) then
    alter table exam_results add column phase_id uuid references phases(id);
  end if;
end $$;

--------------------------------------------------
-- Enable RLS for new tables
--------------------------------------------------
alter table academic_years enable row level security;
alter table phases enable row level security;

--------------------------------------------------
-- RLS Policies for new tables
--------------------------------------------------
drop policy if exists "Auth full access academic_years" on academic_years;
drop policy if exists "Auth full access phases" on phases;

create policy "Auth full access academic_years" on academic_years for all to authenticated using (true) with check (true);
create policy "Auth full access phases" on phases for all to authenticated using (true) with check (true);

--------------------------------------------------
-- Indexes for new tables
--------------------------------------------------
create index if not exists idx_academic_years_active on academic_years(is_active);
create index if not exists idx_phases_academic_year on phases(academic_year_id);
create index if not exists idx_phases_active on phases(is_active);
create index if not exists idx_phases_status on phases(status);
create index if not exists idx_exams_phase on exams(phase_id);
create index if not exists idx_attendance_phase on attendance(phase_id);
create index if not exists idx_fee_payments_phase on fee_payments(phase_id);
create index if not exists idx_exam_results_phase on exam_results(phase_id);

--------------------------------------------------
-- Constraints to ensure data integrity
--------------------------------------------------

-- Ensure academic years don't overlap
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'academic_years_dates_no_overlap'
  ) then
    alter table academic_years add constraint academic_years_dates_no_overlap 
    exclude using gist (daterange(start_date, end_date, '[]') with &&);
  end if;
end $$;

-- Ensure phases don't overlap within the same academic year
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'phases_dates_no_overlap'
  ) then
    alter table phases add constraint phases_dates_no_overlap 
    exclude using gist (academic_year_id with =, daterange(start_date, end_date, '[]') with &&);
  end if;
end $$;

-- Ensure sequence numbers are unique within academic year
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'phases_sequence_unique'
  ) then
    alter table phases add constraint phases_sequence_unique 
    unique (academic_year_id, sequence_number);
  end if;
end $$;

-- Ensure only one phase is active at a time
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'phases_single_active'
  ) then
    alter table phases add constraint phases_single_active 
    exclude using gist (is_active with =) where (is_active = true);
  end if;
end $$;

--------------------------------------------------
-- Trigger to automatically update phase status based on dates
--------------------------------------------------
create or replace function update_phase_status()
returns trigger as $$
begin
  -- Update status based on current date
  if current_date >= new.start_date and current_date <= new.end_date then
    new.status := 'active';
    new.is_active := true;
  elsif current_date < new.start_date then
    new.status := 'upcoming';
    new.is_active := false;
  else
    new.status := 'completed';
    new.is_active := false;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Create trigger if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trigger_update_phase_status'
  ) then
    create trigger trigger_update_phase_status
      before insert or update on phases
      for each row execute function update_phase_status();
  end if;
end $$;

--------------------------------------------------
-- Sample data (optional - for testing)
--------------------------------------------------
-- Insert sample academic year
insert into academic_years (name, start_date, end_date, is_active) 
values 
  ('2024-2025', '2024-09-01', '2025-06-30', true)
on conflict (name) do nothing;

-- Insert sample phases
insert into phases (academic_year_id, name, phase_type, sequence_number, start_date, end_date)
select 
  id,
  unnest(array['First Term', 'Second Term', 'Third Term']),
  'term',
  generate_series(1,3),
  unnest(array['2024-09-01'::date, '2024-12-15'::date, '2025-01-15'::date]),
  unnest(array['2024-12-14'::date, '2025-01-14'::date, '2025-06-30'::date])
from academic_years 
where name = '2024-2025'
on conflict do nothing;
