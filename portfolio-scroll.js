(function () {
  // run once per page, even if the page runtime evaluates this script twice
  if (window.__pfScrollDoc === document) return;
  window.__pfScrollDoc = document;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeBack = t => { const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const C = n => 'calc(var(--c) * ' + n.toFixed(2) + ')';
  const rise = (el, k, dist) => {
    if (!el) return;
    const e = easeOut(k);
    el.style.opacity = e.toFixed(3);
    el.style.transform = 'translate3d(0,' + ((1 - e) * dist).toFixed(1) + 'px,0)';
  };
  let last = '';

  // ---------- "Make it your own." portfolio cards ----------
  // the cards rise in one after another; then in the first card the two grey tiles bump over
  // to the right and a third slides in from the left (a new grid layout)
  function frame() {
    requestAnimationFrame(frame);
    const sec = document.getElementById('portfolio');
    if (!sec) return;
    const r = sec.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -vh || r.top > vh * 1.5) return;
    const portrait = window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    const text = sec.querySelector('.pf-text');
    const cards = sec.querySelectorAll('.pf-card');
    if (!cards.length) return;
    const c1 = cards[0].getBoundingClientRect();
    const key = r.top.toFixed(1) + '|' + c1.top.toFixed(1) + '|' + vh + '|' + portrait;
    if (key === last) return;
    last = key;

    let p;
    if (!portrait) {
      // pinned: everything enters together as the section arrives, then the tiles move while it holds
      const enter = clamp(1 - r.top / vh, 0, 1);
      rise(text, seg(enter, 0.3, 0.75), 30);
      cards.forEach((c, i) => rise(c, seg(enter, 0.4 + i * 0.09, 0.8 + i * 0.09), 40));
      p = clamp(-r.top / Math.max(1, sec.offsetHeight - vh), 0, 1);
    } else {
      // phones: normal flow, each piece rises as it scrolls into view
      const vis = el => (vh - el.getBoundingClientRect().top) / vh;
      rise(text, seg(vis(text), 0.05, 0.3), 24);
      cards.forEach(c => rise(c, seg(vis(c), 0.05, 0.3), 30));
      p = clamp((vh * 0.45 - c1.top) / (vh * 0.3), 0, 1);
    }

    const tiles = cards[0].querySelectorAll('.pf-tile');
    if (tiles.length >= 3) {
      const shift = 111 * easeBack(seg(p, 0.1, 0.38));
      const slide = easeOut(seg(p, 0.3, 0.62));
      tiles[0].style.transform = 'translate3d(' + C(31 + shift) + ',0,0)';
      tiles[1].style.transform = 'translate3d(' + C(142 + shift) + ',0,0)';
      tiles[2].style.transform = 'translate3d(' + C(31 - 141 * (1 - slide)) + ',0,0)';
    }
  }
  requestAnimationFrame(frame);
})();
