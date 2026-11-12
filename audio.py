#!/usr/bin/env python3
"""Ścieżka dźwiękowa „Ostatni pociąg o północy" — w całości syntezowana (numpy).
Deszcz, zegar, tablica, kroki, pociąg, hamowanie, drzwi, walizka + oryginalny ambient.
Czasy zdarzeń odpowiadają osi czasu T z src/core.js.  Wynik: out/audio.wav"""
import os, wave
import numpy as np

SR, DUR = 44100, 25.0
N = int(SR * DUR)
t = np.arange(N) / SR
rs = np.random.RandomState(1957)

T = dict(boardOn=0.9, walk0=2.3, walk1=5.3, min58=2.4, min59=5.0, midnight=7.6, trackIn=7.9, cutBack=9.6,
         trainIn0=9.4, trainStop=12.4, doors0=12.6, doors1=13.2, close0=17.0, close1=17.6, depart=17.6,
         cutIn=19.0, shake0=19.8, open0=20.8, open1=21.6, cutEnd=22.0, text0=22.6)

def sm(x, a, b):
    u = np.clip((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u)

def filt(x, lo, hi, soft=0.25):
    """pasmowy filtr FFT o łagodnych zboczach"""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo: m *= sm(f, lo * (1 - soft), lo * (1 + soft))
    if hi: m *= 1 - sm(f, hi * (1 - soft), hi * (1 + soft))
    return np.fft.irfft(X * m, len(x))

def noise(n=N): return rs.randn(n)

class S(np.ndarray):
    """próbka dźwięku: dodawanie wyrównuje długości (krótsza dopełniana ciszą)"""
    def __add__(self, o):
        if isinstance(o, np.ndarray) and o.ndim == 1 and len(o) != len(self):
            n = max(len(self), len(o)); r = np.zeros(n); r[:len(self)] += self; r[:len(o)] += o; return r.view(S)
        return np.add(np.asarray(self), np.asarray(o)).view(S)
    __radd__ = __add__

def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= N or i + len(sig) <= 0: return
    a, b = max(i, 0), min(i + len(sig), N)
    buf[a:b] += gain * sig[a - i:b - i]

def burst(dur, lo, hi, decay):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = filt(np.concatenate([noise(n), np.zeros(2048)]), lo, hi)[:n]
    return (x * np.exp(-tt / decay) * np.minimum(1, tt / 0.002)).view(S)

def tone(f, dur, decay, harm=(1,), attack=0.004):
    n = int(dur * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for h, a in enumerate(harm, 1): x += a * np.sin(2 * np.pi * f * h * tt) * np.exp(-tt / (decay / (1 + 0.35 * (h - 1))))
    return (x * np.minimum(1, tt / attack)).view(S)

def train_x(tt):
    if tt < T['trainIn0']: return 5000.0
    if tt <= T['trainStop']: return -210 + 1400 * (1 - (tt - T['trainIn0']) / 3.0) ** 2.2
    if tt < T['depart']: return -210.0
    d = tt - T['depart']; return -210 - 260 * d * d
train_speed = np.array([abs(train_x(x + 0.01) - train_x(x - 0.01)) / 0.02 for x in t[::441]])
speed = np.interp(t, t[::441], train_speed)
inside = sm(t, T['cutIn'] - 0.2, T['cutIn'] + 0.2) * (1 - sm(t, T['cutEnd'] - 0.05, T['cutEnd'] + 0.1))   # 1 = we wnętrzu wagonu

dry = np.zeros((2, N)); wet = np.zeros((2, N))        # wet → pogłos
def add(sig, t0=0.0, gain=1.0, pan=0.0, rev=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    for ch, g in ((0, l), (1, r)):
        place(dry[ch], sig, t0, gain * g * 1.41)
        if rev: place(wet[ch], sig, t0, gain * g * rev * 1.41)

# ---------- DESZCZ I WIATR ----------
for ch in (0, 1):
    hiss = filt(noise(), 1800, 11000) * 0.035 + filt(noise(), 350, 2500) * 0.03
    roof = filt(noise(), 90, 700) * 0.06                       # stłumiony deszcz o dach wagonu
    swell = 0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * t + ch * 1.3) + 0.1 * np.sin(2 * np.pi * 0.37 * t + ch)
    dry[ch] += hiss * swell * (1 - 0.88 * inside) + roof * (0.35 + 0.65 * inside)
    dry[ch] += filt(noise(), 60, 380) * 0.035 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t + 2 * ch)) * (1 - inside)
for _ in range(150):                                             # pojedyncze krople
    t0 = rs.rand() * DUR
    if T['cutIn'] < t0 < T['cutEnd']: continue
    add(burst(0.03, 1500 + rs.rand() * 2500, 9000, 0.006), t0, 0.05 + 0.08 * rs.rand(), rs.rand() * 2 - 1, 0.4)

# ---------- MUZYKA: mroczny ambient w d-moll ----------
def pad(freqs, env, gain, vib=0.0):
    x = np.zeros(N)
    for i, f in enumerate(freqs):
        for det in (-0.35, 0.3):
            ph = 2 * np.pi * (f + det) * t + vib * np.sin(2 * np.pi * (4.3 + 0.4 * i) * t + i)
            x += np.sin(ph + i) * (0.7 + 0.3 * np.sin(2 * np.pi * (0.09 + 0.03 * i) * t + i * 2))
    return x * env * gain / len(freqs)
drone_env = sm(t, 0, 3) * (0.7 + 0.3 * sm(t, 8, 13)) * (1 - 0.5 * sm(t, 21.9, 22.2))
drone = pad([73.42, 110.0, 146.83], drone_env, 0.20) + pad([36.71], drone_env, 0.16)
drone += pad([174.61, 220.0], sm(t, 4, 8) * (1 - sm(t, 21.6, 22.1)), 0.06)
drone += pad([155.56, 311.13], sm(t, 12.5, 20.8) * (1 - sm(t, 20.8, 21.4)), 0.07)             # napięcie: mała sekunda
for ch in (0, 1):
    dry[ch] += drone; wet[ch] += drone * 0.5
PIANO = (1, 0.5, 0.28, 0.12, 0.06)
for t0, f, g in [(0.5, 293.66, .10), (1.7, 349.23, .08), (3.3, 440.0, .08), (4.5, 329.63, .07), (6.1, 293.66, .08), (6.9, 349.23, .07),
                 (13.3, 440.0, .07), (14.6, 466.16, .08), (15.9, 440.0, .07), (16.5, 349.23, .07), (18.0, 293.66, .07), (18.7, 233.08, .07),
                 (22.6, 880.0, .09), (23.3, 587.33, .09), (24.0, 440.0, .07)]:
    add(tone(f, 3.5, 1.3, PIANO), t0, g, rs.rand() * 0.8 - 0.4, 1.2)

# ---------- ZEGAR ----------
for k in range(0, 16):
    tk = k * 0.5 - 0.05
    if tk < 0.2 or tk > T['midnight'] - 0.1: continue
    g = 0.035 + 0.14 * sm(tk, 6.5, 7.4)
    add(burst(0.04, 1800 if k % 2 else 2600, 8000, 0.006) + 0.4 * tone(2300 if k % 2 else 3000, 0.04, 0.008), tk, g, 0.3, 0.5)
for tm, g in ((T['min58'], 0.10), (T['min59'], 0.12), (T['midnight'], 0.3)):
    add(tone(170, 0.2, 0.05) + burst(0.06, 600, 5000, 0.012), tm, g, 0.3, 0.6)
add(tone(146.83, 6.0, 2.4, (1, 0.6, 0.0, 0.3)) + 0.5 * tone(146.83 * 2.76, 4.0, 1.2) + 0.3 * tone(146.83 * 5.4, 2.5, 0.6), T['midnight'], 0.2, 0.0, 1.5)  # dzwon północy
thn = int(4 * SR); tt = np.arange(thn) / SR
add(filt(noise(thn), 22, 130) * np.minimum(1, tt / 0.12) * np.exp(-tt / 1.3) * (1 + 0.5 * np.sin(2 * np.pi * 3 * tt)), T['midnight'] + 0.05, 0.5, -0.2, 0.6)  # grzmot

# ---------- TABLICA ----------
add(tone(55, 0.25, 0.07) + burst(0.05, 1000, 8000, 0.008), T['boardOn'] - 0.05, 0.25, -0.2, 0.4)
for delay, n in ((0.1, 16), (0.55, 19)):
    for i in range(n):
        f = 1700 + rs.rand() * 1300
        add(np.sign(tone(f, 0.022, 0.012)) * tone(f, 0.022, 0.012) ** 2 + burst(0.01, 3000, 9000, 0.003) * 0.6, T['boardOn'] + delay + i * 0.045, 0.035, -0.2, 0.5)

# ---------- KROKI ----------
def step(wet_ground=True, hollow=False):
    s = burst(0.16, 70, 700 if hollow else 1500, 0.035) + 0.9 * tone(140 if hollow else 85, 0.12, 0.03)
    if wet_ground: s[:int(0.14 * SR)] += 0.35 * burst(0.14, 2200, 7000, 0.035)
    return s
def walk_prof(u):
    u0 = 0.72; v = 1 / (u0 + (1 - u0) / 2)
    return v * u if u < u0 else v * u0 + v * (u - u0) - v * (u - u0) ** 2 / (2 * (1 - u0))
us = np.linspace(0, 1, 3000); ds = np.array([640 * walk_prof(u) for u in us])
for k in range(1, 7):
    ts = T['walk0'] + 3.0 * np.interp(92 * k, ds, us)
    add(step(), ts, 0.10 + 0.035 * k, -0.8 + 0.13 * k, 0.5)
for ts, g in ((13.38, .22), (13.62, .24), (13.92, .2), (14.17, .2), (14.42, .2), (15.5, .2), (15.75, .2), (16.0, .2), (16.2, .16)):
    add(step(False, True), ts, g, 0.05, 0.4)
add(tone(105, 0.3, 0.07) + burst(0.08, 400, 3000, 0.02), 14.97, 0.3, 0.2, 0.5)                    # walizka na siedzeniu
for ts, g in ((16.5, .3), (16.75, .45), (16.98, .6)):                                             # zejście na żwir, ku kamerze
    add(step(False) + 0.8 * burst(0.2, 900, 5000, 0.05), ts, g, 0.1, 0.3)
wn = int(1.0 * SR); tt = np.arange(wn) / SR
add(filt(noise(wn), 60, 600) * np.sin(np.pi * tt / 1.0) ** 3, 16.55, 0.45, 0.3)                     # sylwetka mija kamerę

# ---------- POCIĄG ----------
def horn(dur, lp):
    n = int((dur + 0.6) * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for f in (277.18, 349.23):
        for h in range(1, 9): x += np.sin(2 * np.pi * f * h * tt * (1 + 0.002 * np.sin(2 * np.pi * 5 * tt))) / h
    env = np.minimum(1, tt / 0.09) * (1 - sm(tt, dur, dur + 0.5))
    return filt(np.concatenate([x * env, np.zeros(4096)]), 120, lp)[:n]
add(horn(1.1, 700), 8.2, 0.05, 0.5, 2.5)          # daleki sygnał o północy
add(horn(0.45, 2200), 10.15, 0.07, 0.6, 1.2)
dist = sm(t, 8.3, 9.9)                               # zbliżanie się
rum_env = (dist * (0.25 + 0.75 * np.clip(speed / 900, 0, 1)) * (t < T['trainStop'])
           + 0.10 * ((t >= T['trainStop']) & (t < T['depart'])) + (0.1 + 0.9 * np.clip(speed / 800, 0, 1)) * (t >= T['depart']))
rum_env *= (1 - sm(t, T['cutEnd'] - 0.05, T['cutEnd'] + 0.25))
rum_env = np.convolve(rum_env, np.ones(2205) / 2205, 'same')
for ch in (0, 1):
    ext = filt(noise(), 28, 260) * 0.5 + filt(noise(), 200, 1400) * 0.12
    ins = filt(noise(), 25, 150) * 0.5
    dry[ch] += rum_env * (ext * (1 - inside) + ins * inside * 0.75)
idle = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 110 * t)) * (1 + 0.3 * np.sin(2 * np.pi * 9 * t))
add(idle * sm(t, 11.8, 12.6) * (1 - sm(t, 18.6, 19.2)), 0, 0.03, 0.0)
def clack(g, hollow=False):
    return (burst(0.12, 50, 500 if hollow else 1100, 0.028) + 0.8 * tone(68, 0.1, 0.03)) * g
prev = None                                                              # stuk kół na łączeniach szyn
for i in range(0, N, 64):
    tt_ = t[i]
    if not (9.55 < tt_ < 19.2): prev = None; continue
    cell = np.floor(train_x(tt_) / 340)
    if prev is not None and cell != prev:
        g = min(1.0, speed[i] / 500) * 0.3 * (1 - inside[i])
        if g > 0.02:
            gap = min(0.3, 80 / max(speed[i], 60))
            add(clack(g), tt_, 1, 0.4, 0.2); add(clack(g * 0.8), tt_ + gap, 1, 0.4, 0.2)
    prev = cell
for k in range(0, 8):                                                    # rytm jazdy słyszany z wnętrza
    tk = np.ceil(T['cutIn'] / 0.46) * 0.46 + k * 0.46 - 0.46
    if tk < T['cutIn'] - 0.25 or tk > T['cutEnd'] - 0.1: continue
    add(clack(0.3, True), tk, 1, -0.2); add(clack(0.22, True), tk + 0.13, 1, 0.2)
sq = sm(t, 10.7, 11.5) * (1 - sm(t, 12.2, 12.45))                         # pisk hamulców
fsq = 2550 - 420 * sm(t, 10.7, 12.4) + 25 * np.sin(2 * np.pi * 6.5 * t)
ph = 2 * np.pi * np.cumsum(fsq) / SR
squeal = (np.sin(ph) + 0.45 * np.sin(1.5 * ph + 1) + 0.25 * np.sin(2.02 * ph)) * (1 + 0.5 * filt(noise(), 5, 60) * 6)
add(squeal * sq, 0, 0.022, 0.4, 0.7)
add(filt(noise(), 2800, 9500) * sq, 0, 0.03, 0.4, 0.3)
hn = int(0.9 * SR); tt = np.arange(hn) / SR
add(filt(noise(hn), 2200, 10000) * np.minimum(1, tt / 0.02) * np.exp(-tt / 0.22), T['trainStop'] + 0.05, 0.16, 0.2, 0.4)   # syk powietrza
def beep(f=1318.5, d=0.09): return tone(f, d, 1.0) * (1 - sm(np.arange(int(d * SR)) / SR, d - 0.02, d))
def slide(d=0.6):
    n = int(d * SR); tt = np.arange(n) / SR
    return filt(noise(n), 250, 2600) * np.sin(np.pi * tt / d) ** 0.6 * (1 + 0.4 * np.sin(2 * np.pi * 23 * tt))
for tb in (12.5, 12.68): add(beep(), tb, 0.045, 0.0, 0.6)
add(slide(), T['doors0'], 0.06, 0.0, 0.3); add(tone(95, 0.2, 0.05) + burst(0.05, 500, 4000, 0.012), T['doors1'] - 0.03, 0.18, 0.0, 0.4)
for tb in (17.22, 17.34, 17.46): add(beep(1568), tb, 0.045, 0.0, 0.6)
add(slide(), T['close0'], 0.06, 0.0, 0.3); add(tone(85, 0.25, 0.06) + burst(0.06, 400, 3500, 0.015), T['close1'] - 0.03, 0.26, 0.0, 0.5)
dd = np.clip(t - T['depart'], 0, None)                                    # zawodzenie silników przy odjeździe
ph = 2 * np.pi * np.cumsum(150 + 330 * np.clip(dd / 2.0, 0, 1.4) ** 0.8) / SR
add((np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.25 * np.sin(3.01 * ph)) * sm(t, T['depart'], T['depart'] + 0.5) * (1 - sm(t, 21.2, 21.9)) * (1 - 0.6 * inside), 0, 0.022, 0.0, 0.5)

# ---------- WALIZKA ----------
tr = T['shake0']
while tr < T['open0'] - 0.02:                                             # coraz szybsze grzechotanie
    u = (tr - T['shake0']) / (T['open0'] - T['shake0'])
    add(burst(0.05, 700, 5200, 0.012) + 0.7 * tone(260 + 80 * rs.rand(), 0.05, 0.014), tr, 0.03 + 0.22 * u * u, rs.rand() * 0.4 - 0.2, 0.3)
    tr += (1 / (11 + 26 * u)) * (0.75 + 0.5 * rs.rand())
ris = sm(t, T['shake0'] - 0.3, T['open0']) ** 2 * (1 - sm(t, T['open0'], T['open0'] + 0.12))                      # narastające napięcie
ph = 2 * np.pi * np.cumsum(110 * 2 ** (2.0 * sm(t, T['shake0'] - 0.3, T['open0']))) / SR
add((np.sin(ph) + 0.5 * np.sin(1.498 * ph) + 0.3 * np.sin(2.01 * ph)) * ris * (1 + 0.3 * np.sin(2 * np.pi * 11 * t)), 0, 0.05, 0.0, 0.8)
add(filt(noise(), 3000, 12000) * ris, 0, 0.035, 0.0, 0.5)
for tl, pn in ((T['open0'] - 0.1, -0.25), (T['open0'] - 0.02, 0.25)):     # zatrzaski
    add(burst(0.03, 2000, 10000, 0.004) + 0.5 * tone(3300, 0.2, 0.035) + 0.5 * tone(180, 0.06, 0.015), tl, 0.32, pn, 0.7)
wn = int(1.6 * SR); tt = np.arange(wn) / SR                              # otwarcie: podmuch + świetlisty akord
add(filt(noise(wn), 180, 3200) * np.minimum(1, tt / 0.06) * np.exp(-tt / 0.45), T['open0'], 0.2, 0.0, 0.8)
ch_env = sm(t, T['open0'], T['open1'] + 0.3) * (0.6 + 0.4 * sm(t, T['open1'], T['cutEnd'])) * (1 - 0.72 * sm(t, T['cutEnd'], T['cutEnd'] + 0.5)) * (1 - sm(t, 23.6, 24.9))
chord = pad([293.66, 440.0, 587.33, 659.26, 880.0, 1174.66, 1318.5], ch_env, 0.26, vib=0.5)
shim = filt(noise(), 5000, 12000) * ch_env * 0.012 * (1 + np.sin(2 * np.pi * 13 * t))
for ch in (0, 1): dry[ch] += chord * 0.7 + shim; wet[ch] += chord * 1.2 + shim
bn = int(3.0 * SR); tt = np.arange(bn) / SR                              # uderzenie przy powrocie na peron
boom = np.sin(2 * np.pi * (32 * tt + 18 * (1 - np.exp(-tt * 5)) / 5)) * np.exp(-tt / 0.9) * np.minimum(1, tt / 0.004)
add(boom + 0.4 * filt(noise(bn), 30, 300) * np.exp(-tt / 0.25), T['cutEnd'], 0.55, 0.0, 0.5)

# ---------- POGŁOS, MASTER ----------
rn = int(3.2 * SR); rt = np.arange(rn) / SR
out = np.zeros((2, N))
for ch in (0, 1):
    ir = filt(rs.randn(rn), 150, 7000) * np.exp(-rt / 0.75) * np.minimum(1, rt / 0.012)
    ir /= np.sqrt(np.sum(ir ** 2))
    L = N + rn
    conv = np.fft.irfft(np.fft.rfft(wet[ch], L) * np.fft.rfft(ir, L), L)[:N]
    out[ch] = dry[ch] + 0.33 * conv
out = filt(out[0], 22, 0), filt(out[1], 22, 0)
out = np.array(out)
out *= sm(t, 0, 0.6) * (1 - sm(t, DUR - 0.9, DUR - 0.05))
out = np.tanh(out * 1.5) / 1.5
out *= 0.84 / np.max(np.abs(out))
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'), exist_ok=True)
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'audio.wav')
with wave.open(path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out.T * 32767).astype('<i2').tobytes())
rms = 20 * np.log10(np.sqrt(np.mean(out ** 2)))
print(f'zapisano {path}  ({DUR:.0f} s, RMS {rms:.1f} dBFS)')
