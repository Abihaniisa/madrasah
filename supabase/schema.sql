create extension if not exists "uuid-ossp";

create table if not exists authorized_users (
  email text primary key,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  reg_no text unique not null,
  name text not null,
  section text not null,
  class_name text not null,
  mode text not null default 'physical' check (mode in ('online','physical')),
  status text not null default 'active' check (status in ('active','repeating','withdrawn','transferred')),
  joined date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists students_class_idx on students (class_name);
create index if not exists students_section_idx on students (section);
create index if not exists students_name_idx on students (lower(name));

create table if not exists assessments (
  id uuid primary key default uuid_generate_v4(),
  class_name text not null,
  subject text not null,
  label text not null,
  max_marks int not null default 10,
  session_label text not null default '2025/2026',
  semester int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists assessments_class_subject_idx on assessments (class_name, subject);

create table if not exists marks (
  id uuid primary key default uuid_generate_v4(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  value int,
  updated_at timestamptz not null default now(),
  unique (assessment_id, student_id)
);
create index if not exists marks_student_idx on marks (student_id);

create table if not exists exams (
  id uuid primary key default uuid_generate_v4(),
  class_name text not null,
  subject text not null,
  student_id uuid not null references students(id) on delete cascade,
  session_label text not null default '2025/2026',
  semester int not null default 1,
  value int,
  updated_at timestamptz not null default now(),
  unique (student_id, subject, session_label, semester)
);
create index if not exists exams_student_idx on exams (student_id);

create table if not exists fees (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  year text not null,
  amount int not null default 5000,
  paid int not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid','partial','paid','scholarship')),
  updated_at timestamptz not null default now(),
  unique (student_id, year)
);
create index if not exists fees_student_idx on fees (student_id);

create table if not exists materials (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  class_name text not null default 'all',
  subject text not null default 'general',
  note text,
  order_num int,
  kind text not null check (kind in ('file','link')),
  url text,
  storage_path text,
  file_name text,
  file_size bigint,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists materials_class_idx on materials (class_name);
create index if not exists materials_order_idx on materials (order_num);

create table if not exists curriculum (
  id uuid primary key default uuid_generate_v4(),
  class_name text not null,
  semester int not null,
  week_num int not null,
  subject text not null,
  content text,
  created_at timestamptz not null default now(),
  unique (class_name, semester, week_num, subject)
);
create index if not exists curriculum_lookup_idx on curriculum (class_name, semester, week_num);

alter table authorized_users enable row level security;
alter table students enable row level security;
alter table assessments enable row level security;
alter table marks enable row level security;
alter table exams enable row level security;
alter table fees enable row level security;
alter table materials enable row level security;
alter table curriculum enable row level security;

create or replace function is_authorized()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from authorized_users
    where email = (auth.jwt() ->> 'email')
  );
$$;

drop policy if exists "authorized read allowlist" on authorized_users;
create policy "authorized read allowlist" on authorized_users for select using (is_authorized());

drop policy if exists "authorized all students" on students;
create policy "authorized all students" on students for all using (is_authorized()) with check (is_authorized());

drop policy if exists "authorized all assessments" on assessments;
create policy "authorized all assessments" on assessments for all using (is_authorized()) with check (is_authorized());

drop policy if exists "authorized all marks" on marks;
create policy "authorized all marks" on marks for all using (is_authorized()) with check (is_authorized());

drop policy if exists "authorized all exams" on exams;
create policy "authorized all exams" on exams for all using (is_authorized()) with check (is_authorized());

drop policy if exists "authorized all fees" on fees;
create policy "authorized all fees" on fees for all using (is_authorized()) with check (is_authorized());

drop policy if exists "public read published materials" on materials;
create policy "public read published materials" on materials for select using (published = true or is_authorized());
drop policy if exists "authorized write materials" on materials;
create policy "authorized write materials" on materials for insert with check (is_authorized());
drop policy if exists "authorized update materials" on materials;
create policy "authorized update materials" on materials for update using (is_authorized());
drop policy if exists "authorized delete materials" on materials;
create policy "authorized delete materials" on materials for delete using (is_authorized());

drop policy if exists "public read curriculum" on curriculum;
create policy "public read curriculum" on curriculum for select using (true);
drop policy if exists "authorized write curriculum" on curriculum;
create policy "authorized write curriculum" on curriculum for all using (is_authorized()) with check (is_authorized());

insert into authorized_users (email, role) values ('abihaniisa@gmail.com', 'admin')
on conflict (email) do nothing;

insert into students (reg_no, name, section, class_name, mode, joined)
values ('2026-MS-0001', 'Abihani Isa', 'secondary', 'Thanawiyyah 1', 'online', current_date)
on conflict (reg_no) do nothing;

-- ============================================================
-- ENROLLMENTS (added later — promotion history)
-- ============================================================
create table if not exists enrollments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  class_name text not null,
  session_label text not null,
  status text not null check (status in ('active','repeating','withdrawn','transferred','graduated')),
  started date not null default current_date,
  ended date,
  created_at timestamptz not null default now()
);
create index if not exists enrollments_student_idx on enrollments (student_id);
create index if not exists enrollments_session_idx on enrollments (session_label);

alter table enrollments enable row level security;

drop policy if exists "authorized all enrollments" on enrollments;
create policy "authorized all enrollments" on enrollments
  for all using (is_authorized()) with check (is_authorized());

alter table students drop constraint if exists students_status_check;
alter table students add constraint students_status_check
  check (status in ('active','repeating','withdrawn','transferred','graduated'));
