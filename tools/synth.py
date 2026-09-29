"""Offline fallback sound design (used when no ElevenLabs key is available).
   python3 tools/synth.py sfx <outdir>   |   python3 tools/synth.py music <out.wav> <seconds>"""
import sys, numpy as np, soundfile as sf
SR = 44100
rng = np.random.default_rng(7)
def t(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.005, r=0.2, p=2.0):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr) ** p; return e
def lp(x, fc):  # one-pole lowpass
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x): s = (1 - a) * v + a * s; y[i] = s
    return y
def hp(x, fc): return x - lp(x, fc)
def noise(d): return rng.standard_normal(int(SR * d))
def sweep(d, f0, f1, curve=1.0):
    tt = t(d); f = f0 + (f1 - f0) * (tt / d) ** curve; return np.sin(2 * np.pi * np.cumsum(f) / SR)
def norm(x, pk=0.9): return x / (np.abs(x).max() + 1e-9) * pk
def stereo(x): return np.stack([x, x], 1)
def wide(x, d=0.012):
    k = int(d * SR); return np.stack([x, np.concatenate([np.zeros(k), x[:-k]])], 1)

def kick(d=0.5, f0=140, f1=42):
    n = int(SR * d); x = sweep(d, f0, f1, 0.25) * env(n, 0.001, d * 0.9, 2.5); return x
def s_hit(): d = .45; x = kick(d, 200, 55) + 0.35 * lp(noise(d), 3000) * env(int(SR * d), .001, .12, 3); return wide(norm(x))
def s_impact():
    d = 1.6; n = int(SR * d); x = kick(d, 90, 28) * 1.2 + 0.6 * lp(noise(d), 900) * env(n, .002, d, 3) + 0.25 * sweep(d, 60, 35) * env(n, .01, d)
    return wide(norm(x))
def s_tick(): d = .09; n = int(SR * d); return wide(norm(sweep(d, 2400, 1800) * env(n, .0005, .08, 3) + 0.2 * hp(noise(d), 4000) * env(n, .0005, .03)), 0.004) * 0.7
def s_freeze():
    d = 1.3; n = int(SR * d); x = hp(noise(d), 5000) * env(n, .3, .9, 1.5) * 0.4 + sum(np.sin(2 * np.pi * f * t(d)) * env(n, .01, d, 2) for f in (2093, 3136, 4186)) * 0.15
    return wide(norm(x))
def s_shatter():
    d = 1.4; n = int(SR * d); x = hp(noise(d), 1800) * env(n, .001, d, 3.5)
    for k in range(28): p = int(rng.uniform(0, .5) * SR); f = rng.uniform(2500, 7000); m = int(.06 * SR); x[p:p + m] += np.sin(2 * np.pi * f * t(.06)) * env(m, .0005, .06, 2) * .7
    x += kick(d, 120, 40) * .6; return wide(norm(x))
def s_whoosh(d=0.9):
    n = int(SR * d); x = noise(d); fc = np.linspace(300, 6000, n) * 1.0
    out = np.zeros(n); s = 0.0
    for i in range(n): a = np.exp(-2 * np.pi * fc[i] / SR); s = (1 - a) * x[i] + a * s; out[i] = s
    e = np.sin(np.pi * (np.arange(n) / n) ** 1.6) ** 2
    return wide(norm(out * e), .02)
def s_glitch():
    d = .5; n = int(SR * d); x = np.zeros(n)
    for k in range(9):
        p = int(rng.uniform(0, .4) * SR); m = int(rng.uniform(.015, .05) * SR); f = rng.uniform(300, 3000)
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(m) / SR)) * 0.5 + rng.standard_normal(m) * .3; x[p:p + m] += seg[:len(x[p:p + m])] * env(min(m, len(x[p:p + m])), .0005, .01)
    return wide(norm(x, .7))
def s_burst(): d = 1.2; n = int(SR * d); x = s_whoosh(d)[:, 0] * .8 + kick(d, 110, 35) * .9 + hp(noise(d), 3000) * env(n, .001, .5, 3) * .3; return wide(norm(x))
def s_rise(d=1.6):
    n = int(SR * d); x = sweep(d, 180, 1400, 2.2) * .5 + hp(noise(d), 1500) * .35 * (np.arange(n) / n) ** 2; x *= (np.arange(n) / n) ** 1.3 * env(n, .01, .02, 1); return wide(norm(x))
def s_scan(): d = 1.4; n = int(SR * d); tt = t(d); x = np.sin(2 * np.pi * np.cumsum(900 + 500 * np.sin(2 * np.pi * 14 * tt)) / SR) * env(n, .05, .3) * .5; return wide(norm(x, .6))
def s_unlock(): d = .5; n = int(SR * d); x = np.zeros(n)
def s_unlock():
    d = .6; x = np.zeros(int(SR * d))
    for k, (p, f) in enumerate([(0, 1200), (.09, 1800)]):
        m = int(.15 * SR); i = int(p * SR); x[i:i + m] += np.sin(2 * np.pi * f * t(.15)) * env(m, .001, .15, 2)
    x += hp(noise(d), 4000) * env(len(x), .001, .08, 3) * .3; return wide(norm(x, .7))
def s_denied(): d = .55; n = int(SR * d); x = (np.sign(np.sin(2 * np.pi * 110 * t(d))) * .4 + np.sign(np.sin(2 * np.pi * 116 * t(d))) * .4) * env(n, .002, .3, 1.5); x = lp(x, 1800); x *= (np.sin(2 * np.pi * 9 * t(d)) > -0.3); return wide(norm(x, .8))
def s_chime():
    d = 1.6; n = int(SR * d); x = sum(a * np.sin(2 * np.pi * f * t(d)) * env(n, .002, d, 2.5) for f, a in [(880, 1), (1320, .6), (1760, .35), (2640, .2)]); return wide(norm(x, .7), .02)
def s_alarm():
    d = 1.3; n = int(SR * d); tt = t(d); f = np.where((tt * 4) % 1 < .5, 720, 540); x = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 2200) * env(n, .01, .3); return wide(norm(x, .6))
def s_static(): d = .9; n = int(SR * d); x = hp(noise(d), 800) * env(n, .02, .5, 1.2) * (rng.random(n) > .15); return wide(norm(x, .5))
def s_drop(): d = 1.5; n = int(SR * d); x = sweep(d, 220, 30, .35) * env(n, .001, d, 1.4) + .3 * lp(noise(d), 600) * env(n, .001, .3, 3); return wide(norm(x))
def s_gavel():
    d = .8; n = int(SR * d); x = (sweep(d, 700, 260, .3) * env(n, .0005, .12, 3) + lp(noise(d), 2500) * env(n, .0005, .05, 3) * .8 + kick(d, 130, 60) * .7); return wide(norm(x))
def s_lock():
    d = .7; x = np.zeros(int(SR * d))
    for p, f in [(0, 420), (.16, 300)]:
        i = int(p * SR); m = int(.2 * SR); x[i:i + m] += (sweep(.2, f * 1.5, f) * env(m, .0005, .18, 3) + lp(noise(.2), 2500) * env(m, .0005, .05, 3) * .5)[:len(x[i:i + m])]
    return wide(norm(x, .85))

BANK = dict(hit=s_hit, impact=s_impact, tick=s_tick, freeze=s_freeze, shatter=s_shatter, whoosh=s_whoosh, glitch=s_glitch, burst=s_burst,
            rise=s_rise, scan=s_scan, unlock=s_unlock, denied=s_denied, chime=s_chime, alarm=s_alarm, static=s_static, drop=s_drop, gavel=s_gavel, lock=s_lock)

def music(dur, bpm=112):
    n = int(SR * dur); out = np.zeros((n, 2)); beat = 60 / bpm; step = beat / 4
    # sub pad drone (Am)
    tt = t(dur)
    for f, a in [(55, .5), (82.4, .25), (110, .18), (164.8, .09)]:
        out += (a * np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)) * (0.8 + 0.2 * np.sin(2 * np.pi * .07 * tt)))[:, None] * np.array([1, 1])
    prog = [55, 55, 43.65, 49.0]  # A1 A1 F1 G1 bass roots
    k = kick(.45, 130, 45); hat = hp(noise(.05), 6000) * env(int(SR * .05), .0005, .04, 3); clap = lp(hp(noise(.2), 900), 5000) * env(int(SR * .2), .001, .15, 2.5)
    arp_notes = [220, 261.6, 329.6, 440, 329.6, 261.6, 196, 246.9]
    fadein = np.clip(tt / 4, 0, 1); intensity = np.clip(0.35 + tt / dur * .9, 0, 1)
    def put(sig, pos, g=1.0, pan=.5):
        i = int(pos * SR)
        if i >= n: return
        m = min(len(sig), n - i); out[i:i + m, 0] += sig[:m] * g * (1 - pan) * 2 * .5; out[i:i + m, 1] += sig[:m] * g * pan * 2 * .5
    for s in range(int(dur / step)):
        pos = s * step; bar = int(pos / (beat * 4)); inten = intensity[min(n - 1, int(pos * SR))]
        if s % 4 == 0 and pos > 2: put(k, pos, .95 * inten)
        if s % 8 == 4 and pos > 8: put(clap, pos, .35 * inten)
        if pos > 6 and s % 2 == 1: put(hat, pos, .16 * inten, .5 + .3 * np.sin(s))
        if s % 2 == 0 and pos > 4:  # rolling bass 8ths
            f = prog[bar % 4]; m = int(step * 2 * SR * .9); tb = np.arange(m) / SR
            b = lp(np.sign(np.sin(2 * np.pi * f * 2 * tb)) * .5 + np.sin(2 * np.pi * f * tb), 420) * env(m, .003, step * 1.6, 1.5); put(b, pos, .5 * inten)
        if pos > 10 and s % 1 == 0:
            f = arp_notes[(s + bar * 2) % 8] * (1 if bar % 4 != 2 else .8909); m = int(step * .9 * SR); ta = np.arange(m) / SR
            a = (np.sign(np.sin(2 * np.pi * f * ta)) * .3 + np.sin(2 * np.pi * f * 2 * ta) * .2) * env(m, .001, step * .85, 2)
            put(lp(a, 3500 + 3000 * inten), pos, .13 * inten, .3 + .4 * ((s // 2) % 2))
    out *= fadein[:, None]
    out[-int(2.5 * SR):] *= np.linspace(1, 0, int(2.5 * SR))[:, None]
    return norm(out, .8)

if __name__ == '__main__':
    if sys.argv[1] == 'sfx':
        import os; os.makedirs(sys.argv[2], exist_ok=True)
        for name, fn in BANK.items(): sf.write(f'{sys.argv[2]}/{name}.wav', fn(), SR)
        print('sfx:', ', '.join(BANK))
    else:
        sf.write(sys.argv[2], music(float(sys.argv[3])), SR); print('music', sys.argv[2])
