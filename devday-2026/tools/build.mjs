// Bundles src/timeline.js (three.js world + GSAP timeline) and emits index.html with the word-resolved cue data inlined.
import fs from 'node:fs';
import { build } from 'esbuild';
import { P, story, readJSON } from './lib.mjs';

const timing = readJSON(P('build/timing.json'));
const cues = readJSON(P('build/cues.json'));
const st = story();
const dur = timing.duration;
const data = { cues: cues.cues, duration: dur,
  timing: { scenes: timing.scenes.map((s) => ({ id: s.id, start: s.start, end: s.end, words: s.words })) },
  story: { title: st.title, scenes: st.scenes.map((s) => ({ id: s.id, hl: s.hl, sect: s.sect })) } };
fs.writeFileSync(P('build/data.js'), 'export default ' + JSON.stringify(data) + ';');
await build({ entryPoints: [P('src/timeline.js')], bundle: true, format: 'iife', outfile: P('scene.js'), minify: true, legalComments: 'none', logLevel: 'error', target: 'es2020' });
const css = fs.readFileSync(P('src/styles.css'), 'utf8');
const audio = fs.existsSync(P('audio/mix.m4a')) ? 'audio/mix.m4a' : 'audio/mix.wav';
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1920, height=1080">
<title>${st.title}</title>
<style>${css}</style></head>
<body>
<div id="root" data-composition-id="root" data-width="1920" data-height="1080" data-start="0" data-duration="${dur}">
  <canvas id="gl" width="1920" height="1080"></canvas>
  <div class="ui" id="ui"></div>
  <div id="caps"></div>
  <div id="fadein" style="position:absolute;inset:0;background:#05060c"></div>
  <div id="fadeout" style="position:absolute;inset:0;background:#05060c;opacity:0"></div>
  <audio id="mix" src="${audio}" data-start="0" data-duration="${dur}" data-track-index="1" data-volume="1"></audio>
</div>
<script src="vendor/gsap.min.js"></script>
<script src="scene.js"></script>
<script>
  // scene.js builds asynchronously (fonts -> 3D text sampling -> timeline); register only once it is complete.
  window.__sceneReady.then(function (r) { window.__timelines = window.__timelines || {}; window.__timelines["root"] = r.tl; });
</script>
</body></html>`;
fs.writeFileSync(P('index.html'), html);
console.log(`index.html  ${(html.length / 1024).toFixed(0)} KB · scene.js ${(fs.statSync(P('scene.js')).size / 1024).toFixed(0)} KB · ${dur}s`);
