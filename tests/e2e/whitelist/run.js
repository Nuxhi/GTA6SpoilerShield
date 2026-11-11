/**
 * Liste blanche — test de bout en bout dans un vrai navigateur (extension chargée).
 * Voir README.md de ce dossier. 90 vérifications : X, YouTube, Reddit, TikTok, Instagram, Facebook, popup.
 */
const https = require('https'), fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core');
const pagesWl = require('./pages.js');
const pages = {}; // pas de pages de repli : tout passe par pages.js
const EXT = path.join(__dirname, '..', '..', '..', 'extension'); // dossier de l'extension
const BROWSER = process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 8450;
const hosts = [...new Set([...Object.keys(pages), ...Object.keys(pagesWl)])].filter((h) => h.includes('.'));
const server = https.createServer({ key: fs.readFileSync(path.join(__dirname, 'key.pem')), cert: fs.readFileSync(path.join(__dirname, 'cert.pem')) },
  (req, res) => {
    const host = (req.headers.host || '').split(':')[0]; const p = req.url.split('?')[0];
    let html = pagesWl[host] ? pagesWl[host](p) : undefined;
    if (html === undefined) html = pages[host] ? pages[host](p) : '?';
    res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(html);
  });

let failures = 0, count = 0;
const check = (name, cond, extra) => { count++; if (cond) console.log('  ✓', name); else { failures++; console.log('  ✗', name, extra !== undefined ? '→ ' + JSON.stringify(extra) : ''); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMPTY = { x: [], youtube: [], tiktok: [], instagram: [], facebook: [], reddit: [] };

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await puppeteer.launch({
    executablePath: BROWSER, headless: 'new', ignoreDefaultArgs: ['--disable-extensions'],
    args: [`--load-extension=${EXT}`, `--host-resolver-rules=${hosts.map((h) => `MAP ${h} 127.0.0.1`).join(',')}`, '--ignore-certificate-errors', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
  });
  const swT = await browser.waitForTarget((t) => t.type() === 'service_worker', { timeout: 15000 });
  const sw = await swT.worker(); const extId = new URL(swT.url()).host;
  await sleep(1500); // laisse finir onInstalled
  const setWl = async (patch, enabled = true) => {
    await sw.evaluate((p, en) => chrome.storage.sync.set({ whitelist: p, whitelistEnabled: en }), { ...EMPTY, ...patch }, enabled); await sleep(450);
  };
  await sw.evaluate(() => chrome.storage.sync.set({ enabled: true, mode: 'extreme', customKeywords: [], revealDelay: 0 })); await sleep(300);
  const open = async (host, p = '/wl', wait = 700) => {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width: 900, height: 900 });
    await page.goto(`https://${host}:${PORT}${p}`, { waitUntil: 'load' }); await sleep(wait); page._errors = errors; return page;
  };
  // « bloqué » = l'élément ou un ancêtre porte l'état hidden/kept ; « visible » = ni bloqué ni caché
  const blocked = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return !!(e && e.closest('[data-g6s-state="hidden"],[data-g6s-state="kept"]')); }, sel);
  const visible = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.closest('[data-g6s-state="hidden"],[data-g6s-state="kept"]') && getComputedStyle(e).visibility === 'visible'; }, sel);
  const playing = (page, sel) => page.evaluate((s) => { const v = document.querySelector(s); return !v.paused && !v.muted; }, sel);
  const paused = (page, sel) => page.evaluate((s) => { const v = document.querySelector(s); return v.paused && v.muted; }, sel);
  const stats = () => sw.evaluate(async () => { const tabs = await chrome.tabs.query({}); const out = []; for (const t of tabs) { try { const r = await chrome.tabs.sendMessage(t.id, { type: 'g6s:getStats' }); if (r) out.push(r); } catch (e) {} } return out; });
  const store = () => sw.evaluate(() => chrome.storage.sync.get(['whitelist', 'whitelistEnabled']));

  // ═══════════ 0. Sans liste blanche : tout est bloqué comme avant ═══════════
  console.log('\n[0] Liste blanche vide : comportement inchangé');
  await setWl({});
  let page = await open('x.com');
  for (const id of ['a1', 'a2', 'a3', 'a4', 'a8', 'a11']) check(`${id} bloqué (aucune liste)`, await blocked(page, '#' + id));
  await page.close();

  // ═══════════ 1. X : jeu de cas demandé ═══════════
  console.log('\n[1] X — liste : @RockstarGames');
  await sw.evaluate(() => chrome.storage.local.set({ totalBlocked: 0 })); await sleep(200);
  await setWl({ x: ['rockstargames'] });
  page = await open('x.com', '/wl', 1200);
  check('compte autorisé → débloqué', await visible(page, '#a1'));
  check('compte non autorisé → bloqué', await blocked(page, '#a2'));
  check('faux compte, même nom affiché que Rockstar mais autre handle → bloqué', await blocked(page, '#a3'));
  check('repost par un compte autorisé d\'un compte inconnu → bloqué', await blocked(page, '#a4'));
  check('citation d\'un inconnu dans un post autorisé : le post est débloqué', await visible(page, '#a5 > [data-testid="tweetText"]'));
  check('citation d\'un inconnu dans un post autorisé : la partie citée reste bloquée', await blocked(page, '#q5'));
  check('citation d\'un compte AUTORISÉ dans un post autorisé → débloquée', await visible(page, '#q6'));
  check('citation impossible à isoler → tout reste bloqué (prudence)', await blocked(page, '#a7'));
  check('auteur introuvable dans le DOM → bloqué', await blocked(page, '#a8'));
  check('réponse d\'un inconnu (autre article) sous un post autorisé → bloquée', await blocked(page, '#a9'));
  check('lien d\'auteur vers un domaine étranger (evil.com/RockstarGames) → bloqué', await blocked(page, '#a10'));
  check('mention d\'un autre compte dans le texte ne gêne pas l\'auteur autorisé', await visible(page, '#a11'));
  check('vidéo d\'un post autorisé : lecture et son rétablis une fois débloquée', await playing(page, '#m1 video'));
  const st = (await stats()).find((s) => s.site === 'X / Twitter');
  check('compteur de page : seuls les contenus restés bloqués sont comptés (9)', st && st.pageCount === 9, st);
  await sleep(500);
  const tot = await sw.evaluate(() => chrome.storage.local.get({ totalBlocked: 0 }));
  check('compteur total : les contenus débloqués ne sont pas comptés (9)', tot.totalBlocked === 9, tot);
  check('aucune erreur JS', page._errors.length === 0, page._errors);

  console.log('\n[1b] X — changements à chaud (sans rechargement)');
  await setWl({ x: ['rockstargames', 'randomuser'] });
  check('ajout d\'un compte : ses posts masqués sont débloqués à chaud (a2, a9, a12)', (await visible(page, '#a2')) && (await visible(page, '#a9')) && (await visible(page, '#a12')));
  check('… sans débloquer le faux compte', await blocked(page, '#a3'));
  await setWl({ x: ['rockstargames'] });
  check('retrait d\'un compte : ses posts sont re-bloqués', (await blocked(page, '#a2')) && (await blocked(page, '#a12')));
  check('… et les autres restent comme avant', await visible(page, '#a1'));
  await setWl({ x: ['rockstargames'] }, false);
  check('liste blanche en pause : même @RockstarGames est de nouveau bloqué', await blocked(page, '#a1'));
  await setWl({ x: ['rockstargames'] }, true);
  check('reprise : débloqué à nouveau', await visible(page, '#a1'));
  await page.close();

  // Faux compte qui « recycle » un élément autorisé : l'auteur est revérifié
  console.log('\n[1c] Élément recyclé : l\'auteur est revérifié');
  page = await open('x.com', '/wl', 900);
  await page.evaluate(() => { document.querySelectorAll('#a1 a').forEach((a) => a.setAttribute('href', '/rockstar_fake')); });
  await sleep(900);
  check('lien d\'auteur changé sur un élément déjà autorisé → re-bloqué', await blocked(page, '#a1'));
  await page.close();

  // ═══════════ 2. « Toujours autoriser ce compte » depuis l'écran noir ═══════════
  console.log('\n[2] Écran noir : « Toujours autoriser ce compte » (avec confirmation)');
  await setWl({});
  page = await open('x.com', '/wl', 900);
  await page.evaluate(() => { const b = document.createElement('button'); b.id = 'start'; b.textContent = 's'; document.body.prepend(b); b.focus(); });
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');   // Afficher, Garder masqué, Toujours autoriser
  await page.keyboard.press('Enter');                              // → vue de confirmation (focus sur « Annuler »)
  await sleep(300);
  check('avant confirmation : rien n\'est ajouté ni débloqué', (await blocked(page, '#a1')) && (await store()).whitelist.x.length === 0);
  await page.keyboard.press('Enter');                              // Annuler (focus par défaut = choix sûr)
  await sleep(300);
  check('« Annuler » : toujours bloqué, liste intacte', (await blocked(page, '#a1')) && (await store()).whitelist.x.length === 0);
  await page.evaluate(() => document.getElementById('start').focus());
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');                              // confirmation
  await sleep(300);
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); // → « Confirmer »
  await page.keyboard.press('Enter');
  await sleep(600);
  check('confirmé : le compte est ajouté dans chrome.storage.sync', (await store()).whitelist.x.includes('rockstargames'), await store());
  check('confirmé : le post est débloqué sans rechargement', await visible(page, '#a1'));
  check('confirmé : les posts des AUTRES comptes restent bloqués', (await blocked(page, '#a2')) && (await blocked(page, '#a3')));
  await page.close();

  // ═══════════ 3. YouTube : @handle puis ID UC… ═══════════
  console.log('\n[3] YouTube');
  await setWl({ youtube: ['rockstargames'] });
  await sw.evaluate(() => chrome.storage.local.remove('aliases')); await sleep(200);
  const yt = await open('www.youtube.com', '/wl', 1000);
  check('chaîne autorisée (@handle) → débloquée', await visible(yt, '#y1'));
  check('faux compte au même nom affiché (@RockstarGamesFake) → bloqué', await blocked(yt, '#y2'));
  check('ID UC… pas encore relié au @handle → bloqué', await blocked(yt, '#y3'));
  check('collaboration (deux chaînes) → bloqué', await blocked(yt, '#y4'));
  check('lien vers Rockstar dans la description d\'une autre chaîne → ignoré (bloqué)', await blocked(yt, '#y5'));
  check('publicité sans annonceur identifiable → bloquée', await blocked(yt, '#y6'));
  check('carte sans lien de chaîne → bloquée', await blocked(yt, '#y7'));
  check('commentaire d\'un inconnu sous une vidéo → bloqué', await blocked(yt, '#c1'));
  check('commentaire de la chaîne autorisée → débloqué', await visible(yt, '#c2'));

  const chan = await open('www.youtube.com', '/@RockstarGames', 300);
  await sleep(4200); // la paire doit être observée de façon stable (≥ 1,5 s)
  const al = await sw.evaluate(() => chrome.storage.local.get('aliases'));
  check('page de la chaîne : équivalence @handle ↔ UC… apprise', al.aliases && al.aliases.youtube && (al.aliases.youtube['rockstargames'] || []).includes('uc6vcwc1raowdbcm0jxrrq3a'), al);
  await chan.close();
  await sleep(500);
  check('chaîne ajoutée via @handle puis rencontrée via son ID UC… → débloquée (onglet déjà ouvert)', await visible(yt, '#y3'));
  check('… les autres restent bloquées', (await blocked(yt, '#y2')) && (await blocked(yt, '#y4')));
  await yt.close();
  const yt2 = await open('www.youtube.com', '/wl', 900);
  check('équivalence persistante : après rechargement, UC… toujours débloqué', await visible(yt2, '#y3'));
  await yt2.close();

  const men = await open('www.youtube.com', '/@Menteur', 300); await sleep(4000);
  const al2 = await sw.evaluate(() => chrome.storage.local.get('aliases'));
  check('balises canonical / identifier incohérentes → aucune équivalence apprise', !(al2.aliases.youtube && al2.aliases.youtube['menteur']), al2);
  await men.close();

  const sh = await open('www.youtube.com', '/shorts/x', 1200);
  check('Short d\'une chaîne autorisée : débloqué, lecture et son rétablis', (await visible(sh, '#s1')) && (await playing(sh, '#v1 video')));
  check('Short d\'une chaîne inconnue : bloqué, en pause et muet', (await blocked(sh, '#s2')) && (await paused(sh, '#v2 video')));
  await sh.close();

  // ═══════════ 4. Reddit ═══════════
  console.log('\n[4] Reddit');
  await setWl({ reddit: ['u/rockstargames'] });
  let rd = await open('www.reddit.com', '/wl', 900);
  check('u/ autorisé → débloqué', await visible(rd, '#p1'));
  check('autre auteur → bloqué', await blocked(rd, '#p2'));
  check('crosspost (contenu d\'un autre auteur impossible à isoler) → bloqué même si l\'auteur est autorisé', await blocked(rd, '#p4'));
  check('commentaire d\'un inconnu → bloqué', await blocked(rd, '#rc1 > [slot="comment"]'));
  await setWl({ reddit: ['u/rockstargames', 'r/gta6'] });
  check('option r/subreddit : les posts du subreddit autorisé sont débloqués', await visible(rd, '#p3'));
  check('… sans débloquer les autres subreddits', await blocked(rd, '#p2'));
  await rd.close();

  // ═══════════ 5. TikTok ═══════════
  console.log('\n[5] TikTok');
  await setWl({ tiktok: ['rockstargames'] });
  const tk = await open('www.tiktok.com', '/wl', 1200);
  check('auteur autorisé (mention d\'un autre compte dans la légende ignorée) → débloqué', await visible(tk, '#t1'));
  check('vidéo débloquée : lecture et son rétablis', await playing(tk, '#tv1 video'));
  check('autre compte → bloqué, vidéo en pause', (await blocked(tk, '#t2')) && (await paused(tk, '#tv2 video')));
  check('plusieurs auteurs (duo) : bloqué', await blocked(tk, '#t3'));
  await tk.close();

  // ═══════════ 6. Instagram ═══════════
  console.log('\n[6] Instagram');
  await setWl({ instagram: ['rockstargames'] });
  const ig = await open('www.instagram.com', '/wl', 1000);
  check('post d\'un compte autorisé → débloqué', await visible(ig, '#i1 > span'));
  check('légende de l\'auteur (dans la liste) restée visible', await visible(ig, '#i1 ul li:nth-child(1)'));
  check('commentaire d\'un inconnu sous un post autorisé (spoil) → bloqué', await blocked(ig, '#i1 ul li:nth-child(2)'));
  check('commentaire sans rapport → non masqué', await visible(ig, '#i1 ul li:nth-child(3)'));
  check('post d\'un autre compte → bloqué', await blocked(ig, '#i2'));
  await ig.close();
  const igp = await open('www.instagram.com', '/rockstargames/', 800);
  check('page profil d\'un compte autorisé : non recouverte', !(await blocked(igp, 'main')));
  await igp.close();
  await setWl({});
  const igp2 = await open('www.instagram.com', '/rockstargames/', 800);
  check('même profil sans liste blanche : toute la page est recouverte (comportement inchangé)', await blocked(igp2, 'main'));
  await igp2.close();

  // ═══════════ 7. Facebook ═══════════
  console.log('\n[7] Facebook');
  await setWl({ facebook: ['rockstargames'] });
  const fb = await open('www.facebook.com', '/wl', 1000);
  check('page autorisée (URL à paramètres __cft__ normalisée) → publication débloquée', await visible(fb, '#f1 [role="article"] > [dir="auto"]'));
  check('commentaire d\'un inconnu sous la publication autorisée → bloqué', await blocked(fb, '#f1 [aria-label^="Commentaire de Paul"]'));
  check('faux compte au même nom affiché (RockstarGamesFake) → bloqué', await blocked(fb, '#f2'));
  check('publication avec deux auteurs (partage) → bloquée', await blocked(fb, '#f3'));
  check('publication sans en-tête d\'auteur → bloquée', await blocked(fb, '#f4'));
  await fb.close();

  // ═══════════ 8. Popup : onglet « Liste blanche » ═══════════
  console.log('\n[8] Popup — onglet Liste blanche');
  await setWl({});
  const pop = await browser.newPage(); const perr = [];
  pop.on('pageerror', (e) => perr.push(String(e))); pop.on('console', (m) => { if (m.type() === 'error') perr.push(m.text()); });
  await pop.setViewport({ width: 380, height: 1100 });
  await pop.goto(`chrome-extension://${extId}/popup.html`); await sleep(500);
  await pop.click('#tabBtnWhitelist'); await sleep(200);
  check('onglet Liste blanche affiché, réglages masqués', (await pop.$eval('#tabWhitelist', (e) => !e.hidden)) && (await pop.$eval('#tabSettings', (e) => e.hidden)));
  check('suggestions : seule celle de la personne qui a créé le projet est pré-cochée, les comptes Rockstar ne le sont pas', (await pop.$$eval('#wlSuggest input:checked', (l) => l.length)) === 1 && !(await pop.$eval('#wlSuggest label:nth-child(2) input', (e) => e.checked)));
  check('suggestions : 7 comptes proposés', (await pop.$$eval('#wlSuggest input', (l) => l.length)) === 7);
  const add = async (text, plat) => { await pop.$eval('#wlInput', (e) => { e.value = ''; }); await pop.type('#wlInput', text); await pop.select('#wlPlatform', plat || ''); await pop.keyboard.press('Enter'); await sleep(350); };
  await add('https://x.com/RockstarGames?s=20');
  check('URL de profil : plateforme détectée automatiquement', (await store()).whitelist.x.includes('rockstargames'));
  await add('https://www.youtube.com/channel/UC6VcWc1rAoWdBCM0JxrRQ3A');
  check('URL YouTube /channel/UC… ajoutée', (await store()).whitelist.youtube.includes('uc6vcwc1raowdbcm0jxrrq3a'));
  await add('@NASA', 'instagram');
  check('@handle + plateforme choisie', (await store()).whitelist.instagram.includes('nasa'));
  await add('@personne');
  check('@handle sans plateforme : refusé avec un message', (await pop.$eval('#wlMsg', (e) => e.textContent)).includes('plateforme') && (await store()).whitelist.x.length === 1);
  await add('https://example.com/foo');
  check('URL d\'un autre site : refusée', (await pop.$eval('#wlMsg', (e) => e.classList.contains('err'))));
  await add('https://www.youtube.com/c/Rockstar');
  check('ancien format YouTube /c/… : refusé avec explication', (await pop.$eval('#wlMsg', (e) => e.textContent)).includes('@handle'));
  check('liste classée par plateforme avec icônes', (await pop.$$eval('#wlList .wlgroup .icon svg', (l) => l.length)) === 3);
  await pop.type('#wlSearch', 'nasa'); await sleep(200);
  check('recherche : ne montre que « nasa »', (await pop.$$eval('#wlList .wlrow', (l) => l.length)) === 1);
  await pop.$eval('#wlSearch', (e) => { e.value = ''; e.dispatchEvent(new Event('input')); });
  await pop.click('#wlSuggest label:nth-child(4) input'); await pop.click('#wlAddSuggested'); await sleep(350);
  check('suggestion cochée puis ajoutée (Instagram Rockstar)', (await store()).whitelist.instagram.includes('rockstargames'));
  await pop.click('#wlExport'); await sleep(300);
  const json = await pop.$eval('#wlJson', (e) => e.value);
  check('export JSON valide contenant la liste', (() => { try { const d = JSON.parse(json); return d.whitelist.x.includes('rockstargames') && d.whitelist.instagram.length === 2; } catch (e) { return false; } })());
  await pop.$eval('#wlJson', (e) => { e.value = JSON.stringify({ whitelist: { tiktok: ['rockstargames'], x: ['rockstargames', 'pas valide!!'] } }); });
  await pop.click('#wlImport'); await sleep(350);
  check('import : fusion, doublons et identifiants invalides ignorés', (await store()).whitelist.tiktok.includes('rockstargames') && (await store()).whitelist.x.length === 2);
  await pop.$eval('#wlJson', (e) => { e.value = 'pas du json'; }); await pop.click('#wlImport'); await sleep(200);
  check('import d\'un JSON invalide : message d\'erreur, liste intacte', (await pop.$eval('#wlMsg', (e) => e.textContent)).includes('invalide'));
  await pop.screenshot({ path: path.join(__dirname, 'out-vicecity.png'), fullPage: true });
  await pop.click('#tabWhitelist label.switch'); await sleep(300);
  check('interrupteur : liste blanche en pause (persisté)', (await store()).whitelistEnabled === false);
  await pop.click('#tabWhitelist label.switch'); await sleep(200);
  await pop.$$eval('#wlList .wlrow', (rows) => rows.find((r) => r.textContent.includes('nasa')).querySelector('button.del').click()); await sleep(350);
  check('suppression d\'un compte', !(await store()).whitelist.instagram.includes('nasa'));
  await pop.select('#theme', 'dark').catch(() => {});
  await pop.click('#tabBtnSettings'); await pop.select('#theme', 'dark'); await pop.click('#tabBtnWhitelist'); await sleep(250);
  await pop.screenshot({ path: path.join(__dirname, 'out-dark.png'), fullPage: true });
  check('popup : aucune erreur JS', perr.length === 0, perr);
  await pop.close();

  console.log(`\n${count - failures}/${count} vérifications réussies`);
  await browser.close(); server.close(); process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
