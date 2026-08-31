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
 * Feature flag for the VOIDWALKER TIME TUNNEL (ADR-081, 2026-08-25).
 *
 * ON, the career through-line stops being a vertical scroll and becomes a
 * flight down the Z axis: past `#about` the camera falls into the
 * brandmark parked at the end of the corridor, a wormhole opens, and the
 * nine beats fly at the reader newest-first while the years count
 * backwards on a graduated axis (the ADR-078 "a record plots, it does not
 * list" argument, one surface later).
 *
 * What the flag gates, and only this:
 *   - `VoidwalkerStation`'s travel branch — the runway/stage wrapper is
 *     rendered either way but is `display: contents` (inert) until the
 *     hook writes `data-vw-mode="travel"`, so the 2D tree is ONE tree in
 *     two presentation modes rather than two trees;
 *   - contributes to `VOIDWALKER_EXTENDS_CORRIDOR`, the shared
 *     next-station retarget for any transparent Voidwalker presentation;
 *   - the `VoidwalkerTimeTunnel` painter's mount inside the corridor
 *     canvas (no second WebGL context — the ambient hold is already a
 *     fixed full-viewport backdrop at this point in the page).
 *
 * ⚠ CSS never reads this flag. Every travel rule keys on
 * `data-vw-mode="travel"`, which only `useVoidwalkerTravelScroll` writes
 * and which every disengage path removes — so flag-off, mobile,
 * reduced-motion, corridor-fallback and a JS failure all land on the
 * ADR-074 vertical timeline, fully lit at rest, with no tall dead runway.
 */
export const VOIDWALKER_TIME_TUNNEL = true;

/**
 * ⚠ `VOIDWALKER_CHARACTER_STAGE` (ADR-082) IS DELETED, NOT FLIPPED
 * (2026-08-26, owner). The character stage it gated — a rotating Meshy
 * model per era, with the About portrait flying through a portal into
 * it — is removed from the tree along with that portal. The owner pinned
 * the 3D route after reading the meshes ("the limitations of Meshy") and
 * rejected the transition outright; the replacement is the production
 * HOLOGRAM composition graduated from `/test/voidwalker-holo-lab`.
 *
 * A flag left standing at `false` would have implied the stage is one
 * boolean from returning. It is not — its components, its CSS sheet, its
 * scroll clock, its ref buses and its lab are gone.
 *
 * What survives, deliberately: the era registry (`characterEras.ts`) and
 * `public/models/voidwalker/thoughtform.glb`, because the hologram reuses
 * the first and the second cost real credits to make.
 */

/**
 * Production flag for the pinned hologram presentation (ADR-082 U2).
 * The hook still capability-gates the mode to wide, motion-allowed,
 * non-fallback corridor sessions; every other path is a finished static
 * composition with no sticky runway.
 */
export const VOIDWALKER_HOLOGRAM_STAGE = true;

/**
 * The D2 "DATUM RAILS" composition (owner's wave-2 pick, 2026-08-31).
 *
 * ⚠ A COMPARISON LEVER, NOT A SEAM. ADR-070 U35's ruling: a flag lives only
 * until the owner has read both live, and then the losing drawing and its
 * guards GO. This one switches the station's INTERIOR composition — the
 * panels, the rails, where the era selector sits — and nothing else. The
 * figure, its masked floor, the station shell, the scroll clock, the entry
 * and exit choreography and the About handoff contract are shared by both
 * and are untouched by the boolean.
 *
 * ON:  four unboxed panels whose heads ride two full-width construction
 *      rails, a ground datum off the projector disc, and the five eras as a
 *      chip band at the FOOT (ADR-082 U9's left-rail scrubber is not
 *      rendered — the gutter is left empty rather than refilled).
 * OFF: ADR-082 U11's two mirrored side columns with fixed seats, and the
 *      vertical scrubber in the HUD gutter.
 */
export const VOIDWALKER_DATUM_STAGE = true;

/**
 * The corridor ambient must survive any transparent Voidwalker stage and
 * terminate under `#practice`. Keeping that cover decision separate from a
 * specific presentation prevents a retired-but-retained feature flag from
 * accidentally owning production compositing.
 */
export const VOIDWALKER_EXTENDS_CORRIDOR = VOIDWALKER_TIME_TUNNEL || VOIDWALKER_HOLOGRAM_STAGE;

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
 *   - two new channels, `--svc-proof-in` (arrival, off the corridor
 *     dissipate — the curve `--svc-content-in` used to own) and
 *     `--svc-proof-out` (departure, off the casefile's own runway share),
 *     hosted on the casefile's own `.fl-case` root since the 2026-07-29
 *     perf pass (ADR-056 U4 — stage-hosted writes invalidated the whole
 *     stage subtree per frame; `data-proof-live` stays on the stage);
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
 * Feature flag for the SUBSTRATE BACKPLANE.
 *
 * ⚠ **OFF SINCE 2026-08-28 U2** (owner: "for the substrates, I don't really
 * like it. Let's restore the old pie chart. I think that was the clearest
 * one"). The pass-one backplane (rectilinear bays around a central card) is
 * retired from production; the compound carrier (ADR-070 U33 · ADR-071's
 * skill-chip morph) is the live reading 03 again. `PdaBackplane.tsx` and
 * its arithmetic remain on disk unreferenced pending a decision on whether
 * to delete or keep for reference.
 *
 * When ON, the map's reading 03 renders `ViewBackplane` instead of
 * `ViewCarrier`: five substrate BAYS around a central card, in the same
 * rectilinear PCB grammar as reading 02, with ribbons where the selected
 * work TAPS a bay.
 *
 * ⚠ THE ADR-071 SKILL-CHIP MORPH IS ONLY WIRED FOR THE CARRIER PATH.
 * Flipping this ON would also require re-implementing `skillRectFor` for
 * the backplane's bay geometry — see `PdaConsole.tsx`.
 */
export const MAP_BACKPLANE = false;

/**
 * How many viewports of the `#services` runway the casefile holds before the
 * ring arrives.
 *
 * 3.2 since 2026-08-02 (owner: "scrolling now immediately transitions to
 * the Services Section… make it so that scrolling scrolls through the
 * different cases first"). The dwell is split in two by
 * `SERVICES_PROOF_BROWSE_FRAC`:
 *
 *   · the BROWSE BAND (front 62.5 %, 2.0 viewports) steps the directory
 *     through its rows — scroll IS the row selector there, quarter-band per
 *     row with hysteresis, and a row click pins the scroll to its band so
 *     the two selectors can never fight;
 *   · the RELEASE (back 37.5 %, 1.2 viewports) is the 2026-07-29 handoff
 *     UNCHANGED — the fold's 0.13/0.66, `REVEAL_AT`, `REARM_BELOW` and
 *     `PROOF_OWNS_BELOW` all ride a releaseP RE-DERIVED over this back
 *     stretch, so in pixels the handoff is byte-what-it-was.
 *
 * The round-3 ruling ("runway spent before the handoff opens is dead
 * scroll") still binds — this is not that. 2.8/0.62 bought 1550px where
 * NOTHING happened; here every browse quarter changes the panel, which is
 * choreography, not patience. What would violate the ruling is browse
 * runway beyond the rows' needs.
 *
 * This is the ONLY tuning knob for the dwell's length. It lengthens the page
 * and moves nothing else: the split re-derives the ring's progress over the
 * remainder, so changing it can never re-time a card. Read by `services.css`
 * (as the `--svc-proof-runway` default) and by `useServicesStageScroll`; keep
 * the two in step — the CSS owns the runway's height, this constant owns the
 * split. ⚠ Changing it (or the browse fraction) rescales what a
 * `PROOF_OUT_*` fraction means in pixels — re-measure the handoff after.
 */
export const SERVICES_PROOF_RUNWAY_VH = SERVICES_PROOF_CASEFILE ? 3.2 : 0;

/**
 * Where the browse band ends and the release begins, as a fraction of the
 * proof runway. 0.625 of 3.2 = 2.0 viewports of browse (a half-viewport
 * per directory row) + the release's original 1.2 — so the release's
 * absolute pixel budget is exactly the pre-browse dwell.
 *
 * Consumed by `useServicesStageScroll` (the split), `ServicesCasefile`
 * (the row scrollspy + the click-pins-scroll math) and the smoke spec
 * (band-fraction targeting). One constant, three readers, zero drift.
 */
export const SERVICES_PROOF_BROWSE_FRAC = 0.625;

/**
 * The only tier in which SCROLL OWNS THIS BEAT — the stage is pinned, the
 * browse band selects the directory row, and the casefile's own instruments
 * may take the wheel off the page.
 *
 * Below it (`isInert` in `useServicesStageScroll`) the casefile is static
 * flow content: there is no browse channel, and anything that swallowed a
 * wheel event there would be breaking ordinary page scrolling over ordinary
 * DOM. Two readers hold that gate — `ServicesCasefile`'s row scrollspy and
 * the map console's wheel reader (ADR-063) — and they must answer the same
 * question, so they read the same string. Re-read it INSIDE long-lived
 * listeners: a desktop→mobile resize must not let a stale tier apply.
 */
export const SERVICES_SCROLL_OWNED_MEDIA =
  "(min-width: 961px) and (prefers-reduced-motion: no-preference)";
