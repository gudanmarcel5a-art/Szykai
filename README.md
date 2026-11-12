# Ostatni pociąg o północy

Krótki film animowany 2D — pionowy 9:16, 1080 × 1920, 30 FPS, 25 s, z syntezowaną ścieżką dźwiękową.

**Gotowy film:** [`out/ostatni-pociag.mp4`](out/ostatni-pociag.mp4)

## Jak to działa

Cały film jest czystą funkcją czasu: `renderFrame(t)` rysuje na `<canvas>` dowolną klatkę,
bez żadnych grafik zewnętrznych — wszystko (stacja, postać, pociąg, deszcz, światło) jest rysowane proceduralnie.

| Plik | Zawartość |
|---|---|
| `src/core.js` | oś czasu `T`, ruch pociągu, zegar, migotanie świateł, krzywe kamery |
| `src/man.js` | szkielet postaci (chód z IK, siadanie, odkładanie walizki), scenariusz aktora |
| `src/station.js` | niebo, chmury, budynek, peron, latarnie, zegar, tablica LED, deszcz, odbicia w wodzie, finał |
| `src/train.js` | pociąg z przezroczystym wnętrzem, drzwi, koła, reflektory, iskry hamowania |
| `src/shots.js` | ujęcie w głąb torów (światła na horyzoncie) i wnętrze wagonu z walizką |
| `src/main.js` | montaż scen, przenikania, ziarno, winieta, odtwarzacz |
| `audio.py` | synteza dźwięku (numpy): deszcz, zegar, kroki, pociąg, hamulce, drzwi, walizka, ambient |
| `render.mjs` | render klatek w headless Chromium + ffmpeg → MP4 |

## Podgląd na żywo

```bash
npm run preview        # http://localhost:8080 — kliknij lub naciśnij spację
```
`index.html?t=12.5` otwiera film na wybranej sekundzie.

## Render do MP4

Wymagania: Node 18+, Playwright (`npm i && npx playwright install chromium`), ffmpeg, Python 3 + numpy.

```bash
python3 audio.py       # → out/audio.wav
node render.mjs        # → out/ostatni-pociag.mp4  (ok. 2,5 min na 4 rdzeniach)
node render.mjs --still 7.6,12.9,21.3   # pojedyncze klatki PNG → out/stills/
```
`WORKERS=8 node render.mjs` zmienia liczbę równoległych kart renderujących.
