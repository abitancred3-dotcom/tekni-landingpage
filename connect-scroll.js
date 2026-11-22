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
  // Nav highlight: a slider that travels across the nav as you scroll. It rests on a link
  // while you're inside that section and glides to the next one, tied to the scroll,
  // as the next section comes up.
  const ind = { o: 0 };
  const sm = t => t * t * (3 - 2 * t);
  function navIndicator() {
    const el = document.getElementById('tk-ind');
    if (!el || !el.parentElement) return;
    const nav = el.parentElement;
    if (!nav.offsetParent) return;
    const vh = window.innerHeight;
    const items = [], starts = [];
    nav.querySelectorAll('.tk-nav-item[data-sec]').forEach(btn => {
      const s = document.getElementById(btn.dataset.sec);
      if (!s) return;
      items.push(btn); starts.push(s.getBoundingClientRect().top);
    });
    if (!items.length) return;
    const lastSec = document.getElementById(items[items.length - 1].dataset.sec);
    const end = lastSec.getBoundingClientRect().bottom;
    // fractional position along the links
    // each later section adds 0..1 as its top rises from 85% to 35% of the screen
    let f = 0;
    for (let i = 1; i < items.length; i++) {
      const k = Math.min(1, Math.max(0, (vh * 0.85 - starts[i]) / (vh * 0.5)));
      f += sm(k);
    }
    const i0 = Math.min(items.length - 1, Math.floor(f)), i1 = Math.min(items.length - 1, i0 + 1), t = f - i0;
    const x = items[i0].offsetLeft + (items[i1].offsetLeft - items[i0].offsetLeft) * t;
    const w = items[i0].offsetWidth + (items[i1].offsetWidth - items[i0].offsetWidth) * t;
    // shown from when the first section arrives until the last one has gone
    const on = starts[0] < vh * 0.6 && end > vh * 0.4 ? 1 : 0;
    ind.o += (on - ind.o) * 0.14;
    if (Math.abs(on - ind.o) < 0.002) ind.o = on;
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    el.style.width = w.toFixed(2) + 'px';
    el.style.opacity = ind.o.toFixed(3);
    const cur = on ? items[Math.round(f)] : null;
    nav.querySelectorAll('.tk-nav-item').forEach(btn => {
      if (btn === cur) btn.setAttribute('aria-current', 'location'); else btn.removeAttribute('aria-current');
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
    const p = clamp(P / 0.97, 0, 1);   // the search scene now uses the whole section
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
    const cp = seg(p, 0.33, 0.5);
    if (copy) {
      copy.style.opacity = easeOut(cp).toFixed(3);
      copy.style.transform = 'translate3d(0,' + ((1 - easeOut(cp)) * 16).toFixed(1) + 'px,0)';
    }
  }
  requestAnimationFrame(frame);
})();
