(function () {
  // Discover section: vertical scroll drives a horizontal row of five cards past the fixed intro text.
  if (window.__dvScrollDoc === document) return; // run once, even if the page runtime evaluates this twice
  window.__dvScrollDoc = document;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const smooth = t => t * t * (3 - 2 * t);
  const U = n => 'calc(var(--u) * ' + n.toFixed(2) + ')';

  // Same fitting as the Customise section, so both sections share one scale and clear the nav the same way.
  function fitStage(sec) {
    const stage = sec.querySelector('.dv-stage');
    const wrap = stage && stage.parentElement;
    if (!wrap) return false;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const portrait = window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    const navEl = document.querySelector('.tk-start') || document.querySelector('.tk-nav');
    const navB = navEl ? Math.max(0, Math.round(navEl.getBoundingClientRect().bottom)) : 80;
    const k = W + 'x' + H + (portrait ? 'p' : 'l') + navB;
    if (!W || !H || stage.dataset.fit === k) return false;
    stage.dataset.fit = k;
    stage.style.position = portrait ? 'relative' : 'absolute';
    if (portrait) {
      stage.style.left = stage.style.top = '';
      stage.style.width = W + 'px'; stage.style.height = H + 'px';
      stage.style.setProperty('--u', (W / 1000).toFixed(4) + 'px');
    } else {
      const BAND_TOP = 145, BAND_H = 835;
      const top0 = navB + Math.max(28, H * 0.04), bottomGap = Math.max(36, H * 0.05);
      const avail = Math.max(200, H - top0 - bottomGap);
      const u = Math.min(W / 2000, avail / BAND_H);
      const bandTop = top0 + (avail - BAND_H * u) / 2;
      stage.style.width = (2000 * u).toFixed(2) + 'px'; stage.style.height = (1125 * u).toFixed(2) + 'px';
      stage.style.left = ((W - 2000 * u) / 2).toFixed(2) + 'px';
      stage.style.top = (bandTop - BAND_TOP * u).toFixed(2) + 'px';
      stage.style.setProperty('--u', u.toFixed(4) + 'px');
    }
    return true;
  }

  let last = '';
  function frame() {
    requestAnimationFrame(frame);
    const sec = document.getElementById('discover');
    if (!sec) return;
    const refit = fitStage(sec);
    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -vh || r.top > vh * 1.5) return;
    const enter = clamp(1 - r.top / vh, 0, 1);
    const P = clamp(-r.top / Math.max(1, sec.offsetHeight - vh), 0, 1);
    const key = enter.toFixed(4) + '|' + P.toFixed(4) + '|' + vh + '|' + window.innerWidth;
    if (key === last && !refit) return;
    last = key;

    // fade in as the hero scrolls away
    const f = easeOut(seg(enter, 0.25, 1));
    const text = document.getElementById('dv-text'), view = document.getElementById('dv-view');
    if (text) { text.style.opacity = f.toFixed(3); text.style.transform = 'translate3d(0,' + U((1 - f) * 40) + ',0)'; }
    if (view) { view.style.opacity = f.toFixed(3); view.style.transform = 'translate3d(' + U((1 - f) * 120) + ',0,0)'; }

    // Each card takes a turn at the front: it widens out, holds (room for more scroll features),
    // then eases back in while the row slides on to the next card.
    const track = document.getElementById('dv-track');
    if (!track || !view) return;
    const cards = track.querySelectorAll('.dv-card');
    const N = cards.length;
    if (!N) return;
    const portrait = window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    const BASE = portrait ? 660 : 560, EXTRA = portrait ? 200 : 320, GAP = 24, VIEW_W = portrait ? 880 : 1176;
    // slot timing within each card's share of the scroll
    const GROW_END = 0.18, HOLD_END = 0.68;
    const T = seg(P, 0.03, 0.97) * N;
    const k = Math.min(N - 1, Math.floor(T));
    const u = T - k;
    const grow = smooth(seg(u, 0, GROW_END));
    const shrink = smooth(seg(u, HOLD_END, 1));
    const slide = k < N - 1 ? shrink : 0;
    const open = grow * (1 - shrink);
    const widths = [], lefts = [];
    let x0 = 0;
    for (let i = 0; i < N; i++) {
      const e = i === k ? open : 0;
      widths[i] = BASE + EXTRA * e;
      lefts[i] = x0; x0 += widths[i] + GAP;
      const c = cards[i];
      c.style.width = U(widths[i]);
      // hooks for future in-card scroll features: how open the card is, and progress through its hold
      c.style.setProperty('--dv-open', e.toFixed(4));
      c.style.setProperty('--dv-hold', (i === k ? seg(u, GROW_END, HOLD_END) : (i < k ? 1 : 0)).toFixed(4));
    }
    const totalW = x0 - GAP;
    let x = lefts[k] + (k < N - 1 ? slide * (lefts[k + 1] - lefts[k]) : 0);
    x = Math.min(x, Math.max(0, totalW - VIEW_W));
    track.style.transform = 'translate3d(' + U(-x) + ',0,0)';
    // soft edge where cards slide behind the text column (off at rest so the first card's border stays crisp)
    const fade = document.getElementById('dv-fade');
    // only when a card is part-way behind the edge; a card resting at the front stays crisp
    let edge = Infinity;
    for (let i = 0; i < N; i++) edge = Math.min(edge, Math.abs(x - lefts[i]));
    if (fade) fade.style.opacity = Math.min(1, edge / 40).toFixed(3);

    // light up the chip for the card currently at the front
    const active = Math.min(N - 1, k + (slide > 0.5 ? 1 : 0));
    document.querySelectorAll('#dv-chips .dv-chip').forEach((c, i) => {
      if (c.dataset.on !== String(i === active ? 1 : 0)) c.dataset.on = i === active ? '1' : '0';
    });
    cards.forEach((c, i) => { c.dataset.on = i === active ? '1' : '0'; });
  }
  requestAnimationFrame(frame);
})();
