(function () {
  const TEXT = 'Find your community';
  const TEXT2 = 'If you have something to share';
  const TEXT3 = 'There\u2019s a place for you here.';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeBack = t => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  let last = '';
  let cShift = 0;
  let fitW = 0;
  function fitChips(sec) {
    const row = document.getElementById('cn-chips');
    if (!row) return;
    const w = row.clientWidth;
    if (!w || w === fitW) return;
    fitW = w;
    const items = row.querySelectorAll('.cn-chip');
    items.forEach(c => { c.style.display = 'inline-flex'; });
    const gap = 8;
    const plusEl = row.querySelector('.cn-plus');
    let used = plusEl ? plusEl.offsetWidth + gap : 0, full = false;
    items.forEach(c => {
      if (c === plusEl) return;
      if (full) { c.style.display = 'none'; return; }
      const cw = c.offsetWidth;
      if (used + cw > w) { c.style.display = 'none'; full = true; }
      else used += cw + gap;
    });
    last = '';
  }
  const ind = { x: 0, w: 0, o: 0, init: false };
  function navIndicator() {
    const el = document.getElementById('tk-ind');
    if (!el || !el.parentElement) return;
    const nav = el.parentElement;
    if (!nav.offsetParent) return;
    const vh = window.innerHeight;
    let target = null, best = 0;
    nav.querySelectorAll('.tk-nav-item[data-sec]').forEach(btn => {
      const s = document.getElementById(btn.dataset.sec);
      if (!s) return;
      const r = s.getBoundingClientRect();
      const vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (vis > vh * 0.35 && vis > best) { best = vis; target = btn; }
    });
    const tx = target ? target.offsetLeft : ind.x;
    const tw = target ? target.offsetWidth : ind.w;
    const to = target ? 1 : 0;
    if (!ind.init && target) { ind.x = tx; ind.w = tw; ind.init = true; }
    const k = 0.16;
    ind.x += (tx - ind.x) * k; ind.w += (tw - ind.w) * k; ind.o += (to - ind.o) * 0.12;
    if (Math.abs(tx - ind.x) < 0.1) ind.x = tx;
    if (Math.abs(tw - ind.w) < 0.1) ind.w = tw;
    el.style.transform = 'translate3d(' + ind.x.toFixed(2) + 'px,0,0)';
    el.style.width = ind.w.toFixed(2) + 'px';
    el.style.opacity = ind.o.toFixed(3);
    nav.querySelectorAll('.tk-nav-item').forEach(b => {
      const on = b === target;
      if (on) b.setAttribute('aria-current', 'location'); else b.removeAttribute('aria-current');
    });
  }
  function frame() {
    requestAnimationFrame(frame);
    navIndicator();
    const sec = document.getElementById('community');
    if (!sec) return;
    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -vh || r.top > vh * 2) return;
    const range = Math.max(1, sec.offsetHeight - vh);
    const P = clamp(-r.top / range, 0, 1);
    const p = clamp(P / 0.6, 0, 1);
    const key = P.toFixed(4) + '|' + vh;
    if (key === last) return;
    last = key;

    const bar = document.getElementById('cn-bar');
    const typed = document.getElementById('cn-typed');
    const caret = document.getElementById('cn-caret');
    const copy = document.getElementById('cn-copy');
    const chips = sec.querySelectorAll('.cn-chip');

    // 1. search bar soft pop
    const b = seg(p, 0.02, 0.12);
    if (bar) {
      const s = 0.92 + 0.08 * easeBack(b);
      bar.style.opacity = easeOut(b).toFixed(3);
      bar.style.transform = 'translate3d(0,' + ((1 - easeOut(b)) * 26).toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
    }
    // 2. typing
    const t = seg(p, 0.14, 0.3);
    const bs = seg(p, 0.64, 0.7);
    const t2 = seg(p, 0.72, 0.8);
    const bs2 = seg(p, 0.82, 0.85);
    const t3 = seg(p, 0.86, 0.91);
    let str;
    if (t3 > 0) str = TEXT3.slice(0, Math.round(t3 * TEXT3.length));
    else if (bs2 > 0) str = TEXT2.slice(0, Math.round((1 - bs2) * TEXT2.length));
    else if (t2 > 0) str = TEXT2.slice(0, Math.round(t2 * TEXT2.length));
    else if (bs > 0) str = TEXT.slice(0, Math.round((1 - bs) * TEXT.length));
    else str = TEXT.slice(0, Math.round(t * TEXT.length));
    if (typed && typed.textContent !== str) typed.textContent = str;
    const busy = (t > 0 && t < 1) || (bs > 0 && t3 < 1);
    if (caret) caret.style.opacity = b > 0.6 && (busy || p < 0.14) ? '1' : '0';
    // 3. chips one by one + copy alongside
    fitChips(sec);
    const vis = Array.prototype.filter.call(chips, c => c.style.display !== 'none');
    const step = 0.22 / Math.max(1, vis.length);
    vis.forEach((c, i) => {
      const a = 0.33 + i * step;
      const k = seg(p, a, a + 0.1);
      c.style.opacity = easeOut(k).toFixed(3);
      c.style.transform = 'translate3d(0,' + ((1 - easeOut(k)) * 18).toFixed(1) + 'px,0) scale(' + (0.9 + 0.1 * easeBack(k)).toFixed(4) + ')';
    });
    const nt = document.getElementById('cn-notif');
    if (nt) {
      const k = seg(p, 0.915, 0.94);
      const e = easeBack(k);
      nt.style.opacity = Math.min(1, k * 2.5).toFixed(3);
      const nt2 = document.getElementById('cn-notif2');
      const k2 = seg(p, 0.955, 0.98);
      const e2 = easeBack(k2);
      const bump = nt2 ? -(nt2.offsetHeight + 10) * easeOut(k2) : 0;
      nt.style.transform = 'translate3d(calc(' + ((1 - e) * 100).toFixed(2) + '% + ' + ((1 - e) * 60).toFixed(1) + 'px),' + bump.toFixed(1) + 'px,0)';
      const copyEl = document.getElementById('cn-copy');
      const block = copyEl && copyEl.parentElement;
      if (nt2 && copyEl && block) {
        const copyBottomBase = copyEl.getBoundingClientRect().bottom + cShift;
        const abiTarget = nt2.getBoundingClientRect().top - 10 - nt.offsetHeight;
        const need = Math.max(0, copyBottomBase + 16 - abiTarget);
        cShift = need * easeOut(k2);
        block.style.transform = cShift ? 'translate3d(0,' + (-cShift).toFixed(1) + 'px,0)' : '';
      }
      if (nt2) {
        nt2.style.opacity = Math.min(1, k2 * 2.5).toFixed(3);
        nt2.style.transform = 'translate3d(calc(' + ((1 - e2) * 100).toFixed(2) + '% + ' + ((1 - e2) * 60).toFixed(1) + 'px),0,0)';
      }
    }
    // scene 2
    const s1 = document.getElementById('cn-s1');
    const s2 = document.getElementById('cn-s2');
    const sl = seg(P, 0.62, 0.71);
    const se = sl < 0.5 ? 4 * sl * sl * sl : 1 - Math.pow(-2 * sl + 2, 3) / 2;
    if (s1) { s1.style.transform = 'translate3d(0,' + (-se * 100).toFixed(3) + '%,0)'; s1.style.opacity = (1 - se * 0.6).toFixed(3); }
    if (s2) s2.style.transform = 'translate3d(0,' + ((1 - se) * 100).toFixed(3) + '%,0)';
    const rise = (el, k, d) => { if (!el) return; const e = easeOut(k); el.style.opacity = e.toFixed(3); el.style.transform = 'translate3d(0,' + ((1 - e) * d).toFixed(1) + 'px,0)'; };
    rise(document.getElementById('cn-head'), seg(P, 0.69, 0.75), 22);
    rise(document.getElementById('cn-left'), seg(P, 0.72, 0.78), 22);
    sec.querySelectorAll('.cn-cm').forEach((c, i) => {
      const a = 0.78 + i * 0.05;
      const k = seg(P, a, a + 0.045);
      const e = easeOut(k);
      c.style.opacity = e.toFixed(3);
      c.style.transform = 'translate3d(' + ((1 - e) * 36).toFixed(1) + 'px,' + ((1 - e) * 10).toFixed(1) + 'px,0) scale(' + (0.94 + 0.06 * easeBack(k)).toFixed(4) + ')';
    });
    const cp = seg(p, 0.33, 0.5);
    if (copy) {
      copy.style.opacity = easeOut(cp).toFixed(3);
      copy.style.transform = 'translate3d(0,' + ((1 - easeOut(cp)) * 16).toFixed(1) + 'px,0)';
    }
  }
  requestAnimationFrame(frame);
})();
