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
  // The row pauses on the Moodboard card (index MB) for MB_LEN cards' worth of scrolling while its own
  // sequence plays. "raw" is the scroll position including that pause; s is the row position.
  const MB = 2, MB_LEN = 1.5;
  const sOf = (P, n) => -LEAD + seg(P, P_START, P_END) * (n - 1 + 2 * LEAD + MB_LEN);
  const sFromRaw = raw => raw <= MB ? raw : raw < MB + MB_LEN ? MB : raw - MB_LEN;
  const pOf = (i, n) => P_START + (((i <= MB ? i : i + MB_LEN) + LEAD) / (n - 1 + 2 * LEAD + MB_LEN)) * (P_END - P_START);

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


  // ---------- Inspiration -> Moodboard drag and drop (scroll-driven) ----------
  // Positions are in design units, measured from the top-left of the track (cards sit at y = 0).
  const SRC = { x: 290, y: 119, w: 219, h: 242, rot: -4 };     // right-hand Inspiration tile
  const DST = { x: 108, y: 139, w: 321, rot: 0 };              // where it lands: the Moodboard's only image
  const FRAME_IMG_H = 200, FRAME_PAD = 15;
  const GRAB = { x: 46, y: 34 };                               // where the hand holds the dragged card
  const T_IN = 0.96, T_PRESS = 1.04, T_LIFT = 1.10, T_DROP = 1.86, T_SETTLE = 1.95;
  const lerp = (a, b, t) => a + (b - a) * t;
  const dots = { hover: 0, cx: 0, cy: 0, active: false };
  const unitPx = () => { const st = document.querySelector('.dv-stage'); return st ? parseFloat(st.style.getPropertyValue('--u')) || 1 : 1; };

  function dragScene(sv, lefts, cards, track) {
    const insp = cards[1], mood = cards[2];
    if (!insp || !mood) return;
    const ghost = document.getElementById('dv-ghost');
    const tileB = insp.querySelector('.dv-insp-b');
    if (!ghost) return;
    const L1 = lefts[1], L2 = lefts[2];

    const press = seg(sv, T_PRESS, T_LIFT);          // click and lift
    const drag = sine(seg(sv, T_LIFT, T_DROP));      // carried across
    const settle = seg(sv, T_SETTLE - 0.09, T_SETTLE); // let go
    const picked = sv >= T_PRESS;

    // the source tile dips when clicked and stays dimmed while its copy is carried away
    if (tileB) {
      tileB.style.transform = 'rotate(' + SRC.rot + 'deg)';
      tileB.style.opacity = picked ? '0' : '1';
    }

    // the dragged card: starts as an exact copy of the tile, morphs into a moodboard card on the way
    const m = smooth(seg(drag, 0, 0.35));
    const sx = L1 + SRC.x, sy = SRC.y, ex = L2 + DST.x, ey = DST.y;
    const gx = lerp(sx, ex, drag), gy = lerp(sy, ey, drag) - 70 * Math.sin(Math.PI * drag);
    const lift = smooth(press) * (1 - smooth(settle));
    const w = lerp(SRC.w, DST.w, m), imgH = lerp(SRC.h, FRAME_IMG_H, m), pad = FRAME_PAD * m;
    const rot = lerp(SRC.rot, 0, easeOut(seg(sv, T_PRESS + 0.015, T_LIFT)));
    const dip = 1 - 0.045 * Math.sin(Math.PI * Math.min(1, press * 1.5));
    ghost.style.display = picked ? 'block' : 'none';
    if (picked) {
      ghost.style.width = U(w);
      ghost.style.padding = U(pad) + ' ' + U(pad) + ' ' + U(pad * 0.9);
      ghost.style.transform = 'translate3d(' + U(gx) + ',' + U(gy) + ',0) rotate(' + rot.toFixed(2) + 'deg) scale(' + (dip * (1 + 0.04 * lift)).toFixed(4) + ')';
      ghost.style.borderColor = 'rgba(255,255,255,' + (0.13 * m).toFixed(3) + ')';
      ghost.style.background = 'rgba(0,0,0,' + m.toFixed(3) + ')';
      ghost.style.boxShadow = '0 ' + U(8 + 28 * lift) + ' ' + U(24 + 46 * lift) + ' rgba(0,0,0,' + (0.3 + 0.4 * lift).toFixed(3) + ')';
      const img = ghost.firstElementChild, meta = ghost.lastElementChild;
      if (img) { img.style.height = U(imgH); img.style.borderRadius = U(lerp(10, 8, m)); }
      if (meta) { meta.style.opacity = smooth(seg(m, 0.5, 1)).toFixed(3); meta.style.height = U(m * (34 + 26 * (1 - smooth(settle)))); }
      const hint = ghost.querySelector('.dv-ghost-hint');
      if (hint) hint.style.opacity = (1 - smooth(settle)).toFixed(3);
    }

    // white hand cursor with a small profile badge: glides onto the tile, grabs, carries it, lets go, drifts off
    const cIn = smooth(seg(sv, T_IN, T_PRESS)), cOut = smooth(seg(sv, T_SETTLE - 0.02, T_SETTLE + 0.04));
    let cx, cy;
    if (!picked) { cx = lerp(sx + SRC.w * 0.95, sx + GRAB.x, cIn); cy = lerp(sy + SRC.h * 0.9, sy + GRAB.y, cIn); }
    else { cx = gx + GRAB.x + 34 * cOut; cy = gy + GRAB.y + 26 * cOut; }
    const cursor = document.getElementById('dv-cursor');
    if (cursor) {
      const show = cIn * (1 - cOut);
      cursor.style.display = show > 0.001 ? 'block' : 'none';
      cursor.style.opacity = show.toFixed(3);
      const squeeze = sv >= T_PRESS && sv < T_LIFT ? 1 - 0.1 * Math.sin(Math.PI * press) : 1;
      cursor.style.transform = 'translate3d(' + U(cx) + ',' + U(cy) + ',0) scale(' + squeeze.toFixed(3) + ')';
    }

    // board reacts while the card hovers over it, then calms once it's dropped
    const inside = clamp((cx - L2 + 30) / 110, 0, 1) * clamp((L2 + parseFloat(mood.style.width ? mood.getBoundingClientRect().width : 0) / Math.max(0.0001, unitPx()) - cx + 30) / 110, 0, 1);
    const over = picked ? smooth(inside) * (1 - smooth(seg(sv, T_DROP, T_DROP + 0.05))) : 0;
    dots.hover = over; dots.cx = cx - L2; dots.cy = cy;
    mood.style.borderColor = over > 0.01 ? 'rgba(255,140,190,' + (0.13 + 0.55 * over).toFixed(3) + ')' : '';
    insp.style.zIndex = picked && sv < T_SETTLE + 0.1 ? '3' : '';
    kickDots();
  }

  // dotted moodboard background, with the pulsing magnet effect around the cursor while hovering
  let dotRaf = 0, dotsStill = false;
  function kickDots() { if (!dotRaf) dotRaf = requestAnimationFrame(drawDots); }
  function drawDots(now) {
    dotRaf = 0;
    const cv = document.getElementById('dv-dots');
    if (!cv) return;
    const u = unitPx();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); dotsStill = false; }
    const hv = dots.hover;
    if (hv < 0.001 && dotsStill) return;
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    // resting board: sparse, faint grey dots (as in the reference)
    const S = 40 * u, rBase = 1.35 * u;
    g.fillStyle = '#2c2c2e';
    for (let y = S * 0.6; y < H; y += S) for (let x = S * 0.6; x < W; x += S) { g.beginPath(); g.arc(x, y, rBase, 0, 6.2832); g.fill(); }
    if (hv > 0.001) {
      // while dragging over: a soft-edged disc of denser light-pink dots grows around the held card,
      // with a ripple ring travelling outwards that nudges and doubles the dots it passes
      const px = dots.cx * u, py = dots.cy * u, t = (now || 0) / 1000;
      const Rmax = 420 * u, R = Rmax * (0.35 + 0.65 * hv), edge = 140 * u;
      const s2 = S / 2, rPink = 2.1 * u;
      const period = 1.6, ring = ((t % period) / period) * (R + edge), ring2 = (((t + period / 2) % period) / period) * (R + edge);
      const band = 46 * u;
      for (let y = s2 * 0.2; y < H; y += s2) {
        for (let x = s2 * 0.2; x < W; x += s2) {
          const dx = x - px, dy = y - py, d = Math.hypot(dx, dy);
          if (d > R + edge) continue;
          const k = hv * (d <= R ? 1 : 1 - (d - R) / edge);
          if (k <= 0.02) continue;
          const w1 = Math.max(0, 1 - Math.abs(d - ring) / band), w2 = Math.max(0, 1 - Math.abs(d - ring2) / band);
          const wv = Math.max(w1, w2);
          const ux = d > 0.001 ? dx / d : 0, uy = d > 0.001 ? dy / d : 0;
          const shift = wv * 5 * u;
          const r = rPink * (0.55 + 0.45 * k);
          if (wv > 0.05) { // faint trailing double, like the smeared dots in the video
            g.fillStyle = 'rgba(243,196,212,' + (0.35 * wv * k).toFixed(3) + ')';
            g.beginPath(); g.arc(x - ux * shift * 0.6, y - uy * shift * 0.6, r * 0.9, 0, 6.2832); g.fill();
          }
          g.fillStyle = 'rgba(243,196,212,' + (0.25 + 0.75 * k).toFixed(3) + ')';
          g.beginPath(); g.arc(x + ux * shift, y + uy * shift, r, 0, 6.2832); g.fill();
        }
      }
    }
    dotsStill = hv < 0.001;
    if (!dotsStill) kickDots(); // keep pulsing while hovering
  }

  // ---------- Moodboard sequence (plays while the row pauses on the open Moodboard card) ----------
  const easeBack = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const NOTES = [ // [selector, in-start, in-end, out-start, out-end, resting tilt]
    ['.dv-n-blue',  0.15, 0.23, 0.42, 0.50, -3],
    ['.dv-n-green', 0.26, 0.34, 0.42, 0.50, 3],
    ['.dv-n-pink',  0.53, 0.61, 0.86, 0.94, -3],
    ['.dv-n-lilac', 0.64, 0.72, 0.86, 0.94, 3],
  ];
  function moodScene(mp, mood) {
    if (!mood) return;
    const ui = smooth(seg(mp, 0.02, 0.12)) * (1 - smooth(seg(mp, 0.86, 0.96)));
    const cap = mood.querySelector('.dv-cap');
    if (cap) cap.style.opacity = clamp(1 - smooth(seg(mp, 0, 0.08)) + smooth(seg(mp, 0.9, 1)), 0, 1).toFixed(3);
    const segEl = mood.querySelector('.dv-mb-seg'), tools = mood.querySelector('.dv-mb-tools');
    if (segEl) { segEl.style.opacity = ui.toFixed(3); segEl.style.transform = 'translate3d(0,' + U((1 - ui) * -14) + ',0)'; }
    if (tools) { tools.style.opacity = ui.toFixed(3); tools.style.transform = 'translate3d(0,' + U((1 - ui) * 22) + ',0)'; }
    // the slider sits on Personal, then glides to Collab as the lilac note arrives
    const toCollab = smooth(seg(mp, 0.64, 0.72));
    const pill = mood.querySelector('.dv-mb-pill');
    if (pill) pill.style.transform = 'translate3d(' + U(toCollab * 146) + ',0,0)';
    mood.querySelectorAll('.dv-mb-opt').forEach((o, i) => { o.dataset.on = (i === 0 ? toCollab < 0.5 : i === 1 ? toCollab >= 0.5 : false) ? '1' : '0'; });
    NOTES.forEach(([sel, a, b, c, d, tilt]) => {
      const el = mood.querySelector(sel);
      if (!el) return;
      const e = seg(mp, a, b), o = smooth(seg(mp, c, d));
      const op = smooth(e) * (1 - o);
      el.style.opacity = op.toFixed(3);
      el.style.visibility = op > 0.001 ? 'visible' : 'hidden';
      el.style.transform = 'translate3d(0,' + U((1 - smooth(e)) * 18 - o * 10) + ',0) rotate(' + (tilt - (1 - smooth(e)) * 5).toFixed(2) + 'deg) scale(' + (0.86 + 0.14 * easeBack(e)).toFixed(4) + ')';
    });
  }

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
    const sv = sFromRaw(sShown);
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

    dragScene(sv, lefts, cards, track);
    moodScene(seg(sShown, MB, MB + MB_LEN), cards[MB]);

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
