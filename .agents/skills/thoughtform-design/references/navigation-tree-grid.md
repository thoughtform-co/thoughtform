# Navigation Tree Grid

The Navigation Tree Grid is the spatial system that connects the left telemetry rail to page content through hierarchical tree structures. It governs how section titles, breadcrumbs, and content cards are positioned relative to the rail.

---

## Anchor Rule

All section titles sit at **rail-edge + space-3 (8px)** from the left rail vertical line. This is the universal horizontal origin for content hierarchy.

```
CSS: left: calc(var(--hud-padding) + RAIL_WIDTH + 8px)
     paddingLeft: calc(var(--hud-padding) + RAIL_WIDTH + 8px)  (for shell content)
```

This means the first character of any section title aligns with the same horizontal position whether you're on the Dashboard, Journeys overview, Journey detail, or Route workspace.

---

## Tree Indent

Each child level indents by **space-4 (12px)** from its parent. Tree L-connectors are 1px strokes in `dawn-15` bridging the indent gap.

| Level          | Indent  | Example                                    |
| -------------- | ------- | ------------------------------------------ |
| 0 (root)       | 0px     | `JOURNEY: THOUGHTFORM ARCS`, `01 JOURNEYS` |
| 1 (child)      | 12px    | `ROUTE: VULPIA`, journey cards             |
| 2 (grandchild) | 24px    | `IMAGE`, route cards                       |
| 3 (content)    | 36-40px | Waypoint thumbnails                        |

Content items (cards, thumbnails) inherit the indent of their parent title level plus the connector padding.

---

## Typography Hierarchy

Mapped to the Figma monospace HUD scale (9-13px, all uppercase, 0.08em tracking):

| Role          | Token   | Size | Weight | Color             | Example                        |
| ------------- | ------- | ---- | ------ | ----------------- | ------------------------------ |
| Root anchor   | mono-13 | 13px | 500    | dawn-50           | `JOURNEY: THOUGHTFORM ARCS`    |
| Section title | mono-11 | 11px | 400    | gold              | `01 JOURNEYS`, `02 ROUTES`     |
| Sub-label     | mono-11 | 11px | 400    | dawn-30 / dawn-50 | `ROUTE: VULPIA`, `IMAGE`       |
| Data label    | mono-9  | 9px  | 400    | dawn-30           | `WAYPOINT I`, session tooltips |

Section titles use the `.sigil-section-label` class with optional bearing numbers (`01`, `02`, etc.).

---

## Connector Dimensions

| Property                   | Value                             | Token                       |
| -------------------------- | --------------------------------- | --------------------------- |
| Stroke width               | 1px                               | —                           |
| Stroke color               | dawn-15                           | `rgba(236, 227, 214, 0.15)` |
| L-connector horizontal arm | 12-14px                           | ~space-4                    |
| L-connector vertical arm   | Centers on item midpoint          | Dynamic                     |
| Vertical continuation line | 1px wide, fills gap between items | —                           |
| Item gap                   | 8px                               | space-3                     |
| Connector padding-left     | 18px                              | space-5 + 2px               |

---

## Spacing Tokens Used

From the Figma spacing scale (4px quantum, 8px structural cadence):

| Token   | Value | Usage in tree grid                                          |
| ------- | ----- | ----------------------------------------------------------- |
| space-3 | 8px   | Gap between tree items, rail-to-title gap                   |
| space-4 | 12px  | Tree indent per level                                       |
| space-5 | 16px  | Padding inside cards, base connector padding                |
| space-6 | 24px  | Margin below section headers                                |
| space-7 | 32px  | Gap between major panels (e.g. Journey panel / Route panel) |

---

## Patterns by Page

### Dashboard (Hub)

```
01 JOURNEYS  +
├─ [journey card]
├─ [journey card]          02 ROUTES  +
└─ [journey card]            [route cards →]
```

- Left panel: vertical tree from `01 JOURNEYS` to journey cards
- Right panel: `02 ROUTES` with horizontal card layout (no tree connectors)
- Grid: `360px 1fr`, gap space-7

### Journeys Overview

```
01 JOURNEYS  +
[journey card]  [journey card]  [journey card]
```

- Section title at rail anchor
- Cards in responsive grid below (no individual connectors — cards are peers)

### Journey Detail

```
JOURNEYS  (breadcrumb, linked)
  01 ROUTES (2)
  [route card]  [route card]
```

- Breadcrumb at rail anchor
- Routes section uses `SectionHeader` with bearing

### Route Workspace

```
┌─────────────────────────┐
│ ◇ CREATE                │   ← JourneyCardCompact size="compact"
│ ─────────────────────── │      links back to journey page
│ THOUGHTFORM ARCS        │
│ VULPIA                  │   ← routeName prop (dawn-50, 10px)
│ 1 routes  0 gen         │
└─────────────────────────┘
  IMAGE                       ← mode label (gold, 10px)
    ├─ [waypoint thumb I]
    ├─ [waypoint thumb II]
    └─ [+]
```

- Journey context rendered as a `JourneyCardCompact` card (compact size) instead of plain text
- The card contains the journey name **and** the current route name, eliminating the cascading text tree
- Mode label (IMAGE/VIDEO/CANVAS) shown as a small gold label below the card
- Waypoint thumbnails as tree leaves with L-connectors, portaled below the card

---

## Figma Mapping

This grid system maps to the TF Figma design system file sections:

- **Typography → Monospace (HUD / Data)**: mono-9 through mono-13 for tree labels
- **Spacing → space-3 through space-7**: structural cadence for indent, gaps, and padding
- **Colors → Dawn scale**: dawn-15 (connectors), dawn-30 (sub-labels), dawn-50 (anchors)
- **Colors → Gold**: section titles with bearing numbers

A "Navigation Tree Grid" section should be added to the Figma design system page showing:

1. The anchor rule diagram (rail → 8px gap → title)
2. Indent progression (0, 12, 24, 36px)
3. Connector spec (1px dawn-15, L-shape)
4. Typography hierarchy table
