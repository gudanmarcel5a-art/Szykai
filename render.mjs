// Render klatek przez headless Chromium (Playwright) → ffmpeg → MP4
// Użycie:  node render.mjs            (cały film → out/ostatni-pociag.mp4)
//          node render.mjs --still 7.5,12.9   (pojedyncze klatki PNG do out/stills)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // działa też z globalną instalacją
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'out');
const URL_ = pathToFileURL(path.join(ROOT, 'index.html')).href + '?render';
const args = process.argv.slice(2);
const stillIdx = args.indexOf('--still');
const WORKERS = Number(process.env.WORKERS || 4);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('BŁĄD STRONY:', e.message); process.exitCode = 1; });
  await page.goto(URL_);
  await page.evaluate(async () => { await document.fonts.load('700 30px "JetBrains Mono"'); await document.fonts.load('300 78px "Inter Display"'); await document.fonts.load('700 86px "Inter Display"'); await document.fonts.ready; });
  return page;
}
const grab = (page, t, type, q) => page.evaluate(([t, type, q]) => { window.renderFrame(t); return document.getElementById('c').toDataURL(type, q).split(',')[1]; }, [t, type, q]);

if (stillIdx >= 0) {
  const dir = path.join(OUT, 'stills'); mkdirSync(dir, { recursive: true });
  const page = await openPage();
  for (const s of args[stillIdx + 1].split(',')) {
    const t = parseFloat(s);
    writeFileSync(path.join(dir, `t${t.toFixed(2).padStart(5, '0')}.png`), Buffer.from(await grab(page, t, 'image/png'), 'base64'));
  }
  await browser.close(); process.exit();
}

const { FPS, DUR } = await (await openPage()).evaluate(() => window.FILM);
const N = Math.round(FPS * DUR), dir = path.join(OUT, 'frames');
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
let done = 0; const t0 = Date.now();
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const page = await openPage();
  for (let i = w; i < N; i += WORKERS) {
    writeFileSync(path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(await grab(page, i / FPS, 'image/jpeg', 0.97), 'base64'));
    if (++done % 50 === 0) console.log(`klatki ${done}/${N}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
}));
await browser.close();

const audio = path.join(OUT, 'audio.wav');
if (!existsSync(audio)) execFileSync('python3', [path.join(ROOT, 'audio.py')], { stdio: 'inherit' });
const mp4 = path.join(OUT, 'ostatni-pociag.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%05d.jpg'), '-i', audio,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
ff.on('exit', c => { if (!c) rmSync(dir, { recursive: true, force: true }); console.log(c ? 'ffmpeg: błąd' : 'GOTOWE → ' + mp4); process.exit(c); });
