/* Verificación de la web de María José Ramos Castro con Playwright.
   Requiere un servidor local:  python -m http.server 8983
   Uso: NODE_PATH=<ruta node_modules> node scripts/verify.js            */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.MJRC_URL || 'http://127.0.0.1:8983/';
const RAIZ = path.join(__dirname, '..');
const CAPS = path.join(RAIZ, 'screenshots');
fs.mkdirSync(CAPS, { recursive: true });

const resultados = [];
const ok = (nombre, valor, detalle) =>
  resultados.push({ prueba: nombre, ok: !!valor, detalle: detalle === undefined ? null : detalle });

async function nuevaPagina(browser, opciones = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...opciones });
  const errores = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.errores = errores;
  return page;
}

const irA = async (page, sel, margen = 120) => {
  await page.evaluate(({ sel, margen }) => {
    const el = document.querySelector(sel);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - margen, behavior: 'instant' });
  }, { sel, margen });
  await page.waitForTimeout(1400);
};

(async () => {
  const browser = await chromium.launch();

  /* ============ 1. portada, cláusula y rotulador ============ */
  {
    const page = await nuevaPagina(browser);
    await page.goto(BASE, { waitUntil: 'networkidle' });

    /* a media intro la cláusula está a medio escribir */
    await page.waitForTimeout(650);
    const medio = await page.evaluate(() => {
      const chars = Array.from(document.querySelectorAll('[data-clausula] .ch'));
      const vis = chars.filter(c => parseFloat(getComputedStyle(c).opacity) > 0.85).length;
      return { total: chars.length, vis };
    });
    ok('la cláusula se escribe letra a letra', medio.total > 150 && medio.vis > 0 && medio.vis < medio.total,
      medio.vis + '/' + medio.total + ' letras visibles a los 650 ms');
    await page.screenshot({ path: path.join(CAPS, 'intro-1440.png') });

    await page.waitForTimeout(3200);
    const fin = await page.evaluate(() => {
      const chars = Array.from(document.querySelectorAll('[data-clausula] .ch'));
      return chars.filter(c => parseFloat(getComputedStyle(c).opacity) > 0.95).length === chars.length;
    });
    ok('al terminar la intro se lee la cláusula entera', fin);

    /* los subrayados del hero están dibujados y son terracota */
    const trazos = await page.evaluate(() => {
      const svg = document.querySelector('[data-clausula] > .marcas');
      if (!svg) return null;
      const ps = Array.from(svg.querySelectorAll('path'));
      return ps.map(p => ({
        off: Math.round(parseFloat(p.style.strokeDashoffset) || 0),
        largo: Math.round(p.getTotalLength()),
        color: p.getAttribute('stroke'),
        grosor: parseFloat(p.getAttribute('stroke-width'))
      }));
    });
    ok('hay un trazo de rotulador por cada palabra clave del hero', trazos && trazos.length >= 3, trazos && trazos.length);
    ok('los subrayados del hero están dibujados al final', trazos && trazos.every(t => t.off === 0));
    ok('los subrayados son terracota, no negros', trazos && trazos.every(t => /^#C0714E$/i.test(t.color)));
    ok('el subrayado es fino (no tapa el texto)', trazos && trazos.every(t => t.grosor <= 7));

    /* los trazos van DETRÁS del texto */
    const capas = await page.evaluate(() => {
      const svg = document.querySelector('[data-clausula] > .marcas');
      const em = document.querySelector('[data-clausula] [data-marca]');
      return { svgZ: getComputedStyle(svg).zIndex, emZ: getComputedStyle(em).zIndex };
    });
    ok('el rotulador queda detrás del texto', capas.svgZ === '0' && capas.emZ === '1', JSON.stringify(capas));

    /* el hero cabe sin que la llamada a la acción se caiga de la pantalla */
    const heroCabe = await page.evaluate(() => {
      const r = document.querySelector('.hero-botones').getBoundingClientRect();
      return { bottom: Math.round(r.bottom), vh: window.innerHeight };
    });
    ok('la llamada a la acción del hero entra en pantalla a 1440×900',
      heroCabe.bottom < heroCabe.vh, JSON.stringify(heroCabe));

    await page.screenshot({ path: path.join(CAPS, 'hero-1440.png') });

    /* el folio de la cabecera */
    const folio0 = await page.evaluate(() => document.querySelector('[data-folio-num]').textContent);
    ok('en la portada el folio marca 00', folio0 === '00', folio0);

    ok('sin errores de consola en la portada', page.errores.length === 0, page.errores.join(' | '));
    await page.close();
  }

  /* ============ 2. recorrido completo: folio, marcas, marcos, stack ============ */
  {
    const page = await nuevaPagina(browser);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);

    /* --- I --- */
    await irA(page, '#quien');
    const f1 = await page.evaluate(() => ({
      num: document.querySelector('[data-folio-num]').textContent,
      tit: document.querySelector('[data-folio-titulo]').textContent,
      barra: parseFloat(document.querySelector('[data-folio-barra]').style.width)
    }));
    ok('el folio sigue la cláusula I', f1.num === '01' && /Quién/.test(f1.tit), JSON.stringify(f1));
    ok('la barra de progreso del folio avanza', f1.barra > 0 && f1.barra < 100, f1.barra);

    const resaltado = await page.evaluate(() => {
      const svg = document.querySelector('.quien-bio > .marcas');
      const p = svg && svg.querySelector('path');
      if (!p) return null;
      return {
        off: Math.round(parseFloat(p.style.strokeDashoffset) || 0),
        grosor: parseFloat(p.getAttribute('stroke-width')),
        alto: Math.round(document.querySelector('.quien-bio [data-marca]').getClientRects()[0].height),
        opac: parseFloat(p.getAttribute('opacity'))
      };
    });
    ok('el resaltado de la bio está pintado', resaltado && resaltado.off === 0, JSON.stringify(resaltado));
    ok('el resaltado es un trazo ancho tipo marcador',
      resaltado && resaltado.grosor > resaltado.alto * 0.5, JSON.stringify(resaltado));
    ok('el resaltado es translúcido, deja leer el texto', resaltado && resaltado.opac < 0.5, resaltado && resaltado.opac);
    await page.screenshot({ path: path.join(CAPS, 'quien-1440.png') });

    /* --- II: la pared --- */
    await irA(page, '.pared-marcos', 60);
    await page.waitForTimeout(1800);
    const marcos = await page.evaluate(() => {
      const angulo = el => {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI * 100) / 100;
      };
      const hojas = Array.from(document.querySelectorAll('.marco-hoja'));
      /* sólo los que ya han pasado del punto de disparo (top 90%) y han
         tenido tiempo de enderezarse; los que asoman por abajo aún no */
      const vistos = hojas.filter(h => {
        const r = h.getBoundingClientRect();
        return r.top < window.innerHeight * 0.75 && r.bottom > 0;
      });
      return {
        total: hojas.length,
        vistos: vistos.length,
        torcidos: vistos.filter(h => Math.abs(angulo(h)) > 0.6).length,
        opacos: vistos.filter(h => parseFloat(getComputedStyle(h).opacity) > 0.95).length,
        sombra: getComputedStyle(hojas[0]).boxShadow !== 'none'
      };
    });
    ok('la pared tiene 10 marcos', marcos.total === 10, marcos.total);
    ok('los marcos a la vista se han enderezado', marcos.vistos >= 5 && marcos.torcidos === 0, JSON.stringify(marcos));
    ok('los marcos a la vista están opacos', marcos.vistos >= 5 && marcos.opacos === marcos.vistos, JSON.stringify(marcos));
    ok('los marcos llevan sombra CSS estática', marcos.sombra);
    const pendMarcos = await page.evaluate(() =>
      document.querySelectorAll('.marco-hoja figcaption b.pend').length);
    ok('cada marco lleva su [TÍTULO PENDIENTE]', pendMarcos === 10, pendMarcos);
    await page.screenshot({ path: path.join(CAPS, 'pared-1440.png') });

    /* --- III: el stack de áreas --- */
    await irA(page, '#areas', 0);
    await page.waitForTimeout(900);
    const stack = await page.evaluate(() => {
      const lis = Array.from(document.querySelectorAll('.stack-li'));
      return {
        n: lis.length,
        sticky: lis.every(li => getComputedStyle(li).position === 'sticky'),
        cardSticky: lis.some(li => getComputedStyle(li.querySelector('.ficha-area')).position === 'sticky'),
        minH: lis.some(li => getComputedStyle(li).minHeight !== '0px'),
        recorrido: lis.slice(0, -1).every(li => parseFloat(getComputedStyle(li).marginBottom) > 100)
      };
    });
    ok('el stack tiene 6 áreas', stack.n === 6, stack.n);
    ok('el sticky va en el <li>, no en la tarjeta', stack.sticky && !stack.cardSticky, JSON.stringify(stack));
    ok('sin min-height en el <li> (nada de tarjetas fantasma)', !stack.minH);
    ok('el recorrido del stack lo da el margin-bottom', stack.recorrido);

    /* al llegar a la tercera tarjeta, esa se ve y las anteriores están encogidas */
    await page.evaluate(() => {
      const li = document.querySelectorAll('.stack-li')[2];
      window.scrollTo({ top: li.getBoundingClientRect().top + window.scrollY - 120, behavior: 'instant' });
    });
    await page.waitForTimeout(1200);
    const tarjetas = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.ficha-area'));
      const escala = el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a;
      return {
        activa: { op: parseFloat(getComputedStyle(cards[2]).opacity), esc: Math.round(escala(cards[2]) * 1000) / 1000 },
        tapada: { esc: Math.round(escala(cards[0]) * 1000) / 1000 },
        todasVisibles: cards.every(c => parseFloat(getComputedStyle(c).opacity) > 0 || c.getBoundingClientRect().top > window.innerHeight)
      };
    });
    ok('la tarjeta activa del stack se ve entera', tarjetas.activa.op > 0.95 && tarjetas.activa.esc > 0.97,
      JSON.stringify(tarjetas.activa));
    ok('las tarjetas tapadas se encogen (sólo escala, nunca opacidad)',
      tarjetas.tapada.esc < 0.99 && tarjetas.tapada.esc > 0.9, JSON.stringify(tarjetas.tapada));
    await page.screenshot({ path: path.join(CAPS, 'stack-1440.png') });

    /* las 6 tarjetas acaban visibles al pasar por todas */
    const fantasmas = [];
    for (let i = 0; i < 6; i++) {
      await page.evaluate(k => {
        const li = document.querySelectorAll('.stack-li')[k];
        window.scrollTo({ top: li.getBoundingClientRect().top + window.scrollY - 120, behavior: 'instant' });
      }, i);
      await page.waitForTimeout(800);
      const v = await page.evaluate(k => {
        const c = document.querySelectorAll('.ficha-area')[k];
        const r = c.getBoundingClientRect();
        return parseFloat(getComputedStyle(c).opacity) > 0.9 && r.height > 100 && r.top < window.innerHeight;
      }, i);
      if (!v) fantasmas.push(i + 1);
    }
    ok('ninguna tarjeta del stack queda invisible', fantasmas.length === 0, 'fantasmas: ' + fantasmas.join(','));

    /* --- IV: el procedimiento --- */
    await irA(page, '#procedimiento');
    await page.waitForTimeout(1600);
    const proc = await page.evaluate(() => {
      const lista = document.querySelector('.proc-pasos');
      return {
        linea: lista.style.getPropertyValue('--proc'),
        activos: document.querySelectorAll('.paso.activo').length,
        total: document.querySelectorAll('.paso').length
      };
    });
    ok('el procedimiento tiene 4 pasos', proc.total === 4, proc.total);
    ok('la línea del procedimiento se dibuja con el scroll', parseFloat(proc.linea) > 0, proc.linea);
    ok('los pasos se van sellando', proc.activos > 0 && proc.activos <= 4, proc.activos);
    await page.screenshot({ path: path.join(CAPS, 'procedimiento-1440.png') });

    /* --- V: opiniones honestas --- */
    await irA(page, '#opiniones');
    const op = await page.evaluate(() => {
      const t = document.querySelector('#opiniones').innerText;
      const cifra = document.querySelector('.op-cifra');
      const titular = document.querySelector('#opiniones .titular');
      return {
        nota: /3,7 sobre 5/.test(t),
        cuantas: /3 reseñas/.test(t),
        tamCifra: parseFloat(getComputedStyle(cifra).fontSize),
        tamTitular: parseFloat(getComputedStyle(titular).fontSize),
        placeholders: document.querySelectorAll('#opiniones .op-tarjeta p.pend').length,
        estrellas: (t.match(/★/g) || []).length
      };
    });
    ok('la nota real 3,7 sobre 5 aparece', op.nota);
    ok('el número real de reseñas (3) aparece', op.cuantas);
    ok('la nota no se infla visualmente (va en cuerpo de texto)',
      op.tamCifra < op.tamTitular * 0.45, op.tamCifra + 'px vs titular ' + op.tamTitular + 'px');
    ok('las 3 reseñas son placeholders, no textos inventados', op.placeholders === 3, op.placeholders);
    await page.screenshot({ path: path.join(CAPS, 'opiniones-1440.png') });

    /* --- VI: contacto --- */
    await irA(page, '#contacto');
    const cont = await page.evaluate(() => {
      const t = document.querySelector('#contacto').innerText;
      return {
        piso: /1º E/.test(t),
        calle: /Rúa Fomento, 51/.test(t),
        cp: /15102 Carballo/.test(t),
        tel: !!document.querySelector('a[href="tel:+34881129267"]'),
        horario: /9:30\s*–\s*20:00/.test(t) && /Cerrado/.test(t),
        iframe: document.querySelectorAll('#contacto iframe').length
      };
    });
    ok('la dirección lleva el 1º E', cont.piso);
    ok('la calle y el código postal son los reales', cont.calle && cont.cp);
    ok('el teléfono real es un enlace tel:', cont.tel);
    ok('el horario real (L-V 9:30–20:00, fin de semana cerrado)', cont.horario);
    ok('el mapa NO se carga solo', cont.iframe === 0);

    await page.click('[data-map]');
    await page.waitForTimeout(900);
    const mapa = await page.evaluate(() => {
      const f = document.querySelector('#contacto iframe');
      return f ? f.src : null;
    });
    ok('el mapa aparece al pulsar', !!mapa);
    ok('el mapa usa el embed sin API key', mapa && mapa.includes('output=embed') && !/key=/.test(mapa), mapa);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(CAPS, 'contacto-1440.png') });

    /* --- pie --- */
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
    const pie = await page.evaluate(() => ({
      llamarClaro: document.querySelector('.llamar').classList.contains('sobre-pie'),
      folio: document.querySelector('[data-folio-num]').textContent,
      barra: Math.round(parseFloat(document.querySelector('[data-folio-barra]').style.width)),
      provisional: /LOGO PROVISIONAL/.test(document.querySelector('.pie').innerText)
    }));
    ok('sobre el pie oscuro el botón de llamar se aclara', pie.llamarClaro);
    ok('al final el folio marca la última cláusula', pie.folio === '06', pie.folio);
    ok('la barra del folio llega al 100 %', pie.barra >= 99, pie.barra);
    ok('el pie declara el logo como provisional', pie.provisional);
    await page.screenshot({ path: path.join(CAPS, 'pie-1440.png') });

    ok('sin errores de consola en el recorrido', page.errores.length === 0, page.errores.join(' | '));
    await page.close();
  }

  /* ============ 3. honestidad del contenido ============ */
  {
    const page = await nuevaPagina(browser);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const texto = await page.evaluate(() => document.body.innerText);
    const html = await page.content();

    const esperados = [
      '[AÑOS DE EJERCICIO PENDIENTE]', '[Nº COLEGIADA PENDIENTE]', '[FORMACIÓN PENDIENTE]',
      '[ESPECIALIDAD PENDIENTE]', '[IDIOMAS PENDIENTE]', '[EMAIL PENDIENTE]',
      '[TÍTULO PENDIENTE]', '[TEXTO DE RESEÑA PENDIENTE]', '[CONFIRMAR CON LA PROFESIONAL]',
      '[RETRATO PENDIENTE]', '[LOGO PROVISIONAL]', '[AÑO PENDIENTE]'
    ];
    esperados.forEach(p => ok('marca el hueco ' + p, texto.includes(p)));

    /* nada inventado */
    const prohibidos = [
      [/\b\d{1,4}\s*(€|euros)/i, 'precios inventados'],
      [/premio|galardón|mejor abogad/i, 'premios inventados'],
      [/\b(\d{2,3})\s*años de experiencia/i, 'años de ejercicio inventados'],
      [/bufete nuestro|nuestro equipo|nuestros abogados/i, 'lenguaje de bufete colectivo'],
      [/colegiad[ao] n[ºo°]?\s*\d/i, 'número de colegiada inventado'],
      [/\b4[.,]\d\s*(★|estrellas)/, 'valoración inflada']
    ];
    prohibidos.forEach(([re, que]) => ok('no hay ' + que, !re.test(texto)));

    ok('la valoración que se publica es la real (3,7)', /3,7/.test(texto) && !/\b4,\d\s*★/.test(texto));
    ok('el schema declara ratingValue 3.7 y ratingCount 3',
      /"ratingValue":\s*"3.7"/.test(html) && /"ratingCount":\s*"3"/.test(html));
    ok('el schema usa la dirección real con 1º E', /"streetAddress":\s*"Rúa Fomento, 51, 1º E"/.test(html));

    /* nada de imaginería jurídica de catálogo */
    const alts = await page.evaluate(() =>
      Array.from(document.images).map(i => (i.alt || '') + '|' + i.src).join(' ').toLowerCase());
    ok('ninguna imagen es de balanza, mazo, toga o biblioteca jurídica',
      !/balanza|mazo|martillo|toga|gavel|scale|biblioteca/.test(alts));
    ok('todas las imágenes llevan alt', await page.evaluate(() =>
      Array.from(document.images).every(i => i.alt && i.alt.length > 8)));
    ok('las fotos se declaran como imagen de ambiente',
      (texto.match(/Imagen de ambiente/g) || []).length >= 4);

    /* paleta: nada de azul marino ni dorado */
    const colores = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return ['--blanco', '--rosa', '--marca', '--terracota', '--carbon', '--madera']
        .map(v => v + '=' + s.getPropertyValue(v).trim()).join(' ');
    });
    ok('la paleta es la real del despacho', /--rosa=#E8D5CC/.test(colores) && /--carbon=#2B2A28/.test(colores), colores);

    /* tipografía */
    const tipos = await page.evaluate(() => ({
      cuerpo: getComputedStyle(document.querySelector('.clausula')).fontFamily,
      ui: getComputedStyle(document.querySelector('.top-nav a')).fontFamily,
      italica: getComputedStyle(document.querySelector('.quien-bio [data-marca]')).fontStyle
    }));
    ok('el cuerpo va en serif (Lora)', /Lora/.test(tipos.cuerpo), tipos.cuerpo);
    ok('la navegación va en sans (Inter)', /Inter/.test(tipos.ui), tipos.ui);
    ok('las cláusulas destacadas van en itálica', tipos.italica === 'italic');

    await page.close();
  }

  /* ============ 4. cookies, diálogos y menú ============ */
  {
    const page = await nuevaPagina(browser);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    ok('el aviso de cookies aparece', await page.isVisible('.cookie-banner'));
    await page.click('.cookie-ack');
    await page.waitForTimeout(400);
    const cerrado = await page.evaluate(() => {
      const b = document.querySelector('.cookie-banner');
      return { hidden: b.hidden, display: getComputedStyle(b).display, guardado: localStorage.getItem('mjrc-cookie-ack') };
    });
    ok('el botón del aviso lo cierra de verdad (display:none gana a display:flex)',
      cerrado.hidden && cerrado.display === 'none', JSON.stringify(cerrado));
    ok('el aviso se recuerda en localStorage', cerrado.guardado === '1');

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    ok('al recargar, el aviso ya no vuelve', !(await page.isVisible('.cookie-banner')));

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    for (const id of ['dlg-legal', 'dlg-privacidad', 'dlg-cookies']) {
      await page.click(`.pie-nav [data-dialog="${id}"]`);
      await page.waitForTimeout(350);
      const abierto = await page.evaluate(i => document.getElementById(i).open, id);
      await page.click(`#${id} [data-cerrar]`);
      await page.waitForTimeout(250);
      const ccerrado = await page.evaluate(i => !document.getElementById(i).open, id);
      ok('el diálogo ' + id + ' abre y cierra', abierto && ccerrado);
    }
    await page.close();
  }

  /* ============ 5. rendimiento ============
     Las dos tareas largas que hay al cargar no son del sitio: salen igual con
     un main.js vacío (evaluar GSAP/ScrollTrigger/Lenis y el intercambio de la
     webfont). Así que se mide lo que sí es nuestro: desde que las fuentes
     están listas -- que es cuando arranca la animación -- en adelante. */
  {
    const observador = () => {
      window.__largas = [];
      window.__cero = Infinity;
      new PerformanceObserver(l => l.getEntries().forEach(e => {
        if (e.startTime >= window.__cero) window.__largas.push(Math.round(e.duration));
      })).observe({ entryTypes: ['longtask'] });
      document.fonts.ready.then(() => { window.__cero = performance.now(); });
    };

    const page = await nuevaPagina(browser);
    await page.addInitScript(observador);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    const enIntro = await page.evaluate(() => window.__largas.slice());

    await page.evaluate(() => { window.__largas.length = 0; });
    for (let i = 0; i < 26; i++) {
      await page.mouse.wheel(0, 420);
      await page.waitForTimeout(90);
    }
    await page.waitForTimeout(900);
    const enScroll = await page.evaluate(() => window.__largas.slice());

    ok('sin tareas largas (>50 ms) mientras se escribe y se subraya la portada',
      enIntro.length === 0, JSON.stringify(enIntro));
    ok('sin tareas largas (>50 ms) durante el scroll', enScroll.length === 0, JSON.stringify(enScroll));

    const sinCanvas = await page.evaluate(() => document.querySelectorAll('canvas').length === 0);
    ok('no hay ningún canvas en la página', sinCanvas);
    const sinFiltroVivo = await page.evaluate(() =>
      !Array.from(document.querySelectorAll('.hero *, .marco *, .marquee *'))
        .some(e => getComputedStyle(e).filter !== 'none'));
    ok('sin filtros CSS sobre elementos en movimiento', sinFiltroVivo);
    await page.close();

    /* A/B contra un main.js vacío: al cargar hay dos tareas largas, pero no
       son nuestras. Se alternan las medidas (si no, la primera tanda paga el
       arranque en frío del navegador) y se compara el mejor caso de cada una. */
    const suma = async vacio => {
      const pg = await nuevaPagina(browser);
      await pg.addInitScript(() => {
        window.__todas = [];
        new PerformanceObserver(l => l.getEntries().forEach(e => window.__todas.push(e.duration)))
          .observe({ entryTypes: ['longtask'] });
      });
      if (vacio) await pg.route('**/js/main.js*', r =>
        r.fulfill({ body: '/* vacío */', headers: { 'content-type': 'application/javascript' } }));
      await pg.goto(BASE, { waitUntil: 'networkidle' });
      await pg.waitForTimeout(4000);
      const t = await pg.evaluate(() => window.__todas.reduce((a, b) => a + b, 0));
      await pg.close();
      return Math.round(t);
    };
    const conJs = [], sinJs = [];
    for (let i = 0; i < 4; i++) { conJs.push(await suma(false)); sinJs.push(await suma(true)); }
    const min = a => Math.min.apply(null, a);
    ok('el bloqueo al cargar no lo pone nuestro JS, sino GSAP y la webfont',
      min(conJs) - min(sinJs) < 60,
      'con main.js ' + conJs.join('/') + ' ms · vacío ' + sinJs.join('/') + ' ms');
  }

  /* ============ 6. reduced motion ============ */
  {
    const page = await nuevaPagina(browser, { reducedMotion: 'reduce' });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);

    const rm = await page.evaluate(() => {
      const chars = Array.from(document.querySelectorAll('[data-clausula] .ch'));
      const svg = document.querySelector('[data-clausula] > .marcas');
      const paths = Array.from(svg.querySelectorAll('path'));
      return {
        texto: chars.every(c => parseFloat(getComputedStyle(c).opacity) > 0.95),
        subrayados: paths.length > 0 && paths.every(p => Math.round(parseFloat(p.style.strokeDashoffset) || 0) === 0),
        lenis: document.documentElement.classList.contains('lenis'),
        botones: parseFloat(getComputedStyle(document.querySelector('.hero-pie')).opacity)
      };
    });
    ok('con reduced-motion la cláusula ya está escrita', rm.texto);
    ok('con reduced-motion los subrayados ya están puestos', rm.subrayados);
    ok('con reduced-motion no se activa Lenis', !rm.lenis);
    ok('con reduced-motion los botones del hero se ven', rm.botones > 0.95, rm.botones);
    await page.screenshot({ path: path.join(CAPS, 'reduced-motion.png') });

    await irA(page, '#credenciales');
    await page.waitForTimeout(700);
    const marcosRM = await page.evaluate(() => {
      const angulo = el => {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI * 100) / 100;
      };
      const hojas = Array.from(document.querySelectorAll('.marco-hoja'));
      return {
        rectos: hojas.every(h => Math.abs(angulo(h)) < 0.6),
        opacos: hojas.every(h => parseFloat(getComputedStyle(h).opacity) > 0.95)
      };
    });
    ok('con reduced-motion los diplomas ya están rectos y visibles',
      marcosRM.rectos && marcosRM.opacos, JSON.stringify(marcosRM));

    await irA(page, '#procedimiento');
    await page.waitForTimeout(600);
    const procRM = await page.evaluate(() => ({
      linea: document.querySelector('.proc-pasos').style.getPropertyValue('--proc'),
      activos: document.querySelectorAll('.paso.activo').length
    }));
    ok('con reduced-motion el procedimiento está entero', procRM.linea === '100%' && procRM.activos === 4,
      JSON.stringify(procRM));

    ok('sin errores de consola con reduced-motion', page.errores.length === 0, page.errores.join(' | '));
    await page.close();
  }

  /* ============ 7. sin JS y sin GSAP ============ */
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    const sinJs = await page.evaluate(() => 0).catch(() => null);
    const texto = await page.innerText('body');
    ok('sin JS el texto de la cláusula se lee', /Por la presente, quien suscribe/.test(texto));
    ok('sin JS no aparece el aviso de cookies', !(await page.isVisible('.cookie-banner')));
    ok('sin JS no hay iframe de Google', (await page.locator('iframe').count()) === 0);
    const marcaCSS = await page.evaluate(() => {
      const el = document.querySelector('.quien-bio [data-marca]');
      return getComputedStyle(el).backgroundImage !== 'none' || getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)';
    });
    ok('sin JS los resaltados los pinta el CSS de respaldo', marcaCSS);
    await page.screenshot({ path: path.join(CAPS, 'sin-js.png'), fullPage: false });
    await ctx.close();
  }
  {
    /* GSAP bloqueado: la página no puede quedarse en blanco */
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.route('**/cdn.jsdelivr.net/**', r => r.abort());
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const vis = await page.evaluate(() => ({
      clase: document.documentElement.className,
      hero: parseFloat(getComputedStyle(document.querySelector('.hero-pie')).opacity),
      texto: document.querySelector('.clausula').innerText.length
    }));
    ok('con GSAP bloqueado la página se ve igual de legible',
      /no-gsap/.test(vis.clase) && vis.hero > 0.95 && vis.texto > 100, JSON.stringify(vis));
    await page.screenshot({ path: path.join(CAPS, 'sin-gsap.png') });
    await ctx.close();
  }

  /* ============ 8. responsive ============ */
  {
    for (const ancho of [1440, 1280, 1024, 768, 540, 400, 360]) {
      const page = await nuevaPagina(browser, { viewport: { width: ancho, height: 900 } });
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2400);

      const desborde = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        win: window.innerWidth,
        culpables: Array.from(document.querySelectorAll('body *'))
          .filter(e => e.getBoundingClientRect().right > window.innerWidth + 2)
          .slice(0, 4).map(e => e.className || e.tagName)
      }));
      ok('sin scroll horizontal a ' + ancho + ' px',
        desborde.doc <= desborde.win + 1, JSON.stringify(desborde));

      /* el rotulador tiene que seguir cayendo sobre su palabra */
      const encaje = await page.evaluate(() => {
        const em = document.querySelector('[data-clausula] [data-marca]');
        const svg = document.querySelector('[data-clausula] > .marcas');
        const p = svg && svg.querySelector('path');
        if (!em || !p) return null;
        const re = em.getClientRects()[0];
        const rp = p.getBoundingClientRect();
        return { dx: Math.round(Math.abs(rp.left - re.left)), dy: Math.round(rp.top - re.top) };
      });
      ok('el subrayado cae sobre su palabra a ' + ancho + ' px',
        encaje && encaje.dx < 26 && encaje.dy > 0, JSON.stringify(encaje));

      if (ancho === 1440 || ancho === 400) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(CAPS, `hero-${ancho}.png`) });
        await irA(page, '#credenciales');
        await page.screenshot({ path: path.join(CAPS, `pared-${ancho}.png`) });
        await irA(page, '#contacto');
        await page.screenshot({ path: path.join(CAPS, `contacto-${ancho}.png`) });
      }
      ok('sin errores de consola a ' + ancho + ' px', page.errores.length === 0, page.errores.join(' | '));
      await page.close();
    }
  }

  /* ============ 9. menú móvil ============ */
  {
    const page = await nuevaPagina(browser, { viewport: { width: 400, height: 860 }, isMobile: true, hasTouch: true });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    ok('a 400 px la navegación de escritorio está oculta', !(await page.isVisible('.top-nav')));
    await page.click('.menu-btn');
    await page.waitForTimeout(500);
    ok('el menú móvil abre', await page.isVisible('#menu-movil'));
    await page.screenshot({ path: path.join(CAPS, 'menu-400.png') });
    await page.click('#menu-movil a[href="#contacto"]');
    await page.waitForTimeout(1600);
    const tras = await page.evaluate(() => ({
      cerrado: document.getElementById('menu-movil').hidden,
      y: Math.round(window.scrollY),
      destino: Math.round(document.querySelector('#contacto').getBoundingClientRect().top)
    }));
    ok('el menú se cierra al elegir y lleva a la sección',
      tras.cerrado && tras.y > 100 && Math.abs(tras.destino) < 180, JSON.stringify(tras));
    await page.close();
  }

  /* ============ 10. accesibilidad básica ============ */
  {
    const page = await nuevaPagina(browser);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    const a11y = await page.evaluate(() => {
      const h1 = document.querySelectorAll('h1');
      const troceados = Array.from(document.querySelectorAll('[data-reveal-chars], [data-clausula]'));
      return {
        lang: document.documentElement.lang,
        h1: h1.length,
        h1Texto: h1[0] ? h1[0].textContent.replace(/\s+/g, ' ').trim() : '',
        srOcultos: troceados.every(t => t.querySelector('.sr-solo') && t.querySelector('[aria-hidden="true"]')),
        srTexto: troceados.every(t => t.querySelector('.sr-solo').textContent.length > 8),
        chAria: Array.from(document.querySelectorAll('.pal')).every(p => p.getAttribute('aria-hidden') === 'true'),
        svgAria: Array.from(document.querySelectorAll('.marcas')).every(s => s.getAttribute('aria-hidden') === 'true'),
        skip: !!document.querySelector('.skip'),
        botonMenu: document.querySelector('.menu-btn').getAttribute('aria-expanded')
      };
    });
    ok('el documento declara lang="es"', a11y.lang === 'es');
    ok('hay un único h1 y dice quién es y dónde',
      a11y.h1 === 1 && /Ramos Castro/.test(a11y.h1Texto) && /Carballo/.test(a11y.h1Texto), a11y.h1Texto);
    ok('los titulares troceados conservan su texto para lectores de pantalla',
      a11y.srOcultos && a11y.srTexto, JSON.stringify(a11y));
    ok('las letras sueltas están ocultas a la accesibilidad', a11y.chAria);
    ok('los SVG del rotulador son decorativos', a11y.svgAria);
    ok('hay enlace de salto al contenido', a11y.skip);
    ok('el botón de menú declara aria-expanded', a11y.botonMenu === 'false');

    /* foco visible y navegable */
    await page.keyboard.press('Tab');
    const foco = await page.evaluate(() => document.activeElement.className);
    ok('el primer tabulador va al enlace de salto', /skip/.test(foco), foco);
    await page.close();
  }

  await browser.close();

  const fallos = resultados.filter(r => !r.ok);
  fs.writeFileSync(path.join(__dirname, 'verify-report.json'),
    JSON.stringify({ base: BASE, fecha: new Date().toISOString(), total: resultados.length, fallos: fallos.length, resultados }, null, 1));

  resultados.forEach(r => console.log((r.ok ? 'OK  ' : 'FALLA ') + r.prueba + (r.detalle ? '  -> ' + r.detalle : '')));
  console.log('\n' + (resultados.length - fallos.length) + '/' + resultados.length + ' pruebas correctas');
  if (fallos.length) {
    console.log('\nFALLOS:');
    fallos.forEach(f => console.log(' - ' + f.prueba + (f.detalle ? '  -> ' + f.detalle : '')));
    process.exitCode = 1;
  }
})();
