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

## Update (2026-07-17) — horizontal inset re-derived through the editorial band (ADR-048)

`--rail-inset` is now the band remainder `calc(var(--band-margin) −
var(--hud-content-inset))` ([ADR-048](048-editorial-band.md)): capped at a
centered `--band-max` (1200px) band above the ~1503px crossover, flush with
the station content edge (= the hero headline edge) below it. This
supersedes §1's lab rule "columns `--hud-margin + 8vw` inboard of the rail
guides" — **horizontal only**; the `--station-title-top` vertical
derivation (round-2 revision above) is untouched, and `--masthead-inset`
still consumes the shared token with the original calc as fallback (the
fallback deliberately keeps the pre-band formula — harness path, do not
modernize). `.services-masthead__lead` gains a band-relative cap
(`min(40vw, calc(var(--band-max) * 0.52))`) so the columns can never cross
inside the capped band on ultrawide.

## Update (2026-07-17, later) — the eyebrow is retired

The "Services · 04" eyebrow above the masthead title is REMOVED (owner:
"maybe we don't need these eyebrows"). It was the LAST station-index
eyebrow on the journey — the corridor heads dropped their numbered
eyebrows ("01 · Navigate") long ago and the v7 stations hide `.station__idx`
globally ("headline reads first") — so this completes that decision for
services. Changes: the eyebrow leaves `SERVICES_MASTHEAD` (serviceData.ts)
and the `ServicesMasthead` JSX; the decode targets are now just the two
title lines (the CRT cursor logic previously skipped `targets[0]` — the
eyebrow — and now rides every target); `--masthead-top` re-derives from
`− 20px` to `+ 9px` off `--station-title-top` so the TITLE cap stays
exactly on the big-title line (the −20 was +9 corridor console pad minus
the ~29px eyebrow block; with the title as the lead's first box the
offset is the bare +9). The intro plate keeps `top: var(--masthead-top)`
— its frame now tops out level with the title's line box. Rollback =
restore the data field, the `<p>` block, the CSS rules, and the −20px
derivation together.

## Update (2026-07-17, latest) — vertical anchor moves to the editorial band top

The eyebrow update's `+9px` cap alignment (and with it the round-2 "one
big-title LINE" rule for the masthead) is superseded the same day by the
ADR-048 vertical band: `--masthead-top` now derives from `--band-top`
(= `--station-title-top` + `--band-air`, landing.css :root), giving the
editorial register ~11.5svh of air above the title vs the corridor's
~7.5svh title-card line (owner references put editorial section headers
at 13–17%; front-card clearance caps us at 11.5). One retune of
`--station-title-top` still moves the corridor heads AND the masthead
together — the rhythm-source intent survives; only the "same line"
literalism is retired. Numbers + collision math in ADR-048's update.

## Update (2026-07-17, latest) — headline rewritten + intro de-framed

Owner: "ONE LOOP. / THREE DEPTHS." read as meaningless abstraction on the
one surface where a visitor must immediately grasp what he does. Two
changes:

- **Headline → the practical positioning line.** `SERVICES_MASTHEAD.title
Lines` is now `AI YOUR TEAM` / `CAN RUN.` (second line gold) — the
  capability-handover angle, his differentiator (teams keep the tools +
  judgment, not consultancy dependency; the Embedded card's body says it
  outright). Chosen from three directions offered to the owner.
- **Intro de-framed + tightened.** The dotted-reticle plate around the
  right paragraph (dashed hairline `background`, `::before` void-glass +
  blur, the four gold corner-cross spans, and the aperture-unfold
  clip-path reveal) is REMOVED — owner: "remove the frame, it doesn't fit
  here." The intro is now bare dawn text, right edge on the band (padding
  0), first line on the shared band top; the typewriter print is the whole
  reveal. Copy tightened and matched to the new headline. The cross spans
  still render in JSX (render-stability) but are `display: none`. The
  smoke's masthead-title assertion moved `ONE LOOP.` → `AI YOUR TEAM`.

Correction to the earlier "the smoke's `ONE LOOP.` assertion is current"
note: that copy is now superseded.

## Update (2026-07-20) — headline rewritten again: ownership over ability

Owner: change the masthead title to "AI capability your team owns."
(`SERVICES_MASTHEAD.titleLines`, `serviceData.ts`). Same positioning as
the 07-17 rewrite (capability handover, teams keep the tools + judgment),
sharpened toward ownership of the outcome rather than ability to act.

- **Line split — 2 words / 3 words, was 3/2:** `AI CAPABILITY` /
  `YOUR TEAM OWNS.` (em, gold, unchanged convention: the payoff line is
  gold). The instruction gave only the running phrase, not a line break or
  which words get emphasis — the split was chosen to keep both lines close
  in measure at the title clamp (26–44px) rather than mirror the old
  short-punch-word shape (`… OWNS.` alone would have made line 1 ~23
  characters against line 2's `AI YOUR TEAM CAN RUN.`'s 12, real overflow
  risk at the `min(40vw, 624px)` column's narrow end, ≈384px at the
  961px enhanced-tier floor). If the owner wants the punch isolated on
  `OWNS.` alone, re-split and re-check that width.
- **`services-ring-smoke.spec.ts`'s masthead-title assertion** moved
  `AI YOUR TEAM` → `AI CAPABILITY`, same lockstep discipline as the 07-17
  move. Re-run and confirmed passing (desktop project;
  `npm run verify` doesn't cover Playwright).
- Verified via the live decode controller: forced `--svc-content-in` to 1
  on `.services-stage` (the var the masthead controller's
  `MutationObserver` reads), confirmed `data-reveal="done"` and both
  resolved line texts + the joined `aria-label`.
