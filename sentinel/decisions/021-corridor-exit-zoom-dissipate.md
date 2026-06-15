# ADR-021: Corridor Exit — Zoom-Dissipate (and the Retired Cover-Plane Sweep)

**Date:** 2026-06-15
**Status:** Proposed
**Scope:** Production home page (`/`) — the seam between the home-v2 depth corridor and the section that follows it. Includes the now-retired `#buildQuote` "Make the layer useful" docked cover-plane sweep, kept alive as a reusable reference pattern.
**Related:**
[ADR-008 — Landing v7 background layers](008-landing-v7-background-layers.md),
[ADR-018 — Home V2 Depth Corridor](018-home-v2-depth-corridor.md),
[ADR-020 — Home V2 flywheel handoff lab](020-home-v2-flywheel-handoff-lab.md).

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

## Related Decisions

- [ADR-002 — Scroll Animation Architecture](002-scroll-animation-architecture.md)
- [ADR-008 — Landing v7 Background Layers](008-landing-v7-background-layers.md) — transparent-leading-viewport exception
- [ADR-018 — Home V2 Depth Corridor](018-home-v2-depth-corridor.md) — the corridor this seam exits from; gets a `2026-06-15 Revision (v3.16) — Zoom-dissipate exit` addendum pointing here.
- [ADR-020 — Home V2 flywheel handoff lab](020-home-v2-flywheel-handoff-lab.md) — origin of the lab routes and the Scenario A cover-plane sweep.
