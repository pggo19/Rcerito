-- Banner comercial de R0 Plus para serumistas (Rcerito no comparte datos con R0).
-- Se activa poniendo "activo": true y la url de inscripción.
insert into public.app_config (key, value) values
  ('r0plus', '{"activo": false, "url": null,
               "titulo": "¿Ya eres serumista? Sigue con R0 Plus",
               "texto": "Tu siguiente meta es el residentado. Prepárate con R0 Plus.",
               "boton": "Conocer R0 Plus",
               "etapa_minima": 4, "objetivos": ["SERUMS"]}')
on conflict (key) do nothing;
