do $$
declare
  a uuid := gen_random_uuid();   -- usuario gratis
  b uuid := gen_random_uuid();   -- usuario Pro
  log text := '';
  n int; j jsonb; resp jsonb; sid uuid;
begin
  -- ---------- preparación (como dueño) ----------
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-a@rcerito.test', '{}', now(), now()),
         (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-b@rcerito.test', '{}', now(), now());
  update public.app_config set value = '0' where key = 'lecciones_gratis_por_sala';  -- todo bloqueado para la prueba
  insert into public.user_entitlements (user_id, activo, expires_at, origen) values (b, true, now() + interval '30 days', 'manual');
  update public.profiles set gems = 500 where id = a;
  log := log || format(E'perfil B is_pro espejo=%s\n', (select is_pro from public.profiles where id = b));

  -- ---------- ANON ----------
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  select count(*) into n from public.questions;
  log := log || format(E'anon ve preguntas=%s (esperado 0)\n', n);
  select count(*) into n from public.resumen_salas(null);
  log := log || format(E'anon resumen_salas filas=%s\n', n);

  -- ---------- A (gratis) ----------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.questions;
  log := log || format(E'A gratis ve preguntas=%s (esperado 0)\n', n);

  begin update public.profiles set gems = 99999 where id = a; log := log || E'FALLA: A cambió sus gemas\n';
  exception when others then log := log || format(E'OK A no puede editar gemas: %s\n', sqlerrm); end;
  begin update public.profiles set is_pro = true where id = a; log := log || E'FALLA: A se puso Pro\n';
  exception when others then log := log || format(E'OK A no puede ponerse Pro: %s\n', sqlerrm); end;
  begin insert into public.user_entitlements (user_id, activo, origen) values (a, true, 'manual'); log := log || E'FALLA: A creó suscripción\n';
  exception when others then log := log || format(E'OK A no puede crear suscripción: %s\n', sqlerrm); end;
  begin insert into public.answers (user_id, question_id, chosen, is_correct, mode)
        values (a, 'x', 'A', true, 'leccion');
        log := log || E'FALLA: A insertó respuesta directa\n';
  exception when others then log := log || format(E'OK A no puede insertar respuestas: %s\n', sqlerrm); end;
  begin perform public.comprar('estetoscopio_dorado'); log := log || E'FALLA: A compró ítem Pro\n';
  exception when others then log := log || format(E'OK ítem solo Pro: %s\n', sqlerrm); end;
  begin perform public.iniciar_simulacro('ENAM', 'oficial'); log := log || E'FALLA: simulacro oficial sin pase\n';
  exception when others then log := log || format(E'OK oficial sin pase: %s\n', sqlerrm); end;

  -- registrar respuesta de pregunta bloqueada: se ignora
  select public.registrar_respuestas('[{"question_id":"ser-cui-0001","elegida":"A","modo":"leccion"}]') into resp;
  log := log || format(E'respuesta a pregunta bloqueada → %s (esperado [])\n', resp);

  -- comprar desbloqueo de sala
  j := public.comprar('desbloqueo_sala', 'SERUMS', 'Cuidado integral de salud');
  log := log || format(E'compra sala: saldo=%s\n', j->>'saldo');
  select count(*) into n from public.questions;
  log := log || format(E'A tras desbloqueo ve=%s (esperado 10)\n', n);

  -- responder la lección 1 (todas con A) y completarla
  select public.registrar_respuestas(jsonb_agg(jsonb_build_object(
           'client_id', gen_random_uuid(), 'question_id', q.id, 'elegida', 'A', 'modo', 'leccion')))
    into resp from public.questions q where q.exam = 'SERUMS' and q.area = 'Cuidado integral de salud';
  log := log || format(E'registradas=%s\n', jsonb_array_length(resp));
  j := public.completar_leccion('SERUMS', 'Cuidado integral de salud', 1);
  log := log || format(E'lección: aciertos=%s/%s gemas=%s racha=%s xp=%s saldo=%s\n',
                       j->>'aciertos', j->>'total', j->>'gemas_ganadas', j#>>'{racha,racha}', j#>>'{xp,xp}', j->>'saldo');
  j := public.completar_leccion('SERUMS', 'Cuidado integral de salud', 1);
  log := log || format(E'repetir misma lección hoy: gemas=%s (esperado 0)\n', j->>'gemas_ganadas');

  -- tienda y avatar
  j := public.comprar('estetoscopio_clasico');
  log := log || format(E'compra estetoscopio: saldo=%s\n', j->>'saldo');
  begin perform public.comprar('estetoscopio_clasico'); log := log || E'FALLA: compró dos veces\n';
  exception when others then log := log || format(E'OK no compra dos veces: %s\n', sqlerrm); end;
  j := public.guardar_avatar('{"piel":"trigueña","cabello":"corto"}', '{"cuello":"estetoscopio_clasico","cuerpo":"mandil_blanco"}',
                             '{"cara":"anteojos_uku"}', 'Ukucito');
  log := log || format(E'guardar avatar: %s\n', j);
  begin perform public.guardar_avatar('{}', '{"cabeza":"gorro_cirujano_dorado"}', '{}', 'Uku'); log := log || E'FALLA: equipó ítem que no tiene\n';
  exception when others then log := log || format(E'OK no equipa lo que no tiene: %s\n', sqlerrm); end;
  j := public.comprar('protector_racha');
  log := log || format(E'protector racha: %s\n', j->'efecto');
  j := public.elegir_objetivo('ENAM');
  log := log || format(E'objetivo ENAM → Uku etapa %s (esperado 2)\n', j->>'uku_etapa');
  j := public.mi_jugador();
  log := log || format(E'mi_jugador: gemas=%s nivel=%s inventario=%s logros=%s\n',
                       j#>>'{perfil,gems}', j#>>'{perfil,nivel}', j->'inventario', j->'logros');
  select count(*) into n from public.gems_transactions;
  log := log || format(E'A ve sus movimientos de gemas=%s\n', n);

  -- ---------- B (Pro) ----------
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.questions;
  log := log || format(E'B Pro ve preguntas=%s (esperado 45)\n', n);
  log := log || format(E'B mi_estado_pro=%s\n', public.mi_estado_pro());
  select count(*) into n from public.gems_transactions;
  log := log || format(E'B ve movimientos de otros=%s (esperado 0)\n', n);
  j := public.iniciar_simulacro('ENAM', 'oficial');
  sid := (j->>'sesion')::uuid;
  log := log || format(E'simulacro oficial ENAM: %s de %s esperadas, %s min, ¿trae clave?=%s\n',
                       j->>'total', j->>'esperadas', j->>'minutos', (j#>'{preguntas,0}') ? 'correcta');
  select jsonb_object_agg(q.id, q.correcta) into resp from public.questions q where q.id in
    (select x->>'id' from jsonb_array_elements(j->'preguntas') x);
  j := public.finalizar_simulacro(sid, resp);
  log := log || format(E'finalizar: nota=%s aprobado=%s (esperado false: incompleto) áreas=%s\n',
                       j->>'nota', j->>'aprobado', (select count(*) from jsonb_object_keys(j->'por_area')));

  perform set_config('role', 'postgres', true);
  raise exception E'RESULTADOS (se revierte todo)\n%', log;
end $$;
