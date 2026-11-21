-- =====================================================================
-- Rcerito · Migración 1: Pro / gratis, seguridad y respuestas en servidor
-- =====================================================================
-- Principio: el cliente (APK) nunca decide si alguien es Pro, cuántas
-- gemas tiene ni si acertó. Todo eso lo decide la base de datos.

-- ---------------------------------------------------------------------
-- 0. Esquema privado y limpieza de permisos heredados
-- ---------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;   -- para evaluar políticas; el esquema no está expuesto por la API

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke delete on public.profiles from anon, authenticated;
revoke select on public.profiles from anon;

-- ---------------------------------------------------------------------
-- 1. Configuración editable sin tocar la app
-- ---------------------------------------------------------------------
create table public.app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
create policy "config legible" on public.app_config for select to anon, authenticated using (true);
revoke insert, update, delete on public.app_config from anon, authenticated;

insert into public.app_config (key, value) values
  ('lecciones_gratis_por_sala', '2'),
  ('tamano_leccion',            '10'),
  ('simulacro_express_gratis_por_semana', '1'),
  ('tope_gemas_diario',         '400'),
  ('max_protectores_racha',     '2'),
  ('max_pases_simulacro',       '3'),
  ('nota_aprobatoria',          '{"ESSALUD": 13, "ENAM": 11, "SERUMS": 13}'),
  ('simulacro_oficial',         '{"ESSALUD": {"preguntas": 100, "minutos": 100},
                                  "ENAM":    {"preguntas": 180, "minutos": 180},
                                  "SERUMS":  {"preguntas": 100, "minutos": 120}}'),
  ('recompensas',               '{"leccion": 10, "leccion_perfecta": 15, "racha_3": 20, "racha_7": 50,
                                  "racha_14": 100, "racha_30": 250, "subir_nivel": 25, "medalla": 100}');

create function private.cfg(k text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select value from public.app_config where key = k
$$;
revoke execute on function private.cfg(text) from public;

-- ---------------------------------------------------------------------
-- 2. Suscripción Pro: solo la escribe el servidor (webhook RevenueCat)
-- ---------------------------------------------------------------------
create table public.user_entitlements (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  entitlement      text not null default 'pro' check (entitlement = 'pro'),
  activo           boolean not null default false,
  expires_at       timestamptz,
  product_id       text,
  store            text,
  origen           text not null check (origen in ('revenuecat', 'manual', 'promo')),
  ultimo_evento    text,
  ultimo_evento_ms bigint,
  updated_at       timestamptz not null default now()
);
alter table public.user_entitlements enable row level security;
create policy "suscripcion propia: leer" on public.user_entitlements
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.user_entitlements from anon, authenticated;

create function private.tiene_pro(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select uid is not null and exists (
    select 1 from public.user_entitlements e
    where e.user_id = uid and e.activo
      and (e.expires_at is null or e.expires_at > now())
  )
$$;
revoke execute on function private.tiene_pro(uuid) from public;
grant execute on function private.tiene_pro(uuid) to anon, authenticated;

-- profiles: el cliente solo puede tocar su nombre visible
revoke insert, update on public.profiles from authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name)     on public.profiles to authenticated;

alter table public.profiles
  add column nivel             integer  not null default 1,
  add column racha_max         integer  not null default 0,
  add column protectores_racha smallint not null default 0,
  add column pases_simulacro   smallint not null default 0,
  add column objetivo          text references public.exams (code),
  add column uku_etapa         smallint not null default 1 check (uku_etapa between 1 and 4);

-- is_pro / pro_until en profiles quedan como espejo de solo lectura
create function private.sync_pro() returns trigger
language plpgsql security definer set search_path = '' as $$
declare uid uuid := coalesce(new.user_id, old.user_id);
begin
  update public.profiles p
     set is_pro    = private.tiene_pro(uid),
         pro_until = (select e.expires_at from public.user_entitlements e where e.user_id = uid)
   where p.id = uid;
  return null;
end $$;
revoke execute on function private.sync_pro() from public;
create trigger tr_sync_pro after insert or update or delete on public.user_entitlements
  for each row execute function private.sync_pro();

create function public.mi_estado_pro() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'pro',        private.tiene_pro((select auth.uid())),
    'expira',     (select e.expires_at from public.user_entitlements e where e.user_id = (select auth.uid())),
    'cancelada',  coalesce((select e.ultimo_evento = 'CANCELLATION' from public.user_entitlements e
                            where e.user_id = (select auth.uid())), false)
  )
$$;
revoke execute on function public.mi_estado_pro() from public, anon;
grant execute on function public.mi_estado_pro() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Preguntas: lecciones, contenido gratis y desbloqueos temporales
-- ---------------------------------------------------------------------
alter table public.questions
  add column updated_at timestamptz not null default now(),
  add column leccion    integer,
  add column gratis     boolean not null default false;

create function private.questions_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
revoke execute on function private.questions_touch() from public;
create trigger tr_questions_touch before update on public.questions
  for each row when (old is distinct from new) execute function private.questions_touch();

-- Parte cada sala (examen + área) en lecciones de 10, de menor a mayor
-- dificultad, y marca como gratis las primeras N lecciones.
create function private.recalcular_lecciones() returns void
language plpgsql security definer set search_path = '' as $$
declare
  tam   integer := coalesce((private.cfg('tamano_leccion'))::int, 10);
  libre integer := coalesce((private.cfg('lecciones_gratis_por_sala'))::int, 2);
begin
  with r as (
    select id,
           ceil(row_number() over (partition by exam, area order by dificultad, id) / tam::numeric)::int as lec
      from public.questions
     where estado in ('validada_ia', 'revisada_medico')
  )
  update public.questions q
     set leccion = r.lec, gratis = (r.lec <= libre)
    from r
   where q.id = r.id
     and (q.leccion is distinct from r.lec or q.gratis is distinct from (r.lec <= libre));

  update public.questions
     set leccion = null, gratis = false
   where estado not in ('validada_ia', 'revisada_medico')
     and (leccion is not null or gratis);
end $$;
revoke execute on function private.recalcular_lecciones() from public;

create function private.tr_recalcular_lecciones() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if pg_trigger_depth() = 1 then perform private.recalcular_lecciones(); end if;
  return null;
end $$;
revoke execute on function private.tr_recalcular_lecciones() from public;

create trigger tr_questions_lecciones_ins after insert on public.questions
  for each statement execute function private.tr_recalcular_lecciones();
create trigger tr_questions_lecciones_upd after update of estado, exam, area, dificultad on public.questions
  for each statement execute function private.tr_recalcular_lecciones();
create trigger tr_questions_lecciones_del after delete on public.questions
  for each statement execute function private.tr_recalcular_lecciones();

-- Si cambia el número de lecciones gratis en app_config, recalcular
create function private.tr_config_lecciones() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.key in ('lecciones_gratis_por_sala', 'tamano_leccion') then perform private.recalcular_lecciones(); end if;
  return null;
end $$;
revoke execute on function private.tr_config_lecciones() from public;
create trigger tr_config_lecciones after insert or update on public.app_config
  for each row execute function private.tr_config_lecciones();

-- Desbloqueo temporal de una sala (comprado con gemas)
create table public.user_unlocks (
  user_id    uuid not null references auth.users (id) on delete cascade,
  exam       text not null references public.exams (code),
  area       text not null,
  expires_at timestamptz not null,
  primary key (user_id, exam, area)
);
alter table public.user_unlocks enable row level security;
create policy "desbloqueos propios: leer" on public.user_unlocks
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.user_unlocks from anon, authenticated;

create function private.puede_ver(p_exam text, p_area text, p_gratis boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_gratis
      or private.tiene_pro((select auth.uid()))
      or exists (select 1 from public.user_unlocks u
                  where u.user_id = (select auth.uid())
                    and u.exam = p_exam and u.area = p_area and u.expires_at > now())
$$;
revoke execute on function private.puede_ver(text, text, boolean) from public;
grant execute on function private.puede_ver(text, text, boolean) to anon, authenticated;

alter policy "preguntas publicadas legibles" on public.questions rename to "preguntas segun plan";
alter policy "preguntas segun plan" on public.questions to anon, authenticated
  using (
    estado in ('validada_ia', 'revisada_medico')
    and (
      gratis
      or (select private.tiene_pro((select auth.uid())))
      or exists (select 1 from public.user_unlocks u
                  where u.user_id = (select auth.uid())
                    and u.exam = questions.exam and u.area = questions.area
                    and u.expires_at > now())
    )
  );

create index questions_sala_idx on public.questions (exam, area, leccion)
  where estado in ('validada_ia', 'revisada_medico');
create index questions_updated_idx on public.questions (updated_at);

-- Mapa del campus: cuántas lecciones tiene cada sala y cuáles están
-- abiertas para este usuario, sin revelar el contenido de las bloqueadas.
create function public.resumen_salas(p_exam text default null)
returns table (exam text, area text, preguntas integer, lecciones integer,
               lecciones_gratis integer, abierta_completa boolean, desbloqueada_hasta timestamptz)
language sql stable security definer set search_path = '' as $$
  select q.exam, q.area,
         count(*)::int,
         max(q.leccion)::int,
         count(distinct q.leccion) filter (where q.gratis)::int,
         private.tiene_pro((select auth.uid()))
           or bool_or(u.expires_at > now()) is true,
         max(u.expires_at) filter (where u.expires_at > now())
    from public.questions q
    left join public.user_unlocks u
           on u.user_id = (select auth.uid()) and u.exam = q.exam and u.area = q.area
   where q.estado in ('validada_ia', 'revisada_medico')
     and (p_exam is null or q.exam = p_exam)
   group by q.exam, q.area
   order by q.exam, q.area
$$;
revoke execute on function public.resumen_salas(text) from public;
grant execute on function public.resumen_salas(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Respuestas corregidas en el servidor + repaso espaciado (Leitner)
-- ---------------------------------------------------------------------
-- La política de inserción queda sin efecto: el rol ya no tiene permiso INSERT.
alter policy "respuestas propias: crear" on public.answers with check (false);
revoke insert, update, delete on public.answers from authenticated;

alter table public.answers
  add column client_id   uuid,
  add column answered_at timestamptz;
create unique index answers_client_uidx on public.answers (user_id, client_id) where client_id is not null;
create index answers_question_idx on public.answers (question_id);

create table public.user_question_progress (
  user_id         uuid not null references auth.users (id) on delete cascade,
  question_id     text not null references public.questions (id) on delete cascade,
  intentos        integer not null default 0,
  aciertos        integer not null default 0,
  racha_aciertos  smallint not null default 0,
  caja            smallint not null default 1 check (caja between 1 and 5),
  ultima_vez      timestamptz not null default now(),
  proximo_repaso  timestamptz not null default now(),
  primer_acierto  timestamptz,
  primary key (user_id, question_id)
);
alter table public.user_question_progress enable row level security;
create policy "progreso propio: leer" on public.user_question_progress
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.user_question_progress from anon, authenticated;
create index uqp_repaso_idx on public.user_question_progress (user_id, proximo_repaso);
create index uqp_question_idx on public.user_question_progress (question_id);

-- Uso interno: guarda una respuesta y mueve la tarjeta de caja.
-- Caja 1 → repasa en 1 día, 2 → 3 días, 3 → 7, 4 → 14, 5 → 30.
create function private.guardar_respuesta(uid uuid, p_qid text, p_elegida text, p_modo text,
                                          p_client_id uuid, p_answered_at timestamptz)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  ok   boolean;
  dias integer[] := array[1, 3, 7, 14, 30];
  nueva_caja smallint;
begin
  select (q.correcta = p_elegida) into ok from public.questions q where q.id = p_qid;
  if ok is null then return null; end if;

  insert into public.answers (user_id, question_id, chosen, is_correct, mode, client_id, answered_at)
  values (uid, p_qid, p_elegida, ok, p_modo, p_client_id, coalesce(p_answered_at, now()))
  on conflict (user_id, client_id) where client_id is not null do nothing;
  if not found then return ok; end if;   -- ya registrada (reintento offline)

  insert into public.user_question_progress as p
         (user_id, question_id, intentos, aciertos, racha_aciertos, caja, ultima_vez, proximo_repaso, primer_acierto)
  values (uid, p_qid, 1, ok::int, ok::int, case when ok then 2 else 1 end, now(),
          now() + make_interval(days => case when ok then 3 else 1 end),
          case when ok then now() end)
  on conflict (user_id, question_id) do update set
    intentos       = p.intentos + 1,
    aciertos       = p.aciertos + ok::int,
    racha_aciertos = case when ok then p.racha_aciertos + 1 else 0 end,
    caja           = case when ok then least(p.caja + 1, 5) else 1 end,
    ultima_vez     = now(),
    proximo_repaso = now() + make_interval(days => dias[case when ok then least(p.caja + 1, 5) else 1 end]),
    primer_acierto = coalesce(p.primer_acierto, case when ok then now() end);
  return ok;
end $$;
revoke execute on function private.guardar_respuesta(uuid, text, text, text, uuid, timestamptz) from public;

-- RPC: la app manda un lote de respuestas (sirve para la cola offline).
-- p: [{"client_id": uuid, "question_id": "...", "elegida": "A", "modo": "leccion", "answered_at": "..."}]
create function public.registrar_respuestas(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  r   jsonb;
  q   record;
  ok  boolean;
  salida jsonb := '[]'::jsonb;
begin
  if uid is null then raise exception 'no_autenticado'; end if;
  if jsonb_typeof(p) <> 'array' or jsonb_array_length(p) > 200 then raise exception 'lote_invalido'; end if;

  for r in select * from jsonb_array_elements(p) loop
    if coalesce(r->>'modo', '') not in ('leccion', 'banco', 'duelo') then continue; end if;
    if coalesce(r->>'elegida', '') not in ('A', 'B', 'C', 'D') then continue; end if;

    select qq.id, qq.exam, qq.area, qq.gratis, qq.correcta into q
      from public.questions qq
     where qq.id = r->>'question_id' and qq.estado in ('validada_ia', 'revisada_medico');
    if not found or not private.puede_ver(q.exam, q.area, q.gratis) then continue; end if;

    ok := private.guardar_respuesta(uid, q.id, r->>'elegida', r->>'modo',
                                    nullif(r->>'client_id', '')::uuid,
                                    least(nullif(r->>'answered_at', '')::timestamptz, now()));
    salida := salida || jsonb_build_object('question_id', q.id, 'correcta', q.correcta, 'acerto', ok);
  end loop;
  return salida;
end $$;
revoke execute on function public.registrar_respuestas(jsonb) from public, anon;
grant execute on function public.registrar_respuestas(jsonb) to authenticated;

-- RPC: preguntas para repasar hoy (solo las que el usuario puede ver)
create function public.repaso_pendiente(p_exam text default null, p_limite integer default 20)
returns setof public.questions
language sql stable security invoker set search_path = '' as $$
  select q.*
    from public.user_question_progress p
    join public.questions q on q.id = p.question_id
   where p.user_id = (select auth.uid())
     and p.proximo_repaso <= now()
     and (p_exam is null or q.exam = p_exam)
   order by p.caja, p.proximo_repaso
   limit least(greatest(p_limite, 1), 100)
$$;
revoke execute on function public.repaso_pendiente(text, integer) from public, anon;
grant execute on function public.repaso_pendiente(text, integer) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Reportes de preguntas: uno por usuario y pregunta, texto acotado
-- ---------------------------------------------------------------------
alter table public.question_reports
  add constraint question_reports_motivo_len check (char_length(motivo) between 3 and 1000);
create unique index question_reports_unico on public.question_reports (user_id, question_id);

-- Calcular lecciones del banco actual
select private.recalcular_lecciones();
