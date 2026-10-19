# Build scope: the mark is the mind

Filed 2026-10-19. Not started. The direction was chosen in round six of the machine-mind lab (`docs/design/machine-mind/round-06/`, canvas https://claude.ai/artifact/2SibvqS6gLRHGffgN1C1W8, pages Wave 4 to Wave 6).

## The object

One drum of stacked contour slices, cut by the Thoughtform brand mark into four sectors.

| Part of the mark | In the object | Meaning |
|---|---|---|
| Broken circle, thick at the lower left | the gold crescent round the drum | the form, the gateway, the flywheel |
| Slanted bar (≈79.5° from level) | the gap between left and right | adoption \| automation |
| Level bar, running past the circle on the right | the seam across the middle | where the two meet |
| Stepped block at the crossing | the one lit point | the thought, the guiding star |
| Left sectors | office floors, people as tiny figures | the client's teams, adoption |
| Right sectors | gold circuits, die layers | Claude Enterprise, automation |
| Raster lines fraying off the upper left | particles leaving the drum | the thought escaping into the swarm |

The owner, 2026-10-19: "The circle is a loop: that's the flywheel, the adoption automation flywheel." So the drum turns.

## The one idea that makes it cheap: the mark stays, the contents flow

A drum turning about its vertical axis keeps its silhouette, its slice rings and its sector cuts if the mark stays fixed. Only what lies on the top face and on the cut faces moves. So:

- **Fixed, drawn once (SVG through the anatomy kit):** the slices, the outer wall, the four sector prisms, the mark (crescent plus the depth treatment the owner picks), the crossing.
- **Turning (one canvas layer):** the top-face contents, drawn in the drum's own plane in polar coordinates, rotated by θ, mapped into the isometric view with one affine transform (a horizontal plane projects affinely), and clipped to the four sector polygons. The wall's vertical seams slide with θ; its horizontal slice rings do not move.
- **The meaning in the motion:** turning clockwise, an office floor reaches the slanted bar, breaks into dots, crosses the gap as particles, and comes out the other side as gold traces. On the way back round the level bar, the traces become floors again. Adoption feeds automation feeds adoption. The particle system is how one becomes the other.

This avoids the kit's 3D turn mode (`kit/turn.mjs`). That mode is beta, SVG-only, proven only on its examples, and a static bar crossing the turning drum fails its live-layer check ("interleaves live layer"). It is worth using only if the whole object must tumble.

## Pieces and their sources

| Piece | Built from | Notes |
|---|---|---|
| Camera | `components/arcs/figures/foundation/isoKit.ts` (`cameraOf`, azimuth 45°, elevation 35.264°) | the swarm stack's own true isometric (`docs/design/machine-mind/README.md`, "One camera for the whole stage") |
| Mark geometry | `lib/brandmark/brandmarkPaths.ts` (`BRANDMARK_PATHS`, `brandmarkPolylines`) | no constants exported; measured: ring centre ≈(208.5, 229.4) in the 431×436 viewBox, mid radius ≈198, band ≈179–210; level bar y 218.8–236.6; slanted bar ≈79.5° from level, top leaning right; crossing ≈(215, 228). Add these as named constants in a new pure module. |
| Sector prisms | kit `extrude(ring, z, h, P)`, convex default | each sector is a disc cut by two half-planes, so convex; one short extrude per slice, painted bottom to top |
| Crescent | kit `lathe.mjs` `ringBand` / `bandsOf`, or short convex arc segments | concave, so never one `extrude({convex:false})` |
| Contents | new procedural generators: floor plans with desks and figures; circuit traces with dies | seeded, drawn as line art in plane coordinates, so they can turn |
| Crossing glow | a canvas radial for the still; `kit/gl.mjs` (`glCamera`, `glLayer`) if it must be a real light | `gl.mjs` is not vendored in the repo yet |
| Particles | the swarm engine, `app/(internal)/test/proposal-swarm/engine/` | a formation is any point set (`Targets {x, y, size, style, show}`); sample the sector rims and the seam crossings; `mark.ts` already rasterises the mark onto the dot lattice |
| Stage | `app/(internal)/test/machine-mind/MindStage.tsx` pattern | SVG → Blob → Image once, then `under`/`over` canvas painters per frame; IntersectionObserver pause; reduced motion holds a still. Its "parted" mode is the template for the sectors pulling apart. |

## States, top of page to deep

1. **Hero.** The whole drum, full detail, turning slowly; contents cross the bars as particles; the fraying drifts off the upper left; the crossing breathes.
2. **Section.** The etched plans fade; the halves become green and gold dot fields on the same lattice as the swarm plates; the turn slows.
3. **Deep.** The four sectors part along their bisectors (the "parted" mode, four ways). Each sector anchors one block of the page: the teams, the tools, the seam (how they meet), the star (Thoughtform).

## Phases, each one gated on stills the owner reads

| Phase | Output | Size |
|---|---|---|
| P0 | `lib/brandmark/markGeometry.ts` (pure constants) and a lab route `app/(internal)/test/mark-mind/` that imports nothing from the arcs | small |
| P1 | The still: drum, walls, sectors, the mark with the picked depth, procedural floors and circuits, at 1440×820 and 1920×1247, both themes, held next to the image study it must match | a Hero figure, about 2–4 hours |
| P2 | The turn: the contents layer, the seam crossing as particles, the lit crossing | about 2–3 hours |
| P3 | The fraying as a swarm formation leaving the upper left | about 1–2 hours |
| P4 | The scroll states: hero, section, deep, sectors parting | about 2–3 hours |
| P5 | Port into the proposal (`components/xb-proposal/stack/StackFlow.tsx`, in place of `ClosedStack`) and the portfolio, once picked | after the owner's pick |

## Decisions for the owner

1. **The floors:** in section along the cuts (o1) or as terraces on top (o2). Wave 6, "The floors".
2. **The mark's depth:** light (d4), channels (d3), blades (d2) or band (d1). Channels and blades suit the turn best: both are fixed cuts the contents flow past.
3. **The turn:** contents flow through a fixed mark (recommended), or the whole object spins.
4. **The direction:** clockwise, people into machine across the slanted bar, back across the level bar.
