/**
 * sites/reddit.js — Reddit (nouveau design « shreddit » + old.reddit.com)
 *
 * SÉLECTEURS CHOISIS (balises personnalisées et attributs, pas de classes) :
 *   shreddit-post                         post (fil, page d'un post, résultats). Attributs lus :
 *                                         post-title, subreddit-prefixed-name (r/GTA6), author.
 *                                         Le flair, le corps et l'aperçu de lien sont dans son DOM.
 *   shreddit-comment                      commentaire. Son texte est dans l'enfant [slot="comment"] ;
 *                                         les réponses sont d'AUTRES <shreddit-comment> imbriqués
 *                                         → on ne masque que [slot="comment"], pas les réponses.
 *   a[data-testid="post-title"]           résultats de recherche (meilleur effort, voir find()).
 * old.reddit.com :
 *   .thing.link / .thing.comment          post / commentaire ; réponses dans .child (ignorées).
 *
 * Les <shreddit-*> ont un shadow root OUVERT : l'overlay y est inséré (cf. content.js).
 * ⚠ À valider sur le site réel (voir README_MAX.md).
 */
(function () {
  'use strict';
  const G = self.G6S;
  const util = G.util;
  const W = G.whitelist;

  // ── Liste blanche ──
  // Reddit n'expose pas de lien d'auteur dans le DOM d'un post : on lit l'attribut `author` (le NOM
  // D'UTILISATEUR, unique — pas un nom affiché modifiable) et `subreddit-prefixed-name` (r/xxx).
  // Relevé sur le site réel : author=PapaXan, subreddit-prefixed-name=r/gtaonline.
  function redditIdentify(el, withSub) {
    const a = el.getAttribute('author');
    const user = a && W.normalizeId('reddit', 'u/' + a);
    if (!user) return null;
    const who = { platform: 'reddit', ids: [user] };
    if (withSub) {
      const sub = W.normalizeId('reddit', el.getAttribute('subreddit-prefixed-name') || '');
      if (sub && sub.startsWith('r/')) who.alt = [sub]; // sous-reddit autorisé (option) : comparaison seulement
    }
    return who;
  }

  const attr = (el, name) => el.getAttribute(name) || '';

  G.registerSite({
    id: 'reddit',
    label: 'Reddit',
    hosts: /(^|\.)reddit\.com$/,

    rules: [
      {
        name: 'post',
        selectors: ['shreddit-post'],
        identify: (el) => redditIdentify(el, true),
        // Crosspost : le contenu d'un autre auteur est dans le post et ne peut pas être isolé → reste bloqué.
        parts: (el) => (el.getAttribute('post-type') === 'crosspost' || el.querySelector('shreddit-post') ? false : []),
        text(el) {
          return [attr(el, 'post-title'), attr(el, 'subreddit-prefixed-name'), attr(el, 'author'),
            util.extractText(el)].join('\n');
        },
      },
      {
        name: 'comment',
        selectors: ['shreddit-comment'],
        identify: (el) => redditIdentify(el, false),
        target(el) { return el.querySelector(':scope > [slot="comment"]') || el; },
        text(el) {
          const body = el.querySelector(':scope > [slot="comment"]');
          return attr(el, 'author') + '\n' +
            (body ? util.extractText(body) : util.extractText(el, { skip: 'shreddit-comment' }));
        },
      },
      {
        // Résultats de recherche : conteneur = <search-telemetry-tracker> le plus proche du titre.
        name: 'search-result',
        find() {
          const out = [];
          for (const a of document.querySelectorAll('a[data-testid="post-title"]')) {
            if (a.closest('shreddit-post')) continue;
            const box = a.closest('search-telemetry-tracker');
            if (box) out.push(box);
          }
          return out;
        },
      },
      // ── old.reddit.com ──
      {
        name: 'old-post',
        selectors: ['.thing.link'],
        text(el) { return util.extractText(el, { skip: '.child' }); },
      },
      {
        name: 'old-comment',
        selectors: ['.thing.comment'],
        target(el) { return el.querySelector(':scope > .entry') || el; },
        text(el) { return util.extractText(el, { skip: '.child' }); },
      },
    ],
  });
})();
