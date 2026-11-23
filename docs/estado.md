# Estado del proyecto (23 nov 2026)

## Funciona

- Onboarding: nombre y examen objetivo.
- Campus en pixel art con tres edificios y una plaza; Uku camina al edificio que tocas. Los tres edificios están abiertos.
- Salas por área partidas en lecciones de 10. Plan gratis: las 2 primeras lecciones de cada sala; el resto con Pro (candado visible).
- Vidas (5, una cada 30 min), 3 lecciones de práctica sin vidas, XP con niveles, racha con protector y medallas.
- Gemas con las mismas reglas que el servidor: lección +10, perfecta +15, rachas 3/7/14/30, nivel +25, medalla +100, tope 400 al día.
- Tienda del Campus: 57 ítems (ayudas, accesorios para el avatar y para Uku, fondos, ítems de logro y exclusivos Pro).
- Avatar propio (piel, peinado, color de pelo, ropa y accesorios) y Uku de compañero con nombre propio.
- Uku joven en 4 etapas (Estudiante, Interno, Médico, Serumista): empieza según el examen elegido y evoluciona al aprobar un simulacro oficial o ganar la medalla.
- Banner de R0 Plus para serumistas, configurable desde Supabase (`app_config.r0plus`, apagado hasta tener el link).
- Corrección con explicación, motivo de cada distractor, fuente citada y botón para reportar errores.
- Plaza: banco libre, repaso de errores y tarjetas, sin gastar vidas.
- Simulacro Express (20 o 50) y Oficial (tamaño y tiempo de cada examen), nota sobre 20, resultado por área y revisión de errores. Gratis: 1 Express por semana; Oficial con pase o Pro.
- Perfil tipo carnet, medallas y precisión por examen.
- Pantalla Pro con planes en soles (cobro simulado; hay un interruptor de prueba).
- Preguntas desde Supabase con copia local si no hay red. Copia incluida: 45 de prueba + 360 del banco del Drive (120 por examen, lotes 188–191).
- Eventos al entrar a cada edificio: emergencia diaria (defender / huir / mochila), desafío del día, paciente en el pasillo, incidentes propios de cada escenario y misiones para remediarlos. Insignias buenas y rojas en el perfil. Ver `EVENTOS.md`.
- Ícono de Android y splash con Uku joven en 3D (fondo morado). Ícono de 512 px para la ficha en `assets/play/`.
- Proyecto Android (Capacitor) y workflow que compila un APK de prueba en GitHub Actions.

## Falta

- Inicio de sesión (Google) y pasar gemas, tienda y progreso a las funciones de Supabase (ya listas: ver `docs/PRO_GEMAS_AVATAR.md`). Hoy el progreso vive en el teléfono.
- Cobro real con Google Play Billing vía RevenueCat (webhook ya desplegado; falta configurar las cuentas).
- "Sala abierta 24 h" con gemas: necesita la cuenta, porque las lecciones Pro no se descargan sin permiso.
- Subir a Supabase las ~20 mil preguntas del Drive con `content/importar.py` (ya traduce los nombres de área del Drive, p. ej. "Medicina Interna" → "Medicina"; la subárea libre queda como aviso, no como error).
- Pasar premios y castigos de los eventos del campus a una función de Supabase (ver `EVENTOS.md`).
- Revisión médica de las 45 preguntas de prueba.
- Ícono, pantalla de inicio (splash) y ficha de Play Store.
- Política de privacidad y términos.
- Duelos y liga semanal (v2).
- Uku del mapa: sigue siendo el sprite chico de 16×16.
