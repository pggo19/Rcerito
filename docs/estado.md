# Estado del proyecto (23 nov 2026)

## Funciona

- Onboarding: nombre y examen objetivo.
- Campus en pixel art con tres edificios y una plaza; Uku camina al edificio que tocas. Los edificios siguientes se abren con la medalla del examen objetivo (o con Pro).
- Salas por área, con vidas (5, una cada 30 min), 3 lecciones de práctica sin vidas, XP, gemas, racha y medallas.
- Corrección con explicación, motivo de cada distractor, fuente citada y botón para reportar errores.
- Plaza: banco libre, repaso de errores y tarjetas, sin gastar vidas.
- Simulacro con tiempo, puntaje sobre 100, resultado por área y revisión de errores.
- Perfil tipo carnet, medallas y precisión por examen.
- Pantalla Pro con planes en soles (cobro simulado; hay un interruptor de prueba).
- Preguntas desde Supabase con copia local si no hay red. Copia incluida: 45 de prueba + 360 del banco del Drive (120 por examen, lotes 188–191).
- Eventos al entrar a cada edificio: emergencia diaria (defender / huir / mochila), desafío del día, paciente en el pasillo, incidentes propios de cada escenario y misiones para remediarlos. Insignias buenas y rojas en el perfil. Ver `EVENTOS.md`.
- Ícono de Android y splash con Uku joven en 3D (fondo morado). Ícono de 512 px para la ficha en `assets/play/`.
- Proyecto Android (Capacitor) y workflow que compila un APK de prueba en GitHub Actions.

## Falta

- Inicio de sesión (Google) y sincronizar el progreso con la nube. Hoy el progreso vive en el teléfono.
- Cobro real con Google Play Billing y validación de compras en el servidor.
- Subir a Supabase las ~20 mil preguntas del Drive con `content/importar.py` (ya traduce los nombres de área del Drive, p. ej. "Medicina Interna" → "Medicina"; la subárea libre queda como aviso, no como error).
- Revisión médica de las 45 preguntas de prueba.
- Ícono, pantalla de inicio (splash) y ficha de Play Store.
- Política de privacidad y términos.
- Duelos, liga semanal y tienda de accesorios para Uku (v2).
