# kar-jel/makefun-coverart-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kar-jel/makefun-coverart-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kar-jel/makefun-coverart-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice//Frame is an offline studio that turns one of your photos into GTA-style cover art in the browser: an asymmetric multi-panel poster, a Vice City neon grade with an ink/cel pass, a big title lockup, an editable caption, and PNG export at 1080 x 1080, 1080 x 1350 and 1920 x 1080. Plain static files, no build step, no library and no network request - your photos never leave the machine.

## Run it

```sh
python3 -m http.server 8123 --directory app
```

Then open http://127.0.0.1:8123/ and press USE A SAMPLE (or drop in your own photo).

## What it does

- Layouts: an asymmetric COVER collage (the default), a TRIPTYCH, a 2x2 GRID and a full-bleed panel.
- Photos: load your own from disk or use the bundled samples; one photo can fill every panel, or a different one each. Drag a panel to reposition it, scroll or use the slider to zoom, and rotate, flip or reset its crop.
- Grade: neon Vice City presets plus per-panel hue, saturation, contrast, warmth and vignette, an adjustable ink/cel-shading pass (posterise, edge ink, rim light), film grain, scanlines and a chromatic offset.
- Lettering: a centred title lockup of the app's own making, a caption you type (three lettering styles, size, tracking, outline, shadow and height), and a synthwave sun, palm silhouettes and a horizon grid drawn in code.
- Export: DOWNLOAD PNG writes the finished cover at the chosen size; VARY re-rolls the panel framings, RANDOMISE re-rolls the look.

## Licence and fonts

The code is MIT (see `LICENSE`). The bundled **Anton** and **Bebas Neue** faces are used under the SIL Open Font License; their texts are in `app/fonts/LICENSE-Anton-OFL.txt` and `app/fonts/LICENSE-OFL.txt`. The sample photos and their licences are listed in `app/samples/LICENSE.md`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=f1mk34x9&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
