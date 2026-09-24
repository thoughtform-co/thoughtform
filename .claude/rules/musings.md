---
paths:
  - "components/landing/home-v2/musings/**"
  - "lib/musings/**"
  - "content/musings/**"
  - "app/(internal)/test/musings-row/**"
  - "app/(internal)/test/musings-gallery/**"
  - "scripts/capture-musings-row.mjs"
  - "scripts/capture-musings-gallery.mjs"
description: The musings list (#musings) — five notes that open on hover, its transparent stage and the footer's held bed
---

# Rule: the musings list

`#musings` — the writing as a LIST OF NOTES THAT OPENS ON HOVER: the services
masthead's grammar on the editorial band, decoding in place; at most five
closed folder cards, each one row (the title at v4's scale, its meta line,
the beat chip, the drawn cover unframed in the last column), of which the one
under the pointer opens — its cover grows, its excerpt unrolls, the byline and
the way in land on the cover's floor; one way out. It sits between the era
stage and the footer.

⚠ **[ADR-122](../../sentinel/decisions/122-the-musings-list.md) (2026-09-24,
owner) IS THE LIVE FORM: THE GALLERY LAB'S v17, PROMOTED** — _"Let's go for
V17 and maybe we can show more, maybe 5 in total … the cards should first be a
line and then unfold downwards."_ It retires ADR-121's flex row of strips and
its centre-out aperture on this station; everything else ADR-121 recorded (the
weld, the head's seat, the band's end, the glass, the dwell) stands.
⚠ **AND ADR-121's RULING ON 3D STANDS WITH IT**: ADR-119 tried a fan, a shelf
of spines and a row tipped back about X with a scroll detent per card, and the
owner retired all three (_"remove the jukebox carousel thing"_). **Do not
bring a perspective, a rotation, a detent or a per-card pose back** —
`musings-row.test.ts` refuses all four by source.

⚠ **SINCE [ADR-119 U1](../../sentinel/decisions/119-the-musings-rack.md)
(2026-09-22, owner) THE STATION IS NOT THE COVER — ITS LAST VIEWPORT IS.** On
the capable rung it is the `#voidwalker` recipe exactly: transparent, promoted,
the corridor alive behind the whole beat, because an opaque station in normal
flow can only arrive by TRAVELLING over a pinned stage that does not move —
which is the "parallax" he named, and the complaint that deleted `#practice`.
⚠ **SINCE [ADR-105 U4](../../sentinel/decisions/105-the-page-ends-on-a-bold-footer.md)
(2026-09-24, owner: "when you scroll away from the muse section, I want the
footer to scroll over it in a subtle way") WHAT KILLS THE CORRIDOR IS THE
FOOTER, RISING OVER THE PINNED LIST.** ADR-119 U1's 100svh `.mu__band` and the
footer's bed are deleted: the band was one viewport of empty stars, the dead
space he named. Three rungs:

| rung                                       | `data-mu-mode` | station              | cover      | the footer                       | glass |
| ------------------------------------------ | -------------- | -------------------- | ---------- | -------------------------------- | ----- |
| ≥1101, motion, live corridor, hologram era | `stage`        | transparent, z 6     | `#contact` | rises over the pinned list (z 8) | blur  |
| 961–1100 (list pinned, no stage)           | —              | opaque               | `#musings` | rises over the pinned list (z 8) | none  |
| ≤960 / PRM / no JS                         | —              | opaque, flowing list | `#musings` | follows in flow, no weld         | none  |

⚠ The PAGE `/musings` is a different surface with a different grammar — the
SHEET (ADR-114), [`.claude/rules/sheet.md`](sheet.md). This station is a
landing STATION and answers to the corridor's grammar and the corner law, not
to the sheet's variety law. They share exactly one thing: the record.

**Read first**

- [ADR-122](../../sentinel/decisions/122-the-musings-list.md) — the list: five
  at most, the rows solved from the count, the sign on the cover's floor, the
  open note that stays, the line that unfolds, the orbit cover, what it
  deleted and what is measured.
- [ADR-121](../../sentinel/decisions/121-the-musings-row-opens-on-hover.md) —
  the row before it: the glass ruling and its perf gate, the band's end (U1),
  the head's seat (U2) and the weld (U3), all still live.
- [`docs/design/musings-gallery/README.md`](../../docs/design/musings-gallery/README.md)
  — the six rounds and seventeen directions v17 won out of.
- [ADR-119](../../sentinel/decisions/119-the-musings-rack.md) — the station's
  birth: the cover lockstep, the footer's bed, the head's decode (U2), the
  aperture (U1 §4), and the three forms the owner retired.
- [ADR-105](../../sentinel/decisions/105-the-page-ends-on-a-bold-footer.md)
  **Update 3** — the footer's half, recorded on the ADR that owns that surface.
- [ADR-114](../../sentinel/decisions/114-the-sheet.md) — the content model
  (`MusingPost`, `content/musings/*.mdx`, the registry's two traps).
- [ADR-097](../../sentinel/decisions/097-proof-card-is-a-folder.md) — the
  folder skin this card is cut from (glass, the flat lip, the scanline, the
  bloom stated in pixels).
- [ADR-030 §6](../../sentinel/decisions/030-tools-section-cover-stack.md) — the
  cover lockstep this station sits at the centre of.

## Contracts

- **A NOTE IS ONE GRID, AND THE OPEN ONE GROWS ON TWO TRANSITIONS AND ONE
  CLOCK.** `.mu-note` is `grid-template-columns: minmax(0, 1fr)
var(--mu-note-col)`: the row (title over meta, the chip) in column 1, the
  cover in column 2 across both rows, the excerpt (`.mu-note__open`) under the
  row. The open note sets `--mu-note-col` from the thumbnail to
  `--mu-note-open` and its excerpt's wrapper from `grid-template-rows: 0fr` to
  `1fr`, both on `--mu-note-grow` (560ms `cubic-bezier(0.16, 1, 0.3, 1)` — the
  house's expo-out, because a pointer response wants an immediate start). The
  cover is ONE element at two sizes; nothing is posed, measured or written per
  frame. The dials sit on `.mu`: `--mu-note-gap`, `--mu-note-inset`,
  `--mu-note-cgap`, `--mu-note-row`, `--mu-note-open`, `--mu-note-thumb`,
  `--mu-note-title`, `--mu-note-grow`, `--mu-foot-h`, the unfold's three, and
  `--mu-dwell`.
- ⚠ **FIVE AT MOST, AND ON THE PINNED RUNG THE ROWS ARE SOLVED FROM THE COUNT
  (ADR-122).** `MUSINGS_LIST_MAX` is 5 (the owner's number). `.mu[data-mu-ready]
.mu__notes` is a SIZE container from the head to the rails' last tick, and
  `100cqh` is its height: the open card's floor (`--mu-note-open-min`,
  `clamp(180px, 20svh, 240px)`) and the way out's row (`--mu-foot-h`) are paid
  first, the closed rows share the rest at v4's 8.6svh where they can (never
  under 64px nor over 108px), and the open cover takes what the rows leave, up
  to 240px. The station hands the count as `--mu-n`; the two files move
  together. ⚠ Custom properties substitute where they are USED, so `100cqh`
  inside `--mu-note-row` resolves against the notes' box even though a row
  reads it — making a note or a row a size container would silently re-base
  it. ⚠ **BELOW ~1000px OF HEIGHT FIVE DO NOT FIT** and the list scrolls within
  itself (a thin scrollbar); at the owner's 1920×1247 five end ON the rails'
  last tick with no scroll. Open, ADR-122.
- ⚠ **THE TITLE IS v4's SCALE, SET WHOLE** —
  `min(clamp(22px, 2.5vw, 48px), calc((var(--mu-note-row) - 26px) * 0.9))`,
  capped by what the row leaves above the meta line, so a short row sets a
  smaller title rather than a clipped one. `nowrap` + ellipsis is a BELT: the
  capture fails the run on any cut title. On the phone titles wrap at
  `clamp(20px, 5.4vw, 26px)` and the chip is hidden.
- ⚠ **THE SIGN ENDS ON THE COVER'S FLOOR, BY ARITHMETIC** (the owner's ask:
  _"the call to action and the author should be aligned to the bottom of that
  visual"_). The cover spans both rows from 10px down at `aspect-ratio: 1`;
  `.mu-note__detail`'s height is `open + 10px + inset − row` with the inset as
  bottom padding, so its content box ends where the cover does, and
  `.mu-note__sign` is `margin-top: auto`. ⚠ **THE DETAIL'S GAP IS A MINIMUM
  (12px), NEVER A SPACING** — at 28px a three-line excerpt pushed the sign 7.9px
  under the floor at 1920×1247. The capture gates the offset (±1.5px) on every
  open note at rest, on hover and on Tab; it measures 0.
- **THE OPEN NOTE IS ONE ATTRIBUTE, `data-mu-open`, RENDERED ON THE NEWEST
  POST AND MOVED BY THE WRITER.** No timer, never a wall-clock rotation
  (ADR-021). React renders it on index 0 so SSR, no-JS and a reduced-motion
  reader all show the finished list; `useMusingsScroll` moves it on
  `pointerover` / `focusin`, delegated on `.mu__list` and gated on the rung —
  one attribute write on an event, no `setState` (ADR-002).
  ⚠ **AND IT STAYS WHERE THE READER LEFT IT (ADR-122).** There is no
  `pointerleave` / `focusout` restore: the open note is ~2.5× a closed one's
  height, so a restore would move every note below it under a hand travelling
  to them. `park()` reopens the newest when the station is left. The source
  test refuses both listeners. ⚠ The holder is QUERIED, never cached (the lab
  re-keys the list when its count changes). ⚠ React does not touch an
  attribute whose prop has not changed, so the writer's move survives every
  re-render.
- ⚠ **THE BAND'S END YIELDS TO THE RIGHT RAIL'S TELEMETRY (ADR-121 U1).** The
  row's first cut ran its last card 25.4px UNDER the SECTOR readout at
  1280×720. `--mu-band-end` =
  `max(0px, --mu-tele-reach + --mu-note-inset − --band-margin)` is added to the
  HEAD's and the NOTES' inline-end margin — one right edge for the
  composition — under `html[data-rail-instruments]` on the pinned rung: zero
  from ~1560px up (the owner's 1920), a note inset of air below it.
  `--mu-tele-reach` is the frame's own geometry: `--hud-margin +
--hud-rail-guide-inset + 8px` to the readout's right edge, plus its WIDTH, a
  constant of the frame because its type is fixed-size (SECTOR ··· 06/07,
  107.4px; the test re-derives it from `rail-instruments.css`'s declarations),
  plus **3px — half the page's 6px scrollbar, across which the 100vw station is
  centred and the fixed rail is not.** The capture asks ≥ 12px at rest, on
  hover and on Tab (17.9 at 1280×720 on the landing).
- **THE MATERIAL IS THE PROOF CARD'S FOLDER, RE-SOLVED FOR THIS SIZE
  (ADR-097).** `--mu-plate` is `rgba(--void-deep-rgb, .62)` (.9 on parchment,
  `theme.css` BLOCK 4g — unfrosted); the lip is FLAT,
  `color-mix(in srgb, var(--gold-line) 30%, transparent)` at rest rising to
  `--gold-line` on the open note (a `background-color` on the ring, so it
  transitions); the plate's 1px/3px gold scanline sits UNDER the copy; the
  bloom is stated in PIXELS. ⚠ NO `brightness()`. ⚠ **THE STATE IS THE RING,
  THE INK AND THE CHIP, NEVER A FILTER** — a large-area brightness change on
  every hover is the class of motion ADR-097 U12 retired. The open note's chip
  goes gold-ink.
- ⚠ **THE GLASS IS ON THE STAGE RUNG ONLY, AND IT IS MEASURED, NOT ASSUMED.**
  `backdrop-filter: blur(--mu-blur)` under `@supports`, on
  `#musings[data-mu-mode="stage"] .mu[data-mu-ready] .mu-note` — where there is
  a live corridor to blur. At 961–1100 the station is opaque; light drops it in
  `theme.css` BLOCK 4g with a selector that OUT-RANKS the sheet's, or it loses
  silently. `capture-musings-row.mjs --perf` gates the long-frame share while
  the pointer sweeps the list against the proof card's recorded 15 % — 0 % at
  1920×1247 (ADR-122). **The recorded fallback if it ever fails is the blur on
  the OPEN note alone.**
- **EVERY NOTE IS A REAL LINK AND EVERY NOTE IS FOCUSABLE.** The row
  (`.mu-note__row`) is the note's link; the open note's "Read the note" is a
  second link to the same page, hidden with its excerpt while closed
  (`visibility`, so it leaves the tab order). Keyboard focus opens a note
  exactly as hover does. The only thing hidden from assistive tech is the
  drawing. Touch on a ≥961 device: a tap opens and navigates in one gesture
  (left open, ADR-121).
- **THE RUNWAY IS ONE DWELL** — `height: calc(100svh + var(--mu-dwell))`,
  `--mu-dwell: 120svh`, the one dial. ⚠ **120 SINCE ADR-122 U1** (owner: _"it
  scrolls too quickly into the next section"_): 60svh held the list for ~6
  wheel steps at 1247px, five notes and a hover included; 120 holds it for
  ~13. ADR-119 pinned one step per card (42svh each) because a detent needs
  scroll; a hover list does not. Every threshold on `p` is a FRACTION of the
  dwell, so changing it moves them in svh: the arrival's hysteresis
  (`lib/musings/arrive.ts`, the lifted `arriveNext`) opens at `ROW_ARRIVE_IN`
  **0.05** (was 0.10 at 60svh — the same 6svh, re-solved with the dial) and
  closes at 0.95, before the head leaves at 0.965; the head reveals at 0.02,
  2.4svh past the pin, which the weld's seam test still bounds under 12svh.
  On the stage rung the station is ~2.2 viewports plus its 100svh band.
- ⚠ **THE STATION IS WELDED ONE VIEWPORT OVER THE ERA STAGE, ON THE STAGE RUNG
  ONLY (ADR-121 U3, owner: "it takes a few scrolls to get to the elements").**
  A sticky stage pins only once its top reaches the frame's top and the head
  is blank until then, so the reader scrolled ONE WHOLE VIEWPORT of transparent
  stage rising behind an emptied era stage — 107.6svh from the era's content
  leaving (era p 0.96) to the head decoding, 1342px at his viewport.
  `#musings.station { --mu-weld: 100svh }` and
  `#musings[data-mu-mode="stage"].station { margin-top: calc(-1 * var(--mu-weld)) }`:
  this stage pins in the frame the era's unpins and the head decodes 1.2svh
  later (7.6svh from the era's content leaving; the era's own 6.4svh tail
  stays). ⚠ **The weld EQUALS the era stage's height** (`.vwd`, 100svh sticky
  in a 260svh station) — larger pins two stages at once, smaller restores dead
  viewport; `musings-row.test.ts` proves it by arithmetic off both sheets.
  ⚠ **KEYED ON THE STAGE STAMP, NEVER ON THE RUNG**: on 961–1100 and the phone
  the era is a static section an opaque station would cover. The writer
  follows the era's mode through a `MutationObserver` as well as scroll, or
  the weld lands on the first scroll instead of at load. ⚠ **A TRANSPARENT
  BOX STILL TAKES THE CLICK** — the welded station covers the era's live band
  from era p ≈ 0.45, so it is `pointer-events: none` with one restore: the
  runway once the list is `in` (the band's went with the band, ADR-105 U4);
  never `visibility: hidden` on the stage (the head decodes during `await`).
  ⚠ **AND TWO READOUTS FLIP AT THE PIN**: welded, the station's top crosses
  the viewport's middle 8svh BEFORE the era's exit begins, so the writer stamps
  `data-station-edge="pin"` with the mode (cleared on the writer's three
  paths: the inert rung, unmount, a non-stage frame), `useLandingScroll` lights a pin-edge station when its top
  reaches the frame's top, and the rail's LOCAL reads the station the bus
  names rather than the first one holding the middle. Musings-only and
  explicit — the About → Voidwalker flip (about p 0.60) is a separate ruling.
  ⚠ **THE LABS WELD NOTHING**: `[data-mrl] #musings.station { --mu-weld: 0px }`
  in the shared lab sheet — the hidden era marker makes the writer stamp
  `stage`, and there is no era to overlap — and no footer follows the lab
  station, so its `--mu-rise` is 0 too. The kill and the four ADR-030 §6
  readers read live rects. `landing-page.spec.ts`'s page
  baselines drift by design (one viewport shorter); the HUD pair does not.
- ⚠ **ONE WRITER, AND IT RENDERS NOTHING, EVER.** `useMusingsScroll` reads
  one rect in a rAF and publishes `--mu-head` (the head's level),
  `data-mu-ready` and `data-mu-arrive` on `.mu`, `data-mu-mode` on the
  STATION, `data-mu-open` on one note, and `data-live` on the head's cursor
  hosts (`data-ft-reveal` went with the bed, ADR-105 U4). It returns nothing and holds no
  React state — the last `setState` (ADR-119's detented front index) went
  with the detent. A `setState` in the rAF is a re-render across every card,
  every frame, on a page running a WebGL corridor two stations up.
- ⚠ **AN ABSENT `data-mu-ready` MEANS SHOWN.** The rest state — no script, a
  reduced-motion reader, any phone — is the same LIST, flowing, with its newest
  note open, and it is the finished page rather than a fallback. Every
  pinned-list rule (the rows solved from the frame, the glass, the arrival) is
  gated on the stamp AND on the rung, so the two can never disagree about which
  layout is live; `musings-row.test.ts` walks every such declaration.
- ⚠ **THE RUNG IS MIRRORED BY HAND** between `MUSINGS_ROW_MEDIA` in the writer
  and `@media` in the sheet. A writer and a sheet that disagree is a list whose
  notes nothing will ever open, or a flowing list the writer tries to pin —
  neither errors, and neither is visible in a still taken at the other rung.
  Pinned by source.
- ⚠ **THE COVER LOCKSTEP HAS FOUR READERS AND THEY MOVE IN ONE COMMIT**
  (ADR-030 §6, on record as hit six times): `home-v2.css`'s mode-gated promotion
  rule, `useCorridorExitScroll`'s next-station query,
  `about-voidwalker-handoff-boundaries`' cover case, and `services-ring-smoke`'s
  ambient-hold case — which reads it **twice**, once to solve the waypoint and
  once to assert on it. All four name **`#contact`** on the stage rung since
  ADR-105 U4 (they named `.mu__band` from ADR-119 U1 until then).
  ⚠ **NOT `data-corridor-kill`**: it is consulted BEFORE the whole chain, so a
  stamp on the cover would also win at 961–1100, under PRM and on the fallback,
  where `#musings` is opaque again — and `killEl` is cached against
  `isConnected` and never re-queries when an attribute is removed from a
  connected element, so a writer-stamped version does not work either.
  ⚠ **THE PROPERTY IS ASSERTED AT THE COVER'S OWN TOP**, where the envelope
  reaches zero — the frame the footer finishes covering the list — with the
  one sub-pixel of tolerance the document's last element needs (ADR-105 U2).
  ⚠ **`?? contactEl` IS LOAD-BEARING**: `/claude-workshop` and the Trinny
  proposal mount the same hook from their own prototypes and have no
  `#musings`. On those routes the answer is still `#contact`.
- ⚠ **THE COVER SATISFIES ITS CONTRACT BY INHERITANCE, SO DO NOT TAKE ITS
  GROUND.** Off the stage rung `.station:not(.hero)` paints `var(--void)` plus
  the stars; on it the cover is `#contact`, which paints the same pair. The guard asserts
  `alpha === 1` AND a background image, and a surface whose only ground is its
  content fails both.
- ⚠ **THE WRITER HAS NO HANDLE ON THE STATION WITHOUT CLIMBING.** `stationRef`
  is the portal's `.mu` root, one level inside the authored slot, so every rule
  written against `#musings[data-mu-mode]` matches NOTHING — silently, with
  the page reading as before. `closest("#musings")`, re-resolved on `isConnected`.
- ⚠ **TRANSPARENCY AND PROMOTION ARE ORTHOGONAL.** The docked canvas composites
  at its host's z 3 (`fixed` changes a containing block, never paint order, and
  the host is `isolation: isolate`) and `#musings` carries an inherited z 2 — so
  an un-promoted transparent stage paints its head and cards BEHIND the
  corridor: invisible, every geometry gate green. z 6 while transparent is what
  `#services`, `#about` and `#voidwalker` all already do, which is why the cover
  rule is REPLACED and never deleted.
- ⚠ **`#musings.station`'s unconditional `position: relative` MAY NEVER BE
  FOLDED INTO A `data-corridor-exit`-GATED RULE.** It is what activates the
  inherited `z-index: 2` that keeps the whole subtree above the footer's z 0,
  long after the ambient has died.
- ⚠ **IT GIVES UP `content-visibility`, UNCONDITIONALLY.** The base pairs
  `auto` with a one-viewport intrinsic guess and this station is two and a half
  on the stage rung, so the correction reflows the document under the reader —
  and the cover keys on this station's RECT, which a 100vh placeholder puts
  where the reader is not (ADR-105's own reason, one station along).
- ⚠ **THE RAW PADDING IS ON THE DESKTOP RUNG ONLY.** `#musings.station` writing
  `padding-top` unconditionally TIES with the ≤960 chrome floor (also
  `#musings.station`, also (1,1,0)) and wins on source order, because
  `musings.css` is imported after `landing.css` — the floor silently resolves to
  0 and the eyebrow prints under the TL bracket. `mobile-sections.md` §1 names
  this trap; the station declares `--station-pad-top/-bottom` unconditionally so
  the floor's `max()` has its input, and zeroes the raw padding above 961px.
- **The head is the SERVICES MASTHEAD's grammar, COPIED** (`lib/musings/
mastheadData.ts` + `.mu__head*`): the two-column split sharing one top line,
  the designations hung above each block, the one gold state chip, the coord
  stamps under each block's foot, the two registration crosses, the dot-grid
  lifts, and the ladder — `clamp(26px, 3vw, 44px)` / 0.04em / 1.1 with the
  gold-washed shadow. ⚠ `ServicesMasthead` could not be imported if it were
  wanted (zero props, `closest(".services-stage")`, `--svc-*` channels no hook
  writes here, ABSOLUTE inside a pinned stage); `ArcSectionHead` is the
  canonical in-flow copy and this is its third instance.
  ⚠ **AND ITS SEAT IS COPIED TOO, SINCE ADR-121 U2** — the type was copied in
  ADR-119 and the seat was not, so the head sat wherever the centred group put
  it (~287px down at 1920×1247 against services' 136; the owner: "more down").
  On the pinned rung (`.mu[data-mu-ready]`, 961px up, NOT the transparent
  `stage` mode — services sits on this line across 961–1100 too) the stage is
  `align-content: start` on `padding-block-start: var(--band-top)`, the line
  `.services-masthead__lead`/`__intro` hang from, and the brief's box starts on
  the title's (no top padding). The base rule still centres its three `auto`
  rows for the flowing rail. ⚠ **The link is pinned from BOTH ends** in
  `musings-row.test.ts` — including `services.css`'s `--masthead-top-trim: 0px`,
  because a trim there would split the one shared line in silence — and the
  capture gates the title on `--band-top` resolved through a probe box.
  ⚠ **THE STRINGS ARE AUTHORED UPPERCASE AND THE SHEET TRANSFORMS NOTHING**
  (ADR-092), and `0.04em` is the sheet's ONE type literal — the ratchet's pin is
  `A: 1` with its reason recorded, and it only goes down from there.
  ⚠ **THE RIGHT-HAND SURVEY CHROME YIELDS TO THE FRAME BELOW 1700px**: the close
  cross hangs 24px outboard of an end-justified brief, and the right rail's
  BEARING / SECTOR / LOCAL readouts are right-aligned to the rail and reach
  ~100px inboard. Measured at 1280×720 — band ends at 1148, `BEARING` begins at 1133. The brief's TEXT never collides; only the marks do. ⚠ Since ADR-121
  U1 the head's right edge ALSO yields with `--mu-band-end` below ~1560px, so
  the brief, the state chip and the row's last card end on one line (1107.7 at
  1280×720); the brief's wrap is unchanged, since its 42ch box is narrower
  than its column at every rung.
- ⚠ **THE HEAD DECODES IN PLACE, ON THE SERVICES MASTHEAD'S CLOCK (ADR-119 U2:
  "the texts … shouldn't move into view … just like we have in the services
  section").** U1 scrubbed it off the scroll position and asked the kernel for
  its frame at `t = 0` to blank it — but `scrambleFrame` opens a character's
  shuffle window BEFORE it resolves, so at `t = 0` the first 3–4 characters of
  every run were random glyphs (`F-ZO` / `TSJ`). **The head was never blank**,
  and those glyphs rode the stage in and out of the frame, re-rolling every
  scroll frame. Now:
  - **`headFrame` returns `""` at level 0**, for every run — the regression the
    test exists for — and the writer may not call `scrambleFrame` itself.
  - **TIME DRIVES THE LEVEL, SCROLL DECIDES THE TARGET.** `headTarget` picks 0
    or 1 (reveal at p ≥ 0.02, leave at ≥ 0.965 or < 0.01, a hysteresis band at
    each end); a bounded rAF burst walks the level there — up over the whole
    span (~0.7s: lines 0.18s apart, the paragraph typing at 220 chars/s behind
    0.12s, services' numbers), down twice as fast. ADR-021's sanctioned kind,
    the services masthead's own clock.
  - **NEVER SHOWN ON A MOVING STAGE**: unparked (the runway not covering the
    frame) the level snaps to 0 at once — the masthead motion law's
    force-blank. A deep reload parked inside the dwell shows the head whole,
    with no replay; a hidden tab settles the burst on return.
  - ⚠ The level is still ONE scalar, so the un-type is the decode played
    backwards in each character's own cell — no second job, nothing to latch.
    `advanceScrambles` stays banned for that reason.
  - The CRT cursor (`.mu__cursor`, copied from `.services-masthead__cursor`)
    rides the first title line still decoding and the paragraph while it types,
    lit by `data-live` on its `[data-mu-cursor]` host. ⚠ The decoded run is an
    INNER span — `textContent` would wipe a sibling cursor.
  - ⚠ The paragraph is a GHOST/TYPED pair (a hidden ghost holds the box, the
    typed layer is absolute): typing never reflows the head.
  - Two registers stay: chrome and title SCRAMBLE, the paragraph TYPES. ⚠ The
    heading carries an `aria-label`, or a reader arriving mid-decode is handed
    the shuffle. The survey chrome fades with `--mu-head`.
    ⚠ With a 120svh dwell `pinned` holds for 120svh of scroll: the head decodes on
    entry, the cards open after it, and the exit runs backwards
    (`data-mu-arrive="out"` at 0.95 before the head leaves at 0.965). The
    capture reads the head EMPTY at −0.3 and 1.15 and whole through 0.3–0.9.
- **THE NOTES ARRIVE AS A LINE THAT UNFOLDS DOWN, AFTER THE HEAD HAS
  RESOLVED (ADR-122)** — the owner's order (_"the text should appear with a
  glitch effect, and then the cards should come into view"_) and his gesture
  (_"the cards should first be a line and then unfold downwards"_; the
  centre-out aperture read as "a scan line … a bit cringe"). The writer holds
  `data-mu-arrive="in"` until the head's level is 1. `mu-unfold` is a
  five-point `clip-path` set, interpolated vertex for vertex: 0 % a zero-width
  1px line at the top-left, **40 % the full-width top edge**, 100 % the notched
  plate STRING-EQUAL to the cascade's clip. `mu-unfold-lip` lights the ring
  `--gold-line` while the note is a line, so it reads as an edge being drawn.
  Each note runs `--mu-unfold-in` (820ms, the house's ease-in-out — an arrival
  the reader did not cause wants to start soft) `--mu-slot × --mu-unfold-step`
  (90ms) after the one above, fill `backwards` (a waiting note is a zero-width
  line; the last frame is the cascade's own silhouette); the way out unfolds
  last on the `inset()` pair. Leaving, all fold at once (`mu-fold`, 420ms),
  holding `opacity`/`visibility` themselves — the `out` cascade hides the
  notes, so a clip-only close plays on nothing (ADR-097 U12's close).
  ⚠ **GEOMETRY ONLY — no opacity curve, no filter, no flash**: ADR-097 U12's
  photosensitivity ruling binds, and the source test refuses both inside the
  `in` keyframes. ⚠ **The aperture's pair (720 / 420ms on
  `cubic-bezier(0.65, 0, 0.35, 1)`) stays pinned on its two remaining hosts**
  (`proof-stack.css`, the Trinny route) and may not reappear in `musings.css`.
  ⚠ It is a BOUNDED BURST on a hysteresis (`rowArrive`, `lib/musings/arrive.ts`):
  NaN leaves the state alone, a deep reload seeds `in`, `await` is NOT `out`,
  and it closes at **0.95**, BEFORE the head leaves (0.965), so the exit is the
  entry backwards. ⚠ **Re-entering from below replays the order**, so a probe
  must WAIT on `data-mu-arrive="in"` and on `.mu__notes` having no running
  animation (`getAnimations({ subtree: true })` — the lip animates a
  pseudo-element) — never sleep. ⚠ **And it waits `state: "attached"`**: the
  notes are hidden while the arrival AWAITS, so a visibility wait times out.
- **The note takes ONE notch, TOP-RIGHT** — his corner every time (ADR-097's
  proof card, ADR-098 U5's plates, ADR-082 U37's record cards). ⚠ A clip CUTS a
  border and never strokes one, so the fill is clipped and the edge is a closed
  two-contour `evenodd` RING on `::before`, inner leg `ch − 0.586px`. ⚠ The
  corner is pinned from BOTH ENDS and it is HIT-TESTED, not parsed — a computed
  `clip-path` keeps its percentages and `calc()`s. ⚠ The note's own box carries
  the clip, the ring and the glass: ADR-121's separate face span existed only
  because the card's box was the one growing, and nothing grows the note's box
  sideways now.
- **The cover draws the RECORD, in the About drawing's grammar**
  (`lib/musings/orbit.ts` + `MusingOrbit.tsx`, ADR-122): six rings on the
  alternating dash ladder, twenty rim ticks and four cardinal stubs, a
  twelve-month halo with the note's month lit, the year's OTHER notes as dots
  on the outer ring, the note's day on the gold track with the year's elapsed
  arc and a hand, the beat glyph at the centre; DOM labels for the day of the
  year, the year and the quarter months. ⚠ COPIED, NEVER IMPORTED (ADR-106):
  the About drawing and the beat glyph's grammar (`rail-instruments/
sectionGlyphs.tsx`) are both hand-copies. ⚠ A post with no Arc tag draws NO
  glyph. ⚠ **ONE ELEMENT AT TWO SIZES**: `@container mu-cv (max-width: 140px)`
  strips `.mu-cv-detail`, the labels and the quarters, leaving the gold track,
  the inner ring and the glyph as the thumbnail. ⚠ The cover is UNFRAMED — no
  border, no ground; the note is the frame (the owner, round six), and the
  capture fails either.
- ⚠ **NO `new Date()` ANYWHERE IN THIS MODULE.** An ISO date with no zone parses
  as UTC and renders a day earlier west of Greenwich — a day on the kicker, and
  across a year boundary the whole width of the plot on the mark. Both read the
  string. The registry records the same trap from the other end.
- **`cardsFor()` is the one projection into the client tree**, and it exists to
  leave `body` — every post's whole MDX source — out of the landing's payload.
  ⚠ `next.config.mjs` must name `/` under `outputFileTracingIncludes` for
  `content/musings/**`: the tracer follows imports and this folder is opened by
  path, so a missing row works in dev and 500s on Vercel.
- ⚠ **FIVE IS THE WINDOW, AND THE LANDING HAS FIVE (ADR-122 U1).** Two notes
  were added to fill it, each translated from the owner's own published posts
  through `thoughtform-tov` and dated on the post it came from (so they sit
  under the September three). A sixth pushes the oldest off the homepage;
  `/musings` lists them all.
  `cardsFor()` projects `author` for the byline (ADR-122) and still leaves
  `body` out.
- ⚠ **PLACEHOLDER COPY LIVES IN THE LAB AND NOWHERE ELSE.** The site is live: a
  `draft: false` file in `content/musings/` publishes a page and a sitemap row.
  `/test/musings-row` (`app/(internal)/test/musings-row/`) mounts the
  PRODUCTION station — nothing re-drawn — with seven placeholder records
  (`placeholders.ts`), `?n=3|5|7`, `?theme=light`, `?console=0`. It supplies the
  DOM the writer reads (a hidden `#voidwalker[data-vw-mode="hologram"]` marker
  and `data-corridor-exit` on `<html>`), so the station goes transparent and the
  glass has the lab's BED to blur. A window onto production, not a copy.

- **`MusingsStation`'s `gallery` slot is a LAB SEAM, and production never
  fills it.** Given a node it takes the place of the list AND the way out, so
  a direction in `/test/musings-gallery` is judged under the REAL head, pinned
  stage, decode and arrival stamps. `MusingsPortal` renders
  `<MusingsStation posts={posts} />` and `musings-row.test.ts` pins that it
  passes nothing. `!== undefined`, never `??` (a `null` direction draws
  nothing). ⚠ The writer needs no change — with no `.mu__list` its note
  handlers find no list — but a lab must RE-KEY the station when its
  direction changes, because the writer's listeners bind at mount; and a
  direction may never carry `data-mu-decode` / `data-mu-cursor`, which the
  writer collects from the whole `.mu` subtree and would scramble.
  ⚠ `musings-row.test.ts` fails the station file on the substring `front`
  anywhere, comments included — "frontmatter" in a comment is a red suite.
- **`lib/musings/outline.ts` reads an essay's shape off its body** — its
  sections (split on `#`/`##`, as `mdx.tsx` renders them, never `###`) and
  each one's prose words, fences and `<Figure>` blocks skipped. Zero imports,
  body in, projection out, so the body never reaches a client chunk. The
  gallery lab draws it; nothing on the landing reads it yet.

## The rise: the footer over the list (ADR-105 U4)

- **One tail, one weld, one stamp.** The runway is
  `calc(100svh + var(--mu-dwell) + var(--mu-rise))` and
  `#musings:has(.mu[data-mu-ready]) ~ #contact.station` takes
  `margin-top: calc(-1 * var(--ft-weld))`, `position: relative`, `z-index: 8`.
  ⚠ **`--mu-rise` EQUALS `--ft-weld` (100svh), BY ARITHMETIC** — the footer's
  top enters the floor at the end of the dwell and reaches the frame's top as
  the runway releases, so the stage never unpins uncovered.
  `musings-row.test.ts` pins the pair; neither station can read the other's
  custom properties. ⚠ **`--mu-rise` is `0px` unless a footer follows**
  (`#musings.station:has(~ #contact.station)`) — the labs have none.
- ⚠ **THE WRITER'S CLOCK IS THE DWELL.** `travel = runway − vh − rise` (the
  rise read off a probe box in the station), so `p` saturates at 1 through the
  rise and every threshold keeps its meaning. ⚠ **THERE IS NO EXIT AT THE
  BOTTOM**: `ROW_ARRIVE_END`, `HEAD_LEAVE_AT` and `HEAD_RETURN_BELOW` are
  deleted — the footer covering the list is the exit, and scrolling back up
  it lifts off a whole list.
- ⚠ **THE DRIFT AND THE DIM ARE ON THE COMPOSITOR.** `.mu__stage` drifts
  `translateY(0 → −0.25 × rise)` on the RUNWAY's view timeline
  (`--mu-run`, `contain calc(100% − var(--mu-rise)) contain 100%`) and a void
  veil on `::after` dims to 0.4, inside `@supports (animation-timeline:
view())` and the rung. ⚠ Never `opacity` on the stage (glass notes,
  ADR-097); the stage, never the station (the section clock). A browser
  without timelines keeps the weld and the pin: the footer covers a still
  list.
- ⚠ **THE FOOTER IS THE CORRIDOR'S COVER** on the stage rung —
  `useCorridorExitScroll`'s `musingsCover` is `contactEl ?? musingsEl`, the
  ambient fading as the footer's top rises from 0.6 of the frame to its top.
- ⚠ **NEVER A TRANSFORM ON THE FOOTER.** The margin is layout and the scroll
  moves it; only its key visual glides (`.ft-foot`'s own view timeline,
  site-footer.css).
- **The capture's rise gates**: the footer's top at vh·(1 − k) at each quarter,
  the stage pinned, the list `in` and the head whole under it, the drift and
  the veil at k's share, no void between the two, the corridor alive at 0.25
  and dead at 1, the readout on CONTACT from 0.75, a whole list scrolling back.

## What a still shows and a gate does not, and the reverse

- ⚠ **A BOUNDING RECT CAN BE WRONG ABOUT WHERE A 3D ELEMENT PAINTS — NOT JUST
  LOOSE, WRONG (ADR-119 U2).** With an ANCESTOR `perspective` inside this
  sticky, promoted stage, `getBoundingClientRect` and the compositor disagreed
  by ~125px across and ~140px down on a tipped card: every gate built on the
  rects passed and the still showed a 30px sliver. There is no 3D context on
  this station now — and that finding is the standing reason there is not.
- ⚠ **`elementFromPoint` AND `elementsFromPoint()[0]` DISAGREED INSIDE THAT 3D
  CONTEXT, AND THE SINGULAR ONE WAS WRONG.** With the context gone, ADR-121's
  capture reads both on every probe point and reports whether they agree; the
  plural form stays the one the gate uses.
- ⚠ **A PROBE AT `ch × 0.5` LANDS EXACTLY ON THE CHAMFER'S DIAGONAL** and
  resolves by rounding. Deleted: the `tr` probe at 30 % along the cut is the
  question. **A gate whose answer depends on which side of a pixel a device
  lands is not a gate.** ⚠ And the notch is asked of the NOTE, which carries
  the clip.
- ⚠ **A RANGE'S CLIENT RECTS ARE THE LAYOUT, NOT THE CLIP.** That is what let
  ADR-121's capture ask the no-reflow question from inside a strip, and what
  lets the list's count a title's LINES: `overflow: hidden` never shrinks the
  line boxes. A CUT title is asked separately — `scrollWidth` against
  `clientWidth`, because an ellipsis is a clip.
- ⚠ **THE HUD'S READOUT WAS SOMETHING THE STICKY BED COULD SILENTLY TAKE AWAY
  (the bed is gone since ADR-105 U4; the branch stays, dormant).**
  `useLandingScroll` picked the active station from the PAINTED rect, last wins,
  `#contact` last — so once the bed armed the corner read CONTACT for the whole
  beat. ⚠ `offsetTop` does NOT rescue you: it reports the stuck position too
  (measured `#contact.offsetTop` 17174 against `#musings`'s 17217, a station
  beginning before the one above it). The truth for a stuck station is the
  BOTTOM of the one above it, narrowed to `position === "sticky"` because the
  phone's `#about` takes a `-100svh` weld. The capture asserts the readout at
  every stop.

## Verifying

```bash
npx vitest run tests/lib/musings-row.test.ts tests/lib/rail-manifest.test.ts \
  tests/lib/v7-parse.test.ts tests/lib/section-label.test.ts \
  tests/lib/rail-instrument-marks.test.ts tests/lib/detentTable.test.ts \
  tests/lib/footer-nav.test.ts tests/lib/socials.test.ts \
  tests/lib/musings-registry.test.ts tests/lib/theme-css-sweep.test.ts \
  tests/lib/type-material-tokens.test.ts tests/lib/phone-viewport-units.test.ts
npx playwright test tests/visual/about-voidwalker-handoff-boundaries.spec.ts --workers=1
npx playwright test tests/visual/services-ring-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop  # WITHOUT --update-snapshots
npx playwright test tests/visual/mobile-section-seams.spec.ts \
  --project=iphone-14-chromium --project=iphone-14-pro-max-chromium
node scripts/capture-musings-row.mjs --vp 1920x1247 --theme dark --perf   # and light, 1280x720, 390x844
node scripts/capture-musings-row.mjs --lab --n 5 --vp 1920x1247 --theme dark   # the placeholder host
node scripts/capture-musings-row.mjs --lab --n 7 --vp 1280x720 --theme dark    # the narrowest open card
# the capture gates (ADR-122): note 0 open at rest; every title whole on one
# line and none cut; every row a focusable link; the covers unframed, one
# thumbnail size, the open one square and grown; the notes inside the rails'
# last tick; five notes not scrolling on a frame >= 1000px tall; the sign on
# the cover's floor (±1.5px) at rest, on hover and on Tab; hover opens note 2
# and closes note 0, and leaving keeps note 2 open; Tab into note 1 opens it;
# glass on every note on the stage rung in dark, on none in light or under
# reduced motion; the head EMPTY off the pin and whole through the dwell; the
# TR-only notch hit-tested from both ends; the readout; every note >= 12px
# clear of the right rail's readouts; the title's top on --band-top (ADR-121
# U2); and the RISE (ADR-105 U4) — see §The rise.
node scripts/capture-site-footer.mjs  --vp 1920x1247 --theme dark   # the footer's own contrast + plate
# The gallery lab (/test/musings-gallery) — the directions under the head, on
# the production station's `gallery` slot. Only the control (v0) fails the run;
# a direction failing a gate is a finding. README: docs/design/musings-gallery/.
node scripts/capture-musings-gallery.mjs
npx vitest run tests/lib/musings-gallery.test.ts tests/lib/musings-outline.test.ts
```

Then, **from PowerShell** (Git Bash rewrites a `/route` argument into a Windows
path):

```powershell
node scripts/design-eval/mechanical.mjs --url / --theme dark  --scope ".mu" --prm
node scripts/design-eval/mechanical.mjs --url / --theme light --scope ".mu" --prm
node scripts/design-eval/mechanical.mjs --url /test/musings-row --theme dark --scope ".mu"
```

⚠ **IT FAILS WITH SIX FINDINGS IN EACH THEME, AND THOSE SIX ARE KNOWN (ADR-119
U3, 2026-09-22).** They are the title's gold glow (×5, the house display recipe
the gate bans; the services masthead lists the same five) and the coord stamps
at 1.43 / 1.40:1 (faint by the survey grammar). Both are open owner calls. A
SEVENTH finding is a regression.

⚠ **Every `--mu-ink-*` rung is TEXT.** The third is .54 here and .62 on
parchment (`theme.css` BLOCK 4e). A drawing that wants a quieter ink takes
`--mu-draw`, never a text rung, or a contrast fix darkens the covers.

⚠ **AND LOOK AT THE STILLS.** Every defect this station has found that mattered
to the composition — the pooled slack that put 205px between the masthead and
the top card, the tipped card painting 140px off its rect — was invisible to
every green gate. ⚠ **RE-RUN A SCROLL SPEC ON A WARM, QUIET SERVER BEFORE
BELIEVING A FAILURE**: five `services-ring-mobile-smoke` cases failed while
this sheet was being edited between runs and all nineteen passed in one quiet
pass.

**Process:** [sentinel/MAINTENANCE.md](../../sentinel/MAINTENANCE.md) — Cycle B
for a new surface, Cycle A after fixes.
