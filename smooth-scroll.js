(function () {
  if (window.__tekniSmoothDoc === document) return;
  window.__tekniSmoothDoc = document;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var se = document.scrollingElement || document.documentElement;
  var target = window.scrollY, current = window.scrollY, running = false, self = false;
  var EASE = 0.085;

  function maxY() { return Math.max(0, se.scrollHeight - window.innerHeight); }
  function clamp(v) { return Math.min(maxY(), Math.max(0, v)); }

  function tick() {
    var d = target - current;
    if (Math.abs(d) < 0.4) { current = target; running = false; }
    else current += d * EASE;
    self = true;
    window.scrollTo(0, Math.round(current * 100) / 100);
    if (running) requestAnimationFrame(tick);
  }
  function start() { if (!running) { running = true; requestAnimationFrame(tick); } }

  function scrollableParent(el) {
    while (el && el !== document.body && el !== document.documentElement) {
      if (el.nodeType === 1) {
        var st = getComputedStyle(el);
        if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 1) return el;
      }
      el = el.parentNode;
    }
    return null;
  }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.defaultPrevented) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (scrollableParent(e.target)) return;
    e.preventDefault();
    var dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (!running) current = window.scrollY;
    target = clamp(target + dy);
    start();
  }, { passive: false });

  // keep in sync with keyboard, scrollbar drag, touch, programmatic jumps
  window.addEventListener('scroll', function () {
    if (self) { self = false; return; }
    if (!running) { current = target = window.scrollY; }
  }, { passive: true });

  // anchor links glide instead of jumping
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var el = id ? document.getElementById(id) : null;
    if (!el && id !== 'top') return;
    e.preventDefault();
    if (!running) current = window.scrollY;
    target = clamp(el ? el.getBoundingClientRect().top + window.scrollY - 64 : 0);
    start();
  });

  window.addEventListener('resize', function () { target = clamp(target); });
})();
