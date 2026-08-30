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
| `genai`       | Latent Land | 2022          | The AI Captain                     |
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
