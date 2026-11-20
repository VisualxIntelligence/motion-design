// Lists tweens that animate the same property of the same target over overlapping time ranges (or a set() inside a tween).
// Overlapping .to() tweens resolve differently depending on seek order, so parallel render workers can disagree.
//   node tools/check-overlaps.mjs   -> 'overlaps 0' expected
import puppeteer from 'puppeteer-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isFile()) r.end(fs.readFileSync(f)); else { r.statusCode = 404; r.end(); } }).listen(0);
const exe = fs.readdirSync('/opt/pw-browsers').filter((x) => x.startsWith('chromium-')).map((x) => `/opt/pw-browsers/${x}/chrome-linux/chrome`)[0];
const b = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
await p.goto(`http://localhost:${srv.address().port}/index.html`);
await p.waitForFunction(() => !!(window.__timelines && window.__timelines.root), { polling: 200 });
const r = await p.evaluate(() => {
  const tl = window.__timelines.root; const tw = tl.getChildren(true, true, false);
  const ids = new WeakMap(); let nid = 0; const name = (t) => { if (t === window.__S) return 'S'; for (const [k, v] of Object.entries(window.__S)) { if (v === t) return 'S.' + k; if (Array.isArray(v)) { const i = v.indexOf(t); if (i >= 0) return `S.${k}[${i}]`; } } if (t instanceof Element) { if (!ids.has(t)) ids.set(t, ++nid); return '@' + ids.get(t) + ' ' + (t.id ? '#' + t.id : t.tagName + '.' + t.className) + ':' + (t.textContent || '').trim().slice(0, 28); } return String(t); };
  const alias = { autoAlpha: 'opacity', alpha: 'opacity' };
  const items = [];
  for (const t of tw) { const vars = t.vars; const props = Object.keys(vars).filter((k) => !['duration', 'ease', 'immediateRender', 'onUpdate', 'overwrite', 'delay', 'repeat', 'yoyo', 'stagger', 'parent', 'startAt', 'runBackwards', 'data', 'id', 'lazy', 'callbackScope'].includes(k));
    const s = t.startTime(), e = s + t.duration(); for (const target of t.targets()) for (const pr of props) items.push({ key: name(target) + '|' + (alias[pr] || pr), s, e, from: !!t.vars.startAt || t._startAt !== undefined, tgt: target }); }
  const by = {}; for (const it of items) (by[it.key] ||= []).push(it);
  const bad = [];
  for (const [k, arr] of Object.entries(by)) { arr.sort((a, b) => a.s - b.s); for (let i = 1; i < arr.length; i++) { const a = arr[i - 1], c = arr[i]; if (c.s < a.e - 1e-4 && c.s > a.s + 1e-4 && a.e - a.s > 0) bad.push(`${k}  [${a.s.toFixed(2)}-${a.e.toFixed(2)}] x [${c.s.toFixed(2)}-${c.e.toFixed(2)}]`); } }
  return { n: tw.length, bad };
});
console.log('tweens', r.n, 'overlaps', r.bad.length); if (r.bad.length) { console.log(r.bad.join('\n')); process.exitCode = 1; }
await b.close(); srv.close();
