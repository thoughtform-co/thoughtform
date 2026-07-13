# ADR-032 — Arc corridor reveal consoles

**Status:** Accepted (2026-07-13)
**Related:** ADR-018 (depth corridor), ADR-021 (corridor exit), ADR-030
(tools viewscreen), ADR-031 (rail manifest)

## Context

The Arc corridor (Navigate → Encode → Build around the particle-sphere
"intelligence layer" artifact) communicates the _concepts_ of the arc but
shows no concrete _proof_. The owner wanted each stage to offer an optional,
discoverable reveal — a signal example (Navigate), real skill examples
(Encode), and previews of the production tools (Build) — WITHOUT cluttering
the artifact or competing with it. This is also groundwork for a later
narrative reorder (About after Services; the standalone #tools section may
retire, with the Build reveal becoming the tools' home). **This change is
reveals only** and couples to nothing about section order.

## Decision

One new fixed layer inside `.home-v2-stage__sticky`,
`CorridorRevealLayer` (`components/landing/home-v2/reveals/`), mounted in
`HomeCorridor` as a `!fallback` sibling after `CorridorProgressRail`.

- **One chip slot, bottom-centre**, docked beneath the caption card. It
  shows ONE labeled console chip at a time (`VIEW SIGNAL` / `VIEW SKILLS` /
  `VIEW TOOLS`) for whichever stage is on screen, with a one-shot
  first-arrival pulse. Three stacked `<button>`s share the slot; only the
  active stage's chip is visible (`hidden` toggled by the rAF).
- **Stage gating is a pure read of `paintProgress`** via the
  `CorridorProgressRail` rAF pattern (`useDepthGatewayStore.getState()`),
  using the SAME fade bands as the station headers. Those bands now live in
  `lib/home-v2/corridorReveals.ts` (single source of truth) and are
  imported back by `CorridorStationHeaders` — so the chip arrives/leaves in
  exact lockstep with each station's copy. Build is multiplied by
  `1 - epilogueBand(BUILD_OUT)` so it exits with the Build chapter before
  the "billions" title claims the frame. **No new scroll writers.**
- **A right-side console drawer** (`role="dialog"`, non-modal — no focus
  trap, scroll stays live) opens on click. It has **no backdrop** — it
  carries its own void-glass plate + dashed frame (the caption-card
  chrome), so the sphere stays fully visible beside it. Open/close is a
  `clip-path` aperture wipe (the caption card's sanctioned unfold,
  mirrored). Its right edge is on the HUD margin; while open it overlays
  the Arc register (z17 > z16) — the stage is restated in the drawer title
  bar, and the register returns on close (its default state).
- **Dismissal:** Escape (returns focus to the chip), outside pointerdown,
  close button, and **force-close from the rAF** when the open stage's band
  drops below `REVEAL_REARM` (0.04, mirroring `TYPER_REARM_OPACITY`) or the
  epilogue starts or the corridor disengages. Scroll-away IS the scroll
  dismissal — there is no scroll lock.
- **Content:** Navigate = a native signal card (`revealData.ts`
  placeholder, copy-swappable). Encode = a flat list of 6-8 GENERICIZED
  skill examples (no client/owner/team names) tagged by cardinal
  (JDG/TST/CRF/VOC). Build = four tool tiles reusing `PROJECT_CASES`
  (`toolCardData.ts`) directly — standalone, with an `#tools` link behind
  `BUILD_PANEL_TOOLS_LINK` so retiring #tools later is a one-line flip.
- **Gates:** desktop-capable only (`max-width:1100px, max-height:759px` →
  `display:none`, same gate as the right-rail register); never mounts on
  the fallback corridor (PRM / no-WebGL); PRM transition-kill in CSS.

## Consequences

- The reveal reads `paintProgress` only, so it survives any future
  post-corridor section reorder untouched.
- The fade bands are now shared; changing a stage's window moves the header
  AND the chip together (intended). `corridor-reveals.test.ts` pins the
  band/force-close kernel.
- Verification note: unit-tested (band resolution, travel-leg nulls, Build
  epilogue suppression, force-close hysteresis) + clean production build.
  The `/test/corridor-reveals` lab freezes each park for look-dev, but note
  turbopack **dev** can split the zustand store between the lab page
  (writer) and the layer (reader) — a harness-only artifact; production
  shares the store (the layer is a sibling of `useDepthScroll`, exactly
  like the shipped `CorridorProgressRail`). View the lab/production on a
  fresh `npm run dev` hard-load.

## Guardrails

- One chip slot, one shared drawer — do not scatter per-stage panels.
- No backdrop / no full-screen modal (the artifact keeps primacy).
- No scroll lock, no new scroll writer — `paintProgress` is read-only here.
- Keep the fade bands in `corridorReveals.ts` as the single source of truth
  for both the chips and `CorridorStationHeaders`.
- Encode content stays genericized (no client specifics).
