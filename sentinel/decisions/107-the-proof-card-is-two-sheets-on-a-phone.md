# ADR-107: The proof card is two sheets on a phone

**Status:** Proposed (2026-09-16) — shipped and guarded, pending the owner's
live read on a device.
**Supersedes, on phones only:** the inert rung's treatment of the proof stack
at `≤960px` (ADR-096 §7, one whole static card per project).
**Related:** ADR-030 (the sticky-sibling mechanic) · ADR-094 (the card) ·
ADR-096 (the homepage promotion, the measured runway) · ADR-097 (the folder,
the depth channel, the head band) · ADR-104 (the wireframe assembly, desktop
only) · ADR-083 (the phone IA for the retired casefile).

## Context

The owner walked the phone build ahead of launch (2026-09-16):

> In the proof section, we have these cards, and I want them to stack on top
> of each other like they do on desktop. There's a difference because on
> desktop we have left and right panels, but here we've split them into top
> and bottom panels. I want the left panel (which, in this case on mobile, is
> a top panel) to come into view, followed by the corresponding right panel
> with the visual or whatever sliding over it. … It needs to be super clear
> that when you scroll through it, it's a pair. … Right now, the mobile cards
> are too long because they're one card and don't really fit the viewport.
> What I want is for every individual panel to fit inside the viewport on
> mobile.

What the phone had: the inert rung (`(max-width: 960px), (max-height: 680px),
(prefers-reduced-motion: reduce)`) parks the slots static and stacks each card
as head + record at content height + field at a hard
`clamp(320px, 60vh, 640px)` — about **1030px on an 844px phone**, four times,
with 24px between. Nothing slides; nothing pairs; every card overruns the
screen.

What the mechanic already allowed: `useStackedCardsScroll` counts
`[data-pc-slot]`s and reads each slot's computed `position` and `top`. It does
not know whether a slot holds a card or half of one.

## Decision

**On the phone rung, every project is TWO sticky slots — its RECORD panel and
its FIELD panel — and the field seats UNDER the record's head band.**

1. **The rung.** `PROOF_STACK_SPLIT_MEDIA =
"(max-width: 960px) and (min-height: 681px) and (prefers-reduced-motion: no-preference)"`
   (`unifiedServicesInstrument.ts`) — the inert rung with its first term taken
   back and the other two kept: a short window and a reduced-motion reader
   still get the four whole cards in flow. Two readers, one string:
   `ServicesStage` (which markup) and the split block in `proof-stack.css`
   (whether it sticks), pinned equal by `tests/lib/proof-stack-split-gate.test.ts`.
   `services.css`'s seat rung is untouched — `position: static` at ≤960 puts
   the pile in flow, and sticky slots IN FLOW is the ADR-094 Trinny mechanic.
2. **The markup.** `ProofCard` takes `panel?: "record" | "field"`. `"record"`
   renders the head band over the record; `"field"` renders the field alone —
   rail, bay, foot, NO head — named by the record's title through
   `aria-labelledby`. The seam is the card's own: everything with state (the
   rail's index, both portal hosts, the field and the consoles it mounts) was
   already on the field side, so each console mounts exactly once and the
   record carries no hook it does not read. Omitted, the card is the whole
   housing — `/arcs/trinny-london/proposal` and every desktop caller pass
   nothing and are byte-identical.
3. **The seat.** `ProofStack` takes `split`. Record k gets `--i: k`,
   `data-pc-index 2k`; field k gets **`--i: k + 1`**, `data-pc-index 2k+1`.
   The record's head row IS `--pc-peek` (the card's grid), so
   `top-base + (k+1)·peek` is literally "record k's top + its band" — the
   field seats under the band by construction (the ADR-104
   `.pf-cardwire { inset: var(--pc-peek) 0 0 0 }` idiom). It is also record
   k+1's pin line, so the next project covers field k edge to edge and what
   survives of pair k is its band. `--pc-n` is `tracks + 1` (one band per
   project plus the field's own step), so `--pc-card-h` = `100svh − top-base
− 4·52 − 24` = **548 @844 · 484 @780 · 636 @932**.
   ⚠ **The host REMOUNTS the stack on the query** (`key`), because the hook
   collects its slots once at mount. The server snapshot is `false`; the pile
   is eight viewports below the fold, so the swap is never on screen.
4. **The band carries the pair's identity.** On the record panel the head
   band letters the kicker (`client · phase`) over ONE ellipsised line of the
   arc title (`.pf-card__headtitle`, 13px, `--weight-lit`). ADR-097 U7 emptied
   the band deliberately on desktop; on the pile it is the one strip a covered
   pair shows, and three of the four phases read `Build` — a band of
   `client · phase` alone could not say which project's field is open beneath
   it. The head row is the grid's `--pc-peek` row with `overflow: hidden`, so a
   wrapping kicker can never move the seat (the smoke pins 52).
5. **The channels, per panel.**
   - A record does NOT recede for its own field: `.pf-slot--record { --pc-dp:
calc(var(--pc-depth) - var(--pc-cover)) }` drops the first term (the
     field's enter). Its COPY still leaves on the cover channel (the base
     rules) and its body goes `visibility: hidden` once `covered` — the band
     stays, the text under the arriving field goes, the field slides over an
     emptied sheet. Recession starts when record k+1 rises.
   - A later pair counts TWO enters, so `--pf-recede` .03 → **.015** and
     `--pf-dim` .08 → **.04**: one pair is one desktop step.
   - The field panel is cut **bottom-left only** — its top edge sits under a
     band, and a TR cut there draws a second housing's corner against a
     straight edge. ADR-065's single-notch clause (oriented or connected) is
     the reading: the sheet is connected to the tab above it. The record keeps
     TR+BL.
   - Dwell: 12svh on a record, 18svh on a field (dials). The tail is back
     (`clamp(280px, 40svh, 400px)`).
   - **No blur on the phone.** Eight glass panels over a bed that (ADR-108)
     becomes a live canvas; the per-frame backdrop snapshot is the one cost
     this card has. `--pf-glass-a` .62 → **.74**, the sheet's own recorded
     fallback.
6. **The record's type budget.** `--pf-display: 22px; --pf-copy: 15px` on the
   split record (one rung down on both faces). Measured at 390×844: every
   record's `scrollHeight === clientHeight` (496), title 48px, claims 257–278px,
   last rule 18–20px above the floor — nothing clips, nothing pools.

## Measured (Chromium phone emulation, 390×844, SwiftShader)

- 8 slots, all sticky, `--pc-n` 5; record 0 pins at 64, field 0 at **116 =
  64 + 52**, record 1 at 116, … field 3 at 272; every panel 548 tall, bottom
  at 820 ≤ 844 − 24.
- Field 0 pinned ⇒ record 0 `covered`, its body `visibility: hidden`, its band
  visible at 52px; the field's bay **454px** tall.
- Record 1 pinned ⇒ its top on field 0's line; pair 0 shows exactly its band.
- `capture-proof-stack.mjs --mobile --pairs --headless` shoots the four states;
  `tests/visual/proof-stack-mobile-smoke.spec.ts` pins all of the above on the
  two Chromium phone projects added to `playwright.config.ts`
  (`iphone-14-chromium`, `iphone-14-pro-max-chromium` — the WebKit descriptors
  on Chromium, since WebKit cannot reach the dev server).

## Alternatives rejected

- **Nested sticky panels inside one slot.** A sticky element needs scroll
  inside its containing block, and a slot is exactly `--pc-card-h` tall —
  there is none. The hook's geometry read (`computed.top`, `position`) is per
  slot besides.
- **One shorter card** (a smaller field, tighter type). The field's evidence —
  a 4:5 film, the map's three readings, the ads wall — is the reason the card
  exists, and it does not fit in half a phone screen beside a record.
- **Eight slots on desktop too.** The desktop card is one housing with two
  columns and reads as one object; two sheets there would be the phone's
  workaround exported.
- **A `"continued"` head on the field panel.** Both panels with a full band
  reads as two folders; the owner picked the field sliding under the record's
  band.

## Left open

- ⚠ **Chromium's emulated iPhone lays the page out 421px wide** (pre-existing,
  every route, PRM too): something overflows `100vw` and the emulator zooms
  out, so `innerHeight` reads 912 on an 844 window. The owner's real-device
  screenshots show no overflow. The smoke measures against
  `documentElement.clientHeight`; the overflow itself is a separate finding.
- The sheets and map fields have not been read on a phone since ADR-097 U10's
  frames; the `--pairs` capture shoots all four fields for the owner's read.
- The dwells (12 / 18svh) and the recession halving are dials set by
  arithmetic, not by eye — the device read decides.

## Files

`components/landing/home-v2/services/proof-stack/ProofCard.tsx` ·
`ProofStack.tsx` · `proof-stack.css` (§8) ·
`components/landing/home-v2/services/ServicesStage.tsx` ·
`components/landing/home-v2/unifiedServicesInstrument.ts` ·
`playwright.config.ts` · `tests/lib/proof-stack-split-gate.test.ts` ·
`tests/visual/proof-stack-mobile-smoke.spec.ts` ·
`scripts/capture-proof-stack.mjs` · `.claude/rules/proof-stack.md`.

## Update 1 — the WebKit projects are deleted, not worked around (2026-09-17)

ADR-107 found that `devices["iPhone 14*"]` carries
`defaultBrowserType: "webkit"`, that WebKit honours the dev server's
`upgrade-insecure-requests` CSP **on localhost** where Chromium exempts it, and
that every sub-resource therefore goes to `https://localhost:3003` against an
HTTP server. Its fix was to add `-chromium` COPIES of the two phone shapes.

⚠ **IT ADDED THE COPIES AND LEFT THE ORIGINALS IN THE PROJECT LIST**, so the
WebKit projects kept running and kept failing — and `tablet`
(`devices["iPad Mini"]`, also WebKit) never got a copy at all. The result is
that **`Corridor smokes (Playwright)` has been red on `main` continuously**,
with `landing-corridor-smoke:97` and `corridor-device-matrix-smoke:37` timing
out at 30.2s on `iphone-14`, `iphone-14-pro-max` and `tablet`. Both hang on the
same line — `waitForSelector(".home-v2-stage")` — because the page arrives with
no CSS and no React.

⚠ **AND NO RETRY COULD EVER HAVE HELPED**: the browser is asking for a URL that
does not exist. Three retries each simply cost 90s apiece. Measured in WebKit
locally: `#home-corridor-mount` present, `innerHTML` empty, every
`_next/static` chunk and every font failing with "A TLS error caused the secure
connection to fail".

All three projects are Chromium-backed now; the descriptors still carry the
viewport, DPR, touch and mobile UA, which is what they actually guard. CI
installs **chromium only** — the workflow installed WebKit with a comment
saying Chromium-only "left the three WebKit projects failing at browser
launch", which is true and beside the point: making them launch was never what
stopped them reaching the server.

⚠ **THE `-chromium` SUFFIX STAYS** on the two phones though nothing is WebKit
any more. It reads as a lie about the browser, and renaming would break every
recorded verify recipe in `.claude/rules/mobile-sections.md`,
`.claude/rules/services-ring.md` and several ADRs. It now means "the phone".

### The other guard this exposed: a byte-size proxy that outlived its machine

`landing-corridor-smoke:324` (ADR-081's "the time tunnel does not claim the
camera") asserted the frame's **PNG WEIGHT** — floor 150 kB, against a bug
measured at 69 kB and a healthy frame at 292 kB. It failed on `main` too, and
it was **not** the WebKit problem: headless Chromium with software GL renders
the same healthy scene at **128–145 kB**, i.e. below the floor. The corridor
was painting perfectly; the still proves it.

⚠ **THE TEST PREDICTED ITS OWN FAILURE AND THE PREDICTION WAS NOT ACTED ON** —
its comment says "font/GPU differences move the number between machines". A
proxy that moves with the environment cannot carry an absolute threshold.

The probe is **ink, and it calibrates itself**: the centre of the frame, where
the armillary paints, against a **starfield-only strip of the same frame**.
Both samples come from one screenshot on one machine, so the GPU, the fonts and
the DPR cancel. Measured healthy: centre **2.81 %** against field **0.22 %** —
a 12.8× separation, with the gate at `field × 2 + 0.004` (0.84 %). The bug
parked the camera and left the centre as bare starfield, which is exactly the
state this ratio collapses to.

⚠ **THE SAMPLE IS THE SCREENSHOT, NEVER THE CANVAS.** `toDataURL()` on a WebGL
canvas returns a BLANK image unless the context was created with
`preserveDrawingBuffer` — the first cut measured 0.00 % on both samples of a
frame that was painting. Playwright's screenshot is the composited result and
is what the reader sees. ⚠ The field strip sits at 6–20 % of the width,
inboard of the left HUD rail (~2–4 %), so it is starfield and nothing else.

### Verifying

```bash
npx playwright test tests/visual/landing-corridor-smoke.spec.ts \
  tests/visual/corridor-device-matrix-smoke.spec.ts --reporter=list --workers=1
```

**54 passed, 0 failed** — the job's first green in days. The new gate was also
forced to fail, to prove it still can.
