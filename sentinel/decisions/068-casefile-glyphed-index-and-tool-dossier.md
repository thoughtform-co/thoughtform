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
