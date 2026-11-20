// Voice-over + word-level timestamps.
//  * ELEVENLABS_API_KEY set  -> ElevenLabs /with-timestamps (real character alignment -> words)
//  * otherwise               -> silent placeholder with estimated word timing (so the visuals can still be built)
// Each scene is its own clip; previous_text/next_text keep the prosody continuous across clips.
//   node tools/tts.mjs            (re-uses cached clips in build/voice unless FORCE=1)
import fs from 'node:fs';
import { P, story, writeJSON, readJSON, loadEnv, probeDuration, estimateWords } from './lib.mjs';

const st = story();
const key = loadEnv();
const voiceId = process.env.ELEVENLABS_VOICE_ID || st.voice.elevenlabs;
const model = process.env.ELEVENLABS_TTS_MODEL || 'eleven_multilingual_v2';
const speed = parseFloat(process.env.VOICE_SPEED || '1.2');
fs.mkdirSync(P('build/voice'), { recursive: true });

function wordsFromAlignment(al) {
  const words = []; let cur = null;
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } return; }
    if (!cur) cur = { w: '', start: al.character_start_times_seconds[i], end: 0 };
    cur.w += ch; cur.end = al.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  return words;
}

async function eleven(sc, i) {
  const out = P(`build/voice/${sc.id}.mp3`), meta = P(`build/voice/${sc.id}.json`);
  if (!process.env.FORCE && fs.existsSync(out) && fs.existsSync(meta)) {
    const m = readJSON(meta);
    if (m.say === sc.say && m.voiceId === voiceId && m.speed === speed) return { file: out, words: m.words, dur: probeDuration(out), estimated: false };
  }
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`;
  const body = {
    text: sc.say, model_id: model,
    previous_text: st.scenes[i - 1]?.say, next_text: st.scenes[i + 1]?.say,
    voice_settings: { stability: 0.38, similarity_boost: 0.82, style: 0.42, use_speaker_boost: true, speed },
  };
  for (let a = 0; a < 4; a++) {
    const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { console.warn('ElevenLabs', r.status, (await r.text()).slice(0, 240)); await new Promise((s) => setTimeout(s, 2000 * (a + 1))); continue; }
    const j = await r.json();
    fs.writeFileSync(out, Buffer.from(j.audio_base64, 'base64'));
    const words = wordsFromAlignment(j.alignment);
    writeJSON(meta, { say: sc.say, voiceId, speed, words });
    return { file: out, words, dur: probeDuration(out), estimated: false };
  }
  throw new Error('ElevenLabs TTS failed for ' + sc.id);
}

const results = {};
let mode;
if (key) {
  mode = 'elevenlabs';
  for (const [i, sc] of st.scenes.entries()) { console.log('TTS', sc.id); results[sc.id] = await eleven(sc, i); }
} else {
  mode = 'placeholder';
  console.warn('! ELEVENLABS_API_KEY not set — silent placeholder + estimated word timing');
  for (const sc of st.scenes) { const dur = sc.say.split(/\s+/).length / 2.85 + 0.3; results[sc.id] = { file: null, words: estimateWords(sc.say, dur), dur, estimated: true }; }
}

// Trim leading/trailing silence out of the clip timing so scene boundaries sit on speech.
let t = st.lead; const scenes = [];
for (const sc of st.scenes) {
  const r = results[sc.id];
  scenes.push({ id: sc.id, start: +t.toFixed(3), end: +(t + r.dur).toFixed(3), file: r.file && r.file.replace(P(''), ''),
    words: r.words.map((w) => ({ w: w.w, start: +w.start.toFixed(3), end: +w.end.toFixed(3) })), estimated: r.estimated });
  t += r.dur + st.gap;
}
const duration = +(scenes.at(-1).end + st.tail).toFixed(2);
writeJSON(P('build/timing.json'), { mode, duration, scenes });
console.log(`timing.json written (${mode}) — ${duration}s, ${scenes.reduce((n, s) => n + s.words.length, 0)} words`);
