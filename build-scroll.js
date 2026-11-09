(function () {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let last = '';
  function frame() {
    requestAnimationFrame(frame);
    const list = document.getElementById('bd-list');
    if (!list) return;
    const r = list.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -vh || r.top > vh * 1.5) return;
    const head = document.getElementById('bd-head');
    if (head) {
      const top = (parseFloat(getComputedStyle(head).top) || 0) + head.offsetHeight + 18;
      const v = top.toFixed(0) + 'px';
      if (list.style.getPropertyValue('--bd-top') !== v) list.style.setProperty('--bd-top', v);
    }
    const cards = list.querySelectorAll('.bd-card');
    const key = cards.length ? cards[cards.length - 1].getBoundingClientRect().top.toFixed(1) + '|' + vh : '';
    if (key === last) return;
    last = key;
    const tops = [], stick = [];
    cards.forEach((c, i) => {
      tops[i] = c.getBoundingClientRect().top;
      stick[i] = parseFloat(getComputedStyle(c).top) || 0;
    });
    cards.forEach((c, i) => {
      // how many later cards have arrived on top of this one (fractional)
      let depth = 0;
      for (let j = i + 1; j < cards.length; j++) {
        const h = cards[j].offsetHeight || 1;
        const dist = tops[j] - stick[j];
        depth += clamp(1 - dist / (h * 1.1), 0, 1);
      }
      const s = 1 - depth * 0.04;
      const inner = c.firstElementChild;
      c.style.transform = 'scale(' + s.toFixed(4) + ')';
      if (inner) inner.style.filter = 'brightness(' + (1 - clamp(depth, 0, 3) * 0.12).toFixed(3) + ')';
      c.style.zIndex = String(i + 1);
    });
  }
  requestAnimationFrame(frame);
})();
