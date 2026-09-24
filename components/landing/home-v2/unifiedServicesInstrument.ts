/* ⚠ `@/lib/cases/registry` is PURE DATA — `lib/cases/**` imports nothing but
   its own types (the confidentiality-envelope law), so components → lib is
   lawful here and the landing's import doctrine is untouched: no three, no
   R3F, no supabase enters this module's graph. The dwell is derived from the
   registry below, which is why the edge exists at all. */
import { CASES } from "@/lib/cases/registry";

import { browseBandVh, browseSegments } from "./services/casefile/browseMap";

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

/* ⚠ `VOIDWALKER_DATUM_STAGE` IS DELETED, NOT FLIPPED (ADR-082 U19,
   2026-08-31). It was a comparison lever and it did its job: the owner read
   both compositions live and kept the datum rails, so the losing drawing —
   `HoloEraPanels`, its `.vwh*` composition rules and its guards — went with
   the boolean rather than surviving as a dead branch (ADR-070 U35's ruling).
   The station's interior is the datum composition unconditionally now. */

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
 *
 * ⚠ **OFF SINCE ADR-096 (2026-09-12, owner): THE PROOF STACK IS THE BEAT.**
 * The owner read the Trinny London pitch page's card pile and asked for it
 * here — "in the proof section on our homepage, we now have different cards,
 * but I want you to use the ones from Trinny London" — so `#services` opens
 * with `SERVICES_PROOF_STACK` below and this surface no longer mounts. Its
 * component tree, its CSS and its guards are all still on disk: the losing
 * drawing goes once the owner has read the new beat live (ADR-070 U35's
 * ruling), not before. ⚠ THE FOUR EVIDENCE PLATES SURVIVE EITHER WAY —
 * `SheetsPlate`, `FilmsPlate`, `ToolField` and `IntelligenceMapPlate` are
 * what the CARDS mount, so `casefile/**` is not dead code and may not be
 * swept as such.
 */
export const SERVICES_PROOF_CASEFILE = false;

/**
 * Feature flag for the SERVICES PROOF STACK (ADR-096, 2026-09-12) — the four
 * Loop projects as a scroll-stacked pile of cards, in the casefile's place at
 * the front of the `#services` runway.
 *
 * The mechanic is ADR-030's sticky-sibling stack and the skin is
 * `proof-stack.css`, both shared verbatim with `/trinny-london` (ADR-094).
 * What differs here is only the SEATING: the pile is absolutely positioned
 * over the front of `.services-stage-root` (`services.css`), so
 * `.services-stage` still pins from the runway's very top and the
 * proof → offer handoff keeps the shape it has today — the masthead and the
 * ring fade up in a frame that never moved.
 *
 * ⚠ THE RUNWAY SPLIT IS UNCHANGED MACHINERY, MEASURED RATHER THAN DECLARED.
 * `useServicesStageScroll` still hands `splitServicesRunway` a proof share
 * and a ring share; it just reads the pile's own height for the first one
 * instead of trusting a literal, because the pile's height is `100svh`-based
 * arithmetic with px terms in it and comes out at 439–447svh across the
 * reference viewports. `SERVICES_PROOF_RUNWAY_VH` below is the
 * PRE-HYDRATION RESERVATION for that measurement, not the measurement.
 */
export const SERVICES_PROOF_STACK = true;

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

/* ── THE DWELL IS DERIVED FROM THE REGISTRY (ADR-087 Phase B) ───────────
   3.2 and 0.625 were LITERALS, and a literal is a promise that `CASES` will
   never grow. It holds exactly one client today, so both numbers were
   really `4 rows × 0.5vh + 1.2vh` and `2.0 / 3.2` written out — and a
   second `CaseDef` would have changed what a browse quarter means while
   both constants sat still.

   The three knobs below are what a dwell is MADE of; the two constants that
   follow are what it COMES TO. At N = 1 they collapse to 2.0 + 1.2 = 3.2
   and 0.625 EXACTLY: 0.5 and 1.2's sum is the nearest double to 3.2 (the
   tie rounds to even, which IS 3.2's representation) and 2 ÷ 3.2 rounds to
   0.625, so nothing about the shipped surface moves by one bit. The unit
   test asserts both with `===`. */

/** One directory row's share of the browse band, in viewport heights. */
export const SERVICES_PROOF_ROW_VH = 0.5;

/**
 * The band BETWEEN two clients — the crossing where one casefile's record is
 * swapped for the next behind a crossfade (`browseMap.ts`). Half a viewport,
 * the same scroll a row costs: a client change is one beat, not a chapter.
 * Charged `N − 1` times, so at N = 1 it costs nothing.
 */
export const SERVICES_PROOF_CLIENT_SEAM_VH = 0.5;

/**
 * The back stretch — the 2026-07-29 handoff, unchanged. `PROOF_OUT` 0.13 →
 * 0.66, `REVEAL_AT`, `REARM_BELOW` and `PROOF_OWNS_BELOW` all ride a releaseP
 * RE-DERIVED over exactly this many viewports, which is what keeps the
 * handoff byte-identical in PIXELS however long the browse band grows.
 * ⚠ **IT IS THE CASEFILE'S NOW (ADR-096 U3).** The STACK's release is not a
 * viewport constant at all — it is the last card's own exit, solved in
 * `useServicesStageScroll` against `PROOF_RELEASE_PARK` so the ring parks as
 * that card's bottom leaves the frame. This still carries the casefile's
 * back stretch (`browseMap`'s arithmetic and `casefile-browse-map.test.ts`
 * both read it), and it is no longer a term of `SERVICES_PROOF_RUNWAY_VH` on
 * the stack path.
 */
export const SERVICES_PROOF_RELEASE_VH = 1.2;

/**
 * The PILE's own scroll, in viewport heights — the front of the proof runway
 * under `SERVICES_PROOF_STACK` (ADR-096), where the casefile's browse band
 * used to be.
 *
 * ⚠ IT IS A RESERVATION, NOT THE GEOMETRY. The stack's height is
 * `proof-stack.css`'s arithmetic — `n × (100svh − pinTop + peek + dwell)`
 * plus the last card and its tail — and the px terms in it (the 64–88px pin,
 * the 52px peek, the 24px safe band) do not scale with the viewport, so the
 * pile comes out around **505svh at 1280×720, 507 at 1440×900 and 493 at
 * 1920×1247** (it was 489/491/483 before ADR-096 U2 lengthened the tail to
 * give the last card its hold). A single literal can only ever be near it,
 * which is why `useServicesStageScroll` READS the pile's box and writes the
 * real number back onto `--svc-proof-runway`. This value is what the page
 * reserves before that first measurement lands (and the fallback if the pile
 * is absent), so it is deliberately the CEILING of the measured range and not
 * its mean: reserving too little would let the ring's domain start inside the
 * pile for one frame.
 *
 * ⚠ **AND SINCE ADR-096 U3 IT IS THE WHOLE SHARE, NOT A TERM OF IT.** The
 * release used to be `+ SERVICES_PROOF_RELEASE_VH` on top of this; it is the
 * last card's own exit now, solved inside the measured share, which ENDS
 * ~70–170px short of the pile's box (the share stops inside the trailing
 * margin the last card has already vacated). So the measured total runs
 * ~482–492svh and this reservation is still the ceiling of it — which is the
 * side to err on.
 */
export const SERVICES_PROOF_PILE_VH = 5.1;

/** One row count per case, in registry order — the segment table's input. */
const PROOF_ROW_COUNTS = CASES.map((c) => c.casefile.tracks.length);

/**
 * The browse band's own map: one band per client sized by ITS row count,
 * one seam between neighbours, normalized onto [0, 1].
 *
 * Exported so the scroll hook, the casefile's spy and the smoke spec all
 * target bands rather than hand-computed fractions. ⚠ At N = 1 it is a
 * single band `[0, 1]` and every consumer degenerates to the ADR-056 U13
 * arithmetic exactly — see `browseMap.ts`.
 */
export const SERVICES_PROOF_SEGMENTS = browseSegments(
  PROOF_ROW_COUNTS,
  SERVICES_PROOF_ROW_VH,
  SERVICES_PROOF_CLIENT_SEAM_VH
);

/** The browse band's length in viewports — Σ rows × ROW_VH + (N−1) × SEAM_VH. */
const PROOF_BROWSE_VH = browseBandVh(
  PROOF_ROW_COUNTS,
  SERVICES_PROOF_ROW_VH,
  SERVICES_PROOF_CLIENT_SEAM_VH
);

/**
 * How many viewports of the `#services` runway the casefile holds before the
 * ring arrives.
 *
 * 3.2 since 2026-08-02 (owner: "scrolling now immediately transitions to
 * the Services Section… make it so that scrolling scrolls through the
 * different cases first"), DERIVED since ADR-087. The dwell is split in two
 * by `SERVICES_PROOF_BROWSE_FRAC`:
 *
 *   · the BROWSE BAND (front 62.5 %, 2.0 viewports) steps the directory
 *     through its rows — scroll IS the row selector there, one
 *     `SERVICES_PROOF_ROW_VH` per row with hysteresis, and a row click pins
 *     the scroll to its band so the two selectors can never fight;
 *   · the RELEASE (back 37.5 %, 1.2 viewports) is the 2026-07-29 handoff
 *     UNCHANGED — the fold's 0.13/0.66, `REVEAL_AT`, `REARM_BELOW` and
 *     `PROOF_OWNS_BELOW` all ride a releaseP RE-DERIVED over this back
 *     stretch, so in pixels the handoff is byte-what-it-was.
 *
 * The round-3 ruling ("runway spent before the handoff opens is dead
 * scroll") still binds — this is not that. 2.8/0.62 bought 1550px where
 * NOTHING happened; here every browse quarter changes the panel, which is
 * choreography, not patience. What would violate the ruling is browse
 * runway beyond the rows' needs — which is precisely what the derivation
 * makes impossible: the band is exactly as long as the rows plus the seams.
 *
 * ⚠ **ON THE STACK PATH IT IS `SERVICES_PROOF_PILE_VH` ALONE (ADR-096 U3).**
 * The release is no longer a viewport constant added on top — it is the last
 * card's exit, solved inside the share against `PROOF_RELEASE_PARK` — so this
 * is a RESERVATION for the whole beat and the tuning knobs below are the
 * casefile's. The hook overwrites it with the measured number on the first
 * frame either way; what this value has to do is exist pre-hydration and be
 * no SMALLER than the measurement.
 *
 * ⚠ **THE TUNING KNOBS ARE `SERVICES_PROOF_ROW_VH`,
 * `SERVICES_PROOF_CLIENT_SEAM_VH` AND `SERVICES_PROOF_RELEASE_VH`** — this
 * is a RESULT now, and assigning to it would be assigning to a measurement.
 * Moving any of the three lengthens the page and moves nothing else: the
 * split re-derives the ring's progress over the remainder, so it can never
 * re-time a card. Read by `services.css` (as the `--svc-proof-runway`
 * default) and by `useServicesStageScroll`; the CSS literal is
 * HAND-WRITTEN — it has to exist pre-hydration — and
 * `tests/lib/services-proof-runway-lockstep.test.ts` is the drift alarm on
 * that pair. ⚠ Changing any knob (or the browse fraction under it) rescales
 * what a `PROOF_OUT_*` fraction means in pixels — re-measure the handoff
 * after.
 */
export const SERVICES_PROOF_RUNWAY_VH = SERVICES_PROOF_STACK
  ? SERVICES_PROOF_PILE_VH
  : SERVICES_PROOF_CASEFILE
    ? PROOF_BROWSE_VH + SERVICES_PROOF_RELEASE_VH
    : 0;

/**
 * Where the browse band ends and the release begins, as a fraction of the
 * proof runway. 0.625 of 3.2 = 2.0 viewports of browse (a half-viewport
 * per directory row) + the release's original 1.2 — so the release's
 * absolute pixel budget is exactly the pre-browse dwell.
 *
 * ⚠ NOT gated on the flag, exactly as the literal was not: it is a DIVISOR
 * in `useServicesStageScroll`, and a 0 there would be a 0/0 the flag-off
 * path never asked for.
 *
 * Consumed by `useServicesStageScroll` (the split), `ServicesCasefile`
 * (the row scrollspy + the click-pins-scroll math) and the smoke spec
 * (band-fraction targeting). One derivation, three readers, zero drift.
 * ⚠ On the STACK path it shapes only the NO-PILE fallback (ADR-096 U3): with
 * a pile the hook derives both fractions from the measured box, and the
 * browse channel itself is inert under it.
 */
export const SERVICES_PROOF_BROWSE_FRAC = SERVICES_PROOF_STACK
  ? SERVICES_PROOF_PILE_VH / (SERVICES_PROOF_PILE_VH + SERVICES_PROOF_RELEASE_VH)
  : PROOF_BROWSE_VH / (PROOF_BROWSE_VH + SERVICES_PROOF_RELEASE_VH);

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

/**
 * The PHONE rung on which the proof stack SPLITS each project into two
 * viewport-fitting panels — the record, then its field — that slide over
 * each other on the ADR-030 mechanic (ADR-107).
 *
 * ⚠ IT IS THE EXACT COMPLEMENT OF THE TWO INERT TERMS `proof-stack.css` KEEPS.
 * The inert rung is `(max-width: 960px), (max-height: 680px),
 * (prefers-reduced-motion: reduce)`; this string takes the first term back
 * and leaves the other two — a short window and a reduced-motion reader
 * still get the four cards in flow. Two readers: `ServicesStage` (which
 * markup to render — one slot per card or two) and the split block in
 * `proof-stack.css` (whether those slots stick). They must answer the same
 * question, so `tests/lib/proof-stack-split-gate.test.ts` pins the sheet's
 * literal to this one.
 *
 * ⚠ `useMediaQuery`'s SERVER SNAPSHOT IS `false`, so the server always renders
 * the whole-card tree and a phone swaps to panels after hydration; the pile is
 * eight viewports below the fold, so the swap is never on screen.
 */
export const PROOF_STACK_SPLIT_MEDIA =
  "(max-width: 960px) and (min-height: 681px) and (prefers-reduced-motion: no-preference)";

/**
 * Feature flag for THE RING ON PHONES (ADR-108).
 *
 * Owner, 2026-09-16: _"In the services section on desktop, we have these
 * cards rotating around our brand mark particle system. I also want the same
 * thing on mobile, but we have to make sure that the mobile site's
 * performance can handle it."_ The desktop ring — the four cards orbiting
 * the parked mark inside the corridor canvas — mounts on the phone rung too,
 * with a phone PROFILE (half-size bakes, no drawer, no portrait back, no
 * hover) and its own seat: a sticky band between the masthead and the plate
 * accordion whose scroll is the ring's clock. The ring is the VISUAL; the
 * plates stay the readable offer, and a tap on a card scrolls to its plate.
 *
 * ⚠ OFF ⇒ TODAY'S PHONE PAGE, BYTE-IDENTICAL: no dock, no ambient hold, no
 * band, the accordion alone. It is a flag because the acceptance gate is a
 * frame-rate the owner reads on his own device, not a number this tree can
 * measure — a fail there ships the flag off and nothing else moves.
 */
export const SERVICES_CARD_RING_MOBILE = true;

/**
 * The phone rung on which the ring mounts (ADR-108) — ONE string, THREE
 * readers, and they must never drift (ADR-029's own guardrail, one rung
 * down): `CorridorArmillary` (whether the ring mounts in the canvas),
 * `ServicesStage` (whether the seat band and the hit layer render) and
 * `useCorridorExitScroll` (whether the corridor's ambient hold survives into
 * `#services` on a phone at all — without it there is no canvas behind the
 * station to draw into). The same rung the proof stack splits on, so both
 * phone beats stand or fall on one query; `services-ring-mobile-gate.test.ts`
 * pins the three readers and the equality.
 */
export const SERVICES_RING_MOBILE_MEDIA = PROOF_STACK_SPLIT_MEDIA;

/**
 * Feature flag for THE PHONE'S DECK FLIP (ADR-115).
 *
 * Owner, 2026-09-20: _"When you scroll past the 'AI capability your team
 * owns' section, all the text should disappear with a glitch effect. The
 * cards should then stack on top of each other, rotate them as we have on
 * desktop, and then reveal my profile picture."_ On the ring rung the
 * services band's copy UN-TYPES over the band's exit while the four cards
 * STACK (ADR-047's own exit beat, entered on the phone for the first time),
 * `#about` becomes a sticky band welded to the services band's release, the
 * deck FLIPS to the portrait on the about clock, the name and the first
 * paragraph decode in, and a chevron discloses the rest of the bio.
 *
 * ⚠ OFF ⇒ ADR-110's PHONE PAGE, BYTE-IDENTICAL: the ring's clock caps below
 * the exit beat and the cards fade with their band; `#about` keeps its
 * static layout (minus the orbit cluster, which the owner retired
 * unconditionally). Read by `useServicesStageScroll` (the clock),
 * `CorridorArmillary` (the ring's `deckFlip` prop), `ServicesMasthead` (the
 * un-type) and `AboutStage` (whether the band mounts). It is a flag because
 * the acceptance gate is his device.
 */
export const SERVICES_ABOUT_DECK_MOBILE = true;

/**
 * Feature flag for THE ERA INSTRUMENT PINNED ON THE PHONE (ADR-123).
 *
 * Owner, 2026-09-24: _"In the Voidwalker section, when I enter it, the
 * components or just that section scroll weirdly. It's not locking into
 * place … Once you hit a section, the section inside it, with all the
 * components, should not be able to move as awkwardly as it does now."_
 * `#services` and `#about` lock in because each is a PINNED band whose scroll
 * only advances a clock; `.vwd` was the journey's one unpinned stop — a
 * one-screen box in flow, held only by the proximity snap after the finger
 * lifts. On the ≤700 rung the station becomes a runway (`100svh +
 * --vw-phone-dwell`), `.vwd` pins inside it, and the five eras ride the dwell
 * — the desktop's own ADR-082 U10 law, one rung down. A tap still glides the
 * scroll to its era. This reverses ADR-113 §1's "no sticky runway" on his word.
 *
 * ⚠ OFF ⇒ ADR-113's PHONE PAGE, BYTE-IDENTICAL: the station keeps its
 * padding, `.vwd` flows and is the snap seat, taps alone select. Read by
 * `useVoidwalkerHologramScroll` (the phone branch and its `data-vw-phone`
 * stamp), `VoidwalkerHologram` (the tap's glide and the poster warm) and,
 * through the stamp, `voidwalker.css`. `tests/lib/voidwalker-phone-runway.test.ts`
 * pins the media string to the sheet's block.
 */
export const VOIDWALKER_PHONE_RUNWAY = true;

/**
 * The rung the era instrument pins on: the instrument's own one-screen rung
 * (`voidwalker-datum.css`'s ≤700 block — `.vwd` is `100svh` there and
 * content-height above it), with the ring rung's height floor and motion
 * gate. ONE string, read by the hook and pinned to the sheet's `@media`.
 */
export const VOIDWALKER_PHONE_RUNWAY_MEDIA =
  "(max-width: 700px) and (min-height: 681px) and (prefers-reduced-motion: no-preference)";
