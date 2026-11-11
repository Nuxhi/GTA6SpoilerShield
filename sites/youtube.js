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
 * ⚠ À valider sur le site réel (voir README) : YouTube migre progressivement vers
 *   `yt-lockup-view-model` et renomme certains composants.
 */
(function () {
  'use strict';
  const G = self.G6S;
  const util = G.util;

  G.registerSite({
    id: 'youtube',
    label: 'YouTube',
    hosts: /(^|\.)youtube\.com$/,

    rules: [
      {
        name: 'card',
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
        selectors: ['ytd-reel-video-renderer', 'ytm-reel-item-renderer'],
      },
      {
        // Page /watch : on masque le lecteur si le titre / la description / la chaîne matchent.
        name: 'watch',
        kind: 'player',
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
