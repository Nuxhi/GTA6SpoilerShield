/**
 * background.js — Service worker : compteur total + badge de l'icône.
 *
 * Les content scripts envoient { type: 'g6s:stats', pageCount, newlyBlocked }.
 * On centralise ici l'écriture du total (chrome.storage.local) pour éviter que
 * plusieurs onglets s'écrasent mutuellement.
 * Rien n'est envoyé sur Internet.
 */
'use strict';

// Garder cohérent avec keywords.js (DEFAULT_SETTINGS) et popup.js.
const DEFAULT_SETTINGS = { enabled: true, mode: 'extreme', customKeywords: [], revealDelay: 5, theme: 'sunset',
  whitelistEnabled: true, whitelist: { x: [], youtube: [], tiktok: [], instagram: [], facebook: [], reddit: [] } };

chrome.runtime.onInstalled.addListener(async () => {
  // Ne complète que les clés absentes (ne réinitialise pas les réglages existants).
  const current = await chrome.storage.sync.get(null);
  const missing = {};
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) if (!(k in current)) missing[k] = v;
  if (Object.keys(missing).length) await chrome.storage.sync.set(missing);
  const { totalBlocked } = await chrome.storage.local.get({ totalBlocked: 0 });
  await chrome.storage.local.set({ totalBlocked });
});

// Les mises à jour du total sont chaînées : jamais deux lecture/écriture en parallèle.
let chain = Promise.resolve();

function addToTotal(delta) {
  chain = chain.then(async () => {
    const { totalBlocked } = await chrome.storage.local.get({ totalBlocked: 0 });
    await chrome.storage.local.set({ totalBlocked: totalBlocked + delta });
  }).catch(() => {});
}

function setBadge(tabId, count) {
  if (tabId == null) return;
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#c62828' }).catch(() => {});
  chrome.action.setBadgeText({ tabId, text: count > 0 ? (count > 99 ? '99+' : String(count)) : '' }).catch(() => {});
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== 'g6s:stats') return;
  if (msg.newlyBlocked > 0) addToTotal(msg.newlyBlocked);
  setBadge(sender.tab && sender.tab.id, msg.pageCount | 0);
});
