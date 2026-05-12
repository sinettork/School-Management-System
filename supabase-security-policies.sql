-- =====================================================
-- KIRI School Management System - Role-Based RLS Policies
-- =====================================================
-- This script replaces blanket access policies with role-differentiated policies
-- Run this in Supabase SQL Editor after the main schema is set up

-- =====================================================
-- First, drop all existing blanket policies
-- =====================================================
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
drop policy if exists "Auth full access academic_years" on academic_years;
drop policy if exists "Auth full access phases" on phases;

-- =====================================================
-- Helper function to get current user's role
-- =====================================================
create or replace function current_user_role()
returns text
language sql
security definer
as $$
  select role from profiles where id = auth.uid();
$$;

-- =====================================================
-- PROFILES TABLE - Users can see/edit their own profile
-- =====================================================
-- Users can view their own profile
create policy "Users view own profile" on profiles
  for select using (auth.uid() = id);

-- Users can update their own profile (except role)
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = old.role);

-- Admins can view all profiles
create policy "Admins view all profiles" on profiles
  for select using (current_user_role() = 'admin');

-- Admins can insert/update/delete profiles
create policy "Admins manage all profiles" on profiles
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- CLASSES TABLE - Different access levels
-- =====================================================
-- Teachers and students can view classes
create policy "Teachers and students view classes" on classes
  for select using (current_user_role() in ('teacher', 'student', 'admin'));

-- Admins can manage classes
create policy "Admins manage classes" on classes
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- SECTIONS TABLE - Similar to classes
-- =====================================================
-- Teachers and students can view sections
create policy "Teachers and students view sections" on sections
  for select using (current_user_role() in ('teacher', 'student', 'admin'));

-- Admins can manage sections
create policy "Admins manage sections" on sections
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- STUDENTS TABLE - Role-based access
-- =====================================================
-- Students can view their own record
create policy "Students view own record" on students
  for select using (
    current_user_role() = 'student' and 
    profile_id = (select id from profiles where id = auth.uid())
  );

-- Teachers can view students in their classes (placeholder for future teacher assignment)
create policy "Teachers view class students" on students
  for select using (current_user_role() in ('teacher', 'admin'));

-- Admins can manage all students
create policy "Admins manage all students" on students
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- TEACHERS TABLE - Role-based access
-- =====================================================
-- Teachers can view their own record
create policy "Teachers view own record" on teachers
  for select using (
    current_user_role() = 'teacher' and 
    profile_id = (select id from profiles where id = auth.uid())
  );

-- Students and teachers can view teacher directory (limited info)
create policy "View teacher directory" on teachers
  for select using (current_user_role() in ('student', 'teacher', 'admin'));

-- Admins can manage all teachers
create policy "Admins manage all teachers" on teachers
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- SUBJECTS TABLE - View access for most users
-- =====================================================
-- Teachers and students can view subjects
create policy "Teachers and students view subjects" on subjects
  for select using (current_user_role() in ('teacher', 'student', 'admin'));

-- Admins can manage subjects
create policy "Admins manage subjects" on subjects
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- ATTENDANCE TABLE - Complex role-based access
-- =====================================================
-- Students can view their own attendance
create policy "Students view own attendance" on attendance
  for select using (
    current_user_role() = 'student' and 
    student_id = (select id from students where profile_id = auth.uid())
  );

-- Teachers can view attendance for their classes (placeholder)
create policy "Teachers view class attendance" on attendance
  for select using (current_user_role() in ('teacher', 'admin'));

-- Teachers can mark attendance (placeholder for class assignment)
create policy "Teachers mark attendance" on attendance
  for insert using (current_user_role() in ('teacher', 'admin'))
  with check (current_user_role() in ('teacher', 'admin'));

-- Admins can manage all attendance
create policy "Admins manage all attendance" on attendance
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- EXAMS TABLE - Role-based access
-- =====================================================
-- Teachers and students can view exams
create policy "Teachers and students view exams" on exams
  for select using (current_user_role() in ('teacher', 'student', 'admin'));

-- Admins can manage exams
create policy "Admins manage exams" on exams
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- EXAM_RESULTS TABLE - Sensitive data access control
-- =====================================================
-- Students can view their own exam results
create policy "Students view own results" on exam_results
  for select using (
    current_user_role() = 'student' and 
    student_id = (select id from students where profile_id = auth.uid())
  );

-- Teachers can view results for their classes (placeholder)
create policy "Teachers view class results" on exam_results
  for select using (current_user_role() in ('teacher', 'admin'));

-- Teachers can manage results for their classes (placeholder)
create policy "Teachers manage class results" on exam_results
  for all using (current_user_role() in ('teacher', 'admin'))
  with check (current_user_role() in ('teacher', 'admin'));

-- Admins can manage all results
create policy "Admins manage all results" on exam_results
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- FEE_PAYMENTS TABLE - Financial data access control
-- =====================================================
-- Students can view their own fee payments
create policy "Students view own payments" on fee_payments
  for select using (
    current_user_role() = 'student' and 
    student_id = (select id from students where profile_id = auth.uid())
  );

-- Admins can manage all fee payments
create policy "Admins manage all payments" on fee_payments
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- NOTICES TABLE - Public and role-based access
-- =====================================================
-- All authenticated users can view notices
create policy "All users view notices" on notices
  for select using (true);

-- Admins can manage notices
create policy "Admins manage notices" on notices
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- ACADEMIC_YEARS TABLE - Admin-only management
-- =====================================================
-- All users can view academic years
create policy "All users view academic years" on academic_years
  for select using (true);

-- Admins can manage academic years
create policy "Admins manage academic years" on academic_years
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- PHASES TABLE - Admin-only management
-- =====================================================
-- All users can view phases
create policy "All users view phases" on phases
  for select using (true);

-- Admins can manage phases
create policy "Admins manage phases" on phases
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =====================================================
-- SECURITY NOTES
-- =====================================================
-- 1. Teacher-specific class assignments need to be implemented
--    Currently teachers have broad access that should be restricted
-- 2. Consider adding audit logging for sensitive operations
-- 3. Email verification should be enforced in Supabase Auth settings
-- 4. Password reset functionality should be implemented in the UI
-- 5. Consider adding rate limiting for sensitive operations
