// 3D props. Each make*() returns an object with a Three group `g` and an update(t, S) that reads the tweened state.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { rng, PAL, HEX, cv, rr, txt, F, clamp01 } from './util.js';
import { DOT_X, DOT_Y } from './field.js';

const TAU = Math.PI * 2;
const col = (h) => new THREE.Color(h);
export const FLOOR_Y = -1.96;
const texOf = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
function setAlpha(g, a) {
  g.visible = a > 0.004;
  if (!g.visible) return;
  g.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) { if (m.userData.op === undefined) m.userData.op = m.opacity; m.transparent = true; m.opacity = m.userData.op * a; if (m.uniforms && m.uniforms.uA) m.uniforms.uA.value = a; } });
}
export { setAlpha };

// ---------------------------------------------------------------- shadow blob texture
let _blob;
function blobTex() {
  if (_blob) return _blob; const [c, x] = cv(256, 256); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(0.45, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  _blob = new THREE.CanvasTexture(c); return _blob;
}

let _glow;
function glowTex() {
  if (_glow) return _glow; const [c, x] = cv(256, 256); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  _glow = new THREE.CanvasTexture(c); return _glow;
}

// ---------------------------------------------------------------- the Dots
const SPH = new THREE.SphereGeometry(1, 64, 40);
const dark = () => new THREE.MeshPhysicalMaterial({ color: 0x12131c, roughness: 0.25, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.2 });
function accessory(i) {
  const g = new THREE.Group();
  if (i === 0) { // round glasses
    const m = dark(); const rim = new THREE.TorusGeometry(0.2, 0.034, 12, 40);
    [-1, 1].forEach((s) => { const r = new THREE.Mesh(rim, m); r.position.set(s * 0.3, 0.17, 1.0); g.add(r);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.19, 32), new THREE.MeshPhysicalMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.22, roughness: 0.05, clearcoat: 1 })); lens.position.set(s * 0.3, 0.17, 1.0); g.add(lens);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.62, 8), m); arm.rotation.x = Math.PI / 2; arm.position.set(s * 0.52, 0.19, 0.72); arm.rotation.z = s * 0.35; g.add(arm); });
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 8), m); br.rotation.z = Math.PI / 2; br.position.set(0, 0.2, 1.03); g.add(br);
  } else if (i === 1) { // bow tie
    const m = new THREE.MeshPhysicalMaterial({ color: 0xe0223d, roughness: 0.35, clearcoat: 0.8 }); const bt = new THREE.Group();
    [-1, 1].forEach((s) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.3, 20), m); c.rotation.z = s * Math.PI / 2; c.position.x = s * 0.15; c.scale.set(1, 1, 0.55); bt.add(c); });
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), m); bt.add(k); bt.position.set(0, -0.6, 0.82); bt.rotation.x = 0.62; g.add(bt);
  } else if (i === 2) { // knit beanie with pom
    const m = new THREE.MeshPhysicalMaterial({ color: 0xff6fb5, roughness: 0.75, sheen: 1, sheenColor: 0xffffff });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.05, 40, 20, 0, TAU, 0, Math.PI * 0.34), m); g.add(cap);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.1, 12, 48), new THREE.MeshPhysicalMaterial({ color: 0xff4f9a, roughness: 0.8, sheen: 1 })); band.rotation.x = Math.PI / 2; band.position.y = 0.5; g.add(band);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.9, sheen: 1 })); pom.position.y = 1.14; g.add(pom); g.rotation.z = -0.12;
  } else if (i === 3) { // top hat
    const m = dark(); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.05, 40), m); brim.position.y = 0.86; g.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.66, 40), m); crown.position.y = 1.2; g.add(crown);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.447, 0.447, 0.13, 40), new THREE.MeshPhysicalMaterial({ color: 0xffc53d, roughness: 0.3, metalness: 0.6 })); band.position.y = 0.96; g.add(band); g.rotation.z = 0.14;
  } else { // party hat
    const [c, x] = cv(256, 256); x.fillStyle = '#ffc53d'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#ff5a4e'; for (let k = 0; k < 8; k++) { x.save(); x.translate(128, 128); x.rotate(k * 0.4); x.fillRect(-300, -12 + k * 32 - 128, 600, 16); x.restore(); }
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.95, 40, 1, true), new THREE.MeshPhysicalMaterial({ map: texOf(c), roughness: 0.4, side: THREE.DoubleSide, clearcoat: 0.6 })); cone.position.y = 1.28; g.add(cone);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0x2ee6a6, roughness: 0.6 })); pom.position.y = 1.78; g.add(pom); g.rotation.z = -0.22;
  }
  return g;
}
export function makeDots() {
  const list = PAL.slice(0, 5).map((c, i) => {
    const g = new THREE.Group(); const rig = new THREE.Group(); g.add(rig);
    const body = new THREE.Mesh(SPH, new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.12, emissive: c, emissiveIntensity: 0.05 }));
    rig.add(body);
    const face = new THREE.Group(); rig.add(face);
    const eyeM = new THREE.MeshPhysicalMaterial({ color: 0x0a0b12, roughness: 0.12, clearcoat: 1 }); const eyes = [];
    [-1, 1].forEach((s) => { const e = new THREE.Group(); e.position.set(s * 0.3, 0.16, 0.925); const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), eyeM); ball.scale.set(0.105, 0.17, 0.07); e.add(ball);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(0.03, 0.06, 0.06); e.add(hl); face.add(e); eyes.push(e); });
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 24, Math.PI), eyeM); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.08, 0.985); face.add(mouth);
    [-1, 1].forEach((s) => { const ck = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), new THREE.MeshBasicMaterial({ color: 0xff7a9a, transparent: true, opacity: 0.4, depthWrite: false })); ck.position.set(s * 0.52, -0.02, 0.86); ck.lookAt(s * 1.2, -0.04, 1.9); face.add(ck); });
    const acc = accessory(i); rig.add(acc);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; g.add(shadow);
    return { g, rig, body, eyes, acc, shadow, mouth, i };
  });
  const g = new THREE.Group(); list.forEach((d) => g.add(d.g));
  const grey = new THREE.Color(0x3a3d4a);
  return {
    g, list,
    update(t, S) {
      list.forEach((d, i) => {
        const s = S.dots[i]; const vis = s.s > 0.003; d.g.visible = vis; if (!vis) return;
        const ph = t * s.hf + i * 1.37; const hop = Math.abs(Math.sin(ph)) * s.hop; const land = 1 - Math.min(1, Math.abs(Math.sin(ph)) * 4);
        const sq = s.sq + land * s.hop * 0.35;
        d.g.position.set(s.x, s.y + hop, s.z); d.g.scale.setScalar(s.s);
        d.rig.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5); d.rig.position.y = -sq * 0.9;
        d.rig.rotation.set(s.rx + Math.sin(t * 1.3 + i) * 0.04, s.ry + Math.sin(t * 0.9 + i * 2) * 0.12, Math.sin(t * 1.1 + i) * 0.05);
        const blink = (Math.sin(t * 1.9 + i * 2.1) > 0.985 || Math.sin(t * 0.73 + i) > 0.992) ? 0.1 : 1;
        const open = Math.max(0.08, s.eyes) * blink; d.eyes.forEach((e) => { e.scale.set(1, open, 1); });
        d.acc.visible = s.acc > 0.003; d.acc.scale.setScalar(Math.max(0.0001, s.acc)); d.acc.position.y = (1 - clamp01(s.acc)) * 1.4;
        d.body.material.color.set(PAL[i]).lerp(grey, s.dim); d.body.material.emissiveIntensity = 0.05 + s.glow * 0.6;
        d.shadow.position.y = (FLOOR_Y + 0.01 - s.y - hop) / Math.max(0.01, s.s); d.shadow.material.opacity = 0.9 * (1 - Math.min(0.7, hop * 0.5)) * s.shadow; d.shadow.scale.setScalar(1 - Math.min(0.5, hop * 0.25));
      });
    },
  };
}

// ---------------------------------------------------------------- screen textures
function browserChrome(x, W, tabs, active, url) {
  rr(x, 0, 0, W, 64, 0, '#161a2b'); ['#ff5f57', '#febc2e', '#28c840'].forEach((c, k) => { x.fillStyle = c; x.beginPath(); x.arc(30 + k * 26, 32, 8, 0, TAU); x.fill(); });
  tabs.forEach((t, k) => { const X = 120 + k * 210; rr(x, X, 12, 200, 52, 12, k === active ? '#0e1120' : '#1d2236'); txt(x, t, X + 22, 46, F.g(600, 22), k === active ? '#f4f6ff' : '#8e97b8'); });
  rr(x, 0, 64, W, 56, 0, '#0e1120'); rr(x, 24, 74, W - 360, 36, 18, '#1a1e31'); txt(x, url, 48, 99, F.m(500, 19), '#8e97b8');
  rr(x, W - 316, 74, 292, 36, 18, 'rgba(46,230,166,.14)', '#2ee6a6', 2); x.fillStyle = '#2ee6a6'; x.beginPath(); x.arc(W - 294, 92, 7, 0, TAU); x.fill(); txt(x, 'DOT · ONLINE 24/7', W - 278, 99, F.m(700, 17), '#2ee6a6');
}
export function screenTextures() {
  const W = 1280, H = 784; const out = {};
  // browser states
  const tabsets = [['Inbox'], ['Inbox', 'Calendar'], ['Inbox', 'Calendar', 'Vendors']];
  tabsets.forEach((tabs, k) => {
    const [c, x] = cv(W, H); rr(x, 0, 0, W, H, 0, '#0b0d18'); browserChrome(x, W, tabs, k, ['dot://inbox', 'dot://calendar', 'dot://vendors/renewals'][k]);
    if (k === 0) { for (let i = 0; i < 7; i++) { const Y = 150 + i * 86; rr(x, 32, Y, W - 64, 72, 14, i === 1 ? '#1a2140' : '#11152a'); x.fillStyle = HEX[i % 5]; x.beginPath(); x.arc(72, Y + 36, 20, 0, TAU); x.fill(); rr(x, 110, Y + 18, 180 + (i * 53) % 140, 14, 7, '#c9d0ee'); rr(x, 110, Y + 42, 420 + (i * 97) % 300, 12, 6, '#4a5378'); rr(x, W - 170, Y + 26, 110, 20, 10, i < 2 ? 'rgba(255,197,61,.35)' : '#1c2240'); } }
    if (k === 1) { const days = ['MON', 'TUE', 'WED', 'THU', 'FRI']; days.forEach((d, i) => { txt(x, d, 90 + i * 234, 168, F.m(700, 20), '#8e97b8'); x.strokeStyle = '#1c2240'; x.lineWidth = 2; x.strokeRect(40 + i * 234, 186, 226, 570); });
      [[0, 0, 2, 0], [1, 1, 3, 3], [2, 2, 1, 1], [3, 0.5, 2.5, 4], [4, 3, 2, 2], [1, 4.5, 1.5, 0], [3, 5, 1.5, 3]].forEach(([d, s, l, c]) => rr(x, 48 + d * 234, 196 + s * 100, 210, l * 90, 12, HEX[c] + 'cc')); }
    if (k === 2) { txt(x, 'Vendor renewals', 40, 186, F.g(700, 38), '#f4f6ff'); ['Cloud hosting', 'Design suite', 'Office leases', 'Data provider', 'Travel agency'].forEach((v, i) => { const Y = 220 + i * 100; rr(x, 32, Y, W - 64, 84, 14, '#11152a'); txt(x, v, 64, Y + 52, F.g(600, 28), '#dfe4fb'); rr(x, 520, Y + 32, 300, 18, 9, '#2a3150'); rr(x, 520, Y + 32, 90 + i * 40, 18, 9, HEX[i]);
      const st = ['NEGOTIATING', 'RENEWED', 'REVIEW', 'NEGOTIATING', 'QUEUED'][i]; const sc = ['#ffc53d', '#2ee6a6', '#3da9fc', '#ffc53d', '#8e97b8'][i]; rr(x, W - 290, Y + 22, 232, 40, 20, sc + '26', sc, 2); txt(x, st, W - 174, Y + 50, F.m(700, 18), sc, 'center'); }); }
    out['browser' + k] = texOf(c);
  });
  // app states for computer use
  for (let k = 0; k < 5; k++) {
    const [c, x] = cv(W, H); rr(x, 0, 0, W, H, 0, '#0b0d18'); browserChrome(x, W, ['Procurement'], 0, k < 4 ? 'app.example.com/requests/new' : 'app.example.com/requests/1042');
    rr(x, 0, 120, 250, H - 120, 0, '#10132a'); ['Dashboard', 'Requests', 'Vendors', 'Reports'].forEach((s, i) => { rr(x, 18, 150 + i * 62, 214, 48, 12, i === (k < 4 ? 1 : 0) ? '#1f2750' : null); txt(x, s, 40, 182 + i * 62, F.g(600, 23), i === (k < 4 ? 1 : 0) ? '#f4f6ff' : '#8e97b8'); });
    if (k < 4) {
      txt(x, 'New request', 300, 200, F.g(700, 40), '#f4f6ff');
      txt(x, 'Title', 300, 262, F.m(700, 18), '#8e97b8'); rr(x, 300, 276, 640, 64, 14, '#12162c', k >= 1 ? '#3da9fc' : '#2a3150', k >= 1 ? 3 : 2);
      const typed = ['', '', 'Q4 vendor re', 'Q4 vendor renewal'][k]; txt(x, typed + (k >= 1 && k < 3 ? '|' : ''), 322, 318, F.g(500, 28), '#f4f6ff');
      txt(x, 'Amount', 300, 392, F.m(700, 18), '#8e97b8'); rr(x, 300, 406, 300, 64, 14, '#12162c', '#2a3150'); txt(x, k >= 3 ? 'Auto-filled' : '', 322, 448, F.g(500, 26), '#8e97b8');
      rr(x, 300, 520, 220, 70, 16, k >= 3 ? '#2ee6a6' : '#3da9fc'); txt(x, 'Submit', 410, 565, F.g(700, 28), '#05060c', 'center');
    } else {
      txt(x, 'Request #1042', 300, 200, F.g(700, 40), '#f4f6ff'); rr(x, 700, 166, 190, 44, 22, 'rgba(46,230,166,.15)', '#2ee6a6', 2); txt(x, '✓ SUBMITTED', 795, 196, F.m(700, 17), '#2ee6a6', 'center');
      for (let i = 0; i < 9; i++) { const h = 60 + ((i * 71) % 190); rr(x, 320 + i * 96, 700 - h, 62, h, 10, HEX[i % 5]); }
      rr(x, 300, 250, 900, 16, 8, '#2a3150'); rr(x, 300, 282, 620, 16, 8, '#2a3150');
    }
    out['app' + k] = texOf(c);
  }
  // phone (codex cloud runtime)
  { const [c, x] = cv(540, 1100); rr(x, 0, 0, 540, 1100, 0, '#0b0d18'); txt(x, '9:41', 40, 60, F.g(700, 26), '#f4f6ff'); txt(x, 'Codex', 40, 150, F.g(700, 50), '#f4f6ff'); rr(x, 40, 176, 250, 42, 21, 'rgba(46,230,166,.15)', '#2ee6a6', 2); txt(x, '● RUNTIME LIVE', 165, 205, F.m(700, 17), '#2ee6a6', 'center');
    ['refactor auth flow', 'fix flaky test', 'bump deps', 'draft release notes'].forEach((s, i) => { const Y = 260 + i * 150; rr(x, 30, Y, 480, 130, 22, '#141830'); txt(x, s, 56, Y + 52, F.g(600, 27), '#dfe4fb'); rr(x, 56, Y + 80, 400, 14, 7, '#2a3150'); rr(x, 56, Y + 80, [380, 250, 400, 120][i], 14, 7, HEX[i]); });
    rr(x, 30, 900, 480, 120, 60, '#1a1f3a'); txt(x, '🎙  steer by voice', 270, 972, F.g(600, 28), '#9aa3c4', 'center');
    out.phone = texOf(c); }
  return out;
}

// ---------------------------------------------------------------- cloud computer
function cloudPuff(scale = 1) {
  const g = new THREE.Group(); const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.55, sheen: 1, sheenColor: 0xbfe9ff, emissive: 0x8fb8ff, emissiveIntensity: 0.12 });
  [[0, 0, 0, 0.6], [-0.62, -0.14, 0, 0.44], [0.62, -0.12, 0, 0.47], [0.28, 0.3, -0.1, 0.46], [-0.3, 0.22, 0.05, 0.4]].forEach(([x, y, z, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), m); s.position.set(x, y, z); g.add(s); });
  g.scale.setScalar(scale); return g;
}
export function makeMonitor(tx) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new RoundedBoxGeometry(5.3, 3.36, 0.2, 4, 0.12), new THREE.MeshPhysicalMaterial({ color: 0x1c2033, roughness: 0.3, metalness: 0.55, clearcoat: 0.7 })); g.add(frame);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 3.06), new THREE.MeshBasicMaterial({ map: tx.browser0, toneMapped: false })); screen.position.z = 0.105; g.add(screen);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.5), new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x3da9fc, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); glow.position.z = -0.3; g.add(glow);
  const cloud = cloudPuff(0.9); cloud.position.set(2.5, 2.0, 0.3); g.add(cloud);
  const keys = Object.keys(tx);
  return { g, cloud, update(t, S) {
    const s = S.mon; setAlpha(g, s.a); if (!g.visible) return;
    g.position.set(s.x, s.y + Math.sin(t * 0.8) * 0.06, s.z); g.rotation.set(0, s.ry, 0); g.scale.setScalar(s.s);
    const k = s.set + Math.floor(s.k + 0.001); const name = (s.set === 0 ? 'browser' : 'app') + Math.floor(s.k + 0.001); if (screen.material.map !== tx[name] && tx[name]) { screen.material.map = tx[name]; screen.material.needsUpdate = true; }
    cloud.visible = S.mon.cloud > 0.003; cloud.scale.setScalar(0.9 * Math.max(0.001, S.mon.cloud)); cloud.position.y = 2.1 + Math.sin(t * 1.2) * 0.08; void k; void keys;
  } };
}

// ---------------------------------------------------------------- 24/7 clock ring
export function makeClock() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.035, 12, 120), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); g.add(ring);
  const ticks = new THREE.Group(); for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, i % 6 === 0 ? 0.26 : 0.12, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); const a = i / 24 * TAU; m.position.set(Math.cos(a) * 1.95, Math.sin(a) * 1.95, 0); m.rotation.z = a + Math.PI / 2; ticks.add(m); } g.add(ticks);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffc53d })); const moon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), new THREE.MeshBasicMaterial({ color: 0xbfe9ff })); g.add(sun, moon);
  return { g, update(t, S) { const s = S.clock; setAlpha(g, s.a); if (!g.visible) return; g.position.set(s.x, s.y, s.z); g.scale.setScalar(0.6 + 0.4 * s.a); const a = s.spin * TAU + t * 0.4; sun.position.set(Math.cos(a) * 1.75, Math.sin(a) * 1.75, 0.05); moon.position.set(Math.cos(a + Math.PI) * 1.75, Math.sin(a + Math.PI) * 1.75, 0.05); ticks.rotation.z = -t * 0.05; } };
}

// ---------------------------------------------------------------- 4,000+ apps orbit
export function makeApps() {
  const rings = [[2.3, 44, 0.35, 0.2, 0.5], [3.3, 70, -0.25, -0.4, -0.35], [4.3, 96, 0.55, 0.15, 0.25]]; const n = rings.reduce((a, r) => a + r[1], 0);
  const mesh = new THREE.InstancedMesh(new RoundedBoxGeometry(0.4, 0.4, 0.1, 2, 0.08), new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.8, emissive: 0xffffff, emissiveIntensity: 0.05 }), n);
  const r = rng(4); const meta = []; const c = new THREE.Color();
  rings.forEach(([R, cnt, tx, tz, sp], ri) => { for (let k = 0; k < cnt; k++) { meta.push({ R, a: k / cnt * TAU + r() * 0.05, tx, tz, sp, d: r() * 0.5, ri }); c.setHSL(r(), 0.72, 0.58); mesh.setColorAt(meta.length - 1, c); } });
  mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false;
  const g = new THREE.Group(); g.add(mesh); const o = new THREE.Object3D(); const e = new THREE.Euler(); const v = new THREE.Vector3();
  return { g, update(t, S) {
    const s = S.apps; setAlpha(g, s.a); if (!g.visible) return; g.position.set(s.x, s.y, s.z);
    meta.forEach((m, i) => { const p = clamp01((s.e * 1.5 - m.d)); const ep = 1 - Math.pow(1 - p, 3); const a = m.a + t * m.sp * 0.5 + s.spin * m.sp;
      v.set(Math.cos(a) * m.R * ep, 0, Math.sin(a) * m.R * ep); e.set(m.tx, 0, m.tz); v.applyEuler(e); o.position.copy(v); o.rotation.set(t * 0.7 + i, a, t * 0.5); o.scale.setScalar(Math.max(0.0001, ep)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); });
    mesh.instanceMatrix.needsUpdate = true;
  } };
}

// ---------------------------------------------------------------- Astra crystal (faceted, can shatter)
export function makeCrystal(U) {
  const geo = new THREE.IcosahedronGeometry(1.5, 1).toNonIndexed(); const P = geo.attributes.position; const n = P.count; const r = rng(3);
  const ctr = new Float32Array(n * 3), rnd = new Float32Array(n * 3), bar = new Float32Array(n * 3); const v = new THREE.Vector3();
  for (let t = 0; t < n; t += 3) { const c = new THREE.Vector3(); for (let k = 0; k < 3; k++) c.add(v.fromBufferAttribute(P, t + k)); c.multiplyScalar(1 / 3); const q = [r(), r(), r()];
    for (let k = 0; k < 3; k++) { ctr.set([c.x, c.y, c.z], (t + k) * 3); rnd.set(q, (t + k) * 3); bar.set([k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0], (t + k) * 3); } }
  geo.setAttribute('aC', new THREE.BufferAttribute(ctr, 3)); geo.setAttribute('aR', new THREE.BufferAttribute(rnd, 3)); geo.setAttribute('aB', new THREE.BufferAttribute(bar, 3));
  const m = new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, uniforms: { ...U, uEx: { value: 0 }, uDim: { value: 0 }, uA: { value: 1 }, uRed: { value: 0 } },
    vertexShader: `attribute vec3 aC,aR,aB; uniform float uEx,uT; varying vec3 vB,vN,vV; varying float vR;
      mat3 rotv(vec3 ax,float a){ ax=normalize(ax); float s=sin(a),c=cos(a),o=1.0-c; return mat3(o*ax.x*ax.x+c,o*ax.x*ax.y-ax.z*s,o*ax.z*ax.x+ax.y*s, o*ax.x*ax.y+ax.z*s,o*ax.y*ax.y+c,o*ax.y*ax.z-ax.x*s, o*ax.z*ax.x-ax.y*s,o*ax.y*ax.z+ax.x*s,o*ax.z*ax.z+c); }
      void main(){ vB=aB; vR=aR.x; vec3 n=normalize(aC); float ex=uEx*uEx; vec3 p=aC+rotv(aR-0.5,ex*8.0*(aR.y+0.2))*(position-aC); p+=n*ex*(2.5+aR.x*8.0)+vec3(0.0,-ex*3.0*aR.z,0.0);
        vN=normalize(normalMatrix*n); vec4 mv=modelViewMatrix*vec4(p,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uDim,uA,uEx,uT,uRed; varying vec3 vB,vN,vV; varying float vR;
      void main(){ vec3 n=normalize(vN); float f=pow(1.0-abs(dot(n,normalize(vV))),2.0); float l=max(dot(n,normalize(vec3(-0.4,0.8,0.6))),0.0);
        vec3 irid=0.5+0.5*cos(6.2831*(vec3(0.0,0.33,0.67)+vR*0.5+uT*0.06)); vec3 base=mix(vec3(0.04,0.06,0.14),irid*vec3(0.5,0.7,1.0),0.5+0.5*l);
        vec3 c=base*(0.35+0.6*l)+vec3(0.35,0.7,1.0)*f*0.9; float e=min(vB.x,min(vB.y,vB.z)); float line=1.0-smoothstep(0.0,fwidth(e)*1.6+0.001,e); c+=line*vec3(0.7,0.9,1.0)*0.7;
        vec3 dead=vec3(0.14,0.15,0.18)*(0.5+l)+line*vec3(0.8,0.1,0.15)*0.8; c=mix(c,dead,uDim); c=mix(c,c*vec3(1.4,0.35,0.4),uRed);
        gl_FragColor=vec4(c,uA*(1.0-uEx*0.8)); }` });
  const mesh = new THREE.Mesh(geo, m); const g = new THREE.Group(); g.add(mesh);
  const halo = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.06, 96), new THREE.MeshBasicMaterial({ color: 0x9fd6ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); g.add(halo);
  return { g, update(t, S) { const s = S.crystal; g.visible = s.a > 0.003; if (!g.visible) return; g.position.set(s.x, s.y + Math.sin(t) * 0.08, s.z); g.scale.setScalar(s.s);
    mesh.rotation.set(Math.sin(t * 0.5) * 0.3, t * 0.45, 0); m.uniforms.uEx.value = s.ex; m.uniforms.uDim.value = s.dim; m.uniforms.uA.value = s.a; m.uniforms.uRed.value = s.red;
    halo.material.opacity = 0.5 * s.a * (1 - s.ex); halo.rotation.x = 1.2; halo.rotation.z = t * 0.3; } };
}

// ---------------------------------------------------------------- Sol: the sun
export function makeSun(U) {
  const noise = `
    vec3 h3(vec3 p){ p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))); return -1.0+2.0*fract(sin(p)*43758.5453); }
    float n3(vec3 p){ vec3 i=floor(p),f=fract(p); vec3 u=f*f*(3.0-2.0*f);
      return mix(mix(mix(dot(h3(i),f),dot(h3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),mix(dot(h3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(h3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
                 mix(mix(dot(h3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(h3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),mix(dot(h3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(h3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z); }
    float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<5;i++){ s+=a*n3(p); p*=2.03; a*=0.5; } return s; }`;
  const m = new THREE.ShaderMaterial({ uniforms: { ...U, uA: { value: 1 }, uHeat: { value: 1 } },
    vertexShader: `varying vec3 vP,vN,vV; void main(){ vP=position; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uT,uA,uHeat; varying vec3 vP,vN,vV; ${noise}
      void main(){ vec3 p=normalize(vP); float n=fbm(p*2.6+vec3(0.0,uT*0.12,uT*0.05)); float n2=fbm(p*7.0-vec3(uT*0.2));
        float g=clamp(0.5+n*1.1+n2*0.35,0.0,1.0); vec3 c=mix(vec3(0.9,0.18,0.02),vec3(1.0,0.62,0.12),g); c=mix(c,vec3(1.0,0.95,0.7),smoothstep(0.72,1.0,g));
        float mu=max(dot(normalize(vN),normalize(vV)),0.0); c*=0.55+0.6*pow(mu,0.4); c+=vec3(1.0,0.45,0.1)*pow(1.0-mu,2.5)*1.3;
        gl_FragColor=vec4(c*1.35*uHeat,uA); }` });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(2.2, 96, 64), m);
  const cm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...U, uA: { value: 1 }, uFlare: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uT,uA,uFlare; varying vec2 vUv; ${noise}
      void main(){ vec2 q=(vUv-0.5)*2.0; float r=length(q); float a=atan(q.y,q.x); float rays=0.55+0.45*n3(vec3(cos(a)*3.0,sin(a)*3.0,uT*0.3));
        float edge=smoothstep(1.0,0.62,r); float cor=exp(-(r-0.36)*5.5)*step(0.33,r)*rays*edge; float glow=exp(-r*r*6.0)*0.6*edge; float fl=uFlare*(exp(-abs(q.y)*60.0)*exp(-abs(q.x)*1.2)*smoothstep(1.0,0.8,abs(q.x))+exp(-r*r*10.0));
        vec3 c=vec3(1.0,0.5,0.15)*(cor*0.9+glow*0.6)+vec3(1.0,0.85,0.6)*fl*1.6; gl_FragColor=vec4(c*uA,1.0); }` });
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), cm);
  const g = new THREE.Group(); g.add(corona, sphere);
  return { g, update(t, S, cam) { const s = S.sun; g.visible = s.a > 0.003; if (!g.visible) return; g.position.set(s.x, s.y, s.z); g.scale.setScalar(Math.max(0.001, s.s));
    sphere.rotation.y = t * 0.08; m.uniforms.uA.value = 1; m.uniforms.uHeat.value = 0.4 + 0.6 * s.a; corona.quaternion.copy(cam.quaternion); cm.uniforms.uA.value = s.a; cm.uniforms.uFlare.value = s.flare; } };
}

// ---------------------------------------------------------------- coins (price comparison)
export function makeCoins() {
  const geo = new THREE.CylinderGeometry(0.55, 0.55, 0.13, 48); const mat = new THREE.MeshPhysicalMaterial({ color: 0xffc53d, metalness: 1, roughness: 0.22, clearcoat: 0.6 });
  const rimG = new THREE.TorusGeometry(0.47, 0.025, 8, 48);
  const mk = () => { const c = new THREE.Group(); c.add(new THREE.Mesh(geo, mat)); const rim = new THREE.Mesh(rimG, mat); rim.rotation.x = Math.PI / 2; rim.position.y = 0.07; c.add(rim); return c; };
  const A = [...Array(10)].map(mk), B = [...Array(2)].map(mk); const g = new THREE.Group(); A.forEach((c) => g.add(c)); B.forEach((c) => g.add(c));
  const place = (arr, x, prog, t, base) => arr.forEach((c, i) => { const p = clamp01(prog - i * 0.7) ; const land = base + 0.07 + i * 0.14; const b = p < 1 ? (1 - p) * (1 - p) * 5 : 0; c.visible = p > 0; c.position.set(x + Math.sin(i * 2.3) * 0.04, land + b, 0.6 + Math.cos(i * 1.7) * 0.04); c.rotation.set(0, i * 0.7 + t * 0.2, (1 - Math.min(1, p)) * 0.6); });
  return { g, update(t, S) { const s = S.coins; g.visible = s.a > 0.003; if (!g.visible) return; setAlpha(g, s.a); place(A, s.ax, s.astra, t, s.y); place(B, s.sx, s.sol, t, s.y); } };
}

// ---------------------------------------------------------------- warp streaks (Ultrafast)
export function makeWarp() {
  const N = 1800, r = rng(8); const pos = new Float32Array(N * 2 * 3), sd = new Float32Array(N * 2 * 4), end = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { const q = [r(), r(), r(), r()]; for (let k = 0; k < 2; k++) { sd.set(q, (i * 2 + k) * 4); end[i * 2 + k] = k; } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sd, 4)); g.setAttribute('aE', new THREE.BufferAttribute(end, 1));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uD: { value: 0 }, uLen: { value: 1 }, uA: { value: 0 } },
    vertexShader: `attribute vec4 aS; attribute float aE; uniform float uD,uLen; varying float vA; varying vec3 vC;
      void main(){ float ang=aS.z*6.2832; float rad=1.6+pow(aS.y,0.7)*16.0; float z=-230.0+mod(aS.x*235.0+uD*(0.7+aS.w*0.6),235.0);
        float len=uLen*(1.0+aS.w*2.0); vec3 p=vec3(cos(ang)*rad,sin(ang)*rad,z-aE*len);
        vA=smoothstep(-230.0,-150.0,z)*(1.0-smoothstep(-2.0,4.0,z)); vC=mix(vec3(0.6,0.85,1.0),aS.w>0.8?vec3(1.0,0.45,0.75):vec3(1.0),step(0.5,aS.y));
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `uniform float uA; varying float vA; varying vec3 vC; void main(){ gl_FragColor=vec4(vC*1.6,vA*uA); }` });
  const lines = new THREE.LineSegments(g, m); lines.frustumCulled = false; const grp = new THREE.Group(); grp.add(lines);
  return { g: grp, update(t, S, cam) { const s = S.warp; grp.visible = s.a > 0.003; if (!grp.visible) return; grp.position.copy(cam.position); grp.quaternion.copy(cam.quaternion); m.uniforms.uD.value = s.d; m.uniforms.uLen.value = s.len; m.uniforms.uA.value = s.a; } };
}

// ---------------------------------------------------------------- wafer-scale chip
export function makeWafer() {
  const [c, x] = cv(1024, 1024); const gr = x.createLinearGradient(0, 0, 1024, 1024); gr.addColorStop(0, '#1b1f2e'); gr.addColorStop(1, '#0c0e17'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) { const X = 40 + i * 79, Y = 40 + j * 79; const gg = x.createLinearGradient(X, Y, X + 70, Y + 70); gg.addColorStop(0, '#7b8ab8'); gg.addColorStop(0.5, '#c9d6ff'); gg.addColorStop(1, '#5a6690'); x.fillStyle = gg; x.fillRect(X, Y, 70, 70); x.fillStyle = 'rgba(10,12,20,.45)'; for (let k = 0; k < 5; k++) x.fillRect(X + 8, Y + 8 + k * 12, 54, 4); }
  const top = texOf(c);
  const mat = [0, 0, 1, 0, 0, 0].map((k) => (k ? new THREE.MeshPhysicalMaterial({ map: top, metalness: 0.7, roughness: 0.25, clearcoat: 1 }) : new THREE.MeshPhysicalMaterial({ color: 0x8a95b8, metalness: 0.9, roughness: 0.3 })));
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 4.6), mat); const g = new THREE.Group(); g.add(mesh);
  return { g, update(t, S) { const s = S.wafer; setAlpha(g, s.a); if (!g.visible) return; g.position.set(s.x, s.y, s.z); g.rotation.set(s.rx, s.ry + t * 0.25, s.rz); } };
}

// ---------------------------------------------------------------- Pro 500 card
export function makeCard() {
  const [c, x] = cv(1024, 646); const gr = x.createLinearGradient(0, 0, 1024, 646); gr.addColorStop(0, '#2a2f45'); gr.addColorStop(0.5, '#141727'); gr.addColorStop(1, '#343a57'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 646);
  x.globalAlpha = 0.08; for (let i = 0; i < 60; i++) { x.fillStyle = '#fff'; x.fillRect(0, i * 11, 1024, 1); } x.globalAlpha = 1;
  rr(x, 70, 150, 120, 92, 14, '#d9b45a'); x.strokeStyle = '#8f7433'; x.lineWidth = 3; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(70, 180 + k * 22); x.lineTo(190, 180 + k * 22); x.stroke(); }
  txt(x, 'PRO', 70, 420, F.d(900, 150), '#f4f6ff'); txt(x, '500', 440, 420, F.d(900, 150), '#ffc53d');
  txt(x, 'ULTRAFAST INCLUDED · 25× PLUS', 74, 500, F.m(700, 30), '#bfc7e6');
  HEX.slice(0, 5).forEach((h, i) => { x.fillStyle = h; x.beginPath(); x.arc(760 + i * 46, 580, 17, 0, TAU); x.fill(); }); txt(x, '$500 / MONTH', 74, 590, F.m(700, 30), '#8e97b8');
  const face = new THREE.MeshPhysicalMaterial({ map: texOf(c), metalness: 0.55, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 }); const side = new THREE.MeshPhysicalMaterial({ color: 0x9aa4c8, metalness: 1, roughness: 0.25 });
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(4.0, 2.52, 0.07, 4, 0.03), [side, side, side, side, face, side]);
  const g = new THREE.Group(); g.add(mesh);
  return { g, update(t, S) { const s = S.card; setAlpha(g, s.a); if (!g.visible) return; g.position.set(s.x, s.y + Math.sin(t * 1.1) * 0.08, s.z); g.rotation.set(s.rx + Math.sin(t * 0.7) * 0.05, s.ry, s.rz); g.scale.setScalar(s.s); } };
}

// ---------------------------------------------------------------- cursor + click ripple
export function makeCursor() {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, -1.0); sh.lineTo(0.26, -0.76); sh.lineTo(0.44, -1.14); sh.lineTo(0.6, -1.06); sh.lineTo(0.42, -0.7); sh.lineTo(0.74, -0.7); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  const arrow = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 1 }));
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: 0x05060c })); arrow.add(edge);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 48), new THREE.MeshBasicMaterial({ color: 0x3da9fc, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  const g = new THREE.Group(); g.add(arrow); const rg = new THREE.Group(); rg.add(ripple);
  return { g, rg, update(t, S) { const s = S.cur; g.visible = s.a > 0.003; rg.visible = s.rip > 0.003 && s.rip < 0.999; if (g.visible) { g.position.set(s.x, s.y, s.z); g.scale.setScalar(0.55 * (1 - s.press * 0.18)); g.rotation.set(0, 0, 0.1); }
    rg.position.set(s.x, s.y, s.z + 0.01); ripple.scale.setScalar(1 + s.rip * 4); ripple.material.opacity = (1 - s.rip) * 0.9; } };
}

// ---------------------------------------------------------------- multi-agent graph + AWS box + cloud
export function makeGraph() {
  const g = new THREE.Group(); const nodes = []; const P = [[-3.6, 1.8, 0.8], [3.8, 1.9, 0.6], [-3.4, -1.7, 1.0], [3.7, -1.6, 0.9]];
  P.forEach((p, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), new THREE.MeshPhysicalMaterial({ color: PAL[(i + 1) % 5], roughness: 0.3, clearcoat: 1, emissive: PAL[(i + 1) % 5], emissiveIntensity: 0.15 })); m.position.set(...p); g.add(m); nodes.push(m); });
  const lp = []; P.forEach((p) => lp.push(0, 0, 0.2, ...p)); P.forEach((p, i) => { const q = P[(i + 1) % 4]; if (i % 2 === 0) lp.push(...p, ...P[(i + 2) % 4]); void q; });
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x9bd4ff, transparent: true, opacity: 0.55 })); g.add(lines);
  return { g, update(t, S) { const s = S.graph; setAlpha(g, s.a); if (!g.visible) return; g.position.set(s.x, s.y, s.z); nodes.forEach((n, i) => { const k = clamp01(s.a * 1.6 - i * 0.15); n.scale.setScalar(Math.max(0.001, k)); n.position.y = P[i][1] + Math.sin(t * 2 + i) * 0.1; }); } };
}
export function makeAws() {
  const geo = new THREE.BoxGeometry(12.4, 6.6, 4.4); const g = new THREE.Group();
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xff9900, transparent: true })); g.add(edges);
  const faces = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff9900, transparent: true, opacity: 0.05, side: THREE.BackSide, depthWrite: false })); g.add(faces);
  return { g, update(t, S) { const s = S.aws; setAlpha(g, s.a); if (!g.visible) return; g.position.set(s.x, s.y, s.z); g.scale.setScalar(s.s); } };
}
export function makeCloud() { const c = cloudPuff(1.2); const g = new THREE.Group(); g.add(c); return { g, update(t, S) { const s = S.cloud; g.visible = s.a > 0.003; if (!g.visible) return; g.position.set(s.x, s.y + Math.sin(t * 1.3) * 0.1, s.z); g.scale.setScalar(Math.max(0.001, s.a)); } }; }

// ---------------------------------------------------------------- Luna (the small model)
export function makeLuna() {
  const m = new THREE.ShaderMaterial({ uniforms: { uA: { value: 1 } },
    vertexShader: `varying vec3 vP,vN; void main(){ vP=position; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vP,vN; float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }
      void main(){ vec3 p=normalize(vP); float cr=0.0; for(int i=0;i<14;i++){ vec3 c=normalize(vec3(h(vec3(float(i),1.0,2.0))-0.5,h(vec3(float(i),3.0,1.0))-0.5,h(vec3(float(i),5.0,7.0))-0.5)); float r=0.12+0.2*h(vec3(float(i),9.0,4.0)); float d=distance(p,c); cr+=smoothstep(r,r*0.7,d)*0.35-smoothstep(r*1.1,r,d)*0.12; }
        float l=max(dot(normalize(vN),normalize(vec3(-0.5,0.6,0.7))),0.0); vec3 c=vec3(0.78,0.8,0.86)*(0.18+0.95*l)*(1.0-cr*0.6); c+=vec3(0.6,0.75,1.0)*pow(1.0-abs(dot(normalize(vN),vec3(0,0,1))),3.0)*0.6; gl_FragColor=vec4(c,1.0); }` });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.95, 64, 48), m); const g = new THREE.Group(); g.add(mesh);
  return { g, update(t, S) { const s = S.luna; g.visible = s.a > 0.003; if (!g.visible) return; g.position.set(s.x, s.y, s.z); g.scale.setScalar(Math.max(0.001, s.a)); mesh.rotation.y = t * 0.3; } };
}

// ---------------------------------------------------------------- phone
export function makePhone(tx) {
  const g = new THREE.Group(); const body = new THREE.Mesh(new RoundedBoxGeometry(1.75, 3.5, 0.16, 4, 0.2), new THREE.MeshPhysicalMaterial({ color: 0x1c2033, metalness: 0.7, roughness: 0.3, clearcoat: 1 })); g.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 3.22), new THREE.MeshBasicMaterial({ map: tx.phone, toneMapped: false })); scr.position.z = 0.085; g.add(scr);
  return { g, update(t, S) { const s = S.phone; setAlpha(g, s.a); if (!g.visible) return; g.position.set(s.x, s.y + Math.sin(t * 1.2) * 0.07, s.z); g.rotation.set(-0.05, s.ry + Math.sin(t * 0.8) * 0.06, 0.04); } };
}

// ---------------------------------------------------------------- ChatGPT Space platform
export function makeSpace() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.8, 0.28, 96), new THREE.MeshStandardMaterial({ color: 0x12162c, roughness: 0.7, metalness: 0.1, envMapIntensity: 0.25 })); disc.position.y = FLOOR_Y - 0.14; g.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.7, 0.04, 8, 160), new THREE.MeshBasicMaterial({ color: 0x9b6bff })); rim.rotation.x = Math.PI / 2; rim.position.y = FLOOR_Y + 0.01; g.add(rim);
  const stack = new THREE.Group(); for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.16, 1.2, 3, 0.06), new THREE.MeshPhysicalMaterial({ color: PAL[i], roughness: 0.3, clearcoat: 1, emissive: PAL[i], emissiveIntensity: 0.25 })); s.position.y = i * 0.22; s.rotation.y = i * 0.18; stack.add(s); }
  stack.position.y = FLOOR_Y + 0.12; g.add(stack);
  const people = []; const pm = new THREE.MeshPhysicalMaterial({ color: 0xe9ecf7, roughness: 0.45, clearcoat: 0.6 });
  [[-3.4, 1.6], [3.3, 1.9], [0.2, -3.6]].forEach(([x, z]) => { const p = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.7, 8, 24), pm); b.position.y = 0.78; const h = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 20), pm); h.position.y = 1.72; p.add(b, h); p.position.set(x, FLOOR_Y, z); p.lookAt(0, FLOOR_Y, 0); g.add(p); people.push(p); });
  const orb = new THREE.Group(); const om = new THREE.Mesh(new THREE.SphereGeometry(0.55, 40, 28), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, clearcoat: 1, emissive: 0xffffff, emissiveIntensity: 0.15 })); const oring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 8, 64), new THREE.MeshBasicMaterial({ color: 0x9bd4ff })); oring.rotation.x = 1.2; orb.add(om, oring); orb.position.set(-0.4, 1.2, 3.2); g.add(orb);
  const linkPts = [...people.map((p) => [p.position.x, 0.2, p.position.z]), [orb.position.x, 0.2, orb.position.z], [-4.2, 0.2, -1.8], [4.3, 0.2, -1.2], [-1.8, 0.2, -4.0], [2.3, 0.2, -3.9], [-4.6, 0.2, 1.0]];
  const lp = []; linkPts.forEach((p) => lp.push(0, 0.4, 0, p[0], FLOOR_Y + 0.25, p[2]));
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); const links = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xc9b6ff, transparent: true, opacity: 0.7 })); g.add(links);
  return { g, people, orb, update(t, S) { const s = S.space; setAlpha(g, s.a); if (!g.visible) return; g.rotation.y = s.rot;
    stack.scale.set(1, Math.max(0.001, s.stack), 1); stack.rotation.y = t * 0.3; people.forEach((p, i) => { const k = clamp01(s.ppl * 1.5 - i * 0.2); p.scale.setScalar(Math.max(0.001, k)); });
    orb.scale.setScalar(Math.max(0.001, s.orb)); orb.position.y = 1.2 + Math.sin(t * 1.5) * 0.12; oring.rotation.z = t; links.material.opacity = 0.7 * s.links * s.a; } };
}

// ---------------------------------------------------------------- Pages + Slides
export function docTextures() {
  const out = {};
  for (let k = 0; k < 4; k++) { const [c, x] = cv(800, 1030); rr(x, 0, 0, 800, 1030, 0, '#f6f7fb'); txt(x, 'Q4 Market Brief', 60, 110, F.g(700, 50), '#10132a'); rr(x, 60, 136, 200, 10, 5, '#9b6bff');
    const lines = [8, 10, 12, 16][k]; for (let i = 0; i < lines; i++) { const Y = 190 + i * 38 + (i >= 6 ? 250 : 0); if (Y > 990) break; rr(x, 60, Y, i % 4 === 3 ? 420 : 660, 14, 7, '#c9cee3'); }
    if (k >= 1) { rr(x, 60, 430, 680, 220, 16, '#eceef7'); for (let i = 0; i < 8; i++) { const h = 40 + ((i * 53) % 150); rr(x, 100 + i * 78, 620 - h, 48, h, 8, HEX[i % 5]); } }
    if (k >= 2) { rr(x, 520, 300, 150, 44, 22, '#3da9fc'); txt(x, 'YOU', 595, 330, F.m(700, 20), '#fff', 'center'); }
    if (k >= 3) { rr(x, 400, 860, 150, 44, 22, '#ff5a4e'); txt(x, 'DOT', 475, 890, F.m(700, 20), '#fff', 'center'); }
    out['page' + k] = texOf(c); }
  const slide = (k) => { const [c, x] = cv(960, 540); rr(x, 0, 0, 960, 540, 0, ['#10132a', '#f6f7fb', '#1a1030', '#f6f7fb'][k]); const ink = k % 2 ? '#10132a' : '#f4f6ff';
    if (k === 0) { txt(x, 'DevDay', 70, 250, F.d(900, 96), ink); txt(x, 'recap deck', 74, 320, F.g(600, 40), '#9aa3c4'); HEX.slice(0, 5).forEach((h, i) => { x.fillStyle = h; x.beginPath(); x.arc(640 + i * 56, 440, 22, 0, TAU); x.fill(); }); }
    if (k === 1) { txt(x, 'Adoption', 60, 90, F.g(700, 46), ink); for (let i = 0; i < 7; i++) { const h = 60 + i * 44; rr(x, 90 + i * 118, 480 - h, 80, h, 10, HEX[i % 5]); } }
    if (k === 2) { txt(x, 'Next steps', 60, 100, F.g(700, 46), ink); for (let i = 0; i < 4; i++) { x.fillStyle = HEX[i]; x.beginPath(); x.arc(84, 180 + i * 80, 12, 0, TAU); x.fill(); rr(x, 116, 170 + i * 80, 420 + i * 60, 20, 10, '#5b5f86'); } }
    if (k === 3) { txt(x, '25×', 60, 330, F.d(900, 200), '#9b6bff'); txt(x, 'Plus allowance', 70, 420, F.g(600, 40), '#10132a'); }
    return texOf(c); };
  out.slides = [0, 1, 2, 3].map(slide);
  return out;
}
export function makePages(dt) {
  const g = new THREE.Group(); const page = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 3.48), new THREE.MeshBasicMaterial({ map: dt.page0, toneMapped: false, side: THREE.DoubleSide })); g.add(page);
  return { g, update(t, S) { const s = S.pages; setAlpha(g, s.a); if (!g.visible) return; g.position.set(s.x, s.y + Math.sin(t * 1.1) * 0.06, s.z); g.rotation.set(-0.08, s.ry + Math.sin(t * 0.6) * 0.06, 0.02); g.scale.setScalar(s.s);
    const m = dt['page' + Math.min(3, Math.floor(s.k))]; if (page.material.map !== m) { page.material.map = m; page.material.needsUpdate = true; } } };
}
export function makeSlides(dt) {
  const g = new THREE.Group(); const cards = dt.slides.map((tx) => { const m = new THREE.Mesh(new RoundedBoxGeometry(3.2, 1.8, 0.04, 2, 0.02), [0, 0, 0, 0, 1, 0].map((k) => (k ? new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }) : new THREE.MeshPhysicalMaterial({ color: 0xdfe3f2, roughness: 0.4 })))); g.add(m); return m; });
  return { g, update(t, S) { const s = S.slides; setAlpha(g, s.a); if (!g.visible) return; g.position.set(s.x, s.y, s.z);
    cards.forEach((c, i) => { const f = s.f; const k = i - 1.5; c.position.set(k * 1.1 * f, -Math.abs(k) * 0.18 * f + Math.sin(t * 1.2 + i) * 0.05, -Math.abs(k) * 0.2 + i * 0.02); c.rotation.set(0, -k * 0.12 * f, -k * 0.09 * f); }); } };
}

// ---------------------------------------------------------------- vault (Private Intelligence)
export function makeVault() {
  const g = new THREE.Group(); const S3 = 3.5;
  const glass = new THREE.Mesh(new RoundedBoxGeometry(S3, S3, S3, 4, 0.12), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uA: { value: 1 } },
    vertexShader: `varying vec3 vN,vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uA; varying vec3 vN,vV; void main(){ float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),3.0); gl_FragColor=vec4(vec3(0.6,0.85,1.0)*(0.08+f*0.9),uA*(0.1+f*0.6)); }` }));
  g.add(glass);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(S3, S3, S3)), new THREE.LineBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.9 })); g.add(edges);
  const lock = new THREE.Group(); const lm = new THREE.MeshBasicMaterial({ color: 0x2ee6a6, transparent: true }); [0, 1, 2].forEach((k) => { const r = new THREE.Mesh(new THREE.TorusGeometry(3.1 + k * 0.25, 0.025, 8, 160), lm); r.rotation.set(Math.PI / 2 + k * 0.5, k * 0.7, 0); lock.add(r); }); g.add(lock);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(S3 * 1.25, S3 * 1.25), new THREE.MeshBasicMaterial({ color: 0x2ee6a6, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })); scan.rotation.x = -Math.PI / 2; g.add(scan);
  return { g, update(t, S) { const s = S.vault; setAlpha(g, s.a); if (!g.visible) return; g.position.set(s.x, s.y, s.z); g.rotation.y = t * 0.25 + s.rot; g.rotation.x = 0.18;
    lock.scale.setScalar(Math.max(0.001, 1.6 - 0.6 * s.lock)); lm.opacity = s.lock * s.a; lock.rotation.y = t * 0.6; scan.visible = s.scan > 0.003 && s.scan < 0.997; scan.position.y = (s.scan - 0.5) * S3 * 1.1; } };
}

// ---------------------------------------------------------------- spotlight cone
export function makeSpot() {
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uA: { value: 0 } },
    vertexShader: `varying float vY; varying vec3 vN,vV; void main(){ vY=uv.y; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uA; varying float vY; varying vec3 vN,vV; void main(){ float f=abs(dot(normalize(vN),normalize(vV))); float a=pow(f,2.0)*(0.25+0.75*vY)*0.5; gl_FragColor=vec4(vec3(1.0,0.96,0.88)*a*uA,1.0); }` });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 7.2, 16, 64, 1, true), m); cone.position.y = 6.0; const g = new THREE.Group(); g.add(cone);
  return { g, update(t, S) { const s = S.spot; g.visible = s.a > 0.003; m.uniforms.uA.value = s.a * (0.92 + 0.08 * Math.sin(t * 13)); } };
}

// ---------------------------------------------------------------- sparkle bursts (pure function of time)
export function makeBursts(U) {
  const N = 1400, SL = 10, r = rng(12); const sd = new Float32Array(N * 4), pos = new Float32Array(N * 3), sl = new Float32Array(N);
  for (let i = 0; i < N; i++) { sd.set([r(), r(), r(), r()], i * 4); sl[i] = i % SL; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sd, 4)); g.setAttribute('aL', new THREE.BufferAttribute(sl, 1));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...U, uBT: { value: new Array(SL).fill(-99) }, uBO: { value: [...Array(SL)].map(() => new THREE.Vector3()) }, uBS: { value: new Array(SL).fill(1) }, uScale: { value: 900 }, uPal: { value: PAL.map((c) => new THREE.Color(c)) } },
    vertexShader: `uniform float uT,uScale; uniform float uBT[${SL}]; uniform vec3 uBO[${SL}]; uniform float uBS[${SL}]; uniform vec3 uPal[6]; attribute vec4 aS; attribute float aL; varying vec3 vC; varying float vA;
      void main(){ int L=int(aL+0.5); float bt=-99.0; vec3 bo=vec3(0.0); float bs=1.0; for(int k=0;k<${SL};k++){ if(k==L){ bt=uBT[k]; bo=uBO[k]; bs=uBS[k]; } }
        float age=uT-bt; float life=0.7+aS.w*0.6; vA=(age>0.0&&age<life)?(1.0-age/life):0.0;
        vec3 dir=normalize(vec3(aS.x-0.5,aS.y-0.5,aS.z-0.5)+0.0001); float sp=(1.5+aS.w*3.0)*bs; vec3 p=bo+dir*sp*(1.0-exp(-age*5.0))*0.8+vec3(0.0,-age*age*1.2,0.0);
        vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=max(1.0,(0.07+aS.y*0.09)*bs*uScale/(-mv.z))*step(0.001,vA);
        int ci=int(floor(aS.z*5.999)); vec3 c=uPal[0]; for(int k=0;k<6;k++){ if(k==ci) c=uPal[k]; } vC=mix(c,vec3(1.0),0.35); }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float r=length(gl_PointCoord-0.5)*2.0; float a=(1.0-smoothstep(0.4,1.0,r))*vA; if(a<0.01) discard; gl_FragColor=vec4(vC*1.5,a); }` });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; const list = [];
  return { g: pts, add(t0, x, y, z, s = 1) { list.push([t0, x, y, z, s]); list.sort((a, b) => a[0] - b[0]); },
    update(t, S, cam, scale) { m.uniforms.uScale.value = scale; const bt = m.uniforms.uBT.value, bo = m.uniforms.uBO.value, bs = m.uniforms.uBS.value; bt.fill(-99);
      // fixed slot per burst (index in the sorted list) so a burst keeps its particles for its whole life
      list.forEach((b, k) => { if (b[0] <= t) { const s = k % SL; bt[s] = b[0]; bo[s].set(b[1], b[2], b[3]); bs[s] = b[4]; } }); } };
}
