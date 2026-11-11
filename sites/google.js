/**
 * sites/google.js — Google (google.<tld>, news.google.com)
 *
 * Google utilise des classes courtes générées (« MjjYud », « g », « kno-kp »…) et change
 * souvent la structure ; on combine les rares ancres stables (id, balises personnalisées `g-*`,
 * attributs `data-*`) et des heuristiques sur le TEXTE (pour les aperçus IA) :
 *
 *   #rso div.MjjYud, #botstuff div.MjjYud     un résultat / bloc de résultats. Les blocs qui en contiennent
 *                                             d'autres (groupes) sont ignorés : on ne masque que les feuilles.
 *   #rso > div (sans .MjjYud à l'intérieur)   blocs « spéciaux » de premier niveau (carrousels, panneaux…).
 *   .related-question-pair                    « Autres questions posées » (une question + sa réponse).
 *   g-inner-card, g-section-with-header,      cartes d'actualités / vidéos des carrousels, sections « À la une ».
 *   video-voyager
 *   #rhs                                      colonne de droite = panneau de connaissances.
 *   [data-text-ad], .pla-unit                 annonces sponsorisées (texte) / Shopping.
 *   Aperçu IA (AI Overview)                   repéré par son TITRE (« Aperçu IA », « AI Overview »,
 *                                             « KI-Übersicht »…) puis remonté jusqu'au bloc de premier niveau
 *                                             de #rso / #center_col → masqué en entier.
 *   ul[role="listbox"] > li                   suggestions d'autocomplétion → retirées de la liste.
 *   news.google.com : article                 chaque article de Google Actualités.
 *
 * Non couvert précisément : Google Discover (flux d'accueil mobile / Chrome), dont le balisage est
 * trop instable ; le repli par le texte de la page n'y est pas actif (voir README, « Limites »).
 *
 * ⚠ À valider sur le site réel (voir README).
 */
(function () {
  'use strict';
  const G = self.G6S;
  const util = G.util;

  // google.com, google.fr, google.co.uk, google.com.br… mais pas mail./docs./drive./accounts.…
  const NOT_SEARCH = /^(mail|docs|drive|accounts|calendar|meet|sheets|slides|forms|sites|myaccount|contacts|photos|play|chat|classroom|keep|translate|maps|earth|cloud|console|support|workspace)\./;
  const HOSTS = /(^|\.)google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/;

  const AIO_TITLE =
    /(ai overview|aper[cç]u (ia|d'ia|g[eé]n[eé]r[eé])|ki-?[uü]bersicht|[uü]bersicht mit ki|resumen (de ia|generado|con ia)|panoramica (ia|generata)|vis[aã]o geral (de|criada)|resultaten van ai|ai-overzicht)/i;
  const TOP_LEVEL_PARENTS = '#rso, #center_col, #search, #res, #main';

  const hasLeafChildren = (el) => !el.querySelector('div.MjjYud');

  G.registerSite({
    id: 'google',
    label: 'Google',
    hosts: {
      test(host) { return HOSTS.test(host) && !NOT_SEARCH.test(host); },
    },

    rules: [
      {
        name: 'result',
        selectors: ['#rso div.MjjYud', '#botstuff div.MjjYud'],
        accept: hasLeafChildren,
      },
      {
        name: 'special-block',
        selectors: ['#rso > div'],
        accept: (el) => hasLeafChildren(el) && !el.matches('div.MjjYud'),
      },
      {
        name: 'people-also-ask',
        selectors: ['.related-question-pair'],
      },
      {
        name: 'carousel-card',
        selectors: ['g-inner-card', 'g-section-with-header', 'video-voyager'],
      },
      {
        name: 'knowledge-panel',
        selectors: ['#rhs'],
      },
      {
        name: 'ads',
        selectors: ['[data-text-ad]', '.pla-unit'],
      },
      {
        // Aperçu IA : repérage par le titre, puis remontée jusqu'au bloc de premier niveau.
        name: 'ai-overview',
        find() {
          const out = [];
          const heads = document.querySelectorAll(
            '#center_col [role="heading"], #center_col h1, #center_col h2, #rso [role="heading"]'
          );
          for (const h of heads) {
            const t = h.textContent;
            if (!t || t.length > 60 || !AIO_TITLE.test(t)) continue;
            let block = util.topLevelBlock(h, TOP_LEVEL_PARENTS);
            // Garde-fou : bloc démesuré → on se rabat sur l'ancêtre [data-hveid] le plus proche.
            if (block && block.textContent.length > 8000) block = h.closest('[data-hveid]') || block;
            if (block) out.push(block);
          }
          return out;
        },
      },
      {
        name: 'autocomplete',
        selectors: ['ul[role="listbox"] > li'],
        mode: 'collapse',
      },
      {
        name: 'news-article',
        selectors: ['article'],
        when: () => location.hostname === 'news.google.com',
      },
    ],
  });
})();
