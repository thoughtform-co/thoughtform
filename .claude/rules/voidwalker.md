---
paths:
  - "components/landing/home-v2/voidwalker/**"
  - "components/landing/home-v2/hooks/useVoidwalkerScroll.ts"
  - "components/landing/home-v2/hooks/useVoidwalkerTravelScroll.ts"
  - "components/landing/home-v2/hooks/useVoidwalkerHologramScroll.ts"
  - "components/landing/home-v2/hooks/useCharacterStageScroll.ts"
  - "components/landing/home-v2/hooks/useCharacterStagePortalReceiver.ts"
  - "components/landing/home-v2/DepthGatewayScene/VoidwalkerTimeTunnel.tsx"
  - "lib/voidwalker/**"
  - "lib/home-v2/vwTravelRef.ts"
  - "scripts/capture-voidwalker.mjs"
  - "scripts/capture-voidwalker-travel.mjs"
  # A glob, because the single `-models` entry left the eras, phone and
  # figure-span probes outside the rule they are the gates for.
  - "scripts/probe-voidwalker-*.mjs"
  - "app/(internal)/test/voidwalker-flight-lab/**"
  - "app/(internal)/test/voidwalker-avatar-lab/**"
  - "components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx"
  - "tests/visual/landing-corridor-smoke.spec.ts"
---

# Rule: The through-line (`#voidwalker`)

The production surface after the About bio is the ADR-082 U2 HOLOGRAM: a
Tensor-gold figure, era masthead, record/scope panels and five-stop era rail.
"Voidwalker" remains the station title; `.voidwalker*` is still reserved for
the About bio, while this surface uses `.vw*` / `.vwh*`.

## The datum-rails composition (ADR-082 U19, live 2026-08-31)

⚠ **THE STATION'S INTERIOR IS THE D2 "DATUM RAILS" COMPOSITION**
(`HoloDatumPanels` + `voidwalker-datum.css`, `.vwd*`), promoted out of
`/test/voidwalker-datum-lab` after two mockup waves.

⚠ **`VOIDWALKER_DATUM_STAGE` IS DELETED, NOT FLIPPED, AND SO IS WHAT IT
GATED.** It was a comparison lever and it did its job: the owner read both
compositions live and kept the rails, so `HoloEraPanels`, the `.vwh*`
composition rules and their guards went WITH the boolean (ADR-070 U35 — a
flag standing at `false` implies the losing drawing is one boolean from
returning, and it is not). What went, in one list, so nothing gets restored
from muscle memory: the mast/side/panel/rail/pip/facts/press/film/tabpanel
and mobile-mode rules (~1100 lines of `voidwalker-hologram.css`), the
composition's own entry/exit block, its responsive rungs, and
`tests/visual/voidwalker-character-sheet.spec.ts`.

- ⚠ **ADR-082 U31 (2026-09-21, owner) — READ BEFORE ANYTHING BELOW ABOUT THE
  FIGURE'S SEAT, THE BAND, TRANSMISSION, ON RECORD OR HOW A FIGURE IS MADE.**
  - **THE FIGURE RISES, AS `top`, NEVER `translate`.** `.vwd__figure` is lifted
    until the painted cap sits on the stage's top edge (the heads' row line),
    solved from `HOLO_FIGURE_SPAN` (`--holo-span`, written once by
    `HoloDatumPanels`) so the disc line is era-independent. ⚠
    `futurePinnedRect` and the handoff spec read the portrait seat through the
    OFFSET chain, which a transform does not move — a `translate` lift lands the
    flying card 95–148px low with every spec agreeing. The weld spec asserts rect
    = offset chain ±2px. ⚠ Alpha branch only, via `--vwd-rise: 1` inside the
    `min-height: 720px` hologram gate (0 ⇒ `top: 0px` on every other path), and
    both labs re-declare it by hand. ⚠ `--vwh-base-h` / `--vwh-base-disc-inset`
    are declared on `.vwh, .vwd` together. On the alpha branch the RETICLE is
    arithmetic (centred on the painted figure); `--vwd-ret-cy` is the floor
    branch's alone.
  - **THE ALPHA BRANCH RELEASES ITS CLIP AND ITS MASK** (`--holo-spill` →
    `--holo-clip-x` / `--holo-clip-top`, in the base clip, the rest clip AND
    `vwhReveal`'s keyframes; the mask off at `min-width: 1101px` on `.vwd` only),
    because a mask hides overflow too — the overscan was cutting ~27px of
    Azeroth's pauldrons per side. ⚠ Zero spill ⇒ byte-identical. `azeroth-v11`
    is v10 seated 33 rows; its anchors are `v10 + 33/1280`, never re-rounded,
    or the floor era's fit stops being exactly 1.
  - **THE BAND IS A FIVE-BUST GALLERY FROM 701px UP** (reversing U20's reel and
    U23's text stops, by his choice). `thumbPath` is REQUIRED on every delivery
    (`thumb.py`, head marks, ≤10 KB). ⚠ `--vwd-band-h`, `--vwd-reel-return` and
    `--vwd-chrome-h` are an accounting identity and are NOT edited. ⚠ The phone
    keeps U27's text reel: five busts cost the solved figure ~14px or shrink to
    a 14px head, and that is a device call.
  - **TRANSMISSION IS A PILE OF GLASS FOLDER CARDS** (`EraMediaStack`), fed by
    `media?: CharacterEraMedia[]` (embed · video · image; read through
    `eraMedia()`, capped at **3** since U34 — the cascade's HEIGHT, where U31's
    4 was a fanned tab row's width). ⚠ **SUPERSEDED ON THE TABS BY U34: every
    card and every tab is the SAME**, stacked down-right one tab height a step
    (see the U34 bullet below); what survives: the lip a CLOSED evenodd ring
    with the slant's inner ends at −0.414px; a back card renders no body; no
    player mounted; every tab a button. ⚠ It fits BY CONSTRUCTION: `container-type: size` on the seat at
    ≥1101 ONLY (ungated it zeroes the ≤1100 bodies), the frame the one item that
    gives, its `min-height: 72px` load-bearing. ⚠ The frost is front-card-only,
    waits on `--ci`, and carries no id so light can switch it off.
    `scripts/capture-era-media.mjs` gates fit on every rotation; the lab's
    `?media=N` is the pile's only real subject until the record grows.
    ⚠ **U32 (same evening, owner): THE TITLE LEADS THE FRAME, IN MONO
    CAPITALS** — above the picture, `--vwd-mono` + uppercase + `--track-label`
    on the LABEL ratio (`clamp(10px, 1.2svh, 15px)` ≥1101), full ink. Capitals
    are the mono's job here (uppercase on the sans is an ADR-092 finding), and
    it still wraps, never clamps. The markup test pins title → frame and the
    capture fails a title whose ink does not end above the frame.
  - ⚠ **THE LEDE IS THE PARAGRAPH'S OWN FIRST LINE (U32, his second read of
    "Venting became a campaign")** — `.vwd__motto` reads the prose's own
    `--band-copy` and its ink at full strength, `--weight-lit` the only
    difference. Never a clamp of its own (U29's height clamp put a 14.5px lede
    over an 18px paragraph at his window) and never gold: gold is the lit mark.
  - ⚠ SUPERSEDED BY U35 (cards) — **ON RECORD IS TAGGED ROWS**, superseding U29's bounded object (read live,
    stacked boxes were a slide's content boxes): a framed tag, the year, a 7×7
    arrow ONLY where the record links out, the headline, a hairline at the foot.
  - ⚠ **A KNEELING ERA IS MEASURED BY THE MAN IT DRAWS (U32, `expanse-v2`).**
    Its `stature` (measured off crown→beard against the Architect's marks,
    never guessed) drives the fit AND the phone's seat — `holoFigureHeadShare`
    reads `footY − stature`, which may sit ABOVE the canvas and is not bad
    data. `data-vwh-stature` rides the slot; the figure-span probe compares
    standing heights, never ink. A standing era authors no stature.
  - **A FIGURE IS DRAWN IN COLOUR AND GRADED GOLD** — see
    `scripts/voidwalker-avatar/README.md`. The one-step "volumetric hologram"
    route is what reads as "too glowing" (deep-interior p75 172 / 170 against
    the Architect's ~103). `gold.py` holds the Architect's measured curve, ramp
    and bloom and the exposure gate every delivery must pass.
  - ⚠ **U33 (2026-09-22, owner): A FIGURE MAY PERFORM A SCENE, AND A PLATE
    STANDS ON ITS ERA'S GROUND.** The Expanse (`-v3`) scouts and aims — a
    scene runs from the plate TO a DRAWN end pose (`generate.py --edit-kind
aim`, framing checked before a video is paid for; asked in words, Veo
    aimed off the frame) and loops as a ping-pong cut inside a hold. ⚠ A
    video model MORPHS into a drawn last frame; cut before it. ⚠ At the site's
    body scale the column holds ~0.6 m either side of his centre, so an aim
    must turn the torso or foreshorten — never a profile from a square-on
    chest. The 2016 trainer (`pokemon-go-v1`, anime, his own brief) stands on
    MAGENTA (`scripts/voidwalker-avatar/grounds.py`): blue keys his vest and
    jeans through. A cel is drawn in a DEEP palette, because the Architect's
    curve lifts mid-tones hard. The piles are real on three eras now; gate
    them with `capture-era-media --record`, not the lab's fixture.
  - ⚠ **U34 (2026-09-22, owner): EVERY FOLDER THE SAME, ON A DIAGONAL.**
    _"Every folder looks the same. The notch is the same in every structure …
    stack it from a different vantage point."_ One card size (`W − (n−1)·dx`),
    ONE tab flush at each card's top-left, its width `--_wt` solved once from
    `IMAGE NN`; the card at depth `d` sits `d` steps up-left of the front
    (`--vwd-mstack-dy` IS `--vwd-mtab-h`, so each tab behind reads whole above
    the card in front; `--vwd-mstack-dx` a sliver). Every tab letters
    `KIND NN`; the mark is gold on the open card and dawn behind — one notch,
    one state. A back tab's hit area is two tab heights, clipped by the
    silhouette (the area under a back tab belongs to the card in front, so
    the old downward slop is gone). ⚠ **THE CAP IS A HEIGHT NOW: 3** — at
    1280×720 each card behind costs the front frame one tab height, and three
    land the frame on its 72px floor exactly; the phone draws at most two
    (`--vwd-mpad` 10) and reaches the third by rotation. The lab's `?media=`
    and `capture-era-media --piles` take 0–3 and refuse the rest.
    ⚠ **`media-src` NAMES ONE REMOTE HOST, BY OWNER RULING** (_"stream from
    Supabase"_): the site's own project, never the `*.supabase.co` glob,
    pinned from both directions; a `video` may name a PUBLIC `.mp4` in the
    `era-media` bucket (`ERA_MEDIA_STORAGE_ORIGIN`, the registry's copy,
    asserted equal to the CSP's). Posters stay self-hosted. The enforced sweep
    plays a pile's front card (`--era-media`) and counts requests to the host.
    ⚠ **The Expanse STANDS now** (`-v4`, the commander): no era kneels, so no
    era authors `stature` — the law and its code stay for the next one that
    does. ⚠ **A PLATE WITH A PARTED MOUTH CANNOT BE ANIMATED IN SILENCE**: Veo
    starts on it, reads a man speaking, draws a voice, and its audio filter
    refuses the clip (five takes, uncharged, whatever the prompt said). Fix
    the PLATE (`generate.py --edit-kind mouth`), never the sentence. ⚠ And a
    pointing hand given ANY motion of its own becomes a gesture — take 1
    raised the index finger for 3.3 s.
  - ⚠ **U35 (2026-09-22, owner): CARDS, ONE GRID, ONE FRAME, NO DISC.** - **ON RECORD IS CARDS** (reversing U31's tagged rows): `.vwd__pcard`, a
    four-sided outline and NO ground, square, the air the divider; a
    thumbnail well holding one mark per coverage KIND (`VW_OUTLET_KIND`:
    newspaper · magazine · broadcast), the headline, then the medium
    (`OUTLET · YEAR`); the state lifts on anchors only. ⚠ The well is
    PADDED (`content-box` + `--vwd-pcard-pad`), never centred — a 21px mark
    centred in an even box lands on a half pixel. - **FACTS IS ONE GRID ON ONE SCHEMA** (reversing U23's readout rows):
    every era carries `CHARACTER_ERA_FACT_KEYS` — Base · Move · Reach ·
    Result — in order, two cells a row, a mark and the key over the value.
    The phone keeps two columns (measured) and RECORD takes one section gap
    above ON RECORD's head. - **THE MARKS** (`lib/voidwalker/eraMarks.ts`, zero-import) are seven 7×7
    glyphs on the particle grammar, DAWN ONLY; a new one re-runs the
    unlabelled contact sheet (the magazine took four cuts). - **THE POP-UP IS THE CARD AT DIALOG SCALE**: `MediaLightbox`'s additive
    `frame={{ tab }}`, one 16:9 box for every kind, sized by WIDTH against
    the frame's height. ⚠ Its material is the card's `::before` (a clip cuts
    a box's children, and CLOSE sits outside the silhouette); no box-shadow,
    by name; the block is global because the dialog portals out of `.vwd`. - **THE DISC, RING, GLOW AND CONE ARE DELETED; `.vwh__base` IS KEPT AS AN
    UNPAINTED SEAT BOX** — the slot, the lift, the reticle, the phone's
    translate and the handoff seat all read it. - **EVERY STILL IS `unoptimized`** on the card and in the dialog: one stuck
    dev-optimizer key left a card black for good. `capture-era-media` fails a
    front still undecoded 3 s after a rotation and measures every dialog. - **The Expanse performs** (`-v5`): point → the earpiece and a MOUTHED
    order → through the optic, a SCENE to a drawn end pose (`--edit-kind
aim-stand`), eyes open with quick blinks by name; `vid.py --listen` is
    the fallback if a spoken beat is ever refused.
  - ⚠ **U36 (2026-09-22, owner): A PANEL HEAD IS ITS NAME AND ITS RULE.** _"We
    don't need these little numbers."_ No head carries a right-hand tag — not
    SCOPE's year, FACTS' era name, TRANSMISSION's duration, ON RECORD's count,
    nor an empty seat's `None`. The band letters the years and names the open
    era, the cards count themselves, and an absence is its body's own line. The
    sheet test pins `.vwd__head__tag` absent from the CSS and the component.
  - ⚠ **U37 (2026-09-22, owner): THE RECORD CARDS TAKE ONE NOTCH, TOP-RIGHT**
    (_"the record buttons need a notch"_ — reversing U29/U35's "square", on the
    corner he keeps: the proof card's, the arcs plates'). The edge is a CLOSED
    evenodd ring on `.vwd__pcard::before` (a clip cuts a border), the card
    itself is unclipped, the border's pixel moved into the padding, the notch is
    `--vwd-pcard-ch`, and ⚠ the ↗ arrow steps `2px 4px` clear of the cut —
    seated on the padding it came within 2.8px of the diagonal at 1280×720.
  - ⚠ **U38 (2026-09-22, owner): THE BAND'S FOOT MIRRORS THE TITLE'S DATUM.**
    _"The same margin at the bottom relative to the margin above the …
    title."_ ⚠ **SUPERSEDED ON THE VALUE BY U40 the next day** (the band seats
    on the wordmark's box instead — he read the mirrored seat as too close to
    the panels above it); the mechanism below stands to the letter.
    - **The value.** `--vwd-foot` is `--vwd-mast-top` mirrored in INK (the
      title's caps 0.16em under its box, the names' 0.36em above their line
      box), eased in over the first 180px above 720 tall (`0.4`). It is exact
      from ~900 up (106/106 at his window) and 0 at 720.
    - ⚠ **Paid by the panels, never the figure.** The band goes ABSOLUTE at
      `bottom: var(--vwd-foot)` and the stage reserves its zone as a FIFTH
      ROW (`--vwd-band-box + --vwd-foot`), which the figure spans. Rows 1–4
      lose exactly the foot, half from each body, and the figure's slot grows
      by the band's height.
    - Padding the sheet instead would tip the figure height-bound (its slot
      had 24–33px of slack) and shrink him ~7.7 %, with the handoff card
      landing larger than the hologram.
    - ⚠ **`--vwd-band-box` is derived from the tokens the band, chip and name
      READ** (`--vwd-band-pad-t/-b`, `--vwd-chip-gap`, `--vwd-name-fs/-lh`),
      so the row knows the band's height before it is laid out. Never a second
      literal.
    - Layout only (`bottom`, rows): the handoff reads offset geometry and §G
      owns the transforms.
    - The datum lab mirrors the foot and its four structural rules; the
      hud-panel lab does not (it has lagged since U22).
    - ⚠ **The lab's panel rows are 24px shorter than the landing's** (its 48px
      knob bar comes out of the sheet; `--vwd-bar-h` corrects only the figure
      column). The capture has no frame-inside-card gate yet, and the lab's
      three-card fixture overruns its card there while the landing's pile fits.
      Measure a pile question on the landing's rows.
  - ⚠ **U39 (2026-09-22, owner): THE BUCKET EXISTS AND HOLDS ONE FILM.**
    2020's Twitch recording of the class is the FRONT card of Azeroth's pile,
    a `video` streamed from `era-media/azeroth/wow-class-twitch.mp4`.
    - **The bucket:** PUBLIC, `video/mp4` only, 50 MB a file, created with
      `.env.local`'s service key (never `.env`, which is another project).
    - ⚠ **Read the cache policy off a GET.** A HEAD answers `no-cache` while a
      GET carries the `max-age=31536000` set at upload.
    - **The card:** `src` is built from `ERA_MEDIA_STORAGE_ORIGIN`, the
      duration is the native player's own reading, and `focus` is used for the
      first time (`[0.5, 0.85]`, because the subject sits low and the 1280×720
      frame shows 48 % of the poster).
    - ⚠ **A file whose NAME names the game is still refused by the shell
      hook**, even when it is nowhere near an install. The owner copies it
      under a neutral name; the Edit tool carries the title into code. Never
      route around the hook.
  - ⚠ **U40 (2026-09-23, owner): THE BAND SEATS ON THE WORDMARK.** _"Move
    the gallery at the bottom a bit down so they're horizontally aligned with
    the brand mark … they would be too close to the elements."_ U38's foot put
    the band's last glyph on the wordmark's TOP line (the bottom brackets'
    edge) and 21px under the TRANSMISSION pile at his window; the band's BOX
    is centred on the docked wordmark's box now. - **The value.** `--vwd-foot` is `--hud-margin + --hud-brand-dock-h / 2 −
--vwd-band-box / 2`, still inside U38's `min(…, (100svh − 720px) × 0.4)`
    ease: 29.4px at 1936×1221 (was 88.3), 33.6 at 1920×1080, 19.0 at
    1440×900, and 0 at 1280×720 as before (the full value is ~14 there and
    the cap holds the band on the floor). Exact from ~755 tall at 1280 wide,
    ~805 at 1920. - ⚠ **THE WORDMARK'S BOX IS THREE HUD TOKENS NOW** (`landing.css`
    `:root`): `--hud-brand-w` (the width `.hud__brand` reads),
    `--hud-brand-dock` (the docked `scale()` it reads) and
    `--hud-brand-aspect` (the lockup's viewBox, 494.93 / 1178.18 = 0.42008,
    which CSS cannot read from the file — `tests/lib/hud-brand-tokens` pins
    it to the SVG the prototype loads). `--hud-brand-dock-h` is their
    product; every computed value is byte-identical to the literals it
    replaced, and the HUD snapshot is the proof. - **What "aligned" was read as.** Both seats were shot at his window
    before choosing: the box centred on the mark puts the thumbnails over
    33 of the mark's 43px (their centre 12px above its centre, the names
    hanging under the pictures inside the box; the names' box ends 11px
    under the mark's bottom line) and the air under the pile at 40px;
    bottom-aligning the box on the mark's bottom left the pictures ABOVE the
    wordmark with 28px of air. Centred is what ships. - ⚠ **U38's mechanism stands** — the absolute band, the fifth stage row,
    paid by the panels and never the figure; a SMALLER foot is more body
    row, so the pile gains what the band gave up. The lab mirrors the
    expression character for character. `scripts/probe-voidwalker-figure-span`
    and both handoff specs are the figure's proof that nothing moved.
  - ⚠ **U43 (2026-09-24, owner): THE RECORD THUMBNAILS ARE HAIRLINE
    DRAWINGS.** _"It looks like a trash bin; can we do something a bit more
    elegant?"_ — the pixel magazine (a masthead bar over a narrow box) was the
    bin's silhouette and that glyph's FOURTH 7×7 cut; seven cells cannot tell a
    magazine from a can. `lib/voidwalker/recordMarks.ts`: three line-drawn
    pictograms on a 21-unit grid at 21px (a broadsheet, a bound cover with a
    spine, a set with rabbit ears), 1px dawn strokes at .62, one filled dawn
    signal, straight lines only (ADR-059's register one size up); the well,
    the notch and the hover untouched. ⚠ An axis line sits on the half pixel
    across and runs whole pixels along; a diagonal is 45° on pixel centres;
    the thumbnail is `geometricPrecision`, never `crispEdges` (a 1px diagonal
    under it is a pixel staircase). ⚠ `ERA_MARKS` is the FACTS' alone now
    (four keys, the three kinds pinned ABSENT) — two icon media on one
    station is the named cost. A new drawing re-runs
    `scripts/capture-record-marks.mjs` (`--experimental-strip-types`,
    unlabelled, both themes) before it ships; `record-marks.test.ts` holds the
    grammar.
- ⚠ **THE STAGE IS REDRAWN ON THE REFERENCE'S GRAMMAR (ADR-082 U23,
  2026-09-17, owner)** — panel-scoped rules, readout rows, a ring, and air.
  **The eyebrow is DELETED**: `ERA / 04 OF 05` and the year cost the title
  20.2px and were both already on screen (the reel prints every year and marks
  the open one), so the year moved to SCOPE's head rule, right-aligned, at the
  head's full size (⚠ and U36 deleted it there, with every head tag — the band
  is the one place a year is lettered now). ⚠ It left the DECODE because that head is a §G actor at
  `--ci-off: 0.16` whose ramp saturates around `--vwh-in` 0.655, after
  `TITLE_DECODE_WINDOW` closes at 0.18 — a scramble there resolves while the
  element is still transparent. `finals` is one entry; ⚠ `eraPositionLabel`
  STAYS EXPORTED for `/test/hud-panel-lab`.
  ⚠ **THE FACTS ARE READOUT ROWS** on a two-weight DAWN ladder
  (`--vwd-rule-head` .3 divides a region, `--vwd-rail` .12 rules within one;
  gold here is the lit mark). Every row keeps its rule; press items rule at
  their FOOT. `minmax(0, 1fr)` on the value is load-bearing — `expanse`'s
  36-character value would otherwise push its label out of the panel. Worth
  ~50px, which is why `tightest` changes hands from Facts to Scope.
  ⚠ **A RETICLE RINGS THE FIGURE** — two rings and four DIAGONAL marks, dawn
  only, sized off `--vwd-fig-w` so its box can never exceed **524.4px** (⚠ U23
  recorded 487.6, which is `fig-w × 1.06` — an intermediate cut; the shipped
  multiplier is 1.14 and landed in U23's own commit, so the ADR's table and this
  clause were a version behind for two days. The sweep holds either way, which
  is the point of sizing off the clamp — but a number a rule states and a number
  the sheet computes have to be the same number) and the
  > 700px sweep is satisfied by ARITHMETIC. ⚠ **BOTH DIALS ARE MEASURED**: the
  > figure paints its centre at 49.7–52.2 % of its box (not the box's middle, not
  > a base-height subtraction), and the first cut solved it by arithmetic and
  > rang him from the head to the knees — only a still showed it. 1.14 is the
  > column's ceiling (`fig-w + 2 × gap` may not touch a panel). ⚠ Three traps:
  > `.vwd__figure` DECLARES `position: relative` (§G's transform is inside
  > `no-preference`, so PRM would resolve the ring against `.vwd__stage`); the
  > offset is the **`translate` property**, never `transform`; entry rung 0.15.
  > ⚠ **THE CHIPS ARE TEXT STOPS** on both breakpoints — the framed bust is gone
  > with five lazily-fetched posters. (⚠ From 701px up, U31 brings busts back —
  > ≤10 KB each, cut for the purpose, never the posters.) ⚠ **ITS 52px IS CHARGED BACK, NOT SPENT ON
  > THE FIGURE**: `--vwd-reel-return` keeps `band-h + reel-return + trail`
  > identically U22's `116px + clamp(...)`, so `--vwd-chrome-h` and
  > `--vwd-fig-w` are byte-identical on both gate branches (335.781 / 328.938 /
  > 346.344 / 425). The air goes above the heads as `--vwd-trail-air: 28px`.
  > ⚠ `--vwd-chip` is the reel's PITCH DIAL alone now. ⚠ **NO INVERSE FILL on the
  > lit stop** — ADR-089 U4's fill reads as selection among OUTLINES, and these
  > stops have no boxes; filled, it would be the one painted ground on a station
  > whose guard exists to keep grounds off it. ⚠ **U23's `foot` triple is
  > 78 / 75 / 111** (tightest era at 1280×720 / 1101×800 / 1440×900) — U22's
  > 14 / 51 / 69 is its own conservation assertion and stays as written.
  > ⚠ 1752×599 is IMPROVED, NOT SOLVED: one era still overflows Scope by 28px.
- ⚠ **THE PHONE FITS RATHER THAN SCROLLS, AND THE STOPS RIDE THE FIGURE
  (ADR-082 U23).** `.vwd__stage` is `overflow: clip` (never `hidden`), which
  **supersedes ADR-083's inner scroll FOR THIS STATION** — a 100svh instrument
  the padding floor is waived for cannot hand its reading to a page that passes
  it in one flick. Four trims pay for it in the recorded order — one-line
  facts, the body's `padding-bottom`, the head→body gap, and
  `.vwd__film__frame { max-height: none }` DELETED (190px → 96 on a short
  screen, the largest avoidable term). ⚠ The era stops are **the same
  `nav.vwd__band` node moved by CSS**, which is what keeps the tablist, the
  roving focus, the testid and §G's actor; `isolation: isolate` (it kept
  `.vwh__cone`'s `plus-lighter` off their ink; the cone is deleted since U35
  and the isolation stays for whatever blends under the figure next).
  **This reverses half of U19**
  (the band on BOTH breakpoints) by owner ruling; desktop keeps its band.
  ⚠ **THEY CARRY A HALO, NOT A PANEL** — measured, their bed runs luminance
  **8 to 191** and changes with the era and every frame of the idle, so dawn at
  .45 was legible on one half and absent on the other. The halo is
  `--void-rgb`, which flips with the theme for free.
  ⚠ **VERIFY WITH `node scripts/probe-voidwalker-phone.mjs`** — 5 shapes × 5
  eras × 4 tabs, including two SYNTHETIC SHORT shapes, because real iOS gives
  `100svh` the small viewport and every CI phone project is Chromium. ⚠ It
  seats **`.vwd`, not `#voidwalker`**: the station keeps 76px of its own
  padding here and every rect compared against FIXED chrome is
  scroll-dependent. ⚠ Its first cut asked two wrong questions, both recorded in
  it — `scrollWidth` reports a 31px overflow that is `.gateway`/`.hud` and NOT
  a scrollbar (`scrollX` stays 0), and `scrollHeight` counts 192px of
  decorative projector bloom under the figure's feet.
- ⚠ **THE ERA FIGURES ARE GENERATED IN-REPO NOW (ADR-082 U24,
  `scripts/voidwalker-avatar/`, its own README).** Nano Banana Pro still → Veo
  3.1 idle → `geq` luma key → five deliveries at 720×1280. The offline skill
  that holds the original chain is on the owner's Windows machine; this is a
  rebuild from the surviving record, on the same wave layout so a sync merges.
  ⚠ **THE GATE THAT MATTERS IS SILHOUETTE FRAGMENTATION** — opaque RUNS per hem
  row, where a skirt is 1 and trousers are 2 (Architect **1.93**, azeroth
  **4.15**, the draw that shipped-and-dripped **7.87**, the one that ships
  **1.90**). A robe lit only along its fold highlights keys into vertical strips
  with the corridor showing between them, and it is NOT the model, the encoder
  or the LUT — the raw frames are clean, pre- and post-VP9 are identical, and
  every gain from 5 to 20 does it. ⚠ **A "how dark is the hem" metric RANKS THE
  SHIPPED ASSETS WORSE THAN THE BROKEN DRAW** (0.530 / 0.528 against 0.681)
  because what matters is whether the dark cloth reaches the SILHOUETTE EDGE,
  not how much of it there is. ⚠ And strengthening the prompt's lighting clause
  did NOT fix it — a second wave of five still scored 7.29–8.98.
  ⚠ **THE LUT IS DERIVED AND CALIBRATED AGAINST WHAT SHIPS**: `off = corner_max
  - 6`, `gain = 255 / (p10(lit) − off)`reproduces the thoughtform pair's
recorded`clip((val-8)\*12)`exactly. ⚠ The ground is sampled at the CORNERS —
a 20px border ring reads the robe's hem and produced a key that wiped the
figure. ⚠ **A TRIM ALONE DOES NOT CLOSE A VERY STILL IDLE** (motion 1.2/255,
best return 3.5 out): the tail is blended into the head and the join is
measured on the frames that ship. Veo's`last_frame`stays refused.
⚠ **THE FIGURE IS SEATED, NEVER CROPPED** — the slot's floor IS the projector
disc, so a figure ending at 0.945 of its canvas hovers above it.
⚠ **BOTH NEW ERAS SHIPPED**:`genai`(the Starhaven captain) and`expanse`(the
  set visit, in the production's MCRN plate, 3.29 runs/row). ⚠`expanse`'s Drive
  folders are GENUINELY EMPTY, not un-synced — all 38 siblings enumerate
  normally — so the owner supplied the photographs directly; its wardrobe takes
  TWO references (a solo frame for the silhouette, a lit group frame for the
  panels) and its cap is the IDENTITY's, not the set's, which is the uniform
  reading taken deliberately. ⚠ Its loadout was BYTE-IDENTICAL to `pokemon-go`'s,
  so the edit had to be scoped to its own block and a test pins them apart.
  ⚠ **`prompt.py`'s refusal stays even though `BLOCKED` is empty\*\* — the next era
    without a photograph must hit it and stop.
- ⚠ **EVERY ERA PAINTS ONE FIGURE HEIGHT, AND THE TITLE IS ON THE HOUSE RECIPE
  (ADR-082 U25, 2026-09-18, owner).** The delivery canvas is normalised and the
  figure inside it never was — `post.py` seats the FOOT and leaves `headY`
  wherever the generator put it, so the spans ran 0.9524 / 0.9367 / 0.876 /
  0.7343 inside five boxes that are **identical to the pixel**, which is why no
  guard on this surface ever saw it: they all measure boxes. `HOLO_FIGURE_SPAN`
  - `holoFigureFit()` (zero-import, in the registry) become `--holo-fit` on
    `.vwh__slot` and `.vwh__media` spends it on its box.
    ⚠ **THE BOX, NEVER A `transform: scale()`** — the scanline mask is on that
    element in absolute px, so a transform gives each era its own raster.
    ⚠ **BOTH AXES.** `contain` paints `min(w/720, h/1280)`, and the slot is NOT
    always the wider of the two: at 1920×1247 it is 460×845 (0.544 against the
    contract's 0.5625), so the media is WIDTH-bound and a height-only fit is a
    **no-op at 1** — measured, it left the floor era 20px short of the four it
    defines while reporting the 3.33 % spread it had just removed.
    ⚠ **SHRINK-ONLY, CLAMPED AT 1, AND THE CLAMP IS STRUCTURAL** — past ~1.077 the
    fit re-binds to width and overflows the wrap's inset clip, cutting the head.
    An era needing more than 1 is an asset to re-deliver; the unit guard fails on
    a span below the constant rather than letting the clamp do that work. ⚠ And
    the floor era must return **exactly 1** — `footY - headY` is a float
    subtraction, and `Math.min` alone hands it `calc(100% * 0.9999999999999999)`.
    ⚠ **THE SPAN IS 0.7343 BECAUSE AZEROTH CANNOT RISE, NOT BECAUSE IT WAS
    CHOSEN.** The owner ruled for the 2026 stature; `measure_anchors` — which
    reports **all four edges** now, because a span change is a WIDTH change —
    puts azeroth's composite at **0.9625 of the canvas wide**, widest at y 0.531,
    i.e. mid-torso and not the imps. The 1.212× that 0.876 needs cuts the spires
    both sides and bisects the right imp. ⚠ And only azeroth could be re-delivered
    here at all: he is the one era with no `.mov`, HEVC-alpha needs macOS
    videotoolbox, and re-cutting genai/expanse would leave a stale `.mov` and make
    Safari disagree with Chrome about the figure's height.
    ⚠ **THE TITLE'S SIZE WAS NEVER THE PROBLEM** — `.vwd__mast__title` already
    carried the house clamp at weight 400 in PP Neue; it was missing caps, `.04em`
    and the 22px gold glow, alone among the site's display titles. The case is a
    CSS transform, never the authored string, so the `aria-label` and the decode's
    `textContent` (and the smoke that reads it) are untouched. The ratchet pin
    rises A 1 → 2 and **C does not move** — the family arrives through
    `--vwd-display`, which `countBlock`'s probe cannot see.
    ⚠ **LEFT OPEN, BOTH NAMED IN U25** (the hover is CLOSED by U31's
    `azeroth-v11`): the four other eras are 14–23 % shorter
    than they were; and **azeroth hovers 23.6px above his disc** at 1920×1247
    (`footY` 0.9695 against the seated eras' 0.993–0.998 — `seat_frames` names
    this exact asset), closed by a 33-row downward shift its canvas has room for.
    ⚠ **Verify with `node scripts/probe-voidwalker-figure-span.mjs --vp 1920x1247`**
    — headed, walks the reel with the KEYBOARD, and measures the PAINTED picture
    rather than the element box. ⚠ Focus the lit chip first or `Home` goes to the
    document, scrolls the page to the top, and every era reads identical — which
    looks like a broken fit and is really a probe that never changed the era.
- ⚠ **THE PHONE'S "PANE AT THE BOTTOM" IS THE STRIP BELOW `100svh`, AND NO CI
  PROJECT CAN SEE IT (ADR-082 U26, 2026-09-19, owner).** On iOS Safari `100svh`
  is the SMALL viewport, so a backdrop sized in it stops ~99 CSS px above the
  real floor while the FIXED chrome (`.rin-settings`, `.hud__corner--br`) is
  pinned to that floor — which is why the theme switch sits inside the band and
  why it reads as a wash in BOTH themes (`.gateway__grain` blends `overlay` in
  dark and `multiply` in light: opposite operations, one appearance). Nothing
  paints it; it is the page showing through where the corridor's void backing
  ran out. `.home-v2-stage__canvas` takes `height: 100dvh; min-height: 100lvh`
  — safe to grow because **nothing is laid out inside a backdrop**.
  ⚠ **AND `.vwd` PAYS FOR THE STRIP TWICE — BY DECISION SINCE ADR-113.** The
  instrument is `100svh`, so `.vwd__band` reserves `--mobile-chrome-bottom`
  inside a box that already ends above the chrome once the toolbar collapses.
  U26 answered that with a LIVE term (`max(0px, calc(--mobile-chrome-bottom -
(100dvh - 100svh)))`, the toolbar's own height) and **ADR-113 (2026-09-20,
  owner) took it back out the next day**: the term reflowed the band, the
  stage's floor and the figure's slot for every frame of the bar animation,
  which he read as the section "settling". `--vwd-chrome-clear` is the
  constant again; 56px of figure column in the collapsed state is the price of
  a box that does not move, and `phone-viewport-units.test.ts` pins the sheet
  at zero `dvh`/`lvh`. ⚠ The comment that stood here before U26 — _"inside a
  100svh instrument this element's own bottom edge IS that floor"_ — was
  FALSE on a real iPhone and stays false; the reserve is paid knowingly.
  ⚠ **AND `.vwd` IS THE PHONE'S SNAP SEAT** (`scroll-snap-align: start`,
  `voidwalker.css` ≤960; the root is `y proximity`, landing.css's last block)
  — the probe's seat law written into the sheet. Nothing locked the
  instrument before: the owner's two stills were the same box ~50px high and
  ~100px low. Rules in `mobile-sections.md` §10.
  ⚠ **Chromium resolves svh/lvh/dvh to one number**, so every change above is
  byte-identical in CI and the only proof is a device: compare `innerHeight`
  with `.home-v2-stage__canvas`'s `getBoundingClientRect().bottom`.
- ⚠ **SUPERSEDED BY U31 (tagged rows; the well and the document mark are
  deleted), AND U31 BY U35 (cards whose thumbnail is the coverage's KIND) —
  kept for the ink laws, which still bind. Its "two of the six link nowhere"
  is stale: of the seven records ONE renders unlinked (the Gazet van
  Antwerpen piece).** **ON RECORD CARRIES A
  MARK, AND SINCE ADR-082 U29 THE ITEM AROUND IT IS A BOUNDED OBJECT (owner,
  2026-09-19: the articles "should really feel like a pill, like a sort of
  subtle button").** U26 refused the pill and the frame
  because both were read as PAINTED GROUNDS, which this station has turned down
  twice (U20's ghost frame, U21's rails) and which the `>700px` sweep exists to
  keep off — **but an outline is not a ground**, nothing here fills in any
  state, and an item is 368px wide against a 700px floor. So the item takes a
  four-sided `--vwd-rule-head` border (an object's own edge takes the REGION
  weight) and the mark sits in a square outlined WELL spanning both its text
  rows, which is what makes it read as a button's icon rather than as a bullet.
  ⚠ **THE AIR IS THE DIVIDER** — a foot rule between two bordered items is the
  doubled line ADR-089 U3 records, so `.vwd__press-stack` gains a real `gap`
  and the `border-bottom` + sibling `padding-top` go.
  ⚠ **THE STATE IS THE OUTLINE LIFTING, NEVER A FILL**, to `--gold-line` (the
  3:1 line-work rung, re-derived in light) and on ANCHORS only — two of the six
  records link nowhere and keep the outline, because they are records rather
  than dead buttons. ⚠ **SQUARE** (owner's call among three geometries):
  ADR-065 puts chrome at 0 on the depth ladder, a radius here would be the only
  one on the site, and a notch means oriented-or-connected, which six peers in
  a list are not.
  ⚠ `--vwd-press-mark` is **21px** (a 3px cell) with the well at 28 — the mark
  plus one lattice cell of air each side, so the two cannot drift; 14px was its
  match beside a 10px label in a bare gutter and is a speck inside a well.
  What U26 ruled and still binds: `PressGlyph` sits beside `FigureGlyph` on the
  same grammar — rect-only, 7×7 at integer cells, `crispEdges`, no text node.
  ⚠ **ONE MARK, NOT ONE PER OUTLET** — the outlet's NAME is the next thing in
  the row, so a glyph per publication is a second encoding of it, which the
  particle grammar calls decoration. What it earns its gutter with is the INDEX
  read. ⚠ **The lit rule means the piece LINKS OUT**, which two of the six do
  not — `VwPress.href` already held it and the surface never said it, so the
  zero-import record is untouched. ⚠ **DAWN ONLY** (gold is the reel's "you are
  here"), at `.45` / `.8`: the mark reads at its LABEL's strength, never its
  rule's — the first cut took `--vwd-rule-head`'s .3 and came out quieter than
  the thing it keys. ⚠ A HELD gutter track, and `align-items: center` never
  `baseline` (grid synthesises a replaced element's baseline from its bottom
  edge — it still applies, on the well now). ⚠ U26's `foot` triple of
  78 / 75 / 111 is **superseded by U29's 63 / 72 / 98**, and the tightest seat
  changes hands to TRANSMISSION at 1280×720 — the film frame is what grew.
- ⚠ **THE FIGURE OVERSCANS ITS SLOT, AND THE BOX WAS NEVER THE SMALL THING
  (ADR-082 U29, owner: "the avatar is nicely sized in comparison with the
  elements around it").** At 1920×1247 the media box is the figure column at
  its 460px cap and the painted figure is 71 % of it — the rest is the
  delivery's transparent headroom plus U25's equalising fit. ⚠ **NO CHROME TRIM
  REACHES IT**: `--vwd-fig-w` computes 462 against a 460 cap there, so the
  column is CAPPED rather than starved. `--holo-overscan` multiplies
  `.vwh__media`'s box on BOTH axes beside `--holo-fit`; the wrap is
  bottom-seated, so the growth leaves through the top and the sides and the
  boots stay on the disc.
  ⚠ **ALPHA BRANCH ONLY** — the floor branch's opaque bed lives on the wrap
  (U6, U27), and a media overflowing it paints the asset's near-black ground
  over the mast. ⚠ **THE DEFAULT IS 1**, so the lab, the phone and the
  701–1100 rung are byte-identical without naming it. ⚠ **THE CEILING IS THE
  COLUMN'S AND IS NOT THE VALUE** — `fig-w + 2 × gap` gives 1.199 at the
  narrowest capable rung, which measured **1px** of live clearance; 1.16 ships,
  with 5–12px of air at the four rungs. ⚠ **NOT A `transform: scale()`** (U25).
- ⚠ **THE PANEL LADDER RIDES `svh` AND EVERY FLOOR IS WHAT SHIPPED (U29).**
  The composition is height-derived and the type was on `vw` clamps, so the
  chrome ran at half the reference's share while the paragraph was at 86 %.
  Head 1.55svh; label, meta, film title and the absent line 1.2; value and
  headline 1.45 — two ratios, so the ladder still reads HEAD then ROW.
  ⚠ **SCOPED TO `min-width: 1101px`**, because the ≤700 sheet declares
  `.vwd__facts__row` and NOTHING ELSE of the ladder: a base-block raise grows
  every string inside a `100svh` instrument whose budget is solved and whose
  `overflow: clip` hides the overrun. ⚠ **TWO FLOORS CAN SHARE ONE RATIO** —
  the value's 12.5 and the headline's 13 do, and merging them takes the
  headline DOWN at 1280×720 while everything else rises.
  ⚠ **THE MOTTO IS A LEDE, NOT A KICKER** — the display face at the body's
  register and `--weight-lit`, which is what the reference does with
  `INDUSTRIALIST`; mono at the chrome rung made a SENTENCE read as a label.
  ⚠ NEVER a mono 700: PT Mono has no 500.
- ⚠ **A FILM FRAME'S WIDTH IS TRANSFERRED FROM ITS HEIGHT CAP UNLESS DECLARED
  (U29)** — the frame is the media card's `.vwd__mcard__frame` since U31, and the
  law carried over with it (plus: an `aspect-ratio` flex item needs an explicit
  `min-height` to shrink). `.vwd__film__frame` had an `aspect-ratio` and no width, so
  `max-height` set its inline size through the ratio — 267px inside a 368px
  head rule, which is what the owner read as "not the same length as the
  divider". With `width: 100%` the cap becomes a CROP (the poster is
  `object-fit: cover`) and is restated as a band. ⚠ **Desktop only** — that cap
  is the phone's largest budget term, the one U23 deleted `max-height: none`
  for.
- ⚠ **THE LATENT LAND ERA IS 2023** (U26). One authored value with a twin in the
  ADR-074 record — `voidwalkerData.ts`'s `year` AND `sortYear`, the latter
  floored into the travel clock's tick ladder. No test pinned it; the era suite
  checks the year's grammar and its reverse-chronological order only.
- ⚠ **THE PHONE HAS ONE GUTTER AND IT IS THE FRAME'S (ADR-082 U27, 2026-09-19,
  owner: the elements "should just be contained within the top-left and
  bottom-right corners").** `#voidwalker.station` is `padding-inline: 0` at
  ≤700, so every child pays its own — and `.vwd__tabs` paid NOTHING, which put
  its two hairlines on the viewport's edges. `--vwd-pad-x` is `var(--hud-margin)`
  now, the same line the corner brackets sit on, so "inside the corners" is true
  by construction; the band spends the same token instead of its own near-twin.
  ⚠ **MARGIN, NOT PADDING, ON BOTH ROWS** — the tab row's rules ARE its border,
  and the band is `overflow: clip`, which clips to the padding box. Measured:
  tabs and band both **16/377**.
  ⚠ **NO HORIZONTAL SCROLL EXISTS** — `body` is `overflow-x: hidden` and the
  probe's 31px is `.gateway`/`.hud` at `100vw` plus a CHROMIUM scrollbar.
- ⚠ **THE REEL IS BACK ON THE PHONE, AND IT REVERSES HALF OF U23 (U27).** Five
  stops across 361px is a 72px pitch against 65px of ink at 8.6px — **two
  pixels**, and at five across 8.6px IS the ceiling, so no gutter could have
  fixed it. Three stops at ~120px carry the names at 11px. ⚠ What U23 ruled
  against survives: a band with a gutter and a FADE, never a painted ground.
  ⚠ `--vwd-cell` is solved from the BAND (`(100vw − 2·pad-x)/3`), not the chip.
- ⚠ **ONE FIGURE HEIGHT ON THE PHONE, AND `--holo-fit` WAS NEVER THE DEFECT
  (U27).** The fit scales both axes, so the span factors out of `contain`; what
  was era-dependent is the SLOT — `.vwd__mast__title` wraps to one line or two
  per era and the stage takes the remainder. "The AI Captain" (1 line) painted
  the biggest figure and "The campaign commander" (2) the smallest. ⚠ The phone
  **straddles the binding boundary** and a real iPhone is height-bound at every
  era, so there the wrap decides outright. A **two-line reservation** fixes it
  (376px on all five, from 455.7–461.8); ⚠ the clamp is NOT stepped down.
  ⚠ **AND EVERY TAB RESERVES THE STOPS' STRIP NOW** — it read
  `:not([data-vwd-tab="figure"])`, which ran the figure's box to the sheet's
  floor and printed the band over the boots and the disc. `--vwd-band-reserve`
  and `--vwd-chrome-clear` are declared once and spent by both the band and the
  stage. ⚠ `probe-voidwalker-figure-span.mjs` still exits below 1101px, so this
  law is unguarded exactly where it now matters most.
- ⚠ **THE PROBE'S HORIZONTAL QUESTIONS ARE NEW (U27).** It computed
  `chipUnion.left/right` and compared them to nothing, and used the tab row only
  as a driver — which is how a full-bleed row passed 100 cells green. It asserts
  the tabs and the band inside `--hud-margin` AND on the same line as each other.
- ⚠ **EVERY ERA'S HEAD LANDS ON ONE LINE ON THE PHONE (ADR-082 U28,
  2026-09-19, owner: "the avatars are still too much down; they should be
  more up").** U25's fit made every era the same HEIGHT and left every head
  somewhere else: the media shrinks inside a full-height, bottom-seated slot,
  so the fit's slack pools ABOVE the head, and each canvas has its own
  headroom on top (azeroth 0.235, the Architect 0.048). Measured 137–152px of
  empty stage over the head with the disc ON the band. `holoFigureHeadShare`
  (`fit × (1 − headY)`, zero-import) is written on `.vwh__column` as
  `--holo-head`, and the ≤700 sheet translates the COLUMN — slot and disc,
  one object — by `head-air − (1 − head) × (100% − base-h)`. Every head at
  60px under the stage's top, the disc 76–90px off the band, the figure still 376. ⚠ **A CUSTOM PROPERTY NEVER INHERITS UPWARD** — a column rule reading
  the slot's `--holo-fit` got 1 on every era. ⚠ **THE TABLET AND PHONE BLOCKS
  CARRY THE SAME COLUMN RULE WITH THE SAME COMMENT**, and one cut landed in
  the wrong one; measure the element's computed `translate`, not the file.
- ⚠ **THE PHONE PANNED SIDEWAYS, AND THE 31px U27 CALLED HARMLESS WAS WHY
  (U28).** iOS reads the ROOT's overflow, not `body`'s; `landing.css`'s ≤960
  block clips `html, body` now (`clip`, both, or every sticky dies — rule
  `mobile-sections.md` §9), and `.vwd__band` takes `touch-action: pan-y` for
  the swipe itself. ⚠ Chromium was reproducing the pan as a ZOOM-OUT the
  whole time (the "421px wide" emulator): the harness lays out at 390 now.
- **`voidwalker-hologram.css` IS THE FIGURE'S SHEET NOW** — the slot's
  isolation and masked floor, the alpha branch, the projector base, the phase
  animations, the decode lines, and the four tokens those read. ⚠ **`.vwh`
  declares NO LAYOUT**: it is the token host, and the element that gives the
  figure its box differs per home (`.vwd__vwh` on the landing,
  `.hll__figure` in the figure lab). Both must make **both axes definite** —
  the slot and the media size by percentage and resolve to nothing against an
  auto track.
- **`/test/voidwalker-holo-lab` is the FIGURE lab now.** Its knobs were
  always `HoloFigure` props (form, media, blend, alpha, scan pitch, glow);
  the panels it mounted were incidental and went with the composition. It is
  the only place those treatment knobs exist, which is why it was retuned
  rather than deleted.
- ⚠ **THE ERAS MOVED OUT OF THE HUD GUTTER TO A BAND AT THE FOOT.** ADR-082
  U9 put the scrubber on the left rail precisely so it cost no column; this
  spends a band on it instead, by owner ruling, because the selector must read
  as character-select on BOTH breakpoints. The gutter is left EMPTY rather
  than refilled — do not put something else there to "use" it.
- ⚠ **THE PIN BELONGS TO THE STATION, NOT TO A COMPOSITION.**
  `voidwalker.css`'s sticky rule is written against the station's own child.
  It named `.vwh` while that was the only interior, and when the datum root
  arrived alongside it the new root silently lost its sticky and translated
  through the whole 260svh runway — the exact "the section slides over the
  one before it" defect that rule exists to fix, failing with no error and no
  red guard. Whatever ships inside, it pins.
- ⚠ **THE THREE HANDOFF TARGETS ARE THE ATOMIC GATE.** `portrait` (the slot,
  inside the figure node), `dossier` (the top-left seat — SCOPE) and
  `era-title` (the mast heading) must all measure or the receiver never
  publishes `data-vw-handoff="ready"` and the `-120svh` overlap silently
  disarms. ⚠ **ONE FIGURE NODE, BUILT ONCE** in `VoidwalkerHologram` and
  handed to whichever composition renders: two would publish two `portrait`
  rects and the receiver would measure whichever mounted last.
  Verified live: `handoff: "ready"`, all three targets found, `pinned: 0`.
- ⚠ **THE TWO DATUM RAILS AND THE GROUND DATUM ARE DELETED (ADR-082 U21,
  owner: _"there are these long horizontal lines … remove those"_).** Three
  1653px hairlines ran the full plate at 1752 wide. They were the
  composition's own argument, so this is a reversal, not a tidy-up: U19 chose
  them to replace wave 1's leader lines, on the reasoning that the panels
  should be tied by SHARED STRUCTURE rather than by a line landing on a
  shoulder. That reasoning stands; what it never settled is whether the tie
  has to be DRAWN. Each head keeps its own rule (`.vwd__head`'s border-bottom
  at .3, against the rails' .12), the four heads still share two rows, and
  **alignment carries the connection with no ink at all**. The leader lines
  stay deleted — only their replacement went.
  ⚠ **The heads and bodies stay SEPARATE grid items.** The rails they were
  split for are gone, but the split is what puts both columns' heads on one
  row whatever their content does.
  ⚠ **If a rail ever returns it may not be full-bleed** — the old
  `margin-inline: calc(var(--hud-margin) - var(--vwd-pad-x))` existed because
  a line run to the viewport edge crosses the HUD rails' own tick ladder, two
  line systems meeting at a shallow angle.
  ⚠ `--vwd-rail` SURVIVES as the surface's quietest hairline alpha; its one
  remaining consumer is the phone tab row's borders. The lab's RAIL knob is
  deleted with the rails.
- ⚠ **THE READING MEASURE IS `--vwd-measure`, AND IT MAY NEVER GO BACK TO
  `ch` (ADR-082 U21).** `ch` resolves against the element's OWN font, so one
  line of CSS — `width: min(100%, 38ch)` on a head and its body — produced two
  different boxes: the head is PT Mono at 13px (**296px**), the body inherited
  at 16px (**365px**). Both are `justify-self: end` in the left column, so
  every head's left edge sat **69px inboard** of the prose beneath it. Not
  tunable — the two numbers come from different fonts. `rem` is the root's
  size and is the same everywhere; measured after, head and body are
  byte-identical at 368px in both columns.
  ⚠ **And `.vwd__body` now DECLARES its family.** It was inheriting
  `--font-mono` (IBM Plex Mono, not this surface's PT Mono) — ADR-067's
  recorded trap — which is what `ch` was resolving against. Every child
  declares its own face, so nothing rendered wrong; the container's font was
  doing arithmetic instead.
- **The lab is a WINDOW, not a copy.** `/test/voidwalker-datum-lab` mounts
  `HoloDatumPanels` and imports `voidwalker-datum.css`; its own sheet is
  `.dlab*` knob chrome only. `--vwd-bar-h` is the one value that differs
  (0 in production, the bar's height in the lab).
- ⚠ **THE RAIL DATUM IS GATED TWICE, AND BOTH GATES ARE THE RULE (ADR-082
  U20).** `--hud-rail-y-start` is a VIEWPORT Y while the sheet's padding is
  SECTION-RELATIVE; they coincide only where `#voidwalker` has surrendered its
  own `padding-block` and pinned to `top: 0`, which happens only under
  `[data-vw-mode="hologram"]`. Ungated it would overshoot by ~119px on
  desktop-PRM, the corridor fallback and 701–1100px — the very rungs it was
  meant to fix. And it is affordable only above `min-height: 720px`, the
  shortest reference viewport: the capable gate is width-only, so a half-height
  window on a wide monitor enters hologram mode at 599px tall, where the datum's
  89px comes straight out of the body rows.
  ⚠ **The lab re-declares ALL THREE by hand** (`voidwalker-datum-lab.css`) — a
  rule the lab's selector cannot reach is a composition the lab cannot show, and
  without it the window would hang 82px higher than the landing with a figure
  column 15px wider. Move one rung, move the other.
- ⚠ **THE LEAD IS SPLIT IN TWO, AND U20's DATUM SEATED THE KICKER (ADR-082
  U22).** The four panel heads U20 was about have never been on the rail line —
  they sit ~67px below it at the mast's foot. So `--vwd-pad-top` stays the TOTAL
  lead (every consumer keeps reading it, `--vwd-chrome-h` included), the new
  `--vwd-mast-top` is what `.vwd__sheet` pads by, and `.vwd__mast` carries the
  remainder plus `--vwd-trail` as a bottom margin. The mast hangs from
  `--hud-corner-foot` — the TL bracket's foot — because `--hud-rail-y-start` is
  that foot plus `clamp(16px, 1.8vw, 32px)` of clearance **for a drawn line**,
  which type does not need. Title rises 23.0 / 19.8 / 25.9 / 32.0px at the four
  reference rungs.
  ⚠ **THE SPLIT IS CONSERVATIVE OR IT IS BROKEN** — the total does not change,
  so the figure column and every head are byte-identical, and the probe's `foot`
  at 1280×720 / 1101×800 / 1440×900 (14 / 51 / 69) is the assertion that says
  so. Any movement there means the lead was not conserved.
  ⚠ **`--vwd-mast-top`'s BASE READS `--vwd-pad-top-min`, NEVER `--vwd-pad-top`**
  — custom properties substitute at computed-value time on the same element, so
  the base would silently follow the gated override and the split would
  evaporate with nothing to throw.
  ⚠ **`--vwd-trail` RIDES THE MAST'S MARGIN, never `.vwd__stage`'s
  `padding-top`** (the phone rung declares that as a longhand which beats a
  shorthand by luck, not intent), and `--vwd-chrome-h` charges it as its OWN
  difference — never folded into the tuned `104 + 44` surplus. Its 56px ceiling
  is DERIVED from the figure's 494-against-460 cap headroom; re-derive it if the
  cap moves.
  ⚠ **IT COSTS THE PANELS ~13 % OF THE FIGURE COLUMN AND 32–53px OF BODY ROW,**
  paid back out of band padding, the facts' own gap and row padding, and body
  padding-bottom — chrome first, rhythm second, **never the type**. Measured
  headroom after: **15px at 1280×720**, 178px at the owner's 1920×1247.
- ⚠ **1752×599 STILL CLIPS, AND IT DID BEFORE THIS PASS** — Scope +64px /
  Facts +43px now against a measured baseline of +69 / +58 plus a collision.
  Short-and-wide is a genuinely unsolved shape for this composition, improved
  rather than fixed; do not read a green probe at the reference viewports as
  clearance there.
- **Verifying (U31 adds):** `node scripts/probe-voidwalker-figure-span.mjs --vp
1920x1247` (heads on the row line, one seat line — the disc line until U35
  deleted the disc — the ring on the figure, no cut, no era UNSEATED),
  `node scripts/capture-era-media.mjs --vp 1280x720 --record --era <each>` and
  `--vp 375x553` (the pile's fit on every rotation, and since U35 every front
  still decoded and every framed dialog 16:9 inside the viewport), and `python
scripts/voidwalker-avatar/gold.py --selftest` (the exposure gate a delivery
  must pass).
- **Verifying:** `node scripts/probe-voidwalker-eras.mjs --vp 1280x720` is the
  height gate — it walks every era and reports each panel's overflow AND its
  `foot` headroom, plus the reel's pitch against the widest rendered chip name
  and a pointer hit-test on the centred chip. ⚠ **It drives the reel with the
  KEYBOARD** (`Home` / `ArrowRight`), because two of the five chips are always
  outside the clip window and an `overflow: clip` box is not scrollable — a
  per-chip `page.click` times out reporting "element is not stable", which reads
  like an animation fault and is really "that chip is off the reel".
  ⚠ **`clientHeight − scrollHeight` CANNOT REPORT HEADROOM** on an
  `overflow: hidden` box: `scrollHeight` is `max(clientHeight, content)`, so it
  is exactly 0 whenever the content fits. The `foot` metric is the gap between
  the last glyph and the box's bottom edge.
  Then `node scripts/capture-voidwalker-station.mjs` — HEADED, real
  scrolls, walks the runway and prints the layout, mode, handoff state, pin
  offset and scroll-derived era at each stop. ⚠ Headless is wrong twice over:
  the corridor is WebGL, and Chromium has no H.264 so the MP4 fallback paints
  nothing.
- ⚠ **FROM 701px UP THIS IS SUPERSEDED BY U31's FIVE-BUST GALLERY** (the track
  is `transform: none`, `--vwd-reel: 5`); the reel below still governs the
  phone. **THE ERA BAND IS A REEL WINDOW (ADR-082 U20)** — the selected era is
  always at its centre and the track turns behind a bounded window, so the reel
  rotates as the reader travels the runway. **A full-width track cannot roll**:
  five cells come to ~550px against a 1440px band, so centring only shoves the
  group sideways (220px at era 0) with dead band beside it — this sheet's own
  earlier finding ("five things that happen to share a row") from the other
  direction, and a wider pitch reproduces it. The window is
  `min(100% − 2·--hud-margin, --vwd-reel × --vwd-cell)`, masked at both edges.
  ⚠ **The offset is `(n/2 − i − 0.5) × cell`, which is exactly 0 at the middle
  era** — the reel is byte-identical to the row it replaced there, which is how
  the change proves itself additive. `--vwd-i` and per-chip `--vwd-d` are plain
  integers written by the component; all the arithmetic is in the sheet.
  ⚠ **`overflow: clip`, never `hidden`** — `hidden` is a scroll container, so
  `.focus()` on a chip the window has not reached would set `scrollLeft` and
  leave the reel offset underneath its own transform.
  ⚠ **NO `gap` on the track, at any rung** — cells sit `cell + gap` apart while
  the offset steps by `cell`, so the selected chip drifts off centre by
  `i × gap`, silently.
  ⚠ **The chips keep their own width (`justify-self: center`)** — a grid item
  defaults to `stretch`, and abutting targets mean a click one pixel off pins
  the scroll to the wrong era (ADR-082 U10), which is a navigation error.
  ⚠ **The falloff lives on the chip's CHILDREN.** `.vwd__chip`'s opacity and
  transform belong to §G's entry ladder, so a falloff declared there is
  overwritten the moment the station arms.
  ⚠ **The old `border-top` was a DUPLICATE, not a divider** — `.vwd__ground`
  WAS a 0px track on the same Y (⚠ deleted itself in U21, with the rails), so
  the two composited to ~0.36 alpha between the HUD margins and 0.2 outside:
  a foot rule brighter in the middle, running through the HUD rails. **The
  band's top edge carries NO rule now, by decision, two passes deep** — the
  border-top does not come back just because its "duplicate" is gone;
  restored, it would be the full-bleed line through the tick ladder both
  passes removed, and the U21 sweep in the boundaries smoke fails it.
- ⚠ **AN ABSENT SEAT IS SAID, NOT DRAWN (ADR-082 U20).** `.vwd__absent` is one
  mono line — no box, no glyph. The dashed 16:9 ghost frame is deleted (it was
  the empty-slot idiom itself), and ON RECORD gained the same line: it used to
  render a heading over literally no text nodes, which is why the era probe
  reported `panels=3` on `loop` where every other era reports 4. ⚠ The heads'
  `None` tag that stood beside it is DELETED since U36 (no head carries a tag;
  the body's line is the one statement of an absence, and every era has a pile
  since U34). ⚠ **Not a diamond**: the filled gold diamond means "you
  are here" on the reel one row below, so the same glyph as an absence marker
  inverts its own meaning on one screen.
- **The entry/exit choreography is ported** (`voidwalker-datum.css` §G) — the
  same three-ramp terminal power-on, the same 2.5px tear, the same
  `[0,.22]` / `[.74,.96]` clocks. ⚠ **THE TWO TRANSFORMS ARE COMPOSED, NOT
  NESTED.** `.vwh` hangs the exit on `.vwh__side` group containers so it can
  never collide with the children's entry tear; the datum heads and bodies
  are DIRECT grid items, and wrapping them is exactly what would break the
  rails, whose precision comes from a head's bottom edge BEING a row
  boundary. Entry spread + tear + exit travel are three additive terms of one
  translate; where a group does exist (mast, figure, band) the container owns
  the exit as before.
- **The exit splits by side.** Mast + left cells clear left; figure, right
  cells and the era band clear right. (The rails and ground used to leave
  with the figure — the ground being the projector's own plane extended —
  and went with them in ADR-082 U21.)
- ⚠ **THE DOSSIER SEAT DOES NOT SPREAD** — it takes the tear only. The About
  dossier flies into that exact footprint, so a 21px entry offset would make
  the receiver's measured rect wrong for the whole entry.
- **Verifying the motion:** `node scripts/probe-datum-motion.mjs` — walks the
  runway and prints per-actor opacity and translateX at eight points.
  Measured: 0 opacity and ±21px spread at `in` 0, everything opaque and
  **tx exactly 0 at rest** (the zero-at-rest rule), and every actor past the
  1440 viewport by `exit` 1.

## The HUD panel lab (look-dev, `/test/hud-panel-lab`)

**Seven directions on this stage and on the proof casefile (the seventh, `06 · Listing`, derived from a random seed — `docs/design/hud-panel-lab/seed-listing.md` — crosses this station as lines alone: no ring, the mast as a listing header row, three double rules, a reticle pair on the bay, the active chip's mark as a phosphor cursor, zero new lettered elements), judged inside the
REAL frame** (2026-09-02, owner: the panels "just seem to be floating … they
don't really feel integrated as part of a HUD or interface"). Nothing here
changed; no ADR until a direction wins. Full read, the reference distillations
and the owner questions:
[`docs/design/hud-panel-lab/README.md`](../../docs/design/hud-panel-lab/README.md).

- **The lab is a WINDOW, not a copy.** It mounts `HoloDatumPanels` WHOLE in
  every direction and builds the production `HoloFigure` node — nothing inside
  that component is exported (the reel's roving focus and its `--vwd-i` /
  `--vwd-d` arithmetic, the bust anchors, the decode line pairs, the
  lightbox), so a lab-local composition would fork ~250 lines of behaviour.
  The lab owns exactly two seams: the `figure` prop and CSS scoped by
  `[data-hpl-dir]`.
- ⚠ **THE FIGURE MOUNTS ONLY AFTER THE ALPHA PROBE SETTLES.** `HoloFigure`
  LOCKS `getHoloAlphaSupport() === true` at mount and treats the undecided
  `null` as the floor branch — correct on the landing, where the station is
  four sections down, and wrong anywhere the figure is the first thing on the
  page. On the floor branch a headless capture gets an H.264 `.mp4` it cannot
  decode and paints an opaque poster: a frame that looks exactly like a broken
  composition. The gate asserts `data-holo-alpha` is present.
- ⚠ **THE FOOT CAN NEVER BE A RULE AT THE RAIL'S LAST TICK.** Measured: that
  tick lands **16px INSIDE the chip frames at 1280x720**, 6.5px inside at
  1440x900, and exactly on the band's twice-deleted `border-top` at the
  owner's 1920x1247. Every housing here is OPEN-BOTTOMED and the chips are the
  terminus; the band rule is behind `?foot=rule`, band-inset, purely so the
  U21 amendment can be looked at.
- ⚠ **A HOUSING HERE IS OPEN-BOTTOMED AND PRINTS NO FOOT ROW.** The walls stop
  at the reel's top edge and the chips ARE the terminus — that is what the open
  bottom declares — so a foot row below the reel belongs to neither, sitting
  outside the enclosure it is meant to close.
- ⚠ **AND ITS GLASS IS A JUDGEMENT THE LAB CANNOT SETTLE.** This station is
  TRANSPARENT by law — the corridor's ambient survives through it and it
  overlaps `#about` by -120svh — so at the console's own 0.86 a slab here is
  the black plane `voidwalker-datum.css` records against its own root. At 0.42
  it measures a 3-unit darkening over void, i.e. a tint. But the question is
  what the CORRIDOR looks like through it, and a lab with void behind it can
  only show that the glass is not a pane. One look on the real page before any
  promotion.
- ⚠ **THE HOUSING IS THE SERVICES PLATE'S MATERIAL, AND A PADDED GRADIENT
  SHELL NEEDS AN OPAQUE BODY.** `v2` carries the plate's 168deg
  gold → dawn → gold lip over its glass (dawn wash, gold corner bloom,
  scanline, blur) at `rgba(void-deep, 0.42)` — half `--con-ground`, so a tint
  rather than a pane (owner, 2026-09-02). ⚠ `.svc-plate__sh` gets away with
  `padding: 1px` + a gradient behind an inset body ONLY because that body is
  72–58% opaque; at 0.42 the shell read straight through and lit the panel
  warm-grey (30,25,17 against the void's 10,9,8). **The giveaway was that
  `?mat=line`, which paints no ground at all, produced the SAME lightening** —
  so the ground was never the cause. The lip is a clipped RING now (outer
  chamfered contour clockwise, inner counter-clockwise; nonzero winding makes
  the middle a hole), which also puts back the edge a `clip-path` had removed:
  **a clip cuts a border, it never strokes one**, so the earlier flat-border
  housing had no line on either diagonal.
- ⚠ **TWO OF THE PLATE'S VALUES DO NOT SURVIVE THE CHANGE OF SHAPE.** Its
  bloom is `radial-gradient(130% 70% at 84% -8%)` — percentages of a 420x680
  CARD, ~550px, a corner catching light; the same fractions on an 1150x600
  housing are 1495px and light the whole quadrant, so the bloom is stated in
  PIXELS. And `brightness(1.08)` belongs to the plate's OPEN state, tuned for a
  small card over a bright WebGL bed; over a band of void it turns the ground
  grey. The seed body's plain `blur()` is the one that generalises.
- ⚠ **THE GOLD LIP CONTRADICTS `console.css`'s "the panel's own edge is DAWN,
  not gold", deliberately.** The services card's own edge IS gold, so the house
  has two precedents pointing opposite ways; the difference is that a console
  is a SCREEN you look into and a card is a machined SLAB you look at, and this
  is the device the screen is set into. Owner instruction; the README asks for
  the scope. ⚠ The structure INSIDE stays dawn either way and the ledger still
  asserts zero gold on the register's rules, the directory's rule, the column
  seam and the era heads.
- ⚠ **A HEADER ROW BUYS ~20px AND A FOOT ROW SPENDS IT.** The mast stacks an
  11px kicker over a 42px title, so a row is the taller of the two; `v4`'s 2px
  datum then overspent by 6px until its air came down to 4px and the foot band
  to 22px. Chrome first, rhythm second, never the type — the ADR-082 U20 order
  of sacrifice, in a new place.
- ⚠ **THE TITLE CANNOT SEAT AT THE BAY'S WIDTH.** Its clamp is byte-locked to
  the About name's footprint (the name flies into it and translates without
  scaling), and "The campaign commander" at 38.4px needs ~420px against a
  230px figure column — so `v5` centres the title on the bay's AXIS at its own
  measure. Found on `expanse` alone, which is why the gate walk visits all
  five eras rather than shooting one.
- **The datum raise is re-declared by the lab, by hand**, at the same
  `min-height: 720px` rung as production — the gate is
  `#voidwalker[data-vw-mode="hologram"]` and no lab can satisfy it. Move one
  rung, move the other.
- **Verifying:** `node scripts/capture-hud-panel-lab.mjs` — 165 cells; the era
  walk covers all five eras at 1280x720 and gates on ink-measured clipping,
  containment, the U21 wide-ink sweep (against the STATION's band, not the
  direction's own), ladder crossing and the type floors.

## Current hologram contracts (2026-08-27)

Read ADR-083 before changing the proposed `<=700px` identity → figure → era
rail → dossier-mode instrument; it intentionally leaves the capable desktop
handoff and the `701–1100px` complete fallback alone.

- **The capable station is transparent, not a cover plane.**
  `useVoidwalkerHologramScroll` writes `data-vw-mode="hologram"` only at
  `min-width: 1101px`, with motion allowed and a live corridor. That mode
  removes station padding and the inherited void + star surface. The corridor
  ambient survives past this station; `VOIDWALKER_EXTENDS_CORRIDOR` permits the
  handoff, while the live mode attribute makes `useCorridorExitScroll` and the
  CSS cover choose that rect in lockstep. Without the mode, `#voidwalker`
  remains the first opaque cover and owns the kill.
  ⚠ **THE STATION THAT TAKES THE COVER HAS MOVED TWICE AND IS `#musings` NOW**
  ([ADR-119](../sentinel/decisions/119-the-musings-rack.md), 2026-09-22; the row
  that opens on hover since [ADR-121](../sentinel/decisions/121-the-musings-row-opens-on-hover.md),
  2026-09-23) — it was `#practice` when this paragraph was written, then
  `#contact` under ADR-105. ⚠ On the capable rung `#musings` is itself a
  TRANSPARENT stage (ADR-119 U1) and **the cover is `#contact` again since
  [ADR-105 U4](../sentinel/decisions/105-the-page-ends-on-a-bold-footer.md)
  (2026-09-24)** — the footer welded up over the list's last viewport and
  rising over it, opaque at z 8; ADR-119 U1's 100svh `.mu__band` is deleted.
  Below 1101px, under PRM and on the fallback the station is opaque and is its
  own cover. ⚠ The lockstep has FOUR readers, not two: `home-v2.css`'s
  mode-gated `#musings[data-mu-mode="stage"]` promotion rule,
  `useCorridorExitScroll`'s query (`musingsCover` is `contactEl ?? musingsEl`
  on the stage rung), `about-voidwalker-handoff-boundaries`' cover case and
  `services-ring-smoke`'s ambient-hold case (which reads it twice) — all four
  name `#contact` there. Splitting them hard-cuts the canvas at one of their
  edges — ADR-030 §6, on record as hit six times. Rules:
  [`musings.md`](musings.md).
- **Every hologram path is starless.** `data-vw-surface="hologram"` removes
  `v7-stars.svg` on static fallbacks too. Mobile, tablet, PRM, flag-off and
  corridor-fallback remain solid-void normal flow; they never inherit the
  `260svh` runway or sticky child.
- **One reversible writer.** `useVoidwalkerHologramScroll` derives progress
  from `.vw--hologram` geometry and writes only `--vwh-in`, `--vwh-exit`,
  `data-vwh-ready`, station mode and the component-local progress ref. Entry is
  `[0,.22]`; exit is `[.74,.96]`.
- **Nothing enters or releases vertically.** Entry copies About's terminal
  stutter (three opacity ramps + 2.5px transient tear) in place. Mast/left
  groups exit left; figure/right/rail exit right and are offscreen before the
  sticky child releases. No one-shot observer, transition, `translateY` or
  permanent latch may own this beat.
- **Decode means blank, then queue.** Masthead leaves are blanked before the
  caption kernel arms at `.05`, restored/re-armed below `.02`, and replay on
  reverse/re-entry. Queueing rendered finals against themselves is a no-op.
- ⚠ **THE MEDIA FLOOR IS THE FALLBACK NOW, NOT THE DEFAULT (ADR-082 U6).**
  `.vwh__slot` isolation + the masked opaque `.vwh__media-wrap` ground exist
  only to fake transparency for an OPAQUE H.264 source, and over a station that
  paints transparent onto the corridor's non-uniform ambient that floor IS a
  visible black pane — by construction, not at its edges. Three attempts at its
  edges failed for that reason. The exit is real alpha: `videoAlphaPath`
  (VP9/WebM `yuva420p`) + `posterAlphaPath`. On that branch `data-holo-alpha`
  switches the hacks off — `mix-blend-mode: normal`, no ground, transparent
  wrap, `isolation: auto`.
  ⚠ **HOW THAT ALPHA IS OBTAINED IS PER-WAVE AND IS NOT A LUMINANCE KEY BY
  LAW.** The thoughtform pair is keyed from luminance; the Azeroth pair
  (ADR-082 U13) is DIFFERENCE-MATTED against a captured backdrop plate,
  because Wowhead's dressing-room backdrop is inside the canvas and the dark
  cloth is within a few units of it — a key loose enough to catch the cloak
  eats the claw pattern. The registry field is the contract, the matte recipe
  is the wave's.
  ⚠ **SAFARI HAS AN ALPHA SOURCE NOW (ADR-082 U23), AND THE PREMISE THAT STOOD
  HERE WAS STALE.** It read "Safari has no self-hostable alpha codec here
  (HEVC-alpha needs macOS videotoolbox)" — it needs macOS videotoolbox and this
  IS macOS. `CharacterEraHologram.videoAlphaHevcPath` is HEVC-with-alpha in a
  QuickTime **`.mov`**, `hvc1`-tagged, and `holoAlphaSupport` grows a second
  decode lane. ⚠ **THE RULING IS NOT STALE — DO NOT DELETE THE FLOOR RULES**:
  they are what an engine with NEITHER codec gets, and what any era without a
  `.mov` gets on Safari. The canonical pair ships one (1,175,468 bytes,
  **smaller than its own WebM**, 0.828/255 mean alpha error over all 193
  frames), which puts FOUR of the five eras on real alpha there; ⚠ **`azeroth`
  ships none BY MEASUREMENT** — its plume and three companions plateau at
  ~2.6/255 at every quality while the file runs 4 → 12 MB.
  ⚠ **THE BRANCH IS PER-ERA, NOT PER-ENGINE**: the verdict says what the engine
  composites, the record says whether THIS era has a file in that format, and an
  era missing one must fall all the way back to the floor or the CSS switches
  the floor off over an opaque MP4.
  ⚠ **ENCODE FACTS**: `-pix_fmt bgra` (`yuva420p` is silently swapped for
  `ayuv`), `-alpha_quality` **defaults to 0** and is the dominant size term
  (0.2 → 580 KB · 0.5 → 1.1 MB · 0.9 → 5.8 MB) while `-q:v`/`-b:v` barely move
  it, `-tag:v hvc1`, and ⚠ **`ffprobe` CANNOT SEE THE ALPHA** — it reports the
  base layer's `yuv420p`; read it back with `alphaextract`.
  ⚠ **THE HEVC PROBE IS CHAINED BEHIND THE VP9 ONE, NEVER RACED** (Chromium
  pays no request and no decode), and it is a STATIC ASSET, not a data URI.
  ⚠ **A SERVER WITHOUT BYTE-RANGE SUPPORT LOOKS EXACTLY LIKE AN UNSUPPORTED
  CODEC** — WebKit reported `MEDIA_ERR_SRC_NOT_SUPPORTED` on a file it decodes
  perfectly from a data URI, because the harness answered 200 to a `Range`
  request. Verified in a real WebKit: `{ vp9: false, hevc: true }` there,
  `{ vp9: true, hevc: false }` in Chromium.
  ⚠ **AND THE FLOOR IS A COMPOSITING CONSTANT, NOT A THEMEABLE SURFACE
  (2026-08-31).** It read `--vwh-void-rgb` → `--void-rgb`, which ADR-058
  SWAPS TO PARCHMENT in light — and `plus-lighter` over a near-white floor
  returns white, so the fallback figure blew out to a flat silhouette on
  paper. `--vwh-floor-rgb` is a literal and never flips; the other consumers
  of `--vwh-void-rgb` (the film play disc) still flip, because they are
  surfaces. ⚠ The light block's own `.vwh__ground` well was already correct
  and was being COVERED by the wrap's floor one layer in front of it — a
  dark layer behind a light one is not a dark ground, and the rule looked
  right in the sheet the whole time. ⚠ **THE LANDING IS ON THE ALPHA BRANCH,
  SO THIS IS INVISIBLE THERE** (`data-holo-alpha` measured set on the live
  station, floor cleared): it is the SAFARI path that was broken, which is
  precisely the path U6 says may never be worse than it is. Verify a floor
  change on the fallback branch explicitly — the alpha branch will pass it
  either way.
  ⚠ **ROUTING IS A DECODE PROBE, NEVER `canPlayType`** — Safari plays
  VP9-in-WebM, ignores its alpha and answers "probably", so source order alone
  would make Safari WORSE than today. `lib/voidwalker/holoAlphaSupport.ts`
  decodes a transparent probe once and `HoloFigure` locks the verdict at mount;
  `null` means the floor. The `.webm`-only / `png|webp`-only path regexes are
  what stop an opaque file entering the branch whose premise is transparency.
- ⚠ **THE ERA SELECTOR IS A VERTICAL SCRUBBER ON THE LEFT HUD RAIL (ADR-082
  U9, owner 2026-08-27) — U8's horizontal axis is DELETED, not flagged off.**
  The rail IS the track: its own ticks extend OUTWARD into the margin, so its
  inboard side is free and the era stops hang off it rather than beside it.
  Five stops on one pitch, capped top and bottom so the group reads as one
  instrument; the active stop carries the lit year and the era's name.
  ⚠ **IT LIVES IN THE HUD GUTTER, WHICH IS WHY IT COSTS NO COLUMN** — the
  owner's own worry about "a lot of columns on lower screen sizes".
  `--vwh-scrub-w` is DERIVED from the same terms the reading band is built
  from, so it can never reach into it; a flat 116px overran SCOPE by 2px at
  1101x800, the narrowest capable rung and therefore the one that decides.
  ⚠ **THE HANDLE IS A CURSOR, NOT A DIAMOND** — the rail already carries one
  gold diamond (the ADR-031 journey manifest's detent), and a second identical
  glyph on the same rail is two "you are here" marks at two different scales.
  ⚠ **THE LEAD CLEARS THE RAIL'S OWN GAUGE NUMERALS**, which sit INBOARD at
  `--hud-rail-guide-inset + 10px` — the same side. At 18px the years printed
  straight through the depth gauge's "2" and "5".
  ⚠ **AND `.hud__rail` NO LONGER SWALLOWS CLICKS** (landing.css, sitewide):
  its box is 68px wide at z 50 with no hover, cursor or click rule of its own,
  so anything a station places in that gutter was unreachable — the stops
  could not be clicked at all. `pointer-events: none` on the box, `auto` on
  the manifest button.
- ⚠ **THE IDENTITY IS CENTRED OVER THE FIGURE, IN ITS OWN ROW, AT A FIXED
  MEASURE.** `max-width` is wrong: centred and content-sized, the mast's left
  edge moved 113px between "The founder" and "The Intelligence Architect",
  which the seat-stability sweep reads as the instrument reshaping. Its own
  height is what clears the nav for the columns below.
- ⚠ **THAT IS WHAT LETS SCOPE AND FACTS SHARE A DATUM.** While the mast lived
  in the left column, that column always started one mast lower than the
  right and no tuning could line them up. Both are row 2 now.
  ⚠ **BOTH DOSSIER ROWS ARE FIXED SEATS, SEATED FROM THE TOP**
  (`--vwh-lede-h` + `--vwh-seat-h`): a `1fr` lede pushes the lower slot to the
  column's floor, and a content-height lede moves it per era.
- ⚠ **SCROLL IS THE ERA SELECTOR (ADR-082 U10, owner 2026-08-27) — NO WHEEL
  CAPTURE.** The stage is already a pinned runway with one scroll writer, so
  the era is DERIVED from its progress: the reader steps through all five on
  the way past and the page continues normally at the end.
  `VOIDWALKER_ERA_BAND` is `[0.16, 0.72]` — inside the hold, clear of the
  entry (0.14) and the exit (0.74), so no era advances while the sheet is
  assembling or clearing.
  ⚠ **A CLICK PINS THE SCROLL to that era's slice centre** — without it the
  writer overrides the choice on the next frame; the two halves are ONE
  contract (ADR-056 U13's browse band).
  ⚠ **`current` IS AN INPUT to the derivation**, not a cache: the hysteresis
  needs the side the reader came from, or a stop on a boundary flickers.
  ⚠ **A SCRUBBED ARRIVAL IS NOT DELIBERATE** — it must not bump `epoch`, or
  every wheel notch restarts the figure's 900ms materialize. Only a click does.
- ⚠ **THE IDENTITY SAT ON `--station-title-top` UNTIL ADR-082 U20; THE DATUM
  COMPOSITION IS ON `--hud-rail-y-start` INSTEAD.** That token is the shared
  anchor the corridor's station headers and the services masthead derive from,
  and the rule was "one datum for every big title, never a third close number".
  The datum composition never honoured it (the kicker measured 33px at
  1440×900), which is what the owner read as the block "hugging the top part",
  and the line he pointed at was the HUD rails' own top — 104px at 1440×900,
  ~43px BELOW the station-title line. Both are shared anchors; this stage takes
  the FRAME's because it is a full-bleed instrument seated inside the frame
  rather than a station header. **The other stations are unmoved and still
  hang from `--station-title-top`** — this is a second datum with a stated
  scope, not a third close number.
- ⚠ **THE TWO COLUMNS MIRROR (ADR-082 U11): `justify-items: end` LEFT,
  `start` RIGHT.** With `stretch` plus a capped `38ch` measure both panels pin
  to their column's LEFT edge -- far from the figure on the left, flush on the
  right (measured 427px vs 32px at 2560). ⚠ **IT READS AS BALANCED AT 1600
  BECAUSE THE COLUMNS ARE EXACTLY AS WIDE AS THE PANEL THERE**, so the defect
  is absent at every rung in the matrix, not merely subtle. Mirrored, the
  inboard gap is `column-gap` on both sides and the extra width becomes
  MARGIN. ⚠ SUPERSEDED IN THE MECHANISM, KEPT FOR THE LAW: `.vwh__panel-slot`
  is deleted with the character-sheet composition (175c5970 / U19), and a
  `ch`-based measure is BANNED besides (see the U21 bullet above — `ch`
  resolves against the element's own font). What survives is the principle:
  a panel seat needs a DEFINITE width (`--vwd-measure`, `min(100%, 23rem)`)
  or it shrinks to its own content and seats vary per era.
- ⚠ **SCOPE LEFT, FACTS RIGHT, NO LOADOUT (owner, same pass).** The identity
  and FACTS share row 1; SCOPE hangs below the identity in the same column.
  ⚠ **ONE `--vwh-seat-h` SERVES BOTH COLUMNS** — ON RECORD and TRANSMISSION are
  bottom-anchored in their own side, so equal seats put them on one datum; the
  old 248-vs-280 pair is the arithmetic reason they never lined up, and it is
  what the owner was seeing as "the text placement is inconsistent".
  ⚠ **THE HANDOFF TARGET FOLLOWS THE SEAT, NOT THE CONTENT** — `dossier` rides
  whichever panel holds the top-left position, which is Scope now.
  ⚠ `era.loadout` stays in the record but letters nowhere on the sheet, so
  ADR-083's phone SCOPE mode ("motto, record and loadout") is amended with it.
- ⚠ **THE IDENTITY TITLE CARRIES `.voidwalker__name`'s CLAMP BYTE-FOR-BYTE**
  (`clamp(26px, 3vw, 44px)` / 1.1) because the About name FLIES INTO IT and now
  translates without scaling. No rung may step it down — the short-viewport
  override was deleted for exactly that reason. The three-line reservation
  (`min-height: 3.3em`) sits BESIDE `.vwh__decode-line`, which declares
  `min-height: 1em` at equal specificity and later in the file.
- ⚠ **THE ARRIVAL DECODE IS SCROLL-OWNED; ONLY AN ERA CLICK IS TIMED.**
  `scrambleFrame` is pure in `t`, so a scroll-derived `t` is reversible for
  free; `advanceScrambles` may NOT be used there (it drops finished jobs — the
  latch). Window `[0.02, 0.18]`, past the `[0, .08]` takeover so the title
  resolves in place.
- The station id, `data-station`, rail manifest row, section readout, nav entry
  and `characterEras.ts` registry remain load-bearing.

## Proposed About→Voidwalker handoff (2026-08-27)

**Status: Proposed — unpushed, pending visual approval.** Only the capable path
(`min-width: 1101px`, motion allowed, flags active, live corridor) overlaps the
station by `-120svh`, producing a shared `20svh` pin seam. Both station
wrappers remain structural and never animate; contained actors own the
glitch/reveal. At 961–1100 and on mobile/PRM/corridor-fallback/flag-off paths,
the boundary stays normal-flow.

Retiming is entry `[0, .14]`, renderer/title takeover `[0, .08]`, with exit
preserved at `[.74, .96]`. `ServicesCardRing` remains the sole
portrait-transform owner inside the existing canvas. The Three-free receiver
bridge must validate the portrait, FACTS dossier and era-title targets as one
atomic gate; it publishes geometry only, applies no duplicate portal
transform, and must not introduce a second canvas or a Three/Fiber/Drei import
into the DOM graph. Reuse About's existing exit envelope; do not revive
`--about-portal`.

## Proposed editorial character sheet (2026-08-27)

The capable desktop `.vwh` is a stable three-column character sheet beneath one
centred horizontal five-era tab strip. Identity/FACTS/ON RECORD occupy the left,
hologram plus projector only the centre, and SCOPE/TRANSMISSION/LOADOUT the
right. The side dossiers start on one lower reading datum; the figure continues
to span the full grid and must not move when the tab band changes. Dormant tabs
use neutral hairlines and gold is active wayfinding only. Tabs use roving focus
and automatic Arrow/Home/End selection; the tablist never remounts. Desktop
seats remain reserved across all five eras. At `701–1100px`, restore the 3-by-2
selector and complete normal-flow dossier. At `<=700px` (ADR-083, proposed),
the order is identity, figure, one-row five-era rail, RECORD / SCOPE /
TRANSMISSION, and one active dossier seat. Transmission is disabled without an
authored film. Keep all dossier nodes mounted; phone visibility is CSS-only so
desktop handoff measurements remain stable.

The About shell owns layout/inertness only. Its name and dossier are sibling
transform actors; never transform the shell and either child together. The
name lands at `[data-vwh-handoff-target="era-title"]` and acquires through the
same morph as the hologram. The normalized media contract is 720x1280 with
authored head/foot anchors; `object-fit: contain` stays bottom-centred and no
runtime calibration transform is allowed. ⚠ **AMENDED BY ADR-082 U25: THE BAN
IS ON TRANSFORMS, AND IT STANDS.** `--holo-fit` calibrates the media's BOX on
both axes from the registry's own measured anchors, shrink-only and clamped at
1 — a transform would scale the scanline mask's px pitch and give each era its
own raster, which is the thing the ban is protecting. The slot bottom is the projector
disc top (`--vwh-base-h` / `--vwh-base-disc-inset`). Keep the local media floor
contained and the station itself transparent/starless.

`VOIDWALKER_CHARACTER_STAGE` and its Meshy portal remain deleted. The ADR-074
timeline and ADR-081 travel machinery below are UNMOUNTED but retained; read
those sections as historical/fallback machinery, not as the production
surface.

**Read first**

- [ADR-081: The through-line travels the Z axis](../sentinel/decisions/081-voidwalker-time-tunnel.md) — the live composition; see §The time tunnel below
- [ADR-074: The through-line](../sentinel/decisions/074-voidwalker-through-line.md) — the record, the drawings, and the vertical mode
- [ADR-047](../sentinel/decisions/047-about-deck-flip-stage.md) (the station before it, whose exit relies on this one's top) · [ADR-056](../sentinel/decisions/056-services-proof-casefile.md) (the cover role's previous holder) · [ADR-068](../sentinel/decisions/068-casefile-glyphed-index-and-tool-dossier.md) (the wireframe grammar this forks) · [ADR-059](../sentinel/decisions/059-rail-instruments.md) (the journey mark, and the telemetry the right guard clears)

## The time tunnel (ADR-081, live)

- **No second WebGL context.** The corridor canvas already survives
  `#about` as the ambient hold; the travel EXTENDS it. The beats are real
  DOM on CSS 3D over it — the film is a live button into a CSP-pinned
  player, the press bars are real links, and the record's guards walk
  rendered text.
- ⚠ **THE PERSPECTIVE IS DERIVED FROM THE SCENE CAMERA'S FOV**
  (`travelPerspectivePx` = `(H/2)/tan(θ/2)`). It is the one number that
  makes the DOM field and the WebGL tunnel one space. `sceneGeom` pulls
  THREE so the clock MIRRORS `CAMERA_FOV` — the unit test pins them equal,
  and without that guard the two layers silently stop sharing a projection.
- ⚠ **`VW_TRAVEL_SPAN` MUST EXCEED 2, AND "> 1" IS THE TRAP.** A neighbour
  is 1.0 stop away and the flight only starts outside the park, so the
  reach is `SPAN/2 − PARK/2`. Under 2 the next beat is pinned invisible the
  moment the current one parks and the field is a slideshow.
- ⚠ **DEPTH ON A FLAT LAYER IS CARRIED BY FOCUS, NOT OPACITY.** A receding
  beat at 24 % and half scale stays legible under a pixel of blur and reads
  as overlapping text. The blur saturates by |t| 0.55.
- ⚠ **`data-vw-ready` GATES THE WHOLE MOTION BLOCK**, including the
  masthead's decode ghost. The travel hook writes it too, or every `--vw-b`
  is inert and the ghost paints over the field.
- ⚠ **A camera-relative wrap must wrap the point's OWN phase.** Offsetting
  it by `uCamZ` first resolves back to `uCamZ + p.z` — the tunnel comes out
  geometrically perfect and completely FROZEN.
- ⚠ **The year rings' spacing is DERIVED** from the camera's cruise
  distance over the record's span, or the rings slide against the walls.
- **The runway is MODE-GATED CSS** (the ADR-047 `#about[data-about-mode]`
  precedent, not the `#services` pre-hydration one) paired with
  `VW_TRAVEL_RUNWAY_SVH`; the unit test reads the sheet. No failing path
  may inherit fourteen viewports of dead scroll.
- **Two writers, one boolean and its negation.** `useVoidwalkerTravelScroll`
  and `useVoidwalkerScroll` take `enabled` from ONE capability decision, so
  `--vw-b` can never have two writers.
- ⚠ **`colorScheme` DOES NOT FLIP THIS SITE** — the theme is a pre-paint
  attribute from `?theme=`. A context-level colour scheme captures dark
  twice and reports a light pass that never happened.

## One clock, and the rail is the axis (ADR-081 U2, live)

- ⚠ **ONE DAMPED VALUE, AND THE HOOK OWNS IT.** `travelChase`
  (`VW_TRAVEL_TAU_S` 0.18s) is written by `useVoidwalkerTravelScroll`
  into `vwTravelRef.flight`, and the DOM beats, the camera and the tunnel
  all read THAT. The motion follower's `voidTravel` channel is DELETED,
  deliberately: before this, the camera flew a damped value while the
  beats were written from raw scroll in a different rAF — one projection,
  two clocks, so the cards snapped with the wheel while the walls glided.
  A dead damped channel that still looks authoritative is how the second
  clock comes back.
- ⚠ **SPATIAL CHANNELS DAMP; LETTERED CHANNELS DO NOT.** Depth, the path,
  the camera, the ring cadence take `flight`. The active stop, the
  rolling year and the rail's car take RAW `p` — a readout that lags
  reads as broken.
- ⚠ **THE CHASE OUTLIVES THE SCROLL EVENT.** Scroll events stop when the
  finger does and the field is still gliding; the tick re-requests itself
  until the chase settles, or the beats freeze part-way while the tunnel
  (pumped by the corridor's own loop) keeps moving.
- ⚠ **THE FLIGHT PATH IS AUTHORED IN SCREEN FRACTIONS**
  (`beatScreenXFrac` / `beatScreenYFrac` / `beatRotDeg`) and un-projected
  per frame through each beat's own depth (`beatDepthUnproject`). A flat
  CSS offset does NOT survive projection: `±7%` of a 680px box is 48px,
  which at `VW_Z_FAR` arrives on screen as FIFTEEN — every beat flew at
  the reader dead centre and the alternation only appeared once it had
  parked. Author where it is read.
- ⚠ **THE BEAT LEAVING IS NOT THE BEAT ARRIVING.** `FOG_OUT` (0.32) and
  `BLUR_REACH_OUT` (0.30) are roughly a third of their IN counterparts,
  and flattening either back to symmetry puts two beats of identical
  weight over each other at the midpoint between stops. The reader is
  looking at what is COMING.
- **Slim in flight, full on park.** `--vw-d` (`beatDetail`) PEAKS at the
  park and drives the panels' `--ci`; `--vw-b` still lights the beat's
  own chrome and holds. ⚠ Re-source the ladder, never re-author it — one
  `--ci` declaration carries the whole stagger. `.vw-wire` takes
  `content-visibility: hidden` in flight; ⚠ NOT `.vw-plate__frame`,
  whose height IS its content and would pop the card as it lights.
- ⚠ **`filter` IS IN `will-change` AND THE BLUR IS QUANTISED** to half a
  pixel. An unhinted radius that changes every frame re-rasterises the
  whole card, three at a time, exactly during the fastest motion. And
  `data-vw-far` is `content-visibility` + `visibility`, never
  `display: none`, which re-ran layout at every stop transition.
- ⚠ **THE LEFT RAIL IS THE TIME AXIS** (owner) — `.vw-axis` is deleted.
  ⚠ **THIS IS ADR-081's `RailDates`, NOT ADR-082 U9's SCRUBBER — two
  different objects on one rail.** `RailDates` is a READOUT: `aria-hidden`,
  non-interactive, mounted only on the TRAVEL path, portaled INTO
  `.hud__rail--l`, and it spreads twelve whole years across the ladder so
  each seats on an integer rung. The hologram's scrubber is a CONTROL: a
  five-stop tablist with roving focus, in the stage's own DOM, compact and
  centred on the rail rather than spread along it. They never mount
  together (travel and hologram are mutually exclusive modes), and a
  future pass that wants the scrubber's years on real rungs should read
  `RailDates` first — that is the precedent, and it costs a portal.
  The rail's thirteen ticks are twelve intervals and the record spans
  twelve years, so every record year seats on an INTEGER RUNG; nothing is
  added to the ladder (ADR-031's guardrail) and the twelve-year span is
  pinned. The `RailDates` host is `position: absolute` inside
  `.hud__rail--l` (the rail is a FLEX COLUMN — a static child leaves the
  ticks' percentage box), and ⚠ **the handoff is POSITIONAL**, scoped by
  `:has` to a rail holding a running car: keyed on `data-vw-mode` it
  would letter years for the whole document, which is U1's defect again.
  ⚠ The lit rung IS the readout — no second year travels with the car.
- ⚠ **`wholeYears` FLOORS AT THE SOURCE.** Fractional `sortYear`s exist
  only to order beats inside a year they share; rounded, the axis
  lettered 2019 and 2017 — years no chip prints — and seated the marker
  between its own rungs.
- ⚠ **THE CAMERA HANDOFF IS AN IDENTITY IN BOTH HALVES.** The comment and
  the ADR claimed it for four days with no test while the GAZE snapped
  ~16°. Do not weaken the guard to the position alone; that is the half
  that was already true.
- ⚠ **THE MASTHEAD'S EXIT IS A POSITION, NOT A DURATION.** A time-based
  scramble and a scroll-based runway always desync, and when they do the
  masthead letters across the first PARKED beat. It disarms at the dive's
  own end, un-types unstaggered, and is force-settled past
  `ENTRY_FRAC × 1.26`.
- ⚠ **THE DECODE GHOST MUST PAINT NOTHING IN BOTH THEMES.** It is the
  layer that survives the un-type. `html[data-theme="light"]
.vw-head__lede em` (0,2,2) outranks `.vw-decode__ghost em` (0,2,1),
  so light painted the masthead's leitmotif line across the field with
  the live layer reading empty and every geometry gate green. theme.css
  re-asserts transparency at matched specificity, later in the cascade.
- **The tunnel warms its shaders** on `vwTravel.near`, two viewports out:
  three never compiles a material for an object it has not drawn, so the
  dive's first frame was also compiling two point shaders. Nothing else
  is deferred — ~1,500 points cost nothing while invisible.

## The flight-grammar lab and the structural shed (ADR-081 U4)

- ⚠ **THE TUNABLE CLOCK IS OVERRIDABLE AT RUNTIME**, through
  [`lib/voidwalker/voidwalkerFlightConfig.ts`](../../lib/voidwalker/voidwalkerFlightConfig.ts).
  Every knob (`span`, `tauSeconds`, `runwaySvh`, path anchors,
  `pathVariant`, `wallDensityMul`, `entryReactionStrength`,
  `velocityStrength`, etc.) has a default that MIRRORS the shipped
  constant byte-for-byte, and functions in the clock resolve them at
  call time. Production never mutates the config, so the resolved
  values equal the constants byte-identically — the unit tests pin
  the equality directly.
- ⚠ **THE LAB ROUTE IS `/test/voidwalker-flight-lab`**, an
  `(internal)` route blocked in production by `proxy.ts`. It renders
  `LandingPage` verbatim with a `FlightLabPanel` overlay that writes
  the config + syncs URL query params. Presets in
  `FlightLabPanel.tsx` (`V1-default`, `V2-noomo-swing`, `V3-housed`,
  `populated-field`, `slow-cinema`, `entry-burst`) mirror
  `PRESET_URLS` in `scripts/capture-voidwalker-travel.mjs`. Add a
  preset to both or `--all-variants` will not see it.
- ⚠ **NEW PATH VARIANTS ARE NEW CURVES, NOT NEW OFFSETS.** `curved`
  bows through `smoothBell(t) = sin(π·|t|)` (0 at 0 and ±1, peaks at
  ±0.5) so the parked composition is unchanged from `linear`; the
  bow is additive on the lerp. `housed` shares `curved`'s path and
  gates the drawn housing frame's opacity on `beatDetail`. The
  variants sit on ONE clock — the config resolves per-call, so
  reverse-scroll off a housed variant is byte-identical to `linear`
  on the SAME frame.
- ⚠ **THE STRUCTURAL SHED HIDES FOUR CORRIDOR PAINTERS DURING
  INTERIOR TRAVEL**: `InterGateCorridor`, `GatewayThroat`,
  `LatentFieldTunnel`, `LatentWormholeWalls`. All read
  `vwTravelInterior()` in `useFrame` and early-return with
  `visible = false` when it is true. The gate is a PURE FUNCTION of
  `vwTravelRef.current` (`engaged && flight > 0.15 && flight < 0.9`)
  — no latch, no cooldown. ⚠ **ADD A PAINTER TO THE SHED IS ADD IT
  TO THE SMOKE.** The `ADR-081 U4: the structural shed restores
every painter on reverse scroll` smoke walks Arc → mid-travel →
  Arc-after-reverse and pins the frame weight; a new painter that is
  hidden but never restored fails there rather than in the wild.
- ⚠ **THE STARFIELD STAYS ON DURING TRAVEL.** The tunnel walls are
  additive point clouds — stars are visible THROUGH the gaps.
  Hiding the starfield would leave a black void around the tunnel.
  Same for the brandmark accretion shell + physics core: reverse
  scroll passes back through them at close range, and the recovery
  has to be already-painted.
- ⚠ **THE MASTHEAD LEAD-IN BAND (`VW_TRAVEL_LEAD_IN = 0.06`) SHIFTS
  `stopHome` AND `activeStop`'s BASE**. Missing the update on
  `activeStop` would seat the rail marker one year early on the
  lead-in band. Unit-pinned: the first beat's opacity at the
  masthead's disarm point (`ENTRY_FRAC`) is < 1 % opacity, and at
  the force-clear point (`ENTRY_FRAC × 1.26`) < 35 %.
- ⚠ **SETTER DEDUP IS LOAD-BEARING.** `setVwFlightOverrides` and
  `resetVwFlightConfig` NO-OP when nothing changes. Without dedup
  the panel's first-effect config write fires a `vw-flight-config`
  event, the tunnel's `configEpoch` bumps, and the point-cloud
  buffer rebuilds INSIDE the corridor's own `createRoot` commit —
  which React reports as "sync unmount while rendering". Pin the
  dedup with the same test that already covers it.

## The fly-through and the rails (ADR-081 U5)

- ⚠ **THE PARKED BRANDMARK IS A BILLBOARD WELDED TO THE LENS AT
  `recT = 1`** — `BrandmarkPhysicsCoreActor` replaces its world
  position with a point `CENTER_DISTANCE` in front of the LIVE camera
  and slerps onto the camera's orientation. The services ambient hold
  is the state the whole voidwalker runway runs in, so before U5 the
  dive moved the camera and the mark rode along at constant apparent
  size (measured: ~200px in a 1440px frame at `entry` 0, 0.19, 0.86
  and 0.999). **Anything that wants to REACH that mark must unwind the
  weld**, and four things unwind together or none do: the position
  lerp, the billboard slerp, the camera-forward `EXIT_RECEDE_DIST`
  push, and the pointer-look.
- ⚠ **`markFlyThroughRelease(entry, engaged)` IS AN IDENTITY AT
  `entry = 0` AT EVERY KNOB VALUE.** That is the contract that keeps
  the ambient hold, the dock, the corridor and every reading beat
  byte-identical — the same construction
  `getVoidwalkerTravelCameraPose` uses at its own engage edge, and the
  reason `markFlyThrough` SCALES the channel rather than replacing it.
- ⚠ **THE MARK'S SHED IS GATED ON THE RELEASE, NOT ON THE TRAVEL.** At
  `markFlyThrough = 0` the mark is still welded in front of the
  camera, where hiding it is a visible hole rather than a saving.
- ⚠ **VOLUME AND DIRECTION ARE TWO LAYERS.** The wall rings twist by
  `r * 0.19` SPECIFICALLY so consecutive rings do not line up into a
  cage — correct for dots, and exactly why the dot shell can never
  carry direction. Longitudinal cues go in the rails
  (`lib/voidwalker/voidwalkerRailLayout.ts`, three-free per the
  `landing-performance` doctrine); do not answer a direction complaint
  by removing the twist.
- ⚠ **BOTH ENDS OF A RAIL DASH WRAP ON A SHARED ANCHOR.** Wrapping
  each vertex on its own z drops the modulo boundary between a dash's
  two ends once per rail per cycle, and that dash then spans the whole
  tunnel. A dash carries `aAnchorZ` (wraps) and `aOffsetZ` (applied
  after); `railDashesFitSlots` is the guard, because a contact sheet
  will miss a one-frame-per-cycle streak and a reader will not.
- ⚠ **THE RAILS FOG OUT BY ~0.6 OF THE SPAN AND CLIP MUCH SHALLOWER
  THAN THE DOTS.** Carried to the shell's far plane they converge on
  one pixel dead centre — a sunburst, drawn through the beat copy that
  parks there. And a wall point passing the lens must die early or it
  explodes across the frame, where a 1px rail streaking past the frame
  EDGE is the strongest speed cue the tunnel has: copying the dots'
  `0.5 → 3.4` near ramp threw the peripheral read away.
- `railDensity` and `markFlyThrough` are the ONLY `VwFlightConfig`
  entries whose default is not an identity against a shipped constant.
  Their **zero** is the restore path, and the lab's `u5-before` preset
  sets both.

## Capture / contact sheet

- ⚠ **A CORRIDOR SMOKE MAY NOT NAVIGATE BY PIXELS — OR BY FRAMES.**
  The stage is sized in viewport units (measured 6921–9676 across the
  four projects), so a hardcoded `y` lands at a different FRACTION of
  the corridor on every one; and the `navigate` band itself sits at
  0.40–0.50 on the phones against 0.30–0.40 on tablet and desktop, so
  no single fraction is safe either. Use `walkToArc` in
  `landing-corridor-smoke.spec.ts`, which searches and returns where
  it parked. ⚠ **AND SETTLING COSTS REAL MILLISECONDS, NOT FRAMES** —
  `data-corridor-phase` is written from the frameloop off the SMOOTHED
  scroll value, and a walk that settles on `requestAnimationFrame`
  alone measured NO `navigate` band at all on any project. The search
  must be a Playwright-side loop with a timeout per probe;
  `scripts/probe-corridor-phase.mjs` prints both readings.
- `scripts/probe-vw-rails.mjs` counts GL draw calls **by primitive
  mode** — the rail layer's first capture looked empty and the LINES
  tally is what proved it was drawing and merely too faint, rather
  than not wired.
- Capture one preset: `node scripts/capture-voidwalker-travel.mjs
--variant V2-noomo-swing --headless --vp 1440x800`.
- Capture all presets: `node scripts/capture-voidwalker-travel.mjs
--all-variants --headless` (spawns one subprocess per preset,
  writes to `docs/design/voidwalker-flight-lab/<preset>/…`).
- The preset table lives in TWO places (panel + CLI); the README at
  `docs/design/voidwalker-flight-lab/README.md` explains the layout,
  the invariants, and what each preset is doing.
- ⚠ **A CAPTURE MADE ONLY OF PARKS CANNOT SHOW THE FLIGHT.** Every mark
  used to land on a home, where a beat is centred and flat by
  construction; the mid-flight marks, the `before` mark (the only one
  that can prove a positional gate), the damping probe and the
  equal-weight overlap gate are what found four of the defects above.

## Contracts

- **The cover lockstep.** `useCorridorExitScroll`'s `nextStation` query and
  `home-v2.css`'s `html[data-corridor-exit="true"] #…` rule name the SAME
  station; the ambient bottom gate and the fade envelope read the SAME rect
  (ADR-030 §6, recorded FIVE times now). ⚠ **ADR-081 MOVED IT**: with the
  tunnel on, `#voidwalker` is itself a pinned TRANSPARENT stage the ambient
  must survive, so the cover is `#practice`. The `#voidwalker` rule stays
  for every non-travel path — the travel-mode transparency and its
  fail-opaque `--vw-bg-in` shield are gated on the mode attribute, so the
  two can never both apply. In the vertical mode the station is plain flow,
  opaque, with NO negative `margin-top` — `#about`'s slide-out exit lands
  on its top edge either way.
- **Three parse-option copies move together**: `app/(marketing)/page.tsx`
  (`CORRIDOR_RELOCATED_STATIONS`, `[voidwalker, about, services]`),
  `tests/lib/rail-manifest.test.ts` and `tests/lib/v7-parse.test.ts`. The
  drift guard is the alarm. `data-station` = `id` = manifest `targetId`.
- **The record is zero-import** (`lib/voidwalker/voidwalkerData.ts`) and its
  facts are at LOCK — `tests/lib/voidwalker-data.test.ts` pins the sourced
  phrasings and bans rounding, currency and model families. A copy change
  is a record edit plus that test. `#practice` is an EMPTY station in
  production; the foot may not point there.
- **A drawing declares what it letters** (`voidwalkerWireLabels.ts`) and
  `voidwalker-wire-markup` walks the rendered text against it: ≤8 labels,
  no digit, no currency, no `<img>`, exactly one `[data-gold]`, ≤50
  elements. Adding a label means adding it to the table in the same commit.
- **The `--w-*` token block on `.vw-wire__in` is the casefile's VERBATIM**,
  and theme.css re-derives both hosts from ONE light rule
  (`voidwalker-wire-tokens`). A new token lands in `casefile.css`,
  `voidwalker-wire.css` and `theme.css` in one commit — or in none.
- **One writer.** `useVoidwalkerScroll` owns `data-vw-ready`, `data-vw-beat`,
  `--vw-p`, per-beat `--vw-b` and the masthead's decode runs. No `<html>`
  writes, no store writes, no per-frame layout reads (the offset chain is
  cached; a `ResizeObserver` on the section AND on `document.body` refreshes
  it). Per-beat channels are hosted on the beat, never the root.
- **The rest state is the finished page.** The motion block is gated on
  `.vw[data-vw-ready]`; absent = every panel lit, the spine drawn, the
  diamonds filled. The hook's only gate is `prefers-reduced-motion:
no-preference` — ⚠ if a width gate is ever added, the CSS rest block in
  `voidwalker.css` takes the SAME pair.
- **The masthead never moves or fades** — it types in and un-types out, in
  place (the caption kernel; each lede run its own target so the gold `em`
  survives). Panels power on through the `--ci-off` ladder; the title's
  words brighten on `--vw-w`; all reversible.
- **The beats ALTERNATE around a centred spine at ≥1280** (ADR-074 U1):
  left beats right-aligned with the plate seated at the lane, right beats
  mirrored. Below 1280 the rules are reset and every beat reads off a
  left-hand spine — keep that reset when touching either block.
  ⚠ **THE SIDE AND THE ORDINAL ARE DATA, NOT `:nth-child`** (U2). The film
  interlude is a row in the same list, so a parity selector flips every beat
  beneath it. Both are computed in the renderer over a count that SKIPS
  interludes; CSS selects `[data-side]`.
- **The marker is a framed CHIP on the rail** (U2) — node, ordinal and year
  on one line, on an opaque ground that BREAKS the spine. ⚠ The rail used to
  be drawn straight through the labels on all nine beats: the diamond
  knocked it out, the type under it did not. Anything added to the chip
  keeps that ground. ⚠ It may be wider than the lane — the gutters are
  empty — but it must clear the content columns by ≥16px at 1280 (measured
  19 / 21 / 29), which is why `--vw-lane` is a CLAMP: at a flat 64px the
  clearance got WORSE as the viewport grew. The widest chip is the range
  (`//09 2014–17`) and it is what the gap, padding and tracking are tuned
  against. Square corners — chrome sits at 0 on ADR-065's depth ladder.
- **The run is REVERSE-chronological** (U2), opening on the Intelligence
  Architect seat dated by the SEAT (2026), not the 2024 joining date, or a
  rail read downward prints 2024 above Thoughtform's 2025.
- **The film interlude is NOT a beat.** No chip, no ordinal, no side — and it
  is skipped by `useVoidwalkerScroll`'s marker walk and by the capture
  script: a `.vw-beat` query without `:not(.vw-beat--interlude)` hands the
  clock a phantom stop. It carries an opaque ground so the spine stops at it.
  ⚠ **The player is the ONE third-party frame on this site.**
  `lib/security/headers.mjs` names `youtube-nocookie.com` in `frame-src`
  (absent before U2, so it fell back to `default-src 'self'`), and
  `security-headers.test.ts` pins `frame-src`, `media-src` and the ABSENCE of
  the cookie-setting host. The iframe is built only inside `MediaLightbox`
  after a click — its `embed` branch is ADDITIVE and the `src` path stays
  byte-identical for the films and walkthroughs that share it. A new origin
  is a decision: measure it with `enforceCsp: true` before adding it.
- ⚠ **Grid rows are EXPLICIT** on the spine (2/4), the beats list (2) and
  the foot (3): auto-placement slid the list under the spine's span and the
  spine measured 0px. ⚠ **The right guard** (`--vw-guard`, 32px below
  1600px) keeps a full paragraph off the right-rail telemetry; the band's
  edge sits 10–22px inside the readouts at the laptop widths.
- ⚠ **On the phone band the FRAME carries the plate's aspect, not the
  plate** — a wrapped headline in the bar otherwise eats the drawing.

## Verifying

`npx vitest run tests/lib/voidwalker-*.test.ts` for the record, the clock,
the drawings and the tokens; `node scripts/capture-voidwalker.mjs --vp
1440x800 [--theme light]` (headed) for the seam, the masthead, every beat at
its reading line, the reversal and the six plates measured; the ring smoke's
"ambient hold survives" case for the cover.
