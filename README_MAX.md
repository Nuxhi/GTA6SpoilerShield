# GTA 6 Spoiler Shield

Extension Chrome (Manifest V3) qui **masque automatiquement tout contenu pouvant spoiler Grand Theft Auto VI** (sortie le 19 novembre 2026) : X/Twitter, Reddit, YouTube (Shorts inclus), TikTok, Instagram, Facebook, Google (résultats, aperçus IA, annonces…) et, en repli générique, n'importe quel autre site.

- Interface en français, mots-clés détectés en 6 langues (fr, en, es, it, de, pt).
- JavaScript vanilla, **aucune dépendance**, **aucune donnée envoyée sur Internet** : tout est traité localement.

---

## Installation (mode développeur)

1. Ouvrez `chrome://extensions`.
2. Activez **Mode développeur** (en haut à droite).
3. Cliquez **Charger l'extension non empaquetée** et choisissez le dossier `extension/` (celui qui contient `manifest.json`).
4. Épinglez l'icône « 6 » dans la barre d'outils pour accéder à la popup.
5. **Rechargez les onglets déjà ouverts** : l'extension ne s'injecte que dans les pages chargées après son installation.

Pour mettre à jour après une modification du code (ex. `keywords.js`) : bouton ↻ sur la carte de l'extension dans `chrome://extensions`, puis rechargez les onglets.

> Les sites Google Workspace (Gmail, Docs, Drive, Agenda, Meet, compte Google) sont exclus dans le manifeste.

---

## Utilisation

Quand un contenu correspond, **le post entier** (pas seulement le mot) est recouvert d'un écran noir : « Contenu lié à GTA 6 – spoil possible », avec en petit le terme détecté et sa catégorie (jeu, lieu, personnage, mot-clé perso, spoil).

| Bouton | Effet |
| --- | --- |
| **Afficher quand même** | Lance un **compte à rebours** (5 s par défaut) : le bouton affiche « Affichage dans 5… 4… 3… ». À la fin, le contenu est révélé (le son/la lecture reprennent). Le bouton **Annuler** arrête le décompte. |
| **Garder masqué** | Conserve le masquage et simplifie l'écran (un petit bouton « Afficher », avec le même décompte, reste disponible). |

Le décompte est **annulé automatiquement** si le contenu sort de l'écran, si l'onglet passe en arrière-plan ou si la page change (navigation). La durée se règle dans la popup (0 à 30 s, 0 = affichage immédiat) ; la valeur par défaut est la constante `revealDelay` de `DEFAULT_SETTINGS` dans `keywords.js` (et `background.js` / `popup.js`).

Les vidéos masquées (YouTube, Shorts, Reels, TikTok, vidéos d'un post…) sont **mises en pause et coupées en son** tant qu'elles sont masquées, pour éviter un spoil audio.

### Popup

- **Interrupteur** on/off global.
- **Mode** : Extrême / Intermédiaire (sauvegardé dans `chrome.storage.sync`).
- **Compteurs** : bloqués sur la page courante (aussi affiché en badge sur l'icône) et au total.
- **Délai avant affichage** : durée du compte à rebours (voir plus haut).
- **Mots-clés personnalisés** : masquent le contenu dans les deux modes.
- **Thème** : « Vice City (clair) » (par défaut), « Sombre (noir et rouge) » ou « Sunset (style du site) », sauvegardé dans `chrome.storage.sync`. Ne change pas l'écran noir anti-spoil, qui reste toujours opaque.

### Thèmes de la popup

Les couleurs sont des **variables CSS** (`popup.css` n'en contient aucune en dur). Un fichier par thème :
`themes/theme-vicecity.css` (clair, rose néon / orange / violet / turquoise, contrastes AA vérifiés), `themes/theme-dark.css` (l'ancien thème, à l'identique) et `themes/theme-sunset.css` (direction artistique du site : bandeau coucher de soleil, police Archivo embarquée dans `fonts/`, cartes arrondies ; ce thème change aussi la mise en page : popup de 400 px, plus d'espace, le tout limité à `:root[data-theme="sunset"]`). L'ancienne feuille de style, l'ancien HTML et l'ancien JS de la popup sont conservés tels quels dans `themes/backup/`. Pour créer un thème : copier `theme-dark.css`, changer le sélecteur `:root[data-theme="…"]` et les valeurs, l'ajouter dans `popup.html` et dans la liste `<select id="theme">`, puis dans la liste `THEMES` de `popup.js` et la liste `themes` de `theme-init.js`.

### Les deux modes

| | Extrême (par défaut) | Intermédiaire |
| --- | --- | --- |
| Terme du jeu (GTA 6, Rockstar…), lieu, personnage « spécifique » (Jason Duval, Cal Hampton…) | **bloque** | bloque **seulement avec un terme de spoil** dans le même contenu |
| « Jason » ou « Lucia » seuls | **bloque** | ne bloque pas (ils ne comptent qu'accompagnés d'un autre terme GTA) |
| Terme de spoil seul (« la fin du film ») | ne bloque pas | ne bloque pas |
| Mot-clé personnalisé | bloque | bloque |

Précisions d'interprétation (modifiables dans `matcher.js`, fonction `compute`) :
- En intermédiaire, les noms de personnages **propres au jeu** (Jason Duval, Lucia Caminos, Cal Hampton, Boobie Ike, Dre'Quan Priest, Real Dimez, Raul Bautista, Brian Heder) comptent comme des « termes GTA » : « Cal Hampton meurt » est donc bloqué. Seuls les prénoms ambigus Jason/Lucia sont exclus.
- Le mode extrême accepte volontairement les faux positifs (Rockstar énergétique, Jason Statham, Lucia de Lammermoor…).

### Détection

Le texte est **normalisé** avant comparaison : minuscules, accents supprimés, ponctuation → espaces. Toutes les variantes de GTA 6 sont reconnues : `GTA6`, `GTA 6`, `GTA VI`, `GTAVI`, `G.T.A. 6`, `GTA-6`, `GTA_6`, `#GTA6`, `Grand Theft Auto Six`… (mais pas `GTA 60`, `GTA V`, `GTA Vice`). Les hashtags collés (`#ViceCity`, `#JasonDuval`, `#GTA6Leaks`) sont reconnus. Les termes sont comparés en **mots entiers** (« Jason » ne déclenche pas « Jasonne »).

Le texte analysé comprend : texte visible, `alt`, `aria-label`, `title` (miniatures, hashtags, noms de chaînes…), le **profil de l'auteur** quand il est visible, et les shadow DOM ouverts.

**Profils (bio)** : quand vous visitez le profil d'un compte (X, Instagram, TikTok) dont la bio parle de GTA 6, le compte est mémorisé **localement** (`chrome.storage.local`) et ses posts sont masqués partout, même si le texte du post est anodin. Sur Instagram, la page profil entière est recouverte. *Limite : la bio n'est lue que lorsque vous visitez le profil, l'extension ne fait aucune requête réseau pour la récupérer.*

---

## Liste blanche de comptes

Les contenus publiés par les comptes de la liste blanche ne sont **pas bloqués** (ex. la chaîne YouTube officielle de Rockstar). Elle s'applique dans les deux modes (il n'existe pas de mode « Extrême Ultra » dans cette extension : seulement Extrême et Intermédiaire).

### Règle de sécurité (jamais inversée)

1. Le contenu est d'abord **bloqué normalement**, quel que soit son auteur (aucun masquage retardé, aucune analyse sautée).
2. Ensuite seulement, l'auteur est identifié.
3. Auteur **identifié avec certitude** ET dans la liste → débloqué (la vidéo ne reprend lecture et son qu'à ce moment).
4. Tout autre cas reste bloqué : auteur introuvable, ambigu, pas encore chargé, erreur, collaboration, contenu d'un autre auteur impossible à isoler.

### Identification des comptes

Jamais par le **nom affiché** (n'importe qui peut le copier) : uniquement par un identifiant extrait d'un **lien (`href`)** à l'intérieur du conteneur du post, normalisé (minuscules, sans `@`, sans paramètres d'URL, sans slash final). Un lien vers un autre domaine (`https://exemple.com/RockstarGames`) ne vaut rien. Les liens présents dans le texte (mentions, description) ne comptent pas.

| Plateforme | Identifiant | Où il est lu |
| --- | --- | --- |
| X | `x.com/<handle>` | 1er `[data-testid="User-Name"]` du tweet (= auteur **original** pour un repost) |
| YouTube | `@handle` **et** `UC…` (même chaîne) | `ytd-channel-name a`, `#channel-info a`, `a#author-text` |
| TikTok | `@user` | liens `/@user` hors légende, son et commentaires |
| Instagram | `instagram.com/<user>` | 1er lien de profil du `<header>` du post (collaboration : auteur principal) |
| Facebook | nom de page ou `profile.php?id=` | `[data-ad-rendering-role="profile_name"] a` |
| Reddit | `u/user` (+ `r/subreddit` en option) | attributs `author` et `subreddit-prefixed-name` (Reddit n'expose pas de lien d'auteur) |

Le DOM réel a été inspecté là où il est accessible sans compte : **YouTube** (cartes : `ytd-channel-name a[href="/@RockstarGames"]` ; page de chaîne : URL `/@RockstarGames` + `canonical` `/channel/UC6VcWc1rAoWdBCM0JxrRQ3A`), **Facebook** (page publique : `profile_name`, URL absolue avec `?__cft__=…`) et **Reddit** (attribut `author`). Pour X, TikTok et Instagram (compte requis), les extracteurs reposent sur les sélecteurs documentés dans `sites/*.js` et sont testés sur des pages simulées : à valider sur le site réel.

**YouTube : handle ↔ ID `UC…`.** Une chaîne ajoutée par `@handle` est reconnue aussi via son ID `UC…` (et inversement) dès que les deux ont été vus ensemble sur **la page de la chaîne** (URL `/@handle` + lien canonique et `meta itemprop="identifier"` d'accord entre eux, observés de façon stable). L'équivalence est mémorisée localement. Sans cela, une carte qui n'expose que l'ID `UC…` reste bloquée : l'extension ne fait aucune requête réseau pour résoudre un handle. Ajoutez la chaîne par son URL `/channel/UC…` pour couvrir les deux d'emblée (la suggestion « Rockstar Games — YouTube » ajoute déjà les deux identifiants).

### Cas particuliers

- **Repost / retweet** : c'est l'auteur du contenu **original** qui compte. Un compte autorisé qui reposte un inconnu ne débloque rien.
- **Citation** : le post autorisé est débloqué, la partie citée reste analysée et bloquée séparément (si elle ne peut pas être isolée, tout reste bloqué).
- **Commentaires / réponses** : toujours filtrés normalement (sur Instagram, les commentaires d'autres comptes sous un post autorisé restent bloqués).
- **Collaboration** (plusieurs auteurs) : YouTube et TikTok = ambigu donc bloqué ; Instagram = débloqué seulement si l'auteur **principal** est autorisé.
- **Publicités** : débloquées seulement si l'annonceur est identifié (lien de chaîne / profil) et autorisé.
- **Shorts, Reels, TikTok** : même logique, lecture et son rétablis seulement une fois débloqué.
- **Reddit** : un crosspost (contenu d'un autre auteur) reste bloqué même si l'auteur est autorisé.
- Un élément déjà débloqué est **revérifié** à chaque passage : si le site le recycle pour un autre compte, il est re-bloqué.

### Ergonomie

- **Écran noir** : « Publié par @compte » et bouton **Toujours autoriser ce compte** → confirmation (ce compte pourrait aussi publier des spoils ; le focus est sur « Annuler »). Après confirmation, tous les posts de ce compte de la page sont débloqués **sans rechargement**.
- **Popup → onglet « Liste blanche »** : champ unique (URL de profil, plateforme détectée automatiquement, **ou** `@handle` + menu de plateforme), liste classée par plateforme avec icônes et bouton de suppression, **recherche**, **interrupteur de pause**, **suggestions de comptes (officiels Rockstar **non cochés** par défaut ; seul le compte de l'auteur du projet, @Nuxhii sur X, est pré-coché)** (seul le compte YouTube a été vérifié ; TikTok et Reddit sont marqués « à vérifier »), **import / export JSON** (l'import fusionne et ignore les identifiants invalides).
- **Stockage** : `chrome.storage.sync`, clés `whitelist` (par plateforme) et `whitelistEnabled` ; 200 comptes maximum. Les changements s'appliquent à tous les onglets ouverts sans rechargement : un **ajout** débloque à chaud ce qui est masqué ; un **retrait** ou la **pause** ré-analysent tout (bloquer d'abord, autoriser ensuite).

## Structure du projet

```
extension/             ★ L'extension elle-même (dossier à charger dans Chrome)
  manifest.json          MV3 : un content script (document_start) + service worker + popup
  keywords.js            ★ Listes de mots-clés (jeu, personnages, lieux, spoils par langue) + réglages par défaut
  themes/                Thèmes de la popup (variables CSS) ; themes/backup/ = popup d'origine intacte
  theme-init.js          Applique le thème avant l'affichage de la popup
  matcher.js             Normalisation + détection, deux modes (sans DOM, testable avec Node)
  util.js                Extraction de texte, heuristiques DOM partagées
  whitelist.js           Liste blanche : identifiants, URL, normalisation (partagé content script / popup)
  content.js             Moteur : analyse, overlay (Shadow DOM), pause des médias, MutationObserver, SPA
  styles.css             Règles de page injectées au plus tôt (état masqué)
  sites/generic.js       Repli générique (p, li, blockquote, titres, petits articles)
  sites/x.js             X / Twitter
  sites/reddit.js        Reddit (new + old)
  sites/youtube.js       YouTube (+ Shorts, /watch)
  sites/tiktok.js        TikTok web
  sites/instagram.js     Instagram (fil, grilles, Reels, stories, profil)
  sites/facebook.js      Facebook (posts, commentaires, Marketplace, Reels)
  sites/google.js        Google (résultats, aperçus IA, annonces, Actualités…)
  background.js          Compteur total + badge de l'icône
  popup.html/.css/.js    Interface
  icons/, fonts/         Icônes et police de la popup
KEYWORDS.md            Liste exhaustive des mots-clés (générée), par catégorie / langue / mode, avec lignes
Autre/                 Tout ce qui n'est pas l'extension (tests, outils, captures)
  tools/generate-keywords-md.js   Régénère KEYWORDS.md
  tools/screenshots/     Génère les captures de Autre/docs/screenshots/ (voir son README)
  tests/matcher.test.js  Tests unitaires du moteur de détection
  tests/whitelist.test.js Tests unitaires de la liste blanche (identifiants, URL, sécurité)
  tests/e2e/whitelist/   Page de test locale + jeu de cas de la liste blanche (navigateur réel), voir son README
  tests/demo.html        Page de démo pour le repli générique
  docs/screenshots/      Captures utilisées par le README
```

### Comment ça marche

1. Chaque module de site déclare des **règles** : un sélecteur de conteneur (post, carte, commentaire…), comment lire son texte, son auteur, et quoi recouvrir.
2. **Masquage au plus tôt** : à `document_start`, les conteneurs connus du site sont cachés tant qu'ils ne sont pas analysés (filet de sécurité : réaffichés d'office après 1,2 s si l'analyse n'a pas eu lieu). Les nouveaux éléments ajoutés par la page sont analysés **de façon synchrone** dans le callback du `MutationObserver`, donc avant le prochain affichage — aucun éclair de spoil. Une seconde passe **debounce (150 ms)** traite les contenus qui se remplissent après coup.
3. **Navigation SPA** : détection des changements d'URL (événements `yt-navigate-finish`, `popstate`, API Navigation, surveillance de l'URL) → nouvelle analyse complète.
4. L'écran noir vit dans un **Shadow DOM** : les CSS du site ne peuvent pas le casser. Le contenu masqué est en `visibility:hidden` (la mise en page est conservée, le texte disparaît aussi pour les lecteurs d'écran).

### Personnaliser

- **Liste complète des mots-clés** (par catégorie, langue, mode, avec fichier et ligne) : [KEYWORDS.md](KEYWORDS.md), généré par `node Autre/tools/generate-keywords-md.js` (à relancer après toute modification de `keywords.js`).
- **Ajouter un mot** : `keywords.js` (listes `game`, `characters`, `places`) — ou, sans toucher au code, un mot-clé perso dans la popup.
- **Ajouter une langue de spoil** : dans `keywords.js`, copiez un bloc de `spoilTerms` (clé `nl`, `ja`…), remplissez `strong` (formulations qui sont des spoils à elles seules) et `normal`. Rien d'autre à changer.
- **Ajouter un site** : copiez un module de `sites/`, appelez `G6S.registerSite({ id, label, hosts, rules })`, ajoutez le fichier dans `manifest.json` (avant `content.js`).
- **Ajouter un domaine Google** : `HOSTS` dans `sites/google.js` (le manifeste couvre déjà `<all_urls>`).

---

## Tests manuels

**Astuce pour tester sans vous spoiler** : dans la popup, ajoutez un mot-clé perso totalement anodin (ex. `pizza`) et cherchez ce mot sur chaque plateforme. Le résultat est identique à celui de GTA 6, sans voir de vrai contenu. Retirez-le ensuite.

Pour chaque plateforme, rechargez l'onglet après avoir réglé la popup.

### Tests automatisés (moteur de détection)

```
node Autre/tests/matcher.test.js
```

### Liste blanche

```
node Autre/tests/whitelist.test.js        # identifiants, URL, faux domaines, décision d'autorisation
```

Test de bout en bout (page de test locale et jeu de cas : compte autorisé, non autorisé, faux compte au même nom affiché, repost, citation, commentaire, auteur introuvable, YouTube `@handle` puis `UC…`, etc.) : voir `Autre/tests/e2e/whitelist/README.md`.

### Page de démo (repli générique)

Ouvrez `Autre/tests/demo.html` (activez « Autoriser l'accès aux URL de fichier » pour l'extension, ou servez le dossier). Les lignes ⛔ doivent être masquées, les ✅ non, dans le mode indiqué. Le bouton « Ajouter un paragraphe » vérifie le contenu dynamique.

### X / Twitter (x.com)

1. Mode extrême, recherchez `GTA 6` → onglets « Top » / « Récent » : chaque post est recouvert.
2. Colonne de droite / Explorer : une tendance contenant « GTA 6 » est recouverte (version compacte).
3. Un post dont l'image a un texte alternatif GTA 6, ou une citation / carte de lien GTA 6 → masqué.
4. Visitez le profil d'un compte dont la bio cite GTA 6 → ses posts sont masqués sur le profil, puis sur le fil « Pour vous » (même si le texte est anodin).
5. Mode intermédiaire : un post « GTA 6 sortira en novembre » reste visible ; « GTA 6 : la fin… » est masqué.
6. Défilez longtemps : les nouveaux posts sont masqués dès leur apparition (pas de flash).

### Reddit (www.reddit.com et old.reddit.com)

1. Visitez `r/GTA6` : tous les posts sont recouverts (le nom du subreddit est analysé).
2. Un post d'un autre subreddit avec « GTA 6 » dans le titre / le corps / le flair → masqué.
3. Dans un fil de commentaires : un commentaire spoil est masqué **seul**, ses voisins et parents restent lisibles.
4. Recherche « GTA 6 » : les résultats sont recouverts.

### YouTube (www.youtube.com)

1. Recherche `GTA 6` : cartes vidéo, chaînes, Shorts du rayon, publicités → recouverts.
2. Accueil et suggestions latérales : une miniature dont le titre / la chaîne cite GTA 6 → recouverte.
3. Ouvrez une vidéo GTA 6 : le **lecteur** est recouvert et la vidéo en pause, son coupé. Naviguez vers une autre vidéo (sans recharger) : le lecteur redevient normal.
4. Shorts : un Short GTA 6 (titre, légende, hashtag ou son) est entièrement recouvert, en pause ; scrollez au Short suivant : il joue normalement.
5. Commentaires : un commentaire GTA 6 est masqué seul. Notifications : idem.

### TikTok (www.tiktok.com)

1. « Pour toi » : une vidéo avec légende / hashtag / son GTA 6 est recouverte, **en pause** ; la suivante joue.
2. Découvrir, recherche, page hashtag, grille d'un profil : vignettes recouvertes.
3. Un profil dont la bio cite GTA 6 : ses vidéos sont masquées.
4. Commentaires : un commentaire GTA 6 est masqué.

### Instagram (www.instagram.com)

1. Fil : un post dont la légende cite GTA 6 est recouvert.
2. Explorer / recherche / grille d'un profil : une vignette dont le texte alternatif cite GTA 6 est recouverte.
3. Un profil dont la bio cite GTA 6 : **toute la page profil** est recouverte.
4. Reels (`/reels/`) : un Reel GTA 6 est recouvert et en pause. Stories : le texte disponible est analysé.

### Facebook (www.facebook.com)

Le module combine trois stratégies (détail en tête de `sites/facebook.js`) : conteneurs structurels (`[role="feed"] > *`, `data-pagelet*="FeedUnit"`, `aria-posinset`, `div[role="article"]`), commentaires reconnus par leur `aria-label` (« Commentaire de… »), et un **secours ancré sur le texte** : si un terme est trouvé dans un texte / `div[dir="auto"]` / `[data-ad-preview="message"]` / alt, on remonte jusqu'au conteneur de publication le plus proche. Il fonctionne donc même si Facebook change le balisage des publications.

1. **Fil d'actualité** : faites défiler : chaque publication GTA 6 (texte, publication **partagée**, **sponsorisée**, vidéo, Reel du fil) est recouverte dès son apparition ; les vidéos sont en pause.
2. **Page, groupe, profil** : publications, titre de la page / du groupe / du profil et carte « Intro » liés à GTA 6 sont recouverts.
3. Un post sain avec **un commentaire** GTA 6 : le post reste visible, le commentaire est masqué seul.
4. **« Voir plus »** : un post dont la partie visible est saine mais dont la suite contient un terme GTA est masqué dès que vous le dépliez.
5. Marketplace : une annonce GTA 6 est recouverte. Reels (`/reel/…`) : le Reel GTA 6 est recouvert et en pause.

### Google (www.google.com et google.fr, .de, .co.uk…)

1. Recherche `GTA 6` : chaque résultat, carrousel vidéo / actualités, « Autres questions posées » → masqués.
2. Si un **aperçu IA** apparaît : il est masqué en entier. Panneau de connaissances (colonne de droite) : idem.
3. Annonces sponsorisées sur une recherche GTA 6 : masquées.
4. Tapez `gta` dans la barre : les suggestions d'autocomplétion contenant GTA 6 disparaissent de la liste.
5. `news.google.com` : les articles GTA 6 sont recouverts.

### Réglages à chaud

Changer le mode, activer/désactiver ou ajouter un mot-clé dans la popup met à jour les onglets ouverts sans rechargement.

---

## Limites connues (à lire)

- **Les sélecteurs des sites sont la partie fragile.** Les sites changent leur balisage sans préavis. Les modules `sites/*.js` utilisent des attributs stables (`data-testid`, `data-e2e`, balises `ytd-*` / `shreddit-*`, rôles ARIA…) et documentent chaque sélecteur en commentaire, mais **ils ont été écrits d'après la connaissance du DOM de ces sites, pas relevés en direct sur les sites réels** : il faut les valider avec les tests manuels ci-dessus. Si un site ne masque plus rien, ouvrez les outils de développement, repérez le conteneur du post et corrigez la règle dans le module du site. Les moteurs (détection, overlay, pause, mutation, SPA) ont, eux, été testés sur des pages simulées reprenant ces structures.
- **Plus fragiles que les autres** : Instagram (aucun attribut de test, repérage par structure et heuristiques), Reels / stories, autocomplétion YouTube, aperçus IA de Google (repérés par leur titre localisé).
- **Non couvert** : Google Discover (flux mobile / nouvel onglet), images dans les images (voir évolutions futures), iframes (vidéos intégrées, widgets) — le script ne s'exécute que dans le cadre principal.
- **Facebook** : le fil d'actualité **connecté** n'a pas pu être inspecté (compte requis) ; la structure a été relevée sur une page publique (publication = `div[role="article"][aria-posinset]` sous un pagelet `TimelineFeedUnit_N`, commentaire = article imbriqué avec `aria-label="Commentaire de…"`, pas de `role="feed"` sur une page) et complétée par le secours par le texte. Le texte coupé par « Voir plus » n'est lu que s'il est dans le DOM ; Facebook brouille parfois des mots avec des caractères cachés ; les publications « virtualisées » (contenu retiré hors écran) sont ré-analysées quand leur contenu revient.
- **Commentaires Instagram / TikTok** : sur Instagram, un commentaire spoil masque tout le post (les commentaires font partie du `<article>`).
- **Liste blanche** : une collaboration YouTube / TikTok, un auteur introuvable, un crosspost Reddit ou une citation impossible à isoler restent bloqués (prudence voulue). Les extracteurs X, TikTok et Instagram n'ont pas été relevés sur le site réel. Sur X, si l'en-tête du tweet est dans une carte cliquable (`role="link"`), l'auteur est jugé ambigu et le tweet reste bloqué.
- **Bio des auteurs** : lue uniquement lorsque vous visitez le profil (aucune requête réseau).
- **Faux positifs en mode extrême** : voulus (Rockstar, Jason, Lucia, Vice City, Ocean Beach, Ambrosia…). Utilisez le mode intermédiaire pour les réduire.
- Couper le son d'un lecteur peut, selon le site, être mémorisé comme préférence « muet » ; le son est rétabli dès que vous cliquez sur « Afficher quand même ».

---

## Confidentialité

Aucune requête réseau, aucune télémétrie, aucune bibliothèque externe. Stockage local uniquement :
`chrome.storage.sync` (interrupteur, mode, mots-clés perso) et `chrome.storage.local` (compteur total, pseudos de comptes dont la bio est liée à GTA 6).

## Évolutions futures (non codées)

Liste blanche de sites, détection de spoil dans les images, mise à jour automatique des mots-clés, date de fin de protection automatique.
