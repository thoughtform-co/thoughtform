---
paths:
  - "app/(marketing)/home-sessions/**"
  - "components/sessions/**"
  - "lib/sessions/**"
  - "scripts/capture-sessions.mjs"
  - "tests/lib/sessions-*.test.ts"
  - "tests/visual/sessions-smoke.spec.ts"
---

# Rule: the Home sessions page (ADR-150)

`/home-sessions` is its own composition, not a sheet: the hero on the house key
visual, the morning as a dial that turns with the reader, the four mornings as
tall tiles in one notched instrument, the dates as ASCII numerals, the table
from the side and from above, the ask, the footer.

**Read first**

- [ADR-150](../../sentinel/decisions/150-the-home-sessions-page-is-its-own-composition.md)
  — the ask, the diagnosis, the six blocks, the guards, what is left open.
- [ADR-149](../../sentinel/decisions/149-the-lattice.md) and
  [`lattice.md`](lattice.md) — the tokens and the frame mechanism this page is
  built on.
- [ADR-075](../../sentinel/decisions/075-arc-hero-curtain.md) — the hero recipe.

## Contracts

- **One record, by reference.** Every string comes from the services record
  (`guided-build`), `lib/sessions/registry.ts` and `lib/site/socials.ts`,
  composed in `lib/sessions/page.ts`. A page string is never retyped. The one
  authored block is `MOVEMENTS` (OWNER-TO-CONFIRM, like the dates): its
  minutes are DRAWN as the dial's sectors and never lettered.
- **No price, and no digit but a date, an ordinal, `NAV-04` or `Fig. n`.**
  `sessions-page.test.ts` walks every lettered string.
- **Two client files, both leaves**: `SessionsShell` (the frame bus) and
  `MorningDial` (one IntersectionObserver). Neither imports the record; the
  copy is server HTML. `arcs-import-doctrine` names both.
- **The shell COPIES `ArcShell`'s mechanism**: `useArcScroll` in its DETAIL
  variant, `useHeroBoot`, `useArcReveal` on `.hs-reveal`, `ArcHudNav`,
  `ArcRailInstruments`, then `HeroThemeGlitch` (after the corners: it finds
  the toggle on mount). ⚠ `arc-hero` on the hero is the scroll writer's
  SELECTOR, not a skin; `arcs.css` is not loaded on this route.
- **`data-hs-ready` is the observable** (`faces|sections|rail`); the smoke and
  the capture wait on it, never on a timer.
- ⚠ **NO OPEN DIVIDERS** (owner, 2026-10-07). A line closes a box or rules
  inside one; sections are divided by air, heads carry no underline.
- **`sessions.css` is token-only and at zero in four ratchets**
  (`lattice-ratchet`, `type-material-tokens`, `theme-css-sweep`,
  `phone-viewport-units`). Every cut is a `.lat-frame` (no `clip-path:
polygon(`), every `font-size` a single `var()`, spacing on the 8px scale,
  `@media` only on the ladder. Light re-derives the page's own alphas in
  `theme.css` BLOCK 4i.
- ⚠ **DECLARE THE FACE.** `.hs-root` declares PP Neue Montreal; the body's is
  IBM Plex Mono, and the gate counted 68 inheriting nodes before it did.
- **Gold is state**: the lit tile and its button, the lit sector, the lips and
  washed bands, the reader's seat, the next numeral. Gold that is READ takes
  `--gold-ink`; the NOW cursor is dawn.
- **The dial**: `lib/sessions/dial.ts` is pure, absolute coordinates, no
  `transform`; the SVG letters nothing (labels and the hub are DOM). The server
  renders the LAST step lit; under reduced motion the dial still marks the step
  being read (a state, not a motion).
- **The field** is server SVG: one `<text>` per row pinned by `textLength`,
  glyphs from the ramp and never digits, seeded by the four dates.
- **The hero's `<picture>` is ArcHero's, copied**: portrait first, AVIF over
  WebP, the dark `<img>` lazy so light never fetches it. The route is in
  `HERO_ROUTES` (hand-written, pinned exact).

- ⚠ **THE DATES AND THE TABLE ARE ONE VIEWPORT EACH** on a desktop at least
  681px tall (ADR-150 U1): content between the rails' ends, everything inside
  sized from the room left over (`container-type: size`, `cqh`), never from
  its width. A new block in either section must fit that budget at 1280×720;
  `sessions-smoke` fails a spill at five viewports. Measure after a walk: a
  reveal rests 24px low until it has been seen.

## Verifying

```bash
npx vitest run tests/lib/sessions-page.test.ts tests/lib/sessions-geometry.test.ts tests/lib/sessions-registry.test.ts
npx playwright test tests/visual/sessions-smoke.spec.ts --project=desktop
node scripts/capture-sessions.mjs --wave sessions-local --vp 1280x720,1920x1247,390x844 --themes dark,light
node scripts/design-eval/mechanical.mjs --url /home-sessions --theme dark --scope ".hs-root" --exclude ".hud-nav-overlay, .rin-host, .hs-hud-root, .hs-close" --ready ".hs-root[data-hs-ready]" --vp 1280x720
```

Read live: `http://localhost:3003/home-sessions` (the port off the running
server). The Browser pane cannot screenshot while hidden; the capture is the
still.
