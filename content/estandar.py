"""Estándar de preguntas de Rcerito.

Una sola fuente de verdad para el formato, la taxonomía por examen y las reglas
de calidad. La usan build_questions.py (preguntas de prueba) e importar.py
(lotes generados por IA). Ver docs/ESTANDAR_PREGUNTAS.md.
"""
import re

LETRAS = ("A", "B", "C", "D")  # los tres exámenes usan 4 alternativas y una sola correcta

EXAMENES = ("ESSALUD", "ENAM", "SERUMS")
PREFIJO_ID = {"ESSALUD": "ess", "ENAM": "enam", "SERUMS": "ser"}

# ENAM y EsSalud comparten la taxonomía de la tabla de especificaciones del ENAM (ASPEFAM).
_CLINICA = {
    "Medicina": [
        "Infecciosas", "Respiratorio", "Cardiovascular", "Digestivo", "Neurología",
        "Endocrino y metabolismo", "Reumatología", "Salud mental", "Nefrología",
        "Dermatología", "Hematología",
    ],
    "Pediatría": ["Neonatología", "Niño y adolescente", "Emergencias pediátricas", "Ética en pediatría"],
    "Emergencias y cuidados críticos": [
        "Paro cardiorrespiratorio", "Shock", "Falla respiratoria", "Falla renal", "Falla hepática",
        "Falla endocrina", "Falla neurológica", "Trauma", "Medio interno", "Intoxicaciones",
    ],
    "Cirugía": [
        "Cirugía general", "Traumatología", "Urología", "Oftalmología", "Otorrinolaringología",
        "Tórax y cardiovascular", "Neurocirugía", "Cirugía pediátrica", "Quemados",
    ],
    "Ginecología y obstetricia": ["Ginecología", "Obstetricia", "Ética en ginecoobstetricia"],
    "Salud pública": ["Salud comunitaria", "Promoción y prevención", "Bioestadística y epidemiología"],
    "Ciencias básicas": ["Morfológicas", "Dinámicas"],
    "Ética, investigación y gestión": ["Ética", "Investigación", "Gestión"],
}

# SERUMS: los cinco bloques temáticos del MINSA.
_SERUMS = {
    "Salud pública": [
        "Conceptos básicos", "Epidemiología", "Bioestadística", "Vigilancia epidemiológica",
        "Determinantes de la salud", "Promoción de la salud", "Promoción y prevención", "Salud ocupacional",
    ],
    "Cuidado integral de salud": [
        "Atención primaria de salud", "Salud materna", "Salud infantil", "Salud del adolescente",
        "Salud del adulto y adulto mayor", "Enfermedades metaxénicas", "Zoonosis", "Tuberculosis",
        "VIH e ITS", "Enfermedades no transmisibles", "Salud mental", "Emergencias en el primer nivel",
        "Inmunizaciones",
    ],
    "Ética e interculturalidad": ["Ética y deontología", "Derechos en salud", "Interculturalidad"],
    "Investigación": ["Metodología", "Diseños de estudio", "Ética en investigación"],
    "Gestión de servicios de salud": [
        "Sistema de salud", "Referencia y contrarreferencia", "Calidad", "Planificación", "Aseguramiento",
    ],
}

TAXONOMIA = {"ESSALUD": _CLINICA, "ENAM": _CLINICA, "SERUMS": _SERUMS}

# Reparto objetivo por cada 100 preguntas generadas.
REPARTO = {
    # ENAM: proporción de la tabla de especificaciones (180 preguntas).
    "ENAM": {
        "Medicina": 22, "Pediatría": 19, "Emergencias y cuidados críticos": 9, "Cirugía": 17,
        "Ginecología y obstetricia": 17, "Salud pública": 8, "Ciencias básicas": 5,
        "Ética, investigación y gestión": 3,
    },
    # EsSalud no publica tabla de especificaciones: se usa la del ENAM hasta tener una oficial.
    "ESSALUD": {
        "Medicina": 22, "Pediatría": 19, "Emergencias y cuidados críticos": 9, "Cirugía": 17,
        "Ginecología y obstetricia": 17, "Salud pública": 8, "Ciencias básicas": 5,
        "Ética, investigación y gestión": 3,
    },
    # SERUMS: provisional; ajustar con los contenidos temáticos de medicina del MINSA.
    "SERUMS": {
        "Salud pública": 30, "Cuidado integral de salud": 40, "Ética e interculturalidad": 10,
        "Investigación": 10, "Gestión de servicios de salud": 10,
    },
}

# Nombres de área que usa el banco generado en el Drive (lotes *_lote_NNN.json) → área oficial.
# Se compara sin tildes ni mayúsculas, así "Salud Pública" y "salud publica" caen en el mismo sitio.
AREA_ALIAS = {
    "ESSALUD": {
        "medicina interna": "Medicina", "cirugia general": "Cirugía", "gineco-obstetricia": "Ginecología y obstetricia",
        "ginecoobstetricia": "Ginecología y obstetricia", "emergencias": "Emergencias y cuidados críticos",
    },
    "ENAM": {
        "medicina interna": "Medicina", "cirugia general": "Cirugía", "gineco-obstetricia": "Ginecología y obstetricia",
        "ginecoobstetricia": "Ginecología y obstetricia", "emergencias": "Emergencias y cuidados críticos",
    },
    "SERUMS": {},
}


def _llave(texto: str) -> str:
    import unicodedata
    t = unicodedata.normalize("NFKD", str(texto).strip().lower())
    return "".join(c for c in t if not unicodedata.combining(c))


def area_oficial(examen: str, area: str) -> str:
    """Devuelve el nombre oficial del área (taxonomía) o el original si no hay equivalencia."""
    tax = TAXONOMIA.get(examen, {})
    k = _llave(area)
    for oficial in tax:
        if _llave(oficial) == k:
            return oficial
    return AREA_ALIAS.get(examen, {}).get(k, area)


ESTADOS = ("borrador", "validada_ia", "revisada_medico", "descartada")
PUBLICABLES = ("validada_ia", "revisada_medico")
TIPOS = ("caso_clinico", "directa")
ID_RE = re.compile(r"^(ess|enam|ser)-[a-z0-9-]{1,40}$")


def validar(q: dict) -> tuple[list[str], list[str]]:
    """Devuelve (errores, avisos). Con errores, la pregunta no entra a la app."""
    err, warn = [], []
    req = ["id", "examen", "area", "subarea", "tema", "dificultad", "tipo", "enunciado",
           "opciones", "correcta", "explicacion", "por_que_no", "fuente", "estado"]
    for k in req:
        if k not in q or q[k] in (None, ""):
            err.append(f"falta '{k}'")
    if err:
        return err, warn

    ex = q["examen"]
    if ex not in EXAMENES:
        err.append(f"examen '{ex}' no es ESSALUD, ENAM ni SERUMS")
        return err, warn
    if not ID_RE.match(q["id"]) or not q["id"].startswith(PREFIJO_ID[ex] + "-"):
        err.append(f"id '{q['id']}' debe empezar con '{PREFIJO_ID[ex]}-' y usar minúsculas, números y guiones")
    tax = TAXONOMIA[ex]
    if q["area"] not in tax:
        err.append(f"área '{q['area']}' no existe para {ex}")
    elif q["subarea"] not in tax[q["area"]]:
        # la sala depende del área; una subárea libre (p. ej. "Cardiología") no impide publicar
        warn.append(f"subárea '{q['subarea']}' fuera de la lista de '{q['area']}'")
    if q["dificultad"] not in (1, 2, 3):
        err.append("dificultad debe ser 1, 2 o 3")
    if q["tipo"] not in TIPOS:
        err.append("tipo debe ser caso_clinico o directa")
    if q["estado"] not in ESTADOS:
        err.append(f"estado '{q['estado']}' no válido")

    op = q["opciones"]
    if not isinstance(op, dict) or sorted(op) != list(LETRAS):
        err.append("opciones debe tener exactamente A, B, C y D")
        return err, warn
    if any(not str(v).strip() for v in op.values()):
        err.append("hay una opción vacía")
    if len({str(v).strip().lower() for v in op.values()}) < 4:
        err.append("hay opciones repetidas")
    if q["correcta"] not in LETRAS:
        err.append("correcta debe ser A, B, C o D")
        return err, warn
    pq = q["por_que_no"]
    otras = sorted(l for l in LETRAS if l != q["correcta"])
    if not isinstance(pq, dict) or sorted(pq) != otras:
        err.append(f"por_que_no debe explicar exactamente {', '.join(otras)}")
    f = q["fuente"]
    if not isinstance(f, dict) or not f.get("documento") or not isinstance(f.get("anio"), int):
        err.append("fuente necesita documento y anio (número)")

    lens = [len(str(op[l])) for l in LETRAS]
    correcta_len = len(str(op[q["correcta"]]))
    if correcta_len == max(lens) and lens.count(max(lens)) == 1 and q["dificultad"] == 3:
        err.append("dificultad 3: la correcta no puede ser la opción más larga")
    if min(lens) > 6 and max(lens) > 2.2 * min(lens):
        warn.append(f"longitudes de opciones dispares {lens}")
    if q["tipo"] == "caso_clinico" and len(q["enunciado"]) < 120:
        warn.append("caso clínico muy corto (menos de 120 caracteres)")
    if len(q["enunciado"]) > 900:
        warn.append("enunciado muy largo (más de 900 caracteres)")
    if not f.get("url"):
        warn.append("fuente sin url")
    return err, warn
