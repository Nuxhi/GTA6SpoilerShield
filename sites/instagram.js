/**
 * sites/instagram.js — Instagram (instagram.com)
 *
 * Instagram n'expose presque aucun attribut de test : ses classes sont générées
 * (« x1lliihq x6ikm8r… »). On s'appuie donc sur la STRUCTURE et les URL :
 *   article                              post du fil, page /p/…, post en fenêtre modale.
 *                                        Texte : légende, pseudo, commentaires visibles, alt.
 *                                        (Un commentaire spoil masque donc tout le post.)
 *   a[href*="/p/"], a[href*="/reel/"]    vignettes des grilles (profil, Explorer, recherche) — seulement
 *                                        celles qui contiennent une image/vidéo et ne sont PAS dans un
 *                                        <article> ; texte = alt de l'image (légende / description auto).
 *   Reels (/reels/…, /reel/…)            <video> → bloc « lecteur plein écran » (heuristique
 *                                        util.climbToPlayerBlock, sans classe CSS).
 *   Stories (/stories/…)                 section[role="dialog"] ou main section (meilleur effort :
 *                                        seul le texte disponible — pseudo, alt — est analysé).
 *   PROFIL (/pseudo/)                    <header> de la page : pseudo, nom, BIO. Si ça matche :
 *                                        toute la page profil (<main>) est recouverte.
 *   Auteur d'un post                     header a[href="/pseudo/"] dans l'<article>.
 *
 * ⚠ À valider sur le site réel (voir README) : c'est la plateforme la plus fragile.
 */
(function () {
  'use strict';
  const G = self.G6S;
  const util = G.util;
  const W = G.whitelist;

  // ── Liste blanche ──
  const profileId = (a) => W.idFromHref('instagram', a.getAttribute('href'));

  /** Auteur principal = premier lien de profil du <header> du post (collaboration : le 1er = auteur principal). */
  function igIdentify(el) {
    const header = el.querySelector('header');
    if (!header) return null;
    for (const a of header.querySelectorAll('a[href]')) {
      const id = profileId(a);
      if (id) return { platform: 'instagram', ids: [id] };
    }
    return null;
  }

  /** Commentaires d'AUTRES comptes dans l'<article> : isolés pour rester filtrés. */
  function igParts(el, who) {
    const parts = [];
    for (const li of el.querySelectorAll('ul li')) {
      if (parts.some((p) => p.el.contains(li))) continue;
      const a = li.querySelector('a[href]');
      const id = a && profileId(a);
      if (id && id === who.ids[0]) continue; // légende ou réponse de l'auteur lui-même
      parts.push({ el: li, identify: () => (id ? { platform: 'instagram', ids: [id] } : null) });
    }
    return parts;
  }

  /** Reel / story : un seul profil distinct dans le bloc, sinon ambigu (mentions) → bloqué. */
  function igSingleProfile(el) {
    const ids = new Set();
    for (const a of el.querySelectorAll('a[href]')) { const id = profileId(a); if (id) ids.add(id); }
    return ids.size === 1 ? { platform: 'instagram', ids: [...ids] } : null;
  }

  const RESERVED = new Set([
    'explore', 'reels', 'reel', 'stories', 'p', 'tv', 'direct', 'accounts', 'about', 'legal',
    'developer', 'api', 'challenge', 'directory', 'web', 'emails', 'session', 'nametag',
  ]);

  function handleFromPath(path) {
    const m = /^\/([A-Za-z0-9_.]{1,30})\/?$/.exec(path);
    return m && !RESERVED.has(m[1].toLowerCase()) ? m[1].toLowerCase() : null;
  }

  function playerBlocks() {
    const out = [];
    for (const v of document.querySelectorAll('video')) {
      const b = util.climbToPlayerBlock(v);
      if (b) out.push(b);
    }
    return out;
  }

  G.registerSite({
    id: 'instagram',
    label: 'Instagram',
    hosts: /(^|\.)instagram\.com$/,

    rules: [
      {
        name: 'post',
        selectors: ['article'],
        identify: igIdentify,
        parts: igParts,
        author(el) {
          const a = el.querySelector('header a[href^="/"]');
          const id = a && handleFromPath(a.getAttribute('href'));
          return id ? { id, text: '' } : null;
        },
      },
      {
        name: 'grid-tile',
        selectors: ['a[href*="/p/"]', 'a[href*="/reel/"]'],
        accept(el) { return !el.closest('article') && !!el.querySelector('img, video'); },
      },
      {
        name: 'reel',
        kind: 'player',
        identify: igSingleProfile,
        prehide: false,
        find() {
          return /^\/(reels?)\//.test(location.pathname) ? playerBlocks() : [];
        },
      },
      {
        name: 'story',
        kind: 'player',
        prehide: false,
        find() {
          if (!/^\/stories\//.test(location.pathname)) return [];
          const s = document.querySelector('section[role="dialog"]') || document.querySelector('main section');
          return s ? [s] : [];
        },
      },
    ],

    profile: {
      detect(loc) {
        const id = handleFromPath(loc.pathname);
        return id ? { id } : null;
      },
      read(info) {
        const header = document.querySelector('main header') || document.querySelector('header');
        if (!header || !header.textContent.toLowerCase().includes(info.id)) return null;
        return util.extractText(header);
      },
      // Spec : « sur un profil lié à GTA 6, masquer toute la page profil ».
      cover() { return document.querySelector('main'); },
    },
  });
})();
