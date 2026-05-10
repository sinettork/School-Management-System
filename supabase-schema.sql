-- Paste this into your Supabase SQL Editor to set up the DB

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--------------------------------------------------
-- profiles
--------------------------------------------------
create table profiles (
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
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  numeric_level int,
  created_at timestamptz default now()
);

--------------------------------------------------
-- sections
--------------------------------------------------
create table sections (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  name text not null
);

--------------------------------------------------
-- students
--------------------------------------------------
create table students (
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
create table teachers (
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
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  class_id uuid references classes(id)
);

--------------------------------------------------
-- attendance
--------------------------------------------------
create table attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  class_id uuid references classes(id),
  attendance_date date,
  status text check (
    status in ('present','absent','late')
  ),
  marked_by uuid references profiles(id)
);

--------------------------------------------------
-- exams
--------------------------------------------------
create table exams (
  id uuid primary key default gen_random_uuid(),
  name text,
  class_id uuid references classes(id),
  start_date date,
  end_date date
);

--------------------------------------------------
-- exam_results
--------------------------------------------------
create table exam_results (
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
create table fee_payments (
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
create table notices (
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
alter table students enable row level security;
alter table teachers enable row level security;
alter table attendance enable row level security;
alter table exams enable row level security;
alter table exam_results enable row level security;

--------------------------------------------------
-- ADMIN POLICY Example
--------------------------------------------------
create policy "Admin full access"
on students
for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
