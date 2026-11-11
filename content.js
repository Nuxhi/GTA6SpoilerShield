/**
 * content.js — Moteur de GTA 6 Spoiler Shield.
 *
 * Chargé (après keywords.js, matcher.js, util.js et sites/*.js) à document_start.
 *
 * Principe :
 *   1. Chaque module de site (sites/*.js) déclare des « règles » : un sélecteur de
 *      conteneur de post/carte/commentaire + comment en extraire le texte.
 *   2. Le moteur analyse chaque conteneur (texte + auteur) avec matcher.js.
 *   3. Si ça correspond : le conteneur est rendu invisible (visibility:hidden)
 *      et recouvert d'un overlay noir (Shadow DOM) ; les vidéos sont mises en
 *      pause et coupées.
 *   4. Un MutationObserver traite le contenu chargé dynamiquement :
 *        - passe « rapide » SYNCHRONE sur les nouveaux conteneurs (avant le
 *          prochain rendu → pas de spoil visible une fraction de seconde) ;
 *        - passe « debounce » (150 ms) pour les contenus qui se remplissent
 *          après coup, et pour le repli générique.
 *   5. Pré-masquage : dès document_start, les conteneurs connus sont cachés
 *      tant qu'ils n'ont pas été analysés (filet de sécurité : réaffichés
 *      automatiquement après 1,2 s si l'analyse n'a pas eu lieu).
 *
 * Aucune donnée ne quitte la machine : tout est local.
 */
(function () {
  'use strict';
  const G = self.G6S;
  if (!G || !G.matcher || !G.util || G.__engine) return;
  G.__engine = true;

  const { matcher, util } = G;
  const DEFAULTS = G.DEFAULT_SETTINGS;

  // ── Site courant & règles ───────────────────────────────────────────────
  const site = (G.sites || []).find((s) => s.hosts.test(location.hostname)) || null;
  const isGeneric = !site;
  const rules = (site ? site.rules : G.genericRules || []).map((r) =>
    Object.assign({}, r, { sel: r.selectors ? r.selectors.join(',') : null })
  );

  // ── État ────────────────────────────────────────────────────────────────
  let settings = Object.assign({}, DEFAULTS);
  let ready = false;                 // réglages chargés ?
  let states = new WeakMap();        // élément -> état d'analyse
  const live = new Set();            // éléments bloqués (pour nettoyage / comptage)
  const byTarget = new WeakMap();    // cible de l'overlay -> état
  const firstSeen = new WeakMap();   // élément -> date de première vue (texte vide)
  const totalSeen = new WeakMap();   // élément -> signature déjà comptée au total
  const flaggedAuthors = new Map();  // "site:pseudo" -> libellé (profils liés à GTA 6)
  let pageCount = 0;
  let newlyBlocked = 0;
  let profileCover = null;

  const COVERED =
    '[data-g6s-state="hidden"],[data-g6s-state="kept"],[data-g6s-state="revealed"],[data-g6s-state="collapsed"]';
  const VOID_TAGS = new Set(['img', 'video', 'audio', 'input', 'br', 'hr', 'canvas', 'iframe', 'source', 'svg']);

  function safe(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Overlay (Shadow DOM → insensible aux CSS du site)
  // ═══════════════════════════════════════════════════════════════════════
  // Le CSS de l'overlay est ici (et non dans styles.css) car il vit dans un
  // Shadow DOM, que les feuilles de style de la page / de l'extension n'atteignent pas.
  const OVERLAY_CSS = `
    :host { all: initial; }
    .wrap { position: sticky; top: 0; box-sizing: border-box; width: 100%;
      height: min(100%, 100vh); min-height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center; gap: 4px;
      padding: 12px; overflow: hidden; background: #000; color: #fff;
      font: 14px/1.35 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
    .msg { font-weight: 700; font-size: 15px; }
    .short { display: none; }
    .why { font-size: 11px; opacity: .6; max-width: 90%; overflow-wrap: anywhere; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 8px; }
    button { cursor: pointer; border: 1px solid #fff; background: transparent; color: #fff;
      border-radius: 6px; padding: 6px 12px; font: inherit; font-size: 12px; }
    button.primary { background: #fff; color: #000; }
    button:hover { opacity: .85; }
    button:focus-visible { outline: 2px solid #6cf; outline-offset: 2px; }
    .compact { gap: 2px; padding: 6px; }
    .compact .msg { font-size: 12px; }
    .compact .why { display: none; }
    .compact .actions { margin-top: 4px; gap: 4px; }
    .compact button { padding: 3px 8px; font-size: 11px; }
    .tiny { flex-direction: row; gap: 8px; padding: 0 6px; }
    .pill { background: #fff; color: #000; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; }
    button.cancel { border-color: #fff; }
    .compact .pill { padding: 3px 8px; font-size: 11px; }
    .tiny .pill { padding: 0 6px; font-size: 10px; line-height: 1.5; }
    .tiny .long, .tiny .keep, .tiny .why { display: none; }
    .tiny .short { display: inline; }
    .tiny button { white-space: nowrap; }
    .tiny .msg { font-size: 11px; }
    .tiny .actions { margin: 0; }
    .tiny button { padding: 0 6px; font-size: 10px; line-height: 1.5; }
  `;
  let overlaySheet = null;
  function adoptOverlayStyle(shadow) {
    try {
      if (!overlaySheet) { overlaySheet = new CSSStyleSheet(); overlaySheet.replaceSync(OVERLAY_CSS); }
      shadow.adoptedStyleSheets = [overlaySheet];
    } catch (e) {
      const style = document.createElement('style');
      style.textContent = OVERLAY_CSS;
      shadow.appendChild(style);
    }
  }

  const HOST_STYLE =
    'position:absolute!important;top:0!important;right:0!important;bottom:0!important;left:0!important;' +
    'z-index:2147483000!important;visibility:visible!important;display:block!important;' +
    'margin:0!important;padding:0!important;border:0!important;background:#000!important;' +
    'opacity:1!important;transform:none!important;pointer-events:auto!important;';

  const SWALLOWED_EVENTS = ['click', 'auxclick', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'contextmenu'];
  function swallow(e) {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
  }

  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver((entries) => {
        for (const en of entries) {
          const st = byTarget.get(en.target);
          if (st && st.wrap) updateSize(st);
        }
      })
    : null;

  function mkEl(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function mkMsg(longText, shortText) {
    const msg = mkEl('div', 'msg');
    msg.appendChild(mkEl('span', 'long', longText));
    msg.appendChild(mkEl('span', 'short', shortText));
    return msg;
  }

  /** Bouton avec libellé long (par défaut) et court (variante minuscule). */
  function mkButton(text, cls, onClick, shortText) {
    const b = mkEl('button', cls);
    if (shortText) {
      b.appendChild(mkEl('span', 'long', text));
      b.appendChild(mkEl('span', 'short', shortText));
    } else {
      b.textContent = text;
    }
    b.type = 'button';
    b.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); onClick(); });
    return b;
  }

  /** Libellés du décompte : « Affichage dans 5… » (long) / « 5… » (variante minuscule). */
  function countLabels(n) {
    return { long: 'Affichage dans ' + n + '…', short: n + '…' };
  }

  /**
   * (Re)construit le contenu de l'overlay selon l'état :
   * masqué / gardé masqué, éventuellement avec un compte à rebours en cours.
   */
  function render(st) {
    const wrap = st.wrap;
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    st.countLong = st.countShort = st.cancelBtn = st.revealBtn = null;
    const kept = st.status === 'kept';
    const actions = mkEl('div', 'actions');

    wrap.appendChild(kept
      ? mkMsg('Contenu masqué', 'Masqué')
      : mkMsg('Contenu lié à GTA 6 – spoil possible', 'Spoil GTA 6'));
    if (!kept) wrap.appendChild(mkEl('div', 'why', 'Détecté : ' + st.res.label));

    if (st.countdown) {
      // Décompte en cours : un « bouton » d'état (non cliquable) + Annuler.
      const lbl = countLabels(st.countdown.remaining);
      const pill = mkEl('span', 'pill');
      st.countLong = mkEl('span', 'long', lbl.long);
      st.countShort = mkEl('span', 'short', lbl.short);
      pill.appendChild(st.countLong);
      pill.appendChild(st.countShort);
      actions.appendChild(pill);
      st.cancelBtn = mkButton('Annuler', 'cancel', () => cancelCountdown(st));
      actions.appendChild(st.cancelBtn);
    } else if (kept) {
      st.revealBtn = mkButton('Afficher', 'primary', () => requestReveal(st));
      actions.appendChild(st.revealBtn);
    } else {
      st.revealBtn = mkButton('Afficher quand même', 'primary', () => requestReveal(st), 'Afficher');
      actions.appendChild(st.revealBtn);
      actions.appendChild(mkButton('Garder masqué', 'keep', () => keep(st)));
    }
    wrap.appendChild(actions);
    updateSize(st);
  }

  // ── Compte à rebours avant révélation (anti-clic par erreur) ───────────
  /** Interrompt le décompte ; `silent` = ne pas redessiner l'overlay (il va être retiré). */
  function cancelCountdown(st, silent) {
    const cd = st.countdown;
    if (!cd) return;
    clearInterval(cd.timer);
    if (cd.io) cd.io.disconnect();
    st.countdown = null;
    if (!silent && st.wrap) {
      render(st);
      if (st.revealBtn) st.revealBtn.focus({ preventScroll: true });
    }
  }

  function cancelAllCountdowns() {
    for (const el of live) {
      const st = states.get(el);
      if (st && st.countdown) cancelCountdown(st);
    }
  }

  function tickCountdown(st) {
    const cd = st.countdown;
    if (!cd) return;
    cd.remaining -= 1;
    if (cd.remaining <= 0) {
      cancelCountdown(st, true);
      reveal(st);
      return;
    }
    const lbl = countLabels(cd.remaining);
    if (st.countLong) st.countLong.textContent = lbl.long;
    if (st.countShort) st.countShort.textContent = lbl.short;
  }

  /** Clic sur « Afficher (quand même) » : décompte, sauf si le délai réglé est 0. */
  function requestReveal(st) {
    const delay = settings.revealDelay;
    if (!(delay > 0)) { reveal(st); return; }
    if (st.countdown || !st.wrap) return;
    st.countdown = { remaining: delay, timer: setInterval(() => tickCountdown(st), 1000), io: null };
    // L'élément sort de l'écran pendant le décompte → on annule.
    if (typeof IntersectionObserver === 'function') {
      st.countdown.io = new IntersectionObserver((entries) => {
        if (entries.length && !entries[entries.length - 1].isIntersecting) cancelCountdown(st);
      });
      st.countdown.io.observe(st.target);
    }
    render(st);
    if (st.cancelBtn) st.cancelBtn.focus({ preventScroll: true });
  }

  function updateSize(st) {
    const r = st.target.getBoundingClientRect();
    const tiny = r.height > 0 && (r.height < 44 || r.width < 120);
    const compact = !tiny && r.height > 0 && (r.height < 150 || r.width < 300);
    st.wrap.classList.toggle('tiny', tiny);
    st.wrap.classList.toggle('compact', compact);
  }

  function mountOverlay(st) {
    const t = st.target;
    t.setAttribute('data-g6s-state', 'hidden');

    // L'overlay est en position:absolute → la cible doit être « positionnée ».
    const cs = getComputedStyle(t);
    if (cs.position === 'static') {
      st.restore.position = [t.style.getPropertyValue('position'), t.style.getPropertyPriority('position')];
      t.style.setProperty('position', 'relative', 'important');
    }
    if (cs.display === 'inline') {
      st.restore.display = [t.style.getPropertyValue('display'), t.style.getPropertyPriority('display')];
      t.style.setProperty('display', 'block', 'important');
    }

    const host = document.createElement('div');
    host.setAttribute('data-g6s-overlay', '');
    host.style.cssText = HOST_STYLE;
    const shadow = host.attachShadow({ mode: 'closed' });
    adoptOverlayStyle(shadow);
    const wrap = mkEl('div', 'wrap');
    wrap.addEventListener('keydown', (e) => e.stopPropagation());
    shadow.appendChild(wrap);
    for (const ev of SWALLOWED_EVENTS) host.addEventListener(ev, swallow);

    st.host = host;
    st.wrap = wrap;
    render(st);
    // Hôte avec shadow root ouvert (ex. <shreddit-post>) : on se place DANS son
    // shadow root, sinon un enfant non « slotté » ne serait pas rendu.
    (t.shadowRoot || t).appendChild(host);
    byTarget.set(t, st);
    if (resizeObserver) resizeObserver.observe(t);
  }

  function restoreInlineStyles(st) {
    const t = st.target;
    for (const prop of ['position', 'display']) {
      const saved = st.restore[prop];
      if (!saved) continue;
      if (saved[0]) t.style.setProperty(prop, saved[0], saved[1]);
      else t.style.removeProperty(prop);
    }
    st.restore = {};
  }

  function removeOverlay(st) {
    cancelCountdown(st, true);
    if (st.host) { st.host.remove(); st.host = null; st.wrap = null; }
    if (resizeObserver) resizeObserver.unobserve(st.target);
    restoreInlineStyles(st);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Médias : pause + son coupé tant que le contenu est masqué
  // ═══════════════════════════════════════════════════════════════════════
  function isActiveBlock(st) {
    return st.status === 'hidden' || st.status === 'kept' || st.status === 'collapsed';
  }

  function releaseMedia(st, m, resume) {
    const info = st.media.get(m);
    if (!info) return;
    st.media.delete(m);
    m.removeEventListener('play', st.guard);
    m.removeEventListener('playing', st.guard);
    if (!info.muted && m.muted) m.muted = false;
    if (resume && (info.playing || st.rule.kind === 'player')) {
      const p = safe(() => m.play(), null);
      if (p && p.catch) p.catch(() => {});
    }
  }

  /** Met en pause / coupe le son des médias de la cible, et surveille les relances. */
  function guardMedia(st) {
    // Média déplacé hors de la cible (lecteur partagé de YouTube Shorts…) → on le libère.
    for (const m of [...st.media.keys()]) if (!st.target.contains(m)) releaseMedia(st, m, false);
    for (const m of st.target.querySelectorAll('video, audio')) {
      if (!st.media.has(m)) {
        st.media.set(m, { muted: m.muted, playing: !m.paused });
        m.addEventListener('play', st.guard);
        m.addEventListener('playing', st.guard);
      }
      if (!m.paused) m.pause();
      if (!m.muted) m.muted = true;
    }
  }

  function restoreMedia(st, resume) {
    for (const m of [...st.media.keys()]) releaseMedia(st, m, resume);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Actions utilisateur
  // ═══════════════════════════════════════════════════════════════════════
  function reveal(st) {
    if (st.status === 'revealed') return;
    st.status = 'revealed';
    removeOverlay(st);
    st.target.setAttribute('data-g6s-state', 'revealed');
    restoreMedia(st, true);
  }

  function keep(st) {
    st.status = 'kept';
    st.target.setAttribute('data-g6s-state', 'kept');
    render(st);
  }

  /** Annule complètement un blocage (changement de contenu, de réglage…). */
  function clearBlock(st) {
    if (!st || !st.blocked) return;
    removeOverlay(st);
    if (st.target.getAttribute('data-g6s-state')) st.target.removeAttribute('data-g6s-state');
    restoreMedia(st, false);
    if (st.counted) { pageCount = Math.max(0, pageCount - 1); st.counted = false; }
    st.blocked = false;
    live.delete(st.el);
    scheduleReport();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Blocage d'un élément
  // ═══════════════════════════════════════════════════════════════════════
  function resolveTarget(el, rule) {
    let t = (rule.target && safe(() => rule.target(el), null)) || el;
    if (VOID_TAGS.has(t.localName)) t = t.parentElement || t;
    if (t.firstElementChild && getComputedStyle(t).display === 'contents') t = t.firstElementChild;
    return t;
  }

  function applyBlock(el, rule, sig, res) {
    const st = {
      el, rule, sig, res,
      target: resolveTarget(el, rule),
      status: rule.mode === 'collapse' ? 'collapsed' : 'hidden',
      blocked: true, counted: true,
      media: new Map(), restore: {}, host: null, wrap: null,
    };
    st.guard = (e) => {
      const m = e.target;
      if (!st.target.contains(m) || !isActiveBlock(st)) { releaseMedia(st, m, false); return; }
      m.pause();
      m.muted = true;
    };
    states.set(el, st);
    live.add(el);
    pageCount++;
    if (totalSeen.get(el) !== sig) { totalSeen.set(el, sig); newlyBlocked++; }

    if (st.status === 'collapsed') st.target.setAttribute('data-g6s-state', 'collapsed');
    else mountOverlay(st);
    guardMedia(st);
    scheduleReport();
    return st;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Analyse d'un élément
  // ═══════════════════════════════════════════════════════════════════════
  function markChecked(el) {
    if (!el.hasAttribute('data-g6s-checked')) el.setAttribute('data-g6s-checked', '');
  }

  /**
   * Cette règle ne s'applique (plus) à `el` : on retire SON blocage éventuel.
   * Plusieurs règles peuvent viser le même élément ; la première qui l'analyse en
   * devient « propriétaire » et les autres ne doivent jamais défaire son travail.
   */
  function release(el, rule) {
    const prev = states.get(el);
    if (prev && prev.rule === rule) {
      clearBlock(prev);
      states.delete(el);
    }
  }

  const pendingList = [];
  let pendingTimer = 0;
  function schedulePending(el, rule) {
    pendingList.push([el, rule]);
    if (pendingTimer) return;
    pendingTimer = setTimeout(() => {
      pendingTimer = 0;
      const list = pendingList.splice(0);
      for (const [e, r] of list) processElement(e, r, false);
    }, 250);
  }

  /**
   * @param {Element} el     conteneur candidat
   * @param {object}  rule   règle du site
   * @param {boolean} quick  true = passe rapide : on ne traite que les éléments jamais vus
   */
  function processElement(el, rule, quick) {
    if (!settings.enabled || !el.isConnected) return;
    if (quick && states.has(el)) return;
    const owner = states.get(el);
    if (owner && owner.rule !== rule) return; // déjà pris en charge par une autre règle

    // Déjà recouvert par un ancêtre masqué / révélé : rien à faire de plus.
    const parent = el.parentElement;
    if (parent && parent.closest(COVERED)) { release(el, rule); markChecked(el); return; }

    if (rule.accept && !safe(() => rule.accept(el), false)) { release(el, rule); markChecked(el); return; }

    const text = safe(() => (rule.text ? rule.text(el) : util.extractText(el, rule.textOptions)), '') || '';
    const author = rule.author ? safe(() => rule.author(el), null) : null;
    const full = author && author.text ? text + '\n' + author.text : text;

    // Conteneur encore vide (squelette en cours de chargement) : on attend un peu
    // (il reste pré-masqué), plutôt que de le déclarer « sain » trop tôt.
    if (!full.trim()) {
      const now = Date.now();
      let first = firstSeen.get(el);
      if (first === undefined) { first = now; firstSeen.set(el, now); }
      if (now - first < 1000) { schedulePending(el, rule); return; }
    }

    const flagKey = author && author.id && site ? site.id + ':' + author.id : null;
    const flagged = !!(flagKey && flaggedAuthors.has(flagKey));
    const sig = util.hash(full) + (flagged ? '|F' : '');

    const prev = states.get(el);
    if (prev && prev.sig === sig) {
      if (prev.blocked && isActiveBlock(prev)) guardMedia(prev); // vidéo apparue entre-temps
      markChecked(el);
      return;
    }
    if (prev) clearBlock(prev);

    let res = matcher.evaluate(full);
    if (!res && flagged) {
      res = { category: 'profile', term: author.id, spoil: null, label: 'profil de « ' + author.id + ' » lié à GTA 6' };
    }
    if (res) applyBlock(el, rule, sig, res);
    else states.set(el, { rule, sig, status: 'ok', blocked: false });
    markChecked(el);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // File de traitement budgétée (repli générique : beaucoup d'éléments)
  // ═══════════════════════════════════════════════════════════════════════
  const queue = [];
  let queueTimer = 0;
  function enqueue(el, rule, quick) {
    queue.push([el, rule, quick]);
    if (!queueTimer) queueTimer = setTimeout(drain, 0);
  }
  function drain() {
    queueTimer = 0;
    const start = performance.now();
    while (queue.length && performance.now() - start < 10) {
      const [el, rule, quick] = queue.shift();
      processElement(el, rule, quick);
    }
    if (queue.length) queueTimer = setTimeout(drain, 16);
  }

  function dispatch(el, rule, quick) {
    if (isGeneric) enqueue(el, rule, quick);
    else processElement(el, rule, quick);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Parcours : racines « sales » → conteneurs de chaque règle
  // ═══════════════════════════════════════════════════════════════════════
  function collectInto(set, root, sel) {
    const el = root.el;
    if (el === document) {
      el.querySelectorAll(sel).forEach((e) => set.add(e));
      return;
    }
    // Conteneurs ancêtres (leur contenu a changé), du plus externe au plus interne.
    const chain = [];
    for (let a = el.closest(sel); a; a = a.parentElement && a.parentElement.closest(sel)) chain.push(a);
    for (let i = chain.length - 1; i >= 0; i--) set.add(chain[i]);
    if (root.deep) el.querySelectorAll(sel).forEach((e) => set.add(e));
  }

  function scanPass(roots, quick) {
    for (const rule of rules) {
      if (rule.when && !safe(rule.when, false)) continue;
      const set = new Set();
      // `find` reçoit les racines à analyser (document entier ou nœuds modifiés).
      if (rule.find) for (const e of safe(() => rule.find(roots), []) || []) if (e) set.add(e);
      if (rule.sel) for (const r of roots) collectInto(set, r, rule.sel);
      for (const el of set) dispatch(el, rule, quick);
    }
  }

  const FULL = [{ el: document, deep: true }];
  const dirtyDeep = new Set();
  const dirtyShallow = new Set();
  let needFull = true;
  let passTimer = 0;
  let firstDirtyAt = 0;

  function buildRoots() {
    if (needFull) return FULL;
    const roots = [];
    for (const el of dirtyDeep) if (el.isConnected) roots.push({ el, deep: true });
    for (const el of dirtyShallow) if (el.isConnected && !dirtyDeep.has(el)) roots.push({ el, deep: false });
    return roots;
  }

  function quickPass() {
    if (!ready || !settings.enabled) return;
    if (!needFull && dirtyDeep.size + dirtyShallow.size > 250) return; // le debounce s'en charge
    scanPass(buildRoots(), true);
  }

  function runPass() {
    passTimer = 0;
    firstDirtyAt = 0;
    if (!ready || !settings.enabled) return;
    const roots = buildRoots();
    needFull = false;
    dirtyDeep.clear();
    dirtyShallow.clear();
    scanPass(roots, false);
    checkProfile();
  }

  function schedulePass() {
    const now = Date.now();
    if (!firstDirtyAt) firstDirtyAt = now;
    clearTimeout(passTimer);
    // Debounce 150 ms, mais jamais plus de ~600 ms d'attente (flux continu de mutations).
    passTimer = setTimeout(runPass, now - firstDirtyAt > 600 ? 0 : 150);
  }

  function isOwnMutation(m) {
    const nodes = [...m.addedNodes, ...m.removedNodes];
    return nodes.length > 0 && nodes.every((n) => n.nodeType === 1 && n.hasAttribute('data-g6s-overlay'));
  }

  function onMutations(muts) {
    for (const m of muts) {
      if (m.type === 'childList') {
        if (isOwnMutation(m)) continue;
        for (const n of m.addedNodes) if (n.nodeType === 1) dirtyDeep.add(n);
        if (m.target.nodeType === 1) dirtyShallow.add(m.target);
      } else {
        const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (el) dirtyShallow.add(el);
      }
    }
    if (!dirtyDeep.size && !dirtyShallow.size) return;
    quickPass();
    schedulePass();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Pré-masquage (document_start)
  // ═══════════════════════════════════════════════════════════════════════
  let prehideSheet = null;
  function installPrehide() {
    if (prehideSheet || isGeneric || !settings.enabled) return;
    const sels = [];
    for (const r of rules) {
      // Une règle conditionnelle (`when`) fausse ici ne sera jamais analysée : on ne la pré-masque pas.
      if (!r.selectors || r.prehide === false || (r.when && !safe(r.when, false))) continue;
      sels.push(...r.selectors);
    }
    if (!sels.length) return;
    try {
      const sheet = new CSSStyleSheet();
      sheet.insertRule('@keyframes g6s-failsafe { to { visibility: visible; } }');
      for (const s of sels) {
        // Un sélecteur invalide ne doit pas invalider les autres → une règle chacun.
        safe(() => sheet.insertRule(
          s + ':not([data-g6s-checked]){visibility:hidden;animation:g6s-failsafe 0s linear 1.2s forwards;}'
        ));
      }
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      prehideSheet = sheet;
    } catch (e) { /* pas de pré-masquage : le masquage normal reste actif */ }
  }

  function removePrehide() {
    if (!prehideSheet) return;
    const sheet = prehideSheet;
    prehideSheet = null;
    safe(() => { document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet); });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Profils (bio d'un compte → masque ses posts / toute la page profil)
  // ═══════════════════════════════════════════════════════════════════════
  let saveTimer = 0;
  function saveFlagged() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      while (flaggedAuthors.size > 300) flaggedAuthors.delete(flaggedAuthors.keys().next().value);
      safe(() => chrome.storage.local.set({ flaggedAuthors: Object.fromEntries(flaggedAuthors) }));
    }, 500);
  }

  function dropProfileCover() {
    if (!profileCover) return;
    clearBlock(profileCover);
    states.delete(profileCover.el);
    profileCover = null;
  }

  function checkProfile() {
    const prof = site && site.profile;
    if (!prof || !ready || !settings.enabled) return;
    const info = safe(() => prof.detect(location), null);
    if (!info) { dropProfileCover(); return; }
    const text = safe(() => prof.read(info), null);
    if (text == null) return; // en-tête pas encore chargé

    const key = site.id + ':' + info.id;
    const res = matcher.evaluate(text);
    if (!res) {
      if (flaggedAuthors.delete(key)) saveFlagged();
      dropProfileCover();
      return;
    }
    if (!flaggedAuthors.has(key)) {
      flaggedAuthors.set(key, res.label);
      saveFlagged();
      needFull = true;     // les posts déjà affichés de ce compte doivent être ré-analysés
      schedulePass();
    }
    if (prof.cover) {
      const cover = safe(() => prof.cover(), null);
      if (!cover) return;
      const sig = util.hash(text) + key;
      if (profileCover && profileCover.el === cover && profileCover.sig === sig) return;
      dropProfileCover();
      profileCover = applyBlock(cover, { name: 'profile', kind: 'profile' }, sig, res);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Statistiques (badge + compteur total, gérés par background.js)
  // ═══════════════════════════════════════════════════════════════════════
  let reportTimer = 0;
  function scheduleReport() {
    if (reportTimer) return;
    reportTimer = setTimeout(() => {
      reportTimer = 0;
      const delta = newlyBlocked;
      newlyBlocked = 0;
      try {
        const p = chrome.runtime.sendMessage({ type: 'g6s:stats', pageCount, newlyBlocked: delta });
        if (p && p.catch) p.catch(() => {});
      } catch (e) { /* extension rechargée : on ignore */ }
    }, 300);
  }

  function recount() {
    pageCount = 0;
    for (const el of [...live]) {
      const st = states.get(el);
      if (!el.isConnected || !st || !st.blocked) live.delete(el);
      else if (st.counted) pageCount++;
    }
    scheduleReport();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Réglages
  // ═══════════════════════════════════════════════════════════════════════
  function sanitize(s) {
    return {
      enabled: s.enabled !== false,
      mode: s.mode === 'intermediate' ? 'intermediate' : 'extreme',
      customKeywords: Array.isArray(s.customKeywords)
        ? s.customKeywords.filter((k) => typeof k === 'string' && k.trim()).map((k) => k.trim())
        : [],
      // Délai avant révélation : entier 0–30 s (0 = immédiat).
      revealDelay: Number.isFinite(Number(s.revealDelay))
        ? Math.min(30, Math.max(0, Math.round(Number(s.revealDelay))))
        : DEFAULTS.revealDelay,
    };
  }

  function refreshAll() {
    for (const el of [...live]) clearBlock(states.get(el));
    live.clear();
    dropProfileCover();
    states = new WeakMap();
    pageCount = 0;
    document.querySelectorAll('[data-g6s-checked]').forEach((e) => e.removeAttribute('data-g6s-checked'));
    matcher.configure(settings);
    removePrehide();
    if (settings.enabled) {
      installPrehide();
      needFull = true;
      runPass();
    }
    scheduleReport();
  }

  function loadState() {
    const syncP = new Promise((resolve) => {
      try { chrome.storage.sync.get(DEFAULTS, resolve); } catch (e) { resolve(null); }
    });
    const localP = new Promise((resolve) => {
      try { chrome.storage.local.get({ flaggedAuthors: {} }, resolve); } catch (e) { resolve(null); }
    });
    const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 600));
    return Promise.race([Promise.all([syncP, localP]), timeout]).then((out) => {
      if (Array.isArray(out)) {
        if (out[0]) settings = sanitize(out[0]);
        if (out[1] && out[1].flaggedAuthors) {
          for (const [k, v] of Object.entries(out[1].flaggedAuthors)) flaggedAuthors.set(k, v);
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Navigation sans rechargement (SPA)
  // ═══════════════════════════════════════════════════════════════════════
  let lastHref = location.href;
  function checkUrl() {
    if (location.href === lastHref) return;
    lastHref = location.href;
    cancelAllCountdowns(); // la page change : un décompte en cours est annulé
    dropProfileCover();
    recount();
    needFull = true;
    schedulePass();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Démarrage
  // ═══════════════════════════════════════════════════════════════════════
  installPrehide(); // synchrone, tout de suite

  const observer = new MutationObserver(onMutations);
  observer.observe(document, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ['alt', 'aria-label', 'title'],
  });

  loadState().then(() => {
    matcher.configure(settings);
    ready = true;
    if (!settings.enabled) { removePrehide(); return; }
    needFull = true;
    runPass();
  });

  // Filets de sécurité : DOM prêt / page chargée / navigation SPA.
  document.addEventListener('DOMContentLoaded', () => { needFull = true; schedulePass(); });
  window.addEventListener('load', () => { needFull = true; schedulePass(); });
  window.addEventListener('popstate', checkUrl);
  document.addEventListener('yt-navigate-finish', checkUrl);   // YouTube
  document.addEventListener('yt-page-data-updated', checkUrl); // YouTube
  if (self.navigation && self.navigation.addEventListener) {
    safe(() => self.navigation.addEventListener('navigatesuccess', checkUrl));
  }
  setInterval(checkUrl, 600); // dernier recours : history.pushState n'est pas observable d'ici
  // Onglet masqué = le contenu n'est plus « à l'écran » : on annule aussi les décomptes.
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAllCountdowns(); });

  // Réglages modifiés depuis la popup.
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      const next = Object.assign({}, settings);
      for (const k of Object.keys(DEFAULTS)) if (changes[k]) next[k] = changes[k].newValue;
      const clean = sanitize(next);
      const detectionChanged = clean.mode !== settings.mode ||
        JSON.stringify(clean.customKeywords) !== JSON.stringify(settings.customKeywords);
      const needsRefresh = detectionChanged || clean.enabled !== settings.enabled;
      settings = clean;
      if (detectionChanged) {
        flaggedAuthors.clear();
        safe(() => chrome.storage.local.remove('flaggedAuthors'));
      }
      // Délai de révélation ou thème modifiés : rien à ré-analyser (évite tout clignotement).
      if (needsRefresh) refreshAll();
    });

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (!msg) return;
      if (msg.type === 'g6s:getStats') {
        sendResponse({ pageCount, enabled: settings.enabled, site: site ? site.label : 'Mode générique' });
      }
    });
  } catch (e) { /* hors extension (tests) */ }

  G.engine = { refreshAll, runPass, processElement, get states() { return states; }, get pageCount() { return pageCount; } };
})();
