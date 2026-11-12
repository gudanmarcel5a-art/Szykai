'use strict';
// ---------------------------------------------------------------
//  Ujęcie w głąb torów (światła na horyzoncie) i wnętrze wagonu
// ---------------------------------------------------------------
function drawTrackShot(t) {
  const tau = t - T.trackIn, F = 900, Hc = 1.3;
  const a = lerp(1.2, 84, Math.pow(sat(tau, 0.2, 1.75), 2.3)), Zt = F / a;
  const I = pr(tau, 0.2, 0.6) * clamp(Math.pow(a / 40, 0.5), 0.25, 1.4);
  const fr = Math.floor(t * 30), camZ = 0.5 * tau;
  const shk = 1.2 + 5 * I * sat(tau, 0.8, 1.7);
  const VX = 540 + shk * (noise1(t * 17) - 0.5) * 2 + 4 * Math.sin(t * 0.8), VY = 900 + shk * (noise1(t * 21 + 5) - 0.5) * 2;
  const P = (X, Yh, Z) => [VX + X * F / Z, VY + (Hc - Yh) * F / Z];
  const quad = (p1, p2, p3, p4) => { ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.closePath(); ctx.fill(); };
  cam = { x: 0, y: -300, z: 1, sx: 0, sy: 0 };
  drawSky(t, 120, 300);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // łuna nad horyzontem
  glow(VX, VY, 700, 70, 115, 180, 0.2 + 0.3 * I, 1.3, 0.6);
  ctx.fillStyle = '#05080e'; ctx.fillRect(0, VY, W, H - VY);
  // ściany lasu po obu stronach
  for (const [X0, seed] of [[-15, 3], [8, 8]]) {
    ctx.fillStyle = '#04070d'; ctx.beginPath(); let p = P(X0, 0, 1.2); ctx.moveTo(p[0], p[1]);
    for (let Z = 1.2; Z < 500; Z *= 1.07) { p = P(X0, 6 + 5 * noise1(Z * 0.35 + seed) + 1.5 * hash(Math.floor(Z * 3)), Z); ctx.lineTo(p[0], p[1]); }
    ctx.lineTo(VX, VY); ctx.fill();
  }
  // słupy telegraficzne z prawej
  ctx.strokeStyle = '#03050a';
  for (let j = 6; j >= 0; j--) {
    const Z = 9 + 17 * j - camZ, b = P(4.6, 0, Z), tp = P(4.6, 6.6, Z), c1 = P(3.7, 6.1, Z), c2 = P(5.5, 6.1, Z);
    ctx.lineWidth = Math.max(1.2, 0.2 * F / Z); ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(tp[0], tp[1]); ctx.moveTo(c1[0], c1[1]); ctx.lineTo(c2[0], c2[1]); ctx.stroke();
    ctx.lineWidth = Math.max(0.6, 0.02 * F / Z);
    for (const xx of [3.7, 5.5]) { const q1 = P(xx, 6.1, Z), q2 = P(xx, 6.1, Z + 17), qm = P(xx, 5.5, Z + 7); ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.quadraticCurveTo(qm[0], qm[1], q2[0], q2[1]); ctx.stroke(); }
  }
  // podsypka, podkłady, szyny
  ctx.fillStyle = '#0b1019'; quad(P(-1.9, 0, 0.8), P(-1.9, 0, 600), P(2.1, 0, 600), P(2.1, 0, 0.8));
  for (let k = 110; k >= 0; k--) {
    const Z = 0.75 + k * 0.62 - mod(camZ, 0.62); if (Z < 0.7) continue;
    const lit = I * clamp(1 - Math.abs(Z - Zt) / (Zt + 20)) * 0.5;
    ctx.fillStyle = rgba(8 + 60 * lit, 11 + 80 * lit, 17 + 110 * lit, 1); quad(P(-1.3, 0.05, Z), P(1.3, 0.05, Z), P(1.3, 0.05, Z + 0.27), P(-1.3, 0.05, Z + 0.27));
  }
  for (const rx of [-0.72, 0.72]) {
    const g = ctx.createLinearGradient(0, VY, 0, H);
    g.addColorStop(0, rgba(215, 232, 255, clamp(0.15 + 1.0 * I))); g.addColorStop(0.25, rgba(150, 185, 235, clamp(0.25 + 0.6 * I))); g.addColorStop(1, rgba(70, 92, 125, 0.6 + 0.3 * I));
    ctx.fillStyle = g; quad(P(rx - 0.045, 0.16, 0.7), P(rx - 0.045, 0.16, 800), P(rx + 0.045, 0.16, 800), P(rx + 0.045, 0.16, 0.7));
  }
  // światło sunące po mokrych torach
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gg = ctx.createLinearGradient(0, VY, 0, H); gg.addColorStop(0, rgba(150, 195, 255, 0.4 * I)); gg.addColorStop(1, 'rgba(150,195,255,0)');
  ctx.fillStyle = gg; quad(P(-0.72, 0.1, Math.max(Zt, 1)), P(0.72, 0.1, Math.max(Zt, 1)), P(0.72, 0.1, 0.8), P(-0.72, 0.1, 0.8));
  ctx.restore();
  // peron z lewej
  const pg = ctx.createLinearGradient(0, VY, 0, H); pg.addColorStop(0, '#16202f'); pg.addColorStop(1, '#0c121c');
  ctx.fillStyle = pg; quad(P(-1.8, 0.95, 0.5), P(-1.8, 0.95, 600), P(-12, 0.95, 600), P(-12, 0.95, 0.5));
  ctx.fillStyle = '#070b12'; quad(P(-1.8, 0, 0.8), P(-1.8, 0, 600), P(-1.8, 0.95, 600), P(-1.8, 0.95, 0.5));
  ctx.strokeStyle = rgba(175, 205, 240, clamp(0.3 + 0.6 * I)); ctx.lineWidth = 2.5; let e1 = P(-1.8, 0.95, 0.5), e2 = P(-1.8, 0.95, 600);
  ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke();
  // budynek z wiatą i zegarem
  ctx.fillStyle = '#060a11'; quad(P(-12, 0.95, 13 - camZ), P(-4.6, 0.95, 13 - camZ), P(-4.6, 6, 13 - camZ), P(-12, 6, 13 - camZ));
  ctx.fillStyle = '#0a101a'; quad(P(-4.6, 0.95, 13 - camZ), P(-4.6, 0.95, 60), P(-4.6, 6, 60), P(-4.6, 6, 13 - camZ));
  ctx.fillStyle = '#05080e'; quad(P(-12, 4.3, 9 - camZ), P(-2.2, 4.3, 9 - camZ), P(-2.2, 4.3, 64), P(-12, 4.3, 64));
  ctx.fillStyle = '#080c14'; quad(P(-12, 4.3, 9 - camZ), P(-2.2, 4.3, 9 - camZ), P(-2.2, 4.55, 9 - camZ), P(-12, 4.55, 9 - camZ));
  const ck = P(-2.6, 3.5, 20 - camZ); glow(ck[0], ck[1], 60, 170, 200, 240, 0.5);
  ctx.fillStyle = 'rgba(215,230,246,0.9)'; ctx.beginPath(); ctx.arc(ck[0], ck[1], 0.34 * F / (20 - camZ), 0, 7); ctx.fill();
  // latarnie peronowe
  for (let j = 6; j >= 0; j--) {
    const Z = 6.5 + 16 * j - camZ, b = P(-2.5, 0.95, Z), tp = P(-2.5, 5.4, Z), hd = P(-2.1, 5.3, Z), s = F / Z;
    let Lj = 0.85 + 0.15 * noise1(t * 9 + j * 5); if (j === 1 && hash(fr * 0.7) < 0.4) Lj *= 0.2; if (j === 0) Lj *= 1 - 0.9 * sat(tau, 1.0, 1.3) * (hash(fr) < 0.7 ? 1 : 0.3);
    ctx.strokeStyle = '#04060b'; ctx.lineWidth = Math.max(1.2, 0.11 * s); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(tp[0], tp[1]); ctx.lineTo(hd[0], hd[1]); ctx.stroke();
    glow(hd[0], hd[1], Math.max(14, 1.7 * s), 185, 212, 250, 0.6 * Lj); glow(hd[0], hd[1], Math.max(4, 0.25 * s), 255, 255, 255, 0.9 * Lj);
    const r1 = P(-2.4, 0.95, Z); glow(r1[0], r1[1] + 0.2 * s, Math.max(10, 2.6 * s), 150, 185, 230, 0.2 * Lj, 1, 0.22);
  }
  // --- pociąg: najpierw tylko światła, potem sylwetka ---
  if (tau > 0.18) {
    if (a > 5) {
      const p1 = P(-1.45, 0.3, Zt), p2 = P(1.45, 4.2, Zt), rw = p2[0] - p1[0], rh = p1[1] - p2[1];
      ctx.fillStyle = '#020306'; ctx.beginPath(); ctx.roundRect(p1[0], p2[1], rw, rh, [rw * 0.22, rw * 0.22, 4, 4]); ctx.fill();
      ctx.fillStyle = 'rgba(18,28,44,1)'; ctx.beginPath(); ctx.roundRect(p1[0] + rw * 0.13, p2[1] + rh * 0.13, rw * 0.74, rh * 0.3, rw * 0.08); ctx.fill();
    }
    const fl = 0.92 + 0.08 * hash(fr * 1.3);
    for (const [lx, ly, k] of [[-0.8, 1.3, 1], [0.8, 1.3, 1], [0, 3.9, 0.5]]) {
      const p = P(lx, ly, Zt), halo = (18 + a * 2.7) * k * (0.6 + 0.6 * I);
      glow(p[0], p[1], halo * 3.2, 120, 170, 255, 0.34 * I * fl); glow(p[0], p[1], halo, 205, 228, 255, 0.95 * I * fl);
      glow(p[0], p[1], halo * 5, 170, 205, 255, 0.5 * I * fl * k, 1, 0.045);
      glow(p[0], p[1], Math.max(2.2, a * 0.2 * k), 255, 255, 255, pr(tau, 0.2, 0.45));
      // odbicie w mokrych szynach
      glow(p[0], p[1] + halo * 1.6 + a * 1.2, halo * 2.4, 150, 195, 255, 0.3 * I * k, 0.3, 2.6);
    }
    // krople deszczu rozświetlone reflektorami
    const c = P(0, 1.6, Zt), R = 160 + a * 9;
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.strokeStyle = rgba(220, 235, 255, 0.5 * I);
    for (let i = 0; i < 120; i++) {
      const ang = hash(i * 1.9) * 6.283, rr = Math.sqrt(hash(i * 4.3)) * R, x = c[0] + Math.cos(ang) * rr * 1.2, y0 = c[1] + Math.sin(ang) * rr;
      const y = y0 + mod(t * 900 + hash(i * 8.1) * 200, 200) - 100, L = 10 + 14 * (1 - rr / R);
      ctx.moveTo(x, y); ctx.lineTo(x - 2, y + L);
    }
    ctx.stroke();
  }
  drawRain(t, 0); drawRain(t, 1); drawRain(t, 2);
  const wo = pr(tau, 1.42, 1.7);
  if (wo > 0) { ctx.fillStyle = rgba(214, 232, 255, wo); ctx.fillRect(0, 0, W, H); }
}

// ---------------- wnętrze wagonu: walizka ----------------
function drawInterior(t) {
  const fr = Math.floor(t * 30);
  const push = pr(t, T.cutIn - 0.3, T.open0 + 0.2), z = lerp(1.0, 1.5, push) + 0.1 * pr(t, T.open0, T.cutEnd);
  const fx = 540 + 6 * Math.sin(t * 0.9), fy = lerp(985, 1330, push);
  const clack = mod(t, 0.46), jolt = 4 * Math.exp(-clack * 14) * Math.sin(clack * 60) + 2.5 * Math.exp(-mod(t - 0.13, 0.46) * 14) * Math.sin(mod(t - 0.13, 0.46) * 60);
  const rot = 0.006 * Math.sin(t * 2.1) + 0.003 * Math.sin(t * 5.3);
  const shakeU = sat(t, T.shake0, T.open0), opening = sat(t, T.open0, T.open1);
  const B = pr(t, T.open0, T.open1) * (0.9 + 0.1 * Math.sin(t * 31)) + 0.35 * pr(t, T.open1, T.cutEnd);  // moc niebieskiego światła
  let Lt = 0.9 + 0.1 * noise1(t * 12);                        // jarzeniówka
  if (shakeU > 0 && hash(fr * 0.77) < 0.25 + 0.5 * shakeU) Lt *= 0.4 + 0.3 * hash(fr);
  Lt *= 1 - pr(t, T.open0 - 0.1, T.open0 + 0.05);
  const seam = Math.pow(shakeU, 1.6) * (0.55 + 0.45 * hash(fr * 1.9)) * (1 - opening);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#04070c'; ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2, H / 2 + jolt); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-fx, -fy);
  const M = ctx.getTransform();
  // ściana i sufit
  const wg = ctx.createLinearGradient(0, 0, 0, 1600); wg.addColorStop(0, rgba(lerp(8, 30, Lt), lerp(12, 44, Lt), lerp(18, 62, Lt), 1)); wg.addColorStop(1, rgba(lerp(6, 16, Lt), lerp(9, 25, Lt), lerp(14, 38, Lt), 1));
  ctx.fillStyle = wg; ctx.fillRect(-200, -200, 1480, 2300);
  ctx.fillStyle = rgba(5, 8, 13, 1); ctx.fillRect(-200, -200, 1480, 430);
  ctx.fillStyle = rgba(225, 240, 255, Lt); ctx.beginPath(); ctx.roundRect(120, 160, 840, 16, 8); ctx.fill();
  glow(540, 168, 560, 150, 195, 240, 0.4 * Lt, 1.6, 0.5);
  // --- okno i uciekający nocny krajobraz ---
  ctx.save(); ctx.beginPath(); ctx.roundRect(150, 380, 780, 580, 46); ctx.clip();
  const og = ctx.createLinearGradient(0, 380, 0, 960); og.addColorStop(0, '#040812'); og.addColorStop(0.7, '#0d192c'); og.addColorStop(1, '#070d18');
  ctx.fillStyle = og; ctx.fillRect(150, 380, 780, 580);
  ctx.fillStyle = '#081120'; ctx.beginPath(); ctx.moveTo(150, 960);
  for (let x = 150; x <= 940; x += 20) ctx.lineTo(x, 760 - 90 * noise1((x + t * 70) / 260));
  ctx.lineTo(940, 960); ctx.fill();
  ctx.fillStyle = '#04080f'; ctx.beginPath(); ctx.moveTo(150, 960);
  for (let x = 150; x <= 940; x += 12) ctx.lineTo(x, 830 - 110 * noise1((x + t * 1300) / 190) - 20 * noise1((x + t * 1300) / 40));
  ctx.lineTo(940, 960); ctx.fill();
  // słupy i latarnie przemykające za szybą
  const pp = mod(t - 0.2, 0.62) / 0.62, px = 1000 - pp * 1500;
  ctx.fillStyle = 'rgba(2,4,8,0.75)'; ctx.fillRect(px, 380, 46, 580);
  const lp = (t - 19.05) / 1.25, lu = lp - Math.floor(lp), lx = 1250 - lu * 3600;
  if (lu < 0.5) { glow(lx, 470, 300, 190, 220, 255, 0.85, 1.6, 0.11); glow(lx, 470, 130, 230, 240, 255, 0.8, 1.5, 0.3); }
  // krople pędzące po szybie
  ctx.lineCap = 'round'; ctx.lineWidth = 2.2;
  for (let i = 0; i < 70; i++) {
    const s = 420 + 500 * hash(i * 1.7), d = mod(hash(i * 4.9) * 1000 + t * s, 1000), y0 = 380 + hash(i * 2.3) * 520;
    const x = 960 - d, y = y0 + d * 0.22 + 6 * Math.sin(d * 0.05 + i), L = 16 + 46 * hash(i * 7.7);
    ctx.strokeStyle = rgba(170, 205, 245, 0.16 + 0.22 * hash(i * 3.3)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L, y - L * 0.22); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(180,210,245,0.3)'; for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.arc(160 + hash(i * 9.1) * 760, 390 + hash(i * 5.7) * 560 + Math.sin(t * 20 + i) * 0.6, 1.5 + 2 * hash(i), 0, 7); ctx.fill(); }
  ctx.fillStyle = rgba(190, 220, 250, 0.05 * Lt); poly([230, 380, 430, 380, 300, 960, 150, 960]); ctx.fill();
  if (B > 0) { ctx.fillStyle = rgba(60, 150, 255, 0.25 * B); ctx.fillRect(150, 380, 780, 580); }
  ctx.restore();
  ctx.strokeStyle = '#04070b'; ctx.lineWidth = 26; ctx.beginPath(); ctx.roundRect(150, 380, 780, 580, 46); ctx.stroke();
  ctx.strokeStyle = rgba(150, 185, 230, 0.12 + 0.2 * Lt); ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(137, 367, 806, 606, 56); ctx.stroke();
  // półka na bagaż
  ctx.strokeStyle = rgba(150, 175, 205, 0.25 + 0.5 * Lt); ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (const y of [296, 318, 340]) { ctx.beginPath(); ctx.moveTo(90, y); ctx.lineTo(990, y); ctx.stroke(); }
  ctx.lineWidth = 8; for (const x of [130, 540, 950]) { ctx.beginPath(); ctx.moveTo(x, 290); ctx.lineTo(x, 352); ctx.stroke(); }
  // --- siedzenie ---
  const sc = k => rgba(lerp(9, 26, Lt) * k, lerp(15, 46, Lt) * k, lerp(26, 80, Lt) * k, 1);
  for (const sx of [130, 545]) {
    const g = ctx.createLinearGradient(0, 880, 0, 1400); g.addColorStop(0, sc(1.15)); g.addColorStop(1, sc(0.75));
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(sx, 880, 405, 540, [60, 60, 10, 10]); ctx.fill();
    ctx.fillStyle = sc(1.5); ctx.beginPath(); ctx.roundRect(sx + 70, 898, 265, 120, 34); ctx.fill();
    ctx.strokeStyle = rgba(170, 200, 240, 0.08 + 0.12 * Lt); ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(sx + 8, 888, 389, 520, [54, 54, 8, 8]); ctx.stroke();
  }
  ctx.fillStyle = rgba(160, 190, 235, 0.07 * Lt + 0.01);
  for (let i = 0; i < 150; i++) { const x = 150 + hash(i * 2.1) * 780, y = 1040 + hash(i * 6.3) * 330; ctx.fillRect(x, y, 12, 2.5); }
  const cg = ctx.createLinearGradient(0, 1390, 0, 1475); cg.addColorStop(0, sc(1.5)); cg.addColorStop(1, sc(1.05));
  ctx.fillStyle = cg; ctx.beginPath(); ctx.roundRect(115, 1390, 850, 90, 16); ctx.fill();
  ctx.fillStyle = sc(0.6); ctx.beginPath(); ctx.roundRect(115, 1470, 850, 110, [0, 0, 18, 18]); ctx.fill();
  ctx.fillStyle = '#03050a'; ctx.fillRect(-200, 1580, 1480, 600);
  ctx.fillStyle = sc(0.4); ctx.fillRect(170, 1580, 26, 200); ctx.fillRect(884, 1580, 26, 200);
  // --- walizka ---
  const ys = 1375, amp = shakeU > 0 ? (0.6 + 7 * shakeU * shakeU) * (1 - pr(t, T.open0, T.open0 + 0.25)) : 0;
  const jx = amp * (hash(fr * 3.1) - 0.5) * 2, jy = amp * (hash(fr * 5.7) - 0.5) * 1.3 - amp * 0.4 * Math.abs(Math.sin(t * 40)), jr = amp * 0.004 * (hash(fr * 7.3) - 0.5) * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.ellipse(540, 1462, 200, 14, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(540 + jx, 1458 + jy); ctx.rotate(jr); ctx.translate(-540, -1458);
  const th = 2.0 * (0.07 * pr(t, T.open0 - 0.05, T.open0 + 0.05) + 0.93 * (1 - Math.pow(1 - sat(t, T.open0 + 0.1, T.open1), 2.4)) * (1 + 0.04 * Math.sin(opening * 9)));
  const hingeY = ys - 60, kk = 60 / 170;
  const lidPt = (zz, yy) => { const z2 = zz * Math.cos(th) - yy * Math.sin(th), y2 = zz * Math.sin(th) + yy * Math.cos(th); return { y: hingeY + kk * z2 - y2, hw: 152 + 13 * clamp(z2 / 170, -0.4, 1) }; };
  const q4 = (a1, b1, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(540 - a1.hw, a1.y); ctx.lineTo(540 + a1.hw, a1.y); ctx.lineTo(540 + b1.hw, b1.y); ctx.lineTo(540 - b1.hw, b1.y); ctx.closePath(); ctx.fill(); };
  const sf = lidPt(170, 0), tf = lidPt(170, 36), tb = lidPt(0, 36), hg = lidPt(0, 0);
  // korpus
  const bgd = ctx.createLinearGradient(0, ys, 0, 1458); bgd.addColorStop(0, rgba(16 + 30 * B, 21 + 60 * B, 30 + 110 * B, 1)); bgd.addColorStop(1, '#04060a');
  ctx.fillStyle = bgd; ctx.beginPath(); ctx.roundRect(375, ys, 330, 83, [0, 0, 12, 12]); ctx.fill();
  ctx.strokeStyle = 'rgba(140,165,200,0.16)'; ctx.lineWidth = 1.5; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.roundRect(385, ys + 9, 310, 65, 8); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#2b3646'; for (const x of [375, 683]) { ctx.beginPath(); ctx.roundRect(x, 1432, 22, 26, 5); ctx.fill(); }
  ctx.strokeStyle = '#1a222e'; ctx.lineWidth = 9; ctx.beginPath(); ctx.roundRect(494, ys + 26, 92, 30, 12); ctx.stroke();
  ctx.strokeStyle = 'rgba(150,180,220,0.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(500, ys + 23); ctx.lineTo(580, ys + 23); ctx.stroke();
  // wnętrze: źródło światła
  if (th > 0.02) {
    const ig = ctx.createLinearGradient(0, hingeY, 0, ys); ig.addColorStop(0, rgba(90, 190, 255, 1)); ig.addColorStop(1, 'rgba(235,250,255,1)');
    ctx.fillStyle = ig; ctx.beginPath(); ctx.moveTo(375, ys); ctx.lineTo(705, ys); ctx.lineTo(692, hingeY); ctx.lineTo(388, hingeY); ctx.closePath(); ctx.fill();
  }
  // wieko
  if (sf.y < hg.y - 1) {                         // widać podświetlony spód wieka
    q4(tf, tb, '#06090e');
    const ug = ctx.createLinearGradient(0, sf.y, 0, hg.y); ug.addColorStop(0, rgba(30, 110, 230, 1)); ug.addColorStop(1, rgba(170, 225, 255, 1));
    q4(sf, hg, ug); q4(tf, sf, '#0a1626');
  } else { q4(tb, tf, rgba(14, 19, 28, 1)); q4(tf, sf, rgba(11, 15, 22, 1)); ctx.strokeStyle = 'rgba(150,180,220,0.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(540 - tf.hw, tf.y); ctx.lineTo(540 + tf.hw, tf.y); ctx.stroke(); }
  // zatrzaski
  for (const [lx, tl] of [[450, T.open0 - 0.1], [630, T.open0 - 0.02]]) {
    const un = t >= tl; ctx.fillStyle = '#8796ab';
    if (!un) { ctx.beginPath(); ctx.roundRect(lx - 15, ys - 14, 30, 30, 4); ctx.fill(); ctx.fillStyle = '#3d4a5c'; ctx.fillRect(lx - 9, ys - 2, 18, 4); }
    else { ctx.beginPath(); ctx.roundRect(lx - 15, ys + 4, 30, 14, 3); ctx.fill(); glow(lx, ys, 70, 200, 235, 255, Math.exp(-(t - tl) * 14)); }
  }
  // światło przeciekające przez szczelinę
  if (seam > 0.01) { glow(540, ys, 240, 80, 180, 255, 0.75 * seam, 1, 0.11); ctx.fillStyle = rgba(200, 240, 255, seam); ctx.fillRect(380, ys - 1.5, 320, 3); }
  ctx.restore();
  // jarzeniówka przygasa — przyciemnienie wnętrza
  ctx.fillStyle = rgba(1, 2, 5, 0.3 * (1 - Lt) * (1 - 0.7 * B)); ctx.fillRect(-200, -200, 1480, 2400);
  // przelot światła latarni po wnętrzu
  if (lu < 0.5) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(150,190,240,0.11)'; poly([lx - 170, 960, lx + 170, 960, lx - 60, 1800, lx - 500, 1800]); ctx.fill(); ctx.restore(); }
  // --- niebieska poświata z walizki ---
  if (B > 0.005) {
    const oy = ys - 30;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const bgm = ctx.createLinearGradient(0, oy, 0, oy - 1250); bgm.addColorStop(0, rgba(90, 180, 255, 0.6 * B)); bgm.addColorStop(1, 'rgba(60,140,255,0)');
    ctx.fillStyle = bgm; poly([390, oy, 690, oy, 1150, oy - 1250, -70, oy - 1250]); ctx.fill();
    for (let i = 0; i < 11; i++) {
      const ang = -Math.PI / 2 + (i - 5) * 0.17 + 0.07 * Math.sin(t * 2.3 + i * 1.7), wdt = 0.035 + 0.03 * hash(i * 3.3), len = 900 + 500 * hash(i * 1.3);
      const al = B * (0.1 + 0.16 * noise1(t * 6 + i * 9));
      const rg = ctx.createRadialGradient(540, oy, 30, 540, oy, len); rg.addColorStop(0, rgba(150, 215, 255, al)); rg.addColorStop(1, 'rgba(90,170,255,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(540 + (i - 5) * 26, oy); ctx.lineTo(540 + Math.cos(ang - wdt) * len, oy + Math.sin(ang - wdt) * len); ctx.lineTo(540 + Math.cos(ang + wdt) * len, oy + Math.sin(ang + wdt) * len); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    glow(540, oy, 900, 40, 130, 255, 0.55 * B); glow(540, oy, 360, 120, 205, 255, 0.85 * B, 1.3, 0.7); glow(540, oy, 150, 240, 250, 255, B, 1.6, 0.5);
    // unoszące się drobiny światła
    for (let i = 0; i < 60; i++) {
      const born = T.open0 + 0.15 + hash(i * 2.7) * 0.9, age = t - born; if (age < 0) continue;
      const u = mod(age * (0.5 + 0.5 * hash(i * 1.1)), 1), x = 540 + (hash(i * 5.9) - 0.5) * 280 + (hash(i * 8.3) - 0.5) * 520 * u + 18 * Math.sin(t * 3 + i), y = oy - u * (500 + 500 * hash(i * 3.7));
      glow(x, y, 7 + 9 * hash(i * 4.4), 190, 230, 255, 0.9 * (1 - u) * B);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (B > 0) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = rgba(40, 140, 255, 0.6 * B); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
  const wo = pr(t, T.cutEnd - 0.32, T.cutEnd - 0.02);
  if (wo > 0) { ctx.fillStyle = rgba(190, 228, 255, wo); ctx.fillRect(0, 0, W, H); }
}
