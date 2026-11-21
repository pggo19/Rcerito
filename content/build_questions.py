"""Genera content/preguntas_prueba.json y app/src/data/questions.json.

Reparte la letra correcta de forma pareja (A-D) y valida cada pregunta con el
estándar de estandar.py (4 alternativas, taxonomía por examen, longitudes).
"""
import importlib.util
import json
import pathlib
import random
import sys

ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from estandar import LETRAS, PREFIJO_ID, REPARTO, TAXONOMIA, validar  # noqa: E402

spec = importlib.util.spec_from_file_location("fuente", ROOT / "fuente_preguntas.py")
fuente = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fuente)

rng = random.Random(20261121)
out, counters, by_exam = [], {}, {}
for item in fuente.Q:
    by_exam.setdefault(item["exam"], []).append(item)

for exam, items in by_exam.items():
    slots = [LETRAS[i % 4] for i in range(len(items))]
    rng.shuffle(slots)
    for n, (item, letter) in enumerate(zip(items, slots), start=1):
        texts = [d[0] for d in item["distractores"]]
        assert len(texts) == 3, item["tema"]
        rng.shuffle(texts)
        idx = LETRAS.index(letter)
        ordered = texts[:idx] + [item["correcta"]] + texts[idx:]
        opciones = dict(zip(LETRAS, ordered))
        why = {t: w for t, w in item["distractores"]}
        counters.setdefault(exam, {l: 0 for l in LETRAS})[letter] += 1
        out.append({
            "id": f"{PREFIJO_ID[exam]}-{n:04d}",
            "examen": exam,
            "area": item["area"],
            "subarea": item["subarea"],
            "tema": item["tema"],
            "dificultad": item["dificultad"],
            "tipo": item["tipo"],
            "enunciado": item["enunciado"],
            "opciones": opciones,
            "correcta": letter,
            "explicacion": item["explicacion"],
            "por_que_no": {k: why[v] for k, v in opciones.items() if k != letter},
            "fuente": item["fuente"],
            "estado": "validada_ia",
        })

errores = 0
for q in out:
    err, warn = validar(q)
    for e in err:
        errores += 1
        print(f"ERROR {q['id']}: {e}")
    for w in warn:
        print(f"aviso {q['id']}: {w}")
print("Letras correctas por examen:", json.dumps(counters))
if errores:
    sys.exit(f"{errores} errores: no se escribió nada")

data = json.dumps(out, ensure_ascii=False, indent=2)
(ROOT / "preguntas_prueba.json").write_text(data, encoding="utf-8")
app_data = ROOT.parent / "app" / "src" / "data"
app_data.mkdir(parents=True, exist_ok=True)
(app_data / "questions.json").write_text(data, encoding="utf-8")
# la app ordena las salas según la taxonomía oficial
(app_data / "taxonomia.json").write_text(json.dumps({"taxonomia": TAXONOMIA, "reparto": REPARTO}, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK: {len(out)} preguntas")
