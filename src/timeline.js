/* global gsap */
import { S, initWorld, render, refreshTextures } from './world.js';

import DATA from '../build/data.js';
const D = DATA;
const Q = D.cues, DUR = D.duration;
const q = (id, off = 0) => { if (Q[id] === undefined) throw new Error('missing cue ' + id); return Q[id] + off; };
const scn = (id) => D.timing.scenes.find((s) => s.id === id);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9'\-]/g, '');

const ui = document.getElementById('ui');
const tl = gsap.timeline({ paused: true });

// ---------- helpers ----------
function el(html, css = '', cls = '') { const d = document.createElement('div'); d.className = 'abs ' + cls; d.style.cssText = css; d.innerHTML = html; ui.appendChild(d); return d; }
const inn = (e, t, d = 0.4, from = { y: 36, scale: 0.97 }, to = {}) => tl.fromTo(e, { autoAlpha: 0, ...from }, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: d, ease: 'power3.out', ...to }, t);
const out = (e, t, d = 0.28) => tl.to(e, { autoAlpha: 0, duration: d, ease: 'power2.in' }, t);
const slam = (e, t, rot = 0, s0 = 1.7) => tl.fromTo(e, { autoAlpha: 0, scale: s0, rotation: rot }, { autoAlpha: 1, scale: 1, rotation: rot, duration: 0.26, ease: 'expo.out' }, t);
const count = (e, a, b, t, d, fmt = (v) => Math.round(v).toLocaleString('en-US')) => { const o = { v: a }; tl.fromTo(o, { v: a }, { v: b, duration: d, ease: 'power2.out', onUpdate() { e.textContent = fmt(o.v); } }, t); };
const cam = (t, d, pose, ease = 'power2.inOut') => tl.to(S.cam, { ...pose, duration: d, ease }, t);
const on = (k, t, d = 0.45) => tl.to(S.a, { [k]: 1, duration: d, ease: 'power1.out' }, t);
const off = (k, t, d = 0.45) => tl.to(S.a, { [k]: 0, duration: d, ease: 'power1.in' }, t);
// Impulse effects are pure functions of time (no competing tweens), so random-access seeking stays exact.
const IMP = { shake: [], glitch: [], flash: [], g0: [], g1: [], g2: [], g3: [] };
const shake = (t, amp = 1, d = 0.7) => IMP.shake.push([t, amp, d]);
const glitch = (t, amp = 1, d = 0.5) => IMP.glitch.push([t, amp, d]);
const flashAt = (t, amp = 0.5, d = 0.4) => IMP.flash.push([t, amp, d]);
const gpulse = (i, t, amp = 1, d = 0.8) => IMP['g' + i].push([t, amp, d]);
const imp = (k, t) => { let m = 0; for (const [t0, a, d] of IMP[k]) { const x = (t - t0) / d; if (x >= 0 && x < 1) m = Math.max(m, a * (1 - x) * (1 - x)); } return m; };
const cut = (t) => { flashAt(t - 0.02, 0.5, 0.38); glitch(t - 0.02, 0.9, 0.45); };
const W = (s, cls) => `<span class="${cls}">${s}</span>`;

// ---------- persistent HUD ----------
const hud = el(`<div class="tag">DAILY AI SUMMARY &nbsp;·&nbsp; STORY 01 &nbsp;·&nbsp; SEP 29 2026</div><div class="tag" id="sect"></div>`, 'left:44px;top:34px;right:44px;display:flex;justify-content:space-between');
tl.set(hud, { autoAlpha: 1 }, 0);
const sect = hud.querySelector('#sect');
const SECT = { hook: '01 / THE PAUSE', escape: '02 / THE ESCAPE', gov: '03 / THE TARGETS', leak: '04 / THE LEAK', astra: '05 / ASTRA SHELVED', fallout: '06 / FALLOUT', why: '07 / WHY IT MATTERS', outro: '08 / WHAT NEXT' };
D.timing.scenes.forEach((s) => tl.call(() => { sect.textContent = SECT[s.id]; }, null, s.start - 0.01));
const pb = document.getElementById('pb'); tl.fromTo(pb, { width: '0%' }, { width: '100%', duration: DUR, ease: 'none' }, 0);

// ---------- kinetic captions, word-synced ----------
{
  const hlAll = new Set(D.story.scenes.flatMap((s) => s.hl.map(norm)));
  const caps = document.getElementById('caps');
  D.timing.scenes.forEach((sc) => {
    const hl = new Set(D.story.scenes.find((s) => s.id === sc.id).hl.map(norm));
    const chunks = []; let cur = [];
    sc.words.forEach((w, i) => { cur.push(w); const end = /[.?!:;]$/.test(w.w) || (/[,]$/.test(w.w) && cur.length >= 2) || cur.length >= 4 || cur.map((x) => x.w).join(' ').length > 26; if (end || i === sc.words.length - 1) { chunks.push(cur); cur = []; } });
    chunks.forEach((ch, ci) => {
      const t0 = sc.start + ch[0].start - 0.03; const nxt = chunks[ci + 1]; const t1 = nxt ? sc.start + nxt[0].start - 0.03 : sc.end + 0.25;
      const d = document.createElement('div'); d.className = 'cap';
      d.innerHTML = ch.map((w) => (hl.has(norm(w.w)) ? `<b>${w.w.replace(/[.,?!:;]+$/, '')}</b>` : w.w.replace(/[.,?!:;]+$/, ''))).join(' ');
      caps.appendChild(d);
      tl.fromTo(d, { autoAlpha: 0, y: 14, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.14, ease: 'power3.out' }, t0);
      tl.set(d, { autoAlpha: 0 }, Math.max(t0 + 0.16, t1 - 0.01));
    });
  });
}

// ---------- world init ----------
initWorld(document.getElementById('gl'));
document.fonts.ready.then(() => { refreshTextures(); });
const st = (id) => scn(id).start, en = (id) => scn(id).end;

// initial state
Object.assign(S.cam, { x: 0, y: 1.6, z: 17, lx: 0, ly: 0, lz: 0, fov: 50 });

// ===================================================================
// 01 HOOK
// ===================================================================
{
  tl.fromTo(S.a, { cube: 0, agents: 0 }, { cube: 1, agents: 1, duration: 1.1 }, 0.1);
  cam(0.1, q('pause') - 0.1, { x: 0, y: 0.7, z: 9.6, ly: 0 }, 'power2.out');
  const dateE = el(`<div class="huge" style="font-size:270px;color:#fff;text-shadow:0 0 60px rgba(53,224,255,.45)">SEP 28</div><div class="tag" style="font-size:30px;margin-top:22px;color:var(--cy)">2026 &nbsp;·&nbsp; ANNOUNCEMENT</div>`, 'left:110px;top:280px;transform-origin:0 50%');
  slam(dateE, q('date'), 0, 1.5); tl.to(dateE, { x: -80, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, q('pause') - 0.05);
  const openai = el(`<div class="tag" style="font-size:34px;color:#fff;text-align:center">OPENAI HITS</div>`, 'left:960px;top:290px;transform:translateX(-50%)');
  const pause = el(`<div class="huge red" style="font-size:430px;letter-spacing:-.05em;text-shadow:0 0 80px rgba(255,46,77,.6);white-space:nowrap">PAUSE</div>`, 'left:960px;top:330px;transform-origin:50% 50%');
  tl.set(pause, { xPercent: -50 }, 0); tl.set(openai, { xPercent: -50 }, 0);
  inn(openai, q('pause') - 0.2, 0.2, { y: -20 }, { xPercent: -50 });
  slam(pause, q('pause') - 0.02, 0, 2.2); tl.set(pause, { xPercent: -50 }, q('pause') - 0.03);
  shake(q('pause'), 1.3, 0.9); flashAt(q('pause'), 0.7, 0.5); glitch(q('pause'), 0.8, 0.6);
  // three chips
  const mk = (txt, y) => el(`<span style="font-size:32px">⏸</span>&nbsp; ${txt}`, `left:110px;top:${y}px`, 'chip');
  const chips = [mk('TRAINING', 640), mk('EVALUATION', 720), mk('INFERENCE', 800)];
  ['train', 'eval', 'infer'].forEach((k, i) => { slam(chips[i], q(k), 0, 1.35); tl.to(chips[i], { color: '#ff2e4d', duration: 0.01 }, q(k)); });
  tl.to(pause, { color: '#bfefff', textShadow: '0 0 90px rgba(191,239,255,.75)', duration: 0.3 }, q('frozen'));
  tl.to(chips, { color: '#bfefff', duration: 0.3 }, q('frozen'));
  tl.fromTo(S, { ice: 0 }, { ice: 1, duration: 0.5 }, q('frozen'));
  tl.to(S.cam, { fov: 42, duration: 1.0, ease: 'power1.out' }, q('frozen'));
  const frz = el(`❄ ALL SYSTEMS FROZEN`, 'left:1180px;top:740px;color:#bfefff', 'chip'); inn(frz, q('frozen') + 0.1, 0.3);
  // broke
  tl.to(S.cam, { fov: 50, z: 6.8, duration: 0.5, ease: 'power3.in' }, q('broke') - 0.2);
  tl.fromTo(S, { ice: 1 }, { ice: 0, duration: 0.15 }, q('broke') - 0.05);
  tl.to(S, { red: 1, duration: 0.2 }, q('broke') - 0.05);
  tl.to(S, { breach: 0.22, duration: 0.5, ease: 'power2.out' }, q('broke'));
  shake(q('broke') - 0.05, 2, 1.0); glitch(q('broke') - 0.05, 1.2, 0.9); flashAt(q('broke') - 0.05, 0.55, 0.35);
  out([pause, openai], q('broke') - 0.12, 0.15); out(chips, q('broke') - 0.1, 0.2); out(frz, q('broke') - 0.1, 0.2);
  const bro = el(`<div class="huge" style="font-size:168px;color:#fff;white-space:nowrap;text-shadow:0 0 60px rgba(255,46,77,.9)">AGENTS <span class="red">BROKE OUT</span></div>`, 'left:960px;top:400px');
  tl.set(bro, { xPercent: -50 }, 0); slam(bro, q('broke') - 0.03, 0, 1.6); tl.set(bro, { xPercent: -50 }, q('broke') - 0.02); out(bro, en('hook') + 0.15, 0.3);
}

// ===================================================================
// 02 ESCAPE
// ===================================================================
{
  const t0 = st('escape'); cut(t0);
  cam(t0, 1.0, { x: -1.0, y: 0.5, z: 8.6, fov: 48 }, 'power3.out');
  const sbx = el(`<div class="tag" style="color:var(--cy)">▌SANDBOX</div><div class="mono" style="font-size:20px;color:#7fa3c9;margin-top:6px">network-restricted · contained</div>`, 'left:150px;top:300px');
  inn(sbx, q('agents') - 0.1); out(sbx, q('slipped') + 0.3);
  const ag = el(`<div class="tag" style="font-size:24px;color:#fff;background:rgba(255,46,77,.9);padding:8px 16px;border-radius:6px">AUTONOMOUS AGENTS</div>`, 'left:150px;top:380px');
  inn(ag, q('agents') + 0.1); out(ag, q('slipped') + 0.3);
  // breach
  tl.to(S, { breach: 1, duration: 1.4, ease: 'power2.in' }, q('slipped') - 0.25);
  tl.to(S, { esc: 1, duration: 4.4, ease: 'power1.inOut' }, q('slipped') - 0.05);
  tl.to(S.cam, { y: 1.0, z: 11.0, duration: 2.0, ease: 'power2.out' }, q('slipped') + 0.2);
  shake(q('slipped') - 0.1, 1.4, 1.0); glitch(q('slipped') - 0.1, 1.0, 0.8);
  const alarm = el(`⚠ SANDBOX BREACH`, 'left:960px;top:118px;color:#ff2e4d;font-size:34px', 'chip');
  tl.set(alarm, { xPercent: -50 }, 0); slam(alarm, q('slipped') - 0.05, 0, 1.4); tl.set(alarm, { xPercent: -50 }, q('slipped')); tl.to(alarm, { opacity: 0.35, repeat: 5, yoyo: true, duration: 0.18 }, q('slipped') + 0.3); out(alarm, q('internet') + 0.4);
  const rst = el(`NETWORK RESTRICTIONS <span class="red">BYPASSED</span>`, 'left:960px;top:172px;font-size:30px', 'tag'); tl.set(rst, { xPercent: -50 }, 0);
  inn(rst, q('slipped') + 0.25, 0.3, { y: -14 }, { xPercent: -50 }); out(rst, q('internet') + 0.4);
  // internet
  on('globe', q('internet') - 0.3, 1.0); tl.to(S, { globeM: 1, duration: 3.0, ease: 'power2.inOut' }, q('internet') - 0.3);
  tl.to(S.cam, { x: -3.2, y: 2.2, z: 25, fov: 46, lx: -3.2, duration: 3.2, ease: 'power2.inOut' }, q('internet') - 0.3);
  const net = el(`<div class="tag" style="font-size:26px;color:var(--am)">▌THE OPEN INTERNET</div>`, 'left:110px;top:120px'); inn(net, q('internet') + 0.2); out(net, q('dozen') + 1.2);
  // stat cards (right)
  const card = (y, big, lbl, col) => el(`<div class="big ${col}" data-v>${big}</div><div class="lbl">${lbl}</div>`, `left:1290px;top:${y}px;width:520px`, 'card');
  const c1 = card(150, '0', 'incidents by mid-September · “two dozen”', 'red');
  const c2 = card(390, '0', 'pauses in three months', 'am');
  const c3 = card(640, '0', 'agents · July Hugging Face incident', 'pu');
  slam(c1, q('dozen') - 0.1, 0, 1.25); count(c1.querySelector('[data-v]'), 0, 24, q('dozen') - 0.1, 0.7, (v) => '~' + Math.round(v));
  slam(c2, q('second') - 0.1, 0, 1.25); count(c2.querySelector('[data-v]'), 0, 2, q('second') - 0.1, 0.4);
  const tlm = el(`<div style="display:flex;align-items:center;gap:14px;margin-top:14px"><span class="mono" style="font-size:18px;color:#ffb020">JULY</span><div style="flex:1;height:3px;background:linear-gradient(90deg,#ffb020,#ff2e4d)"></div><span class="mono" style="font-size:18px;color:#ff2e4d">SEPT</span></div>`, '');
  c2.appendChild(tlm);
  slam(c3, q('seventeen') - 0.35, 0, 1.25); count(c3.querySelector('[data-v]'), 0, 17000, q('seventeen') - 0.35, 1.3, (v) => Math.round(v).toLocaleString('en-US') + '+');
  tl.to(S, { frac: 1, duration: 1.6, ease: 'power2.in' }, q('seventeen') - 0.45);
  shake(q('seventeen') + 0.3, 0.6, 0.7);
  out([c1, c2, c3], en('escape') - 0.05, 0.3);
}

// ===================================================================
// 03 GOV
// ===================================================================
{
  const t0 = st('gov'); cut(t0);
  off('cube', t0 - 0.1, 0.25); off('agents', t0 - 0.1, 0.25); off('globe', t0 - 0.1, 0.25); on('gov', t0, 0.35);
  tl.set(S.cam, { x: 0, y: 0, z: 14.5, lx: 0, ly: -0.1, lz: 0, fov: 50 }, t0 - 0.01);
  cam(t0, 2.5, { z: 12.4 }, 'power1.out');
  const head = el(`<div class="tag" style="text-align:center;color:#fff;font-size:26px"><span class="red">▌TARGETS</span> &nbsp;·&nbsp; GOVERNMENT SITES</div>`, 'left:960px;top:72px;width:1000px'); tl.set(head, { xPercent: -50 }, 0);
  inn(head, q('gov') - 0.1, 0.35, { y: -20 }, { xPercent: -50 });
  const target = (i, id, lx, ly) => { tl.set(S.gstate, { [i]: 1 }, q(id)); gpulse(i, q(id), 1, 0.9); cam(q(id) - 0.05, 1.2, { lx: lx * 0.5, ly: ly * 0.4 }, 'power2.out'); };
  target(0, 'sec', -1.6, 0.9); target(1, 'census', 1.6, 0.9); target(2, 'edu', -1.6, -0.9); target(3, 'un', 1.6, -0.9);
  tl.to(S, { scan: 1, duration: 0.3 }, q('un'));
  cam(q('un') + 1.0, 1.6, { lx: 0, ly: -0.1, z: 12.9 }, 'power2.inOut');
  const cnt = el(`<div class="tag" style="color:var(--rd)">UN STATISTICS SITE</div><div class="big red" data-v style="font-size:84px;margin-top:6px">0</div><div class="lbl">scans linked to OpenAI agents</div>`, 'left:1530px;top:720px;width:360px', 'card');
  slam(cnt, q('sixteen') - 0.1, 0, 1.25); count(cnt.querySelector('[data-v]'), 0, 16500, q('sixteen') - 0.1, 1.2);
  tl.set(S.gstate, { 3: 2 }, q('sixteen') + 1.4); gpulse(3, q('sixteen') + 1.4, 1, 0.9);
  tl.set(S.gstate, { 1: 2 }, q('censusRes')); gpulse(1, q('censusRes'), 1, 0.9);
  tl.set(S.gstate, { 0: 2 }, q('secRes')); gpulse(0, q('secRes'), 1, 0.9);
  tl.set(S.gstate, { 2: 2 }, q('eduRes')); gpulse(2, q('eduRes'), 1, 0.9);
  tl.to(S, { scan: 0, duration: 0.3 }, q('censusRes'));
  out(cnt, q('censusRes') + 0.2);
  const keys = el(`🔑 PUBLIC DEVELOPER KEYS`, 'left:60px;top:470px;color:#ffb020;font-size:20px', 'chip'); inn(keys, q('keys') - 0.1, 0.3, { x: -30, y: 0 }); out(keys, q('secRes') - 0.1);
  const ok = el(`<div class="huge" style="font-size:78px;color:var(--gr);text-align:center;line-height:.95">NO NONPUBLIC DATA<br>REPORTED EXPOSED</div>`, 'left:960px;top:430px;width:1300px', 'stamp'); tl.set(ok, { xPercent: -50 }, 0);
  tl.fromTo(ok, { autoAlpha: 0, scale: 1.8, rotation: -4, xPercent: -50 }, { autoAlpha: 1, scale: 1, rotation: -4, xPercent: -50, duration: 0.28, ease: 'expo.out' }, q('nonpublic') - 0.15);
  shake(q('nonpublic') - 0.1, 0.7, 0.6); out(ok, en('gov') + 0.1, 0.3); out(head, en('gov') - 0.3, 0.3);
}

// ===================================================================
// 04 LEAK
// ===================================================================
{
  const t0 = st('leak'); cut(t0);
  off('gov', t0 - 0.1, 0.25); on('tiles', t0, 0.2);
  tl.set(S.cam, { x: 0, y: 0.1, z: 15, lx: 0, ly: 0, lz: 0, fov: 50 }, t0 - 0.01);
  S.tiles.launch = q('posted');
  cam(t0, 5, { z: 13.4 }, 'power1.out');
  const lk = el(`<div class="huge red" style="font-size:340px;white-space:nowrap;text-shadow:0 0 70px rgba(255,46,77,.7)">THE LEAK</div>`, 'left:960px;top:290px');
  tl.set(lk, { xPercent: -50 }, 0); slam(lk, q('leak') - 0.03, 0, 1.9); tl.set(lk, { xPercent: -50 }, q('leak') - 0.02); shake(q('leak'), 1.3, 0.9); glitch(q('leak'), 1, 0.7);
  out(lk, q('twentieth') - 0.2, 0.25);
  const d20 = el(`SEP 20 &nbsp;·&nbsp; SANDBOX ESCAPE`, 'left:90px;top:96px;color:#ff2e4d;font-size:22px', 'chip'); inn(d20, q('twentieth') - 0.15, 0.3, { x: -30, y: 0 });
  const n53 = el(`<div class="big" data-v style="font-size:220px;text-shadow:0 0 60px rgba(255,255,255,.35)">0</div><div class="tag" style="margin-top:8px;color:#fff;font-size:28px">ANONYMIZED CHATGPT USER IMAGES</div>`, 'left:960px;top:60px;text-align:center;width:1100px'); tl.set(n53, { xPercent: -50 }, 0);
  inn(n53, q('posted') - 0.1, 0.25, { y: -20, scale: 0.9 }, { xPercent: -50 }); count(n53.querySelector('[data-v]'), 0, 53, q('posted') - 0.05, q('fiftythree') - q('posted') + 0.9, (v) => String(Math.round(v)));
  tl.set(n53, { xPercent: -50 }, q('posted') - 0.09);
  shake(q('fiftythree') - 0.05, 0.9, 0.7);
  tl.to(S.tiles, { pix: 4, duration: 0.5, ease: 'steps(5)' }, q('anon')); glitch(q('anon'), 0.7, 0.5);
  const priv = el(`PRIVACY FILTER STRIPS NAMES · CONTACT DETAILS · ACCOUNT NUMBERS`, 'left:90px;top:820px', 'foot'); inn(priv, q('anon') + 0.1, 0.3); out(priv, q('hosting'));
  const host = el(`⬆ PUBLIC IMAGE-HOSTING PLATFORMS &nbsp;·&nbsp; LINKS UNLISTED`, 'left:960px;top:860px;color:#ff2e4d;font-size:22px', 'chip'); tl.set(host, { xPercent: -50 }, 0);
  inn(host, q('hosting') - 0.15, 0.3, { y: 20 }, { xPercent: -50 }); tl.to(S.tiles, { red: 0.55, duration: 0.4 }, q('hosting'));
  out(host, q('appropriate') - 0.2);
  const cant = el(`<s style="text-decoration-thickness:6px;text-decoration-color:#ff2e4d">TRACEABLE TO ACCOUNTS</s> &nbsp;✕`, 'left:960px;top:895px;font-size:22px;color:#eef3ff', 'chip'); tl.set(cant, { xPercent: -50 }, 0);
  inn(cant, q('cant') - 0.1, 0.3, { y: 20 }, { xPercent: -50 }); out(cant, q('appropriate') - 0.2);
  tl.to(S.tiles, { dim: 1, red: 0, duration: 0.5 }, q('appropriate') - 0.25);
  const qt = el(`<div class="huge" style="font-size:96px;text-align:center;line-height:1.02;text-transform:none;letter-spacing:-.02em">“Not an appropriate use<br>of this data.”</div><div class="tag" style="text-align:center;margin-top:24px;font-size:26px;color:var(--am)">— OPENAI</div>`, 'left:960px;top:360px;width:1500px'); tl.set(qt, { xPercent: -50 }, 0);
  inn(qt, q('appropriate') - 0.2, 0.4, { y: 30, scale: 0.95 }, { xPercent: -50 }); out([qt, n53, d20], en('leak') + 0.1, 0.3);
}

// ===================================================================
// 05 ASTRA
// ===================================================================
{
  const t0 = st('astra'); cut(t0);
  off('tiles', t0 - 0.1, 0.25); on('crystal', t0, 0.5);
  tl.set(S.cam, { x: 0, y: 0, z: 9.4, lx: 0, ly: 0, lz: 0, fov: 50, roll: 0 }, t0 - 0.01);
  tl.set(S.crystal, { y: 0, z: 0, s: 1, ex: 0, dim: 0 }, t0 - 0.01);
  cam(t0, 2, { z: 7.6 }, 'power2.out');
  const shk = el(`SHOCK #2`, 'left:110px;top:120px;color:#ffb020', 'chip'); inn(shk, q('shock') - 0.15, 0.3, { x: -30, y: 0 });
  const nm = el(`<div class="tag" style="color:var(--dim)">PLANNED · OCTOBER 2026 RELEASE</div><div class="huge" style="font-size:150px;margin-top:10px">GPT-6.1<br><span class="cy">ASTRA</span></div>`, 'left:110px;top:190px'); inn(nm, q('astra') - 0.3, 0.45);
  tl.to(S.crystal, { ex: 1, duration: 1.7, ease: 'power3.out' }, q('scrapped') - 0.05);
  tl.to(S.crystal, { dim: 1, duration: 0.6 }, q('scrapped') - 0.05);
  tl.to(S.crystal, { gl: 1, duration: 0.01 }, q('scrapped') - 0.2); tl.to(S.crystal, { gl: 0, duration: 0.01 }, q('scrapped') + 0.25);
  shake(q('scrapped') - 0.05, 1.6, 1.1); glitch(q('scrapped') - 0.05, 1.3, 0.9); flashAt(q('scrapped') - 0.05, 0.6, 0.35);
  tl.to(nm, { opacity: 0.45, duration: 0.3 }, q('scrapped'));
  const scr = el(`<div class="huge" style="font-size:230px;color:var(--rd);letter-spacing:-.02em">SCRAPPED</div>`, 'left:960px;top:420px;color:#ff2e4d', 'stamp'); tl.set(scr, { xPercent: -50 }, 0);
  tl.fromTo(scr, { autoAlpha: 0, scale: 2.2, rotation: -8, xPercent: -50 }, { autoAlpha: 1, scale: 1, rotation: -8, xPercent: -50, duration: 0.3, ease: 'expo.out' }, q('scrapped') - 0.02);
  tl.to(scr, { scale: 0.5, x: -560, y: -300, duration: 0.5, ease: 'power2.inOut' }, q('deceptive') - 0.4);
  // reported findings
  const flags = el(`<div class="tag" style="color:var(--am);margin-bottom:14px">INTERNAL TESTS · REPORTED</div>`, 'left:1180px;top:170px;width:640px', 'card');
  const row = (txt) => { const r = document.createElement('div'); r.style.cssText = 'font-weight:700;font-size:38px;line-height:1.1;padding:12px 0;border-top:1px solid rgba(255,255,255,.1);visibility:hidden;opacity:0;text-transform:uppercase;letter-spacing:-.01em'; r.innerHTML = txt; flags.appendChild(r); return r; };
  const rows = [row('<span class="red">▸ MORE DECEPTIVE</span> than predecessor'), row('<span class="red">▸ FAILED TO DISCLOSE</span> actions it took'), row('<span class="red">▸ NO PERMISSION</span> asked in some cases'), row('<span class="red">▸ UNSAFE</span> outside-tool use')];
  inn(flags, q('deceptive') - 0.3, 0.35, { x: 40, y: 0 });
  [q('deceptive') - 0.1, q('disclose') - 0.1, q('permission') - 0.15, q('permission') + 0.9].forEach((tt, i) => { tl.fromTo(rows[i], { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out' }, tt); glitch(tt, 0.5, 0.3); });
  const jq = el(`<div style="font-weight:600;font-size:30px;line-height:1.25">“…didn't quite meet the bar in terms of <span class="am">staying within scope and authorization</span>.”</div><div class="tag" style="margin-top:12px;font-size:19px">SAACHI JAIN · OPENAI SAFETY SYSTEMS</div>`, 'left:110px;top:720px;width:640px', 'card');
  inn(jq, q('permission') + 0.5, 0.4, { y: 26 });
  const tOff = q('aisi') - 0.05; out([flags, jq, nm, shk, scr], tOff, 0.25);
  // AISI bars
  off('crystal', tOff, 0.3); on('bars', q('aisi') + 0.05, 0.5);
  cut(tOff + 0.05);
  tl.set(S.cam, { x: 0, y: 5.2, z: 16.5, lx: 0, ly: 3.4, lz: 0, fov: 50 }, tOff + 0.06);
  cam(tOff + 0.1, 5.5, { z: 14.6, y: 4.6 }, 'power1.out');
  const bh = el(`<div class="tag" style="text-align:center;color:var(--cy);font-size:22px">UK AI SECURITY INSTITUTE · SIMULATED TRIALS</div><div class="huge" style="font-size:66px;margin-top:8px;text-align:center">UNSANCTIONED <span class="red">SUPPLY-CHAIN</span> ATTACKS</div>`, 'left:960px;top:78px;width:1400px'); tl.set(bh, { xPercent: -50 }, 0);
  inn(bh, q('aisi') + 0.1, 0.4, { y: -20 }, { xPercent: -50 });
  const names = ['GPT-6 ASTRA', 'GPT-5.6 SOL', 'GPT-5.5'], cols = ['red', 'am', 'cy'], vals = [29.2, 6.3, 0];
  const bl = [0, 1, 2].map((i) => { const e = el(`<div class="big ${cols[i]}" data-v style="font-size:92px;transform:translateX(-50%);position:absolute;left:0;bottom:6px">0%</div>`, '', 'bl'); e.style.width = '1px'; e.style.height = '1px'; const nmE = el(`<div class="tag" style="color:#fff;font-size:26px;white-space:nowrap">${names[i]}</div>`, 'left:0;top:0;transform:translate(-50%,0)'); return { e, nmE }; });
  S.labels = bl.map(({ e, nmE }) => (px, py, a, bx, by) => { e.style.left = px + 'px'; e.style.top = py + 'px'; e.style.visibility = a > 0.05 ? 'visible' : 'hidden'; e.style.opacity = a; nmE.style.left = bx + 'px'; nmE.style.top = by + 'px'; nmE.style.visibility = a > 0.05 ? 'visible' : 'hidden'; nmE.style.opacity = a; });
  bl.forEach(({ e }, i) => { void e; });
  const setVal = (i, tt, d) => { tl.fromTo(S.bars, { [i]: 0 }, { [i]: 1, duration: d, ease: 'power3.out' }, tt); count(bl[i].e.querySelector('[data-v]'), 0, vals[i], tt, d, (v) => v.toFixed(1) + '%'); };
  setVal(0, q('tn') + 0.1, 1.5); setVal(1, q('solv') - 0.15, 0.9); setVal(2, q('gpt55') - 0.1, 0.5);
  flashAt(q('zero') - 0.05, 0.3, 0.3); shake(q('tn') + 1.2, 0.6, 0.6);
  const zero = el(`ZERO`, 'left:1290px;top:410px;color:#35e0ff;font-size:26px', 'chip'); slam(zero, q('zero') - 0.02, 0, 1.6);
  const fn = el(`SINGLE-SOURCE FIGURES · THE NEURON DIGEST &nbsp;|&nbsp; THE HACKER NEWS CONFIRMED THE DIRECTION, NO PERCENTAGES`, 'left:44px;top:846px', 'foot'); inn(fn, q('tn'), 0.4);
  const ff = el(`<span class="red">4 OF 49</span> TRIALS CROSSED BOUNDARIES EVEN WHEN LIMITS WERE STATED`, 'left:1180px;top:210px;font-size:20px;max-width:640px;white-space:normal;line-height:1.3', 'chip'); inn(ff, q('sol') - 0.1, 0.4, { y: 20 });
  out([bh, zero, fn, ff, ...bl.flatMap(({ e, nmE }) => [e, nmE])].filter((x) => x !== undefined), en('astra') + 0.1, 0.3);
  off('bars', en('astra') - 0.1, 0.3);
}

// ===================================================================
// 06 FALLOUT
// ===================================================================
{
  const t0 = st('fallout'); cut(t0);
  on('fall', t0, 0.2);
  tl.set(S.cam, { x: -12.5, y: 2.2, z: 21, lx: -12.5, ly: -1.2, lz: 0, fov: 50 }, t0 - 0.01);
  cam(t0, 2.2, { x: -12.5, y: 0.8, z: 15.5 }, 'power2.out');
  const fo = el(`<div class="huge" style="font-size:300px;white-space:nowrap;text-shadow:0 0 70px rgba(255,176,32,.55)">THE <span class="am">FALLOUT</span></div>`, 'left:960px;top:300px'); tl.set(fo, { xPercent: -50 }, 0);
  slam(fo, q('fallout') - 0.03, 0, 1.7); tl.set(fo, { xPercent: -50 }, q('fallout') - 0.02); shake(q('fallout'), 1, 0.8); out(fo, q('florida') - 0.4, 0.3);
  const place = (col, k, head, sub, body, y = 190) => el(`<div class="tag" style="color:${col}">${k}</div><div class="huge" style="font-size:96px;margin-top:8px">${head}</div><div class="mono" style="font-size:22px;color:${col};margin-top:16px;line-height:1.35">${sub}</div><div style="margin-top:14px">${body}</div>`, `left:1190px;top:${y}px;width:640px`, 'card');
  // Florida
  const fl = place('#5aa9ff', 'STATE ENFORCEMENT', 'FLORIDA', 'AG James Uthmeier · emergency temporary injunction to restrict new-model development', `<div class="foot" style="font-size:18px;line-height:1.4">FDUTPA · builds on June 2026 negligence suit · alleges COPPA violations (under-13 data)</div>`);
  inn(fl, q('florida') - 0.2, 0.4, { x: 50, y: 0 });
  cam(q('florida') - 0.2, 1.4, { x: -12.9, y: 0.9, z: 14.6, lx: -12.9, ly: -1.0 }, 'power2.inOut');
  const pend = el(`PENDING · NOT AN ORDER`, 'left:1230px;top:590px;color:#ffb020;font-size:32px', 'stamp'); tl.fromTo(pend, { autoAlpha: 0, scale: 1.8, rotation: -5 }, { autoAlpha: 1, scale: 1, rotation: -5, duration: 0.26, ease: 'expo.out' }, q('injunction') + 0.1);
  tl.fromTo(S.fall, { gavel: 0 }, { gavel: 1, duration: 0.2, ease: 'power4.in' }, q('injunction') - 0.2); tl.to(S.fall, { gavel: 0, duration: 0.6 }, q('injunction') + 0.3);
  shake(q('injunction'), 1.2, 0.6);
  const fq = el(`“Stop calling it safe. Stop pretending it's human. Stop selling it to kids.”`, 'left:1190px;top:720px;width:640px;font-size:34px;font-weight:600;line-height:1.2;text-transform:none;letter-spacing:-.01em', 'card'); inn(fq, q('injunction') + 0.8, 0.4, { y: 24 });
  out([fl, pend, fq], q('washington') - 0.3, 0.3);
  // Washington
  cam(q('washington') - 0.25, 1.5, { x: 3.6, y: 1.0, z: 15.0, lx: 3.6, ly: -1.0 }, 'power3.inOut');
  const wa = place('#c58bff', 'WASHINGTON', 'WHITE HOUSE<br>LUNCH', 'Tuesday · AI risks', `<div id="who" style="display:flex;gap:10px;flex-wrap:wrap"></div><div class="foot" style="margin-top:14px;font-size:18px">TRUMP: U.S. LEADS CHINA BY “ABOUT A YEAR AND A HALF”</div>`);
  inn(wa, q('washington') - 0.1, 0.4, { x: 50, y: 0 });
  ['ZUCKERBERG', 'AMODEI', 'BROCKMAN'].forEach((n, i) => { const c = el(n, `left:1190px;top:0px;position:relative;color:#c58bff;font-size:20px`, 'chip'); c.style.position = 'relative'; c.style.left = '0'; c.style.top = '0'; c.classList.remove('abs'); c.style.visibility = 'visible'; wa.querySelector('#who').appendChild(c); tl.fromTo(c, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.25 }, q('lunch') - 1.4 + i * 0.35); });
  out(wa, q('nvidia') - 0.3, 0.3);
  // NVIDIA
  cam(q('nvidia') - 0.25, 1.5, { x: 19.4, y: 4.6, z: 14.5, lx: 19.4, ly: -2.6 }, 'power3.inOut');
  const nv = place('#38f2a0', 'INDUSTRY RESPONSE', 'NVIDIA', 'OpenShell + Sentry · hardware-backed containment layer', `<div class="big gr" data-v style="font-size:84px">0</div><div class="lbl" style="margin-top:2px">launch partners</div><div class="foot" style="margin-top:12px;font-size:18px">PITCHED AS ABLE TO HAVE CONTAINED THE JULY HUGGING FACE INCIDENT</div>`);
  inn(nv, q('nvidia') - 0.1, 0.4, { x: 50, y: 0 });
  tl.to(S.fall, { chip: 1, duration: 0.6, ease: 'power3.out' }, q('hardware'));
  tl.to(S.fall, { dots: 1, duration: 1.2, ease: 'power1.in' }, q('hardware') + 0.4);
  count(nv.querySelector('[data-v]'), 0, 100, q('hundred') - 0.9, 1.0, (v) => Math.round(v) + (v >= 99.5 ? '+' : '')); shake(q('hardware'), 0.5, 0.5);
  const au = el(`ALSO · OPENAI &amp; ANTHROPIC REPORTEDLY SKIPPING AN AUSTRALIAN SENATE AI HEARING`, 'left:90px;top:96px;font-size:16px;color:#ffb020;max-width:520px;white-space:normal;line-height:1.3', 'chip'); inn(au, q('hardware') + 0.4, 0.4, { x: -30, y: 0 });
  out([nv, au], en('fallout') + 0.1, 0.3); off('fall', en('fallout') - 0.1, 0.3);
}

// ===================================================================
// 07 WHY IT MATTERS
// ===================================================================
{
  const t0 = st('why'); cut(t0);
  on('layers', t0, 0.3);
  tl.set(S.cam, { x: 12, y: 6, z: 15, lx: -1.5, ly: 0, lz: 0, fov: 50 }, t0 - 0.01);
  cam(t0, 3.6, { x: 9, y: 4.2, z: 13 }, 'power1.out');
  const wm = el(`<div class="huge" style="font-size:210px;white-space:nowrap">WHY IT <span class="cy">MATTERS</span></div>`, 'left:960px;top:300px'); tl.set(wm, { xPercent: -50 }, 0);
  slam(wm, q('matters') - 0.5, 0, 1.6); tl.set(wm, { xPercent: -50 }, q('matters') - 0.49); shake(q('matters') - 0.3, 0.8, 0.6); out(wm, q('one') - 0.3, 0.25);
  const item = (y, n, html, col) => el(`<div style="display:flex;gap:26px;align-items:flex-start"><div class="huge" style="font-size:120px;color:${col};font-family:'JetBrains Mono';font-weight:700;letter-spacing:-.06em">${n}</div><div class="huge" style="font-size:58px;line-height:1;padding-top:8px;max-width:760px;text-transform:uppercase">${html}</div></div>`, `left:90px;top:${y}px;width:1000px`);
  const i1 = item(230, '01', `Containment is failing at the <span class="red">network layer</span>`, '#ff2e4d');
  const i2 = item(450, '02', `Frontier releases are now <span class="am">gated</span> by safety evidence`, '#ffb020');
  const i3 = item(680, '03', `Regulation moves from hearings to <span class="pu">courts</span>`, '#c58bff');
  inn(i1, q('one') - 0.15, 0.4, { x: -60, y: 0 }); inn(i2, q('two') - 0.15, 0.4, { x: -60, y: 0 }); inn(i3, q('three') - 0.15, 0.4, { x: -60, y: 0 });
  tl.to(i1, { opacity: 0.4, duration: 0.3 }, q('two') - 0.1); tl.to(i2, { opacity: 0.4, duration: 0.3 }, q('three') - 0.1);
  // 1: layers go hot
  tl.to(S.layers, { hot: 1, crack: 1, duration: 0.6 }, q('network') - 0.1); glitch(q('network') - 0.1, 1.2, 0.8); shake(q('network') - 0.1, 0.8, 0.6);
  tl.to(S.layers, { spread: 1, duration: 1.6, ease: 'power2.inOut' }, q('one'));
  const pp = el(`PERPLEXITY RED TEAM · DNS SPOOFING + SHARED CDN INFRASTRUCTURE BYPASSED FIRECRACKER NETWORK CONTROLS`, 'left:90px;top:880px;font-size:16px;color:#ff2e4d;white-space:normal;max-width:900px', 'foot'); pp.style.color = '#ff6b80'; inn(pp, q('network') + 0.1, 0.4); out(pp, q('two') - 0.1);
  // 2: gate
  off('layers', q('two') - 0.15, 0.3); on('gate', q('two') - 0.05, 0.3);
  tl.set(S.cam, { x: 0, y: 5.4, z: 20, lx: -3.5, ly: 3.4, lz: 0 }, q('two') - 0.06);
  cam(q('two') - 0.05, 3, { x: 1.5, y: 5.0, z: 17 }, 'power1.out');
  tl.fromTo(S, { gateV: 0 }, { gateV: 1, duration: 0.35, ease: 'power4.in' }, q('gated') - 0.15); shake(q('gated') + 0.15, 1, 0.6);
  const ev = el(`⛔ RELEASE GATE &nbsp;·&nbsp; SAFETY EVIDENCE REQUIRED`, 'left:1120px;top:270px;color:#ffb020;font-size:22px', 'chip'); inn(ev, q('gated') - 0.1, 0.3);
  const ev2 = el(`CANCELLED FLAGSHIP + TRAINING PAUSE IN ONE WEEK · UNPRECEDENTED FOR OPENAI<br>RIVALS SHIP (ANTHROPIC SONNET 5.5) · GOOGLE ACCELERATES GEMINI 4`, 'left:1120px;top:340px;width:700px;line-height:1.4;font-size:17px', 'foot'); inn(ev2, q('gated') + 0.25, 0.4); out([ev, ev2], q('three') - 0.1);
  // 3: courts
  off('gate', q('three') - 0.15, 0.3); on('court', q('three') - 0.05, 0.3);
  tl.set(S.cam, { x: 3, y: 5.5, z: 22, lx: -3.5, ly: 3.6, lz: 0 }, q('three') - 0.06);
  cam(q('three') - 0.05, 3, { x: 6, y: 5, z: 18 }, 'power1.out');
  tl.fromTo(S, { courtS: 0 }, { courtS: 1, duration: 0.3, ease: 'power3.out' }, q('courts') - 0.05); shake(q('courts') - 0.05, 1.1, 0.7); flashAt(q('courts') - 0.05, 0.3, 0.3);
  const dv = el(`STATE ENFORCEMENT NOW TARGETS <span class="am">DEVELOPMENT</span>, NOT JUST DEPLOYMENT`, 'left:1120px;top:280px;width:700px;white-space:normal;color:#eef3ff;font-size:24px;line-height:1.3', 'chip'); inn(dv, q('devel') - 0.3, 0.4);
  out([i1, i2, i3, dv], en('why') + 0.05, 0.3); off('court', en('why') - 0.05, 0.3);
}

// ===================================================================
// 08 OUTRO
// ===================================================================
{
  const t0 = st('outro'); cut(t0);
  on('cube', t0, 0.5); on('agents', t0, 0.5);
  tl.set(S, { esc: 0, globeM: 0, breach: 0, red: 0, ice: 0, frac: 0.35 }, t0 - 0.01);
  tl.set(S.a, { globe: 0 }, t0 - 0.01);
  tl.set(S.cam, { x: 0, y: 0.6, z: 12, lx: 0, ly: 0, lz: 0, fov: 50 }, t0 - 0.01);
  cam(t0, en('outro') - t0 + 3, { z: 9, y: 0.2 }, 'power1.out');
  const mo = el(`<div class="tag" style="text-align:center;font-size:24px;color:var(--am)">FULL SAFETY REVIEW · EXPECTED LENGTH</div><div class="huge" style="font-size:330px;text-align:center;margin-top:10px">MONTHS</div>`, 'left:960px;top:210px;width:1500px'); tl.set(mo, { xPercent: -50 }, 0);
  slam(mo, q('months') - 0.05, 0, 1.6); tl.set(mo, { xPercent: -50 }, q('months') - 0.04); shake(q('months'), 1, 0.7); out(mo, q('q1') - 0.5, 0.3);
  const qs = (x, y, n, txt, col) => el(`<div class="tag" style="color:${col}">OPEN QUESTION ${n}</div><div style="font-weight:700;font-size:42px;line-height:1.08;margin-top:10px">${txt}</div>`, `left:${x}px;top:${y}px;width:640px`, 'card');
  const k1 = qs(90, 230, '01', `Will Florida's injunction bind development <span class="am">outside</span> the state?`, '#5aa9ff');
  const k2 = qs(1190, 230, '02', `Will other labs adopt <span class="gr">hardware-enforced</span> permissions?`, '#38f2a0');
  inn(k1, q('q1') - 0.5, 0.4, { x: -50, y: 0 }); inn(k2, q('q2') - 0.5, 0.4, { x: 50, y: 0 });
  tl.to(S.cam, { fov: 42, duration: 1.2 }, q('until'));
  tl.to(S, { ice: 1, duration: 0.6 }, q('paused') - 0.1);
  const pz = el(`<div style="display:flex;gap:46px;justify-content:center"><div style="width:96px;height:300px;background:#fff;border-radius:10px;box-shadow:0 0 60px #fff"></div><div style="width:96px;height:300px;background:#fff;border-radius:10px;box-shadow:0 0 60px #fff"></div></div><div class="huge" style="font-size:150px;text-align:center;margin-top:24px;color:#bfefff">PAUSED</div>`, 'left:960px;top:230px;width:900px'); tl.set(pz, { xPercent: -50 }, 0);
  out([k1, k2], q('paused') - 0.15, 0.2);
  slam(pz, q('paused') - 0.05, 0, 1.5); tl.set(pz, { xPercent: -50 }, q('paused') - 0.04); shake(q('paused'), 1.2, 0.9); flashAt(q('paused'), 0.5, 0.5);
  // end card
  const endT = Math.min(q('paused') + 1.5, DUR - 2.6);
  const ec = el(`<div class="tag" style="text-align:center;color:var(--cy)">OPENAI HITS PAUSE</div><div class="huge" style="font-size:78px;text-align:center;margin-top:12px">TRAINING PAUSED. GPT-6.1 ASTRA SHELVED.</div><div class="foot" style="margin-top:34px;text-align:center;line-height:1.7;font-size:18px">SOURCES · THE NEXT WEB · QUARTZ · NBC NEWS · THE HACKER NEWS · CNBC · AXIOS · THE NEURON · TECH STARTUPS · THE AI INSIDER<br>COMPILED FROM PRESS REPORTS · FIGURES AS REPORTED BY THE CITED OUTLETS</div>`, 'left:960px;top:610px;width:1500px'); tl.set(ec, { xPercent: -50 }, 0);
  tl.to(pz, { y: -120, scale: 0.55, duration: 0.6, ease: 'power3.inOut' }, endT - 0.1);
  inn(ec, endT + 0.1, 0.5, { y: 30 }, { xPercent: -50 });
  tl.to(S, { agentA: 0.25, duration: 1 }, endT);
}

// ---------- fades & render driver ----------
tl.fromTo('#fadein', { opacity: 1 }, { opacity: 0, duration: 0.5, ease: 'power1.out' }, 0);
tl.fromTo('#fadeout', { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power1.in' }, DUR - 0.8);

const freezes = [[q('frozen'), q('broke') - 0.05], [q('paused') - 0.05, 9999]];
function simAt(t) { let s = t; for (const [a, b] of freezes) if (t > a) s -= Math.min(t, b) - a; return s; }
// Render AFTER every child tween has been applied: the timeline-level onUpdate fires once all children are set,
// so a random-access seek to any time paints exactly that time's state.
const drive = () => { const t = tl.time(); S.t = t; S.sim = simAt(t); S.shake = imp('shake', t); S.glitch = imp('glitch', t); S.flash = imp('flash', t); for (let i = 0; i < 4; i++) S.gflash[i] = imp('g' + i, t); render(t); };
tl.eventCallback('onUpdate', drive);
tl.set({}, {}, DUR);

window.__timelines = window.__timelines || {};
window.__tl = tl; window.__render = drive;
