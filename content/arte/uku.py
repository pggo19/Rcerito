"""Uku joven (oso de anteojos) en 4 etapas + avatar humano + accesorios por capas."""
import json
import os
from pixel import Capa, componer, a_imagen, a_svg, hexa

H = hexa
FUR, FUR_HI, FUR_SH = H('#4b3439'), H('#6e5258'), H('#33232a')
CREMA, CREMA_SH = H('#f6dcae'), H('#ddb985')
OJO, BLANCO, MEJILLA, NARIZ = H('#1b1420'), H('#ffffff'), H('#ff9fb0'), H('#26181d')
TEAL, TEAL_SH = H('#21b3a4'), H('#16857a')
ORO = H('#f2b43c')
MANDIL, MANDIL_SH = H('#f7f9fb'), H('#c8d4df')
SCRUB, SCRUB_SH = H('#2bb5a8'), H('#1d8a80')
CELESTE, CELESTE_SH = H('#79cdf4'), H('#4fa6d3')
ROJO, ROJO_SH = H('#e8574b'), H('#b93c34')
GRIS, PLATA = H('#4b4f5c'), H('#d9dee6')
NARANJA, NARANJA_SH, REFLEJO = H('#f2793d'), H('#c95a26'), H('#fff3a3')
AZUL = H('#3b6fd8')
AMARILLO, MORADO, ROSA, VERDE = H('#ffd54a'), H('#8f5bd6'), H('#ff7aa8'), H('#5fcf6b')

OUT_DIR = os.path.join(os.path.dirname(__file__), 'sprites')


# ------------------------------------------------------------------ Uku
def uku_base(etapa, animo='normal'):
    """Cuerpo de Uku. Etapa 1 es un cachorro (cabeza grande, cuerpo chico);
    cada etapa crece un poco."""
    cab_cy = {1: 15, 2: 13.4, 3: 12.2, 4: 12.2}[etapa]
    cab_rx, cab_ry = {1: (9.8, 8.4), 2: (9.9, 8.5), 3: (9.6, 8.3), 4: (9.6, 8.3)}[etapa]
    cuerpo_ry = {1: 4.4, 2: 5.6, 3: 6.6, 4: 6.8}[etapa]
    cuerpo_rx = {1: 6.6, 2: 7.6, 3: 8.4, 4: 8.6}[etapa]
    cuerpo_cy = 31.5 - cuerpo_ry - 0.5

    orejas = Capa()
    for cx in (16 - cab_rx + 2.6, 16 + cab_rx - 2.6):
        orejas.elipse(cx, cab_cy - cab_ry + 2.5, 3, 3, FUR)
    interior = Capa(contorno=False)
    for cx in (16 - cab_rx + 2.6, 16 + cab_rx - 2.6):
        interior.elipse(cx, cab_cy - cab_ry + 2.7, 1.5, 1.5, CREMA_SH)

    cuerpo = Capa().elipse(16, cuerpo_cy, cuerpo_rx, cuerpo_ry, FUR)
    cuerpo.sombra(FUR_SH, 'abajo')
    panza = Capa(contorno=False).elipse(16, cuerpo_cy + 1, cuerpo_rx - 3.5, cuerpo_ry - 2, CREMA)
    brazos = Capa()
    for cx in (16 - cuerpo_rx + 0.8, 16 + cuerpo_rx - 0.8):
        brazos.elipse(cx, cuerpo_cy - 0.5, 2.2, 3.2, FUR)
    pies = Capa()
    for cx in (12, 20):
        pies.elipse(cx, 30.6, 2.6, 1.5, FUR)
    plantas = Capa(contorno=False)
    for cx in (12, 20):
        plantas.elipse(cx, 30.9, 1.4, 0.8, CREMA_SH)

    cabeza = Capa().elipse(16, cab_cy, cab_rx, cab_ry, FUR)
    cabeza.brillo(FUR_HI)
    tope = min(y for (_, y) in cabeza)
    cabeza.px(16, tope - 1, FUR).px(17, tope - 2, FUR).px(15, tope - 1, FUR_HI)  # mechoncito
    # manchas de "anteojos" del oso y hocico
    cara = Capa(contorno=False)
    ojo_y = cab_cy - 0.5
    for cx in (12, 20):
        cara.elipse(cx, ojo_y, 3.1, 2.9, CREMA)
    cara.elipse(16, cab_cy + 4.3, 4.6, 3.0, CREMA)
    cara.elipse(16, cab_cy + 5.2, 3.6, 1.6, CREMA_SH)
    # ojos grandes y brillantes (2x3) con brillo
    rasgos = Capa(contorno=False)
    oy = int(ojo_y - 1.5)
    for x0 in (11, 19):
        if animo == 'feliz':   # ojitos cerrados en arco ^ ^
            rasgos.px(x0, oy + 1, OJO).px(x0 + 1, oy + 1, OJO).px(x0 - 1, oy + 2, OJO).px(x0 + 2, oy + 2, OJO)
        else:
            rasgos.rect(x0, oy, x0 + 1, oy + 2, OJO)
            rasgos.px(x0, oy, BLANCO)
    if animo == 'triste':
        rasgos.px(10, oy + 3, CELESTE).px(10, oy + 4, CELESTE)
    ny = int(cab_cy + 3)
    rasgos.rect(15, ny, 16, ny, NARIZ).px(14, ny, NARIZ).px(17, ny, NARIZ)
    rasgos.rect(15, ny + 1, 16, ny + 1, NARIZ)
    if animo == 'triste':   # boquita hacia abajo
        rasgos.px(15, ny + 2, NARIZ).px(16, ny + 2, NARIZ).px(14, ny + 3, NARIZ).px(17, ny + 3, NARIZ)
    elif animo == 'feliz':  # boca abierta
        rasgos.px(14, ny + 2, NARIZ).px(17, ny + 2, NARIZ).rect(15, ny + 2, 16, ny + 3, H('#d9536a')).px(15, ny + 3, NARIZ).px(16, ny + 3, NARIZ)
        rasgos.px(14, ny + 2, NARIZ)
    else:
        rasgos.px(14, ny + 2, NARIZ).px(17, ny + 2, NARIZ).px(15, ny + 3, NARIZ).px(16, ny + 3, NARIZ)
    for x0 in (8, 22):
        rasgos.rect(x0, ny + 1, x0 + 1, ny + 1, MEJILLA)

    return dict(orejas=orejas, interior=interior, cuerpo=cuerpo, panza=panza, brazos=brazos,
                pies=pies, plantas=plantas, cabeza=cabeza, cara=cara, rasgos=rasgos,
                geo=dict(cab_cy=cab_cy, cab_rx=cab_rx, cab_ry=cab_ry, ojo_y=ojo_y,
                         cuerpo_cy=cuerpo_cy, cuerpo_rx=cuerpo_rx, cuerpo_ry=cuerpo_ry))


def anteojos(ojo_y, color=TEAL):
    a = Capa(contorno=False)
    for cx in (12, 20):
        aro = Capa().elipse(cx, ojo_y, 3.8, 3.4, color)
        hueco = Capa().elipse(cx, ojo_y, 2.9, 2.5, color)
        for k in aro:
            if k not in hueco:
                a[k] = color
    a.px(15, int(ojo_y) - 1, color).px(16, int(ojo_y) - 1, color)
    return a


# ----- prendas (sirven para Uku y, con otra geometría, para el avatar)
def ropa_cuerpo(g, color, sombra, largo=False, abierto=False, interior=None):
    c = Capa()
    c.elipse(16, g['cuerpo_cy'], g['cuerpo_rx'] + 0.3, g['cuerpo_ry'] + 0.2, color)
    if largo:
        c.rect(int(16 - g['cuerpo_rx'] + 1), int(g['cuerpo_cy']), int(16 + g['cuerpo_rx'] - 2), 30, color)
    # mangas
    for cx in (16 - g['cuerpo_rx'] + 0.8, 16 + g['cuerpo_rx'] - 0.8):
        c.elipse(cx, g['cuerpo_cy'] - 0.5, 2.4, 3.0, color)
    c.sombra(sombra, 'abajo')
    if abierto:
        top = int(g['cuerpo_cy'] - g['cuerpo_ry'])
        for y in range(top, 31):
            for x in (15, 16):
                if (x, y) in c:
                    c[(x, y)] = interior or SCRUB
        # solapas
        for i in range(3):
            c.px(14 - i, top + 1 + i, sombra).px(17 + i, top + 1 + i, sombra)
    return c


def manitos(g):
    m = Capa()
    for cx in (16 - g['cuerpo_rx'] + 0.6, 16 + g['cuerpo_rx'] - 0.6):
        m.elipse(cx, g['cuerpo_cy'] + 2.6, 1.6, 1.4, FUR)
    return m


def estetoscopio(g, color=GRIS, campana=PLATA):
    e = Capa(contorno=False)
    top = int(g['cuerpo_cy'] - g['cuerpo_ry']) + 1
    # tubo en U alrededor del cuello
    for i in range(4):
        e.px(12, top + i, color).px(19, top + i, color)
    e.px(13, top + 4, color).px(18, top + 4, color)
    e.px(18, top + 5, color).px(18, top + 6, color)
    e.rect(17, top + 7, 19, top + 8, campana)
    e.px(18, top + 9, campana)
    e.px(17, top + 7, color)
    return e


def mochila_tirantes(g, color=ROJO):
    t = Capa(contorno=False)
    top = int(g['cuerpo_cy'] - g['cuerpo_ry']) + 1
    for y in range(top, top + 7):
        t.px(11, y, color).px(20, y, color)
    return t


def fotocheck(g, color=AZUL):
    f = Capa()
    y = int(g['cuerpo_cy']) - 1
    f.rect(20, y, 21, y + 2, MANDIL).px(20, y, color).px(21, y, color)
    return f


def lapicero(g):
    p = Capa(contorno=False)
    y = int(g['cuerpo_cy']) - 1
    p.rect(11, y, 13, y + 2, MANDIL_SH)
    p.px(12, y - 1, AZUL).px(12, y, AZUL)
    return p


def chullo(g):
    c = Capa()
    cy, rx, ry = g['cab_cy'], g['cab_rx'], g['cab_ry']
    gorro = Capa().elipse(16, cy - 0.5, rx + 0.4, ry + 0.2, ROJO)
    franjas = [ROJO, AMARILLO, VERDE, ROJO, MORADO, AMARILLO, ROJO, ROSA, ROJO]
    tope = int(cy - ry - 0.5)
    for (x, y), _ in list(gorro.items()):
        if y <= cy - 3.5:
            c[(x, y)] = franjas[(y - tope) % len(franjas)]
    # rombitos
    for x in range(8, 25, 3):
        if (x, int(cy - 4)) in c:
            c[(x, int(cy - 4))] = BLANCO
    # orejeras
    for x0 in (int(16 - rx) , int(16 + rx) - 2):
        c.rect(x0, int(cy - 4), x0 + 2, int(cy + 1), ROJO)
        c.px(x0 + 1, int(cy + 2), ROJO)
    # pompón
    c.elipse(16, tope - 0.5, 1.8, 1.6, AMARILLO)
    return c


def gorro_quirurgico(g, color=CELESTE, sombra=CELESTE_SH, estampado=False):
    c = Capa()
    cy, rx, ry = g['cab_cy'], g['cab_rx'], g['cab_ry']
    gorro = Capa().elipse(16, cy - 1, rx + 0.3, ry, color)
    for k in gorro:
        if k[1] <= cy - 4:
            c[k] = color
    banda = int(cy - 4)
    for x in range(int(16 - rx), int(16 + rx) + 1):
        if (x, banda) in c:
            c[(x, banda)] = sombra
    if estampado:
        for (x, y) in list(c):
            if (x + y) % 4 == 0 and y < banda:
                c[(x, y)] = AMARILLO
    return c


def chaleco(g):
    v = Capa()
    v.elipse(16, g['cuerpo_cy'], g['cuerpo_rx'] - 0.8, g['cuerpo_ry'] + 0.1, NARANJA)
    for (x, y) in list(v):
        if x in (15, 16):
            del v[(x, y)]
    y = int(g['cuerpo_cy']) + 1
    for x in range(8, 25):
        if (x, y) in v:
            v[(x, y)] = REFLEJO
    v.sombra(NARANJA_SH, 'abajo')
    return v


# ----- las 4 etapas
ETAPAS = {
    1: ('Uku Estudiante', 'Internado EsSalud'),
    2: ('Uku Interno', 'Aprobó EsSalud · o empieza aquí si va al ENAM'),
    3: ('Uku Médico', 'Aprobó el ENAM · o empieza aquí si va al SERUMS'),
    4: ('Uku Serumista', 'Aprobó el SERUMS'),
}


def uku(etapa, extra=None, animo='normal'):
    b = uku_base(etapa, animo)
    g = b['geo']
    ropa, encima, cabeza_extra, lentes = [], [], [], anteojos(g['ojo_y'])
    if etapa == 1:
        ropa = [ropa_cuerpo(g, CELESTE, CELESTE_SH)]
        encima = [mochila_tirantes(g)]
    elif etapa == 2:
        ropa = [ropa_cuerpo(g, MANDIL, MANDIL_SH, abierto=True)]
        encima = [estetoscopio(g), fotocheck(g)]
    elif etapa == 3:
        ropa = [ropa_cuerpo(g, MANDIL, MANDIL_SH, largo=True, abierto=True)]
        encima = [estetoscopio(g, campana=ORO), lapicero(g)]
        lentes = anteojos(g['ojo_y'], ORO)
    elif etapa == 4:
        ropa = [ropa_cuerpo(g, SCRUB, SCRUB_SH)]
        encima = [chaleco(g), estetoscopio(g), mochila_tirantes(g, H('#7a4b2a'))]
        cabeza_extra = [chullo(g)]
    capas = [b['pies'], b['plantas'], b['cuerpo'], b['panza'], b['brazos']] + ropa + [manitos(g)] + encima + \
            [b['orejas'], b['interior'], b['cabeza'], b['cara'], b['rasgos'], lentes] + cabeza_extra
    if extra:
        capas += extra(g)
    return componer(capas)


# ------------------------------------------------------------------ Avatar humano
PIELES = {'clara': ('#f8d5b8', '#e2b293'), 'trigueña': ('#d9a47a', '#bb835a'),
          'morena': ('#a8714a', '#8a5937'), 'oscura': ('#6e4630', '#563321')}
CABELLOS = {'negro': '#231a1f', 'castano': '#5a3a26', 'rojizo': '#9c4a2a', 'rubio': '#e0b55a'}


def avatar(piel='trigueña', peinado='corto', color_pelo='negro', ropa='mandil', accesorios=()):
    p, ps = H(PIELES[piel][0]), H(PIELES[piel][1])
    pelo = H(CABELLOS[color_pelo])
    g = dict(cab_cy=11.5, cab_rx=8.2, cab_ry=8.6, ojo_y=12.5, cuerpo_cy=26, cuerpo_rx=7.2, cuerpo_ry=5.6)

    atras = Capa()
    if peinado == 'largo':
        atras.elipse(16, 13, 9.4, 10, pelo).rect(7, 13, 24, 25, pelo)
    if peinado == 'moño':
        atras.elipse(16, 2.8, 2.8, 2.4, pelo)

    piernas = Capa().rect(12, 28, 14, 30, H('#33405a')).rect(17, 28, 19, 30, H('#33405a'))
    zapatos = Capa().rect(11, 30, 14, 31, OJO).rect(17, 30, 20, 31, OJO)
    if ropa == 'mandil':
        cuerpo = ropa_cuerpo(g, MANDIL, MANDIL_SH, abierto=True)
    elif ropa == 'scrub':
        cuerpo = ropa_cuerpo(g, SCRUB, SCRUB_SH)
    else:
        cuerpo = ropa_cuerpo(g, CELESTE, CELESTE_SH)
    manos = Capa()
    for cx in (16 - g['cuerpo_rx'] + 0.6, 16 + g['cuerpo_rx'] - 0.6):
        manos.elipse(cx, g['cuerpo_cy'] + 2.6, 1.5, 1.4, p)
    cuello = Capa(contorno=False).rect(14, 19, 17, 20, ps)

    cabeza = Capa().elipse(16, g['cab_cy'], g['cab_rx'], g['cab_ry'], p)
    orejas = Capa().elipse(7.6, 12.5, 1.6, 2, p).elipse(24.4, 12.5, 1.6, 2, p)
    rasgos = Capa(contorno=False)
    for x0 in (11, 19):
        rasgos.rect(x0, 12, x0 + 1, 14, OJO).px(x0, 12, BLANCO)
    rasgos.rect(9, 15, 10, 15, MEJILLA).rect(21, 15, 22, 15, MEJILLA)
    rasgos.px(14, 16, ps).px(17, 16, ps).rect(15, 17, 16, 17, ps)  # sonrisa

    frente = Capa()
    if peinado in ('corto', 'largo', 'moño'):
        frente.elipse(16, 8.2, 8.8, 5.6, pelo)
        for (x, y) in list(frente):
            if y >= 9 and 11 <= x <= 20 or (y >= 11 and peinado != 'largo'):
                del frente[(x, y)]
        frente.rect(9, 9, 10, 10, pelo).rect(21, 9, 22, 10, pelo)
        for (x, y) in list(frente):
            if y >= 12 and peinado != 'largo':
                del frente[(x, y)]
    elif peinado == 'rizado':
        for cx, cy in ((9, 6), (12, 4), (16, 3.4), (20, 4), (23, 6), (8, 10), (24, 10), (14, 6.5), (18, 6.5)):
            frente.elipse(cx, cy, 2.6, 2.6, pelo)
    elif peinado == 'rapado':
        frente.elipse(16, 7.6, 8.4, 4.6, pelo)
        for (x, y) in list(frente):
            if y >= 7:
                del frente[(x, y)]
    if peinado != 'rapado':
        frente.brillo(H('#ffffff', 60) if False else pelo)

    capas = [atras, piernas, zapatos, cuerpo, manos, cuello, orejas, cabeza, rasgos, frente]
    for acc in accesorios:
        capas += ACCESORIOS_AVATAR[acc](g)
    return componer(capas)


def mascarilla(g, color=CELESTE):
    m = Capa()
    m.rect(11, 16, 20, 19, color).px(10, 17, color).px(21, 17, color)
    for x in range(11, 21):
        m.px(x, 17, H('#9edcf7'))
    return m


def gorra_brigada(g):
    c = Capa()
    c.elipse(16, 7, 8.8, 4.6, H('#2a7a4b'))
    for (x, y) in list(c):
        if y > 7:
            del c[(x, y)]
    c.rect(10, 8, 24, 8, H('#1f5d39'))
    c.rect(18, 8, 26, 9, H('#2a7a4b'))
    c.px(16, 5, REFLEJO).px(15, 5, REFLEJO)
    return c


ACCESORIOS_AVATAR = {
    'estetoscopio_clasico': lambda g: [estetoscopio(g)],
    'estetoscopio_dorado': lambda g: [estetoscopio(g, color=ORO, campana=ORO)],
    'gorro_quirurgico_celeste': lambda g: [gorro_quirurgico(dict(g, cab_cy=g['cab_cy'] - 0.5, cab_rx=g['cab_rx'] + 0.4))],
    'gorro_quirurgico_estampado': lambda g: [gorro_quirurgico(dict(g, cab_cy=g['cab_cy'] - 0.5, cab_rx=g['cab_rx'] + 0.4), MORADO, H('#6a3fae'), True)],
    'mascarilla_quirurgica': lambda g: [mascarilla(g)],
    'chullo_andino': lambda g: [chullo(dict(g, cab_cy=g['cab_cy'] - 0.5, cab_rx=g['cab_rx'] + 0.6, cab_ry=g['cab_ry']))],
    'gorra_brigada': lambda g: [gorra_brigada(g)],
    'fotocheck_interno': lambda g: [fotocheck(g)],
    'mochila_campus': lambda g: [mochila_tirantes(g)],
    'chaleco_brigada': lambda g: [chaleco(g)],
}


def guardar(nombre, lienzo, escala=8):
    os.makedirs(OUT_DIR, exist_ok=True)
    a_imagen(lienzo, escala).save(os.path.join(OUT_DIR, nombre + '.png'))
    with open(os.path.join(OUT_DIR, nombre + '.svg'), 'w') as f:
        f.write(a_svg(lienzo))


if __name__ == '__main__':
    for e in ETAPAS:
        guardar(f'uku_etapa{e}', uku(e))
    # Uku con accesorios de la tienda (sobre la etapa 2)
    guardar('uku_gorro_estampado', uku(2, extra=lambda g: [gorro_quirurgico(g, MORADO, H('#6a3fae'), True)]))
    guardar('uku_chullo', uku(2, extra=lambda g: [chullo(g)]))
    guardar('uku_estetoscopio_dorado', uku(3, extra=lambda g: [estetoscopio(g, color=ORO, campana=ORO)]))
    # Avatares de ejemplo
    ejemplos = {
        'avatar_1': dict(piel='trigueña', peinado='corto', color_pelo='negro', ropa='mandil', accesorios=['estetoscopio_clasico']),
        'avatar_2': dict(piel='clara', peinado='largo', color_pelo='castano', ropa='scrub', accesorios=['gorro_quirurgico_estampado']),
        'avatar_3': dict(piel='morena', peinado='rizado', color_pelo='negro', ropa='polo', accesorios=['mochila_campus']),
        'avatar_4': dict(piel='oscura', peinado='rapado', color_pelo='negro', ropa='scrub', accesorios=['chaleco_brigada', 'gorra_brigada', 'estetoscopio_clasico']),
        'avatar_5': dict(piel='trigueña', peinado='moño', color_pelo='rojizo', ropa='mandil', accesorios=['mascarilla_quirurgica', 'fotocheck_interno']),
        'avatar_6': dict(piel='clara', peinado='corto', color_pelo='rubio', ropa='mandil', accesorios=['chullo_andino', 'estetoscopio_dorado']),
    }
    for k, v in ejemplos.items():
        guardar(k, avatar(**v))
    with open(os.path.join(OUT_DIR, 'avatares.json'), 'w') as f:
        json.dump(ejemplos, f, ensure_ascii=False, indent=1)
    print('ok')


def tienda():
    """Miniaturas de la tienda: Uku (etapa 2) probándose cada ítem."""
    g2 = uku_base(2)['geo']
    piezas = {
        'tienda_gorro_celeste': lambda g: [gorro_quirurgico(g)],
        'tienda_gorro_estampado': lambda g: [gorro_quirurgico(g, MORADO, H('#6a3fae'), True)],
        'tienda_chullo': lambda g: [chullo(g)],
        'tienda_estetoscopio_dorado': lambda g: [estetoscopio(g, color=ORO, campana=ORO)],
        'tienda_chaleco': lambda g: [chaleco(g)],
        'tienda_gorra_brigada': lambda g: [gorra_brigada(g)],
    }
    for k, f in piezas.items():
        guardar(k, uku(2, extra=f))


if __name__ == '__main__':
    tienda()
