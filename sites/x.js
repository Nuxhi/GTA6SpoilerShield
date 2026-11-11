/**
 * sites/x.js — X / Twitter (x.com, twitter.com)
 *
 * SÉLECTEURS CHOISIS (attributs stables `data-testid`, jamais les classes
 * « css-1dbjc4n… » générées) :
 *   article[data-testid="tweet"]          post (timeline, réponses, recherche, page d'un post).
 *                                         Contient aussi : nom + @pseudo (User-Name), texte
 *                                         (tweetText), citation, carte de lien (card.wrapper),
 *                                         texte alt des images (img[alt]), note de la communauté.
 *   [data-testid="trend"]                 tendance (colonne de droite + onglet Explorer).
 *   [data-testid="UserCell"]              compte suggéré / résultat de recherche (contient la BIO).
 *   article[data-testid="notification"]   notification.
 *   [data-testid="typeaheadResult"]       suggestion de recherche (autocomplétion).
 * PROFIL : [data-testid="UserName"], [data-testid="UserDescription"] (bio),
 *          [data-testid="UserProfileHeader_Items"] (lieu, site…).
 *
 * ⚠ À valider sur le site réel (voir README, « Tests manuels ») : X modifie
 *   régulièrement ses data-testid secondaires (typeaheadResult notamment).
 */
(function () {
  'use strict';
  const G = self.G6S;
  const util = G.util;

  const RESERVED = new Set([
    'home', 'explore', 'notifications', 'messages', 'search', 'i', 'settings', 'compose',
    'login', 'signup', 'tos', 'privacy', 'jobs', 'hashtag', 'intent', 'share', 'account',
    'lists', 'bookmarks', 'communities', 'premium', 'grok', 'download',
  ]);

  /** "/pseudo" ou "/pseudo/with_replies"… → "pseudo" (null si ce n'est pas un profil). */
  function handleFromPath(path) {
    const m = /^\/([A-Za-z0-9_]{1,15})(?:\/(?:with_replies|highlights|media|articles|likes|superfollows))?\/?$/.exec(path);
    return m && !RESERVED.has(m[1].toLowerCase()) ? m[1].toLowerCase() : null;
  }

  G.registerSite({
    id: 'x',
    label: 'X / Twitter',
    hosts: /(^|\.)(x|twitter)\.com$/,

    rules: [
      {
        name: 'post',
        selectors: ['article[data-testid="tweet"]'],
        // Auteur : premier lien du bloc User-Name (le 1er est l'auteur, pas la citation).
        author(el) {
          const a = el.querySelector('[data-testid="User-Name"] a[href^="/"]');
          const id = a && handleFromPath(a.getAttribute('href'));
          return id ? { id, text: '' } : null;
        },
      },
      { name: 'trend', selectors: ['[data-testid="trend"]'] },
      { name: 'user', selectors: ['[data-testid="UserCell"]'] },
      { name: 'notification', selectors: ['article[data-testid="notification"]'] },
      { name: 'suggestion', selectors: ['[data-testid="typeaheadResult"]'], mode: 'collapse' },
    ],

    profile: {
      detect(loc) {
        const id = handleFromPath(loc.pathname);
        return id ? { id } : null;
      },
      // Renvoie null tant que l'en-tête affiché n'est pas celui de CE profil
      // (pendant une navigation SPA, l'ancien profil reste brièvement à l'écran).
      read(info) {
        const name = document.querySelector('[data-testid="UserName"]');
        if (!name || !name.textContent.toLowerCase().includes('@' + info.id)) return null;
        const parts = [name, document.querySelector('[data-testid="UserDescription"]'),
          document.querySelector('[data-testid="UserProfileHeader_Items"]')];
        return parts.filter(Boolean).map((e) => util.extractText(e)).join('\n');
      },
      // Pas de couverture de page sur X : les posts du compte sont masqués un par un.
      cover: null,
    },
  });
})();
