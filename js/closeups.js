// =====================================================================
// Earth Explorer — close-up animations drawn at the top of a card:
//   hot spot volcanoes (Hawaii), where magma comes from,
//   two ways to sort the layers (lithosphere & asthenosphere)
// =====================================================================
import { icon } from './icons.js';

export function init(api, ui) {
  let raf = 0, cleanup = null;
  const COL = { sea: '#1d4f7a', sky: '#0b1220', litho: '#7c8fa3', crust: '#a07a55', mantle: '#c4502f', astheno: '#e2774a', plume: '#ffb347', magma: '#ff7a1f', lava: '#ffb000' };

  function stop() { cancelAnimationFrame(raf); raf = 0; if (cleanup) cleanup(); cleanup = null; }

  function start(id, kind, opts = {}) {
    stop();
    const T = ui.TOPICS[id];
    if (T.where) {
      if (api.view !== 'cutaway') api.setView('cutaway', { yaw: api.yawFor(T.where[1]), pitch: T.where[0] * Math.PI / 180 * 0.9 });
      else api.flyToLatLon(T.where[0], T.where[1], api.fitDist());
    }
    api.setHighlight(kind === 'plates' ? 'lithosphere' : null);
    const pic = `<figure class="pic"><canvas width="800" height="500" aria-label="Animated close-up drawing"></canvas>
      <figcaption class="pic-cap"><span data-cap></span><span class="pic-ctrl"><button data-c="pause" aria-label="Pause">${icon('pause')}</button><button data-c="restart" aria-label="Start over">${icon('restart')}</button></span></figcaption></figure>`;
    const c = ui.topicCard(id, pic, opts);
    const canvas = c.querySelector('canvas'), g = canvas.getContext('2d');
    const cap = c.querySelector('[data-cap]');
    let t = 0, last = performance.now(), paused = false;
    const pauseBtn = c.querySelector('[data-c="pause"]');
    pauseBtn.querySelector('svg').style.cssText = 'width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2.4;vertical-align:-3px';
    c.querySelector('[data-c="restart"] svg').style.cssText = 'width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2.2;vertical-align:-3px';
    pauseBtn.onclick = () => { paused = !paused; pauseBtn.innerHTML = icon(paused ? 'play' : 'pause'); pauseBtn.querySelector('svg').style.cssText = 'width:18px;height:18px;fill:#fff;stroke:#fff;stroke-width:2;vertical-align:-3px'; };
    c.querySelector('[data-c="restart"]').onclick = () => { t = 0; };
    const draw = kind === 'hotspot' ? hotspot : kind === 'magma' ? magma : plates;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!canvas.isConnected) { stop(); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!paused) t += dt;
      draw(g, 800, 500, t, cap);
    }
    raf = requestAnimationFrame(loop);
    ui.onCardClose = stop;
  }

  // ---------- helpers ----------
  function label(g, text, x, y, { color = '#fff', size = 22, align = 'center', bg = 'rgba(10,14,22,.72)', bold = true } = {}) {
    size = Math.round(size * 1.5);    // the picture is shown at about half size, so text is drawn big
    g.font = `${bold ? 700 : 400} ${size}px "Atkinson Hyperlegible", system-ui, sans-serif`;
    g.textAlign = align; g.textBaseline = 'middle';
    const w = g.measureText(text).width, pad = 8;
    const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    if (bg) { g.fillStyle = bg; roundRect(g, x0 - pad, y - size * 0.75, w + pad * 2, size * 1.5, 8); g.fill(); }
    g.fillStyle = color; g.fillText(text, x, y + 1);
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function arrow(g, x1, y1, x2, y2, color = '#fff', w = 4) {
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1), h = 14;
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)); g.lineTo(x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)); g.closePath(); g.fill();
  }
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function speckle(g, x, y, w, h, color, n, seed = 1, size = 2.2) {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) { g.globalAlpha = 0.25 + 0.4 * rnd(i + seed); g.fillRect(x + rnd(i * 3 + seed) * w, y + rnd(i * 7 + seed) * h, size, size); }
    g.globalAlpha = 1;
  }

  // =================================================================
  // HOT SPOT: the Pacific Plate slides over a hot spot that stays still
  // =================================================================
  // [name, age in millions of years]
  const ISLANDS = [['Kauai', 5.1], ['Oahu', 3.0], ['Molokai', 1.8], ['Maui', 1.1], ['Big Island', 0.45]];
  function hotspot(g, W, H, t, cap) {
    const CYCLE = 26, my = 6 - Math.min(6, (t % CYCLE) / 22 * 6);   // millions of years ago (6 → 0)
    const seaY = 120, plateTop = 175, plateBot = 265, hotX = 600;
    const pxPerMy = 85;   // how far the plate moves in the drawing per million years
    // sky & sea
    g.fillStyle = COL.sky; g.fillRect(0, 0, W, H);
    g.fillStyle = COL.sea; g.fillRect(0, seaY, W, plateTop - seaY);
    // mantle
    const mg = g.createLinearGradient(0, plateBot, 0, H); mg.addColorStop(0, '#b8452a'); mg.addColorStop(1, '#d9662f');
    g.fillStyle = mg; g.fillRect(0, plateBot, W, H - plateBot);
    speckle(g, 0, plateBot, W, H - plateBot, '#ffcf9a', 500, 3, 2.5);
    // plume of hot rock rising (stays in one place)
    const pl = g.createLinearGradient(hotX - 60, 0, hotX + 60, 0);
    pl.addColorStop(0, 'rgba(255,170,60,0)'); pl.addColorStop(0.5, 'rgba(255,190,80,.85)'); pl.addColorStop(1, 'rgba(255,170,60,0)');
    g.fillStyle = pl; g.beginPath(); g.moveTo(hotX - 55, H); g.quadraticCurveTo(hotX - 30, plateBot + 40, hotX - 70, plateBot + 4); g.lineTo(hotX + 70, plateBot + 4); g.quadraticCurveTo(hotX + 30, plateBot + 40, hotX + 55, H); g.fill();
    for (let i = 0; i < 14; i++) { const yy = H - ((t * 40 + i * 30) % (H - plateBot)); g.fillStyle = 'rgba(255,240,200,.7)'; g.beginPath(); g.arc(hotX + Math.sin(i * 2.1) * 20, yy, 3, 0, 7); g.fill(); }
    // the plate (moves to the left = northwest)
    const shift = (6 - my) * pxPerMy;
    g.fillStyle = COL.litho; g.fillRect(0, plateTop, W, plateBot - plateTop);
    g.fillStyle = '#5f4632'; g.fillRect(0, plateTop, W, 22);
    speckle(g, 0, plateTop, W, plateBot - plateTop, '#c9d6e3', 260, 9);
    // islands
    const born = ISLANDS.filter(([, age]) => age >= my);
    born.forEach(([name, age]) => {
      const x = hotX - (age - my) * pxPerMy;
      const grow = Math.min(1, (age - my) / 0.5 + 0.15);
      const old = Math.max(0, (age - my));           // how long since it was born
      const sink = Math.min(1, old / 7);
      const height = (150 * grow) * (1 - 0.55 * sink);
      const top = plateTop - height + 8, half = 115 * Math.min(1, grow + 0.2);
      const active = old < 0.8;
      g.fillStyle = active ? '#5b4636' : '#4d5b3a';
      g.beginPath(); g.moveTo(x - half, plateTop + 2); g.quadraticCurveTo(x - half * 0.35, top, x, top); g.quadraticCurveTo(x + half * 0.35, top, x + half, plateTop + 2); g.fill();
      if (top < seaY) { // green land above the sea
        g.save(); g.beginPath(); g.rect(0, 0, W, seaY); g.clip();
        g.fillStyle = active ? '#6b4f3a' : '#3f7a3a';
        g.beginPath(); g.moveTo(x - half, plateTop + 2); g.quadraticCurveTo(x - half * 0.35, top, x, top); g.quadraticCurveTo(x + half * 0.35, top, x + half, plateTop + 2); g.fill(); g.restore();
      }
      if (active) {   // magma rising to the active volcano, lava glow on top
        g.strokeStyle = 'rgba(255,140,40,.9)'; g.lineWidth = 7; g.beginPath(); g.moveTo(hotX, plateBot); g.quadraticCurveTo(hotX, plateTop + 20, x, top + 10); g.stroke();
        g.fillStyle = '#ffb000'; g.beginPath(); g.arc(x, top + 4, 7 + 2 * Math.sin(t * 6), 0, 7); g.fill();
      }
      label(g, name, x, Math.min(top, seaY) - 32, { size: 18 });
    });
    // underwater baby volcano at the end
    if (my < 0.3) { const x = hotX + 6; g.fillStyle = '#6b4f3a'; g.beginPath(); g.moveTo(x - 50, plateTop + 2); g.quadraticCurveTo(x, plateTop - 40, x + 50, plateTop + 2); g.fill(); label(g, 'Next island (underwater)', x + 20, plateTop + 30, { size: 14 }); }
    // labels & arrows
    arrow(g, 330, 222, 150, 222, '#fff', 6);
    label(g, 'Plate moves', 240, 252, { size: 17, bg: 'rgba(10,14,22,.55)' });
    label(g, 'Hot spot (stays still)', hotX - 10, H - 34, { size: 18 });
    label(g, 'Mantle', 80, H - 34, { size: 18 });
    label(g, my > 0.05 ? `${my.toFixed(1)} million years ago` : 'Today', 16, 34, { size: 20, align: 'left', color: '#e9b47c' });
    cap.textContent = 'Close-up drawing (not to scale). The plate slides over the hot spot, so a chain of islands forms.';
  }

  // =================================================================
  // MAGMA: hot mantle rock rises, gets squeezed less, and melts more
  // =================================================================
  function magma(g, W, H, t, cap) {
    const groundY = 150, crustBot = 250, meltY = 330;
    g.fillStyle = COL.sky; g.fillRect(0, 0, W, H);
    // crust with a volcano
    g.fillStyle = '#7a5c43'; g.fillRect(0, groundY, W, crustBot - groundY);
    speckle(g, 0, groundY, W, crustBot - groundY, '#e3c7a3', 250, 2);
    const vx = 400;
    g.fillStyle = '#6b4f3a'; g.beginPath(); g.moveTo(vx - 170, groundY + 1); g.lineTo(vx - 30, 40); g.lineTo(vx + 30, 40); g.lineTo(vx + 170, groundY + 1); g.fill();
    // mantle
    const mg = g.createLinearGradient(0, crustBot, 0, H); mg.addColorStop(0, '#b8452a'); mg.addColorStop(1, '#d9662f');
    g.fillStyle = mg; g.fillRect(0, crustBot, W, H - crustBot);
    speckle(g, 0, crustBot, W, H - crustBot, '#ffd3a8', 650, 5, 2.6);
    // "melting starts here" line
    g.setLineDash([10, 9]); g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, meltY); g.lineTo(W, meltY); g.stroke(); g.setLineDash([]);
    // rising blob of hot mantle rock
    const c = (t % 12) / 12;
    const by = H + 40 - c * (H + 40 - meltY + 20), bx = vx + 10 * Math.sin(t);
    const bg2 = g.createRadialGradient(bx, by, 10, bx, by, 95); bg2.addColorStop(0, 'rgba(255,190,110,.75)'); bg2.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = bg2; g.beginPath(); g.arc(bx, by, 95, 0, 7); g.fill();
    // magma chamber
    const fill = 0.55 + 0.25 * Math.sin(t * 0.6);
    g.fillStyle = COL.magma; g.beginPath(); g.ellipse(vx, crustBot - 30, 95 * fill + 25, 26 * fill + 8, 0, 0, 7); g.fill();
    // magma droplets rising from the melting zone into the chamber
    for (let i = 0; i < 26; i++) {
      const k = ((t * 0.12 + i / 26) % 1);
      const x = vx + (rnd(i) - 0.5) * 220 * (1 - k * 0.8), y = meltY + 30 - k * (meltY + 30 - (crustBot - 30));
      g.fillStyle = `rgba(255,${120 + 80 * k},40,.95)`; g.beginPath(); g.arc(x, y, 4 + 2 * rnd(i + 3), 0, 7); g.fill();
    }
    // vent & eruption puffs
    g.strokeStyle = COL.magma; g.lineWidth = 9; g.beginPath(); g.moveTo(vx, crustBot - 50); g.lineTo(vx, 42); g.stroke();
    for (let i = 0; i < 8; i++) { const k = (t * 0.5 + i / 8) % 1; g.fillStyle = `rgba(255,${150 + 80 * (1 - k)},40,${1 - k})`; g.beginPath(); g.arc(vx + Math.sin(i * 1.7) * 30 * k, 40 - k * 60, 6 + 8 * k, 0, 7); g.fill(); }
    // labels
    label(g, 'Lava', vx + 90, 30, { size: 17 });
    label(g, 'Crust', 70, groundY + 40, { size: 17 });
    label(g, 'Magma chamber', vx + 230, crustBot - 34, { size: 16 });
    label(g, 'Rock melts more here', 620, meltY + 34, { size: 16 });
    label(g, 'Mantle', 90, H - 34, { size: 17 });
    label(g, 'Hot rock rises ↑', vx + 230, Math.min(H - 34, Math.max(meltY + 90, by + 10)), { size: 16, bg: 'rgba(10,14,22,.55)' });
    cap.textContent = 'Close-up drawing (not to scale). Rising mantle rock is squeezed less, so more of it melts. The magma rises and collects under a volcano.';
  }

  // =================================================================
  // TWO WAYS TO SORT THE LAYERS
  // =================================================================
  function plates(g, W, H, t, cap) {
    g.fillStyle = COL.sky; g.fillRect(0, 0, W, H);
    const top = 70, crustB = 140, lithB = 230, asthB = 380, x0 = 150, x1 = 600;
    // asthenosphere: soft and flowing
    g.fillStyle = '#d0603a'; g.fillRect(x0, lithB, x1 - x0, asthB - lithB);
    g.save(); g.beginPath(); g.rect(x0, lithB, x1 - x0, asthB - lithB); g.clip();
    g.strokeStyle = 'rgba(255,215,170,.55)'; g.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      for (let x = x0; x <= x1; x += 8) { const y = lithB + 22 + k * 24 + 6 * Math.sin((x - t * 30) / 40 + k); if (x === x0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
    g.restore();
    // lower mantle part below
    g.fillStyle = '#b8452a'; g.fillRect(x0, asthB, x1 - x0, H - 30 - asthB);
    speckle(g, x0, asthB, x1 - x0, H - 30 - asthB, '#ffd3a8', 200, 4);
    // lithosphere: a stiff slab that slides (crust on top + stiff mantle below)
    const slide = (t * 14) % 60;
    g.save(); g.beginPath(); g.rect(x0, top, x1 - x0, lithB - top); g.clip();
    g.fillStyle = '#9a7552'; g.fillRect(x0, top, x1 - x0, crustB - top);
    g.fillStyle = '#b5543a'; g.fillRect(x0, crustB, x1 - x0, lithB - crustB);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2;
    for (let x = x0 - 60 + slide; x < x1 + 60; x += 60) { g.beginPath(); g.moveTo(x, top); g.lineTo(x + 12, lithB); g.stroke(); }
    g.restore();
    g.strokeStyle = '#8fc3e8'; g.lineWidth = 4; g.setLineDash([12, 8]); g.strokeRect(x0 + 2, top + 2, x1 - x0 - 4, lithB - top - 4); g.setLineDash([]);
    g.strokeStyle = '#ff9a6e'; g.lineWidth = 4; g.setLineDash([12, 8]); g.strokeRect(x0 + 2, lithB + 2, x1 - x0 - 4, asthB - lithB - 4); g.setLineDash([]);
    arrow(g, 320, 105, 480, 105, '#fff', 6);
    label(g, 'Plate slides', 400, 168, { size: 19, bg: 'rgba(10,14,22,.55)' });
    // left side: made of
    label(g, 'MADE OF', x0 - 12, 34, { size: 15, align: 'right', bg: null, color: '#a8b3c5' });
    label(g, 'Crust', x0 - 12, (top + crustB) / 2, { size: 20, align: 'right', color: '#e8c9a8' });
    label(g, 'Mantle', x0 - 12, (crustB + H - 30) / 2, { size: 20, align: 'right', color: '#ffb59a' });
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x0 - 6, crustB); g.lineTo(x0 - 6, H - 30); g.stroke();
    // right side: how it moves
    label(g, 'HOW IT MOVES', x1 - 30, 34, { size: 15, align: 'left', bg: null, color: '#a8b3c5' });
    label(g, 'Litho-', x1 + 12, (top + lithB) / 2 - 34, { size: 19, align: 'left', color: '#8fc3e8' });
    label(g, 'sphere', x1 + 12, (top + lithB) / 2 + 2, { size: 19, align: 'left', color: '#8fc3e8' });
    label(g, 'stiff', x1 + 12, (top + lithB) / 2 + 36, { size: 17, align: 'left', color: '#cfe6f7', bg: null });
    label(g, 'Astheno-', x1 + 12, (lithB + asthB) / 2 - 34, { size: 19, align: 'left', color: '#ffb59a' });
    label(g, 'sphere', x1 + 12, (lithB + asthB) / 2 + 2, { size: 19, align: 'left', color: '#ffb59a' });
    label(g, 'soft', x1 + 12, (lithB + asthB) / 2 + 40, { size: 17, align: 'left', color: '#ffd9c9', bg: null });
    label(g, 'about 100 km down', x0 + 8, lithB - 22, { size: 14, align: 'left', bg: 'rgba(10,14,22,.6)', bold: false });
    label(g, 'about 250 km down', x0 + 8, asthB - 22, { size: 14, align: 'left', bg: 'rgba(10,14,22,.6)', bold: false });
    cap.textContent = 'Close-up drawing (not to scale). The lithosphere is the crust plus the stiff top of the mantle. It slides on the soft asthenosphere.';
  }

  return { start, stop };
}
