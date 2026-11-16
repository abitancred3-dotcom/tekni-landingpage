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
  const SEQ = [['disc', 1, 1.7], ['insp', 2, 1.0], ['mood', 3, 1.5], ['collab', 4, 3.0]];
  const LEAD = 0.3, T = 0.8, TAIL = 0.35;
  const TOTAL = LEAD + SEQ.reduce((a, s) => a + s[2], 0) + T * (SEQ.length - 1) + TAIL;
  const REPLIES = [0.56, 0.63, 0.70, 0.77];
  const CONTENT = '.ds-ui,.dv-body,.dv-mb-ui,.cb-ui,.vc-mbimg,.vc-dots';
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
    const byK = {};
    items.forEach(it => {
      const el = it.el, st = el.style, ad = Math.abs(it.d), kk = el.dataset.k;
      byK[kk] = it.e;
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
        else if (kk === 'collab') S.collabScene(prog.collab, el);
        else if (kk === 'mood') S.moodScene(prog.mood, el);
      }
      if (kk === 'insp') {
        const ip = prog.insp, ta = el.querySelector('.dv-insp-a'), tb = el.querySelector('.dv-insp-b');
        const w = Math.sin(Math.PI * ip);
        if (ta) ta.style.transform = 'translate3d(' + U(150) + ',' + U(-10 * w - 40) + ',0) rotate(' + (7 - 3 * w).toFixed(2) + 'deg)';
        if (tb) tb.style.transform = 'translate3d(' + U(200 + 14 * w) + ',' + U(-6 * w) + ',0) rotate(' + (-4 + 3 * w).toFixed(2) + 'deg)';
      }
    });
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
      r.querySelectorAll('.vc-chip').forEach((c, i) => {
        const at = kk === 'disc' ? REPLIES[i] : 0.12 + i * 0.14;
        const e = seg(p, at, at + 0.07);
        c.style.opacity = smooth(e).toFixed(3);
        c.style.transform = 'translate3d(0,' + ((1 - smooth(e)) * 10).toFixed(2) + 'px,0) scale(' + (0.9 + 0.1 * smooth(e)).toFixed(4) + ')';
      });
    });
  }

  function frame(now) {
    requestAnimationFrame(frame);
    topScene();
    vcScene(now);
  }
  requestAnimationFrame(frame);
})();
