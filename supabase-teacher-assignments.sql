-- =====================================================
-- KIRI School Management System - Teacher Assignment System
-- =====================================================
-- This script adds teacher assignment functionality
-- Run this in Supabase SQL Editor after the main schema is set up

-- =====================================================
-- TEACHER ASSIGNMENTS TABLE
-- =====================================================
create table if not exists teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  academic_year_id uuid references academic_years(id) on delete cascade,
  phase_id uuid references phases(id) on delete cascade,
  is_active boolean default true,
  assigned_at timestamptz default now(),
  assigned_by uuid references profiles(id),
  unique(teacher_id, class_id, subject_id, academic_year_id, phase_id)
);

-- Enable RLS
alter table teacher_assignments enable row level security;

-- =====================================================
-- UPDATED RLS POLICIES FOR TEACHER ASSIGNMENTS
-- =====================================================

-- Teachers can view their own assignments
create policy "Teachers view own assignments" on teacher_assignments
  for select using (
    current_user_role() = 'teacher' and 
    teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
  );

-- Admins can manage all assignments
create policy "Admins manage assignments" on teacher_assignments
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- UPDATED RLS POLICIES FOR TEACHER-SPECIFIC ACCESS
-- =====================================================

-- Drop existing teacher policies to update them
drop policy if exists "Teachers view class students" on students;
drop policy if exists "Teachers view class attendance" on attendance;
drop policy if exists "Teachers view class results" on exam_results;
drop policy if exists "Teachers manage class results" on exam_results;
drop policy if exists "Teachers mark attendance" on attendance;

-- Updated student access policy - teachers can view students in their assigned classes
create policy "Teachers view assigned class students" on students
  for select using (
    current_user_role() = 'teacher' and 
    class_id in (
      select distinct class_id from teacher_assignments 
      where teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
      and is_active = true
    )
  );

-- Updated attendance access - teachers can view attendance for their assigned classes
create policy "Teachers view assigned class attendance" on attendance
  for select using (
    current_user_role() = 'teacher' and 
    class_id in (
      select distinct class_id from teacher_assignments 
      where teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
      and is_active = true
    )
  );

-- Teachers can mark attendance for their assigned classes
create policy "Teachers mark assigned class attendance" on attendance
  for insert using (
    current_user_role() = 'teacher' and 
    class_id in (
      select distinct class_id from teacher_assignments 
      where teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
      and is_active = true
    )
  )
  with check (
    current_user_role() = 'teacher' and 
    class_id in (
      select distinct class_id from teacher_assignments 
      where teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
      and is_active = true
    )
  );

-- Updated exam results access - teachers can view results for their assigned subjects/classes
create policy "Teachers view assigned class results" on exam_results
  for select using (
    current_user_role() = 'teacher' and 
    (
      -- Teacher assigned to the class
      class_id in (
        select distinct class_id from teacher_assignments 
        where teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
        and is_active = true
      )
      OR
      -- Teacher assigned to the subject
      subject_id in (
        select distinct subject_id from teacher_assignments 
        where teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
        and is_active = true
      )
    )
  );

-- Teachers can manage results for their assigned subjects/classes
create policy "Teachers manage assigned class results" on exam_results
  for all using (
    current_user_role() = 'teacher' and 
    (
      -- Teacher assigned to the class
      class_id in (
        select distinct class_id from teacher_assignments 
        where teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
        and is_active = true
      )
      OR
      -- Teacher assigned to the subject
      subject_id in (
        select distinct subject_id from teacher_assignments 
        where teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
        and is_active = true
      )
    )
  )
  with check (
    current_user_role() = 'teacher' and 
    (
      -- Teacher assigned to the class
      class_id in (
        select distinct class_id from teacher_assignments 
        where teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
        and is_active = true
      )
      OR
      -- Teacher assigned to the subject
      subject_id in (
        select distinct subject_id from teacher_assignments 
        where teacher_id = (select id from teachers where profile_id = (select id from profiles where id = auth.uid()))
        and is_active = true
      )
    )
  );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
create index if not exists idx_teacher_assignments_teacher on teacher_assignments(teacher_id);
create index if not exists idx_teacher_assignments_class on teacher_assignments(class_id);
create index if not exists idx_teacher_assignments_subject on teacher_assignments(subject_id);
create index if not exists idx_teacher_assignments_active on teacher_assignments(is_active);
create index if not exists idx_teacher_assignments_year_phase on teacher_assignments(academic_year_id, phase_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get teacher's assigned classes
create or replace function get_teacher_assigned_classes(teacher_profile_id uuid)
returns table(class_id uuid, class_name text)
language sql
security definer
as $$
  select distinct 
    c.id as class_id,
    c.name as class_name
  from teacher_assignments ta
  join teachers t on ta.teacher_id = t.id
  join classes c on ta.class_id = c.id
  where t.profile_id = teacher_profile_id
  and ta.is_active = true;
$$;

-- Function to get teacher's assigned subjects
create or replace function get_teacher_assigned_subjects(teacher_profile_id uuid)
returns table(subject_id uuid, subject_name text, class_id uuid, class_name text)
language sql
security definer
as $$
  select distinct 
    s.id as subject_id,
    s.name as subject_name,
    c.id as class_id,
    c.name as class_name
  from teacher_assignments ta
  join teachers t on ta.teacher_id = t.id
  join subjects s on ta.subject_id = s.id
  join classes c on ta.class_id = c.id
  where t.profile_id = teacher_profile_id
  and ta.is_active = true;
$$;

-- Function to check if teacher is assigned to specific class/subject
create or replace function is_teacher_assigned(teacher_profile_id uuid, class_id uuid, subject_id uuid)
returns boolean
language sql
security definer
as $$
  select exists(
    select 1 from teacher_assignments ta
    join teachers t on ta.teacher_id = t.id
    where t.profile_id = teacher_profile_id
    and ta.class_id = class_id
    and (subject_id is null or ta.subject_id = subject_id)
    and ta.is_active = true
  );
$$;
