// Voice-over + word-level timestamps.
//  * ELEVENLABS_API_KEY set  -> ElevenLabs /with-timestamps (real character alignment)
//  * otherwise               -> local Kokoro voice (if installed) with estimated word timing,
//                               or silent placeholder with estimated timing.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { P, story, writeJSON, loadEnv, probeDuration, estimateWords } from './lib.mjs';

const st = story();
const key = loadEnv();
const voiceId = process.env.ELEVENLABS_VOICE_ID || st.voice.elevenlabs;
const model = process.env.ELEVENLABS_TTS_MODEL || 'eleven_multilingual_v2';
const speed = parseFloat(process.env.VOICE_SPEED || '1.1');
fs.mkdirSync(P('build/voice'), { recursive: true });

function wordsFromAlignment(text, al) {
  const words = []; let cur = null;
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } return; }
    if (!cur) cur = { w: '', start: al.character_start_times_seconds[i], end: 0 };
    cur.w += ch; cur.end = al.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  return words;
}

async function eleven(sc) {
  const out = P(`build/voice/${sc.id}.mp3`);
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`;
  const body = { text: sc.say, model_id: model, voice_settings: { stability: 0.42, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed } };
  for (let a = 0; a < 3; a++) {
    const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { console.warn('ElevenLabs', r.status, (await r.text()).slice(0, 200)); await new Promise((s) => setTimeout(s, 1500 * (a + 1))); continue; }
    const j = await r.json();
    fs.writeFileSync(out, Buffer.from(j.audio_base64, 'base64'));
    const words = wordsFromAlignment(sc.say, j.alignment);
    return { file: out, words, dur: probeDuration(out), estimated: false };
  }
  throw new Error('ElevenLabs TTS failed for ' + sc.id);
}

function local() {
  const model = P('.cache/kokoro/kokoro-v1.0.onnx');
  const have = fs.existsSync(model) && fs.existsSync(P('.cache/kokoro/done.flag'));
  const res = {};
  if (have) {
    execFileSync('python3', [P('tools/kokoro_tts.py'), P('story.json'), P('build/voice'), st.voice.kokoro], { stdio: 'inherit' });
  }
  for (const sc of st.scenes) {
    const f = P(`build/voice/${sc.id}.wav`);
    let dur;
    if (have && fs.existsSync(f)) dur = probeDuration(f);
    else { dur = sc.say.split(/\s+/).length / 2.9 + 0.3; }
    res[sc.id] = { file: have ? f : null, words: estimateWords(sc.say, dur), dur, estimated: true };
  }
  return res;
}

const results = {};
let mode;
if (key) { mode = 'elevenlabs'; for (const sc of st.scenes) { console.log('TTS', sc.id); results[sc.id] = await eleven(sc); } }
else { mode = 'local-placeholder'; console.warn('! ELEVENLABS_API_KEY not set — using local placeholder voice + estimated word timing'); Object.assign(results, local()); }

let t = st.lead; const scenes = [];
for (const sc of st.scenes) {
  const r = results[sc.id];
  scenes.push({ id: sc.id, start: +t.toFixed(3), end: +(t + r.dur).toFixed(3), file: r.file && r.file.replace(P('') , ''), words: r.words.map((w) => ({ w: w.w, start: +w.start.toFixed(3), end: +w.end.toFixed(3) })), estimated: r.estimated });
  t += r.dur + st.gap;
}
const duration = +(scenes.at(-1).end + st.tail).toFixed(2);
writeJSON(P('build/timing.json'), { mode, duration, scenes });
console.log(`timing.json written (${mode}) — ${duration}s, ${scenes.reduce((n, s) => n + s.words.length, 0)} words`);
