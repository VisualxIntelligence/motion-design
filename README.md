# OpenAI Hits Pause — motion explainer

~2 min, 1080p/30 explainer built with **Three.js** (3D world), **HyperFrames** (HTML→MP4 renderer, GSAP timeline) and **ElevenLabs** (voice-over, SFX, music).

Everything on screen is scheduled from **word-level timestamps**: `story.json` names cue words ("pause", "fifty-three", "zero"…) → `tools/lib.mjs` resolves each to an absolute time → the GSAP timeline, 3D camera, counters, captions and sound effects all fire on those times.

## Pipeline
```
export ELEVENLABS_API_KEY=...            # or put it in .env
node tools/tts.mjs      # ElevenLabs /with-timestamps  -> build/timing.json (char-level alignment -> words)
node tools/audio.mjs    # cues.json + ElevenLabs SFX/music (or offline synth) + ducked mix -> audio/mix.wav
node tools/build.mjs    # bundle src/ (three + timeline) -> index.html
npx hyperframes lint && npx hyperframes render . -o renders/openai-hits-pause.mp4 -f 30 -q standard
```
Without a key, `tts.mjs` falls back to a local Kokoro voice with *estimated* word timing and `audio.mjs` to a synthesized score/SFX (`tools/synth.py`). Re-run the three steps with a key and the whole video re-times itself.

`node tools/shots.mjs 12 45.5 80` writes look-dev PNGs to `snaps/`.

## Design notes
- `src/world.js` — one persistent WebGL world: 7,000 GPU-animated agent particles (sandbox bounce → breach → globe morph), shattering lattice cube, 53 instanced mosaic tiles, faceted "Astra" crystal that explodes, 3D bar chart, canvas-textured gov-site panels, blueprint courthouse/capitol/chip, bloom + glitch post.
- `src/timeline.js` — GSAP choreography. Impulse effects (shake/glitch/flash) are pure functions of time and rendering happens in the timeline-level `onUpdate`, so any frame can be rendered independently (required for parallel workers).
