# ADR-144: The dark hero is Thought + Form

- **Status:** Accepted on the call (2026-10-04, owner). The two phone windows and the
  client pages that inherit the plate are pending his live read.
- **Surface:** the dark hero plate everywhere it is painted. `lib/theme/heroPreload.ts`
  (`HERO_PLATE_DARK`, `HERO_PLATE_DARK_FALLBACK`, new `HERO_PLATE_DARK_SIZE`);
  `components/arcs/ArcHero.tsx` (the `plate: "gateway"` branch reads the constants);
  `components/landing/v7/site-footer/SiteFooter.tsx` + `site-footer.css`; the four
  prototypes (`landing-v7-motion.html`, `-trinny-london.html`,
  `-thoughtform-workshop.html`, `-claude-workshop.html`); the heroes of
  `lib/arcs/content/portfolio.ts` and `claude-workshop.ts`; `app/layout.tsx` (the share
  card's alt); `landing.css`'s ≤640 hero rung; `scripts/hero-plates/prepare.mjs`
  (`--thoughtform`); `scripts/measure-plate-luminance.mjs`; three visual specs;
  `/test/hero-kv-lab`.
- **Amends:** ADR-058 Update 2 (the two plates are no longer one artwork per theme) and
  ADR-105 U1 (the footer's dark plate is still the hero's, so it changes with it).

## The call

The owner, 2026-10-04, after comparing his Thought + Form keepers in
`http://localhost:3003/test/hero-kv-lab`: "rf 04 looks insane; let's promote that as our
key visual across our website." MF-04 is his Midjourney keeper, job `63c6e199`: the
marble head in its broken stone ring on the right, eyes closed, the face tearing into
raster lines, the open plain and black sky on the left. It was one of his two favourites
in the Brandworld ship's wave 05 record (`01_thoughtform-world/evals/waves/dir-05.md`).

## Decision

1. **The plate.** Encoded from the master at native size, 2912×1632, by
   `node scripts/hero-plates/prepare.mjs --thoughtform`: AVIF q50 **133 kB** (the gateway's
   dark AVIF was 346 kB), WebP q80 **313 kB** as the `<picture>` fallback. The master is
   staged and gitignored at `assets-staging/hero-candidates/ThoughtForm_v1-master.png`.
2. **A new name, not an overwrite.** The files are `public/images/ThoughtForm_v1.*`.
   Encoding the head into `Gateway_v1b.*` would have reached every reader in one move and
   left a file named for a picture it no longer holds. Every reader names the new file or
   reads the constants; `HERO_PLATE_DARK_SIZE` is new so an `<img>`'s intrinsic size
   cannot drift from the plate's.
3. **`ArcHero` reads the constants.** Its gateway branch spelled the two paths and the
   2880×1620 size inline; it imports `HERO_PLATE_DARK`, `HERO_PLATE_DARK_FALLBACK` and
   `HERO_PLATE_DARK_SIZE` now, so one record moves every arc whose hero declares
   `plate: "gateway"` (ADR-075: such a hero IS the homepage hero).
4. **The share card** (`public/images/og/thoughtform-og.jpg`) is a 1200×630 centre cut of
   the same master, jpeg q82, 59 kB, written by the same script.
5. **Two phone windows, both measured.** A portrait box is height-bound, so the plate's x
   term picks a ~26 % slice.
   - The footer's dark window goes **88 % → 20 %**. 88 % framed the gateway's ring body
     and frames this plate's brightest mass (the head and the lit dust under it), where
     the link grid and the mark measured 3.2:1 and 3.1:1. 20 % is the plate's quiet left
     side: every role now measures ≥ 6.9:1 at 390×844 (`capture-site-footer.mjs`).
   - The hero's ≤640 window goes **centre → 60 %**. This rung centres the copy over the
     plate, so no window gives both the whole head and a clear headline; 50 % loses the
     head and 72 % sets the headline on the face. 60 % keeps the copy on black sky with the
     profile entering from the right (shot at 50/60/66/72/80).
6. **The footer's desktop cap is kept, not re-solved.** `--ft-band-right: 54vw` was solved
   against the gateway's ring edge. The head sits right of it, but its raster-line glitch
   trails left into the band's right end, so the glyph-masked gate decides: the title's
   last letters are the binding ink at 5.4:1 (1440×900), 6.4 (1280×720), 10.8 (1920×1247);
   every other role is ≥ 6.6.

## What stays the gateway

- **The light plate**, `Gateway_v2-light.webp`. The obsidian Thought + Form plate for
  light mode does not exist yet (the owner is drawing it in Midjourney); until it does the
  two themes show different pictures, and the theme glitch (ADR-060) tears from the head
  to the gateway.
- **`Gateway_v1b.avif` / `.webp` stay in `public/images/`.** Two course decks show the
  gateway as a CASE, not as the house's hero (`ai-storytelling.ts`,
  `ai-storytelling-class-1.ts`), `/test/hero-kv-lab` keeps it as the comparison, and
  `Remnant3D` was reconstructed from it.

## Consequences

### Positive

- The dark hero costs 213 kB less on the LCP path (133 kB against 346 kB).
- One record moves every dark hero: the landing, the footer, every `plate: "gateway"`
  arc and the share card.

### Negative

- **Every arc with `plate: "gateway"` changes picture in dark.** The four proposals
  (Suri, Pandora, Perfect Ted, Hungry Minds) are light-locked (`LIGHT_LOCKED_ROUTES`), so
  they keep the light gateway and do not move. The ones that do: the Suri and Plopsa
  workshops, the AP Hogeschool lecture, the portfolio and the storytelling course, plus
  the two workshop prototypes. That is the ask ("across our website"); a page that must
  keep the gateway would need its own plate value.
- Light and dark are different subjects until the obsidian plate lands.
- On a phone the head is cut by the frame's right edge (decision 5).

## Open

- The obsidian light plate, and with it ADR-058 U2's one-artwork-per-theme premise.
- The phone hero's composition: `/test/hero-kv-lab` proposes the copy in the top band with
  the plate dropped a fifth, so the head sits whole under the copy. Not shipped; his call.
- `ai-storytelling-class-1.ts` still says the gateway series has "no frame approved yet",
  which is stale now that a frame of the same world is the house's hero.

## Verifying

```bash
npx vitest run tests/lib/hero-preload.test.ts tests/lib/theme-css-sweep.test.ts tests/lib/arcs-registry.test.ts
node scripts/measure-plate-luminance.mjs
node scripts/capture-site-footer.mjs --vp 1920x1247 --theme dark
node scripts/capture-site-footer.mjs --vp 390x844 --theme dark
```
