/**
 * Génère les captures d'écran du README (docs/screenshots/) de façon reproductible.
 *
 * L'extension est chargée dans un vrai navigateur et tourne sur des PAGES FACTICES LOCALES
 * (voir pages.js) : aucun vrai réseau social, aucun vrai compte, aucun vrai spoil, aucun logo ni
 * visuel protégé. Les noms d'hôte (x.com, www.youtube.com) sont redirigés vers un serveur HTTPS local.
 *
 * Usage (voir README.md de ce dossier) :   npm install && node make.js
 */
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { pages, bannerHtml } = require('./pages.js');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'screenshots');
const BROWSER = process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 8460;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMPTY = { x: [], youtube: [], tiktok: [], instagram: [], facebook: [], reddit: [] };

const server = https.createServer(
  { key: fs.readFileSync(path.join(__dirname, 'key.pem')), cert: fs.readFileSync(path.join(__dirname, 'cert.pem')) },
  (req, res) => {
    const host = (req.headers.host || '').split(':')[0];
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(pages[host] ? pages[host](req.url.split('?')[0]) : '?');
  }
);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((r) => server.listen(PORT, r));
  const hosts = Object.keys(pages);
  const browser = await puppeteer.launch({
    executablePath: BROWSER, headless: 'new', ignoreDefaultArgs: ['--disable-extensions'],
    args: [`--load-extension=${ROOT}`, `--host-resolver-rules=${hosts.map((h) => `MAP ${h} 127.0.0.1`).join(',')}`,
      '--ignore-certificate-errors', '--no-sandbox', '--hide-scrollbars'],
  });
  const swT = await browser.waitForTarget((t) => t.type() === 'service_worker', { timeout: 15000 });
  const sw = await swT.worker();
  const extId = new URL(swT.url()).host;
  await sleep(1500); // laisse finir onInstalled

  const setSync = async (o) => { await sw.evaluate((x) => chrome.storage.sync.set(x), o); await sleep(400); };
  const shot = async (page, file, w, h, scale = 2) => {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
    await sleep(500);
    await page.screenshot({ path: path.join(OUT, file) });
    console.log('  ✓', file);
  };
  const openPage = async (host, p, w, h) => {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto(`https://${host}:${PORT}${p}`, { waitUntil: 'load' });
    await sleep(900);
    return page;
  };

  // Réglages de démonstration : mode Extrême, délai 5 s, liste blanche avec des comptes FICTIFS.
  await setSync({ enabled: true, mode: 'extreme', customKeywords: [], revealDelay: 5, theme: 'vicecity', whitelistEnabled: true,
    whitelist: { ...EMPTY, x: ['demo_studio'], youtube: ['demo_channel'] } });
  await sw.evaluate(() => chrome.storage.local.set({ totalBlocked: 0 }));

  console.log('Pages bloquées');
  let page = await openPage('x.com', '/', 640, 300);
  await shot(page, 'blocked-x.png', 640, 300);

  // Compte à rebours : Tab, Tab, Entrée sur « Afficher quand même », capture au bout d'une seconde.
  await page.setViewport({ width: 640, height: 300, deviceScaleFactor: 2 });
  await page.evaluate(() => { const b = document.createElement('button'); b.id = 'start'; b.style.cssText = 'position:fixed;left:-99px'; document.body.prepend(b); b.focus(); });
  // 2 liens visibles (nom + @pseudo) du 1er post, puis le bouton « Afficher quand même »
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await sleep(1100);
  await page.screenshot({ path: path.join(OUT, 'countdown.png') });
  console.log('  ✓ countdown.png');
  await page.close();

  page = await openPage('www.youtube.com', '/', 760, 290);
  await shot(page, 'blocked-youtube.png', 760, 290);
  await page.close();

  console.log('Popup');
  const pop = await browser.newPage();
  await pop.setViewport({ width: 340, height: 700, deviceScaleFactor: 2 }); // largeur réelle de la popup
  await pop.goto(`chrome-extension://${extId}/popup.html`);
  await sleep(700);
  await pop.screenshot({ path: path.join(OUT, 'popup-vicecity.png'), fullPage: true });
  console.log('  ✓ popup-vicecity.png');
  await pop.setViewport({ width: 340, height: 960, deviceScaleFactor: 2 });
  await pop.click('#tabBtnWhitelist'); await sleep(300);
  await pop.screenshot({ path: path.join(OUT, 'whitelist-vicecity.png'), fullPage: true });
  console.log('  ✓ whitelist-vicecity.png');
  await pop.select('#theme', 'dark').catch(() => {});
  await pop.setViewport({ width: 340, height: 700, deviceScaleFactor: 2 });
  await pop.click('#tabBtnSettings'); await pop.select('#theme', 'dark'); await sleep(300);
  await pop.screenshot({ path: path.join(OUT, 'popup-dark.png'), fullPage: true });
  console.log('  ✓ popup-dark.png');
  await pop.setViewport({ width: 340, height: 960, deviceScaleFactor: 2 });
  await pop.click('#tabBtnWhitelist'); await sleep(300);
  await pop.screenshot({ path: path.join(OUT, 'whitelist-dark.png'), fullPage: true });
  console.log('  ✓ whitelist-dark.png');
  await setSync({ theme: 'vicecity' });
  await pop.close();

  console.log('Bannière');
  const ban = await browser.newPage();
  await ban.setViewport({ width: 1280, height: 640, deviceScaleFactor: 1 });
  await ban.setContent(bannerHtml, { waitUntil: 'load' });
  await sleep(300);
  await ban.screenshot({ path: path.join(OUT, 'banner.png') });
  console.log('  ✓ banner.png');

  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
