// Look-dev stills through the same seek path the renderer uses.
//   node tools/shots.mjs 3.2 12 45.5        -> snaps/s_<t>.png
//   node tools/shots.mjs --cue dots,sol      -> snaps/c_<cue>.png  (0.35s after each cue)
//   node tools/shots.mjs --sheet 2           -> snaps/sheet_*.png  (every 2s, tiled 4x4 contact sheets)
import puppeteer from 'puppeteer-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const port = 8900 + Math.floor(Math.random() * 90);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isFile()) { r.setHeader('content-type', TYPES[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); } else { r.statusCode = 404; r.end(); } }).listen(port);
const exe = fs.readdirSync('/opt/pw-browsers').filter((x) => x.startsWith('chromium-')).map((x) => `/opt/pw-browsers/${x}/chrome-linux/chrome`)[0];
const b = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
p.on('pageerror', (e) => console.log('PAGE ERROR:', e.message.slice(0, 400)));
p.on('console', (m) => { if (process.env.DEBUG || ['error', 'warning', 'warn'].includes(m.type())) console.log('console.' + m.type() + ':', m.text().slice(0, 300)); });
await p.goto(`http://localhost:${port}/index.html`);
const err = await p.evaluate(() => Promise.race([window.__sceneReady.then(() => null, (e) => String(e && e.stack || e)), new Promise((r) => setTimeout(() => r('timeout: scene not ready after 55s'), 55000))]));
if (err) { console.log('BUILD ERROR:', err); await b.close(); srv.close(); process.exit(1); }
await p.waitForFunction(() => !!(window.__timelines && window.__timelines.root), { timeout: 60000, polling: 200 });
const out = path.join(root, 'snaps'); fs.mkdirSync(out, { recursive: true });
const argv = process.argv.slice(2);
const shoot = async (t, name) => { const t0 = Date.now(); await p.evaluate((t) => { window.__timelines.root.time(t, false); }, t); await p.screenshot({ path: path.join(out, name) }); return Date.now() - t0; };
if (argv[0] === '--cue') {
  const cues = await p.evaluate(() => window.__cues);
  for (const id of argv[1].split(',')) { if (cues[id] === undefined) { console.log('no cue', id); continue; } const ms = await shoot(cues[id] + 0.35, `c_${id}.png`); console.log('cue', id, cues[id], ms + 'ms'); }
} else if (argv[0] === '--sheet') {
  const step = parseFloat(argv[1] || '2'); const from = parseFloat(argv[2] || '0'); const to = parseFloat(argv[3] || '9999');
  const dur = await p.evaluate(() => window.__timelines.root.duration());
  const ts = []; for (let t = from; t < Math.min(dur, to); t += step) ts.push(+t.toFixed(2));
  const tmp = path.join(out, 'tmp'); fs.mkdirSync(tmp, { recursive: true });
  for (const [i, t] of ts.entries()) { await shoot(t, `tmp/f_${String(i).padStart(4, '0')}.png`); }
  // tile 4x4 at 480x270 with timestamps
  const per = 16;
  for (let s = 0; s * per < ts.length; s++) {
    const files = ts.slice(s * per, s * per + per).map((t, k) => ({ t, f: path.join(tmp, `f_${String(s * per + k).padStart(4, '0')}.png`) }));
    const args = ['-y', '-v', 'error']; files.forEach(({ f }) => args.push('-i', f));
    const fl = files.map(({ t }, k) => `[${k}]scale=480:270,drawtext=text='${t.toFixed(1)}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v${k}]`);
    const lay = files.map((_, k) => `${(k % 4) * 480}_${Math.floor(k / 4) * 270}`).join('|');
    fl.push(`${files.map((_, k) => `[v${k}]`).join('')}xstack=inputs=${files.length}:layout=${lay}:fill=black[o]`);
    execFileSync('ffmpeg', [...args, '-filter_complex', fl.join(';'), '-map', '[o]', path.join(out, `sheet_${String(s).padStart(2, '0')}.png`)]);
    console.log('sheet', s, files[0].t, '→', files.at(-1).t);
  }
} else {
  for (const t of argv.map(Number)) { const ms = await shoot(t, `s_${t}.png`); console.log('shot', t, ms + 'ms'); }
}
await b.close(); srv.close();
