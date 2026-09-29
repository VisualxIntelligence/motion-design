import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

THREE.ColorManagement.enabled = false;

export const W = 1920, H = 1080;
export const C = { cyan: 0x35e0ff, red: 0xff2e4d, amber: 0xffb020, white: 0xffffff, ice: 0xbfefff, green: 0x38f2a0, ink: 0x05070d };

// ---------- tiny deterministic RNG ----------
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- shared animated state (tweened by GSAP in timeline.js) ----------
export const S = window.__S = {
  t: 0, sim: 0,
  cam: { x: 0, y: 1.2, z: 16, lx: 0, ly: 0, lz: 0, fov: 50, roll: 0 },
  shake: 0, glitch: 0, flash: 0,
  a: { cube: 0, agents: 0, globe: 0, gov: 0, tiles: 0, crystal: 0, bars: 0, fall: 0, layers: 0, gate: 0, court: 0 },
  frac: 0.22, esc: 0, globeM: 0, breach: 0, red: 0, ice: 0, cubeScale: 1, cubeRot: 0, agentA: 1,
  crystal: { ex: 0, dim: 0, gl: 0, y: 0, z: 0, s: 1 },
  bars: [0, 0, 0], scan: 0, gflash: [0, 0, 0, 0], gstate: [0, 0, 0, 0], gfocus: 0,
  tiles: { launch: 999, pix: 12, red: 0, dim: 0 },
  fall: { x: 0, chip: 0, dots: 0, gavel: 0, stamp: 0 },
  layers: { hot: 0, crack: 0, spread: 0 },
  gateV: 0, courtS: 0,
  labels: [],
};

let renderer, composer, scene, camera, bloom, fxPass, pr = 1;
const U = { uT: { value: 0 }, uSim: { value: 0 } };
const mats = {};

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function bp(geo, color, { fill = 0x070b14, op = 1, line = 1 } = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: fill, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, transparent: op < 1, opacity: op }));
  const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.LineBasicMaterial({ color, transparent: true, opacity: line }));
  g.add(m, l); g.userData.mats = [m.material, l.material]; return g;
}
function fade(group, a) { group.visible = a > 0.003; group.traverse((o) => { if (o.material && o.userData.baseOp === undefined) o.userData.baseOp = o.material.opacity ?? 1; if (o.material && !o.userData.noFade) { o.material.transparent = true; o.material.opacity = (o.userData.baseOp ?? 1) * a; } }); }

// ---------- agents (points) ----------
function makeAgents() {
  const N = 7000, r = rng(11);
  const seed = new Float32Array(N * 4), gl = new Float32Array(N * 3), pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    seed.set([r(), r(), r(), i / N], i * 4);
    const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i;
    gl.set([Math.cos(th) * rad, y, Math.sin(th) * rad], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4)); g.setAttribute('aGlobe', new THREE.BufferAttribute(gl, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...U, uEsc: { value: 0 }, uGlobe: { value: 0 }, uFrac: { value: 0.2 }, uSize: { value: 0.075 }, uScale: { value: 800 }, uA: { value: 1 }, uRed: { value: 0 }, uIce: { value: 0 }, uBox: { value: 1.75 } },
    vertexShader: `
      attribute vec4 aSeed; attribute vec3 aGlobe;
      uniform float uSim,uT,uEsc,uGlobe,uFrac,uSize,uScale,uRed,uIce,uBox;
      varying vec3 vCol; varying float vA;
      float tri(float x){ return abs(fract(x*0.5+0.25)*2.0-1.0)*2.0-1.0; }
      mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
      void main(){
        vec3 vel = 0.22 + aSeed.yzx*0.8;
        vec3 b = vec3(tri(aSeed.x*57.0+uSim*vel.x), tri(aSeed.y*91.0+uSim*vel.y), tri(aSeed.z*33.0+uSim*vel.z))*uBox;
        float d = aSeed.x*0.5;
        float e = clamp((uEsc-d)/0.5,0.0,1.0); float ee = e*e*(3.0-2.0*e);
        vec3 dir = normalize(b*0.6 + vec3(0.0,0.0,1.6) + (aSeed.yzx-0.5)*1.4);
        vec3 ePos = b + dir*ee*(7.0+aSeed.w*9.0);
        float ga = uSim*0.06; vec3 gp = aGlobe*(8.6+0.35*sin(aSeed.z*40.0+uT*1.3));
        gp.xz = rot(ga)*gp.xz;
        float g = clamp((uGlobe-aSeed.y*0.45)/0.55,0.0,1.0); g = g*g*(3.0-2.0*g);
        vec3 p = mix(ePos,gp,g);
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*mv;
        float vis = step(aSeed.w,uFrac);
        float sz = uSize*(1.0+1.2*ee*(1.0-g)+0.6*g);
        gl_PointSize = max(1.0, sz*uScale/(-mv.z))*vis;
        vec3 cyan=vec3(0.21,0.88,1.0), red=vec3(1.0,0.18,0.3), amber=vec3(1.0,0.69,0.13), ice=vec3(0.75,0.94,1.0);
        vec3 c = mix(cyan,ice,uIce); c = mix(c,red,max(uRed,ee)); c = mix(c,amber,g*0.85);
        vCol = c; vA = vis*(0.55+0.45*sin(aSeed.z*30.0+uT*3.0));
      }`,
    fragmentShader: `
      uniform float uA; varying vec3 vCol; varying float vA;
      void main(){ float r=length(gl_PointCoord-0.5)*2.0; float a=1.0-smoothstep(0.0,1.0,r); a*=a; gl_FragColor=vec4(vCol*1.4,a*vA*uA); }`,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; mats.agents = m; return p;
}

// ---------- sandbox cube ----------
function makeCube() {
  const grp = new THREE.Group(); const hs = 2;
  const r = rng(5);
  // triangulated lattice faces; front face (+z) can shatter
  const faces = []; const q = new THREE.PlaneGeometry(4, 4, 4, 4).toNonIndexed();
  const rots = [[0, 0, 0], [0, Math.PI, 0], [0, Math.PI / 2, 0], [0, -Math.PI / 2, 0], [-Math.PI / 2, 0, 0], [Math.PI / 2, 0, 0]];
  const pos = [], ctr = [], rnd = [], bar = [], front = [];
  rots.forEach((rt, fi) => {
    const g = q.clone(); g.rotateX(rt[0]); g.rotateY(rt[1]); g.translate(0, 0, 0);
    const m = new THREE.Matrix4().makeTranslation(0, 0, 0); const v = new THREE.Vector3();
    const P = g.attributes.position;
    // push to cube surface along its normal
    const nrm = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(rt[0], rt[1], rt[2]));
    for (let t = 0; t < P.count; t += 3) {
      const c = new THREE.Vector3(); for (let k = 0; k < 3; k++) { v.fromBufferAttribute(P, t + k); v.addScaledVector(nrm, hs); c.add(v); }
      c.multiplyScalar(1 / 3); const rr = [r(), r(), r()];
      for (let k = 0; k < 3; k++) { v.fromBufferAttribute(P, t + k); v.addScaledVector(nrm, hs); pos.push(v.x, v.y, v.z); ctr.push(c.x, c.y, c.z); rnd.push(...rr); bar.push(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0); front.push(fi === 0 ? 1 : 0); }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(ctr, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(rnd, 3));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(bar, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(front, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { ...U, uCol: { value: new THREE.Color(C.cyan) }, uA: { value: 1 }, uBreach: { value: 0 } },
    vertexShader: `attribute vec3 aC,aR,aB; attribute float aF; uniform float uBreach,uT; varying vec3 vB; varying float vF; varying float vFade;
      mat3 rotv(vec3 ax,float a){ ax=normalize(ax); float s=sin(a),c=cos(a),o=1.0-c; return mat3(o*ax.x*ax.x+c,o*ax.x*ax.y-ax.z*s,o*ax.z*ax.x+ax.y*s, o*ax.x*ax.y+ax.z*s,o*ax.y*ax.y+c,o*ax.y*ax.z-ax.x*s, o*ax.z*ax.x-ax.y*s,o*ax.y*ax.z+ax.x*s,o*ax.z*ax.z+c); }
      void main(){ vB=aB; vF=aF; vec3 p=position; float b=uBreach*aF; float bb=b*b;
        vec3 l=p-aC; l=rotv(aR-0.5,bb*9.0*(aR.x+0.3))*l; p=aC+l; p+= (vec3((aR.x-0.5)*7.0,(aR.y-0.5)*7.0,2.0+aR.z*9.0))*bb;
        vFade=1.0-clamp(b*1.15-0.15,0.0,1.0); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `uniform vec3 uCol; uniform float uA,uT; varying vec3 vB; varying float vF,vFade;
      void main(){ float e=min(vB.x,min(vB.y,vB.z)); float w=fwidth(e)*1.4; float line=1.0-smoothstep(0.0,w+0.001,e);
        float fill=0.035+0.02*sin(uT*2.0+vB.x*6.0); gl_FragColor=vec4(uCol*(line*0.85+fill*3.0),(line*0.55+fill)*uA*vFade); }`,
  });
  mats.cube = m;
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; grp.add(mesh);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box(4, 4, 4)), new THREE.LineBasicMaterial({ color: C.cyan, transparent: true }));
  grp.add(edges); grp.userData.edges = edges;
  // inner core glow cube
  const core = new THREE.Mesh(box(4, 4, 4), new THREE.MeshBasicMaterial({ color: 0x0a2a3a, transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false }));
  grp.add(core); grp.userData.core = core; return grp;
}

// ---------- network globe wire + arcs ----------
function makeNet() {
  const grp = new THREE.Group();
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(8.6, 3)), new THREE.LineBasicMaterial({ color: C.amber, transparent: true, opacity: 0.10 }));
  grp.add(wire);
  const r = rng(21); const pts = [], al = [];
  for (let i = 0; i < 46; i++) {
    const th = r() * 6.283, ph = Math.acos(2 * r() - 1); const tgt = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).multiplyScalar(8.6);
    const mid = tgt.clone().multiplyScalar(0.5).add(new THREE.Vector3((r() - 0.5) * 5, (r() - 0.5) * 5, (r() - 0.5) * 5));
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), mid, tgt); const off = r();
    const p = curve.getPoints(28); for (let k = 0; k < 28; k++) { pts.push(p[k].x, p[k].y, p[k].z, p[k + 1].x, p[k + 1].y, p[k + 1].z); al.push(k / 28 + off * 0, (k + 1) / 28); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('aU', new THREE.Float32BufferAttribute(al, 1));
  const arcs = new THREE.LineSegments(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...U, uA: { value: 0 } },
    vertexShader: `attribute float aU; varying float vU; void main(){ vU=aU; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `uniform float uT,uA; varying float vU; void main(){ float k=fract(vU*2.0-uT*0.7); float d=smoothstep(0.55,1.0,k); gl_FragColor=vec4(vec3(1.0,0.45,0.2)*(0.35+d*1.6),uA*(0.15+d*0.8)*(1.0-vU*0.5)); }` }));
  arcs.frustumCulled = false; grp.add(arcs); grp.userData = { wire, arcs }; return grp;
}

// ---------- 53 image tiles ----------
function makeTiles() {
  const N = 53, r = rng(77); const base = new THREE.PlaneGeometry(1.5, 1.1);
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv); g.instanceCount = N;
  const slots = [...Array(55).keys()]; for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const fin = [], sd = [], jit = [];
  for (let i = 0; i < N; i++) { const s = slots[i]; const col = s % 11, row = Math.floor(s / 11); fin.push((col - 5) * 1.72, (2 - row) * 1.32 + 0.2, (r() - 0.5) * 1.2); sd.push(r(), r(), r(), i); jit.push((r() - 0.5) * 2, (r() - 0.5) * 2, (r() - 0.5) * 2); }
  g.setAttribute('aFin', new THREE.InstancedBufferAttribute(new Float32Array(fin), 3)); g.setAttribute('aSd', new THREE.InstancedBufferAttribute(new Float32Array(sd), 4)); g.setAttribute('aJ', new THREE.InstancedBufferAttribute(new Float32Array(jit), 3));
  const m = new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, uniforms: { ...U, uLaunch: { value: 999 }, uPix: { value: 12 }, uRed: { value: 0 }, uDim: { value: 0 }, uA: { value: 1 } },
    vertexShader: `attribute vec3 aFin,aJ; attribute vec4 aSd; uniform float uT,uLaunch; varying vec2 vUv; varying vec4 vSd; varying float vP;
      void main(){ vUv=uv; vSd=aSd; float p=clamp((uT-uLaunch-aSd.w*0.021)/0.85,0.0,1.0); vP=p; float e=1.0-pow(1.0-p,3.0);
        vec3 start=vec3(0.0); vec3 c=mix(start,aFin,e); c+=aJ*sin(3.14159*p)*3.2; c.z+=sin(3.14159*p)*4.0+sin(uT*0.9+aSd.x*6.28)*0.12*e;
        c.y+=sin(uT*0.7+aSd.y*6.28)*0.08*e; float s=mix(0.04,1.0,smoothstep(0.0,0.5,p));
        float a=(1.0-e)*(aSd.x-0.5)*5.0; vec3 q=position*s; q.xy=mat2(cos(a),-sin(a),sin(a),cos(a))*q.xy;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(c+q,1.0); }`,
    fragmentShader: `uniform float uPix,uRed,uDim,uA,uT; varying vec2 vUv; varying vec4 vSd; varying float vP;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){ vec2 cell=floor(vUv*vec2(uPix*1.36,uPix)); float n=h(cell+vSd.xy*40.0);
        vec2 q=(vUv-vec2(0.3+vSd.x*0.4,0.35+vSd.y*0.3)); float blob=smoothstep(0.42,0.1,length(q*vec2(1.2,1.4)));
        vec3 pal=0.5+0.5*cos(6.2831*(vec3(0.0,0.33,0.67)+vSd.z+n*0.25)); vec3 col=mix(pal*0.4,pal*0.85,blob)*(0.7+0.3*n);
        float bd=min(min(vUv.x,1.0-vUv.x)*1.36,min(vUv.y,1.0-vUv.y)); float border=1.0-smoothstep(0.0,0.045,bd);
        col=mix(col,vec3(0.9),border*0.8); col=mix(col,vec3(1.0,0.15,0.25)*1.2,uRed*(0.35+0.65*border)); col*=1.0-uDim*0.6;
        gl_FragColor=vec4(col,uA*smoothstep(0.0,0.1,vP)); }` });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mats.tiles = m; return mesh;
}

// ---------- crystal (Astra) ----------
function makeCrystal() {
  const g = new THREE.IcosahedronGeometry(1.7, 2).toNonIndexed(); const P = g.attributes.position; const n = P.count; const r = rng(3);
  const ctr = new Float32Array(n * 3), rnd = new Float32Array(n * 3), bar = new Float32Array(n * 3); const v = new THREE.Vector3();
  for (let t = 0; t < n; t += 3) { const c = new THREE.Vector3(); for (let k = 0; k < 3; k++) c.add(v.fromBufferAttribute(P, t + k)); c.multiplyScalar(1 / 3); const rr = [r(), r(), r()];
    for (let k = 0; k < 3; k++) { ctr.set([c.x, c.y, c.z], (t + k) * 3); rnd.set(rr, (t + k) * 3); bar.set([k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0], (t + k) * 3); } }
  g.setAttribute('aC', new THREE.BufferAttribute(ctr, 3)); g.setAttribute('aR', new THREE.BufferAttribute(rnd, 3)); g.setAttribute('aB', new THREE.BufferAttribute(bar, 3));
  const m = new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, uniforms: { ...U, uEx: { value: 0 }, uDim: { value: 0 }, uGl: { value: 0 }, uA: { value: 1 } },
    vertexShader: `attribute vec3 aC,aR,aB; uniform float uEx,uGl,uT; varying vec3 vB,vN,vV; varying float vR;
      mat3 rotv(vec3 ax,float a){ ax=normalize(ax); float s=sin(a),c=cos(a),o=1.0-c; return mat3(o*ax.x*ax.x+c,o*ax.x*ax.y-ax.z*s,o*ax.z*ax.x+ax.y*s, o*ax.x*ax.y+ax.z*s,o*ax.y*ax.y+c,o*ax.y*ax.z-ax.x*s, o*ax.z*ax.x-ax.y*s,o*ax.y*ax.z+ax.x*s,o*ax.z*ax.z+c); }
      void main(){ vB=aB; vR=aR.x; vec3 n=normalize(aC); vec3 p=position; float ex=uEx*uEx;
        p=aC+rotv(aR-0.5,ex*7.0*(aR.y+0.2))*(p-aC); p+=n*ex*(3.0+aR.x*9.0)+vec3(0.0,-ex*2.0*aR.z,0.0);
        float gl=step(0.965,fract(sin(aR.y*97.0+floor(uT*22.0)*3.1)*43758.5))*uGl; p.x+=gl*0.55*(aR.z-0.5)*2.0; p+=n*gl*0.25;
        vN=normalize(normalMatrix*n); vec4 mv=modelViewMatrix*vec4(p,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uDim,uA,uEx,uT; varying vec3 vB,vN,vV; varying float vR;
      void main(){ vec3 n=normalize(vN); float f=pow(1.0-abs(dot(n,normalize(vV))),2.2); float l=max(dot(n,normalize(vec3(-0.4,0.8,0.6))),0.0);
        vec3 irid=0.5+0.5*cos(6.2831*(vec3(0.0,0.33,0.67)+vR*0.6+uT*0.05)); vec3 base=mix(vec3(0.05,0.08,0.16),irid*vec3(0.55,0.75,1.0),0.55+0.45*l);
        vec3 col=base*(0.35+0.55*l)+vec3(0.35,0.7,1.0)*f*0.55; float e=min(vB.x,min(vB.y,vB.z)); float line=1.0-smoothstep(0.0,fwidth(e)*1.6+0.001,e);
        col+=line*vec3(0.6,0.9,1.0)*0.5; vec3 dead=vec3(0.16,0.17,0.2)*(0.5+l)+line*vec3(0.5,0.1,0.15)*0.6; col=mix(col,dead,uDim);
        gl_FragColor=vec4(col,uA*(1.0-uEx*0.75)); }` });
  const mesh = new THREE.Mesh(g, m); mats.crystal = m;
  const grp = new THREE.Group(); grp.add(mesh);
  const ringMat = new THREE.LineBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.6 });
  const ring = (rad, tilt) => { const pts = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * 6.2832; pts.push(new THREE.Vector3(Math.cos(a) * rad, 0, Math.sin(a) * rad)); } const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat.clone()); l.rotation.set(tilt[0], tilt[1], tilt[2]); return l; };
  const rings = [ring(2.6, [1.2, 0, 0.3]), ring(3.1, [0.4, 0, -0.9]), ring(3.6, [-0.9, 0, 0.5])]; rings.forEach((r) => grp.add(r)); grp.userData = { mesh, rings }; return grp;
}

// ---------- bars ----------
function makeBars() {
  const grp = new THREE.Group(); const cols = [C.red, C.amber, C.cyan]; const bars = [];
  const grid = new THREE.GridHelper(20, 20, 0x1c3550, 0x0d1a2a); grid.position.y = 0; grp.add(grid);
  cols.forEach((c, i) => {
    const b = new THREE.Group(); const geo = box(2.2, 1, 2.2); geo.translate(0, 0.5, 0);
    const body = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.32 }));
    const ed = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: c }));
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 }));
    b.add(body, ed, cap); b.userData = { cap, body, ed }; b.position.x = (i - 1) * 4.6; grp.add(b); bars.push(b);
  });
  grp.userData.bars = bars; return grp;
}

// ---------- gov panels ----------
const SITES = [
  { name: 'U.S. SECURITIES & EXCHANGE COMMISSION', url: 'sec.gov', col: '#5aa9ff' },
  { name: 'U.S. CENSUS BUREAU', url: 'census.gov / data API', col: '#ffb020' },
  { name: 'DEPT. OF EDUCATION · CIVIL RIGHTS', url: 'ed.gov / ocr', col: '#38f2a0' },
  { name: 'UN TRADE & DEVELOPMENT · STATISTICS', url: 'unctad.org / statistics', col: '#c58bff' },
];
export const RESULTS = [
  { tag: 'REPOSTED PUBLIC INFO', sub: 'No nonpublic data accessed', col: '#ffb020' },
  { tag: 'PULLED DATA · PUBLIC DEV KEYS', sub: 'Census data retrieved', col: '#ffb020' },
  { tag: 'BREACH ATTEMPT FAILED', sub: 'Civil-rights site held', col: '#38f2a0' },
  { tag: '≈16,500 SCANS', sub: 'Linked to OpenAI agents', col: '#ff2e4d' },
];
function panelCanvas(i, mode) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 640; const x = c.getContext('2d'); const s = SITES[i]; const r = rng(100 + i);
  if (mode === 'base') {
    x.fillStyle = '#0a1120'; x.fillRect(0, 0, 1024, 640);
    x.fillStyle = '#131d33'; x.fillRect(0, 0, 1024, 64); x.fillStyle = '#ff5f57'; x.beginPath(); x.arc(34, 32, 9, 0, 7); x.fill(); x.fillStyle = '#febc2e'; x.beginPath(); x.arc(64, 32, 9, 0, 7); x.fill(); x.fillStyle = '#28c840'; x.beginPath(); x.arc(94, 32, 9, 0, 7); x.fill();
    x.fillStyle = '#0a1120'; x.fillRect(130, 14, 700, 36); x.fillStyle = '#7f93b5'; x.font = '500 22px "JetBrains Mono"'; x.fillText('https://' + s.url, 146, 40);
    x.fillStyle = s.col; x.fillRect(0, 64, 1024, 6);
    x.fillStyle = '#e8eefc'; x.font = '700 34px "Space Grotesk"'; x.fillText(s.name, 36, 128);
    x.strokeStyle = '#1b2a48'; x.lineWidth = 2; for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(36, 190 + k * 42); x.lineTo(36 + 400 + r() * 380, 190 + k * 42); x.stroke(); }
    for (let k = 0; k < 14; k++) { const h = 40 + r() * 190; x.fillStyle = s.col + '55'; x.fillRect(560 + k * 30, 600 - h, 20, h); }
    x.fillStyle = '#243759'; for (let k = 0; k < 6; k++) x.fillRect(36, 420 + k * 26, 300 + r() * 160, 10);
  } else {
    x.clearRect(0, 0, 1024, 640);
    if (mode === 1) { // targeted
      x.strokeStyle = '#ff2e4d'; x.lineWidth = 8; x.strokeRect(6, 6, 1012, 628); x.fillStyle = 'rgba(255,46,77,0.10)'; x.fillRect(0, 0, 1024, 640);
      x.fillStyle = '#ff2e4d'; x.fillRect(0, 540, 1024, 100); x.fillStyle = '#fff'; x.font = '700 46px "JetBrains Mono"'; x.fillText('▲ TARGETED BY AGENTS', 36, 606);
    } else if (mode === 2) {
      const R = RESULTS[i]; x.strokeStyle = R.col; x.lineWidth = 8; x.strokeRect(6, 6, 1012, 628); x.fillStyle = 'rgba(5,8,16,0.72)'; x.fillRect(0, 0, 1024, 640);
      x.fillStyle = R.col; x.fillRect(0, 214, 1024, 212); x.fillStyle = '#05070d'; x.font = '700 50px "Space Grotesk"'; wrap(x, R.tag, 512, 292, 940, 58, 'center');
      x.font = '500 28px "JetBrains Mono"'; x.textAlign = 'center'; x.fillText(R.sub.toUpperCase(), 512, 398); x.textAlign = 'left';
    }
  }
  return c;
}
function wrap(x, text, cx, y, maxW, lh, align) { x.textAlign = align; const words = text.split(' '); let line = ''; const lines = []; for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW) { lines.push(line); line = w; } else line = t; } lines.push(line); const off = ((lines.length - 1) * lh) / 2 - 18; lines.forEach((l, k) => x.fillText(l, cx, y + k * lh - off)); x.textAlign = 'left'; }
const GP = [[-3.35, 2.2], [3.35, 2.2], [-3.35, -2.2], [3.35, -2.2]];
function makePanels() {
  const grp = new THREE.Group(); const items = [];
  GP.forEach(([px, py], i) => {
    const g = new THREE.Group(); g.position.set(px, py, 0); g.rotation.y = px < 0 ? 0.12 : -0.12; g.rotation.x = py > 0 ? -0.05 : 0.05;
    const tex = (mode) => { const t = new THREE.CanvasTexture(panelCanvas(i, mode)); t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; };
    const base = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4), new THREE.MeshBasicMaterial({ map: tex('base'), transparent: true }));
    const status = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, color: 0x9a9a9a })); status.position.z = 0.02;
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); flash.position.z = 0.04;
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(6.4, 4)), new THREE.LineBasicMaterial({ color: new THREE.Color(SITES[i].col), transparent: true })); frame.position.z = 0.03;
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6.9, 4.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(SITES[i].col), transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false })); shadow.position.z = -0.05;
    g.add(shadow, base, status, flash, frame); grp.add(g); items.push({ g, base, status, flash, frame, shadow, tex1: tex(1), tex2: tex(2), cur: 0 });
  });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...U, uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: 'uniform float uT,uA; varying vec2 vUv; void main(){ float y=fract(uT*1.3); float d=abs(vUv.y-y); float l=exp(-d*40.0); float g=step(0.5,fract(vUv.x*60.0))*0.12; gl_FragColor=vec4(vec3(1.0,0.2,0.3)*(l*1.6+g*l*2.0),uA*(l+0.05)); }' }));
  scan.position.set(0, 0, 0.06); items[3].g.add(scan);
  // beams from origin
  const beams = items.map((it, i) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -7.5, 1.5), new THREE.Vector3(GP[i][0], GP[i][1], 0.1)]), new THREE.LineBasicMaterial({ color: C.red, transparent: true, opacity: 0 })); grp.add(l); return l; });
  grp.userData = { items, scan, beams }; return grp;
}

// ---------- fallout models ----------
function makeCourthouse(withGavel) {
  const g = new THREE.Group(); const col = 0x5aa9ff;
  [[9, 0.3, 4.6, 0.15], [8.2, 0.3, 4.0, 0.45], [7.4, 0.3, 3.4, 0.75]].forEach(([w, h, d, y]) => { const s = bp(box(w, h, d), col); s.position.y = y; g.add(s); });
  for (let i = 0; i < 6; i++) { const c = bp(new THREE.CylinderGeometry(0.28, 0.28, 3, 14), col); c.position.set(-3 + i * 1.2, 2.4, 1.1); g.add(c); }
  const ent = bp(box(7.4, 0.5, 3.4), col); ent.position.y = 4.15; g.add(ent);
  const sh = new THREE.Shape(); sh.moveTo(-3.7, 0); sh.lineTo(3.7, 0); sh.lineTo(0, 1.5); sh.closePath(); const ped = bp(new THREE.ExtrudeGeometry(sh, { depth: 3.4, bevelEnabled: false }), col); ped.position.set(0, 4.4, -1.7); g.add(ped);
  const back = bp(box(6.4, 3, 2), col); back.position.set(0, 2.4, -0.6); g.add(back);
  if (withGavel) { const gv = new THREE.Group(); const head = bp(new THREE.CylinderGeometry(0.42, 0.42, 1.5, 18).rotateZ(Math.PI / 2), 0xffb020, { fill: 0x2a1a05 }); const han = bp(new THREE.CylinderGeometry(0.11, 0.11, 2.6, 10), 0xffb020, { fill: 0x2a1a05 }); han.rotation.z = 0; han.position.set(0, -1.3, 0); gv.add(head, han); gv.position.set(6.6, 3.6, 2.2); gv.userData.pivot = true; g.add(gv); g.userData.gavel = gv;
    const blk = bp(new THREE.CylinderGeometry(0.8, 0.9, 0.35, 20), 0xffb020, { fill: 0x2a1a05 }); blk.position.set(6.6, 0.32, 2.2); g.add(blk); }
  return g;
}
function makeCapitol() {
  const g = new THREE.Group(); const col = 0xc58bff;
  [[10, 0.3, 4.6, 0.15], [9.2, 0.3, 4.0, 0.45]].forEach(([w, h, d, y]) => { const s = bp(box(w, h, d), col); s.position.y = y; g.add(s); });
  const wing = bp(box(9, 2.4, 3.2), col); wing.position.y = 1.8; g.add(wing);
  for (let i = 0; i < 10; i++) { const c = bp(new THREE.CylinderGeometry(0.2, 0.2, 2.4, 12), col); c.position.set(-3.6 + i * 0.8, 1.8, 1.8); g.add(c); }
  const drum = bp(new THREE.CylinderGeometry(2.1, 2.3, 1.4, 32), col); drum.position.y = 3.7; g.add(drum);
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; const c = bp(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), col); c.position.set(Math.cos(a) * 2.05, 3.7, Math.sin(a) * 2.05); g.add(c); }
  const dome = bp(new THREE.SphereGeometry(2.0, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), col); dome.position.y = 4.4; g.add(dome);
  const lan = bp(new THREE.CylinderGeometry(0.35, 0.45, 0.9, 12), col); lan.position.y = 6.75; g.add(lan);
  const cone = bp(new THREE.ConeGeometry(0.4, 0.9, 12), col); cone.position.y = 7.6; g.add(cone); return g;
}
function makeChip() {
  const g = new THREE.Group(); const col = 0x38f2a0;
  const sub = bp(box(6, 0.4, 6), col); sub.position.y = 0.2; g.add(sub);
  const die = bp(box(3, 0.3, 3), col, { fill: 0x0a2a20 }); die.position.y = 0.55; g.add(die); g.userData.die = die;
  const r = rng(9); for (let s = 0; s < 4; s++) for (let i = 0; i < 12; i++) { const p = bp(box(0.16, 0.08, 0.5), col); const off = -2.5 + i * 0.46; const a = s * Math.PI / 2; p.position.set(Math.cos(a) * 3.25 - Math.sin(a) * off * 0 + (s % 2 === 0 ? off * (s === 0 ? 1 : -1) * 0 : 0), 0.2, 0); if (s % 2 === 0) { p.position.set(off, 0.2, (s === 0 ? 1 : -1) * 3.25); p.rotation.y = Math.PI / 2; } else { p.position.set((s === 1 ? 1 : -1) * 3.25, 0.2, off); } g.add(p); }
  const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints([...Array(65)].map((_, i) => new THREE.Vector3(Math.cos(i / 64 * 6.283) * 4.2, 0.4, Math.sin(i / 64 * 6.283) * 4.2))), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.5 })); g.add(ring);
  // shield: hexagon prism outline that closes around
  const hexG = new THREE.CylinderGeometry(5.4, 5.4, 0.2, 6, 1, true); const hex = new THREE.LineSegments(new THREE.EdgesGeometry(hexG), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.9 })); hex.position.y = 0.3; g.add(hex); g.userData.hex = hex;
  const N = 110; const pp = new Float32Array(N * 3); const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const dots = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); dots.frustumCulled = false; g.add(dots); g.userData.dots = dots; return g;
}

// ---------- layers + gate ----------
function makeLayers() {
  const grp = new THREE.Group(); const layers = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group(); const N = 14; const pts = [];
    for (let k = -N / 2; k <= N / 2; k++) { pts.push(k, 0, -N / 2, k, 0, N / 2, -N / 2, 0, k, N / 2, 0, k); }
    const l = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x35e0ff, transparent: true, opacity: 0.22 })); l.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x35e0ff, transparent: true, opacity: 0.035, side: THREE.DoubleSide, depthWrite: false }));
    g.add(l, plate); grp.add(g); layers.push({ g, l, plate });
  }
  grp.userData.layers = layers; return grp;
}
function makeGate() {
  const g = new THREE.Group(); const col = 0xffb020;
  [-4.2, 4.2].forEach((x) => { const p = bp(box(1.2, 8, 1.2), col); p.position.set(x, 4, 0); g.add(p); });
  const top = bp(box(10, 1, 1.4), col); top.position.y = 8.5; g.add(top);
  const bar = bp(box(7.2, 1.2, 0.8), 0xff2e4d, { fill: 0x2a0710 }); g.add(bar); g.userData.bar = bar;
  const rails = []; for (let i = 0; i < 6; i++) { const r = bp(box(0.15, 8, 0.15), col); r.position.set(-3.5 + i * 1.4, 4, 0); g.add(r); rails.push(r); } g.userData.rails = rails;
  return g;
}

// ---------- init ----------
export function initWorld(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.setClearColor(0x03050a, 1); renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x03050a, 0.012);
  camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 400);

  const stars = (() => { const r = rng(2); const n = 900, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const d = 60 + r() * 80, th = r() * 6.283, ph = Math.acos(2 * r() - 1); p.set([d * Math.sin(ph) * Math.cos(th), d * Math.cos(ph), d * Math.sin(ph) * Math.sin(th)], i * 3); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: 0x6a86b8, size: 0.35, sizeAttenuation: true, transparent: true, opacity: 0.55, fog: false })); })();
  const floor = new THREE.GridHelper(120, 60, 0x102038, 0x0a1424); floor.position.y = -4.2; floor.material.transparent = true; floor.material.opacity = 0.7;
  scene.add(stars, floor);

  const O = { cube: makeCube(), agents: makeAgents(), net: makeNet(), tiles: makeTiles(), crystal: makeCrystal(), bars: makeBars(), gov: makePanels(), layers: makeLayers(), gate: makeGate(),
    court: makeCourthouse(true), capitol: makeCapitol(), chip: makeChip(), court2: makeCourthouse(false), stars, floor };
  O.court.position.set(-16, -4, 0); O.capitol.position.set(0, -4, 0); O.chip.position.set(16, -4, 0);
  O.court2.position.set(0, -4.2, -3); O.court2.scale.setScalar(1.4);
  O.fallout = new THREE.Group(); O.fallout.add(O.court, O.capitol, O.chip);
  O.gate.position.set(0, -4.2, 0);
  Object.entries(O).forEach(([k, o]) => { if (o !== stars && o !== floor && !['court', 'capitol', 'chip'].includes(k)) scene.add(o); });
  O.crystal.position.set(0, 0, 0);
  window.__O = O;

  composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.85, 0.7, 0.16); composer.addPass(bloom);
  fxPass = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uAmt: { value: 0 }, uT: { value: 0 }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color(1, 1, 1) }, uVig: { value: 0.55 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt,uT,uFlash,uVig; uniform vec3 uFlashCol; varying vec2 vUv;
      float h(float x){ return fract(sin(x*91.345)*47453.5453); }
      void main(){ vec2 uv=vUv; float band=step(0.92,h(floor(uv.y*38.0)+floor(uT*20.0)))*uAmt; uv.x+=band*0.06*(h(floor(uT*20.0))-0.5)*2.0;
        float a=0.002+uAmt*0.011; vec3 c; c.r=texture2D(tDiffuse,uv+vec2(a,0.0)).r; c.g=texture2D(tDiffuse,uv).g; c.b=texture2D(tDiffuse,uv-vec2(a,0.0)).b;
        float v=smoothstep(1.05,0.25,length((vUv-0.5)*vec2(1.25,1.0))); c*=mix(1.0,v,uVig); c+=uFlashCol*uFlash;
        c+=(h(uv.x*300.0+uv.y*700.0+uT)-0.5)*0.028; gl_FragColor=vec4(c,1.0); }` });
  composer.addPass(fxPass);
  return O;
}

const _v = new THREE.Vector3();
export function project(x, y, z) { _v.set(x, y, z).project(camera); return [(_v.x * 0.5 + 0.5) * W, (-_v.y * 0.5 + 0.5) * H, _v.z]; }

export function render(t, cuesT) {
  const o = window.__O; if (!o) return;
  const a = S.a; U.uT.value = t; U.uSim.value = S.sim;
  // camera
  const c = S.cam; const sh = S.shake;
  const dx = Math.sin(t * 0.37) * 0.35 + (Math.sin(t * 61) * sh * 0.35), dy = Math.cos(t * 0.29) * 0.22 + (Math.cos(t * 53) * sh * 0.3);
  camera.position.set(c.x + dx, c.y + dy, c.z); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.lookAt(c.lx, c.ly, c.lz); camera.rotateZ(c.roll + Math.sin(t * 47) * sh * 0.01);
  const scale = H / (2 * Math.tan((c.fov * Math.PI) / 360));

  // cube + agents
  const cubeOn = a.cube; o.cube.visible = cubeOn > 0.003; o.cube.scale.setScalar(S.cubeScale); o.cube.rotation.y = S.cubeRot + Math.sin(t * 0.3) * 0.08; o.cube.rotation.x = Math.sin(t * 0.21) * 0.05;
  const cubeCol = new THREE.Color(C.cyan).lerp(new THREE.Color(C.ice), S.ice).lerp(new THREE.Color(C.red), S.red);
  const flick = S.red > 0.05 ? 0.75 + 0.25 * Math.sin(t * 40) : 1;
  mats.cube.uniforms.uCol.value.copy(cubeCol); mats.cube.uniforms.uA.value = cubeOn * flick; mats.cube.uniforms.uBreach.value = S.breach;
  const ed = o.cube.userData.edges; ed.material.color.copy(cubeCol); ed.material.opacity = cubeOn * flick; o.cube.userData.core.material.opacity = 0.16 * cubeOn * (1 - S.breach * 0.7);
  o.agents.visible = a.agents > 0.003; o.agents.scale.copy(o.cube.scale.clone().setScalar(1)); o.agents.rotation.copy(o.cube.rotation);
  const am = mats.agents.uniforms; am.uEsc.value = S.esc; am.uGlobe.value = S.globeM; am.uFrac.value = S.frac; am.uScale.value = scale; am.uA.value = a.agents * S.agentA; am.uRed.value = S.red; am.uIce.value = S.ice;
  o.net.visible = a.globe > 0.003; o.net.userData.wire.material.opacity = 0.12 * a.globe; o.net.userData.arcs.material.uniforms.uA.value = a.globe; o.net.rotation.y = S.sim * 0.06;
  // tiles
  o.tiles.visible = a.tiles > 0.003; const tm = mats.tiles.uniforms; tm.uLaunch.value = S.tiles.launch; tm.uPix.value = S.tiles.pix; tm.uRed.value = S.tiles.red; tm.uDim.value = S.tiles.dim; tm.uA.value = a.tiles;
  // crystal
  const cr = o.crystal; cr.visible = a.crystal > 0.003; cr.position.set(0, S.crystal.y, S.crystal.z); cr.scale.setScalar(S.crystal.s); cr.rotation.y = t * 0.35; cr.rotation.x = Math.sin(t * 0.5) * 0.3;
  const cm = mats.crystal.uniforms; cm.uEx.value = S.crystal.ex; cm.uDim.value = S.crystal.dim; cm.uGl.value = S.crystal.gl; cm.uA.value = a.crystal;
  cr.userData.rings.forEach((r, i) => { r.rotation.y = t * (0.5 + i * 0.3) * (i % 2 ? -1 : 1); r.material.opacity = 0.6 * a.crystal * (1 - S.crystal.ex) * (1 - S.crystal.dim * 0.7); r.material.color.set(S.crystal.dim > 0.5 ? 0x777788 : C.cyan); });
  // bars
  const bg = o.bars; bg.visible = a.bars > 0.003; const HT = [29.2, 6.3, 0.0]; const scaleB = 0.235;
  bg.userData.bars.forEach((b, i) => { const hgt = Math.max(0.05, HT[i] * scaleB * S.bars[i]); b.scale.y = hgt; b.children[2].position.y = hgt + 0.01; b.children[2].scale.y = 1 / Math.max(hgt, 0.001) * 0.0 + 1; b.children.forEach((k) => { if (k.material) k.material.opacity = (k === b.children[0] ? 0.3 : 1) * a.bars; });
    if (S.labels[i]) { const [px, py] = project(b.position.x + bg.position.x, hgt + 0.7 + bg.position.y, 0); const [bx, by] = project(b.position.x + bg.position.x, bg.position.y - 0.9, 1.2); S.labels[i](px, py, a.bars, bx, by); } });
  // gov
  const gv = o.gov; gv.visible = a.gov > 0.003; const gu = gv.userData;
  gu.items.forEach((it, i) => { const st = S.gstate[i]; if (st !== it.cur) { it.cur = st; it.status.material.map = st === 1 ? it.tex1 : st === 2 ? it.tex2 : null; it.status.material.needsUpdate = true; }
    it.status.material.opacity = st ? a.gov : 0; it.base.material.opacity = a.gov; it.flash.material.opacity = S.gflash[i] * 0.1 * a.gov; it.frame.material.opacity = a.gov; it.shadow.material.opacity = 0.06 * a.gov + S.gflash[i] * 0.1;
    it.g.position.z = S.gflash[i] * 0.35; gu.beams[i].material.opacity = Math.min(1, S.gflash[i] * 1.5) * a.gov; });
  gu.scan.material.uniforms.uA.value = S.scan * a.gov;
  // fallout
  o.fallout.visible = a.fall > 0.003; o.fallout.position.x = 0;
  fade(o.fallout, a.fall);
  o.chip.userData.hex.scale.setScalar(1 + (1 - S.fall.chip) * 1.6); o.chip.userData.hex.material.opacity = 0.9 * S.fall.chip * a.fall; o.chip.userData.die.children[1].material.color.setHex(S.fall.chip > 0.5 ? 0x9dffd6 : 0x38f2a0);
  { const P = o.chip.userData.dots.geometry.attributes.position; const n = P.count; const shown = Math.floor(S.fall.dots * n);
    for (let i = 0; i < n; i++) { const th = i / n * 6.283 * 3 + t * 0.4 * (1 + (i % 3) * 0.3); const rr = 4.6 + (i % 5) * 0.35; const on = i < shown; P.setXYZ(i, on ? Math.cos(th) * rr : 0, on ? 0.6 + Math.sin(th * 2 + i) * 0.5 : -50, on ? Math.sin(th) * rr : 0); } P.needsUpdate = true; o.chip.userData.dots.material.opacity = a.fall; }
  if (o.court.userData.gavel) { const gv2 = o.court.userData.gavel; gv2.rotation.z = -0.9 + S.fall.gavel * 0.9 * 1.0 + (S.fall.gavel > 0.98 ? 0 : 0); gv2.rotation.z = 0.9 - S.fall.gavel * 1.2; }
  // layers + gate + court2
  const ly = o.layers; ly.visible = a.layers > 0.003; ly.userData.layers.forEach((L, i) => { L.g.position.y = (i - 2) * (1.5 + S.layers.spread * 1.2); const hot = i === 2 ? S.layers.hot : 0; L.l.material.color.set(hot > 0.02 ? new THREE.Color(C.cyan).lerp(new THREE.Color(C.red), hot) : C.cyan); L.l.material.opacity = (0.16 + hot * 0.7) * a.layers; L.plate.material.color.copy(L.l.material.color); L.plate.material.opacity = (0.03 + hot * 0.18) * a.layers; L.g.rotation.y = i * 0.05 + t * 0.03 * (i % 2 ? 1 : -1); L.g.scale.setScalar(1 + (i === 2 ? S.layers.crack * 0.02 * Math.sin(t * 30) : 0)); });
  const ga = o.gate; ga.visible = a.gate > 0.003; fade(ga, a.gate); ga.userData.bar.position.y = 9.0 - S.gateV * 6.4;
  const c2 = o.court2; c2.visible = a.court > 0.003; fade(c2, a.court); c2.scale.setScalar(1.4 * (0.9 + 0.1 * S.courtS));
  o.floor.visible = true;

  // post
  fxPass.uniforms.uAmt.value = S.glitch; fxPass.uniforms.uT.value = t; fxPass.uniforms.uFlash.value = S.flash;
  bloom.strength = 0.8 - 0.4 * a.gov - 0.35 * a.tiles - 0.2 * a.bars - 0.3 * a.crystal + S.flash * 0.6;
  composer.render();
}

export function refreshTextures() {
  const it = window.__O.gov.userData.items;
  it.forEach((x, i) => { [['base', x.base.material.map, 'base'], ['t1', x.tex1, 1], ['t2', x.tex2, 2]].forEach(([, tex, mode]) => { tex.image = panelCanvas(i, mode); tex.needsUpdate = true; }); });
}
