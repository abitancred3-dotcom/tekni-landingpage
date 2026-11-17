(function () {
  // run once per page, even if the page runtime evaluates this script twice
  if (window.__czScrollDoc === document) return;
  window.__czScrollDoc = document;
  // Customise section: scroll-linked sequence (Multi1 -> Multi2 -> Multi3 -> Multi4)
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const smooth = t => t * t * (3 - 2 * t);
  const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeBack = t => { const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const U = n => 'calc(var(--u) * ' + n.toFixed(2) + ')';
  // wheel layout matches the reference: red right, yellow top, green left, blue bottom, magenta bottom-right
  const hueOf = a => { a = ((a % 360) + 360) % 360; return a <= 180 ? a * 2 / 3 : 120 + (a - 180) * 4 / 3; };

  const WHEEL = { cx: 300, cy: 280, R: 190 };
  const DOT = { a0: 186, a1: 345 };

  let painted = false, last = '';
  function paintWheel() {
    const w = document.getElementById('cz-wheel');
    if (!w || w.dataset.painted === '1') return;
    w.dataset.painted = '1';
    const stops = [];
    for (let t = 0; t <= 360; t += 6) stops.push('hsl(' + hueOf(90 - t).toFixed(1) + ' 100% 50%) ' + t + 'deg');
    w.style.background = 'radial-gradient(circle closest-side, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0) 74%), conic-gradient(' + stops.join(',') + ')';
    painted = true;
  }
  const set = (el, o, tf) => { if (!el) return; el.style.opacity = o.toFixed(3); if (tf !== undefined) el.style.transform = tf; };

  // Fit the 2000x1125 design to the space really available (no container/viewport-unit reliance), centred.
  let fitKey = '';
  function fitStage(sec) {
    const stage = sec.querySelector('.cz-stage');
    const wrap = stage && stage.parentElement;
    if (!wrap) return;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const portrait = window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    // keep the content clear of the fixed nav bar (it stays the same pixel size while the layout scales)
    const navEl = document.querySelector('.tk-start') || document.querySelector('.tk-nav');
    const navB = navEl ? Math.max(0, Math.round(navEl.getBoundingClientRect().bottom)) : 80;
    const k = W + 'x' + H + (portrait ? 'p' : 'l') + navB;
    if (!W || !H || stage.dataset.fit === k) return;
    stage.dataset.fit = k; last = '';
    stage.style.position = portrait ? 'relative' : 'absolute';
    if (portrait) {
      stage.style.left = stage.style.top = '';
      stage.style.width = W + 'px'; stage.style.height = H + 'px';
      stage.style.setProperty('--u', (W / 1000).toFixed(4) + 'px');
    } else {
      // the visible content occupies design rows 145..980 (835 units); centre that band in the
      // space between the nav (plus breathing room) and the bottom of the screen
      const BAND_TOP = 145, BAND_H = 835;
      const top0 = navB + Math.max(28, H * 0.04), bottomGap = Math.max(36, H * 0.05);
      const avail = Math.max(200, H - top0 - bottomGap);
      const u = Math.min(W / 2000, avail / BAND_H);
      const bandTop = top0 + (avail - BAND_H * u) / 2;
      stage.style.width = (2000 * u).toFixed(2) + 'px'; stage.style.height = (1125 * u).toFixed(2) + 'px';
      stage.style.left = ((W - 2000 * u) / 2).toFixed(2) + 'px';
      stage.style.top = (bandTop - BAND_TOP * u).toFixed(2) + 'px';
      stage.style.setProperty('--u', u.toFixed(4) + 'px');
    }
  }
  function frame() {
    requestAnimationFrame(frame);
    const sec = document.getElementById('customise');
    if (!sec) return;
    paintWheel();
    fitStage(sec);
    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -vh || r.top > vh * 1.5) return;
    const enter = clamp(1 - r.top / vh, 0, 1);
    // section is 540vh (S_END = 440vh of scroll). The first 102vh plays as before; the colour step after it
    // runs 45% faster, mapped back onto the original 300vh timeline so every cue keeps its order.
    // From ~196vh the screen step (zoom out, frame, tiles) runs on sNew directly.
    const sNew = clamp(-r.top / Math.max(1, sec.offsetHeight - vh), 0, 1) * S_END;
    const P = clamp((sNew <= 102 ? sNew : 102 + (sNew - 102) / 0.55) / 300, 0, 1);
    const key = enter.toFixed(4) + '|' + sNew.toFixed(2) + '|' + vh + '|' + window.innerWidth + '|' + layoutKey;
    if (key === last) return;
    last = key;
    const $ = id => document.getElementById(id);
    const portrait = window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches;

    // 1. first scroll: Multi1 fades in
    const f = easeOut(seg(enter, 0.25, 1));
    // 3. text bumps up (and slightly right) for the colour step
    const L = portrait ? 0 : easeIO(seg(P, 0.34, 0.47));
    set($('cz-text'), f, 'translate3d(0,' + U(-308 * L + (1 - f) * 40) + ',0)');
    set($('cz-mid'), f, 'translate3d(0,' + U((1 - f) * 60) + ',0) scale(' + (0.97 + 0.03 * f).toFixed(4) + ')');

    // copy swaps
    const out1 = seg(P, 0.08, 0.14), in2 = seg(P, 0.12, 0.19);
    const outA = seg(P, 0.34, 0.39), inB = seg(P, 0.40, 0.46);
    const rise = (k) => 'translate3d(0,' + U((1 - easeOut(k)) * 16) + ',0)';
    set($('cz-h1'), 1 - outA, 'translate3d(0,' + U(-outA * 10) + ',0)');
    set($('cz-h2'), easeOut(inB), rise(inB));
    set($('cz-p1'), 1 - out1, 'translate3d(0,' + U(-out1 * 10) + ',0)');
    set($('cz-p2'), easeOut(in2) * (1 - outA), in2 < 1 ? rise(in2) : 'translate3d(0,' + U(-outA * 10) + ',0)');
    set($('cz-p3'), easeOut(inB), rise(inB));

    // 2. notifications slide out from behind the feed
    const n = easeIO(seg(P, 0.10, 0.22));
    // only the part that has slid past the feed's right edge (stage x 1374) is drawn
    const nEl = $('cz-notif'), nOff = 560 * (1 - n);
    set(nEl, n > 0 ? 1 : 0, 'translate3d(' + U(-nOff) + ',0,0)');
    if (nEl) nEl.style.clipPath = 'inset(0 0 0 ' + U(Math.max(0, nOff - 15)) + ' round ' + U(22) + ')';
    const nr = seg(P, 0.205, 0.26);
    set($('cz-notif-row'), easeOut(nr), 'translate3d(0,' + U((1 - easeOut(nr)) * 14) + ',0) scale(' + (0.95 + 0.05 * easeBack(nr)).toFixed(4) + ')');

    // 3. colour wheel rises, messages drop from behind notifications, then its message pops in
    // wheel rises with the text (same distance and easing) so the gap between them never closes
    const Lw = portrait ? 1 : easeIO(seg(P, 0.34, 0.47));
    set($('cz-wheelblock'), easeOut(seg(P, 0.36, 0.47)), 'translate3d(0,' + U((1 - Lw) * 308) + ',0)');
    const m = easeIO(seg(P, 0.38, 0.49));
    // starts fully tucked behind notifications; only the part below its bottom edge (stage y 535) is drawn
    const mEl = $('cz-msgs'), mOff = 440 * (1 - m);
    set(mEl, m > 0 ? 1 : 0, 'translate3d(0,' + U(-mOff) + ',0)');
    if (mEl) mEl.style.clipPath = 'inset(' + U(Math.max(0, mOff - 27)) + ' 0 0 0 round ' + U(22) + ')';
    const mr = seg(P, 0.495, 0.53);
    set($('cz-msgs-row'), easeOut(mr), 'translate3d(' + U((1 - easeOut(mr)) * 18) + ',0,0) scale(' + (0.95 + 0.05 * easeBack(mr)).toFixed(4) + ')');

    // 4. magnified dot glides on a semicircular arc from green to pink; accent follows it live
    const d = easeIO(seg(P, 0.62, 0.84));
    const arc = Math.sin(Math.PI * d);
    const a = DOT.a0 + (DOT.a1 - DOT.a0) * d;
    const rf = 0.52 + 0.1 * d + 0.14 * arc;
    const rad = a * Math.PI / 180;
    const hue = hueOf(a), light = 62 - 7 * d;
    const dot = $('cz-dot');
    if (dot) {
      dot.style.left = U(WHEEL.cx + Math.cos(rad) * rf * WHEEL.R);
      dot.style.top = U(WHEEL.cy - Math.sin(rad) * rf * WHEEL.R);
      dot.style.transform = 'translate(-50%,-50%) scale(' + (1 + 0.28 * arc).toFixed(4) + ')';
      dot.style.background = 'hsl(' + hue.toFixed(1) + ' 100% ' + light.toFixed(1) + '%)';
    }
    sec.style.setProperty('--cz-acc', 'hsl(' + hue.toFixed(1) + ' 100% ' + light.toFixed(1) + '%)');
    sec.style.setProperty('--cz-acc-ink', 'hsl(' + hue.toFixed(1) + ' 100% 14%)');
    sec.style.setProperty('--cz-acc-soft', 'hsl(' + hue.toFixed(1) + ' 90% 80%)');

    // 3D model spin target: turns continuously with scroll through the whole section
    spinTarget = Math.PI / 2 + (enter - 1) * 0.9 + P * Math.PI * 2 * 1.5;
    if (!modelStarted && r.top < vh * 2) { modelStarted = true; initModel(); }

    screenScene(sec, sNew, portrait);
  }

  // ---------- 5. zoom out into a screen, then grey tiles flip in one by one ----------
  const S_END = 660;
  const D = 80;   // the add-image steps run this much later, after the pixel lettering
  let layoutKey = '', L5 = null, gridKey = '', tiles = [], plusEl = null, backEl = null, plusBk = null, pixCv = null, menuEl = null, imgEl = null, handleEl = null, imgRow = null;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layoutKey = ''; });
  window.addEventListener('resize', () => { layoutKey = ''; });

  function layoutScreen(sec, portrait) {
    const stage = sec.querySelector('.cz-stage');
    const $ = id => document.getElementById(id);
    const cap = $('cz-cap'), grid = $('cz-grid');
    if (!stage || !cap || !grid) return null;
    const u = parseFloat(stage.style.getPropertyValue('--u')) || stage.clientWidth / (portrait ? 1000 : 2000);
    const k = (stage.dataset.fit || '') + '|' + u.toFixed(4) + (portrait ? 'p' : 'l');
    // the page runtime can re-render this markup, which drops the generated tiles and inline positions
    const fresh = !plusEl || plusEl.parentNode !== grid || !cap.style.left;
    if (L5 && layoutKey === k && !fresh) return L5;
    if (fresh) gridKey = '';
    const Hs = stage.clientHeight / u;
    // visible area in stage units: from the bottom of the fixed nav to the bottom of the screen
    const wrap = stage.parentElement;
    const vTop = -stage.offsetTop / u, vBot = ((wrap ? wrap.clientHeight : window.innerHeight) - stage.offsetTop) / u;
    const navEl = document.querySelector('.tk-start') || document.querySelector('.tk-nav');
    const navB = navEl ? vTop + Math.max(0, navEl.getBoundingClientRect().bottom) / u : vTop + 100;
    let box, cx, maxW, cols, capW;
    if (!portrait) {
      // content as it sits at the end of the colour step
      box = { x0: 82, x1: 1919, y0: 145, y1: 980 };
      cx = 1000.5; maxW = 1760; cols = 12; capW = 920;
    } else {
      box = { x0: 30, x1: 970, y0: 200, y1: Hs - 50 };
      cx = 500; maxW = 940; cols = 6; capW = 900;
    }
    cap.style.width = 'calc(var(--u) * ' + capW + ')';
    const capH = cap.offsetHeight / u;
    const PAD = 20, CAPGAP = 22;
    // the screen box + caption, as one group, is as large as the space allows and
    // vertically centred between the nav and the bottom of the screen
    const top0 = navB + 36, bot0 = vBot - 72, avail = bot0 - top0;
    const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
    const s = Math.max(0.2, Math.min((avail - capH - CAPGAP - 2 * PAD) / bh, (maxW - 2 * PAD) / bw, 0.92));
    const fw = bw * s + 2 * PAD, fh = bh * s + 2 * PAD, fx = cx - fw / 2;
    const fy = top0 + (avail - (fh + CAPGAP + capH)) / 2;
    const bcx = (box.x0 + box.x1) / 2, bcy = (box.y0 + box.y1) / 2;
    // the zoomed-out content sits inside the box with a generous margin (the box itself keeps its size)
    const IN = portrait ? 44 : 52;
    const sIn = Math.min((fw - 2 * IN) / bw, (fh - 2 * IN) / bh);
    const L = { box, s: sIn, PAD, padX: (fw - bw * sIn) / 2, padY: (fh - bh * sIn) / 2, fx, fy, fw, fh, bcx, bcy, dx: fx + fw / 2 - bcx, dy: fy + fh / 2 - bcy };

    // caption keeps the width it was measured at (on phones it can be wider than the box, so it stays left-aligned with the page)
    cap.style.left = U(portrait ? Math.min(fx + 4, (1000 - capW) / 2) : fx + 4); cap.style.top = U(fy + fh + CAPGAP);

    // tile grid: one even gap between every tile, one even border on all four sides;
    // plus tile spans the last 3 rows of the last column
    const B = 1.5, inset = 14, g = 10;
    const ix = fx + B + inset, iy = fy + B + inset, iw = fw - 2 * (B + inset), ih = fh - 2 * (B + inset);
    const tw = (iw - (cols - 1) * g) / cols;
    const rows = portrait ? Math.max(4, Math.round((ih + g) / (tw + g))) : 6;
    const th = (ih - (rows - 1) * g) / rows;
    const X = c => ix + c * (tw + g);
    const Y = r => iy + r * (th + g);
    const gk = cols + 'x' + rows;
    if (gk !== gridKey) {
      gridKey = gk; grid.textContent = ''; tiles = [];
      // the screen is filled by a fine grid of tiny cubes drawn on one canvas (far too many for DOM nodes)
      pixCv = document.createElement('canvas'); pixCv.className = 'cz-pixcv';
      pixCv.style.cssText = 'position:absolute;display:block;pointer-events:none;border-radius:calc(var(--u) * 32.5)';
      grid.appendChild(pixCv);
      plusEl = document.createElement('div'); plusEl.className = 'cz-tile'; plusEl.id = 'cz-plus';
      plusEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M12 4v16M4 12h16"/></svg>';
      grid.appendChild(plusEl);
      buildMenuAndImage(grid);
    }
    // corners concentric with the screen frame (frame radius 34, minus border and inset); all tiles share the plus tile's fill
    const TR = U(34 - B - inset);
    plusEl.style.borderRadius = TR; plusEl.style.background = '#0c0c0c';
    const bx = fx + B, by = fy + B, bw2 = fw - 2 * B, bh2 = fh - 2 * B;
    const ps = pixCv.style;
    ps.left = U(bx); ps.top = U(by); ps.width = U(bw2); ps.height = U(bh2);
    // micro grid: every big cell holds K x K tiny cubes, so the image box and plus still line up with them
    const K = 5, mpx = (tw + g) / K, mpy = (th + g) / K;
    const MC = cols * K, MR = Math.round((ih + g) / mpy);
    L.M = { K, MC, MR, mpx, mpy, mg: Math.min(mpx, mpy) * 0.2, ox: ix - bx, oy: iy - by, bw2, bh2, u, mask: pixelText(MC, MR, portrait) };
    const pr = rows - 3;
    plusEl.style.left = U(X(cols - 1)); plusEl.style.top = U(Y(pr)); plusEl.style.width = U(tw);
    plusEl.style.height = U(Y(rows - 1) + th - Y(pr));
    // geometry the add-image step needs
    const p = (tw + g) * (portrait ? 1.6 : 1);
    L.G = { X, Y, tw, th, g, cols, rows, pr, TR, TRu: 34 - B - inset, p };
    const ms = menuEl.style;
    ms.setProperty('--p', U(p));
    ms.width = U(p * 2.45);
    ms.right = 'auto';
    ms.left = U(X(cols - 1) - 0.09 * p - p * 2.45);
    ms.top = 'auto';
    ms.bottom = 'calc(100% - ' + U(Y(rows - 1) + th) + ')';
    imgEl.style.borderRadius = TR;
    L5 = L; layoutKey = k;
    return L;
  }

  // "+" menu and the image box that gets added and resized
  const ICONS = {
    image: '<path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5zM6 17h12l-4.2-5.6-3.1 4-2.1-2.5zM16.5 10a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4z" fill-rule="evenodd"/>',
    video: '<rect x="2.5" y="6" width="13.5" height="12" rx="2.5"/><path d="m17.5 10.2 4-2.4v8.4l-4-2.4z"/>',
    carousel: '<rect x="7.5" y="5" width="9" height="14" rx="1.5"/><rect x="2.5" y="7" width="3.5" height="10" rx="1"/><rect x="18" y="7" width="3.5" height="10" rx="1"/>',
    text: '<path d="M4 20 10 4h2.6l6 16h-3l-1.4-4H8.4L7 20zm5.3-6.6h4L11.3 7.6z"/><path d="M19 13.5s2.5 2.8 2.5 4.3a2.5 2.5 0 0 1-5 0c0-1.5 2.5-4.3 2.5-4.3z"/>',
    embed: '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5zm7 2v7l6-3.5z" fill-rule="evenodd"/>',
    model: '<path d="m12 2.5 8.5 4.8-8.5 4.9-8.5-4.9z"/><path d="M3 8.6 11.3 13.4V22L3 17.2zM21 8.6v8.6L12.7 22v-8.6z"/>',
    project: '<path d="M2.5 6A1.5 1.5 0 0 1 4 4.5h5l2 2.2h9A1.5 1.5 0 0 1 21.5 8.2V9H6.2a1.5 1.5 0 0 0-1.4 1L2.5 16.5z"/><path d="M5.6 10.5h17L19.8 19a1.5 1.5 0 0 1-1.4 1H3z"/>'
  };
  const ITEMS = [['image', 'Image', 'Add a photo'], ['video', 'Video', 'Showcase a video'], ['carousel', 'Carousel', 'Multiple media in one tile'],
    ['text', 'Text', 'Styled text block'], ['embed', 'Embed', 'YouTube, Vimeo, Sketchfab, Figma\u2026'], ['model', '3D Model', '.glb / .gltf / .obj'], ['project', 'Project', 'Nested collage project']];
  function buildMenuAndImage(grid) {
    menuEl = document.createElement('div');
    menuEl.style.cssText = 'position:absolute;z-index:3;opacity:0;display:flex;flex-direction:column;gap:calc(var(--p) * 0.015);padding:calc(var(--p) * 0.1);border-radius:calc(var(--p) * 0.13);background:#161616;box-shadow:0 calc(var(--p) * 0.08) calc(var(--p) * 0.3) rgba(0,0,0,0.55);transform-origin:100% 100%;box-sizing:border-box';
    ITEMS.forEach(([ic, t, sub], i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:calc(var(--p) * 0.17);padding:calc(var(--p) * 0.07) calc(var(--p) * 0.12);border-radius:calc(var(--p) * 0.09);transform-origin:50% 50%';
      row.innerHTML = '<svg viewBox="0 0 24 24" fill="#f2f2f4" style="flex:none;width:calc(var(--p) * 0.21);height:calc(var(--p) * 0.21);display:block">' + ICONS[ic] + '</svg>' +
        '<span style="display:flex;flex-direction:column;min-width:0"><span style="font-size:calc(var(--p) * 0.125);line-height:1.25;color:#f2f2f4;white-space:nowrap">' + t + '</span>' +
        '<span style="font-size:calc(var(--p) * 0.093);line-height:1.3;color:#a7a7ac;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + sub + '</span></span>';
      menuEl.appendChild(row);
      if (i === 0) imgRow = row;
    });
    grid.appendChild(menuEl);
    imgEl = document.createElement('div');
    imgEl.style.cssText = 'position:absolute;z-index:4;opacity:0;box-sizing:border-box;background:#a9a9a9;border:2px solid var(--cz-acc);transform-origin:0 0';
    grid.appendChild(imgEl);
    handleEl = document.createElement('div');
    handleEl.style.cssText = 'position:absolute;z-index:5;opacity:0;box-sizing:border-box;border-radius:50%;background:#0c0c0c;border:2px solid var(--cz-acc);transform:translate(-50%,-50%)';
    grid.appendChild(handleEl);
  }

  function screenScene(sec, sv, portrait) {
    const L = layoutScreen(sec, portrait);
    if (!L) return;
    const $ = id => document.getElementById(id);
    // zoom out: content shrinks into the frame position
    const z = easeIO(seg(sv, 196, 248));
    const sc = 1 + (L.s - 1) * z;
    const zoom = $('cz-zoom');
    if (zoom) {
      zoom.style.transformOrigin = U(L.bcx) + ' ' + U(L.bcy);
      zoom.style.transform = z > 0 ? 'translate3d(' + U(L.dx * z) + ',' + U(L.dy * z) + ',0) scale(' + sc.toFixed(4) + ')' : '';
    }
    // the frame hugs the shrinking content and fades in around it
    const fr = $('cz-frame');
    if (fr) {
      const ox = L.bcx + L.dx * z, oy = L.bcy + L.dy * z;
      const px = L.PAD + (L.padX - L.PAD) * z, py = L.PAD + (L.padY - L.PAD) * z;
      const x0 = ox + (L.box.x0 - L.bcx) * sc - px, x1 = ox + (L.box.x1 - L.bcx) * sc + px;
      const y0 = oy + (L.box.y0 - L.bcy) * sc - py, y1 = oy + (L.box.y1 - L.bcy) * sc + py;
      fr.style.left = U(x0); fr.style.top = U(y0); fr.style.width = U(x1 - x0); fr.style.height = U(y1 - y0);
      fr.style.opacity = easeOut(seg(z, 0.15, 0.85)).toFixed(3);
    }
    const rise = (k) => 'translate3d(0,' + U((1 - easeOut(k)) * 18) + ',0)';
    const ck = seg(sv, 236, 262);
    set($('cz-cap'), easeOut(ck), rise(ck));

    // tiny cubes flip in across the screen, then some light up to spell "Make it your own." in pixels
    drawPixels(L, sv);
    if (plusEl) {
      const q = seg(sv - D, 394, 414);
      plusEl.style.opacity = easeOut(q).toFixed(3);
      plusEl.style.transform = q < 1 ? 'perspective(700px) rotateY(' + ((1 - easeOut(q)) * -120).toFixed(1) + 'deg) scale(' + (0.85 + 0.15 * easeBack(q)).toFixed(3) + ')' : '';
      // plus box lights up pink, stays lit while the menu is open
      const hl = easeOut(seg(sv - D, 418, 430)) * (1 - easeOut(seg(sv - D, 466, 478)));
      const pc = 'color-mix(in srgb, var(--cz-acc) ' + (hl * 100).toFixed(1) + '%, rgba(255,255,255,0.3))';
      plusEl.style.borderColor = pc;
      plusEl.style.borderWidth = hl > 0.01 ? '1.5px' : '';
      const psvg = plusEl.querySelector('svg');
      if (psvg) { psvg.style.stroke = 'color-mix(in srgb, var(--cz-acc) ' + (hl * 100).toFixed(1) + '%, #fff)'; psvg.style.strokeWidth = (1.6 + 0.6 * hl).toFixed(2); }
    }
    addImageScene(L, sv - D);
  }

  // ---------- pixel lettering ----------
  const GLYPHS = {
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    a: ['00000', '00000', '01110', '00001', '01111', '10001', '01111'],
    k: ['10000', '10000', '10010', '10100', '11000', '10100', '10010'],
    e: ['00000', '00000', '01110', '10001', '11111', '10000', '01110'],
    i: ['1', '0', '1', '1', '1', '1', '1'],
    t: ['010', '010', '111', '010', '010', '010', '001'],
    y: ['00000', '00000', '10001', '10001', '01111', '00001', '01110'],
    o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
    u: ['00000', '00000', '10001', '10001', '10001', '10011', '01101'],
    r: ['0000', '0000', '1011', '1100', '1000', '1000', '1000'],
    w: ['00000', '00000', '10001', '10001', '10101', '10101', '01010'],
    n: ['00000', '00000', '10110', '11001', '10001', '10001', '10001'],
    '.': ['0', '0', '0', '0', '0', '0', '1'],
  };
  // returns a map "r,c" -> order (typing order) for the lit pixels, centred in the micro grid
  function pixelText(C, R, portrait) {
    const lines = portrait || C < 46 ? ['Make', 'it your', 'own.'] : ['Make it', 'your own.'];
    const SP = C < 46 || portrait ? 2 : 3;
    const lw = l => { let w = 0; [...l].forEach((ch, i) => { w += ch === ' ' ? SP : GLYPHS[ch][0].length + (i < l.length - 1 && l[i + 1] !== ' ' ? 1 : 0); }); return w; };
    const LH = 7, LG = 3, total = lines.length * LH + (lines.length - 1) * LG;
    const r0 = Math.max(0, Math.floor((R - total) / 2) - (portrait ? 2 : 1));
    const map = new Map(); let n = 0;
    lines.forEach((l, li) => {
      let c = Math.floor((C - lw(l)) / 2); const rr = r0 + li * (LH + LG);
      [...l].forEach((ch, ci) => {
        if (ch === ' ') { c += SP; return; }
        const gl = GLYPHS[ch], w = gl[0].length;
        for (let x = 0; x < w; x++) for (let y = 0; y < LH; y++) if (gl[y][x] === '1') map.set((rr + y) + ',' + (c + x), { n: n, x, y });
        n++;
        c += w + (ci < l.length - 1 && l[ci + 1] !== ' ' ? 1 : 0);
      });
    });
    map.chars = n;
    return map;
  }
  const hash = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
  function drawPixels(L, sv) {
    const M = L.M; if (!pixCv || !M) return;
    const u = M.u, dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = M.bw2 * u, H = M.bh2 * u;
    if (pixCv.width !== Math.round(W * dpr) || pixCv.height !== Math.round(H * dpr)) { pixCv.width = Math.round(W * dpr); pixCv.height = Math.round(H * dpr); }
    const g = pixCv.getContext('2d');
    g.setTransform(dpr * u, 0, 0, dpr * u, 0, 0);   // draw in design units
    g.clearRect(0, 0, M.bw2, M.bh2);
    const tp = seg(sv, 262, 352), Wd = 0.12;
    if (tp <= 0) return;
    const type = seg(sv, 358, 420), fade = smooth(seg(sv, 442, 462));
    const cs = M.mpx - M.mg, ch = M.mpy - M.mg, rad = Math.min(cs, ch) * 0.24;
    const LIT = '#cba7da';
    for (let r = 0; r < M.MR; r++) {
      for (let c = 0; c < M.MC; c++) {
        const v = (c / (M.MC - 1) + r / (M.MR - 1)) / 2;
        const a = v * (1 - Wd), t = seg(tp, a, a + Wd);
        if (t <= 0) continue;
        // screen colour behind the cube (its cell plus half the gap; outer cells run to the frame edge)
        const x = M.ox + c * M.mpx, y = M.oy + r * M.mpy;
        const x0 = c === 0 ? 0 : x - M.mg / 2, y0 = r === 0 ? 0 : y - M.mg / 2;
        const x1 = c === M.MC - 1 ? M.bw2 : x + cs + M.mg / 2, y1 = r === M.MR - 1 ? M.bh2 : y + ch + M.mg / 2;
        g.fillStyle = '#000'; g.fillRect(x0 - 0.3, y0 - 0.3, x1 - x0 + 0.6, y1 - y0 + 0.6);
        // the cube flips in (squashes horizontally as it turns)
        const e = easeOut(t), sx = 0.15 + 0.85 * e;
        g.globalAlpha = Math.min(1, t * 3);
        const w2 = cs * sx;
        g.fillStyle = '#0c0c0c';
        g.beginPath(); g.roundRect(x + (cs - w2) / 2, y, w2, ch, rad); g.fill();
        g.globalAlpha = 1;
        // lit pixels of the lettering: typed out letter by letter, mixed square and round dots
        const lit = M.mask.get(r + ',' + c);
        if (lit && type > 0 && fade < 1) {
          const at = lit.n / Math.max(1, M.mask.chars) * 0.88 + hash(r, c) * 0.06;
          const k = seg(type, at, at + 0.06);
          if (k > 0) {
            const pk = easeBack(k) * (1 - fade);
            if (pk > 0.001) {
              const s2 = Math.min(cs, ch) * (0.7 + 0.42 * pk);
              const cx = x + cs / 2, cy = y + ch / 2;
              g.globalAlpha = Math.min(1, k * 2) * (1 - fade);
              g.fillStyle = LIT;
              g.beginPath();
              if (hash(c, r) < 0.42) g.arc(cx, cy, s2 / 2, 0, 6.2832);
              else g.roundRect(cx - s2 / 2, cy - s2 / 2, s2, s2, s2 * 0.18);
              g.fill();
              g.globalAlpha = 1;
            }
          }
        }
      }
    }
  }

  function addImageScene(L, sv) {
    if (!menuEl || !L.G) return;
    const { X, Y, tw, th, g, p } = L.G;
    // menu pops up beside the plus box
    const mIn = seg(sv, 430, 444), mOut = seg(sv, 462, 472);
    const mo = easeOut(mIn) * (1 - easeOut(mOut));
    menuEl.style.opacity = mo.toFixed(3);
    menuEl.style.transform = 'scale(' + (0.92 + 0.08 * easeBack(mIn) - 0.04 * mOut).toFixed(4) + ')';
    menuEl.style.visibility = mo > 0.001 ? 'visible' : 'hidden';
    // the Image row lights up pink, then is pressed
    const rh = easeOut(seg(sv, 446, 456));
    // only the icon and text turn pink, not the whole row
    const mix = (c) => 'color-mix(in srgb, var(--cz-acc) ' + (rh * 100).toFixed(1) + '%, ' + c + ')';
    const [ttl, sub] = imgRow.querySelectorAll('span span');
    const isvg = imgRow.querySelector('svg');
    if (isvg) isvg.style.fill = mix('#f2f2f4');
    if (ttl) ttl.style.color = mix('#f2f2f4');
    if (sub) sub.style.color = mix('#a7a7ac');
    const press = Math.sin(Math.PI * seg(sv, 456, 462));
    imgRow.style.transform = press > 0 ? 'scale(' + (1 - 0.04 * press).toFixed(4) + ')' : '';

    // image box: appears 3 columns x 4 rows, dragged out one column to a square, then up one row to a landscape rectangle
    const span = (n, size) => n * (size + g) - g;
    const ia = seg(sv, 468, 484);
    const k1 = seg(sv, 488, 518), k2 = seg(sv, 528, 558);
    const snap = k => easeIO(seg(k, 0.35, 0.68));
    const cw = 3 + snap(k1), rh2 = 4 - snap(k2);
    const x0 = X(0), y0 = Y(0);
    const is = imgEl.style;
    is.left = U(x0); is.top = U(y0); is.width = U(span(cw, tw)); is.height = U(span(rh2, th));
    is.opacity = easeOut(ia).toFixed(3);
    is.transform = ia < 1 ? 'scale(' + (0.9 + 0.1 * easeBack(ia)).toFixed(4) + ')' : '';
    // the dot sits on the box's rounded corner and travels with it; it fills pink while the box is being resized
    const { TRu } = L.G;
    const ci = TRu * (1 - Math.SQRT1_2);
    const hs = handleEl.style, hd = p * 0.2;
    hs.width = U(hd); hs.height = U(hd);
    hs.left = U(x0 + span(cw, tw) - ci); hs.top = U(y0 + span(rh2, th) - ci);
    hs.opacity = easeOut(seg(sv, 476, 486)).toFixed(3);
    const act = Math.min(1, Math.max(seg(k1, 0, 0.12) * (1 - seg(k1, 0.88, 1)), seg(k2, 0, 0.12) * (1 - seg(k2, 0.88, 1))));
    hs.background = 'color-mix(in srgb, var(--cz-acc) ' + (act * 100).toFixed(1) + '%, #0c0c0c)';
    hs.transform = 'translate(-50%,-50%) scale(' + (1 + 0.15 * act).toFixed(3) + ')';
  }

  // ---------- 3D model in the feed ----------
  let spinTarget = 0, modelStarted = false;
  async function initModel() {
    let host = document.getElementById('cz-model');
    if (!host) return;
    // everything is served from this project: no CDN, no data:/blob: URLs
    const loadScript = (src) => new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = res; s.onerror = () => rej(new Error('could not load ' + src));
      document.head.appendChild(s);
    });
    const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => rej(new Error('could not load ' + src)); i.src = src; });
    try {
      const texP = Promise.all([loadImg('uploads/DemiModel_color.jpg'), loadImg('uploads/DemiModel_normal.jpg')]);
      if (!window.TEKNI3D) await loadScript('./tekni-three.js');
      if (!window.__DEMI_GLB) await loadScript('./demi-model.js');
      const THREE = window.TEKNI3D;
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 900ms ease';
      host.appendChild(canvas);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = 0; // NoToneMapping: texture colours shown as authored
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x5a5a5a, 2.2));
      const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(1.2, 2.4, 3); scene.add(key);
      const rim = new THREE.DirectionalLight(0xffffff, 0.7); rim.position.set(-2, 1.5, -2.5); scene.add(rim);

      const bin = atob(window.__DEMI_GLB), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const gltf = await new Promise((res, rej) => new THREE.GLTFLoader().parse(bytes.buffer, '', res, rej));
      const [colImg, nrmImg] = await texP;
      const mkTex = (img, srgb) => {
        const t = new THREE.Texture(img);
        t.flipY = false; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true; return t;
      };
      const colTex = mkTex(colImg, true), nrmTex = mkTex(nrmImg, false);
      const model = gltf.scene;
      model.traverse(o => {
        if (!o.isMesh) return;
        o.frustumCulled = false;
        const m = o.material;
        m.map = colTex; m.normalMap = nrmTex; m.normalScale = new THREE.Vector2(1, 1);
        m.fog = false; m.needsUpdate = true;
      });
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model, true);
      const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      const h = size.y || 1;
      const pivot = new THREE.Group();
      model.position.set(-c.x, -box.min.y, -c.z);
      pivot.add(model);
      const MODEL_SCALE = 0.735; // figure size within the post
      pivot.scale.setScalar(MODEL_SCALE);
      scene.add(pivot);

      // floor grid stays still (like the Tekni viewer) while the figure turns
      const gc = document.createElement('canvas'); gc.width = gc.height = 512;
      const gx = gc.getContext('2d');
      gx.strokeStyle = 'rgba(255,255,255,0.36)'; gx.lineWidth = 3;
      gx.beginPath(); gx.moveTo(0, 1.5); gx.lineTo(512, 1.5); gx.moveTo(1.5, 0); gx.lineTo(1.5, 512); gx.stroke();
      const gt = new THREE.Texture(gc);
      gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(26, 26); gt.anisotropy = renderer.capabilities.getMaxAnisotropy(); gt.needsUpdate = true;
      const grid = new THREE.Mesh(new THREE.PlaneGeometry(h * 26, h * 26), new THREE.MeshBasicMaterial({ map: gt, transparent: true, depthWrite: false }));
      grid.rotation.x = -Math.PI / 2; grid.rotation.z = 0.55;
      scene.add(grid);
      const dist = h * 2.6;
      scene.fog = new THREE.Fog(0x000000, dist * 0.7, dist * 3.2);
      camera.position.set(0, h * 0.56, dist);
      const feet = new THREE.Vector3(0, 0, 0), hips = new THREE.Vector3(0, h * MODEL_SCALE * 0.5, 0);
      // aim the camera so the feet always land clear above the caption card
      const frameFeet = () => {
        const post = document.querySelector('#cz-mid .cz-post');
        const hr = host.getBoundingClientRect();
        let frac = 0.66;
        if (post && hr.height) frac = (post.getBoundingClientRect().top - hr.top) / hr.height - 0.06;
        frac = Math.min(0.8, Math.max(0.5, frac));
        const want = 1 - 2 * frac;
        let lo = -h, hi = h * 2;
        for (let i = 0; i < 40; i++) {
          const mid = (lo + hi) / 2;
          camera.lookAt(0, mid, 0); camera.updateMatrixWorld();
          if (feet.clone().project(camera).y > want) lo = mid; else hi = mid; // aiming higher pushes the feet down the frame
        }
        camera.lookAt(0, (lo + hi) / 2, 0); camera.updateMatrixWorld();
        const gizmo = document.getElementById('cz-gizmo');
        if (gizmo) gizmo.style.top = ((1 - hips.clone().project(camera).y) / 2 * 100).toFixed(2) + '%';
      };

      let w = 0, hh = 0;
      const resize = () => {
        const nw = host.clientWidth, nh = host.clientHeight;
        if (!nw || !nh || (nw === w && nh === hh)) return false;
        w = nw; hh = nh;
        renderer.setSize(w, hh, false);
        camera.aspect = w / hh; camera.updateProjectionMatrix();
        frameFeet();
        return true;
      };
      let spin = spinTarget, first = true;
      const loop = () => {
        requestAnimationFrame(loop);
        const sec = document.getElementById('customise');
        if (sec) { const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return; }
        const cur = document.getElementById('cz-model');
        let moved = false;
        if (cur && cur !== host) { host = cur; host.appendChild(canvas); w = 0; moved = true; }
        const g = document.getElementById('cz-gizmo');
        if (g && !g.style.top) w = 0;
        const sized = resize() || moved;
        const d = spinTarget - spin;
        if (!first && !sized && Math.abs(d) < 0.0005) return;
        spin += d * 0.12;
        pivot.rotation.y = spin;
        renderer.render(scene, camera);
        if (first) { first = false; canvas.style.opacity = '1'; }
      };
      loop();
    } catch (e) { console.warn('[customise] 3D model failed to load', e); }
  }
  requestAnimationFrame(frame);
})();
