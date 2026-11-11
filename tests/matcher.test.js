/**
 * Tests du moteur de détection. Lancer : node tests/matcher.test.js
 */
'use strict';
const assert = require('assert');
require('../extension/keywords.js');
const matcher = require('../extension/matcher.js');

let passed = 0;
function check(mode, text, expected, custom) {
  matcher.configure({ mode, customKeywords: custom || [] });
  const res = matcher.evaluate(text);
  const got = !!res;
  assert.strictEqual(got, expected, `[${mode}] "${text}" → attendu ${expected}, obtenu ${got} ${res ? res.label : ''}`);
  passed++;
}

// ── Variantes de GTA 6 (les deux modes sont identiques en mode extrême) ──
for (const t of [
  'GTA6', 'gta 6', 'GTA VI', 'G.T.A. 6', 'g-t-a-6', 'GTA-6', 'GTA_6', '#GTA6', '#GTAVI',
  'gtavi', 'Grand Theft Auto 6', 'Grand Theft Auto VI', 'grand theft auto six',
  'GTA 6 trailer', 'le trailer de GTA6!!', 'GTA６', 'GTAⅥ', '#GTA6Leaks', 'gta6leaks',
]) check('extreme', t, true);

// ── Accents / casse ─────────────────────────────────────────────────────
check('extreme', 'LEONIDA', true);
check('extreme', 'Dre\'Quan Priest', true);
check('extreme', 'DreQuan Priest', true);
check('extreme', 'Dre Quan Priest', true);
check('extreme', '#ViceCity', true);
check('extreme', '#JasonDuval', true);
check('extreme', 'Rockstar Games annonce', true);

// ── Extrême : prénoms seuls ─────────────────────────────────────────────
check('extreme', 'Jason est là', true);
check('extreme', 'Lucia', true);

// ── Pas de faux positifs évidents ───────────────────────────────────────
check('extreme', 'GTA 5 est un super jeu', false);
check('extreme', 'GTA V online', false);
check('extreme', 'gta 60 fps', false);
check('extreme', 'gta vice', false);
check('extreme', 'Une recette de gâteau', false);
check('extreme', 'Jasonne et Lucian', false); // mots entiers uniquement

// ── Intermédiaire ───────────────────────────────────────────────────────
check('intermediate', 'GTA 6 sortira en novembre', false);          // pas de spoil
check('intermediate', 'GTA 6 : la fin est incroyable', true);      // fr
check('intermediate', 'GTA 6 ending is wild', true);               // en
check('intermediate', 'GTA 6 muere Lucia al final', true);         // es
check('intermediate', 'GTA 6 finale epico', true);                 // it
check('intermediate', 'GTA 6 Ende ist da', true);                  // de
check('intermediate', 'GTA 6 morre no final', true);               // pt
check('intermediate', 'Jason dies', false);                        // prénom seul
check('intermediate', 'Jason et Lucia dans GTA 6', false);         // gta mais pas de spoil
check('intermediate', 'Jason dies in GTA 6', true);
check('intermediate', 'Cal Hampton meurt', true);                  // perso spécifique + spoil
check('intermediate', 'Jason Duval secret ending', true);
check('intermediate', 'la fin du film', false);                    // spoil sans GTA
check('intermediate', 'Vice City : twist final', true);            // lieu + twist
check('intermediate', 'Rockstar annonce un plot twist', true);

// ── Mots-clés perso : bloquants dans les deux modes ─────────────────────
check('extreme', 'Lester est de retour', true, ['Lester']);
check('intermediate', 'Lester est de retour', true, ['Lester']);
check('intermediate', 'Lester est de retour', false, []);

// ── mentions() : pré-filtre indépendant du mode (utilisé par le secours Facebook) ──
function mentions(mode, text, expected, custom) {
  matcher.configure({ mode, customKeywords: custom || [] });
  assert.strictEqual(matcher.mentions(text), expected, `[${mode}] mentions("${text}") → attendu ${expected}`);
  passed++;
}
for (const mode of ['extreme', 'intermediate']) {
  mentions(mode, 'Le trailer de GTA 6', true);        // même en intermédiaire : sans spoil, mais « mentionné »
  mentions(mode, 'Jason Duval', true);
  mentions(mode, 'Jason', true);                       // prénom ambigu : candidat, la décision finale reste evaluate()
  mentions(mode, '#ViceCityLeaks', true);
  mentions(mode, 'Une recette de tarte', false);
  mentions(mode, 'la fin du film', false);             // un terme de spoil seul n'est pas une mention
  mentions(mode, 'Lester', true, ['Lester']);
}

console.log(`OK — ${passed} vérifications réussies.`);
