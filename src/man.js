'use strict';
// ---------------------------------------------------------------
//  Postać: szkielet proceduralny (pozy = zbiory liczb, płynnie mieszane)
// ---------------------------------------------------------------
function ik(hx, hy, fx, fy, l1, l2, dir) {
  let dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy);
  d = Math.min(d, l1 + l2 - 0.5);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const b = Math.atan2(dy, dx) - a * dir;
  return [hx + l1 * Math.cos(b), hy + l1 * Math.sin(b)];
}
function lerpPose(a, b, u) { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k], u); return o; }

function poseWalk(p, dir, amp) {
  const S = 46 * amp, hipY = -110 + 3 * amp * Math.cos(4 * Math.PI * p);
  const foot = pp => {
    pp = mod(pp, 1);
    if (pp < 0.5) return [S * (1 - 4 * pp), 0];
    const q = (pp - 0.5) * 2; return [-S + 2 * S * ease(q), -Math.sin(Math.PI * q) * 15 * amp];
  };
  const [ax, ay] = foot(p), [bx, by] = foot(p + 0.5);
  const kA = ik(0, hipY, ax * dir, ay, 56, 58, dir), kB = ik(0, hipY, bx * dir, by, 56, 58, dir);
  const lean = 5 * dir * amp, shY = hipY - 75;
  const sw = 0.55 * amp * Math.sin(2 * Math.PI * p + Math.PI);
  const hLx = lean + Math.sin(sw) * 78 * dir, hLy = shY + Math.cos(sw) * 78;
  const cs = 0.06 * amp * Math.sin(2 * Math.PI * p);
  return {
    hipY, shY, shLx: lean - 3, shRx: lean + 3, hpLx: -3, hpRx: 3,
    kLx: kB[0], kLy: kB[1], fLx: bx * dir, fLy: by, kRx: kA[0], kRy: kA[1], fRx: ax * dir, fRy: ay,
    eLx: (lean + hLx) / 2 - 5 * dir, eLy: (shY + hLy) / 2, hLx, hLy,
    eRx: lean + 1 * dir, eRy: shY + 40, hRx: lean + 3 * dir + cs * 80, hRy: shY + 80,
    headX: lean + 4 * dir, headY: hipY - 96, hat: 0.04 * dir * amp, face: dir, toe: dir,
    hemL: -17 + 3 * Math.sin(2 * Math.PI * p) * amp, hemR: 17 + 3 * Math.sin(2 * Math.PI * p) * amp, hemY: hipY + 46,
    caseW: 54,
  };
}
function poseFront(p = 0, amp = 0) {
  const s = Math.sin(2 * Math.PI * p), lL = Math.max(0, s) * 11 * amp, lR = Math.max(0, -s) * 11 * amp;
  const hipY = -110 + 2 * amp * Math.cos(4 * Math.PI * p), sx = 3 * amp * s;
  return {
    hipY, shY: hipY - 75, shLx: -25 + sx, shRx: 25 + sx, hpLx: -11, hpRx: 11,
    kLx: -12, kLy: -56 - lL * 0.7, fLx: -13, fLy: -lL, kRx: 12, kRy: -56 - lR * 0.7, fRx: 13, fRy: -lR,
    eLx: -30 + sx, eLy: hipY - 35, hLx: -29 + sx, hLy: hipY + 6 - lR * 0.4,
    eRx: 30 + sx, eRy: hipY - 35, hRx: 29 + sx, hRy: hipY + 6,
    headX: sx, headY: hipY - 95, hat: 0, face: 0, toe: 0,
    hemL: -25, hemR: 25, hemY: hipY + 46, caseW: 20,
  };
}
function poseSit() {
  return {
    hipY: -64, shY: -138, shLx: -25, shRx: 25, hpLx: -12, hpRx: 12,
    kLx: -15, kLy: -57, fLx: -16, fLy: 0, kRx: 15, kRy: -57, fRx: 16, fRy: 0,
    eLx: -29, eLy: -100, hLx: -10, hLy: -70, eRx: 29, eRy: -100, hRx: 10, hRy: -70,
    headX: 0, headY: -158, hat: 0, face: 0, toe: 0,
    hemL: -28, hemR: 28, hemY: -48, caseW: 54,
  };
}
function poseReach(dir) {
  const p = poseWalk(0, dir, 0);
  const hipY = -105, kA = ik(0, hipY, 8 * dir, 0, 56, 58, dir), kB = ik(0, hipY, -10 * dir, 0, 56, 58, dir);
  Object.assign(p, {
    hipY, shY: -172, shLx: 22 * dir, shRx: 28 * dir, kRx: kA[0], kRy: kA[1], fRx: 8 * dir, kLx: kB[0], kLy: kB[1], fLx: -10 * dir,
    eRx: 40 * dir, eRy: -160, hRx: 60 * dir, hRy: -146, eLx: 20 * dir, eLy: -132, hLx: 30 * dir, hLy: -100,
    headX: 36 * dir, headY: -190, hat: 0.2 * dir, hemY: -60,
  });
  return p;
}

function drawCase(cx, bottom, w, h, lit = 0.35) {
  ctx.fillStyle = '#05070b';
  ctx.beginPath(); ctx.roundRect(cx - w / 2, bottom - h, w, h, Math.min(5, w / 4)); ctx.fill();
  ctx.strokeStyle = rgba(150, 180, 220, lit); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx - w / 2 + 3, bottom - h + 0.6); ctx.lineTo(cx + w / 2 - 3, bottom - h + 0.6); ctx.stroke();
  if (w > 30) {
    ctx.fillStyle = rgba(130, 150, 175, lit + 0.1);
    ctx.fillRect(cx - w * 0.3, bottom - h * 0.62, 4, 5); ctx.fillRect(cx + w * 0.3 - 4, bottom - h * 0.62, 4, 5);
  }
}

// o: {x, y, s, rimDx, rimA, sil(0..1), hasCase}
function drawMan(p, o) {
  const s = o.s || 1;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const body = (col, far) => {
    const limb = (pts, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); };
    const shoe = (x, y, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + p.toe * 6, y - 4, 9 + Math.abs(p.toe) * 4, 5.5, 0, 0, 7); ctx.fill(); };
    // dalsza noga i ręka
    limb([p.hpLx, p.hipY, p.kLx, p.kLy, p.fLx, p.fLy - 5], 15, far); shoe(p.fLx, p.fLy, far);
    limb([p.shLx, p.shY + 4, p.eLx, p.eLy, p.hLx, p.hLy], 11, far);
    // bliższa noga
    limb([p.hpRx, p.hipY, p.kRx, p.kRy, p.fRx, p.fRy - 5], 15, col); shoe(p.fRx, p.fRy, col);
    // płaszcz
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(p.shLx - 3, p.shY + 3); ctx.lineTo(p.shRx + 3, p.shY + 3);
    ctx.lineTo(p.hemR, p.hemY); ctx.lineTo(p.hemL, p.hemY); ctx.closePath(); ctx.fill(); ctx.stroke();
    // kołnierz
    ctx.beginPath(); ctx.moveTo((p.shLx + p.shRx) / 2 - 10, p.shY + 2); ctx.lineTo(p.headX - 8, p.headY + 6); ctx.lineTo(p.headX + 8, p.headY + 6); ctx.lineTo((p.shLx + p.shRx) / 2 + 10, p.shY + 2); ctx.closePath(); ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    // bliższa ręka
    limb([p.shRx, p.shY + 4, p.eRx, p.eRy, p.hRx, p.hRy], 11.5, col);
    // głowa i kapelusz
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.headX, p.headY, 14.5, 0, 7); ctx.fill();
  };
  const hat = col => {
    ctx.save(); ctx.translate(p.headX, p.headY); ctx.rotate(p.hat);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(p.face * 3, -8, 26, 4.6, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-15, -8); ctx.bezierCurveTo(-16, -30, -8, -31, 0, -28); ctx.bezierCurveTo(8, -31, 16, -30, 15, -8); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  const sil = o.sil || 0;
  if (o.rimA > 0.01 && sil < 1) {
    ctx.save(); ctx.translate(o.rimDx || 1.2, -0.9);
    const rc = rgba(140, 172, 215, o.rimA * (1 - sil)); body(rc, rc); hat(rc); ctx.restore();
  }
  const dark = lerp(7, 0, sil);
  body(rgba(dark * 0.8, dark, dark * 1.6, 1), rgba(dark * 0.5, dark * 0.7, dark * 1.1, 1));
  if (sil < 0.9) {                       // blady zarys twarzy pod rondem
    ctx.fillStyle = rgba(150, 170, 198, 0.5 * (1 - sil));
    ctx.beginPath(); ctx.ellipse(p.headX + p.face * 6.5, p.headY + 2.5, 7 - Math.abs(p.face) * 2, 7.5, 0, 0, 7); ctx.fill();
  }
  hat(rgba(dark * 0.7, dark * 0.9, dark * 1.5, 1));
  if (o.hasCase) {                       // walizka w ręce
    ctx.strokeStyle = '#05070b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.hRx, p.hRy + 7, 6, Math.PI, 0); ctx.stroke();
    drawCase(p.hRx, p.hRy + 50, p.caseW, 44, o.rimA || 0.2);
  }
  ctx.restore();
}

const walkProf = u => { const u0 = 0.72, v = 1 / (u0 + (1 - u0) / 2); return u < u0 ? v * u : v * u0 + v * (u - u0) - v * (u - u0) * (u - u0) / (2 * (1 - u0)); };
const WALK_D = 640, WALK_X0 = -600;

// Stan aktora w czasie t: gdzie jest, jaka poza, gdzie walizka
function manAt(t) {
  const m = { vis: false, x: 40, y: -14, s: 1, pose: null, layer: 'platform', sil: 0, hasCase: false, looseCase: null };
  if (t < T.walk0) return m;
  if (t >= T.place1 - 0.37) m.seatCase = true;
  if (t >= T.exit1) return m;
  m.vis = true; m.hasCase = true;
  if (t < T.walk1) {
    const d = WALK_D * walkProf(sat(t, T.walk0, T.walk1));
    m.x = WALK_X0 + d; m.pose = poseWalk(d / 184, 1, 1 - pr(t, T.walk1 - 0.35, T.walk1));
  } else if (t < T.look1) {
    const f = pr(t, T.walk1 + 0.02, T.walk1 + 0.4);
    m.pose = lerpPose(poseWalk(0, 1, 0), poseFront(), f);
    m.pose.face = lerp(1, 0, f) - 1.5 * bump(t, 5.36, 5.68) + 1.0 * bump(t, 5.64, 5.95);
  } else if (t < T.stand0) {
    const u = pr(t, T.look1, T.sit1);
    m.pose = lerpPose(poseFront(), poseSit(), u);
    const up = pr(t, 6.72, 7.05) * (1 - pr(t, 9.8, 10.2));
    const side = pr(t, 9.9, 10.3) * (1 - pr(t, 11.9, 12.3));
    m.pose.face = 0.75 * up + side; m.pose.hat = -0.24 * up; m.pose.headY -= 2 * up + 0.7 * Math.sin(t * 1.8);
    m.pose.shY -= 0.7 * Math.sin(t * 1.8);
    const cu = pr(t, T.look1, T.look1 + 0.4);
    m.hasCase = cu < 0.02;
    if (!m.hasCase) m.looseCase = { x: lerp(m.x + 29, m.x + 58, cu), b: lerp(m.y - 60, m.y + 2, cu), w: lerp(20, 54, cu), h: 44 };
  } else if (t < T.enter0) {
    const u = pr(t, T.stand0, T.stand1);
    m.pose = lerpPose(poseSit(), poseFront(), u);
    const cu = pr(t, T.stand0 + 0.1, T.stand1 - 0.1);
    m.hasCase = cu > 0.98;
    if (!m.hasCase) m.looseCase = { x: lerp(m.x + 58, m.x + 29, cu), b: lerp(m.y + 2, m.y - 60, cu), w: lerp(54, 20, cu), h: 44 };
  } else if (t < T.enter1) {
    const u = sat(t, T.enter0, T.enter1);
    m.pose = poseFront(u * 1.5, Math.sin(Math.PI * u) * 0.9 + 0.1);
    m.y = lerp(-14, -2, ease(u)); m.s = lerp(1, 1.05, u); if (u > 0.4) m.layer = 'train';
  } else if (t < T.seat1) {
    const u = sat(t, T.enter1, T.seat1), d = 145 * ease(u);
    m.x = 40 + d; m.y = -2; m.s = 1.05; m.layer = 'train';
    m.pose = lerpPose(poseFront(), poseWalk(d / 184 + 0.05, 1, clamp(Math.sin(Math.PI * u) * 1.7)), pr(t, T.enter1, T.enter1 + 0.22));
  } else if (t < T.place1) {
    const u = sat(t, T.seat1, T.place1);
    m.x = 185; m.y = -2; m.s = 1.05; m.layer = 'train';
    m.pose = lerpPose(poseWalk(0, 1, 0), poseReach(1), bump(u, 0, 1));
    m.hasCase = u < 0.47;
  } else if (t < T.back1) {
    const u = sat(t, T.place1, T.back1), d = 145 * ease(u);
    m.x = 185 - d; m.y = -2; m.s = 1.05; m.layer = 'train'; m.hasCase = false;
    const f = pr(t, T.place1, T.place1 + 0.2);
    m.pose = lerpPose(poseWalk(0, 1, 0), poseWalk(d / 184, -1, clamp(Math.sin(Math.PI * u) * 1.7)), f);
    m.pose.face = lerp(1, -1, f); m.pose.toe = lerp(1, -1, f);
  } else if (t < T.turn1) {
    m.x = 40; m.y = -2; m.s = 1.05; m.layer = 'train'; m.hasCase = false;
    m.pose = lerpPose(poseWalk(0, -1, 0), poseFront(), pr(t, T.back1, T.turn1));
  } else {
    const u = sat(t, T.turn1, T.exit1);
    m.s = 1.05 * Math.exp(3.1 * Math.pow(u, 1.5));
    m.x = 40 + (m.s - 1) * 16; m.y = -243 + 230 * m.s; m.layer = 'front'; m.hasCase = false;
    m.sil = pr(u, 0.05, 0.45); m.pose = poseFront(u * 2.2, 0.9);
  }
  return m;
}
// pozycja odstawionej walizki na siedzeniu (z krótkim „opadnięciem")
function seatCaseAt(t) {
  const u = pr(t, T.place1 - 0.37, T.place1 - 0.2);
  return { x: lerp(250, SEAT_CASE.x, u), b: lerp(-108, SEAT_CASE.y, u), w: 54, h: lerp(44, 30, u) };
}
