/**
 * Tests de whitelist.js : identifiants, URL, sécurité. Lancer : node tests/whitelist.test.js
 */
'use strict';
const assert = require('assert');
const W = require('../../extension/whitelist.js');
let n = 0;
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

const B = 'https://www.x.com/';
// ── Extraction depuis des href ──────────────────────────────────────────
eq(W.idFromHref('x', '/RockstarGames', B), 'rockstargames');
eq(W.idFromHref('x', 'https://x.com/RockstarGames?s=20', B), 'rockstargames');
eq(W.idFromHref('x', 'https://twitter.com/RockstarGames/', B), 'rockstargames');
eq(W.idFromHref('x', '/RockstarGames/status/123', B), null, 'lien de tweet ≠ profil');
eq(W.idFromHref('x', '/home', B), null);
eq(W.idFromHref('x', 'https://example.com/RockstarGames', B), null, 'domaine étranger refusé');
eq(W.idFromHref('x', 'https://x.com.evil.com/RockstarGames', B), null, 'faux domaine refusé');
eq(W.idFromHref('youtube', '/@RockstarGames', 'https://www.youtube.com/'), 'rockstargames');
eq(W.idFromHref('youtube', '/@RockstarGames/videos', 'https://www.youtube.com/'), 'rockstargames');
eq(W.idFromHref('youtube', '/channel/UC6VcWc1rAoWdBCM0JxrRQ3A', 'https://www.youtube.com/'), 'uc6vcwc1raowdbcm0jxrrq3a');
eq(W.idFromHref('youtube', '/watch?v=abc', 'https://www.youtube.com/'), null);
eq(W.idFromHref('youtube', '/user/rockstar', 'https://www.youtube.com/'), null, 'ancien format non résoluble');
eq(W.idFromHref('tiktok', '/@RockstarGames', 'https://www.tiktok.com/'), 'rockstargames');
eq(W.idFromHref('tiktok', '/@a/video/123', 'https://www.tiktok.com/'), null);
eq(W.idFromHref('instagram', '/rockstargames/', 'https://www.instagram.com/'), 'rockstargames');
eq(W.idFromHref('instagram', '/p/abc/', 'https://www.instagram.com/'), null);
eq(W.idFromHref('instagram', '/explore/', 'https://www.instagram.com/'), null);
eq(W.idFromHref('facebook', 'https://www.facebook.com/RockstarGames?__cft__[0]=AZh9&__tn__=-]K-R', 'https://www.facebook.com/'), 'rockstargames');
eq(W.idFromHref('facebook', '/profile.php?id=100012345678', 'https://www.facebook.com/'), 'id:100012345678');
eq(W.idFromHref('facebook', 'https://www.facebook.com/people/Restless-Planet/615952409105', 'https://www.facebook.com/'), null);
eq(W.idFromHref('facebook', 'https://www.facebook.com/NASA/posts/pfbid0295', 'https://www.facebook.com/'), null);
eq(W.idFromHref('reddit', '/user/RockstarGames/', 'https://www.reddit.com/'), 'u/rockstargames');
eq(W.idFromHref('reddit', '/u/spez', 'https://www.reddit.com/'), 'u/spez');
eq(W.idFromHref('reddit', '/r/GTA6/', 'https://www.reddit.com/'), 'r/gta6');
eq(W.idFromHref('reddit', 'javascript:alert(1)', 'https://www.reddit.com/'), null);

// ── Normalisation ───────────────────────────────────────────────────────
eq(W.normalizeId('x', '@RockstarGames/'), 'rockstargames');
eq(W.normalizeId('x', 'a b'), null);
eq(W.normalizeId('youtube', '@RockstarGames?x=1'), 'rockstargames');
eq(W.normalizeId('youtube', 'UC6VcWc1rAoWdBCM0JxrRQ3A'), 'uc6vcwc1raowdbcm0jxrrq3a');
eq(W.normalizeId('reddit', 'spez'), 'u/spez');
eq(W.normalizeId('reddit', '/R/GTA6/'), 'r/gta6');

// ── Saisie de la popup ──────────────────────────────────────────────────
eq(W.parseInput('https://x.com/RockstarGames'), { platform: 'x', id: 'rockstargames' });
eq(W.parseInput('twitter.com/RockstarGames'), { platform: 'x', id: 'rockstargames' });
eq(W.parseInput('https://www.youtube.com/@RockstarGames'), { platform: 'youtube', id: 'rockstargames' });
eq(W.parseInput('https://www.youtube.com/channel/UC6VcWc1rAoWdBCM0JxrRQ3A'), { platform: 'youtube', id: 'uc6vcwc1raowdbcm0jxrrq3a' });
eq(W.parseInput('https://www.tiktok.com/@rockstargames?lang=fr'), { platform: 'tiktok', id: 'rockstargames' });
eq(W.parseInput('https://www.instagram.com/rockstargames/'), { platform: 'instagram', id: 'rockstargames' });
eq(W.parseInput('https://www.facebook.com/RockstarGames'), { platform: 'facebook', id: 'rockstargames' });
eq(W.parseInput('https://www.reddit.com/user/RockstarGames'), { platform: 'reddit', id: 'u/rockstargames' });
eq(W.parseInput('@RockstarGames', 'x'), { platform: 'x', id: 'rockstargames' });
eq(typeof W.parseInput('@RockstarGames').error, 'string', '@handle sans plateforme = erreur');
eq(typeof W.parseInput('https://example.com/foo').error, 'string');
eq(typeof W.parseInput('https://www.youtube.com/c/Rockstar').error, 'string');

// ── Décision d'autorisation ─────────────────────────────────────────────
const wl = W.sanitize({ x: ['RockstarGames'], youtube: ['@rockstargames'] });
eq(wl.x, ['rockstargames']);
eq(W.isAllowed(wl, 'x', ['rockstargames']), true);
eq(W.isAllowed(wl, 'x', ['rockstargamez']), false, 'faux compte, autre handle');
eq(W.isAllowed(wl, 'x', []), false, 'auteur introuvable');
eq(W.isAllowed(wl, 'tiktok', ['rockstargames']), false, 'autre plateforme');
eq(W.isAllowed(wl, 'youtube', ['uc6vcwc1raowdbcm0jxrrq3a']), false, 'UC non encore relié au handle');
const al = {};
eq(W.addAlias(al, 'youtube', 'rockstargames', 'uc6vcwc1raowdbcm0jxrrq3a'), true);
eq(W.isAllowed(wl, 'youtube', ['uc6vcwc1raowdbcm0jxrrq3a'], al), true, 'UC reconnu après apprentissage');
eq(W.isAllowed(wl, 'youtube', ['uc000000000000000000000x'], al), false);
eq(W.isAllowed(null, 'x', ['a']), false);
eq(W.sanitize({ x: ['ok', 'pas valide!!', 5, null], bogus: ['a'] }).x, ['ok']);
eq(W.count(W.sanitize({ x: Array.from({ length: 300 }, (_, i) => 'u' + i) })), W.MAX_ACCOUNTS, 'plafond');

console.log(`OK — ${n} vérifications whitelist réussies.`);
