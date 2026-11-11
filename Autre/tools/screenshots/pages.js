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
      ${tweet('t1', 'demo_user', 'Demo User', '#7b3fe4', 'Coffee first, then code. ☕ Happy Monday everyone!')}
      ${tweet('t2', 'random_fan', 'Random Fan', '#ff2e93', 'Thread: my thoughts on the GTA 6 release date discussion 🧵')}
      ${tweet('t3', 'demo_studio', 'Demo Studio', '#12b5b0', 'Weekly GTA 6 news roundup from our (fictional) studio account.')}
    </main>`,

  'www.youtube.com': () => `<!doctype html><title>Demo videos</title>${videoCss}
    <header>Demo videos</header><div id="grid">
      ${card('v1', 'Easy pancakes in 10 minutes', 'Demo Kitchen', 'demo_kitchen', 'linear-gradient(135deg,#ffd36e,#ff8a3d)')}
      ${card('v2', 'GTA 6 trailer reaction (fictional)', 'Random Gamer', 'random_gamer', 'linear-gradient(135deg,#ff2e93,#7b3fe4)')}
      ${card('v3', 'Official GTA 6 news (fictional channel)', 'Demo Channel', 'demo_channel', 'linear-gradient(135deg,#19c3e6,#12b5b0)')}
    </div>`,
};

// ── Bannière originale, couleurs Vice City (aucun logo ni visuel officiel) ──
const bannerHtml = `<!doctype html><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box} body{width:1280px;height:640px;overflow:hidden;font-family:system-ui,"Segoe UI",Roboto,Arial,sans-serif;
    background:linear-gradient(180deg,#2b1d4d 0%,#7b3fe4 28%,#ff2e93 58%,#ff8a3d 82%,#ffd36e 100%);position:relative}
  .sun{position:absolute;left:50%;top:210px;width:420px;height:420px;margin-left:-210px;border-radius:50%;
    background:linear-gradient(180deg,#ffd36e 0%,#ff8a3d 55%,#ff2e93 100%);
    -webkit-mask:repeating-linear-gradient(180deg,#000 0 26px,transparent 26px 32px);mask:repeating-linear-gradient(180deg,#000 0 26px,transparent 26px 32px);
    -webkit-mask-size:100% 100%;opacity:.95}
  .sea{position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(180deg,#19c3e6,#12b5b0 55%,#0b6f80)}
  .grid{position:absolute;left:0;right:0;bottom:0;height:150px;background:
    repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 2px,transparent 2px 64px),repeating-linear-gradient(0deg,rgba(255,255,255,.18) 0 2px,transparent 2px 30px);opacity:.5}
  .palm{position:absolute;bottom:130px;width:12px;background:#1b0f35;border-radius:6px}
  .leaf{position:absolute;height:10px;width:130px;background:#1b0f35;border-radius:50% 50% 0 0;transform-origin:left center}
  .card{position:absolute;left:50%;top:150px;transform:translateX(-50%);width:880px;text-align:center;color:#fff}
  .shield{width:120px;height:120px;margin:0 auto 14px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35))}
  h1{font-size:76px;letter-spacing:1px;font-weight:800;text-shadow:0 4px 18px rgba(43,29,77,.55)}
  p{margin-top:14px;font-size:30px;font-weight:600;text-shadow:0 2px 10px rgba(43,29,77,.6)}
  .tag{display:inline-block;margin-top:22px;padding:8px 22px;border-radius:999px;background:rgba(255,255,255,.92);color:#2b1d4d;font-size:20px;font-weight:700}
</style>
<div class="sun"></div><div class="sea"></div><div class="grid"></div>
<div class="palm" style="left:70px;height:360px;transform:rotate(-4deg)"></div>
<div class="leaf" style="left:76px;bottom:488px;transform:rotate(-20deg)"></div><div class="leaf" style="left:76px;bottom:488px;transform:rotate(25deg)"></div><div class="leaf" style="left:76px;bottom:488px;transform:rotate(-70deg)"></div>
<div class="palm" style="right:90px;height:300px;transform:rotate(5deg)"></div>
<div class="leaf" style="right:96px;bottom:428px;transform:rotate(200deg)"></div><div class="leaf" style="right:96px;bottom:428px;transform:rotate(155deg)"></div><div class="leaf" style="right:96px;bottom:428px;transform:rotate(250deg)"></div>
<div class="card">
  <svg class="shield" viewBox="0 0 24 24"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff2e93"/><stop offset="1" stop-color="#7b3fe4"/></linearGradient></defs>
    <path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z" fill="url(#g)" stroke="#fff" stroke-width="1.2"/>
    <path d="M12 7v10M8 10.5c0-1.4 1.8-2.2 4-2.2s4 .8 4 2.2-1.8 2-4 2.4-4 1-4 2.4 1.8 2.2 4 2.2" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0"/>
    <text x="12" y="15.2" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" font-family="Arial,sans-serif">6</text></svg>
  <h1>GTA 6 Spoiler Shield</h1>
  <p>Browse the internet without spoilers</p>
  <span class="tag">Unofficial fan project · 100% local</span>
</div>`;

module.exports = { pages, bannerHtml };
