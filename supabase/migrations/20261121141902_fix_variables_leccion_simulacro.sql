-- Corrige nombres de variables que chocaban con columnas
create or replace function public.completar_leccion(p_exam text, p_area text, p_leccion integer) returns jsonb
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

create or replace function public.finalizar_simulacro(p_sesion uuid, p_respuestas jsonb) returns jsonb
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
