# Prompt Claude Code – Extension Chrome anti-spoil GTA 6

## Contexte

Crée une extension Google Chrome (Manifest V3) nommée **GTA 6 Spoiler Shield**. Son but : masquer automatiquement tout contenu pouvant spoiler Grand Theft Auto VI (sortie le 19 novembre 2026) sur les pages web, en priorité sur les réseaux sociaux : X/Twitter, Instagram, Facebook, Reddit, YouTube (y compris Shorts), TikTok (version web), Threads et Google (résultats, aperçus IA, annonces sponsorisées). L'interface de l'extension est en français. Les mots-clés détectés, eux, doivent couvrir plusieurs langues.

## Fonctionnement attendu

1. Un content script analyse le texte visible de la page : texte des posts, titres, légendes, descriptions, texte alternatif des images, hashtags.
2. Il utilise un MutationObserver pour analyser le contenu chargé dynamiquement (scroll infini), avec un debounce pour ne pas ralentir la page.
3. Quand un élément correspond, le **post entier** (et pas seulement le mot) est recouvert d'un écran noir avec le message : « Contenu lié à GTA 6 – spoil possible ». Afficher en petit le mot-clé ou la catégorie détectée.
4. Deux boutons sur l'écran noir : « Afficher quand même » (révèle ce post uniquement) et « Garder masqué ».
5. Pour chaque site prioritaire, définir des sélecteurs CSS du conteneur de post (ex. `article` sur X, conteneurs de posts sur Facebook/Instagram, `shreddit-post` sur Reddit, `ytd-rich-item-renderer` sur YouTube). Prévoir un fallback générique pour les autres sites (paragraphes, blocs de texte).
6. Normaliser le texte avant comparaison : minuscules, suppression des accents, gestion des variantes (GTA6, GTA 6, GTA VI, G.T.A. 6, #GTA6), et tolérance aux séparateurs.

## Couverture plateforme par plateforme

Chaque plateforme a son propre module (ex. `sites/youtube.js`) qui sait où se trouve le texte et quel conteneur masquer. Les classes CSS de ces sites sont générées et changent souvent : privilégier les attributs stables (`role`, `aria-label`, `data-testid`, balises personnalisées comme `ytd-*` ou `shreddit-*`, liens `href`). Avant de coder chaque module, inspecter le DOM réel du site et documenter les sélecteurs choisis en commentaire.

| Plateforme | Zones à analyser | Élément à masquer |
| --- | --- | --- |
| YouTube | Titres, descriptions, noms de chaînes, commentaires, suggestions latérales, miniatures (texte alt / aria-label), Shorts (titre, légende, hashtags, son utilisé), recherche, notifications | Carte vidéo entière ; pour un Short en lecture, recouvrir tout le lecteur et mettre la vidéo en pause |
| X / Twitter | Texte du post, citations, nom et bio de l'auteur, cartes de lien, texte alt des images, tendances, « Pour vous », réponses, notes de la communauté | Post entier, encart de tendance |
| Reddit | Titre, corps, nom du subreddit (ex. r/GTA6), flair, commentaires, aperçus de liens | Post ou commentaire entier |
| TikTok | Légende, hashtags, nom du son, pseudo et bio du créateur, commentaires, page Découvrir | Vidéo entière, mise en pause |
| Instagram | Légendes, hashtags, pseudo, nom et **bio du profil**, commentaires, Reels, stories (texte disponible), page Explorer, texte alt | Post, Reel ou story entier ; sur un profil lié à GTA 6, masquer toute la page profil |
| Facebook | Posts, noms de pages et groupes, commentaires, Reels, aperçus de liens, Marketplace, posts « Sponsorisé » | Post entier |
| Google | Résultats de recherche, **aperçus IA (AI Overviews)**, annonces sponsorisées, « Autres questions posées », carrousels vidéo et actualités, panneau de connaissances, Google Actualités, Discover, suggestions d'autocomplétion | Bloc entier ; si l'aperçu IA ou le panneau parle de GTA 6, le masquer complètement |

Règles communes :

- Toujours analyser aussi le **profil de l'auteur** (pseudo, nom affiché, bio) : un compte dont la bio parle de GTA 6 doit faire masquer ses posts, même si le texte du post seul ne contient rien.
- Les publicités et contenus sponsorisés sont traités comme du contenu normal : s'ils parlent de GTA 6, ils sont masqués.
- Les vidéos masquées (YouTube, Shorts, Reels, TikTok) doivent être mises en pause et coupées en son tant qu'elles sont masquées, pour éviter un spoil audio.
- Gérer la navigation sans rechargement (SPA) : relancer l'analyse à chaque changement d'URL.
- Prévoir des tests manuels documentés pour chaque plateforme dans le README.

## Deux modes de blocage

- **Mode extrême** : bloque dès qu'un seul terme lié à GTA 6 apparaît (nom du jeu, personnage, lieu, hashtag), même sans mot de spoil.
- **Mode intermédiaire** : bloque seulement si un terme GTA 6 est présent **ET** un terme de spoil (fin, mort, choix final, twist, etc.) dans le même post. Ou si un terme de spoil très fort est présent seul avec un nom de personnage.
- Le mode se choisit dans la popup de l'extension et est sauvegardé avec `chrome.storage.sync`.

## Listes de mots-clés (à mettre dans un fichier séparé `keywords.js` facile à modifier)

**Termes du jeu** : GTA 6, GTA VI, GTA6, GTAVI, Grand Theft Auto 6, Grand Theft Auto VI, Rockstar Games, Rockstar, #GTA6, #GTAVI.

**Personnages** : Jason, Jason Duval, Lucia, Lucia Caminos, Cal Hampton, Boobie Ike, Dre'Quan Priest, Real Dimez, Raul Bautista, Brian Heder. En mode extrême, « Jason » et « Lucia » seuls suffisent à bloquer le contenu, même sans autre terme GTA (l'utilisateur accepte les faux positifs). En mode intermédiaire, ils ne comptent que s'ils sont accompagnés d'un autre terme GTA.

**Lieux** : Leonida, Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia, Mount Kalaga, Ocean Beach, Little Cuba.

**Termes de spoil, traduits** :

- Français : fin, fin du jeu, fin secrète, mort, meurt, décès, tué, choix final, dernier choix, twist, retournement, dernière mission, boss final, révélation, trahison, spoil, divulgâcheur.
- Anglais : ending, ends, end game, secret ending, dies, death, dead, killed, final choice, last mission, final mission, final boss, plot twist, betrayal, reveal, spoiler, spoilers.
- Espagnol : final, muere, muerte, muerto, elección final, última misión, giro, traición, revelación, spoiler.
- Italien : finale, muore, morte, morto, scelta finale, ultima missione, colpo di scena, tradimento, rivelazione.
- Allemand : Ende, stirbt, Tod, tot, letzte Mission, Endkampf, Wendung, Verrat, Enthüllung.
- Portugais : final, morre, morte, morto, escolha final, última missão, reviravolta, traição, revelação.

Prévoir la possibilité d'ajouter facilement d'autres langues plus tard.

## Popup de l'extension

- Interrupteur on/off global.
- Choix du mode : Extrême / Intermédiaire.
- Compteur de contenus bloqués sur la page courante et au total.
- Champ pour ajouter ses propres mots-clés personnalisés.

## Contraintes techniques

- Manifest V3, JavaScript vanilla, pas de dépendances externes.
- Aucune donnée envoyée sur Internet : tout est traité localement.
- Le masquage doit se faire le plus tôt possible pour éviter que le spoil soit visible une fraction de seconde (injection CSS précoce, `run_at: document_start` si pertinent).
- Code commenté, structure claire : `manifest.json`, `content.js`, `keywords.js`, `popup.html`, `popup.js`, `styles.css`.
- Fournir un README expliquant comment charger l'extension en mode développeur dans Chrome.

## Évolutions futures (ne pas coder maintenant)

Liste blanche de sites, détection de spoil dans les images, mise à jour automatique des mots-clés, date de fin de protection automatique.
