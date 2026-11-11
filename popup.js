/**
 * popup.js — Interface de l'extension : on/off, mode, délai de révélation,
 * compteurs, mots-clés perso, thème.
 * Réglages dans chrome.storage.sync ; total dans chrome.storage.local.
 */
'use strict';

// Garder ces valeurs par défaut cohérentes avec keywords.js (DEFAULT_SETTINGS) et background.js.
const DEFAULTS = { enabled: true, mode: 'extreme', customKeywords: [], revealDelay: 5, theme: 'vicecity' };
const MAX_KEYWORDS = 100;
const MAX_DELAY = 30;

const $ = (id) => document.getElementById(id);
let settings = { ...DEFAULTS };

// ── Réglages ───────────────────────────────────────────────────────────
function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'vicecity';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('g6s-theme', t); } catch (e) { /* ignoré */ }
}

function render() {
  $('enabled').checked = settings.enabled;
  for (const r of document.querySelectorAll('input[name="mode"]')) r.checked = r.value === settings.mode;
  $('delay').value = settings.revealDelay;
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

// ── Compteurs ──────────────────────────────────────────────────────────
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

// ── Démarrage ──────────────────────────────────────────────────────────
chrome.storage.sync.get(DEFAULTS).then((s) => {
  settings = { ...DEFAULTS, ...s };
  render();
});
refreshStats();
setInterval(refreshStats, 1000);
