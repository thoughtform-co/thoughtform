/**
 * Feature flag for the corridor↔#services brandmark unification (2026-06-25).
 *
 * When ON: the corridor's persistent 3D brandmark particle core does NOT fade
 * out at the Services dive — it parks as the #services centerpiece, and a
 * co-located orbit armillary (`CorridorArmillary`) wraps it in the SAME corridor
 * canvas. So the mark is ONE continuous object from corridor → sphere →
 * #services, with no second wireframe and no cross-dissolve. The standalone
 * `#services` R3F canvas (`ServicesHologramScene` / `VolumetricBrandmarkArtifact`)
 * is not rendered on the capable desktop path (it remains the lab harness at
 * `/test/services-demo`).
 *
 * Flip to `false` to restore the previous two-canvas crossfade (the corridor
 * core fades out via `handoffFade` while the #services hologram fades in).
 *
 * Lives in its own module so both `ServicesStage` (services/) and
 * `BrandmarkPhysicsCoreActor` / `CorridorArmillary` (DepthGatewayScene/) can read
 * it without a circular import between those two feature folders.
 */
export const UNIFIED_SERVICES_ARMILLARY = true;

/**
 * Feature flag for the #services CARD RING (ADR-029, 2026-07-10).
 *
 * When ON (desktop ≥ 961px + no reduced motion):
 *   - the four service cards render as textured planes ORBITING the parked
 *     brandmark inside the corridor canvas (`ServicesCardRing`, mounted by
 *     `CorridorArmillary` under the same pointer-look rig);
 *   - ring rotation is scroll-owned (`useServicesStageScroll` writes
 *     `servicesRingProgressRef`) through a hard-bounded spring;
 *   - the DOM console racks hide; each orbiting card carries its FULL C3
 *     copy on the baked face (one plate — never a photo plane + separate
 *     text console); `ServicesRingHitAreas` makes side/back cards
 *     clickable and exposes the front card's CTA as a real link;
 *   - the per-service rig pose (`getServicePose`) is retired — the ring's
 *     quarter-turns ARE the per-service turn (a rig yaw on top would
 *     double-rotate the cards off front-center).
 *
 * Mobile / reduced-motion keeps the plate accordion regardless of the flag.
 * Flip to `false` to restore the ADR-025 Update-9 console racks
 * byte-identically (all DOM changes key off `data-card-ring`).
 */
export const SERVICES_CARD_RING = true;

/**
 * Feature flag for the ABOUT DECK-FLIP STAGE (ADR-047, 2026-07-16 —
 * supersedes the ADR-046 cartridge dock).
 *
 * When ON (and SERVICES_CARD_RING is on, same media gate):
 *   - across the services runway's final (decommission) beat the four
 *     WebGL ring cards STACK into a deck: each card's azimuth sweeps along
 *     its own orbit to front-centre (staggered, the front card flattens
 *     last) and the radii correct onto evenly-pitched deck depths;
 *   - `#about` becomes a pinned TRANSPARENT stage over the still-live
 *     corridor canvas (`AboutStagePortal` → `useAboutStageScroll`): the
 *     deck FLIPS π on the X axis as one rigid slab, revealing the portrait
 *     back faces, and lands on the DOM portrait slot (`aboutSlotRef`)
 *     inside the orbit cluster; the cluster then translates right with the
 *     deck welded to it while the name/bio copy reveals on the left;
 *   - the corridor ambient hold survives THROUGH `#about` and dies as
 *     `#continuum` approaches (`useCorridorExitScroll` next-station
 *     retarget); the receded mark + orbit tracks clear across the flip
 *     window; the pointer-look damps out for the whole deck life;
 *   - every channel is a pure function of two clamped clocks (the services
 *     exit clock + the about stage clock), so the whole sequence reverses
 *     under scroll and holds byte-stable between the runways.
 *
 * OFF restores the ADR-030 radial fade-out exit AND the opaque #about
 * cover byte-identically (deck branch never runs, the stage never mounts,
 * the fail-opaque shield defaults shut). Mobile / reduced-motion /
 * corridor-fallback keep the static about regardless of the flag.
 */
export const ABOUT_DECK_STAGE = true;

/**
 * Feature flag for the CONTINUUM RAIL STAGE (ADR-049, 2026-07-17).
 *
 * Presumes ABOUT_DECK_STAGE (both true in production). When ON (and the
 * about deck stage is on, same media gate):
 *   - `#continuum` ("AI isn't software to command…") becomes a pinned
 *     TRANSPARENT stage over the still-live corridor canvas
 *     (`ContinuumStagePortal` → `[data-continuum-root]` →
 *     `useContinuumStageScroll`): the receded brandmark RE-EMERGES to
 *     mid-prominence (~0.60 ink, clearer than the ~0.30 about ambient,
 *     subtler than the #services centerpiece) and eases back toward the
 *     parked pose — pre-warmed DURING the #about exit slide via
 *     `continuumFormT` (Update 2) — while every orbit track stays
 *     cleared (Update 3 removed the waist re-brighten);
 *   - the SPECTRUM is the crail instrument, FORMED FROM the mark
 *     (Update 4): the dashed guide rail + bearings + register brackets
 *     wipe outward from the mark's centre on the scrubbed
 *     `--continuum-rail-form` envelope, the stops bloom centre-out, and
 *     the navigator reticle condenses on the mark, launches to the Tool
 *     pole (`data-continuum-formed`), and rides the fallback crail's 7s
 *     ping-pong — the mark keeps the rail's 1/2 seat ("AI lives here",
 *     the v7 `.crail__brand` composition);
 *   - the corridor ambient hold — which under ADR-047 died as #continuum
 *     covered — is RETARGETED one station down to die at `#practice`
 *     (`useCorridorExitScroll` next-station retarget), and #continuum
 *     gains the fail-opaque shield #about carries, so the mark shows
 *     through the pinned beat;
 *   - every channel is a pure function of the clamped continuum stage
 *     clock, so the beat reverses under scroll and holds byte-stable
 *     between the runways.
 *
 * OFF restores today's passive #continuum byte-visually: the ambient kill
 * stays targeted at #continuum, the hook never engages, the portal stage
 * null-renders, the fail-opaque shield defaults shut, and the static DOM
 * `.crail` slider (7s CSS loop) owns the section. Mobile / reduced-motion /
 * corridor-fallback keep the static crail regardless of the flag
 * (fail-static). The `.continuum__title` restyle to the Services masthead
 * recipe is unconditional (pure CSS, both tiers).
 */
export const CONTINUUM_RAIL_STAGE = true;
