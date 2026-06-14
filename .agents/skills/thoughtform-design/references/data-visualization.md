# Thoughtform Data Visualization

Charting rules, line weights, and semantic color mapping. Graphs and telemetry should feel like instrument readouts, not decorative dashboards.

---

## Line Weights

- **Primary data:** 1px (hairline). No thicker strokes for standard series.
- **Secondary / grid:** 1px, use `--dawn-08` or `--dawn-04` so data reads first.
- **Emphasis:** Same 1px; use color (gold, atreides, alert) to signal importance, not weight.

---

## Data Points

- **Shape:** Diamonds (45° rotated squares), not circles. Size: 4–6px for standard density.
- **No decorative fills:** Avoid large filled areas under lines unless they encode a distinct variable (e.g. range band). Prefer line + diamond markers.

---

## Semantic Color Mapping

| Meaning                         | Token                         | Use For                                        |
| ------------------------------- | ----------------------------- | ---------------------------------------------- |
| Primary series / "you are here" | gold                          | Main metric, current value, selected series    |
| Positive / success / authorship | atreides-light, atreides-dark | Composed content, success state, confirmations |
| Warning / attention             | alert                         | Thresholds, warnings, negative trend           |
| Neutral / secondary             | dawn-30, dawn-50              | Secondary series, grid, labels                 |
| Faint / context                 | dawn-08, dawn-04              | Grid lines, background structure               |

**Rule:** Use at most 2–3 distinct data colors per chart. Use opacity and line style (solid vs. dashed) for additional series when needed.

---

## Axes & Labels

- **Font:** Mono (IBM Plex Mono or PT Mono). Uppercase optional for axis labels.
- **Size:** 9–11px for tick labels and axis titles.
- **Color:** dawn-30 for labels, dawn-50 for ticks/grid. Gold only for emphasized axis (e.g. current time marker).

---

## Grid & Background

- **Grid lines:** 1px, dawn-04 or dawn-08. Horizontal and vertical only; no diagonal unless it encodes data.
- **Background:** void or surface-0. No gradient fills in chart area unless brand-approved for a specific viz.

---

## Chart Types

- **Line charts:** 1px lines, diamond markers at data points. No area fill unless encoding a band.
- **Bar charts:** 1px stroke on bars, fill with gold/atreides/dawn at low opacity. No rounded bar caps.
- **Scatter:** Diamond markers only. Size by value if needed; keep scale subtle.

---

## What Never Appears

- Rounded line caps or round data points
- Gradient fills for decoration
- More than three accent colors in one chart
- Thick strokes (2px+) for data series
- Playful or illustrative chart styling
