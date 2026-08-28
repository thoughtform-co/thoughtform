# ADR-083: Proof and Voidwalker become mobile evidence instruments

**Date:** 2026-08-27  
**Status:** Proposed — implemented locally, pending owner visual approval on
physical phones  
**Surfaces:** `components/landing/home-v2/services/casefile/**`,
`components/landing/home-v2/voidwalker/hologram/**`,
`components/landing/home-v2/voidwalker/voidwalker.css`  
**Supersedes:** ADR-056/068 on the `<=960px` Proof static-document fallback
only; ADR-082 on the `<=700px` Voidwalker serial fallback only  
**Related:** ADR-056, ADR-068, ADR-082, ADR-008

## Context

The capable desktop Proof and Voidwalker surfaces spend width deliberately:
Proof pairs a reading column with an authored artifact, while Voidwalker holds
identity, figure and dossiers in a three-column character sheet. Their old
small-screen fallbacks preserved every word by serializing those columns into
long documents. They were legible, but ceased to behave like the rest of the
site's interactive instruments.

Research against the supplied Cyberpunk panels and Refero mobile examples
converged on four useful patterns: one dominant stage, explicit modes, compact
supporting evidence, and a persistent position rail. Literal game/medical
semantics, ornamental telemetry, rounded cards and a desktop dashboard scaled
down to phone width were rejected.

## Decision

Phones get one stable, retunable instrument per section. Canonical content and
the existing desktop DOM stay mounted; CSS changes which authored surface
occupies the phone seat.

### Proof at `<=960px`

The order is client/case identity → selected case identity →
`BRIEF / PROOF / ARTIFACT` → one fixed-height content seat → four-stop case
rail. The desktop Directory remains mounted but is visually retired; the rail
reuses `selectTrack`, so the hidden Directory, active artifact and case readout
stay in parity. No second `TrackVisual` is mounted.

Briefs, proof registers and complex artifacts may scroll inside the seat.
Their boundary behaviour is `overscroll-behavior-y: auto`: reaching an end
releases the gesture to the page, preserving the desktop PDA wheel's
release-at-bounds principle. At widths below 390px the redundant previous/next
buttons disappear so all four direct case stops remain at least 44px wide.

### Voidwalker at `<=700px`

The order is era identity → full-body figure/projector → one-row six-era rail →
`RECORD / SCOPE / TRANSMISSION` → one fixed-height dossier seat. `RECORD`
contains FACTS and any authored press; `SCOPE` contains motto, record and
loadout (⚠ the loadout left the sheet entirely with ADR-082 U8 — `era.loadout`
stays in the registry and letters nowhere, so `SCOPE` is motto + record now);
`TRANSMISSION` contains the authored film and is disabled when no film
exists. Selecting a non-film era while Transmission is active returns the seat
to Record.

The `701–1100px` fallback remains the complete normal-flow document. The
capable desktop sheet, its handoff targets, figure clock and scroll runway are
unchanged. Phone controls remain normal-flow rather than sticky or fixed.

### Shared contract

- Every direct control has a 44px minimum target.
- State is explicit through semantic buttons, `aria-pressed`, `aria-current`
  and real disabled state; no interaction is swipe-only.
- Mode changes keep the shell geometry stable.
- Void black, parchment, antique-gold bearings, zero-radius geometry and
  hairline rules carry hierarchy. Gold is active wayfinding, not panel fill.
- Generated mockups are composition studies only. Production copy, quantities,
  media and availability always come from the case and era registries.
- Mobile remains opaque/starless normal flow and introduces no new canvas,
  fixed paint actor, runway or WebGL dependency.

## Consequences

The phone surfaces are shorter and more navigable, but some authored artifacts
now require an intentional inner scroll. Their stable seat and boundary release
make that trade visible and escapable. CSS source order is load-bearing because
legacy static fallbacks occur later in the large casefile sheet; tests must pin
one visible surface, invariant seat height, target geometry and local overflow.

This ADR stays Proposed until the owner approves the rendered direction on
physical phones. Implementation and automated verification do not substitute
for that visual decision.

## Update 1 (2026-08-28) — visual polish, IA untouched

The IA above is unchanged. [ADR-085](085-proof-design-pass.md) adds:

- **Corner brackets** at TR + BL on every mobile seat — 12-unit gold
  L-hairlines that register the seat as an INSTRUMENT without closing it
  as a full frame (ADR-065's bracket-not-frame law).
- **Hairline tick above the current case-rail stop**, paired with the
  existing diamond below; brackets the position from both ends for a
  reader scanning in either direction.
- **Hover states** on the mode switch and case-rail buttons — signal that
  a tap will happen without changing selection.

⚠ **NO ADDED HEIGHT.** An earlier draft added `border-top: 1px` +
`border-bottom: 1px` around the seat and a `font-weight: 700` lift on the
active rail stop. The combination pushed the 320×568 `.fl-case` height
0.45px over this ADR's own `whole Proof instrument` assertion; both were
removed. The corner brackets alone carry the framing, and the current
stop is triple-signalled (gold color · tick above · diamond below)
without weight lift.

⚠ **HEAD/RAIL FONTS STAY AT THEIR LITERAL SIZES** (10 / 9.5 / 10.5px)
even though the desktop pass tokenised chrome onto `--fl-chrome-*`. The
tokens scale UP with viewport and would grow the case at short-tall
phones (measured); the mobile block is the one place a literal is
preferred to a scaling clamp.
