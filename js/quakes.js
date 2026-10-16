// =====================================================================
// Earth Explorer — "Earth right now": real earthquakes from the last day
// Data: U.S. Geological Survey (free, public feed). Needs the internet.
// =====================================================================
import { icon } from './icons.js';
import { fmt } from './app.js';

const FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';

export function init(api, ui) {
  const $ = s => document.querySelector(s);
  const esc = ui.esc;
  let quakes = [], dots = null, showing = false, loaded = false, failed = false;
  const box = $('#status'), more = $('#statusMore');

  $('#statusToggle').onclick = () => {
    const open = more.hidden;
    more.hidden = !open; box.classList.toggle('open', open);
    $('#statusToggle').setAttribute('aria-expanded', String(open));
    $('#statusMoreLabel').textContent = open ? 'Less' : 'More';
  };

  function ago(ms) {
    const m = Math.round((Date.now() - ms) / 60000);
    if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
    const h = Math.round(m / 60); return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  function layerText(depth) {
    const id = api.layerAtDepth(depth, false);
    return id === 'crust' ? 'in the crust' : id === 'mantle' ? 'in the mantle' : 'deep inside Earth';
  }
  function render() {
    if (failed) {
      $('#stCount').textContent = '—'; $('#stBig').textContent = 'No connection';
      more.innerHTML = `<p class="srow">Today’s earthquakes could not load. Check the internet connection, or ask your teacher whether the school network blocks earthquake.usgs.gov.</p>`;
      return;
    }
    if (!loaded) return;
    const big = [...quakes].sort((a, b) => b.mag - a.mag);
    $('#stCount').textContent = fmt(quakes.length);
    $('#stBig').textContent = big[0] ? `M ${big[0].mag.toFixed(1)}` : '—';
    const deep = quakes.filter(q => q.depth >= 35).length;
    more.innerHTML = `
      <div class="srow"><div class="srow-top"><span>Earthquakes in the last day</span><b>${fmt(quakes.length)}</b></div>
        <p>These are real earthquakes of magnitude 2.5 or bigger. The list updates every time the page opens.</p></div>
      <div class="srow"><div class="srow-top"><span>Started in the crust</span><b>${fmt(quakes.length - deep)}</b></div>
        <div class="srow-top"><span>Started in the mantle</span><b>${fmt(deep)}</b></div>
        <p>Most earthquakes start in the crust. A few start deep in the mantle, where one plate sinks under another.</p></div>
      <div class="srow" style="border-bottom:0"><div class="srow-top"><span>Biggest ones</span></div></div>
      ${big.slice(0, 6).map((q, i) => `<button class="quake-row" data-qi="${quakes.indexOf(q)}"><span class="mag">${q.mag.toFixed(1)}<small>magnitude</small></span><div><b>${esc(q.place)}</b><span>${ago(q.time)} · started ${fmt(q.depth)} km down, ${layerText(q.depth)}</span></div></button>`).join('')}
      <button class="wide-btn ghost" data-qshow style="margin:12px 0 4px">${showing ? 'Hide them on the globe' : 'Show them on the globe'}</button>
      <p class="status-note">Data: U.S. Geological Survey (earthquake.usgs.gov). Magnitude tells how strong a quake is. Each step up is about 32 times more energy.</p>`;
    more.querySelectorAll('[data-qi]').forEach(b => b.onclick = () => { if (!showing) ui.setShow('quakes', true); openPin(+b.dataset.qi, true); });
    more.querySelector('[data-qshow]').onclick = () => ui.setShow('quakes', !showing);
  }

  async function load() {
    try {
      const res = await fetch(FEED, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const j = await res.json();
      quakes = j.features.filter(f => f.properties.mag != null).map(f => ({
        mag: f.properties.mag, place: f.properties.place || 'Unknown place', time: f.properties.time,
        lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], depth: Math.max(0, f.geometry.coordinates[2] || 0)
      }));
      loaded = true;
    } catch (e) { failed = true; }
    render();
    if (showing) build();
  }

  function build() {
    if (dots) { api.earth.remove(dots); dots.geometry.dispose(); dots = null; }
    if (!quakes.length) return;
    const n = quakes.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), al = new Float32Array(n);
    quakes.forEach((q, i) => {
      const v = api.latLonToLocal(q.lat, q.lon, 1.006);
      pos.set([v.x, v.y, v.z], i * 3);
      const deep = q.depth >= 70;
      col.set(deep ? [1, 0.85, 0.3] : [1, 0.38, 0.28], i * 3);
      size[i] = 7 + Math.max(0, q.mag - 2.5) * 5; al[i] = 1;
    });
    dots = api.makeDots(pos, col, size, al, { soft: 0.4 });
    dots.renderOrder = 6;
    api.earth.add(dots);
    refresh();
  }
  // hide pins in the part of Earth that is cut away
  function refresh() {
    if (!dots) return;
    dots.visible = showing && api.view !== 'peel';
    const al = dots.geometry.attributes.alpha;
    const m = api.surface.material.uniforms, mode = m.uMode.value, n1 = m.uN1.value, n2 = m.uN2.value;
    quakes.forEach((q, i) => {
      const v = api.latLonToLocal(q.lat, q.lon);
      let hide = false;
      if (mode === 1) hide = v.dot(n1) > 0 && v.dot(n2) > 0;
      if (mode === 2) hide = v.dot(n1) > 0;
      al.setX(i, hide ? 0 : 1);
    });
    al.needsUpdate = true;
    api.requestRender();
  }
  // tapping a pin
  const origPick = api.pick;
  api.pick = (x, y) => {
    if (dots && dots.visible) {
      let best = -1, bd = 22;
      quakes.forEach((q, i) => {
        if (dots.geometry.attributes.alpha.getX(i) < 0.5) return;
        const w = api.earth.localToWorld(api.latLonToLocal(q.lat, q.lon, 1.006));
        const toCam = api.camera.position.clone().sub(w).normalize();
        if (w.clone().normalize().dot(toCam) < 0.05) return;
        const p = api.project(w); const d = Math.hypot(p.x - x, p.y - y);
        if (d < bd) { bd = d; best = i; }
      });
      if (best >= 0) return { type: 'pin', index: best };
    }
    return origPick(x, y);
  };

  function openPin(i, fly) {
    const q = quakes[i]; if (!q) return;
    if (fly) { if (api.view === 'slice' || api.view === 'peel') api.setView('cutaway', { keepCamera: true }); api.flyToLatLon(q.lat, q.lon, api.fitDist() * 0.8); }
    const id = api.layerAtDepth(q.depth, false), L = window.LAYERS[id];
    const h = `<h2>Magnitude ${q.mag.toFixed(1)} earthquake</h2><p class="short">${esc(q.place)}</p>
      <dl class="facts"><dt>When</dt><dd>${ago(q.time)}</dd><dt>Magnitude</dt><dd>${q.mag.toFixed(1)}</dd><dt>Where it started</dt><dd>${fmt(q.depth)} km (${fmt(q.depth * 0.621)} miles) down</dd><dt>Layer</dt><dd><span style="color:${L.color}">${esc(L.name)}</span></dd></dl>
      <div class="box compare"><h3>${icon('quake')}What does this mean?</h3>
      <p>This earthquake started ${fmt(q.depth)} km down, ${layerText(q.depth)}.</p>
      <p>${q.mag >= 6 ? 'This is a strong earthquake. It can damage buildings near where it happened.' : q.mag >= 4.5 ? 'People nearby would feel this earthquake shake.' : 'This is a small earthquake. Many people nearby might not even notice it.'}</p></div>
      <p class="note">Most earthquakes happen where Earth’s plates meet. Turn on more pins to see the pattern!</p>
      <div class="actions"><a class="act" href="https://earthquake.usgs.gov/earthquakes/map/" target="_blank" rel="noopener">${icon('eye')}<span>See the USGS earthquake map<small>Opens a new tab</small></span></a></div>`;
    ui.showCard(h, { badge: 'Earth right now', badgeColor: '#ff7a59', badgeIcon: 'quake', kind: 'quake', id: 'quake-' + i });
  }

  function show(on) {
    showing = on;
    if (on && !dots && loaded) build();
    if (dots) refresh();
    render();
    if (on && (api.view === 'peel')) api.setView('cutaway');
    if (on && loaded) ui.banner(`<b>${fmt(quakes.length)} real earthquakes</b> from the last day. Red = started in the crust or upper mantle. Yellow = started deep. <small>Tap a dot to learn about it.</small>`, 6000);
  }

  load();
  return { show, refresh, openPin };
}
