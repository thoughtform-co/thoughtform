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

/**
 * Feature flag for the SERVICES PROOF CASEFILE (ADR-056, 2026-07-28 —
 * supersedes ADR-054 on PLACEMENT; its content model and confidentiality
 * envelope survive unchanged).
 *
 * The corridor's epilogue makes a claim ("EVERYONE IS RACING TO BUILD THIS
 * CAPABILITY.") and used to hand straight to the offer. The evidence for it —
 * the Loop Earplugs casefile — now sits at the TOP of `#services`, over the
 * parked brandmark, and the card ring waits until it has been scrolled past.
 *
 * When ON:
 *   - the `#services` runway grows by `SERVICES_PROOF_RUNWAY_VH` viewports at
 *     its FRONT, and `useServicesStageScroll` splits its rect read with
 *     `splitServicesRunway` so the ring's progress domain is unchanged —
 *     `RING_ARRIVAL_FRAC`, `RING_EXIT_START` and the ADR-047 `#about` deck
 *     seam all stay byte-identical;
 *   - two new stage channels, `--svc-proof-in` (arrival, off the corridor
 *     dissipate — the curve `--svc-content-in` used to own) and
 *     `--svc-proof-out` (departure, off the casefile's own runway share);
 *   - `--svc-content-in` is multiplied by the release ramp, which delays the
 *     masthead, the plate cluster, the designations, the orbit draw-on and the
 *     scan interface together, with no new consumer and no new listener;
 *   - the same release multiplies the ring's and the orbits' master opacity,
 *     so the cards neither paint nor publish hit anchors over the casefile.
 *
 * OFF restores the services stage byte-identically: the runway returns to
 * 500svh, `splitServicesRunway` degenerates to the identity, `proofRelease`
 * rests at 1 and the casefile never mounts. ⚠ It does NOT restore the `#proof`
 * STATION — that removal lives in `CORRIDOR_REPLACED_STATIONS`
 * (`app/(marketing)/page.tsx`) and is a separate one-line revert. Two
 * switches, deliberately: the station's death is a funnel decision, this flag
 * is a surface decision.
 *
 * Mobile / reduced motion keep the plate accordion regardless; there the
 * casefile renders as resolved static flow content above it.
 */
export const SERVICES_PROOF_CASEFILE = true;

/**
 * How many viewports of the `#services` runway the casefile holds before the
 * ring arrives.
 *
 * 2.4, not 2: the arrival waits on runway travel so the epilogue's claim has
 * left before the evidence lands (see `PROOF_IN_*` in
 * `useServicesStageScroll`), and that delay has to come from somewhere. At
 * 2.4 the full-opacity reading window is still ~1.1 viewports — enough scroll
 * to read the brief and click a few directory rows while the stage is pinned.
 *
 * This is the ONLY tuning knob for the dwell. It lengthens the page and moves
 * nothing else: the split re-derives the ring's progress over the remainder,
 * so widening it can never re-time a card. Read by `services.css` (as the
 * `--svc-proof-runway` default) and by `useServicesStageScroll`; keep the two
 * in step — the CSS owns the runway's height, this constant owns the split.
 */
export const SERVICES_PROOF_RUNWAY_VH = SERVICES_PROOF_CASEFILE ? 2.4 : 0;
