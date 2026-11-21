"""Genera content/preguntas_prueba.json y app/src/data/questions.json.

Reparte la letra correcta de forma pareja (A-D) y valida el formato:
- 4 opciones, una correcta
- la correcta no es la opción más larga en dificultad 3
- avisa si las opciones tienen longitudes muy dispares
"""
import json, random, sys, pathlib, importlib.util

ROOT = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("fuente", ROOT / "fuente_preguntas.py")
fuente = importlib.util.module_from_spec(spec); spec.loader.exec_module(fuente)

LETTERS = "ABCD"
PREFIX = {"ESSALUD": "ess", "ENAM": "enam", "SERUMS": "ser"}
rng = random.Random(20261121)

out, problems, counters = [], [], {}
by_exam = {}
for item in fuente.Q:
    by_exam.setdefault(item["exam"], []).append(item)

for exam, items in by_exam.items():
    slots = [LETTERS[i % 4] for i in range(len(items))]
    rng.shuffle(slots)
    for n, (item, letter) in enumerate(zip(items, slots), start=1):
        texts = [d[0] for d in item["distractores"]]
        assert len(texts) == 3, item["tema"]
        rng.shuffle(texts)
        idx = LETTERS.index(letter)
        ordered = texts[:idx] + [item["correcta"]] + texts[idx:]
        opciones = dict(zip(LETTERS, ordered))
        why = {t: w for t, w in item["distractores"]}
        por_que_no = {k: why[v] for k, v in opciones.items() if k != letter}
        lens = [len(v) for v in ordered]
        longest = max(lens)
        if item["dificultad"] == 3 and len(item["correcta"]) == longest and lens.count(longest) == 1:
            problems.append(f"{exam} '{item['tema']}': en dificultad 3 la correcta es la más larga")
        if longest > 2.2 * min(lens) and min(lens) > 6:
            problems.append(f"{exam} '{item['tema']}': longitudes dispares {lens}")
        counters.setdefault(exam, {l: 0 for l in LETTERS})[letter] += 1
        out.append({
            "id": f"{PREFIX[exam]}-{n:04d}",
            "examen": exam,
            "area": item["area"],
            "tema": item["tema"],
            "dificultad": item["dificultad"],
            "tipo": item["tipo"],
            "enunciado": item["enunciado"],
            "opciones": opciones,
            "correcta": letter,
            "explicacion": item["explicacion"],
            "por_que_no": por_que_no,
            "fuente": item["fuente"],
            "estado": "validada_ia",
        })

for p in problems:
    print("AVISO:", p)
print("Letras correctas por examen:", json.dumps(counters))
longest_correct = sum(1 for q in out if len(q["opciones"][q["correcta"]]) == max(len(v) for v in q["opciones"].values()))
print(f"Correcta = opción más larga (o empatada): {longest_correct}/{len(out)}")

data = json.dumps(out, ensure_ascii=False, indent=2)
(ROOT / "preguntas_prueba.json").write_text(data, encoding="utf-8")
app_data = ROOT.parent / "app" / "src" / "data"
app_data.mkdir(parents=True, exist_ok=True)
(app_data / "questions.json").write_text(data, encoding="utf-8")
print(f"OK: {len(out)} preguntas")
