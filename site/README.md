# Website (GitHub Pages)

The landing page of GTA 6 Spoiler Shield: plain HTML, CSS and JavaScript, no build step, no external script, no tracker.

Once published, it lives at **https://nuxhi.github.io/GTA6SpoilerShield/**.

## Files

| File | Role |
| --- | --- |
| `index.html` | The whole page, in English (default language) |
| `styles.css` | Layout and the light Vice City theme (same palette as the popup) |
| `main.js` | French translation, EN/FR switch (saved in `localStorage`), mobile menu, scroll animations, copy button |
| `assets/` | Favicon, share image (`og-image.png`, 1200 × 630), self-hosted Archivo font, screenshots in WebP |

The screenshots in `assets/screenshots/` are WebP copies of `Autre/docs/screenshots/`. If you retake the screenshots, convert them again (any PNG to WebP tool works) and keep the same file names.

## Test it locally

From the repository folder:

```bash
cd site
python -m http.server 8080
```

Then open http://localhost:8080. Opening `index.html` directly also works.

## Turn on GitHub Pages (one time)

1. Push the repository to GitHub, including `site/` and `.github/workflows/pages.yml`.
2. On GitHub, open the repository **Settings**, then **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and run **Deploy site to GitHub Pages** (or push any change in `site/`).
5. After about a minute the site is online at the address above. The link also appears in **Settings > Pages**.

From then on, every push to `main` that changes `site/` republishes the site automatically. Pushes that only change the extension do not trigger it.

If the repository is renamed, update the GitHub links and the `canonical`, `og:url` and `og:image` addresses at the top of `index.html`.

---

# Site web (GitHub Pages)

La page vitrine de GTA 6 Spoiler Shield : HTML, CSS et JavaScript simples, sans compilation, sans script externe, sans traqueur. Une fois publiée, elle est à l'adresse **https://nuxhi.github.io/GTA6SpoilerShield/**.

## Tester en local

Depuis le dossier du dépôt : `cd site` puis `python -m http.server 8080`, et ouvrez http://localhost:8080.

## Activer GitHub Pages (une seule fois)

1. Poussez le dépôt sur GitHub, avec `site/` et `.github/workflows/pages.yml`.
2. Sur GitHub, ouvrez **Settings** (paramètres du dépôt), puis **Pages**.
3. Dans **Build and deployment**, réglez **Source** sur **GitHub Actions**.
4. Ouvrez l'onglet **Actions** et lancez **Deploy site to GitHub Pages** (ou poussez une modification dans `site/`).
5. Environ une minute plus tard, le site est en ligne à l'adresse ci-dessus. Le lien apparaît aussi dans **Settings > Pages**.

Ensuite, chaque push sur `main` qui modifie `site/` republie le site automatiquement. Les pushes qui ne touchent que l'extension ne le déclenchent pas.

Si le dépôt est renommé, mettez à jour les liens GitHub et les adresses `canonical`, `og:url` et `og:image` en haut de `index.html`.
