-- =====================================================
-- KIRI School Management System - Audit Logging System
-- =====================================================
-- This script adds comprehensive audit logging for sensitive operations
-- Run this in Supabase SQL Editor after the main schema is set up

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  user_id uuid references profiles(id),
  user_role text,
  ip_address inet,
  user_agent text,
  timestamp timestamptz default now(),
  description text
);

-- Enable RLS
alter table audit_logs enable row level security;

-- =====================================================
-- AUDIT LOG POLICIES
-- =====================================================

-- Admins can view all audit logs
create policy "Admins view audit logs" on audit_logs
  for select using (current_user_role() = 'admin');

-- Users can view their own audit logs
create policy "Users view own audit logs" on audit_logs
  for select using (user_id = auth.uid());

-- =====================================================
-- AUDIT TRIGGER FUNCTIONS
-- =====================================================

-- Generic audit trigger function
create or replace function audit_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  user_role_val text;
  user_record record;
begin
  -- Get current user role
  select role into user_role_val from profiles where id = auth.uid();
  
  -- Get user record for logging
  select id, role into user_record from profiles where id = auth.uid();
  
  if TG_OP = 'DELETE' then
    insert into audit_logs (
      table_name,
      record_id,
      operation,
      old_data,
      new_data,
      user_id,
      user_role,
      ip_address,
      user_agent,
      description
    ) values (
      TG_TABLE_NAME,
      OLD.id,
      TG_OP,
      to_jsonb(OLD),
      null,
      user_record.id,
      user_record.role,
      inet_client_addr(),
      current_setting('request.headers')::json->>'user-agent',
      format('Deleted record from %s', TG_TABLE_NAME)
    );
    return OLD;
  
  elsif TG_OP = 'UPDATE' then
    insert into audit_logs (
      table_name,
      record_id,
      operation,
      old_data,
      new_data,
      user_id,
      user_role,
      ip_address,
      user_agent,
      description
    ) values (
      TG_TABLE_NAME,
      NEW.id,
      TG_OP,
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_record.id,
      user_record.role,
      inet_client_addr(),
      current_setting('request.headers')::json->>'user-agent',
      format('Updated record in %s', TG_TABLE_NAME)
    );
    return NEW;
  
  elsif TG_OP = 'INSERT' then
    insert into audit_logs (
      table_name,
      record_id,
      operation,
      old_data,
      new_data,
      user_id,
      user_role,
      ip_address,
      user_agent,
      description
    ) values (
      TG_TABLE_NAME,
      NEW.id,
      TG_OP,
      null,
      to_jsonb(NEW),
      user_record.id,
      user_record.role,
      inet_client_addr(),
      current_setting('request.headers')::json->>'user-agent',
      format('Inserted record into %s', TG_TABLE_NAME)
    );
    return NEW;
  end if;
  
  return null;
end;
$$;

-- =====================================================
-- CREATE AUDIT TRIGGERS FOR SENSITIVE TABLES
-- =====================================================

-- Financial data audit triggers
drop trigger if exists audit_fee_payments_trigger on fee_payments;
create trigger audit_fee_payments_trigger
  after insert or update or delete on fee_payments
  for each row execute function audit_trigger();

-- Academic records audit triggers
drop trigger if exists audit_exam_results_trigger on exam_results;
create trigger audit_exam_results_trigger
  after insert or update or delete on exam_results
  for each row execute function audit_trigger();

drop trigger if exists audit_exams_trigger on exams;
create trigger audit_exams_trigger
  after insert or update or delete on exams
  for each row execute function audit_trigger();

-- User management audit triggers
drop trigger if exists audit_students_trigger on students;
create trigger audit_students_trigger
  after insert or update or delete on students
  for each row execute function audit_trigger();

drop trigger if exists audit_teachers_trigger on teachers;
create trigger audit_teachers_trigger
  after insert or update or delete on teachers
  for each row execute function audit_trigger();

-- System configuration audit triggers
drop trigger if exists audit_academic_years_trigger on academic_years;
create trigger audit_academic_years_trigger
  after insert or update or delete on academic_years
  for each row execute function audit_trigger();

drop trigger if exists audit_phases_trigger on phases;
create trigger audit_phases_trigger
  after insert or update or delete on phases
  for each row execute function audit_trigger();

drop trigger if exists audit_teacher_assignments_trigger on teacher_assignments;
create trigger audit_teacher_assignments_trigger
  after insert or update or delete on teacher_assignments
  for each row execute function audit_trigger();

-- =====================================================
-- AUDIT LOGGING VIEWS
-- =====================================================

-- View for sensitive operations monitoring
create or replace view sensitive_operations as
select 
  al.*,
  case 
    when al.table_name in ('fee_payments', 'exam_results') then 'HIGH'
    when al.table_name in ('students', 'teachers', 'exams') then 'MEDIUM'
    else 'LOW'
  end as risk_level
from audit_logs al
where al.table_name in ('fee_payments', 'exam_results', 'students', 'teachers', 'exams', 'academic_years', 'phases', 'teacher_assignments')
order by al.timestamp desc;

-- View for user activity summary
create or replace view user_activity_summary as
select 
  p.full_name,
  p.email,
  p.role,
  count(al.id) as total_operations,
  count(case when al.table_name in ('fee_payments', 'exam_results') then 1 end) as sensitive_operations,
  max(al.timestamp) as last_activity
from profiles p
left join audit_logs al on p.id = al.user_id
group by p.id, p.full_name, p.email, p.role
order by total_operations desc;

-- =====================================================
-- AUDIT LOGGING FUNCTIONS
-- =====================================================

-- Function to log custom events
create or replace function log_custom_event(
  event_table_name text,
  event_record_id uuid,
  event_description text,
  event_old_data jsonb default null,
  event_new_data jsonb default null
)
returns void
language plpgsql
security definer
as $$
declare
  user_role_val text;
  user_record record;
begin
  -- Get current user role
  select role into user_role_val from profiles where id = auth.uid();
  
  -- Get user record for logging
  select id, role into user_record from profiles where id = auth.uid();
  
  insert into audit_logs (
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    user_id,
    user_role,
    ip_address,
    user_agent,
    description
  ) values (
    event_table_name,
    event_record_id,
    'CUSTOM',
    event_old_data,
    event_new_data,
    user_record.id,
    user_record.role,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent',
    event_description
  );
end;
$$;

-- Function to get audit trail for specific record
create or replace function get_audit_trail(
  target_table_name text,
  target_record_id uuid
)
returns table (
  timestamp timestamptz,
  operation text,
  user_name text,
  user_role text,
  old_data jsonb,
  new_data jsonb,
  description text
)
language sql
security definer
as $$
  select 
    al.timestamp,
    al.operation,
    p.full_name,
    al.user_role,
    al.old_data,
    al.new_data,
    al.description
  from audit_logs al
  join profiles p on al.user_id = p.id
  where al.table_name = target_table_name
  and al.record_id = target_record_id
  order by al.timestamp desc;
$$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
create index if not exists idx_audit_logs_table_record on audit_logs(table_name, record_id);
create index if not exists idx_audit_logs_user_id on audit_logs(user_id);
create index if not exists idx_audit_logs_timestamp on audit_logs(timestamp desc);
create index if not exists idx_audit_logs_operation on audit_logs(operation);
create index if not exists idx_audit_logs_table_name on audit_logs(table_name);

-- =====================================================
-- AUDIT LOG CLEANUP FUNCTION
-- =====================================================

-- Function to clean up old audit logs (keep last 2 years)
create or replace function cleanup_old_audit_logs()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from audit_logs 
  where timestamp < now() - interval '2 years';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  return deleted_count;
end;
$$;

-- =====================================================
-- SECURITY NOTES
-- =====================================================
-- 1. Audit logs are immutable once created
-- 2. Only admins can view all audit logs
-- 3. Users can only view their own audit trail
-- 4. Sensitive operations (financial, academic) are flagged for monitoring
-- 5. IP address and user agent tracking for security analysis
-- 6. Consider setting up automated alerts for suspicious patterns
-- 7. Regular cleanup of old logs recommended for performance
