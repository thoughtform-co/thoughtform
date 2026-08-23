# ADR-074: The through-line — `#voidwalker`, the career timeline after the bio

- **Status:** Accepted (2026-08-23)
- **Surface:** `#voidwalker` (new station, prototype shell + relocate spec), `components/landing/home-v2/voidwalker/**`, `components/landing/home-v2/hooks/useVoidwalkerScroll.ts`, `lib/voidwalker/**`, `lib/rail-manifest/entries.ts`, `rail-instruments/clusters.ts` + `sectionGlyphs.tsx`, `HudNav` nav items, the cover rule in `home-v2.css` + `useCorridorExitScroll`, `theme.css` light rows, `scripts/capture-voidwalker.mjs`
- **Supersedes:** ADR-056's consequence that `#practice` is the opaque cover ending the ambient hold (it is `#voidwalker` now); ADR-047 U8's "lockstep cover" names `#voidwalker`. Nothing else.
- **Prior art:** ADR-008 (paint stack) · ADR-021/030 (the §6 seam bug) · ADR-031/055 (manifest + readout) · ADR-045/047 (the bio and its exit) · ADR-048 (the editorial band) · ADR-054 (the plain-DOM station precedent, and `fillSlots`) · ADR-056 · ADR-057 (beat grammar) · ADR-059 (journey marks) · ADR-065 (corner law) · ADR-067 (type ladder) · ADR-068 (the wireframe grammar)
- **Rules:** [`.claude/rules/voidwalker.md`](../../.claude/rules/voidwalker.md) · [`.claude/rules/landing-v7.md`](../../.claude/rules/landing-v7.md) · [`.claude/rules/scroll-animations.md`](../../.claude/rules/scroll-animations.md)

## Context

The owner, with the landing "in a very good place", asked for the next
section: after the bio, **a vertical timeline of the things that led up to
Thoughtform** — not a CV, a leitmotif made visible. Title on the left,
paragraph on the right, beats appearing one by one on scroll "like
zerodrift.com" (a gold spine, mono `//01` markers, headlines that brighten,
wireframe panels), and for each press article or achievement **a drawn
wireframe in the casefile's technique** (ADR-068) — the owner had built those
precisely because a thumbnail "broke with the style". "Don't make it too
overwhelming."

The leitmotif the owner could not name turned out to be already written in
his own strategy skill (`thoughtform-strategy/references/13-the-navigator.md`,
"The through-line, five instances" → "The pattern, named"): _read a new
system early, build the layer that lets people act inside it, then step
back_ — "He was prompting humans for decades." The bio on `#about` already
says it in one sentence (_navigating the tides of digital change for over a
decade: social media, online communities, now intelligence itself_); this
section is that sentence unfolded.

## Decision

### The station

1. **`#voidwalker` is a plain, OPAQUE, normal-flow station** authored as a
   shell in the prototype (the `station__idx` line + an empty
   `[data-voidwalker-root]` slot), RELOCATED by `page.tsx`'s
   `CORRIDOR_RELOCATED_STATIONS` to sit directly after `#about`:
   `hero → mount → #services → #about → #voidwalker → #practice → #contact`.
   Specs insert after the mount in array order (last lands closest), so the
   spec reads `[voidwalker, about, services]`. The three duplicated
   parse-option copies (`page.tsx`, `rail-manifest.test.ts`,
   `v7-parse.test.ts`) move in lockstep.
2. **It is the cover that ends the corridor ambient hold.** `#practice` is
   an EMPTY breather in production (its `.approach` body is stripped by
   `CORRIDOR_REPLACED_STATIONS`), so its only live role was this one;
   `useCorridorExitScroll`'s `nextStation` and `home-v2.css`'s
   `html[data-corridor-exit="true"] #voidwalker` rule name the new station
   on the SAME rect (the ADR-030 §6 invariant). Verified headed at
   1280×720 / 1440×800 / 1920×1080: ambient alive at `voidwalker.top =
+0.4vh`, dead at `0.0vh`, the existing seam smoke re-pointed and green.
   The station keeps the authored void + stars ground, no shield var, no
   transparency and **no negative `margin-top`** — `#about`'s exit (ADR-047
   U8) relies on its runway bottom coinciding with this station's top.
3. **One manifest row, one readout row, one journey mark, one nav item.**
   `MANIFEST_ENTRIES` gains `voidwalker` after `about` (readout renumbers
   06 → 07); `JOURNEY_MARKS` gains `row("voidwalker")` (a spine-with-
   markers glyph); `HudNav` gains `03 Voidwalker` and Practice becomes
   `04`. `#practice` stays in the DOM, roleless — retiring it is the named
   follow-up (manifest · nav · `journey.ts` orbit anchor · the marks test's
   "known hole").

### The section

4. **Delivery is a nested-root PORTAL** (`VoidwalkerPortal`, the
   `AboutStagePortal` recipe) rendering `VoidwalkerStation` on EVERY
   viewport — plain DOM, no `three`, no images, no media gate. `fillSlots`
   SSR (ADR-054's path) was considered and rejected: the reveal is not
   `data-m`, the six drawings are `.tsx`, and `react-dom/server` inside the
   RSC layer is a build risk on Next 16. The cost — beat text is client-
   rendered — is accepted; if indexability of the press beats ever matters,
   string-built `fillSlots` is the switch and nothing else moves.
5. **The content is a zero-import record** (`lib/voidwalker/voidwalkerData.ts`,
   the `lib/cases` law): nine beats, chronological — 2014–17 the Antwerp
   creative community · 2016 Pokémon GO · 2016 OPHEF · 2018 Save The Expanse
   · 2018 the coins · 2020 the locked-down classroom · 2022 the GenAI wave ·
   2024 Loop · 2025 Thoughtform. **Six STORY beats carry a wireframe plate
   and a press bar; three WAYPOINTS (the prologue and the two terminus
   beats) are compact rows on the same spine** — that split is how "not
   overwhelming" is kept with nine beats. Facts are at LOCK (the CV, the
   vault's press notes, the articles): `tests/lib/voidwalker-data.test.ts`
   pins the phrasings (_about a thousand · sixteen thousand · 100,000
   signatures · three more seasons · 100,000 upvotes · over a million_),
   bans rounding (`1,000`, `16k`, `100,000+`), currency and model families,
   measures every budget, and requires the terminus to hand to a section
   that exists (`#contact` — `#practice` is empty).
   **The word "Voidwalker" is the section title by owner decision**, which
   overrules the strategy skill's invoice-only rule for this ONE surface
   (the `#about` orbit already letters `FIELD · VOIDWALKER`); it appears
   nowhere in the prose, and the record test pins both halves.
6. **Composition:** a three-track grid on the editorial band (ADR-048) —
   the spine lane (64px) · the TITLE (5fr) · the BODY (7fr: paragraph, then
   the plate) — beats as subgrid rows; two tracks at 961–1279, one column
   with the spine at the band's left edge below 960. Pitch is content-bound
   (no per-beat `min-height`, so the owner's tall window gets no empty
   runway). ⚠ **The spine, the beats list and the foot carry EXPLICIT grid
   rows** (2/4 · 2 · 3): an auto-placed full-span list cannot land in a row
   the spine occupies, slid to a row of its own, and the spine spanned two
   EMPTY rows — 0px tall, the gold never drew, and every clock value was
   right. ⚠ **A right guard of 32px below 1600px**: the right-rail
   telemetry (`.rin-tele`, ADR-059) sits 10–22px INSIDE the band's right
   edge at the laptop widths (measured 1129 vs 1151 at 1280; 1285 vs 1295 at
   1440); the services lede never reaches that edge, a full paragraph does.
7. **The plate is a housing** (ADR-065: TR + BL chamfer at the plate rung,
   gold-15 border, deep-void ground, square children) in flow with a
   definite 16:10 aspect capped at 56svh. ⚠ **On the phone band the FRAME
   carries the aspect, not the plate** — a 4:3 plate at 246px is 185px
   tall, and a press headline wrapping to four lines left the drawing 0–90px
   (measured: azeroth's frame was 0px). The plate's top line is `ARTEFACT ·
…`; its bar is `PRESS · OUTLET` + the headline, an `<a target="_blank">`
   when the article is on file (De Standaard · Newsweek · CNN · MIT TR ·
   De Tijd) — the beat's one interactive element.

### The drawings

8. **Six authored wireframes, in the casefile's vocabulary, FORKED into
   `.vw-wire*`** with the casefile's `--w-*` token block VERBATIM
   (`tests/lib/voidwalker-wire-tokens` pins the two blocks equal, and
   theme.css's light re-derivation names both hosts in ONE rule). Why a
   fork: `.fl-wire` is `position: absolute` inside the `.fl-shot__frame`
   BUTTON, its grammar pair is enumerated per tool, `--fl-mono` is scoped
   to `.fl-case`, and the services smoke walks `.fl-wire` — a shared class
   would couple two surfaces' guards. The fork's one liberty: three shared
   primitives (`__hd/__ft`, `__card`, `__bar`).
9. **Each drawing abstracts the artefact** — the street hunt (a map plate,
   the closure, a crowd converging on the LURE), the tweet that became a
   party (JOIN), the Discord command centre (the banner SAVE THE EXPANSE
   towed over the studio), the Reddit post beside the six coins with the
   bullet's line stopping at the one that took it, the raid HUD as a
   classroom (ACCEPT the assignment), the hybrid film's chain PROMPT →
   FRAMES → CUT → RENDER beside the charter. **One gold object per drawing
   (`[data-gold]`) — a lettered plate where the artefact has a verb, a MARK
   where it is physical (the coin); green is the flow.** ≤8 labels, NO
   digits, NO currency, no `<img>`, ≤50 elements. A drawing DECLARES what
   it letters (`lib/voidwalker/voidwalkerWireLabels.ts`) and
   `tests/lib/voidwalker-wire-markup` walks the rendered text against it by
   sorted-array equality. The circles are representational (the image
   mark's sun); every UI mark stays a diamond.

### The motion

10. **One single writer, `useVoidwalkerScroll`**, zero layout reads on the
    scroll path: the offset chain is measured on mount / resize / fonts /
    a `ResizeObserver` on the section AND on `document.body` (the runway
    above inflates asynchronously), and per frame it reads `scrollY` and
    `innerHeight` only. Pure math in `lib/voidwalker/voidwalkerClock.ts`
    (unit-pinned): a READING LINE at 40 % of the viewport; a beat's `--vw-b`
    goes 0 → 1 over 0.26vh as its marker approaches the line and is 1 as
    it crosses; the spine's `--vw-p` is the same line over the whole spine,
    so the gold tip reaches a marker exactly as that beat lights. Per-beat
    channels are hosted ON THE BEAT (never the root — the ADR-056 U4
    lesson); delta-gated with the ENDPOINTS always written (a clock
    resting at 0.0024 is a panel at 1 % that should be dark). Out of band
    (a viewport past either end) one terminal flush, then idle.
11. **The grammar is the house's**: panels power on through the
    `--ci-off` terminal ladder (about-stage.css, verbatim — paragraph .30,
    plate .42, press .52); the title's WORDS brighten one by one past rung
    .30 (zerodrift's word-fill, scrubbed, from `--vw-dim` .30 dark / .45
    light to full ink); the marker diamond fills in the last stretch; the
    masthead never moves or fades — its runs DECODE in place via the
    caption kernel on an arm line at 72 % with ±24px hysteresis, and
    UN-TYPE on the way back up (the masthead law). Each lede run is its
    own decode target so the gold emphasis survives `textContent` writes;
    the ghost-twin holds the line box and the accessible text (transparent
    ink, never `visibility: hidden`), the live layer is `aria-hidden`.
12. **The rest state is the finished page.** Every rule paints the section
    lit; the motion block is gated on `.vw[data-vw-ready]`, which only the
    hook writes and only under `prefers-reduced-motion: no-preference`. No
    JS, reduced motion, a hook that never engaged — all read as a complete
    section. ⚠ There is NO width gate; if one is ever added the CSS rest
    block takes the same pair (proof.md's "PRM unwraps the console too").

## Alternatives rejected

- **`fillSlots` SSR / a hybrid** — see 4.
- **A pinned stage** — the owner asked for a scroll-through timeline; a pin
  would add a runway and a second clock for nothing the reading needs.
- **`data-m` one-shot reveals** — unobserved on portal nodes and not
  reversible; the zerodrift read needs a beat to go dark again on the way
  up.
- **Ordering by source position** (authoring the station between `#proof`
  and `#practice` in the prototype, no spec) — `landing-v7.md`: order is
  owned by the parse arrays, never by prototype edits.
- **`.voidwalker*` classes** — the `#about` bio's grammar; a shared prefix
  cascades one section into the other.
- **Sharing `.fl-wire*`** — see 8.
- **Dots for markers, a serif display** (both in the reference) — the house
  shape law is diamonds and ADR-067's "never swap in a serif display face".
- **Corner readouts on the masthead** — `#about`'s orbit already carries
  `FIELD · VOIDWALKER`; more instrument chrome is the "overwhelming" the
  owner warned about.

## Invariants

- The cover selector and `nextStation` name the SAME station; the ambient
  bottom gate and fade envelope read the SAME rect.
- `data-station` = `id` = manifest `targetId` = `"voidwalker"`.
- The section sheet is `.vw*`; the drawings are `.vw-wire*`; `.voidwalker*`
  is never written here.
- `useVoidwalkerScroll` is the only writer of `data-vw-ready`,
  `data-vw-beat`, `--vw-p`, `--vw-b` and the decode runs; it writes nothing
  on `<html>` and reads no other clock.
- Every value the hook writes is a pure function of the scroll and the
  cached layout — reversible by construction, no frame remembers another.
- A drawing letters exactly its declared set; one `[data-gold]`; no digit,
  no currency, no `<img>`, `filter: none`.
- The `--w-*` blocks on `.fl-wire__in` and `.vw-wire__in` are equal; one
  light rule serves both.

## Consequences

- The page grows by ≈4.4k px (6.0 / 5.9 / 4.4 viewports at the three
  references; 3.8 at the owner's 1920×1247). Deep links below it land
  after the portal inflates (the detent table recomputes on
  `ResizeObserver`).
- The corner readout renumbers to 07 rows; the journey cluster gains a
  seventh mark; `#practice` is roleless pending its removal.
- First Load JS carries the station + six DOM-only drawings via
  `LandingPage`'s static import (the `AboutStagePortal` precedent).
- Open, owner calls: the GVA 2016 and HLN press have no URL on file (plain
  bars until supplied); the alternating left/right composition the owner
  asked for after this pass (a second pass on this ADR — the record, the
  clock and the drawings are unchanged by it, only the grid).

## Verification

- `npx vitest run tests/lib/voidwalker-*.test.ts tests/lib/rail-manifest.test.ts tests/lib/section-label.test.ts tests/lib/rail-instrument-marks.test.ts tests/lib/v7-parse.test.ts tests/lib/detentTable.test.ts tests/lib/theme-css-sweep.test.ts` — the record (24), the clock (9), the six drawings' markup (25), token parity (2), and every plumbing pin. `npm run verify`: 1004 tests across 53 files, lint and typecheck clean.
- `node scripts/capture-voidwalker.mjs --vp 1280x720|1440x800|1920x1080 [--theme light]` (HEADED — the seam only exists with a live canvas): walks the about runway into the cover (ambient `true` at +0.4vh, `false` at 0.0vh), arms the masthead, lands every marker on the reading line (`--vw-b` = 1 with the next beat ≤ 0.44), scrolls back (resets to 0), measures the six drawings (0 overlaps · 0 collapsed marks · no overflow · PT Mono ≥ 8.6px · one gold) and shoots the plates. Measured clean at all three references in dark, at 1440×800 in light, and at 390×844.
- `npx playwright test tests/visual/services-ring-smoke.spec.ts -g "ambient hold survives" --project=desktop --headed` (re-pointed to `#voidwalker`) and the CI set `landing-corridor-smoke` + `corridor-device-matrix-smoke` — 48 passed across the four projects.

## Rollback

Revert the commit. There is no flag: a relocated station with static shell
markup has one path (ADR-054's reasoning), and a flag would have to reach
into `page.tsx`'s spec, the manifest and the cover rule to be honest.
