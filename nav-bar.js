(function () {
  // run once per page, even if the page runtime evaluates this script twice
  if (window.__tkBarDoc === document) return;
  window.__tkBarDoc = document;

  // The nav bar sits wide across the top on load. Once you scroll, its sides slide in
  // and it settles as a compact bar hugging the logo, the section links and Get Started.
  // Scrolling back to the top lets it open out again.
  let widths = null, lastKey = '';
  function measure(bar) {
    const wrap = bar.parentElement;
    const cs = getComputedStyle(wrap), bs = getComputedStyle(bar);
    const full = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const logo = bar.querySelector('.tk-logo'), nav = bar.querySelector('.tk-nav'), right = bar.querySelector('.tk-right');
    const navW = nav && nav.offsetParent ? nav.offsetWidth : 0;
    const side = Math.max(logo ? logo.offsetWidth : 0, right ? right.scrollWidth : 0);
    const gap = parseFloat(bs.columnGap) || 0;
    const chrome = parseFloat(bs.paddingLeft) + parseFloat(bs.paddingRight) + parseFloat(bs.borderLeftWidth) + parseFloat(bs.borderRightWidth);
    // a little breathing room either side of the links, as in the reference
    // phones (links hidden): the bar closes in around the logo and Get Started
    const compact = navW ? Math.ceil(navW + 2 * side + 2 * gap + chrome + 2 * 28)
      : Math.ceil((logo ? logo.offsetWidth : 0) + (right ? right.scrollWidth : 0) + gap + chrome + 28);
    return { full: Math.round(full), compact: Math.min(Math.round(full), compact) };
  }
  function frame() {
    requestAnimationFrame(frame);
    const bar = document.getElementById('tk-bar');
    if (!bar || !bar.offsetParent) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const key = vw + 'x' + vh + (bar.querySelector('.tk-nav') || {}).offsetWidth;
    if (key !== lastKey || !widths) { widths = measure(bar); lastKey = key; }
    const compact = window.scrollY > vh * 0.3;
    const w = (compact ? widths.compact : widths.full) + 'px';
    if (bar.style.maxWidth !== w) bar.style.maxWidth = w;
    if (!bar.classList.contains('tk-ready')) requestAnimationFrame(() => bar.classList.add('tk-ready'));
    bar.classList.toggle('tk-compact', compact);
  }
  requestAnimationFrame(frame);
})();
