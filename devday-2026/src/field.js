// The dot field: 16,384 GPU particles that morph between shapes stored in a float texture.
// Shapes are baked once (text is sampled from canvas after the display font has loaded),
// and every frame is a pure function of (from, to, morph, time) so any frame can be rendered in isolation.
import * as THREE from 'three';
import { rng, PAL } from './util.js';

const SIDE = 128, N = SIDE * SIDE;
export const SH = { SCATTER: 0, DEVDAY: 1, TWENTY: 2, GLOBE: 3, BALLS: 4, CUBE: 5, GRID: 6, QUESTION: 7 };
const K = 8;
export const DOT_X = [-4.4, -2.2, 0, 2.2, 4.4], DOT_Y = -0.95;

// Text -> points. Bounds come from measureText and each particle does its own seeded rejection sampling,
// so the (noised) canvas readback in some Chrome builds can only move a handful of edge particles, never reshuffle all of them.
function textPoints(text, font, heightWorld, seed, yOff = 0) {
  const W = 2048, H = 512; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true });
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.font = font; x.fillText(text, W / 2, 400);
  const mt = x.measureText(text); const x0 = Math.floor(W / 2 - mt.actualBoundingBoxLeft), x1 = Math.ceil(W / 2 + mt.actualBoundingBoxRight), y0 = Math.floor(400 - mt.actualBoundingBoxAscent), y1 = Math.ceil(400 + mt.actualBoundingBoxDescent);
  const d = x.getImageData(0, 0, W, H).data; const s = heightWorld / (y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return (i) => { const r = rng(seed * 100003 + i * 7919); let px = cx, py = cy;
    for (let k = 0; k < 400; k++) { const X = x0 + r() * (x1 - x0), Y = y0 + r() * (y1 - y0); if (d[((Y | 0) * W + (X | 0)) * 4] > 128) { px = X; py = Y; break; } }
    return [(px - cx) * s, -(py - cy) * s + yOff, (r() - 0.5) * 0.35]; };
}

export function bakeShapes(tex) {
  const data = tex.image.data; const r = rng(7);
  const put = (k, i, p, extra = 0) => { const o = ((k * SIDE * SIDE) + i) * 4; data[o] = p[0]; data[o + 1] = p[1]; data[o + 2] = p[2]; data[o + 3] = extra; };
  const disp = '900 330px Unbounded';
  const devday = textPoints('DEVDAY', disp, 2.0, 1, 0.35), twenty = textPoints('20+', '900 330px Unbounded', 4.4, 2, 0.2), qm = textPoints('?', '900 400px Unbounded', 6.2, 3, 0.6);
  for (let i = 0; i < N; i++) {
    // 0 scatter: tilted spiral galaxy + a loose halo
    { const arm = i % 3, rad = 0.8 + Math.pow(r(), 0.65) * 10.5, a = arm * 2.094 + rad * 0.55 + (r() - 0.5) * 0.9;
      const halo = r() < 0.18; const p = halo ? [(r() - 0.5) * 34, (r() - 0.5) * 20, (r() - 0.5) * 20 - 4] : [Math.cos(a) * rad, (r() - 0.5) * 0.6 * (1.4 - rad / 12), Math.sin(a) * rad];
      put(0, i, p); }
    put(1, i, devday(i)); put(2, i, twenty(i));
    // 3 globe (fibonacci) + thin atmosphere
    { const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i; const R = r() < 0.12 ? 4.9 + r() * 0.6 : 4.6; put(3, i, [Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R]); }
    // 4 five balls at the dot characters' resting spots
    { const b = i % 5; const u = r() * 2 - 1, t = r() * 6.2832, rr = Math.sqrt(1 - u * u), R = 0.98 + r() * 0.05; put(4, i, [DOT_X[b] + Math.cos(t) * rr * R, DOT_Y + u * R, Math.sin(t) * rr * R]); }
    // 5 cube volume (data inside the vault)
    put(5, i, [(r() - 0.5) * 3.0, (r() - 0.5) * 3.0 + 0.25, (r() - 0.5) * 3.0]);
    // 6 dot wall
    { const gx = i % SIDE, gy = Math.floor(i / SIDE); put(6, i, [(gx / (SIDE - 1) - 0.5) * 34, (gy / (SIDE - 1) - 0.5) * 19, -7 + Math.sin(gx * 0.19) * Math.cos(gy * 0.23) * 0.4]); }
    put(7, i, qm(i));
  }
  tex.needsUpdate = true;
}

export function makeField(U) {
  const tex = new THREE.DataTexture(new Float32Array(SIDE * SIDE * K * 4), SIDE, SIDE * K, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const r = rng(99);
  const idx = new Float32Array(N * 2), seed = new Float32Array(N * 4), pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { idx.set([(i % SIDE + 0.5) / SIDE, Math.floor(i / SIDE)], i * 2); seed.set([r(), r(), r(), r()], i * 4); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aIdx', new THREE.BufferAttribute(idx, 2)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...U, uShapes: { value: tex }, uA: { value: 0 }, uB: { value: 0 }, uM: { value: 0 }, uSize: { value: 0.09 }, uScale: { value: 900 }, uAlpha: { value: 0 },
      uFlow: { value: 0 }, uLaneA: { value: 0 }, uLaneR: { value: 0 }, uRed: { value: 0 }, uPulse: { value: 0 }, uSwirl: { value: 2.2 }, uWhite: { value: 0 }, uCollapse: { value: 0 },
      uPal: { value: PAL.map((c) => new THREE.Color(c)) } },
    vertexShader: `
      uniform sampler2D uShapes; uniform float uA,uB,uM,uT,uSize,uScale,uFlow,uLaneA,uLaneR,uRed,uPulse,uSwirl,uWhite,uCollapse; uniform vec3 uPal[6];
      attribute vec2 aIdx; attribute vec4 aSeed; varying vec3 vCol; varying float vA;
      vec3 sp(float k){ return texture2D(uShapes, vec2(aIdx.x, (aIdx.y + k*128.0 + 0.5)/1024.0)).xyz; }
      void main(){
        vec3 pa = sp(uA), pb = sp(uB);
        float d = aSeed.x*0.4; float m = clamp((uM-d)/0.6,0.0,1.0); float e = m<0.5 ? 4.0*m*m*m : 1.0-pow(-2.0*m+2.0,3.0)/2.0;
        vec3 n = (aSeed.yzw-0.5)*2.0;
        vec3 p = mix(pa,pb,e) + n*sin(3.14159*e)*uSwirl;
        p += 0.035*vec3(sin(uT*1.7+aSeed.x*40.0), cos(uT*1.3+aSeed.y*40.0), sin(uT*1.1+aSeed.z*40.0));
        p = mix(p, vec3(0.0,0.25,0.0) + n*0.08, uCollapse*uCollapse);
        // decision-routing flow: stream converges into a node, then splits into approve / reject lanes
        float lane = step(0.5, aSeed.z);
        float ft = fract(aSeed.x + uT*(0.16+aSeed.y*0.12));
        vec3 fp;
        if (ft < 0.5) { float s = ft/0.5; fp = vec3(mix(-11.0, 0.0, s), (aSeed.w-0.5)*3.4*(1.0-s*s), (aSeed.y-0.5)*1.4*(1.0-s)); }
        else { float s = (ft-0.5)/0.5; float y = mix(0.0, lane>0.5 ? 2.9 : -2.9, smoothstep(0.0,0.55,s)); fp = vec3(s*10.5, y + (aSeed.w-0.5)*0.5*s, (aSeed.y-0.5)*0.6*s); }
        p = mix(p, fp, uFlow);
        vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv;
        float sz = uSize*(0.55+aSeed.y*0.9)*(1.0+uPulse*1.2*aSeed.z);
        gl_PointSize = max(1.0, sz*uScale/(-mv.z));
        int ci = int(floor(aSeed.w*5.999)); vec3 c = uPal[0];
        for (int k=0;k<6;k++){ if (k==ci) c = uPal[k]; }
        c = mix(c, vec3(1.0), uWhite*0.7);
        float after = step(0.5, ft)*uFlow;
        vec3 fc = mix(vec3(0.85,0.9,1.0), lane>0.5 ? vec3(0.2,1.0,0.6) : vec3(1.0,0.2,0.3), after);
        float laneB = mix(1.0, 0.35 + 0.65*(lane>0.5 ? uLaneA : uLaneR) + 0.3, after);
        c = mix(c, fc*laneB, uFlow);
        c = mix(c, vec3(1.0,0.12,0.18)*(0.5+0.5*aSeed.z), uRed);
        vCol = c; vA = 0.4 + 0.3*sin(aSeed.z*30.0 + uT*2.5);
      }`,
    fragmentShader: `
      uniform float uAlpha; varying vec3 vCol; varying float vA;
      void main(){ float r = length(gl_PointCoord-0.5)*2.0; float core = 1.0-smoothstep(0.5,0.78,r); float halo = exp(-r*r*3.5)*0.45;
        float a = (core+halo)*vA*uAlpha; if (a < 0.004) discard; gl_FragColor = vec4(vCol*(core*1.1+halo*0.8), a); }`,
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.userData.tex = tex; pts.userData.mat = m;
  return pts;
}
