"""Valida un lote de preguntas (generado por IA o a mano) y lo carga a Rcerito.

Uso:
  python3 content/importar.py lote.json              # solo valida y reporta
  python3 content/importar.py lote.json --sql        # además escribe lote.sql para pegar en el SQL Editor de Supabase
  python3 content/importar.py lote.json --subir      # sube directo (necesita SUPABASE_SERVICE_ROLE_KEY)

El lote puede ser una lista JSON, un objeto {"preguntas": [...]}, o JSONL (una pregunta por línea).
Las preguntas que pasan quedan en lote.validas.json; las que no, en lote.rechazadas.json con sus errores.
Solo las preguntas con estado validada_ia o revisada_medico aparecen en la app.
"""
import argparse
import json
import os
import pathlib
import re
import sys
import unicodedata
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estandar import LETRAS, validar  # noqa: E402

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://aoqgwvrdhsiezjvandun.supabase.co")


def cargar(path: pathlib.Path) -> list[dict]:
    texto = path.read_text(encoding="utf-8").strip()
    if not texto:
        return []
    if texto[0] in "[{":
        data = json.loads(texto)
        return data["preguntas"] if isinstance(data, dict) else data
    return [json.loads(l) for l in texto.splitlines() if l.strip()]


def normalizar(q: dict) -> dict:
    q = {k: (v.strip() if isinstance(v, str) else v) for k, v in q.items()}
    for k in ("examen", "correcta"):
        if isinstance(q.get(k), str):
            q[k] = q[k].upper()
    if isinstance(q.get("dificultad"), str) and q["dificultad"].isdigit():
        q["dificultad"] = int(q["dificultad"])
    if isinstance(q.get("opciones"), list) and len(q["opciones"]) == 4:
        q["opciones"] = dict(zip(LETRAS, q["opciones"]))
    if isinstance(q.get("opciones"), dict):
        q["opciones"] = {k.strip().upper(): str(v).strip() for k, v in q["opciones"].items()}
    if isinstance(q.get("por_que_no"), dict):
        q["por_que_no"] = {k.strip().upper(): str(v).strip() for k, v in q["por_que_no"].items()}
    f = q.get("fuente")
    if isinstance(f, dict) and isinstance(f.get("anio"), str) and f["anio"].isdigit():
        f["anio"] = int(f["anio"])
    q.setdefault("estado", "borrador")
    return q


def huella(texto: str) -> str:
    t = unicodedata.normalize("NFKD", texto.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("lote", type=pathlib.Path)
    ap.add_argument("--sql", action="store_true", help="escribir un .sql para el SQL Editor de Supabase")
    ap.add_argument("--subir", action="store_true", help="subir a Supabase con la service role key")
    ap.add_argument("--estado", choices=["borrador", "validada_ia", "revisada_medico"], help="forzar el estado de todo el lote")
    args = ap.parse_args()

    preguntas = [normalizar(q) for q in cargar(args.lote)]
    validas, rechazadas, vistos_id, vistos_txt = [], [], set(), set()
    avisos = 0
    for q in preguntas:
        if args.estado:
            q["estado"] = args.estado
        err, warn = validar(q)
        if q.get("id") in vistos_id:
            err.append("id repetido en el lote")
        h = huella(str(q.get("enunciado", "")))
        if h and h in vistos_txt:
            err.append("enunciado duplicado en el lote")
        for w in warn:
            avisos += 1
            print(f"aviso  {q.get('id', '?')}: {w}")
        if err:
            rechazadas.append({**q, "_errores": err})
            print(f"RECHAZADA {q.get('id', '?')}: {'; '.join(err)}")
        else:
            validas.append(q)
            vistos_id.add(q["id"])
            vistos_txt.add(h)

    # equilibrio del lote: la letra correcta y la opción más larga no deben delatar la respuesta
    if validas:
        n = len(validas)
        letras = {l: sum(q["correcta"] == l for q in validas) for l in LETRAS}
        larga = sum(len(q["opciones"][q["correcta"]]) == max(len(v) for v in q["opciones"].values()) for q in validas)
        print(f"\nLetras correctas: {letras}")
        if max(letras.values()) > 0.35 * n and n >= 20:
            print("AVISO DEL LOTE: una letra concentra más del 35 % de las respuestas")
        print(f"La correcta es la opción más larga en {larga}/{n} ({round(100 * larga / n)} %; lo esperable es cerca de 25 %)")
        if larga > 0.35 * n and n >= 20:
            print("AVISO DEL LOTE: la opción más larga delata la respuesta")
        por_area = {}
        for q in validas:
            por_area.setdefault(q["examen"], {}).setdefault(q["area"], 0)
            por_area[q["examen"]][q["area"]] += 1
        print("Reparto por examen y área:", json.dumps(por_area, ensure_ascii=False))

    base = args.lote.with_suffix("")
    pathlib.Path(f"{base}.validas.json").write_text(json.dumps(validas, ensure_ascii=False, indent=2), encoding="utf-8")
    pathlib.Path(f"{base}.rechazadas.json").write_text(json.dumps(rechazadas, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{len(validas)} válidas, {len(rechazadas)} rechazadas, {avisos} avisos (de {len(preguntas)})")

    filas = [
        {
            "id": q["id"], "exam": q["examen"], "area": q["area"], "subarea": q["subarea"], "tema": q["tema"],
            "dificultad": q["dificultad"], "tipo": q["tipo"], "enunciado": q["enunciado"], "opciones": q["opciones"],
            "correcta": q["correcta"], "explicacion": q["explicacion"], "por_que_no": q["por_que_no"],
            "fuente": q["fuente"], "estado": q["estado"],
        }
        for q in validas
    ]

    if args.sql and filas:
        payload = json.dumps(filas, ensure_ascii=False)
        tag = "$rc$"
        assert tag not in payload
        cols = "id, exam, area, subarea, tema, dificultad, tipo, enunciado, opciones, correcta, explicacion, por_que_no, fuente, estado"
        tipos = ("id text, exam text, area text, subarea text, tema text, dificultad smallint, tipo text, enunciado text, "
                 "opciones jsonb, correcta text, explicacion text, por_que_no jsonb, fuente jsonb, estado text")
        upd = ", ".join(f"{c}=excluded.{c}" for c in cols.split(", ")[1:])
        sql = (f"insert into public.questions ({cols})\nselect {cols}\nfrom jsonb_to_recordset({tag}{payload}{tag}::jsonb) as x({tipos})\n"
               f"on conflict (id) do update set {upd};\n")
        pathlib.Path(f"{base}.sql").write_text(sql, encoding="utf-8")
        print(f"SQL listo: {base}.sql (pégalo en Supabase > SQL Editor)")

    if args.subir and filas:
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not key:
            sys.exit("Falta SUPABASE_SERVICE_ROLE_KEY (Supabase > Project Settings > API Keys > secret). No la subas al repo.")
        for i in range(0, len(filas), 500):
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/questions?on_conflict=id",
                data=json.dumps(filas[i:i + 500], ensure_ascii=False).encode(),
                method="POST",
                headers={
                    "apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates,return=minimal",
                },
            )
            with urllib.request.urlopen(req) as r:
                print(f"Subidas {min(i + 500, len(filas))}/{len(filas)} (HTTP {r.status})")

    sys.exit(1 if rechazadas and not validas else 0)


if __name__ == "__main__":
    main()
