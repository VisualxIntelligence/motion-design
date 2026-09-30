# OpenAI DevDay 2026 — motion explainer

A fast-paced ~3:20, 1080p/30 explainer of the September 29, 2026 DevDay keynote (Dots, GPT-6.1 Sol, Ultrafast, Pro 500, the developer platform, collaboration, enterprise and the safety backdrop), built with **Three.js** (3D), **HyperFrames** (HTML → MP4, GSAP timeline) and **ElevenLabs** (voice-over with timestamps, sound effects, music).

Render: `renders/devday-2026.mp4`

## How it syncs
Everything on screen is scheduled from **word-level timestamps**:

1. `story.json` holds the script as 13 scenes. Each scene names *cue words* (`"sol"`, `"ninety-five"`, `"spotlight"`…) and the sound effect that fires on them.
2. `tools/tts.mjs` voices each scene with ElevenLabs `/with-timestamps` (with `previous_text`/`next_text` so the read stays continuous) and turns the character alignment into word times → `build/timing.json`.
3. `tools/lib.mjs` resolves every cue word to an absolute time → `build/cues.json`. Visuals, counters, captions and SFX all read from these times, so re-voicing the script re-times the whole video.
4. Captions are karaoke-style: each word lights up as it's spoken; highlight words are colored.

## Pipeline
```
export ELEVENLABS_API_KEY=...        # or put it in .env
node tools/tts.mjs      # ElevenLabs voice + word timing          -> build/timing.json, build/voice/*.mp3
node tools/audio.mjs    # 25 ElevenLabs SFX, music, ducked mix     -> assets/sfx/*, assets/music.mp3, audio/mix.wav
ffmpeg -i audio/mix.wav -c:a aac -b:a 256k audio/mix.m4a
node tools/build.mjs    # bundle src/ -> scene.js, index.html
npx hyperframes lint . && npx hyperframes render . -o renders/devday-2026.mp4 -f 30
```
Look-dev: `node tools/shots.mjs 12 45.5` (stills), `node tools/shots.mjs --cue sol,pro500` (0.35s after a cue), `node tools/shots.mjs --sheet 1.5` (contact sheets).

### Audio
- **Voice:** ElevenLabs `eleven_multilingual_v2`, speed 1.2, one clip per scene.
- **SFX:** 25 sounds generated with the ElevenLabs sound-generation API (pops, whooshes, coins, warp, stamp, shatter, spotlight…), 162 hits placed on cue words. Risers are offset so they *land* on their word.
- **Music:** one ElevenLabs Music track built from a **composition plan** whose section lengths match the story beats (cold open → playful groove → lift → steady drive → dark turn → final question). The mix also low-passes the music from "But look at the backdrop" until the spotlight hit, so the mood shift lands on the right words.
- **Mix:** voice EQ + compression, SFX bed, music side-chain ducked under the voice, loudness-normalised to −14 LUFS.

## Visual system
- `src/field.js` — 16,384 GPU particles ("a world made of dots") that morph between shapes baked into a float texture: galaxy → **DEVDAY** → **20+** → globe (1.2B users) → five balls that become the Dots → vault data cube → marketplace wall → **?**. A flow mode turns the same particles into the Decisions API router (stream → GPT-6 Luna → approve / reject lanes).
- `src/props.js` — the five Dot characters (glossy spheres with blinking eyes, squash & stretch, pop-on glasses, top hat, beanie, party hat and bow tie), the cloud computer with browser/app screens, 24/7 clock ring, 4,000-app orbit, faceted GPT-6 Astra crystal that shatters, a noise-shaded Sol sun with corona, falling price coins, warp streaks, a wafer-scale chip, the Pro 500 card, a 3D cursor, multi-agent graph, AWS box, Luna, phone, ChatGPT Space platform, Pages/Slides, the Private Intelligence vault and the spotlight.
- `src/world.js` — renderer, mood-driven backdrop, dotted stage floor, lights + environment, and a hand-rolled post chain tuned for CPU rendering: MSAA scene target → 2-level bloom at ¼ and ⅛ res → one full-res pass (bloom, Khronos neutral tone map, sRGB, chromatic aberration, grain, red/ice grades, flashes). Whip-pan blur is a separate shader used only during transitions.
- `src/timeline.js` / `src/scenes.js` — GSAP choreography keyed to cues, HUD (section label, "launches covered" counter with toasts, progress bar), captions.

### Deterministic frames
HyperFrames renders frames in parallel workers that seek the timeline independently, so every frame is a pure function of time:
- impulses (shake, flash, whip, glitch), counters, typing and gauges are evaluated from `t` on each seek instead of inside tween callbacks (the host may seek with events suppressed);
- the WebGL render is scheduled once per seek batch via a patched `totalTime` + microtask;
- text → particle sampling uses per-particle seeded rejection sampling with `measureText` bounds, so Chrome's canvas-readback noise can't reshuffle particles between workers;
- the timeline is registered only after fonts load and the scene is built (and wrapped, since GSAP timelines are thenables).

## Accuracy notes
Figures follow the source article (compiled from secondary reports; prices and benchmarks vary by outlet — check OpenAI's pricing page). Benchmark bars are labelled as illustrative; The Register's view is paraphrased, not quoted.
