"""Wordmark PROVISIONAL de Maria Jose Ramos Castro, Abogada.

No hay logo: en las fotos del despacho no aparece ninguna marca, solo la
pared de diplomas. Asi que la identidad se construye con lo unico que hay
de verdad -- su nombre -- y con el gesto central del sitio: el marcador.
El wordmark es "Maria Jose Ramos Castro" en Lora (serif de texto legal)
convertido a trazados con fontTools, con el apellido "Ramos Castro"
resaltado por un trazo de marcador terracota que, como en un contrato
repasado a mano, se sale un poco por los bordes. Debajo, "ABOGADA" en
versalitas muy espaciadas.

PROVISIONAL: pendiente de recibir un archivo de logo real de la clienta.

Salida en assets/img/logo/:
  logo.svg          wordmark en tinta carbon (para fondo blanco roto)
  logo-claro.svg    wordmark en blanco roto (para fondo carbon)
  marca.svg         solo el monograma MJ con su marcador (sello / sobre fondo)
  icon.svg          cuadrado con el monograma, para favicon
  (los PNG y og.png los rasteriza scripts/generate_icons.js)

Uso: python scripts/generate_brand.py   (descarga Lora a %TEMP%/fonts)
"""
import os
import urllib.request

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "img", "logo")
os.makedirs(OUT, exist_ok=True)

FONT_DIR = os.path.join(os.environ.get("TEMP", "/tmp"), "fonts")
os.makedirs(FONT_DIR, exist_ok=True)
FONT_URL = "https://github.com/google/fonts/raw/main/ofl/lora/Lora%5Bwght%5D.ttf"
FONT_PATH = os.path.join(FONT_DIR, "Lora[wght].ttf")

CARBON = "#2B2A28"
BLANCO = "#FAF8F6"
ROSA = "#E8D5CC"
MARCA = "#CB7F5E"
TERRACOTA = "#A85E3F"


def fuente(peso):
    if not os.path.exists(FONT_PATH):
        urllib.request.urlretrieve(FONT_URL, FONT_PATH)
    f = TTFont(FONT_PATH)
    return instantiateVariableFont(f, {"wght": peso}, inplace=False, updateFontNames=False)


class Tipografia(object):
    """Compone una linea de texto en trazados SVG, con tracking opcional."""

    def __init__(self, peso):
        self.font = fuente(peso)
        self.upm = self.font["head"].unitsPerEm
        self.glyphset = self.font.getGlyphSet()
        self.cmap = self.font.getBestCmap()
        self.hmtx = self.font["hmtx"]
        self.kern = None
        if "kern" in self.font:
            try:
                self.kern = self.font["kern"].kernTables[0].kernTable
            except Exception:
                self.kern = None

    def nombre_glifo(self, ch):
        return self.cmap.get(ord(ch))

    def linea(self, texto, tam, tracking=0.0):
        """Devuelve (lista de trazados 'd', ancho total) a escala `tam` px/em."""
        esc = tam / float(self.upm)
        x = 0.0
        trazos = []
        anterior = None
        for ch in texto:
            g = self.nombre_glifo(ch)
            if g is None:
                x += tam * 0.3
                anterior = None
                continue
            if anterior and self.kern:
                x += self.kern.get((anterior, g), 0) * esc
            pen = SVGPathPen(self.glyphset)
            self.glyphset[g].draw(pen)
            d = pen.getCommands()
            if d:
                trazos.append((d, x, esc))
            x += self.hmtx[g][0] * esc + tracking * tam
            anterior = g
        return trazos, x

    @staticmethod
    def a_svg(trazos, color):
        partes = []
        for d, x, esc in trazos:
            partes.append(
                '<path transform="translate(%.3f 0) scale(%.6f -%.6f)" d="%s" fill="%s"/>'
                % (x, esc, esc, d, color)
            )
        return "".join(partes)


def trazo_marcador(x0, x1, y, grosor, color, opacidad, semilla=0):
    """Un barrido de rotulador: se pasa por los extremos y no es del todo recto."""
    dx = x1 - x0
    desborde = grosor * 0.42
    a = x0 - desborde
    b = x1 + desborde * 1.5
    onda = grosor * 0.09
    d = ("M %.2f %.2f C %.2f %.2f, %.2f %.2f, %.2f %.2f"
         % (a, y + onda * (1 if semilla % 2 else -1),
            a + dx * 0.33, y - onda,
            a + dx * 0.68, y + onda,
            b, y - onda * 0.6))
    return ('<path d="%s" fill="none" stroke="%s" stroke-width="%.2f" '
            'stroke-linecap="round" opacity="%.2f"/>' % (d, color, grosor, opacidad))


def construir_wordmark(tinta, marca=MARCA, opacidad=0.42, con_marca=True):
    lora = Tipografia(500)
    tam = 100.0
    nombre_a = "María José "
    nombre_b = "Ramos Castro"

    tr_a, an_a = lora.linea(nombre_a, tam)
    tr_b, an_b = lora.linea(nombre_b, tam)

    sub = Tipografia(600)
    tam_sub = 25.0
    tr_c, an_c = sub.linea("ABOGADA", tam_sub, tracking=0.44)

    ancho = max(an_a + an_b, an_c)
    linea_base = 100.0
    base_sub = linea_base + 52.0
    alto = base_sub + 26.0
    pad = 14.0

    piezas = []
    if con_marca:
        piezas.append(trazo_marcador(
            an_a - tam * 0.02, an_a + an_b, linea_base - tam * 0.26,
            tam * 0.70, marca, opacidad, 1))
    piezas.append('<g transform="translate(0 %.2f)">%s</g>'
                  % (linea_base, Tipografia.a_svg(tr_a, tinta)))
    piezas.append('<g transform="translate(%.2f %.2f)">%s</g>'
                  % (an_a, linea_base, Tipografia.a_svg(tr_b, tinta)))
    piezas.append('<g transform="translate(0 %.2f)">%s</g>'
                  % (base_sub, Tipografia.a_svg(tr_c, tinta)))

    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.2f %.2f %.2f %.2f" '
           'role="img" aria-label="María José Ramos Castro, Abogada">%s</svg>'
           % (-pad, -pad, ancho + pad * 2, alto + pad * 2, "".join(piezas)))
    return svg


def construir_marca(fondo, tinta, marca=MARCA, opacidad=0.55, ajustado=False):
    """Monograma MJ repasado con el marcador. Cuadrado, para icono y sello.

    `ajustado` aprieta los margenes: en una pestana de 16 px el aire sobra."""
    lora = Tipografia(560)
    lado = 200.0
    tam = 124.0 if ajustado else 118.0
    trazos, ancho = lora.linea("MJ", tam)
    x = (lado - ancho) / 2.0
    y = lado / 2.0 + tam * 0.345
    rx = 22 if ajustado else 10
    piezas = []
    if fondo:
        piezas.append('<defs><clipPath id="c"><rect width="%.0f" height="%.0f" rx="%.0f"/></clipPath></defs>'
                      % (lado, lado, rx))
        piezas.append('<rect width="%.0f" height="%.0f" rx="%.0f" fill="%s"/>' % (lado, lado, rx, fondo))
    piezas.append('<g%s>%s</g>' % (' clip-path="url(#c)"' if fondo else '',
                                   trazo_marcador(x + tam * 0.03, x + ancho, y - tam * 0.30,
                                                  tam * 0.74, marca, opacidad, 0)))
    piezas.append('<g transform="translate(%.2f %.2f)">%s</g>'
                  % (x, y, Tipografia.a_svg(trazos, tinta)))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.0f %.0f" '
            'role="img" aria-label="MJ, María José Ramos Castro">%s</svg>'
            % (lado, lado, "".join(piezas)))


def escribir(nombre, contenido):
    ruta = os.path.join(OUT, nombre)
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(contenido)
    print(nombre, len(contenido), "bytes")


if __name__ == "__main__":
    escribir("logo.svg", construir_wordmark(CARBON))
    # sobre carbon el rosa se lee gris: el marcador sube a terracota y opacidad
    escribir("logo-claro.svg", construir_wordmark(BLANCO, marca=MARCA, opacidad=0.62))
    escribir("marca.svg", construir_marca(None, CARBON))
    escribir("icon.svg", construir_marca(CARBON, BLANCO, marca=MARCA, opacidad=0.68, ajustado=True))
