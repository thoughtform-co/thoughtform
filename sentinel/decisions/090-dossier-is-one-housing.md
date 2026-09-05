# ADR-090: The dossier is one housing

- **Status:** Proposed (2026-09-05) — shipped and guarded, pending the owner's live read
- **Surface:** `/arcs/loop-earplugs` → the four `dossier` beats · `components/arcs/arcs.css` ·
  `tests/visual/arc-portfolio-smoke.spec.ts` · `next.config.mjs`
- **Supersedes on composition:** ADR-072's two-column dossier layout. Its content contract
  (`{ toolId, legend, head? }`, one tool per beat, the shared bay) is untouched.
- **Ports:** [ADR-089](089-casefile-is-one-housing.md) (the grammar), [ADR-088](088-casefile-left-column-ladder-and-rhythm.md)
  (split the slack), [ADR-065](065-corner-law.md) (the corner law, rule 4)
- **Bound by:** [ADR-076](076-portfolio-flows-and-the-architecture-beat.md) (the page flows),
  [ADR-079](079-portfolio-trajectory-and-the-beat.md) (one beat per screen),
  [ADR-077](077-arcs-ink-ramp.md) (the ink ramp)

## The defect, measured

The owner read the dossier beats against the homepage proof casefile — which ADR-089 made one
machined slab — and asked for the same alignment discipline here.

The beat was two objects. `align-items: start` aligned the tops; **nothing aligned the bottoms**,
so at 1280×720 the record column overhung the console by:

| beat            | record | console | overhang   |
| --------------- | ------ | ------- | ---------- |
| `tool-vesper`   | 583.1  | 494.4   | **88.7px** |
| `tool-mimir`    | 551.7  | 494.4   | **57.3px** |
| `tool-babylon`  | 503.0  | 494.4   | **8.6px**  |
| `tool-heimdall` | 565.3  | 494.4   | **71.0px** |

⚠ **A different amount per tool, which is why it read as accident rather than composition.** The
record's three horizontal rules terminated on nothing, and there was no vertical the two halves
registered against.

⚠ **AND THE CONSOLE WAS SIZED AGAINST A PADDING IT DOES NOT SPEND.** `--arc-dossier-h` subtracted
`2 × --arc-stage-pad` (`clamp(96px, 14vh, 200px)`) while the beat pads by `--arc-sec-pad`
(`clamp(40px, 6vh, 104px)`, ADR-079) — 201.6px budgeted against 86.4px spent at 1280×720, so the
field ran **115px shorter than its own beat afforded** while the record overhung it. Two halves of
one defect: the column that had spare height was the one being cropped.

## The decision

`.arc-dossier` is a machined housing and the console inside it is a cell.

1. **The housing** — TR+BL chamfer on ADR-065's plate rung (`clamp(16px, 1.8vw, 26px)`, the value
   `.arc-prog` already cuts), `--arc-plate` ground, a `--arc-seam` edge.
2. **A header band fused to the top edge**, lettering the designation alone.
3. **The column split** at the record's right edge — the vertical every horizontal terminates on.
4. **Two weights**: `--arc-seam` .28 divides regions, `--arc-rule` .12 rules within one.
5. **Both columns end on the housing's floor**, the row content-driven.
6. **The record's surplus goes into four seam tracks**, not a hole under its last block.

### Why a border and not ADR-089's clipped ring

The casefile needs a gold gradient lip, and a `clip-path` **cuts** a border rather than stroking
one — hence its two-contour path with the `ch − 0.6px` inner correction. This housing takes a flat
dawn edge, so a plain `border` under a single-contour clip is correct and an order of magnitude
simpler. **Do not port the ring.**

### Why no gold on it

The record column already spends gold on three objects — the mode badge, the route arrow, the
`NOW` plate. A fourth gold edge around all of them is ADR-068 U5's RUN-plate argument one object
later: gold buys one thing per drawing.

### Why the band letters one thing

ADR-089 U1's ruling. The bay's FEED line already prints `IN SERVICE {year}`, so a right-hand slot
would be this surface's said-twice. ⚠ **Unlike the casefile's, the rule runs FULL WIDTH** — that
one stops at the split because `ConsoleRail` is the field's own header on the other side, and a
dossier console has **no rail** (one tool, nothing to switch), so nothing collides with it.

### Why it is CSS-only

`tests/lib/arc-terminal-markup.test.tsx` pins `class="arc-dossier__console arc-ap"` as an exact
string and counts exactly 12 `data-arc-decode`. The designation is already absolutely positioned,
so the band is built by releasing its containing block — no markup moves, and neither pin can.

## What the build taught, and none of it was visible in a gate

### ⚠ THE REVEAL OBSERVER HAS A DEAD BAND, AND A BEAT THAT FILLS ITS VIEWPORT PARKS IN IT

The ADR-052 reveal runs at `rootMargin: -10%`, so **the bottom tenth of the viewport never
triggers an intersection**. Once the housing sized itself to the beat's whole budget, the record's
last block landed there at rest: at 1920×1080 `.arc-dossier__stack`'s top measured **975 against a
root bottom of 972 — it missed by 3.1px** and stayed at `opacity: 0` forever, on a beat where the
other five revealed.

⚠ **The cost is DOUBLE the clearance**: shrinking a beat re-centres it, so half of what you take
comes straight back. 50px of budget buys ~25px of margin — which is why `--dos-reveal-clear` is a
`vh` term and not "a few more pixels".

⚠ **It binds only where the CONSOLE sets the row.** At 1280×720 the record is the taller column,
so the clearance changes nothing there — which is exactly why 1280 passed and 1920 did not, and
why a single-viewport check would have shipped it.

### ⚠ THE CONTAINING BLOCK WAS THE REVEAL WRAPPER, NOT THE HOUSING

Releasing `.arc-head__lead` from `position: relative` was not enough to reach `.arc-dossier`:
`.arc-head` also carries `.arc-reveal`, whose **transform makes it a containing block for absolute
descendants**. The designation landed on the record's first line and printed straight through the
title. `.arc-dossier .arc-head { position: relative }` is declared so the anchor is the same box
whether the reveal has resolved or not — left implicit, the seat would depend on animation state.

### ⚠ THE HOUSING'S INSET IS PAID FOR BY THE FIELD

The record column is a fixed fraction, so every pixel of padding comes off the console. The first
cut at `1.4vw` took it 585 → 562 and pushed `.fl-bay__top`'s FEED line **52px** into a clip it was
already **28.8px inside at this viewport before the pass**. `--dos-pad` and the grid gap are tuned
together so the field lands back at 585.6 and the clip returns to 29 — this pass costs that line
nothing. The pre-existing clip is ADR-068's own budget and is left open.

### ⚠ THE HOUSING CHANGES THE RECORD'S BED IN LIGHT

`--arc-plate` is `.55` in dark, so `bedOf()` walks past it to the section; in light it is **fully
opaque** and becomes the bed for every rung in the record column. Five of them
(`__legend`, `__copy`, `__chain li`, `__now`, `__stack li`) had never been in the contrast walk,
because until the housing they sat straight on the page's own ground. They are in it now — and the
count guard could not have caught their absence, since it only notices a listed selector that
stops matching.

⚠ **The stack tag is pinned at 4, not the 4.5 standard, and the first cut of that pin FAILED.**
Measured 4.41 dark / 4.79 light — both pre-existing. It is 8.5px mono caps naming a stack, i.e.
chrome by ADR-063 U2's split, the same class as the designation at 3 and the dossier key at 4; 4.5
was over-claiming rather than the tags being wrong. It rides `--arc-ink-50`, a shared rung, so
lifting it is a ramp-wide change and not this pass's.

### ⚠ THE SEAM RUNG IS LIFTED IN LIGHT, NOT CARRIED ACROSS

Every line rung on the ADR-077 ramp gains ~1.8× in light (.08 → .16, .12 → .22, .14 → .26). A seam
left at its dark .28 while its own `--arc-rule` sibling lifts to .22 would collapse the two-rung
ladder to nothing on parchment. 1.5× rather than 1.8× because the lift compresses at the heavy end
(`--hud-rail-line` holds .55 in both themes).

## Scope

**The four dossier beats only.** Studio, Films and Architecture are a different composition — one
centred console under a title — and stay as they are. `#overview` is already a chamfered
`--arc-plate` housing.

⚠ **`.arc-sec--prog[data-holo="live"] .arc-prog` strips that housing when the WebGL instrument is
live**, so the board's frame is what the _fallback_ draws (and what the WebGL-off smoke measures),
not what a real GPU shows beside the dossiers. This pass is new paint on the page, borrowed from
ADR-089 — not a local precedent being matched.

⚠ **Gated at `(min-width: 981px) and (prefers-reduced-motion: no-preference)`** — the same pair
console.css unwraps on. A housing whose field has no frame is a box round a stack of flow content.
Below the gate every rule is absent and the beat is byte-identical to what shipped, which is why
there is **no restore block**.

⚠ **Everything is `.arc-dossier`-scoped.** Studio, Films, Architecture and the landing mount the
same `ConsoleFrame` with no housing to belong to, and `tool-gallery-markup.test.tsx` holds a byte
snapshot of the landing's composition.

## Also in this change

`/arcs/portfolio` → `/arcs/loop-earplugs`, 308, in `next.config.mjs`'s `redirects()` beside the
`/v7` precedent. The slug was renamed and `dynamicParams = false` closes the prerendered set, so
the old URL 404'd — and an arc is unlisted, its whole distribution being a link somebody forwards.
⚠ Redirects resolve at step 2 of the request pipeline, before `proxy.ts` and long before the
dynamic route 404s at step 7. ⚠ `next.config.mjs` is not hot-reloaded.

## Verification

- `npm run verify` — 1311 unit tests, lint, typecheck.
- `arc-portfolio-smoke --project=desktop` — 13 passed, 1 skipped.
- `arc-terminal-smoke --project=desktop` — 10 passed (the two client decks untouched).
- `node scripts/capture-arc-portfolio.mjs` at 1280×720 and 1920×1080, both themes.

Measured after: `bottomDelta 0` on all four beats, console 494.4 → 575.4 at 1280×720, every beat
at 1.001 viewports, reveal 6/6 with 38–65px of margin to the observer's root bottom.

⚠ **Six pre-existing failures on the `iphone-14` and `tablet` projects are NOT this pass** —
identical with the change stashed. The characteristic one is `mimir: the drawing's aspect expected

> 1.5, received 0.88`, i.e. casefile.css's ≤960 `.fl-wire` rung, which renders nowhere else in the
> repo.

## Left open

- The FEED line's 29px clip at 1280×720 (pre-existing; `.fl-bay__top` neither wraps nor shrinks).
- `--arc-ink-50` at 4.41:1 in dark on the stack tags (pre-existing; a ramp-wide question).
- The seam ratio is four even shares. ADR-088 used 1:2 because its grouping was 2:1; the grouping
  here (identity / record / mechanism) is arguable and was not worth pre-solving blind. **The ratio
  is the dial** if the rhythm reads wrong at tall viewports.
- Whether Studio, Films and Architecture should follow. Their fill/aspect gates are tightly pinned
  (`fillUnion > 0.85`, `fillW > 0.85`, aspect windows), so it is its own pass.
