import sys, json, soundfile as sf
from kokoro_onnx import Kokoro
story, outdir, voice = sys.argv[1:4]
k = Kokoro('.cache/kokoro/kokoro-v1.0.onnx', '.cache/kokoro/voices-v1.0.bin')
for sc in json.load(open(story))['scenes']:
    s, sr = k.create(sc['say'].replace('GPT-', 'G P T ').replace('AI ', 'A I '), voice=voice, speed=1.3, lang='en-us')
    sf.write(f"{outdir}/{sc['id']}.wav", s, sr)
    print('kokoro', sc['id'], round(len(s) / sr, 2))
