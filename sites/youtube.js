/**
 * sites/youtube.js — YouTube (youtube.com, m.youtube.com, y compris Shorts)
 *
 * SÉLECTEURS CHOISIS (balises personnalisées `ytd-*` / `ytm-*`, stables d'une
 * mise à jour à l'autre ; aucune classe générée) :
 *
 *  CARTES VIDÉO (titre, chaîne, miniature via alt/aria-label/title) :
 *    ytd-rich-item-renderer          accueil / chaîne (grille)
 *    ytd-video-renderer              résultats de recherche
 *    ytd-compact-video-renderer      suggestions latérales (ancien)
 *    yt-lockup-view-model            suggestions latérales / cartes (nouveau)
 *    ytd-grid-video-renderer, ytd-playlist-renderer, ytd-compact-playlist-renderer,
 *    ytd-channel-renderer (nom + description), ytd-radio-renderer, ytd-movie-renderer,
 *    ytm-shorts-lockup-view-model     miniatures Shorts dans les rayons
 *    ytm-rich-item-renderer, ytm-video-with-context-renderer, ytm-compact-video-renderer (mobile)
 *  PUBLICITÉS : ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-display-ad-renderer,
 *    ytd-promoted-video-renderer — traitées comme du contenu normal.
 *  COMMENTAIRES : ytd-comment-view-model (+ ytd-comment-renderer, ancien) — un par commentaire
 *    ou réponse (on évite ytd-comment-thread-renderer qui regroupe les réponses).
 *  NOTIFICATIONS : ytd-notification-renderer.
 *  SHORTS : ytd-reel-video-renderer (un par Short, texte = titre, légende, #hashtags, chaîne, son)
 *    et ytm-reel-item-renderer (mobile) → tout le lecteur est recouvert, vidéo en pause.
 *  PAGE VIDÉO (/watch) : <ytd-watch-flexy> ; texte = <ytd-watch-metadata> (titre, chaîne,
 *    description) ; cible = <ytd-player> (le lecteur), vidéo en pause.
 *  FIN DE VIDÉO : .ytp-videowall-still, .ytp-ce-element (suggestions sur le lecteur) — masquées.
 *  AUTOCOMPLÉTION : .ytSearchboxComponentSuggestion, .sbse (classes → fragile, meilleur effort).
 *
 * ⚠ À valider sur le site réel (voir README_MAX.md) : YouTube migre progressivement vers
 *   `yt-lockup-view-model` et renomme certains composants.
 */
(function () {
  'use strict';
  const G = self.G6S;
  const util = G.util;
  const W = G.whitelist;

  // ── Liste blanche : identité de la chaîne (liens /@handle ou /channel/UC…) ──
  // DOM réel relevé : une carte vidéo contient <ytd-channel-name><a href="/@RockstarGames"> et
  // #channel-info a[href="/@RockstarGames"] ; une pub n'a aucun lien de chaîne (donc reste bloquée).
  const AUTHOR_LINKS = 'ytd-channel-name a[href], #channel-name a[href], #channel-info a[href], a#author-text[href], ' +
    '.ytReelChannelBarViewModelChannelName a[href], yt-content-metadata-view-model a[href^="/@"], ' +
    'yt-content-metadata-view-model a[href^="/channel/"]';
  const NOT_AUTHOR = '#description-text, .metadata-snippet-container, ytd-expander, #content-text, yt-attributed-string';

  /** Une seule chaîne distincte dans le bloc, sinon null (collaboration, ambiguïté, introuvable). */
  function ytIdentify(root) {
    if (!root) return null;
    const ids = new Set();
    for (const a of root.querySelectorAll(AUTHOR_LINKS)) {
      if (a.closest(NOT_AUTHOR)) continue; // liens placés dans une description / un texte : pas l'auteur
      const id = W.idFromHref('youtube', a.getAttribute('href'));
      if (id) ids.add(id);
    }
    return ids.size === 1 ? { platform: 'youtube', ids: [...ids] } : null;
  }

  /**
   * Apprentissage @handle ↔ ID UC… : uniquement sur la page de la chaîne (URL /@handle, lien canonique
   * /channel/UC… ET meta itemprop="identifier" d'accord entre eux). Vérifié sur le site réel :
   * youtube.com/@RockstarGames → canonical /channel/UC6VcWc1rAoWdBCM0JxrRQ3A. La page d'une vidéo, elle,
   * n'expose que le @handle. Le moteur ne retient la paire que si elle est stable (voir content.js).
   */
  function ytLearn() {
    const m = /^\/(@[^/]+)/.exec(location.pathname);
    if (!m) return [];
    const canon = document.querySelector('link[rel="canonical"]');
    const meta = document.querySelector('meta[itemprop="identifier"]');
    const uc = canon && W.idFromHref('youtube', canon.getAttribute('href'));
    const metaId = meta && W.normalizeId('youtube', meta.getAttribute('content'));
    const handle = W.normalizeId('youtube', m[1]);
    if (!uc || !metaId || uc !== metaId || !handle || !/^uc/.test(uc)) return [];
    return [{ platform: 'youtube', a: handle, b: uc }];
  }

  G.registerSite({
    id: 'youtube',
    label: 'YouTube',
    hosts: /(^|\.)youtube\.com$/,
    learn: ytLearn,

    rules: [
      {
        name: 'card',
        identify: ytIdentify,
        selectors: [
          'ytd-rich-item-renderer', 'ytd-video-renderer', 'ytd-compact-video-renderer',
          'yt-lockup-view-model', 'ytd-grid-video-renderer', 'ytd-playlist-renderer',
          'ytd-compact-playlist-renderer', 'ytd-channel-renderer', 'ytd-radio-renderer',
          'ytd-compact-radio-renderer', 'ytd-movie-renderer', 'ytm-shorts-lockup-view-model',
          'ytm-shorts-lockup-view-model-v2', 'ytm-rich-item-renderer',
          'ytm-video-with-context-renderer', 'ytm-compact-video-renderer',
          'ytd-ad-slot-renderer', 'ytd-in-feed-ad-layout-renderer', 'ytd-display-ad-renderer',
          'ytd-promoted-video-renderer',
        ],
      },
      {
        name: 'comment',
        identify: ytIdentify,
        selectors: ['ytd-comment-view-model', 'ytd-comment-renderer'],
      },
      {
        name: 'notification',
        selectors: ['ytd-notification-renderer'],
      },
      {
        // Un Short = tout le lecteur recouvert + pause + son coupé.
        name: 'short',
        kind: 'player',
        identify: ytIdentify,
        selectors: ['ytd-reel-video-renderer', 'ytm-reel-item-renderer'],
      },
      {
        // Page /watch : on masque le lecteur si le titre / la description / la chaîne matchent.
        name: 'watch',
        kind: 'player',
        identify: (el) => ytIdentify(el.querySelector('ytd-watch-metadata')),
        prehide: false,
        find() {
          if (location.pathname !== '/watch') return [];
          const w = document.querySelector('ytd-watch-flexy');
          return w ? [w] : [];
        },
        text(el) {
          const meta = el.querySelector('ytd-watch-metadata');
          return meta ? util.extractText(meta) : '';
        },
        target(el) { return el.querySelector('ytd-player') || el; },
      },
      {
        name: 'end-screen',
        selectors: ['.ytp-videowall-still', '.ytp-ce-element'],
        mode: 'collapse',
      },
      {
        name: 'autocomplete',
        selectors: ['.ytSearchboxComponentSuggestion', '.sbse'],
        mode: 'collapse',
      },
    ],
  });
})();
