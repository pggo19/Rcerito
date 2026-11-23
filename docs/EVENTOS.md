# Eventos del campus (capa "RPG")

Al entrar a un edificio ya no se va directo a las preguntas: Uku cuenta qué está pasando ese día.
Todo está en `app/src/lib/eventos.ts` (reglas y textos) y `app/src/screens/Encuentro.tsx` (pantalla de combate).

## Qué aparece al entrar

| Evento | Cuándo | Preguntas | Premio / castigo |
| --- | --- | --- | --- |
| **Emergencia / ataque** | 1 edificio por día (el mismo para todos) | 1 | Acierto: +25 gemas, +30 XP, insignia *Defensor*. Fallo: −10 gemas + **incidente**. Huir: −3 gemas, insignia roja *Retirada*, la emergencia sigue. |
| **Desafío del día** | Todos los edificios, cada día | 3 | +5 gemas por acierto, +15 si 3/3 (*Desafío perfecto*). 0/3 = insignia roja *Mal día*. |
| **Paciente en el pasillo** | ~1 de cada 2 días por edificio | 1 | +10 gemas, insignia *Ojo clínico*. |
| **Remediar incidente** | Si perdiste una emergencia | 3 (aprobar con 2) | +15 gemas, insignia *Lo arreglaste*. |

Mochila en combate: **Descarte** tacha 2 opciones falsas (15 gemas; gratis con Pro).

Los premios usan la misma economía que las lecciones (`ganarGemas`: tope de 400 gemas al día) y la XP sube de nivel con `sumarXp`.

## Incidentes por escenario

Mientras un incidente siga abierto, las lecciones de ese edificio dan **la mitad de gemas**. Se cierra con la misión (Pro gratis; plan gratis 30 gemas) o solo, a las 24 h. La insignia roja queda hasta que vuelvas a ganar una emergencia en ese edificio.

| Edificio | Incidentes posibles → misión |
| --- | --- |
| Hospital Docente (EsSalud) | Se perdió una historia clínica → Rehacer la historia · La enfermera jefa se enojó → Disculparte · Te sacaron del pase de visita → Volver al pase · El paciente te gritó → Calmar al paciente |
| Aula Magna (ENAM) | Se cayó el techo (se ve en el mapa) → Reparar · El jefe de práctica te puso falta → Justificarla · Se mojaron tus apuntes → Rehacerlos |
| Posta Rural (SERUMS) | El paciente se fue enojado → Visita domiciliaria · Llamada de atención de la microred → Presentar el informe · Botiquín vencido → Reordenar la farmacia · Queja en la asamblea → Explicar en la asamblea |

Para agregar uno: una línea más en `INCIDENTES` (eventos.ts). El del día se elige con una semilla (fecha + edificio).

## Pendiente para producción

Hoy gemas, insignias e incidentes viven en el teléfono (como el resto del progreso). Cuando haya inicio de sesión, estos premios y castigos deben pasar por una función de Supabase (como `completar_leccion`), para que un APK modificado no se los dé.
