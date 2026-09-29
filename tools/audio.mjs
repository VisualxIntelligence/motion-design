// Sound design + mix.  ElevenLabs (sound-generation + music) when a key is present, offline synth otherwise.
//   node tools/audio.mjs            -> assets/sfx/*, assets/music.*, audio/{voice,sfx,music,mix}.wav
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { P, story, readJSON, writeJSON, loadEnv, resolveCues } from './lib.mjs';

const key = loadEnv();
const st = story();
const timing = readJSON(P('build/timing.json'));
const { cues, sfx } = resolveCues(st, timing);
writeJSON(P('build/cues.json'), { cues, sfx, duration: timing.duration });
fs.mkdirSync(P('audio'), { recursive: true }); fs.mkdirSync(P('assets/sfx'), { recursive: true });

const SFX_PROMPTS = {
  hit: 'short deep cinematic hit, tight low thud with a sharp digital transient, trailer style',
  impact: 'huge cinematic impact boom with long sub-bass tail, dark, dramatic',
  tick: 'tiny crisp digital UI tick, clean, futuristic interface click',
  freeze: 'icy digital freeze effect, glassy shimmer with a quick downward sweep',
  shatter: 'glass and digital shards shattering, sharp cinematic break with sparkles',
  whoosh: 'fast cinematic whoosh pass-by, airy with a bright tail',
  glitch: 'short digital glitch stutter, data corruption bursts, bit-crushed',
  burst: 'explosive energy burst outward, rising whoosh into a deep boom',
  rise: 'tense cinematic riser building tension, synthetic, ends abruptly',
  scan: 'sci-fi scanning sweep with rapid pulsing data ticks',
  unlock: 'digital unlock, two quick metallic key clicks with a bright chirp',
  denied: 'harsh buzzer access denied error tone, short, low',
  chime: 'clean glassy notification chime with a soft reverb tail, ominous',
  alarm: 'short urgent alarm siren blast, digital warning, two tones',
  static: 'burst of tv static and data noise with a fast fade',
  drop: 'deep downward pitch drop sub bass fall, dramatic, ends in silence',
  gavel: 'wooden judge gavel strike in a courtroom with slight echo',
  lock: 'heavy mechanical lock clunk, bolt slides shut, metallic',
};

const post = async (url, body) => {
  for (let a = 0; a < 3; a++) {
    const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    console.warn('ElevenLabs', r.status, (await r.text()).slice(0, 160)); await new Promise((s) => setTimeout(s, 1500 * (a + 1)));
  }
  return null;
};

// ---- SFX
const names = [...new Set(sfx.map((s) => s.sfx))];
if (key) {
  for (const n of names) {
    const out = P(`assets/sfx/${n}.mp3`);
    if (fs.existsSync(out)) continue;
    console.log('sfx (ElevenLabs)', n);
    const buf = await post('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', { text: SFX_PROMPTS[n], duration_seconds: n === 'impact' || n === 'drop' ? 2.5 : n === 'tick' ? 0.5 : 1.5, prompt_influence: 0.55 });
    if (buf) fs.writeFileSync(out, buf);
  }
} else execFileSync('python3', [P('tools/synth.py'), 'sfx', P('assets/sfx')], { stdio: 'inherit' });
const sfxFile = (n) => (fs.existsSync(P(`assets/sfx/${n}.mp3`)) ? P(`assets/sfx/${n}.mp3`) : P(`assets/sfx/${n}.wav`));

// ---- Music
const dur = timing.duration;
let music = P('assets/music.mp3');
if (key && !fs.existsSync(music)) {
  console.log('music (ElevenLabs)');
  const buf = await post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
    prompt: 'Dark, tense cinematic electronic underscore for a fast-paced tech-news explainer. Pulsing sub bass, driving 112 BPM four-on-the-floor kick, ticking hi-hats, glitchy synth arpeggios in A minor, rising tension and a big build in the middle, sparse and leaves room for a voice-over, instrumental, no vocals.',
    music_length_ms: Math.min(600000, Math.round(dur * 1000) + 1000), force_instrumental: true, model_id: 'music_v1' });
  if (buf) fs.writeFileSync(music, buf);
}
if (!fs.existsSync(music)) { music = P('assets/music.wav'); if (!fs.existsSync(music) || process.env.REGEN) execFileSync('python3', [P('tools/synth.py'), 'music', music, String(dur + 1)], { stdio: 'inherit' }); }

// ---- Mix
const args = ['-y', '-v', 'error']; const f = []; let n = 0;
const inp = (file) => { args.push('-i', file); return n++; };
const vi = timing.scenes.filter((s) => s.file).map((s) => [inp(P(s.file)), s.start]);
const si = sfx.map((s) => [inp(sfxFile(s.sfx)), s.t, s.sfx]);
const mi = inp(music);
const SFXG = { impact: 1.0, hit: 0.8, burst: 0.85, shatter: 0.8, drop: 0.9, tick: 0.55, whoosh: 0.6, glitch: 0.55, rise: 0.6 };
vi.forEach(([i, t], k) => f.push(`[${i}]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)},apad=whole_dur=${dur}[v${k}]`));
si.forEach(([i, t, nm], k) => f.push(`[${i}]aresample=48000,aformat=channel_layouts=stereo,volume=${SFXG[nm] ?? 0.6},adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)},apad=whole_dur=${dur}[s${k}]`));
f.push(vi.length ? `${vi.map((_, k) => `[v${k}]`).join('')}amix=inputs=${vi.length}:normalize=0:duration=longest,atrim=0:${dur}[voice]` : `anullsrc=r=48000:cl=stereo,atrim=0:${dur}[voice]`);
f.push(`${si.map((_, k) => `[s${k}]`).join('')}amix=inputs=${si.length}:normalize=0:duration=longest,atrim=0:${dur},alimiter=limit=0.95[sfx]`);
f.push(`[${mi}]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${dur},apad=whole_dur=${dur},volume=0.9[m0]`);
f.push(`[voice]asplit=2[voice1][vkey]`);
f.push(`[m0][vkey]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350:makeup=1[music]`);
f.push(`[voice1]volume=1.25[vo]`);
f.push(`[vo][sfx][music]amix=inputs=3:normalize=0:duration=longest,atrim=0:${dur},loudnorm=I=-15:TP=-1.5:LRA=9[mix]`);
fs.writeFileSync(P('build/mix.filter'), f.join(';\n'));
execFileSync('ffmpeg', [...args, '-filter_complex_script', P('build/mix.filter'), '-map', '[mix]', '-ar', '48000', '-ac', '2', P('audio/mix.wav')], { stdio: 'inherit' });
console.log(`audio/mix.wav  ${dur}s  (${sfx.length} sfx, ${vi.length} vo clips, music: ${music.split('/').pop()})`);
