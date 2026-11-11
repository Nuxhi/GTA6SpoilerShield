/**
 * sites/tiktok.js — TikTok (version web : tiktok.com)
 *
 * SÉLECTEURS CHOISIS (attributs `data-e2e`, utilisés par TikTok pour ses tests,
 * donc bien plus stables que les classes « css-xxxx-DivYyy ») :
 *   [data-e2e="recommend-list-item-container"]  vidéo du fil « Pour toi » / Abonnements
 *   article[data-scroll-index]                  idem, variante de balisage
 *   [data-e2e="user-post-item"]                 vignette d'une grille de profil
 *   [data-e2e="explore-item"]                   vignette de la page Découvrir
 *   [data-e2e="search_top-item"], [data-e2e="search_video-item"]   résultats de recherche
 *   [data-e2e="challenge-item"]                 vignette d'une page hashtag
 *   [data-e2e^="comment-level"]                 commentaire (niveau 1 ou 2)
 *   Page d'une vidéo (/@pseudo/video/…) : la <video> + le plus petit ancêtre qui contient aussi la
 *   légende ([data-e2e="video-desc"] ou "browse-video-desc") — sans classe CSS.
 * Textes lus dans ces blocs : légende (video-desc), nom du son (video-music), pseudo, hashtags.
 * PROFIL : [data-e2e="user-title"] (pseudo), "user-subtitle" (nom), "user-bio".
 *
 * ⚠ À valider sur le site réel (voir README_MAX.md) : les noms data-e2e changent parfois.
 */
(function () {
  'use strict';
  const G = self.G6S;
  const util = G.util;
  const W = G.whitelist;

  // ── Liste blanche : liens /@user de l'auteur, hors légende / son / commentaires (mentions) ──
  const NOT_AUTHOR = '[data-e2e="video-desc"], [data-e2e="browse-video-desc"], [data-e2e="video-music"], ' +
    '[data-e2e="browse-music"], [data-e2e^="comment"]';
  /** Un seul compte distinct, sinon null (collaboration / duo / ambigu → reste bloqué). */
  function ttIdentify(el) {
    const ids = new Set();
    for (const a of el.querySelectorAll('a[href*="/@"]')) {
      if (a.closest(NOT_AUTHOR)) continue;
      const id = W.idFromHref('tiktok', a.getAttribute('href'));
      if (id) ids.add(id);
    }
    return ids.size === 1 ? { platform: 'tiktok', ids: [...ids] } : null;
  }

  const CAPTION = '[data-e2e="video-desc"], [data-e2e="browse-video-desc"]';

  /** "/@pseudo/…" → "pseudo". */
  function handleFromPath(path) {
    const m = /^\/@([A-Za-z0-9_.]+)(?:\/)?$/.exec(path);
    return m ? m[1].toLowerCase() : null;
  }

  G.registerSite({
    id: 'tiktok',
    label: 'TikTok',
    hosts: /(^|\.)tiktok\.com$/,

    rules: [
      {
        name: 'feed-video',
        kind: 'player',
        identify: ttIdentify,
        selectors: ['[data-e2e="recommend-list-item-container"]', 'article[data-scroll-index]'],
        author(el) {
          const a = el.querySelector('a[href^="/@"]');
          const m = a && /^\/@([^/?#]+)/.exec(a.getAttribute('href'));
          return m ? { id: m[1].toLowerCase(), text: '' } : null;
        },
      },
      {
        name: 'grid-item',
        selectors: [
          '[data-e2e="user-post-item"]', '[data-e2e="explore-item"]',
          '[data-e2e="search_top-item"]', '[data-e2e="search_video-item"]',
          '[data-e2e="challenge-item"]',
        ],
      },
      {
        // Page d'une vidéo isolée.
        name: 'video-page',
        kind: 'player',
        identify: ttIdentify,
        prehide: false,
        find() {
          if (!/\/video\//.test(location.pathname)) return [];
          const v = document.querySelector('video');
          const block = v && util.smallestAncestorWith(v, CAPTION);
          return block ? [block] : [];
        },
      },
      {
        name: 'comment',
        selectors: ['[data-e2e^="comment-level"]'],
        target(el) { return el.closest('[class*="CommentItemContainer"]') || el.parentElement || el; },
        text(el) {
          const box = el.closest('[class*="CommentItemContainer"]') || el;
          return util.extractText(box);
        },
      },
    ],

    profile: {
      detect(loc) {
        const id = handleFromPath(loc.pathname);
        return id ? { id } : null;
      },
      read(info) {
        const title = document.querySelector('[data-e2e="user-title"]');
        if (!title || title.textContent.trim().toLowerCase() !== info.id) return null;
        return ['user-title', 'user-subtitle', 'user-bio']
          .map((k) => document.querySelector('[data-e2e="' + k + '"]'))
          .filter(Boolean).map((e) => util.extractText(e)).join('\n');
      },
      cover: null, // les vidéos du compte sont masquées une à une
    },
  });
})();
