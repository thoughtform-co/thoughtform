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
