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

  // Scroll position along the row, in "cards": s = 0 is card 0 at the front, s = 1 is card 1, and so on.
  // The row starts and ends a little before/after the first and last card so each one can open and close.
  const LEAD = 0.6, P_START = 0.02, P_END = 0.98;
  const HOLD = 0.2;   // fully open while within this distance of the card's own position
  const RAMP = 0.34;  // then eases closed over this distance (overlaps the next card opening)
  const sine = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const sOf = (P, n) => -LEAD + seg(P, P_START, P_END) * (n - 1 + 2 * LEAD);
  const pOf = (sv, n) => P_START + ((sv + LEAD) / (n - 1 + 2 * LEAD)) * (P_END - P_START);

  // Chips are quick keys: glide the page to the point where that card is fully popped out.
  let tween = 0;
  function glideTo(y) {
    cancelAnimationFrame(tween);
    const y0 = window.scrollY, dy = y - y0, t0 = performance.now();
    const dur = Math.min(1600, Math.max(700, Math.abs(dy) * 0.4));
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, y0 + dy * sine(k));
      if (k < 1) tween = requestAnimationFrame(step);
    };
    tween = requestAnimationFrame(step);
  }
  document.addEventListener('click', (e) => {
    const chip = e.target.closest && e.target.closest('#dv-chips .dv-chip');
    const sec = document.getElementById('discover');
    if (!chip || !sec) return;
    e.preventDefault();
    const n = sec.querySelectorAll('.dv-card').length || 5;
    const i = Math.max(0, Math.min(n - 1, +chip.dataset.card || 0));
    const top = sec.getBoundingClientRect().top + window.scrollY;
    glideTo(Math.round(top + pOf(i, n) * Math.max(0, sec.offsetHeight - window.innerHeight)));
  });
  // a wheel or touch during the glide hands control straight back to the visitor
  ['wheel', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, () => cancelAnimationFrame(tween), { passive: true }));

  let last = '', sShown = null, lastT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const sec = document.getElementById('discover');
    if (!sec) return;
    const refit = fitStage(sec);
    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -vh || r.top > vh * 1.5) { sShown = null; return; }
    const enter = clamp(1 - r.top / vh, 0, 1);
    const P = clamp(-r.top / Math.max(1, sec.offsetHeight - vh), 0, 1);

    const track = document.getElementById('dv-track');
    const cards = track ? track.querySelectorAll('.dv-card') : [];
    const N = cards.length || 5;
    // momentum: the row eases toward the scroll position instead of following every wheel tick
    const sTarget = sOf(P, N);
    const dt = Math.min(64, Math.max(1, (now || 0) - lastT)); lastT = now || 0;
    if (sShown === null) sShown = sTarget;
    sShown += (sTarget - sShown) * (1 - Math.exp(-dt / 200));
    if (Math.abs(sTarget - sShown) < 0.0004) sShown = sTarget;

    const key = enter.toFixed(4) + '|' + sShown.toFixed(4) + '|' + vh + '|' + window.innerWidth;
    if (key === last && !refit) return;
    last = key;

    // fade in as the hero scrolls away
    const f = easeOut(seg(enter, 0.25, 1));
    const text = document.getElementById('dv-text'), view = document.getElementById('dv-view');
    if (text) { text.style.opacity = f.toFixed(3); text.style.transform = 'translate3d(0,' + U((1 - f) * 40) + ',0)'; }
    if (view) { view.style.opacity = f.toFixed(3); view.style.transform = 'translate3d(' + U((1 - f) * 120) + ',0,0)'; }
    if (!track || !view || !cards.length) return;

    // Each card opens as it reaches the front, holds, then eases closed while the row moves on;
    // the next card starts opening as the previous one closes, so the motion never stops dead.
    const portrait = window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    const BASE = portrait ? 660 : 560, EXTRA = portrait ? 220 : 420, GAP = 24, VIEW_W = portrait ? 880 : 1176;
    const sv = sShown;
    const widths = [], lefts = [];
    let x0 = 0;
    for (let i = 0; i < N; i++) {
      const d = Math.abs(sv - i);
      const e = sine(clamp(1 - (d - HOLD) / RAMP, 0, 1));
      widths[i] = BASE + EXTRA * e;
      lefts[i] = x0; x0 += widths[i] + GAP;
      const c = cards[i];
      c.style.width = U(widths[i]);
      // hooks for future in-card scroll features: how open the card is, and progress through its hold
      c.style.setProperty('--dv-open', e.toFixed(4));
      c.style.setProperty('--dv-hold', seg(sv, i - HOLD, i + HOLD).toFixed(4));
    }
    // slide between cards over the stretch where neither is fully open, eased at both ends
    const sc = clamp(sv, 0, N - 1);
    const k = Math.min(N - 2, Math.floor(sc));
    const frac = sine(seg(sc - k, HOLD, 1 - HOLD));
    const totalW = x0 - GAP;
    let x = lefts[k] + frac * (lefts[k + 1] - lefts[k]);
    x = Math.min(x, Math.max(0, totalW - VIEW_W));
    track.style.transform = 'translate3d(' + U(-x) + ',0,0)';
    // soft edge only while a card is part-way behind the text column; a card resting at the front stays crisp
    const fade = document.getElementById('dv-fade');
    let edge = Infinity;
    for (let i = 0; i < N; i++) edge = Math.min(edge, Math.abs(x - lefts[i]));
    if (fade) fade.style.opacity = Math.min(1, edge / 40).toFixed(3);

    // light up the chip for the card currently at the front
    const active = Math.round(sc);
    document.querySelectorAll('#dv-chips .dv-chip').forEach((c, i) => {
      if (c.dataset.on !== String(i === active ? 1 : 0)) c.dataset.on = i === active ? '1' : '0';
      if (i === active) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
    });
    cards.forEach((c, i) => { c.dataset.on = i === active ? '1' : '0'; });
  }
  requestAnimationFrame(frame);
})();
