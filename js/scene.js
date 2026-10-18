// =====================================================================
// Earth Explorer — the 3D model (Three.js)
// Draws the Earth, cuts it open (cutaway / slice / peel), handles
// spinning and zooming, and tells the rest of the program what was tapped.
// =====================================================================
import * as THREE from '../lib/three.module.min.js';
import { INTERIOR_VERT, INTERIOR_FRAG, SURFACE_VERT, SURFACE_FRAG, ATMO_VERT, ATMO_FRAG,
         DOTS_VERT, DOTS_FRAG, LINE_VERT, LINE_FRAG } from './glsl.js';

export { THREE };
export const EARTH_KM = 6371;

// Depths (km) of the boundaries. Scientists' standard values (PREM model, USGS).
export const DEPTHS = { crust: 35, litho: 100, astheno: 250, cmb: 2890, icb: 5150 };

// How big each layer is drawn (fraction of Earth's radius from the center).
// TRUE = real sizes. EASY = the crust and advanced layers drawn thicker so they are easy to see and tap.
const TRUE_R = { crust: 1 - 35 / 6371, litho: 1 - 100 / 6371, astheno: 1 - 250 / 6371, cmb: 1 - 2890 / 6371, icb: 1 - 5150 / 6371 };
const EASY_R = { crust: 0.915, litho: 0.868, astheno: 0.79, cmb: TRUE_R.cmb, icb: TRUE_R.icb };

const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

export function createScene(container) {
  const api = { THREE };
  let dirty = true;
  api.requestRender = () => { dirty = true; };
  // ---------- renderer ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x04060a, 1);
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.002, 200);
  const FOV_T = Math.tan(THREE.MathUtils.degToRad(35 / 2));
  api.renderer = renderer; api.scene = scene; api.camera = camera;

  // ---------- groups ----------
  const pivot = new THREE.Group();       // turned by your finger
  const earth = new THREE.Group();       // the planet (north pole = +Y)
  scene.add(pivot); pivot.add(earth);
  api.pivot = pivot; api.earth = earth;

  // ---------- layer sizes (Easy view <-> True scale) ----------
  const R = { ...EASY_R };
  api.R = R;
  api.scaleT = 0;          // 0 = easy view, 1 = true scale
  function applyScale() {
    for (const k in R) R[k] = lerp(EASY_R[k], TRUE_R[k], ease(api.scaleT));
    shared.uCrust.value = R.crust; shared.uLitho.value = R.litho; shared.uAstheno.value = R.astheno;
    shared.uCmb.value = R.cmb; shared.uIcb.value = R.icb;
    updateSpheres();
  }
  // depth (km) -> radius in the drawing, and back again
  function knots() {
    return [[0, 1], [DEPTHS.crust, R.crust], [DEPTHS.litho, R.litho], [DEPTHS.astheno, R.astheno],
            [DEPTHS.cmb, R.cmb], [DEPTHS.icb, R.icb], [EARTH_KM, 0]];
  }
  api.depthToR = d => {
    d = clamp(d, 0, EARTH_KM); const k = knots();
    for (let i = 1; i < k.length; i++) if (d <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (d - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
    return 0;
  };
  api.rToDepth = r => {
    r = clamp(r, 0, 1); const k = knots();
    for (let i = 1; i < k.length; i++) if (r >= k[i][1]) return lerp(k[i - 1][0], k[i][0], (k[i - 1][1] - r) / (k[i - 1][1] - k[i][1]));
    return EARTH_KM;
  };
  api.layerAtDepth = (d, adv) => {
    if (d < DEPTHS.crust) return 'crust';
    if (adv && d < DEPTHS.litho) return 'lithosphere';
    if (adv && d < DEPTHS.astheno) return 'asthenosphere';
    if (d < DEPTHS.cmb) return 'mantle';
    if (d < DEPTHS.icb) return 'outer';
    return 'inner';
  };

  // ---------- shared shader settings ----------
  const shared = {
    uCrust: { value: R.crust }, uLitho: { value: R.litho }, uAstheno: { value: R.astheno },
    uCmb: { value: R.cmb }, uIcb: { value: R.icb },
    uAdv: { value: 0 }, uHi: { value: 0 }, uDim: { value: 0 }, uTime: { value: 0 },
    uConv: { value: 0 }, uConvK: { value: 4 }, uSort: { value: 1 }, uInner: { value: 1 }, uMagma: { value: 0 },
    uLines: { value: 1 }, uPulse: { value: 0 }
  };
  api.uniforms = shared;
  function interiorMat({ lit = 0, radius = 0, alpha = 1, side = THREE.FrontSide, transparent = false } = {}) {
    return new THREE.ShaderMaterial({
      vertexShader: INTERIOR_VERT, fragmentShader: INTERIOR_FRAG,
      uniforms: { ...shared, uFaceToEarth: { value: new THREE.Matrix4() }, uLit: { value: lit },
                  uRadius: { value: radius }, uAlpha: { value: alpha } },
      side, transparent
    });
  }

  // ---------- the outside (Blue Marble) ----------
  const loader = new THREE.TextureLoader();
  const blank = new THREE.DataTexture(new Uint8Array([40, 70, 110, 255]), 1, 1); blank.needsUpdate = true;
  const surfUniforms = {
    uMap: { value: blank }, uMode: { value: 1 }, uN1: { value: new THREE.Vector3() }, uN2: { value: new THREE.Vector3() },
    uAlpha: { value: 1 }, uTime: shared.uTime, uMolten: { value: 0 }, uDark: { value: 1 }, uOcean: { value: 1 }, uToday: { value: 1 }
  };
  api.surfaceUniforms = surfUniforms;
  function surfaceMat(mode, side = THREE.FrontSide, transparent = false) {
    // each copy gets its own cut settings (uN1, uN2); the picture and time are shared
    const u = { ...surfUniforms, uMode: { value: mode }, uAlpha: { value: 1 }, uBack: { value: side === THREE.DoubleSide ? 1 : 0 },
                uN1: { value: new THREE.Vector3() }, uN2: { value: new THREE.Vector3() } };
    return new THREE.ShaderMaterial({ vertexShader: SURFACE_VERT, fragmentShader: SURFACE_FRAG, uniforms: u, side, transparent });
  }
  const sphereGeo = new THREE.SphereGeometry(1, 128, 96);
  const surface = new THREE.Mesh(sphereGeo, surfaceMat(1));
  surface.renderOrder = 1;
  earth.add(surface);
  api.surface = surface;
  let texReady = false;
  loader.load('assets/textures/earth-day-small.jpg', t => {
    t.anisotropy = 4; surfUniforms.uMap.value = t; texReady = true; api.requestRender();
    loader.load('assets/textures/earth-day.jpg', big => { big.anisotropy = 8; surfUniforms.uMap.value = big; api.requestRender(); });
    api.onTextureReady && api.onTextureReady();
  }, undefined, () => { api.onTextureReady && api.onTextureReady(true); });

  // atmosphere glow
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.035, 64, 48), new THREE.ShaderMaterial({
    vertexShader: ATMO_VERT, fragmentShader: ATMO_FRAG, side: THREE.BackSide, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uStrength: { value: 1.1 }, uColor: { value: new THREE.Color(0.35, 0.62, 1.0) },
                uMode: { value: 0 }, uN1: { value: new THREE.Vector3() }, uN2: { value: new THREE.Vector3() } }
  }));
  scene.add(atmo);
  api.atmo = atmo;

  // stars
  {
    const n = 1400, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), al = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      pos.set([60 * s * Math.cos(th), 60 * u, 60 * s * Math.sin(th)], i * 3);
      const w = 0.7 + Math.random() * 0.3; col.set([w, w, Math.min(1, w + 0.08)], i * 3);
      size[i] = Math.random() < 0.08 ? 2.6 : 1.3 + Math.random() * 0.8; al[i] = 0.35 + Math.random() * 0.55;
    }
    const stars = makeDots(pos, col, size, al, { soft: 0, depthTest: true });
    pivot.add(stars);
  }

  // ---------- the cut faces ----------
  // Each face is a flat disk (or half disk) whose own x/y plane is the cut.
  function makeFace(thetaStart, thetaLength, segs = 220) {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, segs, thetaStart, thetaLength), interiorMat());
    mesh.renderOrder = 1;
    g.add(mesh); g.userData.mesh = mesh;
    earth.add(g);
    return g;
  }
  const wedgeA = makeFace(-Math.PI / 2, Math.PI);
  const wedgeB = makeFace(-Math.PI / 2, Math.PI);
  const sliceFace = makeFace(0, Math.PI * 2, 256);
  api.sliceFace = sliceFace;        // things drawn on the slice go in here (x, y = face coordinates)
  api.wedgeFaces = [wedgeA, wedgeB];

  // the half that slides away when you slice
  const depart = new THREE.Group(); earth.add(depart);
  const departSurf = new THREE.Mesh(sphereGeo, surfaceMat(3, THREE.FrontSide, true));
  const departFace = makeFace(0, Math.PI * 2, 128);
  earth.remove(departFace); depart.add(departSurf); depart.add(departFace);
  departFace.userData.mesh.material.transparent = true;
  depart.visible = false;

  function orientFace(g, normal, xAxis) {
    const z = normal.clone().normalize();
    const x = xAxis.clone().sub(z.clone().multiplyScalar(xAxis.dot(z))).normalize();
    const y = new THREE.Vector3().crossVectors(z, x);
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    g.updateMatrix();
    g.userData.mesh.material.uniforms.uFaceToEarth.value.copy(g.matrix);
  }

  // Default cutaway: a quarter wedge between two lines of longitude
  const CUT_LON = -25;  // middle of the missing wedge (degrees)
  function setWedge(lonMid) {
    const a = THREE.MathUtils.degToRad(lonMid - 45), b = THREE.MathUtils.degToRad(lonMid + 45);
    // direction of a longitude on the equator
    const dirAt = l => new THREE.Vector3(Math.cos(l), 0, -Math.sin(l));
    const m = dirAt(THREE.MathUtils.degToRad(lonMid));
    // planes through the polar axis; normals point into the missing wedge
    const nA = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dirAt(a)).normalize();
    const nB = new THREE.Vector3().crossVectors(dirAt(b), new THREE.Vector3(0, 1, 0)).normalize();
    if (nA.dot(m) < 0) nA.negate(); if (nB.dot(m) < 0) nB.negate();
    surface.material.uniforms.uN1.value.copy(nA); surface.material.uniforms.uN2.value.copy(nB);
    // face A lies in plane A, covering the side toward B
    orientFace(wedgeA, nA, nB);
    orientFace(wedgeB, nB, nA);
    api.wedge = { nA, nB, lonMid };
  }
  setWedge(CUT_LON);

  // ---------- spheres & peels (Peel view) ----------
  const peelSets = [];      // [{ name, group, gores:[], mat, p, target }]
  const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), interiorMat({ lit: 1 }));
  earth.add(coreSphere); coreSphere.visible = false;
  function makeGores(isSurface) {
    const set = new THREE.Group(); earth.add(set);
    const n = 8, gores = [];
    const mat = isSurface ? surfaceMat(0, THREE.DoubleSide, true) : interiorMat({ lit: 1, side: THREE.DoubleSide, transparent: true });
    for (let k = 0; k < n; k++) {
      const phiStart = k * Math.PI * 2 / n, phiLen = Math.PI * 2 / n;
      const geo = new THREE.SphereGeometry(1, 18, 64, phiStart, phiLen);
      if (isSurface) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (phiStart + uv.getX(i) * phiLen) / (Math.PI * 2)); }
      const hinge = new THREE.Group(); hinge.position.set(0, -1, 0);
      const mesh = new THREE.Mesh(geo, mat); mesh.position.set(0, 1, 0);
      hinge.add(mesh); set.add(hinge);
      const pc = phiStart + phiLen / 2;
      const m = new THREE.Vector3(-Math.cos(pc), 0, Math.sin(pc));
      hinge.userData.axis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), m).normalize();
      gores.push(hinge);
    }
    set.visible = false;
    return { group: set, gores, mat, p: 0, target: 0 };
  }
  peelSets.push({ name: 'crust', ...makeGores(true) });
  peelSets.push({ name: 'mantle', ...makeGores(false) });
  peelSets.push({ name: 'outer', ...makeGores(false) });
  function updateSpheres() {
    const radii = [1, R.crust, R.cmb];
    peelSets.forEach((s, i) => {
      s.group.scale.setScalar(radii[i]);
      if (i > 0) { s.mat.uniforms.uRadius.value = radii[i] - 0.0015; s.mat.uniforms.uFaceToEarth.value.makeScale(radii[i], radii[i], radii[i]); }
    });
    coreSphere.scale.setScalar(R.icb);
    coreSphere.material.uniforms.uRadius.value = R.icb - 0.001;
    coreSphere.material.uniforms.uFaceToEarth.value.makeScale(R.icb, R.icb, R.icb);
  }
  updateSpheres();
  function applyPeel() {
    peelSets.forEach(s => {
      const a = ease(clamp(s.p, 0, 1)) * 2.35;
      s.gores.forEach(h => h.quaternion.setFromAxisAngle(h.userData.axis, a));
      const alpha = 1 - THREE.MathUtils.smoothstep(s.p, 0.55, 1.0);
      s.mat.uniforms.uAlpha.value = alpha;
      s.group.visible = api.view === 'peel' && alpha > 0.01;
    });
  }
  api.peel = {
    stage: 0,
    names: ['crust', 'mantle', 'outer', 'inner'],
    set(stage) {
      this.stage = clamp(stage, 0, 3);
      peelSets.forEach((s, i) => { s.target = i < this.stage ? 1 : 0; });
      // zoom so the layer you can see fills the screen
      const r = [1, R.crust, R.cmb, R.icb][this.stage];
      api.camTo({ dist: fitDist() * Math.max(0.42, Math.pow(r, 0.75)) }, 1100);
      api.requestRender();
      return this.names[this.stage];
    }
  };

  // ---------- view state & rotation ----------
  api.view = 'cutaway';
  const rot = { base: new THREE.Quaternion(), yaw: 0, pitch: 0, vy: 0, vp: 0, yawLim: Infinity, pitchLim: 1.35 };
  const cam = { dist: 4, px: 0, py: 0 };
  const ZOOM_POWER = 2.4;                       // bigger = faster pinch zoom (Mars Explorer uses the same idea)
  const zoomFling = { v: 0, t: 0, cx: 0, cy: 0, on: false };   // lets a quick pinch keep gliding
  api.cam = cam;
  const shift = { x: 0, y: 0, tx: 0, ty: 0 };
  let W = 1, H = 1;
  const qTmp = new THREE.Quaternion(), qy = new THREE.Quaternion(), qp = new THREE.Quaternion();
  const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0);
  function straighten() {   // in Slice view, the picture turns face-on as you zoom in
    if (api.view !== 'slice') return 1;
    return clamp((cam.dist - 0.8) / Math.max(fitDist() - 0.8, 0.1), 0, 1);
  }
  function composeRotation(out) {
    const k = straighten();
    qy.setFromAxisAngle(AY, rot.yaw * k); qp.setFromAxisAngle(AX, rot.pitch * k);
    return out.copy(qp).multiply(qy).multiply(rot.base);
  }
  function fitDist(useTarget) {
    const sx = useTarget ? shift.tx : shift.x, sy = useTarget ? shift.ty : shift.y;
    const availW = Math.max(200, W - 2 * Math.abs(sx)), availH = Math.max(200, H - 2 * Math.abs(sy) - 150);
    const pxPerUnitAt1 = (H / 2) / FOV_T;
    return 1.12 * pxPerUnitAt1 / (Math.min(availW, availH) / 2);
  }
  api.fitDist = fitDist;
  function limits() {
    const f = fitDist();
    if (api.view === 'slice') return { min: 0.035, max: f * 1.8 };
    if (api.view === 'peel') { const r = [1, R.crust, R.cmb, R.icb][api.peel.stage]; return { min: r * 1.3 + 0.05, max: f * 1.8 }; }
    return { min: 1.3, max: f * 1.8 };
  }

  // ---------- tweens ----------
  const tweens = new Set();
  api.tween = (ms, fn, done) => {
    const t0 = performance.now(), tw = { fn, done, t0, ms };
    tweens.add(tw); api.requestRender();
    return () => tweens.delete(tw);
  };
  let camTween = null;
  api.camTo = (target, ms = 900) => {
    zoomFling.on = false;
    if (camTween) camTween();
    const from = { ...cam };
    const to = { dist: target.dist ?? cam.dist, px: target.px ?? (api.view === 'slice' ? cam.px : 0), py: target.py ?? (api.view === 'slice' ? cam.py : 0) };
    camTween = api.tween(ms, t => { const e = ease(t); cam.dist = lerp(from.dist, to.dist, e); cam.px = lerp(from.px, to.px, e); cam.py = lerp(from.py, to.py, e); }, () => { camTween = null; });
  };
  let rotTween = null;
  // turn the planet to a new base orientation (yaw/pitch are reset)
  api.rotTo = (targetBase, ms = 900, after = {}) => {
    if (rotTween) rotTween();
    const from = composeRotation(new THREE.Quaternion());
    rot.base.copy(from); rot.yaw = 0; rot.pitch = 0; rot.vy = rot.vp = 0;
    const to = targetBase.clone();
    rotTween = api.tween(ms, t => { rot.base.copy(from).slerp(to, ease(t)); }, () => {
      rotTween = null;
      if (after.yaw !== undefined) { // switch back to "free spin" numbers
        rot.base.identity(); rot.yaw = after.yaw; rot.pitch = after.pitch || 0;
      }
    });
  };
  // orientation where Earth's north is up and this longitude faces you, tilted by pitch
  function globeQuat(yaw, pitch) {
    qy.setFromAxisAngle(AY, yaw); qp.setFromAxisAngle(AX, pitch);
    return new THREE.Quaternion().copy(qp).multiply(qy);
  }
  // longitude (deg) -> yaw that puts it in front of the camera
  const yawFor = lonDeg => -Math.PI / 2 - THREE.MathUtils.degToRad(lonDeg);
  api.yawFor = yawFor;

  const HOME = { yaw: yawFor(CUT_LON - 20), pitch: 0.32 };   // start looking from over the Atlantic, with the Americas in view
  api.home = (ms = 1100) => {
    api.rotTo(globeQuat(HOME.yaw, HOME.pitch), ms, { yaw: HOME.yaw, pitch: HOME.pitch });
    api.camTo({ dist: fitDist(), px: 0, py: 0 }, ms);
  };
  api.flyToLatLon = (lat, lon, dist, ms = 1300) => {
    const yaw = yawFor(lon), pitch = clamp(THREE.MathUtils.degToRad(lat) * 0.9, -1.2, 1.2);
    api.rotTo(globeQuat(yaw, pitch), ms, { yaw, pitch });
    api.camTo({ dist: dist ?? fitDist() * 0.75, px: 0, py: 0 }, ms);
  };

  // ---------- switching views ----------
  function showOnly(v) {
    wedgeA.visible = wedgeB.visible = v === 'cutaway';
    sliceFace.visible = v === 'slice';
    coreSphere.visible = v === 'peel';
    surface.visible = true;
    surface.material.uniforms.uMode.value = v === 'cutaway' ? 1 : v === 'slice' ? 2 : 0;
    // point the cut the right way for this view
    if (v === 'cutaway') { surface.material.uniforms.uN1.value.copy(api.wedge.nA); surface.material.uniforms.uN2.value.copy(api.wedge.nB); }
    else if (v === 'slice' && api.slicePlane) { surface.material.uniforms.uN1.value.copy(api.slicePlane.n); }
    surface.material.uniforms.uAlpha.value = 1;
    surface.material.transparent = false;
    if (v !== 'peel') { peelSets.forEach(s => { s.p = s.target = 0; s.group.visible = false; }); api.peel.stage = 0; }
    if (v === 'peel') surface.visible = false;   // the peel pieces replace the outside
    applyPeel();
  }
  // Set up the slice plane: normal (earth-local, toward the viewer) and which way is "up" on screen
  function setSlicePlane(n1, up) {
    const z = n1.clone().normalize();
    const y = up.clone().sub(z.clone().multiplyScalar(up.dot(z))).normalize();
    const x = new THREE.Vector3().crossVectors(y, z);
    surface.material.uniforms.uN1.value.copy(z);
    departSurf.material.uniforms.uN1.value.copy(z);
    orientFace(sliceFace, z, x);
    orientFace(departFace, z.clone().negate(), x.clone().negate());
    api.slicePlane = { n: z, up: y, right: x };
    // the planet turns so the cut faces you, with "up" pointing up
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)).invert();
  }
  // the earth-local direction that currently points at the viewer
  function viewDirLocal() {
    const q = composeRotation(new THREE.Quaternion()).invert();
    return new THREE.Vector3(0, 0, 1).applyQuaternion(q);
  }
  api.viewDirLocal = viewDirLocal;

  api.setView = (v, opts = {}) => {
    const prev = api.view;
    api.view = v;
    rot.vy = rot.vp = 0;
    if (v === 'slice') {
      let n1, up;
      if (opts.up) {               // e.g. Dig: the cut must pass through your starting place
        up = opts.up.clone().normalize();
        const d = viewDirLocal();
        n1 = d.sub(up.clone().multiplyScalar(d.dot(up)));
        if (n1.lengthSq() < 1e-4) n1 = new THREE.Vector3(0, 0, 1).cross(up);
        n1.normalize();
      } else {
        const d = viewDirLocal(); d.y = 0;
        if (d.lengthSq() < 1e-4) d.set(0, 0, 1);
        n1 = d.normalize(); up = new THREE.Vector3(0, 1, 0);
      }
      const q = setSlicePlane(n1, up);
      showOnly('slice');
      rot.yawLim = 0.7; rot.pitchLim = 0.55;
      api.rotTo(q, opts.instant ? 1 : 800);
      api.camTo({ dist: opts.dist ?? fitDist(), px: 0, py: 0 }, opts.instant ? 1 : 900);
      if (!opts.instant && prev !== 'slice') {   // the front half slides away
        depart.visible = true; depart.position.set(0, 0, 0);
        const away = n1.clone().multiplyScalar(1.4).add(api.slicePlane.right.clone().multiplyScalar(1.6));
        api.tween(1500, t => {
          const e = ease(clamp((t - 0.25) / 0.75, 0, 1));
          depart.position.copy(away).multiplyScalar(e);
          const a = 1 - THREE.MathUtils.smoothstep(e, 0.35, 1);
          departSurf.material.uniforms.uAlpha.value = a; departFace.userData.mesh.material.uniforms.uAlpha.value = a;
        }, () => { depart.visible = false; });
      }
    } else {
      depart.visible = false;
      rot.yawLim = Infinity; rot.pitchLim = 1.35;
      showOnly(v);
      if (v === 'peel') api.peel.set(0);
      if (!opts.keepCamera) {
        const yaw = opts.yaw ?? (prev === 'slice' || prev === 'peel' ? HOME.yaw : HOME.yaw);
        const pitch = opts.pitch ?? (v === 'peel' ? 0.42 : HOME.pitch);
        api.rotTo(globeQuat(yaw, pitch), opts.instant ? 1 : 900, { yaw, pitch });
        if (v !== 'peel') api.camTo({ dist: opts.dist ?? fitDist(), px: 0, py: 0 }, opts.instant ? 1 : 900);
      }
    }
    api.onViewChange && api.onViewChange(v, prev);
    api.requestRender();
  };
  api.setGlobeOnly = (on) => {     // a plain, uncut globe (used when picking a place to dig)
    if (on) { wedgeA.visible = wedgeB.visible = false; surface.material.uniforms.uMode.value = 0; }
    else showOnly(api.view);
    api.requestRender();
  };

  // ---------- Easy view / True scale ----------
  let scaleTween = null;
  api.setScale = (which) => {
    if (scaleTween) scaleTween();
    const from = api.scaleT, to = which === 'true' ? 1 : 0;
    scaleTween = api.tween(1400, t => { api.scaleT = lerp(from, to, t); applyScale(); }, () => { scaleTween = null; });
  };

  api.setHighlight = (id) => {
    const map = { crust: 1, mantle: 2, outer: 3, inner: 4, lithosphere: 5, asthenosphere: 6 };
    const v = map[id] || 0;
    if (v) shared.uHi.value = v;
    const from = shared.uDim.value, to = v ? 1 : 0;
    api.tween(500, t => { shared.uDim.value = lerp(from, to, t); }, () => { if (!v) shared.uHi.value = 0; });
  };
  api.setAdvanced = (on) => {
    const from = shared.uAdv.value, to = on ? 1 : 0;
    api.tween(600, t => { shared.uAdv.value = lerp(from, to, t); });
  };
  api.fadeUniform = (u, to, ms = 800) => {
    const from = u.value;
    return api.tween(ms, t => { u.value = lerp(from, to, t); });
  };

  // ---------- helpers for drawing on the slice ----------
  function makeDots(pos, col, size, alpha, { soft = 1, additive = false, depthTest = true } = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: DOTS_VERT, fragmentShader: DOTS_FRAG, transparent: true, depthWrite: false, depthTest,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uScale: { value: renderer.getPixelRatio() }, uOpacity: { value: 1 }, uSoft: { value: soft } }
    });
    const p = new THREE.Points(g, m); p.frustumCulled = false;
    return p;
  }
  // Thick lines that stay the same width on screen, drawn flat in a face's x/y plane.
  // lines: one polyline [[x,y],...] or a list of polylines. width is in screen pixels.
  // along (optional): a number for every point (used to "grow" lines with uHead).
  const lineMats = new Set();
  api.makeLine = (lines, { color = [1, 1, 1], colors = null, width = 3, opacity = 1, dash = 0, z = 0.002, additive = false, along = null } = {}) => {
    if (!lines.length) return null;
    if (typeof lines[0][0] === 'number') { lines = [lines]; if (along) along = [along]; if (colors) colors = [colors]; }
    let total = 0; lines.forEach(l => { if (l.length >= 2) total += l.length; });
    const P = new Float32Array(total * 2 * 3), D = new Float32Array(total * 2 * 2), S = new Float32Array(total * 2), A = new Float32Array(total * 2), C = new Float32Array(total * 2 * 3);
    const idx = []; let base = 0, maxLen = 0;
    lines.forEach((pts, li) => {
      const n = pts.length; if (n < 2) return;
      let len = 0; const cum = [0];
      for (let i = 1; i < n; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(len); }
      maxLen = Math.max(maxLen, len);
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        const c = colors ? colors[li][i] || colors[li] : color;
        const cc = typeof c[0] === 'number' ? c : color;
        const al = along ? along[li][i] : (len ? cum[i] / len : 0);
        for (let s2 = 0; s2 < 2; s2++) {
          const j = (base + i) * 2 + s2;
          P[j * 3] = pts[i][0]; P[j * 3 + 1] = pts[i][1]; P[j * 3 + 2] = z;
          D[j * 2] = dx; D[j * 2 + 1] = dy; S[j] = s2 ? 1 : -1; A[j] = al;
          C[j * 3] = cc[0]; C[j * 3 + 1] = cc[1]; C[j * 3 + 2] = cc[2];
        }
      }
      for (let i = 0; i < n - 1; i++) { const a = (base + i) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      base += n;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('dir', new THREE.BufferAttribute(D, 2));
    g.setAttribute('side', new THREE.BufferAttribute(S, 1)); g.setAttribute('along', new THREE.BufferAttribute(A, 1));
    g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uWidth: { value: width }, uWorldPerPx: { value: api.worldPerPx ? api.worldPerPx() : 0.003 }, uOpacity: { value: opacity },
                  uHead: { value: 1e9 }, uTail: { value: -1 }, uDash: { value: dash }, uTime: shared.uTime }
    });
    lineMats.add(m);
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3;
    mesh.userData.length = maxLen;
    mesh.addEventListener('removed', () => { lineMats.delete(m); });
    mesh.dispose = () => { lineMats.delete(m); g.dispose(); m.dispose(); };
    return mesh;
  };
  api.makeDots = makeDots;

  // ---------- coordinates ----------
  api.latLonToLocal = (lat, lon, r = 1) => {
    const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
    return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
  };
  api.localToLatLon = v => {
    const n = v.clone().normalize();
    return { lat: THREE.MathUtils.radToDeg(Math.asin(clamp(n.y, -1, 1))), lon: THREE.MathUtils.radToDeg(Math.atan2(-n.z, n.x)) };
  };
  const vTmp = new THREE.Vector3();
  api.project = (world) => {
    vTmp.copy(world).project(camera);
    return { x: (vTmp.x * 0.5 + 0.5) * W, y: (-vTmp.y * 0.5 + 0.5) * H, ok: vTmp.z < 1 && vTmp.z > -1 };
  };
  api.faceToWorld = (face, x, y) => face.localToWorld(new THREE.Vector3(x, y, 0));
  api.facing = (face) => {   // how much a face points toward the viewer (1 = straight at you)
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(face.getWorldQuaternion(new THREE.Quaternion()));
    const c = face.getWorldPosition(new THREE.Vector3());
    return n.dot(camera.position.clone().sub(c).normalize());
  };
  api.worldPerPx = () => (2 * cam.dist * FOV_T) / H;

  // ---------- tapping ----------
  const ray = new THREE.Raycaster();
  api.pickables = [];      // extra things that can be tapped: { object, hit(intersection) }
  api.pick = (x, y) => {
    const ndc = new THREE.Vector2((x / W) * 2 - 1, -(y / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    ray.params.Points.threshold = api.worldPerPx() * 14;
    const objs = [];
    for (const p of api.pickables) if (p.object.visible && isShown(p.object)) objs.push(p.object);
    const faces = api.view === 'cutaway' ? [wedgeA.userData.mesh, wedgeB.userData.mesh] : api.view === 'slice' ? [sliceFace.userData.mesh] : [];
    faces.forEach(f => { if (f.visible && isShown(f)) objs.push(f); });
    if (api.view === 'peel') { objs.push(coreSphere); peelSets.forEach(s => { if (s.group.visible && s.p < 0.2) s.gores.forEach(h => objs.push(h.children[0])); }); }
    if (surface.visible) objs.push(surface);
    const hits = ray.intersectObjects(objs, false);
    for (const h of hits) {
      const extra = api.pickables.find(p => p.object === h.object);
      if (extra) { const r = extra.hit(h); if (r) return r; continue; }
      if (h.object === surface) {
        const local = earth.worldToLocal(h.point.clone());
        const m = surface.material.uniforms.uMode.value, n1 = surface.material.uniforms.uN1.value, n2 = surface.material.uniforms.uN2.value;
        if (m === 1 && local.dot(n1) > 0 && local.dot(n2) > 0) continue;
        if (m === 2 && local.dot(n1) > 0) continue;
        return { type: 'surface', local, ...api.localToLatLon(local) };
      }
      if (faces.includes(h.object)) {
        const lp = h.object.parent.worldToLocal(h.point.clone());
        const r = Math.hypot(lp.x, lp.y);
        return { type: 'layer', r, depth: api.rToDepth(r), face: h.object.parent, x: lp.x, y: lp.y };
      }
      if (h.object === coreSphere) return { type: 'layer', depth: 6000, forced: 'inner' };
      const set = peelSets.find(s => s.gores.some(g => g.children[0] === h.object));
      if (set) return { type: 'layer', forced: set.name };
    }
    return null;
  };
  function isShown(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }

  // ---------- touch & mouse ----------
  const el = renderer.domElement;
  const pointers = new Map();
  let gesture = null;
  api.inputEnabled = true;
  api.onTap = null;
  el.addEventListener('pointerdown', e => {
    if (!api.inputEnabled) return;
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    rot.vy = rot.vp = 0;
    zoomFling.on = false; zoomFling.v = 0; zoomFling.t = 0;
    if (pointers.size === 1) gesture = { t0: performance.now(), x0: e.clientX, y0: e.clientY, moved: false, multi: false, lastT: performance.now() };
    else if (gesture) { gesture.multi = true; gesture.pinch = pinchState(); }
  });
  // ---------- zooming ----------
  // zoom is measured as height above the surface you are looking at
  function zoomBase() {
    if (api.view === 'slice') return 0;
    if (api.view === 'peel') return [1, R.crust, R.cmb, R.icb][api.peel.stage];
    return 1;
  }
  function zoomAt(newDist, cx, cy) {             // zoom so the spot at (cx, cy) stays under your fingers
    const lim = limits();
    newDist = clamp(newDist, lim.min, lim.max);
    if (api.view === 'slice') {
      const k = worldPerPxAt(cam.dist), k2 = worldPerPxAt(newDist);
      const wx = cam.px + (cx - W / 2 - shiftPx()) * k, wy = cam.py - (cy - H / 2 + shiftPy()) * k;
      cam.px = wx - (cx - W / 2 - shiftPx()) * k2; cam.py = wy + (cy - H / 2 + shiftPy()) * k2;
      clampPan();
    }
    const hit = newDist <= lim.min + 1e-6 || newDist >= lim.max - 1e-6;
    cam.dist = newDist;
    api.requestRender();
    return hit;
  }
  function pinchState() {
    const [a, b] = [...pointers.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, dist: cam.dist, px: cam.px, py: cam.py };
  }
  el.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId); if (!p || !gesture) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > 9) gesture.moved = true;
    if (pointers.size === 1 && !gesture.multi) {
      if (api.view === 'slice' && straighten() < 0.5) panBy(dx, dy);
      else rotateBy(dx, dy, performance.now() - gesture.lastT);
      gesture.lastT = performance.now();
    } else if (pointers.size === 2 && gesture.pinch) {
      const now = pinchState(), s = gesture.pinch;
      const lim = limits(), base = zoomBase();
      // Fast zoom: a small pinch makes a big change (like Mars Explorer's zoomFactor)
      const ratio = s.d / Math.max(now.d, 1);
      const newDist = clamp(base + (s.dist - base) * Math.pow(ratio, ZOOM_POWER), lim.min, lim.max);
      if (api.view === 'slice') {
        // keep the spot under your fingers in place
        const k = worldPerPxAt(s.dist), k2 = worldPerPxAt(newDist);
        const wx = s.px + (s.cx - W / 2 - shiftPx()) * k, wy = s.py - (s.cy - H / 2 + shiftPy()) * k;
        cam.px = wx - (now.cx - W / 2 - shiftPx()) * k2; cam.py = wy + (now.cy - H / 2 + shiftPy()) * k2;
        clampPan();
      }
      // remember how fast the zoom is changing, so it can keep gliding after the fingers lift
      const t = performance.now(), hNew = Math.max(newDist - base, 1e-4), hOld = Math.max(cam.dist - base, 1e-4);
      const dt = Math.max(8, t - (zoomFling.t || t - 16)) / 1000;
      const v = Math.log(hNew / hOld) / dt;
      zoomFling.v = zoomFling.v * 0.5 + v * 0.5; zoomFling.t = t; zoomFling.cx = now.cx; zoomFling.cy = now.cy;
      cam.dist = newDist;
      api.requestRender();
    }
  });
  // where the camera's center point appears on screen (it moves when a card is open)
  const shiftPx = () => -shift.x, shiftPy = () => shift.y;
  function worldPerPxAt(d) { return (2 * d * FOV_T) / H; }
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (gesture && pointers.size === 0) {
      const dt = performance.now() - gesture.t0;
      if (!gesture.moved && !gesture.multi && dt < 500 && api.onTap) api.onTap(e.clientX, e.clientY);
      if (performance.now() - gesture.lastT > 60) { rot.vy = rot.vp = 0; }
      gesture = null;
    } else if (gesture && pointers.size === 1) {
      gesture.pinch = null;
    }
    if (pointers.size < 2 && zoomFling.t && performance.now() - zoomFling.t < 120 && Math.abs(zoomFling.v) > 0.3) {
      zoomFling.on = true; zoomFling.v = clamp(zoomFling.v, -6, 6);
    }
    if (pointers.size < 2) zoomFling.t = 0;
  }
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', endPointer);
  el.addEventListener('wheel', e => {
    e.preventDefault();
    zoomFling.on = false;
    const base = zoomBase();
    const f = Math.exp(clamp(e.deltaY, -120, 120) * (e.ctrlKey ? 0.012 : 0.004));
    zoomAt(base + (cam.dist - base) * f, e.clientX, e.clientY);
  }, { passive: false });
  function rotateBy(dx, dy, dt) {
    const speed = 0.0055 * Math.min(1, Math.max(0.12, (cam.dist - 0.9) / 3));
    rot.yaw += dx * speed; rot.pitch += dy * speed;
    clampRot();
    const s = Math.max(dt, 8) / 16;
    rot.vy = dx * speed / s; rot.vp = dy * speed / s;
    api.requestRender();
  }
  function clampRot() {
    if (rot.yawLim !== Infinity) rot.yaw = clamp(rot.yaw, -rot.yawLim, rot.yawLim);
    rot.pitch = clamp(rot.pitch, -rot.pitchLim, rot.pitchLim);
  }
  function panBy(dx, dy) {
    const k = api.worldPerPx();
    cam.px -= dx * k; cam.py += dy * k; clampPan(); api.requestRender();
  }
  function clampPan() {
    const m = Math.hypot(cam.px, cam.py), lim = 1.05;
    if (m > lim) { cam.px *= lim / m; cam.py *= lim / m; }
  }

  // ---------- size & layout ----------
  api.setShift = (x, y) => {
    const wasFit = Math.abs(cam.dist - fitDist(true)) / fitDist(true) < 0.12;
    shift.tx = x; shift.ty = y;
    if (wasFit && !camTween) api.camTo({ dist: fitDist(true) }, 500);
    api.requestRender();
  };
  function resize() {
    W = container.clientWidth || window.innerWidth; H = container.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
    api.W = W; api.H = H;
    api.requestRender();
  }
  window.addEventListener('resize', () => { const old = fitDist(); resize(); if (Math.abs(cam.dist - old) < 0.05) cam.dist = fitDist(); });
  resize();
  cam.dist = fitDist();
  rot.yaw = HOME.yaw; rot.pitch = HOME.pitch;
  showOnly('cutaway');

  // ---------- render loop ----------
  let running = true;
  const keepers = new Set();     // animations that need every frame
  api.keepAnimating = (key, on) => { if (on) keepers.add(key); else keepers.delete(key); dirty = true; };
  api.frameHooks = new Set();
  const clock = new THREE.Clock();
  const perf = { n: 0, sum: 0 };
  let tAccum = 0;
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const rawDt = Math.min(clock.getDelta(), 0.25), dt = Math.min(rawDt, 0.05);
    const now = performance.now();
    // tweens
    for (const tw of [...tweens]) {
      const t = clamp((now - tw.t0) / tw.ms, 0, 1);
      tw.fn(t);
      if (t >= 1) { tweens.delete(tw); tw.done && tw.done(); }
    }
    // zoom keeps gliding a moment after a quick pinch, then eases to a stop
    if (zoomFling.on && pointers.size < 2) {
      const base = zoomBase();
      const nd = base + (cam.dist - base) * Math.exp(zoomFling.v * rawDt);
      const hit = zoomAt(nd, zoomFling.cx, zoomFling.cy);
      zoomFling.v *= Math.exp(-rawDt * 8);
      if (hit || Math.abs(zoomFling.v) < 0.05) zoomFling.on = false;
      dirty = true;
    }
    // inertia
    if (!gesture && (Math.abs(rot.vy) > 1e-5 || Math.abs(rot.vp) > 1e-5)) {
      rot.yaw += rot.vy; rot.pitch += rot.vp; clampRot();
      rot.vy *= 0.92; rot.vp *= 0.92; dirty = true;
    }
    // peel animation
    let peelMoving = false;
    peelSets.forEach(s => { if (Math.abs(s.p - s.target) > 1e-3) { s.p += Math.sign(s.target - s.p) * Math.min(Math.abs(s.target - s.p), rawDt / 1.6); peelMoving = true; } });
    if (peelMoving) { applyPeel(); dirty = true; }
    // card shift
    if (Math.abs(shift.x - shift.tx) > 0.5 || Math.abs(shift.y - shift.ty) > 0.5) {
      const k = 1 - Math.exp(-rawDt * 9);
      shift.x += (shift.tx - shift.x) * k; shift.y += (shift.ty - shift.y) * k; dirty = true;
    } else if (shift.x !== shift.tx || shift.y !== shift.ty) { shift.x = shift.tx; shift.y = shift.ty; dirty = true; }
    const animating = keepers.size > 0 || tweens.size > 0;
    // older iPads: if animations run slowly, draw fewer pixels
    if (animating && rawDt > 0) {
      perf.n++; perf.sum += rawDt;
      if (perf.n >= 90) {
        const avg = perf.sum / perf.n; perf.n = 0; perf.sum = 0;
        const pr = renderer.getPixelRatio();
        if (avg > 0.03 && pr > 1) { renderer.setPixelRatio(Math.max(1, pr - 0.5)); resize(); }
      }
    }
    if (animating) { tAccum += dt; shared.uTime.value = tAccum; }
    if (!dirty && !animating) return;
    dirty = false;
    // place camera
    composeRotation(qTmp); pivot.quaternion.copy(qTmp);
    camera.position.set(cam.px, cam.py, cam.dist);
    camera.lookAt(cam.px, cam.py, 0);
    // a card covers part of the screen: slide the picture over (without changing its size)
    camera.aspect = W / H;
    camera.setViewOffset(W, H, Math.round(shift.x), Math.round(shift.y), W, H);
    camera.updateProjectionMatrix();
    // things that depend on zoom
    const wpp = api.worldPerPx();
    for (const m of lineMats) m.uniforms.uWorldPerPx.value = wpp;
    atmo.material.uniforms.uStrength.value = api.view === 'slice' ? clamp((cam.dist - 1.4) / 1.5, 0, 1) * 0.9
      : api.view === 'peel' ? 1.1 * (1 - clamp(peelSets[0].p * 2, 0, 1)) : 1.1;
    atmo.visible = atmo.material.uniforms.uStrength.value > 0.01;
    for (const h of api.frameHooks) h(rawDt, now);
    renderer.render(scene, camera);
    api.afterRender && api.afterRender();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (!running) { running = true; clock.getDelta(); dirty = true; requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);

  // ---------- label anchors (where the layer names go) ----------
  // returns [{ id, world: Vector3, offset:[dx,dy] (px) }]
  api.labelAnchors = () => {
    const out = [];
    const adv = shared.uAdv.value > 0.5;
    if (api.view === 'slice') {
      const f = sliceFace, A = THREE.MathUtils.degToRad(135), B = THREE.MathUtils.degToRad(35);
      const at = (r, a) => api.faceToWorld(f, r * Math.cos(a), r * Math.sin(a));
      out.push({ id: 'crust', world: at((1 + R.crust) / 2, THREE.MathUtils.degToRad(112)), offset: [0, 0], inward: 64 });
      out.push({ id: 'mantle', world: at((R.crust + R.cmb) / 2 + 0.02, A), offset: [0, 0] });
      out.push({ id: 'outer', world: at((R.cmb + R.icb) / 2, A), offset: [0, 0] });
      out.push({ id: 'inner', world: at(0, 0), offset: [0, 0] });
      if (adv) {
        out.push({ id: 'lithosphere', world: at((R.crust + R.litho) / 2, THREE.MathUtils.degToRad(62)), offset: [0, 0], inward: 120 });
        out.push({ id: 'asthenosphere', world: at((R.litho + R.astheno) / 2, B), offset: [0, 0], inward: 130 });
      }
    } else if (api.view === 'cutaway') {
      const f = api.facing(wedgeA) > api.facing(wedgeB) ? wedgeA : wedgeB;
      if (api.facing(f) < 0.12) return out;
      // make "up" on the face match Earth's north
      const upL = new THREE.Vector3(0, 1, 0).applyQuaternion(f.quaternion);
      const sy = upL.y >= 0 ? 1 : -1;
      const at = (r, deg) => { const a = THREE.MathUtils.degToRad(deg); return api.faceToWorld(f, r * Math.cos(a), sy * r * Math.sin(a)); };
      out.push({ id: 'crust', world: at((1 + R.crust) / 2, 48), offset: [0, -50] });
      out.push({ id: 'mantle', world: at((R.crust + R.cmb) / 2, 14), offset: [0, 0] });
      out.push({ id: 'outer', world: at((R.cmb + R.icb) / 2, -8), offset: [0, 0] });
      out.push({ id: 'inner', world: at(R.icb * 0.4, 0), offset: [0, 0] });
      if (adv) {
        out.push({ id: 'lithosphere', world: at((R.crust + R.litho) / 2, -44), offset: [0, 0], inward: 120 });
        out.push({ id: 'asthenosphere', world: at((R.litho + R.astheno) / 2, -58), offset: [0, 0], inward: 120 });
      }
    } else if (api.view === 'peel') {
      const name = api.peel.names[api.peel.stage];
      const r = [1, R.crust, R.cmb, R.icb][api.peel.stage];
      out.push({ id: name, world: new THREE.Vector3(0, r * 0.62, r * 0.78).applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0)), offset: [0, 0], fixed: true });
    }
    return out;
  };

  api.wedgeInfo = () => api.wedge;
  return api;
}
