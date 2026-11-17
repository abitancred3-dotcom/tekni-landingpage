(function () {
  // run once per page, even if the page runtime evaluates this script twice
  if (window.__fpScrollDoc === document) return;
  window.__fpScrollDoc = document;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const smooth = t => t * t * (3 - 2 * t);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const U = n => 'calc(var(--u) * ' + n.toFixed(2) + ')';
  const progress = sec => { const r = sec.getBoundingClientRect(), vh = window.innerHeight; return { r, vh, P: clamp(-r.top / Math.max(1, sec.offsetHeight - vh), 0, 1), on: !(r.bottom < -vh || r.top > vh * 1.5) }; };

  // ---------- "More than the final post." timeline: the dots grow and fill with colour one by one ----------
  const DOT_COLS = ['#ea3b6c', '#c5dc72', '#96c3ec', '#cba7da'];
  let lastTop = '';
  function topScene() {
    const sec = document.getElementById('process');
    if (!sec) return;
    const { P, on, r, vh } = progress(sec);
    if (!on) return;
    const enter = clamp(1 - r.top / vh, 0, 1);
    const key = P.toFixed(4) + '|' + enter.toFixed(3);
    if (key === lastTop) return;
    lastTop = key;
    sec.querySelectorAll('.pt-dot').forEach((d, i) => {
      const a = 0.08 + i * 0.2, k = smooth(seg(P, a, a + 0.12));
      const pop = Math.sin(Math.PI * seg(P, a, a + 0.12));
      const c = DOT_COLS[i % DOT_COLS.length];
      d.style.transform = 'translate(-50%,-50%) scale(' + (1 + 0.42 * k + 0.12 * pop).toFixed(4) + ')';
      d.style.background = 'color-mix(in srgb, ' + c + ' ' + (k * 100).toFixed(1) + '%, #000)';
      d.style.borderColor = 'color-mix(in srgb, ' + c + ' ' + (k * 100).toFixed(1) + '%, #4a4a4e)';
    });
    const st = sec.querySelector('.pt-sticky');
    if (st) { const f = easeOut(seg(enter, 0.3, 0.95)); st.style.opacity = f.toFixed(3); }
  }

  // ---------- vertical feature carousel ----------
  // Cards sit in a loop (Collaboration, Discussion, Inspiration, Moodboard). The open card sits in the middle
  // with its neighbours collapsed to header bars above and below. Scrolling rolls the stack up through the
  // centre: the open card's content fades, it shrinks to a bar and lifts, while the bar below grows open.
  const HC = 98, GAP = 30;
  const SEQ = [['disc', 1, 1.7], ['insp', 2, 1.3], ['mood', 3, 2.0], ['collab', 4, 2.2]];
  const LEAD = 0.3, T = 0.8, TAIL = 0.35;
  const TOTAL = LEAD + SEQ.reduce((a, s) => a + s[2], 0) + T * (SEQ.length - 1) + TAIL;
  const REPLIES = [0.56, 0.63, 0.70, 0.77];
  const CONTENT = '.ds-ui,.dv-body,.dv-mb-ui,.cb-ui,.cb2,.vc-mbimg,.vc-dotcv';
  // where each card's hold starts on the raw timeline
  const START = {};
  { let t = LEAD; SEQ.forEach(([k, , len], i) => { START[k] = t; t += len + (i < SEQ.length - 1 ? T : 0); }); }
  // Inspiration -> Moodboard drag: the middle image is grabbed while Inspiration is open, carried while the
  // stack rolls on, and dropped onto the Moodboard once it has opened (same beats as the horizontal row)
  const D_IN = START.insp + 0.25, D_PRESS = START.insp + 0.6, D_LIFT = START.insp + 0.8;
  const D_DROP = START.mood + 0.28, D_SETTLE = START.mood + 0.4, MOOD_FROM = START.mood + 0.45;
  const SRC = { x: 368, y: 192, w: 244, h: 268 }, DST = { x: 108, y: 139, w: 321 }, IMG_H = 200, PAD = 15, GRAB = { x: 46, y: 34 };
  const lerp = (p, q, t) => p + (q - p) * t;
  const sine = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const vdots = { hover: 0, cx: 0, cy: 0, still: false };
  function timeline(raw) {
    const prog = { disc: 0, collab: 0, mood: 0, insp: 0 };
    let t = LEAD;
    for (let k = 0; k < SEQ.length; k++) {
      const [key, at, len] = SEQ[k];
      if (raw < t + len) { prog[key] = seg(raw, t, t + len); return { a: at, prog }; }
      prog[key] = 1; t += len;
      if (k < SEQ.length - 1) {
        if (raw < t + T) return { a: at + seg(raw, t, t + T), prog };
        t += T;
      }
    }
    return { a: SEQ[SEQ.length - 1][1], prog };
  }
  // transition easing: a quick, smooth roll like the reference (slow out, fast middle, settle)
  const roll = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  let shown = null, lastT = 0, lastVc = '';
  function vcScene(now) {
    const sec = document.getElementById('vc');
    if (!sec) return;
    const { P, on } = progress(sec);
    if (!on) { shown = null; return; }
    const target = P * TOTAL;
    const dt = Math.min(64, Math.max(1, (now || 0) - lastT)); lastT = now || 0;
    if (shown === null) shown = target;
    shown += (target - shown) * (1 - Math.exp(-dt / 170));
    if (Math.abs(target - shown) < 0.0005) shown = target;
    const portrait = window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    const key = shown.toFixed(4) + '|' + portrait + '|' + window.innerWidth + 'x' + window.innerHeight;
    if (key === lastVc) return;
    lastVc = key;

    const tl = timeline(shown);
    const a = Math.floor(tl.a) + roll(tl.a - Math.floor(tl.a)), prog = tl.prog;
    const cards = [...sec.querySelectorAll('.vc-stack > .dv-card')];
    const N = cards.length;
    if (!N) return;
    const WO = portrait ? 880 : 980, WC = portrait ? 800 : 880, HO = portrait ? 700 : 560;
    const items = cards.map(el => {
      const i = cards.indexOf(el);
      const d = (((i - a) % N) + N * 1.5) % N - N / 2;       // signed distance from the open slot, in [-N/2, N/2)
      const e = clamp(1 - Math.abs(d), 0, 1);
      return { el, d, e, h: HC + (HO - HC) * e, w: WC + (WO - WC) * e };
    }).sort((p, q) => p.d - q.d);
    let top = 0;
    items.forEach(it => { it.top = top; it.c = top + it.h / 2; top += it.h + GAP; });
    let k = 0;
    while (k < items.length - 2 && items[k + 1].d <= 0) k++;
    const A = items[k], B = items[k + 1];
    const f = B.d - A.d > 1e-6 ? clamp(-A.d / (B.d - A.d), 0, 1) : 0;
    const anchor = A.c + (B.c - A.c) * f;
    const S = window.__dvScenes;
    const byK = {}, posK = {};
    items.forEach(it => {
      const el = it.el, st = el.style, ad = Math.abs(it.d), kk = el.dataset.k;
      byK[kk] = it.e; posK[kk] = { x: (WO - it.w) / 2, y: it.top - anchor, e: it.e };
      const op = 1 - smooth(clamp((ad - 1) / 0.55, 0, 1));
      st.width = U(it.w); st.height = U(it.h);
      st.transform = 'translate3d(' + U((WO - it.w) / 2) + ',' + U(it.top - anchor) + ',0)';
      st.opacity = op.toFixed(3);
      st.visibility = op > 0.001 ? 'visible' : 'hidden';
      st.zIndex = String(10 - Math.round(ad * 2));
      st.setProperty('--dv-open', smooth(it.e).toFixed(4));
      el.dataset.on = ad < 0.5 ? '1' : '0';
      // content fades out before a card collapses and only fades in once it is nearly open
      const cv = smooth(seg(it.e, 0.72, 1));
      el.querySelectorAll(CONTENT).forEach(c => { c.style.opacity = cv.toFixed(3); c.style.visibility = cv > 0.001 ? 'visible' : 'hidden'; });
      if (S) {
        if (kk === 'disc') {
          S.discScene(prog.disc, el);
          // after Create, the composer clears away and the post takes its place in the middle
          const comp = el.querySelector('.ds-compose');
          if (comp && !portrait) comp.style.opacity = ((parseFloat(comp.style.opacity) || 0) * (1 - smooth(seg(prog.disc, 0.44, 0.5)))).toFixed(3);
        }
        else if (kk === 'mood') S.moodScene(seg(shown, MOOD_FROM, START.mood + 2.0), el);
      }
      if (kk === 'insp') {
        const t2 = el.querySelector('.vc-t2');
        if (t2) t2.style.opacity = shown >= D_PRESS ? '0' : '1';
      }
      if (kk === 'collab') {
        // lines draw out from the image one by one, then each comment / note pops in at the end of its line
        const cp = prog.collab;
        el.querySelectorAll('.cb2-line').forEach((ln, i) => { const k2 = smooth(seg(cp, 0.06 + i * 0.24, 0.2 + i * 0.24)); ln.style.strokeDashoffset = (1 - k2).toFixed(4); });
        el.querySelectorAll('.cb2-item').forEach((it2, i) => {
          const k2 = seg(cp, 0.18 + i * 0.24, 0.27 + i * 0.24), e2 = smooth(k2);
          it2.style.opacity = e2.toFixed(3);
          it2.style.visibility = k2 > 0.001 ? 'visible' : 'hidden';
          it2.style.transform = 'translate3d(' + U((1 - e2) * -14) + ',0,0) scale(' + (0.92 + 0.08 * e2).toFixed(4) + ')';
        });
      }
      if (kk === 'mood') {
        const mb = el.querySelector('.vc-mbimg');
        if (mb) mb.style.visibility = shown >= D_SETTLE && cv > 0.001 ? 'visible' : 'hidden';
      }
    });
    dragScene(sec, shown, posK, HO);
    // left label and right-hand description + chips follow whichever card is open
    sec.querySelectorAll('.vc-lab').forEach(l => {
      const w = smooth(seg(byK[l.dataset.k] || 0, 0.5, 1));
      l.style.opacity = w.toFixed(3);
      l.style.transform = 'translate3d(0,' + ((1 - w) * 12).toFixed(2) + 'px,0)';
    });
    sec.querySelectorAll('.vc-r').forEach(r => {
      const kk = r.dataset.k, w = smooth(seg(byK[kk] || 0, 0.5, 1));
      r.style.opacity = w.toFixed(3);
      r.style.visibility = w > 0.001 ? 'visible' : 'hidden';
      r.style.marginTop = ((1 - w) * 14).toFixed(2) + 'px';
      const p = prog[kk] || 0;
    });
  }

  function dragScene(sec, raw, posK, HO) {
    const ghost = sec.querySelector('.vc-ghost'), cursor = sec.querySelector('.vc-cursor');
    const mood = sec.querySelector('.vc-stack > .dv-card[data-k="mood"]');
    if (!ghost || !cursor || !posK.insp || !posK.mood) return;
    const sx = SRC.x, sy = -HO / 2 + SRC.y;                       // the tile while Inspiration is open
    const tx = posK.mood.x + DST.x, ty = posK.mood.y + DST.y;      // the landing spot, wherever the Moodboard is now
    const press = seg(raw, D_PRESS, D_LIFT), picked = raw >= D_PRESS;
    const drag = sine(seg(raw, D_LIFT, D_DROP)), settle = seg(raw, D_SETTLE - 0.08, D_SETTLE);
    const m = smooth(seg(drag, 0, 0.35));
    const gx = lerp(sx, tx, drag), gy = lerp(sy, ty, drag) - 70 * Math.sin(Math.PI * drag);
    const lift = smooth(press) * (1 - smooth(settle));
    const w = lerp(SRC.w, DST.w, m), imgH = lerp(SRC.h, IMG_H, m), pad = PAD * m;
    const rot = 3 * Math.sin(Math.PI * drag);
    const dip = 1 - 0.045 * Math.sin(Math.PI * Math.min(1, press * 1.5));
    const showG = picked && raw < D_SETTLE;
    ghost.style.display = showG ? 'block' : 'none';
    if (showG) {
      ghost.style.width = U(w);
      ghost.style.padding = U(pad) + ' ' + U(pad) + ' ' + U(pad * 0.9);
      ghost.style.transform = 'translate3d(' + U(gx) + ',' + U(gy) + ',0) rotate(' + rot.toFixed(2) + 'deg) scale(' + (dip * (1 + 0.04 * lift)).toFixed(4) + ')';
      ghost.style.borderColor = 'rgba(255,255,255,' + (0.13 * m).toFixed(3) + ')';
      ghost.style.background = 'rgba(0,0,0,' + m.toFixed(3) + ')';
      ghost.style.boxShadow = '0 ' + U(8 + 28 * lift) + ' ' + U(24 + 46 * lift) + ' rgba(0,0,0,' + (0.3 + 0.4 * lift).toFixed(3) + ')';
      const img = ghost.firstElementChild, meta = ghost.lastElementChild;
      if (img) { img.style.height = U(imgH); img.style.borderRadius = U(lerp(10, 8, m)); }
      if (meta) { meta.style.opacity = smooth(seg(m, 0.5, 1)).toFixed(3); meta.style.height = U(m * 34); }
    }
    // white hand with the profile badge: glides onto the middle image, grabs it, carries it, lets go, drifts off
    const cIn = smooth(seg(raw, D_IN, D_PRESS)), cOut = smooth(seg(raw, D_SETTLE - 0.02, D_SETTLE + 0.06));
    let cx, cy;
    if (!picked) { cx = lerp(sx + SRC.w * 0.95, sx + GRAB.x, cIn); cy = lerp(sy + SRC.h * 0.95, sy + GRAB.y, cIn); }
    else { cx = gx + GRAB.x + 34 * cOut; cy = gy + GRAB.y + 26 * cOut; }
    const show = cIn * (1 - cOut) * (raw < D_PRESS ? smooth(seg(posK.insp.e, 0.8, 1)) : 1);
    cursor.style.display = show > 0.001 ? 'block' : 'none';
    cursor.style.opacity = show.toFixed(3);
    const squeeze = raw >= D_PRESS && raw < D_LIFT ? 1 - 0.1 * Math.sin(Math.PI * press) : 1;
    cursor.style.transform = 'translate3d(' + U(cx) + ',' + U(cy) + ',0) scale(' + squeeze.toFixed(3) + ')';
    // the board lights up while the image hovers over it, then calms once it's dropped
    const over = picked ? smooth(seg(raw, D_DROP - 0.4, D_DROP - 0.12)) * smooth(seg(posK.mood.e, 0.6, 1)) * (1 - smooth(seg(raw, D_DROP, D_DROP + 0.06))) : 0;
    vdots.hover = over; vdots.cx = cx - posK.mood.x; vdots.cy = cy - posK.mood.y;
    if (mood) mood.style.borderColor = over > 0.01 ? 'rgba(255,140,190,' + (0.13 + 0.55 * over).toFixed(3) + ')' : '';
    vdots.still = false;
  }

  // dotted moodboard background, with the pulsing magnet effect around the held image
  function drawVcDots(now) {
    const sec = document.getElementById('vc');
    const cv = sec && sec.querySelector('.vc-dotcv');
    if (!cv) return;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    const col = sec.querySelector('.vc-col');
    const portrait = window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    const u = col ? col.getBoundingClientRect().width / (portrait ? 880 : 980) : 1;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); vdots.still = false; }
    const hv = vdots.hover;
    if (hv < 0.001 && vdots.still) return;
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const S = 40 * u, rBase = 1.35 * u;
    g.fillStyle = '#2c2c2e';
    for (let y = S * 0.6; y < H; y += S) for (let x = S * 0.6; x < W; x += S) { g.beginPath(); g.arc(x, y, rBase, 0, 6.2832); g.fill(); }
    if (hv > 0.001) {
      const px = vdots.cx * u, py = vdots.cy * u, t = (now || 0) / 1000;
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
          const wv = Math.max(0, 1 - Math.abs(d - ring) / band, 1 - Math.abs(d - ring2) / band);
          const ux = d > 0.001 ? dx / d : 0, uy = d > 0.001 ? dy / d : 0;
          const shift = wv * 5 * u, r = rPink * (0.55 + 0.45 * k);
          if (wv > 0.05) { g.fillStyle = 'rgba(243,196,212,' + (0.35 * wv * k).toFixed(3) + ')'; g.beginPath(); g.arc(x - ux * shift * 0.6, y - uy * shift * 0.6, r * 0.9, 0, 6.2832); g.fill(); }
          g.fillStyle = 'rgba(243,196,212,' + (0.25 + 0.75 * k).toFixed(3) + ')';
          g.beginPath(); g.arc(x + ux * shift, y + uy * shift, r, 0, 6.2832); g.fill();
        }
      }
    }
    vdots.still = hv < 0.001;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    topScene();
    vcScene(now);
    drawVcDots(now);
  }
  requestAnimationFrame(frame);
})();
