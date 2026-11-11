/**
 * whitelist.js — Liste blanche de comptes : identifiants, URL, normalisation.
 *
 * Partagé par le content script et la popup (aucun accès au DOM de la page ici) ;
 * testable avec Node (tests/whitelist.test.js).
 *
 * RÈGLE DE SÉCURITÉ : un compte n'est JAMAIS reconnu par son nom affiché, uniquement par un
 * identifiant extrait d'un lien (href) — ou, pour Reddit, de l'attribut `author` (le nom
 * d'utilisateur, unique) — puis normalisé : minuscules, sans « @ », sans paramètres d'URL,
 * sans slash final. Un lien absolu n'est accepté que s'il pointe vers le domaine de la
 * plateforme (un lien https://exemple.com/RockstarGames ne vaut rien).
 *
 * Format stocké (chrome.storage.sync, clé « whitelist ») :
 *   { x: ['rockstargames'], youtube: ['rockstargames', 'uc6vcwc1raowdbcm0jxrrq3a'],
 *     tiktok: [], instagram: [], facebook: ['rockstargames', 'id:100012345'],
 *     reddit: ['u/rockstargames', 'r/gta6'] }
 */
(function () {
  'use strict';
  const root = typeof self !== 'undefined' ? self : globalThis;
  const G = (root.G6S = root.G6S || {});

  const PLATFORMS = ['x', 'youtube', 'tiktok', 'instagram', 'facebook', 'reddit'];
  const LABELS = { x: 'X / Twitter', youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook', reddit: 'Reddit' };
  const HOSTS = {
    x: /(^|\.)(x|twitter)\.com$/,
    youtube: /(^|\.)youtube\.com$/,
    tiktok: /(^|\.)tiktok\.com$/,
    instagram: /(^|\.)instagram\.com$/,
    facebook: /(^|\.)(facebook|fb)\.com$/,
    reddit: /(^|\.)reddit\.com$/,
  };
  const MAX_ACCOUNTS = 200;

  const RESERVED = {
    x: new Set(['home', 'explore', 'notifications', 'messages', 'search', 'i', 'settings', 'compose', 'login', 'signup',
      'tos', 'privacy', 'jobs', 'hashtag', 'intent', 'share', 'account', 'lists', 'bookmarks', 'communities', 'premium', 'grok', 'download']),
    instagram: new Set(['explore', 'reels', 'reel', 'stories', 'p', 'tv', 'direct', 'accounts', 'about', 'legal', 'developer', 'api',
      'challenge', 'directory', 'web', 'emails', 'session', 'nametag']),
    facebook: new Set(['login', 'watch', 'groups', 'marketplace', 'reel', 'reels', 'events', 'pages', 'people', 'share', 'photo', 'photos',
      'permalink.php', 'story.php', 'stories', 'hashtag', 'search', 'gaming', 'friends', 'help', 'policies', 'privacy', 'dialog', 'sharer', 'sharer.php']),
  };

  // ── Normalisation / validation d'un identifiant déjà extrait ───────────
  /** minuscules, sans « @ », sans paramètres d'URL, sans slash final. */
  function clean(raw) {
    return String(raw == null ? '' : raw).trim().toLowerCase().replace(/^@/, '').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
  }

  /** Renvoie l'identifiant normalisé, ou null s'il est invalide pour cette plateforme. */
  function normalizeId(platform, raw) {
    let id = clean(raw);
    if (!id) return null;
    switch (platform) {
      case 'x': return /^[a-z0-9_]{1,15}$/.test(id) ? id : null;
      case 'youtube':
        if (/^uc[a-z0-9_-]{22}$/.test(id)) return id; // ID de chaîne
        id = id.replace(/^@/, '');
        return /^[a-z0-9._-]{3,30}$/.test(id) ? id : null; // @handle
      case 'tiktok': return /^[a-z0-9._]{2,24}$/.test(id) ? id : null;
      case 'instagram': return /^[a-z0-9._]{1,30}$/.test(id) ? id : null;
      case 'facebook':
        if (/^id:\d{5,}$/.test(id)) return id;
        return /^[a-z0-9.\-]{5,50}$/.test(id) && !RESERVED.facebook.has(id) ? id : null;
      case 'reddit': {
        id = id.replace(/^user\//, 'u/');
        if (/^u\/[a-z0-9_-]{3,20}$/.test(id) || /^r\/[a-z0-9_]{2,21}$/.test(id)) return id;
        return /^[a-z0-9_-]{3,20}$/.test(id) ? 'u/' + id : null; // « spez » → u/spez
      }
      default: return null;
    }
  }

  // ── Extraction depuis une URL / un href ────────────────────────────────
  function parseUrl(href, base) {
    try {
      const u = new URL(href, base || (typeof location !== 'undefined' ? location.href : undefined));
      return /^https?:$/.test(u.protocol) ? u : null;
    } catch (e) { return null; }
  }

  /**
   * Identifiant de compte désigné par un lien vers un PROFIL (null si ce n'est pas un lien de profil,
   * ou si l'hôte n'est pas celui de la plateforme).
   */
  function idFromHref(platform, href, base) {
    const u = href ? parseUrl(href, base) : null;
    if (!u || !HOSTS[platform] || !HOSTS[platform].test(u.hostname.toLowerCase())) return null;
    let segs;
    try { segs = u.pathname.split('/').filter(Boolean).map(decodeURIComponent); } catch (e) { return null; }
    if (!segs.length && !(platform === 'facebook')) return null;
    const first = (segs[0] || '').toLowerCase();

    switch (platform) {
      case 'x':
        return segs.length === 1 && !RESERVED.x.has(first) ? normalizeId('x', first) : null;
      case 'youtube':
        if (first.startsWith('@') && segs.length <= 2) return normalizeId('youtube', first);
        if (first === 'channel' && segs[1] && segs.length === 2) return /^uc/i.test(segs[1]) ? normalizeId('youtube', segs[1]) : null;
        return null; // /c/nom, /user/nom : non résolubles sans requête réseau
      case 'tiktok':
        return first.startsWith('@') && segs.length === 1 ? normalizeId('tiktok', first) : null;
      case 'instagram':
        return segs.length === 1 && !RESERVED.instagram.has(first) ? normalizeId('instagram', first) : null;
      case 'facebook': {
        if (u.pathname.replace(/\/+$/, '').toLowerCase() === '/profile.php') {
          const n = u.searchParams.get('id');
          return n && /^\d{5,}$/.test(n) ? 'id:' + n : null;
        }
        return segs.length === 1 && !RESERVED.facebook.has(first) ? normalizeId('facebook', first) : null;
      }
      case 'reddit':
        if ((first === 'user' || first === 'u') && segs[1] && segs.length <= 2) return normalizeId('reddit', 'u/' + segs[1]);
        if (first === 'r' && segs[1] && segs.length <= 2) return normalizeId('reddit', 'r/' + segs[1]);
        return null;
      default: return null;
    }
  }

  /** Plateforme d'une URL (d'après son domaine), ou null. */
  function platformOfUrl(text) {
    let t = String(text).trim();
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) t = 'https://' + t;
    const u = parseUrl(t, 'https://invalid.invalid/');
    if (!u) return null;
    for (const p of PLATFORMS) if (HOSTS[p].test(u.hostname.toLowerCase())) return p;
    return null;
  }

  /**
   * Saisie de la popup : URL de profil (plateforme détectée) ou @handle + plateforme choisie.
   * @returns {{platform: string, id: string} | {error: string}}
   */
  function parseInput(text, platformHint) {
    const t = String(text || '').trim();
    if (!t) return { error: 'Saisie vide.' };
    const looksLikeUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(t) || /^(www\.)?[a-z0-9-]+\.[a-z]{2,}\/\S+/i.test(t);
    if (looksLikeUrl) {
      const platform = platformOfUrl(t);
      if (!platform) return { error: 'Plateforme non reconnue dans cette URL.' };
      const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : 'https://' + t;
      const id = idFromHref(platform, url, 'https://invalid.invalid/');
      if (!id) {
        return { error: platform === 'youtube'
          ? 'URL YouTube non reconnue : utilisez youtube.com/@handle ou youtube.com/channel/UC…'
          : 'Cette URL n\'est pas celle d\'un profil.' };
      }
      return { platform, id };
    }
    if (!platformHint || !PLATFORMS.includes(platformHint)) return { error: 'Choisissez la plateforme pour un @handle.' };
    const id = normalizeId(platformHint, t);
    return id ? { platform: platformHint, id } : { error: 'Identifiant invalide pour ' + LABELS[platformHint] + '.' };
  }

  /** Libellé lisible d'un identifiant. */
  function display(platform, id) {
    if (platform === 'reddit') return id;
    if (platform === 'facebook') return id.startsWith('id:') ? 'profil ' + id.slice(3) : id;
    if (platform === 'youtube' && /^uc[a-z0-9_-]{22}$/.test(id)) return 'chaîne ' + id.toUpperCase().replace(/^UC/, 'UC');
    return '@' + id;
  }

  // ── Structure de la liste ──────────────────────────────────────────────
  function empty() {
    const o = {};
    for (const p of PLATFORMS) o[p] = [];
    return o;
  }

  /** Nettoie une liste (import, stockage corrompu) : plateformes connues, identifiants valides, sans doublon, plafonnée. */
  function sanitize(obj) {
    const out = empty();
    let n = 0;
    if (obj && typeof obj === 'object') {
      for (const p of PLATFORMS) {
        if (!Array.isArray(obj[p])) continue;
        for (const raw of obj[p]) {
          const id = typeof raw === 'string' ? normalizeId(p, raw) : null;
          if (id && !out[p].includes(id) && n < MAX_ACCOUNTS) { out[p].push(id); n++; }
        }
      }
    }
    return out;
  }

  const count = (wl) => PLATFORMS.reduce((s, p) => s + ((wl && wl[p]) || []).length, 0);

  /** Ensemble plat « plateforme:id » (comparaison de listes). */
  function flatten(wl) {
    const s = new Set();
    for (const p of PLATFORMS) for (const id of (wl && wl[p]) || []) s.add(p + ':' + id);
    return s;
  }

  // ── Équivalences (YouTube : @handle ↔ ID de chaîne UC…) ───────────────
  /** aliases : { youtube: { 'uc…': ['handle'], 'handle': ['uc…'] } } (appris sur les pages de chaîne). */
  function addAlias(aliases, platform, a, b) {
    const al = (aliases[platform] = aliases[platform] || {});
    let changed = false;
    for (const [x, y] of [[a, b], [b, a]]) {
      const list = (al[x] = al[x] || []);
      if (!list.includes(y)) { list.push(y); changed = true; }
    }
    return changed;
  }

  /**
   * L'auteur identifié est-il dans la liste blanche ? `ids` = identifiants d'UN SEUL auteur.
   * Faux dès que la liste est vide, l'auteur inconnu ou `ids` vide.
   */
  function isAllowed(wl, platform, ids, aliases) {
    const list = wl && wl[platform];
    if (!list || !list.length || !Array.isArray(ids) || !ids.length) return false;
    const set = new Set(list);
    const al = (aliases && aliases[platform]) || {};
    for (const id of ids) {
      if (set.has(id)) return true;
      for (const eq of al[id] || []) if (set.has(eq)) return true;
    }
    return false;
  }

  G.whitelist = {
    PLATFORMS, LABELS, MAX_ACCOUNTS,
    clean, normalizeId, idFromHref, platformOfUrl, parseInput, display,
    empty, sanitize, count, flatten, addAlias, isAllowed,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.whitelist;
})();
