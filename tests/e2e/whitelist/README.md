# Test de la liste blanche (bout en bout)

Charge l'extension dans un vrai navigateur et la fait tourner sur des **pages locales** qui reprennent la structure
de chaque plateforme (`pages.js`). Les noms d'hôte (`x.com`, `www.youtube.com`…) sont redirigés vers un petit serveur
HTTPS local grâce à `--host-resolver-rules`, ce qui active les bons modules de site. **Rien ne sort de la machine.**

## Prérequis (développement uniquement, l'extension n'a aucune dépendance)

1. Node 18+ et un navigateur Chromium. **Microsoft Edge fonctionne** ; les versions récentes de Chrome officiel
   ignorent `--load-extension` (variable `BROWSER` pour indiquer un autre exécutable).
2. `npm install` dans ce dossier.
3. Un certificat auto-signé local (une fois) :
   `openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 30 -subj "/CN=localhost"`
   (sous Git Bash sur Windows, préfixer par `MSYS_NO_PATHCONV=1`).

## Lancer

```
node run.js
```

## Jeu de cas

| Plateforme | Cas | Résultat attendu |
| --- | --- | --- |
| X | post d'un compte autorisé | débloqué (vidéo : lecture et son rétablis) |
| X | post d'un compte non autorisé | bloqué |
| X | faux compte « Rockstar Games », autre handle | bloqué |
| X | repost par un compte autorisé d'un inconnu | bloqué |
| X | citation d'un inconnu dans un post autorisé | post débloqué, **partie citée bloquée** |
| X | citation d'un compte autorisé | débloquée |
| X | citation impossible à isoler | tout reste bloqué |
| X | auteur introuvable / lien vers un autre domaine | bloqué |
| X | réponse d'un inconnu | bloquée |
| X | liste modifiée à chaud, mise en pause, élément « recyclé » par le site | suit la liste ; auteur revérifié |
| X | « Toujours autoriser ce compte » (confirmation / annulation) | ajoute seulement après confirmation |
| YouTube | `@handle`, faux compte, collaboration, mention en description, pub, commentaires | seul le compte exact est débloqué |
| YouTube | ajouté via `@handle`, rencontré via `UC…` | débloqué après visite de la page de la chaîne (équivalence apprise) |
| YouTube | `canonical` et `identifier` incohérents | aucune équivalence apprise |
| YouTube | Shorts | lecture et son rétablis seulement une fois débloqué |
| Reddit | `u/…`, option `r/…`, crosspost, commentaire | crosspost reste bloqué |
| TikTok | mention en légende, duo à deux auteurs | duo bloqué |
| Instagram | commentaires d'inconnus sous un post autorisé, profil autorisé | commentaires bloqués, profil non recouvert |
| Facebook | URL à paramètres `__cft__`, faux compte, partage à deux auteurs, sans en-tête | seul le compte exact est débloqué |
| Popup | ajout par URL / @handle, erreurs, recherche, suggestions décochées, import/export, pause, suppression | voir `run.js` |
