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

## Update 2 (2026-09-01) — the seat rests on a boundary, the sheet splits its slack

The owner's first physical-phone read (three screenshots, 2026-09-01) found
three defects on this ADR's surfaces. All are fixed; the IA is untouched.
Sign-off is still open — this update is what the owner judges.

- **The ARTIFACT seat sliced capability labels at its resting fold.** The
  tools plate's 2×2 grid put two half-cut sentences side by side at the
  seat's bottom edge ("PROMPT ENHANCEMENT", the owner's own still). The
  grid is single-column at `<=960` — scoped `.fl-case .fl-detail`, so the
  arc portfolio's unwrap (no `.fl-case` ancestor) is byte-identical — and
  `.fl-toolbody` ends on 18px of air, so the resting frame closes on a
  whole plate with the next one's top edge peeking. **The partial plate IS
  the scroll cue**; no gradient, no chrome. ⚠ The `<=480` 1×4 rung's own
  arithmetic was stale: it was measured against the full-width static
  document, and seated in the instrument band a 2×2 cell was already under
  that rung's floor at 500w.
- ⚠ **`capture-proof-mobile.mjs` REPORTED OK ON STATES IT NEVER VISITED**,
  twice: the mode loop selected a `data-view` attribute the component has
  never rendered (count 0 → continue → three of five states silently
  skipped), and `.fl-mobile-rail button` counts the prev arrow, so `nth(1)`
  re-captured stop one as "stop two". It walks ARTIFACT at all four stops
  now and measures each resting fold in LINE boxes. **A capture loop that
  skips on a zero count is the wait-condition hole in a new costume**
  (ADR-070's substrate-lab finding) — it cannot tell "not present" from
  "never rendered".
- **The Voidwalker phone sheet pooled its slack** — the visible head+body
  are content-height and top-anchored in the stage, so a short era left
  every spare pixel under the copy (0/438 measured on `loop`): ADR-070
  U14's defect on a new surface. Auto margins on the first visible head
  and last visible body per tab split it by construction (Δ0 on every
  stop) and collapse to exactly 0 on overflow — which is why they are
  margins and not `justify-content` on a scroll box. ⚠ The element class
  in the selector is load-bearing: a bare `[data-cell]` matches head AND
  body and hands the free space three claimants. A biased-high (40/60)
  alternative is captured beside the shipped 50/50 for the sign-off read.
- **The era reel sat 34.9px under the fixed BR theme cluster** inside the
  100svh instrument. `.vwd__band` pads its foot to
  `max(<authored rhythm>, var(--mobile-chrome-bottom, 96px))` — the token
  measures from the viewport floor, so a first cut that subtracted
  `--hud-margin` double-counted and left the chips 7.6px under (measured);
  chips clear by +8.4px at 390×844 now. The token and the band law live in
  [`.claude/rules/mobile-sections.md`](../../.claude/rules/mobile-sections.md)
  (2026-09-01) — this instrument clears the band itself, per its law 3.
- **The mobile head's title left its literal** — `clamp(27px, 8.4vw, 38px)`
  at weight 700 was the one 700 display on the phone and the owner's
  "very thick font". It rides the new global `--m-display` at the house
  voice (400 / +0.04em) now. ⚠ U1's literal-sizes law above is NOT
  repealed: it covers the 9.5–10.5px CHROME floors, which stay literal;
  the display rung riding a global ladder is the deliberate exception,
  recorded at the doctrine comment in casefile.css. lh stays 0.98 — 1.05
  measured −2.86px against the 320×568 pin's 0.92px of slack.

Left open on these surfaces, named for the sign-off: the fold position in
the capability list is `(seat − bay) mod plate` (two independent clocks —
412×915 still cuts one label; a real fix is a height-elastic bay, which
contradicts ADR-068 U4 and is a composition call); ATL's production block
is 30px over its 960×900 seat in either orientation; the figure tab
overflows its stage ~70px at 390×844 (pre-existing, intrinsic to the
figure media).
