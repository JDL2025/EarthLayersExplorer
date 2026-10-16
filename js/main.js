// Earth Explorer — starts everything.
import { createScene } from './scene.js';
import { createUI } from './app.js';

const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2')); } catch (e) { return false; } })();
if (!ok) {
  document.getElementById('fail').hidden = false;
} else {
  const api = createScene(document.getElementById('stage'));
  const ui = createUI(api);
  window.EE = { api, ui };
  // Optional features: each one is its own file, so a problem in one can't stop the others.
  const optional = [
    ['anims', './anims.js'], ['closeups', './closeups.js'], ['trips', './trips.js'],
    ['quakes', './quakes.js'], ['young', './youngearth.js']
  ];
  for (const [name, path] of optional) {
    import(path).then(m => { ui.features[name] = m.init(api, ui); })
      .catch(e => console.warn('Feature not loaded:', name, e));
  }
}
