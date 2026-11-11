# Mots-clés détectés par GTA 6 Spoiler Shield

> Fichier **généré** par `node Autre/tools/generate-keywords-md.js` à partir de `keywords.js` : il liste la totalité des mots-clés,
> sans exception. Après avoir modifié `keywords.js`, relancez la commande pour le mettre à jour (numéros de ligne compris).
> ➕ = terme ajouté par rapport à la liste de départ du cahier des charges.

**111 mots-clés** dans les listes (hors mots-clés personnalisés et variantes générées automatiquement, voir §5 et §7).

## 1. Vue d'ensemble : quel mode utilise quoi ?

| Catégorie | Nb | Mode extrême | Mode intermédiaire | Défini dans |
| --- | ---: | --- | --- | --- |
| Termes du jeu | 12 | **bloque seul** | compte comme « terme GTA » : bloque **avec un terme de spoil** | `keywords.js` L33-38 |
| Lieux | 10 | **bloque seul** | compte comme « terme GTA » : bloque **avec un terme de spoil** | `keywords.js` L55-58 |
| Personnages « spécifiques » | 10 | **bloque seul** | compte comme « terme GTA » : bloque **avec un terme de spoil** | `keywords.js` L47-51 |
| Personnages « ambigus » (prénoms) | 2 | **bloque seul** | **ignorés** (ne comptent jamais seuls) | `keywords.js` L45 |
| Termes de spoil « forts » (toutes langues) | 30 | non utilisés | **requis** (avec un terme GTA) | `keywords.js` L68-102, détail par langue au §6 |
| Termes de spoil « normaux » (toutes langues) | 47 | non utilisés | **requis** (avec un terme GTA) | idem |
| Mots-clés personnalisés | — | **bloquent seuls** | **bloquent seuls** | popup → `chrome.storage.sync` (pas de fichier) |

Règle de décision : `matcher.js` L130 (fonction `compute`). Le terme doit être un **mot entier** (« Jason » ne déclenche pas « Jasonne »).
Un terme de spoil seul (ex. « la fin du film ») ne bloque **jamais**, quel que soit le mode.

## 2. Termes du jeu

Défini dans `keywords.js` L33-38. **Extrême** : bloque seul. **Intermédiaire** : avec un terme de spoil.

`GTA 6` · `GTA VI` · `GTA6` · `GTAVI` · `Grand Theft Auto 6` · `Grand Theft Auto VI` · `GrandTheftAutoVI` · `Grand Theft Auto` · `Rockstar Games` · `Rockstar` · `#GTA6` · `#GTAVI`

Toutes les graphies de GTA 6 sont ramenées à un même jeton par la normalisation (§7) : `GTA6`, `GTA 6`, `GTA-6`, `GTA_6`, `G.T.A. 6`, `GTA VI`, `GTAVI`, `#GTA6`, `Grand Theft Auto Six`… sont toutes reconnues.

## 3. Personnages

**Ambigus** — `keywords.js` L45. **Extrême** : bloquent seuls. **Intermédiaire** : ignorés (ils ne comptent qu'accompagnés d'un autre terme GTA, mais n'ouvrent jamais le blocage à eux seuls).

`Jason` · `Lucia`

**Spécifiques** (noms propres au jeu) — `keywords.js` L47-51. **Extrême** : bloquent seuls. **Intermédiaire** : comptent comme termes GTA (bloquent avec un terme de spoil).

`Jason Duval` · `Lucia Caminos` · `Cal Hampton` · `Boobie Ike` · `Dre'Quan Priest` · `Dre Quan Priest` ➕ · `DreQuan Priest` ➕ · `Real Dimez` · `Raul Bautista` · `Brian Heder`

## 4. Lieux

Défini dans `keywords.js` L55-58. **Extrême** : bloque seul. **Intermédiaire** : avec un terme de spoil.

`Leonida` · `Vice City` · `Leonida Keys` · `Grassrivers` · `Grass Rivers` ➕ · `Port Gellhorn` · `Ambrosia` · `Mount Kalaga` · `Ocean Beach` · `Little Cuba`

## 5. Mots-clés personnalisés

Saisis dans la popup (champ « Mots-clés personnalisés »), stockés dans `chrome.storage.sync` (clé `customKeywords`), donc **pas dans un fichier**. Ils bloquent seuls dans **les deux modes**. Compilés dans `matcher.js` L117 (`configure`).

> La **liste blanche de comptes** (popup → onglet « Liste blanche ») est indépendante des mots-clés : elle ne contient que des comptes, jamais des mots, et ne modifie aucune de ces listes. Voir [README_MAX.md](README_MAX.md).

## 6. Termes de spoil, par langue

Utilisés **uniquement en mode intermédiaire**, où ils doivent apparaître dans le même contenu qu'un terme GTA (jeu, lieu ou personnage spécifique).
« Fort » et « normal » ont aujourd'hui le **même effet** (un seul terme suffit) : la distinction sert à l'affichage (les termes forts sont cherchés en premier pour le libellé « Détecté : … ») et prépare d'éventuelles règles futures.

### Français (`fr`)

- **Forts** — `keywords.js` L68-72 : `fin secrète` · `choix final` · `dernier choix` · `dernière mission` · `boss final` · `twist` · `retournement` · `spoil` · `spoils` ➕ · `divulgâcheur` · `divulgâcheurs` ➕
- **Normaux** — `keywords.js` L73-76 : `fin` · `fins` ➕ · `fin du jeu` · `mort` · `meurt` · `décès` · `deces` · `tué` · `tue` · `révélation` · `trahison`

### Anglais (`en`)

- **Forts** — `keywords.js` L79-82 : `secret ending` · `final choice` · `last mission` · `final mission` · `final boss` · `plot twist` · `spoiler` · `spoilers`
- **Normaux** — `keywords.js` L83-86 : `ending` · `endings` ➕ · `ends` · `end game` · `dies` · `death` · `dead` · `killed` · `betrayal` · `reveal`

### Espagnol (`es`)

- **Forts** — `keywords.js` L89 : `elección final` · `última misión` · `spoiler`
- **Normaux** — `keywords.js` L90 : `final` · `muere` · `muerte` · `muerto` · `giro` · `traición` · `revelación`

### Italien (`it`)

- **Forts** — `keywords.js` L93 : `scelta finale` · `ultima missione` · `colpo di scena`
- **Normaux** — `keywords.js` L94 : `finale` · `muore` · `morte` · `morto` · `tradimento` · `rivelazione`

### Allemand (`de`)

- **Forts** — `keywords.js` L97 : `letzte Mission` · `Endkampf`
- **Normaux** — `keywords.js` L98 : `Ende` · `stirbt` · `Tod` · `tot` · `Wendung` · `Verrat` · `Enthüllung`

### Portugais (`pt`)

- **Forts** — `keywords.js` L101 : `escolha final` · `última missão` · `reviravolta`
- **Normaux** — `keywords.js` L102 : `final` · `morre` · `morte` · `morto` · `traição` · `revelação`

## 7. Variantes reconnues automatiquement (non listées dans keywords.js)

Le texte est **normalisé** avant comparaison (`matcher.js` L32, `normalize`) : minuscules, accents supprimés, ponctuation remplacée par des espaces, comparaison en mots entiers. De plus :

- **GTA 6** (`matcher.js` L23-26) : `GTA` ou `G.T.A.` (séparateurs tolérés : espace, point, tiret, tiret bas, jusqu'à 2 caractères) suivi de `6`, `VI`, `six`, `seis` ou `sechs`. Idem pour `Grand Theft Auto`. Pas de faux positif sur `GTA 60`, `GTA V`, `GTA Vice`.
- **Chiffres et lettres exotiques** : `GTA６` (chiffre pleine chasse), `GTAⅥ` (chiffre romain Unicode) via la normalisation Unicode NFKD.
- **Apostrophes** (`matcher.js` L52, `compile`) : chaque terme avec apostrophe est aussi cherché sans (« Dre'Quan » → « DreQuan »).
- **Hashtags collés** (`matcher.js` L99, `hashtagExtras`) : les termes à plusieurs mots sont reconnus collés dans un hashtag, avec ou sans suite (`#ViceCityLeaks`) :

  - `#grandtheftauto` (jeu « Grand Theft Auto »)
  - `#rockstargames` (jeu « Rockstar Games »)
  - `#vicecity` (lieu « Vice City »)
  - `#leonidakeys` (lieu « Leonida Keys »)
  - `#grassrivers` (lieu « Grass Rivers »)
  - `#portgellhorn` (lieu « Port Gellhorn »)
  - `#mountkalaga` (lieu « Mount Kalaga »)
  - `#oceanbeach` (lieu « Ocean Beach »)
  - `#littlecuba` (lieu « Little Cuba »)
  - `#jasonduval` (personnage « Jason Duval »)
  - `#luciacaminos` (personnage « Lucia Caminos »)
  - `#calhampton` (personnage « Cal Hampton »)
  - `#boobieike` (personnage « Boobie Ike »)
  - `#drequanpriest` (personnage « Dre'Quan Priest »)
  - `#realdimez` (personnage « Real Dimez »)
  - `#raulbautista` (personnage « Raul Bautista »)
  - `#brianheder` (personnage « Brian Heder »)

- **Hashtags simples** : `#GTA6`, `#Leonida`… = le terme sans `#` (le `#` est de la ponctuation).

## 8. Ajouter un mot ou une langue

**Ajouter un mot**
1. Ouvrez `keywords.js` et ajoutez-le (avec ou sans accents, majuscules libres) dans la bonne liste : `game`, `characters.ambiguous` / `characters.specific`, `places`, ou `spoilTerms.<langue>.strong` / `.normal`.
2. Rechargez l'extension (↻ dans `chrome://extensions`) puis les onglets ouverts. Aucune autre modification : la normalisation et les variantes sont automatiques.
3. Sans toucher au code : ajoutez-le comme **mot-clé personnalisé** dans la popup (bloque dans les deux modes).

**Ajouter une langue de spoil** (ex. néerlandais) : dans `spoilTerms` de `keywords.js`, copiez un bloc et changez la clé :

```js
nl: {
  strong: ['geheim einde', 'plotwending', 'spoiler'],
  normal: ['einde', 'sterft', 'dood', 'verraad'],
},
```

Rien d'autre à modifier : `matcher.js` parcourt toutes les clés de `spoilTerms`. Pour que ce fichier-ci reflète le changement : `node Autre/tools/generate-keywords-md.js`.
