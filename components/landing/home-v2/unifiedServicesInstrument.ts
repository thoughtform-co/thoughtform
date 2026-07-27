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
 * Feature flag for the ADR-050 CARD FACE + IN-CANVAS DRAWER (2026-07-26 —
 * the `v2` lab variant promoted; presumes SERVICES_CARD_RING, same media gate).
 *
 * One flag carries BOTH halves of the promotion, because neither half is
 * coherent alone: the tight face bakes an `OPEN →` chit unconditionally, so
 * shipping it without the drawer paints an affordance that leads nowhere —
 * while also dropping the full face's CTA slab, which is the only conversion
 * control on the ring today.
 *
 * When ON:
 *   - the card faces bake the `tight` stack — chip + title (40px) + lede
 *     (30px) + the `OPEN` chit — instead of the ADR-029 `full` stack. The
 *     includes/meta row and the full-width CTA slab are gone; the hierarchy
 *     inverts back so the title reads before the lede;
 *   - each card gains a DRAWER: a card-sized slab sharing the card's own
 *     geometry that slides out along card-local +x when that service is
 *     opened via `openPlateRef`. It lives in card-local space, so it inherits
 *     the rig, the facing yaw, the pointer-look and the bounded sway — the
 *     pair is ONE entity by construction, not by synchronisation;
 *   - the front card's hit target becomes a full-rect open button, and the
 *     drawer's baked CTA / close chit / spec copy are shimmed by
 *     `ServicesRingHitAreas` off the second published rect
 *     (`RingCardAnchor.drawer`);
 *   - `ServicesStage` owns the open state and is the single writer of
 *     `openPlateRef`; Escape and a runway-scroll delta both dismiss.
 *
 * Drawer faces bake LAZILY — on the first open request, not at mount — so the
 * ~18 MB of drawer texture is never paid by the majority of visitors who
 * never open a card (owner's call, 2026-07-26). The open level is gated on
 * the bake landing, so a drawer can never slide out blank.
 *
 * OFF restores the ADR-029 full face byte-identically: no drawer children
 * exist, no drawer bake is ever fetched, the frame loop's drawer work is
 * skipped, and the front card keeps its `<a href="#contact">` CTA shim.
 * Mobile / reduced motion keep the plate accordion regardless of the flag.
 */
export const SERVICES_CARD_DRAWER = true;

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
