// Scene choreography, one block per voice-over scene. All times come from word cues: q('cue').
import { K, q, st, en, eo, S, SH, DOT_X, DOT_Y, HEX, DUR, el, inn, out, slam, pop, dyn, count, type, pin, cam, camSet, to, set, morph, burst, shake, flash, glitch, pulse, ab, whip } from './timeline.js';

const ALL = [0, 1, 2, 3, 4];
const dotsTo = (idx, t, d, props, ease = 'power2.inOut', stagger = 0) => idx.forEach((i, k) => to(S.dots[i], t + k * stagger, d, typeof props === 'function' ? props(i, k) : props, ease));
const hop = (i, t, amp = 0.6, d = 0.55) => { K.tl.to(S.dots[i], { hop: amp, duration: 0.08, ease: 'none' }, t); K.tl.to(S.dots[i], { hop: 0, duration: d, ease: 'power2.in' }, t + 0.08); };
const squash = (i, t, a = 0.25) => { K.tl.to(S.dots[i], { sq: a, duration: 0.07, ease: 'power2.out' }, t); K.tl.to(S.dots[i], { sq: 0, duration: 0.5, ease: 'elastic.out(1.2,0.35)' }, t + 0.07); };
const fieldA = (t, a, d = 0.4) => to(S.field, t, d, { a }, 'power1.inOut');
const on = (o, t, d = 0.4, ease = 'power2.out') => to(o, t, d, { a: 1 }, ease);
const off = (o, t, d = 0.35, ease = 'power2.in') => to(o, t, d, { a: 0 }, ease);
const W = (s, c) => `<span class="${c}">${s}</span>`;

export function scenes() {
  hook(); dots(); reach(); access(); sol(); solBench(); ultra(); agents(); codex(); collab(); enterprise(); backdrop(); outro();
}

// =====================================================================================
// HOOK — Sep 29 · San Francisco · DevDay · 20+ launches · 1.2B weekly users
// =====================================================================================
function hook() {
  const tl = K.tl;
  set(S.field, 0, { A: SH.SCATTER, B: SH.SCATTER, m: 0, rx: 0.42, spin: 0, size: 0.085 });
  camSet(0, { x: 0, y: 4.5, z: 21, lx: 0, ly: 0, lz: 0, fov: 40 });
  fieldA(0.05, 1, 1.2); to(S.field, 0, q('devday') - 0.6, { spin: -1.1 }, 'none');
  cam(0, q('devday') - 0.3, { y: 2.2, z: 16.5 }, 'power1.inOut');
  // date + place
  const date = el(`<div class="d9" style="font-size:210px;color:#fff">SEP 29</div><div class="row" style="margin-top:26px"><span class="tag" style="font-size:26px;color:var(--sun)">2026</span><span id="sfc" class="chip" style="color:var(--sky);visibility:hidden">SAN FRANCISCO</span></div>`, 'left:110px;top:300px;transform-origin:0 50%');
  slam(date, q('date'), 1.35); pulse(q('date'), 1.2); shake(q('date'), 0.4);
  const sfc = date.querySelector('#sfc'); tl.fromTo(sfc, { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: 0.3 }, q('sf'));
  const coords = el('37.77°N · 122.42°W', 'left:114px;top:640px;font-size:20px;color:#6d779c', 'm5'); type(coords, [['37.77°N · 122.42°W', '']], q('sf') + 0.1, 40, false); tl.set(coords, { autoAlpha: 1 }, q('sf'));
  out([date, coords], q('devday') - 0.35, 0.25, { x: -60 });
  // DEVDAY in dots
  morph(q('devday') - 0.62, SH.SCATTER, SH.DEVDAY, 1.0); to(S.field, q('devday') - 0.62, 0.9, { spin: 0, rx: 0 }, 'power2.out');
  cam(q('devday') - 0.3, 2.0, { x: 0, y: 0.3, z: 13, ly: 0.2 }, 'power2.out');
  flash(q('devday'), 0.28); shake(q('devday'), 0.8); pulse(q('devday'), 1.4);
  const oa = el('<div class="tag" style="font-size:30px;color:#fff;letter-spacing:.5em">OPENAI</div>', 'left:960px;top:318px', '', 'c'); inn(oa, q('devday') - 0.1, 0.35, { y: -20 });
  out(oa, q('twenty') - 0.4, 0.2);
  // 20+
  morph(q('twenty') - 0.45, SH.DEVDAY, SH.TWENTY, 0.7); shake(q('twenty'), 0.6); pulse(q('twenty'), 1);
  const lau = el(`<div class="d" style="font-size:54px;text-align:center">LAUNCHES</div><div class="tag" style="margin-top:10px;text-align:center">IN ONE KEYNOTE</div>`, 'left:960px;top:770px', '', 'c'); inn(lau, q('launches') - 0.05, 0.35, { y: 30 });
  out(lau, q('billion') - 0.55, 0.2);
  // globe + 1.2B
  morph(q('billion') - 0.55, SH.TWENTY, SH.GLOBE, 1.1); to(S.field, q('billion') - 0.55, 1.2, { rx: 0.3, spin: 1.0 }, 'power2.inOut');
  to(S.field, q('billion') + 0.7, q('dots') - 0.9 - (q('billion') + 0.7), { spin: 2.2 }, 'none');
  cam(q('billion') - 0.5, 1.6, { x: 3.2, y: 0.8, z: 16, lx: 3.2, ly: 0 }, 'power2.inOut');
  const bil = el(`<div class="num" data-v style="font-size:190px;color:#fff">0</div><div class="tag" style="font-size:24px;margin-top:14px;color:var(--mint)">WEEKLY CHATGPT USERS</div>`, 'left:1180px;top:360px');
  inn(bil, q('billion') - 0.35, 0.3, { x: 50, y: 0 }); count(bil.querySelector('[data-v]'), 0, 1.2, q('billion') - 0.3, 0.9, (v) => v.toFixed(1) + 'B');
  shake(q('weekly'), 0.7); flash(q('weekly'), 0.18);
  out(bil, q('everything') - 0.1, 0.25, { x: 60 });
  // "everything, fast": two product marquees whip across
  const names = ['DOTS', 'GPT-6.1 SOL', 'ULTRAFAST', 'PRO 500', 'AGENTS API', 'DECISIONS API', 'CODEX', 'SIGN IN WITH CHATGPT', 'SPACE', 'PAGES', 'SLIDES', 'PRIVATE INTELLIGENCE', 'MARKETPLACE'];
  const band = (y, dir, off, col) => { const e = el(names.map((n, i) => `<span style="color:${HEX[(i + off) % 5]}">${n}</span>`).join('<span style="opacity:.35"> ● </span>'), `left:0;top:${y}px;font-size:64px;white-space:nowrap;color:${col}`, 'd');
    tl.fromTo(e, { autoAlpha: 1, x: dir > 0 ? 1920 : -3600 }, { x: dir > 0 ? -3600 : 1920, duration: 1.7, ease: 'power1.inOut', immediateRender: false }, q('everything') - 0.25); tl.set(e, { autoAlpha: 0 }, q('everything') + 1.45); return e; };
  band(380, 1, 0, '#fff'); band(620, -1, 2, '#fff');
  to(S.field, q('everything') - 0.2, 0.3, { a: 0.35 });
  whip(q('fast') + 0.05, 1, 1.2);
}

// =====================================================================================
// DOTS — always-on agents, own cloud computer + browser, priorities, "always has your back"
// =====================================================================================
function dots() {
  const tl = K.tl; const H0 = 0; // hero = dot 0 (coral)
  // globe collapses into five balls where the characters will appear
  to(S.field, q('first') - 0.15, 0.3, { a: 1 });
  morph(q('dots') - 0.85, SH.GLOBE, SH.BALLS, 1.0); to(S.field, q('dots') - 0.85, 0.8, { spin: 0, rot: 0, rx: 0 }, 'power2.out');
  camSet(q('fast') + 0.05, { x: 0, y: 1.6, z: 15, lx: 0, ly: -0.4, lz: 0, fov: 40 });
  cam(q('fast') + 0.05, 1.2, { y: 0.9, z: 12.6, ly: -0.5 }, 'power2.out');
  to(S.floor, q('first'), 0.6, { a: 1 });
  // characters pop, field dissolves into them
  ALL.forEach((i, k) => { set(S.dots[i], 0, { x: DOT_X[i], y: DOT_Y, z: 0, s: 0, eyes: 0.08, acc: 0 }); tl.to(S.dots[i], { s: 1, duration: 0.55, ease: 'back.out(2.6)' }, q('dots') + k * 0.06); burst(q('dots') + k * 0.06, DOT_X[i], DOT_Y, 0.4, 0.7); });
  fieldA(q('dots') + 0.05, 0, 0.35); pulse(q('dots'), 1.5); shake(q('dots'), 0.5);
  const title = el(`<div class="d9" style="font-size:230px;letter-spacing:-.02em">${['D', 'O', 'T', 'S'].map((c, i) => `<span style="color:${HEX[i]}">${c}</span>`).join('')}</div>`, 'left:960px;top:96px', '', 'c');
  slam(title, q('dots') - 0.02, 1.5);
  const ao = el(`<i></i>ALWAYS-ON`, 'left:960px;top:330px;color:var(--mint)', 'chip', 'c'); pop(ao, q('alwayson') - 0.05, 0.4);
  const pa = el(`PERSONAL AGENTS`, 'left:960px;top:392px;font-size:24px;color:#fff', 'tag', 'c'); inn(pa, q('agents') - 0.05, 0.3, { y: 16 });
  dotsTo(ALL, q('alwayson') - 0.05, 0.25, { eyes: 1 }, 'power2.out', 0.05); ALL.forEach((i, k) => hop(i, q('alwayson') + k * 0.05, 0.5, 0.45));
  out([title, ao, pa], q('tf') - 0.2, 0.25, { y: -30 });
  // 24/7: others step back, hero goes to the left, clock ring spins
  [1, 2, 3, 4].forEach((i, k) => { to(S.dots[i], q('tf') - 0.2 + k * 0.04, 0.4, { s: 0, y: DOT_Y + 0.8 }, 'back.in(2)'); });
  to(S.dots[H0], q('tf') - 0.25, 0.6, { x: -3.2, y: DOT_Y + 0.2 }, 'power3.inOut'); hop(H0, q('tf') - 0.2, 0.8, 0.5);
  set(S.clock, 0, { x: -3.2, y: DOT_Y + 0.2, z: 0.1, spin: 0 }); on(S.clock, q('tf') - 0.05, 0.3); to(S.clock, q('tf') - 0.05, 1.6, { spin: 2 }, 'power2.inOut');
  cam(q('tf') - 0.25, 1.2, { x: -0.6, y: 0.8, z: 11.8, lx: -0.6, ly: -0.2 }, 'power2.inOut');
  const tfE = el(`<div class="num" style="font-size:150px">24<span class="dim">/</span>7</div><div class="tag" style="margin-top:12px;color:var(--sun)">RUNS AROUND THE CLOCK</div>`, 'left:110px;top:170px'); slam(tfE, q('tf') - 0.03, 1.4);
  // cloud computer + browser
  set(S.mon, 0, { x: 2.3, y: -5, z: -1.6, ry: -0.2, k: 0, set: 0, cloud: 0 });
  on(S.mon, q('computer') - 0.25, 0.3); to(S.mon, q('computer') - 0.25, 0.7, { y: 0.55 }, 'back.out(1.4)'); to(S.mon, q('computer') + 0.1, 0.5, { cloud: 1 }, 'back.out(2)');
  to(S.dots[H0], q('computer') - 0.1, 0.4, { ry: 0.5 });
  const cc = el(`<i></i>ITS OWN CLOUD COMPUTER`, 'left:720px;top:150px;color:var(--sky)', 'chip'); pop(cc, q('computer') - 0.05, 0.4);
  set(S.mon, q('browser') - 0.02, { k: 0 }); set(S.mon, q('browser') + 0.3, { k: 1 }); set(S.mon, q('browser') + 0.6, { k: 2 });
  const bc = el(`<i></i>ITS OWN WEB BROWSER`, 'left:720px;top:214px;color:var(--mint)', 'chip'); pop(bc, q('browser') - 0.05, 0.4);
  out(tfE, q('priorities') - 0.3, 0.25); off(S.clock, q('priorities') - 0.3, 0.3);
  // priorities card, reorders on "time"
  const pc = el(`<div class="tag" style="color:var(--sun);margin-bottom:16px">LEARNS YOUR PRIORITIES</div><div id="pl" style="position:relative;height:216px"></div>`, 'left:100px;top:170px;width:560px', 'card');
  const items = [['Weekly report', 'var(--mute)'], ['Flight to NYC', 'var(--sky)'], ['Vendor renewals', 'var(--coral)']];
  const rows = items.map(([n, c], i) => { const r = document.createElement('div'); r.style.cssText = `position:absolute;left:0;right:0;top:${i * 72}px;height:60px;border-radius:14px;background:rgba(255,255,255,.05);display:flex;align-items:center;gap:16px;padding:0 18px;font-weight:700;font-size:28px`; r.innerHTML = `<span class="m" style="font-size:20px;color:${c}">0${i + 1}</span>${n}`; pc.querySelector('#pl').appendChild(r); return r; });
  inn(pc, q('priorities') - 0.15, 0.35, { x: -40, y: 0 });
  tl.to(rows[2], { y: -144, duration: 0.5, ease: 'power3.inOut' }, q('time') - 0.1); tl.to(rows[0], { y: 144, duration: 0.5, ease: 'power3.inOut' }, q('time') - 0.1);
  tl.to(rows[2], { background: 'rgba(255,90,78,.2)', duration: 0.3 }, q('time') + 0.3);
  dyn((T) => { const a = T > q('time') + 0.2; rows[2].querySelector('.m').textContent = a ? '01' : '03'; rows[0].querySelector('.m').textContent = a ? '03' : '01'; });
  // "always has your back"
  out([pc, cc, bc], q('altman') - 0.2, 0.25); off(S.mon, q('altman') - 0.15, 0.4); to(S.mon, q('altman') - 0.15, 0.5, { y: -4.5 }, 'power2.in');
  to(S.dots[H0], q('altman') - 0.1, 0.6, { x: 0, y: DOT_Y, ry: 0 }, 'power3.inOut'); cam(q('altman') - 0.1, 1.2, { x: 0, y: 0.5, z: 10.8, lx: 0, ly: 0.2 }, 'power2.inOut');
  const al = el(`SAM ALTMAN'S PITCH`, 'left:960px;top:170px;color:var(--dim)', 'tag', 'c'); inn(al, q('altman') - 0.05, 0.3, { y: -14 });
  const hb = el(`<div class="d" style="font-size:78px;text-align:center;line-height:1.02">A HELPER THAT<br><span class="coral">ALWAYS HAS YOUR BACK</span></div>`, 'left:960px;top:222px;width:1500px', '', 'c'); inn(hb, q('helper') - 0.1, 0.35, { y: 30, scale: 0.96 });
  to(S.dots[H0], q('back') - 0.15, 0.75, { ry: Math.PI * 2 }, 'power3.inOut'); hop(H0, q('back') - 0.1, 1.0, 0.6); burst(q('back') + 0.15, 0, DOT_Y + 0.6, 0.5, 1.4);
  to(S.dots[H0], q('back') - 0.1, 0.3, { glow: 0.5 }); to(S.dots[H0], q('back') + 0.5, 0.6, { glow: 0 });
  set(S.dots[H0], en('dots') + 0.05, { ry: 0 });
  out([al, hb], en('dots') + 0.05, 0.25);
}

// =====================================================================================
// REACH — 4,000+ apps, channels, GPT-6 Astra under the hood, the rules, negotiating contracts
// =====================================================================================
function reach() {
  const tl = K.tl; const H0 = 0;
  set(S.apps, 0, { x: 0, y: DOT_Y, z: 0, e: 0, spin: 0 });
  on(S.apps, q('plug') - 0.15, 0.2); to(S.apps, q('plug') - 0.15, 1.1, { e: 1 }, 'power2.out'); to(S.apps, q('plug'), q('hood') - q('plug'), { spin: 2.5 }, 'none');
  cam(q('plug') - 0.3, 1.6, { x: 0, y: 2.2, z: 14, lx: 0, ly: -0.6 }, 'power2.inOut');
  const apps = el(`<div class="num" data-v style="font-size:150px">0</div><div class="tag" style="margin-top:12px;color:var(--sky)">APPS VIA PLUGINS</div>`, 'left:100px;top:300px');
  slam(apps, q('four') - 0.12, 1.3); count(apps.querySelector('[data-v]'), 0, 4000, q('four') - 0.1, 0.9, (v) => Math.round(v).toLocaleString('en-US') + (v > 3990 ? '+' : ''));
  hop(H0, q('four'), 0.7); shake(q('four'), 0.5); burst(q('four'), 0, DOT_Y + 0.5, 0.4, 1.2);
  const rh = el('REACH YOUR DOT IN', 'left:1330px;top:236px', 'tag'); inn(rh, q('chatgpt') - 0.25, 0.3, { x: 30, y: 0 });
  const CH = [['chatgpt', 'CHATGPT', 'var(--mint)'], ['voice', 'VOICE CALLS', 'var(--sun)'], ['slack', 'SLACK', 'var(--violet)'], ['teams', 'MICROSOFT TEAMS', 'var(--sky)'], ['texting', 'SMS · COMING', 'var(--dim)']];
  const chips = CH.map(([id, n, c], i) => { const e = el(`<i></i>${n}`, `left:1330px;top:${286 + i * 70}px;color:${c}`, 'chip'); pop(e, q(id) - 0.05, 0.4); return e; });
  CH.forEach(([id], i) => i < 4 && squash(H0, q(id), 0.12));
  out([apps, rh, ...chips], q('hood') - 0.3, 0.3);
  // under the hood: GPT-6 Astra
  to(S.apps, q('hood') - 0.35, 0.5, { e: 0 }, 'power2.in'); off(S.apps, q('hood') + 0.1, 0.1);
  to(S.dots[H0], q('hood') - 0.3, 0.7, { x: -3.0, ry: 0.45 }, 'power3.inOut');
  set(S.crystal, 0, { x: 2.8, y: 0.2, z: 0, s: 0.3, ex: 0, dim: 0, red: 0 });
  on(S.crystal, q('hood') - 0.15, 0.3); to(S.crystal, q('hood') - 0.15, 0.7, { s: 1.15 }, 'back.out(1.8)');
  cam(q('hood') - 0.3, 1.1, { x: 0, y: 0.7, z: 11.8, lx: 0, ly: -0.1 }, 'power2.inOut');
  const ast = el(`<div class="tag" style="text-align:center">UNDER THE HOOD</div><div class="d" style="font-size:54px;margin-top:10px;text-align:center">GPT-6 <span class="sky">ASTRA</span></div>`, 'left:0;top:0', '', 'c');
  inn(ast, q('astra') - 0.2, 0.35, { y: 20 }); pin(ast, () => [S.crystal.x, S.crystal.y - 2.1, 0]); burst(q('astra'), 2.8, 0.2, 0, 1.4); flash(q('astra'), 0.12);
  out(ast, q('rules') - 0.25, 0.25); to(S.crystal, q('rules') - 0.25, 0.35, { a: 0, s: 0.4 }, 'power2.in');
  // the rules
  to(S.dots[H0], q('rules') - 0.2, 0.6, { x: -4.4, ry: 0.55 }, 'power3.inOut'); cam(q('rules') - 0.25, 0.9, { x: 0, y: 0.6, z: 12.4, lx: 0, ly: -0.3 }, 'power2.inOut');
  const rc = el(`<div class="d" style="font-size:60px">YOU SET <span class="sun">THE RULES</span></div><div id="rr" style="margin-top:26px;display:flex;flex-direction:column;gap:14px"></div>`, 'left:700px;top:180px;width:1120px', 'card');
  slam(rc, q('rules') - 0.05, 1.12);
  const R = [['alone', 'var(--mint)', 'ACTS ON ITS OWN', 'AUTONOMOUS', '●'], ['approval', 'var(--sun)', 'CHECKS WITH YOU FIRST', 'NEEDS APPROVAL', '◐'], ['offlim', 'var(--red)', 'NEVER TOUCHES', 'OFF LIMITS', '✕'], ['passwords', 'var(--sky)', 'PASSWORD CHANGES', 'STAY WITH YOU', '🔒']];
  R.forEach(([id, c, a, b, ic]) => { const r = document.createElement('div'); r.style.cssText = 'display:flex;align-items:center;gap:22px;padding:14px 20px;border-radius:18px;background:rgba(255,255,255,.045);visibility:hidden;opacity:0';
    r.innerHTML = `<span style="width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;color:#05060c;background:${c}">${ic === '🔒' ? '<svg width="26" height="26" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="12" rx="3" fill="#05060c"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#05060c" stroke-width="2.6" fill="none"/></svg>' : ic}</span><span style="font-weight:700;font-size:36px;flex:1">${a}</span><span class="chip" style="color:${c};font-size:20px">${b}</span>`;
    rc.querySelector('#rr').appendChild(r); tl.fromTo(r, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out' }, q(id) - 0.08); });
  squash(H0, q('offlim'), 0.2); hop(H0, q('passwords'), 0.5); shake(q('passwords'), 0.35);
  const ro = el('RESEARCH RUNS ON READ-ONLY TOOLS', 'left:720px;top:782px', 'foot'); inn(ro, q('passwords') + 0.4, 0.3, { y: 10 });
  out([rc, ro], q('testers') - 0.2, 0.3, { x: 40 });
  // early testers: negotiated vendor contracts
  to(S.dots[H0], q('testers') - 0.15, 0.6, { x: -3.8, ry: 0.5 }, 'power3.inOut');
  const et = el('EARLY TESTERS REPORT', 'left:760px;top:160px;color:var(--sun)', 'tag'); inn(et, q('testers') - 0.1, 0.3, { x: 30, y: 0 });
  const doc = el(`<div class="m" style="font-size:18px;color:#5b6180">VENDOR CONTRACT · RENEWAL</div><div class="d" style="font-size:40px;color:#10132a;margin:10px 0 22px">Annual services agreement</div>
    ${[92, 80, 88, 60].map((w) => `<div style="height:14px;border-radius:7px;background:#d5d9ea;margin:12px 0;width:${w}%"></div>`).join('')}
    <div id="red" style="margin-top:22px;padding:16px 18px;border-radius:14px;background:#fff1ee;border:2px dashed #ff5a4e;font-weight:600;font-size:26px;color:#10132a;min-height:64px"></div>`, 'left:760px;top:210px;width:760px;background:#f6f7fb;color:#10132a;border-radius:26px;padding:34px 38px;box-shadow:0 30px 80px rgba(0,0,0,.5)');
  inn(doc, q('testers') - 0.05, 0.45, { x: 80, y: 0, rotation: 3 }, { rotation: -1.5 });
  type(doc.querySelector('#red'), [['DOT: ', 'coral'], ['proposing revised terms and a counter-offer…', '']], q('negotiate') - 0.1, 40);
  const pro = el('PROACTIVE', 'left:1240px;top:560px;font-size:64px;color:var(--mint)', 'stamp'); slam(pro, q('contracts') - 0.05, 2, -8); shake(q('contracts'), 0.5);
  hop(H0, q('contracts'), 0.8, 0.5); burst(q('contracts'), -3.8, DOT_Y + 0.8, 0.4, 1.1);
  tl.set([et, doc, pro], { autoAlpha: 0 }, q('catch') - 0.12);
}

// =====================================================================================
// ACCESS — the catch (plans), cute accessories, The Register's side-eye
// =====================================================================================
function access() {
  const tl = K.tl;
  whip(q('catch') - 0.12, 1, 1);
  const tc = q('catch') - 0.12;
  camSet(tc, { x: 0, y: 1.3, z: 11.4, lx: 0, ly: 0.2, lz: 0, fov: 40, orbit: 0 });
  ALL.forEach((i) => set(S.dots[i], tc, { x: DOT_X[i], y: DOT_Y, z: 0, ry: 0, rx: 0, s: i === 0 ? 1 : 0, eyes: 1, dim: 0 }));
  [1, 2, 3, 4].forEach((i, k) => tl.to(S.dots[i], { s: 1, duration: 0.45, ease: 'back.out(2.4)' }, tc + 0.05 + k * 0.05));
  const t1 = el('THE CATCH', 'left:960px;top:100px;font-size:110px', 'd9', 'c'); slam(t1, q('catch') - 0.05, 1.4);
  const plans = [['FREE', 'var(--dim)'], ['PLUS', 'var(--dim)'], ['PRO', 'var(--sky)'], ['BUSINESS<br>PREMIUM', 'var(--violet)'], ['ENTERPRISE<br>EDU · HEALTH', 'var(--dim)']];
  const cards = plans.map(([n], i) => { const x = 960 + (i - 2) * 318; const e = el(`<div class="m" style="font-size:25px;line-height:1.25;min-height:64px">${n}</div><div data-s class="d" style="font-size:64px;margin-top:12px;color:var(--mute)">—</div><div data-n class="m5" style="font-size:18px;margin-top:10px;color:var(--dim);min-height:44px;line-height:1.25"></div>`, `left:${x}px;top:250px;width:290px;text-align:center;padding:24px 16px`, 'card', 'c');
    inn(e, q('catch') + 0.1 + i * 0.05, 0.35, { y: 30 }); return e; });
  const mark = (i, t, ok, col, note) => { const c = cards[i]; const sE = c.querySelector('[data-s]'), nE = c.querySelector('[data-n]');
    dyn((T) => { const on = T >= t; const v = on ? (ok ? '✓' : '✕') : '—'; if (sE.textContent !== v) { sE.textContent = v; sE.style.color = on ? col : 'var(--mute)'; nE.textContent = on ? note : ''; } });
    tl.to(c, { borderColor: col, duration: 0.2 }, t); tl.fromTo(c, { scale: 1.12 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, t); if (!ok) tl.to(c, { opacity: 0.55, duration: 0.3 }, t + 0.2); };
  mark(2, q('pro'), true, '#3da9fc', 'FIRST DOT INCLUDED'); hop(2, q('pro'), 0.7);
  mark(3, q('premium'), true, '#9b6bff', 'FIRST DOT INCLUDED'); hop(3, q('premium'), 0.7);
  mark(0, q('free'), false, '#ff3355', 'NOT INCLUDED'); to(S.dots[0], q('free'), 0.4, { dim: 0.75, s: 0.85, eyes: 0.4 });
  mark(1, q('plus'), false, '#ff3355', 'NOT INCLUDED'); to(S.dots[1], q('plus'), 0.4, { dim: 0.75, s: 0.85, eyes: 0.4 });
  mark(4, q('leftout') + 0.2, true, '#ffc53d', 'ADMIN BETA · OFF BY DEFAULT');
  const fn = el('FOR NOW', 'left:1420px;top:96px;font-size:48px;color:var(--sun)', 'stamp'); slam(fn, q('leftout') + 0.25, 1.8, -6);
  out([t1, fn, ...cards], q('cute') - 0.2, 0.3, { y: -30 });
  // cute: accessories pop on, word by word
  to(S.dots[0], q('cute') - 0.15, 0.4, { dim: 0, s: 1, eyes: 1 }); to(S.dots[1], q('cute') - 0.15, 0.4, { dim: 0, s: 1, eyes: 1 });
  cam(q('cute') - 0.2, 1.4, { x: 0, y: 0.4, z: 10.6, lx: 0, ly: -0.4 }, 'power2.inOut'); ALL.forEach((i, k) => hop(i, q('cute') + k * 0.05, 0.5));
  const cu = el(`<div class="d9" style="font-size:120px">CUTE <span class="pink">BY DESIGN</span></div>`, 'left:960px;top:150px', '', 'c'); slam(cu, q('cute') - 0.05, 1.3);
  const acc = (i, t, lab) => { tl.to(S.dots[i], { acc: 1, duration: 0.5, ease: 'back.out(2.2)' }, t); burst(t + 0.1, DOT_X[i], DOT_Y + 1.1, 0.3, 0.8); squash(i, t + 0.12, 0.18);
    if (lab) { const e = el(lab, 'left:0;top:0;font-size:18px;color:#fff', 'chip', 'c'); pop(e, t, 0.35); pin(e, () => [S.dots[i].x, DOT_Y - 1.55, 0]); return e; } return null; };
  const labs = [acc(0, q('glasses') - 0.08, 'GLASSES'), acc(3, q('hats') - 0.1, 'HATS'), acc(2, q('hats') + 0.02), acc(4, q('hats') + 0.12), acc(1, q('bow') - 0.08, 'BOW TIES')].filter(Boolean);
  out([cu, ...labs], q('register') - 0.2, 0.3);
  // The Register
  const rg = el(`<div class="tag" style="color:var(--coral)">THE REGISTER · SKEPTICAL OF THE TONE</div><div style="font-weight:700;font-size:46px;line-height:1.12;margin-top:14px">Cute mascots — from a company that also warns about <span class="red">existential AI risk.</span></div>`, 'left:960px;top:150px;width:1320px', 'card', 'c');
  inn(rg, q('register') - 0.1, 0.4, { y: -30 });
  to(S.bg, q('existential') - 0.1, 0.6, { mood: 0.55 }); to(S.grade, q('existential') - 0.1, 0.6, { red: 0.22 }); to(S.floor, q('existential') - 0.1, 0.6, { pool: 0.25 });
  dotsTo(ALL, q('existential'), 0.4, { rx: -0.28, eyes: 0.55 }, 'power2.out', 0.03); glitch(q('existential') + 0.1, 0.4);
  out(rg, en('access') + 0.05, 0.25);
}

// =====================================================================================
// SOL — near-Astra intelligence at one-fifth the price
// =====================================================================================
function sol() {
  const tl = K.tl; const t0 = q('next') - 0.08;
  whip(t0, -1, 1.1);
  ALL.forEach((i) => set(S.dots[i], t0, { s: 0, rx: 0, eyes: 1 })); set(S.floor, t0, { a: 0, pool: 0.6 }); set(S.bg, t0, { mood: 0, space: 1, sun: 0.3 }); set(S.grade, t0, { red: 0 }); set(S, t0, { stars: 0.9 });
  camSet(t0, { x: 0, y: 0, z: 15, lx: 0, ly: 0, lz: 0, fov: 40, orbit: 0 }); cam(t0, en('sol') - t0 + 13, { z: 12.5, orbit: 0.12 }, 'power1.inOut');
  set(S.sun, 0, { x: 2.3, y: 0.3, z: 0, s: 0, flare: 0 });
  to(S.sun, t0 + 0.1, q('sol') - t0 - 0.3, { a: 0.6, s: 0.12, flare: 0.5 }, 'power2.in');
  const nx = el('NEXT UP', 'left:960px;top:700px;color:var(--sun);font-size:26px', 'tag', 'c'); inn(nx, t0 + 0.15, 0.3, { y: 12 }); out(nx, q('sol') - 0.2, 0.15);
  to(S.sun, q('sol') - 0.15, 0.9, { a: 1, s: 1 }, 'expo.out'); tl.fromTo(S.sun, { flare: 1.2 }, { flare: 0, duration: 1.4, ease: 'power2.out', immediateRender: false }, q('sol') - 0.1);
  to(S.bg, q('sol') - 0.1, 0.8, { sun: 1 }); flash(q('sol'), 0.4); shake(q('sol'), 0.8);
  const ti = el(`<div class="tag" style="font-size:30px;color:#fff">GPT-6.1</div><div class="d9" style="font-size:250px;background:linear-gradient(180deg,#ffe08a,#ff8a2a);-webkit-background-clip:text;background-clip:text;color:transparent">SOL</div>`, 'left:120px;top:250px;transform-origin:0 0');
  slam(ti, q('sol') - 0.05, 1.4);
  tl.to(ti, { scale: 0.42, x: -10, y: -130, duration: 0.5, ease: 'power3.inOut' }, q('near') - 0.2);
  // near-Astra
  to(S.sun, q('near') - 0.2, 0.6, { x: 3.2, s: 0.75, y: 0.8 }, 'power3.inOut');
  set(S.crystal, q('near') - 0.3, { x: -3.2, y: 0.8, z: 0, s: 0.2, ex: 0, dim: 0, red: 0 }); on(S.crystal, q('near') - 0.2, 0.3); to(S.crystal, q('near') - 0.2, 0.6, { s: 0.85 }, 'back.out(1.6)');
  const nr = el(`<div class="d" style="font-size:58px;text-align:center">NEAR-<span class="sky">ASTRA</span> INTELLIGENCE</div>`, 'left:960px;top:140px;width:1400px', '', 'c'); inn(nr, q('near') - 0.05, 0.35, { y: -20 });
  const eq = el('≈', 'left:960px;top:330px;font-size:140px;color:#fff', 'd9', 'c'); pop(eq, q('near') + 0.1, 0.4);
  const lA = el('GPT-6 ASTRA', 'left:0;top:0;color:var(--sky)', 'chip', 'c'), lS = el('GPT-6.1 SOL', 'left:0;top:0;color:var(--sun)', 'chip', 'c');
  pin(lA, () => [S.crystal.x, 2.8, 0]); pin(lS, () => [S.sun.x, 2.8, 0]); inn(lA, q('near'), 0.3, { y: -10 }); inn(lS, q('near') + 0.1, 0.3, { y: -10 });
  // one-fifth: coins
  set(S.coins, 0, { ax: -3.2, sx: 3.2, y: -2.9, astra: 0, sol: 0 }); on(S.coins, q('fifth') - 0.6, 0.1);
  to(S.coins, q('fifth') - 0.6, 1.0, { astra: 7.4 }, 'none'); to(S.coins, q('fifth') + 0.05, 0.4, { sol: 1.5 }, 'none');
  const fifth = el(`<div class="d9" style="font-size:150px;color:var(--sun)">⅕</div><div class="tag" style="margin-top:4px;color:#fff;font-size:26px">THE PRICE</div>`, 'left:960px;top:600px;text-align:center', '', 'c'); slam(fifth, q('fifth') - 0.02, 1.5);
  out([nr, eq, lA, lS, fifth], q('two') - 0.3, 0.25); off(S.coins, q('two') - 0.3, 0.3); to(S.crystal, q('two') - 0.3, 0.35, { a: 0, s: 0.3 }, 'power2.in');
  // price board
  to(S.sun, q('two') - 0.35, 0.7, { x: -3.4, y: 0.1, s: 1 }, 'power3.inOut'); out(ti, q('two') - 0.3, 0.2);
  const pb = el(`<div class="tag" style="margin-bottom:18px">GPT-6.1 SOL · API PRICE PER 1M TOKENS</div><div id="prs"></div>`, 'left:900px;top:190px;width:900px', 'card'); inn(pb, q('two') - 0.2, 0.35, { x: 60, y: 0 });
  const PR = [['two', '$2', 'INPUT', 'var(--sun)'], ['tenout', '$10', 'OUTPUT', 'var(--coral)'], ['cents', '$0.10', 'CACHED INPUT', 'var(--mint)']];
  PR.forEach(([id, v, l, c]) => { const r = document.createElement('div'); r.style.cssText = 'display:flex;align-items:baseline;gap:26px;padding:12px 0;border-top:1px solid rgba(255,255,255,.08);visibility:hidden;opacity:0';
    r.innerHTML = `<span class="num" style="font-size:108px;color:${c};min-width:420px">${v}</span><span class="m" style="font-size:26px">${l}</span>`; pb.querySelector('#prs').appendChild(r);
    tl.fromTo(r, { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.28, ease: 'expo.out' }, q(id) - 0.06); });
  const ca = el('CACHED?', 'left:1590px;top:600px;color:var(--mint);font-size:20px', 'chip'); pop(ca, q('cached') - 0.05, 0.3); out(ca, q('cents') + 0.3, 0.2);
  const nf = el('−95%', 'left:1380px;top:640px;font-size:96px;color:var(--mint)', 'stamp'); slam(nf, q('ninetyfive') - 0.03, 2.1, -7); shake(q('ninetyfive'), 0.6); flash(q('ninetyfive'), 0.12);
  out([pb, nf], en('sol') + 0.05, 0.3, { x: 40 });
}

// =====================================================================================
// SOL BENCHMARKS + availability
// =====================================================================================
function solBench() {
  const tl = K.tl;
  const bb = el(`<div class="row" style="justify-content:space-between;margin-bottom:22px"><span class="tag">BENCHMARKS · AS REPORTED</span><span class="foot">BAR LENGTHS ILLUSTRATIVE</span></div><div id="bm"></div>`, 'left:900px;top:170px;width:920px', 'card');
  inn(bb, q('ties') - 0.3, 0.35, { x: 60, y: 0 });
  const bar = (name, col, w, t) => { const r = document.createElement('div'); r.style.cssText = 'display:flex;align-items:center;gap:18px;margin:8px 0'; r.innerHTML = `<span class="m" style="font-size:18px;width:230px;color:${col}">${name}</span><div class="bar" style="flex:1"><b style="background:${col}"></b></div>`;
    tl.fromTo(r.querySelector('b'), { width: '0%' }, { width: w + '%', duration: 0.6, ease: 'power3.out' }, t); return r; };
  const grp = (title, badge, bcol, rows, t) => { const g = document.createElement('div'); g.style.cssText = 'padding:14px 0 16px;border-top:1px solid rgba(255,255,255,.08);visibility:hidden;opacity:0';
    g.innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:6px"><span style="font-weight:700;font-size:32px">${title}</span><span class="pill" data-b style="background:${bcol};color:#05060c;visibility:hidden">${badge}</span></div>`;
    rows.forEach((r) => g.appendChild(r)); bb.querySelector('#bm').appendChild(g); tl.fromTo(g, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, t - 0.15); pop(g.querySelector('[data-b]'), t + 0.45, 0.35); return g; };
  grp('DeepSWE', 'TIE WITH ASTRA', 'var(--sky)', [bar('GPT-6.1 SOL', 'var(--sun)', 84, q('ties')), bar('GPT-6 ASTRA', 'var(--sky)', 84, q('ties'))], q('ties'));
  const g2 = grp('AutomationBench', 'BEATS OPUS 5.5', 'var(--mint)', [bar('GPT-6.1 SOL', 'var(--sun)', 88, q('beats')), bar('CLAUDE OPUS 5.5', 'var(--dim)', 74, q('beats'))], q('beats'));
  const th = document.createElement('span'); th.className = 'pill'; th.style.cssText = 'background:rgba(255,197,61,.18);color:var(--sun);margin-top:8px;visibility:hidden'; th.textContent = '≈ ⅓ THE COST'; g2.appendChild(th); pop(th, q('third') - 0.05, 0.35);
  const g3 = document.createElement('div'); g3.style.cssText = 'padding:14px 0 4px;border-top:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:26px;visibility:hidden;opacity:0';
  g3.innerHTML = `<span class="num" data-v style="font-size:96px;color:var(--mint)">0%</span><span style="font-weight:700;font-size:30px;line-height:1.15">fewer factual errors<br><span class="dim" style="font-size:22px">vs GPT-6 Sol, per OpenAI</span></span>`; bb.querySelector('#bm').appendChild(g3);
  tl.fromTo(g3, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, q('errors') - 0.1); count(g3.querySelector('[data-v]'), 0, -32, q('thirtytwo') - 0.15, 0.6, (v) => (v < -0.5 ? '−' : '') + Math.abs(Math.round(v)) + '%'); shake(q('thirtytwo'), 0.4);
  out(bb, q('live') - 0.25, 0.3, { x: 40 });
  // live now
  const lv = el(`<div class="row" style="gap:20px"><span style="width:26px;height:26px;border-radius:50%;background:var(--red);box-shadow:0 0 24px var(--red)" id="lvd"></span><span class="d9" style="font-size:120px">LIVE NOW</span></div>`, 'left:900px;top:250px'); slam(lv, q('live') - 0.05, 1.3);
  const lvd = lv.querySelector('#lvd'); dyn((T) => { lvd.style.opacity = (0.45 + 0.55 * Math.abs(Math.sin(T * 4))).toFixed(2); });
  const SF = [['api', 'API', 'var(--sky)'], ['work', 'CHATGPT WORK', 'var(--mint)'], ['codex', 'CODEX', 'var(--violet)']];
  const sf = SF.map(([id, n, c], i) => { const e = el(`<i></i>${n}`, `left:${905 + [0, 150, 470][i]}px;top:420px;color:${c}`, 'chip'); pop(e, q(id) - 0.05, 0.35); return e; });
  const pl = el('PLUS · PRO · BUSINESS · ENTERPRISE · EDU', 'left:908px;top:500px', 'foot'); inn(pl, q('codex') + 0.1, 0.3, { y: 10 });
  tl.fromTo(S.sun, { flare: 0.8 }, { flare: 0, duration: 0.9, immediateRender: false }, q('live'));
  out([lv, ...sf, pl], en('solBench') + 0.02, 0.25);
}

// =====================================================================================
// ULTRAFAST + PRO 500
// =====================================================================================
function ultra() {
  const tl = K.tl;
  to(S.sun, q('speed') - 0.4, 0.5, { s: 0, a: 0 }, 'power3.in'); to(S.bg, q('speed') - 0.4, 0.8, { sun: 0, cool: 1 });
  set(S.warp, 0, { d: 0, len: 0.6 }); to(S.warp, q('speed') - 0.4, 0.8, { a: 0.35 }); to(S.warp, q('speed') - 0.4, q('ultrafast') - q('speed') + 0.3, { d: 25 }, 'power2.in');
  camSet(q('speed') - 0.45, { x: 0, y: 0, z: 14, lx: 0, ly: 0, lz: 0, orbit: 0, fov: 40, roll: 0 });
  // go
  to(S.warp, q('ultrafast') - 0.12, 0.25, { a: 1, len: 16 }, 'expo.out'); to(S.warp, q('ultrafast') - 0.1, q('cheap') - q('ultrafast') - 0.2, { d: 1100 }, 'none');
  cam(q('ultrafast') - 0.12, 0.4, { fov: 66 }, 'expo.out'); to(S.cam, q('ultrafast'), q('cheap') - q('ultrafast') - 0.3, { roll: 0.18 }, 'sine.inOut');
  flash(q('ultrafast'), 0.45); shake(q('ultrafast'), 1.2, 0.9); ab(q('ultrafast'), 1.5, 1.2); whip(q('ultrafast') - 0.1, 1, 0.8);
  const uf = el(`<div class="d9" style="font-size:210px;transform:skewX(-14deg);text-shadow:-40px 0 30px rgba(61,169,252,.55),-90px 0 50px rgba(155,107,255,.35)">ULTRA<span class="sky">FAST</span></div>`, 'left:960px;top:330px;transform-origin:50% 0', '', 'c');
  tl.fromTo(uf, { autoAlpha: 0, x: 500 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: 'expo.out' }, q('ultrafast') - 0.08); tl.to(uf, { y: -230, scale: 0.42, duration: 0.45, ease: 'power3.inOut' }, q('eight') - 0.3);
  const e8 = el(`<div class="num" style="font-size:260px;color:#fff">8<span class="sky">×</span></div><div class="tag" style="margin-top:8px;color:#fff;font-size:26px">FASTER IN CODEX</div><div class="foot" style="margin-top:10px">UP TO 6× IN THE API</div>`, 'left:140px;top:330px');
  slam(e8, q('eight') - 0.05, 1.6); shake(q('eight'), 0.6); out(e8, q('threeh') - 0.12, 0.2, { x: -40 });
  // gauge
  const ga = el(`<svg width="560" height="330" viewBox="0 0 560 330"><path d="M40 300 A240 240 0 0 1 520 300" stroke="rgba(255,255,255,.12)" stroke-width="26" fill="none" stroke-linecap="round"/><path id="gArc" d="M40 300 A240 240 0 0 1 520 300" stroke="url(#gg)" stroke-width="26" fill="none" stroke-linecap="round" stroke-dasharray="754" stroke-dashoffset="754"/><defs><linearGradient id="gg"><stop offset="0" stop-color="#3da9fc"/><stop offset="1" stop-color="#ff6fb5"/></linearGradient></defs><line id="gN" x1="280" y1="300" x2="280" y2="96" stroke="#fff" stroke-width="8" stroke-linecap="round"/><circle cx="280" cy="300" r="18" fill="#fff"/></svg><div class="num" data-v style="font-size:120px;text-align:center;margin-top:-20px">0</div><div class="tag" style="text-align:center;color:var(--sky)">TOKENS / SECOND</div>`, 'left:120px;top:300px;width:560px');
  inn(ga, q('threeh') - 0.12, 0.3, { x: -40, y: 0 });
  const gV = ga.querySelector('[data-v]'), gArc = ga.querySelector('#gArc'), gN = ga.querySelector('#gN'); const g0 = q('threeh') - 0.05, gd = q('tokens') - q('threeh') + 0.45;
  dyn((T) => { const p = eo((T - g0) / gd); const v = Math.round(300 * p); const jit = p > 0.98 ? Math.sin(T * 40) * 0.01 : 0; const s = String(v); if (gV.textContent !== s) gV.textContent = s;
    gArc.setAttribute('stroke-dashoffset', (754 * (1 - p)).toFixed(1)); gN.setAttribute('transform', `rotate(${(-90 + 180 * (p + jit)).toFixed(2)} 280 300)`); });
  shake(q('tokens'), 0.5);
  // wafer (reportedly Cerebras)
  set(S.wafer, 0, { x: 3.4, y: 0.2, z: -70, rx: 1.0, ry: 0, rz: 0.3 });
  on(S.wafer, q('cerebras') - 0.35, 0.2); to(S.wafer, q('cerebras') - 0.35, 0.9, { z: 3.2, rx: 0.55, rz: -0.15 }, 'expo.out');
  const wl = el(`<div class="tag" style="text-align:center">REPORTEDLY</div><div class="d" style="font-size:44px;text-align:center;margin-top:8px">CEREBRAS CHIPS</div>`, 'left:1440px;top:780px', '', 'c'); inn(wl, q('cerebras'), 0.3, { y: 20 });
  // brake
  to(S.warp, q('cheap') - 0.3, 1.3, { d: 1170, len: 0.5, a: 0.3 }, 'power3.out'); to(S.warp, q('cheap') + 1.0, q('bundled') - q('cheap') - 1.0, { d: 1200 }, 'none'); to(S.warp, q('bundled') - 0.2, 0.4, { a: 0 }); cam(q('cheap') - 0.3, 0.9, { fov: 40, roll: 0 }, 'power3.out');
  to(S.wafer, q('cheap') - 0.3, 0.5, { z: 20, a: 0 }, 'power2.in'); out([uf, ga, wl], q('cheap') - 0.3, 0.25);
  const ch = el(`<div class="tag" style="text-align:center;color:var(--coral);font-size:26px">IT ISN'T CHEAP</div><div class="d" style="font-size:52px;text-align:center;margin-top:12px">ASTRA ULTRAFAST</div>`, 'left:960px;top:200px', '', 'c'); inn(ch, q('cheap') - 0.15, 0.35, { y: -20 });
  const pp = (t, v, l, x, c) => { const e = el(`<div class="num" style="font-size:190px;color:${c}">${v}</div><div class="m" style="font-size:26px;margin-top:8px">${l}</div>`, `left:${x}px;top:390px;text-align:center`, '', 'c'); slam(e, t - 0.05, 1.5); shake(t, 0.4); return e; };
  const p1 = pp(q('sixty'), '$60', 'PER 1M INPUT TOKENS', 640, 'var(--sun)'), p2 = pp(q('threeout'), '$300', 'PER 1M OUTPUT TOKENS', 1300, 'var(--coral)');
  const sx = el('≈ 6× THE STANDARD RATE', 'left:960px;top:720px;color:var(--dim)', 'chip', 'c'); pop(sx, q('threeout') + 0.4, 0.35);
  const av = el('LIVE FOR PRO 500 + ENTERPRISE · SOL ULTRAFAST “COMING SOON”', 'left:960px;top:800px', 'foot', 'c'); inn(av, q('threeout') + 0.6, 0.3, { y: 10 });
  out([ch, p1, p2, sx, av], q('bundled') - 0.15, 0.25);
  // Pro 500 card
  const np = el('NEW TOP CHATGPT PLAN', 'left:960px;top:150px;color:var(--sun);font-size:26px', 'tag', 'c'); inn(np, q('bundled'), 0.3, { y: -16 });
  set(S.card, 0, { x: 0, y: 0.5, z: -30, rx: 0.1, ry: -9.4, rz: 0, s: 1 });
  on(S.card, q('pro500') - 0.3, 0.2); to(S.card, q('pro500') - 0.3, 1.0, { z: 3.4, ry: -0.35, rx: 0.1 }, 'expo.out'); to(S.card, q('pro500') + 0.8, en('ultra') - q('pro500'), { ry: 0.3 }, 'sine.inOut');
  to(S.bg, q('pro500') - 0.3, 0.6, { cool: 0, warm: 0.8 }); flash(q('pro500'), 0.3); shake(q('pro500'), 0.7); burst(q('pro500') + 0.1, 0, 0.5, 3.4, 1.6);
  const pm = el(`<span class="num" style="font-size:96px">$500</span><span class="m" style="font-size:28px;margin-left:14px">/ MONTH</span>`, 'left:960px;top:760px', '', 'c'); slam(pm, q('fiveh') - 0.05, 1.5);
  const x25 = el('25× THE PLUS ALLOWANCE', 'left:620px;top:900px;color:var(--violet)', 'chip'), ufi = el('ULTRAFAST INCLUDED', 'left:1060px;top:900px;color:var(--sky)', 'chip');
  tl.set([x25, ufi], { y: -40 }, 0); pop(x25, q('twentyfive') - 0.05, 0.35); pop(ufi, q('twentyfive') + 0.25, 0.35);
  const old = el('OLDER $200 TIER: REPORTS DIFFER — REOPENED VS. DOWNGRADED', 'left:960px;top:228px', 'foot', 'c'); inn(old, q('twentyfive') + 0.4, 0.3, { y: 10 });
  out([np, pm, x25, ufi, old], en('ultra') + 0.02, 0.25); to(S.card, en('ultra') - 0.1, 0.35, { a: 0, z: 8 }, 'power2.in');
}

// =====================================================================================
// AGENTS API · BEDROCK · DECISIONS API
// =====================================================================================
function agents() {
  const tl = K.tl; const t0 = q('devs') - 0.2;
  whip(t0, 1, 1); set(S.bg, t0, { warm: 0, cool: 0.45, space: 0.4 }); set(S.floor, t0, { a: 1, pool: 0.5 }); set(S, t0, { stars: 0.5 });
  camSet(t0, { x: 0.9, y: 0.8, z: 13.6, lx: 0.9, ly: 0.3, lz: 0, fov: 40, roll: 0, orbit: 0 }); cam(t0, q('aws') - t0 - 0.2, { z: 12.4, orbit: -0.08 }, 'power1.inOut');
  set(S.mon, t0, { x: 2.2, y: 0.55, z: -0.6, ry: 0, s: 1, set: 1, k: 0, cloud: 0 }); on(S.mon, t0 + 0.05, 0.3);
  const dv = el('FOR DEVELOPERS', 'left:110px;top:180px;color:var(--sky)', 'tag'); inn(dv, q('devs') - 0.1, 0.3, { x: -30, y: 0 });
  const aa = el('AGENTS API', 'left:110px;top:220px;font-size:96px', 'd9'); slam(aa, q('agentsapi') - 0.05, 1.35);
  const cu = el('<i></i>COMPUTER USE', 'left:112px;top:350px;color:var(--mint)', 'chip'); pop(cu, q('computeruse') - 0.05, 0.35);
  const verbs = [['clicking', 'CLICKS'], ['typing', 'TYPES'], ['navigating', 'NAVIGATES']].map(([id, n], i) => { const e = el(n, `left:${112 + i * 150}px;top:424px;font-size:20px;color:#fff`, 'chip'); pop(e, q(id) - 0.05, 0.3); return e; });
  // cursor choreography on the monitor
  const MX = (px) => 2.2 + (px / 1280 - 0.5) * 5.0, MY = (py) => 0.55 - (py / 784 - 0.5) * 3.06;
  set(S.cur, 0, { x: 6.5, y: -2.8, z: -0.2, press: 0, rip: 0 }); on(S.cur, q('computeruse') - 0.1, 0.2);
  to(S.cur, q('computeruse') - 0.1, q('clicking') - q('computeruse') + 0.05, { x: MX(640), y: MY(310) }, 'power3.inOut');
  const click = (t) => { tl.to(S.cur, { press: 1, duration: 0.06 }, t); tl.to(S.cur, { press: 0, duration: 0.18 }, t + 0.06); tl.fromTo(S.cur, { rip: 0 }, { rip: 1, duration: 0.5, ease: 'power2.out', immediateRender: false }, t); };
  click(q('clicking')); set(S.mon, q('clicking') + 0.02, { k: 1 }); set(S.mon, q('typing'), { k: 2 }); set(S.mon, q('typing') + 0.35, { k: 3 });
  to(S.cur, q('typing') + 0.3, q('navigating') - q('typing') - 0.3, { x: MX(410), y: MY(555) }, 'power3.inOut'); click(q('navigating')); set(S.mon, q('navigating') + 0.15, { k: 4 });
  to(S.cur, q('multi') - 0.1, 0.4, { x: 6.5, y: -2.8 }, 'power2.in'); off(S.cur, q('multi') + 0.2, 0.1);
  // multi-agent + hosted
  on(S.graph, q('multi') - 0.1, 0.5, 'power2.out'); set(S.graph, 0, { x: 2.2, y: 0.55, z: -0.6 });
  const ma = el('<i></i>MULTI-AGENT', 'left:112px;top:500px;color:var(--violet)', 'chip'); pop(ma, q('multi') - 0.05, 0.35);
  set(S.cloud, 0, { x: 2.2, y: 3.2, z: -0.9 }); to(S.cloud, q('hosting') - 0.1, 0.5, { a: 1 }, 'back.out(2)');
  const ho = el('<i></i>HOSTED BY OPENAI', 'left:112px;top:574px;color:#fff', 'chip'); pop(ho, q('hosting') - 0.05, 0.35);
  // AWS Bedrock
  set(S.aws, 0, { x: 2.2, y: 0.9, z: -0.6, s: 2.2 }); to(S.aws, q('aws') - 0.15, 0.5, { a: 1, s: 1 }, 'expo.out'); shake(q('aws'), 0.6);
  cam(q('aws') - 0.2, 1.0, { x: 1.4, y: 1.2, z: 15.5, lx: 1.4, ly: 0.6, orbit: 0 }, 'power2.inOut');
  const aw = el(`<div class="tag orange">RUN ENTIRELY INSIDE AWS</div><div class="d" style="font-size:52px;margin-top:10px">AMAZON <span class="orange">BEDROCK</span></div><div class="m" style="font-size:18px;margin-top:10px;color:var(--dim)">BEDROCK MANAGED AGENTS</div>`, 'left:110px;top:680px');
  inn(aw, q('aws') - 0.05, 0.35, { y: 20 });
  const gone = [dv, aa, cu, ...verbs, ma, ho, aw];
  // Decisions API: stream converges on Luna, splits approve / reject
  const t1 = q('decisions') - 0.2; whip(t1, -1, 1.1); tl.set(gone, { autoAlpha: 0 }, t1);
  ['mon', 'graph', 'cloud', 'aws'].forEach((k) => set(S[k], t1, { a: 0 })); set(S.floor, t1, { a: 0 }); set(S.bg, t1, { cool: 1, space: 0.6 });
  camSet(t1, { x: 0, y: 0.3, z: 14.5, lx: 0.4, ly: 0.1, lz: 0, orbit: 0, fov: 40 }); cam(t1, en('agents') - t1, { z: 13.2 }, 'power1.out');
  set(S.field, t1, { A: SH.GRID, B: SH.GRID, m: 1, flow: 1, x: 0, y: 0, z: 0, s: 1, rot: 0, rx: 0, spin: 0, collapse: 0, laneA: 0, laneR: 0, red: 0, size: 0.075 }); to(S.field, t1, 0.4, { a: 0.95 });
  const dt = el(`<div class="tag" style="color:var(--sky)">NEW</div><div class="d9" style="font-size:92px;margin-top:6px">DECISIONS API</div><div class="m5" style="font-size:24px;margin-top:12px;color:var(--dim)">narrow, finite-answer choices · instantly</div>`, 'left:110px;top:150px');
  slam(dt, q('decisions') - 0.05, 1.3);
  const ins = el(`CLASSIFY · ROUTE · PICK ACTIONS`, 'left:110px;top:760px;color:#fff;font-size:20px', 'chip'); inn(ins, q('decisions') + 0.4, 0.3, { y: 12 });
  const ap = el('✓ APPROVE', 'left:1500px;top:300px;color:var(--mint);font-size:30px', 'chip'), rj = el('✕ REJECT', 'left:1500px;top:720px;color:var(--red);font-size:30px', 'chip');
  pop(ap, q('approve') - 0.05, 0.35); to(S.field, q('approve') - 0.05, 0.3, { laneA: 1 }); pop(rj, q('reject') - 0.05, 0.35); to(S.field, q('reject') - 0.05, 0.3, { laneR: 1 });
  set(S.luna, 0, { x: 0, y: 0, z: 0.4 }); to(S.luna, q('luna') - 0.2, 0.6, { a: 1 }, 'back.out(2)'); burst(q('luna'), 0, 0, 0.6, 1.2);
  const ll = el(`<div class="tag" style="text-align:center">ROUTED TO THE TINY</div><div class="d" style="font-size:44px;text-align:center;margin-top:6px">GPT-6 <span class="ice">LUNA</span></div>`, 'left:1010px;top:340px', '', 'c'); inn(ll, q('luna') - 0.05, 0.3, { y: 16 });
  const lp = el(`<span class="num" style="font-size:64px;color:var(--mint)">$0.10</span><span class="m" style="font-size:20px"> IN</span><span class="num" style="font-size:64px;margin-left:26px;color:var(--sun)">$0.50</span><span class="m" style="font-size:20px"> OUT · PER 1M</span>`, 'left:960px;top:790px;white-space:nowrap', '', 'c');
  slam(lp, q('tencents') - 0.05, 1.3); const pv = el('LIMITED PREVIEW NOW · BROAD RELEASE “IN THE COMING DAYS”', 'left:960px;top:880px', 'foot', 'c'); inn(pv, q('tencents') + 0.4, 0.3, { y: 10 });
  out([dt, ins, ap, rj, ll, lp, pv], en('agents') + 0.02, 0.25); to(S.luna, en('agents') - 0.05, 0.3, { a: 0 }, 'power2.in'); to(S.field, en('agents') - 0.05, 0.3, { a: 0 });
  set(S.field, en('agents') + 0.3, { flow: 0, laneA: 0, laneR: 0 });
}

// =====================================================================================
// CODEX · SIGN IN WITH CHATGPT · PLUGINS
// =====================================================================================
function codex() {
  const tl = K.tl; const t0 = q('codexT') - 0.2;
  whip(t0, 1, 1); set(S.bg, t0, { cool: 0.5, space: 0.5 });
  camSet(t0, { x: 0, y: 0, z: 13, lx: 0, ly: 0, lz: 0, fov: 40, orbit: 0 });
  const ct = el(`<span class="d9" style="font-size:84px">CODEX</span><span class="tag" style="margin-left:22px;color:var(--violet)">CLOUD · CLI · REVIEW · SECURITY</span>`, 'left:110px;top:128px;white-space:nowrap'); slam(ct, q('codexT') - 0.1, 1.3);
  const tw = el(`<div class="winbar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="m5" style="margin-left:16px;color:#6d779c;font-size:17px">codex — cloud</span></div><div class="term" id="tm"></div><div id="scanL" style="position:absolute;left:0;right:0;height:3px;top:60px;background:var(--mint);box-shadow:0 0 22px var(--mint);opacity:0"></div>`, 'left:100px;top:240px;width:1200px;height:620px;position:absolute', 'win');
  inn(tw, q('codexT') - 0.1, 0.35, { y: 30 });
  const tm = tw.querySelector('#tm');
  const L = [['codexT', [['$ ', 'p'], ['codex cloud --persist', '']]], ['runtimes', [['▸ ', 'c'], ['persistent runtime · keeps going with the laptop closed', '']]], ['phone', [['▸ ', 'c'], ['attached: ', ''], ['mobile', 'y']]],
    ['voiceS', [['◉ voice ', 'v'], ['› "start the release checklist"', '']]], ['review', [['✓ ', 'p'], ['code review: GitHub PRs · GitLab MRs', '']]], ['security', [['◆ ', 'r'], ['security cloud: scan repo · check commits · prep fixes', '']]], ['harness', [['★ ', 'y'], ['harness open-sourced: CLI · SDK · app server', '']]]];
  L.forEach(([id, segs]) => { const d = document.createElement('div'); tm.appendChild(d); type(d, segs, q(id) - 0.05, 70, false); });
  const sl = tw.querySelector('#scanL'); tl.fromTo(sl, { opacity: 0, y: 0 }, { opacity: 1, y: 460, duration: 1.0, ease: 'power1.inOut' }, q('security') - 0.1); tl.to(sl, { opacity: 0, duration: 0.2 }, q('security') + 0.9);
  // phone + voice
  set(S.phone, 0, { x: 9, y: 0.3, z: 3.2, ry: -0.5 }); on(S.phone, q('phone') - 0.2, 0.2); to(S.phone, q('phone') - 0.2, 0.6, { x: 4.3, ry: -0.3 }, 'back.out(1.4)');
  const wv = el([...Array(24)].map(() => '<span style="display:inline-block;width:8px;margin:0 3px;border-radius:4px;background:var(--violet);height:10px;vertical-align:middle"></span>').join(''), 'left:1500px;top:862px;height:90px;display:flex;align-items:center', '', 'c');
  inn(wv, q('voiceS') - 0.1, 0.3, { y: 10 }); const bars = [...wv.children];
  dyn((T) => { if (T < q('voiceS') - 0.2 || T > q('harness') + 1) return; bars.forEach((b, i) => { b.style.height = (10 + 60 * Math.abs(Math.sin(T * 9 + i * 0.7) * Math.sin(T * 3.3 + i * 0.3))).toFixed(0) + 'px'; }); });
  const os = el('OPEN SOURCE', 'left:760px;top:700px;font-size:60px;color:var(--sun)', 'stamp'); slam(os, q('opensrc') - 0.05, 2, -6); shake(q('opensrc'), 0.5);
  const gone = [ct, tw, wv, os];
  // Sign in with ChatGPT
  const t1 = q('signin') - 0.25; whip(t1, -1, 1); tl.set(gone, { autoAlpha: 0 }, t1); set(S.phone, t1, { a: 0 });
  const btn = el(`<span style="width:58px;height:58px;border-radius:50%;border:7px solid #05060c;display:inline-block;margin-right:26px;vertical-align:middle"></span><span style="vertical-align:middle">Sign in with ChatGPT</span>`, 'left:960px;top:540px;padding:30px 56px;border-radius:999px;background:#f4f6ff;color:#05060c;font-weight:700;font-size:58px;white-space:nowrap;box-shadow:0 0 80px rgba(255,255,255,.25)', '', 'cc');
  pop(btn, t1 + 0.05, 0.45); tl.to(btn, { scale: 0.93, duration: 0.07 }, q('signin') + 0.1); tl.to(btn, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, q('signin') + 0.17);
  const cur = el('<svg width="60" height="80" viewBox="0 0 24 32"><path d="M2 2 L2 26 L8 20 L12 30 L16 28 L12 18 L20 18 Z" fill="#fff" stroke="#05060c" stroke-width="1.6"/></svg>', 'left:0;top:0'); 
  tl.fromTo(cur, { autoAlpha: 1, x: 1500, y: 900 }, { x: 1150, y: 560, duration: 0.45, ease: 'power3.out', immediateRender: false }, t1 + 0.1); tl.set(cur, { autoAlpha: 0 }, 0); tl.set(cur, { autoAlpha: 1 }, t1 + 0.1); out(cur, q('spend'), 0.2);
  const sp = el('SPEND YOUR PLUS / PRO ALLOWANCE INSIDE PARTNER APPS', 'left:960px;top:660px;color:#fff', 'tag', 'c'); inn(sp, q('spend') - 0.05, 0.3, { y: 16 });
  const named = { 0: 'Devin', 3: 'Notion', 6: 'Vercel', 9: 'T3', 12: 'OpenClaw' }; const hi = { 0: 'devin', 3: 'notion', 6: 'vercel' };
  const tiles = [...Array(16)].map((_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2; const x = 960 + Math.cos(a) * 760, y = 540 + Math.sin(a) * 380; const nm = named[i];
    const e = el(nm ? `<span style="font-size:${nm.length > 6 ? 22 : 26}px">${nm}</span>` : `<span style="width:30px;height:30px;border-radius:50%;background:${HEX[i % 5]};display:inline-block"></span>`, `left:${x}px;top:${y}px;width:${nm ? 150 : 96}px;height:96px`, 'tile', 'cc');
    pop(e, q('sixteen') - 0.1 + i * 0.025, 0.4); return e; });
  const n16 = el(`<span class="num" style="font-size:80px">16</span><span class="m" style="font-size:22px;margin-left:12px">LAUNCH PARTNERS</span>`, 'left:960px;top:260px;white-space:nowrap', '', 'c'); slam(n16, q('sixteen') - 0.05, 1.4); shake(q('sixteen'), 0.5);
  Object.entries(hi).forEach(([i, id]) => { tl.to(tiles[i], { scale: 1.22, borderColor: HEX[i % 5], boxShadow: `0 0 40px ${HEX[i % 5]}`, duration: 0.25, ease: 'back.out(3)' }, q(id) - 0.05); });
  const tb = el(`<span class="red" style="text-decoration:line-through;text-decoration-thickness:4px">TOKEN BILL</span>&nbsp; FOR DEVELOPERS`, 'left:960px;top:800px;color:#fff;font-size:26px', 'chip', 'c'); pop(tb, q('token') - 0.05, 0.4);
  const gone2 = [btn, sp, ...tiles, n16, tb];
  // plugins
  const t2 = q('plugins') - 0.2; whip(t2, 1, 1); tl.set(gone2, { autoAlpha: 0 }, t2);
  const pt = el(`<div class="tag" style="color:var(--pink)">PLUGIN EXTENSIONS</div><div class="d9" style="font-size:78px;margin-top:8px">PLUGINS, UPGRADED</div>`, 'left:110px;top:150px'); slam(pt, q('plugins') - 0.05, 1.25);
  const pw = el(`<div class="winbar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="m5" style="margin-left:16px;color:#6d779c;font-size:17px">chatgpt</span></div>
    <div style="display:flex;height:476px"><div id="sb" style="width:250px;border-right:1px solid rgba(255,255,255,.08);padding:20px;display:flex;flex-direction:column;gap:12px">${['Chats', 'Projects', 'Plugins'].map((x) => `<div style="height:44px;border-radius:12px;background:rgba(255,255,255,.05);padding:10px 14px;font-weight:600;font-size:21px">${x}</div>`).join('')}<div id="sbh" style="margin-top:8px;height:150px;border-radius:14px;border:2px solid var(--pink);background:rgba(255,111,181,.1);opacity:0"></div></div>
    <div style="flex:1;padding:26px;display:flex;flex-direction:column;gap:16px">${[70, 52, 64].map((w) => `<div style="height:18px;width:${w}%;border-radius:9px;background:#2a3150"></div>`).join('')}<div id="ev" style="margin-top:auto;display:flex;gap:10px;opacity:0">${['event.created', 'file.updated', 'task.done'].map((x) => `<span class="pill" style="background:rgba(61,169,252,.15);color:var(--sky);font-size:15px">${x}</span>`).join('')}</div></div>
    <div id="pn" style="width:0;overflow:hidden;border-left:1px solid rgba(255,255,255,.08);background:#10132a"><div style="width:300px;padding:22px"><div class="m" style="font-size:16px;color:var(--mint)">INTERACTIVE PANEL</div><div style="margin-top:16px;height:120px;border-radius:14px;background:linear-gradient(135deg,rgba(46,230,166,.25),rgba(61,169,252,.2))"></div><div style="margin-top:14px;height:120px;border-radius:14px;border:2px dashed rgba(255,255,255,.2)"></div></div></div></div>`,
    'left:110px;top:360px;width:1180px;height:520px;position:absolute', 'win');
  inn(pw, q('plugins') + 0.05, 0.4, { y: 40 });
  tl.to(pw.querySelector('#sbh'), { opacity: 1, duration: 0.3 }, q('sidebars') - 0.05); tl.to(pw.querySelector('#pn'), { width: 344, duration: 0.45, ease: 'power3.out' }, q('panels') - 0.05); tl.to(pw.querySelector('#ev'), { opacity: 1, duration: 0.3 }, q('mcp') - 0.05);
  const PL = [['sidebars', 'SIDEBAR HOMES', 'var(--pink)'], ['panels', 'INTERACTIVE PANELS', 'var(--mint)'], ['panels', 'CUSTOM FILE VIEWERS', 'var(--sun)'], ['mcp', 'MCP EVENTS', 'var(--sky)']];
  const pls = PL.map(([id, n, c], i) => { const e = el(`<i></i>${n}`, `left:1360px;top:${400 + i * 76}px;color:${c}`, 'chip'); pop(e, q(id) - 0.05 + (i === 2 ? 0.3 : 0), 0.35); return e; });
  out([pt, pw, ...pls], en('codex') + 0.02, 0.25);
}

// =====================================================================================
// COLLABORATION — Space, Pages, Slides, @ChatGPT
// =====================================================================================
function collab() {
  const tl = K.tl; const t0 = q('teamwork') - 0.2; const SP = [[-4.3, -1.6], [4.4, -1.0], [-1.9, -4.0], [2.4, -3.9], [-4.7, 1.3]];
  whip(t0, -1, 1); set(S.bg, t0, { cool: 0, space: 0, warm: 0.4 }); set(S.floor, t0, { a: 1, pool: 0.7 });
  camSet(t0, { x: 0, y: 7.2, z: 15.5, lx: 0, ly: -1.3, lz: 0, fov: 40, orbit: -0.3 }); cam(t0, q('pages') - t0 - 0.2, { orbit: 0.25, y: 6.4, z: 14 }, 'power1.inOut');
  set(S.space, 0, { stack: 0, ppl: 0, orb: 0, links: 0, rot: 0 }); on(S.space, t0 + 0.05, 0.4);
  const tw = el('THEN, TEAMWORK', 'left:110px;top:150px;color:var(--violet)', 'tag'); inn(tw, q('teamwork') - 0.1, 0.3, { x: -20, y: 0 });
  const st_ = el(`<span class="d9" style="font-size:96px">CHATGPT <span class="violet">SPACE</span></span>`, 'left:110px;top:190px;white-space:nowrap'); slam(st_, q('space') - 0.05, 1.3);
  to(S.space, q('space') - 0.1, 0.6, { stack: 1 }, 'back.out(1.6)'); shake(q('space'), 0.5);
  const sh = el('A SHARED HUB + KNOWLEDGE BASE', 'left:112px;top:300px', 'tag'); inn(sh, q('space') + 0.3, 0.3, { y: 10 });
  to(S.space, q('teammates') - 0.1, 0.8, { ppl: 1 }, 'back.out(1.8)');
  to(S.space, q('chatgptC') - 0.1, 0.5, { orb: 1 }, 'back.out(2.2)');
  ALL.forEach((i, k) => { set(S.dots[i], t0, { x: SP[i][0], z: SP[i][1], y: -1.36, s: 0, rx: 0, ry: 0, eyes: 1, dim: 0, acc: 1 }); tl.to(S.dots[i], { s: 0.6, duration: 0.45, ease: 'back.out(2.4)' }, q('dotsC') - 0.1 + k * 0.05); });
  const who = [['teammates', 'TEAMMATES', '#fff'], ['chatgptC', 'CHATGPT', 'var(--sky)'], ['dotsC', 'DOTS', 'var(--coral)']].map(([id, n, c], i) => { const e = el(`<i></i>${n}`, `left:${112 + i * 230}px;top:360px;color:${c};font-size:19px`, 'chip'); pop(e, q(id) - 0.05, 0.3); return e; });
  to(S.space, q('together') - 0.1, 0.5, { links: 1 }); burst(q('together'), 0, -0.6, 0, 1.5); flash(q('together'), 0.12);
  out([tw, st_, sh, ...who], q('pages') - 0.25, 0.25);
  // Pages
  cam(q('pages') - 0.25, 1.0, { y: 2.0, z: 11.6, ly: 0.9, orbit: 0 }, 'power2.inOut');
  to(S.space, q('pages') - 0.25, 0.35, { orb: 0 }, 'back.in(2)');
  set(S.pages, 0, { x: 0, y: -0.8, z: 0.5, s: 0.2, ry: 0, k: 0 }); on(S.pages, q('pages') - 0.2, 0.25); to(S.pages, q('pages') - 0.2, 0.7, { y: 1.3, z: 2.4, s: 1 }, 'back.out(1.3)');
  set(S.pages, q('humans') - 0.05, { k: 1 }); set(S.pages, q('humans') + 0.35, { k: 2 }); set(S.pages, q('humans') + 0.7, { k: 3 });
  const pg = el(`<div class="d9" style="font-size:88px">PAGES</div><div class="tag" style="margin-top:10px">DOCS CO-WRITTEN BY<br><span class="sky">HUMANS</span> + <span class="coral">AGENTS</span></div>`, 'left:110px;top:220px'); slam(pg, q('pages') - 0.05, 1.3);
  // Slides
  to(S.pages, q('slidesC') - 0.2, 0.6, { x: -3.6, ry: 0.35, s: 0.8 }, 'power3.inOut');
  set(S.slides, 0, { x: 2.6, y: 1.4, z: 2.2, f: 0 }); on(S.slides, q('slidesC') - 0.2, 0.25); to(S.slides, q('slidesC') - 0.15, 0.7, { f: 1 }, 'back.out(1.5)');
  out(pg, q('slidesC') - 0.25, 0.2);
  const sl = el(`<div class="d9" style="font-size:72px;text-align:right">COLLABORATIVE<br><span class="sun">SLIDES</span></div>`, 'left:1810px;top:170px', '', 'r'); slam(sl, q('slidesC') - 0.05, 1.25);
  const sw = el('COMING WEEKS · EXPORT TO POWERPOINT + GOOGLE SLIDES', 'left:960px;top:880px', 'foot', 'c'); inn(sw, q('weeksC') - 0.1, 0.3, { y: 10 });
  // @ChatGPT in Slack / Teams
  const t2 = q('mention') - 0.25; out([sl, sw], t2, 0.2); to(S.pages, t2, 0.3, { a: 0 }); to(S.slides, t2, 0.3, { a: 0 });
  const cw = el(`<div class="winbar"><span class="m5" style="color:#9aa3c4;font-size:18px"># launch-team</span></div><div style="padding:26px 30px;display:flex;flex-direction:column;gap:22px">
    <div class="row" style="align-items:flex-start"><span style="width:52px;height:52px;border-radius:12px;background:var(--sky);flex:none"></span><div><div style="font-weight:700;font-size:22px">Maya</div><div style="font-size:30px;margin-top:4px"><span style="background:rgba(61,169,252,.2);color:var(--sky);border-radius:8px;padding:0 8px">@ChatGPT</span> summarize this thread</div></div></div>
    <div class="row" id="rep" style="align-items:flex-start;opacity:0"><span style="width:52px;height:52px;border-radius:50%;background:#f4f6ff;flex:none"></span><div><div style="font-weight:700;font-size:22px">ChatGPT</div><div id="rt" style="font-size:28px;margin-top:4px;color:#cfd6f5"></div></div></div></div>`, 'left:960px;top:260px;width:1040px;position:absolute', 'win', 'c');
  inn(cw, q('mention') - 0.15, 0.35, { y: 40 }); tl.to(cw.querySelector('#rep'), { opacity: 1, duration: 0.25 }, q('mention') + 0.5);
  type(cw.querySelector('#rt'), [['3 decisions, 2 open questions, 1 owner per task.', '']], q('mention') + 0.6, 45);
  const chs = [['SLACK', 'var(--violet)'], ['MICROSOFT TEAMS', 'var(--sky)']].map(([n, c], i) => { const e = el(`<i></i>${n}`, `left:${760 + i * 230}px;top:700px;color:${c}`, 'chip'); pop(e, q('slackC') - 0.05 + i * 0.25, 0.35); return e; });
  out([cw, ...chs], en('collab') + 0.02, 0.25); off(S.space, en('collab'), 0.2); ALL.forEach((i) => to(S.dots[i], en('collab'), 0.2, { s: 0 }));
}

// =====================================================================================
// ENTERPRISE — Private Intelligence, Marketplace
// =====================================================================================
function enterprise() {
  const tl = K.tl; const t0 = q('enter') - 0.2;
  whip(t0, 1, 1); set(S.bg, t0, { warm: 0, cool: 0.7, space: 0.2 }); set(S.floor, t0, { a: 0.7, pool: 0.4 });
  camSet(t0, { x: 2.2, y: 1.6, z: 12.5, lx: 2.2, ly: 0.2, lz: 0, fov: 40, orbit: 0 }); cam(t0, q('market') - t0, { orbit: 0.22, z: 11.5 }, 'power1.inOut');
  set(S.vault, 0, { x: 4.4, y: 0.35, z: 0, lock: 0, scan: 0, rot: 0 }); on(S.vault, t0 + 0.05, 0.4);
  set(S.field, t0, { A: SH.CUBE, B: SH.CUBE, m: 1, flow: 0, x: 4.4, y: 0.1, z: 0, s: 0.95, rot: 0, rx: 0, spin: 0, collapse: 0, red: 0, size: 0.06 }); to(S.field, t0 + 0.1, 0.5, { a: 0.9 });
  to(S.field, t0, q('zero') - t0, { rot: 1.4 }, 'none');
  const fe = el('FOR ENTERPRISE', 'left:110px;top:170px;color:var(--mint)', 'tag'); inn(fe, q('enter') - 0.1, 0.3, { x: -20, y: 0 });
  const pi = el(`<div class="d9" style="font-size:92px;line-height:.92">PRIVATE<br>INTELLIGENCE</div>`, 'left:110px;top:212px'); slam(pi, q('private') - 0.05, 1.3);
  to(S.vault, q('private') - 0.08, 0.5, { lock: 1 }, 'back.out(1.6)'); shake(q('private'), 0.5);
  const R = [['zero', 'ZERO DATA RETENTION', 'var(--mint)'], ['safety', 'AUTOMATED SAFETY REVIEW', 'var(--sky)'], ['staff', 'NO OPENAI STAFF ACCESS', 'var(--coral)'], ['confidential', 'PRIVATE INFERENCE · CONFIDENTIAL COMPUTING', 'var(--violet)']];
  const rows = R.map(([id, n, c], i) => { const e = el(`<i></i>${n}`, `left:112px;top:${440 + i * 74}px;color:${c}`, 'chip'); pop(e, q(id) - 0.05, 0.35); return e; });
  const zero = el('0', 'left:0;top:0;font-size:220px;color:var(--mint)', 'num', 'cc'); pin(zero, () => [S.vault.x, S.vault.y, 0]); slam(zero, q('zero') + 0.05, 1.8); out(zero, q('safety') - 0.1, 0.25);
  to(S.field, q('zero') - 0.1, 0.6, { collapse: 1, a: 0 }, 'power3.in');
  tl.fromTo(S.vault, { scan: 0 }, { scan: 1, duration: 1.0, ease: 'power1.inOut', immediateRender: false }, q('safety') - 0.05);
  const fa = el('PREVIEW THIS FALL', 'left:880px;top:740px;color:var(--sun);font-size:40px', 'stamp'); slam(fa, q('fall') - 0.05, 1.8, -5);
  const ind = el('HEALTHCARE · BANKING · LEGAL', 'left:112px;top:760px', 'foot'); inn(ind, q('fall') + 0.1, 0.3, { y: 10 });
  const gone = [fe, pi, ...rows, fa, ind];
  // Marketplace
  const t1 = q('market') - 0.25; whip(t1, -1, 1); tl.set(gone, { autoAlpha: 0 }, t1); set(S.vault, t1, { a: 0 });
  set(S.field, t1, { A: SH.GRID, B: SH.GRID, m: 1, x: 0, y: 0, z: 0, s: 1, rot: 0, collapse: 0, size: 0.07 }); to(S.field, t1, 0.5, { a: 0.35 });
  camSet(t1, { x: 0, y: 0, z: 12, lx: 0, ly: 0, lz: 0, orbit: 0 }); cam(t1, en('enterprise') - t1, { z: 10.5 }, 'power1.inOut');
  const mt = el(`<div class="tag" style="text-align:center;color:var(--mint)">OPENAI</div><div class="d9" style="font-size:96px;text-align:center">MARKETPLACE</div>`, 'left:960px;top:120px', '', 'c'); slam(mt, q('market') - 0.05, 1.3);
  const cm = el('SPEND EXISTING OPENAI COMMITMENTS ON PARTNER PRODUCTS', 'left:960px;top:290px;color:#fff', 'tag', 'c'); inn(cm, q('commit') - 0.1, 0.3, { y: 12 });
  const N = { 0: 'Adobe', 2: 'Figma', 5: 'Sierra', 9: 'HubSpot', 12: 'Salesforce', 14: 'ServiceNow', 19: 'Harvey', 21: 'Legora', 26: 'Palo Alto Networks', 29: 'CrowdStrike' };
  const tiles = [...Array(32)].map((_, i) => { const c = i % 8, r = Math.floor(i / 8); const nm = N[i];
    const e = el(nm ? `<span style="font-size:${nm.length > 12 ? 17 : 22}px;padding:0 8px">${nm}</span>` : `<span style="width:22px;height:22px;border-radius:50%;background:${HEX[i % 5]};opacity:.75;display:inline-block"></span>`, `left:${248 + c * 184}px;top:${370 + r * 112}px;width:168px;height:96px`, 'tile');
    tl.fromTo(e, { autoAlpha: 0, scale: 0.5, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, q('market') + 0.1 + (c + r) * 0.05); return e; });
  const n32 = el(`<span class="num" style="font-size:70px;color:var(--mint)">32</span><span class="m" style="font-size:22px;margin-left:12px">PARTNERS</span>`, 'left:960px;top:830px;white-space:nowrap', '', 'c'); slam(n32, q('thirtytwoP') - 0.05, 1.4);
  [['adobe', 0], ['figma', 2], ['salesforce', 12], ['crowdstrike', 29]].forEach(([id, i]) => { tl.to(tiles[i], { scale: 1.16, borderColor: HEX[i % 5], boxShadow: `0 0 36px ${HEX[i % 5]}`, duration: 0.25, ease: 'back.out(3)' }, q(id) - 0.05); });
  const ap = el('ENTERPRISE APPLICATIONS OPEN NOW', 'left:960px;top:930px', 'foot', 'c'); inn(ap, q('crowdstrike') + 0.2, 0.3, { y: 10 });
  out([mt, cm, ...tiles, n32, ap], en('enterprise') + 0.02, 0.3); to(S.field, en('enterprise'), 0.4, { a: 0 });
}

// =====================================================================================
// BACKDROP — Astra scrapped, training paused, incidents, not in the keynote
// =====================================================================================
function backdrop() {
  const tl = K.tl; const t0 = q('but') - 0.25;
  set(S.bg, t0, { cool: 0, space: 0, warm: 0 }); to(S.bg, t0, 1.2, { mood: 1 }); to(S.grade, t0, 1.2, { red: 0.2, sat: 0.8 }); set(S.floor, t0, { a: 1, pool: 0.35 }); flash(t0 + 0.05, 0.2);
  camSet(t0, { x: 0, y: 1.0, z: 12, lx: 0, ly: -0.5, lz: 0, fov: 40, orbit: 0, roll: 0 }); cam(t0 + 0.1, 3.2, { y: 2.6, z: 21, ly: 0.8 }, 'power2.inOut');
  ALL.forEach((i, k) => { set(S.dots[i], t0, { x: DOT_X[i] * 0.55, y: -1.96 + 0.55, z: 0, s: 0, eyes: 1, dim: 0, rx: 0, ry: 0, acc: 1, glow: 0 }); tl.to(S.dots[i], { s: 0.55, duration: 0.4, ease: 'back.out(2)' }, t0 + 0.1 + k * 0.04); });
  set(S.field, t0, { A: SH.SCATTER, B: SH.SCATTER, m: 1, x: 0, y: 2, z: -6, s: 1.4, rot: 0, rx: 0.2, spin: 0, red: 1, size: 0.06, flow: 0, collapse: 0 }); to(S.field, t0, 1.5, { a: 0.25 }); to(S.field, t0, en('backdrop') - t0, { spin: 0.6 }, 'none');
  const bt = el(`<div class="tag" style="text-align:center;color:var(--red)">WHAT THE KEYNOTE DIDN'T SAY</div><div class="d9" style="font-size:120px;text-align:center;margin-top:10px">THE BACKDROP</div>`, 'left:960px;top:140px', '', 'c'); slam(bt, q('backdropW') - 0.05, 1.25);
  out(bt, q('oneday') - 0.25, 0.25);
  // Astra scrapped
  set(S.crystal, t0, { a: 0, x: 0, y: 3.6, s: 0.3, ex: 0, dim: 0, red: 0 });
  on(S.crystal, q('oneday') - 0.2, 0.3); to(S.crystal, q('oneday') - 0.2, 0.6, { s: 1.6 }, 'back.out(1.5)');
  const od = el('ONE DAY EARLIER', 'left:110px;top:160px;color:var(--sun)', 'chip'); pop(od, q('oneday') - 0.1, 0.35);
  const an = el(`<div class="tag" style="text-align:center">PLANNED RELEASE</div><div class="d" style="font-size:48px;text-align:center;margin-top:6px">GPT-6.1 ASTRA</div>`, 'left:0;top:0', '', 'c'); pin(an, () => [0, S.crystal.y + 2.9, 0]); inn(an, q('oneday'), 0.3, { y: -10 });
  to(S.crystal, q('scrapped') - 0.1, 1.5, { ex: 1 }, 'power3.out'); to(S.crystal, q('scrapped') - 0.1, 0.4, { dim: 1, red: 1 }); shake(q('scrapped'), 1.5, 1.0); glitch(q('scrapped'), 1.1, 0.7); flash(q('scrapped'), 0.35);
  const sc = el('SCRAPPED', 'left:960px;top:420px;font-size:150px;color:var(--red)', 'stamp', 'c'); slam(sc, q('scrapped') + 0.3, 2.2, -7); shake(q('scrapped') + 0.35, 0.8);
  const oc = el('REPORTEDLY · OVER SAFETY CONCERNS', 'left:960px;top:650px;color:#fff', 'chip', 'c'); pop(oc, q('concerns') - 0.1, 0.35);
  out([sc, oc, an, od], q('weeks') - 0.2, 0.25); off(S.crystal, q('weeks') - 0.2, 0.3);
  // training paused
  const wb = el('WEEKS BEFORE', 'left:110px;top:160px;color:var(--sun)', 'chip'); pop(wb, q('weeks') - 0.1, 0.35);
  const pz = el(`<div style="display:flex;gap:40px;justify-content:center"><div style="width:70px;height:210px;border-radius:12px;background:var(--ice);box-shadow:0 0 60px var(--ice)"></div><div style="width:70px;height:210px;border-radius:12px;background:var(--ice);box-shadow:0 0 60px var(--ice)"></div></div><div class="d9" style="font-size:78px;text-align:center;margin-top:26px;color:var(--ice)">TRAINING PAUSED</div><div class="tag" style="text-align:center;margin-top:10px">ITS MOST CAPABLE MODELS · AFTER AGENT INCIDENTS</div>`, 'left:960px;top:240px;width:1400px', '', 'c');
  slam(pz, q('paused') - 0.05, 1.5); to(S.grade, q('paused') - 0.05, 0.3, { ice: 1 }); to(S.grade, q('incidents') - 0.1, 0.4, { ice: 0 }); dotsTo(ALL, q('paused'), 0.3, { eyes: 0.15, dim: 0.5 }, 'power2.out');
  out([pz, wb], q('gov') - 0.2, 0.2);
  // incidents
  const news = (t, head, sub, y) => { const e = el(`<div class="m" style="font-size:17px;color:var(--red)">● INCIDENT · REPORTED</div><div class="d" style="font-size:52px;margin-top:10px">${head}</div><div class="m5" style="font-size:20px;color:var(--dim);margin-top:10px">${sub}</div>`, `left:960px;top:${y}px;width:1300px;border-left:10px solid var(--red)`, 'card', 'c');
    tl.fromTo(e, { autoAlpha: 0, x: -60, skewX: -8 }, { autoAlpha: 1, x: 0, skewX: 0, duration: 0.3, ease: 'expo.out' }, t); glitch(t, 0.8, 0.35); return e; };
  const n1 = news(q('gov') - 0.1, 'AGENTS BREACHED GOVERNMENT SITES', 'OPENAI AGENTS · SECURITY CONCERNS DOMINATING THE WEEK', 190), n2 = news(q('hugging') - 0.1, 'THE HUGGING FACE INCIDENT', 'A SECOND AGENT INCIDENT', 420);
  // not in the keynote
  tl.to([n1, n2], { opacity: 0.35, duration: 0.3 }, q('keynote') - 0.1);
  const kn = el(`<svg width="64" height="64" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:18px"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff"/><path d="M17 9l5 6M22 9l-5 6" stroke="#ff3355" stroke-width="2.4" stroke-linecap="round"/></svg><span class="d9" style="font-size:64px;vertical-align:middle">THE KEYNOTE</span>`, 'left:960px;top:660px;white-space:nowrap', '', 'c'); inn(kn, q('keynote') - 0.1, 0.3, { y: 20 });
  const nm = el('MENTIONED NONE OF IT', 'left:960px;top:790px;font-size:70px;color:var(--red)', 'stamp', 'c'); slam(nm, q('none') - 0.05, 2, -3); shake(q('none'), 0.9);
  const ap = el('KSAT / AP: ALTMAN UNVEILED THE ALWAYS-ON AGENT “AFTER OPENAI SHELVES ANOTHER” MODEL', 'left:960px;top:935px;white-space:nowrap', 'foot', 'c'); inn(ap, q('none') + 0.4, 0.3, { y: 10 });
  out([n1, n2, kn, nm, ap], en('backdrop') + 0.05, 0.3);
}

// =====================================================================================
// OUTRO — the real question; always on; so is the spotlight; end card
// =====================================================================================
function outro() {
  const tl = K.tl; const t0 = st('outro') - 0.05;
  to(S.field, t0, 0.3, { a: 0.9, red: 0.35, s: 1, x: 3.6, y: 0.2, z: 0, rx: 0, spin: 0, size: 0.075 }); morph(q('question') - 0.6, SH.SCATTER, SH.QUESTION, 1.0);
  ALL.forEach((i) => to(S.dots[i], t0, 0.3, { s: 0 }, 'power2.in'));
  cam(t0, 1.2, { x: 0, y: 0.4, z: 13.5, lx: 0, ly: 0.2 }, 'power2.inOut'); to(S.grade, t0, 0.6, { sat: 1, red: 0.1 });
  const rq = el('THE REAL QUESTION', 'left:110px;top:230px;color:var(--red);font-size:26px', 'tag'); inn(rq, q('question') - 0.15, 0.3, { x: -20, y: 0 }); shake(q('question'), 0.5); pulse(q('question'), 1.2);
  const l1 = el('CAN OPENAI SHIP', 'left:110px;top:290px;font-size:78px', 'd9'); inn(l1, q('ship') - 0.1, 0.3, { x: -30, y: 0 });
  const l2 = el(`<span class="coral">PERSISTENT</span>, <span class="sun">AUTONOMOUS</span><br>AGENTS`, 'left:110px;top:390px;font-size:78px', 'd9'); inn(l2, q('autonomous') - 0.35, 0.3, { x: -30, y: 0 });
  const l3 = el(`<div class="d" style="font-size:44px">AS SAFETY SCRUTINY PEAKS?</div><div class="bar" style="margin-top:22px;width:760px;height:22px"><b id="sm" style="background:linear-gradient(90deg,var(--sun),var(--red))"></b></div>`, 'left:110px;top:600px'); inn(l3, q('scrutiny') - 0.4, 0.3, { x: -30, y: 0 });
  tl.fromTo(l3.querySelector('#sm'), { width: '0%' }, { width: '100%', duration: q('peak') - q('scrutiny') + 0.35, ease: 'power2.in' }, q('scrutiny') - 0.3); shake(q('peak'), 1.1); flash(q('peak'), 0.25); ab(q('peak'), 1.2);
  out([rq, l1, l2, l3], q('alwaysO') - 0.2, 0.25); to(S.field, q('alwaysO') - 0.2, 0.4, { a: 0 });
  // always on
  to(S.bg, q('alwaysO') - 0.2, 0.6, { mood: 0.45 }); to(S.grade, q('alwaysO') - 0.2, 0.6, { red: 0 }); to(S.floor, q('alwaysO') - 0.2, 0.5, { a: 1, pool: 0.5 });
  cam(q('alwaysO') - 0.2, 1.0, { x: 0, y: 0.9, z: 12.2, lx: 0, ly: -0.3 }, 'power2.out');
  ALL.forEach((i, k) => { set(S.dots[i], q('alwaysO') - 0.25, { x: DOT_X[i], y: DOT_Y, z: 0, rx: 0, ry: 0, dim: 0, eyes: 1, acc: 1 }); tl.to(S.dots[i], { s: 1, duration: 0.45, ease: 'back.out(2.4)' }, q('alwaysO') - 0.15 + k * 0.05); });
  const ao = el(`THE DOTS ARE <span class="mint">ALWAYS ON.</span>`, 'left:960px;top:150px;font-size:84px;white-space:nowrap', 'd9', 'c'); inn(ao, q('alwaysO') - 0.1, 0.35, { y: -20 });
  dotsTo(ALL, q('on') - 0.05, 0.2, { glow: 0.45 }, 'power2.out'); flash(q('on'), 0.12);
  // spotlight slam
  set(S.spot, 0, { a: 0 }); tl.to(S.spot, { a: 1, duration: 0.06, ease: 'none' }, q('spotlight') - 0.05);
  to(S.floor, q('spotlight') - 0.05, 0.1, { pool: 2.4 }); flash(q('spotlight'), 0.5, 0.5); shake(q('spotlight'), 1.3, 0.9); to(S.bg, q('spotlight') - 0.05, 0.1, { mood: 0.8 });
  dotsTo(ALL, q('spotlight') + 0.05, 0.25, { eyes: 0.3, rx: -0.3, glow: 0 }, 'power2.out'); ALL.forEach((i, k) => squash(i, q('spotlight') + k * 0.03, 0.22));
  const sp = el(`SO IS THE <span class="red">SPOTLIGHT.</span>`, 'left:960px;top:260px;font-size:84px;white-space:nowrap', 'd9', 'c'); slam(sp, q('spotlight') - 0.02, 1.5);
  // end card
  const tE = q('spotlight') + 1.3;
  tl.to([ao, sp], { y: -60, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, tE);
  cam(tE, DUR - tE, { y: 1.6, z: 14.5, ly: -1.2 }, 'power1.inOut');
  const ec = el(`<div class="row" style="justify-content:center;gap:14px"><span class="dots5">${HEX.slice(0, 5).map((c) => `<span style="background:${c};width:18px;height:18px"></span>`).join('')}</span><span class="tag" style="color:#fff">OPENAI DEVDAY 2026 · SEP 29 · SAN FRANCISCO</span></div>
    <div class="d9" style="font-size:64px;text-align:center;margin-top:16px">20+ LAUNCHES. ONE QUESTION.</div>
    <div class="m5" style="font-size:22px;color:#c3cae6;text-align:center;margin-top:18px;line-height:1.6">DOTS · GPT-6.1 SOL · ULTRAFAST · PRO 500 · AGENTS API · BEDROCK · DECISIONS API · CODEX · SIGN IN WITH CHATGPT · PLUGINS<br>CHATGPT SPACE · PAGES · SLIDES · PRIVATE INTELLIGENCE · MARKETPLACE</div>`, 'left:960px;top:120px;width:1700px', '', 'c');
  inn(ec, tE + 0.2, 0.5, { y: 30 });
  const src = el(`SOURCES · OPENAI DEVDAY RECAP · DEV COMMUNITY · DECRYPT · AXIOS · THE REGISTER · LATENT SPACE · CNBC · BUSINESS STANDARD · IMPLICATOR · ANDROID HEADLINES · KSAT/AP · BGR<br>COMPILED FROM SECONDARY REPORTS · PRICES + BENCHMARKS VARY BY OUTLET — CHECK OPENAI'S PRICING PAGE`, 'left:960px;top:905px;width:1800px;text-align:center;line-height:1.7;font-size:15px', 'foot', 'c');
  inn(src, tE + 0.5, 0.5, { y: 10 });
}
