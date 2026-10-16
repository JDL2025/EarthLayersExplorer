// =====================================================================
// Earth Explorer — Earth Time Machine ("Young Earth")
// Watch Earth form, sort into layers, get a Moon, oceans, and a shield.
// Content is in js/data/youngearth.js. Turn it off by removing that file's
// <script> line in index.html.
// =====================================================================
import { icon } from './icons.js';
import { NOISE as NOISE_SRC } from './glsl.js';

export function init(api, ui) {
  const Y = window.YOUNG_EARTH;
  if (!Y) return null;
  const THREE = api.THREE;
  const esc = ui.esc;
  const S = Y.stops;

  // entry button under the title
  const entry = document.createElement('button');
  entry.className = 'ye-entry';
  entry.innerHTML = `${icon('hourglass')}<span>Young Earth</span>`;
  entry.onclick = () => start();
  document.getElementById('hud').appendChild(entry);

  let bar = null, idx = -1, on = false, objs = [], hooks = [], stopFns = [];
  const su = api.surfaceUniforms, iu = api.uniforms;

  function add(o, parent = api.earth) { parent.add(o); objs.push({ o, parent }); return o; }
  function clearObjs() { objs.forEach(({ o, parent }) => { parent.remove(o); o.traverse && o.traverse(c => { c.geometry && c.geometry.dispose(); }); }); objs = []; hooks.forEach(h => api.frameHooks.delete(h)); hooks = []; stopFns.forEach(f => f()); stopFns = []; }
  const hook = f => { api.frameHooks.add(f); hooks.push(f); };

  function start(i) {
    ui.stopActivity(); ui.endTour(); ui.closePanels();
    on = true;
    document.body.classList.add('young-on');
    if (api.view !== 'cutaway') api.setView('cutaway'); else api.home();
    api.setHighlight(null);
    api.keepAnimating('young', true);
    ui.labelsHidden = true; ui.clearLabels();
    buildBar();
    ui.setHud('Earth Time Machine: watch how Earth got its layers.');
    if (typeof i === 'number') go(i); else intro();
  }
  function exit() {
    on = false;
    clearObjs();
    document.body.classList.remove('young-on');
    if (bar) { bar.remove(); bar = null; }
    // put Earth back to today
    su.uToday.value = 1; su.uDark.value = 1; su.uOcean.value = 1;
    iu.uSort.value = 1; iu.uMagma.value = 0; iu.uInner.value = 1;
    api.earth.scale.setScalar(1); api.atmo.scale.setScalar(1);
    api.keepAnimating('young', false);
    ui.labelsHidden = false;
    ui.closeCard(); ui.banner(null); ui.setHud();
    idx = -1;
    api.home();
  }

  // ---------- timeline bar ----------
  function buildBar() {
    if (bar) bar.remove();
    bar = document.createElement('div'); bar.className = 'ye-bar';
    const n = S.length;
    bar.innerHTML = `<button class="ye-btn" data-y="exit">${icon('x')}<span>Exit</span></button>
      <div class="ye-tl"><div class="ye-scale"><span>Long ago</span><span>Today</span></div>
      <div class="ye-track"><div class="ye-line"></div><div class="ye-fill"></div>
      ${S.map((s, i) => `<button class="ye-stop" data-ys="${i}" style="left:${(i / (n - 1)) * 100}%"><i></i><b>${esc(s.dateShort)}</b><span>${esc(s.short)}</span></button>`).join('')}</div></div>
      <button class="ye-btn ye-info" data-y="info">${icon('question')}<span>Info</span></button>`;
    document.body.appendChild(bar);
    bar.querySelector('[data-y="exit"]').onclick = exit;
    bar.querySelector('[data-y="info"]').onclick = () => idx < 0 ? intro() : go(idx, true);
    bar.querySelectorAll('[data-ys]').forEach(b => b.onclick = () => go(+b.dataset.ys));
  }
  function updateBar() {
    if (!bar) return;
    bar.querySelectorAll('[data-ys]').forEach((b, i) => { b.classList.toggle('on', i === idx); b.classList.toggle('past', i < idx); });
    bar.querySelector('.ye-fill').style.width = idx < 0 ? '0' : `${(idx / (S.length - 1)) * 100}%`;
  }

  // ---------- cards ----------
  function intro() {
    idx = -1; updateBar();
    const h = `<h2>${esc(Y.intro.title)}</h2><p class="ye-lead">${esc(Y.intro.lead)}</p>
      ${ui.part.points(Y.intro.points)}
      <div class="ye-nav one"><button class="tour-btn primary" data-yn="0">${esc(Y.intro.start)} →</button></div>`;
    const c = ui.showCard(h, { badge: 'Time machine', badgeColor: '#5ea6e6', badgeIcon: 'hourglass', kind: 'young', id: 'young' });
    c.querySelector('[data-yn]').onclick = () => go(0);
    setGlobe(S[0].globe, true);
  }
  function gaugesHTML(g) {
    const G = [['heat', 'Heat', 'flame'], ['layers', 'Layers', 'layers'], ['water', 'Water', 'drop'], ['shield', 'Shield', 'shield']];
    return `<div class="gauges ye-gauges">${G.map(([k, name, ic]) => {
      const v = g[k]; const bars = [0, 1, 2, 3].map(i => `<i class="${i < v[0] ? 'on' : ''}"></i>`).join('');
      return `<div class="gauge g-${k}">${icon(ic)}<span class="g-name">${name}</span><span class="g-bar">${bars}</span><b>${esc(v[1])}</b></div>`;
    }).join('')}</div>`;
  }
  function go(i, cardOnly) {
    idx = i; updateBar();
    const s = S[i];
    const next = S[i + 1];
    const h = `<div class="ye-when"><span class="ye-date">${esc(s.date)}</span></div>
      <h2>${esc(s.title)}</h2><p class="ye-lead">${esc(s.lead)}</p>
      ${gaugesHTML(s.gauges)}
      ${ui.part.points(s.points)}
      ${s.clue ? `<div class="box know"><h3>${icon('question')}How do we know?</h3><p>${esc(s.clue)}</p></div>` : ''}
      ${ui.part.debate(s.debate)}
      <div class="ye-nav ${i === 0 ? 'one' : ''}">
        ${i > 0 ? `<button class="tour-btn" data-yn="${i - 1}">← Back</button>` : ''}
        ${next ? `<button class="tour-btn primary" data-yn="${i + 1}">Next: ${esc(next.short)} →</button>` : `<button class="tour-btn primary" data-yx>Back to Earth today ✓</button>`}
      </div>`;
    const c = ui.showCard(h, { badge: `Stop ${i + 1} of ${S.length}`, badgeColor: '#5ea6e6', badgeIcon: 'hourglass', kind: 'young', id: 'young-' + i });
    c.querySelectorAll('[data-yn]').forEach(b => b.onclick = () => go(+b.dataset.yn));
    c.querySelector('[data-yx]')?.addEventListener('click', exit);
    if (!cardOnly) setGlobe(s.globe);
  }

  // ---------- how the planet looks at each stop ----------
  function fade(u, to, ms = 1600) { if (Array.isArray(to)) { u.value = to[0]; stopFns.push(api.fadeUniform(u, to[1], 6000)); } else stopFns.push(api.fadeUniform(u, to, ms)); }
  function setGlobe(g, instant) {
    clearObjs();
    const ms = instant ? 1 : 1600;
    fade(su.uToday, g.today, ms); fade(su.uDark, g.dark, ms); fade(su.uOcean, g.ocean, ms);
    fade(iu.uSort, g.sort, ms); fade(iu.uMagma, g.magma, ms); fade(iu.uInner, g.inner, ms);
    const from = api.earth.scale.x, to = g.size || 1;
    stopFns.push(api.tween(instant ? 1 : 1400, t => { const s = from + (to - from) * t; api.earth.scale.setScalar(s); api.atmo.scale.setScalar(s); }));
    api.atmo.visible = true;
    if (g.meteors) meteors();
    if (g.theia) theia();
    if (g.moon) moon(false);
    if (g.field) field();
    api.camTo({ dist: api.fitDist() * (g.theia ? 1.9 : g.field ? 2.0 : g.moon ? 1.25 : 1) }, 1200);
  }

  // falling space rocks with little flashes
  function meteors() {
    const N = 40, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), al = new Float32Array(N);
    const m = [];
    for (let i = 0; i < N; i++) { m.push(newRock()); col.set([1, 0.8, 0.5], i * 3); size[i] = 5; al[i] = 1; }
    function newRock() { const d = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize(); return { d, r: 2.5 + Math.random() * 3, sp: 0.8 + Math.random() * 1.2, flash: 0 }; }
    const dots = add(api.makeDots(pos, col, size, al, { soft: 1, additive: true }), api.scene);
    hook(dt => {
      for (let i = 0; i < N; i++) {
        const k = m[i];
        if (k.flash > 0) { k.flash -= dt; size[i] = 26 * Math.max(0, k.flash) + 4; al[i] = Math.max(0, k.flash * 2); if (k.flash <= 0) m[i] = newRock(); }
        else { k.r -= dt * k.sp; size[i] = 5; al[i] = 1; if (k.r <= api.earth.scale.x) { k.r = api.earth.scale.x * 1.01; k.flash = 0.6; } }
        const p = k.d.clone().multiplyScalar(k.r);
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      }
      dots.geometry.attributes.position.needsUpdate = true; dots.geometry.attributes.size.needsUpdate = true; dots.geometry.attributes.alpha.needsUpdate = true;
    });
  }
  // a Mars-sized planet hits Earth; rock flies out and makes the Moon
  function theia() {
    const mat = new THREE.MeshBasicMaterial({ color: 0x8a5a44 });
    const body = add(new THREE.Mesh(new THREE.SphereGeometry(0.53, 48, 32), mat), api.scene);
    const N = 500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), al = new Float32Array(N);
    const deb = [];
    for (let i = 0; i < N; i++) { deb.push({ a: Math.random() * 6.28, r: 1.6 + Math.random() * 1.6, h: (Math.random() - 0.5) * 0.25, w: 0.25 + Math.random() * 0.25 }); col.set([1, 0.7 + Math.random() * 0.3, 0.45], i * 3); size[i] = 2 + Math.random() * 3; al[i] = 0; }
    const ring = add(api.makeDots(pos, col, size, al, { soft: 1, additive: true }), api.scene);
    const moonMesh = moon(true);
    let t = 0;
    const flash = document.getElementById('flash');
    hook(dt => {
      t += dt;
      const hit = 3.2;
      if (t < hit) { const k = t / hit; body.visible = true; body.position.set(-4.2 + 3.0 * k * k, 0.9 - 0.45 * k * k, 0.6); }
      else body.visible = false;
      const f = t - hit;
      flash.style.opacity = f > 0 && f < 1.2 ? String(Math.max(0, 0.85 - f * 0.75)) : '0';
      for (let i = 0; i < N; i++) {
        const d = deb[i];
        const grow = Math.min(1, Math.max(0, f / 1.5));
        const fadeOut = f > 9 ? Math.max(0, 1 - (f - 9) / 3) : 1;
        const a = d.a + f * d.w, r = 1.05 + (d.r - 1.05) * grow;
        pos[i * 3] = r * Math.cos(a); pos[i * 3 + 1] = d.h * grow; pos[i * 3 + 2] = r * Math.sin(a);
        al[i] = f > 0 ? 0.9 * fadeOut : 0;
      }
      ring.geometry.attributes.position.needsUpdate = true; ring.geometry.attributes.alpha.needsUpdate = true;
      moonMesh.visible = f > 6.5;
      moonMesh.material.opacity = Math.min(1, (f - 6.5) / 2);
      if (t > 16) t = 16;
    });
    stopFns.push(() => { flash.style.opacity = '0'; });
  }
  function moon(hidden) {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { opacity: { value: 1 } },
      vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float opacity; varying vec3 vN; varying vec3 vP;
        ${NOISE_SRC}
        void main(){
          float lam = max(dot(normalize(vN), normalize(vec3(-0.45, 0.55, 0.75))), 0.0);
          float m = snoise(vP * 5.0) * 0.5 + 0.5, c = snoise(vP * 22.0) * 0.5 + 0.5;
          vec3 col = mix(vec3(0.78, 0.77, 0.74), vec3(0.45, 0.45, 0.47), smoothstep(0.55, 0.7, m));
          col *= 0.85 + 0.25 * c;
          gl_FragColor = vec4(col * (0.18 + 0.9 * lam), opacity);
        }`
    });
    const m = add(new THREE.Mesh(new THREE.SphereGeometry(0.27, 48, 32), mat), api.scene);
    m.material.opacity = 1; // keeps the theia() fade code working
    Object.defineProperty(m.material, 'opacity', { get() { return mat.uniforms.opacity.value; }, set(v) { mat.uniforms.opacity.value = v; } });
    m.visible = !hidden;
    let a = 0.6;
    hook(dt => { a += dt * 0.15; m.position.set(2.6 * Math.cos(a), 0.25, 2.6 * Math.sin(a) * 0.55 - 0.6); });
    return m;
  }
  // magnetic field lines around the planet (in a few slices through the poles)
  function field() {
    const g = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const plane = new THREE.Group(); plane.rotation.y = k * Math.PI / 3;
      const lines = [];
      for (const L of [1.7, 2.4, 3.3]) for (const side of [-1, 1]) {
        const pts = []; const th0 = Math.asin(Math.sqrt(1 / L));
        for (let j = 0; j <= 60; j++) { const th = th0 + (Math.PI - 2 * th0) * j / 60, r = L * Math.sin(th) ** 2; pts.push([side * r * Math.sin(th), r * Math.cos(th)]); }
        lines.push(pts);
      }
      const ln = api.makeLine(lines, { color: [0.5, 0.83, 1], width: 1.8, opacity: 0.55, dash: 8, z: 0 });
      ln.material.depthTest = true;
      plane.add(ln); g.add(plane);
    }
    add(g);
    stopFns.push(api.tween(1500, t => { g.children.forEach(p => p.children[0].material.uniforms.uOpacity.value = 0.55 * t); }));
  }

  return { start, exit };
}
