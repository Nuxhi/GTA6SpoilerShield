/**
 * Génère KEYWORDS.md (à la racine) à partir de keywords.js et matcher.js :
 * la liste est donc TOUJOURS complète et les numéros de ligne exacts.
 *
 * Usage (après avoir modifié keywords.js) :   node tools/generate-keywords-md.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXT = path.join(ROOT, 'extension');
require(path.join(EXT, 'keywords.js'));
const matcher = require(path.join(EXT, 'matcher.js'));
const K = globalThis.G6S.KEYWORDS;

const kwLines = fs.readFileSync(path.join(EXT, 'keywords.js'), 'utf8').split('\n');
const mtLines = fs.readFileSync(path.join(EXT, 'matcher.js'), 'utf8').split('\n');

// ── Repérage des lignes ────────────────────────────────────────────────
function findLine(lines, re, from) {
  for (let i = from || 0; i < lines.length; i++) if (re.test(lines[i])) return i + 1;
  return null;
}
/** Plage de lignes du tableau qui s'ouvre sur la ligne `startLine` (1-based). */
function arrayRange(lines, startLine) {
  let depth = 0, started = false;
  for (let i = startLine - 1; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '[') { depth++; started = true; }
      if (ch === ']') depth--;
    }
    if (started && depth === 0) return [startLine, i + 1];
  }
  return [startLine, startLine];
}
const fmt = ([a, b]) => (a === b ? `L${a}` : `L${a}-${b}`);
const ref = (file, range) => `\`${file}\` ${fmt(range)}`;

const loc = {};
loc.game = arrayRange(kwLines, findLine(kwLines, /^\s*game:\s*\[/));
loc.ambiguous = arrayRange(kwLines, findLine(kwLines, /^\s*ambiguous:\s*\[/));
loc.specific = arrayRange(kwLines, findLine(kwLines, /^\s*specific:\s*\[/));
loc.places = arrayRange(kwLines, findLine(kwLines, /^\s*places:\s*\[/));
loc.spoil = {};
for (const lang of Object.keys(K.spoilTerms)) {
  const langLine = findLine(kwLines, new RegExp('^\\s*' + lang + ':\\s*\\{'), findLine(kwLines, /spoilTerms:/));
  loc.spoil[lang] = {
    strong: arrayRange(kwLines, findLine(kwLines, /^\s*strong:\s*\[/, langLine - 1)),
    normal: arrayRange(kwLines, findLine(kwLines, /^\s*normal:\s*\[/, langLine - 1)),
  };
}
const mt = {
  normalize: findLine(mtLines, /^\s*function normalize\(/),
  gtaRe: findLine(mtLines, /^\s*const GTA6_RE\s*=/),
  gtaLong: findLine(mtLines, /^\s*const GTA6_LONG_RE\s*=/),
  sep: findLine(mtLines, /^\s*const SEP\s*=/),
  tail: findLine(mtLines, /^\s*const TAIL\s*=/),
  compile: findLine(mtLines, /^\s*function compile\(/),
  hashtag: findLine(mtLines, /^\s*function hashtagExtras\(/),
  compute: findLine(mtLines, /^\s*function compute\(/),
  configure: findLine(mtLines, /^\s*function configure\(/),
};

// Ajouts par rapport à la liste d'origine du cahier des charges (marqués ➕).
const ADDED = new Set([
  'fr:fins', 'fr:spoils', 'fr:divulgâcheurs', 'en:endings',
  'place:Grass Rivers', 'specific:Dre Quan Priest', 'specific:DreQuan Priest',
]);
const code = (t, key) => '`' + t + '`' + (ADDED.has(key + t) || ADDED.has(key + ':' + t) ? ' ➕' : '');
const list = (arr, key) => arr.map((t) => code(t, key)).join(' · ');

// ── Formes de hashtag collé (#ViceCity…) ───────────────────────────────
const squash = (s) => s.normalize('NFKD').toLowerCase().replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, '');
const squashed = [];
const seenSquash = new Set();
for (const [label, arr] of [['jeu', K.game], ['lieu', K.places], ['personnage', K.characters.specific]]) {
  for (const t of arr) {
    const key = squash(t);
    if (matcher.normalize(t).trim().includes(' ') && !seenSquash.has(key)) {
      seenSquash.add(key); // plusieurs graphies d'un même terme donnent la même forme collée
      squashed.push(`\`#${key}\` (${label} « ${t} »)`);
    }
  }
}

// ── Compte ─────────────────────────────────────────────────────────────
const LANG = { fr: 'Français', en: 'Anglais', es: 'Espagnol', it: 'Italien', de: 'Allemand', pt: 'Portugais' };
let nStrong = 0, nNormal = 0;
for (const l of Object.values(K.spoilTerms)) { nStrong += l.strong.length; nNormal += l.normal.length; }
const total = K.game.length + K.characters.ambiguous.length + K.characters.specific.length + K.places.length + nStrong + nNormal;

// ── Rédaction ──────────────────────────────────────────────────────────
const out = [];
const p = (s) => out.push(s === undefined ? '' : s);

p('# Mots-clés détectés par GTA 6 Spoiler Shield');
p();
p('> Fichier **généré** par `node tools/generate-keywords-md.js` à partir de `keywords.js` : il liste la totalité des mots-clés,');
p('> sans exception. Après avoir modifié `keywords.js`, relancez la commande pour le mettre à jour (numéros de ligne compris).');
p('> ➕ = terme ajouté par rapport à la liste de départ du cahier des charges.');
p();
p(`**${total} mots-clés** dans les listes (hors mots-clés personnalisés et variantes générées automatiquement, voir §5 et §7).`);
p();

p('## 1. Vue d\'ensemble : quel mode utilise quoi ?');
p();
p('| Catégorie | Nb | Mode extrême | Mode intermédiaire | Défini dans |');
p('| --- | ---: | --- | --- | --- |');
p(`| Termes du jeu | ${K.game.length} | **bloque seul** | compte comme « terme GTA » : bloque **avec un terme de spoil** | ${ref('keywords.js', loc.game)} |`);
p(`| Lieux | ${K.places.length} | **bloque seul** | compte comme « terme GTA » : bloque **avec un terme de spoil** | ${ref('keywords.js', loc.places)} |`);
p(`| Personnages « spécifiques » | ${K.characters.specific.length} | **bloque seul** | compte comme « terme GTA » : bloque **avec un terme de spoil** | ${ref('keywords.js', loc.specific)} |`);
p(`| Personnages « ambigus » (prénoms) | ${K.characters.ambiguous.length} | **bloque seul** | **ignorés** (ne comptent jamais seuls) | ${ref('keywords.js', loc.ambiguous)} |`);
const spoilFirst = loc.spoil[Object.keys(K.spoilTerms)[0]].strong[0];
const spoilLast = loc.spoil[Object.keys(K.spoilTerms).pop()].normal[1];
p(`| Termes de spoil « forts » (toutes langues) | ${nStrong} | non utilisés | **requis** (avec un terme GTA) | ${ref('keywords.js', [spoilFirst, spoilLast])}, détail par langue au §6 |`);
p(`| Termes de spoil « normaux » (toutes langues) | ${nNormal} | non utilisés | **requis** (avec un terme GTA) | idem |`);
p('| Mots-clés personnalisés | — | **bloquent seuls** | **bloquent seuls** | popup → `chrome.storage.sync` (pas de fichier) |');
p();
p('Règle de décision : `matcher.js` ' + `L${mt.compute}` + ' (fonction `compute`). Le terme doit être un **mot entier** (« Jason » ne déclenche pas « Jasonne »).');
p('Un terme de spoil seul (ex. « la fin du film ») ne bloque **jamais**, quel que soit le mode.');
p();

p('## 2. Termes du jeu');
p();
p(`Défini dans ${ref('keywords.js', loc.game)}. **Extrême** : bloque seul. **Intermédiaire** : avec un terme de spoil.`);
p();
p(list(K.game, 'game'));
p();
p('Toutes les graphies de GTA 6 sont ramenées à un même jeton par la normalisation (§7) : `GTA6`, `GTA 6`, `GTA-6`, `GTA_6`, `G.T.A. 6`, `GTA VI`, `GTAVI`, `#GTA6`, `Grand Theft Auto Six`… sont toutes reconnues.');
p();

p('## 3. Personnages');
p();
p(`**Ambigus** — ${ref('keywords.js', loc.ambiguous)}. **Extrême** : bloquent seuls. **Intermédiaire** : ignorés (ils ne comptent qu'accompagnés d'un autre terme GTA, mais n'ouvrent jamais le blocage à eux seuls).`);
p();
p(list(K.characters.ambiguous, 'ambiguous'));
p();
p(`**Spécifiques** (noms propres au jeu) — ${ref('keywords.js', loc.specific)}. **Extrême** : bloquent seuls. **Intermédiaire** : comptent comme termes GTA (bloquent avec un terme de spoil).`);
p();
p(list(K.characters.specific, 'specific'));
p();

p('## 4. Lieux');
p();
p(`Défini dans ${ref('keywords.js', loc.places)}. **Extrême** : bloque seul. **Intermédiaire** : avec un terme de spoil.`);
p();
p(list(K.places, 'place'));
p();

p('## 5. Mots-clés personnalisés');
p();
p('Saisis dans la popup (champ « Mots-clés personnalisés »), stockés dans `chrome.storage.sync` (clé `customKeywords`), donc **pas dans un fichier**. Ils bloquent seuls dans **les deux modes**. Compilés dans `matcher.js` ' + `L${mt.configure}` + ' (`configure`).');
p();

p('> La **liste blanche de comptes** (popup → onglet « Liste blanche ») est indépendante des mots-clés : elle ne contient que des comptes, jamais des mots, et ne modifie aucune de ces listes. Voir [README_MAX.md](README_MAX.md).');
p();
p('## 6. Termes de spoil, par langue');
p();
p('Utilisés **uniquement en mode intermédiaire**, où ils doivent apparaître dans le même contenu qu\'un terme GTA (jeu, lieu ou personnage spécifique).');
p('« Fort » et « normal » ont aujourd\'hui le **même effet** (un seul terme suffit) : la distinction sert à l\'affichage (les termes forts sont cherchés en premier pour le libellé « Détecté : … ») et prépare d\'éventuelles règles futures.');
p();
for (const lang of Object.keys(K.spoilTerms)) {
  const t = K.spoilTerms[lang];
  p(`### ${LANG[lang] || lang} (\`${lang}\`)`);
  p();
  p(`- **Forts** — ${ref('keywords.js', loc.spoil[lang].strong)} : ${list(t.strong, lang + ':')}`);
  p(`- **Normaux** — ${ref('keywords.js', loc.spoil[lang].normal)} : ${list(t.normal, lang + ':')}`);
  p();
}

p('## 7. Variantes reconnues automatiquement (non listées dans keywords.js)');
p();
p('Le texte est **normalisé** avant comparaison (`matcher.js` ' + `L${mt.normalize}` + ', `normalize`) : minuscules, accents supprimés, ponctuation remplacée par des espaces, comparaison en mots entiers. De plus :');
p();
p(`- **GTA 6** (\`matcher.js\` L${mt.sep}-${mt.gtaLong}) : \`GTA\` ou \`G.T.A.\` (séparateurs tolérés : espace, point, tiret, tiret bas, jusqu'à 2 caractères) suivi de \`6\`, \`VI\`, \`six\`, \`seis\` ou \`sechs\`. Idem pour \`Grand Theft Auto\`. Pas de faux positif sur \`GTA 60\`, \`GTA V\`, \`GTA Vice\`.`);
p('- **Chiffres et lettres exotiques** : `GTA６` (chiffre pleine chasse), `GTAⅥ` (chiffre romain Unicode) via la normalisation Unicode NFKD.');
p(`- **Apostrophes** (\`matcher.js\` L${mt.compile}, \`compile\`) : chaque terme avec apostrophe est aussi cherché sans (« Dre'Quan » → « DreQuan »).`);
p(`- **Hashtags collés** (\`matcher.js\` L${mt.hashtag}, \`hashtagExtras\`) : les termes à plusieurs mots sont reconnus collés dans un hashtag, avec ou sans suite (\`#ViceCityLeaks\`) :`);
p();
for (const s of squashed) p('  - ' + s);
p();
p('- **Hashtags simples** : `#GTA6`, `#Leonida`… = le terme sans `#` (le `#` est de la ponctuation).');
p();

p('## 8. Ajouter un mot ou une langue');
p();
p('**Ajouter un mot**');
p('1. Ouvrez `keywords.js` et ajoutez-le (avec ou sans accents, majuscules libres) dans la bonne liste : `game`, `characters.ambiguous` / `characters.specific`, `places`, ou `spoilTerms.<langue>.strong` / `.normal`.');
p('2. Rechargez l\'extension (↻ dans `chrome://extensions`) puis les onglets ouverts. Aucune autre modification : la normalisation et les variantes sont automatiques.');
p('3. Sans toucher au code : ajoutez-le comme **mot-clé personnalisé** dans la popup (bloque dans les deux modes).');
p();
p('**Ajouter une langue de spoil** (ex. néerlandais) : dans `spoilTerms` de `keywords.js`, copiez un bloc et changez la clé :');
p();
p('```js');
p('nl: {');
p("  strong: ['geheim einde', 'plotwending', 'spoiler'],");
p("  normal: ['einde', 'sterft', 'dood', 'verraad'],");
p('},');
p('```');
p();
p('Rien d\'autre à modifier : `matcher.js` parcourt toutes les clés de `spoilTerms`. Pour que ce fichier-ci reflète le changement : `node tools/generate-keywords-md.js`.');
p();

fs.writeFileSync(path.join(ROOT, 'KEYWORDS.md'), out.join('\n'), 'utf8');
console.log(`KEYWORDS.md généré : ${total} mots-clés listés.`);
