/**
 * sites/generic.js — Repli générique pour tous les sites sans module dédié.
 *
 * Stratégie : on analyse les blocs de texte « naturels » (paragraphes, items de
 * liste, citations, titres, légendes, petits articles/cartes). Les éléments sont
 * traités du plus externe au plus interne : si un bloc est masqué, ses enfants
 * sont ignorés (voir COVERED dans content.js).
 *
 * Garde-fous :
 *   - on n'analyse jamais les zones éditables (champs, éditeurs, code) ni <nav> ;
 *   - un <article>/[role=article] très long n'est pas masqué en bloc : ses
 *     paragraphes sont analysés individuellement (sinon un seul mot masquerait
 *     toute une page).
 */
(function () {
  'use strict';
  const G = self.G6S;

  const EDITABLE =
    'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"], code, pre, nav';
  const MAX_ARTICLE_CHARS = 1500;
  const MAX_BLOCK_CHARS = 5000;

  G.genericRules = [
    {
      name: 'generic',
      selectors: [
        'p', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'figcaption', 'dd', 'article', '[role="article"]',
      ],
      prehide: false, // pas de pré-masquage sur les sites inconnus
      accept(el) {
        if (el.closest(EDITABLE)) return false;
        const len = (el.textContent || '').length;
        if (len < 3) return false;
        if (el.localName === 'article' || el.getAttribute('role') === 'article') {
          return len <= MAX_ARTICLE_CHARS;
        }
        return len <= MAX_BLOCK_CHARS;
      },
    },
  ];
})();
