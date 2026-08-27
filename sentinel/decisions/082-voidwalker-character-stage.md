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
