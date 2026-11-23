-- =====================================================================
-- Rcerito · Migración 2: gemas, racha, XP, tienda, avatar, Uku y simulacros
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Libro de gemas (cada movimiento queda registrado)
-- ---------------------------------------------------------------------
create table public.gems_transactions (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  cantidad       integer not null check (cantidad <> 0),
  motivo         text not null,
  ref            text,
  saldo_despues  integer not null,
  created_at     timestamptz not null default now()
);
alter table public.gems_transactions enable row level security;
create policy "gemas propias: leer" on public.gems_transactions
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.gems_transactions from anon, authenticated;
create index gems_tx_user_idx on public.gems_transactions (user_id, created_at desc);
create unique index gems_tx_ref_uidx on public.gems_transactions (user_id, motivo, ref) where ref is not null;

create function private.hoy_lima() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'America/Lima')::date $$;
revoke execute on function private.hoy_lima() from public;

-- Mueve gemas. Ganancias: respetan el tope diario y no se repiten si ya
-- existe (motivo, ref). Gastos: fallan si no alcanza el saldo.
-- Devuelve la cantidad realmente movida (0 si ya se había reclamado).
create function private.mover_gemas(uid uuid, p_cantidad integer, p_motivo text, p_ref text)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  saldo  integer;
  ganado integer;
  tope   integer := coalesce((private.cfg('tope_gemas_diario'))::int, 400);
  monto  integer := p_cantidad;
begin
  select gems into saldo from public.profiles where id = uid for update;
  if saldo is null then raise exception 'perfil_no_existe'; end if;

  if p_ref is not null and exists (select 1 from public.gems_transactions t
                                    where t.user_id = uid and t.motivo = p_motivo and t.ref = p_ref) then
    return 0;
  end if;

  if monto > 0 then
    select coalesce(sum(t.cantidad), 0) into ganado
      from public.gems_transactions t
     where t.user_id = uid and t.cantidad > 0 and t.motivo <> 'ajuste'
       and t.created_at >= (private.hoy_lima()::timestamp at time zone 'America/Lima');
    monto := least(monto, greatest(tope - ganado, 0));
    if monto = 0 then return 0; end if;
  elsif saldo + monto < 0 then
    raise exception 'gemas_insuficientes';
  end if;

  update public.profiles set gems = gems + monto where id = uid;
  insert into public.gems_transactions (user_id, cantidad, motivo, ref, saldo_despues)
  values (uid, monto, p_motivo, p_ref, saldo + monto);
  return monto;
end $$;
revoke execute on function private.mover_gemas(uuid, integer, text, text) from public;

create function private.premio(k text) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce((private.cfg('recompensas') ->> k)::int, 0)
$$;
revoke execute on function private.premio(text) from public;

-- ---------------------------------------------------------------------
-- 2. Logros e inventario
-- ---------------------------------------------------------------------
create table public.shop_items (
  id           text primary key check (id ~ '^[a-z0-9_]+$'),
  nombre       text not null,
  descripcion  text not null default '',
  categoria    text not null check (categoria in ('consumible', 'cosmetico')),
  tipo         text check (tipo in ('recarga_vidas', 'protector_racha', 'pase_simulacro', 'desbloqueo_sala')),
  slot         text check (slot in ('cabeza', 'cara', 'cuello', 'cuerpo', 'mano', 'espalda', 'fondo', 'insignia')),
  para         text check (para in ('avatar', 'uku', 'ambos')),
  precio_gemas integer check (precio_gemas >= 0),   -- 0 = básico para todos · null = solo se gana con un logro
  solo_pro     boolean not null default false,
  logro        text,
  rareza       text not null default 'comun' check (rareza in ('comun', 'raro', 'epico', 'legendario')),
  activo       boolean not null default true,
  orden        integer not null default 100,
  sprite       text,
  constraint shop_items_forma check (
    (categoria = 'consumible' and tipo is not null and slot is null and precio_gemas > 0)
    or (categoria = 'cosmetico' and tipo is null and slot is not null and para is not null
        and (precio_gemas is not null or logro is not null))
  )
);
alter table public.shop_items enable row level security;
create policy "tienda legible" on public.shop_items for select to anon, authenticated using (activo);
revoke insert, update, delete on public.shop_items from anon, authenticated;

create table public.user_inventory (
  user_id     uuid not null references auth.users (id) on delete cascade,
  item_id     text not null references public.shop_items (id),
  origen      text not null check (origen in ('compra', 'logro', 'regalo')),
  obtenido_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.user_inventory enable row level security;
create policy "inventario propio: leer" on public.user_inventory
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.user_inventory from anon, authenticated;
create index user_inventory_item_idx on public.user_inventory (item_id);

create table public.user_logros (
  user_id     uuid not null references auth.users (id) on delete cascade,
  logro       text not null,
  obtenido_at timestamptz not null default now(),
  primary key (user_id, logro)
);
alter table public.user_logros enable row level security;
create policy "logros propios: leer" on public.user_logros
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.user_logros from anon, authenticated;

-- Otorga un logro una sola vez y entrega los ítems ligados a él.
-- Logros: medalla:<EXAM>, aprobado:<EXAM>, racha:30, etapa:<N>
create function private.otorgar_logro(uid uuid, p_logro text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_logros (user_id, logro) values (uid, p_logro) on conflict do nothing;
  if not found then return false; end if;
  insert into public.user_inventory (user_id, item_id, origen)
  select uid, i.id, 'logro' from public.shop_items i where i.logro = p_logro
  on conflict do nothing;
  return true;
end $$;
revoke execute on function private.otorgar_logro(uuid, text) from public;

-- ---------------------------------------------------------------------
-- 3. Uku: etapa inicial según objetivo y evoluciones
-- ---------------------------------------------------------------------
-- 1 Uku Estudiante (objetivo: internado EsSalud)
-- 2 Uku Interno    (aprobó EsSalud, o empieza aquí si su objetivo es ENAM)
-- 3 Uku Médico     (aprobó ENAM, o empieza aquí si su objetivo es SERUMS)
-- 4 Uku Serumista  (aprobó SERUMS)
create function private.evolucionar_uku(uid uuid, p_etapa smallint) returns smallint
language plpgsql security definer set search_path = '' as $$
declare actual smallint;
begin
  update public.profiles set uku_etapa = greatest(uku_etapa, p_etapa)
   where id = uid returning uku_etapa into actual;
  perform private.otorgar_logro(uid, 'etapa:' || actual);
  return actual;
end $$;
revoke execute on function private.evolucionar_uku(uuid, smallint) from public;

create function public.elegir_objetivo(p_exam text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); etapa smallint;
begin
  if uid is null then raise exception 'no_autenticado'; end if;
  if p_exam not in ('ESSALUD', 'ENAM', 'SERUMS') then raise exception 'examen_invalido'; end if;
  update public.profiles set objetivo = p_exam where id = uid;
  etapa := private.evolucionar_uku(uid, case p_exam when 'ESSALUD' then 1 when 'ENAM' then 2 else 3 end::smallint);
  return jsonb_build_object('objetivo', p_exam, 'uku_etapa', etapa);
end $$;
revoke execute on function public.elegir_objetivo(text) from public, anon;
grant execute on function public.elegir_objetivo(text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Racha diaria (hora de Lima) con protector
-- ---------------------------------------------------------------------
create function private.registrar_estudio(uid uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  p        record;
  hoy      date := private.hoy_lima();
  racha    integer;
  uso_prot boolean := false;
  hito     integer;
  inicio   date;
  ganadas  integer := 0;
begin
  select streak, last_study_date, protectores_racha into p from public.profiles where id = uid for update;

  if p.last_study_date = hoy then
    return jsonb_build_object('racha', p.streak, 'protector_usado', false, 'gemas', 0);
  elsif p.last_study_date = hoy - 1 then
    racha := p.streak + 1;
  elsif p.last_study_date = hoy - 2 and p.protectores_racha > 0 then
    racha := p.streak + 1; uso_prot := true;
  else
    racha := 1;
  end if;

  update public.profiles
     set streak = racha, last_study_date = hoy, racha_max = greatest(racha_max, racha),
         protectores_racha = protectores_racha - uso_prot::int
   where id = uid;

  inicio := hoy - racha + 1;
  foreach hito in array array[3, 7, 14, 30] loop
    if racha >= hito then
      ganadas := ganadas + private.mover_gemas(uid, private.premio('racha_' || hito), 'racha_' || hito, inicio::text);
    end if;
  end loop;
  if racha >= 30 then perform private.otorgar_logro(uid, 'racha:30'); end if;

  return jsonb_build_object('racha', racha, 'protector_usado', uso_prot, 'gemas', ganadas);
end $$;
revoke execute on function private.registrar_estudio(uuid) from public;

-- XP y nivel: nivel = floor(sqrt(xp / 100)) + 1  (100 XP → nivel 2, 400 → 3, 900 → 4 …)
create function private.sumar_xp(uid uuid, p_xp integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare nuevo_xp integer; antes integer; despues integer; n integer; ganadas integer := 0;
begin
  update public.profiles set xp = xp + greatest(p_xp, 0) where id = uid
  returning xp, nivel into nuevo_xp, antes;
  despues := floor(sqrt(nuevo_xp / 100.0))::int + 1;
  if despues > antes then
    update public.profiles set nivel = despues where id = uid;
    for n in antes + 1 .. despues loop
      ganadas := ganadas + private.mover_gemas(uid, private.premio('subir_nivel'), 'subir_nivel', n::text);
    end loop;
  end if;
  return jsonb_build_object('xp', nuevo_xp, 'nivel', greatest(antes, despues), 'subio', despues > antes, 'gemas', ganadas);
end $$;
revoke execute on function private.sumar_xp(uuid, integer) from public;

-- Medalla de edificio: 80 % de cada sala acertada al menos una vez
create function private.revisar_medalla(uid uuid, p_exam text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare falta boolean;
begin
  if exists (select 1 from public.user_logros where user_id = uid and logro = 'medalla:' || p_exam) then
    return false;
  end if;
  select bool_or(dominio < 0.8) into falta
    from (select q.area,
                 count(p.primer_acierto)::numeric / count(*) as dominio
            from public.questions q
            left join public.user_question_progress p on p.question_id = q.id and p.user_id = uid
           where q.exam = p_exam and q.estado in ('validada_ia', 'revisada_medico')
           group by q.area) s;
  if falta is distinct from false then return false; end if;   -- null = examen sin preguntas
  perform private.otorgar_logro(uid, 'medalla:' || p_exam);
  perform private.mover_gemas(uid, private.premio('medalla'), 'medalla', p_exam);
  perform private.evolucionar_uku(uid, case p_exam when 'ESSALUD' then 2 when 'ENAM' then 3 else 4 end::smallint);
  return true;
end $$;
revoke execute on function private.revisar_medalla(uuid, text) from public;

-- ---------------------------------------------------------------------
-- 5. RPC: terminar una lección (el servidor cuenta los aciertos)
-- ---------------------------------------------------------------------
-- La app primero envía las respuestas con registrar_respuestas y luego
-- llama a esto. Se premia cada lección una vez por día.
create function public.completar_leccion(p_exam text, p_area text, p_leccion integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid      uuid := (select auth.uid());
  tam      integer;
  resp     integer;
  bien     integer;
  gemas    integer := 0;
  v_ref    text;
  racha    jsonb;
  xp       jsonb;
  medalla  boolean;
  nueva    boolean;
begin
  if uid is null then raise exception 'no_autenticado'; end if;

  select count(*) into tam from public.questions q
   where q.exam = p_exam and q.area = p_area and q.leccion = p_leccion
     and q.estado in ('validada_ia', 'revisada_medico');
  if tam = 0 then raise exception 'leccion_no_existe'; end if;

  -- última respuesta de cada pregunta de la lección en las últimas 3 horas
  select count(*), count(*) filter (where x.is_correct) into resp, bien
    from (select distinct on (a.question_id) a.question_id, a.is_correct
            from public.answers a
            join public.questions q on q.id = a.question_id
           where a.user_id = uid and a.mode = 'leccion'
             and q.exam = p_exam and q.area = p_area and q.leccion = p_leccion
             and a.created_at > now() - interval '3 hours'
           order by a.question_id, a.created_at desc) x;

  if resp < tam then
    raise exception 'leccion_incompleta' using detail = format('%s de %s respondidas', resp, tam);
  end if;

  v_ref := format('%s:%s:%s:%s', p_exam, p_area, p_leccion, private.hoy_lima());
  nueva := not exists (select 1 from public.gems_transactions t
                        where t.user_id = uid and t.motivo = 'leccion' and t.ref = v_ref);
  gemas := private.mover_gemas(uid, private.premio('leccion'), 'leccion', v_ref);
  if bien = tam then
    gemas := gemas + private.mover_gemas(uid, private.premio('leccion_perfecta'), 'leccion_perfecta', v_ref);
  end if;

  xp      := private.sumar_xp(uid, case when nueva then bien * 10 + 20 else bien * 2 end);
  racha   := private.registrar_estudio(uid);
  medalla := private.revisar_medalla(uid, p_exam);

  return jsonb_build_object(
    'aciertos', bien, 'total', tam, 'perfecta', bien = tam,
    'gemas_ganadas', gemas + (xp->>'gemas')::int + (racha->>'gemas')::int,
    'xp', xp, 'racha', racha, 'medalla_nueva', medalla,
    'saldo', (select gems from public.profiles where id = uid),
    'uku_etapa', (select uku_etapa from public.profiles where id = uid)
  );
end $$;
revoke execute on function public.completar_leccion(text, text, integer) from public, anon;
grant execute on function public.completar_leccion(text, text, integer) to authenticated;

-- ---------------------------------------------------------------------
-- 6. RPC: comprar en la tienda
-- ---------------------------------------------------------------------
create function public.comprar(p_item text, p_exam text default null, p_area text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid  uuid := (select auth.uid());
  it   public.shop_items;
  pro  boolean;
  pr   record;
  efecto jsonb := '{}'::jsonb;
  hasta  timestamptz;
begin
  if uid is null then raise exception 'no_autenticado'; end if;
  select * into it from public.shop_items where id = p_item and activo;
  if not found then raise exception 'item_no_existe'; end if;
  if it.precio_gemas is null then raise exception 'item_no_se_vende'; end if;
  pro := private.tiene_pro(uid);
  if it.solo_pro and not pro then raise exception 'solo_pro'; end if;

  select protectores_racha, pases_simulacro into pr from public.profiles where id = uid for update;

  if it.categoria = 'cosmetico' then
    if it.precio_gemas = 0 then raise exception 'item_basico_ya_incluido'; end if;
    if exists (select 1 from public.user_inventory where user_id = uid and item_id = it.id) then
      raise exception 'ya_lo_tienes';
    end if;
    perform private.mover_gemas(uid, -it.precio_gemas, 'compra', null);
    insert into public.user_inventory (user_id, item_id, origen) values (uid, it.id, 'compra');
    efecto := jsonb_build_object('item', it.id);

  elsif it.tipo = 'recarga_vidas' then
    if pro then raise exception 'pro_tiene_vidas_ilimitadas'; end if;
    perform private.mover_gemas(uid, -it.precio_gemas, 'compra', null);
    efecto := jsonb_build_object('vidas', 5);

  elsif it.tipo = 'protector_racha' then
    if pr.protectores_racha >= coalesce((private.cfg('max_protectores_racha'))::int, 2) then
      raise exception 'maximo_protectores';
    end if;
    perform private.mover_gemas(uid, -it.precio_gemas, 'compra', null);
    update public.profiles set protectores_racha = protectores_racha + 1 where id = uid;
    efecto := jsonb_build_object('protectores_racha', pr.protectores_racha + 1);

  elsif it.tipo = 'pase_simulacro' then
    if pro then raise exception 'pro_tiene_simulacros_ilimitados'; end if;
    if pr.pases_simulacro >= coalesce((private.cfg('max_pases_simulacro'))::int, 3) then
      raise exception 'maximo_pases';
    end if;
    perform private.mover_gemas(uid, -it.precio_gemas, 'compra', null);
    update public.profiles set pases_simulacro = pases_simulacro + 1 where id = uid;
    efecto := jsonb_build_object('pases_simulacro', pr.pases_simulacro + 1);

  elsif it.tipo = 'desbloqueo_sala' then
    if pro then raise exception 'pro_ya_tiene_todo'; end if;
    if not exists (select 1 from public.questions q
                    where q.exam = p_exam and q.area = p_area and not q.gratis
                      and q.estado in ('validada_ia', 'revisada_medico')) then
      raise exception 'sala_sin_contenido_bloqueado';
    end if;
    perform private.mover_gemas(uid, -it.precio_gemas, 'compra', null);
    insert into public.user_unlocks as u (user_id, exam, area, expires_at)
    values (uid, p_exam, p_area, now() + interval '24 hours')
    on conflict (user_id, exam, area) do update
      set expires_at = greatest(u.expires_at, now()) + interval '24 hours'
    returning u.expires_at into hasta;
    efecto := jsonb_build_object('sala', p_area, 'examen', p_exam, 'hasta', hasta);
  end if;

  return jsonb_build_object('ok', true, 'item', it.id, 'efecto', efecto,
                            'saldo', (select gems from public.profiles where id = uid));
end $$;
revoke execute on function public.comprar(text, text, text) from public, anon;
grant execute on function public.comprar(text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 7. Avatar propio + Uku de compañero
-- ---------------------------------------------------------------------
create table public.user_avatar (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  apariencia    jsonb not null default '{}'::jsonb,   -- piel, cabello, color_cabello, ojos, cuerpo, color_ropa
  equipo_avatar jsonb not null default '{}'::jsonb,   -- {"cabeza": "gorro_quirurgico_celeste", ...}
  equipo_uku    jsonb not null default '{}'::jsonb,
  nombre_uku    text  not null default 'Uku' check (char_length(nombre_uku) between 1 and 20),
  updated_at    timestamptz not null default now()
);
alter table public.user_avatar enable row level security;
create policy "avatar propio: leer" on public.user_avatar
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.user_avatar from anon, authenticated;

create function private.validar_equipo(uid uuid, p_equipo jsonb, p_para text) returns void
language plpgsql security definer set search_path = '' as $$
declare k text; v text; it public.shop_items;
begin
  if jsonb_typeof(p_equipo) <> 'object' then raise exception 'equipo_invalido'; end if;
  for k, v in select key, value #>> '{}' from jsonb_each(p_equipo) loop
    if v is null then continue; end if;
    select * into it from public.shop_items where id = v and categoria = 'cosmetico';
    if not found then raise exception 'item_no_existe: %', v; end if;
    if it.slot <> k then raise exception 'slot_incorrecto: %', v; end if;
    if it.para not in (p_para, 'ambos') then raise exception 'item_no_aplica: %', v; end if;
    if it.precio_gemas is distinct from 0
       and not exists (select 1 from public.user_inventory where user_id = uid and item_id = v) then
      raise exception 'no_tienes_el_item: %', v;
    end if;
  end loop;
end $$;
revoke execute on function private.validar_equipo(uuid, jsonb, text) from public;

create function public.guardar_avatar(p_apariencia jsonb, p_equipo_avatar jsonb,
                                      p_equipo_uku jsonb, p_nombre_uku text default 'Uku')
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); k text; v jsonb;
begin
  if uid is null then raise exception 'no_autenticado'; end if;
  if jsonb_typeof(p_apariencia) <> 'object' then raise exception 'apariencia_invalida'; end if;
  for k, v in select key, value from jsonb_each(p_apariencia) loop
    if k not in ('piel', 'cabello', 'color_cabello', 'ojos', 'cuerpo', 'color_ropa', 'cejas', 'accesorio_facial')
       or jsonb_typeof(v) <> 'string' or char_length(v #>> '{}') > 30 then
      raise exception 'apariencia_invalida: %', k;
    end if;
  end loop;
  perform private.validar_equipo(uid, p_equipo_avatar, 'avatar');
  perform private.validar_equipo(uid, p_equipo_uku, 'uku');

  insert into public.user_avatar as a (user_id, apariencia, equipo_avatar, equipo_uku, nombre_uku, updated_at)
  values (uid, p_apariencia, p_equipo_avatar, p_equipo_uku, coalesce(nullif(trim(p_nombre_uku), ''), 'Uku'), now())
  on conflict (user_id) do update set
    apariencia = excluded.apariencia, equipo_avatar = excluded.equipo_avatar,
    equipo_uku = excluded.equipo_uku, nombre_uku = excluded.nombre_uku, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.guardar_avatar(jsonb, jsonb, jsonb, text) from public, anon;
grant execute on function public.guardar_avatar(jsonb, jsonb, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------
-- 8. Simulacros: el servidor arma la prueba, guarda la clave y corrige
-- ---------------------------------------------------------------------
create table public.simulacro_sesiones (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  exam           text not null references public.exams (code),
  modo           text not null check (modo in ('express', 'oficial')),
  uso            text not null check (uso in ('pro', 'gratis_semanal', 'pase')),
  preguntas      text[] not null,
  esperadas      integer not null,
  minutos        integer not null,
  iniciado_at    timestamptz not null default now(),
  finalizado_at  timestamptz,
  correctas      integer,
  total          integer,
  nota           numeric(4, 1),
  aprobado       boolean,
  detalle        jsonb
);
alter table public.simulacro_sesiones enable row level security;
create policy "simulacros propios: leer" on public.simulacro_sesiones
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.simulacro_sesiones from anon, authenticated;
create index simulacro_user_idx on public.simulacro_sesiones (user_id, iniciado_at desc);

create function public.iniciar_simulacro(p_exam text, p_modo text, p_preguntas integer default 20) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid   uuid := (select auth.uid());
  pro   boolean;
  uso   text;
  n     integer;
  mins  integer;
  ids   text[];
  sid   uuid;
  solo_gratis boolean := false;
  cfg_of jsonb := private.cfg('simulacro_oficial') -> p_exam;
begin
  if uid is null then raise exception 'no_autenticado'; end if;
  if p_exam not in ('ESSALUD', 'ENAM', 'SERUMS') then raise exception 'examen_invalido'; end if;
  pro := private.tiene_pro(uid);

  if p_modo = 'express' then
    n := case when p_preguntas in (20, 50) then p_preguntas else 20 end;
    mins := n;
    if pro then uso := 'pro';
    else
      if (select count(*) from public.simulacro_sesiones s
           where s.user_id = uid and s.uso = 'gratis_semanal' and s.iniciado_at > now() - interval '7 days')
         >= coalesce((private.cfg('simulacro_express_gratis_por_semana'))::int, 1) then
        raise exception 'limite_semanal_simulacro';
      end if;
      uso := 'gratis_semanal'; solo_gratis := true;
    end if;
  elsif p_modo = 'oficial' then
    n := (cfg_of ->> 'preguntas')::int; mins := (cfg_of ->> 'minutos')::int;
    if pro then uso := 'pro';
    else
      update public.profiles set pases_simulacro = pases_simulacro - 1
       where id = uid and pases_simulacro > 0;
      if not found then raise exception 'necesita_pase_o_pro'; end if;
      uso := 'pase';
    end if;
  else
    raise exception 'modo_invalido';
  end if;

  -- Muestra estratificada por área, proporcional al banco
  with pool as (
    select q.id, q.area from public.questions q
     where q.exam = p_exam and q.estado in ('validada_ia', 'revisada_medico')
       and (not solo_gratis or q.gratis)
  ), cuota as (
    select area, greatest(1, round(n * count(*)::numeric / (select count(*) from pool)))::int as c
      from pool group by area
  ), ranked as (
    select p.id, p.area, row_number() over (partition by p.area order by random()) as rn from pool p
  )
  select array_agg(id order by random()) into ids
    from (select r.id from ranked r join cuota c using (area) where r.rn <= c.c
          order by random() limit n) s;

  if ids is null then raise exception 'sin_preguntas'; end if;

  insert into public.simulacro_sesiones (user_id, exam, modo, uso, preguntas, esperadas, minutos)
  values (uid, p_exam, p_modo, uso, ids, n, mins) returning id into sid;

  return jsonb_build_object(
    'sesion', sid, 'minutos', mins, 'esperadas', n, 'total', cardinality(ids),
    'preguntas', (select jsonb_agg(jsonb_build_object(
                     'id', q.id, 'area', q.area, 'subarea', q.subarea, 'tema', q.tema,
                     'dificultad', q.dificultad, 'tipo', q.tipo,
                     'enunciado', q.enunciado, 'opciones', q.opciones) order by o.ord)
                    from unnest(ids) with ordinality o(id, ord)
                    join public.questions q on q.id = o.id)
  );
end $$;
revoke execute on function public.iniciar_simulacro(text, text, integer) from public, anon;
grant execute on function public.iniciar_simulacro(text, text, integer) to authenticated;

-- p_respuestas: {"enam-med-resp-0001": "D", ...}
create function public.finalizar_simulacro(p_sesion uuid, p_respuestas jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid   uuid := (select auth.uid());
  s     public.simulacro_sesiones;
  qid   text;
  elec  text;
  bien  integer := 0;
  v_nota numeric(4, 1);
  aprob boolean := false;
  minimo numeric;
  det   jsonb;
  correccion jsonb;
begin
  if uid is null then raise exception 'no_autenticado'; end if;
  select * into s from public.simulacro_sesiones where id = p_sesion and user_id = uid for update;
  if not found then raise exception 'sesion_no_existe'; end if;
  if s.finalizado_at is not null then raise exception 'sesion_ya_finalizada'; end if;
  if jsonb_typeof(p_respuestas) <> 'object' then raise exception 'respuestas_invalidas'; end if;

  foreach qid in array s.preguntas loop
    elec := p_respuestas ->> qid;
    if elec in ('A', 'B', 'C', 'D') then
      if private.guardar_respuesta(uid, qid, elec, 'simulacro', null, now()) then bien := bien + 1; end if;
    end if;
  end loop;

  v_nota := round(20.0 * bien / cardinality(s.preguntas), 1);
  minimo := (private.cfg('nota_aprobatoria') ->> s.exam)::numeric;
  -- Solo cuenta como aprobado un simulacro oficial completo y dentro del tiempo (+10 min de gracia)
  aprob := s.modo = 'oficial'
           and cardinality(s.preguntas) >= s.esperadas
           and now() <= s.iniciado_at + make_interval(mins => s.minutos + 10)
           and v_nota >= minimo;

  select jsonb_object_agg(area, jsonb_build_object('correctas', c, 'total', t)) into det
    from (select q.area, count(*) filter (where q.correcta = p_respuestas ->> q.id) as c, count(*) as t
            from public.questions q where q.id = any (s.preguntas) group by q.area) x;

  select jsonb_agg(jsonb_build_object(
           'id', q.id, 'elegida', p_respuestas ->> q.id, 'correcta', q.correcta,
           'explicacion', q.explicacion, 'por_que_no', q.por_que_no, 'fuente', q.fuente,
           'area', q.area, 'subarea', q.subarea))
    into correccion
    from public.questions q where q.id = any (s.preguntas);

  update public.simulacro_sesiones
     set finalizado_at = now(), correctas = bien, total = cardinality(s.preguntas),
         nota = v_nota, aprobado = aprob, detalle = det
   where id = s.id;

  if aprob then
    perform private.otorgar_logro(uid, 'aprobado:' || s.exam);
    perform private.evolucionar_uku(uid, case s.exam when 'ESSALUD' then 2 when 'ENAM' then 3 else 4 end::smallint);
  end if;
  perform private.registrar_estudio(uid);

  return jsonb_build_object(
    'correctas', bien, 'total', cardinality(s.preguntas), 'nota', v_nota, 'aprobado', aprob,
    'nota_minima', minimo, 'por_area', det, 'correccion', correccion,
    'uku_etapa', (select uku_etapa from public.profiles where id = uid)
  );
end $$;
revoke execute on function public.finalizar_simulacro(uuid, jsonb) from public, anon;
grant execute on function public.finalizar_simulacro(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 9. Resumen del jugador para la pantalla principal
-- ---------------------------------------------------------------------
create function public.mi_jugador() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'perfil', to_jsonb(p) - 'id',
    'pro', private.tiene_pro(p.id),
    'avatar', (select to_jsonb(a) - 'user_id' from public.user_avatar a where a.user_id = p.id),
    'inventario', coalesce((select jsonb_agg(i.item_id) from public.user_inventory i where i.user_id = p.id), '[]'),
    'logros', coalesce((select jsonb_agg(l.logro) from public.user_logros l where l.user_id = p.id), '[]'),
    'repasos_pendientes', (select count(*) from public.user_question_progress u
                            where u.user_id = p.id and u.proximo_repaso <= now())
  )
  from public.profiles p where p.id = (select auth.uid())
$$;
revoke execute on function public.mi_jugador() from public, anon;
grant execute on function public.mi_jugador() to authenticated;
