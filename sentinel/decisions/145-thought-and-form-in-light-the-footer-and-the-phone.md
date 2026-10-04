# ADR-145: Thought + Form in light, the footer's own plate, and the phone's portrait

- **Status:** Accepted on the call (2026-10-04, owner). Shipped locally, not pushed: the
  site is live and a push waits on his word.
- **Surface:** every hero and footer plate. `lib/theme/heroPreload.ts` (new
  `HERO_PHONE_MEDIA`, `HERO_PLATE_DARK_PORTRAIT*`, `HERO_PLATE_LIGHT_PORTRAIT`,
  `FOOTER_PLATE_DARK*`, `FOOTER_PLATE_LIGHT`; `HERO_PLATE_LIGHT` re-pointed; the preload
  script picks a portrait on the phone in both themes); `theme.css` (the light hero url);
  `landing.css`'s ≤640 rung; `SiteFooter.tsx` + `site-footer.css`; `ArcHero.tsx`; the four
  prototypes' `<picture>`; `HeroThemeGlitch.tsx` + `lib/key-visual/themeGlitch.ts`
  (`coverRect` takes `object-position`, `parseObjectPosition` new);
  `scripts/hero-plates/prepare.mjs` (`--footer`, `--portrait`, `--light-tf`); new
  `scripts/capture-hero-phone.mjs`; `/test/hero-kv-lab` (MOTION and LIGHT entries).
- **Amends:** ADR-144 (its decision 5's ≤640 window, its "what stays the gateway" and its
  Open list), ADR-105 U1 (the footer's dark plate is no longer the hero's), ADR-058 U2
  (one artwork per theme again: the light plate is the dark plate's own picture).
- **The pixels** were made by the world ship (`01_thoughtform-world`, callsign skimmer),
  waves 06 and 07; the recipes and the records live there, the pixels on Drive.

## The asks

The owner, 2026-10-04:

1. "Change the footer to another version … select one for the footer."
2. "For mobile … move the head to the bottom, and then use generative fill semantic
   editing to create a space above it. We can move the paragraph and the call to action to
   the upper part of the screen."
3. "Subtle cinematograph animations where maybe the camera is static, but only certain
   elements move subtly … we don't lose quality and … the size of the files isn't too big."
4. "For light mode … the material the statue is made of should be black obsidian instead
   of the white marble … I tried doing that in Midjourney by chasing the prompts, but it
   doesn't really come across well." Then, mid-pass: the light work is the Thought + Form
   heads, "the ones with the gateways, that's the old version, so I don't want to optimize
   those". His pick of the two ring readings: **"A · obsidian ring"**. On the light-locked
   proposals: **"Move them too."**

## Decision

1. **The footer takes MF-10** (Midjourney `c8f094c8`, one of his two favourites), its own
   file `ThoughtForm_footer_v1.avif` (156 kB) / `.webp` (300 kB), read by constants.
   Picked by measurement: its text band (x ≤ 0.54) has p95 luminance 0.173, the quietest
   in the Selection, and its phone window p95 0.376 against 0.70+ for MF-04, MF-06 and
   MF-01; MF-06's bright plain ran under the link grid (p95 0.749). On a TALL desktop
   window (aspect ≤ 31:20, his 1920×1247 is 1.54) the dark plate sits at 64 % so the face
   is whole; wider windows already show it whole when centred, and there 64 % put a flake
   under a link (1.67:1 at 1440×900), so the shift is scoped. It is no longer a cache hit
   on the hero's file: a lazy fetch below the fold, no preload, no `HERO_ROUTES` row.
2. **The phone paints its own portrait plate** on `(max-width: 640px)`: MF-04 extended to
   9:16 by an EDIT so the head and ring sit whole in the lower third and two thirds of
   calm sky sit above (`MF-arcthird916__nano_01`, 37 kB AVIF / 81 kB WebP). The ≤640 rung
   seats the copy at the top (`justify-content: flex-start`, only on a hero that paints
   the house `<picture>`), floor-anchors the plate (`60% 100%`), turns the copy bed
   top-down and adds a floor bed for the HUD's fixed corners, and brings the pronunciation
   line into flow under the CTA row (on this plate its ADR-043 seat is the brightest dust
   in the frame: 1.0–1.2:1).
   - ⚠ **THE FRAME THAT MATTERS IS 390×664, NOT 390×844.** A real iPhone shows the
     toolbar at rest and the hero is `100svh`. The first reframe (head in the lower half,
     `MF-arcfloor916__nano_02`) passed at 844 and put the ring's broken top through the
     CTA row at 664; the lower-third plate passes at 664, 844 and 780 (360 wide).
   - ⚠ **ONE MEDIA STRING** feeds every `<source media>`, the preload and the glitch, or a
     phone preloads one plate and paints the other. Measured in a fresh context: a phone
     fetches its theme's portrait ALONE; a desktop never fetches a portrait.
3. **Light mode is Thought + Form in obsidian.** `HERO_PLATE_LIGHT` is
   `ThoughtForm_v1-light.webp` (275 kB; the gateway was 435 kB), the phone's
   `ThoughtForm_v1-portrait-light.webp` (108 kB), the footer's
   `ThoughtForm_footer_v1-light.webp` (274 kB): the SAME keepers EDITED so the statue and
   its ring are honed black obsidian on a pale ground (rubric 0.5, the L block), each
   master's paper white-balanced onto `#ece3d6` by measured per-channel gains, WebP q85
   because AVIF bands parchment. The light hero's copy went from 3.4:1 / 2.8:1 (headline /
   paragraph over the gateway) to ≥ 10:1. The four light-locked proposals move with it
   (his ruling), so `Gateway_v2-light` is now a COURSE asset only.
4. **The theme glitch tears between the pair actually on screen**: it loads the portrait
   pair on the phone and draws each plate at its painted position (`coverRect`'s new
   `posX`/`posY`, read from the `<img>`'s computed `object-position` in dark, `60% 100%`
   for the light portrait), which also fixes ADR-144's 60 %-vs-centred mismatch.
5. **The cinemagraphs are made and NOT wired live.** Wave 07: Veo 3.1 Fast image-to-video,
   anchored first = last on the plate, one mover in the prompt, composited onto the plate's
   own pixels (max delta outside the matte 0), the raster tear a code layer. Hero 1.35 MB
   AV1 / 1.43 MB H.264 (SSIM 0.985 min to the master), phone 0.40 / 0.61 MB. They play in
   `/test/hero-kv-lab` (MOTION) from the gitignored previews; shipping one is its own
   decision (LCP, `autoplay` fetching while hidden, the theme pair).

## Update 1 (2026-10-04, owner): the phone head in the lower half, the pronunciation line off the phone

His read of the shipped phone hero: the head at the bottom "is a bit too small. I think if we can
increase the size and move it a bit upwards … one third and then the rest is like two thirds, or
maybe it's like in four parts and then two of the four. Let's find some different options." Eight
options were put under the real copy at 390×664 and 390×844 (wave 06 round 6 in the world ship;
the site's lab gained a `portrait` field per entry and `?chrome=off`): three code crops of the
shipped plate and four drawn framings of MF-04 (FILL, the lower two fifths; HALF, the lower half).
His pick: **"Use HALF 2 for the phone and drop the pronunciation line."**

1. **`ThoughtForm_v1b-portrait.avif` / `.webp`** (104 kB / 225 kB, from
   `MF-archalf916__nano_02`, 1536×2752) replaces `ThoughtForm_v1-portrait` under a NEW name so
   no cache serves the old framing; every reader takes the `HERO_PLATE_DARK_PORTRAIT*` constants.
   The head and ring fill the lower half of the plate, the ring's outer edge at the frame's edge.
2. **The pronunciation line is `display: none` on the portrait rung** (the `.hero:has(> .hero\_\_bg
   > picture)` scope, both themes). ADR-145 §2 had brought it into flow under the CTA row; that row
   > is the 40px the bigger head needs. The desktop and the wordmark keep it.
3. **The plate seats at `object-position: 60% 0%`**: on a short frame the plate is width-bound
   (697px tall at 390×664) and the 33px it loses now come off the FLOOR, under the HUD's bottom
   band, so the head sits 33px lower; on a tall frame the plate is height-bound and `y` does
   nothing.
4. **The top bed deepens through the CTA row**: `0.55 → 0.5 @ 38 % → 0.92 @ 47–55 % → 0.35 @ 63 %
→ 0 @ 72 %`. The arithmetic: a gold ghost CTA over pale stone needs the stone under it below
   ~0.05 relative luminance for 4.5:1, which is a 0.92 void; so the ring's apex is lost in the
   dark under the buttons and the head emerges below them, the picture's own found-and-lost
   grammar. ⚠ This is what the collision at 664 cost; the copy owns the top 55 % of that frame
   (104–363px) and no framing with the head in the lower half clears it otherwise.

Measured (G3, glyph-masked): 390×664 dark headline 14.9 · paragraph 14.2 · ghost CTA 7.7;
390×844 dark 15.0 · 14.7 · 7.7; a phone fetches `ThoughtForm_v1b-portrait.avif` alone and a
desktop never fetches it. The light phone keeps `ThoughtForm_v1-portrait-light` (the lower third
in obsidian) until his light pick (haze or veils, in basalt) lands, when both the light hero and
its phone are re-cut in this framing; its ghost CTA on parchment stays the pre-existing 1.8:1.

## Consequences

- One picture in two polarities on every surface; the share card stays dark.
- The footer pays a lazy ~156 kB (dark) or ~274 kB (light) below the fold.
- A phone's LCP plate is lighter: 104 kB (dark, U1; 37 kB before it) / 108 kB (light) against 133 / 435.
- Live client proposals changed picture in light.

## Left open

- **Gold mono on parchment, ~1.8:1** — the ghost CTA and the pronunciation line in light, on
  every viewport, PRE-EXISTING (ADR-058's accepted defect; the desktop hero measured the same
  before this pass). Flagged as its own task.
- **The desktop pronunciation line in dark sits on MF-04's bright dust** (1.1–1.9:1 at
  1920×1247), pre-existing since ADR-144; its ADR-043 seat was not moved unasked.
- Wiring a cinemagraph into the hero.

## Verifying

```bash
npx vitest run tests/lib/hero-preload.test.ts tests/lib/theme-css-sweep.test.ts tests/lib/theme-glitch.test.ts
node scripts/capture-hero-phone.mjs --vp 390x664 --theme dark   # and light, 390x844, 360x780, 1440x900
node scripts/capture-site-footer.mjs --vp 1920x1247 --theme dark # and light, 1440x900, 1280x720, 390x844
```
