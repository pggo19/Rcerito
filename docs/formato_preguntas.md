# Formato de preguntas

Un archivo JSON por lote: una lista de objetos como este.

```json
{
  "id": "enam-0001",
  "examen": "ENAM",
  "area": "Medicina",
  "tema": "Tromboembolismo pulmonar",
  "dificultad": 2,
  "tipo": "caso_clinico",
  "enunciado": "Mujer de 45 años...",
  "opciones": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correcta": "D",
  "explicacion": "Por qué D es la correcta.",
  "por_que_no": { "A": "...", "B": "...", "C": "..." },
  "fuente": { "documento": "Guía o norma", "anio": 2019, "url": "https://..." },
  "estado": "borrador"
}
```

- `examen`: `ESSALUD`, `ENAM` o `SERUMS`.
- `opciones`: **4 opciones (A–D)**, como en los cuadernillos del ENAM. La base acepta hasta E por si EsSalud o SERUMS usan 5.
- `dificultad`: 1 a 3. `tipo`: `caso_clinico` o `directa`.
- `estado`: `borrador` → `validada_ia` → `revisada_medico` (o `descartada`). La app solo muestra las dos del medio en adelante.

## Reglas para el generador (prompt de Neón)

1. La letra correcta se reparte parejo entre A y D en cada lote.
2. Las cuatro opciones tienen longitud parecida; en dificultad 3 la correcta **no** debe ser la más larga.
3. Una sola respuesta correcta, sin ambigüedad.
4. Cada pregunta cita una guía o norma real (MINSA, EsSalud, OMS/OPS u otra vigente).
5. No copiar texto literal de los cuadernillos oficiales de ASPEFAM, EsSalud o MINSA.
6. `por_que_no` explica cada distractor en una línea.

## Validación antes de publicar

1. Otra IA resuelve la pregunta sin ver la clave; si no coincide, la pregunta vuelve a `borrador`.
2. Se eliminan duplicados por tema y enunciado parecido.
3. `content/build_questions.py` revisa letras y longitudes.
4. Un médico revisa una muestra de cada lote; si encuentra errores, se revisa el lote entero.
