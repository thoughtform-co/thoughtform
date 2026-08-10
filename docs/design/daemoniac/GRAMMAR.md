# Daemoniac — the ritual register

A fantasy design lane beside the celestial/retrofuturist one: warlock summoning
grammar (the Diablo tome-plate references in
`_01_GENERAL REFERENCES/Daemoniac/`) rebuilt on the house tokens and the
particle substrate. **Personal register — no ADR, not a landing surface.**
Look-dev lives at `/test/daemoniac`; the kernel at `lib/daemoniac/`.

Canon grounding (worldbuilding `references/canon.md`): _the Wrought is the
demonology line; the shape of the work is summon, bind, send — the same shape
as dispatching agents, with the background daemon as the software root._ The
law there is **"Recognition, never addition"** — this system recognizes the
warlock line already present in the practice; it invents no pacts and no
realms.

## Naming law

- **"Sigil" is occupied** (LANGUAGE.md: the brand geometric mark). Nothing in
  this system is called a sigil in code or copy.
- The drawn object is a **BIND** — canon's `The` + hard-noun register (the
  Cast, the Ward, the Bind). A bind is the drawn record of a configuration:
  what was summoned, what it is bound to, how far it may act alone.
- The rendered document is a **plate**; its margin notes are the
  **apparatus**; the glyph alphabet ships on the **specimen sheet**.

## Three glyph registers, one house

| Register             | Grammar                                            | Curves                  | Where legal                         |
| -------------------- | -------------------------------------------------- | ----------------------- | ----------------------------------- |
| Pixel icon           | 7×7 grid, sk/sig/dr layers (`proofGlyphData`)      | **never**               | UI icons, the casefile index        |
| Celestial instrument | parametric SVG primitives (`CelestialConnector`)   | rings/arcs only         | connectors, phase glyphs, emblems   |
| **Daemoniac script** | forged strokes on an anchor lattice (`glyphForge`) | quadratic bowls + hooks | binds, specimen sheets, tome plates |

The script register is the ONE organic register: round line caps, calligraphic
curves. Everything structural around it keeps the house cut (squared caps,
zero border-radius, stroke weights only from {0.3, 0.5, 0.7, 1, 1.5, 2}).

## The bind — every mark derived

`composeBind(record)` maps a `BindRecord` to marks. Nothing is decoration;
deleting a record field deletes its ink.

| Record field   | Drawn element                                                                                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | catalog no (`N.<hex4>·<class letter>`) + the bearing angle (`hash(id) % 360`, nudged off the crown)                                                                                                                                                                    |
| `name`         | the PRIME: circled Major glyph at center + ideogram column beside it                                                                                                                                                                                                   |
| `class`        | the armature: agent = triangle (apex at crown — summon · bind · send) · tool = diamond (the house instrument mark) · person-led = pentagram, apex up (the human holds prime) · skill = **no polygon** — an inscription, not an entity (center ideogram, no prime seal) |
| `lane`         | the CROWN at 12 o'clock: larger seal, **Major** glyph, paired flanking tick-bars — the summoned intelligence outranks the other bindings                                                                                                                               |
| `skills[]`     | ring-station seals (Minor glyphs) in a domain sector + a spoke whose crossbar tallies equal the count                                                                                                                                                                  |
| `connectors[]` | seals with outward stem + terminal ring — a connector touches outward                                                                                                                                                                                                  |
| `contexts[]`   | double-hairline hollow seals — consulted, not commanded                                                                                                                                                                                                                |
| `autonomy`     | **the containment ring itself**: bounded = double ring · wide = single ring with three tick-flanked gate-gaps · decides-alone = ring broken at the bearing, terminal rings at the break                                                                                |
| (derived)      | the bearing trident on the ring exterior — the send vector; every mark orients toward a target                                                                                                                                                                         |

Sector layout: the crown owns a fixed 24° arc; active domains (skills →
connectors → contexts, clockwise, fixed order for cross-plate comparability)
split the rest proportionally with a 30° floor. Empty domain = no sector, no
spoke. Geometry constants: containment R 100, polygon inscribed 68, prime seal
r 20, station seals r 8, crown seal r 12; bind marks live in `-120 -120 240
240`, the plate wraps at `-170 -170 340 340`.

**The apparatus** (≤5 leader notes, PT Mono caps, ≤28 chars measured — PT Mono
is monospace so width is arithmetic): the crown's lane, the containment's
autonomy, the prime's name, and the first two sectors. Leaders run source →
45° diagonal → horizontal tail, in the dawn ink.

## The glyph forge — the name is the seed

`forgeGlyph(name, grade, seedTag?)` is deterministic from
`combineSeed(hash(name), hash(grade), hash(seedTag ?? ""))`. The same lane
name letters identically on every plate; **renaming a record redraws its
glyphs** — feature, not bug.

- **Lattice:** 10×16 box. Major = 3×5 anchors (a capital), Minor = 3×3 (a
  diacritic). Endpoints sit on anchors; only quantized curve controls leave
  the lattice.
- **Anatomy:** one SPINE (weight 1: stem or long diagonal) + BRANCHES (Major
  2–4, Minor 2–3, weight 0.7: bars, one-cell diagonals, quadratic bowls with
  bulge ∈ {2.2, 3.4}, exit hooks) + TERMINALS (weight 0.5: rings or
  tick-bars on free ends; Major ≤2, Minor ≤1). Majors may carry one
  mirrored-bowl wing pair.
- **Laws:** every branch shares an anchor with the drawn set (one connected
  written form); the form spans ≥2 columns (the width floor); candidates are
  enumerated and picked — never rejection-looped; the committed descriptor
  carries the bulge (a 2.2 and a 3.4 bowl are different strokes).
- **Ideogram** (the Scriptorium Anima register): a vertical column of
  Minor-grade marks, one per 3-char chunk of the name (cap 6), threaded on a
  0.3-weight hairline spine.
- **Collisions:** the guard (`tests/lib/daemoniac.test.ts`) asserts
  fingerprint uniqueness and a ≥2-descriptor floor between same-grade pairs
  across the real record set. The remedy for a collision is the record's
  **`seedTag`** — bump it, never rename the entity. A seedTag is a per-record
  glyph dialect: if two records share an entity name, keep their tags equal
  or the shared name draws twice.

## Rendering

- **The bind is a one-ink drawing** (like the references): all marks stroke
  `--gold-line` — the LINE role of the gold ramp, `#caa554` on void,
  `#8a6b20` (3.6:1) on parchment. Hierarchy is stroke weight, never a second
  color. The apparatus and plate chrome are the second ink: dawn.
- **Light theme IS the tome** — `--void` flips to parchment and the plate
  becomes the book page; dark is the ritual at night. No `[data-theme]`
  overrides anywhere in the lab.
- **Particles are a STIPPLE, never a spray** (owner, 2026-08-10 — the
  gaussian scatter read as sloppy/low-res). `sampleBind` places points
  EXACTLY on the stroke at one even pitch (`SAMPLE_SPACING` = 2.2 units;
  the count DERIVES from total stroke length, the budget is only a
  ceiling), with zero randomness anywhere. Stroke weight is expressed as
  ink TONE (`toneFor`: 1 → 0.95 · 0.7 → 0.75 · 0.5 → 0.58 · 0.3 → 0.42),
  never as scatter width. The painter snaps dots to the house pixel grid
  (GRID = 3 device px, 2 px square dots — the ThoughtformSigil signature)
  and batches by tone tier. **Rank = inscription order**: containment →
  gates → armature → spokes → crown → seals → prime → ideogram → bearing;
  drawing `rank < progress·count` performs the ritual. Homes normalize
  over the PLATE canvas so the stipple registers with the SVG in overlay.
- **Motion law:** the inscription reveal is the ONLY motion — the stipple
  is otherwise still (no breathing, no swirl, no pulse, no spinning
  rune-discs). Consequence: the painter has no rAF loop and no IO gate at
  all; it redraws on state change, so PRM needs no special path — it just
  skips the shell's replay animation.
- Starved particle budgets drop `furniture` marks from sampling first; the
  SVG plate keeps them.

## The facet line (design-rack vocabulary)

For the vault's design rack (surveyor note format), this aesthetic reads:

```
brackets: none · reticles: none · ticks: sparse · grids: none ·
scanlines: none · labels: technical · corner-language: squared ·
line-weight: light · density: balanced · spacing: loose ·
hierarchy: subtle · background: dark|light (theme-paired) ·
accent: warm · text: high-contrast · mono: prominent ·
glow: none · grain: none
```

Semantic anchors (brandworld): THRESHOLD + INSTRUMENT + SIGNAL, with
NAVIGATION carried by the bearing. Colors are roles on tokens, never hex.

## Guards

`tests/lib/daemoniac.test.ts` — composition determinism; stroke enum; no-NaN;
skill-class structure; glyph budgets, box bounds, width floor; forge
determinism; fingerprint uniqueness + descriptor floor; ideogram cap;
apparatus budgets; sampler exactness, rank order, home bounds, degrade.
Legal is arithmetic; **good is the owner's, on the specimen sheet.**

## Promotion path

If a bind ever ships to a public surface: Cycle B (MAINTENANCE.md), an ADR,
theme-parity verification (both themes composited, measured), the
confidentiality envelope if it draws client records, and a decision on where
the ritual register may appear beside the celestial one. Until then this
stays a personal lane: the lab, the kernel, this document.
