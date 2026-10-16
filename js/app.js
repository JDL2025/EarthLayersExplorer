// =====================================================================
// Earth Explorer — menus, cards, labels, tours and search.
// The 3D model lives in scene.js. Each big feature has its own file.
// =====================================================================
import { icon } from './icons.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmt = n => Math.round(n).toLocaleString('en-US');

export function createUI(api) {
  const LAYERS = window.LAYERS || {}, TOPICS = window.TOPICS || {};
  const ui = { api, LAYERS, TOPICS, features: {}, esc, icon };
  const card = $('#card'), cardContent = $('#cardContent'), cardScroll = $('#cardScroll');
  let current = null;           // what the card is showing { kind, id }
  let activity = null;          // a running trip / animation { id, stop() }
  ui.state = { labels: true, advanced: false, quakes: false };

  // ---------------------------------------------------------------
  // HUD line
  // ---------------------------------------------------------------
  const HUD_TEXT = {
    cutaway: 'Cutaway view: tap a layer to learn about it.',
    slice: 'Slice view: tap a ring. Pinch to zoom in.',
    peel: 'Peel view: peel Earth like an onion!'
  };
  ui.setHud = (t) => { $('#hudLine').textContent = t ?? HUD_TEXT[api.view] ?? ''; };
  ui.hudExtra = $('#hudExtra');

  // ---------------------------------------------------------------
  // Notice + banner
  // ---------------------------------------------------------------
  ui.notice = (html) => { $('#noticeText').innerHTML = html; $('#notice').hidden = false; };
  $('#noticeClose').onclick = () => { $('#notice').hidden = true; };
  let bannerEl = null, bannerTimer = 0;
  ui.banner = (html, ms = 0) => {
    clearTimeout(bannerTimer);
    if (!html) { if (bannerEl) bannerEl.remove(); bannerEl = null; return; }
    if (!bannerEl) { bannerEl = document.createElement('div'); bannerEl.className = 'banner'; document.body.appendChild(bannerEl); }
    bannerEl.innerHTML = html;
    if (ms) bannerTimer = setTimeout(() => ui.banner(null), ms);
    return bannerEl;
  };

  // ---------------------------------------------------------------
  // Panels (Explore, Tours, Show, Search, Help, About)
  // ---------------------------------------------------------------
  function closePanels(except) {
    $$('.panel').forEach(p => { if (p.id !== 'panel-' + except) p.hidden = true; });
    $$('.dock-btn[data-panel]').forEach(b => b.setAttribute('aria-expanded', b.dataset.panel === except && !$('#panel-' + except).hidden ? 'true' : 'false'));
  }
  ui.closePanels = () => closePanels(null);
  function openPanel(name) {
    const p = $('#panel-' + name);
    const willOpen = p.hidden;
    closePanels(name);
    p.hidden = !willOpen;
    $$('.dock-btn[data-panel]').forEach(b => b.setAttribute('aria-expanded', String(b.dataset.panel === name && willOpen)));
    if (willOpen && name === 'search') setTimeout(() => $('#searchInput').focus(), 60);
    if (willOpen && (name === 'explore' || name === 'tours' || name === 'search') && innerWidth < 900) closeCard();
  }
  ui.openPanel = openPanel;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-panel]');
    if (b) { openPanel(b.dataset.panel); return; }
    const c = e.target.closest('[data-close]');
    if (c) { const p = c.closest('.panel'); if (p) { p.hidden = true; closePanels(null); if (p.id === 'panel-help') try { localStorage.setItem('ee-help-seen', '1'); } catch (e2) {} } }
  });

  // ---------------------------------------------------------------
  // Explore list
  // ---------------------------------------------------------------
  function itemInfo(id) {
    if (LAYERS[id]) return { name: LAYERS[id].name, sub: LAYERS[id].kind, dot: LAYERS[id].color, adv: LAYERS[id].advanced };
    if (TOPICS[id]) return { name: TOPICS[id].name, sub: (TOPICS[id].short.match(/^.*?[.!?](\s|$)/) || [TOPICS[id].short])[0].trim(), ico: TOPICS[id].icon, adv: TOPICS[id].advanced };
    if (id === 'youngearth' && window.YOUNG_EARTH) return { name: window.YOUNG_EARTH.intro.title, sub: 'Watch how Earth got its layers.', ico: 'hourglass' };
    return null;
  }
  function rowHTML(id) {
    const it = itemInfo(id); if (!it) return '';
    const ico = it.dot ? `<span class="ico dot"><i style="background:${it.dot}"></i></span>` : `<span class="ico">${icon(it.ico)}</span>`;
    return `<button class="place-row" data-open="${id}">${ico}<div><b>${esc(it.name)}${it.adv ? '<span class="adv-tag">Advanced</span>' : ''}</b><span>${esc(it.sub)}</span></div></button>`;
  }
  function buildExplore() {
    let h = '';
    for (const [title, ids] of (window.EXPLORE_GROUPS || [])) {
      const rows = ids.map(rowHTML).join('');
      if (rows) h += `<h3 class="group-title">${esc(title)}</h3>${rows}`;
    }
    $('#exploreList').innerHTML = h;
  }
  buildExplore();
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open]'); if (!b) return;
    const id = b.dataset.open;
    if (b.closest('.panel')) closePanels(null);
    ui.open(id);
  });

  // ---------------------------------------------------------------
  // Views (Cutaway / Slice / Peel) and Easy view / True scale
  // ---------------------------------------------------------------
  $$('#views [data-view]').forEach(b => b.onclick = () => ui.setView(b.dataset.view));
  ui.setView = (v, opts) => {
    stopActivity();
    if (v === api.view && !opts) { if (v === 'peel') api.peel.set(0); return; }
    api.setView(v, opts);
  };
  api.onViewChange = (v) => {
    $$('#views [data-view]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.view === v)));
    $('#peelBar').hidden = v !== 'peel' || !!activity;
    if (v === 'peel') updatePeelButtons();
    if (!activity) ui.setHud();
    clearLabels();
    ui.features.quakes && ui.features.quakes.refresh();
  };
  $$('[data-scale]').forEach(b => b.onclick = () => {
    $$('[data-scale]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    api.setScale(b.dataset.scale);
    if (b.dataset.scale === 'true') ui.banner('<b>True scale:</b> this is how thick the layers really are. The crust is so thin you can barely see it!<small>Tip: use Slice view and pinch to zoom in on the edge.</small>', 7000);
    else ui.banner('<b>Easy view:</b> the crust is drawn much thicker than it really is, so it is easy to see and tap.', 5000);
  });
  $('#homeBtn').onclick = () => { stopActivity(); endTour(); closeCard(); closePanels(null); if (api.view !== 'cutaway') api.setView('cutaway'); else api.home(); };

  // Peel buttons
  function updatePeelButtons() {
    $('#peelNext').disabled = api.peel.stage >= 3;
    $('#peelBack').disabled = api.peel.stage <= 0;
    $('#peelNext').textContent = api.peel.stage === 0 ? 'Peel off the crust' : api.peel.stage === 1 ? 'Peel off the mantle' : api.peel.stage === 2 ? 'Peel off the outer core' : 'All peeled!';
  }
  $('#peelNext').onclick = () => { const name = api.peel.set(api.peel.stage + 1); updatePeelButtons(); setTimeout(() => openLayer(name, { quiet: true }), 900); };
  $('#peelBack').onclick = () => { const name = api.peel.set(api.peel.stage - 1); updatePeelButtons(); openLayer(name, { quiet: true }); };

  // Show panel toggles
  $$('[data-show]').forEach(inp => inp.onchange = () => ui.setShow(inp.dataset.show, inp.checked));
  ui.setShow = (what, on) => {
    ui.state[what] = on;
    const inp = $(`[data-show="${what}"]`); if (inp) inp.checked = on;
    if (what === 'advanced') { api.setAdvanced(on); if (on && api.view === 'peel') api.setView('slice'); }
    if (what === 'labels') clearLabels();
    if (what === 'quakes') ui.features.quakes && ui.features.quakes.show(on);
    api.requestRender();
  };

  // ---------------------------------------------------------------
  // Layer name labels on the 3D model
  // ---------------------------------------------------------------
  const labelsEl = $('#labels'), linesSvg = $('#labelLines');
  const chips = new Map();
  ui.labelsHidden = false;
  function clearLabels() { chips.forEach(c => c.remove()); chips.clear(); linesSvg.innerHTML = ''; }
  ui.clearLabels = clearLabels;
  function chipFor(id) {
    let c = chips.get(id);
    if (!c) {
      const L = LAYERS[id];
      c = document.createElement('button');
      c.className = 'lbl' + (L.advanced ? ' adv' : '');
      c.innerHTML = `<i style="background:${L.color}"></i>${esc(L.name)}`;
      c.onclick = () => openLayer(id);
      labelsEl.appendChild(c); chips.set(id, c);
    }
    return c;
  }
  // keep the banner centered in the open space beside the card
  function placeBanner() {
    const r = card.hidden ? null : card.getBoundingClientRect();
    const open = r && r.left > 40 ? r.left : innerWidth;
    if (bannerEl) { bannerEl.style.left = (open / 2) + 'px'; bannerEl.style.maxWidth = Math.min(560, open - 32) + 'px'; }
    const pb = $('#peelBar'); if (!pb.hidden) pb.style.left = (open / 2) + 'px';
  }
  api.afterRender = () => {
    placeBanner();
    for (const f of afterRenderHooks) f();
    if (!ui.state.labels || ui.labelsHidden) { if (chips.size) clearLabels(); return; }
    const anchors = api.labelAnchors();
    const seen = new Set();
    let svg = '';
    const ctr = api.project(api.earth.getWorldPosition(new api.THREE.Vector3()));
    for (const a of anchors) {
      const p = api.project(a.world); if (!p.ok) continue;
      if (a.inward) {   // put the name inside the Earth, with a line out to the layer
        const dx = ctr.x - p.x, dy = ctr.y - p.y, l = Math.hypot(dx, dy) || 1;
        a.offset = [dx / l * a.inward, dy / l * a.inward];
      }
      const c = chipFor(a.id); seen.add(a.id);
      const x = p.x + a.offset[0], y = p.y + a.offset[1];
      c.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      c.classList.toggle('on', current && current.id === a.id);
      if (a.offset[0] || a.offset[1]) svg += `<line x1="${p.x}" y1="${p.y}" x2="${x}" y2="${y}"/><circle cx="${p.x}" cy="${p.y}" r="3.5"/>`;
    }
    chips.forEach((c, id) => { if (!seen.has(id)) { c.remove(); chips.delete(id); } });
    // nudge chips apart if they overlap
    const placed = [];
    for (const a of anchors) {
      const c = chips.get(a.id); if (!c || !seen.has(a.id)) continue;
      const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(c.style.transform); if (!m) continue;
      let x = +m[1], y = +m[2];
      const w = c.offsetWidth || 120, h = (c.offsetHeight || 36) + 4;
      for (let k = 0; k < 4; k++) {
        const hit = placed.find(p => Math.abs(p.x - x) < (p.w + w) / 2 && Math.abs(p.y - y) < h);
        if (!hit) break;
        y = hit.y + (y >= hit.y ? h : -h);
      }
      placed.push({ x, y, w });
      c.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }
    linesSvg.innerHTML = svg;
  };
  const afterRenderHooks = new Set();
  ui.afterRenderHooks = afterRenderHooks;

  // ---------------------------------------------------------------
  // Tapping the model
  // ---------------------------------------------------------------
  ui.tapHandler = null;   // a running feature can take over taps
  api.onTap = (x, y) => {
    const hit = api.pick(x, y);
    if (ui.tapHandler && ui.tapHandler(hit, x, y)) return;
    if (!hit) return;
    if (hit.type === 'pin') { ui.features.quakes && ui.features.quakes.openPin(hit.index); return; }
    if (hit.type === 'layer') {
      const id = hit.forced || api.layerAtDepth(hit.depth, ui.state.advanced);
      openLayer(id);
    }
  };

  // ---------------------------------------------------------------
  // Cards
  // ---------------------------------------------------------------
  function shiftForCard() {
    if (card.hidden) { api.setShift(0, 0); return; }
    const sheet = card.getBoundingClientRect();
    if (sheet.left < 40) api.setShift(0, Math.max(0, (innerHeight - sheet.top) / 2 - 30));
    else api.setShift((innerWidth - sheet.left + 6) / 2, 0);
  }
  ui.showCard = (html, { badge = '', badgeColor = '#e9b47c', badgeIcon = 'layers', kind = 'topic', id = null, tour = false } = {}) => {
    cardContent.innerHTML = html;
    $('#cardBadge').innerHTML = badge ? `<i style="background:${badgeColor}">${icon(badgeIcon)}</i>${esc(badge)}` : '';
    $('#cardBadge').style.visibility = badge ? 'visible' : 'hidden';
    card.hidden = false;
    document.body.classList.add('card-open');
    cardScroll.scrollTop = 0;
    current = { kind, id };
    if (!tour && tourState) endTour(true);
    updateTourBar();
    requestAnimationFrame(() => { shiftForCard(); placeStatus(); });
    api.requestRender();
    return cardContent;
  };
  function closeCard() {
    if (card.hidden) return;
    card.hidden = true;
    document.body.classList.remove('card-open');
    if (current && LAYERS[current.id]) api.setHighlight(null);
    current = null;
    ui.onCardClose && ui.onCardClose();
    ui.onCardClose = null;
    api.setShift(0, 0); placeStatus();
    api.requestRender();
  }
  ui.closeCard = closeCard;
  ui.current = () => current;
  $('#cardClose').onclick = () => { closeCard(); endTour(); };
  window.addEventListener('resize', () => { shiftForCard(); placeStatus(); });

  // ---------- card parts ----------
  const part = {
    paras: a => (a || []).map(p => `<p>${esc(p)}</p>`).join(''),
    gauges(g) {
      if (!g) return '';
      const G = [['heat', 'Heat', 'flame'], ['squeeze', 'Squeeze', 'squeeze'], ['density', 'Density', 'iron'], ['state', 'Solid or liquid', 'drop']];
      return `<div class="gauges">${G.map(([k, name, ic]) => {
        const v = g[k]; if (!v) return '';
        const bars = [0, 1, 2, 3].map(i => `<i class="${i < v[0] ? 'on' : ''}"></i>`).join('');
        return `<div class="gauge g-${k}">${icon(ic)}<span class="g-name">${name}</span><span class="g-bar">${bars}</span><b>${esc(v[1])}</b></div>`;
      }).join('')}</div><p class="note gauge-note"><b>Squeeze</b> means pressure: how hard the layers above press down. <b>Density</b> is how tightly packed something is (how heavy it is for its size).</p>`;
    },
    points: a => a && a.length ? `<div class="points">${a.map(([ic, h, t]) => `<div class="point"><span class="p-ico">${icon(ic)}</span><div><h4>${esc(h)}</h4><p>${esc(t)}</p></div></div>`).join('')}</div>` : '',
    facts: a => a && a.length ? `<dl class="facts">${a.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '',
    compare: a => a && a.length ? `<div class="box compare"><h3>${icon('ruler')}Compare it</h3>${a.map(p => `<p>${esc(p)}</p>`).join('')}</div>` : '',
    know: a => a && a.length ? `<div class="box know"><h3>${icon('question')}How do we know?</h3>${a.map(p => `<p>${esc(p)}</p>`).join('')}</div>` : '',
    myth: m => m ? `<div class="box myth"><h3>${icon('x')}Myth buster</h3><p><b>Myth:</b> ${esc(m[0])}</p><p><b>Truth:</b> ${esc(m[1])}</p></div>` : '',
    debate: d => d ? `<p class="debate"><b>Scientists are still debating:</b> ${esc(d)}</p>` : '',
    steps: s => s && s.length ? `<div class="box adv" style="border-style:solid;border-color:rgba(140,196,240,.45)"><h3 style="color:var(--sunset)">${icon('next')}How to use it</h3><ol style="margin:4px 0 0;padding-left:22px">${s.map(x => `<li style="margin:4px 0">${esc(x)}</li>`).join('')}</ol></div>` : '',
    legend: l => l && l.length ? `<div class="wave-key">${l.map(([c, t]) => `<div><i style="background:${c}"></i>${esc(t)}</div>`).join('')}</div>` : '',
    video: q => q ? `<a class="act video" href="https://www.youtube.com/results?search_query=${encodeURIComponent(q)}" target="_blank" rel="noopener">${icon('video')}<span>Find a video<small>Opens YouTube search</small></span></a>` : ''
  };
  ui.part = part;

  // A small drawing of the Earth with one layer lit up (for layer cards)
  function layerPic(id) {
    const order = ['crust', 'mantle', 'outer', 'inner'];
    const R = { crust: [1, 0.915], mantle: [0.915, 0.546], outer: [0.546, 0.192], inner: [0.192, 0] };
    const cx = 200, cy = 196, s = 180;
    const isAdv = LAYERS[id] && LAYERS[id].advanced;
    let g = '';
    order.forEach(k => {
      const on = k === id || (id === 'lithosphere' && k === 'crust');
      const col = (on || isAdv) ? LAYERS[k].color : '#3a4356';
      g += `<path d="M${cx - s * R[k][0]} ${cy} A${s * R[k][0]} ${s * R[k][0]} 0 0 1 ${cx + s * R[k][0]} ${cy} Z" fill="${col}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>`;
    });
    if (isAdv) {
      const lit = id === 'lithosphere';
      const rr = lit ? [1, 0.87] : [0.87, 0.79];
      g += `<path d="M${cx - s * rr[0]} ${cy} A${s * rr[0]} ${s * rr[0]} 0 0 1 ${cx + s * rr[0]} ${cy} L${cx + s * rr[1]} ${cy} A${s * rr[1]} ${s * rr[1]} 0 0 0 ${cx - s * rr[1]} ${cy} Z" fill="${LAYERS[id].color}" fill-opacity=".75" stroke="#fff" stroke-dasharray="6 5" stroke-width="2"/>`;
    }
    const lab = isAdv ? 'Drawn thicker than real so you can see it' : 'This layer is lit up';
    return `<figure class="pic"><svg viewBox="0 0 400 206" role="img" aria-label="Diagram of Earth's layers with the ${esc(LAYERS[id].name)} lit up">
      <rect width="400" height="206" fill="#070a10"/>${g}</svg><figcaption>${esc(LAYERS[id].name)}: ${lab}.</figcaption></figure>`;
  }

  function openLayer(id, opts = {}) {
    const L = LAYERS[id]; if (!L) return;
    if (!opts.keepActivity) stopActivity();
    if (L.advanced && !ui.state.advanced) ui.setShow('advanced', true);
    if (L.advanced && api.view === 'peel') api.setView('slice');
    api.setHighlight(id);
    const h = `<h2>${esc(L.name)}</h2><p class="short">${esc(L.short)}</p>
      ${layerPic(id)}
      ${part.gauges(L.gauges)}
      ${part.paras(L.paras)}
      ${part.points(L.points)}
      ${part.facts(L.facts)}
      ${part.myth(L.myth)}
      ${part.compare(L.compare)}
      ${part.know(L.know)}
      ${part.debate(L.debate)}
      <div class="actions">
        ${api.view !== 'slice' ? `<button class="act" data-act="slice">${icon('slice')}<span>See it in the Slice view<small>Cut Earth in half</small></span></button>` : ''}
        ${part.video(L.video)}
      </div>`;
    ui.showCard(h, { badge: L.kind, badgeColor: L.color, badgeIcon: 'layers', kind: 'layer', id, tour: opts.tour });
    cardContent.querySelector('[data-act="slice"]')?.addEventListener('click', () => { api.setView('slice'); api.setHighlight(id); cardContent.querySelector('[data-act="slice"]')?.remove(); });
  }
  ui.openLayer = openLayer;

  function topicCard(id, extraTop = '', opts = {}) {
    const T = TOPICS[id];
    const h = `<h2>${esc(T.name)}</h2><p class="short">${esc(T.short)}</p>
      ${extraTop}
      ${part.legend(T.legend)}
      <div data-slot="controls"></div>
      ${part.steps(T.steps)}
      ${part.paras(T.paras)}
      ${part.points(T.points)}
      ${part.facts(T.facts)}
      ${part.myth(T.myth)}
      ${part.compare(T.compare)}
      ${part.know(T.know)}
      ${part.debate(T.debate)}
      <div class="actions" data-slot="actions">${part.video(T.video)}</div>`;
    return ui.showCard(h, { badge: T.badge || T.group, badgeColor: '#8cc4f0', badgeIcon: T.icon, kind: 'topic', id, tour: opts.tour });
  }
  ui.topicCard = topicCard;

  // ---------------------------------------------------------------
  // Opening anything by id
  // ---------------------------------------------------------------
  ui.open = (id, opts = {}) => {
    if (LAYERS[id]) return openLayer(id, opts);
    if (id === 'youngearth') { endTour(); return ui.features.young && ui.features.young.start(); }
    const T = TOPICS[id]; if (!T) return;
    stopActivity();
    const show = T.show || 'none';
    if (T.advanced && !ui.state.advanced) ui.setShow('advanced', true);
    const F = ui.features;
    if (show === 'convection' || show === 'core' || show === 'quake') return F.anims && F.anims.start(show, opts);
    if (show.startsWith('closeup-')) return F.closeups && F.closeups.start(id, show.slice(8), opts);
    if (show === 'journey') return F.trips && F.trips.journey(opts);
    if (show === 'dig') return F.trips && F.trips.dig(opts);
    api.setHighlight(null);
    topicCard(id, '', opts);
  };

  // ---------------------------------------------------------------
  // Activities: trips and animations take over the bottom bar
  // ---------------------------------------------------------------
  let actBar = null;
  ui.startActivity = ({ id, title, buttons = [], onStop, lockViews = true, hideLabels = true, keepStatus = false }) => {
    stopActivity();
    closePanels(null);
    activity = { id, onStop };
    document.body.classList.add('activity-on');
    $('#peelBar').hidden = true;
    $('#views').classList.toggle('locked', lockViews);
    ui.labelsHidden = hideLabels; clearLabels();
    actBar = document.createElement('div'); actBar.className = 'activitybar';
    actBar.innerHTML = `<button class="dock-btn" data-a="exit">${icon('x')}<span>Exit</span></button><span class="a-title">${esc(title)}</span>` +
      buttons.map((b, i) => `<button class="dock-btn" data-a="${i}">${icon(b.icon)}<span>${esc(b.label)}</span></button>`).join('');
    actBar.querySelector('[data-a="exit"]').onclick = () => { stopActivity(); closeCard(); endTour(); };
    buttons.forEach((b, i) => { actBar.querySelector(`[data-a="${i}"]`).onclick = b.onClick; });
    document.body.appendChild(actBar);
    ui.actBar = actBar;
    return activity;
  };
  function stopActivity() {
    if (!activity) return;
    const a = activity; activity = null;
    document.body.classList.remove('activity-on');
    $('#views').classList.remove('locked');
    ui.labelsHidden = false;
    if (actBar) { actBar.remove(); actBar = null; ui.actBar = null; }
    ui.tapHandler = null;
    ui.hudExtra.innerHTML = '';
    ui.banner(null);
    try { a.onStop && a.onStop(); } catch (e) { console.error(e); }
    $('#peelBar').hidden = api.view !== 'peel';
    ui.setHud();
    api.requestRender();
  }
  ui.stopActivity = stopActivity;
  ui.activity = () => activity;

  // ---------------------------------------------------------------
  // Tours
  // ---------------------------------------------------------------
  let tourState = null;
  function buildTours() {
    $('#tourList').innerHTML = (window.TOURS || []).map((t, i) =>
      `<button class="tour-row" data-tour="${i}"><span class="t-icon" aria-hidden="true">${t.emoji}</span><b>${esc(t.name)}</b><span>${esc(t.text)} (${t.stops.length} stops)</span></button>`).join('');
    $$('[data-tour]').forEach(b => b.onclick = () => { closePanels(null); startTour(+b.dataset.tour); });
  }
  buildTours();
  function startTour(i) { tourState = { t: window.TOURS[i], i: 0 }; goTourStop(); }
  function goTourStop() {
    const s = tourState.t.stops[tourState.i];
    ui.open(s, { tour: true });
    updateTourBar();
  }
  function updateTourBar() {
    const bar = $('#tourBar');
    if (!tourState) { bar.hidden = true; return; }
    bar.hidden = false;
    const n = tourState.t.stops.length;
    $('#tourProgress').innerHTML = `${esc(tourState.t.name)}<br>Stop ${tourState.i + 1} of ${n}`;
    $('#tourPrev').disabled = tourState.i === 0;
    $('#tourNext').textContent = tourState.i === n - 1 ? 'Finish tour' : 'Next stop';
  }
  function endTour(keepCard) { if (!tourState) return; tourState = null; $('#tourBar').hidden = true; }
  ui.endTour = endTour;
  ui.inTour = () => !!tourState;
  $('#tourNext').onclick = () => {
    if (!tourState) return;
    if (tourState.i >= tourState.t.stops.length - 1) { endTour(); stopActivity(); closeCard(); return; }
    tourState.i++; goTourStop();
  };
  $('#tourPrev').onclick = () => { if (tourState && tourState.i > 0) { tourState.i--; goTourStop(); } };
  // features can borrow the bar (Dig trip uses it for its stops)
  ui.useBar = (cfg) => {
    const bar = $('#tourBar');
    if (!cfg) { bar.hidden = !tourState; if (tourState) updateTourBar(); return; }
    bar.hidden = false;
    $('#tourProgress').innerHTML = cfg.progress;
    $('#tourPrev').disabled = !cfg.onPrev; $('#tourPrev').textContent = cfg.prevLabel || 'Back';
    $('#tourNext').textContent = cfg.nextLabel || 'Next stop';
    $('#tourPrev').onclick = cfg.onPrev || null; $('#tourNext').onclick = cfg.onNext;
  };
  ui.restoreBar = () => {
    $('#tourPrev').textContent = 'Back';
    $('#tourNext').onclick = () => { if (!tourState) return; if (tourState.i >= tourState.t.stops.length - 1) { endTour(); stopActivity(); closeCard(); return; } tourState.i++; goTourStop(); };
    $('#tourPrev').onclick = () => { if (tourState && tourState.i > 0) { tourState.i--; goTourStop(); } };
    ui.useBar(null);
  };

  // ---------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------
  const index = [];
  Object.entries(LAYERS).forEach(([id, L]) => index.push({ id, name: L.name, sub: L.kind, text: [L.short, ...(L.paras || []), ...(L.points || []).map(p => p[1] + ' ' + p[2]), ...(L.facts || []).map(f => f.join(' '))].join(' ') }));
  Object.entries(TOPICS).forEach(([id, T]) => index.push({ id, name: T.name, sub: T.group, text: [T.short, ...(T.paras || []), ...(T.points || []).map(p => p[1] + ' ' + p[2]), ...(T.facts || []).map(f => f.join(' '))].join(' ') }));
  (window.STOPS || []).forEach((s, i) => { if (i) index.push({ id: 'stop:' + i, name: s.title, sub: 'A stop on the trip to the center', text: s.text + ' ' + (s.adv || '') }); });
  if (window.YOUNG_EARTH) window.YOUNG_EARTH.stops.forEach((s, i) => index.push({ id: 'young:' + i, name: s.title, sub: 'Time machine: ' + s.date, text: s.lead + ' ' + s.points.map(p => p[1] + ' ' + p[2]).join(' ') }));
  const QUICK = ['core', 'magma', 'volcano', 'earthquake', 'diamond', 'iron', 'Everest', 'plates'];
  function runSearch(q) {
    q = q.trim().toLowerCase();
    $('#searchClear').hidden = !q;
    if (!q) {
      $('#searchResults').innerHTML = `<p class="hint">Type a word, or tap one of these:</p><div class="chips" style="margin-top:10px">${QUICK.map(w => `<button class="chip" data-q="${esc(w)}">${esc(w)}</button>`).join('')}</div>`;
      $$('[data-q]').forEach(b => b.onclick = () => { $('#searchInput').value = b.dataset.q; runSearch(b.dataset.q); });
      return;
    }
    const words = q.split(/\s+/);
    const res = index.map(e => {
      const n = e.name.toLowerCase(), t = e.text.toLowerCase();
      let score = 0;
      for (const w of words) { if (n.includes(w)) score += 10; else if (t.includes(w)) score += 3; else if (w.length > 3 && t.includes(w.slice(0, -1))) score += 1; else return { e, score: 0 }; }
      return { e, score };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 14);
    $('#searchResults').innerHTML = res.length ? res.map(({ e }) => `<button class="place-row" data-sr="${e.id}"><span class="ico">${icon(e.id.startsWith('stop:') ? 'drill' : e.id.startsWith('young:') ? 'hourglass' : (LAYERS[e.id] ? 'layers' : (TOPICS[e.id] || {}).icon))}</span><div><b>${esc(e.name)}</b><span>${esc(e.sub)}</span></div></button>`).join('')
      : `<p class="hint">Nothing found for “${esc(q)}”. Try another word, like “core” or “lava”.</p>`;
    $$('[data-sr]').forEach(b => b.onclick = () => {
      closePanels(null);
      const id = b.dataset.sr;
      if (id.startsWith('stop:')) ui.features.trips && ui.features.trips.journey({ stop: +id.slice(5) });
      else if (id.startsWith('young:')) ui.features.young && ui.features.young.start(+id.slice(6));
      else ui.open(id);
    });
  }
  $('#searchInput').addEventListener('input', e => runSearch(e.target.value));
  $('#searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  $('#searchClear').onclick = () => { $('#searchInput').value = ''; runSearch(''); $('#searchInput').focus(); };
  runSearch('');

  // ---------------------------------------------------------------
  // Earth right now box placement
  // ---------------------------------------------------------------
  function placeStatus() {
    const st = $('#status'), dock = $('#dock');
    const dr = dock.getBoundingClientRect();
    const room = innerWidth - dr.right - 24;
    st.classList.toggle('raised', room < 300 || innerWidth < 900);
    const cr = card.hidden ? null : card.getBoundingClientRect();
    st.classList.toggle('under-card', !!cr && cr.left > 40 && st.classList.contains('raised'));
  }
  ui.placeStatus = placeStatus;
  placeStatus();

  // ---------------------------------------------------------------
  // About + help
  // ---------------------------------------------------------------
  $('#aboutBody').innerHTML = `
    <p><b>Earth Explorer</b> is an independent classroom project. It was not made by or endorsed by NASA, USGS, or any other agency.</p>
    <p><b>Picture of Earth:</b> NASA Blue Marble (NASA Earth Observatory, public domain).</p>
    <p><b>The inside of Earth</b> can’t be photographed. It is drawn as a model using real numbers from scientists (the PREM model of Earth’s interior, USGS, and IRIS). In <b>Easy view</b>, the crust and the advanced layers are drawn thicker than they really are. Tap <b>True scale</b> to see the real sizes.</p>
    <p><b>Today’s earthquakes:</b> live data from the U.S. Geological Survey (earthquake.usgs.gov).</p>
    <p><b>3D engine:</b> Three.js (MIT license). <b>Fonts:</b> Atkinson Hyperlegible and Big Shoulders Display (SIL Open Font License).</p>`;
  if ('requestFullscreen' in document.documentElement && !navigator.standalone) {
    $('#fullscreenBtn').hidden = false;
    $('#fullscreenBtn').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); };
  }
  let seen = false; try { seen = localStorage.getItem('ee-help-seen') === '1'; } catch (e) {}
  if (!seen && !/[?&]nohelp/.test(location.search)) setTimeout(() => openPanel('help'), 700);

  return ui;
}
