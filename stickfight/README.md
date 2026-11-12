# Stickman Fight (1080×1920, 60 FPS, ~20 s)
Animacja szkieletowa 2D w czystym JS/Canvas — jeden plik `index.html`.
- Podgląd na telefonie/przeglądarce: otwórz `index.html` (dotknij = start/pauza), `?t=8.5` skacze do sekundy.
- Render MP4: `node render.mjs` → `out/stickfight.mp4` (wymaga Playwright + ffmpeg).
- Test trafień/kadru/skoków: `node render.mjs --check`.
Choreografia = klatki kluczowe `RED`/`BLUE` + lista uderzeń `HITS` (efekty biorą pozycję z szkieletu, więc trafiają dokładnie w cel).
