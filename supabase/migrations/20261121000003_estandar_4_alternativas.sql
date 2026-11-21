-- Estándar de preguntas: 4 alternativas (A-D), una sola correcta, subárea obligatoria.
alter table public.questions add column if not exists subarea text;

create or replace function public.option_count(o jsonb)
returns integer
language sql
immutable
set search_path = ''
as $$ select count(*)::integer from jsonb_object_keys(o) $$;

alter table public.questions drop constraint if exists questions_correcta_check;
alter table public.questions add constraint questions_correcta_check check (correcta in ('A','B','C','D'));
alter table public.questions add constraint questions_opciones_4 check (
  jsonb_typeof(opciones) = 'object'
  and opciones ?& array['A','B','C','D']
  and public.option_count(opciones) = 4
);
alter table public.questions add constraint questions_por_que_no_3 check (
  jsonb_typeof(por_que_no) = 'object' and public.option_count(por_que_no) = 3 and not (por_que_no ? correcta)
);
create index if not exists questions_exam_area_sub_idx on public.questions (exam, area, subarea);
alter table public.questions alter column subarea set not null;
