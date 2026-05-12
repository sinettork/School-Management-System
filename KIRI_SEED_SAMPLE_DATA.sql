-- =====================================================
-- KIRI SCHOOL MANAGEMENT SYSTEM - SAMPLE SEED DATA
-- =====================================================
-- Run this AFTER KIRI_SUPABASE_FINAL.sql
-- Safe to re-run
--
-- Notes:
-- 1. Core reference data is always seeded.
-- 2. Auth-backed student/teacher profiles are linked first when they exist.
-- 3. Fallback demo teachers and students are also created so dashboards
--    have visible data even before anyone signs up.
-- 4. If you create more real accounts later, you can run this file again.
-- =====================================================

begin;

-- Make audit logging safe when this file is run from Supabase SQL Editor,
-- where request headers may not be present.
create or replace function audit_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  user_role_val text;
  user_record record;
  request_headers_text text;
  user_agent_value text;
begin
  select role into user_role_val from profiles where id = auth.uid();
  select id, role into user_record from profiles where id = auth.uid();

  request_headers_text := current_setting('request.headers', true);
  if request_headers_text is not null and request_headers_text <> '' then
    user_agent_value := request_headers_text::json->>'user-agent';
  else
    user_agent_value := null;
  end if;

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
      user_agent_value,
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
      user_agent_value,
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
      user_agent_value,
      format('Inserted record into %s', TG_TABLE_NAME)
    );
    return NEW;
  end if;

  return null;
end;
$$;

-- Backfill common schema drift so this seed works on older databases too.
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists updated_at timestamptz default now();
alter table classes add column if not exists description text;
alter table classes add column if not exists capacity integer default 40;
alter table classes add column if not exists created_at timestamptz default now();
alter table classes add column if not exists updated_at timestamptz default now();
alter table sections add column if not exists capacity integer default 40;
alter table sections add column if not exists created_at timestamptz default now();
alter table sections add column if not exists updated_at timestamptz default now();
alter table subjects add column if not exists code text;
alter table subjects add column if not exists description text;
alter table subjects add column if not exists created_at timestamptz default now();
alter table subjects add column if not exists updated_at timestamptz default now();
alter table students add column if not exists section_id uuid references sections(id) on delete set null;
alter table students add column if not exists gender text;
alter table students add column if not exists dob date;
alter table students add column if not exists address text;
alter table students add column if not exists parent_name text;
alter table students add column if not exists parent_phone text;
alter table students add column if not exists admission_date date default now();
alter table students add column if not exists status text default 'active';
alter table students add column if not exists created_at timestamptz default now();
alter table students add column if not exists updated_at timestamptz default now();
alter table teachers add column if not exists department text;
alter table teachers add column if not exists qualification text;
alter table teachers add column if not exists experience_years integer default 0;
alter table teachers add column if not exists salary numeric(10,2);
alter table teachers add column if not exists joining_date date default now();
alter table teachers add column if not exists status text default 'active';
alter table teachers add column if not exists created_at timestamptz default now();
alter table teachers add column if not exists updated_at timestamptz default now();
alter table teacher_assignments add column if not exists academic_year_id uuid references academic_years(id) on delete cascade;
alter table teacher_assignments add column if not exists phase_id uuid references phases(id) on delete cascade;
alter table teacher_assignments add column if not exists is_active boolean default true;
alter table teacher_assignments add column if not exists assigned_at timestamptz default now();
alter table teacher_assignments add column if not exists assigned_by uuid references profiles(id);
alter table attendance add column if not exists remarks text;
alter table attendance add column if not exists marked_by text;
alter table attendance add column if not exists phase_id uuid references phases(id) on delete set null;
alter table attendance add column if not exists updated_at timestamptz default now();
alter table exams add column if not exists subject_id uuid references subjects(id) on delete cascade;
alter table exams add column if not exists phase_id uuid references phases(id) on delete cascade;
alter table exams add column if not exists title text;
alter table exams add column if not exists exam_date date;
alter table exams add column if not exists full_marks numeric(5,2);
alter table exams add column if not exists total_marks numeric(5,2);
alter table exams add column if not exists duration_minutes integer;
alter table exams add column if not exists description text;
alter table exams add column if not exists updated_at timestamptz default now();
alter table exam_results add column if not exists class_id uuid references classes(id) on delete set null;
alter table exam_results add column if not exists subject_id uuid references subjects(id) on delete set null;
alter table exam_results add column if not exists grade text;
alter table exam_results add column if not exists remarks text;
alter table exam_results add column if not exists phase_id uuid references phases(id) on delete set null;
alter table exam_results add column if not exists updated_at timestamptz default now();
alter table fee_payments add column if not exists transaction_id text;
alter table fee_payments add column if not exists description text;
alter table fee_payments add column if not exists phase_id uuid references phases(id) on delete set null;
alter table fee_payments add column if not exists updated_at timestamptz default now();
alter table notices add column if not exists priority text default 'medium';
alter table notices add column if not exists created_by uuid references profiles(id);
alter table notices add column if not exists phase_id uuid references phases(id) on delete set null;
alter table notices add column if not exists is_active boolean default true;
alter table notices add column if not exists updated_at timestamptz default now();

-- =====================================================
-- LOOKUPS
-- =====================================================

update academic_years ay
set
  start_date = seed.start_date,
  end_date = seed.end_date,
  updated_at = now()
from (
  values
    ('2025-2026', '2025-09-01'::date, '2026-06-30'::date),
    ('2026-2027', '2026-09-01'::date, '2027-06-30'::date)
) as seed(name, start_date, end_date)
where ay.name = seed.name;

insert into academic_years (name, start_date, end_date)
select seed.name, seed.start_date, seed.end_date
from (
  values
    ('2025-2026', '2025-09-01'::date, '2026-06-30'::date),
    ('2026-2027', '2026-09-01'::date, '2027-06-30'::date)
) as seed(name, start_date, end_date)
where not exists (
  select 1
  from academic_years ay
  where ay.name = seed.name
);

update phases p
set
  phase_type = seed.phase_type,
  sequence_number = seed.sequence_number,
  start_date = seed.start_date,
  end_date = seed.end_date,
  description = seed.description,
  updated_at = now()
from academic_years ay
join (
  values
    ('2025-2026', 'First Term', 'term', 1, '2025-09-01'::date, '2025-12-15'::date, 'Opening academic term'),
    ('2025-2026', 'Second Term', 'term', 2, '2026-01-05'::date, '2026-03-20'::date, 'Mid-year academic term'),
    ('2025-2026', 'Final Term', 'term', 3, '2026-04-01'::date, '2026-06-30'::date, 'Final academic term'),
    ('2026-2027', 'First Term', 'term', 1, '2026-09-01'::date, '2026-12-15'::date, 'Opening academic term'),
    ('2026-2027', 'Second Term', 'term', 2, '2027-01-05'::date, '2027-03-20'::date, 'Mid-year academic term'),
    ('2026-2027', 'Final Term', 'term', 3, '2027-04-01'::date, '2027-06-30'::date, 'Final academic term')
) as seed(academic_year_name, name, phase_type, sequence_number, start_date, end_date, description)
  on ay.name = seed.academic_year_name
where p.academic_year_id = ay.id
  and p.name = seed.name;

insert into phases (
  academic_year_id,
  name,
  phase_type,
  sequence_number,
  start_date,
  end_date,
  description
)
select
  ay.id,
  seed.name,
  seed.phase_type,
  seed.sequence_number,
  seed.start_date,
  seed.end_date,
  seed.description
from academic_years ay
join (
  values
    ('2025-2026', 'First Term', 'term', 1, '2025-09-01'::date, '2025-12-15'::date, 'Opening academic term'),
    ('2025-2026', 'Second Term', 'term', 2, '2026-01-05'::date, '2026-03-20'::date, 'Mid-year academic term'),
    ('2025-2026', 'Final Term', 'term', 3, '2026-04-01'::date, '2026-06-30'::date, 'Final academic term'),
    ('2026-2027', 'First Term', 'term', 1, '2026-09-01'::date, '2026-12-15'::date, 'Opening academic term'),
    ('2026-2027', 'Second Term', 'term', 2, '2027-01-05'::date, '2027-03-20'::date, 'Mid-year academic term'),
    ('2026-2027', 'Final Term', 'term', 3, '2027-04-01'::date, '2027-06-30'::date, 'Final academic term')
) as seed(academic_year_name, name, phase_type, sequence_number, start_date, end_date, description)
  on ay.name = seed.academic_year_name
where not exists (
  select 1
  from phases p
  where p.academic_year_id = ay.id
    and p.name = seed.name
);

update classes c
set
  description = seed.description,
  capacity = seed.capacity,
  updated_at = now()
from (
  values
    ('Grade 1', 'Primary Grade 1', 40),
    ('Grade 2', 'Primary Grade 2', 40),
    ('Grade 3', 'Primary Grade 3', 40),
    ('Grade 4', 'Primary Grade 4', 40)
) as seed(name, description, capacity)
where c.name = seed.name;

insert into classes (name, description, capacity)
select seed.name, seed.description, seed.capacity
from (
  values
    ('Grade 1', 'Primary Grade 1', 40),
    ('Grade 2', 'Primary Grade 2', 40),
    ('Grade 3', 'Primary Grade 3', 40),
    ('Grade 4', 'Primary Grade 4', 40)
) as seed(name, description, capacity)
where not exists (
  select 1
  from classes c
  where c.name = seed.name
);

update sections sec
set
  capacity = 35,
  updated_at = now()
from classes c
cross join (values ('A'), ('B')) as s(section_name)
where c.name in ('Grade 1', 'Grade 2', 'Grade 3', 'Grade 4')
  and sec.class_id = c.id
  and sec.name = s.section_name;

insert into sections (class_id, name, capacity)
select c.id, s.section_name, 35
from classes c
cross join (values ('A'), ('B')) as s(section_name)
where c.name in ('Grade 1', 'Grade 2', 'Grade 3', 'Grade 4')
  and not exists (
    select 1
    from sections sec
    where sec.class_id = c.id
      and sec.name = s.section_name
  );

update subjects sub
set
  code = seed.code,
  description = seed.description,
  updated_at = now()
from (
  values
    ('Mathematics', 'MATH', 'Numbers, arithmetic, and problem solving'),
    ('English', 'ENG', 'Reading, writing, and comprehension'),
    ('Science', 'SCI', 'Foundational science topics'),
    ('Social Studies', 'SOC', 'History, geography, and society'),
    ('Computer Basics', 'ICT', 'Digital literacy and computer fundamentals')
) as seed(name, code, description)
where sub.name = seed.name;

insert into subjects (name, code, description)
select seed.name, seed.code, seed.description
from (
  values
    ('Mathematics', 'MATH', 'Numbers, arithmetic, and problem solving'),
    ('English', 'ENG', 'Reading, writing, and comprehension'),
    ('Science', 'SCI', 'Foundational science topics'),
    ('Social Studies', 'SOC', 'History, geography, and society'),
    ('Computer Basics', 'ICT', 'Digital literacy and computer fundamentals')
) as seed(name, code, description)
where not exists (
  select 1
  from subjects sub
  where sub.name = seed.name
);

-- =====================================================
-- PROFILES-BASED DEMO TEACHERS
-- =====================================================

with teacher_profiles as (
  select
    p.id,
    row_number() over (order by p.created_at nulls last, p.id) as rn
  from profiles p
  where p.role = 'teacher'
    and not exists (
      select 1
      from teachers t
      where t.profile_id = p.id
    )
),
teacher_seed as (
  select
    tp.id as profile_id,
    'DEMO-TCH-' || lpad(tp.rn::text, 3, '0') as employee_code,
    case ((tp.rn - 1) % 4)
      when 0 then 'Mathematics'
      when 1 then 'Languages'
      when 2 then 'Science'
      else 'Humanities'
    end as department,
    case ((tp.rn - 1) % 4)
      when 0 then 'B.Ed Mathematics'
      when 1 then 'B.A English'
      when 2 then 'B.Sc Education'
      else 'B.A Social Studies'
    end as qualification,
    2 + tp.rn as experience_years,
    600 + (tp.rn * 25) as salary,
    current_date - ((tp.rn * 90) || ' days')::interval as joining_date
  from teacher_profiles tp
)
insert into teachers (
  profile_id,
  employee_code,
  department,
  qualification,
  experience_years,
  salary,
  joining_date,
  status
)
select
  profile_id,
  employee_code,
  department,
  qualification,
  experience_years,
  salary,
  joining_date::date,
  'active'
from teacher_seed
where not exists (
  select 1
  from teachers t
  where t.employee_code = teacher_seed.employee_code
);

-- Fallback demo teachers so the system has visible staff even before
-- auth-backed teacher profiles are created.
insert into teachers (
  profile_id,
  employee_code,
  department,
  qualification,
  experience_years,
  salary,
  joining_date,
  status
)
select
  null,
  seed.employee_code,
  seed.department,
  seed.qualification,
  seed.experience_years,
  seed.salary,
  seed.joining_date,
  'active'
from (
  values
    ('DEMO-TCH-901', 'Mathematics', 'B.Ed Mathematics', 8, 950.00::numeric(10,2), '2023-08-15'::date),
    ('DEMO-TCH-902', 'Languages', 'B.A English', 6, 900.00::numeric(10,2), '2024-01-10'::date),
    ('DEMO-TCH-903', 'Science', 'B.Sc Education', 7, 920.00::numeric(10,2), '2023-10-02'::date),
    ('DEMO-TCH-904', 'Humanities', 'B.A Social Studies', 9, 940.00::numeric(10,2), '2022-11-21'::date)
) as seed(employee_code, department, qualification, experience_years, salary, joining_date)
where not exists (
  select 1
  from teachers t
  where t.employee_code = seed.employee_code
);

-- =====================================================
-- PROFILES-BASED DEMO STUDENTS
-- =====================================================

with student_profiles as (
  select
    p.id,
    row_number() over (order by p.created_at nulls last, p.id) as rn
  from profiles p
  where p.role = 'student'
    and not exists (
      select 1
      from students s
      where s.profile_id = p.id
    )
),
grade_map as (
  select
    c.id,
    c.name,
    row_number() over (order by c.name) as rn
  from classes c
  where c.name in ('Grade 1', 'Grade 2', 'Grade 3', 'Grade 4')
),
section_map as (
  select
    s.id,
    s.class_id,
    s.name
  from sections s
),
student_seed as (
  select
    sp.id as profile_id,
    'DEMO-STU-' || lpad(sp.rn::text, 3, '0') as student_code,
    gm.id as class_id,
    (
      select sm.id
      from section_map sm
      where sm.class_id = gm.id
      order by sm.name
      limit 1
    ) as section_id,
    case when sp.rn % 2 = 0 then 'female' else 'male' end as gender,
    current_date - ((3650 + (sp.rn * 30)) || ' days')::interval as dob,
    'Phnom Penh' as address,
    'Parent ' || sp.rn as parent_name,
    '010000' || lpad(sp.rn::text, 3, '0') as parent_phone,
    current_date - ((sp.rn * 15) || ' days')::interval as admission_date
  from student_profiles sp
  join grade_map gm
    on gm.rn = ((sp.rn - 1) % 4) + 1
)
insert into students (
  profile_id,
  student_code,
  class_id,
  section_id,
  gender,
  dob,
  address,
  parent_name,
  parent_phone,
  admission_date,
  status
)
select
  profile_id,
  student_code,
  class_id,
  section_id,
  gender,
  dob::date,
  address,
  parent_name,
  parent_phone,
  admission_date::date,
  'active'
from student_seed
where not exists (
  select 1
  from students s
  where s.student_code = student_seed.student_code
);

-- Fallback demo students so lists, attendance, payments, and results
-- remain usable even when there are no auth-backed student accounts yet.
insert into students (
  profile_id,
  student_code,
  class_id,
  section_id,
  gender,
  dob,
  address,
  parent_name,
  parent_phone,
  admission_date,
  status
)
select
  null,
  seed.student_code,
  c.id,
  sec.id,
  seed.gender,
  seed.dob,
  'Phnom Penh',
  seed.parent_name,
  seed.parent_phone,
  seed.admission_date,
  'active'
from (
  values
    ('DEMO-STU-901', 'Grade 1', 'A', 'male', '2017-02-14'::date, 'Parent Sok', '011100901', '2025-09-02'::date),
    ('DEMO-STU-902', 'Grade 1', 'B', 'female', '2017-06-03'::date, 'Parent Dara', '011100902', '2025-09-02'::date),
    ('DEMO-STU-903', 'Grade 2', 'A', 'female', '2016-11-19'::date, 'Parent Lina', '011100903', '2025-09-02'::date),
    ('DEMO-STU-904', 'Grade 2', 'B', 'male', '2016-08-25'::date, 'Parent Vanna', '011100904', '2025-09-02'::date),
    ('DEMO-STU-905', 'Grade 3', 'A', 'female', '2015-04-08'::date, 'Parent Sreypov', '011100905', '2025-09-02'::date),
    ('DEMO-STU-906', 'Grade 3', 'B', 'male', '2015-12-12'::date, 'Parent Piseth', '011100906', '2025-09-02'::date),
    ('DEMO-STU-907', 'Grade 4', 'A', 'male', '2014-09-17'::date, 'Parent Chantha', '011100907', '2025-09-02'::date),
    ('DEMO-STU-908', 'Grade 4', 'B', 'female', '2014-03-29'::date, 'Parent Maly', '011100908', '2025-09-02'::date)
) as seed(student_code, class_name, section_name, gender, dob, parent_name, parent_phone, admission_date)
join classes c
  on c.name = seed.class_name
join sections sec
  on sec.class_id = c.id
 and sec.name = seed.section_name
where not exists (
  select 1
  from students s
  where s.student_code = seed.student_code
);

-- =====================================================
-- NOTICES
-- =====================================================

insert into notices (title, description, audience, priority, created_by, is_active)
select
  seed.title,
  seed.description,
  seed.audience::notice_audience,
  seed.priority,
  (select id from profiles where role = 'admin' order by created_at nulls last limit 1),
  true
from (
  values
    (
      'Welcome Back to School',
      'Classes are now active. Please check your timetable, phases, and subject schedules.',
      'all',
      'high'
    ),
    (
      'Teacher Coordination Meeting',
      'All teachers are requested to attend the weekly coordination meeting on Friday afternoon.',
      'teachers',
      'medium'
    ),
    (
      'Parent Communication Reminder',
      'Parents are encouraged to verify contact numbers and monitor attendance regularly.',
      'parents',
      'medium'
    )
) as seed(title, description, audience, priority)
where not exists (
  select 1
  from notices n
  where n.title = seed.title
);

-- =====================================================
-- EXAMS
-- =====================================================

insert into exams (
  name,
  title,
  subject_id,
  class_id,
  phase_id,
  exam_date,
  start_date,
  end_date,
  full_marks,
  total_marks,
  duration_minutes,
  description
)
select
  seed.exam_name,
  seed.exam_name,
  s.id,
  c.id,
  p.id,
  seed.exam_date,
  seed.exam_date::timestamptz,
  (seed.exam_date::timestamptz + interval '90 minutes'),
  seed.full_marks,
  seed.full_marks,
  seed.duration_minutes,
  seed.description
from (
  values
    ('Grade 1 Mathematics Final', 'Mathematics', 'Grade 1', 'Final Term', '2026-05-15'::date, 100::numeric, 90, 'Final term mathematics assessment'),
    ('Grade 2 English Final', 'English', 'Grade 2', 'Final Term', '2026-05-16'::date, 100::numeric, 75, 'Final term English assessment'),
    ('Grade 3 Science Final', 'Science', 'Grade 3', 'Final Term', '2026-05-17'::date, 100::numeric, 80, 'Final term science assessment'),
    ('Grade 4 Social Studies Final', 'Social Studies', 'Grade 4', 'Final Term', '2026-05-18'::date, 100::numeric, 70, 'Final term social studies assessment'),
    ('Grade 4 Computer Basics Practical', 'Computer Basics', 'Grade 4', 'Final Term', '2026-05-19'::date, 100::numeric, 60, 'Practical computer basics assessment'),
    ('Grade 1 English Midterm', 'English', 'Grade 1', 'Second Term', '2026-02-12'::date, 50::numeric, 45, 'Midterm English assessment'),
    ('Grade 2 Mathematics Midterm', 'Mathematics', 'Grade 2', 'Second Term', '2026-02-13'::date, 50::numeric, 60, 'Midterm mathematics assessment'),
    ('Grade 3 Science Midterm', 'Science', 'Grade 3', 'Second Term', '2026-02-14'::date, 50::numeric, 55, 'Midterm science assessment')
) as seed(exam_name, subject_name, class_name, phase_name, exam_date, full_marks, duration_minutes, description)
join subjects s on s.name = seed.subject_name
join classes c on c.name = seed.class_name
join phases p on p.name = seed.phase_name
join academic_years ay on ay.id = p.academic_year_id and ay.name = '2025-2026'
where not exists (
  select 1
  from exams e
  where e.name = seed.exam_name
);

-- =====================================================
-- TEACHER ASSIGNMENTS
-- =====================================================

insert into teacher_assignments (
  teacher_id,
  class_id,
  subject_id,
  academic_year_id,
  phase_id,
  is_active,
  assigned_by
)
select
  t.id,
  c.id,
  s.id,
  ay.id,
  p.id,
  true,
  (select id from profiles where role = 'admin' order by created_at nulls last limit 1)
from (
  values
    ('Mathematics', 'Grade 1', 'Mathematics'),
    ('English', 'Grade 1', 'Languages'),
    ('Mathematics', 'Grade 2', 'Mathematics'),
    ('English', 'Grade 2', 'Languages'),
    ('Science', 'Grade 3', 'Science'),
    ('Social Studies', 'Grade 4', 'Humanities'),
    ('Computer Basics', 'Grade 4', 'Science')
) as seed(subject_name, class_name, department_name)
join subjects s on s.name = seed.subject_name
join classes c on c.name = seed.class_name
join academic_years ay on ay.name = '2025-2026'
join phases p on p.academic_year_id = ay.id and p.name = 'Final Term'
join lateral (
  select t.id
  from teachers t
  where t.department = seed.department_name
     or t.qualification ilike '%' || seed.subject_name || '%'
  order by
    case when t.department = seed.department_name then 0 else 1 end,
    t.created_at nulls last,
    t.id
  limit 1
) t on true
where not exists (
  select 1
  from teacher_assignments ta
  where ta.teacher_id = t.id
    and ta.class_id = c.id
    and ta.subject_id = s.id
    and ta.academic_year_id = ay.id
    and ta.phase_id = p.id
);

-- =====================================================
-- ATTENDANCE
-- =====================================================

update attendance a
set
  status = seed.status,
  remarks = 'Demo attendance seed',
  marked_by = seed.marked_by,
  phase_id = seed.phase_id,
  updated_at = now()
from (
  select
    s.id as student_id,
    s.class_id,
    seed.attendance_date,
    case
      when mod(abs(('x' || substr(md5(s.id::text || seed.attendance_date::text), 1, 8))::bit(32)::int), 10) = 0 then 'absent'::attendance_status
      when mod(abs(('x' || substr(md5(s.id::text || seed.attendance_date::text), 1, 8))::bit(32)::int), 7) = 0 then 'late'::attendance_status
      else 'present'::attendance_status
    end as status,
    s.profile_id as marked_by,
    p.id as phase_id
  from students s
  join phases p on p.name = 'Final Term'
  join academic_years ay on ay.id = p.academic_year_id and ay.name = '2025-2026'
  cross join (
    values
      ('2026-05-05'::date),
      ('2026-05-06'::date),
      ('2026-05-07'::date)
  ) as seed(attendance_date)
  where s.class_id is not null
) as seed
where a.student_id = seed.student_id
  and a.attendance_date = seed.attendance_date;

insert into attendance (
  student_id,
  class_id,
  attendance_date,
  status,
  remarks,
  marked_by,
  phase_id
)
select
  s.id,
  s.class_id,
  seed.attendance_date,
  case
    when mod(abs(('x' || substr(md5(s.id::text || seed.attendance_date::text), 1, 8))::bit(32)::int), 10) = 0 then 'absent'::attendance_status
    when mod(abs(('x' || substr(md5(s.id::text || seed.attendance_date::text), 1, 8))::bit(32)::int), 7) = 0 then 'late'::attendance_status
    else 'present'::attendance_status
  end,
  'Demo attendance seed',
  s.profile_id,
  p.id
from students s
join phases p on p.name = 'Final Term'
join academic_years ay on ay.id = p.academic_year_id and ay.name = '2025-2026'
cross join (
  values
    ('2026-05-05'::date),
    ('2026-05-06'::date),
    ('2026-05-07'::date)
) as seed(attendance_date)
where s.class_id is not null
  and not exists (
    select 1
    from attendance a
    where a.student_id = s.id
      and a.attendance_date = seed.attendance_date
  );

-- =====================================================
-- FEE PAYMENTS
-- =====================================================

insert into fee_payments (
  student_id,
  amount,
  payment_date,
  payment_method,
  transaction_id,
  description,
  phase_id
)
select
  s.id,
  35 + (seed.rn * 10),
  seed.payment_date,
  case when seed.rn % 2 = 0 then 'cash'::payment_method else 'bank_transfer'::payment_method end,
  'DEMO-PAY-' || lpad(seed.rn::text, 3, '0') || '-' || replace(s.student_code, 'DEMO-STU-', ''),
  'Demo tuition payment',
  p.id
from (
  select
    st.*,
    row_number() over (order by st.updated_at nulls last, st.id) as student_rn
  from students st
) s
join phases p on p.name = 'Final Term'
join academic_years ay on ay.id = p.academic_year_id and ay.name = '2025-2026'
join (
  values
    (1, '2026-04-10'::date),
    (2, '2026-05-10'::date)
) as seed(rn, payment_date) on true
where s.student_rn <= 5
  and not exists (
    select 1
    from fee_payments fp
    where fp.transaction_id = 'DEMO-PAY-' || lpad(seed.rn::text, 3, '0') || '-' || replace(s.student_code, 'DEMO-STU-', '')
  );

-- =====================================================
-- EXAM RESULTS
-- =====================================================

insert into exam_results (
  student_id,
  exam_id,
  class_id,
  subject_id,
  marks_obtained,
  full_marks,
  remarks,
  phase_id
)
select
  s.id,
  e.id,
  e.class_id,
  e.subject_id,
  case
    when c.name = 'Grade 1' then 88
    when c.name = 'Grade 2' then 79
    else 92
  end,
  coalesce(e.full_marks, e.total_marks, 100),
  'Demo seeded result',
  e.phase_id
from students s
join classes c on c.id = s.class_id
join exams e on e.class_id = c.id
where not exists (
  select 1
  from exam_results er
  where er.student_id = s.id
    and er.exam_id = e.id
);

commit;

-- =====================================================
-- QUICK CHECKS
-- =====================================================
-- select * from academic_years order by start_date desc;
-- select * from phases order by academic_year_id, sequence_number;
-- select * from classes order by name;
-- select * from subjects order by name;
-- select * from students order by created_at desc;
-- select * from teachers order by created_at desc;
-- select * from exams order by exam_date desc nulls last;
-- select * from exam_results order by created_at desc;
