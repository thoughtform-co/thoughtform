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
