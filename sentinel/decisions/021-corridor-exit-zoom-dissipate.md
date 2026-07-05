# ADR-021: Corridor Exit — Zoom-Dissipate (and the Retired Cover-Plane Sweep)

**Date:** 2026-06-15
**Status:** Proposed
**Scope:** Production home page (`/`) — the seam between the home-v2 depth corridor and the section that follows it. Includes the now-retired `#buildQuote` "Make the layer useful" docked cover-plane sweep, kept alive as a reusable reference pattern.
**Related:**
[ADR-008 — Landing v7 background layers](008-landing-v7-background-layers.md),
[ADR-018 — Home V2 Depth Corridor](018-home-v2-depth-corridor.md),
[ADR-020 — Home V2 flywheel handoff lab](020-home-v2-flywheel-handoff-lab.md).

---

## Amendment (2026-06-19) — Services is a pinned brandmark stage; ground-truth note

`#services` was redesigned from the sticky-stacking terminal cards into a
**Jasmina-style pinned stage**: a left service list · a centered particle
brandmark · a right paragraph that crossfades as the stage steps. New files:
[`ServicesStage`](../../components/landing/home-v2/services/ServicesStage.tsx),
[`ServicesBrandmarkField`](../../components/landing/home-v2/services/ServicesBrandmarkField.tsx)
(reuses the `ServiceSigilField` 2D-canvas painter against `BRANDMARK_FULL_PATHS`),
and [`useServicesStageScroll`](../../components/landing/home-v2/hooks/useServicesStageScroll.ts)
(a rect-rAF hook writing only `data-active-step` on the stage). The section header
("One loop. Three depths.") and the cards/`ServiceSigilField`/`useReveal`/
`lib/services/serviceShapes` are gone.

**The corridor-exit contract is unchanged.** The dissipate clock is anchored to
`servicesRect.top` (height-independent), so the much taller section (a
`min-height: 300svh` `.services-stage-root` runway with a `position: sticky`
stage) does not disturb the dive-in seam — the one height-sensitive term
(`servicesRect.bottom > 0`) only extends the ambient hold. The transparent
`#services` exception below is exactly what lets the ambient interior-sphere
particles show through behind the centered brandmark.

> **Ground-truth note.** Parts of this ADR (and `.claude/rules/scroll-animations.md`
> and the `landing-v7-compositing` skill) describe an in-`#services` brandmark
> **re-centre**, a seam **pixel field** (`CorridorSeamPixelField`), the
> `data-services-brandmark` / `data-services-pixelate` gates, and a "~1.6/2-viewport
> runway" — all **retired**. [`useCorridorExitScroll.ts`](../../components/landing/home-v2/hooks/useCorridorExitScroll.ts)
> is ground truth: it writes only `--corridor-dissipate`, `data-corridor-docked`,
> `data-corridor-exit` + `--corridor-exit-veil`, and `data-services-ambient` +
> `--services-ambient` (with `seamMorph` held inert at 0).

---

## Context

The home-v2 depth corridor (ADR-018) saturates at `paintProgress = 1` with the camera parked at `CAMERA_END`, the substrate sphere grown into a planet, and the "AND THE LABS ARE SPENDING BILLIONS ON THE SAME LAYER." signal block painted over the limb. The corridor's next move was the post-corridor `#buildQuote` "Make the layer useful." section, embedded as a docked **cover-plane sweep** (ADR-020 production amendment, ADR-018 v3.15) that lifted a 100svh opaque plane over the held corridor canvas before handing off to the Navigate/Encode/Build services flow.

That sweep is a hard-won composition — see "Retired pattern" below — but in production it splits the narrative twice. First the user reads the billions title; then a separate "Make the layer useful" cover lifts; then the deeper sections (`#continuum`, `#practice`, `#build`) play out; only at `#services` does the practical "Three ways to bring the practice in" copy land. The labs/billions beat resolves more elegantly when the sphere itself becomes the transition: zoom into it, scatter the particles outward, and reveal the next section's content already in place.

The Services section (`#services`) is the natural destination because it is the practical answer to the rhetorical setup of "build your own layer." It also already carries its own copy ("Three ways to bring the practice in — inspire the room, train the team, shape the roadmap") and the Keynotes / Workshops / Strategy cards.

## Decision

Replace the docked cover-plane sweep with a **sphere zoom-in + particle dissipate** that resolves into the Services section, which moves up to directly follow the corridor.

Concretely:

- The production page order becomes: hero → corridor → **services** → continuum → practice → build → about → contact. The `#buildQuote` station is stripped from the parsed v7 HTML alongside the legacy `definition` / `missing-layer` / `intelligence-layer` / `approach` stations that the corridor already replaces. `#services` is sliced from its source position and re-inserted immediately after the corridor mount placeholder. The orphaned `data-celestial-slot="practice-to-about"` connector that previously trailed `#services` is dropped at the seam.
- The `HandoffOrbitEmbed` mount inside [`LandingPage`](../../components/landing/v7/LandingPage.tsx) is removed; `useEmbeddedServicesScroll` is replaced by `useCorridorExitScroll`, which watches `#services` and writes a single `--corridor-dissipate` (0..1) channel plus the `docked` flag.
- The `docked` channel still promotes `.home-v2-stage__canvas` to a fixed backdrop (the corridor's R3F canvas persists across the seam) — but the `--handoff-cover` clip-path plane and copy cross-dissolve are gone. The canvas plays a final fly-into-sphere arc + particle scatter + fade over an eased ~1.6-viewport Services runway, ending transparent over the Services dark surface.
- The BILLIONS signal block + `EpilogueNewsTicker` fade out on the dissipate clock, not the cover clock. The Services section keeps its existing dark surface (`linear-gradient(180deg, var(--void), var(--surface-0))`), with an ADR-008-exception transparent leading viewport so the dissipating sphere is visible through it.
- Mobile / reduced-motion / no-WebGL keeps the existing fallback path: no fixed dock layer, no zoom — a static dark cut from corridor to Services, mirroring the existing `dockCapable` gate in `useEmbeddedServicesScroll`.

The retired cover-plane sweep is kept alive as a documented reusable pattern: [`components/landing/home-v2/handoff-lab/`](../../components/landing/home-v2/handoff-lab) and the `/test/handoff-a|b|c` lab routes stay in the tree exactly as they are. The next section that needs a "lower plane swipes up and replaces the previous scene" handoff (Active Theory / Hashgraph-class) should import that recipe rather than rebuilding it.

---

## Retired pattern — Cover-Plane Sweep (reusable recipe)

This recipe ships in [`HandoffOrbitEmbed`](../../components/landing/home-v2/handoff-lab/HandoffOrbitEmbed.tsx) + [`handoff-lab.css`](../../components/landing/home-v2/handoff-lab/handoff-lab.css). It is the production realization of the lab's Scenario A approach-and-cover (ADR-020 amendment, ADR-018 v3.15). Reusing it elsewhere means porting these mechanics verbatim — the failure modes documented below are real.

### Frame

A completed R3F scene must persist as a backdrop while the next DOM section physically covers it. The next section's first-read copy lives inside the cover plane and becomes visible as the plane rises. The old scene gets a small recede (transform), not an opacity fade — the cover plane owns the replacement (BEST-PRACTICES "Cover Swipes Are Replacement Planes, Not Fade-Outs").

### Mechanics

1. **Dock promotion via `data-corridor-docked`.** The R3F canvas (`absolute; inset: 0`) is promoted to a fixed full-viewport backdrop the moment the cover engages. CSS:

   ```css
   html[data-corridor-docked="true"] .home-v2-stage__canvas {
     position: fixed;
     inset: 0;
     width: 100vw;
     height: 100svh;
     z-index: 2;
     opacity: 1;
     /* small recede only — never an opacity fade */
     transform: translate3d(0, calc(var(--handoff-cover, 0) * -2.5vh), 0)
       scale(calc(1 - var(--handoff-cover, 0) * 0.035));
     transform-origin: 50% 44%;
   }
   ```

2. **Engagement gate keyed to the corridor's epilogue, NOT to section position.** The dock turns ON at `epilogueProgress >= DOCK_ENGAGE_EP` (0.72), i.e. the moment the corridor's BILLIONS title has all but settled. Engaging off the cover section's own `getBoundingClientRect()` instead would open the dock too early or too late — the deliberate DWELL on the landed sphere comes from clamping engagement to the live epilogue scrub.

3. **`--handoff-cover` is the real transition clock.** The clock is `(vh - servicesRect.top) / vh`: 0 when the cover plane's top is at the viewport bottom, 1 when it has fully replaced the previous scene. The cover plane is the only writer of this CSS variable; everything else reads it.

4. **Clip-path cover plane, not transform translate.** The plane is sticky-pinned to the viewport once docked, with an explicit `clip-path` that exposes the bottom-up sweep:

   ```css
   .handoff-lab__swipe-plane {
     clip-path: inset(calc((1 - var(--handoff-cover, 0)) * 100%) 0 0 0);
     transform: translate3d(0, calc((1 - var(--handoff-cover, 0)) * 4vh), 0);
     will-change: clip-path, transform;
   }
   ```

   The 4vh translate is a small lead-in that adds depth without doubling as the cover (clip-path does the cover).

5. **First-read copy lives inside the cover plane.** "Make the layer useful." sat at `position: absolute; bottom: clamp(56px, 8vh, 104px)` inside the plane and was cross-dissolved by two coupled vars:

   ```css
   --cover-copy-in: clamp(0, calc((var(--handoff-cover, 0) - 0.24) * 2.35), 1);
   --service-copy-out: clamp(0, calc(var(--handoff-progress, 0) * 10), 1);
   opacity: calc(var(--cover-copy-in) * (1 - var(--service-copy-out)));
   ```

   `--cover-copy-in` fades the headline in across the back half of the sweep; `--service-copy-out` fades it back out as the user scrolls past the cover into the services grid.

6. **Single-writer rule.** Only the cover hook (`useEmbeddedServicesScroll`) writes `docked` / `dockProgress`. The corridor's `useDepthScroll` stays the sole writer of `progress` / `paintProgress` / `epilogueProgress`. The painters read `docked` and hold a fixed pose themselves; the cover never overwrites the corridor scrub. Two rAF loops writing the same channel fought every frame and read on screen as the sphere jittering / pulsing during the handoff. See [`HandoffOrbitEmbed.tsx`](../../components/landing/home-v2/handoff-lab/HandoffOrbitEmbed.tsx) L81-93.

7. **Reverse-scroll release safety valve.** In `useDepthScroll`, a `DOCK_RELEASE_EPILOGUE_PROGRESS` (0.7) gate clears any stale `docked` flag the moment the user scrolls back before the dock window. Without it a back-scroll from inside the dock through to the corridor mid-region leaves the canvas pinned to `fixed` and the sphere stuck in its held pose. See [`useDepthScroll.ts`](../../components/landing/home-v2/hooks/useDepthScroll.ts) L46, L182-190.

8. **ADR-008 transparent leading viewport (sanctioned exception).** Full-bleed wrappers normally must be opaque (ADR-008 rule 2). The cover's services section has an intentionally transparent top gradient — the pinned scene IS meant to show through during the cover window — and re-shields to opaque within ~96svh, before any later content can sit over the gateway.

9. **Mobile / reduced-motion collapse.** `dockCapable = !reducedMotion && !mobile && !corridorFallback`. When false, the dock never engages; the canvas stays inside its sticky stage and the services section reads as a sequential dark editorial block. The same gate must guard any reuse.

### What NOT to do (failure modes already shipped and fixed)

- Don't fade the docked canvas with `opacity` — the BEST-PRACTICES "Cover Swipes Are Replacement Planes" entry exists for this exact regression.
- Don't write `epilogueProgress` from the cover hook. See #6.
- Don't engage the dock off the cover section's own rect (loses the dwell).
- Don't omit the reverse-scroll release. See #7.
- Don't put first-read copy AFTER the 100svh cover viewport — it reads as ordinary parallax.

### Reusable handles

- `lib/stores/depthGatewayStore.ts` — `docked`, `dockProgress` fields are the canonical hand-off channel.
- `.home-v2-stage__canvas` fixed-backdrop CSS (handles z-index, recede transform, pointer-events guard) lives in [`home-v2.css`](../../components/landing/home-v2/home-v2.css). Keep this rule active even after the production handoff changes — any future cover-plane reuse needs it.
- `components/landing/home-v2/handoff-lab/` (`HandoffOrbitEmbed`, `handoff-lab.css`, `content.ts`) + the `/test/handoff-a|b|c` lab routes stay in the tree as the living reference.

---

## New pattern — Zoom-Dissipate

### Frame

A completed sphere becomes the transition. The camera dollies INTO the sphere along its line of sight, the surface particles scatter radially outward, the atmosphere blooms then fades, and the next DOM section is already in place behind the dissolving canvas. The sphere stops reading as an object and becomes an exit gate.

### Mechanics

1. **`--corridor-dissipate` is the transition clock.** It is written by `useCorridorExitScroll` per scroll frame from the live `#services` rect, but the physical runway is intentionally longer than the retired cover clock: `raw = (vh - servicesRect.top) / (vh * 1.58)`, then `smootherstep(raw)`. 0 when `#services`'s top is at the viewport bottom; 1 once the section has travelled through roughly 1.6 viewports. This keeps the sphere expansion / particle fade from completing too abruptly under wheel input. The hook also keeps the `docked` flag set while the dissipate is in progress so the canvas stays a fixed backdrop through the seam.

2. **Camera fly-into-sphere arc.** `getEpilogueCameraPose` is extended with a final tail that, once the dissipate clock is active, eases the camera's standoff distance from `EPILOGUE_LANDING_STANDOFF` toward ~0 along the line from `CAMERA_END` to `BRANDMARK_ANCHOR_INTELLIGENCE`. By dissipate 1 the camera is inside the sphere's footprint — the surface particles are passing the near plane and the planet has effectively swallowed the viewport.

3. **`DISSIPATE` band in `epilogueTimeline`.** A new `getDissipateScalar(dissipate)` helper exposes a smoothed 0..1 reveal for painters. The substrate sphere reads it and:
   - Scatters the dotted-shell vertices radially outward (multiplies the shell-radius lerp by `1 + dissipate * SHELL_SCATTER`).
   - Ramps `mats.dottedShell.uOpacity`, `mats.globeDots.uOpacity`, `mats.particle.uOpacity` down to 0 across the second half of the band.
   - Blooms `mats.atmosphere.uOpacity` to a brief peak at ~dissipate 0.35 then fades to 0 by 0.9 (the "burst then dissolve" read).
   - Sheds the smoky occluder core to 0 early so the dissipating shell never reveals a hard silhouette behind it.

4. **BILLIONS signal block + ticker fade off the dissipate clock.** The current `titleOut = smoothstep(0.06, 0.5, cover)` in [`CorridorStationHeaders.tsx`](../../components/landing/home-v2/CorridorStationHeaders.tsx) L803-818 is replaced with `titleOut = smoothstep(0.04, 0.42, dissipate)` so the headline fades with the sphere it sits in front of. The `EpilogueNewsTicker`'s opacity is already mirrored from the signal block, so it follows for free.

5. **Single-writer rule preserved.** `useCorridorExitScroll` owns `--corridor-dissipate` + `docked` + `dockProgress`. It does NOT touch `progress` / `paintProgress` / `epilogueProgress`. The corridor's `useDepthScroll` stays the sole writer of those channels and keeps its reverse-scroll release gate (it now reads `--corridor-dissipate` clear instead of the old `--handoff-cover` clear; the safety valve logic is identical).

6. **Services section ownership + soft leading edge.** `#services` keeps its own dark `--void` surface. While the exit is engaged (`html[data-corridor-exit="true"]`), the section itself stays transparent and a fixed full-viewport `body::before` veil darkens from alpha 0 → 1 on `--corridor-dissipate`. This avoids a rectangular section-top edge cutting across the planet. The Services content is brought in late on sibling CSS vars from the same raw clock: `--services-header-in` for the eyebrow/lede, `--services-grid-in` for the service cards, and `--services-cta-in` for the lower CTA. Header, grid, and CTA opacity/translate/blur ease in progressively while the sphere continues to dissipate behind them. At dissipate 1 the veil is opaque `var(--void)`, `data-corridor-exit` clears, and normal station background ownership resumes with no opacity/star pop.

7. **Mobile / reduced-motion / no-WebGL fallback.** `useCorridorExitScroll` reuses `dockCapable = !reducedMotion && !mobile && !corridorFallback`. When false: skip the zoom (canvas stays inside the sticky stage), let the BILLIONS title hold through the natural end of the epilogue, and Services lands as a sequential dark cut. No flashing, no jitter, no zoom artifacts on low-end devices.

### What this changes vs. the cover-plane sweep

|                        | Cover-plane sweep                  | Zoom-dissipate                                                    |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Transition surface     | Opaque DOM plane lifts over canvas | Canvas particles disperse; DOM next                               |
| Held scene action      | Small recede transform, opacity 1  | Camera flies INTO sphere; particles scatter; opacity drops at end |
| First-read copy origin | Inside the cover plane             | Inside the destination section                                    |
| Old scene exit grammar | Covered (not faded)                | Dissipated (and revealed-through)                                 |
| Destination            | New `#buildQuote` lab section      | Existing `#services` section                                      |

Both keep the `docked` channel, the `data-corridor-docked` CSS gate, the single-writer rule, the reverse-scroll release, the mobile / reduced-motion fallback, and the ADR-008 transparent-leading-viewport exception. The zoom-dissipate is the cover-plane sweep with the visual contract inverted: the old scene exits as the transition instead of being covered by it.

---

## Alternatives Considered

### Keep the cover-plane sweep and just retarget it at `#services`

- **Pros:** Reuses a shipped, tuned composition; minimum code churn; the sweep is genuinely good at "introduce a calm services layer over a held celestial backdrop."
- **Cons:** Splits the narrative twice — billions, then "Make the layer useful," then services — when the rhetorical setup already points directly at the services answer. The sweep also keeps the sphere holding behind the services copy for the rest of the section, which after several reading visits feels like the scene refuses to end.

### Dissipate the sphere in place at the end of the epilogue, then a clean dark cut to `#services`

- **Pros:** Simplest mechanically — no new dissipate clock, no dock channel during Services, no transparent leading viewport.
- **Cons:** The sphere disperses into void and the next section starts fresh, which loses the "sphere becomes the gate" read. The user experiences an empty dark gap between the dissipate finish and the Services entry; the seam is correct but uninteresting.

### Persistent faint sphere ambient behind all of Services

- **Pros:** Strongest narrative continuity ("we never left the gate"). Visually rich.
- **Cons:** The R3F canvas would have to keep rendering through the entire Services section, costing the GPU well past the value it adds. The services cards also need a high-contrast dark surface to read; competing with an ambient sphere underneath them is the same trap the `#buildQuote` cover originally solved.

### Sphere zoom-dissipate into `#services` (chosen)

- **Pros:** The sphere itself becomes the transition. The Services section inherits the rhetorical thrust of the billions setup without re-introducing it. Single seam, no extra intermediate section. The same single-writer / docked / fallback infrastructure carries over from the cover-plane sweep, so the integration cost is bounded.
- **Cons:** The fly-into-sphere arc needs new camera-pose math at the end of `getEpilogueCameraPose`. The substrate sphere painter gains a dissipate path that has to compose cleanly with the existing APPROACH / LAND envelope (don't break the parked sphere).

---

## Consequences

### Positive

- One seam instead of two between the corridor climax and the practical "Three ways to bring the practice in" copy. The narrative resolves in one viewport rather than spanning `#buildQuote` + `#continuum` + `#practice` + `#build` before landing.
- The Services section gains a real entrance choreography for free — the sphere is the entrance.
- The retired cover-plane sweep is documented (this ADR) and kept alive as a reusable pattern. Future sections that need a "lower plane swipes up and replaces the previous scene" handoff can import the lab recipe verbatim.
- The single-writer rule, reverse-scroll release, dock channel, and mobile/reduced-motion fallback all carry over unchanged. The architectural contract is preserved; only the visual contract flips.

### Negative

- `#services` no longer sits between `#build` and `#about` in source order. The `#hudNav` 08-Services link still scrolls to it correctly because `getV7Content`'s `removeHudNavEntries` only strips removed sections; the entry for `services` survives and the smooth-scroll handler in `LandingPage` continues to work because it looks up the target by id. But the visual progression that previously went hero → corridor → quote → continuum → practice → build → **services** → about now goes hero → corridor → **services** → continuum → practice → build → about. The HUD numbering ("08 Services") stays as-authored, but the on-page sequence diverges from that numbering. Acceptable; the numbers were already non-contiguous after the corridor took over 02-04.
- A future ADR-018 revision that changes the corridor's epilogue cadence may need to retune `DOCK_ENGAGE_EP` / the dissipate timing. The cover-plane sweep had the same coupling.

### Neutral

- `components/landing/home-v2/handoff-lab/` stays in the tree exclusively as a lab reference. It is not mounted in production and may eventually move to `legacy/` if no reuse materializes; for now it remains under its current path so the `/test/handoff-*` routes work.
- `lib/stores/depthGatewayStore.ts` keeps `docked` + `dockProgress` — both the cover-plane sweep recipe and the zoom-dissipate use them.

---

## Implementation References

- New hook: `components/landing/home-v2/hooks/useCorridorExitScroll.ts`
- Mount wiring: [`components/landing/v7/LandingPage.tsx`](../../components/landing/v7/LandingPage.tsx)
- HTML reorder: [`lib/v7-parse.ts`](../../lib/v7-parse.ts) (`removeStations` + new `relocateStationToMount` step)
- Page composition: [`app/(marketing)/page.tsx`](<../../app/(marketing)/page.tsx>)
- Camera arc: [`components/landing/home-v2/DepthGatewayScene/sceneGeom.ts`](../../components/landing/home-v2/DepthGatewayScene/sceneGeom.ts) (`getEpilogueCameraPose` tail)
- Dissipate scalar: [`lib/home-v2/epilogueTimeline.ts`](../../lib/home-v2/epilogueTimeline.ts) (`getDissipateScalar`)
- Sphere painters: [`components/landing/home-v2/DepthGatewayScene/shell/ShellSubstrateGyro.tsx`](../../components/landing/home-v2/DepthGatewayScene/shell/ShellSubstrateGyro.tsx)
- Signal block fade: [`components/landing/home-v2/CorridorStationHeaders.tsx`](../../components/landing/home-v2/CorridorStationHeaders.tsx)
- Fixed-backdrop CSS: [`components/landing/home-v2/home-v2.css`](../../components/landing/home-v2/home-v2.css)
- Retired sweep reference (kept): [`components/landing/home-v2/handoff-lab/`](../../components/landing/home-v2/handoff-lab), `/test/handoff-a|b|c`.

---

## 2026-06-16 Revision — Brandmark ride-out + Services re-centre

The original ADR retired the docked cover-plane sweep but inherited the
epilogue v3 brandmark contract verbatim: the DOM brandmark FADED OUT
across the `APPROACH` band so it wouldn't sit inside the sphere as the
planet grew. With the sweep gone the visible exit became "the brandmark
quietly disappears, then services slides up under a docked sphere",
which read as the corridor's headline artifact abandoning the scene
rather than completing its arc. This revision restores the brandmark
through the seam: it RIDES the sphere out of view geometrically during
the BILLIONS beat, then re-centres into `#services` as the planet
scatters, holds for a beat, and fades as `#continuum` enters.

Services also lost its execution-strip + funnel-CTA contents in this
revision and is now a runway for the re-centring brandmark. Final copy

- offer are pending; the structural change here is the seam contract.

### What changed

- **`ProjectedBrandmarkActor.tsx`** — the epilogue v3 `APPROACH`-band
  opacity fade is GONE. The mark is welded to
  `BRANDMARK_ANCHOR_INTELLIGENCE` (sphere centre) via a private mirror
  camera that follows the SAME pose chain as `FlyingCameraRig` +
  `EpilogueNewsTicker` (`getEpilogueCameraPose` with docked-pose ease,
  then `getCorridorExitCameraPose` once the dissipate engages). The
  welded screen position rides the sphere off-screen during LAND and
  then lerps toward the viewport centre across the first 85% of the
  dissipate clock (`DOCK_RECENTRE_FRAC = 0.85`). A NEW parallel rAF in
  the actor takes over from the tracker once the corridor stage's
  sticky cell releases (`active = false` while `docked` is still
  true), so the recentre completes even after the cell scrolls past.
  Welded math + scratch state are extracted to `computeWeldedRect` so
  the tracker `onPaint` (corridor-active path) and the post-active
  rAF share the same pose chain + last-welded cache.
- **`useCorridorExitScroll.ts`** — `DISSIPATE_SCROLL_SPAN_VH` widened
  1.58 → 2.0 so the welded recentre resolves ~1.3 viewports past the
  section's first reveal instead of right at it. The per-element
  reveal vars (`--services-header-in`, `--services-grid-in`,
  `--services-cta-in`) are removed (their DOM targets are gone). A
  NEW gate `data-services-brandmark` (`"hold"` | `"fade"`) + a
  `--services-brandmark` (0..1) opacity var are written by the hook
  based on `#continuum.top / vh` — `"hold"` once the dock releases
  and `"fade"` as `#continuum` crosses the 0.5 → 0.1 vh band, with
  the gate cleared entirely once `#continuum` is fully in (so the
  fixed brandmark layer drops back to its `position: absolute`
  default and doesn't keep a fixed layer alive past usefulness).
  The gate is mutually exclusive with `data-corridor-docked`, so the
  actor's post-active rAF can branch on either flag with no overlap.
- **`home-v2.css`** — `#services` is given `min-height: 200svh` so
  the section has the runway for the recentre + hold + fade. Two new
  rules promote `.home-v2-projected-brandmark` to `position: fixed`:
  one for `data-corridor-docked` (JS owns the rect, position is
  fixed-from-viewport-origin so the actor's pixel writes land
  correctly once the sticky containing block scrolls away) and one
  for `data-services-brandmark="hold"|"fade"` (CSS owns the rect
  with fixed-centred via `inset: 50% auto auto 50%` +
  `transform: translate(-50%, -50%)`, `aspect-ratio: 430.99 / 436`,
  and `opacity: var(--services-brandmark, 1)`). All position /
  display / inset / width / aspect-ratio overrides use `!important`
  to beat the actor's inline `position: absolute` / `display: none`
  / `left: 0` / `top: 0` defaults (React inline styles otherwise
  win at equal specificity); the centred rule's `transform` and
  `opacity` do not need `!important` because the post-active rAF
  clears the corresponding inline values when the gate is active.
- **`landing-v7-motion.html`** — `#services` is stripped of its
  `.exec` block (`.exec__header` eyebrow + lede, `.exec__grid`
  Keynotes / Workshops / Strategy cards) and the
  `.practice-cta--funnel` CTA. The section keeps its `<section>`
  shell + `.station__idx` corner chrome so HUD nav, the celestial
  slots layer, and the ADR-021 `relocateStationsToMount` spec all
  still resolve. Final copy + offer are pending.

### Why the welded camera, not the corridor mirror

`useWorldDomTracker`'s mirror camera follows `paintProgress`, which is
forced to 0 outside the active stage and saturates at 1 during the
corridor's end. That camera stays parked at `CAMERA_END` through the
entire epilogue + dock — which is correct for the brandmark anchor's
WORLD position (sphere centre never moves) but wrong for the
projected SCREEN position once the canvas camera tilts up over the
pole during LAND. The welded path runs a SECOND mirror camera that
follows `getEpilogueCameraPose(ep) → getCorridorExitCameraPose(d)` on
the SAME `t = d²(3-2d)` blend `FlyingCameraRig` + `EpilogueNewsTicker`
use, so the brandmark's screen rect is C0-continuous with the visible
sphere centre. The ticker had the same problem and the same solution;
this revision applies that pattern to the brandmark.

### Why a parallel rAF (and not "just include `docked` in `painting`")

The tracker's `painting = active || armed` gate is shared by every
anchor it tracks — notably `CopyAnchors`. Widening the gate to
include `docked` would keep the corridor's per-station copy painting
during the dock window, even though those labels are tied to the
corridor's beat sequence (Navigate / Encode / Build) and should be
gone once the sphere is dissipating. The parallel rAF in the actor is
scoped to the brandmark; the tracker's gate is left untouched and
copy labels release cleanly when the stage scrolls past.

### Invariants preserved

- **Single-writer rule.** `useCorridorExitScroll` is still the only
  writer of `docked` / `dockProgress`. The new gate (`data-services-
brandmark`) lives on `<html>` as a DOM attribute, NOT on the store
  — `useDepthScroll`'s reverse-scroll release (`DOCK_RELEASE_EPILOGUE_
PROGRESS = 0.7`) still owns the cross-writer guard. The actor's
  post-active rAF is read-only against the store; it never writes
  `docked` / `dockProgress`.
- **ADR-008 paint stack.** The fixed `body::before` veil
  (`html[data-corridor-exit="true"]`) still owns the re-shielding of
  the dark surface as the dissipate completes; the brandmark sits
  ABOVE the veil at z-index 24 (its existing rule, untouched).
- **Reduced-motion / mobile / no-WebGL fallback.** `dockCapable`
  still gates dock engagement. When `dockCapable` is false the new
  gate is also never set (the hook short-circuits before computing
  it), so the page reads as a sequential dark cut from corridor to
  Services to Continuum. No new motion is introduced in the fallback
  path.
- **Geometric exits + entries.** The brandmark's only opacity ramps
  are still the corridor tail bookend (`TAIL_FADE_OUT_START`) and
  the per-parked-beat brightness intensity. The visible exit is the
  welded ride-out off-screen; the visible entry into Services is the
  welded → centre rect lerp; the visible exit into Continuum is the
  CSS-driven `--services-brandmark` fade, gated on `#continuum.top`
  (a SCROLL-driven geometric trigger, not a corridor-clock one).

### Files touched in this revision

- [`components/landing/home-v2/ProjectedBrandmarkActor.tsx`](../../components/landing/home-v2/ProjectedBrandmarkActor.tsx)
  — welded mirror camera, `computeWeldedRect` helper, post-active
  parallel rAF, removed epilogue `APPROACH` opacity fade.
- [`components/landing/home-v2/hooks/useCorridorExitScroll.ts`](../../components/landing/home-v2/hooks/useCorridorExitScroll.ts)
  — widened dissipate span, dropped header/grid/cta reveal channels,
  added `data-services-brandmark` + `--services-brandmark` gate.
- [`components/landing/home-v2/home-v2.css`](../../components/landing/home-v2/home-v2.css)
  — `#services` height bump, fixed-position promotion under both
  gates, hold + fade rules.
- [`public/prototypes/v7/landing-v7-motion.html`](../../public/prototypes/v7/landing-v7-motion.html)
  — `#services` stripped of its `.exec` block + `.practice-cta--funnel`.

## 2026-06-16 Revision — Phase 2: Brandmark → pixelated gateway field

The 2026-06-16 ride-out revision settled the brandmark in `#services`
as a static centred SVG that opacity-faded as `#continuum`
approached. With the Services runway now empty of execution copy,
that terminal beat read as the brand simply blinking out — the
corridor's headline artifact left the page on an opacity ramp,
disagreeing with the rest of the journey's geometric vocabulary.

This phase replaces the held SVG mark in `#services` with a
**pixelated particle field** sampled from the SAME canonical
brandmark paths (`BRANDMARK_FULL_PATHS` via
`lib/brandmark/sampleShape.ts`, ADR-014's single-source-of-truth).
The dissolve begins the **moment the brandmark re-centres and shows
itself** — which happens WHILE THE DOCK IS STILL ENGAGED (the
welded recentre completes at `dockProgress >=
MARK_CENTRED_DOCK_PROGRESS = 0.85`, well before the dock releases at
`rawDissipate >= 0.999`). From that point the field paints the mark
assembled (silhouette pixels at full alpha) and then progressively
disperses across a LONG runway driven by `#continuum`'s approach
(`SEAM_MORPH_START_VH = 1.9` → `SEAM_MORPH_END_VH = 0.1`, ~1.8
viewports), particles drifting outward + lifting upward and fading —
a continuous geometric dissolve rather than a late burst in the
final fade band. The morph clock is independent of `docked`, so the
canvas paints over the dissipating planet during the dock tail and
keeps painting seamlessly across the dock release.

**Revision note (2026-06-16, same day):** the morph originally only
ran across the narrow `data-services-brandmark="fade"` band (the
last ~0.4vh before `#continuum`), so the re-centred mark sat static
for ~1 viewport before pixelating. Per user feedback ("from the
moment the brandmark shows itself again, scrolling should transform
it into the particle system") the clock was rebased to open at the
recentre-complete point and span the whole post-reveal runway.

The 3px square grid borrows directly from
`/test/gateway`'s `ImageParticleGateway` hero (`fillRect`,
`GRID = 3`). ADR-015 retired the square aesthetic for the brandmark
particle painters proper; this seam field is **NOT one of the
capped brandmark painters** (it lives outside the
`BrandmarkParticleCanvas` cap of two global meshes — atmosphere
and silhouette — and the substrate-sphere mesh inside the
intelligence-layer canvas), so the square pixels are an intentional
borrow and are documented here as the official exception.

### What changed

- **`lib/home-v2/seamPixelize.ts`** (NEW) — pure dispersal math.
  `dispersePixel(particle, layout)` maps a sampled brandmark point
  - its seed/rank through the `seamMorph` 0..1 clock to a snapped
    viewport-pixel position, alpha, and gold↔dawn colour mix. Pinned
    by unit tests (assemble at 0, fully dispersed/faded at 1, grid-
    snapped, deterministic). Exports the shared
    `getServicesTargetHalfPx(vw)` and `SEAM_BRANDMARK_ASPECT` so the
    pixel field and the actor read at the same Services-centred size.
- **`components/landing/home-v2/CorridorSeamPixelField.tsx`** (NEW)
  — fixed full-viewport 2D canvas. Samples
  `BRANDMARK_FULL_PATHS` once on mount (substrate-tier density —
  1900 desktop / 700 mobile, matching `BrandmarkSilhouettePoints`),
  reads `seamMorph` from `depthGatewayStore` each frame, and
  paints the pixel cloud via `dispersePixel`. Bails out (single
  attribute read + clearRect) when `data-services-brandmark` is
  not `"hold"` or `"fade"`.
- **`useCorridorExitScroll.ts`** — publishes the new clock:
  `transform.seamMorph` on the depth-gateway store, the
  `--services-pixelate` (0..1) CSS var on `<html>`, and the
  scoping attribute `data-services-pixelate="true"`. The morph is
  active when `dockCapable && sectionNearDock && markCentred &&
continuumTopVh < SEAM_MORPH_START_VH`, where `markCentred =
  docked ? dissipate >= MARK_CENTRED_DOCK_PROGRESS : rawDissipate
  > = 0.999`— i.e. it opens during the dock tail once the welded
recentre lands, NOT only after the dock releases.`seamMorph =
  > smoothstep01((SEAM_MORPH_START_VH - continuumTopVh) /
  > (SEAM_MORPH_START_VH - SEAM_MORPH_END_VH))`. The actor-lifecycle
gate (`data-services-brandmark`hold/fade +`--services-brandmark`opacity) is kept UNCHANGED for the SVG release + the fallback
path; on the capable path the SVG is hidden by`data-services-pixelate` regardless of that gate.
- **`depthGatewayStore.ts`** — adds `seamMorph: number` field to
  `DepthGatewayTransform`. Updated `transformEquals` /
  `INITIAL_TRANSFORM` / cleanup. The hook stays the single writer
  of `docked` / `dockProgress` / `seamMorph`.
- **`home-v2.css`** — adds `.home-v2-seam-pixels` layer (fixed
  full-viewport, `z-index: 24`, `display: none` by default; flips
  to `block` under `data-services-pixelate="true"`). Adds an
  override that sets the SVG glyph to `opacity: 0` under the
  same attribute, so the visible mark in `#services` is the pixel
  cloud (capable path) while the legacy SVG opacity fade stays
  intact for any future fallback path that ever sets the gate
  without the pixelate attribute.
- **`HomeCorridor.tsx`** — mounts `CorridorSeamPixelField` next to
  `ProjectedBrandmarkActor` on the non-fallback path.
- **`ProjectedBrandmarkActor.tsx`** — docstring update only. The
  actor still owns the welded ride-out + recentre + post-active
  rAF; the visible flip from SVG to canvas is handled entirely
  via the new CSS attribute.

### Invariants preserved

- **Single-writer rule.** Hook still owns `docked` / `dockProgress`
  / `seamMorph`. No other writer touches the store fields it
  publishes.
- **Brandmark Principles 2 + 5.** The seam pixel field is an
  EXIT BOOKEND — opacity ramps are allowed here (Principle 5).
  Inside the corridor proper the journey-driven painters still
  honour Principle 2 (no opacity mid-journey).
- **Brandmark painter cap (ADR-015 / ADR-019).** Three painters max
  inside `BrandmarkParticleCanvas` + the substrate-sphere mesh.
  `CorridorSeamPixelField` is OUTSIDE that canvas (its own 2D
  canvas with its own rAF) and is OUTSIDE the brandmark journey
  contract — it does not count against the cap. New particle
  visuals that extend the BRANDMARK JOURNEY itself still must
  respect the cap.
- **ADR-014 single-source-of-truth.** The pixel field samples the
  SAME `BRANDMARK_FULL_PATHS` the SVG glyph and the existing
  silhouette painter render. No parallel geometry source.
- **Reduced-motion / mobile / no-WebGL fallback.** `dockCapable`
  still gates the gate. The pixel field is mounted only when
  `!fallback` in `HomeCorridor`. The fallback path keeps the
  pre-revision sequential dark cut.

### Files touched in this revision

- [`lib/home-v2/seamPixelize.ts`](../../lib/home-v2/seamPixelize.ts) (NEW)
- [`components/landing/home-v2/CorridorSeamPixelField.tsx`](../../components/landing/home-v2/CorridorSeamPixelField.tsx) (NEW)
- [`tests/lib/seam-pixelize.test.ts`](../../tests/lib/seam-pixelize.test.ts) (NEW)
- [`components/landing/home-v2/hooks/useCorridorExitScroll.ts`](../../components/landing/home-v2/hooks/useCorridorExitScroll.ts)
  — `seamMorph` clock + `data-services-pixelate` attribute writes.
- [`lib/stores/depthGatewayStore.ts`](../../lib/stores/depthGatewayStore.ts)
  — `seamMorph` field on `DepthGatewayTransform`.
- [`components/landing/home-v2/HomeCorridor.tsx`](../../components/landing/home-v2/HomeCorridor.tsx)
  — mounts the seam pixel field on the capable path.
- [`components/landing/home-v2/ProjectedBrandmarkActor.tsx`](../../components/landing/home-v2/ProjectedBrandmarkActor.tsx)
  — docstring update only.
- [`components/landing/home-v2/home-v2.css`](../../components/landing/home-v2/home-v2.css)
  — `.home-v2-seam-pixels` layer + SVG hide rule under `data-services-pixelate`.

## 2026-06-18 Revision — Dissipate elegance pass (gentle onset + temporal follower)

The zoom-dissipate sphere fly-in read as **harsh and abrupt at the
onset**: the moment `#services` entered the viewport the camera leapt
into the sphere, then decelerated. Two causes, both differences from
the epilogue flyover that immediately precedes it (which the user holds
as the "right" speed/smoothness reference):

1. **Onset curve.** `corridorExitSpeedRamp` was an ease-OUT cubic
   (`1 − (1 − t)³`) with its MAXIMUM velocity at `t = 0`. The earlier
   ease-out was chosen to kill a "wait, then lurch" feel from THREE
   stacked smoothsteps (hook + rig + pose), but it overcorrected into a
   hard onset.
2. **No temporal smoothing.** Every dissipate consumer read the raw
   scroll-derived `dockProgress`, so wheel-notch quantization stepped
   the fly-into-sphere — whereas the epilogue rides the motion
   follower's exponential chase (`getSmoothedEpilogueProgress`) that
   melts notches into a continuous glide.

### What changed

- **`lib/home-v2/epilogueTimeline.ts`** — `corridorExitSpeedRamp` is now
  **smootherstep** (`6t⁵ − 15t⁴ + 10t³`), an ease-IN-OUT curve with zero
  velocity AND acceleration at both ends, so the fly-in starts from rest
  and settles gently. It is still the SINGLE authored easing curve
  consumed directly (no second smoothstep), so the "wait, then lurch"
  regression cannot recur.
- **`DepthGatewayScene/motionFollower.ts`** — adds a `dissipate` channel
  (tau 0.18s, matched to the epilogue) + `getSmoothedDissipate()`,
  mirroring the epilogue channel. The follower is a temporal FILTER, not
  a second easing curve, so the single-authored-curve contract holds.
- **`DepthGatewayScene/index.tsx`** — `MotionFollowerDriver` feeds the
  channel `docked ? dockProgress : 0` so reverse-scroll eases the fly-in
  back out instead of snapping.
- **The four glued sphere/camera consumers** now fly the SAME smoothed
  value so the welded DOM marks stay glued to the canvas sphere:
  `FlyingCameraRig` (camera fly-in), `ShellSubstrateGyro` (shell scatter
  - particle fade + atmosphere/core), `ProjectedBrandmarkActor`
    (welded brandmark, both the tracker `onPaint` and the post-active
    rAF, via `computeWeldedRect`), and `EpilogueNewsTicker` (welded ring).
- **`tests/lib/epilogue-timeline.test.ts`** — the `corridorExitSpeedRamp`
  spec now asserts the symmetric ease-in-out shape + the gentle onset.

### Invariants preserved

- **Single-writer rule.** `useCorridorExitScroll` is still the only
  writer of `docked` / `dockProgress` / `seamMorph`. The smoothed
  dissipate lives in the motion-follower module singleton (read-only
  getter), exactly like the epilogue channel — no new store field.
- **Single authored curve.** smootherstep is applied once (in the
  ramp); the follower is a temporal filter on top. Consumers still do
  not stack a second smoothstep.
- **Threshold gates unchanged.** The DOM signal-block lift, the seam
  pixel-field morph clock, and the `markCentred` / `DOCK_RECENTRE_FRAC`
  gates continue to read the raw `dockProgress` (they are translations /
  coarse thresholds, not welded to the camera), so their timing is
  unchanged.
- **Reverse-scroll / release / fallback.** The follower snaps on
  teleport + idle-resume (mirrors the epilogue channel) and eases the
  target back to 0 when `docked` releases; the existing
  visibility/veil gating still covers the dock-release frame.

### Files touched in this revision

- [`lib/home-v2/epilogueTimeline.ts`](../../lib/home-v2/epilogueTimeline.ts)
- [`components/landing/home-v2/DepthGatewayScene/motionFollower.ts`](../../components/landing/home-v2/DepthGatewayScene/motionFollower.ts)
- [`components/landing/home-v2/DepthGatewayScene/index.tsx`](../../components/landing/home-v2/DepthGatewayScene/index.tsx)
- [`components/landing/home-v2/DepthGatewayScene/FlyingCameraRig.tsx`](../../components/landing/home-v2/DepthGatewayScene/FlyingCameraRig.tsx)
- [`components/landing/home-v2/DepthGatewayScene/shell/ShellSubstrateGyro.tsx`](../../components/landing/home-v2/DepthGatewayScene/shell/ShellSubstrateGyro.tsx)
- [`components/landing/home-v2/ProjectedBrandmarkActor.tsx`](../../components/landing/home-v2/ProjectedBrandmarkActor.tsx)
- [`components/landing/home-v2/CorridorStationHeaders.tsx`](../../components/landing/home-v2/CorridorStationHeaders.tsx)
- [`tests/lib/epilogue-timeline.test.ts`](../../tests/lib/epilogue-timeline.test.ts)

## 2026-06-19 Revision — Ticker exit follows signal lift, not camera fly-in

The 2026-06-18 polish made `EpilogueNewsTicker` a full smoothed-dissipate
consumer alongside the camera, shell, and projected brandmark. That kept the
ring mathematically glued to the sphere, but visually it made the ticker react
on the sphere camera clock before the top signal group had clearly begun its
own exit. On scroll-forward the ticker could clip / vanish abruptly while
`EVERYONE IS RACING TO BUILD THIS LAYER.` was still readable in place, which
split one editorial beat into two.

This revision makes the ticker a signal-group follower instead of an
independent exit actor:

- **Vertical movement:** the ticker reads `--ticker-exit-lift`, and that var is
  now exactly the same raw `dockProgress` lift as the signal title/CTA
  (`TICKER_EXIT_LIFT_BOOST = 1`). The ticker starts moving when the headline
  starts moving, not a moment before.
- **Radius:** the ticker stays projected on the stable docked epilogue limb and
  no longer borrows shell scatter (`TICKER_SHELL_SCATTER_SHARE = 0`). Runtime
  evidence showed even a restrained radius share added extra upward motion on
  top of the matched CSS lift, causing the arc to leave while the title was
  still visible.
- **Opacity:** `SIGNAL_OUT` is pushed to `0.86 -> 0.99`, and the ticker now
  reads `--signal-opacity` from the same signal rAF that writes the title/CTA
  opacity. The ticker's own rAF only redraws the arc path; it does not read or
  write opacity. This removes the second-rAF race where stale inline
  `sigEl.style.opacity` could blank the ticker while the title was visible.

### Invariants preserved

- `useCorridorExitScroll` remains the single writer of `docked` /
  `dockProgress`.
- The sphere/camera painters continue to use the smoothed dissipate channel.
  The ticker's **vertical timing** is intentionally raw-scroll-synced because it
  is an editorial DOM signal group element, not a physical camera consumer.
- The ticker path continues to project from the docked epilogue limb so it stays
  visually tied to the sphere horizon, but visibility and exit motion are owned
  by the signal group.
- The late fade still reaches 0 before the dock release (`dissipate >= 0.999`).

## 2026-06-19 Revision — Services ambient hold (inside-the-sphere)

The ADR-021 corridor-exit choreography flies the camera into the
intelligence-layer sphere and scatters its surface particles, then
hands the welded brandmark off into `#services`. By the time the
dock releases (`rawDissipate >= 0.999`) the surface helpers have
faded to 0, the body veil has ramped to its dissipate-1 alpha, and
the `#services` shell takes ownership of the dark backing again.
Functionally correct, but it collapsed the **hold beat** — the
~1 viewport runway between the dock release and `#continuum`'s
arrival, during which the welded brandmark sits centred in the
section — to a flat void rectangle. The narrative read ("we flew
into our own intelligence layer") cut out the moment the camera
arrived inside the sphere.

This revision keeps a low-key warm interior particle haze painting
behind the centred brandmark across that hold band, so the user
reads the centred mark as floating **inside** the sphere they just
flew into rather than against a black backdrop. The persistent-
sphere-ambient alternative the original ADR rejected ("Persistent
faint sphere ambient behind all of Services") is realised here in a
bounded form: the ambient hold is scoped to the 200svh runway only
(NOT the entire Services flow), and the surface geometry is fully
hidden — only the interior cloud + a baseline starfield keep
painting.

### What changed

- **`lib/stores/depthGatewayStore.ts`** — adds two fields to
  `DepthGatewayTransform`: `servicesAmbient: boolean` and
  `servicesAmbientLevel: number` (0..1 envelope, 1 across the hold,
  ramps to 0 with the continuum-approach fade). `transformEquals` /
  `INITIAL_TRANSFORM` updated. `useCorridorExitScroll` is the sole
  writer; the two existing call sites that built the transform
  literally (`HandoffLabPage`, `NavigateCopyLabPage`) pass the
  default `false`/`0` for the new fields.
- **`lib/home-v2/epilogueTimeline.ts`** — adds
  `SERVICES_AMBIENT_HOLD_LEVEL = 0.48` and
  `servicesAmbientOpacityMultiplier(ambientLevel, holdLevel?)`. The
  helper composes multiplicatively onto an existing `uOpacity` so
  callers can drop it in alongside `dissipateInteriorOpacity-
Multiplier` without disturbing the dock-time path. Pinned by unit
  tests covering the envelope endpoints, monotonicity, custom hold
  level, input clamping, and a band check on the hold constant.
- **`components/landing/home-v2/hooks/useCorridorExitScroll.ts`** —
  computes `servicesAmbient = dockCapable && servicesGate != null`
  (i.e. engages alongside `data-services-brandmark` = `"hold"` or
  `"fade"`, after the dock release). Publishes a new `<html>`
  attribute `data-services-ambient="true"` + a `--services-ambient`
  (0..1) CSS var that mirrors the `--services-brandmark` fade so the
  haze and the brandmark cross-fade together as `#continuum`
  approaches. Also splits the body veil from the raw dissipate
  clock by writing a new `--corridor-exit-veil` (0..1) var capped at
  `VEIL_AMBIENT_CAP = 0.45`. The veil ramps with the dissipate while
  docked but never crosses the cap, holds at the cap across the
  ambient hold, and ramps back to 0 with the ambient envelope so the
  canvas paints visibly under it throughout. The `data-corridor-
exit` attribute now persists across both the dock and the ambient
  hold, so `#services` stays transparent + `content-visibility:
  visible` for the whole seam; the normal-station opaque void shield
  re-takes ownership the moment both flags clear.
- **`components/landing/home-v2/home-v2.css`** — extends the fixed
  canvas promotion rule to match `data-services-ambient="true"` as
  well as `data-corridor-docked="true"` (same fixed pose + void
  backing + pointer-events: none). Updates the `body::before` veil
  to read `var(--corridor-exit-veil, 0)` instead of
  `var(--corridor-dissipate, 0)`.
- **R3F painters** — extend the engaged gate (`active || armed ||
docked || servicesAmbient`) on the four contributors to the
  inside-the-sphere read:
  - `DepthGatewayScene/index.tsx`:
    - `FrameInvalidator` — keeps the demand-mode pump alive during
      ambient so the haze doesn't freeze when the user stops
      scrolling inside the hold band.
    - `MotionFollowerDriver` — pins the smoothed `dissipate` target
      at 1 during ambient (the dock has released but the camera +
      welded marks should stay parked at the deepest inside-the-
      sphere pose), and extends the `painting` gate so the follower
      keeps easing across the dock <-> ambient boundary.
  - `FlyingCameraRig.tsx` — treats `docked || servicesAmbient` as
    "dock-held" for the dock-blend + reverse-scroll snap rule, so
    the camera stays on the corridor-exit pose at dissipate ≈ 1
    through the hold (no snap back to the parked-planet view).
  - `ShellSubstrateGyro.tsx` — surface materials still ride
    `dissipateOp` to 0 by ambient engage; the interior particle
    cloud now composes the ambient multiplier
    (`servicesAmbientOpacityMultiplier(servicesAmbientLevel)`) on
    top of `dissipateInteriorOp` so the cloud picks up the held
    alpha as the dissipate floor crosses over to the ambient
    envelope. Suppresses the dock-time visibility/size/opacity
    boosts during ambient so the haze reads as distant background
    dust, not foreground bokeh.
  - `StaticStarfield.tsx` — keeps painting at the baseline opacity
    (no Build boost) scaled by `servicesAmbientLevel`, so a low,
    distant star bed sits behind the gyro haze and fades with it.
  - `BrandmarkPhysicsCoreActor.tsx` — keeps the sim warm during
    ambient (so reverse-scroll back into the dock doesn't re-warm-
    spike) but forces `handoffFade = 0` so the in-canvas core never
    paints a duplicate mark behind the welded SVG / pixel field.
- **`components/landing/home-v2/hooks/useDepthScroll.ts`** —
  reverse-scroll release guard for the ambient channel. Mirrors the
  existing `DOCK_RELEASE_EPILOGUE_PROGRESS = 0.7` gate that clears a
  stale `docked` flag; if the user reverse-scrolls past the same
  threshold while `prev.servicesAmbient` is still true, we
  synchronously clear both the store flag and the
  `data-services-ambient` attribute / `--services-ambient` var so
  the painters drop the inside-the-sphere camera pose at the same
  frame they leave the dock window.

### Why a separate engagement flag and not "just extend `docked`"

`docked` is a precise contract: the corridor-exit dissipate clock is
ramping and the camera is mid fly-into-sphere. Several painters /
gates / CSS rules already key on it (the dock canvas promotion, the
veil ramp, the welded brandmark recentre, the BrandmarkPhysicsCore
floor, the smoothed dissipate motion follower). Widening it to
include the post-release hold would either:

- silently apply the dock-time visibility/size boosts to the ambient
  cloud (the planet-density boost is gated on `docked` directly),
  reading as a curtain of foreground dust during the hold; or
- require every existing `docked` consumer to grow a "but not
  ambient" carve-out, which is the inverse of the single-flag
  intent.

A second flag with a single writer keeps the dock contract intact
and lets ambient painters opt in explicitly. The motion follower
still maps both flags to the same smoothed `dissipate` channel, so
the camera path is C0-continuous across the boundary; the only
thing that changes at the dock release frame is which painters
contribute.

### Invariants preserved

- **Single-writer rule.** `useCorridorExitScroll` owns `docked` /
  `dockProgress` / `seamMorph` / `servicesAmbient` /
  `servicesAmbientLevel`. The reverse-scroll release in
  `useDepthScroll` is the documented exception — it CLEARS but
  never SETS the new flags, mirroring the existing dock release
  guard. The `--corridor-exit-veil` var is written only by the exit
  hook.
- **ADR-008 paint stack.** `#services` is still transparent only
  while `data-corridor-exit` is active; the body veil still owns
  the re-shielding of the dark surface, with the new
  `--corridor-exit-veil` clock keeping it below 1 while the canvas
  is meant to be visible underneath and ramping it to 0 across the
  ambient fade. No new opaque rectangle is introduced.
- **GPU cost bounded to the hold.** The ambient flag releases at the
  same `#continuum.top / vh` window that releases the brandmark
  hold (`CONTINUUM_FADE_END = 0.1`), so the R3F canvas idles via
  demand mode the moment the next station owns the viewport. This
  is the original ADR's rejected "persistent through all of
  Services" alternative scoped to a single 200svh runway — the
  reason the alternative was rejected (full-section GPU cost
  competing with the cards) does not apply to the runway-only
  scope.
- **ADR-015 brandmark painter cap.** The ambient hold reuses the
  existing `ShellSubstrateGyro` substrate-sphere mesh and the
  `StaticStarfield` ambient layer; it does not add a new painter to
  `BrandmarkParticleCanvas`. The cap is unchanged.
- **Reduced-motion / mobile / no-WebGL fallback.** `dockCapable`
  still gates `servicesAmbient`. When false the flag is never set,
  the fixed canvas promotion never engages, and the page reads as a
  sequential dark cut from corridor → services → continuum exactly
  as before.

### Files touched in this revision

- [`lib/stores/depthGatewayStore.ts`](../../lib/stores/depthGatewayStore.ts)
- [`lib/home-v2/epilogueTimeline.ts`](../../lib/home-v2/epilogueTimeline.ts)
- [`tests/lib/epilogue-timeline.test.ts`](../../tests/lib/epilogue-timeline.test.ts)
- [`components/landing/home-v2/hooks/useCorridorExitScroll.ts`](../../components/landing/home-v2/hooks/useCorridorExitScroll.ts)
- [`components/landing/home-v2/hooks/useDepthScroll.ts`](../../components/landing/home-v2/hooks/useDepthScroll.ts)
- [`components/landing/home-v2/home-v2.css`](../../components/landing/home-v2/home-v2.css)
- [`components/landing/home-v2/DepthGatewayScene/index.tsx`](../../components/landing/home-v2/DepthGatewayScene/index.tsx)
- [`components/landing/home-v2/DepthGatewayScene/StaticStarfield.tsx`](../../components/landing/home-v2/DepthGatewayScene/StaticStarfield.tsx)
- [`components/landing/home-v2/DepthGatewayScene/FlyingCameraRig.tsx`](../../components/landing/home-v2/DepthGatewayScene/FlyingCameraRig.tsx)
- [`components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx`](../../components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx)
- [`components/landing/home-v2/DepthGatewayScene/shell/ShellSubstrateGyro.tsx`](../../components/landing/home-v2/DepthGatewayScene/shell/ShellSubstrateGyro.tsx)
- [`components/landing/home-v2/handoff-lab/HandoffLabPage.tsx`](../../components/landing/home-v2/handoff-lab/HandoffLabPage.tsx)
  — typed pass-through only.
- [`components/landing/home-v2/lab/NavigateCopyLabPage.tsx`](../../components/landing/home-v2/lab/NavigateCopyLabPage.tsx)
  — typed pass-through only.

### 2026-06-19 follow-up — the dock-release cut (paintProgress collapse)

The first ambient-hold pass still read as "particles visible during the
dissipate, then they vanish suddenly a bit further down." The visible
disappearance was NOT (only) the interior-opacity compounding bug below —
it was a deeper collapse rooted in how `paintProgress` behaves once the
sticky stage scrolls out of view.

**Root cause.** The corridor stage is ~820svh and `#services` follows it
immediately, so the stage's bottom passes the viewport top roughly
halfway through the dissipate runway (`rawDissipate ≈ 0.5`). At that
point `getCorridorEngagement` flips `active` to false, and
`paintProgress` (= `active ? progress : 0`) snaps `1 → 0` mid-dock.
Three things collapse at once:

1. **Shell position.** [`BrandmarkAccretionShell`](../../components/landing/home-v2/DepthGatewayScene/BrandmarkAccretionShell.tsx)
   sets `shell.position = getBrandmarkWorldPosition(paintProgress)`. At
   `paintProgress 0` that is the far Thoughtform station — the sphere
   teleports out of the camera's view.
2. **Accretion reveal.** `getBrandmarkAccretionLayers(0).substrate =
smoothstep(0.3, 0.42, 0) = 0`, so the motion follower's `substrate`
   channel targets 0 and [`ShellSubstrateGyro`](../../components/landing/home-v2/DepthGatewayScene/shell/ShellSubstrateGyro.tsx)
   early-returns (`reveal <= EMERGE_EPSILON` → `root.visible = false`).
3. **Follower teleport snap.** The `1 → 0` jump exceeds
   `TELEPORT_PROGRESS_DELTA`, so `driveMotionFollower` snaps every
   channel instead of easing — the collapse is instant, not gradual.

So the WHOLE sphere (surface scatter + interior haze) blinked out around
the middle of the dock, before the ambient interior code ever ran.

**Fix — hold `paintProgress` at 1 across the exit.** The corridor never
conceptually leaves the sphere during the exit; it flew INTO it. While
`docked || servicesAmbient` and `!active`, [`useDepthScroll`](../../components/landing/home-v2/hooks/useDepthScroll.ts)
now pins `paintProgress = 1` (the Build/intelligence park). This keeps
the shell parked at the Build world position, holds the accretion reveal
saturated, and removes the `1 → 0` jump so the follower never teleport-
snaps. The dissipate/ambient clocks (owned by `useCorridorExitScroll`)
still drive the surface scatter + interior fade on top of this stable
base. The pin lifts the instant the exit flags clear (reverse-scroll
release or the dock/ambient gates going false), by which point the stage
has re-pinned and live `paintProgress` resumes with no jump.

Supporting changes:

- [`BrandmarkAccretionShell`](../../components/landing/home-v2/DepthGatewayScene/BrandmarkAccretionShell.tsx)
  `painting` gate gains `servicesAmbient` so the sphere subtree stays
  mounted/positioned through the hold (its `visible = false` early
  return would otherwise hide `ShellSubstrateGyro` even with the gyro's
  own loop running).
- **Interior continuity** in `ShellSubstrateGyro`: the interior cloud is
  ONE continuous envelope, SELECTED not multiplied — dock uses
  `dissipateInteriorOpacityMultiplier(dissipate, SERVICES_AMBIENT_HOLD_LEVEL)`
  (full → hold), ambient uses `servicesAmbientOpacityMultiplier(level)`
  (hold → 0). The interior floor is raised from the old 0.18 to
  `SERVICES_AMBIENT_HOLD_LEVEL` so dock-end == ambient-start (C0
  continuous) AND the inside of the sphere stays clearly visible. The
  dock-era visibility/size boosts are bridged across the dock release
  (`interiorHeld = docked || servicesAmbient`) so the cloud doesn't jump
  dimmer/smaller at the seam. (The earlier pass multiplied BOTH the
  dissipate floor and the ambient multiplier, dropping the cloud to
  ~0.18 × 0.48 at the boundary — a second, smaller cut.)
- **Starfield continuity** in [`StaticStarfield`](../../components/landing/home-v2/DepthGatewayScene/StaticStarfield.tsx):
  with `paintProgress` pinned at 1 the build-boost is already saturated,
  so the ambient branch now just FADES the build-boosted brightness by
  `servicesAmbientLevel` instead of dropping to the dim baseline (which
  was its own ~40% step at the dock release).

**Invariant note.** The pin is a `paintProgress` WRITE, and
`useDepthScroll` remains its sole writer — it only reads the exit-hook-
owned `docked` / `servicesAmbient` flags to decide when to hold. The
single-writer rule is intact.

Additional file touched in this follow-up:

- [`components/landing/home-v2/DepthGatewayScene/BrandmarkAccretionShell.tsx`](../../components/landing/home-v2/DepthGatewayScene/BrandmarkAccretionShell.tsx)
  — `servicesAmbient` added to the `painting` gate.

## 2026-06-19 Amendment — Services becomes a content section; in-section brandmark beats RETIRED

Through three follow-up revisions (2026-06-16 ride-out + re-centre,
2026-06-16 Phase 2 pixel-field handoff, 2026-06-19 ambient hold) the
`#services` station accreted a long brandmark-runway choreography:
welded ride-out → re-centre lerp → fixed-centre hold → grid-snapped
pixel dissolve → inside-the-sphere ambient haze → continuum-approach
cross-fade. Each step was correct in isolation but the cumulative
effect was a 200svh section dedicated entirely to walking the
brandmark off-screen with zero practical content — the corridor's
rhetorical setup ("...the labs are spending billions on the same
layer") never landed on its practical answer.

This amendment makes `#services` a content section again: a
Linear-style header (heading left, lede right) plus three retro-
terminal stacking cards (Keynote · Workshop · Embedded — "one loop,
three depths"). The cards are SVR-shaped wide horizontal panels
(hard corners + 45° top-right notch) with a card-scoped 2D particle
sigil on the left and PT Mono / PP Neue Montreal copy on the right.
They sticky-stack natively (Enerblock-style) inside the section's
content gutters so the existing HUD rails stay clear. The dissipate
becomes a short entrance transition — the sphere zoom-in resolves as
the section's header reaches the viewport top — and the brandmark
fades out with the dissipating sphere instead of re-centring.

### Retired beats (brandmark-specific)

- **Welded re-centre lerp** in `ProjectedBrandmarkActor`:
  `DOCK_RECENTRE_FRAC` + the position/size lerp from the welded
  sphere projection to viewport centre are gone. The mark stays
  welded geometrically through the dock — it rides off-screen with
  the camera fly-in.
- **`data-services-brandmark` actor-lifecycle gate** (`"hold"` /
  `"fade"`) + `--services-brandmark` opacity var. No fixed-centred
  CSS layer in `#services`, no continuum-approach fade owned by the
  hook. The brandmark fades out across the back half of the dock
  clock instead (`DISSIPATE_FADE_START = 0.5`,
  `DISSIPATE_FADE_END = 0.95`, smootherstep, applied to both the
  tracker-driven `onPaint` and the post-active rAF).
- **Pixel-field handoff** (`CorridorSeamPixelField`, the
  `data-services-pixelate` / `--services-pixelate` writes,
  `transform.seamMorph`). The fixed 2D canvas is no longer mounted
  on the production path. The component file +
  `lib/home-v2/seamPixelize.ts` + its unit tests stay in the tree as
  a reusable reference for any future "particle dissolve at a
  section seam" composition.

**2026-06-19 follow-up:** user review of the new content section showed
that the transition lost the "inside the sphere" particle bed exactly as
the Services header/cards arrived. The ambient layer is therefore
re-enabled as a **background-only** continuation:

- `data-services-ambient` / `--services-ambient` /
  `transform.servicesAmbient` / `servicesAmbientLevel` are allowed
  after the dock dissipate completes, and they stay engaged for the
  WHOLE section (released only as `#continuum` approaches — the
  `CONTINUUM_FADE_START_VH 0.5 → CONTINUUM_FADE_END_VH 0.1` band in
  `useCorridorExitScroll`).
- The fixed canvas promotion and capped body veil continue while the
  ambient flag is active, so `ShellSubstrateGyro`'s interior cloud and
  `StaticStarfield` remain visible behind Services content.

**2026-06-19 follow-up #2 — particles persist for the WHOLE section:**
the first ambient pass faded the sphere SURFACE to 0 (the dissipate's
`PARTICLE_FADE`), so once the camera parked at the deepest fly-into-
sphere pose (`dissipate` pinned at 1) the view emptied out a third of
the way down the section — the user reported "the particles disappear,
they should remain visible throughout the ENTIRE services section". Fix
(matching the existing interior-cloud continuity pattern):

- **`SERVICES_AMBIENT_SURFACE_LEVEL = 0.3`** (`epilogueTimeline.ts`) —
  a low floor for the surface particles (dotted shell, globe dots,
  equator). `ShellSubstrateGyro` SELECTS (never multiplies) between the
  dock-tail multiplier (`dissipateInteriorOpacityMultiplier(dissipate,
SURFACE_LEVEL)`, full → floor) and the ambient multiplier
  (`servicesAmbientOpacityMultiplier(level, SURFACE_LEVEL)`, floor →
  0 as continuum approaches), so the dock release is C0-continuous and
  the radially-scattered shell reads as a sparse particle BED filling
  the frame from inside the sphere for the whole section. At dissipate
  0 the floor multiplier is identity (×1), so the parked / pre-exit
  pose is byte-identical.
- **Surface visibility/point-size boosts bridged via `interiorHeld`**
  (`docked || servicesAmbient`) in `ShellSubstrateGyro` so the bed does
  not step dimmer/smaller at the dock release (same bridge the interior
  cloud already used).
- **`VEIL_AMBIENT_CAP` lowered 0.45 → 0.3** so the particle bed stays
  clearly visible behind the Services content (the dock veil cap is
  unchanged).
- The camera pose is UNCHANGED (still `getCorridorExitCameraPose(1)` via
  the pinned smoothed dissipate), so there is no reverse-motion at the
  dock → ambient seam — only the surface opacity floor + lower veil
  changed.

**2026-06-19 follow-up #3 — the ambient backdrop is STATIC under scroll.**
The fixed canvas + pinned camera already hold the background still in the
viewport, but `ShellSubstrateGyro` still advanced its idle polar spin
(`globeSpin.rotation.y += …` and the per-ring spins) every frame from
wall-clock time, so the inside-sphere particle bed kept rotating behind
the scrolling Services content. The user asked for the background to not
move while scrolling the section. Fix: gate the idle spin off when
`servicesAmbient` (in addition to the existing reduced-motion freeze) —
the rotation simply stops advancing and holds wherever the dock fly-in
left it (no reset, no pop). The per-card `ServiceSigilField` canvases are
card content and continue to scroll with their cards; only the global
background sphere is frozen.

- The brandmark remains retired in Services: no
  `data-services-brandmark`, no fixed-centred SVG, no
  `data-services-pixelate`, and no `CorridorSeamPixelField` mount.
  `BrandmarkPhysicsCoreActor` still forces `handoffFade = 0` during
  ambient so the in-canvas core never paints a duplicate mark.

### What stays

- **`docked` / `dockProgress`** — `useCorridorExitScroll` still owns
  them and they still drive the camera fly-in + the sphere surface
  scatter through `ShellSubstrateGyro`. The clock is intentionally
  SHORT now: `DISSIPATE_SCROLL_SPAN_VH = 0.9` (was 2.0), so the
  zoom-in resolves as the section's header reaches the viewport top
  instead of stretching across the whole section.
- **`--corridor-dissipate`** on `<html>`/`#services` — same dock
  clock, mirrored as a CSS var for any consumer that wants to read
  the same value from CSS.
- **`data-corridor-docked`** — same fixed canvas promotion through
  the (short) dock window.
- **`data-corridor-exit` + `--corridor-exit-veil`** — same body
  veil, capped at `VEIL_DOCK_CAP = 0.55` during dock and then held
  lower (`VEIL_AMBIENT_CAP`) while `data-services-ambient` is active.
  `#services` stays transparent during that ambient window so the
  inside-sphere particles remain visible behind content; the opaque
  station shield re-takes ownership as `#continuum` approaches.
- **Single-writer rule** — `useCorridorExitScroll` still owns
  `docked` / `dockProgress` / `seamMorph` / `servicesAmbient` /
  `servicesAmbientLevel`. `seamMorph` is permanently inert on the
  production path; the ambient fields are background-only and fade out
  as the next station approaches.
- **Fallback** (`!dockCapable`) — unchanged. The sticky stage stays
  pinned, no dock, sequential dark cut from corridor → Services →
  Continuum. On mobile + reduced-motion the new cards also drop the
  sticky pin and render as a simple vertical list (see
  `services.css` mq).

### New surface

- Section markup edits in
  [`public/prototypes/v7/landing-v7-motion.html`](../../public/prototypes/v7/landing-v7-motion.html)
  — `#services` gets a `.services__header` + `<div data-services-root>`
  portal mount and the legacy `.station--services` class.
- React portal pattern (mirrors `BuildCasesPortal`):
  - [`components/landing/home-v2/services/ServicesPortal.tsx`](../../components/landing/home-v2/services/ServicesPortal.tsx)
    — `createRoot` into `[data-services-root]`.
  - [`components/landing/home-v2/services/ServiceStack.tsx`](../../components/landing/home-v2/services/ServiceStack.tsx),
    [`ServiceCard.tsx`](../../components/landing/home-v2/services/ServiceCard.tsx),
    [`serviceData.ts`](../../components/landing/home-v2/services/serviceData.ts).
- Card-scoped 2D particle painter:
  - [`components/landing/home-v2/services/ServiceSigilField.tsx`](../../components/landing/home-v2/services/ServiceSigilField.tsx)
    — reuses `lib/brandmark/sampleShape.ts` (the same stratified
    sampler the brandmark painters use, ADR-011), with three
    progressive "compass-resolution" silhouettes (disc → disc +
    vertical bar → disc + cross). Each card mounts its own canvas;
    they're outside the global brandmark painter cap (their own
    container-sized 2D canvases, IntersectionObserver-gated rAF,
    static SVG fallback for reduced-motion / SSR / no-canvas paths).
  - [`lib/services/serviceShapes.ts`](../../lib/services/serviceShapes.ts)
    — three `ServiceShapeSpec`s + fallback SVGs.
- Styling:
  [`components/landing/home-v2/services/services.css`](../../components/landing/home-v2/services/services.css)
  — Linear-style header grid; SVR card geometry (`clip-path` 45°
  top-right notch + corner brackets + mono header strip); native
  sticky-stack (`--svc-stack-i` drives an incremental sticky `top`);
  PT Mono eyebrows / indices / meta labels; gold accent on the lead
  card (WORKSHOP); responsive + reduced-motion fallback unpins.
- Portal mount in
  [`components/landing/v7/LandingPage.tsx`](../../components/landing/v7/LandingPage.tsx)
  next to `BuildCasesPortal`.

### Code that changed (functional)

- [`components/landing/home-v2/hooks/useCorridorExitScroll.ts`](../../components/landing/home-v2/hooks/useCorridorExitScroll.ts)
  — `DISSIPATE_SCROLL_SPAN_VH` 2.0 → 0.9; retired the
  `data-services-brandmark` / `--services-brandmark`,
  `data-services-pixelate` / `--services-pixelate` /
  `transform.seamMorph`, and `data-services-ambient` /
  `--services-ambient` / `transform.servicesAmbient` writes; new
  `VEIL_DOCK_CAP = 0.55` for the body veil cap; the inert seam +
  ambient store fields are still published as `0` / `false` for
  source-compat with downstream R3F painters.
- [`components/landing/home-v2/ProjectedBrandmarkActor.tsx`](../../components/landing/home-v2/ProjectedBrandmarkActor.tsx)
  — removed `DOCK_RECENTRE_FRAC` + `getServicesTargetHalfPx` local
  helper + the recentre lerp in `computeWeldedRect`. Added
  `DISSIPATE_FADE_START` / `DISSIPATE_FADE_END` band; `corridorFade`
  in the tracker-driven `onPaint` and the post-active rAF now fade
  the docked mark across that band. Removed the
  `data-services-brandmark` gate handoff branch in the post-active
  rAF (the gate is never set now).
- [`components/landing/home-v2/HomeCorridor.tsx`](../../components/landing/home-v2/HomeCorridor.tsx)
  — `CorridorSeamPixelField` import + mount are gone.
- [`components/landing/home-v2/home-v2.css`](../../components/landing/home-v2/home-v2.css)
  — removed the `data-services-brandmark` (hold / fade) +
  `data-services-pixelate` + `data-services-ambient` rules + the
  `.home-v2-seam-pixels` layer + the SVG hide under the pixelate
  attribute. Kept `data-corridor-docked` canvas promotion + body
  veil.
- [`tests/visual/landing-corridor-smoke.spec.ts`](../../tests/visual/landing-corridor-smoke.spec.ts)
  — Phase 2 seam canvas presence test inverted to assert the canvas
  is NOT mounted; a new test asserts none of the retired attributes
  (`data-services-pixelate` / `-brandmark` / `-ambient`) appear at
  any scroll depth.

### Why not a separate ADR

The seam contract is the same (`docked` / `dockProgress` / single-
writer / fallback / reverse-scroll release); only the in-section
phases change. Documenting the retirement here keeps the seam's full
history co-located with the surviving recipe.

### Reverse-scroll safety

`useDepthScroll`'s `servicesAmbient` clearer branch (set up in the
2026-06-19 ambient addendum) stays in the tree as a defensive no-op:
the flag is never set now, so the branch never fires, but if a future
recipe ever re-engages an ambient state the guard is still correct.
The `data-services-ambient` attribute + `--services-ambient` var
removal lines in that branch are now dead but harmless.

### 2026-06-25 — core is the visible foreground during `servicesAmbient`

The corridor↔#services unification ([ADR-023](023-corridor-brandmark-physics-core.md)
2026-06-25) inverts this seam's foreground rule on the capable desktop path. The
ambient hold is now re-enabled as a true background+foreground: the in-canvas
brandmark core is held VISIBLE (not the previous `handoffFade = 0` invisible) and
parked as the #services centerpiece, with the orbit armillary (`CorridorArmillary`)
co-mounted in the same canvas. It fades only as `#continuum` approaches, via
`servicesAmbientLevel`. The retired DOM SVG / seam-pixel foreground is NOT
reintroduced — the particle core itself is the foreground mark now. Gated by
`UNIFIED_SERVICES_ARMILLARY`; flag-off restores the crossfade described above.

### 2026-07-05 — static-backdrop contract extended to the DOCK (motion sickness)

The 2026-06-19 ambient addendum froze the substrate gyro's idle spin during
`servicesAmbient` ("static backdrop behind the scrolling Services content"),
but the DOCK phase — the entire `DISSIPATE_SCROLL_SPAN_VH` (1.6-viewport)
runway, i.e. the first service card(s) the user actually reads — still had
THREE continuous rotations running: the whole-assembly `dockSpin` yaw
(`BrandmarkAccretionShell`, `t * 0.045`, added 2026-06-13, which also SNAPPED
the yaw by an arbitrary angle at both dock boundaries because it was
absolute-clock-based), the globe's polar idle spin (meridian/parallel dot
rings + the interior particle cloud, 0.08 rad/s), and the gimbal ring
counter-spins. A user reported motion sickness from the rotating
sphere/particle bed behind the Services copy.

**Contract now:** from the moment `docked` engages through the ambient hold,
NO element of the sphere assembly rotates on a time clock. `dockSpin` is
removed; the gyro's globe + ring spin advances are gated on
`!docked && !servicesAmbient` (freeze-in-place, same no-pop mechanism as the
ambient freeze — rotation holds wherever the corridor left it). Pointer-look
and the scroll-driven dissipate choreography (radial shell scatter, camera
fly-in) are unaffected. Reverse-scrolling back out of the seam un-freezes
(`docked` drops when `sectionNearDock` clears). Do not reintroduce "life"
via continuous background rotation in this window — slow rotation behind
readable copy is a motion-sickness trigger; if the docked sphere ever needs
more presence, use bounded, decaying, or scroll-driven motion instead.

## Related Decisions

- [ADR-002 — Scroll Animation Architecture](002-scroll-animation-architecture.md)
- [ADR-008 — Landing v7 Background Layers](008-landing-v7-background-layers.md) — transparent-leading-viewport exception
- [ADR-018 — Home V2 Depth Corridor](018-home-v2-depth-corridor.md) — the corridor this seam exits from; gets a `2026-06-15 Revision (v3.16) — Zoom-dissipate exit` addendum pointing here.
- [ADR-020 — Home V2 flywheel handoff lab](020-home-v2-flywheel-handoff-lab.md) — origin of the lab routes and the Scenario A cover-plane sweep.
