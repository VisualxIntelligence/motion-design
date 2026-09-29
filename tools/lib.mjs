import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const P = (...a) => path.join(ROOT, ...a);
export const story = () => JSON.parse(fs.readFileSync(P('story.json'), 'utf8'));
export const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const writeJSON = (f, o) => (fs.mkdirSync(path.dirname(f), { recursive: true }), fs.writeFileSync(f, JSON.stringify(o, null, 1)));

export const norm = (s) => s.toLowerCase().replace(/[^a-z0-9'\-]/g, '');

export function loadEnv() {
  const f = P('.env');
  if (fs.existsSync(f)) for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return process.env.ELEVENLABS_API_KEY || '';
}

export function probeDuration(file) {
  return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
}

// Spread a known duration across words by a length/punctuation weight. Used when no real alignment exists.
export function estimateWords(text, duration) {
  const toks = text.split(/\s+/).filter(Boolean);
  const wt = toks.map((t) => {
    let w = t.replace(/[^\w]/g, '').length + 2.2;
    if (/[.?!:]$/.test(t)) w += 4.5; else if (/[,;]$/.test(t)) w += 2.2;
    return w;
  });
  const sum = wt.reduce((a, b) => a + b, 0);
  let t0 = 0;
  return toks.map((w, i) => {
    const d = (wt[i] / sum) * duration;
    const o = { w, start: t0, end: t0 + d * (/[.?!:,;]$/.test(w) ? 0.82 : 0.96) };
    t0 += d;
    return o;
  });
}

export function resolveCues(st, timing) {
  const cues = {}; const sfx = [];
  for (const sc of st.scenes) {
    const ts = timing.scenes.find((s) => s.id === sc.id);
    for (const c of sc.cues || []) {
      const hits = ts.words.filter((w) => norm(w.w) === norm(c.word));
      const w = hits[(c.n || 1) - 1];
      if (!w) { console.warn(`! cue ${c.id}: word "${c.word}" #${c.n || 1} not found in scene ${sc.id}`); continue; }
      const t = +(ts.start + w.start + (c.off || 0)).toFixed(3);
      cues[c.id] = t;
      if (c.sfx) sfx.push({ id: c.id, sfx: c.sfx, t: Math.max(0, t) });
    }
  }
  return { cues, sfx };
}
