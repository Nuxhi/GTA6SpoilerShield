/**
 * util.js — Outils DOM partagés par le moteur (content.js) et les modules de sites.
 */
(function () {
  'use strict';
  const G = (self.G6S = self.G6S || {});

  const MAX_TEXT = 10000;
  const IGNORED_TAGS = new Set(['script', 'style', 'noscript', 'template', 'svg']);
  const TEXT_ATTRS = ['alt', 'aria-label', 'title'];

  /**
   * Texte « analysable » d'un élément : nœuds texte + alt / aria-label / title
   * (miniatures, images…) + shadow DOM ouverts. Ignore nos propres overlays.
   *
   * @param {Element} root
   * @param {{skip?: string}} [opts]  skip : sélecteur de descendants à ignorer
   *                                  (ex. commentaires imbriqués dans un post)
   */
  function extractText(root, opts) {
    const ctx = { len: 0, skip: (opts && opts.skip) || null, out: [] };
    pushAttrs(root, ctx);
    collect(root, ctx);
    return ctx.out.join(' ');
  }

  function pushAttrs(el, ctx) {
    for (let i = 0; i < TEXT_ATTRS.length; i++) {
      const v = el.getAttribute && el.getAttribute(TEXT_ATTRS[i]);
      if (v) { ctx.out.push(v); ctx.len += v.length; }
    }
  }

  function collect(node, ctx) {
    for (let c = node.firstChild; c && ctx.len < MAX_TEXT; c = c.nextSibling) {
      if (c.nodeType === 3) {
        const v = c.nodeValue;
        if (v && v.trim()) { ctx.out.push(v); ctx.len += v.length; }
      } else if (c.nodeType === 1) {
        if (IGNORED_TAGS.has(c.localName)) continue;
        if (c.hasAttribute('data-g6s-overlay')) continue;
        if (ctx.skip && c.matches(ctx.skip)) continue;
        pushAttrs(c, ctx);
        if (c.shadowRoot) collect(c.shadowRoot, ctx);
        collect(c, ctx);
      }
    }
  }

  /** Petit hash de chaîne (djb2) — sert de « signature » du contenu d'un bloc. */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return h + ':' + str.length;
  }

  /** Plus petit ancêtre de `el` qui contient aussi un élément `selector`. */
  function smallestAncestorWith(el, selector, maxLevels) {
    let cur = el.parentElement;
    for (let i = 0; cur && i < (maxLevels || 14); i++, cur = cur.parentElement) {
      if (cur.querySelector(selector)) return cur;
    }
    return null;
  }

  /**
   * Heuristique « lecteur plein écran » (Reels, stories, vidéos verticales) :
   * remonte depuis une <video> jusqu'au plus petit ancêtre qui (1) ne contient
   * que cette vidéo, (2) a du texte (pseudo, légende), (3) occupe ≥ 60 % de la
   * hauteur de la fenêtre. À défaut, le plus grand ancêtre « mono-vidéo » avec texte.
   * Indépendant des classes CSS (qui changent à chaque déploiement).
   */
  function climbToPlayerBlock(video) {
    let cur = video.parentElement;
    let best = null;
    for (let i = 0; cur && cur !== document.body && i < 20; i++, cur = cur.parentElement) {
      if (cur.querySelectorAll('video').length > 1) break;
      if (!cur.textContent || !cur.textContent.trim()) continue;
      best = cur;
      if (cur.getBoundingClientRect().height >= window.innerHeight * 0.6) return cur;
    }
    return best;
  }

  /** Enfant « de premier niveau » de l'un des conteneurs `parentSelector`. */
  function topLevelBlock(el, parentSelector) {
    let cur = el;
    while (cur && cur.parentElement) {
      if (cur.parentElement.matches(parentSelector)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  G.util = { extractText, hash, smallestAncestorWith, climbToPlayerBlock, topLevelBlock };
  G.sites = G.sites || [];
  G.registerSite = (site) => G.sites.push(site);
})();
