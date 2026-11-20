//   node tools/check-determinism.mjs   (~20 min; compares visual state per frame across seek orders)
// Replays the timeline with different seek orders (sequential, 4 interleaved workers, random jumps) and checks
// that every frame's state (S + inline DOM styles/text) is identical regardless of how the frame was reached.
import puppeteer from 'puppeteer-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isFile()) r.end(fs.readFileSync(f)); else { r.statusCode = 404; r.end(); } }).listen(0);
const exe = fs.readdirSync('/opt/pw-browsers').filter((x) => x.startsWith('chromium-')).map((x) => `/opt/pw-browsers/${x}/chrome-linux/chrome`)[0];
const b = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], protocolTimeout: 1800000 });
const orders = { seq: (N) => [...Array(N).keys()], w0: (N) => [...Array(N).keys()].filter((f) => f % 4 === 0), w1: (N) => [...Array(N).keys()].filter((f) => f % 4 === 1), w2: (N) => [...Array(N).keys()].filter((f) => f % 4 === 2), w3: (N) => [...Array(N).keys()].filter((f) => f % 4 === 3),
  rnd: (N) => { let a = 12345; const r = () => ((a = (a * 1103515245 + 12345) % 2147483648) / 2147483648); return [...Array(700)].map(() => Math.floor(r() * N)); } };
const sigs = {};
for (const [name, fn] of Object.entries(orders)) {
  const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.waitForFunction(() => !!(window.__timelines && window.__timelines.root), { polling: 200 });
  const N = await p.evaluate(() => Math.round(window.__timelines.root.duration() * 30));
  const frames = fn(N);
  sigs[name] = await p.evaluate((frames) => {
    window.__noRender = true; const tl = window.__timelines.root; const els = [...document.querySelectorAll('#root *')].filter((e) => e.tagName !== 'CANVAS' && e.tagName !== 'AUDIO');
    const h = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); };
    const round = (k, v) => (k[0] === '_' ? undefined : typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v);
    const out = {};
    for (const f of frames) { const t = f / 30; tl.pause(); tl.totalTime(t + 0.001, true); tl.totalTime(t, false); window.__render();
      const S = JSON.stringify(window.__S, round); let d = '';
      // visual signature: computed styles of rendered (visible, non-transparent) elements only
      els.forEach((e, i) => { const c = getComputedStyle(e); if (c.visibility !== 'visible' || c.display === 'none' || +c.opacity < 0.002) return;
        d += i + ':' + (+c.opacity).toFixed(3) + c.transform + c.color + c.borderColor + c.boxShadow + c.left + c.top + c.width + c.height + (e.childElementCount ? '' : e.textContent) + ';'; });
      out[f] = h(S) + ':' + h(d); }
    return out;
  }, frames);
  await p.close(); console.log('path', name, Object.keys(sigs[name]).length, 'frames');
}
let bad = 0; const ex = [];
for (const [name, m] of Object.entries(sigs)) { if (name === 'seq') continue; for (const [f, s] of Object.entries(m)) { if (sigs.seq[f] !== s) { bad++; if (ex.length < 25) ex.push(`${name} frame ${f} (t=${(f / 30).toFixed(2)}): seq=${sigs.seq[f]} vs ${s}`); } } }
const byPath = {}; for (const [name, m] of Object.entries(sigs)) { if (name === 'seq') continue; byPath[name] = Object.entries(m).filter(([f, s]) => sigs.seq[f] !== s).length; }
console.log('mismatches by path', JSON.stringify(byPath), '(w0-w3 = how HyperFrames workers seek; rnd includes backward jumps)');
console.log(bad ? `MISMATCHES: ${bad}\n` + ex.join('\n') : 'DETERMINISTIC: all paths identical');
if (['w0', 'w1', 'w2', 'w3'].some((k) => byPath[k])) process.exitCode = 1;
await b.close(); srv.close();
