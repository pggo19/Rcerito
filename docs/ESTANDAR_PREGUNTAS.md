# Rcerito: la app y el estándar de preguntas

Versión 1.0 · 21 de noviembre de 2026

Este documento define cómo es Rcerito y cómo deben generarse las preguntas para que entren a la app sin retoques. Toda pregunta, la escriba una persona o una IA (Gemini, Neón u otra), sigue el mismo formato: **4 alternativas (A, B, C, D) y una sola respuesta correcta**, como el ENAM, el examen de internado de EsSalud y la evaluación SERUMS.

---

## 1. La app

Rcerito prepara a estudiantes de último año y médicos recién titulados del Perú para tres exámenes:

| Examen | En la app | Quién lo rinde |
| --- | --- | --- |
| Internado EsSalud | Hospital Docente | Alumnos de último año |
| ENAM (ASPEFAM) | Aula Magna | Internos y egresados |
| Evaluación SERUMS (MINSA, portal ENCAPS) | Posta Rural | Médicos titulados |

**Cómo se usa:** el estudio se recorre como un campus en pixel art. Uku, un osito de anteojos con mandil, camina hasta el edificio que tocas. Cada edificio es un examen y por dentro tiene **salas**: una por área (Medicina, Pediatría, Cirugía…). La plaza central es práctica libre.

- **Salas:** lecciones de hasta 10 preguntas, con 5 vidas que se recuperan cada 30 minutos. Las 3 primeras lecciones no gastan vidas.
- **Corrección:** al responder, Uku muestra la respuesta correcta, la explicación, por qué falló la opción elegida y la fuente.
- **Plaza:** banco libre, repaso de errores y tarjetas, sin gastar vidas.
- **Simulacro:** hasta 100 preguntas con tiempo (1 minuto por pregunta), puntaje sobre 100 y resultado por área.
- **Progreso:** XP, gemas, racha diaria y una medalla por edificio (80 % en cada sala).
- **Pro:** vidas ilimitadas, simulacros sin tope y todos los edificios abiertos (cobro por Google Play, aún simulado).

**Tecnología:** React + TypeScript empaquetado para Android con Capacitor; base de datos Supabase propia (proyecto `rcerito`, separado de R0); repositorio `pggo19/rcerito`.

### Cómo llega una pregunta a la pantalla

1. La pregunta se guarda en la tabla `questions` de Supabase.
2. La app solo lee las que tienen `estado` = `validada_ia` o `revisada_medico`.
3. El campo `examen` decide el edificio; el campo `area` decide la sala.
4. Las salas siguen el orden de la tabla de especificaciones (sección 4). Cada sala se parte en lecciones de 10 preguntas, de menor a mayor dificultad.
5. La etiqueta negra sobre el caso muestra la `subarea`; al lado va el `tema`.
6. Si no hay internet, la app usa una copia de preguntas incluida en el APK.

> Un `area` escrita distinto (por ejemplo "Medicina interna" en vez de "Medicina") crearía una sala nueva. Por eso el importador rechaza cualquier área o subárea que no esté en la sección 4.

---

## 2. Qué dicen las bases de cada examen

| | ENAM | Internado EsSalud | Evaluación SERUMS |
| --- | --- | --- | --- |
| Preguntas | 180 | 100 (fuentes no oficiales; las bases no lo precisan) | 100 |
| Duración | 3 horas | No publicado | 2 horas |
| Alternativas | 4, una correcta | 4, una correcta* | 4, una correcta* |
| Tipo | 90 % caso clínico | No publicado | Casos breves y preguntas directas* |
| Penalidad por error | No hay | No publicado | No publicado |
| Nota | Aprueba con 11 | Se exige 13 o más; el examen es el 100 % del puntaje | Orden de mérito para adjudicar plaza |
| Contenido | Tabla de especificaciones de ASPEFAM | Medicina, pediatría, ginecoobstetricia, cirugía y otras | 5 bloques temáticos por carrera |

\* Las bases públicas de EsSalud y la convocatoria del SERUMS no detallan el número de alternativas ni el tipo de pregunta; se toma de los exámenes rendidos y del material de preparación.

Fuentes:
- [Bases ENAM Extraordinario 2026 (ASPEFAM)](https://www.aspefam.org.pe/enam/enam2026e/bases_enam_26.04.2026.pdf): "Prueba Objetiva Múltiple (POM) con cuatro alternativas con una sola respuesta correcta", 180 preguntas, 3 horas, 90 % de casos clínicos, sin puntaje negativo, aprueba con 11.
- [Tabla de especificaciones ENAM 2025](https://www.aspefam.org.pe/enam/enam2025ord/tabla_enam_12.10.2025.pdf): reparto por área y subárea.
- [Programa de Internado Médico EsSalud](https://www.essalud.gob.pe/programa-de-internado-medico/): nota mínima 13 y el examen como 100 % del puntaje de selección.
- MINSA, Evaluación para el SERUMS: 100 preguntas en 5 bloques (salud pública, cuidado integral de salud, ética e interculturalidad, investigación y gestión de servicios de salud), 2 horas. [Documentos del proceso 2026-II](https://www.gob.pe/115875-documentos-de-consulta-de-la-evaluacion-para-el-servicio-rural-y-urbano-marginal-de-salud-serums-2026-ii).

**Decisión:** un solo estándar para los tres exámenes, **4 alternativas A–D con una sola correcta**. La base de datos ya rechaza cualquier pregunta con 3 o 5 opciones.

---

## 3. Formato de una pregunta

Cada pregunta es un objeto JSON. Un lote es una lista de ellos (`[ {...}, {...} ]`).

```json
{
  "id": "enam-med-resp-0001",
  "examen": "ENAM",
  "area": "Medicina",
  "subarea": "Respiratorio",
  "tema": "Tromboembolismo pulmonar",
  "dificultad": 2,
  "tipo": "caso_clinico",
  "enunciado": "Mujer de 45 años, a los 10 días de una artroplastia de cadera, presenta disnea súbita y dolor pleurítico. FC 112 por minuto, saturación 90 %, PA 128/80 mmHg. Wells alto. ¿Cuál es el examen indicado?",
  "opciones": {
    "A": "Dímero D como única prueba diagnóstica",
    "B": "Espirometría con prueba broncodilatadora",
    "C": "Radiografía de tórax como prueba definitiva",
    "D": "Angiotomografía de arterias pulmonares"
  },
  "correcta": "D",
  "explicacion": "Con probabilidad clínica alta y paciente estable se pasa directo a la angiotomografía pulmonar; el dímero D solo sirve para descartar en probabilidad baja o intermedia.",
  "por_que_no": {
    "A": "Con probabilidad clínica alta el dímero D no descarta la enfermedad.",
    "B": "No tiene utilidad en la sospecha de tromboembolismo.",
    "C": "Ayuda a descartar otras causas, pero no confirma el diagnóstico."
  },
  "fuente": {
    "documento": "ESC Guidelines for the diagnosis and management of acute pulmonary embolism",
    "anio": 2019,
    "url": "https://academic.oup.com/eurheartj/article/41/4/543/5556136"
  },
  "estado": "borrador"
}
```

| Campo | Regla |
| --- | --- |
| `id` | Único. Empieza con `ess-`, `enam-` o `ser-` según el examen; solo minúsculas, números y guiones. Ej.: `ser-cui-tb-0042`. |
| `examen` | `ESSALUD`, `ENAM` o `SERUMS`. |
| `area` / `subarea` | Exactamente como en la sección 4. |
| `tema` | El tema concreto, en pocas palabras ("Preeclampsia severa"). |
| `dificultad` | 1, 2 o 3 (ver abajo). |
| `tipo` | `caso_clinico` o `directa`. |
| `enunciado` | Termina con la pregunta entre signos `¿ ?`. |
| `opciones` | Exactamente `A`, `B`, `C`, `D`. Sin opciones vacías ni repetidas. |
| `correcta` | Una sola letra: `A`, `B`, `C` o `D`. |
| `explicacion` | De 1 a 3 oraciones: por qué la correcta es correcta. |
| `por_que_no` | Una línea por cada una de las **3 incorrectas** (no incluye la correcta). |
| `fuente` | `documento` y `anio` (número) obligatorios; `url` si existe. |
| `estado` | `borrador` al generar. Ver sección 6. |

### Dificultad

| Nivel | Qué mide | Reparto sugerido |
| --- | --- | --- |
| 1 | Un dato o concepto directo (definición, antídoto, punto de corte). | 30 % |
| 2 | Integrar el caso para decidir diagnóstico o conducta. | 50 % |
| 3 | Distinguir entre opciones muy parecidas; el detalle del caso decide. | 20 % |

### Reglas de redacción

1. **Caso clínico** en este orden: edad y sexo, motivo y tiempo de enfermedad, hallazgos relevantes, exámenes con unidades, y al final la pregunta. Entre 40 y 120 palabras.
2. **Una sola respuesta correcta**, defendible con la fuente citada. Nada de "todas las anteriores" ni "ninguna de las anteriores".
3. **Opciones homogéneas:** las cuatro del mismo tipo (cuatro fármacos, cuatro diagnósticos, cuatro conductas) y de **longitud parecida**. En dificultad 3, la correcta **nunca** es la más larga.
4. **Distractores plausibles:** errores que un estudiante real cometería, no opciones absurdas.
5. **Letra correcta repartida:** en cada lote, cada letra debe ser la correcta en cerca del 25 % de las preguntas.
6. **Preguntas en negativo** ("¿cuál está contraindicada?") solo si son imprescindibles; en ese caso, la palabra clave va en el enunciado y no en mayúsculas.
7. **Contexto peruano:** unidades del SI, fármacos del Petitorio Nacional cuando aplique, normas del MINSA, EsSalud, OPS/OMS o guías internacionales vigentes. Para SERUMS, priorizar el primer nivel de atención.
8. **Nada copiado:** no reproducir texto literal de los cuadernillos oficiales; inspirarse en el tema y redactar de cero.

---

## 4. Taxonomía y reparto por examen

El reparto indica cuántas preguntas de cada área generar por cada 100.

### ENAM e Internado EsSalud

ENAM sigue su tabla de especificaciones. EsSalud no publica una tabla, así que usa la misma hasta que haya una oficial.

| Área (`area`) | Subáreas (`subarea`) | Por cada 100 |
| --- | --- | --- |
| Medicina | Infecciosas, Respiratorio, Cardiovascular, Digestivo, Neurología, Endocrino y metabolismo, Reumatología, Salud mental, Nefrología, Dermatología, Hematología | 22 |
| Pediatría | Neonatología, Niño y adolescente, Emergencias pediátricas, Ética en pediatría | 19 |
| Emergencias y cuidados críticos | Paro cardiorrespiratorio, Shock, Falla respiratoria, Falla renal, Falla hepática, Falla endocrina, Falla neurológica, Trauma, Medio interno, Intoxicaciones | 9 |
| Cirugía | Cirugía general, Traumatología, Urología, Oftalmología, Otorrinolaringología, Tórax y cardiovascular, Neurocirugía, Cirugía pediátrica, Quemados | 17 |
| Ginecología y obstetricia | Ginecología, Obstetricia, Ética en ginecoobstetricia | 17 |
| Salud pública | Salud comunitaria, Promoción y prevención, Bioestadística y epidemiología | 8 |
| Ciencias básicas | Morfológicas, Dinámicas | 5 |
| Ética, investigación y gestión | Ética, Investigación, Gestión | 3 |

### Evaluación SERUMS (medicina)

Los cinco bloques del MINSA. El MINSA no publica el peso de cada bloque: el reparto es provisional hasta revisar los contenidos temáticos de medicina.

| Área (`area`) | Subáreas (`subarea`) | Por cada 100 |
| --- | --- | --- |
| Salud pública | Conceptos básicos, Epidemiología, Bioestadística, Vigilancia epidemiológica, Determinantes de la salud, Promoción de la salud, Promoción y prevención, Salud ocupacional | 30 |
| Cuidado integral de salud | Atención primaria de salud, Salud materna, Salud infantil, Salud del adolescente, Salud del adulto y adulto mayor, Enfermedades metaxénicas, Zoonosis, Tuberculosis, VIH e ITS, Enfermedades no transmisibles, Salud mental, Emergencias en el primer nivel, Inmunizaciones | 40 |
| Ética e interculturalidad | Ética y deontología, Derechos en salud, Interculturalidad | 10 |
| Investigación | Metodología, Diseños de estudio, Ética en investigación | 10 |
| Gestión de servicios de salud | Sistema de salud, Referencia y contrarreferencia, Calidad, Planificación, Aseguramiento | 10 |

> Para añadir una subárea nueva se edita `content/estandar.py` y se corre `python3 content/build_questions.py`; no hace falta tocar la app.

---

## 5. Prompt para generar preguntas (Neón, Gemini u otra IA)

Copia el bloque, reemplaza lo que está entre `{llaves}` y pide lotes de 20 a 50 preguntas por llamada. Lotes más grandes tienden a repetir temas.

```text
Eres un médico peruano que redacta preguntas para preparar el {EXAMEN: ENAM | Internado EsSalud | Evaluación SERUMS de medicina}.

Genera {N} preguntas nuevas del área "{AREA}", subárea "{SUBAREA}".
Temas a cubrir, sin repetir: {LISTA DE TEMAS, o "elige temas frecuentes del examen"}.
Dificultad: {30 % nivel 1, 50 % nivel 2, 20 % nivel 3}.
Tipo: {90 % caso_clinico y 10 % directa para ENAM y EsSalud | 60 % caso_clinico y 40 % directa para SERUMS}.

Reglas obligatorias:
1. Exactamente 4 alternativas: A, B, C y D. Una sola correcta.
2. Las 4 opciones son del mismo tipo y de longitud parecida. En dificultad 3 la correcta NO es la más larga.
3. Reparte la letra correcta: cada letra debe ser la correcta en cerca del 25 % del lote.
4. Casos clínicos de 40 a 120 palabras: edad y sexo, motivo y tiempo de enfermedad, hallazgos, exámenes con unidades, y al final la pregunta entre ¿ ?.
5. Prohibido "todas las anteriores" y "ninguna de las anteriores".
6. Distractores plausibles: errores reales de estudiantes.
7. "explicacion": de 1 a 3 oraciones sobre por qué la correcta es correcta.
8. "por_que_no": una línea para cada una de las 3 incorrectas, con su letra como clave. No incluyas la correcta.
9. "fuente": una guía o norma real y vigente (MINSA, EsSalud, OPS/OMS o guía internacional) con "documento", "anio" (número) y "url" si existe. Si no estás seguro de una fuente, usa un libro de texto estándar con su edición. No inventes documentos.
10. No copies texto de cuadernillos oficiales.
11. "id": "{PREFIJO}-{código corto}-0001", correlativo (PREFIJO: ess, enam o ser).
12. "estado": "borrador".

Responde SOLO con un arreglo JSON válido, sin texto antes ni después, donde cada elemento tenga exactamente estos campos:
id, examen ("{ESSALUD | ENAM | SERUMS}"), area ("{AREA}"), subarea ("{SUBAREA}"), tema, dificultad (1, 2 o 3), tipo ("caso_clinico" o "directa"), enunciado, opciones ({"A","B","C","D"}), correcta ("A" a "D"), explicacion, por_que_no, fuente ({"documento","anio","url"}), estado.
```

**Ejemplo de relleno:** EXAMEN = ENAM, N = 30, AREA = Pediatría, SUBAREA = Neonatología, PREFIJO = enam.

---

## 6. Validación y carga a la app

### Estados de una pregunta

| Estado | Significado | ¿Se ve en la app? |
| --- | --- | --- |
| `borrador` | Recién generada | No |
| `validada_ia` | Pasó el importador y la revisión cruzada con otra IA | Sí |
| `revisada_medico` | Un médico la revisó | Sí |
| `descartada` | Tiene errores; se guarda para no regenerarla | No |

### Flujo

1. **Generar** el lote con el prompt y guardarlo como `lote.json`.
2. **Validar** formato y estándar:
   ```bash
   python3 content/importar.py lote.json
   ```
   Separa `lote.validas.json` de `lote.rechazadas.json` (con el motivo de cada rechazo) y avisa si una letra o la opción más larga delatan la respuesta.
3. **Revisión cruzada:** otra IA resuelve cada pregunta de `lote.validas.json` sin ver la clave. Las que no coinciden vuelven a `borrador`. Las que coinciden pasan a `validada_ia`.
4. **Muestreo médico:** revisar 1 de cada 10 preguntas. Si una tiene error de fondo, se revisa el lote entero.
5. **Cargar** a Supabase, de una de dos formas:
   - Sin claves: `python3 content/importar.py lote.validas.json --estado validada_ia --sql` y pegar el `.sql` en Supabase → SQL Editor.
   - Directo: `SUPABASE_SERVICE_ROLE_KEY=... python3 content/importar.py lote.validas.json --estado validada_ia --subir`. La clave secreta nunca va al repositorio.
6. Al abrir la app con internet, las preguntas nuevas aparecen en su edificio y su sala.

### Lo que la base de datos ya exige

- Opciones exactamente `A`, `B`, `C`, `D`, y `correcta` entre esas cuatro.
- `por_que_no` con exactamente 3 explicaciones y sin la correcta.
- `dificultad` 1–3, `tipo` válido, `subarea` obligatoria.
- Un `id` repetido actualiza la pregunta existente en lugar de duplicarla.

---

## 7. Pendientes

- Confirmar con las bases 2027 de EsSalud el número de preguntas y si publica tabla de especificaciones.
- Bajar los contenidos temáticos de medicina del SERUMS (gob.pe) para fijar el peso real de cada bloque.
- Revisión médica de las 45 preguntas de prueba que ya están en la app.

---

**Archivos relacionados en el repo**

- `content/estandar.py`: taxonomía, reparto y validación (fuente única).
- `content/importar.py`: valida y carga lotes.
- `content/ejemplos/lote_ejemplo.json`: lote mínimo de ejemplo.
- `supabase/migrations/`: esquema y reglas de la base.
