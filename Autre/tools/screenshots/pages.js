/**
 * Pages factices pour les captures d'écran du README.
 * 100 % fictif : noms de comptes inventés, aucun logo, aucune marque, AUCUN spoil (les textes parlent
 * seulement d'« une discussion sur GTA 6 » : l'écran noir de l'extension les masque de toute façon).
 */
'use strict';

const avatar = (c, t) => `<div class="av" style="background:${c}">${t}</div>`;

// ── Faux fil façon « microblog » (structure reconnue par le module X de l'extension) ──
const user = (h, name) => `<div data-testid="User-Name"><a href="/${h}"><b>${name}</b></a> <a href="/${h}" class="h">@${h}</a></div>`;
const tweet = (id, h, name, color, text) => `
  <article data-testid="tweet" id="${id}">${avatar(color, name[0])}<div class="body">${user(h, name)}<div data-testid="tweetText">${text}</div></div></article>`;

const feedCss = `<style>
  *{box-sizing:border-box} body{margin:0;background:#f4f6fb;font:15px/1.4 system-ui,"Segoe UI",Roboto,Arial,sans-serif;color:#14171a}
  header{padding:14px 18px;font-weight:700;font-size:18px;background:#fff;border-bottom:1px solid #e1e8ed}
  main{padding:0}
  article{display:flex;gap:12px;padding:14px 18px;background:#fff;border-bottom:1px solid #e1e8ed;position:relative}
  .av{width:44px;height:44px;border-radius:50%;flex:none;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
  .body{flex:1} .h{color:#667} a{color:inherit;text-decoration:none} [data-testid="tweetText"]{margin-top:4px}
  .meta{margin-top:8px;color:#667;font-size:13px}
</style>`;

// ── Faux site vidéo (structure reconnue par le module YouTube) ──
const card = (id, title, chan, handle, grad) => `
  <ytd-rich-item-renderer id="${id}"><div class="thumb" style="background:${grad}"></div>
    <a id="video-title">${title}</a>
    <ytd-channel-name><a href="/@${handle}">${chan}</a></ytd-channel-name><div class="views">12 k views · 2 days ago</div></ytd-rich-item-renderer>`;
const videoCss = `<style>
  *{box-sizing:border-box} body{margin:0;background:#fafafa;font:14px/1.4 system-ui,"Segoe UI",Roboto,Arial,sans-serif;color:#111}
  header{padding:14px 18px;font-weight:700;font-size:18px;background:#fff;border-bottom:1px solid #e5e5e5}
  #grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:18px}
  ytd-rich-item-renderer{display:block;position:relative;background:#fff;border-radius:10px;padding:8px;border:1px solid #eee}
  .thumb{height:96px;border-radius:8px;margin-bottom:8px} #video-title{font-weight:600;display:block;margin-bottom:4px}
  ytd-channel-name a,.views{color:#606060;font-size:13px} ytd-channel-name{display:block} a{text-decoration:none;color:inherit}
</style>`;

const pages = {
  'x.com': () => `<!doctype html><title>Demo timeline</title>${feedCss}
    <header>Demo timeline</header><main id="tl">
      ${tweet('t1', 'nuxhii', 'Nuxhii', '#7b3fe4', 'Coffee first, then code. ☕ Happy Monday everyone!')}
      ${tweet('t2', 'random_fan', 'Random Fan', '#ff2e93', 'Thread: my thoughts on the GTA 6 release date discussion 🧵')}
      ${tweet('t3', 'demo_studio', 'Demo Studio', '#12b5b0', 'Weekly GTA 6 news roundup from our (fictional) studio account.')}
    </main>`,

  'www.youtube.com': () => `<!doctype html><title>Demo videos</title>${videoCss}
    <header>Demo videos</header><div id="grid">
      ${card('v1', 'Easy pancakes in 10 minutes', 'Demo Kitchen', 'demo_kitchen', 'linear-gradient(135deg,#ffd36e,#ff8a3d)')}
      ${card('v2', 'GTA 6 trailer reaction (fictional)', 'Random Gamer', 'random_gamer', 'linear-gradient(135deg,#ff2e93,#7b3fe4)')}
      ${card('v3', 'GTA 6 news roundup (fictional)', 'Nuxhii', 'nuxhii', 'linear-gradient(135deg,#19c3e6,#12b5b0)')}
    </div>`,
};

// ── Bannière originale : même fond que le hero du site (ciel dégradé, soleil rayé, sol en grille) ──
const fontUrl = 'data:font/woff2;base64,' + require('fs').readFileSync(
  require('path').join(__dirname, '..', '..', '..', 'site', 'assets', 'fonts', 'archivo-latin-wdth-normal.woff2')).toString('base64');
const bannerHtml = `<!doctype html><meta charset="utf-8"><style>
  @font-face{font-family:"Archivo";src:url("${fontUrl}") format("woff2");font-weight:100 900;font-stretch:62% 125%}
  *{margin:0;box-sizing:border-box}
  body{width:1280px;height:640px;overflow:hidden;position:relative;font-family:"Archivo",system-ui,"Segoe UI",Arial,sans-serif;color:#fff;
    background:linear-gradient(180deg,#30217a 0%,#54298f 24%,#8a3da4 46%,#bb459f 62%,#ff7f87 80%,#ffbf86 93%,#ffd9a0 100%)}
  .sun{position:absolute;left:50%;bottom:74px;width:320px;height:320px;transform:translateX(-50%);border-radius:50%;
    background:linear-gradient(180deg,#ffe58a 8%,#ffa27a 48%,#ff4f9a 100%);
    -webkit-mask-image:linear-gradient(180deg,#000 0 56%,transparent 56% 60%,#000 60% 67%,transparent 67% 72%,#000 72% 78%,transparent 78% 83%,#000 83% 88%,transparent 88% 92%,#000 92% 95%,transparent 95%);
            mask-image:linear-gradient(180deg,#000 0 56%,transparent 56% 60%,#000 60% 67%,transparent 67% 72%,#000 72% 78%,transparent 78% 83%,#000 83% 88%,transparent 88% 92%,#000 92% 95%,transparent 95%)}
  .floor{position:absolute;left:0;right:0;bottom:0;height:128px;overflow:hidden;
    background:linear-gradient(180deg,#9d5fc9 0%,#d49be3 55%,#f0c8ee 100%);border-top:2px solid rgba(255,224,246,.9);perspective:220px}
  .floor::before{content:"";position:absolute;left:-50%;right:-50%;top:0;height:260%;transform-origin:top center;transform:rotateX(62deg);
    background-image:linear-gradient(rgba(255,255,255,.6) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.6) 2px,transparent 2px);
    background-size:56px 56px;background-position:center top}
  .card{position:absolute;left:0;right:0;top:34px;text-align:center}
  .shield{width:88px;height:88px;margin:0 auto 10px;filter:drop-shadow(0 8px 18px rgba(30,10,80,.35))}
  h1{font-size:84px;line-height:1;font-weight:850;font-stretch:90%;text-shadow:0 4px 30px rgba(30,10,80,.25)}
  p{margin-top:12px;font-size:28px;font-weight:650;color:rgba(255,255,255,.95);text-shadow:0 2px 14px rgba(40,10,80,.45)}
  .tag{display:inline-block;margin-top:18px;padding:9px 24px;border-radius:999px;background:rgba(255,255,255,.94);color:#2b1d4d;font-size:20px;font-weight:750;
    box-shadow:0 14px 30px -14px rgba(80,30,120,.6)}
</style>
<div class="sun"></div><div class="floor"></div>
<div class="card">
  <svg class="shield" viewBox="0 0 24 24"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff2e93"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient></defs>
    <path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z" fill="url(#g)" stroke="#fff" stroke-width="1.2"/>
    <text x="12" y="15.2" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" font-family="Archivo,Arial,sans-serif">6</text></svg>
  <h1>GTA 6 Spoiler Shield</h1>
  <p>Browse the internet without spoilers</p>
  <span class="tag">Unofficial fan project · 100% local</span>
</div>`;

module.exports = { pages, bannerHtml };
