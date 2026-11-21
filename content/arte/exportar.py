"""Exporta los sprites de Rcerito por capas para la app.

    python3 content/arte/exportar.py

Genera PNG de 32×32 (1 px = 1 píxel) en app/src/assets/pixel/. La app los
apila con <img> en este orden y los escala sin suavizar:

  Avatar: fondo · pelo_atras · piernas · ropa (slot cuerpo) · piel · pelo_frente
          · espalda · cuello · cara · cabeza · mano
  Uku:    fondo · etapaN · cuerpo · espalda · cuello · cara · cabeza · mano

Cada capa trae su propio contorno, así que apilar imágenes da el mismo
resultado que componer en Python.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image  # noqa: E402
from pixel import Capa, componer, hexa as H, contorno  # noqa: E402
import uku as U  # noqa: E402

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(RAIZ, 'app', 'src', 'assets', 'pixel')

ORO_SH = H('#c98f1f')
PAJA, PAJA_SH, CAFE = H('#e6c37a'), H('#c49a4a'), H('#7a4b2a')
BLANCO = U.BLANCO
NEGRO = H('#2b2f3a')
ARCOIRIS = [U.ROJO, U.NARANJA, U.AMARILLO, U.VERDE, U.CELESTE, U.MORADO]


def png(lienzo_o_capas, ruta, w=32, h=32):
    if isinstance(lienzo_o_capas, list):
        lienzo = componer(lienzo_o_capas)
    else:
        lienzo = lienzo_o_capas
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for (x, y), c in lienzo.items():
        if 0 <= x < w and 0 <= y < h:
            img.putpixel((x, y), c)
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    img.save(ruta, optimize=True)


# ------------------------------------------------------------- geometrías
G_AVATAR = dict(cab_cy=11.5, cab_rx=8.2, cab_ry=8.6, ojo_y=12.5, cuerpo_cy=26, cuerpo_rx=7.2, cuerpo_ry=5.6, boca_y=16)


def g_uku(etapa):
    g = dict(U.uku_base(etapa)['geo'])
    g['boca_y'] = int(g['cab_cy'] + 2.6)
    return g


def g_cabeza(g, quien):
    """Para gorros: el avatar lleva el gorro un poco más arriba y ancho."""
    if quien == 'avatar':
        return dict(g, cab_cy=g['cab_cy'] - 0.5, cab_rx=g['cab_rx'] + 0.4)
    return g


def mano(g):
    return round(16 + g['cuerpo_rx'] - 0.6), round(g['cuerpo_cy'] + 2.6)


def tope_cuerpo(g):
    return int(g['cuerpo_cy'] - g['cuerpo_ry']) + 1


# ------------------------------------------------------------- piezas nuevas
def sombrero_selva(g):
    c = Capa()
    cy, rx, ry = g['cab_cy'], g['cab_rx'], g['cab_ry']
    ala_y = cy - ry * 0.45
    copa = Capa().elipse(16, cy - ry + 2.2, rx - 2.5, 3.4, PAJA)
    for k, v in copa.items():
        if k[1] <= ala_y:
            c[k] = v
    c.elipse(16, ala_y, rx + 3, 1.6, PAJA)
    for x in range(int(16 - rx + 2), int(16 + rx - 1)):
        if (x, int(ala_y) - 1) in c:
            c[(x, int(ala_y) - 1)] = CAFE
    c.sombra(PAJA_SH, 'abajo')
    return [c]


def lampara_frontal(g):
    c = Capa()
    y = int(g['cab_cy'] - g['cab_ry'] * 0.55)
    for x in range(int(16 - g['cab_rx']) + 1, int(16 + g['cab_rx'])):
        c.px(x, y, NEGRO)
    c.rect(14, y - 1, 17, y + 1, U.GRIS)
    c.rect(15, y - 1, 16, y, U.AMARILLO)
    return [c]


def birrete(g):
    cy, rx, ry = g['cab_cy'], g['cab_rx'], g['cab_ry']
    tope = int(cy - ry)
    gorro = Capa()
    base = Capa().elipse(16, cy - 1, rx + 0.2, ry, NEGRO)
    for k in base:
        if k[1] <= cy - 4.5:
            gorro[k] = NEGRO
    tabla = Capa().rect(int(16 - rx) - 1, tope - 1, int(16 + rx) + 1, tope, H('#363c4a'))
    borla = Capa(contorno=False)
    for i in range(5):
        borla.px(int(16 + rx) - 1, tope + 1 + i, U.AMARILLO)
    borla.px(16, tope - 1, U.AMARILLO).px(17, tope - 1, U.AMARILLO)
    return [gorro, tabla, borla]


def lentes_proteccion(g):
    y = g['ojo_y']
    marco = Capa(contorno=False)
    lente = Capa(contorno=False)
    x0, x1 = int(16 - g['cab_rx']) + 2, int(16 + g['cab_rx']) - 2
    for x in range(x0, x1 + 1):
        marco.px(x, int(y) - 3, NEGRO).px(x, int(y) + 2, NEGRO)
    for yy in range(int(y) - 2, int(y) + 2):
        marco.px(x0, yy, NEGRO).px(x1, yy, NEGRO)
        for x in range(x0 + 1, x1):
            lente.px(x, yy, H('#bfe9f7', 110))
    marco.px(x0 - 1, int(y), NEGRO).px(x1 + 1, int(y), NEGRO)
    return [lente, marco]


def lupas(g):
    a = U.anteojos(g['ojo_y'], NEGRO)
    l = Capa()
    for cx in (11, 19):
        l.rect(cx, int(g['ojo_y']) + 1, cx + 1, int(g['ojo_y']) + 2, U.PLATA)
    return [a, l]


def anteojos_redondos(g):
    a = Capa(contorno=False)
    for cx in (12, 20):
        aro = Capa().elipse(cx, g['ojo_y'] + 0.5, 3.0, 2.7, NEGRO)
        hueco = Capa().elipse(cx, g['ojo_y'] + 0.5, 2.2, 1.9, NEGRO)
        for k in aro:
            if k not in hueco:
                a[k] = NEGRO
    a.px(15, int(g['ojo_y']), NEGRO).px(16, int(g['ojo_y']), NEGRO)
    return [a]


def bufanda(g):
    t = tope_cuerpo(g)
    c = Capa()
    franjas = [H('#e9d8c4'), H('#c8553d'), H('#e9d8c4'), H('#5b7f6e')]
    for y in range(t - 1, t + 2):
        for x in range(11, 21):
            c.px(x, y, franjas[(x + y) % len(franjas)])
    for y in range(t + 2, t + 7):
        for x in (18, 19):
            c.px(x, y, franjas[y % len(franjas)])
    return [c]


def panuelo(g):
    t = tope_cuerpo(g)
    c = Capa()
    for i, (a, b) in enumerate([(11, 20), (12, 19), (13, 18), (14, 17), (15, 16)]):
        for x in range(a, b + 1):
            c.px(x, t - 1 + i, U.ROJO)
    c.px(13, t, BLANCO).px(18, t, BLANCO).px(15, t + 2, BLANCO)
    return [c]


def estetoscopio_arcoiris(g):
    e = U.estetoscopio(g)
    tubo = [k for k, v in e.items() if v == U.GRIS]
    for i, k in enumerate(sorted(tubo, key=lambda p: (p[1], p[0]))):
        e[k] = ARCOIRIS[i % len(ARCOIRIS)]
    return [e]


def estetoscopio_cardio(g):
    e = U.estetoscopio(g, color=NEGRO, campana=U.PLATA)
    t = tope_cuerpo(g)
    e.rect(16, t + 7, 20, t + 9, U.PLATA).px(18, t + 8, NEGRO)
    return [e]


def mascarilla(g, color=U.CELESTE, raya=H('#9edcf7'), valvula=False):
    m = Capa()
    y = g['boca_y']
    m.rect(11, y, 20, y + 3, color).px(10, y + 1, color).px(21, y + 1, color)
    for x in range(11, 21):
        m.px(x, y + 1, raya)
    if valvula:
        m.rect(15, y + 1, 16, y + 2, U.GRIS)
    return [m]


def poncho(g):
    p = Capa()
    t = tope_cuerpo(g)
    franjas = [U.ROJO, U.ROJO, U.AMARILLO, U.ROJO, U.VERDE, U.ROJO, U.MORADO]
    for i, y in enumerate(range(t, 31)):
        ancho = min(4 + i, int(g['cuerpo_rx']) + 2)
        for x in range(16 - ancho, 16 + ancho):
            p.px(x, y, franjas[i % len(franjas)])
    return [p]


def tirantes(color):
    return lambda g: [U.mochila_tirantes(g, color)]


def tirantes_bordados(g):
    t = U.mochila_tirantes(g, U.ROJO)
    for i, k in enumerate(sorted(t, key=lambda p: p[1])):
        t[k] = ARCOIRIS[(k[1]) % len(ARCOIRIS)]
    return [t]


def en_mano(dibujo):
    def f(g):
        hx, hy = mano(g)
        return [dibujo(Capa(), hx, hy)]
    return f


def _cafe(c, x, y):
    return c.rect(x, y - 3, x + 2, y, BLANCO).rect(x, y - 3, x + 2, y - 3, CAFE).px(x + 3, y - 2, BLANCO)


def _linterna(c, x, y):
    return c.rect(x, y - 4, x, y, U.GRIS).px(x, y - 5, U.AMARILLO)


def _libreta(c, x, y):
    return c.rect(x - 1, y - 4, x + 2, y, U.AZUL).rect(x, y - 3, x + 1, y - 3, BLANCO)


def _martillo(c, x, y):
    return c.rect(x, y - 4, x, y, U.GRIS).rect(x - 1, y - 5, x + 2, y - 5, U.NARANJA).rect(x, y - 6, x + 1, y - 6, U.NARANJA)


def _otoscopio(c, x, y):
    return c.rect(x, y - 3, x + 1, y, NEGRO).rect(x - 1, y - 5, x + 2, y - 4, U.PLATA).px(x + 3, y - 5, U.PLATA)


def _tensiometro(c, x, y):
    c.elipse(x + 1.5, y - 2.5, 1.8, 1.8, BLANCO)
    return c.px(x + 1, y - 3, NEGRO).px(x + 1, y - 2, NEGRO).px(x - 1, y, NEGRO)


def _maletin(c, x, y):
    c.rect(x - 2, y - 4, x + 3, y, CAFE).rect(x, y - 5, x + 1, y - 5, CAFE)
    return c.px(x, y - 2, BLANCO).px(x + 1, y - 2, BLANCO).px(x, y - 3, BLANCO).px(x, y - 1, BLANCO)


def _corazon(c, x, y):
    return c.mapa(x - 1, y - 4, ['pp.pp', 'ppppp', 'ppppp', '.ppp.', '..p..'], {'p': U.ROSA})


def cuerpo(color, sombra, largo=False, abierto=False, encima=None, interior=None):
    def f(g, quien='avatar'):
        capas = [U.ropa_cuerpo(g, color, sombra, largo=largo, abierto=abierto, interior=interior)]
        if encima:
            capas += encima(g)
        if quien == 'uku':
            capas.append(U.manitos(g))
        return capas
    f.es_cuerpo = True
    return f


# id → (slot, dibujo). Los dibujos reciben la geometría (avatar o Uku de una etapa).
PIEZAS = {
    # cabeza
    'gorro_quirurgico_celeste': ('cabeza', lambda g: [U.gorro_quirurgico(g)]),
    'gorro_quirurgico_estampado': ('cabeza', lambda g: [U.gorro_quirurgico(g, U.MORADO, H('#6a3fae'), True)]),
    'gorra_brigada': ('cabeza', lambda g: [U.gorra_brigada(g)]),
    'chullo_andino': ('cabeza', lambda g: [U.chullo(g)]),
    'sombrero_selva': ('cabeza', sombrero_selva),
    'lampara_frontal': ('cabeza', lampara_frontal),
    'gorro_cirujano_dorado': ('cabeza', lambda g: [U.gorro_quirurgico(g, U.ORO, ORO_SH, True)]),
    'birrete': ('cabeza', birrete),
    # cara
    'mascarilla_quirurgica': ('cara', lambda g: mascarilla(g)),
    'mascarilla_n95': ('cara', lambda g: mascarilla(g, H('#f4f6f8'), H('#d8dee6'), valvula=True)),
    'lentes_proteccion': ('cara', lentes_proteccion),
    'lupas_cirujano': ('cara', lupas),
    'anteojos_redondos': ('cara', anteojos_redondos),
    # cuello
    'estetoscopio_clasico': ('cuello', lambda g: [U.estetoscopio(g)]),
    'estetoscopio_pediatrico': ('cuello', estetoscopio_arcoiris),
    'estetoscopio_cardio': ('cuello', estetoscopio_cardio),
    'estetoscopio_dorado': ('cuello', lambda g: [U.estetoscopio(g, color=U.ORO, campana=U.ORO)]),
    'fotocheck_interno': ('cuello', lambda g: [U.fotocheck(g)]),
    'fotocheck_dorado': ('cuello', lambda g: [U.fotocheck(g, U.ORO)]),
    'bufanda_alpaca': ('cuello', bufanda),
    'panuelo_rojo': ('cuello', panuelo),
    # cuerpo
    'polo_campus': ('cuerpo', cuerpo(U.CELESTE, U.CELESTE_SH)),
    'mandil_blanco': ('cuerpo', cuerpo(U.MANDIL, U.MANDIL_SH, abierto=True)),
    'scrub_verde': ('cuerpo', cuerpo(H('#3f9b5a'), H('#2d7443'))),
    'scrub_vino': ('cuerpo', cuerpo(H('#9b2f4a'), H('#73203a'))),
    'scrub_azul': ('cuerpo', cuerpo(H('#2f4f8f'), H('#22396b'))),
    'mandil_largo': ('cuerpo', cuerpo(U.MANDIL, U.MANDIL_SH, largo=True, abierto=True)),
    'chaleco_brigada': ('cuerpo', cuerpo(U.SCRUB, U.SCRUB_SH, encima=lambda g: [U.chaleco(g)])),
    'poncho_andino': ('cuerpo', cuerpo(U.CELESTE, U.CELESTE_SH, encima=poncho)),
    # mano
    'cafe_guardia': ('mano', en_mano(_cafe)),
    'linterna_bolsillo': ('mano', en_mano(_linterna)),
    'libreta_guardia': ('mano', en_mano(_libreta)),
    'martillo_reflejos': ('mano', en_mano(_martillo)),
    'otoscopio': ('mano', en_mano(_otoscopio)),
    'tensiometro': ('mano', en_mano(_tensiometro)),
    'maletin_medico': ('mano', en_mano(_maletin)),
    'corazon_peluche': ('mano', en_mano(_corazon)),
    # espalda
    'mochila_campus': ('espalda', tirantes(U.ROJO)),
    'mochila_posta': ('espalda', tirantes(CAFE)),
    'mochila_bordada': ('espalda', tirantes_bordados),
    'mochilita_uku': ('espalda', tirantes(U.AMARILLO)),
}


def dibujar(item, g, quien):
    slot, f = PIEZAS[item]
    gg = g_cabeza(g, quien) if slot == 'cabeza' else g
    if getattr(f, 'es_cuerpo', False):
        return f(gg, quien)
    return f(gg)


# ------------------------------------------------------------- avatar por partes
PIELES = {'clara': U.PIELES['clara'], 'triguena': U.PIELES['trigueña'], 'morena': U.PIELES['morena'], 'oscura': U.PIELES['oscura']}
PEINADOS = ['corto', 'largo', 'mono', 'rizado', 'rapado']


def pelo(peinado, color):
    pel = H(U.CABELLOS[color])
    atras, frente = Capa(), Capa()
    if peinado == 'largo':
        atras.elipse(16, 13, 9.4, 10, pel).rect(7, 13, 24, 25, pel)
    if peinado == 'mono':
        atras.elipse(16, 2.8, 2.8, 2.4, pel)
    if peinado in ('corto', 'largo', 'mono'):
        frente.elipse(16, 8.2, 8.8, 5.6, pel)
        for (x, y) in list(frente):
            if y >= 9 and 11 <= x <= 20 or (y >= 11 and peinado != 'largo'):
                del frente[(x, y)]
        frente.rect(9, 9, 10, 10, pel).rect(21, 9, 22, 10, pel)
        for (x, y) in list(frente):
            if y >= 12 and peinado != 'largo':
                del frente[(x, y)]
    elif peinado == 'rizado':
        for cx, cy in ((9, 6), (12, 4), (16, 3.4), (20, 4), (23, 6), (8, 10), (24, 10), (14, 6.5), (18, 6.5)):
            frente.elipse(cx, cy, 2.6, 2.6, pel)
    elif peinado == 'rapado':
        frente.elipse(16, 7.6, 8.4, 4.6, pel)
        for (x, y) in list(frente):
            if y >= 7:
                del frente[(x, y)]
    return atras, frente


def piel(nombre):
    p, ps = H(PIELES[nombre][0]), H(PIELES[nombre][1])
    g = G_AVATAR
    manos = Capa()
    for cx in (16 - g['cuerpo_rx'] + 0.6, 16 + g['cuerpo_rx'] - 0.6):
        manos.elipse(cx, g['cuerpo_cy'] + 2.6, 1.5, 1.4, p)
    cuello = Capa(contorno=False).rect(14, 19, 17, 20, ps)
    orejas = Capa().elipse(7.6, 12.5, 1.6, 2, p).elipse(24.4, 12.5, 1.6, 2, p)
    cabeza = Capa().elipse(16, g['cab_cy'], g['cab_rx'], g['cab_ry'], p)
    rasgos = Capa(contorno=False)
    for x0 in (11, 19):
        rasgos.rect(x0, 12, x0 + 1, 14, U.OJO).px(x0, 12, BLANCO)
    rasgos.rect(9, 15, 10, 15, U.MEJILLA).rect(21, 15, 22, 15, U.MEJILLA)
    rasgos.px(14, 16, ps).px(17, 16, ps).rect(15, 17, 16, 17, ps)
    return [manos, cuello, orejas, cabeza, rasgos]


def piernas():
    pierna = H('#33405a')
    return [Capa().rect(12, 28, 14, 30, pierna).rect(17, 28, 19, 30, pierna),
            Capa().rect(11, 30, 14, 31, U.OJO).rect(17, 30, 20, 31, U.OJO)]


# ------------------------------------------------------------- fondos (64×40)
def fondo(id_):
    W, Hh = 64, 40
    L = {}

    def r(x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if 0 <= x < W and 0 <= y < Hh:
                    L[(x, y)] = c

    if id_ == 'fondo_campus':
        r(0, 0, 63, 27, H('#bfe8f5')); r(0, 28, 63, 39, H('#7cc96b')); r(0, 28, 63, 28, H('#5fa94f'))
        r(6, 14, 12, 27, H('#f4f7f8')); r(6, 12, 12, 13, H('#3c6e9e')); r(50, 18, 58, 27, H('#e8d9b5'))
        for x in (8, 10): r(x, 17, x, 18, H('#9fd3d9'))
        r(30, 30, 33, 39, H('#d9c28f'))
    elif id_ == 'fondo_noche_guardia':
        r(0, 0, 63, 39, H('#1d2747')); r(0, 30, 63, 39, H('#2a3358'))
        r(18, 8, 46, 30, H('#3a4673'))
        for x in range(21, 44, 4):
            for y in range(11, 28, 4):
                r(x, y, x + 1, y + 1, H('#ffd54a') if (x * y) % 3 else H('#556196'))
        r(30, 3, 33, 6, H('#d6335c')); r(31, 2, 32, 7, H('#d6335c'))
        for (x, y) in ((4, 4), (10, 9), (54, 5), (58, 12), (48, 2)): L[(x, y)] = H('#ffffff')
    elif id_ == 'fondo_sierra':
        r(0, 0, 63, 39, H('#9fd7f0'))
        for i in range(24):
            r(10 - i // 2 + 0, 6 + i, 10 + i // 2 + 10, 6 + i, H('#7c8a99'))
            r(40 - i // 2, 10 + i, 40 + i // 2 + 8, 10 + i, H('#6d7b8a'))
        r(14, 6, 17, 9, H('#ffffff')); r(43, 10, 45, 12, H('#ffffff'))
        r(0, 30, 63, 39, H('#8fbf5a')); r(26, 24, 36, 31, H('#e8d9b5')); r(25, 22, 37, 23, H('#c8553d'))
    elif id_ == 'fondo_selva':
        r(0, 0, 63, 39, H('#bfe8d0')); r(0, 32, 63, 39, H('#4fa3c7'))
        for x in range(0, 64, 9):
            r(x, 6, x + 7, 22, H('#2f7a3a')); r(x + 3, 22, x + 4, 31, H('#6b4530'))
        r(22, 24, 34, 31, H('#e8d9b5')); r(21, 22, 35, 23, H('#2f7a3a'))
    elif id_ == 'fondo_costa':
        r(0, 0, 63, 20, H('#f7a35c')); r(0, 8, 63, 14, H('#f08a4b')); r(26, 14, 37, 20, H('#ffd54a'))
        r(0, 21, 63, 29, H('#3b6fd8')); r(0, 30, 63, 39, H('#e6c37a'))
        for x in range(2, 64, 8): r(x, 24, x + 3, 24, H('#9edcf7'))
    elif id_ == 'fondo_aula_magna':
        r(0, 0, 63, 39, H('#6b3a2a')); r(0, 28, 63, 39, H('#a8714a'))
        r(8, 4, 55, 22, H('#2a5d4e')); r(10, 6, 53, 20, H('#3f8a70'))
        for x in range(4, 64, 10): r(x, 30, x + 6, 33, H('#7a4b2a'))
    elif id_ == 'fondo_aurora':
        r(0, 0, 63, 39, H('#10183a'))
        for i, c in enumerate(['#3ee0a8', '#2fb8c4', '#8f5bd6']):
            for x in range(64):
                y = 6 + i * 4 + (x // 6) % 3
                r(x, y, x, y + 2, H(c))
        r(0, 30, 63, 39, H('#1f2a4a')); r(20, 22, 44, 30, H('#2a3a66'))
        for (x, y) in ((5, 2), (14, 4), (50, 3), (60, 8), (33, 1)): L[(x, y)] = H('#ffffff')
    img = Image.new('RGBA', (W, Hh), (0, 0, 0, 0))
    for (x, y), c in L.items():
        img.putpixel((x, y), c)
    return img


FONDOS = ['fondo_campus', 'fondo_noche_guardia', 'fondo_sierra', 'fondo_selva', 'fondo_costa', 'fondo_aula_magna', 'fondo_aurora']


# ------------------------------------------------------------- insignias (12×12)
def insignia(color, cinta):
    c = Capa()
    c.rect(3, 0, 4, 4, cinta).rect(7, 0, 8, 4, cinta)
    c.elipse(6, 7.5, 3.6, 3.6, color)
    c.px(5, 6, BLANCO)
    lienzo = componer([c])
    img = Image.new('RGBA', (12, 12), (0, 0, 0, 0))
    for (x, y), v in lienzo.items():
        if 0 <= x < 12 and 0 <= y < 12:
            img.putpixel((x, y), v)
    return img


INSIGNIAS = {
    'insignia_hospital': (U.CELESTE, U.AZUL),
    'insignia_aula_magna': (U.ORO, U.ROJO),
    'insignia_posta': (U.VERDE, U.NARANJA),
    'insignia_racha_30': (U.NARANJA, U.AMARILLO),
}


def main():
    total = 0
    # Uku
    for e in (1, 2, 3, 4):
        png(U.uku(e), f'{OUT}/uku/etapa{e}.png'); total += 1
        for animo in ('feliz', 'triste'):
            png(U.uku(e, animo=animo), f'{OUT}/uku/etapa{e}_{animo}.png'); total += 1
        g = g_uku(e)
        for item, (slot, _) in PIEZAS.items():
            if item == 'anteojos_redondos':
                continue   # solo avatar
            png(dibujar(item, g, 'uku'), f'{OUT}/uku/{item}_{e}.png'); total += 1
    # Avatar
    png(piernas(), f'{OUT}/avatar/piernas.png'); total += 1
    for nombre in PIELES:
        png(piel(nombre), f'{OUT}/avatar/piel_{nombre}.png'); total += 1
    for p in PEINADOS:
        for color in U.CABELLOS:
            atras, frente = pelo(p, color)
            if atras:
                png([atras], f'{OUT}/avatar/pelo_atras_{p}_{color}.png'); total += 1
            if frente:
                png([frente], f'{OUT}/avatar/pelo_frente_{p}_{color}.png'); total += 1
    for item, (slot, _) in PIEZAS.items():
        if item in ('panuelo_rojo', 'corazon_peluche', 'mochilita_uku'):
            continue   # solo Uku
        png(dibujar(item, G_AVATAR, 'avatar'), f'{OUT}/avatar/{item}.png'); total += 1
    # Fondos e insignias
    for f in FONDOS:
        os.makedirs(f'{OUT}/fondos', exist_ok=True)
        fondo(f).save(f'{OUT}/fondos/{f}.png', optimize=True); total += 1
    for k, (c, cinta) in INSIGNIAS.items():
        os.makedirs(f'{OUT}/insignias', exist_ok=True)
        insignia(c, cinta).save(f'{OUT}/insignias/{k}.png', optimize=True); total += 1
    with open(f'{OUT}/piezas.json', 'w') as fh:
        json.dump({k: v[0] for k, v in PIEZAS.items()}, fh, ensure_ascii=False, indent=1)
    print(f'{total} sprites en {os.path.relpath(OUT, RAIZ)}')


if __name__ == '__main__':
    main()
