/**
 * sites/facebook.js — Facebook (facebook.com)
 *
 * ══ Ce qui a été OBSERVÉ sur le DOM réel ═════════════════════════════════════
 * Sonde d'une page Facebook publique (non connecté, interface en français) :
 *   - une publication = <div role="article" aria-posinset="1">, SANS aria-label,
 *     portée par un ancêtre data-pagelet="TimelineFeedUnit_0"
 *     (⚠ « TimelineFeedUnit », pas « FeedUnit » : d'où le sélecteur *="FeedUnit") ;
 *   - un commentaire = <div role="article" aria-label="Commentaire de <nom> il y a 7 heures">,
 *     IMBRIQUÉ dans l'article de la publication ;
 *   - il existe des <div role="article"> vides (textLength 0) : squelettes de chargement
 *     ou publications « virtualisées » (contenu retiré hors écran, remis au retour) ;
 *   - pas de [role="feed"] sur une page (il existe sur le fil / les groupes d'après la
 *     connaissance du site, mais NON VÉRIFIÉ ici) ;
 *   - sur une page : data-pagelet="ProfileActions", "ProfileTabs", "ProfileTilesFeed_0/1"
 *     (cartes « Intro » / photos).
 * Le fil d'actualité CONNECTÉ n'est pas accessible sans compte : sa structure n'a pas pu
 * être relevée. D'où une approche à plusieurs niveaux, indépendante des classes CSS
 * générées (« x1n2onr6… ») :
 *
 * ══ Stratégie 1 : conteneurs de publication (sélecteurs structurels) ═════════
 *   [role="feed"] > *               enfants du fil (fil d'actualité, groupes)
 *   [data-pagelet*="FeedUnit"]      unité de fil (FeedUnit_N, TimelineFeedUnit_N…)
 *   [aria-posinset]                 position dans le fil (accessibilité) — hors menus / onglets
 *   div[role="article"]             article de premier niveau (pas imbriqué dans un autre)
 *   Texte analysé = tout le conteneur (auteur, page / groupe, texte, publication PARTAGÉE,
 *   aperçu de lien, alt des images, « Sponsorisé ») SAUF les commentaires.
 *   Un texte contenu dans div[dir="auto"] / [data-ad-preview="message"] en fait partie.
 *
 * ══ Stratégie 2 : commentaires ═══════════════════════════════════════════════
 *   div[role="article"][aria-label^="Commentaire|Comment|Réponse|Reply|Comentario|…"]
 *   Analysés et masqués séparément du post (un commentaire spoil ne masque pas le post).
 *
 * ══ Stratégie 3 (SECOURS) : on part du TEXTE ═════════════════════════════════
 *   Quand un terme GTA est trouvé dans un nœud de texte, un div[dir="auto"], un
 *   [data-ad-preview="message"], un alt ou un aria-label, on REMONTE les parents jusqu'au
 *   conteneur de publication le plus proche (commentaire → publication la plus externe
 *   → enfant de [role="feed"]) ; à défaut, jusqu'à l'élément d'une liste d'éléments
 *   frères de même taille (heuristique de mise en page) ; en dernier recours, l'ancêtre
 *   visible le plus proche (≤ 8 niveaux). Ne dépend d'AUCUN sélecteur de post : c'est le
 *   filet de sécurité si Facebook change le balisage des publications.
 *
 * Autres zones : Marketplace (a[href*="/marketplace/item/"]), titre de page / groupe / profil
 * (h1 dans [role="main"]), carte « Intro » (data-pagelet^="ProfileTilesFeed"), Reels et vidéos
 * (/reel/, /reels/, /watch, /videos/ → bloc « lecteur », vidéo en pause ; les vidéos d'un post
 * masqué sont mises en pause avec lui).
 *
 * Limites : texte tronqué (« Voir plus ») — seul le texte présent dans le DOM est lu ; dès que
 * l'utilisateur déplie, le DOM change et le post est ré-analysé. Facebook brouille parfois des
 * mots avec des caractères cachés.
 */
(function () {
  'use strict';
  const G = self.G6S;
  const util = G.util;
  const matcher = G.matcher;

  const ARTICLE = 'div[role="article"]';
  const MAX_NODE_TEXT = 3000;

  // ── Commentaires : aria-label qui commence par « Commentaire de… », « Comment by… »… ──
  const COMMENT_PREFIXES = [
    'Commentaire', 'Comment', 'Réponse', 'Reply', 'Comentario', 'Respuesta',
    'Commento', 'Risposta', 'Kommentar', 'Antwort', 'Comentário', 'Resposta',
  ];
  const COMMENT_SELS = COMMENT_PREFIXES.map((p) => ARTICLE + '[aria-label^="' + p + '" i]');
  const COMMENT_SEL = COMMENT_SELS.join(',');

  // ── Conteneurs de publication ──
  const POSTISH = '[aria-posinset],[data-pagelet*="FeedUnit"],' + ARTICLE;
  const POST_SELS = [
    '[role="feed"] > *',
    '[data-pagelet*="FeedUnit"]',
    '[aria-posinset]',
    ARTICLE + ':not(' + ARTICLE + ' ' + ARTICLE + ')',
  ];
  // aria-posinset est aussi utilisé par des menus, onglets, listes déroulantes…
  const NOT_A_POST = '[role="option"],[role="tab"],[role="menuitem"],[role="treeitem"],[role="gridcell"],[role="row"],[role="radio"]';

  const NO_SCAN = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]';

  // ── Remontée vers le conteneur de publication ──────────────────────────
  /** Élément d'une liste d'éléments frères « de même gabarit » (heuristique de mise en page). */
  function listItemAncestor(el) {
    let cur = el;
    for (let i = 0; i < 25 && cur.parentElement && cur.parentElement !== document.body; i++, cur = cur.parentElement) {
      const par = cur.parentElement;
      if (par.matches('[role="main"]')) break;
      if (par.children.length < 2 || cur.getBoundingClientRect().height < 100) continue;
      let big = 0;
      for (const s of par.children) if (s.getBoundingClientRect().height >= 100) big++;
      if (big >= 2) return cur;
    }
    return null;
  }

  // Zones structurelles de la page : on ne les masque JAMAIS en bloc par le secours.
  const STRUCTURAL = '[role="main"],[role="banner"],[role="navigation"],[role="complementary"],[role="dialog"],[role="contentinfo"]';

  /** Dernier recours : ancêtre visible le plus proche (≤ 8 niveaux), de taille « raisonnable ». */
  function visibleAncestor(el) {
    let cur = el;
    for (let i = 0; i < 8 && cur && cur !== document.body; i++, cur = cur.parentElement) {
      if (cur.matches(STRUCTURAL)) return null;
      const h = cur.getBoundingClientRect().height;
      if (h >= 80) return h <= window.innerHeight * 1.5 ? cur : null;
    }
    return null;
  }

  function containerFor(hit) {
    if (hit.closest(NO_SCAN)) return null;
    // Déjà pris en charge (analysé) par une règle précise : le secours n'a rien à ajouter.
    if (hit.closest('[data-g6s-checked]')) return null;
    if (hit.closest('a[href*="/marketplace/item/"]')) return null; // règle Marketplace
    let c = hit.closest(COMMENT_SEL);
    if (c) return c;
    c = hit.closest(POSTISH);
    if (c) {
      // Publication partagée / article imbriqué : on remonte à la plus externe.
      for (let p = c.parentElement && c.parentElement.closest(POSTISH); p; p = c.parentElement && c.parentElement.closest(POSTISH)) c = p;
      return c;
    }
    c = hit.closest('[role="feed"] > *');
    if (c) return c;
    return listItemAncestor(hit) || visibleAncestor(hit);
  }

  // ── Détection des termes dans le DOM (indépendante de la structure) ─────
  /** Éléments dont le texte / alt / aria-label mentionne un terme GTA, dans les racines données. */
  function collectHits(roots) {
    const hits = new Set();
    const short = (el) => {
      const t = el.textContent;
      return t && t.length <= MAX_NODE_TEXT && matcher.mentions(t);
    };
    for (const r of roots) {
      const el = r.el === document ? document.documentElement : r.el;
      if (!el || !el.isConnected) continue;
      if (!r.deep) { if (short(el)) hits.add(el); continue; }

      // 1) nœuds de texte
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n = 0;
      for (let node = w.nextNode(); node && n < 8000; node = w.nextNode(), n++) {
        const v = node.nodeValue;
        if (v && v.length >= 3 && node.parentElement && matcher.mentions(v)) hits.add(node.parentElement);
      }
      // 2) texte découpé en plusieurs nœuds (« GTA » + « 6 ») : on teste les blocs de texte entiers
      for (const e of el.querySelectorAll('[dir="auto"], [data-ad-preview="message"]')) if (short(e)) hits.add(e);
      // 3) texte alternatif / libellés
      for (const e of el.querySelectorAll('[alt], [aria-label]')) {
        const v = e.getAttribute('alt') || e.getAttribute('aria-label');
        if (v && matcher.mentions(v)) hits.add(e);
      }
      if (short(el)) hits.add(el);
    }
    return hits;
  }

  function fallbackContainers(roots) {
    const out = new Set();
    for (const h of collectHits(roots)) {
      const c = containerFor(h);
      if (c && c !== document.body && c !== document.documentElement) out.add(c);
    }
    return [...out];
  }

  G.registerSite({
    id: 'facebook',
    label: 'Facebook',
    hosts: /(^|\.)facebook\.com$/,

    rules: [
      {
        // Stratégie 1 : publications (fil, pages, groupes, profils, recherche, sponsorisées).
        name: 'post',
        selectors: POST_SELS,
        accept(el) {
          if (el.matches(COMMENT_SEL) || el.closest(COMMENT_SEL)) return false; // règle « comment »
          if (el.hasAttribute('aria-posinset') && !el.matches(ARTICLE)) {
            if (el.matches(NOT_A_POST)) return false;
            if (!el.closest('[role="feed"], [role="main"]')) return false;
          }
          return true;
        },
        textOptions: { skip: COMMENT_SEL },
      },
      {
        // Stratégie 2 : commentaires et réponses, jugés un par un.
        name: 'comment',
        selectors: COMMENT_SELS,
        textOptions: { skip: COMMENT_SEL },
      },
      {
        name: 'marketplace',
        selectors: ['a[href*="/marketplace/item/"]'],
      },
      {
        // Titre d'une page, d'un groupe ou d'un profil.
        name: 'page-title',
        selectors: ['[role="main"] h1'],
        accept(el) { return !el.closest('[role="article"]'); },
      },
      {
        // Carte « Intro » / infos d'une page ou d'un profil.
        name: 'profile-intro',
        selectors: ['[data-pagelet^="ProfileTilesFeed"]'],
      },
      {
        name: 'reel',
        kind: 'player',
        prehide: false,
        find() {
          if (!/^\/(reels?|watch|videos?)\b/.test(location.pathname)) return [];
          const out = [];
          for (const v of document.querySelectorAll('video')) {
            const b = util.climbToPlayerBlock(v);
            if (b && !b.closest(POSTISH)) out.push(b);
          }
          return out;
        },
      },
      {
        // Stratégie 3 : secours ancré sur le texte (voir l'en-tête du fichier). En dernier : une règle
        // qui a déjà pris un élément en charge n'est jamais contredite par celle-ci.
        name: 'text-fallback',
        prehide: false,
        find: fallbackContainers,
        textOptions: { skip: COMMENT_SEL },
      },
    ],
  });
})();
