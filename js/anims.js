// =====================================================================
// Earth Explorer — animations on the Slice view:
//   mantle convection, the core & magnetic shield, Earthquake Detective
// =====================================================================
import { icon } from './icons.js';
import { fmt } from './app.js';

export function init(api, ui) {
  const THREE = api.THREE;
  const face = api.sliceFace;
  let objs = [], hooks = [], running = null;
  const add = o => { face.add(o); objs.push(o); return o; };
  function clear() {
    objs.forEach(o => { face.remove(o); o.dispose && o.dispose(); if (o.geometry && !o.dispose) o.geometry.dispose(); });
    objs = [];
    hooks.forEach(h => api.frameHooks.delete(h)); hooks = [];
    tags.forEach(t => t.el.remove()); tags = [];
  }
  const hook = f => { api.frameHooks.add(f); hooks.push(f); };
  // little name tags pinned to spots on the slice (face x, y)
  let tags = [];
  function addTag(html, x, y, cls = '') {
    const el = document.createElement('div'); el.className = 'tag-mark ' + cls; el.innerHTML = html;
    document.getElementById('labels').appendChild(el);
    const t = { el, x, y }; tags.push(t); return t;
  }
  ui.afterRenderHooks.add(() => {
    for (const t of tags) {
      const p = api.project(api.faceToWorld(face, t.x, t.y));
      t.el.style.display = p.ok && !t.hidden ? '' : 'none';
      t.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
    }
  });
  function stop() {
    if (!running) return;
    clear();
    api.fadeUniform(api.uniforms.uConv, 0, 600);
    api.keepAnimating('anim', false);
    running = null;
  }

  function begin(kind, title, opts, buttons = []) {
    ui.startActivity({ id: kind, title, onStop: stop, buttons });
    running = kind;
    if (api.view !== 'slice') api.setView('slice');
    api.setHighlight(null);
    api.keepAnimating('anim', true);
  }

  // =================================================================
  // 1. MANTLE CONVECTION
  // =================================================================
  function convection(opts = {}) {
    begin('convection', 'Mantle convection', opts, [{ icon: 'restart', label: 'Start over', onClick: () => { years = 0; } }]);
    const K = 4;                                 // 8 loops around the mantle
    api.uniforms.uConvK.value = K;
    api.fadeUniform(api.uniforms.uConv, 1, 1200);
    api.camTo({ dist: api.fitDist(), px: 0, py: 0 }, 900);
    const N = 1400;
    const S = new Float32Array(N), T = new Float32Array(N);   // position in (s = 0 bottom .. 1 top, theta)
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), al = new Float32Array(N);
    const psi = (s, t) => Math.sin(Math.PI * s) * Math.sin(K * t);
    for (let i = 0; i < N; i++) {
      // start on a random closed loop
      for (;;) { S[i] = 0.04 + Math.random() * 0.92; T[i] = Math.random() * Math.PI * 2; if (Math.abs(psi(S[i], T[i])) > 0.06) break; }
      size[i] = 3.5 + Math.random() * 3; al[i] = 0.55 + Math.random() * 0.45;
    }
    const dots = add(api.makeDots(pos, col, size, al, { soft: 1, additive: true }));
    dots.renderOrder = 4;
    let years = 0;
    const hot = [1.0, 0.86, 0.45], cold = [0.62, 0.5, 0.95];
    function step(dt) {
      const R = api.R, r1 = R.cmb, r2 = R.crust;
      const h = dt / 60;                       // simulation speed: one loop ≈ 30 seconds
      years += dt * 10;                        // 1 second = 10 million years
      for (let i = 0; i < N; i++) {
        let s = S[i], t = T[i];
        // move along the loop (RK2)
        const vs = (a, b) => K * Math.sin(Math.PI * a) * Math.cos(K * b);
        const vt = (a, b) => -Math.PI * Math.cos(Math.PI * a) * Math.sin(K * b);
        const ms = s + vs(s, t) * h * 0.5, mt = t + vt(s, t) * h * 0.5;
        s += vs(ms, mt) * h; t += vt(ms, mt) * h;
        s = Math.min(0.985, Math.max(0.015, s));
        S[i] = s; T[i] = t;
        const r = r1 + s * (r2 - r1);
        pos[i * 3] = r * Math.cos(t); pos[i * 3 + 1] = r * Math.sin(t); pos[i * 3 + 2] = 0.003;
        const rising = Math.cos(K * t) * Math.sin(Math.PI * s);
        const heat = Math.min(1, Math.max(0, 0.5 + 0.55 * rising + 0.25 * (0.5 - s)));
        col[i * 3] = cold[0] + (hot[0] - cold[0]) * heat; col[i * 3 + 1] = cold[1] + (hot[1] - cold[1]) * heat; col[i * 3 + 2] = cold[2] + (hot[2] - cold[2]) * heat;
      }
      dots.geometry.attributes.position.needsUpdate = true; dots.geometry.attributes.color.needsUpdate = true;
      ui.banner(`<b>Thick, liquid rock flowing very slowly.</b> Time passed: <b>${fmt(years)} million years</b><small>Yellow = hot rock rising. Purple = cooler rock sinking. In real life, it moves about as fast as your fingernails grow.</small>`);
    }
    hook(step);
    addTag('Hot rock rises ↑', (api.R.cmb + api.R.crust) / 2 * Math.cos(0), (api.R.cmb + api.R.crust) / 2 * Math.sin(0), 'warn');
    addTag('Cool rock sinks ↓', (api.R.cmb + api.R.crust) / 2 * Math.cos(Math.PI / K), (api.R.cmb + api.R.crust) / 2 * Math.sin(Math.PI / K));
    ui.topicCard('convection', '', opts);
  }

  // =================================================================
  // 2. THE CORE AND EARTH'S MAGNETIC SHIELD
  // =================================================================
  function core(opts = {}) {
    begin('core', 'Earth’s magnetic shield', opts);
    api.camTo({ dist: api.fitDist() * 3.1, px: 0.9, py: 0 }, 1300);
    const R = api.R;
    // swirling liquid iron in the outer core
    const N = 700, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), al = new Float32Array(N);
    const eddy = [];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, rr = R.icb + (R.cmb - R.icb) * (0.15 + 0.7 * Math.random());
      eddy.push({ cx: rr * Math.cos(a), cy: rr * Math.sin(a), rad: 0.02 + Math.random() * 0.07, ph: Math.random() * 6.28, sp: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random()) , drift: 0.05 + Math.random() * 0.05 });
      col.set([1, 0.85 + Math.random() * 0.15, 0.55], i * 3); size[i] = 3 + Math.random() * 2.5; al[i] = 0.7;
    }
    const swirl = add(api.makeDots(pos, col, size, al, { soft: 1, additive: true }));
    // magnetic field lines: a dipole, squashed on the Sun side and stretched on the night side
    const lines = [], along = [];
    const Ls = [1.6, 2.2, 3.0, 4.0, 5.3];
    for (const L of Ls) for (const side of [-1, 1]) {
      const pts = [], al2 = [];
      const th0 = Math.asin(Math.sqrt(1 / L));
      for (let k = 0; k <= 90; k++) {
        const th = th0 + (Math.PI - 2 * th0) * k / 90;   // angle from the north pole
        let r = L * Math.sin(th) ** 2;
        let x = side * r * Math.sin(th), y = r * Math.cos(th);
        if (side < 0) x *= 0.72; else x *= 1 + 0.12 * L;
        pts.push([x, y]); al2.push(1 - k / 90);  // field points from south to north outside Earth
      }
      lines.push(pts); along.push(al2);
    }
    const field = add(api.makeLine(lines, { color: [0.5, 0.83, 1], width: 2.2, opacity: 0.85, dash: 9, along, z: 0.003 }));
    // solar wind flowing around the shield
    const M = 260, wp = new Float32Array(M * 3), wc = new Float32Array(M * 3), ws = new Float32Array(M), wa = new Float32Array(M);
    const wind = [];
    for (let i = 0; i < M; i++) { wind.push({ b: (Math.random() * 2 - 1) * 5.5, x: -9 + Math.random() * 18, sp: 1.6 + Math.random() * 0.8 }); wc.set([1, 0.9, 0.45], i * 3); ws[i] = 5 + Math.random() * 3; wa[i] = 0.9; }
    const windDots = add(api.makeDots(wp, wc, ws, wa, { soft: 1, additive: true }));
    // the edge of the shield
    const mp = [];
    for (let y = -5.6; y <= 5.6; y += 0.1) mp.push([-2.3 + 0.21 * y * y, y]);
    add(api.makeLine(mp, { color: [0.6, 0.85, 1], width: 1.6, opacity: 0.5, dash: 30, z: 0.002 }));
    // auroras near the poles
    const A = 120, ap = new Float32Array(A * 3), ac = new Float32Array(A * 3), as = new Float32Array(A), aa = new Float32Array(A);
    for (let i = 0; i < A; i++) {
      const north = i < A / 2, th = (north ? 1 : -1) * (0.32 + Math.random() * 0.12) * (Math.random() < 0.5 ? 1 : -1);
      const rr = 1.015 + Math.random() * 0.03;
      ap.set([rr * Math.sin(th), (north ? 1 : -1) * rr * Math.cos(th), 0.004], i * 3);
      ac.set([0.4, 1, 0.6], i * 3); as[i] = 6 + Math.random() * 6; aa[i] = 0.6;
    }
    const aur = add(api.makeDots(ap, ac, as, aa, { soft: 1, additive: true }));
    let t = 0;
    hook(dt => {
      t += dt;
      const Rn = api.R;
      for (let i = 0; i < N; i++) {
        const e = eddy[i];
        const base = Math.atan2(e.cy, e.cx) + t * e.drift, rr = Math.hypot(e.cx, e.cy);
        const a = e.ph + t * e.sp * 1.4;
        let x = rr * Math.cos(base) + e.rad * Math.cos(a), y = rr * Math.sin(base) + e.rad * Math.sin(a);
        const m = Math.hypot(x, y), lo = Rn.icb + 0.01, hi = Rn.cmb - 0.01;
        if (m < lo || m > hi) { const k = Math.min(hi, Math.max(lo, m)) / m; x *= k; y *= k; }
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = 0.003;
      }
      swirl.geometry.attributes.position.needsUpdate = true;
      for (let i = 0; i < M; i++) {
        const w = wind[i];
        w.x += dt * w.sp; if (w.x > 9) { w.x = -9; w.b = (Math.random() * 2 - 1) * 5.5; }
        const half = w.x > -2.3 ? Math.sqrt((w.x + 2.3) / 0.21) + 0.25 : 0;
        const y = Math.sign(w.b || 1) * Math.max(Math.abs(w.b), half);
        wp[i * 3] = w.x; wp[i * 3 + 1] = y; wp[i * 3 + 2] = 0.002;
        wa[i] = Math.max(0, Math.min(1, (9 - Math.abs(w.x)) / 2)) * 0.85;
      }
      windDots.geometry.attributes.position.needsUpdate = true; windDots.geometry.attributes.alpha.needsUpdate = true;
      aur.material.uniforms.uOpacity.value = 0.6 + 0.4 * Math.sin(t * 2.2);
    });
    addTag('Solar wind from the Sun →', -3.9, 2.2);
    addTag('Magnetic field', 3.2, 2.6, 'good');
    addTag('Aurora', 0.62, 1.15, 'good');
    addTag('Liquid iron swirls', 0, -(api.R.cmb + api.R.icb) / 2, 'warn');
    ui.banner('<b>Swirling liquid iron makes a magnetic shield.</b><small>The yellow solar wind gets pushed around Earth. A little slips in near the poles and makes the sky glow.</small>');
    ui.topicCard('core', '', opts);
  }

  // =================================================================
  // 3. EARTHQUAKE DETECTIVE
  // =================================================================
  const RE = 6371, RCMB = 3480, RICB = 1221;
  const tab = T => r => { const d = RE - r; for (let i = 1; i < T.length; i++) if (d <= T[i][0]) return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (d - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return T[T.length - 1][1]; };
  const lin = (r, r0, v0, r1, v1) => v0 + (v1 - v0) * (r - r0) / (r1 - r0);
  // wave speeds (km per second) — simplified from the PREM model
  const mP = tab([[0, 8.0], [400, 8.9], [430, 9.2], [660, 10.27], [690, 10.75], [771, 11.07], [2741, 13.68], [2891, 13.72]]);
  const mS = tab([[0, 4.45], [400, 4.77], [430, 4.95], [660, 5.57], [690, 5.95], [771, 6.24], [2741, 7.27], [2891, 7.26]]);
  const vP = r => r > RCMB ? mP(r) : r > RICB ? lin(r, RCMB, 8.06, RICB, 10.36) : lin(r, RICB, 11.03, 0, 11.26);
  const vS = r => r > RCMB ? mS(r) : r > RICB ? 0 : lin(r, RICB, 3.5, 0, 3.67);
  function trace(v, takeoffDeg) {
    const p = RE * Math.sin(takeoffDeg * Math.PI / 180) / v(RE);
    let r = RE, th = 0, t = 0, down = true, stopped = false;
    const ds = 12, out = [[r, th, t]];
    for (let k = 0; k < 6000; k++) {
      const vv = v(r);
      const s = Math.min(p * vv / Math.max(r, 1), 0.99999), ci = Math.sqrt(1 - s * s);
      let dr = (down ? -1 : 1) * ds * ci; const dth = ds * s / Math.max(r, 1);
      const rn = r + dr, vn = v(rn);
      if (vn === 0) { out.push([RCMB, th + dth, t + ds / vv]); stopped = true; break; }
      if (down && p * vn / rn >= 1) { down = false; dr = 0; }
      r += dr; th += dth; t += ds / vv;
      if (k % 3 === 0) out.push([r, th, t]);
      if (!down && r >= RE) { out.push([RE, th, t]); break; }
    }
    return { pts: out, delta: th * 180 / Math.PI, time: t, stopped };
  }
  // straight through the middle
  function straight(v) {
    const out = []; let t = 0;
    for (let r = RE; r > 0; r -= 20) { out.push([r, 0, t]); t += 20 / v(r); }
    for (let r = 0; r <= RE; r += 20) { out.push([r, Math.PI, t]); t += 20 / v(Math.max(r, 1)); }
    return { pts: out, delta: 180, time: t, stopped: false };
  }
  let quakeRays = null;
  function computeRays() {
    if (quakeRays) return quakeRays;
    const P = [straight(vP)], S = [];
    for (let a = 0.6; a < 88; a += a < 20 ? 0.55 : 1.6) { P.push(trace(vP, a)); S.push(trace(vS, a)); }
    S.unshift(trace(vS, 0.3));
    quakeRays = { P, S };
    return quakeRays;
  }
  function quake(opts = {}) {
    begin('quake', 'Earthquake Detective', opts, [{ icon: 'quake', label: 'Start quake', onClick: () => fire() }]);
    api.camTo({ dist: api.fitDist() * 1.08, px: 0, py: 0 }, 900);
    const rays = computeRays();
    let which = 'both', srcAngle = Math.PI / 2;   // the quake starts at the top
    const group = new THREE.Group(); add(group);
    let pLines = null, sLines = null, fronts = null, stationDots = null, marker = null, zoneLines = [];
    const SCALE = 1 / 85;     // 1 second on screen = 85 seconds of real time
    const stations = [];
    for (let deg = 10; deg <= 180; deg += 10) for (const side of (deg === 180 ? [1] : [-1, 1])) stations.push({ deg, side, p: null, s: null });
    const toXY = (r, th, side) => { const R = api.depthToR(RE - r); return [side * R * Math.sin(th), R * Math.cos(th)]; };
    let t = -1, tMax = 1;
    function build() {
      group.children.slice().forEach(o => { group.remove(o); o.dispose && o.dispose(); });
      zoneLines = [];
      const mk = (list, color) => {
        const lines = [], along = [];
        for (const ray of list) for (const side of [-1, 1]) {
          if (ray.delta === 180 && side < 0) continue;
          lines.push(ray.pts.map(([r, th]) => toXY(r, th, side))); along.push(ray.pts.map(p => p[2]));
        }
        const m = api.makeLine(lines, { color, width: 1.6, opacity: 0.85, along, z: 0.002 });
        m.material.uniforms.uHead.value = 0; group.add(m); return m;
      };
      pLines = mk(rays.P, [0.38, 0.84, 1.0]);
      sLines = mk(rays.S, [1.0, 0.56, 0.82]);
      // moving wave fronts (one dot per ray per side)
      const list = [];
      for (const ray of rays.P) for (const side of [-1, 1]) if (!(ray.delta === 180 && side < 0)) list.push({ ray, side, P: true });
      for (const ray of rays.S) for (const side of [-1, 1]) list.push({ ray, side, P: false });
      const n = list.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), al = new Float32Array(n);
      list.forEach((o, i) => { col.set(o.P ? [0.6, 0.92, 1] : [1, 0.7, 0.9], i * 3); size[i] = 6; al[i] = 0; });
      fronts = api.makeDots(pos, col, size, al, { soft: 1, additive: true }); fronts.userData.list = list; group.add(fronts);
      // seismograph stations around the edge
      const m2 = stations.length, sp = new Float32Array(m2 * 3), sc = new Float32Array(m2 * 3), ss = new Float32Array(m2), sa = new Float32Array(m2);
      stations.forEach((st, i) => { const a = st.deg * Math.PI / 180; sp.set([st.side * 1.045 * Math.sin(a), 1.045 * Math.cos(a), 0.003], i * 3); sc.set([0.55, 0.6, 0.68], i * 3); ss[i] = 11; sa[i] = 1; });
      stationDots = api.makeDots(sp, sc, ss, sa, { soft: 0 }); group.add(stationDots);
      // the quake itself
      marker = api.makeDots(new Float32Array([0, 1.0, 0.004, 0, 1.0, 0.005]), new Float32Array([1, 0.3, 0.2, 1, 1, 1]), new Float32Array([40, 12]), new Float32Array([0.9, 1]), { soft: 1 });
      group.add(marker);
      group.rotation.z = srcAngle - Math.PI / 2;
      // arrival times at each station
      stations.forEach(st => { st.p = st.s = null; });
      const land = (list, key) => list.forEach(ray => {
        if (ray.stopped) return;
        stations.forEach(st => { if (Math.abs(ray.delta - st.deg) <= 3.2) st[key] = Math.min(st[key] ?? 1e9, ray.time); });
      });
      land(rays.P, 'p'); land(rays.S, 's');
      tMax = Math.max(...rays.P.concat(rays.S).map(r => r.time));
    }
    build();
    let builtScale = api.scaleT;
    function shadowArcs() {
      // where no waves arrived: draw colored arcs just outside the Earth
      const pMax = Math.max(...rays.P.filter(r => !r.pts.some(p => p[0] < RCMB + 5)).map(r => r.delta));
      const pMinCore = Math.min(...rays.P.filter(r => r.pts.some(p => p[0] < RCMB + 5) && !r.pts.some(p => p[0] < RICB)).map(r => r.delta));
      const sMax = Math.max(...rays.S.filter(r => !r.stopped).map(r => r.delta));
      const arc = (a0, a1, rr, side) => { const pts = []; for (let a = a0; a <= a1 + 0.01; a += 1) { const q = a * Math.PI / 180; pts.push([side * rr * Math.sin(q), rr * Math.cos(q)]); } return pts; };
      const pz = api.makeLine([arc(pMax, pMinCore, 1.09, 1), arc(pMax, pMinCore, 1.09, -1)], { color: [0.38, 0.84, 1], width: 6, opacity: 0.9, z: 0.004 });
      const sz = api.makeLine([arc(sMax, 180, 1.13, 1), arc(sMax, 180, 1.13, -1)], { color: [1, 0.56, 0.82], width: 6, opacity: 0.9, z: 0.004 });
      group.add(pz); group.add(sz); zoneLines.push(pz, sz);
      const rot = group.rotation.z;
      const tg = (txt, a, rr, side, cls) => { const q = a * Math.PI / 180; const x = side * rr * Math.sin(q), y = rr * Math.cos(q); const c = Math.cos(rot), s = Math.sin(rot); const tt = addTag(txt, x * c - y * s, x * s + y * c, cls); tt.zone = true; };
      if (which !== 'S') tg('No P waves here (P shadow zone)', (pMax + pMinCore) / 2, 1.3, 1, '');
      if (which !== 'P') tg('No S waves past here (S shadow zone)', Math.min(150, sMax + 22), 1.36, -1, 'warn');
    }
    function fire() {
      t = 0;
      zoneLines.forEach(z => { group.remove(z); z.dispose(); }); zoneLines = [];
      tags.filter(x => x.zone).forEach(x => x.el.remove()); tags = tags.filter(x => !x.zone);
      stations.forEach((st, i) => { stationDots.geometry.attributes.color.setXYZ(i, 0.55, 0.6, 0.68); });
      stationDots.geometry.attributes.color.needsUpdate = true;
      ui.banner('<b>Earthquake!</b> Watch the waves race through Earth.');
    }
    hook(dt => {
      if (Math.abs(api.scaleT - builtScale) > 1e-3) { builtScale = api.scaleT; build(); }
      if (t < 0) { pLines.material.uniforms.uHead.value = 0; sLines.material.uniforms.uHead.value = 0; return; }
      t += dt / SCALE;
      const head = t;
      pLines.visible = which !== 'S'; sLines.visible = which !== 'P';
      pLines.material.uniforms.uHead.value = head; sLines.material.uniforms.uHead.value = head;
      // wave front dots
      const list = fronts.userData.list, pos = fronts.geometry.attributes.position, al = fronts.geometry.attributes.alpha;
      list.forEach((o, i) => {
        const show = o.P ? which !== 'S' : which !== 'P';
        const pts = o.ray.pts;
        if (!show || head > o.ray.time) { al.setX(i, 0); return; }
        let j = 1; while (j < pts.length - 1 && pts[j][2] < head) j++;
        const a = pts[j - 1], b = pts[j], f = Math.min(1, Math.max(0, (head - a[2]) / Math.max(b[2] - a[2], 1e-6)));
        const [x, y] = toXY(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, o.side);
        pos.setXYZ(i, x, y, 0.004); al.setX(i, 0.95);
      });
      pos.needsUpdate = true; al.needsUpdate = true;
      // stations light up
      const c = stationDots.geometry.attributes.color;
      stations.forEach((st, i) => {
        const gotP = which !== 'S' && st.p !== null && head >= st.p, gotS = which !== 'P' && st.s !== null && head >= st.s;
        if (gotP && gotS) c.setXYZ(i, 1, 1, 1); else if (gotS) c.setXYZ(i, 1, 0.56, 0.82); else if (gotP) c.setXYZ(i, 0.38, 0.84, 1);
      });
      c.needsUpdate = true;
      const mins = Math.floor(t / 60);
      if (!zoneLines.length) ui.banner(`<b>Time since the earthquake: ${mins} minute${mins === 1 ? '' : 's'}</b><small>Each dot on the edge is a seismograph. It lights up when waves arrive.</small>`);
      if (t >= tMax && !zoneLines.length) {
        shadowArcs();
        ui.banner('<b>Look at the far side!</b> Some seismographs got no waves at all.<small>That is the shadow zone. The liquid outer core blocks S waves and bends P waves.</small>');
      }
    });
    // tap the edge of the Earth to move the quake
    ui.tapHandler = (hit) => {
      if (!hit || hit.type !== 'layer' || hit.face !== face) return false;
      if (hit.r < 0.75) return false;
      srcAngle = Math.atan2(hit.y, hit.x);
      group.rotation.z = srcAngle - Math.PI / 2;
      tags.filter(x => x.zone).forEach(x => x.el.remove()); tags = tags.filter(x => !x.zone);
      fire();
      return true;
    };
    const c = ui.topicCard('quake', '', opts);
    const slot = c.querySelector('[data-slot="controls"]');
    slot.innerHTML = `<div class="actions" style="margin:4px 0 8px"><button class="act primary" data-q="go">${icon('quake')}<span>Start the earthquake<small>Watch the waves travel</small></span></button></div>
      <div class="seg2" role="radiogroup" aria-label="Which waves"><button role="radio" aria-checked="false" data-w="P">P waves</button><button role="radio" aria-checked="false" data-w="S">S waves</button><button role="radio" aria-checked="true" data-w="both">Both</button></div>`;
    slot.querySelector('[data-q="go"]').onclick = () => fire();
    slot.querySelectorAll('[data-w]').forEach(b => b.onclick = () => {
      which = b.dataset.w;
      slot.querySelectorAll('[data-w]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
      fire();
    });
    ui.banner('<b>Tap “Start the earthquake”</b> to send waves through Earth.<small>Tip: tap the edge of the Earth to move the earthquake.</small>');
  }

  function start(kind, opts) {
    if (kind === 'convection') convection(opts);
    else if (kind === 'core') core(opts);
    else if (kind === 'quake') quake(opts);
  }
  return { start, stop };
}
