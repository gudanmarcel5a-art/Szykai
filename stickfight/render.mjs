// Render: Chromium (Playwright) → klatki JPEG → ffmpeg → MP4 (60 FPS, 1080x1920)
//   node render.mjs                 pełny film → out/stickfight.mp4
//   node render.mjs --still 1.8,7.5 pojedyncze PNG → out/stills/
//   node render.mjs --check         test trafień / kadrowania / skoków
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const ROOT = path.dirname(fileURLToPath(import.meta.url)), OUT = path.join(ROOT, 'out');
const URL_ = pathToFileURL(path.join(ROOT, 'index.html')).href + '?render';
const args = process.argv.slice(2), WORKERS = Number(process.env.WORKERS || 4);
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const open = async () => { const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => { console.error('BŁĄD:', e.message); process.exitCode = 1; }); await p.goto(URL_); return p; };
const grab = (p, t, type, q) => p.evaluate(([t, type, q]) => { window.renderFrame(t); return document.getElementById('c').toDataURL(type, q).split(',')[1]; }, [t, type, q]);
if (args.includes('--check')) { const p = await open(); console.log(JSON.stringify(await p.evaluate(() => window.CHECK()), null, 1)); await browser.close(); process.exit(); }
const si = args.indexOf('--still');
if (si >= 0) { const d = path.join(OUT, 'stills'); mkdirSync(d, { recursive: true }); const p = await open();
  for (const s of args[si + 1].split(',')) writeFileSync(path.join(d, `t${(+s).toFixed(2).padStart(5, '0')}.png`), Buffer.from(await grab(p, +s, 'image/png'), 'base64'));
  await browser.close(); process.exit(); }
const { FPS, DUR } = await (await open()).evaluate(() => window.FILM), N = Math.round(FPS * DUR), dir = path.join(OUT, 'frames');
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); let done = 0;
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => { const p = await open();
  for (let i = w; i < N; i += WORKERS) { writeFileSync(path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(await grab(p, i / FPS, 'image/jpeg', 0.95), 'base64'));
    if (++done % 200 === 0) console.log(`klatki ${done}/${N}`); } }));
await browser.close();
const mp4 = path.join(OUT, 'stickfight.mp4');
spawn('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { stdio: 'inherit' })
  .on('exit', c => { if (!c) rmSync(dir, { recursive: true, force: true }); console.log(c ? 'ffmpeg: błąd' : `GOTOWE (${DUR.toFixed(1)} s) → ${mp4}`); process.exit(c); });
