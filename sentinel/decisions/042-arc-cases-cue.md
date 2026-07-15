# ADR-042: The Arc Cases trigger moves OFF the sphere — a dotted-leader + label cue docked under the Build title replaces the front-pole sigil

**Date:** 2026-07-15
**Status:** Accepted (supersedes ADR-041 §2 — the world-anchored sphere sigil —
and the §3 rationale that put CLOSE on the stepper _because the sigil sat behind
the card_. Everything else in ADR-041 remains LIVE and unchanged: §1 the phased
`arcFoldInput` → `arcCardPresence` reveal and its strict ordering invariant, and
§4 the capability rows on the card face. All of ADR-036 remains LIVE: the
in-canvas card in the gyro assembly, `cardEdges` + the direct shell-local fold,
`arcCasesStore`, the `ARC_CASES_MEDIA` gate, `arcBandFactor`'s Build-band ×
epilogue-kill exclusivity, and the no-camera-channel / no-scroll-writer
contract.)
**Scope:** `components/landing/home-v2/arc-cases/ArcCasesCue.tsx` (new — the
trigger), `components/landing/home-v2/arc-cases/ArcCasesSigil.tsx` (DELETED),
`components/landing/home-v2/arc-cases/index.ts` (barrel),
`components/landing/home-v2/CorridorStationHeaders.tsx` (mounts the cue as the
Build block's `afterContent`), `components/landing/home-v2/CopyAnchors.tsx`
(sigil mount removed), `.../DepthGatewayScene/sceneGeom.ts` (`intelligence.sigil`
anchor + `gateSigil` removed), `lib/arc-cases/cardLayout.ts` (`SIGIL_Z` removed),
`components/landing/home-v2/home-v2.css`, `tests/lib/arc-cases-math.test.ts`
(SIGIL_Z pin removed), `tests/visual/arc-cases-card-smoke.spec.ts` (retargeted at
the cue).

## Context

ADR-041 welded the "VIEW THE CASES" trigger to the sphere's front pole as a
celestial-navigation sigil (a compass/astrolabe star at the ring crossing). In
review the owner's read: **the compass feels out of place** — a piece of chrome
inscribed on the instrument rather than an invitation to act, and it competes
with the busy sphere it sits on. The Build phase is where the Arc's three moves
(Navigate / Encode / Build) resolve — Build is the _combination_ of the Arc — so
the trigger belongs to that phase's label, not to the geometry. The owner asked
for **a quiet dotted line with text under the Build title that coaxes the
click**, keeping the reveal behaviour exactly as-is.

(An earlier draft of this change also added a matching "see skills" cue under
Encode wired to the substrate cardinals + the Aether skills snapshot. That was
descoped: doing Encode + Build implies also doing Navigate — the tool ↔
collaborator spectrum — which is held for a later pass. Only Build gets the cue.)

## Decision

### 1. The trigger is a DOM cue docked under the Build station title

`ArcCasesCue` renders a short **dashed vertical leader** (dropping from the
"BUILD ON THE LAYER" title) above a small mono **label** ("tools we've built"),
the label dashed-underlined so it reads as the clickable line. It mounts as the
Build `StationBlock`'s `afterContent` in `CorridorStationHeaders`, i.e. inside
the `home-v2-station-header__head` band directly under the title — exactly where
the pre-ADR-041 chip docked. It therefore **inherits the Build header's per-frame
opacity** (fades in on the Build beat via `BUILD_FADE_IN`, out on the epilogue),
so this component writes no scroll-coupled opacity of its own.

**Why DOM in the header, not on the sphere.** The corridor canvas is
`pointer-events: none` with zero R3F click handlers — every corridor click goes
through a DOM overlay anyway (ADR-041 §2 established this). ADR-041 chose to weld
that DOM marker to the geometry so it read as part of the instrument; the owner's
correction is that for _this_ trigger, reading as part of the instrument is
exactly the problem. The header layer is the right home: the cue reads as a label
on the phase, and a real `<button>` keeps aria + focus for free.

### 2. The arm gate is unchanged; the focus/pointer split simplifies

The cue keeps ADR-041's contracts verbatim: `aria-controls="arc-cases-terminal"`

- `aria-expanded`, the every-frame `inert` reconciliation, the stable callback
  ref, and the auto-disarm watcher. It arms only once the sources/surfaces notes
  have SETTLED — the SAME `sigilSettle(stack)` gate (`ARM_SETTLE` 0.5), so the
  reveal still can't be offered before the frame it lands in exists. Below the gate
  the cue is `inert` and CSS fades it out (`.is-armable`, toggled by the
  component's rAF); at the park it fades in.

The one simplification: the sigil sat on the card's optical axis, so once armed
it had to fade to ~0 and drop `pointer-events` to avoid swallowing clicks over
the card face, while staying focusable for Escape-refocus. The cue sits at the
**top of the viewport, clear of the centred card**, so it just **stays visible
and interactive while armed** — a second click or Escape closes it, and Escape
refocus falls out naturally (it was never inert). No phantom-click guard needed.
The stepper's ✕ CLOSE (ADR-041 §3) stays — it is still the card's in-place
pointer/AT surface — but it is no longer the _only_ close.

### 3. The sphere plumbing is retired

`intelligence.sigil` (the `COPY_ANCHORS` world anchor) and `gateSigil` (its
`onPaint`) are deleted from `sceneGeom`; `SIGIL_Z` is deleted from `cardLayout`.
The card no longer "grows from a seed on the front pole" — it simply materializes
on its own axis as before (the fold → card ordering is untouched). Gate parity
holds: the CSS hide of `.home-v2-cases-cue` + `.home-v2-cases-hit` still mirrors
the JS `ARC_CASES_MEDIA` floor, and the cue self-gates on `ARC_CASES_MEDIA` so it
never mounts off-desktop (belt-and-suspenders with the Build header's own
mobile `display: none`).

## Alternatives rejected

- **Keeping the sigil but restyling it as a label on the sphere.** The world
  anchor projects onto the 3D geometry; the owner wants the trigger read as part
  of the _header_, not the instrument. Re-anchoring to a viewport-fixed point
  would fight the world-DOM tracker for no benefit.
- **Adding matching Encode ("see skills") + Navigate cues now.** Descoped — see
  Context. Build alone carries the cue.
- **Dropping the stepper ✕ now that the cue can toggle closed.** Kept: the ✕ is
  the AT/pointer surface _while the card is open and focused_, and Escape still
  routes through the cue. Two closes is more forgiving, not redundant.

## Verification

`npx tsc --noEmit` clean; `npm run lint` baseline; `npx vitest run` (the SIGIL_Z
front-pole pin removed from `arc-cases-math`; `sigilSettle` / `ARC_SIGIL_SETTLE`
arm-gate pins stay green — the cue still uses them). `arc-cases-card-smoke`
retargeted at the cue: it docks under the Build title (upper-viewport, centred),
inert mid-corridor AND while the notes accrete, live + `.is-armable` at the park;
arming fades the labels + reveals the stepper + keeps the cue visible AND
interactive (`pointer-events: auto`, not inert) while armed; the ordering trace;
stepping; CLOSE via ✕; Escape-refocus onto `.home-v2-cases-cue__btn`;
auto-disarm; mobile absence. Driven live at the Build park: no compass on the
sphere; the dotted cue fades in under "BUILD ON THE LAYER" once the notes settle
and opens the tools card on click.

**Left for the owner's aesthetic pass:** the exact label copy ("tools we've
built"), the leader length / drip cadence, and whether the armed state should
retitle the label (currently static, `aria-expanded` + a solid underline carry
the open state).
