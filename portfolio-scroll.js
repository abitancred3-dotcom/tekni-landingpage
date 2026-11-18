(function () {
  // run once per page, even if the page runtime evaluates this script twice
  if (window.__pfScrollDoc === document) return;
  window.__pfScrollDoc = document;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeBack = t => { const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const C = n => 'calc(var(--c) * ' + n.toFixed(2) + ')';
  const rise = (el, k, dist) => {
    if (!el) return;
    const e = easeOut(k);
    el.style.opacity = e.toFixed(3);
    el.style.transform = 'translate3d(0,' + ((1 - e) * dist).toFixed(1) + 'px,0)';
  };

  // card 1: the two tiles bump over to the right and a third slides in from the left
  function gridCard(card, t) {
    const tiles = card.querySelectorAll('.pf-tile');
    if (tiles.length < 3) return;
    const shift = 111 * easeBack(seg(t, 0.05, 0.55));
    const slide = easeOut(seg(t, 0.4, 1));
    tiles[0].style.transform = 'translate3d(' + C(31 + shift) + ',0,0)';
    tiles[1].style.transform = 'translate3d(' + C(142 + shift) + ',0,0)';
    tiles[2].style.transform = 'translate3d(' + C(31 - 141 * (1 - slide)) + ',0,0)';
  }

  // card 2: "Branding" is typed into the tab name field, confirmed, and added to the list
  const WORD = 'Branding';
  function tabsCard(card, t) {
    const typed = card.querySelector('.pf-typed'), caret = card.querySelector('.pf-caret'), ph = card.querySelector('.pf-ph');
    const ok = card.querySelector('.pf-ok'), chip = card.querySelector('.pf-new');
    if (!typed || !chip) return;
    const n = Math.floor(seg(t, 0.04, 0.5) * (WORD.length + 0.999));
    const press = seg(t, 0.56, 0.66), added = t >= 0.64;
    const txt = added ? '' : WORD.slice(0, n);
    if (typed.textContent !== txt) typed.textContent = txt;
    ph.style.display = txt ? 'none' : '';
    caret.style.opacity = (t > 0.02 && !added) ? '1' : '0';
    caret.style.marginLeft = txt ? '1px' : '0';
    const pr = Math.sin(Math.PI * press);
    ok.style.background = 'rgba(255,255,255,' + (0.14 * pr).toFixed(3) + ')';
    ok.style.color = pr > 0.05 ? '#ececee' : '';
    ok.style.transform = 'scale(' + (1 - 0.12 * pr).toFixed(3) + ')';
    // the new tab rises out of the field into the list
    const k = easeOut(seg(t, 0.64, 1));
    chip.style.opacity = k.toFixed(3);
    chip.style.transform = 'translate3d(0,' + C((1 - k) * 44) + ',0) scale(' + (0.92 + 0.08 * k).toFixed(3) + ')';
  }

  // card 3: the template grid rearranges (tall/short blocks swap within each column)
  function templateCard(card, t) {
    const g = card.querySelectorAll('.pf-g');
    if (g.length < 4) return;
    const a = easeIO(seg(t, 0.05, 0.75)), b = easeIO(seg(t, 0.25, 0.95));
    const lerp = (x, y, k) => x + (y - x) * k;
    const put = (el, top, h) => { el.style.top = C(top); el.style.height = C(h); };
    put(g[0], 37, lerp(138, 84, a));           // left column: tall → short on top
    put(g[2], lerp(193, 139, a), lerp(84, 138, a));
    put(g[1], 36, lerp(84, 138, b));           // right column: short → tall on top
    put(g[3], lerp(137, 192, b), lerp(139, 84, b));
  }

  const SCENES = [gridCard, tabsCard, templateCard];
  let last = '';
  function frame() {
    requestAnimationFrame(frame);
    const sec = document.getElementById('portfolio');
    if (!sec) return;
    const r = sec.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -vh || r.top > vh * 1.5) return;
    const portrait = window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    const text = sec.querySelector('.pf-text');
    const cards = sec.querySelectorAll('.pf-card');
    if (cards.length < 3) return;
    const tops = Array.from(cards, c => c.getBoundingClientRect().top);
    const key = r.top.toFixed(1) + '|' + tops.map(v => v.toFixed(1)).join(',') + '|' + vh + '|' + portrait;
    if (key === last) return;
    last = key;

    if (!portrait) {
      // pinned: everything enters together, then the three cards play one after another while it holds
      const enter = clamp(1 - r.top / vh, 0, 1);
      rise(text, seg(enter, 0.3, 0.75), 30);
      cards.forEach((c, i) => rise(c, seg(enter, 0.4 + i * 0.09, 0.8 + i * 0.09), 40));
      const p = clamp(-r.top / Math.max(1, sec.offsetHeight - vh), 0, 1);
      SCENES.forEach((f, i) => f(cards[i], seg(p, 0.04 + i * 0.3, 0.3 + i * 0.3)));
    } else {
      // phones: normal flow, each card rises in and plays as it reaches the middle of the screen
      const vis = el => (vh - el.getBoundingClientRect().top) / vh;
      rise(text, seg(vis(text), 0.05, 0.3), 24);
      cards.forEach((c, i) => {
        rise(c, seg(vis(c), 0.05, 0.3), 30);
        SCENES[i](c, clamp((vh * 0.5 - tops[i]) / (vh * 0.35), 0, 1));
      });
    }
  }
  requestAnimationFrame(frame);
})();
