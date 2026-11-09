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
    const k = W + 'x' + H + (portrait ? 'p' : 'l');
    if (!W || !H || stage.dataset.fit === k) return;
    stage.dataset.fit = k; last = '';
    if (portrait) {
      stage.style.width = W + 'px'; stage.style.height = H + 'px';
      stage.style.setProperty('--u', (W / 1000).toFixed(4) + 'px');
    } else {
      const u = Math.min(W / 2000, H / 1125);
      stage.style.width = (2000 * u).toFixed(2) + 'px'; stage.style.height = (1125 * u).toFixed(2) + 'px';
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
    const P = clamp(-r.top / Math.max(1, sec.offsetHeight - vh), 0, 1);
    const key = enter.toFixed(4) + '|' + P.toFixed(4) + '|' + vh + '|' + window.innerWidth;
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
