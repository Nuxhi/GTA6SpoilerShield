/**
 * popup.js — Interface de l'extension : on/off, mode, délai de révélation, compteurs,
 * mots-clés perso, thème, et onglet « Liste blanche ».
 * Réglages dans chrome.storage.sync ; total dans chrome.storage.local.
 */
'use strict';

const W = self.G6S.whitelist;

// Garder ces valeurs par défaut cohérentes avec keywords.js (DEFAULT_SETTINGS) et background.js.
const DEFAULTS = {
  enabled: true, mode: 'extreme', customKeywords: [], revealDelay: 5, theme: 'vicecity',
  whitelistEnabled: true, whitelist: { x: [], youtube: [], tiktok: [], instagram: [], facebook: [], reddit: [] },
};
const MAX_KEYWORDS = 100;
const MAX_DELAY = 30;

const $ = (id) => document.getElementById(id);
let settings = { ...DEFAULTS };

// ═══ Onglets ═══════════════════════════════════════════════════════════
function showTab(name) {
  const wl = name === 'whitelist';
  $('tabSettings').hidden = wl;
  $('tabWhitelist').hidden = !wl;
  for (const [btn, active] of [[$('tabBtnSettings'), !wl], [$('tabBtnWhitelist'), wl]]) {
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  }
}
$('tabBtnSettings').addEventListener('click', () => showTab('settings'));
$('tabBtnWhitelist').addEventListener('click', () => showTab('whitelist'));

// ═══ Réglages ══════════════════════════════════════════════════════════
function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'vicecity';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('g6s-theme', t); } catch (e) { /* ignoré */ }
}

function render() {
  $('enabled').checked = settings.enabled;
  for (const r of document.querySelectorAll('input[name="mode"]')) r.checked = r.value === settings.mode;
  if (document.activeElement !== $('delay')) $('delay').value = settings.revealDelay;
  $('theme').value = settings.theme === 'dark' ? 'dark' : 'vicecity';
  applyTheme(settings.theme);
  document.body.style.opacity = settings.enabled ? '1' : '.75';

  const list = $('kwList');
  list.textContent = '';
  for (const kw of settings.customKeywords) {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(kw));
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '×';
    del.title = 'Retirer « ' + kw + ' »';
    del.setAttribute('aria-label', 'Retirer ' + kw);
    del.addEventListener('click', () => {
      settings.customKeywords = settings.customKeywords.filter((k) => k !== kw);
      save({ customKeywords: settings.customKeywords });
    });
    li.appendChild(del);
    list.appendChild(li);
  }
  renderWhitelist();
}

function save(patch) {
  Object.assign(settings, patch);
  chrome.storage.sync.set(patch);
  render();
}

$('enabled').addEventListener('change', (e) => save({ enabled: e.target.checked }));

for (const r of document.querySelectorAll('input[name="mode"]')) {
  r.addEventListener('change', () => { if (r.checked) save({ mode: r.value }); });
}

$('delay').addEventListener('change', (e) => {
  const n = Math.round(Number(e.target.value));
  save({ revealDelay: Number.isFinite(n) ? Math.min(MAX_DELAY, Math.max(0, n)) : DEFAULTS.revealDelay });
});

$('theme').addEventListener('change', (e) => save({ theme: e.target.value }));

$('kwForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const value = $('kwInput').value.trim();
  if (value.length < 2) return;
  const exists = settings.customKeywords.some((k) => k.toLowerCase() === value.toLowerCase());
  if (!exists && settings.customKeywords.length < MAX_KEYWORDS) {
    save({ customKeywords: [...settings.customKeywords, value] });
  }
  $('kwInput').value = '';
});

// ═══ Liste blanche ═════════════════════════════════════════════════════
const ICONS = {
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#000"/><path d="M7 7l10 10M17 7L7 17" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#e00"/><path d="M9.5 7.8v8.4l7-4.2z" fill="#fff"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#111"/><path d="M13 6v8.2a2.4 2.4 0 1 1-2.4-2.4M13 6c.3 2 1.6 3.2 3.6 3.4" fill="none" stroke="#25f4ee" stroke-width="2" stroke-linecap="round"/><path d="M13.6 6.4v8.2a2.4 2.4 0 1 1-2.4-2.4M13.6 6.4c.3 2 1.6 3.2 3.6 3.4" fill="none" stroke="#fe2c55" stroke-width="1.2" stroke-linecap="round"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig)"/><rect x="6" y="6" width="12" height="12" rx="3.5" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="15.7" cy="8.3" r=".9" fill="#fff"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="12" fill="#1877f2"/><path d="M13.4 19v-5.6h1.9l.3-2.3h-2.2V9.7c0-.7.2-1.1 1.1-1.1h1.2V6.5c-.2 0-.9-.1-1.7-.1-1.7 0-2.9 1-2.9 3v1.7H9v2.3h2.1V19z" fill="#fff"/></svg>',
  reddit: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="12" fill="#ff4500"/><ellipse cx="12" cy="13.6" rx="6" ry="4.2" fill="#fff"/><circle cx="9.7" cy="13" r="1.1" fill="#ff4500"/><circle cx="14.3" cy="13" r="1.1" fill="#ff4500"/><circle cx="17.2" cy="9.7" r="1.3" fill="#fff"/><path d="M12 9.4l.9-3.1 3 .8" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/></svg>',
};

// Comptes officiels suggérés (NON cochés par défaut). Seule la chaîne YouTube a été vérifiée sur le site
// (@RockstarGames ↔ UC6VcWc1rAoWdBCM0JxrRQ3A) ; les autres sont à vérifier par l'utilisateur.
const SUGGESTIONS = [
  // Compte de l'auteur du projet : seul élément pré-coché (defaultChecked). Il faut ensuite cliquer sur « Ajouter la sélection ».
  { platform: 'x', ids: ['nuxhii'], label: 'Nuxhii (auteur du projet) — X (@Nuxhii)', defaultChecked: true },
  { platform: 'x', ids: ['rockstargames'], label: 'Rockstar Games — X (@RockstarGames)' },
  { platform: 'youtube', ids: ['rockstargames', 'uc6vcwc1raowdbcm0jxrrq3a'], label: 'Rockstar Games — YouTube (@RockstarGames + ID de chaîne)' },
  { platform: 'instagram', ids: ['rockstargames'], label: 'Rockstar Games — Instagram' },
  { platform: 'facebook', ids: ['rockstargames'], label: 'Rockstar Games — Facebook' },
  { platform: 'tiktok', ids: ['rockstargames'], label: 'Rockstar Games — TikTok (à vérifier)' },
  { platform: 'reddit', ids: ['u/rockstargames'], label: 'Rockstar Games — Reddit u/rockstargames (à vérifier)' },
];

// Cases cochées : seules les suggestions « defaultChecked » le sont au départ ; le choix de l'utilisateur est conservé.
const suggestSel = new Set(SUGGESTIONS.map((s, i) => (s.defaultChecked ? String(i) : null)).filter(Boolean));

function wlMessage(text, isError) {
  const el = $('wlMsg');
  el.textContent = text || '';
  el.classList.toggle('err', !!isError);
}

function saveWhitelist(wl) {
  save({ whitelist: W.sanitize(wl) });
}

function addAccounts(platform, ids) {
  const cur = settings.whitelist;
  const before = W.count(cur);
  const next = W.sanitize({ ...cur, [platform]: [...(cur[platform] || []), ...ids] });
  const added = W.count(next) - before;
  if (added > 0) saveWhitelist(next);
  return { added, full: W.count(next) >= W.MAX_ACCOUNTS };
}

function renderWhitelist() {
  const wl = W.sanitize(settings.whitelist);
  $('wlEnabled').checked = settings.whitelistEnabled;
  $('tabWhitelist').classList.toggle('paused', !settings.whitelistEnabled);
  $('wlCount').textContent = W.count(wl) ? '(' + W.count(wl) + ')' : '';

  // Liste, classée par plateforme, filtrée par la recherche
  const q = $('wlSearch').value.trim().toLowerCase();
  const box = $('wlList');
  box.textContent = '';
  let shown = 0;
  for (const p of W.PLATFORMS) {
    const ids = (wl[p] || []).filter((id) => !q || id.includes(q) || W.display(p, id).toLowerCase().includes(q));
    if (!ids.length) continue;
    const group = document.createElement('div');
    group.className = 'wlgroup';
    const title = document.createElement('div');
    title.className = 'wltitle';
    title.innerHTML = '<span class="icon">' + ICONS[p] + '</span>';
    title.appendChild(document.createTextNode(W.LABELS[p]));
    group.appendChild(title);
    for (const id of ids) {
      shown++;
      const row = document.createElement('div');
      row.className = 'wlrow';
      const name = document.createElement('span');
      name.className = 'wlname';
      name.textContent = W.display(p, id);
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = '×';
      del.title = 'Retirer ' + W.display(p, id);
      del.setAttribute('aria-label', 'Retirer ' + W.display(p, id) + ' (' + W.LABELS[p] + ')');
      del.addEventListener('click', () => {
        saveWhitelist({ ...wl, [p]: wl[p].filter((x) => x !== id) });
      });
      row.append(name, del);
      group.appendChild(row);
    }
    box.appendChild(group);
  }
  if (!shown) {
    const empty = document.createElement('p');
    empty.className = 'hint';
    empty.textContent = W.count(wl) ? 'Aucun résultat.' : 'Aucun compte autorisé pour le moment.';
    box.appendChild(empty);
  }

  // Suggestions (cases décochées ; désactivées si déjà dans la liste)
  const sug = $('wlSuggest');
  sug.textContent = '';
  SUGGESTIONS.forEach((s, i) => {
    const already = s.ids.every((id) => (wl[s.platform] || []).includes(id));
    const label = document.createElement('label');
    label.className = 'wlsug';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = String(i);
    cb.checked = !already && suggestSel.has(String(i));
    cb.addEventListener('change', () => { if (cb.checked) suggestSel.add(cb.value); else suggestSel.delete(cb.value); });
    cb.disabled = already;
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.innerHTML = ICONS[s.platform];
    label.append(cb, icon, document.createTextNode(s.label + (already ? ' — déjà ajouté' : '')));
    sug.appendChild(label);
  });
}

$('wlEnabled').addEventListener('change', (e) => save({ whitelistEnabled: e.target.checked }));
$('wlSearch').addEventListener('input', renderWhitelist);

$('wlForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const parsed = W.parseInput($('wlInput').value, $('wlPlatform').value || null);
  if (parsed.error) { wlMessage(parsed.error, true); return; }
  const { added, full } = addAccounts(parsed.platform, [parsed.id]);
  const label = W.LABELS[parsed.platform] + ' · ' + W.display(parsed.platform, parsed.id);
  if (added) { wlMessage('Ajouté : ' + label); $('wlInput').value = ''; }
  else wlMessage(full ? 'Liste pleine (' + W.MAX_ACCOUNTS + ' comptes maximum).' : 'Déjà dans la liste : ' + label, full);
});

$('wlAddSuggested').addEventListener('click', () => {
  let total = 0;
  for (const cb of $('wlSuggest').querySelectorAll('input:checked')) {
    const s = SUGGESTIONS[Number(cb.value)];
    total += addAccounts(s.platform, s.ids).added;
  }
  wlMessage(total ? total + ' compte(s) ajouté(s).' : 'Rien de coché : cochez les comptes à ajouter.', !total);
});

$('wlExport').addEventListener('click', async () => {
  const json = JSON.stringify({ format: 'g6s-whitelist', version: 1, whitelist: W.sanitize(settings.whitelist) }, null, 2);
  $('wlJson').value = json;
  try { await navigator.clipboard.writeText(json); wlMessage('Exporté (copié dans le presse-papiers).'); }
  catch (e) { wlMessage('Exporté : copiez le texte ci-dessus.'); }
});

$('wlImport').addEventListener('click', () => {
  let data;
  try { data = JSON.parse($('wlJson').value); } catch (e) { wlMessage('JSON invalide.', true); return; }
  const incoming = W.sanitize(data && data.whitelist ? data.whitelist : data);
  if (!W.count(incoming)) { wlMessage('Aucun compte valide dans ce JSON.', true); return; }
  const cur = settings.whitelist;
  const merged = {};
  for (const p of W.PLATFORMS) merged[p] = [...(cur[p] || []), ...(incoming[p] || [])];
  const before = W.count(cur);
  const next = W.sanitize(merged);
  const added = W.count(next) - before;
  if (added > 0) saveWhitelist(next);
  wlMessage(added + ' compte(s) importé(s)' + (W.count(incoming) > added ? ' (doublons ou liste pleine ignorés).' : '.'), !added);
});

// ═══ Compteurs ═════════════════════════════════════════════════════════
async function refreshStats() {
  const { totalBlocked } = await chrome.storage.local.get({ totalBlocked: 0 });
  $('totalCount').textContent = totalBlocked;

  let page = '—';
  let status = 'Aucune protection active sur cet onglet (page interne ou onglet non rechargé).';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'g6s:getStats' });
    if (res) {
      page = res.pageCount;
      status = res.enabled ? 'Protection active — ' + res.site : 'Protection désactivée';
    }
  } catch (e) { /* pas de content script dans cet onglet */ }
  $('pageCount').textContent = page;
  $('status').textContent = status;
}

$('resetTotal').addEventListener('click', async () => {
  await chrome.storage.local.set({ totalBlocked: 0 });
  refreshStats();
});

// ═══ Démarrage ═════════════════════════════════════════════════════════
chrome.storage.sync.get(DEFAULTS).then((s) => {
  settings = { ...DEFAULTS, ...s, whitelist: W.sanitize(s.whitelist) };
  render();
});
// Liste modifiée ailleurs (ex. « Toujours autoriser » depuis l'écran noir) pendant que la popup est ouverte.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const k of Object.keys(DEFAULTS)) if (changes[k]) settings[k] = changes[k].newValue;
  settings.whitelist = W.sanitize(settings.whitelist);
  render();
});
refreshStats();
setInterval(refreshStats, 1000);
