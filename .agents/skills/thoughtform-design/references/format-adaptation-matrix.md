# Format Adaptation Matrix

**Freedom tier: MEDIUM** (the matrix is canonical; rows can be extended for new formats, but existing rows are authoritative).

Load this doc first whenever you are deciding how to build any Thoughtform artifact. It answers: **for format X, which HUD elements appear, which are omitted, which are density-scaled?**

## 1. HUD element taxonomy

Every HUD element falls into one of three bands. Classification matters because it determines what you can and cannot adjust per format.

### Always-on anchors (cross-format invariants)

Present on **every** Thoughtform artifact at brand level. Placement adapts per format — presence does not. Omitting an always-on anchor is a brand violation, not a style choice.

- **Left rail** (vertical guide line + ticks)
- **Right rail** (vertical guide line + ticks)
- **Gold chevron / compass** — the "you are here" indicator. Its metaphor changes per format (waypoint on slides; scroll depth on web) but it is always present.
- **Brandmark** — placed bottom-left by default, 40px reference size.
- **Gold = active, always** — gold never appears in non-wayfinding contexts; active/current state is always gold.

### Format-specific chrome

Present in some formats by canonical rule, absent in others. Omission is a **rule**, not a taste decision. If the matrix says `—`, you do not add the element back because it "looks nicer."

- **Pagination number** (bottom-right)
- **Client logo slot** (top-left) — for external client decks only
- **Chapter / section label** (top-right, with 30px rule)
- **Title-system heading icon** (crosshair + diagonal, large) — chapter/title slides only
- **HUD coord readout** (`δ θ ρ ζ` bottom bar) — web desktop only
- **Instruction text band** (e.g. "Scroll to descend…") — web only
- **Section markers on right rail** (numbered dots, active/past/future states) — web and app shells only

### Conditional / density-scaled

Present on every format but density, label visibility, and sizing vary. These are adjustments, not omissions.

- **Tick count** — 13 (bearing grid) or 21 (depth gauge). See `hud-frame-implementation.md` §3b.
- **Tick label visibility** — shown at desktop / reference canvas; hidden at mobile / small canvas.
- **Tick width** — 7/21 px at reference; 6/12 px on mobile; scales via `--tf-scale` on fixed canvases, reduces at breakpoints on responsive.
- **Rail width** — 82px (slide reference), 60px (web desktop), 32px (≤768px), 28px (≤480px).
- **Corner brackets** — 2px arms at desktop; 1.5px at tablet; may hide at micro.

## 2. Format × element matrix

Cells: `✓` = present per canonical; `—` = omitted by rule; variant tag (e.g. `13`, `21`, `compact`) = the density/variant used; `opt.` = optional, judgment call permitted.

| Format                          | Rails     | Ticks                     | Chevron        | Brandmark | Client logo | Pagination | Chapter label | Coord readout | Section markers | Title icon | Tick labels  |
| ------------------------------- | --------- | ------------------------- | -------------- | --------- | ----------- | ---------- | ------------- | ------------- | --------------- | ---------- | ------------ |
| **Title/chapter slide**         | —         | —                         | —              | ✓ BL      | —           | ✓          | —             | —             | —               | ✓          | —            |
| **Content slide (16:9)**        | ✓         | 13                        | waypoint 8.33% | ✓ BL      | opt. TL     | ✓          | ✓             | —             | —               | —          | majors       |
| **A4 proposal**                 | ✓         | 13                        | waypoint 8.33% | ✓ BL      | ✓ TL        | ✓          | ✓             | —             | —               | —          | majors       |
| **XL proposal**                 | ✓         | 13                        | waypoint 8.33% | ✓ BL      | ✓ TL        | ✓          | ✓             | —             | —               | —          | majors       |
| **9:16 static portrait**        | ✓         | 13                        | waypoint 8.33% | ✓ BL      | opt.        | ✓          | ✓             | —             | —               | —          | majors       |
| **1:1 square**                  | ✓         | 13                        | waypoint 8.33% | ✓ BL      | opt.        | opt.       | opt.          | —             | —               | —          | majors       |
| **Web — desktop (>1100px)**     | ✓         | 21                        | scroll-driven  | ✓ BL      | —           | —          | — (in navbar) | opt.          | ✓               | —          | 0/5/10/15/20 |
| **Web — tablet (900–1100px)**   | ✓         | 21                        | scroll-driven  | ✓ BL      | —           | —          | —             | —             | ✓ compact       | —          | majors only  |
| **Web — mobile (≤768px)**       | ✓ narrow  | 21                        | scroll-driven  | ✓ BL      | —           | —          | —             | —             | ✓ compact       | —          | —            |
| **Web — small mobile (≤480px)** | ✓ thinner | 21                        | scroll-driven  | ✓ BL      | —           | —          | —             | —             | ✓ minimal       | —          | —            |
| **App shell**                   | ✓         | 21 or 13 (product choice) | app-state      | ✓ BL      | —           | —          | opt. section  | opt.          | ✓               | —          | per product  |

## 3. Omission rules with rationale

For every `—` in the matrix, a reason. If the reason stops applying, the `—` can be revisited — otherwise it stands.

- **Title/chapter slide has no rails, no chevron, no chapter label.** Rationale: the title-system heading icon and baseline carry the whole composition; rails would compete with the diagonal geometry. See `title-system.md`.
- **Web has no pagination.** Rationale: infinite scroll invalidates page indices. The scroll chevron (`top: scrollProgress * 100%`) already encodes position — a page number would duplicate and mislead.
- **Web has no client logo slot.** Rationale: Thoughtform.co is our own marketing site, not a pitch to someone else. The top-left slot is for _client_ identity when we are presenting _to_ them. On our own surfaces it is always omitted.
- **Web has no chapter label in the HUD.** Rationale: the navbar carries section navigation on web; a chapter label in the HUD would duplicate it. On mobile web the section indicator appears top-left in the navbar area, not in the HUD.
- **Slides have no coord readout or instruction band.** Rationale: those are scroll-native primitives; slides have no scroll semantic.
- **Slides have no section markers on the right rail.** Rationale: section markers track scroll-state across a single page; slides are already sectioned by their deck structure.
- **Title icon is for title/chapter slides only.** Rationale: the crosshair+diagonal is the chapter geometry; using it elsewhere conflates scopes. The HUD brandmark anchor is the small always-on mark; the title icon is the large chapter-only one. They are distinct elements.
- **Mobile web tick labels are hidden.** Rationale: the labels are redundant with the visual tick density at small canvas sizes; showing them creates clutter. The 21-pos depth gauge still renders with majors every 5; the gauge still reads correctly without text.
- **Micro-canvas corner brackets may hide.** Rationale: below ~480px, 2px brackets at 20px arms dominate the visible frame. Hiding them preserves legibility.

## 4. Decision flow

When you start any Thoughtform work:

1. **Identify the format.** What's the canvas? Fixed (slide, A4, 9:16 export) or responsive (viewport)? Scroll-driven or static? Landscape or portrait?
2. **Look up the row.** Find the closest matching row in the matrix above. If no row matches exactly, pick the nearest family (e.g. a 4:5 social tile → closest to 1:1 square) and note the deviation.
3. **Confirm the tick variant.** 13-pos bearing grid (static waypoint semantic) or 21-pos depth gauge (scroll descent semantic). See `hud-frame-implementation.md` §3b for the decision rule.
4. **Resolve omissions and conditionals.** Every `—` in your row is an element you will NOT render. Every conditional cell has a canonical value for your format.
5. **Go to the format-specific doc.** `presentation-patterns.md` for slides, `proposal-patterns.md` for A4/XL, `title-system.md` for title slides, `web-format-patterns.md` for web, `mobile-format-patterns.md` for mobile, product appendix for app shells.
6. **For web/mobile: consult `/frontend-design`** for component patterns, breakpoint math below the shell, touch targets, a11y. See SKILL.md § "When to consult `/frontend-design`."

## 5. Cross-format invariants (never omit)

These hold on every format. If you find yourself debating one, you are in the wrong doc — these are LOW-freedom brand rules.

- **Shape law:** zero border-radius; diamonds (45°-rotated squares), not circles; corner brackets, not filled corners.
- **Color tiers:** Dawn (~90% environment), Gold (~7% wayfinding), Atreides (~3% provenance). Gold and Atreides never swap roles.
- **Margin:** 5% of the canvas short edge on fixed canvases; `clamp()` on responsive (rooted in the same formula).
- **Grid:** 9 rows × 17 columns inside the margin-inset content box. Gap 0.
- **Type stack:** PT Mono for headings, HUD labels, data readouts; PP Neue Montreal for body and long-form.
- **Gold for active navigation only.** Never a decorative accent, never a background wash.
- **Brandmark bottom-left**, always on. Size adapts; position does not.
- **Motion:** no spring/bounce; 80–150ms; `cubic-bezier(0.16, 1, 0.3, 1)`.

## 6. Adding new formats

If you need a format that isn't in the matrix:

1. Check if an existing row is close enough (4:5 → 1:1, 21:9 → 16:9, landscape tablet → desktop). Use the nearest row and note deviations.
2. If the new format has a genuinely novel semantic (e.g. a new medium with a new navigation metaphor), add a row here — **and** write or extend a format-specific doc. Matrix rows without a corresponding doc are incomplete.
3. **Do not invent a new tick variant** just because a new format exists. The family is capped at two canonicals (13-pos bearing, 21-pos depth gauge). A third variant requires a skill-level change with explicit justification — see `hud-frame-implementation.md` §3b.
4. **Do not reclassify an always-on anchor as format-specific** to solve a space problem. Always-on anchors stay always-on. If the format can't accommodate them, the format choice is wrong, not the anchor.
