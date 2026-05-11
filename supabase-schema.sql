-- Paste this into your Supabase SQL Editor to set up the DB

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--------------------------------------------------
-- profiles
--------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role text not null,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

--------------------------------------------------
-- classes
--------------------------------------------------
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  numeric_level int,
  created_at timestamptz default now()
);

--------------------------------------------------
-- sections
--------------------------------------------------
create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  name text not null
);

--------------------------------------------------
-- students
--------------------------------------------------
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  student_code text unique,
  class_id uuid references classes(id),
  section_id uuid references sections(id),
  gender text,
  dob date,
  address text,
  parent_name text,
  parent_phone text,
  admission_date date,
  status text default 'active'
);

--------------------------------------------------
-- teachers
--------------------------------------------------
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  employee_code text unique,
  qualification text,
  joining_date date,
  salary numeric
);

--------------------------------------------------
-- subjects
--------------------------------------------------
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  class_id uuid references classes(id)
);

--------------------------------------------------
-- attendance
--------------------------------------------------
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  class_id uuid references classes(id),
  attendance_date date,
  status text check (
    status in ('present','absent','late')
  ),
  marked_by uuid references profiles(id)
);

-- Safely add unique constraint to attendance
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'attendance_student_date_key'
  ) then
    alter table attendance add constraint attendance_student_date_key unique (student_id, attendance_date);
  end if;
end $$;

--------------------------------------------------
-- exams
--------------------------------------------------
create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  name text,
  class_id uuid references classes(id),
  start_date date,
  end_date date
);

--------------------------------------------------
-- exam_results
--------------------------------------------------
create table if not exists exam_results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id),
  student_id uuid references students(id),
  subject_id uuid references subjects(id),
  marks_obtained numeric,
  full_marks numeric,
  grade text,
  remarks text
);

--------------------------------------------------
-- fee_payments
--------------------------------------------------
create table if not exists fee_payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  amount numeric,
  payment_date timestamptz default now(),
  payment_method text,
  transaction_id text
);

--------------------------------------------------
-- notices
--------------------------------------------------
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  audience text,
  created_at timestamptz default now()
);

--------------------------------------------------
-- ENABLE RLS
--------------------------------------------------
alter table profiles enable row level security;
alter table classes enable row level security;
alter table sections enable row level security;
alter table students enable row level security;
alter table teachers enable row level security;
alter table subjects enable row level security;
alter table attendance enable row level security;
alter table exams enable row level security;
alter table exam_results enable row level security;
alter table fee_payments enable row level security;
alter table notices enable row level security;

--------------------------------------------------
-- RLS POLICIES (Allow authenticated users full access for now)
--------------------------------------------------
-- We drop policies first so the script can be run multiple times safely
drop policy if exists "Admin full access profiles" on profiles;
drop policy if exists "Admin full access classes" on classes;
drop policy if exists "Admin full access sections" on sections;
drop policy if exists "Admin full access students" on students;
drop policy if exists "Admin full access teachers" on teachers;
drop policy if exists "Admin full access subjects" on subjects;
drop policy if exists "Admin full access attendance" on attendance;
drop policy if exists "Admin full access exams" on exams;
drop policy if exists "Admin full access exam_results" on exam_results;
drop policy if exists "Admin full access fee_payments" on fee_payments;
drop policy if exists "Admin full access notices" on notices;
drop policy if exists "Admin full access" on students;

drop policy if exists "Auth full access profiles" on profiles;
drop policy if exists "Auth full access classes" on classes;
drop policy if exists "Auth full access sections" on sections;
drop policy if exists "Auth full access students" on students;
drop policy if exists "Auth full access teachers" on teachers;
drop policy if exists "Auth full access subjects" on subjects;
drop policy if exists "Auth full access attendance" on attendance;
drop policy if exists "Auth full access exams" on exams;
drop policy if exists "Auth full access exam_results" on exam_results;
drop policy if exists "Auth full access fee_payments" on fee_payments;
drop policy if exists "Auth full access notices" on notices;

create policy "Auth full access profiles" on profiles for all to authenticated using (true) with check (true);
create policy "Auth full access classes" on classes for all to authenticated using (true) with check (true);
create policy "Auth full access sections" on sections for all to authenticated using (true) with check (true);
create policy "Auth full access students" on students for all to authenticated using (true) with check (true);
create policy "Auth full access teachers" on teachers for all to authenticated using (true) with check (true);
create policy "Auth full access subjects" on subjects for all to authenticated using (true) with check (true);
create policy "Auth full access attendance" on attendance for all to authenticated using (true) with check (true);
create policy "Auth full access exams" on exams for all to authenticated using (true) with check (true);
create policy "Auth full access exam_results" on exam_results for all to authenticated using (true) with check (true);
create policy "Auth full access fee_payments" on fee_payments for all to authenticated using (true) with check (true);
create policy "Auth full access notices" on notices for all to authenticated using (true) with check (true);

--------------------------------------------------
-- INDEXES
--------------------------------------------------
create index if not exists idx_students_class on students(class_id);
create index if not exists idx_students_profile on students(profile_id);
create index if not exists idx_teachers_profile on teachers(profile_id);
create index if not exists idx_attendance_student_date on attendance(student_id, attendance_date);
create index if not exists idx_attendance_class on attendance(class_id);
create index if not exists idx_exam_results_student on exam_results(student_id);
create index if not exists idx_exam_results_exam on exam_results(exam_id);
create index if not exists idx_fee_payments_student on fee_payments(student_id);
