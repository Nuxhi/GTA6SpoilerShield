# Captures d'écran du README

Génère les images de `Autre/docs/screenshots/` de façon reproductible. L'extension est chargée dans un vrai navigateur et tourne sur des **pages factices locales** (`pages.js`) : aucun vrai réseau social, aucun vrai compte, aucun vrai spoil, aucun logo ni visuel protégé. La bannière est un design original (HTML/CSS) aux couleurs Vice City.

## Prérequis (développement uniquement)

1. Node 18+ et un navigateur Chromium (Microsoft Edge fonctionne ; les versions récentes de Chrome officiel ignorent `--load-extension`). Variable `BROWSER` pour indiquer un autre exécutable.
2. `npm install` dans ce dossier.
3. Un certificat local, une fois : `openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 30 -subj "/CN=localhost"` (Git Bash sur Windows : préfixer par `MSYS_NO_PATHCONV=1`).

## Lancer

```
node make.js
```

Produit : `banner.png`, `popup-vicecity.png`, `popup-dark.png`, `whitelist-vicecity.png`, `whitelist-dark.png`, `blocked-x.png`, `blocked-youtube.png`, `countdown.png`.
