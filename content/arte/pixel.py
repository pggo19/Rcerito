"""Mini motor de pixel art por capas para Rcerito.

Cada sprite es una lista de capas. Una capa es un dict {(x, y): color}.
Al componer, cada capa recibe su propio contorno oscuro (estilo Game Boy
Color / GBA), así las piezas (cabeza, mandil, estetoscopio) se leen
separadas y los accesorios se pueden apilar en la app.
"""
from PIL import Image

N = 32
OUT = (30, 42, 58, 255)          # contorno: tinta #1E2A3A de la app


def hexa(h, a=255):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


class Capa(dict):
    def __init__(self, contorno=True):
        super().__init__()
        self.contorno = contorno

    def px(self, x, y, c):
        if 0 <= x < N and 0 <= y < N:
            self[(x, y)] = c
        return self

    def elipse(self, cx, cy, rx, ry, c):
        for y in range(N):
            for x in range(N):
                if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1:
                    self[(x, y)] = c
        return self

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px(x, y, c)
        return self

    def mapa(self, x0, y0, filas, paleta):
        for j, fila in enumerate(filas):
            for i, ch in enumerate(fila):
                if ch != '.' and ch != ' ':
                    self.px(x0 + i, y0 + j, paleta[ch])
        return self

    def recolor_dentro(self, otra, c, cond=None):
        """Pinta c en los píxeles de esta capa que también están en `otra`."""
        for k in list(self):
            if k in otra and (cond is None or cond(k)):
                self[k] = c
        return self

    def sombra(self, c, lado='abajo', grosor=1):
        """Sombrea el borde inferior/derecho de la propia forma."""
        pts = set(self)
        nuevo = {}
        for (x, y) in pts:
            for g in range(1, grosor + 1):
                if lado == 'abajo' and (x, y + g) not in pts:
                    nuevo[(x, y)] = c
                if lado == 'derecha' and (x + g, y) not in pts:
                    nuevo[(x, y)] = c
        self.update(nuevo)
        return self

    def brillo(self, c):
        pts = set(self)
        for (x, y) in list(pts):
            if (x, y - 1) not in pts and (x - 1, y) in pts and (x + 1, y) in pts:
                self[(x, y)] = c
        return self


def contorno(capa):
    borde = {}
    for (x, y) in capa:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            k = (x + dx, y + dy)
            if k not in capa and 0 <= k[0] < N and 0 <= k[1] < N:
                borde[k] = OUT
    return borde


def componer(capas):
    lienzo = {}
    for capa in capas:
        if capa is None:
            continue
        if getattr(capa, 'contorno', True):
            for k, v in contorno(capa).items():
                lienzo[k] = v
        lienzo.update(capa)
    return lienzo


def a_imagen(lienzo, escala=8, fondo=None):
    img = Image.new('RGBA', (N, N), fondo or (0, 0, 0, 0))
    for (x, y), c in lienzo.items():
        img.putpixel((x, y), c)
    return img.resize((N * escala, N * escala), Image.NEAREST)


def a_svg(lienzo):
    rects = []
    for (x, y), c in sorted(lienzo.items(), key=lambda t: (t[0][1], t[0][0])):
        rects.append(f'<rect x="{x}" y="{y}" width="1.02" height="1.02" fill="#{c[0]:02x}{c[1]:02x}{c[2]:02x}"/>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">'
            + ''.join(rects) + '</svg>')
