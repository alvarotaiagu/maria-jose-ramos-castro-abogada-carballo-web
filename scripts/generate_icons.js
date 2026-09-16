/* Rasteriza el icono y compone la imagen social (og.png) con Playwright.
   Uso: NODE_PATH=<ruta node_modules> node scripts/generate_icons.js */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOGO = path.join(__dirname, '..', 'assets', 'img', 'logo');
const icono = fs.readFileSync(path.join(LOGO, 'icon.svg'), 'utf8');
const wordmark = fs.readFileSync(path.join(LOGO, 'logo.svg'), 'utf8');

(async () => {
  const browser = await chromium.launch();

  for (const lado of [96, 180, 192, 512]) {
    const page = await browser.newPage({ viewport: { width: lado, height: lado } });
    await page.setContent(
      `<body style="margin:0"><div style="width:${lado}px;height:${lado}px">${icono}</div></body>`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(LOGO, `icon-${lado}.png`), omitBackground: true });
    await page.close();
    console.log('icon-' + lado + '.png');
  }

  /* og: el folio con el wordmark y el dato real que importa, el teléfono */
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(`<!DOCTYPE html><meta charset="utf-8">
  <style>
    @font-face{font-family:I;src:local("Inter"),local("Segoe UI")}
    body{margin:0;width:1200px;height:630px;background:#FAF8F6;
      background-image:repeating-linear-gradient(to bottom,transparent 0 47px,#EDE6E0 47px 48px);
      display:flex;flex-direction:column;justify-content:center;gap:34px;padding:0 84px;
      font-family:Inter,"Segoe UI",system-ui,sans-serif;color:#2B2A28;box-sizing:border-box}
    .wm{width:720px}
    .linea{height:1px;background:#DCD5CE}
    .datos{display:flex;gap:44px;font-size:23px;color:#57534E;letter-spacing:.01em}
    .datos b{color:#2B2A28;font-weight:600}
    .lema{font-size:31px;color:#2B2A28;max-width:820px;line-height:1.35}
    .lema i{font-style:italic;background:rgba(203,127,94,.32);padding:0 .18em}
    .sello{position:absolute;top:56px;right:84px;font-size:14px;letter-spacing:.26em;
      text-transform:uppercase;color:#8A837C}
  </style>
  <span class="sello">Carballo · A Coruña</span>
  <div class="wm">${wordmark}</div>
  <div class="linea"></div>
  <p class="lema" style="margin:0">Aquí leen <i>la letra pequeña</i> por usted.</p>
  <div class="datos">
    <span><b>881 12 92 67</b></span>
    <span>Rúa Fomento, 51 — 1º E</span>
    <span>Lunes a viernes, 9:30–20:00</span>
  </div>`);
  await og.waitForTimeout(400);
  await og.screenshot({ path: path.join(LOGO, 'og.png') });
  console.log('og.png');

  await browser.close();
})();
