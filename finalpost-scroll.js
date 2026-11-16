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
  // Cards sit in a loop (Inspiration, Discussion, Collaboration, Moodboard). The open card is in the middle with
  // the neighbours collapsed to their header bars; scrolling rolls the next card up into the middle while the
  // current one shrinks to a bar and moves up, and each open card replays its sequence from the row above.
  const HC = 106, GAP = 26;
  const SEQ = [['disc', 1, 1.6], ['collab', 2, 3.0], ['mood', 3, 1.5], ['insp', 4, 0.9]];
  const LEAD = 0.3, T = 0.75, TAIL = 0.3;
  const TOTAL = LEAD + SEQ.reduce((a, s) => a + s[2], 0) + T * (SEQ.length - 1) + TAIL;
  function timeline(raw) {
    const prog = { disc: 0, collab: 0, mood: 0, insp: 0 };
    let t = LEAD, a = SEQ[0][1];
    for (let k = 0; k < SEQ.length; k++) {
      const [key, at, len] = SEQ[k];
      if (raw < t + len) { prog[key] = seg(raw, t, t + len); return { a: raw < t ? at : at, prog }; }
      prog[key] = 1; t += len;
      if (k < SEQ.length - 1) {
        if (raw < t + T) return { a: at + smooth(seg(raw, t, t + T)), prog };
        t += T;
      }
      a = at;
    }
    return { a: SEQ[SEQ.length - 1][1], prog };
  }
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

    const { a, prog } = timeline(shown);
    const cards = [...sec.querySelectorAll('.vc-stack > .dv-card')];
    const N = cards.length;
    if (!N) return;
    const WO = portrait ? 880 : 980, WC = portrait ? 800 : 868, HO = portrait ? 760 : 640;
    const items = cards.map((el, i) => {
      const d = (((i - a) % N) + N * 1.5) % N - N / 2;       // signed distance from the open slot, in [-N/2, N/2)
      const e = smooth(clamp(1 - Math.abs(d), 0, 1));
      return { el, d, e, h: HC + (HO - HC) * e, w: WC + (WO - WC) * e };
    }).sort((p, q) => p.d - q.d);
    let top = 0;
    items.forEach(it => { it.top = top; it.c = top + it.h / 2; top += it.h + GAP; });
    // keep the point between the two cards either side of the open slot centred
    let k = 0;
    while (k < items.length - 2 && items[k + 1].d <= 0) k++;
    const A = items[k], B = items[k + 1];
    const f = B.d - A.d > 1e-6 ? clamp(-A.d / (B.d - A.d), 0, 1) : 0;
    const anchor = A.c + (B.c - A.c) * f;
    const S = window.__dvScenes;
    items.forEach(it => {
      const el = it.el, st = el.style, ad = Math.abs(it.d);
      const op = 1 - smooth(clamp((ad - 1) / 0.6, 0, 1));
      st.width = U(it.w); st.height = U(it.h);
      st.transform = 'translate3d(' + U((WO - it.w) / 2) + ',' + U(it.top - anchor) + ',0)';
      st.opacity = op.toFixed(3);
      st.visibility = op > 0.001 ? 'visible' : 'hidden';
      st.zIndex = String(10 - Math.round(ad * 2));
      st.setProperty('--dv-open', it.e.toFixed(4));
      el.dataset.on = ad < 0.5 ? '1' : '0';
      const peek = el.querySelector('.vc-peek');
      if (peek) peek.style.opacity = (1 - smooth(seg(it.e, 0, 0.5))).toFixed(3);
      const kk = el.dataset.k;
      if (S) {
        if (kk === 'disc') S.discScene(prog.disc, el);
        else if (kk === 'collab') S.collabScene(prog.collab, el);
        else if (kk === 'mood') S.moodScene(prog.mood, el);
      }
      if (kk === 'insp') {
        // the two inspiration tiles lean in as the card is browsed
        const ip = prog.insp, ta = el.querySelector('.dv-insp-a'), tb = el.querySelector('.dv-insp-b');
        const w = Math.sin(Math.PI * ip);
        if (ta) ta.style.transform = 'translate3d(0,' + U(-10 * w) + ',0) rotate(' + (7 - 3 * w).toFixed(2) + 'deg)';
        if (tb) tb.style.transform = 'translate3d(' + U(14 * w) + ',' + U(-6 * w) + ',0) rotate(' + (-4 + 3 * w).toFixed(2) + 'deg)';
      }
    });
    // left-hand description follows whichever card is open
    const pw = sec.querySelector('.vc-ds');
    if (pw) {
      let h = 0;
      const byK = {}; items.forEach(it => { byK[it.el.dataset.k] = it.e; });
      pw.querySelectorAll('.vc-d').forEach(p => { const w = smooth(seg(byK[p.dataset.k] || 0, 0.45, 1)); p.style.opacity = w.toFixed(3); p.style.transform = 'translate3d(0,' + ((1 - w) * 10).toFixed(2) + 'px,0)'; h += p.offsetHeight * w; });
      pw.style.height = h.toFixed(1) + 'px';
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    topScene();
    vcScene(now);
  }
  requestAnimationFrame(frame);
})();
