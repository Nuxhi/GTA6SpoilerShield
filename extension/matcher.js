/**
 * matcher.js — Normalisation du texte et détection des termes GTA 6 / spoil.
 *
 * Aucune dépendance au DOM : ce fichier est testable avec Node
 * (voir tests/matcher.test.js).
 *
 * API :
 *   G6S.matcher.normalize(texte)            -> texte normalisé (entouré d'espaces)
 *   G6S.matcher.configure({mode, customKeywords})
 *   G6S.matcher.evaluate(texte)             -> null | { category, term, spoil, label }
 */
(function () {
  'use strict';
  const root = typeof self !== 'undefined' ? self : globalThis;
  const G = (root.G6S = root.G6S || {});
  const K = G.KEYWORDS;
  if (!K) throw new Error('keywords.js doit être chargé avant matcher.js');

  const MAX_CHARS = 10000; // on n'analyse jamais plus que ça par bloc

  // ── Normalisation ───────────────────────────────────────────────────────
  // « Séparateur » toléré à l'intérieur de GTA 6 : espace, point, tiret, _
  const SEP = '[.\\s_\\-]{0,2}';
  const TAIL = '(?:6(?!\\d)|vi\\b|six\\b|seis\\b|sechs\\b)';
  const GTA6_RE = new RegExp('\\bg' + SEP + 't' + SEP + 'a' + SEP + TAIL, 'g');
  const GTA6_LONG_RE = new RegExp('\\bgrand' + SEP + 'theft' + SEP + 'auto' + SEP + TAIL, 'g');

  /**
   * minuscules, sans accents, GTA 6 canonisé en « gta6 », ponctuation → espace.
   * Le résultat est entouré d'espaces pour permettre des recherches « mot entier ».
   */
  function normalize(raw) {
    let s = String(raw).normalize('NFKD').toLowerCase();
    s = s.replace(/[̀-ͯ]/g, ''); // accents
    s = s.replace(GTA6_LONG_RE, ' gta6 ').replace(GTA6_RE, ' gta6 ');
    s = s.replace(/[^\p{L}\p{N}]+/gu, ' ');
    return ' ' + s.trim() + ' ';
  }

  /** Forme « compacte » (sans espace) pour reconnaître #ViceCity, #JasonDuval… */
  function squash(raw) {
    return String(raw).normalize('NFKD').toLowerCase()
      .replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, '');
  }

  // ── Compilation des listes ──────────────────────────────────────────────
  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Une liste de termes → { re, display } (display : terme normalisé → terme d'origine). */
  function compile(terms) {
    const display = new Map();
    for (const t of terms) {
      // variante sans apostrophe : « Dre'Quan » → « DreQuan »
      for (const v of new Set([t, t.replace(/['’`´]/g, '')])) {
        const n = normalize(v).trim();
        if (n && !display.has(n)) display.set(n, t.replace(/^#/, ''));
      }
    }
    if (!display.size) return null;
    const alts = [...display.keys()].sort((a, b) => b.length - a.length).map(escapeRe);
    // texte entouré d'espaces → (?<= ) et (?= ) = « mot entier »
    return { re: new RegExp('(?<= )(?:' + alts.join('|') + ')(?= )'), display };
  }

  function find(compiled, text) {
    if (!compiled) return null;
    const m = compiled.re.exec(text);
    return m ? compiled.display.get(m[0]) || m[0] : null;
  }

  const spoilStrong = [];
  const spoilNormal = [];
  for (const lang of Object.keys(K.spoilTerms)) {
    spoilStrong.push(...(K.spoilTerms[lang].strong || []));
    spoilNormal.push(...(K.spoilTerms[lang].normal || []));
  }

  const C = {
    game: compile(K.game),
    place: compile(K.places),
    specific: compile(K.characters.specific),
    ambiguous: compile(K.characters.ambiguous),
    strong: compile(spoilStrong),
    normal: compile(spoilNormal),
    custom: null,
  };

  // Termes à plusieurs mots : reconnus aussi en hashtag collé (#ViceCity).
  const squashed = [];
  for (const list of [K.game, K.places, K.characters.specific]) {
    for (const t of list) {
      const n = normalize(t).trim();
      if (n.includes(' ')) squashed.push({ key: squash(t), n });
    }
  }

  function hashtagExtras(raw) {
    if (raw.indexOf('#') === -1 && raw.indexOf('＃') === -1) return '';
    const tags = raw.match(/[#＃][\p{L}\p{N}_]{4,}/gu);
    if (!tags) return '';
    let extra = '';
    for (const tag of tags) {
      const k = squash(tag);
      for (const s of squashed) if (k.includes(s.key)) extra += s.n + ' ';
    }
    return extra;
  }

  // ── Configuration & évaluation ──────────────────────────────────────────
  let mode = 'extreme';
  const cache = new Map();
  const CACHE_MAX = 4000;
  const CAT_FR = { game: 'jeu', place: 'lieu', character: 'personnage', custom: 'mot-clé perso' };

  function configure(settings) {
    mode = settings && settings.mode === 'intermediate' ? 'intermediate' : 'extreme';
    const custom = (settings && settings.customKeywords) || [];
    C.custom = custom.length ? compile(custom) : null;
    cache.clear();
  }

  function label(category, term, spoil) {
    let s = '« ' + term + ' » (' + CAT_FR[category] + ')';
    if (spoil) s += ' + « ' + spoil + ' » (spoil)';
    return s;
  }

  function compute(raw) {
    const text = normalize(raw) + hashtagExtras(raw);

    // Mots-clés perso : l'utilisateur les a demandés explicitement → toujours bloquants.
    let term = find(C.custom, text);
    if (term) return { category: 'custom', term, spoil: null, label: label('custom', term) };

    let category = 'game';
    term = find(C.game, text);
    if (!term) { term = find(C.place, text); category = 'place'; }
    if (!term) { term = find(C.specific, text); category = 'character'; }
    const hasGta = !!term;

    if (mode === 'extreme') {
      if (!hasGta) { term = find(C.ambiguous, text); category = 'character'; }
      if (!term) return null;
      return { category, term, spoil: null, label: label(category, term) };
    }

    // Mode intermédiaire : terme GTA ET terme de spoil dans le même bloc.
    // (Jason / Lucia seuls ne comptent pas.)
    if (!hasGta) return null;
    const spoil = find(C.strong, text) || find(C.normal, text);
    if (!spoil) return null;
    return { category, term, spoil, label: label(category, term, spoil) };
  }

  function evaluate(raw) {
    if (!raw) return null;
    if (raw.length > MAX_CHARS) raw = raw.slice(0, MAX_CHARS);
    if (cache.has(raw)) return cache.get(raw);
    const res = compute(raw);
    if (cache.size >= CACHE_MAX) cache.clear();
    cache.set(raw, res);
    return res;
  }

  /**
   * Un terme GTA (jeu, lieu, personnage, mot-clé perso) apparaît-il, QUEL QUE SOIT le mode ?
   * Sert de pré-filtre rapide (ex. repli Facebook) : la décision finale reste `evaluate`.
   */
  function mentions(raw) {
    if (!raw) return false;
    const text = normalize(raw.length > MAX_CHARS ? raw.slice(0, MAX_CHARS) : raw) + hashtagExtras(raw);
    return !!(find(C.custom, text) || find(C.game, text) || find(C.place, text) ||
      find(C.specific, text) || find(C.ambiguous, text));
  }

  G.matcher = { normalize, configure, evaluate, mentions };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.matcher;
})();
