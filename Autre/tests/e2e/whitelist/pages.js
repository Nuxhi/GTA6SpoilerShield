// Pages de test de la liste blanche (structures basées sur les sélecteurs documentés dans sites/*.js
// et sur le DOM réel relevé : YouTube ytd-channel-name a[href="/@…"], Facebook profile_name, Reddit attribut author).
const media = `<script>
  window.makeVideo = function (parent) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 36;
    const ctx = c.getContext('2d'); setInterval(() => { ctx.fillStyle = '#' + Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'); ctx.fillRect(0,0,64,36); }, 50);
    const v = document.createElement('video'); v.srcObject = c.captureStream(15); v.autoplay = true; v.loop = true; v.style.width = '160px';
    parent.appendChild(v); const p = v.play(); if (p && p.catch) p.catch(() => {}); return v;
  };
</script>`;
const css = `<style>body{font:14px sans-serif;margin:10px} article,ytd-rich-item-renderer,ytd-comment-view-model,ytd-reel-video-renderer,ytd-ad-slot-renderer,.box,shreddit-post{display:block;border:1px solid #888;margin:6px 0;padding:6px;width:480px;min-height:60px}</style>`;
const head = (t) => `<!doctype html><title>${t}</title>${css}${media}`;
const nm = (h, label) => `<div data-testid="User-Name"><a href="${h}"><span>${label}</span></a><a href="${h}"><span>@${label}</span></a></div>`;

module.exports = {
  'x.com': (p) => {
    if (p === '/wl') return head('x') + `<main id="tl">
      <article data-testid="tweet" id="a1">${nm('/RockstarGames', 'RockstarGames')}<div data-testid="tweetText">GTA 6 trailer 3</div><div id="m1"></div></article>
      <article data-testid="tweet" id="a2">${nm('/randomuser', 'randomuser')}<div data-testid="tweetText">GTA 6 trailer 3</div></article>
      <article data-testid="tweet" id="a3"><div data-testid="User-Name"><a href="/rockstar_fake"><span>Rockstar Games</span></a><a href="/rockstar_fake"><span>@RockstarGames</span></a></div><div data-testid="tweetText">GTA 6 trailer 3</div></article>
      <article data-testid="tweet" id="a4"><div data-testid="socialContext"><a href="/RockstarGames">Rockstar Games a reposté</a></div>${nm('/unknownorigin', 'unknownorigin')}<div data-testid="tweetText">GTA 6 leak</div></article>
      <article data-testid="tweet" id="a5">${nm('/RockstarGames', 'RockstarGames')}<div data-testid="tweetText">Regardez ça</div>
        <div role="link" id="q5">${nm('/randomguy', 'randomguy')}<div>GTA 6 ending leak</div></div></article>
      <article data-testid="tweet" id="a6">${nm('/RockstarGames', 'RockstarGames')}<div data-testid="tweetText">Regardez ça aussi</div>
        <div role="link" id="q6">${nm('/RockstarGames', 'RockstarGames')}<div>GTA 6 annonce officielle</div></div></article>
      <article data-testid="tweet" id="a7">${nm('/RockstarGames', 'RockstarGames')}<div data-testid="tweetText">Citation non isolable GTA 6</div>
        <div id="q7">${nm('/randomguy', 'randomguy')}</div></article>
      <article data-testid="tweet" id="a8"><div data-testid="tweetText">GTA 6 sans auteur dans le DOM</div></article>
      <article data-testid="tweet" id="a9">${nm('/randomuser', 'randomuser')}<div data-testid="tweetText">GTA 6 : réponse d'un inconnu sous un post officiel</div></article>
      <article data-testid="tweet" id="a10"><div data-testid="User-Name"><a href="https://evil.com/RockstarGames"><span>Rockstar</span></a></div><div data-testid="tweetText">GTA 6 lien étranger</div></article>
      <article data-testid="tweet" id="a11">${nm('/RockstarGames', 'RockstarGames')}<div data-testid="tweetText">GTA 6 avec mention <a href="/unknown">@unknown</a></div></article>
      <article data-testid="tweet" id="a12">${nm('/randomuser', 'randomuser')}<div data-testid="tweetText">GTA 6 autre post du même inconnu</div></article>
    </main><script>makeVideo(document.getElementById('m1'));</script>`;
    return undefined;
  },

  'www.youtube.com': (p) => {
    if (p === '/wl') return head('yt') + `<div id="grid">
      <ytd-rich-item-renderer id="y1"><a id="video-title">GTA 6 Trailer officiel</a><ytd-channel-name><a href="/@RockstarGames">Rockstar Games</a></ytd-channel-name></ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="y2"><a id="video-title">GTA 6 Trailer officiel</a><ytd-channel-name><a href="/@RockstarGamesFake">Rockstar Games</a></ytd-channel-name></ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="y3"><a id="video-title">GTA 6 Trailer officiel</a><ytd-channel-name><a href="/channel/UC6VcWc1rAoWdBCM0JxrRQ3A">Rockstar Games</a></ytd-channel-name></ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="y4"><a id="video-title">GTA 6 Trailer collab</a><ytd-channel-name><a href="/@RockstarGames">Rockstar Games</a></ytd-channel-name><ytd-channel-name><a href="/@somebody">somebody</a></ytd-channel-name></ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="y5"><a id="video-title">GTA 6 Trailer</a><ytd-channel-name><a href="/@unknownchan">x</a></ytd-channel-name><div id="description-text">merci à <a href="/@RockstarGames">Rockstar</a></div></ytd-rich-item-renderer>
      <ytd-ad-slot-renderer id="y6">Publicité GTA 6 précommande</ytd-ad-slot-renderer>
      <ytd-comment-view-model id="c1"><a id="author-text" href="/@unknownuser">unknownuser</a><div id="content-text">GTA 6 spoiler en commentaire</div></ytd-comment-view-model>
      <ytd-comment-view-model id="c2"><a id="author-text" href="/@RockstarGames">Rockstar Games</a><div id="content-text">GTA 6 réponse officielle</div></ytd-comment-view-model>
      <ytd-rich-item-renderer id="y7"><a id="video-title">GTA 6 sans chaîne</a></ytd-rich-item-renderer>
    </div>`;
    if (p === '/shorts/x') return head('yt') + `
      <ytd-reel-video-renderer id="s1"><span>GTA 6 #shorts</span><ytd-channel-name><a href="/@RockstarGames">Rockstar Games</a></ytd-channel-name><div id="v1"></div></ytd-reel-video-renderer>
      <ytd-reel-video-renderer id="s2"><span>GTA 6 #shorts</span><ytd-channel-name><a href="/@unknownchan">u</a></ytd-channel-name><div id="v2"></div></ytd-reel-video-renderer>
      <script>makeVideo(document.getElementById('v1')); makeVideo(document.getElementById('v2'));</script>`;
    if (p.startsWith('/@RockstarGames')) return `<!doctype html><title>Rockstar Games - YouTube</title>
      <link rel="canonical" href="https://www.youtube.com/channel/UC6VcWc1rAoWdBCM0JxrRQ3A"><meta itemprop="identifier" content="UC6VcWc1rAoWdBCM0JxrRQ3A"><body>Chaîne</body>`;
    if (p.startsWith('/@Menteur')) return `<!doctype html><title>Menteur</title>
      <link rel="canonical" href="https://www.youtube.com/channel/UCaaaaaaaaaaaaaaaaaaaaaa"><meta itemprop="identifier" content="UCbbbbbbbbbbbbbbbbbbbbbb"><body>Incohérent</body>`;
    return undefined;
  },

  'www.reddit.com': (p) => {
    if (p !== '/wl') return undefined;
    return head('r') + `<script>
      class P extends HTMLElement { constructor(){ super(); this.attachShadow({mode:'open'}).innerHTML = '<div style="padding:6px;min-height:50px"><slot name="title"></slot></div>'; } }
      customElements.define('shreddit-post', P);
      class C extends HTMLElement { constructor(){ super(); this.attachShadow({mode:'open'}).innerHTML = '<div><slot name="comment"></slot></div>'; } }
      customElements.define('shreddit-comment', C);</script>
      <shreddit-post id="p1" author="RockstarGames" subreddit-prefixed-name="r/rockstar" post-title="GTA 6"><a slot="title">GTA 6 annonce</a></shreddit-post>
      <shreddit-post id="p2" author="randomperson" subreddit-prefixed-name="r/rockstar" post-title="GTA 6"><a slot="title">GTA 6 annonce</a></shreddit-post>
      <shreddit-post id="p3" author="randomperson" subreddit-prefixed-name="r/GTA6" post-title="GTA 6"><a slot="title">GTA 6 discussion</a></shreddit-post>
      <shreddit-post id="p4" author="RockstarGames" post-type="crosspost" subreddit-prefixed-name="r/rockstar" post-title="GTA 6"><a slot="title">GTA 6 crosspost d'un inconnu</a></shreddit-post>
      <shreddit-comment id="rc1" author="randomperson"><div slot="comment">GTA 6 commentaire</div></shreddit-comment>`;
  },

  'www.tiktok.com': (p) => {
    if (p !== '/wl') return undefined;
    return head('tt') + `
      <div data-e2e="recommend-list-item-container" id="t1" style="height:120px"><a href="/@rockstargames">rockstargames</a><div data-e2e="video-desc">GTA 6 trailer avec <a href="/@someoneelse">@someoneelse</a></div><div id="tv1"></div></div>
      <div data-e2e="recommend-list-item-container" id="t2" style="height:120px"><a href="/@randomtok">randomtok</a><div data-e2e="video-desc">GTA 6 trailer</div><div id="tv2"></div></div>
      <div data-e2e="recommend-list-item-container" id="t3" style="height:120px"><a href="/@rockstargames">rockstargames</a><a href="/@duoguy">duoguy</a><div data-e2e="video-desc">GTA 6 duo</div></div>
      <script>makeVideo(document.getElementById('tv1')); makeVideo(document.getElementById('tv2'));</script>`;
  },

  'www.instagram.com': (p) => {
    if (p === '/wl') return head('ig') + `
      <article id="i1"><header><a href="/rockstargames/">rockstargames</a></header><span>GTA 6 trailer</span>
        <ul><li><a href="/rockstargames/">rockstargames</a> GTA 6 légende</li><li><a href="/randomfan/">randomfan</a> GTA 6 spoil commentaire</li><li><a href="/otherfan/">otherfan</a> super</li></ul></article>
      <article id="i2"><header><a href="/randomfan/">randomfan</a></header><span>GTA 6 trailer</span></article>`;
    if (p === '/rockstargames/') return head('ig') + `<main><header><h2>rockstargames</h2><div>Toute l'actu GTA 6</div></header><div id="g">posts</div></main>`;
    return undefined;
  },

  'www.facebook.com': (p) => {
    if (p !== '/wl') return undefined;
    const pn = (href, name) => `<div data-ad-rendering-role="profile_name"><h3><a href="${href}">${name}</a></h3></div>`;
    return head('fb') + `<div role="main"><div role="feed">
      <div id="f1"><div role="article" aria-posinset="1">${pn('https://www.facebook.com/RockstarGames?__cft__[0]=AZh9&__tn__=-]K-R', 'Rockstar Games')}<div dir="auto">GTA 6 trailer</div>
        <div role="article" aria-label="Commentaire de Paul il y a 1 h"><a href="https://www.facebook.com/people/Paul/1234567890">Paul</a><div dir="auto">GTA 6 spoil en commentaire</div></div></div></div>
      <div id="f2"><div role="article" aria-posinset="2">${pn('https://www.facebook.com/RockstarGamesFake', 'Rockstar Games')}<div dir="auto">GTA 6 trailer</div></div></div>
      <div id="f3"><div role="article" aria-posinset="3">${pn('https://www.facebook.com/RockstarGames', 'Rockstar Games')}${pn('https://www.facebook.com/randomgamer', 'Random Gamer')}<div dir="auto">GTA 6 partagé</div></div></div>
      <div id="f4"><div role="article" aria-posinset="4"><div dir="auto">GTA 6 sans en-tête d'auteur</div></div></div>
    </div></div>`;
  },
};
