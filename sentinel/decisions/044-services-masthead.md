# ADR-044: Services masthead + smaller, lower parked instrument

**Date:** 2026-07-16
**Status:** Accepted
**Scope:** `components/landing/home-v2/services/` (`ServicesMasthead.tsx` new,
`ServicesStage.tsx` mount, `serviceData.ts` copy, `services.css` block),
`components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx`
(park geometry), `components/landing/v7/LandingPage.tsx` (register mount
removed). Origin lab: `app/(internal)/test/services-wordmark/`.
Builds on ADR-043 (wordmark bottom-left freed the top band).

## Context

With the wordmark moved to the bottom-left (ADR-043), `#services` gets the
Linear-style editorial register validated in the lab: **full-caps title on
the left, intro paragraph on the right**, in the section's upper band —
the "handover from the Arc into the next sections" (owner, 2026-07-16).
The parked WebGL instrument (particle brandmark + armillary + card ring)
centered dead-middle at scale 1.15 put the front card's top edge ~16-18vh
from the viewport top — inside the masthead band — so the instrument also
becomes **smaller and lower**.

## Decision

1. **`ServicesMasthead`** — a pure presentational component (no state /
   effects / refs / subscriptions), first child of `.services-stage__items`,
   gated on `SERVICES_CARD_RING`. Copy lives in `serviceData.ts`
   (`SERVICES_MASTHEAD`): eyebrow `Services · 04`, title `ONE LOOP.` /
   `THREE DEPTHS.` (em line gold), the loop intro paragraph.
   - **ADR-029 relationship:** this is the sanctioned SECTION-level DOM
     text. It carries no per-card copy, never reads `data-active-step`,
     and is `pointer-events: none` — the "card is ONE object / no DOM text
     console beside the ring" guardrail stands untouched.
   - Rides the existing envelopes only: `opacity: --svc-content-in ×
(1 − --svc-exit)` + the 18px content-in rise. No new scroll writer.
   - Band geometry (lab-validated): columns `--hud-margin + 8vw` inboard
     of the rail guides; top `--hud-rail-y-start + clamp(24px,6vh,72px)`;
     intro `+34px` for first-line alignment. ≤960px / reduced-motion: the
     masthead is static in flow above the plate accordion (it is the
     section's real `<h2>` heading — an a11y gain).

2. **Parked instrument geometry** (`BrandmarkPhysicsCoreActor.tsx`):
   - `CENTER_TARGET_SCALE` 1.15 → **1.0** (~13% smaller; mark + orbits +
     ring scale as ONE group; `recT = 0` through the corridor so pre-dock
     frames are byte-identical).
   - New **`CENTER_Y_OFFSET = 0.1`** wu: the park target drops along
     camera-DOWN before the `recT` lerp. Derivation: viewport height at the
     park plane = `2 × 3.2 × tan(19°)` = 2.204 wu → 0.1 wu ≈ 4.5vh (the
     nearer front card shifts ~6.3vh). Shipped at 0.2, halved on owner
     review the same day once the masthead band anchored to the corner
     zone (see below) — the instrument re-balances toward center while
     the front card keeps ~5vh clearance under the title band. Never
     retune ring math to solve clearance; this constant is the lever.
   - Decoupled from the ~0.14 matched-pixel SVG handoff (screen-rect
     driven, `recT = 0` there). Mark stays frontal (no rotation touched).
     Ring tunables are instrument-local and inherit; hit areas +
     designation anchors re-project per frame — nothing else changed.

3. **The SOURCE BUS · 04 right-rail register is retired** (owner decision):
   the masthead's intro paragraph is the services right-side text now.
   `ServicesRailRegisterPortal` is unmounted from `LandingPage`;
   `ServicesRailRegister.tsx` + its CSS + the `[data-tools-rail-root]`
   prototype shell stay on disk for rollback. **This deliberately amends
   ADR-031 Updates 7-8 rail uniformity** ("each pillar: name left,
   sub-items right"): during services the right rail is empty; the Arc's
   `CorridorProgressRail` register is unchanged.

## Consequences

- The Arc → Services transition now reads as a register change (centered
  cinematic corridor → editorial split station) — the two-register model
  the owner chose for post-corridor sections.
- Copy tension, owner-accepted: "THREE DEPTHS." predates the fourth
  service (Strategic Advisory, 2026-07-09). Data-only change if revisited.
  **Revisited 2026-07-16 (same-day copy sweep):** masthead is now
  `ONE PRACTICE.` / `FOUR WAYS IN.` with a concrete intro, and the card
  titles/ledes moved to Vince's first-person voice (`SERVICE_PLATES` +
  the vestigial `SERVICES` fields in lockstep). Data-only, as predicted.
  The masthead inset also consumes the shared `--rail-inset` token since
  ADR-045 (about rail parity) — same computed value, calc kept as fallback.
- Rollback of the register = remount `ServicesRailRegisterPortal` in
  `LandingPage` (one line) — but reconcile with the masthead paragraph
  first (both on the right would compete).
- The flag-off (`SERVICES_CARD_RING = false`) rack path renders no
  masthead — that fallback surface is unchanged.

## Update (2026-07-16, responsive pass) — corner-line rule + viewport-aware parked scale

Two coupled moves fixing the MacBook-class complaints ("right paragraph too
close to the card"; "cards too small on smaller viewports"). Root cause for
both: `getCameraFov` returns a constant 38° vertical FOV for every landscape
aspect, so the front card is ~42% of viewport height on ALL desktop sizes —
few absolute pixels on 800–900px-tall laptops — while its WIDTH fraction grows
as aspect narrows, crowding the intro paragraph.

1. **Corner-LINE text rule (third raise in the same owner trajectory).**
   `--masthead-top` drops the corner-zone + vh-pad terms and anchors the band
   top directly on the top-left bracket's line:
   `calc(var(--hud-margin) + var(--masthead-top-trim, 0px))`. The intro plate
   joins the SAME line (`top: var(--masthead-top)`) — the `+34px − 16px`
   first-line alignment is superseded by the unified top. One rule, no vh
   terms, all desktop viewports. The corner-zone term existed to clear the
   bracket ZONE, but the bracket arm is only `--hud-corner-zone` wide while
   the text columns start 8vw inboard — sharing the line is safe (verified
   1280×800 / 1440×900 / 1920×1080). `--masthead-top-trim` is the optical
   knob. `--masthead-inset` / `--rail-inset` (ADR-045 lockstep) untouched —
   this change is vertical-only.

2. **Viewport-aware parked scale** (`lib/home-v2/parkedInstrumentScale.ts`,
   pinned by `tests/lib/parked-instrument-scale.test.ts`).
   `getParkedInstrumentScaleMul(aspect, vh)` ramps 1 → 1.15 on MacBook-class
   viewports (aspect ≤ ~1.62 AND height ≤ 1000px; smoothstep edges, portrait
   and near-square guarded) and is exactly 1 on wide (≥16:9) or tall (≥1100px)
   monitors. Applied in `BrandmarkPhysicsCoreActor` to the parked lerp
   TARGETS only (`CENTER_TARGET_SCALE * mul`, `EXIT_RECEDE_SCALE * mul`), so
   mark + orbits + card ring scale as ONE rig and every `recT = 0` frame (the
   whole corridor + the SVG handoff) is byte-identical. This partially
   restores the pre-ADR-044 1.15 scale — but viewport-scoped, enabled by the
   raised band (exactly the interaction this ADR predicted). The ADR-047
   deck-flip seat math needs no feed: it divides the live `matrixWorld`
   parent scale back out per frame (verified: about portrait landing exact at
   1280×800 mul=1.15 and 1920×1080 mul=1). `CENTER_Y_OFFSET` remains the
   clearance lever; ring math constants untouched (unit-pins hold).

Correction to the earlier consequence note: the "ONE PRACTICE. / FOUR WAYS
IN." copy was itself reverted — live copy is `ONE LOOP. / THREE DEPTHS.`
(`serviceData.ts`, "DEPTHS. returns DELIBERATELY"); the smoke spec's
`ONE LOOP.` assertion is current, not stale.

### Same-day revision (round 2) — the big-title LINE + readout retirement

The corner-line rule lasted hours: on review the owner read it as "still a
bit too high — the previous section's big titles are in the right position."
The vertical anchor is now the **corridor station-title line**, promoted to a
shared token `--station-title-top` (landing.css :root, the
`clamp(48px, 6.8vh, 84px)` the corridor heads always used).
`.home-v2-station-header__head` consumes it; `--masthead-top` derives from it
(−20px lead offset: corridor console pad +9px vs masthead eyebrow block
≈29px, so the TITLE caps align exactly). One rhythm source, both surfaces —
retuning the token moves the corridor and services titles together.

The **bottom readout strip is retired** (`ServicesStationReadout` deleted;
CSS tombstoned) — it cost the exact vertical band the bigger card ring needs
on short viewports. The step clock's other surfaces (data-active-step, the
plates, ring highlight, designations) carry the active-service signal; the
ring smoke re-points its assertions at those.
