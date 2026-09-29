// Bundles src/timeline.js (three.js + gsap timeline) and emits index.html with word-resolved cue data inlined.
import fs from 'node:fs';
import { build } from 'esbuild';
import { P, story, readJSON } from './lib.mjs';

const timing = readJSON(P('build/timing.json'));
const cues = readJSON(P('build/cues.json'));
const st = story();
const dur = timing.duration;
const data = JSON.stringify({ cues: cues.cues, duration: dur, timing: { scenes: timing.scenes.map((s) => ({ id: s.id, start: s.start, end: s.end, words: s.words })) }, story: { scenes: st.scenes.map((s) => ({ id: s.id, hl: s.hl })) } });
fs.writeFileSync(P('build/data.js'), 'export default ' + data + ';');
await build({ entryPoints: [P('src/timeline.js')], bundle: true, format: 'iife', outfile: P('scene.js'), minify: false, logLevel: 'error', target: 'es2020' });
const css = fs.readFileSync(P('src/styles.css'), 'utf8');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1920, height=1080">
<title>OpenAI Hits Pause</title>
<style>${css}</style></head>
<body>
<div id="root" data-composition-id="root" data-width="1920" data-height="1080" data-start="0" data-duration="${dur}">
  <canvas id="gl" width="1920" height="1080"></canvas>
  <div id="scan"></div>
  <div class="ui" id="ui"></div>
  <div id="caps"></div>
  <div class="pb" id="pb"></div>
  <div id="fadein" style="position:absolute;inset:0;background:#03050a"></div>
  <div id="fadeout" style="position:absolute;inset:0;background:#03050a;opacity:0"></div>
  <audio id="mix" src="audio/mix.wav" data-start="0" data-duration="${dur}" data-track-index="1" data-volume="1"></audio>
</div>
<script src="vendor/gsap.min.js"></script>
<script src="scene.js"></script>
<script>window.__timelines = window.__timelines || {}; window.__timelines["root"] = window.__tl;</script>
</body></html>`;
fs.writeFileSync(P('index.html'), html);
console.log(`index.html  ${(html.length / 1024).toFixed(0)} KB · ${dur}s`);
