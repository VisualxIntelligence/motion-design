/* global gsap */
// GSAP choreography. Every visual beat is keyed to a word cue from build/data.js (ElevenLabs word timestamps).
// Frames are pure functions of time: tweens set state, impulses/counters/typing are evaluated from t in drive().
import DATA from '../build/data.js';
import { S, initWorld, render, project, DOT_X, DOT_Y } from './world.js';
import { SH } from './field.js';
import { HEX } from './util.js';
import { scenes } from './scenes.js';

const D = DATA, Q = D.cues, DUR = D.duration;
window.__cues = Q;

export const K = { tl: null, O: null, dyn: [], IMP: { shake: [], whip: [], flash: [], glitch: [], ab: [], pulse: [] } };
export const q = (id, off = 0) => { if (Q[id] === undefined) throw new Error('missing cue ' + id); return Q[id] + off; };
export const scn = (id) => D.timing.scenes.find((s) => s.id === id);
export const st = (id) => scn(id).start, en = (id) => scn(id).end;
export { S, SH, DOT_X, DOT_Y, HEX, DUR, project };
const cl = (x) => Math.max(0, Math.min(1, x));
export const eo = (x) => 1 - Math.pow(1 - cl(x), 3);

// ---------- DOM helpers
const ui = () => document.getElementById('ui');
export function el(html, css = '', cls = '', anchor = '') {
  const d = document.createElement('div'); d.className = 'abs ' + cls; d.style.cssText = css; d.innerHTML = html; ui().appendChild(d);
  if (anchor === 'c') gsap.set(d, { xPercent: -50 }); else if (anchor === 'cc') gsap.set(d, { xPercent: -50, yPercent: -50 }); else if (anchor === 'r') gsap.set(d, { xPercent: -100 });
  return d;
}
export const inn = (e, t, d = 0.45, from = { y: 40 }, to = {}) => K.tl.fromTo(e, { autoAlpha: 0, ...from }, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: d, ease: 'power3.out', ...to }, t);
export const out = (e, t, d = 0.3, to = {}) => K.tl.to(e, { autoAlpha: 0, duration: d, ease: 'power2.in', ...to }, t);
export const slam = (e, t, s0 = 1.6, rot = 0) => K.tl.fromTo(e, { autoAlpha: 0, scale: s0, rotation: rot }, { autoAlpha: 1, scale: 1, rotation: rot, duration: 0.3, ease: 'expo.out' }, t);
export const pop = (e, t, d = 0.5) => K.tl.fromTo(e, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: d, ease: 'back.out(2.4)' }, t);
export const dyn = (fn) => K.dyn.push(fn);
export function count(e, a, b, t, d, fmt = (v) => Math.round(v).toLocaleString('en-US')) { dyn((T) => { const s = fmt(a + (b - a) * eo((T - t) / d)); if (e.textContent !== s) e.textContent = s; }); }
// progressive typing of [text, className] segments
export function type(e, segs, t, cps = 38, caret = true) {
  const total = segs.reduce((n, s) => n + s[0].length, 0);
  dyn((T) => { let n = Math.floor(cl((T - t) * cps / total) * total); if (T < t) n = 0; let h = '';
    for (const [s, c] of segs) { if (n <= 0) break; const part = s.slice(0, n); n -= part.length; h += c ? `<span class="${c}">${part}</span>` : part; }
    if (caret && T >= t && T < t + total / cps + 0.5) h += '<span style="opacity:.8">▍</span>';
    if (e.innerHTML !== h) e.innerHTML = h; });
}
export function pin(e, fn, dx = 0, dy = 0) { dyn((T) => { if (e.style.visibility === 'hidden') return; const [x, y] = project(...fn(T)); e.style.left = (x + dx).toFixed(1) + 'px'; e.style.top = (y + dy).toFixed(1) + 'px'; }); }

// ---------- world helpers
export const cam = (t, d, pose, ease = 'power2.inOut') => K.tl.to(S.cam, { ...pose, duration: d, ease }, t);
export const camSet = (t, pose) => K.tl.set(S.cam, pose, t);
export const to = (obj, t, d, props, ease = 'power2.inOut') => K.tl.to(obj, { ...props, duration: d, ease }, t);
export const set = (obj, t, props) => K.tl.set(obj, props, t);
export function morph(t, A, B, d = 1.0) { K.tl.set(S.field, { A, B, m: 0 }, t); K.tl.to(S.field, { m: 1, duration: d, ease: 'none' }, t); }
export const burst = (t, x, y, z, s = 1) => K.O.bursts.add(t, x, y, z, s);
const push = (k, t, a, d) => K.IMP[k].push([t, a, d]);
export const shake = (t, a = 1, d = 0.6) => push('shake', t, a, d);
export const flash = (t, a = 0.35, d = 0.35) => push('flash', t, a, d);
export const glitch = (t, a = 1, d = 0.4) => push('glitch', t, a, d);
export const pulse = (t, a = 1, d = 0.6) => push('pulse', t, a, d);
export const ab = (t, a = 1, d = 0.5) => push('ab', t, a, d);
// whip transition centred on t: directional blur bump + small flash
export const whip = (t, dir = 1, a = 1) => { K.IMP.whip.push([t, a * dir, 0]); push('ab', t, 0.6, 0.4); };
const decay = (k, t) => { let m = 0; for (const [t0, a, d] of K.IMP[k]) { const x = (t - t0) / d; if (x >= 0 && x < 1) m = Math.max(m, a * (1 - x) * (1 - x)); } return m; };
const bump = (t) => { let m = 0; for (const [t0, a] of K.IMP.whip) { const x = (t - t0) / 0.11; const v = a * Math.exp(-x * x); if (Math.abs(v) > Math.abs(m)) m = v; } return m; };

// ---------- build
async function build() {
  await Promise.all(['900 100px Unbounded', '800 100px Unbounded', '700 20px "Space Grotesk"', '600 20px "Space Grotesk"', '500 20px "Space Grotesk"', '700 20px "JetBrains Mono"', '500 20px "JetBrains Mono"'].map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  K.O = await initWorld(document.getElementById('gl'));
  const tl = K.tl = gsap.timeline({ paused: true });

  hud(); captions();
  scenes();

  tl.fromTo('#fadein', { opacity: 1 }, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 0);
  tl.fromTo('#fadeout', { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power1.in' }, DUR - 0.9);
  tl.set({}, {}, DUR);

  // One render per seek batch, whatever seeks us (onUpdate may be suppressed by the host).
  let pending = false, lastT = -1;
  const drive = () => { pending = false; const t = tl.time(); lastT = t;
    S.shake = decay('shake', t); S.flash = decay('flash', t); S.glitch = decay('glitch', t); S.ab = decay('ab', t); S.field.pulse = decay('pulse', t);
    const w = bump(t); S.whip = Math.abs(w); S.whipDir = w < 0 ? -1 : 1;
    for (const f of K.dyn) f(t);
    render(t); };
  const schedule = () => { if (!pending) { pending = true; queueMicrotask(drive); } };
  const tt = tl.totalTime.bind(tl);
  tl.totalTime = function (...a) { const r = tt(...a); if (a.length) schedule(); return r; };
  tl.eventCallback('onUpdate', schedule);
  window.__render = drive; window.__tl = tl; void lastT;
  tl.totalTime(0); drive();
  return { tl }; // not the timeline itself: GSAP timelines are thenables and would never resolve
}

// ---------- HUD: brand, section, launch counter, progress
function hud() {
  const tl = K.tl;
  const h = el(`<div id="hudL"><span class="dots5">${HEX.slice(0, 5).map((c) => `<span style="background:${c}"></span>`).join('')}</span><span class="tag" style="color:var(--tx);font-size:20px">OPENAI DEVDAY 2026</span><span class="tag" style="font-size:20px">· SEP 29 · RECAP</span></div><div id="sect"></div>`, '', '');
  h.id = 'hud'; h.classList.remove('abs'); tl.fromTo(h, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.6 }, q('devday') + 0.2);
  const sect = h.querySelector('#sect');
  const scs = D.timing.scenes.map((s) => ({ t: s.start - 0.05, label: D.story.scenes.find((x) => x.id === s.id).sect }));
  dyn((T) => { let l = scs[0].label; for (const s of scs) if (T >= s.t) l = s.label; if (sect.textContent !== l) sect.textContent = l; });
  // progress with section ticks
  const pg = document.createElement('div'); pg.id = 'prog'; pg.innerHTML = '<div id="progB"></div>'; document.getElementById('root').appendChild(pg);
  const seen = new Set(); D.timing.scenes.forEach((s) => { const lab = D.story.scenes.find((x) => x.id === s.id).sect; if (seen.has(lab)) return; seen.add(lab); const tk = document.createElement('div'); tk.className = 'tick'; tk.style.left = (s.start / DUR * 100) + '%'; pg.appendChild(tk); });
  const pb = pg.querySelector('#progB'); dyn((T) => { pb.style.width = (T / DUR * 100).toFixed(2) + '%'; });
  // launch counter + toasts
  const L = [['dots', 'DOTS', 0], ['sol', 'GPT-6.1 SOL', 1], ['ultrafast', 'ULTRAFAST', 3], ['pro500', 'PRO 500', 4], ['agentsapi', 'AGENTS API', 2], ['aws', 'BEDROCK MANAGED AGENTS', 1], ['decisions', 'DECISIONS API', 3],
    ['runtimes', 'CODEX CLOUD', 2], ['voiceS', 'CODEX CLI · VOICE', 4], ['review', 'CODEX CODE REVIEW', 0], ['security', 'CODEX SECURITY CLOUD', 1], ['opensrc', 'OPEN-SOURCE HARNESS', 2], ['signin', 'SIGN IN WITH CHATGPT', 3],
    ['plugins', 'PLUGIN EXTENSIONS', 4], ['space', 'CHATGPT SPACE', 0], ['pages', 'PAGES', 1], ['slidesC', 'COLLABORATIVE SLIDES', 2], ['mention', '@CHATGPT IN SLACK + TEAMS', 3], ['private', 'PRIVATE INTELLIGENCE', 4], ['market', 'OPENAI MARKETPLACE', 0]];
  const lc = el(`<div class="tag" style="font-size:16px">LAUNCHES COVERED</div><div id="lcN">00<span class="dim" style="font-size:24px"> / 20+</span></div>`, 'right:48px;bottom:118px;text-align:right', ''); lc.id = 'lc';
  tl.fromTo(lc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, q('dots') - 0.2); tl.to(lc, { autoAlpha: 0, duration: 0.4 }, st('backdrop') - 0.2);
  const lcN = lc.querySelector('#lcN'); const times = L.map(([id]) => q(id));
  dyn((T) => { const n = times.filter((x) => T >= x).length; const s = String(n).padStart(2, '0'); if (lcN.firstChild.textContent !== s) lcN.firstChild.textContent = s; });
  L.forEach(([id, name, c], i) => { const t0 = q(id); const nxt = times[i + 1] ?? t0 + 2; const tEnd = Math.min(t0 + 1.9, nxt - 0.05);
    const ts = document.createElement('div'); ts.className = 'toast'; ts.style.color = HEX[c]; ts.innerHTML = `+ ${name}`; ui().appendChild(ts);
    tl.fromTo(ts, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.25, ease: 'back.out(2)' }, t0); tl.to(ts, { autoAlpha: 0, x: 20, duration: 0.2 }, tEnd - 0.2);
    tl.fromTo(lcN, { scale: 1.35, color: HEX[c] }, { scale: 1, color: '#f4f6ff', duration: 0.4, ease: 'power3.out' }, t0); });
}

// ---------- word-synced captions: chunk appears, each word lights up as it is spoken
function captions() {
  const tl = K.tl; const caps = document.getElementById('caps'); const norm = (s) => s.toLowerCase().replace(/[^a-z0-9'\-]/g, '');
  const fix = { 'at-mention': '@mention' };
  D.timing.scenes.forEach((sc) => {
    const hl = new Set(D.story.scenes.find((s) => s.id === sc.id).hl.map(norm)); const chunks = []; let cur = [];
    sc.words.forEach((w, i) => { cur.push(w); const txt = cur.map((x) => x.w).join(' '); const end = /[.?!:;]$/.test(w.w) || (/,$/.test(w.w) && cur.length >= 3) || cur.length >= 6 || txt.length > 30; if (end || i === sc.words.length - 1) { chunks.push(cur); cur = []; } });
    chunks.forEach((ch, ci) => {
      const t0 = sc.start + ch[0].start - 0.05; const nx = chunks[ci + 1]; const t1 = nx ? sc.start + nx[0].start - 0.05 : sc.end + 0.2;
      const d = document.createElement('div'); d.className = 'cap';
      ch.forEach((w) => { const s = document.createElement('span'); const raw = fix[w.w] || w.w; s.textContent = raw.replace(/[.,?!:;]+$/, ''); if (hl.has(norm(w.w))) s.className = 'h'; d.appendChild(s);
        tl.fromTo(s, { opacity: 0.32, y: 4 }, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, sc.start + w.start - 0.02); });
      caps.appendChild(d); gsap.set(d, { xPercent: -50 });
      tl.fromTo(d, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'power3.out' }, t0);
      tl.set(d, { autoAlpha: 0 }, Math.max(t0 + 0.16, t1 - 0.01));
    });
  });
}

window.__sceneReady = build();
