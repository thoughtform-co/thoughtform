# ADR-082: The through-line becomes a character-selection stage

**Status:** Accepted (2026-08-26)
**Supersedes:** ADR-081 **on composition only** — its record, its content
laws, its cover-role reasoning and its perspective/flight machinery all
still bind. The wormhole and the vertical timeline (ADR-074) both remain
on disk as documented fallbacks; the CHARACTER STAGE is now the surface.
**Flag:** `VOIDWALKER_CHARACTER_STAGE` (`unifiedServicesInstrument.ts`)

## The complaint

ADR-081 replaced ADR-074's vertical timeline with a Z-axis flight past
nine typographic beats. The owner's own read on the finished pass: it
_"is not really what I want. It's not really coming together"_ — a
scroll of paragraphs, whether horizontal or vertical, does not fit the
site's grammar (WebGL corridor, orbiting service cards, PDA console,
casefile drawings). And the beats read as milestones on a CV rather
than as a leitmotif made visible.

The site's other beats are all INTERACTIVE INSTRUMENTS — the ring you
turn, the map you switch, the pinboard you drag. This one was a
diorama. The owner's brief closes it: after the About section, land in
a video-game **character-creation screen** with different eras of Vince
as swappable outfits, entered through a portal from the About portrait.

## The decision

**Past `#about` the reader lands in the voidwalker CHARACTER STAGE: a
rotating 3D model of the current era, era-select rail below, in-canvas
HUD carrying era metadata drawn from the ADR-074 record.**

Three things make it a record rather than a mannequin:

1. **The models are records of themselves.** Each era is a real 3D
   model of the owner (Meshy `multi-image-to-3d`), generated from a
   character sheet made through the `voidwalker-avatar` skill's
   identity + wardrobe locks. Not a metaphor and not a puppet — the
   same person in the wardrobe of the moment.
2. **The record still writes the HUD.** `VOIDWALKER_BEATS` (ADR-074)
   is the era registry's source of truth for years, titles and
   copy. `voidwalkerData.ts` is unchanged; `characterEras.ts` picks the
   six eras the roster ships with and pins each to a beat by id, so a
   copy edit in one file walks the stage.
3. **The transition is a camera move, not a page swap.** The About
   deck-flip's portrait is a WebGL card in the corridor canvas
   already; retargeting its exit so the card FLIES TO CENTER and the
   corridor camera advances through it (ADR-081's fly-through kernel
   already exists, `markFlyThroughRelease`) is the "you're inside now"
   gesture, no route change, no crossfade.

## Architecture: no new canvas, no new station

**One WebGL context.** The corridor's R3F canvas already survives
`#about` (the services ambient hold under ADR-047, extended by ADR-081)
and it hosts the character mesh in the same tree that hosts the parked
brandmark, the arc-cases card and the services ring. There is no second
`<Canvas>`. This is the same argument ADR-081 made against a second
tunnel canvas ("sticker over a video"): a portal that flies THROUGH a
DOM plate into a new WebGL scene reads as one only when both live in the
same projection.

**No new station.** The stage replaces the _interior_ of `#voidwalker`
(the station itself stays as the cover for `useCorridorExitScroll`,
identical rect, identical opaque paint). The rail manifest, the section
readout, the nav drawer, the detent ladder and the ADR-030 §6 seam all
key on the station id, so nothing renumbers.

**Content model reused.** `VOIDWALKER_BEATS` is the era canon:

| Era id        | Beat        | Year (record) | Wardrobe title (skill)             |
| ------------- | ----------- | ------------- | ---------------------------------- |
| `creatives`   | Creatives   | 2014          | The Antwerp community manager      |
| `the-crowd`   | Pokémon GO  | 2016 (span)   | The street organiser (2016–18)     |
| `azeroth`     | Classroom   | 2020          | The Azeroth teacher                |
| `genai`       | Latent Land | 2023          | The AI Captain                     |
| `thoughtform` | Thoughtform | 2025          | The founder                        |
| `loop`        | Loop        | 2026          | The Intelligence Architect (canon) |

`the-crowd` is a compound label over the 2016–18 span (Pokémon GO,
Ophef, Save The Expanse, Six coins). The remaining three beats
(`ophef`, `expanse`, `coins`) are readable inside the era's copy panel;
they do not each get their own model — six is the roster size the owner
chose (curated, not all-nine), and packing more models onto one page
walks straight into the ADR-081 budget conversation for no gain.

## Fallback

Flag-off · mobile · tablet · reduced-motion · no-WebGL · a Meshy asset
that failed to load · a JS failure — all land on the ADR-074 vertical
timeline (or the ADR-081 travel, if `VOIDWALKER_TIME_TUNNEL` is also on;
the two flags are stacked, and `VOIDWALKER_CHARACTER_STAGE` off restores
the previous surface byte-identically). The stage never leaves any dead
runway behind when it disengages — the tall wrapper, the sticky stage
and the era rail all render only when the flag is ON and capability
passes. A per-era **static portrait** (the same sheet's front image the
Meshy job used) is the mobile / PRM surface, a swipeable rail of six
frames on the deck-flip's fallback pattern.

## Guards

- `VOIDWALKER_BEATS` stays at ten entries (nine + interlude); the era
  registry references beat ids and pins the six-era count in a unit
  guard.
- `characterEras.test.ts` (new): every era references an existing beat
  by id; every era has a wardrobe title ≤32; the roster is the six
  above; every era carries a `modelPath` under `public/models/voidwalker/`.
- Model bundle budget: **≤4 MB per era GLB**, asserted at build time
  by a new `scripts/probe-voidwalker-models.mjs` on any GLB found under
  `public/models/voidwalker/`. Draco/gltf-transform are opt-in future
  additions gated by the supply-chain rule.
- The About exit remains the deck-flip (ADR-047 unchanged); the
  portrait-to-center retarget is a NEW `ABOUT_EXIT_PORTAL` window ON
  the exit clock (0.74–0.96), staged in the lab first.

## Rollback

The one flag rolls it back byte-identically. The Meshy assets and the
skill live outside the marketing bundle: no import chain reaches them
from `LandingPage`; they only surface when the stage mounts. The record
(voidwalkerData.ts) is unchanged, so its guards do not move.

---

## Update 1 — the stage is removed, the hologram replaces it (2026-08-26, owner)

**Everything above describes a surface that no longer exists.** Read it for
the era registry (which survives) and for the record of why the 3D route was
tried; nothing else in it is live.

### What the owner ruled

Two rulings on the same day, after reading the assets the pipeline actually
produced:

1. **The 3D route is pinned** — "I don't really like this, not your fault. I
   think it's just the limitations of Meshy where we just use images." Meshy
   builds an excellent SILHOUETTE from a four-view sheet and cannot carry a
   likeness: measured, the hand tattoos come back **absent** (not faint) and
   the face arrives soft with a multi-view blend seam. That is arithmetic, not
   tuning — the hands are ~3 % of frame, so their linework is gone at any
   texture resolution. Rigging and idle animation both work (24-joint
   skeleton, 591-action library, 5 + 3 credits) but skinning also **softens
   the tailored silhouette** that was the mesh's one strength.
2. **The About→stage portal is rejected outright** — "the transition we have
   now from our About section to the Voidwalker timeline section sucks."

### What replaces it

A HOLOGRAM: a translucent Tensor-gold scanline figure of the owner emerging
from the brandmark, which flattens and descends to become the projector base,
with era panels around it. Assets come from the generative image/video route
this project had already proven identity-stable. Look-dev runs at
`/test/voidwalker-holo-lab` before anything mounts on the marketing page.

**The architecture is "bake the LIGHT, code the SCREEN".** The asset carries
identity, wardrobe and gold emissive lighting on pure black; the SITE carries
every raster artifact — scanlines, flicker, translucency, chroma, the
materialize — in CSS. Three reasons, and the second is the load-bearing one:
VP9's 4:2:0 subsampling turns baked 1–2px scanlines into moiré; **an
all-black wardrobe vanishes under a screen blend unless the figure is already
lit**, because black contributes nothing additively; and one CSS block
retunes six eras and both media types where twelve bakes would not.

⚠ **The first wave proved the middle claim and corrected the prompt.** Asking
for a "gold monochrome emissive" figure returned a BROWN GRADE — a man in a
brown suit. Asking for "a volumetric hologram" is what gave the model
permission to actually EMIT. The shipping block borrows that phrasing and
then subtracts the raster explicitly.

### What was deleted

The character stage's whole presentation: `voidwalker/character/**` (four
files), `useCharacterStageScroll`, `characterStageRef`, its markup test, its
CSS sheet + the `.ch` light-theme block in `theme.css`, and
`/test/voidwalker-avatar-lab`. The portal with it: `characterStagePortalRef`,
`useCharacterStagePortalReceiver`, `ABOUT_EXIT_PORTAL_WINDOW`,
`aboutExitPortalT` and `character-portal.test.ts`.

⚠ **`VOIDWALKER_CHARACTER_STAGE` IS DELETED, NOT FLIPPED.** A flag standing at
`false` implies the surface is one boolean from returning; it is not.

⚠ **THE PORTAL SHIPPED A DEFECT ITS OWN TEST COULD NOT SEE.** `about-stage.css`
summed `--about-exit` AND `--about-portal` into one `translateX`, plus a 1.6×
scale, on a comment claiming the hook wrote 0 for whichever channel it was not
driving. It did not — both were written every frame, so the cluster slid right
_and_ toward centre _and_ scaled at once. `character-portal.test.ts` pinned
`aboutExitPortalT` equal to `aboutExitT` at all 101 samples, which is the
clearest possible evidence the second envelope bought nothing; what it never
asked was whether two consumers were driving one transform. **A test that
proves two clocks agree says nothing about who is allowed to write.**

### What survives, and why

- `lib/voidwalker/characterEras.ts` + its test — the six-era registry is the
  hologram's registry too.
- `public/models/voidwalker/thoughtform.glb` — pinned, not dead.
- `VoidwalkerTimelineStation` and the ADR-081 travel machinery — UNMOUNTED but
  retained. The shed, the travel clock and the flight config are entangled with
  the corridor, and a mass deletion taken mid-pivot risks regressions in a
  surface nobody is currently looking at. The excision rides the commit that
  lands the hologram.

### The station is QUIET meanwhile

`VoidwalkerStation` renders the masthead and the hand-on line: the chapter
names itself and points to `#contact`. ⚠ This is not decoration — `#voidwalker`
is the corridor's OPAQUE COVER (ADR-030 §6, recorded five times), so the
station keeps its id, its `data-station`, an opaque ground and a height worth
covering with. It writes no `data-vw-mode`, so the non-travel opaque path
applies by construction. `services-ring-smoke` asserts exactly that pair;
`landing-corridor-smoke`'s ADR-081 U4 shed case is skipped and KEPT, because
the machinery it guards is still on disk.

---

## Update 2 — the hologram ships as a transparent, reversible stage (2026-08-27, owner)

The production hologram graduated from `/test/voidwalker-holo-lab`, but its
first integration preserved ADR-074's obsolete cover contract. Runtime proof
at 1440×800 showed two independent defects:

1. `.station:not(.hero)` painted a full-width opaque void + `v7-stars.svg`
   plane on `#voidwalker`. That normal-flow plane rose over pinned transparent
   About before the inner hologram reached its sticky pin. Changing the inner
   figure could never remove the pane because the pane belonged to its parent.
2. The entrance was a one-shot `data-vwh-in` latch. After one visit it never
   cleared, so reverse scroll carried the fully visible composition with the
   document. The masthead's advertised scramble also queued final strings
   against those same already-rendered strings and therefore no-op'd.

### The corrected compositing contract

On a wide (`min-width: 1101px`), motion-allowed, non-fallback corridor session,
`useVoidwalkerHologramScroll` writes `data-vw-mode="hologram"` on the station.
That mode:

- removes station padding so the sticky stage pins at the station boundary;
- removes the inherited station colour and star tile, making the station an
  intentional ADR-008 transparent window onto the already-live corridor;
- inflates `.vw--hologram` to `260svh` and pins only its `.vwh` child.

`VOIDWALKER_EXTENDS_CORRIDOR` permits the handoff, but the live
`data-vw-mode="hologram"|"travel"` attribute decides whether
`useCorridorExitScroll` actually keeps the ambient alive through Voidwalker and
kills it under `#practice`. Without an engaged transparent mode (including the
961–1100px dock-capable band), opaque `#voidwalker` resumes ownership of the
kill. The CSS cover and the rect used by the fade/bottom gate make the same
runtime choice and stay in lockstep (ADR-030 §6).

Every mounted hologram writes `data-vw-surface="hologram"`, which removes the
star tile on static fallbacks too. Mobile, tablet, reduced-motion, corridor
fallback and flag-off paths keep a solid void ground, normal flow, full final
copy and no `260svh` runway. A JS failure never activates the transparent mode.

### The corrected motion contract

`voidwalkerHologramClock.ts` is the single source for two pure runway envelopes:
entry `[0, 0.22]`, exit `[0.74, 0.96]`. The hook derives progress with the About
formula (`clamp01(-runway.top / (runway.height - vh))`) and writes `--vwh-in`
and `--vwh-exit` once per animation frame.

- Entry copies About's in-place terminal power-on exactly: strike, dropout and
  settle opacity ramps plus a transient 2.5px lateral tear. No actor has an
  entrance `translateY`, transition or observer latch.
- Masthead targets blank before `queueScramble`, then decode on the same arm
  that retriggers the figure materialize. Reverse below `0.02` restores and
  re-arms the targets.
- Exit copies About's ownership split: mast/left panels clear left; figure,
  right panels and rail clear right. It completes while the stage is still
  pinned, so native sticky release has no visible actor left to carry upward.

The masked local void floor on `.vwh__media-wrap` remains. It is not the removed
station pane; it is the additive-compositing floor that prevents the JPEG's
near-black pixels from painting a rectangular source box.

### Guards

- `voidwalker-hologram-clock.test.ts` pins clamping, endpoints, the reading
  hold, monotonicity and direction-independent replay.
- `services-ring-smoke.spec.ts` asserts hologram mode, transparent/starless
  station paint, ambient survival, reverse pre-pin hiding, replay, and the
  final `#practice` kill.

---

## Update 3 — proposed About → hologram shared-actor handoff (2026-08-27)

**Status: Proposed.** This is Cycle-B scaffolding for the owner's approved
card-to-hologram transition. Keep this update proposed, and keep its runtime
work unpushed, until the owner has read the fresh-build motion in the browser.

### The seam

The full-viewport gap between About releasing and Voidwalker pinning is
structural, not an easing defect. On the complete capable-desktop path,
`#voidwalker` overlaps the preceding runway by `120svh`. Its `260svh` runway
is unchanged; the overlap creates a `20svh` interval in which both sticky
roots are pinned. Station wrappers never animate. Actors inside those roots
share one scroll-derived handoff clock:

- About portrait flight: `0.74 → 0.88`.
- About copy/orbit de-resolution: `0.74 → 0.96`.
- WebGL portrait → DOM hologram acquisition: Voidwalker `0 → 0.08`.
- Voidwalker actor assembly: Voidwalker `0 → 0.14`.
- Existing Voidwalker exit: `0.74 → 0.96`.

The negative margin is capability-gated and may activate only after valid
future-seat measurements exist. Widths `961–1100px`, reduced motion, WebGL
fallback, invalid measurements and JavaScript failure retain normal flow and
therefore retain no overlap.

### One moving portrait, two renderers

The portrait remains the existing WebGL deck card. `ServicesCardRing` is its
sole transform owner and interpolates a viewport rect from the About seat to
the future hologram seat before using the existing CSS-pixel → NDC →
camera-depth → ring-local projection. The About orbit cluster stays in its
authored right-hand seat and only de-resolves; it must not translate the card
again. This is the single-owner correction to Update 1's deleted double-
transform portal.

The future seat is measured from stable DOM attributes relative to the
Voidwalker sticky root while that root is below the viewport. It uses the
hologram column width, the card's `420 / 680` aspect and bottom alignment with
the hologram slot. A Three-free shared ref publishes that seat, the first left
dossier rect, the handoff/morph scalar, capability, validity and timestamp.

During takeover, WebGL portrait opacity is `1 − morph` and DOM hologram
acquisition is `morph`; endpoints are complementary and exact. The initial
hologram materialization is scroll-owned and reversible. The existing timed
materialize remains available only for deliberate era-button changes. No
second canvas, Three/Fiber import in a DOM landing module, GSAP timeline or
time-based CSS transition may enter this seam.

### Copy and ownership

The About copy condenses from its top-left toward the first left dossier rect
with one uniform width scale. Excess height is masked while rows de-resolve
bottom-to-top through the inverse terminal-stutter grammar. The destination
dossier resolves in the same footprint; other Voidwalker panels may spread
outward by at most `24px`, horizontally only. The masthead and hologram do not
move vertically.

Interaction ownership follows visual ownership: disappearing About links
become inert, and era controls remain inert until their target is readable.
Forward, reverse, interrupted reversal, re-entry, resize across `1101px`, deep
links and refreshes below the seam must all reconstruct from scroll position
without a latch.

---

## Update 4 — proposed editorial character sheet + grounded hologram (2026-08-27)

**Status: Proposed.** This is Cycle-B scaffolding for the owner's approved
Voidwalker redesign. Keep the implementation unpushed until the owner has read
the fresh-build composition and title handoff in the browser.

The stage becomes a restrained character sheet rather than a centred mast plus
footer rail. On capable desktop, the existing three-column station remains:
the left column owns a six-era selector, a fixed-footprint identity title,
FACTS and ON RECORD; the centre owns only the hologram and projector; the right
owns SCOPE, TRANSMISSION and LOADOUT. The selector is a 3-by-2 semantic tab
grid with stable focus. It borrows the hierarchy of game character screens but
keeps the Thoughtform surface unboxed, sharp-cornered and gold only for active
wayfinding. No invented stats or equipment slots enter the record.

The shared seam gains a third measured receiver, `eraTitleRect`. About's copy
shell becomes layout-only and contains two sibling transform actors: the name
travels to the era-title seat while the remaining dossier condenses to FACTS.
Neither actor may inherit a transform from the shell. The destination title
acquires with the existing renderer morph and complementary opacity, so
`VINCE BUYSSENS` resolves into the default `2026 — The Intelligence Architect`
without a blank or duplicate frame. Portrait, title and dossier measurements
must all be valid before the `-120svh` overlap can engage.

The hologram's contact line is asset-authored, not a responsive offset. The
canonical video and poster share one 720×1280 frame with a normalized boot
baseline; the media box remains transform-free so the CSS screen raster keeps
sole ownership of glitch transforms. The projector disc top coincides with the
slot bottom through shared height-derived variables. Future era media carries
frame plus head/foot anchors and falls back to the canonical normalized still
until it passes the same contact guard.

All station-wrapper, transparent/starless, single-canvas, Three-free bridge,
entry `[0, .14]`, takeover `[0, .08]`, exit `[.74, .96]`, reversible-scroll and
normal-flow fallback contracts from Updates 2–3 remain binding.

Implementation contracts while this update remains proposed:

- The default tab is `2026 — The Intelligence Architect`. The tablist and its
  one stable tabpanel never remount; Arrow keys, Home and End move roving focus
  and select automatically.
- Desktop optional seats use fixed height-derived rows so two press records or
  a transmission cannot move the surrounding instrument. At `<=1100px` the
  wrappers flatten into selector → identity → figure/platform → FACTS → SCOPE →
  optional records, and empty optional seats collapse.
- `CharacterEraHologram` validates self-hosted video/poster paths, an exact
  720x1280 frame and normalized `headY`/`footY` anchors. All six eras resolve to
  the normalized Thoughtform pair until an era-specific pair is validated.
- `.vwh__column` owns `minmax(0, 1fr) auto` rows. The slot fills the first row;
  the base's negative disc inset places `.vwh__base__disc` exactly on the slot
  bottom. Media fills the slot with bottom-centred `object-fit: contain`.

---

## Update 5 — proposed centred era instrument (2026-08-27)

**Status: Proposed.** This is a visual-hierarchy amendment to Update 4 and stays
inside the same unpushed Cycle-B acceptance package.

On capable desktop, the six-era selector no longer belongs to the left dossier.
It spans the station's top row as one centred, horizontal tab strip above the
hologram axis. Dormant stops use neutral hairlines and readouts; gold is reserved
for the active rule, diamond and year. The selector remains one stable semantic
tablist with the existing roving-focus behavior and never remounts.

The top instrument owns a fixed height-derived band. Identity/FACTS and
SCOPE/LOADOUT begin beneath it on the same lower reading datum, while the centre
figure continues to span the complete grid and therefore does not move, resize
or gain a second transform owner. The title and dossier receivers remain live
measurements, so the About handoff resolves to the new seats without hard-coded
portal offsets.

At `<=1100px`, the selector returns to the existing 3-by-2 normal-flow form and
the selector → identity → figure/platform → FACTS → SCOPE → optional
records order remains unchanged. No station-wrapper animation, vertical actor
entrance, opaque pane, star field or additional renderer is introduced.

---

## Update 6 — the name stops smushing, the band clears the rail, and the

## hologram composites through real alpha (2026-08-27, owner)

Updates 3–5 shipped to `main` ahead of their visual read, at the owner's
explicit direction; their "unpushed" wording above is stale rather than
binding. This update is the owner's first read of the live motion, and it
corrects three things.

### 1. The title translates; it never scales

`resolveViewportRectTransform` derives `scaleX`/`scaleY` INDEPENDENTLY, and
about-stage.css applied both to the name actor. Measured at 1601×1269, the
source `.voidwalker__name` is **44px** uppercase on one line and the
destination `.vwh__mast__title` was **30.42px** sentence-case in a box
reserving two lines — a 1.45× squeeze on one axis and a different one on the
other, for the whole flight. U3's own comment states the bet: the source
"disappears into the destination acquisition immediately after landing, before
the changed aspect can read as settled typography". It does not; the owner read
it immediately as smushed type.

- `resolveViewportRectTranslation` is new and returns `{x, y}` ONLY. The
  portrait and dossier keep the rect transform — they are boxes of content that
  genuinely resize. Type is not.
- `.vwh__mast__title` now carries `.voidwalker__name`'s clamp byte-for-byte,
  `clamp(26px, 3vw, 44px)` at `line-height: 1.1` — ADR-044's one big-title face,
  already shared with `.services-masthead__title` and `.continuum__title`.
- ⚠ **UPPERCASE WAS REJECTED ON ARITHMETIC, NOT TASTE.** At 44px the single
  word `INTELLIGENCE` measures **319px** against a 270px column. Sentence case
  keeps its own −0.015em; only the SIZE has to match.
- ⚠ **THE SEAT RESERVES THREE LINES** (`min-height: 3.3em`, measured 143px at
  1440×900): `The Intelligence Architect` and `The community manager` both wrap
  to three at the name's size. Reserving the maximum is what stops FACTS
  stepping as the reader changes era.
- ⚠ **THAT RESERVATION LIVES BESIDE `.vwh__decode-line`, NOT IN THE TITLE'S OWN
  BLOCK.** Both selectors are (0,1,0) and the decode rule is LATER in the file,
  so `min-height` declared at the title loses on ORDER — silently, because the
  in-flow decode ghost still sizes the box and only the short eras collapse.
- ⚠ **THE SHORT-VIEWPORT RUNG'S TITLE STEP-DOWN IS DELETED.** `@media
(min-width: 1101px) and (max-height: 820px)` took the title to
  `clamp(26px, 1.75vw, 31px)` — which is why the first live measurement came
  back 28.02px and matched neither value. A destination that shrinks on short
  screens re-opens the mismatch exactly where the runway is tightest. Measured
  at 1280×720 after removal: name and title both 38.4px, title 127px on three
  lines, and **nothing clips or scrolls**.
- ⚠ **THE UN-SCALED NAME OVERHANGS ITS SEAT BY 113px** (383px at 44px against a
  270px column). Accepted, and paid for by starting the un-type before the
  flight ends so the full-width name never sits statically in the narrow seat.

### 2. The arrival decode is scroll-owned

U4 already required the initial materialization to be scroll-owned and
reversible with the timed path reserved for era clicks — and the implementation
did not honour it. The decode ARMED on a scroll threshold and then ran on
`performance.now()`, so the destination resolved on a wall clock while the
source faded on a scroll clock. That is the owner's "it glitches at the end,
but not properly": scrubbing did not scrub it and reverse left it resolved.

`scrambleFrame(job, t)` is a pure function of elapsed `t` with no internal
latch, so a scroll-derived `t` makes it reversible for free.
⚠ **`advanceScrambles` MAY NOT BE USED ON THAT PATH** — it drops finished jobs,
which is precisely the latch. `TITLE_DECODE_WINDOW` is `[0.02, 0.18]`, opening
after entry and closing past the `[0, .08]` takeover so the title resolves IN
PLACE rather than flashing complete at the seam. `deliberateRef` (set only by
`pick`) keeps era clicks on the finite timed path.

### 3. The hologram carries real alpha; the floor becomes the Safari fallback

The owner asked whether the video was transparent. It was not and could not be:
`ffprobe` reports `h264 / yuv420p`, and neither `yuv420p` nor H.264-in-MP4
carries alpha; the poster was a `.jpg`. Transparency was simulated by additive
blending, and the visible black pane was `.vwh__media-wrap`'s own opaque floor
at `rgb(10,9,8)`.

⚠ **THAT FLOOR WAS NEVER AN EDGE BUG, WHICH IS WHY THREE ATTEMPTS AT ITS EDGES
FAILED.** U2's own note requires it be "opaque across the whole media rect";
the station paints TRANSPARENT over the corridor's non-uniform ambient; an
opaque rect over a varying backdrop is a visible pane by construction. The
header's rule — "NEVER try to blend down to the canvas" — is exactly why no
blend tuning could reach it: a transformed ancestor always isolates this
subtree. Real alpha is the only exit.

- `holo-idle-thoughtform.webm` is VP9/`yuva420p` (`alpha_mode=1`), keyed from
  luminance: `lut=y='clip((val-8)*12,0,255)'` over the source's measured levels
  (ground **1**/255, body core **40**, head **133**). 1.82MB against the MP4's
  1.14MB. `holo-still-thoughtform.webp` is the matching alpha poster.
- ⚠ **THE FIRST KEY WAS TOO GENTLE AND IT SHOWED.** `alpha = luma × 6` left the
  body at ~81 % opacity, so mid-tones blended toward the backdrop while
  highlights stayed opaque — contrast climbed and the face and hands clipped to
  white. The shipped curve keeps the BODY fully opaque and keys only the ground
  and the glow's falloff. An A/B of both paths frozen on one frame confirms the
  figure is unchanged; the blown highlights visible in both are the asset's own.
- ⚠ **`canPlayType` CANNOT ROUTE THIS AND SOURCE ORDER IS A TRAP.** Safari 14.1+
  plays VP9-in-WebM but ignores its alpha, and answers "probably" to every codec
  query — so a WebM-first `<source>` list would hand Safari an opaque ground and
  make it WORSE than today. `lib/voidwalker/holoAlphaSupport.ts` decodes a
  581-byte fully-transparent probe once at import and reads the pixel back;
  `HoloFigure` locks the verdict at mount (a late swap would restart the figure
  mid-view) and publishes `data-holo-alpha` on `.vwh__slot`. `null` resolves to
  the floor, which is the fail-safe branch.
- On the alpha branch CSS switches the hacks off: `mix-blend-mode: normal`, no
  `.vwh__ground`, transparent wrap, `isolation: auto`. ⚠ **THE FALLBACK RULES
  ARE NOT DELETED** — Safari has no self-hostable alpha codec here (HEVC-alpha
  needs macOS videotoolbox) and must never regress. The scanline raster and the
  edge glow stay on BOTH branches: they are the hologram's grammar, not part of
  the keying hack.
- `CharacterEraHologram` gains `videoAlphaPath` / `posterAlphaPath`, validated
  `.webm`-only and `png|webp`-only. ⚠ Widening either regex would readmit an
  opaque file to the branch whose whole premise is transparency, with the markup
  still claiming `data-holo-alpha`; a unit test pins the refusal.

### 4. The era band clears the HUD rail

The selector occupied **28–72px** — inside the nav corner's own row (45–72px)
and ~91px above the rail ladder's first tick at `--hud-rail-y-start` (119px at
1601×1269, 89px at 1280×720).

⚠ **THIS WAS A SMALL CHANGE, NOT A 91px SHOVE, AND THE BAND ALREADY HELD THE
ROOM.** `--vwh-era-band-h` was `clamp(102px, 12svh, 128px)` for a 44px strip
pinned to the band's TOP — ~84px of it unused. The clearance is DERIVED
(`max(0px, --hud-rail-y-start − --vwh-pad-top)`) and the strip is `align-self:
end`, so rows 2–3 and both dossier columns follow it down by ~15px at 1601×1269
and ~23px at 1280×720. The figure column spans `grid-row: 1 / 4` and is
therefore UNCHANGED, which is what keeps U5's "the figure does not move".

- ⚠ **`--vwh-pad-top` IS A TOKEN NOW AND THE SHORT RUNG RE-POINTS IT** rather
  than setting `padding-block` behind its back — otherwise the derivation
  subtracts a padding the station is not using and the strip returns to the nav
  corner on exactly the short viewports that rung serves.
- ⚠ **THE ≤1100px RUNG MUST RESET `align-self`.** `.vwh` is a COLUMN FLEX
  container there, where `end` stops meaning "bottom of the band" and starts
  meaning "align right".

Measured live at 1440×900: selector top **108** against rail top **104**; name
and title both **43.2px**; nothing clipped at 1280×720.

---

## Update 7 — proposed phone dossier exception (2026-08-27)

**Status: Proposed — implemented locally, pending owner visual approval.**

ADR-083 narrows this ADR's accepted `<=1100px` serial fallback. The complete
3-by-2 normal-flow document remains binding at `701–1100px`; at `<=700px`, the
local implementation instead reads identity → figure → one-row six-era rail →
RECORD / SCOPE / TRANSMISSION → one active dossier seat. All authored nodes
remain mounted and mobile visibility is CSS-only, so the capable desktop grid,
handoff targets and measurements do not move. Transmission is disabled when an
era has no authored film. This exception does not become accepted until the
owner approves the rendered phone direction.

---

## Update 8 — the era selector becomes the stage's TIME AXIS (2026-08-27)

**Status: Accepted (owner, 2026-08-27).** Supersedes Update 5's centred top
strip and Update 6 §4's rail-clearance band; the identity title, the figure
column, the handoff targets and the entry/exit clocks are untouched.

### The ruling

The owner picked direction 01 from the seven-direction canvas and gave it its
argument:

> "if our rail is like here about navigating through space, left and right
> vertical, then the horizontal one at the bottom can be through time,
> space-time. I think it's nice. Let's just make it elegant, and let's make
> sure that it touches the left and right rail. I think we can make it more
> compact."

> "I don't think we need the loadouts. I think we need to put the scope on
> the left side and the facts on the right side."

So the selector is not a tab strip parked in a band — it is **the stage's
third rail**. The two vertical HUD rails carry SPACE; this one carries TIME,
it meets them at their own feet, and the projector's contact plane sits on its
rule: **Vince stands on the year.**

### What changed

- **`.vwh__rail` is absolutely positioned at the stage's foot.** Its rule
  lands on `--vwh-axis-foot`, which MIRRORS `.hud__rail`'s own `bottom`
  expression in landing.css verbatim. ⚠ The two must move together or the axis
  stops touching the rails it is drawn to meet.
- ⚠ **THE ESCAPE IS MEASURED, NOT NAMED.** The stage sits inside the station's
  reading band, so an axis at `--hud-margin` against it lands short. The first
  cut subtracted `--hud-content-inset` — and overshot by 36px at 1600, because
  the hologram mode **re-pads the station** (197px measured against the token's
  161). `(100vw - 100%) / 2` asks the live box instead of the recipe and is
  correct at every width. It carries the scrollbar, so the rule overshoots the
  rail tips by ~3px rather than falling short; a GAP is the failure that reads
  as broken, an overlap at a hairline tip does not.
- **The stops are inset from the rule's ends** (`--vwh-axis-inset`) so the
  first and last year clear the bottom-left brandmark lockup and the
  bottom-right control cluster. A graduated axis need not start at the frame
  edge: the rule is the instrument, the stops are its reading.
- **Dormant stops are a tick and a year; the active one is a diamond ON the
  rule** plus the lit year and — alone on the surface — the era's NAME. ⚠ The
  name keeps its box on every stop and only the active one inks it, so the
  band cannot change height as the reader moves along it.
- ⚠ **`--vwh-pad-top` ABSORBED THE CLEARANCE THE STRIP USED TO CARRY.** With
  the band gone the identity would have started at 28px, behind the nav
  corner. It is `max(<its old clamp>, --hud-rail-y-start)` now, so the sheet's
  top datum IS the HUD rail's top and the composition lines up with the frame
  around it. `--vwh-era-clear`, `--vwh-era-h` and `--vwh-era-gap` are deleted.
- **SCOPE moves to the left column under the identity; FACTS moves right.**
  The handoff target follows the seat, not the content: `dossier` is on the
  panel that holds the top-left position, which is now Scope.
- ⚠ **ONE SEAT HEIGHT FOR BOTH COLUMNS (`--vwh-seat-h`).** ON RECORD and
  TRANSMISSION are each bottom-anchored in their own side, so equal seats put
  them on ONE datum. The old `248` / `280` pair is the arithmetic reason they
  never lined up — that was the owner's "the text placement is inconsistent",
  and no amount of eyeballing could have fixed it. The identity and FACTS
  share row 1; SCOPE hangs below the identity in the same column.
- **The loadout is deleted from the sheet.** `era.loadout` stays in the record.
  ⚠ It therefore also leaves ADR-083's phone SCOPE mode, which named "motto,
  record and loadout" — that sentence is now wrong and 083 is amended with it.

### Three traps this pass paid for

⚠ **`overflow: hidden` ATE THE RULE, AND EVERY RECT-BASED GUARD SAID IT WAS
FINE.** The stage is capped to `--band-max` and centred, so the axis escaping
to the rails was clipped at the stage's own edge: the layout box measured
`42..1552` — correct — while the PAINTED ink ran `197..1397`, reaching neither
rail. `getBoundingClientRect` reports the layout box, not what survives an
ancestor's clip, so a geometry assertion cannot see this at all. It was caught
by **sampling the screenshot's pixel row** and finding two gaps. The fix is
structural: in hologram mode the station drops its inline padding and the stage
drops the `--band-max` cap, so the BOX spans the viewport and the reading band
becomes the stage's own `padding-inline` — the columns land where they always
did and the axis needs no escape at all.

⚠ **THE FIGURE ONLY EVER FIT BY LUCK.** `.vwh__media-wrap` and `.vwh__slot`
had implicit auto grid rows, so the image's `height: 100%` had no definite
area to resolve against and fell back to its intrinsic 720x1280 — the row then
grew to fit it. Every column had been tall enough to hide that. The axis took
~30px at the foot and the figure hung _below_ its own projector (measured:
media 704 tall in a 675 slot, boots 27px under the disc). Both rows are
`minmax(0, 1fr)` now and `contain` does the work it was always supposed to do.

⚠ **THE NAV CLEARANCE MUST NOT COME OUT OF `--vwh-pad-top`.** The first cut
paid for it there, which is correct for the text and wrong for the FIGURE —
the column spans every row, so it lost 107px at 1920x1080 on top of the ~99px
the axis already takes at the foot. `--vwh-text-clear` is padding on the mast
and the right side instead; row 1 grows, the column's top does not move.

### The rung trap

⚠ **THE SHORT-VIEWPORT RUNG SET `padding-block` DIRECTLY.** Its own comment
warned against exactly that for the TOP, and the BOTTOM was hard-coded anyway
— which put the projector's contact plane **72px below the rule it is supposed
to stand on** at 1280x720, while every other measurement stayed green. Both
ends re-point their token now. A rung that hard-codes one half of a derived
pair is a rung that will get the other half wrong later.

### Verifying

`tests/visual/voidwalker-character-sheet.spec.ts` inverts rather than deletes
the old assertions — the selector must now sit BELOW the identity and the
scope, meet both rail feet, and carry the disc on its rule; SCOPE is pinned
LEFT and FACTS RIGHT from both ends so a silent swap fails. Measured green at
1600x1256, 1280x720 and 1101x800: axis on the rail feet, disc on the rule,
identity and FACTS on one datum, both seats on one datum, nothing clipped.

---

## Update 9 — time runs down the LEFT RAIL, the identity centres (2026-08-27)

**Status: Accepted (owner, 2026-08-27).** Supersedes Update 8's horizontal
time axis outright — the axis is deleted, not flagged off — and moves the
identity out of the left column.

### The ruling

> "the horizontal line doesn't really make sense. What I would like to do is
> actually use our left rail and really have super clear dates … I'm wondering
> whether you can implement the dates in some sort of subtle frame, like some
> sort of scrubber that you can easily scroll through. That way, we really
> leverage our left rail."

> "the title of my era should be centered above my head, and that way we can
> horizontally align scope and facts and also bring transmission and on record
> to be higher."

### What changed

- **`.vwh__rail` is a VERTICAL scrubber on the left HUD rail.** The rail IS
  the track: its own ticks extend OUTWARD into the margin, so its inboard side
  is free and the era stops hang off it rather than sitting beside it. Six
  stops on one pitch, capped top and bottom so the group reads as one
  instrument; the active stop carries the lit year and the era's name.
- ⚠ **IT LIVES IN THE HUD GUTTER, WHICH IS WHY IT COSTS NO COLUMN.** That was
  the owner's own worry — "we can also place it next to our left rail, but
  then we have a lot of columns, especially on lower screen sizes". The band
  between the rail and the reading band is already empty at every capable
  width, and `--vwh-scrub-w` is DERIVED from the same terms the band is built
  from, so the scrubber can never reach into it. A flat 116px overran SCOPE by
  2px at 1101x800, the narrowest capable rung and therefore the one that
  decides.
- ⚠ **THE HANDLE IS A CURSOR, NOT A DIAMOND.** The rail already carries one
  gold diamond — the ADR-031 journey manifest's detent — and a second
  identical glyph on the same rail is two "you are here" marks at two
  different scales. The era handle is a longer, heavier gold rule.
- ⚠ **THE LEAD CLEARS THE RAIL'S OWN GAUGE NUMERALS**, which sit INBOARD at
  `--hud-rail-guide-inset + 10px` — the same side the stops hang off. At 18px
  the years printed straight through the depth gauge's "2" and "5".
- **The identity is centred over the figure in its own row**, spanning all
  three columns at a FIXED measure. ⚠ `max-width` is wrong here: centred and
  content-sized, the mast's left edge moved **113px** between "The founder"
  and "The Intelligence Architect", which the seat-stability sweep correctly
  reads as the instrument reshaping under the reader.
- **That is what finally lets SCOPE and FACTS share a datum.** While the mast
  lived in the left column, that column always started one mast lower than the
  right; no tuning could line them up. Both columns are now row 2.
- ⚠ **BOTH DOSSIER ROWS ARE FIXED SEATS, SEATED FROM THE TOP**
  (`--vwh-lede-h` + `--vwh-seat-h`). A `1fr` lede row pushes the lower slot to
  the column's floor — where ON RECORD and TRANSMISSION used to sit, which is
  the owner's "bring transmission and on record to be higher" — and a
  content-height lede row moves that slot per era, since SCOPE's prose and
  FACTS' 3-to-5 rows both vary.
- **`--vwh-pad-top` takes the HUD's own top margin as its floor.** The identity
  clears the glyph row and the nav corner HORIZONTALLY (it sits in the top
  band's empty middle), so it needs no vertical clearance from either — but it
  should not sit 28px off the viewport edge.

### The trap this pass paid for

⚠ **`.hud__rail` SWALLOWED EVERY CLICK IN ITS OWN GUTTER.** The rail's box is
`--hud-rail-width` wide (68px at 1600) and sits at z 50 inside the HUD; it had
`pointer-events: auto` with no hover, cursor or click rule of its own. Anything
a station places in that gutter is therefore unreachable — the scrubber's stops
could not be clicked at all. The box is `pointer-events: none` now and the
manifest button (its one real control) keeps `auto`. This is a sitewide fix in
`landing.css`: a decorative container that intercepts pointer events over other
UI is a bug wherever it happens to sit.

### Verifying

`tests/visual/voidwalker-character-sheet.spec.ts` inverts rather than deletes
U8's assertions: `tabRows` is 6 (a VERTICAL scrubber) where it was 1, the
selector rides the rail's x and must stay outboard of SCOPE's left edge, the
years must clear the depth gauge, and the identity must be centred over the
figure with both ledes and both seats on their own shared datums.

---

## Update 10 — scroll steps the eras, and the title takes the station line (2026-08-27)

**Status: Accepted (owner, 2026-08-27).** Extends Update 9; nothing in it is
reversed.

### The rulings

> "The intelligence architect and the title, I would put it lower, like the
> same height we have, like 'Navigate the intelligence' in our arc."

> "when you're in the Voidwalker section, you should scroll through the eras
> before scrolling to the next section."

### The title sits on the corridor's own title line

`--vwh-pad-top` floors at **`--station-title-top`** — the shared anchor
`landing.css` already declares for the corridor's station headers and the
services masthead, whose own comment says the two surfaces' big titles derive
from the SAME line. So this is one datum for every big title on the surface
rather than a third number that happens to measure close. The stage's top
inset IS that line; the figure pays ~39px for it, which is the cost of the
title being where the Arc's is.

### Scroll IS the era selector

⚠ **NO WHEEL CAPTURE, AND THAT IS THE POINT.** The stage is already a pinned
260svh runway with one scroll writer. Deriving the era from the runway's own
progress means the reader steps through all six on the way past and the page
continues normally at the end — no trap, no second listener, and no gesture
reducer to get wrong. `#services` proved the trap case is real; this surface
does not need it.

- **`VOIDWALKER_ERA_BAND` is `[0.16, 0.72]`** — inside the hold, clear of the
  entry (ends 0.14) and the exit (begins 0.74), so an era can never advance
  while the sheet is assembling or already clearing.
- ⚠ **A CLICK PINS THE SCROLL TO THAT ERA'S SLICE CENTRE.** Without it the
  writer resolves the runway's position on the very next frame and overrides
  the choice. The casefile's browse band learned this and the two halves are
  ONE contract (ADR-056 U13). `voidwalkerProgressForEra` is the inverse of
  `voidwalkerEraFromProgress`, and the round trip is pinned from every
  starting era, not just the neighbouring one.
- ⚠ **`current` IS AN INPUT TO THE DERIVATION, NOT A CACHE.** The hysteresis
  needs to know which side of a slice boundary the reader came from, or a
  stop held exactly on an edge flickers between two eras.
- ⚠ **A SCRUBBED ARRIVAL IS NOT DELIBERATE** — it must not bump `epoch`, or
  every notch of the wheel restarts the figure's finite 900ms materialize.
  Only a click does.
- `voidwalkerEraScrubRef` is a SLOT, not a store, for the same reason
  `voidwalkerHologramProgressRef` is: one writer, one reader, and no render
  subscribes to a scroll frame.

### Verifying

`tests/lib/voidwalker-era-band.test.ts` (8 cases) pins the band inside both
clocks, the forward and reverse walks hitting all six in order, the boundary
hold, the clamp outside the band, and the click round trip from every era.
Measured live at 1600×1256: scrolling the runway walks
`loop → thoughtform → genai → azeroth → the-crowd → creatives`, and clicking
2014 then nudging 12px leaves it on 2014.

**Left open:** the band gives each era ~15svh, about two wheel notches. If
that reads as rushed, the runway lengthens — but 260svh is tied to the
ADR-082 U3 `-120svh` handoff overlap and the ADR-030 §6 cover lockstep, so
that is its own pass, not a constant to nudge.

---

## Update 11 — the sheet stays symmetric on ultra-wide screens (2026-08-27)

**Status: Accepted (owner, 2026-08-27).** A correction to U9/U10's
composition; nothing in them is reversed.

### The ruling

> "the left panels are too close to the left, and the other ones are too close
> to the middle. It's an ultra-wide screen, but this is just Google Chrome in
> normal size. Can you just apply some responsive, ultra-wide screen best
> practices?"

### What was wrong, and why nothing caught it

`.vwh__side` carried `justify-items: stretch` while `.vwh__panel` capped its
measure at `38ch`. That pins BOTH panels to their column's **LEFT** edge —
which is far from the figure on the left and flush against it on the right.
Measured before the fix:

| width | outer-L | gap-L   | gap-R  | outer-R |
| ----- | ------- | ------- | ------ | ------- |
| 1600  | 206     | 32      | 32     | 212     |
| 1920  | 237     | **105** | **32** | 316     |
| 2560  | 235     | **427** | **32** | 636     |

⚠ **IT READ AS BALANCED AT 1600 BECAUSE THE COLUMNS ARE EXACTLY AS WIDE AS THE
PANEL THERE** — there is no slack to misplace, so the defect is not merely
subtle at the reference viewport, it is _absent_. Every one of this file's
four desktop rungs sits at or below 1920, so the whole matrix was blind to it.
This is the same shape as ADR-070's recurring finding, one surface over: a
guard that only ever measures the authoring viewport cannot see a composition
that comes apart past it.

### The fix

The columns **mirror**: `justify-items: end` on the left, `start` on the
right. The inboard gap is then the grid's own `column-gap` on both sides at
every width, the outer margins are equal by construction, and the width an
ultra-wide screen brings becomes **margin** rather than stretching a reading
measure that is capped for readability. Measured after: 32/32, 38/38, 48/48
with outer margins matching to the scrollbar's width.

- `column-gap` is the one measure allowed to grow with the viewport
  (`clamp(16px, 2vw, 48px)`): the panels are capped for readability and the
  figure is capped by its own height derivation, so this is where the extra
  width buys the composition air instead of pulling it apart.
- ⚠ **`.vwh__panel-slot` NEEDED A DEFINITE MEASURE.** Once the side aligns its
  children instead of stretching them, an auto-width slot shrinks to its own
  content — a short press card and a film would seat at different widths and
  the seat-stability sweep would read the instrument reshaping as the reader
  moves along the rail.

### Verifying

A dedicated case boots **2560×1035 and 3440×1440** — deliberately outside the
reference matrix, because that is where the composition had room to go wrong —
and asserts equal inboard gaps, equal outer margins, equal and still-capped
panel measures, and the identity centred on the figure. `bootDesktop` widened
from the four-rung tuple to any desktop shape so it can.

---

## Update 12 — the first non-thoughtform hologram lands (2026-08-28, owner)

**Status: Accepted (owner, 2026-08-28). ⚠ ITS ASSET AND ITS PIPELINE ARE
SUPERSEDED BY [U13](#update-13--the-azeroth-era-is-captured-not-generated-2026-08-28-owner)
— the Azeroth figure is a capture of Blizzard's renderer now, not a generated
one, and the paths below are v1.** The RULING (this era is the written
exception to the uniform) and the five-step integration walk still bind. No
composition or clock behaviour changes. This is an ASSET note that lifts one
era off the canonical fallback, and it records the pattern the remaining four
era waves will follow.

### The ruling

The 2020 era ships its own hologram: Vince's ACTUAL 2020 field site was
Azeroth, and the figure is his real Warcraft warlock ARAFEL rather than a
teacher with a tote (which is the wardrobe the identity-map's six-era
UNIFORM would have produced). This is the FIRST written EXCEPTION to the
identity-map's boots-law + uniform constants — and it is exactly what
ADR-082 U1 argued the character stage should express: one man across six
eras, in the wardrobe he actually wore at each field site.

### What changed

- **`characterEras.ts` — `azeroth` gains a validated `hologram` field.**
  Paths under `/videos/voidwalker/holo-idle-azeroth.{mp4,webm}` and
  `/images/voidwalker/holo-still-azeroth.{jpg,webp}`. Measured
  `headY = 0.044`, `footY = 0.975` (the figure sits higher in the frame
  than thoughtform's 0.122 / 0.998 because the fel-crystal shoulder
  spires push the top up and the boots stop one row short of the floor).
  The wardrobe/loadout copy on the entry now reads "Warlock kit · Arafel
  · fel-crystal spires · offhand fel-fire" — the plate speaks for what
  it SHOWS.
- **`character-era-hologram.test.ts` — the fallback assertion narrows.**
  The "every unauthored era on the canonical pair" test now `continue`s
  past `azeroth`; a NEW test pins the azeroth-specific hologram's paths
  and anchors, and the pair passes the runtime guard on both alpha slots
  (WebM + WebP only, no MP4/JPG substitution). Total 8 hologram tests
  green.
- **`VoidwalkerHologram.tsx` — the comment updates to `FOUR OF THE SIX
ERAS`.** The stale count was one of the ADR-082 U1 record's own open
  edits; today's landing closes it against `20260828-azeroth-v1`.

### The pipeline path is bespoke, and it is deliberate

The five other eras run through `generate.py`'s canonical → cardinals →
style loop, keyed on `era_wardrobes.md`'s PROMPT LOCK. That loop's base
`Canonical portrait` prompt (`prompts.md`) hard-codes the six-era uniform
(blazer · turtleneck · cap · rolled cuff · combat boots · brooch) and the
BOOTS LAW. For azeroth those six clauses are **contradicted line by
line** by the wardrobe; grafting an override into a PROMPT LOCK still
leaves the base block printing what the era does not wear, so the wave
ran as ONE bespoke prompt combining identity + WoW wardrobe + the
shipping hologram grammar (`styles.md §holo-emissive-black`). The wave
folder (`voidwalker-avatar/waves/20260828-azeroth-v1/run.py`) carries
the exact recipe. `era_wardrobes.md`'s azeroth block is updated to
record the exception in the skill's own vocabulary.

### The reference-extraction pattern the next four waves will follow

Wowhead has no download API and Blizzard's official API serves no 3D
assets, but for any WoW character it does serve a **`main-raw.png`** —
an official, transparent, full-body render of the character in-game with
current transmog (this one 1600×1200 / 397 KB). Attached as slot 2 with
the site owner's real photo in slot 1 (identity-map Rule 0), the model
recreated the wardrobe piece-for-piece on the first wave. The route is
`/profile/wow/character/{realm}/{character}/character-media` (free
develop.battle.net client) OR — as this wave used — the reconstructed
CDN URL `render.worldofwarcraft.com/{region}/character/{realm}/{mod}/{id}-
main-raw.png`, which is a public asset by Blizzard's own path scheme.
The Raider.IO character endpoint gives the equipped-item list (icon
slugs live on wow.zamimg.com) for prompt anchoring, and Vince's own
5120×1440 in-game captures on green/blue chroma + white matte fill the
color/silhouette slots. No 3D extraction (wow.export) or FaceFusion
face-swap was needed for this wave; the assets sit under
`voidwalker-avatar/references/anchors/azeroth-arafel-*` for a re-roll.

### The post-produce math is asset-derived, not inherited

ADR-082 U6 required the alpha LUT to be re-derived from THIS asset's
measured luma levels, and the shipping recipe for thoughtform
(`clip((val-8)*12, 0, 255)`) was calibrated to that asset. Sampled
across all 8 second-extracted frames of the Veo output:
`ground_max = 2.0`, `body_min = 43.6`, `head_mean = 61.7`. The derived
LUT is `clip((val-8)*8, 0, 255)` — same offset (both grounds sit on true
black), tighter scale (gold armor absorbs where wool scattered). WebM
at CRF 48 lands 3.26 MB (1.8× thoughtform's 1.82 MB, mostly the crystals

- sword + fel-fire entropy). MP4 at CRF 26 lands 1.19 MB (in family with
  thoughtform's 1.08).

⚠ **`alphamerge` on this ffmpeg build silently dropped chroma**,
producing a WebM that inspected as `alpha_mode=1` but rendered pure
silver on extraction. The `geq` filter path operating on RGBA — with
BT.601 luma computed inline (`0.299*r+0.587*g+0.114*b`) — preserved
color. This is the recipe going forward, recorded in
`voidwalker-avatar/waves/20260828-azeroth-v1/measure_and_post.py`.

### The remaining four eras follow the same pattern

For an era with an in-game field site (loop, thoughtform, genai, the-
crowd, creatives are all outside a game), the extraction path stays
generative + skill anchors. Where a new era ever needs its own wardrobe
override, the pattern is: (a) record the exception in this ADR's next
update AND in the skill's era-wardrobes.md; (b) author a bespoke wave
script in the wave folder combining identity + wardrobe + hologram
grammar; (c) run through post-produce with LUT re-measured from the
new asset; (d) wire the `hologram` field with measured `headY`/`footY`;
(e) narrow the "every unauthored era on canonical" test to `continue`
past the new era and add an era-specific assertion. This is the walk
for the four remaining fallbacks (loop, genai, the-crowd, creatives —
thoughtform is already shipping).

---

## Update 13 — the Azeroth era is CAPTURED, not generated (2026-08-28, owner)

**Status: Accepted (owner, 2026-08-28). SUPERSEDES U12's asset, its pipeline
and its reference-extraction pattern for this era.** No composition or clock
behaviour changes; the registry field, the anchors and the four files behind
them do.

### The ruling

**A described transmog is a paraphrase, and this era's whole claim is that it
is the real thing.** U12 ran the wardrobe through an image model on a written
prompt, and the model answered with a plausible warlock: a generic hood where
the record has a Maroon Quotidian Hood, invented fel spires where the record
has Earthripple Shoulderpads, a nondescript sword where the record has the
Shard of Azzinoth. Every clause of that prompt was true and the picture was
still wrong, because a wardrobe sentence has no item ids in it.

So the generative step is removed from this era entirely. The figure is a
capture of the SAME renderer the game and the armory use, driven by the
character's own transmog record — and the demon behind him is a second capture
of the same renderer, not an illustration of one.

### What the record is

`voidwalker-avatar/waves/20260828-azeroth-v2/manifest.json` is the source of
truth: the owner's dressing-room hash decoded IN PAGE by Wowhead's own
`getCharacterForHash`, giving thirteen slots with item ids, bonus ids and
source ids, plus **32 non-zero customization choices** (the face is Arafel's,
and the render is not reproducible without them).

⚠ **TWO AGREEING SOURCES BEAT ONE.** The in-game Narcissus record of the
"Daemoniac" outfit agrees with the hash slot for slot. The `/customset` string
the owner pasted DIVERGES in two fields — it reads Hidden Bracers where both
others carry a real wrist item, and a different feet source — and is recorded
as rejected rather than reconciled. The hash is what actually renders.

### The capture, and the four things that made it hard

- ⚠ **THE ANIMATION MUST NOT ADVANCE IN WALL-CLOCK TIME.** Software rendering
  plus a full-canvas PNG costs ~7.3s per frame, so a real-time capture samples
  the idle 7.3s apart — random phase, not motion. A virtual clock takes over
  `performance.now`, `Date.now` and `requestAnimationFrame` after load, and the
  script advances it by exactly 1/fps per frame. That is also what makes the
  loop closeable: N frames at 1/fps is an exact interval.
- ⚠ **AND FREEZING THE CLOCK DOES NOT CAPTURE THE LOOP.** The callback already
  queued sits in the BROWSER's rAF queue and receives the browser's timestamp;
  the viewer only enters the virtual queue when it registers its NEXT frame.
  Ticking immediately after the freeze ran zero callbacks while the animation
  kept advancing on real time — every frame differed, the staleness check read
  8/8 distinct, and the capture was back to sampling ~1s apart while reporting
  1/24s steps. The script now waits for the handoff and fails if it never comes.
- ⚠ **THE DRESSING ROOM'S BACKDROP IS INSIDE THE CANVAS**, and the switch that
  removes it (`setDressingRoomTransparency`) is a no-op without Wowhead's
  premium screenshot entitlement. That backdrop is static and screen-space, so
  the figure is PANNED OUT OF FRAME to record the plate alone and the matte is a
  per-pixel difference against it. Measured: the two plates are byte-identical
  and the plate matches the frames' corners to 0. ⚠ The plate must be taken on
  the REAL clock — with the clock frozen the pan does nothing, `plate-a` comes
  back as a copy of a figure frame, and the plates-agree check passes trivially
  because a frozen clock cannot produce a difference.
- ⚠ **DARK CLOTH IS CLOSED BY TOPOLOGY, NOT BY THRESHOLD.** The cloak, boots and
  pauldrons sit within a few units of the backdrop. A threshold loose enough to
  catch them catches the claw pattern too, so the silhouette is closed and
  hole-filled instead, and the backdrop is un-mixed out of every partial alpha.

### The companion has no matte at all

⚠ **WOWHEAD'S CREATURE PAGE IS NOT USABLE UNDER AUTOMATION, AND THE FIX WAS TO
STOP USING IT.** Three probes of `/npc=11859` never reached a viewer. The
first two were called an ad-frame problem and "fixed" by aborting third-party
requests, which made it worse — the last probe showed why: aborting the page's
OWN subresources makes Wowhead serve a static CDN error page, so the capture
was politely waiting for a canvas on a document that had none.

Reading `viewer.min.js` settled it. `type` selects the SITE (2 = Wowhead), the
models are `[{type, id}]` against the bundle's `Bn` enum (NPC = 8), the id is
the DISPLAY id (64965 for the Doomguard, resolved off the page rather than
guessed), and the renderer takes its context with `{alpha: true,
premultipliedAlpha: false}` and clears to **alpha zero**. So the companion is
rendered on a page we serve ourselves and **the PNG's own alpha channel IS the
matte** — 160 frames in 33 seconds, against hours for the dressing room.

Four things that page needed, each of which failed silently:

- ⚠ **IT MUST BE SERVED AT WOWHEAD'S ORIGIN.** zamimg answers `meta/npc/*.json`
  with 403 to any other `Origin`. On localhost the viewer constructed, sized its
  canvas correctly and rendered nothing for 90 seconds. The stage is `fulfill`ed
  at a wowhead.com URL: our HTML, their origin, which is where the bundle is
  designed to run.
- ⚠ **PLAYWRIGHT MATCHES ROUTES IN REVERSE.** Registered before the catch-all,
  the stage route lost and the browser landed on Wowhead's real 404 — which
  ships jQuery, so the only symptom was `ZamModelViewer` being undefined on a
  page that otherwise looked alive.
- ⚠ **THE TEXTURE EXTENSION INCLUDES ITS DOT AND IS `.webp`.** Two mistakes with
  one symptom: an actor holding its `.m2` and `.skin`, a live render loop, and
  an empty canvas with nothing thrown. Checked directly — `.png`, `.blp` and
  `.dds` all 404, `.webp` is 200.
- ⚠ **A WEBGL CANVAS CANNOT BE READ FROM INSIDE THE PAGE.** The ink probe drew
  the canvas into a 2D one and counted opaque pixels; without
  `preserveDrawingBuffer` that buffer is cleared at composite, so the probe was
  measuring its own read. A compositor screenshot sees what the screen sees, and
  its SIZE is the signal.

### Two placement rules the arithmetic did not supply

- ⚠ **THE CROP'S WIDTH IS MEASURED AGAINST THE BODY, NOT THE SILHOUETTE.** The
  Skull of the Man'ari throws fel-fire skulls past both shoulders, so the
  silhouette is 745 wide against a body of 522 — aspect 0.69 in a 0.5625 slot.
  Sizing the crop to contain the plumes made the WIDTH lead, the box grew to
  1404 tall for a 1082-tall man, and all 322 spare pixels pooled under his feet:
  `footY` 0.816, an eighteen-percent hole between the man and the plate he
  stands on. A plume may run off the edge; the man may not. Body columns are
  found by ink-per-column mass, which is a statement about what the pixels ARE
  rather than a tuned inset.
- ⚠ **THE ANCHORS DESCRIBE THE MAN, NOT THE COMPOSITE.** Measured off the
  delivered poster, `headY` came back **0.000** — the Doomguard's wingtip at the
  frame's top edge. `isCharacterEraHologram` accepts it, because it only asks
  for `0 ≤ headY < footY ≤ 1`. Frame zero is re-composited without the companion
  and measured there.
- The two idles have unrelated periods (64 frames for the figure, 89 for the
  demon). `npc[i % len]` wraps mid-stride once per loop and reads as a flinch,
  so the companion is RESAMPLED onto the figure's period — a few percent of
  playback rate on a breathing idle, against a visible hitch.

### What changed

- **`characterEras.ts` — the `azeroth` hologram repoints to `-v2` paths**,
  `headY 0.044 → 0.051`, `footY 0.975 → 0.973`. ⚠ The suffix is part of the
  contract: v1 shipped under the unsuffixed names, and overwriting a live URL
  leaves every warm cache serving the generated figure. The loadout row now
  letters the real items — "Daemoniac · Shard of Azzinoth · Skull of the
  Man'ari · Doomguard".
  ⚠ **THE SUFFIX IS A CACHE ARGUMENT, NOT A REASON TO KEEP THE OLD FILES.** The
  four v1 assets are deleted in the same commit that repoints the registry —
  orphaned media in `public/` ships on every deploy (3.5 MB here), which is
  exactly what the landing-performance doctrine's asset rule guards. Renaming
  and deleting answer different questions; doing only the first leaves the
  weight behind.
- **`character-era-hologram.test.ts`** pins the `-v2` paths and the new anchors.
- **Every asset got SMALLER** while the fidelity went up, because a game render
  has less entropy than a diffusion model's idea of one: WebM 3.18 → 1.42 MB,
  MP4 1.16 MB → 331 KB, poster 170 → 118 KB, alpha poster 281 → 163 KB.
- **U12's `geq`-LUT recipe does not apply to this era** and neither does its
  `main-raw.png` reference-extraction pattern. Both stand for the generative
  eras; this one has no prompt, no LUT and no key.

---

## Update 14 — the Azeroth capture talks, drops the Skull of the Man'ari, and gets a hologram grade (2026-08-29, owner)

**Status: Accepted (owner, 2026-08-29). SUPERSEDES U13's assets and its
`.mp4/.webm/.jpg/.webp` filenames for this era.** The composition, the clock
behaviour and the runtime guard are unchanged; the source URL, the animation,
the companion, and the colour grade are.

### The ruling

Three things at once, in one brief:

> "I actually want to have my warlock without a weapon, as you can see here
> on the Wowhead website, to be talking the emote 'talk subdued'."

> "I would love … an extra demon behind it — thinking about this, maybe we
> can do things in parallel."

> "I also want that sort of hologram scanline effect, which I don't think we
> have right now."

U13 shipped a still-idle capture with weapons drawn, the Skull of the Man'ari
throwing fel-fire off both shoulders, and a Doomguard behind him — in raw
game colour. Every clause of the owner's read was correct: the pose was
static, the offhand was busy, the demon was singular, and the CSS raster
alone did not resolve a game render as a hologram.

### What changed

- **The hash is new** and the owner emptied the OFFHAND in the dressing
  room before copying its URL, so slot 13 (Skull of the Man'ari) is
  gone at source. The remaining twelve slots match U13's manifest.json
  slot-for-slot; the animation and sheathed state are not in the hash and
  are set after load (see below).
- **Animation is applied post-load via `setCharacterOptions`.** The DR's
  hash carries EQUIPMENT ONLY on this version; the animation dropdown
  writes to the DR's private closure, not to the URL fragment. Probed
  with eight variants (see the wave's `_configureN/introspect.json`):
  `animation: "EmoteTalkSubdued"` takes cleanly (canvas advances, pose
  changes to hands-at-sides), and every sheath variant
  (`sheathed`/`sheathe`/`sheath`/`hideWeapons`/`weapons: "sheathed"` …)
  is silently ignored by the underlying appearance handler. The residual
  is a small Shard of Azzinoth dagger, which the hybrid grade treats as
  fel weapon rather than as game furniture — on-brand for demonology.
  ⚠ **A `SETTER THAT ACCEPTS SILENTLY IS NOT A SETTER**: `ok: true` on
  `setCharacterOptions({sheathed:true})` is what walked eight variants
  into thinking one had worked; the actual test is a pixel comparison
  of the mainhand region across variants, and here every variant looked
  the same.
- **Two static IMPS replace the Doomguard**, seated at the figure's own
  foot line. The .Source folder the owner provided carries an authored
  triplet of the same figure flanked by two imps on a green screen, a
  blue screen, and a WHITE SILHOUETTE MATTE — a hand-authored alpha
  channel of the whole composition. `chroma.py` keys the composition to
  one RGBA off the matte's luminance (as alpha) and the BLUE plate (as
  RGB, no green spill onto the fel puffs), un-mixing the backdrop from
  every partial alpha. `extract-imps.py` splits the RGBA into three
  regions via 8-connectivity and dumps the two flanking ones. The
  LEFT imp fused with the figure's cloak at the boots (2 components
  found, not 3), so the RIGHT imp is MIRRORED into the left seat — two
  horned imps facing inward is a stronger demonology reading than one
  imp of each species anyway, and the alternative was hand-masking a
  5120px composition.
  ⚠ **THE COMPANIONS ARE STATIC, NOT ANIMATED.** U13 rendered the
  Doomguard through capture-npc.mjs and composited it in as a
  matched-alpha video; that path is gone. A static prop behind a moving
  subject reads as "seated at his feet" — the Doomguard's own idle
  wave-off competed with the figure's idle for the eye and made the two
  look independent of each other.
- **A HYBRID HOLOGRAM GRADE is baked into the asset** — see
  `voidwalker-avatar/waves/20260829-azeroth-v3/grade.py`. Two clauses,
  and the interaction between them IS the grammar: fel-green is
  preserved (soft mask on green dominance × emissive density × feather),
  and everything else is duotone-mapped from a warm shadow to a bright
  tensor-gold target, with a lightness pop on lit areas. The scanlines
  and flicker stay CSS.
  ⚠ **BAKE THE LIGHT, CODE THE SCREEN (ADR-082 U1's own doctrine).** If
  the grade were also CSS (a `hue-rotate` on top of a raw game render),
  the raster's scan cadence would multiply against whatever colour ends
  up on the frame and no per-pixel decision the grade made would be
  visible. This is the same argument U1 made for baking the emissive
  lighting rather than the raster.
  ⚠ **AND ONE RAMP MUST SURVIVE THE SITE'S OWN BLEND CEILING.** The CSS
  runs `mix-blend-mode: plus-lighter`, opacity `.92`, a 45%-alpha scan
  mask and a drop-shadow. A conservative gold ramp (peaking at
  `--gold-rgb` 202,165,84) lands under 100/255 after the mask cuts half
  its rows; the target overshoots into `--gold-ink-lit` territory
  (240,200,105) and lifts mid-tones with gamma 0.55 so the figure
  survives the site's own compositor.

### The Route B/C record

The plan carried three routes. Only ROUTE A landed:

- **Route A** (Wowhead capture → chroma-key imps from .Source → hybrid
  grade → encode): the primary path and the one that ships.
- **Route B** (WoW model export + Blender machinima): investigation
  only. The `thoughtform-co/WMW-Midnight` fork's Windows build passed
  (`run 33177387086`), the Blender probe pipeline works (27 meshes, 7
  textures wired, WALean01 action plays), and three off-hand fel-fire
  meshes are dropped by the exporter. The pipeline is a documented
  fallback in the `voidwalker-avatar` skill; no site dependency.
- **Route C** (chroma-key still + Veo animate): the CHROMA and GRADE
  halves are done (`_grade/rgba-blue-graded-v2.png` is a Veo-ready
  hologram still with imps), the Veo call is deferred. If Route A is
  rejected in production, this is the fallback path — one Veo run and
  a re-encode away from a v4.

### The wave

Everything is in `voidwalker-avatar/waves/20260829-azeroth-v3/`:

- `manifest.json` — the character record and the two settings changes
  vs U13.
- `capture.mjs` — U13's script plus a CONFIGURE_JS block that applies
  the animation on both phase A and phase B (the reload for a pristine
  camera restarts the DR at defaults; the config must re-apply).
- `chroma.py` — .Source triplet → clean RGBA.
- `extract-imps.py` — RGBA → per-imp PNGs.
- `grade.py` — the hybrid hologram grade (importable from post.py).
- `post.py` — U13's pipeline with `place_companion` (Doomguard-shaped)
  replaced by `place_imp` (foot-anchored), imps composited BEFORE the
  figure, and `grade_rgba` applied to the composite at crop scale
  (grading a resampled image round-trips through the target's smaller
  pixel grid and the fel mask loses resolution).
- `post-manifest.json` — the actual encode's record.

### What changed in the repo

- **`characterEras.ts` — the `azeroth` hologram repoints to `-v3`
  paths**, `headY 0.051 → 0.049`, `footY 0.973 → 0.972`. The loadout
  row now letters "Daemoniac · Shard of Azzinoth · flanked by two
  imps." — the plate speaks for what it shows (U13's own rule).
- **`character-era-hologram.test.ts`** pins the `-v3` paths and the
  new anchors; the "keeps every unauthored era on canonical" test's
  `continue` past azeroth is unchanged.
- **v2 assets deleted in the same commit as v3 lands** (U13's own
  orphaned-media rule: renaming and deleting answer different
  questions).

### The size vs fidelity honesty

- WebM: 1.42 → 2.75 MB (+94%). Two imps are more content than nothing;
  the brighter grade is more entropy than a raw game render; and the
  loop is 128 frames (5.33s) vs v2's 64 (2.67s).
- MP4: 331 → 792 KB (+140%). Same reason, plus H.264 pays for the
  extra motion frames on veryslow.
- Posters: 118 → 149 KB (JPG), 163 → 217 KB (WebP). Grade + imps at
  the same 88% quality.

⚠ **CRF 40 IS A DELIBERATE CHOICE, NOT THE DEFAULT.** post.py's
default CRF 34 landed the WebM at 3.9 MB. The site's asset budget for
this era is not a hard number, but 2× v2 for equivalent-quality
content is the honest ceiling; CRF 40 gets there at a measured cost
(imp features and fel-mask edges stay legible, mid-tone gradients
carry a touch more banding than CRF 34's).

### Verifying

- 1210 unit tests pass, including the eight in
  `character-era-hologram.test.ts` (registry pins v3 paths and
  anchors) and the eight in `voidwalker-era-band.test.ts` (era band
  clocks are unaffected).
- `scripts/capture-voidwalker-hologram.mjs` captures both themes at
  1440×900 and reads back `data-vw-mode="hologram"`, `data-vwh-era="azeroth"`,
  `videoCurrentSrc` pointing at the v3 WebM, `readyState: 4`, and no
  console errors. Composites recorded in
  `docs/design/voidwalker-hologram/1440x900_{dark,light}_azeroth.png`.

### Left open

- The Shard of Azzinoth is visible in the figure's left hand. The
  hologram grade treats it as fel weapon and the reading is on-brand
  for demonology, but a truly weaponless capture would require either
  a hash-encoding hack (writing a v15-format encoder for the DR) or
  hand-masking the mainhand in post. Neither is worth its cost while
  the current reading is coherent.
- The LEFT imp is a MIRROR of the RIGHT imp. The authored .Source had
  two distinct imps but the LEFT one's alpha fused with the figure's
  cloak at the boots (2 components found, not 3, on 8-connectivity).
  A watershed segmentation with distance transform could recover the
  authored left imp; keeping it as a follow-up.

---

## Update 15 — five eras, and the Azeroth figure is RENDERED rather than captured (2026-08-30, owner)

**Status: Accepted (owner, 2026-08-30).** Two changes from one brief: cut the
roster to five eras, and put the owner's actual World of Warcraft character on
screen TALKING, with the hologram scanline effect the capture route could never
quite produce.

### The roster is five

> "first simplify the eras: the current intelligence architect era · the era
> before was the Gen AI one · the World of Warcraft era · the Expanse era ·
> the Pokemon Go era"

`thoughtform` (2025) and `creatives` (2014) are deleted, and the compound
`the-crowd` (2016-18) — which pinned to the Expanse beat and spoke for four
crowds at once — SPLITS into the two eras the owner named:

- **`expanse`** (2018) — "The campaign commander", `pressBeatIds: [expanse, coins]`
- **`pokemon-go`** (2016) — "The street organiser", `pressBeatIds: [pokemon-go, ophef]`

⚠ **THE SPLIT MAKES TWO PRESS CARDS REACHABLE THAT NEVER WERE.** `the-crowd`
routed `[expanse, coins]`, so its own Pokémon GO and Ophef beats had no era
voice at all — their facts survived as rows, their press cards were unreachable
from the rail. Five eras publish more of the record than six did.

⚠ **`CANONICAL_CHARACTER_ERA_HOLOGRAM` SURVIVES THE DELETION OF THE
`thoughtform` ERA**, and not by luck of ordering — it is a frozen standalone
object, not a field on the era, and `resolveCharacterEraHologram` is
roster-independent. Four of the five eras still resolve to it, so the
thoughtform pair and `thoughtform.glb` stay on disk with no era referencing
them. `character-era-hologram.test.ts`'s walk over the roster is what proves
the fallback survived a roster change.

⚠ **AND THE SMOKE'S ERA PIN WAS UNREACHABLE, AT SIX ERAS AND AT FIVE.**
`services-ring-smoke`'s replay scrolled to the runway MIDPOINT and asserted the
mast reads "The Intelligence Architect"; ADR-082 U10 made scroll the era
selector, and that progress resolves to era 3 at both counts (raw 3.64 / 3.04).
The waypoint is `voidwalkerProgressForEra(0, count)` now — era 0's slice centre,
the same point a click pins, where the boundary overshoot is 0.5 against a 0.22
hysteresis so it seats from either direction. ⚠ Its BASE was wrong
independently of the count: it measured from `#voidwalker`'s document top while
the writer derives progress from `.vw--hologram`'s own rect, so the surrounding
assertions had been passing on a coincidence.

### The figure is the character's own geometry now

> "the animation: the emotetalk subdued. That's the animation I want because
> that corresponds with teaching, because I taught class inside World of
> Warcraft."

v2 and v3 captured Blizzard's renderer through Wowhead's dressing room and
post-graded the frames. v5 renders `wow.export`'s rigged GLB in Blender, on an
emissive hologram MATERIAL. Three things only this route can do:

- **The alpha is the renderer's.** v3 carried 414 matte cuts along dark cloth
  because a difference key against a backdrop cannot separate black from black.
  A renderer knows exactly which pixels it drew.
- **The Fresnel rim needs a surface normal**, which a finished frame does not
  have. It is what stops the figure reading as the "tinted statue" the az-v4
  gallery entry recorded when the same duotone was applied to a flat render.
- **The scan cadence is wrapped on the GEOMETRY**, in world space, so it curves
  over the shoulders instead of lying flat on the picture.

⚠ **BAKE THE LIGHT, CODE THE SCREEN STILL HOLDS (U1).** The baked band is
coarse — one cycle per ~19 rendered px against the site's own 1px-in-3px CSS
mask — and carries only the part CSS cannot. The site's mask, flicker and
materialize are untouched.

### Five things the pipeline got wrong first, each measured

- ⚠ **THE FIRST LIT PASS WAS BROWN** — the "man in a brown suit" this skill's
  own record names one pipeline over. WoW's hand-painted armour sits at
  ~0.1-0.3 luminance, so fed raw into a gold ramp nearly every texel lands on
  the ramp's dark end. A **gamma of 0.50 before the ramp** maps the body of the
  texture into its gold range. Same lever v3's `grade.py` used, one stage
  earlier.
- ⚠ **THEN THE FEL WENT WHITE.** The era law is that fel burns brighter than
  the gold, but the lift pushed green texels through the top of the range and
  the belt orb came back white. Fel keeps its own ceiling and buys brightness
  from SATURATION, which survives the site's `plus-lighter` composite where a
  clipped channel does not. Its mask needed a BIAS, not just a gain — a bare
  `(g - max(r,b)) * k` painted a solid neon disc on the belt and green mittens.
- ⚠ **AN ORTHOGRAPHIC WIDTH FIT UNDER A PERSPECTIVE LENS CROPS WHATEVER LEANS
  TOWARD THE CAMERA.** The Daemoniac pauldrons span 1.40 m against a 2.08 m man
  (0.67 in a 0.5625 slot) AND stand ~0.38 m proud of the body, which at 5.4 m
  is a 7.6% magnification no world-space width accounts for. The first full
  render came back with an **81px-tall flat cut through the left pauldron on
  117 of 149 frames** while every number in the solve reported a silhouette
  that fitted. Widening the pose sample from 13 to 149 moved it NOT ONE PIXEL,
  because sampling was never the defect. The camera is solved against the
  PROJECTED silhouette now, iterated to convergence; the delivered alpha's
  anchors agree with the solve to four decimals.
- ⚠ **THE BAND DRIFT MUST BE AN INTEGER NUMBER OF CYCLES PER LOOP.** Authored
  as a speed it ran 56.5 cycles over the loop, so the wrap jumped half a band —
  and **the loop-seam guard does not catch it**, because the seam measures the
  whole frame, where the figure's motion is twice as loud as the banding.
- ⚠ **EVERY wow.export MODEL CARRIES AN `Icosphere` ARTEFACT** — a ±1 m shell
  with no material, which in an all-emissive scene with the lights off renders
  as a solid BLACK sphere. The figure's was hidden at the top of the script;
  the imp import three hundred lines later brought in its own, and two
  different imp displays both came back as a gold head on a black ball. The
  cleanup is a function called at both sites.

### The companions are animated, and that took one setting

`config.exportCreatureFormat` was `"OBJ"` — which is the whole reason v3's imps
were frozen stills composited into every frame. An OBJ carries no skeleton. Set
to `GLB` with `modelsExportAnimations`, the same app exports a **Fel Imp with
25 animations and a 63-joint skin**. Two are seated at the figure's own foot
line, toed inward, driven off `Stand` through an NLA strip whose INTEGER repeat
and derived scale make **7 cycles span the loop exactly** — U13's finding that a
companion on an unrelated period wraps mid-stride and reads as a flinch, solved
without touching a keyframe.

⚠ **THE COMPANIONS ARE SCENERY AND MAY NOT MOVE THE ANCHORS** (U13). The
envelope, the camera fit and `headY`/`footY` measure the FIGURE alone; the imps
are checked against the frame separately and warned about. They may crop; the
man may not.

⚠ **AND "NOT IN THE FIGURE'S MESH LIST" IS NOT "IS AN IMP".** That complement
also holds the hidden `Icosphere`, so the frame check read the stray instead of
the companions and reported the same out-of-frame numbers before and after the
seating was fixed. Two runs agreeing to three decimals across a change that
moved every imp is the tell that a measurement is not looking at its subject.

### A pre-existing defect the roster change surfaced

⚠ **THE `genai` LEDE HAS BEEN OVERRUNNING ITS SEAT ON THE LIVE SITE.** Its
record body is the roster's longest, and at 1440x900 its last line printed
**18px through the TRANSMISSION heading** below it. Nothing caught it: the copy
is at LOCK and passes every per-string budget, the panel BOX overlaps by design
so an overflow check reads clean, and a screenshot of a heading with one line of
prose across it looks like a heading. `--vwh-lede-h`'s FLOOR is what fixes it —
at 900px height the `26svh` term was already resolving to the old floor.

`scripts/probe-voidwalker-eras.mjs` is the new guard: it walks every era and
compares INK rects via `Range.getClientRects`, at three viewports.
⚠ It must compare **both axes** — the sheet is two columns, so panels sharing a
band of rows is the normal composition, and a vertical-only test fired on eras
this pass never touched, which is how you tell the guard is wrong rather than
the layout. ⚠ And it must measure INK, not BOXES: box overlap reported 24px on
a correct era.

`pokemon-go` shipped five FACTS rows in a seat sized for four and printed 34px
through ON RECORD; the fifth row was the Ophef beat's summary, whose press card
is already the second card below it.

### What changed

- `characterEras.ts` — the union, `CHARACTER_ERA_COUNT` 6 to **5**, three eras
  deleted, two added, the azeroth hologram repointed to `-v5` with
  `headY 0.049 -> 0.1586`, `footY 0.972 -> 0.9695`, loadout to "Daemoniac ·
  Shard of Azzinoth · talking."
- `voidwalker-hologram.css` — the `nth-child(6)` stagger and the 6-column phone
  rail; `--vwh-lede-h` floor 232 to **268px**.
- `character-eras` / `voidwalker-era-band` / `character-era-hologram` /
  `voidwalker-character-sheet` / `services-ring-smoke` retimed and repinned;
  `probe-voidwalker-models.mjs`'s roster; the rules file.
- v3's four assets deleted in the same commit v5 lands (U13's orphaned-media
  rule). Payload: **WebM 2.75 -> 2.3 MB, alpha poster 217 -> 144 KB**, with 21
  more frames — swept CRF 36/42/44/46/50 to 5.48/2.76/2.26/1.81/1.21 MB, and
  the bitrate is the bands and the layered translucency, not render noise (64
  TAA samples measured 0.62/255 from 256).
- Wave: `voidwalker-avatar/waves/20260830-azeroth-v5-blender` — `holo-scene.py`
  (scene + shader), `tune.py` (sweep a look without a 90s rebuild),
  `measure.py` (anchors, loop seam and band drift off the delivered frames),
  `encode.py`, `export-imp.mjs` (drives the running wow.export over CDP and
  PUTS THE SETTING BACK).

### Left open

- **The light theme washes the figure out.** An emissive gold asset at 0.92
  opacity over parchment is faint; pre-existing behaviour for this station, not
  a v5 regression, and changing the light-mode compositing is its own decision.
- **`--pda-txt3` at 2.38:1 in the light walk** remains the one known
  pre-existing smoke failure. The era-text failure this update retimed was the
  other, and it passes now.
- The figure sits with ~0.16 of air above the head, because the pauldrons bind
  the frame. Cropping them is the only way to buy it back, and a pauldron is
  worn.

---

## Update 16 — the green comes down, and the imps become a court (2026-08-30, owner)

**Status: Accepted (owner, 2026-08-30). SUPERSEDES U15's asset and its `-v5`
filenames.** Two notes on the shipped v5, both about things that were shouting.
No composition, clock or guard behaviour changes; the material's fel cap, the
companions and the four delivery files do.

### The fel mask is capped, not re-biased

> "I think the belt is now green. It's standing out too much. Same with the
> edges right above the hands."

⚠ **RAISING THE MASK'S BIAS DOES NOT FIX THIS, AND THE REASON GENERALISES.**
Those texels really are fel-green in the source, so a bias only nibbles the
patch's EDGE while its middle stays at full strength. What reads as loud is the
mix reaching **1.0** — the point where gold leaves the pixel entirely. Capping
the mask (`FEL_MAX` 0.42) keeps fel as a TINT ON the gold rather than a
replacement for it, which is what "minimise, do not remove" actually asks for.

Measured after: the belt's brightest pixel is `[251, 205, 117]` — gold, and not
clipping. The cuffs above the hands come back a pale highlight rather than a
green one. Across the whole figure, 0.35 % of pixels clip.

### The companions are three species at three sizes, facing him

> "It would be nice to have some of them, and they all shouldn't be at the same
> size. Maybe we can rotate them and spread them in front of me so they're
> looking at me, with their backs against the camera, like a half circle."

Fiendish 0.50 m · Corefire 0.80 m · Imp 0.58 m, on a 150° arc 0.30 deep by
0.47 wide, each yawed to face the figure's centre so the frame sees their backs.

- ⚠ **THREE OF THE SEVEN IMP DISPLAYS ARE UNUSABLE.** `DiabolicImp`,
  `EmpoweredImp` and `ImpLord` carry a body texture that is effectively black,
  so an emissive luminance ramp draws horns and hands and nothing between them.
  `imp-sheet.py` renders every candidate alone, framed to its own height —
  which is how to see that in one look rather than by composing blind. The
  first arc shipped a broken species into the middle of the composition.
- ⚠ **FOUR IS SOUP; THREE READS. COUNT WAS THE LEVER, NOT PLACEMENT.** These
  models are about as wide as they are tall in `Stand`, so four at 0.5–0.9 m is
  ~2.8 m of imp across a 1.44 m frame — and because the material is
  TRANSLUCENT, overlapping bodies do not occlude, they interleave. Every limb
  is visible through every other and the result is a tangle. Two passes of
  re-angling and re-sizing four imps changed nothing; dropping to three fixed
  it immediately.
- ⚠ **THE ARC IS AN ELLIPSE — WIDE AND SHALLOW — AND THAT IS PERSPECTIVE, NOT
  TASTE.** A companion forward of the figure is closer to the lens, so the same
  floor plane projects LOWER: at 0.6 m forward the magnification is 1.125,
  which takes a foot line from v 0.97 to **1.03**, off the bottom edge — and
  off the projector disc, which the site draws at the figure's own foot line.
  Reaching sideways costs nothing (the frame is width-bound by the pauldrons,
  and the imps sit where the figure is narrow); reaching forward costs the
  floor.
- ⚠ **THEY BURN AT 0.62x THE FIGURE'S EMISSION**, applied by SET DIFFERENCE —
  materials the imps use and he does not — so the rule can never dim him. Two
  reasons at once: their horns and claws are the palest texels in any imp atlas
  and clipped to white at his exposure, and a hologram whose scenery is as
  luminous as its subject has no subject.
- There is no seated or kneeling idle in the imp action list (`Stand` 0/1/2 and
  combat/swim clips only), so the "attending" read comes from the yaw alone.

### Two guards that were measuring the wrong thing

- ⚠ **`measure.py` READS THE COMPOSITE, AND THE ANCHORS DESCRIBE THE MAN.**
  Pointed at the delivered sequence it returned `footY` **0.9945** off an imp's
  tail against the figure's own **0.9695** — and the site would have seated the
  projector disc a quarter of a frame low. This is U13's law arriving through a
  different door, and the durable half is the TELL: his boots do not move, so a
  figure-only pass reports the same foot row on all 149 frames (1241..1241)
  while the composite wandered 1252..1273. The script now warns on that spread,
  and the anchors are taken from the figure-only render.
- ⚠ **A FRAME CHECK MUST ASK HOW MUCH LEAVES, NOT WHETHER ANY DOES.** These
  imps trail long tails, and an extremes-only test fired on a tail tip exactly
  as loudly as on half a body — which is how a guard earns the habit of being
  ignored. It reports the SHARE OF VERTICES outside the frame (0.5 % here) and
  only warns past 4 %.

### …and then stood off him (v7, same day, same owner pass)

> "Can you spread them a bit so they're less close to me?"

The arc goes **0.30 × 0.47 → 0.42 × 0.525** and the imps shrink to 0.44 / 0.72
/ 0.50 to pay for it. The gap between his leg and the nearest imp goes from
about 5 cm to about 17 cm — the difference between demons leaning on him and
demons attending him.

⚠ **LATERAL ROOM IS NOT FREE ON THIS FRAME, AND THAT IS WHY THEY SHRANK.** The
crop is WIDTH-bound by the pauldrons, so the flankers already sit near the
edge: at 0.72 m of half-frame, an imp centre at `arc_y × sin 75°` plus its own
half-width has nowhere to go. Every centimetre outward has to come off the
imp's own size or it leaves the frame. Spreading a companion arc is therefore a
trade against the companions' scale, never a free move — and the same is true
forward, where the cost is the floor rather than the edge.

### What changed

- `characterEras.ts` — the hologram repoints to `-v7`; anchors unchanged
  (0.1586 / 0.9695) across v5, v6 and v7, which is itself the evidence that the
  companions never moved them. The loadout row now says "three imps attending."
- `character-era-hologram.test.ts` pins the `-v6` paths.
- `holo-scene.py` — `FEL_MAX`, `--imps` (a list of `path@height`), the
  elliptical arc, the per-companion yaw, `IMP_DIM`, and the share-based frame
  check. `imp-sheet.py` is new.
- Each cut's four assets are deleted in the commit that supersedes them.
  Payload 2.38 MB at v7 — flat across all three cuts.
- All four cuts stay in the gallery (v7 live, v6 beside it, v5 and the
  companion-free control on the card below) so the sequence can be read.

---

## Update 17 — it is a class, not a court (2026-08-30, owner)

**Status: Accepted (owner, 2026-08-30). SUPERSEDES U16's companion arrangement
and its `-v7` filenames.** The figure, the material, the frame and every guard
are unchanged; who stands around him is not.

> "remove the imp in front of my avatar, keep the ones on the left and right
> but rotate them so their faces are facing the same way as i do … there should
> be models of children who also have a sit pose … Use different imps."

Three cuts of the imp arc (v5, v6, v7) tuned a composition that was never quite
the era's subject. This one is: **two imps stand at his shoulders facing the
way HE faces — with him, not watching him — and three children sit in the space
the third imp vacated, facing him, backs to the reader.** That is the shape a
room takes when someone is teaching in it, which is the whole reason this era
is on the wall. ⚠ **The space in front of a teacher belongs to the students** —
which is why the middle imp had to GO rather than move aside.

### What the models gave us

- WoW's NPC roster carries 39 child models; four were exported and **every one
  has `WASit01` (two variations) and `WASit02`** — real seated idles, not a
  standing model posed. Attentive Child, Human Orphan and Neighborhood Child
  ship; `find-creature.mjs` is the regex search over the live listfile that
  found them.
- ⚠ **THE ACTION IS CHOSEN BY PREFERENCE ORDER, NEVER BY INDEX.** A creature's
  action list is unordered and differs per model, so "the third one" means
  nothing while `WASit01` means a seated idle on every model that has one.

### Two rules the brief forced

- ⚠ **THE VARIATION IS A FIXED TABLE, NOT A RANDOM.** "They shouldn't feel like
  copy paste" is a real requirement and `random` is the wrong tool for it: a
  re-render has to reproduce the delivered frames exactly, and a seed buried in
  a script nobody re-reads is a reproducibility trap. Seven authored offsets
  (position, yaw, scale) cycled by index — and neighbouring children alternate
  `WASit01`/`WASit02`, because **a repeated pose is loudest in MOTION**, where a
  still would not show it at all.
- ⚠ **THE CLASS NEEDS A DEEPER DIM THAN THE IMPS, AND SKIN IS WHY.** An imp's
  hide is dark and lands low on the gold ramp; a child's skin is pale and lands
  high, so at the flankers' 0.62 the seated class measured **mean-luminance 146
  against the figure's 138** — the scenery outshining the subject, in the third
  of the frame nearest the reader. At 0.42 the class reads 124 against his 138.
  One dim for two very different materials was the wrong shape of knob; the
  factor is per GROUP now, still applied by set difference so it can never
  reach him.

### What changed

- `characterEras.ts` — repoints to `-v8`; anchors unchanged at 0.1586 / 0.9695
  across v5–v8, which is the evidence the company has never moved them. The
  loadout row reads "two imps, and a class."
- `holo-scene.py` — `seat_imps` becomes `seat_company` with two groups and two
  placement laws (`--imps` flanking, `--kids` seated), `KID_DIM`, the jitter
  table, and per-group material dimming. `find-creature.mjs` is new.
- v7's four assets deleted in the same commit v8 lands. Payload 2.33 MB.

### …and the class came back out (v9, same day, owner)

> "let's make a scene without the kids"

**v9 is v8 with the class removed and NOTHING ELSE RETUNED**, which is what
makes the pair readable as the difference the class made rather than as two
different compositions. What v8 got right survives untouched: the imps out of
the middle, standing at his shoulders facing the way he faces.

⚠ **THE "LEFT OPEN" NOTE BELOW PREDICTED THIS, AND THAT IS THE USEFUL PART.**
Three children at ~150px each read as a huddle rather than as a class — the
same scale problem the imps hit at four, one group later. **The space is worth
more empty than filled with figures too small to be read as what they are.**

⚠ **THE MACHINERY STAYS.** `--kids`, `KID_DIM`, the seated-idle preference and
the sit-variation alternation all remain in `holo-scene.py`; only the call site
is shorter. They are correct and they cost nothing unused, and the question
("can the era show the class?") is a good one that came back once already.

Anchors unchanged again at 0.1586 / 0.9695 — v5 through v9. ⚠ And with the
flankers alone the composite's foot row is CONSTANT at 1241 across all 149
frames, so `measure.py`'s wandering-foot warning correctly does not fire: the
flankers stand on his own plane, where the seated class did not.

### Left open

- The children read as a huddle at page scale rather than as three individuals;
  at 720 × 1280 they are ~150px each. If that matters the lever is fewer and
  larger, exactly as it was for the imps. **(Answered by v9: taken out.)**

---

## Update 18 — he asks, he explains, he settles (2026-08-31, owner)

Three owner notes on v9, delivered as **v10**:

1. **The belt comes off** — its glow is distracting.
2. **Chain `EmoteTalkQuestion`, `EmoteTalk` and `EmoteTalkSubdued` in a loop.**
3. **The left imp's arm falls out of frame** — smaller, and further in.

### The chain, and why the junctions cost nothing

`holo-scene.py` gains `--chain`: comma-separated action name PREFIXES played
back to back on one NLA track. Empty keeps the input file's own assigned
action, so every earlier cut still rebuilds from this script byte-identically.

⚠ **HOW WoW AUTHORS A CYCLE IS WHAT MAKES THE SEAM FREE.** An emote's last
frame duplicates its first, and all three talk emotes start and end on the same
neutral stand. So laying strip N+1's START exactly on strip N's END overwrites
that duplicate with an identical pose: the junction closes by construction, and
no blend-in window is needed — which is the point, because a crossfade would
smear the hands mid-gesture.

⚠ **THE BOUNDARIES ARE FRACTIONAL AND MUST STAY THAT WAY.** WoW times an
animation in milliseconds, so `EmoteTalkQuestion` is **43.2** frames, not 43.
`NlaStrips.new()` takes an integer start and refuses an overlap, so every strip
is parked far right first and then moved to its real float boundary. Rounding
instead would drift the chain a frame per junction and leave a period that does
not close. The three periods add to **43.2 + 48.0 + 148.8 = 240.0** frames —
ten seconds on the nose, and the wrap lands on the neutral pose at both ends.

⚠ **THE ACTIVE ACTION OUTRANKS THE WHOLE NLA STACK.** Left assigned, the input
file's own `EmoteTalkSubdued` plays straight over every strip and the chain
renders as exactly the cut it was written to replace — no error, no warning, a
correct-looking ten-second video of the wrong thing. `animation_data.action`
is cleared and every pre-existing track removed.

⚠ **`EmoteTalk` IS A PREFIX OF FOUR OTHER EMOTES** and `bpy.data.actions` is
unordered, so a first-match lookup picks `EmoteTalkExclamation` or
`EmoteTalkNoSheathe` on a whim. The exporter's own naming gives the tiebreak
for free — a real emote continues with ` (ID …)`, so `EmoteTalk (` is exact
where `EmoteTalk` is not — and anything still ambiguous (a multi-variation
emote such as `EmoteDance`) is an **error**, never a guess.

⚠ **WHAT WAS TUNED IS THE BAND RATE, NOT THE CYCLE COUNT.** Six cycles was
chosen for a 6.21s loop; carried literally onto a 10.0s chain it would halve
the drift and read as a printed texture. `BAND_RATE` (bands per second) is the
constant now and the integer count is derived from the loop and rounded — the
integer requirement is about the WRAP, the rate is about the READ, and only one
of the two is a taste decision. 240 frames → 10 cycles → 1.000 bands/s.

### The price is scale, and it is arithmetic

⚠ **headY MOVES 0.159 → 0.235, AND NOTHING WAS RECOMPOSED.** The frame is
WIDTH-bound and the projected fit takes the widest pose in the whole loop, so
the 0.5625 slot then decides the height: reach costs size. Measured per emote,
the man spans

| emote                         | width       | what is widest            |
| ----------------------------- | ----------- | ------------------------- |
| `EmoteTalkSubdued` (v9's cut) | 1.400 m     | the pauldrons             |
| `EmoteTalkQuestion`           | 1.446 m     | the gauntlets, slightly   |
| `EmoteTalk`                   | **1.549 m** | the gauntlet swinging out |

so **`EmoteTalk` alone widens him 10.6 % and stands him 8 % shorter in the
slot**. `footY` does not move, so the projector disc is exactly where it was
and the whole surplus lands above his head. Cropping it back is not available:
a gauntlet is worn, and U13's line is _a plume may run off the edge; the man
may not_ — the same law that made the pauldrons decide the fit in the first
place. **If the v9 size matters more than the fuller gesture, the lever is
dropping `EmoteTalk` alone** (Question + Subdued fits at 1.446 m ⇒ headY
≈ 0.171), which is one flag on the build.

### The belt

`--hide-parts` takes object name PREFIXES and runs BEFORE the envelope is
built, so a removed part leaves the camera fit and the shader pass at once — a
part hidden afterwards would still be framed for. `Waist_Item250039_0/_1` go:
the buckle carries the set's fel orb, and even under U16's fel cap it was the
brightest single object on the man. ⚠ **`humanmale_hd_Belt1` STAYS** — it is
the BODY's own belt geoset on the shared `data-1` material, it never glowed,
and dropping it too would cut a notch in the robe where the item used to sit.

### ⚠ The frame guard was measuring the set instead of the objects

v9's guard reported a placid **1.3 % of vertices outside** and filed it as an
allowable cropping tail, while the owner could see one imp's arm running off
the LEFT edge. The share was **POOLED ACROSS THE COMPANY**: an aggregate over
independently-placed objects cannot name the offender, or the side, or the
amount. It is per companion now — `COMPANY_MEMBERS` keeps each one's meshes
separately, and the report prints each one's `u`/`v` extents, its own share
outside, and which edge it crosses by how much. Sampled at five points around
the loop rather than two, because at ten seconds the companions run their own
idle at their own period and the frame one reaches furthest is not the frame
the figure reaches his.

With that reading in hand: FiendishImp 0.58 → **0.55 m** and the flank offset
0.52 → **0.49 m**. Both companions now measure **0.00 % outside** (u
0.022..0.388 and 0.698..0.947).

### ⚠ And a warning that cannot print is a warning that does not exist

Python on Windows writes stdout in cp1252, which has no `⚠` — so every ⚠ line
in `measure.py` was a latent `UnicodeEncodeError`, invisible for as long as its
condition stayed false and a **crash instead of the warning** the first time it
fired. Found exactly that way, by the new junction guard. `sys.stdout` is
reconfigured to UTF-8 once, rather than spelling the marks ASCII: the mark is
the house's and the console is the thing that bends.

### The junction guard, and the baseline it needs

`measure.py` walks EVERY adjacent step now, not the first 24 — once the
delivery is a CHAIN the loudest cut is not at the wrap but at a junction in the
middle, which a window over the opening frames cannot see.

⚠ **AND THE GLOBAL MEDIAN IS THE WRONG BASELINE FOR A CHAIN**, failing in the
direction that wastes time: `EmoteTalkSubdued` is 149 of the 240 frames and is
a slow idle, so it drags the median down until every frame of the two brisk
emotes reads as a spike. The first cut of this guard fired on frame 46 — three
frames INSIDE `EmoteTalk`, where the hand snaps out, which is the animation
working. A discontinuity is local by definition, so the baseline is local too:
each step against the median of its own ±6 neighbours. Delivered reading —
worst cut **1.98×** local at frame 86 (inside `EmoteTalk`), and **neither
junction is distinguishable from ordinary motion**.

### Measured

|                          | v9              | v10                             |
| ------------------------ | --------------- | ------------------------------- |
| frames / duration        | 149 / 6.21s     | **240 / 10.00s**                |
| headY / footY            | 0.1586 / 0.9695 | **0.2352 / 0.9695**             |
| loop seam ÷ typical step | 0.74            | **0.54**                        |
| worst cut (local ratio)  | —               | **1.98 at f86**                 |
| companions outside frame | 1.3 % pooled    | **0.00 % each**                 |
| WebM                     | 2.22 MB         | **3.28 MB** (0.33 MB/s vs 0.37) |

Anchors read off the FIGURE-ONLY render, foot row constant at 1241 on all 240
frames; the composite returns 0.9719, which is the imps' claws three rows under
his boots.

### Left open

- **The figure is 8 % smaller in the slot** and the surplus is dead air above
  his head. It is the honest fit for the performance that was asked for, but it
  is a visible change from the cut the owner called good. The lever is named
  above and costs one flag.
- **3.28 MB** is over the 2.75 MB the wave has been holding itself to. The
  length is the ask; the bytes follow at the same CRF. Raising CRF to 52 buys
  back roughly 30 % at a real cost on a translucent banded asset — not taken in
  the same commit as a content change, because it would confound the comparison
  the gallery exists for.

## Update 19 — the datum rails replace the character sheet (2026-08-31, owner)

**The station's interior is the D2 "DATUM RAILS" composition. ADR-082 U11's
three-column character sheet — mast, two mirrored side columns of panels, the
era scrubber in the HUD gutter — is DELETED, not flagged off.**

The owner's read of the shipped sheet was that it was _"a bit like a glorified
PowerPoint"_. Two waves of image mockups (26 renders,
`docs/design/era-stage-pass/`) settled the direction; the pass is recorded
there and the short version is the finding, not the pictures:

⚠ **THE UNBOXED PANELS WERE ALREADY THE FIX FOR THAT SAME COMPLAINT.**
`voidwalker-hologram.css` carried the note: the first cut was bordered cards
with washes and lit head bars, rejected on 2026-08-26 for exactly this word.
So the answer was never boxes-versus-no-boxes. **It is the SLIDE SKELETON** —
a centred title over two text columns — which reads as a slide whatever the
panels do.

**What the composition does instead.** Four unboxed panels whose heads ride
**two full-width construction rails**, a **ground datum** extending from the
projector disc, and the five eras as a **chip band at the foot**.

- ⚠ **NOTHING IS DRAWN TO THE FIGURE.** Wave 1's alternative tethered each
  panel to the hologram with a leader line landing on a shoulder or a knee,
  and the owner's ruling killed it: _"it implies scope is linked to my
  shoulder, and that's not really the case."_ A drawn connection asserts a
  relationship, and this record does not have that one. The connection is
  made by SHARED STRUCTURE instead — alignment says what the leader line was
  claiming, and it claims nothing false.
- ⚠ **THE HEADS AND BODIES ARE SEPARATE GRID ITEMS**, which is what makes the
  rails exact rather than nearly right: a head's bottom edge IS a row
  boundary, so the rail behind it cannot be a few pixels off. This is also
  why the exit transform is COMPOSED with the entry tear rather than hung on
  a group container — wrapping the cells to get a container back is precisely
  what would destroy the rails.
- ⚠ **THE ERAS LEFT THE HUD GUTTER.** U9 put the scrubber there _precisely_
  so it cost no column; this spends a band on it, by owner ruling, because
  the selector must read as character-select on BOTH breakpoints. The gutter
  is left EMPTY rather than refilled.
- **On the phone the avatar is the FIRST TAB** (a drawn mark, then RECORD ·
  SCOPE · TRANSMISSION), and the fixed dossier seat is deleted: one area
  serves both, each at full generosity. ⚠ The mark is a mark and the other
  three are words _deliberately_ — as four equal cells the row rhymed with
  the era band below it and read as one control stated twice.

**What went with it**, listed so nothing is restored from muscle memory:
`HoloEraPanels.tsx`; the mast/side/panel/rail/pip/facts/press/film/tabpanel
and mobile-mode rules (~1100 lines of `voidwalker-hologram.css`); that
composition's entry/exit block and responsive rungs;
`tests/visual/voidwalker-character-sheet.spec.ts`; and
`VOIDWALKER_DATUM_STAGE` itself. ⚠ A flag standing at `false` implies the
losing drawing is one boolean from returning, and it is not (ADR-070 U35).

**What survives, and where it lives now.** `voidwalker-hologram.css` is the
FIGURE's sheet — the slot's isolation and masked floor, the alpha branch, the
projector base, the phase animations, the decode lines. ⚠ **`.vwh` declares
no layout**; it is the token host, and the box comes from `.vwd__vwh` on the
landing or `.hll__figure` in the figure lab, **both axes definite** or the
slot's percentage sizing resolves to nothing. `/test/voidwalker-holo-lab` is
the FIGURE lab (its knobs always were `HoloFigure` props), and
`/test/voidwalker-datum-lab` is a window onto the shipped composition rather
than a copy of it.

**Two things this pass got wrong first, both silent.** The station's sticky
pin named `.vwh` by class, so the new root translated through the entire
260svh runway with no error — **the pin belongs to the STATION, not to a
composition**. And the figure's acquisition rules named `.vwh[data-vwh-ready]`
while the writer stamps the ROOT, so on the datum branch the slot sat at full
opacity and skipped acquisition entirely. Both are the same shape of bug: a
selector written against the composition that happened to be there.

**Verifying:** `node scripts/capture-voidwalker-station.mjs` (headed — the
corridor is WebGL and Chromium has no H.264 for the MP4 fallback) prints
layout, mode, handoff state, pin offset and the scroll-derived era at each
stop; `node scripts/probe-datum-motion.mjs` walks the entry and exit ramps
per actor. Measured: `handoff: "ready"` with all three targets, pin offset 0,
±21px spread at entry collapsing to **translateX exactly 0 at rest**, and
every actor off a 1440 viewport by `exit` 1.

## Update 20 — the reel turns, the block drops, the empty seats speak (2026-08-31, owner)

Three notes on the shipped datum composition, read live.

**1. The block hangs from the HUD rail's top line.** _"Scope, facts, all these
things, and intelligent architect are so high, hugging the top part… they
should be horizontally aligned with the top of the left and right reel."_ The
kicker measured **33px** at 1440×900 — above the HUD frame's own content zone
entirely. It sits on `--hud-rail-y-start` now: measured live, the rail's top and
the kicker both land at **y=104** at 1440×900, **y=89** at 1280×720.

⚠ **THIS AMENDS A RECORDED LAW.** The rules said the identity sits on
`--station-title-top`, _"never a third close number"_. This stage takes the
FRAME's datum instead because it is a full-bleed instrument seated inside the
frame rather than a station header; every other station is unmoved. A second
datum with a stated scope, not a third close number.

⚠ **`--hud-rail-y-start` IS A VIEWPORT Y AND THE SHEET'S PADDING IS
SECTION-RELATIVE.** They coincide on exactly one path — `#voidwalker` zeroes its
own `padding-block` and pins `top: 0` only under `[data-vw-mode="hologram"]`.
Ungated, the rule overshoots by **~119px** on desktop-PRM, the corridor fallback
and 701–1100px, where the station still carries `clamp(72px, 11svh, 132px)` of
its own: the rungs it was meant to fix are the rungs it would break.

⚠ **AND IT IS AFFORDABLE ONLY ABOVE `min-height: 720px`.** The capable gate is
width-only, so a half-height window on a wide monitor enters hologram mode at
599px tall, where the datum's 89px comes straight out of the two body rows —
measured at 1752×599, SCOPE overflowed by **101px**. The rung is the shortest
reference viewport, so every shape the composition is authored against keeps the
datum and anything shorter keeps the compact padding it had.

⚠ **THE COST IS REAL AND IT LANDS ON THE PANELS.** The figure column narrows
~13 % (1440×900: 358 → 311) and the body rows lose 32–53px — and `.vwd__body` is
`overflow: hidden`, so that clips **silently**. At 1280×720 FACTS went **14px**
past its seat on all five eras, uniformly, which is what identifies it as
structural rather than content. Paid back out of band padding, the facts' own
gap and row padding, and body padding-bottom — **chrome first, rhythm second,
never the type**. Measured headroom after: **15px at 1280×720**, 178px at the
owner's 1920×1247.

⚠ **THE LAB RE-DECLARES BOTH GATES BY HAND.** A rule the lab's selector cannot
reach is a composition the lab cannot show: gated and declared nowhere else,
`/test/voidwalker-datum-lab` hung the block ~82px higher than the landing with a
figure column ~15px wider — a window that lies about the thing it looks onto,
with nothing to throw. Re-declared, the lab measures 103.95px against
production's 104 and the figure columns differ by exactly 31px, which is the
knob bar's 56 × 0.5625. `--vwd-bar-h` is the only difference again.

**2. The era band is a reel.** _"It should feel more like a carousel rolodex, so
the current view you're on should be in the middle… it should rotate, and then
the one you've selected should always be in the middle."_

⚠ **A FULL-WIDTH TRACK CANNOT ROLL.** Five cells come to ~550px against a
1440px band, so centring the active chip only shoves the whole group sideways —
220px at era 0, with dead band beside it. That is this sheet's own recorded
finding (_"five things that happen to share a row"_) arriving from the other
direction, and widening the pitch until it overflows reproduces it. The
resolution is a **bounded window at a tight pitch**: a small instrument under
the figure with the reel turning behind it.

⚠ **THE OFFSET IS `(n/2 - i - 0.5) × cell`, EXACTLY 0 AT THE MIDDLE ERA** —
verified live, `matrix(1, 0, 0, 1, 0, 0)` at `azeroth` — so the reel is
byte-identical to the row it replaced there. That is how the change proves
itself additive rather than a re-composition. Measured at eras 0 / 2 / 4:
`220 / 0 / -220`, its derivation exactly.

⚠ **THE DIVIDER WAS A DUPLICATE HAIRLINE, NOT A CHOICE.** `.vwd__ground` is a
0px track at the stage's bottom edge and the band's `border-top` sat on that
same Y over the full border box: ~0.36 alpha between the HUD margins against 0.2
outside — a foot rule brighter in the middle, running straight through the HUD
rails, which is what the rails' own inset exists to prevent.

Three traps, all measured: **`overflow: clip`, never `hidden`** (`hidden` is a
scroll container, so `.focus()` on a chip the window has not reached sets
`scrollLeft` and leaves the reel offset underneath its own transform); **no
`gap` on the track at any rung** (cells sit `cell + gap` apart while the offset
steps by `cell`, so the selected chip drifts off centre by `i × gap`, silently,
phone-only); and **the chips keep their own width** (`justify-self: center` — a
grid item defaults to `stretch`, and abutting targets mean a click one pixel off
pins the scroll to the wrong era, which is a navigation error). The distance
falloff lives on the chip's CHILDREN, because `.vwd__chip`'s opacity and
transform belong to §G's entry ladder.

**3. An absent seat is said, not drawn.** _"Architect doesn't have a video, so
transmission is empty. Same for on records, and that feels weird if there's
nothing there."_ The dashed 16:9 ghost frame is deleted — it was the empty-slot
idiom itself — and ON RECORD gained the line it never had: it rendered a heading
over literally **no text nodes**, which is why the era probe reported
`panels=3` on `loop` where every other era reports 4. Both heads print `None`
in their tag, which also disambiguates TRANSMISSION, where "no film" and
`genai`'s "film with no authored duration" both printed nothing. ⚠ **Not a
diamond**: the filled gold diamond means "you are here" on the reel one row
below, so the same glyph as an absence marker inverts its own meaning on one
screen.

**The probe was broken, and it is the gate.** `probe-voidwalker-eras.mjs` read
`data-vw-mode` off `.vw` when it is written on `#voidwalker`, so its readiness
check returned null forever and it always ran its full 40 wheel notches —
overshooting into the part of the runway where `--vwh-in` is 0 and every chip is
at `opacity: 0`. Playwright reports that as _"`<div class='vw vw--hologram'>`
intercepts pointer events"_, which reads like a z-index fault. It walks to a
measured runway fraction now, and **drives the reel with the keyboard**, because
two of the five chips are always outside the clip window and an `overflow: clip`
box is not scrollable. It also reports `foot` headroom per panel — ⚠
`clientHeight - scrollHeight` cannot be that number, since on an
`overflow: hidden` box `scrollHeight` is `max(clientHeight, content)` and is
exactly 0 whenever the content fits.

⚠ **STILL OPEN: 1752×599 clips, and it did before this pass** — Scope +64px /
Facts +43px now against a measured baseline of +69 / +58 plus a collision.
Short-and-wide is improved, not fixed.

**Verifying:** `node scripts/probe-voidwalker-eras.mjs --vp 1280x720` (and
1101×800 / 1440×900 / 1920×1247 — all clean); `node
scripts/probe-datum-motion.mjs` (translateX exactly 0 at rest for every actor,
the reel's own `220 / 0 / -220` recorded as the one deliberate exception);
`node scripts/probe-about-seam.mjs` (transparent across all four samples).
Pre-existing failures unchanged: `about-voidwalker-handoff:240`
(`name/title width: 480 vs 407` — `left`, `top` and `height` all pass, so the
datum move did not disturb the landing) and
`about-voidwalker-handoff-boundaries:373` (floor isolation, correct on the
alpha branch).

## Update 21 — the rails come out, and the heads find their own left edge (2026-08-31, owner)

Two notes on U20's stage, read live.

**1. The long horizontal lines go.** _"There are these long horizontal lines …
remove those."_ Three of them, measured at 1752 wide: the upper rail at y=226,
the lower at y=699, the ground datum at y=1142 — each **1653px**, running the
full plate from x=46 to x=1700.

⚠ **THEY WERE THE COMPOSITION'S OWN ARGUMENT, SO THIS IS A REVERSAL RATHER
THAN A TIDY-UP.** U19 chose the rails precisely to replace wave 1's leader
lines, whose defect the owner had named himself: a line landing on a shoulder
_"implies scope is linked to my shoulder, and that's not really the case"_. The
replacement was to tie the panels by SHARED STRUCTURE instead. **That reasoning
still stands — what it never settled is whether the tie has to be DRAWN.** Each
head keeps its own rule (`.vwd__head`'s border-bottom at .3, against the rails'
.12), the four heads still share two grid rows, and alignment carries the
connection with no ink at all. The leader lines stay deleted; only their
replacement went.

⚠ **THE HEADS AND BODIES STAY SEPARATE GRID ITEMS.** The rails they were split
for are gone, but the split is what puts both columns' heads on ONE row
whatever their content does; merged, each panel's rule would land wherever its
own box did and the four would stop agreeing.

⚠ **IF A RAIL EVER RETURNS IT MAY NOT BE FULL-BLEED.** The deleted
`margin-inline: calc(var(--hud-margin) - var(--vwd-pad-x))` existed because a
line run to the viewport edge crosses the HUD rails' own tick ladder — two line
systems meeting at a shallow angle, which reads as noise rather than as
construction.

Knock-ons, all taken in the same commit: the stage's fifth zero-height row
(which held only the ground) is gone, and `.vwd__figure` stays `grid-row: 1 / 5`
because four rows still have five lines; both small-screen rungs stop hiding
elements that no longer exist; §G drops both actors from the opacity ladder,
the exit transform and the stagger — ⚠ **the 0.12 `--ci-off` rung is left EMPTY
rather than reassigned**, because pulling the panels forward to close the gap
would re-time a choreography nobody asked to change. `--vwd-rail` survives as
the surface's quietest hairline alpha, its one remaining consumer being the
phone tab row's borders; the lab's RAIL knob went with the rails.

**2. The panel heads were 69px inboard of their own prose.** _"Make sure that
the titles (eg transmission, scope etc) are aligned to the left so consistent
with the rest."_

⚠ **ONE LINE OF CSS WAS PRODUCING TWO DIFFERENT BOXES, AND `ch` IS WHY.**
`width: min(100%, 38ch)` was declared once for the heads and their bodies —
but **`ch` resolves against the element's OWN font**. The head is PT Mono at
13px, so 38ch is **296px**; the body inherited 16px, so 38ch is **365px**. Both
are `justify-self: end` in the left column, so the narrower head was pushed
right and its left edge sat 69px inboard of the paragraph underneath it. Not a
tuning problem: the two numbers are computed from different fonts, so no value
makes them agree.

`--vwd-measure: min(100%, 23rem)` replaces it — `rem` is the root's size and is
the same on every element. Measured after: head and body are byte-identical at
**368px**, in both columns, at 233→601 and 1145→1513.

⚠ **AND THE BODY WAS INHERITING THE WRONG FACE — ADR-067's RECORDED TRAP, ONE
SURFACE OVER.** `.vwd__body` declared no `font-family`, so it resolved
`--font-mono`, which is **IBM Plex Mono, not this surface's PT Mono**. Nothing
rendered wrong, because every child declares its own face — but the container's
font was doing the `ch` arithmetic, which is half of why the heads misaligned.
It declares `--vwd-display` now, so anything added there later inherits the
reading face. **A font that letters nothing can still be load-bearing.**

**Verifying:** `probe-voidwalker-eras.mjs` clean at 1280×720 and 1920×1247
(headroom unchanged at 15px / 178px, so the removal costs the seats nothing);
`probe-datum-motion.mjs` — translateX exactly 0 at rest for every remaining
actor, entry spread ±21 collapsing to 0, everything past the viewport by
`exit` 1; a live sweep of `#voidwalker` for any element wider than 700px
painting a border or ground returns **zero** — ⚠ that sweep was a MANUAL
check when this shipped; since 2026-09-01 it is a committed test ("no element
wider than 700px paints a border or ground in #voidwalker" in
`about-voidwalker-handoff-boundaries.spec.ts`, asserting PAINT on the active
branch so the Safari-fallback `.vwh__ground` cannot red it). The two
"pre-existing failures" this update carried are FIXED the same day: the
boundaries floor test branches on `data-holo-alpha` (it was asserting the
fallback contract against the alpha branch), and the handoff flight asserts
left/top only (width 480 vs 407 and height 56 vs 42 are the two elements'
own boxes — content-sized string vs fixed measure, by U11's ruling); the
ambient-hold case passes.

## Update 22 — the mast rises off the bracket's foot (2026-09-17, owner)

_"In the Era section, do you think we need to place the title (ie The Azeroth
Teacher etc) a bit higher? … take a look at our era so the elements have more
breathing room."_ The reference he named is the Linear-inspired head datum this
house shipped on the proposal pages (ADR-099 U2).

**U20 IS NARROWED, NOT REVERSED, AND THE FINDING IS WHICH GLYPH IT SEATED.**
U20 put the block on `--hud-rail-y-start` after the owner said SCOPE, FACTS and
the rest were _"so high, hugging the top part"_ — but the glyph that landed on
that line is the **KICKER**. The four panel heads he was actually talking about
have never been on it: they sit at the mast's foot, ~67px below (measured
201.9 against the kicker's 131 at 1920×1247). So the block's ONE lead can be
split in two, and the title can rise without a single head moving.

`--vwd-pad-top` stays the TOTAL lead and every consumer keeps reading it;
`--vwd-mast-top` is new and is what `.vwd__sheet` pads by; `.vwd__mast` carries
the remainder as a bottom margin. ⚠ **THE SPLIT IS CONSERVATIVE BY
CONSTRUCTION** — the total does not change, so `--vwd-chrome-h` and
`--vwd-fig-w` are byte-identical and the figure column does not move (measured
460px, at its clamp cap, before and after).

**THE DATUM IT MOVES TO IS ALREADY A DRAWN LINE.** `--hud-rail-y-start` is the
TL bracket's foot **plus `clamp(16px, 1.8vw, 32px)`**, and `landing.css` records
what that term is for: _"the rail never touches the corner chrome or the
wordmark"_. It is clearance for a **DRAWN LINE**, and type does not need it.
`--hud-corner-foot` and `--hud-rail-y-clear` are tokens now, which also makes
true a claim the rail's own comment already made — _"both ends are TOKENS so no
mirror can drift"_ — where the sum had in fact been spelled out twice, once in
`--hud-rail-y-start` and once inside `--hud-rail-y-end`'s `max()`. Every
computed value is unchanged.

Measured title rise: **23.0px at 1280×720 · 19.8 at 1101×800 · 25.9 at
1440×900 · 32.0 at 1920×1247** (kicker 131 → 99 at the owner's shape).

**AND THE SECOND HALF IS THE POOLED FLOOR.** `.vwd__stage`'s rows are
`auto minmax(0,1fr) auto minmax(0,1fr)` and `.vwd__body` is `overflow: hidden`
with its content top-anchored, so surplus falls to the floor of a box with no
floor to show — 177px under every panel at 1920×1247 against 14px at 1280×720.
ADR-070 U14's law and ADR-099 U2's own measurement, on a third surface.
`--vwd-trail` moves a bounded share of it to between the title and the heads,
the one place on this composition where air reads as composition rather than as
a hole. Measured after: the title-to-head gap goes **48.4 → 136.4px** and the
per-panel foot **177 → 149**.

⚠ **56 IS DERIVED, NOT CHOSEN.** At 1920×1247 the figure's own derivation yields
`(1247 − 369) × 0.5625 = 494` against the clamp's **460px cap** — 34px of dead
headroom, i.e. `34 / 0.5625 = 60px` of height that can be spent before the
column narrows by one pixel. 56 is that budget with slack; **re-derive it rather
than keeping the number if the cap moves.** `clamp(0px, calc(100svh - 1100px),
56px)` holds it at exactly **0 at 1280×720, 1101×800 and 1440×900** — every
tight rung is byte-identical (foot 14 / 51 / 69 before and after), and there was
no slack at those rungs to spend.

⚠ **THE TRAIL RIDES THE MAST'S MARGIN, NEVER `.vwd__stage`'s `padding-top`.**
The phone rung declares that as a LONGHAND which beats a shorthand _"today by
luck rather than by intent"_ — its own comment — and a fourth term in that
specificity race is how this breaks later. A margin on row 1 of the sheet's
three-row grid moves the stage down by exactly the trail and shrinks its content
box by exactly the trail.

⚠ **`--vwd-mast-top`'s BASE MUST READ `--vwd-pad-top-min`, NEVER
`--vwd-pad-top`.** Custom properties substitute at computed-value time on the
same element, so a base declaration reading the total would silently follow the
gated override and the split would evaporate with nothing to throw.

⚠ **`--vwd-chrome-h` GAINS THE TRAIL AND ONLY THE TRAIL.** The split conserves
the total and adds nothing; the trail is genuinely new height above the stage,
and the block's own comment forbids folding a new term into the tuned
`104 + 44` surplus — so it is added as its own difference, exactly as
`--vwd-pad-top` was.

**THE HANDOFF NEEDED NO LOCKSTEP, AND THAT WAS VERIFIED RATHER THAN ASSUMED.**
`useVoidwalkerHologramScroll` resolves the era title through `futurePinnedRect()`,
which walks the real `offsetParent` chain; `aboutVoidwalkerHandoff` is
position-only; and the spec recomputes the target with its own copy of that
walk. No literal anywhere. ⚠ One caveat for a future pass: the targets republish
on a `ResizeObserver` that a pure POSITION change does not fire — safe here
because this is static CSS resolved before first measurement, but a
runtime-varying lead would need an explicit republish.
⚠ `.vwd__mast__title`'s `clamp(26px, 3vw, 44px)` is untouched — byte-locked to
`.voidwalker__name`, which translates into it without scaling (U6 §1).

**THE LAB RE-DECLARES ALL THREE**, for U20's own reason one term further in: a
lab that re-declared only the total would hang its mast ~26px lower than the
landing and show none of the new air. Move one rung, move the other.

⚠ **STILL OPEN, UNCHANGED: 1752×599 clips** (Scope +64 / Facts +43). It is below
the `min-height: 720px` gate, keeps the compact padding, and this pass neither
helps nor harms it. And at 1280×720 nothing improves but the title's seat —
the trail is 0 there by construction and the foot stays at 14px.

**Verifying:** `node scripts/probe-voidwalker-eras.mjs --vp 1280x720`
(and 1101×800 / 1440×900 / 1920×1247 — all clean, foot 14 / 51 / 69 / 149);
`node scripts/probe-datum-motion.mjs` (translateX exactly 0 at rest for every
actor, the reel's `220 / 0 / -220` the one recorded exception);
`node scripts/probe-about-seam.mjs` (transparent across all four samples);
`npx playwright test tests/visual/about-voidwalker-handoff.spec.ts` (3 passed).
⚠ Any `foot` movement at the three tight rungs means the lead was not
conserved — that is the assertion this split lives or dies on.

---

## Update 23 — the stage is redrawn on the reference's grammar, and Safari gets real alpha (2026-09-17, owner)

**Status: Accepted.** The owner's read, with three Starfield character/status
screens attached: the elements "can be much better positioned or designed", and
what he wants from the reference is "the lines, the cleanliness, and the
spacing". Plus three asks that arrived with it — the eyebrow is costing the
title its breathing room, the phone must have no scrollbars, and the phone's
era panel should go so the stops sit on the avatar itself.

### What the reference actually does

Four things, and none of them is a box: a mono header on a short rule **at the
panel's own width**; values set **label left, value right, on a thin rule**; one
**thin circle** around the figure with small marks on the diagonals; and air.
Its one filled object is an inverse-video active row — which is the single thing
this pass does NOT take, for a reason recorded under §6.

### 1 · The eyebrow is deleted, and the year moves to SCOPE's rule

`ERA / 04 OF 05` and the year were a flex row above the title. Between them they
cost **20.2px** that the title now takes back, and **both were already on
screen**: the reel prints every era's year on its own stop and marks the open
one with a lit diamond. The pair was this surface's own said-twice defect at its
loudest point.

The year survives on **SCOPE's head rule, right-aligned** — the head already had
the tag slot and the `space-between` that seats it, so this is zero new grid
items and zero new ladder rungs, and a value on a short rule at the panel's own
width is the reference's grammar verbatim. It letters at the head's full size,
not the tag's `0.85em`: the register's other tags are secondary readouts ABOUT
the panel and a date is the record's own value.

⚠ **THE YEAR LEAVES THE DECODE, AND THAT IS ARITHMETIC.** SCOPE's head is a §G
actor at `--ci-off: 0.16`, whose ramp saturates around `--vwh-in` 0.655, while
`TITLE_DECODE_WINDOW` closes at **0.18** — a scramble seated there would resolve
while the element is still transparent and then fade up already finished. The
kernel's `finals` drops to one entry and `HoloEraIdentityRefs` to `{ title }`.
⚠ `eraPositionLabel` **stays exported** — `/test/hud-panel-lab`'s era surface
letters it in its own corner labels.

### 2 · The facts become readout rows, on a two-weight dawn ladder

`.vwd__facts__row` is `minmax(0, auto) minmax(0, 1fr)` on one baseline with a
rule under **every** row (the `:last-child` exception is deleted — in the
reference every row terminates on a line and the list's own bottom edge closes
the panel). The press stack takes the same grammar, its rule at each item's
**foot**: a rule between an outlet and its own headline splits the record it is
meant to bound.

⚠ `minmax(0, 1fr)` ON THE VALUE IS LOAD-BEARING. `expanse`'s longest value is 36
characters; on an `auto auto` grid it pushes the label out of the panel instead
of wrapping in its own column.

New `--vwd-rule-head` (.3) divides a REGION; `--vwd-rail` (.12) rules within
one. Both dawn — gold here is the lit mark, and a gold structure line competes
with it (the casefile learned this one surface over, ADR-089).

**It gives the panel ~50px back**, which is why FACTS stops being the tightest
seat: the probe's `tightest` changes hands to Scope at every rung.

### 3 · A reticle rings the figure

Two rings (r 96 at dawn .22, r 92.5 at .10 — a doubled edge, not two rings with
a gap) and four marks on the **diagonals**, where the four panel heads' own
alignment does not already point. Dawn only. `vector-effect: non-scaling-stroke`,
or a 1-unit stroke paints 0.8px at the column's floor and 2.4px at its cap — a
different weight per viewport.

⚠ **IT IS SIZED OFF `--vwd-fig-w`, WHICH IS WHAT KEEPS IT LAWFUL.** That token
is `clamp(230px, …, 460px)`, so the box can never exceed **487.6px** and the
committed >700px paint sweep is satisfied by ARITHMETIC rather than by tuning.
Measured: 243.8 / 280.9 / 330.1 / 487.6 at the four rungs.

⚠ **BOTH DIALS ARE MEASURED, AND THE FIRST CUT PROVES WHY.** The figure is
`object-fit: contain`, bottom-anchored in a slot that stops above the projector
base, so where it PAINTS is neither the box's middle nor a base-height
subtraction: measured, its centre is at **52.2 / 51.1 / 49.7 %** of the figure
box. The first cut solved it by arithmetic (`44% − base/2`), landed the ring's
centre at ~40 %, and rang him from the head to the knees. **Only a still showed
it.** And 1.14 is the column's own ceiling — the ring may reach into the stage's
column gap and may never touch a panel, so the widest lawful ring is
`fig-w + 2 × gap` (291 / 381 / 552px) and this leaves ~28px of air at every rung.

⚠ **IT RINGS HIM RATHER THAN CONTAINING HIM, AND THAT IS THE ONE PLACE THIS
COMPOSITION CANNOT FOLLOW THE REFERENCE.** Starfield gives its circle an empty
half-screen; this figure has a reading column 30px away on either side.

Three traps, all recorded in the sheet: `.vwd__figure` needs `position: relative`
**declared** (§G's exit transform would give it one for free, but §G is inside
`prefers-reduced-motion: no-preference`, so under PRM the ring would resolve
against `.vwd__stage`); the offset is the **`translate` property**, never
`transform`, which §G writes; and the ring joins the entry ladder at `--ci-off:
0.15`, one rung before the projector base.

### 4 · The chips become text stops, on both breakpoints

Year over name over the mark. The framed 64px bust is deleted — against a
reference whose stops are line work alone, that frame was the heaviest object on
the band, competing with the figure it selects. It also drops **five lazily
fetched era posters**: the reel no longer paints an image at all.

⚠ **THE 52px THE BAND GAVE UP IS CHARGED BACK, NOT SPENT ON THE FIGURE.**
Letting it flow into `--vwd-fig-w` widens the column at 1280×720 — where the
panel measure is COLUMN-bound at 365px, not capped — taking 7.7px of reading
measure off each side to buy 15px of figure. So `--vwd-reel-return` returns it
and **`band-h + reel-return + trail` is identically U22's `116px + clamp(...)`**.
Measured after: `--vwd-chrome-h` **335.781 / 328.938 / 346.344 / 425** and
`--vwd-fig-w` **230 / 264.969 / 311.422 / 460** — byte-identical to what shipped,
on both gate branches. The air goes above the heads instead, as
`--vwd-trail-air: 28px`.

⚠ `--vwd-chip` survives as the reel's **pitch dial alone** — no box is 64px any
more — so `--vwd-cell`, the reel's hit-test slack and the probe's pitch
assertion are unchanged. The lab's BUST knob is deleted with its token and
replaced by the ring's centre, which is the one value in that drawing solved by
looking.

### 5 · The phone fits rather than scrolls, and the stops ride the figure

`.vwd__stage` goes to **`overflow: clip`** (never `hidden` — that is a scroll
container, and a `.focus()` below the fold would leave the box quietly offset).
ADR-083's inner scroll that "releases to the page at its bounds" is
**superseded for this station**: `.vwd` is a 100svh instrument that
`#voidwalker` is exempt from the mobile padding floor FOR, and a phone flick
passes the whole station, so "scrolls the page" means "scrolls the reading
away". ADR-083 stays authoritative for the proof casefile.

Four trims pay for it, in the recorded order — chrome first, rhythm second,
never the type: one-line facts on the phone (−52px), the body's own
`padding-bottom` (−20, the stops' clearance owns the foot now), the head→body
gap (−8), and **`.vwd__film__frame { max-height: none }` deleted**, which was
the largest avoidable term in the binding tab (190px → 96 on a short screen).

The era stops leave the band and ride the figure's foot as plain buttons —
**the same `nav.vwd__band` node, moved by CSS**, so the tablist, the roving
focus, the testid and §G's entry actor all survive with no markup change.
⚠ **THIS REVERSES HALF OF U19** ("the selector must read as character-select on
BOTH breakpoints"), by owner ruling. Desktop keeps its band. `isolation:
isolate` on the band, or `.vwh__cone`'s `plus-lighter` reaches up and lights
the stops' ink.

⚠ **THE STOPS CARRY A HALO, NOT A PANEL.** Measured, their bed runs from
luminance **8 to 191** — some sit over void, some over the lit figure's boots,
and it changes with the era and with every frame of the idle. Dawn at .45 was
legible on one half and absent on the other, which is this house's own "a label
nobody can read is not a quiet label, it is a missing one". A scrim opaque
enough to tame 191 would be the panel this pass just deleted, so the answer is
a text halo in `--void-rgb` — which flips with the theme for free — plus a
lifted dormant ink.

### 6 · What the reference has that this does not take

**The inverse-video active row.** ADR-089 U4 ruled exactly that for the
casefile's station rail, and its own reason is why it does not cross to here: a
fill reads as selection when it is **fill among outlines**, and these stops have
no boxes at all. Filled, the selected chip would be the one painted ground on a
station whose committed guard exists to keep grounds off it. Gold ink plus the
gold diamond; the band stays line work.

### 7 · Safari gets real alpha, and a recorded premise was stale

`.claude/rules/voidwalker.md` and `voidwalker-hologram.css` both asserted that
"Safari has no self-hostable alpha codec here (HEVC-alpha needs macOS
videotoolbox)". **It needs macOS videotoolbox and this is macOS**: ffmpeg 8.1.2
here carries `hevc_videotoolbox` with `-alpha_quality`. So `videoAlphaHevcPath`
is a new OPTIONAL field — HEVC-with-alpha in a QuickTime `.mov`, `hvc1`-tagged —
and `holoAlphaSupport` grows a second lane.

⚠ **THE RULING THE PREMISE WAS ATTACHED TO IS NOT STALE: the floor rules stay.**
They are what an engine with neither codec still gets, and what any era with no
`.mov` still gets on Safari.

**Encode facts, all measured here:**

- ⚠ `-pix_fmt bgra`. **`yuva420p` is not a pixel format that encoder accepts** —
  asking for it silently auto-selects `ayuv`.
- ⚠ `-alpha_quality` **defaults to 0**, which destroys the channel outright, and
  it is the **dominant size term**: 0.2 → 580 KB, 0.5 → 1.1 MB, 0.75 → 2.8 MB,
  0.9 → 5.8 MB. Neither `-q:v` nor `-b:v` moves the file meaningfully.
- ⚠ `-tag:v hvc1` and the `.mov` container are both Safari requirements.
- ⚠ **`ffprobe` cannot verify alpha** — it reports the base layer's `yuv420p`.
  Read it back with `alphaextract`.

**The canonical pair ships one** at `alpha_quality 0.5`: **1,175,468 bytes**,
smaller than both its WebM (1.86 MB) and its MP4 (1.14 MB), at **0.828/255 mean
alpha error over all 193 frames**. That one file puts **four of the five eras**
on real alpha in Safari, since they all resolve to it.

⚠ **AZEROTH SHIPS NONE, BY MEASUREMENT.** Its matte carries a plume and three
companions, and the error **plateaus at ~2.6–2.9/255 at every quality setting**
while the file runs 4 MB → 12 MB. It misses the ≤1/255 standard at every size,
so it keeps the floor — which is exactly what it had. Left open.

⚠ **THE BRANCH IS PER-ERA, NOT PER-ENGINE, AND THIS IS THE TRAP.** The codec
verdict says what the ENGINE can composite; whether THIS era has a file in that
format is a different question. On Safari, azeroth's engine answers "hevc" and
its record answers "nothing" — and if the attribute still claimed alpha, the CSS
would switch the floor off over the opaque MP4 and paint the pane this branch
exists to remove. An era with no source for the locked codec falls all the way
back to the floor.

⚠ **THE HEVC PROBE IS CHAINED BEHIND THE VP9 ONE, NEVER RACED.** Where VP9 alpha
works the second probe never runs, so Chromium and Firefox pay no extra request
and no extra decode, and a tie can never resolve in favour of the larger, newer,
less-guarded source. ⚠ And it is a **static asset, not a data URI**: an HEVC
`.mov`'s parameter sets make it several KB of base64 where the VP9 probe is 581
bytes, and Safari's `data:` media handling is itself the failure mode that would
settle `false` and silently change nothing. `canPlayType` is the same trap one
codec over — `video/quicktime; codecs="hvc1"` answers **"probably" in WebKit
whether or not the alpha is honoured** (measured).

**Verified in a real WebKit**, which is the thing no CI project can do (every
Playwright project here is Chromium since ADR-107 U1): the chained module
returns `{ vp9: false, hevc: true }` in WebKit and `{ vp9: true, hevc: false }`
in Chromium, and the shipping `.mov` samples alpha 0 on its ground and 255 on
the figure.

⚠ **AND A SERVER WITHOUT BYTE-RANGE SUPPORT LOOKS EXACTLY LIKE AN UNSUPPORTED
CODEC.** The first WebKit run reported `MEDIA_ERR_SRC_NOT_SUPPORTED` /
`NETWORK_NO_SOURCE` on a file it decodes perfectly from a data URI — WebKit
requires `Range` support for media, and the toy server answering 200 was the
whole fault. Next's static serving has it; a probe harness may not.

### Measured

|                            | 1280×720 | 1101×800 | 1440×900 | 1920×1247 |
| -------------------------- | -------- | -------- | -------- | --------- |
| `foot` before (U22)        | 14       | 51       | 69       | —         |
| `foot` after, tightest era | **78**   | **75**   | **111**  | **184**   |
| `--vwd-fig-w`              | 230      | 264.969  | 311.422  | 460       |
| reticle box                | 243.8    | 280.9    | 330.1    | 487.6     |

Phone: every era × every tab × 390×844, 430×932, 375×667 and the two synthetic
short shapes (375×553, 390×745) fits with no scroll in any box and no ink cut.

⚠ **1752×599 IS IMPROVED, NOT SOLVED.** It was Scope +64 / Facts +43 on every
era; it is now one era (`pokemon-go`) overflowing Scope by 28px, with the other
four clean. Still open, as it was.

### Guards

- **`scripts/probe-voidwalker-phone.mjs`** is new. ⚠ It seats **`.vwd`, not
  `#voidwalker`** — the station keeps 76px of its own padding on this rung, and
  every rect compared against FIXED chrome is scroll-dependent, so measuring at
  a position the reader never rests at reports collisions that are not there.
  ⚠ Its first cut asked **two wrong questions and both are recorded in it**:
  `scrollWidth` reported a 31px horizontal overflow at every cell, which is
  `.gateway` and `.hud` (fixed, 100vw + gutter) and **not a scrollbar** —
  `scrollTo(200, y)` leaves `scrollX` at 0; and `scrollHeight − clientHeight`
  counted **192px of decorative projector bloom** hanging past the stage under
  the figure's own feet. It asks whether anything SCROLLS and whether INK is
  cut, now.
- `mastKicker` leaves `about-voidwalker-handoff.spec.ts` — `actor()` throws on a
  missing selector and no assertion ever read it.
- The boundaries spec's floor case snapshots the attribute's VALUE and names,
  in the file, that **no CI project reaches the `hevc` lane**.
- `character-era-hologram.test.ts` gains the `.mov`-only guard, the optionality
  case and the azeroth-has-none case. ⚠ The canonical `toEqual` pin is
  exhaustive and failed first when the field landed — which is the pin working.
- The type ratchet drops **13 → 1** on `voidwalker-datum.css`.

---

## Update 24 — the Latent Land era gets its own figure (2026-09-18, owner)

**Status: Accepted for `genai`. `expanse` is blocked and the block is the
finding.** The owner supplied the generation keys and asked for the visuals.

The chain is rebuilt in-repo at `scripts/voidwalker-avatar/` — the offline skill
that holds the original is on his Windows machine, and what survived here is the
RECORD (U1, U12, U13, U14 and the holo gallery's manifest). The wave layout
matches so a later sync merges rather than renames. Nano Banana Pro for the
still, Veo 3.1 for the idle, a `geq` luma key, five deliveries at 720×1280.

### What shipped

`genai` — the Starhaven captain, from the owner's own reference painting with
his identity locked from the 2025 shoot. Wave `20260918-genai-v3`, delivered as
`holo-idle-genai-v2.{mp4,webm,mov}` + `holo-still-genai-v2.{jpg,webp}`,
`headY 0.0563 / footY 0.993`. It ships the Safari lane too, unlike azeroth: one
figure with a clean silhouette meets the fidelity standard where a plume and
three companions do not.

⚠ **THE LOADOUT NOW NAMES WHAT THE PLATE SHOWS** (U13's rule). It read
"Blazer · shirt · Latent Land cape · cap" — the UNIFORM's loadout, carried over
before the era had a figure. The captain wears none of it.

### ⚠ The gate that matters is SILHOUETTE FRAGMENTATION, and two wrong metrics found it

The first pick shipped for an hour and **dripped**: vertical strips down the
robe with the corridor showing between them. Three things it was NOT, each ruled
out by measurement rather than by argument — the model (the raw Veo frames are
clean), the encoder (pre- and post-VP9 frames are identical), and the LUT (every
gain from 5 to 20 reproduces it). The cause is in the DRAW: the robe was lit
only along its fold highlights, so the cloth between them sat at the ground's own
black level and the key cut the outline into bands.

⚠ **AND THE FIRST METRIC RANKED THE SHIPPED ASSETS WORSE THAN THE BROKEN DRAW.**
"How much of the hem is at ground level" reads Architect **0.530**, azeroth
**0.528** and the dripping draw **0.681** — while both shipped assets read
perfectly solid on the page. The measure was answering the wrong question: what
matters is not how much dark cloth there is but whether it reaches the
SILHOUETTE EDGE. The Architect's suit keeps its darks INTERIOR, ringed by lit
edges, so its alpha stays one piece.

The live gate is opaque RUNS per hem row — a skirt is one, trousers are two:

|                                                 | runs/row |
| ----------------------------------------------- | -------- |
| Architect, shipped                              | 1.93     |
| azeroth, shipped (a plume and three companions) | 4.15     |
| the draw that dripped                           | 7.87     |
| **the draw that ships**                         | **1.90** |

⚠ **STRENGTHENING THE PROMPT'S LIGHTING CLAUSE WAS NOT ENOUGH.** A second wave
of five draws, with the clause naming the hem explicitly, scored 7.29–8.98 —
every one of them still fragmenting. What passed was the one draw from the FIRST
wave that happened to be lit throughout. The clause is kept because it is true;
the GATE is what catches the failure.

### The LUT is derived, and the derivation is calibrated against what ships

`off = corner_max + 6`, `gain = 255 / (p10(lit) − off)`. On their own footage
that reproduces the thoughtform pair's recorded `clip((val-8)*12)` **exactly**
and lands azeroth within a step — which is the check that it is a derivation
rather than a fit. ⚠ **The ground is sampled at the CORNERS, not at a border
ring**: the robe's hem reaches the bottom edge, and a 20px ring read
`ground_max` 236 and produced `clip((val-242)*255)`, a key that wipes the figure.

### A trim alone does not close a very still idle

U14's calibration closed a loop whose seam fell to 0.38× its motion baseline —
but that clip MOVED (motion ~15/255). A breathing figure runs at **1.2**, and
its best return point still sat **3.5** out, three ordinary frame-steps of jump.
The tail is blended into the head over 16 frames and the join is measured on the
frames that ship: seam **0.88** against a **1.59** motion floor. ⚠ This is not
Veo's first=last trick, which stays refused — that asks the MODEL to land the
ending and it drifts anyway; this is an overlap-add on frames it already drew.

⚠ **AND THE FIGURE IS SEATED, NEVER CROPPED.** The site seats the media
bottom-centred in a slot whose floor IS the projector disc, so a figure ending at
0.945 of its own canvas hovers 5.5 % of the slot above the disc it stands on.
The frame is SHIFTED; cropping would change the delivered aspect and every
anchor read against it.

### `expanse` shipped the same day, once the owner supplied the photographs

⚠ **THE DRIVE FOLDERS ARE GENUINELY EMPTY, NOT UN-SYNCED.**
`13_Voidwalker Pictures/The Expanse Set Visit/` and `MCRN/Exports/` enumerate
zero children while **all 38 of their sibling folders list their contents
normally** — so there was nothing to "make available offline" and nothing to
move. The owner attached the set photographs directly instead.

The wardrobe clause is written off THOSE PHOTOGRAPHS rather than off the show:
the production's MCRN marine plate over his own clothes, a black kilt panel at
the waist, his cap still on. ⚠ **TWO WARDROBE REFERENCES, NOT ONE** — a solo
full-body frame for the silhouette and a lit group frame where the plate's
panels actually read; `generate.py` takes N wardrobe images now and the identity
still goes first.

⚠ **AND THE CAP IS THE IDENTITY'S, NOT THE SET'S.** He wore a plain dark cap on
the day; the figure wears the Thoughtform one he is locked from — the same cap
the Architect wears eight years later. That is the UNIFORM reading rather than
the documentary one, taken deliberately, and the loadout says "his own cap"
rather than naming it.

⚠ **ITS LOADOUT WAS BYTE-IDENTICAL TO `pokemon-go`'s**
("Blazer · shirt · lanyard · camera · phone · cap"), which is what a placeholder
looks like — and is why the edit had to be scoped to the era's own block rather
than done by string. A test now pins the two apart.

Measured: **3.29 runs per hem row** (the gate is 4.5; the armour's hard panels
light far better than a cloth robe), `headY 0.0437 / footY 0.9961`, and it ships
the Safari lane.

⚠ **THE REFUSAL STAYS IN THE CODE** even though `BLOCKED` is now empty. The
reason it existed has not changed: U14 measured what a words-only wardrobe
produces — a generic cowl, invented spires, a nondescript sword — and the next
era without a photograph must hit it and stop rather than draw a paraphrase.

⚠ **Left open: the Expanse figure has not been read on the live station.** The
asset is verified (composited and matted clean, the gate at 3.29, 1603 unit
tests green), but the session ended before the five-era walk on the page.

### Two API facts worth keeping

`GenerateVideosConfig` does carry `negative_prompt` (which the plan flagged as
uncertain), and it does NOT accept `generate_audio` on the Developer API — that
field is Gemini Enterprise Agent Platform only and the request is **rejected
outright** rather than ignored.

## Update 25 — one figure height across the eras, and the title joins the house recipe (2026-09-18, owner)

**Status: Accepted on the title, which is shipped and measured. ⚠ ACCEPTED
UNDER A CORRECTED PREMISE on the figure — the owner ruled that all five eras
should meet the 2026 figure's stature, and the measurement taken immediately
afterwards says that stature is unreachable. What shipped is the only datum the
assets allow. See §3.**

Two readings off the live page, one sentence: _"can you make sure the avatars
and the videos are all the same height and that the title above them matches how
we design the other titles — I think it's caps, maybe also the font size."_

### 1 · The figures were never the same height, and the box is why nothing saw it

Every era is delivered on the same 720×1280 canvas, and the figure column is
9:16 by construction (`--vwd-fig-w` is `(100svh − chrome) × 0.5625`, which is
exactly 720/1280). So **the media box is identical to the pixel on all five
eras** — and every guard on this surface measures boxes. The variance is inside
the canvas: `post.py` normalises the FOOT (`--foot 0.995`) and leaves `headY`
wherever the generator put it.

| era                             | headY  | footY  | span       | painted at 1920×1247 |
| ------------------------------- | ------ | ------ | ---------- | -------------------- |
| `expanse` 2018                  | 0.0437 | 0.9961 | 0.9524     | 778.9px              |
| `genai` 2023                    | 0.0563 | 0.993  | 0.9367     | 766.0px              |
| `loop` 2026 / `pokemon-go` 2016 | 0.122  | 0.998  | 0.876      | 716.4px              |
| `azeroth` 2020                  | 0.2352 | 0.9695 | **0.7343** | **600.5px**          |

A 178px spread inside five identical boxes. Azeroth's share of it is already on
record as left-open in U18 — `EmoteTalk` widened him 10.6 % and stood him 8 %
shorter, `footY` did not move, and the whole surplus landed above his head.

### 2 · The fix is `--holo-fit`, and it may only ever shrink

`HOLO_FIGURE_SPAN` and `holoFigureFit()` (`lib/voidwalker/characterEras.ts`,
still zero-import) take each era's own measured anchors down to one span;
`HoloFigure` writes the result as `--holo-fit` on `.vwh__slot`, beside the
`--holo-alpha` / `--holo-scan` / `--holo-glow` it already writes; `.vwh__media`
spends it on its box.

⚠ **THE BOX, NEVER A `transform: scale()`.** The scanline mask lives on
`.vwh__media` and is stated in absolute px, so a transform would scale its pitch
per era — each era its own raster. A smaller box leaves the pitch at 3px, leaves
the wrap's vignette and the rest-phase clip alone, and stays bottom-seated on
the wrap's own `place-items: end center`.

⚠ **BOTH AXES, AND A HEIGHT-ONLY FIT IS THE TRAP THIS PASS FELL INTO FIRST.**
`contain` paints `min(w/720, h/1280)` of the canvas, and the slot is **not**
always the wider of the two: at 1920×1247 it measures 460×845, i.e. 0.544
against the contract's 0.5625, so the media is WIDTH-bound and letterboxes
vertically by 27px. A height-only fit is therefore a **no-op at 1** and
under-scales everywhere else — measured, it left the floor era 20px short of the
four it was supposed to define and reported a 3.33 % spread it had just been
asked to remove. Scaling both axes factors the term straight out of the `min()`.

⚠ **`Math.min(1, …)` IS STRUCTURAL, NOT CAUTIOUS.** Past ~1.077 the fit re-binds
to width and the media overflows `.vwh__media-wrap`'s inset clip upward, cutting
the head. An era needing more than 1 is an asset to re-deliver, never a number
to raise — and `character-era-hologram.test.ts` fails on a span below the
constant rather than letting the clamp quietly do that work.

⚠ **THE FLOOR ERA RETURNS EXACTLY 1.** `footY − headY` is a float subtraction,
so the shortest era's span is not bit-equal to the literal it defines and
`Math.min` alone hands its media `calc(100% * 0.9999999999999999)` —
pixel-identical, and a lie about the one era this pass does not touch.

Measured after, at 1280×720 / 1440×900 / 1920×1247: **0.00 % spread** at every
one (300.2 / 406.5 / 600.5px), boots on the disc within 1.5 / 2.1 / 2.3px across
the four seated eras.

### 3 · The owner's chosen datum is unreachable, and the measurement is why

The ruling was: all five meet the **2026 figure's** stature (span 0.876), with
azeroth re-delivered to stand taller inside its own canvas. The measurement,
taken on the delivered alpha rather than assumed, says he cannot.

`measure_anchors()` now reports **all four edges** — ⚠ because a span change is a
WIDTH change, and the vertical anchors alone cannot answer whether the room
exists. Azeroth's composite measures **0.9625 of the canvas wide**, touching
0.0222 and 0.9847, and its widest row is at y 0.531 — **mid-torso, not the
imps.** Growing him the 1.212× that 0.876 needs would put his ink at 1.166 of
the canvas: the fel-crystal spires cut on both sides and the right-hand imp
bisected. The still is in the record. U13's own line settles it — _a plume may
run off the edge; the man may not_.

⚠ **AND THE SPLIT IS FORCED BY A CODEC, SO EVEN A PARTIAL GROW IS NOT FREE.**
Azeroth is the one era with no `videoAlphaHevcPath`, so he alone can be
re-delivered end to end on the Windows machine; `genai` and `expanse` each ship
a `.mov`, HEVC-with-alpha needs macOS videotoolbox (verified absent — this
ffmpeg carries `libx265` and no `hevc_videotoolbox`), and re-cutting their video
would leave a stale `.mov` and make Safari disagree with Chrome about the
figure's height. U6's "the Safari path may never be worse than today" forbids
it. A CSS fit covers every engine at once.

So `HOLO_FIGURE_SPAN` is **0.7343** — the shortest delivered span, which is a
constraint rather than a preference. The named cost: the other four come down
14–23 %, and the air above their heads grows by that much.

### 4 · The title was the one big title off the house recipe

`.vwd__mast__title` already carried the shared clamp `clamp(26px, 3vw, 44px)` at
weight 400 in PP Neue Montreal — **the size was never the problem**. What was
missing is everything else the recipe is: `text-transform: uppercase`,
`letter-spacing: 0.04em`, and the `0 0 22px rgba(gold, .18)` glow that
`.services-masthead__title`, `.home-v2-station-header__title`, `.arc-title` and
`.voidwalker__name` all carry byte-for-byte. It was the only sentence-case,
untracked, unlit PP Neue display element on the landing.

⚠ **IT CLOSES A SEAM IN THE HANDOFF RATHER THAN OPENING ONE.** The About name
translates into this element without scaling (U22 / U6 §1) and arrives in CAPS
with a glow; until now it dissolved into a title with neither.

⚠ **THE CASE IS A CSS TRANSFORM, NEVER THE AUTHORED STRING.** `era.wardrobe`
stays sentence case, which is what keeps the `aria-label` and the decode's own
`textContent` unchanged — and is why `services-ring-smoke`'s `mastText`
assertion cannot break on this.

⚠ **THE RATCHET PIN RISES, AND THAT IS THE DESIGN CHANGE.**
`voidwalker-datum.css` goes A 1 → 2. `0.04em` is the literal every other house
title spells the same way; it is not on ADR-092's role ramp, and minting a fifth
rung for one title would fork the recipe into two spellings, which is the defect
that file exists to count. ⚠ **C does not move, and that is the counter's known
blind spot rather than a dodge**: the family arrives through this sheet's own
`--vwd-display`, which `countBlock`'s `pp-neue-montreal` probe cannot see. The
uppercase is real and the mechanical gate's `case` stage reads the computed
style.

Measured: no era wraps at 1101×800, 1280×720, 1440×900 or 1920×1247, and
`probe-voidwalker-eras`'s `foot` is **78 / 75 / 111** — byte-identical to U23's
own triple, so the mast did not grow a pixel.

### 5 · Azeroth hovers above his disc, and it is a second defect this exposed

With the heights equal, the remaining difference is the seat: azeroth's boots
land **23.6px above the projector disc at 1920×1247** (11.8 at 1280×720, 15.9 at
1440×900) while the other four sit on it within 2px. This is not the fit — it is
`footY` 0.9695 against the seated eras' 0.993–0.998. `post.py`'s `seat_frames`
exists for exactly this and names this exact asset in its own docstring ("the
canonical pair ends at 0.998 and azeroth at 0.970"); azeroth predates the step
and was never re-seated.

⚠ **THE PROBE REPORTS IT WITH ITS NUMBER RATHER THAN ABSORBING IT.**
`probe-voidwalker-figure-span` pins the four seated eras tight and prints
azeroth's hover as a named exception — a guard loosened until it passes is a
guard that has stopped describing the page.

The close is a **pure 33-row downward shift** of the delivered frames (0.9695 →
0.995), which the canvas has room for: the composite's own ink ends at 0.9727,
so 33 rows lands its lowest claw at 0.9982. No scaling, no crop, and no `.mov`
to regenerate. **Not taken in this pass** — it re-encodes a client-facing asset
and belongs with whatever the owner rules about §3.

### What it costs, and what is left open

- ⚠ **The four non-azeroth eras are 14–23 % shorter than they were.** That is
  the price of one height when the shortest era cannot rise, and it is the thing
  to look at before this is called done.
- ⚠ **The canonical pair's authored anchors and its delivered ink disagree by
  1.6 %** (registry 0.122/0.998, measured 0.1102/1.0000). The authored pair is
  almost certainly right — the key's glow falloff clears the 32/255 cutoff for
  ~15 rows above the head — so nothing was re-pinned. Named so it is a decision
  rather than a discrepancy nobody wrote down.
- **Azeroth's re-seat**, above.

## Update 26 — the phone's dead strip, the Latent Land year, and a mark on the record (2026-09-19, owner)

**Status: Accepted on all three. ⚠ The phone half cannot be verified from this
machine and says so in its own comments — every CI project is Chromium, which
resolves `svh`, `lvh` and `dvh` to one number, and that is precisely why it
shipped.**

Three quality-of-life reads off the live site. ⚠ **thoughtform.co is LIVE now**
— Vercel is serving this app, not the Framer site — so this is the first
`#voidwalker` pass whose output is outward-facing on the real domain.

### 1 · The "pane at the bottom" is not a pane — it is the strip below `100svh`

The owner photographed a full-width band ~150px tall at the foot of the phone
screen, a different tone from the page in BOTH themes, with the theme switch
sitting inside it, and asked for it to go so "elements can breathe".

**Nothing paints it.** `.home-v2-stage__canvas` is `position: fixed; inset: 0;
height: 100svh` — and `inset: 0` PLUS an explicit height is over-constrained, so
`bottom` is dropped. On iOS Safari `100svh` is the SMALL viewport (~745 of 844
on a 14, the number this repo's own phone probe already records), so the
corridor's opaque void backing stopped **~99 CSS px above the real floor** and
the layers underneath painted through: the gateway radial, `.gateway__grain`
and the corridor-exit veil.

⚠ **THE TONE IS THE PROOF THAT IT IS AN ABSENCE, NOT A PAINT.** It reads lighter
than the page in dark AND in light because `.gateway__grain` blends `overlay`
in dark (which lightens black) and `multiply` in light — opposite operations,
one appearance. A single painted band could not do that.

⚠ **AND THE THEME SWITCH BEING INSIDE IT IS THE DIAGNOSTIC.** `.rin-settings`
and `.hud__corner--br` are pinned to the REAL viewport floor while every
backdrop on this page was sized in `svh`. The only two things that can be in
that strip are the two survivors of the phone HUD, and they were.

The canvas takes `height: 100dvh; min-height: 100lvh` — the idiom `landing.css`
already ships at the pinned-beat rung, and safe to grow **because nothing is
laid out inside it**: a backdrop with no content cannot jitter a line of type.

⚠ **IT IS WORSE ON `#voidwalker`, WHICH IS THE SECTION HE NAMED.** `.vwd` is
`100svh`, so the instrument ends ~99px early — and `.vwd__band` then reserved
`--mobile-chrome-bottom` INSIDE it, for chrome that is now entirely below it.
The strip was paid for twice. Its own comment carried the false premise:
_"inside a 100svh instrument this element's own bottom edge IS that floor"_.
The reserve is `max(0px, calc(var(--mobile-chrome-bottom) - (100dvh - 100svh)))`
now — **`100dvh - 100svh` is the live toolbar height**, zero while the toolbar
is shown (where the clearance is genuinely needed) and the full offset once it
collapses (where the chrome is below the instrument). Inert in Chromium, worth
56–74px of screen on a real phone.

⚠ **AND `.svc-ring-band` WAS SPENDING A LITERAL.** Its `calc(56px + 16px)` was
the measured value of `--mobile-chrome-bottom` on a notch-less phone, so on a
notched device it under-cleared the settings cluster by 18px. `mobile-sections`
§1 already required the token — _"derived from the chrome's own tokens, never
from a literal"_ — and this rule was the exception nobody had caught.

⚠ **THE GUARD WAS VACUOUS AND NOW SAYS SO.** `services-ring-mobile-smoke`
asserted `bandHeight ≈ vh`, which is trivially true where `svh === lvh`. It
records all three units and asserts the canvas reaches the large viewport; the
assertion still cannot fail in Chromium, and its message names that so the next
reader checks a device instead of trusting a green run.

### 2 · Latent Land is 2023

One authored value (`characterEras.ts`) with one twin in the ADR-074 record
(`voidwalkerData.ts`'s `year` **and `sortYear`**). Everything the stage prints
is derived from `era.year`, so no component moved. ⚠ `sortYear` is floored into
the travel clock's integer tick ladder, so the (unmounted) timeline's marker
moves with it — a consequence, not a typo. Fifteen further sites stating the
same fact were swept: comments, the era's own wardrobe lock in `prompt.py`, two
labs, the mockup generator, and the year tables in ADR-082, ADR-074 and ADR-081.
**No test pinned it** — the era suite checks the year's grammar and its
reverse-chronological order, and 2023 satisfies both.

### 3 · ON RECORD gets a mark, and it is an icon rather than a pill

The owner asked for a frame, a pill or an icon, pointing at Starfield. ⚠ **A
pill is a painted ground and a frame is a box — the two idioms this station has
refused on the record twice** (U20 deleted the dashed ghost frame, U21 deleted
the rails, and the committed `>700px` sweep exists to keep grounds off it).
Starfield's own grammar is icon + label. He ruled for the icon.

`PressGlyph` sits beside `FigureGlyph` in the same component and on the same
grammar — rect-only, a 7×7 lattice at integer cells, the 14px rung, no text
node. Four left-aligned rules of unequal length: a column of set type, which is
what a clipping is.

⚠ **ONE MARK, NOT ONE PER OUTLET.** The particle grammar bans decorative
primitives, and a glyph per publication would be exactly that — the outlet's
NAME is the next thing in the row, so a second encoding of it is noise with a
distinguishability problem at 7×7. What the mark earns its gutter with is the
INDEX read: five text blocks become five records.

⚠ **AND THE SIGNAL SAYS SOMETHING TRUE AND FREE.** The lit rule means the piece
has a public URL, which two of the six do not — a fact `VwPress.href` already
held and the surface never said. No new field, and the zero-import record is
untouched.

⚠ **DAWN ONLY.** `ProofGlyph`'s signal layer is gold at alpha 1; here gold means
"you are here" on the reel one row below, and five gold pixels in a reading
column would compete with the one mark allowed to lead. The two weights are
`.45` (the outlet's own ink) and `.8`.

⚠ **THE MARK READS AT ITS LABEL'S STRENGTH, NOT ITS RULE'S.** The first cut took
`--vwd-rule-head`'s `.3` and came out quieter than the outlet beside it — a key
that recedes behind the thing it keys is an absent key, which is this surface's
own finding about the seat's dashed line one panel over. Found by looking at the
still, not by a gate.

⚠ **A HELD GUTTER, AND `center` NEVER `baseline`.** The mark's column is a fixed
track so it holds its width whether or not a mark lands in it (the proof
register's rule, and what keeps a future markless item on the same rail); and
grid synthesises a replaced element's baseline from its BOTTOM edge, so a
baseline row would hang the whole meta line off the glyph.

Measured after: the RECORD tab's `foot` is **78 / 75 / 111** at the three
reference rungs — byte-identical to U23's own triple, so the mark costs the
binding tab nothing — and the phone instrument still fits at all five shapes ×
five eras × four tabs.

### Also fixed in passing

⚠ **`.claude/rules/voidwalker.md` said `off = corner_max - 6`** where the ADR,
the avatar README, `post.py:119` and `grade.py:49` all say **`+ 6`**. A `- 6`
would drop the key threshold BELOW the ground's own black level and admit the
background as ink. It is the line a reader hits first, and it was wrong.

## Update 27 — the phone gets one gutter, a reel, and a seated figure (2026-09-19, owner)

**Status: Accepted. Every number below is measured at 393×852 on the live
code.** ⚠ **His screenshots predate the U26 deploy** — the era chip still read
`2022` — so part of what he photographed was already fixed; what follows is
what was genuinely open.

### 1 · "Contained within the corners" is one missing gutter

⚠ **THE STATION IS FULL-BLEED AT ≤700 AND ONLY SOME CHILDREN PAY.**
`voidwalker.css`'s `#voidwalker.station { padding-inline: 0 }` is `(1,1,0)` and
beats `landing.css`'s 32px station inset, on the argument that "the phone
character sheet owns its own 16px safe gutter". That is true of the mast and
the stage, which spend `--vwd-pad-x`; it is true-ish of the band, which spent
its **own** near-twin `clamp(12px, 5vw, 24px)`; and it was **false of
`.vwd__tabs`, which spent nothing** — so that row put its two hairlines on the
viewport's own edges. That is the "elements touch the borders" in the
photograph.

**One token, and it is the frame's own:** `--vwd-pad-x: var(--hud-margin)`. The
corner brackets sit on that line — TL at x 16…44, BR ending at 377 — so
spending the same token makes _"contained within the top-left and bottom-right
corners"_ true **by construction rather than by eye**. It was
`clamp(16px, 5vw, 24px)` = 19.65px: close enough to look deliberate, not close
enough to line up with anything.

⚠ **MARGIN, NOT PADDING, ON BOTH ROWS.** The tab row's rules are its own
border, so padded they would still run the full width; and the band is
`overflow: clip`, which clips to the PADDING box, so a padded band would fade
its reel's edges outside the gutter. Measured after: tabs **16/377**, band
**16/377** — identical, which is his "a band the same width as the tabs above",
asserted rather than eyeballed.

⚠ **THERE IS NO HORIZONTAL SCROLL, AND ONE SCREENSHOT LOOKS LIKE THERE IS.**
`body` carries `overflow-x: hidden` and the 31px `scrollWidth` overhang this
probe records is `.gateway`/`.hud` measuring `100vw` **plus a Chromium
scrollbar gutter** — on a phone the two are equal and `scrollTo(400, y)` leaves
`scrollX` at 0. The shifted frame is a pinch-zoom pan or the stale build.

### 2 · The reel comes back to the phone, and it is arithmetic

Five stops across a 361px band is a **72px pitch**, and `LATENT LAND` and `THE
EXPANSE` are **65px of ink** at the rung's 8.6px type — **two pixels of
slack**, no gutter, no separator. **At five across, 8.6px IS the ceiling**, so
the gutter alone could never have made this row legible. Three stops at ~120px
carry the names at **11px** with 34px to spare.

⚠ **THIS IS THE THIRD PASS ON THIS OBJECT AND IT REVERSES HALF OF U23.** U19
put a band on both breakpoints; U23 took it off the phone (_"just buttons … on
top of that avatar image, but we don't need the panel below it"_) and laid all
five out flat with `transform: none` and `--dd: 0`. Owner ruling, recorded as
one. ⚠ **What U23 ruled against survives**: a band with a GUTTER and a FADE,
never a painted ground — a scrim opaque enough to tame a bed running luminance
8→191 is exactly the panel it deleted, and the halo still carries the ink. The
44px target floor, the roving focus and the tablist are untouched, because the
reel is the same node moved by CSS.

⚠ **THE CELL IS SOLVED FROM THE BAND, NOT THE CHIP** — `--vwd-cell:
(100vw − 2·pad-x)/3` with `--vwd-reel: 3`, so `reel × cell` IS the margin box
and the track's translate lands on whole cells.

### 3 · One figure height on the phone, and the fit was never the defect

`--holo-fit` scales both axes, so the era's span factors out of `contain`'s
`min()`. What was era-dependent is **the slot's own height**: `.vwd__mast__title`
wraps to one line or two depending on the era's `wardrobe` string, and the
stage takes the remainder.

| era       | title                  | lines | before          |
| --------- | ---------------------- | ----- | --------------- |
| `genai`   | The AI Captain         | **1** | biggest figure  |
| `expanse` | The campaign commander | **2** | smallest figure |

**Exactly the pair he photographed.** And the phone **straddles the binding
boundary**: at 390×844 a one-line mast is width-bound and a two-line mast is
height-bound, while a real iPhone (`svh` 745) is height-bound for every era, so
there the wrap decides outright. U25's "0.00 % spread" was a **desktop**
measurement and `probe-voidwalker-figure-span.mjs` exits below 1101px, so
nothing was watching this.

**A two-line reservation** (`min-height: 2.2em`) makes the slot
era-independent. ⚠ **The clamp is NOT stepped down** — byte-locked to the About
name's handoff footprint, and that ban stands. Measured after: **376px on all
five eras**, from 455.7–461.8 before.

⚠ **AND EVERY TAB RESERVES THE STOPS' STRIP NOW, THE FIGURE INCLUDED.** It read
`:not([data-vwd-tab="figure"])` on the argument that the stops riding the
figure was the point of U23 — and it was, but what it produced is the figure's
box running to the sheet's floor with the band printing over the boots **and
the projector disc**. The reserve lifts the whole column, figure and disc
together, so the seating contract is untouched and only the assembly moves.
`--vwd-band-reserve` and `--vwd-chrome-clear` are declared once on `.vwd` and
spent by the band and the stage, because these two drifting apart is the defect
in both directions.

### 4 · The floor branch's rectangle, as a belt

The lighter box around a figure is the FLOOR branch — no alpha, so the wrap's
opaque bed shows. On current code **only `azeroth` takes it on iOS** (the one
era with no `.mov`). His shot shows it on `expanse` too, which means either the
build predates the Safari lane or **the HEVC probe is failing on his device**.
⚠ **One line settles it, on his phone:** `document.querySelector('#voidwalker
.vwh__slot').getAttribute('data-holo-alpha')` — `"hevc"` on four eras and
absent on azeroth is correct; `null` everywhere means the probe is failing.

Either way the fit now moves to the WRAP on that branch, so the bed and its
vignette scale with the media. ⚠ Without it, a 0.771 fit pulls the bed's hard
top edge from ~45 % to ~91 % mask opacity — **roughly double the contrast on a
straight horizontal line**. No era that takes the floor today is shrunk
(azeroth's fit is exactly 1), so this is protection for the probe-failure case.
⚠ The media goes back to 100 % of the wrap or the fit applies twice.

### 5 · Proof: the wrapping rail, and the cascade's own hole

**The rail.** Three stations need **369px on a 313px row** and the label is
already at the house's **10px control floor** — so size could never have closed
a 56px gap. It came out of chrome: station padding 9→4, the gap 7→5, **the
doubled seam margin** (the desktop adds `margin-left: 6px` on top of
`margin-right: 6px`, so every seam cost 12px — that alone was the last 8px),
and **the mark on the OPEN station only**. A diamond beside a dormant station
says nothing; the lit one is a filled box that already carries it. ⚠ **The
budget is state-independent by construction** — exactly one station is lit, so
the row always spends one mark and a tap cannot re-wrap the row under the
reader's thumb. Measured: three-station rails are **one line, 44px** on every
card.

⚠ **FOUR STATIONS CANNOT MAKE ONE LINE AT ANY CHROME BUDGET** — the tools
rail's handles are 320px of label alone. That row wraps **deliberately**, as
two equal columns; a ragged 3-then-1 reads as a bug, which is what he was
looking at.

**The cascade.** `--pc-card-h` is `100svh − top-base − n·peek − bottom-safe`,
and measured, the **deepest slot lands its bottom exactly on `vh − bottom-safe`
— the reserve is not slack.** What he is looking at is an EARLY card: slot 1
pins at 116px and ends at 672 on an 852px screen, so 180px of page shows under
it for its whole dwell, with nothing to peek into because the next slot is a
full dwell below in flow. ⚠ **So the only lever is the PITCH, and it is bounded
from below by the head band** — that band is the card's own title at 13px over
two lines, so 44px is a floor rather than a preference. 52 → 44 gives every
card **32px of height** and takes 32px off every early card's hole.

### 6 · The guards, and what they were not asking

- ⚠ **`probe-voidwalker-phone.mjs` COLLECTED `chipUnion.left/right` AND
  COMPARED THEM TO NOTHING**, and used the tab row only as a DRIVER. Every
  horizontal question in it is new: the tabs and the band inside `--hud-margin`,
  and **the two on the same line as each other**, which is the owner's second
  ask stated as an assertion.
- ⚠ **`proof-stack-mobile-smoke` PINNED THE PITCH AS THE LITERAL 52.** It reads
  `--pc-peek` now and asserts the LAW (a field seats one peek under its record)
  plus the head band's 44px floor — a guard that pins the dial fails on a
  tuning change while saying nothing about the law.
- ⚠ **Run the mobile specs with `--workers=1`.** Parallel workers against one
  dev server produced four different failures across three runs and 9/9 twice
  serially; `.claude/rules/services-ring.md` already warns to confirm a
  suspected composition bug across several runs.

### Left open

- **`probe-voidwalker-figure-span.mjs` still exits below 1101px**, so the phone
  figure's one-height law is measured by hand rather than by a gate. It is the
  viewport where the law now matters most.
- **Azeroth's Safari lane** is still a Mac task (ADR-082 U26), and until it
  ships that era composites through the floor on iOS.
- The figure is **376px against 458 before** — the honest cost of giving the
  band its strip and reserving two title lines. If he reads it as too small,
  the levers in order are the mast reservation, then `--vwd-band-reserve`.

## Update 28 — the head line, the root clip, and the band's air (2026-09-19, owner)

**Status: Accepted, pending the device read.** Four asks in one message, read
on his phone: _"the avatars are still too much down; they should be more
up"_, the era section _"seems to be scrollable left and right"_, on
`#services` the paragraph _"too close to the cards … move everything a bit
more down so it's nicely centred"_, and _"on mobile the H1 and paragraph
should be centred"_. Plus one report this pass could not reproduce (§5).
Every number below is measured at 393×852 unless it says otherwise.

### 1 · Every era's head lands on one line

⚠ **THE FIT MADE EVERY ERA THE SAME HEIGHT AND LEFT EVERY HEAD IN A
DIFFERENT PLACE.** U25's `--holo-fit` shrinks `.vwh__media` INSIDE a slot that
stays full height and is bottom-seated, so every pixel the fit removes pools
ABOVE the head — and each canvas carries its own headroom besides (azeroth's
head at 0.235 of his canvas, the Architect's at 0.048). Measured: 137–152px
of empty stage over the head and the projector disc sitting ON the band's
edge, on all five eras. Growing the band's reserve would have made the
figure smaller (its size IS the slot's), the other half of what he asked for.

**The COLUMN — slot and base, one object — is lifted by exactly the slack
above the head, less a fixed `--vwd-head-air` (40px).** `holoFigureHeadShare`
(`characterEras.ts`, zero-import) is `fit × (1 − headY)`: the head's height
above the slot's floor as a share of the slot. `VoidwalkerHologram` writes it
on `.vwh__column` as `--holo-head`, and the phone sheet's translate is
`head-air − (1 − head) × (100% − base-h)` — the slot being the column less the
projector base. Nothing about the layout changes: the fit stays on the media,
the slot stays bottom-seated, the disc stays on the slot's floor and follows
the feet up.

| era        | air over head | disc off band | before   |
| ---------- | ------------- | ------------- | -------- |
| loop       | 60            | 90            | 152 / −2 |
| genai      | 60            | 88            | 150 / −2 |
| azeroth    | 60            | 76            | 137 / −2 |
| expanse    | 60            | 90            | 152 / −2 |
| pokemon-go | 60            | 90            | 152 / −2 |

The figure is still 376px on every era (U27's law is untouched). The disc
spread (76–90) is the feet's — azeroth hovers 23px above his (U25 §Left open).

⚠ **THREE CUTS SHIPPED NOTHING BEFORE THIS ONE, AND EVERY ONE LOOKED RIGHT
IN THE SHEET.**

1. A grid percentage: `grid-template-rows: calc(… × var(--holo-fit)) auto` on
   the column. Chrome resolved the percentage as `auto` against a stretched
   `height: auto` column — every era byte-identical to before.
2. A translate reading `var(--holo-fit)` on the column. **A custom property
   never inherits UPWARD** — the fit lived on `.vwh__slot`, the column's
   child, so the column read the fallback `1` at every era. Fixed by writing
   the value on the column too; then —
3. ⚠ **THE RULE WAS IN THE WRONG MEDIA BLOCK.** Both new rules landed in the
   701–1100 tablet block, not the ≤700 phone block, because the two blocks
   carry the same `.vwd__vwh .vwh__column` rule with the same comment
   ("the same definite-grid hand-down the phone rung needs"). The browser's
   `cssRules` walk found the `46.5%` inside `(min-width: 701px)` — the tablet
   block is byte-identical to HEAD again, and the phone block carries the
   rule.

Three green-looking edits in a row that measured a no-op: **measure the
computed `translate` on the element, not the rule in the file.** The
first cut's "half the slack" (`(fit − 1) × 46.5%`) was also the wrong
target once it worked — it left the heads at 93–111px on four eras and 137
on azeroth, i.e. still inconsistent; one head LINE is what reads.

### 2 · The root clips, and the emulator stops lying

⚠ **THE PAGE OVERFLOWED `100vw` BY 31px ON EVERY PHONE, AND TWO RECORDS HAD
CALLED IT HARMLESS.** U27 wrote "no horizontal scroll exists — the probe's
31px is `.gateway`/`.hud` at `100vw` plus a Chromium scrollbar"; ADR-107
recorded "Chromium's emulated iPhone lays the page out 421px wide …
something overflows `100vw` and the emulator zooms out, so `innerHeight`
reads 912 on an 844 window", left open. Both were describing the same thing
from two sides, and the owner's phone was the third: a document wider than
its viewport, which iOS Safari pans toward regardless of `body`'s
`overflow-x: hidden` (it reads the root, not the body, and has for a decade).

`landing.css`'s ≤960 block now clips the ROOT: `html, body { overflow-x:
clip }`. Measured in the iPhone 14 project: **the layout viewport goes from
421×717 to the device's own 390×664**, `documentElement.scrollWidth` 393 at
393 — the emulator no longer zooms out, because there is no longer anything
to fit. That is the mechanism the phone was reporting, and Chromium was
reproducing it the whole time; it was read as an emulation quirk.

⚠ **`clip`, AND `body` GOES WITH `html`, OR EVERY STICKY ON THE PHONE DIES.**
The first cut clipped `html` alone and the ring's band measured UNSTUCK
(top −681px at 40 % of its runway) with nothing erroring. The viewport takes
`body`'s overflow only while `html`'s is `visible`; the moment the root says
`clip`, `base.css`'s `overflow-x: hidden` stays ON `body`, which makes it a
scroll container that never scrolls — and `position: sticky` seats against
the nearest scrollport. `clip` on both clips without making a scrollport and
the viewport reads `hidden` from the root.

`.vwd__band` also takes `touch-action: pan-y`, the belt for the gesture
itself: the reel's track is five cells wide behind a clipped window, and a
horizontal swipe on it must reach nothing the page can pan.

⚠ **EVERY PHONE MEASUREMENT IN THIS REPO WAS TAKEN 8 % WIDE AND 53px TALL.**
ADR-107's, ADR-108's and `services-ring.md`'s "421px, so every width ask is
~8 % generous" notes describe the OLD emulator state; from this commit the
harness lays out at the device's size and those asks are exact. The one
consequence that surfaced: at `#voidwalker`'s seams rest (`top + 300`),
`#contact`'s nav row now passes under the BR bracket (x 346–374, y 620–648
against the row's 171–358 × 627–638) — the bracket was 31px further right
and the frame 53px taller before. Same class as the ledger's existing
`.rin-settings` entry one row up (the footer's header passing under the
frame on the way in), pinned beside it in `KNOWN_CHROME_COLLISIONS`.

### 3 · The services band on the phone: air, and centred

The band's grid (title · seat · paragraph) had **no `row-gap`**: the seat's
bottom WAS the paragraph's top (seat 6453–7022, intro 7022 — measured
absolute), and the ring fits the front card to 82 % of the seat, so the card's
own bottom edge sat a few px over the copy. `row-gap: clamp(20px, 3.4svh,
36px)` (≈29px at 852h), `justify-items: center`, `text-align: center` on the
band, and the lead + intro centred with `margin-inline: auto`. Measured
after: title 64–121 · seat 150–661 · intro 690–780 in an 852 frame — the
composition's centre at 422 against the frame's 426, which is what "nicely
centred" cashes out to on a sticky band with the chrome floors paid.

⚠ **THE DESKTOP IS UNTOUCHED, AND THE COMPLAINT WAS NEVER ABOUT IT.** At
1920×1247 the paragraph is the masthead's right column (top 136, beside the
title), not under the card; there is no "paragraph at the bottom" to move.
Measured before touching anything, so the mobile band is the only change.

### 4 · What was already right

Nothing else in the message needed a change. The title's case, tracking and
glow are U25's; the figure height is U27's; the band's reserve and the
gutter are U27's. This pass moved the column, clipped the root, and gave one
grid a gap.

### 5 · The reload on the proof stack, which this pass cannot reproduce

_"When I'm in the proof section and I talk about the intelligence map, the
last cards sometimes the site refresh."_ A full walk of the pile at 393×852
in Chromium — 992 → 9011px, every card — reports **0 console errors, 0
warnings, 56 MB of JS heap, 1 `<video>`, 1 canvas, 14 images, 41 SVGs, 2531
nodes**. Nothing here crashes, and nothing here is a memory that grows with
scrolling.

What a "refresh" on the last cards of a pile IS on iOS is Safari's WebContent
process being killed and the tab reloaded — "A problem repeatedly occurred"
if it happens twice — which is a memory/GPU budget, not a JS error, and the
budget is per-tab. The suspects, in order: the corridor's WebGL canvas, which
since ADR-108 is a FIXED painter held live behind the whole pile on the phone
(the ambient hold runs from the dissipate to `#voidwalker`'s kill — four
proof cards of scroll with a full-screen GL context underneath); the map
card's plate (the compound carrier — 47 `textPath` labels, the physics fields
— the most SVG on the page, arriving last); and the videos the film card
mounts. **This is an owner question, recorded rather than guessed at**: does
the tab show "A problem repeatedly occurred", and does it happen with Low
Power Mode on. If the canvas is the cost, the honest lever is ADR-108's own
flag — the ring rung falls back to the old phone page with no fixed context
— or a kill that does not wait for `#voidwalker`.

### The guards

- `character-era-hologram.test.ts` pins `holoFigureHeadShare` inside the
  slot and under the fit, and that `share − HOLO_FIGURE_SPAN` (the foot's
  height above the floor) is ≥ 0 on every seated era.
- `mobile-section-seams.spec.ts` gains the `#voidwalker · .hud__corner--br`
  ledger entry (§2) — 5/5 at the true device size.
- `probe-voidwalker-phone.mjs`, `probe-voidwalker-eras.mjs --vp 1280x720`
  (desktop 78/78, unmoved), the three phone smokes `--workers=1` and the
  desktop boundaries spec all pass; two cases (`services-ring-mobile-smoke`'s
  side tap, the boundaries spec's static-flow case) failed once inside a full
  run and passed alone, U27's own finding.
- The whole unit suite: 96 files, 1629 tests.

### Left open

- **The device read.** Chromium reproduces the zoom-out and its fix; whether
  iOS stops panning is the phone's to say.
- **The reload** (§5) needs his answer before a lever is pulled.
- `probe-voidwalker-figure-span.mjs` still has no phone mode (U27), so the
  head line is measured by hand rather than by a gate.
- The `421px` notes in ADR-107 §Left open, ADR-108 and `services-ring.md`
  are amended in place; the smokes' own recorded numbers (ADR-107's
  "`innerHeight` 912") describe the old frame and are left as history.

## Update 29 — the figure and the panels are balanced on the reference, and the record is a button (2026-09-19, owner)

The owner read the stage live against three of his own character-screen
references (`Starfield-1`, `Starfield-3`, `Cyberpunk-4`) and named four things:

> "make it more balanced. If you look at the screenshots from Starfield, the
> avatar is nicely sized in comparison with the elements around it … make sure
> they all have the same height and are proportional. For example, for Venting
> Became a Campaign, I don't like that font size or thickness. I think Scope
> Transmission and Record Facts can also have a higher font size. Really look
> at the Starfield screenshots for reference, then try to measure the font size
> and replicate it. For Transmission, when you have a video, I don't know why
> the thumbnail isn't the same length as the divider, just like we have with the
> paragraph in Scope … for On the Record, I think those news articles should
> have some sort of icons, but they should really feel like a pill, like a sort
> of subtle button."

### 1 · The measurement

Taken off the references at their native 1920×1080 as a share of the frame's
HEIGHT — which is the axis this composition is already built on
(`--vwd-fig-w` is `(100svh − chrome) × 0.5625`) — against the live stage at the
owner's 1920×1247:

| element                    | reference       | shipped        | share |
| -------------------------- | --------------- | -------------- | ----- |
| panel head (`MARS - SHIP`) | ~20px = 1.85svh | 13px = 1.04svh | 56 %  |
| readout label (`THERMAL`)  | ~19px = 1.76svh | 11px = 0.88svh | 50 %  |
| readout value (`133`)      | ~19px = 1.76svh | 15px = 1.20svh | 68 %  |
| body paragraph             | ~18px = 1.67svh | 18px = 1.44svh | 86 %  |
| painted figure height      | 660px = 61 %    | 600.5px = 48 % | 79 %  |

**The body was already at parity and everything around it was half the
reference.** That is the whole of "not balanced": the paragraph is the one
thing on this stage that was never measured against the chrome it sits in, so
the chrome reads as a footnote to it. Nothing here is a taste judgement about
size — it is one register being twice the other.

### 2 · The figure overscans its slot, because the box was never the small thing

`probe-voidwalker-figure-span` at 1920×1247 reports the media box at
**460 × 845** — the figure column at its 460px cap, i.e. every pixel of width
the composition has — painting a **600.5px** figure, 71 % of it. Two things
spend the rest, and neither is layout: every delivery carries transparent
headroom above the head (azeroth 0.235 of its canvas), and U25's fit equalises
all five eras DOWN to the shortest span (0.7343).

⚠ **NO CHROME TRIM REACHES IT.** At that viewport `--vwd-fig-w` computes 462
against a 460 cap, so the column is CAPPED rather than starved: give the stage
back 40px of chrome and the figure does not move. The levers are the cap, the
delivery, or the picture's share of its own box.

So `--holo-overscan` multiplies `.vwh__media`'s box on BOTH axes beside
`--holo-fit`, and the surplus is spent on the canvas's empty part. The wrap is
`place-items: end center` and the media `object-position: bottom center`, so
the growth leaves through the TOP and the sides and the foot edge does not
move — measured, the boots stay on the projector disc (foot line 1115.6–1119.3
against 1116.4–1119.5 before).

⚠ **THE CEILING IS THE COLUMN'S — THE RETICLE'S OWN LAW — AND THE CEILING IS
NOT THE VALUE.** The box may reach into the stage's column gap and may never
touch a panel, which `fig-w + 2 × gap` puts at 1.199 at the narrowest capable
rung (1101×800). **1.19 was built and measured live at 1px of clearance
there**: that satisfies the law and is not a margin — any rounding inside the
gap's own `clamp(18px, 2.4vw, 52px)` closes it, and the ring this law comes
from leaves ~28px. The shipped value is **1.16**, measured in the hold against
the panels' real edges: 5px of air at 1101×800, 12px at 1280×720, 9px at
1440×900, 12px at 1920×1247. Painted figure **697px**, 56 % of the frame
against the reference's 61 % and the shipped 48 %.

⚠ **THE BOX IS WHAT IS BOUNDED, NOT THE INK.** Most of this element is
transparent canvas, so a box in the gutter paints nothing there — but the box
is the measurable thing, and azeroth's composite is 0.9625 of its canvas WIDE
(its spires), so on the one era that could touch, the two are within ~6px of
each other. Bounding the ink instead would be a bound on a number that changes
with every delivery.

⚠ **ALPHA BRANCH ONLY, AND THAT IS STRUCTURAL RATHER THAN CAUTIOUS.** The
floor branch fakes transparency with an OPAQUE bed on `.vwh__media-wrap` plus
a radial mask to soften its edges (U6), and U27 moved the fit onto that wrap so
the bed would scale with the picture. A media overflowing that bed paints the
asset's near-black ground over the mast and the panel heads — the exact
rectangle three attempts in that file were spent removing. An engine with
neither codec, and `azeroth` on Safari, keep what they have; the default is
**1**, so the figure lab, the phone and the 701–1100 rung are byte-identical
without naming it.

⚠ **NOT A `transform: scale()`** (U25). The scanline mask is on that element in
absolute px; a transform scales its pitch and gives each era its own raster.

### 3 · The type ladder rides `svh`, and every floor is what shipped

Six rungs, on two ratios so the ladder still reads as HEAD then ROW rather than
as a list of sizes: head `clamp(11px, 1.55svh, 19px)`; label and meta
`clamp(9.5px, 1.2svh, 15px)`; film title and the absent line
`clamp(10px, 1.2svh, 15px)`; value `clamp(12.5px, 1.45svh, 18px)`; press
headline `clamp(13px, 1.45svh, 18px)`.

⚠ **THE FLOOR IS THE VALUE THAT SHIPPED**, so at 1280×720 the viewport term is
under it on all six and the binding short rung is byte-identical. ⚠ **TWO
FLOORS, ONE RATIO**: the value and the headline share 1.45svh and NOT their
floors (12.5 and 13), and collapsing them into one rule takes the headline DOWN
half a pixel at 1280×720 — a regression bought while raising everything else,
which is exactly what a floor law is for.

⚠ **SCOPED TO `min-width: 1101px`, AND THE PLAN SAID OTHERWISE.** It assumed
the ≤700 sheet declares its own sizes; it does not — it redeclares
`.vwd__facts__row` and nothing else, so a base-block raise would grow every
string inside a `100svh` instrument whose budget is SOLVED and whose
`overflow: clip` hides an overrun in silence (U23's four trims). 1.55svh of an
844px phone is 13.1px against the 11px that fits. The phone and the 701–1100
rung keep the shipped ladder; measured after, head 11px and `--holo-overscan`
empty at both.

**The motto is a LEDE, not a kicker.** It was PT Mono at 11–12.5px on a `.06em`
literal — the chrome register, which is what made a SENTENCE read as a label
and left it thinner than the paragraph it introduces. The reference does that
job with `INDUSTRIALIST`: the body's own face, at the body's size, one weight
up, in the panel's accent. It takes `--vwd-display` at
`clamp(12.5px, 1.45svh, 17px)` / `--weight-lit` / `--track-copy`, one rung
under the prose because a 52-character motto wraps to three lines at the body's
18px cap in a 368px panel. ⚠ NEVER a mono 700 — PT Mono has no 500 and a 700
there is the ratchet's B count.

### 4 · The film frame fills the measure, and its width was never declared

`.vwd__film__frame` is a grid item with an `aspect-ratio` and no width, so its
inline size was **TRANSFERRED from `max-height` through the ratio**:
150 × 16/9 = 267px inside a 368px head rule, and 171px at the 96px floor.
Nothing in the sheet ever said "narrower than the panel" — the number fell out
of a height cap two properties away, which is why it reads as a fault rather
than as a size, and why no guard could have named it.

With the width fixed the cap stops being a shrink and becomes a CROP (the
poster is already `object-fit: cover`), so it is restated as what it now is: a
band, `clamp(120px, 18svh, 207px)`, where 207 is 368 × 9/16 — the frame
uncropped at the panel's own measure. Measured: the frame's box is byte-equal
to the head's at every rung (280/280 at 1101×800, 368/368 at 1440×900 and
1920×1247), left and right edges included.

⚠ **THE CAP STAYS AS SHIPPED BELOW 1101px** — it is the PHONE's largest budget
term, the one U23 deleted `max-height: none` for (190px → 96).

### 5 · A record is a bounded object, and this reverses U26's frame

⚠ **U26 REFUSED THE PILL AND THE FRAME AS PAINTED GROUNDS**, which this station
has turned down three times and which its own `>700px` sweep exists to keep
off. **An outline is not a ground** — nothing here fills, in any state — and
the sweep is untouched besides, since an item is 368px wide against a 700px
floor. What U26 was right about survives to the line: the mark is DAWN ONLY at
.45/.8, there is ONE mark rather than one per outlet, and the lit rule still
means the piece links out.

- `.vwd__press` takes a four-sided `--vwd-rule-head` border (an object's own
  edge takes the REGION weight, as a panel head's does) and its own padding.
- ⚠ **THE AIR IS THE DIVIDER.** With four borders per item a foot rule between
  two of them is a doubled line — ADR-089 U3's finding, where a box and the
  track it sat on drew gold twice a pixel apart. The stack's `gap: 0` becomes
  real spacing; the `border-bottom` and the sibling `padding-top` both go.
- The mark moves into a **well** — a square outlined cell spanning both text
  rows, so it centres on the ITEM rather than on the meta line, which is what
  makes it read as a button's icon rather than as a bullet. The meta drops to
  two columns; the held gutter U26 needed is now a box and holds by
  construction.
- `--vwd-press-mark` 14 → **21px**, still an integer multiple of the 7-cell
  lattice (a 3px cell). In a bare gutter beside a 10px label 14px was its
  match; inside a 28px well beside type that has grown a rung it is a speck.
  The well is the mark plus one lattice cell of air each side, so the two
  cannot drift.
- ⚠ **THE STATE IS THE OUTLINE LIFTING AND MAY NEVER BE A FILL** — to
  `--gold-line`, the 3:1 line-work rung that re-derives itself in light, never
  raw `--gold` (the MARK rung, 1.8:1 on parchment). Anchors only: two of the
  six records link nowhere and keep the outline, because they are records
  rather than dead buttons.
- **Square** — the owner's own call among three geometries. ADR-065 puts chrome
  at 0 on the depth ladder, a rounded pill would be the one radius on the site,
  and a notch means oriented-or-connected, which six peers in a list are not.

### 6 · The ring is re-measured, not re-derived

The overscan grows the picture out of a BOTTOM-seated box, so every pixel it
gains is above the feet and the painted centre rises. `--vwd-ret-cy` 51 → **57 %**,
measured in the hold on a seated era: 59.1 at 1101×800, 58.0 at 1280×720, 57.1
at 1440×900, 56.1 at 1920×1247 — one number for a range, as U23's own
52.2/51.1/49.7 was.

⚠ **MEASURED ON A SEATED ERA, NOT ON WHICHEVER ONE THE PROBE OPENS.** `azeroth`
reads ~4 points lower (52.1 at 1920×1247) because it hovers above its own
projector disc — `footY` 0.9695 against the seated eras' 0.993–0.998, the
defect U25 named and left open, which the overscan magnifies from 23.6px to
27px. Centring the ring on the outlier would bake that defect into a second
object; it is one asset re-seat from agreeing with the other four.

`--vwd-ret-d` stays `fig-w × 1.14`. The media now takes more of the gutter than
the ring does, which is intended: the ring is DRAWN at its edge and a drawn
line in the gutter is the thing U23's ceiling was written about.

### 7 · The recorded reticle ceiling was stale, and is restated

U23 §3, its measured table and `.claude/rules/voidwalker.md` all say the ring's
box "can never exceed **487.6px**". That is `--vwd-fig-w × 1.06`; the shipped
multiplier is **1.14**, which landed in U23's own commit (`8b90f756`), so the
ceiling is **524.4px** and the table (243.8 / 280.9 / 330.1 / 487.6) is from an
intermediate cut that was never restated. The CSS comment's own arithmetic
("~28px of air against 552px") agrees with 1.14. ⚠ **The `>700px` sweep is
satisfied either way and that is the point of sizing off the clamp** — but a
number a rule states and a number the sheet computes must be the same number,
or the next pass tunes against the wrong one.

### Verification

- `probe-voidwalker-figure-span.mjs --vp 1920x1247` — one figure height
  (697px, 0.00 % spread), foot drift 3.7px, title on the house recipe.
- `probe-voidwalker-eras.mjs` at **1280×720 / 1101×800 / 1440×900** — all five
  eras clean at every rung. ⚠ **The `foot` triple moves to 63 / 72 / 98**
  (was 78 / 75 / 111) and `tightest` changes hands to TRANSMISSION at
  1280×720, because the film frame is the thing that grew there.
- `probe-voidwalker-phone.mjs` — fits at every shape, era and tab.
- `probe-datum-motion.mjs` — `tx` exactly 0 at rest, full travel at exit.
- `capture-voidwalker-station.mjs --vp 1920x1247` — `handoff: "ready"`, all
  three targets, `pinned: 0`. The About flight measures `.vwh__slot`, which
  the overscan does not move.
- `about-voidwalker-handoff-boundaries.spec.ts` (desktop) — 8/8, including the
  `>700px` wide-ink sweep.
- `type-material-tokens`, `character-eras`, `voidwalker-data` — green, and the
  datum sheet's ratchet pin comes back DOWN to **A: 1** with the motto's
  literal. ⚠ `ROLE_VAR` is an EXACT match with no fallback, so
  `var(--track-copy, 0)` counts as a literal — the house spelling is the bare
  token, and a fallback on a role rung is a second source for one number.

### Left open

- **`azeroth`'s hover is now 27px** and its silhouette fragmentation (U24's
  4.15 runs/row) is more visible at the larger size. Both are the same asset's
  recorded defects and both close with one re-delivery.
- **The figure is 56 % of the frame against the reference's 61 %.** The
  remaining 5 points are inside the delivery, not the layout: crop the canvas's
  transparent headroom and every era gains without touching the column. That is
  an asset pass with the Safari `.mov` lockstep U25 records.
- The reference letters its labels almost as large as its heads (1.76 against
  1.85svh); this ladder keeps a clearer step (1.2 against 1.55) because the
  head is mono caps at `--track-eyebrow` and reads larger than it measures.

## Update 30 — the phone's instrument is a snap seat, and U26's live reserve is reversed (2026-09-20, owner)

A pointer: the decision is [ADR-113](113-the-phone-locks-in.md). Two things
about this station change under it, both on the phone rung only.

- **`.vwd` is the station's snap stop** — `scroll-snap-align: start` on the
  INSTRUMENT (`voidwalker.css` ≤960), never on `#voidwalker`, whose padding
  would seat the 100svh box ~67px down and its era stops below the fold (U23's
  probe law, now in the sheet). Until this, nothing locked the instrument to
  the viewport at all: the owner's two stills were the same box ~50px high
  (the title on the TL bracket) and ~100px low (the stops under the settings
  icon). Both land now.
- **U26 §1's live reserve is retired.** `--vwd-chrome-clear` was
  `max(0px, calc(var(--mobile-chrome-bottom) - (100dvh - 100svh)))` so the
  strip below the svh box was not paid twice once the toolbar collapsed. The
  term is a `dvh` inside content and it reflowed the band, the stage's floor
  and the figure's slot for every frame of the bar animation — what he read as
  the section "settling". It is `var(--mobile-chrome-bottom)` again; the 56px
  of figure column it costs in the collapsed state buys a box that does not
  move. U26's canvas backdrop (`100dvh; min-height: 100lvh`) is untouched —
  nothing is laid out inside a backdrop, which is the whole distinction.

`probe-voidwalker-phone.mjs` is byte-identical before and after (Chromium
resolves the units to one number); `phone-viewport-units.test.ts` pins the
datum sheet at zero `dvh`/`lvh` terms.

## Update 31 — the figure rises, the record becomes a device, and the figures are graded, not glowed (2026-09-21, owner)

The owner, in one message about the era stage:

- _"What I've been repeatedly trying to ask is to move the avatars in our era
  section a bit up because right now they're a bit down. The fourth screenshot
  from Starfield, I think, is a good reference."_
- _"the World of Warcraft era avatar seems to be hitting some sort of borders,
  in the sense that some parts are falling off."_ And: _"I want the avatars to
  be more or less the same size, but I just want to make sure that it all looks
  cohesive and nice."_
- _"The AI Captain era, Latent Land, feels a bit too glowing in comparison with
  the Intelligence Architect one. The Intelligence Architect one is the main
  reference."_ — with a new painting to iterate from: _"a bit of a matte
  painting, retro-futuristic poster type of aesthetic … heroic."_
- _"there may be cases where I have multiple videos, and I want them to be
  stacked a bit … The video needs to live inside a card, including the title
  … the sort of glass effect like we have in the services section … it's not
  just videos. It can support every type of asset, image or video."_
- _"I think we need me as a soldier … crouching on one knee … holding the gun
  in one hand, holding it upwards, and my other hand should be in my ear …
  This should be like a live-action-ish type of thing."_
- _"the band at the bottom should be more like a sort of thumbnail gallery
  that should be a bit more clear."_ And: _"I'm not a fan of the on-record
  buttons. They feel like glorified PowerPoint frames, so let's make them
  tighter."_

Asked while planning, he chose: a FOLDER TAB for the media card's head, TAGGED
ROWS for the record, ALL FIVE busts in a row for the band (knowingly reversing
his own U20 reel), and a 2016 figure of its own (he will supply the photo).

### What was measured

| finding                                         | evidence                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The figure stands low, and has since U25        | modelled head / feet / centre at 33–38 % / 87–90 % / 61–62 % of the frame at every rung; the Starfield reference is 16 / 78 / 47                                                                                                                                                                                                 |
| Why                                             | the slot is BOTTOM-seated on the disc and `--holo-fit` shrinks the media inside it, so every pixel of slack pools above the head. U28 lifted the phone; nothing ever moved desktop                                                                                                                                               |
| The Azeroth crop has two causes                 | `.vwh__media-wrap` carries `clip-path: inset(0)` AND a radial mask (a mask hides overflow too). He is the one era at fit 1, so under U29's overscan his box is 533.6px in a 460px wrap — ~27px of pauldron cut per side                                                                                                          |
| He also hovered                                 | 27.3px above his disc at 1920 × 1247 (`footY` 0.9695), the defect U25 named and left open                                                                                                                                                                                                                                        |
| "Too glowing" is in the asset and is structural | the CSS look is uniform across eras; the Architect was made in TWO steps (a photoreal still, then a restyle into gold) and reads as a gold-toned photograph; `genai-v2` and `expanse-v1` were drawn in ONE step and came back as emissive sculptures. Deep-interior p75 luma: Architect ~103 · genai-v2 172.4 · expanse-v1 170.0 |
| Why one step glows                              | the alpha is a LUMA key, so black cloth must be over-lit to survive it — and over-lit black cloth is the glow                                                                                                                                                                                                                    |

### A · The figure rises — as `top`, never `translate`

`.vwd__figure` takes `position: relative; top: −lift`, where the lift is solved
so the painted cap lands on the stage's top edge — the four panel heads' own row
line. Era-INDEPENDENT on purpose: it uses `HOLO_FIGURE_SPAN`, written once as
`--holo-span` by `HoloDatumPanels` from the registry, so the disc line never
moves between eras and a kneeling figure simply has more air above.

- ⚠ **A `translate` WOULD HAVE SHIPPED GREEN AND BROKEN THE HANDOFF.**
  `futurePinnedRect` measures the About → Voidwalker `portrait` seat with OFFSET
  geometry and "deliberately ignores every live actor transform", and the
  handoff spec copies that arithmetic — so a translated seat would have landed
  the flying portrait card 95–148px below the hologram with every spec agreeing.
  `top` moves the box `offsetTop` reads. The weld spec now asserts the slot's
  rect equals the offset chain ±2px and that the lift is real (< −40).
- ⚠ **ALPHA BRANCH ONLY**, gated through `--vwd-rise: 1` in the existing
  `min-height: 720px` hologram rule (default 0 ⇒ `top: 0px`, a true no-op on PRM,
  the fallback, short windows and ≤1100). On the floor branch the lifted opaque
  bed would dim the title.
- `--vwh-base-h` / `--vwh-base-disc-inset` are declared on `.vwh, .vwd` together:
  a custom property never inherits upward, and the lift has to read them on the
  figure's own ancestor.
- **The reticle is arithmetic now**: on the alpha branch it centres on the
  painted figure from the same terms (`--vwd-ret-cy`'s measured 57 % stays for
  the floor branch). Measured within 1–1.6px of the figure's centre at four rungs.
- **The lift exposed the under-glow's cliff** — `.vwh__base__glow` is a
  half-ellipse whose hot centre sits on its box's bottom edge, which the band
  used to bury; in open air it drew a hard floor. It is a centred radial on the
  desktop datum stage.
- Measured: lift −148.3px at 1920 × 1247, −103.9 at 1280 × 720, −136.8 at
  1101 × 800, −128.9 at 1440 × 900; head / feet / centre 20.7 / 76.9 / 48.8 % at
  1920 × 1247 and 21.8 / 70.4 / 46.1 % at 1280 × 720; the figure's height
  unchanged (696.6px / 348.3px); slack 27–67px at the four rungs.

### B · Azeroth is whole and seated

- **The release** (`voidwalker-hologram.css`, alpha branch): a `--holo-spill`
  number drives `--holo-clip-x` / `--holo-clip-top` (plain percentages, so they
  interpolate), used by the base clip, the rest clip AND `vwhReveal`'s keyframes,
  so his pauldrons do not pop 27px when the wipe ends. The mask comes off under
  `@media (min-width: 1101px) .vwd …[data-holo-alpha]` only — the phone, the
  tablet and the figure lab are byte-identical. Byte-identical everywhere the
  spill is 0, which is every era but the floor era.
- **`-v11` is `-v10` shifted down 33 rows** (`reseat_azeroth.py`, asserting the
  dropped rows are empty on all 240 frames) — no scale, no crop, no re-render.
  ⚠ Both anchors are authored as `v10 + 33/1280` (0.261 / 0.9953), never
  re-rounded: rounding each separately gives a span of 0.7344 and
  `holoFigureFit` returns 0.99986 for the ONE era whose fit must be exactly 1.
- Measured: cut L/R 0/0; all five eras on one foot line (954.8–958.4 at
  1920 × 1247); one disc line (960; 507.6 at 1280 × 720).

### C · The band is a five-bust gallery (≥701px) — reversing U20 and U23

Five hairline-framed busts, the year in the frame's corner, the name under it,
the lit era taking `--gold-line` on its frame and a diamond on the frame's
bottom edge. The lit frame MOVES; the row does not.

- **The busts belong to the DELIVERY**: `CharacterEraHologram.thumbPath` is
  REQUIRED, a 192×128 WebP ≤10 KB cut by `thumb.py` from the poster by HEAD
  MARKS (one head size, one eye line across the row — five deliveries draw their
  heads at five sizes). Two eras on one hologram share a bust by construction;
  the unit suite pins the bust's version to the poster's.
- ⚠ **`--vwd-band-h`, `--vwd-reel-return` and `--vwd-chrome-h` are NOT edited**
  — they are an accounting identity that keeps `--vwd-fig-w` byte-identical. The
  band's real growth is paid from the slot's width-bound slack and the band's
  own padding; the painted figure is unchanged at every rung.
- **This reverses his own U20 reel and U23's text stops**, by his choice.
- ⚠ **THE PHONE KEEPS U27's THREE-STOP TEXT REEL.** Five busts need ~58px
  with a name line against the phone's solved 44px stop: either the figure
  gives up ~14px of height (after U28 lifted it on his device read) or the busts
  shrink to ~42 × 28 with a 14px head, which is less clear than the text. The
  frame is `display: contents` below 701px and the bust `display: none` (with
  `loading="lazy"`, never fetched). Offered, not taken without a device read.

### D · TRANSMISSION is a pile of glass folder cards, and holds stills

**The record**: `film?: CharacterEraFilm` → `media?: readonly CharacterEraMedia[]`,
a closed union where each kind names the one transport the CSP allows — `embed`
(the nocookie player, the site's one third-party frame), `video` (self-hosted
mp4; `media-src` is `'self'`, so a CMS row for a video syncs its file into
`public/videos/voidwalker/media/`) and `image`. `isCharacterEraMedia` is the seam
a later loader validates rows through; `eraMedia()` is the one accessor (guarded,
then capped). ⚠ **`CHARACTER_ERA_MEDIA_MAX = 4` IS ARITHMETIC**: four staggered
tabs fit a card at the narrowest capable rung; a fifth runs off it.

**The lightbox** grows an `image` branch — the still WHOLE at its own shape, the
frame shrinking to it — pinned additive by a markup snapshot of the `src` and
`embed` branches committed first (nothing had pinned the dialog's own markup).

**The card** (`EraMediaStack`): one silhouette per card — a tab, a 45° slant, a
square body — glass clipped to it, the lip a CLOSED evenodd ring. The front card
carries the frame and the title INSIDE its body, in the reading face, wrapping,
never clamped; the cards behind stand empty, stepped up and to the right.

- ⚠ **TABS BY DEPTH, NEVER BY INDEX.** A card two deep is also shifted two steps
  right, so an index-ordered tab LEFT of the front one slides under it. By depth
  every tab is further right and further up than the one before it. Choosing a
  card rotates the pile (240ms, position only — no fade).
- ⚠ **THE RING IS CLOSED, AND ITS SLANT SHIFTS 0.414px.** `.pf-card`'s ring is
  the open form ADR-118 found paints a bow-tie across a concave outline, and this
  outline has two concave corners. A 45° edge offset 1px inward meets a
  horizontal edge at `1 − √2 = −0.414` — 0.586 is the chamfer-between-axis-edges
  case, which this is not.
- ⚠ **A BACK CARD RENDERS NO BODY** (the proof pile's own law: the glass looks
  onto empty folders), and **no player is ever mounted** — a card frames a STILL.
- ⚠ **EVERY TAB STAYS A BUTTON** (`aria-pressed`): a chosen tab turned into a
  label would unmount the element holding focus.
- ⚠ **IT FITS BY CONSTRUCTION.** ≥1101px the seat is a size container, the pile
  may not be taller than it, and the frame is the one flex item that gives.
  ⚠ Its `min-height: 72px` is load-bearing: an `aspect-ratio` flex item's
  automatic minimum is its transferred size, so without it the frame would not
  shrink at all. ⚠ `container-type: size` is gated to ≥1101 — ungated it computes
  the ≤1100 content-height bodies to ZERO. The phone seat hands its flex-shrunk
  height down the same way (a four-card pile ran 24.5px through the stage's
  floor at 375 × 553 under `overflow: clip` before it did).
- **The frost is front-card-only and waits for the seat's entry ladder** (`--ci`
  ≥ 0.6): an ancestor at opacity < 1 is the backdrop root. No id in that selector,
  so light's `backdrop-filter: none` (theme.css BLOCK 4d) can win.
- The head's tag reads the FRONT card's duration; an empty seat says "No
  transmission on record", and the phone's disabled tab notes "none".

### E · ON RECORD is tagged rows — superseding U29's bounded object

U29 heard _"a pill, like a sort of subtle button"_ and drew four borders round
each record with a square well for its mark; read live, those stacked boxes are a
slide's content boxes. A record is a ROW now: the outlet in a framed TAG (the
`/arcs` readout's framed key at chip scale), the year, a 7×7 pixel arrow ONLY
where the record links out (PT Mono has no U+2197), the headline under, one
`--vwd-rail` hairline at the row's FOOT. The well and the document mark go. What
U26 and U29 ruled about ink stands: dawn only, and the state is lines and ink
lifting to `--gold-line` / `--gold-ink`, never a fill, on anchors only.

### F · The figures: grade the light, code the screen

"Bake the light" narrows. The model draws the man in FULL COLOUR on a flat
`#0A28D2` ground (identity, wardrobe, pose); a deterministic grade calibrated on
the Architect makes him gold; the CSS half is untouched.

- **`gold.py`**: a luma curve and a gold ramp measured off the Architect's
  photoreal `canonical-02.jpg` against the model's own restyle of that exact
  frame, frozen as literals with their provenance. Held out on a 32px
  checkerboard they reproduce the restyle to **9.3/255** — the model disagrees
  with ITSELF by 19.6 re-drawing the same frame. His contour carries a
  highlight-weighted BLOOM (`0.695 · gauss(24.3px per 1280) * luma²`, 1.5 luma
  mean error; 12.5 off the face, 2.3 off the trousers), rebuilt through his own
  luma key so a new era composites over the corridor the way he does.
- ⚠ **A FINDING IT CORRECTS**: a first pass measured his edge as DARKER than his
  interior. That was against a matte thresholded from the restyle's own luma,
  whose boundary sits inside the glow; against his true outline there is no
  falloff, and the real effect is the opposite one — an outer bloom.
- **The exposure gate**: deep-interior p75 in [80, 130] and ≤12 % above 200.
  The Architect passes (his restyle ~91–103, this grade ~88–98); genai-v2 and
  expanse-v1 fail at 172 and 170. ⚠ **azeroth-v11 fails too, at 137.6** — not
  asked about and not touched; recorded.
- **The chain**: `env.py` reads the ONE canonical key file (names only, no
  fallback); `generate.py` labels every reference `IMAGE n — ROLE`, sends the
  key in the `x-goog-api-key` header, writes a prompt sidecar per draw, and its
  plate stage refuses references nobody has looked at; `refs.py` cuts each
  reference to its role (the painting BELOW its figure's beard — its face and
  skin are not his — and the other visitors out of the set frames); the plate
  locks name no artist, show or studio; `grade.py`'s plate gates are calibrated
  on the Architect's own source (26 % of his figure is under luma 16, so the
  crush gate is 30 %, not a round number that fails the reference); `sheet.py` is
  the blind pick sheet; `pokemon-go` is BLOCKED until its photograph lands.

### Guards

`character-eras` (the union, each kind's traps, files on disk, an image's size
read off the file) · `character-era-hologram` (`thumbPath`, `-v11`'s anchors and
exact fit) · `media-lightbox-markup` · `era-media-stack-markup` ·
`voidwalker-datum-sheet` (the closed ring, the 0.414 shift, the gated container,
the frame's minimum, no id on the blur rule, four tabs fit and a fifth does not,
rows not boxes) · `theme-css-sweep` now reads the datum sheet (it read the
figure's sheet and not the 2,300-line composition around it) · the weld and
boundaries specs · `scripts/capture-era-media.mjs` (fit gated on every rotation
at five shapes) · `probe-voidwalker-figure-span` (no era UNSEATED; heads on the
line, one disc line, the ring on the figure) · `gold.py --selftest`. The HUD
panel lab's containment gate measured the slot's BOX, whose transparent headroom
now passes the viewport's top by design; it measures the painted extent.

Measured at the end: eras probe clean at 1280 × 720 / 1101 × 800 / 1440 × 900
(tightest foot 26 / 51 / 58, TRANSMISSION now the tightest seat); the phone probe
identical but for TRANSMISSION (foot ≥ 121.7px); both handoff specs 11/11; the
panel lab's era surface 86 cells, 0 failures.

### Left open

- **G0 → the figures.** The blind pair (the grade beside the model's restyle) is
  with the owner, and heads the holo gallery as an `AWAITING` run beside the
  dry-run plate (a new `plate` kind, never under the treatment). ⚠ The preview
  sync shipped READING the in-repo root without declaring it, so its first run
  died on a ReferenceError; fixed, and it now keeps every blind sheet's
  `*-key.json` out of the served mirror. On his word: colour plates for `genai` and `expanse` (G1 pick),
  the route check against a model edit (G1b), Veo idles, the chroma matte and the
  grade (G2), the install (G3). ⚠ The install brings `stature` for the kneeling
  Expanse (`holoFigureHeadShare` becomes `fit × (1 − (footY − stature))`) and
  drops those eras' `.mov`s — HEVC alpha needs macOS VideoToolbox, so desktop
  Safari takes the floor for re-cut eras until a Mac cuts them.
- **2016** waits on his photograph.
- **The phone's gallery** (C) — his call on a device.
- **PRM is unlifted** (no hologram mode, so no lift), by the gate's design.
- **Nothing is pushed.**

## Update 32 — the film's title leads its frame, and the lede is the paragraph's own first line (2026-09-21, owner)

Owner, the same evening, on the live stage: _"the title of the video should be
above the video in all caps"_ — and _"the font-color / font-size of 'Venting
became a campaign' also feels VERY out of place"_, the SECOND read of that line
(U29 was the first).

**The title leads the frame.** `EraMediaStack` renders the title BEFORE the
frame in the front card's body, in capitals. Capitals are PT Mono's job on this
station — every other capitalised line is mono (the heads, the fact keys, the
tab, the outlet tags) and uppercase on the sans is a type-material finding
(ADR-092) — so his "IBM Sans or whatever" was read as the station's capitals
face; a third family here would break ADR-067's two-by-role law. It takes
`--track-label`, full-strength ink (one step above a fact key: it is the
record's NAME, not a label for one) and the LABEL ratio, `clamp(10px, 1.2svh,
15px)` from 1101px and `clamp(10px, 0.8vw, 12px)` below — capitals at the value
ratio's 18px would outshout the heads above them. It still wraps and is never
clamped; the frame is still the one thing that gives.

**The lede is the paragraph's own first line.** U29 said "the body's size" and
shipped a clamp of its own on the HEIGHT, `clamp(12.5px, 1.45svh, 17px)`: at his
1936 × 1002 window that measured **14.5px over an 18px paragraph** — a lede
smaller than the prose it opens — in gold, the only gold sentence on a station
where gold is the lit mark and nothing else (U23). It now reads the prose's own
token (`--band-copy`) and ink at full strength (the prose runs at .8), with
`--weight-lit` the one difference and `text-wrap: balance`. U29's reason for a
rung under — a 52-character motto on three lines — has no subject left: the
longest motto on the record is 45 characters, two lines.

Guards: the markup test pins title → frame; the sheet test pins the title's
face, case and tracking and the lede's size equal to the prose's with no gold;
`capture-era-media` fails a title whose ink does not end above the frame.
Measured after: the pile gates pass at 1936 × 1002, 1920 × 1247, 1280 × 720,
1101 × 800, 375 × 553 and 390 × 844; the eras probe is clean at five desktop
shapes (tightest foot 63px at 1101 × 800, 68 at 1280 × 720, SCOPE now the
tightest seat); the phone probe is clean.

**The Expanse drafts (U31 §C2) are drawn.** Six plates from the prompt locks in
`20260921-expanse-v3` — the owner ran the call himself when this session's
permission check stopped it as a paid transaction. Three kept his likeness (the
beard, the brow); three came back clean-shaven strangers. One of six held the
flat ground: the model drifts the blue off `#0A28D2` and lays a gradient on it,
so the chroma matte has to estimate the ground PER PLATE rather than trust the
lock. G1 is his pick.

- **THE RIFLE IS AN EDIT, NOT A RE-DRAW** (owner, 2026-09-22: _"the images you
  made were good, but only the gun needs to look more futuristic"_, with two
  photographs of production prop rifles). `generate.py --stage edit` changes
  ONE thing in plate F and writes into its own wave (`20260922-expanse-v4`) so
  the gates and the sheet read an edit as a plate; three edits kept his face
  pixel-for-pixel at sheet scale. ⚠ The edit is placed in the PICTURE's terms
  ("the right side of the picture, in the same hand") — plate F holds the rifle
  in the hand the plate lock did NOT name, and a prompt that says "right hand"
  invites the model to move it and redraw both arms. ⚠ The design is said in
  words as well as shown, so the edit holds without the photographs.
- **ROUTE B'S VIDEO STEP EXISTS** — `vid.py --stage plate` animates a plate with
  the ground-hold prompt and its own negative (`IDLE_NEGATIVE` bans
  "background", which fights a key ground), and `post.py --matte ground` keys
  every loop frame on ONE clip ground (drift reported), grades it on one
  exposure scalar, seats it on transparent padding and encodes every lane from
  RGBA. Proven on a synthetic clip of edit A (loop closed, drift 1.0, p75
  108.6, seated +35px, flicker 3.5, no fringe on the dark ground); no Veo clip
  exists yet.
- **AND IT SHIPPED AS `expanse-v2`** (owner: _"animate it like an idle, subtle
  movement"_). Edit A, a Veo idle, `post.py --matte ground`; installed with
  `stature` 1.0074 (crown→beard 0.1564 of its canvas against the Architect's
  0.136, over his 0.876 — larger than `footY`, because this canvas draws him
  15 % bigger). v1's five files are deleted from `public/` WITH its `.mov`, so
  Safari takes the floor for this era until a Mac cuts v2's.
  - ⚠ **TAKE 1 DROPPED THE HAND.** "The hand at the earpiece stays still",
    listed at the END of the prompt, was resolved inside two seconds into a
    calmer pose (hand at his side, head lifted) and held for the other six. The
    HOLD goes first now, in the picture's terms, and the moves are banned by
    name in an era negative (`PLATE_IDLE_HOLD`, `PLATE_IDLE_NEGATIVE_EXTRA`).
  - ⚠ **A SUBTLE IDLE NEVER COMES BACK.** 0.3/255 a frame, and the last frame
    2.0 from the first: no period for a trim and no tail for an overlap. It
    loops as a PING-PONG (`--loop pingpong`, 382 frames) — no seam, and none of
    a cross-fade's ghosting, which would have half-drawn the blink.
  - ⚠ **VEO LETTERBOXED THE PLATE.** 1536 × 2752 is 0.558 against 0.5625, and
    the 2–3px black bars key as FIGURE (black carries no blue); one survived the
    choke and put `rightX` on the canvas wall. The outer 4px are repainted with
    the ground before the key.
  - ⚠ **THE PHONE SEATS HIS STANDING HEAD, NOT HIS MUZZLE.**
    `holoFigureHeadShare` reads `footY − stature` when a stature is authored —
    here −0.012, above the canvas, which the standing guard would have called
    "no head" and dropped the column 40px. Standing eras are byte-identical.
    `HoloFigure` writes `data-vwh-stature` and `probe-voidwalker-figure-span`
    measures a kneeling era by the man it draws: one standing height 696.6px on
    all five (0.00 % spread), the disc line unmoved, the muzzle reported 77.5px
    under his standing head line.
- ⚠ **G0 HELD THE PLATES, AND THE PLATES NEVER DEPENDED ON IT.** Both gold
  routes — the deterministic grade and the model's own quiet edit — start from a
  colour plate, so the only step G0 decides is the gold one. A gate belongs on
  the step whose outcome it changes; holding everything upstream of it only
  spends the owner's evening.

## Update 33 — the piles stack on the record, the Expanse scouts and aims, and 2016 is drawn as a cel (2026-09-22, owner)

The owner, in one message: the Expanse idle reads as anxiety — _"he's just
sighing and breathing … I really want to have a pose where he looks around,
turns his head like he's scouting the thing, and then takes his gun to aim"_;
four more films for TRANSMISSION, so _"we can see the stacked effect"_; and for
2016, _"a Pokémon-style version of myself, similar to Ash Ketchum with a hat,
but … with my facial features"_. Two questions were put back to him and he
answered both: the look is ANIME, like the show, and the aim is PAST THE CAMERA.

### A · The piles stack on the record

`expanse` gains the set-visit film (`pNlYOGwt1nA`, 3:58) behind its front card;
`loop` gets its first pile, a keynote (`EQKIiqVyjJk`, 10:36) and a podcast
(`bouBxlVy3zc`, 1:02:11); `genai` gains the behind-the-scenes (`T6z9sbGl04Y`,
7:06) and its front film's own 2:55, which was never authored — the head's tag
reads the FRONT card's length, so the pile would have printed a blank tag on one
card and a time on the other. Titles are the sources' own words with the channel
suffix and HIS NAME taken off (two source titles were 63 characters against the
card's 60, and the station is already him). Posters are the videos' own
thumbnails, self-hosted at 960 × 540; the podcast's is pillarboxed as YouTube
shows it. The duration grammar takes `H:MM:SS` past an hour, two-digit minutes
only. ⚠ `capture-era-media --record` gates an era's OWN pile — every gate before
this ran on the lab's fixture, and a fixture that fits proves only that the
fixture's titles fit. Measured: every rotation of all three piles fits at
1280 × 720, 375 × 553 and 1920 × 1247, and the tag follows the front card.

### B · The chain: a scene, and a ground per era

- **A SCENE IS DRAWN WITH THE PLATE AS BOTH ENDS** (`vid.py --scene`). U14's
  refusal of `last_frame` stands for an IDLE — the model lands near the frame,
  not on it, and a near-still idle has nothing to hide the drift in. An action
  this big cannot come home by luck in eight seconds, so a scene is written to
  HOLD at both ends and `post.py --loop settle` dissolves the drift onto frame
  0 afterwards. ⚠ The seam is gated on the HELD second's own motion, never the
  clip's average, which an action inflates until any seam passes.
- **THE GROUND IS THE ERA'S** (`grounds.py`, one table for the prompt's words
  AND the key). Blue stays the default. The trainer's navy vest keys at α 0.27 on
  it and his jeans at 0.78, so he stands on MAGENTA, whose key `min(R, B) − G`
  leaves every colour he wears opaque. `gold.key_matte` keys any saturated
  ground; for blue it is exactly `B − max(R, G)`, and the blue plate's gates
  measure byte-identically before and after.
- **THE PLATE PREVIEW IS GRADED AT THE EXPOSURE THAT SHIPS** — solved as
  `post.py` solves it (one shared `solve_exposure`), where it was graded at
  1.0, a setting nothing ships at.
- ⚠ **THE BORDER REPAINT CAN CUT A FIGURE CLEANLY.** U32 repaints the outer 4px
  with the ground before the key; a muzzle that reaches an edge is not reported
  as touching it — it is cut there, and the matte looks perfect. Any ink within
  6px of a wall is a problem now.

### C · The Expanse scouts and aims

⚠ **TAKE 1 AIMED OFF THE FRAME.** Told in words to aim past the camera,
foreshortened across his chest, Veo swung the rifle out level to the RIGHT of the
picture and the barrel ran off the frame edge for ~2.7 s (f104–f156): the one
pose the stage cannot hold. A video model finds the physically easy aim, and the
easy aim from that grip is sideways. The action was otherwise right — he
listens, scouts, raises, aims and comes home.

**So the aim is DRAWN first, as a still** (`generate.py --stage edit --edit-kind
aim`), where the framing can be checked before a video is paid for, and the scene
runs from the plate TO that still (`--ending aim --last`) and loops as a
PING-PONG: both ends are holds, so neither turn has a velocity to bounce off.
⚠ **THE STILL IS THREE-QUARTER, NOT END-ON, AND IT FITS.** All three edits —
asked for "nearly end-on" — turned his torso toward the picture's right and kept
the carbine compact, which the arithmetic behind "past the camera" (a profile
aim from a square-on torso, ~0.95 m to the muzzle against a ~0.6 m column) did
not allow for. `aim_03` spans 0.087–0.900 of the width against the rest plate's
0.105–0.893 — no wider than the kneel — with the knee and the boot where they
were. The owner is told it is three-quarter, not past the lens.

⚠ **VEO MORPHS INTO A DRAWN LAST FRAME.** Take 2 listens, scouts, takes the
front grip, swings the rifle down and holds the aim from f122 — and from f171 the
front glove shifts and a skin-coloured patch opens on it as the model lands on
the still (frame motion 0.2 → 2.2). The aim is held and clean f144–f170 (0.21–0.40
a frame, the opening hold's own level), so the loop is a ping-pong CUT at f160
(`post.py --cut`): both turns fall on still frames, 320 frames, 13.3 s. The
lesson generalises: **a drawn last frame buys the framing and costs the landing,
so cut before the landing.** Graded like v2 (×0.85, p75 108.6, 3.1 % hot), seated
+54px; the mid-swing muzzle comes within 20px of the right wall and the elbow
within 10px of the left for under a second, where only the bloom (≤ 37/255)
reaches the canvas edge.

⚠ **T2 JUDGES A SCENE BY ITS MEDIAN FRAME.** The interior flicker gate exists to
catch a grade that strobes, and on an idle the mean is that measure; a scene's
mean is its action. The swing reads 10.2 and the three holds 2.1–3.1, against
v2's idle at 2.47 — so a scene (`settle`, or a `--cut` ping-pong) is gated on the
median (5.75 here, against 6.0), and both are printed.

⚠ **`stature` WAS RE-MEASURED, NOT INHERITED.** v3's frame zero matches v2's head
band to 0.996 alpha IoU at zero offset, the crown on the same row, so 1.0074 and
the thumb's marks carry over as a measurement. `headY` 0.0875 is the rifle
mid-swing; the stature, not the ink, is what seats him.

### D · 2016 is drawn as a cel

Six plates on magenta from `20260922-pokemon-go-v1` (his face and his boots as
the only references — a picture of the character the costume echoes is exactly
what the no-names rule keeps out). The key cut all six whole. ⚠ **EVERY PLATE
GRADES HOTTER THAN THE ARCHITECT**, even drawn in the deep palette: at the
lowest exposure the chain allows (×0.85) three sit inside his p75 band (109–122)
but all six carry 15–22 % of their deep interior above 200 against his 4 % and
the gate's 12 %. The hot pixels are flat SKIN — the bare forearms of a
short-sleeved vest, a drawn face larger than a photographed one — and the cap's
off-white panel; a cel has no shading gradient to hold them down. Reported, and
shipped on the owner's eye rather than re-lit, because widening the clamp is the
histogram match this chain refuses. ⚠ The sheet's skin-blob face finder took the
CAP on three of six; the likeness was judged on hand-cut heads. The pick is
plate 2 (the brows, the hooded eyes, the beard thinning at the cheeks, and the
lock's own pose: the ball at chest height, the other hand on the brim).

⚠ **VEO REFUSED THE FIRST IDLE ON ITS AUDIO.** No video, "an issue with the
audio for your prompt", uncharged. Veo always draws a soundtrack and the
Developer API will not take `generate_audio`, so the sound is DIRECTED
(`PLATE_IDLE_SOUND`: near-silence, no music, no voice) and music is banned in
the era's negative — the likeliest reading is the audio model reaching for a
cartoon's theme song. The retry rendered: the brim hand holds, the ball turns in
his fingers, the grin warms, and the drawing does not boil. A ping-pong, 382
frames; ground drift 1.0, seat +9px, flicker 1.45.

**Installed as `pokemon-go-v1`** — standing, so no `stature` (`headY` 0.0148,
`footY` 0.9953), thumbed off the CAP's top with his drawn head larger than a
photographed one (0.175 of the canvas against the Architect's 0.136), and the
loadout re-lettered to what the plate shows (U13's rule; it letters nowhere on
the sheet). **`loop` is now the only era on the canonical pair — it IS the
Architect.** No `.mov`: Safari takes the floor for both new figures.

### Verified

Era suites 96/96 and `tsc` clean. The figure-span probe at 1920 × 1247 paints
one standing height on all five (696.6px, 0.00 %), every era uncut, heads
258.2–261.8 against the stage top at 263.4. The eras probe is clean at 1280 × 720
and 1101 × 800 with four panels on EVERY era now (the Architect's TRANSMISSION
seat held an absence before) and the tightest foot unchanged at 68 / 63px. The
phone probe fits at every shape, era and tab. The station walks with the handoff
`ready` and `pinned` 0 at all five era centres. The gallery shows both runs, and
the mirror still keeps a blind sheet's key out (404).

### Left open

- The Expanse aims three-quarter to the picture's right, not past the lens as
  the owner chose; it is what fits and what both models drew. A true end-on aim
  is a re-draw of the still.
- The trainer's hot share (15.3 % against 12 %) ships on the owner's eye.
- ⚠ **One intermediate commit is not self-consistent**: the v2 deletions were
  staged before the chain commit (11026ec4) and landed in it, one commit ahead
  of v3's files (0f11ef2f). The tip is correct; history was not rewritten in a
  tree two sessions share.
- Safari `.mov` for `expanse-v3` and `pokemon-go-v1` needs a Mac.

## Update 34 — every folder the same, one bucket for one film, and the Expanse commands (2026-09-22, owner)

The owner, on U33 live: TRANSMISSION's notch — _"look at this as a digital
folder, and every folder looks the same. The notch is the same in every
structure … stack it from a different vantage point, so you can still see the
stack thing"_, with a reference of identical folders cascaded down-right, every
tab readable; the Twitch recording of his class, _"add that to Supabase and then
add it here"_, plus two more films; and the Expanse as _"more like a general or
commander, maybe holding my gun but then pointing in the distance, giving
commands. Make it subtle … Maybe I shouldn't be kneeling."_ Asked how the
recording should be served, he answered **stream from Supabase**.

### A · Every folder the same, on a diagonal

**This reverses U31's "tabs ordered by depth, fanned along the top edge".** U31
drew the front card's tab wide (`■ FILM 01`) and each card behind as a narrow
index fanned to its right, so a reader could see "02" — which he understood and
rejected: that is not what a folder looks like.

- **One card, one tab.** Every card is `W − (n−1)·dx` wide; every tab sits
  flush at its card's top-left and is `--_wt` wide, solved ONCE from the widest
  designation (`IMAGE NN`: 7 mono advances + the mark + the slant), so every
  notch is the same notch. The silhouette is six points — `(0,0) (w−t,0) (w,t)
(100%,t) (100%,100%) (0,100%)` — and the lip stays U31's CLOSED evenodd ring
  with the slant's inner ends at −0.414px.
- **The cascade.** The card at depth `d` sits `d` steps up and left of the
  front one: `--vwd-mstack-dy` IS `--vwd-mtab-h`, so each tab behind reads WHOLE
  just above the card in front (his reference's read), and `--vwd-mstack-dx`
  (`clamp(10px, 1.2svh, 18px)`) leaves a sliver of each card behind on the left.
  The pile's padding is the cascade's own extent, so the front card's box is
  where the cards are.
- **One notch, one state.** Every tab letters `■ KIND NN` (the index only where
  there is a pile); the mark is gold on the open card and dawn behind. Every tab
  stays a `<button>`; a back card still renders no body; the rotation is a 240ms
  position-only ease.
- ⚠ **THE TAP TARGET CHANGED WITH THE GEOMETRY.** A back tab's `::after` spans
  two tab heights and is clipped by its card's silhouette; the old downward slop
  is gone, because the area under a back tab now belongs to the card in front.
- ⚠ **THE CAP IS A HEIGHT NOW: 4 → 3.** Each card behind costs the front frame
  one tab height. At 1280 × 720 (seat 194.7): one card's frame is 113.9 (100.4
  with a two-line title), two are 91.9 (78.4 two-line), three are **72.0 — the
  floor, exactly** — and four break it. The phone (`--vwd-mpad` 12 → 10) draws
  at most two; a third is reachable by rotation (`[data-vwd-media-depth="2"]` is
  `display: none` there). The lab's `?media=` and `capture-era-media --piles`
  take 0–3 and refuse the rest, because a pile the lab will not mount is a still
  of the wrong subject, gated green.
- **Guards.** The markup test pins `KIND NN` and exactly one lit mark; the sheet
  test pins the six-point silhouette, the ring, one tab width, the step equal to
  the tab height and the cap's arithmetic; `capture-era-media` asserts identical
  card and tab boxes, each card exactly one step up-left of the next, every back
  tab SEEN WHOLE (an `elementFromPoint` hit test at four inset points — a tab can
  sit inside the pile's box and still be covered) and the pile inside its seat.

### B · Three more films, one of them streamed from Supabase

- **2016** gets its first pile: _Pokémon GO hunt in the Zoo of Antwerp (2016)_
  (`tRdaNTpxmR8`, 0:55). **2020** gets the Thomas More film (`qm4KlfvJc9A`,
  2:02); its source title is 64 characters against the card's 60, so "my
  classes" came out. **Every era carries a pile now.** Posters are the videos'
  own thumbnails, self-hosted at 960 × 540.
- ⚠ **`media-src` NAMES ONE REMOTE HOST, BY OWNER RULING.** This reverses the
  2026-09-01 pin that no http(s) origin may ever join it — made on his
  instruction, and made narrow: `https://ehijwavsxbvnxsrunegu.supabase.co`, the
  site's own project, named in full. **Never the `*.supabase.co` glob** that
  `img-src` and `connect-src` carry — that would let any project on the platform
  serve video here. `security-headers.test.ts` pins it from both directions
  (that origin, no other, no wildcard).
- **The registry carries its own copy** (`ERA_MEDIA_STORAGE_ORIGIN`; the file
  imports nothing), asserted equal to the CSP's `ERA_MEDIA_ORIGIN`. A `video`
  may name a PUBLIC `.mp4` in the `era-media` bucket and nothing else: another
  project, another bucket, a signed object (it expires), plain http, a `.webm`
  and a path that climbs out are each refused by the guard. **The poster stays
  self-hosted** — it is the one request a card makes at rest, and it may not be
  the page's first third-party call.
- ⚠ **A POLICY WIDENED FOR ONE FILM IS PROVEN BY PLAYING IT UNDER
  ENFORCEMENT.** `sweep-csp-enforced.mjs` now seats `#voidwalker`, picks
  `--era-media` with the KEYBOARD (the reel keeps two chips outside its clip, so
  its first cut — a pointer click — never changed the era, and its silent catch
  hid that), opens the pile's FRONT card and counts requests to the bucket's
  host. Zero requests means the step proved nothing about the widening, and it
  says so.
- **The recording itself is PENDING.** Its filename names the game, and the
  standing hook refuses any command that does; the owner copies it under a
  neutral name, and the upload, the card at the FRONT of 2020's pile and the
  sweep's step against it follow.

### C · The Expanse commands, standing

A pose EDIT of plate F — the plate that holds his likeness and the rifle he
approved (`generate.py --edit-kind command`, `EDIT_COMMAND`). Three draws;
`command_02` is the only one drawn exactly as asked (the rifle on the picture's
right, the point to its left) and it garbled the cap's lettering; `command_03`
grew a ghost rifle and boot; so `command_01` (ink 0.123–0.891 of the width).
⚠ It is the MIRROR of the request — the point on the picture's RIGHT, the rifle
in the hand on the LEFT — so the idle is written in that picture's terms, never
the edit's.

⚠ **THE FIRST PLATE HAD HIM MID-WORD, AND VEO GAVE HIM A VOICE.** `EDIT_COMMAND`
allowed "his mouth closed or just parted as if giving the command", and the
model drew the parted, speaking mouth. Veo starts ON that frame and always draws
a soundtrack; every idle from it came back refused on the AUDIO, uncharged —
five takes: the plain wording, a directed near-silence, physical-only verbs, the
prop wording, and a clause that his lips stay closed. **A first frame outranks a
sentence.** `--edit-kind mouth` (`EDIT_MOUTH`, one change) closed the lips —
silhouette IoU 0.998 against its source, the ink bounds unchanged — and the idle
rendered on the first try. The clause in `EDIT_COMMAND` is fixed so a redraw
cannot bring it back.

⚠ **TAKE 1 RAISED A FINGER.** Told the pointing hand "moves forward a finger's
width, slowly, and settles back", Veo swung the forearm upright into a raised
index finger ("wait") at 1.25 s and held it to 4.5 s — the hand's reach fell
0.890 → 0.81 of the canvas. **A pointing hand is the most gesture-shaped thing in
the picture, so it gets no motion of its own**; take 2 bans the upturned finger
by name and holds the point f0–f175 (reach 0.885–0.907), dropping the arm only
from f174. Its lids lower three times for ~0.7 s — slow blinks at a size (the
eyes are ~5px at the stage's scale) that reads as life, not fatigue. ⚠ **A HOLD
IS JUDGED BY TRACKING IT**, per frame, not by a strip of eight frames — a strip
can land on both ends of a gesture and look held.

**Installed as `expanse-v4`** — a ping-pong cut at f168, inside the hold: 336
frames, 14 s, seam 0.63. Graded ×0.85 (deep-interior p75 129, 7 % above 200 —
hotter than v3's 109, inside the gate), seated +49px, flicker 1.33, ground drift
1.0, ink 0.125–0.918 of the width (the pointing hand 59px inside the right
wall). **He stands, so there is no `stature`** — `headY` 0.1047 is the cap's
glow at the anchor's α ≥ 32, over the head's own columns, and the span is his
own cap-to-soles. **No era kneels now**; the kneeling law, its code and its unit
fixtures stay for the next one that does. The bust is re-marked off v4's own
frame zero, never carried from the kneel. v3 is archived to
`waves/_shipped/expanse-v3`. Spend: three command edits, two mouth edits, two
idles — about $7.10, the envelope the owner approved with one re-take.

### Verified

Era, hologram, pile, sheet, CSP, theme and type suites 221/221, `tsc` clean. The
figure-span probe at 1920 × 1247 paints one standing height on all five (696.6px,
0.00 %; the commander's fit 0.8245), every era uncut, the disc line 954.8–958.4.
The eras probe is clean at 1280 × 720 and 1101 × 800, four panels on every era,
the tightest foot unchanged at 68 / 63px. The phone probe fits at every shape,
era and tab. `capture-era-media --record` passes every rotation of every era's
own pile at 1280 × 720, 1101 × 800, 1920 × 1247, 375 × 553 and 390 × 844, and the
fixture at the cap passes at 1280 × 720 (frame 72.0), 375 × 553 and 1920 × 1247.
The enforced production build serves `media-src 'self' blob: data:
https://ehijwavsxbvnxsrunegu.supabase.co`, and `sweep-csp-enforced.mjs` is
CLEAN against it — nine routes in both themes (the owner's `/arcs` on a signed
pass), the walkthrough, and the TRANSMISSION step opening 2020's front card.
⚠ Its request count to the bucket is **0**, which is the step stating what it
did not prove: until the recording is uploaded, nothing on the site asks that
host for anything.

### Left open

- The Twitch recording (§B) — the file, the bucket, the card, the sweep's step
  against it.
- Safari `.mov` for `expanse-v4` needs a Mac.
- The commander grades hotter than v3 (p75 129 against 109), inside the gate.

## Update 35 — the Expanse performs, the record is cards, the facts are one grid, the pop-up sits in a frame, and the disc is gone (2026-09-22, owner)

The owner, on U34 live, with four references (the Architect's stage, the
Ripperdoc's OWNED/STORE list, Starfield's status grid, a framed lightbox): the
Expanse _"I feel like I'm floating. I should be more steady, and I look like a
zombie … I need to use my headpiece to voice commands. I need to look through
my weapon. I need to point"_; ON RECORD _"look like cards … on the left side, a
thumbnail, and then we need a title and then the medium"_; FACTS _"icons, make
a bit of a grid … factual and needs to be uniform. Command posts, that's a bit
vague"_; the pop-up _"needs to be uniform. It also needs to sit in a frame"_;
the disc _"if it's a separate element, I would just remove the circle"_; and
_"make sure that every video has a proper thumbnail, because some of them
don't"_. Asked, he chose **a drawn mark per card** for the press thumbnails and
**Base · Move · Reach · Result** for the facts, with the values below.

### A · Every thumbnail loads

⚠ **THE BLACK THUMBNAIL WAS A STUCK OPTIMIZER JOB, NOT A MISSING POSTER.** All
eight posters were fine on disk. After a rotation the new front card's lazy
`next/image` asked the dev optimizer for `film-leverage-ai.jpg` at `w=640` as
WebP, and that ONE key never answered (60 s) while every other encoded in
11–40 ms — reproduced in the browser pane, then with `curl` carrying the
browser's own `Accept` header. A restart clears it; the durable fix is not
depending on the optimizer at all: the card's still and the framed dialog's
still are `unoptimized`, served straight from `/public` (the posters are
already 960 × 540 and the registry pins them ≤120 KB). The markup test pins the
raw `/images/voidwalker/media/…` src and no `/_next/image` srcset; the capture
fails a front still that has not decoded 3 s after any rotation.

### B · The disc is deleted, and the seat is kept

The disc, its ring and its glow (`.vwh__base__disc` / `__ring` / `__glow`) and
the gold projection cone (`.vwh__cone`) were DOM paint — U2's mock of a
brandmark descent — never part of any video. They are deleted from
`VoidwalkerHologram`, `HoloFigure`, both sheets and the three labs' hand-copied
columns. ⚠ **THE `.vwh__base` BOX STAYS, UNPAINTED**, because five things read
it: the slot's floor, the desktop lift (U31), the reticle's centre, the phone's
column translate (U28) and the About handoff's portrait seat. Removing the
paint and keeping the box moves none of them — the figure-span probe measures
the seat at 960 on every era, byte-identical. The probe's disc query is
re-pointed at the seat line and its "one disc line" check is "one seat line",
so it still asserts something. `.vwh__ground` (the floor branch's compositing
floor) and `.vwh__edge` (the era click's materialize line) stay.

### C · FACTS is one grid of four, on one schema

**This reverses U23's readout rows.** Every era carries the same four keys, in
order — `CHARACTER_ERA_FACT_KEYS`: **Base · Move · Reach · Result** — so a
reader can compare eras cell for cell, where U23's per-era keys could only be
read one era at a time. Starfield's grid: two cells a row, a mark and the mono
key on one line, the value under it, every cell ending on its own
`--vwd-rail` hairline. `minmax(0, 1fr)` on both columns is load-bearing.

| era  | Base                   | Move                                       | Reach                             | Result                                |
| ---- | ---------------------- | ------------------------------------------ | --------------------------------- | ------------------------------------- |
| 2026 | Loop Earplugs          | Maps which setup runs which workflow       | 22 teams briefed                  | 47+ Skills encoded                    |
| 2023 | Starhaven              | Belgium's first hybrid AI-video production | Under Armour, with Anthony Joshua | UBA/ACC AI Charter, co-drafted        |
| 2020 | Thomas More            | Taught inside Azeroth                      | Two courses                       | Built into the calendar               |
| 2018 | Reddit, then a Discord | Flew to LA, in front of Jeff Bezos         | Past 100,000 signatures           | Three more seasons                    |
| 2016 | Antwerp                | Co-founded Pokémon GO Belgium              | Sixteen thousand at the zoo hunt  | Belgium's first Pokémon GO consultant |

⚠ "22 teams briefed" and "47+" are the casefile's published canon and the
test pins them; the 22-BRIEFED wording stays distinct from the 14 teams using
the layer. Where the record has no count (2020, 2023), the value states scope
in words rather than inventing one. ⚠ The phone keeps TWO columns: its RECORD
tab measured fit at every shape and era (tightest 86px at 375 × 553), so the
recorded one-column fallback was never needed — and RECORD takes one section
gap above ON RECORD's head, because a grid ending on a row of cell rules made
the next head read as a fifth fact.

### D · ON RECORD is cards

**This reverses U31's tagged rows, by his ruling, and it is not U29 come
back.** U29's well held a DOCUMENT mark that said nothing the headline did not;
this card's thumbnail is its PICTURE — what KIND of coverage it was — and the
outlet reads under the headline as the MEDIUM, the Ripperdoc row's own order.

- **The card** (`.vwd__pcard`): a four-sided outline on the region rule, NO
  ground (the >700px sweep and the station's older law: an outline is not a
  ground), square, the air between cards the divider. The thumbnail well on
  the left, the headline in the display face (wraps, never clamps), the medium
  in mono caps (`OUTLET · YEAR`), ↗ on linked cards only. The state is the
  outline and the ink lifting to `--gold-line` / `--gold-ink`, on anchors
  only; the Gazet van Antwerpen card links nowhere and keeps its outline.
- **One mark per KIND**, from a zero-import `VW_OUTLET_KIND` beside `OUTLETS`
  (newspaper: Gazet van Antwerpen, De Standaard, De Tijd, HLN · magazine: MIT
  Technology Review, Newsweek · broadcast: CNN), pinned total over `OUTLETS` by
  the record test.
- ⚠ **THE WELL IS PADDED, NEVER CENTRED.** A 21px mark centred in an even box
  lands on a half pixel and every rect goes soft, so the well is
  `content-box`, the mark's own size plus `--vwd-pcard-pad` (10) plus its
  border — 43px by construction. The sheet test pins the padding and bans a
  centring property on the well.
- The retired names — U29's `__well` / `--vwd-press-well` / `__glyph`, U31's
  `__tag` / `__meta` / `__headline` — are banned by name in the sheet test.

### E · The seven marks

`lib/voidwalker/eraMarks.ts` (zero-import): four fact marks (Base a pin, Move a
stepped route, Reach a burst, Result a flag) and three outlet kinds
(newspaper, magazine, broadcast), on the particle-icon grammar — 7 × 7, a
skeleton, a 1–3 pixel signal, a 1–2 pixel drift one step along one axis and
never on the form, ≤16 skeleton + signal pixels. **Dawn only**: gold on this
station is the era band's "you are here". `EraMarkSvg` renders them rect-only
with `crispEdges` and no text node; the sheet owns the three-layer dawn ladder,
so light re-derives it through the token. `era-marks.test.ts` pins the lattice,
the counts, the drift law and that no two marks are the same. ⚠ **THE CONTACT
SHEET, JUDGED UNLABELLED, IS WHAT MADE THE MAGAZINE** — its first cut read as a
"C", its second as a person (it mirrored the phone's figure tab), its third was
17 pixels; the fourth, a masthead over a framed picture, is 16.

### F · The pop-up is the card at dialog scale

`MediaLightbox` gains an optional, ADDITIVE `frame={{ tab }}`. Omitted, every
other caller renders byte-identically — the `media-lightbox-markup` snapshots,
taken before `frame` existed, pass untouched. Given, the dialog is the
TRANSMISSION card: the folder silhouette (tab flush top-left, its 45° slant,
the body), the glass, the CLOSED lip ring with the slant's inner ends at
−0.414px, the tab lettering the card it came from (`■ FILM 02`, the index only
where there is a pile — `EraMediaStack`'s own rule), the title in mono caps
over the picture, and **ONE 16:9 box that a film, a self-hosted video and a
still all fill the same way** (a still `contain` on black, both themes —
kept-dark imagery). The era stage's `MediaDialog` passes it for all three kinds.

- ⚠ **THE BOX IS SIZED BY WIDTH AGAINST THE FRAME'S HEIGHT**: the card is the
  smallest of `1120px + 2·pad`, the viewport, and the width whose 16:9 box plus
  the card's chrome (tab band, three pads, two title lines) fits the viewport's
  height. Measured: 950 × 534.3 at 1280 × 720, 990.6 × 557.2 at 1101 × 800,
  1120 × 630 at 1920 × 1247, 323 × 181.7 at 375 × 553, 334.4 × 188.1 at
  390 × 844 — where the unframed dialog's `max-height` broke a film's ratio at
  1280 × 720.
- ⚠ **THE MATERIAL IS THE CARD'S `::before`, NOT ITS OWN BACKGROUND.** A
  `clip-path` clips a box's children too, and CLOSE sits in the band right of
  the tab, outside the silhouette; so the silhouette cuts the material layer
  and the ring, and the card itself is unclipped. CLOSE stops 6px above the
  body's lip, so its border and the lip never meet as a doubled rule; its hit
  area is 10px proud on every side for the phone's 44px.
- ⚠ **NO BOX-SHADOW — A DEPARTURE FROM ADR-006, NAMED.** A clipped silhouette
  cannot carry one, the dashed border is the unframed dialog's grammar, and the
  scrim at .82 with its blur lifts the card already.
- ⚠ **PORTALLED, SO NOTHING FROM `.vwd` RESOLVES**: the block is global
  (`.fl-lightbox--frame`, in `casefile.css` beside the dialog it varies), reads
  the global ramp, and theme.css re-derives its bloom and glass for light as it
  does the pile's.
- A YouTube embed paints black for a beat before the player draws — seen in a
  capture and checked live: the film plays inside the frame.

### G · The Expanse performs, standing (`expanse-v5`)

A SCENE, not an idle: he holds the point, presses the earpiece and gives a short
order, takes the front grip, raises the rifle and looks through its optic
toward where he pointed, and holds the aim. The end pose is DRAWN first
(`generate.py --edit-kind aim-stand`, `EDIT_AIM_STANDING`, an edit of
`plate-expanse-mouth_01`); of three draws `aimstand_03` keeps the legs (IoU
0.979 against the plate) with 280 / 137px of margin. `vid.py --scene --ending
aim --last` runs plate → pose on the commander's `PLATE_SCENE_AIM`: feet
planted, no sway, no bob, **eyes open and alert with normal quick blinks** —
slow blinks, drooping lids and eyes closing banned by name, which answers "a
zombie" (v4's three ~0.7 s lid-lowerings). ⚠ **THE ORDER IS MOUTHED UNDER
DIRECTED NEAR-SILENCE**, the one form a speaking beat can take after five
audio refusals in U34 (a first frame with a parted mouth gets a voice drawn);
it passed, and the listening fallback (`vid.py --listen`,
`PLATE_SCENE_AIM_LISTEN`: he tilts his head to it and nods, lips closed) was
never needed.

Judged by TRACKING: the soles move 0.000 over the whole clip, the rifle's ink
reaches 0.926 of the width, the aim holds f152–176 and Veo's landing morph
starts at f178 — so the ping-pong cut is at f168, inside the hold. Installed:
336 frames, closed, seam 0.675; ground drift 2.0; graded ×0.85 (deep-interior
p75 129.6, 7 % above 200); seated +49px; flicker median 4.12 (a scene moves);
anchors `headY` 0.1039, `footY` 0.9953, ink x 0.1056–0.9319. He stands, so no
`stature`. The bust re-marks off v5's own frame zero (head-band IoU 0.9946
against v4's marks). v4 is archived to `waves/_shipped/expanse-v4`; the holo
gallery carries `ex-v5` as SHIPPING and `ex-v4` as SUPERSEDED. Spend: three
edits and one scene, about $3.60, inside the envelope he approved.

### Verified

Era, hologram, pile, dialog, sheet, record, marks, CSS-sweep, type and
phone-unit suites 257/257; `tsc` clean in the source (two errors are the
generated `.next` route types, which the other session's new
`/test/arcs-instrument-kit` put out of step between the dev and build folders).
The eras probe is clean at 1280 × 720, 1101 × 800 and 1920 × 1247, four panels
on every era, the tightest foot 68 / 63 / 162px — Scope's, unchanged; the grid
is never the binding seat. The figure-span probe: one height on all five
(696.6px, 0.00 %), one seat line (960), the ring on the figure. The phone probe
fits at every shape, era and tab. `capture-era-media --record` passes every
rotation of every era's pile AND every framed dialog at 1280 × 720,
1101 × 800, 1920 × 1247, 375 × 553 and 390 × 844, and the fixture at the cap
(two films and a still) passes at 1280 × 720 and 390 × 844 — the still's box
the films' box to the pixel.

### Left open

- The Twitch recording (U34 §B) still waits on the owner's copy of the file.
- Safari `.mov` for `expanse-v5` needs a Mac.
- The phone's new cards and grid are unread on a device.

## Update 36 — a panel head is its name and its rule (2026-09-22, owner)

The owner, pointing at SCOPE's `2020`: _"We don't need these little numbers in
either scope, transmission, or facts on RECORD. Just like the subtitle or
whatever."_ The right-hand tag is **deleted on all four heads**:

- SCOPE's year (U23 moved it there when the eyebrow went)
- FACTS' era name (`era.short`)
- TRANSMISSION's front-card duration
- ON RECORD's `NN items`
- the `None` that TRANSMISSION and ON RECORD printed for an empty seat (U20)

Each one said something the stage already says:

- The band letters every year and names the open era.
- The cards count themselves.
- An empty seat is said by its body's own line (`No transmission on record`,
  `No press on record`).
- U20's reason for `None`, telling "no transmission" apart from "a film with
  no duration", had lapsed: every era has carried a pile since U34.

⚠ **The duration is now lettered nowhere.** `eraMediaDuration` stays in the
registry and its test, because the record still holds the value; only
`HoloDatumPanels`' read of it went.

⚠ **Nothing moves.** The kicker was always the taller line in each head:

- all four heads measure 39.5px tall, as before
- the eras probe reports the same headroom (68px at the tightest, 106px on
  the Architect)

The sheet test pins the absence in the CSS and in the component source. The
capture script's tag read is gone (it logged the tag and never gated on it).
The hud-panel lab's `?ink=oxide` rule loses its dead selector.

## Update 37 — the record cards take a notch, top-right (2026-09-22, owner)

The owner, on a press card: _"the record buttons need a notch"_. **This
reverses U29/U35's "square", by his ruling.** It takes the corner he has kept
every other time (the proof card, ADR-097 U1; the arcs plates, ADR-098 U5): the
TOP-RIGHT, the upper end of ADR-065's lawful TR + BL diagonal. A single notch
means oriented-or-connected, and each of these records links out to its
article. What sits inside stays square (rule 4): the well, the text.

- ⚠ **The edge is a ring, not a border.** A `clip-path` cuts a border and never
  strokes the diagonal (ADR-089). The outline is therefore a CLOSED evenodd
  ring on `.vwd__pcard::before`, with the diagonal's inner ends shifted by
  0.414px (the TRANSMISSION lip's own derivation). The card itself is NOT
  clipped, so nothing it holds can be cut. The border's 1px moved into the
  padding, so every box inside sits where it did: 117.5px and 71.6px cards
  before and after.
- **The notch:** `--vwd-pcard-ch: clamp(10px, 1svh, 14px)`. That is 10px at
  1280 × 720 and 12.7px at the owner's viewport.
- ⚠ **The arrow steps clear of the cut.** It sits in that corner, and ADR-098
  U5's lesson applies: a cut is free only where nothing is set against it.
  Seated on the padding alone, its tip came within 2.8px of the diagonal at
  1280 × 720. The fix is `margin: 2px 4px 0 0`, measured 7.1px clear there and
  9.4px at 1936 × 1273; the 2px also sits it on the title's cap line.
- **The state:** the ring lifts to `--gold-line` on anchors only, diagonal
  included. The focus outline stays as the keyboard indicator.
- **Guards:** the sheet test pins the outer contour point for point (TR alone),
  both contours closed, the 0.414px shift, no `border` and no `clip-path` on
  the card, and the arrow's step. The hover guard admits exactly one
  `background`: the ring's line, on `::before`.

Verified:

- the eras probe clean at 1280 × 720 and 1101 × 800 (tightest foot unchanged,
  68 / 63px)
- the phone fits at every shape, era and tab (RECORD tightest 86.1px at
  375 × 553)
- stills at 1920 × 1247 in both themes, at rest and on hover

## Update 38 — the band's foot mirrors the title's datum (2026-09-22, owner)

The owner, on the stage at his 1936 × 1221: _"we can move the elements a bit
up. If we move Transmission and On Record a bit up, then the thumbnails at the
bottom can also move up … they have the same margin at the bottom relative to
the margin above the Intelligence Architect title … Really follow design,
frontend, responsive best practices here."_

**Measured before.** The title's box hung from `--hud-corner-foot` (99px at his
window; U22's mast datum). The band ended flush with the frame's floor, so the
five names' last glyphs sat ~12px off it. The two margins were 106px and 12px.

### A · The foot is the mast's datum, mirrored in ink

`--vwd-foot` is how far the band's last glyph stands above the floor:

```css
--vwd-foot: min(
  calc(
    var(--vwd-mast-top) + 0.16 * var(--vwd-title-fs) - var(--vwd-band-pad-b) - 0.36 *
      var(--vwd-name-fs)
  ),
  max(0px, (100svh - 720px) * 0.4)
);
```

- ⚠ **In ink, not in boxes.** The title's caps start 0.16 of its size below its
  box (PP Neue Montreal at 1.1), and the names' caps end 0.36 of theirs above
  their line box (PT Mono at 1.25). Both were measured off the pixels at
  1920 × 1247 (7px and 4.3px). A box mirror would leave the bottom ~11px lighter
  than the top at every size.
- **`--vwd-title-fs`** is the title's clamp as a token, so the foot can read it.
  It stays byte-locked to `.voidwalker__name`, because the About name translates
  into it without scaling.
- The foot is `0px` on `.vwd` and set only inside the hologram rung's gated rule
  (`min-height: 720px`). The phone, 701–1100 and every fallback are untouched.

### B · Paid by the panels, never by the figure

Padding the sheet's bottom was the obvious move, and it would have shrunk him:

- The figure's slot is the stage's full height, and it was only 24–33px taller
  than his width-bound picture at the desktop rungs
  (`--_pict = min(fig-w · 16/9, slot)`).
- Raising the band ~88px would tip him height-bound, ~7.7 % smaller, silently.
- The portrait handoff would then land a card larger than the hologram it hands
  over to.

What ships instead:

- **The band leaves the flow.** `position: absolute; bottom: var(--vwd-foot)` on
  a `position: relative` sheet, both gated on `#voidwalker[data-vw-mode="hologram"]`.
- **The stage gains a fifth row** for the band's zone,
  `calc(var(--vwd-band-box) + var(--vwd-foot))`, and the figure spans
  `grid-row: 1 / 6`.
- **The arithmetic.** The stage grows by the band's height, and rows 1–4 lose
  exactly the foot, half from each body. That is what lifts TRANSMISSION and ON
  RECORD, by `foot / 2`; their floors rise by the whole foot. The figure's cell
  grows by the band's height, and U31's lift is solved from the cell, so the cap
  stays on the head row and the boots stay on their line. Measured slack under
  the picture is now 120.6 / 116.5 / 118.1px at 1920 × 1247 / 1920 × 1080 /
  1280 × 720 (it was 24–33), with one figure height and 0 cut on every era.
  `--vwd-fig-w` and `--vwd-chrome-h` are untouched.
- ⚠ **`--vwd-band-box` is derived from the tokens that draw the band.** The
  row must know the band's height before the band is laid out, so the ≥701
  band's padding, the chip's gap and the name's size and leading became
  `--vwd-band-pad-t` / `-pad-b`, `--vwd-chip-gap`, `--vwd-name-fs` /
  `--vwd-name-lh`. The band, the chip and the name READ them. A second literal
  copy anywhere is the drift this exists to prevent. `44px` is the chip's own
  `min-height`.
- ⚠ **Layout, never transform.** The About handoff reads OFFSET geometry, and
  §G owns every transform on these boxes.

### C · Exact from ~900 tall; eased below

The full foot costs each body row half of it, and the shortest reference cannot
afford that:

- At 1280 × 720 the full foot is ~61px, i.e. ~30 off each body.
- That is all of the frame a two-card pile with a two-line title has to give
  (the record's worst today), and more than a three-card pile's ~8px (the cap).
- So the foot eases in over the first 180px above 720 tall (`0.4`). At 720 it
  is 0, and the band sits exactly where it did.

Margins measured on the landing, in ink (the title's top against the names'
last glyph to the floor):

| viewport          | top | bottom |
| ----------------- | --- | ------ |
| 1936 × 1221 (his) | 106 | 106    |
| 1920 × 1247       | 106 | 106    |
| 1920 × 1080       | 106 | 106    |
| 1440 × 900        | 86  | 85     |
| 1440 × 800        | 81  | 45     |
| 1280 × 720        | 73  | 12     |

At his window the band rises 88px, TRANSMISSION and ON RECORD 44px, and the
pile ends ~35px above the band's box. SCOPE, FACTS, the title and the figure do
not move.

### Verified

- `probe-voidwalker-eras`, all clean at every rung. Tightest SCOPE foot:
  68 / 47 / 40 / 72 / 118px at 1280 × 720 / 1101 × 800 / 1440 × 800 /
  1920 × 1080 / 1920 × 1247.
- `probe-voidwalker-figure-span` at 1920 × 1247, 1920 × 1080 and 1280 × 720:
  one figure height, seat line unmoved, ring on the figure, 0 cut.
- `capture-era-media`, all gates pass:
  - fixture piles 1–3 at 1280 × 720, 1440 × 900 and 1920 × 1247
  - pile 3 at 1366 × 768, 1440 × 800 and 1536 × 864
  - each era's own pile at 1440 × 900 and 1920 × 1080
- The handoff specs (11 passed), and the sheet, unit, token, sweep and era
  suites (177 passed).
- The datum lab mirrors the foot and its four structural rules character for
  character (`voidwalker-datum-lab.css`). A lab without them would gate the pile
  in a seat half a foot taller than the landing gives it.

### Left open

- ⚠ **The capture never asks whether the frame stays inside its card.** Found
  this pass: in the lab, the three-card fixture with a two-line title overruns
  its card's content box by 15.6px at 1280 × 720 (8.4px past the card's own
  edge), with every gate green. The frame holds its 72px floor, and the card, a
  clamped grid item, lets it spill.
  - **It is the lab's squeeze, not the landing's.** The lab's TRANSMISSION seat
    is exactly 24px shorter than the landing's at every size: its 48px knob bar
    comes out of the sheet, and `--vwd-bar-h` corrects the figure column for
    that but not the panel rows. On the landing the same pile keeps 8.4px of
    frame at 1280 × 720 and 13–22px from 768 to 900 tall, foot included.
  - So the gate waits until the lab's rows are faithful, flagged as its own
    task. No era carries three cards today.
- **The phase constant has room on the landing's arithmetic.** Raise it only
  after measuring the worst pile on the landing's rows. The lab cannot measure
  it truthfully yet.
- **The hud-panel lab re-declares only U20's datum and U31's rise.** It has
  lacked U22's mast/trail split since that update and lacks this foot. Its era
  surface is a closed exploration (ADR-089: the era stage was not taken).

## Update 39 — the class, live on Twitch: the bucket's first film (2026-09-22, owner)

The owner, on the era stage: _"I uploaded a Twitch snippet which I downloaded,
but for some reason it's not shown."_ It had never reached the site, which is
U34 §B's pending card. Three reasons:

- the only copy was on his Drive;
- the `era-media` bucket did not exist (`NoSuchBucket`);
- the registry named no such film.

⚠ **The filename names the game, and the standing hook refuses any shell
command that does.** That includes a plain copy of a file that is nowhere near
a game install; the hook refused it this session, by design. The owner copied
it under a neutral name (`azeroth-class-twitch.mp4`). The registry and the test
carry the title through the Edit tool, which the path rules govern. Nothing was
routed around the hook.

### A · The file ships as it came

- **H.264 High, 1280 × 720 at 60fps, AAC stereo, 28.8s, 4.6 Mbps.**
- **Already faststart:** `moov` sits before `mdat`, read off the atom order
  rather than assumed.
- So nothing is re-encoded.

### B · The bucket and the object

- ⚠ **`era-media` is PUBLIC and takes `video/mp4` only, 50 MB a file.** It is
  created with the service key from `.env.local`, never `.env`, which points at
  another project. The key was read inside the script and never printed.
- **The object:** `era-media/azeroth/wow-class-twitch.mp4`, 16,400,015 bytes,
  uploaded with `cache-control: max-age=31536000`. The name is the content, so a
  new cut takes a new name rather than an overwrite.
- ⚠ **A HEAD answers `no-cache`; a GET carries `max-age=31536000`.** Measured:
  `206` on a range, `Accept-Ranges: bytes`, the CDN at `HIT`. Read the cache
  policy off a GET.

### C · The card, at the FRONT of 2020's pile

- **The entry:** a `video` whose `src` is built from `ERA_MEDIA_STORAGE_ORIGIN`,
  so it cannot name a host the CSP does not.
- **Title:** _The World of Warcraft class, live on Twitch_ (43 characters).
- **Duration:** `0:28`, the native player's own reading, so the record agrees
  with what the reader sees. It is lettered nowhere on the stage (U36).
- **The poster is the frame at 24.5s:** an in-game chat bubble reads _"We're
  having an online course"_, "class" is typed in chat, and his webcam is in the
  corner. The picture carries the subject. 960 × 540, progressive, q82,
  113.5 KB.
- ⚠ **`focus` is used for the first time, at `[0.5, 0.85]`, because the
  subject sits low.** At 1280 × 720 the frame is ~92px tall, 48 % of the
  poster's height. A centred crop kept the bubble and cut his face in half,
  and `0.75` still clipped it. `0.85` keeps both at every size; at
  1920 × 1247 the frame shows ~88 % of the poster anyway.
- **The test:** the pin becomes `[the title, "qm4KlfvJc9A"]`. The comment that
  says a new card goes BEHIND the existing front card gains this one ruled
  exception.

### Verified

- `capture-era-media --record --era azeroth` at 1280 × 720, 1920 × 1247 and
  375 × 553, all gates pass. The front card is a `video`, and its framed dialog
  is 16:9 to the pixel with the `<video>` loaded from the bucket
  (`0:00 / 0:28`).
- **Every frame stays inside its card** on this two-card pile, on the phone and
  at 1280 × 720. Measured directly, because the capture does not ask (U38 §Left
  open).
- ⚠ **The dev server enforces the CSP too.** Its header is
  `Content-Security-Policy`, not report-only, with `media-src 'self' blob: data:
https://ehijwavsxbvnxsrunegu.supabase.co`. So the captured playback already
  happened under enforcement.
- ⚠ **`sweep-csp-enforced` is CLEAN on a production build, and U34's zero is
  closed.** The build is a clean worktree at HEAD plus these three files, served
  by `next start` with the enforced header. The sweep found 0 violations across
  nine routes in both themes, the owner's `/arcs` on a signed pass included. Its
  TRANSMISSION step opened 2020's front card and saw **1 request** to
  `https://ehijwavsxbvnxsrunegu.supabase.co`, where U34 could only report 0
  because nothing on the site asked that host for anything yet.

### Left open

- **The clip is 60fps at 1280 × 720 for a card that plays it at dialog scale.**
  A 30fps cut would roughly halve the bytes; not taken without his word, since
  the original ships unaltered.

## Update 40 — the band seats on the wordmark (2026-09-23, owner)

The owner, on U38's seat, live: _"move the gallery at the bottom a bit down so
they're horizontally aligned with the brand mark, because I think they would
be too close to the elements."_ U38 had mirrored the title's datum into the
foot, which stood the band's last glyph on the bottom brackets' top edge — the
wordmark's TOP line — and, at his window, 21px under the TRANSMISSION pile.

### A · The seat

- **The band's BOX is centred on the docked wordmark's box.** `--vwd-foot` is
  `--hud-margin + --hud-brand-dock-h / 2 − --vwd-band-box / 2`, inside U38's
  `min(…, max(0px, (100svh − 720px) × 0.4))` ease, which stays: the full value
  is ~14px at 1280 × 720 and the cap holds the band on the floor there, as
  before; it is exact from ~755px tall at 1280 wide and ~805 at 1920, which
  covers every other reference rung.
- **Both readings of "aligned" were shot at 1936 × 1221 before choosing.**
  Centred: the thumbnails overlap the wordmark's 43px by 33 (their centre 12px
  above its centre, because the names hang under the pictures inside the box),
  the names' box ends 11px under the mark's bottom line, the air under the pile
  goes 21 → 40px. Bottom-aligned on the mark's bottom line: the pictures sit
  ABOVE the wordmark, the names beside its lower half, 28px of air. Centred is
  what ships; the other is one term away.
- ⚠ **U38's mechanism stands to the letter** — the absolute band, the fifth
  stage row, paid by the panels and never the figure. A SMALLER foot is more
  body row: rows 2 and 4 gain half the difference each.
- ⚠ **Where the pile FILLS its seat, it grows instead of gaining air.** At
  1920 × 1080 and 1440 × 900 the TRANSMISSION seat is height-bound
  (`container-type: size`, the frame the one item that gives), so the extra
  body row goes into the film frame and the gap under the pile stays 17–18px;
  at his 1221 the pile is content-height and the room opens as air. Both are
  the composition working as U31 built it.

### B · The wordmark's box, as HUD tokens

- The mark's geometry was two literals in two rules (`width: clamp(104px,
8.5vw, 150px)` on `.hud__brand`, `scale(0.68)` on its docked state) and an
  intrinsic aspect only the browser knew. `landing.css` `:root` carries
  `--hud-brand-w`, `--hud-brand-dock` and `--hud-brand-aspect` (494.93 /
  1178.18 = 0.42008, the lockup's own viewBox) and their product
  `--hud-brand-dock-h`; the two rules read the first two. Every computed value
  is byte-identical to the literal it replaced — measured 42.8px tall at the
  150px cap before and after, and the HUD snapshot spec is the proof.
- ⚠ **The aspect is the one term CSS cannot derive from the file**, so
  `tests/lib/hud-brand-tokens.test.ts` reads the SVG the prototype's
  `.hud__brand` loads and pins the token to its viewBox within 1e-4, along with
  the two rules and both sheets' foot expression. A re-exported lockup with a
  different artboard would otherwise seat the band a few pixels off with
  nothing to say so.
- The era sheet reads the tokens with fallbacks at the 1920-wide values
  (`54px`, `42.85px`), the same courtesy `--vwd-mast-top` extends to
  `--hud-corner-foot`, for a host that does not load the HUD's sheet.

### Verified

| viewport    | foot, U38 → U40 | band centre / mark centre (from the floor) | air under the pile    |
| ----------- | --------------- | ------------------------------------------ | --------------------- |
| 1936 × 1221 | 88.3 → **29.4** | 75.4 / 75.4                                | 21 → **40**           |
| 1920 × 1080 | 90.1 → **33.6** | 75.4 / 75.4                                | 18 → 18 (frame grows) |
| 1440 × 900  | 71.6 → **19.0** | 58.0 / 58.0                                | 15 → 17               |
| 1280 × 720  | 0 → **0**       | (cap)                                      | 12 → 12               |

- `probe-band-brand.mjs` (scratch), headed, real scrolls, the four rows above.
- `hud-brand-tokens` (4), `voidwalker-datum-sheet` (28), `type-material-tokens`
  (76), `theme-css-sweep` (29), `phone-viewport-units` (24): green.
- `probe-voidwalker-figure-span --vp 1920x1247`, both handoff specs and the HUD
  snapshot spec: see the commit for their result.

### Left open

- **The 17–18px under a height-bound pile at the laptop rungs** is U31's seat
  law, not the band's; if it reads tight there, the lever is the seat's own
  `padding-bottom`, not the foot.
- The hud-panel lab still does not mirror the foot (it has lagged since U22).

## Update 43 — the record thumbnails are hairline drawings (2026-09-24, owner)

The owner, on the ON RECORD cards: _"I don't really like the icon; it looks
like a trash bin; can we do something a bit more elegant?"_ It did. The
`magazine` mark (MIT Technology Review on Azeroth, Newsweek on the Expanse)
was a wide masthead bar, a row of air, then a narrow box with a bright centre
pixel — the trash-can silhouette exactly — and it was that glyph's FOURTH cut
on the 7×7 particle lattice (a letter C, a person, a 17-pixel draft, the bin).
Offered a fifth pixel cut, the hairline register, or the hairline register for
the facts' marks too, he chose the hairline for the three record kinds alone.

### A · The register

- **Three line-drawn pictograms, one per coverage kind**
  (`lib/voidwalker/recordMarks.ts`, zero-import): a 21-unit grid rendered at
  21px, 1px dawn strokes at .62, one filled dawn signal — ADR-059's
  section-glyph register one size up. NEWSPAPER is a broadsheet (the sheet, a
  masthead rule across it, two column lines beside the photograph, two lines
  running the full measure under it). MAGAZINE is a bound cover (the sheet, a
  SPINE two units inside its left edge, the masthead rule, one large framed
  picture with the signal at its centre). BROADCAST is a set (a landscape
  screen on a stem and a base, two rabbit ears rising 45° off the top centre,
  the lit centre).
- ⚠ **Seven cells cannot tell a magazine from a can.** The pixel grammar's
  whole vocabulary at 7×7 is a bar, a box and a dot, and a "cover" IS a bar
  over a box — every legal cut of the magazine converged on the bin. Twenty-one
  units of hairline carry a spine and a frame, which is what distinguishes a
  bound publication from a folded one and both from a container.
- **The well, the notch, the hover and the card are untouched** (U35, U37):
  43px, padded never centred, dawn only, the state on the ring and the ink;
  `RecordMarkSvg` replaces `EraMarkSvg` in `PressCard` and nothing else in the
  card moves.
- ⚠ **Two icon media on one station, and that is the named cost.** FACTS keeps
  `ERA_MARKS` — four pixel marks at 14px beside their labels, wayfinding
  bullets — while the record thumbnails are PICTURES of a kind. They share one
  dawn token and one ladder (`.vwd__rm__*` reads `--vwd-dawn-rgb` exactly as
  `.vwd__mk__*` does). If he reads the two as clashing, the facts take the
  hairline register too — the plan's third option, offered and not taken.
- ⚠ **`geometricPrecision`, never `crispEdges`, on the thumbnail.** An axis
  line is authored on the half pixel ACROSS its length and runs integer to
  integer ALONG it (`[3, 1.5, 18, 1.5]` is row 1, columns 3–17), so butt caps
  fill whole pixels and the line is crisp with no help; the two diagonals are
  anti-aliased on purpose — under `crispEdges` a 1px 45° line is a staircase of
  single pixels, i.e. the grammar this thumbnail just left. The facts' marks and
  the link-out arrow keep `crispEdges`; `voidwalker-datum-sheet` pins both.

### B · Guards

- `tests/lib/record-marks.test.ts` (17): the three kinds equal
  `VW_OUTLET_KIND`'s values and every outlet has a drawing; every coordinate
  inside the grid; axis lines on the half pixel across and whole pixels along;
  diagonals at 45° ending on pixel centres; at most twelve lines; exactly one
  whole-pixel signal inside the grid; no repeated line; no two kinds one
  drawing.
- `era-marks.test.ts` is the facts' alone (19): four keys, and the three
  coverage kinds pinned ABSENT — a pixel mark for a kind returning there is
  the bin coming back.
- `voidwalker-datum-sheet` (28): `--vwd-pcard-mark` 21px and
  `geometricPrecision` on the thumbnail with no `crispEdges`; `.vwd__rm__line`
  a 1px dawn stroke with `fill: none` and `.vwd__rm__sig` a dawn fill, no gold,
  and no hover rule reaching either; the lattice pins narrowed to the arrow and
  the facts' mark.
- ⚠ **A GUARD IS NOT A CONTACT SHEET.** `scripts/capture-record-marks.mjs`
  (`node --experimental-strip-types …`, static DOM, no server) shoots the three
  in the card's own well beside the four facts marks, dark and light, at DPR 3,
  UNLABELLED → `docs/design/voidwalker-record-marks/`. Judged blind before the
  station was shot: a broadsheet, a bound cover, a set with rabbit ears, and
  nothing that reads as a bin.

### Verified

- The sheet, both themes; the station at 1920×1247, dark and light, on the
  Azeroth (magazine), Expanse (magazine · broadcast) and Pokémon Go
  (newspaper · newspaper) slices — the marks crisp in the well and
  distinguishable at the card's own size in both themes.
- `probe-voidwalker-phone`: the instrument fits at every shape, era and tab.
- `record-marks` (17), `era-marks` (19), `voidwalker-datum-sheet` (28),
  `voidwalker-data` (17): green.

### Left open

- The facts' marks stay pixel; one station, two media — his read decides
  whether they follow.

## Update 42 — an era change is the figure's own glitch (2026-09-24, owner)

The owner: _"when you scroll between eras I want a glitch effect to happen on
the avatar so there's a clean transition between the avatars; can you scope
this out?"_ The era change was a bare `src` swap on one `<video>`
(`HoloFigure.tsx`): on scroll a hard cut — the old frame, the new poster, the
new video — and on a click a 900ms tear-in on the NEW figure plus a 640ms
`steps(8)` `brightness(1.5)` settle, a luminance pulse, with no exit for the
old figure at all. Offered one transition for both paths or a glitch on scroll
alone, he chose one transition.

### A · The hero's grammar, on a canvas over the video

- **The kernel is ADR-060's** (`lib/key-visual/themeGlitch.ts`, unchanged): 640ms,
  fourteen bands, the outgoing plate torn ±5 % for the first 22 %, the bands
  flipping on a shuffled rank cascade to 78 % with the incoming plate arriving
  as a 24px mosaic that resolves to the house grid, then released to native on
  the identity frame. Pure spatial tearing — no opacity curve on the figure and
  no brightness pulse — which is what keeps it inside ADR-097 U12's no-flashing
  law; a band firms 0.45 → 1 monotonically, the hero's own ramp.
- **A canvas laid over the `<video>`** (`.vwh__glitch`, inserted by
  `useHoloGlitch` inside `.vwh__media-wrap` before the edge bar) holds the
  OUTGOING frame and tears it into the incoming plate; it lifts on the kernel's
  identity frame. Its BOX is the media's at fit 1 — `100% × --holo-overscan` of
  the wrap, bottom-centred (534 × 1089 at 1920 × 1247) — and each era's plate
  is drawn inside it at that era's own `--holo-fit`, contain-bottom, so both
  pictures land where their videos do (`holoPlateRect`, byte-equal to
  `containedHologramPlacement`). Its PAINT is the media's, declared once for
  both: blend, alpha, filter and the scanline mask, with `mask-position` set
  per run to the incoming video's own phase (`holoScanPhase`: 2.92px arriving
  on the Expanse, 0 on Azeroth).
- ⚠ **THE VIDEO IS HIDDEN UNDER THE CANVAS, NOT FADED, AND THE WRAP'S CLIP
  OPENS.** Both are alpha pictures, so a video showing through the canvas's
  transparent parts would double-expose the incoming figure under the outgoing
  one's bands: `.vwh__slot[data-vwh-glitch] .vwh__media { visibility: hidden }`
  — `visibility`, because the handoff spec pins the media's opacity to the
  morph and the video must keep loading. And `--holo-spill` is overridden to
  the largest box for the run: the wrap's clip is solved from the era the slot
  HOLDS, which at the swap is already the incoming one, so a run leaving the
  floor era would have had Azeroth's pauldrons cut at the wrap for 640ms.
- ⚠ **THE `<video>`'S `src` IS SET IMPERATIVELY, IN A LAYOUT EFFECT.** The
  outgoing frame has to be snapshotted while the element still holds it, and
  a `src` React had already written would have emptied it before any effect
  ran. So the element carries no `src` prop; the layout effect snapshots
  (`drawImage`), inserts the canvas, paints frame 0, THEN writes the source —
  all before the browser paints. (The first cut kept a `shown` state and
  adjusted it in the effect; that is one hook warning on a lint ratchet with no
  headroom, and the DOM-as-truth shape needs none.)
- ⚠ **`drawImage(<video>)` IS NOT THE PICTURE THE VIDEO PAINTS, AND THAT WAS
  MEASURED TWICE.** A video paused at its load point (readyState 4,
  `currentTime` 0) draws NOTHING — alpha 0 on every pixel; at other moments it
  draws half-bright (the frame under the canvas came out at mean 11.7/255
  against the video's own 43.9). Drawing the swapped video as the incoming
  plate was tried on that basis and reverted. The incoming plate is the era's
  alpha POSTER — frame zero as a q82 WebP, which is what the element paints
  first when shown again — and the outgoing snapshot is checked for ink on a
  36 × 64 sample, with the outgoing era's poster standing in where the frame
  is blank. ⚠ The one-pixel alpha probe (`holoAlphaSupport`) cannot tell
  "alpha honoured" from "nothing drawn"; it was never asked to.
- **The neighbours' posters are warmed** (idx ± 1, `posterAlphaPath`, 83–152 kB
  each, `Image.decode()`) once the figure is near, and the current era's own
  as the snapshot's fallback — never all five. A plate not decoded at the
  moment of the change means no glitch, which is the cut the station had.
- **Interrupted, a run restarts from the plate it was arriving at** — its
  poster, whole — never a snapshot of the canvas (mosaic on mosaic). A pair's
  seed is order-sensitive (FNV-1a over `from → to`), so a→b and b→a tear
  differently and a pair always tears the same way.
- **One transition for scroll AND click.** `pick` no longer bumps `epoch`; the
  epoch-driven `reveal` / `settle` phases (`vwhReveal`, `vwhEdge`,
  `vwhSettle`) are the figure lab's timed materialize now and production never
  enters them on an era change. The brightness-step settle is out of
  production with them.
- **Where it does not run, by design:** reduced motion (the sheet also
  `display: none`s the canvas and un-hides the media as a belt); the FLOOR
  branch — an engine with neither codec, and Safari on the three eras with no
  `.mov` (Azeroth, the Expanse, Pokémon Go), where a run across a branch flip
  would have to paint two compositing models at once; a hidden tab (a run in
  flight finishes on `visibilitychange`); the figure off screen; the first
  mount.
- **The dev hook:** `data-vwh-glitch-slow="N"` on `.vwd` stretches a run N×,
  read once at `begin`, so a capture can hold real frames of the choreography.

### B · Guards

- `tests/lib/holo-glitch.test.ts` (12): the seed and the plan (a pair stable,
  its reverse different, the identity frame at `done`), the plate's seat (the
  registry's contain-bottom placement at fit 1, scaled by the era's fit and
  bottom-centred otherwise, every era painting one figure height through the
  canvas within a pixel), the scan phase in `[0, pitch)`, the interrupt policy,
  the neighbours. `theme-glitch` (18) unchanged.
- `about-voidwalker-handoff-boundaries.spec.ts` gains "an era change is the
  figure's own glitch, over a hidden video, and lifts clean": at 0.44, after
  the walk's own runs have lifted, a keyboard step right — frame 0 shows the
  canvas up over a HIDDEN (never faded) media, exactly one media element, the
  canvas the wrap × overscan wide and bottom-seated, no ground, no painted
  border; mid-run the canvas still up with the era already moved on; after the
  run the canvas gone, the attribute gone, the media visible, the new era.
  Alpha branch only — the floor branch annotates and returns. 9 of 9 in the
  file; `about-voidwalker-handoff` (one media element, the pose at three
  progresses, PRM) unchanged.
- `scripts/capture-holo-glitch.mjs` — headed, real scrolls, the walk re-solved
  until the era reads Azeroth (one pass landed on `loop`), the run slowed 8×,
  frames at 0 / 25 / 50 / 75 / 98 % and after, both directions, and the NO-POP
  number: the last frame under the canvas against the first without it with
  the video held still. Strips in `docs/design/era-stage-pass/glitch/`.

### Verified

| run (1920 × 1247, dark) | canvas box | mask phase | hand-over mean \|Δ\| |
| ----------------------- | ---------- | ---------- | -------------------- |
| Azeroth → the Expanse   | 534 × 1089 | 2.92px     | **2.05** / 255       |
| the Expanse → Azeroth   | 534 × 1089 | 0px        | **3.46** / 255       |

- The hand-over is the poster → VP9 texture step the reader already crosses
  on every load; with the swapped video drawn as the incoming plate it read
  13.2 and 32.2 (the half-bright picture), which is why that route is out.
- The wrap's clip during a run: `inset(-16% -8% 0px)` on both directions; the
  media's opacity 0.92 throughout (0.906 once, mid-flicker — the rest flicker
  dips the media, not the canvas, a 1.5 % mismatch for one frame every 7.3s).
- ESLint on `HoloFigure.tsx` at its baseline (one `set-state-in-effect` on the
  observer's `setNear`, pre-existing); `tsc` clean.

### Left open

- **The floor branch cuts.** Safari on Azeroth, the Expanse and Pokémon Go
  has no `.mov`, so those changes are the cut they were; the honest fix is
  cutting the HEVC-alpha deliveries on a Mac, not a second glitch.
- **640ms is the hero's duration**, kept on ADR-097 U12's own reasoning (a
  figure ~845px tall against a 1247px plate is near enough in pixels); if it
  reads fast, `HOLO_GLITCH_MS` is the one dial.
- **Two neighbour posters per era** (~220 kB) are the warming's cost, paid
  only once the figure is near.

## Update 41 — the Expanse's face is put back from the photographs (2026-09-24, owner)

The owner: _"the Expanse Avatar doesn't really look like me; the face I mean,
so please go back and recreate it as accurately as possible."_ It did not. The
shipped `-v5` figure is the end of a chain of FOUR image edits — the v3 plate →
the rifle (U32) → the standing commander (U34) → its mouth closed (U34) → the
aim-stand end pose (U35) — then a Veo scene, then the gold grade at the
exposure floor, and **not one of those edits attached an identity
photograph**: every sidecar after the plate wave lists `IMAGE 1 — THE
PHOTOGRAPH TO EDIT` and nothing else. Each hop re-drew the face from the plate
it was editing, a photocopy of a photocopy, which is exactly the skill's own
Rule 0 ("identity is slot 1, always; a previous output as slot 1 drifts the
face") broken by construction. Read against the shoot, the shipped head is
rounder and younger, with a full even beard across the cheeks and a smaller
nose; his is a long oval with an angular jaw, a heavy low brow, deep-set hooded
eyes with hollows, a broad-bridged nose and a dense CHIN beard that thins to
near-clean cheeks.

### A · The fix is an edit with the photographs beside it, never a redraw

- **`refs.py --set face`** cuts the three identity crops alone (`face-detail`,
  the `colour-04` crop, and a THIRD angle new here — the `colour-01` head,
  three-quarter, because the commander's head is turned) into the wave's
  `refs/`, looked at on the contact sheet before a draw is paid for. ⚠ Not
  added to `IDENTITY` itself: every plate lock numbers its wardrobe from
  IMAGE 3.
- **`generate.py --edit-kind face`** attaches them after the plate and
  `EDIT_FACE` addresses them by number — ONE change, the face, everything
  below the collar named as fixed, the mouth CLOSED (U34's five audio
  refusals) — with the face also said in words (`FACE_LOCK`, read off the
  photographs): "close-trimmed, connected" had let the model keep its own
  idea of a bearded man in a cap.
- **`--model gpt`** is the second lane: GPT Image 2 through
  `/v1/images/edits`, the skill's own "identity rescue when face drifts" route
  (`SKILL.md`, `prompts.md`), documented since U1 and never coded. One signed
  multipart POST, the images in `image[]` in the prompt's own order, no SDK;
  `OPENAI_API_KEY` joins `env.py`'s `WANTED` for it. ⚠ `gpt-image-2` refuses
  `input_fidelity`; the bare retry (the Gemini lane's rule for a renamed
  field) carries it.
- ⚠ **AN EDIT ATTACHES THE IDENTITY CROPS OR IT DRIFTS — EVERY KIND.** When a
  wave holds them, `generate.py` attaches them on the rifle, command, mouth
  and aim-stand edits too, and tells the model first that his face stays
  exactly theirs; the aim-stand plates below were drawn that way.
- **`sheet.py` writes `heads.jpg`** beside the blind sheet: every plate's face
  at one face height, lettered by the sheet's key, then his three photographs
  after a gap. **`legs.py`** is U35's hand-measured "legs IoU" as a script —
  the figure keyed on its ground, intersection-over-union below the waist
  against the source plate.

### B · What the v8 wave measured

- Six face edits of `plate-expanse-mouth_01` (U34's plate), three per lane,
  picked blind on the heads. **Gemini's three barely moved the face** (two
  read as the shipped stranger) **or redrew the frame** (a cyan ground, a
  frontal glare, K1 off the lock by 108). **GPT Image 2's three put his face
  back** — the brow, the hollows, the chin beard, the jaw — **with the pose,
  the rifle, the armour, the kilt and the ground untouched to the pixel.** The
  gates: GPT's K3 spill 9–10 %, which is the shipped lineage's own level (the
  rifle-edit plates ran 8–9 % and shipped); the ground on the lock; the gold
  preview p75 118–125, inside the band.
- Three aim-stand plates from the best GPT face (identity attached): legs IoU
  0.978 / 0.968 / **0.981** against the face plate, the stance and boots
  unmoved, the rifle up and foreshortened toward the viewer (U35's own pose).
- His pick on `heads.jpg` was `plate-expanse-face-gpt_02`. `identity-map.md`'s
  beard line is corrected to the shoot the same day.

### C · The helmet and the build, then the `-v6` delivery (same day, owner)

On the rescued face: _"the face looks good, but I think my body should be a
bit bulkier, with broader shoulders … I was thinking it makes more sense to add
a helmet, like a space helmet, instead of a cap. Let's make sure you can see my
face."_ Two reference frames of an open-visor marine helmet came with it.

- **`generate.py --edit-kind rig`** is a second edit of the face plate with
  the identity crops attached and the two frames as `HELMET DESIGN`
  (`refs/helmet-design-N.jpg`): `EDIT_RIG` names TWO changes — the cap becomes
  that helmet with the visor open and his whole face visible, and he is
  bulkier through the shoulders and chest — with everything else fixed by
  name. Six draws, three per lane; his pick was **`plate-expanse-rig-gpt_01`**
  (_"Yeah I think this is the closest"_). ⚠ Both lanes' draws of one kind now
  coexist on disk: the GPT lane's stem carries `-gpt`, because the first
  aim-stand run from the helmet plate was skipped as "already on disk, kept"
  by a Gemini file of the same name.
- **The cap leaves every prompt this era speaks.** `prompt.py`'s
  `headgear(text, era)` rewrites the cap and earpiece phrases of the scene,
  the idle and every edit kind for an era whose `EXPANSE_HEADGEAR` is
  `helmet` — the pointing hand "touches the side of his helmet at the ear,
  keying its comms" where it pressed an earpiece, and the height runs "from
  the top of the helmet to the soles". ⚠ Whitespace-tolerant on purpose: the
  first cut matched exact strings and missed two phrases split across a line
  break, so the scene prompt still asked for an earpiece under a helmet.
- **Six aim-stands from the helmet plate**, both lanes, identity attached.
  Legs IoU against it: GPT 0.706 / 0.835 / 0.770 (K3 11–16 %), Gemini 0.875 /
  0.865 / **0.900** (K3 25–28 %). ⚠ **The Gemini K3 is the VISOR, not a
  lighting defect**: the gate reads alpha on a band 2–8px inside the figure's
  edge, and a clear bubble visor keys as ground exactly there — which is what
  a clear visor must do on the void. `aimstand_03` is the pick: the best legs,
  a clean face inside the visor, the helmet the source's. `aimstand_02` drew a
  white reflection across the right eye and is out.
- **One Veo take, passed on its audio first time** — point (f0–24) → the hand
  up (25–32) → at the helmet, the order mouthed (33–67) → the rifle up
  (68–102) → the settle into the aim (103–157) → the aim held (158–191), read
  by consecutive-mask IoU. Cut at **f176** inside the hold: 352 frames,
  14.7 s, seam 0.842, motion 1.551, closed. Graded ×0.85 → deep-interior p75
  117, 4.5 % hot; seated +47px (boots at 0.9586); ground drift 3.0; no wall
  (ink x 67–642). Anchors `headY` **0.1** (the helmet's crown — v5's cap was
  0.1039), `footY` 0.9953, `headW` 0.5875.
- ⚠ **T2 reads 6.4 against its 6.0 line and the manifest says so** (`problems`
  is not empty). Measured by segment: the point hold 1.59, the aim hold 2.64,
  the hand at the helmet 3.57, the settle 6.9, the rifle-up 12.2 (medians per
  frame). The clip's median lands on the settle — the rifle coming into the
  shoulder — which is motion, and four consecutive hold frames of the helmet
  are identical to the eye. The grade does not strobe; the line is not moved
  (a guard loosened until it passes stops describing the take), and the
  finding stands in the manifest as a record of a livelier scene than v5's
  (median 4.12, a faster settle).
- **`thumb.py`'s marks re-read off frame zero**: crown 0.1133 (alpha row
  145, the helmet's top in the head's columns), chin 0.236 (the beard's bottom
  inside the visor), eye 0.1734, cx 0.445 — within 2px of v5's on every mark,
  because the scene starts on the same plate at the same seat. 5.7 kB.
- **Installed**: `holo-{idle,still}-expanse-v6.*` and `holo-thumb-expanse-v6.webp`
  in `public/`, v5 archived under `waves/_shipped/expanse-v5/` (gitignored,
  like v3 and v4), the registry's `-v6` paths with `headY` 0.1, the loadout
  reads `open-visor helmet` where it read `his own cap`, the test pins moved,
  the gallery's `ex-v6` run added and `ex-v5` superseded. ⚠ **THE CAP LEAVES
  THIS ERA ON THE OWNER'S OWN WORD** — the v1 ruling ("the cap is the
  identity's, not the set's") is superseded on the Expanse alone; the
  Architect keeps his.
- ⚠ `post.py` crashed AFTER the grade on a `→` in its libwebp-fallback
  message, under Windows' cp1252 console — the delivery was on disk and the
  manifest was not. It reconfigures stdout to UTF-8 now, as `thumb.py` does.

### Left open

- `-v6` ships without a `.mov`, like `-v5`: HEVC-alpha needs macOS
  videotoolbox; a Mac cuts one from `veo/graded/`.
- The photographs the era is named off still show him in a cap; the era's
  `wardrobe` comment records that and the figure does not follow it.
