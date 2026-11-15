(function () {
  // run once per page, even if the page runtime evaluates this script twice
  if (window.__czScrollDoc === document) return;
  window.__czScrollDoc = document;
  // Customise section: scroll-linked sequence (Multi1 -> Multi2 -> Multi3 -> Multi4)
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
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
  const S_END = 440;
  let layoutKey = '', L5 = null, gridKey = '', tiles = [], plusEl = null, backEl = null, plusBk = null;
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
    let box, pillTop, pillH, bottomLim, cx, maxW, cols, capW;
    if (!portrait) {
      // content as it sits at the end of the colour step
      box = { x0: 82, x1: 1919, y0: 145, y1: 980 };
      pillTop = 122; pillH = 56; bottomLim = 978; cx = 1000.5; maxW = 1320; cols = 12; capW = 920;
    } else {
      const navEl = document.querySelector('.tk-start') || document.querySelector('.tk-nav');
      const navB = navEl ? Math.max(0, navEl.getBoundingClientRect().bottom - stage.getBoundingClientRect().top) / u : 120;
      box = { x0: 30, x1: 970, y0: 200, y1: Hs - 50 };
      pillTop = navB + 30; pillH = 66; bottomLim = Hs - 50; cx = 500; maxW = 940; cols = 6; capW = 900;
    }
    cap.style.width = 'calc(var(--u) * ' + capW + ')';
    const capH = cap.offsetHeight / u;
    const PAD = 20, GAP = 16;
    const fy = pillTop + pillH + GAP;
    const fBot = bottomLim - capH - 22;
    const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
    const s = Math.max(0.2, Math.min((fBot - fy - 2 * PAD) / bh, (maxW - 2 * PAD) / bw, 0.85));
    const fw = bw * s + 2 * PAD, fh = bh * s + 2 * PAD, fx = cx - fw / 2;
    const bcx = (box.x0 + box.x1) / 2, bcy = (box.y0 + box.y1) / 2;
    const L = { box, s, PAD, fx, fy, fw, fh, bcx, bcy, dx: fx + fw / 2 - bcx, dy: fy + fh / 2 - bcy };

    const pill = $('cz-pill2');
    if (pill) { pill.style.left = U(fx); pill.style.top = U(fy - pillH - GAP); }
    cap.style.left = U(fx + 4); cap.style.top = U(fy + fh + 20);
    cap.style.width = 'calc(var(--u) * ' + Math.min(capW, fw).toFixed(1) + ')';

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
      const cells = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (c === cols - 1 && r >= rows - 3) continue;
        cells.push({ r, c });
      }
      // diagonal sweep from the top-left corner (matches the backdrop's 'to bottom right' mask)
      cells.forEach(cell => { cell.v = (cell.c / (cols - 1) + cell.r / (rows - 1)) / 2; });
      cells.sort((a, b) => a.v - b.v || a.r - b.r);
      // screen colour behind each tile (its cell plus half of each surrounding gap) switches on with
      // that tile, hard-edged, so the content underneath is hidden without a soft shadow sweeping across
      backEl = document.createElement('div'); backEl.className = 'cz-back'; grid.appendChild(backEl);
      cells.forEach(cell => {
        const bk = document.createElement('i'); backEl.appendChild(bk);
        const el = document.createElement('div'); el.className = 'cz-tile'; grid.appendChild(el);
        tiles.push({ el, bk, r: cell.r, c: cell.c, v: cell.v });
      });
      plusBk = document.createElement('i'); backEl.appendChild(plusBk);
      plusEl = document.createElement('div'); plusEl.className = 'cz-tile'; plusEl.id = 'cz-plus';
      plusEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M12 4v16M4 12h16"/></svg>';
      grid.appendChild(plusEl);
    }
    tiles.forEach(t => { const s2 = t.el.style; s2.left = U(X(t.c)); s2.top = U(Y(t.r)); s2.width = U(tw); s2.height = U(th); });
    const bx = fx + B, by = fy + B, bw2 = fw - 2 * B, bh2 = fh - 2 * B;
    const bs = backEl.style;
    bs.left = U(bx); bs.top = U(by); bs.width = U(bw2); bs.height = U(bh2);
    // cell edges: halfway into each gap, out to the frame edge on the outer rows/columns (0.6 overlap hides seams)
    const ex = c => c <= 0 ? 0 : X(c) - g / 2 - bx, ey = r => r <= 0 ? 0 : Y(r) - g / 2 - by;
    const ex1 = c => c >= cols - 1 ? bw2 : X(c) + tw + g / 2 - bx, ey1 = r => r >= rows - 1 ? bh2 : Y(r) + th + g / 2 - by;
    const place = (el, c0, c1, r0, r1) => { const st = el.style; st.left = U(ex(c0) - 0.3); st.top = U(ey(r0) - 0.3); st.width = U(ex1(c1) - ex(c0) + 0.6); st.height = U(ey1(r1) - ey(r0) + 0.6); };
    tiles.forEach(t => place(t.bk, t.c, t.c, t.r, t.r));
    const pr = rows - 3;
    place(plusBk, cols - 1, cols - 1, pr, rows - 1);
    plusEl.style.left = U(X(cols - 1)); plusEl.style.top = U(Y(pr)); plusEl.style.width = U(tw);
    plusEl.style.height = U(Y(rows - 1) + th - Y(pr));
    L5 = L; layoutKey = k;
    return L;
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
      const x0 = ox + (L.box.x0 - L.bcx) * sc - L.PAD, x1 = ox + (L.box.x1 - L.bcx) * sc + L.PAD;
      const y0 = oy + (L.box.y0 - L.bcy) * sc - L.PAD, y1 = oy + (L.box.y1 - L.bcy) * sc + L.PAD;
      fr.style.left = U(x0); fr.style.top = U(y0); fr.style.width = U(x1 - x0); fr.style.height = U(y1 - y0);
      fr.style.opacity = easeOut(seg(z, 0.15, 0.85)).toFixed(3);
    }
    const rise = (k) => 'translate3d(0,' + U((1 - easeOut(k)) * 18) + ',0)';
    const pk = seg(sv, 230, 254), ck = seg(sv, 238, 264);
    set($('cz-pill2'), easeOut(pk), rise(pk));
    set($('cz-cap'), easeOut(ck), rise(ck));

    // tiles flip over one by one until the screen is full, then the plus pops in
    const tp = seg(sv, 262, 396), N = tiles.length, W = 0.07;
    for (let i = 0; i < N; i++) {
      const a = (i / Math.max(1, N - 1)) * (1 - W);
      const t = seg(tp, a, a + W), e = easeOut(t);
      const st = tiles[i].el.style;
      st.opacity = t > 0 ? Math.min(1, t * 3).toFixed(3) : '0';
      tiles[i].bk.style.opacity = t > 0 ? '1' : '0';
      st.transform = t > 0 && t < 1 ? 'perspective(700px) rotateY(' + ((1 - e) * -120).toFixed(1) + 'deg) scale(' + (0.9 + 0.1 * e).toFixed(3) + ')' : '';
    }
    // the plus tile's cell goes dark together with the last ordinary tile
    if (plusBk) plusBk.style.opacity = tp > (1 - W) ? '1' : '0';
    if (plusEl) {
      const q = seg(sv, 394, 414);
      plusEl.style.opacity = easeOut(q).toFixed(3);
      plusEl.style.transform = q < 1 ? 'perspective(700px) rotateY(' + ((1 - easeOut(q)) * -120).toFixed(1) + 'deg) scale(' + (0.85 + 0.15 * easeBack(q)).toFixed(3) + ')' : '';
    }
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
