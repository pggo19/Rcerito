# Rcerito · Pro, pagos, gemas, avatar y Uku

Versión 1.0 · 21 de noviembre de 2026 · Base de datos: proyecto Supabase `rcerito`

**Regla de oro:** el celular nunca decide si alguien es Pro, cuántas gemas tiene ni si acertó. Todo eso lo decide Supabase. Un APK modificado no puede darse Pro, gemas ni preguntas bloqueadas.

## 1. Qué ya está aplicado en Supabase

| Pieza | Dónde |
| --- | --- |
| Suscripción Pro (solo la escribe el webhook) | `user_entitlements`, `mi_estado_pro()` |
| Preguntas gratis y bloqueadas por RLS | columnas `leccion`, `gratis`, `updated_at` en `questions` |
| Respuestas corregidas en el servidor + repaso espaciado | `registrar_respuestas()`, `user_question_progress`, `repaso_pendiente()` |
| Gemas, XP, nivel y racha | `completar_leccion()`, `gems_transactions` |
| Tienda | `shop_items` (57 ítems), `comprar()`, `user_inventory` |
| Avatar y Uku | `user_avatar`, `guardar_avatar()`, `elegir_objetivo()`, `profiles.uku_etapa` |
| Simulacros | `iniciar_simulacro()`, `finalizar_simulacro()`, `simulacro_sesiones` |
| Logros y medallas | `user_logros` (`medalla:ENAM`, `aprobado:ESSALUD`, `racha:30`, `etapa:3`…) |
| Ajustes sin publicar app | `app_config` |
| Webhook de pagos | Edge Function `revenuecat-webhook` |

Desde la app ya **no se puede** escribir `gems`, `xp`, `streak`, `is_pro` ni insertar en `answers`. Solo `display_name`.

## 2. Plan gratis y Pro

- Cada sala (examen + área) se parte en lecciones de 10, de menor a mayor dificultad. Las **primeras 2 lecciones de cada sala son gratis** (`app_config.lecciones_gratis_por_sala`). Si cambias ese número, la base recalcula todo sola.
- Gratis: lecciones gratis, 1 simulacro Express por semana (solo con preguntas gratis), vidas con recarga.
- Pro: todo el banco, simulacros Express y oficiales ilimitados, vidas ilimitadas, ítems exclusivos.
- Con gemas, un usuario gratis puede comprar: recarga de vidas, protector de racha, pase de simulacro oficial y "sala abierta 24 h".

## 3. Qué tiene que hacer la app (frontend)

```ts
// Mapa del campus: candados sin revelar contenido
const { data: salas } = await supabase.rpc('resumen_salas', { p_exam: 'ENAM' });

// Preguntas: se leen igual que antes; la base solo devuelve las permitidas
const { data } = await supabase.from('questions').select('*')
  .eq('exam', 'ENAM').eq('area', 'Medicina').eq('leccion', 1);

// Respuestas (sirve como cola offline: client_id evita duplicados)
await supabase.rpc('registrar_respuestas', { p: [
  { client_id: crypto.randomUUID(), question_id: q.id, elegida: 'B', modo: 'leccion', answered_at: new Date().toISOString() },
]});

// Al terminar las 10: el servidor cuenta aciertos y da gemas, XP y racha
const { data: premio } = await supabase.rpc('completar_leccion', { p_exam: 'ENAM', p_area: 'Medicina', p_leccion: 1 });

// Perfil completo para la pantalla principal
const { data: jugador } = await supabase.rpc('mi_jugador');

// Onboarding: elegir examen fija la etapa inicial de Uku
await supabase.rpc('elegir_objetivo', { p_exam: 'ESSALUD' });

// Tienda
const { data: items } = await supabase.from('shop_items').select('*').order('orden');
await supabase.rpc('comprar', { p_item: 'chullo_andino' });
await supabase.rpc('comprar', { p_item: 'desbloqueo_sala', p_exam: 'ENAM', p_area: 'Pediatría' });

// Avatar + Uku
await supabase.rpc('guardar_avatar', {
  p_apariencia: { piel: 'trigueña', cabello: 'corto', color_cabello: 'negro' },
  p_equipo_avatar: { cuello: 'estetoscopio_clasico', cuerpo: 'mandil_blanco' },
  p_equipo_uku: { cabeza: 'chullo_andino' },
  p_nombre_uku: 'Ukucito',
});

// Simulacro: la clave nunca llega antes de terminar
const { data: s } = await supabase.rpc('iniciar_simulacro', { p_exam: 'ENAM', p_modo: 'oficial' });
const { data: r } = await supabase.rpc('finalizar_simulacro', { p_sesion: s.sesion, p_respuestas: { [id]: 'A' } });
```

Errores que devuelven las funciones (para mostrar mensajes): `gemas_insuficientes`, `ya_lo_tienes`, `solo_pro`, `necesita_pase_o_pro`, `limite_semanal_simulacro`, `leccion_incompleta`, `maximo_protectores`, `no_tienes_el_item: <id>`.

**Vidas:** siguen en el celular (para que funcione sin internet). Lo único que pasa por el servidor es comprar la recarga: si `comprar('recarga_vidas')` responde `ok`, la app pone 5 vidas.

**⚠ Copia offline del APK:** debe llevar **solo preguntas con `gratis = true`**. Si lleva el banco completo, cualquiera lo extrae del APK y el plan Pro no sirve. Los Pro descargan su banco al iniciar sesión (sincronizando por `updated_at`).

## 4. Pagos con Google Play (RevenueCat)

1. En RevenueCat crea el entitlement **`pro`** y conecta tus productos de Google Play (mensual, anual).
2. En la app: `@revenuecat/purchases-capacitor`; `Purchases.configure(...)` y luego `Purchases.logIn({ appUserID: user.id })` con el id del usuario de Supabase **antes** de vender.
3. En Supabase → Edge Functions → Secrets crea `REVENUECAT_WEBHOOK_SECRET` (una contraseña larga inventada por ti). Opcional y recomendado: `REVENUECAT_API_KEY` (clave secreta `sk_…` de RevenueCat).
4. En RevenueCat → Integrations → Webhooks: URL `https://aoqgwvrdhsiezjvandun.supabase.co/functions/v1/revenuecat-webhook` y en Authorization header la misma contraseña del paso 3.
5. Tras comprar, la app llama `mi_estado_pro()` cada pocos segundos hasta ver `pro: true` (el webhook tarda segundos).

Sin el secreto del paso 3 el webhook rechaza todo (responde 503): nadie puede volverse Pro por esa puerta.

Para dar Pro manual (regalo, promo), desde el SQL Editor:
```sql
insert into user_entitlements (user_id, activo, expires_at, origen)
values ('<uuid>', true, now() + interval '30 days', 'promo')
on conflict (user_id) do update set activo = true, expires_at = excluded.expires_at, origen = 'promo';
```

## 5. Gemas (tu diseño de recompensas)

| Cómo se ganan | Gemas |
| --- | --- |
| Lección completa (una vez por lección y día) | +10 |
| Lección perfecta 10/10 | +15 extra |
| Racha de 3 / 7 / 14 / 30 días | +20 / +50 / +100 / +250 |
| Subir de nivel | +25 |
| Medalla de edificio (80 % en cada sala) | +100 |

Tope: 400 gemas por día. Todo se edita en `app_config.recompensas` y `tope_gemas_diario`.

## 6. Uku: etapas y evoluciones

| Etapa | Uku | Empieza aquí si elige | Evoluciona al |
| --- | --- | --- | --- |
| 1 | Estudiante | Internado EsSalud | aprobar EsSalud |
| 2 | Interno | ENAM | aprobar el ENAM |
| 3 | Médico | SERUMS | aprobar el SERUMS |
| 4 | Serumista | — | — |

"Aprobar" = simulacro **oficial completo**, dentro del tiempo, con nota ≥ `app_config.nota_aprobatoria` (EsSalud 13, ENAM 11, SERUMS 13 provisional), o ganar la medalla del edificio. Uku nunca retrocede.

Sprites por capas en `app/src/assets/pixel/` (32×32). Se regeneran con `python3 content/arte/exportar.py`. Mostrar siempre con `image-rendering: pixelated`.

## 7. Pendiente

- Activar el banner de R0 Plus: en `app_config.r0plus` poner `"activo": true` y la `url`.
- Confirmar con las bases 2027 la nota y duración de EsSalud y la nota de referencia del SERUMS.
- Probar el webhook con el botón "Send test event" de RevenueCat.
