# ADR-068: The glyphed index, the tool dossier, and authored wireframes

- **Status:** Accepted
- **Date:** 2026-08-07
- **Owner call:** yes (mockup + four scope decisions, this date)
- **Surface:** `components/landing/home-v2/services/casefile/**`, `lib/cases/**`,
  `components/landing/v7/tools-cards/**`
- **Builds on:** [ADR-067](067-casefile-type-and-clutter.md) (the type ladder and
  the four-claim register this reshapes), [ADR-066](066-casefile-one-rail-one-foot.md)
  (the rail whose diamond returns, the foot that stays), [ADR-065](065-corner-law.md)
  (amended — Update 1 there is this ADR's notch), [ADR-064](064-casefile-console-frame.md)
  (the console frame everything still renders inside; U1's "one designation" refined;
  U2's authored/captured line extended), [ADR-063](063-map-reading-rail-and-wheel.md)
  (the gold ramp discipline the green now follows), [ADR-059](059-rail-instruments.md)
  (the "no icon vocabulary" precedent consciously overruled, §Decision 2),
  [ADR-056](056-services-proof-casefile.md) (the casefile itself)
- **Rules:** [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

Two owner mockups drove this pass. `proof-page-blocks-left.html`
(2026-08-07, I:\ branding drive) is **canonical**; `thoughtform-proof-panel-v2.html`
(2026-08-06) is its superseded ancestor — codename tabs, three field variants,
a panel foot. Where the two disagree, blocks-left wins; where blocks-left and
production law disagree, the law wins and the difference is recorded here.

The information-architecture ruling that motivates everything else: **the left
column carries the program, the right panel carries the tool.** The Software
row's register described the four tools one tile each — restating the gallery
its own panel tabs through, two boxes away. The owner's standing rule: left =
key figures and achievements of the whole engagement row, uniform grammar
across all four files; right = functional explanation of the selected thing.

Four scope decisions (owner, 2026-08-07): the index register applies to **all
four directory rows**; rail **ordinals stay dead** (ADR-066's ruling holds over
the mockup's `01–04`); the **ROUTE diagram ships** on every tool's panel; detail
plates print **team names, no headcounts** (the mockup's counts are documented
nowhere — nothing unverifiable goes on a public page).

## Decision 1 — the register is a glyphed INDEX: rows, not boxes

The 2×2 plate grid becomes a vertical list on all four files: a pixel glyph in
an 18px gutter, the CLAIM beside it, the evidence sentence under it, hairline
row separators. **Non-interactive on purpose** — the mockup wired its rows as
tool selectors, but that was placeholder content; with program-level claims
there is nothing to select. The browse band owns row selection, the rail owns
tool selection, and the register is a static instrument.

Class names (`fl-proof-register__list/__item/__claim/__description`) survive
verbatim — four smoke assertions key on them, including the ≤1px register↔
directory edge-alignment law. The glyph gutter lives INSIDE the register box.

**The compact/tall geometry, measured (all numbers live in casefile.css
comments beside their rules):**

- Compact (default, up to 1069h): glyph 14px, one-line claim, sentence
  sr-only-clipped (present for readers, absent for the eye). Four rows fit the
  86px box at 1280×720 with 0 overflow (rows ≈21.6px).
- Tall (`min-height: 1070px`): glyph 21px, sentence visible up to two lines,
  `--fl-proof-h: clamp(264px, 24svh, 300px)`.
- ⚠ **1070 is a DIRECTORY constraint, not a taste.** Four two-line rows cost
  259.5px and the directory needs 144; the seam→tick-11 band only reaches
  425px at 1070h. The plan's 1000h would have clipped the directory by 36px —
  and the OLD 931h rung had the same latent defect (~21px of directory clip at
  960h), so the threshold move is a fix wearing a redesign's clothes.
- ⚠ **The two rungs must TILE.** An integer 999/1070 media pair left 1069h
  printing full sentences into a 128px box — 116px of silent clip. The sr-only
  rung ends at 1069.98px exactly.
- ⚠ **`align-items: center`, never `baseline`:** grid synthesizes a replaced
  element's baseline from its bottom edge, so a baseline-aligned glyph hangs
  below the claim and grows every row (+13px against 6.5px of 720p slack).
- The list is `grid-auto-rows: 1fr` so the hairlines sit at the same heights
  on every file — without it the register reflowed 73px between directory
  clicks (only the Software file's sentences all wrap to two). `1fr` is
  `minmax(auto, 1fr)`: a row still overflows loudly rather than truncating.
- The 931–1069h band renders compact. No reference viewport occupies it;
  recorded here rather than smoke-watched.

## Decision 2 — pixel glyphs, against the ADR-059 precedent, and why this isn't that

ADR-059 §4 retired a 14×10 clip-path icon set with _"this codebase has
deliberately never had an icon vocabulary"_ — at that size every cut collapsed
to the same bordered-box silhouette. `sectionGlyphs.tsx` re-opened the question
with stroke figures. The register glyphs are a third, already-sanctioned
medium: the brand's own documented **particle-icon grammar**
(`.claude/skills/thoughtform-design/references/particle-icon-grammar.md`) —
skeleton (dawn .85) + signal (gold, the mark role) + drift (dawn .28, displaced
exactly one grid unit along ONE axis), composed from the six primitives, ≤16
skeleton+signal pixels, 7×7 grid rendered at integer cell multiples only
(14px/21px — never the mockup's 24, which is a fractional 3.43px cell).

Three defenses specific to this seat:

1. **Annotative, not load-bearing** — the claim is always printed beside the
   mark, so the sectionGlyphs failure test ("if you need the labels to tell
   them apart, the set has failed") cannot strand a reader.
2. **Mechanized anti-patterns** — `tests/lib/proof-glyphs.test.ts` pins bounds,
   pixel budgets, drift one-axis displacement and non-overlap, and pixel-set
   uniqueness across keys; `cases-registry.test.ts` pins key validity and
   per-track uniqueness (a glyph may repeat across rows — the sets are never
   co-visible — never within one).
3. **The contact-sheet check is part of the process, and it fired:** rendering
   all 16 in one sheet before anything shipped caught `ownership` (four corner
   brackets + gold centre) reading as `gap`'s sibling INSIDE the tooling set —
   the exact ADR-059 failure mode. Redrawn as an open-top vessel holding the
   anchor. Run the sheet again whenever a glyph is added.

Content carries only a `glyph?: string` KEY (`CaseBlock`, `lib/cases/types.ts`);
the drawings live in the renderer layer (`proofGlyphData.ts`, import-free, the
`skillSymbol.ts` pattern). One mockup-fidelity note: the mockup's `collapse`
drift `[2,2]` was a DIAGONAL neighbour — the grammar displaces along one axis —
so it shipped at `[2,1]` with skeleton and signal byte-identical.

## Decision 3 — the Software register speaks for the program

The four claims (registry-pinned at `cases-registry.test.ts`, budgets
title ≤27 / sentence ≤95 unchanged from ADR-067):

| glyph       | claim                     | the sentence carries                                                     |
| ----------- | ------------------------- | ------------------------------------------------------------------------ |
| `gap`       | Too specific to buy       | the category: between generic SaaS and an unjustifiable agency build     |
| `collapse`  | Rebuilt, not accelerated  | five sources → one surface, five handoffs → one flow, nothing retyped    |
| `ownership` | Owned by the teams        | built with the workflow owner; localization product-manages its own tool |
| `substrate` | One substrate, four tools | shared encoded judgment; one tool was extracted from another             |

Sourced from the tool repos and the aether keynote (the "software for few"
pattern file is canonical in Loop-Vesper's docs); every string passes the
confidentiality scans. Where the old tool-describing content lives on is
commented at the trim site in `loop-earplugs.ts` — the one-line tool
descriptions became the detail plates, and `PROJECT_CASES.capabilities` stays
canonical for the Arc card and `ToolCardConsole` (unrendered on this plate).

## Decision 4 — the tool dossier: header → route → bay → detail → foot

`ToolGallery` keeps `ConsoleFrame` + `ConsoleRail` + the ADR-066 foot; the
field between them is rebuilt.

- **The rail navigates with SHORT HANDLES and the header designates.**
  `ProjectCase.tab` (≤14 chars: BRIEFING AGENT · IMAGE & VIDEO · UGC DUBBER ·
  STUDIO PM) drives the stations; the full functional name + `IN SERVICE
{year} —` moved to the plate header. This refines ADR-064 U1 rather than
  breaking it: one designation per surface — the rail is navigation, the
  header is the designation. ⚠ The `data-n="4"` diamond is BACK: ADR-066 hid
  it on real arithmetic (22-char labels needed 136px against 122.9 available);
  the handles need 68–106px, so the input changed, not the math. Tracking
  restored to .16em. ADR-066's escape hatch ("shortening a client's tool name
  is not a layout fix") is satisfied the only lawful way — the OWNER renamed
  them.
- **The ROUTE is the argument drawn.** `RouteDiagram.tsx`, pure SVG from
  `ProjectCase.route` data: outlined chamfered steps → three gathering
  chevrons → one green NOW module with echo outlines; captions and meta lines
  above/below. ⚠ **viewBox is `0 0 560 66`, and the binding viewport is
  1440×800, not 720p:** the SVG's rendered height rides the field's WIDTH
  (`height:auto`) while the field's height budget rides viewport HEIGHT — 72
  units overran the field by 3px at 1440×800 while 720p had room. At 560 units
  one unit ≈ one pixel at 1280; minimum rendered text 8.70px. ⚠ The ≤760h rung
  crops the caption/meta bands with `margin: -2.143%` (exactly 12/560 — a
  percentage margin resolves against the same width the height derives from,
  so one constant is exact at every viewport); `display:none` on SVG groups
  frees zero pixels.
- **The bay wraps the walkthrough, which is byte-untouched.** The `.fl-shot`
  frame is still the ONE button; `MediaLightbox` still does the playing
  (ADR-056 U5/U8 — no inline video, no second lightbox); `useCloseOnCasefileFold`
  and the one-frame-late focus restore stand. New chrome: `FEED` /
  `WALKTHROUGH · {duration}` top line, four corner brackets, transport
  chevrons in the existing bar, and a decorative RUN plate (SVG, aria-hidden,
  pointer-events none, chamfered TR+BL — a key on a housing). ⚠ NO `T-01`
  feed ids — ordinals in costume. The capture floor dropped to
  `clamp(70px, 9svh, 180px)`: the screenshot loses pixels before a sentence
  loses meaning (ADR-066's order of sacrifice).
- **The detail 2×2** renders `ProjectCase.detail` — WHO IT SERVES / WHAT IT
  REPLACED / WHAT RUNS IT / WHERE IT RUNS, answers ≤32 chars, `accent:
"own" | "gold"`. Plates are the two-layer stroked chamfer with a SINGLE
  notch on the **bottom-left** corner (the lawful TR/BL diagonal — the
  mockup's TL flipped), depth `clamp(9px, 1.7cqw, 13px)`, one nesting level
  inside the chamfered console — the ADR-065 Update 1 exception. ⚠ The inner
  layer is OPAQUE ground + wash on top: a translucent inner over the 1px edge
  layer floods the whole plate with the edge colour. Below 480px the grid
  wraps 1×4 (a 193px column cannot hold `ENCODED SKILL · EVERYDAY LANE`).
- **Green joins the ramp discipline** (ADR-063: hue is the brand, lightness is
  the role). `--atreides-ink` (dark `#7a9e6a` ≈6.7:1 on void; light `#3f5a2e`
  — the exact value the PDA already used for `--pda-grnh`, 5.3:1 on parchment)
  is green-as-TEXT; `--atreides-light` stays line work; `--fl-own-wash` is the
  own-plate ground (alpha lifts in light — an alpha inverts its meaning across
  the flip). Light-theme composited samples: own value 4.80, gold value 4.91
  (`--gold-ink`), NOW stroke 4.90. One measured lift: the route's step-box
  outline at α .3 read 1.94:1 in light and the reader COUNTS those boxes, so
  it carries α .5 (3.33:1) — line work that is the drawing, not decoration.
- **Two data corrections:** `babylon.year` and `heimdall.year` 2025 → 2026
  (first commits 2026-02-03 / 2026-02-10; consumers are this header + the
  project-cards lab — the Arc bake reads no year).

## Decision 5 — authored wireframes replace captures, tool by tool

The bay's capture is the walkthrough's face, and a duotoned screenshot reads
as exactly that. Where a tool's UI can be DRAWN — an abstraction in the
casefile's own vocabulary that resembles the layout and its functionality — the
drawing replaces the capture. **ADR-064 U2's line extends rather than bends:
the line is AUTHORED vs CAPTURED, and a wireframe is authored evidence — it
takes NO duotone and no `<img>`.** The smoke's both-halves assertion becomes
per-tool: a capture tool must be filtered; a wireframe tool must have no img
and no filter. The principle tightens — the assertion can now tell a
deliberate exception from a treatment that silently stopped applying, per
tool.

- `TOOL_WIREFRAMES` registry (`casefile/wireframes/`) — a tool absent renders
  its capture; **vesper ships first** (the session view: session rail, one
  generation row of prompt card + output tiles, the floating bottom-centre
  composer with reference strip / enhancer wand + scramble / parameter row,
  the mode bar, the top chrome). Drawn DOM-first so it reflows with the bay
  box (no SVG letterbox against the bleed law), micro-labels in `--fl-mono`
  at the 8.5px floor, gold as the only signal colour — green stays provenance
  and nothing here is "Loop's own".
- ⚠ **The draw readout is a METER, never a figure.** The real Vesper prints
  USD; this page may not (the map's "Never a price." line). The one deliberate
  divergence from the tool's own UI, recorded here.
- ⚠ The drawing sits UNDER the halftone veil and the RUN plate (z<2), and the
  middle ~98×40 is covered — nothing load-bearing dead-centre.
- Mímir, Babylon and Heimdall keep captures until their wireframes are
  authored — each is its own small pass against this contract.

**Vesper's drawing, measured (2026-08-07):** binding box 639.9×86.4 at
1440×800 (labels 8.6px; 10px at 1920); zero overflow and zero collapsed
elements in every state including the 900px 16:10 unwrap and PRM. Three
authoring lessons for the next three wireframes:

- `PRODUCT LIBRARY` LEADS its thumb row — trailing it ran 27px under the RUN
  plate, which is centred on the FRAME while the composer is inset per side.
- The session rail draws at ~1.9% width, not the app's 7% — the bay is ~3×
  wider relative to its height than the window being drawn, so the drawing
  keeps ORDER AND ADJACENCY, never window ratios.
- ⚠ A pure-`cqh` size ladder needs `cqw` caps, and the failure is SILENT: at
  900px a 52% reference square grew to 97px inside a 110px card while the
  meta bars collapsed to ZERO — invisible, with every overflow assertion
  green. The smoke therefore asserts collapsed-element counts, not just
  overflow. The filter law is mutation-checked (filtering the wireframe fails
  the smoke with "it is AUTHORED").

## Fixed in passing — the console unwraps under reduced motion

Pre-existing, surfaced by this pass's measurements: casefile.css enters static
flow at `(max-width: 960px), (prefers-reduced-motion: reduce)` but the
console's unwrap gate keyed on width alone — a desktop-width PRM visitor got
an absolute-positioned console inside an auto-height parent, which resolves to
**height 0 on every plate** (field overflowing the invisible box by up to
326px, measured at 1440×800). The two media conditions are now the same pair,
and the PRM smoke case asserts a visible console with real height and a
non-overflowing field.

## Open, deliberately

- **The mobile route wants a different DRAWING, not tuning.** Five 12-char
  labels at the 8.5px floor need ~335px of glyphs against a ~312px column —
  no single-row arrangement fits. A vertical chain is the likely shape; the
  SVG's aria-label carries the route in words meanwhile.
- Three wireframes to author (mímir, babylon, heimdall).
- `--pda-grnh` could re-point to `var(--atreides-ink)` (same value, one
  token) — a one-line sweep with its own light-theme eyeball.
- The aether keynote's tools count says "Two are live" beside a "3 tools"
  tile while four are in production — an aether-repo inconsistency, outside
  this repo, flagged to the owner.
- **Desktop PRM renders the whole casefile in a ~271px column** (`.fl-case`,
  `.fl-panel`, `.fl-brief`, `.fl-dir` all 271px at 1440×800 PRM — every row,
  both bay branches). The unwrap fix above made the console VISIBLE there;
  the column width is its own pre-existing defect. Inside it, `.fl-run` pins
  at its 98px ceiling (its `15cqw` has no container once `.fl-con` drops
  `container-type`) — 41% of the column. A PRM-desktop layout pass is its own
  session; commit 4's PRM smoke case asserts console HEIGHT, so add a width
  floor when that pass lands.

## Verification

`npm run verify` green per commit (589 unit tests, incl. the new proof-glyphs
suite and the extended registry guards). `services-ring-smoke` green per
commit (12 passed / 1 skipped) with the new assertions: glyph spans at every
viewport, sr-only sentences below 1070h, route presence + PT Mono + rendered
type floor, detail plate count + BL-notch clip-path signature, diamonds
visible at `data-n="4"`, per-tool filter split, light-theme composited
contrast samples, PRM console height. Register measured at
1280×720 / 1440×800 / 1440×900 / 1920×1080 / 2017×1269 + 430×932; field stack
measured on all four tools × three viewports; overflow sweep 0 everywhere.
The ring suite is untouched and green — the runway split held.

## Update 1 (2026-08-07, owner feedback on the live build) — the dossier breathes

Six changes from the owner's first live review, same day:

1. **The console is the mockup's panel, verbatim** — one dawn-08 hairline,
   chamfers **TL+BR** (an owner override of ADR-065's diagonal; ADR-065 U2
   records it), the gold glow hung off the top edge, scanline, opaque ground.
   The orbit ellipses and the `.fl-con__outer` bezel — the v18 rig ADR-063
   ported — are deleted, markup and chrome. Three concentric outlines around
   a screenshot read as decoration; one reads as a housing. ADR-067's
   `ry < 525` arc arithmetic survives as a record in console comments should
   ambient arcs ever return.
2. **Row order: the software row moves to 02** (map → tooling → studio →
   atl). Files, `stamp.ord`, the registry's pinned meta/classification arrays
   and the smoke's row-click branches moved together. `stamp.ref` (BLD-03)
   deliberately NOT renumbered pending an owner call — a ref identifies the
   record, not the position.
3. **The panel sits higher and runs taller** (viz top toward the designation
   rail, `--con-gap` 12→7 now that it is a seat rather than a band between
   two frames). Structurally capped at ~20px of pure geometry — the section
   rule above and the HUD cluster below are hard bounds; the real height came
   from deletions (foot ~100px, header ~26px). Field at 1440×800: 374 → 480.
4. **The tools foot is removed** — ADR-066's law finished, not weakened: a
   plate with nothing to say omits the foot, and the owner ruled this plate
   says nothing there. The smoke asserts the foot ABSENT on tools, required
   on the map.
5. **The designation stutter is gone.** No title line under the tab that
   names the same tool. `IN SERVICE {year} —` lives on the bay's FEED line —
   the one home that survives every height rung (the route captions crop at
   ≤760h, so they cannot carry it).
6. **The wide-short crop, mechanism and guard.** Decision 4 recorded that the
   route's height rides the field's WIDTH; the field's height rides viewport
   HEIGHT — and no smoke viewport was ever BOTH wide and short, so
   1600–2560px windows at ≤860h overflowed the detail plates out of the
   `overflow: hidden` field (up to 44px) with every assertion green. Worse,
   the first fix draft surfaced the truly silent variant: a CENTRED column
   with negative free space overflows SYMMETRICALLY — half under the rail,
   `scrollHeight − clientHeight` reporting ZERO. Hence `justify-content:
safe center`, a capture ceiling on `.fl-bay`'s `max-height` (⚠ never a
   definite flex-basis on the frame — that freezes the enclosing column's
   min-content and made the overrun WORSE, measured), and a **geometric
   guard**: `.fl-detail` inside the field's visible box and all four plates
   ≥99% painted, at six viewports — 1280×720 · 1440×800 · **1920×800** ·
   1920×1080 · 2017×1269 · **2560×1330**. The lesson for every future
   assertion on this surface: reported overflow is not visible truth; measure
   geometry against the visible box.

## Update 2 — the blocks fill with the portfolio's copy, and the last feet go (2026-08-08, owner)

Owner: _"fill in the blocks of the right panel with the copy which I took
from my other site; feel free to make those blocks a bit less high so we
don't waste real estate; let's also remove the text at the bottom of the
right panel in the intelligence map section and AI fluency in studio."_

### The 2×2 renders `capabilities` now — the Q&A register is deleted

The WHO/WHAT question grid lasted one day against real content. The owner's
portfolio site presents each tool as four titled claims, and those four are
what the blocks now print — which is exactly `ProjectCase.capabilities`, the
array the Arc card tiles already render. So the casefile reads the SAME
canonical array instead of growing a twin:

- **`ToolDetailFact` and `ProjectCase.detail` are deleted**, with their
  registry guards (the q-union pin, the ≤32 answer budget, the accent set).
  The capability guard is the blocks' shape pin now: exactly four, title ≤24
  (one mono line in the TIGHTER home, the Arc tile), desc ≤95 (≤3 wrapped
  lines at the casefile block's 12px floor).
- **Copy synced to the site where it differed** — Mímir's proactive-briefing
  sentence takes the site wording; Heimdall's iterator sentence likewise;
  Babylon replaces `30+ markets` / `Auto-verification` with **Proofreader
  integration** and **Localization roadmap** (site: "Broader localization
  roadmap", compressed to the 24-char tile line; the 30+ claim survives in
  `metric` and the challenge). ⚠ This changes the ARC CARD's Babylon tiles
  too — one array, two homes, deliberately.
- **The accents are gone with the questions** (`data-accent`, the `own`
  green wash, the gold value). Four claims, one voice, plain ink. The
  orphaned `--fl-own-wash` declarations left `landing.css`/`theme.css`, and
  the light-theme smoke's accent-bed sampling left with them. ⚠ The green
  ramp itself (`--atreides-*`) is untouched — the route drawing and the map
  still ride it.
- **Markup**: `.fl-detail__q`/`.fl-detail__a` became `.fl-detail__t`
  (title — nowrap mono caps, full-strength `--dawn`, no light override
  needed) and `.fl-detail__d` (the sentence — PP Neue Montreal declared
  EXPLICITLY per ADR-067, `max(12px, --fl-copy·0.84)`, wraps, never
  clamped). The smoke's prose-role selector list swapped accordingly.

### The blocks are content-height, seated at the field's floor

The old grid flexed into everything the bay left and pushed each rule to its
plate's floor — with real sentences in the blocks, that emptiness is what
the owner read as wasted real estate. Now `.fl-detail` is `flex: 0 0 auto`
with `margin-top: auto` (seated at the field's bottom edge), and
`grid-auto-rows: 1fr` on an auto-height grid equalises both rows to the
tallest plate so the hairlines stay level per tool. The capture absorbs
every freed pixel (`.fl-bay` keeps the U1 ceiling). Measured: grid 167.9px
at 1440×800 and 145.9px at 1280×720 against the ~230px+ it used to take;
titles unclipped and sentences ≥12px on all four tools at both, and the six
U1 reference viewports still pass the geometric guard.

### No plate prints a foot any more

The map's reading sentence and the Studio sheets' per-sheet captions were
the last two console feet, and the owner removed both. The films never had
one; the tools row lost its in U1. Consequences:

- `PdaConsole` passes no `foot`; `footCopy` STAYS — `foot.title` is the
  SVG's accessible name and `foot.body` still prints on the small-screen
  fallback list, where there is no drawing to say it.
- `CaseSheet.foot` is deleted (type + the three sentences in
  `loop-earplugs.ts`; the trim note at the site says what went). The LINE
  sheet's argument still reads from its own two columns.
- The box-clipping sweep now asserts **no `.fl-con__foot` on ANY row** — the
  one-per-row require/forbid split is history, and the sweep is what stops a
  foot drifting back one row at a time. `ConsoleFrame`'s slot and its CSS
  stay: the context MECHANISM outlives its current zero users.
- ADR-066's "the foot is where context goes" survives as its limit case:
  today no plate has anything to say there.

### Verification

- `cases-registry` re-pinned (34 passing); full unit suite 588 passing;
  typecheck clean.
- The three edited smoke cases pass live: the six-viewport harmonised fit
  (blocks + feet + geometry), the dwell walk (map foot absence + reading
  clicks), and the light-theme palette walk (accent sampling removed, row-2
  click kept for the wireframe branch).
- Measured by hand at 1440×800 and 1280×720, dark and light: four filled
  blocks per tool, no foot on any of the four rows.

## Update 3 — all four tools drawn, the bay grows, the RUN key goes (2026-08-08, owner)

Owner: _"we created a wireframe mockup of our image & video generation tool…
I think we can also do it for the other platforms. While we're at it, increase
the height of that wireframe and the thumbnail — we moved the four blocks to
the bottom anyway. We don't need the Run button. I just think we need a super
clear, minimalistic walkthrough button… I don't want that delay when you click
on a tab."_ Each product repo was surveyed and the owner supplied screenshots;
each drawing is an archetype abstraction, not a miniature.

### Recorded first: the route diagram died in e3b3386, without an ADR

The 2026-08-07 evening declutter (`e3b3386`, "the casefile spans the rail
box") deleted `RouteDiagram` from the render path and its CSS wholesale; no
decision record captured it. Recorded here post-hoc: the tools plate is
**bay → capability blocks**, nothing else. This pass deleted the orphan
component file and the orphan `.fl-route` light rules; `ProjectCase.route`
DATA and its registry pins stay, held for a future drawing (the mobile
vertical chain §Open already names). D4's route contracts are history.

### Three new wireframes, one scoping law

`TOOL_WIREFRAMES` covers all four ids. Per-tool archetypes (each file's
header carries the full contract):

- **Mímir** — evidence in, brief taking shape, visual out: INSIGHTS rail
  (nugget cards, dashed add-row, gold GENERATE plate at the foot) · BRIEFING
  column (kicker-dot section grammar + a FORMATS checkbox row) · REFERENCE
  frame (image mark, caption). Labels `INSIGHTS · BRIEFING · REFERENCE`.
- **Babylon** — the script beside the portrait player: pipeline chips
  (three lit, one hollow — mid-run), four segment rows of paired bars led by
  a timecode-shadow tick, gold SYNC plate; a 9:16-ish screen with source
  tabs, the house play cue and a caption line. Labels `ORIGINAL ·
TRANSLATION · SYNC`. ⚠ The portrait read comes from the COLUMN's
  height-derived width (`flex-basis: min(47cqh, 24%)`) — an `aspect-ratio`
  on the screen contributes an intrinsic width the row cannot shrink,
  measured 46px past the frame.
- **Heimdall** — a resident, not an app: the plugin PANEL (the drawing's one
  opaque plate — briefing rows with checkbox, name bar and status tick, one
  lit; gold SYNC plate) over a dot-grid CANVAS carrying the generated
  template (reference frame · briefing column · two variation cards).
  Labels `BRIEFINGS · SYNC · TEMPLATE`.
- **Vesper (retuned)** — the ladder now lives in a ~187–480px box (was
  86–206) and the generating tile carries the app's signature: a part-filled
  STATIC progress bar (asymptotic, never 100%) in the tile's UPPER band —
  at the bottom edge the floating composer covers it.

Scoping: every element rule is `.fl-wire--{tool} .fl-wire__…`; only
`.fl-wire`, `.fl-wire__in` (the size container + the shared `--w-*` set) and
`.fl-wire__lbl` are shared. Names like `__row` are generic-sounding but
tool-specific in their values — the modifier is what stops the next drawing
inheriting the composer. The ≤960 `aspect-ratio: 16/10` rung serves all four.

### The bay's ceiling: 36svh/460 → 44svh/560

The route's death and U2's content-height blocks raised the bay's wants to
~249/272/~300/458/619/680 across the six reference viewports while the old
ceiling pooled the surplus as dead air (`margin-top: auto` absorbs a bitten
cap). Measured after: evidence 246.5/270.1/280.9/395.2/478.4/480 with air =
the gap alone below ~1150h; the ~120–180px of surplus at 2017×1269/2560×1330
is the deliberate "stops growing first" remnant (ADR-066). A ceiling raise
has no clipping failure mode; the frame's `clamp(70px, 9svh, 180px)` floor
is untouched (raising it would invert the sacrificial order).

### The RUN key and the transport chevrons are deleted

The bar under the frame is the ONE affordance now — cue → "Watch
walkthrough" → duration — smoke-pinned uncut on every station. Deleting the
plate freed the frame's dead centre for the drawings and killed the open PRM
defect (its 98px minimum spanned 41% of the unwrapped column). The aria
clause generalises to ". Interface, drawn." on every wireframe branch.

### The blocks render instantly on a station switch

The ul lost its tool key; the plates are keyed by position (capabilities are
registry-pinned at exactly four, so index keys cannot misalign); the seat
stagger is 120+55i ms and plays exactly once per ROW arrival — TrackPanel is
keyed per row upstream. The wireframe keeps its `key={active.id}` remount.

### The smoke, restructured — and the gate-drift bug the foot removal unmasked

- `WIREFRAME_STATIONS` (a literal table: id · kind · exact label set) drives
  the six-viewport walk (all four stations + a walk-back to station 0),
  the 1440×800 binding-box walk, and the light walk (labels ≥4.5:1 against
  their own opaque bed — the generic ancestor walk replaced the vesper
  `.fl-wire__comp` special case; hairlines ≥1.5:1; label sets pinned as
  sorted arrays). The CAPTURE half of the filter law is dormant behind
  `kind` — executable the day a fifth tool ships before its drawing.
- ⚠ **pda.css's map-fallback gate was width-only** (`max-width: 980px`)
  while console.css and casefile.css gate on the width+PRM pair — so at
  desktop reduced-motion the map's console unwrapped but kept its drawing,
  which collapsed to a 90px rail-only box; U2's foot removal unmasked it
  (the foot's height had carried the PRM assertion). The gate now carries
  the same pair, the index fallback is the deliberate PRM reading, and the
  smoke case passes on the fallback's real height.

### Verification

- `npm` typecheck clean; registry suite re-pinned (the route pin's comment
  records the renderer deletion); full desktop smoke 12/12, mobile + tablet
  6/6 (20 desktop-only skips).
- Fit script (real scrolls, six viewports × four stations): 0 collapsed
  elements, 0 frame overflow, labels ≥8.6px, bar uncut everywhere; light
  probe 6.18–6.45:1 on all fourteen labels.

## Update 4 — the ceiling goes: content fills the housing (2026-08-08, owner)

Owner: _"look at the spacing of the right panel? Isn't there a way of
harmonizing this? Please look at our references for some good spacing"_ —
the Panels/Interfaces reference boards (Cyberpunk civil screens et al.),
whose one consistent law is that a panel's content FILLS its housing: the
largest band absorbs the surplus, footers pin to edges, and air only ever
lives inside a content region's own canvas.

U3's raised ceiling still violated that law: any svh cap that bites pools
the surplus as unstructured void between the watch bar and the floor-seated
blocks — and the bay's want rises FASTER than the viewport (the field grows
~1:1 with height while the blocks stay ~constant), so no fraction clears
every height. `--tf-bay` is `none` now; the evidence fills what the blocks
leave and the panel's only air is `--tf-gap`, measured at all seven probe
viewports (pool = 15.1/16.8/22.7/26 — the gap token's own ramp — with bays
reaching 506/679/739 at 1080p/1269/1330).

Both of the ceiling's reasons were already dead: the captures it stopped
from dominating are authored drawings now, and the wide-short overrun died
with the route. ADR-066's order of sacrifice keeps its shrink half (the
frame's floor); "stops growing first" is retired. The `max-height:
var(--tf-bay, none)` hook stays in the rule — a future cap belongs on the
BAY, never the frame.

Tall-bay safety moved into the drawings, where the references put it:

- **Vesper's row is cqw-capped** — `min(100%, 42cqw)` on the tiles and the
  prompt card. Height-driven 4/5 tiles in an uncapped bay grow their WIDTH
  with the band: at a ~680px bay the row needed ~840px against an 818px
  frame, overflow by construction at exactly the heights the old ceiling
  used to stop. Past the cap the row top-aligns and the band's lower ground
  reads as the session CANVAS — the real app's own read. The clip pill got
  the same treatment (`min(54%, 15cqw)` × `min(17%, 3cqw)`) — a %-pill on a
  344px tile was a blob.
- **Mímir's brief column is carded** like its two neighbours (`--w-card`
  ground + hairline): borderless it read as a HOLE between two panels once
  the column ran tall; bounded it reads as the composer's paper. Three
  panels, three grounds — the owner's own spec, finished.
- Babylon and Heimdall needed nothing: their feet are `margin-top: auto`
  (rows top, action bottom), the script card and the dot-grid canvas are
  bounded grounds, and the portrait screen's extra height reads as a
  modern phone ratio.

Verification: pool = gap at every station × seven viewports (incl.
2000×1080, the owner's report shape); 0 collapsed elements, 0 frame
overflow on all four drawings up to the 739px bay; the six-viewport
harmonised smoke, the 1440×800 clip walk and the light walk all green.

## Update 5 — the lettered wireframes: green flow, one gold CTA (2026-08-09, owner)

Owner: _"each tool has an important feature or element that I feel we can
visually highlight with both our tensor gold and atreides green colors…
The wireframe should immediately convey the most important feature. Cut
any clutter"_ — with a per-tool spec: Mímir's Briefing Inputs titled by
source plus the tool's own Generate button; Vesper's three components
(prompt card, generated image, a prompt bar with ENHANCE PROMPT and
GENERATE); Babylon's TRANSCRIBE → TRANSLATE → DUB → APPROVE flow with one
SEND TO FRONTIFY CTA; Heimdall untouched.

**The grammar.** GREEN IS THE FLOW, GOLD IS THE MAKE (owner pick from
three offered mappings): each redrawn drawing letters its operational rail
in the atreides ink and carries exactly ONE solid gold CTA plate —
near-black ink on `--gold`, ≈8.2:1 on either theme's ground, because
gold-as-TEXT is 1.68:1 on parchment and may not letter (ADR-063 U2). The
ink is a LITERAL (`#110f09`): the flipped `--dawn-rgb`/`--void-rgb`
triples would invert into parchment-on-gold on one side. This REVERSES
D5's "gold is the only signal colour, green stays provenance" for the
three redrawn tools — the green here is the tool's own live rail, not
Loop provenance; heimdall keeps D5 verbatim. New tokens on `.fl-wire__in`,
both theme files in one commit: `--w-green` (line), `--w-green-ink`
(text), `--w-green-soft` (wash), `--w-cta`, `--w-cta-ink`. The old gold
accents in the three redrawn drawings went NEUTRAL (mímir's lit seg cell,
vesper's lit session square, babylon's lit tab and play cue) so the CTA is
the one bright object; vesper's image glyph keeps `--w-mark` — the made
thing.

**The drawings.**

- **Mímir** is two regions now (the U3 brief and REFERENCE columns are
  DELETED, with the send plate): the inputs rail — four titled source
  cards, green labels leading (`ADS DATA · REVIEWS · REDDIT · BLOGS`, the
  tool's evidence estate: Loop Ads + the Meta library, reviews, social
  listening, trends) — with gold `GENERATE BRIEFINGS` at its foot, and the
  AD the pipeline produces on the right (image mark, two headline bars, a
  textless CTA chip on a carded frame). ⚠ The rail's basis is
  `clamp(150px, 30%, 200px)` — the pixel floor is the CTA's own fit: 18
  mono characters ≈ 124px at the 8.6px label floor plus padding ≈ 153px,
  against 147px from the old 26%. ⚠ The ad frame's width is HEIGHT-DERIVED
  (`min(64%, 66cqh)`) — the U3 babylon trap, kept out of a second drawing.
- **Vesper** is the owner's three components plus the slim chrome and the
  thin session rail: the PROMPT card (label leads), ONE image tile with
  the horizon-and-sun mark in gold, and a one-row composer — bordered
  input field with a typed run, green ENHANCE PROMPT plate (wand + label;
  the tool's own genai-prompting rewrite), gold GENERATE. DELETED: the nav
  lozenge, the DRAW meter (D5's meter-never-a-figure clause is DORMANT
  with it — the smoke's digit/currency ban survives), the PRODUCT LIBRARY
  row, the MODEL row, the mode bar, the mid-run twin tile with its clip
  pill and progress bar, and the card's reference square. The gal/dock
  lockstep pair retunes to `min(13cqh, 5cqw)` — still repeated, never
  tokenized.
- **Babylon**'s chrome line IS the pipeline now: four green lettered
  steps, each carrying a drawn check, joined by green 1px DIV links —
  ⚠ never svg lines; a stroked single-axis path reports a 0-height client
  rect and trips the smoke's collapse guard — ending at gold
  `SEND TO FRONTIFY` (the real screen's send action, gated on approval,
  told left-to-right). The U3 title bar, unlabelled pipe chips and SYNC
  foot plate are DELETED. The script table (`ORIGINAL · TRANSLATION` + 4
  ticked rows) and the height-derived portrait player survive
  byte-identical below it.
- **Heimdall** is byte-identical, still on the D5 grammar.

**The label contract.** The smoke counts EVERY text-bearing element in a
drawing and pins each tool's set by sorted-array equality; the budget
rises 4 → 7 (babylon's count is the ceiling; the band is the coarse fence,
the sets are the guard): mímir 5, vesper 3, babylon 7, heimdall 3. ⚠ THE
CTA'S TEXT SITS ON AN INNER `.fl-wire__lbl` SPAN — the light walk's
`bedOf()` starts at the PARENT, so the plate's opaque gold is the bed the
ink is judged against; text on the plate span itself would silently be
judged against the bay. `--w-green` joined the light hairline probe
(#4a6238 ≈ 4.9:1 on the parchment bay).

**Scoping-law footnote.** The two U5 grammar rules (`.fl-wire__cta` and
the `.fl-wire__lbl--grn` colour) are GROUPED-BUT-SCOPED: their selectors
enumerate the three redrawn tools rather than minting a fourth shared
class, so heimdall cannot inherit either rule.

**Below the 960 gate** the lettered chrome gets two safeties inside the
existing rung: babylon's chrome may WRAP (its flow + CTA measure ~446px at
the label floor; the CTA takes a PIXEL height there — a % of an
auto-height flex line is auto) and mímir's rail trades its pixel floor for
`clamp(146px, 42%, 200px)`. ⚠ Both are DORMANT today, like the rung they
live in: probed at 900×720 (2026-08-09), the unwrapped casefile mounts
ONLY the map's console — 0 `.fl-wire`, 0 `.fl-shot` in the DOM — so the
narrow-width safeties arm only if the unwrapped tools plate ever regains
its bay. Desktop PRM is the case the drawings actually serve unwrapped,
and there the frame keeps its flex box (the rung's own 960-not-980 note).

### Verification

- `npm run verify` clean — lint (pre-existing warnings only), typecheck,
  618 unit tests across 45 files; no unit test touches the wireframes
  (grep-verified — the smoke is the sole guard).
- Full `services-ring-smoke` run: **21 passed, 31 skipped (the standing
  desktop-only skips), 0 failed** — including the six-viewport harmonised
  walk (labels pinned per station, ≤7 budget, PT Mono ≥8px, no
  digits/currency, 0 collapsed elements, bleed ≤1, plates ≥99% painted),
  the 1440×800 clip walk, the light contrast walk (every label ≥4.5:1
  composited on its bed — the CTA ink judged against its own gold plate —
  and the hairline probe with `--w-green`), and the PRM case.
- Headless element captures at 1440×800, all four stations × both themes,
  plus the 900px probe above; heimdall's drawing verified untouched.

**The punch-through (same day, owner: "let the CTA punch through the
halftone veil").** The make-moment leaves the glass. Mechanism, because the
obvious move does not work: `.fl-wire__in`'s layout containment
(`container-type: size`) makes it a STACKING CONTEXT, so no z-index inside
the drawing can climb over a veil painted by the frame. For the three
redrawn tools the frame's veil therefore `content: none`s itself
(`.fl-shot__frame:has(.fl-wire--{tool})::after`), an IDENTICAL veil paints
on `.fl-wire__in::after` — same recipe, same 0.34 → 0.16 hover lift, the
two recipes and the hover pair pinned in lockstep by comments — and
`.fl-wire__cta` carries `z-index: 1`, the drawings' ONE sanctioned
z-index (it binds on a flex item without `position`) — which only works
if NO ancestor between the CTA and `.fl-wire__in` creates a stacking
context of its own. ⚠ VESPER'S DOCK DID: its `translateX(-50%)` centering
made the dock a stacking context (a transform always does), trapping the
CTA's z 1 inside it — the whole composer painted under the relocated veil
and GENERATE probed dotted while mímir's and babylon's plates punched
clean. The dock centres by INSETS now (`left/right: 16%`, byte-identical
geometry for a 68% width); any future ancestor between a CTA and the size
container must stay transform-, filter- and z-index-free. Every other
mark stays under the glass; heimdall and the dormant capture branch keep
the frame veil untouched. Verified by close-up probe on the landing at
2× DPR: the veil's dot pattern modulates neighbouring marks (the enhance
plate, the card grounds) and is absent across all three CTA plates, in
both themes; the six-viewport walk and the light contrast walk re-run
green (the 8.2:1 ink-on-gold figure now holds unattenuated).

## Update 6 — the review pass: three panels, a centred composer, the lettered transcript (2026-08-09, owner)

Owner notes on the live page, one per drawing:

- **Mímir is THREE lettered panels again — `INPUT | BRIEFING | AD`**, each
  headed by a neutral micro-label ("there should be a panel in the middle
  called Briefing… add clear labels to each of these three panels").
  U3's kicker-dot brief grammar is resurrected NEUTRAL — its dots and
  checked square were gold in U3, and the one-gold-CTA law keeps them
  quiet now. The input rail trims to `clamp(150px, 28%, 190px)` and the
  AD panel takes `clamp(130px, 26%, 220px)` ("slightly thinner so we
  have more space for the new middle panel"). ⚠ The ad column carries
  the portrait read as a DEFINITE flex basis — the babylon video
  column's move, in `%` rather than `cqh`; never an `aspect-ratio` on
  the frame.
- **Vesper's three components centre as ONE composition** ("the prompt
  bar should be higher… aligned vertically centered"). The U5 absolute
  float and the gal/dock LOCKSTEP PADDING PAIR ARE RETIRED: a `__main`
  column centres [row, dock] as a group, the dock in flow right under
  the row (width 68%, left-aligned with it). ⚠ The tile's height is
  cqh-DEFINITE now (`min(56cqh, 42cqw)`) — `100%` of a content-sized row
  is indefinite and resolves to nothing. The ENHANCE PROMPT plate is
  SQUARE-CORNERED ("the enhance prompt button is missing corners" — the
  clip-path was cutting the border's corner segments away); the corner
  law prefers it anyway — the children of a chamfered surface are
  square, and the one cut object in the row is the gold CTA.
- **Babylon's flow IS the feature**: taller chrome (`min(17cqh,
5.4cqw)`), flow labels above the micro-chrome floor at
  `clamp(10px, 1.55cqw, 13px)` — the surface's ONE deliberate size
  exception — bigger checks, longer links, and the CTA recopied to just
  `UPLOAD` and WELDED to the chain's end as its fifth station (the
  `margin-left: auto` float is gone; a fifth link runs into the plate).
  The segments table letters the REAL transcript — four EN → JA rows
  from a Loop UGC job, prose-cased, no tracking, nowrap + hidden
  overflow, PT Mono through `--fl-mono` (CJK glyphs fall through the
  stack to the system mono; the computed family still leads PT Mono,
  which is what the smoke's family walk reads). ⚠ EVERY CELL IS A PINNED
  SMOKE LABEL NOW, verbatim — and the lines are CHOSEN digit-free and
  currency-free, because the per-label digit/currency bans and the bay's
  ordinal scan read this text; a segment quoting sizes, counts or prices
  may not be lettered on this page (the envelope).

The label budget rises 7 → **15** (babylon's 7 chrome labels + 8 cells
set the ceiling; the pinned per-tool sets stay the real guard). The sets:
mímir 8 (`INPUT · ADS DATA · REVIEWS · REDDIT · BLOGS · GENERATE
BRIEFINGS · BRIEFING · AD`), vesper 3 (unchanged), babylon 15, heimdall 3
(untouched).

### Verification

- `npm run verify` clean (618 unit tests, typecheck, lint). The
  six-viewport harmonised walk, the 1440×800 clip walk and the light
  contrast walk all green on the new pins — the Japanese cells assert
  verbatim through the sorted-array equality and letter ≥8.6px.
- Captures at 1440×800 × both themes: the three mímir panels letter, the
  vesper composition centres with the composer directly under the row,
  the babylon chain reads first with UPLOAD ending it clean above the
  veil.

**Same-day follow-up (owner: "center the image and video-like wireframes
more… that prompt bar again can be a bit higher, and maybe you can add a
placeholder prompt").** Vesper's group centres HORIZONTALLY too —
`justify-content: center` on the row and `align-self: center` on the
dock. ⚠ Never `align-items: center` on the `__main` column for this: it
would shrink-to-fit the row and the card's % basis would resolve
against nothing. And it sits ABOVE the frame's midline — the column's
`padding-bottom` shrinks the centering box, so the composition rides
high instead of dead-centre. The input letters a placeholder prompt,
`Loop Switch, golden hour` — content like babylon's cells, prose-cased
PT Mono, and a FOURTH pinned vesper label, chosen short, digit-free and
currency-free. ⚠ The input host is an `<i>`, whose UA italic the old
bars never exposed — text does, and NO ITALICS is a brand law:
`font-style: normal` is load-bearing on the placeholder rule.

**Second follow-up (owner: "make it a bit larger, the elements… the
prompt bar, make it higher. It's too flat. INCREASE THE HEIGHT… add to
the prompt panel somewhere at the bottom in Tensor Gold the name of the
model nano banana").** The scale pass: card `40%`, tile
`min(58cqh, 46cqw)`, dock `min(18cqh, 6.5cqw, 52px)` — ⚠ the px term is
the WIDE-SHORT guard: 18cqh at a ~350px bay is 63px and the group
overflows the frame's ≤1px guard — and the high-bias padding drops
10cqh → 6cqh to afford the taller group at the binding 246.5px bay
(~6px slack, arithmetic in the rule comments). The card's foot letters
`NANO BANANA` — a FIFTH pinned vesper label — in the gold TEXT role:
new token `--w-gold-ink` (`--gold` dark / `--gold-ink` light, both
theme files in one commit), because raw gold letters at 1.68:1 on
parchment and may not (ADR-063 U2); `margin-top: auto` seats the tag at
the card's bottom edge.

**Third follow-up (owner: "the generate button doesn't need the notches…
increase the width of the prompt bar so it aligns nicely with the two
panels above… a bit more breathing room").** Vesper's CTA drops the
chamfer (`clip-path: none`, scoped — mímir's and babylon's plates keep
the house cut; the punch-through z 1 is untouched, clip and stacking
being independent), so the composer row is fully SQUARE. ⚠ THE BAR'S
WIDTH IS THE ROW'S WIDTH, DERIVED:
`max(68%, calc(40% + 1cqw + min(46.4cqh, 36.8cqw)))` — card basis + gal
gap + tile height × 4/5, a TRIPLET that moves with those three rules
(comment-pinned at the rule); the 68% floor is the binding-bay guard,
where the derived row (~331px) would squeeze the input under the
placeholder's ~132px and clip the lettered prompt. Composer gap/padding
take cqw terms with px floors for the same reason.
