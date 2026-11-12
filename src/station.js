'use strict';
// ---------------------------------------------------------------
//  Ujęcie boczne stacji: niebo, tło, budynek, peron, latarnie,
//  zegar, tablica, deszcz, woda z odbiciami, finałowa poświata
// ---------------------------------------------------------------
let ctx, cam;
const FONT_UI = '"Inter Display","Inter","DejaVu Sans",sans-serif';
const FONT_LED = '"JetBrains Mono","DejaVu Sans Mono",monospace';

function setLayer(par) {
  const zf = 1 + (cam.z - 1) * par;
  ctx.setTransform(zf, 0, 0, zf, W / 2 - cam.x * par * zf + cam.sx * par, H / 2 - cam.y * par * zf + cam.sy * par);
  return { zf, x0: cam.x * par - W / 2 / zf - 30, x1: cam.x * par + W / 2 / zf + 30 };
}
const poly = pts => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };
function glow(x, y, r, r_, g_, b_, a, sx = 1, sy = 1) {
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, rgba(r_, g_, b_, a)); g.addColorStop(0.35, rgba(r_, g_, b_, a * 0.38)); g.addColorStop(1, rgba(r_, g_, b_, 0));
  ctx.fillStyle = g; ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.restore();
}

// ---- tekstury przygotowane raz ----
let TEX = null;
function buildTextures() {
  const clouds = mk(2048, 1024), g = clouds.getContext('2d'), r = rng(7);
  for (let i = 0; i < 210; i++) {
    const x = r() * 2048, y = 80 + r() * r() * 860, rad = 80 + r() * 230, darkb = r() < 0.4;
    const a = darkb ? 0.10 + r() * 0.14 : 0.04 + r() * 0.075, col = darkb ? '3,5,10' : (r() < 0.5 ? '78,104,146' : '44,64,100');
    for (const dx of [-2048, 0, 2048]) {
      g.setTransform(1.9, 0, 0, 0.5, x + dx, y);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rad);
      gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rad, 0, 7); g.fill();
    }
  }
  const grain = [];
  for (let k = 0; k < 4; k++) {
    const c = mk(256, 256), gg = c.getContext('2d'), im = gg.createImageData(256, 256), rr = rng(100 + k);
    for (let i = 0; i < im.data.length; i += 4) { const v = rr() * 255; im.data[i] = v * 0.85; im.data[i + 1] = v * 0.95; im.data[i + 2] = v; im.data[i + 3] = 255; }
    gg.putImageData(im, 0, 0); grain.push(c);
  }
  const vig = mk(W / 4, H / 4), vg = vig.getContext('2d');
  const gr = vg.createRadialGradient(W / 8, H / 8 * 1.05, H / 8 * 0.42, W / 8, H / 8, H / 8 * 1.12);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.62)');
  vg.fillStyle = gr; vg.fillRect(0, 0, W / 4, H / 4);
  const led = mk(4, 4), lg = led.getContext('2d');
  lg.fillStyle = 'rgba(0,0,0,0.55)'; lg.fillRect(0, 0, 4, 1); lg.fillRect(0, 0, 1, 4);
  TEX = { clouds, grain, vig, led };
}

function drawSky(t, yshift, xshift) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#040812'); g.addColorStop(0.38, '#0c182c'); g.addColorStop(0.62, '#1b3050'); g.addColorStop(1, '#0d1728');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // księżyc za chmurami
  const mx = 790 - xshift * 0.3, my = 250 + yshift;
  glow(mx, my, 420, 110, 150, 205, 0.22); glow(mx, my, 120, 190, 215, 245, 0.35);
  ctx.fillStyle = 'rgba(214,228,246,0.8)'; ctx.beginPath(); ctx.arc(mx, my, 34, 0, 7); ctx.fill();
  // dwie warstwy płynących chmur
  for (const [sc, sp, al, oy] of [[1.25, 16, 0.95, -160], [2.1, 38, 0.8, -420]]) {
    const tw = 2048 * sc, off = mod(t * sp + xshift * sc * 0.6 + sc * 300, tw);
    ctx.globalAlpha = al;
    for (let x = -off; x < W; x += tw) ctx.drawImage(TEX.clouds, x, oy + yshift * (0.6 + sc * 0.2), tw, 1024 * sc);
  }
  ctx.globalAlpha = 1;
  const fl = lightning(t);
  if (fl > 0.01) { ctx.fillStyle = rgba(150, 185, 240, 0.4 * fl); ctx.fillRect(0, 0, W, H); }
}

function drawFar(t) {
  // wzgórza
  let v = setLayer(0.12);
  ctx.fillStyle = '#0a1322'; ctx.beginPath(); ctx.moveTo(v.x0, 900);
  for (let x = Math.floor(v.x0 / 40) * 40; x <= v.x1 + 40; x += 40) ctx.lineTo(x, 20 - 150 * noise1(x / 420 + 5) - 30 * noise1(x / 90));
  ctx.lineTo(v.x1 + 40, 900); ctx.fill();
  // mgła nad horyzontem
  const fg = ctx.createLinearGradient(0, -80, 0, 80); fg.addColorStop(0, 'rgba(60,90,135,0)'); fg.addColorStop(0.6, 'rgba(60,90,135,0.16)'); fg.addColorStop(1, 'rgba(60,90,135,0)');
  ctx.fillStyle = fg; ctx.fillRect(v.x0, -80, v.x1 - v.x0, 160);
  // linia lasu
  v = setLayer(0.3);
  ctx.fillStyle = '#060b14'; ctx.beginPath(); ctx.moveTo(v.x0, 1200);
  for (let x = Math.floor(v.x0 / 14) * 14; x <= v.x1 + 14; x += 14) ctx.lineTo(x, -60 - 70 * noise1(x / 130 + 9) - 26 * hash(x * 0.37) - 8 * Math.sin(x * 0.02 + t * 0.6) * hash(x));
  ctx.lineTo(v.x1 + 14, 1200); ctx.fill();
  // słupy telegraficzne
  v = setLayer(0.5);
  ctx.strokeStyle = '#05080f'; ctx.fillStyle = '#04070c';
  ctx.fillRect(v.x0, -40, v.x1 - v.x0, 1500);
  for (let k = Math.floor(v.x0 / 430) - 1; k <= Math.ceil(v.x1 / 430); k++) {
    const x = k * 430 + 120;
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, -30); ctx.lineTo(x + 4, -360); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 30, -335); ctx.lineTo(x + 38, -339); ctx.moveTo(x - 20, -305); ctx.lineTo(x + 28, -308); ctx.stroke();
    ctx.lineWidth = 1.3;
    for (const [dx, dy] of [[-28, -336], [36, -340], [-18, -306]]) { ctx.beginPath(); ctx.moveTo(x + dx, dy); ctx.quadraticCurveTo(x + dx + 215, dy + 46 + 3 * Math.sin(t * 1.3 + k), x + dx + 430, dy); ctx.stroke(); }
  }
}

function drawBuilding(t) {
  // komin i dach
  ctx.fillStyle = '#080c14'; ctx.fillRect(-455, -785, 50, 130); ctx.fillRect(-461, -792, 62, 12);
  ctx.fillStyle = '#070a11'; poly([-668, -612, -180, -802, 308, -612]); ctx.fill();
  ctx.strokeStyle = 'rgba(120,150,195,0.10)'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 9; i++) { const y = -612 - i * 21, w = 488 * (1 - i * 21 / 190); ctx.beginPath(); ctx.moveTo(-180 - w, y); ctx.lineTo(-180 + w, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(150,180,225,0.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-180, -802); ctx.lineTo(308, -612); ctx.stroke();
  // ściana
  const wg = ctx.createLinearGradient(0, -620, 0, -36); wg.addColorStop(0, '#162030'); wg.addColorStop(1, '#0e1522');
  ctx.fillStyle = wg; ctx.fillRect(-620, -620, 880, 584);
  const r = rng(11);
  ctx.fillStyle = 'rgba(125,155,195,0.055)'; ctx.beginPath();
  const dark = [];
  for (let row = 0; row < 36; row++) for (let col = 0; col < 21; col++) {
    const q = r(), x = -620 + col * 42 + (row % 2) * 21, y = -616 + row * 16;
    if (q < 0.3) ctx.rect(x, y, 39, 13); else if (q < 0.42) dark.push(x, y);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); for (let i = 0; i < dark.length; i += 2) ctx.rect(dark[i], dark[i + 1], 39, 13); ctx.fill();
  // zacieki
  for (let i = 0; i < 9; i++) { const x = -600 + r() * 840, h = 120 + r() * 300; const g = ctx.createLinearGradient(0, -620, 0, -620 + h); g.addColorStop(0, 'rgba(0,0,0,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x, -620, 14 + r() * 30, h); }
  ctx.fillStyle = '#090d15'; ctx.fillRect(-620, -92, 880, 56);
  ctx.fillStyle = 'rgba(130,160,200,0.08)'; ctx.fillRect(-620, -94, 880, 3);
  // okrągłe okienko w szczycie
  ctx.fillStyle = '#03050a'; ctx.beginPath(); ctx.arc(-180, -690, 26, 0, 7); ctx.fill();
  ctx.strokeStyle = '#131b29'; ctx.lineWidth = 4; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-206, -690); ctx.lineTo(-154, -690); ctx.moveTo(-180, -716); ctx.lineTo(-180, -664); ctx.stroke();
  // zabite deskami okna
  for (const wx of [-460, 100]) {
    ctx.fillStyle = '#070a11'; ctx.beginPath(); ctx.roundRect(wx - 60, -350, 120, 226, [56, 56, 0, 0]); ctx.fill();
    ctx.fillStyle = '#020408'; ctx.beginPath(); ctx.roundRect(wx - 50, -340, 100, 208, [48, 48, 0, 0]); ctx.fill();
    ctx.fillStyle = 'rgba(120,160,210,0.07)'; ctx.fillRect(wx - 40, -300, 22, 80);
    ctx.fillStyle = '#151d2a';
    for (const [dy, rot] of [[-290, 0.07], [-235, -0.05], [-178, 0.11]]) { ctx.save(); ctx.translate(wx, dy); ctx.rotate(rot * (wx > 0 ? -1 : 1)); ctx.fillRect(-64, -11, 128, 22); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-60, -3, 3, 3); ctx.fillRect(56, -3, 3, 3); ctx.restore(); ctx.fillStyle = '#151d2a'; }
    ctx.fillStyle = '#0c121c'; ctx.fillRect(wx - 68, -126, 136, 9);
  }
  // drzwi
  ctx.fillStyle = '#070a11'; ctx.fillRect(-274, -306, 128, 270);
  ctx.fillStyle = '#0d1420'; ctx.fillRect(-266, -298, 112, 262);
  ctx.fillStyle = '#080c14'; for (const [x, y, w, h] of [[-258, -230, 44, 84], [-206, -230, 44, 84], [-258, -136, 44, 90], [-206, -136, 44, 90]]) ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#020408'; ctx.fillRect(-258, -290, 96, 46);
  ctx.fillStyle = 'rgba(165,180,196,0.22)'; ctx.save(); ctx.translate(-208, -180); ctx.rotate(-0.06); ctx.fillRect(-16, -22, 32, 44); ctx.restore();
  // rynna
  ctx.strokeStyle = '#070a10'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(250, -612); ctx.lineTo(250, -40); ctx.stroke();
  // cień pod wiatą
  const sg = ctx.createLinearGradient(0, -502, 0, -330); sg.addColorStop(0, 'rgba(0,0,0,0.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.fillRect(-620, -502, 880, 172);
}

function drawCanopy(t) {
  ctx.strokeStyle = '#070a10'; ctx.lineCap = 'butt';
  for (const x of [-665, 425]) {
    ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(x, -502); ctx.lineTo(x, -28); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 44, -502); ctx.quadraticCurveTo(x - 4, -494, x, -450); ctx.moveTo(x + 44, -502); ctx.quadraticCurveTo(x + 4, -494, x, -450); ctx.stroke();
    ctx.fillStyle = '#070a10'; ctx.fillRect(x - 10, -34, 20, 8);
    ctx.fillStyle = 'rgba(150,180,220,0.15)'; ctx.fillRect(x + 3, -500, 1.5, 470);
  }
  ctx.fillStyle = '#080c13'; ctx.fillRect(-695, -524, 1150, 22);
  ctx.fillStyle = 'rgba(150,180,225,0.16)'; ctx.fillRect(-695, -525, 1150, 2);
  ctx.fillStyle = '#080c13'; ctx.beginPath();
  for (let x = -695; x < 455; x += 23) { ctx.moveTo(x, -502); ctx.lineTo(x + 11.5, -490); ctx.lineTo(x + 23, -502); }
  ctx.fill();
  // szyld z nazwą stacji
  ctx.fillStyle = '#0c131e'; ctx.fillRect(-200, -584, 320, 56);
  ctx.strokeStyle = 'rgba(140,165,200,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(-195, -579, 310, 46);
  ctx.fillStyle = 'rgba(175,195,220,0.5)'; ctx.font = `700 34px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.letterSpacing = '12px'; ctx.fillText('ZAMGLE', -34, -555); ctx.letterSpacing = '0px';
  // krople kapiące z wiaty
  ctx.strokeStyle = 'rgba(170,200,235,0.4)'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const x = -680 + hash(i * 3.3) * 1120, ph = mod(t * (0.9 + hash(i) * 0.6) + hash(i * 7), 1);
    if (ph < 0.55) { const y = -490 + 470 * (ph / 0.55) ** 2; ctx.moveTo(x, y); ctx.lineTo(x, y + 9 + 26 * ph); }
  }
  ctx.stroke();
}

function drawBench() {
  ctx.fillStyle = '#06090e';
  for (const x of [-48, 128]) { ctx.fillRect(x - 4, -78, 8, 58); ctx.fillRect(x - 12, -24, 24, 5); ctx.fillRect(x - 3, -134, 6, 58); }
  ctx.fillStyle = '#0d141f'; ctx.fillRect(-64, -84, 208, 9);
  for (const y of [-132, -116, -100]) ctx.fillRect(-64, y, 208, 10);
  ctx.fillStyle = 'rgba(150,180,220,0.18)'; ctx.fillRect(-64, -84, 208, 1.5); ctx.fillRect(-64, -132, 208, 1.2);
}

function drawClock(t, tint) {
  const cs = clockState(t), cx = 250, cy = -420;
  ctx.strokeStyle = '#070a10'; ctx.lineWidth = 7; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(cx, -502); ctx.lineTo(cx, cy - 52); ctx.stroke();
  ctx.fillStyle = '#070a10'; ctx.fillRect(cx - 14, cy - 60, 28, 10);
  const fl = 0.88 + 0.12 * noise1(t * 7 + 2) - 0.5 * bump(t, T.midnight, T.midnight + 0.18);
  glow(cx, cy, 190, lerp(150, 70, tint), lerp(185, 150, tint), 235, 0.3 * fl);
  ctx.fillStyle = '#05080d'; ctx.beginPath(); ctx.arc(cx, cy, 56, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(150,180,225,0.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 55.5, 3.6, 5.6); ctx.stroke();
  const g = ctx.createRadialGradient(cx - 8, cy - 10, 4, cx, cy, 50);
  g.addColorStop(0, rgba(lerp(226, 150, tint) * fl, lerp(236, 205, tint) * fl, 246 * fl, 1)); g.addColorStop(1, rgba(lerp(120, 50, tint) * fl, lerp(146, 110, tint) * fl, 176 * fl, 1));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 48, 0, 7); ctx.fill();
  ctx.strokeStyle = '#0a0f18'; ctx.lineCap = 'butt';
  for (let i = 0; i < 60; i++) {
    const a = i * Math.PI / 30, big = i % 5 === 0;
    ctx.lineWidth = big ? (i % 15 === 0 ? 4 : 2.6) : 0.8;
    ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * (big ? 35 : 41), cy - Math.cos(a) * (big ? 35 : 41)); ctx.lineTo(cx + Math.sin(a) * 44, cy - Math.cos(a) * 44); ctx.stroke();
  }
  const hand = (ang, len, w, back) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(cx - Math.sin(ang) * back, cy + Math.cos(ang) * back); ctx.lineTo(cx + Math.sin(ang) * len, cy - Math.cos(ang) * len); ctx.stroke(); };
  ctx.lineCap = 'round';
  const hours = 11 + cs.minute / 60;
  hand(hours * Math.PI / 6, 25, 5.5, 5);
  hand(cs.minute * Math.PI / 30, 39, 3.6, 7);
  ctx.strokeStyle = '#33506e'; hand(cs.sec * Math.PI / 30, 41, 1.3, 11);
  ctx.fillStyle = '#0a0f18'; ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 43, 3.9, 4.9); ctx.stroke();
  // błysk o północy
  const mf = Math.exp(-Math.max(0, t - T.midnight) * 5) * (t >= T.midnight);
  glow(cx, cy, 300, 190, 220, 255, 0.5 * mf);
}

const MSG1 = 'OSTATNI POCIĄG —', MSG2 = 'OPÓŹNIENIE 3 MINUTY', SCR = 'ABCDEFGHIJKLMNOPRSTUWZ0123456789#%&';
function drawBoard(t, blue) {
  const x0 = -335, y0 = -475, bw = 420, bh = 123;
  ctx.strokeStyle = '#070a10'; ctx.lineWidth = 5; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(-295, -502); ctx.lineTo(-295, y0); ctx.moveTo(45, -502); ctx.lineTo(45, y0); ctx.stroke();
  ctx.fillStyle = '#05080d'; ctx.beginPath(); ctx.roundRect(x0, y0, bw, bh, 7); ctx.fill();
  ctx.fillStyle = '#010306'; ctx.fillRect(x0 + 8, y0 + 8, bw - 16, bh - 16);
  ctx.strokeStyle = 'rgba(150,180,225,0.22)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0 + 6, y0 + 0.8); ctx.lineTo(x0 + bw - 6, y0 + 0.8); ctx.stroke();
  const fr = Math.floor(t * 30);
  let fl = 0.86 + 0.14 * hash(fr * 1.7); if (hash(fr * 0.31 + 9) < 0.035) fl *= 0.35;
  const on = t >= T.boardOn, gone = t > T.depart + 1.0;
  const col = a => blue > 0.01 ? rgba(lerp(170, 90, blue), lerp(225, 190, blue), 255, a * fl) : rgba(170, 225, 255, a * fl);
  ctx.save(); ctx.beginPath(); ctx.rect(x0 + 8, y0 + 8, bw - 16, bh - 16); ctx.clip();
  ctx.textBaseline = 'middle'; ctx.shadowColor = col(0.9); ctx.shadowBlur = 9 * cam.z;
  // nagłówek z godziną
  ctx.font = `600 13px ${FONT_LED}`; ctx.fillStyle = col(0.55); ctx.textAlign = 'left'; ctx.fillText('ODJAZDY', x0 + 16, y0 + 21);
  const cs = clockState(t); ctx.textAlign = 'right';
  if (!cs.frozen || Math.sin(cs.since * 7) > -0.2) ctx.fillText(cs.label, x0 + bw - 16, y0 + 21);
  ctx.fillStyle = col(0.25); ctx.fillRect(x0 + 16, y0 + 31, bw - 32, 1.2);
  ctx.textAlign = 'center';
  const line = (msg, yy, size, cell, delay, weight) => {
    ctx.font = `${weight} ${size}px ${FONT_LED}`;
    const sx = x0 + bw / 2 - (msg.length - 1) * cell / 2;
    for (let i = 0; i < msg.length; i++) {
      const tc = T.boardOn + delay + i * 0.045; if (t < tc) continue;
      let ch = msg[i];
      if (ch !== ' ' && (t < tc + 0.16 || (blue > 0.3 && hash(fr * 0.5 + i * 3.1) < 0.25 * blue))) ch = SCR[Math.floor(hash(fr + i * 13.7) * SCR.length)];
      ctx.fillStyle = col(t < tc + 0.16 ? 0.6 : 1); ctx.fillText(ch, sx + i * cell, yy);
    }
  };
  if (on && !gone) { line(MSG1, y0 + 58, 30, 23.5, 0.1, 700); line(MSG2, y0 + 93, 24, 20, 0.55, 500); }
  else if (blue > 0.3) { line('— — — — — — —', y0 + 74, 30, 23.5, -30, 700); }
  else { ctx.font = `700 30px ${FONT_LED}`; ctx.fillStyle = col(0.3); ctx.fillText('— — —', x0 + bw / 2, y0 + 74); }
  ctx.shadowBlur = 0;
  // błysk włączenia
  const sw = sat(t, T.boardOn - 0.06, T.boardOn + 0.22);
  if (sw > 0 && sw < 1) { ctx.fillStyle = rgba(200, 240, 255, 0.55 * (1 - sw)); ctx.fillRect(x0 + 8, y0 + 8 + sw * (bh - 16) - 10, bw - 16, 20); ctx.fillStyle = rgba(190, 235, 255, 0.25 * (1 - sw)); ctx.fillRect(x0, y0, bw, bh); }
  // siatka diod
  ctx.fillStyle = ctx.createPattern(TEX.led, 'repeat'); ctx.save(); ctx.scale(0.75, 0.75); ctx.fillRect((x0) / 0.75, (y0) / 0.75, bw / 0.75, bh / 0.75); ctx.restore();
  ctx.restore();
  const lit = on && !gone ? 1 : 0.25;
  glow(x0 + bw / 2, y0 + bh / 2 + 10, 300, lerp(90, 40, blue), 170, 235, 0.17 * fl * lit * pr(t, T.boardOn, T.boardOn + 0.8) + 0.03, 1.3, 0.8);
}

function lampHead(l) { return { x: l.x + l.dir * 35, y: -470 }; }
function lightAt(x, t) { let s = 0; for (const l of LAMPS) { const d = (x - lampHead(l).x) / 230; s += lampI(l, t) * Math.exp(-d * d); } return s; }

function drawLampLight(l, t, blue) {
  const h = lampHead(l), I = lampI(l, t), cr = lerp(175, 60, blue), cg = lerp(205, 160, blue);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, h.y, 0, -6); g.addColorStop(0, rgba(cr, cg, 240, 0.2 * I)); g.addColorStop(1, rgba(cr, cg, 240, 0.02 * I));
  ctx.fillStyle = g; poly([h.x - 14, h.y + 6, h.x + 14, h.y + 6, h.x + 200, -6, h.x - 200, -6]); ctx.fill();
  ctx.restore();
  glow(h.x, -16, 215, cr, cg, 235, 0.24 * I, 1, 0.085);          // plama światła na mokrym peronie
  // deszcz w snopie światła
  ctx.strokeStyle = rgba(lerp(200, 120, blue), lerp(225, 200, blue), 255, 0.55 * I); ctx.lineWidth = 1.3; ctx.beginPath();
  for (let i = 0; i < 46; i++) {
    const y = h.y + 10 + mod(hash(i * 5.3 + l.seed) * 460 + t * (820 + 300 * hash(i)), 460), hw = 14 + (y - h.y) * 0.39;
    const x = h.x + (hash(i * 9.1 + l.seed * 3) - 0.5) * 2 * hw;
    ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 20);
  }
  ctx.stroke();
}
function drawLampPost(l, t, blue) {
  const h = lampHead(l), I = lampI(l, t);
  ctx.strokeStyle = '#06090e'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(l.x, -6); ctx.lineTo(l.x, -440); ctx.quadraticCurveTo(l.x, -486, h.x, -484); ctx.stroke();
  ctx.fillStyle = '#06090e'; ctx.fillRect(l.x - 9, -30, 18, 26);
  poly([h.x - 20, h.y + 2, h.x + 20, h.y + 2, h.x + 11, h.y - 15, h.x - 11, h.y - 15]); ctx.fill();
  ctx.fillStyle = 'rgba(150,180,220,0.2)'; ctx.fillRect(l.x + 2.5, -430, 1.4, 420);
  const cr = lerp(190, 80, blue), cg = lerp(215, 175, blue);
  glow(h.x, h.y + 6, 150, cr, cg, 250, 0.6 * I); glow(h.x, h.y + 6, 420, cr * 0.7, cg * 0.8, 230, 0.1 * I);
  ctx.fillStyle = rgba(235, 244, 255, 0.95 * I); ctx.beginPath(); ctx.ellipse(h.x, h.y + 5, 13, 4.5, 0, 0, 7); ctx.fill();
}

function drawPlatform(t, v) {
  const x0 = Math.max(v.x0, -1900), x1 = Math.min(v.x1, 2300);
  ctx.fillStyle = '#05080d'; ctx.fillRect(v.x0, -36, v.x1 - v.x0, 400);     // grunt
  if (x1 > x0) {
    const g = ctx.createLinearGradient(0, -36, 0, 0); g.addColorStop(0, '#131c2a'); g.addColorStop(1, '#1b2637');
    ctx.fillStyle = g; ctx.fillRect(x0, -36, x1 - x0, 36);
    // mokre odbłyski i kałuże
    for (let k = Math.floor(x0 / 70); k <= x1 / 70; k++) {
      const x = k * 70 + hash(k) * 50, L = lightAt(x, t);
      ctx.fillStyle = rgba(160, 195, 235, 0.05 + 0.16 * L * hash(k * 3.3));
      ctx.beginPath(); ctx.ellipse(x, -8 - hash(k * 1.7) * 20, 22 + hash(k * 2.1) * 30, 2.2, 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgba(190,205,225,0.16)'; for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) ctx.fillRect(x, -7, 40, 2.4);
    const eg = ctx.createLinearGradient(0, 0, 0, 70); eg.addColorStop(0, '#141c29'); eg.addColorStop(0.12, '#0d131d'); eg.addColorStop(1, '#06090e');
    ctx.fillStyle = eg; ctx.fillRect(x0, 0, x1 - x0, 70);
    ctx.fillStyle = 'rgba(165,195,235,0.3)'; ctx.fillRect(x0, -1, x1 - x0, 1.6);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let x = Math.floor(x0 / 120) * 120; x < x1; x += 120) ctx.fillRect(x, 6, 2, 64);
    // rozbryzgi deszczu
    ctx.strokeStyle = 'rgba(185,212,245,0.5)'; ctx.lineWidth = 1;
    for (let k = Math.floor(x0 / 26); k <= x1 / 26; k++) {
      const ph = mod(t * (1.6 + hash(k * 1.3)) + hash(k * 4.1), 1); if (ph > 0.45) continue;
      const u = ph / 0.45, x = k * 26 + hash(k * 8.8 + Math.floor(t * (1.6 + hash(k * 1.3)) + hash(k * 4.1))) * 26, y = -4 - hash(k * 2.9) * 28;
      ctx.globalAlpha = (1 - u) * (0.25 + 0.6 * Math.min(1, lightAt(x, t)));
      ctx.beginPath(); ctx.ellipse(x, y, 2 + 9 * u, 0.6 + 2 * u, 0, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 3 * u, y - 1); ctx.lineTo(x - 5 * u, y - 5 * (1 - u) - 2); ctx.moveTo(x + 3 * u, y - 1); ctx.lineTo(x + 5 * u, y - 5 * (1 - u) - 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawTrack(t, v, X, blueFront) {
  ctx.fillStyle = '#0a0f17'; ctx.fillRect(v.x0, 70, v.x1 - v.x0, 52);
  ctx.fillStyle = 'rgba(130,155,190,0.10)';
  for (let k = Math.floor(v.x0 / 9); k <= v.x1 / 9; k++) ctx.fillRect(k * 9 + hash(k) * 7, 74 + hash(k * 1.9) * 42, 2.2, 1.6);
  ctx.fillStyle = '#05080c'; for (let x = Math.floor(v.x0 / 46) * 46; x < v.x1; x += 46) ctx.fillRect(x, 95, 22, 9);
  for (const [y, w, base] of [[91, 3, 0.2], [101, 4, 0.3]]) {
    ctx.fillStyle = rgba(60, 78, 104, 1); ctx.fillRect(v.x0, y, v.x1 - v.x0, w);
    for (let x = Math.floor(v.x0 / 40) * 40; x < v.x1; x += 40) {
      let L = lightAt(x, t) * 0.5 + base * 0.3;
      if (X < 4000 && x < X && x > X - 900) L += 1.2 * (1 - (X - x) / 900);
      ctx.fillStyle = rgba(190, 215, 250, Math.min(0.9, L * 0.6)); ctx.fillRect(x, y, 40.5, 1.3);
      if (blueFront !== null && x < blueFront) { ctx.fillStyle = rgba(70, 170, 255, 0.85 * clamp((blueFront - x) / 300 + 0.2)); ctx.fillRect(x, y - 0.5, 40.5, w); }
    }
  }
  // skarpa nad wodą
  ctx.fillStyle = '#04060a'; ctx.beginPath(); ctx.moveTo(v.x0, 140);
  for (let x = Math.floor(v.x0 / 18) * 18; x <= v.x1 + 18; x += 18) ctx.lineTo(x, 119 + 5 * noise1(x / 40));
  ctx.lineTo(v.x1 + 18, 140); ctx.fill();
}

// deszcz w przestrzeni ekranu, trzy plany głębi
function drawRain(t, layer) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const [n, len, sp, al, lw, par] = [[250, 30, 1500, 0.13, 1, 0.3], [150, 58, 2100, 0.17, 1.3, 0.7], [46, 120, 3000, 0.2, 2.2, 1.2]][layer];
  const zs = Math.sqrt(cam.z), L = len * zs, span = H + L + 80, wx = W * 1.4;
  ctx.strokeStyle = rgba(175, 200, 235, al); ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const y = mod(hash(i * 3.7 + layer * 50) * span + t * sp * (0.85 + 0.3 * hash(i * 1.3 + layer)), span) - L - 40;
    const x = mod(hash(i * 7.1 + layer * 20) * wx - cam.x * cam.z * par - y * 0.17, wx) - W * 0.2;
    ctx.moveTo(x, y); ctx.lineTo(x - L * 0.17, y + L);
  }
  ctx.stroke();
}

function drawWater(t, blue) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const ya = Math.round((WATER_Y - cam.y) * cam.z + H / 2 + cam.sy);
  if (ya >= H) return;
  const hh = H - ya, sh = 6;
  ctx.fillStyle = '#03050a'; ctx.fillRect(0, ya, W, hh);
  ctx.globalAlpha = 0.75;
  for (let i = 0; i * sh < hh; i++) {
    const sy = ya - (i + 1) * sh * 1.15; if (sy < 0) break;
    const dx = Math.sin(i * 0.42 + t * 2.6) * (1.5 + i * 0.09) + Math.sin(i * 0.13 - t * 1.7) * 3;
    ctx.drawImage(ctx.canvas, 0, sy, W, sh * 1.15, dx, ya + i * sh, W, sh);
  }
  ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0, ya, 0, H); g.addColorStop(0, 'rgba(3,6,12,0.12)'); g.addColorStop(0.5, 'rgba(3,6,12,0.38)'); g.addColorStop(1, 'rgba(2,4,8,0.85)');
  ctx.fillStyle = g; ctx.fillRect(0, ya, W, hh);
  ctx.fillStyle = 'rgba(150,185,230,0.22)'; ctx.fillRect(0, ya, W, 1.5);
  // kręgi po kroplach
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 70; i++) {
    const rate = 0.9 + hash(i * 2.3) * 0.9, cyc = t * rate + hash(i * 5.1), u = cyc - Math.floor(cyc), k = Math.floor(cyc);
    const d = hash(i * 1.1 + k * 7.7), y = ya + 8 + d * d * (hh - 10), x = mod(hash(i * 3.9 + k * 2.3) * W * 1.3 - cam.x * cam.z, W * 1.3) - W * 0.15;
    const sc = (0.5 + d * 1.6) * cam.z ** 0.5;
    ctx.strokeStyle = rgba(lerp(170, 90, blue), lerp(200, 190, blue), 240, (1 - u) * 0.34);
    ctx.beginPath(); ctx.ellipse(x, y, (3 + 26 * u) * sc, (1 + 6 * u) * sc, 0, 0, 7); ctx.stroke();
    if (u > 0.3) { ctx.beginPath(); ctx.ellipse(x, y, (3 + 26 * (u - 0.3)) * sc, (1 + 6 * (u - 0.3)) * sc, 0, 0, 7); ctx.stroke(); }
  }
}

function drawForeground(t) {
  const v = setLayer(1.5);
  ctx.fillStyle = '#010203'; ctx.beginPath(); ctx.moveTo(v.x0, 900);
  for (let x = Math.floor(v.x0 / 30) * 30; x <= v.x1 + 30; x += 30) ctx.lineTo(x, 455 - 22 * noise1(x / 110) - 40 * noise1(x / 600 + 3));
  ctx.lineTo(v.x1 + 30, 900); ctx.fill();
  ctx.strokeStyle = '#010203'; ctx.lineCap = 'round';
  for (let k = Math.floor(v.x0 / 13); k <= v.x1 / 13; k++) {
    if (noise1(k * 0.11) < 0.42) continue;
    const x = k * 13 + hash(k) * 9, hgt = 50 + hash(k * 2.7) * 130 * noise1(k * 0.11), sway = Math.sin(t * 1.7 + k * 0.4) * 9 + Math.sin(t * 3.1 + k) * 3 - 12;
    ctx.lineWidth = 1.6 + hash(k * 9) * 2.4;
    ctx.beginPath(); ctx.moveTo(x, 450); ctx.quadraticCurveTo(x + sway * 0.2, 450 - hgt * 0.6, x + sway, 450 - hgt); ctx.stroke();
  }
  // przekrzywiony słupek z drutem
  for (const [px, rot] of [[-330, -0.09], [470, 0.06]]) {
    ctx.save(); ctx.translate(px, 450); ctx.rotate(rot); ctx.fillStyle = '#010203'; ctx.fillRect(-9, -210, 18, 220); ctx.restore();
  }
  ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-310, 250); ctx.quadraticCurveTo(70, 300 + 4 * Math.sin(t * 2), 457, 248); ctx.stroke();
}

// ---- całe ujęcie boczne ----
function drawStation(t) {
  cam = camAt(t);
  const X = trainX(t), final = t >= T.cutEnd - 0.01;
  const blue = final ? pr(t, T.cutEnd, T.cutEnd + 1.1) * (0.88 + 0.12 * Math.sin(t * 5.3)) : 0;
  const blueFront = final ? lerp(-1500, 2200, sat(t, T.cutEnd - 0.1, T.cutEnd + 1.3)) : null;
  drawSky(t, (-300 - cam.y) * 0.3, cam.x * 0.05);
  if (blue > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); glow(-80, (-130 - cam.y) * 0.5 + H / 2 + 40, 1500, 40, 130, 255, 0.5 * blue, 1, 0.8); }
  drawFar(t);
  drawRain(t, 0);
  const v = setLayer(1);
  drawBuilding(t); drawPlatform(t, v); drawCanopy(t); drawBench();
  drawBoard(t, blue); drawClock(t, blue);
  const m = manAt(t);
  for (const l of LAMPS) if (l.x > v.x0 - 300 && l.x < v.x1 + 300) drawLampLight(l, t, blue);
  if (m.vis && m.layer === 'platform') {
    const L2 = lampI(LAMPS[2], t), L1 = lampI(LAMPS[1], t);
    ctx.fillStyle = rgba(0, 0, 0, 0.5); ctx.beginPath(); ctx.ellipse(m.x, m.y + 2, 34, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = rgba(0, 0, 0, 0.3 * L2); ctx.beginPath(); ctx.ellipse(m.x - 70, m.y + 3, 90, 4.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = rgba(0, 0, 0, 0.16 * L1); ctx.beginPath(); ctx.ellipse(m.x + 60, m.y + 3, 80, 4, 0, 0, 7); ctx.fill();
    if (m.looseCase) drawCase(m.looseCase.x, m.looseCase.b, m.looseCase.w, m.looseCase.h, 0.35);
    drawMan(m.pose, { x: m.x, y: m.y, s: m.s, rimDx: 1.3, rimA: 0.22 + 0.3 * L2 * clamp(1 - Math.abs(m.x - 300) / 900), hasCase: m.hasCase });
  }
  for (const l of LAMPS) if (l.x > v.x0 - 300 && l.x < v.x1 + 300) drawLampPost(l, t, blue);
  drawTrack(t, v, X, blueFront);
  if (X < v.x1 + 1200 && X + NCARS * (CAR_L + CAR_GAP) > v.x0) drawTrain(t, X, v, m);
  if (blue > 0) {                         // niska, błękitna mgła sunąca po peronie
    for (let i = 0; i < 16; i++) {
      const x = mod(hash(i * 3.1) * 2600 + t * (60 + 50 * hash(i)), 2600) - 1300;
      if (x < blueFront) glow(x, -30 + 100 * hash(i * 7.7), 260 + 120 * hash(i * 2.2), 50, 150, 255, 0.11 * blue, 1.6, 0.4);
    }
    glow(Math.min(blueFront, 900), 96, 520, 90, 190, 255, 0.4 * blue * (1 - sat(t, T.cutEnd + 1.2, T.cutEnd + 2.4) * 0.6), 1.4, 0.35);
  }
  drawWater(t, blue);
  drawRain(t, 1);
  if (m.vis && m.layer === 'front') { setLayer(1); drawMan(m.pose, { x: m.x, y: m.y, s: m.s, rimA: 0.25, rimDx: -1, sil: m.sil }); }
  drawForeground(t);
  drawRain(t, 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (blue > 0) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = rgba(40, 140, 255, 0.5 * blue); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
  const wipe = pr(t, T.turn1 + 0.52, T.turn1 + 0.74) * (1 - pr(t, T.exit1 - 0.08, T.exit1 + 0.14));
  if (wipe > 0) { ctx.fillStyle = rgba(0, 0, 0, wipe); ctx.fillRect(0, 0, W, H); }
  if (final) drawTitle(t);
}

function drawTitle(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const lines = ['A TY WSIADŁBYŚ', 'DO TEGO POCIĄGU?'];
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const a0 = pr(t, T.text0 - 0.2, T.text0 + 0.5);
  if (a0 > 0) { const g = ctx.createLinearGradient(0, 190, 0, 670); g.addColorStop(0, 'rgba(2,5,12,0)'); g.addColorStop(0.5, rgba(2, 5, 12, 0.5 * a0)); g.addColorStop(1, 'rgba(2,5,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, 190, W, 480); }
  lines.forEach((s, li) => {
    ctx.font = `${li ? 700 : 300} ${li ? 86 : 78}px ${FONT_UI}`;
    const sp = li ? 5 : 15, ws = [...s].map(ch => ctx.measureText(ch).width + sp), tot = ws.reduce((a, b) => a + b, 0) - sp;
    let x = W / 2 - tot / 2; const y = 365 + li * 118;
    [...s].forEach((ch, i) => {
      const a = pr(t, T.text0 + li * 0.38 + i * 0.03, T.text0 + li * 0.38 + i * 0.03 + 0.45);
      if (a > 0) {
        ctx.shadowColor = rgba(60, 160, 255, 0.9 * a); ctx.shadowBlur = 34 - 12 * a;
        ctx.fillStyle = rgba(232, 243, 255, a); ctx.fillText(ch, x + (ws[i] - sp) / 2, y + (1 - a) * 22);
      }
      x += ws[i];
    });
  });
  ctx.shadowBlur = 0;
  const lw = pr(t, T.text0 + 0.3, T.text0 + 1.2) * 300;
  ctx.fillStyle = 'rgba(120,195,255,0.75)'; ctx.fillRect(W / 2 - lw, 558, lw * 2, 2);
}
