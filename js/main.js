/* María José Ramos Castro, Abogada · "Cláusula"
   Todo el movimiento es el de alguien revisando un documento: el texto
   aparece como si se escribiera, un rotulador terracota va subrayando lo
   importante detrás de las palabras, los diplomas de la pared se enderezan
   al llegar y las áreas se apilan como folios de un expediente.
   Sin canvas, sin filtros por frame: solo transform, opacidad y stroke. */

(function () {
  "use strict";

  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finoPuntero = window.matchMedia("(pointer: fine)").matches;

  /* Si GSAP no llega (CDN bloqueado), la página se queda estática y legible:
     nada se oculta, y los resaltados los pinta el CSS de respaldo. */
  if (!window.gsap || !window.ScrollTrigger) {
    doc.classList.add("no-gsap");
    iniciarBasico(null);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  doc.classList.add("gsap");

  /* ---------- smooth scroll ---------- */

  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function irA(sel) {
    var el = document.querySelector(sel);
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY - alturaCabecera() + 1;
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  }

  function alturaCabecera() {
    var top = document.querySelector(".top");
    return top ? top.offsetHeight : 90;
  }

  /* ---------- partir texto en letras, respetando los tramos marcados ---------- */

  function partir(el, conMascara) {
    var original = el.cloneNode(true);
    /* para el lector de pantalla, un <br> es un espacio, no una juntura */
    var plano = el.cloneNode(true);
    Array.prototype.slice.call(plano.querySelectorAll("br")).forEach(function (br) {
      br.parentNode.replaceChild(document.createTextNode(" "), br);
    });
    var texto = plano.textContent.replace(/\s+/g, " ").trim();
    var chars = [];

    function meterTexto(txt, destino) {
      txt.split(/(\s+)/).forEach(function (trozo) {
        if (!trozo) return;
        if (/^\s+$/.test(trozo)) { destino.appendChild(document.createTextNode(" ")); return; }
        var pal = document.createElement("span");
        pal.className = "pal";
        pal.setAttribute("aria-hidden", "true");
        trozo.split("").forEach(function (c) {
          var ch = document.createElement("span");
          ch.className = "ch";
          ch.textContent = c;
          if (conMascara) {
            var mask = document.createElement("span");
            mask.className = "ch-mask";
            mask.appendChild(ch);
            pal.appendChild(mask);
          } else {
            pal.appendChild(ch);
          }
          chars.push(ch);
        });
        destino.appendChild(pal);
      });
    }

    function recorrer(origen, destino) {
      Array.prototype.slice.call(origen.childNodes).forEach(function (n) {
        if (n.nodeType === 3) { meterTexto(n.textContent, destino); return; }
        if (n.nodeType !== 1) return;
        /* un tramo marcado se conserva como elemento: sus letras van dentro,
           para poder medir después dónde tiene que pasar el rotulador */
        var copia = n.cloneNode(false);
        copia.textContent = "";
        destino.appendChild(copia);
        recorrer(n, copia);
      });
    }

    el.textContent = "";
    /* el texto real, una sola vez y sin trocear, para quien no ve la animación */
    var lector = document.createElement("span");
    lector.className = "sr-solo";
    lector.textContent = texto;
    el.appendChild(lector);
    /* y la versión troceada, invisible para la accesibilidad */
    var visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    recorrer(original, visual);
    el.appendChild(visual);
    return chars;
  }

  /* ---------- el rotulador: trazos SVG detrás del texto ---------- */

  var NS = "http://www.w3.org/2000/svg";
  var marcas = [];

  function overlayDe(caja) {
    var svg = caja.querySelector(":scope > .marcas");
    if (!svg) {
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "marcas");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      caja.appendChild(svg);
    }
    return svg;
  }

  /* un barrido de rotulador nunca es recto: se va un poco y se pasa de largo */
  function trazo(x0, x1, y, grosor, semilla) {
    var dx = x1 - x0;
    var onda = Math.min(grosor * 0.12, 2.6);
    var s = semilla % 2 ? 1 : -1;
    return "M " + x0.toFixed(1) + " " + (y + onda * s).toFixed(1) +
      " C " + (x0 + dx * 0.3).toFixed(1) + " " + (y - onda).toFixed(1) +
      ", " + (x0 + dx * 0.7).toFixed(1) + " " + (y + onda * 0.8).toFixed(1) +
      ", " + x1.toFixed(1) + " " + (y - onda * 0.5).toFixed(1);
  }

  function construirMarcas() {
    marcas.length = 0;
    /* Tres fases separadas para no provocar un layout por cada trazo:
       (1) se lee toda la geometría, (2) se crean y cuelgan los caminos,
       (3) se miden los largos de una vez y se ponen los guiones. */
    var plan = [];
    document.querySelectorAll("[data-marcas]").forEach(function (caja) {
      var svg = overlayDe(caja);
      var base = caja.getBoundingClientRect();
      caja.querySelectorAll("[data-marca]").forEach(function (el, i) {
        var rects = Array.prototype.slice.call(el.getClientRects());
        plan.push({ svg: svg, el: el, tipo: el.getAttribute("data-marca"), base: base, rects: rects, i: i });
      });
    });

    plan.forEach(function (t) {
      t.svg.textContent = "";
    });

    plan.forEach(function (t) {
      var paths = [];
      t.rects.forEach(function (r, j) {
        if (r.width < 2) return;
        var x0 = r.left - t.base.left;
        var x1 = r.right - t.base.left;
        var arriba = r.top - t.base.top;
        var alto = r.height;
        var p = document.createElementNS(NS, "path");
        if (t.tipo === "resaltado") {
          /* el rotulador ancho: pasa por el centro y desborda los cantos */
          var grosor = alto * 0.74;
          p.setAttribute("d", trazo(x0 - grosor * 0.18, x1 + grosor * 0.22,
            arriba + alto * 0.60, grosor, t.i + j));
          p.setAttribute("stroke", "#CB7F5E");
          p.setAttribute("stroke-width", grosor.toFixed(1));
          p.setAttribute("opacity", "0.34");
        } else {
          /* el subrayado: un trazo fino por debajo de la línea base */
          var g = Math.max(3, Math.min(alto * 0.13, 7));
          p.setAttribute("d", trazo(x0 - 2, x1 + 5, arriba + alto * 0.90, g, t.i + j));
          p.setAttribute("stroke", "#C0714E");
          p.setAttribute("stroke-width", g.toFixed(1));
          p.setAttribute("opacity", "0.9");
        }
        p.setAttribute("fill", "none");
        p.setAttribute("stroke-linecap", "round");
        t.svg.appendChild(p);
        paths.push(p);
      });
      t.paths = paths;
    });

    plan.forEach(function (t) {
      if (!t.paths.length) return;
      t.paths.forEach(function (p) {
        var largo = p.getTotalLength() + 2;
        p.style.strokeDasharray = largo;
        p.style.strokeDashoffset = largo;
      });
      marcas.push({ el: t.el, paths: t.paths, pintada: false });
    });
  }

  function pintarMarca(entrada, retraso, duracion) {
    if (!entrada || entrada.pintada) return;
    entrada.pintada = true;
    if (reduce) { gsap.set(entrada.paths, { strokeDashoffset: 0 }); return; }
    gsap.to(entrada.paths, {
      strokeDashoffset: 0,
      duration: duracion || 0.55,
      ease: "power2.inOut",
      stagger: 0.12,
      delay: retraso || 0
    });
  }

  function marcaDe(el) {
    for (var i = 0; i < marcas.length; i++) if (marcas[i].el === el) return marcas[i];
    return null;
  }

  /* ---------- portada: la cláusula que se escribe y se subraya ---------- */

  var clausula = document.querySelector("[data-clausula]");
  var charsClausula = clausula ? partir(clausula, false) : [];
  if (!reduce && charsClausula.length) {
    gsap.set(charsClausula, { opacity: 0, y: "0.18em" });
  }

  /* ---------- titulares con char reveal ---------- */

  var titulares = [];
  document.querySelectorAll("[data-reveal-chars]").forEach(function (el) {
    titulares.push({ el: el, chars: partir(el, true) });
  });

  /* las medidas del texto sólo son fiables con la tipografía ya cargada */
  function medirYArrancar() {
    construirMarcas();
    if (!arrancada) { arrancarPortada(); enCuantoSePueda(disparadoresDeMarcas); }
    else ScrollTrigger.refresh();
  }

  /* los resaltados fuera de la portada se pintan al entrar en pantalla; se
     crean después de medir, porque antes no existe el trazo que animar */
  function disparadoresDeMarcas() {
    document.querySelectorAll("[data-marca]").forEach(function (el) {
      if (el.closest("[data-clausula]")) return;
      ScrollTrigger.create({
        trigger: el, start: "top 84%", once: true,
        onEnter: function () { pintarMarca(marcaDe(el), 0.12, 0.65); }
      });
    });
  }

  var arrancada = false;
  function arrancarPortada() {
    if (arrancada) return;
    arrancada = true;

    if (reduce) {
      gsap.set(charsClausula, { opacity: 1, y: 0 });
      marcas.forEach(function (m) { pintarMarca(m); });
      return;
    }

    var tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo(".hero-sello", { y: 8 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" });
    tl.to(charsClausula,
      { opacity: 1, y: 0, duration: 0.9, ease: "power2.out", stagger: 0.008 }, 0.1);
    tl.fromTo(".hero-pie", { y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.5");
    tl.to(".hero-scroll", { opacity: 1, duration: 0.6 }, "-=0.4");

    /* cada subrayado entra justo cuando su palabra acaba de aparecer */
    var total = charsClausula.length;
    document.querySelectorAll("[data-clausula] [data-marca]").forEach(function (el) {
      var propias = el.querySelectorAll(".ch");
      var ultima = propias[propias.length - 1];
      var idx = charsClausula.indexOf(ultima);
      if (idx < 0) idx = total - 1;
      pintarMarca(marcaDe(el), 0.1 + idx * 0.008 + 0.55, 0.6);
    });
  }

  /* sin esperar a las fuentes la portada se quedaría muda si la red va mal */
  if (document.fonts && document.fonts.ready) {
    var aTiempo = setTimeout(medirYArrancar, 1200);
    document.fonts.ready.then(function () { clearTimeout(aTiempo); medirYArrancar(); });
  } else {
    medirYArrancar();
  }

  /* ---------- el arranque se reparte en varios frames ----------
     Montar de golpe los ScrollTrigger de diez marcos, seis tarjetas, cuatro
     pasos y el folio bloquea el hilo principal más de 100 ms justo cuando el
     visitante está mirando la portada escribirse. Se trocea en tres tandas. */

  function enCuantoSePueda(fn) {
    if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 500 });
    else setTimeout(fn, 32);
  }

  function montarTanda1() {
    /* ---------- titulares y resaltados del resto del documento ---------- */

    titulares.forEach(function (t) {
      if (reduce) { gsap.set(t.chars, { yPercent: 0, opacity: 1 }); return; }
      gsap.set(t.chars, { yPercent: 108, opacity: 0 });
      ScrollTrigger.create({
        trigger: t.el, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(t.chars, {
            yPercent: 0, opacity: 1, duration: 0.95,
            ease: "power2.out", stagger: 0.018
          });
        }
      });
    });
    enCuantoSePueda(montarTanda2);
  }

  function montarTanda2() {
    /* ---------- II · la pared: los marcos se enderezan al llegar ---------- */

    document.querySelectorAll(".marco").forEach(function (marco, i) {
      var hoja = marco.querySelector(".marco-hoja");
      if (!hoja) return;
      var rot = parseFloat(getComputedStyle(marco).getPropertyValue("--rot")) || 0;

      if (reduce) { gsap.set(hoja, { rotate: 0, y: 0, opacity: 1 }); return; }

      gsap.set(hoja, { rotate: rot, y: 18, opacity: 0 });
      ScrollTrigger.create({
        trigger: marco, start: "top 90%", once: true,
        onEnter: function () {
          gsap.to(hoja, {
            rotate: 0, y: 0, opacity: 1,
            duration: 1.05, ease: "power3.out", delay: (i % 5) * 0.06
          });
        }
      });

      /* parallax muy corto: la pared respira, no se mueve */
      gsap.to(hoja, {
        yPercent: (i % 3 === 0 ? -4 : i % 3 === 1 ? 3 : -2),
        ease: "none",
        scrollTrigger: { trigger: marco, start: "top bottom", end: "bottom top", scrub: 1 }
      });
    });
    enCuantoSePueda(montarTanda3);
  }

  function montarTanda3() {
    /* ---------- III · las áreas se apilan como folios ---------- */

    var fichas = Array.prototype.slice.call(document.querySelectorAll(".stack-li"));
    fichas.forEach(function (li, i) {
      var tarjeta = li.querySelector(".ficha-area");
      if (!tarjeta) return;

      if (!reduce) {
        gsap.fromTo(tarjeta,
          { opacity: 0, y: 34 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
            scrollTrigger: { trigger: li, start: "top 88%", once: true }
          });
      }

      /* la tarjeta tapada se encoge un poco: sólo escala, nunca opacidad
         (un scrub sobre la opacidad pelearía con la entrada de arriba) */
      if (i < fichas.length - 1 && !reduce) {
        gsap.to(tarjeta, {
          scale: 0.955, ease: "none",
          scrollTrigger: {
            trigger: fichas[i + 1], start: "top bottom", end: "top top+=" + (alturaCabecera() + 60),
            scrub: 0.4
          }
        });
      }
    });

    /* ---------- IV · el procedimiento se va sellando ---------- */

    (function () {
      var lista = document.querySelector(".proc-pasos");
      if (!lista) return;
      var pasos = Array.prototype.slice.call(lista.querySelectorAll(".paso"));

      if (reduce) {
        lista.style.setProperty("--proc", "100%");
        pasos.forEach(function (p) { p.classList.add("activo"); });
        return;
      }

      var estado = { p: 0 };
      var pintar = function () { lista.style.setProperty("--proc", (estado.p * 100).toFixed(2) + "%"); };
      var mover = gsap.quickTo(estado, "p", { duration: 0.5, ease: "power3.out", onUpdate: pintar });

      ScrollTrigger.create({
        trigger: lista,
        start: "top 62%",
        end: "bottom 78%",
        onUpdate: function (self) { mover(self.progress); }
      });

      pasos.forEach(function (paso) {
        ScrollTrigger.create({
          trigger: paso, start: "top 68%",
          onEnter: function () { paso.classList.add("activo"); },
          onLeaveBack: function () { paso.classList.remove("activo"); }
        });
      });
    })();

    /* ---------- el folio de la cabecera: en qué cláusula va el lector ---------- */

    (function () {
      var titulo = document.querySelector("[data-folio-titulo]");
      var num = document.querySelector("[data-folio-num]");
      var barra = document.querySelector("[data-folio-barra]");
      if (!titulo || !num || !barra) return;

      var secciones = Array.prototype.slice.call(document.querySelectorAll("[data-clausula-num]"));

      secciones.forEach(function (sec, i) {
        ScrollTrigger.create({
          trigger: sec,
          start: "top 55%",
          end: i === secciones.length - 1 ? function () { return ScrollTrigger.maxScroll(window) + 60; } : "bottom 55%",
          onToggle: function (self) {
            if (!self.isActive) return;
            titulo.textContent = sec.dataset.clausulaNombre;
            num.textContent = String(i + 1).padStart(2, "0");
          }
        });
      });

      /* antes de la primera cláusula, el folio vuelve a la portada */
      ScrollTrigger.create({
        trigger: secciones[0], start: "top 55%",
        onLeaveBack: function () {
          titulo.textContent = "Carballo · A Coruña";
          num.textContent = "00";
        }
      });

      var estado = { p: 0 };
      var pintar = function () { barra.style.width = (estado.p * 100).toFixed(2) + "%"; };
      var mover = reduce
        ? function (p) { estado.p = p; pintar(); }
        : gsap.quickTo(estado, "p", { duration: 0.45, ease: "power3.out", onUpdate: pintar });

      ScrollTrigger.create({
        trigger: document.body, start: "top top", end: "bottom bottom",
        onUpdate: function (self) { mover(self.progress); }
      });
    })();

    /* sobre el pie carbón, el botón de llamar se invierte para seguir viéndose */
    (function () {
      var llamar = document.querySelector(".llamar");
      var pie = document.querySelector(".pie");
      if (!llamar || !pie) return;
      ScrollTrigger.create({
        trigger: pie, start: "top 88%",
        onToggle: function (self) { llamar.classList.toggle("sobre-pie", self.isActive); }
      });
    })();

    /* ---------- marquee ---------- */

    var pista = document.querySelector(".marquee-pista");
    if (pista && !reduce) {
      gsap.to(pista, { xPercent: -50, duration: 56, ease: "none", repeat: -1 });
    }

    /* ---------- botones magnéticos ---------- */

    if (!reduce && finoPuntero) {
      document.querySelectorAll(".magnetico").forEach(function (btn) {
        var qx = gsap.quickTo(btn, "x", { duration: 0.45, ease: "power3.out" });
        var qy = gsap.quickTo(btn, "y", { duration: 0.45, ease: "power3.out" });
        btn.addEventListener("pointermove", function (e) {
          var r = btn.getBoundingClientRect();
          qx((e.clientX - (r.left + r.width / 2)) * 0.28);
          qy((e.clientY - (r.top + r.height / 2)) * 0.4);
        });
        btn.addEventListener("pointerleave", function () { qx(0); qy(0); });
      });
    }
    ScrollTrigger.refresh();
  }

  enCuantoSePueda(montarTanda1);

  /* ---------- el texto se recoloca: hay que volver a medir el rotulador ---------- */

  var anchoAnterior = window.innerWidth;
  var esperaMedida = null;
  window.addEventListener("resize", function () {
    if (window.innerWidth === anchoAnterior) return;   // el teclado móvil no cuenta
    anchoAnterior = window.innerWidth;
    clearTimeout(esperaMedida);
    esperaMedida = setTimeout(function () {
      var pintadas = marcas.filter(function (m) { return m.pintada; }).map(function (m) { return m.el; });
      construirMarcas();
      marcas.forEach(function (m) {
        if (pintadas.indexOf(m.el) >= 0) { m.pintada = true; gsap.set(m.paths, { strokeDashoffset: 0 }); }
      });
      ScrollTrigger.refresh();
    }, 200);
  });

  /* si la página cambia de alto (p. ej. al insertar el mapa), se recalcula */
  if (window.ResizeObserver) {
    var altoAnterior = document.body.scrollHeight, esperaRefresh = null;
    new ResizeObserver(function () {
      if (document.body.scrollHeight === altoAnterior) return;
      altoAnterior = document.body.scrollHeight;
      clearTimeout(esperaRefresh);
      esperaRefresh = setTimeout(function () { ScrollTrigger.refresh(); }, 160);
    }).observe(document.body);
  }

  iniciarBasico(lenis);

  /* ---------- lo que funciona con o sin GSAP ---------- */

  function iniciarBasico(motor) {
    /* cookies: mientras el aviso está abierto, el botón de llamar sube lo que
       mida el aviso (--cookie-h) para no quedar tapado */
    var banner = document.querySelector(".cookie-banner");
    var CLAVE = "mjrc-cookie-ack";
    var visto = false;
    try { visto = localStorage.getItem(CLAVE) === "1"; } catch (e) { visto = false; }

    function ajustarOffset() {
      var alto = (banner && !banner.hidden) ? banner.offsetHeight + 14 : 0;
      document.documentElement.style.setProperty("--cookie-h", alto + "px");
    }

    if (banner && !visto) {
      banner.hidden = false;
      requestAnimationFrame(ajustarOffset);
      window.addEventListener("resize", ajustarOffset);
    }
    if (banner) {
      banner.querySelector(".cookie-ack").addEventListener("click", function () {
        banner.hidden = true;
        ajustarOffset();
        try { localStorage.setItem(CLAVE, "1"); } catch (e) { /* modo privado */ }
      });
    }

    var anio = document.querySelector("[data-anio]");
    if (anio) anio.textContent = String(new Date().getFullYear());

    document.querySelectorAll("[data-dialog]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dlg = document.getElementById(btn.dataset.dialog);
        if (dlg && dlg.showModal) dlg.showModal();
      });
    });
    document.querySelectorAll("[data-cerrar]").forEach(function (btn) {
      btn.addEventListener("click", function () { btn.closest("dialog").close(); });
    });

    /* mapa por consentimiento: el iframe sólo existe si lo pide el visitante */
    var mapBtn = document.querySelector("[data-map]");
    if (mapBtn) {
      mapBtn.addEventListener("click", function () {
        var caja = mapBtn.closest(".map-consent");
        var iframe = document.createElement("iframe");
        iframe.src = "https://www.google.com/maps?q=" +
          encodeURIComponent("María José Ramos Castro Abogada, Rúa Fomento, 51, 15102 Carballo, A Coruña") +
          "&output=embed";
        iframe.loading = "lazy";
        iframe.title = "Mapa de la ubicación del despacho en Rúa Fomento, 51, Carballo";
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        caja.innerHTML = "";
        caja.style.padding = "0";
        caja.appendChild(iframe);
      });
    }

    /* menú móvil */
    var menuBtn = document.querySelector(".menu-btn");
    var menu = document.getElementById("menu-movil");
    if (menuBtn && menu) {
      var abrir = function (si) {
        menu.hidden = !si;
        menuBtn.setAttribute("aria-expanded", String(si));
        menuBtn.setAttribute("aria-label", si ? "Cerrar menú" : "Abrir menú");
        document.body.style.overflow = si ? "hidden" : "";
        if (motor) { si ? motor.stop() : motor.start(); }
      };
      menuBtn.addEventListener("click", function () {
        abrir(menuBtn.getAttribute("aria-expanded") !== "true");
      });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { abrir(false); });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !menu.hidden) abrir(false);
      });
    }

    /* anclas: con GSAP van por Lenis; sin él, con el scroll del navegador */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === "#" || a.classList.contains("skip")) return;
      a.addEventListener("click", function (e) {
        var destino = document.querySelector(href);
        if (!destino) return;
        e.preventDefault();
        if (window.gsap) { irA(href); return; }
        var top = document.querySelector(".top");
        window.scrollTo({
          top: destino.getBoundingClientRect().top + window.scrollY - (top ? top.offsetHeight : 90),
          behavior: "smooth"
        });
      });
    });
  }
})();
