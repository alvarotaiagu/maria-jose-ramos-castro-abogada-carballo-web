"""Descarga y grada la fotografia de la web de Maria Jose Ramos Castro, Abogada.

El brief pedia "fotografia generada"; en este entorno no hay herramienta de
generacion de imagen, asi que se usan fotos con licencia Pexels (uso comercial
libre, sin atribucion obligatoria) elegidas de hojas de contacto para el
concepto "Clausula" y, sobre todo, para la paleta real de su despacho: rosa
empolvado, madera calida, blanco roto, sillas blancas, luz de ventana.
Ninguna es del despacho real de Rua Fomento, 51 y la web lo dice.

  escritorio  Pexels #6636258   mesa rosa palo, cortina calida, plantas         (sobre / contacto)
  sala        Pexels #5262673   mesa de madera y sillas blancas, lampara        (banda tras el hero)
  luz         Pexels #8534460   reticula de luz de ventana sobre pared calida   (banda de transicion)
  retrato     Pexels #7222852   retrato femenino, chaqueta camel, luz de ventana (PROVISIONAL: no es ella)
  documento   Pexels #9172421   manos con boligrafo sobre documentos            (como trabajamos)
  mesa        Pexels #8092466   mesa clara, pared con molduras, flores          (cabecera de credenciales)
  rincon      Pexels #13734043  silla blanca en rincon calido                   (resenas)

Gradacion por script (no presets, no filtros en el navegador): balance de
blancos gray-world suave, supresion de azules y cianes saturados (fuera el
azul marino de bufete), saturacion contenida, split-toning con sombras
viradas a gris carbon #2B2A28 y luces a blanco roto #FAF8F6, empujon rosa
empolvado #E8D5CC en los medios y madera #B08D6A en los tonos calidos,
curva en S suave, exposicion subida, vineteado leve y grano fino.
Salida en assets/img/photos/ a 1600 y 900 px de ancho mas un LQIP de 24 px.

Uso: python scripts/process_photos.py
"""
import os
import urllib.request
import concurrent.futures

import numpy as np
from PIL import Image, ImageFilter

# nombre: (id, proporcion ancho/alto, anclaje vertical del recorte 0..1, ancho maximo)
# los verticales nunca se muestran a mas de ~500 px de ancho: a 1600 solo pesan
PHOTOS = {
    "escritorio": ("6636258", 3 / 2, 0.5, 1600),
    "sala": ("5262673", 16 / 9, 0.52, 1600),
    "luz": ("8534460", 21 / 9, 0.5, 1600),
    "retrato": ("7222852", 4 / 5, 0.32, 1100),
    "documento": ("9172421", 4 / 5, 0.5, 1100),
    "mesa": ("8092466", 3 / 2, 0.5, 1600),
    "rincon": ("13734043", 4 / 5, 0.45, 1100),
}

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "photos_src")
OUT = os.path.join(HERE, "..", "assets", "img", "photos")
os.makedirs(SRC, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

CARBON = np.array([0x2B, 0x2A, 0x28]) / 255.0
BLANCO = np.array([0xFA, 0xF8, 0xF6]) / 255.0
ROSA = np.array([0xE8, 0xD5, 0xCC]) / 255.0
MADERA = np.array([0xB0, 0x8D, 0x6A]) / 255.0
LUMA = np.array([0.299, 0.587, 0.114])

# "luz" llega muy ocre y a tamano de banda se comia la pagina entera
SATURACION = {"luz": 0.30}

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")


def descargar(nombre, pid):
    destino = os.path.join(SRC, "%s-%s.jpg" % (nombre, pid))
    if os.path.exists(destino) and os.path.getsize(destino) > 40000:
        return destino
    url = "https://images.pexels.com/photos/%s/pexels-photo-%s.jpeg?auto=compress&cs=tinysrgb&w=2200" % (pid, pid)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r, open(destino, "wb") as f:
        f.write(r.read())
    return destino


def recortar(im, prop, anclaje):
    w, h = im.size
    if w / h > prop:              # sobra ancho
        nw = int(round(h * prop))
        x = (w - nw) // 2
        im = im.crop((x, 0, x + nw, h))
    else:                         # sobra alto
        nh = int(round(w / prop))
        y = int(round((h - nh) * anclaje))
        im = im.crop((0, y, w, y + nh))
    return im


def tinte(color):
    """Desplazamiento de color con luma cero: vira el tono sin subir el brillo."""
    c = np.asarray(color, dtype=np.float64)
    return c - float(c @ LUMA)


def gradar(a, sat=0.66):
    """a: float32 RGB en 0..1. Devuelve la misma forma."""
    # --- balance de blancos gray-world suave hacia el calido ---
    medias = a.reshape(-1, 3).mean(axis=0)
    objetivo = medias.mean()
    ganancia = np.clip(objetivo / np.maximum(medias, 1e-4), 0.88, 1.14)
    ganancia = 1.0 + (ganancia - 1.0) * 0.5
    ganancia *= np.array([1.022, 1.000, 0.972])     # empujon calido explicito
    ganancia /= float(ganancia @ LUMA)              # sin cambiar la exposicion
    a = np.clip(a * ganancia, 0, 1)

    # --- fuera el azul de bufete: se desatura lo que tira a azul/cian ---
    lum = a @ LUMA
    croma = a.max(axis=2) - a.min(axis=2)
    azulez = np.clip((a[..., 2] - np.maximum(a[..., 0], a[..., 1])) / 0.25, 0, 1)
    peso_azul = (azulez * np.clip(croma / 0.22, 0, 1))[..., None]
    gris = np.repeat(lum[..., None], 3, axis=2)
    a = a * (1 - peso_azul * 0.8) + gris * (peso_azul * 0.8)

    # --- saturacion global contenida ---
    lum = a @ LUMA
    gris = np.repeat(lum[..., None], 3, axis=2)
    a = gris + (a - gris) * sat

    # --- color: rosa empolvado en los medios, madera en los calidos ---
    medios = np.exp(-((lum - 0.55) ** 2) / (2 * 0.22 ** 2))
    a = a + tinte(ROSA) * medios[..., None] * 0.30
    calidez = np.clip((a[..., 0] - a[..., 2]) / 0.20, 0, 1)
    a = a + tinte(MADERA) * (calidez * np.clip(1 - lum, 0, 1))[..., None] * 0.42

    # --- split-toning: sombras a carbon, luces a blanco roto (sin tocar el brillo) ---
    lum = np.clip(a @ LUMA, 0, 1)
    sombras = np.clip(1 - lum * 2.2, 0, 1)
    luces = np.clip((lum - 0.62) / 0.38, 0, 1)
    a = a + tinte(CARBON) * sombras[..., None] * 0.55
    a = a + tinte(BLANCO) * luces[..., None] * 0.45

    # --- curva en S leve: contraste de documento, sin quemar ---
    a = np.clip(a, 0, 1)
    a = np.clip(a + 0.055 * np.sin(2 * np.pi * (a - 0.5)), 0, 1)

    # --- exposicion normalizada por imagen: las fuentes vienen con brillos
    #     muy distintos y el conjunto tiene que leerse como una sola sesion ---
    lum = a @ LUMA
    alto = float(np.percentile(lum, 99.4))
    if alto > 0.94:                                  # recupera las luces quemadas
        a = a * (0.94 / alto)
    lum = a @ LUMA
    media = float(lum.mean())
    if media > 0.005:
        g = np.log(0.56) / np.log(np.clip(media, 0.02, 0.98))
        a = np.clip(a, 0, 1) ** np.clip(g, 0.85, 1.45)

    # --- suelo de negro calido: los negros no son negros, son tinta ---
    a = np.clip(a, 0, 1) * 0.965 + CARBON * 0.035
    return np.clip(a, 0, 1)


def vinetear(a):
    h, w = a.shape[:2]
    yy = np.linspace(-1, 1, h)[:, None]
    xx = np.linspace(-1, 1, w)[None, :]
    r = np.sqrt(xx ** 2 + yy ** 2) / np.sqrt(2)
    v = 1 - 0.14 * np.clip((r - 0.45) / 0.55, 0, 1) ** 1.6
    return np.clip(a * v[..., None], 0, 1)


def granular(a, semilla):
    rng = np.random.default_rng(semilla)
    h, w = a.shape[:2]
    g = rng.normal(0, 1, (h, w, 1)).astype(np.float32)
    lum = (a @ LUMA)[..., None]
    fuerza = 0.014 * (0.35 + 0.65 * (1 - np.abs(lum - 0.5) * 2) ** 2)
    return np.clip(a + g * fuerza, 0, 1)


def procesar(nombre, datos):
    pid, prop, anclaje, ancho_max = datos
    ruta = descargar(nombre, pid)
    im = Image.open(ruta).convert("RGB")
    im = recortar(im, prop, anclaje)
    if im.width > ancho_max:
        im = im.resize((ancho_max, int(round(ancho_max / prop))), Image.LANCZOS)

    a = np.asarray(im).astype(np.float32) / 255.0
    a = gradar(a, SATURACION.get(nombre, 0.66))
    a = vinetear(a)
    a = granular(a, abs(hash(nombre)) % (2 ** 31))

    grande = Image.fromarray((a * 255 + 0.5).astype(np.uint8))
    grande = grande.filter(ImageFilter.UnsharpMask(radius=1.4, percent=52, threshold=3))
    grande.save(os.path.join(OUT, nombre + "-1600.jpg"), quality=79, optimize=True, progressive=True)

    ancho_medio = min(900, grande.width)
    media = grande.resize((ancho_medio, int(round(ancho_medio / prop))), Image.LANCZOS)
    media.save(os.path.join(OUT, nombre + "-900.jpg"), quality=80, optimize=True, progressive=True)

    lqip = grande.resize((24, max(1, int(round(24 / prop)))), Image.LANCZOS)
    lqip.save(os.path.join(OUT, nombre + "-lqip.jpg"), quality=42)
    return nombre, grande.size


if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        for nombre, tam in ex.map(lambda kv: procesar(*kv), PHOTOS.items()):
            print(nombre, tam)
