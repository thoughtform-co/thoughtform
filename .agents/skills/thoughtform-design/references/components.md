# Thoughtform Starter Components

Two layers: the **atomic primitive system** (canonical, code-generated, used for everything HUD-shaped) and the **starter component library** (shadcn-style application components layered on top of the primitives).

**Freedom tier:** the atomic primitive system is LOW freedom (exact API, never inline). The starter components are MEDIUM freedom (follow patterns, adapt content).

---

## Atomic primitive system (canonical)

**Source:** `components/brand/*` and `components/hud/*` in each repo. **Full API:** `primitives-api.md`.

As of the Phase 1.5 rebuild, the canonical HUD rendering path is the atomic primitive system. Every brand atom is code-generated from inline SVG path data (extracted from Figma via `use_figma` — see `figma-to-code-playbook.md`). Every HUD primitive resolves positioning through the CSS variable contract defined in `hud-frame-implementation.md` §6.

### Quick reference

- **Brand atoms** (`components/brand/`): `Brandmark`, `Wordmark`, `Diamond`, `StarGlitch`, `StarBurst` — all inline SVG, inherit `currentColor` so Tailwind `text-*` utilities work directly.
- **HUD primitives** (`components/hud/`): `HudGuideLine`, `HudTick`, `HudRail`, `HudRule`, `HudInnerGrid`, `HudUnionCorner`, `HudCrossMark`, `HudCornerBracket` (opt-in).
- **HUD anchors** (`components/hud/`): `HudLogoSlot`, `HudTopLeftIcon`, `HudChapterAnchor`, `HudBrandmarkAnchor`, `HudPaginationAnchor`.
- **HUD composition**: `HudFrame` — drop-in container that works in responsive shell mode (app chrome) and pixel-accurate specimen mode (scoped CSS variable overrides). See `primitives-api.md` for the full prop surface.

### Hard rule (LOW freedom)

**Never inline rail markup, tick math, or chrome anchor positioning in a page component.** Always compose from the atomic primitives. If a new visual need can't be expressed through the existing surface, **add a new primitive** to `components/hud/` or `components/brand/` rather than inlining ad-hoc code in a page. Extend the API, don't fork it.

---

## Starter components (application layer)

10 shadcn-style primitives that cover ~80% of application surfaces across all products (FramePanel, NavTab, LabelNav, DataReadout, StatusBar, ActionButton, TextField, Divider, EventCard, DiamondMarker). These layer ON TOP of the atomic primitive system — they use the same tokens, the same CSS variables, and the same brand atoms. Each entry below maps to grammar elements and is specified for both Figma and code.

---

## 1. FramePanel

Container with corner brackets. Replaces generic cards.

**Grammar**: Viewport Frame + Course Lines + Depth Layers

**Variants**: `subtle` (10px arm), `card` (16px), `frame` (20px), `panel` (24px)

**States**: default, hover (border dawn-15), selected (border gold-15)

**Tokens**:

```css
.frame-panel {
  position: relative;
  background: var(--surface-0);
  border: 1px solid var(--dawn-08);
  padding: var(--space-md);
}
.frame-panel:hover {
  border-color: var(--dawn-15);
}
.frame-panel--selected {
  border-color: var(--gold-15);
}

/* Corner brackets via pseudo-elements — top-left example */
.frame-panel::before {
  content: "";
  position: absolute;
  top: -1px;
  left: -1px;
  width: var(--corner-arm, 16px);
  height: var(--corner-arm, 16px);
  border-top: 2px solid var(--gold-30);
  border-left: 2px solid var(--gold-30);
  pointer-events: none;
}
```

**Figma**: Auto-layout frame. Corner brackets as detached instances positioned at corners. Fill = surface-0. Stroke = dawn-08. Variants: size (subtle/card/frame/panel), state (default/hover/selected), corners (four/tr-bl/tl-br/none).

**Products**: Atlas = heavy use. Synod = settings panels, modals. thoughtform.co = terminal cards.

---

## 2. NavTab

Horizontal tab with icon + label. Top-bar navigation.

**Grammar**: Heading Indicator + Waypoints

**States**: default (dawn-30), hover (dawn-70), active (gold + gold underline)

**Tokens**:

```css
.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 var(--space-lg);
  height: 56px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--dawn-30);
  font-family: var(--font-body);
  font-size: var(--type-sm);
  font-weight: 500;
  cursor: pointer;
  transition:
    color 120ms,
    border-color 120ms;
}
.nav-tab:hover {
  color: var(--dawn-70);
}
.nav-tab--active {
  color: var(--gold);
  border-bottom-color: var(--gold);
}
```

**Figma**: Component set. Icon slot (18px, stroke 1.5). Label text. States: default/hover/active. Auto-layout horizontal, gap 8.

**Products**: Synod = Mail/Calendar tabs. Atlas = section tabs. Astrolabe = mode tabs.

---

## 3. LabelNav

Vertical navigation list with gold left-border active state.

**Grammar**: Heading Indicator + Waypoints + Bearing Labels

**States**: default (dawn-50), hover (dawn + dawn-04 bg), active (gold + gold-10 bg + gold left-border)

**Tokens**:

```css
.label-nav__item {
  display: block;
  width: 100%;
  padding: var(--space-xs) var(--space-md);
  background: transparent;
  border: none;
  border-left: 2px solid transparent;
  color: var(--dawn-50);
  font-family: var(--font-body);
  font-size: var(--type-sm);
  text-align: left;
  cursor: pointer;
  transition:
    color 100ms,
    background 100ms;
}
.label-nav__item:hover {
  color: var(--dawn);
  background: var(--dawn-04);
}
.label-nav__item--active {
  color: var(--gold);
  border-left-color: var(--gold);
  background: var(--gold-10);
}
```

**Figma**: Component set. Optional bearing number prefix (01, 02...). States: default/hover/active. Auto-layout vertical, no gap (items touch).

**Products**: Synod = mail labels. Atlas = inspector sections. Astrolabe = tool palette.

---

## 4. DataReadout

Label+value pair as instrument reading.

**Grammar**: Data Readouts + Signal Strength

**Variants**: horizontal (label left, value right), vertical (label above, value below)

**Tokens**:

```css
.readout {
  display: flex;
  gap: var(--space-xs);
}
.readout--vertical {
  flex-direction: column;
  gap: 2px;
}

.readout__label {
  font-family: var(--font-mono);
  font-size: var(--type-xs);
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dawn-30);
}
.readout__value {
  font-family: var(--font-mono);
  font-size: var(--type-sm);
  color: var(--dawn-70);
}
```

**Figma**: Component with label (dawn-30, mono xs uppercase) and value (dawn-70, mono sm) text layers. Variants: layout (horizontal/vertical), emphasis (default/gold for accent values).

**Products**: Universal. Synod = timestamps, dates. Atlas = telemetry. thoughtform.co = coordinates.

---

## 5. StatusBar

Horizontal strip of scattered metadata.

**Grammar**: Telemetry Rails + Data Readouts + Bearing Labels

**Tokens**:

```css
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-md);
  border-top: 1px solid var(--dawn-08);
  font-family: var(--font-mono);
  font-size: var(--type-xs);
  color: var(--dawn-30);
  letter-spacing: 0.06em;
}
.status-bar__slot {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
```

**Figma**: Auto-layout row, space-between. Contains DataReadout instances in flexible slot groups (left/center/right). Stroke top = dawn-08.

**Products**: thoughtform.co = bottom coordinates. Atlas = panel status. Synod = optional footer.

---

## 6. ActionButton

Sharp-cornered button. Gold border language.

**Grammar**: Waypoints (destination to reach)

**Variants**: primary (gold border), secondary (dawn-08 border), ghost (no border)

**States**: default, hover (gold-10 bg, gold border), active (gold bg, void text), disabled (0.4 opacity)

**Tokens**:

```css
.action-btn {
  padding: var(--space-xs) var(--space-lg);
  background: transparent;
  border: 1px solid var(--gold-15);
  color: var(--gold);
  font-family: var(--font-body);
  font-size: var(--type-sm);
  font-weight: 500;
  cursor: pointer;
  transition:
    background 120ms,
    border-color 120ms;
}
.action-btn:hover:not(:disabled) {
  background: var(--gold-10);
  border-color: var(--gold);
}
.action-btn:active {
  background: var(--gold);
  color: var(--void);
}
.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Secondary */
.action-btn--secondary {
  border-color: var(--dawn-08);
  color: var(--dawn-70);
}
.action-btn--secondary:hover:not(:disabled) {
  border-color: var(--dawn-15);
  color: var(--dawn);
  background: var(--dawn-04);
}

/* Ghost */
.action-btn--ghost {
  border-color: transparent;
}
.action-btn--ghost:hover:not(:disabled) {
  background: var(--dawn-04);
}
```

**Figma**: Component set. Variants: type (primary/secondary/ghost), state (default/hover/active/disabled), size (sm/md/lg via padding).

**Products**: Universal.

---

## 7. TextField

Input with gold focus ring. Zero radius.

**Grammar**: Course Lines (border) + Signal Strength (focus = signal acquired)

**States**: empty, focused (gold border + gold-15 shadow), filled, error (alert border)

**Tokens**:

```css
.text-field {
  width: 100%;
  padding: var(--space-xs) var(--space-sm);
  background: var(--surface-0);
  border: 1px solid var(--dawn-08);
  color: var(--dawn);
  font-family: var(--font-body);
  font-size: var(--type-base);
  transition: border-color 120ms;
}
.text-field::placeholder {
  color: var(--dawn-15);
}
.text-field:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 1px var(--gold-15);
}
.text-field--error {
  border-color: var(--alert);
}
```

**Figma**: Component with states (empty/focused/filled/error). Label text above (optional). Placeholder text inside (dawn-15).

**Products**: Universal.

---

## 8. Divider

1px line with optional bearing label.

**Grammar**: Course Lines + optional Bearing Labels

**Variants**: plain (line only), labeled (line with centered text)

**Tokens**:

```css
.divider {
  border: none;
  border-top: 1px solid var(--dawn-08);
}
.divider--labeled {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.divider--labeled::before,
.divider--labeled::after {
  content: "";
  flex: 1;
  border-top: 1px solid var(--dawn-08);
}
.divider__label {
  font-family: var(--font-mono);
  font-size: var(--type-xs);
  color: var(--dawn-30);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
```

**Figma**: Line component with optional centered label. Variants: plain/labeled, orientation (horizontal/vertical).

**Products**: Universal.

---

## 9. EventCard

Compact card for calendar events, list items, thread previews.

**Grammar**: FramePanel (subtle) + Data Readouts + Signal Strength

**Tokens**:

```css
.event-card {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--dawn-04);
  cursor: pointer;
  transition: background 80ms;
}
.event-card:hover {
  background: var(--dawn-04);
}
.event-card--selected {
  background: var(--gold-10);
  border-left: 2px solid var(--gold);
}
.event-card__date {
  font-family: var(--font-mono);
  font-size: var(--type-xs);
  color: var(--gold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.event-card__title {
  font-size: var(--type-sm);
  font-weight: 500;
  color: var(--dawn);
}
.event-card__meta {
  font-size: var(--type-xs);
  color: var(--dawn-50);
}
```

**Figma**: Auto-layout vertical. Slots: date (gold mono), title (dawn), meta (dawn-50). States: default/hover/selected. Optional corner brackets for emphasis variant.

**Products**: Synod = thread list items, calendar events. Atlas = search results. Astrolabe = document list.

---

## 10. DiamondMarker

Rotated-45deg square. Universal replacement for circles.

**Grammar**: Waypoints

**Sizes**: 6px, 8px, 12px

**Color variants**: gold (active), dawn-30 (inactive), dawn (neutral), alert (warning)

**Tokens**:

```css
.diamond {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--gold);
  transform: rotate(45deg);
}
.diamond--sm {
  width: 6px;
  height: 6px;
}
.diamond--md {
  width: 8px;
  height: 8px;
}
.diamond--lg {
  width: 12px;
  height: 12px;
}
.diamond--inactive {
  background: var(--dawn-30);
}
.diamond--neutral {
  background: var(--dawn);
}
.diamond--alert {
  background: var(--alert);
}
```

**Figma**: Tiny component. Rectangle rotated 45deg. Variants: size (sm/md/lg), color (gold/dawn/dawn-30/alert).

**Products**: Universal. Bullets, status indicators, breadcrumbs, progress markers, list markers.

---

## Emerged Patterns (Sigil Codebase)

The following patterns emerged organically in the Sigil codebase and are now codified as part of the component library.

---

## 11. CategoryRow

Diamond marker + uppercase label above a course-line divider. Identifies content type at the top of a card or row.

**Grammar**: Waypoints + Course Lines + Data Readouts

**Anatomy**:

```
[◇] CATEGORY LABEL
─────────────────────
```

**Tokens**:

```css
.category-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dawn-40);
}
.category-row__diamond {
  width: 6px;
  height: 6px;
  transform: rotate(45deg);
  flex-shrink: 0;
}
.category-row__diamond--active {
  background: var(--gold);
}
.category-row__diamond--inactive {
  background: var(--dawn-30);
}
.category-row__divider {
  border-top: 1px solid var(--dawn-08);
  margin-top: 10px;
  padding-top: 10px;
}
```

**Figma**: Auto-layout horizontal. Diamond instance (6px, rotated 45deg) + label text. Divider is a separate 1px line below with 10px top margin. Variants: type (learn=gold diamond, create=dawn-30 diamond).

**Products**: Sigil = JourneyCard, JourneyPanel row headers.

---

## 12. ParticleIcon

Pixel-art SVG icons built from small `<rect>` elements on a grid. The Thoughtform take on iconography: sharp, geometric, no strokes, no curves. Each icon is composed from three conceptual layers (skeleton, signal, drift) per the particle-icon-grammar.

**Grammar**: Compass Anchor + Waypoints

**Construction**:

- Grid: 3px (nav icons), 2px (inline icons)
- Pixel size: `GRID - 1` (leaves 1px gap between pixels)
- SVG `imageRendering: pixelated`
- Color: `currentColor` for inheritance or explicit RGB values
- Opacity gradient: trailing particles fade `0.45 → 0.6 → 0.8 → 1.0` to suggest motion/direction

**Glyph variants**:

- `arrow` — horizontal motion trail with arrowhead (12x12). Used as navigation affordance on cards.
- `logo` — diamond outline + inner cross (32x32). Used as brandmark in top nav.
- `settings` — cross + corner dots (18x18). Used for admin settings link.
- `theme` — sun (6-point ring) / moon (8-point ring + outer dots) (18x18). Used for theme toggle.

**Sizes**: 12x12 (inline), 18x18 (nav controls), 32x32 (logo)

**Animation**: Optional pulse via CSS (`opacity 0.48 → 1`, 2s ease-in-out infinite) on the logo variant.

**Tokens**:

```css
.particle-icon {
  display: block;
  image-rendering: pixelated;
}
.particle-icon--active {
  color: var(--gold);
}
.particle-icon--inactive {
  color: var(--dawn);
}
```

**Figma**: Component set. Each glyph as a variant. Sizes: sm (12px), md (18px), lg (32px). States: default, active (gold).

**Products**: Sigil = JourneyCard arrow, NavigationFrame (logo, settings, theme toggle), JourneyPanel rows.

---

## 13. HoverCornerAccents

Four absolute-positioned L-brackets that appear on card hover. Derived from the Viewport Frame primitive but applied at card scale with opacity transition.

**Grammar**: Viewport Frame (card preset)

**Dimensions**: 14px arms, 1px gold borders, positioned at -1px offset from card edges.

**Tokens**:

```css
.hover-corners {
  position: relative;
}
.hover-corners__corner {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--duration-base);
}
.hover-corners:hover .hover-corners__corner {
  opacity: 1;
}
.hover-corners__corner--tl {
  top: -1px;
  left: -1px;
  border-top: 1px solid var(--gold);
  border-left: 1px solid var(--gold);
}
.hover-corners__corner--tr {
  top: -1px;
  right: -1px;
  border-top: 1px solid var(--gold);
  border-right: 1px solid var(--gold);
}
.hover-corners__corner--bl {
  bottom: -1px;
  left: -1px;
  border-bottom: 1px solid var(--gold);
  border-left: 1px solid var(--gold);
}
.hover-corners__corner--br {
  bottom: -1px;
  right: -1px;
  border-bottom: 1px solid var(--gold);
  border-right: 1px solid var(--gold);
}
```

**Figma**: Detached corner bracket instances. 14px arm, 1px gold stroke. Four positioned at corners. Opacity: 0 default, 1 on hover state.

**Products**: Sigil = JourneyCard, AuthForm, any interactive card surface.

---

## 14. ChamferedPanel

Container with `clip-path` polygon corners creating angled chamfer cuts. Zero border-radius alternative that feels machined and instrument-like.

**Grammar**: Viewport Frame + Depth Layers

**Tokens**:

```css
.chamfered-panel {
  clip-path: polygon(
    var(--chamfer, 12px) 0,
    calc(100% - var(--chamfer, 12px)) 0,
    100% var(--chamfer, 12px),
    100% calc(100% - var(--chamfer, 12px)),
    calc(100% - var(--chamfer, 12px)) 100%,
    var(--chamfer, 12px) 100%,
    0 calc(100% - var(--chamfer, 12px)),
    0 var(--chamfer, 12px)
  );
  background: var(--surface-0);
}
```

**Figma**: Frame with clip-path applied. Variants: chamfer size (sm=8px, md=12px, lg=16px).

**Products**: Sigil = RouteCard, ImageDiskStack.

---

## 15. BackLink _(deprecated — replaced by NavSpine root segment)_

Compact `<- label` navigation link. Replaced by the **NavSpine** component (#18), where the root text of the tree hierarchy serves as the back link. Clicking it navigates to the parent context.

**Migration**: Remove standalone BackLink instances. Use `NavigationFrame` with auto-detected or explicit `breadcrumbOverride` segments instead. The root segment inherits the same hover-to-gold behavior.

**Grammar**: Heading Indicator (reversed — pointing back)

**Tokens**: _(preserved for reference)_

```css
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dawn-40);
  text-decoration: none;
  transition: color var(--duration-fast);
}
.back-link:hover {
  color: var(--gold);
}
.back-link__arrow {
  font-size: 12px;
}
```

**Products**: Sigil = formerly Journey detail, Route pages. Now handled by NavSpine.

---

## 16. InlineAction

Small button placed directly next to a section title or page title. Pattern: `+` character or diamond marker + label. Borderless or with subtle border. Used for create/add actions without a separate toolbar.

**Grammar**: Waypoints (action as destination)

**Tokens**:

```css
.inline-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--dawn-30);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  transition: color var(--duration-fast);
}
.inline-action:hover {
  color: var(--gold);
}
```

**Figma**: Tiny component. 24x24 hit area. "+" or diamond icon. States: default (dawn-30), hover (gold).

**Products**: Sigil = Journey list header (create journey), Journey detail header (create route).

---

## Canonical Card Anatomy

The JourneyCard has established a card anatomy that should be the canonical pattern for all content cards in the system:

```
+------------------------------------------+
| [◇] CATEGORY                       [...] |  ← CategoryRow + optional admin menu
|------------------------------------------|  ← Course Line divider
| TITLE                          [→ icon]  |  ← Title + ParticleArrow
|                                          |
| Description text                         |  ← Optional body (Signal Strength)
|                                          |
| 3 routes  ·  12 generations             |  ← DataReadout row
+------------------------------------------+
   ↑ HoverCornerAccents on hover
```

**Zone mapping to grammar primitives**:

| Zone    | Content                                  | Grammar Primitives                               |
| ------- | ---------------------------------------- | ------------------------------------------------ |
| Top     | Diamond + category label + admin actions | Waypoint + Data Readout + optional InlineAction  |
| Divider | 1px horizontal line                      | Course Line                                      |
| Title   | Heading + navigation affordance          | Signal Strength (primary) + ParticleIcon (arrow) |
| Body    | Description text                         | Signal Strength (secondary, dawn-50)             |
| Footer  | Metric counts                            | Data Readouts (mono, uppercase, 9px)             |
| Frame   | Corner brackets on hover                 | Viewport Frame (card preset, HoverCornerAccents) |

**Base tokens**: `background: var(--surface-0)`, `border: 1px solid var(--dawn-08)`, `padding: 12px 20px 20px`, `min-height: 148px`.

---

## 17. HudRail

Fixed vertical telemetry **rail aside** at the viewport edge. Contains a **guide hairline** and **outward** tick marks (Figma `120:968` / `120:1191–1209`).

**Grammar**: Telemetry Rails + Bearing Labels + Course Lines

**Anatomy**:

- Fixed `<aside>` at `var(--hud-margin)`; width `var(--hud-rail-width)` = `clamp(48px, 4.27vw, 82px)`
- Vertical extent uses `var(--hud-rail-top)` / `var(--hud-rail-bottom)`; tick container inset by `var(--hud-corner-zone)` top/bottom
- **Guide:** 1px vertical hairline at `var(--hud-rail-guide-inset)` from the aside’s inner edge; gradient fade at ends
- **Ticks:** `HUD_TICK_MARKS` — y-position as **% of guide-zone height**; width 7px (minor) or 21px (major); **outward** from guide
- **Labels (left rail only):** mono 9px — `2` / `5` on major rows; `7` on designated low bearing (see `leftRailTickLabel` in `rail-contract.ts`)
- **Straight L-corners** (node `120:415`): arm 24px, stub 23px, anchored from guide inset — not full-bleed squares. **Vertex:** horizontal + vertical strokes must not overlap at the joint (offset vertical by stroke thickness — see [hud-frame-implementation.md](./hud-frame-implementation.md))

**Variants**: Left rail (labels), Right rail (Sigil: major tick scroll-reveal). **Arc overlay:** optional `frameLabels` (top-right section, bottom-right pagination).

**Tokens** (representative):

```css
.hud-rail-aside {
  position: fixed;
  z-index: 30;
  top: var(--hud-rail-top);
  bottom: var(--hud-rail-bottom);
  width: var(--hud-rail-width);
  pointer-events: none;
}
/* Guide + ticks: see Astrolabe NavigationGrid / ForgeHUDOverlay */
```

**Constants**: [spatial-system.md](./spatial-system.md). **Cross-repo HUD playbook:** [hud-frame-implementation.md](./hud-frame-implementation.md). **Code source of truth:** `lib/navigation/rail-contract.ts` (`HUD_TICK_MARKS`, `slideGuideInsetPx`, …). **Legacy:** `SIGIL_TICK_COUNT = 24` (25 equal ticks) — do not use for new HUD frames.

**Figma**: TF file `h46nSII3A8lC7Y2eYGU7X9` — nodes `120:968`, `120:415`, `120:1191–1209`.

**Products**: Sigil = authenticated shell. Astrolabe = `NavigationGrid` (shell) + Arc `ForgeHUDOverlay` (slides). Atlas / thoughtform.co = product-specific intensity.

---

## 18. NavSpine

Vertical breadcrumb tree fixed alongside the left HUD rail. Encodes hierarchical position and, at workspace depth, available waypoints via portal slot. See also grammar primitive #12 (Nav Spine).

**Grammar**: Nav Spine + Telemetry Rails + Waypoints + Course Lines + Heading Indicator

**Anatomy**:

```
ROOT LABEL              ← back link (click navigates to parent)
 └ CHILD LABEL          ← current depth (tree connector)
    ├ [48px thumb]      ← waypoint (portal slot content)
    ├ [48px thumb]
    └ [+]               ← create new waypoint
```

**States**: root default (`dawn-30`), root hover (`gold`), child current (`dawn-50`), waypoint active (gold border + corner brackets), waypoint inactive (`dawn-08` border)

**Tokens**:

```css
.nav-spine {
  position: fixed;
  z-index: 40;
  pointer-events: auto;
  top: calc(var(--hud-padding) + 32px);
  left: calc(var(--hud-padding) + 46px);
}
.nav-spine__label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dawn-30);
  transition: color 100ms ease;
}
.nav-spine__label:hover {
  color: var(--gold);
}
.nav-spine__label--current {
  color: var(--dawn-50);
}

/* SVG tree connectors (not CSS borders) */
.nav-spine__connector path {
  stroke: var(--dawn-15);
  stroke-width: 1;
  stroke-linecap: square;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
}

/* Active target brackets */
.nav-spine__bracket {
  position: absolute;
  width: 4px;
  height: 4px;
  border: 1px solid var(--gold);
}

/* Waypoint create button */
.nav-spine__create {
  width: 48px;
  height: 40px;
  border: 1px dashed var(--dawn-15);
  background: transparent;
  transition:
    border-color 120ms,
    background 120ms;
}
.nav-spine__create:hover {
  border-color: var(--gold);
  border-style: solid;
  background: rgba(202, 165, 84, 0.08);
}

@media (max-width: 980px) {
  .nav-spine {
    display: none !important;
  }
}
```

**Architecture**: `NavSpineContext` + `useNavSpine()` hook provides a portal ref. `NavigationFrame` auto-detects breadcrumb segments from pathname and renders the tree. Pages can override via `breadcrumbOverride` prop. `WaypointBranch` portals waypoint thumbnails into the tree slot.

**Animation**: `spineTelemetryIn` keyframes — 250ms ease per node, 60ms stagger delay.

**Figma**: Vertical auto-layout. Root label + indented child labels with 1px L-connector lines. Waypoint thumbnails as 48×48 instances. Create button as dashed-border frame. Variants: depth (1-level/2-level/with-waypoints).

**Products**: Sigil = route workspace, journey detail, lesson pages. Atlas = full hierarchy with deep nesting. Synod = none.

---

## 12. JourneyCardCompact

Adaptive journey context card. A single primitive used across Dashboard, Journeys overview, and Route workspace nav spine. Built on `CardFrame` with `Diamond` category indicator.

**Grammar**: FramePanel (surface-0 + corner brackets) + Bearing Labels (category) + Data Readouts (stats)

**Variants**: `default` | `compact` | `mini`

| Variant | Padding        | Shows                                                             | Usage                                          |
| ------- | -------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| default | 10px 14px 14px | Category, divider, name, action slot, routeName (optional), stats | Dashboard journey list, Journeys overview grid |
| compact | 8px 12px 12px  | Category, divider, name, routeName, stats (smaller font)          | Route workspace nav spine                      |
| mini    | 6px 10px       | Category, name only                                               | Fallback for tight spaces                      |

**Props**:

| Prop            | Type       | Purpose                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------- |
| name            | string     | Journey name (title row)                                                  |
| type            | string?    | "learn" or "create" — drives category diamond color                       |
| routeName       | string?    | Current route name, shown as secondary line below title (compact/default) |
| routeCount      | number?    | Stat readout                                                              |
| generationCount | number?    | Stat readout                                                              |
| href            | string?    | Makes card a Link                                                         |
| onClick         | fn?        | Makes card interactive (e.g. select on Dashboard)                         |
| selected        | boolean    | Gold-10 background + gold-30 border                                       |
| size            | string     | "default", "compact", or "mini"                                           |
| action          | ReactNode? | Right-side slot (e.g. Open button on Dashboard)                           |

**Tokens**:

```css
/* Inherits from CardFrame */
.card-frame { background: var(--surface-0); border: 1px solid var(--dawn-08); }
.card-frame:hover { border-color: var(--dawn-15); } /* + gold corner brackets */

/* Category row */
font: var(--font-mono), 9px, 0.1em tracking, uppercase, dawn-40

/* Title */
font: var(--font-mono), 11-12px, 0.08em tracking, uppercase, dawn (default) / gold (selected)

/* Route name (secondary) */
font: var(--font-mono), 10px, 0.06em tracking, uppercase, dawn-50

/* Stats */
font: var(--font-mono), 8-9px, 0.05em tracking, uppercase, dawn-50 (default) / gold-50 (selected)
```

**States**: default, hover (corner brackets appear via CardFrame), selected (gold-10 bg, gold-30 border)

**Figma**: Auto-layout frame. Category row (Diamond instance + text). Divider (1px dawn-08 line). Name text. Optional route-name text. Optional stats row. Variants: size (default/compact/mini), state (default/hover/selected), content (with-route/without-route). Map to [TF Design System](https://www.figma.com/design/h46nSII3A8lC7Y2eYGU7X9/TF?node-id=1-1586) component library.

**Products**: Sigil = Dashboard (default), Journeys overview (default), Route workspace spine (compact). Atlas = journey context cards. Synod = none.
