// usage: node tools/shots.mjs t1 t2 ...   -> snaps/s_<t>.png  (fast look-dev screenshots, same seek path as render)
import puppeteer from 'puppeteer-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isFile()) r.end(fs.readFileSync(f)); else { r.statusCode = 404; r.end(); } }).listen(8899);
const pw = fs.readdirSync('/opt/pw-browsers').filter((x) => x.startsWith('chromium-')).map((x) => `/opt/pw-browsers/${x}/chrome-linux/chrome`)[0];
const b = await puppeteer.launch({ executablePath: pw, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
p.on('pageerror', (e) => console.log('ERR:', e.message.slice(0, 300)));
await p.goto('http://localhost:8899/index.html'); await new Promise((r) => setTimeout(r, 2500));
fs.mkdirSync(path.join(root, 'snaps'), { recursive: true });
for (const t of process.argv.slice(2).map(Number)) {
  await p.evaluate((t) => { window.__tl.time(t, false); }, t); await new Promise((r) => setTimeout(r, 120));
  await p.screenshot({ path: path.join(root, `snaps/s_${t}.png`) }); console.log('shot', t);
}
await b.close(); srv.close();
