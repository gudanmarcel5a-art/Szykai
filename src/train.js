'use strict';
// ---------------------------------------------------------------
//  Pociąg w ujęciu bocznym: ściana daleka → wnętrze → postać →
//  ściana bliska z oknami → drzwi → wózki → światła
// ---------------------------------------------------------------
function drawTrain(t, X, v, m) {
  const o = doorOpen(t), Li = trainLight(t), sp = trainSpeed(t);
  const jerk = t > T.trainStop ? 5 * Math.exp(-(t - T.trainStop) * 5) * Math.sin((t - T.trainStop) * 16) : 0;
  const rock = Math.min(1, sp / 600) * 1.2 * Math.sin(t * 13);
  ctx.save(); ctx.translate(jerk, rock);
  const mix = (a, b) => Math.round(lerp(a, b, Li));
  for (let k = 0; k < NCARS; k++) {
    const bx = X + k * (CAR_L + CAR_GAP);
    if (bx > v.x1 + 1200 || bx + CAR_L < v.x0 - 60) continue;
    const wins = k === 0 ? WINDOWS0 : WINDOWSN;
    const i0 = k === 0 ? 132 : 8;
    // --- ściana daleka z otworami (widać przez nią peron) ---
    ctx.beginPath(); ctx.rect(bx + i0, -306, CAR_L - 8 - i0, 316);
    for (const w of wins) ctx.rect(bx + w - 68, -264, 136, 160);
    for (const d of DOORS) ctx.rect(bx + d - 58, -258, 116, 258);
    const wg = ctx.createLinearGradient(0, -306, 0, 10);
    wg.addColorStop(0, `rgb(${mix(22, 176)},${mix(31, 200)},${mix(42, 216)})`); wg.addColorStop(1, `rgb(${mix(16, 96)},${mix(23, 122)},${mix(32, 144)})`);
    ctx.fillStyle = wg; ctx.fill('evenodd');
    // dalekie skrzydła drzwi (z szybami)
    for (const d of DOORS) for (const sgn of [-1, 1]) {
      const lx = bx + d + (sgn < 0 ? -58 - 56 * o : 56 * o);
      ctx.beginPath(); ctx.rect(lx, -258, 58, 258); ctx.rect(lx + 10, -232, 38, 120);
      ctx.fillStyle = `rgb(${mix(18, 138)},${mix(26, 162)},${mix(36, 180)})`; ctx.fill('evenodd');
    }
    // sufit, podłoga, siedzenia, poręcze
    ctx.fillStyle = rgba(236, 246, 255, Li); ctx.fillRect(bx + i0 + 20, -301, CAR_L - 50 - i0, 5);
    ctx.fillStyle = `rgb(${mix(10, 40)},${mix(14, 54)},${mix(20, 68)})`; ctx.fillRect(bx + i0, -6, CAR_L - 8 - i0, 16);
    const seatC = `rgb(${mix(10, 26)},${mix(16, 44)},${mix(26, 70)})`, seatH = `rgb(${mix(13, 40)},${mix(20, 62)},${mix(32, 92)})`;
    for (const w of wins) for (const sgn of [-1, 1]) {
      const sx = bx + w + sgn * 66;
      ctx.fillStyle = seatC; ctx.beginPath(); ctx.roundRect(sx - 12, -196, 24, 196, 7); ctx.fill();
      ctx.beginPath(); ctx.roundRect(Math.min(sx, sx - sgn * 58), -98, 58, 20, 5); ctx.fill();
      ctx.fillStyle = seatH; ctx.beginPath(); ctx.roundRect(sx - 14, -200, 28, 34, 8); ctx.fill();
    }
    ctx.strokeStyle = rgba(200, 216, 230, 0.25 + 0.6 * Li); ctx.lineWidth = 3; ctx.lineCap = 'butt';
    for (const d of DOORS) { ctx.beginPath(); ctx.moveTo(bx + d - 72, -300); ctx.lineTo(bx + d - 72, -4); ctx.moveTo(bx + d + 72, -300); ctx.lineTo(bx + d + 72, -4); ctx.stroke(); }
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + i0 + 20, -276); ctx.lineTo(bx + CAR_L - 30, -276); ctx.stroke();
    // --- walizka i mężczyzna we wnętrzu (tylko pierwszy wagon) ---
    if (k === 0) {
      ctx.save(); ctx.translate(X - XSTOP, 0);
      if (m.seatCase) { const c = seatCaseAt(t); drawCase(c.x, c.b, c.w, c.h, 0.5 * Li); }
      if (m.vis && m.layer === 'train') drawMan(m.pose, { x: m.x, y: m.y, s: m.s, rimA: 0.12, rimDx: 0.8, hasCase: m.hasCase });
      ctx.restore();
    }
    // --- ściana bliska ---
    const body = new Path2D();
    if (k === 0) {
      body.moveTo(bx + 120, -335); body.bezierCurveTo(bx + 46, -335, bx + 8, -250, bx, -110); body.lineTo(bx, 28);
      body.quadraticCurveTo(bx, 38, bx + 10, 38); body.lineTo(bx + CAR_L, 38); body.lineTo(bx + CAR_L, -325); body.quadraticCurveTo(bx + CAR_L, -335, bx + CAR_L - 10, -335); body.closePath();
    } else body.roundRect(bx, -335, CAR_L, 373, 10);
    for (const w of wins) body.roundRect(bx + w - 75, -270, 150, 170, 14);
    for (const d of DOORS) body.rect(bx + d - 60, -262, 120, 262);
    const bg = ctx.createLinearGradient(0, -335, 0, 38);
    bg.addColorStop(0, '#0b1019'); bg.addColorStop(0.07, '#253449'); bg.addColorStop(0.55, '#1a2535'); bg.addColorStop(1, '#0e141e');
    ctx.fillStyle = bg; ctx.fill(body, 'evenodd');
    ctx.save(); ctx.clip(body, 'evenodd');
    ctx.fillStyle = '#0b1019'; ctx.fillRect(bx - 10, -335, CAR_L + 20, 22);
    ctx.fillStyle = 'rgba(170,205,240,0.5)'; ctx.fillRect(bx - 10, -84, CAR_L + 20, 5);
    ctx.fillStyle = 'rgba(60,110,170,0.5)'; ctx.fillRect(bx - 10, -72, CAR_L + 20, 14);
    ctx.fillStyle = 'rgba(150,185,230,0.25)'; ctx.fillRect(bx - 10, -313, CAR_L + 20, 1.5);
    // mokre smugi na blasze
    ctx.fillStyle = 'rgba(170,200,240,0.06)';
    for (let i = 0; i < 40; i++) ctx.fillRect(bx + hash(i * 3.3 + k) * CAR_L, -312 + hash(i * 1.7) * 60, 2, 60 + hash(i * 5.5) * 200);
    if (k === 0) {                        // kabina: ciemna szyba, nikogo w środku
      ctx.fillStyle = '#03050a'; ctx.beginPath(); ctx.moveTo(bx + 24, -205); ctx.bezierCurveTo(bx + 34, -262, bx + 56, -302, bx + 84, -305); ctx.lineTo(bx + 122, -305); ctx.lineTo(bx + 122, -205); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(160,195,240,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 44, -245); ctx.lineTo(bx + 74, -298); ctx.stroke();
    }
    ctx.restore();
    // szyby okien
    for (const w of wins) {
      ctx.fillStyle = 'rgba(130,180,235,0.07)'; ctx.beginPath(); ctx.roundRect(bx + w - 75, -270, 150, 170, 14); ctx.fill();
      ctx.strokeStyle = '#080c13'; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = 'rgba(210,230,255,0.07)'; poly([bx + w - 50, -268, bx + w - 14, -268, bx + w - 62, -102, bx + w - 74, -102]); ctx.fill();
    }
    // bliskie drzwi przesuwne
    for (const d of DOORS) {
      for (const sgn of [-1, 1]) {
        const lx = bx + d + (sgn < 0 ? -60 - 58 * o : 58 * o);
        ctx.beginPath(); ctx.rect(lx, -262, 60, 262); ctx.roundRect(lx + 11, -236, 38, 124, 6);
        ctx.fillStyle = '#1d2a3c'; ctx.fill('evenodd');
        ctx.fillStyle = 'rgba(130,180,235,0.08)'; ctx.fillRect(lx + 11, -236, 38, 124);
        ctx.fillStyle = '#05080d'; ctx.fillRect(sgn < 0 ? lx + 57 : lx, -262, 3, 262);
        ctx.fillStyle = 'rgba(170,205,240,0.35)'; ctx.fillRect(lx, -84, 60, 5);
      }
      ctx.strokeStyle = '#070b12'; ctx.lineWidth = 4; ctx.strokeRect(bx + d - 61, -263, 122, 264);
      const blink = (o > 0.02 && o < 0.98) ? (Math.sin(t * 38) > 0 ? 1 : 0.15) : (o > 0.5 ? 0.9 : 0.12);
      ctx.fillStyle = rgba(160, 230, 255, blink); ctx.fillRect(bx + d - 12, -276, 24, 5);
      glow(bx + d, -274, 40, 120, 210, 255, 0.5 * blink);
    }
    // podwozie
    ctx.fillStyle = '#06090e'; ctx.fillRect(bx + 16, 38, CAR_L - 32, 14);
    ctx.fillRect(bx + 330, 50, 150, 26); ctx.fillRect(bx + 520, 50, 110, 22);
    if (k < NCARS - 1) { ctx.fillStyle = '#05070b'; ctx.fillRect(bx + CAR_L, -318, CAR_GAP, 352); ctx.fillStyle = 'rgba(120,150,190,0.12)'; for (let i = 0; i < 4; i++) ctx.fillRect(bx + CAR_L + 3 + i * 6, -318, 1.5, 352); }
    for (const b of [165, 815]) {
      ctx.fillStyle = '#080b11'; ctx.fillRect(bx + b - 66, 58, 132, 13);
      for (const wx of [-40, 40]) {
        const cx = bx + b + wx, cy = 79, ang = (X + jerk) / 22;
        ctx.fillStyle = '#0a0e15'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 7); ctx.fill();
        ctx.strokeStyle = '#34445a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 20.5, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#1b2532'; ctx.lineWidth = 3; ctx.beginPath();
        for (let s = 0; s < 3; s++) { const a = ang + s * Math.PI / 3; ctx.moveTo(cx - Math.cos(a) * 17, cy - Math.sin(a) * 17); ctx.lineTo(cx + Math.cos(a) * 17, cy + Math.sin(a) * 17); }
        ctx.stroke();
        ctx.fillStyle = '#34445a'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.fill();
        // iskry przy hamowaniu
        const br = (t > 10.9 && t < T.trainStop) ? Math.min(1, sp / 250) : 0;
        if (br > 0.05) {
          ctx.strokeStyle = rgba(220, 235, 255, 0.9 * br); ctx.lineWidth = 1.4; ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            const life = mod(t * 7 + hash(s * 3.1 + wx + b + k * 9), 1), a = -0.1 - hash(s + Math.floor(t * 7 + hash(s * 3.1 + wx + b + k * 9)) * 1.7) * 0.7;
            const d0 = life * 60 * br, px = cx + 8 + Math.cos(a) * d0, py = 100 + Math.sin(a) * d0 + life * life * 26;
            ctx.moveTo(px, py); ctx.lineTo(px + 8 * (1 - life), py - 3 * (1 - life));
          }
          ctx.stroke(); glow(cx + 6, 100, 30, 180, 215, 255, 0.5 * br * hash(Math.floor(t * 30) + wx));
        }
      }
    }
    // światło z okien i drzwi padające na tory
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const spill = (cx, hw, a) => { const g = ctx.createLinearGradient(0, 38, 0, 128); g.addColorStop(0, rgba(150, 195, 235, a * Li)); g.addColorStop(1, rgba(150, 195, 235, 0)); ctx.fillStyle = g; poly([cx - hw, 38, cx + hw, 38, cx + hw + 26, 128, cx - hw - 26, 128]); ctx.fill(); };
    for (const w of wins) spill(bx + w, 70, 0.13);
    for (const d of DOORS) if (o > 0.02) spill(bx + d, 58 * o, 0.3);
    ctx.restore();
    for (const w of wins) glow(bx + w, -185, 170, 120, 170, 220, 0.07 * Li);
  }
  // --- reflektory czołowe ---
  const hx = X + 4, hy = -62, on = 0.9 + 0.1 * noise1(t * 14);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  let g = ctx.createLinearGradient(hx, 0, hx - 1150, 0); g.addColorStop(0, rgba(170, 205, 255, 0.34 * on)); g.addColorStop(0.5, rgba(150, 190, 250, 0.1 * on)); g.addColorStop(1, 'rgba(150,190,250,0)');
  ctx.fillStyle = g; poly([hx, hy - 12, hx - 1150, hy - 210, hx - 1150, hy + 150, hx, hy + 12]); ctx.fill();
  g = ctx.createLinearGradient(hx, 0, hx - 700, 0); g.addColorStop(0, rgba(210, 230, 255, 0.4 * on)); g.addColorStop(1, 'rgba(200,225,255,0)');
  ctx.fillStyle = g; poly([hx, hy - 8, hx - 700, hy - 60, hx - 700, hy + 80, hx, hy + 8]); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = rgba(215, 232, 255, 0.6 * on); ctx.lineWidth = 1.4; ctx.beginPath();   // deszcz w snopie reflektora
  for (let i = 0; i < 70; i++) {
    const d = 30 + hash(i * 2.9) * 820, hw = 12 + d * 0.16, y = hy - hw + mod(hash(i * 6.1) * 2 * hw + t * 700, 2 * hw + 30), x = hx - d;
    ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 16 * (1 - d / 1000));
  }
  ctx.stroke();
  glow(hx, hy, 150, 200, 225, 255, 0.85 * on); glow(hx, hy, 46, 255, 255, 255, 0.95 * on); glow(hx, hy, 380, 150, 190, 255, 0.2 * on, 1.7, 0.5);
  glow(X + 62, -322, 60, 200, 225, 255, 0.7 * on); glow(hx - 280, 104, 330, 150, 190, 240, 0.2 * on, 1, 0.16);
  // obłoki pary po zatrzymaniu
  const st = t - T.trainStop;
  if (st > 0 && st < 1.6) for (let i = 0; i < 7; i++) glow(X + 120 + i * 130 - st * 30 * (i % 2 ? 1 : -1), 70 - st * 40, 60 + st * 90, 130, 160, 200, 0.16 * (1 - st / 1.6), 1.4, 0.8);
  ctx.restore();
}
