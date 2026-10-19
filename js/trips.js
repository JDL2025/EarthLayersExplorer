// =====================================================================
// Earth Explorer — trips: "Journey to the center" and "Dig straight through"
// Stops and numbers are in js/data/stops.js and js/data/places.js
// =====================================================================
import { icon } from './icons.js';
import { fmt } from './app.js';

const EARTH = 6371, THROUGH = 12742;

export function init(api, ui) {
  const THREE = api.THREE;
  const STOPS = window.STOPS || [], FAR = window.FAR_STOPS || [], PROF = window.DEPTH_PROFILE || { temp: [[0, 59]], squeeze: [[0, 1]] };
  const LAYERS = window.LAYERS;
  const esc = ui.esc;

  // ---------- numbers along the way ----------
  function interp(table, d, logy) {
    if (d <= table[0][0]) return table[0][1];
    for (let i = 1; i < table.length; i++) {
      if (d <= table[i][0]) {
        const [d0, v0] = table[i - 1], [d1, v1] = table[i], t = (d - d0) / (d1 - d0);
        return logy ? Math.exp(Math.log(v0) + (Math.log(v1) - Math.log(v0)) * t) : v0 + (v1 - v0) * t;
      }
    }
    return table[table.length - 1][1];
  }
  const tempF = d => interp(PROF.temp, d);
  const squeeze = d => interp(PROF.squeeze, d, true);
  const miles = km => km * 0.621371;
  function depthText(d) {
    if (d < 1) return [`${fmt(d * 1000)} m`, `${fmt(d * 3280.84)} feet`];
    if (d < 100) return [`${(Math.round(d * 10) / 10).toLocaleString('en-US')} km`, `${(Math.round(miles(d) * 10) / 10).toLocaleString('en-US')} miles`];
    return [`${fmt(d)} km`, `${fmt(miles(d))} miles`];
  }
  function roundNice(n) { const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1)); return Math.round(n / p) * p; }
  function squeezeText(x) {
    if (x < 1.5) return '1×';
    if (x < 1000) return `${fmt(roundNice(x))}×`;
    if (x < 1e6) return `${fmt(roundNice(x / 1000))} thousand×`;
    return `${(Math.round(x / 1e5) / 10).toFixed(1)} million×`;
  }
  function tempText(f) { return `${fmt(f < 1000 ? Math.round(f) : Math.round(f / 10) * 10)}°F`; }
  function driveText(km) {
    const h = miles(km) / 65;
    if (h < 1 / 60) return 'less than a minute';
    if (h < 1) { const m = Math.max(1, Math.round(h * 60)); return `${m} minute${m === 1 ? '' : 's'}`; }
    if (h < 36) { const r = Math.round(h); return `${r} hour${r === 1 ? '' : 's'}`; }
    return `${(Math.round(h / 24 * 10) / 10)} days`;
  }
  const layerOf = d => api.layerAtDepth(d, ui.state.advanced);

  // ---------- readout box (top left) ----------
  function readout(depth, dug) {
    const id = layerOf(depth), L = LAYERS[id];
    const [d1, d2] = depthText(depth);
    let h = `<div class="readout"><div class="r-layer"><i style="background:${L.color}"></i>${esc(L.name)}<small>${L.advanced ? 'advanced layer' : 'layer'}</small></div><dl>
      <dt>Depth</dt><dd><b>${d1}</b><span>${d2}</span></dd>`;
    if (dug !== undefined && dug > EARTH + 1) { const [g1, g2] = depthText(dug); h += `<dt>Distance dug</dt><dd><b>${g1}</b><span>${g2}</span></dd>`; }
    h += `<dt>Heat</dt><dd><b>${tempText(tempF(depth))}</b></dd>
      <dt>Squeeze</dt><dd><b>${squeezeText(squeeze(depth))}</b><span>the air pressure at the surface</span></dd>
      <dt>Drive time</dt><dd><b>${driveText(dug ?? depth)}</b><span>at 65 mph, if you could drive there</span></dd></dl></div>`;
    ui.hudExtra.innerHTML = h;
  }

  // ---------- drawing on the slice ----------
  const face = api.sliceFace;
  let objs = [];
  function clearObjs() { objs.forEach(o => { face.remove(o); o.dispose && o.dispose(); }); objs = []; }
  function add(o) { face.add(o); objs.push(o); return o; }
  let shaft = null, shaftLit = null, capsule = null, ticks = null, builtScale = -1, shaftLen = EARTH;
  // y position on the slice for a distance dug (past the center, you head down the far side)
  const yFor = dug => dug <= EARTH ? api.depthToR(dug) : -api.depthToR(THROUGH - dug);
  function buildShaft(len, stops) {
    clearObjs(); shaftLen = len; builtScale = api.scaleT;
    const pts = [], along = [];
    const N = 260;
    for (let i = 0; i <= N; i++) {
      // more points near the surface where everything is squeezed together
      const u = i / N, half = len > EARTH ? (u < 0.5 ? u * 2 : (1 - u) * 2) : u;
      let dug = Math.pow(half, 3) * EARTH;
      if (len > EARTH && u >= 0.5) dug = THROUGH - dug;
      pts.push([0, yFor(dug)]); along.push(dug);
    }
    if (len > EARTH) { pts.sort((a, b) => b[1] - a[1]); along.sort((a, b) => a - b); }
    shaft = add(api.makeLine(pts, { color: [1, 1, 1], width: 2.5, opacity: 0.45, dash: 60, z: 0.0006, along: along.map(a => a / len * 1) }));
    shaft.material.uniforms.uDash.value = 0;
    shaftLit = add(api.makeLine(pts, { color: [1, 0.86, 0.55], width: 4.5, opacity: 1, z: 0.0008, along }));
    shaftLit.material.uniforms.uHead.value = 0;
    // stop marks
    const n = stops.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), al = new Float32Array(n);
    stops.forEach((s, i) => { pos.set([0, yFor(s.dug), 0.001], i * 3); col.set([1, 1, 1], i * 3); size[i] = 7; al[i] = 0.9; });
    ticks = n ? add(api.makeDots(pos, col, size, al, { soft: 0 })) : null;
    // the capsule
    const cp = new Float32Array([0, 1, 0.0012, 0, 1, 0.0013]), cc = new Float32Array([1, 0.75, 0.35, 1, 1, 1]);
    capsule = add(api.makeDots(cp, cc, new Float32Array([46, 15]), new Float32Array([0.95, 1]), { soft: 1, additive: false }));
  }
  function placeCapsule(dug) {
    const y = yFor(dug);
    const p = capsule.geometry.attributes.position;
    p.setY(0, y); p.setY(1, y); p.needsUpdate = true;
    shaftLit.material.uniforms.uHead.value = dug;
    api.requestRender();
  }
  // camera follows the capsule
  const follow = { on: true, dug: 0 };
  function followTarget(dug, depth) {
    const minH = api.scaleT > 0.5 ? 0.006 : 0.022;
    let h = (1 - api.depthToR(Math.min(depth * 2.5 + 1, EARTH))) * 1.7;
    h = Math.max(minH, Math.min(1.2, h));
    if (depth > 2000) h = 1.2;
    const w = api.faceToWorld(face, 0, yFor(dug));
    const dist = h / 0.3153;
    return { px: dist > 3 ? 0 : w.x, py: dist > 3 ? 0 : w.y, dist: Math.max(dist, 0.012) };
  }
  // stop following when you pinch or drag; tap a button to follow again
  const canvas = api.renderer.domElement;
  const unfollow = () => { if (state) follow.on = false; };
  canvas.addEventListener('pointerdown', unfollow);
  canvas.addEventListener('wheel', unfollow);

  // floating "You are here" tag
  let tagEl = null;
  function tag(html) {
    if (!tagEl) { tagEl = document.createElement('div'); tagEl.className = 'tag-mark big'; document.getElementById('labels').appendChild(tagEl); }
    tagEl.innerHTML = html;
  }
  function placeTag() {
    if (!tagEl || !capsule || !state || state.phase === 'pick' || state.phase === 'exit') { if (tagEl) tagEl.style.display = 'none'; return; }
    const w = api.faceToWorld(face, 0, yFor(state.dug));
    const p = api.project(w);
    tagEl.style.display = p.ok ? '' : 'none';
    tagEl.style.transform = `translate(${p.x + 26}px, ${p.y}px) translate(0, -50%)`;
  }

  // ---------- shared trip state ----------
  let state = null;
  function frame(dt) {
    if (!state) return;
    if (state.phase === 'pick' || state.phase === 'exit') return;
    if (Math.abs(api.scaleT - builtScale) > 1e-3) { buildShaft(shaftLen, state.stops); placeCapsule(state.dug); }
    if (follow.on) {
      const depth = state.dug <= EARTH ? state.dug : THROUGH - state.dug;
      const t = followTarget(state.dug, depth);
      const k = Math.min(1, dt * 4);
      api.cam.px += (t.px - api.cam.px) * k; api.cam.py += (t.py - api.cam.py) * k;
      api.cam.dist *= Math.pow(t.dist / api.cam.dist, k);
      api.requestRender();
    }
  }
  api.frameHooks.add(frame);
  ui.afterRenderHooks.add(placeTag);

  function cleanup() {
    digCleanup();
    clearObjs(); shaft = shaftLit = capsule = ticks = null;
    if (tagEl) { tagEl.remove(); tagEl = null; }
    if (pinTag) { pinTag.remove(); pinTag = null; }
    if (pin) { api.earth.remove(pin); pin = null; }
    if (depthbar) { depthbar.remove(); depthbar = null; }
    showCities(false);
    if (state && state.stopAnim) state.stopAnim();
    api.setGlobeOnly(false);
    ui.restoreBar();
    state = null;
    api.keepAnimating('trip', false);
  }

  // =================================================================
  // JOURNEY TO THE CENTER
  // =================================================================
  let depthbar = null;
  const sOf = d => Math.cbrt(d / EARTH), dOf = s => Math.pow(s, 3) * EARTH;
  function journey(opts = {}) {
    ui.startActivity({
      id: 'journey', title: 'Journey to the center', onStop: cleanup,
      buttons: [
        { icon: 'up', label: 'Up', onClick: () => jump(-1) },
        { icon: 'down', label: 'Down', onClick: () => jump(1) }
      ]
    });
    ui.tapHandler = () => true;      // tapping the Earth does nothing during the trip, so kids stay in the elevator
    if (api.view !== 'slice') api.setView('slice');
    const stops = STOPS.map(s => ({ ...s, dug: s.depth }));
    state = { kind: 'journey', phase: 'ride', dug: 0, stops };
    api.keepAnimating('trip', true);
    setTimeout(() => {
      if (!state || state.kind !== 'journey') return;
      buildShaft(EARTH, stops);
      setDepth(opts.stop ? stops[opts.stop].depth : 0, true);
    }, 950);
    ui.topicCard('journey');
    ui.setHud('Journey to the center: drag the round button down.');
    if (innerWidth < 900) setTimeout(() => ui.closeCard(), 2500);
    // the depth slider on the left
    depthbar = document.createElement('div');
    depthbar.className = 'depthbar';
    depthbar.innerHTML = `<span class="d-cap">Surface</span><div class="d-track"><div class="d-rail"></div><div class="d-thumb">${icon('down')}</div></div><span class="d-cap">Center</span>`;
    document.body.appendChild(depthbar);
    const rail = depthbar.querySelector('.d-rail');
    rail.style.background = `linear-gradient(${['crust', 'mantle', 'outer', 'inner'].map(k => {
      const top = sOf({ crust: 0, mantle: 35, outer: 2890, inner: 5150 }[k]) * 100, bot = sOf({ crust: 35, mantle: 2890, outer: 5150, inner: 6371 }[k]) * 100;
      return `${LAYERS[k].color} ${top}%, ${LAYERS[k].color} ${bot}%`; }).join(', ')})`;
    const track = depthbar.querySelector('.d-track');
    stops.forEach((s, i) => { if (!i) return; const t = document.createElement('i'); t.className = 'd-tick'; t.style.top = sOf(s.depth) * 100 + '%'; track.appendChild(t); });
    const thumb = depthbar.querySelector('.d-thumb');
    positionBar();
    let drag = false;
    const fromEvent = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); };
    track.addEventListener('pointerdown', e => { drag = true; track.setPointerCapture(e.pointerId); follow.on = true; setDepth(dOf(fromEvent(e))); });
    track.addEventListener('pointermove', e => { if (drag) setDepth(dOf(fromEvent(e))); });
    track.addEventListener('pointerup', () => { drag = false; });
    track.addEventListener('pointercancel', () => { drag = false; });
    state.thumb = thumb;
  }
  // keep the slider at the right side of the open space (left of the card, if one is open)
  function positionBar() {
    if (!depthbar) return;
    const card = document.getElementById('card');
    const r = card.hidden ? null : card.getBoundingClientRect();
    const right = r && r.left > 40 ? innerWidth - r.left + 12 : 16;
    depthbar.style.right = right + 'px'; depthbar.style.left = 'auto';
  }
  ui.afterRenderHooks.add(positionBar);
  function setDepth(d, instant) {
    if (!state || state.kind !== 'journey') return;
    d = Math.max(0, Math.min(EARTH, d));
    state.dug = d;
    if (capsule) placeCapsule(d);
    if (state.thumb) state.thumb.style.top = sOf(d) * 100 + '%';
    readout(d);
    // which stop are we at (or just passed)?
    let idx = 0;
    state.stops.forEach((s, i) => { if (d >= s.depth - Math.min(20, Math.max(0.02, s.depth * 0.04))) idx = i; });
    state.idx = idx;
    const s = state.stops[idx];
    tag(`${icon('pin')} ${esc(depthText(d)[0])}`);
    if (idx > 0) ui.banner(`<b>${esc(s.title)}</b><small>${esc(fill(s.text))}${s.adv && ui.state.advanced ? ' ' + esc(s.adv) : ''}</small>`);
    else ui.banner('<b>Drag the round button down to start your trip!</b><small>Or tap Down at the bottom to jump to the first stop.</small>');
    if (instant) { const t = followTarget(d, d); Object.assign(api.cam, t); }
    api.requestRender();
  }
  function jump(dir) {
    if (!state || state.kind !== 'journey') return;
    follow.on = true;
    const cur = state.dug;
    let target;
    if (dir > 0) target = (state.stops.find(s => s.depth > cur + 1e-4) || state.stops[state.stops.length - 1]).depth;
    else target = ([...state.stops].reverse().find(s => s.depth < cur - 1e-4) || state.stops[0]).depth;
    animateDug(cur, target, d => setDepth(d));
  }
  function animateDug(from, to, fn, done) {
    if (state.stopAnim) state.stopAnim();
    // move evenly in "slider space" so short and long hops both look smooth
    const s0 = Math.cbrt(from / EARTH), s1 = Math.cbrt(to / EARTH);
    const ms = 900 + 1400 * Math.min(1, Math.abs(s1 - s0) * 2.5);
    state.stopAnim = api.tween(ms, t => { const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; fn(EARTH * Math.pow(s0 + (s1 - s0) * e, 3)); }, () => { state && (state.stopAnim = null); done && done(); });
  }

  // =================================================================
  // DIG STRAIGHT THROUGH
  // =================================================================
  let pin = null, pinTag = null;
  // land or water? (from a small black-and-white map: white = water)
  let mask = null;
  (() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      mask = { w: img.width, h: img.height, data: g.getImageData(0, 0, img.width, img.height).data };
    };
    img.src = 'assets/textures/water-mask.png';
  })();
  function isWater(lat, lon) {
    if (!mask) return false;
    const x = Math.floor(((lon + 180) / 360) * mask.w) % mask.w, y = Math.min(mask.h - 1, Math.floor(((90 - lat) / 180) * mask.h));
    return mask.data[(y * mask.w + x) * 4] > 128;
  }
  function oceanName(lat, lon) {
    const inBox = (a, b, c, d) => lat >= a && lat <= b && lon >= c && lon <= d;
    if (inBox(41, 49.5, -92.6, -76)) return 'one of the Great Lakes';
    if (inBox(18, 30.5, -98, -81)) return 'Gulf of Mexico';
    if (inBox(9, 22, -88, -60)) return 'Caribbean Sea';
    if (inBox(30, 46, -6, 36.5)) return 'Mediterranean Sea';
    if (inBox(40.5, 47, 27, 42)) return 'Black Sea';
    if (inBox(36, 47.5, 46.5, 55)) return 'Caspian Sea';
    if (inBox(51, 64, -95.5, -76)) return 'Hudson Bay';
    if (lat < -60) return 'Southern Ocean';
    if (lat > 66) return 'Arctic Ocean';
    if ((lon >= 20 && lon <= 120 && lat < 31) || (lon > 120 && lon <= 147 && lat < -11)) return 'Indian Ocean';
    let pacEdge;
    if (lat > 50) pacEdge = -150; else if (lat > 15) pacEdge = -105; else if (lat > 8) pacEdge = -84; else if (lat > -55) pacEdge = -72; else pacEdge = -67;
    if (lon < pacEdge || lon > 120) return 'Pacific Ocean';
    return 'Atlantic Ocean';
  }
  function distKm(a, b, c, d) {
    const r = Math.PI / 180, h = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
    return 2 * EARTH * Math.asin(Math.sqrt(h));
  }
  function bearingName(fromLat, fromLon, toLat, toLon) {
    const r = Math.PI / 180;
    const y = Math.sin((toLon - fromLon) * r) * Math.cos(toLat * r);
    const x = Math.cos(fromLat * r) * Math.sin(toLat * r) - Math.sin(fromLat * r) * Math.cos(toLat * r) * Math.cos((toLon - fromLon) * r);
    const b = (Math.atan2(y, x) / r + 360) % 360;
    return ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'][Math.round(b / 45) % 8];
  }
  function describe(lat, lon) {
    const water = isWater(lat, lon);
    let best = null;
    for (const [name, la, lo] of (window.PLACES || [])) {
      const d = distKm(lat, lon, la, lo);
      if (!best || d < best.d) best = { name, d, la, lo };
    }
    const far = best ? `about ${fmt(roundNice(best.d))} km (${fmt(roundNice(miles(best.d)))} miles) ${bearingName(best.la, best.lo, lat, lon)} of ${best.name}` : '';
    if (Math.abs(lat) > 88) { const n = lat > 0 ? 'the North Pole' : 'the South Pole'; return { water, text: n, short: n, phrase: 'at ' + n }; }
    if (water) {
      const sea = oceanName(lat, lon);
      if (best && best.d < 150) return { water, text: `the water near ${best.name}`, short: `the water near ${best.name}`, phrase: `in the water near ${best.name}` };
      const sh = sea.startsWith('one of') ? sea : `the ${sea}`;
      return { water, text: `${sh}, ${far}`, short: sh, phrase: `in ${sh}`, sea };
    }
    if (best && best.d < 120) return { water, text: best.name, short: best.name, phrase: `in ${best.name}` };
    return { water, text: `a spot ${far}`, short: `a spot near ${best ? best.name : 'nowhere'}`, phrase: `near ${best ? best.name : 'nowhere'}` };
  }
  ui.describePlace = describe;

  function placePin(local, label) {
    if (!pin) {
      pin = api.makeDots(new Float32Array([0, 0, 0, 0, 0, 0]), new Float32Array([1, 0.45, 0.3, 1, 1, 1]), new Float32Array([30, 11]), new Float32Array([0.85, 1]), { soft: 1 });
      pin.renderOrder = 5; pin.material.depthTest = true;
      api.earth.add(pin);
    }
    const p = pin.geometry.attributes.position;
    const v = local.clone().normalize().multiplyScalar(1.004);
    p.setXYZ(0, v.x, v.y, v.z); p.setXYZ(1, v.x, v.y, v.z); p.needsUpdate = true;
    pin.userData.local = v;
    if (!pinTag) { pinTag = document.createElement('div'); pinTag.className = 'tag-mark big'; document.getElementById('labels').appendChild(pinTag); }
    pinTag.innerHTML = label;
    api.requestRender();
  }
  ui.afterRenderHooks.add(() => {
    if (!pin || !pinTag) return;
    const w = api.earth.localToWorld(pin.userData.local.clone());
    const n = w.clone().normalize(), toCam = api.camera.position.clone().sub(w).normalize();
    const p = api.project(w);
    const vis = p.ok && n.dot(toCam) > 0.05 && pin.visible && !burstOn;
    pinTag.style.display = vis ? '' : 'none';
    pinTag.style.transform = `translate(${p.x}px, ${p.y - 30}px) translate(-50%, -100%)`;
  });

  function dig(opts = {}) {
    ui.startActivity({ id: 'dig', title: 'Dig straight through', onStop: cleanup });
    state = { kind: 'dig', phase: 'pick', dug: 0, stops: [] };
    api.keepAnimating('trip', true);
    const [hla, hlo] = homeLatLon();
    api.setView('cutaway', { yaw: api.yawFor(hlo), pitch: Math.min(1.1, hla * Math.PI / 180 * 0.9) });
    api.setGlobeOnly(true);
    ui.setHud('Tap anywhere on the globe to dig straight through.');
    ui.topicCard('dig');
    showCities(true);
    ui.tapHandler = (hit, x, y) => {
      if (!state || state.phase !== 'pick') return false;
      const city = cityAt(x, y);
      if (city) { chooseStart(city[1], city[2], true, city[0]); return true; }
      if (hit && hit.type === 'surface') { chooseStart(hit.lat, hit.lon, true); return true; }
      return true;
    };
  }
  // ---------- big-city dots for picking a starting place ----------
  const CITY_NAMES = window.DIG_CITIES || [];
  const cities = CITY_NAMES.map(n => (window.PLACES || []).find(p => p[0] === n)).filter(Boolean);
  let cityDots = null, cityTags = [];
  function showCities(on) {
    if (cityDots) { api.earth.remove(cityDots); cityDots.geometry.dispose(); cityDots = null; }
    cityTags.forEach(t => t.remove()); cityTags = [];
    if (!on || !cities.length) { api.requestRender(); return; }
    const n = cities.length, pos = new Float32Array(n * 6), col = new Float32Array(n * 6), size = new Float32Array(n * 2), al = new Float32Array(n * 2);
    cities.forEach(([name, la, lo], i) => {
      const v = api.latLonToLocal(la, lo, 1.004);
      const home = name === (window.HOMETOWN || [])[0];
      pos.set([v.x, v.y, v.z, v.x, v.y, v.z], i * 6);
      col.set(home ? [1, 0.55, 0.3, 1, 1, 1] : [0.2, 0.25, 0.35, 1, 1, 1], i * 6);
      size.set(home ? [20, 11] : [15, 8], i * 2); al.set([0.95, 1], i * 2);
      const tag = document.createElement('div');
      tag.className = 'tag-mark city' + (home ? ' home' : '');
      tag.textContent = name.split(',')[0];
      document.getElementById('labels').appendChild(tag);
      cityTags.push(tag);
    });
    cityDots = api.makeDots(pos, col, size, al, { soft: 0 });
    cityDots.renderOrder = 6;
    api.earth.add(cityDots);
    api.requestRender();
  }
  function cityScreen(c) {
    const w = api.earth.localToWorld(api.latLonToLocal(c[1], c[2], 1.004));
    const toCam = api.camera.position.clone().sub(w).normalize();
    const p = api.project(w);
    return { p, vis: p.ok && w.clone().normalize().dot(toCam) > 0.12 };
  }
  function cityAt(x, y) {
    if (!cityDots) return null;
    let best = null, bd = 26;
    cities.forEach(c => { const s = cityScreen(c); if (!s.vis) return; const d = Math.hypot(s.p.x - x, s.p.y - y); if (d < bd) { bd = d; best = c; } });
    return best;
  }
  ui.afterRenderHooks.add(() => {
    if (!cityDots) return;
    const placed = [];
    // on the "you pop out" globe, keep city names out from under the "You pop out here!" tag
    let pp = null;
    if (pin && pin.visible && state && state.phase === 'exit') { const q = api.project(api.earth.localToWorld(pin.userData.local.clone())); if (q.ok) pp = q; }
    // and out from under the boxes at the top of the screen
    const boxes = [...document.querySelectorAll('.readout, .banner')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0);
    const underBox = (x, y) => boxes.some(r => x > r.left - 50 && x < r.right + 50 && y - 40 < r.bottom && y > r.top);
    cities.forEach((c, i) => {
      const t = cityTags[i], s = cityScreen(c);
      const home = t.classList.contains('home');
      let show = s.vis;
      if (show && underBox(s.p.x, s.p.y)) show = false;
      const below = !!(show && pp && Math.abs(s.p.x - pp.x) < 125 && s.p.y > pp.y - 50 && s.p.y < pp.y + 14);   // would sit under the tag: put the name below its dot
      if (show && !home) for (const q of placed) if (Math.abs(q.x - s.p.x) < 58 && Math.abs(q.y - s.p.y) < 20) { show = false; break; }
      t.style.display = show ? '' : 'none';
      if (show) { placed.push(below ? { x: s.p.x, y: s.p.y + 40 } : s.p); t.style.transform = below ? `translate(${s.p.x}px, ${s.p.y + 12}px) translate(-50%, 0)` : `translate(${s.p.x}px, ${s.p.y - 16}px) translate(-50%, -100%)`; }
    });
  });

  function homeLatLon() { const h = window.HOMETOWN || ['Chicago, Illinois', 41.88, -87.63]; return [h[1], h[2]]; }
  function chooseStart(lat, lon, fromTap, cityName) {
    if (!state || state.kind !== 'dig') return;
    const local = api.latLonToLocal(lat, lon);
    const place = cityName ? { water: false, text: cityName, short: cityName, phrase: `in ${cityName}` } : describe(lat, lon);
    state.start = { lat, lon, local, place };
    placePin(local, `${icon('pin')} Start: ${esc(place.short)}`);
    const slot = document.querySelector('[data-slot="controls"]');
    if (slot) {
      slot.innerHTML = `<div class="box compare" style="margin:0 0 10px"><h3>${icon('pin')}Your starting place</h3><p>${esc(cap(place.text))}${place.water ? ' (That is water! You will dig through the ocean floor.)' : ''}</p></div>
        <div class="actions" style="margin:0 0 6px"><button class="act primary" data-dig="go">${icon('drill')}<span>Start digging here!<small>Or tap a different place on the globe</small></span></button></div>`;
      slot.querySelector('[data-dig="go"]').onclick = beginRide;
    }
    if (!fromTap) beginRide();
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function fill(t) {
    if (!state) return t;
    return t.replace('{start}', state.start ? state.start.place.text : 'the surface').replace('{exit}', state.exit ? state.exit.place.phrase : 'on the other side');
  }
  function beginRide() {
    if (!state || !state.start) return;
    const { lat, lon } = state.start;
    const alat = -lat, alon = lon > 0 ? lon - 180 : lon + 180;
    state.exit = { lat: alat, lon: alon, local: api.latLonToLocal(alat, alon), place: describe(alat, alon) };
    state.stops = [];                // no stops: the Journey trip teaches the layers, this one is just for fun
    state.phase = 'ready'; state.dug = 0;
    ui.tapHandler = () => true;      // taps do nothing during the dig
    ui.setHud(`Digging from ${state.start.place.short}`);
    showCities(false);
    api.setGlobeOnly(false);
    if (pin) pin.visible = false;
    if (pinTag) pinTag.style.display = 'none';
    follow.on = false;               // the camera shows the whole tunnel
    api.setView('slice', { up: state.start.local });
    readyCard();
    setTimeout(() => {
      if (!state || state.kind !== 'dig' || state.phase !== 'ready') return;
      buildShaft(THROUGH, []);
      placeCapsule(0);
      digReadout(0);
      tag(`${icon('pin')} Start`);
    }, 1000);
  }
  // a small drawing of the whole tunnel
  function tripPic() {
    const R = { crust: 0.915, cmb: 0.546, icb: 0.192 };
    const cx = 200, cy = 110, s = 96;
    const ring = (r, c) => `<circle cx="${cx}" cy="${cy}" r="${s * r}" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>`;
    return `<figure class="pic"><svg viewBox="0 0 400 220" role="img" aria-label="Your tunnel goes straight through the center of the Earth">
      <rect width="400" height="220" fill="#070a10"/>
      ${ring(1, LAYERS.crust.color)}${ring(R.crust, LAYERS.mantle.color)}${ring(R.cmb, LAYERS.outer.color)}${ring(R.icb, LAYERS.inner.color)}
      <line x1="${cx}" y1="${cy - s}" x2="${cx}" y2="${cy + s}" stroke="rgba(255,255,255,.75)" stroke-width="2.5" stroke-dasharray="5 5"/>
      <circle cx="${cx}" cy="${cy - s}" r="7" fill="#fff" stroke="#e9b47c" stroke-width="3"/>
      <line x1="${cx + 10}" y1="${cy - s}" x2="${cx + 66}" y2="${cy - s}" stroke="#fff" stroke-width="1.5"/>
      <text x="${cx + 72}" y="${cy - s + 5}" fill="#fff" font-size="15" font-weight="700" font-family="Atkinson Hyperlegible, sans-serif">You start here</text>
      <line x1="${cx + 4}" y1="${cy + s}" x2="${cx + 66}" y2="${cy + s}" stroke="#a8b3c5" stroke-width="1.5"/>
      <text x="${cx + 72}" y="${cy + s + 5}" fill="#a8b3c5" font-size="15" font-family="Atkinson Hyperlegible, sans-serif">Other side</text>
    </svg><figcaption>Your tunnel goes straight through the center of the Earth (the crust is drawn thicker than real).</figcaption></figure>`;
  }
  function readyCard() {
    const h = `<h2>Ready to dig!</h2>
      ${tripPic()}
      <div class="box compare" style="margin-top:6px"><h3>${icon('pin')}Your starting place</h3><p>${esc(cap(state.start.place.text))}</p></div>
      <p class="note">Tap <b>Start digging</b> and watch your tunnel zoom through the Earth. Where will you pop out?</p>`;
    ui.showCard(h, { badge: 'Dig straight through', badgeColor: '#e9b47c', badgeIcon: 'drill', kind: 'dig', id: 'dig' });
    ui.useBar({ progress: 'Your tunnel is ready', onPrev: null, nextLabel: 'Start digging', onNext: startDig });
  }
  // the box in the top left: just the layer and how far you have dug
  function digReadout(dug) {
    const depth = dug <= EARTH ? dug : THROUGH - dug;
    const L = LAYERS[layerOf(depth)];
    const [g1, g2] = depthText(dug);
    ui.hudExtra.innerHTML = `<div class="readout"><div class="r-layer"><i style="background:${L.color}"></i>${esc(L.name)}<small>${L.advanced ? 'advanced layer' : 'layer'}</small></div><dl>
      <dt>Distance dug</dt><dd><b>${dug < 0.5 ? '0 km' : g1}</b><span>${dug < 0.5 ? '0 miles' : g2}</span></dd></dl></div>`;
  }
  // ---------- the dig: about 5 seconds, slow at the start, fastest at the core, slow at the end ----------
  const DIG_MS = 5000;
  function startDig() {
    if (!state || state.kind !== 'dig' || state.phase !== 'ready') return;
    state.phase = 'dig';
    ui.useBar(null);
    ui.closeCard();
    ui.banner(null);
    if (!capsule) { buildShaft(THROUGH, []); placeCapsule(0); }
    api.camTo({ dist: api.fitDist(true), px: 0, py: 0 }, 700);
    setTimeout(() => {
      if (!state || state.phase !== 'dig') return;
      // ease along the drawn tunnel (screen distance), like a subway train leaving and arriving
      const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const dugAt = y => y >= 0 ? api.rToDepth(y) : THROUGH - api.rToDepth(-y);
      state.stopAnim = api.tween(DIG_MS, t => {
        const dug = Math.max(0, Math.min(THROUGH, dugAt(1 - 2 * ease(t))));
        state.dug = dug; placeCapsule(dug); digReadout(dug);
        tag(`${icon('drill')} ${esc(depthText(dug)[0])}`);
      }, () => {
        if (!state || state.phase !== 'dig') return;
        state.stopAnim = null;
        state.dug = THROUGH; placeCapsule(THROUGH); digReadout(THROUGH);
        tag(`${icon('drill')} ${esc(depthText(THROUGH)[0])}`);
        state.timer = setTimeout(showExit, 450);
      });
    }, 550);
  }
  function showExit() {
    if (!state || state.kind !== 'dig') return;
    state.phase = 'exit';
    const { lat, lon } = state.exit;
    api.setView('cutaway', { yaw: api.yawFor(lon), pitch: Math.max(-1.1, Math.min(1.1, lat * Math.PI / 180 * 0.9)) });
    api.setGlobeOnly(true);
    showCities(true);                // city names help kids see what they popped out near
    placePin(state.exit.local, `${icon('pin')} You pop out here!`);
    pin.visible = false;             // hidden until the light burst
    state.timer = setTimeout(() => {
      if (!state || state.phase !== 'exit') return;
      burst();
      ui.banner(`<b>You pop out ${esc(state.exit.place.phrase)}!</b><small>Your trip started at ${esc(state.start.place.short)}, on the other side of the world.</small>`);
      state.timer = setTimeout(() => { if (state && state.phase === 'exit') { endCard(); showAgain(); } }, 1300);
    }, 950);
  }
  // ---------- a burst of light where you pop out ----------
  let flash = null, burstEl = null, burstOn = false;   // the "You pop out here!" tag waits until the flash fades
  function burst() {
    const v = state.exit.local.clone().normalize().multiplyScalar(1.006);
    if (flash) { api.earth.remove(flash); flash.geometry.dispose(); }
    flash = api.makeDots(new Float32Array([v.x, v.y, v.z, v.x, v.y, v.z]), new Float32Array([1, 0.62, 0.3, 1, 0.97, 0.85]),
      new Float32Array([0, 0]), new Float32Array([1, 1]), { soft: 1, additive: true, depthTest: false });
    flash.renderOrder = 7; flash.userData.local = v;
    api.earth.add(flash);
    // CSS rings and sparks on top
    if (burstEl) burstEl.remove();
    burstEl = document.createElement('div');
    burstEl.className = 'pop-burst';
    burstEl.innerHTML = '<i class="ring"></i><i class="ring r2"></i>' +
      Array.from({ length: 12 }, (_, i) => `<b class="spark" style="--a:${i * 30 + 15}deg;--d:${i % 2 ? 70 : 95}px"></b>`).join('');
    document.getElementById('labels').appendChild(burstEl);
    const sz = flash.geometry.attributes.size, al = flash.geometry.attributes.alpha;
    const pz = pin.geometry.attributes.size;
    pin.visible = true; burstOn = true;
    const MS = 1500;
    const stop = api.tween(MS, t => {
      // flash: grows fast for a split second, then shrinks down to the dot
      const up = Math.min(1, t / 0.12), down = Math.max(0, (t - 0.12) / 0.88);
      const eo = 1 - Math.pow(1 - down, 3);
      const big = t < 0.12 ? 480 * (1 - (1 - up) * (1 - up)) : 480 + (30 - 480) * eo;
      sz.setX(0, big); sz.setX(1, t < 0.12 ? 120 * up : 120 + (12 - 120) * eo);
      burstOn = t < 0.55;
      al.setX(0, 1 - eo * 0.85); al.setX(1, 1 - eo);
      sz.needsUpdate = al.needsUpdate = true;
      // the real dot pops in under the flash
      const k = Math.min(1, Math.max(0, (t - 0.15) / 0.5)), pop = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.6 : 1;
      pz.setX(0, 30 * k * pop); pz.setX(1, 11 * k * pop); pz.needsUpdate = true;
      api.requestRender();
    }, () => {
      if (flash) { api.earth.remove(flash); flash.geometry.dispose(); flash = null; }
      pz.setX(0, 30); pz.setX(1, 11); pz.needsUpdate = true;
      api.requestRender();
    });
    state.stopBurst = stop;
    setTimeout(() => { if (burstEl) { burstEl.remove(); burstEl = null; } }, 1700);
  }
  ui.afterRenderHooks.add(() => {
    if (!burstEl || !flash) { if (burstEl && !flash) burstEl.style.opacity = 0; return; }
    const p = api.project(api.earth.localToWorld(flash.userData.local.clone()));
    burstEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
  });
  function endCard() {
    const END = FAR.find(s => s.exit) || {};
    const ex = state.exit.place;
    let h = `<h2>${esc(fill(END.title || 'You pop out {exit}!'))}</h2>
      <div class="box compare"><h3>${icon('pin')}Where you pop out</h3><p>You started at ${esc(state.start.place.text)}.</p>
        <p>You popped out at ${esc(ex.text)}.${ex.water ? ' Splash! You came out in the water.' : ''}</p></div>`;
    if (END.text) h += `<div class="box know"><h3>${icon('drill')}Your tunnel</h3><p>${esc(END.text)}</p>${END.fun ? `<p>${esc(END.fun)}</p>` : ''}</div>`;
    h += `<p class="note">Want to try another place? Tap <b>Dig again from a new place</b> at the bottom of the screen.</p>`;
    ui.showCard(h, { badge: 'Dig straight through', badgeColor: '#e9b47c', badgeIcon: 'drill', kind: 'dig', id: 'dig' });
  }
  // ---------- "Dig again" button above the Exit button ----------
  let againBtn = null;
  function showAgain() {
    if (againBtn) againBtn.remove();
    againBtn = document.createElement('button');
    againBtn.className = 'dig-again';
    againBtn.innerHTML = `${icon('restart')}<span>Dig again from a new place</span>`;
    againBtn.onclick = () => ui.open('dig');
    document.body.appendChild(againBtn);
    document.body.classList.add('dig-again-on');
    placeAgain();
  }
  function placeAgain() {
    if (!againBtn || !ui.actBar) return;
    const r = ui.actBar.getBoundingClientRect();
    againBtn.style.bottom = (innerHeight - r.top + 10) + 'px';
  }
  addEventListener('resize', () => requestAnimationFrame(placeAgain));
  function digCleanup() {
    if (state && state.timer) clearTimeout(state.timer);
    if (state && state.stopBurst) state.stopBurst();
    if (flash) { api.earth.remove(flash); flash.geometry.dispose(); flash = null; }
    burstOn = false;
    if (burstEl) { burstEl.remove(); burstEl = null; }
    if (againBtn) { againBtn.remove(); againBtn = null; }
    document.body.classList.remove('dig-again-on');
  }

  return { journey, dig, describe, tempF, squeeze };
}
