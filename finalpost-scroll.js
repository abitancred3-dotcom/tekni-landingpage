(function () {
  // run once per page, even if the page runtime evaluates this script twice
  if (window.__fpScrollDoc === document) return;
  window.__fpScrollDoc = document;
  // "More than the final post.": labels take on the page colours one by one as you scroll,
  // then the line underneath rewrites itself word by word.
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const smooth = t => t * t * (3 - 2 * t);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  let last = '';
  function frame(now) {
    requestAnimationFrame(frame);
    const sec = document.getElementById('process');
    if (!sec) return;
    const r = sec.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -vh || r.top > vh * 1.5) return;
    const enter = clamp(1 - r.top / vh, 0, 1);
    const PR = clamp(-r.top / Math.max(1, sec.offsetHeight - vh), 0, 1);
    // section is 380vh (280vh of scroll): the colour + rewrite sequence plays over the first 200vh,
    // then the labels drift up behind the text and fade out before the section leaves
    const P = clamp(PR * 280 / 200, 0, 1);
    const X = seg(PR, 0.69, 0.99);
    const sticky = sec.querySelector('.pr-sticky');
    const W = sticky ? sticky.clientWidth : window.innerWidth, H = sticky ? sticky.clientHeight : vh;
    const t = (now || 0) / 1000;
    const key = enter.toFixed(4) + '|' + P.toFixed(4) + '|' + vh + '|' + Math.floor(t * 30);
    if (key === last) return;
    last = key;

    // labels: arrive as the section comes up, bob gently, then fill with colour (black text) one by one
    sec.querySelectorAll('.pr-tag').forEach((el, i) => {
      const a = seg(enter, 0.3 + i * 0.05, 0.75 + i * 0.05), ea = easeOut(a);
      const c0 = 0.06 + i * 0.055, k = smooth(seg(P, c0, c0 + 0.1));
      const pop = Math.sin(Math.PI * seg(P, c0, c0 + 0.1));
      const bob = Math.sin(t * 0.9 + i * 1.7) * 4;
      const c = el.dataset.c || '#ea3b6c';
      // exit: each label loses its colour as it lifts off, then drifts up and in behind the headline and fades
      const x = seg(X, i * 0.05, i * 0.05 + 0.65), ex = x * x * (1.6 - 0.6 * x);   // eases in, keeps rising
      const kc = k * (1 - smooth(seg(x, 0, 0.3)));
      // floats straight up (with a little sideways sway), passing behind the text and off the top
      const tx = Math.sin(x * Math.PI * 1.2 + i) * 18 * x, ty = -ex * H * 0.75;
      el.style.opacity = (ea * (1 - smooth(seg(x, 0.5, 1)))).toFixed(3);
      el.style.background = 'color-mix(in srgb, ' + c + ' ' + (kc * 100).toFixed(1) + '%, #0b0b0b)';
      el.style.color = 'color-mix(in srgb, #000 ' + (kc * 100).toFixed(1) + '%, #f2f2f4)';
      el.style.borderColor = 'rgba(255,255,255,' + (0.14 * (1 - kc)).toFixed(3) + ')';
      el.style.transform = 'translate(-50%,-50%) translate3d(' + tx.toFixed(2) + 'px,' + ((1 - ea) * 40 + bob + ty).toFixed(2) + 'px,0) rotate(var(--r)) scale(' + ((0.9 + 0.1 * ea + 0.06 * pop) * (1 - 0.12 * ex)).toFixed(4) + ')';
    });

    // subtext: old words lift away one by one, then the new line writes itself in word by word
    const oldW = sec.querySelectorAll('.pr-l0 .pr-w'), newW = sec.querySelectorAll('.pr-l1 .pr-w');
    oldW.forEach((w, i) => {
      const s0 = 0.46 + i * 0.014, k = smooth(seg(P, s0, s0 + 0.07));
      w.style.opacity = (1 - k).toFixed(3);
      w.style.transform = 'translate3d(0,' + (-0.35 * k).toFixed(3) + 'em,0)';
      w.style.filter = k > 0.001 ? 'blur(' + (6 * k).toFixed(2) + 'px)' : '';
    });
    newW.forEach((w, i) => {
      const s0 = 0.56 + i * 0.038, k = easeOut(seg(P, s0, s0 + 0.1));
      w.style.opacity = k.toFixed(3);
      w.style.transform = 'translate3d(0,' + (0.45 * (1 - k)).toFixed(3) + 'em,0)';
      w.style.filter = k < 0.999 ? 'blur(' + (8 * (1 - k)).toFixed(2) + 'px)' : '';
    });
    const l1 = sec.querySelector('.pr-l1'), l0 = sec.querySelector('.pr-l0');
    if (l1 && l0) { const sw = P > 0.6; l1.setAttribute('aria-hidden', sw ? 'false' : 'true'); l0.setAttribute('aria-hidden', sw ? 'true' : 'false'); }
  }
  requestAnimationFrame(frame);
})();
