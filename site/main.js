/* GTA 6 Spoiler Shield: landing page behaviour.
   Vanilla JS, no dependency, no network call. English text lives in the HTML
   (default language and SEO); this file only holds the French dictionary. */
(() => {
  "use strict";

  const STORAGE_KEY = "gss-lang";
  const SUPPORTED = ["en", "fr"];
  const COPIED_EN = "Copied!";

  const FR = {
    "meta.title": "GTA 6 Spoiler Shield : bloque les spoilers de GTA 6. Partout.",
    "meta.desc": "Extension de navigateur gratuite et open source qui masque les spoilers de GTA 6 sur X, YouTube, Reddit, TikTok, Instagram, Facebook, Google et tous les autres sites. 100 % locale, sans pistage.",

    "nav.skip": "Aller au contenu",
    "nav.how": "Comment ça marche",
    "nav.features": "Fonctionnalités",
    "nav.modes": "Modes",
    "nav.install": "Installation",
    "nav.oss": "Open source",
    "nav.story": "Pourquoi ce projet",
    "nav.faq": "FAQ",
    "nav.lang": "Langue",
    "nav.menu": "Menu",

    "hero.title1": "Bloque les spoilers de GTA 6.",
    "hero.title2": "Partout.",
    "hero.sub": "Une extension de navigateur gratuite et open source qui masque les spoilers de GTA 6 sur X, YouTube, Reddit, TikTok, Instagram, Facebook et Google, et sur tous les autres sites que tu visites. Tout tourne 100 % en local dans ton navigateur.",
    "hero.install": "Installer gratuitement",
    "hero.github": "Voir sur GitHub",
    "hero.note": "Gratuit, open source, 100 % local. Sans compte, sans pistage. Chrome, Edge, Brave et Opera.",
    "cd.label": "GTA\u00a06 sort dans",
    "cd.date": "19 novembre 2026",
    "cd.d": "jours",
    "cd.h": "heures",
    "cd.m": "minutes",
    "cd.s": "secondes",
    "cd.done": "Il est sorti. Joue-y avant qu'on te le spoile !",

    "stage.alt": "Animation : le bouclier bloque les spoilers sur X, YouTube, Reddit, TikTok, Instagram, Facebook, Threads et Google, puis sur tout Internet.",
    "stage.static": "Plateformes protégées",
    "stage.internet": "Internet",
    "cap.x": "Bloqué sur X",
    "cap.youtube": "Bloqué sur YouTube",
    "cap.reddit": "Bloqué sur Reddit",
    "cap.tiktok": "Bloqué sur TikTok",
    "cap.instagram": "Bloqué sur Instagram",
    "cap.facebook": "Bloqué sur Facebook",
    "cap.threads": "Bloqué sur Threads",
    "cap.google": "Bloqué sur Google",
    "cap.web": "Bloqué sur tout Internet",

    "how.eyebrow": "Comment ça marche",
    "how.title": "Quatre étapes entre toi et un spoiler",
    "how.lead": "Tu l'installes une fois. Le bouclier fait le reste, discrètement, dans ton navigateur.",
    "how.s1.t": "Il lit la page",
    "how.s1.d": "Pendant que tu fais défiler, il lit le texte des posts, les titres, les légendes, les hashtags et le nom du compte, et cherche des mots-clés de GTA 6 dans 6 langues.",
    "how.s2.t": "Un écran noir, tout de suite",
    "how.s2.d": "Le post est recouvert avant que tu puisses le lire. Les vidéos qu'il contient sont mises en pause et coupées, pour ne pas entendre de spoiler non plus.",
    "how.s3.t": "5 secondes avant d'afficher",
    "how.s3.d": "Curieux ? « Afficher quand même » lance un compte à rebours annulable à tout moment. Il s'arrête aussi tout seul si tu fais défiler ou changes d'onglet.",
    "how.s4.t": "Fais confiance à qui tu veux",
    "how.s4.d": "Autorise un compte directement depuis l'écran noir, ou depuis la popup. Si le compte ne peut pas être identifié avec certitude, le post reste masqué.",
    "mock.hidden": "Contenu lié à GTA 6, spoil possible",
    "mock.by": "Publié par @Nuxhii",
    "mock.showing": "Affichage dans 5…",
    "mock.cancel": "Annuler",
    "mock.allowed": "Autorisé",

    "feat.eyebrow": "Fonctionnalités",
    "feat.title": "Conçu pour couvrir tout le web",
    "feat.lead": "Une seule extension. Sans compte, sans abonnement, sans piège.",
    "feat.1.t": "Tes fils, et tout le reste du web",
    "feat.1.d": "Une protection dédiée pour X, YouTube (Shorts compris), Reddit, TikTok, Instagram, Facebook et Google (aperçus IA et pubs compris). Threads et tous les autres sites sont couverts par un repli général.",
    "feat.2.t": "2 modes de blocage",
    "feat.2.d": "<b>Extrême</b> masque tout ce qui concerne le jeu. <b>Intermédiaire</b> ne masque que les posts qui associent GTA\u00a06 à un mot ou un contenu risqué.",
    "feat.3.t": "Mots-clés en 6 langues",
    "feat.3.d": "Français, anglais, espagnol, italien, allemand et portugais : le jeu, ses personnages, ses lieux, ses hashtags et les mots de spoil.",
    "feat.4.t": "Tes propres mots-clés",
    "feat.4.d": "Ajoute n'importe quel mot ou nom que tu ne veux jamais voir. Tes mots-clés fonctionnent dans les deux modes.",
    "feat.5.t": "Affichage sécurisé",
    "feat.5.d": "Les spoilers restent bloqués. Si tu veux quand même en voir un, un compte à rebours de 5 secondes se lance d'abord, pour qu'un clic raté ne dévoile jamais rien. Tu peux l'annuler à tout moment, et le régler de 0 à 30 secondes.",
    "feat.6.t": "Vidéos silencieuses",
    "feat.6.d": "Les vidéos, Shorts, Reels et TikTok masqués sont mis en pause et coupés jusqu'à ce que tu choisisses de les afficher.",
    "feat.7.t": "Liste blanche de comptes",
    "feat.7.d": "Laisse passer des comptes de confiance avec un lien de profil ou un @pseudo. Recherche, mise en pause, import et export en JSON.",
    "feat.8.t": "Trois thèmes, des compteurs",
    "feat.8.d": "Vice City clair, Sombre, ou Sunset dans le style de ce site, avec le nombre de contenus masqués sur la page et au total.",
    "feat.9.t": "100 % local",
    "feat.9.d": "La détection tourne sur ton appareil. Pas de serveur, pas de compte, pas de statistiques, et pas une seule requête réseau dans le code.",

    "plat.eyebrow": "Plateformes",
    "plat.title": "Là où les spoilers se cachent",
    "plat.lead": "Chaque grand site a son propre module, adapté à sa mise en page. Tout le reste passe par le repli général.",
    "plat.x": "Posts, réponses et citations",
    "plat.youtube": "Vidéos, Shorts et pubs",
    "plat.reddit": "Posts et commentaires",
    "plat.tiktok": "Vidéos et légendes",
    "plat.instagram": "Posts et Reels",
    "plat.facebook": "Publications, partages, sponsorisés",
    "plat.threads": "Via le repli général",
    "plat.google": "Résultats, aperçus IA, pubs, Actualités",
    "plat.web.t": "…et tout le reste du web",
    "plat.web.d": "Blogs, sites d'info, forums : le repli lit les paragraphes, les titres et les légendes partout ailleurs.",
    "plat.note": "Tes mails et documents ne sont pas touchés : Gmail, Google Docs, Drive, Agenda et Meet ne sont jamais analysés.",

    "modes.eyebrow": "Modes de blocage",
    "modes.title": "Choisis ton niveau de prudence",
    "modes.lead": "Deux modes. Tu changes à tout moment depuis la popup.",
    "modes.caption": "Comparaison des deux modes de blocage",
    "modes.m1": "Intermédiaire",
    "modes.m2": "Extrême",
    "modes.default": "Par défaut",
    "modes.r.what": "Ce qu'il masque",
    "modes.what1": "Les posts qui parlent de GTA 6 <b>et</b> contiennent un mot de spoil (fin, mort, twist…)",
    "modes.what2": "Tout ce qui concerne GTA 6 : le jeu, ses personnages, ses lieux et ses hashtags",
    "modes.r.ex1": "Un post comme",
    "modes.ex1": "De nouvelles images de GTA 6 sont sorties",
    "modes.ex2": "Je n'en reviens pas de la fin de GTA 6",
    "modes.visible": "Visible",
    "modes.hidden": "Masqué",
    "modes.r.custom": "Tes propres mots-clés",
    "modes.r.allow": "Liste blanche de comptes",
    "modes.yes": "Inclus",
    "modes.r.fp": "Faux positifs",
    "modes.fp1": "Rares",
    "modes.fp2": "Attendus (une personne prénommée Jason, par exemple)",
    "modes.r.best": "Idéal pour",
    "modes.best1": "Suivre l'actualité en évitant les vrais spoilers",
    "modes.best2": "Zéro risque jusqu'à avoir joué",

    "inst.eyebrow": "Installation",
    "inst.title": "Prête en une minute environ",
    "inst.lead": "Pas de boutique et rien à payer : l'extension vient directement de GitHub. Elle fonctionne dans Chrome et tous les navigateurs basés sur Chromium (Edge, Brave, Opera…).",
    "inst.btn": "Télécharger le ZIP",
    "inst.1.t": "Télécharge",
    "inst.1.d": "Avec le bouton ci-dessus, ou sur GitHub : <b>Code</b>, puis <b>Download ZIP</b>.",
    "inst.2.t": "Décompresse et garde le dossier",
    "inst.2.d": "Place-le là où il peut rester, par exemple dans Documents. Le navigateur relit l'extension depuis ce dossier à chaque démarrage.",
    "inst.3.t": "Ouvre la page des extensions",
    "inst.3.d": "Tape <code>chrome://extensions</code> dans la barre d'adresse (Edge : <code>edge://extensions</code>).",
    "inst.4.t": "Active le mode développeur",
    "inst.4.d": "C'est l'interrupteur en haut à droite de la page.",
    "inst.5.t": "Charge l'extension non empaquetée",
    "inst.5.d": "Choisis le dossier décompressé, celui qui contient directement <code>manifest.json</code>.",
    "inst.6.t": "Épingle-la et recharge tes onglets",
    "inst.6.d": "Épingle-la depuis l'icône puzzle, puis appuie sur F5 dans les onglets déjà ouverts.",
    "inst.note": "Au démarrage, le navigateur peut proposer de désactiver les extensions en mode développeur. C'est normal pour toute extension installée ainsi : ferme simplement le message. Firefox et Safari ne sont pas pris en charge.",

    "oss.eyebrow": "Open source et confiance",
    "oss.title": "Ne nous crois pas. Lis le code.",
    "oss.lead": "Chaque ligne est publique. Lis-la toi-même, ou donne-la à une IA et demande-lui ce qu'elle fait vraiment. Aucune donnée n'est collectée, aucune n'est envoyée.",
    "oss.repo": "Parcourir le code",
    "oss.1.t": "Entièrement auditable",
    "oss.1.d": "Tout le code source est sur GitHub, sous licence MIT. Aucune partie cachée, aucun fichier minifié, aucune compilation.",
    "oss.2.t": "Zéro donnée collectée",
    "oss.2.d": "Elle lit les pages pour trouver les spoilers, et c'est tout. Pas de serveur, pas de statistiques. Tes réglages restent dans le stockage de ton navigateur.",
    "oss.3.t": "Projet communautaire",
    "oss.3.d": "Signale un site, propose des mots-clés ou une nouvelle langue, ouvre une pull request. Les contributions sont les bienvenues.",
    "oss.ai": "Essaie : colle ce prompt dans l'IA de ton choix.",
    "oss.prompt": "Audite le code de cette extension de navigateur : https://github.com/Nuxhi/GTA6SpoilerShield. Collecte-t-elle, stocke-t-elle ou envoie-t-elle des données de l'utilisateur hors du navigateur ? Liste chaque permission et chaque requête réseau, et explique pourquoi chacune existe.",
    "oss.copy": "Copier",
    "oss.copied": "Copié !",

    "story.eyebrow": "Pourquoi ce projet",
    "story.title": "Fait par un fan. Gratuit pour tous les fans.",
    "story.p1": "Je suis un grand fan de la licence. Quand j'ai vu que certains faisaient payer des extensions pour bloquer les spoilers sur les réseaux, j'ai trouvé ça scandaleux. Aucun fan ne devrait avoir à payer pour découvrir le jeu comme il doit être découvert.",
    "story.p2": "Pire, ces extensions étaient fermées. On n'avait pas accès à leur code, donc aucun moyen de savoir vraiment ce qu'elles faisaient dans notre navigateur. Ici, c'est l'inverse : n'importe qui peut lire le code, ou le donner à une intelligence artificielle et lui demander ce qu'il fait. C'est ça, la grosse différence.",
    "story.p3": "Je suis développeur, mais le temps avant la sortie était très court. J'ai donc délégué tout le code à une IA, Claude, et j'ai apporté ma vision de développeur : quoi construire, comment ça doit se comporter, quoi tester et quoi refuser. Et comme le code est public, tu n'as pas à me croire sur parole, ni l'IA.",
    "story.role": "Créateur du projet",
    "credits.title": "Qui a fait quoi",
    "credits.1.t": "Vision et direction",
    "credits.1.d": "Nuxhii, développeur : l'idée, le cahier des charges, les relectures et les tests.",
    "credits.2.t": "Code",
    "credits.2.d": "Écrit avec Claude, l'IA d'Anthropic, du début à la fin.",
    "credits.3.t": "Vérification",
    "credits.3.d": "Toi, ou n'importe quelle IA en qui tu as confiance. Tout le code est là.",
    "credits.4.t": "Prix",
    "credits.4.d": "Gratuit. Pas de version premium, pas de pub, aucun don obligatoire.",

    "shots.eyebrow": "Captures",
    "shots.title": "Vois-la en action",
    "shots.lead": "De vraies captures de l'extension sur des pages de démonstration. Pas de vrais comptes, pas de vrais spoilers.",
    "shots.a1": "La popup de l'extension en thème clair Vice City : interrupteur, mode de blocage, compteurs, délai avant affichage, mots-clés personnalisés et thème.",
    "shots.a2": "La même popup en thème sombre, noir et rouge.",
    "shots.a3": "L'onglet liste blanche : ajout d'un compte par lien de profil ou pseudo, liste des comptes autorisés, comptes officiels suggérés et import ou export JSON.",
    "shots.a4": "Un faux fil d'actualité où un post est recouvert d'un écran noir avec trois boutons : afficher quand même, garder masqué, toujours autoriser ce compte.",
    "shots.a5": "Le même post pendant le compte à rebours avant affichage, avec un bouton Annuler.",
    "shots.a6": "Un faux site vidéo où la carte d'une vidéo sur le jeu est recouverte d'un écran noir.",
    "shots.c1": "Popup · Thème Vice City",
    "shots.c2": "Popup · Thème sombre",
    "shots.c3": "Liste blanche de comptes",
    "shots.c4": "Un post bloqué",
    "shots.c5": "Le compte à rebours, annulable",
    "shots.c6": "Une vidéo bloquée",

    "faq.eyebrow": "FAQ",
    "faq.title": "Tes questions, nos réponses",
    "faq.1.q": "Elle a masqué quelque chose qui n'est pas un spoiler. Pourquoi ?",
    "faq.1.a": "Le mode Extrême est strict volontairement : toute mention du jeu est masquée. Passe en Intermédiaire dans la popup pour ne masquer que les vrais spoilers, ou autorise le compte qui l'a publié. Si un mot-clé est trop agressif, dis-le sur GitHub en décrivant le post plutôt qu'en collant un spoiler.",
    "faq.2.q": "Comment laisser passer un compte ?",
    "faq.2.a": "Deux façons. Sur un écran noir, clique sur « Toujours autoriser ce compte » et confirme. Ou ouvre la popup, va dans l'onglet « Liste blanche » et colle le lien du profil ou le @pseudo du compte. Si le compte ne peut pas être identifié avec certitude, le contenu reste masqué, volontairement.",
    "faq.3.q": "Comment ajouter mon propre mot ?",
    "faq.3.a": "Dans la popup, saisis-le dans « Mots-clés personnalisés » et clique sur « Ajouter ». Il fonctionne dans les deux modes.",
    "faq.4.q": "Comment la désactiver un instant ?",
    "faq.4.a": "Utilise l'interrupteur en haut de la popup, et réactive-le quand tu veux. Tu peux aussi mettre en pause seulement la liste blanche avec l'interrupteur de son onglet.",
    "faq.5.q": "Rien n'est bloqué sur une page que je viens d'ouvrir. Pourquoi ?",
    "faq.5.a": "Recharge l'onglet (F5). Après une installation ou une mise à jour, le navigateur n'ajoute pas l'extension aux onglets déjà ouverts.",
    "faq.6.q": "Collecte-t-elle ou envoie-t-elle mes données ?",
    "faq.6.a": "Non. La détection tourne en local et le code ne fait aucune requête réseau. Le navigateur préviendra que l'extension peut lire les sites que tu visites : c'est comme ça qu'elle trouve les spoilers sur tous les sites, et ce qu'elle lit ne quitte jamais ton appareil.",
    "faq.7.q": "Pourquoi n'est-elle pas sur le Chrome Web Store ?",
    "faq.7.a": "Elle est distribuée gratuitement, directement depuis GitHub, pour que chacun puisse vérifier que ce qu'il installe est exactement le code public. L'installation prend une minute environ : voir les étapes plus haut.",

    "final.title": "Une sortie sans spoilers.",
    "final.sub": "Gratuite, open source et 100 % locale. Installe-la en une minute, et mets une étoile au projet s'il t'aide.",
    "final.btn": "Mettre une étoile sur GitHub",

    "foot.tag": "Bloque les spoilers de GTA 6. Partout.",
    "foot.made": "Fait par <a href=\"https://x.com/Nuxhii\" rel=\"noopener\">@Nuxhii</a>.",
    "foot.readme": "Guide d'utilisation (README)",
    "foot.nav": "Pied de page",
    "foot.issues": "Signaler un problème",
    "foot.license": "Licence MIT",
    "foot.disclaimer": "GTA 6 Spoiler Shield est un projet de fan non officiel. Il n'est ni affilié, ni approuvé, ni lié à Rockstar Games ou Take-Two Interactive. Grand Theft Auto, GTA et GTA VI sont des marques de leurs propriétaires respectifs. Aucun logo ni visuel officiel n'est utilisé.",
    "foot.logos": "Les logos des plateformes indiquent seulement la compatibilité et appartiennent à leurs propriétaires respectifs (icônes Simple Icons, CC0)."
  };

  const DICTS = { fr: FR };
  const textNodes = Array.from(document.querySelectorAll("[data-i18n]"));
  const attrNodes = Array.from(document.querySelectorAll("[data-i18n-attr]"));
  const english = new Map(); // element -> original English markup
  const englishAttrs = new Map(); // element -> { attr: original value }

  const store = {
    get() {
      try { return window.localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
    },
    set(value) {
      try { window.localStorage.setItem(STORAGE_KEY, value); } catch (_) { /* storage unavailable: ignore */ }
    }
  };

  for (const el of textNodes) english.set(el, el.innerHTML);
  for (const el of attrNodes) {
    const originals = {};
    for (const pair of el.dataset.i18nAttr.split(";")) {
      const attr = pair.split(":")[0].trim();
      if (attr) originals[attr] = el.getAttribute(attr);
    }
    englishAttrs.set(el, originals);
  }

  let currentLang = "en";
  const langListeners = [];
  const t = (key, el) => {
    const dict = DICTS[currentLang];
    if (dict && dict[key] !== undefined) return dict[key];
    return el ? english.get(el) : undefined;
  };

  function setLang(lang, persist) {
    if (!SUPPORTED.includes(lang)) lang = "en";
    currentLang = lang;

    for (const el of textNodes) el.innerHTML = t(el.dataset.i18n, el);
    for (const el of attrNodes) {
      const originals = englishAttrs.get(el);
      for (const pair of el.dataset.i18nAttr.split(";")) {
        const [attr, key] = pair.split(":").map((part) => part.trim());
        if (!attr || !key) continue;
        const value = t(key);
        el.setAttribute(attr, value !== undefined ? value : originals[attr]);
      }
    }

    document.documentElement.lang = lang;
    for (const button of document.querySelectorAll(".lang-btn")) {
      button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
    }
    if (persist) store.set(lang);
    langListeners.forEach((fn) => fn());
  }

  // Language switcher
  for (const button of document.querySelectorAll(".lang-btn")) {
    button.addEventListener("click", () => setLang(button.dataset.lang, true));
  }
  const saved = store.get();
  if (saved && saved !== "en" && SUPPORTED.includes(saved)) setLang(saved, false);

  // Mobile menu
  const nav = document.querySelector(".nav");
  const menuButton = document.getElementById("menu-btn");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  }
  menuButton.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest(".nav-links a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      setMenu(false);
      menuButton.focus();
    }
  });
  // Close the mobile menu if the window grows past the desktop breakpoint
  const desktop = window.matchMedia("(min-width: 1180px)");
  desktop.addEventListener("change", (event) => { if (event.matches) setMenu(false); });

  // Scroll reveal (sections fade and rise in)
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    for (const el of revealItems) {
      const siblings = Array.from(el.parentElement.children).filter((child) => child.classList.contains("reveal"));
      el.style.setProperty("--d", `${(siblings.indexOf(el) % 4) * 70}ms`);
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("in"));
  }

  // Copy the AI-audit prompt
  const copyButton = document.getElementById("copy-prompt");
  const promptEl = document.getElementById("ai-prompt");
  if (copyButton && promptEl) {
    let timer;
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(promptEl.textContent.trim());
      } catch (_) {
        // Clipboard blocked: select the text so the user can copy it manually.
        const range = document.createRange();
        range.selectNodeContents(promptEl);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      copyButton.textContent = currentLang === "fr" ? FR["oss.copied"] : COPIED_EN;
      clearTimeout(timer);
      timer = setTimeout(() => { copyButton.innerHTML = t("oss.copy", copyButton); }, 1800);
    });
  }

  // Release countdown (local time). Digits flip when they change.
  const countdown = document.getElementById("countdown");
  if (countdown) {
    const release = new Date(countdown.dataset.release).getTime();
    const nums = {};
    countdown.querySelectorAll(".cd-num").forEach((el) => { nums[el.dataset.u] = el; });
    const sr = document.getElementById("cd-sr");
    let lastMinute = -1;
    let timer;
    const pad = (n) => String(n).padStart(2, "0");
    const srText = (d, h, m) => currentLang === "fr"
      ? `Sortie de GTA 6 dans ${d} jours, ${h} heures et ${m} minutes.`
      : `GTA 6 releases in ${d} days, ${h} hours and ${m} minutes.`;
    const setDigit = (unit, value) => {
      const el = nums[unit];
      if (el.textContent === value) return;
      el.textContent = value;
      el.classList.remove("flip");
      void el.offsetWidth; // restart the flip animation
      el.classList.add("flip");
    };
    const tick = () => {
      const left = Math.max(0, release - Date.now());
      if (left === 0) {
        countdown.classList.add("is-done");
        countdown.querySelector(".cd-board").hidden = true;
        countdown.querySelector(".cd-done").hidden = false;
        sr.textContent = "";
        clearInterval(timer);
        return;
      }
      const s = Math.floor(left / 1000);
      const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
      setDigit("d", pad(d)); setDigit("h", pad(h)); setDigit("m", pad(m)); setDigit("s", pad(s % 60));
      if (m !== lastMinute) { lastMinute = m; sr.textContent = srText(d, h, m); }
    };
    tick();
    timer = setInterval(tick, 1000);
    langListeners.push(() => { lastMinute = -1; tick(); });
  }

  // Smoother mouse-wheel scrolling (eased, like a light inertia).
  // Off for touch screens, keyboard, reduced motion, zoom (Ctrl + wheel) and scrollable areas.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  let target = window.scrollY;
  let current = window.scrollY;
  let animating = false;
  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
  const insideScrollable = (node) => {
    for (let el = node; el && el !== document.body && el.nodeType === 1; el = el.parentElement) {
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) return true;
    }
    return false;
  };
  const step = () => {
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.5) current = target;
    window.scrollTo({ top: current, behavior: "instant" });
    if (current !== target) requestAnimationFrame(step);
    else animating = false;
  };
  window.addEventListener("wheel", (event) => {
    if (reduceMotion.matches || !finePointer.matches || event.ctrlKey || event.defaultPrevented) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || insideScrollable(event.target)) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? window.innerHeight : 1;
    if (!animating) { target = window.scrollY; current = window.scrollY; }
    target = Math.max(0, Math.min(maxScroll(), target + event.deltaY * unit));
    if (!animating) { animating = true; requestAnimationFrame(step); }
  }, { passive: false });
  // Keyboard, scrollbar or anchor links move the page: follow them.
  window.addEventListener("scroll", () => { if (!animating) { target = current = window.scrollY; } }, { passive: true });
})();
