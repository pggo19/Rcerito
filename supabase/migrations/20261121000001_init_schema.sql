-- Rcerito: esquema inicial (proyecto independiente de R0)
create table public.exams (
  code text primary key check (code in ('ENAM','ESSALUD','SERUMS')),
  name text not null,
  building text not null,
  sort smallint not null
);

create table public.questions (
  id text primary key,
  exam text not null references public.exams(code),
  area text not null,
  tema text not null,
  dificultad smallint not null check (dificultad between 1 and 3),
  tipo text not null check (tipo in ('caso_clinico','directa')),
  enunciado text not null,
  opciones jsonb not null,
  correcta text not null check (correcta ~ '^[A-E]$'),
  explicacion text not null,
  por_que_no jsonb not null default '{}'::jsonb,
  fuente jsonb not null default '{}'::jsonb,
  estado text not null default 'borrador' check (estado in ('borrador','validada_ia','revisada_medico','descartada')),
  created_at timestamptz not null default now()
);
create index questions_exam_area_idx on public.questions (exam, area) where estado in ('validada_ia','revisada_medico');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  xp integer not null default 0,
  gems integer not null default 0,
  streak integer not null default 0,
  last_study_date date,
  is_pro boolean not null default false,
  pro_until timestamptz,
  created_at timestamptz not null default now()
);

create table public.answers (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id),
  chosen text not null,
  is_correct boolean not null,
  mode text not null check (mode in ('leccion','banco','simulacro','duelo')),
  created_at timestamptz not null default now()
);
create index answers_user_idx on public.answers (user_id, created_at desc);

create table public.question_reports (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  question_id text not null references public.questions(id),
  motivo text not null,
  created_at timestamptz not null default now()
);

alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.profiles enable row level security;
alter table public.answers enable row level security;
alter table public.question_reports enable row level security;

create policy "exams legibles" on public.exams for select to anon, authenticated using (true);
create policy "preguntas publicadas legibles" on public.questions for select to anon, authenticated
  using (estado in ('validada_ia','revisada_medico'));
create policy "perfil propio: leer" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "perfil propio: crear" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfil propio: editar" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "respuestas propias: leer" on public.answers for select to authenticated using ((select auth.uid()) = user_id);
create policy "respuestas propias: crear" on public.answers for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reportar pregunta" on public.question_reports for insert to authenticated with check ((select auth.uid()) = user_id);

insert into public.exams (code, name, building, sort) values
  ('ESSALUD','Internado EsSalud','Hospital Docente',1),
  ('ENAM','ENAM','Aula Magna',2),
  ('SERUMS','Evaluación SERUMS (ENCAPS)','Posta Rural',3);
