# Particle Icon Construction Grammar

Construction rules for Thoughtform particle nav icons. Icons are not hand-placed pixel art — they are composed from a small set of geometric primitives and a systematic **drift layer** that encodes the brand's human+machine duality at icon scale.

---

## Philosophy

The brand philosophy says _"thought becomes form."_ At macro scale the particle system expresses structured geometry plus subtle uncertainty. At icon scale we encode the same tension:

- **Human intent** — the structural pixels that make the icon legible (skeleton).
- **Navigational commitment** — the accent pixels that anchor attention (signal).
- **Machine trace** — 1–2 displaced pixels that break symmetry and suggest computational interpretation (drift).

Every icon carries all three. The drift is not optional. It is the glitch — the alien cognition — the space between thought and form.

---

## Three Layers

Every icon is composed from exactly three conceptual layers:

| Layer        | Role                                              | Alpha    | Meaning                                                       |
| ------------ | ------------------------------------------------- | -------- | ------------------------------------------------------------- |
| **Skeleton** | Human-readable form; structural pixels            | 0.85–1.0 | Intent: what the human decided to communicate                 |
| **Signal**   | 1–3 accent pixels at vertex, center, or tip       | 1.0      | "You are here" — maps to Heading Indicator (gold when active) |
| **Drift**    | 1–2 pixels displaced by 1 grid unit from skeleton | 0.4–0.55 | Machine interpretation; breaks perfect symmetry               |

Layers merge into a single pixel set before grid-snapping. The component renders all pixels with the same fill; drift is distinguished by lower alpha and by position (offset from skeleton).

---

## Geometric Primitives

Six composable operations. Each maps to the Navigation UI Grammar. All coordinates are relative to center (0, 0). All primitives return points that will be grid-snapped (GRID = 3).

| Primitive      | Produces                                  | Grammar Mapping   | Example use                         |
| -------------- | ----------------------------------------- | ----------------- | ----------------------------------- |
| **axis**       | Line of pixels along cardinal or diagonal | Course Lines      | Settings cross, Done checkmark      |
| **vertices**   | N-gon vertex placement at radius r        | Waypoints         | Snoozed diamond-ring, Spam triangle |
| **frame**      | Corner bracket marks (L-shapes)           | Viewport Frame    | Drafts document, Inbox tray         |
| **trajectory** | Directional line with terminal cluster    | Heading Indicator | Sent arrow                          |
| **anchor**     | Single center-origin pixel (or offset)    | Compass Anchor    | Snoozed center, Spam center         |
| **radiate**    | Pixels at angles from a point             | Signal Strength   | Promotions broadcast, Updates bell  |

**Rules:**

- Primitives are used for meaning, not decoration. Each must map to a navigational concept.
- Sharp geometry only. No circular or curved constructions.
- Pixel count per icon: skeleton + signal typically 8–16; drift adds 1–2.

---

## Drift Generation

Drift pixels are derived deterministically from the skeleton, not hand-placed:

1. **Source 1:** Skeleton pixel nearest to the icon's center of mass. Offset it by exactly ±1 grid unit along the axis with more room (avoid overlap with other pixels).
2. **Source 2 (if skeleton has 10+ pixels):** Outermost skeleton pixel. Offset by ±1 grid unit toward the center or along the tangent.
3. **Alpha:** 0.4–0.55 (signal-strength "whisper" to "faint").
4. **Determinism:** Seed from shape key hash so the same icon always gets the same drift.

Drift pixels must not land on existing skeleton/signal positions — they are the displacement.

---

## Icon Taxonomy

Icons are classified by primary navigational role. Taxonomy guides which primitives dominate:

| Class            | Icons                  | Dominant primitives | Concept                                         |
| ---------------- | ---------------------- | ------------------- | ----------------------------------------------- |
| **Containers**   | Inbox, Drafts, Invites | frame, axis         | Shape encloses space; tray, document, envelope  |
| **Trajectories** | Sent, Done             | trajectory, axis    | Direction and movement; arrow, checkmark        |
| **Signals**      | Promotions, Updates    | radiate, anchor     | Broadcast from a point; megaphone, bell         |
| **Landmarks**    | Snoozed, Spam          | vertices, anchor    | Mark a location; diamond ring, warning triangle |
| **Systems**      | Settings, Social       | axis, frame         | Structure; cross + corners, paired clusters     |

---

## Anti-Patterns

**Never:**

- Drift pixels aligned with skeleton pixels (they are the offset).
- Drift alpha outside 0.4–0.55 (too invisible or competing with form).
- Icons with zero drift pixels (every form carries the machine trace).
- Using primitives decoratively without a grammar mapping.
- Circular or curved constructions (sharp geometry only).
- More than 16 skeleton+signal pixels per icon (restraint).

**Always:**

- Compose from the six primitives where possible.
- Apply drift via the deterministic rule set.
- Map each primitive to a Navigation UI Grammar concept.
- Keep GRID = 3 and square pixels only.

### The one standing exemption

`ThemeGlyph` (`components/landing/v7/ThemeGlyph.tsx`) — the light/dark switch's
sun and crescent — breaks the curve ban, the 16-pixel cap and the drift rule at
once. Granted by the owner, 2026-08-09, and recorded in **ADR-058 Update 3**.

The reason is worth carrying: its previous cut obeyed all three rules and its
two states were not tellable apart at 18px. This grammar earns an icon its
meaning from the SET it belongs to; a binary system switch has no set and has
to be recognised on sight, so it borrows the silhouettes every reader already
knows. Square pixels survive — both discs are rasterised into cells, never
drawn with `<circle>`.

Not a precedent for nav icons. A second exemption is a sign the grammar needs
revisiting, not a second waiver.

---

## When to Use This Reference

- Designing or adding new particle nav icons.
- Auditing existing icons for grammar compliance.
- Explaining the human+machine duality in icon form.
- Implementing or refactoring the shape layer in code (e.g. `particleNavShapes.ts`).
