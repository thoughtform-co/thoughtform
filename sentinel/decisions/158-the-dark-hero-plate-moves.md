# ADR-158: The dark hero plate moves

- **Status:** Shipped (2026-10-14, owner: "promote this to everywhere where we used the static
  version; optimize it for web but don't lose any resolution etc"). The loop is route **H** of
  the world ship's round five. He answered "amazing stuff!" to a round that showed H and H2,
  and H is the sparser of the two (his standing "keep it minimalistic"); H2 is one re-encode
  away (below).
- **Surface:** `components/landing/v7/HeroPlateMotion.tsx` (new), mounted in
  `components/landing/v7/LandingPage.tsx`, `components/arcs/ArcShell.tsx` and
  `components/sessions/SessionsShell.tsx`; `lib/theme/heroPreload.ts`
  (`HERO_PLATE_DARK_MOTION`); `components/landing/v7/landing.css` (`.hero__bg .hero__motion`);
  `public/videos/ThoughtForm_v1-motion.av1.mp4` and `.mp4` (new);
  `tests/lib/hero-plate-motion.test.ts` (new); the landing-performance skill, item 3.
- **Amends:** [ADR-144](144-the-dark-hero-is-thought-and-form.md): the still is still the
  plate, the preload and the LCP; the loop is laid over it. The landing.css note "Static
  key-visual background ... Replaces the looping key-visual video" holds for the still, which
  is what every path falls back to.
- **Related:** [ADR-058](058-light-mode-theme.md) U2 (the theme swap the loop yields to),
  [ADR-060](060-hero-theme-glitch.md) (the glitch, which still tears from the still),
  [ADR-145](145-thought-and-form-in-light-the-footer-and-the-phone.md) (the phone's portrait
  plate and the footer's MF-10, neither of which this moves).

## The call

The owner, 2026-10-14, after five rounds on the hero in motion in the Brandworld ship
(`01_thoughtform-world`, wave 11: `prompts/dir11/`, `evals/waves/dir-11.md`). His rulings on
the way: the camera locked and the still's own resolution ("AI video often renders in 720p
and that's not what I want"); no text, labels or symbols ("keep it minimalistic"); the wash
off the head at twice its first pace; and the data must travel, not only stretch ("I want
these strands of data to travel as individual lines, particles"). Then: "amazing stuff!
promote this to everywhere where we used the static version; optimize it for web but don't
lose any resolution etc".

## Decision

1. **The loop is the still, moving.** Route H is built in code over the 2912×1632 master:
   the raster lines off the head stream and stretch, 373 stars twinkle, the 18 drafting lines
   carry a pulse of light, and strands cut from the lines' own light travel level along their
   rows and off the left edge, breaking into dashes and particles. Everything outside what
   moves is the master's own pixels in every frame (gated: max delta 0). 8 s, 24 fps, 192
   frames, seamless by construction. The lossless master and a ProRes 422 HQ cut live in Drive
   (`Home World/02_Creation/_explore/dir-11/_deliver/H/`).
2. **Two files, both at native 2912×1632, at the same fidelity.**

   | File | Encoder | Size | SSIM to the master (min / mean) |
   |---|---|---|---|
   | `ThoughtForm_v1-motion.av1.mp4` | SVT-AV1 preset 3, CRF 28, one keyframe a loop | 2.19 MB | 0.9952 / 0.9959 |
   | `ThoughtForm_v1-motion.mp4` | x264 veryslow, CRF 18, High@5.1, one keyframe a loop | 2.86 MB | 0.9944 / 0.9953 |

   Inside the region that moves (x 0–2200, y 400–1200) both hold 0.991 at minimum. AV1 is a
   quarter smaller at matched fidelity. The ship's earlier "H.264 beats AV1 on this plate"
   came from AV1 at preset 4 squeezed into a 2 MB budget; at preset 3 it wins. **No 1920
   cut**: the plate is cover-fit, and on a high-DPI laptop (1440×900 at DPR 2, 2880×1800
   device pixels) it is already drawn at 1.1× its native size, so a smaller file would be
   upscaled, which is exactly the resolution he said not to lose. Both files are tagged
   BT.709, with faststart and no audio track.
3. **The still stays the hero.** Its `<picture>`, the injected preload, the LCP, the light
   swap and the glitch are untouched. `HeroPlateMotion` adds one `<video>` into `.hero__bg`
   after `load` and an idle slot, before `.hero__video__overlay` (so the scrims stay on top),
   and fades it in over 900 ms on its first `playing`. It takes the first source the device
   decodes power-efficiently (`navigator.mediaCapabilities`), else a smooth one, else any it
   can play, so a machine with hardware H.264 and software-only AV1 gets the H.264.
4. **It finds the still by its `src`**, `HERO_PLATE_DARK_FALLBACK` inside a `<picture>`. The
   landing family is parse-injected from the prototypes, which the v7-parse guards pin
   byte-exact, so the prototypes are not edited and there is no React node to hand a video to.
   One reader serves the landing and every `LandingPage` arc, every `plate: "gateway"` arc and
   the sessions page, and leaves any hero that owns its key visual alone.
5. **Where it runs:** dark, wider than `HERO_PHONE_MEDIA`, no reduced motion, no Save-Data.
   It pauses when the hero leaves the viewport, when the tab hides and when the theme flips
   to light. The CSS hides it in light, on the phone rung and under reduced motion as well, so
   a state the component missed still shows the still.
6. **Where it does not:** the phone rung paints the portrait plate (ADR-145), a different
   frame with no motion of its own yet; the footer paints MF-10 (ADR-145); the share card and
   the arc PDFs are stills by nature; the light-locked proposals are light.

## Measured

Chrome (stable, Playwright `channel: "chrome"`) against the worktree's dev server:

- `/` at 1976×966, dark: AV1 chosen, fetched 0.42 s after `load`, playing, the overlay its
  next sibling. Toggled to light: paused, `display: none`.
- `/` at 390×844: no video element, nothing fetched, the portrait still painted.
- `/` in light, and under reduced motion: nothing fetched.
- `/arcs/loop/portfolio` and `/home-sessions` at 1976×966, and `/` at 820×1180: playing.
- With AV1 reported as not power-efficient: the H.264 file is fetched and plays.
- **Tone across the fade:** frame 0 rendered at 1:1 against the master in three static
  regions (the head, the ring, the plain). The video sits within ±0.1 of the master on
  average (mean |d| 1.0–1.4); the shipped AVIF still sits at mean |d| 4.3–4.8, its own
  compression. The fade moves no tone. In Chrome, untagged, BT.709-tagged and
  sRGB-transfer-tagged clips rendered identically; the files carry BT.709 for players that
  read it.

## Consequences

### Positive

- The house key visual moves everywhere it is shown in dark on a screen wider than a phone,
  at its native resolution, and the loop is closer to the master than the still it covers.
- Nothing on the LCP path changed: the loop is fetched after `load`, never preloaded.

### Negative

- 2.2 MB (AV1) or 2.9 MB (H.264) on the first eligible visit, after `load`; revalidated
  from cache after that.
- A 2912-wide decode while the hero is on screen (paused otherwise).
- Strands pass behind the hero copy on the left, faint and under the 0.55 scrim; the copy
  contrast measured in ADR-144 was measured on the still.
- The glitch tears from the still, not the live frame, so whatever is mid-motion vanishes at
  the swap's first frame, under a 640 ms effect.

## Open

- The phone's portrait plate in motion: it needs its own mattes (the head sits in the lower
  half of a 1536×2752 frame), and the owner should see it before it ships.
- Safari's rendering of the BT.709 tag against the AVIF still was not measured on this
  machine.
- H2 (20 strands a loop against H's 12) if he prefers it: re-encode with the commands below
  from `HW-H2.mkv`.

## Verifying

```bash
npx vitest run tests/lib/hero-plate-motion.test.ts tests/lib/hero-preload.test.ts
# re-encode from the world ship's lossless master (build.py's FFV1):
VF="scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv"
ffmpeg -i HW-H.mkv -vf "$VF" -c:v libsvtav1 -crf 28 -preset 3 -g 192 -svtav1-params tune=0 -an -movflags +faststart ThoughtForm_v1-motion.av1.mp4
ffmpeg -i HW-H.mkv -vf "$VF" -c:v libx264 -crf 18 -preset veryslow -profile:v high -level 5.1 -g 192 -an -movflags +faststart ThoughtForm_v1-motion.mp4
```
