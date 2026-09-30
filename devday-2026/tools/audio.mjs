// Sound design + music + mix, all from ElevenLabs.
//   node tools/audio.mjs   -> build/cues.json, assets/sfx/*.mp3, assets/music.mp3, audio/mix.wav
// SFX are generated once and cached; delete a file (or REGEN_MUSIC=1) to re-roll it.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { P, story, readJSON, writeJSON, loadEnv, resolveCues } from './lib.mjs';

const key = loadEnv();
const st = story();
const timing = readJSON(P('build/timing.json'));
const { cues, sfx } = resolveCues(st, timing);
writeJSON(P('build/cues.json'), { cues, sfx, duration: timing.duration });
fs.mkdirSync(P('audio'), { recursive: true }); fs.mkdirSync(P('assets/sfx'), { recursive: true });

// name: [prompt, seconds, gain, lead]   lead = seconds the sound starts BEFORE its cue (risers land on the word)
const SFX = {
  pop:     ['cute cartoon bubble pop, bright bouncy plop, very short, clean', 0.5, 0.42, 0],
  boing:   ['playful cartoon spring boing, short and bouncy, clean', 0.8, 0.34, 0],
  whoosh:  ['fast cinematic air whoosh pass-by transition, modern, clean tail', 1.0, 0.34, 0.12],
  swish:   ['quick short swish, UI swipe transition, airy, modern', 0.6, 0.3, 0.05],
  impact:  ['big punchy cinematic impact hit with deep sub boom, modern tech trailer', 2.0, 0.5, 0],
  hit:     ['tight punchy percussive hit, modern electronic, short, clean', 0.8, 0.38, 0],
  tick:    ['tiny crisp digital UI tick, clean interface click', 0.5, 0.22, 0],
  click:   ['crisp mouse click, satisfying, clean', 0.5, 0.35, 0],
  type:    ['fast burst of mechanical keyboard typing, short', 1.2, 0.26, 0],
  chime:   ['bright positive glassy notification chime, modern app, short reverb tail', 1.5, 0.3, 0],
  sparkle: ['magical sparkle shimmer twinkle, bright, short', 1.2, 0.26, 0],
  coin:    ['bright coin cha-ching, cash register ding, short, clean', 0.9, 0.3, 0],
  riser:   ['short tense synth riser build-up sweeping upward, ends abruptly', 1.6, 0.3, 1.45],
  warp:    ['sci-fi warp speed jump, rising whoosh into a deep sub rumble, energetic', 2.0, 0.42, 0.25],
  brake:   ['tape stop slowdown effect, pitch dropping down fast', 1.0, 0.34, 0],
  lock:    ['heavy metallic lock clunk, secure vault bolt sliding shut', 0.9, 0.34, 0],
  stamp:   ['rubber stamp slammed on paper, punchy, short', 0.6, 0.4, 0],
  denied:  ['short soft error buzz, UI denied tone, low', 0.5, 0.2, 0],
  shatter: ['crystal glass shattering, cinematic break with sparkling debris', 1.6, 0.36, 0],
  freeze:  ['icy freeze crackle with glassy shimmer, short cinematic', 1.2, 0.3, 0],
  glitch:  ['short digital glitch stutter, data corruption burst', 0.6, 0.24, 0],
  drone:   ['dark ominous low cinematic drone swell, deep tension', 2.5, 0.34, 0.3],
  spot:    ['huge stadium spotlight switching on, heavy electrical clunk followed by a low hum', 2.2, 0.48, 0],
  scan:    ['sci-fi scanning beam sweep with soft data ticks', 1.0, 0.22, 0],
  blip:    ['short positive digital blip, sci-fi interface, clean', 0.5, 0.24, 0],
};

const post = async (url, body, tries = 3) => {
  for (let a = 0; a < tries; a++) {
    const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    console.warn('ElevenLabs', r.status, (await r.text()).slice(0, 300)); await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
  }
  return null;
};
if (!key) throw new Error('ELEVENLABS_API_KEY is required for audio.mjs');

// ---- SFX (3 at a time — the API allows 4 concurrent requests — cached)
const names = [...new Set(sfx.map((s) => s.sfx))];
const pool = async (items, k, fn) => { const q = [...items]; await Promise.all(Array.from({ length: k }, async () => { while (q.length) await fn(q.shift()); })); };
await pool(names, 3, async (n) => {
  const out = P(`assets/sfx/${n}.mp3`);
  if (fs.existsSync(out)) return;
  if (!SFX[n]) throw new Error('no SFX prompt for ' + n);
  const buf = await post('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', { text: SFX[n][0], duration_seconds: SFX[n][1], prompt_influence: 0.6 });
  if (buf) { fs.writeFileSync(out, buf); console.log('sfx', n); } else console.warn('! sfx failed', n);
});

// ---- Music: a composition plan whose sections follow the story beats.
const dur = timing.duration;
const S = (id) => timing.scenes.find((s) => s.id === id);
const music = P('assets/music.mp3');
if (!fs.existsSync(music) || process.env.REGEN_MUSIC) {
  const bounds = [0, S('dots').start, S('sol').start, S('agents').start, S('backdrop').start - 0.3, S('outro').start, dur + 0.5];
  const secs = [
    ['Cold open', ['sparse pulsing synth bass', 'filtered plucks', 'rising filter sweep', 'anticipation building into a drop'], ['full drums']],
    ['Main groove', ['playful bouncy upbeat electronic groove', 'plucky marimba-like synth hook', 'crisp claps', 'bright and optimistic', 'leaves room for voice-over'], ['vocals', 'aggressive']],
    ['Lift', ['higher energy', 'driving four-on-the-floor kick', 'sparkling arpeggios', 'side-chained synth chords', 'confident and fast'], ['vocals']],
    ['Steady drive', ['steady driving tech groove', 'minimal and focused', 'syncopated percussion', 'warm bass', 'confident'], ['vocals', 'busy melody']],
    ['Dark turn', ['sudden shift to dark and tense', 'low ominous drone', 'minor key', 'sparse ticking clock percussion', 'uneasy'], ['bright', 'happy', 'drums']],
    ['Final question', ['tension rising', 'pulsing low synth', 'builds to one big cinematic final hit', 'long ring-out'], ['happy']],
  ];
  const plan = {
    positive_global_styles: ['modern electronic', 'tech keynote', 'motion graphics explainer', '122 BPM', 'polished', 'instrumental'],
    negative_global_styles: ['vocals', 'singing', 'lo-fi', 'acoustic guitar'],
    sections: secs.map(([name, pos, neg], i) => ({ section_name: name, positive_local_styles: pos, negative_local_styles: neg, duration_ms: Math.max(3000, Math.round((bounds[i + 1] - bounds[i]) * 1000)), lines: [] })),
  };
  writeJSON(P('build/music-plan.json'), plan);
  console.log('music (ElevenLabs composition plan)', plan.sections.map((s) => `${s.section_name}:${(s.duration_ms / 1000).toFixed(1)}s`).join(' | '));
  let buf = await post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', { composition_plan: plan, model_id: 'music_v1' }, 2);
  if (!buf) {
    console.warn('! composition plan rejected, falling back to a single prompt');
    buf = await post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
      prompt: 'Upbeat, playful, modern electronic tech-keynote underscore at 122 BPM: bouncy plucky synths, crisp claps, sparkling arpeggios, confident driving groove that leaves room for voice-over. About 85% of the way through it turns suddenly dark and tense with a low ominous drone and ticking percussion, then builds to one big cinematic final hit with a long ring-out. Instrumental, no vocals.',
      music_length_ms: Math.round(dur * 1000) + 500, force_instrumental: true, model_id: 'music_v1' });
  }
  if (!buf) throw new Error('music generation failed');
  fs.writeFileSync(music, buf);
}

// ---- Mix: voice on top, SFX bed, music side-chain ducked under the voice.
const args = ['-y', '-v', 'error']; const f = []; let n = 0;
const inp = (file) => { args.push('-i', file); return n++; };
const vi = timing.scenes.filter((s) => s.file).map((s) => [inp(P(s.file)), s.start]);
const si = sfx.filter((s) => fs.existsSync(P(`assets/sfx/${s.sfx}.mp3`))).map((s) => [inp(P(`assets/sfx/${s.sfx}.mp3`)), Math.max(0, s.t - (SFX[s.sfx]?.[3] || 0)), s.sfx]);
const mi = inp(music);
const ms = (t) => Math.round(t * 1000);
vi.forEach(([i, t], k) => f.push(`[${i}]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms(t)}|${ms(t)},apad=whole_dur=${dur}[v${k}]`));
si.forEach(([i, t, nm], k) => f.push(`[${i}]aresample=48000,aformat=channel_layouts=stereo,highpass=f=40,lowpass=f=9000,afade=t=in:d=0.005,volume=${SFX[nm]?.[2] ?? 0.28},adelay=${ms(t)}|${ms(t)},apad=whole_dur=${dur}[s${k}]`));
f.push(`${vi.map((_, k) => `[v${k}]`).join('')}amix=inputs=${vi.length}:normalize=0:duration=longest,atrim=0:${dur}[voice]`);
f.push(`${si.map((_, k) => `[s${k}]`).join('')}amix=inputs=${si.length}:normalize=0:duration=longest,atrim=0:${dur},alimiter=limit=0.9[sfx]`);
// Mood shift: the music is filtered down (dark, muffled) from "But look at the backdrop" until the spotlight hit,
// then opens back up full-band for the end card.
const tDark = cues.but ?? S('backdrop').start, tOpen = cues.spotlight ?? S('outro').end, X = 0.35;
f.push(`[${mi}]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${dur},apad=whole_dur=${dur},afade=t=out:st=${(dur - 2.5).toFixed(2)}:d=2.5,volume=0.62,asplit=3[ma][mb][mc]`);
f.push(`[ma]atrim=0:${(tDark + X).toFixed(3)},afade=t=out:st=${tDark.toFixed(3)}:d=${X}[m1]`);
f.push(`[mb]atrim=${tDark.toFixed(3)}:${(tOpen + X).toFixed(3)},asetpts=PTS-STARTPTS,lowpass=f=520:p=2,lowpass=f=900,volume=1.25,afade=t=in:d=${X},afade=t=out:st=${(tOpen - tDark).toFixed(3)}:d=${X},adelay=${ms(tDark)}|${ms(tDark)}[m2]`);
f.push(`[mc]atrim=${tOpen.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.08,adelay=${ms(tOpen)}|${ms(tOpen)}[m3]`);
f.push(`[m1][m2][m3]amix=inputs=3:normalize=0:duration=longest,atrim=0:${dur},apad=whole_dur=${dur}[m0]`);
f.push(`[voice]asplit=2[voice1][vkey]`);
f.push(`[m0][vkey]sidechaincompress=threshold=0.025:ratio=5:attack=12:release=320:makeup=1[music]`);
f.push(`[voice1]equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=0.12:ratio=3:attack=5:release=80:makeup=1.6[vo]`);
f.push(`[vo][sfx][music]amix=inputs=3:normalize=0:duration=longest,atrim=0:${dur},loudnorm=I=-14:TP=-1.2:LRA=9[mix]`);
fs.writeFileSync(P('build/mix.filter'), f.join(';\n'));
execFileSync('ffmpeg', [...args, '-filter_complex_script', P('build/mix.filter'), '-map', '[mix]', '-ar', '48000', '-ac', '2', P('audio/mix.wav')], { stdio: 'inherit' });
console.log(`audio/mix.wav  ${dur}s  (${si.length} sfx, ${vi.length} vo clips)`);
