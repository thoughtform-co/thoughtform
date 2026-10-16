# Inspiration Extractions

Patterns decomposed from reference screenshots and mapped to Thoughtform grammar.

**This is the hand-curated seed set, not the library.** The full pool — every reference in
`_01_GENERAL REFERENCES`, distilled the same way — lives in the substrate vault and is reached with
`vault_search { query: "…", rack: "design" }`. Query there first; it is larger, it is searchable by
style facet, and it points at the original images.

What stays here is the promoted tier: a decomposition earns a place in this file once a session has
proven it load-bearing for Thoughtform work. Add sparingly, and by that test alone.

---

## Thoughtform.co (Homepage)

**Source**: https://thoughtform.vercel.app/

### Layout

- Fixed HUD frame with corner brackets at viewport edges (Viewport Frame, hud preset)
- Split layout: content left (45%), particle visualization right (55%)
- Content in terminal-style cards with corner brackets (FramePanel)

### Patterns Extracted

- **Gold chevrons** (`>>>>>`) as directional/progress indicators — map to Waypoints
- **Telemetry readouts** in bottom-left (delta, theta, rho, zeta) — Data Readouts at xs/mono
- **Section numbering** on right rail (01-05) — Bearing Labels
- **Measurement ticks** along left rail — Telemetry Rails
- **Scroll-as-descent** through Z-space — the navigation metaphor made literal
- **Bottom bar** with coordinates and scroll instruction — StatusBar component pattern

### What's Novel

- Particle field as ambient atmosphere (product-specific, not universal)
- Greek-letter telemetry (delta/theta/rho/zeta) as readout vocabulary

---

## Cyberpunk 2077 — Arasaka Terminal

**Source**: Screenshot (Cyberpunk 2077 game UI)

### Layout

- Centered dual-panel login — symmetrical composition
- Brand + navigation top-left, status (time/location) top-right
- Geometric accent lines at bottom forming angular frame

### Patterns Extracted

- **Monochrome gold-on-dark** — maps directly to our Gold + Void palette
- **All-caps monospace labels** for every UI element — Data Readouts
- **Angular bottom frame** — decorative Course Lines with geometric intent
- **Progress bars with gold fill** — linear, sharp-terminated (no rounded ends)
- **Status metadata** (10:10 PM / Night City / Area) — StatusBar with location context

### What's Worth Adopting

- The angular geometric accent lines (bottom frame) as a decorative Course Line variant
- Location/time metadata in a consistent position (top-right) across products

### What to Avoid

- CRT scan-line effects (atmosphere-only, doesn't translate to productivity tools)
- The purple/blue gradient in the background (explicitly anti-pattern)

---

## Rocket-001 Space HUD

**Source**: Screenshot (space mission control UI)

### Layout

- Dense multi-panel dashboard with corner brackets on every panel
- Ruler/measurement scale along bottom edge
- Panels positioned around central spatial map

### Patterns Extracted

- **Nested corner brackets** on every panel — Viewport Frame at card/frame preset
- **Ruler-scale along bottom** — Telemetry Rails (number line variant)
- **Status grid** (label + value in monospace) — DataReadout component, horizontal layout
- **Position log** as scrolling data table — dense Data Readouts in table form
- **Color-coded status** (red for warnings, white for normal) — Alert token for danger states

### What's Worth Adopting

- The ruler/number-line Telemetry Rail along bottom edge — good for timeline or scroll-position contexts
- Nested panels: frame-within-frame depth using corner brackets at different presets

### What to Avoid

- Red as a primary accent color (our accent is gold; red = alert/danger only)
- Over-dense panel layouts for productivity tools (appropriate for Atlas, not Synod)

---

## Starfield — Character Menu

**Source**: https://interfaceingame.com/games/starfield/

### Layout

- Clean left-rail navigation with underline active state
- Central character visualization (context-dependent)
- Right panel with stat grids and description text
- Generous negative space

### Patterns Extracted

- **Left-rail nav with underline active** — Heading Indicator (horizontal variant) + LabelNav
- **Stat display** as icon + metric label + value — DataReadout with icon slot
- **Brutalist type hierarchy**: large section headers (600 weight), small data labels (400, mono)
- **Horizontal dividers only** — Course Lines, no vertical separators between content areas
- **Context-dependent right panel** — content changes based on left selection

### What's Worth Adopting

- The clean underline-only active state (no background, no border — just a line). Purer than our current left-border pattern.
- Icon + label + value stat pattern for the DataReadout component
- Generous negative space as a deliberate design choice, not laziness

### What to Avoid

- The gray-blue tint in backgrounds (our void is warm, not cool)
- Rounded avatar frame (use diamond or corner-bracket frame instead)

---

## Arpegra

**Source**: https://arpegra.framer.website/

### Layout

- Full-screen sections with central cross/crosshair as navigation element
- Content revealed through scroll/navigation movement
- Terminal-style footer with coordinates and system status

### Patterns Extracted

- **Central cross element** as spatial anchor — Compass Anchor, literal variant
- **Systematic numbering** [01], [02], [03] for services/sections — Bearing Labels
- **Terminal footer** with coordinates and system links — StatusBar
- **Information density varies by zone** — dense at edges, sparse at center
- **Monospace metadata** scattered at screen edges — Data Readouts as ambient information

### What's Worth Adopting

- The cross/crosshair as a literal navigational anchor — very aligned with our brandmark
- Zone-based information density (edges = dense instrument data, center = content focus)
- The `[SYSTEM LINK ESTABLISHED]` / `[STATUS: OPERATIONAL]` label pattern as decorative Bearing Labels

### What to Avoid

- The brutalist all-caps body text (our body text is sentence case, light weight)
- Excessive edge-to-edge monospace (fine for a portfolio, too much for a productivity tool)

---

## Flywheel Handoff Reference Set

**Source**: `sentinel/research/handoff-transition/reference-extractions.md`

### Layout

- Corridor-to-services transition references for the home-v2 handoff after the substrate-globe epilogue.
- Useful split: persistent artifact / calm service copy / final docked proof object.
- Capture set includes Lando Norris, iyo One, Sleep Well Creatives, Zentry, Dead Rabbit Moon, and Astral Frontier. Auremin was partial; Hashgraph VC, Active Theory, Glyphic Bio, and Pixila timed out in automation and are documented as blockers in the research file.

### Patterns Extracted

- **Docked proof object** from Lando Norris — maps to a services/build-cases dock rather than an ecommerce cart.
- **Fixed celestial instrument** from Dead Rabbit Moon and Astral Frontier — maps to a pinned intelligence artifact with sparse scrolling copy.
- **DOM mask/shutter transition** from Zentry — maps to a performant chapter cut without adding more WebGL.
- **Quiet product-spec rhythm** from iyo One — maps to one idea per viewport, large type, generous line spacing.
- **Sphere-to-layout transformation** from Auremin/supplied reference — maps to the collapse-and-unfold prototype.

### What's Worth Adopting

- Let the artifact remain the orientation object when the story still needs continuity.
- Use the veil/mask only as a short transition, not a persistent overlay.
- Keep the services layer editorial and sparse; the particle/corridor section has already spent the motion budget.

### What to Avoid

- Purple Zentry palette, ecommerce literalism, rounded capsules, and crypto/agency spectacle.
- Turning Navigate / Encode / Build into three equal PowerPoint cards.

---

## The October web set (2026-10-11 → 16)

Seventeen sites the owner pointed at while the X-Bionic proposal, the swarm and the machine
brain were made. Decoded from their markup (2026-10-16), against his own verdicts in
`docs/design/xbionic-proposal/feedback-2026-10-11/02-website-inspiration.md` (where a voice
transcript logs some under misheard domains: cctp.tech = sstr.tech, vitejs.dev = voidzero.dev,
dispatch.co = dispatch.framer.website). How they landed in the house language:
`brand-language-2026-10.md`.

| Site | What it teaches Thoughtform | Verdict |
|---|---|---|
| unsiloed.ai | Isometric planes drawn live in the page (not images); grey hairlines carry all structure; near-square corners; bracketed mono indices `[01]`; the copy column sticks while the flow scrolls past. Owner: "more like a North Star"; "a sticky here and then they basically show their flow." | adopt (North Star) |
| griffin.com | A sticky isometric stack of four layers ordered by ownership (your app → your tech → our platform → our licence) with step navigation: ownership drawn as order. | adopt |
| arrakis.tech/platform | Sticky left index, mono `01 / 02 / 03` labels; the source of the stack that travels across three sections. | adopt |
| rollups.com/ruv | Mono step markers as a dated ledger (`TODAY / DAY 03 / DAY 30+`). Owner: keep the side borders, not the full-width divider, which "would kind of mess up with … our left and right rail." | adapt (ledger; no cross-rule) |
| enerblock.net | A pinned diagram that changes while copy scrolls; captions set as drawing title blocks ("Drawing No.: 158.01.00 Scale: 1/100"), fit for our isometric plates. | adapt |
| getcluster.ai | A three-phase horizontal flow with step chips; the rest (16px radii, handwriting, paper) is not ours. Owner: "I definitely like this flow." | adapt (the flow only) |
| dispatch.framer.website | The palette nearest ours (charcoal, cream ink, one orange accent), dashed connectors, "four layers that connect, decide, and execute": one accent working as a role. | adapt |
| cofounder.co | Sub-numbered mono chapters (`1.0`, `1.1–1.4`) and `x/y` progress readouts. Owner: "too small, a bit too much text… I like the way they use their fonts." | adapt (index and readouts) |
| sstr.tech | Mono status preloader, before/after figures as proof; four corner notches. Owner: "having breathing room, this is nice" but four notches read as "a sort of post stamp". | adapt (one notch) |
| voidzero.dev | Sticky left sidebar beside centred content; a dated timeline. Owner: "everything is like centered." | adapt |
| lighthousehq.com | Rolling odometer counters for stats; fits our readouts. | adapt (the counter) |
| augustus.com | One ink colour for every diagram (blue there; gold here). Owner: "I love how they use like their blue diagrams." | adapt (one ink for diagrams) |
| atomictessellator.com | (did not load for the decode) Owner: the isometric visuals and particles are worth borrowing; "not a big fan of… these forward slashes and the zero." | adapt |
| spade.com | A full-height pinned stage; four clipped corners per frame and a video ground. Owner: "videos are less pure than just using SVG." | not for us (keep the pinned stage idea) |
| euclidpower.com | Sticky platform stage, but four pastel accents and screenshot video. | not for us |
| primeintellect.ai | One green accent on near-black, dense uppercase. Owner: "more like dense… not necessarily what I want." | not for us |
| nogood.studio | An illustrator's portfolio: pixel fonts, asymmetric sticky columns. | not for us |

**What recurs across the set** (and is now house law where it fits):

- **One pinned diagram, read in steps** while the copy scrolls (Unsiloed, Griffin, Enerblock, Arrakis): draw it once, step through it.
- **An isometric layered stack as the main picture**, ordered by who owns which layer (Griffin).
- **Mono indices and readouts as chrome**: `[01]`, `1.0`, `0/3`, `DAY 30`, title-block captions. Avoid slashes and stray zeros (the owner's dislike).
- **Hairline structure, square corners**: never a full-width cross-rule, never four notches.
- **One accent per page**, carrying the data; diagrams **drawn in code, not video**.
