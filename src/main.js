'use strict';
// ---------------------------------------------------------------
//  Montaż: która scena, przejścia, ziarno, winieta + odtwarzacz
// ---------------------------------------------------------------
const mainCanvas = document.getElementById('c');
mainCanvas.width = W; mainCanvas.height = H;
const mainCtx = mainCanvas.getContext('2d');
const bufCanvas = mk(W, H), bufCtx = bufCanvas.getContext('2d');

function scene(t) {
  if (t < T.trackIn) return drawStation;
  if (t < T.cutBack) return drawTrackShot;
  if (t < T.cutIn) return drawStation;
  if (t < T.cutEnd) return drawInterior;
  return drawStation;
}
// przenikania: [środek, połowa długości, scena A, scena B]
const DISSOLVES = [[T.trackIn + 0.15, 0.18, drawStation, drawTrackShot], [T.cutIn, 0.22, drawStation, drawInterior]];

function renderFrame(t) {
  t = clamp(t, 0, DUR - 1e-4);
  if (!TEX) buildTextures();
  ctx = mainCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const d = DISSOLVES.find(d => Math.abs(t - d[0]) < d[1]);
  if (d) {
    d[2](t);
    ctx = bufCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; d[3](t);
    ctx = mainCtx; ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = ease(sat(t, d[0] - d[1], d[0] + d[1])); ctx.drawImage(bufCanvas, 0, 0); ctx.globalAlpha = 1;
  } else scene(t)(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // rozbłyski na cięciach
  const f1 = (1 - pr(t, T.cutBack, T.cutBack + 0.4)) * (t >= T.cutBack && t < T.cutBack + 0.4);
  if (f1 > 0) { ctx.fillStyle = rgba(214, 232, 255, f1); ctx.fillRect(0, 0, W, H); }
  const f2 = (1 - pr(t, T.cutEnd, T.cutEnd + 0.55)) * (t >= T.cutEnd && t < T.cutEnd + 0.55);
  if (f2 > 0) { ctx.fillStyle = rgba(190, 228, 255, f2); ctx.fillRect(0, 0, W, H); }
  // winieta, ziarno, wejście i wyjście z czerni
  ctx.drawImage(TEX.vig, 0, 0, W, H);
  const fr = Math.floor(t * FPS);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.03;
  const gt = TEX.grain[fr % 4], ox = Math.floor(hash(fr) * 256), oy = Math.floor(hash(fr * 1.7) * 256);
  for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) ctx.drawImage(gt, x, y, 512, 512);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  const fade = (1 - pr(t, 0, 0.7)) + pr(t, DUR - 0.5, DUR - 0.03);
  if (fade > 0) { ctx.fillStyle = rgba(0, 0, 0, fade); ctx.fillRect(0, 0, W, H); }
}
window.renderFrame = renderFrame;
window.FILM = { W, H, FPS, DUR };

// ---- odtwarzacz na żywo (pomijany przy renderze: ?render) ----
if (!location.search.includes('render')) {
  const audio = document.getElementById('a'), hud = document.getElementById('hud');
  let playing = false, t0 = 0, tPause = 0;
  const now = () => playing ? (audio.readyState > 1 && !audio.paused ? audio.currentTime : (performance.now() - t0) / 1000) : tPause;
  function loop() {
    let t = now();
    if (t >= DUR) { playing = false; tPause = 0; audio.pause(); t = 0; hud.style.opacity = 1; }
    renderFrame(t);
    if (playing) requestAnimationFrame(loop);
  }
  function toggle() {
    if (playing) { tPause = now(); playing = false; audio.pause(); hud.style.opacity = 1; }
    else { playing = true; t0 = performance.now() - tPause * 1000; audio.currentTime = tPause; audio.play().catch(() => { }); hud.style.opacity = 0; loop(); }
  }
  document.addEventListener('click', toggle);
  document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); toggle(); } });
  const q = new URLSearchParams(location.search).get('t');
  tPause = q ? parseFloat(q) : 0;
  document.fonts.ready.then(() => renderFrame(tPause));
}
