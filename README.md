# María José Ramos Castro, Abogada · Carballo (A Coruña)

**Publicada en <https://alvarotaiagu.github.io/maria-jose-ramos-castro-abogada-carballo-web/>**

Web de marca personal para una abogada que ejerce sola en Carballo. Negocio
real, sin sitio previo. Sitio estático: `index.html`, `css/style.css`,
`js/main.js` y los recursos de `assets/`. Sin build, sin dependencias en el
repositorio; GSAP, ScrollTrigger y Lenis entran por CDN y la página funciona
igual si el CDN se cae.

## Concepto: «Cláusula»

El sitio es un documento que alguien está revisando. Blanco roto de folio,
renglones finos, serif de texto legal, secciones numeradas como cláusulas
(I a VI) y, sobre todo, **un rotulador terracota que va subrayando y
resaltando lo que importa**, como un contrato repasado a mano.

El recurso no es decorativo ni es CSS: cada tramo marcado se mide en tiempo
de ejecución y se le dibuja **un trazo SVG detrás del texto** (`stroke`,
`stroke-dashoffset`), con su ondulación y su desbordamiento por los cantos,
porque un rotulador ni es recto ni se para justo en la última letra. Hay dos
gestos, `data-marca="subrayado"` (trazo fino bajo la línea base, en la
portada) y `data-marca="resaltado"` (trazo ancho translúcido por detrás, en
el resto del documento). El overlay vive **dentro del propio párrafo**, así
que sus coordenadas son las del bloque de texto y nunca se cruza con una foto.

No reutiliza el esqueleto de ninguna otra plantilla de la carpeta: aquí el
lenguaje es el documento —texto, subrayado, marco—, no agua, pinceladas,
ondas, láminas anatómicas, papel recortado, plomada ni columnas contables.

### Frente a las otras plantillas legales

El mismo día salieron otras dos del sector, y las tres son deliberadamente
distintas:

| Plantilla | Concepto | Paleta y tipografía |
|---|---|---|
| **Esta** | «Cláusula»: el documento que se subraya | rosa empolvado + terracota + madera · Lora |
| `jose-manuel-blanco-regueiro-abogado-carballo-web` | «Titulares»: el caso como noticia | blanco y negro puros + un rojo de prensa · Anton |
| `castro-castro-abogados-carballo-web` | «Escritura»: papel timbrado y cuño | papel hueso + granate + oro · Playfair Display |

**Una coincidencia que conviene saber:** las tres usan un indicador de avance
propio, y el de «Titulares» también se llama *folio*. Allí es un número de
página flotante; aquí es una franja en la cabecera con el nombre de la cláusula,
el contador `NN / 06` y una barra de progreso. Son distintos en forma y en
sitio, pero si alguna vez se venden dos de estas tres al mismo cliente o a
competidores directos, este es el punto donde se parecen.

## Estructura

| | Sección | Qué hace |
|---|---|---|
| — | **Portada** | Una cláusula («Por la presente, quien suscribe…») que se escribe letra a letra y de la que van emergiendo, subrayadas en terracota justo cuando su palabra termina de aparecer, el nombre, «Carballo» y «desde [AÑO PENDIENTE]». CTA magnética. Sin balanzas ni mazos. |
| I | **Quién le atiende** | Bio en primera persona y ficha con seis datos deliberadamente vacíos (colegiación, formación, años, especialidad, idiomas). |
| II | **Credenciales** | Réplica editorial de su pared real de diplomas: diez marcos blancos y grises que cuelgan torcidos y **se enderezan al entrar en viewport**, con parallax muy corto y sombra CSS estática. Todos vacíos, con `[TÍTULO PENDIENTE]`. |
| III | **Áreas de práctica** | Sticky-stack de seis fichas; en cada una se resalta su cláusula. La lista entera va marcada `[CONFIRMAR CON LA PROFESIONAL]`. |
| IV | **Cómo trabajamos** | Consulta → valoración → estrategia → seguimiento, como fases de un procedimiento, con una línea que se va dibujando y sellando paso a paso. |
| V | **Opiniones** | 3,7 ★ con 3 reseñas, dicho tal cual y en cuerpo de texto. |
| VI | **Contacto** | Dirección con el 1º E, teléfono, horario y mapa bajo consentimiento. |

La cabecera lleva un **pie de folio** que dice en qué cláusula va el lector
(`CLÁUSULA III · ÁREAS DE PRÁCTICA`, `03 / 06`) con una barra de progreso.

## Datos reales usados

De su ficha de Google, sin retocar:

- María José Ramos Castro, Abogada
- Rúa Fomento, 51, 1º E · 15102 Carballo (A Coruña)
- 881 12 92 67
- 3,7 ★ con 3 reseñas
- Lunes a viernes 9:30–20:00 · sábado y domingo cerrado

**La valoración no se usa como reclamo.** Tres opiniones no son una muestra:
la nota va en cuerpo de texto, sin estrellas grandes ni contadores animados, y
la propia sección lo dice. El `aggregateRating` del schema declara 3.7 y 3.

## Lo que falta (nada de esto se ha inventado)

Su LinkedIn bloquea el scraping, así que de ahí no se pudo sacar nada. Todo lo
que sigue está en la página como hueco marcado, no relleno a ojo:

| Hueco | Dónde aparece |
|---|---|
| `[AÑOS DE EJERCICIO PENDIENTE]` / `[AÑO PENDIENTE]` | ficha de la cláusula I y la propia portada |
| `[Nº COLEGIADA PENDIENTE]` · `[COLEGIO / ICA PENDIENTE]` | ficha I y aviso legal |
| `[FORMACIÓN PENDIENTE]` · `[ESPECIALIDAD PENDIENTE]` · `[IDIOMAS PENDIENTE]` | ficha I |
| `[TÍTULO PENDIENTE]` · `[ENTIDAD] · [AÑO]` ×10 | los diez marcos de la pared |
| `[CONFIRMAR CON LA PROFESIONAL]` | las seis áreas de práctica, en bloque |
| `[TEXTO DE RESEÑA PENDIENTE]` · `[NOMBRE PENDIENTE]` · `[FECHA]` ×3 | opiniones |
| `[EMAIL PENDIENTE]` | contacto, seguimiento y aviso legal |
| `[TARIFA PENDIENTE]` · `[DURACIÓN PENDIENTE]` · `[PLAZO PENDIENTE]` · `[HOJA DE ENCARGO PENDIENTE]` | los cuatro pasos del procedimiento |
| `[CANAL DE CITA ONLINE PENDIENTE]` | contacto (hoy la cita es solo por teléfono) |
| `[RETRATO PENDIENTE]` · `[FOTOGRAFÍAS DEL DESPACHO PENDIENTES]` | quién le atiende y la banda de portada |
| `[NIF PENDIENTE]` · `[POLÍTICA DE PRIVACIDAD COMPLETA PENDIENTE]` | diálogos legales |
| `[LOGO PROVISIONAL]` | pie |
| `[TEXTO DE BIOGRAFÍA PENDIENTE DE REVISIÓN POR LA PROFESIONAL]` | la bio la escribí yo a partir de nada; tiene que validarla ella |

**Las seis áreas de práctica** (civil, familia, laboral, penal, herencias y
sucesiones, arrendamientos) son categorías genéricas de una abogacía
generalista de despacho pequeño. No son una especialización declarada y la
sección lo dice en su propio encabezado. Los sub-puntos de cada ficha
(«reclamación de deudas e impagos», «modificación de medidas»…) son también
genéricos del área, no casos ni servicios comprometidos.

No hay ni un precio, ni un premio, ni un año de ejercicio, ni un caso, ni una
reseña transcrita.

## Wordmark

No existe logo: en las fotos del despacho no hay marca ninguna, solo la pared
de diplomas. Así que la identidad se construye con lo único real —su nombre— y
con el gesto del sitio. `scripts/generate_brand.py` compone **«María José
Ramos Castro»** en **Lora** convertida a trazados con fontTools, con el
apellido repasado por un barrido de rotulador terracota que se sale por los
bordes, y «ABOGADA» en versalitas muy espaciadas debajo. Salida en
`assets/img/logo/`: `logo.svg`, `logo-claro.svg` (sobre carbón el rosa se
apaga a gris, así que ahí el marcador sube a terracota), `marca.svg` e
`icon.svg` con el monograma MJ; los PNG y `og.png` los rasteriza
`scripts/generate_icons.js`.

**Es una recreación tipográfica y está marcada como provisional en el pie.**

## Fotografía

El brief pedía fotografía generada; en este entorno no hay herramienta de
generación de imagen, así que se usan fotos con licencia **Pexels** (uso
comercial libre) elegidas a mano de hojas de contacto
(`scripts/contact_sheets.js`) buscando la paleta real de su despacho: rosa
empolvado, madera cálida, blanco, sillas blancas, luz de ventana.
**Ninguna es del despacho real y todas lo dicen en su pie de foto.**

| Archivo | Pexels | Uso |
|---|---|---|
| `sala` | #5262673 | banda tras la portada (mesa de madera, sillas blancas) |
| `mesa` | #8092466 | cabecera de credenciales (pared con molduras) |
| `luz` | #8534460 | banda de transición (retícula de luz de ventana) |
| `retrato` | #7222852 | **provisional, no es ella** |
| `documento` | #9172421 | cómo trabajamos (manos, bolígrafo, documentos) |
| `rincon` | #13734043 | opiniones (silla blanca en rincón cálido) |
| `escritorio` | #6636258 | contacto (mesa rosa palo, madera, plantas) |

Se descartaron togas, mazos, balanzas, bibliotecas jurídicas, apretones de
manos y cualquier documento con texto en inglés bien legible.

`scripts/process_photos.py` las descarga, recorta y **grada por script** (no
presets, no filtros en el navegador): balance de blancos cálido, supresión de
azules y cianes saturados —fuera el azul marino de bufete—, saturación
contenida, rosa empolvado en los medios y madera en los cálidos, split-toning
con sombras a carbón y luces a blanco roto, curva en S leve, **normalización
de exposición por imagen** (las fuentes venían con brillos muy distintos y el
conjunto tenía que leerse como una sola sesión), viñeteado y grano fino.
Salida a 1600 px —1100 en los verticales, que nunca se muestran más grandes—
900 px y un LQIP de 24 px que va incrustado en el HTML como fondo del `<img>`
y se ve mientras la foto baja.

## Accesibilidad y rendimiento

- **`prefers-reduced-motion`**: sin Lenis; la cláusula aparece **ya escrita y
  ya subrayada**, los diplomas **ya rectos**, el procedimiento entero sellado,
  el marquee quieto y el hero sin transiciones.
- **Sin JS**: `html.no-js` lo deja todo visible, sin aviso de cookies y sin
  iframe. **Si GSAP no carga**, se añade `html.no-gsap` y los resaltados los
  pinta un respaldo en CSS: la página no se queda en blanco ni pierde el gesto.
- **Texto troceado**: cada titular y la cláusula conservan su texto completo en
  un `<span class="sr-solo">` para lectores de pantalla, y la versión partida
  en letras va `aria-hidden`. Los SVG del rotulador son decorativos.
- Un solo `<h1>` («María José Ramos Castro, abogada · Carballo, A Coruña»), el
  salto al contenido es el primer tabulador y el foco es visible.
- **Sin canvas y sin filtros por frame**: solo `transform`, `opacity` y
  `stroke-dashoffset`. Comprobado con `PerformanceObserver`: **0 tareas
  >50 ms** desde que las fuentes están listas —que es cuando arranca la
  animación— y **0 durante el scroll**.
  Al **cargar** sí hay dos tareas largas, pero no son del sitio: salen
  idénticas sirviendo un `main.js` vacío (evaluar GSAP + ScrollTrigger + Lenis
  y el intercambio de la webfont). La prueba lo mide con un A/B alternado.
  Aun así el arranque propio se reparte en tres tandas con `requestIdleCallback`
  y el constructor del rotulador separa lecturas y escrituras de geometría para
  no provocar un layout por trazo.
- **Cookies**: solo `localStorage` (`mjrc-cookie-ack`).
  `.cookie-banner[hidden] { display: none }` va **después** del `display: flex`,
  para que el botón cierre de verdad.
- **Mapa** de Google insertado **únicamente al pulsar** (`.map-consent`,
  `google.com/maps?q=…&output=embed`, sin API key), coherente con el aviso de
  «sin cookies de terceros».
- **Responsive** hasta 360 px, comprobado a 1440/1280/1024/768/540/400/360:
  sin scroll horizontal y con el rotulador recolocado en cada anchura (se
  vuelve a medir al cambiar el ancho de ventana, no al aparecer el teclado).

## Verificación

```
python -m http.server 8983
NODE_PATH=<ruta a un node_modules con playwright> node scripts/verify.js

# o contra el sitio publicado
MJRC_URL=https://alvarotaiagu.github.io/maria-jose-ramos-castro-abogada-carballo-web/   NODE_PATH=<...> node scripts/verify.js
```

`scripts/verify.js` — **130 pruebas**, informe en `scripts/verify-report.json`,
capturas en `screenshots/`. Cubre: la cláusula escribiéndose a medias y
entera; que haya un trazo por palabra clave, que sea terracota, fino, que
quede detrás del texto y que la CTA del hero entre en pantalla; el folio y su
barra; el resaltado ancho y translúcido; los diez marcos enderezados, opacos y
con sombra estática; el sticky en el `<li>` y no en la tarjeta, sin
`min-height`, con recorrido de `margin-bottom`, la tarjeta activa entera, las
tapadas solo encogidas y **ninguna tarjeta fantasma** (se recorren las seis);
los cuatro pasos sellándose; la nota real 3,7/3 sin inflar; dirección,
teléfono y horario reales; el mapa solo al pulsar y sin API key; las cookies
(aparece, **cierra de verdad**, se recuerda) y los tres diálogos; longtasks en
intro y scroll más el A/B contra un `main.js` vacío; reduced-motion; sin JS y
con el CDN bloqueado; responsive en siete anchuras con el encaje del
subrayado; menú móvil; y accesibilidad (h1 único, texto para lectores de
pantalla, letras ocultas, primer tabulador).

También comprueba la **honestidad del contenido**: que estén los doce huecos
marcados y que **no** haya precios, premios, años de ejercicio, número de
colegiada, lenguaje de bufete colectivo ni valoración inflada, que ninguna
imagen sea de balanza, mazo, toga o biblioteca jurídica, y que la paleta y la
tipografía sean las pedidas.

Las 130 pruebas pasan tanto en local como contra el sitio publicado.

Dos cosas las cazó esta verificación y no yo: **la página no tenía `<h1>`**
(las secciones empezaban en `<h2>`) y **el primer tabulador caía en el aviso
de cookies** en vez de en el salto al contenido, porque el aviso iba antes en
el DOM.
