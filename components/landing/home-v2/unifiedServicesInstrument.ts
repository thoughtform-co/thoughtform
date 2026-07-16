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
 * Feature flag for the SERVICES CARTRIDGE DOCK (ADR-046, 2026-07-16).
 *
 * When ON (and SERVICES_CARD_RING is on, same media gate):
 *   - across the runway's final (decommission) beat the four WebGL ring
 *     cards no longer fly out radially and fade (the ADR-030 exit): each
 *     card EJECTS off its orbit, flattens to face the camera, shrinks, and
 *     travels to the bottom-right DOM console (`ServicesCartridgeDock`,
 *     mounted at HUD level in LandingPage), where a DOM cartridge
 *     crossfades in AT THE SEAT — the card itself miniaturizes; the DOM
 *     never flies (ADR-031's rule stands for DOM chrome);
 *   - the seated rack persists for the rest of the page (seated state is a
 *     pure function of runway progress, which clamps at 1 below the
 *     runway — no latch, no release guard) and each cartridge is a real
 *     button that glides the page back to that service's beat
 *     (`servicesBeatScrollTarget` + `startRingScrollTween`);
 *   - hit-rect anchors retire at exit ≥ DOCK_ANCHORS_OFF_EXIT and the
 *     pointer-look damps out across the exit so the seat targeting holds.
 *
 * OFF restores the ADR-030 radial fade-out exit byte-identically (the ring
 * branch never runs, the dock never mounts). Mobile / reduced-motion /
 * corridor-fallback never see the dock regardless of the flag.
 */
export const SERVICES_CARTRIDGE_DOCK = true;
