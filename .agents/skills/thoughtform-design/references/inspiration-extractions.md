# Inspiration Extractions

Patterns decomposed from reference screenshots and mapped to Thoughtform grammar. This file grows over time.

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
