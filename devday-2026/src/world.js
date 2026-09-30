import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { rng } from './util.js';
import { makeField, bakeShapes, DOT_X, DOT_Y } from './field.js';
import * as P from './props.js';

export const W = 1920, H = 1080;
export { DOT_X, DOT_Y };

const dot = () => ({ x: 0, y: DOT_Y, z: 0, s: 0, hop: 0, hf: 6, ry: 0, rx: 0, acc: 0, eyes: 1, dim: 0, sq: 0, glow: 0, shadow: 1 });
// Every animated quantity lives here; GSAP tweens it, render() reads it.
export const S = window.__S = {
  cam: { x: 0, y: 1, z: 16, lx: 0, ly: 0, lz: 0, fov: 40, roll: 0, orbit: 0 },
  shake: 0, whip: 0, whipDir: 1, flash: 0, glitch: 0, ab: 0,
  bg: { mood: 0, sun: 0, space: 0, warm: 0, cool: 0 }, grade: { red: 0, ice: 0, sat: 1 },
  floor: { a: 0, pool: 0.6 }, stars: 0.5,
  field: { a: 0, A: 0, B: 0, m: 0, rot: 0, rx: 0, spin: 0, size: 0.085, flow: 0, laneA: 0, laneR: 0, red: 0, pulse: 0, white: 0, collapse: 0, x: 0, y: 0, z: 0, s: 1 },
  dots: [0, 1, 2, 3, 4].map(dot),
  clock: { a: 0, x: 0, y: DOT_Y, z: 0, spin: 0 },
  mon: { a: 0, x: 0, y: 0.6, z: -2.2, ry: 0, s: 1, k: 0, set: 0, cloud: 0 },
  apps: { a: 0, e: 0, spin: 0, x: 0, y: DOT_Y, z: 0 },
  crystal: { a: 0, x: 0, y: 0, z: 0, s: 1, ex: 0, dim: 0, red: 0 },
  sun: { a: 0, x: 0, y: 0, z: 0, s: 1, flare: 0 },
  coins: { a: 0, astra: 0, sol: 0, ax: -3.4, sx: 3.0, y: -2.6 },
  warp: { a: 0, d: 0, len: 1 },
  wafer: { a: 0, x: 0, y: 0, z: -40, rx: 0.5, ry: 0, rz: 0.2 },
  card: { a: 0, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 },
  cur: { a: 0, x: 0, y: 0, z: 0.4, press: 0, rip: 0 },
  graph: { a: 0, x: 1.8, y: 0.5, z: -0.6 },
  aws: { a: 0, s: 1, x: 1.8, y: 0.5, z: -0.6 },
  cloud: { a: 0, x: 0, y: 3, z: -1 },
  luna: { a: 0, x: 0, y: 0, z: 0 },
  phone: { a: 0, x: 4.4, y: 0.2, z: 0.5, ry: -0.3 },
  space: { a: 0, stack: 0, ppl: 0, orb: 0, links: 0, rot: 0 },
  pages: { a: 0, x: 0, y: 1.2, z: 1, ry: 0, s: 1, k: 0 },
  slides: { a: 0, x: 0, y: 1.4, z: 1, f: 0 },
  vault: { a: 0, x: 0, y: 0.25, z: 0, lock: 0, scan: 0, rot: 0 },
  spot: { a: 0 },
};

let renderer, scene, camera, post, bgMat, floorMat, starMat, O;
const U = { uT: { value: 0 } };

export async function initWorld(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping; // tone mapping happens in the final post pass
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 600);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.035).texture; scene.environmentIntensity = 0.6;

  // backdrop: view-direction gradient with a soft glow; mood uniforms blend palettes
  bgMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { ...U, uMood: { value: 0 }, uSun: { value: 0 }, uSpace: { value: 0 }, uWarm: { value: 0 }, uCool: { value: 0 } },
    vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uT,uMood,uSun,uSpace,uWarm,uCool; varying vec3 vD;
      void main(){ float y=vD.y; vec3 top=vec3(0.0045,0.005,0.016), bot=vec3(0.0012,0.0014,0.0035), glow=vec3(0.028,0.011,0.075);
        glow=mix(glow,vec3(0.045,0.013,0.002),uSun); glow=mix(glow,vec3(0.003,0.022,0.05),uCool); glow=mix(glow,vec3(0.06,0.008,0.035),uWarm);
        top=mix(top,vec3(0.006,0.0006,0.001),uMood); bot=mix(bot,vec3(0.0008,0.0,0.0001),uMood); glow=mix(glow,vec3(0.07,0.002,0.006),uMood);
        vec3 c=mix(bot,top,smoothstep(-0.4,0.6,y)); float g=exp(-pow(length(vD.xy-vec2(0.0,0.05))*1.5,2.0))*step(0.0,-vD.z); c+=glow*g*(1.0-uSpace*0.75);
        c*=1.0-uSpace*0.55; gl_FragColor=vec4(c,1.0); }` });
  const bg = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 32), bgMat); bg.frustumCulled = false; scene.add(bg);
  // stars
  { const r = rng(2), n = 1600, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const d = 120 + r() * 150, th = r() * 6.283, ph = Math.acos(2 * r() - 1); p.set([d * Math.sin(ph) * Math.cos(th), d * Math.cos(ph), d * Math.sin(ph) * Math.sin(th)], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); starMat = new THREE.PointsMaterial({ color: 0x9fb3ff, size: 0.9, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false }); scene.add(new THREE.Points(g, starMat)); }
  // stage floor: dotted grid + light pool
  floorMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { ...U, uA: { value: 0 }, uPool: { value: 0.6 }, uMood: { value: 0 } },
    vertexShader: `varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uA,uPool,uMood; varying vec2 vP;
      void main(){ vec2 g=fract(vP*1.25)-0.5; float d=length(g); float dotm=1.0-smoothstep(0.07,0.11,d); float r=length(vP*vec2(1.0,1.35));
        float fade=exp(-r*r*0.004); float pool=exp(-r*r*0.045)*uPool; vec3 base=mix(vec3(0.004,0.0045,0.012),vec3(0.008,0.0005,0.001),uMood);
        vec3 c=base*fade+vec3(0.3,0.33,0.75)*dotm*0.09*fade+mix(vec3(0.06,0.05,0.16),vec3(0.14,0.004,0.01),uMood)*pool*0.6; gl_FragColor=vec4(c,uA*fade); }` });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.y = P.FLOOR_Y; scene.add(floor);
  // lights
  scene.add(new THREE.HemisphereLight(0xcdd6ff, 0x1a1030, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 8, 7); scene.add(key);
  const rimL = new THREE.PointLight(0x5ab8ff, 60, 30, 2); rimL.position.set(-7, 3, -4); scene.add(rimL);
  const rimR = new THREE.PointLight(0xff6fb5, 50, 30, 2); rimR.position.set(7, 2.5, -4); scene.add(rimR);
  O = { key, rimL, rimR };

  // content
  const tx = P.screenTextures(); const dt = P.docTextures();
  O.field = makeField(U); bakeShapes(O.field.userData.tex); scene.add(O.field);
  const add = (k, o) => { O[k] = o; scene.add(o.g); if (o.rg) scene.add(o.rg); return o; };
  add('dots', P.makeDots()); add('mon', P.makeMonitor(tx)); add('clock', P.makeClock()); add('apps', P.makeApps()); add('crystal', P.makeCrystal(U)); add('sun', P.makeSun(U));
  add('coins', P.makeCoins()); add('warp', P.makeWarp()); add('wafer', P.makeWafer()); add('card', P.makeCard()); add('cur', P.makeCursor()); add('graph', P.makeGraph()); add('aws', P.makeAws());
  add('cloud', P.makeCloud()); add('luna', P.makeLuna()); add('phone', P.makePhone(tx)); add('space', P.makeSpace()); add('pages', P.makePages(dt)); add('slides', P.makeSlides(dt)); add('vault', P.makeVault());
  add('spot', P.makeSpot()); add('bursts', P.makeBursts(U));
  window.__O = O;

  post = makePost();
  window.__W = { renderer, post, scene, camera }; window.__THREE_RT = THREE.WebGLRenderTarget;
  return O;
}

export function project(x, y, z) { const v = new THREE.Vector3(x, y, z).project(camera); return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H, v.z]; }

export function render(t) {
  if (!O) return; U.uT.value = t;
  const c = S.cam, sh = S.shake;
  const dx = Math.sin(t * 0.31) * 0.12 + Math.sin(t * 57) * sh * 0.22, dy = Math.cos(t * 0.27) * 0.08 + Math.cos(t * 49) * sh * 0.18;
  const oa = c.orbit, rx = c.x - c.lx, rz = c.z - c.lz; const ox = c.lx + rx * Math.cos(oa) + rz * Math.sin(oa), oz = c.lz + rz * Math.cos(oa) - rx * Math.sin(oa);
  camera.position.set(ox + dx, c.y + dy, oz); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.lookAt(c.lx, c.ly, c.lz); camera.rotateZ(c.roll + Math.sin(t * 43) * sh * 0.008);
  camera.updateMatrixWorld();
  const scale = H / (2 * Math.tan((c.fov * Math.PI) / 360));
  // backdrop + floor
  const b = S.bg; bgMat.uniforms.uMood.value = b.mood; bgMat.uniforms.uSun.value = b.sun; bgMat.uniforms.uSpace.value = b.space; bgMat.uniforms.uWarm.value = b.warm; bgMat.uniforms.uCool.value = b.cool;
  floorMat.uniforms.uA.value = S.floor.a; floorMat.uniforms.uPool.value = S.floor.pool; floorMat.uniforms.uMood.value = b.mood; starMat.opacity = S.stars;
  O.rimL.color.set(0x5ab8ff).lerp(new THREE.Color(0xff2030), b.mood); O.rimR.color.set(0xff6fb5).lerp(new THREE.Color(0xff3020), b.mood); O.key.intensity = 2.2 * (1 - b.mood * 0.55);
  // field
  const f = S.field, fm = O.field.userData.mat.uniforms; O.field.visible = f.a > 0.003;
  if (O.field.visible) { Object.entries({ uA: f.A, uB: f.B, uM: f.m, uSize: f.size, uScale: scale, uAlpha: f.a, uFlow: f.flow, uLaneA: f.laneA, uLaneR: f.laneR, uRed: f.red, uPulse: f.pulse, uWhite: f.white, uCollapse: f.collapse }).forEach(([k, v]) => { fm[k].value = v; });
    O.field.rotation.set(f.rx, f.rot + f.spin, 0); O.field.position.set(f.x, f.y, f.z); O.field.scale.setScalar(f.s); }
  ['dots', 'mon', 'clock', 'apps', 'crystal', 'sun', 'coins', 'warp', 'wafer', 'card', 'cur', 'graph', 'aws', 'cloud', 'luna', 'phone', 'space', 'pages', 'slides', 'vault', 'spot', 'bursts'].forEach((k) => O[k].update(t, S, camera, scale));
  // post
  post.render(t);
}

export { bakeShapes };

// ---------------------------------------------------------------- post
// Hand-rolled for a CPU (SwiftShader) renderer: one MSAA scene target, a two-level bloom at 1/4 and 1/8 res,
// then a single full-res pass that adds bloom, tone maps (Khronos neutral), converts to sRGB and stylises.
// The whip-blur variant is a separate program so the normal path never pays for its taps.
function makePost() {
  const half = { type: THREE.HalfFloatType, depthBuffer: false };
  let sceneRT;
  const alloc = (cfg) => { if (sceneRT) sceneRT.dispose(); sceneRT = new THREE.WebGLRenderTarget(W, H, { type: cfg.half ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: cfg.samples });
    if (!cfg.half) sceneRT.texture.colorSpace = THREE.SRGBColorSpace; if (uniforms) uniforms.tDiffuse.value = sceneRT.texture; };
  let uniforms = null; alloc({ half: true, samples: 4 });
  const L = [[W / 4, H / 4], [W / 8, H / 8]].map(([w, h]) => [new THREE.WebGLRenderTarget(w, h, half), new THREE.WebGLRenderTarget(w, h, half)]);
  const vs = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
  const quad = new FullScreenQuad();
  const bright = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThr: { value: 0.8 } }, vertexShader: vs, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThr; varying vec2 vUv;
      void main(){ vec3 c=(texture2D(tSrc,vUv+uTexel*vec2(-1.0,-1.0)).rgb+texture2D(tSrc,vUv+uTexel*vec2(1.0,-1.0)).rgb+texture2D(tSrc,vUv+uTexel*vec2(-1.0,1.0)).rgb+texture2D(tSrc,vUv+uTexel*vec2(1.0,1.0)).rgb)*0.25;
        float l=max(c.r,max(c.g,c.b)); float k=smoothstep(uThr,uThr+0.6,l); gl_FragColor=vec4(min(c*k,vec3(8.0)),1.0); }` });
  const blur = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: vs, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
      void main(){ vec3 c=texture2D(tSrc,vUv).rgb*0.227; c+=(texture2D(tSrc,vUv+uDir*1.385).rgb+texture2D(tSrc,vUv-uDir*1.385).rgb)*0.316; c+=(texture2D(tSrc,vUv+uDir*3.231).rgb+texture2D(tSrc,vUv-uDir*3.231).rgb)*0.07; gl_FragColor=vec4(c,1.0); }` });
  const down = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null } }, vertexShader: vs, depthTest: false, depthWrite: false, fragmentShader: 'uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor=texture2D(tSrc,vUv); }' });
  uniforms = { tDiffuse: { value: sceneRT.texture }, tB1: { value: L[0][0].texture }, tB2: { value: L[1][0].texture }, uBloom: { value: 0.6 }, uT: { value: 0 }, uWhip: { value: 0 }, uDir: { value: 1 },
    uAb: { value: 0 }, uGl: { value: 0 }, uFlash: { value: 0 }, uRed: { value: 0 }, uIce: { value: 0 }, uSat: { value: 1 }, uExpo: { value: 1 } };
  const common = `uniform sampler2D tDiffuse,tB1,tB2; uniform float uBloom,uT,uWhip,uDir,uAb,uGl,uFlash,uRed,uIce,uSat,uExpo; varying vec2 vUv;
    float hh(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
    vec3 neutral(vec3 c){ c*=uExpo; float x=min(c.r,min(c.g,c.b)); float off=x<0.08?x-6.25*x*x:0.04; c-=off; float pk=max(c.r,max(c.g,c.b)); if(pk<0.76) return c;
      float d=0.24; float np=1.0-d*d/(pk+d-0.76); c*=np/pk; float g=1.0-1.0/(0.15*(pk-np)+1.0); return mix(c,vec3(np),g); }
    vec3 srgb(vec3 c){ c=clamp(c,0.0,1.0); return mix(c*12.92, 1.055*pow(c,vec3(1.0/2.4))-0.055, step(0.0031308,c)); }
    vec3 finish(vec3 c, vec2 uv){ c+=(texture2D(tB1,uv).rgb*0.6+texture2D(tB2,uv).rgb*0.9)*uBloom; c=srgb(neutral(c));
      float l=dot(c,vec3(0.299,0.587,0.114)); c=mix(vec3(l),c,uSat); c=mix(c,vec3(l*1.3,l*0.26,l*0.3)+c*vec3(0.22,0.0,0.0),uRed*0.75); c=mix(c,vec3(l*0.82,l*0.98,l*1.15),uIce*0.6);
      float v=smoothstep(1.2,0.3,length((vUv-0.5)*vec2(1.2,1.0))); c*=mix(1.0,v,0.45); c+=vec3(uFlash); c+=(hh(vUv*vec2(1931.0,1087.0)+fract(uT*7.13)*97.0)-0.5)*0.03; return c; }`;
  const glUv = `vec2 uv=vUv; float band=step(0.93,hh(vec2(floor(uv.y*42.0),floor(uT*24.0))))*uGl; uv.x+=band*0.05*(hh(vec2(floor(uT*24.0),3.0))-0.5)*2.0; float a=0.0011+uAb*0.006+uGl*0.008;`;
  const lite = new THREE.ShaderMaterial({ uniforms, vertexShader: vs, depthTest: false, depthWrite: false,
    fragmentShader: `${common} void main(){ ${glUv} vec3 c; c.r=texture2D(tDiffuse,uv+vec2(a,0.0)).r; c.g=texture2D(tDiffuse,uv).g; c.b=texture2D(tDiffuse,uv-vec2(a,0.0)).b; gl_FragColor=vec4(finish(c,uv),1.0); }` });
  const whipM = new THREE.ShaderMaterial({ uniforms, vertexShader: vs, depthTest: false, depthWrite: false,
    fragmentShader: `${common} void main(){ ${glUv} vec3 c=vec3(0.0); float ws=0.0; for(int i=0;i<10;i++){ float k=float(i)/9.0-0.5; float w=1.0-abs(k); vec2 o=vec2(k*uWhip*0.12*uDir,0.0);
      c.r+=texture2D(tDiffuse,uv+o+vec2(a,0.0)).r*w; c.g+=texture2D(tDiffuse,uv+o).g*w; c.b+=texture2D(tDiffuse,uv+o-vec2(a,0.0)).b*w; ws+=w; } gl_FragColor=vec4(finish(c/ws,uv),1.0); }` });
  const pass = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); quad.render(renderer); };
  return { uniforms, get sceneRT() { return sceneRT; }, alloc, render(t) {
    renderer.setRenderTarget(sceneRT); renderer.render(scene, camera);
    // bloom level 1 (1/4) and 2 (1/8)
    bright.uniforms.tSrc.value = sceneRT.texture; bright.uniforms.uTexel.value.set(1 / W, 1 / H); pass(bright, L[0][0]);
    blur.uniforms.tSrc.value = L[0][0].texture; blur.uniforms.uDir.value.set(4 / W, 0); pass(blur, L[0][1]); blur.uniforms.tSrc.value = L[0][1].texture; blur.uniforms.uDir.value.set(0, 4 / H); pass(blur, L[0][0]);
    down.uniforms.tSrc.value = L[0][0].texture; pass(down, L[1][0]);
    blur.uniforms.tSrc.value = L[1][0].texture; blur.uniforms.uDir.value.set(8 / W, 0); pass(blur, L[1][1]); blur.uniforms.tSrc.value = L[1][1].texture; blur.uniforms.uDir.value.set(0, 8 / H); pass(blur, L[1][0]);
    const u = uniforms; u.uT.value = t; u.uWhip.value = S.whip; u.uDir.value = S.whipDir; u.uAb.value = S.ab; u.uGl.value = S.glitch; u.uFlash.value = S.flash; u.uRed.value = S.grade.red; u.uIce.value = S.grade.ice; u.uSat.value = S.grade.sat;
    u.uBloom.value = 0.55 + S.flash * 0.6 - S.sun.a * 0.15;
    pass(S.whip > 0.003 ? whipM : lite, null);
  } };
}
