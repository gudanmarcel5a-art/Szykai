'use strict';
// ---------------------------------------------------------------
//  OSTATNI POCIĄG O PÓŁNOCY — rdzeń: stałe, matematyka, oś czasu
//  Cały film jest czystą funkcją czasu: renderFrame(t) rysuje klatkę.
// ---------------------------------------------------------------
const W = 1080, H = 1920, FPS = 30, DUR = 25;

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const sat = (t, a, b) => clamp((t - a) / (b - a));
const ease = u => u * u * (3 - 2 * u);
const pr = (t, a, b) => ease(sat(t, a, b));
const bump = (t, a, b) => { const s = Math.sin(Math.PI * sat(t, a, b)); return s * s; };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = x => { const i = Math.floor(x), f = x - i; return lerp(hash(i), hash(i + 1), f * f * (3 - 2 * f)); };
const rgba = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${clamp(a).toFixed(3)})`;
const mod = (a, n) => ((a % n) + n) % n;
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---- oś czasu (sekundy) ----
const T = {
  boardOn: 0.9,
  walk0: 2.3, walk1: 5.3, look1: 5.95, sit1: 6.7,
  min58: 2.4, min59: 5.0, midnight: 7.6,
  trackIn: 7.9, cutBack: 9.6,
  trainIn0: 9.4, trainStop: 12.4,
  stand0: 12.3, stand1: 12.9, doors0: 12.6, doors1: 13.2,
  enter0: 13.2, enter1: 13.7, seat1: 14.6, place1: 15.3, back1: 16.1, turn1: 16.3, exit1: 17.2,
  close0: 17.0, close1: 17.6, depart: 17.6,
  cutIn: 19.0, shake0: 19.8, open0: 20.8, open1: 21.6, cutEnd: 22.0, text0: 22.6,
};

// ---- geometria świata (ujęcie boczne) ----
const XSTOP = -210;                 // pozycja czoła pociągu po zatrzymaniu
const CAR_L = 980, CAR_GAP = 26, NCARS = 3;
const DOORS = [250, 760];
const WINDOWS0 = [420, 590, 905], WINDOWSN = [95, 420, 590, 905];
const SEAT_CASE = { x: 243, y: -96 }; // miejsce walizki na siedzeniu (świat)
const WATER_Y = 130;
const LAMPS = [
  { x: -2100, dir: 1, seed: 5, fl: 0.3 },
  { x: -820, dir: 1, seed: 1, fl: 0.25 },
  { x: 540, dir: -1, seed: 2, fl: 1.0 },
  { x: 1850, dir: -1, seed: 3, fl: 0.4 },
];

function trainX(t) {
  if (t < T.trainIn0) return 5000;
  if (t <= T.trainStop) return XSTOP + 1400 * Math.pow(1 - sat(t, T.trainIn0, T.trainStop), 2.2);
  if (t < T.depart) return XSTOP;
  const d = t - T.depart; return XSTOP - 0.5 * 520 * d * d;
}
const trainSpeed = t => Math.abs(trainX(t + 0.01) - trainX(t - 0.01)) / 0.02;

function doorOpen(t) { return pr(t, T.doors0, T.doors1) * (1 - pr(t, T.close0, T.close1)); }

function lampI(l, t) {
  let v = 0.9 + 0.1 * noise1(t * 9 + l.seed * 31);
  if (hash(Math.floor(t * 18) + l.seed * 91) < 0.13 * l.fl) v *= 0.3;
  if (l.fl > 0.9) {                      // „chora" latarnia przy ławce
    v *= 1 - 0.85 * bump(t, 1.05, 1.3) - 0.9 * bump(t, T.midnight, T.midnight + 0.22) - 0.8 * bump(t, 10.6, 10.85);
    if (noise1(t * 3.1 + 40) > 0.78) v *= 0.55 + 0.45 * hash(Math.floor(t * 30));
  }
  return clamp(v);
}
function trainLight(t) {                // oświetlenie wnętrza wagonu
  let v = 0.9 + 0.1 * noise1(t * 11 + 3);
  v *= 1 - 0.8 * bump(t, 12.72, 12.86) - 0.9 * bump(t, 15.0, 15.1) - 0.85 * bump(t, 15.16, 15.3) - 0.7 * bump(t, 17.45, 17.6);
  return clamp(v);
}
const lightning = t => Math.max(0, Math.exp(-(t - 7.62) * 14) * (t > 7.62), 0.7 * Math.exp(-(t - 7.8) * 9) * (t > 7.8));

// ---- zegar: 23:57 → 00:00, potem czas staje ----
function clockState(t) {
  const marks = [0, T.min58, T.min59, T.midnight];
  let i = 0; while (i < 3 && t >= marks[i + 1]) i++;
  const since = t - marks[i];
  const settle = i === 0 ? 1 : 1 - Math.exp(-14 * since) * Math.cos(34 * since);
  const minute = 57 + i - 1 + settle;                       // z odbiciem wskazówki
  let sec;
  if (i < 3) sec = (t - marks[i]) / (marks[i + 1] - marks[i]) * 60;
  else sec = 0.9 * Math.abs(Math.sin(since * 9)) * (0.5 + 0.5 * Math.sin(since * 2.3)); // zacięty sekundnik
  const label = i < 3 ? '23:' + (57 + i) : '00:00';
  return { minute, sec, label, frozen: i === 3, since };
}

// ---- kamera: krzywa Hermite'a przez klucze [t, x, y, zoom] ----
function camTrack(keys, t) {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0].slice(1);
  if (t >= keys[n - 1][0]) return keys[n - 1].slice(1);
  let i = 0; while (keys[i + 1][0] < t) i++;
  const k0 = keys[Math.max(i - 1, 0)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(i + 2, n - 1)];
  const dt = k2[0] - k1[0], u = (t - k1[0]) / dt, u2 = u * u, u3 = u2 * u, out = [];
  for (let c = 1; c <= 3; c++) {
    const m1 = (k2[c] - k0[c]) / ((k2[0] - k0[0]) || 1) * dt, m2 = (k3[c] - k1[c]) / ((k3[0] - k1[0]) || 1) * dt;
    out.push((2 * u3 - 3 * u2 + 1) * k1[c] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * k2[c] + (u3 - u2) * m2);
  }
  return out;
}
const CAM_A = [
  [0.0, -40, -830, 1.15], [1.25, -115, -455, 1.55], [2.3, -130, -415, 1.5], [3.5, -170, -290, 1.05],
  [4.7, -50, -280, 1.12], [5.6, 40, -265, 1.32], [6.7, 60, -285, 1.42], [7.35, 236, -416, 3.3], [8.3, 249, -420, 3.75],
];
const CAM_B = [
  [9.6, 160, -300, 0.92], [11.0, 115, -290, 0.95], [12.4, 60, -255, 1.1], [13.2, 40, -200, 1.75],
  [14.5, 130, -205, 1.9], [15.3, 160, -200, 2.05], [16.2, 60, -195, 1.8], [17.0, 70, -200, 1.7],
  [17.7, 190, -195, 2.0], [19.3, 240, -150, 3.3],
];
const CAM_C = [[21.9, 40, -430, 1.12], [25.0, -30, -545, 0.92]];

function camAt(t) {
  const k = t < 9.0 ? CAM_A : t < 21.0 ? CAM_B : CAM_C;
  let [x, y, z] = camTrack(k, t);
  if (t > T.depart && t < 21) x += trainX(t) - XSTOP;       // jazda za oknem z walizką
  const sp = (t > 9.5 && t < 21) ? trainSpeed(t) : 0;
  const A = Math.min(1, sp / 700) * 5 + 7 * bump(t, T.trainStop - 0.05, T.trainStop + 0.35);
  const sx = A * (noise1(t * 19) - 0.5) * 2 + 2.5 * Math.sin(t * 0.9);
  const sy = A * (noise1(t * 23 + 7) - 0.5) * 2 + 2 * Math.sin(t * 0.7 + 1);
  return { x, y, z, sx, sy };
}
